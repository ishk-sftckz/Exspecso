import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { projectConfigSchema } from "../artifacts/schema.js";
import { validateProject } from "../artifacts/validate.js";
import { renderDiagnostics } from "../errors/diagnostic.js";
import { findGitRoot } from "../filesystem/git-root.js";
import { hasActiveTransaction, recoverInterruptedTransaction } from "../filesystem/recovery.js";
import { commitTransaction } from "../filesystem/transaction.js";
import { formatCompletion } from "./completion.js";
import { buildInitPlan, validateInitPlan, type InitPlan } from "./plan.js";
import type { AgentId } from "./runtime-selection.js";

export interface InitInput {
  selectedAgents: readonly AgentId[];
  replaceAgents?: readonly AgentId[];
  cwd: string;
  stdin: NodeJS.ReadableStream;
  stdout: NodeJS.WritableStream;
  stderr: NodeJS.WritableStream;
}

function writePlanProblems(output: NodeJS.WritableStream, plan: InitPlan): void {
  for (const conflict of plan.conflicts) {
    writeError(
      output,
      "EXSPECSO_INIT_ADAPTER_CONFLICT",
      `${conflict.relativePath} is ${conflict.state}; review and rerun with \`--replace-agent ${conflict.agent}\` to replace only this selected adapter.`,
    );
    output.write(`${conflict.diff}\n`);
  }
  for (const problem of plan.approvalProblems) writeError(output, problem.code, problem.message);
}

function writeError(output: NodeJS.WritableStream, code: string, message: string): void {
  output.write(`${code}: ${message}\n`);
}

export async function runInit(input: InitInput): Promise<number> {
  const searchedPath = resolve(input.cwd);
  const repositoryRoot = await findGitRoot(searchedPath);
  if (repositoryRoot === null) {
    writeError(
      input.stderr,
      "EXSPECSO_INIT_NO_GIT_ROOT",
      `No Git repository contains \"${searchedPath}\". Run \`git init\` or move into the intended repository.`,
    );
    return 1;
  }

  if (await hasActiveTransaction(repositoryRoot)) {
    writeError(input.stderr, "EXSPECSO_INIT_TRANSACTION_BUSY", "Initialization is already in progress; retry after the active transaction finishes.");
    return 1;
  }
  const recovery = await recoverInterruptedTransaction(repositoryRoot);
  if (recovery.kind === "ambiguous") {
    writeError(input.stderr, "EXSPECSO_INIT_RECOVERY_AMBIGUOUS", `Interrupted initialization was preserved: ${recovery.message}.`);
    return 1;
  }
  if (recovery.kind === "recovered") {
    input.stderr.write(`EXSPECSO_INIT_RECOVERED: ${recovery.transactionId} ${recovery.disposition}\n`);
  }

  const validationDiagnostics = await validateProject(repositoryRoot);
  if (validationDiagnostics.length > 0) {
    input.stderr.write(renderDiagnostics(validationDiagnostics));
    return 1;
  }

  let plan: InitPlan;
  try {
    plan = await buildInitPlan({
      repositoryRoot,
      selectedAgents: input.selectedAgents,
      replaceAgents: input.replaceAgents,
    });
  } catch {
    writeError(input.stderr, "EXSPECSO_INIT_PREFLIGHT_FAILED", "Cannot inspect the current initialization targets.");
    return 1;
  }

  if (plan.conflicts.length > 0 || plan.approvalProblems.length > 0) {
    writePlanProblems(input.stderr, plan);
    return 1;
  }

  const planProblems = await validateInitPlan(plan);
  if (planProblems.length > 0) {
    for (const problem of planProblems) writeError(input.stderr, problem.code, problem.message);
    return 1;
  }
  const transaction = await commitTransaction(plan, {
    async validateStaged(stageRoot) {
      const stagedConfigTarget = plan.writes.find(({ relativePath }) => relativePath === ".exspecso/exspecso.config.json");
      if (stagedConfigTarget === undefined) return;
      try {
        const stagedConfig = await readFile(join(stageRoot, "files", stagedConfigTarget.relativePath), "utf8");
        if (!projectConfigSchema.safeParse(JSON.parse(stagedConfig)).success) throw new Error("invalid staged config");
      } catch {
        throw new Error("EXSPECSO_INIT_STAGED_CONFIG_INVALID");
      }
    },
  });
  if (transaction.kind === "committed" || transaction.kind === "no-op") {
    input.stdout.write(formatCompletion(input.selectedAgents));
    return 0;
  }
  if (transaction.kind === "busy") {
    writeError(input.stderr, "EXSPECSO_INIT_TRANSACTION_BUSY", "Initialization is already in progress; no files were changed.");
    return 1;
  }
  writeError(input.stderr, "EXSPECSO_INIT_WRITE_FAILED", `${transaction.error.message}; no completion guidance was printed.`);
  return 1;
}
