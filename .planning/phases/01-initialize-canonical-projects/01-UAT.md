---
status: complete
phase: 01-initialize-canonical-projects
source: [01-VERIFICATION.md]
started: 2026-09-04T17:51:45Z
updated: 2026-09-05T05:34:26Z
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
  artifacts: []
  missing: []
