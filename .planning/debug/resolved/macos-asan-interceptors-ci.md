---
status: resolved
trigger: |
  Authorize a bounded investigation to select and validate an approved alternative macOS diagnostic for Plan 01-17. Preserve ASan where supported, do not weaken the approved evidence contract, and do not mark the plan complete without passing hosted evidence.
created: 2026-08-29T04:52:31Z
updated: 2026-08-29T07:50:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

bug_class: bohrbug
reasoning_checkpoint:
  hypothesis: "Apple ASan cannot establish its required malloc/free interceptors for the dynamically loaded Node-API test provider in the pinned hosted macOS/Vitest-worker process, even when its requested DYLD runtime is preloaded; a UBSan test provider does not require those interceptors and remains source/toolchain/test-mode equivalent."
  confirming_evidence:
    - "The retained ENV-MA / Node 24.0.0 log compiles the ASan test provider, exports exactly the ASan-requested DYLD_INSERT_LIBRARIES value, then aborts in the first Vitest worker before any test runs."
    - "The preceding release provider/tracer passes on that same hosted job, while a locally compiled UBSan test provider loaded by the existing manifest passed all 15 native safety assertions without DYLD injection."
    - "Plan 01-15 explicitly permits a passing maintained sanitizer or an exact approved alternate disposition per row/lane; the approved Mode-B contract still requires the same behavioral suite and release proof."
  falsification_test: "On the pinned hosted macOS Xcode 16.4 rows, the new UBSan test provider either cannot load or the unmodified contained-fs safety suite fails/does not execute; either observation disproves the candidate as an approved alternate."
  fix_rationale: "Declare UBSan in the native builder and select it only for macOS CI. This replaces the incompatible diagnostic mechanism without touching the provider API, test suite, release build, provenance, or ASan use on Windows/Linux."
  blind_spots: "Local success uses macOS 26.5.1 and Command Line Tools rather than hosted macOS 15/Xcode 16.4; hosted ENV-MA and ENV-MX evidence is therefore still required. UBSan does not claim ASan-equivalent heap diagnostics, so ASan remains required where it runs."
  candidate_causes:
    - "code: the workflow attaches an interceptor-dependent ASan add-on to a multi-process Node/Vitest execution model."
    - "config: DYLD_INSERT_LIBRARIES is configured but cannot make the dynamic interceptor model valid for the worker loading path."
    - "environment: the pinned Apple clang 17 ASan runtime and hosted Node lane reject those late/missing interceptors deterministically."
  and_gate: "yes — failure requires both the ASan diagnostic choice and the pinned macOS/Node worker runtime; the release provider alone is not sufficient."
hypothesis: Confirmed: the macOS ASan test provider is incompatible with the pinned Node/Vitest worker process; macOS-only UBSan is the approved diagnostic alternate, while ASan remains selected elsewhere and release evidence remains separate.
test: The full local guardrail and all in-scope hosted macOS evidence gates passed; the user approved the bounded macOS-only diagnostic disposition.
expecting: Terminal disposition recorded without changing the production release provider or non-macOS diagnostic lanes.
next_action: Archived as resolved; resume Plan 01-17 execution from the existing source commit and retained hosted evidence.

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: The Plan 01-17 hosted macOS Mode-B diagnostic provider executes its containment tests and produces admissible evidence for the exact branch/ref.
actual: The hosted macOS release packed tracer passes 13/13, but the separate ASan test provider aborts before its tests run.
errors: "Interceptors are not working" from the Apple ASan runtime, including after exporting clang's reported DYLD_INSERT_LIBRARIES runtime.
reproduction: Dispatch `.github/workflows/containment.yml` on branch `codex/phase-1-plan-17` at commit `7c53e13` or later; inspect final run 33181290104, representative ENV-MA / Node 24.0.0 job 98882838218.
started: During Plan 01-17 hosted matrix validation after correcting declared Node-lane execution and PATH isolation defects; the failure persisted through the third bounded repair.

## Eliminated
<!-- APPEND only - prevents re-investigating -->

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-08-29T04:52:31Z
  checked: Plan 01-17 blocking checkpoint and retained CI evidence
  found: Local ENV-MA25 release verification passed 137/137, and hosted macOS release packed-tracer verification passed 13/13. Only the separate hosted macOS ASan test provider aborts before tests with `Interceptors are not working`; the final failed/cancelled run and logs are retained on the dedicated remote branch.
  implication: The production provider and release tests are not the failing surface. Any correction must target the diagnostic provider without weakening or reinterpreting the approved verification claim.

- timestamp: 2026-08-29T05:08:00Z
  checked: Current containment workflow, native build script, and macOS release tracer workflow
  found: The full macOS matrix builds and runs the release provider plus integration tracer successfully, then overwrites it with a test-only `-fsanitize=address` add-on, exports clang's ASan dylib through `DYLD_INSERT_LIBRARIES`, and fails on the following unit suite. The separate POSIX tracer workflow already demonstrates that the release provider and full regression suite pass on the pinned ENV-MA host, but it is not a memory diagnostic.
  implication: The abort boundary is the ASan-linked test provider/process setup, not release behavior. Any accepted substitute must independently diagnose native-memory defects while retaining the existing behavioral containment suite.

- timestamp: 2026-08-29T05:18:00Z
  checked: Plan 01-15/01-17 contracts, retained ENV-MA/Node 24.0.0 hosted log, workflow state, and debug knowledge base
  found: Plan 01-15 explicitly requires every required row/lane to record a passing maintained sanitizer or exact approved alternate disposition, never a silent skip. Plan 01-17 separately requires source/toolchain-equivalent Mode-B instrumentation, the unmodified behavioral suite, and a release rebuild before evidence capture. The pinned run compiled the address test provider successfully, began Vitest, then its first worker emitted `ERROR: Interceptors are not working` and exited before the suite ran despite the workflow already exporting the exact `DYLD_INSERT_LIBRARIES` path ASan printed. The release tracer before that build passed. No prior debug knowledge-base entry or project skill applies.
  implication: This is a deterministic environment/toolchain diagnostic failure (Bohrbug), not a source-level test failure. SBFL is inapplicable because no local failing per-test coverage run exists; differential diagnostic probing is the routed next technique.

- timestamp: 2026-08-29T05:34:00Z
  checked: Local macOS 26.5.1/Apple clang 17.0.0 diagnostic probe using the exact unmodified native safety suite
  found: A temporary test-only provider built from the same source with `-fsanitize=undefined -fno-sanitize-recover=all`, loaded through the existing package manifest, linked against `@rpath/libclang_rt.ubsan_osx_dynamic.dylib` and ran all 15 `contained-fs` assertions successfully in 2.60s without `DYLD_INSERT_LIBRARIES`. The ASan provider's dynamic loading model is therefore not required for test-mode source/toolchain equivalence.
  implication: UBSan is a supported, executable macOS diagnostic candidate. This confirms the candidate locally but not on the pinned hosted Xcode 16.4 rows; hosted validation remains mandatory.

- timestamp: 2026-08-29T05:50:00Z
  checked: Agent-authored diagnostic-selection regression test after the minimal native-builder/workflow update
  found: The focused `tests/unit/contained-fs.test.ts` suite passed 15/15. Its prior red state proved the builder rejected `undefined` and the workflow lacked the macOS-only selector; it now verifies both declared diagnostics parse and the workflow assigns UBSan only when `FAMILY=macos`.
  implication: The implementation preserves ASan selection on non-macOS matrix paths and makes the macOS alternate explicit rather than silently omitting diagnostics.

- timestamp: 2026-08-29T05:54:00Z
  checked: Actual native builder and ENV-MA25 local test-provider run
  found: `native/build.mjs --variant test --diagnostic undefined --row ENV-MA25` recorded `diagnostic: "undefined"`; the unchanged 15-test safety suite passed in 2.20s. The builder then recreated the release provider and manifest, which reported `variant: "release"` with a matching binary hash.
  implication: The committed build path—not a hand-assembled probe—supports the macOS alternate while preserving release evidence separation.

- timestamp: 2026-08-29T05:56:00Z
  checked: Full local build/regression gate
  found: `npm run build` passed, but the full Vitest invocation reported failures in `containment-races.test.ts` (declared Node-lane assertion) and `validation-errors.test.ts` (provider failure before writes) before the command completed its normal verification tail. Neither failure is in the changed builder/workflow/test path.
  implication: Full-suite acceptance is presently blocked pending differential isolation; no hosted dispatch or fix acceptance claim is made from the focused passing results alone.

- timestamp: 2026-08-29T06:02:00Z
  checked: Isolated full-suite failures and active generated provider provenance
  found: The containment-races failure directly asserts the now-removed `DYLD_INSERT_LIBRARIES` workaround, so it must change with the approved diagnostic replacement. The validation-errors failure occurs before its scenario when its package fixture invokes the builder with the deliberately missing `EXSPECSO_NODE_HEADERS`; the active provider is restored release and its manifest hash matches. The test passes its fixture setup only when the declared header archive is provided.
  implication: The first failure is a required test-contract update justified by the root cause, while the second is an invocation-environment prerequisite rather than a product regression.

- timestamp: 2026-08-29T06:18:00Z
  checked: Full suite with declared headers but Vitest's default timeout
  found: 133/137 tests passed; the remaining four `init-codex-tracer` cases each exceeded Vitest's default 5-second per-test timeout and cleanup then reported nonempty temporary npm caches. The containment CI already invokes this same tracer suite with `--testTimeout 60000`; no changed diagnostic code is on the failed path.
  implication: The prior full-suite command was not equivalent to the project/CI verification configuration. The next run uses the declared 60-second timeout instead of changing unrelated tracer or cleanup behavior.

- timestamp: 2026-08-29T06:24:00Z
  checked: Full local regression suite with the declared Node-header archive and `--testTimeout 60000`
  found: All 12 test files and all 137 assertions passed in 106.25 seconds, including the previously timeout-sensitive Codex tracer cases.
  implication: The focused change passes target, adjacent, and full local regression verification under the same timeout contract used by containment CI.

- timestamp: 2026-08-29T06:31:00Z
  checked: Evidence writer and workflow artifact paths after the test-provider/release-provider transition
  found: `scripts/write-containment-evidence.mjs` reads only the post-test release provider and `tracer-results.json`; the workflow uploads neither the test provider's `build-provenance.json` nor a JSON safety-suite result before rebuilding release. Therefore the prior ASan (and proposed UBSan) diagnostic selection would be visible only in ephemeral job logs.
  implication: Without a small retention addition, the new macOS alternate would weaken the approved explicit diagnostic-evidence record. Preserve test-provider provenance/results in every matrix branch before restoring release.

- timestamp: 2026-08-29T06:40:00Z
  checked: Workflow evidence-retention contract, TypeScript build, focused workflow test, and final local regression suite
  found: The workflow now preserves `diagnostic-build-provenance.json` and `diagnostic-results.json` in each of its three matrix execution branches before restoring the release provider. The focused suite passed 15/15, `npm run build` passed, `git diff --check` passed, and the full declared local gate passed 137/137 in 93.85 seconds.
  implication: Local verification preserves rather than weakens the evidence contract. Hosted validation can now directly prove the macOS alternate's diagnostic flags and its passing safety result.

- timestamp: 2026-08-29T06:44:00Z
  checked: Exact remote ref and source-only diagnostic fix commit
  found: Commit `37c585ab191281781b8d3e9ddc871ae69ec0ef44` was created after a clean cached diff and pushed to `origin/codex/phase-1-plan-17`. It contains only the macOS diagnostic selector/builder, explicit retained diagnostic evidence, and associated regression tests; no debug/planning/generated artifacts were staged.
  implication: The hosted matrix can now test the exact intended ref without unrelated local state.

- timestamp: 2026-08-29T06:47:00Z
  checked: Newly dispatched hosted containment run 33235609104
  found: The run is queued on commit `37c585ab191281781b8d3e9ddc871ae69ec0ef44`; representative ENV-MA and ENV-MX jobs have fetched the exact snapshot and checksum-verified Node inputs and are executing the combined release/tracer/diagnostic step.
  implication: Hosted validation is running against the intended source ref and has reached the diagnostic boundary; the next terminal job result will directly test the UBSan candidate.

- timestamp: 2026-08-29T06:51:00Z
  checked: Hosted macOS job terminal state for run 33235609104
  found: `ENV-MA / Node 26.8.1` completed successfully, including the combined release/tracer/diagnostic/release step, while other macOS jobs remain in progress or queued.
  implication: The replacement has its first direct hosted success; retained artifact contents must confirm the actual diagnostic configuration before considering the candidate validated.

- timestamp: 2026-08-29T06:55:00Z
  checked: Retained artifact `containment-ENV-MA-node-26.8.1` from hosted run 33235609104
  found: On the pinned ENV-MA macOS 15.7.7/Xcode 16.4/Apple clang 17 runner at commit `37c585ab191281781b8d3e9ddc871ae69ec0ef44`, the test provider recorded `diagnostic: "undefined"` with `-fsanitize=undefined -fno-sanitize-recover=all -fno-omit-frame-pointer`; its JSON safety result has 15 total/15 passed/0 failed/0 pending/0 todo.
  implication: The candidate passes direct hosted validation on the original failing macOS ARM class without ASan loader suppression, and retained evidence now proves the actual diagnostic. Intel-row confirmation remains required for the complete macOS disposition.

- timestamp: 2026-08-29T06:59:00Z
  checked: Hosted macOS matrix progress for run 33235609104
  found: Four ENV-MA lanes and the first ENV-MX / Node 24.0.0 lane have completed successfully; no completed macOS job has failed. The remaining lanes are scheduled/in progress under the same matrix configuration.
  implication: The alternative is already successful across both macOS architecture job classes; inspecting the completed ENV-MX artifact confirms whether its retained diagnostic evidence matches the ARM proof.

- timestamp: 2026-08-29T07:03:00Z
  checked: Retained artifact `containment-ENV-MX-node-24.0.0` from hosted run 33235609104
  found: On the pinned ENV-MX Intel macOS/Xcode 16.4 runner at commit `37c585ab191281781b8d3e9ddc871ae69ec0ef44`, the test provider is `variant: "test"`, `diagnostic: "undefined"`, with `-fsanitize=undefined -fno-sanitize-recover=all -fno-omit-frame-pointer`; its safety result has 15 total/15 passed/0 failed/0 pending/0 todo.
  implication: The alternate is directly validated on both required hosted macOS architectures. Remaining matrix jobs are still a Plan 01-17 completion gate, but they do not alter this diagnostic root-cause finding.

- timestamp: 2026-08-29T07:08:00Z
  checked: Initial revert-and-reconfirm attempt for commit 37c585a
  found: The inverse reverted both implementation and the newly introduced regression assertions, so the focused suites passed against the older workflow. `git revert --abort` restored the committed source cleanly; only pre-existing untracked `.gsd/` and debug files remain.
  implication: The first guard attempt is inconclusive rather than a failed fix: its test was removed along with the implementation. Retain the HEAD regression tests while inverting only the implementation to make the guard falsifiable.

- timestamp: 2026-08-29T07:12:00Z
  checked: Revert-and-reconfirm with HEAD regression assertions retained
  found: The focused suites failed 3 assertions against the inverted builder/workflow: the old builder rejected `undefined`, and the old workflow lacked the macOS selector/diagnostic artifact paths. This confirms the fix is causally necessary. The automatic `git revert --abort` then encountered an index conflict because the assertions were intentionally restored from HEAD during the inverse test.
  implication: Revert-and-reconfirm is a pass on causal behavior; the repository needs only a constrained recovery to the already-known HEAD content of the four authored files, with no user-owned tracked changes at risk.

- timestamp: 2026-08-29T07:16:00Z
  checked: Recovery from the deliberate local revert test
  found: After `git revert --quit`, restoring only `.github/workflows/containment.yml`, `native/build.mjs`, `tests/unit/contained-fs.test.ts`, and `tests/integration/containment-races.test.ts` from HEAD left no tracked diff or staged changes. Only pre-existing untracked `.gsd/` and debug state remain.
  implication: The inverse test did not leave a partial revert or alter user-owned tracked content; the exact hosted-validation commit is re-applied locally.

- timestamp: 2026-08-29T07:20:00Z
  checked: Re-applied focused contracts, mutation tooling availability, and hosted macOS job summary
  found: Re-applied focused suites passed 18/18 and tracked diff remains clean. No Stryker configuration is present, so mutation testing is unavailable. Hosted run 33235609104 has 8 completed successful macOS jobs and zero failed macOS jobs; remaining macOS lanes are queued/in progress.
  implication: Target and adjacent guardrails pass; mutation checking is explicitly skipped, not treated as passed. The hosted candidate remains healthy while completing its declared macOS lanes.

- timestamp: 2026-08-29T07:26:00Z
  checked: Hosted macOS job summary for run 33235609104 after a bounded wait
  found: Ten of twenty macOS row/lane jobs have completed successfully and none has failed; four are in progress and six remain queued. The completed set includes both ENV-MA and ENV-MX architecture classes and multiple Node majors.
  implication: The replacement remains stable across the expanding hosted macOS sample. Continue the same run until all declared macOS lanes are terminal before a human-verification checkpoint.

- timestamp: 2026-08-29T07:28:00Z
  checked: Hosted macOS job summary for run 33235609104 after the next bounded poll
  found: Eleven of twenty macOS jobs are successful with zero failures. ENV-MX / Node 26.0.0 joined the completed passes; three jobs are in progress and six are queued.
  implication: No diagnostic failure appears when the alternate runs on another Intel Node lane. The hosted macOS completion criterion is still pending only remaining scheduled work.

- timestamp: 2026-08-29T07:32:00Z
  checked: Exact hosted run 33235609104 at commit 37c585ab191281781b8d3e9ddc871ae69ec0ef44
  found: Twelve of twenty macOS row/lane jobs are completed successfully with zero failures. Four jobs are in progress and four remain queued; the run itself is non-terminal. The newly completed ENV-MA / Node 25.2.1 lane passed.
  implication: The approved macOS UBSan alternate continues to pass across both architecture classes and Node lanes, but Plan 01-17 cannot be marked complete until the remaining eight macOS jobs are terminal and admissibly passing.

- timestamp: 2026-08-29T07:34:00Z
  checked: Exact hosted run 33235609104 after a bounded poll
  found: Thirteen of twenty macOS row/lane jobs are completed successfully with zero non-success terminal conclusions. Three jobs are in progress and four remain queued; the exact commit remains 37c585ab191281781b8d3e9ddc871ae69ec0ef44.
  implication: The hosted macOS alternative remains stable, but seven lanes still prevent a completion or human-verification checkpoint.

- timestamp: 2026-08-29T07:36:00Z
  checked: Exact hosted run 33235609104 after the next bounded poll
  found: Fourteen of twenty macOS row/lane jobs are completed successfully with zero non-success terminal conclusions. Three jobs are in progress and three remain queued; the exact commit remains 37c585ab191281781b8d3e9ddc871ae69ec0ef44.
  implication: The alternate continues to pass as the remaining Intel and ARM lanes drain, but six lanes still prevent acceptance.

- timestamp: 2026-08-29T07:38:00Z
  checked: Exact hosted run 33235609104 after the next bounded poll
  found: Sixteen of twenty macOS row/lane jobs are completed successfully with zero non-success terminal conclusions. ENV-MA / Node 22.23.2, ENV-MX / Node 20.20.2, and ENV-MX / Node 25.2.1 are in progress; ENV-MX / Node 20.19.0 is queued.
  implication: The substitute continues to pass in the hosted matrix, but the remaining four lanes are a hard Plan 01-17 gate and prevent completion.

- timestamp: 2026-08-29T07:40:00Z
  checked: Exact hosted run 33235609104 after a bounded poll
  found: The macOS count remains 16/20 successful with zero failures, and all four remaining lanes are now in progress; no lane is still queued.
  implication: The run remains non-terminal but runner scheduling is no longer blocking the last macOS coverage.

- timestamp: 2026-08-29T07:42:00Z
  checked: Exact hosted run 33235609104 at commit 37c585ab191281781b8d3e9ddc871ae69ec0ef44
  found: Eighteen of twenty macOS row/lane jobs are terminal `success` and no terminal macOS job has a non-success conclusion. Only ENV-MX / Node 25.2.1 and ENV-MX / Node 20.19.0 remain in progress; the workflow run is still non-terminal.
  implication: Both remaining gates are on the Intel macOS class and require only terminal confirmation; any non-success outcome must be diagnosed from its job log before acceptance.

- timestamp: 2026-08-29T07:44:00Z
  checked: Exact hosted run 33235609104 after a bounded 45-second interval
  found: The run and both remaining ENV-MX lanes are still `in_progress`; the terminal macOS count remains 18/20 `success` with zero non-success conclusions.
  implication: There is no diagnostic regression to investigate. Continue bounded polling of the same hosted evidence rather than inferring completion from partial results.

- timestamp: 2026-08-29T07:46:00Z
  checked: Exact hosted run 33235609104 at commit 37c585ab191281781b8d3e9ddc871ae69ec0ef44 after its two pending Intel lanes completed
  found: All 20 declared macOS row/lane jobs are terminal `success` (including ENV-MX / Node 25.2.1 and ENV-MX / Node 20.19.0); none has a non-success conclusion. The enclosing workflow is still in progress only because non-macOS work remains.
  implication: The complete hosted macOS gate is satisfied for the exact fix commit. Verify its artifact inventory, then request human end-to-end confirmation rather than waiting on out-of-scope platform work.

- timestamp: 2026-08-29T07:48:00Z
  checked: Retained artifact inventory for exact hosted run 33235609104
  found: The run has exactly 20 non-expired macOS containment artifacts, one for every `ENV-MA` and `ENV-MX` row/lane; the previously inspected ARM and Intel artifacts directly record UBSan flags and 15/15 containment-suite passes.
  implication: The approved diagnostic-evidence retention contract holds for every successful hosted macOS lane, completing the self-verification evidence set.

- timestamp: 2026-08-29T07:50:00Z
  checked: End-to-end human confirmation following the complete hosted macOS evidence gate
  found: The user approved UBSan as the explicit diagnostic alternate only for macOS. ASan remains enabled and required on Windows and Linux; the production release provider remains unsanitized and is rebuilt normally after diagnostic testing. The approval is scoped to run `33235609104` at commit `37c585ab191281781b8d3e9ddc871ae69ec0ef44`, with 20/20 macOS jobs successful, 20 retained diagnostic artifacts, and sampled ARM/Intel artifacts recording UBSan flags plus 15/15 safety tests.
  implication: The original hosted macOS ASan-interceptor blocker is resolved under the approved alternate-disposition contract without weakening non-macOS ASan coverage or release-provider evidence.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: "The ASan test provider is incompatible with the pinned hosted macOS Node/Vitest worker process: Apple ASan aborts before test execution because its required process-wide interceptors are unavailable despite the prescribed DYLD preload. This arises from the ASan diagnostic choice plus the macOS/Node worker environment; the release provider is not defective."
fix: "Added a macOS-only `undefined` native diagnostic and select it for the macOS test provider; preserve `address` diagnostics for Windows, glibc, and musl."
files_changed: ["native/build.mjs", ".github/workflows/containment.yml", "tests/unit/contained-fs.test.ts", "tests/integration/containment-races.test.ts"]
verification: "target_test: pass (15/15); adjacent_tests: pass (focused 18/18, full declared local suite 137/137, build); mutation_check: skipped (no Stryker configuration); no_op_deletion: pass (explicit selector and retained diagnostic evidence added); revert_and_reconfirm: pass (inverse implementation with HEAD regression tests retained caused three expected failures, then exact HEAD restored); hosted_macos: pass (20/20 success, 0 failed, 20/20 retained artifacts, exact commit 37c585ab191281781b8d3e9ddc871ae69ec0ef44); guardrail_verdict: accepted."
human_verification: "approved: UBSan is the macOS-only diagnostic alternate; ASan remains required on Windows and Linux; the production release provider is unsanitized and rebuilt after diagnostic testing."
prevention: "why not caught: the original approval did not anticipate Apple ASan interceptor failure in the pinned Node/Vitest worker model; guard: retain per-lane diagnostic provenance/results and require an explicit approved alternate disposition for unsupported sanitizer runtimes."
oracle_type: derived
