# Cancelled containment matrix run 33181290104

- **Run:** [33181290104](https://github.com/ishk-sftckz/exspecso/actions/runs/33181290104)
- **Branch/ref:** `codex/phase-1-plan-17`
- **Source commit:** `7c53e13fceb5bfd196220fd1e62a552161ade7a0`
- **Terminal status:** `completed` / `cancelled`
- **Job terminal counts:** 16 `failure`, 64 `cancelled`
- **Representative required failure:** [ENV-MA / Node 24.0.0, job 98882838218](https://github.com/ishk-sftckz/exspecso/actions/runs/33181290104/job/98882838218) completed the real release tracer (13 passing tests) but the separate test-provider ASan process aborted with `Interceptors are not working` after the workflow exported the exact clang-reported `DYLD_INSERT_LIBRARIES` runtime.

This run is diagnostic-only and cannot count as passing matrix evidence. The complete run-log archive is retained as `logs.zip`; all available uploaded per-job artifacts are retained under `artifacts/`; the direct representative job log is retained as `ci-run-33181290104-job-98882838218.log`. No row/lane was downgraded or skipped. The three bounded Task 2 repair attempts are exhausted, so a new explicit decision is required before changing the macOS sanitizer execution design or proceeding with another matrix.
