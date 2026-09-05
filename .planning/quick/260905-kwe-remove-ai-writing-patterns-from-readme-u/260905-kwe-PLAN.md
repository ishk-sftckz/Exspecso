---
quick_id: 260905-kwe
type: quick
description: Remove AI writing patterns from README using no-ai-slop
files_modified:
  - README.md
autonomous: true
---

# Edit the README

## Task 1

- **Files:** `README.md`
- **Action:** Apply the requested no-ai-slop skill and eval.md. Remove the staged opening, slogan, redundant explanations, and padded headings. Preserve practical instructions, factual qualifications, precise technical terms where needed, and the underlying product purpose. Keep the draft's direct address and useful explanatory passages.
- **Verify:** Review the full edit against eval.md. Compare code blocks with the previous README, validate relative links, and run git diff --check. No new behavior or command changes require runtime tests.
- **Done:** The README reads as a direct project introduction and usable reference without an invented narrator or promotional framing.

Execute inline through GSD quick; commit the README, then record the summary and STATE.md without changing phase status or ROADMAP.md.
