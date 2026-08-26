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
| 1-00-01 | 00 | 0 | SETUP-01–08, ART-01–09 | T-1-01 / T-1-04 | Test harness isolates repositories and supports deterministic fault injection | infrastructure | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 1-01-01 | 01 | 1 | SETUP-01, SETUP-02 | T-1-01 | All resolved targets remain inside the containing Git root | integration | `npm test -- --run tests/integration/init-root.test.ts tests/integration/init-nested.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | SETUP-03, SETUP-04 | — | Runtime detection never grants selection authority | unit + integration | `npm test -- --run tests/unit/runtime-selection.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | SETUP-05, SETUP-08 | T-1-02 | Only explicitly selected native adapter targets are written | unit | `npm test -- --run tests/unit/adapters.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | SETUP-06, ART-05, ART-09 | — | Init does not materialize deferred workflow artifacts or duplicate Roadmaps | integration | `npm test -- --run tests/integration/minimal-artifacts.test.ts` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 2 | SETUP-07 | T-1-02 | Modified or unowned adapters are preserved and all conflicts preflight before writes | integration | `npm test -- --run tests/integration/init-rerun.test.ts` | ❌ W0 | ⬜ pending |
| 1-04-01 | 04 | 1 | ART-01, ART-02, ART-03, ART-04, ART-06 | T-1-03 | Artifact resolution rejects duplicate IDs and preserves stable identity across renames | unit | `npm test -- --run tests/unit/artifacts.test.ts` | ❌ W0 | ⬜ pending |
| 1-05-01 | 05 | 2 | ART-07 | T-1-01 / T-1-04 | Interrupted promotion retains or restores the last fully valid artifact set | integration | `npm test -- --run tests/integration/transaction-recovery.test.ts` | ❌ W0 | ⬜ pending |
| 1-05-02 | 05 | 2 | ART-08 | T-1-03 | Validation aggregates stable, actionable diagnostics and exits nonzero without mutation | integration | `npm test -- --run tests/integration/validation-errors.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json`, `tsconfig.json`, and package bin entry — Node package baseline
- [ ] `vitest.config.ts` and `npm test` script — Vitest execution contract
- [ ] `tests/helpers/git-fixture.ts` — isolated temporary Git repository fixture
- [ ] `tests/helpers/run-cli.ts` — child-process CLI harness with cwd/stdin/env control
- [ ] Transaction fault-injection seam — deterministic failure after every promotion step

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Interactive checkbox rendering, empty-submit explanation, and cancellation | SETUP-03, SETUP-04 | Terminal interaction behavior depends on a real TTY | Run `npx exspecso init` in a temporary Git repository; verify all runtimes begin unchecked, detected runtimes are labels only, empty submission re-prompts, and cancellation writes nothing. |
| Current package legitimacy for `vitest@4.1.11` and `@inquirer/prompts@8.6.0` | SETUP-03, ART-08 | Research freshness heuristic requires human confirmation | Inspect npm provenance, repository links, publication history, maintainers, and lifecycle scripts before installation; record approval in the execution checkpoint. |
| Cross-platform recovery claim | ART-07 | Process interruption can be automated locally, but filesystem durability claims require platform evidence | Run the recovery suite on the declared V1 OS/filesystem matrix and document which failure modes are proven; do not claim physical power-loss durability without evidence. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
