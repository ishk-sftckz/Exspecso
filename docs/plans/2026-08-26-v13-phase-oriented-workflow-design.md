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
7. Spec-level closure verification and independent Spec review remain required where declared. Phase-level integration or closure verification may run after all required Specs are done.
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

## Validation

Completion requires:

- every V1 requirement mapped exactly once to a roadmap Phase;
- no stale v12 source-of-truth, Phase-grooming, public `plan SPEC`, Spec-scoped `implement`, or Phase-wide-implementation-deferred statement;
- no colon-bearing portable skill identity;
- Phase 3 and Phase 4 success criteria matching the v13 workflow;
- consistent operation targets across Project, Requirements, Roadmap, State, and generated guidance;
- clean Markdown and Git diff checks.
