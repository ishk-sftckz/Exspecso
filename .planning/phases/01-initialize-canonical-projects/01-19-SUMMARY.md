---
phase: 01-initialize-canonical-projects
plan: 19
subsystem: native-containment
tags: [node-api, support-matrix, native-build, apfs, node-25]
requires:
  - phase: 01-11
    provides: eight approved native support rows and containment tracer evidence
provides:
  - row-driven native support selection with exact local ENV-MA25 provenance
  - packaged support matrix, row-qualified provider paths, and fail-closed manifest binding
  - exact Node policy with ten named lanes and a Node 25.2.1 exception
affects: [01-12, 01-20, native-containment, package-builds]
actuals:
  tokens: 10748
  tasks: 2
  commits: 5
tech-stack:
  added: []
  patterns:
    - support-row data contract shared by native build and runtime loader
    - manifest binding validates supportRowId before native provider loading
key-files:
  created:
    - src/filesystem/support-matrix.ts
    - tests/unit/containment-support.test.ts
  modified:
    - native/support-matrix.json
    - native/build.mjs
    - src/filesystem/contained-fs.ts
    - package.json
key-decisions:
  - "Model every supported native environment as a unique data row; target alone cannot select a provider."
  - "Allow Node 25 only as the exact 25.2.1 exception while retaining declared even-major ranges."
  - "Package the support matrix beside native artifacts so installed CLIs apply the same fail-closed contract."
patterns-established:
  - "Native build commands require --row and use its data-derived target and toolchain policy."
  - "Provider manifests are selected by both supportRowId and target, then revalidated against the live observation."
requirements-completed: [SETUP-01, SETUP-02, SETUP-06, SETUP-07, ART-01, ART-02, ART-07, ART-08, ART-09]
coverage:
  - id: D1
    description: "ENV-MA25 builds a Node-API 8 release provider and the packed Codex initializer reaches native containment."
    requirement: SETUP-01
    verification:
      - kind: integration
        ref: "node native/build.mjs --variant release --row ENV-MA25 …; tests/integration/init-codex-tracer.test.ts#create only the canonical foundation and Codex adapter"
        status: pass
    human_judgment: false
  - id: D2
    description: "Support rows, Node lanes, and manifest row identities reject undeclared or ambiguous tuples before native loading."
    requirement: ART-07
    verification:
      - kind: unit
        ref: "tests/unit/containment-support.test.ts#declared and undeclared support tuples"
        status: pass
    human_judgment: false
duration: 14min
completed: 2026-08-28
status: complete
---

# Phase 01 Plan 19: Native Support Amendment Summary

**Row-driven native containment now supports the local macOS 26.5.1/APFS/Node 25.2.1 environment with a real Node-API 8 provider, while preserving exact fail-closed support policy.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-08-28T10:19:00Z
- **Completed:** 2026-08-28T10:33:12Z
- **Tasks:** 2/2
- **Files modified:** 12

## Accomplishments

- Added the `ENV-MA25` local APFS support row, with Command Line Tools, compiler, SDK, headers, and Node-API provenance.
- Replaced target-only provider selection with pure support-row and manifest matching before a native module is opened.
- Required `native/build.mjs --row`, emitted row-qualified providers, and aligned package engines with the declared ten Node test lanes.
- Proved all declared rows/lanes accept and malformed, missing, duplicate, or mismatched support and manifest tuples reject.

## Task Commits

1. **Task 1: Build and load the current Mac through a support row**
   - `9ebb30d` — RED support-row regression
   - `fe9f3d1` — row-driven native support selection
   - `ac4a988` — packaged matrix and APFS operation-root observation repair
2. **Task 2: Enforce the complete declared and undeclared tuple invariant**
   - `87f9738` — exact engine policy and manifest binding
   - `3d0990a` — malformed and missing-contract test coverage

## Verification

- `node native/build.mjs --variant release --row ENV-MA25 --out . --headers <checksum-verified Node 20.19.0 headers>` passed.
- `npm run build` passed.
- Packed `init-codex-tracer` happy path passed under Node 25.2.1.
- `npm test -- --run tests/unit/containment-support.test.ts tests/unit/contained-fs.test.ts` passed: 14 tests.
- `npm test -- --run tests/unit/containment-evidence.test.ts` passed: 14 tests.
- `git diff --check` passed.

The release manifest records `supportRowId: ENV-MA25`, `napiVersion: 8`, `ENV-MA25/darwin-arm64/contained-fs.node`, provider SHA-256 `dba77dba8c0d15dfe1cf20ee512d86e0b915038b6ccd8666a0296dede07bfc98`, build commit `87f9738e7dbe1aec0d17384c8ab98563e5e07095`, and the approved Command Line Tools/SDK provenance.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 1 - Packaging and filesystem observation] Packaged the matrix and derived the APFS mount before inspection.**
   - **Found during:** Task 1
   - **Issue:** An installed CLI could not read the source-only matrix, and `diskutil info` rejects a repository directory rather than a mount point.
   - **Fix:** Emit `dist/native/support-matrix.json` with every provider and resolve the operation-root mount through `df -P` before `diskutil` inspection.
   - **Files modified:** `src/filesystem/support-matrix.ts`, `src/filesystem/contained-fs.ts`, `native/build.mjs`
   - **Verification:** Fresh packed initializer tracer passed.
   - **Committed in:** `ac4a988`

2. **[Rule 3 - Blocking compatibility] Migrated existing build callers and the CI-evidence aggregate to row selection.**
   - **Found during:** Task 1
   - **Issue:** Requiring `--row` and adding a local row would otherwise break workflow builds or make local evidence a false ninth CI obligation.
   - **Fix:** Updated callers to pass their declared row and retained the original eight `runnerKind: ci` rows as the aggregate requirement.
   - **Files modified:** workflow files, containment fixture, evidence aggregate and its test
   - **Verification:** support/evidence suites passed.
   - **Committed in:** `fe9f3d1`

**Total deviations:** 2 auto-fixed (1 Rule 1, 1 Rule 3). No approved verification was weakened.

## Known Stubs

None.

## Next Phase Readiness

Plan 01-20 can now use the exact local `ENV-MA25` provider evidence to run the outstanding Plan 01-12 full-suite gate. Plan 01-12 remains halted until that separate evidence contract is completed; this plan does not mark it verified.

## Self-Check: PASSED

- All twelve listed code/test/workflow files exist.
- All five task commits exist in Git history.
- No stub markers were found in the files changed by this plan.

---
*Phase: 01-initialize-canonical-projects*
*Completed: 2026-08-28*
