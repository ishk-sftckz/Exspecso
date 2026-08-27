---
phase: 01-initialize-canonical-projects
plan: 05
subsystem: initializer-reruns
tags: [typescript, init, adapters, ownership, preflight, vitest]
requires:
  - phase: 01-04
    provides: Canonical artifact schemas and non-mutating aggregate validation
provides:
  - Self-contained managed adapter ownership evidence with deterministic diffs
  - Immutable additive initialization plans with complete-set preflight checks
  - Explicit selected-target replacement authorization and stale-preimage protection
affects: [init, adapters, cli, phase-01-06]
requirements-completed: [SETUP-05, SETUP-07]
tech-stack:
  added: []
  patterns: [self-describing-managed-files, immutable-preflight-plan, additive-runtime-selection, current-preimage-recheck]
key-files:
  created: [src/adapters/managed-file.ts, src/init/plan.ts, tests/integration/init-rerun.test.ts]
  modified: [src/adapters/registry.ts, src/cli/arguments.ts, src/cli/main.ts, src/init/run-init.ts]
key-decisions:
  - "Adapter ownership is proven only by the generated file's exact versioned header and matching SHA-256 body hash."
  - "Rerun selection updates canonical selectedAgents additively while only adapters explicitly selected for the current invocation can be created, refreshed, or replaced."
  - "Any selected adapter conflict blocks the entire init mutation set; replacement is scoped by repeatable --replace-agent and every planned preimage is rechecked before promotion."
actuals:
  tokens: 7705
  tasks: 2
  commits: 4
status: complete
---

# Phase 01 Plan 05: Safe Additive Init Reruns Summary

`init` can now safely add or refresh only explicitly selected runtime adapters while preserving confirmed canonical identity and omitted adapter bytes.

## Completed Tasks

1. **Managed adapter ownership evidence** — Added a pure managed-file module that renders the only ownership record (template version plus SHA-256 body fingerprint), classifies every existing target, and supplies deterministic concise diffs without any merge or write side effect.
2. **Additive rerun planning and approval** — Added immutable init planning that validates canonical state first, unions selected-agent configuration, aggregates selected adapter conflicts, supports scoped repeatable replacement approval, and rejects preimages that changed after preflight.

## Requirements Completed

- **SETUP-05:** Selected native adapters keep self-describing deterministic managed headers.
- **SETUP-07:** Reruns add or safely refresh selected integrations, preserve unchecked integrations, aggregate conflicts, and require explicit replacement authority.

## Verification

- `npm test -- --run tests/integration/init-rerun.test.ts tests/integration/validation-errors.test.ts tests/unit/adapters.test.ts` — passed (20 tests).
- `npm run build` — passed.
- `npm test -- --run` — passed (6 test files, 40 tests).

Coverage proves canonical project ID/title/constitution preservation, byte-identical unselected adapters, unchanged managed refresh, aggregated selected conflicts with zero writes, scoped `--replace-agent` replacement, stale-preimage rejection, strict repeatable approval parsing, and no manifest or three-way merge behavior.

## Decisions Made

- Managed-file headers remain the complete adapter ownership record; no adapter manifest or cached projection is introduced.
- Omitted adapters remain physically untouched even though their identities stay in the additive canonical `selectedAgents` configuration.
- `--replace-agent` can authorize only a selected target with a current conflict, and the transaction revalidates every planned target's preimage immediately before promotion.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — the new ownership, replacement, and complete-set preflight paths directly implement the plan's T-05-01 through T-05-04 mitigations without adding a new trust boundary.

## Next Phase Readiness

Plan 01-06 can build transaction interruption and recovery guarantees on a conflict-free complete mutation plan without weakening the canonical validation gate established by Plan 01-04.

## Self-Check: PASSED

- Confirmed all planned source, test, and summary files exist.
- Confirmed all four RED and GREEN task commits are present in Git history.
