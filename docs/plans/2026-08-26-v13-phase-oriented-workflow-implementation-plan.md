# Exspecso v13 Phase-Oriented Workflow Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reconcile Exspecso's canonical GSD planning artifacts with the approved Documentation v13 Phase-oriented workflow while retaining portable `exspecso-<operation>` skill IDs.

**Architecture:** Treat the approved design as an ADR-level conflict resolution over normalized v13 source contracts. Use the GSD document-ingestion pipeline to classify, synthesize, conflict-check, preview, merge, and verify the planning artifacts without touching application implementation code.

**Tech Stack:** Markdown, JSON, GSD planning artifacts, Git, Node.js GSD helper

---

### Task 1: Stage the approved v13 migration sources

**Files:**
- Create: `docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md`
- Create: `.planning/v13-ingest-manifest.yml`

1. Normalize the five canonical Notion pages into one source-linked migration Spec.
2. Record the approved command-identity and stale-fragment resolution from the design document.
3. Add a manifest that classifies the approved design as `ADR` and the normalized workflow as `SPEC`.
4. Confirm the manifest contains only repository-relative paths and no traversal.

### Task 2: Classify and synthesize

**Files:**
- Create: `.planning/intel/classifications/*.json`
- Create: `.planning/intel/decisions.md`
- Create: `.planning/intel/requirements.md`
- Create: `.planning/intel/constraints.md`
- Create: `.planning/intel/context.md`
- Create: `.planning/intel/SYNTHESIS.md`
- Create: `.planning/INGEST-CONFLICTS.md`

1. Classify both manifest documents through the GSD classifier role.
2. Synthesize them against existing `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, and Phase context.
3. Stop if a locked contradiction remains unresolved.
4. Surface warnings before any destination artifact changes.

### Task 3: Merge Project and Requirements

**Files:**
- Modify: `.planning/PROJECT.md`
- Modify: `.planning/REQUIREMENTS.md`

1. Replace v12 authority and obsolete Phase-grooming decisions with v13 authority.
2. Preserve portable dash-based skill identities and runtime-native sigil guidance.
3. Replace public Spec planning/delivery requirements with Phase-oriented planning and delivery requirements.
4. Retain internal Spec/Task evidence, correction, checkpoint, traceability, and resume boundaries.
5. Remove obsolete out-of-scope statements and update requirement traceability.

### Task 4: Merge Roadmap and State

**Files:**
- Modify: `.planning/ROADMAP.md`
- Modify: `.planning/STATE.md`
- Modify: `AGENTS.md`

1. Update Phase 3 to produce complete detailed planning for every Spec in one selected Phase.
2. Update Phase 4 to deliver one approved Phase through dependency-aware internal Spec Delivery Loops.
3. Keep Phase 2 as the prerequisite truth-engine proof gate.
4. Preserve the current Phase 1 position and discussion checkpoint.
5. Synchronize project guidance with the updated Project constraints.

### Task 5: Verify the migration

**Files:**
- Verify: `.planning/PROJECT.md`
- Verify: `.planning/REQUIREMENTS.md`
- Verify: `.planning/ROADMAP.md`
- Verify: `.planning/STATE.md`
- Verify: `AGENTS.md`

1. Search for stale v12, grooming-choice, colon-command, public `plan SPEC`, Spec-targeted `implement`, and deferred Phase-wide delivery language.
2. Count V1 requirements and verify every requirement maps to exactly one roadmap Phase.
3. Confirm every roadmap requirement exists in `REQUIREMENTS.md` and no requirement is orphaned.
4. Run `git diff --check`.
5. Review the final diff without staging the user's Phase 1 discussion checkpoint.
