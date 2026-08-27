# Phase 01 — Additive Gap Planning Coverage

**Date:** 2026-08-27
**Status:** Four gap plans passed independent plan verification after one revision; no implementation or verification gap is closed.

**Planning checks:** 0 blockers / 0 warnings in the final independent checker pass; all four gap-plan frontmatter/structure checks pass; 17/17 requirement IDs and 20/20 decisions remain covered. The first checker found missing native source-install evidence; Plan 01-10 now owns the executable correction. Original plans, summaries, context, and verification evidence were preserved.

The six executed plans and summaries remain unchanged. `01-VERIFICATION.md` and `01-REVIEW.md` remain the failure record: 19/25 must-haves verified, three blocking defects, and real-TTY behavior unverified. Local approved v13 documents and PROJECT govern; historical v12/greenfield statements in CONTEXT/RESEARCH/PATTERNS do not replace current authority or the implemented code.

## Gap → Plan → Evidence

| Verifier gap / review | Root cause | Plan / wave | Regression evidence required |
|---|---|---|---|
| Invalid JSON IDs/parents / CR-01 | Execution omitted JSON raw-field validation before filtering the definition index | 01-07 / 7 | Existing validation-errors suite: exact invalid parent through runInit, invalid id/parent type matrix, complete diagnostics and unchanged tree; artifacts suite preserves resolution |
| Recovery tears down a live writer / CR-02 | Check-then-act observation was substituted for acquisition; recovery never owned the transaction | 01-08 / 8 | Existing transaction-recovery suite: live writer at ready-to-promote; writer starts between idle observation and recovery acquisition; competing stale reclaimers cannot delete a newer token |
| Post-validation symlink redirection / CR-03 | Path safety was checked separately from a pathname-following mutation; Node-native research did not establish directory-bound namespace support | 01-09 / 9; 01-10 / 10 | Transaction-recovery suite: actual transaction/restore/cleanup syscall-window swaps of final leaf, immediate parent, and higher ancestor with unchanged external sentinels. Existing init-codex-tracer suite: real source tarball without .node, isolated lifecycle-enabled install that builds/loads its own provider, installed root/nested CLI, controlled missing-provider zero-write failure; full D-19/build/test/package gate |

Every new implementation task starts with a failing reproduction. These are execution repairs with a new, explicitly gated provider decision for CR-03, not replacements for historical tasks.

## Dependency and Ownership Audit

| Plan | Needs | Creates / changes | Checkpoint |
|---|---|---|---|
| 01-07 | Existing 01-04 scanner/validator and 01-06 init implementation | Lossless scanner result and JSON diagnostics | No |
| 01-08 | 01-07 completed; current validator must remain no-write on invalid input | Shared owner lease across init/writer/recovery and race tests | No |
| 01-09 | 01-08 lease and regression baseline | Directory-bound namespace provider and recovery/ownership integration | Blocking explicit native-provider approval |
| 01-10 | Completed 01-09 including its exact native/build/install/platform approval | Source-install packaging, isolated installed-CLI proof, installation documentation | No new decision; 01-09 approval remains mandatory |

Waves 7 → 8 → 9 → 10 extend the existing 1 → 6 chain. Parallelization is disabled and Task WIP=1. Files shared between ownership/promotion/recovery/package plans run serially. The checker correction moved package/build-install documentation and GAP-PATH-05 into 01-10 so no task exceeds five modified files and 01-09 cannot claim unproven installation behavior. tests/helpers/run-cli.ts remains read-only: its existing env overrides suffice when the tracer explicitly removes disallowed inherited keys. No branch operation or application-source edit occurred during planning.

## Multi-Source Audit

Coverage means an executable plan owns the obligation; it does not mean the obligation has passed. Conditional CR-03 coverage cannot execute without the declared user decision.

| Source | ID / item | Plans retaining coverage | Status / qualification |
|---|---|---|---|
| GOAL | Selected adapters and minimal durable canonical foundations | Existing 01-02–06; repair 01-07–10 | COVERED; three failures remain until execution/re-verification |
| REQ | SETUP-01 | 01-02; 01-10 package regression | COVERED; source tarball is installed with normal lifecycle, not merely listed |
| REQ | SETUP-02 | 01-02; 01-10 | COVERED; root/nested installed-CLI suite retained |
| REQ | SETUP-03 | 01-01, 01-03 | COVERED; real-TTY check pending |
| REQ | SETUP-04 | 01-03 | COVERED; real-TTY check pending |
| REQ | SETUP-05 | 01-02, 01-03, 01-05 | COVERED |
| REQ | SETUP-06 | 01-02, 01-06; repair 01-08/09/10 | COVERED |
| REQ | SETUP-07 | 01-05; 01-10 full regression | COVERED |
| REQ | SETUP-08 | 01-02, 01-03 | COVERED |
| REQ | ART-01 | 01-02, 01-04, 01-06; repair 01-08/09 | COVERED |
| REQ | ART-02 | 01-02, 01-04, 01-06; 01-09 | COVERED; no hidden store introduced |
| REQ | ART-03 | 01-04; repair 01-07 | COVERED |
| REQ | ART-04 | 01-04 | COVERED; rename/order contracts retained |
| REQ | ART-05 | 01-04 | COVERED; lazy-materialization contracts retained |
| REQ | ART-06 | 01-04; 01-07 | COVERED |
| REQ | ART-07 | 01-06; repair 01-08/09/10 | COVERED; native-provider approval required |
| REQ | ART-08 | 01-01, 01-04, 01-06; repair 01-07–10 | COVERED |
| REQ | ART-09 | 01-04, 01-06; 01-08/09 regressions | COVERED |
| CONTEXT | D-01 minimal config | 01-02/04; 01-08/09 minimal-tree regression | COVERED; no new canonical field |
| CONTEXT | D-02 unclassified mode | 01-02/04 | COVERED |
| CONTEXT | D-03 invariant-only constitution | 01-02/04; regression 01-08 | COVERED |
| CONTEXT | D-04 opaque UUID separate from title | 01-02/04; regression 01-07 | COVERED; no-change identity decision |
| CONTEXT | D-05 unchecked detection labels | 01-03 | COVERED; TTY observation pending |
| CONTEXT | D-06 nonempty choice/cancel | 01-03 | COVERED; TTY observation pending |
| CONTEXT | D-07 repeatable flags / TTY split | 01-03 | COVERED |
| CONTEXT | D-08 canonical-first completion | 01-03 | COVERED; no completion on new failure paths |
| CONTEXT | D-09 managed-file refresh/conflicts | 01-05 | COVERED; full rerun suite retained |
| CONTEXT | D-10 additive rerun | 01-05 | COVERED; full rerun suite retained |
| CONTEXT | D-11 self-contained managed header | 01-03/05 | COVERED; operational lock is not an adapter manifest |
| CONTEXT | D-12 complete-set preflight | 01-05; repair 01-08 | COVERED; repeat validation under acquired ownership |
| CONTEXT | D-13 no auto merge / explicit replace | 01-05 | COVERED |
| CONTEXT | D-14 no containing Git root → no writes | 01-02 | COVERED; packed suite retained |
| CONTEXT | D-15 complete actionable diagnostics | 01-04; repair 01-07 | COVERED |
| CONTEXT | D-16 nonzero / no implicit repair | 01-04; repair 01-07/08 | COVERED |
| CONTEXT | D-17 duplicates select none | 01-04; regression 01-07 | COVERED |
| CONTEXT | D-18 identified debris only / ambiguity stops | 01-06; repair 01-08/09 | COVERED; legacy ownership remains conservative |
| CONTEXT | D-19 process interruption / exceptions / killed processes; no broader durability claim | 01-06; repair 01-08/09 | COVERED; no power-loss or universal-platform claim |
| CONTEXT | D-20 exact nine ID families | 01-04; repair 01-07 | COVERED; no aliases or migration |
| RESEARCH | Approved one-package TS/Zod/Inquirer/Vitest stack and legitimacy gate | 01-01–04; 01-10 | COVERED; unchanged dependency graph, no new native dependency/download authorized |
| RESEARCH | Git-root targeting and immutable complete-set preflight | 01-02/05; 01-08 | COVERED |
| RESEARCH | Explicit selection, native runtime paths and command sigils | 01-03/05 | COVERED; unchanged by repairs |
| RESEARCH | Schema-first aggregation / resolver / no guessed relationships | 01-04; 01-07 | COVERED |
| RESEARCH | Journaled staged write, retained hashes/backups, known cleanup | 01-06; 01-08/09 | COVERED; Node-only namespace assumption requires checkpoint |
| RESEARCH | Every-step process-level fault injection | 01-06; 01-08/09 | COVERED; retained and expanded |
| RESEARCH | Minimal/lazy artifacts and reserved sole ROADMAP | 01-04/06; 01-08/09 regression | COVERED |
| RESEARCH | ASVS input, path, overwrite, and staging boundaries | Every retained/new threat_model | COVERED; independent security gate pending |
| RESEARCH | No external service or ORM schema | COVERAGE.md | COVERED; local Node-API is not an external product API |

No deferred ideas were added. Phases 2–6 work remains excluded. No source item is silently dropped. The native implementation is gated, not authorized or proven by this audit.

## Preserved Spec-less Probe Accounting

The supplied deterministic report contains 22 candidates. The previous plan set already authored all 22 as explicit predicates; preserve those exact predicates and their locations. The fresh engine report labels are not used to demote or rewrite prior resolved predicates, including historically unclassified candidates.

| Probe | Requirement / category | Existing authored truth | Repair relationship |
|---|---|---|---|
| EDGE-01 | SETUP-01 / unclassified | 01-02 | Retain; 01-10 source-install proof |
| EDGE-02 | SETUP-02 / unclassified | 01-02 | Retain; 01-10 installed root/nested proof |
| EDGE-03 | SETUP-03 / unclassified | 01-03 | Retain; TTY pending |
| EDGE-04 | SETUP-04 / unclassified | 01-03 | Retain; TTY pending |
| EDGE-05 | SETUP-05 / concurrency | 01-03 | Retain |
| EDGE-06 | SETUP-06 / concurrency | 01-06 | 01-08/09 repair |
| EDGE-07 | SETUP-07 / unclassified | 01-05 | Retain |
| EDGE-08 | SETUP-08 / unclassified | 01-02 | Retain |
| EDGE-09 | ART-01 / concurrency | 01-06 | 01-08/09 repair |
| EDGE-10 | ART-02 / unclassified | 01-02 | Retain |
| EDGE-11 | ART-03 / adjacency | 01-04 | Retain |
| EDGE-12 | ART-03 / empty | 01-04 | 01-07 raw-value repair |
| EDGE-13 | ART-03 / ordering | 01-04 | Retain |
| EDGE-14 | ART-04 / unclassified | 01-04 | Retain |
| EDGE-15 | ART-05 / unclassified | 01-04 | Retain |
| EDGE-16 | ART-06 / concurrency | 01-04 | Retain |
| EDGE-17 | ART-07 / adjacency | 01-06 | 01-08/09 repair |
| EDGE-18 | ART-07 / empty | 01-06 | Retain no-op proof |
| EDGE-19 | ART-07 / ordering | 01-06 | Retain; 01-09 journal boundary proof |
| EDGE-20 | ART-07 / concurrency | 01-06 | 01-08/09 repair |
| EDGE-21 | ART-08 / unclassified | 01-04 | 01-07 repair |
| EDGE-22 | ART-09 / concurrency | 01-06 | Retain; 01-08/09 minimal-tree proof |

Historical edge equality: 22 candidates = 22 unchanged authored predicates + 0 newly flagged edge assumptions. Fourteen additional gap-specific truths are authored separately: GAP-JSON-01–03, GAP-LOCK-01–04, and GAP-PATH-01–07. GAP-PATH-01–04 remain in 01-09; GAP-PATH-05 is preserved and made executable in 01-10 alongside explicit installed-provider refusal and prerequisite evidence. GAP-PATH-01 records the unresolved human architecture choice; it is not a fabricated automatic pass or a reclassified historical edge.

## Prohibition Recall and Equality

Preserve the four descriptor-less flagged-unverified judgments: no hidden duplicate canonical store (01-02), no detection-as-consent (01-03), no omitted-adapter deletion/overwrite (01-05), and no D-19 durability overclaim (01-06). Current recall keeps one additional human-control prohibition in 01-09: no unapproved native/install/platform tradeoff or containment reduction. Canon path traversal, memory safety, malformed JSON, and concurrency hazards remain in threat models and regression tests, not newly invented ethical judgments. No check_kind/check_target/check_rule or fixture descriptor is fabricated.

Prohibition equality: 4 previously retained + 1 newly kept = 5 authored flagged-unverified prohibitions + 0 silently dismissed items. All five still require judgment acknowledgement after fixes; native approval alone does not complete that acknowledgement.

## Explicit Decisions and Pending Gates

- **Native provider:** 01-09 Task 1 is blocking-human and autonomous:false. It proposes a same-package direct C Node-API binding with a local compiler/header build. User approval must include build/install/platform implications. Rejection, missing essential primitives, or unsupported required platform scope stops execution for replanning. No native implementation or package installation occurred during planning.
- **Identity:** no-change. The assumption-delta detector's original choose signal is already resolved by D-05–D-07; no new canonical noun/ID is introduced.
- **MVP:** ROADMAP mode is mvp but its approved goal lacks the required user-story sentence. Preserve and report that historical framing warning; do not invent a goal during repairs or claim formal MVP flow verification.
- **Validation status:** 01-VALIDATION remains draft/nyquist_compliant:false; new rows are pending, not green.
- **Installed-package evidence:** 01-10 requires actual tarball creation and an isolated install with lifecycle scripts enabled, no packaged .node, no checkout/node_modules linkage, successful installed-provider load tracing, root/nested init, and controlled missing-provider refusal with complete repository byte/tree equality. The full suite runs these tests; npm pack --dry-run is an additional contents check and never substitutes for installation. No separate prebuilt-provider contract is approved.
- **After fixes:** full build/tests/package verification, independent phase verification, real-TTY UAT, all judgment-tier acknowledgements, and $gsd-secure-phase 1 remain required. Phase 2 must not advance from plan creation or a successful intermediate test.
