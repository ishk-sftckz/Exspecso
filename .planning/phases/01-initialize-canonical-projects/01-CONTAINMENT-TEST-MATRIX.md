# Containment test matrix — planned, not passing evidence

Status: all new rows pending implementation and 01-09 approval. Existing local build/62-test baseline is historical evidence, not proof of this matrix. All fixtures use dedicated disposable test directories; controllers may only modify those fixtures and terminate their own child processes.

## How evidence is classified

- **Release:** actual uninstrumented npm tarball installed outside the checkout, with its own native component.
- **Instrumented:** separately built and installed test tarball, same source commit/core/toolchain/target with the release-equivalence inventory recorded. Fixed test synchronization is unavailable in release builds. These results do not directly prove a literal uninstrumented binary's timing.
- **Native diagnostic:** sanitizer or other approved native diagnostic build, labeled separately.
- **Human:** real-TTY and existing agent-host entrypoint observations. Generated files alone do not prove host invocation.
- **Limitation:** relocation/ordinary-entry schedules outside the approved preventive guarantee. Record actual behavior and authority assumptions; never label these as strict containment prevention successes.

Recommended Mode B requires instrumented deterministic cases plus build equivalence and release E2E. A request for exact literal-release deterministic evidence switches to Mode A external tracing and requires proven tracing availability on every row. No substitution can happen silently.

## Required case catalogue

Every row is pending. Suite aliases below resolve to exact non-watch commands in the command map. Ownership is plan.task. The actual case inventory expands these families using the rules below; a family passing one example does not complete its expansion.

| ID | Case | Owner | Suite | Oracle |
|---|---|---|---|---|
| BASE-01 | Existing 62 behavior assertions | 12–18 | npm test -- --run | No loss of validation, selection, ownership, rerun, ID, minimal-tree or D-19 semantics; Windows harness adaptation preserves meaning. |
| TR-01 | Installed bound promotion regression | 10.3 / 11 | init-codex-tracer | Record actual vulnerable CLI failure first, then unchanged external sentinels with real provider and reached native operation. |
| TR-02 | Uninstrumented tracer and provenance | 10.3 / 11 | init-codex-tracer | Installed CLI uses its own provider; ordinary success remains correct; evidence is labeled release versus test variant. |
| NP-01 | Name/type/path constraints | 10.1–2 / 15.2 | contained-fs | Single names, no-follow components, device/ADS/reparse and wrong types reject without unintended changes. |
| NP-02 | Directory binding, replacement and relocation | 10.1–2 / 15.2 | contained-fs | Substituted name cannot redirect; every moved original root/parent/descendant follows only the approved object-authority oracle, explicitly not a lexical prevention pass. |
| NP-03 | Handle lifetime and malformed inputs | 10.1–2 / 15.2 | contained-fs | Wrong kind/parent, use after close, exceptions, repeated close, buffers and length cases do not crash, leak or access unrelated objects. |
| NP-04 | Native diagnostic builds | 10.1–2 / 15.2 | contained-fs | Approved sanitizer/diagnostic jobs and bounded seeded malformed-input tests pass; unsupported tooling gets explicit alternate evidence, never silent skip. |
| RD-01 | Artifact enumeration substitutions | 12.1–2 | artifacts + validation-errors | Outside bytes never enter scan authority through substituted symbolic/reparse names; unsafe read is diagnostic. |
| RD-02 | Malformed/duplicate/lazy definitions | 12.1–2 | artifacts + validation-errors | All original declaration diagnostics, duplicates, ordering and lazy stable IDs retain their behavior. |
| RD-03 | Root discovery and read lifetime | 12.1–2 | artifacts + validation-errors | Discovered Git root identity and marker are checked; root/nested/nested-Git and benign canonical path alias policy preserved; read-only calls create nothing. |
| RD-04 | Init preimage and provider preflight | 12.1–2 | artifacts + validation-errors | Observed stale preimage/invalid input/provider failure blocks ownership/staging and leaves exact repository inventory unchanged. |
| OW-01 | Writer/recovery contention | 13.1 | transaction-recovery | Losing recovery cannot remove a live writer journal or token. |
| OW-02 | Stale reclaimers and new owner | 13.1 | transaction-recovery | Token-specific behavior preserves the new live UUID owner. |
| OW-03 | Dead/partial/legacy evidence | 13.1 | transaction-recovery | Complete dead candidates only; partial, legacy or unknown entries remain diagnostic and preserved. |
| OW-04 | Actual terminated owner | 13.1 | transaction-recovery | Controller observes actual child termination before recovery; platform-correct oracle, no fabricated SIGKILL on Windows. |
| TX-01 | Exclusive stage/temp creation | 13.2 / 14.1 | transaction-recovery | Collisions and substituted stage parents cannot receive unintended writes; private ownership remains identifiable. |
| TX-02 | Backup/write/sync faults | 13.2 / 14.1 | transaction-recovery | Bound source bytes/hash remain correct; short write/sync error retains required evidence. |
| TX-03 | Each output promotion and hardlink alias | 13.2 / 14.1 | transaction-recovery | Each fresh/rerun output uses sibling replacement; unrelated hardlink alias retains old content. |
| TX-04 | Journal intent/completion gap | 13.2 / 14.1 | transaction-recovery | Every before/after replacement/journal update state is explicitly recoverable or ambiguous, never mixed accepted state. |
| RC-01 | Every prior-set restore | 14.2 | transaction-recovery | Each actual write has process fault and restore evidence; exact prior bytes are recovered. |
| RC-02 | Recovery interrupted and restarted again | 14.2 | transaction-recovery | Restoration intent/progress is idempotent at every declared transition. |
| RC-03 | Changed evidence and unsafe path | 14.2 | transaction-recovery | Modified journal/backup/canonical data blocks and preserves evidence; no containment-to-lexical downgrade. |
| RC-04 | Concurrent recovery/live writer | 14.2 | transaction-recovery | One held lease controls recovery; a later live owner is not released by stale work. |
| CL-01 | Known-entry cleanup | 15.1 | transaction-recovery + minimal-artifacts | Only identified entries removed via bound parents; unknown files and newer owner data remain unchanged. |
| CL-02 | Partial cleanup restart | 15.1 | transaction-recovery + minimal-artifacts | Settled valid set remains provable after cleanup faults without requiring already-removed backups; final successful tree minimal. |
| PK-01 | Manifest/target inventory | 16.1–2 | contained-fs + init-codex-tracer | Exactly the approved target binaries, fixed loader selection, correct length/hash/NAPI/commit metadata. |
| PK-02 | Provider/manifest negative cases | 16.1–2 | contained-fs + init-codex-tracer | Missing/corrupt/wrong tuple/NAPI/version/hash is diagnosed before repository changes; fixtures do not rely on invalid CLI input. |
| PK-03 | Real offline cached install | 16.1–2 | contained-fs + init-codex-tracer | Same actual tarball installs with prefetched locked dependencies, ignore-scripts, no compiler/headers/provider network or workspace leakage. |
| PK-04 | Installed provider proof and release exclusions | 16.1–2 | contained-fs + init-codex-tracer | Loaded realpath/hash belongs to install; test-only controller/symbol entrypoints absent from release; root and nested CLI E2E pass. |
| AD-01 | All seven nonempty runtime subsets | 17.2 | init-codex-tracer + init-rerun + runtime-selection | Claude Code/Codex/OpenCode selected outputs and order correct; no omitted adapter changes or extra canonical artifacts. |
| AD-02 | Invalid/empty/cancel/rerun/no-op | 17.2 | init-codex-tracer + init-rerun + runtime-selection | Existing TTY/non-TTY behavior, additive reruns and next-command sigils remain correct; future workflow conformance stays Phase 6. |
| EF-01 | Names and filesystem policies | 15.2 / 17.2 | contained-fs + containment-races | Spaces, Unicode, case variants, long paths, root aliases, device names, mount/cross-device and unsupported capabilities follow explicit policy. |
| EF-02 | Real and injected failure modes | 15.2 / 17.2 | contained-fs + containment-races | Permission/read-only/share violation/full disk/short write/sync/resource exhaustion errors never count as success; real versus injected evidence labeled. |
| RACE-01 | Reads and root acquisition | 17.1 | containment-races | Reached operation ID plus exact external bytes/inventory, replacement-root inventory, held object identity, journal/owner state and CLI outcome; approved relocation boundary separately labeled. |
| RACE-02 | Ownership publication/reclaim/release | 17.1 | containment-races | Reached operation ID plus exact external bytes/inventory, replacement-root inventory, held object identity, journal/owner state and CLI outcome; approved relocation boundary separately labeled. |
| RACE-03 | Stage/temp/backup and journal operations | 17.1 | containment-races | Reached operation ID plus exact external bytes/inventory, replacement-root inventory, held object identity, journal/owner state and CLI outcome; approved relocation boundary separately labeled. |
| RACE-04 | Each actual promotion | 17.1 | containment-races | Reached operation ID plus exact external bytes/inventory, replacement-root inventory, held object identity, journal/owner state and CLI outcome; approved relocation boundary separately labeled. |
| RACE-05 | Each restoration | 17.1 | containment-races | Reached operation ID plus exact external bytes/inventory, replacement-root inventory, held object identity, journal/owner state and CLI outcome; approved relocation boundary separately labeled. |
| RACE-06 | Known-entry cleanup | 17.1 | containment-races | Reached operation ID plus exact external bytes/inventory, replacement-root inventory, held object identity, journal/owner state and CLI outcome; approved relocation boundary separately labeled. |
| ST-01 | Bounded supplemental stress | 17.2 | containment-races | Record seed/count/deadline and preserve minimized failure evidence; stress passing never replaces deterministic cases. |
| GATE-01 | Reject incomplete evidence | 11.2 / 18.1 | containment-evidence | Missing, stale, skipped, failed, cancelled, contradictory, emulated-only, wrong hash/commit/matrix records reject aggregate. |
| GATE-02 | One final tarball and native matrix | 11.2 / 18.1 | containment-evidence | Actual required native jobs use the same final release tarball hash and approved test variants; complete evidence passes aggregate. |

## Deterministic expansion and coverage equality

1. Materialize all eight ENV rows in SUPPORT into exact approved OS/CPU/libc/filesystem/Node lanes at 01-09. Every final lane runs BASE, package release tests, native/provider tests, instrumented deterministic grid, fault grid and stress. Actual TTY/host observations remain a separate explicit ledger; unavailable credentials are not an automated pass.
2. Use real fresh-init and additive-rerun plans for each of the seven nonempty adapter selections. Collect their actual write lists before execution; deduplicate identical mechanical paths only when the report identifies the covered selections and equivalence rationale. Include existing and absent destinations, operational files, journal/backup records and target-type changes.
3. For each RACE family operation, enumerate leaf, immediate parent, higher ancestor and root-name substitution at its final native-use boundary, with a distinct CLI/controller process. Include static cases in NP/RD and post-open original-directory relocation at root, immediate parent and higher ancestor as explicitly labeled limitation cases. POSIX symlinks and Windows symlinks/junction/reparse cases have separate IDs where semantics differ. Hardlink alias preservation is TX-03. A site that cannot exist for a given operation needs a reviewed not-applicable reason in the catalogue; blanket test.skip is forbidden.
4. Enumerate every actual journal/publication/promotion/restore/cleanup transition before and after the operation. Expand each over injected exception, controlled interruption, and actual forced child termination. Await the child's observed exit before next-process recovery. On Windows, use a real termination/exit oracle rather than demanding a POSIX signal string. Add a second interrupted recovery, unknown/partial/legacy evidence and live-owner contention. A transition with no applicable mutation needs an explicit reason, not an invented fake fault.
5. Catalogue generation must reject unknown operation IDs, missing native boundary reach records and duplicate/conflicting results. Generated case count equals completed case results plus explicit blocked/not-applicable dispositions. Required cases with blocked/failed/skipped/missing results prevent aggregate completion. Every not-applicable disposition is reviewed against the operation catalogue; it cannot waive a required platform or primitive.
6. Stress has recorded seed, iteration and time bounds selected by the approved test configuration. A failed stress run blocks even when deterministic runs pass. Boundary cases use exact sentinels plus directory/type/link inventory; exit status alone is insufficient. Root/descendant relocation outcomes must honor the approved object-authority decision and cannot masquerade as lexical-path protection.

## Command map

| Suite | Automated command |
|---|---|
| contained-fs | `npm test -- --run tests/unit/contained-fs.test.ts` |
| artifacts | `npm test -- --run tests/unit/artifacts.test.ts` |
| validation-errors | `npm test -- --run tests/integration/validation-errors.test.ts` |
| transaction-recovery | `npm test -- --run tests/integration/transaction-recovery.test.ts` |
| minimal-artifacts | `npm test -- --run tests/integration/minimal-artifacts.test.ts` |
| init-codex-tracer | `npm test -- --run tests/integration/init-codex-tracer.test.ts` |
| init-rerun | `npm test -- --run tests/integration/init-rerun.test.ts` |
| runtime-selection | `npm test -- --run tests/unit/runtime-selection.test.ts` |
| containment-races | `npm test -- --run tests/integration/containment-races.test.ts` |
| containment-evidence | `npm test -- --run tests/unit/containment-evidence.test.ts` |
| tracer aggregate | `node scripts/containment-evidence.mjs --stage tracer --evidence-dir .artifacts/containment` |
| final aggregate | `node scripts/containment-evidence.mjs --stage final --evidence-dir .artifacts/containment` |

Split generated grids into bounded shards using an explicit shard index/count. The aggregate must require every shard; a shard selection cannot lower required coverage. Builds and full platform jobs may take longer than 60 seconds; provide bounded progress/feedback rather than deleting tests to meet an arbitrary timing cap.

## Evidence schema and release acceptance

Each record names matrix revision, case ID, operation/site/transition, expected oracle, status, evidence mode, source commit, final release tarball SHA-256, installed provider SHA-256/realpath, test-variant hash where applicable, shared-core equivalence record, exact Node/NAPI, native CPU, OS/kernel/image, libc, filesystem, compiler/SDK/header versions, command/exit outcome and logs. Build provenance and logs are not self-authenticating; 18 validates their trusted workflow/repository/commit provenance binding. Keep test-controller channel paths within disposable fixtures, never production configuration.

The release package is assembled once from all approved native builds and redistributed for release tests. Every row must agree on its exact tarball hash. Missing runner, missing provenance, missing required test or unsupported primitive blocks the candidate. No package is published by this phase. Success still requires independent phase verification, real-TTY UAT, the five retained judgment acknowledgements, and the security audit; no Phase 2 advancement from this matrix alone.
