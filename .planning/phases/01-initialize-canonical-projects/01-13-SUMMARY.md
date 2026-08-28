---
phase: "01-initialize-canonical-projects"
plan: "13"
subsystem: "contained filesystem ownership and transaction staging"
tags: [native, filesystem, containment, ownership, transactions, recovery]
dependency_graph:
  requires: ["01-12", "01-20"]
  provides: ["held-directory ownership leases", "bound transaction staging", "promotion-boundary containment evidence"]
  affects: ["01-14", "01-15", "01-16", "01-17", "01-18"]
tech_stack:
  added: []
  patterns: ["capability-bound directory mutation", "exclusive directory publication", "private journal replacement", "test-only native operation boundary"]
key_files:
  created: []
  modified:
    - native/contained-fs.cc
    - native/contained-fs-posix.cc
    - native/contained-fs-win.cc
    - src/filesystem/contained-fs.ts
    - src/filesystem/ownership.ts
    - src/init/run-init.ts
    - src/filesystem/transaction.ts
    - tests/integration/transaction-recovery.test.ts
decisions:
  - "Ownership retains root, operational, and lock directory capabilities through acquisition and release rather than mutating repository paths."
  - "Staged files, backups, and journals are read and written through held capabilities; journal replacement uses a private sibling file."
  - "The native replacement barrier is armed only for the actual promotion operation, whose destination parents are held before the barrier."
metrics:
  duration: "~55 minutes"
  completed_date: "2026-08-28"
status: complete
actuals:
  tokens: 16009
  tasks: 2
  commits: 5
---

# Phase 01 Plan 13: Bound Ownership and Staging Summary

Bound native directory capabilities now govern initialization ownership, transaction staging, and final promotion, preventing later path substitution from redirecting a held operation.

## Task Commits

1. **Bound ownership publication**
   - `0901260` — failing ownership containment regression
   - `5e660fb` — native exclusive publication and capability-bound ownership lease
2. **Bound staging and promotion**
   - `07c8536` — failing bound staging regression
   - `79dc745` — capability-bound stage, backup, journal, and staged validation flow
   - `f7de935` — hold promotion parents and expose the precise native replacement boundary

## Verification

- `npm test -- --run tests/integration/transaction-recovery.test.ts` — 17 passed.
- `npm test -- --run tests/integration/init-codex-tracer.test.ts -t 'native (leaf|parent|ancestor) substitution' --testTimeout 60000` — 3 passed.
- `npm run build` — passed.
- Built the local `ENV-MA25` release provider from checksum-verified Node 20.19.0 headers; the packed native tracer exercised leaf, parent, and ancestor substitution without changing the external sentinel.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 1 - Bug] Preserve held authority after the native promotion boundary**
   - **Found during:** Task 2 verification
   - **Issue:** A path-based target revalidation re-opened an attacker-substituted parent after the test barrier, defeating the approved held-object relocation behavior.
   - **Fix:** Hold all promotion parent capabilities before the boundary and arm the native test barrier only for the final promotion replacement.
   - **Files modified:** `native/contained-fs.cc`, `native/contained-fs-posix.cc`, `native/contained-fs-win.cc`, `src/filesystem/contained-fs.ts`, `src/filesystem/transaction.ts`
   - **Commit:** `f7de935`

## Known Stubs

None.

## Self-Check: PASSED

- All declared implementation and integration-test files exist.
- Task commits `0901260`, `5e660fb`, `07c8536`, `79dc745`, and `f7de935` are present in git history.
