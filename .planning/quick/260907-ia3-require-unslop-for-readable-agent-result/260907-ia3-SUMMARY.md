---
status: complete
task: 260907-ia3
date: 2026-09-07
commit: 9643862
---

# Require readable agent results

AGENTS.md now requires the installed unslop skill for replies and written research, context, plans, reviews, and summaries. The instruction asks agents to explain results before technical detail, distinguish facts from proposals, preserve exact contracts, and check readability before delivery.

The rule uses one skill pointer and four ordered steps, following writing-for-agents. It sits outside generated GSD blocks.

## Verification

- Reviewed the trigger, skill lookup, output scope, and completion check against writing-for-agents and unslop.
- Confirmed that the local unslop fallback exists.
- Compared the original AGENTS.md content with the preserved portion byte for byte.
- git diff --check passed.
- Application tests were unnecessary for this instruction-only change.

## Execution

Completed planning and execution inline because the edit had no independent work to delegate. Retained the quick-task plan, atomic change commit, summary, and state record.

## Result

Commit 9643862 contains the AGENTS.md change. Existing project contracts and generated instructions are preserved.
