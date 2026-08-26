<!-- GSD:project-start source:PROJECT.md -->

## Project

**Exspecso**

Exspecso is an open-source, spec-driven harness engineering framework for AI coding agents. It turns user-approved product intent into bounded, artifact-grounded planning and delivery so Claude Code, OpenAI Codex, and OpenCode can plan, implement, verify, recover, review, and resume work without depending on fragile chat memory or hidden canonical state.

V1 ships as one local-first TypeScript/Node npm package. Human-readable Markdown and small JSON files in the user's repository preserve intent and progress; deterministic helpers enforce mechanical contracts; runtime adapters let coding agents reason and work within those contracts.

**Core Value:** Approved specs must survive context limits, implementation, failure, verification, runtime changes, and session boundaries without losing intent or allowing unproven work to count as complete.

### Constraints

- **Canonical state**: Ordinary Markdown and small JSON files in the repository — users must be able to inspect, edit, diff, and reconstruct project truth directly.
- **Technology**: One TypeScript/Node npm package and one codebase — the canonical v13 build target; specific supporting libraries will be selected through current ecosystem research.
- **Runtime support**: Claude Code, OpenAI Codex, and OpenCode are first-class V1 targets — each must preserve shared operations, artifacts, and the same portable `exspecso-<operation>` skill IDs.
- **Command notation**: Public Exspecso documentation uses `/exspecso-<operation>` consistently. Runtime adapters may translate only a host-owned invocation sigil when required (for example, Codex explicitly invokes a skill as `$exspecso-start`); the `exspecso-<operation>` identity, arguments, behavior, and artifacts remain unchanged.
- **Architecture**: Three logical layers (canonical artifacts, deterministic helper, runtime orchestration) — reasoning and mechanical bookkeeping must remain separated.
- **Planning**: Coverage before compression and progressive elaboration — no fixed artifact-count targets, no orphan work, and no future-only scope.
- **Roadmap lifecycle**: One stable `ROADMAP` at `.exspecso/roadmap.md` — no numbered Roadmap folders, active-Roadmap selector, separate Roadmap status artifact, or `/exspecso-new-roadmap` command in V1.
- **Planning surface**: `/exspecso-start` always creates the lightweight Phase and Spec Roadmap map; `/exspecso-plan PHASE-NNN` deeply plans every declared Spec while preserving independent Spec artifacts.
- **Execution**: One approved Phase per user-facing Delivery Loop, one active internal Spec Delivery Loop at a time by default, and Task WIP=1 — parallel Tasks require proven independence, non-conflicting change surfaces, independent verification, and independent checkpoints.
- **Dependencies**: Explicit stable IDs form acyclic Phase, Spec, and Task graphs — dependencies gate delivery readiness, while declared order is only a preference among ready work.
- **Verification**: Every Acceptance Criterion declares verification intent before implementation — evidence strength must match the behavior claimed.
- **Verification integrity**: Builders cannot weaken, delete, skip, or reinterpret approved verification merely to obtain a pass — conflicts require escalation.
- **Completion**: A Phase becomes done only after every required Spec is reviewed and done and any declared Phase-level integration or closure verification passes.
- **Continuity**: Every Task must be independently reconstructible from canonical artifacts and repository state — a physical fresh session is optional runtime strategy.
- **Checkpoints**: Resume checkpoints preserve incomplete-work continuity; verified checkpoints alone establish completion — Git repositories default to an atomic commit per verified Task.
- **Recovery**: Correction is bounded by explicit attempts and stop conditions — it may not expand scope or replace the evidence contract that found the failure.
- **Human control**: Users own intent, scope changes, meaningful tradeoffs, ambiguity resolution, and overrides — Exspecso may challenge but cannot silently replace product intent.
- **User experience**: Governance should be strong but quiet — users should see a small workflow rather than manage internal routing, trace, counters, or scheduling.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->

## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
