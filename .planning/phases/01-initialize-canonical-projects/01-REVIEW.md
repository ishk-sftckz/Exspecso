---
phase: 01-initialize-canonical-projects
reviewed: 2026-09-05T00:32:30Z
depth: standard
files_reviewed: 34
files_reviewed_list:
  - .github/workflows/ci.yml
  - README.md
  - native/build.mjs
  - native/contained-fs-posix.cc
  - native/contained-fs-win.cc
  - native/contained-fs.cc
  - native/support-matrix.json
  - package.json
  - src/adapters/registry.ts
  - src/artifacts/resolve.ts
  - src/artifacts/schema.ts
  - src/cli/arguments.ts
  - src/cli/main.ts
  - src/filesystem/contained-fs.ts
  - src/filesystem/journal.ts
  - src/filesystem/ownership.ts
  - src/filesystem/recovery.ts
  - src/filesystem/support-matrix.ts
  - src/filesystem/transaction.ts
  - src/init/completion.ts
  - src/init/run-init.ts
  - src/init/runtime-selection.ts
  - tests/helpers/package-fixture.ts
  - tests/integration/init-codex-tracer.test.ts
  - tests/integration/init-typescript-tracer.test.ts
  - tests/integration/installed-cli.test.ts
  - tests/integration/transaction-recovery.test.ts
  - tests/integration/validation-errors.test.ts
  - tests/unit/adapters.test.ts
  - tests/unit/artifacts.test.ts
  - tests/unit/containment-support.test.ts
  - tests/unit/root-scoped-fs.test.ts
  - tests/unit/runtime-selection.test.ts
  - vitest.config.ts
findings:
  critical: 0
  warning: 2
  info: 0
  total: 2
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-09-05T00:32:30Z
**Depth:** standard
**Files Reviewed:** 34
**Status:** issues_found

## Summary

Reviewed the requested Phase 01 implementation at standard depth, including the D-20 supersession. The public registry correctly exposes the ten canonical families, resolves `FIND-NNN` and `PAC-NNN`, and rejects `FINDING-NNN` without a compatibility alias. The active pure TypeScript/Node initializer, package surface, and representative CI workflow are consistent with D-21/D-22; the retained native material is non-shipped historical/deferred code under that decision.

`npm run build`, the active `npm test -- --run` suite (94 tests), and `npm pack --dry-run --json` pass. Two required regressions are nevertheless not protected as claimed by the active test gate.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Detection-free selector test still passes a removed API field

**Classification:** WARNING

**File:** `/Users/ishk.sftckz/Projects/exspecso/tests/unit/runtime-selection.test.ts:84-90`

**Issue:** The duplicate non-TTY selection case still supplies `detectedAgents: []`, although `ResolveSelectedAgentsInput` no longer has that member. This directly misses Plan 01-24's instruction to remove it from the test fixture. Tests are transpiled without type-checking and `tsconfig.json` compiles only `src`, so the stale property is silently ignored. The test therefore passes without proving that callers have stopped using the superseded detection API.

**Fix:** Remove `detectedAgents: []` from this call. Type-check test sources in CI (or add a compile-time fixture assertion) so removed public-input fields cannot survive as ignored object properties.

### WR-02: The new D-20 aggregate-rejection regression is excluded from every active test run

**Classification:** WARNING

**File:** `/Users/ishk.sftckz/Projects/exspecso/vitest.config.ts:9`

**Issue:** The active Vitest configuration excludes `tests/integration/validation-errors.test.ts`. That file now contains the Plan 01-25 regression for rejected `FINDING-NNN`, duplicate `FIND-NNN`, invalid `PAC-NNN` parent, and zero mutation at lines 169-198. Consequently the CI command in `.github/workflows/ci.yml:33` and the reported 94-test full suite do not execute this new D-20 safety contract. The temporary isolated invocation recorded in the plan summary is not a retained CI gate, so a future regression can ship while all active checks remain green.

**Fix:** Move this maintained D-20 case to an included integration suite (for example, `init-typescript-tracer.test.ts`), or add a dedicated CI command that runs this test with a committed isolated Vitest configuration. Keep the historical native-only cases excluded rather than relying on an excluded file for active validation.

---

_Reviewed: 2026-09-05T00:32:30Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
