---
phase: 01-initialize-canonical-projects
reviewed: 2026-08-27T08:20:51Z
depth: standard
files_reviewed: 31
files_reviewed_list:
  - .gitignore
  - package.json
  - tsconfig.json
  - vitest.config.ts
  - src/adapters/managed-file.ts
  - src/adapters/registry.ts
  - src/artifacts/resolve.ts
  - src/artifacts/schema.ts
  - src/artifacts/templates.ts
  - src/artifacts/validate.ts
  - src/cli/arguments.ts
  - src/cli/main.ts
  - src/errors/diagnostic.ts
  - src/filesystem/git-root.ts
  - src/filesystem/recovery.ts
  - src/filesystem/safe-path.ts
  - src/filesystem/transaction.ts
  - src/init/completion.ts
  - src/init/plan.ts
  - src/init/run-init.ts
  - src/init/runtime-selection.ts
  - tests/helpers/git-fixture.ts
  - tests/helpers/run-cli.ts
  - tests/integration/init-codex-tracer.test.ts
  - tests/integration/init-rerun.test.ts
  - tests/integration/minimal-artifacts.test.ts
  - tests/integration/transaction-recovery.test.ts
  - tests/integration/validation-errors.test.ts
  - tests/unit/adapters.test.ts
  - tests/unit/artifacts.test.ts
  - tests/unit/runtime-selection.test.ts
findings:
  critical: 3
  warning: 0
  info: 0
  total: 3
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-08-27T08:20:51Z
**Depth:** standard
**Files Reviewed:** 31
**Status:** issues_found

## Summary

The Phase 01 source, CLI, transaction/recovery paths, and test coverage were reviewed at standard depth. Three ship-blocking defects remain: invalid JSON artifact relationships bypass validation, recovery can destroy an active transaction, and the promotion path can be raced into following a symlink outside the repository. The focused test run passes despite these uncovered cases.

## Critical Issues

### CR-01: Invalid JSON IDs and parents are silently discarded

**Classification:** BLOCKER

**File:** `src/artifacts/resolve.ts:106-111`, `src/artifacts/validate.ts:72-98`

**Issue:** `jsonDefinition()` accepts a valid `id` but converts an invalid `parent` to `undefined`; an invalid JSON `id` makes the entire document disappear from the index. `validateRawArtifactIds()` only inspects Markdown, so `validateProject()` returns no diagnostic and `runInit()` proceeds with a malformed canonical relationship. This violates the required closed D-20 ID vocabulary and fail-closed direct-edit validation.

**Reproduction:** In an otherwise empty temporary Git fixture, write `.exspecso/definition.json` containing `{"id":"SPEC-001","parent":"REQUIREMENT-001"}`. Calling `validateProject(root)` returns `[]`; it must report `EXSPECSO_ARTIFACT_INVALID_ID` for the parent and block init.

**Fix:** Validate declared `id` and `parent` fields before building definitions for both JSON and frontmatter. Preserve invalid declarations as diagnostics rather than coercing them to absence. For example, have the scanner return parse diagnostics alongside definitions, then aggregate them in `validateProject()`:

```ts
if (typeof record.parent === "string" && parseArtifactId(record.parent) === null) {
  diagnostics.push(invalidArtifactId(path, "parent", record.parent));
}
```

### CR-02: Recovery can delete a live transaction after a non-atomic busy check

**Classification:** BLOCKER

**File:** `src/init/run-init.ts:50-54`, `src/filesystem/recovery.ts:102-131`

**Issue:** `runInit()` checks the lock and then invokes recovery without acquiring a recovery lock. A writer can acquire its lock after line 50 but before line 54. Recovery then treats that writer's fully staged, pre-promotion journal as interrupted, removes its staging directory and `.init.lock`, and returns `recovered`; the live writer subsequently fails when copying its deleted staged file. This breaks the exclusive writer/busy-reader contract and permits a competing invocation to interfere with an in-progress initialization.

**Reproduction:** Hold `commitTransaction()` at `onReadyToPromote`, then call `recoverInterruptedTransaction(root)`. It returns `{ kind: "recovered" }` while the writer still owns the lock; releasing the writer yields `failed` with `ENOENT` for its staged source. This was reproduced in an isolated temporary Git fixture.

**Fix:** Serialize recovery and transaction startup with one ownership protocol. Recovery must atomically acquire the same guard before inspecting or deleting staging; if a live owner exists, return busy. Handle stale-lock takeover atomically and retain ownership until recovery or the subsequent transaction completes. Add a race test that starts the writer between the initial busy observation and recovery acquisition.

### CR-03: A symlink swap after validation can redirect promotion outside the repository

**Classification:** BLOCKER

**File:** `src/filesystem/safe-path.ts:38-67`, `src/filesystem/transaction.ts:231-236`

**Issue:** The code checks every existing segment with `lstat()`, then later calls `copyFile(source, destination)`. There is no descriptor or atomic replacement binding those operations. A process with repository write access can replace the validated target or an ancestor with a symlink in that interval; `copyFile` follows a destination symlink and overwrites its referent outside the Git root. The static symlink test does not cover this time-of-check/time-of-use race.

**Reproduction:** Node's `copyFile()` follows a destination symlink: after creating `target -> outside`, copying `source` to `target` changed `outside` from `old` to `new`. Replacing a checked destination with that symlink between `assertSafeTarget()` and `copySynced()` reaches the same primitive at line 235.

**Fix:** Do not promote with a pathname-following copy after a separate safety check. Use an atomic replacement strategy that writes a temporary file within a verified directory and renames it into place (replacing a final symlink rather than following it), with a directory-handle/openat-style containment mechanism where the platform permits it. Revalidate and fail closed on any pathname change; add a deterministic swap hook test around promotion.

---

_Reviewed: 2026-08-27T08:20:51Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
