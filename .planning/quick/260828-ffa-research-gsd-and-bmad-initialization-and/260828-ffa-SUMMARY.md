---
type: quick
id: 260828-ffa
status: complete
completed: 2026-08-28
commit: 2c7f31f
---

# Research summary

Created `docs/research/initialization-runtime-comparison.md` from upstream repositories, extracted published npm packages, official host documentation/source, and current Exspecso code and planning evidence.

## Findings

- GSD published 1.11.0 has 18 installer targets; current source has 19 descriptors including a separate VS Code extension target. Its runtime conversions and capability handling provide a deeper host integration reference.
- BMAD published 6.11.0 has 45 configured platforms; current main/next has 47. Shared native skills and a declarative path registry provide a simpler distribution reference.
- Neither configured platform count establishes universal workflow parity or a universal atomicity guarantee.
- Exspecso implements three selected adapters, minimal canonical artifacts, conservative modification handling, stable ID validation, and recovery mechanics. Actual orientation remains later-phase work.
- Generated Codex skills put an HTML comment before YAML frontmatter; the inspected official Codex parser requires the first line to be `---`. This is a source-level compatibility finding, not a live Codex reproduction. No fix was made.
- Proposed native containment addresses filesystem safety, not AI-host support. Existing explicit approval and independent verification gates remain intact.

## Verification

- Local environment: macOS arm64, Node 20.19.5.
- `npm test -- --run`: 8 files, 62 tests passed.
- `npm run build`: passed.
- Rendered the three compiled adapter outputs and checked their first-line layout.
- All 27 local Markdown links resolve; upstream researcher validated 37 pinned upstream source paths and line ranges. Official Codex parser/loader paths were inspected separately.
- `git diff --check`: passed before committing the research note.
- No upstream installer or workflow was executed. No live coding-host invocation or cross-platform safety test was claimed.

## Scope and workflow

Planning and synthesis were performed inline; the research skill's bounded background agent inspected the two upstream projects and wrote the initial draft. Only the research note and GSD quick-task tracking changed. No source, tests, dependencies, Phase 1 contracts, roadmap, or historical evidence was modified. Phase 1 remains incomplete and revised 01-09 still requires explicit approval.
