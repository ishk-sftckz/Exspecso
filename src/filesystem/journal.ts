export const transactionSchemaVersion = 2;

export type TransactionState = "preparing" | "prepared" | "promoting" | "restoring" | "cleaning";
export type TransactionOperation = "replace" | "restore" | "remove";

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
  readonly state: TransactionState;
  readonly inFlight: { readonly relativePath: string; readonly operation: TransactionOperation } | null;
  readonly completedPromotions: readonly string[];
  /** Compatibility projection only; recovery uses per-entry evidence in schema 2. */
  readonly completedStep: number;
}

export interface LegacyTransactionJournal {
  readonly schemaVersion: 1;
  readonly transactionId: string;
  readonly repositoryRootFingerprint: string;
  readonly entries: readonly TransactionJournalEntry[];
  readonly promotionOrder: readonly string[];
  readonly completedStep: number;
}

export type ParsedTransactionJournal =
  | { readonly kind: "current"; readonly journal: TransactionJournal }
  | { readonly kind: "legacy"; readonly journal: LegacyTransactionJournal }
  | { readonly kind: "invalid"; readonly message: string };

const hash = /^[a-f0-9]{64}$/;
const states = new Set<TransactionState>(["preparing", "prepared", "promoting", "restoring", "cleaning"]);
const operations = new Set<TransactionOperation>(["replace", "restore", "remove"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isContainedRelativePath(value: unknown): value is string {
  return typeof value === "string" && value !== "" && !value.startsWith("../") && !value.includes("\\") && !value.split("/").some((part) => part === "" || part === "." || part === "..");
}

function validEntries(value: unknown): value is readonly TransactionJournalEntry[] {
  return Array.isArray(value) && value.length > 0 && value.every((entry) => isRecord(entry)
    && isContainedRelativePath(entry.relativePath)
    && typeof entry.stagedHash === "string" && hash.test(entry.stagedHash)
    && (entry.preimageHash === null || typeof entry.preimageHash === "string" && hash.test(entry.preimageHash))
    && (entry.backupPath === null || isContainedRelativePath(entry.backupPath))
    && (entry.backupHash === null || typeof entry.backupHash === "string" && hash.test(entry.backupHash)));
}

function baseError(value: Record<string, unknown>, transactionId: string, repositoryRootFingerprint: string): string | null {
  if (value.transactionId !== transactionId) return "journal transaction identity does not match its directory";
  if (value.repositoryRootFingerprint !== repositoryRootFingerprint) return "journal repository root fingerprint does not match";
  if (!validEntries(value.entries)) return "journal entries are invalid";
  const entries = value.entries;
  if (!Array.isArray(value.promotionOrder) || value.promotionOrder.length !== entries.length || value.promotionOrder.some((path, index) => path !== entries[index]!.relativePath)) return "journal promotion order is invalid";
  if (new Set(value.promotionOrder).size !== value.promotionOrder.length) return "journal promotion order is invalid";
  return null;
}

/** Parse only self-identifying recovery evidence; malformed data is never inferred. */
export function parseTransactionJournal(value: unknown, transactionId: string, repositoryRootFingerprint: string): ParsedTransactionJournal {
  if (!isRecord(value) || typeof value.schemaVersion !== "number") return { kind: "invalid", message: "transaction journal is malformed" };
  const error = baseError(value, transactionId, repositoryRootFingerprint);
  if (error !== null) return { kind: "invalid", message: error };
  if (value.schemaVersion === 1) {
    const entries = value.entries as readonly TransactionJournalEntry[];
    const completedStep = value.completedStep;
    if (typeof completedStep !== "number" || !Number.isInteger(completedStep) || completedStep < -1 || completedStep >= entries.length) return { kind: "invalid", message: "legacy journal promotion state is invalid" };
    return { kind: "legacy", journal: value as unknown as LegacyTransactionJournal };
  }
  if (value.schemaVersion !== transactionSchemaVersion) return { kind: "invalid", message: "unsupported journal schema" };
  if (typeof value.state !== "string" || !states.has(value.state as TransactionState)) return { kind: "invalid", message: "journal state is invalid" };
  const inFlight = value.inFlight;
  const promotionOrder = value.promotionOrder as readonly string[];
  if (inFlight !== null && (!isRecord(inFlight) || !isContainedRelativePath(inFlight.relativePath) || !operations.has(inFlight.operation as TransactionOperation) || !promotionOrder.includes(inFlight.relativePath))) return { kind: "invalid", message: "journal in-flight operation is invalid" };
  if (!Array.isArray(value.completedPromotions) || value.completedPromotions.some((path) => !isContainedRelativePath(path) || !promotionOrder.includes(path)) || new Set(value.completedPromotions).size !== value.completedPromotions.length) return { kind: "invalid", message: "journal completed promotion evidence is invalid" };
  if (typeof value.completedStep !== "number" || !Number.isInteger(value.completedStep) || value.completedStep < -1 || value.completedStep >= promotionOrder.length) return { kind: "invalid", message: "journal compatibility state is invalid" };
  if (value.state === "preparing" && (inFlight !== null || value.completedPromotions.length !== 0 || value.completedStep !== -1)) return { kind: "invalid", message: "preparing journal has promotion evidence" };
  return { kind: "current", journal: value as unknown as TransactionJournal };
}
