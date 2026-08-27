import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { PassThrough, Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { inspectManagedFile, renderManagedFile } from "../../src/adapters/managed-file.js";
import { parseInitArguments } from "../../src/cli/arguments.js";
import { buildInitPlan, validateInitPlan } from "../../src/init/plan.js";
import { runInit } from "../../src/init/run-init.js";
import { createGitFixture, type GitFixture } from "../helpers/git-fixture.js";

const fixtures: GitFixture[] = [];

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
});

async function useFixture(): Promise<GitFixture> {
  const fixture = await createGitFixture();
  fixtures.push(fixture);
  return fixture;
}

function output(): { stream: Writable; read: () => string } {
  let value = "";
  return {
    stream: new Writable({
      write(chunk, _encoding, callback) {
        value += chunk.toString();
        callback();
      },
    }),
    read: () => value,
  };
}

async function initialize(root: string, selectedAgents: Array<"claude" | "codex" | "opencode">, replaceAgents: Array<"claude" | "codex" | "opencode"> = []) {
  const stdout = output();
  const stderr = output();
  const exitCode = await runInit({
    selectedAgents,
    replaceAgents,
    cwd: root,
    stdin: new PassThrough(),
    stdout: stdout.stream,
    stderr: stderr.stream,
  });
  return { exitCode, stdout: stdout.read(), stderr: stderr.read() };
}

async function snapshot(root: string, directory = root): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) Object.assign(files, await snapshot(root, path));
    if (entry.isFile()) files[relative(root, path)] = await readFile(path, "utf8");
  }
  return files;
}

describe("managed adapter ownership", () => {
  const body = "# Exspecso Start\n\nGenerated adapter body.\n";
  const generated = renderManagedFile(body);

  it("classifies a missing target and an unchanged generated adapter", () => {
    expect(inspectManagedFile(undefined, generated)).toMatchObject({ state: "absent" });
    expect(inspectManagedFile(generated, generated)).toMatchObject({ state: "owned-unchanged" });
  });

  it("preserves a changed owned adapter and returns a deterministic concise diff", () => {
    const modified = `${generated}Local user note.\n`;
    const inspection = inspectManagedFile(modified, generated);

    expect(inspection.state).toBe("owned-modified");
    expect(inspection.existingContent).toBe(modified);
    expect(inspection.diff).toContain("--- existing");
    expect(inspection.diff).toContain("+++ generated");
    expect(inspection.diff).toContain("-Local user note.");
  });

  it("does not grant ownership to unowned or malformed headers", () => {
    expect(inspectManagedFile("# User-owned adapter\n", generated)).toMatchObject({ state: "unowned" });
    expect(inspectManagedFile("<!-- exspecso:managed template-version=wrong -->\nbody\n", generated)).toMatchObject({
      state: "malformed-header",
    });
  });

  it("writes only a self-contained version and original body fingerprint", () => {
    expect(generated).toMatch(/^<!-- exspecso:managed template-version=1 original-body-sha256=[a-f0-9]{64} -->\n/);
    expect(generated).not.toContain("manifest");
  });
});

describe("additive initialization reruns", () => {
  it("parses replacement approval as a strict repeatable option", () => {
    expect(parseInitArguments(["--agent", "codex", "--replace-agent", "codex", "--replace-agent", "claude"])).toEqual({
      kind: "parsed",
      agents: ["codex"],
      replaceAgents: ["codex", "claude"],
    });
    expect(parseInitArguments(["--replace-agent"])).toMatchObject({ kind: "invalid", code: "EXSPECSO_INIT_USAGE" });
  });

  it("unions a new selected agent without changing project identity, constitution, or unselected adapter bytes", async () => {
    const fixture = await useFixture();
    await expect(initialize(fixture.root, ["codex"])).resolves.toMatchObject({ exitCode: 0 });
    const configPath = join(fixture.root, ".exspecso", "exspecso.config.json");
    const constitutionPath = join(fixture.root, ".exspecso", "constitution.md");
    const codexPath = join(fixture.root, ".agents", "skills", "exspecso-start", "SKILL.md");
    const beforeConfig = JSON.parse(await readFile(configPath, "utf8")) as { project: { id: string; title: string } };
    const beforeConstitution = await readFile(constitutionPath, "utf8");
    const beforeCodex = await readFile(codexPath, "utf8");

    await expect(initialize(fixture.root, ["claude"])).resolves.toMatchObject({ exitCode: 0 });

    expect(JSON.parse(await readFile(configPath, "utf8"))).toMatchObject({
      project: beforeConfig.project,
      selectedAgents: ["codex", "claude"],
    });
    await expect(readFile(constitutionPath, "utf8")).resolves.toBe(beforeConstitution);
    await expect(readFile(codexPath, "utf8")).resolves.toBe(beforeCodex);
    await expect(readFile(join(fixture.root, ".claude", "skills", "exspecso-start", "SKILL.md"), "utf8")).resolves.toContain("exspecso-start");
  });

  it("refreshes an unchanged owned selected adapter while preserving canonical artifacts", async () => {
    const fixture = await useFixture();
    await initialize(fixture.root, ["codex"]);
    const canonicalBefore = await snapshot(join(fixture.root, ".exspecso"));
    const codexPath = join(fixture.root, ".agents", "skills", "exspecso-start", "SKILL.md");
    const adapterBefore = await readFile(codexPath, "utf8");

    await expect(initialize(fixture.root, ["codex"])).resolves.toMatchObject({ exitCode: 0 });

    await expect(snapshot(join(fixture.root, ".exspecso"))).resolves.toEqual(canonicalBefore);
    await expect(readFile(codexPath, "utf8")).resolves.toBe(adapterBefore);
  });

  it("reports every selected conflict and writes nothing", async () => {
    const fixture = await useFixture();
    await initialize(fixture.root, ["codex", "claude"]);
    const codexPath = join(fixture.root, ".agents", "skills", "exspecso-start", "SKILL.md");
    const claudePath = join(fixture.root, ".claude", "skills", "exspecso-start", "SKILL.md");
    await writeFile(codexPath, `${await readFile(codexPath, "utf8")}local codex edit\n`, "utf8");
    await writeFile(claudePath, "# User-owned Claude adapter\n", "utf8");
    const before = await snapshot(fixture.root);

    const result = await initialize(fixture.root, ["codex", "claude"]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("EXSPECSO_INIT_ADAPTER_CONFLICT");
    expect(result.stderr).toContain(".agents/skills/exspecso-start/SKILL.md");
    expect(result.stderr).toContain(".claude/skills/exspecso-start/SKILL.md");
    expect(result.stderr).toContain("--replace-agent codex");
    expect(result.stderr).toContain("--replace-agent claude");
    await expect(snapshot(fixture.root)).resolves.toEqual(before);
  });

  it("replaces only an explicitly selected conflicting adapter", async () => {
    const fixture = await useFixture();
    await initialize(fixture.root, ["codex", "claude"]);
    const codexPath = join(fixture.root, ".agents", "skills", "exspecso-start", "SKILL.md");
    const claudePath = join(fixture.root, ".claude", "skills", "exspecso-start", "SKILL.md");
    await writeFile(codexPath, "# User-owned Codex adapter\n", "utf8");
    await writeFile(claudePath, "# User-owned Claude adapter\n", "utf8");
    const claudeBefore = await readFile(claudePath, "utf8");

    await expect(initialize(fixture.root, ["codex"], ["codex"])).resolves.toMatchObject({ exitCode: 0 });

    await expect(readFile(codexPath, "utf8")).resolves.toMatch(/^<!-- exspecso:managed/);
    await expect(readFile(claudePath, "utf8")).resolves.toBe(claudeBefore);
  });

  it("rejects an approval whose planned preimage became stale", async () => {
    const fixture = await useFixture();
    await initialize(fixture.root, ["codex"]);
    const codexPath = join(fixture.root, ".agents", "skills", "exspecso-start", "SKILL.md");
    await writeFile(codexPath, "# User-owned Codex adapter\n", "utf8");
    const plan = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: ["codex"], replaceAgents: ["codex"] });
    await writeFile(codexPath, "# Changed after review\n", "utf8");

    await expect(validateInitPlan(plan)).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "EXSPECSO_INIT_STALE_PREIMAGE" }),
    ]));
  });
});
