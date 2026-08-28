---
phase: 01-initialize-canonical-projects
verified: 2026-08-28T11:40:15Z
status: gaps_found
score: 44/74 plan must-haves verified
behavior_unverified: 4
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 19/25
  gaps_closed:
    - "Invalid JSON id/parent declarations now survive scanning and block init before mutation."
    - "Recovery and writers now share the UUID ownership lease; live-writer recovery returns busy."
    - "Normal transaction promotion now uses a native directory capability and sibling replacement rather than pathname copyFile."
  gaps_remaining:
    - "Recovery restores through pathname rm/writeFile after validation."
    - "Release evidence and the local gate are self-attesting and cannot prove the claimed candidate."
    - "Plans 01-13 through 01-18 remain incomplete."
  regressions:
    - "npm test -- --run currently fails 6 of 123 tests because containment fixtures default to a nonexistent approved-header archive."
gaps:
  - truth: "Interrupted recovery preserves the prior valid canonical set without a substitution escape."
    status: failed
    reason: "Recovery validates a path, then uses pathname rm() and writeFile(); a target or ancestor can change before restoration."
    artifacts:
      - path: "src/filesystem/recovery.ts"
        issue: "restorePrior() at lines 81-95 reconstructs paths and writes outside the opened root capability."
    missing:
      - "Implement Plan 01-14's capability-bound, restartable recovery and leaf/ancestor substitution tests."
  - truth: "Evidence labelled as release proves an actual release provider and a real full-suite result."
    status: failed
    reason: "The evidence writer hard-codes release mode and the aggregate accepts self-reported hashes while excluding the manifest, provenance, and full-suite artifacts."
    artifacts:
      - path: "scripts/write-containment-evidence.mjs"
        issue: "Writes evidenceMode: release without validating manifest.variant or build.variant."
      - path: "scripts/containment-evidence.mjs"
        issue: "Reads arbitrary evidence records and does not authenticate the referenced provider or test report."
    missing:
      - "Bind evidence bundles to raw manifest, provenance, provider binary, tarball, and full-suite bytes; reject test variants and forged records."
  - truth: "The current repository has a reproducible, source-bound full native regression result."
    status: failed
    reason: "Retained 123/123 evidence names source commit 2fe9a678, while HEAD is 1a68cb2; the local gate does not reject a dirty tree and the current full suite fails."
    artifacts:
      - path: "scripts/run-local-containment-gate.mjs"
        issue: "Records HEAD as sourceCommit without cleanliness/digest enforcement and overwrites root build outputs."
    missing:
      - "Require a clean/digested source tree, stage builds outside the checkout, and rerun the full suite from the final source."
  - truth: "Staging, backup, promotion, cleanup, and recovery are wholly capability-bound and restartable."
    status: failed
    reason: "Plans 01-13, 01-14, and 01-15 are incomplete; journal.ts is absent and the current code still uses pathname operational files."
    artifacts:
      - path: "src/filesystem/journal.ts"
        issue: "Missing."
      - path: "src/filesystem/transaction.ts"
        issue: "Staging/backup creation and cleanup still use mkdir/rm/reconstructed paths."
    missing:
      - "Execute Plans 01-13 through 01-15 with their operational-path and restartability tests."
  - truth: "The final release tarball contains every row-qualified prebuilt and rejects missing or incompatible providers before mutation."
    status: failed
    reason: "Plan 01-16 is incomplete and scripts/assemble-containment-package.mjs is absent."
    artifacts:
      - path: "scripts/assemble-containment-package.mjs"
        issue: "Missing."
    missing:
      - "Implement the isolated same-package assembly and installed-provider negative tests from Plan 01-16."
  - truth: "Every required platform/Node lane has authentic installed-matrix evidence before the package candidate is accepted."
    status: failed
    reason: "Plans 01-17 and 01-18 are incomplete; the complete installed race matrix and final gate have not been implemented."
    artifacts:
      - path: "tests/integration/containment-races.test.ts"
        issue: "Missing."
      - path: ".planning/phases/01-initialize-canonical-projects/01-SECURITY.md"
        issue: "Missing; security enforcement is active but no security audit has passed."
    missing:
      - "Execute Plans 01-17 and 01-18, then run the required security audit."
behavior_unverified_items:
  - truth: "Interactive users can select a non-empty runtime subset in a real terminal."
    test: "Run the packed initializer in a TTY, attempt an empty submission, choose a subset, then cancel a second run."
    expected: "All options initially render unchecked; only the submitted subset writes; empty selection and cancellation write nothing."
    why_human: "Injected prompt tests do not observe actual Inquirer TTY rendering or cancellation."
  - truth: "Detection remains label-only in the real interactive selector."
    test: "Set a supported runtime-detection environment signal and inspect the initial checkbox state in a TTY."
    expected: "Detected runtimes may be labelled but remain unchecked until explicitly selected."
    why_human: "The terminal presentation path is not exercised by an automated test."
  - truth: "Installed native promotion reaches the leaf/parent/ancestor substitution boundary."
    test: "Run the named installed-tracer tests with a verified Node-header archive supplied to the fixture."
    expected: "Each boundary is reached and the external sentinel remains unchanged."
    why_human: "The current automated attempt fails in fixture setup before its native assertions run."
  - truth: "Provider failure occurs before ownership or staging mutation."
    test: "Run the named provider-failure integration test with its verified build prerequisite available."
    expected: "Init returns the provider diagnostic and creates no ownership or staging evidence."
    why_human: "The current automated attempt fails building the fixture before it reaches runInit()."
unverified_prohibitions:
  - "No hidden/duplicate canonical state or export requirement."
  - "Runtime detection never becomes consent or installation authority."
  - "Omitted or locally modified adapters never become deletion/overwrite authority."
  - "Process-level evidence is not presented as universal filesystem or power-loss proof."
  - "Required environments are not silently accepted from binary availability alone."
---

# Phase 1: Initialize Canonical Projects Verification Report

**Phase Goal:** Users can initialize an Exspecso project that has only the selected runtime adapters and minimal, durable canonical artifact foundations.
**Verified:** 2026-08-28T11:40:15Z
**Status:** gaps_found
**Re-verification:** Yes — after gap closure

## MVP Mode Guard

The roadmap marks this phase `mvp`, but its goal is not a valid `As a …, I want …, so that … .` user story. This report therefore verifies the concrete roadmap success criteria and the non-reduced union of all PLAN `must_haves`; it does not claim a formal MVP user-flow verdict.

## Goal Achievement

### Observable Truths

| # | Roadmap success criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Init from repository root or nested directory targets the containing Git repository. | ✓ VERIFIED | The current full run's seven passing packed-tracer cases include root, deep nested, nested-repository, and no-repository behavior; `main()` → `runInit()` → `findGitRoot()` is wired. |
| 2 | Users choose integrations and receive only selected native adapter files. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `resolveSelectedAgents()` feeds `buildInitPlan()` and `ADAPTER_REGISTRY`; flags/subsets are tested, but real TTY interaction is not. |
| 3 | Rerun adds/refreshes adapters without replacing confirmed canonical artifacts. | ✓ VERIFIED | The passing rerun integration cases cover additive selection, conflicts, scoped replacement, stale preimages, and unchanged canonical bytes. |
| 4 | Canonical artifacts use stable IDs in ordinary Markdown/JSON without hidden duplicate state. | ✓ VERIFIED | `scanArtifacts()` retains JSON declaration diagnostics; `validateProject()` consumes them before init mutation, and the direct-edit tests pass except the unrelated provider-fixture setup case. |
| 5 | Interrupted atomic writes preserve a valid set and invalid direct edits return explicit errors. | ✗ FAILED — BLOCKER | Invalid-edit behavior is now covered, but recovery uses pathname restoration after validation; current suite also fails 6/123 tests and no authentic final containment matrix exists. |

**Score:** 44/74 plan must-haves verified; 4 are present but behavior-unverified; 26 failed.

### Plan Must-Have Coverage

Every plan frontmatter `must_haves.truths` item was classified; artifacts and links were checked separately.

| Plan | Verified | Behavior-unverified | Failed | Verdict |
| --- | ---: | ---: | ---: | --- |
| 01-01 | 2 | 0 | 0 | verified |
| 01-02 | 4 | 0 | 0 | verified |
| 01-03 | 1 | 2 | 0 | real-TTY UAT pending |
| 01-04 | 8 | 0 | 0 | verified |
| 01-05 | 1 | 0 | 0 | verified |
| 01-06 | 7 | 0 | 0 | verified for its injected-fault contract |
| 01-07 | 3 | 0 | 0 | prior JSON gap closed |
| 01-08 | 4 | 0 | 0 | prior ownership-race gap closed |
| 01-09 | 3 | 0 | 0 | approval contract present |
| 01-10 | 0 | 1 | 2 | release/tracer assertions unproven or contradicted |
| 01-11 | 1 | 0 | 2 | evidence is self-attesting, not authentic |
| 01-12 | 2 | 1 | 0 | provider-failure path is not currently executable |
| 01-13 | 0 | 0 | 3 | incomplete |
| 01-14 | 0 | 0 | 3 | incomplete; required journal artifact missing |
| 01-15 | 0 | 0 | 4 | incomplete |
| 01-16 | 0 | 0 | 4 | incomplete; package assembly artifact missing |
| 01-17 | 0 | 0 | 3 | incomplete; race matrix artifact missing |
| 01-18 | 0 | 0 | 3 | incomplete; final/security closure absent |
| 01-19 | 5 | 0 | 0 | matrix matching and exact ENV-MA25 policy are wired/tested |
| 01-20 | 3 | 0 | 2 | matrix set derivation/record formatting exist, but the claimed final evidence is unauthenticated and stale |

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| CLI, root resolver, init flow | Repository-contained initialization | ✓ VERIFIED | `package.json` bin → `main()` → `runInit()` → validation/plan/transaction. |
| Selection, registry, completion | Explicit selected-native adapter output | ⚠️ WIRED | Data flow is real; TTY behavior remains unobserved. |
| Schema, resolver, validation | Stable ID and direct-edit diagnostics | ✓ VERIFIED | Lossless JSON scanner diagnostics flow through `validateProject()`. |
| Ownership and transaction promotion | Exclusive, capability-based write path | ⚠️ PARTIAL | Normal promotion uses `RootCapability`; operational staging/cleanup remains pathname-based. |
| Recovery | Capability-bound restoration | ✗ FAILED | `restorePrior()` uses `rm()` and `writeFile()` on reconstructed paths. |
| Final package assembly | All row-qualified installed providers | ✗ MISSING | `scripts/assemble-containment-package.mjs` does not exist. |
| Complete installed matrix | Real race/matrix proof | ✗ MISSING | `tests/integration/containment-races.test.ts` does not exist. |
| Security closure | Required security audit | ✗ MISSING | No `01-SECURITY.md` exists. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `package.json` | `src/cli/main.ts` | compiled `dist/cli/main.js` bin | ✓ WIRED | Declared bin and packed tracer path agree. |
| `main.ts` | `run-init.ts` | parsed selection and process I/O | ✓ WIRED | Direct `runInit()` delegation. |
| `run-init.ts` | validation/plan/transaction | validate before plan, plan before commit | ✓ WIRED | Calls occur in that order under one ownership lease. |
| resolver | validator | `scanArtifacts()` diagnostics | ✓ WIRED | Invalid JSON declarations cannot disappear before validation. |
| transaction | native capability | parent-handle sibling replace | ✓ WIRED | Promotion uses `createFile()` and `replace()`. |
| recovery | native capability | restore/cleanup | ✗ NOT WIRED | Recovery falls back to path-string `rm`/`writeFile`. |
| evidence aggregate | real provider/report bytes | evidence bundle validation | ✗ NOT WIRED | Aggregate explicitly excludes bundle artifacts and trusts evidence JSON claims. |
| final package/matrix | package assembly and race suite | Plans 16–18 | ✗ NOT WIRED | Required producer artifacts are absent. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| Adapter plan | `selectedAgents` | CLI flags or prompt result | Selected IDs map to registry-relative native targets | ✓ FLOWING |
| Canonical validation | scan definitions/diagnostics | Opened-root `BoundReader` | JSON/Markdown bytes flow to diagnostics before plan construction | ✓ FLOWING |
| Transaction promotion | staged bytes | repository-local journal/stage | Capability-relative replacement in normal commit path | ✓ FLOWING |
| Recovery restoration | journal backup | reconstructed target path | Post-validation path can be substituted | ✗ DISCONNECTED/UNSAFE |
| Evidence decision | evidence record fields | arbitrary JSON files | Manifest/provenance/provider/report bytes are not authenticated | ⚠️ STATIC/SELF-ATTESTED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Full current test suite | `npm test -- --run` | 117 passed, 6 failed, 123 total | ✗ FAIL |
| Root/nested packed-init cases | Same single full run | The five named failures are fixture-provider/tracer cases; the remaining seven packed-tracer cases passed | ✓ PASS |
| Invalid JSON direct-edit cases | Same single full run | Nine of ten validation-error tests passed, including all invalid-declaration cases | ✓ PASS |
| Installed provider/tracer boundaries | Same single full run | Five named tests fail before assertions: `EXSPECSO_NODE_HEADERS` defaults to `missing-approved-headers` | ⚠️ UNVERIFIED |

### Probe Execution

Step 7c: SKIPPED. No declared or conventional `scripts/**/tests/probe-*.sh` probe exists.

### Requirements Coverage

| Requirement | Source Plans | Status | Evidence |
| --- | --- | --- | --- |
| SETUP-01 | 02, 09–12, 16–20 | ✓ SATISFIED | Passing packed root-init case; later release proof remains blocked. |
| SETUP-02 | 02, 09–12, 16–20 | ✓ SATISFIED | Passing deep/nested Git-root cases. |
| SETUP-03 | 01, 03, 09, 17, 18, 20 | ? NEEDS HUMAN | Flags and injected selection pass; real TTY selection remains untested. |
| SETUP-04 | 03, 17, 18, 20 | ? NEEDS HUMAN | Detection is not passed as selected state in code; visual initial state needs TTY confirmation. |
| SETUP-05 | 02, 03, 05, 17, 18, 20 | ✓ SATISFIED | Registry/planning restrict writes to selected IDs. |
| SETUP-06 | 02, 06, 08, 10, 12–20 | ✓ SATISFIED | Passing minimal-tree/no-op paths; containment completion remains blocked separately. |
| SETUP-07 | 05, 12–14, 17–20 | ✓ SATISFIED | Passing rerun, conflict, and scoped-replacement cases. |
| SETUP-08 | 02, 03, 17, 18, 20 | ✓ SATISFIED | Completion formats canonical operation first and native invocation per selection. |
| ART-01 | 02, 04, 06, 08, 10, 12–20 | ✓ SATISFIED | Canonical Markdown/JSON artifacts are direct repository files. |
| ART-02 | 02, 04, 06, 09, 13, 15–20 | ✓ SATISFIED | No database/cloud/duplicate projection is wired. |
| ART-03 | 04, 07, 12, 20 | ✓ SATISFIED | Exact D-20 parser/resolution and invalid declaration tests pass. |
| ART-04 | 04, 12, 20 | ✓ SATISFIED | Identity derives from stable ID and explicit parent, not title/slug. |
| ART-05 | 04, 12, 20 | ✓ SATISFIED | Minimal-artifacts test passes. |
| ART-06 | 04, 07, 12, 20 | ✓ SATISFIED | Resolver covers IDs/sections and read-only resolution. |
| ART-07 | 06, 08–11, 13–20 | ✗ BLOCKED | Unsafe recovery, unauthenticated evidence, and incomplete final matrix/prebuilt plans. |
| ART-08 | 01, 04, 06–9, 12–15, 17–20 | ✓ SATISFIED | Direct invalid JSON/config/relationship cases return actionable diagnostics before mutation. |
| ART-09 | 04, 06, 08, 12–15, 17–20 | ✓ SATISFIED | Minimal-tree and reserved-roadmap tests prevent extra Roadmap state. |

All 17 Phase 1 requirement IDs are declared by one or more plan; none is orphaned. The Phase 2–6 roadmap does not explicitly defer these containment/package obligations, so no failed item is deferred.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `src/filesystem/recovery.ts` | 81–95 | Check-then-pathname restore | 🛑 BLOCKER | A substituted target/ancestor can redirect recovery outside the repository. |
| `scripts/write-containment-evidence.mjs` | 46 | Hard-coded `evidenceMode: "release"` | 🛑 BLOCKER | Test providers can be labelled release evidence. |
| `scripts/containment-evidence.mjs` | 28–30, 51–87 | Self-attesting evidence receipt | 🛑 BLOCKER | Aggregate accepts forged hashes/observations rather than authenticating artifacts. |
| `scripts/run-local-containment-gate.mjs` | 22, 42–43, 65–66 | HEAD-only provenance and root-output mutation | 🛑 BLOCKER | Dirty sources can claim HEAD; exploratory runs overwrite checkout output. |
| `tests/helpers/containment-fixture.ts` | 74 | Missing header path default | 🛑 BLOCKER | Default full suite cannot build its native test package. |

No unreferenced `TBD`, `FIXME`, or `XXX` debt marker was found in the phase implementation files. The five unique judgment-tier prohibitions remain explicitly flagged, not silently passed; security enforcement is also not counted as passed because the security report is absent.

### Human Verification Required After Gap Closure

1. **Real TTY runtime selection**

   **Test:** Run packed `npx exspecso init` in a temporary Git repository with a detected runtime signal; submit empty once, select a subset once, and cancel once.

   **Expected:** All options start unchecked; detection only changes labels; no file is written for empty/cancelled selection; exactly the selected adapters are written.

   **Why human:** Terminal rendering and interactive cancellation are not covered by injected-prompt tests.

2. **Judgment-tier prohibition acknowledgement**

   **Test:** Review the five prohibition statements in Plans 02, 03, 05, 06, 09, and 20 after the technical gaps are closed.

   **Expected:** A maintainer explicitly accepts or rejects each scope/safety judgment.

   **Why human:** These are judgment-tier controls and cannot silently become a green automated result.

### Gaps Summary

The initial verifier findings were genuinely repaired: invalid JSON declarations now become diagnostics, the writer/recovery ownership race is closed, and normal promotion is capability-relative. Phase 01 is nevertheless not achieved. The current recovery path reopens the substitution risk, the evidence system can attest to artifacts it never validates, retained evidence does not bind to current HEAD, the live test suite fails, and Plans 01-13 through 01-18 are still incomplete. No later phase explicitly owns these Phase 01 obligations.

---

_Verified: 2026-08-28T11:40:15Z_
_Verifier: the agent (gsd-verifier)_
