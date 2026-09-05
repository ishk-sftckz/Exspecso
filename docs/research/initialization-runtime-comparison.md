# Initialization and runtime support: GSD, BMAD, and Exspecso

Research date: **2026-08-28**. Upstream findings below come from official repositories and the npm registry, with source snapshots pinned to commits. Repository inspection and package extraction were read-only; upstream installers and workflows were **not executed**. Source inspection establishes implementation mechanisms, not successful operation on every host.

## Assessment in brief

GSD is the stronger reference for detailed host adaptation; BMAD is the simpler reference for distributing shared skills across many tools. Exspecso deliberately supports fewer hosts and preserves a smaller, more conservative project foundation. That is a useful design choice, not proof that our incomplete Phase 1 is better overall.

Our local 62-test suite and build pass, but generated Codex skills have a first-line/frontmatter incompatibility with the inspected official parser. Actual host discovery must be verified. The proposed native containment provider addresses filesystem safety, not AI-host compatibility, and remains unapproved and unimplemented. Detailed local evidence and recommendations follow the upstream sections.

## Upstream versions and scope

| Project | Published npm `latest` checked | Source examined |
|---|---|---|
| GSD Core | `@opengsd/gsd-core` **1.11.0**, published August 19; release `gitHead` `182f60b4c170785d96f1deb87fea8b108e9b985f` | Default branch `next`, commit `45f18b444daf4aea0b781f94178691b641842006`; package version still 1.11.0, but includes later changes |
| BMAD Method | `bmad-method` **6.11.0**, published August 10; release `gitHead` `9ce3c397c9b238de96f7365da8019f6f66b059da` | `main`, commit `d2b87b849bc1642502b861579e03cd56af5776f8`; also published as `next` **6.11.1-next.28** |

Versions and distribution tags were checked against the [GSD npm registry](https://registry.npmjs.org/@opengsd%2Fgsd-core) and [BMAD npm registry](https://registry.npmjs.org/bmad-method). Both published tarballs were extracted to inspect their platform lists and primary installation mechanisms. Unless a release is explicitly named, detailed source citations below refer to the newer repository snapshots, not necessarily identical `latest` package bytes.

## 1. Installation is different from starting a project

**GSD separates the two.** `npx @opengsd/gsd-core@latest` selects runtime(s), scope, and installation profile, then materializes host commands/skills, agents, helper code, and integrations. Only afterward does `/gsd-new-project` or `/gsd-onboard` establish project planning. The new-project workflow checks existing project state, handles missing installed agents, gathers intent, and creates `.planning/PROJECT.md`, `config.json`, `REQUIREMENTS.md`, `ROADMAP.md`, and `STATE.md`. It refuses to treat an already initialized project as new. [Installer introduction](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/docs/how-to/install-on-your-runtime.md#L9-L25), [startup checks](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/gsd-core/workflows/new-project.md#L40-L100), [startup artifacts](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/gsd-core/workflows/new-project.md#L1373-L1405).

**BMAD installs a project workspace and tool integrations together.** `npx bmad-method install` selects modules, AI tools, language, output directory, and other configuration. `_bmad` holds shared configuration and supporting scripts; skills live in selected tools' discovery directories. Product work begins by invoking `bmad-build` or getting guidance from `bmad-help`; installing files is not itself requirements discovery or an approved product plan. The CLI also exposes explicit update/quick-update actions and flags for unattended installation. [Installation guide](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/docs/start/install-bmad.md#L29-L116), [CLI options](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/tools/installer/commands/install.js#L9-L39), [getting started](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/README.md#L16-L24).

## 2. How their runtime support works

### GSD: translate shared workflows into host-specific integrations

GSD's shared authored format is Claude-shaped. Per-runtime capability descriptors specify configuration roots, command notation, artifact layouts, conversion functions, hooks, dispatch, model handling, and isolation. The installer generates the corresponding host surfaces. This is substantially more than copying Markdown into different folders. [Claude descriptor](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/capabilities/claude/capability.json#L12-L117), [Codex descriptor](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/capabilities/codex/capability.json#L12-L112), [OpenCode descriptor](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/capabilities/opencode/capability.json#L12-L133).

| Host | GSD source-defined installation | Runtime adaptation |
|---|---|---|
| Claude Code | Global `~/.claude/skills/gsd-*/SKILL.md`; local `.claude/commands/gsd-*.md`; agents under the corresponding `agents/` | Native Claude command/agent conventions and settings-based hooks |
| Codex | Global skills `~/.agents/skills/gsd-*/SKILL.md`; local skills `.codex/skills/`; agent TOML files under the Codex configuration root | Converts invocation to `$gsd-*`, emits Codex agents/config/hooks, maps question and collaboration tools |
| OpenCode | Commands, skills, agents, and plugin under `.opencode/` locally or the resolved global OpenCode root | Converts frontmatter and dispatch conventions; native plugin bridges host events to GSD hook scripts |

The table follows the descriptors above, the [global-home resolver](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/src/runtime-artifact-layout.cts#L779-L785), and [OpenCode integration documentation](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/docs/how-to/install-on-your-runtime.md#L120-L140). Configuration-root overrides can change defaults. **Documentation drift:** the GSD install guide still places global Codex skills under `~/.codex/skills`; source and the inspected 1.11.0 package instead use the `.agents` override. Do not copy the guide's path uncritically. [Conflicting guide text](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/docs/how-to/install-on-your-runtime.md#L160-L168).

GSD also models full/degraded/absent integration levels and handles undocumented capabilities conservatively. This is declared-capability negotiation, not proof that every installed host was tested live. Its Codex conversion explicitly detects different collaboration schemas, labels generic-agent fallback as weaker, and calls for stopping where required guarantees cannot be met. [Capability negotiation](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/src/host-integration.cts#L322-L475), [Codex translation and limitations](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/src/runtime-artifact-conversion.cts#L1722-L1801).

### BMAD: shared native skills, configured discovery paths

BMAD uses `platform-codes.yaml` plus one configuration-driven installer. For each platform it copies complete native skill directories, without rewriting skill frontmatter. Multiple selected tools sharing `.agents/skills` are deduplicated. Platform-specific command pointers are added where configured. [Platform configuration](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/tools/installer/ide/platform-codes.yaml#L1-L14), [verbatim installer](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/tools/installer/ide/_config-driven.js#L408-L467), [shared-target handling](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/tools/installer/ide/manager.js#L195-L233).

| Host | BMAD project installation |
|---|---|
| Claude Code | `.claude/skills/<canonical-skill-id>/SKILL.md` |
| Codex | `.agents/skills/<canonical-skill-id>/SKILL.md` |
| OpenCode | Same `.agents/skills/` directory, plus `.opencode/commands/<canonical-skill-id>.md` pointers |

These are the [Claude/Codex registry entries](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/tools/installer/ide/platform-codes.yaml#L59-L78) and [OpenCode entry](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/tools/installer/ide/platform-codes.yaml#L262-L268). The registry contains global-path metadata too, but that alone does not establish a supported global installation CLI: the inspected command is project-oriented.

Portability is not only static prompts. `bmad-build` calls a shared Python renderer through `uv`, then reads its generated workflow. Missing `uv` causes the skill to stop even though installation only warns. Workflow instructions use subagents where available; implementation may run inline, while review steps requiring isolated reviewers stop and ask the human to run separate sessions if subagents are absent. Thus BMAD's portability depends partly on workflow fallbacks rather than a GSD-style host adapter for every capability. [Build entrypoint](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/src/bmm-skills/ship/bmad-build/SKILL.md#L1-L13), [requirements](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/docs/start/install-bmad.md#L16-L25), [implementation fallback](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/src/bmm-skills/ship/bmad-build/step-03-implement.md#L29-L35), [review fallback](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/src/bmm-skills/ship/bmad-build/step-04-review.md#L6-L27).

## 3. Do they support “all AI agents”?

**No universal support is established.** Supported coding hosts, discoverable skills, model providers, and equivalent workflow guarantees are different things.

- **GSD published 1.11.0: 18 installer targets:** Claude, Antigravity, Augment, Cline, CodeBuddy, Codex, Copilot, Cursor, Hermes, Kimi, Kimi Code, Kilo, OpenCode, pi, Qwen, Trae, Windsurf, and ZCode. Current source retains these 18; counting runtime descriptors yields 19 because VS Code is an additional extension target without this CLI installation surface. [Published installer list](https://github.com/open-gsd/gsd-core/blob/182f60b4c170785d96f1deb87fea8b108e9b985f/bin/install.js#L12600-L12601), [descriptor exclusion rule](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/src/runtime-config-adapter-registry.cts#L96-L112).
- **BMAD published 6.11.0: 45 platform entries; current main/next: 47**, adding Grok and ZCode. Current IDs are adal, amp, antigravity, antigravity-cli, auggie, bob, claude-code, cline, codex, codewhale, codebuddy, command-code, cortex, crush, cursor, droid, firebender, gemini, github-copilot, goose, grok, hermes, iflow, junie, kilo, kimi-code, kiro, kode, mistral-vibe, mux, neovate, ona, openclaw, opencode, openhands, pi, pochi, qoder, qwen, replit, roo, rovo-dev, trae, warp, windsurf, zcode, and zencoder. Counts were computed from the [published registry](https://github.com/bmad-code-org/BMAD-METHOD/blob/9ce3c397c9b238de96f7365da8019f6f66b059da/tools/installer/ide/platform-codes.yaml) and [current registry](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/tools/installer/ide/platform-codes.yaml).

GSD itself rates Claude/Codex at support tier 1 and OpenCode at tier 2 in the cited descriptors. BMAD's larger directory registry proves broader installation targeting, not that 47 hosts provide equivalent subagent isolation, hooks, tool permissions, or verification behavior.

## 4. Reruns, updates, user edits, and failures

| Concern | GSD evidence | BMAD evidence |
|---|---|---|
| Existing installation | Reuses profile markers; runs manifest-backed migrations | Detects `_bmad`; supports update/modification/quick-update |
| User changes to framework files | Hash manifest detects modifications; stores local patches and a validated pristine baseline for later merging | Hash manifest identifies modifications under `_bmad`; restores custom files and saves modified distribution files as `.bak` |
| Generated host artifacts | Replaces owned `gsd-*` surfaces; explicitly preserves certain user-owned artifacts | Removes and recopies each generated skill directory; preserves hand-modified command pointers by heuristic |
| Failure handling | Atomic individual settings writes, migrations, and Codex-specific best-effort snapshots/rollback | Inspected main installation catch cleans temporary backups and rethrows; no overall transaction rollback shown |

GSD evidence: [profile and migration flow](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/bin/install.js#L10462-L10568), [patch detection](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/bin/install.js#L10074-L10126), [artifact replacement](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/src/install-engine.cts#L1170-L1209), [atomic settings primitive](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/src/runtime-hooks-surface.cts#L200-L243), [Codex rollback boundaries](https://github.com/open-gsd/gsd-core/blob/45f18b444daf4aea0b781f94178691b641842006/bin/install.js#L10570-L10674).

BMAD evidence: [backup and restore](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/tools/installer/core/installer.js#L560-L705), [backup scan scope](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/tools/installer/core/installer.js#L893-L1003), [skill replacement](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/tools/installer/ide/_config-driven.js#L432-L462), [pointer preservation](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/tools/installer/ide/_config-driven.js#L354-L390), [failure handler](https://github.com/bmad-code-org/BMAD-METHOD/blob/d2b87b849bc1642502b861579e03cd56af5776f8/tools/installer/core/installer.js#L139-L185).

**Implications:** Neither should be described as universally crash-atomic. GSD's per-file atomic writes and host-specific rollback are narrower guarantees than an all-or-nothing multi-file install. BMAD's `_bmad` backups do not automatically protect edits in external host skill directories. These are source-based boundaries, not fault-injection test results.

## 5. Upstream lessons for the comparison

The evidence suggests **GSD is the stronger reference for deep runtime integration**: explicit host contracts, native conversion, capability degradation, and lifecycle integration. **BMAD is the simpler reference for broad skill distribution**: shared `SKILL.md` content, declarative discovery paths, and deduplication. These are architectural judgments from the mechanisms above, not a measured overall quality ranking.

Borrow the mechanisms appropriate to the promise: validate real host discovery first; keep portable operation identity separate from invocation syntax; distinguish installed-file success from workflow readiness; document capability gaps; test update preservation and failure recovery. A larger host list or a more defensive initializer alone does not prove better delivery outcomes.

## Exspecso Phase 1: what exists, what remains a plan

Local snapshot: commit `048c45b6e31be2c0eb76981cc4f63912d07ac7da`, package `0.1.0` with `private: true`. The research did not change application code or approve containment implementation. [Package](../../package.json), [phase state](../../.planning/STATE.md).

### Initialization and adapters

The implemented CLI supports `exspecso init`. It resolves the nearest containing Git root; refuses to initialize Git itself; validates existing artifacts; acquires shared writer/recovery ownership; recovers only identifiable interrupted state; preflights the requested targets; checks their preimages; and stages/promotes the writes. Its current promotion still uses pathname-based `copyFile` after validation, so this is **not a completed adversarial-containment guarantee**. [CLI](../../src/cli/main.ts), [init orchestration](../../src/init/run-init.ts), [transaction](../../src/filesystem/transaction.ts).

A fresh successful init leaves two canonical files, plus one adapter per selected runtime:

- `.exspecso/exspecso.config.json`: schema version, UUID, editable title, unclassified mode, selected agents, and onboarding not started.
- `.exspecso/constitution.md`: framework invariants, not invented product requirements.

There is no Roadmap, Phase, Spec, trace, or report scaffolding yet. Existing constitution contents are retained. Runtime detection labels choices but never checks them; scripts use repeatable `--agent` arguments. [Plan builder](../../src/init/plan.ts), [templates](../../src/artifacts/templates.ts), [selection](../../src/init/runtime-selection.ts), [minimality test](../../tests/integration/minimal-artifacts.test.ts).

| Runtime | Generated project file | Native invocation |
|---|---|---|
| Claude Code | `.claude/skills/exspecso-start/SKILL.md` | `/exspecso-start` |
| OpenAI Codex | `.agents/skills/exspecso-start/SKILL.md` | `$exspecso-start` |
| OpenCode | `.opencode/commands/exspecso-start.md` | `/exspecso-start` |

These are the three declared targets, not support for every coding host. Selection governs files Exspecso writes; it is not isolation from other tools that also discover shared skill directories. [Adapter registry](../../src/adapters/registry.ts).

**The installed start adapter is currently a short orientation instruction, not the actual orientation workflow.** It does not implement interviews, evidence collection, Roadmap creation, or a shared workflow dispatcher. Phase 2 still owns the fuller deterministic truth/readiness engine; Phase 3 owns working orientation and planning. Do not compare this initializer with GSD/BMAD's entire delivered lifecycle as though they were equally complete. [Adapter bodies](../../src/adapters/registry.ts), [future phase boundaries](../../.planning/ROADMAP.md).

### Where our design is more conservative

Reruns union the requested runtime selection with previously configured runtimes, but touch only the requested adapter targets. An unchecked adapter is not removal authority. Managed files carry a version and SHA-256 fingerprint; modified, unowned, or malformed files produce a diff and block the write set. Explicit `--replace-agent` authority must match a selected, currently conflicting target. This is a stronger preservation contract for generated adapter edits than the inspected BMAD remove-and-copy host-skill path, and a different policy from GSD's backup/reapply approach. It does not establish overall security superiority. [Managed-file inspection](../../src/adapters/managed-file.ts), [preflight and replacement](../../src/init/plan.ts), [rerun tests](../../tests/integration/init-rerun.test.ts).

Phase 1 also implements a fixed ID vocabulary, file/section resolution, duplicate detection, and invalid declaration/parent diagnostics. Full dependency scheduling and completion enforcement are later work. Markdown artifacts and deterministic helpers themselves are not unique to Exspecso; the differentiator is the exact approved contract they enforce. [Schemas](../../src/artifacts/schema.ts), [resolution](../../src/artifacts/resolve.ts), [validation](../../src/artifacts/validate.ts), [roadmap](../../.planning/ROADMAP.md).

### Evidence and a newly identified adapter issue

Research-session checks on macOS arm64 / Node 20.19.5:

| Check | Observed result | Limit |
|---|---|---|
| `npm test -- --run` | 8 files, 62 tests pass | Includes packed initializer tests, not live host discovery/invocation |
| `npm run build` | Pass | One local environment |
| Render all three compiled adapters | Expected paths and instruction bodies present | File generation does not establish native compatibility |
| Inspect generated Codex skill against current official parser | Incompatible first-line layout | Source-level finding; live Codex session not exercised |

**Codex format finding:** `renderManagedFile()` puts an HTML ownership comment on line 1 and the YAML opener on line 2. The inspected official Codex parser requires the first line, after trimming that line, to equal `---`; its host loader passes file contents directly. The generated file would fail that parser's frontmatter check. Existing adapter tests explicitly expect the comment first and do not invoke the native parser. This is a concrete compatibility gap despite the green local suite, not evidence that the installed Codex application was tested. Claude output has the same preamble and warrants its own host check; no live Claude rejection is claimed. [Local renderer](../../src/adapters/managed-file.ts), [adapter tests](../../tests/unit/adapters.test.ts), [Codex parser at pinned revision](https://github.com/openai/codex/blob/6be2a6ca952ac9f70676ce4dd07fda27175aa9dd/codex-rs/skills/src/parser.rs#L200-L220), [Codex loader](https://github.com/openai/codex/blob/6be2a6ca952ac9f70676ce4dd07fda27175aa9dd/codex-rs/ext/skills/src/loader/host.rs#L340-L369), [Claude format documentation](https://code.claude.com/docs/en/skills#frontmatter-reference).

Phase 1 remains incomplete. Plans 01-07/08 repair malformed canonical JSON handling and ownership races with tests, but independent phase re-verification remains pending. The remaining containment work, real TTY checks, native host evidence, and closure/security gates are not replaced by this research. The original verifier predates those repairs; use its findings together with the later summaries and current state. [Verification](../../.planning/phases/01-initialize-canonical-projects/01-VERIFICATION.md), [07 summary](../../.planning/phases/01-initialize-canonical-projects/01-07-SUMMARY.md), [08 summary](../../.planning/phases/01-initialize-canonical-projects/01-08-SUMMARY.md), [current state](../../.planning/STATE.md).

The proposed direct C/Node-API provider and same-package prebuilts address filesystem containment across OS/CPU/filesystem combinations. They are **not required simply to support Claude, Codex, or OpenCode**, and are not implemented or approved. The existing `node >=20` declaration is also broader than the installed prompt dependency's engine range; the replan already records this discrepancy. [Containment replan](../../.planning/phases/01-initialize-canonical-projects/01-CONTAINMENT-REPLAN.md), [proposed support contract](../../.planning/phases/01-initialize-canonical-projects/01-CONTAINMENT-SUPPORT.md).

## Which approach is better for Exspecso?

These judgments concern inspected architecture and evidence, not measured productivity, security benchmarks, or a full live compatibility audit.

| Need | Strongest fit in this comparison | Reason |
|---|---|---|
| Broad, simple distribution of native skills | BMAD | A data-driven platform map and shared skill copying reduce per-host installer work |
| Rich host-specific orchestration | GSD | Runtime descriptors, conversions, native agent configuration, and explicit capability handling |
| Minimal initial project artifacts | Exspecso's current design | Two canonical files; product discovery remains a separate operation |
| Preserve locally modified generated adapters | Exspecso's preservation policy | Fingerprints, conflict preflight, explicit selected-target replacement |
| Use a complete development workflow today | GSD or BMAD | Exspecso's Phase 1 adapter is still a scaffold for future workflows |
| Proven universal safety or every-host parity | None established | This research does not provide those guarantees |

**Recommendation: keep Exspecso's artifact contract, use BMAD's distribution simplicity, and adopt GSD's explicit capability modeling only where a real operation needs it.**

1. **Prove the three promised adapters before adding more.** Correct the frontmatter layout through a scoped fix that preserves fingerprint/conflict behavior, add native-format checks, then record actual discovery and invocation in supported host versions. Verify cancellation, argument passing, permission handling, and shared artifact behavior as those operations are built.
2. **Separate shared workflow content from host adaptation.** Keep one portable `exspecso-<operation>` identity and the approved public `/exspecso-<operation>` notation. Host-specific paths, invocation sigils, tools, dispatch, and permission behavior may differ; approved intent, artifacts, and evidence requirements must not. A compact adapter descriptor is preferable to copying GSD's entire conversion system before we need it.
3. **Keep installation separate from product orientation.** Our Phase 1 boundary is sensible. Do not market a generated start file as a complete onboarding implementation; make the next workflow real in its planned phase.
4. **Treat filesystem safety as a separate product decision.** The 01-09–18 native plan is substantially more demanding than copying skills. It may be justified by the approved threat model, but broader runtime support does not justify it by itself. Resolve the exact containment boundary and evidence cost explicitly. Do not remove existing tests or weaken approved guarantees to imitate a simpler installer.
5. **Keep support claims evidence-based.** Publish separate host-version and OS/Node/filesystem support tables when evidence exists. A registry entry, successful build, and failed-closed unsupported path are not equivalent to a working integration.

My assessment: **GSD and BMAD are ahead in usable integration breadth; Exspecso has a coherent, narrower integrity design, but our current implementation has not earned a claim of being better overall.** The most valuable near-term improvement is demonstrated host compatibility and a resolved containment contract, not a larger supported-agent count.
