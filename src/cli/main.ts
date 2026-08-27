#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
import { runInit } from "../init/run-init.js";

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  if (argv[0] !== "init") {
    process.stderr.write("EXSPECSO_CLI_USAGE: Use `exspecso init --agent codex`.\n");
    return 1;
  }

  try {
    return await runInit({
      argv: argv.slice(1),
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
