---
phase: 01-initialize-canonical-projects
plan: 04
subsystem: canonical-artifacts
tags: [typescript, zod, markdown, validation, stable-ids, vitest]
requires:
  - phase: 01-03
    provides: Minimal initialized config, constitution, and selected native adapters
provides:
  - Strict D-01 project configuration and D-03 constitution renderers
  - Closed D-20 stable-ID registry with deterministic file and section resolution
  - Aggregate, non-mutating canonical artifact validation before init writes
affects: [phase-02, phase-03, phase-05, init, canonical-artifacts, validation]
actuals:
  tokens: 9261
  tasks: 2
  commits: 5
tech-stack:
  added: []
  patterns: [strict-zod-boundaries, read-only-artifact-scanning, aggregate-diagnostics, fail-closed-id-resolution]
key-files:
  created: [src/artifacts/schema.ts, src/artifacts/templates.ts, src/artifacts/resolve.ts, src/artifacts/validate.ts, src/errors/diagnostic.ts, tests/unit/artifacts.test.ts, tests/integration/validation-errors.test.ts]
  modified: [src/init/run-init.ts]
key-decisions:
  - "D-20 remains a closed public registry: only ROADMAP, PHASE-NNN, SPEC-NNN, REQ-NNN, AC-NNN, PLAN-NNN, TASK-NNN, DEC-NNN, and FINDING-NNN are accepted."
  - "Invalid canonical state reports aggregate actionable diagnostics and blocks init before staging or writing any file."
patterns-established:
  - "Use stable IDs and explicit parent IDs for identity; titles, slugs, and declaration order are display-only."
  - "Treat .exspecso/roadmap.md as the reserved but lazy ROADMAP location."
requirements-completed: [ART-01, ART-02, ART-03, ART-04, ART-05, ART-06, ART-08, ART-09]
coverage:
  - id: D1
    description: "The nine exact D-20 stable-ID families resolve deterministically, aliases fail, and duplicate definitions return no selected target."
    requirement: ART-03
    verification:
      - kind: unit
        ref: "tests/unit/artifacts.test.ts#recognizes exactly the nine D-20 public ID families and rejects aliases"
        status: pass
      - kind: unit
        ref: "tests/unit/artifacts.test.ts#resolves every exact D-20 family to a canonical location"
        status: pass
    human_judgment: false
  - id: D2
    description: "Stable IDs survive title edits and declaration reordering, while explicit duplicate IDs remain fail-closed."
    requirement: ART-04
    verification:
      - kind: unit
        ref: "tests/unit/artifacts.test.ts#keeps identity stable across title changes and declaration reordering, but fails closed for duplicates"
        status: pass
    human_judgment: false
  - id: D3
    description: "Resolvers locate ROADMAP and exact Markdown Task sections without absorbing adjacent sections, and concurrent calls leave files unchanged."
    requirement: ART-06
    verification:
      - kind: unit
        ref: "tests/unit/artifacts.test.ts#resolves ROADMAP only at its reserved path and isolates adjacent Task sections"
        status: pass
      - kind: unit
        ref: "tests/unit/artifacts.test.ts#returns byte-equivalent locations from concurrent read-only resolution"
        status: pass
    human_judgment: false
  - id: D4
    description: "Initialization and ID recognition retain only minimal config, constitution, and selected adapters; ROADMAP remains a single reserved lazy artifact."
    requirement: ART-05
    verification:
      - kind: unit
        ref: "tests/unit/artifacts.test.ts#keeps fresh and repeated initialization limited to minimal artifacts and selected adapters"
        status: pass
      - kind: integration
        ref: "tests/integration/init-codex-tracer.test.ts#creates only the canonical foundation and Codex adapter"
        status: pass
    human_judgment: false
  - id: D5
    description: "Direct canonical edits receive aggregate parse, schema, relationship, and duplicate diagnostics, and init does not mutate invalid state."
    requirement: ART-08
    verification:
      - kind: integration
        ref: "tests/integration/validation-errors.test.ts"
        status: pass
    human_judgment: false
duration: 6min
completed: 2026-08-27
status: complete
---

# Phase 01 Plan 04: Canonical Artifact Contracts Summary

**Closed D-20 stable IDs, rename-safe file and Markdown-section resolution, and aggregate validation that blocks init mutation on invalid canonical state.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-08-27T07:49:25Z
- **Completed:** 2026-08-27T07:55:40Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Extracted strict, inspectable project configuration and constitution templates from the initializer.
- Added read-only scanning and resolution for exactly the nine approved public identifier families, including exact adjacent Markdown section boundaries.
- Added a shared diagnostic envelope and aggregate pre-init validation for malformed JSON, schema errors, aliases, parent references, duplicates, and reserved Roadmap placement.

## Task Commits

1. **Task 1 RED: Add failing artifact contract coverage** — `72b0c9a` (test)
2. **Task 1 GREEN: Encode canonical templates, stable IDs, and rename-safe resolution** — `e0fde09` (feat)
3. **Task 2 RED: Add failing direct-edit validation coverage** — `9a65e36` (test)
4. **Task 2 GREEN: Aggregate direct-edit validation without mutation** — `492e4a9` (feat)
5. **Rule 2 follow-up: Cover all-family resolution and repeated lazy initialization** — `b7f2f28` (test)

## Verification

- `npm test -- --run tests/unit/artifacts.test.ts tests/integration/validation-errors.test.ts tests/integration/init-codex-tracer.test.ts` — PASS, 3 files and 20 tests.
- `npm test -- --run` — PASS, 5 files and 30 tests in 6.04 seconds.
- `npm run build` — PASS.
- `git diff --check HEAD~5..HEAD` — PASS.

## Decisions Made

- D-20's nine approved spellings are the entire public stable-ID vocabulary; alternate prefixes remain invalid instead of becoming compatibility aliases.
- Resolver and validator operations are read-only. Any malformed, duplicate, or unresolved canonical state blocks init before it can stage or promote files.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected the adjacent-section boundary calculation and Node directory-entry typing.**
- **Found during:** Task 1 GREEN verification and Task 2 GREEN verification.
- **Issue:** The first section calculation excluded the blank line before its adjacent heading, and Node's typed `readdir` result required an explicit string-name directory entry type.
- **Fix:** Retained intra-section whitespace through the next sibling heading and used `Dirent<string>` for deterministic recursive scans.
- **Files modified:** `src/artifacts/resolve.ts`, `src/artifacts/validate.ts`
- **Verification:** Focused resolver, validation, packed-init, full test, and build commands pass.
- **Committed in:** `e0fde09`, `492e4a9`

**2. [Rule 2 - Missing critical coverage] Added direct proof for all-family resolution and repeated lazy initialization.**
- **Found during:** Final acceptance-criteria review.
- **Issue:** The initial focused tests proved every family parsed but did not directly assert that all families resolve; repeated init's lazy-materialization boundary also needed its own named test.
- **Fix:** Added explicit all-family resolver and fresh/repeated-init fixture assertions.
- **Files modified:** `tests/unit/artifacts.test.ts`
- **Verification:** Focused suite passes with 20 tests; full suite passes with 30 tests.
- **Committed in:** `b7f2f28`

---

**Total deviations:** 2 auto-fixed (Rule 1: 1, Rule 2: 1).
**Impact on plan:** The fixes preserve the approved contract and add acceptance coverage without expanding product scope.

## Known Stubs

None.

## Threat Flags

None — all new parser, resolver, and validation trust-boundary behavior is covered by the plan's threat model.

## Next Phase Readiness

Later planning and delivery workflows can now address canonical artifacts through the approved stable vocabulary, safely reject direct-edit drift, and rely on init to stop before mutating invalid canonical state. Adapter rerun conflict handling and transaction recovery remain assigned to Plans 05 and 06.

## Self-Check: PASSED

- All eight planned source and test files exist.
- All five RED, GREEN, and acceptance-coverage commits exist in Git history.
