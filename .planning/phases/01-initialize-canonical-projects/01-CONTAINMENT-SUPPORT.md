# Containment support contract — approved 2026-08-28

Status: approved by the user on 2026-08-28, after presentation of the resolved proposal recorded in commit `59d99e9`. The approval record below is authoritative. Earlier proposal/inspection paragraphs preserve history; no implementation or support test is implied by approval.

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

### Resolved contract approval — 2026-08-28

**Exact user response:** `approve`.

The response directly followed the question “Do you approve this proposal, including those limits, so I can begin?” and a link to the complete proposal in commit `59d99e9`. This is a new full-contract approval, distinct from the earlier metadata-only `i approve` and authorization `done`.

Accepted: the complete “Resolved proposal for the next human decision — 2026-08-28” below, including all eight exact modern platform rows and three adapters; the nine named Node lanes and `^20.19.0 || ^22.13.0 || ^24.0.0 || ^26.0.0` engine correction; C Node-API 8, selected compiler/SDK/header pins and same-package prebuilts; the trusted-namespace/cooperative-writer object-authority boundary (including relocation and non-atomic entry comparison limits); Mode B evidence and all 42 test families; journal schema-2/legacy recovery compatibility; and the bounded edits, downloads, disposable builds and free CI authorization.

Not included: the older OS-floor research defaults, other filesystems or unverified tuples, arbitrary hostile concurrent mutation protection, literal-release deterministic proof, physical power-loss guarantees, new npm dependencies, paid resources, new credentials, global installations, signing or publication. No request for those alternatives was made. Existing tracer, feasibility, independent verification and human/security gates remain mandatory.

**01-09 decision gate: satisfied.** Plan 01-10 may begin. Build/load feasibility, actual musl execution, Windows patch observations, native matrix tests, all later repairs and Phase 1 closure remain unverified. No further configuration is required merely to begin the authorized work.

### Limited infrastructure approval — 2026-08-28

The user replied `i approve` after clarification that the pending request was permission to inspect GitHub testing environments, not to simplify the plan or begin native implementation. This approves a metadata-only preflight workflow on a temporary `codex/` branch using free standard GitHub-hosted runners. It permits collecting OS/CPU/filesystem, installed Node, compiler/SDK and preinstalled musl availability information, and preserving inspection evidence.

Scope exclusions remain explicit: no application-source changes or checkout, package/tool installation, native compilation, new credentials, secrets output, paid resources, publishing, or approval of the native safety contract. The workflow receives no repository-token permissions and runs no external actions. It is based on the remote default branch so unrelated local work is not uploaded. The plan order and all eight platform obligations remain unchanged.

Initial inspection attempt was **blocked before dispatch**. The prepared workflow passed YAML round-trip, Bash syntax and static scope checks. Its upload through `POST /repos/ishk-sftckz/exspecso/git/trees` returned HTTP 404. Read-only inspection confirmed repository push/admin access and the `repo` OAuth scope, but no `workflow` scope. No temporary branch or workflow run existed at that point. The user subsequently replied `done` after the requested interactive scope refresh; a fresh header check confirmed `workflow` was present before retrying with the same prepared workflow. No alternate credential or permission bypass was used.

The exact workflow is saved as `01-CONTAINMENT-PREFLIGHT.yml` in this phase directory (not installed under `.github/workflows` on the local/default branch). Sanitized observations, the initial failure history, workflow SHA-256, run/commit/job identities and evidence limits are in `01-CONTAINMENT-PREFLIGHT.json`; actual metadata output is preserved in `01-CONTAINMENT-PREFLIGHT-LOGS/`. No token or credential is saved in these artifacts.

Inspection status: **six metadata jobs completed; support verification remains pending**. The successful [GitHub run 33141513892](https://github.com/ishk-sftckz/exspecso/actions/runs/33141513892) executed workflow commit `cb3654dc7cc30c1407e2f3c67bc4ef2babff4535` on the temporary branch. Its sole change from remote `main` was the workflow file. No application checkout, installation, compilation, application test, race/recovery test or adapter invocation ran. No native implementation or support claim follows from a successful inventory job. After saving the evidence and verifying the remote workflow hash, the temporary branch was deleted; remote `main` remained at `571a1905a1345b9792acf137b5dc4f6b5454bc15`. The run and its job logs remain linked in the evidence record.

### Observed inventory — 2026-08-28

These are observed execution inputs, not approved platform minimums or immutable image pins. A listed default Node process ran only a metadata expression; other cached versions were merely listed.

| Required row | Runner label | Observed OS / filesystem | Image version | Default Node |
|---|---|---|---|---|
| ENV-MA | `macos-15` | macOS 15.7.7 (24G720), arm64, APFS | `20260727.0256.1` | 22.23.1 arm64 |
| ENV-MX | `macos-15-intel` | macOS 15.7.9 (24G830), x64, APFS | `20260824.0482.1` | 22.23.2 x64 |
| ENV-WX | `windows-2025` | Windows Server 2025 Datacenter, base build 26100, x64, NTFS | `20260818.207.1` (`win25-vs2026`) | 22.23.2 x64 |
| ENV-WA | `windows-11-arm` | Windows 11 Enterprise, base build 26200, arm64, NTFS | `20260823.149.1` | 24.19.0 arm64 |
| ENV-LGX | `ubuntu-24.04` | Ubuntu 24.04.4, kernel 6.17.0-1022-azure, glibc 2.39, x64, ext4 | `20260823.283.1` | 22.23.2 x64 |
| ENV-LGA | `ubuntu-24.04-arm` | Ubuntu 24.04.4, kernel 6.17.0-1022-azure, glibc 2.39, arm64, ext4 | `20260823.101.1` | 22.23.2 arm64 |
| ENV-LMX | No musl environment inspected | x64 Ubuntu had no musl packages or loader at either inspected standard path | Not obtained | Not obtained |
| ENV-LMA | No musl environment inspected | arm64 Ubuntu had no musl packages or loader at either inspected standard path | Not obtained | Not obtained |

Both Mac runners reported Xcode 16.4 (16F6), Apple clang 17.0.0 (`clang-1700.0.13.5`), and macOS SDK 15.5 (24F74). Both Ubuntu runners reported GCC/G++ 13.3.0 and Clang 18.1.3. Windows x64 reported Visual Studio 2026 `18.9.12112.369`, MSVC directories `14.29.30133`, `14.44.35207`, `14.51.36231`, and SDK include directory `10.0.26100.0`. Windows arm64 reported Visual Studio 2022 `17.14.37614.0`, MSVC directories `14.29.30133`, `14.44.35207`, and SDK include directories `10.0.10240.0`, `10.0.19041.0`, `10.0.22621.0`, `10.0.26100.0`. Installed directory names do not prove a usable target toolchain; no compile or header-compatibility probe ran.

The Windows x64 runner resolved to a different image/toolchain variant from the earlier published candidate. macOS CPU variants also resolved to different OS/image patches. Future builds must check and record their actual environment instead of treating a rolling label as a fixed image. Windows UBR patch revisions were not queried. The Linux package query returned exit 1 for missing package names, including musl; the independently observed Clang executable remains valid inventory evidence despite the missing unversioned `clang` package name.

At the end of the inspection, musl provenance, Node policy, platform dispositions and build pins still needed resolution. The proposed decision below now supplies these inputs; execution and human approval remain pending. Missing environments are not dropped or counted as passing. Plan 01-09 remains incomplete and 01-10 remains blocked. This limited inspection approval does not approve later native implementation, platform exclusions, a Node engine change, a weaker safety boundary or paid infrastructure.

## Earlier research defaults — superseded by the proposal below

Propose all eight ENV rows, with native OS evidence on local APFS/NTFS/ext4. Start the OS-floor proposal from the researched Node support baselines: macOS 13.5, Windows 10/Server 2016, Linux kernel 4.18 and glibc 2.28. These are upstream compatibility inputs, not Exspecso support results; Windows editions must also receive an explicit upstream security-lifecycle disposition. Musl needs a named distribution, libc version and Node build provenance. Prefer maintained host OS and Node LTS versions for recommended use, retaining older approved floors only as labeled compatibility lanes.

The installed prompt dependency 8.6.0 declares Node `>=23.5.0 || ^22.13.0 || ^20.17.0`; the current Exspecso `>=20` claim is broader. Propose a tested Node 20.17 floor plus observed 20.19.5 compatibility lane, a Node 22.13 floor plus current maintained 22 patch, and a current maintained 24 patch; additionally test the current 26 release before claiming it. These are proposed lanes, not evidence or an automatic engine change. The read-only 01-09 preflight must check whether each native architecture actually has these Node build, then present an exact dependency-compatible range and untested-major policy. An unavailable Node/architecture tuple requires explicit disposition, not removal by the executor.

01-09 resolves exact runner labels/image IDs or digests, toolchain/SDK/header versions, Node patches, libc and filesystem observations into a proposed ledger before asking the user to approve. Do not ask the user to invent these technical details. Resolve current releases from official sources; do not infer old support from a latest-only runner. Lack of runner access remains a blocker. Recommended evidence mode is B, explicitly labeled: instrumented installed test package, build-equivalence evidence, and uninstrumented release-package E2E. Literal-release deterministic syscall evidence is a separate Mode A requirement if selected.


## Resolved proposal for the next human decision — 2026-08-28

**PROPOSED, NOT APPROVED.** This section replaces the earlier recommendation defaults; it does not rewrite the inspection evidence. The user asked what to do next. No new approval has been received. Public registry manifests, package indexes and published checksums were read while preparing this proposal; no container was pulled or executed, and no tool, dependency or native component was installed or built.

### What approval would mean

Authorize the bounded native repair in serial plans 01-10–18, subject to their existing tracer, review, test and security gates. Preserve all eight OS/CPU/libc rows and the Claude Code, Codex and OpenCode adapters. Approve the safety assumption that the root, ancestor directories and operational namespace are trusted and that other processes cooperate by not moving directories or editing the same entries during initialization/recovery. Handle-relative access and observed-drift checks must still be implemented and tested; this assumption does not excuse an observed unsafe operation. This is not a sandbox against arbitrary agent shell commands or a hostile same-user process.

Approval also authorizes the explicitly proposed compatibility boundaries below. Earlier macOS 13.5, Windows 10/Server 2016, kernel 4.18 and glibc 2.28 research baselines are **not included in the initial verified support claim**: the available newer runners cannot prove those floors. Keeping those older floors as release obligations instead requires additional native environments before implementation approval is complete. This is a visible scope decision, not an executor's implicit exclusion.

### Initial platform acceptance set

Use the six observed native runners and versions in the inventory above. The two musl rows use the matching native Ubuntu x64/arm64 hosts, not CPU emulation. Their exact target userland is Alpine 3.24 with musl `1.2.6-r2`, GCC runtime libraries `15.2.0-r5`, on the host's observed Linux kernel and an ext4 bind-mounted fixture directory. Container overlay storage does not count as ext4 evidence.

The proposed acceptance set is macOS 15.7.7 arm64 / 15.7.9 x64 on APFS; Windows Server 2025 base build 26100 x64 / Windows 11 base build 26200 arm64 on NTFS; Ubuntu 24.04.4 with kernel 6.17.0-1022-azure and glibc 2.39 on ext4 for both CPUs; and the two Alpine targets just defined. Full Windows patch revisions must be recorded at execution. The inventory does not supply a UBR value and this proposal does not invent one.

These are initial exact acceptance environments, not evidence for every older/newer OS patch, Windows edition or Linux distribution. A future support-range claim needs additional boundary/representative evidence and explicit disposition. The currently installed local macOS 26.5.1 may be used for development, but cannot substitute for an approved row or acquire a support claim without the matrix. The first supported release must document tested versions separately from compatibility assumptions. An unvalidated OS/libc/filesystem tuple fails before project mutation; inspection may still report what is missing. Missing required rows block closure.

Initial filesystem support is local APFS/NTFS/ext4 only. Reject identifiable WSL2, network shares, FUSE and other filesystem types before writes. Removable and cloud-synchronized directories are outside the approved operational assumption even if they report one of those filesystems; reliably detecting every such directory is not claimed. Users must select an ordinary local directory and pause any software that changes the same entries.

GitHub runner labels are rolling, not immutable images. At execution, record and compare actual OS, kernel, image, CPU, filesystem and tools against the approved inputs. Drift stops that row for a documented pin update; never silently treat a replacement runner as the inspected one. The completed preflight proves runner scheduling access, not future availability, compiler usability or container execution. No native musl container has run yet; inability to pull or run a pinned image blocks its row.

### Node policy and distribution

Propose replacing `engines.node: >=20` with `^20.19.0 || ^22.13.0 || ^24.0.0 || ^26.0.0`. This explicitly raises the Node 20 floor to align the installed Vite test dependency, and excludes odd/future majors until verified. It does not happen merely because this document exists. Node 20 is compatibility-only because it is upstream EOL; recommend maintained Node 24 LTS, currently 24.20.0. Node 22 is a maintained compatibility lane; Node 26 is a Current lane, not the default recommendation. Sources: [Node release index](https://nodejs.org/dist/index.json), [release status](https://nodejs.org/en/about/previous-releases); ordinary dependency engine requirements were read from the installed packages.

All eight rows require these exact Node test lanes: **20.19.0, 20.19.5, 20.20.2, 22.13.0, 22.23.2, 24.0.0, 24.20.0, 26.0.0, 26.8.1**. These are floor, observed and current representative tests; they do not prove every intervening patch. Compatibility within the declared ranges is an explicit inference backed by those tests, dependency constraints and Node-API stability, not a claim that every patch ran. Unknown/future majors and versions below the floors must be rejected before writes. Ordinary npm dependencies remain lockfile-pinned and require their existing tests.

Mac, Windows and glibc Linux lanes use the corresponding native architecture distributions from `https://nodejs.org/dist/vVERSION/`, verified against their published SHASUMS256.txt before execution. No emulated lane may replace native CPU evidence. Musl Node executables come from the immutable Docker Official Image manifests listed below, maintained by the Node Docker team. For each lane, copy only its `/usr/local/bin/node` into the fixed Alpine 3.24 test userland, retaining the source image digest and executable SHA-256. Do not run older image userlands as if they were the Alpine 3.24 target. Verify dynamic dependencies, architecture, Node version and actual libc before testing; an incompatible executable is a blocker, not permission to replace a lane.

Docker Official Image provenance is not identical to an upstream nodejs.org binary. The inspected Node 22/24 Alpine Dockerfiles use the unofficial-builds service for x64 musl and signed upstream source builds for arm64. The approved provenance boundary is the named official image maintainer plus its immutable image contents; a fully reproducible or independently attested historical Node build is **not** asserted. Pin and inspect each lane's manifest/config history before using its executable, and retain its hash. Sources: [official Node image catalog](https://github.com/docker-library/official-images/blob/master/library/node), [Node Docker image source](https://github.com/nodejs/docker-node), [Node 24 Dockerfile at inspected commit](https://github.com/nodejs/docker-node/blob/c4eb0858f5c522521768d5b6dc1d9f1631d4854d/24/alpine3.24/Dockerfile).

### Native build pins and packaging

Preserve plan 01-10's **direct C Node-API version 8**, implemented in the planned C++ source files; no node-addon-api or node-gyp dependency. Product decisions and canonical state remain in TypeScript. The native component supplies only the filesystem primitives. End users install one npm package containing all eight release binaries; they need Node/npm, not compilers, headers, Docker or a separate provider download. Preserve `private: true`; publication is not authorized.

| Build target | Selected maintainer compiler / SDK |
|---|---|
| macOS x64 and arm64 | Xcode 16.4 (16F6), Apple clang 17.0.0 `clang-1700.0.13.5`, SDK 15.5 (24F74), native CPU; deployment target cannot claim earlier than its tested OS |
| Windows x64 | Observed VS 2026 18.9.12112.369, explicitly select installed MSVC 14.44.35207, SDK 10.0.26100.0, x64 target |
| Windows arm64 | Observed VS 2022 17.14.37614.0, explicitly select installed MSVC 14.44.35207, SDK 10.0.26100.0, arm64 target |
| glibc x64 and arm64 | GCC/G++ 13.3.0, package 13.3.0-6ubuntu2~24.04.1, glibc 2.39 package 2.39-0ubuntu8.8; native Ubuntu hosts |
| musl x64 and arm64 | Fixed Node 24.20.0 Alpine 3.24 base image per architecture below; pin gcc/g++/libgcc/libstdc++ 15.2.0-r5, musl/musl-dev 1.2.6-r2 and linux-headers 7.0.0-r1 from Alpine v3.24 main |

Use official **Node 20.19.0 headers** for all native builds, with `NAPI_VERSION=8`, SHA-256 `800194e32cef4ee77f5a2e8c0e5dd2b4acb38b39ef2ea544929c181b949494bb`. Windows uses the matching official import libraries: x64 `72f7ca3b33f0991e93e25521f7e78c8adf187df7d5223bf0efcb5e005420f327`; arm64 `a9d9a73785f8d95b98eed317c07ca34d4b2d59a45b425bab8b942795ab9236f1`. Source: [Node 20.19.0 checksums](https://nodejs.org/dist/v20.19.0/SHASUMS256.txt). The read-only proposal fetched checksum text, not the header archives or libraries. Verify downloaded contents before use; never substitute the local Node 25 headers. Direct compiler invocation is the build route; make/Python are not required by this addon proposal.

Compiler presence and a header pin are not build feasibility results. Check Windows target tools, SDK declarations, link dependencies and every native load in plans 01-10/11. Never change compiler/header/API targets silently to obtain a pass. Runtime library dependencies must be audited and work in each test userland. Record compiler flags, input hashes, source commit, binary hashes and build logs. No install/preinstall/postinstall compilation or network fallback is allowed.

### Exact infrastructure authorization requested

Permit bounded source edits, lockfile-preserving `npm ci`, compilation, tests, native artifact assembly and `npm pack` inside this repository and disposable test directories. Permit downloads of the pinned Node distributions/headers/import libraries, registry-locked npm dependencies, the named Docker images and pinned Alpine packages for maintainer builds/tests only. No new npm dependency is included.

Permit native CI builds and all required matrix tests on the six free standard GitHub-hosted runner labels already inspected, including musl containers on the two Ubuntu hosts. Use a temporary `codex/` branch or the existing review branch, minimum job permissions, bounded timeouts/concurrency, and SHA-pinned actions when an action is necessary. Approval permits uploading this task's implementation and workflows for testing, not unrelated local work or a push to the default branch. Preserve test/build provenance and logs in the repository or standard CI artifacts; download evidence before remote retention expires.

No paid/larger runner, purchase, new credential, secret, signing identity, publication, global software install, Docker installation on the user's Mac, or unrelated external service is authorized. If those become necessary, stop and explain the specific need. Temporary runner-local tools and images may be fetched within the named scope. The user has no additional configuration step before deciding on this proposal.

### Evidence and recovery compatibility

Approve **Mode B**: deterministic race/fault tests against a separately installed instrumented package, same-source/toolchain build-equivalence evidence, and E2E tests against the uninstrumented release package. Instrumented results are not direct deterministic proof of the literal release binary. Preserve all 42 test families, their expanded cases and every approved environment/Node lane; skipped or unavailable required evidence remains a blocker. Do not count this proposal, successful metadata inspection, or image availability as application verification.

Approve a new operational journal schema version 2 with explicit prepared/promoting/restoring/cleaning states, per-entry prior/staged hashes and an in-flight step recorded before replacement. Keep schema-1 recovery only where complete validated evidence proves the prior state; otherwise preserve the journal and bytes, report the ambiguity and block new writes. No destructive automatic migration or rewrite of canonical project/config/roadmap artifacts is authorized. Old executables must not be used to resume schema-2 transactions. Recovery covers process interruption/injected exceptions/killed processes, not physical power-loss durability. These details remain subject to the existing plan 01-14 tests.

### Immutable musl input ledger

Manifest availability was checked read-only on 2026-08-28 against Docker Hub's `library/node` registry. Each row below is a native-platform manifest digest, not merely a mutable tag. Both architectures were present for every required Node lane. No execution or binary equivalence has been verified. The 24.20.0 entries are also the fixed Alpine 3.24 base images for addon builds and all test userlands; install the exact runtime/package pins above before copying the selected lane's Node executable.

| Source image tag | linux/amd64 manifest | linux/arm64/v8 manifest |
|---|---|---|
| `node:20.19.0-alpine3.21` | `sha256:37a5a350292926f98d48de9af160b0a3f7fcb141566117ee452742739500a5bd` | `sha256:646bc11400802534d70bc576fc9704bb6409e0ed802658a8e785472d160c38d3` |
| `node:20.19.5-alpine3.22` | `sha256:be8d32d651b3e0c9c2b28fdc1d3888408125d703232013cff955344d052027e5` | `sha256:9851daa67a46cd267436aae71dedba1d86e6498a1b01e6c417941e31c8021b6e` |
| `node:20.20.2-alpine3.23` | `sha256:afdf98210b07b586eb71fa22ba2e432e058e4cd1304d31ed60888755b8c865fb` | `sha256:d63c387675b0ec5d7ef0c15b03691ac9f82803a8b30c87de3ce8a16960831cbc` |
| `node:22.13.0-alpine3.21` | `sha256:133cdce957f50f47236d6d926592fb1db7a120ac3c33191e611b60dfab63e324` | `sha256:9090fa64b73b14ab658d907e7916afcb1633e4bdd5134f9b1be4a21a6c56f0b8` |
| `node:22.23.2-alpine3.24` | `sha256:76789712cd1ae89a1225eac9077010d68987a423588042dac30446f502f1858c` | `sha256:1ef15d33d74602021f35ec64a4e72f4a21e2cfa68ebecd125fbe0c44af8f604a` |
| `node:24.0.0-alpine3.21` | `sha256:daf9b7ead63a07bcad1de673b38566b0ba7e3b8abd12b2458486acabe598f1b7` | `sha256:c68c0a01cf0674640b9b3524d50da2af10112770ce4ce69804da60de59ffd1d2` |
| `node:24.20.0-alpine3.24` | `sha256:4caaaf42195bcd6f6f3559a413b20cb8f8ad089e231ee874cf7701643966689f` | `sha256:d3724e44ee368606d753e0027eb8d2a94fc1f275e5d9e4620178a12edb655f5f` |
| `node:26.0.0-alpine3.23` | `sha256:eb2ff22e292cafc20a333e889d8993cfb1604d1fe545f13fa86ff1a45534d1d7` | `sha256:f93b4c5d322011f11d14ab9749b206a036d3a61c00b7f9355063d5362c062a08` |
| `node:26.8.1-alpine3.24` | `sha256:ad6400dee476b06e82d0ee3a088e2d7555f6e6569c346e61d69e14d0f19e8c2b` | `sha256:0d642590166d10420a0efa32b0db56987aef75eeca82742305b4ac4cfd0210e0` |

Alpine package-index observations (metadata only):

- `v3.24/main/x86_64/APKINDEX.tar.gz`: SHA-256 `33971e63c06dac7ab71e96e6fc88eec8edc44f465881e123c4893f1345b2360b`.
- `v3.24/main/aarch64/APKINDEX.tar.gz`: SHA-256 `4a2aca48eef922e87c1c5f8ef2057572644c520b1782380395e1db010975df38`.

The selected GCC package source commit is `423a8ad043d07f2c7546c8ec3e2b0384cda360ae`; musl is `f5640d3a10f664c9119720c60515265d3d6f6d01`; linux-headers is `4568bf119fd5a67f5d895a2a68a1dcf8b7bfa606`. APKINDEX hashes identify the indexes inspected, not signatures or downloaded package hashes. At authorized setup, use Alpine's package signature verification, enforce exact versions, retain resolved dependency/package hashes, and refuse unavailable pins rather than substituting latest. Sources: [Alpine x64 index](https://dl-cdn.alpinelinux.org/alpine/v3.24/main/x86_64/APKINDEX.tar.gz), [Alpine arm64 index](https://dl-cdn.alpinelinux.org/alpine/v3.24/main/aarch64/APKINDEX.tar.gz).

### Decision status

**Approved on 2026-08-28 by the subsequent exact response `approve`; see the authoritative approval record above.** The earlier `i approve` and `done` remain metadata-only history. Plan 01-09 closes the decision task only. Any change to the approved boundary or environment/Node/toolchain scope still requires its own explicit disposition; native test evidence and Phase 1 completion are not established by this approval.
