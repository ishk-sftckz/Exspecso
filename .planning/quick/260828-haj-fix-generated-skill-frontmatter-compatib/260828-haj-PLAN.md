---
type: quick
quick_id: 260828-haj
status: planned
files_modified:
  - src/adapters/managed-file.ts
  - tests/unit/adapters.test.ts
  - tests/integration/init-rerun.test.ts
autonomous: true
---

# Fix generated skill frontmatter compatibility

## Scope and constraints

Claude Code and Codex SKILL.md files must begin with YAML frontmatter while retaining the self-contained versioned ownership marker and SHA-256 fingerprint. The fingerprint must cover the frontmatter as well as the instruction body. Existing pristine marker-first adapters must migrate on an explicitly selected rerun; modified, unowned, malformed, and unsupported-version files must retain existing conflict/replacement protection. Unselected adapters and canonical artifacts must remain unchanged. OpenCode output must remain byte-compatible.

No dependency, containment, Phase 1 plan, approval, or completion-gate changes. Pre-existing changes in containment workflow/tests/fixtures belong to other work and must not be edited or staged. Execute inline with the quick workflow's planning, verification, atomic code commit, summary, and state tracking.

## Task 1 — Regression-driven adapter layout and migration fix

- Files: `src/adapters/managed-file.ts`, `tests/unit/adapters.test.ts`, `tests/integration/init-rerun.test.ts`.
- Action: Add failing frontmatter-first and full-content fingerprint tests; implement marker placement immediately after leading frontmatter and inspect only the supported legacy/new marker positions. Extend existing rerun tests for both runtimes, safe legacy migration, unchanged canonical/unselected bytes, metadata/body edits, invalid ownership, explicit replacement, and stale preimages. Preserve version-1 hash semantics and non-frontmatter rendering.
- Verify: Observe the new regression failure before implementation; run focused adapter/rerun suites, TypeScript build, and full regression suite.
- Done: Both skill outputs are discoverable-shaped, both layouts retain ownership integrity, and reruns cannot silently replace conflicts.

## Task 2 — Native discovery and evidence

- Files: bounded native discovery check/evidence in this quick-task directory if needed.
- Action: Check installed Codex and Claude Code discovery using actual generated files in disposable repositories, without model inference or changing the user's runtime configuration. Record host versions, protocol, discovered name/description, negative control where supported, and any limitations. Do not treat parser-only tests as native runtime evidence.
- Verify: Native metadata discovery returns `exspecso-start` with the expected description for each available runtime; inspect the final diff for scope and preserve existing Phase 1 gates.
- Done: Verified implementation committed atomically; SUMMARY and STATE record exact results and any unavailable native checks, without advancing Phase 1.
