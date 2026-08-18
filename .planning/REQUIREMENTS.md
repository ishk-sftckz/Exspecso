# Requirements: Exspecso

**Defined:** 2026-08-18
**Core Value:** Approved product intent must survive planning, implementation, failure, verification, and session or runtime boundaries, with evidence—not agent confidence—controlling completion.

## User Stories

- As a developer, I can initialize Exspecso in an existing Git repository and install only the coding-agent integrations I choose.
- As a product owner, I can approve explicit intent, scope, and evidence before an agent changes application code.
- As a developer delegating work, I can let an agent advance through finite approved Tasks without manually scheduling each next action.
- As a reviewer, I can understand why work is considered complete by tracing requirements to implementation and appropriate evidence.
- As a developer returning later or switching coding-agent runtimes, I can resume from repository artifacts without reconstructing the project from chat history.
- As a project owner, I retain control when requirements are ambiguous, scope must change, verification conflicts with intent, or an external dependency blocks progress.

## v1 Requirements

Requirements for the first artifact-first, cross-runtime release. Each requirement maps to exactly one roadmap phase.

### Package and Initialization

- [ ] **INIT-01**: User can initialize Exspecso in a Git repository through `npx exspecso init` from one npm package.
- [ ] **INIT-02**: User can select one or more supported integrations from Claude Code, OpenAI Codex, and OpenCode during initialization.
- [ ] **INIT-03**: User receives only the native integration files for the runtimes selected during initialization.
- [ ] **INIT-04**: User can rerun initialization to add or refresh integrations without recreating confirmed project artifacts.
- [ ] **INIT-05**: User-authored or foreign runtime configuration is preserved, and conflicting changes stop with an actionable explanation rather than being overwritten.
- [ ] **INIT-06**: User is told the next valid Exspecso operation after initialization completes.

### Canonical Artifacts and State

- [ ] **ARTF-01**: User can inspect and edit all canonical Exspecso project truth as ordinary Markdown and small JSON files inside the repository.
- [ ] **ARTF-02**: Every Roadmap, Phase, Spec, Plan, and Task has a stable identifier and explicit parent relationship that can be validated without interpreting prose.
- [ ] **ARTF-03**: Exspecso creates an artifact only when that artifact becomes actionable in the current workflow.
- [ ] **ARTF-04**: Exspecso validates artifact schemas and relationships before using them to authorize a state transition.
- [ ] **ARTF-05**: A failed or interrupted artifact write leaves the last valid artifact set recoverable and does not silently produce partial authoritative state.
- [ ] **ARTF-06**: Exspecso derives current progress, active work, and terminal status mechanically from canonical artifacts and repository state rather than conversation memory.
- [ ] **ARTF-07**: Repeating any completed non-implementation workflow command does not duplicate artifacts, corrupt state, or silently discard confirmed work.

### Hierarchical Planning and Approval

- [ ] **PLAN-01**: User can run `start` to establish or resume project context and a Roadmap for either a greenfield or brownfield repository.
- [ ] **PLAN-02**: `start` can declare ordered Phase IDs, titles, and goals without pre-creating Phase folders or downstream execution artifacts.
- [ ] **PLAN-03**: User can plan only a Phase already declared by the active Roadmap, producing the Phase outcome, scope, dependencies, and bounded Spec declarations.
- [ ] **PLAN-04**: User can plan only a Spec already declared by its parent Phase, producing one Spec, Plan, status, and bounded Task set.
- [ ] **PLAN-05**: Every planned Task records its approved scope boundary, dependencies, linked Requirements and Acceptance Criteria, and concrete verification contract.
- [ ] **PLAN-06**: Every Acceptance Criterion declares verification intent before its Spec or Plan can become implementation-ready.
- [ ] **PLAN-07**: User must explicitly approve a Phase plan and a Spec Plan before either becomes authoritative for downstream execution.
- [ ] **PLAN-08**: Planning proposes the smallest viable approach that satisfies approved intent and does not add speculative abstractions or unrelated work.

### Context and Reconstruction

- [ ] **CTX-01**: Each Exspecso operation receives an explicit context contract containing the exact required canonical artifact paths and any separately identified optional context.
- [ ] **CTX-02**: Every Task can be reconstructed from repository artifacts, linked intent, relevant repository state, and persisted failure or resume state without undocumented conversation history.
- [ ] **CTX-03**: A Task worker receives the smallest sufficient authority, scope, repository context, Acceptance Criteria, and verification contract needed for that Task.
- [ ] **CTX-04**: A Task worker can request additional context through an explicit escalation that states why it is needed and what progress is blocked.
- [ ] **CTX-05**: Exspecso surfaces repository or Git drift that invalidates persisted context instead of guessing that saved state remains valid.

### Delivery Loop and Scope Control

- [ ] **DLV-01**: User can explicitly start implementation for one approved Spec, and Exspecso rejects unknown, unapproved, or Phase-wide implementation targets.
- [ ] **DLV-02**: The approved Spec is the Delivery Loop goal and its approved Plan is the finite work budget; execution cannot silently create new requirements, Tasks, or scope.
- [ ] **DLV-03**: Normal implementation activates one Task at a time and prevents a second sequential Task from starting before the current Task reaches a verified checkpoint.
- [ ] **DLV-04**: A concurrent Task can activate only when dependencies, change surfaces, verification, and checkpoint boundaries are independently safe.
- [ ] **DLV-05**: In continuous mode, Exspecso automatically selects the next approved ready Task after the current Task reaches a verified checkpoint.
- [ ] **DLV-06**: In step mode, Exspecso pauses after one verified Task or closure boundary and can continue from artifacts on the next invocation.
- [ ] **DLV-07**: A non-blocking out-of-scope discovery is recorded and deferred without changing unrelated source, while a blocking discovery stops execution and explains the required decision or revision.
- [ ] **DLV-08**: Every Delivery Loop stop returns one explicit result: `completed`, `paused`, `blocked`, `needs-human`, `needs-spec-revision`, `correction-exhausted`, or `interrupted`.
- [ ] **DLV-09**: Exspecso runs only after an explicit user invocation and does not depend on an always-running background service.

### Verification, Evidence, and Review

- [ ] **VERI-01**: Planning refines every Acceptance Criterion's verification intent into concrete commands or instructions capable of proving the behavior claimed.
- [ ] **VERI-02**: Mechanically testable behavior requires appropriate executable evidence, while behavior that cannot be proven mechanically requires an explicit browser, visual, human, file, external, or equivalent evidence method.
- [ ] **VERI-03**: A bug-fix Task establishes a failing reproduction before implementation whenever technically feasible, or records why safe reproduction is not feasible.
- [ ] **VERI-04**: A builder cannot weaken, delete, skip, or materially reinterpret approved or pre-existing verification merely to obtain a passing result.
- [ ] **VERI-05**: A Task cannot become complete from code presence, passing unrelated checks, or the implementing agent's own confidence.
- [ ] **VERI-06**: Exspecso records a trace from each Requirement through its Task, implementation change, required evidence, and current status, and reports broken trace links as verification failures.
- [ ] **VERI-07**: Exspecso runs declared Spec-level closure verification after all implementation Tasks are verified when Acceptance Criteria require system, E2E, browser, or regression proof across Tasks.
- [ ] **VERI-08**: Exspecso invokes a logically independent final review after required Task and closure evidence passes.
- [ ] **VERI-09**: A Spec becomes complete only after its required evidence passes, verified checkpoints are accepted, traceability closes, and final review passes.

### Correction and Recovery

- [ ] **CORR-01**: A safely correctable verification or mapped review failure can enter an Assess → Learn → Patch → Reverify Correction Loop.
- [ ] **CORR-02**: Every correction attempt reruns the same approved evidence contract that exposed the failure.
- [ ] **CORR-03**: Exspecso persists and enforces a configurable correction-attempt limit for each distinct correction episode.
- [ ] **CORR-04**: Exspecso stops correction on ambiguity, required scope expansion, verification-contract conflict, repeated ineffective patches, or exhausted attempts and returns an appropriate typed result.
- [ ] **CORR-05**: A correctable final-review finding reopens the smallest affected Task or Acceptance Criterion and requires full Task reverification plus affected closure verification before review runs again.

### Checkpoints, Git, and Continuity

- [ ] **CONT-01**: Exspecso can persist an incomplete Task's base Git reference, changed areas, latest verification state, blocker, next action, and durable decisions as a resume checkpoint.
- [ ] **CONT-02**: A resume checkpoint keeps its Task incomplete and cannot authorize the next Task to start.
- [ ] **CONT-03**: Exspecso creates a verified checkpoint only after all evidence required by the current Task passes.
- [ ] **CONT-04**: In a Git repository, Exspecso creates one atomic commit per verified Task by default and includes only the Task's approved change surface and required artifact updates.
- [ ] **CONT-05**: User can explicitly disable automatic Task commits without disabling the verified artifact checkpoint requirement.
- [ ] **CONT-06**: After interruption, Exspecso finds the first incomplete Task, validates any resume checkpoint against current repository state, and continues from the recorded next action when valid.
- [ ] **CONT-07**: Exspecso does not repeat Tasks that already have accepted verified checkpoints.

### Runtime Portability

- [ ] **RTIM-01**: Claude Code, OpenAI Codex, and OpenCode expose equivalent `start`, `plan`, `verify`, `implement`, `review`, `status`, `update`, and `new-roadmap` operations through native runtime mechanisms.
- [ ] **RTIM-02**: Every runtime adapter delegates artifact resolution, state transitions, verification gates, and status computation to the shared deterministic helper rather than maintaining its own state model.
- [ ] **RTIM-03**: Runtime adapters respect their host's permission and approval boundaries and represent unavailable or denied actions as explicit blocked states.
- [ ] **RTIM-04**: A user can begin or pause a Spec in one supported runtime and continue it in another without migration or copied conversation history.
- [ ] **RTIM-05**: The same conformance fixture produces equivalent artifact transitions and terminal results across all three supported runtimes.
- [ ] **RTIM-06**: A missing native runtime capability degrades with an explicit diagnostic or manual path without changing Exspecso's workflow semantics.

## v2 Requirements

Deferred capabilities acknowledged but not included in the V1 roadmap.

### Repository Intelligence

- **RINT-01**: User can connect an optional structural repository index or code-knowledge provider without changing canonical Exspecso artifacts.

### Execution Optimization

- **EXEC-01**: User can schedule broad multi-Task parallel execution after V1 proves safe independence, merge, verification, and checkpoint protocols.

### External Integrations

- **EXT-01**: User can link Exspecso status and traceability to existing issue or project-management systems without making them canonical state.

## Out of Scope

Explicit exclusions for the initial product direction.

| Feature | Reason |
|---------|--------|
| Cloud control plane, hosted dashboard, synchronization, authentication, billing, or collaboration | V1 must prove reliable local delivery before adding service infrastructure. |
| SQLite or another hidden canonical database | Repository artifacts must remain the sole inspectable source of truth. |
| Generated duplicate views or mandatory export | Users must inspect current intent and state directly from canonical files. |
| Multiple npm packages or a large monorepo | Independent packages are deferred until release or dependency boundaries justify them. |
| Full enterprise SDLC or heavyweight project management | These solve a broader category and would obscure the harness-engineering proof. |
| Always-running daemon or scheduled autopilot | Autonomy must begin explicitly and remain inside one approved finite Spec Plan. |
| Automatic adjacent Task, requirement, cleanup, or refactor creation | Discovering useful work does not authorize scope expansion. |
| Universal TDD or full E2E after every Task | Evidence must be proportionate to the behavior claimed by each Acceptance Criterion. |
| Mandatory fresh model session for every Task | Logical isolation and reconstructibility are required; physical reset remains a runtime strategy. |
| Reimplementation of runtime sandboxes, permissions, subagent systems, or model routing | Native runtimes retain responsibility for their own execution and permission environments. |

## Definition of Done

V1 is release-ready when:

- All V1 requirements are mapped to exactly one roadmap phase and marked complete through verified phase execution.
- The first end-to-end fixture completes one approved Spec through planning, evidence-first Task execution, interruption and resume, bounded correction, verified Git checkpoints, Spec closure verification, and independent final review.
- Continuous mode advances between verified Tasks without manual scheduling, while step mode pauses and resumes at verified boundaries.
- A builder is demonstrably unable to claim completion by weakening or skipping the approved verification contract.
- Claude Code, OpenAI Codex, and OpenCode pass the shared conformance scenario and can continue one another's artifact state.
- Clean initialization, repeated initialization, interrupted writes, malformed artifacts, Git drift, dirty worktrees, and correction exhaustion have verified failure behavior.
- The packed npm artifact installs and runs from a clean fixture repository using the documented supported Node and runtime versions.
- Users can understand current intent, progress, evidence, blockers, and the next valid action directly from artifacts and concise commands.

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|

**Coverage:**
- v1 requirements: 62 total
- Mapped to phases: 0
- Unmapped: 62 ⚠️

---
*Requirements defined: 2026-08-18*
*Last updated: 2026-08-18 after initial definition*
