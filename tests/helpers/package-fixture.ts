import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, isAbsolute, join, resolve } from "node:path";

export interface PackedInstallation {
  readonly tarballPath: string;
  readonly packageDirectory: string;
  readonly cliPath: string;
  readonly inventory: readonly string[];
}

export interface InstalledCliResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

const packageRoot = resolve(import.meta.dirname, "../..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function sanitizedEnvironment(): NodeJS.ProcessEnv {
  const environment = { ...process.env };
  delete environment.NODE_PATH;
  return environment;
}

function run(command: string, args: readonly string[], cwd: string, env: NodeJS.ProcessEnv = sanitizedEnvironment()): Promise<InstalledCliResult> {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (exitCode) => resolveRun({ exitCode: exitCode ?? 1, stdout, stderr }));
  });
}

async function requireSuccess(command: string, args: readonly string[], cwd: string): Promise<InstalledCliResult> {
  const result = await run(command, args, cwd);
  if (result.exitCode !== 0) throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  return result;
}

function parseInventory(stdout: string): readonly string[] {
  const metadata = JSON.parse(stdout) as Array<{ files?: Array<{ path?: string }> }>;
  const files = metadata[0]?.files;
  if (files === undefined) throw new Error("npm pack --dry-run --json did not report a package inventory");
  return Object.freeze(files.map(({ path }) => path).filter((path): path is string => path !== undefined).sort());
}

/** Build the checkout, inspect its normal npm candidate, and install the tarball with lifecycle scripts disabled. */
export async function packAndInstall(): Promise<PackedInstallation> {
  await requireSuccess(npmCommand, ["run", "build"], packageRoot);
  const dryRun = await requireSuccess(npmCommand, ["pack", "--dry-run", "--json"], packageRoot);
  const inventory = parseInventory(dryRun.stdout);
  const temporaryRoot = await mkdtemp(join(tmpdir(), "exspecso-installed-package-"));
  const tarballDirectory = join(temporaryRoot, "tarball");
  const installationRoot = join(temporaryRoot, "installation");
  await mkdir(tarballDirectory);
  await mkdir(installationRoot);

  const packed = await requireSuccess(npmCommand, ["pack", "--json", "--pack-destination", tarballDirectory], packageRoot);
  const metadata = JSON.parse(packed.stdout) as Array<{ filename?: string }>;
  const filename = metadata[0]?.filename;
  if (filename === undefined) throw new Error("npm pack --json did not report a tarball filename");
  const tarballPath = join(tarballDirectory, basename(filename));
  await access(tarballPath);
  await requireSuccess(npmCommand, ["install", "--ignore-scripts", "--no-package-lock", "--no-save", tarballPath], installationRoot);

  const packageDirectory = join(installationRoot, "node_modules", "exspecso");
  const packageJson = JSON.parse(await readFile(join(packageDirectory, "package.json"), "utf8")) as { bin?: { exspecso?: string } };
  const bin = packageJson.bin?.exspecso;
  if (bin === undefined || isAbsolute(bin)) throw new Error("installed package does not declare a relative exspecso bin target");
  const cliPath = join(packageDirectory, bin);
  await access(cliPath);
  return { tarballPath, packageDirectory, cliPath, inventory };
}

/** Run the installed package's declared bin from an arbitrary repository directory. */
export function runInstalledCli(installation: PackedInstallation, cwd: string, args: readonly string[]): Promise<InstalledCliResult> {
  return run(process.execPath, [installation.cliPath, ...args], cwd);
}
