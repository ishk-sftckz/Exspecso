---
phase: 01-initialize-canonical-projects
plan: 21
subsystem: filesystem safety
tags: [typescript, node, filesystem, recovery, vitest]
requires:
  - phase: 01-18
    provides: pure TypeScript/Node initializer and active compatibility baseline
provides:
  - write-ahead transaction preparation with bounded pre-promotion recovery
  - bounded descriptor reads that reject truncation and final-stat changes
affects: [phase-verification, transaction-recovery, canonical-artifacts]
tech-stack:
  added: []
  patterns:
    - durable preparing journal before any staged or destination-side mutation
    - descriptor reads validate progress and final identity, type, and size
key-files:
  created: []
  modified:
    - src/filesystem/journal.ts
    - src/filesystem/transaction.ts
    - src/filesystem/recovery.ts
    - src/filesystem/contained-fs.ts
    - tests/integration/transaction-recovery.test.ts
    - tests/unit/root-scoped-fs.test.ts
key-decisions:
  - "Use a schema-2 preparing state as the exclusive proof that transaction recovery may remove declared pre-promotion debris."
  - "Fail FileCapability reads closed on zero progress and any final descriptor type, identity, or size mismatch."
patterns-established:
  - "Recovery cleanup is permitted only after validating journal state, declared inventory, hashes, and unchanged canonical preimages."
  - "Synchronous descriptor reads retain bigint stat identity and validate it again before exposing bytes."
requirements-completed: [ART-07]
coverage:
  - id: D1
    description: "Interrupted transaction preparation preserves the prior artifact set and removes only positively identified pre-promotion evidence."
    requirement: ART-07
    verification:
      - kind: integration
        ref: "tests/integration/transaction-recovery.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Repository reads terminate conservatively when the opened descriptor is truncated or changes after the initial stat."
    requirement: ART-07
    verification:
      - kind: unit
        ref: "tests/unit/root-scoped-fs.test.ts"
        status: pass
    human_judgment: false
metrics:
  duration: 17min
  completed: 2026-08-29
status: complete
actuals:
  tokens: 5305
  tasks: 2
  commits: 4
---

# Phase 01 Plan 21: Filesystem Safety Gap Closure Summary

**Write-ahead transaction preparation and descriptor-bound reads now recover only identified pre-promotion debris and fail closed when a repository file changes during reading.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-08-29T19:36:30+07:00
- **Completed:** 2026-08-29T19:53:31+07:00
- **Tasks:** 2/2
- **Files modified:** 6
- **Actual implementation size:** 21,218 changed diff characters / 4 = 5,305 tokens

## Accomplishments

- Added the schema-2 `preparing` journal state and write-ahead ordering before staged bytes, backups, or destination-parent mutation; recovery accepts only validated declared pre-promotion inventory and preserves ambiguity evidence.
- Added deterministic recovery regressions for both pre-journal preimage failure and target-parent acquisition failure, while retaining unknown evidence as ambiguous.
- Bounded `FileCapability.read()` by rejecting zero-progress reads before its observed length and revalidating the descriptor's device, inode, regular-file kind, and size before it returns bytes.

## Task Commits

1. **Task 1 RED: Add failing preparation recovery tests** — `7893861` (`test`)
2. **Task 1 GREEN: Make transaction preparation recoverable** — `562470f` (`feat`)
3. **Task 2 RED: Add failing bounded read tests** — `c41b830` (`test`)
4. **Task 2 GREEN: Bound descriptor reads** — `11fb9e6` (`feat`)

## Files Created/Modified

- `src/filesystem/journal.ts` — recognizes a validated `preparing` transaction state.
- `src/filesystem/transaction.ts` — persists preparation authority before any stage or destination mutation.
- `src/filesystem/recovery.ts` — removes only strictly declared, hash-validated pre-promotion evidence.
- `src/filesystem/contained-fs.ts` — rejects zero-progress reads and final descriptor changes.
- `tests/integration/transaction-recovery.test.ts` — proves recoverable early failures and preserves ambiguous evidence.
- `tests/unit/root-scoped-fs.test.ts` — deterministically proves truncation and final-stat rejection.

## Verification

- Task 1 RED: `npm test -- --run tests/integration/transaction-recovery.test.ts` — expected failures before preparation recovery existed.
- Task 1 GREEN: focused recovery suite — PASS (25 tests); `npm run build` — PASS; full suite — PASS (83 tests at checkpoint).
- Task 2 RED: `npm test -- --run tests/unit/root-scoped-fs.test.ts` — expected two failures: zero-progress loop guard and missing final-stat revalidation.
- Task 2 GREEN: `npm test -- --run tests/unit/root-scoped-fs.test.ts` — PASS (5 tests); `npm run build` — PASS; `npm test -- --run` — PASS (9 files, 86 tests).

## Decisions Made

- A valid `preparing` journal proves promotion has not begun, but recovery remains inventory-, hash-, preimage-, and state-bounded before cleanup.
- Descriptor reads use the initial bigint descriptor stat as the requested byte contract and refuse both lack of read progress and any changed final descriptor state.
- D-21 remains unchanged: this is a pure TypeScript/Node implementation; host permissions and sandboxes remain the OS boundary, without kernel-level or hostile-same-user containment claims.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Tracking state] Correct stale phase handoff metadata after the prescribed state advance**
- **Found during:** Plan close-out
- **Issue:** The state helper read a stale `Plan: 1 of 21` handoff and displayed `Plan: 2 of 21`, although all 21 plan summaries now exist. It also retained obsolete 20-plan wording.
- **Fix:** Preserved the helper's metric, decision, session, roadmap, and requirement updates, then restored the human-readable state to 21/21 implementation-complete with independent Phase 1 verification as the next gate.
- **Files modified:** `.planning/STATE.md`, `01-21-SUMMARY.md`
- **Verification:** `init.execute-phase` reports 21 plans with 21 summaries, and the roadmap reports 21/21 In Progress.

**Total deviations:** 1 auto-fixed (1 Rule 1 tracking-state correction).
**Impact on plan:** Preserves the required independent verification gate and prevents a stale counter from directing another implementation plan.

## Issues Encountered

- The first full Task 2 verification run hit the existing killed-child recovery test while it read a partially written test signal. Its focused suite then passed (25 tests), and the immediate complete-suite rerun passed (86 tests) without code changes.

## TDD Gate Compliance

Both tasks followed RED then GREEN commits: Task 1 (`7893861` → `562470f`) and Task 2 (`c41b830` → `11fb9e6`). Each RED test produced the expected failing behavior before its production edit.

## Known Stubs

None.

## Next Phase Readiness

- Both independent verifier filesystem blockers are addressed with deterministic regressions and fresh full-suite evidence.
- This summary does not alter the independent verification report or claim Phase 1 complete; the remaining review and closure workflow owns that decision.

## Self-Check

PASSED

- Verified the summary file and all four Task 1/Task 2 RED/GREEN commits exist in Git history.
- Verified all six declared task files exist and the final focused, build, and full-suite commands passed.
