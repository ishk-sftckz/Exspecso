---
phase: 01-initialize-canonical-projects
plan: 23
subsystem: filesystem containment
tags: [typescript, node-fs, vitest, windows-portability, regression]
requires:
  - phase: 01-initialize-canonical-projects
    provides: "Plan 01-22 pure TypeScript/Node filesystem and transaction foundations"
provides:
  - "Portable component validation before every active child filesystem boundary"
  - "Active regression coverage for all DirectoryCapability and BoundReader child-name entry points"
affects: [phase-01-independent-verification, filesystem, transaction-recovery]
actuals:
  tokens: 1611
  tasks: 2
  commits: 3
tech-stack:
  added: []
  patterns:
    - "One private component()/components() seam validates untrusted names before Node filesystem operations"
key-files:
  created: []
  modified:
    - src/filesystem/contained-fs.ts
    - tests/unit/root-scoped-fs.test.ts
key-decisions:
  - "Keep portable-name validation in the existing private component()/components() seam without platform branches or a new export."
  - "Use an invalid later reader component behind a symlink sentinel to prove complete validation precedes traversal."
patterns-established:
  - "Operation-surface tests assert both EXSPECSO_CONTAINMENT_INVALID and unchanged fixtures for pre-I/O validation."
requirements-completed: [SETUP-01, SETUP-02, SETUP-03, SETUP-04, SETUP-05, SETUP-06, SETUP-07, SETUP-08, ART-01, ART-02, ART-03, ART-04, ART-05, ART-06, ART-07, ART-08, ART-09]
coverage:
  - id: D1
    description: "All active DirectoryCapability and BoundReader child-name boundaries reject portable-invalid names before filesystem side effects."
    requirement: ART-07
    verification:
      - kind: unit
        ref: "tests/unit/root-scoped-fs.test.ts#applies portable component validation to every child-name entry point"
        status: pass
      - kind: unit
        ref: "npm test -- --run tests/unit/root-scoped-fs.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "The active portable-name regression is included in the default suite and retains the representative Windows Node 24 CI route."
    requirement: ART-07
    verification:
      - kind: unit
        ref: "npm test -- --run"
        status: pass
      - kind: other
        ref: "vitest.config.ts and .github/workflows/ci.yml static route checks"
        status: pass
    human_judgment: false
duration: 7min
completed: 2026-08-30
status: complete
---

# Phase 01 Plan 23: Portable Component Boundary Closure Summary

**Portable Windows-safe component validation now gates every active pure-Node child filesystem operation, with pre-I/O regression evidence in the default test suite.**

## Performance

- **Duration:** 7min
- **Started:** 2026-08-30T07:33:40Z
- **Completed:** 2026-08-30T07:39:47Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Restored the shared cross-platform component contract: 255 UTF-8-byte maximum, Windows-prohibited punctuation and controls, trailing aliases, and case-insensitive DOS-device names including extension and superscript forms.
- Added active coverage proving all eight `DirectoryCapability` and all three `BoundReader` child-name entry points reject invalid input before mutation, reading, or traversal.
- Preserved the existing active test inclusion and representative `windows-latest` / Node `24.x` CI route without changing configuration.

## Task Commits

Each task was committed atomically:

1. **Task 1: RED portable createFile regression** - `b6fe75f` (`test`)
2. **Task 1: GREEN shared portable component gate** - `a89da88` (`fix`)
3. **Task 2: Every child-name entry point regression** - `1831355` (`test`)

## RED/GREEN Evidence

- **RED:** `b6fe75f` added `rejects non-portable child components before creation`; the focused command failed because the pre-fix capability accepted reviewed names including `ordinary:secret`, `tail.`, and `tail `.
- **GREEN:** `a89da88` routed the contract through the private `component()` seam. `npm test -- --run tests/unit/root-scoped-fs.test.ts -t "rejects non-portable child components before creation"` passed after the correction.

## Closure Evidence

| Gate | Result |
| --- | --- |
| `npm test -- --run tests/unit/root-scoped-fs.test.ts` | PASS — 1 file, 9 tests |
| `npm test -- --run` | PASS — 10 files, 92 tests |
| `npm run build` | PASS — `tsc -p tsconfig.json` |
| `npm pack --dry-run --json` | PASS — 43 package entries |
| `vitest.config.ts` | Unchanged; includes `tests/**/*.test.ts` and continues excluding historical `tests/unit/contained-fs.test.ts` |
| `.github/workflows/ci.yml` | Unchanged; retains `windows-latest`, Node `24.x`, and `npm test -- --run` |

## Files Created/Modified

- `src/filesystem/contained-fs.ts` - Centralized deterministic portable component validation in the existing private seam.
- `tests/unit/root-scoped-fs.test.ts` - Active creation and operation-surface regressions with inventory, source, destination, and traversal-sentinel assertions.

## Decisions Made

- Kept one validation seam: normal child operations use `child()`, rename targets use `component()`, and readers validate their complete component array with `components()`.
- Used a valid leading symlink plus invalid later reader component to prove all reader input is rejected before opening/traversing the valid-looking first component.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 01-23 implementation and closure evidence are complete. Phase 1 itself remains pending independent verification; this summary does not claim Phase completion or alter requirement status.

## Self-Check: PASSED

- Confirmed modified source and active regression files exist.
- Confirmed all three Task commits (`b6fe75f`, `a89da88`, and `1831355`) exist in Git history.

---
*Phase: 01-initialize-canonical-projects*
*Completed: 2026-08-30*
