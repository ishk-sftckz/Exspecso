---
phase: 01-initialize-canonical-projects
verified: 2026-08-27T08:25:24Z
status: gaps_found
score: 19/25 must-haves verified
behavior_unverified: 1
overrides_applied: 0
gaps:
  - truth: "Directly edited canonical JSON with an invalid stable ID or parent is rejected with actionable diagnostics before init writes."
    status: failed
    reason: "JSON scanner drops invalid id/parent values before validation, so invalid relationships can be silently accepted."
    artifacts:
      - path: "src/artifacts/resolve.ts"
        issue: "jsonDefinition() converts an invalid parent to undefined and omits a document with an invalid id."
      - path: "src/artifacts/validate.ts"
        issue: "validateRawArtifactIds() scans only Markdown."
    missing:
      - "Preserve invalid JSON declarations as diagnostics and aggregate them in validateProject()."
      - "Add integration coverage for invalid JSON id and parent fields through runInit()."
  - truth: "A concurrent inspector or writer sees a valid prior/committed set or a busy diagnostic; recovery never interferes with a live transaction."
    status: failed
    reason: "Recovery checks for a live lock non-atomically, then removes staging and the lock without acquiring ownership."
    artifacts:
      - path: "src/init/run-init.ts"
        issue: "hasActiveTransaction() at lines 50-53 does not reserve recovery ownership before recovery at line 54."
      - path: "src/filesystem/recovery.ts"
        issue: "recoverInterruptedTransaction() restores and removes a discovered stage at lines 102-131 without a recovery lock."
    missing:
      - "Use one atomic ownership protocol for recovery and writers; return busy when a live owner exists."
      - "Add a deterministic race test that starts a writer between busy observation and recovery acquisition."
  - truth: "The declared D-19 process-level recovery boundary preserves a valid artifact set without path escape or symlink redirection."
    status: failed
    reason: "Promotion validates a pathname and subsequently copyFile() follows a destination symlink if it is swapped after validation."
    artifacts:
      - path: "src/filesystem/safe-path.ts"
        issue: "The lstat-based validation is a separate time-of-check operation."
      - path: "src/filesystem/transaction.ts"
        issue: "copySynced() at lines 92-102 and promotion at lines 231-236 use pathname-following copyFile after assertSafeTarget()."
    missing:
      - "Promote through an atomic, directory-bound replacement mechanism and fail closed on pathname changes."
      - "Add a deterministic post-validation symlink-swap hook test."
behavior_unverified_items:
  - truth: "Interactive users can select a non-empty subset of Claude Code, Codex, and OpenCode with detection only as unchecked presentation metadata."
    test: "Run the packed CLI in a real TTY in a temporary Git repository, with one runtime-detection environment variable set; submit empty once, then select a subset and cancel once."
    expected: "All three options begin unchecked, detection is label-only, empty selection remains in the selector with an explanation, cancellation writes nothing, and the submitted subset alone is persisted/written."
    why_human: "Unit tests inject the prompt callback; they do not observe Inquirer's actual terminal rendering and interaction."
---

# Phase 1: Initialize Canonical Projects Verification Report

**Phase Goal:** Users can initialize an Exspecso project that has only the selected runtime adapters and minimal, durable canonical artifact foundations.
**Verified:** 2026-08-27T08:25:24Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## MVP Mode Guard

`roadmap.get-phase` marks this phase `mvp`, but `user-story.validate` returned `false` for the roadmap goal. It is not in the required `As a …, I want …, so that … .` form. This report therefore evaluates the concrete roadmap success criteria and PLAN contracts supplied for Phase 1; the roadmap should be normalized before a formal MVP user-flow verification is claimed.

## Goal Achievement

### Observable Truths

| # | Roadmap success criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Init from repository root or nested directory initializes the containing Git repository. | ✓ VERIFIED | Packed CLI integration tests cover root, deep nested, nearest nested repository, and no-repository failure; the full 48-test run passed. |
| 2 | A user chooses detected runtime integrations and receives only those native adapter files. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `runtime-selection.ts` keeps choices unchecked and `registry.ts` maps selected IDs to the three native paths; unit tests cover injected selections and every subset. Actual Inquirer TTY interaction still needs the recorded manual check. |
| 3 | Rerun adds or refreshes adapters without replacing confirmed canonical artifacts. | ✓ VERIFIED | `init-rerun.test.ts` exercises additive selection, unchanged canonical files, conflict aggregation, scoped replacement, and stale preimages. |
| 4 | Canonical artifacts can be inspected, addressed, renamed, and resolved through stable IDs with ordinary repository JSON/Markdown only. | ✗ FAILED — BLOCKER | Valid Markdown cases work, but a temporary Git fixture with `{\"id\":\"SPEC-001\",\"parent\":\"REQUIREMENT-001\"}` produced `validateProject() -> []`; the invalid JSON parent is silently ignored. |
| 5 | Interrupted atomic writes preserve the valid artifact set and invalid edits give explicit errors. | ✗ FAILED — BLOCKER | Invalid Markdown/config cases are diagnosed, but active recovery can delete a live writer's transaction; promotion has a symlink-swap path escape. |

**Detailed plan score:** 19/25 must-haves verified; 1 present but behavior-unverified; 5 failed.
**Roadmap score:** 2/5 verified; 1 requires terminal UAT; 2 failed.

### Detailed Must-Have Disposition

| Plan contract | Status | Evidence |
| --- | --- | --- |
| Plan 01: exact-version approval gates for Vitest and Inquirer | ✓ VERIFIED | Approval artifact predates the package-install commits and records the two exact versions; installed versions match `package.json`. |
| Plan 02: root/nested packed init, output, minimal local state | ✓ VERIFIED | Packed tracer assertions pass; package contains the compiled CLI only; source has no database/network client or duplicate-state mechanism. |
| Plan 03: explicit selection, detection-as-label, deterministic native subset | 2 ✓ / 1 ⚠️ | Script and pure-selection behavior are covered. Real TTY behavior is the one recorded manual check. |
| Plan 04: D-20 IDs, resolution, lazy artifacts, direct-edit validation | 7 ✓ / 1 ✗ | Markdown/valid JSON resolution works; the invalid JSON id/parent validation contract fails. |
| Plan 05: additive non-destructive reruns | ✓ VERIFIED | Managed-header classification, preflight, conflict aggregation, scoped replacement, and no-write conflict behavior are exercised. |
| Plan 06: concurrent/recovered transaction safety and minimal tree | 3 ✓ / 4 ✗ | No-op, journal order, and roadmap absence pass; live-recovery race breaks EDGE-06/09/17/20. |

## Required Artifacts

All 24 declared artifacts exist and are substantive according to `verify.artifacts` (Plan 01: 1/1; 02: 8/8; 03: 3/3; 04: 4/4; 05: 3/3; 06: 5/5). Their operational verdicts are below; existence does not make the unsafe transaction/validation behavior acceptable.

| Artifact group | Expected | Status | Details |
| --- | --- | --- | --- |
| CLI, Git-root resolver, packed tracer | repository-contained init | ✓ VERIFIED | `package.json` bin → `main()` → `runInit()`; packed root/nested integration evidence. |
| Selection and adapter registry | selected native files only | ⚠️ UAT | State/data flow is wired; real TTY rendering remains unobserved. |
| Schema, resolver, validator, diagnostics | closed ID and direct-edit validation | ✗ FAILED | JSON invalid declarations are lost in scanner before diagnostics. |
| Managed files and init plan | additive, reviewable reruns | ✓ VERIFIED | Adapter bytes and canonical artifacts are preserved or fail conflict-free before writes. |
| Safe paths, transaction, recovery | contained exclusive recovery | ✗ FAILED | Present and linked but unsafe under recovery race and post-check symlink swap. |

## Key Link Verification

| From | To | Status | Details |
| --- | --- | --- | --- |
| `package.json` | `src/cli/main.ts` | ✓ WIRED | Bin points to `dist/cli/main.js`; packed tracer executes it. |
| `main.ts` | `run-init.ts` | ✓ WIRED | `main()` delegates with process I/O and CWD. |
| `run-init.ts` | config and adapter generation | ✓ WIRED | `runInit()` → `buildInitPlan()` → `buildAdapterPlan()` → registry → transaction. The automated link checker missed the indirect Codex path, but the packed tracer proves it. |
| `run-init.ts` | validation | ⚠️ WIRED, INCOMPLETE | It calls `validateProject()` before planning writes, but JSON malformed IDs/parents evade that validation. |
| `run-init.ts` | recovery/transaction | ✗ UNSAFE | The calls are wired, but the non-atomic check/recovery handoff lets recovery remove a live transaction. |
| transaction promotion | containment guard | ✗ UNSAFE | `assertSafeTarget()` precedes `copyFile()` but does not bind the checked object to promotion. |
| recovery | aggregate validation | ⚠️ PARTIAL | Recovery validates after restore, but does not own the lock while deciding to remove operational state. |

## Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
| --- | --- | --- | --- | --- |
| Runtime adapters | `selectedAgents` | submitted flags or TTY callback | `buildInitPlan()` passes only requested adapters to `buildAdapterPlan()` | ✓ FLOWING |
| Canonical config | existing config + rendered plan | repository JSON and templates | staged then promoted as `.exspecso/exspecso.config.json` | ⚠️ FLOWING but validation hollow for invalid JSON IDs/parents |
| Recovery | journal entries/hashes | repository-local staging journal | restoration and cleanup | ✗ UNSAFE concurrent data flow; live journal can be mistaken for interrupted |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Build and full automated suite | `npm run build && npm test -- --run` | 48 tests passed | ✓ PASS |
| Publishable package surface | `npm pack --dry-run` | exit 0; compiled `dist` package listed | ✓ PASS |
| Invalid JSON parent rejection | temporary Git fixture calling `validateProject()` | returned `[]` for `SPEC-001` / invalid `REQUIREMENT-001` parent | ✗ FAIL |
| Active writer vs recovery | temporary Git fixture with `onReadyToPromote` pause | recovery returned `recovered`; resumed writer failed `ENOENT` copying deleted staged source | ✗ FAIL |
| Symlink promotion primitive | temporary Git fixture calling Node `copyFile(source, symlink)` | external referent changed from `old` to `new` | ✗ FAIL — primitive plus reachable code path; no full CLI race is claimed |

## Probe Execution

Step 7c: SKIPPED. No declared or conventional `scripts/**/tests/probe-*.sh` probe exists.

## Requirements Coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| SETUP-01 | ✓ SATISFIED | Packed root-init tracer passes. |
| SETUP-02 | ✓ SATISFIED | Nested and nearest-repository tracer cases pass. |
| SETUP-03 | ? NEEDS HUMAN | Non-TTY selection is tested; real TTY selection remains manual UAT. |
| SETUP-04 | ? NEEDS HUMAN | Code/tests show unchecked detection labels, but terminal UX needs UAT. |
| SETUP-05 | ✓ SATISFIED | Registry power-set tests and packed Codex tracer show selected native targets only. |
| SETUP-06 | ✗ BLOCKED | Normal minimal-tree path works, but unsafe live recovery violates the required exclusive/concurrent init contract. |
| SETUP-07 | ✓ SATISFIED | Rerun conflict and scoped replacement integration coverage passes. |
| SETUP-08 | ✓ SATISFIED | Completion is canonical-first and selected-native-only in code and tracer assertions. |
| ART-01 | ✗ BLOCKED | Repository artifacts are inspectable normally, but the recovery race can invalidate a live operation's state. |
| ART-02 | ✓ SATISFIED | Package/source use repository files and local filesystem only; no DB, cloud, export, or duplicate projection was found. |
| ART-03 | ✗ BLOCKED | Invalid JSON IDs/parents are silently discarded rather than rejected. |
| ART-04 | ✓ SATISFIED | Unit coverage retains identity across title/order changes. |
| ART-05 | ✓ SATISFIED | Fresh/repeated init tests prove deeper artifacts stay lazy. |
| ART-06 | ✓ SATISFIED | Resolver tests cover every family, ROADMAP path, Task sections, and concurrent reads. |
| ART-07 | ✗ BLOCKED | Process-level fault matrix passes only where no competing recovery or symlink swap occurs; both defects violate contained recovery safety. D-19's excluded power-loss/universal-filesystem claims were not demanded. |
| ART-08 | ✗ BLOCKED | Invalid direct JSON edits can pass undiagnosed. |
| ART-09 | ✓ SATISFIED | Minimal-tree tests keep roadmap/status/selector artifacts absent; reserved roadmap behavior is tested. |

No Phase 1 requirement is clearly deferred to a later phase: Phase 5's broader recovery work does not override the explicit Phase 1 SETUP-06/ART-07 contract.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `src/artifacts/resolve.ts` | 106-111 | Invalid JSON identity/parent coercion | 🛑 Blocker | Validation cannot see malformed canonical relationships. |
| `src/init/run-init.ts` | 50-54 | Check-then-recover race | 🛑 Blocker | Live writer can be torn down. |
| `src/filesystem/recovery.ts` | 102-131 | Recovery without ownership lock | 🛑 Blocker | Deletes staging and lock of an active transaction. |
| `src/filesystem/transaction.ts` | 231-236 | TOCTOU before pathname-following copy | 🛑 Blocker | A symlink swap can redirect writes outside the root. |

The phase files have no unreferenced `TBD`, `FIXME`, or `XXX` markers. `return null`/empty-return matches are ordinary parse/error control flow, not rendered-data stubs.

## Prohibition Review

The four PLAN judgment-tier prohibitions cannot silently pass. Code inspection and the automated tests support the intended outcomes for no hidden projection, no detection-as-consent, no omission-as-deletion/overwrite, and no D-19 overclaim. A human should still acknowledge those judgments after the blockers are fixed; the Phase 1 summaries correctly limit their durability claim to deterministic process interruption, injected exceptions, and killed-child recovery on the tested APFS environment.

## Human Verification Required After Gap Closure

### 1. Real TTY runtime selection

**Test:** In a temporary Git repository, run the packed CLI with no `--agent` flags in a real terminal and a runtime-detection environment variable set.

**Expected:** All runtime choices are initially unchecked; detection is only a label; empty submission remains in the selector with an explanation; cancel leaves no files; chosen runtimes alone create native adapters and appear in `selectedAgents`.

**Why human:** The tests inject the prompt function and cannot observe terminal rendering/input behavior.

### 2. Judgment-tier prohibition acknowledgement

**Test:** Review generated project files and adapter rerun behavior after the fixes.

**Expected:** No hidden/duplicate state or export dependency appears; detection never installs anything without selection; omitted and modified adapters remain untouched; documentation makes no broader durability claim than D-19 allows.

**Why human:** These are declared human-control/transparency prohibitions, not mechanical pass markers.

## Gaps Summary

The normal initializer path is real, packaged, and well covered, but Phase 1 cannot be accepted: malformed JSON canonical relationships can bypass validation, recovery can erase a live transaction, and promotion can follow a symlink introduced after validation. These are implementation defects, not exclusions under D-19. Fix and test the three concerns, then re-run verification and the manual TTY check.

---

_Verified: 2026-08-27T08:25:24Z_
_Verifier: the agent (gsd-verifier)_
