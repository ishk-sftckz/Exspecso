# Phase 01 — Portable containment replan

**Requested:** 2026-08-28
**Status:** Replan complete and independently checked after revision. Implementation not authorized.

## User intent and authority

The user asked to replan the serious post-validation symlink race while supporting all environments and providing complete tests. The previous macOS-only, end-user source-compilation proposal was not approved and is superseded for future execution. Prior approvals of the 01-07 and 01-08 tracers authorize neither that proposal nor a new native implementation.

This replan preserves Windows, macOS, and Linux as platform targets and Claude Code, OpenAI Codex, and OpenCode as first-class agent integrations. An explicit OS/CPU/Node/filesystem matrix must define the supported combinations. Proposed exclusions, minimum versions, dependencies, toolchains, and containment limitations need a visible decision before execution. A platform must not become nominally supported merely because it refuses every initialization attempt.

The preferred installation experience is one npm package with compatible prebuilt platform components included in the package: users need the declared Node/npm environment, not a compiler, Node headers, or a provider download during installation. This is a proposal to evaluate and approve, not a completed packaging feature or approval of a new dependency. Maintainer build tools and binary provenance must be explicit.

## Scope and preserved evidence

- Preserve completed plans 01-01 through 01-08 and their summaries without editing their historical contracts or evidence.
- Replace only unexecuted 01-09/01-10 and add further serial gap plans if necessary for bounded work. Git history preserves the superseded proposal.
- Preserve the original phase goal, all 17 requirements, D-01 through D-20, the 22 existing edge predicates, and five flagged judgment prohibitions. No Phase 2 work is introduced.
- Preserve CR-01/CR-02 repair evidence and the last independently verified local build plus 62-test baseline. They await independent phase re-verification; planning is not new passing evidence.
- CR-03 currently has a reproduced filesystem primitive and a reachable code path, not a reproduced full installed-CLI race. The repair must first obtain that regression.
- Do not modify application source, dependency files, historical verification/review reports, or requirement completion during replanning. No compiler installation, native build, CI dispatch, or publishing occurs during this work.

## Required safety contract

Protect the helper's reads and mutations against path redirection through substituted leaves and ancestors, across ownership, staging, journal/backup access, promotion, restoration, and cleanup. Do not replace the current gap with another pathname check/use gap. A lock coordinates Exspecso writers; it does not constrain another process that ignores the lock.

The design must distinguish a substituted pathname from relocation of an already-open original directory. Directory handles alone do not establish that the object still resides under its former pathname. Research must identify what each provider can enforce, include deterministic relocation tests, and surface any required stable-root or permission assumptions for human approval. Do not silently reinterpret “contained” to make an unprovable claim pass. Likewise consider hardlink aliases, mount/reparse traversal, and root replacement.

Keep D-18 conservative recovery: ambiguous evidence is retained and blocks writes. Keep D-19's declared process-interruption, exception, and killed-process boundary; do not claim physical power-loss durability or protection from all unrestricted agent shell actions. No unsafe fallback when a provider is missing, incompatible, or fails capability checks.

## Required test coverage

“Complete” means complete against a declared, reviewable contract and matrix, not proof of every possible OS, filesystem, or schedule. Every required row needs an executable owner, oracle, environment, command, and evidence status.

| Coverage family | Required evidence |
|---|---|
| Existing behavior | Retain all 62 baseline tests and their behavioral assertions; selected adapters only, canonical minimality, malformed declarations, root/nested Git targeting, additive reruns, ownership races, no-op behavior, and conservative recovery remain covered. |
| Real race regression | Run the real installed CLI with an independent adversary process and deterministic barriers at the last validation-to-operation boundary. Record a failing baseline before correction. Unit/provider tests supplement this evidence. |
| Redirection and relocation | Existing and newly created targets; leaf, immediate parent, higher ancestor, repository root; static links and racing substitutions; Windows junction/reparse cases; hardlink aliases; moved original directories. Assert external bytes and directory inventories, not just exit codes. |
| Every affected operation | Root acquisition, reads/validation, owner publication/reclamation/release, stage/temp creation, journal and backup reads/writes, each promotion, rollback/restore, and cleanup. Verify the tests actually reach the intended native boundary. |
| Interruption and recovery | Deterministic exceptions and actual killed child processes at every declared publication/promotion/restore transition; await termination; restart recovery, verify hashes/set or preserve ambiguous evidence. Include contention with a new live owner. |
| Packaged delivery | Build a real tarball; install in an isolated directory with no checkout/module/loader leakage; prove the installed provider is loaded. Verify installation works with lifecycle scripts disabled, without compiler/header tools or provider network retrieval. Ordinary dependency resolution is a separate npm concern. |
| Negative delivery cases | Missing/corrupt/wrong-architecture/incompatible provider, manifest mismatch, unsupported capability/environment: actionable error and no repository changes. Tampering tests use separate isolated installs. |
| Platform and agent matrix | Run on each required OS/CPU/Node/libc/filesystem row; exercise all three adapters and selection combinations. Generated adapters do not establish actual agent-host invocation: retain a separate smoke/manual evidence row where host automation is unavailable. |
| Faults and edge names | Permissions, read-only media, full disk/short writes and sharing violations where applicable; spaces, Unicode, case behavior, long names/paths, target-type changes, and concurrent ownership. Fault injection must be distinguished from real OS fault evidence. |
| Release gate | Aggregate required matrix evidence; failed, missing, skipped, cancelled, emulated-only, or stale rows cannot silently count as a pass. Record commit, tarball/provider hashes, OS, CPU, Node, libc, filesystem and commands. Missing runners remain a visible blocker to the corresponding support claim. |

Existing suites and fixtures should be extended where appropriate; new suites are justified for provider and installed adversarial boundaries absent from the current coverage. Stress tests supplement deterministic reproductions; arbitrary sleeps and mock-only success cannot close CR-03. Tests may not weaken approved assertions or change the security boundary merely to pass.

## Planning and execution gates

### Read-only dependency evidence observed during replanning

On 2026-08-28, the installed `node_modules/@inquirer/prompts/package.json` for version 8.6.0 declares Node `>=23.5.0 || ^22.13.0 || ^20.17.0`. Installed Vitest 4.1.11 declares `^20.0.0 || ^22.0.0 || >=24.0.0`. The top-level package still declares `>=20`. Therefore Node 20.0 and 22.0 compatibility cannot be inferred from that declaration or the previous successful Node 20.19.5 run. The approval proposal must account for the runtime dependency's range and distinguish maintainer test-tool requirements; any engine correction remains a proposed public compatibility change. No dependency or engine was changed during this inspection.

### Remaining gates

Research the cross-platform primitives and release matrix, then create bounded serial plans with a leading human contract decision and an early real vertical tracer. A failed feasibility test must stop expansion. Independent plan checking must verify coverage, dependencies, threat models, installation reality, and claim limits.

After implementation, full local checks alone do not close this gap: require matrix evidence, independent phase verification, real-TTY UAT, the existing judgment acknowledgements, and the security audit. Until then Phase 1 remains incomplete and Phase 2 is not ready.

## Proposed execution sequence

| Plans | Outcome |
|---|---|
| 09 | Approve the exact proposed safety/support/Node/provider/evidence contract |
| 10–11 | Prove a real native tracer on POSIX and Windows, then every approved target |
| 12–15 | Migrate reads, ownership, staging, promotion, recovery and cleanup; verify native safety |
| 16–17 | Prove prebuilt isolated installation and the expanded 42-family test matrix |
| 18 | Require one final package hash across native evidence and independent closure |

See `01-CONTAINMENT-SUPPORT.md` for the eight proposed target families and pending choices, and `01-CONTAINMENT-TEST-MATRIX.md` for 42 case families, owners, commands, oracles and expansion rules. All new test results are pending.

Planning verification is recorded in `01-CONTAINMENT-PLAN-CHECK.md`. No new containment implementation or platform test ran during this replan.
