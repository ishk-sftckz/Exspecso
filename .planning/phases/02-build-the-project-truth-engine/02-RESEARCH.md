# Phase 2: Build the Project Truth Engine - Research

Start with the [plain-language reading guide](./02-RESEARCH-SUMMARY.md). This report keeps the source details and recommendations for planning.

**Researched:** 2026-09-07
**Domain:** Deterministic artifact parsing, graph validation, derived project state, and durable Phase acceptance records
**Confidence:** HIGH for the phase contract and existing-code findings. The proposed architecture still needs fixture verification. Library guidance comes from official documentation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

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

### the agent's Discretion

Choose schemas, internal API shapes, parsing/graph algorithms, and concise diagnostic wording during research/planning, constrained by the canonical contracts and existing code. No extra product preference was elicited for these engineering details. Do not treat this as authorization to weaken evidence, expand phase scope, or change approved product intent.

### Deferred Ideas (OUT OF SCOPE)

No new product capabilities were requested. User-facing planning approval/context orchestration remains Phase 3; delivery and findings orchestration remains Phase 4; correction and recovery hardening remains Phase 5. This discussion establishes the mechanical state contracts they consume.
</user_constraints>

## Summary

Phase 2 should add one deterministic read model above the existing artifact resolver. The resolver already scans contained Markdown and JSON, finds stable IDs, returns exact file or heading locations, and reports malformed declarations without changing a project. It cannot yet tell whether a resolvable Spec is approved, delivery-ready, blocked by another Spec, or part of a complete Phase. [VERIFIED: src/artifacts/resolve.ts:5-31, 208-245, 262-300]

The smallest viable implementation parses declared canonical records into typed domain facts, validates parent and dependency graphs, then derives status, readiness, context references, next action, Phase closure, and acceptance progress from an immutable index. Keep writing separate: Phase 2 owns only Decision allocation and acceptance-result recording. Findings recording belongs to the later delivery workflow, though Phase 2 must parse their state. Every Phase 2 write must use the Phase 1 transaction and recovery path. [VERIFIED: 02-CONTEXT.md:27-40, 95-98] [RECOMMENDATION]

**Primary recommendation:** Reuse the current file-handling code. Add functions that calculate readiness, choose required context, and check completion from the saved records. Keep this calculated state in memory and rebuild it when needed. Reuse Zod and Vitest. No new dependency is recommended.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Parse artifact declarations and exact locations | Local TypeScript helper | Repository files | The helper reads files and produces typed facts. Repository files remain canonical. [VERIFIED: src/artifacts/resolve.ts:208-245] |
| Validate IDs, membership, and dependency graphs | Local TypeScript helper | none | Reject bad references before deriving status. [VERIFIED: 02-CONTEXT.md:27-31] |
| Compute readiness, status, and next command | Local TypeScript helper | none | The helper reads the saved records and evidence to calculate state. [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:263-279] |
| Select bounded operation context | Local TypeScript helper | Runtime orchestration | The helper resolves exact references. A later runtime decides how to show or load them. [VERIFIED: 02-CONTEXT.md:21-25] |
| Persist a Decision or acceptance result | Local TypeScript helper | Repository files | The helper writes canonical Markdown through the repository transaction mechanism. [VERIFIED: src/filesystem/transaction.ts:19-40, 250-279] |
| Ask for approval or product judgment | Runtime orchestration | none | Phase 3 owns the approval conversation. Phase 2 computes explicit supplied state only. [VERIFIED: 02-CONTEXT.md:27-31] |

<phase_requirements>
## Phase Requirements

| ID | Description | Research support |
|---|---|---|
| ART-10 | Lazy durable Phase acceptance record | Acceptance parser, state evaluator, and targeted writer with fixtures. |
| CTRL-01 | Exact operation context references | Reuse resolver locations and compose operation-specific lists. |
| CTRL-02 | Smallest sufficient Task context and escalation | Required-reference builder plus typed NEED_CONTEXT request. |
| CTRL-03 | Cold-session next action | Immutable state index and one derived next command. |
| CTRL-04 | Artifact-derived status and gates | Approval, findings, closure, and readiness evaluators. |
| CTRL-05 | Unknown dependency errors | Graph-edge validation with aggregate diagnostics. |
| CTRL-06 | Cycle errors | Deterministic cycle detection at Phase, Spec, and Task scopes. |
| CTRL-07 | Incomplete dependency blocks delivery only | Separate planning validity from delivery readiness. |
| CTRL-08 | Order is a ready-work tie-breaker | Stable sort after dependency filtering. |
| CTRL-11 | Relevant Decision sections only | Resolve explicit IDs or links, then return exact sections. |
| CTRL-12 | Durable meaningful Decision record | Deterministic DEC-NNN allocation and record validation. |
| CTRL-13 | Supersession preserves prior rationale | Explicit old-to-new link validation. |
| CTRL-14 | No routine Decision entries | Writer accepts runtime-provided significance classification and does not infer it. |
| CTRL-15 | One active Spec loop | State evaluator rejects a second active Spec. |
| CTRL-16 | Closure and acceptance helpers | Pure evaluation plus targeted persistent updates. |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- Canonical state must remain inspectable Markdown and small JSON files in the repository.
- Keep one TypeScript/Node npm package and one codebase.
- Keep canonical artifacts, deterministic helper logic, and runtime orchestration separate.
- Use stable IDs and acyclic Phase, Spec, and Task graphs. Dependencies gate readiness, while declared order only ranks ready work.
- Default to one active Spec Delivery Loop per Phase and one Task at a time.
- Every Acceptance Criterion needs declared verification intent. Evidence must support the completion claim.
- Builders cannot weaken approved verification to obtain a pass.
- A Phase completes only after required Specs, review, and required Phase-level verification pass.
- Use the GSD workflow for repository writes. [VERIFIED: AGENTS.md:15-31, 47-55]

## Standard Stack

### Core

| Library | Version | Purpose | Why standard here |
|---|---:|---|---|
| TypeScript | 7.0.2 | Compile the pure deterministic helper | The project has strict checking and NodeNext modules. [VERIFIED: package.json:42-46; tsconfig.json:2-16] |
| Zod | 4.4.3 | Validate JSON and typed record shapes at the input boundary | The project already uses it for strict config parsing. Zod supports discriminated unions for object variants that share a literal discriminator. [VERIFIED: package.json:38-40; src/artifacts/schema.ts:1-20] [CITED: https://zod.dev/api?id=discriminated-unions] |
| Node filesystem APIs through contained capabilities | Node built-ins | Read contained artifacts and write approved records safely | The existing reader exposes bounded read operations; the transaction checks staged and destination hashes before promotion. [VERIFIED: src/filesystem/contained-fs.ts:15-20; src/filesystem/transaction.ts:250-279] |

### Supporting

| Library | Version | Purpose | When to use |
|---|---:|---|---|
| Vitest | 4.1.11 | Unit and fixture integration testing | Test pure derivation and hand-authored repository fixtures. Tests are sequential unless concurrency is enabled. [VERIFIED: package.json:42-46] [CITED: https://vitest.dev/api/test] |

### Alternatives Considered

| Instead of | Could use | Tradeoff |
|---|---|---|
| In-memory graph traversal | Graph database or graph package | Adds duplicate project state and a package for a graph small enough to build from parsed artifacts. [RECOMMENDATION] |
| Existing transaction writer | Ad hoc file writes | Would bypass preimage checks, journaling, recovery, and containment controls already implemented in Phase 1. [VERIFIED: src/filesystem/transaction.ts:16-40, 250-279; src/filesystem/recovery.ts:190-224] |

**Installation:** None. Reuse existing packages and Node built-ins. [RECOMMENDATION]

## Package Legitimacy Audit

No external package installation is proposed, so this phase has no package-install gate. Existing dependencies were checked only to establish the environment. Do not change dependency versions as Phase 2 work. [VERIFIED: package.json:38-46]

## Architecture Patterns

### System architecture diagram

    Contained Markdown and JSON artifacts
                 |
                 v
    Artifact scan and exact locations
                 |
                 v
    Typed record parsers
                 |
                 v
    Relationship and dependency validator
                 |
                 v
    Immutable project-state index
         |             |              |
         v             v              v
    context refs    status/next    closure/acceptance
         |             |              |
         +-------------+--------------+
                       |
                       v
              later runtime orchestration

    explicit Decision or acceptance request
                       |
                       v
         validated planned write and transaction
                       |
                       v
             canonical artifacts and recovery

The state engine returns facts and exact references. A later runtime can ask an approval question, schedule work, or show a user message without owning canonical truth. [VERIFIED: 02-CONTEXT.md:21-43]

### Recommended project structure

    src/artifacts/
      schema.ts          existing stable IDs and schema primitives
      resolve.ts         existing contained scan and exact locations
      validate.ts        existing generic validation entry point
      records.ts         new parsers for domain records
      relationships.ts   new membership, dependency, and cycle validation
      project-state.ts   new immutable index and derived status
      context.ts         new operation context and NEED_CONTEXT builders
      acceptance.ts      new closure, acceptance, and record helpers
    src/errors/diagnostic.ts
    tests/fixtures/truth-engine/
    tests/unit/
    tests/integration/

This split keeps parsing, graph rules, derivation, and writes distinct. It prevents malformed input from becoming a disguised status decision, and lets every status test run without a runtime adapter. [RECOMMENDATION]

### Pattern 1: Build an immutable index, then derive answers

Scan once through a contained reader, parse each relevant record into a typed fact with its exact source location, aggregate diagnostics, and only derive readiness or status when the index is valid enough for that answer. The resolver already returns deterministic definitions and exact heading ranges. [VERIFIED: src/artifacts/resolve.ts:5-31, 74-106, 208-245] [RECOMMENDATION]

### Pattern 2: Keep structure validity separate from delivery readiness

Validate unknown IDs, invalid parents, membership, scope restrictions, and cycles as structural errors. Then calculate whether valid declared dependencies are complete. A valid declaration with an incomplete dependency is a delivery block, not a plan-validation failure. [VERIFIED: 02-CONTEXT.md:27-31]

Concrete example: a file that resolves to SPEC-001 proves that the ID appears once and has an exact location. It does not prove the Phase revision is approved, a dependent Spec is complete, evidence is sufficient, or no unresolved plan gap blocks completion. Those facts come from separate Phase, dependency, evidence, and finding records. [VERIFIED: src/artifacts/resolve.ts:262-300; docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:224-240]

### Pattern 3: Model state transitions as requested writes with preconditions

Acceptance recording and Decision creation should validate a requested record change against current state, create a planned write with an expected preimage, and commit through the transaction mechanism. Do not mutate text in place after a read. [RECOMMENDATION] The existing code detects stale destination content before promotion and has conservative recovery for interrupted transactions. [VERIFIED: src/filesystem/transaction.ts:250-279; src/filesystem/recovery.ts:190-224]

### Pattern 4: Let runtime reasoning supply semantic judgment

The helper should accept an explicit request such as record this durable decision and validate its record shape and links. It must not infer that a code comment, an activity event, or a context read is a durable product decision. [RECOMMENDATION] The locked contract reserves semantic importance, user-answer interpretation, and product judgment for runtime reasoning. [VERIFIED: 02-CONTEXT.md:33-43, 80-85]

### State contract to preserve

The canonical local contract states exactly:

> pending | passed | failed | needs-retest

for acceptance checks, and:

> non-blocking, execution-blocker, or blocking-plan-gap

for meaningful findings. Encode these closed sets in parser schemas and never infer an unlisted value from free text. [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:207-213, 230-240] [RECOMMENDATION]

### Proposed record and freshness contract

These are implementation proposals, not new approved product intent. They turn the accepted ownership rules into a small parser contract. [RECOMMENDATION]

Keep the existing bare `id:` and `parent:` declarations compatible. For new fields, recommend a documented Markdown subset: unique named fields, strict numbers and booleans, explicit nulls, and JSON arrays for references. Use JSON parsing and Zod for those values. Do not claim general YAML support. If canonical examples require richer syntax, settle that compatibility issue before freezing the parser. Reject duplicate fields and invalid values with exact source locations. [RECOMMENDATION]

A dependency mentioning `SPEC-001` is a reference, not another definition of that Spec. The current scanner recognizes IDs in frontmatter and headings. Add fixtures for Roadmap references, repeated status metadata, ordinary heading boundaries, and fenced examples so typed parsing cannot invent duplicate identities or read the wrong section. Preserve Phase 1's public resolution contract. [VERIFIED: src/artifacts/resolve.ts:37-106] [RECOMMENDATION]

| Record | Frozen canonical location and required facts | Proposed helper mechanics |
|---|---|---|
| Phase brief | .exspecso/phases/phase-NNN-slug/brief.md records Phase identity, revision, approvedRevision, and approval metadata. [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:94-103; Notion Registry sections 2 and 4 fetched 2026-09-07] | Parse id, revision, approvedRevision, and a proposed planningBundleDigest. Compute the digest from the authoritative Phase brief and its declared Spec, Plan, and Task records in stable path and section order. Approval is current only when revision equality and this digest match the approval snapshot. [RECOMMENDATION] |
| Roadmap declaration | .exspecso/roadmap.md owns Phase and Spec membership, dependencies, and declared order. [VERIFIED: 02-CONTEXT.md:27-31; Notion Registry section 9 fetched 2026-09-07] | Parse explicit dependency arrays and ordered declarations. Validate referenced IDs, type scope, and cycles. Never infer a relationship from a folder name or list position. [RECOMMENDATION] |
| Task record | specs/spec-NNN-slug/tasks.md contains stable TASK-NNN sections. [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:105-120; Notion Registry sections 1 and 2 fetched 2026-09-07] | Parse only Task-local dependencies. Reject references outside the parent Spec. Preserve exact section locations for Task context. [RECOMMENDATION] |
| Decision log | .exspecso/trace/decisions.md is lazy. Each durable Decision is an addressable DEC-NNN section, and the helper preserves supersession links. [VERIFIED: 02-CONTEXT.md:33-35; Notion Registry section 20 fetched 2026-09-07] | Recommend allocating one above the highest existing number, including superseded records, within the existing three-digit format. Report exhaustion instead of widening the format. The runtime explicitly requests a durable Decision with its reason and affected IDs or paths. The helper validates the record without judging semantic importance. Select through explicit links and declared scope, including applicable ancestor scope. Supersession preserves prior content and links both records in one transaction. [RECOMMENDATION] |
| Acceptance record | .exspecso/phases/phase-NNN-slug/acceptance.md is lazy and contains stable PAC-NNN checks plus Phase revision and context. [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:199-213] | Persist a proposed sourceDigest and sourceRevision for each check result. Preserve a passed result only while the relevant closure inputs match those bindings. Update only the requested PAC section after validating its expected preimage. [RECOMMENDATION] |

Revision equality alone cannot detect a manual edit that changes a Spec or Task without incrementing the Phase revision. The proposed planning-bundle digest makes that drift visible to the helper. A mismatch must yield stale approval or stale evidence and one repair-oriented next action. It must never silently rewrite the plan or auto-increment a revision. [RECOMMENDATION]

The digest is a content fingerprint. Define its covered planning sections explicitly. Exclude the fingerprint itself, approval metadata, progress fields, and recorded results so normal progress cannot invalidate approval. Include applicable Roadmap declarations and dependencies that determine the approved work. Keep per-item fingerprints to identify affected evidence. A changed Phase fingerprint invalidates approval; it does not by itself invalidate every passed check. These fingerprint fields are proposals, not existing canonical fields. [RECOMMENDATION]

Build the state index in memory and rebuild it from files in a fresh process. Do not save a second authoritative index. Before recording a result, recheck the relevant Phase revision and input fingerprints as well as the destination's existing content. Transaction preimage checks protect write targets; they do not automatically prove that other files read earlier remain unchanged. Add a fixture for an upstream plan edit between reading context and saving acceptance. [VERIFIED: src/filesystem/transaction.ts:250-279] [RECOMMENDATION]

### Proposed readiness and next-action precedence

Evaluate these gates before recommending work. Report all relevant blockers, then use stable priority to choose one next action. An active Spec or an acceptance file cannot bypass delivery gates. This is a helper policy proposal, not a new user workflow. [RECOMMENDATION]

1. Structural diagnostics, ambiguous IDs, or unsafe reads return repair-required status. They never produce readiness. [VERIFIED: src/artifacts/resolve.ts:262-300; src/artifacts/validate.ts:53-150]
2. An unresolved blocking-plan-gap returns needs-plan-revision and the documented planning command. [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:136-148, 230-240]
3. Missing, stale, or digest-mismatched approval returns needs-plan-revision. A Phase is delivery-ready only with current revision-bound approval. [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:94-103, 136-148] [RECOMMENDATION]
4. Missing detailed planning or declared verification intent routes to planning. Unfinished Phase dependencies and relevant execution blockers prevent delivery. An execution blocker preserves approval if the plan remains correct. [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:136-148, 230-240]
5. Validate default active-work limits: one Spec per Phase and one Task within it. Honor the selected Spec and Task dependencies before suggesting continuation. Phase 2 proves state rules on fixtures; later phases enforce runtime activation. [VERIFIED: 02-CONTEXT.md:30, 40] [RECOMMENDATION]
6. While required Specs remain unfinished, keep the valid active Spec selected, or choose an eligible incomplete Spec after checking its dependencies. Rank ready work by declared order with a stable ID fallback. If none is eligible, report the prerequisite or blocker rather than inventing a runnable command. [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:136-165] [RECOMMENDATION]
7. Once required Specs are done, evaluate closure and acceptance. Failed checks require correction or plan-revision classification. If only pending or needs-retest human checks remain, expose `stage: phase-acceptance` and `/exspecso-implement PHASE-NNN`. A lingering acceptance file cannot hide a Spec reopened by a relevant change. [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:195-226] [RECOMMENDATION]
8. Complete the Phase only after required Specs, review, closure evidence, required acceptance, and the no-blocking-plan-gap gate pass. A Phase with no human checks can complete without creating acceptance.md. [VERIFIED: 02-CONTEXT.md:38-40; docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:195-226]

Retain evidence whose linked intent and relevant code or other verification inputs still match. Planning content alone is insufficient if the implementation under test changed. Keep historical records and require fresh evidence for affected outcomes. An unchanged fingerprint proves only freshness, not that a result is strong enough to support its claim. Evidence must also match the declared verification requirement. [VERIFIED: 02-CONTEXT.md:38-40; docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:195-240] [RECOMMENDATION]

### Anti-patterns to avoid

- Using resolution as a completion test. Resolution checks one unambiguous stable ID and location, not approval, dependency completion, evidence, or closure. [VERIFIED: src/artifacts/resolve.ts:262-300]
- Treating Roadmap order as a graph edge. Order only chooses among work that is already ready. [VERIFIED: 02-CONTEXT.md:27-31]
- Writing an acceptance file for every Phase. Acceptance is lazy and exists only when residual human checks remain. [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:199-213]
- Making the helper interpret a chat reply. Phase 3 owns that conversation. [VERIFIED: 02-CONTEXT.md:27-31]
- Loading the full Decision log for every Task. Resolve only linked or requested Decision sections. [VERIFIED: 02-CONTEXT.md:33-35]

## Don't Hand-Roll

| Problem | Do not build | Use instead | Why |
|---|---|---|---|
| JSON shape validation | Scattered type guards | Existing Zod schemas and safeParse | The project already uses strict Zod config validation and Zod returns validation issues. [VERIFIED: src/artifacts/schema.ts:1-20; src/artifacts/validate.ts:28-45] [CITED: https://zod.dev/api?id=discriminated-unions] |
| Repository containment | Raw filesystem traversal | openContainedFilesystem and BoundReader | Existing code rejects symlinks and unsupported file kinds. [VERIFIED: src/filesystem/contained-fs.ts:15-20, 49-71] |
| Durable write and recovery | Direct writeFile calls | Existing transaction and recovery helpers | Existing writes use staged hashes, expected preimages, a journal, and conservative recovery. [VERIFIED: src/filesystem/transaction.ts:16-40, 250-279; src/filesystem/recovery.ts:190-224] |
| Dependency graph package | New external graph library | Small adjacency maps plus DFS or Kahn traversal | Artifacts are small and the hard work remains domain validation. [RECOMMENDATION] |
| Approval NLP | Helper-side language classification | Phase 3 runtime-provided explicit approval input | Phase 2 is mechanics, while the runtime interprets a clear answer. [VERIFIED: 02-CONTEXT.md:27-31] |

**Key insight:** The hard part is preserving the difference between an artifact that exists, a plan that is valid, work that is ready, work that is approved, and a Phase that is complete. [RECOMMENDATION]

## Common Pitfalls

### Valid reference mistaken for success

Resolution can find a Task or Spec without proving readiness or completion. Make every status answer depend on the typed state index, explicit dependencies, approval state, evidence, findings, and closure. [VERIFIED: src/artifacts/resolve.ts:262-300] [RECOMMENDATION]

### Malformed declarations confused with delivery blocks

Unknown IDs need a repair. Incomplete valid dependencies need waiting or work on a prerequisite. Aggregate structural diagnostics before readiness evaluation. [RECOMMENDATION]

### Phase 3 or Phase 4 behavior added too early

Do not parse user chat, schedule loops, or run correction execution here. The phase supplies state mechanics only. A Phase 2 test should not require an adapter or LLM response. [VERIFIED: 02-CONTEXT.md:7-11, 95-98] [RECOMMENDATION]

### Whole-record acceptance overwrite

Recording one check result must not erase unrelated passed evidence. Resolve one PAC section, validate its parent revision and existing state, update only that section, then use a preimage-checked transaction. [RECOMMENDATION]

### Non-deterministic output order

Sort paths, IDs, diagnostics, and ready candidates explicitly. The current scanner already sorts entries and definitions, and its concurrent resolution test proves repeatable locations. [VERIFIED: src/artifacts/resolve.ts:179-205, 232-235; tests/unit/artifacts.test.ts:279-288]

## Code Examples

### Proposed typed result shape

    interface ProjectStateLoader {
      load(root: string): Promise<ProjectStateResult>;
    }

This proposed helper-only result uses a discriminated shape so callers handle invalid input before deriving readiness. Zod documents this object-variant pattern. [CITED: https://zod.dev/api?id=discriminated-unions] [RECOMMENDATION]

### Ready-work selection

    function readyCandidates(items, isComplete) {
      return items
        .filter((item) => item.dependencies.every(isComplete))
        .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
    }

This ordering runs only after dependency satisfaction. It must not turn a listed earlier item into a dependency of a later item. [VERIFIED: 02-CONTEXT.md:27-31]

## State of the Art

| Older approach | Current approach | Impact |
|---|---|---|
| Generic Phase 1 artifact identity and parent validation | Typed state index with relationships, readiness, closure, acceptance, and next action | The resolver remains reusable, but status must not infer domain truth from generic metadata. [VERIFIED: src/artifacts/validate.ts:53-95; .planning/ROADMAP.md:132-144] |
| Separate Spec approval in historical examples | One approval binding the complete Phase revision | Do not create approval state per Spec. [VERIFIED: 02-CONTEXT.md:27-31] |
| Eager or duplicate acceptance state | Lazy Phase acceptance file for residual human checks | No-human closure must not create acceptance state. [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:199-213, 283-291] |

**Deprecated/outdated:**

- FINDING-NNN is invalid. The closed registry includes FIND-NNN and PAC-NNN. [VERIFIED: src/artifacts/schema.ts:22-44; .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:42-46]
- The earlier spec-level revision terminal is obsolete. [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:215-222]

## Open Questions

1. **Exact canonical Markdown field syntax for Phase, Spec, Task, Decision, finding, evidence, and acceptance records**
   - What we know: source authority fixes ownership, semantics, stable IDs, and acceptance states. [VERIFIED: 02-CONTEXT.md:27-40; docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:199-240]
   - What's unclear: Phase 1 parses only id and parent. It does not define the full record grammar. [VERIFIED: src/artifacts/resolve.ts:37-106]
   - Recommendation: plan a first canonical-template and parser task. This is an implementation design gap, not a product-intent conflict. [RECOMMENDATION]

2. **Minimal closure-evidence syntax for fixture proof**
   - What we know: closure may reuse Task or Spec evidence and human acceptance covers residual outcomes only. [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:187-213]
   - Recommendation: use small hand-authored fixture records for evaluation mechanics. Phase 3 owns plan authoring and richer verification-intent artifacts. [RECOMMENDATION]

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node.js | Build and tests | Yes | Active shell: v20.19.5. Supported v22.21.1 is installed and passed the full baseline. Package requires v22.13+ or v24. [VERIFIED: package.json:7-9; parent-run commands 2026-09-07] | Invoke /Users/ishk.sftckz/.nvm/versions/node/v22.21.1/bin/node through PATH for final validation. |
| npm | Scripts and package lookup | Yes | 10.8.2 | none |
| TypeScript compiler | Build | Yes | package pins 7.0.2 [VERIFIED: package.json:34-45] | none |
| Vitest | Fixture suite | Yes | package pins 4.1.11 [VERIFIED: package.json:34-45] | none |
| Git | Fixture repositories | Yes | Available in this repository | Existing fixture-helper pattern. [VERIFIED: tests/integration/validation-errors.test.ts:19-29] |

**Missing dependencies with no fallback:** None.

**Implementation design work:** The exact canonical record grammar is not implemented. The first plan must settle a narrow template and parser contract before graph and status work. This is not a blocking-plan-gap finding, which has a specific approved-intent meaning. [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:230-240] [RECOMMENDATION]

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Vitest 4.1.11 [VERIFIED: package.json:34-46] |
| Config file | None detected. The package script invokes vitest. [VERIFIED: package.json:34-37] |
| Quick run command | npm test -- --run tests/unit/project-state.test.ts |
| Full suite command | npm test -- --run |

### Phase Requirements → Test Map

| Req ID | Behavior | Test type | File exists? |
|---|---|---|---|
| ART-10 | Lazy acceptance creation, validation, partial update, resume selection | integration fixture | Wave 0 |
| CTRL-01 | Exact reference locations by operation | unit | Wave 0 |
| CTRL-02 | Required context plus internal escalation | unit | Wave 0 |
| CTRL-03 | Cold-session next action from fixture state | integration fixture | Wave 0 |
| CTRL-04 | Approval, plan-gap, evidence, and status derivation | integration fixture | Wave 0 |
| CTRL-05 | Unknown dependency diagnostics at all scopes | unit | Wave 0 |
| CTRL-06 | Phase, Spec, and Task cycle diagnostics | unit | Wave 0 |
| CTRL-07 | Valid but incomplete dependency blocks readiness only | unit | Wave 0 |
| CTRL-08 | Order tie-break only among ready work | unit | Wave 0 |
| CTRL-11 | Only linked Decision sections in context | unit | Wave 0 |
| CTRL-12 | Stable Decision allocation and record validation | integration fixture | Wave 0 |
| CTRL-13 | Supersession links retain prior rationale | integration fixture | Wave 0 |
| CTRL-14 | Routine event excluded from Decision writer | unit | Wave 0 |
| CTRL-15 | Second active Spec is denied | unit | Wave 0 |
| CTRL-16 | Closure, acceptance status, and record operations | integration fixture | Wave 0 |

### Meaningful fixture evidence

- Minimal valid Phase proves a resolvable record is not automatically approved or complete. [RECOMMENDATION]
- Dependency graph covers unknown IDs, self and multi-node cycles, incomplete valid dependencies, and equally ready candidates. [RECOMMENDATION]
- Approval and findings cover missing approval, stale approval, current approval, an execution blocker, and a blocking plan gap. [RECOMMENDATION]
- Decisions cover a relevant linked Decision, an unrelated Decision, and a supersession pair. [RECOMMENDATION]
- Acceptance covers no-human closure, batching, resume of incomplete checks, selective retest, and byte preservation for untouched checks. [RECOMMENDATION]
- Transaction preimage testing proves a stale Decision or acceptance target fails closed. [RECOMMENDATION]

### Sampling Rate

- **Per task commit:** Run the focused new unit or integration file.
- **Per wave merge:** Run npm test -- --run.
- **Phase gate:** Run the full suite and npm run build using the supported Node 22 binary.

### Wave 0 Gaps

- tests/fixtures/truth-engine with hand-authored valid and invalid projects.
- unit tests for relationships, project state, context, and decisions.
- integration fixture test for transaction-backed Decision and acceptance updates.
- No dependency availability gap. Final validation must select the installed Node 22 binary because the default shell remains Node 20. [VERIFIED: parent-run commands 2026-09-07]

**Checks actually run during research:** npm test -- --run passed 98 tests in 11 files and npm run build passed under both the active Node 20 shell and the installed supported Node 22.21.1 runtime. These establish the Phase 1 baseline only. They do not prove Phase 2 behavior. [VERIFIED: local commands and parent-run commands 2026-09-07]

## Security Domain

### Relevant checks

| Concern | Applies | Existing control or proposed check |
|---|---|---|
| Filesystem scope | Yes | Use the existing contained reader and host permission boundary. [VERIFIED: src/filesystem/contained-fs.ts:15-20, 49-71] |
| Input validation | Yes | Parse Markdown and JSON as untrusted input, aggregate diagnostics, and never implicitly repair malformed artifacts. [VERIFIED: src/artifacts/validate.ts:53-150; 02-CONTEXT.md:27-31] |
| Stale writes | Yes | Reuse existing SHA-256 preimage comparisons and test the proposed upstream input checks. [VERIFIED: src/filesystem/transaction.ts:1-14, 250-279] [RECOMMENDATION] |

### Known threat patterns

| Pattern | STRIDE | Standard mitigation |
|---|---|---|
| Malformed or ambiguous canonical artifact | Tampering | Aggregate diagnostics and refuse to derive a success claim from ambiguous identity. [VERIFIED: src/artifacts/resolve.ts:262-300; src/artifacts/validate.ts:53-95] |
| Symlink or unsafe repository entry | Tampering | Read only through contained capabilities that reject symlinks and unsupported kinds. [VERIFIED: src/filesystem/contained-fs.ts:49-71] |
| Stale write after concurrent edit | Tampering | Expected preimage hash before transaction promotion. [VERIFIED: src/filesystem/transaction.ts:260-279] |
| Incomplete work marked complete | Elevation of privilege | Completion requires Specs, closure evidence, acceptance, and no unresolved plan gap. [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:224-240] |
| Unbounded context expansion | Information disclosure | Return exact required references and keep optional requests internal and justified. [VERIFIED: 02-CONTEXT.md:21-25] |

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | Phase and related records can use concise Markdown templates with frontmatter and heading sections that extend the existing resolver model. | Open Questions | The planner may need a different parser/template split. |
| A2 | Small in-memory adjacency maps are sufficient for V1 artifact graphs. | Don't Hand-Roll | Very large repositories may need later performance work. |

## Sources

### Primary (HIGH confidence)

- [Phase 2 context](/Users/ishk.sftckz/Projects/exspecso/.planning/phases/02-build-the-project-truth-engine/02-CONTEXT.md) - locked scope, semantics, and deferments.
- [Local v13 workflow specification](/Users/ishk.sftckz/Projects/exspecso/docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md) - approval, findings, closure, acceptance, status, helpers, and fixture obligations.
- [Artifact resolver](/Users/ishk.sftckz/Projects/exspecso/src/artifacts/resolve.ts), [validator](/Users/ishk.sftckz/Projects/exspecso/src/artifacts/validate.ts), [transaction](/Users/ishk.sftckz/Projects/exspecso/src/filesystem/transaction.ts), and [recovery](/Users/ishk.sftckz/Projects/exspecso/src/filesystem/recovery.ts).
- [Canonical Notion hub](https://app.notion.com/p/2837d0b4dee2808c9745fc3d986960de), [Foundations](https://app.notion.com/p/30c7d0b4dee280daaf81ff66ad8c960d), [Architecture](https://app.notion.com/p/3ad7d0b4dee281ec9a2bf2d3d0f7b588), [Registry](https://app.notion.com/p/3ad7d0b4dee281d5afa9cef8d742710c), [Workflow](https://app.notion.com/p/3ad7d0b4dee2818c8a86c12c2882fc0c), and [Build Guide](https://app.notion.com/p/3ad7d0b4dee28193abdadeecb779a5af). Fetched during research on 2026-09-07.

### Official library documentation

- [Zod official API](https://zod.dev/api?id=discriminated-unions).
- [Vitest official API](https://vitest.dev/api/test).

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH. It reuses already pinned dependencies and Node built-ins.
- Architecture: HIGH. It follows locked Phase 2 boundaries and concrete existing modules.
- Pitfalls: HIGH. They follow the explicit split between resolution, readiness, approval, findings, closure, and acceptance.

**Research date:** 2026-09-07
**Valid until:** 2026-10-07 for existing-code and product-contract findings. Recheck package and runtime versions before dependency changes.
