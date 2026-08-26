# Walking Skeleton — Exspecso

**Phase:** 1
**Generated:** 2026-08-26

## Capability Proven End-to-End

In a temporary Git repository, a user can run a locally packed `npx exspecso init --agent codex` command and receive the durable canonical project foundation plus the selected Codex-native `exspecso-start` adapter and exact next-operation guidance.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | One Node.js `>=20` TypeScript npm package with an `exspecso` bin | Matches the canonical one-package constraint and proves the published invocation shape locally. |
| Canonical data layer | Ordinary JSON and Markdown below `.exspecso/`, written through a deterministic filesystem transaction | Repository files remain inspectable canonical truth; no database, cloud state, export, or duplicate projection is introduced. |
| Runtime orchestration | Thin native adapter generators behind one shared `exspecso-<operation>` registry | Claude Code, Codex, and OpenCode keep native discovery syntax without forking operation identity or artifact semantics. |
| Authentication | None | Phase 1 is a local repository initializer with no account, server, or remote trust boundary. |
| Execution target | Local Git repository via `npm pack`/`npx` fixture execution | This CLI/package phase has no browser or deployment surface; the packaged local run is the complete end-to-end target. |
| Directory layout | `src/cli`, `src/init`, `src/artifacts`, `src/filesystem`, `src/adapters`, `src/errors`, with unit/integration tests | Keeps canonical mechanics, transactional storage, and runtime presentation separated while remaining one package. |

## Stack Touched in Phase 1

- [x] Package scaffold: Node/TypeScript build, npm bin, and Vitest runner
- [x] CLI routing: one real `init` command with strict repeatable `--agent` inputs
- [x] Canonical data: real JSON/Markdown writes and subsequent reads/validation
- [x] Runtime adapter: one selected native adapter in the tracer, expanded to all three supported runtimes
- [x] Local execution: packed-package invocation inside isolated Git fixtures
- [ ] Browser UI — not applicable to the approved local CLI scope
- [ ] Database — prohibited by the canonical repository-file model
- [ ] Remote deployment — not applicable to the local-first package phase

## Out of Scope (Deferred to Later Slices)

- Project orientation and `/exspecso-start` behavior beyond installing its adapter
- Materialized Roadmap, Phase, Spec, Plan, Task, trace, research, or report artifacts
- Deterministic readiness/status computation and dependency graph validation
- Delivery, recovery loops above filesystem transaction recovery, review, and cross-runtime conformance
- Browser UI, cloud control plane, authentication, accounts, synchronization, or database storage

## Subsequent Slice Plan

- Phase 2: Build and prove deterministic project-truth resolution, validation, readiness, and next-action reconstruction.
- Phase 3: Orient a project and deeply plan one approved Roadmap Phase.
- Phase 4: Deliver one approved Phase through bounded Spec and Task loops.
- Phase 5: Recover interrupted work and prove traceable completion.
- Phase 6: Harden and publish portable workflows across Claude Code, Codex, and OpenCode.
