import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { inspectManagedFile, renderManagedFile } from "../../src/adapters/managed-file.js";
import { ADAPTER_REGISTRY, buildAdapterPlan, renderAdapter } from "../../src/adapters/registry.js";
import { formatCompletion } from "../../src/init/completion.js";
import { SUPPORTED_AGENTS, type AgentId } from "../../src/init/runtime-selection.js";

const expected = {
  claude: {
    path: ".claude/skills/exspecso-start/SKILL.md",
    invocation: "/exspecso-start",
  },
  codex: {
    path: ".agents/skills/exspecso-start/SKILL.md",
    invocation: "$exspecso-start",
  },
  opencode: {
    path: ".opencode/commands/exspecso-start.md",
    invocation: "/exspecso-start",
  },
} as const;

function nonEmptySubsets(values: readonly AgentId[]): AgentId[][] {
  return Array.from({ length: 2 ** values.length - 1 }, (_, mask) =>
    values.filter((_, index) => (mask & (1 << index)) !== 0),
  );
}

describe("native adapter registry", () => {
  it.each(SUPPORTED_AGENTS)("maps %s to its only native destination and invocation", (agent) => {
    const adapter = ADAPTER_REGISTRY[agent];

    expect(adapter.agent).toBe(agent);
    expect(adapter.relativePath).toBe(expected[agent].path);
    expect(adapter.operationId).toBe("exspecso-start");
    expect(adapter.canonicalInvocation).toBe("/exspecso-start");
    expect(adapter.nativeInvocation).toBe(expected[agent].invocation);

    const rendered = renderAdapter(adapter);
    expect(inspectManagedFile(rendered, rendered).state).toBe("owned-unchanged");
    expect(rendered).toContain("exspecso-start");
    expect(rendered).toContain("/exspecso-start");
  });

  it.each(["claude", "codex"] as const)("starts %s skills with native frontmatter and fingerprints metadata and instructions", (agent) => {
    const rendered = renderAdapter(ADAPTER_REGISTRY[agent]);
    const match = rendered.match(/^(---\nname: exspecso-start\ndescription: Begin Exspecso project orientation from the canonical repository artifacts\.\n---\n)(<!-- exspecso:managed template-version=1 original-body-sha256=([a-f0-9]{64}) -->\n)([\s\S]*)$/);

    expect(match).not.toBeNull();
    const [, frontmatter, , hash, instructions] = match!;
    const body = frontmatter + instructions;
    expect(hash).toBe(createHash("sha256").update(body).digest("hex"));
    expect(rendered.match(/<!-- exspecso:managed/g)).toHaveLength(1);
    expect(inspectManagedFile(rendered, rendered)).toMatchObject({ state: "owned-unchanged", expectedHash: hash, actualHash: hash });
  });

  it("preserves the exact marker-first OpenCode format", () => {
    const body = "# Exspecso Start\n\nUse the repository's canonical Exspecso artifacts to begin project orientation in OpenCode. The portable operation identity is `exspecso-start`, documented and invoked here as `/exspecso-start`. Preserve approved intent, surface uncertainty for human resolution, and write only the artifacts required by the approved workflow.\n";
    const hash = createHash("sha256").update(body).digest("hex");
    expect(renderAdapter(ADAPTER_REGISTRY.opencode)).toBe(`<!-- exspecso:managed template-version=1 original-body-sha256=${hash} -->\n${body}`);
  });

  it("formats one exact concise success line independently of runtime selection", () => {
    expect(formatCompletion()).toBe("Exspecso initialized successfully.\n");
  });

  it("writes only selected native targets for every non-empty subset", () => {
    for (const selected of nonEmptySubsets(SUPPORTED_AGENTS)) {
      const targets = buildAdapterPlan(selected).map((target) => target.relativePath);

      expect(targets).toEqual(selected.map((agent) => expected[agent].path));
    }
  });

  it("renders concurrent selections without shared or widened state", async () => {
    const selections = nonEmptySubsets(SUPPORTED_AGENTS);
    const renders = await Promise.all(
      selections.map(async (selected) => ({
        selected,
        targets: buildAdapterPlan(selected).map((target) => ({ path: target.relativePath, content: target.content })),
      })),
    );

    for (const render of renders) {
      expect(render.targets.map((target) => target.path)).toEqual(
        render.selected.map((agent) => expected[agent].path),
      );
      expect(render.targets.every((target) => target.content.includes("exspecso-start"))).toBe(true);
    }
  });
});

describe("frontmatter-aware managed fingerprints", () => {
  const frontmatter = "---\nname: exspecso-start\ndescription: Original description.\n---\n";
  const instructions = "\n# Exspecso Start\n\nOriginal instructions.\n";
  const body = frontmatter + instructions;
  const hash = createHash("sha256").update(body).digest("hex");
  const marker = `<!-- exspecso:managed template-version=1 original-body-sha256=${hash} -->\n`;
  const layouts = { legacy: marker + body, native: frontmatter + marker + instructions };

  it.each(Object.entries(layouts))("recognizes a pristine %s layout without changing fingerprint semantics", (_name, content) => {
    expect(inspectManagedFile(content, layouts.native)).toMatchObject({ state: "owned-unchanged", expectedHash: hash, actualHash: hash });
  });

  it("inserts the marker without changing any original content bytes", () => {
    expect(renderManagedFile(body)).toBe(layouts.native);
    expect(renderManagedFile(instructions)).toBe(`<!-- exspecso:managed template-version=1 original-body-sha256=${createHash("sha256").update(instructions).digest("hex")} -->\n${instructions}`);
  });

  it.each(Object.entries(layouts))("protects metadata and instruction edits in the %s layout", (_name, content) => {
    for (const edited of [
      content.replace("name: exspecso-start", "name: custom-start"),
      content.replace("Original description.", "User description."),
      content.replace("Original instructions.", "User instructions."),
      content + "User note.\n",
    ]) {
      const inspection = inspectManagedFile(edited, layouts.native);
      expect(inspection.state).toBe("owned-modified");
      expect(inspection.expectedHash).toBe(hash);
      expect(inspection.actualHash).not.toBe(hash);
      expect(inspection.diff).toContain("--- existing");
      expect(inspectManagedFile(edited, layouts.native)).toEqual(inspection);
    }
  });

  it.each(Object.entries(layouts))("rejects malformed and unsupported markers in the %s layout", (_name, content) => {
    for (const edited of [
      content.replace("template-version=1", "template-version=2"),
      content.replace("template-version=1", "template-version=wrong"),
      content.replace(hash, "bad-hash"),
    ]) {
      expect(inspectManagedFile(edited, layouts.native).state).toBe("malformed-header");
    }
  });

  it("never treats a marker in prose or incomplete frontmatter as proof of ownership", () => {
    for (const content of [
      body,
      `User preface.\n${layouts.legacy}`,
      `${frontmatter}\nUser preface.\n${marker}${instructions}`,
      `---\nname: exspecso-start\n${marker}${instructions}`,
      `${frontmatter}\n\`\`\`markdown\n${layouts.legacy}\`\`\`\n`,
    ]) {
      expect(inspectManagedFile(content, layouts.native).state).toBe("unowned");
    }
  });

  it("does not ignore duplicate markers when computing the fingerprint", () => {
    expect(inspectManagedFile(frontmatter + marker + marker + instructions, layouts.native).state).toBe("owned-modified");
  });
});
