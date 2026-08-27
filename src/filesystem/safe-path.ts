import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { sha256 } from "../adapters/managed-file.js";

export interface SafePlannedWrite {
  readonly target: string;
  readonly relativePath: string;
  readonly expectedExists: boolean;
  readonly expectedPreimageHash?: string;
}

function within(root: string, candidate: string): boolean {
  const pathFromRoot = relative(root, candidate);
  return pathFromRoot !== "" && pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot);
}

async function existingSegments(root: string, target: string): Promise<string[]> {
  const segments: string[] = [];
  let current = root;
  const suffix = relative(root, target).split(sep);
  for (const segment of suffix) {
    current = resolve(current, segment);
    try {
      await lstat(current);
      segments.push(current);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return segments;
}

/**
 * Reject a proposed target before any transaction filesystem state is created.
 * Existing symlinks are deliberately rejected instead of followed: transaction
 * plans are expressed against the discovered Git root, never an indirection.
 */
export async function assertSafeTarget(root: string, write: SafePlannedWrite): Promise<void> {
  const canonicalRoot = await realpath(root);
  const declaredTarget = resolve(write.target);
  const declaredRoot = resolve(root);
  const target = resolve(canonicalRoot, write.relativePath);
  if (declaredTarget !== resolve(declaredRoot, write.relativePath) || !within(canonicalRoot, target) || write.relativePath.startsWith("../") || isAbsolute(write.relativePath)) {
    throw new Error(`EXSPECSO_TRANSACTION_UNSAFE_TARGET: ${write.relativePath}`);
  }

  for (const segment of await existingSegments(canonicalRoot, target)) {
    const metadata = await lstat(segment);
    if (metadata.isSymbolicLink()) {
      throw new Error(`EXSPECSO_TRANSACTION_SYMLINK_TARGET: ${write.relativePath}`);
    }
  }

  try {
    const metadata = await lstat(target);
    if (!metadata.isFile()) throw new Error(`EXSPECSO_TRANSACTION_UNSUPPORTED_TARGET: ${write.relativePath}`);
    const actual = await readFile(target, "utf8");
    if (!write.expectedExists || sha256(actual) !== write.expectedPreimageHash) {
      throw new Error(`EXSPECSO_TRANSACTION_STALE_PREIMAGE: ${write.relativePath}`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      if (write.expectedExists) throw new Error(`EXSPECSO_TRANSACTION_STALE_PREIMAGE: ${write.relativePath}`);
      return;
    }
    throw error;
  }
}

export async function assertSafeTransactionPaths(root: string, writes: readonly SafePlannedWrite[]): Promise<void> {
  const seen = new Set<string>();
  for (const write of writes) {
    if (seen.has(write.relativePath)) throw new Error(`EXSPECSO_TRANSACTION_DUPLICATE_TARGET: ${write.relativePath}`);
    seen.add(write.relativePath);
    await assertSafeTarget(root, write);
  }
}
