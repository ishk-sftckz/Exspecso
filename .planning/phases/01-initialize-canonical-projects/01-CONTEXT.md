# Phase 1: Initialize Canonical Projects - Context

**Gathered:** 2026-08-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the repository-local foundation for Exspecso: one idempotent npx exspecso init flow, minimal canonical project artifacts, selected runtime-native adapters, stable artifact identity and resolution contracts, explicit validation, and atomic writes that preserve the last valid state. It does not perform project orientation, create Roadmap/Phase/Spec delivery artifacts, or implement later planning and delivery workflows.

</domain>

<decisions>
## Implementation Decisions

### Initial artifact contents
- **D-01:** Initial exspecso.config.json records only active setup state: schema version, generated stable project identity, editable project title, mode, selected agents, and onboarding status. Later workflows add configuration when it becomes relevant.
- **D-02:** init records mode as unclassified. /exspecso-start determines greenfield or brownfield later from repository evidence.
- **D-03:** Initial constitution.md contains concise framework invariants only: artifact truth, human control, evidence integrity, bounded scope, and runtime portability. It contains no guessed project-specific rules.
- **D-04:** Project identity is an opaque globally unique ID. The human-readable project title is separate and editable. — **Reversibility:** costly — changing an issued project ID would require updating persisted references and could break continuity across repository copies or runtime handoffs.

### Runtime selection experience
- **D-05:** Interactive init always shows Claude Code, OpenAI Codex, and OpenCode. Every option starts unchecked; detection is an informational label only and never selects on the user's behalf.
- **D-06:** At least one runtime is required. Submitting an empty selection keeps the selector open with an explanation and permits explicit cancellation.
- **D-07:** Non-interactive terminals and scripts use repeatable --agent flags. Interactive terminals retain the checkbox selector.
- **D-08:** Successful init shows /exspecso-start as the canonical next operation, then shows only the exact native invocation for each selected runtime, such as $exspecso-start for Codex.

### Adapter refresh conflicts
- **D-09:** Adapter refresh uses managed-file fingerprints. An unchanged managed file refreshes automatically; a locally modified file is preserved, accompanied by a concise diff and an explicit replacement path.
- **D-10:** Rerunning init is additive. Checked adapters are added or refreshed; previously installed adapters left unchecked remain untouched. An unchecked box is never deletion authority.
- **D-11:** Each adapter carries a small generated header containing its Exspecso template version and original-content hash. No separate adapter manifest or hidden adapter-state file is created.
- **D-12:** init preflights the complete selected change set before writing. Any unresolved adapter conflict blocks all writes; all detected conflicts are reported together.
- **D-13:** V1 does not attempt automatic three-way merging of modified adapters. Replacement requires explicit review and approval.

### Failure and validation UX
- **D-14:** If no containing Git repository exists, init fails before any write, identifies the searched path, and explains how to run git init or move into the intended repository. Exspecso never initializes Git implicitly.
- **D-15:** Validation reports every independently detectable error in one pass. Each error includes a stable code, exact artifact path or section, expected and actual values, and a concrete repair hint.
- **D-16:** Validation and resolution failures exit nonzero and never repair or mutate canonical artifacts implicitly.
- **D-17:** Duplicate stable IDs make resolution ambiguous. Exspecso lists every conflicting definition, selects none, and blocks the operation until the user repairs the duplicate.
- **D-18:** After an interrupted atomic write, the next invocation may remove only clearly identified Exspecso staging debris, must confirm that the previous canonical set remains valid, and reports the recovery. Ambiguous or externally changed canonical files cause a fail-closed stop.
- **D-19:** Phase 1 proves ART-07 against deterministic process interruption, injected exceptions, and killed-process recovery at every declared promotion step. It does not claim physical power-loss durability or universal guarantees across APFS, NTFS, ext4, or other filesystems without separate platform evidence. — **Reversibility:** reversible — later platform testing may strengthen the evidence claim without changing the canonical write contract.
- **D-20:** The public stable-ID vocabulary is `ROADMAP`, `PHASE-NNN`, `SPEC-NNN`, `REQ-NNN`, `AC-NNN`, `PLAN-NNN`, `TASK-NNN`, `DEC-NNN`, and `FINDING-NNN`. These exact literals cover Roadmap, Phase, Spec, Requirement, Acceptance Criterion, Plan, Task, Decision, and review finding respectively. — **Reversibility:** one-way — changing issued identifiers would break persisted references or require an explicit migration.

### Filesystem safety and compatibility correction
- **D-21:** The shipped package is one pure TypeScript/Node package. Exspecso keeps deterministic repository-root scoping, relative-component and symlink validation, expected-preimage checks, journaled atomic writes, conservative recovery, and Git checkpoints. Claude Code, OpenAI Codex, and OpenCode host permissions and sandboxes are the OS-level security boundary. Exspecso does not claim kernel-level, race-proof, hostile same-user, or universal-filesystem containment. The native C/C++ provider, prebuilt loader, runtime support-row gate, and native certification system are outside Phase 1 and V1; the prior research, debug records, CI logs, and evidence remain historical records explaining this decision, not normative completion requirements. **Supersession boundary:** completed Plans 01-19 and 01-20 and their summaries remain immutable historical evidence of the earlier native approach; revised Plan 01-17 exclusively owns the forward cutover away from their shipped native surfaces. This is not re-execution, and their past completion status is not evidence that the new TypeScript path works. Native source, tests, scripts, workflows, and evidence left in the repository are non-shipped, non-invoked historical/deferred material; their physical deletion is not Phase 1 work. — **Reversibility:** costly — reintroducing native hardening would require a separately approved threat model, support contract, build path, packaging design, and evidence program.
- **D-22:** Routine compatibility evidence uses a small representative set of supported OS families and Node boundary/LTS lanes. Exact runner images, compiler builds, SDKs, libc/package revisions, and historical Node patches may be retained as provenance, but they do not become runtime compatibility requirements. No exhaustive OS-by-Node cross-product or further native certification run is a Phase 1 completion condition.

### the agent's Discretion
- Exact TypeScript libraries for CLI prompts, schema validation, atomic filesystem operations, and unique-ID generation.
- Exact error-code names, provided they are stable and structured.
- Exact staging-directory naming, managed-header syntax, and hash algorithm, provided the decisions above remain inspectable and deterministic.
- Exact adapter file templates and runtime-native installation paths, constrained by each runtime's current official contract and the shared exspecso-<operation> identity.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Local planning authority
- .planning/PROJECT.md — Product thesis, non-negotiable constraints, canonical Documentation v12 links, and the one-package architecture.
- .planning/REQUIREMENTS.md — SETUP-01 through SETUP-08 and ART-01 through ART-09 define Phase 1 behavior and traceability.
- .planning/ROADMAP.md — Phase 1 boundary, goal, and five success criteria.
- .planning/STATE.md — Current project position and accumulated decisions that apply to Phase 1.

### Local runtime and product guidance
- docs/research/runtime-command-naming.md — Portable exspecso-<operation> identity, canonical /exspecso-<operation> notation, and runtime-native invocation differences.
- BRANDING.md — Voice and presentation guidance only. Its historical RALP references are non-canonical and must not override Documentation v12.

### External canonical Documentation v12
- https://app.notion.com/p/3ad7d0b4dee281ec9a2bf2d3d0f7b588 — Architecture & Design Decisions v12, especially System Identity, Canonical User-Project Layout, Setup UX, and Product Repository.
- https://app.notion.com/p/3ad7d0b4dee281d5afa9cef8d742710c — Artifact, Entity & Contract Registry v12, especially project layout, naming, frontmatter, configuration, integration setup, and no-duplicate-state rules.
- https://app.notion.com/p/3ad7d0b4dee2818c8a86c12c2882fc0c — Complete Product & Agent Workflow v12, especially Initialize.
- https://app.notion.com/p/3ad7d0b4dee28193abdadeecb779a5af — Step-by-Step Build Guide v12, especially Phase 0: CLI and Artifact Conventions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- docs/research/runtime-command-naming.md already contains the researched runtime invocation contract and recommended adapter conformance checks.
- assets/exspecso-logo.svg and BRANDING.md are available for later presentation work but do not define product behavior.
- No TypeScript application source, package manifest, test harness, or existing helper implementation exists yet.

### Established Patterns
- The repository is greenfield for implementation; planning must establish the initial one-package TypeScript/Node structure.
- Existing planning artifacts consistently separate canonical repository truth, deterministic mechanics, and runtime orchestration.
- Canonical state is human-readable Markdown and small JSON; runtime integration files are adapters, not an alternative state model.

### Integration Points
- A new CLI entry point must resolve the containing Git root and dispatch init.
- A deterministic artifact layer must own stable IDs, parsing, validation, resolution, templates, and atomic write transactions.
- Runtime adapter installers must target Claude Code, Codex, and OpenCode while preserving one shared operation identity and behavior.
- Tests must exercise root and nested invocation, selection behavior, reruns, local adapter modifications, malformed artifacts, duplicate IDs, and interrupted writes.

</code_context>

<specifics>
## Specific Ideas

- Interactive selection uses an explicit all-supported-runtimes checklist rather than detection-driven defaults.
- Non-interactive selection uses repeatable --agent arguments.
- Adapter files are self-describing through a template-version and original-content-hash header.
- Conflict handling should resemble conservative source-file generators: automatic refresh only when safe, reviewable diff when modified, and explicit replacement authority.
- Completion output remains concise: canonical next operation first, then selected-runtime invocation translations only.

</specifics>

<deferred>
## Deferred Ideas

- Optional native or kernel-assisted filesystem hardening, only under a separately approved post-V1 threat model and only if real user evidence requires it. The existing containment research and execution evidence are retained as historical inputs to that decision, not as active Phase 1 requirements.

</deferred>

---

*Phase: 1-Initialize Canonical Projects*
*Context gathered: 2026-08-26*
