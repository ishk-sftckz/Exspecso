import { fork, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { link, mkdir, readFile, readdir, realpath, rename, rm, symlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { PassThrough, Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { sha256 } from "../../src/adapters/managed-file.js";
import { buildInitPlan } from "../../src/init/plan.js";
import { assertSafeTransactionPaths } from "../../src/filesystem/safe-path.js";
import { commitTransaction, readTransactionJournal, stagingRelativePath, type CommitTransactionOptions, type PromotionFaultPoint } from "../../src/filesystem/transaction.js";
import { recoverInterruptedTransaction } from "../../src/filesystem/recovery.js";
import { acquireInitOwnership, lockRelativePath, releaseInitOwnership } from "../../src/filesystem/ownership.js";
import { openContainedFilesystem } from "../../src/filesystem/contained-fs.js";
import { runInit } from "../../src/init/run-init.js";
import { createGitFixture, type GitFixture } from "../helpers/git-fixture.js";

const fixtures: GitFixture[] = [];
const packageRoot = resolve(import.meta.dirname, "../..");

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
});

async function useFixture(): Promise<GitFixture> {
  const fixture = await createGitFixture();
  fixtures.push(fixture);
  return fixture;
}

async function snapshotTree(path: string, prefix = ""): Promise<readonly string[]> {
  const entries = await readdir(path, { withFileTypes: true });
  const snapshots = await Promise.all(entries.sort((left, right) => left.name.localeCompare(right.name)).map(async (entry) => {
    const relativePath = join(prefix, entry.name);
    if (entry.isDirectory()) return snapshotTree(join(path, entry.name), relativePath);
    return [`${relativePath}:${await readFile(join(path, entry.name), "utf8")}`];
  }));
  return snapshots.flat();
}

function output(): { stream: Writable; read: () => string } {
  let value = "";
  return {
    stream: new Writable({ write(chunk, _encoding, callback) { value += chunk.toString(); callback(); } }),
    read: () => value,
  };
}

async function waitForChildExit(child: ReturnType<typeof spawn>): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolveExit, rejectExit) => {
    child.once("error", rejectExit);
    child.once("exit", (code, signal) => resolveExit({ code, signal }));
  });
}

async function waitForChildMessage(child: ReturnType<typeof fork>): Promise<{ point: string; pid: number }> {
  return new Promise((resolveMessage, rejectMessage) => {
    const timeout = setTimeout(() => rejectMessage(new Error("timed out waiting for killed-process IPC")), 5_000);
    child.once("error", rejectMessage);
    child.once("message", (message) => {
      clearTimeout(timeout);
      if (typeof message !== "object" || message === null || typeof message.point !== "string" || typeof message.pid !== "number") {
        rejectMessage(new Error("killed-process IPC message is malformed"));
        return;
      }
      resolveMessage(message);
    });
  });
}

async function killAtPromotion(root: string, point: PromotionFaultPoint): Promise<void> {
  const child = fork(join(packageRoot, "tests", "helpers", "killed-transaction-child.mjs"), ["transaction-promotion", root, point], {
    execArgv: [],
    stdio: ["ignore", "ignore", "ignore", "ipc"],
  });
  const exited = waitForChildExit(child);
  try {
    const recorded = await waitForChildMessage(child);
    expect(recorded.pid).toBe(child.pid);
  expect(recorded.point).toBe(point);
    child.kill("SIGKILL");
    await expect(exited).resolves.toEqual({ code: null, signal: "SIGKILL" });
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
      await exited;
    }
  }
}

async function writeOwnershipRecord(root: string, container: string, pid: number, token = randomUUID()): Promise<string> {
  await mkdir(container, { recursive: true });
  await writeFile(join(container, `owner-${token}.json`), `${JSON.stringify({
    schemaVersion: 1,
    pid,
    token,
    rootFingerprint: sha256(await realpath(root)),
  })}\n`, "utf8");
  return token;
}

async function writeDeadOwnershipRecord(root: string): Promise<void> {
  await writeOwnershipRecord(root, join(root, lockRelativePath), 2_147_000_000);
}

async function killAfterOwnershipPublication(root: string): Promise<void> {
  const child = fork(join(packageRoot, "tests", "helpers", "killed-transaction-child.mjs"), ["ownership-publication", root], {
    execArgv: [],
    stdio: ["ignore", "ignore", "ignore", "ipc"],
  });
  const exited = waitForChildExit(child);
  try {
    const recorded = await waitForChildMessage(child);
    expect(recorded.point).toBe("after-ownership-publication");
    expect(recorded.pid).toBe(child.pid);
    child.kill("SIGKILL");
    await expect(exited).resolves.toEqual({ code: null, signal: "SIGKILL" });
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
      await exited;
    }
  }
}

describe("journaled init transaction", () => {
  it("ownership capabilities publish exclusively inside the originally held operational directory", async () => {
    const fixture = await useFixture();
    const outside = await useFixture();
    const filesystem = openContainedFilesystem(fixture.root);
    try {
      const operational = filesystem.root.createDirectory(".exspecso");
      await rename(join(fixture.root, ".exspecso"), join(fixture.root, "held-operational"));
      await symlink(outside.root, join(fixture.root, ".exspecso"), "dir");

      const candidate = operational.createDirectory(".init.lock.candidate-test");
      const owner = candidate.createFile("owner-test.json");
      owner.write(Buffer.from("owned"));
      owner.sync();
      owner.close();
      operational.publishDirectory(candidate, ".init.lock");

      expect(await readFile(join(fixture.root, "held-operational", ".init.lock", "owner-test.json"), "utf8")).toBe("owned");
      await expect(readFile(join(outside.root, ".init.lock", "owner-test.json"), "utf8")).rejects.toThrow();
      expect(() => operational.createDirectory(".init.lock")).toThrow(/EXSPECSO_CONTAINMENT/);
    } finally {
      filesystem.close();
    }
  });

  it("staging keeps bytes under the held operational directory after its pathname is substituted", async () => {
    const fixture = await useFixture();
    const outside = await useFixture();
    const plan = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: ["codex"] });
    let reached = false;
    const options = {
      onBeforeStaging: async () => {
        reached = true;
        await rename(join(fixture.root, ".exspecso"), join(fixture.root, "held-operational"));
        await symlink(outside.root, join(fixture.root, ".exspecso"), "dir");
      },
    } as CommitTransactionOptions & { readonly onBeforeStaging: () => Promise<void> };

    await expect(commitTransaction(plan, options)).resolves.toMatchObject({ kind: "failed" });
    expect(reached).toBe(true);
    await expect(readdir(outside.root)).resolves.toEqual([".git"]);
    await expect(readdir(join(fixture.root, "held-operational", ".staging"))).resolves.toHaveLength(1);
  });

  it("rejects traversal, external targets, symlinked ancestors, and stale preimages before staging", async () => {
    const fixture = await useFixture();
    const outside = join(fixture.root, "..", `outside-${Date.now()}.txt`);
    const traversal = {
      target: outside,
      relativePath: "../outside.txt",
      content: "nope",
      expectedExists: false,
    };
    await expect(assertSafeTransactionPaths(fixture.root, [traversal])).rejects.toThrow("UNSAFE_TARGET");

    const plan = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: ["codex"] });
    await mkdir(join(fixture.root, "outside"));
    await symlink(join(fixture.root, "outside"), join(fixture.root, ".agents"));
    await expect(commitTransaction(plan)).resolves.toMatchObject({ kind: "failed" });
    await expect(readdir(fixture.root)).resolves.not.toContain(".exspecso");

    await rm(join(fixture.root, ".agents"));
    const stalePlan = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: ["codex"] });
    await mkdir(join(fixture.root, ".exspecso"), { recursive: true });
    await writeFile(join(fixture.root, ".exspecso", "exspecso.config.json"), "{}", "utf8");
    await expect(commitTransaction(stalePlan)).resolves.toMatchObject({ kind: "failed" });
  });

  it("treats an empty plan as a true no-op without operational debris", async () => {
    const fixture = await useFixture();
    await expect(commitTransaction({ repositoryRoot: fixture.root, writes: [] })).resolves.toEqual({ kind: "no-op" });
    await expect(readdir(fixture.root)).resolves.toEqual([".git"]);
  });

  it("recovers an identified empty transaction directory after a preimage changes before staging", async () => {
    const fixture = await useFixture();
    const target = join(fixture.root, "artifact.txt");
    await writeFile(target, "prior", "utf8");
    const plan = {
      repositoryRoot: fixture.root,
      writes: [{ target, relativePath: "artifact.txt", content: "replacement", expectedExists: true, expectedPreimageHash: sha256("prior") }],
    };

    await expect(commitTransaction(plan, {
      onBeforeStaging: async () => { await writeFile(target, "changed", "utf8"); },
    })).resolves.toMatchObject({ kind: "failed" });
    await writeFile(target, "prior", "utf8");

    await expect(recoverInterruptedTransaction(fixture.root)).resolves.toMatchObject({ kind: "recovered", disposition: "restored-prior" });
    await expect(readFile(target, "utf8")).resolves.toBe("prior");
    await expect(readdir(join(fixture.root, ".exspecso"))).rejects.toThrow();
  });

  it("recovers an empty preparation directory after a later target parent blocks staging", async () => {
    const fixture = await useFixture();
    const first = join(fixture.root, "first.txt");
    const parent = join(fixture.root, "nested");
    const second = join(parent, "second.txt");
    const sentinel = join(fixture.root, "external-sentinel.txt");
    await mkdir(parent);
    await Promise.all([
      writeFile(first, "first prior", "utf8"),
      writeFile(second, "second prior", "utf8"),
      writeFile(sentinel, "preserve", "utf8"),
    ]);
    const plan = {
      repositoryRoot: fixture.root,
      writes: [
        { target: first, relativePath: "first.txt", content: "first replacement", expectedExists: true, expectedPreimageHash: sha256("first prior") },
        { target: second, relativePath: "nested/second.txt", content: "second replacement", expectedExists: true, expectedPreimageHash: sha256("second prior") },
      ],
    };

    await expect(commitTransaction(plan, {
      onBeforeStaging: async () => {
        await rm(parent, { recursive: true });
        await writeFile(parent, "not a directory", "utf8");
      },
    })).resolves.toMatchObject({ kind: "failed" });
    await rm(parent);
    await mkdir(parent);
    await writeFile(second, "second prior", "utf8");

    await expect(recoverInterruptedTransaction(fixture.root)).resolves.toMatchObject({ kind: "recovered", disposition: "restored-prior" });
    await expect(readFile(first, "utf8")).resolves.toBe("first prior");
    await expect(readFile(second, "utf8")).resolves.toBe("second prior");
    await expect(readFile(sentinel, "utf8")).resolves.toBe("preserve");
    await expect(readdir(join(fixture.root, ".exspecso"))).rejects.toThrow();
  });

  it("preserves unknown evidence beside a preparation journal as ambiguous", async () => {
    const fixture = await useFixture();
    const transactionId = randomUUID();
    const stage = join(fixture.root, stagingRelativePath, transactionId);
    const sentinel = join(fixture.root, "external-sentinel.txt");
    await mkdir(stage, { recursive: true });
    await writeFile(sentinel, "preserve", "utf8");
    const journal = {
      schemaVersion: 2,
      transactionId,
      repositoryRootFingerprint: sha256(resolve(fixture.root)),
      entries: [{ relativePath: "artifact.txt", preimageHash: null, stagedHash: sha256("replacement"), backupPath: null, backupHash: null }],
      promotionOrder: ["artifact.txt"],
      state: "preparing",
      inFlight: null,
      completedPromotions: [],
      completedStep: -1,
    };
    await writeFile(join(stage, "journal.json"), `${JSON.stringify(journal)}\n`, "utf8");
    await writeFile(join(stage, "unknown-evidence"), "preserve", "utf8");

    await expect(recoverInterruptedTransaction(fixture.root)).resolves.toMatchObject({ kind: "ambiguous" });
    await expect(readFile(join(stage, "unknown-evidence"), "utf8")).resolves.toBe("preserve");
    await expect(readFile(sentinel, "utf8")).resolves.toBe("preserve");
  });

  it("cleans a hash-validated partial preparing journal without rewriting prior targets", async () => {
    const fixture = await useFixture();
    const transactionId = randomUUID();
    const stage = join(fixture.root, stagingRelativePath, transactionId);
    const first = join(fixture.root, "first.txt");
    const second = join(fixture.root, "second.txt");
    await Promise.all([writeFile(first, "first prior", "utf8"), writeFile(second, "second prior", "utf8")]);
    await mkdir(join(stage, "files"), { recursive: true });
    await mkdir(join(stage, "backups"), { recursive: true });
    await writeFile(join(stage, "files", "first.txt"), "first replacement", "utf8");
    await writeFile(join(stage, "backups", "first.txt"), "first prior", "utf8");
    const journal = {
      schemaVersion: 2,
      transactionId,
      repositoryRootFingerprint: sha256(resolve(fixture.root)),
      entries: [
        { relativePath: "first.txt", preimageHash: sha256("first prior"), stagedHash: sha256("first replacement"), backupPath: "backups/first.txt", backupHash: sha256("first prior") },
        { relativePath: "second.txt", preimageHash: sha256("second prior"), stagedHash: sha256("second replacement"), backupPath: "backups/second.txt", backupHash: sha256("second prior") },
      ],
      promotionOrder: ["first.txt", "second.txt"],
      state: "preparing",
      inFlight: null,
      completedPromotions: [],
      completedStep: -1,
    };
    await writeFile(join(stage, "journal.json"), `${JSON.stringify(journal)}\n`, "utf8");

    await expect(recoverInterruptedTransaction(fixture.root)).resolves.toMatchObject({ kind: "recovered", disposition: "restored-prior" });
    await expect(readFile(first, "utf8")).resolves.toBe("first prior");
    await expect(readFile(second, "utf8")).resolves.toBe("second prior");
    await expect(readdir(join(fixture.root, ".exspecso"))).rejects.toThrow();
  });

  it("excludes a second writer while the first has a prepared journal", async () => {
    const fixture = await useFixture();
    const firstPlan = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: ["codex"] });
    const secondPlan = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: ["codex"] });
    let release: (() => void) | undefined;
    const ready = new Promise<void>((resolve) => { release = resolve; });
    let entered: (() => void) | undefined;
    const enteredReady = new Promise<void>((resolve) => { entered = resolve; });
    const first = commitTransaction(firstPlan, { onReadyToPromote: async () => { entered?.(); await ready; } });
    await enteredReady;
    await expect(commitTransaction(secondPlan)).resolves.toEqual({ kind: "busy" });
    const stdout = output();
    const stderr = output();
    await expect(runInit({ selectedAgents: ["codex"], cwd: fixture.root, stdin: new PassThrough(), stdout: stdout.stream, stderr: stderr.stream })).resolves.toBe(1);
    expect(stderr.read()).toContain("EXSPECSO_INIT_TRANSACTION_BUSY");
    release?.();
    await expect(first).resolves.toMatchObject({ kind: "committed" });
  });

  it("ownership race: direct recovery leaves a live writer's evidence byte-identical", async () => {
    const fixture = await useFixture();
    const plan = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: ["codex"] });
    let releaseWriter: (() => void) | undefined;
    const writerReady = new Promise<void>((resolveWriter) => { releaseWriter = resolveWriter; });
    let writerEntered: (() => void) | undefined;
    const writerEnteredReady = new Promise<void>((resolveWriter) => { writerEntered = resolveWriter; });
    const writer = commitTransaction(plan, { onReadyToPromote: async () => { writerEntered?.(); await writerReady; } });
    await writerEnteredReady;
    const beforeRecovery = await snapshotTree(join(fixture.root, ".exspecso"));

    try {
      await expect(recoverInterruptedTransaction(fixture.root)).resolves.toEqual({ kind: "busy" });
      await expect(snapshotTree(join(fixture.root, ".exspecso"))).resolves.toEqual(beforeRecovery);
    } finally {
      releaseWriter?.();
      await writer;
    }
  });

  it("ownership race: init loses to a writer that starts after its idle observation", async () => {
    const fixture = await useFixture();
    const stdout = output();
    const stderr = output();
    let releaseInit: (() => void) | undefined;
    const initReady = new Promise<void>((resolveInit) => { releaseInit = resolveInit; });
    let initEntered: (() => void) | undefined;
    const initEnteredReady = new Promise<void>((resolveInit) => { initEntered = resolveInit; });
    const initInput = {
      selectedAgents: ["codex"] as const,
      cwd: fixture.root,
      stdin: new PassThrough(),
      stdout: stdout.stream,
      stderr: stderr.stream,
      beforeOwnershipAcquire: async () => { initEntered?.(); await initReady; },
    } as Parameters<typeof runInit>[0] & { readonly beforeOwnershipAcquire: () => Promise<void> };
    const init = runInit(initInput);
    const initState = await Promise.race([
      initEnteredReady.then(() => "entered" as const),
      init.then(() => "finished" as const),
    ]);
    expect(initState).toBe("entered");

    const writerPlan = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: ["codex"] });
    let releaseWriter: (() => void) | undefined;
    const writerReady = new Promise<void>((resolveWriter) => { releaseWriter = resolveWriter; });
    let writerEntered: (() => void) | undefined;
    const writerEnteredReady = new Promise<void>((resolveWriter) => { writerEntered = resolveWriter; });
    const writer = commitTransaction(writerPlan, { onReadyToPromote: async () => { writerEntered?.(); await writerReady; } });
    await writerEnteredReady;
    const beforeInit = await snapshotTree(join(fixture.root, ".exspecso"));

    releaseInit?.();
    await expect(init).resolves.toBe(1);
    expect(stderr.read()).toContain("EXSPECSO_INIT_TRANSACTION_BUSY");
    await expect(snapshotTree(join(fixture.root, ".exspecso"))).resolves.toEqual(beforeInit);

    releaseWriter?.();
    await expect(writer).resolves.toMatchObject({ kind: "committed" });
  });

  it("ownership race: competing stale reclaimers cannot remove a newer live owner", async () => {
    const fixture = await useFixture();
    await writeDeadOwnershipRecord(fixture.root);
    let arrivals = 0;
    let releaseReclaimers: (() => void) | undefined;
    const bothObserved = new Promise<void>((resolveBoth) => { releaseReclaimers = resolveBoth; });
    let bothReached: (() => void) | undefined;
    const bothReachedStaleObservation = new Promise<void>((resolveBoth) => { bothReached = resolveBoth; });
    const onStaleOwnerObserved = async () => {
      arrivals += 1;
      if (arrivals === 2) bothReached?.();
      await bothObserved;
    };

    const first = acquireInitOwnership(fixture.root, { onStaleOwnerObserved });
    const second = acquireInitOwnership(fixture.root, { onStaleOwnerObserved });
    await bothReachedStaleObservation;
    releaseReclaimers?.();

    const outcomes = await Promise.all([first, second]);
    const acquired = outcomes.filter((outcome) => outcome.kind === "acquired");
    const blocked = outcomes.filter((outcome) => outcome.kind === "busy");
    expect(acquired).toHaveLength(1);
    expect(blocked).toHaveLength(1);
    await expect(readdir(join(fixture.root, lockRelativePath))).resolves.toEqual([
      `owner-${acquired[0].ownership.token}.json`,
    ]);
    await releaseInitOwnership(acquired[0].ownership);
  });

  it("reclaims ownership only after a killed process has actually exited", async () => {
    const fixture = await useFixture();
    await new Promise<void>((resolveBuild, rejectBuild) => {
      const build = spawn("npm", ["run", "build"], { cwd: packageRoot, stdio: "ignore" });
      build.once("close", (code) => code === 0 ? resolveBuild() : rejectBuild(new Error(`build failed: ${code}`)));
    });
    await killAfterOwnershipPublication(fixture.root);

    await expect(recoverInterruptedTransaction(fixture.root)).resolves.toEqual({ kind: "none" });
    await expect(readdir(join(fixture.root, ".exspecso"))).rejects.toThrow();
  }, 20_000);

  it("preserves legacy regular-file ownership markers for manual inspection", async () => {
    const fixture = await useFixture();
    const lockPath = join(fixture.root, lockRelativePath);
    await mkdir(join(fixture.root, ".exspecso"), { recursive: true });
    await writeFile(lockPath, "1\n", "utf8");

    await expect(recoverInterruptedTransaction(fixture.root)).resolves.toMatchObject({ kind: "ambiguous" });
    await expect(readFile(lockPath, "utf8")).resolves.toBe("1\n");
  });

  it("preserves partial candidates and unexpected owner entries without treating them as stale", async () => {
    const fixture = await useFixture();
    const candidate = join(fixture.root, ".exspecso", ".init.lock.candidate-partial");
    await mkdir(candidate, { recursive: true });

    await expect(acquireInitOwnership(fixture.root)).resolves.toMatchObject({ kind: "ambiguous" });
    await expect(readdir(candidate)).resolves.toEqual([]);

    await rm(candidate, { recursive: true });
    await writeDeadOwnershipRecord(fixture.root);
    await writeFile(join(fixture.root, lockRelativePath, "unexpected"), "evidence\n", "utf8");

    await expect(recoverInterruptedTransaction(fixture.root)).resolves.toMatchObject({ kind: "ambiguous" });
    await expect(readFile(join(fixture.root, lockRelativePath, "unexpected"), "utf8")).resolves.toBe("evidence\n");
  });

  it("treats a live PID as busy even when a dead owner record is otherwise well formed", async () => {
    const fixture = await useFixture();
    await writeOwnershipRecord(fixture.root, join(fixture.root, lockRelativePath), process.pid);

    await expect(acquireInitOwnership(fixture.root)).resolves.toMatchObject({ kind: "busy" });
  });

  it("removes a complete dead private candidate only after publishing its own lease", async () => {
    const fixture = await useFixture();
    const candidateToken = randomUUID();
    const candidate = join(fixture.root, ".exspecso", `.init.lock.candidate-${candidateToken}`);
    await writeOwnershipRecord(fixture.root, candidate, 2_147_000_000, candidateToken);

    const acquisition = await acquireInitOwnership(fixture.root);
    expect(acquisition.kind).toBe("acquired");
    await expect(readdir(join(fixture.root, ".exspecso"))).resolves.toEqual([".init.lock"]);
    if (acquisition.kind === "acquired") await releaseInitOwnership(acquisition.ownership);
  });

  it("stages, hashes, journals deterministic promotion order, and retains evidence after each injected promotion fault", async () => {
    const fixture = await useFixture();
    const initial = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: ["codex"] });
    const allPoints = initial.writes.map((write) => `after-promotion:${write.relativePath}` as PromotionFaultPoint);
    for (const point of allPoints) {
      const result = await commitTransaction(initial, { faultAt: point });
      expect(result).toMatchObject({ kind: "failed" });
      const staging = join(fixture.root, stagingRelativePath);
      const [transactionId] = await readdir(staging);
      const journal = await readTransactionJournal(join(staging, transactionId));
      expect(journal.promotionOrder).toEqual(initial.writes.map((write) => write.relativePath));
      expect(journal.completedStep).toBe(allPoints.indexOf(point));
      for (const entry of journal.entries) {
        expect(entry.stagedHash).toMatch(/^[a-f0-9]{64}$/);
        expect(sha256(await readFile(join(staging, transactionId, "files", entry.relativePath), "utf8"))).toBe(entry.stagedHash);
      }
      await rm(join(fixture.root, ".exspecso"), { recursive: true, force: true });
      await rm(join(fixture.root, ".agents"), { recursive: true, force: true });
    }
  });

  it("records write-ahead promotion intent and leaves an external hard-link alias on the old inode", async () => {
    const fixture = await useFixture();
    const target = join(fixture.root, "target.txt");
    const alias = join(fixture.root, "external-alias.txt");
    await writeFile(target, "prior", "utf8");
    await link(target, alias);

    const result = await commitTransaction({
      repositoryRoot: fixture.root,
      writes: [{ target, relativePath: "target.txt", content: "staged", expectedExists: true, expectedPreimageHash: sha256("prior") }],
    }, { faultAt: "before-promotion:target.txt" as PromotionFaultPoint });

    expect(result).toMatchObject({ kind: "failed" });
    const [transactionId] = await readdir(join(fixture.root, stagingRelativePath));
    const journal = await readTransactionJournal(join(fixture.root, stagingRelativePath, transactionId!));
    expect(journal.schemaVersion).toBe(2);
    expect(journal.state).toBe("promoting");
    expect(journal.inFlight).toMatchObject({ relativePath: "target.txt", operation: "replace" });
    await expect(readFile(target, "utf8")).resolves.toBe("prior");
    await expect(readFile(alias, "utf8")).resolves.toBe("prior");
  });

  it("recovers every promotion step after injected exception and controlled interruption without accepting a mixed set", async () => {
    const seed = await useFixture();
    const points = (await buildInitPlan({ repositoryRoot: seed.root, selectedAgents: ["codex"] })).writes
      .map((write) => `after-promotion:${write.relativePath}` as PromotionFaultPoint);
    await seed.dispose();
    fixtures.splice(fixtures.indexOf(seed), 1);

    for (const faultMode of ["throw", "interrupt"] as const) {
      for (const point of points) {
        const fixture = await useFixture();
        const plan = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: ["codex"] });
        await expect(commitTransaction(plan, { faultAt: point, faultMode })).resolves.toMatchObject({ kind: "failed" });
        await expect(recoverInterruptedTransaction(fixture.root)).resolves.toMatchObject({ kind: "recovered", disposition: "restored-prior" });
        await expect(readdir(join(fixture.root, ".exspecso"))).rejects.toThrow();
        await expect(readFile(join(fixture.root, ".exspecso", ".init.lock"), "utf8")).rejects.toThrow();
      }
    }
  });

  it("restores an in-flight schema-2 replacement and makes the next recovery a no-op", async () => {
    const fixture = await useFixture();
    const plan = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: ["codex"] });
    const point = `before-promotion:${plan.writes[0]!.relativePath}` as PromotionFaultPoint;

    await expect(commitTransaction(plan, { faultAt: point, faultMode: "interrupt" })).resolves.toMatchObject({ kind: "failed" });
    // The process may die after a completed native replacement but before the
    // following journal write; schema 2 must accept either recorded byte set.
    await writeFile(plan.writes[0]!.target, plan.writes[0]!.content, "utf8");
    await expect(recoverInterruptedTransaction(fixture.root)).resolves.toMatchObject({ kind: "recovered", disposition: "restored-prior" });
    await expect(recoverInterruptedTransaction(fixture.root)).resolves.toEqual({ kind: "none" });
    await expect(readdir(fixture.root)).resolves.toEqual([".git"]);
  });

  it("restarts identified cleanup after an already-removed staged copy", async () => {
    const fixture = await useFixture();
    const plan = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: ["codex"] });
    const point = `before-promotion:${plan.writes[0]!.relativePath}` as PromotionFaultPoint;

    await expect(commitTransaction(plan, { faultAt: point, faultMode: "interrupt" })).resolves.toMatchObject({ kind: "failed" });
    const staging = join(fixture.root, stagingRelativePath);
    const [transactionId] = await readdir(staging);
    const stage = join(staging, transactionId!);
    const journal = await readTransactionJournal(stage);
    await rm(join(stage, "files", journal.entries[0]!.relativePath));
    await writeFile(join(stage, "journal.json"), `${JSON.stringify({ ...journal, state: "cleaning", inFlight: null })}\n`, "utf8");

    await expect(recoverInterruptedTransaction(fixture.root)).resolves.toMatchObject({ kind: "recovered", disposition: "restored-prior" });
    await expect(readdir(fixture.root)).resolves.toEqual([".git"]);
  });

  it("preserves a cleaning journal when its stage contains an unlisted entry", async () => {
    const fixture = await useFixture();
    const plan = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: ["codex"] });
    const point = `before-promotion:${plan.writes[0]!.relativePath}` as PromotionFaultPoint;

    await expect(commitTransaction(plan, { faultAt: point, faultMode: "interrupt" })).resolves.toMatchObject({ kind: "failed" });
    const staging = join(fixture.root, stagingRelativePath);
    const [transactionId] = await readdir(staging);
    const stage = join(staging, transactionId!);
    const journal = await readTransactionJournal(stage);
    await writeFile(join(stage, "unlisted-evidence"), "preserve", "utf8");
    await writeFile(join(stage, "journal.json"), `${JSON.stringify({ ...journal, state: "cleaning", inFlight: null })}\n`, "utf8");

    await expect(recoverInterruptedTransaction(fixture.root)).resolves.toMatchObject({ kind: "ambiguous" });
    await expect(readFile(join(stage, "journal.json"), "utf8")).resolves.toContain("\"cleaning\"");
    await expect(readFile(join(stage, "unlisted-evidence"), "utf8")).resolves.toBe("preserve");
  });

  it("recovers every promotion step after an externally killed CLI child", async () => {
    const probe = await useFixture();
    const points = (await buildInitPlan({ repositoryRoot: probe.root, selectedAgents: ["codex"] })).writes
      .map((write) => `after-promotion:${write.relativePath}` as PromotionFaultPoint);
    await probe.dispose();
    fixtures.splice(fixtures.indexOf(probe), 1);
    await new Promise<void>((resolveBuild, rejectBuild) => {
      const build = spawn("npm", ["run", "build"], { cwd: packageRoot, stdio: "ignore" });
      build.once("close", (code) => code === 0 ? resolveBuild() : rejectBuild(new Error(`build failed: ${code}`)));
    });

    for (const point of points) {
      const fixture = await useFixture();
      await killAtPromotion(fixture.root, point);
      const stdout = output();
      const stderr = output();
      await expect(runInit({ selectedAgents: ["codex"], cwd: fixture.root, stdin: new PassThrough(), stdout: stdout.stream, stderr: stderr.stream })).resolves.toBe(0);
      expect(stderr.read()).toContain("EXSPECSO_INIT_RECOVERED");
      await expect(readFile(join(fixture.root, ".exspecso", "exspecso.config.json"), "utf8")).resolves.toContain("unclassified");
      await expect(readdir(join(fixture.root, ".exspecso"))).resolves.toEqual(["constitution.md", "exspecso.config.json"]);
    }
  }, 20_000);

  it("fails closed for tampered journal, hash, and symlink evidence", async () => {
    const fixture = await useFixture();
    const plan = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: ["codex"] });
    const point = `after-promotion:${plan.writes[0].relativePath}` as PromotionFaultPoint;
    await commitTransaction(plan, { faultAt: point });
    const staging = join(fixture.root, stagingRelativePath);
    const [transactionId] = await readdir(staging);
    const journal = await readTransactionJournal(join(staging, transactionId));
    await writeFile(join(staging, transactionId, "journal.json"), "{ bad", "utf8");
    await expect(recoverInterruptedTransaction(fixture.root)).resolves.toMatchObject({ kind: "ambiguous" });
    await expect(readFile(join(staging, transactionId, "journal.json"), "utf8")).resolves.toBe("{ bad");

    await writeFile(join(staging, transactionId, "journal.json"), `${JSON.stringify(journal)}\n`, "utf8");
    await writeFile(join(staging, transactionId, "files", journal.entries[0].relativePath), "tampered", "utf8");
    await expect(recoverInterruptedTransaction(fixture.root)).resolves.toMatchObject({ kind: "ambiguous" });
    await expect(readFile(join(staging, transactionId, "files", journal.entries[0].relativePath), "utf8")).resolves.toBe("tampered");

    await rm(join(staging, transactionId, "files", journal.entries[0].relativePath));
    await symlink(join(fixture.root, "outside"), join(staging, transactionId, "files", journal.entries[0].relativePath));
    await expect(recoverInterruptedTransaction(fixture.root)).resolves.toMatchObject({ kind: "ambiguous" });

    await rm(join(staging, transactionId, "files", journal.entries[0].relativePath));
    await writeFile(join(staging, transactionId, "files", journal.entries[0].relativePath), plan.writes[0].content, "utf8");
    await writeFile(join(fixture.root, journal.entries[0].relativePath), "external change", "utf8");
    await expect(recoverInterruptedTransaction(fixture.root)).resolves.toMatchObject({ kind: "ambiguous" });
  });
});
