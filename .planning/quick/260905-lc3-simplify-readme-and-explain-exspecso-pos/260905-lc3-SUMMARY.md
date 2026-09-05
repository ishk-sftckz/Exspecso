---
quick_id: 260905-lc3
status: complete
commit: 2be2d0b
files_modified:
  - README.md
---

# Short project introduction and positioning

Replaced the operational README with 331 words of plain Markdown: product category, one ongoing-development note, the actual delivery-supervision problem, neighboring approaches, and a short explanation of spec and harness engineering.

## User-directed scope changes

Removed detailed development/release status, local setup, CLI output, repository-write implementation details, compatibility/CI instructions, and native history. No publication or package-availability claims remain. The README contains no image; branding assets were not deleted. Removed first-person storytelling and retained two product-focused headings.

## Comparison sources

Read current official project READMEs on 2026-09-05:

- https://github.com/mattpocock/skills — small composable engineering skills covering requirements clarification, testing, and review. Used its direct introduction as a format reference without copying its language or adopting its criticisms of other tools.
- https://github.com/open-gsd/gsd-core — discuss, plan, execute, verify, and ship phase loop.
- https://github.com/bmad-code-org/BMAD-METHOD — planning through implementation, correction, and review.

The comparison acknowledges that GSD and BMAD cover execution and verification. It does not classify them as document generators or claim that Exspecso uniquely owns verification/recovery. Exspecso's stated design is grounded in current PROJECT.md and the founder message previously retrieved in this task: separate deterministic bookkeeping from agent reasoning, keep inspectable repository artifacts, predeclare evidence, bound correction, and distinguish continuity from completion. The user explicitly requested the technical term harness, overriding the earlier editorial skill's generic banned-word rule.

## Verification

- Checked each external-project characterization against its official README; all three links were opened during research.
- Verified the plain Markdown README contains one development note, two sections, no images, no installation commands, and none of the rejected operational sections or founder heading.
- Reviewed the prose against the requested voice and no-ai-slop skills while preserving the user-requested technical vocabulary.
- git diff --check passes. No runtime tests needed for this documentation-only change.

README commit: 2be2d0b. GSD quick ran inline; repository release state, Phase status, and ROADMAP.md remain unchanged.
