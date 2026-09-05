import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { runNpm } from "../helpers/npm.js";

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "exspecso npm helper "));
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(directory, { recursive: true, force: true });
});

it("runs a JavaScript npm entry point with spaces and preserves literal arguments", async () => {
  const entry = join(directory, "npm cli.cjs");
  await writeFile(entry, "process.stdout.write(JSON.stringify(process.argv.slice(2)));", "utf8");
  vi.stubEnv("npm_execpath", entry);
  const args = ["pack", "path with spaces", "literal&value", "$(literal)"];
  const result = await runNpm(args, directory);
  expect(JSON.parse(result.stdout)).toEqual(args);
});

it("rejects a launch error immediately instead of leaving the caller waiting", async () => {
  await expect(runNpm(["--version"], join(directory, "missing"))).rejects.toMatchObject({ code: "ENOENT" });
});

it("reports npm's error output when the child exits unsuccessfully", async () => {
  const entry = join(directory, "failing npm.cjs");
  await writeFile(entry, "process.stderr.write('fixture failure'); process.exitCode = 7;", "utf8");
  vi.stubEnv("npm_execpath", entry);
  await expect(runNpm(["pack"], directory)).rejects.toThrow("npm pack failed (7): fixture failure");
});
