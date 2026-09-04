import { artifactKindForId, parseArtifactId, type ArtifactId, type ArtifactKind } from "./schema.js";
import type { Diagnostic } from "../errors/diagnostic.js";
import { openContainedFilesystem, type BoundReader } from "../filesystem/contained-fs.js";

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

export interface ArtifactScanResult {
  readonly definitions: readonly ArtifactDefinition[];
  readonly diagnostics: readonly Diagnostic[];
}

export type ResolveArtifactResult =
  | { readonly kind: "resolved"; readonly id: ArtifactId; readonly location: ArtifactLocation }
  | { readonly kind: "not-found"; readonly diagnostics: readonly Diagnostic[] }
  | { readonly kind: "ambiguous"; readonly definitions: readonly ArtifactDefinition[]; readonly diagnostics: readonly Diagnostic[] };

const ignoredDirectoryNames = new Set([".git", "node_modules", "dist"]);
const reservedRoadmapPath = ".exspecso/roadmap.md";
const configPath = ".exspecso/exspecso.config.json";

function frontmatterDeclarations(text: string): Readonly<Partial<Record<"id" | "parent", string>>> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (match === null) {
    return {};
  }
  const declarations: Partial<Record<"id" | "parent", string>> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const declaration = /^(id|parent):(?:\s*(.*))?$/.exec(line);
    if (declaration !== null) {
      declarations[declaration[1] as "id" | "parent"] = declaration[2]?.trim() ?? "";
    }
  }
  return declarations;
}

function frontmatterDefinition(path: string, text: string): ArtifactScanResult {
  const declarations = frontmatterDeclarations(text);
  const diagnostics: Diagnostic[] = [];
  const hasId = Object.hasOwn(declarations, "id");
  const hasParent = Object.hasOwn(declarations, "parent");
  const id = hasId ? parseArtifactId(declarations.id ?? "") : null;
  const parentId = hasParent ? parseArtifactId(declarations.parent ?? "") : null;
  if (hasId && id === null) {
    diagnostics.push(invalidDeclarationDiagnostic(path, "id", declarations.id ?? ""));
  }
  if (hasParent && parentId === null) {
    diagnostics.push(invalidDeclarationDiagnostic(path, "parent", declarations.parent ?? ""));
  }
  if (id === null) {
    return { definitions: [], diagnostics };
  }
  return {
    definitions: [{ id, artifactKind: artifactKindForId(id), path, parentId: parentId ?? undefined, location: { kind: "file", path } }],
    diagnostics,
  };
}

function markdownDefinitions(path: string, text: string): ArtifactDefinition[] {
  const lines = text.split(/\r?\n/);
  const parent = frontmatterDeclarations(text).parent;
  const parentId = parent === undefined ? undefined : (parseArtifactId(parent) ?? undefined);
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

function rawDeclarationValue(value: unknown): string {
  if (typeof value === "string") {
    return value || "blank";
  }
  return JSON.stringify(value);
}

function invalidDeclarationDiagnostic(path: string, section: "id" | "parent", value: unknown): Diagnostic {
  return {
    code: "EXSPECSO_ARTIFACT_INVALID_ID",
    path,
    section,
    expected: "ROADMAP or one exact D-20 ID family",
    actual: rawDeclarationValue(value),
    hint: "Use ROADMAP, PHASE-NNN, SPEC-NNN, REQ-NNN, AC-NNN, PLAN-NNN, TASK-NNN, DEC-NNN, FIND-NNN, or PAC-NNN exactly.",
  };
}

function jsonDefinition(path: string, text: string): ArtifactScanResult {
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { definitions: [], diagnostics: [] };
    }
    const record = parsed as Record<string, unknown>;
    const diagnostics: Diagnostic[] = [];
    const hasId = Object.hasOwn(record, "id");
    const hasParent = Object.hasOwn(record, "parent");
    const id = hasId && typeof record.id === "string" ? parseArtifactId(record.id) : null;
    const parentId = hasParent && typeof record.parent === "string" ? parseArtifactId(record.parent) : null;
    if (hasId && id === null) {
      diagnostics.push(invalidDeclarationDiagnostic(path, "id", record.id));
    }
    if (hasParent && parentId === null) {
      diagnostics.push(invalidDeclarationDiagnostic(path, "parent", record.parent));
    }
    if (id === null) {
      return { definitions: [], diagnostics };
    }
    return {
      definitions: [{ id, artifactKind: artifactKindForId(id), path, parentId: parentId ?? undefined, location: { kind: "file", path } }],
      diagnostics,
    };
  } catch {
    if (path === configPath || !path.startsWith(".exspecso/")) {
      return { definitions: [], diagnostics: [] };
    }
    return {
      definitions: [],
      diagnostics: [{
        code: "EXSPECSO_ARTIFACT_PARSE",
        path,
        expected: "valid JSON",
        actual: "malformed JSON",
        hint: "Repair the JSON syntax before declaring canonical artifact identity.",
      }],
    };
  }
}

function unsafeReadDiagnostic(path: string, error: unknown): Diagnostic {
  return {
    code: "EXSPECSO_ARTIFACT_UNSAFE_READ",
    path,
    expected: "a contained regular file or directory",
    actual: error instanceof Error ? error.message : "unreadable entry",
    hint: "Replace substituted, unreadable, or unsupported artifact paths with contained regular files or directories.",
  };
}

function artifactFiles(reader: BoundReader, components: readonly string[] = []): { readonly files: readonly string[][]; readonly diagnostics: readonly Diagnostic[] } {
  let entries: readonly string[];
  try {
    entries = reader.list(components);
  } catch (error) {
    return { files: [], diagnostics: [unsafeReadDiagnostic(components.join("/") || ".", error)] };
  }
  const files: string[][] = [];
  const diagnostics: Diagnostic[] = [];
  for (const name of [...entries].sort((left, right) => left.localeCompare(right))) {
    const path = [...components, name];
    try {
      const kind = reader.metadata(path);
      if (kind === "directory") {
        if (!ignoredDirectoryNames.has(name)) {
          const nested = artifactFiles(reader, path);
          files.push(...nested.files);
          diagnostics.push(...nested.diagnostics);
        }
      } else if (name.endsWith(".md") || name.endsWith(".json")) {
        files.push(path);
      }
    } catch (error) {
      diagnostics.push(unsafeReadDiagnostic(path.join("/"), error));
    }
  }
  return { files, diagnostics };
}

async function scanWithReader(reader: BoundReader): Promise<ArtifactScanResult> {
  const definitions: ArtifactDefinition[] = [];
  const discovered = artifactFiles(reader);
  const diagnostics: Diagnostic[] = [...discovered.diagnostics];
  for (const components of discovered.files) {
    const path = components.join("/");
    let text: string;
    try {
      text = reader.read(components).toString("utf8");
    } catch (error) {
      diagnostics.push(unsafeReadDiagnostic(path, error));
      continue;
    }
    if (path.endsWith(".md")) {
      const result = frontmatterDefinition(path, text);
      definitions.push(...result.definitions);
      diagnostics.push(...result.diagnostics);
      definitions.push(...markdownDefinitions(path, text));
    } else {
      const result = jsonDefinition(path, text);
      definitions.push(...result.definitions);
      diagnostics.push(...result.diagnostics);
    }
  }
  return {
    definitions: definitions.sort((left, right) => left.path.localeCompare(right.path) || left.location.kind.localeCompare(right.location.kind) || (left.location.kind === "section" && right.location.kind === "section" ? left.location.startLine - right.location.startLine : 0)),
    diagnostics,
  };
}

export async function scanArtifacts(root: string, reader?: BoundReader): Promise<ArtifactScanResult> {
  if (reader !== undefined) return scanWithReader(reader);
  const capability = openContainedFilesystem(root);
  try {
    return await scanWithReader(capability.reader);
  } finally {
    capability.close();
  }
}

export async function scanArtifactDefinitions(root: string, reader?: BoundReader): Promise<readonly ArtifactDefinition[]> {
  return (await scanArtifacts(root, reader)).definitions;
}

function invalidIdDiagnostic(id: string): Diagnostic {
  return {
    code: "EXSPECSO_ARTIFACT_INVALID_ID",
    path: ".",
    expected: "ROADMAP or one of PHASE-NNN, SPEC-NNN, REQ-NNN, AC-NNN, PLAN-NNN, TASK-NNN, DEC-NNN, FIND-NNN, PAC-NNN",
    actual: id || "blank",
    hint: "Use one exact D-20 stable ID family; aliases are not supported.",
  };
}

export async function resolveArtifact(root: string, id: string, reader?: BoundReader): Promise<ResolveArtifactResult> {
  const artifactId = parseArtifactId(id);
  if (artifactId === null) {
    return { kind: "not-found", diagnostics: [invalidIdDiagnostic(id)] };
  }
  const definitions = (await scanArtifactDefinitions(root, reader)).filter((definition) => definition.id === artifactId);
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
