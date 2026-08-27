import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface GitFixture {
  root: string;
  createNestedDirectory: (...segments: string[]) => Promise<string>;
  createNestedRepository: (...segments: string[]) => Promise<string>;
  dispose: () => Promise<void>;
}

async function createFixture(isRepository: boolean): Promise<GitFixture> {
  const root = await mkdtemp(join(tmpdir(), "exspecso-fixture-"));
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
