import { mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { sha256 } from "../../src/adapters/managed-file.js";
import { buildInitPlan } from "../../src/init/plan.js";
import { assertSafeTransactionPaths } from "../../src/filesystem/safe-path.js";
import { commitTransaction, readTransactionJournal, stagingRelativePath, type PromotionFaultPoint } from "../../src/filesystem/transaction.js";
import { createGitFixture, type GitFixture } from "../helpers/git-fixture.js";

const fixtures: GitFixture[] = [];

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
});

async function useFixture(): Promise<GitFixture> {
  const fixture = await createGitFixture();
  fixtures.push(fixture);
  return fixture;
}

describe("journaled init transaction", () => {
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
    release?.();
    await expect(first).resolves.toMatchObject({ kind: "committed" });
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
});
