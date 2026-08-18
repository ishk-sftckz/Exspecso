# Architecture Patterns

**Domain:** Local-first, artifact-grounded harness for AI coding agents  
**Researched:** 2026-08-18  
**Confidence:** MEDIUM — product boundaries are authoritative in `PROJECT.md`; runtime integration facts were verified against current official documentation, using the WebSearch fallback because the configured research backend was unavailable.

## Recommended Architecture

Exspecso should be a single TypeScript/Node.js package with three strictly one-way logical layers:

```text
                         user invokes a native command
        Claude Code / Codex / OpenCode adapter (thin, generated)
                                  |
                                  v
               bounded prompt + `npx exspecso` helper operation
                                  |
                                  v
             deterministic helper (the only transition authority)
          validate → derive state → write artifacts → run declared checks
                                  |
                +-----------------+------------------+
                |                                    |
                v                                    v
  tracked canonical Markdown/JSON artifacts       Git + repository code
  (authority, plan, evidence, checkpoints)        (implementation/evidence)
```

The canonical model belongs in a visible, committed project directory such as `.exspecso/`. A dot directory is an integration convention, not hidden state: every file in it must be plain Markdown or small JSON and readable without Exspecso. Do **not** introduce a database, event store, daemon, generated dashboard, or runtime-specific duplicate of this model. A derived `exspecso status` report is a command result, not a canonical file.

The helper owns state transitions. The model owns only judgment that cannot be mechanized: interpreting an approved requirement, investigating repository context, writing the implementation, selecting among already-authorized alternatives, and reporting evidence. A runtime may request a transition; it may never declare one valid by itself.

### Canonical artifact shape

Materialize artifacts only when their parent becomes actionable. Use stable IDs and explicit parent references in front matter / small metadata sidecars; derive status from those relationships plus evidence rather than maintaining a mutable global status file.

```text
.exspecso/
  project.md                 # project intent, constitution, standards pointers
  roadmap.md                 # Phase declarations only
  phases/<phase-id>/phase.md
  phases/<phase-id>/specs/<spec-id>/spec.md
  phases/<phase-id>/specs/<spec-id>/plan.md
  phases/<phase-id>/specs/<spec-id>/tasks/<task-id>.md
  phases/<phase-id>/specs/<spec-id>/traces/<criterion-id>.md
  phases/<phase-id>/specs/<spec-id>/verification/<task-id>.md
  phases/<phase-id>/specs/<spec-id>/corrections/<attempt-id>.md
  phases/<phase-id>/specs/<spec-id>/review.md
  runs/<run-id>.json         # non-authoritative, incomplete resume metadata only
```

`run` metadata may record an interrupted operation, adapter/runtime, selected task, and an artifact revision or Git SHA. It must never contain the sole copy of intent or mark a task verified. A verified checkpoint is reconstructible only when the task artifact, required trace/evidence artifacts, and its Git commit agree.

### Component boundaries

| Component | Owns | May do | Must not do |
|---|---|---|---|
| Package CLI / installer | Runtime detection, explicit runtime selection, idempotent install/uninstall/doctor/status entrypoints | Generate selected native adapter files; call the helper | Infer a different project model per runtime; run an autonomous delivery loop itself |
| Canonical artifact store | Approved intent, hierarchy, evidence contracts, correction/review records | Read/write schema-versioned Markdown and small JSON atomically; expose paths by ID | Hide truth in a cache/database; overwrite approved source without an explicit approved operation |
| Deterministic helper | Parsing, schema validation, transition guards, status derivation, context manifest creation, Git checkpoint orchestration | Return typed success/block/escalate results; perform atomic artifact writes; run declared commands with captured result metadata | Reason about ambiguous product intent; silently repair failing work; accept agent prose as proof |
| Context assembler | Minimal task packet from the canonical graph | Select task, parent spec/plan, acceptance criteria, constraints, relevant repository paths and prior evidence | Append whole chat history or unrelated phase files; invent requirements from repository observations |
| Delivery-loop controller | Finite Spec-scoped state machine | Activate at most one task by default; advance only after helper verifies the evidence contract; stop at terminal or escalation result | Create tasks, increase scope, bypass WIP, or continue across a Spec boundary |
| Correction-loop controller | Bounded remediation record | Assess → learn → patch → reverify against the original criterion, count attempts, emit a typed terminal result | Change acceptance criteria, substitute weaker evidence, or retry indefinitely |
| Runtime adapters | Native invocation and prompt packaging | Translate `/exspecso:*` (or equivalent) into helper calls plus a bounded task packet | Implement transition logic, maintain their own status, or require a common agent plugin API |
| Git gateway | Durable verified checkpoints | Inspect clean/dirty state, create one atomic commit after valid verification, record SHA | Treat a commit as verification; commit unrelated changes without detection |

### Runtime-adapter contract and portability

Use an adapter **manifest** in package code, not adapter-specific workflow semantics. Each adapter implements the same capability contract:

```ts
type Adapter = {
  id: "claude-code" | "codex" | "opencode";
  detect(repoRoot: string): Promise<Detection>;
  install(repoRoot: string, operations: OperationName[]): Promise<InstallReport>;
  uninstall(repoRoot: string): Promise<InstallReport>;
  renderOperation(operation: OperationName, helperCommand: string): string;
};

type OperationResult =
  | { kind: "ready"; contextManifest: string; nextAction: string }
  | { kind: "advanced"; taskId: string; checkpoint?: string }
  | { kind: "blocked"; reason: string; requiredDecision?: string }
  | { kind: "escalate"; reason: string; evidence: string[] }
  | { kind: "invalid"; diagnostics: Diagnostic[] };
```

The contract is deliberately file-and-command based: an adapter only needs a project-local way to expose instructions and invoke a command. Claude Code supports project skills under `.claude/skills/<name>/SKILL.md`; its legacy commands and skills can both expose slash invocations. Codex loads `AGENTS.md` guidance from the repository hierarchy before work, so its adapter should provide compact guidance that calls the helper and points to the task packet. OpenCode supports project `.opencode/commands/` Markdown commands and configurable instruction files. These are sufficient native surfaces; V1 should **not** use hooks or in-process plugins as a prerequisite. [Claude Code skills](https://code.claude.com/docs/en/slash-commands), [Codex AGENTS.md discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [OpenCode commands](https://opencode.ai/docs/commands/), [OpenCode configuration](https://opencode.ai/docs/config/)

Install only the selected adapter. Generated adapter content should be a short, versioned shim with a clear ownership marker, not a copy of the roadmap, plan, or task state. Re-running `init` compares that marker and updates only Exspecso-owned sections; it must preserve user content in files such as `AGENTS.md`. Keep an `adapterVersion` in the generated header and offer `doctor` diagnostics for missing commands, unsupported file layouts, and stale generated shims.

Portability rule: every operation has the same helper input, canonical artifact writes, legal transitions, and terminal result across runtimes. Prompt wording, command-file format, and physical session strategy may differ. A project can therefore resume in another runtime by reconstructing from artifacts, not by translating history or synchronizing model sessions.

### Artifact and state data flow

```text
Approved intent
  → helper validates parentage and creates next actionable artifact
  → planner runtime writes proposed content through an explicit helper operation
  → helper freezes approved Spec + acceptance/evidence contract
  → helper activates one planned Task and emits a minimal context manifest
  → builder runtime changes repository code and writes proposed evidence
  → helper runs/records declared verification and evaluates trace closure
      ├─ valid evidence → Git gateway commits → task becomes verified
      │                     → continuous mode activates exactly one next Task
      └─ failed evidence → Correction controller records failure
                            → bounded patch/reverify OR typed escalation
  → after all tasks: declared Spec closure verification
  → independent reviewer record
  → helper derives Spec terminal status from artifacts + evidence + review
```

All mutating helper operations follow the same transaction boundary:

1. Read and schema-validate the relevant canonical artifacts; reject illegal parentage or stale active-task assumptions.
2. Compute the proposed transition entirely in memory.
3. Write a complete temporary artifact in the destination filesystem, fsync when supported, then rename it into place; update related files in a narrow, recoverable order.
4. If the operation affects code, capture command, exit status, timestamp, working-tree summary, and relevant output path in the evidence record.
5. Re-derive state from disk. Only then expose the typed result; for verified Tasks, create the Git commit after required evidence succeeds.

Node supports direct argument-vector process spawning with an explicit `cwd`, environment, stream capture, and exit event. Use that interface for Git and declared verification commands; do not construct shell strings from artifact contents. The filesystem API supports rename operations, so a temp-file-plus-rename write pattern narrows interruption windows. [Node child-process API](https://nodejs.org/api/child_process.html), [Node filesystem API](https://nodejs.org/api/fs.html)

## Patterns to Follow

### Pattern 1: File-backed, derived-state state machine

**What:** Model explicit entity states and legal transitions in pure functions, then derive current state by reading canonical artifacts and their evidence. Prefer a task-level immutable attempt/evidence record to a mutable `status: done` flag.

**When:** Every lifecycle action: planning approval, activation, verification, correction, review, resume, and status.

**Example:**

```ts
function canAdvance(task: Task, evidence: Evidence, git: GitState): Result {
  if (!task.approved || task.state !== "active") return blocked("task_not_active");
  if (!evidence.satisfies(task.verificationContract)) return blocked("evidence_missing");
  if (!git.hasAtomicCheckpointFor(task.id, evidence.digest)) return blocked("checkpoint_missing");
  return ready("mark_task_verified");
}
```

The model may provide `evidence`, but the helper evaluates the declared contract. This protects against completion by confidence or a post-hoc test substitution.

### Pattern 2: Capability-based native adapters

**What:** Render a small, static native entrypoint for each operation, all calling the same local helper protocol.

**When:** Installation and runtime upgrades.

**Example:** A generated Claude skill, Codex `AGENTS.md` section, and OpenCode command can all direct the agent to invoke `npx exspecso task prepare --spec S-12 --task T-03 --format markdown`, read the manifest it returns, and use `npx exspecso task submit-evidence ...` afterward. The operation names and output schema do not change.

### Pattern 3: Explicit authority labels

**What:** Tag every context packet and artifact reference as `authority`, `constraint`, `evidence`, `repository context`, or `observation`.

**When:** Context assembly and correction assessment.

**Why:** A test failure or repository fact can reveal a problem but cannot rewrite approved scope. Observations can cause an `escalate` result; only an explicit approval operation may revise authority artifacts.

### Pattern 4: Typed stop conditions, not conversational retries

**What:** Both loops terminate with a small closed set: `verified`, `blocked`, `escalate`, `correction_exhausted`, `cancelled`, or `invalid`.

**When:** Every control-loop invocation and resume.

**Why:** It makes the running state inspectable, enforces correction limits, and lets another runtime continue safely.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Runtime-owned workflow state

**What:** Store status, accepted tasks, evidence, or next-action decisions only in a Claude session, Codex configuration, OpenCode plugin state, or generated prompt.

**Why bad:** It breaks cross-runtime resumption and makes a session’s hidden memory authoritative.

**Instead:** Keep adapters stateless and regenerate their instructions from package templates; derive all workflow state from tracked artifacts and Git.

### Anti-Pattern 2: Agent as state-transition authority

**What:** Let a model update “done,” choose the next Task, loosen a check, or retry based on a prose self-assessment.

**Why bad:** It bypasses evidence gates and enables scope drift or unbounded correction.

**Instead:** Require helper-checked transition preconditions and typed outcomes. The runtime requests; the helper decides mechanically.

### Anti-Pattern 3: One giant control artifact or generated mirror

**What:** A monolithic project JSON, hidden SQLite file, or compiled status dashboard that must be correct for the workflow to continue.

**Why bad:** It creates merge conflicts, defeats direct inspectability, and becomes an alternative source of truth.

**Instead:** Use small parent-scoped artifacts with stable links. Derive views on demand.

### Anti-Pattern 4: Plugin-first orchestration

**What:** Depend on each runtime’s hook/plugin API to run Exspecso’s loop or mutate artifacts.

**Why bad:** Plugin lifecycles, permissions, and APIs differ; OpenCode’s newer plugin API is explicitly beta, while Claude and Codex have different extension models. This would make portability depend on the least stable surface.

**Instead:** Start with native project commands/instructions and an external deterministic helper. Add optional plugins only after V1 proves a concrete capability gap.

### Anti-Pattern 5: Coupled implementation and verification mutation

**What:** A builder changes code and rewrites the acceptance or verification contract in the same operation.

**Why bad:** It lets the implementation redefine success.

**Instead:** Freeze approved verification before task activation. Route any required change through a separate human-authorized revision with traceable invalidation of prior evidence.

## Scalability Considerations

| Concern | At 100 users / small repos | At 10K users / larger repos | At 1M users / future scale |
|---|---|---|---|
| Storage | Git-tracked Markdown/JSON under `.exspecso/`; derive synchronously | Keep indexes ephemeral and rebuildable; avoid scanning unrelated files by using IDs and parent directories | Still preserve local canonical artifacts; any hosted aggregation is a separate, non-canonical product and is out of V1 scope |
| State derivation | Read all artifacts for one Spec on demand | Cache parsed artifacts in-process keyed by path/mtime; invalidate freely | Build a separately versioned read model only if local derivation demonstrably fails; never move authority to it |
| Adapter support | Three template renderers and doctor checks | Capability matrix and adapter conformance fixtures | Separate packages only when release cadence/dependency isolation makes the one-package design untenable |
| Verification execution | Local child-process runner; captured outputs as references | Command timeouts, structured result normalization, optional worktree isolation | Remote runners are explicitly deferred; retain the same evidence-record contract if introduced |
| Concurrent work | WIP=1 per Spec; one active writer | Permit only declared-independent Tasks with separate worktrees/evidence/commits | Concurrency remains an opt-in scheduling policy; it must not weaken per-task transition guards |

## Suggested Build Order

1. **Artifact schema and read-only inspector** — Define IDs, parent links, minimal Markdown/JSON schemas, parser diagnostics, and `status` derivation before any agent-facing command. This establishes the portable source of truth.
2. **Deterministic transition kernel** — Implement pure transition guards and typed result protocol for Roadmap → Phase → Spec → Plan → Task, activation, and status. Unit-test invalid states as heavily as happy paths.
3. **Atomic local persistence and Git gateway** — Add safe writes, interruption recovery scans, declared-command execution, evidence records, and verified-task commits. This makes “resumable” and “evidence-backed” real before the model changes code.
4. **Evidence-first task workflow** — Implement acceptance/verification contract creation, context manifests, task activation, evidence evaluation, trace closure, and WIP=1 delivery advancement.
5. **Correction and review gates** — Add the bounded Correction Loop, preserved evidence target, terminal escalation types, Spec closure verification, and logically independent final-review artifact.
6. **One vertical adapter, then conformance tests** — Build the least complex native adapter first (recommend Codex `AGENTS.md` plus helper commands), run an end-to-end interrupted/resume scenario, then freeze a runtime-neutral adapter contract test suite.
7. **Claude Code and OpenCode adapters** — Render only thin native skill/command shims; exercise the same fixtures across all adapters, including handoff from runtime A to B and idempotent re-installation.
8. **Progressive UX and doctor** — Add quiet default commands, explanation-on-demand, safe adapter upgrades, and clear remediation diagnostics after the workflow mechanics are proven.

The dependency rule is firm: no continuous delivery, correction, or cross-runtime promise should ship ahead of canonical artifact reconstruction and helper-enforced evidence transitions. Native adapter polish follows the state kernel, rather than defining it.

## Sources

- [Claude Code: skills and project locations](https://code.claude.com/docs/en/slash-commands) — MEDIUM confidence (official, current page; WebSearch fallback)
- [OpenAI Codex: AGENTS.md discovery and precedence](https://learn.chatgpt.com/docs/agent-configuration/agents-md) — MEDIUM confidence (official, current page; WebSearch fallback)
- [OpenAI Codex CLI](https://learn.chatgpt.com/docs/codex/cli) — MEDIUM confidence (official, current page; WebSearch fallback)
- [OpenCode: project commands](https://opencode.ai/docs/commands/) and [configuration](https://opencode.ai/docs/config/) — MEDIUM confidence (official, current pages; WebSearch fallback)
- [Node.js child-process API](https://nodejs.org/api/child_process.html) and [filesystem API](https://nodejs.org/api/fs.html) — MEDIUM confidence (official, current pages; WebSearch fallback)
- [Project constraints and decisions](../PROJECT.md) — HIGH confidence (authoritative project context)
