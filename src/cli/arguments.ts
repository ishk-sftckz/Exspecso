import { parseArgs } from "node:util";

export type InitArgumentsResult =
  | { kind: "parsed"; agents: string[]; replaceAgents: string[] }
  | { kind: "invalid"; code: "EXSPECSO_INIT_USAGE"; message: string };

const usageMessage = "Use `exspecso init --agent claude|codex|opencode [--agent ...] [--replace-agent claude|codex|opencode ...]`.";

export function parseInitArguments(argv: string[]): InitArgumentsResult {
  try {
    const { values } = parseArgs({
      args: argv,
      strict: true,
      allowPositionals: false,
      options: {
        agent: {
          type: "string",
          multiple: true,
        },
        "replace-agent": {
          type: "string",
          multiple: true,
        },
      },
    });

    return { kind: "parsed", agents: values.agent ?? [], replaceAgents: values["replace-agent"] ?? [] };
  } catch {
    return { kind: "invalid", code: "EXSPECSO_INIT_USAGE", message: usageMessage };
  }
}
