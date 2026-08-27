---
phase: 01-initialize-canonical-projects
plan: 07
subsystem: validation
tags: [node, typescript, json, markdown, diagnostics, vitest]
requires:
  - phase: 01-06
    provides: validation-before-mutation init boundary and byte-preserving fixture infrastructure
provides:
  - lossless invalid JSON and frontmatter identity diagnostics
  - one-pass aggregate validation for canonical declaration errors
  - canonical JSON syntax diagnostics that preserve config-parser ownership
affects: [init, canonical-artifacts, artifact-resolution, validation]
actuals:
  tokens: 5909.75
  tasks: 2
  commits: 5
tech-stack:
  added: []
  patterns: [lossless scanner result, own-property declaration checks, aggregate validation before mutation]
key-files:
  created: []
  modified: [src/artifacts/resolve.ts, src/artifacts/validate.ts, src/errors/diagnostic.ts, tests/unit/artifacts.test.ts, tests/integration/validation-errors.test.ts]
key-decisions:
  - "Treat explicit top-level id and parent fields as declarations by own-property presence, retaining invalid raw values as diagnostics."
  - "Keep .exspecso/exspecso.config.json parsing under its existing configuration diagnostic codes while reporting malformed non-config canonical JSON as artifact parse errors."
  - "Use the scanner as the single owner of declaration diagnostics so aggregation reports each independent error once."
patterns-established:
  - "Artifact scanning returns valid definitions separately from actionable diagnostics; compatibility callers retain definitions-only access."
requirements-completed: []
coverage:
  - id: D1
    description: "Invalid JSON and frontmatter identity declarations remain actionable and block init without mutation."
    verification:
      - kind: integration
        ref: tests/integration/validation-errors.test.ts#direct-edit validation
        status: pass
    human_judgment: false
  - id: D2
    description: "Valid D-20 JSON identity, duplicate ambiguity, and configuration parsing remain deterministic."
    verification:
      - kind: unit
        ref: tests/unit/artifacts.test.ts#canonical artifact contracts
        status: pass
    human_judgment: false
duration: 10min
completed: 2026-08-27
status: complete
---

# Phase 01 Plan 07: Lossless Artifact Declaration Validation Summary

**Canonical JSON and frontmatter identity declarations now retain malformed values as deterministic diagnostics that block init before any mutation.**

## Performance

- **Duration:** 10 min
- **Tasks:** 2/2
- **Files modified:** 5
- **RED:** `npm test -- --run tests/unit/artifacts.test.ts tests/integration/validation-errors.test.ts` failed as expected: frontmatter diagnostics and canonical JSON parse diagnostics were missing.
- **Task 2 GREEN:** `npm test -- --run tests/unit/artifacts.test.ts tests/integration/validation-errors.test.ts tests/integration/init-codex-tracer.test.ts` — 26 tests passed; `npm run build` passed.
- **Final:** `npm test -- --run` — 54 tests passed; `npm run build` passed.

## Accomplishments

- Preserved the approved tracer result: invalid JSON parent declarations reach `runInit`, report the raw value and repair detail, return nonzero, and leave the fixture byte/tree inventory unchanged.
- Added a shape matrix for invalid id and parent declarations: invalid strings, blanks, nulls, numbers, booleans, arrays, and objects; absent optional parents remain valid.
- Made scanner diagnostics the sole declaration-validation path for JSON and explicit Markdown frontmatter, avoiding duplicate errors while preserving valid definitions, duplicate ambiguity, unknown-parent errors, and config diagnostics.
- Added stable `EXSPECSO_ARTIFACT_PARSE` diagnostics for malformed non-config canonical JSON without changing `EXSPECSO_CONFIG_PARSE` ownership of the project configuration.

## Task Commits

1. **Task 1: Reject one invalid JSON parent through the real init boundary** — `6c08599` (`test` RED), `dcb1aae` (`feat` GREEN)
2. **Task 2: Cover invalid declaration shapes and aggregate independent errors** — `649107d` (`test` RED), `5ebd1c2` (`feat` GREEN)

**Checkpoint tracking:** `c0b1c9b` (`docs`) records the pending Task 1 tracer checkpoint. The user then replied `approve` in this task on 2026-08-27, explicitly authorizing Task 2 before it began.

## Files Created/Modified

- `src/artifacts/resolve.ts` — scanner result preserves valid definitions and raw JSON/frontmatter declaration failures.
- `src/artifacts/validate.ts` — aggregates scanner diagnostics before relationship validation and removes the duplicate-prone raw Markdown pass.
- `src/errors/diagnostic.ts` — adds the stable artifact JSON parse diagnostic code.
- `tests/unit/artifacts.test.ts` — exercises declaration shapes, frontmatter diagnostics, valid resolution, and no false config positive.
- `tests/integration/validation-errors.test.ts` — proves mixed-error aggregation, parse diagnostics, real init rejection, and no-write behavior.

## Decisions Made

- Explicit root-level `id` and `parent` declarations use own-property checks, not truthiness, so blanks and non-string JSON values cannot vanish during scanning.
- Only explicit frontmatter declarations use this diagnostic path; prose headings outside the declared-ID vocabulary do not become false positives.
- The valid project UUID remains a nested configuration value and is never interpreted as an artifact identifier.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Correct the frontmatter declaration helper’s TypeScript return type**
- **Found during:** Task 2
- **Issue:** The implementation returned a partial field map while its signature required both declaration keys, causing the required TypeScript build to fail.
- **Fix:** Modelled the result as a readonly partial record, matching the absence semantics used by own-property checks.
- **Files modified:** `src/artifacts/resolve.ts`
- **Verification:** Targeted tests, full suite, and `npm run build` pass.
- **Committed in:** `5ebd1c2`

**Total deviations:** 1 auto-fixed (Rule 1)

## Known Stubs

None.

## Remaining Phase Obligations

This plan implements the repair for CR-01 only; the recorded verifier gap remains open until independent re-verification. The Phase remains incomplete: independent re-verification, real-TTY UAT, prohibition acknowledgements, the security audit, and Plans 01-08 through 01-10 remain pending. Native/provider/platform changes were not approved or performed. Requirement checkboxes and recorded verifier failures remain pending their independent re-verification.

## Self-Check: PASSED

All five source/test files and the plan summary exist. Task commits `6c08599`, `dcb1aae`, `649107d`, and `5ebd1c2`, plus the pending-checkpoint tracking commit `c0b1c9b`, are present in Git history.

## Orchestrator Wave Verification

After the executor returned, `npm run build` and `npm test -- --run` were rerun successfully: 8 test files, 54 tests passed. The schema-drift and UI gates did not block; codebase drift was skipped because no STRUCTURE.md exists. These wave checks do not replace independent phase verification.
