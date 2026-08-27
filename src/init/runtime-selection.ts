import { checkbox } from "@inquirer/prompts";

export type AgentId = "claude" | "codex" | "opencode";

export const SUPPORTED_AGENTS: readonly AgentId[] = ["claude", "codex", "opencode"];

const agentNames: Readonly<Record<AgentId, string>> = {
  claude: "Claude Code",
  codex: "OpenAI Codex",
  opencode: "OpenCode",
};

export interface AgentChoice {
  value: AgentId;
  name: string;
  checked: false;
}

export type SelectionResult =
  | { kind: "selected"; agents: readonly AgentId[] }
  | { kind: "cancelled" }
  | { kind: "invalid"; code: "EXSPECSO_INIT_AGENT_REQUIRED" | "EXSPECSO_INIT_INVALID_AGENT"; message: string };

export type AgentPromptResult = readonly string[] | { cancelled: true };
export type AgentPrompt = (choices: readonly AgentChoice[]) => Promise<AgentPromptResult>;

export interface InteractiveSelectionInput {
  detectedAgents: readonly AgentId[];
  prompt: AgentPrompt;
  onEmptySelection?: (message: string) => void;
}

export interface ResolveSelectedAgentsInput {
  argvAgents: readonly string[];
  isInputTTY: boolean;
  isOutputTTY: boolean;
  detectedAgents: readonly AgentId[];
  prompt?: AgentPrompt;
  onEmptySelection?: (message: string) => void;
}

const emptySelectionMessage = "Select at least one runtime before continuing.";

function isAgentId(value: string): value is AgentId {
  return SUPPORTED_AGENTS.includes(value as AgentId);
}

function choicesFor(detectedAgents: readonly AgentId[]): AgentChoice[] {
  const detected = new Set(detectedAgents);
  return SUPPORTED_AGENTS.map((agent) => ({
    value: agent,
    name: `${agentNames[agent]}${detected.has(agent) ? " (detected)" : ""}`,
    checked: false,
  }));
}

function normalizeSubmittedAgents(agents: readonly string[]): SelectionResult {
  const selected: AgentId[] = [];
  for (const agent of agents) {
    if (!isAgentId(agent)) {
      return {
        kind: "invalid",
        code: "EXSPECSO_INIT_INVALID_AGENT",
        message: `Unsupported agent \`${agent}\`. Expected claude, codex, or opencode.`,
      };
    }
    if (!selected.includes(agent)) {
      selected.push(agent);
    }
  }

  if (selected.length === 0) {
    return {
      kind: "invalid",
      code: "EXSPECSO_INIT_AGENT_REQUIRED",
      message: "Non-interactive init requires at least one `--agent claude|codex|opencode` flag.",
    };
  }

  return { kind: "selected", agents: selected };
}

export function detectAgents(environment: NodeJS.ProcessEnv = process.env): AgentId[] {
  const detected: AgentId[] = [];
  if (environment.CLAUDECODE !== undefined || environment.CLAUDE_CODE !== undefined) {
    detected.push("claude");
  }
  if (environment.CODEX_HOME !== undefined || environment.CODEX !== undefined) {
    detected.push("codex");
  }
  if (environment.OPENCODE !== undefined) {
    detected.push("opencode");
  }
  return detected;
}

export async function promptForAgents(choices: readonly AgentChoice[]): Promise<AgentPromptResult> {
  try {
    return await checkbox({
      message: "Select coding runtimes to configure",
      choices,
      required: true,
      validate: (selected) => selected.length > 0 || emptySelectionMessage,
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "AbortPromptError" || error.name === "ExitPromptError")) {
      return { cancelled: true };
    }
    throw error;
  }
}

export async function chooseAgentsInteractively(input: InteractiveSelectionInput): Promise<SelectionResult> {
  const choices = choicesFor(input.detectedAgents);
  while (true) {
    const submitted = await input.prompt(choices);
    if (typeof submitted === "object" && "cancelled" in submitted) {
      return { kind: "cancelled" };
    }
    if (submitted.length === 0) {
      input.onEmptySelection?.(emptySelectionMessage);
      continue;
    }
    return normalizeSubmittedAgents(submitted);
  }
}

export async function resolveSelectedAgents(input: ResolveSelectedAgentsInput): Promise<SelectionResult> {
  if (input.argvAgents.length > 0 || !input.isInputTTY || !input.isOutputTTY) {
    return normalizeSubmittedAgents(input.argvAgents);
  }

  return chooseAgentsInteractively({
    detectedAgents: input.detectedAgents,
    prompt: input.prompt ?? promptForAgents,
    onEmptySelection: input.onEmptySelection,
  });
}
