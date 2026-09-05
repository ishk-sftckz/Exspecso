# Cancelled containment matrix run 33177778618

- **Run:** [33177778618](https://github.com/ishk-sftckz/exspecso/actions/runs/33177778618)
- **Branch/ref:** `codex/phase-1-plan-17`
- **Source commit:** `f9765ff1e89b584f9c0612e607374b53cd3cc18a`
- **Terminal status:** `completed` / `cancelled`
- **Job terminal counts:** 76 `failure`, 4 `cancelled`
- **Cancellation:** explicitly requested after the repeated structural failure showed that jobs declared a Node lane but still installed and executed Node 20.19.0.

This run is diagnostic-only and is never passing matrix evidence. Its complete GitHub run-log archive is retained as `logs.zip`; all available uploaded per-job artifacts are retained under `artifacts/`. The bounded repair in commit `3e26853` makes every POSIX, Windows, and musl job install its declared Node lane before `scripts/write-containment-evidence.mjs` validates the live process version. A newly dispatched run on that commit is required before any success claim.
