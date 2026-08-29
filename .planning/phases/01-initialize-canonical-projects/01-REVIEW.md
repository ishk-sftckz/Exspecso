---
phase: 01-initialize-canonical-projects
reviewed: 2026-08-29T13:00:32Z
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
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-08-29T13:00:32Z
**Depth:** standard
**Files Reviewed:** 30
**Status:** issues_found

## Summary

The active TypeScript package, its transaction/recovery paths, package contents, CI surface, and scoped tests were reviewed. Historical native material was treated as retained, non-shipped provenance under D-21 rather than as a defect in itself. `npm run build` and the default Vitest suite pass locally (9 files, 86 tests), but the shipped implementation has two release-blocking defects: additive initialization fails on Windows, and production code retains environment-controlled test hooks that permit arbitrary writes and indefinite hangs.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Windows additive initialization cannot stage backups

**Classification:** BLOCKER

**File:** `/Users/ishk.sftckz/Projects/exspecso/src/filesystem/transaction.ts:227`

**Issue:** `backupPath` is persisted as transaction-journal data but is constructed with the host-native `path.join`. On Windows this creates a value such as `backups\\.exspecso\\exspecso.config.json`. The later `components()` helper splits only on `/`, so it passes the backslash-containing value as one directory/file component. `DirectoryCapability` rejects that component, and the journal parser also rejects `backupPath` values containing `\\`. Any transaction with an existing preimage—such as the documented additive rerun that updates `exspecso.config.json`—therefore fails on Windows and leaves recovery evidence that cannot parse. The Windows CI row exercises this product contract but this platform-specific branch is not covered by the current local tests.

**Fix:** Store journal-relative paths in a platform-independent slash format; reserve `path.join()` for actual host filesystem paths.

```ts
const backupPath = current === undefined
  ? null
  : `backups/${write.relativePath}`;
```

Add a Windows-path unit test (for example using `path.win32`) that stages a write with a preimage and verifies both commit and recovery accept the resulting journal path.

### CR-02: Shipped test environment hooks allow arbitrary writes and a permanent CLI hang

**Classification:** BLOCKER

**Files:**

- `/Users/ishk.sftckz/Projects/exspecso/src/filesystem/transaction.ts:164-168`
- `/Users/ishk.sftckz/Projects/exspecso/src/filesystem/ownership.ts:139-144`

**Issue:** Both modules are included in the published package, yet production execution honors `EXSPECSO_TEST_*` variables. A caller can set the corresponding sync-file variable to any writable path and the matching fault-point variable to make the normal CLI write a JSON signal outside the repository. Setting either `EXSPECSO_TEST_WAIT_FOR_KILL=1` or `EXSPECSO_TEST_WAIT_FOR_OWNERSHIP_KILL=1` then waits forever. This is not merely a test concern: the hooks are reachable from the released CLI and bypass the containment layer entirely. The transaction hook was reproduced with the built CLI, which created the specified external signal file while initialization ran.

**Fix:** Remove process-environment fault/synchronization handling from shipped modules. Put child-process control in test-only harness code, or pass an in-memory test callback through a non-exported test seam that has no file path or wait behavior. Add an installed-package regression test proving these environment variables cannot create an external file or block `exspecso init`.

## Warnings

### WR-01: A zero-progress synchronous write loops forever while holding the transaction lease

**Classification:** WARNING

**File:** `/Users/ishk.sftckz/Projects/exspecso/src/filesystem/contained-fs.ts:168`

**Issue:** The write loop advances solely by the return value of `writeSync`. Unlike the guarded read loop, it does not reject a non-positive result. If a non-empty write ever returns `0`, `offset` never changes and initialization hangs while retaining its lock and staging state.

**Fix:** Require forward progress and fail closed, mirroring `read()`.

```ts
while (offset < bytes.length) {
  const written = writeSync(descriptor, bytes, offset, bytes.length - offset);
  if (written <= 0) containment("CHANGED: file descriptor made no write progress");
  offset += written;
}
```

---

_Reviewed: 2026-08-29T13:00:32Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
