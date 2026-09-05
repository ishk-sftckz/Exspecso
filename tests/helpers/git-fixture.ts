import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

export interface GitFixture {
  root: string;
  createNestedDirectory: (...segments: string[]) => Promise<string>;
  createNestedRepository: (...segments: string[]) => Promise<string>;
  dispose: () => Promise<void>;
}

async function createFixture(isRepository: boolean): Promise<GitFixture> {
  // The no-repository fixture must remain outside the checkout so its parent
  // cannot accidentally satisfy findGitRoot during hosted tracer runs.
  const configured = isRepository ? process.env.EXSPECSO_TEST_TMPDIR : undefined;
  const parent = configured === undefined ? tmpdir() : configured;
  if (configured !== undefined && (!isAbsolute(parent) || resolve(parent) !== parent)) throw new Error("EXSPECSO_TEST_TMPDIR must be an absolute canonical test fixture path");
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(join(parent, "exspecso-fixture-"));
  if (isRepository) {
    await mkdir(join(root, ".git"));
  }

  return {
    root,
    async createNestedDirectory(...segments: string[]): Promise<string> {
      const path = join(root, ...segments);
      await mkdir(path, { recursive: true });
      return path;
    },
    async createNestedRepository(...segments: string[]): Promise<string> {
      const path = join(root, ...segments);
      await mkdir(join(path, ".git"), { recursive: true });
      return path;
    },
    async dispose(): Promise<void> {
      await rm(root, { force: true, recursive: true });
    },
  };
}

export function createGitFixture(): Promise<GitFixture> {
  return createFixture(true);
}

export function createNoGitFixture(): Promise<GitFixture> {
  return createFixture(false);
}
