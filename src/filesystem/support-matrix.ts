import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export interface RuntimeObservation {
  readonly platform: string;
  readonly arch: string;
  readonly osVersion: string;
  readonly osBuild: string;
  readonly filesystem: string;
  readonly libc: string;
  readonly nodeVersion: string;
  readonly napiVersion: number;
}

export interface SupportRow {
  readonly id: string;
  readonly target: string;
  readonly runner: string;
  readonly runnerKind: "ci" | "local";
  readonly os: { readonly family: "macos" | "windows" | "linux"; readonly version: string; readonly build?: string; readonly kernel?: string };
  readonly cpu: string;
  readonly libc: string;
  readonly filesystem: string;
  readonly node: { readonly baseline: string; readonly testedVersion: string };
  readonly toolchain: string;
  readonly buildPolicy: Readonly<Record<string, string>>;
}

export interface SupportMatrix {
  readonly schemaVersion: 2;
  readonly revision: string;
  readonly nodePolicy: {
    readonly engine: string;
    readonly ranges: readonly { readonly major: number; readonly minimum: string }[];
    readonly exactVersions: readonly string[];
    readonly testedVersions: readonly string[];
    readonly napi: 8;
  };
  readonly rows: readonly SupportRow[];
}

export interface SupportManifestEntry {
  readonly supportRowId: string;
  readonly target: string;
  readonly platform: string;
  readonly arch: string;
  readonly osVersion: string;
  readonly osBuild: string;
  readonly filesystem: string;
  readonly libc?: string;
  readonly napiVersion: number;
  readonly path: string;
}

function fail(message: string): never {
  throw new Error(`EXSPECSO_CONTAINMENT_UNAVAILABLE: invalid support matrix: ${message}`);
}

function version(value: string): readonly [number, number, number] {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(value);
  if (!match) fail(`invalid Node version ${JSON.stringify(value)}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function validRow(value: unknown): value is SupportRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  const os = row.os as Record<string, unknown> | undefined;
  return typeof row.id === "string" && typeof row.target === "string" && typeof row.runner === "string"
    && (row.runnerKind === "ci" || row.runnerKind === "local") && typeof row.cpu === "string"
    && typeof row.libc === "string" && typeof row.filesystem === "string" && typeof row.toolchain === "string"
    && !!os && (os.family === "macos" || os.family === "windows" || os.family === "linux")
    && typeof os.version === "string" && typeof row.buildPolicy === "object" && row.buildPolicy !== null
    && !!row.node && typeof (row.node as Record<string, unknown>).baseline === "string"
    && typeof (row.node as Record<string, unknown>).testedVersion === "string";
}

function assertMatrix(value: unknown): asserts value is SupportMatrix {
  if (!value || typeof value !== "object") fail("root must be an object");
  const matrix = value as Record<string, unknown>;
  if (matrix.schemaVersion !== 2 || typeof matrix.revision !== "string" || !Array.isArray(matrix.rows)) fail("schema version, revision, or rows is invalid");
  if (matrix.rows.length < 9 || !matrix.rows.every(validRow)) fail("rows are missing or malformed");
  const ids = new Set(matrix.rows.map((row) => row.id));
  if (ids.size !== matrix.rows.length) fail("duplicate row id");
  const policy = matrix.nodePolicy as Record<string, unknown> | undefined;
  if (!policy || typeof policy.engine !== "string" || policy.napi !== 8 || !Array.isArray(policy.ranges) || !Array.isArray(policy.exactVersions) || !Array.isArray(policy.testedVersions)) fail("node policy is malformed");
  if (policy.engine !== "^20.19.0 || ^22.13.0 || ^24.0.0 || 25.2.1 || ^26.0.0") fail("node engine is not the approved policy");
  for (const lane of policy.testedVersions) version(String(lane));
  if (new Set(policy.testedVersions).size !== policy.testedVersions.length || policy.testedVersions.length !== 10) fail("tested Node lanes are not unique and complete");
  for (const range of policy.ranges) {
    if (!range || typeof range !== "object" || !Number.isInteger((range as Record<string, unknown>).major) || typeof (range as Record<string, unknown>).minimum !== "string") fail("node range is malformed");
    const [major] = version((range as { minimum: string }).minimum);
    if (major !== (range as { major: number }).major || major % 2 !== 0) fail("node range is invalid");
  }
  for (const exact of policy.exactVersions) version(String(exact));
}

function defaultMatrixPath(): string {
  const source = fileURLToPath(new URL("../../native/support-matrix.json", import.meta.url));
  const packaged = fileURLToPath(new URL("../native/support-matrix.json", import.meta.url));
  return existsSync(source) ? source : packaged;
}

export function loadSupportMatrix(path = defaultMatrixPath()): SupportMatrix {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(error instanceof Error ? error.message : "cannot read support matrix");
  }
  assertMatrix(parsed);
  return parsed;
}

function compare(left: readonly [number, number, number], right: readonly [number, number, number]): number {
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
}

export function isSupportedNodeVersion(policy: SupportMatrix["nodePolicy"], nodeVersion: string): boolean {
  const parsed = version(nodeVersion);
  if (policy.exactVersions.includes(nodeVersion)) return true;
  return policy.ranges.some((range) => parsed[0] === range.major && compare(parsed, version(range.minimum)) >= 0);
}

/** Alpine's package database, unlike ldd, preserves the revision required by the support matrix. */
export function parseAlpineMuslPackageVersion(value: string): string | undefined {
  const match = /^musl-(\d+\.\d+\.\d+-r\d+)\s*$/m.exec(value);
  return match ? `musl-${match[1]}` : undefined;
}

function familyFor(platform: string): SupportRow["os"]["family"] | undefined {
  if (platform === "darwin") return "macos";
  if (platform === "win32") return "windows";
  if (platform === "linux") return "linux";
  return undefined;
}

export function resolveSupportRow(matrix: SupportMatrix, observation: RuntimeObservation): SupportRow {
  assertMatrix(matrix);
  if (!isSupportedNodeVersion(matrix.nodePolicy, observation.nodeVersion) || observation.napiVersion < matrix.nodePolicy.napi) {
    throw new Error("EXSPECSO_CONTAINMENT_UNAVAILABLE: unsupported Node runtime");
  }
  const family = familyFor(observation.platform);
  const matches = matrix.rows.filter((row) => row.target === `${observation.platform}-${observation.arch}`
    && row.os.family === family && row.os.version === observation.osVersion && (row.os.build ?? row.os.kernel) === observation.osBuild
    && row.cpu === observation.arch && row.filesystem === observation.filesystem && row.libc === observation.libc);
  if (matches.length !== 1) throw new Error(`EXSPECSO_CONTAINMENT_UNAVAILABLE: ${matches.length ? "ambiguous" : "undeclared"} runtime support row`);
  return matches[0];
}

export function resolveManifestEntry(matrix: SupportMatrix, observation: RuntimeObservation, entries: readonly SupportManifestEntry[]): { readonly supportRow: SupportRow; readonly entry: SupportManifestEntry } {
  const supportRow = resolveSupportRow(matrix, observation);
  const matching = entries.filter((entry) => entry.target === supportRow.target && entry.supportRowId === supportRow.id);
  if (matching.length !== 1) throw new Error(`EXSPECSO_CONTAINMENT_UNAVAILABLE: ${matching.length ? "duplicate" : "missing"} native support row`);
  const entry = matching[0];
  if (entry.platform !== observation.platform || entry.arch !== observation.arch || entry.osVersion !== supportRow.os.version
    || entry.osBuild !== (supportRow.os.build ?? supportRow.os.kernel) || entry.filesystem !== supportRow.filesystem
    || entry.libc !== supportRow.libc || entry.napiVersion !== matrix.nodePolicy.napi
    || entry.path !== `${supportRow.id}/${supportRow.target}/contained-fs.node`) {
    throw new Error("EXSPECSO_CONTAINMENT_UNAVAILABLE: incompatible native support row");
  }
  return { supportRow, entry };
}
