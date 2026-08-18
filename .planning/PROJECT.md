# Exspecso

## What This Is

Exspecso is a local-first, artifact-grounded harness engineering framework for AI coding agents. It turns approved product intent into bounded planning, implementation, verification, correction, and resumable delivery workflows so developers can delegate meaningful software work without relying on fragile chat memory or continuously scheduling every next step.

The initial product is one npm package that installs a shared Exspecso workflow into Claude Code, OpenAI Codex, and OpenCode while keeping ordinary Markdown and small JSON files in the user's repository as the canonical source of truth.

## Core Value

Approved product intent must survive planning, implementation, failure, verification, and session or runtime boundaries, with evidence—not agent confidence—controlling completion.

## Business Context

- **Customer**: Solo founders, developers, and small engineering teams using AI coding agents for substantial software delivery
- **Revenue model**: Not yet defined; V1 prioritizes proving the local artifact-first workflow
- **Success metric**: A user can take one approved specification through bounded implementation, recovery, evidence-gated completion, and cross-runtime resumption with materially less continuous supervision
- **Strategy notes**: `docs/product/PRODUCT-THESIS.md` is the canonical product thesis; linked Documentation v11 pages define the current V1 architecture and build sequence

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Ship Exspecso as one small npm package with `npx exspecso init` as the normal setup path.
- [ ] Install only the user-selected native integrations for Claude Code, OpenAI Codex, and OpenCode while all runtimes share one canonical artifact model.
- [ ] Preserve product intent in directly readable, editable, versionable repository artifacts rather than chat history, hidden state, or a database.
- [ ] Materialize project, roadmap, phase, specification, plan, task, trace, verification, correction, and review artifacts only when they become actionable.
- [ ] Keep planning explicitly hierarchical: Roadmap declares Phases, Phase planning declares Specs, and Spec planning creates the executable Plan and bounded Tasks.
- [ ] Make every Task independently reconstructible from canonical artifacts and provide the smallest sufficient context with explicit escalation when more context is needed.
- [ ] Execute approved Specs through a finite Delivery Loop that defaults to WIP=1, advances through verified Tasks in continuous mode, and cannot invent requirements, Tasks, or scope.
- [ ] Define verification intent for every Acceptance Criterion before implementation and require evidence appropriate to the behavior being claimed.
- [ ] Prevent builders from weakening, deleting, skipping, or materially reinterpreting approved verification merely to obtain a passing result.
- [ ] Route correctable failures through a bounded Assess → Learn → Patch → Reverify Correction Loop that preserves the original evidence contract and stops with an explicit typed result.
- [ ] Distinguish incomplete resume checkpoints from evidence-backed verified checkpoints, with one atomic Git commit per verified Task by default.
- [ ] Derive status, artifact relationships, Task activation, loop transitions, correction limits, trace closure, and terminal results mechanically from repository state wherever possible.
- [ ] Run declared Spec-level closure verification when required and require logically independent final review before a Spec is complete.
- [ ] Make initialization and workflow commands idempotent, interruption-safe, inspectable, and resumable from artifacts without depending on prior conversation state.
- [ ] Prove that a project can start in one supported runtime and continue in another without migration or loss of intent or progress.

### Out of Scope

- Cloud control plane, hosted dashboard, synchronization, authentication, billing, or collaboration — V1 proves the local workflow first.
- SQLite or another hidden canonical database — repository artifacts remain the source of truth.
- Generated duplicate views or an export step for inspecting project state — canonical files must be directly understandable.
- Multiple npm packages or a large monorepo — split only after a concrete dependency or release-cycle need appears.
- Full enterprise SDLC replacement, enterprise governance, or heavyweight project-management features — these obscure the focused harness problem.
- An always-running background daemon or unbounded autonomous agent loop — execution begins explicitly and stays within an approved finite Plan.
- Universal TDD or broad E2E verification after every small Task — evidence level must match the Acceptance Criterion.
- Mandatory fresh model sessions for every Task — logical isolation and reconstructibility are required; physical reset is a runtime strategy.
- Phase-wide implementation as a V1 execution boundary — one approved Spec is the bounded Delivery Loop goal.
- Agent-authorized adjacent cleanup, speculative abstractions, or silent scope expansion — discoveries must be deferred or escalated.

## Context

AI coding models can already produce useful code quickly, but stronger code generation does not guarantee reliable delivery. Common failures occur in the operating environment around the model: intent drifts, context accumulates noise, plans detach from the repository, agents overreach or under-finish, verification is selected after implementation, correction retries become unbounded, and interrupted sessions require expensive rediscovery.

Exspecso treats this surrounding environment as the product. Specifications provide the authority and scope boundary; repository artifacts provide durable memory; a deterministic helper owns mechanical state; runtime adapters coordinate bounded reasoning and execution; evidence gates control completion; and Delivery and Correction Loops provide useful autonomy with explicit stop conditions.

The intended visible workflow remains small:

```text
npx exspecso init
/exspecso:start
/exspecso:plan
/exspecso:implement
/exspecso:review
/exspecso:status
```

Internally, V1 follows this intent-preservation chain:

```text
brief
→ constitution
→ standards
→ roadmap
→ phase
→ spec
→ plan
→ task
→ code and verification evidence
```

The first end-to-end milestone must prove initialization, runtime selection, project start, hierarchical Phase and Spec planning, evidence-first implementation, interrupted-task resumption, bounded correction, verified checkpoints, continuous Task advancement, Spec-level closure evidence, independent final review, step-mode pause/resume, artifact-derived status, and continuation from a second supported runtime.

## Constraints

- **Distribution**: One npm package and one codebase — minimize release and dependency complexity during V1.
- **Runtime**: TypeScript/Node.js — supports the CLI, deterministic helper, package distribution, and runtime adapters in one implementation language.
- **Supported agents**: Claude Code, OpenAI Codex, and OpenCode — all must preserve identical operation semantics and canonical artifacts.
- **Storage**: Human-readable Markdown plus small JSON files in the user's repository — no hidden database or cloud dependency.
- **Architecture**: Three logical layers: canonical artifacts, deterministic helper, and runtime orchestration — runtime adapters may not create alternative state models.
- **Execution**: Default active implementation WIP is one Task; parallelism requires proven independence and separate verification/checkpoint boundaries.
- **Verification**: Acceptance Criteria declare verification intent before implementation; agent self-assessment is never completion evidence.
- **Recovery**: Correction attempts are bounded and must preserve the approved evidence target; ambiguity or scope change requires escalation.
- **Continuity**: Every Task is reconstructible from disk; resume state may preserve incomplete work but cannot mark it complete.
- **Git**: Git is the default durable checkpoint mechanism, with an atomic commit for each successfully verified Task unless explicitly disabled.
- **UX**: Governance is strong internally but progressively disclosed and quiet during normal use.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Position Exspecso as spec-driven harness engineering | Specs define authority, while harness engineering covers context, execution, verification, recovery, continuity, and control | — Pending |
| Use repository artifacts as canonical truth | Files survive sessions and runtimes and remain inspectable, diffable, editable, and versionable | — Pending |
| Ship one npm package | Proves the workflow without premature package boundaries or release complexity | — Pending |
| Support Claude Code, Codex, and OpenCode through native adapters | Demonstrates runtime portability without changing project truth | — Pending |
| Keep mechanical state in a deterministic helper | Status and transitions should be reproducible rather than dependent on model memory or confidence | — Pending |
| Use a Roadmap → Phase → Spec → Plan → Task hierarchy | Keeps strategic planning separate from executable delivery while preserving explicit parentage | — Pending |
| Make one approved Spec the Delivery Loop goal | Creates a finite work budget and prevents phase-wide or unbounded execution | — Pending |
| Default implementation to WIP=1 | Produces completion pressure and protects verification and checkpoint boundaries | — Pending |
| Design evidence before implementation | Prevents post-hoc proof selection and makes completion criteria authoritative | — Pending |
| Separate resume and verified checkpoints | Continuity must not be confused with completion | — Pending |
| Use bounded Correction Loops with typed terminal results | Recovery should be useful without hiding ambiguity, moving the target, or retrying indefinitely | — Pending |
| Keep governance progressive and quiet | Users should receive reliability without becoming manual artifact or workflow operators | — Pending |

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
*Last updated: 2026-08-18 after initialization*
