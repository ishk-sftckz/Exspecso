---
phase: 01-initialize-canonical-projects
plan: 20
subsystem: native-containment-evidence
tags: [env-ma25, node-25, node-api-8, full-regression, provenance]
status: complete
dependency_graph:
  requires: [01-19]
  provides: [matrix-derived-evidence-aggregation, env-ma25-full-suite-evidence, plan-01-12-resolution]
  affects: [01-12, 01-13, 01-16, 01-17, 01-18]
tech_stack:
  added: []
  patterns: [matrix-derived-required-sets, row-bound-provider-provenance, retained-local-evidence]
key_files:
  created: [scripts/run-local-containment-gate.mjs, README.md, 01-20-EVIDENCE/local/evidence.json, 01-20-EVIDENCE/local/full-suite.json, 01-20-EVIDENCE/local/provider-manifest.json, 01-20-EVIDENCE/local/build-provenance.json]
  modified: [scripts/containment-evidence.mjs, scripts/write-containment-evidence.mjs, tests/unit/containment-evidence.test.ts, 01-CONTAINMENT-SUPPORT.md, 01-CONTAINMENT-TEST-MATRIX.md, 01-12-SUMMARY.md, 01-12-CONTINUE-HERE.md]
decisions:
  - "Derive final evidence obligations from support-matrix rows and named Node lanes rather than fixed counts."
  - "Treat ENV-MA25 as retained local evidence and never emulate it with a hosted runner label."
  - "Close Plan 01-12 only with the declared local release provider and an unfiltered full-suite report."
metrics:
  duration: 11min
  completed_date: 2026-08-28
actuals:
  tokens: 29024
  tasks: 3
  commits: 4
---

# Phase 01 Plan 20: Local Native Evidence Closure Summary

ENV-MA25 now has retained, row-bound native provider provenance and a passing unfiltered 123-test local regression gate, formally resolving Plan 01-12’s historical verification halt.

## Accomplishments

- Replaced fixed eight-row aggregation with matrix-derived prerequisite and final stages. The final stage requires every declared support row and all ten named Node lanes, rejects missing ENV-MA25/Node 25.2.1, mixed source/tarball evidence, invalid environment/runtime/provider observations, and all skipped or contradictory records.
- Added a bounded local maintainer gate that checksum-verifies Node 20.19.0 headers, builds the ENV-MA25 Node-API 8 release provider, runs TypeScript build plus the entire unfiltered Vitest suite, and retains structured evidence.
- Captured ENV-MA25 evidence for macOS 26.5.1 build 25F80, arm64/APFS, Node 25.2.1 / live Node-API 10, CLT clang `clang-1700.6.4.2`, SDK 26.2 build 25C58, source `2fe9a678e9ba9b03c7753f921263afae13c95a84`, provider `dba77dba8c0d15dfe1cf20ee512d86e0b915038b6ccd8666a0296dede07bfc98`, and manifest `d7786781cb1fc6b12ab1280458b51ff2786dfec60c5b85b904af28ab590f48dd`.
- Updated support documentation and README with the exact supported tuple, fail-closed limits, and same-package/no-download end-user installation rule.
- Set Plan 01-12 status to complete, set D4 to passing evidence, and retained its continuation file as an explicitly resolved historical checkpoint.

## Task Commits

1. **Task 1: Make row and Node evidence counts matrix-derived**
   - `db75825` — derive support evidence requirements from matrix
2. **Task 2: Run and retain the complete local Plan 12 gate**
   - `8f1991d` — retain ENV-MA25 full gate evidence
   - `ed514d1` — bind prerequisite evidence to the captured build snapshot
3. **Task 3: Record measured support and close Plan 01-12 halt**
   - `1c6fb9a` — close Plan 12 with local evidence

## Verification

- `node scripts/run-local-containment-gate.mjs --row ENV-MA25 --evidence-dir .planning/phases/01-initialize-canonical-projects/01-20-EVIDENCE/local` passed, including `npm run build` and `npm test -- --run --testTimeout 60000` with **123/123** passed and zero failed/skipped/todo tests.
- `npm test -- --run tests/unit/containment-evidence.test.ts` passed: 22 tests.
- `node scripts/containment-evidence.mjs --stage prerequisite --evidence-dir .planning/phases/01-initialize-canonical-projects/01-20-EVIDENCE/local` passed.
- `npm run build` and `git diff --check` passed.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 1 - Bug] Propagated the checksum-verified header archive into nested test-provider builds.**
   - **Found during:** Task 2
   - **Issue:** The first full-gate run reached the local release provider, but six fixture builds received the sentinel `missing-approved-headers` value and failed before their intended assertions.
   - **Fix:** The runner now exports `EXSPECSO_NODE_HEADERS` to the full suite, retaining the same verified disposable archive for every nested build.
   - **Files modified:** `scripts/run-local-containment-gate.mjs`
   - **Verification:** The rerun passed 123/123 tests.

2. **[Rule 3 - Blocking] Added the missing README required by the approved documentation task.**
   - **Found during:** Task 3
   - **Issue:** The plan required measured support documentation in `README.md`, but the greenfield repository did not yet contain that file.
   - **Fix:** Created a concise README that identifies the exact ENV-MA25 tuple, rejects unlisted tuples, and preserves no-compiler/no-provider-download installation behavior.
   - **Files modified:** `README.md`
   - **Verification:** Documentation checks and plan-level verification passed.

## Known Stubs

None.

## Next Phase Readiness

Plan 01-13 is unblocked by this completed local evidence route. Plans 16–18 still own package assembly, full nine-row/ten-lane evidence, and same-final-tarball proof; independent phase verification, real-TTY UAT, descriptor-less prohibition acknowledgement, and the security audit also remain required.

## Self-Check: PASSED

- All eleven declared code, evidence, documentation, and Plan 01-12 closure files exist.
- All four task commits exist in Git history.
- No actionable stub markers were found in the files changed by this plan.
