# Runtime command naming: colon or dash?

**Researched:** 2026-08-21  
**Scope:** Claude Code, OpenAI Codex, and OpenCode

## Product decision after research

Use `/exspecso-<operation>` as Exspecso's single canonical public command notation and `exspecso-<operation>` as the portable underlying skill identity. Examples include `/exspecso-start`, `/exspecso-plan`, and `/exspecso-new-phase`.

The operation key remains runtime-neutral (`start`, `plan`, `verify`, `implement`, `review`, `status`, `update`, `new-phase`). Every adapter preserves the same kebab-case skill ID. A runtime may require a different host-owned invocation sigil, but it may not rename the skill, change its arguments, or change its behavior.

Recommended public spellings:

| Runtime | Recommended `start` invocation | Why |
|---|---|---|
| Claude Code standalone/project adapter | `/exspecso-start` | A standalone skill is invoked as `/skill-name`; no plugin namespace is added. This is the selected Exspecso adapter shape. |
| Claude Code plugin alternative | `/exspecso:start` | Claude Code automatically exposes plugin skills as `/plugin-name:skill-name`; Exspecso does not use this shape when identical command identity is required. |
| OpenAI Codex repo skill | `$exspecso-start` | Codex explicitly invokes skills with `$`, not arbitrary first-class slash commands. |
| OpenCode user command | `/exspecso-start` | OpenCode creates slash commands from Markdown command names; kebab-case is documented and portable. |
| Runtime-independent CLI fallback | `npx exspecso start` | Keeps automation and recovery independent of chat-composer syntax. |

Public documentation always shows `/exspecso-start`. Codex installation guidance must additionally show that explicit skill invocation uses `$exspecso-start`; this is a runtime sigil difference, not a different Exspecso command or skill identity.

## Runtime findings

### Claude Code

`/exspecso:start` is fully supported when Exspecso is packaged as a Claude Code plugin named `exspecso` with a skill named `start`. Claude's official plugin guide states that plugin skills are always namespaced and gives the exact `/plugin-name:skill-name` form. The same guide distinguishes standalone skills (`/hello`) from plugin skills (`/plugin-name:hello`). The plugin manifest `name` is a kebab-case identifier and becomes the namespace. See [Create plugins](https://code.claude.com/docs/en/plugins) and the [plugins reference](https://code.claude.com/docs/en/plugins-reference).

The colon is therefore a host-generated separator, not part of either underlying ID:

```text
plugin name: exspecso
skill name:  start
surface:     /exspecso:start
```

For a standalone project skill, use `.claude/skills/exspecso-start/SKILL.md`, which surfaces as `/exspecso-start`. Claude Code's skills documentation confirms standalone `/skill-name` invocation and plugin namespace isolation. See [Extend Claude with skills](https://code.claude.com/docs/en/slash-commands).

### OpenAI Codex

Codex's reusable extension mechanism is Agent Skills. Official OpenAI documentation says that, in the CLI and IDE extension, users invoke a skill through `/skills` or by typing `$` to mention it; the example is `$skill-creator`. See [Build skills](https://learn.chatgpt.com/docs/build-skills). Codex's slash-command reference lists runtime controls such as `/plan`, `/review`, and `/skills`, but it does not define arbitrary repo skill names as `/...` commands. See [Developer commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli).

The older custom-prompt mechanism does create slash entries, but only under the reserved `/prompts:<name>` form, and OpenAI marks it deprecated in favor of skills. It would produce `/prompts:exspecso-start`, not `/exspecso:start`. See [Custom Prompts](https://learn.chatgpt.com/docs/custom-prompts).

Codex plugins do namespace their bundled skill entries. The first-party Codex source states that plugin skills are prefixed with `plugin_name:` in the Skills list, while OpenAI's packaging guide says the plugin name is the component namespace. Combining that with Codex's documented `$skill` invocation implies `$exspecso:start` for a plugin-qualified skill. This is an inference from [Codex's plugin instruction source](https://github.com/openai/codex/blob/main/codex-rs/core/src/context/available_plugins_instructions.rs), [plugin packaging](https://developers.openai.com/plugins/build/plugins), and [skill invocation](https://learn.chatgpt.com/docs/build-skills), rather than an explicitly documented composer example.

For Exspecso's local repo adapter, the least ambiguous supported form is:

```text
.agents/skills/exspecso-start/SKILL.md
$exspecso-start
```

### OpenCode

OpenCode's custom commands are native slash commands. A Markdown filename becomes the command name, so `.opencode/commands/exspecso-start.md` produces `/exspecso-start`; the official examples include hyphenated names such as `create-file.md` and `/create-file`. See [OpenCode commands](https://opencode.ai/docs/commands/).

OpenCode V2 also discovers Agent Skills from `.opencode/skills`, `.claude/skills`, and `.agents/skills`. Its skill ID comes from the path. Although V2 currently does not enforce the standard name regex, its own portability guidance recommends a unique lowercase kebab-case ID of 1-64 characters matching `^[a-z0-9]+(-[a-z0-9]+)*$`. See [OpenCode V2 skills](https://opencode.ai/v2/docs/skills).

A colon-bearing path-derived ID may happen to work on some POSIX setups because current V2 validation is permissive, but it is not a safe product contract:

- OpenCode's documented portable format excludes colons.
- The cross-agent skill standard excludes colons from skill names.
- Windows forbids `:` in file and directory names, so an npm package cannot reliably scaffold `exspecso:start.md` or an `exspecso:start/` skill directory across platforms. See Microsoft's [file naming rules](https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file).

## Shared identifier constraints

The Agent Skills specification requires skill names to be 1-64 characters, use only lowercase letters, digits, and single hyphens, not start or end with a hyphen, and match the parent directory. `exspecso-start` is valid; `exspecso:start` is not a valid raw skill name. See the [Agent Skills specification](https://agentskills.io/specification).

That still allows Claude Code and Codex plugin hosts to display a colon-qualified name because the host combines two separately valid identifiers:

```text
exspecso + : + start
```

The canonical artifact model should store only the operation key (`start`) and perhaps a separate adapter/plugin ID (`exspecso`). It should not store `/`, `$`, `:`, or `-` as lifecycle semantics.

## Recommended adapter contract

1. Define canonical operations without presentation syntax: `start`, `plan`, `verify`, `implement`, `review`, `status`, `update`, `new-phase`.
2. Use `exspecso-<operation>` as the portable standalone skill/command ID.
3. Let the Claude standalone/project adapter expose `/exspecso-<operation>` rather than using plugin namespace syntax.
4. Let the Codex repo adapter preserve the same skill ID and expose it through Codex's required `$exspecso-<operation>` explicit-invocation syntax.
5. Let the OpenCode adapter expose `/exspecso-<operation>` through command or skill wrappers backed by the same canonical operation behavior.
6. Always document `npx exspecso <operation>` as the deterministic non-chat fallback.
7. Add adapter conformance tests that assert the generated filename, discovered identifier, visible invocation, argument forwarding, and operation selected for every supported runtime version.

## Bottom line

Use `/exspecso-<operation>` throughout Exspecso's product language and use the matching `exspecso-<operation>` Agent Skill ID in every adapter. Claude Code and OpenCode can expose the slash form directly. Codex retains the same ID but officially requires `$` for explicit skill invocation, so its concrete trigger is `$exspecso-<operation>` until Codex supports custom slash aliases for skills.
