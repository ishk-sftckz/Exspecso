---
phase: 01-initialize-canonical-projects
plan: 08
subsystem: filesystem-transaction-recovery
tags: [typescript, node, atomic-ownership, recovery, vitest]
requires:
  - phase: 01-07
    provides: canonical direct-edit validation before mutation
provides:
  - one token-bound ownership lease shared by init writers and recovery
  - conservative stale-owner and private-candidate reclamation
  - deterministic process-kill and ownership-race integration evidence
affects: [01-09 containment repair, phase-01-reverification, filesystem recovery]
actuals:
  tokens: 9471
  tasks: 2
  commits: 5
tech-stack:
  added: []
  patterns:
    - non-empty UUID-recorded owner directories published by rename
    - token-specific non-recursive cleanup after fresh inspection
    - barrier-controlled interprocess recovery tests with asserted child exit
key-files:
  created: []
  modified:
    - src/filesystem/ownership.ts
    - src/filesystem/transaction.ts
    - src/filesystem/recovery.ts
    - src/init/run-init.ts
    - tests/integration/transaction-recovery.test.ts
key-decisions:
  - "Recovery, standalone transactions, and runInit share the same lease; only the outer owner releases it."
  - "Only a sole, complete, UUID-matched dead record is reclaimable; legacy, partial, unreadable, changed, or unexpected evidence remains diagnostic."
  - "External interruption tests keep a real event-loop handle alive and assert SIGKILL exit before recovery."
requirements-completed: []
coverage:
  - id: D1
    description: "A live writer wins against direct recovery and a competing init after the initial idle observation."
    requirement: "SETUP-06"
    verification:
      - kind: integration
        ref: "tests/integration/transaction-recovery.test.ts#ownership race tests"
        status: pass
    human_judgment: false
  - id: D2
    description: "Stale reclaimers, legacy markers, partial candidates, and unexpected owner entries fail closed or clean only identified dead evidence."
    requirement: "ART-07"
    verification:
      - kind: integration
        ref: "tests/integration/transaction-recovery.test.ts#ownership recovery boundaries"
        status: pass
    human_judgment: false
  - id: D3
    description: "Killed-child ownership and promotion boundaries recover to the minimal canonical tree."
    requirement: "ART-09"
    verification:
      - kind: integration
        ref: "npm test -- --run tests/integration/transaction-recovery.test.ts tests/integration/minimal-artifacts.test.ts tests/integration/validation-errors.test.ts"
        status: pass
    human_judgment: false
duration: 20min
completed: 2026-08-27
status: complete
---

# Phase 01 Plan 08: Atomic Ownership Recovery Summary

**One token-bound, atomically published init lease now protects writers and recovery, with conservative stale cleanup and deterministic interprocess evidence.**

## Performance

- **Duration:** 20min
- **Completed:** 2026-08-27T16:54:08Z
- **Tasks:** 2/2
- **Files modified:** 5 production/test files

## Accomplishments

- Serialized `runInit`, direct recovery, and standalone transactions through a shared UUID-recorded owner directory.
- Preserved live-writer state across direct recovery and stale-observation races; recovery reports busy instead of removing evidence.
- Reclaimed only complete, positively identified dead private candidates after publishing a lease; legacy, partial, unreadable, and unexpected ownership evidence remains preserved and diagnostic.
- Made interruption tests wait for actual `SIGKILL` child exit at ownership-publication and promotion barriers.

## Task Commits

1. **Task 1: Serialize a real writer and recovery through one owned lease** — `1c8a38e` (RED), `8a3b0f5` (GREEN)
2. **Task 2: Make stale-owner acquisition and cleanup safe under competing recovery** — `b47b7df`, `32ad719` (RED coverage), `4c55690` (GREEN)

## Verification

- `npm run build` — passed.
- `npm test -- --run tests/integration/transaction-recovery.test.ts -t "competing stale reclaimers|killed process|legacy regular|partial candidates|live PID|complete dead private candidate|externally killed"` — 7 passed.
- `npm test -- --run tests/integration/transaction-recovery.test.ts tests/integration/minimal-artifacts.test.ts tests/integration/validation-errors.test.ts` — 25 passed.
- `npm test -- --run` — 8 files, 62 tests passed.

## Decisions Made

- A stale reclaimer may remove only the exact UUID-named record it revalidated; `rmdir` is non-recursive, so it cannot remove a newly published owner directory.
- Complete dead private candidates are cleaned only after an acquired lease exists. Partial or changed candidates remain evidence and return ambiguity.
- Test synchronization uses a live timer so a child cannot report success before the harness observes and kills it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Made external kill barriers retain a live event-loop handle**
- **Found during:** Task 2 GREEN verification
- **Issue:** A pending Promise without active handles allowed the child process to exit with code 0, weakening the process-interruption test.
- **Fix:** Kept the test-only wait barrier alive with an interval and asserted `SIGKILL` exit before recovery.
- **Files modified:** `src/filesystem/ownership.ts`, `src/filesystem/transaction.ts`, `tests/integration/transaction-recovery.test.ts`
- **Commit:** `4c55690`

**2. [Rule 2 - Missing Critical Functionality] Clean complete dead private ownership candidates only under a held lease**
- **Found during:** Task 2 RED coverage
- **Issue:** A complete, UUID-matched dead private candidate blocked future acquisition forever even though it could be identified safely.
- **Fix:** Reinspect and non-recursively remove only complete dead candidates after lease publication; preserve every partial, live, unreadable, or changed candidate.
- **Files modified:** `src/filesystem/ownership.ts`, `tests/integration/transaction-recovery.test.ts`
- **Commit:** `4c55690`

## Known Stubs

None.

## Remaining Obligations

- This plan repairs and tests CR-02 behavior, but CR-02 remains pending independent phase re-verification.
- CR-03 / ART-07 pathname-containment repair remains unimplemented and requires the separate 01-09 native-provider/platform approval.
- Phase closure remains blocked on 01-09, 01-10, real-TTY UAT, required acknowledgements, security audit, and independent re-verification; no Phase 01 requirement is marked complete here.

## Self-Check: PASSED

All declared production/test files and the five Task commits exist in Git history.
