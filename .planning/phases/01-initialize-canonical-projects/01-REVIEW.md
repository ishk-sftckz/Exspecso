---
phase: 01-initialize-canonical-projects
reviewed: 2026-09-05T06:06:53Z
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
  warning: 3
  info: 0
  total: 3
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-09-05T06:06:53Z
**Depth:** standard
**Files Reviewed:** 34
**Status:** issues_found

## Summary

The committed Node package correctly emits exactly `Exspecso initialized successfully.\n` only after a committed or no-op transaction. The formatter is selection-independent, while selected-subset adapter paths and adapter-native invocation metadata remain intact. Error, cancellation, conflict, busy, and recovery paths do not emit the success line.

The active suite, TypeScript build, and package inventory pass. Three warning-level defects remain: two active coverage-quality gaps and one dormant native capability-lifecycle bug in retained, unshipped historical material.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Runtime-selection test still supplies a deleted API field

**File:** `/Users/ishk.sftckz/Projects/exspecso/tests/unit/runtime-selection.test.ts:83-90`
**Issue:** The test passes `detectedAgents`, which is not part of `ResolveSelectedAgentsInput` and is ignored at runtime because Vitest transpiles tests without type-checking them. This stale fixture masks accidental reintroduction of detection behavior and leaves the test inconsistent with the detection-free selection contract.
**Fix:** Remove `detectedAgents: []` from the fixture and enable test type-checking or a focused compile check that includes test sources.

### WR-02: The aggregate D-20 rejection/no-mutation regression is outside routine CI

**File:** `/Users/ishk.sftckz/Projects/exspecso/vitest.config.ts:6-13`
**Issue:** `tests/integration/validation-errors.test.ts` is excluded from the default Vitest run. Its aggregate regression at `tests/integration/validation-errors.test.ts:169-198` is therefore not exercised by the `npm test -- --run` command used in CI, allowing invalid-ID aggregation or its no-mutation guarantee to regress undetected.
**Fix:** Remove `tests/integration/validation-errors.test.ts` from `exclude`, or add a separate CI step that runs this file with a configuration that does not exclude it.

### WR-03: Native finalization does not revoke descendant capabilities

**File:** `/Users/ishk.sftckz/Projects/exspecso/native/contained-fs.cc:61`
**Issue:** The N-API finalizer deletes a root `Handle` without calling `contained::close()`. The `Handle` destructor closes only its own descriptor; it does not set the shared root authority inactive (that happens in the POSIX and Windows `close()` implementations). A retained child handle can consequently remain usable after its root wrapper is garbage-collected. This code is historical and excluded from the shipped TypeScript/Node package, so it is not a V1 release blocker, but it would violate the native capability lifecycle if the path is reactivated.
**Fix:** Make the finalizer revoke authority before deletion, while suppressing finalizer-time errors:

```cpp
void finalize(napi_env, void* data, void*) {
  auto* handle = static_cast<contained::Handle*>(data);
  try { contained::close(*handle); } catch (...) {}
  delete handle;
}
```

---

_Reviewed: 2026-09-05T06:06:53Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
