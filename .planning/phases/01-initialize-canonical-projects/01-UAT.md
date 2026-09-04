---
status: diagnosed
phase: 01-initialize-canonical-projects
source: [01-VERIFICATION.md]
started: 2026-08-30T08:08:17Z
updated: 2026-09-04T14:01:19Z
---

## Current Test

[testing complete]

## Tests

### 1. Real TTY runtime selection

expected: Run the packed initializer in a real TTY with detection enabled and confirm that choices start unchecked, detection affects labels only, empty or cancelled input writes nothing, and a submitted subset writes only its selected native adapter files.
result: issue
reported: "Okay it works, but after tested, i think, we should not detect the installed ai agents, we just provide options and let user chooose what ai agent to install."
severity: minor

## Summary

total: 1
passed: 0
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-01-1
  truth: "Runtime selection presents all supported AI-agent options unchecked without detecting or labeling installed agents; only the user's submitted selection controls installed adapters."
  status: failed
  reason: "User reported: Okay it works, but after tested, i think, we should not detect the installed ai agents, we just provide options and let user chooose what ai agent to install."
  severity: minor
  test: 1
  root_cause: "The implementation intentionally follows the previously approved detection-as-label contract: main.ts passes environment-derived detectAgents() output into runtime selection, choicesFor() appends detected labels, and tests plus Phase 1 planning artifacts require that behavior. The UAT finding is therefore a user-directed product-intent revision, not a malfunction."
  artifacts:
    - path: "src/cli/main.ts"
      issue: "Interactive initialization calls detectAgents() and passes the result into runtime selection."
    - path: "src/init/runtime-selection.ts"
      issue: "Environment variables are converted to detected runtime IDs and rendered as `(detected)` prompt labels."
    - path: "tests/unit/runtime-selection.test.ts"
      issue: "Tests lock in detection labels and the detectAgents() API."
    - path: ".planning/REQUIREMENTS.md"
      issue: "SETUP-04 currently requires suggested runtime selections when agents are detected."
    - path: ".planning/ROADMAP.md"
      issue: "Phase 1 success criterion 2 currently describes choosing detected integrations."
    - path: ".planning/phases/01-initialize-canonical-projects/01-CONTEXT.md"
      issue: "Locked decision D-05 currently preserves detection as informational label metadata."
  missing:
    - "Revise the active Phase 1 intent and verification contract so every supported runtime is presented equally without environment detection or detected labels."
    - "Remove detectAgents() and detectedAgents plumbing from the CLI and runtime-selection boundary while preserving unchecked choices, cancellation, non-TTY flags, and selected-subset-only writes."
    - "Replace detection-specific tests with coverage proving stable labels regardless of ambient agent environment, then rerun automated and real-TTY verification."
  debug_session: ".planning/debug/no-runtime-detection-labels.md"
