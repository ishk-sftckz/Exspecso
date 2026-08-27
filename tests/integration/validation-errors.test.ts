import { mkdir, mkdtemp, readFile, readdir, readlink, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { PassThrough, Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { runInit } from "../../src/init/run-init.js";
import { validateProject, validateProjectConfig } from "../../src/artifacts/validate.js";
import { createGitFixture, type GitFixture } from "../helpers/git-fixture.js";

const fixtures: GitFixture[] = [];

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
});

async function useFixture(): Promise<GitFixture> {
  const fixture = await createGitFixture();
  fixtures.push(fixture);
  return fixture;
}

async function write(root: string, path: string, content: string): Promise<void> {
  const target = join(root, path);
  await mkdir(join(target, ".."), { recursive: true });
  await writeFile(target, content, "utf8");
}

async function snapshot(root: string, directory = root): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".git") {
      continue;
    }
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files[`${relative(root, path)}/`] = "[directory]";
      Object.assign(files, await snapshot(root, path));
    } else if (entry.isSymbolicLink()) {
      files[relative(root, path)] = `[symlink] ${await readlink(path)}`;
    } else if (entry.isFile()) {
      files[relative(root, path)] = await readFile(path, "utf8");
    }
  }
  return files;
}

function memoryOutput(): Writable {
  return new Writable({ write(_chunk, _encoding, callback) { callback(); } });
}

function capturedOutput(): { readonly output: Writable; read(): string } {
  const chunks: Buffer[] = [];
  return {
    output: new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        callback();
      },
    }),
    read: () => Buffer.concat(chunks).toString("utf8"),
  };
}

describe("direct-edit validation", () => {
  it("rejects an invalid JSON parent before init writes anything", async () => {
    const fixture = await useFixture();
    await write(fixture.root, ".exspecso/definition.json", JSON.stringify({ id: "SPEC-001", parent: "REQUIREMENT-001" }));
    await write(fixture.root, ".exspecso/valid-definition.json", JSON.stringify({ id: "SPEC-002", parent: "PHASE-001" }));
    const before = await snapshot(fixture.root);
    const stdout = capturedOutput();
    const stderr = capturedOutput();

    const exitCode = await runInit({
      selectedAgents: ["codex"],
      cwd: fixture.root,
      stdin: new PassThrough(),
      stdout: stdout.output,
      stderr: stderr.output,
    });

    expect(exitCode).not.toBe(0);
    expect(stderr.read()).toContain("EXSPECSO_ARTIFACT_INVALID_ID");
    expect(stderr.read()).toContain(".exspecso/definition.json (parent)");
    expect(stderr.read()).toContain("REQUIREMENT-001");
    expect(stderr.read()).toContain("Expected:");
    expect(stderr.read()).toContain("Actual:");
    expect(stderr.read()).toContain("Repair:");
    expect(stdout.read()).toBe("");
    await expect(snapshot(fixture.root)).resolves.toEqual(before);
  });

  it("returns every independent config schema error with actionable diagnostics", async () => {
    const path = join(await mkdtemp(join(tmpdir(), "exspecso-invalid-config-")), "exspecso.config.json");
    await writeFile(path, JSON.stringify({
      schemaVersion: 2,
      project: { id: "not-a-uuid", title: "" },
      mode: "classified",
      selectedAgents: [],
      onboardingStatus: "complete",
      unexpected: true,
    }));

    const diagnostics = await validateProjectConfig(path, await readFile(path, "utf8"));

    expect(diagnostics.length).toBeGreaterThanOrEqual(6);
    expect(diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "EXSPECSO_CONFIG_SCHEMA", path, expected: expect.any(String), actual: expect.any(String), hint: expect.any(String) }),
    ]));
  });

  it("aggregates unknown parents and duplicate IDs alongside config errors", async () => {
    const fixture = await useFixture();
    await write(fixture.root, ".exspecso/exspecso.config.json", "{ malformed");
    await write(fixture.root, ".exspecso/specs/first.md", "---\nid: SPEC-001\nparent: PHASE-404\n---\n# First\n");
    await write(fixture.root, ".exspecso/specs/second.md", "# SPEC-001 Second\n");

    const diagnostics = await validateProject(fixture.root);

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual(expect.arrayContaining([
      "EXSPECSO_CONFIG_PARSE",
      "EXSPECSO_ARTIFACT_UNKNOWN_PARENT",
      "EXSPECSO_ARTIFACT_DUPLICATE_ID",
    ]));
  });

  it("reports malformed JSON through a stable parse diagnostic without a stack trace", async () => {
    const diagnostics = await validateProjectConfig(".exspecso/exspecso.config.json", "{ malformed");

    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: "EXSPECSO_CONFIG_PARSE",
        path: ".exspecso/exspecso.config.json",
        expected: "valid JSON",
        actual: "malformed JSON",
        hint: expect.stringContaining("JSON"),
      }),
    ]);
  });

  it("blocks init before planning writes and leaves directly edited artifacts byte unchanged", async () => {
    const fixture = await useFixture();
    await write(fixture.root, ".exspecso/exspecso.config.json", "{ malformed");
    const before = await snapshot(fixture.root);

    const exitCode = await runInit({
      selectedAgents: ["codex"],
      cwd: fixture.root,
      stdin: new PassThrough(),
      stdout: memoryOutput(),
      stderr: memoryOutput(),
    });

    expect(exitCode).not.toBe(0);
    await expect(snapshot(fixture.root)).resolves.toEqual(before);
  });

  it("lists every duplicate and prevents resolution or mutation", async () => {
    const fixture = await useFixture();
    await write(fixture.root, ".exspecso/one.md", "# DEC-001 First\n");
    await write(fixture.root, ".exspecso/two.md", "# DEC-001 Second\n");
    const before = await snapshot(fixture.root);

    await expect(validateProject(fixture.root)).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "EXSPECSO_ARTIFACT_DUPLICATE_ID", actual: "2 definitions" }),
    ]));
    await expect(runInit({
      selectedAgents: ["codex"],
      cwd: fixture.root,
      stdin: new PassThrough(),
      stdout: memoryOutput(),
      stderr: memoryOutput(),
    })).resolves.not.toBe(0);
    await expect(snapshot(fixture.root)).resolves.toEqual(before);
  });
});
