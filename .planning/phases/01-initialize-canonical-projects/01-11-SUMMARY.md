---
phase: 01-initialize-canonical-projects
plan: 11
subsystem: native containment tracer
tags: [native, ci, tracer, evidence, blocked]
status: blocked
plan_complete: false
dependency_graph:
  requires: [01-10]
  provides: [approved-target-matrix, rejecting-evidence-gate]
  affects: [01-12]
tech_stack:
  added: []
  patterns: [pinned-native-target-matrix, source-and-hash-bound-evidence]
key_files:
  created: [native/support-matrix.json, scripts/containment-evidence.mjs, scripts/write-containment-evidence.mjs]
  modified: [native/build.mjs, native/windows-preflight.ps1, src/filesystem/contained-fs.ts, .github/workflows/containment.yml, tests/unit/containment-evidence.test.ts]
decisions:
  - Kept all eight approved rows mandatory; unsupported musl filesystem observation remains a blocker.
  - Bound musl provenance to the reviewed temporary GitHub snapshot rather than installing Git in the pinned builder.
metrics:
  duration: blocked after six hosted all-target runs
  completed_date: 2026-08-28
actuals:
  tokens: 10987
  tasks: 0
  commits: 8
---

# Phase 01 Plan 11: Native Target Matrix Summary

Implemented the native target matrix and rejecting evidence gate, but Plan 11 is blocked because both mandatory native-musl tracer rows observe filesystem `UNKNOWN` inside the approved pinned Alpine runtime and are correctly rejected.

## Work Completed

- Added the eight-row machine-readable approved matrix and a bounded GitHub Actions workflow that builds release/test native providers and runs the installed tracer on macOS ARM64/x64, Windows ARM64/x64, Linux glibc ARM64/x64, and Linux musl ARM64/x64.
- Added a rejecting tracer evidence aggregate and unit fixtures for missing, failed, skipped, cancelled, stale, wrong-hash, duplicate/conflicting, and emulated records.
- Extended fixed target recognition only to the eight approved tuples, including direct Windows ARM64 tooling and native musl builds.
- Added source-commit, provider-hash, evidence-mode, Node/provider-N-API, compiler, OS/kernel, filesystem, libc, and tracer-ID evidence fields.

## Hosted Evidence

Latest guarded temporary snapshot: `587ab446eecb6a5681cf61f651781c3e9c463989` on `codex/containment-native-matrix-20260828`; no remote main push occurred.

Run [`33152941157`](https://github.com/ishk-sftckz/exspecso/actions/runs/33152941157) was the final six-run diagnostic matrix:

| Required row | Result | Evidence |
| --- | --- | --- |
| ENV-MA | passed | installed native tracer artifact saved |
| ENV-MX | passed | installed native tracer artifact saved |
| ENV-WX | passed | installed native tracer artifact saved |
| ENV-WA | passed | installed native tracer artifact saved |
| ENV-LGX | passed | installed native tracer artifact saved |
| ENV-LGA | passed | installed native tracer artifact saved |
| ENV-LMX | blocked | installed tracer rejects observed filesystem `UNKNOWN` |
| ENV-LMA | blocked | same observed filesystem contract failure |

Artifacts, tracer JSON, Windows preflight observations, native binaries, and hashes are saved under `01-11-EVIDENCE/33150842384`, `01-11-EVIDENCE/33152481297`, and `01-11-EVIDENCE/33152941157`.

## Verification

- `npm run build` — passed.
- `npm test -- --run tests/unit/containment-evidence.test.ts` — passed (10 tests).
- `node --check native/build.mjs` and `node --check scripts/write-containment-evidence.mjs` — passed.
- Workflow YAML parse and `git diff --check` — passed.
- Actual aggregate — intentionally not run as green: required ENV-LMX and ENV-LMA records are absent/failed, so the aggregate must reject them.

## Blocker

The pinned native Linux CPU runners and pinned Alpine images are available; their release providers compile with musl 1.2.6 and execute the installed test. The loader's exact runtime observation is:

`6.17.0-1022-azure/UNKNOWN/musl libc ... Version 1.2.6`

The approved musl target contract requires the supported filesystem form (`ext4` / observed `ext2/ext3`), so accepting `UNKNOWN` would weaken the evidence contract. No fallback, emulation, row removal, or Plan 12 work was performed.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 2 - Critical target recognition]** Added only the approved Linux and Windows ARM64/x64 target branches to the fixed loader/build path. Commit `a855320`.
2. **[Rule 1 - Native build defects]** Fixed the POSIX test-barrier `<array>` include, Windows ARM64 SDK library architecture, and Alpine header fetch primitive. Commit `fc71b71`.
3. **[Rule 1 - musl version semantics]** Preserved musl's `ldd --version` output when its documented command exits one. Commit `34ddb34`.
4. **[Rule 1 - provenance]** Bound musl build/evidence records to the reviewed snapshot without adding a package. Commit `393d85e`.
5. **[Rule 1 - loader runtime]** Applied the musl version semantics to the installed provider loader. Commit `a3843e0`.
6. **[Rule 1 - evidence integrity]** Recorded provider N-API 8 separately from Node 20.19.0 runtime N-API 9 and exposed the rejecting musl tuple. Commit `ddff8f4`.

## Next Step

Obtain an explicit approved change to the exact musl filesystem primitive/observation, or provision an approved native-musl environment whose runtime package filesystem reports the required ext2/ext3 form. Then rerun all eight rows from one guarded snapshot and run the aggregate over the downloaded records. Do not delete or relax ENV-LMX/ENV-LMA.

## Self-Check: PASSED

- Commits `db01aae`, `a855320`, `fc71b71`, `34ddb34`, `393d85e`, `a3843e0`, and `ddff8f4` exist.
- The final hosted artifacts and source changes exist on disk.
