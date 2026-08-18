# Feature Landscape

**Domain:** Local-first harness engineering for AI coding agents
**Project:** Exspecso
**Researched:** 2026-08-18
**Overall confidence:** MEDIUM — recommendations are grounded in current primary documentation for Claude Code, Codex, OpenCode, and GitHub Spec Kit; the precise expectations of Exspecso's early-adopter niche still need validation through V1 use.

## Ecosystem Read

The ecosystem has converged on repository-scoped instructions, native command/agent integrations, and a spec → plan → task → implementation workflow. Codex loads layered `AGENTS.md` instructions before work; Claude Code persists project instruction files across fresh sessions; OpenCode provides project configuration, command files, agents, and explicit action permissions. GitHub Spec Kit makes the artifact sequence explicit, including clarification and cross-artifact analysis before implementation. [MEDIUM — primary sources: Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [Claude Code memory](https://code.claude.com/docs/en/memory), [OpenCode commands](https://opencode.ai/docs/commands/), [Spec Kit agentic SDD](https://github.com/github/spec-kit/blob/main/docs/reference/agentic-sdd.md)

That is the baseline around a coding agent, not Exspecso's whole product. Exspecso should be the portable delivery harness that keeps approved intent, current scope, evidence, and recovery state coherent across those native agent experiences. Its V1 value is not a prettier task tracker, a universal agent plugin marketplace, or a cloud work-management system.

## Table Stakes

Features serious coding-agent users should reasonably expect from a local harness. These are required for a credible V1, even when the surrounding runtime provides a partial version.

| Feature | Why Expected | Complexity | Dependencies | V1 recommendation / evidence |
|---|---|---:|---|---|
| `npx exspecso init` with selected native integrations | Agent workflow products install their command surfaces into the user's existing agent rather than asking users to manually copy prompt files. Spec Kit initializes integrations and command/skill assets; OpenCode supports project command files. | Med | Package CLI; runtime detection; idempotent filesystem writer | Ship. Install only selected Claude Code, Codex, and OpenCode adapters and keep reruns safe. [MEDIUM — Spec Kit](https://github.com/github/spec-kit), [OpenCode commands](https://opencode.ai/docs/commands/) |
| Repository-resident, readable workflow artifacts | Project context in ordinary files is a native convention: `AGENTS.md` and `CLAUDE.md` are read on each run/session. Users need to inspect, edit, diff, and commit delivery intent without a proprietary console. | Med | Artifact naming/schema; Git integration | Ship Markdown plus small JSON metadata only; do not duplicate the state in a database. [MEDIUM — Codex](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [Claude Code](https://code.claude.com/docs/en/memory) |
| Clear intent-to-work hierarchy | Spec Kit's mainstream flow makes spec, plan, tasks, and implementation distinct artifacts. A user needs to see what was approved before an agent starts making changes. | Med | Canonical artifact model; IDs and parent links | Ship `Roadmap → Phase → Spec → Plan → Task`; require explicit approval at the Spec/Plan boundary. [MEDIUM — Spec Kit workflow](https://github.com/github/spec-kit/blob/main/docs/reference/agentic-sdd.md) |
| Native workflow entry points and status | Users expect simple in-agent commands rather than a new application or an opaque script. They also need a trustworthy answer to “what can run next?” | Med | Runtime adapters; deterministic helper; artifact parser | Ship `/exspecso:start`, `plan`, `implement`, `review`, and `status`; present artifact-derived state rather than a chat recap. [MEDIUM — Spec Kit commands](https://github.com/github/spec-kit) |
| Small, reconstructible Task context | Fresh agent sessions reset working context; task execution must be able to restart from files without requiring the original conversation. | High | Task template; context assembler; trace links | Ship a smallest-sufficient context packet containing authority, scope, relevant files, acceptance criteria, verification intent, and resume state. [MEDIUM — Claude fresh-session model](https://code.claude.com/docs/en/memory) |
| Respect for runtime permission and approval boundaries | Local agents expose explicit allow/ask/deny boundaries. A harness must not silently bypass the host runtime's permissions or disguise a destructive action as workflow progress. | Med | Adapter capability map; command policy | Ship adapters that defer tool permissions to the runtime and surface blocked work as a typed state. [MEDIUM — OpenCode permissions](https://opencode.ai/docs/permissions), [OpenAI Codex CLI approvals](https://help.openai.com/en/articles/11096431) |
| Visible implementation progress and safe interruption | A coding-agent harness must say whether work is planned, active, awaiting verification, blocked, or resumable; otherwise a long-running agent is indistinguishable from a lost session. | High | State derivation; resume checkpoint format; Git state inspection | Ship explicit incomplete resume checkpoints; never infer completion from an interrupted session. |
| Validation and independent review step | Spec-driven products include quality gates before and after execution; users expect to test claimed behavior and review what changed. | High | Acceptance criteria; verifier interface; review artifact | Ship per-criterion evidence plus Spec-level closure verification and a final reviewer logically independent from the builder. [MEDIUM — Spec Kit analysis/convergence](https://github.com/github/spec-kit/blob/main/docs/reference/agentic-sdd.md) |

## Differentiators

These capabilities express Exspecso's thesis. They should be visibly present in V1 after the table-stakes substrate is in place.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---|---|---:|---|---|
| One canonical artifact model across Claude Code, Codex, and OpenCode | A project begun in one agent can continue in another without migration, copied chat context, or competing state. Native integrations become replaceable orchestration layers. | High | Stable artifact schema; three adapters; compatibility tests | Make this the headline differentiator. Existing tools expose runtime-specific configuration; Exspecso supplies the common delivery truth. [MEDIUM — Codex project instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [Claude memory](https://code.claude.com/docs/en/memory), [OpenCode agents](https://opencode.ai/docs/agents/) |
| Finite, approved Spec Delivery Loop with default WIP=1 | Delegation has a hard work budget: agents advance only approved, dependency-ready Tasks and stop at a terminal state. This prevents a useful implementation run becoming open-ended “keep improving.” | High | Approved Plan; Task activation rules; loop state machine; status helper | Do not adopt Spec Kit's adaptive task creation at V1 execution time. Its `converge` command may append discovered tasks; Exspecso should instead preserve the approved scope and escalate a discovery. [MEDIUM — Spec Kit convergence](https://github.com/github/spec-kit/blob/main/docs/reference/agentic-sdd.md) |
| Evidence-first Acceptance Criteria and non-weakenable verification contract | Completion is controlled by evidence matched to the claimed behavior, not an agent's self-assessment or a post-hoc test that happens to pass. | High | AC schema; verification-plan artifact; evidence collector; immutable approval fingerprint | This is the core quality differentiator. Claude Code shows lifecycle hooks can inspect repository state before an agent stops; Exspecso should make the contract portable and artifact-backed. [MEDIUM — Claude hooks](https://code.claude.com/docs/en/hooks-guide) |
| Bounded Correction Loop with typed outcomes | Failures become a controlled Assess → Learn → Patch → Reverify attempt that either restores the original evidence target or reports `blocked`, `needs-scope-decision`, or `exhausted`. | High | Verification evidence; correction counter/limit; immutable target; escalation artifact | Ship before broad autonomy. It prevents retry thrashing and stops agents from silently changing requirements to claim success. |
| Mechanically derived traceability and status | The helper computes parentage, activation, evidence closure, retries, and terminal results from files. Users can audit why a task is active or complete without trusting an agent narrative. | High | IDs; append-only event/trace records; deterministic helper; schema validation | Prefer computed views/CLI output over a second, mutable status file. |
| Verified Git checkpoint distinct from a resume checkpoint | A work-in-progress resume state preserves continuity, while a verified task earns an atomic Git commit by default. This gives users a reliable rollback/review boundary without denying recovery. | High | Git capability checks; Task state machine; evidence closure | Ship with an explicit opt-out for repositories where commits are not appropriate. |
| Progressive disclosure: strong governance, quiet normal path | Users get a short command flow while deeper artifacts appear only when actionable. This delivers harness rigor without turning founders into process administrators. | Med | Artifact materialization policy; adapter UX copy; status summaries | Treat it as a product requirement, not merely documentation polish. |

## Anti-Features

These would blur Exspecso into cloud project management or unbounded autonomy, weaken the V1 proof, or duplicate host capabilities.

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| Hosted dashboard, authentication, billing, sync, or team collaboration | Creates a cloud control plane and privacy/operational burden before proving local delivery reliability. It is project management scope, not harness engineering. | Keep canonical files in the repository; use Git and existing collaboration tooling. |
| Kanban boards, assignments, estimates, issue backlogs, or sprint management | These optimize human work allocation, not bounded agent delivery; they would compete with Jira/Linear/GitHub Issues and obscure evidence gates. | Provide machine-derived `status` and traceability only. Link out later if users demonstrate an integration need. |
| Hidden SQLite/database canonical state or generated dashboard views | A second truth introduces migration, synchronization, and inspectability problems. | Markdown plus small JSON files remain canonical; CLI reports are derived, not stored as a competing view. |
| Always-on daemon, scheduled agent, or unbounded “autopilot” | Violates the approved finite Spec boundary and makes cost, scope, and recovery unpredictable. | Require explicit `implement` invocation; use the finite Delivery and Correction Loops with terminal states. |
| Automatic creation of adjacent Tasks, requirements, or cleanup work | Scope expansion is the precise failure mode Exspecso is meant to control. Spec Kit's optional convergence can extend a task list, but Exspecso V1 should surface a proposed change for approval instead. | Emit a typed escalation/deferred-discovery artifact. [MEDIUM — Spec Kit convergence](https://github.com/github/spec-kit/blob/main/docs/reference/agentic-sdd.md) |
| Broad multi-agent parallel execution | Independent code changes can still conflict in shared files, tests, and Git history; parallelism makes evidence and checkpoint boundaries harder to reason about. | Default WIP=1. Add only proven-independent parallel Tasks with separate verification and commits after V1. |
| Universal TDD or full E2E after every Task | A fixed test ritual produces slow, noisy workflows and can reward irrelevant proof. | Require verification proportionate to each predeclared Acceptance Criterion. |
| Reimplementing host sandboxes, permissions, subagents, or model routing | Claude Code, Codex, and OpenCode already own their safety and execution environments; duplicating them creates divergent semantics. | Adapters request the right native behavior; the canonical harness owns workflow authority, evidence, and state. [MEDIUM — OpenCode permissions](https://opencode.ai/docs/permissions), [OpenCode agents](https://opencode.ai/docs/agents/) |
| A generic template marketplace or enterprise SDLC/governance suite | Premature breadth breaks the one-package, quiet local-first promise. | Keep a small opinionated core; revisit extensions only after concrete V1 usage evidence. |

## Feature Dependencies

```text
Idempotent init + selected adapters
  → canonical artifact schema + IDs
    → project start and Roadmap → Phase → Spec planning
      → approved Plan → reconstructible, dependency-linked Tasks
        → predeclared Acceptance Criteria + verification contracts
          → WIP=1 Delivery Loop
            → evidence collection → verified checkpoint + atomic Git commit
            → failed evidence → bounded Correction Loop → reverify or typed escalation
        → artifact-derived status / cross-runtime resume
      → Spec closure verification → independent final review → Spec terminal result
```

The deterministic helper is a cross-cutting prerequisite once the canonical schema exists: it validates artifact relationships, computes activation/status, guards transitions, and ensures each runtime adapter has identical semantics. Cross-runtime continuation cannot be credibly tested until the full schema, checkpoint distinction, and adapter command surfaces exist.

## MVP Recommendation

Prioritize:

1. **Local installation, selected native adapters, and canonical artifacts** — prove the package can create inspectable workflow state in a real repository.
2. **Hierarchical planning into one approved Spec, Plan, and reconstructible Task set** — establish bounded authority before adding autonomous execution.
3. **Evidence-first WIP=1 Delivery Loop with verified versus resume checkpoints** — deliver the central reliability proof rather than merely producing planning files.
4. **Bounded correction, closure verification, and independent review** — make failure and completion trustworthy.
5. **Cross-runtime resume** — validate the product thesis only after one runtime can complete the same artifacts end-to-end.

Defer cloud/team project management, a visual dashboard, broad integrations, autonomous scheduling, and general parallel execution. They do not improve the first proof that approved intent survives execution and recovery with evidence controlling completion.

## Sources

- [GitHub Spec Kit — repository and core workflow](https://github.com/github/spec-kit) — MEDIUM (current primary source)
- [GitHub Spec Kit — Agentic SDD reference](https://github.com/github/spec-kit/blob/main/docs/reference/agentic-sdd.md) — MEDIUM (current primary source)
- [OpenAI — Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) — MEDIUM (current primary source)
- [Anthropic — How Claude remembers your project](https://code.claude.com/docs/en/memory) — MEDIUM (current primary source)
- [Anthropic — Automate workflows with hooks](https://code.claude.com/docs/en/hooks-guide) — MEDIUM (current primary source)
- [OpenCode — Commands](https://opencode.ai/docs/commands/) — MEDIUM (current primary source)
- [OpenCode — Agents](https://opencode.ai/docs/agents/) — MEDIUM (current primary source)
- [OpenCode — Permissions](https://opencode.ai/docs/permissions) — MEDIUM (current primary source)
- [OpenAI Help — Codex CLI approvals and local operation](https://help.openai.com/en/articles/11096431) — MEDIUM (current first-party source)

## Open Questions for Validation

- Which artifact vocabulary users will adopt most naturally: Exspecso's full Roadmap/Phase/Spec/Plan/Task set or a simpler entry flow that materializes the hierarchy only when needed.
- Whether one atomic commit per verified Task is safe and desirable across the initial target repositories, and what opt-out policy users need.
- How much adapter-specific capability may be exposed without introducing divergent semantics; test the same delivery and resume scenario in each supported runtime.
- The minimum useful evidence formats for UI behavior, infrastructure changes, and non-code work without accidentally creating a universal test framework.
