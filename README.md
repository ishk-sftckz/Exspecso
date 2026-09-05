# Exspecso

Exspecso is a spec-driven framework for Claude Code, OpenAI Codex, and OpenCode.

A coding agent can write solid code and still drift from the spec, overbuild
the solution, or call unfinished work done. You end up catching those mistakes,
reconstructing context after interruptions, and prompting it through an
already approved plan.

Exspecso is being built to handle that work. Specs define the scope and required
evidence before implementation starts. The planned workflow runs through an
approved Phase, verifies each Task, and attempts corrections within explicit
limits. Scope changes still need your decision. Progress stays in repository
files so another session can continue from the last checkpoint.

## Development status

The initializer works today. It creates the project's configuration,
constitution, and selected agent adapters. Planning, delivery, verification,
and resume are still in development.

Phase 1 is complete, and Phase 2 is ready for planning. The package is currently
marked private in [package.json](package.json), and an npm release is outside
Phase 1's scope. You can try the initializer from a local checkout.

## Try it locally

Exspecso is one TypeScript/Node npm package. It supports Node 22.13.0 or later
within major 22, and Node 24.x.

From your Exspecso checkout, install dependencies and build:

```sh
npm ci
npm run build
```

From the Git repository you want to initialize, run the built CLI using the
absolute path to your Exspecso checkout:

```sh
node /path/to/exspecso/dist/cli/main.js init --agent claude --agent codex
```

Repeat `--agent` to select any combination of `claude`, `codex`, and `opencode`.
If you run the command from a nested directory, it uses the containing Git root.

Initialization writes the project configuration to `.exspecso/exspecso.config.json`
and the governing rules to `.exspecso/constitution.md`.

It also writes the selected start adapters. The documented operation is
`/exspecso-start`; in Codex, you invoke it as `$exspecso-start`. Both use the
same `exspecso-start` operation ID.

Rerun initialization to add or refresh selected adapters. Adapters you didn't
select remain untouched. Every successful run, including one that needs no
changes, prints this exact line followed by one newline:

```text
Exspecso initialized successfully.
```

## Repository writes and recovery

Before writing, Exspecso checks the repository root and each relative path
component, rejects symlinked targets, and checks that existing files still
match the contents it expects. It records writes in a repository-local journal
and replaces files atomically. After an interruption, it uses that journal
for conservative recovery.

Your coding agent's host permissions and sandbox provide the operating-system
security boundary. Exspecso's checks do not establish kernel-level, race-proof,
hostile same-user, or universal-filesystem containment. The process-failure
tests cover deterministic interruption and recovery; they don't establish
recovery from physical power loss or behavior on every filesystem.

## Run the checks

[CI](.github/workflows/ci.yml) runs `npm ci`, the build, the full test suite,
and npm-pack inventory inspection on these combinations:

| Operating system | Node version |
| --- | --- |
| Ubuntu | 22.13.0, the minimum supported version |
| Ubuntu | 24.x |
| macOS | 24.x |
| Windows | 24.x |

This is a representative sample of supported environments; other operating
system, Node version, and filesystem combinations remain unverified by these runs.

After installing dependencies, you can run the checks locally:

```sh
npm run build
npm test -- --run
npm pack --dry-run --json
```

To run the installed-CLI checks separately:

```sh
npm test -- --run tests/integration/installed-cli.test.ts
```

That test builds the standard npm tarball, checks its inventory, installs it
outside the checkout with lifecycle scripts disabled, and runs the declared
CLI from temporary Git repositories.

## Native implementation history

The repository retains native source, tests, scripts, workflows, and evidence
from an earlier approach. They're excluded from the active build, test suite,
npm package, installation, runtime, and triggered CI. Removing them was outside
Phase 1's scope.

Plans 01-19 and 01-20 and their summaries remain immutable records of that
superseded approach. Their results don't verify the current TypeScript/Node package.
