import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const rowId = process.env.EXSPECSO_CONTAINMENT_ROW;
if (!rowId) throw new Error("EXSPECSO_CONTAINMENT_ROW is required");
const stage = process.env.EXSPECSO_EVIDENCE_STAGE ?? "tracer";
if (!new Set(["tracer", "prerequisite", "final"]).has(stage)) throw new Error("EXSPECSO_EVIDENCE_STAGE is invalid");
const matrix = JSON.parse(readFileSync("native/support-matrix.json", "utf8"));
const row = matrix.rows.find((candidate) => candidate.id === rowId);
if (!row) throw new Error(`unknown containment row ${rowId}`);
const manifestBytes = readFileSync("dist/native/manifest.json");
const manifest = JSON.parse(manifestBytes);
const provider = manifest.targets?.find((target) => target.supportRowId === rowId);
if (!provider) throw new Error("native manifest does not select the requested support row");
const build = JSON.parse(readFileSync("dist/native/build-provenance.json", "utf8"));
const result = JSON.parse(readFileSync("tracer-results.json", "utf8"));
if (result.numFailedTests || !result.numPassedTests || result.numPendingTests || result.numTodoTests) throw new Error("installed native tracer did not fully pass");
const command = (program, args) => execFileSync(program, args, { encoding: "utf8" }).trim();
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
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
const libcObserved = provider.libc ?? "system";
const expectedObservedLibc = row.libc === "glibc-2.39" ? "glibc 2.39" : row.libc;
if (libcObserved !== expectedObservedLibc) throw new Error(`provider libc observation ${libcObserved} does not match approved ${row.libc}`);
const sourceCommit = process.env.EXSPECSO_SOURCE_COMMIT ?? command("git", ["rev-parse", "HEAD"]);
if (!/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error("evidence source commit must be the exact 40-hex snapshot");
writeFileSync("evidence.json", JSON.stringify({
  schemaVersion: 2,
  matrixRevision: matrix.revision,
  rowId,
  stage,
  status: "passed",
  evidenceMode: "release",
  sourceCommit,
  provider: { sha256: provider.sha256, buildSHA256: build.binarySHA256, napi: provider.napiVersion },
  manifest: { sha256: hash(manifestBytes) },
  nodeLanes: stage === "final" ? matrix.nodePolicy.testedVersions : [row.node.testedVersion],
  tracer: { requiredTestIds: ["installed-native-promotion"], reachedTestIds: ["installed-native-promotion"], exitCode: 0 },
  toolchain: { headerSha256: build.headerHash, compilerVersion: build.compilerVersion, sdkVersion: build.sdkVersion, sdkBuild: build.sdkBuild },
  environment: {
    native: true,
    cpu: process.arch,
    os: row.os.family,
    osVersion: provider.osVersion,
    osBuild: provider.osBuild,
    kernel: provider.osBuild,
    filesystem: provider.filesystem,
    libc: row.libc,
    libcObserved,
    node: { version: process.version.slice(1), liveNapi: Number(process.versions.napi) },
    compiler: build.compilerVersion,
    toolchain: row.toolchain,
    image: process.env.ImageVersion ?? row.image ?? "unreported",
    operationRootFilesystem,
  }
}, null, 2) + "\n");
