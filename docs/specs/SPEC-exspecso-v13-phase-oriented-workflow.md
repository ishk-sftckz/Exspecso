# SPEC: Exspecso Documentation v13 Phase-Oriented Workflow

**Source version:** Documentation v13
**Source date:** 2026-08-26
**Normalization status:** Approved by project owner
**Decision precedence:** See `docs/plans/2026-08-26-v13-phase-oriented-workflow-design.md`

## Source Set

This normalized Spec synthesizes the current implementation contracts from:

- [Exspecso hub](https://app.notion.com/p/2837d0b4dee2808c9745fc3d986960de)
- [Design Principles / Foundations](https://app.notion.com/p/30c7d0b4dee280daaf81ff66ad8c960d)
- [Architecture & Design Decisions v13](https://app.notion.com/p/3ad7d0b4dee281ec9a2bf2d3d0f7b588)
- [Artifact, Entity & Contract Registry v13](https://app.notion.com/p/3ad7d0b4dee281d5afa9cef8d742710c)
- [Complete Product & Agent Workflow v13](https://app.notion.com/p/3ad7d0b4dee2818c8a86c12c2882fc0c)
- [Step-by-Step Build Guide v13](https://app.notion.com/p/3ad7d0b4dee28193abdadeecb779a5af)

The Notion pages contain isolated stale v12 fragments. The approved design resolves those contradictions and keeps the dominant v13 Phase-oriented contracts below.

## Normal User Flow

```text
npx exspecso init
/exspecso-start
/exspecso-plan PHASE-001
/exspecso-verify PHASE-001             # optional pre-implementation verification
/exspecso-implement PHASE-001
/exspecso-status
/exspecso-review PHASE-001             # optional explicit review-only aggregate
/exspecso-update <artifact-id> "change"
/exspecso-new-phase "outcome"
```

`exspecso-<operation>` is the portable skill identity. `/exspecso-<operation>` is the canonical documentation notation. A runtime may translate only a host-owned invocation sigil, such as Codex's `$exspecso-<operation>` explicit skill invocation.

## Start Contract

After project-direction confirmation, `start` writes or updates:

```text
.exspecso/brief.md
.exspecso/standards.md
.exspecso/roadmap.md
```

The Roadmap contains:

- one stable `ROADMAP` identity;
- the smallest complete set of Phase outcomes required for the confirmed goal;
- for every Phase, a lightweight Spec map containing stable Spec ID, concise outcome/title, preferred order, and explicit dependencies where meaningful;
- explicit Phase dependencies and Spec dependencies at the highest meaningful level.

`start` does not create Phase folders, `spec.md`, `plan.md`, `tasks.md`, or detailed Spec requirements. There is no initial Phase-grooming choice and no `planning.initialPhaseGrooming` configuration in v13. The full Phase and lightweight Spec delivery map is always visible while detailed artifacts remain lazy.

## Roadmap Ownership Contract

`.exspecso/roadmap.md` is the sole canonical source for:

- Phase declarations, order, and dependencies;
- lightweight Spec declarations, Phase membership, order, and dependencies.

Phase briefs and detailed Specs reference these declarations but do not duplicate a second authoritative membership or dependency map. V1 has no numbered Roadmaps, active-Roadmap selector, separate Roadmap status artifact, or normal `new-roadmap` operation.

`new-phase` extends the existing Roadmap with one new Phase plus that Phase's smallest complete lightweight Spec map. It does not materialize Phase or detailed Spec artifacts.

## Phase Planning Contract

`plan PHASE-NNN` is the normal public planning operation. The target Phase must already exist in the Roadmap.

The operation:

1. Loads the Constitution, Brief, Standards, Roadmap, target Phase declaration and lightweight Spec map, and relevant repository context.
2. Validates complete Phase-to-Spec outcome coverage, explicit dependencies, known IDs, and acyclic graphs.
3. Refines the lightweight Spec set only when necessary and with user confirmation.
4. Materializes the Phase `brief.md` and `status.md`.
5. Deeply plans every declared Spec into its own bounded `spec.md`, `plan.md`, `tasks.md`, and `status.md` family.
6. Requires explicit confirmation of the Phase brief and every detailed Spec/Plan/Task family before the Phase becomes implementation-ready.
7. Does not modify application source code.

Internal Spec planning remains a real bounded operation, but users do not schedule a separate public `plan SPEC-NNN` command in the normal v13 workflow.

Every detailed Spec remains independently reconstructible, verifiable, correctable, resumable, traceable, and reviewable. Phase planning must never flatten all Specs into one Phase-wide Plan or Task list.

## Planning Completeness

Planning follows coverage before compression:

- the Roadmap completely covers the approved project/release goal through necessary Phases;
- every Phase outcome is completely covered by necessary lightweight Specs;
- every Spec outcome is completely covered by current Requirements and Acceptance Criteria;
- every Requirement and Acceptance Criterion is covered by the smallest viable Plan and Task set;
- every Acceptance Criterion declares verification intent before implementation;
- every child justifies itself through an approved parent outcome;
- future-only work, orphan work, duplicate work, unnecessary splits, and speculative architecture are excluded.

One Phase, one Spec, or one Task is valid when sufficient. No fixed artifact-count target is a quality signal.

## Phase Readiness Contract

A Phase can enter delivery only when:

- its detailed Phase plan is approved;
- every declared Spec has approved detailed planning artifacts;
- all Phase dependencies are done;
- Phase and Spec dependency graphs are valid;
- no active blocker prevents safe delivery.

Dependencies gate delivery, not planning. Declared order is a preferred tie-breaker among READY work and never an implicit dependency.

## Phase Delivery Loop Contract

`implement PHASE-NNN` explicitly starts one bounded Phase Delivery Loop. The approved Phase and its fully planned Spec set are the finite outer work budget.

The outer loop:

1. Reconstructs Phase and Spec state from canonical artifacts.
2. Selects one READY incomplete Spec using explicit dependencies and declared order as a tie-breaker.
3. Runs that Spec through one internal bounded Spec Delivery Loop.
4. Recomputes Spec readiness after the selected Spec becomes done.
5. Continues until every required Spec is done, a deliberate step boundary is reached, or a typed terminal condition stops progress.
6. Runs Phase Closure Verification after all required Specs are done, reusing sufficient Task and Spec evidence rather than duplicating it.
7. Runs Human Phase Acceptance only when a residual human-facing check remains after executable, system, browser, visual, and external Phase evidence has run.
8. Marks the Phase done only after all required Specs, all Phase Closure Verification evidence, required Human Phase Acceptance, and the no-blocking-plan-gap gate pass.

At Phase level, one Spec Delivery Loop runs at a time by default. Multiple READY Specs are scheduling opportunities, not permission for automatic multi-Spec parallel execution.

## Internal Spec Delivery Loop Contract

Each selected Spec keeps the v12 safety model strengthened by v13:

- one active Task at a time by default;
- exact bounded Task context resolved from canonical artifacts;
- approved Task scope and evidence contract validated before code changes;
- failing reproduction before bug-fix implementation when feasible;
- no silent out-of-scope implementation;
- no weakening, deletion, skipping, or reinterpretation of approved verification to obtain green;
- bounded Correction Loop using the same evidence contract;
- resume checkpoint for interrupted incomplete work;
- verified durable checkpoint only after required evidence passes;
- one atomic Git commit per verified Task by default in Git repositories;
- declared Spec-level closure verification after Tasks and before review;
- logically independent final Spec review where supported;
- correctable review findings reopen the smallest affected Task and Acceptance Criteria and require full re-verification.

Spec and Task boundaries remain canonical even though the user invokes planning and delivery at Phase scope.

## Verification Hierarchy and Phase Closure Contract

Verification is one hierarchy:

```text
Task Verification → optional Spec Closure Verification → Phase Closure Verification
```

Task Verification proves bounded Task acceptance criteria. Optional Spec Closure Verification proves declared cross-Task or Spec outcomes after its Tasks pass. Phase Closure Verification proves declared integration and Phase outcomes after every required Spec is done. Evidence with sufficient strength at Task or Spec scope is reused; Phase Closure Verification must not repeat it merely because the Phase is closing.

Phase Closure Verification first runs all applicable executable, system, browser, visual, and external evidence. **Human Phase Acceptance** is only its residual human-facing portion: the checks whose expected outcome cannot be sufficiently proven by that evidence. It is not a separate or fourth verification layer.

### Durable Human Phase Acceptance State

When residual human checks exist, the deterministic layer lazily creates:

```text
.exspecso/phases/phase-NNN-slug/acceptance.md
```

The artifact is durable canonical state, not a planning artifact. It records the Phase identifier, current Phase revision/context, and stable `PAC-NNN` checks. Each check records its expected outcome or user instruction, status, result, and concise user-facing failure evidence. The only check statuses are:

```text
pending | passed | failed | needs-retest
```

While acceptance is incomplete, Phase status records `stage: phase-acceptance`. A fresh `/exspecso-implement PHASE-NNN` reconstructs the Phase from canonical artifacts and its `acceptance.md`; it resumes only checks in `pending` or `needs-retest`, preserving passed checks whose evidence remains current. It batches actionable checks by default. Sequential execution is required only where a check depends on another, shares mutable state, has a safety constraint, or needs diagnostic isolation.

### Phase Acceptance Failure Routes

Phase Closure Verification must keep these routes distinct:

1. **Failure within approved intent:** reopen the smallest affected Spec or Task, run the bounded Correction Loop using the approved evidence contract, rerun affected Task/Spec verification and Phase Closure Verification evidence, invalidate only `PAC-NNN` checks made stale by that correction, then return to Phase Acceptance.
2. **Missing or changed intent:** create an unresolved `blocking-plan-gap`, keep the Phase incomplete, return `needs-plan-revision`, and route the work through `/exspecso-plan PHASE-NNN`. The implementation loop cannot silently reinterpret the missing intent or weaken evidence to continue.

The earlier spec-level revision terminal is obsolete and must not be emitted by a v13 Phase Delivery Loop.

### Phase Completion Gate

A Phase becomes done only when all required Specs are done, every required Phase Closure Verification item has passed (including all required Human Phase Acceptance checks), and no unresolved `blocking-plan-gap` remains. A completed Phase rerun returns `completed` only while those conditions remain true.

## Execution Modes and Results

`execution.mode` supports:

- `continuous` (default): complete the current Spec, recompute READY Specs, and continue until Phase completion or a terminal result;
- `step`: pause at a completed Spec boundary. Task checkpoints remain internal safety boundaries and do not require user scheduling.

The Phase Delivery Loop returns exactly one result:

```text
completed
paused
blocked
needs-human
needs-plan-revision
correction-exhausted
interrupted
```

Results must project the outer Phase state and, when relevant, the selected inner Spec/Task cause. Reinvoking implementation for an already complete Phase returns `completed` without repeating accepted work.

## Verify, Review, and Status

- `verify PHASE-NNN` validates the Phase brief plus every detailed Spec, Plan, Task, dependency, coverage link, verification-intent/evidence contract, and the consistency of declared Phase Closure Verification. It does not modify application source.
- Automatic final review still occurs per Spec inside delivery. `review PHASE-NNN` is an explicit review-only aggregate that reads each Spec's canonical review report and Phase Closure Verification evidence without duplicating Spec review state or unexpectedly changing code.
- `status` remains read-only and computes Roadmap, Phase, Spec, Task, blocker, evidence, checkpoint, correction, review, Phase acceptance state, and last loop-result state from artifacts. It recommends `/exspecso-implement PHASE-NNN` when `stage: phase-acceptance` has pending or needs-retest work, without silently repairing project truth.

## Deterministic Helper Surface

The following are internal deterministic helper operations, not new public slash commands:

- `phase-closure-check` resolves and evaluates declared Phase Closure Verification evidence, including what may be reused from Task or Spec scope.
- `phase-acceptance-status` reads and validates lazy `acceptance.md` state, including `PAC-NNN` statuses and resumability.
- `phase-acceptance-record` records an acceptance result with concise user failure evidence and updates only the affected durable check state.

These helpers preserve the separation between canonical artifacts, deterministic bookkeeping, and runtime orchestration. They do not authorize a builder to weaken, delete, skip, or reinterpret approved verification.

## Conformance Obligations

The conformance fixture suite must prove:

- **no-human closure:** a Phase with no residual human checks can pass Phase Closure Verification and complete without creating `acceptance.md`;
- **batched/resumable acceptance:** actionable `PAC-NNN` checks batch by default and a fresh session resumes only pending or needs-retest checks from durable state;
- **selective retest:** a bounded approved-intent correction invalidates only acceptance checks made stale and preserves unrelated passed evidence;
- **plan-gap routing:** missing or changed intent records `blocking-plan-gap`, keeps the Phase incomplete, returns `needs-plan-revision`, and routes to `/exspecso-plan PHASE-NNN`.

## Required Planning-Document Changes

The existing GSD artifacts must be updated so that:

- Documentation v13 replaces v12 as implementation authority;
- obsolete `progressive` and `all-phases` grooming requirements are removed;
- `start` always creates the complete lightweight Phase and Spec Roadmap map;
- public planning targets a Phase and deep-plans all its Specs;
- public implementation targets a Phase and preserves internal Spec/Task boundaries;
- Phase readiness, one-READY-Spec selection, Phase-level WIP, Spec-boundary step mode, Phase closure, completion, rerun, and aggregate review are explicitly required;
- Task Verification, optional Spec Closure Verification, and Phase Closure Verification form one hierarchy; Human Phase Acceptance is only the residual human-facing portion of Phase Closure Verification;
- lazy durable acceptance state, `PAC-NNN` checks, `stage: phase-acceptance`, pending/needs-retest resume, default batching, and required sequential exceptions are explicit;
- approved-intent failures use bounded correction and selective stale-evidence invalidation, while missing or changed intent becomes `blocking-plan-gap` and returns `needs-plan-revision` through Phase planning;
- Phase completion requires all Specs done, all closure evidence and required acceptance passed, and no unresolved blocking plan gap;
- deterministic helper operations and fixtures cover phase-closure-check, phase-acceptance-status, phase-acceptance-record, no-human closure, batched/resumable acceptance, selective retest, and plan-gap routing;
- Spec-scoped delivery remains an internal loop rather than the user-facing command boundary;
- automatic sequential multi-Spec orchestration inside one approved Phase is V1 scope, while automatic parallel multi-Spec or multi-Phase execution remains deferred;
- the six-phase build roadmap is retained unless requirement coverage proves a different phase boundary necessary;
- Phase 2 remains before Phase 3 as the fixture-proven deterministic truth engine required by hierarchical planning and delivery;
- Phase 3 delivers orientation plus complete Phase planning;
- Phase 4 delivers one approved Phase through internal Spec loops;
- correction, continuity, traceability, hardening, runtime conformance, and release remain in their existing later phases with target terminology updated.

## Explicit Non-Goals

- Colon-bearing portable skill IDs.
- Public user scheduling of every Spec plan or Spec delivery loop.
- Flattening a Phase into one Plan, one Task list, one context, or one evidence boundary.
- Automatic parallel Spec or Phase delivery in V1.
- Background autonomous orchestration after the command ends.
- A second Roadmap lifecycle or `new-roadmap` command.
- Phase-grooming modes that materialize partial Phase artifacts during `start`.
