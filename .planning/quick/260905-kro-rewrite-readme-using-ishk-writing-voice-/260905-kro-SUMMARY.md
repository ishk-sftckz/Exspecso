---
quick_id: 260905-kro
status: complete
commit: 0ee14a7
files_modified:
  - README.md
---

# README voice rewrite

Rewrote the README using the requested Ishk Writing Voice DNA skill. The opening gives the reader a concrete session-continuity problem before introducing Exspecso. Sections now explain current availability, local initialization, write protection, compatibility checks, and historical native material in reader-facing language.

## Grounding and scope corrections

- Preserved supported Node ranges, explicit runtime selection, additive reruns, exact success output, filesystem/recovery limits, representative CI coverage, package checks, and historical-plan boundaries.
- Replaced the stale pending-Phase-1-verification statement with the current STATE.md position: Phase 1 complete, Phase 2 ready for planning.
- Replaced the unqualified registry invocation with local checkout instructions because package.json is private and Phase 1 excludes publication.
- Distinguished implemented initialization/start adapters from the planned full workflow using source and PROJECT.md requirements. Added actual canonical filenames from init planning and minimal-artifact tests.

## Verification

- Reviewed every README section against the voice skill's seven completion checks; no invented anecdotes, attribution, or unsupported completion claims.
- Checked claims against package.json, current STATE.md/PROJECT.md, src/adapters/registry.ts, src/init/plan.ts, src/init/completion.ts, src/cli/main.ts, initialization tests, and .github/workflows/ci.yml.
- `npm run build`: passed.
- Disposable Git repository smoke check: documented Claude/Codex flags initialize from a nested directory at the Git root; initial run and no-op rerun both return exact success stdout and no stderr; resulting inventory contains exactly two canonical files and the two selected adapters.
- Relative README links and `git diff --check`: passed.
- Build and smoke check used the session's Node 20.19.5. These are local command checks, not evidence extending or certifying the documented Node support matrix. The full test suite and CI matrix were not rerun for this prose-only change.

## Workflow

Executed inline through the GSD quick Codex fallback. README committed as `0ee14a7`; task artifacts and STATE.md recorded separately. No source behavior, ROADMAP.md, or phase-completion state changed.
