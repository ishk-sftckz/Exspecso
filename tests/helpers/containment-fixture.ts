import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import type { Writable } from "node:stream";

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");
export function runNpm(args: string[], options: { cwd?: string } = {}) {
  const npm = process.env.npm_execpath;
  if (!npm || !npm.endsWith("npm-cli.js")) throw new Error("Run package tests through npm test so the actual npm CLI is available");
  return exec(process.execPath, [npm, ...args], { ...options, maxBuffer: 2 * 1024 * 1024 });
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
    const manifest = JSON.parse(await readFile(join(installed, "dist/native/manifest.json"), "utf8"));
    const provider = await realpath(join(installed, "dist/native", manifest.targets[0].path));
    const sha256 = createHash("sha256").update(await readFile(provider)).digest("hex");
    if (sha256 !== manifest.targets[0].sha256 || manifest.variant !== variant) throw new Error("installed provider provenance mismatch");
    const provenance = JSON.parse(await readFile(join(installed, "dist/native/build-provenance.json"), "utf8"));
    const release = JSON.parse(await readFile(join(root, "dist/native/build-provenance.json"), "utf8"));
    for (const key of ["buildCommit", "sources", "headerHash", "compilerVersion", "sdkVersion", "xcode", "osVersion", "osBuild", "windows", "nodeLibHash"]) {
      if (JSON.stringify(release[key]) !== JSON.stringify(provenance[key])) throw new Error(`release/test build mismatch: ${key}`);
    }
    const tarballSHA256 = createHash("sha256").update(await readFile(join(directory, filename))).digest("hex");
    return { directory, installed, provider, sha256, manifest, provenance, tarballSHA256, cli: join(installed, "dist/cli/main.js"), async dispose() { await rm(directory, { recursive: true, force: true }); } };
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
      const alternate = name === "src/filesystem/transaction.ts" ? "transaction.ts.txt" : name === "src/init/run-init.ts" ? "run-init.ts.txt" : undefined;
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
    await writeFile(transaction, source);
    const { stdout } = await runNpm(["pack", "--json", "--pack-destination", directory], { cwd: staged });
    const [{ filename }] = JSON.parse(stdout);
    const runner = join(directory, "runner");
    await runNpm(["install", "--ignore-scripts", "--no-package-lock", "--prefix", runner, join(directory, filename)]);
    const installed = join(runner, "node_modules/exspecso");
    const module = join(installed, "dist/filesystem/transaction.js");
    return { directory, cli: join(installed, "dist/cli/main.js"), module,
      provenance: { baselineCommit: ledger.baselineCommit, sources: ledger.sources, instrumentedModuleSHA256: createHash("sha256").update(await readFile(module)).digest("hex"), tarballSHA256: createHash("sha256").update(await readFile(join(directory, filename))).digest("hex") } };
  } catch (error) { await rm(directory, { recursive: true, force: true }); throw error; }
}

export async function runAtHistoricalReplacement(cli: string, cwd: string, attack: () => Promise<void>) {
  const child = spawn(process.execPath, [cli, "init", "--agent", "codex", "--replace-agent", "codex"], {
    cwd, env: { ...process.env, EXSPECSO_TEST_HISTORICAL: "1" }, stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
  let stdout = "", stderr = "";
  child.stdout!.on("data", bytes => { stdout += bytes; }); child.stderr!.on("data", bytes => { stderr += bytes; });
  const exited = new Promise<number | null>((resolveExit, reject) => { child.once("error", reject); child.once("close", resolveExit); });
  const timer = setTimeout(() => child.kill("SIGKILL"), 15_000);
  try {
    const record = await new Promise<{ operation: string; pid: number; module: string }>((resolveReach, reject) => {
      child.once("message", value => resolveReach(value as { operation: string; pid: number; module: string }));
      child.once("error", reject); child.once("close", () => reject(new Error("Historical barrier not reached: " + stderr)));
    });
    if (record.operation !== "copy:before" || record.pid !== child.pid) throw new Error("Unexpected historical barrier");
    await attack(); child.send({ operation: "copy:continue" }); child.disconnect();
    const exitCode = await exited;
    return { record, stdout, stderr, exitCode };
  } finally { clearTimeout(timer); if (child.exitCode === null && child.signalCode === null) { child.kill("SIGKILL"); await exited; } }
}

export async function runAtNativeReplacement(cli: string, cwd: string, attack: () => Promise<void>) {
  const child = spawn(process.execPath, [cli, "init", "--agent", "codex", "--replace-agent", "codex"], {
    cwd, env: { ...process.env, EXSPECSO_TEST_NATIVE_OPERATION: "replace:before" },
    stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"],
  });
  let stdout = "", stderr = "", trace = "";
  child.stdout!.on("data", (bytes: Buffer) => { stdout += bytes.toString(); });
  child.stderr!.on("data", (bytes: Buffer) => { stderr += bytes.toString(); });
  const exited = new Promise<number | null>((resolveExit, reject) => { child.once("error", reject); child.once("close", resolveExit); });
  const timer = setTimeout(() => child.kill("SIGKILL"), 15_000);
  try {
    const reached = new Promise<{ operation: string; pid: number; providerPath: string }>((resolveReach, reject) => {
      child.stdio[3]!.on("data", (bytes: Buffer) => {
        trace += bytes.toString();
        if (trace.includes("\n")) { try { resolveReach(JSON.parse(trace.trim())); } catch (error) { reject(error); } }
      });
      child.once("error", reject);
      child.once("close", () => reject(new Error(`native barrier not reached: ${stderr}`)));
    });
    const record = await reached;
    if (record.operation !== "replace:before" || record.pid !== child.pid) throw new Error("unexpected native barrier");
    await attack();
    (child.stdio[4] as Writable).write("1");
    const exitCode = await exited;
    return { exitCode, stdout, stderr, record };
  } finally {
    clearTimeout(timer);
    if (child.exitCode === null && child.signalCode === null) { child.kill("SIGKILL"); await exited; }
  }
}
