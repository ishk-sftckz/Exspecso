# Roadmap: Exspecso

## Overview

Exspecso reaches V1 through a contract-led vertical spine: initialize an inspectable repository-native project, make its state deterministic, turn approved direction into a bounded executable Spec, deliver that Spec through evidence gates, prove recovery and traceability, then ship the same workflow across Claude Code, Codex, and OpenCode. Canonical public command notation remains `/exspecso-<operation>`; every adapter preserves the portable `exspecso-<operation>` skill ID and changes only a host-owned sigil when unavoidable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Initialize Canonical Projects** - Users create a portable, inspectable Exspecso project without duplicate or hidden state.
- [ ] **Phase 2: Build the Project Truth Engine** - Users can prove deterministic project-state reasoning before any orientation workflow is built.
- [ ] **Phase 3: Orient and Plan Approved Work** - Users turn confirmed direction into a progressively elaborated, implementation-ready Spec.
- [ ] **Phase 4: Deliver One Approved Spec** - Users execute bounded, evidence-gated Task delivery with clear terminal outcomes.
- [ ] **Phase 5: Recover and Prove Completion** - Users safely correct, resume, trace, review, and inspect finished work.
- [ ] **Phase 6: Ship Portable Runtime Workflows** - Users evolve, test, and install one hardened Exspecso package across all supported runtimes.

## Phase Details

### Phase 1: Initialize Canonical Projects
**Goal**: Users can initialize an Exspecso project that has only the selected runtime adapters and minimal, durable canonical artifact foundations.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: SETUP-01, SETUP-02, SETUP-03, SETUP-04, SETUP-05, SETUP-06, SETUP-07, SETUP-08, ART-01, ART-02, ART-03, ART-04, ART-05, ART-06, ART-07, ART-08, ART-09
**Success Criteria** (what must be TRUE):
  1. A user can run `npx exspecso init` from either a repository root or nested directory and have the containing Git repository initialized correctly.
  2. A user can choose detected Claude Code, OpenAI Codex, and/or OpenCode integrations and receives only the native adapter files for those selections.
  3. A user can rerun initialization to add or refresh adapters without replacing confirmed canonical project artifacts.
  4. A user can inspect, address, rename, and resolve canonical artifacts through stable IDs in ordinary repository Markdown and JSON files, with no database or hidden duplicate projection required.
  5. An interrupted atomic write preserves the previous valid artifact set, and direct invalid artifact edits produce explicit validation errors.
**Plans**: TBD

### Phase 2: Build the Project Truth Engine
**Goal**: Users can build and prove a deterministic engine that resolves canonical artifacts, validates relationships and dependencies, calculates readiness and status, selects operation context, and reconstructs the next correct action without chat memory.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: CTRL-01, CTRL-02, CTRL-03, CTRL-04, CTRL-05, CTRL-06, CTRL-07, CTRL-08, CTRL-11, CTRL-12, CTRL-13, CTRL-14
**Success Criteria** (what must be TRUE):
  1. Before Phase 3 begins, a maintainer can run hand-authored fixture projects based on Phase 1's frozen Roadmap, Phase, Spec, Task, status, dependency, and Decision contracts and receive deterministic canonical-reference resolution and relationship-validation results.
  2. On the same fixture project, a user in a cold session receives operation-specific, smallest-sufficient context, can request structured context escalation, and can reconstruct the next correct action from computed Task, Spec, Phase, and Roadmap readiness and status.
  3. A user receives explicit fixture-backed errors for unknown or cyclic Phase, Spec, and Task dependencies; incomplete dependencies block delivery but not planning, while declared order remains only a preference among equally ready work.
  4. A user can create and supersede meaningful `DEC-NNN` records with linked rationale, and the engine selects only relevant durable Decision sections instead of routine activity or naming details.
**Plans**: TBD

### Phase 3: Orient and Plan Approved Work
**Goal**: Users can confirm project direction and progressively turn one canonical Roadmap outcome into a minimal, approved, implementation-ready Spec.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07, DISC-08, DISC-09, DISC-10, DISC-11, DISC-12, DISC-13, PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06, PLAN-07, PLAN-08, PLAN-09, PLAN-10, PLAN-11, PLAN-12, PLAN-13, PLAN-14, PLAN-15, PLAN-16, PLAN-17, PLAN-18, PLAN-19, PLAN-20, PLAN-21
**Success Criteria** (what must be TRUE):
  1. A user can run `/exspecso-start` and receive evidence-based greenfield or brownfield orientation that incorporates supplied context, asks only material unresolved questions, and preserves the user's final intent.
  2. After confirmation, a user receives a Brief, applicable Standards, and one stable `ROADMAP` at `.exspecso/roadmap.md`, and can resume interrupted orientation from persisted state.
  3. A user can choose progressive or all-phases grooming: progressive keeps declared Phases lazy, while all-phases materializes each Phase's complete Spec declaration list without executable Spec artifacts.
  4. A user can plan only Roadmap-declared Phases and parent-declared Specs into approved Phase briefs, stable dependency graphs, and one executable Spec folder only when that Spec is deeply planned.
  5. Every approved current Spec has the smallest justified Requirement, Acceptance Criterion, verification, plan, and Task set needed to cover its parent outcome, while no application source code changes during planning.
**Plans**: TBD

### Phase 4: Deliver One Approved Spec
**Goal**: Users can execute one approved Spec as a finite, scope-bounded Delivery Loop whose Tasks complete only through the approved evidence contract.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: CTRL-09, CTRL-10, DELV-01, DELV-02, DELV-03, DELV-04, DELV-05, DELV-06, DELV-07, DELV-08, DELV-09, DELV-10, DELV-11, DELV-12, DELV-13, DELV-14, DELV-15, DELV-16, DELV-17, DELV-18, DELV-19, DELV-21, DELV-22
**Success Criteria** (what must be TRUE):
  1. A user can start `/exspecso-implement SPEC-NNN` only for a delivery-ready approved Spec and receives an explicit blocked result naming unmet dependencies otherwise.
  2. A user can run continuous or step delivery over the approved finite Plan, with only one sequential Task active unless all explicit parallel-independence checks pass.
  3. A user sees implementation remain within the current Task's approved scope and evidence contract; useful out-of-scope work is deferred and blocking discoveries stop for an approved revision.
  4. A user receives fitting executable or explicit non-executable evidence, a verified durable checkpoint only after that contract passes, required closure verification, and an independent final review.
  5. A user receives exactly one explainable Delivery Loop result and can safely re-invoke an already complete Spec without repeating accepted work.
**Plans**: TBD

### Phase 5: Recover and Prove Completion
**Goal**: Users can recover correctable failures and interruptions without losing scope or proof, then trace, review, and inspect the resulting truthful completion state.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: DELV-20, REC-01, REC-02, REC-03, REC-04, REC-05, REC-06, CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07, TRACE-01, TRACE-02, TRACE-03, TRACE-04, TRACE-05, TRACE-06, TRACE-07
**Success Criteria** (what must be TRUE):
  1. A user receives a bounded Assess → Learn → Patch → Reverify Correction Loop that reruns the original evidence contract, records its episode, and visibly stops or escalates at defined limits.
  2. A correctable review finding reopens only the smallest affected Task and Acceptance Criteria, refreshes its verified checkpoint and trace, then reruns affected closure verification and review.
  3. A user can interrupt incomplete work, retain lightweight validated resume state, and resume the first incomplete Task without falsely marking it complete or rerunning accepted checkpoints.
  4. A user can trace every implemented Requirement through criterion, Task, changed files, evidence, checkpoint, and final status; missing links produce a trace failure.
  5. A user can run `/exspecso-status` to see artifact-derived delivery state and one concrete next command, while status never silently repairs or mutates project truth.
**Plans**: TBD

### Phase 6: Ship Portable Runtime Workflows
**Goal**: Users can safely evolve and install one release-quality Exspecso package whose identical portable skill identities work across Claude Code, Codex, and OpenCode.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: PORT-01, PORT-02, PORT-03, PORT-04, PORT-05, PORT-06, REL-01, REL-02, REL-03, REL-04, REL-05, REL-06, REL-07, REL-08, REL-09, REL-10, REL-11
**Success Criteria** (what must be TRUE):
  1. A user can invoke every supported operation through the portable `exspecso-<operation>` skill identity, documented as `/exspecso-<operation>`, in Claude Code, Codex, and OpenCode, with only a host-owned sigil difference where required.
  2. A user can switch among supported runtimes or refresh an adapter through `init` without migrating or recreating canonical project state, IDs, relationships, statuses, or lifecycle semantics.
  3. A user can revise approved artifacts through `/exspecso-update` and add a validated, confirmed `PHASE-NNN` through `/exspecso-new-phase`, while direction-changing work is routed to update first and no second Roadmap is created.
  4. A user receives safe, explainable rerun behavior for malformed state, interrupted writes, dirty working trees, and external Git drift, without duplicate artifacts or corrupted confirmed state.
  5. A user can install one documented npm package, follow greenfield and brownfield examples, and rely on shared conformance fixtures that cover all runtimes, recovery paths, cross-runtime continuation, and measured resume cost.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Initialize Canonical Projects | 0/TBD | Not started | - |
| 2. Build the Project Truth Engine | 0/TBD | Not started | - |
| 3. Orient and Plan Approved Work | 0/TBD | Not started | - |
| 4. Deliver One Approved Spec | 0/TBD | Not started | - |
| 5. Recover and Prove Completion | 0/TBD | Not started | - |
| 6. Ship Portable Runtime Workflows | 0/TBD | Not started | - |
