# Phase 1: Initialize Canonical Projects - Research

**Researched:** 2026-08-26  
**Domain:** TypeScript/Node repository initializer, canonical artifacts, runtime-native agent adapters, and crash-safe filesystem transactions  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Initial artifact contents
- **D-01:** Initial exspecso.config.json records only active setup state: schema version, generated stable project identity, editable project title, mode, selected agents, and onboarding status. Later workflows add configuration when it becomes relevant.
- **D-02:** init records mode as unclassified. /exspecso-start determines greenfield or brownfield later from repository evidence.
- **D-03:** Initial constitution.md contains concise framework invariants only: artifact truth, human control, evidence integrity, bounded scope, and runtime portability. It contains no guessed project-specific rules.
- **D-04:** Project identity is an opaque globally unique ID. The human-readable project title is separate and editable. — **Reversibility:** costly — changing an issued project ID would require updating persisted references and could break continuity across repository copies or runtime handoffs.

### Runtime selection experience
- **D-05:** Interactive init always shows Claude Code, OpenAI Codex, and OpenCode. Every option starts unchecked; detection is an informational label only and never selects on the user's behalf.
- **D-06:** At least one runtime is required. Submitting an empty selection keeps the selector open with an explanation and permits explicit cancellation.
- **D-07:** Non-interactive terminals and scripts use repeatable --agent flags. Interactive terminals retain the checkbox selector.
- **D-08:** Successful init shows /exspecso-start as the canonical next operation, then shows only the exact native invocation for each selected runtime, such as $exspecso-start for Codex.

### Adapter refresh conflicts
- **D-09:** Adapter refresh uses managed-file fingerprints. An unchanged managed file refreshes automatically; a locally modified file is preserved, accompanied by a concise diff and an explicit replacement path.
- **D-10:** Rerunning init is additive. Checked adapters are added or refreshed; previously installed adapters left unchecked remain untouched. An unchecked box is never deletion authority.
- **D-11:** Each adapter carries a small generated header containing its Exspecso template version and original-content hash. No separate adapter manifest or hidden adapter-state file is created.
- **D-12:** init preflights the complete selected change set before writing. Any unresolved adapter conflict blocks all writes; all detected conflicts are reported together.
- **D-13:** V1 does not attempt automatic three-way merging of modified adapters. Replacement requires explicit review and approval.

### Failure and validation UX
- **D-14:** If no containing Git repository exists, init fails before any write, identifies the searched path, and explains how to run git init or move into the intended repository. Exspecso never initializes Git implicitly.
- **D-15:** Validation reports every independently detectable error in one pass. Each error includes a stable code, exact artifact path or section, expected and actual values, and a concrete repair hint.
- **D-16:** Validation and resolution failures exit nonzero and never repair or mutate canonical artifacts implicitly.
- **D-17:** Duplicate stable IDs make resolution ambiguous. Exspecso lists every conflicting definition, selects none, and blocks the operation until the user repairs the duplicate.
- **D-18:** After an interrupted atomic write, the next invocation may remove only clearly identified Exspecso staging debris, must confirm that the previous canonical set remains valid, and reports the recovery. Ambiguous or externally changed canonical files cause a fail-closed stop.

### the agent's Discretion
- Exact TypeScript libraries for CLI prompts, schema validation, atomic filesystem operations, and unique-ID generation.
- Exact error-code names, provided they are stable and structured.
- Exact staging-directory naming, managed-header syntax, and hash algorithm, provided the decisions above remain inspectable and deterministic.
- Exact adapter file templates and runtime-native installation paths, constrained by each runtime's current official contract and the shared exspecso-<operation> identity.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| SETUP-01 | Initialize from repository root with `npx exspecso init`. | Package bin entry, Git-root resolver, fixture-based CLI tests. |
| SETUP-02 | Initialize from a nested directory against the containing Git root. | Resolve root once before reading or writing; launch CLI in nested fixture tests. |
| SETUP-03 | Select one or more supported runtimes. | TTY checkbox flow plus repeatable `--agent` parser. |
| SETUP-04 | Show detection suggestions while retaining user control. | Detection is presentation metadata only; no default selections. |
| SETUP-05 | Write only selected native integrations. | Adapter registry maps a runtime to its native paths and templates. |
| SETUP-06 | Create only minimal initial canonical artifacts. | Explicit initial-artifact template set; prohibit Roadmap/Phase/Spec families. |
| SETUP-07 | Rerun to add or refresh adapters without replacing confirmed artifacts. | Managed header/hash comparison, preflight, additive mutation plan. |
| SETUP-08 | Show portable next operation and selected native spellings. | One shared operation identity plus formatter per adapter. |
| ART-01 | Inspect truth through repository Markdown and JSON. | Canonical artifact schemas and paths remain plain files. |
| ART-02 | Require no database, cloud state, duplicate views, or export. | Native Node filesystem only; staging state is temporary and cleaned/recovered. |
| ART-03 | Address all listed artifact kinds by stable ID. | Build the parser/ID registry now, with lazy templates for future kinds. |
| ART-04 | Rename titles/slugs without changing identity/parents. | Separate immutable ID fields from mutable display fields in schemas. |
| ART-05 | Materialize deeper artifacts only when actionable. | Initial templates intentionally exclude later workflow families. |
| ART-06 | Resolve IDs to canonical file/section, including `TASK-NNN` sections. | Define resolver interfaces and fixtures now; implement all supported initial paths. |
| ART-07 | Preserve the last valid set across interrupted multi-file writes. | Journaled stage/commit/recover transaction with injected-failure tests. |
| ART-08 | Validate direct edits with explicit errors. | Zod parsing plus cross-file/ID validation accumulated into structured diagnostics. |
| ART-09 | Keep one stable Roadmap at `.exspecso/roadmap.md`. | Reserve and validate the sole future Roadmap path without creating it in init. |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- Canonical state must remain ordinary repository Markdown and small JSON that users can inspect, edit, diff, and reconstruct. [VERIFIED: AGENTS.md:15]
- Ship one TypeScript/Node npm package and one codebase; support libraries require current ecosystem research. [VERIFIED: AGENTS.md:16]
- Claude Code, OpenAI Codex, and OpenCode must preserve shared operations, artifacts, and portable `exspecso-<operation>` IDs. [VERIFIED: AGENTS.md:17]
- Public documentation uses `/exspecso-<operation>`; adapters may translate only their host-owned sigil. [VERIFIED: AGENTS.md:18]
- Preserve the three-layer separation: canonical artifacts, deterministic helper, then runtime orchestration. [VERIFIED: AGENTS.md:19]
- Do not introduce a second Roadmap, active-Roadmap selector, separate Roadmap status artifact, or `new-roadmap` command. [VERIFIED: AGENTS.md:21]
- Before implementation edits, use a GSD workflow entry point; Phase execution uses `/gsd-execute-phase`. [VERIFIED: AGENTS.md:68-76]

## Summary

Phase 1 should establish one testable TypeScript package whose CLI locates the containing Git root, plans all intended changes, validates both existing and proposed artifacts, then commits only a safe transaction. Keep the product split exactly at the project boundary: plain canonical files are the truth, a deterministic helper parses/validates/resolves/writes them, and thin runtime adapters only translate native invocation conventions. [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:81-90]

The adapter contract is sufficiently concrete to plan now: Claude project skills live under `.claude/skills/<skill-name>/SKILL.md` and expose the directory-name slash command; Codex scans repository `.agents/skills` from CWD to Git root and uses `$` for explicit skill mention; OpenCode project commands are Markdown files in `.opencode/commands` and expose their filename as a slash command. [CITED: https://code.claude.com/docs/en/skills] [CITED: https://learn.chatgpt.com/docs/build-skills] [CITED: https://opencode.ai/docs/commands/]

**Primary recommendation:** Build a Node-native transaction/recovery module and an adapter registry before wiring the `init` UX; install only TypeScript, Zod, Inquirer prompts, and Vitest, with human verification checkpoints for the two packages currently flagged as newly published.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Locate containing Git repository | API / Backend (local CLI service) | Database / Storage | The CLI makes the authoritative root decision before any filesystem access. [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:86-87] |
| Canonical artifact parse, validate, resolve | API / Backend | Database / Storage | Deterministic helper owns mechanics over repository files, not adapters. [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:87-89] |
| Transactional staging, commit, and recovery | Database / Storage | API / Backend | Filesystem layer owns durable writes; CLI reports its result. [CITED: https://nodejs.org/api/fs.html] |
| Runtime selection and completion UX | API / Backend | Browser / Client | The terminal UI collects explicit intent, while no browser or remote service participates. [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:22-26] |
| Native agent adapters | CDN / Static | API / Backend | Checked-in prompt/skill files are static adapter surfaces generated from shared operation metadata. [CITED: https://code.claude.com/docs/en/skills] [CITED: https://learn.chatgpt.com/docs/build-skills] [CITED: https://opencode.ai/docs/commands/] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---|---:|---|---|
| Node.js built-ins (`node:fs/promises`, `node:path`, `node:crypto`, `node:util`) | `>=20.0.0` | Filesystem, paths, UUIDs, strict CLI argument parsing | Avoids an extra transaction, ID, or argument-parser dependency. Node provides `parseArgs` with repeatable options, `randomUUID`, staging directories, flush, and rename primitives. [CITED: https://nodejs.org/api/util.html] [CITED: https://nodejs.org/api/crypto.html] [CITED: https://nodejs.org/api/fs.html] |
| `typescript` | `7.0.2` | Type-safe package source and declarations | Current package is from the official TypeScript project and passed the legitimacy gate. [VERIFIED: npm registry] |
| `zod` | `4.4.3` | JSON/frontmatter shape validation and typed parsed values | `safeParse` permits accumulated diagnostics rather than fail-fast parsing; package is official and passed the legitimacy gate. [CITED: https://zod.dev/packages/zod] [VERIFIED: npm registry] |

### Supporting

| Library | Version | Purpose | When to Use |
|---|---:|---|---|
| `@inquirer/prompts` [WARNING: flagged as suspicious — verify before using.] | `8.6.0` | Interactive unchecked runtime checklist and explicit cancellation | TTY only; non-interactive calls must use `--agent` flags. The official package exports `checkbox`; its current release is too new for the legitimacy heuristic, so a human must confirm the locked version before installation. [CITED: https://github.com/SBoudrias/Inquirer.js/tree/main/packages/prompts] |
| `vitest` [WARNING: flagged as suspicious — verify before using.] | `4.1.11` | Unit and integration tests for pure contracts, filesystem fixtures, and CLI invocations | Add as a dev dependency; official docs require Node `>=20.0.0`. Its current release is too new for the legitimacy heuristic, so a human must confirm the locked version before installation. [CITED: https://vitest.dev/guide/] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| Node `util.parseArgs` | A general CLI framework | Unnecessary for one `init` subcommand and repeatable `--agent`; keep option semantics deterministic with the built-in parser. [CITED: https://nodejs.org/api/util.html] |
| `@inquirer/prompts` | Hand-written `readline` checkbox UI | Do not hand-roll keyboard selection, cancellation, and TTY behavior; the maintained prompt package supplies checkbox and cancellation handling. [CITED: https://github.com/SBoudrias/Inquirer.js/tree/main/packages/prompts] |
| Zod schemas | Ad-hoc JSON property checks | Cross-file diagnostics, schema evolution, and safe parsing become harder to keep consistent. [CITED: https://zod.dev/packages/zod] |

**Installation:**

```bash
npm install zod
npm install @inquirer/prompts
npm install -D typescript vitest
```

**Version verification:** Registry checks on 2026-08-26 returned TypeScript `7.0.2`, Zod `4.4.3`, Vitest `4.1.11`, and Inquirer prompts `8.6.0`; none declared a `postinstall` script. [VERIFIED: npm registry]

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---|---|---:|---:|---|---|---|
| `typescript` | npm | 14 yrs | 273M/wk | github.com/microsoft/TypeScript | OK | Approved [VERIFIED: npm registry] |
| `zod` | npm | 4 yrs | 270M/wk | github.com/colinhacks/zod | OK | Approved [VERIFIED: npm registry] |
| `vitest` | npm | 5 yrs | 95M/wk | github.com/vitest-dev/vitest | SUS: latest published 2026-08-18 | Flagged — add `checkpoint:human-verify` before install. [CITED: https://vitest.dev/guide/] |
| `@inquirer/prompts` | npm | 3 yrs | 38M/wk | github.com/SBoudrias/Inquirer.js | SUS: latest published 2026-08-19 | Flagged — add `checkpoint:human-verify` before install. [CITED: https://github.com/SBoudrias/Inquirer.js/tree/main/packages/prompts] |

**Packages removed due to [SLOP] verdict:** none.  
**Packages flagged as suspicious [SUS]:** `vitest`, `@inquirer/prompts`; the planner must insert a human-verification checkpoint before each installation.

## Architecture Patterns

### System Architecture Diagram

```text
CLI: npx exspecso init (root or nested CWD)
            |
            v
Git-root resolver ---- no containing repo ----> structured error; zero writes
            |
            v
input parser + TTY selector ---- empty selection ----> explanation / cancel
            |
            v
init planner
  | read current canonical files + managed adapter headers
  | detect runtimes (label only)
  v
validator + resolver ---- any errors/conflicts ----> aggregate diagnostics; zero writes
            |
            v
transaction writer
  stage -> verify staged contents -> journal -> commit -> cleanup
            |                                      |
            |                                      +--> interruption -> recovery verifies or restores
            v
adapter registry --> Claude skill / Codex skill / OpenCode command files
            |
            v
completion formatter --> /exspecso-start + only selected native invocations
```

The CLI must turn a nested working directory into one Git root before it computes any target path; that is the boundary that prevents duplicate project state. [VERIFIED: .planning/REQUIREMENTS.md:11-18]

### Recommended Project Structure

```text
src/
├── cli/                 # argument parsing, TTY detection, output, exit mapping
├── init/                # init planner, runtime selection, completion formatter
├── artifacts/           # schemas, parsers, validators, resolver, templates
├── filesystem/          # staged transaction, journal, hash, recovery, safe paths
├── adapters/            # runtime registry, paths, managed headers, templates
└── errors/              # stable diagnostic model and renderer
tests/
├── fixtures/            # minimal Git repositories and hand-authored artifacts
├── integration/         # spawned CLI/root/nested/rerun/recovery tests
└── unit/                # schema, resolver, planning, and adapter tests
```

### Pattern 1: Plan, then commit one mutation set

**What:** Produce an immutable `InitPlan` containing every proposed canonical and adapter write, expected preimage hash, and conflict before creating staging files. Validate the existing project and proposed result as a set; only a conflict-free plan can enter the write path. [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:29-33]

**When to use:** Every `init` invocation, including fresh setup and reruns.

**Example:**

```typescript
const parsed = artifactSchema.safeParse(input);
if (!parsed.success) return toDiagnostics(parsed.error);

const plan = await buildInitPlan(parsed.data, repositoryRoot);
const diagnostics = await validatePlan(plan);
if (diagnostics.length > 0) return { kind: "invalid", diagnostics };

return commitTransaction(plan);
```

Source: Zod documents `safeParse`; transaction orchestration is the phase-specific implementation pattern. [CITED: https://zod.dev/packages/zod] [ASSUMED]

### Pattern 2: Managed adapter header is the only ownership record

**What:** Render each generated adapter with a compact comment header containing template version and SHA-256 of the template body. On rerun, parse its own header and compare the stored original hash to the actual body hash: match means automatic refresh is safe; mismatch means preserve it and emit a unified diff plus an explicit replace choice. [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:29-33]

**When to use:** Only files the adapter registry itself generated. Files without a valid Exspecso header are unowned and must never be overwritten. [ASSUMED]

### Pattern 3: Journaled staged transaction with conservative recovery

**What:** Stage every planned output under a private directory inside the same repository filesystem, write a journal with transaction ID, allowed target paths, preimage hashes, staged hashes, and commit step, then validate staged files before any promotion. Use file flush and rename primitives. On startup, recover only a journal whose paths and hashes match exactly; otherwise stop with an explicit error and leave files untouched. Node supplies `mkdtemp`, `FileHandle.sync`, and `rename`, but the proposed journal shape and multi-file state machine are Phase 1 implementation choices. [CITED: https://nodejs.org/api/fs.html] [ASSUMED]

**When to use:** Every canonical multi-file write and every generated adapter change produced by `init`.

**Commit policy:** Never use an unbounded recursive delete for recovery. Only delete a staging directory named and validated by the journal after proving the canonical set is valid; retain/restore the known backup if the commit was interrupted. This implements the locked fail-closed recovery rule. [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:35-40]

### Pattern 4: Strict flags and TTY split

**What:** Parse repeatable `--agent` values with `util.parseArgs({ strict: true, options: { agent: { type: "string", multiple: true } } })`; use the checkbox selector only when both input and output are TTYs. Treat an empty accepted selection as validation failure in the interactive loop, not as “install all.” [CITED: https://nodejs.org/api/util.html] [CITED: https://github.com/SBoudrias/Inquirer.js/tree/main/packages/prompts]

**When to use:** The `init` entry point; tests should inject streams rather than drive a real terminal. [ASSUMED]

### Adapter installation map

| Runtime | Native destination | Generated unit | Visible invocation |
|---|---|---|---|
| Claude Code | `.claude/skills/exspecso-start/SKILL.md` | Agent Skill directory | `/exspecso-start` [CITED: https://code.claude.com/docs/en/skills] |
| OpenAI Codex | `.agents/skills/exspecso-start/SKILL.md` | Agent Skill directory with `name` and `description` | `$exspecso-start` [CITED: https://learn.chatgpt.com/docs/build-skills] |
| OpenCode | `.opencode/commands/exspecso-start.md` | Markdown command | `/exspecso-start` [CITED: https://opencode.ai/docs/commands/] |

The literal shared identity is `exspecso-<operation>` and the public notation is `/exspecso-<operation>`; quote: “`exspecso-<operation>` is the portable skill identity. `/exspecso-<operation>` is the canonical documentation notation.” [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:35]

### Anti-Patterns to Avoid

- **Detection-driven selection:** Never precheck a detected runtime; it violates explicit user control. [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:22-25]
- **Adapter manifest or cached projection:** Do not add a separate adapter ownership database; the generated file header is the complete ownership evidence. [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:29-31]
- **Best-effort per-file writes:** Do not expose partial canonical state and call it atomic; journal/restore/fault tests are required. [VERIFIED: .planning/REQUIREMENTS.md:27-29]
- **Automatic merge or overwrite of changed adapters:** Preserve the local file and require explicit replacement. [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:29-33]
- **Eager workflow skeletons:** Do not create Roadmap, Phase, Spec, trace, research, or report artifacts during init. [VERIFIED: .planning/REQUIREMENTS.md:15-18]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Interactive multi-select terminal UI | Custom raw-mode keyboard loop | `@inquirer/prompts` checkbox [WARNING: verify first] | Handles checkbox interaction, cancellation, and streams; official docs note non-TTY limitations. [CITED: https://github.com/SBoudrias/Inquirer.js/tree/main/packages/prompts] |
| JSON structure validation | Scattered optional-property checks | Zod object schemas and `safeParse` | Produces one typed parsing boundary that can feed aggregated diagnostics. [CITED: https://zod.dev/packages/zod] |
| UUID generation | Custom random ID algorithm | `node:crypto` `randomUUID` | Generates RFC 4122 version-4 UUIDs using a cryptographic pseudorandom generator. [CITED: https://nodejs.org/api/crypto.html] |
| CLI option parsing | Custom `argv` scanner | `node:util` `parseArgs` | Supports strict parsing and repeatable string options. [CITED: https://nodejs.org/api/util.html] |
| Cross-runtime adapter discovery | One universal copied adapter format | Native Claude/Codex skills and OpenCode commands | Each host documents a distinct local discovery contract. [CITED: https://code.claude.com/docs/en/skills] [CITED: https://learn.chatgpt.com/docs/build-skills] [CITED: https://opencode.ai/docs/commands/] |

**Key insight:** The transaction protocol itself is product-specific and must be implemented, but its primitives, prompt UX, schema parsing, IDs, and CLI parsing should be reused from the supported ecosystem.

## Common Pitfalls

### Pitfall 1: Treating `rename` as a complete multi-file transaction

**What goes wrong:** A crash can leave different targets at different generations if each is independently renamed.  
**Why it happens:** Node documents a single-path rename and flush primitives, not a portable all-or-nothing multi-file commit protocol. [CITED: https://nodejs.org/api/fs.html]  
**How to avoid:** Implement explicit preflight, stage, journal, commit-step recording, rollback/recovery, and injected failure tests at every promotion point.  
**Warning signs:** A test can kill the process after any write and then find a parseable but mixed canonical set. [ASSUMED]

### Pitfall 2: Confusing generated adapter ownership with runtime detection

**What goes wrong:** Existing local files get overwritten because a runtime is detected or a checkbox was previously selected.  
**Why it happens:** Installation state is inferred rather than proven from a managed header/body hash.  
**How to avoid:** Treat detection as a label; only a valid Exspecso header controls automatic refresh. Preserve all mismatches and report all conflicts before writes. [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:22-33]

### Pitfall 3: Prompting in scripts or accepting zero runtimes

**What goes wrong:** CI/hooked execution hangs or creates an unusable project.  
**Why it happens:** Inquirer cannot operate in a non-interactive shell, and an empty runtime set violates the product decision. [CITED: https://github.com/SBoudrias/Inquirer.js/tree/main/packages/prompts] [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:22-25]  
**How to avoid:** Gate prompt use on TTY, require repeatable `--agent` flags otherwise, and make interactive empty submit retry/cancel explicitly.  
**Warning signs:** `stdin.isTTY` is false or parsed agent list is empty. [ASSUMED]

### Pitfall 4: Letting direct edits throw raw parser errors

**What goes wrong:** Users get one generic stack trace instead of every repairable location.  
**Why it happens:** File parsing is interwoven with command control flow.  
**How to avoid:** Normalize schema, relationship, duplicate-ID, path, and preimage failures into one diagnostic collection with stable code, location, expected/actual, and repair hint. [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:35-39]

## Code Examples

### Schema-first validation and accumulated diagnostics

```typescript
const result = projectConfigSchema.safeParse(JSON.parse(text));

if (!result.success) {
  return result.error.issues.map(issue => diagnosticFromIssue(path, issue));
}

return validateRelationships(result.data);
```

Source: Zod documents `safeParse`; converting issues to the project’s stable diagnostic envelope is Phase 1-specific. [CITED: https://zod.dev/packages/zod] [ASSUMED]

### TTY/non-interactive selection boundary

```typescript
const agents = process.stdin.isTTY && process.stdout.isTTY
  ? await chooseAgentsInteractively()
  : parsedValues.agent ?? [];

if (agents.length === 0) return noRuntimeSelected();
```

Source: Inquirer requires an interactive TTY; repeatable `multiple: true` CLI options are supported by Node `parseArgs`. [CITED: https://github.com/SBoudrias/Inquirer.js/tree/main/packages/prompts] [CITED: https://nodejs.org/api/util.html]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Claude custom commands and standalone prompt files | Agent Skills under `.claude/skills` | Current Claude docs merge custom commands into skills | Use portable `SKILL.md` directories for the Claude adapter. [CITED: https://code.claude.com/docs/en/skills] |
| Codex custom prompts for reusable flows | Agent Skills with `$` explicit mention | Current Codex skills documentation | Use `.agents/skills`, not a bespoke slash-command emulation. [CITED: https://learn.chatgpt.com/docs/build-skills] |
| Full Inquirer package API | Modular `@inquirer/prompts` package | Current project documentation | Import only the checkbox prompt needed by init. [CITED: https://github.com/SBoudrias/Inquirer.js/tree/main/packages/prompts] |

**Deprecated/outdated:** Do not model an Exspecso command as a colon-qualified raw skill identifier. The portable identity must remain `exspecso-<operation>`; quote: “A runtime may translate only a host-owned invocation sigil, such as Codex's `$exspecso-<operation>` explicit skill invocation.” [VERIFIED: docs/specs/SPEC-exspecso-v13-phase-oriented-workflow.md:35]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | A single test command can be standardised as `npm test -- --run` after Wave 0 creates package scripts. | Validation Architecture | Low; planner must define the script before using it in later tasks. |
| A2 | Generated adapters can share a short managed header syntax appropriate to each target’s comment format. | Architecture Patterns | Medium; adapter conformance fixtures must validate target parser compatibility. |
| A3 | Journal-based rollback/recovery will satisfy crash safety on every V1 supported filesystem/OS. | Common Pitfalls | High; prove with fault injection and a platform matrix before claiming the requirement complete. |

## Open Questions

1. **RESOLVED — What exact cross-platform filesystem guarantee is accepted for ART-07?**
   - What we know: Node exposes staging, `sync`, and `rename`, while the context requires fail-closed recovery. [CITED: https://nodejs.org/api/fs.html] [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:35-40]
   - **Accepted boundary (2026-08-26, D-19):** Phase 1 proves process interruption, injected exceptions, and killed-process recovery at every declared promotion step. Physical power-loss durability and universal APFS/NTFS/ext4 guarantees are explicitly outside the Phase 1 evidence claim until separate platform evidence exists.
   - Planning consequence: Implement journaled recovery and deterministic fault injection now; phrase every ART-07 acceptance criterion and completion claim within this evidence boundary.

2. **Which initial artifact IDs must be materialized in Phase 1?**
   - What we know: The initial artifacts are minimal, while later Roadmap/Phase/Spec artifacts are lazy. [VERIFIED: .planning/REQUIREMENTS.md:15-18]
   - What's unclear: The exact stable ID assigned to the initial constitution/configuration family is not yet locked.
   - Recommendation: Add a planner checkpoint to freeze the initial artifact schema and ID vocabulary before implementation; preserve the already locked future `ROADMAP` literal. Quote: “one stable `ROADMAP` artifact at `.exspecso/roadmap.md`.” [VERIFIED: .planning/REQUIREMENTS.md:30]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---:|---|---|
| Node.js | CLI, package build, tests | ✓ | `v25.2.1` | Minimum proposed runtime is Node `>=20.0.0`; no older-runtime fallback. [VERIFIED: environment probe 2026-08-26] [CITED: https://vitest.dev/guide/] |
| npm/npx | package install and published CLI invocation | ✓ | `11.6.2` | — [VERIFIED: environment probe 2026-08-26] |
| Git | repository-root discovery and fixture setup | ✓ | `2.50.1` | Init must fail before writes if no containing Git repository. [VERIFIED: environment probe 2026-08-26] [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:35-36] |
| Claude/Codex/OpenCode binaries | Adapter generation | Not required | — | Generated-file conformance fixtures test paths and content without installing each host. [ASSUMED] |

**Missing dependencies with no fallback:** none for planning; `vitest` and `@inquirer/prompts` require human verification before installation.  
**Missing dependencies with fallback:** none.

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Vitest `4.1.11` [WARNING: human verify before install] [CITED: https://vitest.dev/guide/] |
| Config file | none — create in Wave 0 |
| Quick run command | `npm test -- --run` [ASSUMED] |
| Full suite command | `npm test -- --run` [ASSUMED] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| SETUP-01 | Root invocation initializes once | integration | `npm test -- --run tests/integration/init-codex-tracer.test.ts` | ❌ Wave 0 |
| SETUP-02 | Nested invocation resolves Git root | integration | `npm test -- --run tests/integration/init-codex-tracer.test.ts` | ❌ Wave 0 |
| SETUP-03, SETUP-04 | Explicit selection and suggestion-only detection | unit + integration | `npm test -- --run tests/unit/runtime-selection.test.ts` | ❌ Wave 0 |
| SETUP-05, SETUP-08 | Selected native files and completion render | unit | `npm test -- --run tests/unit/adapters.test.ts` | ❌ Wave 0 |
| SETUP-06, ART-05, ART-09 | Minimal initial tree and reserved Roadmap contract | integration | `npm test -- --run tests/integration/minimal-artifacts.test.ts` | ❌ Wave 0 |
| SETUP-07 | Additive rerun and managed-file conflict behavior | integration | `npm test -- --run tests/integration/init-rerun.test.ts` | ❌ Wave 0 |
| ART-01, ART-02, ART-03, ART-04, ART-06 | Schema, stable-ID parsing/resolution, direct edit behavior | unit | `npm test -- --run tests/unit/artifacts.test.ts` | ❌ Wave 0 |
| ART-07 | Failure at every commit step restores/retains a valid set | integration | `npm test -- --run tests/integration/transaction-recovery.test.ts` | ❌ Wave 0 |
| ART-08 | Aggregate structured diagnostics and nonzero CLI exit | integration | `npm test -- --run tests/integration/validation-errors.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --run` [ASSUMED]
- **Per wave merge:** `npm test -- --run` [ASSUMED]
- **Phase gate:** Full suite green plus fault-injection and manual TTY/non-TTY smoke checks before `$gsd-verify-work`. [ASSUMED]

### Wave 0 Gaps

- [ ] `package.json`, `tsconfig.json`, and package bin entry — Node package baseline
- [ ] `vitest.config.ts` and test scripts — Vitest execution contract
- [ ] `tests/helpers/git-fixture.ts` — isolated temporary Git repository fixture
- [ ] `tests/helpers/run-cli.ts` — child-process CLI harness with cwd/stdin/env control
- [ ] transaction fault-injection seam — deterministic failure after each staged commit step

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | no | Local CLI has no authentication boundary in this phase. [VERIFIED: .planning/REQUIREMENTS.md:11-30] |
| V3 Session Management | no | No server session state. [VERIFIED: .planning/REQUIREMENTS.md:11-30] |
| V4 Access Control | yes | Constrain every generated target to the discovered repository root; reject traversal, symlink ambiguity, and unowned files. [ASSUMED] |
| V5 Input Validation | yes | Zod validates JSON/frontmatter shape; deterministic cross-file validation aggregates all detected errors. [CITED: https://zod.dev/packages/zod] [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:35-39] |
| V6 Cryptography | yes | Use `crypto.randomUUID` for IDs and a standard SHA-256 implementation for managed-file fingerprints; do not invent cryptography. [CITED: https://nodejs.org/api/crypto.html] [ASSUMED] |

### Known Threat Patterns for local TypeScript CLI

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Path traversal or symlink redirection from artifact/adaptor targets | Tampering | Resolve and validate target containment at the Git root before staging or promotion; reject ambiguous links. [ASSUMED] |
| Local adapter overwrite | Tampering | Require a valid managed header and matching original-content hash; otherwise preserve and report diff. [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:29-33] |
| Malformed/duplicate artifact IDs | Tampering | Schema + relationship validation; list all duplicates and resolve none. [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:35-39] |
| Interrupted or manipulated staging directory | Denial of service / Tampering | Allow recovery only when journal paths and hashes validate exactly; otherwise fail closed. [VERIFIED: .planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:35-40] |

## Sources

### Primary (HIGH confidence)

- [Phase context](/Users/ishk.sftckz/Projects/exspecso/.planning/phases/01-initialize-canonical-projects/01-CONTEXT.md) - locked UX, artifact, adapter, validation, and recovery decisions.
- [Requirements](/Users/ishk.sftckz/Projects/exspecso/.planning/REQUIREMENTS.md) - Phase 1 behavior and acceptance coverage.
- [Node.js filesystem API](https://nodejs.org/api/fs.html) - staging, flushing, rename, and removal primitives.
- [Claude Code Skills](https://code.claude.com/docs/en/skills), [Codex Skills](https://learn.chatgpt.com/docs/build-skills), [OpenCode Commands](https://opencode.ai/docs/commands/) - native adapter discovery/invocation contracts.

### Secondary (MEDIUM confidence)

- [Inquirer prompts](https://github.com/SBoudrias/Inquirer.js/tree/main/packages/prompts) - checkbox, cancellation, and non-interactive behavior.
- [Zod](https://zod.dev/packages/zod) - schema parsing API.
- [Vitest](https://vitest.dev/guide/) - current Node minimum and command/test conventions.
- [Node.js util](https://nodejs.org/api/util.html), [Node.js crypto](https://nodejs.org/api/crypto.html) - strict repeatable options and UUID primitive.

### Tertiary (LOW confidence)

- No web-only sources used. Assumptions are explicitly listed above for planner confirmation.

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — current official documentation and npm registry/legitimacy checks; two supporting packages require human confirmation due current-release freshness.
- Architecture: MEDIUM — locked local contracts and official runtime APIs are clear; cross-platform multi-file crash durability still requires empirical proof.
- Pitfalls: MEDIUM — grounded in locked constraints and documented runtime limits; recovery mechanism is intentionally conservative and needs fault-injection validation.

**Research date:** 2026-08-26  
**Valid until:** 2026-09-02 (runtime adapter documentation and package releases are fast-moving)
