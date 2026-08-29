import { closeSync, fsyncSync, fstatSync, lstatSync, mkdirSync, openSync, readSync, readdirSync, renameSync, rmdirSync, unlinkSync, writeSync } from "node:fs";
import { realpathSync } from "node:fs";
import { join } from "node:path";

export interface ProviderProvenance {
  readonly path: string;
  readonly sha256: string;
  readonly buildCommit: string;
  readonly variant: "release";
  readonly supportRowId: "node-fs";
}

export type BoundEntryKind = "directory" | "file";

/** Read-only traversal rooted at an already validated repository directory. */
export interface BoundReader {
  list(components: readonly string[]): readonly string[];
  metadata(components: readonly string[]): BoundEntryKind;
  read(components: readonly string[]): Buffer;
}

type Identity = Readonly<{ device: bigint; inode: bigint }>;

function containment(message: string): never {
  const error = new Error(`EXSPECSO_CONTAINMENT_${message}`) as Error & { code?: string };
  error.code = `EXSPECSO_CONTAINMENT_${message.split(":", 1)[0]}`;
  throw error;
}

function component(name: string): void {
  if (typeof name !== "string" || !name || name === "." || name === ".." || name.includes("/") || name.includes("\\") || name.includes("\0")) {
    containment("INVALID: every path segment must be one non-empty relative component");
  }
}

function components(parts: readonly string[]): void { for (const part of parts) component(part); }

function nodeFailure(error: unknown): never {
  if (error instanceof Error && "code" in error && typeof error.code === "string") containment(`${error.code}: ${error.message}`);
  containment(error instanceof Error ? `IO: ${error.message}` : "IO: filesystem operation failed");
}

function identity(path: string): Identity {
  try {
    const entry = lstatSync(path, { bigint: true });
    if (entry.isSymbolicLink()) containment("SYMLINK: symbolic links are not valid repository entries");
    if (!entry.isFile() && !entry.isDirectory()) containment("UNSUPPORTED_KIND: repository entries must be regular files or directories");
    return { device: entry.dev, inode: entry.ino };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("EXSPECSO_CONTAINMENT_")) throw error;
    return nodeFailure(error);
  }
}

function entryKind(path: string): BoundEntryKind {
  try {
    const entry = lstatSync(path);
    if (entry.isSymbolicLink()) containment("SYMLINK: symbolic links are not valid repository entries");
    if (entry.isDirectory()) return "directory";
    if (entry.isFile()) return "file";
    containment("UNSUPPORTED_KIND: repository entries must be regular files or directories");
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("EXSPECSO_CONTAINMENT_")) throw error;
    return nodeFailure(error);
  }
}

function sameIdentity(left: Identity, right: Identity): boolean { return left.device === right.device && left.inode === right.inode; }

function findIdentity(root: string, expected: Identity): string | undefined {
  const pending = [root];
  while (pending.length > 0) {
    const current = pending.pop()!;
    let names: string[];
    try { names = readdirSync(current); } catch { continue; }
    for (const name of names) {
      if (current === root && (name === ".git" || name === "node_modules")) continue;
      const candidate = join(current, name);
      try {
        const observed = lstatSync(candidate, { bigint: true });
        if (observed.isSymbolicLink()) continue;
        if (observed.dev === expected.device && observed.ino === expected.inode) return candidate;
        if (observed.isDirectory()) pending.push(candidate);
      } catch { /* Concurrent changes are rejected by the subsequent operation. */ }
    }
  }
  return undefined;
}

class CapabilityRegistry {
  readonly capabilities: Capability[] = [];
  closed = false;
  constructor(readonly root: string) {}
  track<T extends Capability>(capability: T): T { this.capabilities.push(capability); return capability; }
}

abstract class Capability {
  private closed = false;
  constructor(protected readonly registry: CapabilityRegistry, protected path: string, private readonly expected: Identity) {}

  protected location(): string {
    if (this.closed || this.registry.closed) containment("CLOSED: capability is closed");
    try {
      if (sameIdentity(identity(this.path), this.expected)) return this.path;
    } catch (error) {
      if (!(error instanceof Error) || (!error.message.includes("ENOENT") && !error.message.includes("SYMLINK"))) throw error;
    }
    const relocated = findIdentity(this.registry.root, this.expected);
    if (relocated === undefined) containment("STALE: the held repository entry is no longer reachable");
    this.path = relocated;
    return relocated;
  }

  operationPath(): string { return this.location(); }

  close(): void { this.closed = true; }
  stat(): { device: bigint; inode: bigint; size: bigint } {
    try {
      const observed = lstatSync(this.location(), { bigint: true });
      return { device: observed.dev, inode: observed.ino, size: observed.size };
    } catch (error) { return nodeFailure(error); }
  }
}

export class FileCapability extends Capability {
  private descriptor: number | undefined;
  constructor(registry: CapabilityRegistry, path: string, expected: Identity, descriptor: number, private readonly writable: boolean) {
    super(registry, path, expected);
    this.descriptor = descriptor;
  }

  private handle(): number {
    this.location();
    if (this.descriptor === undefined) containment("CLOSED: file capability is closed");
    return this.descriptor;
  }

  read(): Buffer {
    const descriptor = this.handle();
    try {
      const initial = fstatSync(descriptor, { bigint: true });
      if (!initial.isFile()) containment("CHANGED: file descriptor is no longer a regular file");
      const size = Number(initial.size);
      const bytes = Buffer.alloc(size);
      let offset = 0;
      while (offset < bytes.length) {
        const read = readSync(descriptor, bytes, offset, bytes.length - offset, offset);
        if (read <= 0) containment("CHANGED: file descriptor changed during read");
        offset += read;
      }
      const final = fstatSync(descriptor, { bigint: true });
      if (!final.isFile() || final.dev !== initial.dev || final.ino !== initial.ino || final.size !== initial.size) {
        containment("CHANGED: file descriptor changed during read");
      }
      return bytes;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("EXSPECSO_CONTAINMENT_")) throw error;
      return nodeFailure(error);
    }
  }

  write(bytes: Buffer): void {
    if (!Buffer.isBuffer(bytes)) containment("INVALID: file writes require a Buffer");
    if (!this.writable) containment("READ_ONLY: this file capability was not created for writing");
    const descriptor = this.handle();
    try {
      let offset = 0;
      while (offset < bytes.length) {
        const written = writeSync(descriptor, bytes, offset, bytes.length - offset);
        if (written <= 0) containment("CHANGED: file descriptor made no write progress");
        offset += written;
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("EXSPECSO_CONTAINMENT_")) throw error;
      nodeFailure(error);
    }
  }

  sync(): boolean { try { fsyncSync(this.handle()); return true; } catch (error) { return nodeFailure(error); } }

  override close(): void {
    const descriptor = this.descriptor;
    this.descriptor = undefined;
    if (descriptor !== undefined) {
      try { closeSync(descriptor); } catch (error) { nodeFailure(error); }
    }
    super.close();
  }
}

export class DirectoryCapability extends Capability {
  private directory(): string {
    const location = this.location();
    if (entryKind(location) !== "directory") containment("NOT_DIRECTORY: directory capability no longer names a directory");
    return location;
  }
  private child(name: string): string { component(name); return join(this.directory(), name); }

  openDirectory(name: string, create = false): DirectoryCapability {
    const candidate = this.child(name);
    try {
      if (create) {
        try { mkdirSync(candidate); } catch (error) {
          if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error;
        }
      }
      if (entryKind(candidate) !== "directory") containment("NOT_DIRECTORY: expected a directory");
      return this.registry.track(new DirectoryCapability(this.registry, candidate, identity(candidate)));
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("EXSPECSO_CONTAINMENT_")) throw error;
      return nodeFailure(error);
    }
  }

  createDirectory(name: string): DirectoryCapability {
    const candidate = this.child(name);
    try { mkdirSync(candidate); return this.registry.track(new DirectoryCapability(this.registry, candidate, identity(candidate))); }
    catch (error) { return nodeFailure(error); }
  }

  openFile(name: string): FileCapability {
    const candidate = this.child(name);
    try {
      if (entryKind(candidate) !== "file") containment("NOT_FILE: expected a regular file");
      return this.registry.track(new FileCapability(this.registry, candidate, identity(candidate), openSync(candidate, "r"), false));
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("EXSPECSO_CONTAINMENT_")) throw error;
      return nodeFailure(error);
    }
  }

  createFile(name: string): FileCapability {
    const candidate = this.child(name);
    try {
      const descriptor = openSync(candidate, "wx+");
      return this.registry.track(new FileCapability(this.registry, candidate, identity(candidate), descriptor, true));
    } catch (error) { return nodeFailure(error); }
  }

  list(): string[] { try { return readdirSync(this.directory()).sort((left, right) => left.localeCompare(right)); } catch (error) { return nodeFailure(error); } }

  replace(source: FileCapability, target: string, _testBoundary = false): void {
    component(target);
    const destination = join(this.directory(), target);
    try {
      try { if (entryKind(destination) !== "file") containment("NOT_FILE: replacement target is not a regular file"); } catch (error) {
        if (!(error instanceof Error) || !error.message.includes("ENOENT")) throw error;
      }
      renameSync(source.operationPath(), destination);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("EXSPECSO_CONTAINMENT_")) throw error;
      nodeFailure(error);
    }
  }

  publishDirectory(source: DirectoryCapability, target: string): void {
    component(target);
    const destination = join(this.directory(), target);
    try {
      try { identity(destination); containment("EXISTS: publication target already exists"); } catch (error) {
        if (!(error instanceof Error) || !error.message.includes("ENOENT")) throw error;
      }
      renameSync(source.directory(), destination);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("EXSPECSO_CONTAINMENT_")) throw error;
      nodeFailure(error);
    }
  }

  unlink(name: string): void {
    const candidate = this.child(name);
    try { if (entryKind(candidate) !== "file") containment("NOT_FILE: expected a regular file"); unlinkSync(candidate); }
    catch (error) { if (error instanceof Error && error.message.startsWith("EXSPECSO_CONTAINMENT_")) throw error; nodeFailure(error); }
  }

  removeDirectory(name: string): void {
    const candidate = this.child(name);
    try { if (entryKind(candidate) !== "directory") containment("NOT_DIRECTORY: expected a directory"); rmdirSync(candidate); }
    catch (error) { if (error instanceof Error && error.message.startsWith("EXSPECSO_CONTAINMENT_")) throw error; nodeFailure(error); }
  }

  sync(): boolean {
    // Node has no portable directory-handle fsync. File bytes are fsynced before promotion;
    // a directory sync is attempted where the host permits it and otherwise remains best-effort.
    try {
      const descriptor = openSync(this.directory(), "r");
      try { fsyncSync(descriptor); } finally { closeSync(descriptor); }
    } catch { /* host does not support syncing a directory */ }
    return true;
  }
}

class NodeBoundReader implements BoundReader {
  constructor(private readonly root: DirectoryCapability) {}

  private inDirectory<T>(parts: readonly string[], operation: (directory: DirectoryCapability) => T): T {
    components(parts);
    let directory = this.root;
    const opened: DirectoryCapability[] = [];
    try {
      for (const part of parts) { directory = directory.openDirectory(part); opened.push(directory); }
      return operation(directory);
    } finally { for (const capability of opened.reverse()) capability.close(); }
  }

  list(parts: readonly string[]): readonly string[] { return this.inDirectory(parts, (directory) => directory.list()); }

  metadata(parts: readonly string[]): BoundEntryKind {
    components(parts);
    if (parts.length === 0) return "directory";
    const name = parts.at(-1)!;
    return this.inDirectory(parts.slice(0, -1), (parent) => {
      try { const directory = parent.openDirectory(name); directory.close(); return "directory" as const; }
      catch (directoryError) {
        try { const file = parent.openFile(name); file.close(); return "file" as const; }
        catch { throw directoryError; }
      }
    });
  }

  read(parts: readonly string[]): Buffer {
    components(parts);
    if (parts.length === 0) containment("INVALID: cannot read a directory");
    return this.inDirectory(parts.slice(0, -1), (parent) => {
      const file = parent.openFile(parts.at(-1)!);
      try { return file.read(); } finally { file.close(); }
    });
  }
}

export interface RootCapability {
  readonly root: DirectoryCapability;
  readonly reader: BoundReader;
  readonly provenance: ProviderProvenance;
  close(): void;
}

/** Node primitives are scoped to one real Git repository root; hostile same-user races remain a host sandbox concern. */
export function openContainedFilesystem(path: string): RootCapability {
  let rootPath: string;
  try { rootPath = realpathSync(path); } catch (error) { return nodeFailure(error); }
  const rootIdentity = identity(rootPath);
  if (entryKind(rootPath) !== "directory") containment("NOT_DIRECTORY: repository root must be a directory");
  const registry = new CapabilityRegistry(rootPath);
  const root = registry.track(new DirectoryCapability(registry, rootPath, rootIdentity));
  return {
    root,
    reader: new NodeBoundReader(root),
    provenance: Object.freeze({ path: "node:fs", sha256: "", buildCommit: "", variant: "release", supportRowId: "node-fs" }),
    close() {
      if (registry.closed) return;
      registry.closed = true;
      let failure: unknown;
      for (const capability of registry.capabilities.slice().reverse()) {
        try { capability.close(); } catch (error) { failure ??= error; }
      }
      if (failure !== undefined) throw failure;
    },
  };
}
