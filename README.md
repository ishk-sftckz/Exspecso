# Exspecso

You approve a plan, your coding agent starts work, and the session runs out of
context. The next session needs to know what you approved, what changed, and
what still needs proof. That shouldn't depend on reconstructing a conversation.

Exspecso is a local-first, spec-driven harness for AI coding agents. It keeps
project truth in ordinary Markdown and small JSON files in your repository.
You can open them, edit them, review their diffs, and carry them into another
session. The rule behind the framework is simple: approved intent must survive
the work, and completion must be backed by evidence.

## What you can use today

The initializer is implemented for Claude Code, OpenAI Codex, and OpenCode.
It creates the project's configuration, constitution, and the adapters you
select. The full planning, delivery, verification, and resume workflow is still
being built. Installing a start adapter doesn't yet provide that full workflow.

Phase 1 is complete, and Phase 2 is ready for planning. The package is currently
marked private in [package.json](package.json); Phase 1 does not include an npm
release. Use the local checkout to try the initializer.

## Initialize a project from your checkout

Exspecso builds as one pure TypeScript/Node npm package. Use Node 22.13.0 or
later within major 22, or Node 24.x.

From your Exspecso checkout, install dependencies and build:

```sh
npm ci
npm run build
```

Then, from the Git repository you want to initialize, run the built CLI. Replace
the path below with the absolute path to your Exspecso checkout:

```sh
node /path/to/exspecso/dist/cli/main.js init --agent claude --agent codex
```

Repeat `--agent` to select any combination of `claude`, `codex`, and `opencode`.
If you run the command from a nested directory, it uses the containing Git root.

Initialization creates two canonical files:

- `.exspecso/exspecso.config.json` — project configuration.
- `.exspecso/constitution.md` — the project's governing rules.

It also writes the selected start adapters. Public documentation calls the
operation `/exspecso-start`; Codex invokes it as `$exspecso-start`. The operation
identity stays `exspecso-start` across runtimes.

You can rerun initialization to add or refresh selected adapters. Installed
adapters you didn't select remain untouched. Both a successful initialization
and a rerun that needs no changes print exactly this line, followed by one
newline:

```text
Exspecso initialized successfully.
```

## How Exspecso protects repository writes

Before writing, Exspecso checks the repository root and each relative path
component, rejects symlinked targets, and checks that existing files still
match the contents it expects. Writes use a journal inside the repository and
atomic file replacement, so an interrupted operation leaves a record for
conservative recovery.

Your coding agent's host permissions and sandbox provide the operating-system
security boundary. Exspecso's checks do not establish kernel-level, race-proof,
hostile same-user, or universal-filesystem containment. The process-failure
tests cover deterministic interruption and recovery; they don't establish
recovery from physical power loss or behavior on every filesystem.

## Check the build and the packaged CLI

[Routine CI](.github/workflows/ci.yml) runs `npm ci`, the build, the full test
suite, and npm-pack inventory inspection on four combinations:

| Operating system | Node version |
| --- | --- |
| Ubuntu | 22.13.0, the minimum supported version |
| Ubuntu | 24.x |
| macOS | 24.x |
| Windows | 24.x |

These runs sample supported environments. They don't certify every operating
system, Node version, or filesystem combination.

After installing dependencies, you can run the checks locally:

```sh
npm run build
npm test -- --run
npm pack --dry-run --json
```

To run just the installed-CLI checks:

```sh
npm test -- --run tests/integration/installed-cli.test.ts
```

That test builds the standard npm tarball, checks its inventory, installs it
outside the checkout with lifecycle scripts disabled, and runs the declared
CLI from temporary Git repositories. It checks the package a user would
install, as well as the source in this checkout.

## Reading the older native implementation

The repository retains native source, tests, scripts, workflows, and evidence
from an earlier approach. Those files are historical material: they are
excluded from the active build, test suite, npm package, installation, runtime,
and triggered CI. Their physical removal was outside Phase 1's scope.

Plans 01-19 and 01-20 and their summaries remain immutable records of that
superseded approach. Use the active TypeScript/Node checks above to assess the
current package; the native records don't establish that it works.
