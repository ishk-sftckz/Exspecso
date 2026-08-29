---
phase: 01-initialize-canonical-projects
verified: 2026-08-29T13:05:34Z
status: gaps_found
score: 7/14 must-haves verified
behavior_unverified: 1
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 10/14
  gaps_closed:
    - "The pre-journal crash window is closed: a schema-2 preparing journal is written before staged bytes or destination-parent mutation, and active recovery tests pass."
    - "The descriptor-read hang is closed: zero progress and changed final descriptor state fail closed in active unit tests."
  gaps_remaining:
    - "Windows additive initialization creates an invalid backslash-form journal backup path and cannot recover it."
    - "The published CLI exposes environment-controlled test hooks that write outside the repository and can wait indefinitely."
  regressions:
    - "The independent review found the Windows journal-path and packaged test-hook defects after Plan 21."
gaps:
  - truth: "A user can rerun initialization to add or refresh adapters without replacing confirmed canonical project artifacts."
    status: failed
    reason: "On Windows, transaction.ts serializes a preimage backup path with path.join(), producing backslashes. The parser rejects that path and recovery cannot clean the transaction."
    artifacts:
      - path: "src/filesystem/transaction.ts"
        issue: "Line 227 creates host-native journal data with path.join()."
      - path: "src/filesystem/journal.ts"
        issue: "Line 50 correctly rejects backslashes, making the transaction's own Windows journal invalid."
    missing:
      - "Encode journal-relative backup paths with slash separators independently of the host OS."
      - "Add a Windows-path regression covering additive commit and recovery."
  - truth: "The initialized project keeps filesystem mutation and interruption controls inside the containing Git repository."
    status: failed
    reason: "Packaged production modules honor EXSPECSO_TEST_SYNC_FILE and EXSPECSO_TEST_OWNERSHIP_SYNC_FILE. A normal compiled CLI invocation wrote a signal to an arbitrary /tmp path outside its Git repository; matching wait variables can keep it alive forever."
    artifacts:
      - path: "src/filesystem/transaction.ts"
        issue: "Lines 163-177 use caller-controlled environment values with unbound writeFile and an unbounded wait."
      - path: "src/filesystem/ownership.ts"
        issue: "Lines 138-145 provide the same external-write and unbounded-wait behavior."
    missing:
      - "Remove environment-controlled fault/synchronization behavior from packaged production modules."
      - "Move child-process coordination to a test-only harness and add an installed-package negative regression."
deferred:
  - truth: "A user can run npx exspecso init from a registry-installed package."
    addressed_in: "Phase 6"
    evidence: "Phase 6 success criterion 5 requires one documented npm package; Phase 1 remains private and explicitly says it does not publish or release a package."
behavior_unverified_items:
  - truth: "A real interactive terminal user can choose detected Claude Code, OpenAI Codex, and/or OpenCode integrations and receives only those adapter files."
    test: "Run the packed initializer in a real TTY with detection enabled; submit an empty selection, a nonempty subset, and cancellation."
    expected: "All choices render unchecked; detection changes labels only; empty/cancelled selection writes nothing; a submitted subset writes only its adapters."
    why_human: "Injected prompt tests prove the selection contract but do not exercise Inquirer's terminal rendering or cancellation behavior."
---

# Phase 1: Initialize Canonical Projects Verification Report

**Phase Goal:** Users can initialize an Exspecso project that has only the selected runtime adapters and minimal, durable canonical artifact foundations.
**Verified:** 2026-08-29T13:05:34Z
**Status:** gaps_found
**Re-verification:** Yes — after Plan 01-21 gap closure

## MVP Mode Guard

Phase 1 is marked `mvp`, but its roadmap goal is not a valid `As a …, I want …, so that … .` user story (`user-story.validate` returned `false`). This report therefore verifies the concrete roadmap success criteria and active implementation rather than asserting a formal MVP user-flow verdict.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | A user can run `npx exspecso init` from a root or nested directory. | ✗ DEFERRED | Root/nested behavior is exercised from a local packed tarball, but `package.json` is private and Phase 1 does not publish. Phase 6 owns documented npm installation. |
| 2 | A user can choose detected Claude/Codex/OpenCode integrations and receive only selected adapter files. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Flags and all seven nonempty selections pass; `runtime-selection.test.ts` proves detection is label-only. Real TTY behavior is unexercised. |
| 3 | Rerun adds/refreshes adapters without replacing confirmed canonical artifacts. | ✗ FAILED — BLOCKER | Works on the host test platform but cannot work on Windows when a preimage needs a backup: the serialized `backupPath` is invalid and recovery cannot parse it. |
| 4 | Canonical artifacts use stable IDs in ordinary Markdown/JSON with no hidden duplicate projection. | ✓ VERIFIED | Active artifact tests cover exact ID families, reserved ROADMAP location, rename stability, duplicate diagnostics, TASK sections, and lazy artifacts. |
| 5 | Interrupted atomic writes preserve the prior valid set, and invalid direct edits produce explicit errors. | ✗ FAILED — BLOCKER | Plan 21 fixed the previous pre-journal/read defects, but a Windows invalid journal path leaves additive transaction recovery ambiguous. Invalid JSON diagnostics/no-mutation behavior passes. |
| 6 | The active initializer is pure TypeScript/Node with no native provider, support lookup, compiler/header prerequisite, prebuilt selection, or lifecycle hook. | ✓ VERIFIED | `package.json` has only build/test scripts and an explicit dist allow-list; build and the 43-entry pack inventory contain the Node path, not native artifacts. |
| 7 | Filesystem safety claims are limited to the stated repository-root and host-boundary contract. | ✗ FAILED — BLOCKER | The shipped CLI can write a caller-selected external path and wait indefinitely through `EXSPECSO_TEST_*` variables, bypassing repository containment. |
| 8 | Superseded native plans/evidence remain historical rather than proof of the shipped TypeScript path. | ✓ VERIFIED | README labels Plans 01-19/01-20 historical; active build, package, tests, and triggered CI use TypeScript. |
| 9 | Retained native material is non-shipped and non-invoked. | ✓ VERIFIED | Package allow-list excludes it; active workflow scan passes and retained workflows are disabled. |
| 10 | Routine CI is the four-row D-22 representative matrix. | ✓ VERIFIED | `ci.yml` declares Ubuntu/22.13.0 and Ubuntu/macOS/Windows/24.x, each with install, build, full test, and pack steps. |
| 11 | Standard tarball installation runs the compiled initializer without native inputs. | ✓ VERIFIED | The installed-package test packs, installs with lifecycle scripts disabled outside the checkout, resolves the declared bin, and executes it. |
| 12 | Installed CLI preserves adapter subsets, root/nested targeting, rerun, canonical-first completion, and a minimal tree. | ✗ FAILED — BLOCKER | Local evidence passes, but the supported Windows rerun path is broken by invalid journal serialization. |
| 13 | README support and safety claims match measured behavior. | ✗ FAILED | README presents a public `npx exspecso init` command despite no published package and omits the packaged external-write test hooks. Registry availability is deferred; the unsafe hook is not. |
| 14 | Closure hands the phase to independent verification without publishing, releasing, or marking it complete. | ✓ VERIFIED | Package is private, README says Phase 1 does not publish/release, and ROADMAP remains in progress. |

**Score:** 7/14 truths verified; 1 present but behavior-unverified.

### Deferred Items

| # | Item | Addressed In | Evidence |
| --- | --- | --- | --- |
| 1 | Registry-installed `npx exspecso init` | Phase 6 | Phase 6 SC 5: one documented npm package. |

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/init/run-init.ts` | Root-scoped initialization orchestrator | ✓ VERIFIED | Validates, acquires ownership, recovers, plans, and commits through the capability facade. |
| `src/init/runtime-selection.ts` | Selected-runtime choice contract | ✓ VERIFIED | Prompt/flag results drive selected adapter IDs; supported selection data is tested. |
| `src/artifacts/{schema,resolve,validate}.ts` | Durable canonical artifacts | ✓ VERIFIED | Active tests exercise IDs, direct validation, lazy materialization, and canonical locations. |
| `src/filesystem/{journal,transaction,recovery}.ts` | Journaled transaction/recovery | ⚠️ SUBSTANTIVE, BLOCKED | Plan 21 artifacts and recovery tests are real, but Windows `backupPath` serialization violates their parser contract. |
| `src/filesystem/contained-fs.ts` | Root-scoped descriptor capability | ⚠️ PARTIAL | Read guards are substantive/tested; `write()` line 168 lacks a zero-progress guard. |
| `src/filesystem/ownership.ts` | Repository-local lease | ✗ BLOCKED | Packaged environment hook writes caller-controlled external paths and can wait forever. |
| `tests/integration/{transaction-recovery,installed-cli}.test.ts` | Recovery/installed-package proof | ⚠️ PARTIAL | Substantive and passing, but no Windows serialization or installed-package hook-negative test. |
| `package.json` / `dist/cli/main.js` | Packaged compiled CLI | ⚠️ PARTIAL | Bin/allow-list are wired; packed filesystem modules retain unsafe hooks. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `src/init/run-init.ts` | `src/filesystem/contained-fs.ts` | `openContainedFilesystem()` | ✓ WIRED | Direct import/call; root capability supplies validation and transaction work. |
| `src/init/runtime-selection.ts` | adapter registry / init plan | selected agent IDs | ✓ WIRED | Selection drives adapter writes; all nonempty subsets are tested. |
| `src/filesystem/transaction.ts` | `src/filesystem/recovery.ts` | schema-2 `preparing` journal | ⚠️ PARTIAL | Mechanical key-link query passes and POSIX recovery passes; Windows journals violate the parser contract. |
| `package.json` | `dist/cli/main.js` | declared `bin` | ✓ WIRED | Installed-tarball helper resolves the declared bin and executes it. |
| `transaction.ts` / `ownership.ts` | external filesystem | `EXSPECSO_TEST_*` environment values | ✗ UNWANTED WIRING | Unbound `writeFile`/`rename` are included in `dist` and package inventory. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| Adapter plan | `selectedAgents` | flags or Inquirer prompt → registry → init plan | Selected IDs determine adapter paths | ✓ FLOWING |
| Canonical validation | definitions/diagnostics | bound repository Markdown/JSON reader → validation | Diagnostics reach `runInit()` before mutation | ✓ FLOWING |
| Transaction recovery | journal entries/preimages | stage journal → parser → recovery cleanup | Host path flows; Windows backup paths do not parse | ✗ DISCONNECTED ON WINDOWS |
| Fault signal | `EXSPECSO_TEST_*_SYNC_FILE` | caller environment → unbound `writeFile` / `rename` | Creates data outside the repository | ✗ UNSAFE EXTERNAL FLOW |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Plan 21 recovery/read fixes | focused transaction/recovery, root-FS, installed-CLI, tracer, selection tests | 5 files / 41 tests passed | ✓ PASS |
| Current active package behavior | `npm run build && npm test -- --run` | Build passed; 9 files / 86 tests passed | ✓ PASS |
| Native-free pack inventory | `npm pack --dry-run --json` | 43 entries; declared CLI and pure Node dist files present | ✓ PASS |
| Windows journal serialization | `path.win32.join` plus `parseTransactionJournal()` | `backups\\.exspecso\\exspecso.config.json` parsed as `journal entries are invalid` | ✗ FAIL |
| Production external write | compiled CLI with `EXSPECSO_TEST_SYNC_FILE` and matching promotion point | Normal `init --agent codex` exited 0 and wrote `/tmp/exspecso-verifier.YKvIAa/outside-signal.json` outside its Git repo | ✗ FAIL |

### Probe Execution

Step 7c: SKIPPED — no active Phase 1 probe is declared and no `scripts/**/tests/probe-*.sh` probe applies to the pure TypeScript/Node closure.

### Requirements Coverage

Every Phase 1 requirement ID is declared by at least one plan; Plan 01-20 declares all 17. No requirement is orphaned.

| Requirement | Source Plans | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| SETUP-01 | 02, 09–12, 16–20 | Root `npx` initialization | ⚠️ DEFERRED | Local packed-tarball root behavior passes; registry install is Phase 6. |
| SETUP-02 | 02, 09–12, 16–20 | Nested directory targets Git root | ✓ SATISFIED | Installed and integration tests pass. |
| SETUP-03 | 01, 03, 09, 17, 18, 20 | Choose one or more runtimes | ⚠️ NEEDS HUMAN | Data contract passes; terminal behavior needs a real TTY. |
| SETUP-04 | 03, 17, 18, 20 | Detection is suggestion with user control | ⚠️ NEEDS HUMAN | Injected prompt proves unchecked label-only detection, not real TTY. |
| SETUP-05 | 02, 03, 05, 17, 18, 20 | Only selected integration files | ✓ SATISFIED | Seven selected-subset installed tests pass. |
| SETUP-06 | 02, 03, 05, 12–20 | Minimal canonical files only | ✓ SATISFIED | Installed/minimal-artifact assertions pass. |
| SETUP-07 | 05, 12–14, 17–20 | Additive rerun preserves artifacts | ✗ BLOCKED | Windows preimage backup serialization breaks rerun/recovery. |
| SETUP-08 | 02, 03, 17, 18, 20 | Canonical next-operation output | ✓ SATISFIED | Installed test asserts canonical-first/runtimes-native completion. |
| ART-01 | 02, 04, 06, 08, 10, 12–20 | Inspect Markdown/JSON | ✓ SATISFIED | Artifact construction/validation use repository files. |
| ART-02 | 02, 04, 06, 09, 13, 15–20 | No database/cloud/hidden projection | ✓ SATISFIED | No DB/cloud or generated projection is wired. |
| ART-03 | 04, 07, 12, 20 | Stable ID families | ✓ SATISFIED | Exact ID-family tests pass. |
| ART-04 | 04, 12, 20 | Rename-stable identity | ✓ SATISFIED | Rename/reordering tests pass. |
| ART-05 | 04, 12, 20 | Lazy deeper artifacts | ✓ SATISFIED | Deferred-artifact test passes. |
| ART-06 | 04, 07, 12, 20 | Resolve canonical file/section | ✓ SATISFIED | ROADMAP/TASK resolution tests pass. |
| ART-07 | 06, 08–11, 13–21 | Preserve valid set on atomic failure | ✗ BLOCKED | Plan 21 closes two defects, but Windows recovery is ambiguous and production hooks bypass containment. |
| ART-08 | 01, 04, 06–9, 12–20 | Explicit invalid-edit errors | ✓ SATISFIED | Invalid JSON/no-mutation test passes. |
| ART-09 | 04, 06, 08, 12–20 | One stable ROADMAP path | ✓ SATISFIED | Reserved-path/lazy-artifact tests pass. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- |
| `src/filesystem/transaction.ts` | 227 | Host-native `join()` used for slash-only journal data | 🛑 BLOCKER | Windows additive reruns create invalid recovery records. |
| `src/filesystem/transaction.ts` | 163–177, 312 | Production environment hook writes arbitrary path / waits forever | 🛑 BLOCKER | Bypasses repository containment and permits CLI denial of service. |
| `src/filesystem/ownership.ts` | 138–145, 154 | Production ownership hook writes arbitrary path / waits forever | 🛑 BLOCKER | Same escape exists before staging. |
| `src/filesystem/contained-fs.ts` | 168 | Write loop does not reject zero progress | ⚠️ WARNING | A zero-byte write would spin while holding the transaction lease; no test exercises it. |
| `README.md` | 14 | Public `npx` command for a private unpublished package | ⚠️ WARNING / deferred | Registry installation is Phase 6 scope. |

No unreferenced `TBD`, `FIXME`, or `XXX` marker was found in active Phase 21 source/test files.

### Independent Review Disposition

`01-REVIEW.md` reported two critical findings and one warning. Both critical findings are confirmed and invalidate Phase 1 goal/requirement achievement: CR-01 blocks SETUP-07 and ART-07 on a supported CI platform; CR-02 violates the repository-contained mutation boundary in the shipped package. WR-01 is confirmed by source inspection but not force-invoked because forcing `writeSync()` to return zero is not a safe normal-runtime probe; it remains a warning rather than a silent pass.

### Human Verification After Gap Closure

1. **Real TTY runtime selection**

   **Test:** Run a packed local tarball initializer in a temporary Git repository with detection enabled. Try empty selection, a subset, and cancellation.

   **Expected:** Choices start unchecked; detection affects only labels; empty/cancelled selection writes nothing; only selected adapters are written.

   **Why human:** Prompt-injection tests cover the data contract, not terminal UI/cancellation.

### Gaps Summary

Plan 21 genuinely repaired the old pre-journal recovery and descriptor-read defects, and the repaired tests pass. Phase 1 cannot proceed: Windows is an advertised supported CI family but cannot complete an additive transaction with a preimage, and the shipped CLI contains environment-controlled hooks that escape the held repository root and can hang forever. The registry command is deferred to Phase 6; it does not defer either blocker.

---

_Verified: 2026-08-29T13:05:34Z_
_Verifier: the agent (gsd-verifier)_
