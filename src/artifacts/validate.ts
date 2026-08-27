import { access, readdir, readFile } from "node:fs/promises";
import type { Dirent } from "node:fs";
import { join, relative, sep } from "node:path";
import { type ZodIssue } from "zod";
import { type ArtifactDefinition, scanArtifactDefinitions } from "./resolve.js";
import { parseArtifactId, projectConfigSchema } from "./schema.js";
import type { Diagnostic } from "../errors/diagnostic.js";

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

async function canonicalFiles(root: string, directory = join(root, canonicalDirectory)): Promise<string[]> {
  let entries: Dirent<string>[];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await canonicalFiles(root, path)));
    } else if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".json"))) {
      files.push(path);
    }
  }
  return files;
}

function relativePath(root: string, path: string): string {
  return relative(root, path).split(sep).join("/");
}

async function validateRawArtifactIds(root: string): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  for (const file of await canonicalFiles(root)) {
    if (!file.endsWith(".md")) {
      continue;
    }
    const path = relativePath(root, file);
    const text = await readFile(file, "utf8");
    const lines = text.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      const frontmatter = /^(id|parent):\s*(\S+)\s*$/.exec(line);
      const heading = /^(#{1,6})\s+(\S+)/.exec(line);
      const candidate = frontmatter?.[2] ?? heading?.[2];
      if (candidate === undefined || !/^[A-Z]+(?:-[0-9]+)?$/.test(candidate) || parseArtifactId(candidate) !== null) {
        continue;
      }
      diagnostics.push({
        code: "EXSPECSO_ARTIFACT_INVALID_ID",
        path,
        section: `line ${index + 1}`,
        expected: "ROADMAP or one exact D-20 ID family",
        actual: candidate,
        hint: "Use ROADMAP, PHASE-NNN, SPEC-NNN, REQ-NNN, AC-NNN, PLAN-NNN, TASK-NNN, DEC-NNN, or FINDING-NNN exactly.",
      });
    }
  }
  return diagnostics;
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

export async function validateProject(root: string): Promise<readonly Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  const absoluteConfigPath = join(root, configPath);
  try {
    diagnostics.push(...validateProjectConfig(configPath, await readFile(absoluteConfigPath, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      diagnostics.push({
        code: "EXSPECSO_CONFIG_PARSE",
        path: configPath,
        expected: "a readable JSON configuration file",
        actual: "unreadable file",
        hint: "Restore read access or replace the file with valid D-01 JSON.",
      });
    }
  }
  const definitions = (await scanArtifactDefinitions(root)).filter((definition) => definition.path === canonicalDirectory || definition.path.startsWith(`${canonicalDirectory}/`));
  diagnostics.push(...(await validateRawArtifactIds(root)));
  diagnostics.push(...validateDefinitions(definitions));
  try {
    await access(join(root, roadmapPath));
    if (!definitions.some((definition) => definition.id === "ROADMAP" && definition.path === roadmapPath)) {
      diagnostics.push({
        code: "EXSPECSO_ROADMAP_RESERVED_PATH",
        path: roadmapPath,
        expected: "a ROADMAP definition at the reserved location",
        actual: "reserved file lacks ROADMAP",
        hint: "Add the exact ROADMAP identity to .exspecso/roadmap.md.",
      });
    }
  } catch {
    // ROADMAP is intentionally lazy and is absent until the start workflow creates it.
  }
  return diagnostics;
}
