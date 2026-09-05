---
status: investigating
trigger: PR 2 Windows Node 24 CI fails eight tests after Phase 1 completion.
created: 2026-09-05
updated: 2026-09-05
---

## Symptoms

expected: All supported CI rows pass the full active suite.
actual: Linux and macOS pass; Windows fails eight tests in installed-cli, minimal-artifacts, and transaction-recovery.
errors: spawn EINVAL, CRLF workflow assertions, backslash inventory mismatch, two 20-second killed-child timeouts.
reproduction: GitHub Actions run 33951046142, job 101265741391, head 586c7cca1d509e32b9c300436a20bda26e184bac.

## Current Focus

hypothesis: Test helpers launch npm shell shims directly, and two assertions assume POSIX checkout formatting.
next_action: Verify the portable helpers and Codacy scope, then check the actual Windows CI result.

## Evidence

- Windows job 101265741391: four package tests fail at spawn(npm.cmd) with EINVAL; two recovery tests launch npm without an error handler and time out after ENOENT.
- Workflow content differs only by CRLF; minimal-artifact inventory differs only by native backslash separators.
- Baseline on local macOS: 10 test files and all 95 tests pass.
- Codacy check 101266009551 reports 57 issues, but GitHub publishes only 50 annotations. Official Codacy MCP configured globally; account token pending.
- Every published Codacy annotation is in planning records or native containment source/scripts retired by approved D-21. A root .codacy.yml excludes that historical material while keeping active source and tests analyzed; no analyzer rule or quality threshold changes.
- First local rerun exposed unrelated package setup flakiness: repeated builds/installs exceeded individual 5/10-second test budgets. One read-only installation now belongs to a bounded beforeAll hook; independent repository fixtures and the two-second CLI interruption checks remain unchanged.
- Added subprocess regressions for literal arguments/spaces, failed spawn rejection, and nonzero exit diagnostics.
