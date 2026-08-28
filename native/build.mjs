import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const values = new Map();
for (let n = 2; n < process.argv.length; n += 2) {
  const key = process.argv[n];
  if (!["--variant", "--target", "--out", "--headers"].includes(key) || values.has(key) || !process.argv[n + 1]) throw new Error("Invalid build arguments");
  values.set(key, process.argv[n + 1]);
}
const variant = values.get("--variant");
const target = values.get("--target");
if (!["release", "test"].includes(variant)) throw new Error("--variant release|test is required");
if (process.platform !== "darwin" || target !== `darwin-${process.arch}` || !["arm64", "x64"].includes(process.arch)) throw new Error("Only the approved native macOS tracer is implemented; other targets await their plan");
const out = resolve(values.get("--out") ?? root);
const archive = values.get("--headers");
if (!archive) throw new Error("--headers must name the verified Node 20.19.0 header archive");
const hash = (data) => createHash("sha256").update(data).digest("hex");
const headerHash = hash(readFileSync(archive));
if (headerHash !== "800194e32cef4ee77f5a2e8c0e5dd2b4acb38b39ef2ea544929c181b949494bb") throw new Error("Node header checksum mismatch");
const command = (program, args) => execFileSync(program, args, { cwd: root, encoding: "utf8" }).trim();
const osVersion = command("/usr/bin/sw_vers", ["-productVersion"]);
const osBuild = command("/usr/bin/sw_vers", ["-buildVersion"]);
const approvedOS = process.arch === "arm64" ? ["15.7.7", "24G720"] : ["15.7.9", "24G830"];
if (osVersion !== approvedOS[0] || osBuild !== approvedOS[1]) throw new Error(`Unapproved build OS ${osVersion}/${osBuild}; expected ${approvedOS.join("/")}`);
const xcode = command("/usr/bin/xcodebuild", ["-version"]);
const compiler = command("/usr/bin/xcrun", ["--find", "clang++"]);
const compilerVersion = command(compiler, ["--version"]);
const sdk = command("/usr/bin/xcrun", ["--sdk", "macosx", "--show-sdk-path"]);
const sdkVersion = command("/usr/bin/xcrun", ["--sdk", "macosx", "--show-sdk-version"]);
if (xcode !== "Xcode 16.4\nBuild version 16F6" || sdkVersion !== "15.5" || !compilerVersion.includes("clang-1700.0.13.5")) throw new Error("Compiler/SDK pin drift; update the approved ledger before building");
const work = mkdtempSync(join(tmpdir(), "exspecso-native-build-"));
try {
  execFileSync("tar", ["-xzf", resolve(archive), "-C", work]);
  const include = join(work, "node-v20.19.0", "include", "node");
  const directory = join(out, "dist", "native", target);
  mkdirSync(directory, { recursive: true });
  const binary = join(directory, "contained-fs.node");
  const args = ["-std=c++17", "-O2", "-Wall", "-Wextra", "-fvisibility=hidden", "-bundle", "-undefined", "dynamic_lookup", "-isysroot", sdk, `-mmacosx-version-min=${osVersion}`, "-DNAPI_VERSION=8", "-DNODE_GYP_MODULE_NAME=contained_fs", "-I", include];
  if (variant === "test") args.push("-DEXSPECSO_CONTAINMENT_TEST=1");
  args.push(join(root, "native", "contained-fs.cc"), "-o", binary);
  execFileSync(compiler, args, { cwd: root, stdio: "inherit" });
  const bytes = readFileSync(binary);
  const packageVersion = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
  const buildCommit = command("git", ["rev-parse", "HEAD"]);
  const sources = Object.fromEntries(["native/contained-fs.cc", "native/contained-fs-posix.cc", "native/build.mjs"].map((name) => [name, hash(readFileSync(join(root, name)))]));
  const manifest = { schemaVersion: 1, packageVersion, buildCommit, variant, targets: [{ target, platform: process.platform, arch: process.arch, osVersion, osBuild, filesystem: "apfs", napiVersion: 8, byteLength: bytes.length, sha256: hash(bytes), path: `${target}/contained-fs.node` }] };
  writeFileSync(join(out, "dist", "native", "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  writeFileSync(join(out, "dist", "native", "build-provenance.json"), JSON.stringify({ buildCommit, variant, sources, headerHash, compiler, compilerVersion, sdkVersion, xcode, osVersion, osBuild, args, binarySHA256: hash(bytes) }, null, 2) + "\n");
  console.log(JSON.stringify({ variant, target, binary, sha256: hash(bytes), buildCommit }));
} finally { rmSync(work, { recursive: true, force: true }); }
