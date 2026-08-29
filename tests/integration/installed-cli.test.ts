import { readFile, readdir, rm } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { packAndInstall, runInstalledCli } from "../helpers/package-fixture.js";
import { createGitFixture, type GitFixture } from "../helpers/git-fixture.js";

const fixtures: GitFixture[] = [];
const installationRoots: string[] = [];

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

describe("installed package initializer", () => {
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
  });

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
