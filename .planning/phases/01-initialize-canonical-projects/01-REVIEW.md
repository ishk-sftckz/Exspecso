---
phase: 01-initialize-canonical-projects
reviewed: 2026-08-28T11:35:01Z
depth: standard
files_reviewed: 44
files_reviewed_list:
  - .github/workflows/containment.yml
  - README.md
  - native/build.mjs
  - native/contained-fs-posix.cc
  - native/contained-fs-win.cc
  - native/contained-fs.cc
  - native/support-matrix.json
  - package.json
  - scripts/capture-filesystem-observation.mjs
  - scripts/containment-evidence.mjs
  - scripts/run-local-containment-gate.mjs
  - scripts/write-containment-evidence.mjs
  - src/adapters/managed-file.ts
  - src/adapters/registry.ts
  - src/artifacts/resolve.ts
  - src/artifacts/schema.ts
  - src/artifacts/templates.ts
  - src/artifacts/validate.ts
  - src/cli/arguments.ts
  - src/cli/main.ts
  - src/errors/diagnostic.ts
  - src/filesystem/contained-fs.ts
  - src/filesystem/ownership.ts
  - src/filesystem/recovery.ts
  - src/filesystem/safe-path.ts
  - src/filesystem/support-matrix.ts
  - src/filesystem/transaction.ts
  - src/init/completion.ts
  - src/init/plan.ts
  - src/init/run-init.ts
  - src/init/runtime-selection.ts
  - tests/helpers/containment-fixture.ts
  - tests/helpers/git-fixture.ts
  - tests/integration/init-codex-tracer.test.ts
  - tests/integration/init-rerun.test.ts
  - tests/integration/minimal-artifacts.test.ts
  - tests/integration/transaction-recovery.test.ts
  - tests/integration/validation-errors.test.ts
  - tests/unit/adapters.test.ts
  - tests/unit/artifacts.test.ts
  - tests/unit/contained-fs.test.ts
  - tests/unit/containment-evidence.test.ts
  - tests/unit/containment-support.test.ts
  - tests/unit/runtime-selection.test.ts
findings:
  critical: 4
  warning: 1
  info: 0
  total: 5
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-08-28T11:35:01Z
**Depth:** standard
**Files Reviewed:** 44
**Status:** issues_found

## Summary

The filesystem promotion path is substantially capability-based, but interrupted recovery falls back to unsafe pathname writes. The containment evidence controls are also self-attesting: a test provider or fabricated record can satisfy the aggregate gate, and local provenance can claim an uncommitted build is from `HEAD`.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Recovery reintroduces the pathname substitution vulnerability

**Classification:** BLOCKER

**File:** `src/filesystem/recovery.ts:81-95`

**Issue:** `restorePrior` performs `rm()` and `writeFile()` through reconstructed path strings after `validateEvidence` has finished. The existing safety check is therefore a time-of-check/time-of-use check: an attacker can replace a target or one of its ancestor directories with a symlink between validation and `writeFile`, causing recovery to write the journal backup outside the repository. New-file recovery at line 85 does not perform an in-function safe-target check at all. This defeats the containment guarantee precisely during the fault-recovery path.

**Fix:** Restore through `openContainedFilesystem(root)` capabilities, just as `commitTransaction` promotes files. Reopen every parent by validated components, verify the currently opened destination is the expected regular file/hash, create a private sibling, write and sync the backup, then use handle-relative `replace`. For a null preimage, use the capability's handle-relative unlink after rechecking the entry type. Add a deterministic recovery-boundary substitution test for leaf and ancestor swaps.

### CR-02: Evidence can label an instrumented test provider as a release provider

**Classification:** BLOCKER

**File:** `scripts/write-containment-evidence.mjs:13-18,40-51`

**Issue:** The writer unconditionally emits `evidenceMode: "release"` (line 46), but never verifies `manifest.variant` or `build.variant` is `"release"`. Running `native/build.mjs --variant test` and then this writer produces release-labelled evidence for an instrumented provider. The aggregate only checks the self-reported evidence mode, so it will accept that record. This permits approval evidence for a package different from the claimed production release.

**Fix:** Before emitting any record, require `manifest.variant === "release"`, `build.variant === "release"`, and that exactly one manifest target matches the requested support-row ID. Derive `evidenceMode` from the verified variant rather than a hard-coded string. Add a test that a test-variant manifest/provenance pair is rejected.

### CR-03: The evidence aggregate trusts forged receipts instead of authenticating artifacts

**Classification:** BLOCKER

**File:** `scripts/containment-evidence.mjs:28-30,51-87`

**Issue:** The aggregate excludes the copied `provider-manifest.json`, `build-provenance.json`, and `full-suite.json`, then validates only values supplied in arbitrary evidence JSON records. It never reads a provider binary, verifies a manifest hash against its bytes, verifies build provenance against the manifest/provider, or validates the test report. The supplied unit test demonstrates the bypass: `completeRecord()` at `tests/unit/containment-evidence.test.ts:25-63` creates synthetic hashes and observations, and the aggregator accepts the complete fabricated matrix at lines 127-130. Consequently, `plan_complete: true` does not prove the claimed build or test happened.

**Fix:** Make each evidence bundle self-verifying: load the manifest, provenance, full-suite report, and selected binary from a row-specific artifact directory; hash their raw bytes; bind the provider target, provenance binary hash, manifest hash, source commit, and tarball to one another; and reject any extra/missing files. The aggregate should consume these artifacts directly rather than accepting self-reported hashes. Replace the synthetic success fixture with real, internally consistent fixture files and retain forged-record rejection cases.

### CR-04: Local provenance binds dirty sources to a clean Git commit

**Classification:** BLOCKER

**File:** `scripts/run-local-containment-gate.mjs:22,42,65-66`

**Issue:** The local gate records `git rev-parse HEAD` as `sourceCommit`, then compiles the current working tree without requiring that tree to be clean. `native/build.mjs` accepts that commit via `EXSPECSO_SOURCE_COMMIT` at `native/build.mjs:123-129`; the gate subsequently verifies only that the self-reported commit strings match. An uncommitted native or TypeScript change can therefore be built, tested, and retained as evidence for the previous committed snapshot.

**Fix:** Fail before downloading/building unless the relevant source tree is clean (`git diff --quiet` plus `git diff --cached --quiet`, and explicitly account for untracked reviewed inputs), or replace the commit-only claim with a verified source-tree digest and have the aggregate validate it. Add a test invoking the gate from a deliberately modified tracked source and asserting it fails before producing evidence.

## Warnings

### WR-01: The local gate overwrites the caller’s package build outputs

**Classification:** WARNING

**File:** `scripts/run-local-containment-gate.mjs:42-43`

**Issue:** The gate builds with `--out .` and runs `npm run build` in the repository root. It overwrites `dist/native/*` and TypeScript output in the caller’s checkout, including any provider for another support row, and does not restore those outputs. A failed or exploratory evidence run can therefore leave a misleading package tree for later packing or tests.

**Fix:** Build in a temporary staged package directory, as the installation fixture does, and run the suite/pack verification against that directory. Copy only verified evidence artifacts to `--evidence-dir`; leave the repository checkout unchanged. Add an assertion that a gate run leaves a pre-existing `dist` inventory byte-identical.

---

_Reviewed: 2026-08-28T11:35:01Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
