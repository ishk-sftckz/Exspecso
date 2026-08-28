---
phase: 01-initialize-canonical-projects
plan: 10
subsystem: filesystem
tags: [node-api, posix, containment, tracer, checkpoint]
status: halted
halt_reason: incomplete-plan-resumed-at-task-3
checkpoint_type: execution-continuity
tasks_completed: 2
tasks_total: 3
plan_complete: false
requires:
  - phase: 01-09
    provides: Explicit approval of the resolved portable repair contract
provides:
  - Verified macOS arm64 installed POSIX promotion tracer (Task 1 only)
affects: [01-11, 01-12, 01-13, 01-14, 01-15, 01-16, 01-17, 01-18]
actuals:
  tasks: 2
  commits: 4
tech-stack:
  added: [Direct C Node-API 8 addon with Apple clang 17 and Node 20.19.0 headers]
  patterns: [Opaque directory capabilities, private sibling replacement, bundled fixed-manifest loader]
key-files:
  created: [native/contained-fs.cc, native/contained-fs-posix.cc, native/build.mjs, src/filesystem/contained-fs.ts, tests/unit/contained-fs.test.ts, tests/helpers/containment-fixture.ts, .github/workflows/containment-posix-tracer.yml]
  modified: [src/filesystem/transaction.ts, src/init/run-init.ts, tests/integration/init-codex-tracer.test.ts]
key-decisions:
  - Preserve the approved eight-row contract; this is only the first host tracer.
  - Reject unavailable providers before ownership or recovery mutates a project.
  - Label instrumented native barriers and moved-object limitations explicitly.
patterns-established: [Source hashes bind a remote CI snapshot to the local verified Task commit without uploading unrelated history]
requirements-completed: []
requirements-addressed: [SETUP-01, SETUP-02, SETUP-06, ART-01, ART-07]
duration: Tasks 1–2 checkpoint; plan remains incomplete
checkpoint_date: 2026-08-28
---

# Plan 01-10 — Tasks 1–2 checkpoint summary (not plan completion)

**The installed macOS arm64 initializer uses native bound replacement; 18 focused tests and 74 regression tests pass. Windows native parity is verified; Task 3 remains pending.**

## Completed Tasks

1. Task 1: provider seam and POSIX vertical tracer — RED `bbe2e5d`; GREEN `f2280b0`.
2. Task 2: Windows handle-relative parity — RED `240e636`; GREEN `0093733`. Native Windows 11/11, macOS focused 21/21 and regression 77/77 passed in run 33144287790. See `01-10-WINDOWS-REVIEW.md` and saved evidence.

The real hardlink overwrite was observed against the old installed CLI before correction. The new native provider and loader, real transaction integration, isolated instrumented tracer and release E2E are verified on the approved hosted macOS environment. See `01-10-TRACER-REVIEW.md` for the exact tests, limitations, provenance and human review question.

## Verification

- CI run 33143078424, snapshot `e06f4dd504ac7f892b745bacd592e26003687f07`, job 98758036832: success.
- `npm test -- --run tests/unit/contained-fs.test.ts tests/integration/init-codex-tracer.test.ts --testTimeout 60000`: 18 passed, none failed or skipped.
- `npm test -- --run --testTimeout 60000`: 74 passed, none failed or skipped.
- Approved native environment and build pins match. The downloaded host binary matches its length and SHA-256. All 40 submitted source/config hashes match local GREEN source.
- Local TypeScript build, C++ syntax checks and loader-only incompatible-metadata/unsupported-OS negatives passed. No local native acceptance claim.
- Saved: raw job log, full reports, six actual native barrier records, source hash ledger, build provenance, manifest and host release binary in `01-10-EVIDENCE/`.

## Deviations from Plan

1. **Rule 2 — Missing critical preflight:** added the minimal provider availability check to `src/init/run-init.ts`. The outer initializer acquires ownership before `commitTransaction`; a check only inside the transaction could not satisfy Task 1's no-mutation behavior for a missing provider. This does not migrate reads or ownership to native operations.
2. **Rule 3 — Required execution environment:** added the scoped CI workflow now, because the local Mac is development-only and lacks the approved acceptance OS/toolchain. The approved hosted Mac supplies Task 1 evidence. Plan 11 still owns the full matrix and evidence gate.
3. **Rule 1 — Workflow authoring error:** the first CI submission used an unavailable runner context at job-level env and was rejected before jobs. Corrected the variable setup; later jobs passed. No support assertion or test was weakened.
4. A `status: halted` checkpoint summary is committed because GSD requires a summary after production commits. It deliberately records 2/3 tasks and blocks downstream plans; it is not a completion marker. Resume this incomplete plan at Task 3, not at Plan 11.

## Remaining Work / Stop Condition

The user replied exactly `approve` on 2026-08-28 to the verified Task 1 slice; the required tracer feedback gate is satisfied. Task 2 is verified. Task 3 (expanded installed tracer, including complete historical vulnerable-CLI grid reproduction and Windows installed CLI evidence) remains pending. The partial host package is not release-ready. Reads/staging/ownership/journal/recovery/cleanup still include pathname operations and remain Plans 12–15 work. Linux and other platforms, the full Node matrix, diagnostics, packaging and closure gates remain pending.

## Resume

Read `.continue-here.md`, `01-10-TRACER-REVIEW.md`, the approved SUPPORT contract and `01-10-PLAN.md`. The tracer approval is recorded. Continue Task 3 without redoing Tasks 1–2 or re-requesting either approval. Preserve the halted summary until the plan is actually complete; explicitly resume the current checkpoint rather than relying on summary-file counts.


## Task 3 partial continuity — not completion

Task 3 has uncommitted historical/installed test infrastructure. Run 33144791900 reproduced all three historical external writes on macOS and passed macOS 21 focused / 77 regression tests; Windows provider 11/11 passed, but the historical Windows CLI failed at its initial normal invocation before reaching a race. No Windows installed tracer pass is claimed. Evidence is retained in `01-10-EVIDENCE/task-3-in-progress/`. The user then raised a Trusted Access platform banner; new test runs paused for account-access clarification. See `.continue-here.md` for exact resume details and the concurrent user commit that must be preserved. Plan remains 2/3 tasks, Phase 1 remains 9/18 plans, and both prior approvals remain recorded.

## Task 3 final checkpoint — still not completion

Run [33147542007](https://github.com/ishk-sftckz/exspecso/actions/runs/33147542007), snapshot `efca644df1a38ca601a1e80cab1fbd07e0da0d9a`, corrected the historical Windows fixture and reproduced all three historical installed external-write REDs on both hosts. macOS then passed the installed tracer 21/21 and full regression 94/94. Windows provider parity passed 11/11 and uninstrumented release TR-02 completed with the actual installed provider hash `72b186cc3291de679eed6e27cd14e85cc8b5d2b2f1e61ec91cf76edfaf7a94cd`.

The mandatory Windows Mode B operation observation remains unproven: its three leaf/parent/ancestor tests timed out in the native acknowledgement barrier (Windows tracer 8/11 passed, 3/11 failed). This is neither an expected historical RED nor provider-safety evidence. The final authorized named-pipe transport, prior transport diagnostics, raw log, reports, host binaries, provenance and source hashes are retained in `01-10-EVIDENCE/task-3-in-progress/33147542007/`; `01-10-TASK-3-WINDOWS-BLOCKER.md` defines the exact replanning boundary. Do not weaken the oracle or infer this proof from release-only runs.
