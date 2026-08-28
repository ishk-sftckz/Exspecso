import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface NativeProvider {
  readonly variant: "release" | "test";
  openRoot(path: string): object;
  openDirectory(parent: object, name: string, create: boolean): object;
  openFile(parent: object, name: string, create: boolean): object;
  read(file: object): Buffer;
  write(file: object, bytes: Buffer): void;
  sync(handle: object): boolean;
  close(handle: object): void;
  list(directory: object): string[];
  replace(parent: object, source: object, target: string): void;
  unlink(parent: object, name: string, directory: boolean): void;
  stat(handle: object): { device: bigint; inode: bigint; size: bigint };
}
interface Target {
  target: string; platform: string; arch: string; osVersion: string; osBuild: string;
  filesystem: string; napiVersion: number; byteLength: number; sha256: string; path: string;
}
interface Manifest { schemaVersion: number; packageVersion: string; buildCommit: string; variant: "release" | "test"; targets: Target[] }
export interface ProviderProvenance { readonly path: string; readonly sha256: string; readonly buildCommit: string; readonly variant: "release" | "test" }
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
function unavailable(message: string): never { throw new Error(`EXSPECSO_CONTAINMENT_UNAVAILABLE: ${message}`); }
function loadProvider(): { native: NativeProvider; provenance: ProviderProvenance } {
  try {
    const [major, minor, patch] = process.versions.node.split(".").map(Number);
    if (!(major === 20 && (minor > 19 || minor === 19 && patch >= 0) || major === 22 && minor >= 13 || major === 24 || major === 26)) unavailable("unsupported Node version");
    const manifest = JSON.parse(readFileSync(join(packageRoot, "dist/native/manifest.json"), "utf8")) as Manifest;
    const metadata = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as { version: string };
    if (manifest.schemaVersion !== 1 || manifest.packageVersion !== metadata.version || !/^[a-f0-9]{40}$/.test(manifest.buildCommit) || !["release", "test"].includes(manifest.variant) || !Array.isArray(manifest.targets)) unavailable("invalid provider manifest");
    const target = `${process.platform}-${process.arch}`;
    const entries = manifest.targets.filter((entry) => entry.target === target);
    if (entries.length !== 1) unavailable("missing or duplicate native target");
    const entry = entries[0];
    if (entry.platform !== process.platform || entry.arch !== process.arch || entry.napiVersion !== 8 || Number(process.versions.napi) < 8 || entry.path !== `${target}/contained-fs.node` || !Number.isSafeInteger(entry.byteLength) || entry.byteLength <= 0 || !/^[a-f0-9]{64}$/.test(entry.sha256)) unavailable("incompatible native target");
    if (process.platform === "darwin" && ["arm64", "x64"].includes(process.arch) && entry.filesystem === "apfs") {
      const osVersion = execFileSync("/usr/bin/sw_vers", ["-productVersion"], { encoding: "utf8" }).trim();
      const osBuild = execFileSync("/usr/bin/sw_vers", ["-buildVersion"], { encoding: "utf8" }).trim();
      const approved = process.arch === "arm64" ? ["15.7.7", "24G720"] : ["15.7.9", "24G830"];
      if (entry.osVersion !== approved[0] || entry.osBuild !== approved[1] || osVersion !== entry.osVersion || osBuild !== entry.osBuild) unavailable("unverified OS version; no project changes made");
    } else if (process.platform === "win32" && process.arch === "x64" && entry.filesystem === "ntfs") {
      const observed = JSON.parse(execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "$o=Get-CimInstance Win32_OperatingSystem;$r=Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion';@{caption=$o.Caption;version=$o.Version;build=$o.BuildNumber;ubr=$r.UBR}|ConvertTo-Json -Compress"], { encoding: "utf8", windowsHide: true })) as { caption: string; version: string; build: string; ubr: number };
      if (entry.osVersion !== "10.0.26100" || entry.osBuild !== "26100.33296" || observed.caption !== "Microsoft Windows Server 2025 Datacenter" || observed.version !== entry.osVersion || `${observed.build}.${observed.ubr}` !== entry.osBuild) unavailable("unverified Windows version; no project changes made");
    } else unavailable("this tracer has no verified provider for the host");
    const binary = join(packageRoot, "dist/native", entry.path);
    if (!lstatSync(binary).isFile()) unavailable("provider must be an in-package regular file");
    const actual = realpathSync(binary);
    if (actual !== join(realpathSync(packageRoot), "dist/native", entry.path)) unavailable("provider path escapes its package");
    const bytes = readFileSync(binary);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (bytes.length !== entry.byteLength || sha256 !== entry.sha256) unavailable("provider checksum mismatch");
    const native = require(binary) as NativeProvider;
    if (native.variant !== manifest.variant) unavailable("provider variant mismatch");
    return { native, provenance: Object.freeze({ path: actual, sha256, buildCommit: manifest.buildCommit, variant: manifest.variant }) };
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
  openFile(name: string): FileCapability { const value = new FileCapability(this.native, this.native.openFile(this.handle, name, false)); this.track(value); return value; }
  createFile(name: string): FileCapability { const value = new FileCapability(this.native, this.native.openFile(this.handle, name, true)); this.track(value); return value; }
  list(): string[] { return this.native.list(this.handle); }
  replace(source: FileCapability, target: string): void { const handle = handles.get(source); if (!handle) unavailable("closed or foreign source"); this.native.replace(this.handle, handle, target); }
  unlink(name: string): void { this.native.unlink(this.handle, name, false); }
  removeDirectory(name: string): void { this.native.unlink(this.handle, name, true); }
}
export interface RootCapability {
  readonly root: DirectoryCapability;
  readonly provenance: ProviderProvenance;
  close(): void;
}
/** Synchronous native primitives never take a path after the initial root open. */
export function openContainedFilesystem(path: string): RootCapability {
  const { native, provenance } = loadProvider();
  const capabilities: Capability[] = [];
  const root = new DirectoryCapability(native, native.openRoot(realpathSync(path)), (capability) => capabilities.push(capability));
  return { root, provenance, close() {
    let failure: unknown;
    for (const capability of capabilities.splice(0).reverse().concat(root)) {
      try { capability.close(); } catch (error) { failure ??= error; }
    }
    if (failure) throw failure;
  } };
}
