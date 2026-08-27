import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { z } from "zod";
import { findGitRoot } from "../filesystem/git-root.js";

export interface InitInput {
  argv: string[];
  cwd: string;
  stdin: NodeJS.ReadableStream;
  stdout: NodeJS.WritableStream;
  stderr: NodeJS.WritableStream;
}

const projectConfigSchema = z.object({
  schemaVersion: z.literal(1),
  project: z.object({
    id: z.uuid(),
    title: z.string().min(1),
  }),
  mode: z.literal("unclassified"),
  selectedAgents: z.array(z.literal("codex")).length(1),
  onboardingStatus: z.literal("not-started"),
});

const constitution = `# Exspecso Constitution

## Artifact truth
Repository files are the inspectable source of project truth.

## Human control
People approve intent, scope, and meaningful tradeoffs.

## Evidence integrity
Completion claims require evidence that matches the behavior claimed.

## Bounded scope
Work stays within approved requirements and explicit recovery limits.

## Runtime portability
Supported coding runtimes share one portable Exspecso artifact model.
`;

const codexSkillBody = `---
name: exspecso-start
description: Begin Exspecso project orientation from the canonical repository artifacts.
---

# Exspecso Start

Use the repository's canonical Exspecso artifacts to begin project orientation. Preserve approved intent, surface uncertainty for human resolution, and write only the artifacts required by the approved workflow.
`;

function managedCodexSkill(): string {
  const hash = createHash("sha256").update(codexSkillBody).digest("hex");
  return `<!-- exspecso:managed template-version=1 original-body-sha256=${hash} -->\n${codexSkillBody}`;
}

function isWithinRoot(root: string, target: string): boolean {
  const pathFromRoot = relative(root, target);
  return pathFromRoot !== "" && pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot);
}

function writeError(output: NodeJS.WritableStream, code: string, message: string): void {
  output.write(`${code}: ${message}\n`);
}

function parseAgents(argv: string[]): "codex" | null {
  if (argv.length !== 2 || argv[0] !== "--agent" || argv[1] !== "codex") {
    return null;
  }
  return "codex";
}

async function hasSymlinkedAncestor(root: string, target: string): Promise<boolean> {
  let current = dirname(target);
  while (current !== root) {
    try {
      if ((await lstat(current)).isSymbolicLink()) {
        return true;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        return true;
      }
    }
    const parent = dirname(current);
    if (parent === current) {
      return true;
    }
    current = parent;
  }
  return false;
}

export async function runInit(input: InitInput): Promise<number> {
  const agent = parseAgents(input.argv);
  if (agent === null) {
    writeError(input.stderr, "EXSPECSO_INIT_USAGE", "Use `exspecso init --agent codex`.");
    return 1;
  }

  const searchedPath = resolve(input.cwd);
  const repositoryRoot = await findGitRoot(searchedPath);
  if (repositoryRoot === null) {
    writeError(
      input.stderr,
      "EXSPECSO_INIT_NO_GIT_ROOT",
      `No Git repository contains \"${searchedPath}\". Run \`git init\` or move into the intended repository.`,
    );
    return 1;
  }

  const config = {
    schemaVersion: 1 as const,
    project: {
      id: randomUUID(),
      title: basename(repositoryRoot),
    },
    mode: "unclassified" as const,
    selectedAgents: [agent] as const,
    onboardingStatus: "not-started" as const,
  };
  const targets = [
    {
      target: resolve(repositoryRoot, ".exspecso", "exspecso.config.json"),
      content: `${JSON.stringify(config, null, 2)}\n`,
    },
    {
      target: resolve(repositoryRoot, ".exspecso", "constitution.md"),
      content: constitution,
    },
    {
      target: resolve(repositoryRoot, ".agents", "skills", "exspecso-start", "SKILL.md"),
      content: managedCodexSkill(),
    },
  ];

  if (targets.some(({ target }) => !isWithinRoot(repositoryRoot, target))) {
    writeError(input.stderr, "EXSPECSO_INIT_INVALID_TARGET", "Initializer target escapes the containing repository.");
    return 1;
  }

  for (const { target } of targets) {
    if (await hasSymlinkedAncestor(repositoryRoot, target)) {
      writeError(input.stderr, "EXSPECSO_INIT_UNSAFE_TARGET", `Refusing symlinked target path \"${target}\".`);
      return 1;
    }
  }

  for (const { target } of targets) {
    try {
      await lstat(target);
      writeError(input.stderr, "EXSPECSO_INIT_CONFLICT", `Refusing to replace existing file \"${target}\".`);
      return 1;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        writeError(input.stderr, "EXSPECSO_INIT_PREFLIGHT_FAILED", `Cannot inspect \"${target}\".`);
        return 1;
      }
    }
  }

  const stageRoot = resolve(repositoryRoot, `.exspecso-stage-${randomUUID()}`);
  try {
    for (const { target, content } of targets) {
      const stagedTarget = resolve(stageRoot, relative(repositoryRoot, target));
      await mkdir(dirname(stagedTarget), { recursive: true });
      await writeFile(stagedTarget, content, "utf8");
    }

    const stagedConfig = await readFile(join(stageRoot, ".exspecso", "exspecso.config.json"), "utf8");
    const parsedConfig = projectConfigSchema.safeParse(JSON.parse(stagedConfig));
    if (!parsedConfig.success) {
      writeError(input.stderr, "EXSPECSO_INIT_STAGED_CONFIG_INVALID", "Generated config did not satisfy the initialization contract.");
      return 1;
    }

    for (const { target } of targets) {
      const stagedTarget = resolve(stageRoot, relative(repositoryRoot, target));
      await mkdir(dirname(target), { recursive: true });
      await rename(stagedTarget, target);
    }

    input.stdout.write("/exspecso-start\n");
    input.stdout.write("For Codex, invoke $exspecso-start\n");
    return 0;
  } catch (error) {
    writeError(input.stderr, "EXSPECSO_INIT_WRITE_FAILED", "Initialization could not complete; no completion guidance was printed.");
    return 1;
  } finally {
    await rm(stageRoot, { force: true, recursive: true });
  }
}
