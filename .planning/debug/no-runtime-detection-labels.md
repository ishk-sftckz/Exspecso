---
status: resolved
issue: G-01-1
created: 2026-09-04T13:53:58Z
updated: 2026-09-04T13:53:58Z
goal: find_root_cause_only
---

# Remove Runtime Detection Labels

## Symptoms

expected: Runtime selection presents Claude Code, OpenAI Codex, and OpenCode as equal unchecked options without detecting installed agents; only the user's submitted selection controls adapter installation.
actual: The selector correctly starts every option unchecked and installs only the submitted subset, but environment-based detection adds `(detected)` labels.
errors: None reported; initialization otherwise works.
reproduction: Phase 1 UAT Test 1, using a real TTY with `CLAUDECODE`, `CODEX`, and `OPENCODE` present.
timeline: Discovered as a product-intent revision during UAT on 2026-09-04.

## Evidence

- `src/cli/main.ts` imports `detectAgents()` and passes its environment-derived result into `resolveSelectedAgents()` for interactive selection.
- `src/init/runtime-selection.ts` maps `CLAUDECODE`/`CLAUDE_CODE`, `CODEX_HOME`/`CODEX`, and `OPENCODE` to runtime IDs, then appends ` (detected)` in `choicesFor()`.
- `tests/unit/runtime-selection.test.ts` explicitly asserts the detection labels and the exported `detectAgents()` behavior.
- `.planning/phases/01-initialize-canonical-projects/01-CONTEXT.md` decision D-05, `.planning/REQUIREMENTS.md` SETUP-04, and Phase 1 Roadmap success criterion 2 currently require or describe detection suggestions.

## Resolution

root_cause: "The implementation intentionally follows the previously approved detection-as-label metadata contract. The UAT issue is a user-directed product-intent revision, not a failure of the current code: environment detection is wired from the CLI through `detectAgents()` into prompt label rendering and is locked into tests and planning artifacts."
fix_direction: "Revise the active Phase 1 intent and verification contract to make the checklist detection-free; remove environment detection and detected-agent plumbing from the CLI/runtime-selection boundary; update tests to prove stable unchecked labels regardless of environment; rebuild and rerun automated plus real-TTY verification. Preserve non-interactive `--agent` behavior and selected-subset-only writes."
files_involved:
  - .planning/ROADMAP.md
  - .planning/REQUIREMENTS.md
  - .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md
  - .planning/phases/01-initialize-canonical-projects/01-VERIFICATION.md
  - src/cli/main.ts
  - src/init/runtime-selection.ts
  - tests/unit/runtime-selection.test.ts

