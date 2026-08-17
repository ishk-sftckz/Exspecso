# Domain Docs

How engineering skills consume this repository's domain documentation.

## Before exploring, read these

- `CONTEXT.md` at the repository root.
- `CONTEXT-MAP.md` if one exists.
- Relevant decisions under `docs/adr/`.

If these files do not exist, proceed silently. Domain-modeling skills create them when terminology or architectural decisions are resolved.

## File structure

This repository uses a single-context layout:

```text
/
├── CONTEXT.md
├── docs/
│   └── adr/
└── src/
```

## Use the glossary's vocabulary

When output names a domain concept—in issue titles, proposals, hypotheses, or tests—use the terminology defined in `CONTEXT.md`. Avoid synonyms that the glossary explicitly rejects.

If a necessary concept is absent, reconsider whether it belongs to the domain or note the gap for domain modeling.

## Flag ADR conflicts

If proposed work contradicts an existing ADR, surface the conflict explicitly rather than silently overriding the decision.
