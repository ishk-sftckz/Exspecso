import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { PassThrough, Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { runInit } from "../../src/init/run-init.js";
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

async function files(root: string, directory = root): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await files(root, path)));
    if (entry.isFile()) result.push(relative(root, path));
  }
  return result.sort();
}

function sink(): Writable {
  return new Writable({ write(_chunk, _encoding, callback) { callback(); } });
}

describe("minimal persistent initialization artifacts", () => {
  it("keeps fresh and repeated initialization to the two canonical files plus selected adapter", async () => {
    const fixture = await useFixture();
    const input = { selectedAgents: ["codex"] as const, cwd: fixture.root, stdin: new PassThrough(), stdout: sink(), stderr: sink() };
    await expect(runInit(input)).resolves.toBe(0);
    await expect(runInit(input)).resolves.toBe(0);
    await expect(files(fixture.root)).resolves.toEqual([
      ".agents/skills/exspecso-start/SKILL.md",
      ".exspecso/constitution.md",
      ".exspecso/exspecso.config.json",
    ]);
    await expect(readFile(join(fixture.root, ".exspecso", "roadmap.md"), "utf8")).rejects.toThrow();
    await expect(readFile(join(fixture.root, ".exspecso", ".init.lock"), "utf8")).rejects.toThrow();
    await expect(readdir(join(fixture.root, ".exspecso", ".staging"))).rejects.toThrow();
  });
});
