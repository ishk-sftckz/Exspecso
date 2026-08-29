---
phase: 01-initialize-canonical-projects
plan: 22
subsystem: filesystem safety and transaction recovery
tags: [typescript, node, transactions, recovery, windows, npm-package, vitest]
requires:
  - phase: 01-initialize-canonical-projects
    provides: schema-2 transaction recovery, root-scoped filesystem capabilities, and installed-package fixtures
provides:
  - Platform-independent slash-form transaction backup paths
  - Packaged CLI isolation from legacy EXSPECSO_TEST controls
  - Zero-progress synchronous-write failure and transaction lease release
affects: [Phase 1 independent verification, filesystem recovery, installed CLI]
actuals:
  tokens: 26187
  tasks: 3
  commits: 6
tech-stack:
  added: []
  patterns: [test-only child-process IPC, slash-form serialized paths, fail-closed synchronous writes]
key-files:
  created: [tests/helpers/killed-transaction-child.mjs, tests/integration/windows-journal-paths.test.ts]
  modified: [src/filesystem/transaction.ts, src/filesystem/ownership.ts, src/filesystem/contained-fs.ts, tests/integration/transaction-recovery.test.ts, tests/integration/installed-cli.test.ts, tests/unit/root-scoped-fs.test.ts]
key-decisions:
  - "Killed-process coordination is test-only Node IPC; shipped modules have no environment-driven test controls."
  - "Journal backup paths are slash-form serialized data, while host filesystem paths retain node:path joins."
  - "A synchronous write that makes no progress fails closed before retrying and preserves the containment error code."
patterns-established:
  - "Process interruption tests use build-excluded helpers with structured IPC and parent-owned termination."
  - "Serialized transaction paths use validated slash components independently of the host separator."
requirements-completed: [SETUP-07, ART-07]
coverage:
  - id: D1
    description: Installed CLI ignores all legacy EXSPECSO_TEST controls and cannot write caller-selected signals or hang.
    requirement: ART-07
    verification:
      - kind: integration
        ref: tests/integration/installed-cli.test.ts#ignores the complete legacy EXSPECSO_TEST environment family
        status: pass
    human_judgment: false
  - id: D2
    description: Additive transactions retain parseable slash-form backup paths and recover the confirmed prior project on Windows-style separators.
    requirement: SETUP-07
    verification:
      - kind: integration
        ref: tests/integration/windows-journal-paths.test.ts#uses slash-form backup data through additive interruption recovery while rejecting backslash journals
        status: pass
    human_judgment: false
  - id: D3
    description: Zero-progress descriptor writes fail closed and release an internally acquired transaction lease.
    requirement: ART-07
    verification:
      - kind: unit
        ref: tests/unit/root-scoped-fs.test.ts#fails a preparation journal with no write progress and releases its internally owned lease
        status: pass
    human_judgment: false
duration: 5min
completed: 2026-08-29
status: complete
---

# Phase 01 Plan 22: Filesystem Gap Closure Summary

**Pure TypeScript/Node transaction recovery now serializes slash-form journal paths, isolates killed-process control to tests, and fails closed on stalled writes.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-08-29T13:48:19Z
- **Completed:** 2026-08-29T13:53:28Z
- **Tasks:** 3/3
- **Files modified:** 8

## Accomplishments

- Removed all shipped legacy `EXSPECSO_TEST_*` behavior; deterministic killed-child recovery now uses the build-excluded IPC helper.
- Stored persisted transaction `backupPath` values in slash form and covered interrupted additive recovery under mocked Windows joins.
- Rejected non-positive `writeSync()` progress with `EXSPECSO_CONTAINMENT_CHANGED` while retaining valid partial-write behavior and lease cleanup.

## Task Commits

1. **Task 1 RED: installed-package and IPC regression** — `233dff5`
2. **Task 1 GREEN: remove shipped transaction test controls** — `74ab529`
3. **Task 2 RED: Windows journal regression** — `1ed67b2`
4. **Task 2 GREEN: slash-form journal backup serialization** — `dc88b6a`
5. **Task 3 RED: zero-progress write regression** — `2846a71`
6. **Task 3 GREEN: zero-progress write guard** — `5304e8b`

## Verification

- `npm test -- --run tests/integration/transaction-recovery.test.ts tests/integration/installed-cli.test.ts` — passed (29 tests).
- `npm test -- --run tests/integration/windows-journal-paths.test.ts tests/integration/transaction-recovery.test.ts tests/integration/installed-cli.test.ts` — passed (30 tests).
- `npm test -- --run tests/unit/root-scoped-fs.test.ts tests/integration/transaction-recovery.test.ts` — passed (32 tests).
- `npm test -- --run` — passed (10 files, 90 tests).
- `npm run build` — passed.
- `npm pack --dry-run --json` — passed; 43 files and no test IPC helper.

## Files Created/Modified

- `src/filesystem/transaction.ts` — removes inherited environment controls and serializes backup journal data with `/`.
- `src/filesystem/ownership.ts` — removes external signal publication and test wait behavior.
- `src/filesystem/contained-fs.ts` — detects zero-progress descriptor writes before retrying the offset.
- `tests/helpers/killed-transaction-child.mjs` — IPC-only, unshipped transaction and ownership kill harness.
- `tests/integration/{transaction-recovery,installed-cli,windows-journal-paths}.test.ts` — killed-child, hostile-environment, and Windows journal proofs.
- `tests/unit/root-scoped-fs.test.ts` — zero-progress and partial-progress write coverage.

## Decisions Made

- Killed-process tests communicate exclusively over parent/child IPC; the CLI does not derive behavior from inherited test environment variables.
- `backupPath` is journal data and therefore uses slash separators irrespective of the host platform.
- No-progress synchronous writes are containment changes, matching the bounded descriptor-read failure contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Canonicalized the IPC child fixture root before importing compiled transaction code.**

- **Found during:** Task 1
- **Issue:** fixture paths can traverse a temporary-directory alias; the compiled child journal and `runInit()` recovery then used different root fingerprints.
- **Fix:** the test-only child resolves the real fixture root before building the transaction plan.
- **Files modified:** `tests/helpers/killed-transaction-child.mjs`
- **Verification:** all killed-process recovery tests pass.
- **Committed in:** `233dff5`

**Total deviations:** 1 auto-fixed (Rule 1)

## Known Stubs

None.

## Issues Encountered

None remaining. The RED cases exposed the intended packaged hook, Windows path, and zero-progress defects before their corresponding GREEN commits.

## TDD Gate Compliance

Each task has a deterministic failing `test(01-22)` commit followed by its `fix(01-22)` implementation commit.

## Next Phase Readiness

The Phase 1 filesystem gaps are closed with pure TypeScript/Node evidence. Independent Phase 1 verification remains the next gate; no publication, native scope, or real-TTY work was introduced.

## Self-Check: PASSED

All eight plan-owned source and test files exist, and all six RED/GREEN task commits are present in git history.
