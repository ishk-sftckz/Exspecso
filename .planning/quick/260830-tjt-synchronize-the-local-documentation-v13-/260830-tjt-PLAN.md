---
type: quick
quick_id: 260830-tjt
status: planned
phase: quick-260830-tjt
plan: 01
wave: 1
depends_on: []
files_modified:
  - docs/plans/2026-08-26-v13-phase-oriented-workflow-design.md
  - docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
autonomous: true
estimate:
  tokens: 12000
  raw_tokens: 12000
  tasks: 1
  confidence: low
must_haves:
  truths:
    - "The local v13 sources define Task Verification, optional Spec Closure Verification, and Phase Closure Verification as one hierarchy, with Human Phase Acceptance only the residual human-facing portion of Phase Closure Verification."
    - "Phase acceptance is durable and resumable through lazy acceptance.md state with stable PAC-NNN checks, explicit statuses, phase context, instructions, results, and concise failure evidence."
    - "A fresh /exspecso-implement PHASE-NNN resumes only pending or needs-retest acceptance checks, batches actionable checks by default, and preserves the documented exceptions that require sequential checks."
    - "Failures within approved intent reopen bounded implementation and selectively invalidate stale evidence, while missing or changed intent creates a blocking-plan-gap and returns needs-plan-revision."
    - "Phase completion, deterministic helper operations, and conformance fixtures reflect the full closure and acceptance contract without changing the active Phase 1 UAT workflow."
  artifacts:
    - path: "docs/plans/2026-08-26-v13-phase-oriented-workflow-design.md"
      provides: "Accepted precedence and migration resolution for the 2026-08-30 Phase Closure Verification and Human Phase Acceptance decisions"
      contains: "Human Phase Acceptance"
    - path: "docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md"
      provides: "Normalized normative contract for closure evidence, durable acceptance state, resume, failure routing, completion, helpers, and conformance"
      contains: ".exspecso/phases/phase-NNN-slug/acceptance.md"
  key_links:
    - from: "docs/plans/2026-08-26-v13-phase-oriented-workflow-design.md"
      to: "docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md"
      via: "the accepted design record establishes precedence and the normalized Spec expresses the executable contract"
      pattern: "Phase Closure Verification|Human Phase Acceptance"
    - from: "docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md"
      to: "/exspecso-implement PHASE-NNN"
      via: "stage: phase-acceptance reconstruction resumes durable PAC-NNN state"
      pattern: "phase-acceptance|pending|needs-retest"
    - from: "docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md"
      to: "Phase completion"
      via: "blocking-plan-gap and needs-plan-revision prevent unproven or under-specified work from becoming done"
      pattern: "blocking-plan-gap|needs-plan-revision"
---

# Synchronize local Documentation v13 closure and acceptance sources

<objective>
Synchronize the two approved local Documentation v13 source artifacts with the canonical 2026-08-30 Phase Closure Verification and Human Phase Acceptance decisions.

Purpose: Preserve the verification hierarchy and make acceptance persistence, cross-session resume, bounded correction, replanning, completion, helper, and conformance contracts deterministic before ROADMAP.md and REQUIREMENTS.md are updated in separate work.

Output: An amended accepted design record and normalized v13 specification. This quick task does not alter Phase 1 UAT or verification evidence.
</objective>

<context>
@AGENTS.md
@.planning/STATE.md
@.planning/v13-ingest-manifest.yml
@docs/plans/2026-08-26-v13-phase-oriented-workflow-design.md
@docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Encode the canonical Phase Closure Verification and Human Phase Acceptance contract</name>
  <files>docs/plans/2026-08-26-v13-phase-oriented-workflow-design.md, docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md</files>
  <action>Amend the accepted design record with a dated 2026-08-30 canonical addendum while preserving the original v13 Phase-oriented workflow, source precedence, portable operation identity, Roadmap ownership, and non-goals. Record that the hierarchy is Task Verification → optional Spec Closure Verification → Phase Closure Verification; Human Phase Acceptance is only the residual human-facing portion of Phase Closure Verification, not another verification layer. State that sufficiently strong Task/Spec evidence is reused and executable, system, browser, visual, and external Phase evidence runs before human checks.

  Expand the normalized Spec with normative sections covering: lazy `.exspecso/phases/phase-NNN-slug/acceptance.md`; stable `PAC-NNN` checks; `pending | passed | failed | needs-retest`; persisted phase revision/context, expected outcome or instruction, result, and concise user failure evidence; the in-progress `stage: phase-acceptance` state; fresh `/exspecso-implement PHASE-NNN` reconstruction that resumes only pending/needs-retest checks; batched actionable checks by default and sequential execution only for dependency, shared-state, safety, or diagnostic reasons. Define the two typed failure routes exactly: approved-intent failures reopen the smallest affected Spec/Task, use the bounded Correction Loop, rerun affected verification and closure evidence, invalidate only stale acceptance checks, then return to Phase Acceptance; missing or changed intent creates an unresolved `blocking-plan-gap`, keeps the Phase incomplete, returns `needs-plan-revision`, and routes through `/exspecso-plan PHASE-NNN`. Replace the obsolete spec-revision terminal label throughout these two sources.

  Tighten Phase completion to require all Specs done, all Phase Closure Verification evidence including required Human Phase Acceptance passed, and no unresolved blocking plan gap. Document the deterministic helper surface `phase-closure-check`, `phase-acceptance-status`, and `phase-acceptance-record` as internal helper operations rather than new public slash commands. Add conformance obligations for no-human closure, batched/resumable acceptance, selective retest, and plan-gap routing. Update the existing Phase Delivery Loop, result, verify/review/status, and required-document-change sections so they agree with the new normative sections instead of leaving duplicate or contradictory wording. Edit only the two declared source documents; do not change `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`, any Phase 1 UAT or verification artifact, or the manifest.</action>
  <verify>
    <automated>node -e 'const fs=require("node:fs"); const paths=["docs/plans/2026-08-26-v13-phase-oriented-workflow-design.md","docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md"]; const texts=paths.map(p=&gt;fs.readFileSync(p,"utf8")); const all=texts.join("\n"); const required=["Task Verification","Spec Closure Verification","Phase Closure Verification","Human Phase Acceptance",".exspecso/phases/phase-NNN-slug/acceptance.md","PAC-NNN","needs-retest","stage: phase-acceptance","/exspecso-implement PHASE-NNN","blocking-plan-gap","needs-plan-revision","phase-closure-check","phase-acceptance-status","phase-acceptance-record","no-human closure","batched/resumable acceptance","selective retest","plan-gap routing"]; for (const value of required) { if (!all.includes(value)) throw new Error(`Missing canonical contract: ${value}`); } for (let i=0;i&lt;texts.length;i++) { if (!texts[i].includes("Human Phase Acceptance") || !texts[i].includes("needs-plan-revision")) throw new Error(`Incomplete synchronization: ${paths[i]}`); } if (all.includes("needs-spec-revision")) throw new Error("Obsolete terminal result remains");' &amp;&amp; git diff --check -- docs/plans/2026-08-26-v13-phase-oriented-workflow-design.md docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md</automated>
  </verify>
  <done>Both local v13 sources consistently encode the complete canonical closure/acceptance hierarchy, durable PAC state and resume semantics, selective correction versus planning-gap routing, terminal vocabulary, completion gate, helper surface, and fixture coverage; all excluded planning and Phase 1 evidence files remain untouched by this task.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Canonical Notion decisions → local normalized sources | Externally maintained product intent is translated into the repository artifacts later planners and executors treat as authoritative. |
| Local design record → normalized specification | Precedence decisions must be expressed as one non-contradictory implementation contract. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-Q260830-TJT-01 | Tampering | Both local v13 source documents | high | mitigate | Encode every canonical decision in the task action and assert the required hierarchy, state, routing, helper, and fixture terms across both artifacts with the automated verification command. |
| T-Q260830-TJT-02 | Repudiation | Accepted design record | medium | mitigate | Preserve the original acceptance record and add a dated 2026-08-30 canonical addendum identifying the new closure and acceptance decision set. |
| T-Q260830-TJT-03 | Denial of service | Phase completion and resume contract | high | mitigate | Specify selective evidence invalidation and pending/needs-retest-only resume so one failure neither incorrectly completes the Phase nor forces unrelated verified work to repeat. |
</threat_model>

## Source Coverage Audit

| Source | ID | Feature / requirement | Task | Status | Notes |
|--------|----|-----------------------|------|--------|-------|
| GOAL | — | Synchronize the two local v13 source artifacts without editing downstream roadmap/requirements or Phase 1 evidence | 1 | COVERED | Exact two-file scope is declared in frontmatter and the task action. |
| REQ | — | No ROADMAP requirement IDs are assigned to this quick source-sync task | — | EXCLUDED | REQUIREMENTS.md is explicitly reserved for separate downstream work. |
| RESEARCH | — | No RESEARCH.md was supplied | — | N/A | Canonical decisions were supplied directly in planning context. |
| CONTEXT | INPUT-01 | Verification hierarchy, residual human acceptance, evidence reuse, automatic evidence first | 1 | COVERED | Design and Spec both receive the precedence contract. |
| CONTEXT | INPUT-02 | Lazy acceptance.md with stable PAC-NNN checks and durable fields/statuses | 1 | COVERED | Normalized Spec receives the artifact contract. |
| CONTEXT | INPUT-03 | phase-acceptance resume and default batching with explicit sequential exceptions | 1 | COVERED | Normalized Spec receives lifecycle and reconstruction rules. |
| CONTEXT | INPUT-04 | Approved-intent failure reopens bounded work and invalidates only stale evidence | 1 | COVERED | Correction route is normative. |
| CONTEXT | INPUT-05 | Missing/changed intent creates blocking-plan-gap and needs-plan-revision | 1 | COVERED | Planning route and terminal vocabulary are normative. |
| CONTEXT | INPUT-06 | Phase completion requires Specs, closure evidence, acceptance, and no blocking plan gap | 1 | COVERED | Completion gate is tightened. |
| CONTEXT | INPUT-07 | Deterministic helper surface includes all three closure/acceptance operations | 1 | COVERED | Helpers remain internal mechanical operations. |
| CONTEXT | INPUT-08 | Conformance covers no-human, batched/resumable, selective-retest, and plan-gap paths | 1 | COVERED | Fixture obligations are explicit. |

<verification>
Run the task's automated contract check and Markdown diff check. Then inspect `git status --short` and `git diff --name-only` to confirm the implementation commit contains only the two declared docs; pre-existing modifications to `.planning/phases/01-initialize-canonical-projects/01-UAT.md` and `01-VERIFICATION.md` must remain unstaged and unchanged by this quick task.
</verification>

<success_criteria>
- The design record and normalized Spec agree on the verification hierarchy and Human Phase Acceptance boundary.
- Durable acceptance state, resume behavior, batching, both failure routes, selective retest, completion, helper operations, and conformance coverage are explicit and internally consistent.
- `needs-plan-revision` is the only plan-revision terminal used in the two source documents.
- No roadmap, requirements, project, manifest, Phase 1 UAT, or Phase 1 verification content is edited by the implementation task.
</success_criteria>

<output>
Create `.planning/quick/260830-tjt-synchronize-the-local-documentation-v13-/260830-tjt-SUMMARY.md` when implementation is complete; the quick-full workflow will create its VERIFICATION artifact and update STATE tracking separately.
</output>
