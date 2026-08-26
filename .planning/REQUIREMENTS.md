# Requirements: Exspecso

**Defined:** 2026-08-21
**Core Value:** Approved specs must survive context limits, implementation, failure, verification, runtime changes, and session boundaries without losing intent or allowing unproven work to count as complete.

## v1 Requirements

### Setup and Installation

- [ ] **SETUP-01**: User can initialize Exspecso from the repository root with `npx exspecso init`.
- [ ] **SETUP-02**: User can initialize Exspecso from a nested directory while Exspecso targets the containing Git repository root.
- [ ] **SETUP-03**: User can select one or more of Claude Code, OpenAI Codex, and OpenCode during initialization.
- [ ] **SETUP-04**: User receives suggested runtime selections when supported coding agents are detected, while retaining final control over selections.
- [ ] **SETUP-05**: User receives only the native integration files for the runtimes selected during initialization.
- [ ] **SETUP-06**: User receives only the minimal canonical project files during initialization, without empty Roadmap, Phase, Spec, trace, research, or report artifacts.
- [ ] **SETUP-07**: User can rerun initialization to add or refresh runtime integrations without replacing confirmed canonical artifacts.
- [ ] **SETUP-08**: User sees the next Exspecso operation after initialization completes, using the canonical `/exspecso-<operation>` notation and any unavoidable runtime-native invocation sigil.

### Artifact and State Model

- [ ] **ART-01**: User can inspect current project intent and progress directly through ordinary Markdown and small JSON files in the repository.
- [ ] **ART-02**: User can operate Exspecso without a database, cloud account, hidden canonical state, generated duplicate views, or an export step.
- [ ] **ART-03**: User can address each Roadmap, Phase, Spec, Requirement, Acceptance Criterion, Plan, Task, Decision, and review finding through a stable ID.
- [ ] **ART-04**: User can rename human-readable titles and slugs without changing stable artifact identity or explicit parent relationships.
- [ ] **ART-05**: User receives deeper artifacts only when the corresponding workflow first makes them actionable.
- [ ] **ART-06**: User can resolve an artifact ID to its canonical file or stable section, including a `TASK-NNN` section inside one Spec-level `tasks.md`.
- [ ] **ART-07**: User retains the previous valid artifact set when an atomic multi-file workflow write fails or is interrupted.
- [ ] **ART-08**: User can edit canonical artifacts directly and receive explicit validation errors for invalid structure or relationships.
- [ ] **ART-09**: User can rely on one stable `ROADMAP` artifact at `.exspecso/roadmap.md` without numbered Roadmap folders, an active-Roadmap selector, or a separate canonical Roadmap status file.

### Discovery and Orientation

- [ ] **DISC-01**: User can run `/exspecso-start` to begin one discovery and project-orientation workflow.
- [ ] **DISC-02**: User receives a greenfield or brownfield orientation based on repository evidence and supplied project context.
- [ ] **DISC-03**: User can provide existing documents and repository evidence that Exspecso incorporates before asking unresolved questions.
- [ ] **DISC-04**: User is asked only questions that resolve material ambiguity, contradiction, unnecessary scope, or weak assumptions not answerable from supplied evidence.
- [ ] **DISC-05**: User can review challenges and recommendations without Exspecso silently replacing product intent.
- [ ] **DISC-06**: User receives bounded research, repository investigation, feasibility analysis, or critique only when uncertainty materially affects project direction.
- [ ] **DISC-07**: User receives synthesized findings from temporary workers without worker transcripts becoming canonical project state.
- [ ] **DISC-08**: User confirms the synthesized project direction before the Brief, Standards, or Roadmap becomes authoritative.
- [ ] **DISC-09**: User receives a project Brief, applicable Standards, and one canonical `.exspecso/roadmap.md` after confirmed orientation.
- [ ] **DISC-10**: User can resume an interrupted orientation workflow from persisted confirmed answers and current discovery state without relying on prior chat history.
- [ ] **DISC-11**: User can choose `progressive` or `all-phases` as the initial Phase-grooming horizon after confirming project direction.
- [ ] **DISC-12**: User can choose `progressive` to keep every Phase as a concise Roadmap declaration until `/exspecso-plan PHASE-NNN` materializes it.
- [ ] **DISC-13**: User can choose `all-phases` to materialize every declared Phase at Phase-planning depth without creating executable Spec artifacts.

### Progressive Planning

- [ ] **PLAN-01**: User receives a Roadmap containing the smallest complete set of major Phase outcomes needed for the confirmed release goal.
- [ ] **PLAN-02**: User receives stable Phase IDs and explicit Phase dependencies as concise outcome-level declarations in the canonical Roadmap.
- [ ] **PLAN-03**: User can run `/exspecso-plan PHASE-NNN` only for a Phase declared by `.exspecso/roadmap.md`.
- [ ] **PLAN-04**: User receives a materialized Phase brief and status containing the smallest complete set of bounded Specs needed to cover every Phase success outcome.
- [ ] **PLAN-05**: User receives stable Spec IDs and explicit Spec dependencies from Phase planning without executable Spec folders being created prematurely.
- [ ] **PLAN-06**: User can run `/exspecso-plan SPEC-NNN` only for a Spec declared by its planned parent Phase.
- [ ] **PLAN-07**: User receives one executable Spec folder containing `spec.md`, `plan.md`, `tasks.md`, and `status.md` after deep Spec planning.
- [ ] **PLAN-08**: User receives only Requirements and Acceptance Criteria necessary for the current approved Spec outcome.
- [ ] **PLAN-09**: User receives Acceptance Criteria that collectively cover every current Requirement without uncovered approved behavior.
- [ ] **PLAN-10**: User receives a declared verification intent for every Acceptance Criterion before a Spec can become implementation-ready.
- [ ] **PLAN-11**: User receives Spec-level closure verification only when cross-Task, system, acceptance, or regression proof is required.
- [ ] **PLAN-12**: User receives the smallest viable implementation approach and minimum Task set that satisfies approved scope and evidence obligations.
- [ ] **PLAN-13**: User receives one canonical `tasks.md` whose stable Task sections each declare linked Requirements, Acceptance Criteria, objective, scope boundary, dependencies, status, and concrete verification contract.
- [ ] **PLAN-14**: User receives a failing-reproduction requirement for bug-fix work whenever reproduction is technically feasible.
- [ ] **PLAN-15**: User can approve or revise each Phase plan and executable Spec plan before it becomes authoritative.
- [ ] **PLAN-16**: User can plan work without Exspecso modifying application source code.
- [ ] **PLAN-17**: User receives complete parent-outcome coverage before Exspecso removes duplication, future-only work, or unnecessary decomposition.
- [ ] **PLAN-18**: User receives no child work that lacks justification through a current approved parent outcome.
- [ ] **PLAN-19**: User can receive a one-Phase, one-Spec, or one-Task decomposition when one unit is sufficient, without fixed artifact-count targets.
- [ ] **PLAN-20**: User can trust that `all-phases` grooming gives every declared Phase a complete Spec declaration list while leaving `spec.md`, `plan.md`, and `tasks.md` lazy.
- [ ] **PLAN-21**: User can trust that merely declaring or grooming a Phase does not arbitrarily set it as the active current-work Phase.

### Deterministic Control

- [ ] **CTRL-01**: User receives an operation-specific context contract containing exact canonical file or section references.
- [ ] **CTRL-02**: User receives the smallest sufficient Task context by default and can grant explicit context escalation through a structured `NEED_CONTEXT` request.
- [ ] **CTRL-03**: User can reconstruct the next correct action from canonical artifacts and repository state in a cold session.
- [ ] **CTRL-04**: User receives mechanically computed Task, Spec, Phase, and Roadmap status rather than status inferred from conversation history.
- [ ] **CTRL-05**: User receives validation errors for unknown Phase, Spec, or Task dependency IDs.
- [ ] **CTRL-06**: User receives validation errors for dependency cycles at Phase, Spec, or Task level.
- [ ] **CTRL-07**: User can plan an artifact while its dependencies remain incomplete, while delivery readiness remains blocked until explicit dependencies are satisfied.
- [ ] **CTRL-08**: User receives declared ordering only as a preference among equally ready work, never as an implicit dependency.
- [ ] **CTRL-09**: User is protected from activating a second sequential Task while another Task is actively being implemented.
- [ ] **CTRL-10**: User can activate parallel Tasks only after dependency, change-surface, verification, checkpoint, and integration independence checks pass.
- [ ] **CTRL-11**: User receives only relevant durable Decision sections in bounded context rather than the entire Decision Log.
- [ ] **CTRL-12**: User can preserve a meaningful product, architecture, scope, constraint, or tradeoff decision as a stable `DEC-NNN` record.
- [ ] **CTRL-13**: User can supersede a durable decision while retaining and linking the prior rationale.
- [ ] **CTRL-14**: User does not receive Decision Log entries for routine implementation details, activity history, or minor naming choices.

### Evidence-Gated Delivery

- [ ] **DELV-01**: User can start a bounded Delivery Loop for one approved Spec with `/exspecso-implement SPEC-NNN`.
- [ ] **DELV-02**: User receives a blocked result with unmet Phase or Spec dependency IDs when the target Spec is not delivery-ready.
- [ ] **DELV-03**: User can trust that the approved Plan is the Delivery Loop's finite work budget and that the loop does not invent Requirements, Tasks, or scope.
- [ ] **DELV-04**: User receives continuous execution by default, with Exspecso selecting the next ready approved Task after each verified checkpoint.
- [ ] **DELV-05**: User can select step execution and receive a safe `paused` result after one verified Task or closure boundary.
- [ ] **DELV-06**: User can interrupt delivery and receive an explicit `interrupted` result rather than ambiguous loop state.
- [ ] **DELV-07**: User can trust that implementation changes are limited to the current Task's approved scope and linked Acceptance Criteria.
- [ ] **DELV-08**: User receives a recorded deferred finding for useful non-blocking work outside the current Task instead of silent implementation.
- [ ] **DELV-09**: User receives an explicit stop when an out-of-scope discovery blocks safe Task completion.
- [ ] **DELV-10**: User must approve a Spec or Plan revision before discovered work can expand implementation scope.
- [ ] **DELV-11**: User receives the Task's declared evidence contract as the completion target before implementation changes begin.
- [ ] **DELV-12**: User receives a failing reproduction before a bug-fix implementation when reproduction is technically feasible.
- [ ] **DELV-13**: User can trust that implementing-agent confidence or explanation cannot mark a Task complete.
- [ ] **DELV-14**: User receives executable verification for mechanically testable behavior whenever reasonably practical.
- [ ] **DELV-15**: User receives explicit browser, visual, human, file, external, or other appropriate evidence when executable verification cannot faithfully prove an Acceptance Criterion.
- [ ] **DELV-16**: User is protected from builders weakening, deleting, skipping, or materially reinterpreting approved or pre-existing verification merely to obtain a pass.
- [ ] **DELV-17**: User receives a verified durable Task checkpoint only after the Task's full required evidence contract passes.
- [ ] **DELV-18**: User receives required Spec-level closure verification after all implementation Tasks and before final review.
- [ ] **DELV-19**: User receives a logically independent final review after required Task and closure evidence passes.
- [ ] **DELV-20**: User can trust that a correctable final-review finding reopens the smallest affected Task and Acceptance Criteria, reruns full required evidence, creates a new verified checkpoint, refreshes trace, reruns affected closure evidence, and returns to review.
- [ ] **DELV-21**: User receives exactly one explainable Delivery Loop result: `completed`, `paused`, `blocked`, `needs-human`, `needs-spec-revision`, `correction-exhausted`, or `interrupted`.
- [ ] **DELV-22**: User receives `completed` without repeated work when implementation is invoked for a Spec that already satisfies all completion gates.

### Correction and Continuity

- [ ] **REC-01**: User receives a bounded Assess → Learn → Patch → Reverify Correction Loop after safely correctable Task, closure, or review failure.
- [ ] **REC-02**: User can trust that every correction attempt reruns the same evidence contract that exposed the failure.
- [ ] **REC-03**: User receives a lazily created correction log recording episode, attempt, trigger, affected scope, evidence, learning, intended patch, signature, and result.
- [ ] **REC-04**: User receives a visible stop when correction reaches its configured per-episode attempt limit.
- [ ] **REC-05**: User receives a visible stop when the same failure repeats without meaningful progress.
- [ ] **REC-06**: User receives escalation instead of correction when resolution requires ambiguous intent, expanded scope, changed verification, permission, or an external dependency.
- [ ] **CONT-01**: User can persist lightweight resume state for an interrupted incomplete Task when doing so materially reduces reconstruction work.
- [ ] **CONT-02**: User receives resume state containing only useful handoff data such as Git base, changed areas, latest verification, blocker, and next action.
- [ ] **CONT-03**: User can trust that a resume checkpoint never marks a Task complete or permits the next sequential Task to start.
- [ ] **CONT-04**: User can resume the first incomplete Task after Exspecso validates persisted assumptions against current Git and repository state.
- [ ] **CONT-05**: User can rerun implementation without repeating Tasks that already have accepted verified checkpoints.
- [ ] **CONT-06**: User receives one atomic Git commit per successfully verified Task by default in Git repositories.
- [ ] **CONT-07**: User can disable automatic Task commits without disabling the mandatory verified artifact checkpoint.

### Traceability, Review, and Status

- [ ] **TRACE-01**: User can trace every implemented Requirement through Acceptance Criterion, Task, changed code or file, declared evidence, verified checkpoint, and final status.
- [ ] **TRACE-02**: User receives a trace failure when any required link in the implementation evidence chain is missing.
- [ ] **TRACE-03**: User receives a review report containing the reviewed Spec revision, repository state, criterion results, trace result, findings, and final verdict.
- [ ] **TRACE-04**: User receives one review verdict: `pass`, `needs-implementation-fix`, `needs-spec-revision`, or `human-review-required`.
- [ ] **TRACE-05**: User can trust that a Spec becomes `done` only after Requirements are satisfied, verification intent is complete, required Task evidence passes, verified checkpoints are accepted, required closure evidence passes, trace closes, and final review passes.
- [ ] **TRACE-06**: User can run `/exspecso-status` to view artifact-derived Roadmap, Phase, Spec, Task, blocker, evidence, review, and Delivery Loop state.
- [ ] **TRACE-07**: User receives one concrete next command from status without status silently mutating or repairing project state.

### Runtime Portability

- [ ] **PORT-01**: User can access `start`, `plan`, `verify`, `implement`, `review`, `status`, `update`, and `new-phase` through the same portable `exspecso-<operation>` skill IDs in Claude Code, OpenAI Codex, and OpenCode.
- [ ] **PORT-02**: User can use all supported runtimes against the same canonical artifact names, stable IDs, relationships, statuses, and lifecycle rules.
- [ ] **PORT-03**: User can continue in a different supported runtime without migrating canonical state or transferring chat history.
- [ ] **PORT-04**: User receives explicit runtime-native invocation guidance when a host requires a different skill sigil, without changing the `exspecso-<operation>` ID, arguments, behavior, artifacts, or safety semantics.
- [ ] **PORT-05**: User can add or refresh a runtime integration by rerunning `init` without recreating project artifacts.
- [ ] **PORT-06**: User can trust that runtime-native integration files remain adapters rather than canonical project state and map every operation to the same `/exspecso-<operation>` documentation notation.

### Change, Hardening, and Release

- [ ] **REL-01**: User can update a canonical artifact through `/exspecso-update` with an explicit revision and confirmation boundary.
- [ ] **REL-02**: User can extend `.exspecso/roadmap.md` through `/exspecso-new-phase "<outcome>"` without creating a second Roadmap artifact.
- [ ] **REL-03**: User receives safe, explainable behavior for malformed frontmatter, broken links, interrupted writes, dirty working trees, and external Git drift.
- [ ] **REL-04**: User can safely rerun every Exspecso command without duplicate artifacts or corrupted confirmed state.
- [ ] **REL-05**: User can follow greenfield and brownfield examples that demonstrate the intended progressive workflow.
- [ ] **REL-06**: Maintainer can run one shared conformance fixture through Claude Code, OpenAI Codex, and OpenCode.
- [ ] **REL-07**: Maintainer can verify continuous delivery, step-mode pause/resume, correction recovery, review-driven reopening, and cross-runtime continuation through automated fixtures.
- [ ] **REL-08**: Maintainer can measure resume cost in files read, tool calls, approximate context, and steps to the next useful action.
- [ ] **REL-09**: User can install the released V1 as one documented npm package.
- [ ] **REL-10**: User receives the next stable `PHASE-NNN`, parent justification, and required Phase dependencies only after `/exspecso-new-phase` validates the request and receives confirmation.
- [ ] **REL-11**: User is directed to `/exspecso-update` before adding a Phase when the requested outcome changes the established project direction.

## v2 Requirements

Deferred to future releases and not included in the current roadmap.

### Advanced Capabilities

- **ADV-01**: User can use richer repository-intelligence providers such as structural indexes or code knowledge graphs as optional derived context.
- **ADV-02**: User can maintain living or delta-based specifications that reconcile implemented change without weakening approved-intent history.
- **ADV-03**: User can use a lightweight quick-change workflow that preserves essential scope and evidence guarantees with reduced ceremony.
- **ADV-04**: User can orchestrate multiple approved Specs or Phases automatically when higher-level independence is proven.
- **ADV-05**: User can use additional coding-agent runtimes through the same shared conformance contract.
- **ADV-06**: User can collaborate through optional remote services while repository artifacts remain authoritative.

## Out of Scope

| Feature | Reason |
|---------|--------|
| SQLite or another hidden canonical database | Conflicts with the V1 repository-artifact source-of-truth model |
| Cloud control plane, accounts, dashboard, OAuth, billing, or synchronization | V1 proves the local harness and portable artifact workflow first |
| Generated views that duplicate canonical artifacts | The file users inspect must be canonical, not an export or projection |
| Multiple npm packages or a required monorepo | One release unit keeps shared contracts simple until a concrete split is justified |
| Heavy project-management or enterprise-SDLC functionality | Exspecso governs agent delivery without becoming a PM platform |
| Permanent named product-level agent roles | Temporary runtime workers are sufficient and avoid hard-coding orchestration tactics into the product model |
| Phase-wide implementation in V1 | One approved Spec is the finite and reviewable Delivery Loop boundary |
| Automatic multi-Spec or multi-Phase execution in V1 | Higher-level concurrency is deferred until shared contracts and Task-level safety are proven |
| Unbounded autonomous or background execution | Exspecso only runs a finite approved Plan after an explicit command |
| Universal TDD or E2E after every Task | Evidence must match the Acceptance Criterion rather than follow one testing ritual |
| Speculative scale, providers, generalized abstractions, or future-proof architecture | Future possibility is not a current requirement |
| Runtime-specific canonical state | Runtime switching depends on one portable source of truth |
| Numbered Roadmap folders, `ROADMAP-002`, or `/exspecso-new-roadmap` | Documentation v12 evolves one canonical `.exspecso/roadmap.md` through revisions, Git history, durable decisions, and `/exspecso-new-phase` |
| Historical RALP terminology and contracts | Documentation v12 retains the bounded Correction Loop as the canonical recovery model |
| Fixed Phase, Requirement, Spec, or Task count thresholds | Documentation v12 requires coverage-driven decomposition without numeric quotas |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 1 | Pending |
| SETUP-02 | Phase 1 | Pending |
| SETUP-03 | Phase 1 | Pending |
| SETUP-04 | Phase 1 | Pending |
| SETUP-05 | Phase 1 | Pending |
| SETUP-06 | Phase 1 | Pending |
| SETUP-07 | Phase 1 | Pending |
| SETUP-08 | Phase 1 | Pending |
| ART-01 | Phase 1 | Pending |
| ART-02 | Phase 1 | Pending |
| ART-03 | Phase 1 | Pending |
| ART-04 | Phase 1 | Pending |
| ART-05 | Phase 1 | Pending |
| ART-06 | Phase 1 | Pending |
| ART-07 | Phase 1 | Pending |
| ART-08 | Phase 1 | Pending |
| ART-09 | Phase 1 | Pending |
| DISC-01 | Phase 3 | Pending |
| DISC-02 | Phase 3 | Pending |
| DISC-03 | Phase 3 | Pending |
| DISC-04 | Phase 3 | Pending |
| DISC-05 | Phase 3 | Pending |
| DISC-06 | Phase 3 | Pending |
| DISC-07 | Phase 3 | Pending |
| DISC-08 | Phase 3 | Pending |
| DISC-09 | Phase 3 | Pending |
| DISC-10 | Phase 3 | Pending |
| DISC-11 | Phase 3 | Pending |
| DISC-12 | Phase 3 | Pending |
| DISC-13 | Phase 3 | Pending |
| PLAN-01 | Phase 3 | Pending |
| PLAN-02 | Phase 3 | Pending |
| PLAN-03 | Phase 3 | Pending |
| PLAN-04 | Phase 3 | Pending |
| PLAN-05 | Phase 3 | Pending |
| PLAN-06 | Phase 3 | Pending |
| PLAN-07 | Phase 3 | Pending |
| PLAN-08 | Phase 3 | Pending |
| PLAN-09 | Phase 3 | Pending |
| PLAN-10 | Phase 3 | Pending |
| PLAN-11 | Phase 3 | Pending |
| PLAN-12 | Phase 3 | Pending |
| PLAN-13 | Phase 3 | Pending |
| PLAN-14 | Phase 3 | Pending |
| PLAN-15 | Phase 3 | Pending |
| PLAN-16 | Phase 3 | Pending |
| PLAN-17 | Phase 3 | Pending |
| PLAN-18 | Phase 3 | Pending |
| PLAN-19 | Phase 3 | Pending |
| PLAN-20 | Phase 3 | Pending |
| PLAN-21 | Phase 3 | Pending |
| CTRL-01 | Phase 2 | Pending |
| CTRL-02 | Phase 2 | Pending |
| CTRL-03 | Phase 2 | Pending |
| CTRL-04 | Phase 2 | Pending |
| CTRL-05 | Phase 2 | Pending |
| CTRL-06 | Phase 2 | Pending |
| CTRL-07 | Phase 2 | Pending |
| CTRL-08 | Phase 2 | Pending |
| CTRL-09 | Phase 4 | Pending |
| CTRL-10 | Phase 4 | Pending |
| CTRL-11 | Phase 2 | Pending |
| CTRL-12 | Phase 2 | Pending |
| CTRL-13 | Phase 2 | Pending |
| CTRL-14 | Phase 2 | Pending |
| DELV-01 | Phase 4 | Pending |
| DELV-02 | Phase 4 | Pending |
| DELV-03 | Phase 4 | Pending |
| DELV-04 | Phase 4 | Pending |
| DELV-05 | Phase 4 | Pending |
| DELV-06 | Phase 4 | Pending |
| DELV-07 | Phase 4 | Pending |
| DELV-08 | Phase 4 | Pending |
| DELV-09 | Phase 4 | Pending |
| DELV-10 | Phase 4 | Pending |
| DELV-11 | Phase 4 | Pending |
| DELV-12 | Phase 4 | Pending |
| DELV-13 | Phase 4 | Pending |
| DELV-14 | Phase 4 | Pending |
| DELV-15 | Phase 4 | Pending |
| DELV-16 | Phase 4 | Pending |
| DELV-17 | Phase 4 | Pending |
| DELV-18 | Phase 4 | Pending |
| DELV-19 | Phase 4 | Pending |
| DELV-20 | Phase 5 | Pending |
| DELV-21 | Phase 4 | Pending |
| DELV-22 | Phase 4 | Pending |
| REC-01 | Phase 5 | Pending |
| REC-02 | Phase 5 | Pending |
| REC-03 | Phase 5 | Pending |
| REC-04 | Phase 5 | Pending |
| REC-05 | Phase 5 | Pending |
| REC-06 | Phase 5 | Pending |
| CONT-01 | Phase 5 | Pending |
| CONT-02 | Phase 5 | Pending |
| CONT-03 | Phase 5 | Pending |
| CONT-04 | Phase 5 | Pending |
| CONT-05 | Phase 5 | Pending |
| CONT-06 | Phase 5 | Pending |
| CONT-07 | Phase 5 | Pending |
| TRACE-01 | Phase 5 | Pending |
| TRACE-02 | Phase 5 | Pending |
| TRACE-03 | Phase 5 | Pending |
| TRACE-04 | Phase 5 | Pending |
| TRACE-05 | Phase 5 | Pending |
| TRACE-06 | Phase 5 | Pending |
| TRACE-07 | Phase 5 | Pending |
| PORT-01 | Phase 6 | Pending |
| PORT-02 | Phase 6 | Pending |
| PORT-03 | Phase 6 | Pending |
| PORT-04 | Phase 6 | Pending |
| PORT-05 | Phase 6 | Pending |
| PORT-06 | Phase 6 | Pending |
| REL-01 | Phase 6 | Pending |
| REL-02 | Phase 6 | Pending |
| REL-03 | Phase 6 | Pending |
| REL-04 | Phase 6 | Pending |
| REL-05 | Phase 6 | Pending |
| REL-06 | Phase 6 | Pending |
| REL-07 | Phase 6 | Pending |
| REL-08 | Phase 6 | Pending |
| REL-09 | Phase 6 | Pending |
| REL-10 | Phase 6 | Pending |
| REL-11 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 124 total
- Mapped to phases: 124
- Unmapped: 0 ✓
- Duplicate mappings: 0 ✓

---
*Requirements defined: 2026-08-21*
*Last updated: 2026-08-21 after vertical-MVP roadmap creation*
