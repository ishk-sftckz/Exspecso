---
phase: 01-initialize-canonical-projects
plan: 16
subsystem: containment package assembly and isolated install
tags: [native, prebuilt, npm, offline, provenance, containment]
status: complete
dependency_graph:
  requires: [01-15, 01-19, 01-20]
  provides: [row-qualified-package-assembly, offline-installed-cli-proof, package-tamper-fail-closed]
  affects: [01-17, 01-18]
tech_stack:
  added: []
  patterns: [support-row-qualified-provider-paths, provenance-bound-assembly, isolated-offline-install, exact-repository-snapshot]
key_files:
  created: [scripts/assemble-containment-package.mjs]
  modified: [tests/unit/contained-fs.test.ts, tests/helpers/containment-fixture.ts, tests/integration/init-codex-tracer.test.ts]
decisions:
  - "Retain separate supportRowId paths for rows that share one platform target; target-only manifests are invalid."
  - "Create an npm shrinkwrap only in the release assembly so a fresh, prefetched cache can satisfy the installed package offline without publishing development scripts."
  - "Treat missing, corrupt, and manifest-swapped providers as independent negative installs, each requiring byte-for-byte repository preservation."
metrics:
  duration: 25min
  completed_date: 2026-08-28
actuals:
  tokens: 16151
  tasks: 2
  commits: 4
---

# Phase 01 Plan 16: Row-Qualified Package Assembly Summary

Row-qualified release assembly now emits provenance-validated native manifests, and a packed CLI is proven to install offline with scripts, workspace loader paths, compilers, and headers unavailable.

## Accomplishments

- Added `assemble-containment-package.mjs`, which derives expected provider entries from the approved support matrix, preserves distinct support-row paths for shared targets, binds binary hash/size/Node-API/provenance to the output manifest, and refuses missing, unexpected, duplicate, mismatched-row, non-release, wrong-commit, wrong-toolchain, or checksum-mismatched inputs.
- Assembled release metadata retains the fixed ten-lane engine and private package status, removes development and lifecycle scripts, and includes a release-only shrinkwrap for deterministic ordinary-dependency cache resolution.
- Added PK-01/PK-02 red–green coverage for distinct same-target rows and incomplete/duplicate inputs.
- Reworked the packed tracer to prefetch the locked production dependency graph into a dedicated cache, then perform `npm install --offline --ignore-scripts` with fresh npm configuration and sanitized `NODE_PATH`/`NODE_OPTIONS`.
- Added PK-03 proof for root and nested installed CLI invocations, including installed-provider realpath and manifest-hash provenance.
- Added PK-04 independent missing, corrupt, and manifest-swap tests; each requires an actionable containment-unavailable error before any repository tree, bytes, lock, or staging mutation.

## Task Commits

1. **Task 1: Assemble the exact support-row prebuilt manifest**
   - `070e6eb` — failing row-qualified assembly tests
   - `ccdcf8b` — provenance-bound row-qualified package assembly
2. **Task 2: Prove isolated installation and negative package behavior**
   - `20ecf3c` — failing isolated-install coverage
   - `93e8c14` — offline installed-CLI and exact no-mutation proof

## Verification

- `npm test -- --run tests/unit/contained-fs.test.ts -t "manifest|provider"` — passed: 15 tests.
- `npm test -- --run tests/integration/init-codex-tracer.test.ts -t "prebuilt install|provider unavailable"` — passed: 2 tests. The install used a dedicated cache after locked production-dependency prefetch, then `--offline --ignore-scripts` with a fresh npm config and sanitized loader/compiler/header environment.
- `npm run build` — passed.
- `git diff --check` — passed.
- RED evidence: PK-01/PK-02 failed because no assembler existed; PK-03 failed because the packed tracer did not record/prove its isolation constraints. The duplicate-artifact branch also failed before the assembler rejected extra row artifacts.

## Decisions Made

- The release package may include `npm-shrinkwrap.json` alongside `dist`; this is the locked ordinary-dependency closure necessary for a dedicated-cache offline install and is not a provider fallback.
- Package assembly creates the published metadata from the development package rather than removing the repository's test command, so development verification remains available while the tarball has no lifecycle or test hooks.
- The assembler fails closed when the full row artifact set is unavailable; it never synthesizes a provider for an unobserved support row.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 1 - Bug] Prefetched registry metadata as well as locked tarballs for strict npm offline resolution.**
   - **Found during:** Task 2
   - **Issue:** A dedicated cache populated only by `npm ci` held package tarballs but did not contain the registry metadata npm needs while resolving the tarball's ordinary dependencies under `--offline`.
   - **Fix:** Warm the production dependency graph's exact package/version metadata into the same dedicated cache before the offline install.
   - **Files modified:** `tests/integration/init-codex-tracer.test.ts`
   - **Verification:** The final install completed under `--offline --ignore-scripts`.

2. **[Rule 1 - Bug] Restored roadmap-authoritative Phase 1 plan totals in execution state.**
   - **Found during:** Plan close-out.
   - **Issue:** State advancement counted noncanonical containment planning references and reported 18/22 rather than the roadmap's canonical 18/20.
   - **Fix:** Restored the canonical total and updated the resume position to Plan 01-17.
   - **Files modified:** `.planning/STATE.md`

## Remaining Gates

- This plan supplies the fail-closed assembler and isolated-install evidence path. It does not manufacture unobserved cross-platform binaries: Plan 01-17 remains responsible for obtaining current evidence across all declared support rows and named Node lanes, and Plan 01-18 remains responsible for one same-final-tarball release-candidate proof.

## Known Stubs

None.

## Self-Check: PASSED

- Assembly script and all three modified test/helper files exist.
- Task commits `070e6eb`, `ccdcf8b`, `20ecf3c`, and `93e8c14` exist in Git history.
- No placeholder or TODO markers were introduced in the plan-owned files.
