---
phase: 01-initialize-canonical-projects
plan: 03
subsystem: initialization
tags: [node, typescript, cli, runtime-selection, adapters, vitest]
requires:
  - phase: 01-02
    provides: Packed initializer tracer with staged writes and Git-root containment
provides:
  - Explicit TTY and non-TTY runtime selection for Claude Code, Codex, and OpenCode
  - Immutable selected-runtime adapter plans with native destinations and managed headers
  - Canonical-first completion output with selected native invocation spellings
affects: [01-04, 01-05, 01-06, initialization, runtime-adapters]
requirements-completed: [SETUP-03, SETUP-04, SETUP-05, SETUP-08]
tech-stack:
  added: []
  patterns:
    - Strict repeatable CLI arguments with a TTY-only prompt boundary
    - Detection-as-labels-only runtime selection
    - Immutable pure adapter mutation plans
    - SHA-256 managed adapter headers
key-files:
  created:
    - src/cli/arguments.ts
    - src/init/runtime-selection.ts
    - src/adapters/registry.ts
    - src/init/completion.ts
    - tests/unit/runtime-selection.test.ts
    - tests/unit/adapters.test.ts
  modified:
    - src/cli/main.ts
    - src/init/run-init.ts
    - tests/integration/init-codex-tracer.test.ts
decisions:
  - Explicit submitted agents, never detected environments, control persisted configuration and adapter writes.
  - Adapter plans are immutable pure values built only from the submitted selection and preserve its order.
metrics:
  duration: 6min
  completed: 2026-08-27
status: complete
actuals:
  tokens: 4746
  tasks: 2
  commits: 5
---

# Phase 01 Plan 03: Runtime Selection and Native Adapters Summary

**Explicit runtime selection drives a deterministic set of Claude Code, Codex, and OpenCode adapters while preserving one portable `exspecso-start` identity.**

## Accomplishments

- Added strict repeatable `--agent` argument parsing plus explicit TTY checkbox selection. All options begin unchecked; detection is label metadata only.
- Added stable selected, cancelled, and invalid selection outcomes. Scripts never invoke Inquirer and require at least one valid runtime flag.
- Replaced the Codex-only inline adapter with immutable native adapter definitions for Claude Code, Codex, and OpenCode, including D-11 managed version/hash headers.
- Added a pure immutable adapter-plan boundary so initialization writes exactly selected native targets and preserves selection order in completion guidance.

## Task Commits

1. **Task 1 RED: Add failing runtime selection coverage** — `764f97b` (test)
2. **Task 1 GREEN: Require explicit runtime selection** — `860091e` (feat)
3. **Task 2 RED: Add failing adapter registry coverage** — `c9660b2` (test)
4. **Task 2 GREEN: Generate selected native adapters** — `24c2e28` (feat)
5. **Rule 2 follow-up: Isolate selected adapter mutation plans** — `bac6937` (fix)

## Verification

- `npm test -- --run tests/unit/runtime-selection.test.ts tests/unit/adapters.test.ts tests/integration/init-codex-tracer.test.ts` — PASS, 16 tests.
- `npm test -- --run` — PASS, 3 test files and 16 tests.
- `npm run build` — PASS.
- `npm pack --dry-run` — PASS; the packed package includes only the compiled runtime artifacts, package manifest, and license.

## Requirements Coverage

- **SETUP-03 / EDGE-03:** TTY users choose any non-empty runtime subset; scripts use repeatable validated flags.
- **SETUP-04 / EDGE-04:** Detection changes option labels only and never becomes a default or persisted selection.
- **SETUP-05 / EDGE-05:** The pure adapter plan returns only native targets for the submitted subset, including under concurrent calls.
- **SETUP-08:** Completion begins with canonical `/exspecso-start`, followed only by native invocations for selected runtimes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Regression] Updated the tracer's formerly unsupported Claude input case**
- **Found during:** Task 1 verification.
- **Issue:** The Plan makes Claude a supported runtime, so the prior Codex tracer test no longer represented invalid input.
- **Fix:** Changed the regression case to use `unknown` and assert the stable invalid-agent diagnostic.
- **Files modified:** `tests/integration/init-codex-tracer.test.ts`
- **Commit:** `860091e`

**2. [Rule 1 - Contract gap] Added canonical command documentation inside generated adapter bodies**
- **Found during:** Task 2 verification.
- **Issue:** Initial generated bodies retained the portable ID but did not show canonical `/exspecso-start` notation required by the adapter contract.
- **Fix:** Added canonical and native invocation guidance to each target-native body before calculating its managed hash.
- **Files modified:** `src/adapters/registry.ts`
- **Commit:** `24c2e28`

**3. [Rule 2 - Threat mitigation] Added a pure adapter mutation-plan boundary**
- **Found during:** Final threat-model review.
- **Issue:** Registry power-set tests did not directly prove that the mutation list consumed by `runInit` could not widen the submitted selection.
- **Fix:** Added immutable `buildAdapterPlan` and changed `runInit` to consume it; expanded power-set and concurrent-render tests to assert the exact write targets.
- **Files modified:** `src/adapters/registry.ts`, `src/init/run-init.ts`, `tests/unit/adapters.test.ts`
- **Commit:** `bac6937`

## Known Stubs

None.

## Next Phase Readiness

The initializer now accepts an explicit selected runtime set and writes native adapter files without allowing detection to control durable state. Adapter refresh conflict handling, rerun additions, and transaction-recovery fault injection remain assigned to later Phase 1 plans.

## Self-Check: PASSED

- All nine Plan 03 source and test files exist.
- All five listed commits exist in Git history.
- Focused and full tests, build, and packed-package checks passed after the final production commit.
