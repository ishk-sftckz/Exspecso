import { describe, expect, it } from "vitest";
import {
  SUPPORTED_AGENTS,
  chooseAgentsInteractively,
  detectAgents,
  resolveSelectedAgents,
  type AgentChoice,
} from "../../src/init/runtime-selection.js";

describe("runtime selection", () => {
  it("presents every runtime in stable order, unchecked, with detection only as metadata", async () => {
    const promptCalls: AgentChoice[][] = [];
    const result = await chooseAgentsInteractively({
      detectedAgents: ["codex"],
      prompt: async (choices) => {
        promptCalls.push(choices);
        return ["claude", "opencode"];
      },
    });

    expect(SUPPORTED_AGENTS).toEqual(["claude", "codex", "opencode"]);
    expect(promptCalls).toEqual([
      [
        { value: "claude", name: "Claude Code", checked: false },
        { value: "codex", name: "OpenAI Codex (detected)", checked: false },
        { value: "opencode", name: "OpenCode", checked: false },
      ],
    ]);
    expect(result).toEqual({ kind: "selected", agents: ["claude", "opencode"] });
  });

  it("reopens after an empty interactive submission and returns cancellation explicitly", async () => {
    const notices: string[] = [];
    const submissions: Array<readonly string[] | { cancelled: true }> = [[], { cancelled: true }];

    const result = await chooseAgentsInteractively({
      detectedAgents: [],
      prompt: async () => submissions.shift() ?? { cancelled: true },
      onEmptySelection: (message) => notices.push(message),
    });

    expect(notices).toEqual(["Select at least one runtime before continuing."]);
    expect(result).toEqual({ kind: "cancelled" });
  });

  it("accepts repeatable non-TTY flags without invoking a prompt", async () => {
    const prompt = async (): Promise<readonly string[]> => {
      throw new Error("non-TTY selection must not prompt");
    };

    const result = await resolveSelectedAgents({
      argvAgents: ["claude", "codex", "opencode"],
      isInputTTY: false,
      isOutputTTY: false,
      detectedAgents: ["codex"],
      prompt,
    });

    expect(result).toEqual({ kind: "selected", agents: ["claude", "codex", "opencode"] });
  });

  it("returns stable diagnostics for missing, invalid, and malformed non-TTY inputs while preserving first-declared order", async () => {
    await expect(
      resolveSelectedAgents({
        argvAgents: [],
        isInputTTY: false,
        isOutputTTY: false,
        detectedAgents: [],
      }),
    ).resolves.toEqual({
      kind: "invalid",
      code: "EXSPECSO_INIT_AGENT_REQUIRED",
      message: "Non-interactive init requires at least one `--agent claude|codex|opencode` flag.",
    });

    await expect(
      resolveSelectedAgents({
        argvAgents: ["codex", "unknown", "claude"],
        isInputTTY: false,
        isOutputTTY: false,
        detectedAgents: [],
      }),
    ).resolves.toEqual({
      kind: "invalid",
      code: "EXSPECSO_INIT_INVALID_AGENT",
      message: "Unsupported agent `unknown`. Expected claude, codex, or opencode.",
    });

    await expect(
      resolveSelectedAgents({
        argvAgents: ["codex", "claude", "codex"],
        isInputTTY: false,
        isOutputTTY: false,
        detectedAgents: [],
      }),
    ).resolves.toEqual({ kind: "selected", agents: ["codex", "claude"] });
  });

  it("detects only runtime availability labels", () => {
    expect(detectAgents({ CLAUDECODE: "1", CODEX_HOME: "/tmp/codex", OPENCODE: "1" })).toEqual([
      "claude",
      "codex",
      "opencode",
    ]);
  });
});
