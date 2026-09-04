import { spawn } from "node:child_process";
import { readFile, readdir, rm } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { packAndInstall, runInstalledCli } from "../helpers/package-fixture.js";
import { createGitFixture, type GitFixture } from "../helpers/git-fixture.js";

const fixtures: GitFixture[] = [];
const installationRoots: string[] = [];
const packageRoot = resolve(import.meta.dirname, "../..");

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
  await Promise.all(installationRoots.splice(0).map((path) => rm(path, { force: true, recursive: true })));
});

async function fixture(): Promise<GitFixture> {
  const created = await createGitFixture();
  fixtures.push(created);
  return created;
}

async function projectFiles(root: string, directory = root): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await projectFiles(root, path)));
    if (entry.isFile()) result.push(relative(root, path));
  }
  return result.sort();
}

async function runInstalledCliWithTimeout(cliPath: string, cwd: string, env: NodeJS.ProcessEnv, timeoutMs = 2_000): Promise<{ exitCode: number | null; timedOut: boolean; stdout: string; stderr: string }> {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [cliPath, "init", "--agent", "codex"], { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.once("error", (error) => { clearTimeout(timeout); rejectRun(error); });
    child.once("close", (exitCode) => { clearTimeout(timeout); resolveRun({ exitCode, timedOut, stdout, stderr }); });
  });
}

describe("installed package initializer", () => {
  it("ignores the complete legacy EXSPECSO_TEST environment family", async () => {
    const installation = await packAndInstall();
    const installationRoot = dirname(dirname(dirname(installation.packageDirectory)));
    installationRoots.push(installationRoot);
    const repository = await fixture();
    const transactionSignal = join(installationRoot, "caller-selected-transaction-signal.json");
    const ownershipSignal = join(installationRoot, "caller-selected-ownership-signal.json");

    const result = await runInstalledCliWithTimeout(installation.cliPath, repository.root, {
      ...process.env,
      EXSPECSO_TEST_SYNC_FILE: transactionSignal,
      EXSPECSO_TEST_FAULT_POINT: "after-promotion:.exspecso/exspecso.config.json",
      EXSPECSO_TEST_FAULT_MODE: "interrupt",
      EXSPECSO_TEST_WAIT_FOR_KILL: "1",
      EXSPECSO_TEST_OWNERSHIP_SYNC_FILE: ownershipSignal,
      EXSPECSO_TEST_WAIT_FOR_OWNERSHIP_KILL: "1",
    });

    expect(result.timedOut, result.stderr).toBe(false);
    expect(result.exitCode, result.stderr).toBe(0);
    await expect(readFile(transactionSignal, "utf8")).rejects.toThrow();
    await expect(readFile(ownershipSignal, "utf8")).rejects.toThrow();
    expect(installation.inventory).not.toContain("tests/helpers/killed-transaction-child.mjs");
  }, 10_000);

  it("keeps explicit selection outputs identical when ambient agent variables are populated", async () => {
    const installation = await packAndInstall();
    installationRoots.push(dirname(dirname(dirname(installation.packageDirectory))));
    const cleanRepository = await fixture();
    const ambientRepository = await fixture();
    const cleanEnvironment = { ...process.env };
    for (const name of ["CLAUDECODE", "CLAUDE_CODE", "CODEX_HOME", "CODEX", "OPENCODE"]) delete cleanEnvironment[name];

    const clean = await runInstalledCliWithTimeout(installation.cliPath, cleanRepository.root, cleanEnvironment);
    const ambient = await runInstalledCliWithTimeout(installation.cliPath, ambientRepository.root, {
      ...cleanEnvironment,
      CLAUDECODE: "1",
      CLAUDE_CODE: "1",
      CODEX_HOME: "/tmp/codex",
      CODEX: "1",
      OPENCODE: "1",
    });

    expect(clean.timedOut, clean.stderr).toBe(false);
    expect(ambient.timedOut, ambient.stderr).toBe(false);
    expect(clean.exitCode, clean.stderr).toBe(0);
    expect(ambient.exitCode, ambient.stderr).toBe(0);
    expect(ambient.stdout).toBe(clean.stdout);
    await expect(readFile(join(cleanRepository.root, ".exspecso", "exspecso.config.json"), "utf8")).resolves.toEqual(
      expect.stringContaining('"selectedAgents": [\n    "codex"\n  ]'),
    );
    await expect(readFile(join(ambientRepository.root, ".exspecso", "exspecso.config.json"), "utf8")).resolves.toEqual(
      expect.stringContaining('"selectedAgents": [\n    "codex"\n  ]'),
    );
    await expect(projectFiles(ambientRepository.root)).resolves.toEqual(await projectFiles(cleanRepository.root));
    await expect(readFile(join(ambientRepository.root, ".agents", "skills", "exspecso-start", "SKILL.md"), "utf8")).resolves.toEqual(
      await readFile(join(cleanRepository.root, ".agents", "skills", "exspecso-start", "SKILL.md"), "utf8"),
    );
  }, 20_000);

  it("declares only the four representative D-22 compatibility rows", async () => {
    const workflow = await readFile(join(packageRoot, ".github", "workflows", "ci.yml"), "utf8");

    expect(workflow.match(/^\s+- os: /gm)).toHaveLength(4);
    expect(workflow).toContain("os: ubuntu-latest\n            node: 22.13.0");
    expect(workflow).toContain("os: ubuntu-latest\n            node: 24.x");
    expect(workflow).toContain("os: macos-latest\n            node: 24.x");
    expect(workflow).toContain("os: windows-latest\n            node: 24.x");
    expect(workflow).toContain("permissions:\n  contents: read");
    expect(workflow).toContain("actions/checkout@v6");
    expect(workflow).toContain("actions/setup-node@v6");
    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("npm run build");
    expect(workflow).toContain("npm test -- --run");
    expect(workflow).toContain("npm pack --dry-run --json");
    expect(workflow).not.toMatch(/native|compiler|sanitizer|prebuild/i);
  });

  it("packs a native-free tarball and proves every selected runtime subset from root and nested directories", async () => {
    const installation = await packAndInstall();
    installationRoots.push(dirname(dirname(dirname(installation.packageDirectory))));

    expect(installation.inventory).toEqual(expect.arrayContaining([
      "package.json",
      "dist/cli/main.js",
      "dist/cli/main.d.ts",
      "dist/init/run-init.js",
      "dist/init/run-init.d.ts",
    ]));
    expect(installation.inventory.some((entry) => entry === "native" || entry.startsWith("native/") || entry === "build" || entry.startsWith("build/") || entry.endsWith(".node") || entry.includes("prebuild"))).toBe(false);

    const agentSubsets = [
      ["claude"],
      ["codex"],
      ["opencode"],
      ["claude", "codex"],
      ["claude", "opencode"],
      ["codex", "opencode"],
      ["claude", "codex", "opencode"],
    ] as const;

    for (const agents of agentSubsets) {
      const repository = await fixture();
      const nested = await repository.createNestedDirectory("work", "nested");
      const argumentsFor = (selected: readonly string[]) => ["init", ...selected.flatMap((agent) => ["--agent", agent])];

      const first = await runInstalledCli(installation, repository.root, argumentsFor(agents));
      expect(first.exitCode, first.stderr).toBe(0);
      expect(first.stdout).toContain("/exspecso-start");
      for (const agent of agents) expect(first.stdout).toContain(agent === "codex" ? "$exspecso-start" : "/exspecso-start");

      const configPath = join(repository.root, ".exspecso", "exspecso.config.json");
      const initialConfig = JSON.parse(await readFile(configPath, "utf8")) as { project: { id: string }; selectedAgents: string[] };
      expect(initialConfig.selectedAgents).toEqual(agents);

      const repeated = await runInstalledCli(installation, nested, argumentsFor(agents));
      expect(repeated.exitCode, repeated.stderr).toBe(0);
      await expect(readFile(configPath, "utf8")).resolves.toContain(initialConfig.project.id);
      await expect(projectFiles(repository.root)).resolves.toEqual(expect.arrayContaining([
        ".exspecso/constitution.md",
        ".exspecso/exspecso.config.json",
      ]));
      await expect(readFile(join(repository.root, ".exspecso", "roadmap.md"), "utf8")).rejects.toThrow();
    }
  }, 30_000);

  it("adds selected adapters without changing the project identity or unselected adapter bytes", async () => {
    const installation = await packAndInstall();
    installationRoots.push(dirname(dirname(dirname(installation.packageDirectory))));
    const repository = await fixture();

    const first = await runInstalledCli(installation, repository.root, ["init", "--agent", "codex"]);
    expect(first.exitCode, first.stderr).toBe(0);
    const configPath = join(repository.root, ".exspecso", "exspecso.config.json");
    const codexPath = join(repository.root, ".agents", "skills", "exspecso-start", "SKILL.md");
    const initialConfig = JSON.parse(await readFile(configPath, "utf8")) as { project: { id: string } };
    const codexBefore = await readFile(codexPath, "utf8");

    const repeated = await runInstalledCli(installation, repository.root, ["init", "--agent", "claude"]);
    expect(repeated.exitCode, repeated.stderr).toBe(0);
    expect(JSON.parse(await readFile(configPath, "utf8"))).toMatchObject({
      project: initialConfig.project,
      selectedAgents: ["codex", "claude"],
    });
    await expect(readFile(codexPath, "utf8")).resolves.toBe(codexBefore);
    await expect(readFile(join(repository.root, ".claude", "skills", "exspecso-start", "SKILL.md"), "utf8")).resolves.toContain("exspecso-start");
    await expect(projectFiles(repository.root)).resolves.toEqual([
      ".agents/skills/exspecso-start/SKILL.md",
      ".claude/skills/exspecso-start/SKILL.md",
      ".exspecso/constitution.md",
      ".exspecso/exspecso.config.json",
    ]);
  });
});
