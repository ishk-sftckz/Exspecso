---
phase: 01-initialize-canonical-projects
plan: 10
task: 3
status: blocked
blocker: windows-mode-b-native-boundary-observation
ci_run: 33147542007
snapshot: efca644df1a38ca601a1e80cab1fbd07e0da0d9a
---

# Task 3 Windows Mode B evidence blocker

## Decision

Stop Task 3 without another Windows transport experiment. The approved cross-platform proof requires a real installed Mode B boundary observation on Windows. That observation was not obtained, so the plan remains 2/3 complete.

## Exact result

The final authorized snapshot was `efca644df1a38ca601a1e80cab1fbd07e0da0d9a`, tested by [CI run 33147542007](https://github.com/ishk-sftckz/exspecso/actions/runs/33147542007) on the approved hosted macOS and Windows environments.

- macOS: installed tracer 21/21 passed; full regression 94/94 passed; historical vulnerable CLI leaf/parent/ancestor each made the external write (three intended RED failures, eight filtered tests).
- Windows: provider parity 11/11 passed; historical vulnerable CLI leaf/parent/ancestor each made the external write (three intended RED failures, eight filtered tests); uninstrumented release TR-02 ran leaf/parent/ancestor with the actual installed provider `contained-fs.node` SHA-256 `72b186cc3291de679eed6e27cd14e85cc8b5d2b2f1e61ec91cf76edfaf7a94cd`.
- Windows Mode B: tracer 8/11 passed and the required leaf, parent, and ancestor boundary tests failed. Each produced `EXSPECSO_INIT_WRITE_FAILED: EXSPECSO_CONTAINMENT_INVALID: test barrier timeout` after the native provider entered the barrier. The parent received no barrier event, so it could not issue the acknowledgement. The failure is an evidence-transport failure, not an expected vulnerability RED or a provider-safety pass.

## Tested transport contract

The test-only Windows seam used unpredictable per-process duplex named-pipe sockets passed to the child at fixed descriptors 3 and 4. The native addon reads the exact descriptor handles from Node/libuv's `STARTUPINFO.lpReserved2` CRT table, writes the `replace:before` event after validation and before replacement, then requires one acknowledgement byte within ten seconds. It includes child PID and dynamic DLL module path in the event. The release build omits this seam.

This was the final experiment after previous Node `pipe` descriptor and direct CRT-table variants also failed to deliver an observable event. The source snapshot lists every compiled input; its Windows native source hash is `f6a1aa180d0e226713192aaa5026c4ed00b99fd29836d69736dcb9971d580b7b`.

## Evidence retained

`01-10-EVIDENCE/task-3-in-progress/33147542007/` contains `run.json`, the exact source snapshot, macOS and Windows reports, manifest/provenance, host binaries, and the raw failed log. `windows-failed.log` SHA-256 is `4e547b650d2fb40b3ae732d81b89f744069d21960b282f4ba5f4a31bb6683e72`.

## Replanning boundary

Any continuation needs an approved, independently reviewed Windows native observation method that can prove both event arrival and acknowledgement without changing the production containment state machine or treating a release-only run as an operation oracle. The existing moved-directory parent/ancestor object limitation remains explicit; no test or oracle was weakened to obtain these results.

**Next repair question:** Which hosted-Windows child-process inheritance mechanism exposes a duplex, native-usable `HANDLE` to both the Node parent and the `/MT` addon, so a test-only `replace:before` event can be observed and acknowledged without relying on undocumented CRT ownership or changing the release provider?
