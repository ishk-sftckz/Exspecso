# Exspecso Product Thesis

**Status:** Approved  
**Canonical source:** [Exspecso in Notion](https://app.notion.com/p/ishakimanuel/Exspecso-2837d0b4dee2808c9745fc3d986960de)  
**Scope:** Product problem, desired outcomes, principles, and non-goals

> Exspecso engineers the operating environment around AI coding agents so they can turn approved product intent into reliable software delivery. It keeps execution aligned, bounded, evidence-gated, recoverable, and resumable without requiring humans to continuously supervise routine work.
>
> **The model writes the code. Exspecso engineers the conditions under which the model can do reliable work.**

## Problem

AI coding agents are increasingly capable of producing code, but code-generation ability does not automatically translate into reliable delivery.

The environment surrounding the agent is usually implicit and fragile:

- Intent lives in conversation history.
- Relevant context is mixed with accumulated noise.
- Scope boundaries are easy to reinterpret.
- Plans can drift away from the actual repository.
- Agents decide for themselves whether work is complete.
- Failures trigger improvisation or endless retries.
- Sessions end without a dependable handoff.
- Humans must repeatedly schedule, check, and redirect routine work.

Consequently, a powerful agent can move quickly while forgetting decisions, expanding scope, overengineering, repeating work, under-finishing, or shipping behavior that has not been proven against the approved intent.

The product problem is:

> **How can developers delegate meaningful software delivery to AI coding agents while preserving intent, scope, continuity, proof, and human control across the entire delivery process?**

## Target User

Exspecso is for developers and engineering teams that want substantial leverage from AI coding agents without accepting uncontrolled “vibe coding” or heavyweight process management. Its initial focus is solo developers and small teams.

The strongest initial users are:

- Solo founders who depend on agent speed but still need confidence in what ships.
- Developers working across long features, multiple sessions, or large repositories.
- Small teams that need requirements, implementation, and verification to remain aligned.
- Developers who switch between coding-agent runtimes without losing project intent.
- Teams that want stronger agent autonomy inside explicit boundaries, not autonomy without control.

## Jobs to Be Done

When delegating software work to an agent, users need to:

- Express what should be built, what is outside scope, and what success means.
- Let the agent execute approved work without constant prompting or rescheduling.
- Keep the agent focused on the current objective rather than adjacent improvements.
- Supply enough relevant context without repeatedly loading or rediscovering the entire project.
- Know whether the implementation satisfies the approved intent, not merely whether code exists or tests happen to be green.
- Recover safely from verification failures without losing the original target.
- Stop and resume work across sessions or agent runtimes with little rediscovery.
- Retain authority over intent, tradeoffs, scope changes, ambiguity, and overrides.

## Current Agent-Development Failure Modes

1. **Intent drift:** Earlier product decisions are forgotten or silently reinterpreted.
2. **Context rot and token waste:** Sessions accumulate irrelevant material, while new sessions repeatedly rediscover the same repository knowledge.
3. **Execution drift:** Conversational instructions do not remain authoritative throughout planning, implementation, and review.
4. **Agent overreach:** Agents absorb unrelated refactors, adjacent features, or speculative abstractions into the current work.
5. **Agent under-finishing:** Agents start additional work before proving and completing what is already active.
6. **Repository-detached planning:** Plans sound convincing but do not reflect the codebase that actually exists.
7. **Weak or post-hoc verification:** The agent implements first and then selects convenient evidence, substitutes low-level checks for user-visible proof, or relies on its own confidence.
8. **Unsafe correction:** Failing work is retried indefinitely, or the success criteria are weakened merely to obtain green.
9. **Session fragility:** Interruptions cause state loss, repeated work, or expensive reconstruction.
10. **Manual scheduling tax:** The human must repeatedly say “continue” or select the next already-approved unit of work.
11. **Artifact-management tax:** Structured workflows make users manually maintain files, statuses, trace links, and bookkeeping instead of benefiting from the structure.

## Desired Outcomes

Users need:

- **Intent fidelity:** Delivered behavior remains tied to explicitly approved product intent.
- **Bounded autonomy:** Agents can progress through approved work without continuous human scheduling, but cannot invent scope.
- **Evidence-backed completion:** “Done” means the required behavior has been proven at the appropriate level.
- **Efficient context:** Each operation receives the smallest sufficient context and can deliberately request more.
- **Completion pressure:** Active work is finished, verified, and stabilized before attention moves elsewhere.
- **Safe recovery:** Correctable failures are addressed without silently moving the target or retrying forever.
- **Cheap continuity:** Another session or supported agent can resume with minimal rediscovery.
- **Inspectability:** Users can understand and challenge intent, progress, evidence, and blockers.
- **Human control:** People retain ownership of product intent, ambiguity, scope changes, and meaningful tradeoffs.
- **Low operational burden:** Strong governance remains mostly invisible in the normal user experience.

The desired outcome is not more artifacts or better task tracking. It is:

> **More reliable agent-driven software delivery with less continuous supervision.**

## Why This Is Harness Engineering

Task management answers questions such as:

- What work items exist?
- Who or what is working on them?
- What is their status?

Artifact management answers:

- Where is information stored?
- How is it organized, linked, or versioned?

Neither category governs the complete conditions under which an agent performs reliable work.

Exspecso must govern:

- what intent is authoritative;
- what context the agent receives;
- what the agent may change;
- what work happens next;
- how far autonomy may extend;
- what happens when implementation fails;
- what evidence constitutes completion;
- when progress may advance;
- how interrupted work is reconstructed;
- when human judgment is required.

That surrounding control system is the **harness**.

Tasks are bounded units inside the harness. Artifacts provide durable state to the harness. Neither is the product category.

> **Spec-driven** describes where authority and scope come from.  
> **Harness engineering** describes the broader system that controls agent execution.  
> **Delivery loops** describe how that system advances through finite approved work.

## Product Principles

- Approved intent is the execution authority.
- Durable project truth must survive conversation and session boundaries.
- Context should be selected, not accumulated.
- Autonomy must be useful but bounded.
- Evidence must be defined before implementation and control completion.
- The active work boundary must resist adjacent scope and speculative improvement.
- Failures must produce bounded correction or explicit escalation.
- Mechanical state should not depend on agent memory or confidence.
- Structure should appear progressively as the work demands it.
- Governance should be strong internally and quiet in the user experience.
- Humans must always be able to revise intent, override decisions, and stop execution.

## Product Non-Goals

Exspecso is not intended to become:

- A full enterprise SDLC replacement.
- A heavyweight project-management or task-management suite.
- A system whose primary value is generating or organizing Markdown.
- A hidden database that owns project truth.
- A replacement for Git.
- A role-playing simulation of a large software organization.
- An always-running or unbounded autonomous coding system.
- A workflow dependent on chat memory.
- A universal TDD methodology.
- A system requiring broad end-to-end verification after every small change.
- A framework that exposes all of its internal bookkeeping to the user.
- A license for agents to expand scope, redesign requirements, or redefine completion.
- Premature architectural machinery or enterprise ceremony before the work requires it.

## Layer Boundary

This thesis defines only:

- **Problem:** why Exspecso should exist and whose problem it addresses.
- **Desired outcome:** what must become better for the user.
- **Product principles:** durable rules that constrain later product decisions.
- **Product non-goals:** boundaries that keep the product focused.

The following layers must be defined separately after this thesis:

- **Harness capabilities:** what the product must be able to do.
- **User workflow:** how users interact with those capabilities.
- **Architecture mechanisms:** how the system realizes the workflow and capabilities.
- **Implementation details:** concrete technologies, files, schemas, commands, and code structure.

References to context, verification, recovery, and continuity in this thesis describe required product outcomes or responsibility areas. They do not select architecture or implementation mechanisms.

Previous repository context documents, ADRs, and GitHub issue #1 belong to a superseded product-definition attempt and are not product authority.

## Sources

- [Exspecso — canonical product page](https://app.notion.com/p/ishakimanuel/Exspecso-2837d0b4dee2808c9745fc3d986960de)
- [Exspecso — Pitch & Founder's Message v2](https://app.notion.com/p/3bc7d0b4dee281e0b538d29e504302b1)
- [Design Principles / Foundations](https://app.notion.com/p/30c7d0b4dee280daaf81ff66ad8c960d)
- [Reflection: How Exspecso Solves Problems](https://app.notion.com/p/3bc7d0b4dee2809f8775db0642ecce76)
