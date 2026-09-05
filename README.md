# Exspecso

Exspecso is a local-first, spec-driven harness for AI coding agents. It keeps
canonical project state as ordinary Markdown and JSON files in the repository,
rather than in a hidden service or database.

## Package contract

Exspecso ships as one pure TypeScript/Node npm package. It supports Node 22.13+
within major 22 and Node 24. The initializer is run from a Git repository and
uses the containing Git root, including when invoked from a nested directory:

```sh
npx exspecso init --agent claude --agent codex
```

Select one or more of `claude`, `codex`, and `opencode` with repeatable
`--agent` flags. The command creates only the minimal canonical foundation and
the selected runtime adapters. Re-running it is additive: selected adapters are
added or refreshed, while unselected installed adapters remain untouched.
For both a newly committed initialization and a no-op rerun, successful stdout
is exactly `Exspecso initialized successfully.` followed by one newline. The
generated adapters retain their runtime-native invocation metadata.

## Filesystem and recovery boundary

Within the containing repository, Exspecso performs deterministic root and
relative-component checks, rejects symlinked targets, validates expected file
preimages, and uses repository-local journaled atomic writes with conservative
recovery. Its canonical state remains inspectable and editable Markdown/JSON.

Claude Code, OpenAI Codex, and OpenCode host permissions and sandboxes are the
operating-system security boundary. Exspecso does not claim kernel-level,
race-proof, hostile same-user, or universal-filesystem containment. Its
process-failure tests cover deterministic interruption and recovery, not
physical power loss or every filesystem implementation.

## Compatibility evidence

Routine CI is a representative compatibility sample, not universal
certification. It runs `npm ci`, build, the full test suite, and npm-pack
inventory inspection on these four rows:

- Ubuntu with Node 22.13.0 (the engine boundary)
- Ubuntu with Node 24.x
- macOS with Node 24.x
- Windows with Node 24.x

To reproduce the local checks separately:

```sh
npm run build
npm test -- --run
npm pack --dry-run --json
npm test -- --run tests/integration/installed-cli.test.ts
```

The installed-CLI test builds the standard npm tarball, verifies its dry-run
inventory, installs it outside the checkout with lifecycle scripts disabled,
and invokes its declared bin from temporary Git repositories.

## Historical native material

Some native source, tests, scripts, workflows, and evidence remain in this
repository as non-shipped, non-invoked historical material. They are not part
of the active build, test, npm package, installation, runtime, or triggered CI
workflow; removing them physically is outside Phase 1. Plans 01-19 and 01-20
and their summaries remain immutable historical records of the superseded
native approach, not evidence for this TypeScript/Node package.

This repository does not publish or release a package as part of Phase 1. The
next step after the local evidence is independent Phase 1 verification; a green
implementation summary is not a phase-completion verdict.
