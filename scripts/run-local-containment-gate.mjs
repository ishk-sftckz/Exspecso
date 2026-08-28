import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const expectedHeaderSha256 = "800194e32cef4ee77f5a2e8c0e5dd2b4acb38b39ef2ea544929c181b949494bb";
const root = resolve(import.meta.dirname, "..");
const argument = (name) => {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`${name} is required`);
  return process.argv[index + 1];
};
const rowId = argument("--row");
const evidenceDir = resolve(argument("--evidence-dir"));
if (rowId !== "ENV-MA25") throw new Error("this local gate only accepts ENV-MA25");
const matrix = JSON.parse(readFileSync(join(root, "native/support-matrix.json"), "utf8"));
const row = matrix.rows.find((candidate) => candidate.id === rowId);
if (!row || row.runnerKind !== "local") throw new Error("ENV-MA25 must be the declared local support row");
const command = (program, args, options = {}) => execFileSync(program, args, { cwd: root, encoding: "utf8", ...options }).trim();
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sourceCommit = command("git", ["rev-parse", "HEAD"]);
if (process.platform !== "darwin" || process.arch !== row.cpu || process.version.slice(1) !== row.node.testedVersion || Number(process.versions.napi) !== 10) throw new Error("live runtime does not match ENV-MA25");
const osVersion = command("/usr/bin/sw_vers", ["-productVersion"]);
const osBuild = command("/usr/bin/sw_vers", ["-buildVersion"]);
if (osVersion !== row.os.version || osBuild !== row.os.build) throw new Error("live macOS observation does not match ENV-MA25");

const work = mkdtempSync(join(tmpdir(), "exspecso-env-ma25-"));
try {
  const headers = join(work, "node-v20.19.0-headers.tar.gz");
  const headerUrl = "https://nodejs.org/dist/v20.19.0/node-v20.19.0-headers.tar.gz";
  execFileSync("curl", ["--fail", "--silent", "--show-error", "--location", "--output", headers, headerUrl], { stdio: "inherit" });
  if (sha256(readFileSync(headers)) !== expectedHeaderSha256) throw new Error("Node 20.19.0 header checksum mismatch");
  const fixtureRoot = join(work, "fixtures");
  mkdirSync(fixtureRoot, { recursive: true });
  const environment = {
    ...process.env,
    EXSPECSO_SOURCE_COMMIT: sourceCommit,
    EXSPECSO_NODE_HEADERS: headers,
    EXSPECSO_TEST_TMPDIR: fixtureRoot,
  };
  execFileSync(process.execPath, ["native/build.mjs", "--variant", "release", "--row", rowId, "--out", ".", "--headers", headers], { cwd: root, env: environment, stdio: "inherit" });
  execFileSync("npm", ["run", "build"], { cwd: root, env: environment, stdio: "inherit" });
  const rawReport = join(work, "vitest-full.json");
  const testArgs = ["test", "--", "--run", "--testTimeout", "60000", "--reporter=json", "--outputFile", rawReport];
  const test = spawnSync("npm", testArgs, { cwd: root, env: environment, encoding: "utf8" });
  if (test.stdout) process.stdout.write(test.stdout);
  if (test.stderr) process.stderr.write(test.stderr);
  if (test.error) throw test.error;
  if (!readFileSync(rawReport, "utf8")) throw new Error("Vitest did not write a complete-suite JSON report");
  const vitest = JSON.parse(readFileSync(rawReport, "utf8"));
  const fullSuite = {
    command: ["npm", ...testArgs],
    exitCode: test.status,
    signal: test.signal,
    vitest,
  };
  if (test.status !== 0 || test.signal || vitest.numFailedTests || vitest.numPendingTests || vitest.numTodoTests || !vitest.numPassedTests || vitest.numPassedTests !== vitest.numTotalTests) throw new Error("complete unfiltered Vitest suite did not fully pass");
  const manifestPath = join(root, "dist/native/manifest.json");
  const provenancePath = join(root, "dist/native/build-provenance.json");
  const manifestBytes = readFileSync(manifestPath);
  const manifest = JSON.parse(manifestBytes);
  const provenanceBytes = readFileSync(provenancePath);
  const provenance = JSON.parse(provenanceBytes);
  const provider = manifest.targets?.find((target) => target.supportRowId === rowId);
  if (!provider || provider.napiVersion !== matrix.nodePolicy.napi || manifest.variant !== "release" || manifest.buildCommit !== sourceCommit || provenance.buildCommit !== sourceCommit || provenance.headerHash !== expectedHeaderSha256 || provider.sha256 !== provenance.binarySHA256) throw new Error("release provider provenance does not bind ENV-MA25 to this source snapshot");
  mkdirSync(evidenceDir, { recursive: true });
  cpSync(manifestPath, join(evidenceDir, "provider-manifest.json"));
  cpSync(provenancePath, join(evidenceDir, "build-provenance.json"));
  writeFileSync(join(evidenceDir, "full-suite.json"), JSON.stringify(fullSuite, null, 2) + "\n");
  const evidence = {
    schemaVersion: 2,
    matrixRevision: matrix.revision,
    rowId,
    stage: "prerequisite",
    status: "passed",
    evidenceMode: "release",
    sourceCommit,
    provider: { sha256: provider.sha256, buildSHA256: provenance.binarySHA256, napi: provider.napiVersion, path: provider.path },
    manifest: { sha256: sha256(manifestBytes) },
    nodeLanes: [row.node.testedVersion],
    toolchain: { headerSha256: provenance.headerHash, compilerVersion: provenance.compilerVersion, sdkVersion: provenance.sdkVersion, sdkBuild: provenance.sdkBuild, developerDirectory: provenance.developerDirectory },
    environment: {
      native: true,
      cpu: process.arch,
      os: row.os.family,
      osVersion,
      osBuild,
      kernel: osBuild,
      filesystem: provider.filesystem,
      libc: row.libc,
      libcObserved: row.libc,
      node: { version: process.version.slice(1), liveNapi: Number(process.versions.napi) },
      compiler: provenance.compilerVersion,
      toolchain: row.toolchain,
      developerDirectory: provenance.developerDirectory,
      sdkPath: provenance.sdk,
    },
    fullSuite: { exitCode: test.status, passed: vitest.numPassedTests, total: vitest.numTotalTests, failed: vitest.numFailedTests, skipped: vitest.numPendingTests, todo: vitest.numTodoTests },
  };
  writeFileSync(join(evidenceDir, "evidence.json"), JSON.stringify(evidence, null, 2) + "\n");
  execFileSync(process.execPath, ["scripts/containment-evidence.mjs", "--stage", "prerequisite", "--evidence-dir", evidenceDir], { cwd: root, stdio: "inherit" });
  console.log(JSON.stringify({ plan_complete: true, rowId, sourceCommit, provider: provider.sha256, manifest: sha256(manifestBytes), fullSuite: evidence.fullSuite }));
} finally {
  rmSync(work, { recursive: true, force: true });
}
