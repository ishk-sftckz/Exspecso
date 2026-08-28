import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import type { Writable } from "node:stream";

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");
export async function installContainedPackage(variant: "release" | "test") {
  const directory = await mkdtemp(join(tmpdir(), `exspecso-${variant}-install-`));
  try {
    const staged = join(directory, "package");
    await cp(join(root, "dist"), join(staged, "dist"), { recursive: true });
    await cp(join(root, "package.json"), join(staged, "package.json"));
    await exec(process.execPath, [join(root, "native/build.mjs"), "--variant", variant, "--target", `darwin-${process.arch}`, "--out", staged, "--headers", process.env.EXSPECSO_NODE_HEADERS ?? "missing-approved-headers"]);
    const { stdout } = await exec("npm", ["pack", "--json", "--pack-destination", directory], { cwd: staged });
    const [{ filename }] = JSON.parse(stdout) as Array<{ filename: string }>;
    const runner = join(directory, "runner");
    await exec("npm", ["install", "--ignore-scripts", "--no-package-lock", "--prefix", runner, join(directory, filename)]);
    const installed = join(runner, "node_modules", "exspecso");
    const manifest = JSON.parse(await readFile(join(installed, "dist/native/manifest.json"), "utf8"));
    const provider = await realpath(join(installed, "dist/native", manifest.targets[0].path));
    const sha256 = createHash("sha256").update(await readFile(provider)).digest("hex");
    if (sha256 !== manifest.targets[0].sha256 || manifest.variant !== variant) throw new Error("installed provider provenance mismatch");
    const provenance = JSON.parse(await readFile(join(installed, "dist/native/build-provenance.json"), "utf8"));
    const release = JSON.parse(await readFile(join(root, "dist/native/build-provenance.json"), "utf8"));
    for (const key of ["buildCommit", "sources", "headerHash", "compilerVersion", "sdkVersion", "xcode", "osVersion", "osBuild"]) {
      if (JSON.stringify(release[key]) !== JSON.stringify(provenance[key])) throw new Error(`release/test build mismatch: ${key}`);
    }
    const tarballSHA256 = createHash("sha256").update(await readFile(join(directory, filename))).digest("hex");
    return { directory, installed, provider, sha256, manifest, provenance, tarballSHA256, cli: join(installed, "dist/cli/main.js"), async dispose() { await rm(directory, { recursive: true, force: true }); } };
  } catch (error) { await rm(directory, { recursive: true, force: true }); throw error; }
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
