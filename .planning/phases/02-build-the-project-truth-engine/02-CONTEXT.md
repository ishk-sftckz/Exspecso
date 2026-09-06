# Phase 2: Build the Project Truth Engine - Context

**Gathered:** 2026-09-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Build and prove deterministic artifact resolution, relationship/dependency validation, readiness/status, operation context, durable Decisions, and Phase closure/acceptance state on hand-authored repository fixtures before Phase 3. Follow the existing Phase 2 requirement allocation (ART-10 and CTRL-01–08, CTRL-11–16). Use current Notion contracts for the meaning of approval, findings, and completion when deriving state.

This phase supplies mechanical contracts; later phases implement user-facing planning/delivery, correction, runtime workflows, and release. The Notion Build Guide starts numbering at zero and groups more helper work together; it does not replace the local six-phase allocation.
</domain>

<decisions>
## Implementation Decisions

### Source authority and discussion approach
- **D-01:** Current Notion Canonical Implementation Documents are the implementation strategy. The user explicitly reaffirmed this on 2026-09-06. Local documents normalize that strategy and must stay aligned; read provided sources before asking the user to repeat decisions they contain.
- **D-02:** Carry forward explicit later user decisions and the accepted resolution of stale Notion examples. Phase 1's exact IDs, pure TypeScript/Node architecture, repository-root safety, atomic recovery, unchecked runtime selection, and concise init stdout remain intact. Historical examples do not authorize undoing completed work. Surface a specific new conflict if one cannot be resolved from established precedence.

### Bounded context without user interruption
- **D-03:** The helper returns exact file/section references. Outer Phase scheduling receives the Phase brief and Roadmap Spec dependency/status map. A Task receives Constitution, applicable Standards, its approved Spec and Plan, its own Task section, relevant repository files/digests, relevant Decision/trace sections, and its own failure learning or validated resume state when present. Do not omit explicitly linked required context to meet a size quota.
- **D-04:** Additional context uses `NEED_CONTEXT` with `WHY`, `REQUEST`, and `BLOCKED_ON`. Requests name the relevant artifact, section, or repository area and the missing fact. Required inputs load directly; optional inputs remain bounded to demonstrated need.
- **D-05:** Ordinary relevant repository/artifact reads are handled internally without per-read user approval or chat updates. The user accepted this recommendation and raised concern about interrupting the main discussion. The request's short reason is internal worker/coordinator information, not a question addressed to the user. Ask the user for product judgment or scope changes; existing host access permissions still apply.
- **D-06:** Keep raw retrieval and worker transcripts out of the main discussion. Return concise relevant findings. Routine context requests are ephemeral, not new permanent artifacts or durable Decisions. Persist conclusions only when needed for canonical intent or continuity. One user-facing workflow may span bounded contexts; physical session resets are optional.

### Readiness, approval, and next action
- **D-07:** Status/readiness derive from repository artifacts and evidence, not chat or builder confidence. Status is read-only, reports actual blockers and relevant evidence/acceptance state, and gives one concrete next command. Reuse aggregate diagnostics with precise paths/sections and repair hints; do not implicitly repair malformed artifacts.
- **D-08:** Approval binds the complete Phase planning bundle to `approvedRevision == revision`. There is no independent user-approval lifecycle per Spec. Any authoritative Phase/Spec/Plan/Task planning change increments the Phase revision. Runtime reasoning interprets a clearly affirmative answer to an explicit revision-specific approval question; the helper records the result. Ambiguous or change-requesting replies do not approve. Phase 2 computes this state on fixtures; Phase 3 owns the approval conversation.
- **D-09:** Roadmap declarations own Phase/Spec dependencies and membership; Task sections own within-Spec Task dependencies. Reject unknown IDs/cycles and cross-Spec Task dependencies. Incomplete dependencies gate delivery rather than planning. Declared order breaks ties among ready work. Default activation allows one active Spec loop per Phase and one Task in that Spec; dependency independence alone does not permit parallelism.
- **D-10:** Phase findings describe meaningful implementation reality: `non-blocking`, `execution-blocker`, or `blocking-plan-gap`. Environment blockers preserve approval when the plan remains correct. Plan gaps prevent completion and route to `/exspecso-plan PHASE-NNN`; implementation cannot rewrite approved planning content to repair its own budget. Preserve resolved findings and unaffected verified evidence. Phase 2 must reconstruct these distinctions; later delivery/recovery workflows own their runtime behavior.

### Durable decisions
- **D-11:** Runtime reasoning proposes a durable decision only when forgetting it could materially change product, architecture, scope, constraints, or an important tradeoff. The helper allocates `DEC-NNN`, validates/persists records, and resolves relevant sections. It does not decide semantic importance or invent intent. Routine code facts, naming, activity, and context requests do not create entries.
- **D-12:** Supersession preserves prior rationale and links old/new decisions. Include only relevant Decision sections in context; do not load the whole log by default. Exact deterministic matching mechanics belong to research/planning within this contract.

### Phase closure and human acceptance
- **D-13:** Reuse sufficiently strong Task/Spec evidence for integrated Phase closure. Human checks cover only residual outcomes needing the user. Lazily create Phase `acceptance.md` with Phase revision/context, stable `PAC-NNN` checks, expected outcomes/instructions, results, concise failure evidence, and `pending | passed | failed | needs-retest` status.
- **D-14:** Default to a concise batch of actionable checks. Sequential checks require a dependency, shared-state, safety, or diagnostic reason. Persist partial results per check without changing untouched checks. Resume only `pending`/`needs-retest` work; preserve passed evidence unless affected by later changes. Incomplete human acceptance has `stage: phase-acceptance`; its next command is `/exspecso-implement PHASE-NNN`.
- **D-15:** Approved-intent failure returns to bounded correction and selective reverification. Missing/changed intent becomes a blocking plan gap. A Phase is done only after all required Specs, required closure/human evidence, and the no-blocking-plan-gap gate pass. Phase 2 proves state/record mechanics on fixtures; it does not claim the later correction/runtime flows are already delivered.

### Implementation discretion
Choose schemas, internal API shapes, parsing/graph algorithms, and concise diagnostic wording during research/planning, constrained by the canonical contracts and existing code. No extra product preference was elicited for these engineering details. Do not treat this as authorization to weaken evidence, expand phase scope, or change approved product intent.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents must read relevant sections before planning or implementing.** Full repository-relative paths identify local sources; external canonical pages use their complete URLs.

### Local normalization and allocation
- `docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md` — updated local contracts, including Phase approval, bounded context, findings, and human acceptance.
- `docs/plans/2026-08-26-v13-phase-oriented-workflow-design.md` — accepted conflict resolution and 2026-09-06 context-read clarification.
- `.planning/PROJECT.md` — product direction and constraints.
- `.planning/REQUIREMENTS.md` — current requirements and unchanged phase ownership.
- `.planning/ROADMAP.md` — Phase 2 boundary and fixture proof gate.
- `.planning/STATE.md` — current continuity; distinguish active decisions from explicitly superseded native history.
- `.planning/phases/01-initialize-canonical-projects/01-CONTEXT.md` — Phase 1 decisions, including D-20 supersession, D-21/D-22, and G-01-1/G-01-2 setup corrections.

### User-supplied canonical Notion sources
All five implementation pages were fetched and read during this discussion; their source edit date is 2026-08-30.
- https://app.notion.com/p/2837d0b4dee2808c9745fc3d986960de — hub and authoritative document set.
- https://app.notion.com/p/30c7d0b4dee280daaf81ff66ad8c960d — Foundations: context, quiet governance, approval, evidence integrity.
- https://app.notion.com/p/3ad7d0b4dee281ec9a2bf2d3d0f7b588 — Architecture §§4–9: helper/runtime split, planning contexts, approval/findings, reconstruction, delivery boundaries.
- https://app.notion.com/p/3ad7d0b4dee281d5afa9cef8d742710c — Registry §§9–10, 13–14, 17, 20–21: declaration ownership, approval, acceptance, Task/status, loop, Decisions, context.
- https://app.notion.com/p/3ad7d0b4dee2818c8a86c12c2882fc0c — Workflow §§3–6, 9: sources before questions, bounded planning, approval, delivery, status.
- https://app.notion.com/p/3ad7d0b4dee28193abdadeecb779a5af — Build Guide, Deterministic Helper stage and gates; broader stage grouping does not change local requirement ownership.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/artifacts/schema.ts` — closed stable-ID registry and initial config schema. Evolve configuration only for fields needed by the scoped workflow.
- `src/artifacts/resolve.ts` — artifact definitions, exact file/section locations, duplicate handling, deterministic scans through a bound reader.
- `src/artifacts/validate.ts` — aggregate configuration/declaration/parent validation; extend for typed relationships and dependencies.
- `src/errors/diagnostic.ts` — stable codes, path/section, expected/actual values, repair hints.
- `src/artifacts/templates.ts` — minimal existing init templates; later artifacts remain lazy.

### Established Patterns and Integration Points
- One TypeScript/Node package; Markdown and small JSON are canonical.
- Reuse `src/filesystem/contained-fs.ts`, `src/filesystem/transaction.ts`, and `src/filesystem/recovery.ts` for repository-scoped reads and safe record mutations.
- The existing resolver models identity and locations; domain-specific approval, dependency, evidence, and state semantics must be proven rather than inferred from generic metadata.
- Keep semantic importance, user-answer interpretation, and product judgment in runtime reasoning. Deterministic helpers validate explicit inputs and compute reproducible results.
- Hand-authored fixture projects establish mechanical contracts before runtime orchestration. Completed Phase 1 initialization must retain its behavior.
</code_context>

<specifics>
## Specific Ideas

- The user found the initial technical questions unclear and asked that the Notion sources answer them first. Source-defined behavior was then accepted as the development strategy; no invented questionnaire answers are implied.
- Example internal need: the current Task depends on another Spec's interface, so request the relevant contract section with a short reason. Read it internally and return only the useful conclusion. Ask the user only if the documents leave a product decision or scope change unresolved.
</specifics>

<deferred>
## Deferred Ideas

No new product capabilities were requested. User-facing planning approval/context orchestration remains Phase 3; delivery and findings orchestration remains Phase 4; correction and recovery hardening remains Phase 5. This discussion establishes the mechanical state contracts they consume.
</deferred>
