# Cancelled containment matrix run 33180071854

- **Run:** [33180071854](https://github.com/ishk-sftckz/exspecso/actions/runs/33180071854)
- **Branch/ref:** `codex/phase-1-plan-17`
- **Source commit:** `3e26853cd0a321f5cfabc2f45750a6599c5f5d19`
- **Terminal status:** `completed` / `cancelled`
- **Job terminal counts:** 9 `failure`, 71 `cancelled`
- **Cancellation:** after the first exact-runtime Linux artifacts identified a common harness failure: the packed-tracer test replaced `PATH` with the Node directory and made `uname` unavailable to the supported native provider.

This run is diagnostic-only and cannot count as passing matrix evidence. The complete run-log archive is retained as `logs.zip`; all available uploaded per-job artifacts are retained under `artifacts/`. Commit `889e537` preserves system probe utilities while keeping the selected Node runtime first on `PATH`. A new full matrix on that commit is required before any success claim.
