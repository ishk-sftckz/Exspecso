---
phase: 01-initialize-canonical-projects
plan: 06
subsystem: filesystem
tags: [node, typescript, filesystem, transaction, recovery, sha256, integration-tests]
requires:
  - phase: 01-05
    provides: immutable init plans with expected preimages and selected adapter targets
provides:
  - contained, exclusive, journaled init transactions
  - hash-validated conservative interrupted-transaction recovery
  - D-19 process-level fault matrix at every promotion target
affects: [init, canonical-artifacts, recovery, validation]
actuals:
  tokens: 11201
  tasks: 2
  commits: 3
tech-stack:
  added: []
  patterns: [repository-contained staging, durable journal step recording, fail-closed recovery]
key-files:
  created: [src/filesystem/safe-path.ts, src/filesystem/transaction.ts, src/filesystem/recovery.ts, tests/integration/transaction-recovery.test.ts, tests/integration/minimal-artifacts.test.ts]
  modified: [src/init/run-init.ts]
key-decisions:
  - "Retain staged and backup bytes until a successful transaction or validated recovery removes only the identified operational state."
  - "Recover the validated prior artifact set rather than inferring or accepting a mixed generation."
  - "D-19 evidence covers deterministic process interruption, injected exceptions, and externally killed CLI children on macOS APFS only; it makes no power-loss or universal-filesystem claim."
patterns-established:
  - "All init writes pass preflight containment, symlink, type, and expected-preimage checks before staging."
  - "In-progress transactions present a typed busy diagnostic to readers and competing writers."
requirements-completed: [SETUP-06, ART-01, ART-02, ART-07, ART-08, ART-09]
coverage:
  - id: D1
    description: "Contained exclusive transaction stages and promotes only validated init targets."
    requirement: ART-07
    verification:
      - kind: integration
        ref: tests/integration/transaction-recovery.test.ts#journaled init transaction
        status: pass
    human_judgment: false
  - id: D2
    description: "Interrupted transactions recover the prior valid set or fail closed when evidence is ambiguous."
    requirement: ART-07
    verification:
      - kind: integration
        ref: tests/integration/transaction-recovery.test.ts#recovery fault matrix
        status: pass
    human_judgment: false
  - id: D3
    description: "Fresh and repeated init persist only minimal canonical files and selected native adapters."
    requirement: SETUP-06
    verification:
      - kind: integration
        ref: tests/integration/minimal-artifacts.test.ts#minimal persistent initialization artifacts
        status: pass
    human_judgment: false
duration: 15min
completed: 2026-08-27
status: complete
---

# Phase 01 Plan 06: Contained Transaction and Recovery Summary

**Repository-contained, hash-validated init transactions recover a valid prior artifact set after every declared process-level promotion fault.**

## Performance

- **Duration:** 15 min
- **Tasks:** 2/2
- **Files modified:** 6
- **Baseline:** `npm run build && npm test -- --run` — 40 passing tests
- **Final:** `npm run build && npm test -- --run` — 48 passing tests; `npm pack --dry-run` passed

## Accomplishments

- Added safe target containment with traversal, external-path, symlink, unsupported-type, and preimage-drift rejection before staging.
- Replaced per-file init writes with an exclusive lock, same-repository staging, SHA-256 journal/backup evidence, deterministic promotion order, and completed-step recording.
- Added startup recovery that restores only a fully identified prior set, validates it, and preserves all evidence on ambiguity.
- Proved no-op, busy-reader/writer, tampering, minimal-tree, and D-19 interruption behavior in integration tests.

## D-19 Fault Matrix

Declared promotion order:

1. `.exspecso/exspecso.config.json`
2. `.exspecso/constitution.md`
3. `.agents/skills/exspecso-start/SKILL.md`

| Mode | Promotion targets | Result |
| --- | --- | --- |
| Injected exception | all 3 | journal-backed recovery restored the validated prior set |
| Controlled process interruption | all 3 | journal-backed recovery restored the validated prior set |
| Externally killed CLI child (`SIGKILL`) | all 3 | fresh init recovered the prior set, then completed cleanly |

The suite ran on macOS 26.5.1 (build 25F80) with APFS. It proves only these deterministic process-level modes. It does **not** claim physical power-loss durability or universal APFS, NTFS, ext4, or other filesystem guarantees.

## Task Commits

1. **Task 1: Commit one repository-contained mutation transaction** — `571a190` (`feat`)
2. **Task 2: Recover only clearly identified interrupted staging** — `addb538` (`feat`)

## Files Created/Modified

- `src/filesystem/safe-path.ts` — target containment, symlink, type, and preimage guard.
- `src/filesystem/transaction.ts` — staged journaled writer with lock and deterministic promotion points.
- `src/filesystem/recovery.ts` — conservative evidence validation and prior-set restoration.
- `src/init/run-init.ts` — active-transaction diagnostics and recovery before normal validation.
- `tests/integration/transaction-recovery.test.ts` — fault matrix, concurrency, tampering, and recovery evidence.
- `tests/integration/minimal-artifacts.test.ts` — exact minimal persistent-tree assertions.

## Decisions Made

- Use a repository-local `.exspecso/.init.lock` and `.exspecso/.staging/<transaction-id>` solely as temporary operational state.
- Restore the prior set after a validated interruption rather than promote forward from a partially committed state.
- Keep the D-19 claim limited to the observed process-level interruption modes and recorded macOS/APFS environment.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Remove nested staging directories only through known journal paths**
- **Found during:** Task 2
- **Issue:** Clearing staged files alone could leave empty nested staging directories after a valid recovery.
- **Fix:** Remove only journal-named files, then prune their known directories with non-recursive `rmdir` calls.
- **Files modified:** `src/filesystem/transaction.ts`
- **Verification:** Minimal-tree and recovery suites pass.
- **Committed in:** `addb538`

**Total deviations:** 1 auto-fixed (Rule 1)

## Known Stubs

None.

## Issues Encountered

An ad-hoc CLI smoke command briefly created generated `.exspecso` and `.agents` files at the package root. They were identified as task-generated test leakage and removed individually; the integration suite uses temporary Git fixtures and leaves the source repository untouched.

## Next Phase Readiness

The init boundary now has minimal canonical artifacts, explicit busy behavior, and conservative recovery. Phase 1 still requires its separate review and independent verification gates; this plan does not mark the phase complete.

## Self-Check: PASSED

All six listed source/test files exist and both task commits (`571a190`, `addb538`) are present in Git history.
