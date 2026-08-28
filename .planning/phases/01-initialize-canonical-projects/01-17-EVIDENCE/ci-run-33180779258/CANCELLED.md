# Cancelled containment matrix run 33180779258

- **Run:** [33180779258](https://github.com/ishk-sftckz/exspecso/actions/runs/33180779258)
- **Branch/ref:** `codex/phase-1-plan-17`
- **Source commit:** `889e5373ee564575d99ee7a4069b66d09ca590d9`
- **Terminal status:** `completed` / `cancelled`
- **Job terminal counts:** 13 `failure`, 67 `cancelled`
- **Cancellation:** after required macOS test-provider jobs consistently failed before release evidence writing because the separately installed AddressSanitizer runtime was not loaded.

This run is diagnostic-only and cannot count as passing matrix evidence. The complete run-log archive is retained as `logs.zip`; all available uploaded per-job artifacts are retained under `artifacts/`. Commit `7c53e13` then tried the compiler-reported ASan runtime only for test-provider execution; that follow-up is separately recorded and also blocked by the runner’s ASan interception failure.
