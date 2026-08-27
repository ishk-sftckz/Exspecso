import { randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { projectConfigSchema } from "../artifacts/schema.js";
import { validateProject } from "../artifacts/validate.js";
import { renderDiagnostics } from "../errors/diagnostic.js";
import { findGitRoot } from "../filesystem/git-root.js";
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

function isWithinRoot(root: string, target: string): boolean {
  const pathFromRoot = relative(root, target);
  return pathFromRoot !== "" && pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot);
}

function writeError(output: NodeJS.WritableStream, code: string, message: string): void {
  output.write(`${code}: ${message}\n`);
}

async function hasSymlinkedAncestor(root: string, target: string): Promise<boolean> {
  let current = dirname(target);
  while (current !== root) {
    try {
      if ((await lstat(current)).isSymbolicLink()) {
        return true;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        return true;
      }
    }
    const parent = dirname(current);
    if (parent === current) {
      return true;
    }
    current = parent;
  }
  return false;
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
  const targets = plan.writes;

  if (targets.some(({ target }) => !isWithinRoot(repositoryRoot, target))) {
    writeError(input.stderr, "EXSPECSO_INIT_INVALID_TARGET", "Initializer target escapes the containing repository.");
    return 1;
  }

  for (const { target } of targets) {
    if (await hasSymlinkedAncestor(repositoryRoot, target)) {
      writeError(input.stderr, "EXSPECSO_INIT_UNSAFE_TARGET", `Refusing symlinked target path \"${target}\".`);
      return 1;
    }
  }

  const stageRoot = resolve(repositoryRoot, `.exspecso-stage-${randomUUID()}`);
  try {
    for (const { target, content } of targets) {
      const stagedTarget = resolve(stageRoot, relative(repositoryRoot, target));
      await mkdir(dirname(stagedTarget), { recursive: true });
      await writeFile(stagedTarget, content, "utf8");
    }

    const stagedConfigTarget = targets.find(({ relativePath }) => relativePath === ".exspecso/exspecso.config.json");
    if (stagedConfigTarget !== undefined) {
      const stagedConfig = await readFile(join(stageRoot, stagedConfigTarget.relativePath), "utf8");
      if (!projectConfigSchema.safeParse(JSON.parse(stagedConfig)).success) {
        writeError(input.stderr, "EXSPECSO_INIT_STAGED_CONFIG_INVALID", "Generated config did not satisfy the initialization contract.");
        return 1;
      }
    }

    const changedSincePreflight = await validateInitPlan(plan);
    if (changedSincePreflight.length > 0) {
      for (const problem of changedSincePreflight) writeError(input.stderr, problem.code, problem.message);
      return 1;
    }

    for (const { target } of targets) {
      const stagedTarget = resolve(stageRoot, relative(repositoryRoot, target));
      await mkdir(dirname(target), { recursive: true });
      await rename(stagedTarget, target);
    }

    input.stdout.write(formatCompletion(input.selectedAgents));
    return 0;
  } catch (error) {
    writeError(input.stderr, "EXSPECSO_INIT_WRITE_FAILED", "Initialization could not complete; no completion guidance was printed.");
    return 1;
  } finally {
    await rm(stageRoot, { force: true, recursive: true });
  }
}
