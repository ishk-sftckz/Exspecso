import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough, Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { renderConstitution, renderProjectConfig } from "../../src/artifacts/templates.js";
import { resolveArtifact, scanArtifactDefinitions, scanArtifacts } from "../../src/artifacts/resolve.js";
import { ARTIFACT_ID_PATTERNS, projectConfigSchema } from "../../src/artifacts/schema.js";
import type { BoundReader } from "../../src/filesystem/contained-fs.js";
import { runInit } from "../../src/init/run-init.js";

const temporaryPaths: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryPaths.splice(0).map((path) => rm(path, { force: true, recursive: true })));
});

async function fixture(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "exspecso-artifacts-"));
  temporaryPaths.push(path);
  return path;
}

async function write(root: string, path: string, content: string): Promise<void> {
  const target = join(root, path);
  await mkdir(join(target, ".."), { recursive: true });
  await writeFile(target, content, { encoding: "utf8", flag: "w" });
}

function memoryOutput(): Writable {
  return new Writable({ write(_chunk, _encoding, callback) { callback(); } });
}

describe("canonical artifact contracts", () => {
  it("accepts only the minimal D-01 project configuration fields", () => {
    const config = {
      schemaVersion: 1,
      project: { id: "df1c86ff-73de-4ec6-849e-6de229cb3b02", title: "Renamable title" },
      mode: "unclassified",
      selectedAgents: ["codex"],
      onboardingStatus: "not-started",
    };

    expect(projectConfigSchema.safeParse(config).success).toBe(true);
    expect(projectConfigSchema.safeParse({ ...config, setup: {} }).success).toBe(false);
    expect(projectConfigSchema.safeParse({ ...config, project: { ...config.project, slug: "renamable-title" } }).success).toBe(false);
    expect(renderProjectConfig(config)).toBe(`${JSON.stringify(config, null, 2)}\n`);
  });

  it("renders only the five D-03 constitution invariants", () => {
    expect(renderConstitution()).toBe(`# Exspecso Constitution\n\n## Artifact truth\nRepository files are the inspectable source of project truth.\n\n## Human control\nPeople approve intent, scope, and meaningful tradeoffs.\n\n## Evidence integrity\nCompletion claims require evidence that matches the behavior claimed.\n\n## Bounded scope\nWork stays within approved requirements and explicit recovery limits.\n\n## Runtime portability\nSupported coding runtimes share one portable Exspecso artifact model.\n`);
  });

  it("recognizes exactly the ten D-20 public ID families and rejects aliases", async () => {
    expect(Object.keys(ARTIFACT_ID_PATTERNS)).toEqual([
      "ROADMAP",
      "PHASE",
      "SPEC",
      "REQ",
      "AC",
      "PLAN",
      "TASK",
      "DEC",
      "FIND",
      "PAC",
    ]);

    const root = await fixture();
    await write(root, "ids.md", "# ROADMAP\n# PHASE-001\n# SPEC-001\n# REQ-001\n# AC-001\n# PLAN-001\n# TASK-001\n# DEC-001\n# FIND-001\n# PAC-001\n# FINDING-001\n# REQUIREMENT-001\n");
    const definitions = await scanArtifactDefinitions(root);

    expect(definitions.map((definition) => definition.id)).toEqual([
      "ROADMAP",
      "PHASE-001",
      "SPEC-001",
      "REQ-001",
      "AC-001",
      "PLAN-001",
      "TASK-001",
      "DEC-001",
      "FIND-001",
      "PAC-001",
    ]);
    await expect(resolveArtifact(root, "REQUIREMENT-001")).resolves.toMatchObject({
      kind: "not-found",
      diagnostics: [{ code: "EXSPECSO_ARTIFACT_INVALID_ID" }],
    });
    await expect(resolveArtifact(root, "FINDING-001")).resolves.toMatchObject({
      kind: "not-found",
      diagnostics: [{ code: "EXSPECSO_ARTIFACT_INVALID_ID" }],
    });
    await expect(resolveArtifact(root, "")).resolves.toMatchObject({
      kind: "not-found",
      diagnostics: [{ code: "EXSPECSO_ARTIFACT_INVALID_ID" }],
    });
  });

  it("resolves ROADMAP only at its reserved path and isolates adjacent Task sections", async () => {
    const root = await fixture();
    await write(root, ".exspecso/roadmap.md", "# ROADMAP\n");
    await write(root, "specs/SPEC-001/tasks.md", "# Tasks\n\n## TASK-001 First task\nFirst body.\n\n## TASK-002 Second task\nSecond body.\n");

    const roadmap = await resolveArtifact(root, "ROADMAP");
    const firstTask = await resolveArtifact(root, "TASK-001");
    const secondTask = await resolveArtifact(root, "TASK-002");

    expect(roadmap).toEqual({ kind: "resolved", id: "ROADMAP", location: { kind: "file", path: ".exspecso/roadmap.md" } });
    expect(firstTask).toMatchObject({ kind: "resolved", location: { kind: "section", path: "specs/SPEC-001/tasks.md", heading: "## TASK-001 First task", startLine: 3, endLine: 5 } });
    expect(secondTask).toMatchObject({ kind: "resolved", location: { kind: "section", path: "specs/SPEC-001/tasks.md", heading: "## TASK-002 Second task", startLine: 6, endLine: 7 } });
  });

  it("resolves every exact D-20 family to a canonical location, including FIND and PAC sections", async () => {
    const root = await fixture();
    await write(root, ".exspecso/roadmap.md", "# ROADMAP\n");
    await write(root, ".exspecso/definitions.md", "# PHASE-001\n# SPEC-001\n# REQ-001\n# AC-001\n# PLAN-001\n# TASK-001\n# DEC-001\n\n## FIND-001 A hand-authored finding\nFinding body.\n\n## PAC-001 A hand-authored Phase Acceptance Check\nPAC body.\n");

    const results = await Promise.all([
      "ROADMAP", "PHASE-001", "SPEC-001", "REQ-001", "AC-001", "PLAN-001", "TASK-001", "DEC-001", "FIND-001", "PAC-001",
    ].map((id) => resolveArtifact(root, id)));
    const definitions = await scanArtifactDefinitions(root);

    expect(results.map((result) => result.kind)).toEqual(Array(10).fill("resolved"));
    expect(definitions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "FIND-001", artifactKind: "FIND" }),
      expect.objectContaining({ id: "PAC-001", artifactKind: "PAC" }),
    ]));
    expect(results[8]).toMatchObject({ location: { kind: "section", path: ".exspecso/definitions.md", heading: "## FIND-001 A hand-authored finding", startLine: 10, endLine: 12 } });
    expect(results[9]).toMatchObject({ location: { kind: "section", path: ".exspecso/definitions.md", heading: "## PAC-001 A hand-authored Phase Acceptance Check", startLine: 13, endLine: 14 } });
  });

  it("keeps identity stable across title changes and declaration reordering, but fails closed for duplicates", async () => {
    const root = await fixture();
    await write(root, "specs.md", "## SPEC-002 Later declaration\n\n## SPEC-001 Renamed display title\n");
    await write(root, "phase.md", "---\nid: PHASE-001\nparent: ROADMAP\n---\n# A renamed phase\n");

    await expect(resolveArtifact(root, "SPEC-001")).resolves.toMatchObject({ kind: "resolved", id: "SPEC-001" });
    await expect(resolveArtifact(root, "PHASE-001")).resolves.toMatchObject({ kind: "resolved", id: "PHASE-001" });

    await write(root, "duplicate.md", "# SPEC-001 Duplicate\n");
    await expect(resolveArtifact(root, "SPEC-001")).resolves.toMatchObject({
      kind: "ambiguous",
      definitions: [{ path: "duplicate.md" }, { path: "specs.md" }],
      diagnostics: [{ code: "EXSPECSO_ARTIFACT_DUPLICATE_ID" }],
    });
  });

  it("retains every explicitly declared invalid JSON id and parent shape as a diagnostic", async () => {
    const root = await fixture();
    const cases: readonly [string, unknown, string][] = [
      ["invalid-string", "REQUIREMENT-001", "REQUIREMENT-001"],
      ["blank", "", "blank"],
      ["null", null, "null"],
      ["number", 1, "1"],
      ["boolean", true, "true"],
      ["array", [], "[]"],
      ["object", {}, "{}"],
    ];

    for (const [index, [name, value]] of cases.entries()) {
      await write(root, `.exspecso/${name}-id.json`, JSON.stringify({ id: value, parent: "PHASE-001" }));
      await write(root, `.exspecso/${name}-parent.json`, JSON.stringify({ id: `SPEC-${String(index + 1).padStart(3, "0")}`, parent: value }));
    }

    const scan = await scanArtifacts(root);

    for (const [name, _value, actual] of cases) {
      expect(scan.diagnostics).toContainEqual(expect.objectContaining({
        code: "EXSPECSO_ARTIFACT_INVALID_ID",
        path: `.exspecso/${name}-id.json`,
        section: "id",
        actual,
      }));
      expect(scan.diagnostics).toContainEqual(expect.objectContaining({
        code: "EXSPECSO_ARTIFACT_INVALID_ID",
        path: `.exspecso/${name}-parent.json`,
        section: "parent",
        actual,
      }));
    }
  });

  it("keeps valid JSON definitions separate from explicit frontmatter diagnostics", async () => {
    const root = await fixture();
    await write(root, ".exspecso/definition.json", JSON.stringify({ id: "SPEC-001", parent: "PHASE-001" }));
    await write(root, ".exspecso/invalid-frontmatter.md", "---\nid: REQUIREMENT-001\nparent:\n---\n# Notes\n");
    await write(root, ".exspecso/exspecso.config.json", renderProjectConfig({
      schemaVersion: 1,
      project: { id: "df1c86ff-73de-4ec6-849e-6de229cb3b02", title: "Fixture" },
      mode: "unclassified",
      selectedAgents: ["codex"],
      onboardingStatus: "not-started",
    }));

    const scan = await scanArtifacts(root);

    expect(scan.definitions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "SPEC-001", parentId: "PHASE-001" }),
    ]));
    expect(scan.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ".exspecso/invalid-frontmatter.md", section: "id", actual: "REQUIREMENT-001" }),
      expect.objectContaining({ path: ".exspecso/invalid-frontmatter.md", section: "parent", actual: "blank" }),
    ]));
    expect(scan.diagnostics).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ".exspecso/exspecso.config.json", code: "EXSPECSO_ARTIFACT_INVALID_ID" }),
    ]));
  });

  it("reports substituted artifact entries without reading their external bytes", async () => {
    const reader: BoundReader = {
      list(components) {
        if (components.length === 0) return [".exspecso", "redirect"];
        if (components.join("/") === ".exspecso") return ["definition.json", "broken.json"];
        throw new Error("EXSPECSO_CONTAINMENT_ENOENT: absent directory");
      },
      metadata(components) {
        const path = components.join("/");
        if (path === ".exspecso") return "directory";
        if ([".exspecso/definition.json", ".exspecso/broken.json"].includes(path)) return "file";
        if (path === "redirect") throw new Error("EXSPECSO_CONTAINMENT_IO: symbolic link rejected");
        throw new Error("EXSPECSO_CONTAINMENT_ENOENT: absent path");
      },
      read(components) {
        const path = components.join("/");
        if (path === ".exspecso/definition.json") return Buffer.from('{"id":"SPEC-001","parent":"PHASE-001"}');
        if (path === ".exspecso/broken.json") return Buffer.from("{ malformed");
        throw new Error("external bytes must not be read");
      },
    };

    const scan = await scanArtifacts("/repository", reader);

    expect(scan.definitions).toEqual([expect.objectContaining({ id: "SPEC-001", path: ".exspecso/definition.json" })]);
    expect(scan.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "EXSPECSO_ARTIFACT_PARSE", path: ".exspecso/broken.json" }),
      expect.objectContaining({ code: "EXSPECSO_ARTIFACT_UNSAFE_READ", path: "redirect" }),
    ]));
  });

  it("returns byte-equivalent locations from concurrent read-only resolution", async () => {
    const root = await fixture();
    await write(root, "specs/SPEC-001/tasks.md", "## TASK-001 Stable task\nBody.\n");
    const before = await readFile(join(root, "specs/SPEC-001/tasks.md"), "utf8");

    const results = await Promise.all(Array.from({ length: 12 }, () => resolveArtifact(root, "TASK-001")));

    expect(results).toEqual(Array.from({ length: 12 }, () => results[0]));
    await expect(readFile(join(root, "specs/SPEC-001/tasks.md"), "utf8")).resolves.toBe(before);
  });

  it("recognizes IDs without materializing deferred canonical artifacts", async () => {
    const root = await fixture();
    await write(root, ".exspecso/exspecso.config.json", renderProjectConfig({
      schemaVersion: 1,
      project: { id: "df1c86ff-73de-4ec6-849e-6de229cb3b02", title: "Fixture" },
      mode: "unclassified",
      selectedAgents: ["codex"],
      onboardingStatus: "not-started",
    }));
    const before = await readFile(join(root, ".exspecso/exspecso.config.json"), "utf8");

    await expect(resolveArtifact(root, "PLAN-001")).resolves.toMatchObject({ kind: "not-found" });
    await expect(readFile(join(root, ".exspecso/exspecso.config.json"), "utf8")).resolves.toBe(before);
    await expect(readFile(join(root, ".exspecso/roadmap.md"), "utf8")).rejects.toThrow();
  });

  it("keeps fresh and repeated initialization limited to minimal artifacts and selected adapters", async () => {
    const root = await fixture();
    await mkdir(join(root, ".git"));
    const init = () => runInit({
      selectedAgents: ["codex"],
      cwd: root,
      stdin: new PassThrough(),
      stdout: memoryOutput(),
      stderr: memoryOutput(),
    });

    await expect(init()).resolves.toBe(0);
    await init();

    await expect(readFile(join(root, ".exspecso/exspecso.config.json"), "utf8")).resolves.toContain("unclassified");
    await expect(readFile(join(root, ".exspecso/constitution.md"), "utf8")).resolves.toContain("Artifact truth");
    await expect(readFile(join(root, ".agents/skills/exspecso-start/SKILL.md"), "utf8")).resolves.toContain("exspecso-start");
    for (const deferredPath of ["roadmap.md", "phases", "specs", "requirements", "plans", "tasks", "decisions", "findings", "trace", "research", "reports", "reviews"]) {
      await expect(readFile(join(root, ".exspecso", deferredPath), "utf8")).rejects.toThrow();
    }
  });
});
