# Exspecso v13 Phase-Oriented Workflow Design

**Date:** 2026-08-26
**Status:** Accepted (approved by project owner)
**Decision owner:** Project owner

## Purpose

Reconcile Documentation v13 into Exspecso's canonical planning artifacts without reintroducing runtime-specific command identities or preserving stale v12 workflow fragments.

## Authoritative Sources

- [Exspecso hub](https://app.notion.com/p/2837d0b4dee2808c9745fc3d986960de)
- [Design Principles / Foundations](https://app.notion.com/p/30c7d0b4dee280daaf81ff66ad8c960d)
- [Architecture & Design Decisions v13](https://app.notion.com/p/3ad7d0b4dee281ec9a2bf2d3d0f7b588)
- [Artifact, Entity & Contract Registry v13](https://app.notion.com/p/3ad7d0b4dee281d5afa9cef8d742710c)
- [Complete Product & Agent Workflow v13](https://app.notion.com/p/3ad7d0b4dee2818c8a86c12c2882fc0c)
- [Step-by-Step Build Guide v13](https://app.notion.com/p/3ad7d0b4dee28193abdadeecb779a5af)
- [Runtime command-naming research](../research/runtime-command-naming.md)

## Approved Resolution

Documentation v13's dominant Phase-oriented workflow is canonical:

1. `start` confirms project direction and writes one lightweight Roadmap containing the complete Phase map and a lightweight Spec map under every Phase.
2. `start` does not materialize Phase folders or detailed Spec, Plan, or Task artifacts.
3. `plan PHASE-NNN` validates and refines that Phase's lightweight Spec map, materializes the Phase, and deeply plans every declared Spec into its own bounded `spec.md`, `plan.md`, `tasks.md`, and `status.md` family.
4. `implement PHASE-NNN` starts one bounded outer Phase Delivery Loop. It selects one READY Spec at a time and runs that Spec through an internal bounded Spec Delivery Loop.
5. Default Phase-level WIP is one active Spec Delivery Loop; default Spec-level implementation WIP is one active Task. Parallel Task execution remains a proven-safe optimization.
6. Continuous mode advances across completed Spec loops until the Phase is done or reaches a typed terminal result. Step mode pauses at a completed Spec boundary.
7. Verification is one hierarchy: Task Verification, optional Spec Closure Verification, then Phase Closure Verification after all required Specs are done. Human Phase Acceptance is only the residual human-facing portion of Phase Closure Verification, not another verification layer.
8. `new-phase` extends the same Roadmap with one Phase and its lightweight Spec map. V1 has no normal `new-roadmap` operation.

## Portable Operation Identity

The earlier approved portability decision remains in force:

- Portable skill ID: `exspecso-<operation>`
- Canonical public notation: `/exspecso-<operation>`
- Codex explicit skill invocation when required by the host: `$exspecso-<operation>`
- Runtime-neutral operation key stored by contracts: `start`, `plan`, `verify`, `implement`, `review`, `status`, `update`, or `new-phase`

The colon spellings in v13 source pages are treated as presentation remnants, not portable skill IDs. Runtime adapters may translate host-owned invocation syntax, but they may not change operation identity, arguments, behavior, artifacts, or safety semantics.

## Conflict Resolution Rules

When v13 pages contradict themselves, use the following approved precedence:

- The Phase-oriented main workflow overrides stale statements that expose `plan SPEC-NNN` as a normal user command.
- Phase-scoped `implement PHASE-NNN` overrides stale statements that say V1 implementation is Spec-scoped.
- Step mode pauses at a completed Spec boundary, not after an individual Task checkpoint.
- `new-phase` overrides the isolated stale `new-roadmap` reference.
- Delivery Loop status and results must project both outer Phase and selected inner Spec state; legacy Spec-only result wording must be updated rather than retained.
- The Roadmap owns lightweight Phase and Spec declarations and dependencies. Phase briefs and Spec files must not create competing membership or dependency sources.

## Planning-Artifact Migration

The migration will:

- update `PROJECT.md` from Documentation v12 to v13;
- remove `planning.initialPhaseGrooming`, `progressive`, and `all-phases` from V1 scope;
- replace public Spec-by-Spec planning with Phase planning that internally deep-plans every Spec;
- replace the user-facing Spec Delivery Loop with a Phase Delivery Loop containing bounded Spec Delivery Loops;
- add Phase-level readiness, next-READY-Spec selection, WIP, step-mode, closure, review aggregation, completion, rerun, and typed-result requirements;
- retain Spec and Task safety boundaries, verification integrity, checkpoints, correction, traceability, and resume guarantees;
- update roadmap Phase 3 to deliver Phase-oriented planning and Phase 4 to deliver one approved Phase through internal Spec loops;
- retain Phase 2 before Phase 3 because the deterministic truth engine must prove the graphs and state transitions that Phase planning and delivery depend upon;
- update `STATE.md` and generated project guidance consistently;
- preserve the existing untracked Phase 1 discussion checkpoint.

## 2026-08-30 Canonical Addendum: Phase Closure Verification and Human Phase Acceptance

The Architecture, Workflow, Build Guide, Registry, and Foundations updates dated 2026-08-30 refine the accepted v13 workflow without changing its Phase-oriented source precedence, portable operation identity, Roadmap ownership, or non-goals.

### Verification and Acceptance Boundary

- The required verification hierarchy is **Task Verification → optional Spec Closure Verification → Phase Closure Verification**.
- Human Phase Acceptance is the residual human-facing portion of Phase Closure Verification. It is not a fourth verification layer and does not duplicate evidence already proven at Task or Spec scope.
- Sufficiently strong Task and Spec evidence is reused by Phase Closure Verification. Executable, system, browser, visual, and external Phase evidence runs before any human check, leaving only outcomes that cannot be proven adequately by automation for Human Phase Acceptance.

### Durable Phase Acceptance

- Phase acceptance state is created lazily at `.exspecso/phases/phase-NNN-slug/acceptance.md` when residual human checks exist. It records stable `PAC-NNN` checks, the Phase revision/context, expected outcome or instruction, status, result, and concise user-facing failure evidence.
- Each check is `pending`, `passed`, `failed`, or `needs-retest`. The in-progress Phase state is `stage: phase-acceptance`.
- A fresh `/exspecso-implement PHASE-NNN` reconstructs this state and resumes only `pending` or `needs-retest` checks. It batches actionable checks by default; it runs checks sequentially only when dependencies, shared state, safety, or diagnostic isolation require that order.

### Failure Routing and Completion

- A failure within approved intent reopens the smallest affected Spec or Task through the bounded Correction Loop, reruns affected verification and closure evidence, invalidates only stale `PAC-NNN` checks, and then returns to Phase Acceptance.
- Missing or changed intent creates an unresolved `blocking-plan-gap`, keeps the Phase incomplete, returns `needs-plan-revision`, and routes through `/exspecso-plan PHASE-NNN`. The earlier spec-level revision terminal is obsolete and must not be used.
- A Phase is done only when every required Spec is done, all Phase Closure Verification evidence (including required Human Phase Acceptance) passes, and no unresolved blocking plan gap remains.

### Deterministic and Conformance Scope

- `phase-closure-check`, `phase-acceptance-status`, and `phase-acceptance-record` are internal deterministic helper operations, not new public slash commands.
- Conformance fixtures must cover no-human closure, batched/resumable acceptance, selective retest, and plan-gap routing.
- This refinement does not alter the active Phase 1 UAT workflow. That UAT remains evidence for building Exspecso, not a future project `acceptance.md` artifact.

## Validation

Completion requires:

- every V1 requirement mapped exactly once to a roadmap Phase;
- no stale v12 source-of-truth, Phase-grooming, public `plan SPEC`, Spec-scoped `implement`, or Phase-wide-implementation-deferred statement;
- no colon-bearing portable skill identity;
- Phase 3 and Phase 4 success criteria matching the v13 workflow;
- normalized closure evidence and Human Phase Acceptance contracts, including durable PAC state, cross-session resume, and the two typed failure routes;
- consistent operation targets across Project, Requirements, Roadmap, State, and generated guidance;
- clean Markdown and Git diff checks.
