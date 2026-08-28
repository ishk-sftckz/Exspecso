import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

function fail(message) { throw new Error(`Containment evidence rejected: ${message}`); }
function option(name) {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) fail(`${name} is required`);
  return process.argv[index + 1];
}
function sha256(value) { return /^[a-f0-9]{64}$/.test(value ?? ""); }

const stage = option("--stage");
if (!new Set(["tracer", "prerequisite", "final"]).has(stage)) fail(`unsupported stage ${stage}`);
const evidenceDir = resolve(option("--evidence-dir"));
const expectedSourceCommit = process.argv.includes("--source-commit") ? option("--source-commit") : undefined;
const matrixPath = resolve(process.argv.includes("--matrix") ? option("--matrix") : "native/support-matrix.json");
const matrix = JSON.parse(readFileSync(matrixPath, "utf8"));
if (matrix.schemaVersion !== 2 || !Array.isArray(matrix.rows) || !matrix.rows.length) fail("support matrix is invalid");
if (!Array.isArray(matrix.nodePolicy?.testedVersions) || !matrix.nodePolicy.testedVersions.length) fail("support matrix has no named Node lanes");
const rows = new Map(matrix.rows.map((row) => [row.id, row]));
const nodeLanes = new Set(matrix.nodePolicy.testedVersions);
if (rows.size !== matrix.rows.length) fail("matrix contains duplicate row IDs");
if (nodeLanes.size !== matrix.nodePolicy.testedVersions.length) fail("matrix contains duplicate named Node lanes");
const localRow = matrix.rows.find((row) => row.id === "ENV-MA25" && row.runnerKind === "local");
if (!localRow) fail("matrix does not declare the required local ENV-MA25 row");
const requiredRows = stage === "prerequisite" ? [localRow] : stage === "final" ? matrix.rows : matrix.rows.filter((row) => row.runnerKind === "ci");
const requiredLanes = stage === "final" ? nodeLanes : stage === "prerequisite" ? new Set([localRow.node.testedVersion]) : new Set();
const files = readdirSync(evidenceDir).filter((file) => file.endsWith(".json") && !new Set(["full-suite.json", "provider-manifest.json", "build-provenance.json"]).has(file)).sort();
if (!files.length) fail("no evidence records found");
const records = files.map((file) => JSON.parse(readFileSync(join(evidenceDir, file), "utf8")));
const seen = new Map();
const observedLanes = new Set();
let sourceCommit;
let finalTarball;
const approvedLinuxFilesystemMagic = 0xef53n;
function normalizedHex(value) { return `0x${value.toString(16).padStart(8, "0")}`; }
function verifyOperationRootFilesystem(record, row) {
  if (row.os.family !== "linux") return;
  const observation = record.environment?.operationRootFilesystem;
  if (!observation || typeof observation.path !== "string" || !Array.isArray(observation.mountinfo) || !observation.mountinfo.length || typeof observation.statText !== "string") fail(`${record.rowId} lacks operation-root filesystem observation`);
  if (!/^-?\d+$/.test(observation.rawMagicDecimal ?? "") || !/^\d+$/.test(observation.normalizedMagicDecimal ?? "")) fail(`${record.rowId} lacks numeric operation-root filesystem magic`);
  const raw = BigInt(observation.rawMagicDecimal);
  const normalized = BigInt.asUintN(32, raw);
  if (observation.normalizedMagicDecimal !== normalized.toString() || observation.normalizedMagicHex !== normalizedHex(normalized)) fail(`${record.rowId} operation-root filesystem magic encoding mismatches`);
  if (normalized !== approvedLinuxFilesystemMagic || observation.mapping !== "ext2/ext3") fail(`${record.rowId} operation-root filesystem is unapproved (${observation.mapping ?? "UNKNOWN"}/${observation.normalizedMagicHex ?? "UNKNOWN"})`);
}
function verifyLibcObservation(record, row) {
  const expected = row.libc === "glibc-2.39" ? "glibc 2.39" : row.libc;
  if (record.environment?.libcObserved !== expected) fail(`${record.rowId} libc observation does not match approved policy`);
}
function verifyRowObservation(record, row) {
  const environment = record.environment ?? {};
  if (environment.native !== true) fail(`${record.rowId} is emulated or not native`);
  if (environment.cpu !== row.cpu || environment.filesystem !== row.filesystem || environment.libc !== row.libc) fail(`${record.rowId} environment does not match approved target`);
  if (environment.os !== row.os.family || environment.osVersion !== row.os.version || environment.osBuild !== (row.os.build ?? row.os.kernel)) fail(`${record.rowId} exact OS observation does not match approved row`);
  if (environment.node?.version !== row.node.testedVersion) fail(`${record.rowId} Node version does not match approved row`);
  if (!Number.isInteger(environment.node?.liveNapi) || environment.node.liveNapi < matrix.nodePolicy.napi) fail(`${record.rowId} live Node-API observation is invalid`);
  if (row.id === localRow.id && environment.node.liveNapi !== 10) fail(`${record.rowId} must prove live Node-API 10`);
  if (record.provider?.napi !== matrix.nodePolicy.napi) fail(`${record.rowId} provider Node-API does not match approved policy`);
  if (!sha256(record.provider?.sha256) || record.provider.sha256 !== record.provider.buildSHA256) fail(`${record.rowId} provider hash does not match build record`);
  if (!sha256(record.manifest?.sha256)) fail(`${record.rowId} manifest hash is invalid`);
  if (!environment.compiler || !environment.toolchain || !record.toolchain?.headerSha256) fail(`${record.rowId} lacks exact toolchain provenance`);
  verifyLibcObservation(record, row);
  verifyOperationRootFilesystem(record, row);
}
for (const record of records) {
  if (record.schemaVersion !== 2 || record.stage !== stage) fail("record schema or stage is invalid");
  if (record.matrixRevision !== matrix.revision) fail(`wrong matrix revision for ${record.rowId}`);
  const row = rows.get(record.rowId);
  if (!row) fail(`unknown row ${record.rowId}`);
  if (seen.has(record.rowId)) fail(`duplicate/conflicting row ${record.rowId}`);
  seen.set(record.rowId, record);
  if (record.status !== "passed") fail(`${record.rowId} status is ${record.status}`);
  if (record.evidenceMode !== "release") fail(`${record.rowId} evidence mode is not release`);
  verifyRowObservation(record, row);
  if (stage === "tracer" && (!Array.isArray(record.tracer?.requiredTestIds) || !record.tracer.requiredTestIds.includes("installed-native-promotion") || !Array.isArray(record.tracer?.reachedTestIds) || !record.tracer.reachedTestIds.includes("installed-native-promotion") || record.tracer.exitCode !== 0)) fail(`${record.rowId} did not reach the installed tracer`);
  if (!/^[a-f0-9]{40}$/.test(record.sourceCommit ?? "")) fail(`${record.rowId} source commit is invalid`);
  if (sourceCommit && sourceCommit !== record.sourceCommit) fail("stale/conflicting source commit");
  sourceCommit = record.sourceCommit;
  for (const lane of record.nodeLanes ?? []) {
    if (!nodeLanes.has(lane)) fail(`${record.rowId} declares an unknown Node lane ${lane}`);
    observedLanes.add(lane);
  }
  if (stage === "final") {
    if (!sha256(record.finalTarball?.sha256)) fail(`${record.rowId} final tarball hash is invalid`);
    if (finalTarball && finalTarball !== record.finalTarball.sha256) fail("mixed final tarball evidence");
    finalTarball = record.finalTarball.sha256;
  }
}
for (const row of requiredRows) if (!seen.has(row.id)) fail(`missing required row ${row.id}`);
for (const lane of requiredLanes) if (!observedLanes.has(lane)) fail(`missing required Node lane ${lane}`);
if (stage === "prerequisite" && expectedSourceCommit !== undefined && sourceCommit !== expectedSourceCommit) fail("prerequisite evidence is not from the expected current source commit");
console.log(JSON.stringify({ plan_complete: true, stage, matrixRevision: matrix.revision, sourceCommit, rows: [...seen.keys()].sort(), nodeLanes: [...observedLanes].sort() }));
