#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
import { parseInitArguments } from "./arguments.js";
import { runInit } from "../init/run-init.js";
import { detectAgents, resolveSelectedAgents } from "../init/runtime-selection.js";

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  if (argv[0] !== "init") {
    process.stderr.write("EXSPECSO_CLI_USAGE: Use `exspecso init --agent claude|codex|opencode [--agent ...]`.\n");
    return 1;
  }

  try {
    const parsedArguments = parseInitArguments(argv.slice(1));
    if (parsedArguments.kind === "invalid") {
      process.stderr.write(`${parsedArguments.code}: ${parsedArguments.message}\n`);
      return 1;
    }

    const replacementSelection = parsedArguments.replaceAgents.length === 0
      ? { kind: "selected" as const, agents: [] }
      : await resolveSelectedAgents({
          argvAgents: parsedArguments.replaceAgents,
          isInputTTY: false,
          isOutputTTY: false,
          detectedAgents: [],
        });
    if (replacementSelection.kind === "invalid") {
      process.stderr.write(`${replacementSelection.code}: ${replacementSelection.message}\n`);
      return 1;
    }
    if (replacementSelection.kind === "cancelled") {
      process.stderr.write("EXSPECSO_INIT_CANCELLED: Replacement approval was cancelled; no files were written.\n");
      return 1;
    }

    const selection = await resolveSelectedAgents({
      argvAgents: parsedArguments.agents,
      isInputTTY: process.stdin.isTTY === true,
      isOutputTTY: process.stdout.isTTY === true,
      detectedAgents: detectAgents(),
    });
    if (selection.kind === "invalid") {
      process.stderr.write(`${selection.code}: ${selection.message}\n`);
      return 1;
    }
    if (selection.kind === "cancelled") {
      process.stderr.write("EXSPECSO_INIT_CANCELLED: Runtime selection was cancelled; no files were written.\n");
      return 1;
    }

    return await runInit({
      selectedAgents: selection.agents,
      replaceAgents: replacementSelection.agents,
      cwd: process.cwd(),
      stdin: process.stdin,
      stdout: process.stdout,
      stderr: process.stderr,
    });
  } catch {
    process.stderr.write("EXSPECSO_CLI_UNEXPECTED: Initialization failed unexpectedly.\n");
    return 1;
  }
}

if (process.argv[1] !== undefined && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
