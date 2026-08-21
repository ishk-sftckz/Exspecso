# Exspecso

## What This Is

Exspecso is an open-source, spec-driven harness engineering framework for AI coding agents. It turns user-approved product intent into bounded, artifact-grounded planning and delivery so Claude Code, OpenAI Codex, and OpenCode can plan, implement, verify, recover, review, and resume work without depending on fragile chat memory or hidden canonical state.

V1 ships as one local-first TypeScript/Node npm package. Human-readable Markdown and small JSON files in the user's repository preserve intent and progress; deterministic helpers enforce mechanical contracts; runtime adapters let coding agents reason and work within those contracts.

## Core Value

Approved specs must survive context limits, implementation, failure, verification, runtime changes, and session boundaries without losing intent or allowing unproven work to count as complete.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] A user can initialize Exspecso in a Git repository through one idempotent `npx exspecso init` flow and select one or more supported coding-agent integrations.
- [ ] A user can run discovery and orientation to establish accurate, challenged, user-approved project context, one minimum-complete canonical Roadmap, and an explicit initial Phase-grooming horizon.
- [ ] A user can keep Phase grooming progressive or materialize every declared Phase at Phase-planning depth without prematurely creating executable Spec artifacts.
- [ ] A user can progressively plan Roadmap-declared Phases and Phase-declared Specs through explicit stable IDs.
- [ ] A user can invoke the same portable `exspecso-<operation>` skill identity in every supported runtime, documented through the canonical `/exspecso-<operation>` command notation.
- [ ] A user can extend the canonical Roadmap with `/exspecso-new-phase` without creating a second Roadmap lifecycle.
- [ ] An approved Spec contains current Requirements, Acceptance Criteria, verification intent, the smallest viable Plan, and bounded Tasks with explicit scope and dependencies.
- [ ] Deterministic helpers can reconstruct context, resolve artifacts, validate dependencies, compute readiness/status, enforce WIP and verification gates, manage checkpoints, maintain traceability, and derive Delivery Loop transitions from repository files.
- [ ] `/exspecso-implement <spec-id>` can deliver one finite approved Spec through bounded Task execution, evidence-gated checkpoints, closure verification when required, independent review, and explicit terminal results.
- [ ] Failed verification or correctable review findings can enter a bounded Correction Loop that preserves approved scope and reruns the same evidence contract.
- [ ] Interrupted incomplete Tasks can resume from lightweight persisted state without being misrepresented as complete.
- [ ] Every completed Task can be traced from approved Requirement and Acceptance Criterion through code changes, passing evidence, and a verified durable checkpoint.
- [ ] Claude Code, OpenAI Codex, and OpenCode can operate on the same canonical artifacts and continue one another's work without migration.
- [ ] Commands remain safe to rerun, surface malformed or drifting state explicitly, and preserve prior confirmed work through atomic writes and Git boundaries.
- [ ] The full V1 is documented, demonstrated through representative greenfield and brownfield examples, tested across the three runtimes, and published as one npm package.

### Out of Scope

- SQLite or another hidden canonical database — repository artifacts are the source of truth.
- A cloud control plane, account system, dashboard, OAuth, billing, collaboration, or synchronization — V1 is local-first and repository-native.
- Generated views that duplicate canonical artifacts — the file a user opens is the canonical artifact.
- Multiple npm packages or a required monorepo — V1 uses one package and one codebase until an independent release or dependency need exists.
- Heavy project-management or enterprise-SDLC functionality — Exspecso governs AI delivery without becoming a PM platform.
- Permanent named product-level agent roles — runtimes may use temporary bounded workers, but they are an orchestration tactic rather than canonical architecture.
- Phase-wide or multi-Spec autonomous implementation — V1 Delivery Loops execute one approved Spec at a time.
- Automatic multi-Phase or multi-Spec orchestration — independence may be surfaced as an opportunity, but V1 automatic parallelism is Task-level only.
- Unbounded autonomous or background execution — `/implement` explicitly starts a finite Delivery Loop over an approved Plan.
- Universal TDD or mandatory E2E after every Task — evidence type and level must match the Acceptance Criterion.
- Speculative scale, provider, abstraction, or extensibility work — future possibility is not current scope.
- Runtime-specific canonical project state — all supported coding agents share one artifact model.
- Numbered or parallel Roadmap lifecycles and `/exspecso-new-roadmap` — V1 evolves one canonical `.exspecso/roadmap.md` through revisions, Git history, durable decisions, and `/exspecso-new-phase`.

## Context

Exspecso exists because increasingly capable coding models still fail when their operating environment is weak: intent remains trapped in chat, context drifts, scope expands silently, plans lose contact with repository reality, agents overreach or under-finish, verification is weakened or retrofitted, interruptions are expensive, and humans must repeatedly schedule the next approved action.

The product thesis is: **the model writes the code; Exspecso engineers the conditions under which the model can do reliable work.** Specs define intent, artifacts preserve durable state, the harness controls execution, and evidence controls completion.

Canonical implementation guidance lives in the Notion Documentation v12 set and overrides historical founder drafts, research snapshots, previous documentation versions, earlier RALP terminology, numeric artifact-count heuristics, and other superseded ideas:

- [Exspecso hub](https://app.notion.com/p/2837d0b4dee2808c9745fc3d986960de)
- [Design Principles / Foundations](https://app.notion.com/p/30c7d0b4dee280daaf81ff66ad8c960d)
- [Architecture & Design Decisions v12](https://app.notion.com/p/3ad7d0b4dee281ec9a2bf2d3d0f7b588)
- [Artifact, Entity & Contract Registry v12](https://app.notion.com/p/3ad7d0b4dee281d5afa9cef8d742710c)
- [Complete Product & Agent Workflow v12](https://app.notion.com/p/3ad7d0b4dee2818c8a86c12c2882fc0c)
- [Step-by-Step Build Guide v12](https://app.notion.com/p/3ad7d0b4dee28193abdadeecb779a5af)
- [Pitch & Founder's Message v2](https://app.notion.com/p/3bc7d0b4dee281e0b538d29e504302b1)

The repository is currently greenfield for implementation. It contains branding assets and guidance but no application source. Existing branding language that references superseded mechanisms such as RALP must be reconciled with Documentation v12 during implementation rather than treated as canonical product behavior.

Documentation v12 replaces the numbered Roadmap lifecycle with one stable `ROADMAP` artifact at `.exspecso/roadmap.md`. Exspecso standardizes portable skill IDs as `exspecso-<operation>` and documents them as `/exspecso-<operation>` commands. After project-direction confirmation, `/exspecso-start` records `planning.initialPhaseGrooming`: `progressive` keeps Phase folders lazy until `/exspecso-plan PHASE-NNN`, while `all-phases` materializes every declared Phase at normal Phase-planning depth without creating `spec.md`, `plan.md`, or `tasks.md`. Later work extends the same Roadmap through `/exspecso-new-phase`; V1 has no public `/exspecso-new-roadmap` command or separate canonical Roadmap status file.

Primary users are developers, solo founders, and small engineering teams that want meaningful AI-agent autonomy inside durable intent, bounded scope, explicit evidence, and recoverable execution—without uncontrolled vibe coding or heavyweight process management.

The selected delivery approach is a **contract-led vertical spine**:

1. Establish the CLI, artifact contracts, stable IDs, templates, and atomic-write foundation.
2. Build deterministic context, dependency, readiness, status, verification, checkpoint, trace, Delivery Loop, and Correction Loop mechanics.
3. Implement discovery and hierarchical Roadmap → Phase → Spec planning.
4. Prove one complete Spec Delivery Loop through a development runtime.
5. Freeze the shared contracts, add Claude Code, Codex, and OpenCode adapters, and run a shared conformance flow.
6. Harden failure recovery, idempotency, portability, examples, documentation, and npm release.

The first end-to-end milestone is a proof gate inside the full V1 roadmap, not the final project boundary.

## Constraints

- **Canonical state**: Ordinary Markdown and small JSON files in the repository — users must be able to inspect, edit, diff, and reconstruct project truth directly.
- **Technology**: One TypeScript/Node npm package and one codebase — the canonical v12 build target; specific supporting libraries will be selected through current ecosystem research.
- **Runtime support**: Claude Code, OpenAI Codex, and OpenCode are first-class V1 targets — each must preserve shared operations, artifacts, and the same portable `exspecso-<operation>` skill IDs.
- **Command notation**: Public Exspecso documentation uses `/exspecso-<operation>` consistently. Runtime adapters may translate only a host-owned invocation sigil when required (for example, Codex explicitly invokes a skill as `$exspecso-start`); the `exspecso-<operation>` identity, arguments, behavior, and artifacts remain unchanged.
- **Architecture**: Three logical layers (canonical artifacts, deterministic helper, runtime orchestration) — reasoning and mechanical bookkeeping must remain separated.
- **Planning**: Coverage before compression and progressive elaboration — no fixed artifact-count targets, no orphan work, and no future-only scope.
- **Roadmap lifecycle**: One stable `ROADMAP` at `.exspecso/roadmap.md` — no numbered Roadmap folders, active-Roadmap selector, separate Roadmap status artifact, or `/exspecso-new-roadmap` command in V1.
- **Phase grooming**: `/exspecso-start` records `planning.initialPhaseGrooming` as `progressive` (default) or `all-phases` — both preserve lazy executable Spec materialization.
- **Execution**: One approved Spec per Delivery Loop and WIP=1 by default — parallel Tasks require proven independence, non-conflicting change surfaces, independent verification, and independent checkpoints.
- **Dependencies**: Explicit stable IDs form acyclic Phase, Spec, and Task graphs — dependencies gate delivery readiness, while declared order is only a preference among ready work.
- **Verification**: Every Acceptance Criterion declares verification intent before implementation — evidence strength must match the behavior claimed.
- **Verification integrity**: Builders cannot weaken, delete, skip, or reinterpret approved verification merely to obtain a pass — conflicts require escalation.
- **Continuity**: Every Task must be independently reconstructible from canonical artifacts and repository state — a physical fresh session is optional runtime strategy.
- **Checkpoints**: Resume checkpoints preserve incomplete-work continuity; verified checkpoints alone establish completion — Git repositories default to an atomic commit per verified Task.
- **Recovery**: Correction is bounded by explicit attempts and stop conditions — it may not expand scope or replace the evidence contract that found the failure.
- **Human control**: Users own intent, scope changes, meaningful tradeoffs, ambiguity resolution, and overrides — Exspecso may challenge but cannot silently replace product intent.
- **User experience**: Governance should be strong but quiet — users should see a small workflow rather than manage internal routing, trace, counters, or scheduling.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Target the complete V1 release rather than stopping at the first proof milestone | The requested roadmap must cover the published package, all three runtimes, and hardening; the proof flow remains an intermediate gate | — Pending |
| Use Documentation v12 as the implementation source of truth | The Exspecso hub explicitly marks v12 as canonical and previous documentation/research as historical context | — Pending |
| Maintain one canonical `.exspecso/roadmap.md` with stable ID `ROADMAP` | A single evolving Roadmap avoids duplicate lifecycle state while Git history and durable decisions preserve change | — Pending |
| Standardize commands on the portable `exspecso-<operation>` skill identity and `/exspecso-<operation>` documentation notation | Lowercase kebab-case is valid across the shared Agent Skills format; adapters translate only host-owned invocation syntax rather than renaming operations | — Pending |
| Let `/exspecso-start` choose `progressive` or `all-phases` Phase grooming | Users can trade immediate foresight for lazy materialization without changing hierarchy, coverage rules, or executable Spec boundaries | — Pending |
| Extend the Roadmap through `/exspecso-new-phase` and omit `/exspecso-new-roadmap` in V1 | New work belongs in the existing project direction unless `/exspecso-update` first changes that direction | — Pending |
| Build one npm package and one codebase | Shared contracts should stabilize before independent release cycles justify package boundaries | — Pending |
| Keep repository artifacts canonical and avoid a database or duplicate view layer | Inspectability, portability, reconstruction, Git history, and human override are core product guarantees | — Pending |
| Separate canonical artifacts, deterministic mechanics, and runtime reasoning | Mechanical state must be reproducible while semantic decisions remain with users and models | — Pending |
| Use a contract-led vertical delivery spine | It validates the full workflow early while avoiding an untested horizontal engine or premature three-runtime integration churn | — Pending |
| Define evidence before implementation and make verification control completion | Builder confidence and retrofitted checks cannot reliably prove approved intent | — Pending |
| Default to Spec-scoped Delivery Loops and Task WIP=1 | Finite approved budgets and narrow execution boundaries reduce drift, overreach, and half-finished work | — Pending |
| Support bounded correction and typed Delivery Loop outcomes | Recovery must accelerate approved work without hiding ambiguity, failure, or scope changes | — Pending |
| Treat runtime portability as a shared-contract conformance problem | Agents may present workflows differently but must never fork project truth or lifecycle semantics | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-21 after Documentation v12 Roadmap lifecycle alignment*
