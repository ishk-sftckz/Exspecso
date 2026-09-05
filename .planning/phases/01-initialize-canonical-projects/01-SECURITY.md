---
phase: 01
slug: initialize-canonical-projects
status: verified
threats_open: 0
asvs_level: 1
created: 2026-09-05
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| CLI input and environment → initializer | Working directory, runtime choices, and environment values are caller-controlled and must not gain implicit authority. | Paths, runtime IDs, process metadata |
| Repository contents → parser and resolver | Markdown, JSON, existing adapter bytes, filesystem names, links, and transaction evidence are untrusted. | Canonical artifacts, IDs, file metadata, hashes |
| Validated plan → repository mutation | Only a complete, conflict-free, root-contained plan may authorize durable changes. | Staged files, journals, backups, ownership records |
| Dependency and build inputs → published package | Package metadata, lockfiles, CI configuration, and archive inventory determine executable shipped code. | Dependencies, compiled JavaScript, npm tarball |
| Host permissions → operating system | Host sandbox and filesystem permissions remain the OS security boundary. | Repository filesystem access |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-SC | Tampering | `vitest` and `@inquirer/prompts` installs | high | mitigate | Blocking human checkpoints validate exact versions, provenance, repositories, maintainers, publication history, integrity, and lifecycle scripts before Plan 02 may install. | closed |
| T-01-01 | Spoofing | npm package identity | high | mitigate | Compare registry metadata to the official Vitest and Inquirer repositories; reject any mismatch. | closed |
| T-01-03 | Repudiation | package approval | low | accept | The execution summary records the human resume signal and inspected metadata; local Git history is sufficient for this phase. | closed |
| T-02-01 | Tampering | Git-root and output paths | high | mitigate | Resolve the containing root once, canonicalize every target, reject any target outside it, and prove nested/no-repository behavior before writes. | closed |
| T-02-02 | Tampering | Existing adapter path | high | mitigate | The tracer writes only an absent Codex target; D-11 header proves ownership and later rerun handling never overwrites an unowned file. | closed |
| T-02-03 | Denial of service | Staging/promotion interruption | high | mitigate | Precompute and validate the complete mutation set, stage on the same repository filesystem, and expose the transaction seam to Plan 06 fault injection. | closed |
| T-02-04 | Information disclosure | CLI diagnostics | low | accept | Diagnostics expose only repository-relative paths and expected/actual contract values; no secrets exist in this phase. | closed |
| T-02-SC | Tampering | npm installs | high | mitigate | Task precondition requires the two blocking package approvals from Plan 01; TypeScript and Zod already have OK audit verdicts. | closed |
| T-03-01 | Elevation of privilege | runtime detection | high | mitigate | Make detection a label-only value; selection tests assert every option starts unchecked and persisted agents equal submitted agents. | closed |
| T-03-02 | Tampering | adapter destination | high | mitigate | Use a closed constant registry of repository-relative destinations and the existing Git-root containment boundary. | closed |
| T-03-03 | Tampering | selected adapter set | medium | mitigate | Pure plan construction consumes an immutable selected set and power-set tests assert no extra target. | closed |
| T-03-04 | Spoofing | native invocation | medium | mitigate | Fixture-test each official native path/sigil against `docs/research/runtime-command-naming.md`; preserve one literal operation ID. | closed |
| T-03-05 | Repudiation | interactive cancellation | low | accept | Cancellation produces a typed result and zero-write test evidence; no durable audit log is warranted for a local pre-init action. | closed |
| T-04-01 | Tampering | duplicate stable IDs | high | mitigate | Scan all definitions, list every conflict, return ambiguous with no target, and block mutation per D-17. | closed |
| T-04-02 | Tampering | malformed direct edits | high | mitigate | Zod plus relationship validation aggregates diagnostics before `runInit` can plan writes; D-16 forbids implicit repair. | closed |
| T-04-03 | Spoofing | title/slug as identity | medium | mitigate | Resolution keys only on approved immutable IDs and explicit parents; rename/order fixtures prove display fields have no identity authority. | closed |
| T-04-06 | Spoofing | alternate stable-ID aliases | medium | mitigate | Encode a closed D-20 registry for the exact nine public literals and reject every unrecognized prefix before relationship resolution. | closed |
| T-04-04 | Denial of service | pathological Markdown sections | medium | mitigate | Deterministic single-pass definition scanning with exact section boundaries; invalid shapes produce bounded diagnostics. | closed |
| T-04-05 | Information disclosure | diagnostic actual values | low | accept | Phase 1 canonical files contain setup metadata only, not secrets; renderer remains repository-relative. | closed |
| T-05-01 | Tampering | locally modified/unowned adapter | high | mitigate | Require valid managed header plus matching body hash; preserve and diff every mismatch, with explicit replacement and preimage recheck. | closed |
| T-05-02 | Elevation of privilege | unchecked/detected adapter | high | mitigate | D-10 tests prove omission/detection never grants delete, refresh, or replacement authority. | closed |
| T-05-03 | Tampering | partial selected change set | high | mitigate | D-12 immutable complete-plan preflight aggregates every conflict and blocks all staging when one remains. | closed |
| T-05-04 | Spoofing | forged managed header | medium | mitigate | Header parser requires exact version/hash syntax and compares SHA-256 against actual body; a forged matching header grants ownership only of that explicit file, not arbitrary paths. | closed |
| T-05-05 | Repudiation | explicit replacement | low | accept | Command arguments, emitted diff, and verified Task commit provide sufficient local evidence; no hidden approval log is introduced. | closed |
| T-06-01 | Tampering | root containment/symlink paths | high | mitigate | Canonicalize the Git root, validate every path segment with `lstat`/`realpath`, reject traversal/external/symlink targets before staging, and recheck before promotion. | closed |
| T-06-02 | Tampering | journal/staged/backup data | high | mitigate | D-18 recovery requires exact transaction schema, allowed paths, preimage/staged/backup/current hashes, completed step, and valid resulting canonical set; D-19 exercises that gate after all three declared process-level fault modes at every promotion step; ambiguity preserves evidence and blocks. | closed |
| T-06-03 | Denial of service | concurrent init processes | high | mitigate | Exclusive repository-local lock permits one writer; other writers/readers receive stable busy results and cannot accept/interleave mixed state. | closed |
| T-06-04 | Tampering | duplicate IDs after recovery | high | mitigate | Validate the entire restored/promoted canonical set with duplicate-ID rejection before cleanup or new writes. | closed |
| T-06-05 | Repudiation | recovery result | low | accept | CLI reports transaction ID and disposition and the verified Task commit captures tests; a separate canonical recovery log would violate minimal state. | closed |
| T-06-06 | Information disclosure | journal contents | low | accept | Journal contains repository-relative paths and hashes only, no secrets; it is deleted after validated success/recovery. | closed |
| T-07-01 | Tampering | jsonDefinition / scanArtifacts | high | mitigate | Preserve present invalid id/parent fields as raw-value diagnostics before constructing branded definitions; regression through runInit. | closed |
| T-07-02 | Spoofing | valid-definition index | high | mitigate | Keep D-20 closed and D-17 duplicate resolution ambiguous; do not coerce aliases or guess parent identity. | closed |
| T-07-03 | Denial of service | aggregate parser | medium | mitigate | Catch syntax failures, aggregate once in deterministic order, and reuse the existing bounded per-file scanner rather than aborting at the first error. | closed |
| T-08-01 | Tampering | recovery / writer handoff | high | mitigate | Both acquire the same atomically published non-empty owner directory and retain the lease across the entire mutating pipeline. | closed |
| T-08-02 | Denial of service | stale reclaim / delayed release | high | mitigate | Remove only the observed UUID child and use non-recursive rmdir; test a new owner appearing between stale observation and removal. | closed |
| T-08-03 | Spoofing | malformed or legacy owner | high | mitigate | Unknown entries, unreadable metadata, or unsafe legacy ownership yield busy/ambiguous with evidence retained; no bare PID-based shared unlink. | closed |
| T-08-04 | Tampering | path namespace underneath ownership | high | transfer | 01-09 must bind ownership, staging, cleanup, and promotion mutations to validated directory handles before phase acceptance; this plan does not claim CR-03 closed. | closed |
| T-09-01 | Tampering | Human authority scope | high | mitigate | Blocking explicit decision and accurate approval ledger | closed |
| T-09-02 | Tampering | Supply chain and support claims | high | mitigate | Exact provider/toolchain and native runner inputs before implementation | closed |
| T-10-01 | Tampering | Native names and handles | high | mitigate | No-follow single-component operations and opaque lifetime tests | closed |
| T-10-02 | Tampering | Windows parity | high | mitigate | Native runner evidence and explicit API feasibility stop | closed |
| T-10-03 | Tampering | Evidence substitution | high | mitigate | Distinct instrumented/release packages and actual installed provider trace | closed |
| T-11-01 | Spoofing | matrix evidence | high | mitigate | Native host observations, commit/hash binding, and rejecting aggregate fixtures | closed |
| T-11-02 | Tampering | CI configuration | high | mitigate | Exact approved rows, pinned actions/images where supported, protected artifact provenance | closed |
| T-11-SC | Tampering | compiler and dependency inputs | high | mitigate | Approved pinned toolchains and existing audited lock; new package requires legitimacy gate | closed |
| T-12-01 | Information disclosure | artifact reader | high | mitigate | No-follow capability enumeration/read; external sentinel reads are not used as authority | closed |
| T-12-02 | Tampering | preflight | high | mitigate | Shared root, explicit unsafe-read errors, retained aggregate diagnostics and preimage checks | closed |
| T-12-03 | Denial of service | handle lifecycle | medium | mitigate | Owned/caller-owned close semantics and failure-path tests | closed |
| T-13-01 | Tampering | ownership publication/reclaim | high | mitigate | Bound atomic publication, UUID-specific unlink, nonrecursive empty removal and preserved race tests | closed |
| T-13-02 | Tampering | stage/backup namespace | high | mitigate | Exclusive single-component creates, bound read/write/hash, outside sentinels | closed |
| T-13-03 | Denial of service | interrupted ownership | medium | mitigate | Preserve unknown/partial evidence; safe dead candidate rules and explicit diagnostic | closed |
| T-14-01 | Tampering | promotion/hard links | high | mitigate | Bound new-sibling replacement and external alias sentinel | closed |
| T-14-02 | Tampering | recovery authority | high | mitigate | Strict journal/hash validation; no downgraded containment error | closed |
| T-14-03 | Denial of service | mid-recovery interruption | high | mitigate | Write-ahead restore states, idempotent per-entry checks and forced process tests | closed |
| T-15-01 | Tampering | Cleanup authority | high | mitigate | Identified nonrecursive bound removal and restart faults | closed |
| T-15-02 | Tampering | Memory/resource lifetime | high | mitigate | Opaque-handle misuse cases and pinned sanitizer diagnostics | closed |
| T-16-01 | Tampering | Binary supply chain | high | mitigate | Fixed manifest selection, provenance-bound assembly and private package | closed |
| T-16-02 | Tampering | Workspace leakage | high | mitigate | Isolated offline cached install, sanitized environment and loaded-provider trace | closed |
| T-17-01 | Tampering | Root-scoped reads and writes | high | mitigate | Canonical Git root, validated components, stable symlink rejection, supported-kind checks, and expected-preimage revalidation before promotion. | closed |
| T-17-02 | Tampering | Transaction ownership and recovery | high | mitigate | Token-bound ownership, journal/hash validation, repository-local staging, atomic rename, and ambiguity-preserving recovery. | closed |
| T-17-03 | Tampering | Same-user path race between checks and operations | medium | accept | D-21 assigns hostile peer isolation to host permissions/sandbox; docs and tests explicitly avoid race-proof or kernel-containment claims. | closed |
| T-17-04 | Repudiation | Plans 01-19/01-20 native completion evidence | medium | mitigate | Preserve their plans/summaries immutably, name 01-17 as exclusive supersession owner, and require fresh TypeScript-path test/build/package evidence. | closed |
| T-18-01 | Tampering | npm package inventory | high | mitigate | Dry-run JSON inventory, actual standard tarball, scripts-disabled isolated install, and execution of the installed declared bin. | closed |
| T-18-02 | Tampering | GitHub Actions | high | mitigate | contents:read only, official checkout/setup-node v6, committed lockfile, no secrets, artifacts, publication, or write permissions. | closed |
| T-18-03 | Repudiation | Compatibility and safety claims | medium | mitigate | README binds claims to the four measured rows and D-21 limitations; independent verification owns the final verdict. | closed |
| T-18-SC | Tampering | npm dependency install | high | mitigate | Plan 01-01 already verified the locked packages; npm ci consumes the committed lockfile and this plan adds no dependency. | closed |
| T-19-01 | Spoofing | runtime support-row selection | high | mitigate | Exact read-only environment observation, unique row resolution, row-bound manifest identity, and rejection before native open | closed |
| T-19-02 | Tampering | provider manifest/path | high | mitigate | Row-qualified in-package paths, package/build/length/hash checks, and realpath containment | closed |
| T-19-03 | Elevation of privilege | undeclared Node/OS tuple | high | mitigate | Matrix-derived engine/Node matcher and table-driven undeclared-tuple rejection before mutation | closed |
| T-19-04 | Information disclosure | build provenance | low | accept | Provenance contains public tool paths/versions and hashes but no credentials or user file content | closed |
| T-20-01 | Tampering | local provider/evidence | high | mitigate | Exact source, manifest, provider and toolchain hashes plus full-suite JSON and row-bound aggregation | closed |
| T-20-02 | Repudiation | support claims | high | mitigate | Retained environment/command evidence and measured documentation tied to ENV-MA25 | closed |
| T-20-03 | Denial of service | missing prior row/lane | medium | mitigate | Matrix-derived required-set aggregation with explicit missing/failed/skipped diagnostics | closed |
| T-20-04 | Elevation of privilege | development-only bypass | high | mitigate | No bypass flag; the actual release provider and unfiltered local suite are mandatory before 01-13 | closed |
| T-21-01 | Tampering | transaction.ts / journal.ts / recovery.ts | high | mitigate | Publish a schema-validated preparing record before stage-content or destination mutation; clean only exact known preparation inventory and preserve all unknown evidence. | closed |
| T-21-02 | Denial of Service | contained-fs.ts FileCapability.read() | high | mitigate | Reject zero-progress reads before the observed length and revalidate descriptor device, inode, kind, and size before returning. | closed |
| T-22-01 | Tampering / Denial of Service | transaction.ts, ownership.ts, installed-cli.test.ts | high | mitigate | Remove all legacy environment reads, unbound signal writes/rename, environment-selected faults, and wait loops from shipped modules; prove a standard installed tarball ignores all six values and exits under a bounded test timeout. | closed |
| T-22-02 | Tampering | transaction.ts, journal.ts, recovery.ts | high | mitigate | Serialize backupPath as slash-form journal data, retain strict parser rejection of backslashes, and exercise real additive commit plus interrupted recovery under a deterministic Windows-join substitution. | closed |
| T-22-03 | Denial of Service | contained-fs.ts FileCapability.write(), transaction ownership cleanup | high | mitigate | Reject a non-positive writeSync result before reusing the offset and prove the failed transaction releases its internally acquired lease. | closed |
| T-22-04 | Tampering | killed-transaction-child.mjs and package inventory | medium | mitigate | Keep signal/wait behavior solely in a build-excluded test harness, accept no signal path, validate the requested promotion point, use IPC, bound the parent wait, and assert the harness is absent from npm inventory. | closed |
| T-23-01 | Tampering / Information Disclosure | component(), DirectoryCapability child operations | high | mitigate | Reject alternate-stream colon syntax and every Windows-prohibited punctuation/control code before path join or node:fs, and prove the repository inventory and sentinel bytes remain unchanged. | closed |
| T-23-02 | Spoofing / Tampering | component(), Windows DOS-device and normalization rules | high | mitigate | Reject case-insensitive DOS devices, extension forms, Unicode superscript COM/LPT aliases, and trailing dot/space aliases through the shared pre-operation gate. | closed |
| T-23-03 | Denial of Service | component(), host component-length limits | medium | mitigate | Enforce a deterministic 255-byte UTF-8 ceiling cross-platform and exercise both the accepted boundary and first rejected size in the active suite. | closed |
| T-23-04 | Repudiation | vitest.config.ts, ci.yml, root-scoped-fs.test.ts | medium | mitigate | Move the affected-name evidence into the active pure-Node suite and retain the existing default Windows CI invocation so a Windows regression cannot be hidden behind the excluded historical test. | closed |
| T-24-01 | Spoofing / Elevation of Privilege | runtime-selection prompt | medium | mitigate | Remove environment-derived labels and prove every option is equal and unchecked. | closed |
| T-24-02 | Tampering | CLI selection → init plan | high | mitigate | Preserve submitted AgentId values as the only adapter authority and retain subset/tree assertions. | closed |
| T-24-03 | Repudiation | planning contract vs implementation evidence | medium | mitigate | Update active intent before code and retain the later UAT decision, focused tests, execution summary, and renewed human checkpoint. | closed |
| T-25-01 | Spoofing | ARTIFACT_ID_PATTERNS / parseArtifactId | high | mitigate | Use exact anchored three-digit FIND and PAC regexes, remove the superseded family, and assert all other spellings fail. | closed |
| T-25-02 | Tampering | scanArtifacts / resolveArtifact | high | mitigate | Preserve explicit IDs/parents, exact section boundaries, complete duplicate enumeration, and no selected target under ambiguity. | closed |
| T-25-03 | Elevation of Privilege / Repudiation | PAC recognition versus acceptance state | medium | mitigate | Keep the change recognition-only and assert init creates no acceptance.md, PAC state, or result. | closed |
| T-25-04 | Denial of Service | concurrent resolver calls | medium | mitigate | Reuse the bounded read-only scanner and assert concurrent calls return byte-equivalent locations without mutation. | closed |
| T-25-05 | Information Disclosure | invalid-ID diagnostics | low | accept | Diagnostics expose only repository-relative paths and submitted ID text already present in user-authored canonical files. | closed |
| T-26-01 | Spoofing / Repudiation | runInit transaction-result branch | high | mitigate | Keep the stdout write exclusively inside the committed/no-op branch and retain all non-success exits and diagnostics. | closed |
| T-26-02 | Information Disclosure | formatCompletion | medium | mitigate | Remove selected-agent and adapter-registry inputs and assert exact equality for all runtime subsets. | closed |
| T-26-03 | Tampering | adapter registry and generated files | high | mitigate | Leave registry/templates untouched and retain selected-target, operation identity, native metadata, and managed-fingerprint regressions. | closed |
| T-26-04 | Repudiation | D-08 / SETUP-08 / README / executable behavior | medium | mitigate | Update active intent first, use the same exact wording in tests/docs, and record committed/no-op installed-bin evidence in the summary. | closed |

All 96 plan-authored threats are closed at ASVS Level 1. Closure evidence is the matching executed plan summary, focused verification recorded by that summary, the final 95-test active suite, successful TypeScript build and 43-file package inventory, and the completed real-TTY UAT.

Plans 09–16 and 19–20 describe a superseded native delivery path. Their native-only threats are closed for the V1 shipped surface by Plan 17, which removed native code from active build, test, workflow, and package entry points. This does not certify retained historical native sources for reactivation; the warning in `01-REVIEW.md` must be resolved before any native path is restored.

*Status: open · closed · open — below high threshold (non-blocking)*  
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on: high` count toward `threats_open`.*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-01-03 | Local Git history and execution summaries provide sufficient package-approval evidence. | Phase plan | 2026-09-05 |
| AR-02 | T-02-04 | Diagnostics contain repository-relative contract values and no phase secrets. | Phase plan | 2026-09-05 |
| AR-03 | T-03-05 | Cancellation writes nothing; a durable audit artifact would violate minimal local state. | Phase plan | 2026-09-05 |
| AR-04 | T-04-05 | Canonical setup artifacts contain no secret material. | Phase plan | 2026-09-05 |
| AR-05 | T-05-05 | Explicit arguments, displayed diff, and verified Git commits are adequate local evidence. | Phase plan | 2026-09-05 |
| AR-06 | T-06-05 | CLI disposition and Git evidence replace a separate canonical recovery log. | Phase plan | 2026-09-05 |
| AR-07 | T-06-06 | Journals contain repository-relative paths and hashes only and are removed after validated completion. | Phase plan | 2026-09-05 |
| AR-08 | T-17-03 | Host permissions and sandboxing own hostile same-user race isolation; Exspecso does not claim kernel containment. | Phase plan | 2026-09-05 |
| AR-09 | T-19-04 | Historical build provenance contains public tool metadata and hashes, not credentials or repository contents. | Phase plan | 2026-09-05 |
| AR-10 | T-25-05 | Invalid-ID diagnostics expose only repository-relative paths and user-authored submitted IDs. | Phase plan | 2026-09-05 |

T-08-04 was transferred to the later containment work and ultimately superseded at the shipped boundary by the Plan 17 TypeScript/Node cutover.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-05 | 96 | 96 | 0 | Codex / GSD ASVS Level 1 artifact audit |

### Evidence

- All 26 plans have matching completed summaries.
- Final active suite: 10 files, 95 tests passed.
- Focused concise-output and installed-package suite: 23 tests passed.
- TypeScript build passed.
- npm package inventory contains 43 declared pure TypeScript/Node outputs and excludes the historical native provider.
- Real-TTY UAT passed with concise committed output.
- Code review recorded zero critical findings; its three warnings remain advisory and do not expose an active blocking threat in the shipped package.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-05

