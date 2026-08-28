import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { sha256 } from "../adapters/managed-file.js";
import { validateProject } from "../artifacts/validate.js";
import { type DirectoryCapability } from "./contained-fs.js";
import {
  parseTransactionJournal,
  type LegacyTransactionJournal,
  type TransactionJournal,
  type TransactionJournalEntry,
} from "./journal.js";
import { readBoundTransactionJournal, removeRecoveredTransactionBound, stagingRelativePath } from "./transaction.js";
import { acquireInitOwnership, inspectInitOwnership, releaseInitOwnership, type InitOwnership } from "./ownership.js";

export type RecoveryResult =
  | { readonly kind: "none" }
  | { readonly kind: "recovered"; readonly transactionId: string; readonly disposition: "restored-prior" }
  | { readonly kind: "busy" }
  | { readonly kind: "ambiguous"; readonly message: string };

function components(path: string): string[] { return path.split("/").filter(Boolean); }
function absent(error: unknown): boolean { return error instanceof Error && error.message.includes("EXSPECSO_CONTAINMENT_ENOENT"); }
function withDirectory<T>(root: DirectoryCapability, path: readonly string[], create: boolean, action: (directory: DirectoryCapability) => T): T {
  let directory = root;
  const opened: DirectoryCapability[] = [];
  try {
    for (const component of path) { directory = directory.openDirectory(component, create); opened.push(directory); }
    return action(directory);
  } finally { for (const capability of opened.reverse()) capability.close(); }
}
function readOptionalBound(root: DirectoryCapability, path: readonly string[]): Buffer | undefined {
  const name = path.at(-1);
  if (!name) throw new Error("EXSPECSO_RECOVERY_PATH");
  try {
    return withDirectory(root, path.slice(0, -1), false, (parent) => {
      const file = parent.openFile(name);
      try { return file.read(); } finally { file.close(); }
    });
  } catch (error) { if (absent(error)) return undefined; throw error; }
}
function hash(bytes: Buffer | undefined): string | null { return bytes === undefined ? null : sha256(bytes.toString("utf8")); }
function priorHash(entry: TransactionJournalEntry): string | null { return entry.preimageHash; }
function expectedBackup(entry: TransactionJournalEntry): string | null { return entry.preimageHash === null ? null : entry.preimageHash; }

function allowedHashes(journal: TransactionJournal, entry: TransactionJournalEntry): readonly (string | null)[] {
  if (journal.state === "restoring") return [priorHash(entry), entry.stagedHash];
  if (journal.state === "cleaning") return [priorHash(entry)];
  if (journal.completedPromotions.includes(entry.relativePath)) return [entry.stagedHash];
  if (journal.inFlight?.relativePath === entry.relativePath && journal.inFlight.operation === "replace") return [priorHash(entry), entry.stagedHash];
  return [priorHash(entry)];
}
function evidenceError(root: DirectoryCapability, stage: DirectoryCapability, journal: TransactionJournal): string | null {
  for (const entry of journal.entries) {
    const target = readOptionalBound(root, components(entry.relativePath));
    if (journal.state === "cleaning") {
      const terminalHash = journal.completedPromotions.length === journal.entries.length ? entry.stagedHash : priorHash(entry);
      if (hash(target) !== terminalHash) return `canonical hash mismatch for ${entry.relativePath}`;
      continue;
    }
    const staged = readOptionalBound(stage, ["files", ...components(entry.relativePath)]);
    if (hash(staged) !== entry.stagedHash) return `staged hash mismatch for ${entry.relativePath}`;
    const backup = entry.backupPath === null ? undefined : readOptionalBound(stage, components(entry.backupPath));
    if (hash(backup) !== expectedBackup(entry) || entry.backupHash !== expectedBackup(entry)) return `backup hash mismatch for ${entry.relativePath}`;
    if (!allowedHashes(journal, entry).includes(hash(target))) return `canonical hash mismatch for ${entry.relativePath}`;
  }
  return null;
}
function legacyEvidenceError(root: DirectoryCapability, stage: DirectoryCapability, journal: LegacyTransactionJournal): string | null {
  // Schema 1 did not record intent before replacement. Only untouched prior
  // evidence is safe to inspect; every other historical state is retained.
  if (journal.completedStep !== -1) return "legacy journal has insufficient replacement evidence";
  for (const entry of journal.entries) {
    const target = readOptionalBound(root, components(entry.relativePath));
    const staged = readOptionalBound(stage, ["files", ...components(entry.relativePath)]);
    if (hash(staged) !== entry.stagedHash) return `staged hash mismatch for ${entry.relativePath}`;
    const backup = entry.backupPath === null ? undefined : readOptionalBound(stage, components(entry.backupPath));
    if (hash(backup) !== expectedBackup(entry) || entry.backupHash !== expectedBackup(entry)) return `backup hash mismatch for ${entry.relativePath}`;
    if (hash(target) !== priorHash(entry)) return `legacy journal prior state is incomplete for ${entry.relativePath}`;
  }
  return null;
}
function writeJournal(stage: DirectoryCapability, journal: TransactionJournal): void {
  const temporary = stage.createFile(`.exspecso-journal-${randomUUID()}`);
  try {
    temporary.write(Buffer.from(`${JSON.stringify(journal, null, 2)}\n`, "utf8"));
    temporary.sync();
    stage.replace(temporary, "journal.json");
    stage.sync();
  } finally { temporary.close(); }
}
function replaceFromBound(parent: DirectoryCapability, target: string, content: Buffer): void {
  const temporary = parent.createFile(`.exspecso-recover-${randomUUID()}`);
  try {
    temporary.write(content);
    temporary.sync();
    parent.replace(temporary, target, true);
    parent.sync();
  } finally { temporary.close(); }
}
function restorePrior(root: DirectoryCapability, stage: DirectoryCapability, journal: TransactionJournal): TransactionJournal {
  let current: TransactionJournal = { ...journal, state: "restoring", inFlight: null };
  writeJournal(stage, current);
  for (const entry of current.entries) {
    const observed = hash(readOptionalBound(root, components(entry.relativePath)));
    if (observed === priorHash(entry)) continue;
    if (observed !== entry.stagedHash) throw new Error(`EXSPECSO_RECOVERY_AMBIGUOUS_TARGET: ${entry.relativePath}`);
    current = { ...current, inFlight: { relativePath: entry.relativePath, operation: entry.preimageHash === null ? "remove" as const : "restore" as const } };
    writeJournal(stage, current);
    withDirectory(root, components(entry.relativePath).slice(0, -1), false, (parent) => {
      const name = components(entry.relativePath).at(-1)!;
      if (entry.preimageHash === null) parent.unlink(name);
      else {
        const backup = readOptionalBound(stage, components(entry.backupPath!));
        if (backup === undefined || hash(backup) !== entry.preimageHash) throw new Error(`EXSPECSO_RECOVERY_BACKUP: ${entry.relativePath}`);
        replaceFromBound(parent, name, backup);
      }
    });
    if (hash(readOptionalBound(root, components(entry.relativePath))) !== priorHash(entry)) throw new Error(`EXSPECSO_RECOVERY_HASH: ${entry.relativePath}`);
    current = { ...current, inFlight: null };
    writeJournal(stage, current);
  }
  current = { ...current, state: "cleaning", inFlight: null };
  writeJournal(stage, current);
  return current;
}

/** Recovery follows only held directory capabilities; ambiguous evidence is retained. */
export async function recoverInterruptedTransaction(rootInput: string, ownership?: InitOwnership): Promise<RecoveryResult> {
  const root = resolve(rootInput);
  let heldOwnership = ownership;
  let ownsLease = false;
  if (heldOwnership === undefined) {
    const acquisition = await acquireInitOwnership(root);
    if (acquisition.kind === "busy") return { kind: "busy" };
    if (acquisition.kind === "ambiguous") return { kind: "ambiguous", message: acquisition.message };
    heldOwnership = acquisition.ownership;
    ownsLease = true;
  }
  let staging: DirectoryCapability | undefined;
  let stage: DirectoryCapability | undefined;
  try {
    try { staging = heldOwnership.operationalDirectory.openDirectory(".staging"); }
    catch (error) { return absent(error) ? { kind: "none" } : { kind: "ambiguous", message: "cannot inspect transaction staging directory" }; }
    const directories = staging.list().sort();
    if (directories.length === 0) return { kind: "none" };
    if (directories.length !== 1) return { kind: "ambiguous", message: "multiple transaction staging directories found" };
    const transactionId = directories[0]!;
    try { stage = staging.openDirectory(transactionId); }
    catch { return { kind: "ambiguous", message: "transaction staging entry is unreadable" }; }
    let raw: unknown;
    try { raw = readBoundTransactionJournal(stage); }
    catch { return { kind: "ambiguous", message: "transaction journal is unreadable" }; }
    const parsed = parseTransactionJournal(raw, transactionId, sha256(root));
    if (parsed.kind === "invalid") return { kind: "ambiguous", message: parsed.message };
    if (parsed.kind === "legacy") {
      let issue: string | null;
      try { issue = legacyEvidenceError(heldOwnership.rootDirectory, stage, parsed.journal); }
      catch { return { kind: "ambiguous", message: "legacy journal evidence cannot be read through containment" }; }
      if (issue !== null) return { kind: "ambiguous", message: issue };
      try {
        // The only accepted schema-1 state proves no replacement happened.
        // Its canonical bytes are already prior, so remove just its identified
        // operational evidence without rewriting any product artifact.
        removeRecoveredTransactionBound(heldOwnership.rootDirectory, stage, staging, {
          ...parsed.journal,
          schemaVersion: 2,
          state: "cleaning",
          inFlight: null,
          completedPromotions: [],
        });
        stage = undefined;
        staging = undefined;
        try { heldOwnership.operationalDirectory.removeDirectory(".staging"); } catch { /* unknown staging evidence remains */ }
        return { kind: "recovered", transactionId, disposition: "restored-prior" };
      } catch { return { kind: "ambiguous", message: "legacy journal evidence could not be cleaned safely" }; }
    }
    let issue: string | null;
    try { issue = evidenceError(heldOwnership.rootDirectory, stage, parsed.journal); }
    catch { return { kind: "ambiguous", message: "transaction evidence cannot be read through containment" }; }
    if (issue !== null) return { kind: "ambiguous", message: issue };
    let recovered: TransactionJournal;
    try {
      recovered = restorePrior(heldOwnership.rootDirectory, stage, parsed.journal);
      if ((await validateProject(root)).length > 0) return { kind: "ambiguous", message: "restored canonical set does not validate" };
    } catch { return { kind: "ambiguous", message: "could not restore the validated prior canonical set" }; }
    try {
      removeRecoveredTransactionBound(heldOwnership.rootDirectory, stage, staging, recovered);
      stage = undefined;
      staging = undefined;
      try { heldOwnership.operationalDirectory.removeDirectory(".staging"); } catch { /* unknown staging evidence remains */ }
      return { kind: "recovered", transactionId, disposition: "restored-prior" };
    } catch { return { kind: "ambiguous", message: "restored evidence could not be cleaned safely" }; }
  } finally {
    stage?.close();
    staging?.close();
    if (ownsLease && heldOwnership !== undefined) await releaseInitOwnership(heldOwnership);
  }
}

export async function hasActiveTransaction(rootInput: string): Promise<boolean> {
  const inspection = await inspectInitOwnership(rootInput);
  return inspection.kind !== "none" && inspection.kind !== "stale";
}
