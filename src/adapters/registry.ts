import { createHash } from "node:crypto";
import type { AgentId } from "../init/runtime-selection.js";

export interface AdapterDefinition {
  readonly agent: AgentId;
  readonly displayName: string;
  readonly relativePath: string;
  readonly operationId: "exspecso-start";
  readonly canonicalInvocation: "/exspecso-start";
  readonly nativeInvocation: "/exspecso-start" | "$exspecso-start";
  render(): string;
}

const templateVersion = 1;

function withManagedHeader(body: string): string {
  const hash = createHash("sha256").update(body).digest("hex");
  return `<!-- exspecso:managed template-version=${templateVersion} original-body-sha256=${hash} -->\n${body}`;
}

function skillBody(runtime: string, nativeInvocation: string): string {
  return `---
name: exspecso-start
description: Begin Exspecso project orientation from the canonical repository artifacts.
---

# Exspecso Start

Use the repository's canonical Exspecso artifacts to begin project orientation in ${runtime}. The portable operation identity is \`exspecso-start\`, documented as \`/exspecso-start\`; invoke it here as \`${nativeInvocation}\`. Preserve approved intent, surface uncertainty for human resolution, and write only the artifacts required by the approved workflow.
`;
}

const openCodeBody = `# Exspecso Start

Use the repository's canonical Exspecso artifacts to begin project orientation in OpenCode. The portable operation identity is \`exspecso-start\`, documented and invoked here as \`/exspecso-start\`. Preserve approved intent, surface uncertainty for human resolution, and write only the artifacts required by the approved workflow.
`;

function defineAdapter(
  definition: Omit<AdapterDefinition, "render"> & { readonly body: string },
): AdapterDefinition {
  const { body, ...adapter } = definition;
  return Object.freeze({
    ...adapter,
    render: () => withManagedHeader(body),
  });
}

export const ADAPTER_REGISTRY: Readonly<Record<AgentId, AdapterDefinition>> = Object.freeze({
  claude: defineAdapter({
    agent: "claude",
    displayName: "Claude Code",
    relativePath: ".claude/skills/exspecso-start/SKILL.md",
    operationId: "exspecso-start",
    canonicalInvocation: "/exspecso-start",
    nativeInvocation: "/exspecso-start",
    body: skillBody("Claude Code", "/exspecso-start"),
  }),
  codex: defineAdapter({
    agent: "codex",
    displayName: "OpenAI Codex",
    relativePath: ".agents/skills/exspecso-start/SKILL.md",
    operationId: "exspecso-start",
    canonicalInvocation: "/exspecso-start",
    nativeInvocation: "$exspecso-start",
    body: skillBody("OpenAI Codex", "$exspecso-start"),
  }),
  opencode: defineAdapter({
    agent: "opencode",
    displayName: "OpenCode",
    relativePath: ".opencode/commands/exspecso-start.md",
    operationId: "exspecso-start",
    canonicalInvocation: "/exspecso-start",
    nativeInvocation: "/exspecso-start",
    body: openCodeBody,
  }),
});

export function renderAdapter(adapter: AdapterDefinition): string {
  return adapter.render();
}
