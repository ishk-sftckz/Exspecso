import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { buildAdapterPlan } from "../adapters/registry.js";
import { inspectManagedFile, sha256, type ManagedFileState } from "../adapters/managed-file.js";
import { projectConfigSchema, type ProjectConfig } from "../artifacts/schema.js";
import { renderConstitution, renderProjectConfig } from "../artifacts/templates.js";
import type { AgentId } from "./runtime-selection.js";

export interface PlannedWrite {
  readonly target: string;
  readonly relativePath: string;
  readonly content: string;
  readonly expectedExists: boolean;
  readonly expectedPreimageHash?: string;
}

export interface AdapterConflict {
  readonly agent: AgentId;
  readonly relativePath: string;
  readonly state: Exclude<ManagedFileState, "absent" | "owned-unchanged">;
  readonly diff: string;
}

export interface InitPlanProblem {
  readonly code: "EXSPECSO_INIT_ADAPTER_CONFLICT" | "EXSPECSO_INIT_INVALID_REPLACEMENT" | "EXSPECSO_INIT_STALE_PREIMAGE";
  readonly message: string;
}

export interface InitPlan {
  readonly repositoryRoot: string;
  readonly selectedAgents: readonly AgentId[];
  readonly requestedAgents: readonly AgentId[];
  readonly replacementAgents: readonly AgentId[];
  readonly writes: readonly PlannedWrite[];
  readonly conflicts: readonly AdapterConflict[];
  readonly approvalProblems: readonly InitPlanProblem[];
}

export interface BuildInitPlanInput {
  readonly repositoryRoot: string;
  readonly selectedAgents: readonly AgentId[];
  readonly replaceAgents?: readonly AgentId[];
}

async function readOptional(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

function uniqueAgents(agents: readonly AgentId[]): AgentId[] {
  return agents.filter((agent, index) => agents.indexOf(agent) === index);
}

function writeFor(target: string, relativePath: string, content: string, existing: string | undefined): PlannedWrite {
  return Object.freeze({
    target,
    relativePath,
    content,
    expectedExists: existing !== undefined,
    ...(existing === undefined ? {} : { expectedPreimageHash: sha256(existing) }),
  });
}

export async function buildInitPlan(input: BuildInitPlanInput): Promise<InitPlan> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const requestedAgents = uniqueAgents(input.selectedAgents);
  const replacementAgents = uniqueAgents(input.replaceAgents ?? []);
  const configPath = join(repositoryRoot, ".exspecso", "exspecso.config.json");
  const constitutionPath = join(repositoryRoot, ".exspecso", "constitution.md");
  const existingConfigText = await readOptional(configPath);
  const existingConstitution = await readOptional(constitutionPath);
  const existingConfig = existingConfigText === undefined
    ? undefined
    : projectConfigSchema.parse(JSON.parse(existingConfigText));
  const selectedAgents = uniqueAgents([...(existingConfig?.selectedAgents ?? []), ...requestedAgents]);
  const config: ProjectConfig = existingConfig === undefined
    ? {
        schemaVersion: 1,
        project: { id: randomUUID(), title: basename(repositoryRoot) },
        mode: "unclassified",
        selectedAgents,
        onboardingStatus: "not-started",
      }
    : { ...existingConfig, selectedAgents };
  const writes: PlannedWrite[] = [];
  const renderedConfig = renderProjectConfig(config);
  if (existingConfigText !== renderedConfig) writes.push(writeFor(configPath, ".exspecso/exspecso.config.json", renderedConfig, existingConfigText));
  if (existingConstitution === undefined) writes.push(writeFor(constitutionPath, ".exspecso/constitution.md", renderConstitution(), existingConstitution));

  const conflicts: AdapterConflict[] = [];
  const approvalProblems: InitPlanProblem[] = [];
  for (const replacementAgent of replacementAgents) {
    if (!requestedAgents.includes(replacementAgent)) {
      approvalProblems.push(Object.freeze({
        code: "EXSPECSO_INIT_INVALID_REPLACEMENT",
        message: `Replacement approval for \`${replacementAgent}\` requires that agent to be selected in this invocation.`,
      }));
    }
  }

  for (const adapter of buildAdapterPlan(requestedAgents)) {
    const target = join(repositoryRoot, adapter.relativePath);
    const existing = await readOptional(target);
    const inspection = inspectManagedFile(existing, adapter.content);
    const replacementApproved = replacementAgents.includes(adapter.agent);
    if (inspection.state === "absent" || inspection.state === "owned-unchanged") {
      if (replacementApproved) {
        approvalProblems.push(Object.freeze({
          code: "EXSPECSO_INIT_INVALID_REPLACEMENT",
          message: `Replacement approval for \`${adapter.agent}\` requires a current adapter conflict.`,
        }));
      }
      writes.push(writeFor(target, adapter.relativePath, adapter.content, existing));
      continue;
    }
    if (replacementApproved) {
      writes.push(writeFor(target, adapter.relativePath, adapter.content, existing));
      continue;
    }
    conflicts.push(Object.freeze({
      agent: adapter.agent,
      relativePath: adapter.relativePath,
      state: inspection.state,
      diff: inspection.diff ?? "",
    }));
  }

  return Object.freeze({
    repositoryRoot,
    selectedAgents: Object.freeze(selectedAgents),
    requestedAgents: Object.freeze(requestedAgents),
    replacementAgents: Object.freeze(replacementAgents),
    writes: Object.freeze(writes),
    conflicts: Object.freeze(conflicts),
    approvalProblems: Object.freeze(approvalProblems),
  });
}

export async function validateInitPlan(plan: InitPlan): Promise<readonly InitPlanProblem[]> {
  const problems: InitPlanProblem[] = [...plan.approvalProblems];
  for (const conflict of plan.conflicts) {
    problems.push(Object.freeze({
      code: "EXSPECSO_INIT_ADAPTER_CONFLICT",
      message: `${conflict.relativePath} is ${conflict.state}; review its diff and rerun with --replace-agent ${conflict.agent} to replace only that selected target.`,
    }));
  }
  for (const write of plan.writes) {
    const current = await readOptional(write.target);
    const matchesExpected = write.expectedExists
      ? current !== undefined && sha256(current) === write.expectedPreimageHash
      : current === undefined;
    if (!matchesExpected) {
      problems.push(Object.freeze({
        code: "EXSPECSO_INIT_STALE_PREIMAGE",
        message: `${write.relativePath} changed after preflight; rerun init to review the current file before writing.`,
      }));
    }
  }
  return Object.freeze(problems);
}
