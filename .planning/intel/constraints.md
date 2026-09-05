# Constraints

## Portable Operation Identity
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_N5yT8qLp_START
  `exspecso-<operation>` is the portable skill identity. `/exspecso-<operation>` is the canonical documentation notation. A runtime may translate only a host-owned invocation sigil without changing operation identity, arguments, behavior, artifacts, or safety semantics.
  DATA_N5yT8qLp_END

## Start Contract
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_C7mK2vRx_START
  After project-direction confirmation, `start` writes or updates `.exspecso/brief.md`, `.exspecso/standards.md`, and `.exspecso/roadmap.md`. The Roadmap contains one stable `ROADMAP` identity, the smallest complete Phase outcome set, and every Phase's lightweight Spec map. `start` does not create Phase folders or detailed Spec, Plan, or Task artifacts.
  DATA_C7mK2vRx_END

## Roadmap Ownership Contract
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: schema
- content: |
  DATA_J4pW9sAa_START
  `.exspecso/roadmap.md` is the sole canonical source for Phase declarations, order, dependencies, lightweight Spec declarations, Phase membership, and Spec order and dependencies. Phase briefs and detailed Specs reference these declarations without duplicating an authoritative membership or dependency map.
  DATA_J4pW9sAa_END

## Phase Planning Contract
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_B8dQ3hZs_START
  `plan PHASE-NNN` is the normal public planning operation and targets an existing Roadmap Phase. It validates coverage, IDs, dependencies, and acyclic graphs; materializes the Phase brief and status; deeply plans every declared Spec into bounded `spec.md`, `plan.md`, `tasks.md`, and `status.md` artifacts; and requires confirmation before implementation readiness. It does not modify application source.
  DATA_B8dQ3hZs_END

## Phase Readiness Contract
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_R1fU6nXe_START
  A Phase can enter delivery only when its detailed Phase plan and every declared Spec's detailed planning artifacts are approved, all Phase dependencies are done, Phase and Spec dependency graphs are valid, and no active blocker prevents safe delivery.
  DATA_R1fU6nXe_END

## Phase Delivery Loop Contract
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_V6rL0cMb_START
  `implement PHASE-NNN` starts one bounded Phase Delivery Loop. It reconstructs Phase and Spec state, selects one READY incomplete Spec, runs its internal bounded Spec Delivery Loop, recomputes readiness, and after required Specs are done runs Phase Closure Verification. Human Phase Acceptance runs only for residual human-facing checks after applicable executable, system, browser, visual, and external evidence has run.
  DATA_V6rL0cMb_END

## Internal Spec Delivery Loop Contract
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_H2xP7kWd_START
  Each selected Spec keeps one active Task at a time by default; validates bounded context, approved scope, and evidence before code changes; uses bounded correction with the same evidence contract; preserves incomplete-work resume checkpoints; creates verified durable checkpoints only after required evidence passes; and reopens the smallest affected Task and Acceptance Criteria for correctable review findings.
  DATA_H2xP7kWd_END

## Verification Hierarchy and Phase Closure Contract
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_G9wE4uCn_START
  Verification is one hierarchy: Task Verification → optional Spec Closure Verification → Phase Closure Verification. Evidence with sufficient strength at Task or Spec scope is reused; Phase Closure Verification must not repeat it merely because the Phase is closing. Human Phase Acceptance is only the residual human-facing portion of Phase Closure Verification, not a separate or fourth verification layer.
  DATA_G9wE4uCn_END

## Durable Human Phase Acceptance State
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: schema
- content: |
  DATA_D3aS8jQv_START
  When residual human checks exist, the deterministic layer lazily creates `.exspecso/phases/phase-NNN-slug/acceptance.md`. It records the Phase identifier, current Phase revision/context, and stable `PAC-NNN` checks with expected outcome or user instruction, status, result, and concise user-facing failure evidence. Check statuses are `pending`, `passed`, `failed`, and `needs-retest`.
  DATA_D3aS8jQv_END

## Phase Acceptance Resume Contract
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_M7bF2tYk_START
  While acceptance is incomplete, Phase status records `stage: phase-acceptance`. A fresh `/exspecso-implement PHASE-NNN` reconstructs the Phase from canonical artifacts and `acceptance.md`, resumes only `pending` or `needs-retest` checks, and preserves passed checks whose evidence remains current. Actionable checks batch by default; sequential execution is required only for dependency, shared mutable state, safety, or diagnostic-isolation reasons.
  DATA_M7bF2tYk_END

## Phase Acceptance Failure Routes
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_Q5nC9zHr_START
  A failure within approved intent reopens the smallest affected Spec or Task through the bounded Correction Loop, reruns affected verification and Phase Closure Verification evidence, invalidates only stale `PAC-NNN` checks, and returns to Phase Acceptance. Missing or changed intent creates an unresolved `blocking-plan-gap`, keeps the Phase incomplete, returns `needs-plan-revision`, and routes through `/exspecso-plan PHASE-NNN`.
  DATA_Q5nC9zHr_END

## Phase Completion Gate
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_W8kR1mLp_START
  A Phase becomes done only when all required Specs are done, every required Phase Closure Verification item has passed (including all required Human Phase Acceptance checks), and no unresolved `blocking-plan-gap` remains. A completed Phase rerun returns `completed` only while those conditions remain true.
  DATA_W8kR1mLp_END

## Execution Modes and Results
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_E6vT3pJd_START
  `execution.mode` supports `continuous` and `step`; step pauses at a completed Spec boundary. The Phase Delivery Loop returns exactly one of `completed`, `paused`, `blocked`, `needs-human`, `needs-plan-revision`, `correction-exhausted`, or `interrupted`.
  DATA_E6vT3pJd_END

## Verify, Review, and Status
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_L4qX7sNc_START
  `verify PHASE-NNN` validates the Phase brief, detailed artifacts, dependencies, coverage links, verification-intent/evidence contracts, and declared Phase Closure Verification without modifying application source. `status` computes Phase acceptance state and recommends `/exspecso-implement PHASE-NNN` when `stage: phase-acceptance` has pending or needs-retest work, without silently repairing project truth.
  DATA_L4qX7sNc_END

## Deterministic Helper Surface
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: protocol
- content: |
  DATA_P2hM8cVu_START
  `phase-closure-check` resolves and evaluates declared Phase Closure Verification evidence, including reusable Task or Spec evidence. `phase-acceptance-status` reads and validates lazy `acceptance.md` state. `phase-acceptance-record` records an acceptance result and updates only the affected durable check state. These are internal deterministic helper operations, not public slash commands.
  DATA_P2hM8cVu_END

## Conformance Obligations
- source: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
- type: nfr
- content: |
  DATA_S9uD4wKe_START
  Conformance fixtures prove no-human closure, batched/resumable acceptance, selective retest, and plan-gap routing. No-human closure completes without creating `acceptance.md`; plan-gap routing records `blocking-plan-gap`, keeps the Phase incomplete, returns `needs-plan-revision`, and routes to `/exspecso-plan PHASE-NNN`.
  DATA_S9uD4wKe_END
