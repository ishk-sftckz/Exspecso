import { relative, resolve, sep } from "node:path";
import { projectConfigSchema } from "../artifacts/schema.js";
import { validateProject } from "../artifacts/validate.js";
import { renderDiagnostics } from "../errors/diagnostic.js";
import { findGitRoot } from "../filesystem/git-root.js";
import { openContainedFilesystem, type BoundReader } from "../filesystem/contained-fs.js";
import { recoverInterruptedTransaction } from "../filesystem/recovery.js";
import { commitTransaction } from "../filesystem/transaction.js";
import { acquireInitOwnership, inspectInitOwnership, releaseInitOwnership } from "../filesystem/ownership.js";
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
  /** Internal deterministic test seam; it never alters production ownership. */
  beforeOwnershipAcquire?: () => void | Promise<void>;
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

function repositoryComponents(repositoryRoot: string, target: string): readonly string[] {
  const path = relative(repositoryRoot, target).split(sep);
  if (path.some((component) => !component || component === "." || component === "..")) {
    throw new Error("EXSPECSO_INIT_PRECONDITION_FAILED: staged artifact escaped the repository root");
  }
  return path;
}

function hasRecoveryEvidence(reader: BoundReader): boolean {
  try {
    return reader.list([".exspecso", ".staging"]).length > 0;
  } catch (error) {
    if (error instanceof Error && error.message.includes("EXSPECSO_CONTAINMENT_ENOENT")) return false;
    throw error;
  }
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

  // Provider/marker preflight precedes all ownership, recovery, and staging effects.
  let capability;
  try {
    capability = openContainedFilesystem(repositoryRoot);
    const marker = capability.reader.metadata([".git"]);
    if (marker !== "directory" && marker !== "file") throw new Error("Git marker is not a regular file or directory.");
  } catch (error) {
    writeError(input.stderr, "EXSPECSO_INIT_PREFLIGHT_FAILED", error instanceof Error ? error.message : "The bundled filesystem provider is unavailable.");
    return 1;
  }

  try {
    let recoveryEvidence: boolean;
    try {
      recoveryEvidence = hasRecoveryEvidence(capability.reader);
    } catch (error) {
      writeError(input.stderr, "EXSPECSO_INIT_PREFLIGHT_FAILED", error instanceof Error ? error.message : "Cannot inspect recovery evidence.");
      return 1;
    }
    if (!recoveryEvidence) {
      const preliminaryDiagnostics = await validateProject(repositoryRoot, capability.reader);
      if (preliminaryDiagnostics.length > 0) {
        input.stderr.write(renderDiagnostics(preliminaryDiagnostics));
        return 1;
      }
    }

  const observedOwnership = await inspectInitOwnership(repositoryRoot, capability.root);
  if (observedOwnership.kind === "busy") {
    writeError(input.stderr, "EXSPECSO_INIT_TRANSACTION_BUSY", "Initialization is already in progress; retry after the active transaction finishes.");
    return 1;
  }
  if (observedOwnership.kind === "ambiguous") {
    writeError(input.stderr, "EXSPECSO_INIT_RECOVERY_AMBIGUOUS", `Interrupted initialization was preserved: ${observedOwnership.message}.`);
    return 1;
  }

  await input.beforeOwnershipAcquire?.();
  const acquisition = await acquireInitOwnership(repositoryRoot, { rootDirectory: capability.root });
  if (acquisition.kind === "busy") {
    writeError(input.stderr, "EXSPECSO_INIT_TRANSACTION_BUSY", "Initialization is already in progress; no files were changed.");
    return 1;
  }
  if (acquisition.kind === "ambiguous") {
    writeError(input.stderr, "EXSPECSO_INIT_RECOVERY_AMBIGUOUS", `Interrupted initialization was preserved: ${acquisition.message}.`);
    return 1;
  }

  try {
    const recovery = await recoverInterruptedTransaction(repositoryRoot, acquisition.ownership);
    if (recovery.kind === "busy") {
      writeError(input.stderr, "EXSPECSO_INIT_TRANSACTION_BUSY", "Initialization is already in progress; no files were changed.");
      return 1;
    }
    if (recovery.kind === "ambiguous") {
      writeError(input.stderr, "EXSPECSO_INIT_RECOVERY_AMBIGUOUS", `Interrupted initialization was preserved: ${recovery.message}.`);
      return 1;
    }
    if (recovery.kind === "recovered") {
      input.stderr.write(`EXSPECSO_INIT_RECOVERED: ${recovery.transactionId} ${recovery.disposition}\n`);
    }

    const validationDiagnostics = await validateProject(repositoryRoot, capability.reader);
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
        reader: capability.reader,
      });
    } catch {
      writeError(input.stderr, "EXSPECSO_INIT_PREFLIGHT_FAILED", "Cannot inspect the current initialization targets.");
      return 1;
    }

    if (plan.conflicts.length > 0 || plan.approvalProblems.length > 0) {
      writePlanProblems(input.stderr, plan);
      return 1;
    }

    const planProblems = await validateInitPlan(plan, capability.reader);
    if (planProblems.length > 0) {
      for (const problem of planProblems) writeError(input.stderr, problem.code, problem.message);
      return 1;
    }
    const transaction = await commitTransaction(plan, {
      ownership: acquisition.ownership,
      async validateStaged(stageRoot) {
        const stagedConfigTarget = plan.writes.find(({ relativePath }) => relativePath === ".exspecso/exspecso.config.json");
        if (stagedConfigTarget === undefined) return;
        try {
          const stagedConfig = capability.reader.read(repositoryComponents(repositoryRoot, `${stageRoot}${sep}files${sep}${stagedConfigTarget.relativePath}`)).toString("utf8");
          if (!projectConfigSchema.safeParse(JSON.parse(stagedConfig)).success) throw new Error("invalid staged config");
        } catch {
          throw new Error("EXSPECSO_INIT_STAGED_CONFIG_INVALID");
        }
      }
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
  } finally {
    await releaseInitOwnership(acquisition.ownership);
  }
  } finally {
    capability.close();
  }
}
