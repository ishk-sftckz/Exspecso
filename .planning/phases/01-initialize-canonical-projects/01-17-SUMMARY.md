---
phase: 01-initialize-canonical-projects
plan: 17
subsystem: filesystem/package
tags: [typescript, node, filesystem, vitest, npm, github-actions]
requires:
  - phase: 01-16
    provides: canonical initializer, ownership, transaction, and recovery contracts
provides:
  - Node-backed repository filesystem capability API
  - native-free active package, test, and workflow entry points
affects: [01-18, phase-verification, packaging]
actuals:
  tokens: 11101
  tasks: 2
  commits: 3
tech-stack:
  added: []
  patterns:
    - Root-scoped Node filesystem capabilities with validated components and stable symlink rejection
    - Positive npm publication allow-list and directory-wide active-workflow containment scan
key-files:
  created:
    - tests/unit/root-scoped-fs.test.ts
    - tests/integration/init-typescript-tracer.test.ts
  modified:
    - src/filesystem/contained-fs.ts
    - package.json
    - vitest.config.ts
key-decisions:
  - "The existing capability API is now implemented with Node fs/path primitives; host permissions and sandboxes remain the OS boundary."
  - "Historical native source and workflows remain inspectable but are excluded from active build, test, package, and event entry points."
patterns-established:
  - "Active workflow checks derive forbidden native and retained-script references from repository contents."
requirements-completed: [SETUP-01, SETUP-02, SETUP-06, SETUP-07, ART-01, ART-02, ART-07, ART-08, ART-09]
coverage:
  - id: D1
    description: Node-backed CLI initialization from repository root and nested directories with additive reruns
    requirement: SETUP-02
    verification:
      - kind: integration
        ref: tests/integration/init-typescript-tracer.test.ts#initializes the containing Git root from root and nested directories
        status: pass
      - kind: integration
        ref: tests/integration/transaction-recovery.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Native-free package and active workflow entry points while historical containment material remains retained
    requirement: ART-02
    verification:
      - kind: integration
        ref: tests/integration/init-typescript-tracer.test.ts#rejects native containment entry points in active workflows
        status: pass
      - kind: other
        ref: npm pack --dry-run --json inventory assertion
        status: pass
    human_judgment: false
duration: 8min
completed: 2026-08-29
status: complete
---

# Phase 01 Plan 17: Pure TypeScript/Node Cutover Summary

**A root-scoped Node filesystem facade now drives initializer, transaction, and recovery behavior while native material is retained only as non-shipped historical evidence.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-08-29T08:53:56Z
- **Completed:** 2026-08-29T09:01:28Z
- **Tasks:** 2/2
- **Files modified:** 12

## Accomplishments

- Replaced the active native provider, support-row, manifest, and binary-loading seam with a Node `fs`/`path` capability implementation that preserves the existing reader, directory, file, and root contracts.
- Added fresh root/nested compiled-CLI, additive-rerun, invalid-JSON no-mutation, and root-scoped symlink-rejection evidence for the TypeScript path.
- Restrained active package, build, test, and GitHub Actions surfaces to TypeScript/Node while retaining native files and the three disabled containment workflow bodies as historical provenance.

## Task Commits

1. **Task 1: Run the initializer through the Node-backed filesystem capability seam** — `63c3f68` (`feat`)
2. **Task 2: Disconnect historical native material from active build, test, package, and workflow entry points** — `2782abe` (`chore`)
3. **Rule 1 follow-up: atomically publish ownership test signal** — `8c95e31` (`fix`)

## Files Created/Modified

- `src/filesystem/contained-fs.ts` — Node-backed root-scoped capability facade with component, file-kind, and symlink checks.
- `src/filesystem/ownership.ts` — Atomically publishes the process-interruption test signal.
- `src/init/run-init.ts` — Describes repository access instead of a bundled provider in preflight failures.
- `tests/unit/root-scoped-fs.test.ts` — Node-backed root and symlink safety proof.
- `tests/integration/init-typescript-tracer.test.ts` — Fresh CLI and workflow-entry-point tracer.
- `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts` — Node 22/24 contract and native-free active build/test/package configuration.
- `.github/workflows/containment*.yml` — Retained historical workflow bodies with `on: {}` only.

## Decisions Made

- Keep the existing capability surface so transaction, ownership, and recovery consumers remain unchanged; it now uses deterministic Node filesystem operations rooted at the resolved repository.
- Treat Claude Code, Codex, and OpenCode permissions and sandboxing as the OS boundary; the implementation does not claim kernel-level or hostile-peer race containment.
- Use an explicit package allow-list rather than publishing all of `dist`, preventing stale native and support-matrix artifacts from being shipped.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Atomically publish the killed-process ownership signal**
- **Found during:** Plan-level full-suite verification
- **Issue:** The test process could observe the signal file after it was created but before JSON writing finished, yielding intermittent malformed JSON.
- **Fix:** Write the signal to a sibling temporary file and atomically rename it into place.
- **Files modified:** `src/filesystem/ownership.ts`
- **Verification:** Focused recovery suite and the full active suite passed.
- **Committed in:** `8c95e31`

---

**Total deviations:** 1 auto-fixed (1 Rule 1 bug)
**Impact on plan:** Required for deterministic interruption-recovery evidence; no scope expansion.

## TDD Gate Compliance

The Task 1 tracer was written and observed failing against the native provenance before implementation. Its red and green changes were committed together in the task-level atomic commit rather than as separate TDD commits.

## Issues Encountered

- The initial root-scoped behavior test passed through the retained native bundle, so its provenance assertion was tightened before implementing the Node seam.
- A stale `dist/filesystem/support-matrix.*` output remained on disk after TypeScript exclusion; the npm allow-list was made explicit so it cannot enter the published candidate.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Revised 01-18 can validate the lean installed-package and representative compatibility closure against this pure TypeScript/Node cutover.
- Native source, tests, scripts, workflows, evidence, and Plans 01-19/01-20 remain untouched historical material and are not TypeScript-path completion evidence.

## Self-Check: PASSED

---
*Phase: 01-initialize-canonical-projects*
*Completed: 2026-08-29*
