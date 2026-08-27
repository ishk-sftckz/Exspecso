import { z } from "zod";

export const agentIdSchema = z.enum(["claude", "codex", "opencode"]);

export const projectConfigSchema = z
  .object({
    schemaVersion: z.literal(1),
    project: z
      .object({
        id: z.uuid(),
        title: z.string().min(1),
      })
      .strict(),
    mode: z.literal("unclassified"),
    selectedAgents: z.array(agentIdSchema).min(1),
    onboardingStatus: z.literal("not-started"),
  })
  .strict();

export type ProjectConfig = z.infer<typeof projectConfigSchema>;

export const ARTIFACT_ID_PATTERNS = Object.freeze({
  ROADMAP: /^ROADMAP$/,
  PHASE: /^PHASE-[0-9]{3}$/,
  SPEC: /^SPEC-[0-9]{3}$/,
  REQ: /^REQ-[0-9]{3}$/,
  AC: /^AC-[0-9]{3}$/,
  PLAN: /^PLAN-[0-9]{3}$/,
  TASK: /^TASK-[0-9]{3}$/,
  DEC: /^DEC-[0-9]{3}$/,
  FINDING: /^FINDING-[0-9]{3}$/,
});

export type ArtifactKind = keyof typeof ARTIFACT_ID_PATTERNS;
declare const artifactIdBrand: unique symbol;
export type ArtifactId = string & { readonly [artifactIdBrand]: "ArtifactId" };

export function parseArtifactId(value: string): ArtifactId | null {
  if (Object.values(ARTIFACT_ID_PATTERNS).some((pattern) => pattern.test(value))) {
    return value as ArtifactId;
  }
  return null;
}

export function artifactKindForId(id: ArtifactId): ArtifactKind {
  return (Object.entries(ARTIFACT_ID_PATTERNS).find(([, pattern]) => pattern.test(id))?.[0] ?? "ROADMAP") as ArtifactKind;
}
