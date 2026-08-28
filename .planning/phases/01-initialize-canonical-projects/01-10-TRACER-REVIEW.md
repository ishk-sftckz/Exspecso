# Plan 01-10 Task 1 — POSIX tracer review

Status: Task 1 verified; awaiting the required human tracer feedback checkpoint. Plan 01-10 is incomplete (1/3 tasks); Phase 1 is incomplete (9/18 plans complete).

## What now works

The real initializer promotes staged bytes through a bundled C Node-API 8 provider. It opens parent directories without following links, writes a private sibling, syncs it, and replaces the named target through the held directory. The native API accepts opaque capabilities and single names after root acquisition. Read-only handles cannot write; cross-parent replacement and use after close are rejected.

The package loader uses only its own fixed manifest and in-package binary, checking target, supported Node/OS, version, Node-API, length, hash and variant before load. The initializer checks provider availability before ownership/recovery can mutate the project. There is no provider download, source-build fallback or npm installation hook.

## Actual verification

- [Final native CI run 33143078424](https://github.com/ishk-sftckz/exspecso/actions/runs/33143078424): **18/18 focused tests and 74/74 full regression tests passed**, with zero failed/pending/skipped tests in the saved JSON reports.
- Native environment: macOS 15.7.7 / 24G720, arm64, APFS, image 20260727.0256.1, Node 20.19.0 / Node-API 9 runtime; the addon uses Node-API 8.
- Build: Xcode 16.4 / 16F6, Apple clang 17.0.0 (clang-1700.0.13.5), SDK 15.5, checksum-verified Node 20.19.0 headers.
- Release provider SHA-256: `6ab01a887d3cc2247eafd7141efaf4999717c7a865ded42fdc01bc9cf0d11de9`, 98,480 bytes. Downloaded bytes were rehashed and match the manifest.
- Native tests exercise invalid components, symlink rejection, exclusive creation, bound directory replacement, hardlink preservation, close/lifetime errors, wrong-parent handles, read-only writes, invalid buffers and spaces/Unicode.
- An isolated installed test package reaches `replace:before` in the native implementation. A separate controller replaces the target leaf, parent or ancestor. The native event reports its actual loaded image path; the test checks that path against the installed package and its hash. All outside sentinels remain unchanged.
- The leaf swap is rejected. Parent/ancestor relocation writes only the held original object in these schedules. Those outcomes are explicitly labeled **limitations under the approved object-authority contract**, not proof of strict lexical containment.
- A real installed release-package rerun preserves an external hardlink alias while updating the repository configuration. A missing provider stops a valid CLI invocation with the repository inventory unchanged. The native release binary has no test barrier environment-string entrypoint.
- Local checks: TypeScript build and C++ syntax checks passed. A disposable loader-only test rejected incompatible Node-API metadata and the unverified local macOS version before mutation or native load. These local checks are not native acceptance results.

## RED evidence

Commit `bbe2e5d` records the regression tests before the provider implementation. Running `npm test -- --run tests/integration/init-codex-tracer.test.ts -t 'external hardlink'` against the old initializer exited 1: the CLI succeeded and updated the intended config, but its external hardlink also acquired the added `claude` agent. The unchanged-external-bytes assertion failed. This is a transcription of the observed command result, not a saved raw RED log. An initial test-authoring attempt used the invalid `claude-code` argument; it was corrected to `claude` and is not counted as the regression reproduction.

The new provider suite also initially failed to import the absent provider. The leaf/parent/ancestor native tests now exercise the repaired boundary; complete historical vulnerable-CLI reproductions for that expanded TR-01 grid remain Task 3 work. This Task 1 checkpoint does not close all TR-01/02 or NP family expansions.

## Evidence mode and provenance

This is approved Mode B: an instrumented installed test package plus matching core-source/header/compiler/SDK/OS provenance and separate uninstrumented release E2E. It is not deterministic timing proof of the literal release binary. The test packages record their tarball and provider hashes. Existing historical TypeScript fault seams are still present; removing all production test hooks belongs to later packaging work. Only the new native controller is shown absent from the release binary here.

GitHub snapshot `e06f4dd504ac7f892b745bacd592e26003687f07` contains exactly the tested product/test/build inputs. All 40 submitted source/config hashes match local GREEN commit `f2280b0`; the commits have different ancestry because unrelated local planning/research was not uploaded. The saved snapshot hash ledger binds their shared inputs. Release/test provenance and six native barrier records (focused plus regression runs) are retained with the raw job log, complete reports, manifest and actual host binary in `01-10-EVIDENCE/`.

The first workflow submission was rejected before jobs because `runner.temp` was used in a job-level environment expression. That context placement was corrected. Run 33142979621 then passed 16 focused tests; the final run added defensive cases and the full suite. No paid runner, new credential, global installation or publication was used.

## Scope and remaining work

- This is a host-only macOS arm64 tracer, not the final all-platform npm package. Windows parity is Task 2; expanded installed tracer evidence is Task 3; the eight-row/nine-Node matrix follows in Plan 11.
- Readers, preimages, ownership, staging, backups, journal updates, restoration and cleanup still contain pathname operations. They remain the explicit scope of Plans 12–15 and are not represented as fully contained.
- The journal remains schema 1. A failed replacement can retain a private sibling and staging evidence; robust ownership/journal identification and recovery of those transitions are later work. No stronger recovery claim is made by this tracer.
- Linux openat2/fallback code has not executed in this checkpoint. Native diagnostics, comprehensive malformed-input/fault grids, Windows semantics and all other required environments remain pending.
- The exact initial platform policy rejects the local macOS 26.5.1 for mutation. It is development-only under the approved contract; the passing acceptance evidence comes from the approved hosted Mac.
- Phase 1 still needs all remaining serial repair plans, independent verification, real-TTY/agent-host observations, judgment acknowledgements and security audit.

## Required next decision

Approve the verified POSIX tracer to continue with Plan 01-10 Task 2 (Windows handle-relative parity), or report an issue with this slice. This checkpoint is required by the `gsd-execute-phase` tracer workflow. It does not request more configuration or repeat the already-granted native design approval.
