---
phase: "01-initialize-canonical-projects"
plan: "14"
subsystem: "transaction promotion and recovery"
tags: [native, filesystem, containment, journal, recovery, transactions]
dependency_graph:
  requires: ["01-13"]
  provides: ["schema-2 write-ahead journal", "bound restartable restoration", "per-entry promotion evidence"]
  affects: ["01-15", "01-16", "01-17", "01-18"]
tech_stack:
  added: []
  patterns: ["schema-versioned operational evidence", "write-ahead in-flight transitions", "capability-bound restoration"]
key_files:
  created:
    - src/filesystem/journal.ts
  modified:
    - src/filesystem/transaction.ts
    - src/filesystem/recovery.ts
    - tests/integration/transaction-recovery.test.ts
decisions:
  - "Schema-2 journals record an in-flight operation before each replacement and retain per-entry prior/staged hashes rather than inferring a state from completedStep."
  - "Recovery accepts only modeled prior/staged observations, restores through held directory capabilities, and retains changed or unreadable evidence as ambiguous."
  - "A schema-1 journal is cleaned only when its untouched complete-prior evidence proves no replacement occurred; all other legacy records remain diagnostic."
metrics:
  duration: "~15 minutes"
  completed_date: "2026-08-28"
status: complete
actuals:
  tokens: 8627
  tasks: 2
  commits: 4
requirements-completed: [SETUP-06, SETUP-07, ART-01, ART-07, ART-08, ART-09]
coverage:
  - id: D1
    description: "Schema-2 promotion records write-ahead intent and preserves hard-link aliases through sibling replacement."
    requirement: ART-07
    verification:
      - kind: integration
        ref: "tests/integration/transaction-recovery.test.ts#records write-ahead promotion intent and leaves an external hard-link alias on the old inode"
        status: pass
    human_judgment: false
  - id: D2
    description: "Validated recovery restores modeled prior bytes with restartable bound operations."
    requirement: ART-08
    verification:
      - kind: integration
        ref: "tests/integration/transaction-recovery.test.ts#restores an in-flight schema-2 replacement and makes the next recovery a no-op"
        status: pass
      - kind: integration
        ref: "npm test -- --run tests/integration/transaction-recovery.test.ts"
        status: pass
    human_judgment: false
---

# Phase 01 Plan 14: Restartable Promotion and Recovery Summary

Schema-2 transaction evidence now records every in-flight promotion before mutation and restores validated prior artifacts through held directory capabilities without truncating hard-linked targets.

## Task Commits

1. **Promote every output with restartable write-ahead evidence**
   - `22f53ac` — failing write-ahead promotion and hard-link test
   - `d13e300` — schema-2 journal and bound promotion transitions
2. **Restore the validated prior set through bound restartable operations**
   - `f641fee` — failing in-flight recovery restart test
   - `ce347b2` — strict bound recovery, legacy disposition, and safe cleanup

## Verification

- `npm run build` — passed.
- `npm test -- --run tests/integration/transaction-recovery.test.ts -t "promotion|journal|hard link"` — 18 passed.
- `npm test -- --run tests/integration/transaction-recovery.test.ts -t "restore|recovery|killed"` — 4 passed.
- `npm test -- --run tests/integration/transaction-recovery.test.ts` — 19 passed, including an observed `SIGKILL` child exit before recovery.
- The default Node 20.19.5 `npm test -- --run` invocation failed only in six unrelated packed-native setup cases that pass a deliberately absent `missing-approved-headers` path to `native/build.mjs`. The phase orchestrator will rerun the declared Plan 20 Node 25.2.1 canonical local gate against this final commit; this plan did not alter the runner or release gate.

## Red/Green Transition Inventory

- Promotion: `prepared` → `promoting/inFlight=replace` → replacement → `promoting/completedPromotions` → `cleaning`.
- Recovery: validated `promoting` evidence → `restoring/inFlight=restore|remove` → `cleaning` → identified cleanup.
- An in-flight replacement accepts only the exact prior or staged hash; any third value remains ambiguous and untouched.

## Legacy Journal Disposition

Schema-1 evidence is accepted for cleanup only when `completedStep === -1` and every current artifact, staged copy, and backup proves the untouched prior state. Any legacy replacement gap remains on disk with an actionable ambiguity result.

## Actual Kill Oracle

The integration helper waits for the external child `exit` event and asserts `{ code: null, signal: "SIGKILL" }` before starting the next-process recovery. Windows-specific successful-termination/observed-exit evidence remains in the later matrix work.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 1 - Bug] Preserve containment failures as recovery ambiguity**
   - **Found during:** Task 2 focused verification.
   - **Issue:** A substituted staged file surfaced a native containment error instead of returning an ambiguity result.
   - **Fix:** Recovery now reports that bound evidence cannot be read and retains it, without falling back to lexical or pathname validation.
   - **Files modified:** `src/filesystem/recovery.ts`
   - **Commit:** `ce347b2`

## Known Stubs

None.

## Self-Check: PASSED

- `src/filesystem/journal.ts`, `src/filesystem/transaction.ts`, `src/filesystem/recovery.ts`, and `tests/integration/transaction-recovery.test.ts` exist.
- Task commits `22f53ac`, `d13e300`, `f641fee`, and `ce347b2` exist in git history.
