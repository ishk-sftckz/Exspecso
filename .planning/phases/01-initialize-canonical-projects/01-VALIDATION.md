---
phase: 1
slug: initialize-canonical-projects
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-26
---

# Phase 1 — Validation Strategy

**Current routing (2026-08-28):** The original tables below are historical planning snapshots. Plans 01-01–08 are executed, with latest local build/62-test evidence in 01-08-SUMMARY. Old 09/10 source-install rows are superseded, not active. Use the Portable Replan section at the end and 01-CONTAINMENT-TEST-MATRIX.md for current pending evidence. Status stays draft/noncompliant until separate validation establishes otherwise.

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 (human package verification required before installation) |
| **Config file** | `vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~30 seconds initially; update after Wave 0 baseline |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run`
- **Before `$gsd-verify-work`:** Full suite, fault-injection coverage, and TTY/non-TTY smoke checks must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | ART-08 | T-01-SC | Vitest legitimacy approval precedes installation | package metadata + human | `npm view vitest@4.1.11 name version repository maintainers dist.integrity scripts --json` | n/a | ⬜ pending |
| 1-01-02 | 01 | 1 | SETUP-03 | T-01-SC | Inquirer legitimacy approval precedes installation | package metadata + human | `npm view @inquirer/prompts@8.6.0 name version repository maintainers dist.integrity scripts --json` | n/a | ⬜ pending |
| 1-02-01 | 02 | 2 | SETUP-01, SETUP-05, SETUP-06, SETUP-08, ART-01, ART-02 | T-02-01 / T-02-03 | Packed CLI proves one contained canonical+Codex path | integration | `npm test -- --run tests/integration/init-codex-tracer.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | SETUP-01, SETUP-02 | T-02-01 | Root/nested/no-repository targeting is exact and zero-write on error | integration | `npm test -- --run tests/integration/init-codex-tracer.test.ts` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 3 | SETUP-03, SETUP-04 | T-03-01 | Detection never grants selection authority | unit + TTY human | `npm test -- --run tests/unit/runtime-selection.test.ts` | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 3 | SETUP-05, SETUP-08 | T-03-02 / T-03-04 | Only explicitly selected native adapter targets/invocations are produced | unit | `npm test -- --run tests/unit/adapters.test.ts` | ❌ W0 | ⬜ pending |
| 1-04-01 | 04 | 4 | ART-01–06, ART-09 | T-04-01 / T-04-03 / T-04-06 | D-20's exact ten public families (`ROADMAP`, `PHASE-NNN`, `SPEC-NNN`, `REQ-NNN`, `AC-NNN`, `PLAN-NNN`, `TASK-NNN`, `DEC-NNN`, `FIND-NNN`, and `PAC-NNN`) resolve deterministically; `FINDING-NNN` and compatibility aliases fail; recognition stays lazy, duplicates select none, and renames preserve identity | unit | `npm test -- --run tests/unit/artifacts.test.ts -t "recognizes exactly|resolves every|FIND and PAC"` | ❌ W0 | ⬜ pending |
| 1-04-02 | 04 | 4 | ART-08 | T-04-01 / T-04-02 | Direct edits aggregate actionable diagnostics and never mutate | integration | `npm test -- --run tests/integration/validation-errors.test.ts` | ❌ W0 | ⬜ pending |
| 1-05-01 | 05 | 5 | SETUP-05, SETUP-07 | T-05-01 | Managed ownership requires a valid header and matching body hash | unit + integration | `npm test -- --run tests/unit/adapters.test.ts tests/integration/init-rerun.test.ts` | ❌ W0 | ⬜ pending |
| 1-05-02 | 05 | 5 | SETUP-07 | T-05-01 / T-05-03 | Rerun is additive; every conflict blocks all writes until explicit replacement | integration | `npm test -- --run tests/integration/init-rerun.test.ts` | ❌ W0 | ⬜ pending |
| 1-06-01 | 06 | 6 | ART-07 | T-06-01 / T-06-03 | Per D-19, every declared promotion step is covered by deterministic process interruption, injected exceptions, and killed-process recovery | integration | `npm test -- --run tests/integration/transaction-recovery.test.ts` | ❌ W0 | ⬜ pending |
| 1-06-02 | 06 | 6 | SETUP-06, ART-01, ART-02, ART-07, ART-08, ART-09 | T-06-02 / T-06-04 | Per D-19, recovery validates hashes/set or fails closed after the declared process-level faults; persistent tree stays minimal | integration | `npm test -- --run tests/integration/transaction-recovery.test.ts tests/integration/minimal-artifacts.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Plan 01 package-legitimacy checkpoints approve exact Vitest and Inquirer versions
- [ ] Plan 02 tracer creates `package.json`, `tsconfig.json`, package bin, and `npm test` script
- [ ] Plan 02 creates `tests/helpers/git-fixture.ts` and `tests/helpers/run-cli.ts`
- [ ] Plan 06 transaction exposes D-19 test control for deterministic process interruption, injected exceptions, and external child-process kill at every declared promotion step

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Interactive checkbox rendering, empty-submit explanation, and cancellation | SETUP-03, SETUP-04 | Terminal interaction behavior depends on a real TTY | Run `npx exspecso init` in a temporary Git repository; verify all runtimes begin unchecked, detected runtimes are labels only, empty submission re-prompts, and cancellation writes nothing. |
| Current package legitimacy for `vitest@4.1.11` and `@inquirer/prompts@8.6.0` | SETUP-03, ART-08 | Research freshness heuristic requires human confirmation | Inspect npm provenance, repository links, publication history, maintainers, and lifecycle scripts before installation; record approval in the execution checkpoint. |
| Filesystem-specific durability beyond D-19 | ART-07 | Phase 1 proves only deterministic process interruption, injected exceptions, and killed-process recovery at every declared promotion step | Record the OS/filesystem used for the automated suite and report only those process-level fault modes; physical power-loss durability and universal APFS/NTFS/ext4 guarantees require separate evidence and are not Phase 1 completion claims. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

## Additive Gap-Closure Validation — 2026-08-27

The original strategy and recorded failure evidence are retained. Plans 01-01 through 01-06 were executed; independent verification still found three blockers and unobserved TTY behavior. The rows below are planned evidence, not passing results. No new test scaffold is required: extend the existing suites and fixtures. Keep the draft/noncompliant frontmatter until the separate validation workflow establishes otherwise.

| Task ID | Plan | Wave | Requirement | Threat Ref | Required evidence | Automated command | Status |
|---|---|---|---|---|---|---|---|
| 1-07-01 | 07 | 7 | ART-03, ART-08 | T-07-01 | Exact invalid JSON parent through runInit; complete diagnostics and unchanged file/directory/symlink inventory | `npm test -- --run tests/integration/validation-errors.test.ts -t "invalid JSON parent"` | pending; reproduce red first |
| 1-07-02 | 07 | 7 | ART-03, ART-06, ART-08 | T-07-02/03 | Invalid declaration type matrix, mixed-error aggregation, valid resolution, no false artifact-ID error for project UUID | `npm test -- --run tests/unit/artifacts.test.ts tests/integration/validation-errors.test.ts tests/integration/init-codex-tracer.test.ts` | pending |
| 1-08-01 | 08 | 8 | SETUP-06, ART-01, ART-07 | T-08-01 | Writer at ready-to-promote and writer between idle observation/acquisition; losing recovery is busy without removing live evidence | `npm test -- --run tests/integration/transaction-recovery.test.ts -t "ownership race"` | pending; reproduce red first |
| 1-08-02 | 08 | 8 | ART-07, ART-08, ART-09 | T-08-02/03 | Competing stale reclaimers/new owner, killed-owner transitions, conservative legacy markers, retained D-19/no-op/minimal-tree matrix | `npm test -- --run tests/integration/transaction-recovery.test.ts tests/integration/minimal-artifacts.test.ts tests/integration/validation-errors.test.ts` | pending |
| 1-09-01 | 09 | 9 | ART-07 | T-09-SC | Explicit human approval of native source/build/install/platform implications; readonly Node API/environment evidence is not approval | See 01-09 Task 1 read-only Node command | blocked on human decision |
| 1-09-02 | 09 | 9 | ART-07 | T-09-01/04 | Actual native-backed transaction with final/parent/ancestor swaps at the final validation-to-syscall boundary; external sentinels unchanged | `node native/build.mjs && npm test -- --run tests/integration/transaction-recovery.test.ts -t "directory-bound promotion"` | pending approval; reproduce red first |
| 1-09-03 | 09 | 9 | SETUP-06, SETUP-07, ART-01, ART-02, ART-07, ART-08, ART-09 | T-09-02/03/05 | Recovery/cleanup/ownership namespace swaps and source-level D-19/JSON/rerun/minimal-tree matrix; source-install contract remains owned by 01-10 | `node native/build.mjs && npm run build && npm test -- --run tests/integration/transaction-recovery.test.ts tests/integration/minimal-artifacts.test.ts tests/integration/validation-errors.test.ts tests/integration/init-rerun.test.ts` | pending approval |
| 1-10-01 | 10 | 10 | SETUP-01, SETUP-06, ART-01, ART-07 | T-10-01/SC | Actual source tarball without .node, isolated normal-lifecycle installation, provider built/loaded from installed package, installed root init; no checkout/node_modules linkage | `npm test -- --run tests/integration/init-codex-tracer.test.ts -t "source install builds provider and initializes from root"` | pending 01-09 approval and implementation; reproduce red first |
| 1-10-02 | 10 | 10 | SETUP-01, SETUP-02, SETUP-06, SETUP-07, ART-01, ART-02, ART-07, ART-08, ART-09 | T-10-02/03/SC | Installed nested/root targeting, controlled removed-provider CLI refusal with complete repository byte/tree equality, unsupported source-build prerequisite failure, installation docs, and retained historical tracer cases | `npm test -- --run tests/integration/init-codex-tracer.test.ts` | pending 01-09 approval and implementation |

Use deterministic barriers rather than probabilistic timing; await killed-child exit before asserting recovery. Record initial failing regression output before correction and full green output afterward. Run focused non-watch checks after each task; split the build/test/package gate into its component commands if needed to preserve the 60-second feedback target without omitting a gate.

01-10 owns the final automated closure gate: run `npm run build`, `npm test -- --run`, and `npm pack --dry-run` separately. The full suite must execute the produced source tarball's isolated lifecycle-enabled installation, installed-provider load trace, root/nested CLI checks, and provider-unavailable zero-write regression. The dry-run proves contents only. Reuse the unmodified successful installation to keep focused feedback bounded; use separate installations for destructive negative cases. The shared run-cli helper remains unchanged; sanitize subprocess environments explicitly in the tracer.

After repairs, require independent phase verification, real-TTY selection UAT, acknowledgement of the four retained plus one new descriptor-less judgment prohibitions, and `$gsd-secure-phase 1`. Record the actual Node/OS/filesystem used. D-19 does not authorize power-loss or universal-filesystem claims. No planning update changes `01-VERIFICATION.md`, `01-REVIEW.md`, requirement completion, or Phase 2 readiness.


## Portable Replan — 2026-08-28 (current pending contract)

All new implementation evidence is pending. Retain the historical failure reports and existing tests. The complete catalogue contains 42 case families with explicit operation/site/transition/environment expansion; it is not a claim that 42 example tests alone are complete. Commands and oracles are in `01-CONTAINMENT-TEST-MATRIX.md`, consumed by each plan.

| Plan | Task scope | Required validation | Status |
|---|---|---|---|
| 09 | 1 approval | Read-only exact inputs plus explicit human boundary/matrix/provider/Node/evidence-mode decision | awaiting approval |
| 10 | 1–3 provider and tracer | NP-01/02, TR-01/02; real native POSIX and Windows installed promotion | pending 09 |
| 11 | 1–2 native matrix gate | Required ENV rows and GATE-01/02 tracer evidence | pending 10 |
| 12 | 1–2 bound reads | RD-01–04; artifacts/validation/rerun suites | pending 11 |
| 13 | 1–2 ownership/stage | OW-01–04, TX-01/02, RACE-02/03 | pending 12 |
| 14 | 1–2 promotion/restore | TX-03/04, RC-01–04; every actual write/transition and forced termination | pending 13 |
| 15 | 1–2 cleanup/native safety | CL-01/02, NP-03/04, EF-01/02; native diagnostics | pending 14 |
| 16 | 1–2 prebuilt package | PK-01–04; actual offline cached ignore-scripts install and negative cases | pending 15 |
| 17 | 1–2 full installed grid | RACE-01–06, AD-01/02, EF-01/02, ST-01, BASE-01; expanded inventory | pending 16 |
| 18 | 1–2 final evidence/docs | Exact final tarball across all lanes, rejecting aggregate, full build/test/pack gate | pending 17 |

Missing tests/fixtures/provider/CI files are intentionally created by their owning earlier tasks. No green test is inferred from a planned command. Keep existing suites/fixtures; new native-provider, evidence-aggregate and installed-race suites cover new boundaries only. Preserve baseline assertions, adapting platform termination mechanics without changing their meaning. Unit mocks and instrumentation do not substitute for uninstrumented package E2E; the exact evidence-mode limit must be accepted in 09.

Run focused non-watch tests at each task and full regression checks after meaningful integration. Shard large generated grids with explicit required-shard aggregation; provide progress during longer builds rather than omit cases to enforce a 60-second wall-clock cap. All native ENV rows require actual native execution; missing/skipped/cancelled/stale rows block support. Real-TTY and existing host smoke observations stay explicit human evidence. Full future host workflow conformance is still Phase 6.

After candidate evidence, require independent phase verification, real-TTY UAT, five judgment acknowledgements and `$gsd-secure-phase 1`. No physical power-loss, universal filesystem, strict lexical relocation prevention or arbitrary concurrent overwrite claim follows from this matrix. No requirement checkbox or Phase completion changes during planning.
