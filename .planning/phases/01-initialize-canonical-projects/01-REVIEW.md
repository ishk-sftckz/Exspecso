---
phase: 01-initialize-canonical-projects
reviewed: 2026-08-29T13:58:58Z
depth: standard
files_reviewed: 32
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
  - tests/helpers/killed-transaction-child.mjs
  - tests/helpers/package-fixture.ts
  - tests/integration/init-codex-tracer.test.ts
  - tests/integration/init-typescript-tracer.test.ts
  - tests/integration/installed-cli.test.ts
  - tests/integration/transaction-recovery.test.ts
  - tests/integration/windows-journal-paths.test.ts
  - tests/unit/adapters.test.ts
  - tests/unit/containment-support.test.ts
  - tests/unit/root-scoped-fs.test.ts
  - tests/unit/runtime-selection.test.ts
  - vitest.config.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-08-29T13:58:58Z
**Depth:** standard
**Files Reviewed:** 32
**Status:** issues_found

## Summary

The active TypeScript package, transaction/recovery flow, installed-package boundary, CI surface, and Phase 01 test scope were reviewed. The previous findings are closed: Plan 01-22 serializes backup journal paths with `/`, removes the shipped `EXSPECSO_TEST_*` controls, and rejects zero-progress synchronous writes. The active replacement containment layer still fails its Windows component-validation contract, however; it accepts names that Windows resolves as devices, alternate data streams, or normalized aliases.

`npm run build`, `npm test -- --run` (10 files, 90 tests), and `npm pack --dry-run --json` passed locally. The passing active suite does not cover this Windows path validation behavior: the older direct containment test that enumerates the affected names is excluded by `vitest.config.ts` as historical material.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Windows-reserved and alternate-stream names bypass component containment

**Classification:** BLOCKER

**File:** `/Users/ishk.sftckz/Projects/exspecso/src/filesystem/contained-fs.ts:30-34`

**Issue:** `component()` only rejects empty, dot, slash, backslash, and NUL segments. It accepts Windows-special values such as `ordinary:secret`, `CON`, `NUL.txt`, `COM1`, `tail.`, and `tail `. The subsequent `node:path.join()` and `node:fs` operations therefore let the shipped `DirectoryCapability` address an NTFS alternate data stream, a DOS device, or a Windows-normalized alias instead of one canonical repository entry. This breaks the module's stated root-and-relative-component containment boundary and can cause hidden data mutation or non-file device I/O on a supported Windows runtime. The formerly used native validator explicitly rejected these forms, but the active TypeScript implementation does not.

**Fix:** Apply a cross-platform Windows-safe component validator before every filesystem operation, including colon and other prohibited Windows characters, trailing spaces/dots, DOS device names (also extension and Unicode superscript aliases), control characters, and an appropriate component-length bound. Restore this as an active cross-platform test rather than leaving `tests/unit/contained-fs.test.ts` excluded.

```ts
function component(name: string): void {
  const device = name.split(".", 1)[0]?.toUpperCase();
  const reserved = /^(?:CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³])$/u;
  if (
    typeof name !== "string" || name.length === 0 || name.length > 255 ||
    name === "." || name === ".." || /[\\/:<>"|?*\0-\x1f]/.test(name) ||
    name.endsWith(".") || name.endsWith(" ") || reserved.test(device ?? "")
  ) {
    containment("INVALID: every path segment must be a portable file-name component");
  }
}
```

---

_Reviewed: 2026-08-29T13:58:58Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
