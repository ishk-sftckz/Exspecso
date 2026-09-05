---
quick_id: 260828-haj
status: complete
verification: partial-native-containment-unavailable
date: 2026-08-28
implementation_commit: 91eddbb
---

# Generated skill frontmatter compatibility

The scoped implementation and available adapter/discovery checks are complete. Full native init migration verification remains unavailable on this host; this summary does not establish Phase 1 completion or native containment acceptance.

## Changes

- Claude Code and Codex generated skills now start with their existing YAML frontmatter. The managed comment follows its closing delimiter.
- Version 1 fingerprint semantics are unchanged: SHA-256 covers every original byte, including frontmatter and instructions, excluding only the inserted managed comment. No separate manifest or new dependency was added.
- Ownership inspection accepts the original marker-first format and the new frontmatter-first format. Only those two marker locations are recognized; arbitrary markers in prose do not grant ownership.
- Pristine legacy adapters remain eligible for migration only when selected. Metadata/body edits, malformed markers, unsupported versions, and unowned files still conflict. Replacement and stale-preimage validation continue through the unchanged init plan/transaction paths.
- OpenCode output remains byte-identical. Portable IDs, invocation sigils, selected-target behavior, canonical artifacts, containment implementation, dependencies, ROADMAP, and all Phase 1 approval/closure gates are unchanged.

## Verification

| Check | Result |
|---|---|
| RED: new adapter unit regressions against original implementation | 7 failed, 10 passed; first-line frontmatter and new-layout ownership were missing |
| GREEN: adapter rendering, both ownership layouts, fingerprints, migration preflight, conflicts, explicit replacement, stale preimages | 25 passed; 7 unrelated/native-init cases excluded by the explicit test-name filter |
| `npm run build` | Passed |
| Full local suite | 60 passed, 34 failed; no skipped tests. Native provider/headers unavailable; dependent init/recovery checks fail or time out |
| Native Codex metadata discovery | Passed on `codex-cli 0.150.0-alpha.8` |
| Native Claude Code metadata discovery | Passed on `2.1.207 (Claude Code)` |
| `git diff --check` and discovery script syntax check | Passed |

The migration preflight tests directly seed temporary files and exercise `buildInitPlan`/`validateInitPlan`; they do **not** claim native filesystem promotion. End-to-end migration/idempotence tests for both runtimes are added to the existing rerun suite, but remain blocked at initial setup on this machine. Existing rerun tests already failed at baseline before this change.

`regression-results.json` retains the final full-suite counts, per-suite failures, and hashes of the three changed implementation/test files. A final rerun with normal test timeouts reproduced 60 passed / 34 failed after the test diagnostics and portable snapshot keys were finalized.

Host: Node 20.19.5, darwin arm64, macOS 26.5.1 / 25F80. The direct loader diagnostic is `EXSPECSO_CONTAINMENT_UNAVAILABLE` for missing `dist/native/manifest.json`. Installed-provider fixture builds additionally lack the approved Node header archive. Even supplying the recorded provider would not authorize this host: its OS does not match the unchanged approved macOS row. No provider mock, OS spoof, gate bypass, dependency download, remote CI dispatch, or containment modification was used.

### Native discovery evidence

`native-discovery.mjs` writes the actual built adapter renderer output into disposable Git repositories, queries installed runtime metadata, checks that skill bytes remain unchanged, and deletes the temporary repositories. It sends no user prompts or model turns. `native-discovery.json` records versions, input hashes, and filtered native responses.

- Codex: stdio app-server `initialize` → `skills/list` with `forceReload: true`, filtering by the exact real skill path. Old layout: no skill and `missing YAML frontmatter delimited by ---`. New layout: enabled repository skill `exspecso-start`, exact description, no parse errors.
- Claude: stream-JSON SDK control `initialize`, project settings only, temporary Claude configuration directory, no MCP servers or tools, session persistence disabled. Old layout: command appears by directory name but its description is the ownership comment. New layout: intended name and description, with the runtime's `(project)` suffix. An initial `--bare` probe omitted both layouts from the command list; final evidence uses normal project skill discovery.
- These observations establish metadata discovery, not model invocation, orientation workflow implementation, or completed native init transactions.

Protocol references: Codex bindings were generated from the installed binary using `codex app-server generate-ts`. Claude's [official control protocol implementation](https://github.com/anthropics/claude-agent-sdk-python/blob/main/src/claude_agent_sdk/_internal/query.py) and [skill documentation](https://code.claude.com/docs/en/skills) informed the probe; the committed evidence is from local runtime responses.

### Reproduce

```sh
npm run build
npm test -- --run tests/unit/adapters.test.ts tests/integration/init-rerun.test.ts -t 'native adapter registry|frontmatter-aware managed fingerprints|managed adapter ownership|skill migration preflight'
node .planning/quick/260828-haj-fix-generated-skill-frontmatter-compatib/native-discovery.mjs
npm test -- --run
```

The full suite requires the existing approved native-provider build environment. Re-run the end-to-end migration tests there before claiming native init acceptance.

## Scope preservation

Code/test commit: `91eddbb`. The pre-existing changes in `.github/workflows/containment-windows-parity.yml`, `tests/helpers/containment-fixture.ts`, `tests/integration/init-codex-tracer.test.ts`, and `tests/fixtures/` were not edited or staged by this task. Phase 01 Plan 10 Task 3 remains active; independent phase verification, real-TTY UAT, prohibition acknowledgement, and security closure remain required.
