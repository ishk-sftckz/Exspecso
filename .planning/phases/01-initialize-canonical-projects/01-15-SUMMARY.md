---
phase: 01-initialize-canonical-projects
plan: 15
subsystem: transaction cleanup and native diagnostics
tags: [filesystem, recovery, containment, native, sanitizer, ci]
dependency_graph:
  requires: [01-14]
  provides: [restartable bound cleanup, unknown-evidence preservation, address diagnostic build mode, matrix safety-suite execution]
  affects: [01-16, 01-17, 01-18]
tech-stack:
  added: []
  patterns: [journal-identified cleanup only, terminal-cleanup restart, release-provider restoration after diagnostics]
key-files:
  created: []
  modified: [src/filesystem/transaction.ts, src/filesystem/recovery.ts, tests/integration/transaction-recovery.test.ts, native/build.mjs, tests/unit/contained-fs.test.ts, .github/workflows/containment.yml]
decisions:
  - "Cleanup validates the entire staged inventory against journal-identified entries before deleting the journal, preserving unlisted evidence for investigation."
  - "A cleaning journal validates its terminal canonical set without requiring already-deleted staged copies, so identified cleanup can restart safely."
  - "Address-sanitized test providers run the existing native safety suite in every workflow branch, then the release provider is rebuilt before evidence capture."
metrics:
  duration: 5min
  completed_date: 2026-08-28
status: complete
actuals:
  tokens: 4645
  tasks: 2
  commits: 4
requirements-completed: [SETUP-06, ART-01, ART-02, ART-07, ART-08, ART-09]
coverage:
  - id: D1
    description: "Recovery restarts an identified partial cleanup but retains an unlisted staging entry and its journal."
    requirement: ART-08
    verification:
      - kind: integration
        ref: "tests/integration/transaction-recovery.test.ts#restarts identified cleanup after an already-removed staged copy"
        status: pass
      - kind: integration
        ref: "tests/integration/transaction-recovery.test.ts#preserves a cleaning journal when its stage contains an unlisted entry"
        status: pass
    human_judgment: false
  - id: D2
    description: "Native CI exposes a bounded address diagnostic and runs containment safety tests in each existing platform branch."
    requirement: ART-07
    verification:
      - kind: unit
        ref: "tests/unit/contained-fs.test.ts#accepts the declared address diagnostic before resolving a native support row"
        status: pass
      - kind: unit
        ref: "tests/unit/contained-fs.test.ts#keeps the bounded native safety suite in every existing matrix runner"
        status: pass
    human_judgment: false
---

# Phase 01 Plan 15: Conservative Cleanup and Native Safety Summary

Journal cleanup now remains restartable after known staged files have already been removed, preserves unknown staging evidence, and adds address-sanitized native safety runs to every existing containment workflow branch.

## Task Commits

1. **Task 1: Make cleanup restartable without destroying needed evidence**
   - `5a092df` — failing partial-cleanup and unknown-evidence regressions
   - `8329a59` — journal-identified, capability-bound restartable cleanup
2. **Task 2: Verify native safety and platform fault behavior**
   - `76e2945` — failing native diagnostic and workflow-coverage regressions
   - `6401a6e` — address diagnostics and matrix safety-suite execution

## Verification

- `npm test -- --run tests/integration/transaction-recovery.test.ts tests/integration/minimal-artifacts.test.ts tests/unit/contained-fs.test.ts` — passed: 35 tests across 3 files.
- `npm run build` — passed.
- `git diff --check` — passed.
- RED evidence: both cleanup tests failed before their implementation; both diagnostic/workflow tests failed before the new build option and CI commands.

## Accomplishments

- Removed the unused lexical cleanup fallback; recovery cleanup now operates only through held directory capabilities.
- Verified the staging tree against journal-identified file and directory entries before deleting recovery authority; unknown evidence remains untouched and diagnostic.
- Made a terminal `cleaning` journal restartable when prior staged bytes were already deleted but the validated canonical terminal state remains intact.
- Added a bounded `--diagnostic address` build option and runs of the existing native safety suite under an instrumented test provider, followed by release-provider restoration before evidence capture.

## Decisions Made

- Treat unknown stage entries as a hard cleanup stop before any journal deletion, rather than attempting best-effort removal.
- Do not require an already-deleted backup or staged copy to validate a journal already durably marked `cleaning`.
- Keep this task limited to native diagnostic configuration and existing CI branches; package assembly, full matrix aggregation, named Node-lane evidence, and release gates remain owned by Plans 16–18.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 1 - Bug] Corrected noncanonical planning-artifact progress accounting**
   - **Found during:** Plan close-out.
   - **Issue:** State advancement counted two containment planning references as executable plans, reporting 17/22 despite the canonical 20-plan roadmap.
   - **Fix:** Restored STATE.md to the roadmap-authoritative 17/20 count and Plan 16 resume position.
   - **Files modified:** `.planning/STATE.md`

**Impact on plan:** Documentation-only correction; Task scope and implementation remain unchanged.

## Known Stubs

None.

## Next Phase Readiness

Plan 16 can package the provider without changing cleanup authority. Plans 17–18 still own execution and aggregation of all nine support rows, ten named Node lanes, and same-final-tarball evidence; the retained ENV-MA25 local evidence remains the Plan 20 prerequisite rather than a hosted substitute.

## Self-Check: PASSED

- Modified implementation and test files exist.
- Task commits `5a092df`, `8329a59`, `76e2945`, and `6401a6e` exist in Git history.
