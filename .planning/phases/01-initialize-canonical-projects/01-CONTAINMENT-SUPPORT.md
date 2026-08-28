# Containment support contract — proposed

Status: pending explicit human decisions in 01-09. This file authorizes no implementation, dependency, engine change, runner purchase, or publication.

## Safety boundary requiring approval

The proposed provider prevents its own path resolution from following substituted symbolic links, junctions, or reparse points. Every operation after root acquisition uses opaque handles and single names. Existing targets are replaced with a newly written sibling; they are never truncated in place.

An open directory handle identifies an object, not its current location. A peer may move the root or any opened descendant elsewhere; operations can still affect that original object. Portable rename/unlink also do not atomically compare the destination's last observed hash or identity before replacement/deletion. Observable drift must stop the operation, but a noncooperating peer can mutate an ordinary entry after its last check.

**Approval must explicitly choose:** accept this object-authority boundary together with a trusted root/operational namespace and cooperative mutation assumptions, or stop for a separately enforced namespace boundary. No test may turn the stronger historical claim into a passing weaker claim without that decision. APFS/NTFS/ext4 detection cannot prove the absence of cloud-sync software or another mutator.

D-18 remains conservative: only positively identified evidence may be removed; ambiguity retains evidence and blocks new writes. D-19 remains process interruption, injected exceptions, and observed killed-process recovery. Physical power loss, arbitrary agent shell actions, and every filesystem are not covered.

## Proposed required target rows

All eight rows are obligations under the broad-support proposal. None is supported yet, and an unavailable runner is a blocker rather than permission to remove a row.

| ID | OS / CPU / libc | Filesystem proposal | Exact execution inputs required at 01-09 |
|---|---|---|---|
| ENV-MA | macOS arm64 | local APFS | OS version/image, native runner, Node patches, compiler/SDK |
| ENV-MX | macOS x64 | local APFS | OS version/image, native runner, Node patches, compiler/SDK |
| ENV-WX | Windows x64 | local NTFS | Windows version/image, native runner, Node patches, compiler/SDK |
| ENV-WA | Windows arm64 | local NTFS | Windows version/image, native runner, Node patches, compiler/SDK |
| ENV-LGX | Linux x64 glibc | local ext4 | kernel, distribution/image digest, glibc, native runner, Node patches, compiler |
| ENV-LGA | Linux arm64 glibc | local ext4 | kernel, distribution/image digest, glibc, native runner, Node patches, compiler |
| ENV-LMX | Linux x64 musl | local ext4 | kernel, distribution/image digest, musl, Node distribution/build provenance, native runner, Node patches, compiler |
| ENV-LMA | Linux arm64 musl | local ext4 | kernel, distribution/image digest, musl, Node distribution/build provenance, native runner, Node patches, compiler |

The research's OS/libc minimums are proposal inputs, not automatically approved compatibility claims. Each tested row represents exact versions. Claims over a version range require boundary and representative-version evidence, not one newer runner. Emulation does not count as native CPU evidence.

## Decisions that must be recorded before implementation

1. Accept the safety boundary above or halt for an external enforcement design.
2. Approve exact platform rows, minimum versions, tested versions, filesystem policy, and native runner availability. WSL2, network shares, removable filesystems, FUSE and cloud-sync directories require an explicit policy; initial rejection is only a proposal, not approved scope reduction. An unsupported filesystem can be diagnosed read-only where identifiable; trusted-namespace assumptions cannot be inferred from filesystem type.
3. Preserve the declared Node >=20 engine unless a compatibility change is explicitly approved. Select exact Node compatibility lanes and a maintained LTS lane, name the oldest actually tested version, label Node 20's upstream EOL status, and define untested/future-major behavior. Node-API ABI stability is not evidence for every Node version or ordinary dependency.
4. Approve direct C Node-API, pinned maintainer toolchains, and same-package prebuilts. End users need Node/npm only; no compiler, headers, source-build lifecycle, or provider download. New packages require their own legitimacy gate.
5. Approve evidence Mode B: a separately installed instrumented package plus same-source/toolchain equivalence evidence and uninstrumented release E2E. Deterministic instrumented results are not direct proof of the literal release binary. If literal-binary deterministic evidence is required, select feasible Mode A external tracing per row or halt.
6. Approve required runner access and artifact retention/provenance scope. No paid resource, purchase, credential creation, CI dispatch, signing identity, or publishing is implied. Keep package private.

## Approval record

Pending. Record the exact user response, date, accepted boundary, each target tuple/version, Node policy, evidence mode, tool infrastructure authorizations, decisions declined, and unresolved blockers. A generic previous tracer approval does not satisfy this record.

### Limited infrastructure approval — 2026-08-28

The user replied `i approve` after clarification that the pending request was permission to inspect GitHub testing environments, not to simplify the plan or begin native implementation. This approves a metadata-only preflight workflow on a temporary `codex/` branch using free standard GitHub-hosted runners. It permits collecting OS/CPU/filesystem, installed Node, compiler/SDK and preinstalled musl availability information, and preserving inspection evidence.

Scope exclusions remain explicit: no application-source changes or checkout, package/tool installation, native compilation, new credentials, secrets output, paid resources, publishing, or approval of the native safety contract. The workflow receives no repository-token permissions and runs no external actions. It is based on the remote default branch so unrelated local work is not uploaded. The plan order and all eight platform obligations remain unchanged.

Inspection status: **blocked before dispatch**. The prepared workflow passed YAML round-trip, Bash syntax and static scope checks. Its upload through `POST /repos/ishk-sftckz/exspecso/git/trees` returned HTTP 404. Read-only inspection confirmed repository push/admin access and the `repo` OAuth scope, but no `workflow` scope. GitHub requires `workflow` to add workflow files; the 404 response itself did not identify its cause. No temporary branch or workflow run exists. Do not try another credential or route around this permission boundary.

The exact prepared workflow is saved as `01-CONTAINMENT-PREFLIGHT.yml` in this phase directory (not installed under `.github/workflows`). Sanitized observations and its SHA-256 are in `01-CONTAINMENT-PREFLIGHT.json`. The only requested authentication change is the user's interactive `gh auth refresh --hostname github.com --scopes workflow`, after which scopes and remote state must be rechecked before retrying. No token or credential is saved in these artifacts.

Missing musl environments will be reported, not installed or treated as passing. No actual runner, build or application-test results were obtained. Plan 01-09 remains incomplete and 01-10 remains blocked pending the complete contract decision. This limited inspection approval does not approve later native implementation, platform exclusions, a Node engine change, a weaker safety boundary or paid infrastructure.

## Recommended decision defaults, to resolve before approval

Propose all eight ENV rows, with native OS evidence on local APFS/NTFS/ext4. Start the OS-floor proposal from the researched Node support baselines: macOS 13.5, Windows 10/Server 2016, Linux kernel 4.18 and glibc 2.28. These are upstream compatibility inputs, not Exspecso support results; Windows editions must also receive an explicit upstream security-lifecycle disposition. Musl needs a named distribution, libc version and Node build provenance. Prefer maintained host OS and Node LTS versions for recommended use, retaining older approved floors only as labeled compatibility lanes.

The installed prompt dependency 8.6.0 declares Node `>=23.5.0 || ^22.13.0 || ^20.17.0`; the current Exspecso `>=20` claim is broader. Propose a tested Node 20.17 floor plus observed 20.19.5 compatibility lane, a Node 22.13 floor plus current maintained 22 patch, and a current maintained 24 patch; additionally test the current 26 release before claiming it. These are proposed lanes, not evidence or an automatic engine change. The read-only 01-09 preflight must check whether each native architecture actually has these Node build, then present an exact dependency-compatible range and untested-major policy. An unavailable Node/architecture tuple requires explicit disposition, not removal by the executor.

01-09 resolves exact runner labels/image IDs or digests, toolchain/SDK/header versions, Node patches, libc and filesystem observations into a proposed ledger before asking the user to approve. Do not ask the user to invent these technical details. Resolve current releases from official sources; do not infer old support from a latest-only runner. Lack of runner access remains a blocker. Recommended evidence mode is B, explicitly labeled: instrumented installed test package, build-equivalence evidence, and uninstrumented release-package E2E. Literal-release deterministic syscall evidence is a separate Mode A requirement if selected.
