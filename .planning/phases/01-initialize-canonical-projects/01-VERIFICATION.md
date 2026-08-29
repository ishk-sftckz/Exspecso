---
phase: 01-initialize-canonical-projects
verified: 2026-08-29T09:16:34Z
status: gaps_found
score: 10/14 must-haves verified
behavior_unverified: 1
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 44/74
  gaps_closed:
    - "The superseded native-provider, support-row, prebuilt, and evidence-aggregation obligations are no longer active under D-21; the shipped tarball excludes them."
  gaps_remaining:
    - "The required interruption/recovery guarantee is still not achieved in the replacement Node transaction path."
  regressions:
    - "A crash before the first transaction journal write leaves unrecoverable staging evidence that permanently blocks later init."
    - "A concurrent file truncation can make the Node FileCapability read loop spin indefinitely."
    - "README still documents registry npx usage although this private package is absent from npm."
gaps:
  - truth: "An interrupted atomic write preserves the previous valid artifact set."
    status: failed
    reason: "The Node transaction creates and fills a staging directory and creates destination parents before its first journal write. A crash or error in that interval leaves a nonempty stage without journal.json; recovery returns ambiguous forever rather than restoring or safely cleaning the prior state."
    artifacts:
      - path: "src/filesystem/transaction.ts"
        issue: "Lines 216-250 perform staging and destination-parent mutation before updateJournal()."
      - path: "src/filesystem/recovery.ts"
        issue: "Lines 150-152 turn a stage with no journal into permanent 'transaction journal is unreadable' ambiguity."
    missing:
      - "Persist and test a recoverable preparation record before any staged or destination-side mutation."
      - "Make recovery safely remove only identified pre-journal staging evidence when promotion was impossible."
  - truth: "Repository-root scoping, component validation, stable symlink rejection, expected-preimage checks, journaled atomic promotion, process-interruption recovery, and conservative ambiguity handling remain executable and tested."
    status: failed
    reason: "FileCapability.read() trusts the initial fstat length and loops until that length is filled. If a file is truncated during the read, readSync() returns zero and offset never advances, so the initializer can hang instead of failing closed. No active test exercises this error path."
    artifacts:
      - path: "src/filesystem/contained-fs.ts"
        issue: "Lines 141-145 have no zero-byte-read or final identity/size check."
    missing:
      - "Reject a zero-byte read before the initially observed length is consumed and revalidate final descriptor identity/size."
      - "Add a deterministic truncation-during-read test."
deferred:
  - truth: "A user can run `npx exspecso init` from a registry-installed package."
    addressed_in: "Phase 6"
    evidence: "Phase 6 success criterion 5 requires one documented npm package; Phase 1 Plan 18 explicitly forbids publication/release."
behavior_unverified_items:
  - truth: "A real interactive terminal user can choose detected Claude Code, OpenAI Codex, and/or OpenCode integrations and receives only those adapter files."
    test: "Run the packed initializer in a TTY with a detected-runtime signal; submit empty once, choose a nonempty subset once, and cancel once."
    expected: "All choices initially render unchecked; detection only changes labels; empty/cancelled selection writes nothing; a submitted subset writes only its adapters."
    why_human: "The active test injects a prompt function and proves the data contract, but does not exercise Inquirer's real terminal rendering or cancellation behavior."
---

# Phase 1: Initialize Canonical Projects Verification Report

**Phase Goal:** Users can initialize an Exspecso project that has only the selected runtime adapters and minimal, durable canonical artifact foundations.
**Verified:** 2026-08-29T09:16:34Z
**Status:** gaps_found
**Re-verification:** Yes — after D-21/D-22 TypeScript/Node cutover

## MVP Mode Guard

Phase 1 is marked `mvp`, but its goal is not a valid `As a …, I want …, so that … .` user story (`user-story.validate` returned `false`). This report therefore evaluates the concrete roadmap success criteria plus revised Plans 01-17/01-18 must-haves. It does not assert a formal MVP user-flow verdict.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | A user can run `npx exspecso init` from a root or nested directory. | ✗ FAILED — deferred | `package.json` is `private: true`; `npm view exspecso@0.1.0` returned E404, while README line 14 advertises the registry command. Local-tarball root/nested behavior is proven, but it is not the specified public `npx` path. Phase 6 explicitly owns a documented npm package. |
| 2 | A user can choose detected Claude/Codex/OpenCode integrations and receive only selected adapter files. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Flags and the injected prompt contract pass; `runtime-selection.test.ts` proves detection is label-only and `installed-cli.test.ts` proves all seven nonempty subsets. Real TTY presentation remains unexercised. |
| 3 | Rerun adds/refreshes adapters without replacing confirmed canonical artifacts. | ✓ VERIFIED | The installed-tarball test preserves project identity and unselected Codex adapter bytes while adding Claude; active full suite passes. |
| 4 | Canonical artifacts use stable IDs in ordinary Markdown/JSON with no hidden duplicate projection. | ✓ VERIFIED | `artifacts.test.ts` covers exact ID families, reserved ROADMAP path, rename stability, duplicate failure, TASK section resolution, and lazy artifacts; package contains no database or generated projection. |
| 5 | Interrupted atomic writes preserve the prior valid set, and invalid direct edits produce explicit errors. | ✗ FAILED — BLOCKER | Invalid JSON diagnostics/no-mutation are covered, but the transaction has an unrecoverable pre-journal crash window and a concurrent truncation can hang reads. |
| 6 | The active initializer is pure TypeScript/Node with no native provider, support lookup, compiler/header prerequisite, prebuilt selection, or lifecycle hook. | ✓ VERIFIED | `package.json` has only build/test scripts; active source imports the Node facade; `npm pack --dry-run --json` produced 43 files with no native, scripts, tests, `dist/native`, or support-matrix output. |
| 7 | Security reporting correctly limits the boundary to Claude/Codex/OpenCode host permissions and sandboxes. | ✓ VERIFIED | README lines 24-35 explicitly disclaims kernel-level, race-proof, hostile-same-user, universal-filesystem, and power-loss guarantees. |
| 8 | Plans 01-19/01-20 remain historical rather than proof of the shipped TypeScript path. | ✓ VERIFIED | Plans/summaries remain present; Plan 17 and README lines 61-68 explicitly label their native material and evidence superseded/non-shipped. |
| 9 | Retained native material is non-shipped and non-invoked. | ✓ VERIFIED | The three containment workflows have `on: {}`; Vitest excludes six native suites; the active CI workflow has no native reference; package allow-list excludes historical surfaces. |
| 10 | Routine CI is the four-row D-22 representative matrix. | ✓ VERIFIED | `ci.yml` has exactly Ubuntu/22.13.0 and Ubuntu/macOS/Windows/24.x rows, each running `npm ci`, build, full tests, and pack inventory. |
| 11 | Standard tarball installation runs the compiled initializer without native inputs. | ✓ VERIFIED | `packAndInstall()` builds, dry-runs, packs, installs outside the checkout with `--ignore-scripts`, reads the declared bin, and invokes it; its three installed-package tests passed in the full run. |
| 12 | Installed CLI preserves all seven selected subsets, root/nested targeting, rerun, canonical-first completion, and minimal tree. | ✓ VERIFIED | `installed-cli.test.ts` exercises all seven subsets and root/nested reruns; it checks completion, selected config, minimal artifacts, identity, and additive behavior. |
| 13 | README support/safety claims match measured behavior. | ✗ FAILED — BLOCKER | README promises `npx exspecso init`, but the package is private and unavailable from npm; it also presents journaled recovery as a usable feature despite the pre-journal unrecoverable state. |
| 14 | Closure hands the phase to independent verification without publishing, releasing, or marking it complete. | ✓ VERIFIED | `package.json` remains private, README says no Phase 1 release, and ROADMAP still marks Phase 1 in progress. |

**Score:** 10/14 truths verified; 1 present but behavior-unverified.

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/filesystem/contained-fs.ts` | Pure Node capability facade | ⚠️ SUBSTANTIVE, BLOCKED | Exists (327 lines), exports all declared capability symbols, and is wired into production consumers. Its read loop has the truncation hang above. The automated artifact query falsely reported its bracketed export list missing; source exports confirm them. |
| `tests/unit/root-scoped-fs.test.ts` | Root/traversal/symlink coverage | ✓ VERIFIED | Active 2-test suite exercises validated components and stable symlink rejection. |
| `tests/integration/init-typescript-tracer.test.ts` | Pure-Node root/nested and rerun tracer | ✓ VERIFIED | Active compiled-CLI tracer covers root/nested routing, additive rerun, JSON diagnostics/no mutation, and workflow entry-point scan. |
| `package.json` | Native-free package allow-list | ✓ VERIFIED | Explicit `files` allow-list includes the CLI/required declarations and excludes native/support artifacts; no lifecycle/native script exists. |
| `.github/workflows/ci.yml` | Four-row representative CI | ✓ VERIFIED | Substantive four-row read-only workflow; no native job or command. |
| `tests/helpers/package-fixture.ts` | Pack/install/declared-bin helper | ✓ VERIFIED | `packAndInstall()` and `runInstalledCli()` are exported and used. The automated artifact query misses `async function` export syntax, but source and consuming test prove it. |
| `tests/integration/installed-cli.test.ts` | Installed package behavior | ✓ VERIFIED | Three substantive tests use a packed, isolated installation rather than checkout imports. |
| `README.md` | Accurate package and safety contract | ⚠️ PARTIAL | Honest host-boundary language is present, but registry `npx` instructions cannot work before publication and recovery availability is overstated. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- |
| `src/init/run-init.ts` | `src/filesystem/contained-fs.ts` | `openContainedFilesystem()` | ✓ WIRED | Direct import at line 6 and invocation at line 73. |
| `src/filesystem/transaction.ts` / recovery | Node capability facade | `DirectoryCapability` / `RootCapability` | ✓ WIRED | Transaction and recovery operate through capability objects; the pre-journal ordering still breaks recovery. |
| `package.json` | `dist/cli/main.js` | declared `bin` and package allow-list | ✓ WIRED | `bin.exspecso` points to the emitted CLI, and the dry-run candidate includes it. |
| `ci.yml` | `package.json` | Node 22/24 matrix and lockfile commands | ✓ WIRED | Each row invokes `npm ci`, build, test, and pack. |
| `installed-cli.test.ts` | `package-fixture.ts` | `packAndInstall` / `runInstalledCli` | ✓ WIRED | Direct imports and executions at lines 4, 53, 80, and 89. |
| `package-fixture.ts` | declared compiled bin | package `bin` → `cliPath` → `process.execPath` | ✓ WIRED | The helper deliberately reads `package.json` dynamically instead of containing a `dist/cli/main.js` literal; the named test executes that resolved path. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| Adapter plan | `selectedAgents` | repeatable flags or Inquirer prompt → registry | Selected IDs determine actual written adapter paths | ✓ FLOWING |
| Canonical validation | scanned definitions/diagnostics | bound reader over repository Markdown/JSON | Diagnostics reach `runInit()` before transaction mutation | ✓ FLOWING |
| Installed CLI | `packageJson.bin` → `cliPath` | packed tarball's own `package.json` | Resolved path is actually executed outside checkout | ✓ FLOWING |
| Transaction recovery | stage/journal state | staging directory and `journal.json` | ✗ DISCONNECTED at the pre-journal boundary: stage exists with no recoverable state | ✗ FAILED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Build and full active suite | `npm run build && npm test -- --run` | 9 files, 79 tests passed | ✓ PASS |
| Published `npx` availability | `npm view exspecso@0.1.0` | npm E404; package absent/unavailable | ✗ FAIL |
| Native-free package candidate | `npm pack --dry-run --json` plus allow-list assertion | 43 entries; no native/scripts/tests/support-matrix output, CLI present | ✓ PASS |

### Probe Execution

Step 7c: SKIPPED — no declared or conventional `scripts/**/tests/probe-*.sh` probe applies to the revised TypeScript/Node closure.

### Requirements Coverage

| Requirement | Source Plans | Status | Evidence |
| --- | --- | --- | --- |
| SETUP-01 | 02, 09-12, 16-20 | ✗ BLOCKED (deferred Phase 6) | Root functionality works from local tarball, but required registry `npx exspecso init` is unavailable now. |
| SETUP-02 | 02, 09-12, 16-20 | ✓ SATISFIED | Installed test runs a nested-directory invocation against the containing Git root. |
| SETUP-03 | 01, 03, 09, 17, 18, 20 | ? NEEDS HUMAN | Flags/all subsets pass; real interactive terminal behavior is not exercised. |
| SETUP-04 | 03, 17, 18, 20 | ? NEEDS HUMAN | Injected prompt proves detected entries are unchecked labels, but not terminal presentation. |
| SETUP-05 | 02, 03, 05, 17, 18, 20 | ✓ SATISFIED | All seven installed subsets write only corresponding adapters. |
| SETUP-06 | 02, 03, 05, 17, 18, 20 | ✓ SATISFIED | Installed and artifact tests prove only config, constitution, and selected adapters are materialized. |
| SETUP-07 | 05, 12-14, 17-20 | ✓ SATISFIED | Installed additive-rerun test preserves identity and unselected adapter bytes. |
| SETUP-08 | 02, 03, 17, 18, 20 | ✓ SATISFIED | Installed test checks `/exspecso-start` first and runtime-native invocation text. |
| ART-01 | 02, 04, 06, 08, 10, 12-20 | ✓ SATISFIED | Canonical files are ordinary package-created Markdown/JSON in the repository. |
| ART-02 | 02, 04, 06, 09, 13, 15-20 | ✓ SATISFIED | No DB/cloud service or packaged duplicate projection is wired; source and package scans agree. |
| ART-03 | 04, 07, 12, 20 | ✓ SATISFIED | Active artifact tests cover all exact stable-ID families and diagnostics. |
| ART-04 | 04, 12, 20 | ✓ SATISFIED | Active resolver test proves title changes/declaration reordering retain identity. |
| ART-05 | 04, 12, 20 | ✓ SATISFIED | Active lazy-artifact test proves unresolved deeper artifacts are not materialized. |
| ART-06 | 04, 07, 12, 20 | ✓ SATISFIED | Active tests resolve ROADMAP and per-section TASK IDs. |
| ART-07 | 06, 08-11, 13-20 | ✗ BLOCKED | Pre-journal crashes permanently block recovery; concurrent truncation can hang a protected read. |
| ART-08 | 01, 04, 06-9, 12-15, 17-20 | ✓ SATISFIED | Invalid declaration diagnostics and no-mutation behavior run in the active suite. |
| ART-09 | 04, 06, 08, 12-15, 17-20 | ✓ SATISFIED | Reserved, lazy `.exspecso/roadmap.md` behavior is covered by active artifacts tests. |

All 17 Phase 1 requirement IDs are declared by one or more plan. None is orphaned.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- |
| `src/filesystem/transaction.ts` | 216-250 | Mutates stage/destination-parent state before durable journal | 🛑 BLOCKER | Crash creates permanent ambiguous recovery evidence. |
| `src/filesystem/recovery.ts` | 150-152 | No-journal stage treated as indefinitely unreadable | 🛑 BLOCKER | Cannot repair the reachable pre-journal failure state. |
| `src/filesystem/contained-fs.ts` | 141-145 | Read loop ignores zero-byte reads | 🛑 BLOCKER | Concurrent truncation can spin the CLI forever. |
| `README.md` | 14, 70 | Public `npx` command conflicts with private/unpublished package | ⚠️ WARNING | Current user cannot follow documented installation command; Phase 6 explicitly owns published package delivery. |
| `dist/native/**`, `dist/filesystem/support-matrix.*` | local ignored output | Stale historical build output remains after `npm run build` | ℹ️ INFO | It is not invoked or packed by the explicit allow-list, but a clean build does not remove it. |

No unreferenced `TBD`, `FIXME`, or `XXX` marker was found in the revised implementation files.

### Human Verification After Gap Closure

1. **Real TTY runtime selection**

   **Test:** Run a packed/local tarball initializer in a temporary Git repository with a detected-runtime signal. Try empty selection, a subset, and cancellation.

   **Expected:** Choices start unchecked; detection affects only labels; no write happens for empty/cancelled selections; only selected adapters are written.

   **Why human:** Injected prompt tests prove logic but not terminal rendering/cancellation.

### Gaps Summary

The D-21/D-22 cutover is genuinely wired: the active build, tarball, installed CLI, CI matrix, adapter subsets, stable-artifact handling, and historical-native isolation have direct evidence. The phase goal nevertheless is not achieved. The current Node transaction can leave an unrecoverable pre-journal stage, and an adversarial concurrent truncate can hang a file read; both invalidate ART-07's required interruption/recovery guarantee. The README's registry `npx` instruction is not currently deliverable; that packaging availability is clearly scheduled for Phase 6 and is recorded as deferred, not as a closure plan for these safety blockers.

---

_Verified: 2026-08-29T09:16:34Z_
_Verifier: the agent (gsd-verifier)_
