# Exspecso

Spec-driven harness engineering for Claude Code, OpenAI Codex, and OpenCode.

> Development is ongoing.

A spec doesn't stop an agent from expanding scope, overbuilding a solution, or
calling unfinished work done. You still have to check what it built, tell it
what to do next, and reconstruct the work when a session ends.

Exspecso is being built to carry an approved spec through implementation,
verification, correction, and review. You approve the work and resolve changes
to intent. The framework handles the routine steps within that scope and saves
enough state for another session to continue.

## Where Exspecso fits

[GSD](https://github.com/open-gsd/gsd-core) and
[BMAD](https://github.com/bmad-code-org/BMAD-METHOD) provide workflows for
planning, implementing, and verifying software.
[Matt Pocock's skills](https://github.com/mattpocock/skills) offer smaller,
composable practices for tasks such as clarifying requirements, testing, and
reviewing code.

Exspecso focuses on making the rules of delivery explicit and checkable across
coding agents. Its design separates the agent's reasoning from mechanical
bookkeeping: deterministic helpers calculate which work is ready, track
correction attempts, and validate checkpoints. Specs and progress stay in
Markdown and JSON files you can inspect, edit, and diff in your repository.

## From specs to execution

Spec engineering defines what to build, what's out of scope, and what counts
as success. Harness engineering covers how the agent works against that spec:
which context it gets, which Task runs next, what happens after a failed check,
and how work resumes after an interruption. These concerns overlap; Exspecso
uses the spec to define the rules for execution.

The planned workflow follows a few constraints:

- Approve one Phase, then work through its Specs and Tasks without prompting
  every next step. One Task runs at a time by default.
- Define verification before implementation. The builder can't weaken the
  approved checks to get a pass.
- Limit correction attempts and stop when continuing needs a scope change,
  missing information, or your judgment.
- Record interrupted work separately from verified work, so a new session
  can resume without mistaking a checkpoint for completion.
