---
status: testing
phase: 01-initialize-canonical-projects
source: [01-VERIFICATION.md]
started: 2026-08-30T08:08:17Z
updated: 2026-09-04T17:42:12Z
---

## Current Test

number: 1
name: Real TTY runtime selection
expected: |
  Claude Code, OpenAI Codex, and OpenCode appear as equal unchecked choices with no detection labels or suggestions. Empty or cancelled input writes nothing, and a submitted subset writes only its selected native adapter files.
awaiting: user response

## Tests

### 1. Real TTY runtime selection

expected: Run the packed initializer in a real TTY with ambient agent variables set. Confirm all three runtime choices are equal and unchecked with no detection labels or suggestions; empty or cancelled input writes nothing; and a submitted subset writes only its selected native adapter files.
result: pending

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
