# Exspecso

Exspecso is a spec-driven harness engineering framework for AI coding agents. This glossary defines the canonical language used to describe its product workflow.

## Intent and planning

**Project Artifact**:
A durable, directly reviewable record of project intent, progress, evidence, or decisions that serves as project truth.
_Avoid_: Hidden state, chat memory, generated view

**Artifact Schema**:
The versioned contract that defines required structural frontmatter, ownership boundaries, validation rules, and deterministic serialization for a Project Artifact.
_Avoid_: Markdown template alone, inferred structure, runtime-specific format

**Artifact ID**:
An immutable, project-unique, type-prefixed identifier that preserves an entity's identity across revisions, renames, and historical lifecycle states.
_Avoid_: Mutable slug, directory path, reusable sequence number

**Artifact Transaction**:
A validated multi-file transition protected by a disposable write-ahead journal until its canonical artifact changes and Git checkpoint are durably accepted.
_Avoid_: State database, completion evidence, automatic overwrite recovery

**Roadmap**:
The ordered expression of a product goal as a finite sequence of Phases.
_Avoid_: Backlog, project plan

**Current Roadmap**:
The single nonterminal Roadmap selected by the `activeRoadmap` configuration pointer for orientation; its Entity Status may be `active` or `blocked` without changing that selection.
_Avoid_: Multiple active Roadmaps, Roadmap status, automatic successor

**Phase**:
A meaningful outcome boundary within a Roadmap that declares an ordered set of Specifications.
_Avoid_: Sprint, epic, release

**Baseline Phase**:
A human-confirmed description of pre-existing capability used as historical Roadmap context without claiming Exspecso delivery, verification, or completion evidence.
_Avoid_: Completed delivery Phase, inferred legacy scope, imported checkpoint

**Active Phase**:
The explicitly selected Phase used as a durable orientation pointer for planning and status guidance; it does not determine lifecycle truth, authorize work, or schedule delivery automatically.
_Avoid_: Current execution lock, automatic scheduler, Phase status

**Specification**:
The approved, independently deliverable unit of product intent that defines scope, Requirements, Acceptance Criteria, and Verification Intent.
_Avoid_: Feature brief, ticket, Spec file

**Requirement**:
A stable statement of behavior or capability that a Specification must deliver.
_Avoid_: Task, Acceptance Criterion

**Acceptance Criterion**:
A concrete condition that determines whether a Requirement has been satisfied.
_Avoid_: Requirement, test case

**Verification Intent**:
The evidence class and level chosen in advance to prove an Acceptance Criterion.
_Avoid_: Test command, builder confidence

**Readiness Validation**:
The mandatory, deterministic check that approved planning artifacts, traceability, Evidence Contracts, dependencies, and required capabilities are sufficient and mutually consistent before implementation proceeds.
_Avoid_: Product verification, optional safety gate, builder judgment

**Preflight Report**:
A fingerprint-bound `verify-report.md` produced by the optional `/exspecso-verify` operation to expose Readiness Validation as `pass`, `warn`, or `fail`; it becomes stale when relevant artifacts change.
_Avoid_: Completion evidence, permanent approval, implementation result

**Plan**:
The smallest approved delivery approach for one Specification, expressed as bounded, ordered Tasks.
_Avoid_: Roadmap, Phase, Specification

**Plan Status**:
The approval-validity lifecycle `draft`, `ready`, or `superseded`; it does not mirror implementation progress.
_Avoid_: Task progress, Specification status, delivery result

**Revision Impact Record**:
The confirmed classification of how a proposed change affects approved intent, verification, delivery scope, and existing evidence, including any explicit evidence carry-forward.
_Avoid_: Silent mutation, blanket invalidation, change summary

**Revision Proposal**:
A clearly non-canonical candidate change and its Revision Impact Record awaiting Content-bound Approval before promotion into stable current artifact paths.
_Avoid_: Current Specification, approved revision, alternate source of truth

**Content-bound Approval**:
An explicit human workflow confirmation attached to the fingerprints of the exact candidate revisions reviewed, so later material edits cannot silently retain approval.
_Avoid_: Chat acknowledgment, reusable approval, digital identity proof

**Default Flow**:
The canonical v11 workflow used for V1: project orientation, explicit Roadmap and Phase planning, deep planning of one Specification, and Specification-scoped delivery.
_Avoid_: Standard mode, Lite mode

**Operation**:
A runtime-neutral Exspecso action whose semantics and canonical hyphenated identifier remain the same across supported coding agents.
_Avoid_: Runtime command, adapter command

**Operation Result**:
A versioned structured envelope describing an Operation's typed outcome, targets, state fingerprints, Git state, changed artifacts, evidence or blockers, warnings, and recommended next command.
_Avoid_: Prose-only response, stack trace as workflow state, hidden operation record

**Runtime Adapter**:
A thin, generated, host-native skill or command that exposes an Exspecso Operation through a supported coding-agent runtime and delegates behavior to the shared CLI.
_Avoid_: Workflow engine, canonical state, runtime-specific implementation

**Runtime Capability Contract**:
The minimum host abilities required to execute Exspecso semantics—repository file access, pinned CLI and verification execution, Git inspection and scoped commits, human confirmation, and cold-start reconstruction—with documented fallback for optional capabilities.
_Avoid_: Feature parity by UI, plugin dependency, assumed host behavior

**Adapter Manifest**:
The repository-local ownership record for generated Runtime Adapter paths, target runtimes, template versions, and content hashes, used for safe updates and removal.
_Avoid_: Project status, runtime configuration replacement, hidden installer state

**Tool Runtime**:
The disposable, repository-local installation of the exact Exspecso CLI version pinned by project configuration and invoked by Runtime Adapters.
_Avoid_: Global installation, application dependency, canonical project evidence

**Effective Configuration**:
The deterministic policy result formed from built-in defaults, checked-in project configuration, approved artifact declarations, permitted invocation options, and non-overridable safety invariants.
_Avoid_: Adapter policy, hidden local correctness setting, bypass flag

**Execution Role**:
A portable, Exspecso-owned contract defining the bounded inputs, responsibilities, allowed outputs, and isolation requirements for an Implementer or Reviewer, independently of any runtime-specific agent implementation.
_Avoid_: Vendor agent type, canonical prompt, permanent agent identity

**Task**:
The smallest active execution boundary, independently reconstructible from approved intent and its Evidence Contract.
_Avoid_: To-do, step, subtask

**Task Baseline**:
The clean Git commit, approved path scope, and classified repository state recorded when a Task activates, against which its implementation, evidence, drift, and checkpoint contents are evaluated.
_Avoid_: Per-Task Git worktree, automatic branch, repository snapshot

**Eligible Task**:
The earliest Task in approved Plan order that is `ready` and whose explicit dependencies have accepted Verified Checkpoints, subject to the global WIP limit.
_Avoid_: First listed Task regardless of dependencies, parallel Task, implicitly ordered dependency

**Out-of-scope Finding**:
An evidenced observation discovered during delivery but not authorized by the current Task, retained canonically in that Task until explicitly dismissed or promoted through planning.
_Avoid_: Implicit scope expansion, hidden note, automatic backlog item

## Execution and evidence

**Entity Status**:
The canonical lifecycle state owned by one Roadmap, Phase, Specification, Plan, or Task and changed only through validated workflow transitions.
_Avoid_: Status Summary, loop result

**Cancellation**:
The explicit historical termination of an entity, which does not count as completion or remove it from required parent scope without an approved parent revision.
_Avoid_: Completion, deletion, automatic scope removal

**Status Summary**:
A derived, human-readable projection of canonical Entity Status, evidence, blockers, and the Delivery Loop's next action at Roadmap, Phase, or Specification scope.
_Avoid_: Canonical status, independent state, loop database

**Trace Summary**:
The checked-in `trace.md` projection generated from canonical relationships owned by Specifications, Plans, Tasks, checkpoints, Closure Reports, and Final Reviews.
_Avoid_: Independent trace database, manually maintained matrix, canonical relationship source

**Delivery Loop**:
The bounded workflow that advances one approved Specification through Task selection, execution, verification, checkpoints, closure evidence, and review until an explicit result is reached.
_Avoid_: Autonomous daemon, background loop, agent loop

**Evidence Contract**:
The concrete proof a Task must produce for its linked Acceptance Criteria before completion can be accepted.
_Avoid_: Success claim, self-review

**Approved Verification Command**:
A fingerprinted structured command declared by an Evidence Contract, including its executable, arguments, working directory, bounds, expected result, and explicitly permitted capabilities.
_Avoid_: Discovered shell snippet, unbounded script, Correction Loop invention

**Evidence Method**:
How proof is obtained—through a test, inspection, observation, or external confirmation—recorded separately from who evaluates it.
_Avoid_: Evaluator identity, evidence result, Verification Intent

**Evidence Evaluator**:
The command, independent agent, or human responsible for the final evidence judgment, with applicable provenance and independence recorded.
_Avoid_: Evidence Method, unrecorded AI assistance, assumed human review

**Human Attestation**:
An auditable declaration that a human reviewed the underlying evidence and accepted or rejected it; AI may assist but cannot be mislabeled as the human evaluator.
_Avoid_: Cryptographic identity proof, AI-only verdict, chat acknowledgment

**Evidence Boundary**:
The approved intent, verification contract, and repository state to which accepted evidence applies; a change invalidates the evidence when it affects something inside that boundary.
_Avoid_: Entire repository, permanent completion

**Drift Classification**:
The deterministic categorization of detected divergence as projection, editorial, contract, implementation, or structural drift before Exspecso regenerates, invalidates, or blocks.
_Avoid_: Automatic overwrite, blanket evidence invalidation, ignored repository change

**Correction Loop**:
The bounded recovery workflow that assesses failed evidence, learns, patches approved scope, and reruns the same Evidence Contract.
_Avoid_: RALP, retry loop, self-healing loop

**Correction Episode**:
The auditable sequence of diagnosis and bounded implementation attempts responding to one evidence failure, ending in accepted evidence, exhaustion, escalation, or interruption without erasing earlier attempts.
_Avoid_: Unbounded retry, hidden patch history, Specification revision

**Resume Checkpoint**:
A continuity record describing where an incomplete Task stopped and what should happen next.
_Avoid_: Completion checkpoint, done state

**Provisional Evidence**:
Evidence that passed its checks but has not yet been accepted into a durable Verified Checkpoint; it may be reused only while its complete Evidence Boundary and Git state still match.
_Avoid_: Task completion, Verified Checkpoint, permanently valid evidence

**Verified Checkpoint**:
The durable, revisioned completion boundary accepted only after a Task's required Evidence Contract passes, identified consistently in its evidence record and corresponding Git commit.
_Avoid_: Resume Checkpoint, progress save

**Closure Verification**:
Specification-level evidence used when correctness can only be proven across multiple Tasks or at a system boundary.
_Avoid_: Task verification, mandatory end-to-end test

**Closure Report**:
The canonical Specification-level record of a Closure Verification result, bound to the applicable Specification and Plan revisions, Acceptance Criteria, accepted Task checkpoints, verification contract, and tested Git state; superseded reports remain historical evidence.
_Avoid_: Status Summary, Task evidence, mutable latest result

**Final Review**:
The logically independent evaluation that decides whether the approved Specification, evidence, traceability, and resulting work are complete.
_Avoid_: Builder self-assessment

**Review Finding**:
A Final Review observation linked to the smallest affected stable IDs and classified as an implementation fix, Specification revision, or required human judgment.
_Avoid_: Unscoped feedback, automatic requirement, builder correction

**Review Packet**:
The bounded canonical input to Final Review, assembled from approved revisions, accepted checkpoints, closure evidence, traceability, repository changes, and current Git state without the Implementer's scratch reasoning or self-assessment.
_Avoid_: Chat transcript, builder summary, repository dump
