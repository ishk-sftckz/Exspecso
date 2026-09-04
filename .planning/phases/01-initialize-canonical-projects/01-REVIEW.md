---
phase: 01-initialize-canonical-projects
reviewed: 2026-09-04T16:25:45Z
depth: standard
files_reviewed: 30
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
  - tests/unit/adapters.test.ts
  - tests/unit/containment-support.test.ts
  - tests/unit/root-scoped-fs.test.ts
  - tests/unit/runtime-selection.test.ts
  - vitest.config.ts
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-09-04T16:25:45Z
**Depth:** standard
**Files Reviewed:** 30
**Status:** issues_found

## Summary

Reviewed the shipped TypeScript/Node initializer, runtime selection, package and CI surfaces, plus the requested regression tests. The production selector correctly builds a fixed unchecked Claude Code, OpenAI Codex, OpenCode list and contains no ambient-agent detection branch. The native sources are historical, non-shipped material under D-21/D-22 and were not treated as active defects.

Focused runtime-selection/installed-package tests, the active suite, TypeScript build, and dry-run package inventory passed. One test reliability defect remains in the G-01-1 regression coverage.

## Narrative Findings (AI reviewer)

### WR-01 [WARNING]: Test still passes the removed detection API field

**File:** `/Users/ishk.sftckz/Projects/exspecso/tests/unit/runtime-selection.test.ts:84-90`
**Issue:** The test case for duplicate non-TTY flags still supplies `detectedAgents: []`, even though `ResolveSelectedAgentsInput` no longer declares that field. Vitest transpiles tests without TypeScript type checking (`tsconfig.json` includes only `src`), so this stale object member is silently ignored and the test passes. That contradicts Plan 01-24's explicit requirement to remove the obsolete API from the test input, and it weakens the regression against restoring a compatibility/detection input surface.
**Fix:** Remove `detectedAgents: []` from the fixture. Add a type-checked test compilation step (or a focused type assertion) for this public input contract so obsolete selection fields cannot silently remain in tests.

---

_Reviewed: 2026-09-04T16:25:45Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
