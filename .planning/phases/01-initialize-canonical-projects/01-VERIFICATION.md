---
phase: 01-initialize-canonical-projects
verified: 2026-08-29T14:02:04Z
status: gaps_found
score: 9/14 must-haves verified
behavior_unverified: 1
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 7/14
  gaps_closed:
    - "Windows additive journal backup paths are now serialized as slash-form data and the active recovery regression passes."
    - "The shipped CLI now ignores the legacy EXSPECSO_TEST_* environment controls; the installed-tarball negative regression passes."
    - "Zero-progress synchronous writes now fail closed and release the internally acquired lease."
  gaps_remaining: []
  regressions:
    - "The active Node containment capability accepts Windows device, alternate-data-stream, and normalized-alias components despite its declared cross-platform relative-component validation contract."
gaps:
  - truth: "The initialized project keeps deterministic repository-root and relative-component validation for its journaled atomic write and recovery path."
    status: failed
    reason: "On Windows, the shipped DirectoryCapability accepts device names, NTFS alternate data stream names, and trailing-dot/space aliases. A crafted transaction/recovery component can therefore resolve to a device, stream, or normalized alias rather than one portable repository entry."
    artifacts:
      - path: src/filesystem/contained-fs.ts
        issue: "component() rejects only empty, dot, separators, and NUL; it permits colon, reserved DOS devices, and trailing dot/space aliases."
      - path: vitest.config.ts
        issue: "The only affected-name coverage in tests/unit/contained-fs.test.ts is excluded from the active suite, while root-scoped-fs.test.ts does not cover the portable component contract."
    missing:
      - "Reject Windows-unsafe component names before every filesystem operation (ADS/colon and other prohibited characters, controls, trailing dot/space, DOS device names including extension and superscript variants, and a portable length bound)."
      - "Move the affected-name regression into the active Node containment test suite and prove it on the supported Windows CI row."
behavior_unverified_items:
  - truth: "A real interactive terminal user can choose detected Claude Code, OpenAI Codex, and/or OpenCode integrations and receives only those adapter files."
    test: "Run the packed initializer in a real TTY with detection enabled; submit an empty selection, a nonempty subset, and cancellation."
    expected: "All choices render unchecked; detection changes labels only; empty/cancelled selection writes nothing; a submitted subset writes only its adapters."
    why_human: "Injected prompt tests prove the selection state machine but not Inquirer's actual terminal rendering or cancellation behavior."
---

# Phase 1: Initialize Canonical Projects Verification Report

**Phase Goal:** Users can initialize an Exspecso project that has only the selected runtime adapters and minimal, durable canonical artifact foundations.
**Verified:** 2026-08-29T14:02:04Z
**Status:** gaps_found
**Re-verification:** Yes — after Plan 01-22 gap closure

## MVP Mode Guard

Phase 1 is marked `mvp`, but `user-story.validate` reports that its roadmap goal is not an `As a …, I want …, so that … .` user story. This report therefore verifies the concrete roadmap success criteria and approved Phase 1 contracts. No user-story flow verdict is asserted.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Root and nested initialization target the containing Git repository. | ✓ VERIFIED | Packed and installed CLI tests cover root, nested, and nested-repository invocation. Registry publication is explicitly deferred to Phase 6. |
| 2 | Users select only Claude Code, Codex, and/or OpenCode adapters. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `runtime-selection.ts` and active injected-prompt tests prove selection, detection-as-labels, and all nonempty subsets; real TTY rendering/cancellation is not exercised. |
| 3 | Reruns add or refresh selected adapters without replacing confirmed canonical artifacts. | ✓ VERIFIED | `installed-cli.test.ts` and `windows-journal-paths.test.ts` pass; journal `backupPath` is now `backups/${relativePath}` and parses cross-platform. |
| 4 | Canonical artifacts are inspectable Markdown/JSON with stable IDs and no hidden duplicate state. | ✓ VERIFIED | Artifact schema, resolver, and validation are substantive and active tests cover exact IDs, rename stability, lazy artifacts, duplicate diagnostics, and reserved ROADMAP placement. |
| 5 | Interrupted atomic writes preserve a valid prior artifact set, and invalid direct edits produce explicit errors. | ✗ FAILED — BLOCKER | Transaction/recovery evidence is substantive and Plan 22 fixes pass, but the active capability allows Windows device/ADS/normalized-alias components. That violates the required relative-component validation underpinning safe recovery. |
| 6 | The active package is pure TypeScript/Node, with historical native material non-shipped and non-invoked. | ✓ VERIFIED | `package.json` allow-list, active build/test, pack inventory (43 entries), and CI route through `dist` only; native material is absent from the tarball. |
| 7 | Filesystem claims are bounded to the documented repository-root/host boundary. | ✗ FAILED — BLOCKER | README promises relative-component checks, but `contained-fs.ts` accepts `ordinary:secret`, `CON`, `NUL.txt`, `COM1`, `tail.`, and `tail `; these are unsafe on the supported Windows family. |
| 8 | Historical native plans/evidence remain provenance rather than proof of the shipped Node path. | ✓ VERIFIED | README and Plans 17–18 make this boundary explicit; package/build/test entry points do not invoke native components. |
| 9 | Routine compatibility CI is the four-row representative sample. | ✓ VERIFIED | `.github/workflows/ci.yml` declares Ubuntu/Node 22.13.0 and Ubuntu/macOS/Windows Node 24 rows. |
| 10 | The standard tarball installs and runs the declared compiled CLI without native inputs. | ✓ VERIFIED | Installed-package tests pass; dry-run inventory contains the declared bin and pure Node `dist` files only. |
| 11 | The installed CLI preserves subsets, minimal initialization, canonical-first output, and additive reruns. | ✓ VERIFIED | Active installed CLI suite and Plan 22 Windows-journal regression pass. |
| 12 | README claims match the shipped package boundary. | ✗ FAILED — BLOCKER | README claims relative-component validation, which the active implementation demonstrably does not provide on Windows. |
| 13 | Previous Windows journal, shipped-hook, and zero-progress defects are closed. | ✓ VERIFIED | The focused four-file run passes 37 tests; static and installed-package scans show legacy hooks remain only in test fixtures; `write()` rejects non-positive `writeSync()` results. |
| 14 | Phase closure remains independent and does not publish or mark the phase complete. | ✓ VERIFIED | Package remains private; README and ROADMAP state independent verification is pending. |

**Score:** 9/14 truths verified; 1 present but behavior-unverified.

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/init/{run-init,runtime-selection}.ts` | Root-scoped initialization and explicit runtime choice | ✓ VERIFIED | Imported by the compiled CLI; selected agent IDs flow to adapter planning and completion output. |
| `src/artifacts/{schema,resolve,validate}.ts` | Durable canonical Markdown/JSON and ID contracts | ✓ VERIFIED | Bound reads feed validation and diagnostics; no DB/cloud/projection path is wired. |
| `src/filesystem/{journal,transaction,recovery}.ts` | Journaled atomic transaction and conservative recovery | ⚠️ PARTIAL — BLOCKED | Schema-2 preparation and slash-form backup serialization are wired/tested; portable component validation is incomplete. |
| `src/filesystem/contained-fs.ts` | Root-scoped pure Node capability | ✗ SUBSTANTIVE BUT UNSAFE | Existence/wiring/normal-path tests pass, but `component()` accepts Windows-special names. |
| `tests/integration/{installed-cli,windows-journal-paths,transaction-recovery}.test.ts` | Installed/recovery regression evidence | ✓ VERIFIED | Present, substantive, active, and the focused suite reports 37 passing tests. |
| `tests/unit/root-scoped-fs.test.ts` | Bound descriptor read/write safety | ✓ VERIFIED | Active test covers final-stat/zero-progress behavior; it lacks the Windows component cases required for the capability contract. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- |
| `src/cli/main.ts` | `src/init/run-init.ts` | `runInit()` | ✓ WIRED | CLI passes cwd and process I/O into initialization. |
| `src/init/run-init.ts` | `src/filesystem/contained-fs.ts` | `openContainedFilesystem()` | ✓ WIRED | One root capability supplies preflight, validation, recovery, and transaction work. |
| `src/filesystem/transaction.ts` | `src/filesystem/journal.ts` | `backups/${relativePath}` | ✓ WIRED | Parser and Plan 22 Windows-form regression agree on slash-only backup data. |
| installed tarball | compiled filesystem modules | `dist/cli/main.js` | ✓ WIRED | Installed-package test runs the declared bin under hostile legacy environment values and finds no signals. |
| `DirectoryCapability` | Windows filesystem operations | `component()` then `node:path.join()` | ✗ UNSAFE WIRING | Permitted components can resolve as ADS, DOS devices, or normalized aliases on NTFS. |

### Data-Flow Trace

| Artifact | Data variable | Source | Produces real data | Status |
| --- | --- | --- | --- | --- |
| Runtime selection | `selectedAgents` | flags/TTY prompt → adapter registry → init plan | Selected IDs determine adapter paths | ✓ FLOWING |
| Artifact validation | definitions/diagnostics | bound repository Markdown/JSON reader → validator | Errors reach `runInit()` before mutation | ✓ FLOWING |
| Recovery | journal entries/preimages | staged journal → parser → capability recovery | Valid regular paths recover; Windows-special components have an unsafe resolution path | ✗ UNSAFE ON WINDOWS |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Active package build/test/pack | `npm run build && npm test -- --run && npm pack --dry-run --json` | build passed; 10 files / 90 tests passed; 43 tarball entries | ✓ PASS |
| Plan 22 defects | `npx vitest run` for Windows journal, installed CLI, transaction recovery, and root FS suites | 4 files / 37 tests passed | ✓ PASS |
| Legacy shipped hooks | `rg EXSPECSO_TEST src dist package.json` | no production match; only tests/fixtures use the legacy identifiers | ✓ PASS |
| Windows journal serialization | source/test inspection and active Windows-form test | `backups/` serialization is parser-compatible; regression passed | ✓ PASS |
| Windows component validation | direct compiled-capability probe | all of `ordinary:secret`, `CON`, `NUL.txt`, `COM1`, `tail.`, `tail ` were accepted | ✗ FAIL |

### Probe Execution

Step 7c: SKIPPED — no active pure-Node Phase 1 probe is declared. Historical native probes are provenance only and are not Phase 1 verification evidence.

### Requirements Coverage

All 17 Phase 1 requirement IDs are declared across the executed plans; none is orphaned.

| Requirement | Status | Evidence |
| --- | --- | --- |
| SETUP-01 | ⚠️ DEFERRED | Root init is tested from a local tarball; registry availability is explicitly Phase 6 work. |
| SETUP-02 | ✓ SATISFIED | Root/nested/nearest Git-root installed tests pass. |
| SETUP-03 | ⚠️ NEEDS HUMAN | Selection state machine passes; real TTY remains untested. |
| SETUP-04 | ⚠️ NEEDS HUMAN | Detected labels never select an agent in tests; real TTY remains untested. |
| SETUP-05 | ✓ SATISFIED | All nonempty selected subsets produce only their native adapters. |
| SETUP-06 | ✓ SATISFIED | Minimal tree and tarball inventory assertions pass. |
| SETUP-07 | ✓ SATISFIED | Additive rerun and Windows slash-form journal/recovery regressions pass. |
| SETUP-08 | ✓ SATISFIED | Completion output is canonical-first and adapter-specific. |
| ART-01 | ✓ SATISFIED | Repository Markdown/JSON is the active data source. |
| ART-02 | ✓ SATISFIED | No database, cloud, hidden canonical projection, or export dependency is wired. |
| ART-03 | ✓ SATISFIED | Exact stable ID-family tests pass. |
| ART-04 | ✓ SATISFIED | Rename/reorder stability tests pass. |
| ART-05 | ✓ SATISFIED | Lazy deeper artifacts remain absent after initialization. |
| ART-06 | ✓ SATISFIED | Canonical file/section resolution is active and tested. |
| ART-07 | ✗ BLOCKED | Windows component acceptance breaks the contracted portable root/component validation for atomic write and recovery. |
| ART-08 | ✓ SATISFIED | Invalid JSON/relationship errors are explicit and non-mutating. |
| ART-09 | ✓ SATISFIED | One reserved `.exspecso/roadmap.md` contract is active and tested. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- |
| `src/filesystem/contained-fs.ts` | 30–34 | Incomplete cross-platform component validator | 🛑 BLOCKER | Windows names can address noncanonical targets during active capability operations. |
| `vitest.config.ts` | 6–13 | Affected-name test suite excluded | ⚠️ WARNING | Full suite does not guard the required portable component boundary. |

No unreferenced `TBD`, `FIXME`, or `XXX` marker was found in the active Plan 22 source/test surface.

### Independent Review Disposition

The fresh review's former blockers are closed by Plan 22: slash-form journal data is parser-compatible, the installed CLI ignores legacy `EXSPECSO_TEST_*` values, and zero-progress writes fail closed. Its remaining CR-01 is confirmed independently, not treated as a defect in excluded historical native material. The active pure-Node `component()` implementation accepts every reviewed Windows-special form, and the current `vitest.config.ts` excludes the legacy test that enumerates those forms. D-21 does not promise race-proof or universal filesystem containment, but it expressly retains relative-component validation; this gap falls within that retained contract and blocks ART-07/phase closure.

### Human Verification After Gap Closure

1. **Real TTY runtime selection**

**Test:** Run a packed local tarball initializer in a temporary Git repository with detection enabled. Try empty selection, a subset, and cancellation.

**Expected:** Choices start unchecked; detection affects only labels; empty/cancelled selection writes nothing; only selected adapters are written.

**Why human:** Prompt-injection tests cover the state contract, not terminal rendering/cancellation.

### Gaps Summary

Phase 1 is not complete. The three concrete Plan 22 closure defects are genuinely repaired and tested, but the current Node containment layer does not provide the portable component validation the active package and README claim. Because Windows is a supported representative runtime and the capability is used by journaled transaction/recovery operations, this is a blocker for ART-07 and the durable-foundation part of the Phase goal. It is not deferred: Phase 6 owns registry publishing, not Phase 1 filesystem safety.

---

_Verified: 2026-08-29T14:02:04Z_
_Verifier: the agent (gsd-verifier)_
