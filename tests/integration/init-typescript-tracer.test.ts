import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
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

const retainedContainmentWorkflows = new Set([
  "containment.yml",
  "containment-posix-tracer.yml",
  "containment-windows-parity.yml",
]);
const retainedScriptMarker = /containment|provider|evidence|matrix|preflight|assembly|local[\s_-]*containment|containment[\s_-]*gate/i;

async function files(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const name = join(prefix, entry.name);
    return entry.isDirectory() ? files(join(root, entry.name), name) : [name];
  }));
  return nested.flat();
}

async function forbiddenWorkflowReferences(repositoryRoot: string, workflowDirectory = join(repositoryRoot, ".github", "workflows")): Promise<string[]> {
  const nativeEntries = (await files(join(repositoryRoot, "native"))).map((entry) => `native/${entry}`.replaceAll("\\", "/").toLowerCase());
  const retainedScripts = await files(join(repositoryRoot, "scripts"));
  const scriptEntries = (await Promise.all(retainedScripts.map(async (entry) => {
    const content = await readFile(join(repositoryRoot, "scripts", entry), "utf8");
    return retainedScriptMarker.test(`${entry}\n${content}`) ? `scripts/${entry}`.replaceAll("\\", "/").toLowerCase() : undefined;
  }))).filter((entry): entry is string => entry !== undefined);
  const failures: string[] = [];
  for (const filename of (await readdir(workflowDirectory)).filter((name) => /\.ya?ml$/i.test(name)).sort()) {
    const text = await readFile(join(workflowDirectory, filename), "utf8");
    const disabled = /^on:\s*\{\}\s*$/m.test(text);
    if (retainedContainmentWorkflows.has(filename)) {
      if (!disabled) failures.push(`${filename}: retained containment workflow must have exactly on: {}`);
      continue;
    }
    if (disabled) failures.push(`${filename}: only retained containment workflows may have on: {}`);
    // This covers job and step `uses`, both single-line and block `run`, and scalar `with`/`env`
    // values without needing a lossy workflow parser for GitHub expression syntax.
    const searchable = text.replaceAll("\\", "/").toLowerCase();
    if (nativeEntries.length > 0 && searchable.includes("native/")) failures.push(`${filename}: references a native entry point`);
    for (const script of scriptEntries) if (searchable.includes(script)) failures.push(`${filename}: references retained script ${script}`);
  }
  return failures;
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

  it("rejects native containment entry points in active workflows", async () => {
    await expect(forbiddenWorkflowReferences(packageRoot)).resolves.toEqual([]);

    const fixtureRoot = await mkdtemp(join(tmpdir(), "exspecso-workflow-scan-"));
    try {
      const workflowDirectory = join(fixtureRoot, ".github", "workflows");
      await mkdir(join(fixtureRoot, "native"), { recursive: true });
      await mkdir(join(fixtureRoot, "scripts"), { recursive: true });
      await writeFile(join(fixtureRoot, "native", "placeholder"), "historical\n");
      await writeFile(join(fixtureRoot, "scripts", "run-local-containment-gate.mjs"), "historical containment gate\n");
      await mkdir(workflowDirectory, { recursive: true });
      await writeFile(join(workflowDirectory, "active.yml"), "name: active\non: push\njobs:\n  test:\n    steps:\n      - run: node native/preflight-windows.mjs\n");
      await expect(forbiddenWorkflowReferences(fixtureRoot)).resolves.toEqual(expect.arrayContaining([
        expect.stringContaining("references a native entry point"),
      ]));

      await writeFile(join(workflowDirectory, "active.yml"), "name: active\non: push\njobs:\n  test:\n    steps:\n      - uses: actions/setup-node@v4\n        with:\n          helper: scripts/run-local-containment-gate.mjs\n");
      await expect(forbiddenWorkflowReferences(fixtureRoot)).resolves.toEqual(expect.arrayContaining([
        expect.stringContaining("run-local-containment-gate.mjs"),
      ]));
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });
});
