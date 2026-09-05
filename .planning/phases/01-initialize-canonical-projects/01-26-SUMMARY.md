---
phase: 01-initialize-canonical-projects
plan: 26
subsystem: initialization
tags: [cli, stdout, adapters, npm-package, regression]
requires:
  - phase: 01-25
    provides: "Canonical ten-family FIND/PAC stable-ID registry and active pure TypeScript/Node initializer"
provides:
  - "Exact concise successful-initialization stdout for committed and no-op transactions"
  - "Installed-package regression coverage across all selected runtime subsets"
affects: [initializer, runtime-adapters, package-documentation, phase-01-uat]
tech-stack:
  added: []
  patterns: ["Keep transaction-success messaging selection-independent and verify it through the packed CLI"]
key-files:
  created: [.planning/phases/01-initialize-canonical-projects/01-26-SUMMARY.md]
  modified: [.planning/REQUIREMENTS.md, .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md, src/init/completion.ts, src/init/run-init.ts, tests/unit/adapters.test.ts, tests/integration/installed-cli.test.ts, README.md]
key-decisions:
  - "G-01-2 narrowly supersedes D-08 and SETUP-08 successful stdout while preserving adapter-native invocation metadata."
actuals:
  tokens: 2747
  tasks: 2
  commits: 3
requirements-completed: [SETUP-08]
coverage:
  - id: D1
    description: "Committed and no-op initialization emit exactly one concise, newline-terminated success line without runtime-selection guidance."
    requirement: SETUP-08
    verification:
      - kind: unit
        ref: "tests/unit/adapters.test.ts#formats one exact concise success line independently of runtime selection"
        status: pass
      - kind: integration
        ref: "npm test -- --run tests/unit/adapters.test.ts tests/integration/installed-cli.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "The standard packed CLI preserves exact stdout, selected adapter paths, additive reruns, and project identity for all supported selections."
    requirement: SETUP-08
    verification:
      - kind: integration
        ref: "tests/integration/installed-cli.test.ts#packs a native-free tarball and proves every selected runtime subset from root and nested directories"
        status: pass
      - kind: integration
        ref: "tests/integration/installed-cli.test.ts#adds selected adapters without changing the project identity or unselected adapter bytes"
        status: pass
    human_judgment: false
duration: 2 min
completed: 2026-09-05
status: complete
---

# Phase 01 Plan 26: Concise Initialization Completion Summary

**Committed and no-op initialization now emits only `Exspecso initialized successfully.\n`, while generated adapters retain their portable and native invocation metadata.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-05T05:56:55Z
- **Completed:** 2026-09-05T05:59:17Z
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

- Superseded only D-08/SETUP-08 completion guidance with the approved G-01-2 exact stdout contract.
- Kept the success write exclusively after committed or no-op transaction results; non-success diagnostics remain unchanged.
- Proved exact output through the packed, scripts-disabled installed bin across all seven runtime subsets, nested no-op reruns, and an additive rerun.

## Task Commits

1. **Task 1 RED: add failing concise completion contract** — `5d51d3c` (test)
2. **Task 1 GREEN: emit concise init success output** — `ba282ff` (feat)
3. **Task 2: prove concise installed init output** — `612eda4` (test)

## Verification

- `npm test -- --run tests/unit/adapters.test.ts tests/integration/installed-cli.test.ts` — passed (23 tests).
- `npm test -- --run` — passed (10 files, 95 tests).
- `npm run build` — passed.
- `npm pack --dry-run --json` — passed (43 package entries; active TypeScript/Node package inventory only).

## Files Created/Modified

- `src/init/completion.ts` — zero-argument exact success formatter.
- `src/init/run-init.ts` — committed/no-op-only formatter call.
- `tests/unit/adapters.test.ts` — standalone exact completion assertion plus preserved adapter invariants.
- `tests/integration/installed-cli.test.ts` — installed-bin exact stdout and selected-path assertions.
- `README.md` — concise success-output contract.
- `.planning/phases/01-initialize-canonical-projects/01-CONTEXT.md` and `.planning/REQUIREMENTS.md` — approved G-01-2 supersession.

## Decisions Made

- G-01-2 changes only successful initializer stdout. Runtime selection, adapter contents, canonical operation identity, transaction/recovery behavior, and non-success diagnostics remain unchanged.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Task 2's RED run correctly exposed the pre-existing installed assertion for the superseded runtime guidance after Task 1 changed the executable behavior.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The narrow G-01-2 implementation proof is complete. Renewed real-TTY UAT remains the orchestrator-owned acceptance step for the observed terminal message.

---

*Phase: 01-initialize-canonical-projects*
*Completed: 2026-09-05*

## Self-Check: PASSED

- All seven changed source, test, documentation, and canonical-intent files exist.
- RED and GREEN Task 1 commits plus the Task 2 installed-package proof commit exist.
- Coverage metadata classifies both deliverables as automated and fully passing.
