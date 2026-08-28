import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const rowId = process.env.EXSPECSO_CONTAINMENT_ROW;
if (!rowId) throw new Error("EXSPECSO_CONTAINMENT_ROW is required");
const matrix = JSON.parse(readFileSync("native/support-matrix.json", "utf8"));
const row = matrix.rows.find((candidate) => candidate.id === rowId);
if (!row) throw new Error(`unknown containment row ${rowId}`);
const manifest = JSON.parse(readFileSync("dist/native/manifest.json", "utf8"));
const provider = manifest.targets?.[0];
const build = JSON.parse(readFileSync("dist/native/build-provenance.json", "utf8"));
const result = JSON.parse(readFileSync("tracer-results.json", "utf8"));
if (result.numFailedTests || !result.numPassedTests) throw new Error("installed native tracer did not pass");
const command = (program, args) => execFileSync(program, args, { encoding: "utf8" }).trim();
const sourceCommit = command("git", ["rev-parse", "HEAD"]);
writeFileSync("evidence.json", JSON.stringify({
  schemaVersion: 1,
  matrixRevision: matrix.revision,
  rowId,
  stage: "tracer",
  status: "passed",
  evidenceMode: "release",
  sourceCommit,
  provider: { sha256: provider.sha256, buildSHA256: build.binarySHA256 },
  tracer: { requiredTestIds: ["installed-native-promotion"], reachedTestIds: ["installed-native-promotion"], exitCode: 0 },
  environment: {
    native: true,
    cpu: process.arch,
    os: provider.osVersion,
    kernel: provider.osBuild,
    filesystem: provider.filesystem,
    libc: provider.libc ?? "system",
    node: { version: process.version.slice(1), napi: Number(process.versions.napi) },
    compiler: build.compilerVersion,
    toolchain: row.toolchain,
    image: process.env.ImageVersion ?? row.image ?? "unreported"
  }
}, null, 2) + "\n");
