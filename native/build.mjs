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
  if (!["--variant", "--target", "--out", "--headers", "--node-lib"].includes(key) || values.has(key) || !process.argv[n + 1]) throw new Error("Invalid build arguments");
  values.set(key, process.argv[n + 1]);
}
const variant = values.get("--variant");
const target = values.get("--target");
if (!["release", "test"].includes(variant)) throw new Error("--variant release|test is required");
if (target !== `${process.platform}-${process.arch}` || !(process.platform === "darwin" && ["arm64", "x64"].includes(process.arch) || process.platform === "win32" && process.arch === "x64")) throw new Error("No implemented native tracer for this build host; no cross-build fallback");
const out = resolve(values.get("--out") ?? root);
const archive = values.get("--headers");
if (!archive) throw new Error("--headers must name the verified Node 20.19.0 header archive");
const hash = (data) => createHash("sha256").update(data).digest("hex");
const headerHash = hash(readFileSync(archive));
if (headerHash !== "800194e32cef4ee77f5a2e8c0e5dd2b4acb38b39ef2ea544929c181b949494bb") throw new Error("Node header checksum mismatch");
const command = (program, args) => execFileSync(program, args, { cwd: root, encoding: "utf8" }).trim();
let osVersion, osBuild, compiler, compilerVersion, sdkVersion, xcode, sdk, windows, nodeLib, nodeLibHash;
if (process.platform === "darwin") {
  osVersion = command("/usr/bin/sw_vers", ["-productVersion"]);
  osBuild = command("/usr/bin/sw_vers", ["-buildVersion"]);
  const approvedOS = process.arch === "arm64" ? ["15.7.7", "24G720"] : ["15.7.9", "24G830"];
  if (osVersion !== approvedOS[0] || osBuild !== approvedOS[1]) throw new Error(`Unapproved build OS ${osVersion}/${osBuild}; expected ${approvedOS.join("/")}`);
  xcode = command("/usr/bin/xcodebuild", ["-version"]);
  compiler = command("/usr/bin/xcrun", ["--find", "clang++"]);
  compilerVersion = command(compiler, ["--version"]);
  sdk = command("/usr/bin/xcrun", ["--sdk", "macosx", "--show-sdk-path"]);
  sdkVersion = command("/usr/bin/xcrun", ["--sdk", "macosx", "--show-sdk-version"]);
  if (xcode !== "Xcode 16.4\nBuild version 16F6" || sdkVersion !== "15.5" || !compilerVersion.includes("clang-1700.0.13.5")) throw new Error("Compiler/SDK pin drift; update the approved ledger before building");
} else {
  // Reobserve the machine and SDK for every build, including separately packed variants.
  execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-File", join(root, "native/windows-preflight.ps1")], { cwd: root, stdio: "inherit" });
  windows = JSON.parse(readFileSync(join(root, "windows-preflight/environment.json"), "utf8").replace(/^\uFEFF/, ""));
  if (windows.ubr !== 33296 || windows.compilerFileVersion !== "19.44.35228.0" || windows.compilerSHA256 !== "88c8344236a27a6e727e0a8edc49aaa2690bdc7a9464b9d18cc7abe70a9f1c0d") throw new Error("Windows OS patch/compiler pin drift");
  const expectedHeaders = { "um/winternl.h": "a43424486349c38f697c009512dfe4eb8fca733d7665afab42f50752170b9785", "um/WinBase.h": "ec538199f5ebe8cec2dfd4f1ba48316ef776c82d37277aed3a677965e494f192", "um/fileapi.h": "f8927178c75de487c0e57f044a215e455522bf6eaa0b660421be09cd06ae05a1" };
  for (const [name, expected] of Object.entries(expectedHeaders)) if (windows.headers.find(h => h.path === name)?.sha256 !== expected) throw new Error("Windows SDK header drift: " + name);
  osVersion = windows.version; osBuild = `${windows.build}.${windows.ubr}`;
  compiler = windows.compiler; compilerVersion = windows.compilerFileVersion; sdkVersion = windows.sdkVersion;
  sdk = join(process.env["ProgramFiles(x86)"], "Windows Kits/10");
  nodeLib = values.get("--node-lib");
  if (!nodeLib) throw new Error("--node-lib must name the verified Node 20.19.0 x64 import library");
  nodeLib = resolve(nodeLib); nodeLibHash = hash(readFileSync(nodeLib));
  if (nodeLibHash !== "72f7ca3b33f0991e93e25521f7e78c8adf187df7d5223bf0efcb5e005420f327") throw new Error("Node import-library checksum mismatch");
}
const work = mkdtempSync(join(tmpdir(), "exspecso-native-build-"));
try {
  execFileSync("tar", ["-xzf", resolve(archive), "-C", work]);
  const include = join(work, "node-v20.19.0", "include", "node");
  const directory = join(out, "dist", "native", target);
  mkdirSync(directory, { recursive: true });
  const binary = join(directory, "contained-fs.node");
  let args, buildEnvironment = process.env;
  if (process.platform === "darwin") {
    args = ["-std=c++17", "-O2", "-Wall", "-Wextra", "-fvisibility=hidden", "-bundle", "-undefined", "dynamic_lookup", "-isysroot", sdk, `-mmacosx-version-min=${osVersion}`, "-DNAPI_VERSION=8", "-DNODE_GYP_MODULE_NAME=contained_fs", "-I", include];
    if (variant === "test") args.push("-DEXSPECSO_CONTAINMENT_TEST=1");
    args.push(join(root, "native", "contained-fs.cc"), "-o", binary);
  } else {
    const msvc = resolve(dirname(compiler), "../../..");
    args = ["/nologo", "/std:c++17", "/O2", "/W4", "/EHsc", "/MT", "/LD", "/utf-8", "/D_WIN32_WINNT=0x0A00", "/DNAPI_VERSION=8", "/DNODE_GYP_MODULE_NAME=contained_fs", "/I" + include, "/I" + join(msvc, "include")];
    for (const part of ["ucrt", "shared", "um", "winrt"]) args.push("/I" + join(sdk, "Include", sdkVersion, part));
    if (variant === "test") args.push("/DEXSPECSO_CONTAINMENT_TEST=1");
    args.push(join(root, "native/contained-fs.cc"), "/Fo" + join(work, "contained-fs.obj"), "/link", "/OUT:" + binary, "/IMPLIB:" + join(work, "contained-fs.lib"), nodeLib, "kernel32.lib", "/LIBPATH:" + join(msvc, "lib/x64"));
    for (const part of ["ucrt", "um"]) args.push("/LIBPATH:" + join(sdk, "Lib", sdkVersion, part, "x64"));
    buildEnvironment = { ...process.env, PATH: dirname(compiler) + ";" + process.env.PATH };
  }
  execFileSync(compiler, args, { cwd: work, env: buildEnvironment, stdio: "inherit" });
  const dependencies = windows ? execFileSync(join(dirname(compiler), "dumpbin.exe"), ["/DEPENDENTS", binary], { encoding: "utf8", env: buildEnvironment }) : undefined;
  if (dependencies) console.log(dependencies);
  const bytes = readFileSync(binary);
  const packageVersion = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
  const buildCommit = command("git", ["rev-parse", "HEAD"]);
  const sources = Object.fromEntries(["native/contained-fs.cc", "native/contained-fs-posix.cc", "native/contained-fs-win.cc", "native/build.mjs", "native/windows-preflight.ps1"].map((name) => [name, hash(readFileSync(join(root, name)))]));
  const manifest = { schemaVersion: 1, packageVersion, buildCommit, variant, targets: [{ target, platform: process.platform, arch: process.arch, osVersion, osBuild, filesystem: windows ? "ntfs" : "apfs", napiVersion: 8, byteLength: bytes.length, sha256: hash(bytes), path: `${target}/contained-fs.node` }] };
  writeFileSync(join(out, "dist", "native", "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  writeFileSync(join(out, "dist", "native", "build-provenance.json"), JSON.stringify({ buildCommit, variant, sources, headerHash, compiler, compilerVersion, sdkVersion, xcode, osVersion, osBuild, windows, nodeLibHash, dependencies, args, binarySHA256: hash(bytes) }, null, 2) + "\n");
  console.log(JSON.stringify({ variant, target, binary, sha256: hash(bytes), buildCommit }));
} finally { rmSync(work, { recursive: true, force: true }); }
