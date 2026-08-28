---
phase: 01-initialize-canonical-projects
plan: 10
task: 3
status: resolved
resolved_by_ci_run: 33149316926
snapshot: 0af7365726d0a43ba8fb4d9a2b27a8dda46e37a9
---

# Resolved Task 3 Windows Mode B blocker

The prior CRT descriptor-table barrier could not establish Windows event/ACK observation. It was replaced by a test-only native-owned named-pipe server and verified in [CI run 33149316926](https://github.com/ishk-sftckz/exspecso/actions/runs/33149316926).

The final Windows shard passed provider parity **11/11** and installed tracer **12/12**. The controller saw the real `replace:before` boundary, validated fixed event fields and provider provenance, performed the permitted attack, and sent the nonce acknowledgement. The release package remained separate: its provider SHA-256 is `1a705cc5fceb099aa7964329359abbfa6188535fdd2565af4d1d6f4f61ec01c4`, it depends only on `node.exe` and `KERNEL32.dll`, and its bytes exclude test activation, endpoint, protocol, and BCrypt strings.

The leaf swap is rejected by final no-follow target revalidation. Parent and ancestor moves yield `EPERM` specifically at the directory-rename stage before relocation. That outcome is recorded as `blocked-before-relocation`, with `relocationPerformed: false` and `movedObjectOracle: not exercised`; source, external sentinel, inventory, replacement root, canonical bytes, and exit code assertions are all retained in the tracer report. It is not a claim that a moved object was exercised. NP-02 remains that distinct proof and Plan 17 remains required.

The approved named-pipe design accepts only the all-present fixed tuple (`replace:before`, 64 lower-hex channel, canonical nonzero controller PID); all absent disables it and any partial/malformed tuple fails before rename. It derives the sole endpoint itself, uses message mode, remote-client rejection, first-instance protection, a current user/logon-SID plus SYSTEM DACL, client-PID verification, BCrypt nonce generation, bounded exact frames, and one native 10-second deadline with cancelled-I/O completion draining.

Evidence is retained in `01-10-EVIDENCE/task-3-in-progress/33149316926/`. This file is retained as the historical blocker-to-resolution link; it is not an open blocker.
