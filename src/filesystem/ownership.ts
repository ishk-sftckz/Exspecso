import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, readdir, realpath, rename, rmdir, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { sha256 } from "../adapters/managed-file.js";

export const lockRelativePath = ".exspecso/.init.lock";

const ownershipSchemaVersion = 1;
const candidatePrefix = ".init.lock.candidate-";
const ownerFilePrefix = "owner-";
const ownerFileSuffix = ".json";
const ownershipBrand: unique symbol = Symbol("InitOwnership");

interface OwnerRecord {
  readonly schemaVersion: typeof ownershipSchemaVersion;
  readonly pid: number;
  readonly token: string;
  readonly rootFingerprint: string;
}

interface HeldOwnership {
  readonly [ownershipBrand]: true;
  readonly root: string;
  readonly token: string;
  readonly recordName: string;
  readonly lockPath: string;
  state: "acquired" | "released";
}

export type InitOwnership = Readonly<HeldOwnership>;

export type InitOwnershipInspection =
  | { readonly kind: "none" }
  | { readonly kind: "busy"; readonly message: string }
  | { readonly kind: "stale"; readonly token: string; readonly recordName: string; readonly record: OwnerRecord }
  | { readonly kind: "ambiguous"; readonly message: string };

export type InitOwnershipAcquisition =
  | { readonly kind: "acquired"; readonly ownership: InitOwnership }
  | { readonly kind: "busy"; readonly message: string }
  | { readonly kind: "ambiguous"; readonly message: string };

function ownerFileName(token: string): string {
  return `${ownerFilePrefix}${token}${ownerFileSuffix}`;
}

async function canonicalRoot(rootInput: string): Promise<string> {
  const root = resolve(rootInput);
  try {
    return await realpath(root);
  } catch {
    return root;
  }
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function parseOwnerRecord(raw: string, root: string, recordName: string): OwnerRecord | undefined {
  try {
    const record = JSON.parse(raw) as Partial<OwnerRecord>;
    if (record.schemaVersion !== ownershipSchemaVersion || !Number.isInteger(record.pid) || (record.pid ?? 0) <= 0 || !isUuid(record.token) || record.rootFingerprint !== sha256(root) || ownerFileName(record.token) !== recordName) return undefined;
    return record as OwnerRecord;
  } catch {
    return undefined;
  }
}

async function syncDirectory(path: string): Promise<void> {
  try {
    const handle = await open(path, "r");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  } catch {
    // Some supported filesystems cannot sync directories. Ownership remains a
    // process-level coordination protocol, matching the D-19 boundary.
  }
}

async function writeOwnerRecord(path: string, record: OwnerRecord): Promise<void> {
  const handle = await open(path, "wx");
  try {
    await handle.writeFile(`${JSON.stringify(record)}\n`, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function hasInterruptedCandidate(operationalRoot: string): Promise<boolean> {
  try {
    return (await readdir(operationalRoot)).some((entry) => entry.startsWith(candidatePrefix));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

function liveness(record: OwnerRecord): "busy" | "stale" {
  try {
    process.kill(record.pid, 0);
    return "busy";
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ESRCH" ? "stale" : "busy";
  }
}

/** Inspects a published owner directory without granting mutation authority. */
export async function inspectInitOwnership(rootInput: string): Promise<InitOwnershipInspection> {
  const root = await canonicalRoot(rootInput);
  const lockPath = join(root, lockRelativePath);
  let metadata;
  try {
    metadata = await lstat(lockPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { kind: "none" };
    return { kind: "ambiguous", message: "cannot inspect initialization ownership" };
  }
  if (metadata.isFile()) return { kind: "ambiguous", message: "legacy regular-file initialization lock requires manual inspection" };
  if (!metadata.isDirectory()) return { kind: "ambiguous", message: "initialization ownership is not a directory" };

  let entries;
  try {
    entries = await readdir(lockPath, { withFileTypes: true });
  } catch {
    return { kind: "ambiguous", message: "cannot read initialization ownership directory" };
  }
  if (entries.length !== 1 || !entries[0].isFile() || !entries[0].name.startsWith(ownerFilePrefix) || !entries[0].name.endsWith(ownerFileSuffix)) {
    return { kind: "ambiguous", message: "initialization ownership directory has unknown entries" };
  }
  const recordName = entries[0].name;
  let record: OwnerRecord | undefined;
  try {
    record = parseOwnerRecord(await readFile(join(lockPath, recordName), "utf8"), root, recordName);
  } catch {
    return { kind: "ambiguous", message: "initialization ownership record is unreadable" };
  }
  if (record === undefined) return { kind: "ambiguous", message: "initialization ownership record is invalid" };
  return liveness(record) === "stale"
    ? { kind: "stale", token: record.token, recordName, record }
    : { kind: "busy", message: "initialization is already in progress" };
}

async function removeObservedStaleOwner(root: string, observed: Extract<InitOwnershipInspection, { kind: "stale" }>): Promise<boolean> {
  const current = await inspectInitOwnership(root);
  if (current.kind !== "stale" || current.token !== observed.token || current.recordName !== observed.recordName) return false;
  const lockPath = join(root, lockRelativePath);
  try {
    await unlink(join(lockPath, observed.recordName));
  } catch {
    return false;
  }
  try {
    await rmdir(lockPath);
    return true;
  } catch {
    // A different owner can publish only a differently named child; non-
    // recursive rmdir leaves that live owner untouched.
    return false;
  }
}

async function removeCandidate(candidatePath: string, recordPath: string): Promise<void> {
  await unlink(recordPath).catch(() => undefined);
  await rmdir(candidatePath).catch(() => undefined);
}

async function publishOwnership(root: string): Promise<InitOwnershipAcquisition> {
  const operationalRoot = join(root, ".exspecso");
  const token = randomUUID();
  const candidatePath = join(operationalRoot, `${candidatePrefix}${token}`);
  const recordName = ownerFileName(token);
  const recordPath = join(candidatePath, recordName);
  const lockPath = join(root, lockRelativePath);
  try {
    await mkdir(operationalRoot, { recursive: true });
    await mkdir(candidatePath, { recursive: false });
    await writeOwnerRecord(recordPath, { schemaVersion: ownershipSchemaVersion, pid: process.pid, token, rootFingerprint: sha256(root) });
    await syncDirectory(candidatePath);
    await syncDirectory(operationalRoot);
    await rename(candidatePath, lockPath);
    await syncDirectory(operationalRoot);
    return {
      kind: "acquired",
      ownership: { [ownershipBrand]: true, root, token, recordName, lockPath, state: "acquired" },
    };
  } catch (error) {
    await removeCandidate(candidatePath, recordPath);
    if ((error as NodeJS.ErrnoException).code === "EEXIST" || (error as NodeJS.ErrnoException).code === "ENOTEMPTY") {
      const inspection = await inspectInitOwnership(root);
      return inspection.kind === "ambiguous"
        ? { kind: "ambiguous", message: inspection.message }
        : { kind: "busy", message: inspection.kind === "none" ? "initialization ownership changed during acquisition" : "initialization is already in progress" };
    }
    return { kind: "ambiguous", message: "cannot publish initialization ownership" };
  }
}

/** Atomically publishes a unique owner directory, reclaiming only an identified dead owner. */
export async function acquireInitOwnership(rootInput: string): Promise<InitOwnershipAcquisition> {
  const root = await canonicalRoot(rootInput);
  const operationalRoot = join(root, ".exspecso");
  let inspection = await inspectInitOwnership(root);
  if (inspection.kind === "busy" || inspection.kind === "ambiguous") return inspection;
  if (inspection.kind === "stale") {
    if (!await removeObservedStaleOwner(root, inspection)) return { kind: "busy", message: "initialization ownership changed during stale-owner reclamation" };
    inspection = await inspectInitOwnership(root);
    if (inspection.kind !== "none") return inspection.kind === "ambiguous" ? inspection : { kind: "busy", message: "initialization ownership changed during stale-owner reclamation" };
  }
  try {
    if (await hasInterruptedCandidate(operationalRoot)) return { kind: "ambiguous", message: "interrupted initialization ownership candidate was preserved for inspection" };
  } catch {
    return { kind: "ambiguous", message: "cannot inspect initialization ownership candidates" };
  }
  return publishOwnership(root);
}

/** Releases only the UUID-named record owned by this lease; repeated release is harmless. */
export async function releaseInitOwnership(ownership: InitOwnership): Promise<void> {
  const mutable = ownership as HeldOwnership;
  if (mutable.state === "released") return;
  mutable.state = "released";
  try {
    const recordPath = join(mutable.lockPath, mutable.recordName);
    const record = parseOwnerRecord(await readFile(recordPath, "utf8"), mutable.root, mutable.recordName);
    if (record?.token !== mutable.token) return;
    await unlink(recordPath).catch(() => undefined);
    await rmdir(mutable.lockPath).catch(() => undefined);
    await rmdir(dirname(mutable.lockPath)).catch(() => undefined);
  } catch {
    // A changed or unreadable current owner is never removed by this lease.
  }
}
