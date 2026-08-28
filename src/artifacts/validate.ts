import { type ZodIssue } from "zod";
import { type ArtifactDefinition, scanArtifacts } from "./resolve.js";
import { projectConfigSchema } from "./schema.js";
import type { Diagnostic } from "../errors/diagnostic.js";
import { openContainedFilesystem, type BoundReader } from "../filesystem/contained-fs.js";

const canonicalDirectory = ".exspecso";
const configPath = ".exspecso/exspecso.config.json";
const roadmapPath = ".exspecso/roadmap.md";

function describeActual(value: unknown): string {
  const rendered = JSON.stringify(value);
  return rendered === undefined ? String(value) : rendered;
}

function schemaDiagnostic(path: string, issue: ZodIssue): Diagnostic {
  const section = issue.path.length === 0 ? undefined : issue.path.map(String).join(".");
  return {
    code: "EXSPECSO_CONFIG_SCHEMA",
    path,
    section,
    expected: "a valid D-01 project configuration field",
    actual: describeActual(issue.input),
    hint: "Restore the field to the documented schema and remove unsupported setup fields.",
  };
}

export function validateProjectConfig(path: string, text: string): readonly Diagnostic[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [
      {
        code: "EXSPECSO_CONFIG_PARSE",
        path,
        expected: "valid JSON",
        actual: "malformed JSON",
        hint: "Repair the JSON syntax without adding hidden setup state.",
      },
    ];
  }
  const result = projectConfigSchema.safeParse(parsed);
  return result.success ? [] : result.error.issues.map((issue) => schemaDiagnostic(path, issue));
}

function definitionLabel(definition: ArtifactDefinition): string {
  return definition.location.kind === "section"
    ? `${definition.path}:${definition.location.startLine}`
    : definition.path;
}

function validateDefinitions(definitions: readonly ArtifactDefinition[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const definitionsById = new Map<string, ArtifactDefinition[]>();
  for (const definition of definitions) {
    const current = definitionsById.get(definition.id) ?? [];
    current.push(definition);
    definitionsById.set(definition.id, current);
  }

  for (const [id, duplicates] of definitionsById) {
    if (duplicates.length > 1) {
      diagnostics.push({
        code: "EXSPECSO_ARTIFACT_DUPLICATE_ID",
        path: duplicates[0].path,
        section: duplicates.map(definitionLabel).join(", "),
        expected: `one definition for ${id}`,
        actual: `${duplicates.length} definitions`,
        hint: "Keep one canonical definition and assign a distinct stable ID to every other artifact.",
      });
    }
  }

  for (const definition of definitions) {
    if (definition.parentId !== undefined && !definitionsById.has(definition.parentId)) {
      diagnostics.push({
        code: "EXSPECSO_ARTIFACT_UNKNOWN_PARENT",
        path: definition.path,
        expected: `an existing explicit parent for ${definition.id}`,
        actual: definition.parentId,
        hint: "Create the declared parent first or update the parent ID to an existing canonical artifact.",
      });
    }
    if (definition.id === "ROADMAP" && definition.path !== roadmapPath) {
      diagnostics.push({
        code: "EXSPECSO_ROADMAP_RESERVED_PATH",
        path: definition.path,
        expected: roadmapPath,
        actual: definition.path,
        hint: "Move the sole ROADMAP definition to .exspecso/roadmap.md.",
      });
    }
  }
  return diagnostics;
}

async function validateWithReader(root: string, reader: BoundReader): Promise<readonly Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  try {
    diagnostics.push(...validateProjectConfig(configPath, reader.read(configPath.split("/")).toString("utf8")));
  } catch (error) {
    if (!(error instanceof Error && error.message.includes("EXSPECSO_CONTAINMENT_ENOENT"))) {
      diagnostics.push({
        code: "EXSPECSO_CONFIG_PARSE",
        path: configPath,
        expected: "a readable JSON configuration file",
        actual: "unreadable file",
        hint: "Restore read access or replace the file with valid D-01 JSON.",
      });
    }
  }
  const scanResult = await scanArtifacts(root, reader);
  const definitions = scanResult.definitions.filter((definition) => definition.path === canonicalDirectory || definition.path.startsWith(`${canonicalDirectory}/`));
  diagnostics.push(...scanResult.diagnostics.filter((diagnostic) => diagnostic.path === canonicalDirectory || diagnostic.path.startsWith(`${canonicalDirectory}/`)));
  diagnostics.push(...validateDefinitions(definitions));
  try {
    const roadmap = reader.metadata(roadmapPath.split("/"));
    if (roadmap !== "file") throw new Error("EXSPECSO_CONTAINMENT_INVALID: roadmap is not a regular file");
    if (!definitions.some((definition) => definition.id === "ROADMAP" && definition.path === roadmapPath)) {
      diagnostics.push({
        code: "EXSPECSO_ROADMAP_RESERVED_PATH",
        path: roadmapPath,
        expected: "a ROADMAP definition at the reserved location",
        actual: "reserved file lacks ROADMAP",
        hint: "Add the exact ROADMAP identity to .exspecso/roadmap.md.",
      });
    }
  } catch (error) {
    if (!(error instanceof Error && error.message.includes("EXSPECSO_CONTAINMENT_ENOENT"))) {
      diagnostics.push({
        code: "EXSPECSO_ARTIFACT_UNSAFE_READ",
        path: roadmapPath,
        expected: "a contained regular roadmap file",
        actual: error instanceof Error ? error.message : "unreadable file",
        hint: "Replace the roadmap with a contained regular file or remove it until the start workflow creates it.",
      });
    }
  }
  return diagnostics;
}

export async function validateProject(root: string, reader?: BoundReader): Promise<readonly Diagnostic[]> {
  if (reader !== undefined) return validateWithReader(root, reader);
  const capability = openContainedFilesystem(root);
  try {
    return await validateWithReader(root, capability.reader);
  } finally {
    capability.close();
  }
}
