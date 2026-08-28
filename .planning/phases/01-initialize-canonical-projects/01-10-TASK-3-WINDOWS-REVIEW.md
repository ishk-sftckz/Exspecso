---
phase: 01-initialize-canonical-projects
plan: 10
task: 3
review_outcome: pass
prior_verdict: revise
ci_run: 33149316926
snapshot: 0af7365726d0a43ba8fb4d9a2b27a8dda46e37a9
---

# Task 3 Windows review — PASS after required revisions

## Reviewed contract

The test variant exposes only a native-owned Windows named-pipe barrier at `replace:before`. Activation is disabled when all fixed tuple variables are absent and rejected before replacement when any supplied field is partial or malformed. The operation is exact, the channel is lower-case 64-hex, and controller PID is canonical nonzero DWORD decimal. The addon, not the controller, derives the sole endpoint.

The native endpoint is one-instance, duplex, overlapped, message-mode, remote-client rejecting, and protected by an explicit DACL for SYSTEM plus the current token user and logon SID. It verifies the connected client PID, generates the nonce through BCrypt, emits only the bounded exact event, requires the exact nonce acknowledgement, and uses one monotonic ten-second deadline across connect/event/ACK. Cancellation drains pending completion before the overlapped storage dies. The controller retries only expected pipe-not-found/busy states until child exit/deadline and validates event keys, child PID, nonce, provider realpath/hash, and manifest before attacking.

Release behavior is unchanged: the release provider has no activation names, endpoint/protocol strings, or BCrypt linkage. The conditional Windows libraries appear only in test builds.

## Evidence result

Run [33149316926](https://github.com/ishk-sftckz/exspecso/actions/runs/33149316926), snapshot `0af7365726d0a43ba8fb4d9a2b27a8dda46e37a9`, passed Windows provider **11/11** and active installed tracer **12/12**. The release provider SHA-256 was `1a705cc5fceb099aa7964329359abbfa6188535fdd2565af4d1d6f4f61ec01c4` (183296 bytes); the release import inventory is `node.exe`, `KERNEL32.dll`. Downloaded reports, environment/SDK record, and release/test provenance are retained under `01-10-EVIDENCE/task-3-in-progress/33149316926/windows-artifact/`.

The final test assertions meet the required oracle wording:

- Leaf: barrier and provider provenance reached; final no-follow reopen rejects the swap and CLI exits nonzero.
- Parent/ancestor: only `EPERM` at `directory-rename` may be treated as blocked. The reports record `attackOutcome: blocked-before-relocation`, `relocationPerformed: false`, and `movedObjectOracle: not exercised`.
- Blocked cases assert original source remains a non-reparse directory, moved root is absent, external sentinel/inventory remain unchanged, replacement root is absent or unchanged, canonical target has original promoted bytes, and CLI exits zero.

## Remaining distinction

Blocked Windows relocation is an observed safety result but cannot prove behavior of a moved directory object. NP-02 remains the independent moved-object evidence. No `limitation: true` label is used for these blocked cases, and the release E2E is not counted as Mode B proof. Plan 17 remains responsible for the broader matrix and closure evidence.

## Verdict

**PASS.** The prior **REVISE** requirements are implemented and verified; no test, contract, or evidence category was weakened.
