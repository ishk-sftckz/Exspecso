---
phase: 01-initialize-canonical-projects
plan: 11
subsystem: native containment tracer
tags: [native, ci, tracer, evidence, all-targets]
status: complete
plan_complete: true
dependency_graph:
  requires: [01-10]
  provides: [approved-target-matrix, rejecting-evidence-gate, native-tracer-proof]
  affects: [01-12]
tech_stack:
  added: []
  patterns: [pinned-native-target-matrix, source-hash-and-observation-bound-evidence, operation-root-filesystem-preflight]
key_files:
  created: [scripts/capture-filesystem-observation.mjs]
  modified: [src/filesystem/contained-fs.ts, scripts/write-containment-evidence.mjs, scripts/containment-evidence.mjs, .github/workflows/containment.yml, tests/unit/contained-fs.test.ts, tests/unit/containment-evidence.test.ts, tests/helpers/containment-fixture.ts, tests/helpers/git-fixture.ts, tests/integration/init-codex-tracer.test.ts]
decisions:
  - Linux filesystem eligibility is measured at the real resolved operation root, while the package root remains only a manifest and hash location.
  - Observed libc is recorded separately from policy libc and must match before the aggregate emits a green result.
  - The full matrix is accepted only from downloaded per-row artifacts bound to one guarded snapshot and matrix revision.
metrics:
  duration: completed after diagnostic and final hosted matrix runs
  completed_date: 2026-08-28
actuals:
  tokens: 21261
  tasks: 2
  commits: 7
---

# Phase 01 Plan 11: Native Target Matrix Summary

All eight approved native target rows ran the installed release tracer on native hosted runners, and the rejecting aggregate accepted the downloaded evidence from one guarded snapshot.

## Completed Work

- Materialized and enforced the exact eight-row target matrix for macOS ARM64/x64, Windows ARM64/x64, Linux glibc ARM64/x64, and Linux musl ARM64/x64.
- Moved Linux eligibility to the resolved fixture operation root using `fs.statfsSync(..., { bigint: true })`. Only normalized magic `0x0000ef53` maps to the approved `ext2/ext3` contract; overlay, unknown, absent, and mismatched observations reject.
- Made fixtures deterministic through the strict test-only temporary-root input and placed musl fixtures at `/work/.ci-fixtures`, inside the native host bind mount.
- Captured `filesystem-observation.json` for the fixture root, `/work`, and `/tmp`; evidence now consumes the operation-root observation rather than a provider-static filesystem value.
- Bound policy libc and separately observed libc, provider/build SHA-256, Node/provider-N-API, OS/kernel, compiler/toolchain/image, matrix revision, source snapshot, installed tracer IDs, and evidence mode into every record.
- Preserved mandatory rejection for missing, failed, skipped, cancelled, stale, wrong-hash, duplicate/conflicting, emulated, overlay, unknown, and policy/observation-mismatched records.

## Hosted Native Proof

Guarded temporary branch: `codex/containment-native-matrix-20260828`. Remote `main` was not pushed.

Final run: [33155426835](https://github.com/ishk-sftckz/exspecso/actions/runs/33155426835) from snapshot `371e0a56bf61acf56de0bceb46b5e8f61bead43b`, matrix revision `01-09-approved-2026-08-28`.

| Row | Native environment | Policy / observed libc | Operation-root observation | Provider SHA-256 | Result |
| --- | --- | --- | --- | --- | --- |
| ENV-MA | macOS 15.7.7 ARM64, kernel 24G720, APFS | system / system | n/a | `0f96f918…e4ede990e` | passed |
| ENV-MX | macOS 15.7.9 x64, kernel 24G830, APFS | system / system | n/a | `a104c910…3a81cf9f` | passed |
| ENV-WA | Windows 10.0.26200 ARM64, kernel 26200.9168, NTFS | system / system | n/a | `6ec2a41f…ee08c678` | passed |
| ENV-WX | Windows 10.0.26100 x64, kernel 26100.33296, NTFS | system / system | n/a | `a764ea5a…46138731` | passed |
| ENV-LGA | Ubuntu 24.04.4 ARM64, kernel 6.17.0-1022-azure, ext4 | glibc-2.39 / glibc 2.39 | `61267` / `0x0000ef53` / ext2/ext3 | `847a10f5…344f1bd1` | passed |
| ENV-LGX | Ubuntu 24.04.4 x64, kernel 6.17.0-1022-azure, ext4 | glibc-2.39 / glibc 2.39 | `61267` / `0x0000ef53` / ext2/ext3 | `985fae3e…e67cd5b2` | passed |
| ENV-LMA | Alpine 3.24 ARM64, kernel 6.17.0-1022-azure, ext4 | musl-1.2.6-r2 / musl-1.2.6-r2 | `61267` / `0x0000ef53` / ext2/ext3 | `497b8af3…455cda57` | passed |
| ENV-LMX | Alpine 3.24 x64, kernel 6.17.0-1022-azure, ext4 | musl-1.2.6-r2 / musl-1.2.6-r2 | `61267` / `0x0000ef53` / ext2/ext3 | `a7244661…df9a7d6b` | passed |

Every final record reports Node `20.19.0`, provider N-API `8`, runtime N-API `9`, evidence mode `release`, and equal provider/build SHA-256. The artifact records include the full compiler, toolchain, image, tracer, mountinfo, and hash values under `01-11-EVIDENCE/final-33155426835/`.

The downloaded aggregate result is:

```json
{"plan_complete":true,"stage":"tracer","matrixRevision":"01-09-approved-2026-08-28","sourceCommit":"371e0a56bf61acf56de0bceb46b5e8f61bead43b","rows":["ENV-LGA","ENV-LGX","ENV-LMA","ENV-LMX","ENV-MA","ENV-MX","ENV-WA","ENV-WX"]}
```

## Evidence and Verification

- `npm test -- --run tests/unit/containment-evidence.test.ts` — passed, 14 tests.
- `npm run build` — passed.
- `git diff --check HEAD~6..HEAD` — passed.
- `node scripts/containment-evidence.mjs --stage tracer --evidence-dir .planning/phases/01-initialize-canonical-projects/01-11-EVIDENCE/final-33155426835/aggregate-input` — passed with `plan_complete: true`.
- Downloaded diagnostic, failed full-matrix, repaired full-matrix, and final proof artifacts are retained in `01-11-EVIDENCE/` to preserve the strict rejection history and final proof.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 2 - Operation-root observation]** The loader originally observed the package root, which is `/tmp` inside the Alpine container rather than the mounted fixture operation root. It now resolves and observes only the operation root; package-root checks remain limited to manifest/provider hashing. Commits `2b95d42`, `3a2dff1`.
2. **[Rule 1 - Diagnostic workflow eligibility]** The first full dispatch exposed that GitHub Actions does not allow `matrix` in a job-level condition. Matrix jobs now gate at step level and require a passing musl diagnostic before the full dispatch. Commit `758fa9d`.
3. **[Rule 1 - Fixture/test semantics]** Test fixtures had to preserve the no-git test's intentionally external temporary root, while installed tracer fixtures use the strict configured root. Musl `ldd` output is captured without leaking to tracer stderr. Commit `b1ffff9`.
4. **[Rule 1 - Mount evidence]** Root mountinfo was omitted because `/` did not satisfy the non-root prefix rule. The capture script includes the root mount entry explicitly. Commit `aba572b`.
5. **[Rule 1 - libc schema binding]** Hosted evidence exposed `glibc 2.39` as the measured value while the matrix uses the policy token `glibc-2.39`. The record now keeps both fields and the aggregate verifies their required correspondence. Commit `3e602c5`.

No target row was removed, emulated, skipped, or accepted through a fallback. No new dependencies, global installs, paid services, credentials, publication, or remote-main push were used.

## Known Stubs

None.

## Self-Check: PASSED

- Commits `2b95d42`, `3a2dff1`, `758fa9d`, `b1ffff9`, `aba572b`, and `3e602c5` exist.
- Final artifacts, eight aggregate input records, and `aggregate-result.json` exist under `01-11-EVIDENCE/final-33155426835/`.
- The final aggregate is actual hosted-evidence proof, not a job-status substitution.
