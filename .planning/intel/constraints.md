# Constraints

## Portable Operation Identity
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_a7Qm4LzP_START
  Portable skill IDs use exspecso-<operation>; public documentation uses /exspecso-<operation>. Runtime adapters may translate only a host-owned invocation sigil, such as Codex's $exspecso-<operation>, without changing the operation identity, arguments, behavior, artifacts, or safety semantics.
  DATA_a7Qm4LzP_END

## Start Contract
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_b3Vn8JrK_START
  After project-direction confirmation, start writes or updates .exspecso/brief.md, .exspecso/standards.md, and .exspecso/roadmap.md. The Roadmap contains the stable ROADMAP identity, the smallest complete Phase outcome set, and every Phase's lightweight Spec map with stable ID, concise outcome or title, preferred order, and meaningful explicit dependencies. Start does not create Phase folders or detailed Spec, Plan, or Task artifacts. There is no initial Phase-grooming choice or planning.initialPhaseGrooming configuration.
  DATA_b3Vn8JrK_END

## Roadmap Ownership Contract
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: schema
- content: |
  DATA_c6Ht2WqR_START
  .exspecso/roadmap.md is the sole canonical source for Phase declarations, order, dependencies, lightweight Spec declarations, Phase membership, and Spec order and dependencies. Phase briefs and detailed Specs reference these declarations without duplicating an authoritative membership or dependency map. V1 has no numbered Roadmaps, active-Roadmap selector, separate Roadmap status artifact, or normal new-roadmap operation. new-phase adds one Phase and its smallest complete lightweight Spec map without materializing the Phase or detailed Specs.
  DATA_c6Ht2WqR_END

## Phase Planning Contract
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_d8Xk5MpT_START
  plan PHASE-NNN is the normal public planning operation and targets an existing Roadmap Phase. It loads the relevant canonical artifacts and repository context; validates coverage, IDs, dependencies, and acyclic graphs; refines the lightweight Spec set only when necessary and confirmed; materializes the Phase brief and status; deeply plans every declared Spec into bounded spec.md, plan.md, tasks.md, and status.md artifacts; and requires confirmation of the Phase and every detailed Spec family before implementation readiness. It does not modify application source. Public plan SPEC-NNN scheduling is not part of the normal v13 workflow.
  DATA_d8Xk5MpT_END

## Phase Readiness Contract
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_e1Nr7YvC_START
  A Phase is deliverable only when its detailed Phase plan and every declared Spec's detailed planning artifacts are approved, all Phase dependencies are done, graphs are valid, and no active blocker prevents safe delivery. Dependencies gate delivery rather than planning, and declared order only breaks ties among READY work.
  DATA_e1Nr7YvC_END

## Phase Delivery Loop Contract
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_f9Bs3DuH_START
  implement PHASE-NNN starts one bounded Phase Delivery Loop over the approved Phase and its fully planned Spec set. The outer loop reconstructs state, selects one READY incomplete Spec by dependencies and declared-order tie-breaker, runs the selected Spec through an internal bounded loop, recomputes readiness, continues until all required Specs are done or a terminal result occurs, runs declared Phase-level closure verification, and marks the Phase done only after all required Spec and Phase closure obligations pass. Default Phase-level WIP is one active Spec Delivery Loop.
  DATA_f9Bs3DuH_END

## Internal Spec Delivery Loop Contract
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_g2Lc6SeN_START
  Each selected Spec retains one active Task by default, exact bounded canonical context, pre-change scope and evidence validation, feasible failing reproduction for bug fixes, bounded correction using the same evidence contract, incomplete-work resume checkpoints, evidence-gated durable checkpoints, default atomic Git commits for verified Tasks, declared Spec-level closure verification, independent final review where supported, and smallest-scope reopening with re-verification for correctable review findings.
  DATA_g2Lc6SeN_END

## Execution Modes and Results
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_h5Pz1UaF_START
  continuous is the default mode and proceeds across completed Specs until Phase completion or a terminal result. step pauses at a completed Spec boundary; Task checkpoints remain internal safety boundaries. The Phase Delivery Loop returns exactly one of completed, paused, blocked, needs-human, needs-spec-revision, correction-exhausted, or interrupted, projecting Phase state and relevant selected Spec or Task cause. Reinvoking implementation for an already complete Phase returns completed without repeating accepted work.
  DATA_h5Pz1UaF_END

## Verify, Review, and Status
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_i4Gw8KoD_START
  verify PHASE-NNN validates the Phase brief, all detailed Spec, Plan, Task, dependency, coverage, and verification-intent or evidence contracts without modifying application source. review PHASE-NNN is a review-only aggregate over canonical Spec review reports and Phase closure evidence. status is read-only, computes Roadmap, Phase, Spec, Task, blocker, evidence, checkpoint, correction, review, and last result state from artifacts, and recommends one next operation without silently repairing project truth.
  DATA_i4Gw8KoD_END
