import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync, statfsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSupportMatrix, parseAlpineMuslPackageVersion, resolveManifestEntry, type RuntimeObservation, type SupportManifestEntry } from "./support-matrix.js";

interface NativeProvider {
  readonly variant: "release" | "test";
  openRoot(path: string): object;
  openDirectory(parent: object, name: string, create: boolean): object;
  createDirectory(parent: object, name: string): object;
  openFile(parent: object, name: string, create: boolean): object;
  read(file: object): Buffer;
  write(file: object, bytes: Buffer): void;
  sync(handle: object): boolean;
  close(handle: object): void;
  list(directory: object): string[];
  replace(parent: object, source: object, target: string, testBoundary: boolean): void;
  publishDirectory(parent: object, source: object, target: string): void;
  unlink(parent: object, name: string, directory: boolean): void;
  stat(handle: object): { device: bigint; inode: bigint; size: bigint };
}
interface Target extends SupportManifestEntry { readonly byteLength: number; readonly sha256: string; }
interface Manifest { schemaVersion: 2; packageVersion: string; buildCommit: string; variant: "release" | "test"; targets: Target[] }
export interface ProviderProvenance { readonly path: string; readonly sha256: string; readonly buildCommit: string; readonly variant: "release" | "test"; readonly supportRowId: string }
export type BoundEntryKind = "directory" | "file";

/** Read-only traversal rooted at an already-open native directory capability. */
export interface BoundReader {
  list(components: readonly string[]): readonly string[];
  metadata(components: readonly string[]): BoundEntryKind;
  read(components: readonly string[]): Buffer;
}
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const APPROVED_LINUX_FILESYSTEM_MAGIC = 0xef53n;
function unavailable(message: string): never { throw new Error(`EXSPECSO_CONTAINMENT_UNAVAILABLE: ${message}`); }
export function normalizeLinuxFilesystemType(type: bigint): bigint { return BigInt.asUintN(32, type); }
export function isApprovedLinuxFilesystemType(type: bigint): boolean { return normalizeLinuxFilesystemType(type) === APPROVED_LINUX_FILESYSTEM_MAGIC; }
function observeLinuxOperationRootFilesystem(root: string): { raw: bigint; normalized: bigint; hex: string; mapping: "ext2/ext3" | "unapproved" } {
  const raw = BigInt(statfsSync(root, { bigint: true }).type);
  const normalized = normalizeLinuxFilesystemType(raw);
  return Object.freeze({ raw, normalized, hex: `0x${normalized.toString(16).padStart(8, "0")}`, mapping: isApprovedLinuxFilesystemType(raw) ? "ext2/ext3" : "unapproved" });
}

function command(program: string, args: readonly string[]): string {
  return execFileSync(program, [...args], { encoding: "utf8" }).trim();
}

function observeRuntime(operationRoot: string): RuntimeObservation {
  const nodeVersion = process.versions.node;
  const napiVersion = Number(process.versions.napi);
  if (process.platform === "darwin") {
    const mount = command("/bin/df", ["-P", operationRoot]).split("\n").at(-1)?.trim().split(/\s+/).at(-1);
    if (!mount) unavailable("cannot determine the operation-root filesystem mount");
    const disk = command("/usr/sbin/diskutil", ["info", mount]);
    return {
      platform: process.platform,
      arch: process.arch,
      osVersion: command("/usr/bin/sw_vers", ["-productVersion"]),
      osBuild: command("/usr/bin/sw_vers", ["-buildVersion"]),
      filesystem: /File System Personality:\s+APFS/m.test(disk) ? "apfs" : "unapproved",
      libc: "system",
      nodeVersion,
      napiVersion,
    };
  }
  if (process.platform === "win32") {
    const powershell = join(process.env.SystemRoot ?? "C:\\Windows", "System32/WindowsPowerShell/v1.0/powershell.exe");
    const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toLowerCase() !== "psmodulepath"));
    const observed = JSON.parse(execFileSync(powershell, ["-NoProfile", "-NonInteractive", "-Command", "$o=Get-CimInstance Win32_OperatingSystem;$r=Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion';$d=(Get-Volume -DriveLetter $env:SystemDrive.TrimEnd(':')).FileSystem;@{version=$o.Version;build=$o.BuildNumber;ubr=$r.UBR;filesystem=$d}|ConvertTo-Json -Compress"], { encoding: "utf8", windowsHide: true, env: environment })) as { version: string; build: string; ubr: number; filesystem: string };
    return { platform: process.platform, arch: process.arch, osVersion: observed.version, osBuild: `${observed.build}.${observed.ubr}`, filesystem: observed.filesystem.toLowerCase(), libc: "system", nodeVersion, napiVersion };
  }
  const filesystem = observeLinuxOperationRootFilesystem(operationRoot).mapping === "ext2/ext3" ? "ext4" : "unapproved";
  const osBuild = command("uname", ["-r"]);
  try {
    const libc = command("getconf", ["GNU_LIBC_VERSION"]);
    return { platform: process.platform, arch: process.arch, osVersion: command("lsb_release", ["-ds"]), osBuild, filesystem, libc: libc.replace("glibc ", "glibc-"), nodeVersion, napiVersion };
  } catch {
    let libc: string;
    try { libc = command("ldd", ["--version"]); }
    catch (error: any) {
      if (typeof error?.stderr !== "string" || !error.stderr.includes("musl libc")) throw error;
      libc = error.stderr;
    }
    const alpine = command("cut", ["-d", ".", "-f", "1,2", "/etc/alpine-release"]);
    const muslPackage = libc.includes("musl libc") ? parseAlpineMuslPackageVersion(command("apk", ["info", "-e", "musl"])) : undefined;
    return { platform: process.platform, arch: process.arch, osVersion: `Alpine ${alpine}`, osBuild, filesystem, libc: muslPackage ?? "unapproved", nodeVersion, napiVersion };
  }
}

function loadProvider(operationRoot: string): { native: NativeProvider; provenance: ProviderProvenance } {
  try {
    const matrix = loadSupportMatrix();
    const observation = observeRuntime(operationRoot);
    const manifest = JSON.parse(readFileSync(join(packageRoot, "dist/native/manifest.json"), "utf8")) as Manifest;
    const metadata = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as { version: string };
    if (manifest.schemaVersion !== 2 || manifest.packageVersion !== metadata.version || !/^[a-f0-9]{40}$/.test(manifest.buildCommit) || !["release", "test"].includes(manifest.variant) || !Array.isArray(manifest.targets)) unavailable("invalid provider manifest");
    const resolved = resolveManifestEntry(matrix, observation, manifest.targets);
    const supportRow = resolved.supportRow;
    const entry = resolved.entry as Target;
    if (Number(process.versions.napi) < entry.napiVersion || !Number.isSafeInteger(entry.byteLength) || entry.byteLength <= 0 || !/^[a-f0-9]{64}$/.test(entry.sha256)) unavailable("incompatible native support row");
    const binary = join(packageRoot, "dist/native", entry.path);
    if (!lstatSync(binary).isFile()) unavailable("provider must be an in-package regular file");
    const actual = realpathSync(binary);
    if (actual !== join(realpathSync(packageRoot), "dist/native", entry.path)) unavailable("provider path escapes its package");
    const bytes = readFileSync(binary);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (bytes.length !== entry.byteLength || sha256 !== entry.sha256) unavailable("provider checksum mismatch");
    const native = require(binary) as NativeProvider;
    if (native.variant !== manifest.variant) unavailable("provider variant mismatch");
    return { native, provenance: Object.freeze({ path: actual, sha256, buildCommit: manifest.buildCommit, variant: manifest.variant, supportRowId: supportRow.id }) };
  } catch (error) { unavailable(error instanceof Error ? error.message : "cannot load the bundled provider"); }
}

const handles = new WeakMap<Capability, object>();
class Capability {
  constructor(protected readonly native: NativeProvider, handle: object) { handles.set(this, handle); }
  protected get handle(): object { const value = handles.get(this); if (!value) unavailable("closed capability"); return value; }
  close(): void { const handle = handles.get(this); if (handle) { handles.delete(this); this.native.close(handle); } }
  sync(): boolean { return this.native.sync(this.handle); }
  stat(): { device: bigint; inode: bigint; size: bigint } { return this.native.stat(this.handle); }
}
export class FileCapability extends Capability {
  read(): Buffer { return this.native.read(this.handle); }
  write(bytes: Buffer): void { this.native.write(this.handle, bytes); }
}
export class DirectoryCapability extends Capability {
  constructor(native: NativeProvider, handle: object, private readonly track: (capability: Capability) => void) { super(native, handle); }
  openDirectory(name: string, create = false): DirectoryCapability { const value = new DirectoryCapability(this.native, this.native.openDirectory(this.handle, name, create), this.track); this.track(value); return value; }
  createDirectory(name: string): DirectoryCapability { const value = new DirectoryCapability(this.native, this.native.createDirectory(this.handle, name), this.track); this.track(value); return value; }
  openFile(name: string): FileCapability { const value = new FileCapability(this.native, this.native.openFile(this.handle, name, false)); this.track(value); return value; }
  createFile(name: string): FileCapability { const value = new FileCapability(this.native, this.native.openFile(this.handle, name, true)); this.track(value); return value; }
  list(): string[] { return this.native.list(this.handle); }
  replace(source: FileCapability, target: string, testBoundary = false): void { const handle = handles.get(source); if (!handle) unavailable("closed or foreign source"); this.native.replace(this.handle, handle, target, testBoundary); }
  publishDirectory(source: DirectoryCapability, target: string): void { const handle = handles.get(source); if (!handle) unavailable("closed or foreign source"); this.native.publishDirectory(this.handle, handle, target); }
  unlink(name: string): void { this.native.unlink(this.handle, name, false); }
  removeDirectory(name: string): void { this.native.unlink(this.handle, name, true); }
}

function requireRelativeComponents(components: readonly string[]): void {
  for (const component of components) {
    if (!component || component === "." || component === ".." || component.includes("/") || component.includes("\\")) {
      throw new Error("EXSPECSO_CONTAINMENT_INVALID: reader components must be one relative name each");
    }
  }
}

class NativeBoundReader implements BoundReader {
  constructor(private readonly root: DirectoryCapability) {}

  private inDirectory<T>(components: readonly string[], action: (directory: DirectoryCapability) => T): T {
    requireRelativeComponents(components);
    let directory = this.root;
    const opened: DirectoryCapability[] = [];
    try {
      for (const component of components) {
        directory = directory.openDirectory(component);
        opened.push(directory);
      }
      return action(directory);
    } finally {
      for (const capability of opened.reverse()) capability.close();
    }
  }

  list(components: readonly string[]): readonly string[] {
    return this.inDirectory(components, (directory) => directory.list());
  }

  metadata(components: readonly string[]): BoundEntryKind {
    requireRelativeComponents(components);
    if (components.length === 0) return "directory";
    const name = components.at(-1)!;
    return this.inDirectory(components.slice(0, -1), (parent) => {
      try {
        const directory = parent.openDirectory(name);
        directory.close();
        return "directory";
      } catch (directoryError) {
        try {
          const file = parent.openFile(name);
          file.close();
          return "file";
        } catch {
          throw directoryError;
        }
      }
    });
  }

  read(components: readonly string[]): Buffer {
    requireRelativeComponents(components);
    if (components.length === 0) throw new Error("EXSPECSO_CONTAINMENT_INVALID: cannot read a directory");
    return this.inDirectory(components.slice(0, -1), (parent) => {
      const file = parent.openFile(components.at(-1)!);
      try {
        return file.read();
      } finally {
        file.close();
      }
    });
  }
}
export interface RootCapability {
  readonly root: DirectoryCapability;
  readonly reader: BoundReader;
  readonly provenance: ProviderProvenance;
  close(): void;
}
/** Synchronous native primitives never take a path after the initial root open. */
export function openContainedFilesystem(path: string): RootCapability {
  const operationRoot = realpathSync(path);
  const { native, provenance } = loadProvider(operationRoot);
  const capabilities: Capability[] = [];
  const root = new DirectoryCapability(native, native.openRoot(operationRoot), (capability) => capabilities.push(capability));
  return { root, reader: new NativeBoundReader(root), provenance, close() {
    let failure: unknown;
    for (const capability of capabilities.splice(0).reverse().concat(root)) {
      try { capability.close(); } catch (error) { failure ??= error; }
    }
    if (failure) throw failure;
  } };
}
