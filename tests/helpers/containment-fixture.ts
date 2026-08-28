import { execFile, spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { createConnection, type Socket } from "node:net";
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
export function runNpm(args: string[], options: { cwd?: string } = {}) {
  const npm = process.env.npm_execpath;
  if (!npm || !npm.endsWith("npm-cli.js")) throw new Error("Run package tests through npm test so the actual npm CLI is available");
  return exec(process.execPath, [npm, ...args], { ...options, maxBuffer: 2 * 1024 * 1024 });
}

async function packageInventory(installed: string): Promise<Record<string, string>> {
  const inventory: Record<string, string> = {};
  async function visit(directory: string, relative: string): Promise<void> {
    for (const name of await readdir(directory)) {
      const path = join(directory, name);
      const entry = relative ? `${relative}/${name}` : name;
      const metadata = await lstat(path);
      if (metadata.isDirectory()) await visit(path, entry);
      else if (metadata.isFile() && (entry === "package.json" || (entry.startsWith("dist/") && !entry.startsWith("dist/native/")))) {
        inventory[entry] = createHash("sha256").update(await readFile(path)).digest("hex");
      }
    }
  }
  await visit(installed, "");
  return Object.fromEntries(Object.entries(inventory).sort(([left], [right]) => left.localeCompare(right)));
}

export async function inspectInstalledPackage(installed: string) {
  const manifest = JSON.parse(await readFile(join(installed, "dist/native/manifest.json"), "utf8"));
  const provider = await realpath(join(installed, "dist/native", manifest.targets[0].path));
  const sha256 = createHash("sha256").update(await readFile(provider)).digest("hex");
  const provenance = JSON.parse(await readFile(join(installed, "dist/native/build-provenance.json"), "utf8"));
  return { installed, provider, sha256, manifest, provenance, packageInventory: await packageInventory(installed) };
}
export async function installContainedPackage(variant: "release" | "test") {
  const directory = await mkdtemp(join(tmpdir(), `exspecso-${variant}-install-`));
  try {
    const staged = join(directory, "package");
    await cp(join(root, "dist"), join(staged, "dist"), { recursive: true });
    await cp(join(root, "package.json"), join(staged, "package.json"));
    const args = [join(root, "native/build.mjs"), "--variant", variant, "--target", `${process.platform}-${process.arch}`, "--out", staged, "--headers", process.env.EXSPECSO_NODE_HEADERS ?? "missing-approved-headers"];
    if (process.platform === "win32") args.push("--node-lib", process.env.EXSPECSO_NODE_LIB ?? "missing-approved-library");
    await exec(process.execPath, args, { maxBuffer: 2 * 1024 * 1024 });
    const { stdout } = await runNpm(["pack", "--json", "--pack-destination", directory], { cwd: staged });
    const [{ filename }] = JSON.parse(stdout) as Array<{ filename: string }>;
    const runner = join(directory, "runner");
    await runNpm(["install", "--ignore-scripts", "--no-package-lock", "--prefix", runner, join(directory, filename)]);
    const installed = join(runner, "node_modules", "exspecso");
    const inspected = await inspectInstalledPackage(installed);
    const { manifest, provider, sha256, provenance } = inspected;
    if (sha256 !== manifest.targets[0].sha256 || manifest.variant !== variant) throw new Error("installed provider provenance mismatch");
    const release = JSON.parse(await readFile(join(root, "dist/native/build-provenance.json"), "utf8"));
    for (const key of ["buildCommit", "sources", "headerHash", "compilerVersion", "sdkVersion", "xcode", "osVersion", "osBuild", "windows", "nodeLibHash"]) {
      if (canonicalJson(release[key]) !== canonicalJson(provenance[key])) throw new Error(`release/test build mismatch: ${key}`);
    }
    const tarballSHA256 = createHash("sha256").update(await readFile(join(directory, filename))).digest("hex");
    return { directory, ...inspected, tarballSHA256, cli: join(installed, "dist/cli/main.js"), async dispose() { await rm(directory, { recursive: true, force: true }); } };
  } catch (error) { await rm(directory, { recursive: true, force: true }); throw error; }
}

/** Only the historical test package receives this seam; no production source is changed. */
export async function installVulnerablePackage() {
  const directory = await mkdtemp(join(tmpdir(), "exspecso-historical-install-"));
  try {
    const fixture = join(root, "tests/fixtures/contained-vulnerable");
    const ledger = JSON.parse(await readFile(join(fixture, "source-ledger.json"), "utf8")) as { baselineCommit: string; sources: Record<string, string> };
    const staged = join(directory, "package");
    for (const [name, expected] of Object.entries(ledger.sources)) {
      const alternate = name === "src/adapters/managed-file.ts" ? "managed-file.ts.txt" : name === "src/filesystem/transaction.ts" ? "transaction.ts.txt" : name === "src/init/run-init.ts" ? "run-init.ts.txt" : undefined;
      const bytes = await readFile(alternate ? join(fixture, alternate) : join(root, name));
      if (createHash("sha256").update(bytes).digest("hex") !== expected) throw new Error("Historical source mismatch: " + name);
      await mkdir(dirname(join(staged, name)), { recursive: true });
      await writeFile(join(staged, name), bytes);
    }
    for (const name of ["package.json", "tsconfig.json"]) await cp(join(root, name), join(staged, name));
    // Compile the exact historical source using the already installed locked compiler/types.
    await symlink(join(root, "node_modules"), join(staged, "node_modules"), "junction");
    await exec(process.execPath, [join(root, "node_modules/typescript/bin/tsc"), "-p", join(staged, "tsconfig.json")]);
    const transaction = join(staged, "dist/filesystem/transaction.js");
    let source = await readFile(transaction, "utf8");
    const boundary = "    await copyFile(source, destination);";
    if (source.split(boundary).length !== 2) throw new Error("Historical copy boundary changed");
    source = source.replace(boundary, `    if (process.env.EXSPECSO_TEST_HISTORICAL === "1" && process.send) {
      process.send({ operation: "copy:before", pid: process.pid, module: import.meta.url });
      await new Promise((resolve, reject) => process.once("message", value => value?.operation === "copy:continue" ? resolve() : reject(new Error("Unexpected historical controller message"))));
      delete process.env.EXSPECSO_TEST_HISTORICAL;
    }
${boundary}`);
    // The frozen baseline opens the copied destination read-only before fsync.
    // Windows rejects that durability call with EPERM before the copy boundary;
    // this test-only compatibility patch leaves copyFile and all path resolution
    // untouched so the historical external-write regression can be observed.
    if (process.platform === "win32") {
      const copyOffset = source.indexOf(boundary);
      const directorySync = "  await syncDirectory(dirname(destination));";
      const syncOffset = source.indexOf(directorySync, copyOffset + boundary.length);
      const copiedFileSync = source.slice(copyOffset + boundary.length, syncOffset);
      if (copyOffset < 0 || syncOffset < 0 || !copiedFileSync.includes("open(destination") || !copiedFileSync.includes("handle.sync()") || source.indexOf(directorySync, syncOffset + directorySync.length) !== -1) throw new Error("Historical Windows fsync boundary changed");
      source = `${source.slice(0, copyOffset + boundary.length)}\n  if (process.platform !== "win32") {
    const handle = await open(destination, "r");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  }\n${source.slice(syncOffset)}`;
    }
    await writeFile(transaction, source);
    const { stdout } = await runNpm(["pack", "--json", "--pack-destination", directory], { cwd: staged });
    const [{ filename }] = JSON.parse(stdout);
    const runner = join(directory, "runner");
    await runNpm(["install", "--ignore-scripts", "--no-package-lock", "--prefix", runner, join(directory, filename)]);
    const installed = join(runner, "node_modules/exspecso");
    const module = join(installed, "dist/filesystem/transaction.js");
    return { directory, cli: join(installed, "dist/cli/main.js"), module,
      provenance: { baselineCommit: ledger.baselineCommit, sources: ledger.sources, instrumentedModuleSHA256: createHash("sha256").update(await readFile(module)).digest("hex"), tarballSHA256: createHash("sha256").update(await readFile(join(directory, filename))).digest("hex"), fixtureAdaptations: process.platform === "win32" ? ["Windows-only skip of the baseline read-handle fsync after copy; copyFile and path resolution stay frozen"] : [] } };
  } catch (error) { await rm(directory, { recursive: true, force: true }); throw error; }
}

export async function runAtHistoricalReplacement(cli: string, cwd: string, attack: () => Promise<void>) {
  const child = spawn(process.execPath, [cli, "init", "--agent", "codex", "--replace-agent", "codex"], {
    cwd, env: { ...process.env, EXSPECSO_TEST_HISTORICAL: "1" }, stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
  let stdout = "", stderr = "";
  child.stdout!.on("data", bytes => { stdout += bytes; }); child.stderr!.on("data", bytes => { stderr += bytes; });
  const exited = new Promise<number | null>((resolveExit, reject) => { child.once("error", reject); child.once("exit", resolveExit); });
  const timer = setTimeout(() => child.kill("SIGKILL"), 15_000);
  try {
    const record = await new Promise<{ operation: string; pid: number; module: string }>((resolveReach, reject) => {
      child.once("message", value => resolveReach(value as { operation: string; pid: number; module: string }));
      child.once("error", reject); child.once("exit", () => reject(new Error("Historical barrier not reached: " + stderr)));
    });
    if (record.operation !== "copy:before" || record.pid !== child.pid) throw new Error("Unexpected historical barrier");
    await attack(); child.send({ operation: "copy:continue" }); child.disconnect();
    const exitCode = await exited;
    return { record, stdout, stderr, exitCode };
  } finally { clearTimeout(timer); if (child.exitCode === null && child.signalCode === null) { child.kill("SIGKILL"); await exited; } }
}

async function connectNativeWindowsPipe(endpoint: string, childExited: Promise<number | null>, deadline: number): Promise<Socket> {
  let childExit: number | null | undefined;
  void childExited.then((code) => { childExit = code; });
  for (;;) {
    if (childExit !== undefined) throw new Error(`native barrier child exited before pipe connection: ${childExit}`);
    if (Date.now() >= deadline) throw new Error("native barrier pipe connection deadline exceeded");
    const socket = createConnection(endpoint);
    const outcome = await new Promise<"connected" | NodeJS.ErrnoException>((resolveOutcome) => {
      socket.once("connect", () => resolveOutcome("connected"));
      socket.once("error", (error) => resolveOutcome(error));
    });
    if (outcome === "connected") return socket;
    socket.destroy();
    if (outcome.code !== "ENOENT" && outcome.code !== "EBUSY") throw outcome;
    await new Promise((resolveRetry) => setTimeout(resolveRetry, 25));
  }
}

type NativeBarrierExpectation = { provider: string; sha256: string; manifest: { targets: Array<{ sha256: string }> } };
type NativeBarrierOptions = { acknowledgement?: "valid" | "wrong" | "missing"; controllerPid?: number };

function validateNativeEvent(value: unknown, childPid: number | undefined, expected: NativeBarrierExpectation) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("native barrier event must be an object");
  const record = value as Record<string, unknown>;
  if (Object.keys(record).sort().join(",") !== "childpid,nonce,op,providerpath") throw new Error("native barrier event keys are not exact");
  if (record.op !== "replace:before" || record.childpid !== childPid || typeof record.providerpath !== "string" || typeof record.nonce !== "string" || !/^[a-f0-9]{64}$/.test(record.nonce)) throw new Error("native barrier event values are invalid");
  return record as { op: "replace:before"; childpid: number; providerpath: string; nonce: string };
}

export async function runAtNativeReplacement(cli: string, cwd: string, attack: () => Promise<void>, expected: NativeBarrierExpectation, options: NativeBarrierOptions = {}) {
  const channelId = randomBytes(32).toString("hex");
  const controllerPid = options.controllerPid ?? process.pid;
  const endpoint = `\\\\.\\pipe\\exspecso-containment-${channelId}`;
  const child = spawn(process.execPath, [cli, "init", "--agent", "codex", "--replace-agent", "codex"], {
    cwd,
    env: { ...process.env, EXSPECSO_CONTAINMENT_TEST_OPERATION: "replace:before", EXSPECSO_CONTAINMENT_TEST_CHANNEL_ID: channelId, EXSPECSO_CONTAINMENT_TEST_CONTROLLER_PID: String(controllerPid) },
    stdio: process.platform === "win32" ? ["ignore", "pipe", "pipe"] : ["ignore", "pipe", "pipe", "pipe", "pipe"],
  });
  let stdout = "", stderr = "", trace = "";
  child.stdout!.on("data", (bytes: Buffer) => { stdout += bytes.toString(); });
  child.stderr!.on("data", (bytes: Buffer) => { stderr += bytes.toString(); });
  const exited = new Promise<number | null>((resolveExit, reject) => { child.once("error", reject); child.once("close", resolveExit); });
  const timer = setTimeout(() => child.kill("SIGKILL"), 12_000); // Controller deadline intentionally exceeds native's 10s deadline.
  let controller: Socket | undefined;
  try {
    controller = process.platform === "win32" ? await connectNativeWindowsPipe(endpoint, exited, Date.now() + 11_000) : undefined;
    const reached = new Promise<{ op: "replace:before"; childpid: number; providerpath: string; nonce: string }>((resolveReach, reject) => {
      const source = controller ?? child.stdio[3]!;
      source.on("data", (bytes: Buffer) => {
        trace += bytes.toString();
        if (trace.length > 1024) return reject(new Error("native barrier event exceeds bounded frame"));
        try { resolveReach(validateNativeEvent(JSON.parse(trace), child.pid, expected)); } catch (error) { if (trace.endsWith("}")) reject(error); }
      });
      child.once("error", reject);
      child.once("close", () => reject(new Error(`native barrier not reached: ${stderr}`)));
    });
    const record = await reached;
    if (await realpath(record.providerpath) !== expected.provider || createHash("sha256").update(await readFile(record.providerpath)).digest("hex") !== expected.sha256 || expected.manifest.targets[0]?.sha256 !== expected.sha256) throw new Error("native barrier provider provenance mismatch");
    await attack();
    if (options.acknowledgement === "missing") return { exitCode: await exited, stdout, stderr, record };
    const acknowledgement = JSON.stringify({ ack: options.acknowledgement === "wrong" ? channelId : record.nonce });
    await new Promise<void>((resolveWrite, rejectWrite) => (controller ?? child.stdio[4]!).write(acknowledgement, (error?: Error | null) => error ? rejectWrite(error) : resolveWrite()));
    const exitCode = await exited;
    return { exitCode, stdout, stderr, record };
  } finally {
    clearTimeout(timer);
    if (child.exitCode === null && child.signalCode === null) { child.kill("SIGKILL"); await exited; }
    controller?.destroy();
  }
}
