---
phase: 01-initialize-canonical-projects
plan: 10
subsystem: filesystem
tags: [node-api, posix, windows, containment, installed-tracer]
status: complete
tasks_completed: 3
tasks_total: 3
plan_complete: true
requires:
  - phase: 01-09
    provides: Explicit approval of the portable repair contract
provides:
  - Installed native-promotion tracer evidence on macOS and Windows
  - Test-only Windows native named-pipe barrier with bounded authenticated acknowledgement
affects: [01-11, 01-12, 01-13, 01-14, 01-15, 01-16, 01-17, 01-18]
tech-stack:
  added: [Direct C Node-API 8 addon, Windows named pipes, BCrypt CSPRNG, explicit Windows DACL]
  patterns: [Opaque directory capabilities, private sibling replacement, fixed-manifest loader, separate release and instrumented packages]
key-files:
  created: [native/contained-fs.cc, native/contained-fs-posix.cc, native/contained-fs-win.cc, native/build.mjs, src/filesystem/contained-fs.ts, tests/helpers/containment-fixture.ts]
  modified: [src/filesystem/transaction.ts, tests/integration/init-codex-tracer.test.ts, 01-10-PLAN.md]
key-decisions:
  - Windows test barriers use a native-owned, fixed named-pipe protocol; release binaries contain neither its activation names nor its system-library linkage.
  - A Windows directory rename blocked by EPERM is reported as blocked-before-relocation, not as moved-object proof.
  - NP-02 remains the separate moved-object proof; Plan 17 retains the complete matrix/evidence gate.
requirements-completed: []
requirements-addressed: [SETUP-01, SETUP-02, SETUP-06, ART-01, ART-07]
actuals:
  tasks: 3
  commits: 9
completed: 2026-08-28
---

# Phase 01 Plan 10: Native Promotion Tracer Summary

**The packed initializer now proves its native promotion boundary on both approved hosts, with a Windows test-only named-pipe controller that cannot alter the release provider.**

## Completed Tasks

1. **Task 1:** Provider seam and POSIX vertical tracer — RED `bbe2e5d`; GREEN `f2280b0`.
2. **Task 2:** Windows handle-relative parity — RED `240e636`; GREEN `0093733`.
3. **Task 3:** Real isolated installed initializer tracer — historical fixture RED `f8cb402` / `8b2af54`; native barrier GREEN `002085b`; final target revalidation `4573434`; Windows relocation-feasibility oracle `9a2c667`.

## Task 3 Evidence

The final bounded snapshot was `0af7365726d0a43ba8fb4d9a2b27a8dda46e37a9`, tested by [GitHub Actions run 33149316926](https://github.com/ishk-sftckz/exspecso/actions/runs/33149316926). The guarded uploader sent only the reviewed snapshot allowlist to temporary branch `codex/containment-windows-parity-20260828`; it did not push local history or the default branch.

- macOS: installed tracer **22/22**, full regression **95/95**. The saved artifact includes the test and release manifest/provenance records.
- Windows: provider suite **11/11** and installed tracer **12/12**. The historical installed vulnerable fixture still produces all three intentional leaf/parent/ancestor external-write REDs; they are recorded separately and were not counted as a safety pass.
- The instrumented controller receives exactly `{op, childpid, providerpath, nonce}`, validates the fixed operation, child PID, provider realpath, precomputed hash, and manifest, carries out the permitted attack, then sends exactly the nonce ACK. The native addon rejects partial/malformed activation before replacement, authenticates the named-pipe client PID, and bounds connect/write/ACK under its ten-second monotonic deadline.
- The release E2E is distinct from the instrumented package. Its Windows provider is SHA-256 `1a705cc5fceb099aa7964329359abbfa6188535fdd2565af4d1d6f4f61ec01c4`, 183296 bytes; its dependency inventory has only `node.exe` and `KERNEL32.dll`. The test variant alone links `bcrypt` and `ADVAPI32`. The installed test also scans the release binary and finds none of the activation-variable, endpoint, protocol, or BCrypt strings.
- The old `STARTUPINFO.lpReserved2` / CRT descriptor-table and fd/stdio discovery code is absent. The test-only Windows endpoint is derived only as `\\.\\pipe\\exspecso-containment-<64-lower-hex-channel>` by the addon and has a current-user/logon-SID plus SYSTEM DACL, message mode, remote-client rejection, and first-instance protection.

Raw reports and downloaded host artifacts are under `01-10-EVIDENCE/task-3-in-progress/33149316926/`. The Windows report records the provider, historical RED, active tracer, environment, SDK declarations, manifest, and provenance; macOS records tracer, regression, historical RED, manifest, and provenance.

## Windows Mode B Oracle Resolution

All three current-boundary cases reached the native barrier and validated the loaded provider path/hash. The leaf swap then fails its final no-follow target re-open, exits nonzero, and does not promote the swapped destination.

On the hosted Windows runner, parent and ancestor directory moves are blocked at the **directory-rename** stage with `EPERM` before relocation. The tests therefore report `attackOutcome: "blocked-before-relocation"`, `relocationPerformed: false`, and `movedObjectOracle: "not exercised"`. They assert that the original source remains a non-reparse directory, the moved root is absent, external sentinel and inventory are unchanged, no replacement root was promoted, the canonical target retains original-tree bytes, and the CLI exits zero. This is a genuine blocked attack result, not a moved-object limitation proof and not a release-only inference. NP-02 remains the separately passed moved-object evidence; Plan 17 still owns its required broader evidence gate.

## Verification

- `npm run build` passed locally.
- `clang++ -std=c++17 -fsyntax-only -DNAPI_VERSION=8 -DNODE_GYP_MODULE_NAME=contained_fs -I /opt/homebrew/include/node native/contained-fs.cc` passed locally.
- `git diff --check` passed locally.
- The local installed-tracer acceptance command was intentionally not treated as evidence because this development machine lacks the approved Node 20 header tarball. Hosted run 33149316926 supplied the required native Windows and macOS acceptance environments.

## Deviations from Plan

1. **Rule 2 — secure Windows test transport:** replaced the failed undocumented CRT descriptor bridge with a native-owned fixed named-pipe protocol. This is test-variant-only and removes arbitrary endpoint, provider, and output authority. Commit `002085b`.
2. **Rule 1 — final target race revalidation:** reopened the promotion target with no-follow semantics after the barrier, so the leaf replacement attack rejects the swapped reparse point before native rename. Commit `4573434`.
3. **Rule 1 — accurate blocked-relocation oracle:** constrained the Windows `EPERM` path to parent/ancestor directory-renames and recorded it as blocked before relocation with no moved-object claim. Commit `9a2c667`.
4. **Rule 3 — one concrete feedback verification:** after the first hosted run exposed an unverified leaf destination and an inaccurately represented EPERM outcome, one final approved hosted run verified only those repair/oracle changes. No test was weakened.

## Review

The earlier review verdict was **REVISE**, with the named-pipe replacement and exact relocation assertions required. Those adjustments are present and CI-verified in run 33149316926. Review outcome for Task 3: **PASS**. No additional human approval was requested or used.

## Known Limits and Remaining Gates

This is a bounded tracer, not a complete release-security claim. Reads, staging, ownership, journal, recovery, cleanup, all-target packaging, and complete matrix closure remain in later plans. The parent/ancestor Windows directory move was blocked before relocation, so it cannot substitute for NP-02's independently exercised moved-object result.

## Self-Check: PASSED

The native sources, test/controller changes, task review, final reports, and task commits listed above exist in the repository. No known stub, skipped required test, or unrun accepted verification remains for Task 3.
