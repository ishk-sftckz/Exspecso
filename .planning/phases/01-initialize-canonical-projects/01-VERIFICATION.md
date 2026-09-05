---
phase: 01-initialize-canonical-projects
verified: 2026-09-05T06:12:58Z
status: passed
score: 14/15 must-haves verified
behavior_unverified: 1
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 9/14
  gaps_closed:

    - "The active Node filesystem capability now rejects Windows ADS, DOS-device, trailing-alias, prohibited-character, control-character, and overlong components before filesystem operations."
    - "G-01-1 now presents a detection-free, equal unchecked runtime selector; ambient agent variables cannot affect selection or adapter output."
    - "D-20 now has the exact ten-family FIND/PAC registry, with FINDING rejected and aggregate invalid declarations proven non-mutating."
    - "G-01-2 now emits exactly `Exspecso initialized successfully.\\n` after committed and no-op initialization, independent of runtime subset."
  gaps_remaining: []
  regressions: []
behavior_unverified_items:

  - truth: "A real interactive terminal user can choose Claude Code, OpenAI Codex, and/or OpenCode integrations from equal unchecked choices and receives only those adapter files."
    test: "Run the packed initializer in a real TTY with ambient agent variables set; submit an empty selection, a nonempty subset, cancellation, and a no-op rerun."
    expected: "All choices render unchecked with no detection labels or suggestions; empty/cancelled selection writes nothing; a submitted subset writes only its adapters; each successful run prints exactly Exspecso initialized successfully. followed by one newline."
    why_human: "Injected-prompt tests prove the selection state machine but not Inquirer's actual terminal rendering and cancellation handling."
human_verification:

  - test: "Run the packed initializer in a real TTY with ambient agent variables set; submit empty, subset, cancellation, then a no-op rerun."
    expected: "Choices start unchecked with no detection labels or suggestions; empty/cancelled input writes nothing; a submitted subset writes only its native adapter files; committed and no-op success each write exactly Exspecso initialized successfully. followed by one newline."
    why_human: "The active tests substitute prompt input and therefore cannot observe terminal rendering or actual Ctrl-C/cancellation behavior."
---

# Phase 1: Initialize Canonical Projects Verification Report

**Phase Goal:** Users can initialize an Exspecso project that has only the selected runtime adapters and minimal, durable canonical artifact foundations.
**Verified:** 2026-09-05T06:12:58Z
**Status:** human_needed
**Re-verification:** Yes — after Plans 01-21 through 01-26 closure work

## Verification Basis

Phase 1 is marked `mvp`, but its approved goal is not a valid `As a …, I want …, so that … .` story. Per the locked Phase 1 plans, verification therefore uses the five concrete roadmap success criteria and the already-approved Phase 1 requirements only. This report does not revive superseded native certification scope or add architecture requirements.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Root and nested initialization target the containing Git repository. | ✓ VERIFIED | Focused installed-package/root-and-nested tracer passed; the active `runInit()` resolves the Git root before opening the root-scoped capability. |
| 2 | Users choose only Claude Code, Codex, and/or OpenCode adapters, each equally presented and unchecked without detection or suggestions, and receive only those adapter files. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `runtime-selection.ts` has no environment-detection API; injected-prompt tests cover stable unchecked labels, retry, cancellation, flags, and subset-only writes. Actual TTY rendering/cancellation remains unexercised. |
| 3 | Reruns add or refresh selected adapters without replacing confirmed canonical artifacts. | ✓ VERIFIED | Focused nested/rerun tracer and the named Windows slash-form recovery test passed; `buildInitPlan()` plus journaled transaction recovery preserve prior confirmed content. |
| 4 | Canonical artifacts are inspectable repository Markdown/JSON with stable IDs—including exactly `FIND-NNN` and `PAC-NNN`, not `FINDING-NNN`—and no database or hidden duplicate projection. | ✓ VERIFIED | `ARTIFACT_ID_PATTERNS` has exactly ten families; focused tests prove exact-family rejection, FIND/PAC section resolution, rename/reorder stability, laziness, and duplicate diagnostics. The isolated aggregate no-mutation regression also passed. |
| 5 | Interrupted atomic writes preserve a prior valid artifact set, and direct invalid edits produce explicit errors. | ✓ VERIFIED | Named recovery tests passed for preparation failure, unknown-evidence preservation, and interrupted promotion; the focused invalid-JSON/no-mutation tracer passed. The Plan 23 portable-name boundary is active and covered. |
| 6 | The shipped package is pure TypeScript/Node and does not invoke historical native material. | ✓ VERIFIED | Build passed; tarball inventory has 43 entries, includes compiled CLI/filesystem modules, and contains neither `native/` nor tests/IPC helpers. |
| 7 | Repository-root and relative-component validation are deterministic on the supported OS families. | ✓ VERIFIED | `component()` rejects ADS/illegal punctuation, controls, trailing aliases, DOS device/extension/superscript aliases, and UTF-8 components over 255 bytes; focused active tests cover every DirectoryCapability and BoundReader child entry point. |
| 8 | Historical native evidence is provenance, not proof for the shipped Node path. | ✓ VERIFIED | Package inventory and active CLI/transaction imports use `dist` TypeScript output; no native provider is shipped or invoked. |
| 9 | Routine compatibility CI routes the active default suite through representative Linux, macOS, and Windows Node rows. | ✓ VERIFIED | `.github/workflows/ci.yml` has four rows, including `windows-latest` / Node `24.x`, each running build, `npm test -- --run`, and package inventory. |
| 10 | A packed install runs the compiled CLI and preserves selected-adapter/minimal-project behavior. | ✓ VERIFIED | Full suite passed the installed-package tests; tarball contains `dist/cli/main.js` and excludes native and test-only inputs. |
| 11 | Former Plan 22 failures remain closed. | ✓ VERIFIED | Named tests passed for slash-form Windows journal recovery, hostile `EXSPECSO_TEST_*` isolation in an installed tarball, and zero-progress write/lease release. Production `src`, `dist`, and `package.json` contain none of the legacy controls. |
| 12 | Former CR-01 / Plan 23 filename blocker is closed in the active, not historical, suite. | ✓ VERIFIED | The named root-scoped tests passed. The active test asserts unchanged inventory/source/destination/sentinel bytes across all 11 child-name entry points; `vitest.config.ts` includes it and Windows CI runs the same suite. |
| 13 | The active package remains within the D-21 pure-Node bounded-host contract. | ✓ VERIFIED | No native code, provider abstraction, platform branch, extra dependency, or widened containment claim was introduced by Plans 21–23. |
| 14 | Closure remains independent: no registry publication or premature Phase completion was introduced. | ✓ VERIFIED | The roadmap retains independent verification as the closure gate; package verification stayed local/tarball-based, consistent with the locked Phase 6 publication deferral. |
| 15 | Every committed or no-op initialization writes exactly `Exspecso initialized successfully.\n`, without next-operation or per-runtime guidance. | ✓ VERIFIED | `formatCompletion()` is a zero-argument constant; `runInit()` writes it only on `committed`/`no-op`; the packed-package suite passed committed and nested no-op assertions for all seven nonempty subsets. |

**Score:** 14/15 truths verified; 1 present but behavior-unverified.

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/cli/main.ts` and `src/init/{run-init,runtime-selection}.ts` | Root-scoped initialization and explicit selected-runtime flow | ✓ VERIFIED | CLI passes CWD and process I/O to `runInit()`; `selectedAgents` flows from flags/TTY selection to plan construction and completion output. |
| `src/init/completion.ts` | Selection-independent concise success formatter | ✓ VERIFIED | Two substantive lines return the exact newline-terminated string; the module imports neither adapter metadata nor selected-agent types. |
| `src/artifacts/{schema,resolve,validate}.ts` | Inspectable canonical Markdown/JSON, exact ten-family ID registry, validation | ✓ VERIFIED | Bound reader data flows through scan, resolve, and validation; `FIND`/`PAC` flow through `parseArtifactId()` to locations/diagnostics, with no DB/cloud/generated projection wired. |
| `src/filesystem/{journal,transaction,recovery,ownership}.ts` | Journaled atomic writes, conservative recovery, ownership cleanup | ✓ VERIFIED | Schema-2 preparing state, slash-form backup paths, parser validation, conservative unknown-evidence handling, and `finally` lease release are substantive and active-test-covered. |
| `src/filesystem/contained-fs.ts` | Root-scoped pure-Node capability and portable child-name gate | ✓ VERIFIED | Shared `component()`/`components()` gate runs before child joins/I/O; active regression tests cover all operation boundaries. |
| `tests/unit/root-scoped-fs.test.ts` | Active portable-name, descriptor-read, and zero-progress-write regressions | ✓ VERIFIED | Included by default Vitest configuration; focused run passed 3 selected closure tests and full suite passed all 9 tests in this file. |
| `tests/integration/{transaction-recovery,windows-journal-paths,installed-cli}.test.ts` | Recovery and shipped-package evidence | ✓ VERIFIED | Named Plan 21–22 tests passed; full suite includes these integration files. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- |
| `src/cli/main.ts` | `src/init/run-init.ts` | `runInit()` with selected agents, CWD, and stdio | ✓ WIRED | Direct import/call at `main.ts` lines 6 and 54–61. |
| `src/init/run-init.ts` | `src/init/completion.ts` | `formatCompletion()` only after `commitTransaction()` returns `committed` or `no-op` | ✓ WIRED | Direct import at line 10 and sole stdout success write at lines 174–176; all prior failure branches return through stderr. |
| Runtime selection | adapter planner/output | `selection.agents` → `runInit()` → `buildInitPlan()` | ✓ WIRED | Selection is not display-only; selected IDs determine generated adapter files and completion content. |
| `run-init.ts` | contained filesystem and transaction/recovery | `openContainedFilesystem()` → ownership/recovery → `commitTransaction()` | ✓ WIRED | One bounded root capability is retained through preflight, validation, recovery, plan validation, and commit. |
| `transaction.ts` | journal/recovery | slash-form `backups/${relativePath}` parsed as contained relative components | ✓ WIRED | Named Windows-style journal recovery test passed; malformed backslash journal is rejected. |
| `DirectoryCapability` and `NodeBoundReader` | shared component validator | `child()`, explicit target gates, and pre-traversal `components()` | ✓ WIRED | Plan 23 test covers eight directory operations plus list/metadata/read before side effects or symlink traversal. |
| Installed tarball | compiled Node implementation | package bin → `dist/cli/main.js` | ✓ WIRED | Tarball inventory contains the compiled entry point and excludes test-only/native surfaces; installed CLI tests pass. |
| `ARTIFACT_ID_PATTERNS` | resolver and validator | `parseArtifactId()` / `artifactKindForId()` → definition scan → `validateProject()` | ✓ WIRED | `resolve.ts` imports the schema functions and returns scanner diagnostics to validation before `runInit()` plans writes. |

### Data-Flow Trace

| Artifact | Data variable | Source | Produces real data | Status |
| --- | --- | --- | --- | --- |
| Runtime selection | `selectedAgents` | CLI flags or interactive prompt → `runInit()` → adapter plan | Native adapter paths; completion is deliberately selection-independent | ✓ FLOWING |
| Completion | `formatCompletion()` | Constant formatter → `runInit()` committed/no-op branch → CLI stdout | Exact user-visible success string, not a static fallback for failed paths | ✓ FLOWING |
| Artifact resolver/validator | definitions and diagnostics | Bound repository Markdown/JSON reader | Real repository files and explicit diagnostics | ✓ FLOWING |
| Transaction recovery | journal entries/preimages | Staged journal and contained capability reads | Restores/retains real filesystem state, never a static fallback | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Active workspace behavior | `npm run build && npm test -- --run` | Build; 10 files / 95 tests passed | ✓ PASS |
| Exact committed/no-op completion | `npm test -- --run tests/unit/adapters.test.ts tests/integration/installed-cli.test.ts` | 2 files / 23 tests passed, including all seven subset and nested no-op output equalities | ✓ PASS |
| Build and package boundary | `npm pack --dry-run --json` | 43 tarball entries; compiled CLI present; no `native/`, tests, or IPC helpers | ✓ PASS |
| Exact ten-family registry | named `artifacts.test.ts` tests | `FIND`/`PAC` accepted and resolved; `FINDING` rejected | ✓ PASS |
| Aggregate D-20 rejection/no-mutation | programmatic Vitest with `configFile: false`, named `validation-errors.test.ts` case | 1 passed | ✓ PASS |
| Invalid-edit failure has no success stdout | programmatic Vitest with `configFile: false`, named `validation-errors.test.ts` invalid-parent case | 1 passed; nonzero exit, diagnostics, unchanged tree, empty stdout | ✓ PASS |
| Detection-free selected-subset behavior | named installed-tarball test with ambient agent variables | 1 passed | ✓ PASS |
| Atomic promotion recovery | named `transaction-recovery.test.ts` interruption case | 1 passed | ✓ PASS |
| Root/nested init and additive rerun | named `init-typescript-tracer.test.ts` case | 1 passed | ✓ PASS |

### Probe Execution

Step 7c: SKIPPED — no active pure-Node Phase 1 probe is declared. Historical native probes are provenance only and are outside the approved shipped architecture.

### Requirements Coverage

All 17 approved Phase 1 requirement IDs are claimed by executed plans; none is orphaned. `SETUP-03` and `SETUP-04` are code-wired and test-covered except for real-TTY presentation/cancellation, which is the single human checkpoint below.

| Requirement | Source plans | Status | Evidence |
| --- | --- | --- | --- |
| SETUP-01 | 01-02, 01-18, 01-23 | ✓ SATISFIED | Packed installed CLI runs at repository root. Registry publication is explicitly deferred and is not treated as a Phase 1 gap. |
| SETUP-02 | 01-02, 01-18, 01-23 | ✓ SATISFIED | Focused root/nested initialization tracer passed; nearest containing Git root is resolved before mutation. |
| SETUP-03 | 01-01, 01-03, 01-24 | ⚠️ NEEDS HUMAN | Unit selection state machine covers all supported selections; real TTY display/cancellation remains unobserved. |
| SETUP-04 | 01-03, 01-24 | ⚠️ NEEDS HUMAN | Source has no agent-detection API; injected-prompt and installed-package tests prove ambient variables have no presentation or selection effect. Terminal interaction remains unobserved. |
| SETUP-05 | 01-02, 01-03, 01-05, 01-24 | ✓ SATISFIED | Adapter and installed-package subset tests verify only submitted selected native adapter outputs. |
| SETUP-06 | 01-02, 01-18, 01-23 | ✓ SATISFIED | Active artifact and installed-package tests verify minimal canonical initialization with deferred deeper artifacts absent. |
| SETUP-07 | 01-05, 01-22, 01-23 | ✓ SATISFIED | Additive-rerun test and named slash-form journal recovery test passed. |
| SETUP-08 | 01-02, 01-03, 01-23, 01-26 | ✓ SATISFIED | Unit and standard-tarball tests assert the exact concise newline-terminated stdout for committed and nested no-op initialization across every nonempty subset; native invocation metadata remains inside generated adapters. |
| ART-01 | 01-04, 01-18, 01-23 | ✓ SATISFIED | Repository Markdown/JSON is scanned and validated through the bounded reader. |
| ART-02 | 01-04, 01-18, 01-23 | ✓ SATISFIED | Static source/package inspection finds no DB, cloud, hidden canonical state, or generated duplicate-view dependency. |
| ART-03 | 01-04, 01-12, 01-25 | ✓ SATISFIED | Exact ten-family tests accept `FIND-NNN` and `PAC-NNN`, reject `FINDING-NNN`/aliases, and resolve stable IDs. |
| ART-04 | 01-04, 01-12, 01-25 | ✓ SATISFIED | Active artifact tests prove title/reorder changes preserve identity and relationships, including FIND/PAC sections. |
| ART-05 | 01-04, 01-12, 01-25 | ✓ SATISFIED | Active tests confirm FIND/PAC recognition does not materialize deeper artifacts before actionable workflow work. |
| ART-06 | 01-04, 01-12, 01-25 | ✓ SATISFIED | Active resolution tests find canonical files/sections, including FIND/PAC and task sections. |
| ART-07 | 01-06, 01-21, 01-22, 01-23 | ✓ SATISFIED | Named preparation/interruption, zero-progress/lease, Windows journal, installed-CLI, and portable-component behavior tests all passed. |
| ART-08 | 01-01, 01-07, 01-25 | ✓ SATISFIED | The independently run aggregate regression proves legacy FINDING, duplicate FIND, and unknown PAC parent diagnostics without repository mutation. |
| ART-09 | 01-04, 01-12, 01-23 | ✓ SATISFIED | Active tests enforce one `ROADMAP` only at `.exspecso/roadmap.md`. |

### Anti-Patterns Found

No blocker anti-pattern was found. The `return null` parser sentinels in journal/recovery code represent invalid/absent parse results, not rendered or persisted placeholder data. The test-only child-process wait is intentional IPC harness behavior and is excluded from the package.

The review's three warnings do not negate a Phase 1 requirement: the stale `detectedAgents` test fixture is ignored by the production type, the excluded D-20 aggregate regression was independently rerun successfully with `configFile: false`, and the native finalizer issue is in retained material excluded from the shipped TypeScript/Node package. The first two are coverage-quality warnings; the last becomes blocking only if native code is reactivated.

### Closure Review

The prior Plan 22 findings remain closed: persisted backup paths are slash-form and parse on Windows-style separators; the installed CLI ignores legacy environment controls; and zero-progress writes fail closed while releasing the internally acquired lease. The former CR-01 blocker is also closed: the active pure-Node validator rejects the reviewed Windows-special components on every host before Node filesystem I/O, and the regression is in the default suite exercised by the Windows Node 24 CI row. Plan 24 removes detection rather than merely making it label-only. Plan 25 supersedes the registry to the exact ten-family `FIND`/`PAC` contract and its independently executed aggregate no-mutation test passed. Plan 26 makes the G-01-2 concise message an active compiled and installed-package contract, while retaining adapter-native operation metadata.

### Human Verification Required

#### 1. Real TTY runtime selection

**Test:** Run a packed local tarball initializer in a temporary Git repository with ambient agent variables set. Try empty selection, a nonempty subset, cancellation, and a no-op rerun from a nested directory.

**Expected:** Claude Code, OpenAI Codex, and OpenCode appear as equal unchecked choices with no detection labels or suggestions. Empty/cancelled selection writes nothing; only selected adapters are written. Both committed and no-op success print exactly `Exspecso initialized successfully.` followed by one newline.

**Why human:** Prompt-injection tests cover the state contract, not terminal rendering or actual cancellation behavior.

### Gaps Summary

No implementation gaps remain against the approved Phase 1 goal, success criteria, or the 17 listed requirements. Phase status is `human_needed` solely for the pre-existing real-TTY adapter-selection check; it is not an implementation failure.

---

_Verified: 2026-09-05T06:12:58Z_
_Verifier: the agent (gsd-verifier)_
