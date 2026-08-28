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
  if (!["--variant", "--row", "--out", "--headers", "--node-lib"].includes(key) || values.has(key) || !process.argv[n + 1]) throw new Error("Invalid build arguments");
  values.set(key, process.argv[n + 1]);
}
const variant = values.get("--variant");
const rowId = values.get("--row");
if (!["release", "test"].includes(variant)) throw new Error("--variant release|test is required");
if (!rowId) throw new Error("--row must name a declared native support row");
const matrix = JSON.parse(readFileSync(join(root, "native/support-matrix.json"), "utf8"));
if (matrix.schemaVersion !== 2 || !Array.isArray(matrix.rows)) throw new Error("Invalid support matrix");
const row = matrix.rows.filter((candidate) => candidate.id === rowId);
if (row.length !== 1) throw new Error("--row must name exactly one declared native support row");
const supportRow = row[0];
const target = supportRow.target;
if (target !== `${process.platform}-${process.arch}` || !((process.platform === "darwin" || process.platform === "linux") && ["arm64", "x64"].includes(process.arch) || process.platform === "win32" && ["arm64", "x64"].includes(process.arch))) throw new Error("Selected support row does not match this native build host; no cross-build fallback");
const out = resolve(values.get("--out") ?? root);
const archive = values.get("--headers");
if (!archive) throw new Error("--headers must name the verified Node 20.19.0 header archive");
const hash = (data) => createHash("sha256").update(data).digest("hex");
const headerHash = hash(readFileSync(archive));
const expectedHeaderHash = supportRow.buildPolicy.headerSha256 ?? "800194e32cef4ee77f5a2e8c0e5dd2b4acb38b39ef2ea544929c181b949494bb";
if (headerHash !== expectedHeaderHash) throw new Error("Node header checksum mismatch");
const command = (program, args) => execFileSync(program, args, { cwd: root, encoding: "utf8" }).trim();
let osVersion, osBuild, compiler, compilerVersion, sdkVersion, sdkBuild, developerDirectory, xcode, sdk, windows, nodeLib, nodeLibHash, libc;
if (process.platform === "darwin") {
  osVersion = command("/usr/bin/sw_vers", ["-productVersion"]);
  osBuild = command("/usr/bin/sw_vers", ["-buildVersion"]);
  if (supportRow.os.family !== "macos" || osVersion !== supportRow.os.version || osBuild !== supportRow.os.build) throw new Error(`Selected support row does not match build OS ${osVersion}/${osBuild}`);
  developerDirectory = command("/usr/bin/xcode-select", ["-p"]);
  compiler = command("/usr/bin/xcrun", ["--find", "clang++"]);
  compilerVersion = command(compiler, ["--version"]);
  sdk = command("/usr/bin/xcrun", ["--sdk", "macosx", "--show-sdk-path"]);
  sdkVersion = command("/usr/bin/xcrun", ["--sdk", "macosx", "--show-sdk-version"]);
  sdkBuild = command("/usr/bin/xcrun", ["--sdk", "macosx", "--show-sdk-build-version"]);
  if (supportRow.runnerKind === "local") {
    const policy = supportRow.buildPolicy;
    if (developerDirectory !== policy.developerDirectory || compiler !== policy.compilerPath || !compilerVersion.startsWith(policy.compilerVersion) || sdkVersion !== policy.sdkVersion || sdkBuild !== policy.sdkBuild) throw new Error("Command Line Tools compiler/SDK pin drift; update the approved ledger before building");
  } else {
    xcode = command("/usr/bin/xcodebuild", ["-version"]);
    if (!xcode.includes("Xcode 16.4") || !compilerVersion.includes("clang-1700.0.13.5") || sdkVersion !== "15.5") throw new Error("Compiler/SDK pin drift; update the approved ledger before building");
  }
} else if (process.platform === "win32") {
  execFileSync(join(process.env.ProgramFiles, "PowerShell/7/pwsh.exe"), ["-NoProfile", "-NonInteractive", "-File", join(root, "native/windows-preflight.ps1")], { cwd: root, stdio: "inherit" });
  windows = JSON.parse(readFileSync(join(root, "windows-preflight/environment.json"), "utf8").replace(/^\uFEFF/, ""));
  if (supportRow.os.family !== "windows" || windows.version !== supportRow.os.version || !`${windows.build}.${windows.ubr}`.startsWith(`${supportRow.os.version.split(".").at(-1)}.`)) throw new Error("Selected support row does not match Windows build");
  if (process.arch === "x64" && (windows.ubr !== 33296 || windows.compilerFileVersion !== "19.44.35228.0" || windows.compilerSHA256 !== "88c8344236a27a6e727e0a8edc49aaa2690bdc7a9464b9d18cc7abe70a9f1c0d")) throw new Error("Windows x64 OS patch/compiler pin drift");
  if (process.arch === "arm64" && (!windows.ubr || !windows.compilerFileVersion || !windows.compilerSHA256)) throw new Error("Windows ARM64 observation is incomplete");
  const expectedHeaders = { "um/winternl.h": "a43424486349c38f697c009512dfe4eb8fca733d7665afab42f50752170b9785", "um/WinBase.h": "ec538199f5ebe8cec2dfd4f1ba48316ef776c82d37277aed3a677965e494f192", "um/fileapi.h": "f8927178c75de487c0e57f044a215e455522bf6eaa0b660421be09cd06ae05a1" };
  for (const [name, expected] of Object.entries(expectedHeaders)) if (windows.headers.find(h => h.path === name)?.sha256 !== expected) throw new Error("Windows SDK header drift: " + name);
  osVersion = windows.version; osBuild = `${windows.build}.${windows.ubr}`;
  compiler = windows.compiler; compilerVersion = windows.compilerFileVersion; sdkVersion = windows.sdkVersion;
  sdk = join(process.env["ProgramFiles(x86)"], "Windows Kits/10");
  nodeLib = values.get("--node-lib");
  if (!nodeLib) throw new Error("--node-lib must name the verified native Node 20.19.0 import library");
  nodeLib = resolve(nodeLib); nodeLibHash = hash(readFileSync(nodeLib));
  const expectedNodeLib = process.arch === "x64" ? "72f7ca3b33f0991e93e25521f7e78c8adf187df7d5223bf0efcb5e005420f327" : "a9d9a73785f8d95b98eed317c07ca34d4b2d59a45b425bab8b942795ab9236f1";
  if (nodeLibHash !== expectedNodeLib) throw new Error("Node import-library checksum mismatch");
} else if (supportRow.libc === "glibc-2.39") {
  osVersion = command("lsb_release", ["-ds"]);
  osBuild = command("uname", ["-r"]);
  compiler = command("which", ["g++"]);
  compilerVersion = command(compiler, ["--version"]);
  libc = command("getconf", ["GNU_LIBC_VERSION"]);
  if (supportRow.os.family !== "linux" || osVersion !== supportRow.os.version || osBuild !== supportRow.os.kernel || !compilerVersion.includes("13.3.0") || libc !== "glibc 2.39") throw new Error("Linux compiler/OS/libc pin drift; update the approved ledger before building");
} else if (supportRow.libc === "musl-1.2.6-r2") {
  osVersion = `Alpine ${command("cut", ["-d", ".", "-f", "1,2", "/etc/alpine-release"])}`;
  osBuild = command("uname", ["-r"]);
  compiler = command("which", ["g++"]);
  compilerVersion = command(compiler, ["--version"]);
  try { libc = command("ldd", ["--version"]); }
  catch (error) {
    if (typeof error?.stderr !== "string" || !error.stderr.includes("musl libc")) throw error;
    libc = error.stderr.trim();
  }
  if (supportRow.os.family !== "linux" || osVersion !== supportRow.os.version || osBuild !== supportRow.os.kernel || !compilerVersion.includes("15.2.0") || !libc.includes("Version 1.2.6")) throw new Error("Alpine compiler/libc pin drift; update the approved ledger before building");
} else {
  throw new Error("Selected support row has no implemented libc policy");
}
const work = mkdtempSync(join(tmpdir(), "exspecso-native-build-"));
try {
  execFileSync("tar", ["-xzf", resolve(archive), "-C", work]);
  const include = join(work, "node-v20.19.0", "include", "node");
  const directory = join(out, "dist", "native", supportRow.id, target);
  mkdirSync(directory, { recursive: true });
  const binary = join(directory, "contained-fs.node");
  let args, buildEnvironment = process.env;
  if (process.platform === "darwin") {
    args = ["-std=c++17", "-O2", "-Wall", "-Wextra", "-fvisibility=hidden", "-bundle", "-undefined", "dynamic_lookup", "-isysroot", sdk, `-mmacosx-version-min=${osVersion}`, "-DNAPI_VERSION=8", "-DNODE_GYP_MODULE_NAME=contained_fs", "-I", include];
    if (variant === "test") args.push("-DEXSPECSO_CONTAINMENT_TEST=1");
    args.push(join(root, "native", "contained-fs.cc"), "-o", binary);
  } else if (process.platform === "win32") {
    const msvc = resolve(dirname(compiler), "../../..");
    args = ["/nologo", "/std:c++17", "/O2", "/W4", "/EHsc", "/MT", "/LD", "/utf-8", "/D_WIN32_WINNT=0x0A00", "/DNAPI_VERSION=8", "/DNODE_GYP_MODULE_NAME=contained_fs", "/I" + include, "/I" + join(msvc, "include")];
    for (const part of ["ucrt", "shared", "um", "winrt"]) args.push("/I" + join(sdk, "Include", sdkVersion, part));
    if (variant === "test") args.push("/DEXSPECSO_CONTAINMENT_TEST=1");
    args.push(join(root, "native/contained-fs.cc"), "/Fo" + join(work, "contained-fs.obj"), "/link", "/OUT:" + binary, "/IMPLIB:" + join(work, "contained-fs.lib"), nodeLib, "kernel32.lib");
    if (variant === "test") args.push("bcrypt.lib", "advapi32.lib");
    const targetArchitecture = process.arch;
    args.push("/LIBPATH:" + join(msvc, "lib", targetArchitecture));
    for (const part of ["ucrt", "um"]) args.push("/LIBPATH:" + join(sdk, "Lib", sdkVersion, part, targetArchitecture));
    if (process.arch === "arm64") args.splice(args.length - 2, 0, "/MACHINE:ARM64");
    buildEnvironment = { ...process.env, PATH: dirname(compiler) + ";" + process.env.PATH };
  } else {
    args = ["-std=c++17", "-O2", "-Wall", "-Wextra", "-fvisibility=hidden", "-fPIC", "-shared", "-DNAPI_VERSION=8", "-DNODE_GYP_MODULE_NAME=contained_fs", "-I", include];
    if (variant === "test") args.push("-DEXSPECSO_CONTAINMENT_TEST=1");
    args.push(join(root, "native", "contained-fs.cc"), "-o", binary, "-ldl");
  }
  execFileSync(compiler, args, { cwd: work, env: buildEnvironment, stdio: "inherit" });
  const dependencies = windows ? execFileSync(join(dirname(compiler), "dumpbin.exe"), ["/DEPENDENTS", binary], { encoding: "utf8", env: buildEnvironment }) : undefined;
  if (dependencies) console.log(dependencies);
  const bytes = readFileSync(binary);
  const packageVersion = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
  const buildCommit = process.env.EXSPECSO_SOURCE_COMMIT ?? command("git", ["rev-parse", "HEAD"]);
  if (!/^[a-f0-9]{40}$/.test(buildCommit)) throw new Error("build source commit must be the exact 40-hex snapshot");
  const sources = Object.fromEntries(["native/contained-fs.cc", "native/contained-fs-posix.cc", "native/contained-fs-win.cc", "native/build.mjs", "native/support-matrix.json", "native/windows-preflight.ps1"].map((name) => [name, hash(readFileSync(join(root, name)))]));
  const manifest = { schemaVersion: 2, packageVersion, buildCommit, variant, targets: [{ supportRowId: supportRow.id, target, platform: process.platform, arch: process.arch, osVersion, osBuild, filesystem: supportRow.filesystem, libc: supportRow.libc, napiVersion: 8, byteLength: bytes.length, sha256: hash(bytes), path: `${supportRow.id}/${target}/contained-fs.node` }] };
  writeFileSync(join(out, "dist", "native", "support-matrix.json"), JSON.stringify(matrix, null, 2) + "\n");
  writeFileSync(join(out, "dist", "native", "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  writeFileSync(join(out, "dist", "native", "build-provenance.json"), JSON.stringify({ supportRowId: supportRow.id, buildCommit, variant, sources, headerHash, compiler, compilerVersion, developerDirectory, sdk, sdkVersion, sdkBuild, xcode, osVersion, osBuild, windows, nodeLibHash, dependencies, args, binarySHA256: hash(bytes) }, null, 2) + "\n");
  console.log(JSON.stringify({ variant, supportRowId: supportRow.id, target, binary, sha256: hash(bytes), buildCommit }));
} finally { rmSync(work, { recursive: true, force: true }); }
