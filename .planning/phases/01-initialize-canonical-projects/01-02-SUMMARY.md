---
phase: 01-initialize-canonical-projects
plan: 02
subsystem: cli
tags: [node, typescript, npm, vitest, codex, initialization]
requires:
  - phase: 01-01
    provides: Explicit approval for vitest@4.1.11 and @inquirer/prompts@8.6.0
provides:
  - Packaged `exspecso init --agent codex` walking skeleton
  - Minimal canonical config and constitution plus selected Codex adapter
  - Canonical nearest-containing Git-root resolution and packed integration coverage
affects: [01-03, initialization, adapters, filesystem-transactions]
actuals:
  tokens: 22347
  tasks: 2
  commits: 4
tech-stack:
  added: [typescript@7.0.2, zod@4.4.3, vitest@4.1.11, @inquirer/prompts@8.6.0, @types/node@25.2.1]
  patterns: [Packed-package CLI integration tests, stage-validate-promote initialization, canonical Git-root containment]
key-files:
  created: [package.json, vitest.config.ts, src/cli/main.ts, src/init/run-init.ts, src/filesystem/git-root.ts, tests/helpers/git-fixture.ts, tests/helpers/run-cli.ts, tests/integration/init-codex-tracer.test.ts]
  modified: [.gitignore, package-lock.json, tsconfig.json]
key-decisions:
  - "Use an opaque UUID plus repository-derived editable title for the minimal project configuration."
  - "Treat a `.git` directory or worktree marker file as the nearest containing Git-root boundary."
patterns-established:
  - "Initialize only after preflight, same-filesystem staging, staged-config validation, and contained promotion."
  - "Exercise published behavior through npm-packed bins in isolated temporary Git fixtures."
requirements-completed: [SETUP-01, SETUP-02, SETUP-05, SETUP-06, SETUP-08, ART-01, ART-02]
coverage:
  - id: D1
    description: "Packed Codex init creates the minimal canonical foundation and selected native adapter with canonical next-operation guidance."
    requirement: "SETUP-01"
    verification:
      - kind: integration
        ref: "tests/integration/init-codex-tracer.test.ts#creates only the canonical foundation and Codex adapter"
        status: pass
    human_judgment: false
  - id: D2
    description: "Nested and nested-repository invocation targets only the nearest containing Git root, while missing repositories fail before writes."
    requirement: "SETUP-02"
    verification:
      - kind: integration
        ref: "tests/integration/init-codex-tracer.test.ts#initializes at the nearest containing Git root from a deep nested cwd"
        status: pass
      - kind: integration
        ref: "tests/integration/init-codex-tracer.test.ts#uses a nested Git repository instead of its parent repository"
        status: pass
      - kind: integration
        ref: "tests/integration/init-codex-tracer.test.ts#reports a repairable no-repository diagnostic without writes"
        status: pass
    human_judgment: false
duration: 5min
completed: 2026-08-27
status: complete
---

# Phase 01 Plan 02: Codex Initializer Tracer Summary

**A packed Node CLI initializes a Git project with inspectable canonical JSON/Markdown and a managed Codex `exspecso-start` skill, while nested invocations target only the nearest repository.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-08-27T07:32:32Z
- **Completed:** 2026-08-27T07:37:48Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Added the one-package Node/TypeScript build, `exspecso` bin, explicit Vitest configuration, and approved dependencies.
- Implemented the Codex tracer: strict CLI dispatch, config/constitution templates, UUID identity, managed skill header with SHA-256 body hash, staged validation, and completion guidance.
- Added packed integration coverage for root, deep nested, nested repository, unsupported-agent, and no-repository cases using reusable fixtures.

## Task Commits

1. **Task 1 RED: Add failing packed Codex init tracer** — `95449d0` (test)
2. **Task 1 GREEN: Ship Codex initializer tracer** — `83b5892` (feat)
3. **Task 2 RED: Add Git-root initialization coverage** — `4f95e95` (test)
4. **Task 2 GREEN: Resolve containing Git root for init** — `8722fe9` (feat)

## Verification

- `npm test -- --run --config vitest.config.ts tests/integration/init-codex-tracer.test.ts` — PASS, 6 tests.
- `npm test -- --run` — PASS, 6 tests.
- `npm run build` — PASS.
- `npm pack --dry-run` — PASS; tarball contains only compiled `dist` files, `package.json`, and `LICENSE`.

## Files Created/Modified

- `package.json`, `tsconfig.json`, and `vitest.config.ts` — package, compiler, bin, and test contracts.
- `src/cli/main.ts` and `src/init/run-init.ts` — CLI boundary and Codex initializer transaction.
- `src/filesystem/git-root.ts` — canonical nearest-containing Git-root resolver.
- `tests/helpers/git-fixture.ts`, `tests/helpers/run-cli.ts`, and `tests/integration/init-codex-tracer.test.ts` — reusable isolated CLI test infrastructure and end-to-end proof.

## Decisions Made

- The generated config starts with `onboardingStatus: "not-started"`, while mode remains the approved `unclassified` literal.
- The first adapter uses `.agents/skills/exspecso-start/SKILL.md`; its managed header retains template version and original-body SHA-256 without an adapter manifest.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Build blocker] Added explicit Node type declarations for TypeScript 7**
- **Found during:** Task 1 (Ship the end-to-end Codex initializer tracer)
- **Issue:** TypeScript 7 could not resolve Node built-ins or `NodeJS` stream interfaces needed by the required CLI boundary.
- **Fix:** Added `@types/node@25.2.1` after inspecting its official DefinitelyTyped npm metadata and configured `types: ["node"]`.
- **Files modified:** `package.json`, `package-lock.json`, `tsconfig.json`
- **Verification:** `npm run build` passes; production dependency audit reports no vulnerabilities.
- **Committed in:** `83b5892`

---

**Total deviations:** 1 auto-fixed (Rule 3: 1).
**Impact on plan:** The declaration-only development dependency restores the planned strict TypeScript build without changing package runtime behavior or initialization scope.

## Issues Encountered

- The first nested-root assertion compared a temporary path through macOS's `/var` alias with its canonical `/private/var` location. The test now asserts the required canonicalized root, matching the approved contract.

## User Setup Required

None.

## Next Phase Readiness

Plan 03 can build explicit interactive and multi-runtime selection on the permanent CLI, config, staged-write, managed-adapter, and packed-test seams. Rerun conflict handling and fault-injection recovery remain intentionally deferred to Plans 05 and 06.

## Self-Check: PASSED

- All listed source, configuration, helper, and integration-test files exist.
- All four task commits exist in Git history.
- The focused and full test commands, build, and dry-run package check passed after the final implementation commit.
