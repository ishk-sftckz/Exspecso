---
phase: 01-initialize-canonical-projects
plan: 12
subsystem: contained artifact and initializer reads
tags: [native-containment, bound-reader, artifact-validation, init-preflight]
status: complete
plan_complete: true
dependency_graph:
  requires: [01-11]
  provides: [bound-read-facade, root-bound-artifact-scan, pre-mutation-provider-preflight]
  affects: [01-13, 01-14, 01-15, 01-16, 01-17, 01-18]
tech_stack:
  added: []
  patterns: [relative-component-bound-reader, caller-owned-root-lifetime, read-only-preflight]
key_files:
  created: [01-12-EVIDENCE/hosted-33156479915, 01-12-EVIDENCE/hosted-33156890796]
  modified: [src/filesystem/contained-fs.ts, src/artifacts/resolve.ts, src/artifacts/validate.ts, src/init/plan.ts, src/init/run-init.ts, src/errors/diagnostic.ts, tests/unit/artifacts.test.ts, tests/integration/validation-errors.test.ts]
decisions:
  - Artifact scans and preimage checks use one BoundReader made of validated relative components; unsafe or unreadable entries are explicit diagnostics, never absence.
  - runInit keeps its opened root capability alive through validation, recovery inspection, planning, stale-preimage checks, and staged-config validation, then closes it on every exit.
  - Provider and Git-marker preflight happen before ownership, recovery, or staging effects.
metrics:
  duration: recovered and closed after partial execution
  completed_date: 2026-08-28
actuals:
  tokens: 7929
  tasks: 2
  commits: 5
requirements-completed: [SETUP-01, SETUP-02, SETUP-06, SETUP-07, ART-01, ART-03, ART-04, ART-05, ART-06, ART-08, ART-09]
coverage:
  - id: D1
    description: Artifact discovery and validation retain complete diagnostics without reading substituted external bytes.
    requirement: ART-03
    verification:
      - kind: unit
        ref: tests/unit/artifacts.test.ts#reports substituted artifact entries without reading their external bytes
        status: pass
    human_judgment: false
  - id: D2
    description: Initializer provider failure is reported before ownership or staging can mutate the repository.
    requirement: SETUP-06
    verification:
      - kind: integration
        ref: tests/integration/validation-errors.test.ts#reports an actual provider failure before any ownership or staging write
        status: pass
    human_judgment: false
  - id: D3
    description: The release initializer preserves root selection and native containment behavior on every approved host row.
    requirement: SETUP-01
    verification:
      - kind: e2e
        ref: 01-12-EVIDENCE/hosted-33156890796/*/tracer-results.json
        status: pass
    human_judgment: false
  - id: D4
    description: All Plan 12 focused suites and the full regression suite run against the final source snapshot on an approved provider host.
    verification:
      - kind: other
        ref: 01-20-EVIDENCE/local/full-suite.json; 01-20-EVIDENCE/local/evidence.json; 01-20-EVIDENCE/local/provider-manifest.json
        status: pass
    human_judgment: false
    rationale: Plan 01-20 built the declared ENV-MA25 release provider and retained a passing unfiltered 123/123 local full-suite report with row-bound source, provider, manifest, Node-API, and CLT/SDK provenance.
---

# Phase 01 Plan 12: Bound Artifact Reads Summary

Artifact scanning, validation, and init preflight now share an opened native root capability, so a substituted repository name cannot contribute external bytes to write authorization.

## Completed Work

- Added `BoundReader` operations for safe enumeration, no-follow metadata, and regular-file reads under an already-open `ContainedFilesystem` root.
- Migrated artifact resolution and validation to report unsafe or unreadable entries explicitly while retaining independent malformed-declaration, duplicate, lazy-artifact, ordering, and D-20 diagnostics.
- Bound init's preliminary validation, recovery-evidence inspection, config and adapter preimage reads, stale-preimage validation, and staged-config inspection to one caller-owned root capability.
- Closed every transient directory capability opened while traversing a bound reader, while keeping the caller-owned root alive for the whole init operation.
- Added RD-01 substitution and RD-04 actual-provider-failure regressions; provider or marker failure now exits before ownership, recovery, or staging writes.

## Task Commits

1. **Task 1: Resolve and validate artifacts through bound reads**
   - `d68fca4` — `test(01-12): add unsafe artifact read regression`
   - `7a5172e` — `feat(01-12): bind artifact reads to native capabilities`
   - `c400384` — `fix(01-12): close transient reader capabilities`
2. **Task 2: Bind initializer preflight and stale-preimage checks to the same root**
   - `c57cabb` — `test(01-12): add provider preflight regression`
   - `6a9d1ba` — `feat(01-12): share the root-bound reader through init`

## Verification

- `npm run build` passed.
- `npm test -- --run tests/unit/artifacts.test.ts -t "reports substituted artifact entries"` passed (1 test).
- `npm test -- --run tests/integration/validation-errors.test.ts -t "actual provider failure"` passed (1 test).
- `git diff --check HEAD~4..HEAD` passed.
- Hosted run `33156890796` executed the final source commit `c400384a993862e75b29d5c49a1a7374b27f2cc5` on all eight approved native rows. Each retained `tracer-results.json` reports 12/12 passing installed initializer checks (96/96 total), and every paired `evidence.json` reports `status: passed`, matching source commit, provider hash, and native environment. The earlier `33156479915` evidence remains retained for the pre-lifecycle-fix snapshot.

The current local macOS 26.5.1 / 25F80 host is deliberately outside the approved macOS 15.7.7 provider contract. The complete focused suites therefore cannot be rerun locally without weakening the provider gate; the exact-source hosted evidence above is the authoritative native verification.

The explicit plan-level focused and full regression commands remain unverified on the final source snapshot. The existing approved POSIX full-regression workflow is pinned to a branch that rejects a non-force update, while the all-target workflow runs only the installed tracer suite. This plan is therefore halted for verification rather than complete.

## Resolution — 2026-08-28

Plan 01-20 is the approved closing route for this historical halt. It built the real `ENV-MA25` Node-API 8 release provider from checksum-verified Node 20.19.0 headers, then ran `npm run build` and the complete unfiltered `npm test -- --run --testTimeout 60000` suite under Node 25.2.1 / live Node-API 10. The retained local evidence reports 123/123 passing tests, no failures/skips/todos, source snapshot `2fe9a678e9ba9b03c7753f921263afae13c95a84`, provider hash `dba77dba8c0d15dfe1cf20ee512d86e0b915038b6ccd8666a0296dede07bfc98`, and manifest hash `d7786781cb1fc6b12ab1280458b51ff2786dfec60c5b85b904af28ab590f48dd`.

This completes D4 without weakening the original regression contract. The earlier hosted records, completed work, task commits, limitations, and halted narrative above remain preserved history. Plan 01-13 may now begin through completed Plan 01-20; later package, cross-product, same-final-tarball, independent verification, TTY, acknowledgement, and security gates remain pending.

## Files Created/Modified

- `src/filesystem/contained-fs.ts` — exposes `BoundReader` over opaque native capabilities.
- `src/artifacts/resolve.ts` and `src/artifacts/validate.ts` — use bound enumeration and reads with explicit unsafe-read diagnostics.
- `src/init/plan.ts` and `src/init/run-init.ts` — reuse one root capability through all pre-mutation reads and close owned handles.
- `tests/unit/artifacts.test.ts` and `tests/integration/validation-errors.test.ts` — cover substitution diagnostics and provider preflight no-write behavior.
- `01-12-EVIDENCE/hosted-33156890796/` — retained final all-row exact-source native test and environment evidence.

## Decisions Made

- Keep standalone scan, validation, and plan callers responsible for opening and closing a capability, while nested init calls share the existing root lifetime.
- Treat unsafe/unreadable paths as diagnostics, not as missing artifacts, so validation cannot silently authorize a changed tree.
- Preserve the accepted concurrent-regular-file limitation; this plan changes read authority, not the later transaction-write contract.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 1 - Handle lifecycle]** A post-commit audit found that nested bound-reader traversal closed only its final directory handle. `NativeBoundReader` now closes every transient directory in reverse order while preserving the caller-owned root lifetime. Fixed in `c400384` and rechecked with the focused substitution and provider-preflight regressions plus `npm run build`.

Close-out retained the existing exact-source hosted evidence rather than rebuilding or replacing the approved provider on an unapproved local host.

## Known Stubs

None.

## Self-Check: PASSED

- All five Task commits exist in Git history.
- Every final hosted evidence record names source commit `c400384a993862e75b29d5c49a1a7374b27f2cc5` and reports a passing result.
- All files listed under `key_files` exist.

## Next Phase Readiness

**Ready for Plan 01-13:** Plan 01-20 has completed the local provider and unfiltered full-suite evidence route and formally resolved this halt. Do not treat this as Phase 1 closure: Plans 16–18, independent phase verification, real-TTY UAT, descriptor-less prohibition acknowledgement, and the security audit remain pending.
