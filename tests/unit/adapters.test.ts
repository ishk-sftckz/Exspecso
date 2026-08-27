import { describe, expect, it } from "vitest";
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
    expect(rendered).toMatch(/^<!-- exspecso:managed template-version=1 original-body-sha256=[a-f0-9]{64} -->\n/);
    expect(rendered).toContain("exspecso-start");
    expect(rendered).toContain("/exspecso-start");
  });

  it("writes only selected native targets and completion invocations for every non-empty subset", () => {
    for (const selected of nonEmptySubsets(SUPPORTED_AGENTS)) {
      const targets = buildAdapterPlan(selected).map((target) => target.relativePath);
      const completion = formatCompletion(selected);

      expect(targets).toEqual(selected.map((agent) => expected[agent].path));
      expect(completion.startsWith("/exspecso-start\n")).toBe(true);
      for (const agent of SUPPORTED_AGENTS) {
        const expectedLine = `For ${ADAPTER_REGISTRY[agent].displayName}, invoke ${expected[agent].invocation}`;
        expect(completion.includes(expectedLine)).toBe(selected.includes(agent));
      }
    }
  });

  it("renders concurrent selections without shared or widened state", async () => {
    const selections = nonEmptySubsets(SUPPORTED_AGENTS);
    const renders = await Promise.all(
      selections.map(async (selected) => ({
        selected,
        targets: buildAdapterPlan(selected).map((target) => ({ path: target.relativePath, content: target.content })),
        completion: formatCompletion(selected),
      })),
    );

    for (const render of renders) {
      expect(render.targets.map((target) => target.path)).toEqual(
        render.selected.map((agent) => expected[agent].path),
      );
      expect(render.completion).toContain("/exspecso-start");
      expect(render.targets.every((target) => target.content.includes("exspecso-start"))).toBe(true);
    }
  });
});
