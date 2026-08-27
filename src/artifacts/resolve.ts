import { readdir, readFile } from "node:fs/promises";
import type { Dirent } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { artifactKindForId, parseArtifactId, type ArtifactId, type ArtifactKind } from "./schema.js";
import type { Diagnostic } from "../errors/diagnostic.js";

export type ArtifactLocation =
  | { readonly kind: "file"; readonly path: string }
  | {
      readonly kind: "section";
      readonly path: string;
      readonly heading: string;
      readonly startLine: number;
      readonly endLine: number;
    };

export interface ArtifactDefinition {
  readonly id: ArtifactId;
  readonly artifactKind: ArtifactKind;
  readonly path: string;
  readonly location: ArtifactLocation;
  readonly parentId?: ArtifactId;
}

export type ResolveArtifactResult =
  | { readonly kind: "resolved"; readonly id: ArtifactId; readonly location: ArtifactLocation }
  | { readonly kind: "not-found"; readonly diagnostics: readonly Diagnostic[] }
  | { readonly kind: "ambiguous"; readonly definitions: readonly ArtifactDefinition[]; readonly diagnostics: readonly Diagnostic[] };

const ignoredDirectoryNames = new Set([".git", "node_modules", "dist"]);
const reservedRoadmapPath = ".exspecso/roadmap.md";

function toRelativePath(root: string, path: string): string {
  return relative(root, path).split(sep).join("/");
}

function parentIdFromFrontmatter(text: string): ArtifactId | undefined {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (match === null) {
    return undefined;
  }
  const parent = /^parent:\s*(\S+)\s*$/m.exec(match[1]);
  return parent === null ? undefined : (parseArtifactId(parent[1]) ?? undefined);
}

function definitionFromFrontmatter(path: string, text: string): ArtifactDefinition | undefined {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (match === null) {
    return undefined;
  }
  const id = /^id:\s*(\S+)\s*$/m.exec(match[1]);
  const artifactId = id === null ? null : parseArtifactId(id[1]);
  if (artifactId === null) {
    return undefined;
  }
  return {
    id: artifactId,
    artifactKind: artifactKindForId(artifactId),
    path,
    parentId: parentIdFromFrontmatter(text),
    location: { kind: "file", path },
  };
}

function markdownDefinitions(path: string, text: string): ArtifactDefinition[] {
  const lines = text.split(/\r?\n/);
  const parentId = parentIdFromFrontmatter(text);
  const headings = lines.flatMap((line, index) => {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (match === null) {
      return [];
    }
    const id = parseArtifactId(match[2].split(/\s+/, 1)[0]);
    return id === null ? [] : [{ index, level: match[1].length, id, heading: line }];
  });

  return headings.map((heading) => {
    const nextHeading = headings.find((candidate) => candidate.index > heading.index && candidate.level <= heading.level);
    let finalLineIndex = (nextHeading?.index ?? lines.length) - 1;
    if (nextHeading === undefined) {
      while (finalLineIndex > heading.index && lines[finalLineIndex].trim() === "") {
        finalLineIndex -= 1;
      }
    }
    const artifactKind = artifactKindForId(heading.id);
    return {
      id: heading.id,
      artifactKind,
      path,
      parentId,
      location:
        artifactKind === "ROADMAP" && path === reservedRoadmapPath
          ? { kind: "file", path }
          : { kind: "section", path, heading: heading.heading, startLine: heading.index + 1, endLine: finalLineIndex + 1 },
    };
  });
}

function jsonDefinition(path: string, text: string): ArtifactDefinition | undefined {
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return undefined;
    }
    const record = parsed as Record<string, unknown>;
    const id = typeof record.id === "string" ? parseArtifactId(record.id) : null;
    if (id === null) {
      return undefined;
    }
    const parentId = typeof record.parent === "string" ? parseArtifactId(record.parent) ?? undefined : undefined;
    return { id, artifactKind: artifactKindForId(id), path, parentId, location: { kind: "file", path } };
  } catch {
    return undefined;
  }
}

async function artifactFiles(root: string, directory = root): Promise<string[]> {
  let entries: Dirent<string>[];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectoryNames.has(entry.name)) {
        files.push(...(await artifactFiles(root, path)));
      }
    } else if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".json"))) {
      files.push(path);
    }
  }
  return files;
}

export async function scanArtifactDefinitions(root: string): Promise<readonly ArtifactDefinition[]> {
  const canonicalRoot = resolve(root);
  const definitions: ArtifactDefinition[] = [];
  for (const file of await artifactFiles(canonicalRoot)) {
    const path = toRelativePath(canonicalRoot, file);
    const text = await readFile(file, "utf8");
    if (path.endsWith(".md")) {
      const frontmatterDefinition = definitionFromFrontmatter(path, text);
      if (frontmatterDefinition !== undefined) {
        definitions.push(frontmatterDefinition);
      }
      definitions.push(...markdownDefinitions(path, text));
    } else {
      const definition = jsonDefinition(path, text);
      if (definition !== undefined) {
        definitions.push(definition);
      }
    }
  }
  return definitions.sort((left, right) => left.path.localeCompare(right.path) || left.location.kind.localeCompare(right.location.kind) || (left.location.kind === "section" && right.location.kind === "section" ? left.location.startLine - right.location.startLine : 0));
}

function invalidIdDiagnostic(id: string): Diagnostic {
  return {
    code: "EXSPECSO_ARTIFACT_INVALID_ID",
    path: ".",
    expected: "ROADMAP or one of PHASE-NNN, SPEC-NNN, REQ-NNN, AC-NNN, PLAN-NNN, TASK-NNN, DEC-NNN, FINDING-NNN",
    actual: id || "blank",
    hint: "Use one exact D-20 stable ID family; aliases are not supported.",
  };
}

export async function resolveArtifact(root: string, id: string): Promise<ResolveArtifactResult> {
  const artifactId = parseArtifactId(id);
  if (artifactId === null) {
    return { kind: "not-found", diagnostics: [invalidIdDiagnostic(id)] };
  }
  const definitions = (await scanArtifactDefinitions(root)).filter((definition) => definition.id === artifactId);
  const candidates = artifactId === "ROADMAP" ? definitions.filter((definition) => definition.path === reservedRoadmapPath) : definitions;
  if (candidates.length === 0) {
    const roadmapAtWrongPath = artifactId === "ROADMAP" && definitions.length > 0;
    return {
      kind: "not-found",
      diagnostics: [
        {
          code: roadmapAtWrongPath ? "EXSPECSO_ROADMAP_RESERVED_PATH" : "EXSPECSO_ARTIFACT_NOT_FOUND",
          path: roadmapAtWrongPath ? definitions[0].path : ".",
          expected: artifactId === "ROADMAP" ? reservedRoadmapPath : `one definition for ${artifactId}`,
          actual: roadmapAtWrongPath ? definitions[0].path : "no definition",
          hint: artifactId === "ROADMAP" ? "Place the sole ROADMAP identity at .exspecso/roadmap.md." : "Add the missing canonical artifact definition.",
        },
      ],
    };
  }
  if (candidates.length > 1) {
    return {
      kind: "ambiguous",
      definitions: candidates,
      diagnostics: [
        {
          code: "EXSPECSO_ARTIFACT_DUPLICATE_ID",
          path: candidates.map((definition) => definition.path).join(", "),
          expected: `one definition for ${artifactId}`,
          actual: `${candidates.length} definitions`,
          hint: "Keep one canonical definition and give each other artifact a unique stable ID.",
        },
      ],
    };
  }
  return { kind: "resolved", id: artifactId, location: candidates[0].location };
}
