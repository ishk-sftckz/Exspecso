---
phase: 01-initialize-canonical-projects
plan: 01
subsystem: infra
tags: [npm, supply-chain, approvals]
requires: []
provides:
  - Explicit human approval to install vitest@4.1.11 and @inquirer/prompts@8.6.0
affects: [01-02, testing, runtime-selection]
actuals:
  tokens: 1100
  tasks: 2
  commits: 1
tech-stack:
  added: []
  patterns: [Exact-version human approval before dependency installation]
key-files:
  created: [.planning/phases/01-initialize-canonical-projects/01-01-SUMMARY.md]
  modified: []
key-decisions:
  - "User approved vitest@4.1.11 and @inquirer/prompts@8.6.0 together on 2026-08-27."
patterns-established:
  - "Approval records distinguish inspected provenance from cryptographic signature verification."
requirements-completed: [SETUP-03, ART-08]
duration: 1min
completed: 2026-08-27
status: complete
---

# Phase 1 Plan 01: Dependency Approval Summary

**Exact-version human approval unlocks Vitest test infrastructure and Inquirer runtime selection without installing packages during the checkpoint.**

## Accomplishments

- Inspected exact-version npm metadata, maintainers, publication history, integrity hashes, scripts, and decoded provenance statements.
- Opened the official Vitest and Inquirer repositories and attempted the exact npm package pages; npm pages could not be rendered by the web tool, so registry metadata was inspected through `npm view`.
- Presented both exact versions and the signature-verification limitation to the user. The user replied **"approve"** to: **"Do you approve `vitest@4.1.11` and `@inquirer/prompts@8.6.0` so Phase 1 can continue?"** This explicitly authorizes both versions; it does not authorize other versions or waive later verification.

## Legitimacy Evidence

Inspected on 2026-08-27 using `npm view <name>@<version> name version repository maintainers dist.integrity dist.attestations scripts --json`, `npm view <name> time --json`, and the registry attestation endpoints.

| Field | vitest@4.1.11 | @inquirer/prompts@8.6.0 |
|---|---|---|
| Disposition | Human approved | Human approved |
| Repository | https://github.com/vitest-dev/vitest (`packages/vitest`) | https://github.com/SBoudrias/Inquirer.js |
| Package created | 2021-12-03 | 2023-04-24 |
| Exact version published | 2026-08-18T14:27:07.240Z | 2026-08-19T17:30:36.430Z |
| Maintainer handles | ariperkkio, antfu, hiogawa, oreanno, yyx990803 | sboudrias, mischah |
| Declared scripts | dev, build | tsc |
| Install lifecycle scripts | None declared | None declared |
| Provenance | SLSA v1, official repository, `.github/workflows/publish.yml`, `refs/heads/v4` | SLSA v1, official repository, `.github/workflows/publish.yml`, `refs/heads/main` |
| Provenance source commit | 9bd8d464e6328c567c2dbcd8fdd977d57a9425c2 | 999706755afbdcae271f62decbd9bcd05560905b |
| Declared Node support | ^20.0.0 or ^22.0.0 or >=24.0.0 | >=23.5.0 or ^22.13.0 or ^20.17.0 |

Integrity values:

- vitest: `sha512-fhACrNXUidIbGSBr5FlbuBkO7VWC1ZyLl0DO4CU2DrQoAPxX84Ysxs+HeGQpii5lZWV1Q4gBZTTu49mF+A6Edw==`
- @inquirer/prompts: `sha512-WgBVDRy3IQ4v9XMCpQ1YDGpso2PcMUxYJzZdH4Nt4t0eoXhEPmOCh5iZbXbR4GTbdUB9VPWBbJB12rkjbaGDCw==`

Attestation sources: https://registry.npmjs.org/-/npm/v1/attestations/vitest@4.1.11 and https://registry.npmjs.org/-/npm/v1/attestations/@inquirer%2fprompts@8.6.0.

**Evidence boundary:** Provenance statements were inspected, but signatures were not independently cryptographically verified. This is a human legitimacy disposition, not a complete security audit of either dependency or its transitive graph. Research flagged publication freshness, not detected malicious behavior.

## Task Commits

Both tasks were read-only human checkpoints; no production commits were required. This summary commit records both approvals atomically.

## Decisions Made

The user's single response approves both explicitly named exact versions. No package was installed and no `package.json` was created during Plan 01. SETUP-03 and ART-08 remain phase-level implementation obligations despite this plan's completed approval contribution.

## Deviations from Plan

None. Both metadata checks were prepared together and the user explicitly approved both versions in one response.

## Issues Encountered

The npm website could not be rendered by the web tool; registry CLI metadata and official GitHub repositories were available. Package Node engine constraints must be respected by Plan 02.

## User Setup Required

None.

## Next Phase Readiness

Plan 02 may install exactly vitest@4.1.11 and @inquirer/prompts@8.6.0. Runtime selection and aggregate validation are not yet implemented.

## Self-Check: PASSED

- Exact versions and both human dispositions are recorded.
- No installation or source mutation occurred before approval.
- Provenance inspection limitations are explicit.
