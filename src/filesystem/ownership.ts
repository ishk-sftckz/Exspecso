import { randomUUID } from "node:crypto";
import { realpath, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sha256 } from "../adapters/managed-file.js";
import { openContainedFilesystem, type DirectoryCapability, type RootCapability } from "./contained-fs.js";

export const lockRelativePath = ".exspecso/.init.lock";
const ownershipSchemaVersion = 1;
const candidatePrefix = ".init.lock.candidate-";
const ownerFilePrefix = "owner-";
const ownerFileSuffix = ".json";
const ownershipBrand: unique symbol = Symbol("InitOwnership");

interface OwnerRecord { readonly schemaVersion: typeof ownershipSchemaVersion; readonly pid: number; readonly token: string; readonly rootFingerprint: string; }
interface HeldOwnership {
  readonly [ownershipBrand]: true;
  readonly root: string;
  readonly token: string;
  readonly recordName: string;
  readonly rootDirectory: DirectoryCapability;
  readonly operationalDirectory: DirectoryCapability;
  readonly lockDirectory: DirectoryCapability;
  readonly ownedFilesystem?: RootCapability;
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
interface AcquireInitOwnershipOptions {
  /** The caller's held root avoids reacquisition during init/transaction work. */
  readonly rootDirectory?: DirectoryCapability;
  /** Internal deterministic test seam; it never changes ownership decisions. */
  readonly onStaleOwnerObserved?: () => void | Promise<void>;
}
interface DirectoryAccess { readonly root: string; readonly directory: DirectoryCapability; readonly ownedFilesystem?: RootCapability; close(): void; }
interface ObservedDeadCandidate { readonly name: string; readonly token: string; readonly recordName: string; }
type CandidateInspection = { readonly kind: "none" } | { readonly kind: "stale"; readonly candidates: readonly ObservedDeadCandidate[] } | { readonly kind: "ambiguous"; readonly message: string };

function ownerFileName(token: string): string { return `${ownerFilePrefix}${token}${ownerFileSuffix}`; }
function isUuid(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
function absent(error: unknown): boolean { return error instanceof Error && error.message.includes("EXSPECSO_CONTAINMENT_ENOENT"); }
function sameObject(left: DirectoryCapability, right: DirectoryCapability): boolean { const a = left.stat(); const b = right.stat(); return a.device === b.device && a.inode === b.inode; }
async function canonicalRoot(rootInput: string): Promise<string> { const root = resolve(rootInput); try { return await realpath(root); } catch { return root; } }
async function accessRoot(rootInput: string, rootDirectory?: DirectoryCapability): Promise<DirectoryAccess> {
  const root = await canonicalRoot(rootInput);
  if (rootDirectory !== undefined) return { root, directory: rootDirectory, close() {} };
  const ownedFilesystem = openContainedFilesystem(root);
  return { root, directory: ownedFilesystem.root, ownedFilesystem, close() { ownedFilesystem.close(); } };
}
function parseOwnerRecord(raw: Buffer, root: string, recordName: string): OwnerRecord | undefined {
  try {
    const record = JSON.parse(raw.toString("utf8")) as Partial<OwnerRecord>;
    if (record.schemaVersion !== ownershipSchemaVersion || !Number.isInteger(record.pid) || (record.pid ?? 0) <= 0 || !isUuid(record.token) || record.rootFingerprint !== sha256(root) || ownerFileName(record.token) !== recordName) return undefined;
    return record as OwnerRecord;
  } catch { return undefined; }
}
function liveness(record: OwnerRecord): "busy" | "stale" { try { process.kill(record.pid, 0); return "busy"; } catch (error) { return (error as NodeJS.ErrnoException).code === "ESRCH" ? "stale" : "busy"; } }
function readOnlyOwner(lock: DirectoryCapability, root: string): InitOwnershipInspection {
  let entries: string[];
  try { entries = lock.list(); } catch { return { kind: "ambiguous", message: "cannot read initialization ownership directory" }; }
  if (entries.length !== 1 || !entries[0].startsWith(ownerFilePrefix) || !entries[0].endsWith(ownerFileSuffix)) return { kind: "ambiguous", message: "initialization ownership directory has unknown entries" };
  const recordName = entries[0];
  let file;
  try { file = lock.openFile(recordName); } catch { return { kind: "ambiguous", message: "initialization ownership record is unreadable" }; }
  let record: OwnerRecord | undefined;
  try { record = parseOwnerRecord(file.read(), root, recordName); } finally { file.close(); }
  if (record === undefined) return { kind: "ambiguous", message: "initialization ownership record is invalid" };
  return liveness(record) === "stale" ? { kind: "stale", token: record.token, recordName, record } : { kind: "busy", message: "initialization is already in progress" };
}

/** Inspects a published owner directory without granting pathname mutation authority. */
export async function inspectInitOwnership(rootInput: string, rootDirectory?: DirectoryCapability): Promise<InitOwnershipInspection> {
  const access = await accessRoot(rootInput, rootDirectory);
  let operational: DirectoryCapability | undefined; let lock: DirectoryCapability | undefined;
  try {
    try { operational = access.directory.openDirectory(".exspecso"); } catch (error) { return absent(error) ? { kind: "none" } : { kind: "ambiguous", message: "cannot inspect initialization ownership" }; }
    try { lock = operational.openDirectory(".init.lock"); }
    catch (error) {
      if (absent(error)) return { kind: "none" };
      try { const legacy = operational.openFile(".init.lock"); legacy.close(); return { kind: "ambiguous", message: "legacy regular-file initialization lock requires manual inspection" }; }
      catch { return { kind: "ambiguous", message: "initialization ownership is not a directory" }; }
    }
    return readOnlyOwner(lock, access.root);
  } finally { lock?.close(); operational?.close(); access.close(); }
}

async function removeObservedStaleOwner(rootInput: string, rootDirectory: DirectoryCapability, observed: Extract<InitOwnershipInspection, { kind: "stale" }>): Promise<boolean> {
  const root = await canonicalRoot(rootInput);
  let operational: DirectoryCapability | undefined; let lock: DirectoryCapability | undefined;
  try {
    operational = rootDirectory.openDirectory(".exspecso"); lock = operational.openDirectory(".init.lock");
    const current = readOnlyOwner(lock, root);
    if (current.kind !== "stale" || current.token !== observed.token || current.recordName !== observed.recordName) return false;
    lock.unlink(observed.recordName);
    const namedLock = operational.openDirectory(".init.lock");
    try { if (!sameObject(namedLock, lock)) return false; } finally { namedLock.close(); }
    operational.removeDirectory(".init.lock"); return true;
  } catch { return false; } finally { lock?.close(); operational?.close(); }
}
function inspectOwnershipCandidates(root: string, operational: DirectoryCapability): CandidateInspection {
  let entries: string[];
  try { entries = operational.list(); } catch { return { kind: "ambiguous", message: "cannot inspect initialization ownership candidates" }; }
  const candidates: ObservedDeadCandidate[] = [];
  for (const name of entries.filter((entry) => entry.startsWith(candidatePrefix))) {
    const token = name.slice(candidatePrefix.length);
    if (!isUuid(token)) return { kind: "ambiguous", message: "interrupted initialization ownership candidate was preserved for inspection" };
    let candidate: DirectoryCapability | undefined;
    try {
      candidate = operational.openDirectory(name); const records = candidate.list();
      if (records.length !== 1) return { kind: "ambiguous", message: "interrupted initialization ownership candidate was preserved for inspection" };
      const recordName = records[0]; const file = candidate.openFile(recordName);
      let record: OwnerRecord | undefined; try { record = parseOwnerRecord(file.read(), root, recordName); } finally { file.close(); }
      if (record === undefined || record.token !== token || liveness(record) !== "stale") return { kind: "ambiguous", message: "interrupted initialization ownership candidate was preserved for inspection" };
      candidates.push({ name, token, recordName });
    } catch { return { kind: "ambiguous", message: "interrupted initialization ownership candidate was preserved for inspection" }; }
    finally { candidate?.close(); }
  }
  return candidates.length === 0 ? { kind: "none" } : { kind: "stale", candidates };
}
function removeObservedDeadCandidate(root: string, operational: DirectoryCapability, observed: ObservedDeadCandidate): boolean {
  let candidate: DirectoryCapability | undefined;
  try {
    candidate = operational.openDirectory(observed.name); const records = candidate.list();
    if (records.length !== 1 || records[0] !== observed.recordName) return false;
    const file = candidate.openFile(observed.recordName);
    let record: OwnerRecord | undefined; try { record = parseOwnerRecord(file.read(), root, observed.recordName); } finally { file.close(); }
    if (record === undefined || record.token !== observed.token || liveness(record) !== "stale") return false;
    candidate.unlink(observed.recordName); candidate.close(); candidate = undefined; operational.removeDirectory(observed.name); return true;
  } catch { return false; } finally { candidate?.close(); }
}
async function signalExternalOwnershipPublication(): Promise<void> {
  const signalPath = process.env.EXSPECSO_TEST_OWNERSHIP_SYNC_FILE;
  if (signalPath === undefined) return;
  await writeFile(signalPath, `${JSON.stringify({ point: "after-ownership-publication", pid: process.pid })}\n`, "utf8");
  if (process.env.EXSPECSO_TEST_WAIT_FOR_OWNERSHIP_KILL === "1") await new Promise<void>(() => { setInterval(() => undefined, 1_000); });
}
async function publishOwnership(root: string, rootDirectory: DirectoryCapability, ownedFilesystem?: RootCapability): Promise<InitOwnershipAcquisition> {
  let operational: DirectoryCapability | undefined; let candidate: DirectoryCapability | undefined; let lock: DirectoryCapability | undefined;
  const token = randomUUID(); const candidateName = `${candidatePrefix}${token}`; const recordName = ownerFileName(token);
  try {
    operational = rootDirectory.openDirectory(".exspecso", true); candidate = operational.createDirectory(candidateName);
    const record = candidate.createFile(recordName);
    try { record.write(Buffer.from(`${JSON.stringify({ schemaVersion: ownershipSchemaVersion, pid: process.pid, token, rootFingerprint: sha256(root) })}\n`, "utf8")); record.sync(); } finally { record.close(); }
    candidate.sync(); operational.sync(); operational.publishDirectory(candidate, ".init.lock"); candidate.close(); candidate = undefined; operational.sync();
    lock = operational.openDirectory(".init.lock"); await signalExternalOwnershipPublication();
    return { kind: "acquired", ownership: { [ownershipBrand]: true, root, token, recordName, rootDirectory, operationalDirectory: operational, lockDirectory: lock, ownedFilesystem, state: "acquired" } };
  } catch (error) {
    try { candidate?.unlink(recordName); } catch {} try { candidate?.close(); operational?.removeDirectory(candidateName); } catch {}
    candidate?.close(); operational?.close(); ownedFilesystem?.close();
    if (error instanceof Error && /EEXIST|ENOTEMPTY|already exists/i.test(error.message)) {
      const inspection = await inspectInitOwnership(root, rootDirectory);
      return inspection.kind === "ambiguous" ? { kind: "ambiguous", message: inspection.message } : { kind: "busy", message: inspection.kind === "none" ? "initialization ownership changed during acquisition" : "initialization is already in progress" };
    }
    return { kind: "ambiguous", message: "cannot publish initialization ownership" };
  }
}

/** Atomically publishes a unique owner directory, reclaiming only identified dead evidence. */
export async function acquireInitOwnership(rootInput: string, options: AcquireInitOwnershipOptions = {}): Promise<InitOwnershipAcquisition> {
  const access = await accessRoot(rootInput, options.rootDirectory); const root = access.root;
  try {
    let inspection = await inspectInitOwnership(root, access.directory);
    if (inspection.kind === "busy" || inspection.kind === "ambiguous") { access.close(); return inspection; }
    if (inspection.kind === "stale") {
      await options.onStaleOwnerObserved?.();
      if (!await removeObservedStaleOwner(root, access.directory, inspection)) { access.close(); return { kind: "busy", message: "initialization ownership changed during stale-owner reclamation" }; }
      inspection = await inspectInitOwnership(root, access.directory);
      if (inspection.kind !== "none") { access.close(); return inspection.kind === "ambiguous" ? inspection : { kind: "busy", message: "initialization ownership changed during stale-owner reclamation" }; }
    }
    let operational: DirectoryCapability | undefined;
    try { operational = access.directory.openDirectory(".exspecso"); } catch (error) { if (!absent(error)) { access.close(); return { kind: "ambiguous", message: "cannot inspect initialization ownership candidates" }; } }
    const candidates = operational === undefined ? { kind: "none" } as CandidateInspection : inspectOwnershipCandidates(root, operational); operational?.close();
    if (candidates.kind === "ambiguous") { access.close(); return candidates; }
    const published = await publishOwnership(root, access.directory, access.ownedFilesystem);
    if (published.kind !== "acquired" || candidates.kind !== "stale") return published;
    for (const candidate of candidates.candidates) if (!removeObservedDeadCandidate(root, published.ownership.operationalDirectory, candidate)) {
      await releaseInitOwnership(published.ownership); return { kind: "ambiguous", message: "initialization ownership candidate changed during cleanup" };
    }
    return published;
  } catch (error) { access.close(); return { kind: "ambiguous", message: error instanceof Error ? error.message : "cannot inspect initialization ownership" }; }
}

/** Releases only the UUID record from the original bound directory; repeated release is harmless. */
export async function releaseInitOwnership(ownership: InitOwnership): Promise<void> {
  const mutable = ownership as HeldOwnership;
  if (mutable.state === "released") return;
  mutable.state = "released";
  try {
    const current = readOnlyOwner(mutable.lockDirectory, mutable.root);
    if (current.kind === "ambiguous" || current.kind === "none") return;
    if (current.kind === "stale" && (current.token !== mutable.token || current.recordName !== mutable.recordName)) return;
    if (current.kind === "busy") {
      const record = mutable.lockDirectory.openFile(mutable.recordName);
      try { if (parseOwnerRecord(record.read(), mutable.root, mutable.recordName)?.token !== mutable.token) return; }
      finally { record.close(); }
    }
    mutable.lockDirectory.unlink(mutable.recordName);
    const namedLock = mutable.operationalDirectory.openDirectory(".init.lock");
    try { if (sameObject(namedLock, mutable.lockDirectory)) mutable.operationalDirectory.removeDirectory(".init.lock"); } finally { namedLock.close(); }
    const namedOperational = mutable.rootDirectory.openDirectory(".exspecso");
    try { if (sameObject(namedOperational, mutable.operationalDirectory)) mutable.rootDirectory.removeDirectory(".exspecso"); }
    finally { namedOperational.close(); }
  } catch {
    // Changed or unreadable evidence is intentionally preserved.
  } finally {
    try { mutable.lockDirectory.close(); } finally { try { mutable.operationalDirectory.close(); } finally { mutable.ownedFilesystem?.close(); } }
  }
}
