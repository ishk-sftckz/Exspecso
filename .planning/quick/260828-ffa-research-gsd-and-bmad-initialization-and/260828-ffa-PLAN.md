---
type: quick
id: 260828-ffa
status: complete
description: Research GSD and BMAD initialization and runtime support versus Exspecso Phase 1
---

# Plan

1. Inspect the requested upstream repositories at recorded revisions: installer entry points, runtime adapters, project bootstrap, update/conflict behavior, and support limitations. Use primary sources and distinguish installation from runtime feature parity.
2. Inspect current Exspecso Phase 1 code, tests, context, verification, and pending containment plans. Separate implemented behavior, test evidence, and unapproved future work.
3. Write one cited comparison in `docs/research/initialization-runtime-comparison.md`, including a practical recommendation and tradeoffs. Check claims, links, and documentation diff; record this quick task without changing Phase 1 status or approval gates.

## Boundaries

- Research/documentation only; no source, test, dependency, runtime installation, or Phase 1 contract changes.
- Temporary upstream checkouts may be inspected but their installers must not run against the user's workspace or home configuration.
- Follow the research skill's background research delegation; planning and final synthesis remain inline.
- Preserve current Phase 1 continuation and the explicit approval requirement for revised 01-09.

## Verification

- Ground comparisons in inspected primary source files and recorded revisions.
- Run existing local checks if useful to establish current implementation evidence; report limits accurately.
- Verify local Markdown targets and `git diff --check`; commit only the research note and quick-task tracking.
