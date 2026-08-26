# Phase 1: Initialize Canonical Projects - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md; this log preserves the alternatives considered.

**Date:** 2026-08-26
**Phase:** 1-Initialize Canonical Projects
**Areas discussed:** Initial artifact contents, Runtime selection experience, Adapter refresh conflicts, Failure and validation UX

---

## Initial artifact contents

| Decision | Alternatives considered | User's choice |
|----------|-------------------------|---------------|
| Project mode before orientation | Unclassified until start; infer during init; ask during init | Unclassified until /exspecso-start |
| Initial config depth | Active setup state only; all documented defaults; hybrid | Active setup state only |
| Initial constitution content | Framework invariants; identity-only shell; comprehensive defaults | Framework invariants only |
| Project identity | Repository-scoped PROJECT-001; generated unique ID; title only | Generated opaque unique ID |

**Notes:** The editable project title is not identity. Project-specific rules are not guessed during init.

---

## Runtime selection experience

| Decision | Alternatives considered | User's choice |
|----------|-------------------------|---------------|
| Initial selections | Detection-driven preselection; recommendation badges; all supported runtimes unchecked | All supported runtimes shown unchecked |
| Empty selection | Keep selector open; cancel immediately; confirmation prompt | Keep selector open and permit explicit cancellation |
| Non-interactive selection | Repeatable flags; interactive-only | Repeatable --agent flags |
| Completion guidance | Canonical command only; full help; canonical plus selected-runtime translations | Canonical plus selected-runtime translations |

**Notes:** The user corrected the initial interpretation: detection may be shown, but it must never check a runtime automatically.

---

## Adapter refresh conflicts

| Decision | Alternatives considered | User's choice |
|----------|-------------------------|---------------|
| Modified managed file | Preserve and require explicit replacement; overwrite; automatic merge | Preserve, show diff, require approval |
| Unchecked installed adapter | Leave untouched; remove | Leave untouched |
| Refresh metadata | Self-describing adapter header; separate manifest | Self-describing header |
| Multi-file conflict behavior | All-or-nothing preflight; partial safe writes | All-or-nothing preflight |

**Notes:** Official analogs considered included shadcn/ui's explicit overwrite and diff controls, npm init's additive preservation, and Copier's heavier three-way-merge strategy. Exspecso V1 chooses the conservative non-merging approach.

---

## Failure and validation UX

| Decision | Alternatives considered | User's choice |
|----------|-------------------------|---------------|
| No containing Git repository | Fail without writes; initialize Git implicitly | Fail without writes and guide the user |
| Malformed artifacts | Aggregate actionable errors; stop at first error | Aggregate actionable errors |
| Duplicate stable IDs | Fail closed; precedence winner | Fail closed and list every definition |
| Interrupted-write recovery | Conservative staging cleanup; entirely manual cleanup; automatic canonical repair | Conservative staging cleanup only |

**Notes:** No failure path may silently mutate or repair canonical project truth.

---

## the agent's Discretion

- Library selection and internal module boundaries.
- Exact stable error-code identifiers.
- Exact opaque project-ID encoding.
- Exact managed-header syntax, hash algorithm, and staging-directory name.
- Runtime-native adapter file details within the locked shared operation contract.

## Deferred Ideas

None.
