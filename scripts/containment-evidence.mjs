import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

function fail(message) { throw new Error(`Containment evidence rejected: ${message}`); }
function option(name) {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) fail(`${name} is required`);
  return process.argv[index + 1];
}
const stage = option("--stage");
if (stage !== "tracer") fail(`unsupported stage ${stage}`);
const evidenceDir = resolve(option("--evidence-dir"));
const matrixPath = resolve(process.argv.includes("--matrix") ? option("--matrix") : "native/support-matrix.json");
const matrix = JSON.parse(readFileSync(matrixPath, "utf8"));
if (matrix.schemaVersion !== 1 || !Array.isArray(matrix.rows) || matrix.rows.length !== 8) fail("approved matrix must contain exactly eight rows");
const rows = new Map(matrix.rows.map((row) => [row.id, row]));
if (rows.size !== 8) fail("matrix contains duplicate row IDs");
const files = readdirSync(evidenceDir).filter((file) => file.endsWith(".json")).sort();
if (!files.length) fail("no evidence records found");
const records = files.map((file) => JSON.parse(readFileSync(join(evidenceDir, file), "utf8")));
const seen = new Map();
let sourceCommit;
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
for (const record of records) {
  if (record.schemaVersion !== 1 || record.stage !== stage) fail("record schema or stage is invalid");
  if (record.matrixRevision !== matrix.revision) fail(`wrong matrix revision for ${record.rowId}`);
  const row = rows.get(record.rowId);
  if (!row) fail(`unknown row ${record.rowId}`);
  if (seen.has(record.rowId)) fail(`duplicate/conflicting row ${record.rowId}`);
  seen.set(record.rowId, record);
  if (record.status !== "passed") fail(`${record.rowId} status is ${record.status}`);
  if (record.evidenceMode !== "release") fail(`${record.rowId} evidence mode is not release`);
  if (record.environment?.native !== true) fail(`${record.rowId} is emulated or not native`);
  if (record.environment?.cpu !== row.cpu || record.environment?.filesystem !== row.filesystem || record.environment?.libc !== row.libc) fail(`${record.rowId} environment does not match approved target`);
  verifyOperationRootFilesystem(record, row);
  if (record.environment?.node?.version !== row.node.baseline || record.environment?.node?.napi !== matrix.nodePolicy.napi) fail(`${record.rowId} Node/N-API mismatch`);
  if (!record.environment?.os || !record.environment?.kernel || !record.environment?.compiler || !record.environment?.toolchain) fail(`${record.rowId} lacks exact environment observations`);
  if (!Array.isArray(record.tracer?.requiredTestIds) || !record.tracer.requiredTestIds.includes("installed-native-promotion") || !Array.isArray(record.tracer?.reachedTestIds) || !record.tracer.reachedTestIds.includes("installed-native-promotion") || record.tracer.exitCode !== 0) fail(`${record.rowId} did not reach the installed tracer`);
  if (!/^[a-f0-9]{40}$/.test(record.sourceCommit ?? "")) fail(`${record.rowId} source commit is invalid`);
  if (sourceCommit && sourceCommit !== record.sourceCommit) fail("stale/conflicting source commit");
  sourceCommit = record.sourceCommit;
  if (!/^[a-f0-9]{64}$/.test(record.provider?.sha256 ?? "") || record.provider.sha256 !== record.provider.buildSHA256) fail(`${record.rowId} binary hash does not match build record`);
}
for (const id of rows.keys()) if (!seen.has(id)) fail(`missing required row ${id}`);
console.log(JSON.stringify({ plan_complete: true, stage, matrixRevision: matrix.revision, sourceCommit, rows: [...seen.keys()].sort() }));
