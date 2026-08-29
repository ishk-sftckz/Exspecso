---
phase: 01-initialize-canonical-projects
plan: 18
subsystem: packaging/compatibility
tags: [typescript, node, npm, vitest, github-actions, documentation]
requires:
  - phase: 01-17
    provides: pure TypeScript/Node initializer with native-free active entry points
provides:
  - representative four-row Node and OS compatibility workflow
  - standard-tarball installed CLI evidence
  - documented filesystem and host-boundary claims
affects: [phase-verification, packaging, documentation]
tech-stack:
  added: []
  patterns:
    - build, inspect, pack, scripts-disabled install, and invoke the declared bin outside the checkout
    - representative compatibility matrix with one engine-boundary row and Node LTS on three OS families
key-files:
  created:
    - .github/workflows/ci.yml
    - tests/helpers/package-fixture.ts
    - tests/integration/installed-cli.test.ts
  modified:
    - README.md
decisions:
  - "D-22 compatibility evidence is four representative Node/OS rows, not an exhaustive native certification matrix."
  - "The installed-package tracer uses the ordinary npm tarball and a lifecycle-scripts-disabled isolated installation."
  - "Documentation names host permissions and sandboxes as the OS boundary without claiming kernel-level or race-proof containment."
metrics:
  duration: 10min
  completed: 2026-08-29
status: complete
actuals:
  tokens: 4218
  tasks: 2
  commits: 3
---

# Phase 01 Plan 18: Installed Package Compatibility Summary

**The pure TypeScript/Node package now proves its standard npm tarball and declared CLI outside the checkout, while CI and documentation make the D-21/D-22 support boundary explicit.**

## Performance

- **Duration:** 10 min
- **Tasks:** 2/2
- **Files modified:** 4
- **Actual implementation size:** 16,874 changed diff characters / 4 = 4,218 tokens

## Accomplishments

- Added a four-row, read-only GitHub Actions workflow: Node 22.13.0 on Ubuntu and Node 24.x on Ubuntu, macOS, and Windows. Every row runs clean install, build, full tests, and npm-pack inventory inspection.
- Added an installed-package helper that builds the checkout, checks `npm pack --dry-run --json`, packs the normal tarball, installs it outside the checkout with lifecycle scripts disabled and no `NODE_PATH`, and invokes the installed bin.
- Proved root and nested initialization, all seven nonempty runtime-adapter subsets, canonical-first completion text, minimal artifacts, and additive reruns with preserved project identity and unselected adapter bytes.
- Replaced native-support documentation with the pure TypeScript/Node contract, representative compatibility evidence, honest host/sandbox boundary, and historical-native-material scope.

## Task Commits

1. **Task 1 RED: Add failing installed package tracer** — `9af4c19` (`test`)
2. **Task 1 GREEN: Verify installed package compatibility** — `0845b95` (`feat`)
3. **Task 2: Document package boundary and compatibility** — `65ab4ba` (`docs`)

## Verification

- `npm test -- --run tests/integration/installed-cli.test.ts` — PASS (3 tests): tarball inventory, all seven subsets with root/nested reruns, additive rerun, and the four-row workflow contract.
- `npm run build` — PASS.
- `npm test -- --run` — PASS (9 files, 79 tests).
- `npm pack --dry-run --json` — PASS; 43-file candidate contains package metadata, compiled JavaScript/declarations, and declared CLI with no native, build, prebuild, or `.node` surface.
- The installed-CLI test performs an actual standard tarball installation and runs `dist/cli/main.js` through its installed package bin path.

## Decisions Made

- Keep routine CI proportional: one Node 22.13.0 engine-boundary row plus Node 24 LTS across Ubuntu, macOS, and Windows.
- Treat the standard tarball and scripts-disabled isolated install as the user-installable package proof; no compiler, Node headers, native binary, provider download, or package lifecycle build is required.
- State only deterministic repository-root, relative-component/symlink, preimage, transaction, and recovery behavior; host permissions and sandboxing remain the OS boundary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test stability] Extended the installed-package matrix test timeout**
- **Found during:** Task 1 verification
- **Issue:** Seven isolated installed CLI runs legitimately exceeded Vitest's default five-second timeout, causing cleanup to overlap the still-running test.
- **Fix:** Set the tracer test timeout to 30 seconds; no production behavior changed.
- **Files modified:** `tests/integration/installed-cli.test.ts`
- **Verification:** Focused installed-package suite passed in 6.08 seconds; full suite passed.
- **Committed in:** `0845b95`

**Total deviations:** 1 auto-fixed (1 Rule 1 test-stability fix).
**Impact:** Keeps the required full seven-subset proof deterministic without expanding scope.

## TDD Gate Compliance

The installed-package tracer was written first, failed because its required package helper did not exist, and was committed as RED (`9af4c19`). The helper, CI workflow, and passing tracer followed in GREEN (`0845b95`).

## Known Stubs

None.

## Next Phase Readiness

- Hand the repository to independent Phase 1 verification. This plan does not publish or release the package, alter prior verification reports, or mark Phase 1 complete.
- Plans 01-19/01-20 and retained native source, tests, scripts, workflows, and evidence remain immutable historical material and do not prove the current TypeScript path.

## Self-Check: PASSED

- Verified all three task commits exist in Git history.
- Verified `.github/workflows/ci.yml`, `tests/helpers/package-fixture.ts`, `tests/integration/installed-cli.test.ts`, and `README.md` exist.
- Re-ran all task acceptance and plan-level verification commands successfully.
