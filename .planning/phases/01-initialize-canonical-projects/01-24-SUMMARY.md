---
phase: 01-initialize-canonical-projects
plan: 24
subsystem: initialization
tags: [typescript, node, cli, runtime-selection, package, vitest]
requires:
  - phase: 01-initialize-canonical-projects
    provides: "Explicit selected-subset runtime adapter initialization"
provides:
  - "Detection-free equal runtime choices for Claude Code, OpenAI Codex, and OpenCode"
  - "Ambient-environment-independent packed CLI selection evidence"
affects: [phase-01-uat, initialization, runtime-adapters]
tech-stack:
  added: []
  patterns:
    - "Fixed supported-runtime registry is the sole interactive prompt model"
    - "Only submitted AgentId values authorize selectedAgents and adapter output"
key-files:
  created: []
  modified:
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md
    - .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md
    - src/cli/main.ts
    - src/init/runtime-selection.ts
    - tests/unit/runtime-selection.test.ts
    - tests/integration/installed-cli.test.ts
decisions:
  - "G-01-1 supersedes only D-05's installed-agent detection label clause; fixed ordering, unchecked options, cancellation, and explicit selection authority remain unchanged."
  - "Runtime selection must not read ambient agent-presence variables; flags or prompt submission are the exclusive adapter-write authority."
metrics:
  duration: 3min 20sec
  completed: 2026-09-04
status: complete
actuals:
  tokens: 3492
  tasks: 2
  commits: 3
---

# Phase 01 Plan 24: Detection-Free Runtime Selection Summary

**The initializer now offers all three supported runtimes as equal unchecked choices and ignores ambient agent variables completely; only submitted selections create adapters.**

## Accomplishments

- Revised the active Phase 1 Roadmap, SETUP-04, and D-05 for the G-01-1 detection-free selection decision without altering D-06 through D-08.
- Removed `detectAgents`, detected-agent inputs, conditional prompt labels, and CLI environment plumbing while preserving fixed registry order, empty-selection retry, cancellation, and repeatable non-TTY flags.
- Added packed-install evidence that explicit Codex selection produces identical config, adapter tree, adapter bytes, and completion guidance with common Claude Code, Codex, and OpenCode environment variables present or absent.

## Task Commits

1. **Task 1 RED: Detection-free selector regression** — `9e084a0` (`test`)
2. **Task 1 GREEN: Remove runtime detection from selection** — `0f1660f` (`feat`)
3. **Task 2: Ambient-independent installed CLI evidence** — `f1b7145` (`test`)

## Verification

| Gate | Result |
| --- | --- |
| Task 1 RED focused selector test | PASS — failed as intended before production edits: received `OpenAI Codex (detected)` rather than `OpenAI Codex` |
| `npm test -- --run tests/unit/runtime-selection.test.ts` | PASS — 1 file, 4 tests |
| `npm test -- --run tests/unit/runtime-selection.test.ts tests/integration/installed-cli.test.ts` | PASS — 2 files, 9 tests |
| `npm test -- --run` | PASS — 10 files, 92 tests |
| `npm run build` | PASS — `tsc -p tsconfig.json` |
| `npm pack --dry-run --json` | PASS — 43 pure TypeScript/Node package entries |
| Removed-source scan | PASS — no `detectAgents`, `detectedAgents`, agent-presence environment names, or `(detected)` label remain under `src/` |

## Coverage

| ID | Description | Evidence | Human judgment |
| --- | --- | --- | --- |
| G-01-1 automated | Prompt choices use the fixed Claude Code, OpenAI Codex, OpenCode registry and selected subsets remain explicit. | Unit selector coverage and source-surface scan | No |
| G-01-1 installed | Ambient Claude Code, Codex, and OpenCode variables cannot alter explicit Codex config, adapter tree, bytes, or guidance. | Packed installed-CLI regression | No |
| G-01-1 real TTY | Actual terminal labels are plain and unchecked; empty retry and cancellation write nothing; selected subset creates only its adapters. | Renewed `.planning/phases/01-initialize-canonical-projects/01-UAT.md` Test 1 | Yes — still required |

## Decisions Made

- The UAT decision removes detection from presentation as well as selection authority: no compatibility API or dormant environment helper remains.
- Automated evidence does not replace the renewed real-TTY UAT; Phase 1 remains open pending that human observation and the separate Plan 01-25 gap closure.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Next Phase Readiness

The G-01-1 implementation and automated evidence are complete. Renewed real-TTY UAT must still verify terminal rendering, empty retry, cancellation without writes, and subset-only adapters. Plan 01-25 remains independent and was not executed or modified.

## Self-Check: PASSED

- Confirmed all seven modified task files exist.
- Confirmed all three Task commits exist in Git history.
