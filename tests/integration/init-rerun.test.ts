import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { PassThrough, Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { inspectManagedFile, renderManagedFile } from "../../src/adapters/managed-file.js";
import { ADAPTER_REGISTRY } from "../../src/adapters/registry.js";
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

// Freeze the old renderer independently of renderManagedFile so migration tests
// cannot silently start using the new layout when the generator changes.
function legacySkill(agent: "claude" | "codex"): string {
  const runtime = agent === "claude" ? "Claude Code" : "OpenAI Codex";
  const invocation = agent === "claude" ? "/exspecso-start" : "$exspecso-start";
  const body = `---\nname: exspecso-start\ndescription: Begin Exspecso project orientation from the canonical repository artifacts.\n---\n\n# Exspecso Start\n\nUse the repository's canonical Exspecso artifacts to begin project orientation in ${runtime}. The portable operation identity is \`exspecso-start\`, documented as \`/exspecso-start\`; invoke it here as \`${invocation}\`. Preserve approved intent, surface uncertainty for human resolution, and write only the artifacts required by the approved workflow.\n`;
  return `<!-- exspecso:managed template-version=1 original-body-sha256=${createHash("sha256").update(body).digest("hex")} -->\n${body}`;
}

describe("skill migration preflight", () => {
  it.each(["claude", "codex"] as const)("plans only the selected pristine legacy %s migration and binds its full preimage", async (agent) => {
    const fixture = await useFixture();
    const initial = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: ["claude", "codex", "opencode"] });
    // Seed files directly: these tests exercise read-only planning, not native promotion.
    for (const write of initial.writes) {
      await mkdir(dirname(write.target), { recursive: true });
      await writeFile(write.target, write.content);
    }
    for (const selected of ["claude", "codex"] as const) {
      await writeFile(join(fixture.root, ADAPTER_REGISTRY[selected].relativePath), legacySkill(selected));
    }
    const before = await snapshot(fixture.root);

    const plan = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: [agent] });

    expect(plan.conflicts).toEqual([]);
    expect(plan.approvalProblems).toEqual([]);
    expect(plan.writes).toEqual([expect.objectContaining({
      relativePath: ADAPTER_REGISTRY[agent].relativePath,
      content: ADAPTER_REGISTRY[agent].render(),
      expectedExists: true,
      expectedPreimageHash: createHash("sha256").update(legacySkill(agent)).digest("hex"),
    })]);
    expect(plan.writes[0].content.startsWith("---\n")).toBe(true);
    await expect(validateInitPlan(plan)).resolves.toEqual([]);
    await expect(snapshot(fixture.root)).resolves.toEqual(before);

    await writeFile(plan.writes[0].target, legacySkill(agent).replace("description: Begin", "description: User edit. Begin"));
    await expect(validateInitPlan(plan)).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "EXSPECSO_INIT_STALE_PREIMAGE" }),
    ]));
  });

  it.each(["claude", "codex"] as const)("requires scoped replacement for conflicting legacy and current %s skills", async (agent) => {
    const fixture = await useFixture();
    const target = join(fixture.root, ADAPTER_REGISTRY[agent].relativePath);
    await mkdir(dirname(target), { recursive: true });

    for (const original of [legacySkill(agent), ADAPTER_REGISTRY[agent].render()]) {
      for (const [content, state] of [
        [original.replace("description: Begin", "description: User edit. Begin"), "owned-modified"],
        [original + "User instruction.\n", "owned-modified"],
        [original.replace("template-version=1", "template-version=99"), "malformed-header"],
        [original.replace("original-body-sha256=", "broken-hash="), "malformed-header"],
        ["---\nname: exspecso-start\ndescription: User skill.\n---\nUser instructions.\n", "unowned"],
      ]) {
        await writeFile(target, content);
        const before = await snapshot(fixture.root);
        const plan = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: [agent] });
        expect(plan.conflicts).toEqual([expect.objectContaining({ agent, state })]);
        expect(plan.writes.some((write) => write.target === target)).toBe(false);
        await expect(validateInitPlan(plan)).resolves.toEqual(expect.arrayContaining([
          expect.objectContaining({ code: "EXSPECSO_INIT_ADAPTER_CONFLICT" }),
        ]));

        const approved = await buildInitPlan({ repositoryRoot: fixture.root, selectedAgents: [agent], replaceAgents: [agent] });
        expect(approved.conflicts).toEqual([]);
        expect(approved.writes.find((write) => write.target === target)?.content).toBe(ADAPTER_REGISTRY[agent].render());
        await expect(validateInitPlan(approved)).resolves.toEqual([]);
        await expect(snapshot(fixture.root)).resolves.toEqual(before);

        await writeFile(target, content + "Changed after approval.\n");
        await expect(validateInitPlan(approved)).resolves.toEqual(expect.arrayContaining([
          expect.objectContaining({ code: "EXSPECSO_INIT_STALE_PREIMAGE" }),
        ]));
      }
    }
  });
});

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

  it.each(["claude", "codex"] as const)("migrates a pristine legacy %s adapter and remains idempotent while preserving canonical artifacts", async (agent) => {
    const fixture = await useFixture();
    const initial = await initialize(fixture.root, ["claude", "codex", "opencode"]);
    expect(initial, initial.stderr).toMatchObject({ exitCode: 0 });
    const canonicalBefore = await snapshot(join(fixture.root, ".exspecso"));
    const adapterPath = join(fixture.root, ADAPTER_REGISTRY[agent].relativePath);
    await writeFile(adapterPath, legacySkill(agent));
    const before = await snapshot(fixture.root);
    const expectedSnapshot = { ...before, [relative(fixture.root, adapterPath)]: ADAPTER_REGISTRY[agent].render() };

    await expect(initialize(fixture.root, [agent])).resolves.toMatchObject({ exitCode: 0 });

    await expect(snapshot(join(fixture.root, ".exspecso"))).resolves.toEqual(canonicalBefore);
    await expect(snapshot(fixture.root)).resolves.toEqual(expectedSnapshot);
    await expect(initialize(fixture.root, [agent])).resolves.toMatchObject({ exitCode: 0 });
    await expect(snapshot(fixture.root)).resolves.toEqual(expectedSnapshot);
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

    await expect(readFile(codexPath, "utf8")).resolves.toBe(ADAPTER_REGISTRY.codex.render());
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
