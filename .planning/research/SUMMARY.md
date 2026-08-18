# Project Research Summary

**Project:** Exspecso  
**Domain:** Local-first, artifact-grounded harness engineering for AI coding agents  
**Researched:** 2026-08-18  
**Confidence:** MEDIUM

## Executive Summary

Exspecso is a local-first delivery harness, not another agent runtime or project-management application. Its job is to make approved intent survive planning, implementation, verification, correction, interruption, and a switch between Claude Code, Codex, and OpenCode. Experts build this kind of product around a visible canonical artifact graph, a small deterministic transition engine, and thin runtime-native command shims. Markdown and small JSON in the repository remain the sole project truth; Git provides durable verified-task checkpoints.

The V1 recommendation is one ESM-only TypeScript/Node CLI installed with `npx exspecso init`. Build the artifact/state kernel and evidence contracts first, then expose the same helper operations through selected adapters. The core product proof is a finite, Spec-scoped WIP=1 Delivery Loop: it activates only approved, dependency-ready Tasks; requires predeclared evidence; distinguishes interrupted work from verified work; bounds correction; and stops with typed results instead of prose-driven retries.

The principal risks are false completion, scope drift, split-brain state, destructive or non-idempotent installation/Git behavior, and semantic drift among runtime adapters. Prevent them through schema validation, stable IDs and parentage, immutable approval/evidence digests, atomic/recoverable writes, desired-state adapter installation, explicit Git preflights, a capability manifest, and cross-runtime conformance fixtures. Do not dilute this proof with a daemon, database, hosted dashboard, broad parallelism, plugins/hooks as a required control path, or cloud/enterprise scope.

## Key Findings

### Recommended Stack

Use a single Node.js `>=24`, ESM-only CLI package written in strict TypeScript. Keep the domain/state layer pure and independent of Commander, Git, a terminal, or a specific agent. Native Node APIs are sufficient for filesystem, hashing, subprocesses, and Git; use argument-vector process execution rather than shell strings. Canonical storage is repository Markdown plus small JSON and Git—not SQLite, an ORM, a cache, or a hosted store.

**Core technologies:**

- **Node.js `>=24` + NodeNext ESM:** local CLI runtime and portable package surface — matches npm-based target runtimes without a service layer.
- **TypeScript `^7.0.2` (strict):** domain contracts and transition logic — makes invalid artifact/state shapes harder to represent.
- **Commander `^15.0.0`:** CLI command parsing — sufficient for explicit, quiet `init`, `status`, inspection, and helper operations.
- **Zod `^4.4.3` + YAML `^2.9.0`:** boundary validation and limited frontmatter parsing — reject malformed artifacts rather than guessing from prose.
- **Native `fs/promises`, `child_process`, and `crypto`:** atomic persistence, declared command execution, and narrow Git operations — avoids shell injection and unneeded dependencies.
- **tsup `^8.5.1`, Vitest `^4.1.10`, fast-check `^4.9.0`:** package build plus unit, fixture, and property testing — the state engine requires exhaustive transition/invariant testing.

Ship adapter templates as package assets. Claude Code should use native skills/commands, Codex compact `AGENTS.md`/skill guidance, and OpenCode Markdown commands; do not make an agent SDK, MCP server, hook, or OpenCode V2 plugin a V1 dependency. CI must smoke-test the packed npm tarball, repeat initialization, and run selected-adapter combinations on Node 24 and current Node.

### Expected Features

V1 must feel native to coding-agent users while preserving a bounded authority/evidence model that existing runtime-specific workflows do not provide. The canonical hierarchy is `Roadmap → Phase → Spec → Plan → Task`; artifacts materialize only when actionable. Native `/exspecso:start`, `plan`, `implement`, `review`, and `status` entry points should remain thin fronts for helper-derived state.

**Must have (table stakes):**

- **Idempotent `npx exspecso init` with selected integrations** — installs only Claude Code, Codex, and/or OpenCode surfaces the user chose.
- **Readable repository-resident artifacts** — durable, editable, diffable Markdown/small JSON rather than chat memory or hidden state.
- **Approved hierarchical planning and reconstructible Tasks** — each Task has parentage, scope, acceptance criteria, verification intent, and smallest-sufficient context.
- **Artifact-derived status, interruption, and resume** — clearly distinguish planned, active, blocked, resumable, and verified work.
- **Evidence-backed verification and independent final review** — per-criterion evidence, Spec closure, and a reviewer logically independent from the builder.
- **Respect for host permissions** — adapters defer to runtime approval/sandbox boundaries and represent blocked work explicitly.

**Should have (V1 differentiators):**

- **One canonical model across all three runtimes** — resume without migration or copied chat context.
- **Finite approved-Spec Delivery Loop, default WIP=1** — no task creation or scope expansion during execution.
- **Frozen evidence-first verification contracts** — the builder cannot weaken acceptance criteria or substitute easy proof.
- **Bounded Correction Loop with typed outcomes** — assess, learn, patch, reverify, then verify/escalate/exhaust rather than retrying forever.
- **Derived traceability and separate verified Git checkpoints** — evidence closure plus an atomic Task commit, distinct from an incomplete resume checkpoint.
- **Progressive disclosure** — rigorous internals without making users operate a manual process framework.

**Defer (v2+):**

- Hosted dashboard, sync, authentication, billing, collaboration, and any cloud control plane.
- Kanban/assignment/estimate/sprint features, generic template marketplace, or enterprise SDLC suite.
- Hidden database/cache or generated canonical status mirror.
- Always-on daemon, scheduled autopilot, automatic adjacent Task creation, and broad multi-agent parallel execution.
- Runtime plugin/hook-led orchestration, universal TDD/full E2E requirements, or reimplementation of runtime permissions/model routing.

### Architecture Approach

Adopt three one-way layers: canonical repository artifacts, a deterministic helper as the sole transition authority, and thin generated runtime adapters. The helper validates → derives state → writes artifacts → runs declared checks; adapters only request the same file-and-command protocol in each host. The model supplies bounded judgment and proposed evidence, never legal state transitions or completion claims. Status is rebuilt from artifacts and Git, never stored as an independent mutable truth.

**Major components:**

1. **Package CLI and installer** — detects/selects runtimes; reconciles marked adapter assets; provides init, doctor, status, and explicit commands.
2. **Canonical artifact store** — schema-versioned Markdown/small JSON, stable IDs and parent links, atomic writes, and artifact-graph validation.
3. **Deterministic transition kernel** — pure guards, typed results, status derivation, context manifests, activation/WIP enforcement, and evidence closure decisions.
4. **Delivery and correction controllers** — finite Spec workflow, WIP=1 advancement, persisted correction budgets, and typed stop conditions.
5. **Git gateway** — non-destructive preflight and one verified-task commit only after evidence succeeds.
6. **Runtime adapters and capability manifest** — project-native command/instruction rendering plus version/capability diagnostics; no state or policy ownership.

Key patterns: file-backed derived state; explicit authority/constraint/evidence/observation labels; frozen approved Spec and verification digests; temp-write/rename plus recoverable multi-file operations; typed terminal results; capability-based adapter conformance. These reconcile the architecture and stack recommendations without exceeding PROJECT.md's local-first, one-package boundary.

### Critical Pitfalls

1. **Split-brain or corrupt canonical artifacts** — use one validated graph, a single helper for state derivation, atomic/recoverable writes, and `status --check`/crash-recovery fixtures.
2. **Approval and scope drift into prompts, plans, or adapters** — freeze approved Spec/Plan scope and evidence digests; refuse activation of unapproved Tasks; record discoveries as defer/escalate rather than silently expanding work.
3. **Idempotent commands overwrite or duplicate user state** — reconcile desired state, use ownership markers and install manifests, preserve foreign configuration, and test clean/retry/interrupted/user-edited cases.
4. **Verification is post-hoc or gamed** — require evidence intent before activation, have the helper evaluate the frozen contract, record reproducible evidence metadata, and mutation-test weakened/deleted proof.
5. **Runtime/Git/resume semantics create unsafe false completion** — keep adapters transport-only, certify a shared fixture matrix, separate incomplete from verified checkpoints, preflight worktrees/indexes, and never run destructive Git automation.

## Implications for Roadmap

Based on the combined research, suggested phase structure is below. It follows the hard dependency that no adapter, continuous mode, correction, or portability claim can precede reconstructible artifacts and helper-enforced evidence transitions.

### Phase 1: Canonical Artifact Kernel and Trust Boundary

**Rationale:** Portable workflow semantics need a single inspectable source of truth before any runtime integration can safely exist.  
**Delivers:** `.exspecso` artifact layout, stable IDs/parentage, schemas/frontmatter rules, read-only graph inspection/status, typed results, authority labels, atomic/recoverable persistence, and parser/trust-boundary tests.  
**Addresses:** Readable artifacts, derived status, reconstructible foundation.  
**Avoids:** Split-brain/corruption, cached status, artifact-text injection, and prose-only errors.

### Phase 2: Approved Hierarchical Planning and Task Context

**Rationale:** The bounded Spec must exist before implementation can be delegated.  
**Delivers:** Roadmap → Phase → Spec → Plan → Task creation/approval flow, explicit parent links, frozen scope digests, predeclared acceptance/verification intent, dependency checks, and smallest-sufficient context manifests.  
**Addresses:** Intent-to-work hierarchy, bounded authority, reconstructible Tasks.  
**Avoids:** Prompt/plan authorization drift and automatic scope/task creation.

### Phase 3: Package, Init, and Safe Selected-Runtime Installation

**Rationale:** Establish the one-package distribution and non-destructive install contract before delivery commands are surfaced.  
**Delivers:** ESM CLI scaffold, `npx exspecso init`, explicit runtime selection/detection, ownership markers, install manifest, no-overwrite conflicts, uninstall/doctor, package tarball checks, and idempotence/interruption fixtures.  
**Uses:** Node 24, TypeScript, Commander, Zod, YAML, tsup, Vitest.  
**Avoids:** Duplicate config, overwriting native setup, accidental permissions expansion, and premature multiple packages.

### Phase 4: Evidence-First Task Delivery and First Adapter Vertical Slice

**Rationale:** Prove the core value through one native entry point only after state, authority, and installation rules are testable.  
**Delivers:** Task activation with WIP=1/operation lock, frozen verification contracts, evidence records/trace closure, helper-controlled verified completion, and one adapter (recommend Codex first) calling the common protocol.  
**Addresses:** Native commands, visible progress, per-criterion verification.  
**Avoids:** Builder self-certification, WIP races, and adapter-owned state.

### Phase 5: Bounded Correction, Closure, and Independent Review

**Rationale:** Failure handling and Spec completion must preserve the original evidence target before autonomy advances.  
**Delivers:** Persisted Assess → Learn → Patch → Reverify loop with limits/hypotheses, typed terminal outcomes, Spec closure verification, and independent final review records.  
**Addresses:** Controlled recovery and credible completion.  
**Avoids:** Infinite retries, altered criteria, and self-review masquerading as evidence.

### Phase 6: Git Checkpoints, Pause/Resume, and Continuous Advancement

**Rationale:** Continuous delivery is only safe after verification and correction are mechanically enforced.  
**Delivers:** Separate incomplete/verified checkpoints, repository/worktree divergence checks, explicit atomic Task commits after valid evidence, pause/resume reconstruction, and next-Task advancement inside an approved Spec.  
**Addresses:** Safe interruption, verified checkpoints, finite Delivery Loop.  
**Avoids:** False completion, unrelated Git commits, destructive reconciliation, and phase-wide/unbounded execution.

### Phase 7: Remaining Adapters and Cross-Runtime Portability Certification

**Rationale:** Add runtime breadth only after the shared protocol and vertical proof are stable.  
**Delivers:** Claude Code and OpenCode thin shims, versioned capability manifest, runtime-specific doctor diagnostics, selected-adapter reinstallation, and start/pause/resume/correct/complete conformance fixtures across all three hosts.  
**Addresses:** Canonical cross-runtime continuation—the headline differentiator.  
**Avoids:** Semantic drift, beta plugin dependence, and native permission-policy divergence.

### Phase 8: Security, Usability, and Release Hardening

**Rationale:** Validate the harness under hostile/unusual repository state and make strong governance quiet in normal use.  
**Delivers:** Injection/adversarial fixtures, mutation/crash/retry test coverage, least-privilege documentation, clean-repo usability checks, progressive status/doctor guidance, packed-artifact release gate, and supported-version matrix.  
**Addresses:** Trustworthy operations and progressive disclosure.  
**Avoids:** Bypass-prone hooks/plugins, V1 scope creep, and users bypassing a high-friction workflow.

### Phase Ordering Rationale

- Artifacts, schemas, and pure state derivation are the dependency root; every later command must be able to reconstruct and validate them.
- Approval and evidence contracts precede implementation so delivery cannot invent scope or redefine success.
- Installation is separated from adapter behavior because retry safety and user-owned configuration are independent release-critical concerns.
- One adapter validates the common protocol cheaply; remaining adapters follow only after conformance fixtures define semantic equivalence.
- Correction and verified checkpoints precede continuous advancement, preventing a loop from advancing incomplete or unverified work.
- Security/usability hardening closes the V1 proof without introducing out-of-scope infrastructure.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 1:** Multi-file crash recovery/journal choice, Markdown/frontmatter schema evolution, and exact artifact revision/amendment semantics.
- **Phase 3:** Current native configuration ownership/merge behavior and adapter upgrade/reversal for each exact supported runtime version.
- **Phase 4:** Codex command/skill invocation feasibility and how evidence commands execute within user approval/sandbox boundaries.
- **Phase 6:** Git behavior in dirty indexes, linked worktrees, rebases, detached HEADs, and the verified-commit opt-out policy.
- **Phase 7:** Exact Claude Code/Codex/OpenCode capabilities, precedence, non-interactive behavior, and cross-runtime fixture automation; these surfaces evolve quickly.
- **Phase 8:** Adversarial repository/runtime-extension scenarios and the minimum useful evidence formats for UI, infrastructure, and non-code work.

Phases with standard patterns (research-phase can usually be skipped):

- **Phase 2:** Parent-linked artifact hierarchy, scope digests, pure guards, and context manifests have well-established file-backed/state-machine patterns once Phase 1 contracts are set.
- **Phase 5:** Bounded retry state machines, immutable verification contracts, and review records are conventional implementation work after the evidence model is defined.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Official Node/npm/TypeScript and runtime docs support the choices; package versions and runtime extension surfaces will move. |
| Features | MEDIUM | Strong agreement among current native agent conventions and Spec Kit; early-adopter vocabulary and ergonomics require V1 validation. |
| Architecture | MEDIUM | PROJECT.md provides HIGH-confidence product boundaries; cross-runtime integration details rely on current official docs and need fixture proof. |
| Pitfalls | MEDIUM | Risks are well-grounded in official runtime/Git behavior, but exact failures depend on supported versions and real repositories. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Artifact amendment and multi-file recovery protocol:** choose and test the exact pending-operation/journal semantics before schema becomes public.
- **Supported runtime/version matrix:** set explicit initial versions and capability probes; unknown versions must fail safely or provide manual instructions.
- **Git checkpoint usability:** validate atomic-per-Task commits and opt-out behavior with target repositories, especially where working trees are already active.
- **Evidence taxonomy:** define a minimal, proportionate set of evidence record formats for UI, infrastructure, and non-code work without creating a universal test framework.
- **Adapter UX and artifact vocabulary:** test whether progressive materialization makes Roadmap/Phase/Spec/Plan/Task approachable for solo developers.
- **Conflict/recovery policy:** validate user-facing resolution for user-edited generated files, divergent worktrees, and incomplete initialization without automatic repair or destructive actions.

## Sources

### Primary (HIGH confidence)

- [PROJECT.md](../PROJECT.md) — authoritative V1 scope, constraints, workflow hierarchy, and product decisions.

### Secondary (MEDIUM confidence)

- [STACK.md](STACK.md) — official Node/npm/TypeScript/runtime documentation and current package registry checks.
- [FEATURES.md](FEATURES.md) — official Claude Code, Codex, OpenCode, and GitHub Spec Kit workflow references.
- [ARCHITECTURE.md](ARCHITECTURE.md) — official runtime configuration/command docs and Node filesystem/process APIs.
- [PITFALLS.md](PITFALLS.md) — official Claude Code, Codex, OpenCode, and Git documentation on permissions, configuration, hooks, plugins, and worktrees.

### Primary source references inherited from research

- [Node.js release policy](https://nodejs.org/en/about/previous-releases) and [Node APIs](https://nodejs.org/api/fs.html)
- [npm package.json reference](https://docs.npmjs.com/cli/configuring-npm/package-json/) and [TypeScript module reference](https://www.typescriptlang.org/docs/handbook/modules/reference)
- [Claude Code plugins](https://code.claude.com/docs/en/plugins), [skills/commands](https://code.claude.com/docs/en/slash-commands), [permissions](https://code.claude.com/docs/en/permissions), and [configuration](https://code.claude.com/docs/en/configuration)
- [Codex AGENTS.md guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md) and [Codex sandboxing](https://learn.chatgpt.com/docs/sandboxing)
- [OpenCode commands](https://opencode.ai/docs/commands/), [configuration](https://dev.opencode.ai/docs/config), and [permissions](https://opencode.ai/docs/permissions)
- [GitHub Spec Kit](https://github.com/github/spec-kit) and its [Agentic SDD reference](https://github.com/github/spec-kit/blob/main/docs/reference/agentic-sdd.md)
- [Git hooks](https://git-scm.com/docs/githooks) and [Git worktrees](https://git-scm.com/docs/git-worktree)

---
*Research completed: 2026-08-18*  
*Ready for roadmap: yes*
