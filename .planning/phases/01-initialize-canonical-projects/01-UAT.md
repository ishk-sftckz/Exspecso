---
status: diagnosed
phase: 01-initialize-canonical-projects
source: [01-VERIFICATION.md]
started: 2026-09-04T17:51:45Z
updated: 2026-09-05T05:49:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Real TTY runtime selection

expected: Run the packed initializer in a real TTY with ambient agent variables set. Confirm all three runtime choices are equal and unchecked with no detection labels or suggestions; empty or cancelled input writes nothing; and a submitted subset writes only its selected native adapter files.
result: issue
reported: "It works but i dont want the message to be like this: For Claude Code, invoke /exspecso-start; For OpenAI Codex, invoke $exspecso-start; For OpenCode, invoke /exspecso-start. Just tell that the exspecso successfully initializedd or installed"
severity: minor

## Summary

total: 1
passed: 0
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-01-2
  truth: "Successful initialization prints only a concise confirmation that Exspecso was initialized, without per-runtime invocation instructions."
  status: failed
  reason: "User reported: It works but i dont want the message to be like this: For Claude Code, invoke /exspecso-start; For OpenAI Codex, invoke $exspecso-start; For OpenCode, invoke /exspecso-start. Just tell that the exspecso successfully initializedd or installed"
  severity: minor
  test: 1
  root_cause: "G-01-2 is a user-directed revision of the approved D-08/SETUP-08 completion-output contract. The implementation deliberately prints canonical and selected-runtime invocation guidance through one formatter; the new concise-only preference supersedes that locked behavior."
  artifacts:
    - path: "src/init/completion.ts"
      issue: "formatCompletion() intentionally renders the canonical operation plus one native invocation line per selected runtime."
    - path: "src/init/run-init.ts"
      issue: "Successful committed and no-op initialization writes formatCompletion(selectedAgents) to stdout."
    - path: "tests/unit/adapters.test.ts"
      issue: "The focused subset regression locks the existing per-runtime completion lines."
    - path: "tests/integration/installed-cli.test.ts"
      issue: "Installed-package assertions expect runtime-specific invocation text."
    - path: "README.md"
      issue: "Package documentation promises canonical-first, runtime-specific completion guidance."
    - path: ".planning/phases/01-initialize-canonical-projects/01-CONTEXT.md"
      issue: "D-08 locks canonical plus selected-runtime translations."
  missing:
    - "Record the user's concise-success preference as a narrow supersession of D-08 and SETUP-08."
    - "Replace the per-runtime completion formatter with one concise successful-initialization message for both committed and no-op paths."
    - "Update focused unit, installed-package, and documentation assertions to the concise output contract."
  debug_session: ".planning/debug/phase-1-concise-completion-message.md"
