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
const approvedLinuxFilesystemMagic = 0xef53n;
function normalizedHex(value) { return `0x${value.toString(16).padStart(8, "0")}`; }
function readOperationRootFilesystem() {
  if (row.os.family !== "linux") return undefined;
  const path = process.env.EXSPECSO_FILESYSTEM_OBSERVATION ?? "filesystem-observation.json";
  const observation = JSON.parse(readFileSync(path, "utf8")).fixtureRoot;
  if (!observation || typeof observation.path !== "string" || !Array.isArray(observation.mountinfo) || !observation.mountinfo.length || typeof observation.statText !== "string") throw new Error("operation-root filesystem observation is incomplete");
  if (!/^-?\d+$/.test(observation.rawMagicDecimal ?? "") || !/^\d+$/.test(observation.normalizedMagicDecimal ?? "")) throw new Error("operation-root filesystem observation lacks numeric magic");
  const raw = BigInt(observation.rawMagicDecimal);
  const normalized = BigInt.asUintN(32, raw);
  if (observation.normalizedMagicDecimal !== normalized.toString() || observation.normalizedMagicHex !== normalizedHex(normalized) || normalized !== approvedLinuxFilesystemMagic || observation.mapping !== "ext2/ext3") throw new Error("operation-root filesystem observation is not approved ext2/ext3 magic");
  return observation;
}
const operationRootFilesystem = readOperationRootFilesystem();
const sourceCommit = process.env.EXSPECSO_SOURCE_COMMIT ?? command("git", ["rev-parse", "HEAD"]);
if (!/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error("evidence source commit must be the exact 40-hex snapshot");
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
    node: { version: process.version.slice(1), napi: provider.napiVersion, runtimeNapi: Number(process.versions.napi) },
    compiler: build.compilerVersion,
    toolchain: row.toolchain,
    image: process.env.ImageVersion ?? row.image ?? "unreported",
    operationRootFilesystem,
  }
}, null, 2) + "\n");
