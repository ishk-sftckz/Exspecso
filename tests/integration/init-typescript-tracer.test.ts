import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createGitFixture, type GitFixture } from "../helpers/git-fixture.js";
import { runCli } from "../helpers/run-cli.js";

const fixtures: GitFixture[] = [];
const packageRoot = resolve(import.meta.dirname, "../..");

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
});

async function fixture(): Promise<GitFixture> {
  const created = await createGitFixture();
  fixtures.push(created);
  return created;
}

async function snapshot(root: string, prefix = ""): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of (await readdir(root, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name === ".git") continue;
    const path = join(root, entry.name);
    const name = relative(root, path);
    if (entry.isDirectory()) Object.assign(result, await snapshot(path, join(prefix, name)));
    else result[join(prefix, name)] = await readFile(path, "utf8");
  }
  return result;
}

function cli(root: string) {
  return runCli(process.execPath, [join(packageRoot, "dist", "cli", "main.js"), "init", "--agent", "codex"], { cwd: root });
}

describe("pure TypeScript initializer tracer", () => {
  it("initializes the containing Git root from root and nested directories, then preserves confirmed artifacts on an additive rerun", async () => {
    const repository = await fixture();
    const nested = await repository.createNestedDirectory("work", "nested");

    await expect(cli(repository.root)).resolves.toMatchObject({ exitCode: 0 });
    const configPath = join(repository.root, ".exspecso", "exspecso.config.json");
    const constitutionPath = join(repository.root, ".exspecso", "constitution.md");
    const beforeConfig = await readFile(configPath, "utf8");
    const beforeConstitution = await readFile(constitutionPath, "utf8");
    await expect(readFile(join(repository.root, ".agents", "skills", "exspecso-start", "SKILL.md"), "utf8")).resolves.toContain("exspecso-start");
    await expect(readFile(join(repository.root, ".claude", "skills", "exspecso-start", "SKILL.md"), "utf8")).rejects.toThrow();

    await expect(cli(nested)).resolves.toMatchObject({ exitCode: 0 });
    await expect(readFile(configPath, "utf8")).resolves.toBe(beforeConfig);
    await expect(readFile(constitutionPath, "utf8")).resolves.toBe(beforeConstitution);
  });

  it("reports aggregate canonical JSON diagnostics without mutating the repository", async () => {
    const repository = await fixture();
    await mkdir(join(repository.root, ".exspecso"));
    await writeFile(join(repository.root, ".exspecso", "exspecso.config.json"), "{ invalid json\n", "utf8");
    const before = await snapshot(repository.root);

    const result = await cli(repository.root);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("EXSPECSO_CONFIG_PARSE");
    await expect(snapshot(repository.root)).resolves.toEqual(before);
  });
});
