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
| 1-01-03 | 01 | 1 | ART-03 | T-01-02 | Public ID vocabulary is explicit before encoding | decision | `node -e "const r=9;if(r!==9)process.exit(1)"` | n/a | ⬜ pending |
| 1-02-01 | 02 | 2 | SETUP-01, SETUP-05, SETUP-06, SETUP-08, ART-01, ART-02 | T-02-01 / T-02-03 | Packed CLI proves one contained canonical+Codex path | integration | `npm test -- --run tests/integration/init-codex-tracer.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | SETUP-01, SETUP-02 | T-02-01 | Root/nested/no-repository targeting is exact and zero-write on error | integration | `npm test -- --run tests/integration/init-codex-tracer.test.ts` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 3 | SETUP-03, SETUP-04 | T-03-01 | Detection never grants selection authority | unit + TTY human | `npm test -- --run tests/unit/runtime-selection.test.ts` | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 3 | SETUP-05, SETUP-08 | T-03-02 / T-03-04 | Only explicitly selected native adapter targets/invocations are produced | unit | `npm test -- --run tests/unit/adapters.test.ts` | ❌ W0 | ⬜ pending |
| 1-04-01 | 04 | 4 | ART-01–06, ART-09 | T-04-01 / T-04-03 | IDs resolve deterministically; duplicates select none; renames preserve identity | unit | `npm test -- --run tests/unit/artifacts.test.ts` | ❌ W0 | ⬜ pending |
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
