import { lstat, realpath } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Returns the nearest containing repository root without invoking Git or
 * creating repository state. A Git worktree's `.git` file is a valid marker.
 */
export async function findGitRoot(startPath: string): Promise<string | null> {
  let candidate: string;
  try {
    candidate = await realpath(startPath);
  } catch {
    return null;
  }

  while (true) {
    try {
      const marker = await lstat(join(candidate, ".git"));
      if (marker.isDirectory() || marker.isFile()) {
        return candidate;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        return null;
      }
    }

    const parent = dirname(candidate);
    if (parent === candidate) {
      return null;
    }
    candidate = parent;
  }
}
