# Phase 2 research, in plain language

Researched on September 7, 2026. This is a reading guide to the [full research report](./02-RESEARCH.md). Recommendations here still need to become implementation plans.

## What we found

Exspecso already knows how to find a Spec or Task in your repository. It can report duplicate IDs, some invalid references, and unsafe file paths. It also has code for saving changes and recovering interrupted writes.

What it cannot yet do is answer the next set of questions. Is this Phase approved? Have this Task's dependencies finished? Does the saved evidence support marking the Phase complete?

Finding a Spec file only proves that the file exists and Exspecso knows where it is. Phase 2 adds the rules that answer those questions. [Existing resolver](../../../src/artifacts/resolve.ts), [Phase 2 scope](./02-CONTEXT.md).

## What I recommend building

Use the existing TypeScript code and libraries. No new dependency is recommended.

Build a temporary picture of the project from its files whenever Exspecso needs to check state. That picture connects Phases, Specs, Tasks, dependencies, approvals, Decisions, and verification results. The files remain the saved record. A fresh session can rebuild the same picture.

From that information, the helper should provide these answers:

| What you need to know | What the helper checks |
|---|---|
| Can implementation start? | The current plan is approved, required dependencies are complete, and no relevant blocker prevents work. |
| What should happen next? | The saved state identifies the next eligible work or the reason work must stop. |
| What does this Task need to read? | Its required instructions and the exact relevant sections of other files. |
| Why was an important choice made? | Relevant saved Decisions, including earlier decisions they replaced. |
| Can the Phase finish? | Every required Spec and final check has passed, with no unresolved gap in the plan. |

Keep checking state separate from changing files. Asking for status should report problems and a useful next command. Recording a Decision or a human test result should use the existing safe-write code. [Full recommendations](./02-RESEARCH.md#architecture-patterns).

## An example

Suppose a Phase contains two Specs. The second depends on the first.

Both can be planned before implementation starts. You approve their plans together as part of the Phase approval. Exspecso then works on the first Spec. It starts the second only after the first meets its completion requirements.

If you close the session halfway through, the next session reads the saved files to find where work stopped.

If the approved plan changes, the old approval no longer authorizes the changed plan. Work and test results that remain valid should be preserved. The report also calls out an engineering issue to resolve: detecting a manual plan edit when someone forgets to update its version number. Merely comparing two version numbers cannot detect that edit.

## How we will know it works

Test small example repositories where we know the correct answer before running Exspecso. These examples should include:

- A valid plan that is still waiting on a dependency.
- An unknown dependency and a circular dependency.
- A Phase with missing or outdated approval.
- An environment problem that pauses implementation while leaving the plan valid.
- A missing requirement that sends work back to planning.
- A saved Decision that replaces an older one while preserving its reason.
- Human checks that are partly finished, then resumed in a fresh session.
- A Phase that can finish using existing evidence without asking for human checks.
- A file changed by someone else before a pending save, so Exspecso must avoid overwriting their edit.

These are proposed Phase 2 tests. The existing Phase 1 baseline passed all 98 tests across 11 files, and its TypeScript build passed, using Node 22.21.1 during this research.

## What remains to plan

The planner needs to turn these recommendations into a precise file format, helper operations, and ordered implementation tasks. It must make the approval and evidence checks explicit enough to test.

Phase 2 delivers the code that reads, checks, and records this state. The conversations that ask for approval and the workflows that run implementation belong to later phases.
