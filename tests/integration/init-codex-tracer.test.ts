import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const temporaryPaths: string[] = [];
const packageRoot = resolve(import.meta.dirname, "../..");

afterEach(async () => {
  await Promise.all(temporaryPaths.splice(0).map((path) => rm(path, { force: true, recursive: true })));
});

async function createTemporaryDirectory(prefix: string): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), prefix));
  temporaryPaths.push(path);
  return path;
}

async function createGitRepository(): Promise<string> {
  const root = await createTemporaryDirectory("exspecso-init-");
  await mkdir(join(root, ".git"));
  return root;
}

async function packAndRun(
  cwd: string,
  args: string[] = ["init", "--agent", "codex"],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const packingDirectory = await createTemporaryDirectory("exspecso-pack-");
  await execFileAsync("npm", ["run", "build"], { cwd: packageRoot });
  const { stdout: packOutput } = await execFileAsync(
    "npm",
    ["pack", "--json", "--pack-destination", packingDirectory],
    { cwd: packageRoot },
  );
  const [{ filename }] = JSON.parse(packOutput) as Array<{ filename: string }>;
  const runner = await createTemporaryDirectory("exspecso-runner-");
  await execFileAsync(
    "npm",
    ["install", "--ignore-scripts", "--no-package-lock", "--prefix", runner, join(packingDirectory, filename)],
  );
  try {
    const result = await execFileAsync(join(runner, "node_modules", ".bin", "exspecso"), args, { cwd });
    return { exitCode: 0, ...result };
  } catch (error) {
    const commandError = error as Error & { code?: number; stdout?: string; stderr?: string };
    return {
      exitCode: commandError.code ?? 1,
      stdout: commandError.stdout ?? "",
      stderr: commandError.stderr ?? "",
    };
  }
}

describe("packed Codex initializer tracer", () => {
  it("creates only the canonical foundation and Codex adapter", async () => {
    const repositoryRoot = await createGitRepository();

    const result = await packAndRun(repositoryRoot);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toMatch(/^\/exspecso-start/);
    expect(result.stdout).toContain("$exspecso-start");
    expect(result.stdout).not.toContain("/exspecso-start for Claude");
    expect(result.stdout).not.toContain("/exspecso-start for OpenCode");

    const configPath = join(repositoryRoot, ".exspecso", "exspecso.config.json");
    const constitutionPath = join(repositoryRoot, ".exspecso", "constitution.md");
    const adapterPath = join(repositoryRoot, ".agents", "skills", "exspecso-start", "SKILL.md");
    const config = JSON.parse(await readFile(configPath, "utf8")) as {
      schemaVersion: number;
      project: { id: string; title: string };
      mode: string;
      selectedAgents: string[];
      onboardingStatus: string;
    };

    expect(config).toMatchObject({
      schemaVersion: 1,
      project: { title: basename(repositoryRoot) },
      mode: "unclassified",
      selectedAgents: ["codex"],
      onboardingStatus: "not-started",
    });
    expect(config.project.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    const constitution = await readFile(constitutionPath, "utf8");
    expect(constitution).toContain("Artifact truth");
    expect(constitution).toContain("Human control");
    expect(constitution).toContain("Evidence integrity");
    expect(constitution).toContain("Bounded scope");
    expect(constitution).toContain("Runtime portability");

    const adapter = await readFile(adapterPath, "utf8");
    expect(adapter).toMatch(/template-version=1 original-body-sha256=[a-f0-9]{64}/);
    expect(adapter).toContain("exspecso-start");

    await expect(readFile(join(repositoryRoot, ".exspecso", "roadmap.md"), "utf8")).rejects.toThrow();
    await expect(writeFile(join(repositoryRoot, "unrelated.txt"), "unchanged")).resolves.toBeUndefined();
  });

  it("returns an error before writing when the selected agent is unsupported", async () => {
    const repositoryRoot = await createGitRepository();

    const result = await packAndRun(repositoryRoot, ["init", "--agent", "claude"]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("EXSPECSO_INIT_USAGE");
    await expect(readFile(join(repositoryRoot, ".exspecso", "exspecso.config.json"), "utf8")).rejects.toThrow();
    await expect(readFile(join(repositoryRoot, ".agents", "skills", "exspecso-start", "SKILL.md"), "utf8")).rejects.toThrow();
  });
});
