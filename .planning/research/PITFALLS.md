# Domain Pitfalls

**Domain:** Local-first, artifact-grounded harness for AI coding agents
**Researched:** 2026-08-18
**Overall confidence:** MEDIUM — recommendations are grounded in current official Claude Code, Codex, OpenCode, and Git documentation, but cross-runtime behavior must be exercised against the exact versions supported at release.

## Critical Pitfalls

Mistakes in this section either corrupt the durable project record, permit unbounded or unsafe work, or make a claimed completion unreliable.

### Pitfall 1: Split-brain or corrupt canonical artifacts

**What goes wrong:** Status, task activation, trace closure, or verification appears in multiple files or runtime-specific state. A partial write, manual edit, or adapter bug leaves those representations inconsistent; a later session then reconstructs the wrong truth.

**Why it happens:** Markdown is treated as informal prose while JSON is treated as an unvalidated side channel, and adapters derive their own status instead of asking one deterministic helper. Writing an artifact and updating a related index are performed as separate, interruptible operations.

**Consequences:** Resume can select the wrong Task, a completed Task can be lost or an unfinished Task can be reported as verified, and runtime switching becomes a migration rather than continuation.

**Prevention:**

- Define one canonical artifact graph with stable IDs, parent IDs, explicit lifecycle states, schema version, and a provenance field on every generated artifact.
- Make the deterministic helper the only component that computes status and transitions; adapters may render or request a transition but may not infer or persist their own state.
- Parse and validate every artifact before use. Treat a failed parse, duplicate ID, broken parent relation, or impossible state as a typed `artifact_invalid` stop, never as permission to guess.
- Use write-to-temp, fsync where supported, and rename for individual files; perform multi-file transitions through a recorded operation journal or a recoverable `pending` state. On startup, reconcile an incomplete operation deterministically.
- Preserve approved artifact revisions or content digests for Spec, Plan, Task, and verification intent. A human edit is allowed, but it must create an explicit amendment/replan path rather than silently alter a running Task.

**Detection:** A `status --check` command rebuilds the graph from disk on every run and fails on dangling links, duplicate IDs, invalid schemas, illegal transitions, stale derived fields, or incomplete write journals. Test kill/restart at each write boundary and assert the next process reaches either the exact prior state or one typed recoverable state.

**Phase mapping:** **Phase 1 — Canonical artifact model and deterministic helper.** This is a release gate before any adapter or autonomous delivery loop exists.

### Pitfall 2: Approval authority drifts into prompts, plans, or adapters

**What goes wrong:** A model treats a discovery, a task note, a runtime instruction file, or an implementation plan as authorization to add requirements, create new Tasks, refactor adjacent code, or change acceptance criteria.

**Why it happens:** Hierarchy is described textually but not enforced mechanically. The system has no immutable approved Spec boundary and no formal distinction among planned work, discovered work, and approved work.

**Consequences:** The harness becomes a polished way to hide scope creep. Delivery time and verification targets move without a user decision, and traceability no longer proves that code implements approved intent.

**Prevention:**

- Model authority explicitly: Roadmap creates Phases; Phase planning creates Specs; an approved Spec creates exactly one Plan and its bounded Tasks. Every Task carries the approved Spec/Plan IDs and a frozen scope digest.
- Require a deterministic `can-activate-task` check: the Task must already exist, be a child of the active approved Plan, have unclosed dependencies only where allowed, and have declared acceptance criteria and verification intent.
- Classify unplanned observations as `defer`, `escalate`, or `defect-in-current-criterion`; only the final class can enter a Correction Loop, and it cannot broaden the criterion.
- Produce a scope-diff report before execution and on resume: changed artifacts are listed by ID and whether the change requires approval. Reject automatic continuation after a material authority change.

**Detection:** Contract tests attempt to activate a synthetic Task, alter an active acceptance criterion, and add an adjacent-cleanup instruction. Each must return a typed refusal plus the correct escalation artifact. Audit every completed Task for a parent chain ending at an approved Spec.

**Phase mapping:** **Phase 2 — Hierarchical planning and approval boundary.** Do not introduce continuous mode until these refusal paths are implemented and tested.

### Pitfall 3: "Idempotent" commands duplicate or overwrite user state

**What goes wrong:** Re-running `init`, `start`, `plan`, or an adapter installation adds duplicate commands, rewrites user-managed configuration, creates new IDs, repeats an event, or misreads a partially initialized repository as healthy.

**Why it happens:** Commands are implemented as imperative scripts rather than reconciliation from an inspected desired state. Their success condition is exit code rather than an invariant over the repository. Existing runtime configuration is assumed to belong to Exspecso.

**Consequences:** Users cannot safely retry after interruption, project setup becomes fragile, and configuration drift undermines trust in a tool whose core promise is durable recovery.

**Prevention:**

- Give every generated element a stable Exspecso ownership marker and deterministic identity; never identify ownership by a filename alone.
- Before every mutating command, inspect current artifacts and selected runtime integration, then compute `noop`, `create`, `repair`, or `conflict`. A conflict stops with a human-readable resolution plan; it never overwrites foreign content.
- Keep an install manifest recording selected runtimes, generated paths, schema/adapter version, and checksums. Make reinstallation update only marked blocks or files.
- Test each command with a clean repo, an already-correct repo, a partly completed command, a user-edited generated artifact, and pre-existing native runtime configuration. The second correct run must produce no semantic diff.

**Detection:** Snapshot/retry tests compare normalized repository state after one successful invocation, repeated invocation, and interruption at every mutation point. Expose `exspecso doctor` to report ownership, manifest mismatch, and repairability without writing.

**Phase mapping:** **Phase 3 — npm package, initialization, and selected-runtime installation.** Treat interruption simulation and non-destructive conflict behavior as acceptance criteria, not polish.

### Pitfall 4: Runtime semantic drift breaks the common workflow

**What goes wrong:** The same Exspecso command means different things across Claude Code, Codex, and OpenCode: an instruction file is loaded at another scope, a permission rule is interpreted differently, headless behavior drops a checkpoint, or a runtime upgrade changes the configuration schema.

**Why it happens:** Adapters encode policy and state instead of a narrow transport layer. The harness assumes superficial syntax equivalence. This is particularly likely as runtimes evolve: OpenCode documents deprecated legacy `tools` configuration and distinct V2 permission semantics; Claude Code merges settings across scopes; runtimes also have different approval and sandbox models.

**Consequences:** Cross-runtime continuation loses intent or progress, one runtime gains unsafe powers, and support becomes an unbounded compatibility matrix.

**Prevention:**

- Specify runtime-independent operation contracts first: input artifact set, helper command, permitted state transitions, emitted evidence, stop conditions, and no-op behavior. The contract—not a prompt—is the portable interface.
- Keep adapter output deliberately thin. It may install native commands/instructions and invoke the helper, but cannot own canonical state, approval policy, or business transition logic.
- Do not treat shared instruction text as enforcement. Claude Code and Codex load different instruction-file conventions and precedence chains, while current OpenCode V2 configuration distinguishes discovery from entries that are merely accepted configuration. The adapter must invoke the helper with explicit arguments and test that the intended native instruction source was actually loaded.
- Maintain a versioned capability manifest per supported runtime and adapter. Detect unknown versions or unavailable capabilities and degrade to explicit/manual mode rather than emulating semantics.
- Build a cross-runtime fixture repository that starts in each runtime, pauses mid-Task, resumes in each other runtime, then byte-compares canonical artifact semantics and final status. Run it for every adapter change and supported runtime-version update.
- Default to least privilege. Claude Code documents sandboxing and tool permissions as separate controls; OpenAI likewise describes sandboxing as the technical boundary and approvals as the consent boundary. Never translate an auto-approve setting into permission to expand filesystem or network access.
- Apply an Exspecso-owned execution budget and structured result parser in non-interactive mode. Runtime turn/step/session controls are useful transport details, but only the helper's finite Task and Correction state machine decides whether work can continue.

**Detection:** Adapter conformance tests assert the same helper arguments, allowed transition set, evidence records, and typed failures across all runtimes. `doctor` reports the selected runtime version, detected config schema, active configuration sources where available, and the precise capability mismatch.

**Phase mapping:** **Phase 4 — First native adapter and contract suite; Phase 8 — Remaining adapters and portability certification.** Implement one end-to-end adapter first. Adding the other two before the contract is stable multiplies drift.

### Pitfall 5: Runtime instructions, hooks, and fetched content become an injection path

**What goes wrong:** A model follows malicious or stale text from a repository file, issue, test fixture, web result, hook output, MCP response, or user-local runtime configuration as if it were Exspecso authority. A hook or plugin alters tool calls or context without the artifact model observing it.

**Why it happens:** The harness conflates text that supplies context with text that authorizes a transition. It grants broad shell/web permissions or treats runtime configuration as trusted and stable. Runtime extension points are powerful: OpenCode plugins can transform configuration and intercept tool execution; Claude Code hooks communicate through process I/O.

**Consequences:** Unsafe commands, secret disclosure, tampered evidence, fabricated state transitions, or unexplained divergence between runs.

**Prevention:**

- Establish an explicit trust boundary: only schema-valid canonical artifacts and direct user confirmations authorize workflow transitions. Repository text, tool output, fetched content, issue text, hook stdout, and runtime-native instructions are untrusted context.
- Pass untrusted context to agents as data, never as a command channel. The deterministic helper must not execute artifact text, shell fragments, URLs, or runtime-provided commands.
- Install narrow, reviewable native permissions: deny destructive shell patterns and outbound network access by default; require a separate user-approved escalation for exceptions. Do not use bypass or all-allow modes as a product default.
- Avoid plugins and model-mediated hooks in V1 unless a concrete operation cannot be implemented by the helper. If needed, pin their version, log their identity and input/output digest, and fail closed on unexpected mutation.
- Verify a hook/plugin-free baseline in the fixture repo and prominently warn when external runtime configuration can change the execution envelope.

**Detection:** Threat tests inject instruction-like strings into every accepted artifact field, hook output, and fixture file; assert that they are displayed/recorded as data and never run. Log every helper mutation with operation ID, canonical input digests, result, and Git HEAD.

**Phase mapping:** **Phase 1 — Artifact parser and trust model; Phase 4 — Adapter permissions; Phase 9 — Security/abuse test pass.** The trust model must precede any execution feature.

### Pitfall 6: Verification is chosen after implementation or gamed to pass

**What goes wrong:** The builder chooses an easier test after writing code, weakens/deletes a test, treats a command exit code or self-report as evidence, or changes fixtures solely to make the assertion pass. A review re-runs the same biased evidence and calls it independent.

**Why it happens:** Acceptance criteria are prose-only, verification intent has no durable identity, and the same agent/process controls implementation, evidence selection, and completion marking.

**Consequences:** The system optimizes for green status instead of intended behavior. Completion claims are not auditable, regressions cross checkpoints, and users learn that governance is theater.

**Prevention:**

- Require each acceptance criterion to declare its verification method and minimum evidence before Task activation: for example static assertion, unit test, targeted integration test, command transcript, or human review. Match evidence cost to the behavior; do not impose universal TDD or E2E.
- Freeze a verification-contract digest when the Task starts. Correction may add diagnostic evidence but cannot remove, weaken, replace, or materially reinterpret the original target without an approved amendment that invalidates the prior run.
- Store evidence as an artifact with command/tool identity, inputs or fixture revision, exit/result, timestamp, Git HEAD, and verifier version. A bare "pass" string is invalid.
- Make the helper, not the builder, decide whether required evidence is complete. Require Spec-level closure evidence and a logically independent final review before the Spec terminal state.
- Protect test and acceptance artifacts in the task diff: modifications after verification failure require an explicit reason and review flag; removals or changed assertions fail closed by default.

**Detection:** Mutation tests intentionally weaken the verifier, delete a required test, substitute a passing echo command, or modify the criterion after implementation. The helper must reject verified completion. Sample completed Tasks and independently replay their evidence in a clean checkout.

**Phase mapping:** **Phase 5 — Evidence-first Task execution and verification gate; Phase 7 — Spec closure and independent review.** This is the central product proof, not a final reporting feature.

### Pitfall 7: Correction loops move the target or retry forever

**What goes wrong:** A failing Task repeatedly asks the model to "try again," accumulates speculative patches, changes the test or scope, and eventually declares success—or burns time indefinitely without a clear handoff.

**Why it happens:** Failure is represented as free-form chat, retry counts are not stored, and a correction is not constrained by the original verification contract.

**Consequences:** Hidden scope expansion, compounding regressions, unreproducible decisions, and a system that appears autonomous by concealing uncertainty.

**Prevention:**

- Implement a persisted Assess → Learn → Patch → Reverify state machine with an attempt budget set by policy and a typed terminal result: `verified`, `blocked`, `needs-scope-change`, `needs-human-decision`, or `exhausted`.
- On entering correction, record the failure evidence, baseline Git HEAD, affected Task/criterion IDs, and verification-contract digest. Reverify exactly that contract after every patch.
- Bound the patch to the active Task's declared paths/intent where feasible. A required dependency update, public API change, new Task, or changed criterion stops for escalation rather than becoming a hidden correction.
- Require each attempt to state a falsifiable hypothesis and preserve the evidence that refuted or supported it. Do not continue after the same failure signature without a changed hypothesis.

**Detection:** State-machine tests cover interruption at each correction step, exhausted budgets, repeated identical failures, and a patch that makes a new unrelated test fail. Audit records must show no missing attempt number or verification-contract change.

**Phase mapping:** **Phase 6 — Bounded Correction Loop.** It depends on stable Task state and evidence contracts; implementing it earlier guarantees target drift.

### Pitfall 8: Resume state is mistaken for a verified checkpoint

**What goes wrong:** An interrupted process leaves code changes, a test log, or a session ID. The next runtime assumes the Task was complete because the files "look right," or because a prior runtime says it was done.

**Why it happens:** Session continuity is treated as durable truth; incomplete state has no explicit representation; and Git commits are used as a proxy for verification without recording evidence and exact repository state.

**Consequences:** False completion, duplicate work, lost partial work, and cross-runtime resumption that depends on chat history rather than artifacts.

**Prevention:**

- Separate `in_progress`/`interrupted` resume checkpoints from `verified` checkpoints in the canonical state model. Only the helper can create the latter after all required evidence succeeds.
- Persist the minimum reconstruction bundle: Task ID and parent chain, scope/verification digests, active correction state and budget, baseline/current Git HEAD, known changed files, last completed durable operation, and next safe action. Do not require a conversation transcript.
- At resume, recompute the artifact graph and compare repository state to the recorded checkpoint. If HEAD or expected worktree state diverges, stop with `workspace_diverged` and show a diff summary; never merge or discard automatically.
- Require one atomic Git commit per verified Task by default, recording its hash in the verified checkpoint only after evidence passes. Never auto-push.

**Detection:** End-to-end fixtures interrupt initialization, implementation, evidence capture, correction, and commit; resume from disk in the same and a second runtime; assert no task becomes verified until its complete evidence set exists. Test a deliberately changed worktree and assert explicit escalation.

**Phase mapping:** **Phase 7 — Git-backed checkpoints, pause/resume, and cross-runtime reconstruction.** This phase should precede continuous Task advancement.

### Pitfall 9: Git automation damages user work or gives a false safety signal

**What goes wrong:** The harness stages unrelated changes, commits before evidence, runs destructive restore/reset/clean commands, commits to the wrong branch/worktree, or relies on a hook to enforce an invariant that can be bypassed.

**Why it happens:** Git is treated as a generic persistence backend, not a user-owned working tree with independent activity. The implementation assumes hooks are a hard control; Git documents that commit hooks can be bypassed with `--no-verify`.

**Consequences:** Lost work, misleading history, leaked changes, invalid checkpoints, and broken developer trust.

**Prevention:**

- Preflight every Task with repository root, current branch, HEAD, worktree identity, merge/rebase state, staged paths, and porcelain status. Refuse automatic checkpointing if unrelated staged or modified files cannot be attributed to the Task.
- Build commits from an explicit reviewed file list, verify the index exactly matches that list, run required evidence against the committed tree or immediately before committing with recorded HEAD, then record the resulting commit hash.
- Never run `reset --hard`, `clean`, force checkout, force push, rebase, or push as part of V1 automation. Present recovery options and require a direct user decision for destructive reconciliation.
- Treat hooks as a helpful local check, not the completion gate. Keep artifact/evidence validation inside the helper so `--no-verify` cannot create a verified Exspecso checkpoint.
- Detect linked worktrees and store their path/identity; do not use a manually moved worktree as an implicit recovery mechanism. Git documents dedicated worktree repair/removal behavior, which should remain a user-facing recovery action.

**Detection:** Fixture tests add unrelated staged/untracked changes, a rebase in progress, a detached HEAD, a secondary worktree, and a bypassed hook. In all cases, `checkpoint` must either commit only the declared Task files with recorded evidence or stop without modifying user work.

**Phase mapping:** **Phase 7 — Git-backed checkpoints and resume.** Git safety must be complete before enabling WIP=1 continuous advancement.

## Moderate Pitfalls

### Pitfall 1: WIP=1 is declared but not enforced

**What goes wrong:** Two invocations activate the same or separate dependent Tasks and race to edit artifacts or the working tree.

**Prevention:** Have the helper acquire a short-lived operation lock and atomically record one active Task. Allow parallelism only with explicit dependency independence, separate worktrees, separate evidence contracts, and separate checkpoints. A stale lock must yield a recoverable inspection flow, not automatic deletion.

**Detection:** Run concurrent `implement` and `resume` invocations against a fixture and assert one receives a typed `task_already_active` or `operation_in_progress` result.

**Phase mapping:** **Phase 5 — Task executor; Phase 7 — checkpoint integration.**

### Pitfall 2: Directly readable artifacts become a high-friction manual control plane

**What goes wrong:** Users must hand-edit many files, memorize state rules, or resolve routine machine state themselves. They bypass the harness or corrupt artifacts to regain speed.

**Prevention:** Keep canonical artifacts concise and plain-language, generate them only when actionable, and provide inspect/doctor/status commands that explain the next safe action. Prefer small JSON for machine-readable state and Markdown for human-approved intent; do not create duplicate dashboards or hidden databases.

**Detection:** Fresh-repo usability tests ask a user to initialize, inspect a blocked Task, resume an interruption, and understand a conflict from artifacts plus CLI output alone.

**Phase mapping:** **All phases, with a formal usability pass in Phase 10 — V1 polish and docs.**

### Pitfall 3: Configuration installation silently broadens permissions or destroys native workflow

**What goes wrong:** `init` assumes one settings filename/schema, overwrites existing Claude/Codex/OpenCode configuration, enables an auto/bypass mode, or installs all adapters despite a user selecting one.

**Prevention:** Install only selected integrations, use marked and reversible configuration blocks/files, preserve unknown content byte-for-byte, display a diff before conflicts, and record the effective permission posture. Support only documented runtime versions/config schemas; for unknown ones, leave native configuration untouched and give manual instructions.

**Detection:** Compatibility fixtures begin with non-Exspecso native configuration, restrictive policy, and legacy/deprecated schema variants. Assert no unrelated diff and no broadened permissions after `init` or a retry.

**Phase mapping:** **Phase 3 — Initialization; Phase 4/8 — Adapter conformance.**

### Pitfall 4: Product drift expands V1 into cloud governance or an enterprise PM suite

**What goes wrong:** Solving status, review, sync, collaboration, analytics, or security concerns by adding a daemon, hosted database, dashboard, auth, billing, or heavyweight policy engine.

**Prevention:** Encode the V1 boundary in architecture decisions and acceptance criteria: one npm package, repository-local Markdown/small JSON as truth, explicit finite execution only, no daemon, no cloud, no hidden database, and no agent-authorized adjacent cleanup. Capture deferred ideas as non-actionable backlog notes outside an active Spec.

**Detection:** Every phase plan includes an out-of-scope review. Dependency and packaging review rejects services, credentials, background workers, databases, or additional packages unless the project explicitly re-scopes V1.

**Phase mapping:** **Phase 0 — Product boundary/constitution, then every phase gate.**

## Minor Pitfalls

### Pitfall 1: Status is cached rather than mechanically derived

**What goes wrong:** A pretty status file or runtime message becomes stale and users make decisions on it.

**Prevention:** Make `status` a pure rebuild from artifacts and Git state; any cache is disposable and labelled as such.

**Detection:** Manually alter the cache in a fixture and assert derived status remains unchanged.

**Phase mapping:** **Phase 1 — Deterministic helper.**

### Pitfall 2: Adapter versions and evidence tools are not recorded

**What goes wrong:** A future failure cannot be reproduced because the runtime, adapter, validator, or command semantics changed.

**Prevention:** Include tool/runtime/adapter versions and normalized command identifiers in operation and evidence records; publish a tested-support matrix rather than claiming universal compatibility.

**Detection:** Golden fixtures reject evidence missing a verifier identity/version and run against each declared supported runtime version.

**Phase mapping:** **Phase 4 — Adapter contract; Phase 5 — Evidence records.**

### Pitfall 3: Errors are prose-only and therefore non-actionable

**What goes wrong:** A model or user receives "failed" without knowing whether to retry, repair, amend scope, or stop.

**Prevention:** Use a small typed result taxonomy with machine-stable code, human explanation, related artifact IDs, safe next action, and whether user approval is required.

**Detection:** Contract tests assert every non-success terminal path returns a known type and no command relies on string matching to choose a transition.

**Phase mapping:** **Phase 1 — Domain state/result model.**

## Phase-Specific Warnings

| Phase topic | Likely pitfall | Mitigation |
|-------------|---------------|------------|
| 0. Product boundary | Cloud/enterprise scope sneaks in as a "small" dependency | Lock local-first, one-package, no-daemon constraints into the constitution and review every phase against them. |
| 1. Artifact model/helper | Split-brain state, invalid references, state guessed from prose | Schema validation, stable IDs, one deterministic transition engine, artifact graph checks, crash tests. |
| 2. Hierarchical planning | Plans/tasks become authorization or criteria change silently | Frozen approved-spec boundary, scope digest, explicit amendment/escalation state, activation guard. |
| 3. Init/package | Retry duplicates config or overwrites native user setup | Ownership markers, desired-state reconciliation, install manifest, no-overwrite conflicts, retry snapshots. |
| 4. First adapter | Runtime configuration and permission semantics are assumed equivalent | Capability manifest, thin adapter boundary, least privilege, adapter conformance fixture. |
| 5. Delivery/evidence | Builder self-certifies or alters tests to pass | Verification intent before code, frozen evidence contract, helper-controlled completion, mutation tests. |
| 6. Correction loop | Retry becomes an unbounded agent loop or rewrites the target | Persisted attempt budget, hypothesis per attempt, typed terminal results, original reverify contract. |
| 7. Resume/Git | Partial work is called verified; Git automation damages user changes | Separate checkpoint types, worktree/divergence preflight, explicit commit file list, no destructive Git automation. |
| 8. Additional adapters | Portability is claimed but state/progress semantics diverge | Start/pause/resume/correct/complete matrix across all runtimes and exact adapter/runtime versions. |
| 9. Security/abuse tests | Prompt injection, hooks, plugins, or auto permissions bypass authority | Treat external text as data; log helper mutations; restrict permissions; inject adversarial fixtures; fail closed. |
| 10. V1 polish/docs | Strong governance becomes burdensome and users bypass it | Progressive disclosure, doctor/status guidance, clean-repo usability tests, no duplicate state views. |

## Sources

All source-derived runtime claims below are **MEDIUM confidence**, as classified by the project research confidence seam after cross-checking current official pages. The phase recommendations are design conclusions from those constraints and the authoritative project brief.

- [Claude Code: Configure permissions](https://code.claude.com/docs/en/permissions) — permissions and sandboxing are distinct controls; current page fetched 2026-08-18.
- [Claude Code: Settings](https://code.claude.com/docs/en/configuration) — configuration precedence and cross-scope array merge behavior; current page fetched 2026-08-18.
- [Claude Code: Hooks reference](https://code.claude.com/docs/en/hooks) — hook configuration inspection and runtime extension surface; current page fetched 2026-08-18.
- [OpenAI: Running Codex safely](https://openai.com/index/running-codex-safely/) — sandboxing and approvals are complementary boundaries; current page fetched 2026-08-18.
- [Codex: AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) and [Codex: sandboxing](https://learn.chatgpt.com/docs/sandboxing) — instruction layering and execution-boundary behavior; current pages checked 2026-08-18.
- [OpenCode: Permissions](https://opencode.ai/docs/permissions) — current permission behavior and deprecation of legacy `tools`; current page fetched 2026-08-18.
- [OpenCode: Configuration](https://dev.opencode.ai/docs/config) — configuration precedence and project discovery; current page fetched 2026-08-18.
- [OpenCode V2: Config](https://opencode.ai/v2/docs/config) and [OpenCode CLI](https://dev.opencode.ai/docs/cli/) — evolving configuration and non-interactive session semantics; current pages checked 2026-08-18.
- [OpenCode V2: Plugins](https://opencode.ai/v2/docs/build/plugins) — plugin transformation and tool/session interception surface; current page fetched 2026-08-18.
- [Git: githooks](https://git-scm.com/docs/githooks) — commit-hook bypass and hook semantics; current page fetched 2026-08-18.
- [Git: git-worktree](https://git-scm.com/docs/git-worktree) — linked-worktree repair/removal behavior; current page fetched 2026-08-18.
