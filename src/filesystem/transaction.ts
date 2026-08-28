import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { sha256 } from "../adapters/managed-file.js";
import type { PlannedWrite } from "../init/plan.js";
import { assertSafeTarget, assertSafeTransactionPaths } from "./safe-path.js";
import { acquireInitOwnership, inspectInitOwnership, releaseInitOwnership, type InitOwnership } from "./ownership.js";
import { openContainedFilesystem, type RootCapability } from "./contained-fs.js";

export const transactionSchemaVersion = 1;
export const stagingRelativePath = ".exspecso/.staging";
export { lockRelativePath } from "./ownership.js";

export interface TransactionJournalEntry {
  readonly relativePath: string;
  readonly preimageHash: string | null;
  readonly stagedHash: string;
  readonly backupPath: string | null;
  readonly backupHash: string | null;
}

export interface TransactionJournal {
  readonly schemaVersion: typeof transactionSchemaVersion;
  readonly transactionId: string;
  readonly repositoryRootFingerprint: string;
  readonly entries: readonly TransactionJournalEntry[];
  readonly promotionOrder: readonly string[];
  readonly completedStep: number;
}

export type TransactionResult =
  | { readonly kind: "committed"; readonly transactionId: string }
  | { readonly kind: "no-op" }
  | { readonly kind: "busy" }
  | { readonly kind: "failed"; readonly transactionId: string; readonly error: Error };

export type PromotionFaultPoint = `after-promotion:${string}`;

export interface CommitTransactionOptions {
  /** Test-only deterministic seam. It never changes the production state machine. */
  readonly faultAt?: PromotionFaultPoint;
  readonly faultMode?: "throw" | "interrupt";
  readonly onPromotion?: (point: PromotionFaultPoint) => void | Promise<void>;
  readonly onReadyToPromote?: () => void | Promise<void>;
  readonly validateStaged?: (stageRoot: string) => void | Promise<void>;
  /** Internal caller-owned lease; nested transaction work never releases it. */
  readonly ownership?: InitOwnership;
}

function faultPoint(relativePath: string): PromotionFaultPoint {
  return `after-promotion:${relativePath}`;
}

function stageFile(stageRoot: string, relativePath: string): string {
  return join(stageRoot, "files", relativePath);
}

function backupFile(stageRoot: string, relativePath: string): string {
  return join(stageRoot, "backups", relativePath);
}

export function journalPath(stageRoot: string): string {
  return join(stageRoot, "journal.json");
}

async function writeSynced(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, "w");
  try {
    await handle.writeFile(content, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
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
    // Directory syncing is unavailable on some supported filesystems. The
    // journal/recovery contract remains explicitly process-level (D-19).
  }
}

async function readOptional(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function removeKnownTransaction(stageRoot: string, journal: TransactionJournal): Promise<void> {
  const directories = new Set<string>([join(stageRoot, "files"), join(stageRoot, "backups"), stageRoot]);
  for (const entry of journal.entries) {
    const staged = stageFile(stageRoot, entry.relativePath);
    await rm(staged, { force: true });
    for (let current = dirname(staged); current.startsWith(stageRoot); current = dirname(current)) directories.add(current);
    if (entry.backupPath !== null) {
      const backup = join(stageRoot, entry.backupPath);
      await rm(backup, { force: true });
      for (let current = dirname(backup); current.startsWith(stageRoot); current = dirname(current)) directories.add(current);
    }
  }
  await rm(journalPath(stageRoot), { force: true });
  for (const directory of [...directories].sort((left, right) => right.length - left.length)) {
    await rmdir(directory).catch(() => undefined);
  }
  await rmdir(dirname(stageRoot)).catch(() => undefined);
}

async function updateJournal(stageRoot: string, journal: TransactionJournal): Promise<TransactionJournal> {
  await writeSynced(journalPath(stageRoot), `${JSON.stringify(journal, null, 2)}\n`);
  await syncDirectory(stageRoot);
  return journal;
}

async function signalExternalFault(point: PromotionFaultPoint): Promise<void> {
  const signalPath = process.env.EXSPECSO_TEST_SYNC_FILE;
  if (signalPath === undefined || process.env.EXSPECSO_TEST_FAULT_POINT !== point) return;
  await writeFile(signalPath, `${JSON.stringify({ point, pid: process.pid })}\n`, "utf8");
  if (process.env.EXSPECSO_TEST_WAIT_FOR_KILL === "1") {
    await new Promise<void>(() => { setInterval(() => undefined, 1_000); });
  }
}

function environmentFaultOptions(): CommitTransactionOptions {
  const point = process.env.EXSPECSO_TEST_FAULT_POINT;
  if (point !== undefined && point.startsWith("after-promotion:")) {
    return { faultAt: point as PromotionFaultPoint, faultMode: process.env.EXSPECSO_TEST_FAULT_MODE === "interrupt" ? "interrupt" : "throw" };
  }
  return {};
}

/**
 * Stages and journals the whole mutation set before promoting any output. A
 * failure intentionally retains the identified journal and byte copies for
 * conservative next-invocation recovery; only a validated success cleans it.
 */
export async function commitTransaction(plan: { readonly repositoryRoot: string; readonly writes: readonly PlannedWrite[] }, options: CommitTransactionOptions = environmentFaultOptions()): Promise<TransactionResult> {
  const root = resolve(plan.repositoryRoot);
  if (plan.writes.length === 0) return { kind: "no-op" };
  const transactionId = randomUUID();
  let filesystem: RootCapability | undefined;
  try {
    filesystem = openContainedFilesystem(root);
    await assertSafeTransactionPaths(root, plan.writes);
  } catch (error) {
    filesystem?.close();
    return { kind: "failed", transactionId, error: error instanceof Error ? error : new Error(String(error)) };
  }
  let ownership = options.ownership;
  let ownsLease = false;
  if (ownership === undefined) {
    try {
      const acquisition = await acquireInitOwnership(root, { rootDirectory: filesystem.root });
      if (acquisition.kind !== "acquired") { filesystem.close(); return { kind: "busy" }; }
      ownership = acquisition.ownership;
      ownsLease = true;
    } catch (error) {
      filesystem.close();
      return { kind: "failed", transactionId, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
  const stageRoot = join(root, stagingRelativePath, transactionId);
  let journal: TransactionJournal | undefined;
  let committed = false;
  try {
    await mkdir(dirname(stageRoot), { recursive: true });
    await mkdir(stageRoot, { recursive: false });
    const entries: TransactionJournalEntry[] = [];
    for (const write of plan.writes) {
      const current = await readOptional(write.target);
      if ((current === undefined) !== !write.expectedExists || (current !== undefined && sha256(current) !== write.expectedPreimageHash)) {
        throw new Error(`EXSPECSO_TRANSACTION_STALE_PREIMAGE: ${write.relativePath}`);
      }
      const staged = stageFile(stageRoot, write.relativePath);
      await writeSynced(staged, write.content);
      if (sha256(await readFile(staged, "utf8")) !== sha256(write.content)) throw new Error(`EXSPECSO_TRANSACTION_STAGED_HASH: ${write.relativePath}`);
      const backupPath = current === undefined ? null : join("backups", write.relativePath);
      if (current !== undefined && backupPath !== null) {
        const backup = join(stageRoot, backupPath);
        await writeSynced(backup, current);
      }
      entries.push({
        relativePath: write.relativePath,
        preimageHash: current === undefined ? null : sha256(current),
        stagedHash: sha256(write.content),
        backupPath,
        backupHash: current === undefined ? null : sha256(current),
      });
    }
    await syncDirectory(join(stageRoot, "files"));
    journal = await updateJournal(stageRoot, {
      schemaVersion: transactionSchemaVersion,
      transactionId,
      repositoryRootFingerprint: sha256(root),
      entries,
      promotionOrder: entries.map((entry) => entry.relativePath),
      completedStep: -1,
    });
    await options.validateStaged?.(stageRoot);
    await options.onReadyToPromote?.();

    for (const [index, relativePath] of journal.promotionOrder.entries()) {
      const write = plan.writes.find((candidate) => candidate.relativePath === relativePath);
      if (write === undefined) throw new Error(`EXSPECSO_TRANSACTION_JOURNAL_TARGET: ${relativePath}`);
      await assertSafeTarget(root, write);
      const components = relativePath.split("/");
      const name = components.pop()!;
      let parent = filesystem.root;
      for (const component of components) parent = parent.openDirectory(component, true);
      let existing: string | undefined;
      try {
        const file = parent.openFile(name);
        try { existing = file.read().toString("utf8"); } finally { file.close(); }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EXSPECSO_CONTAINMENT_ENOENT") throw error;
      }
      if (existing === undefined ? write.expectedExists : !write.expectedExists || sha256(existing) !== write.expectedPreimageHash) {
        throw new Error(`EXSPECSO_TRANSACTION_STALE_PREIMAGE: ${relativePath}`);
      }
      const staged = await readFile(stageFile(stageRoot, relativePath));
      if (sha256(staged.toString("utf8")) !== journal.entries[index].stagedHash) throw new Error(`EXSPECSO_TRANSACTION_STAGED_HASH: ${relativePath}`);
      const temporary = parent.createFile(`.exspecso-tmp-${randomUUID()}`);
      try {
        temporary.write(staged);
        temporary.sync();
        parent.replace(temporary, name);
        if (sha256(temporary.read().toString("utf8")) !== journal.entries[index].stagedHash) throw new Error(`EXSPECSO_TRANSACTION_PROMOTION_HASH: ${relativePath}`);
        parent.sync();
      } finally { temporary.close(); }
      journal = await updateJournal(stageRoot, { ...journal, completedStep: index });
      const point = faultPoint(relativePath);
      await options.onPromotion?.(point);
      await signalExternalFault(point);
      if (options.faultAt === point) {
        if (options.faultMode === "interrupt") throw new Error(`EXSPECSO_TRANSACTION_TEST_INTERRUPT: ${point}`);
        throw new Error(`EXSPECSO_TRANSACTION_TEST_FAULT: ${point}`);
      }
    }
    committed = true;
    await removeKnownTransaction(stageRoot, journal);
    return { kind: "committed", transactionId };
  } catch (error) {
    return { kind: "failed", transactionId, error: error instanceof Error ? error : new Error(String(error)) };
  } finally {
    try {
      filesystem.close();
      if (committed && journal !== undefined) await rmdir(join(root, ".exspecso", ".staging")).catch(() => undefined);
    } finally {
      if (ownsLease && ownership !== undefined) await releaseInitOwnership(ownership);
    }
  }
}

export async function readTransactionJournal(stageRoot: string): Promise<TransactionJournal> {
  return JSON.parse(await readFile(journalPath(stageRoot), "utf8")) as TransactionJournal;
}

export async function transactionIsActive(root: string): Promise<boolean> {
  const inspection = await inspectInitOwnership(root);
  return inspection.kind !== "none" && inspection.kind !== "stale";
}

export function transactionStageRoot(root: string, transactionId: string): string {
  return join(root, stagingRelativePath, transactionId);
}

export async function removeRecoveredTransaction(root: string, stageRoot: string, journal: TransactionJournal): Promise<void> {
  await removeKnownTransaction(stageRoot, journal);
  for (const entry of journal.entries.filter((candidate) => candidate.preimageHash === null)) {
    let current = dirname(join(root, entry.relativePath));
    while (current !== root) {
      await rmdir(current).catch(() => undefined);
      current = dirname(current);
    }
  }
}

export async function isRegularFile(path: string): Promise<boolean> {
  try {
    return (await lstat(path)).isFile();
  } catch {
    return false;
  }
}

export { backupFile, stageFile };
