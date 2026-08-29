---
phase: 01-initialize-canonical-projects
reviewed: 2026-08-29T09:12:46Z
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
  warning: 2
  info: 0
  total: 4
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-08-29T09:12:46Z
**Depth:** standard
**Files Reviewed:** 30
**Status:** issues_found

## Summary

The TypeScript initializer, transaction/recovery paths, packaging surface, retained native material, and selected tests were reviewed. `npm run build` and the active Vitest suite pass (79 tests), but the transaction state machine has an unrecoverable crash window and the Node filesystem provider can spin forever if a file changes while it is read. The ownership and public-install documentation also have correctness gaps.

## Critical Issues

### CR-01: A failure before the first journal write permanently blocks recovery

**Classification:** BLOCKER

**File:** `src/filesystem/transaction.ts:217-250`; `src/filesystem/recovery.ts:150-152`

**Issue:** The transaction creates the staging directory and stages bytes, then creates destination parent directories at lines 243-248, but writes its first journal only at line 250. A crash or ordinary error in that interval leaves a nonempty `.exspecso/.staging/<id>` with no `journal.json`. Every subsequent init treats this as ambiguous evidence and refuses recovery. This is reachable today: if a target ancestor becomes a symlink after the initial safe-path check, the parent capture fails after staging and before `updateJournal`; recovery returns `transaction journal is unreadable` indefinitely. The existing test at `transaction-recovery.test.ts:145-162` reaches the same pre-journal failure state but does not attempt recovery.

**Fix:** Persist a recoverable preparation record before any staged or destination-side mutation, and extend the journal state model to distinguish an incomplete preparation from a prepared transaction. Recovery must be able to validate and remove that record (and only its identified staging entries) when no promotion could have occurred. Add an interruption test for every pre-journal boundary, including target-parent acquisition.

### CR-02: Concurrent truncation can make init spin indefinitely

**Classification:** BLOCKER

**File:** `src/filesystem/contained-fs.ts:141-145`

**Issue:** `read()` allocates from the initial `fstat` size and repeatedly adds `readSync`'s return value. If another process truncates the file after `fstatSync` and before all reads complete, `readSync` returns `0` at EOF. `offset` then never advances, so the synchronous loop never exits. Init reads repository-controlled files before it can report a stale preimage, so this can wedge the CLI rather than returning a containment or precondition error.

**Fix:** Reject a zero-byte read before the expected length has been consumed, and verify the descriptor's final size/identity before returning. For example:

```ts
const count = readSync(descriptor, bytes, offset, bytes.length - offset, offset);
if (count === 0) containment("CHANGED: file changed while reading");
offset += count;
```

Add a test that truncates a file between the size observation and a subsequent read.

## Warnings

### WR-01: PID reuse can turn a dead lock into an indefinite busy state

**Classification:** WARNING

**File:** `src/filesystem/ownership.ts:64`

**Issue:** Lock liveness is derived solely from `process.kill(record.pid, 0)`. Once the initializer dies, the OS may reuse its PID for an unrelated live process. The stale lock will then be classified as `busy` and cannot be reclaimed until that unrelated process exits, despite no initialization being active.

**Fix:** Record and validate process-start identity in addition to PID (using a platform-specific start time when available), or use an expiring lease with conservative renewal and an explicit stale-age policy. Exercise the stale-reclaim path with a deliberately mismatched process identity.

### WR-02: The documented npx invocation cannot be delivered by this package

**Classification:** WARNING

**File:** `README.md:13-15`; `package.json:4`

**Issue:** The README presents `npx exspecso init` as the normal initializer command, but `package.json` marks the package `private: true`, which prevents publishing it to npm. The same README later says Phase 1 does not publish or release a package. A reader following the documented command cannot obtain this package from npm.

**Fix:** Until publication is authorized, document a local invocation such as `npm exec -- exspecso init ...` after installation from a checkout/tarball, or remove the `npx` example. When publishing is in scope, remove `private`, publish the package, and verify the exact README command against a registry install.

---

_Reviewed: 2026-08-29T09:12:46Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
