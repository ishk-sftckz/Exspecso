import { parseArgs } from "node:util";

export type InitArgumentsResult =
  | { kind: "parsed"; agents: string[] }
  | { kind: "invalid"; code: "EXSPECSO_INIT_USAGE"; message: string };

const usageMessage = "Use `exspecso init --agent claude|codex|opencode [--agent ...]`.";

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
      },
    });

    return { kind: "parsed", agents: values.agent ?? [] };
  } catch {
    return { kind: "invalid", code: "EXSPECSO_INIT_USAGE", message: usageMessage };
  }
}
