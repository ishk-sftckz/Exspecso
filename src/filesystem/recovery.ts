import { lstat, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { sha256 } from "../adapters/managed-file.js";
import { validateProject } from "../artifacts/validate.js";
import { assertSafeTarget } from "./safe-path.js";
import {
  backupFile,
  isRegularFile,
  lockRelativePath,
  readTransactionJournal,
  removeRecoveredTransaction,
  stageFile,
  stagingRelativePath,
  transactionSchemaVersion,
  transactionStageRoot,
  type TransactionJournal,
} from "./transaction.js";

export type RecoveryResult =
  | { readonly kind: "none" }
  | { readonly kind: "recovered"; readonly transactionId: string; readonly disposition: "restored-prior" }
  | { readonly kind: "ambiguous"; readonly message: string };

function containedRelativePath(path: string): boolean {
  return path !== "" && !path.startsWith("../") && !path.includes("\\") && !path.split("/").some((part) => part === "" || part === "." || part === "..");
}

async function hashOptional(path: string): Promise<string | null> {
  try {
    const metadata = await lstat(path);
    if (!metadata.isFile()) return null;
    return sha256(await readFile(path, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function journalShapeIsValid(journal: TransactionJournal, transactionId: string, root: string): string | null {
  if (journal.schemaVersion !== transactionSchemaVersion) return "unsupported journal schema";
  if (journal.transactionId !== transactionId) return "journal transaction identity does not match its directory";
  if (journal.repositoryRootFingerprint !== sha256(root)) return "journal repository root fingerprint does not match";
  if (!Array.isArray(journal.entries) || journal.entries.length === 0) return "journal has no entries";
  if (journal.promotionOrder.length !== journal.entries.length || journal.completedStep < -1 || journal.completedStep >= journal.entries.length) return "journal promotion state is invalid";
  const names = new Set(journal.entries.map((entry) => entry.relativePath));
  if (names.size !== journal.entries.length || journal.promotionOrder.some((path, index) => path !== journal.entries[index].relativePath)) return "journal promotion order is invalid";
  if (journal.entries.some((entry) => !containedRelativePath(entry.relativePath) || !/^[a-f0-9]{64}$/.test(entry.stagedHash) || (entry.preimageHash !== null && !/^[a-f0-9]{64}$/.test(entry.preimageHash)) || (entry.backupHash !== null && !/^[a-f0-9]{64}$/.test(entry.backupHash)))) return "journal hashes or paths are invalid";
  return null;
}

async function validateEvidence(root: string, stageRoot: string, journal: TransactionJournal): Promise<string | null> {
  for (const [index, entry] of journal.entries.entries()) {
    const target = join(root, entry.relativePath);
    try {
      await assertSafeTarget(root, {
        target,
        relativePath: entry.relativePath,
        expectedExists: index > journal.completedStep ? entry.preimageHash !== null : true,
        ...(index > journal.completedStep && entry.preimageHash !== null ? { expectedPreimageHash: entry.preimageHash } : {}),
      });
    } catch {
      // A promoted target has a staged hash rather than its preimage. Its
      // containment/type checks are independently repeated below.
      const fromRoot = relative(root, resolve(target));
      if (!containedRelativePath(fromRoot) || !(await isRegularFile(target)) && index <= journal.completedStep) return `unsafe target ${entry.relativePath}`;
    }
    if (await hashOptional(stageFile(stageRoot, entry.relativePath)) !== entry.stagedHash) return `staged hash mismatch for ${entry.relativePath}`;
    if (entry.preimageHash === null) {
      if (entry.backupPath !== null || entry.backupHash !== null) return `unexpected backup for ${entry.relativePath}`;
    } else if (entry.backupPath !== join("backups", entry.relativePath) || await hashOptional(backupFile(stageRoot, entry.relativePath)) !== entry.backupHash || entry.backupHash !== entry.preimageHash) {
      return `backup hash mismatch for ${entry.relativePath}`;
    }
    const currentHash = await hashOptional(target);
    const expected = index <= journal.completedStep ? entry.stagedHash : entry.preimageHash;
    if (currentHash !== expected) return `canonical hash mismatch for ${entry.relativePath}`;
  }
  return null;
}

async function restorePrior(root: string, stageRoot: string, journal: TransactionJournal): Promise<void> {
  for (const [index, entry] of journal.entries.entries()) {
    const target = join(root, entry.relativePath);
    if (entry.preimageHash === null) {
      await rm(target, { force: true });
      continue;
    }
    await assertSafeTarget(root, {
      target,
      relativePath: entry.relativePath,
      expectedExists: true,
      expectedPreimageHash: index <= journal.completedStep ? entry.stagedHash : entry.preimageHash,
    });
    await writeFile(target, await readFile(backupFile(stageRoot, entry.relativePath), "utf8"), "utf8");
    if (await hashOptional(target) !== entry.preimageHash) throw new Error(`restore hash mismatch for ${entry.relativePath}`);
  }
}

/**
 * Recovers only a complete, self-identifying journal. Any unexpected path,
 * hash, root, or external canonical change is left untouched for inspection.
 */
export async function recoverInterruptedTransaction(rootInput: string): Promise<RecoveryResult> {
  const root = resolve(rootInput);
  const stagingRoot = join(root, stagingRelativePath);
  let directories: string[];
  try {
    directories = (await readdir(stagingRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { kind: "none" };
    return { kind: "ambiguous", message: "cannot inspect transaction staging directory" };
  }
  if (directories.length === 0) return { kind: "none" };
  if (directories.length !== 1) return { kind: "ambiguous", message: "multiple transaction staging directories found" };
  const transactionId = directories[0];
  const stageRoot = transactionStageRoot(root, transactionId);
  let journal: TransactionJournal;
  try {
    journal = await readTransactionJournal(stageRoot);
  } catch {
    return { kind: "ambiguous", message: "transaction journal is unreadable" };
  }
  const shapeError = journalShapeIsValid(journal, transactionId, root);
  if (shapeError !== null) return { kind: "ambiguous", message: shapeError };
  const evidenceError = await validateEvidence(root, stageRoot, journal);
  if (evidenceError !== null) return { kind: "ambiguous", message: evidenceError };
  try {
    await restorePrior(root, stageRoot, journal);
    const diagnostics = await validateProject(root);
    if (diagnostics.length > 0) return { kind: "ambiguous", message: "restored canonical set does not validate" };
    await removeRecoveredTransaction(root, stageRoot, journal);
    return { kind: "recovered", transactionId, disposition: "restored-prior" };
  } catch {
    return { kind: "ambiguous", message: "could not restore the validated prior canonical set" };
  }
}

export async function hasActiveTransaction(rootInput: string): Promise<boolean> {
  const root = resolve(rootInput);
  try {
    const raw = JSON.parse(await readFile(join(root, lockRelativePath), "utf8")) as { pid?: unknown };
    if (typeof raw.pid !== "number" || !Number.isInteger(raw.pid) || raw.pid <= 0) return false;
    try {
      process.kill(raw.pid, 0);
      return true;
    } catch (error) {
      return (error as NodeJS.ErrnoException).code === "EPERM";
    }
  } catch {
    return false;
  }
}
