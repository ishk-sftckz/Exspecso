# Phase 1 Containment Replan — Portability and Evidence Research

**Researched:** 2026-08-28  
**Status:** proposal for replanning; no provider, package, platform matrix, or engine change is approved by this document.

## Why this supplement exists

Plans 01-01 through 01-08 are completed evidence and remain intact. The pending 01-09/01-10 proposal assumed a locally compiled, macOS-first C addon. The user asked to replan for broad environment support with comprehensive tests. This research proposes Windows, macOS, and Linux support without requiring an end user to install a compiler or headers; that precise implementation and support contract remains subject to approval. This document supersedes the *proposal direction* in unexecuted 01-09/01-10; it does not rewrite history or authorize implementation.

The current implementation validates a pathname and later calls `copyFile()` on that pathname. In particular, `assertSafeTarget()` checks existing segments before the mutation [VERIFIED: `src/filesystem/safe-path.ts:38-67`], while transaction promotion separately calls `copySynced()` [VERIFIED: `src/filesystem/transaction.ts:215-220`]. A competing process can replace a leaf or ancestor after that validation. The Phase verifier records this as CR-03 and explicitly asks for a directory-bound replacement plus a deterministic post-validation symlink-swap test [VERIFIED: `.planning/phases/01-initialize-canonical-projects/01-VERIFICATION.md:55-62`].

This must continue to honor the approved boundaries:

> `D-18: After an interrupted atomic write, the next invocation may remove only clearly identified Exspecso staging debris, must confirm that the previous canonical set remains valid, and reports the recovery. Ambiguous or externally changed canonical files cause a fail-closed stop.`
>
> `D-19: Phase 1 proves ART-07 against deterministic process interruption, injected exceptions, and killed-process recovery at every declared promotion step. It does not claim physical power-loss durability or universal guarantees across APFS, NTFS, ext4, or other filesystems without separate platform evidence.`

[VERIFIED: `.planning/phases/01-initialize-canonical-projects/01-CONTEXT.md:40-41`]

## Recommendation

**Plan one native containment provider that ships prebuilt inside the same npm package, exposes a narrow opaque-handle API to TypeScript, and has separately tested POSIX and Windows implementations.** End-user installation must only need a compatible Node/npm runtime; it must not compile, download a binary after install, or contact a build service.

The provider must own only filesystem-object operations: opening a root capability, component-by-component no-follow traversal, creating temporary files, syncing supported primitives, atomic replacement, unlink/rmdir, and identity inspection. TypeScript retains artifact schemas, hashes, journal policy, recovery decisions, user messages, and runtime adapter behavior. That preserves the project’s three-layer architecture and all three agent runtimes because they call the same CLI and artifact layer.

This is deliberately **not** a claim that a directory handle proves that the directory is still located at the original lexical repository path. A directory handle continues to refer to the original filesystem object if another process renames that directory elsewhere. Directory-relative mutations prevent symlink redirection through names beneath that object, but can mutate the moved original directory. There is no portable user-space operation that atomically proves “this root object is still at this complete lexical path” and then performs the mutation. A re-check of a resolved path recreates the same race.

The resulting security contract must therefore be stated in object-capability terms:

1. At initialization, resolve and open the discovered Git root as a root object; record its platform object identity where available.
2. During a transaction, all reads, stage/backup/journal operations, promotion, restore, ownership publication/release, and cleanup are relative to handles obtained by no-follow descent from that root. No operation accepts a caller-supplied absolute path after opening the root.
3. Each path component is opened or created relative to its already-open parent while rejecting symlinks/reparse points. A final destination is never opened for truncating write; a new temporary sibling is written and atomically renamed/replaced into the already-bound parent.
4. If a required primitive, binary, object-type check, identity observation, or journal hash check fails, retain evidence and stop before a new write. “Unsupported” is a failure, never a fallback to pathname I/O.
5. The provider can guarantee that its own name resolution does not follow a substituted leaf, symlink, junction, or reparse component. It cannot guarantee that any already-open **root, parent, or descendant directory object** is still lexically descended from the original Git-root pathname: a peer can rename that opened directory object elsewhere after it is opened. It also cannot make a hostile network filesystem offer local atomicity or protect files an attacker can already modify through another hard link or sufficient OS permissions.

The fifth point is a required human decision. If the product requirement is lexical containment even after adversarial relocation of any opened root, parent, or descendant directory, this phase has no portable local-user-space implementation. It needs a trusted namespace assumption or external authority that prevents those renames (for example, permissions controlled by another principal), and must be scoped and tested separately rather than implied by an addon.

## Architectural responsibility map

| Capability | Primary tier | Secondary tier | Required boundary |
|---|---|---|---|
| Artifact and journal meaning | TypeScript deterministic helper | Canonical repository files | Native code returns object/OS errors only; it never interprets an Exspecso artifact. |
| Object-bound filesystem mutation | Native containment provider | TypeScript adapter | Opaque root/parent/file handles; no numeric handle or arbitrary absolute path crosses the JS API. |
| Init/recovery ownership protocol | TypeScript deterministic helper | Native provider | Existing UUID lease logic remains one authority; its reads/removals use provider operations. |
| CLI and all agent runtimes | Node CLI | Claude Code, Codex, OpenCode adapters | No runtime-specific filesystem behavior or artifact state. |
| Binary selection and load safety | Package loader | Native provider | Select only an included manifest entry matching runtime OS/CPU/Node-API; missing or mismatched entry fails before mutation. |
| Release evidence | CI/release workflow | npm tarball | Build, test, manifest, hash, and provenance are release inputs, not user-install behavior. |

## Mechanism comparison

| Candidate | Benefits | Material risks | Replan disposition |
|---|---|---|---|
| Direct C/C++ Node-API addon with POSIX and Windows implementations | One npm package, no end-user build, one in-process opaque API; Node-API is ABI stable when restricted to `node_api.h` [CITED: https://nodejs.org/api/n-api.html]. | Exspecso owns subtle POSIX and Windows namespace semantics and release binaries. Windows needs a real handle-relative/reparse-safe prototype; Win32 `CreateFile` alone does not supply relative-to-directory opens. | **Recommended if its platform feasibility gates pass.** Keep C code small and isolate OS code behind one provider contract. |
| Rust capability core based on `cap-std`, exposed through a Node addon or long-lived helper | `cap-std` documents an open-directory capability API and Windows/macOS/Linux support [CITED: https://docs.rs/cap-std/latest/cap_std/; https://github.com/bytecodealliance/cap-std]. It avoids re-creating much path traversal code. | Adds Rust and a dependency supply chain; a helper needs an authenticated protocol and lifetime/handle semantics. `cap-std` has had a Windows device-name sandbox advisory fixed in 3.4.1, demonstrating that its exact version and advisories must be audited [CITED: https://github.com/bytecodealliance/cap-std/security/advisories/GHSA-hxf5-99xg-86hw]. | Viable fallback **only after** package legitimacy, version/advisory audit, and a prototype proves its replacement/recovery operations have this contract. Do not treat its documentation as proof for Exspecso’s journal protocol. |
| Path checks plus Node `fs/promises` | No new binary. | Node’s normal APIs are pathname based; a check plus later `copyFile`, `rename`, `rm`, or `writeFile` is still a TOCTOU interval. Linux `O_NOFOLLOW` only covers the final component; `openat2(2)` distinguishes it from all-component `RESOLVE_NO_SYMLINKS` [CITED: https://www.man7.org/linux/man-pages/man2/openat2.2.html]. | Rejected for CR-03. Retain lexical/preimage checks as policy validation, never mutation authority. |
| Source build during npm install | Simple maintainer distribution. | Requires user compiler/headers; npm lifecycle scripts run during install and a `binding.gyp` can trigger an implicit `node-gyp rebuild` [CITED: https://docs.npmjs.com/cli/v11/using-npm/scripts/]. It contradicts the requested installation contract. | Rejected. No `binding.gyp`, `install`, `preinstall`, `postinstall`, or downloaded binary fallback. |

### Why the native provider is necessary

Node-API is an ABI-stable interface for native addons and documents precompiled binary distribution for users without a C/C++ toolchain [CITED: https://nodejs.org/api/n-api.html]. Node’s filesystem API does not expose the required directory-relative namespace operations. Linux exposes `openat2` with resolution constraints, but its history and semantics are Linux-specific [CITED: https://www.man7.org/linux/man-pages/man2/openat2.2.html]. A portable secure boundary must therefore be below Node’s pathname APIs.

## Provider contract and OS feasibility gates

### Required operations

The design should use a capability API with operations like these, rather than exporting generic filesystem functions:

```text
openRoot(discoveredGitRoot) -> RootCapability
openDirectory(parentCapability, oneName, noFollow) -> DirectoryCapability
createTempFile(parentCapability, privateName) -> FileCapability
writeAndSync(fileCapability, bytes)
replace(parentCapability, tempName, finalName)   // same filesystem object namespace
readRegularFile(parentCapability, oneName)
statNoFollow(parentCapability, oneName) -> kind, identity, linkCount
unlinkFile(parentCapability, oneName)
removeEmptyDirectory(parentCapability, oneName)
listDirectory(parentCapability)
```

Every public name must be one simple component. TypeScript decomposes a validated relative path and the provider refuses empty, `.`, `..`, separators, NUL, absolute names, Windows reserved/device forms, and reparse/symlink components. Paths are not accepted after initial root acquisition. Staged data and journal/backup files are created under the same root capability so cleanup cannot be redirected.

Atomic replacement matters: copy/truncate of an existing target can alter the content reached by a raced link and can mutate a hard-linked object. Writing a newly created temporary file then replacing the destination directory entry avoids following the final destination and does not modify another hard link’s underlying content. It still must fail safely if replacement is unavailable, crosses filesystems, or sees an unexpected target type.

### POSIX implementation gate (Linux and macOS)

Use an opened root directory descriptor. For Linux, prefer `openat2` with `RESOLVE_BENEATH | RESOLVE_NO_SYMLINKS` where available; its manual says `RESOLVE_NO_SYMLINKS` rejects symbolic links in all path components, while `O_NOFOLLOW` handles only the final component [CITED: https://www.man7.org/linux/man-pages/man2/openat2.2.html]. For macOS and Linux fallback, walk exactly one component at a time with `openat` from the already-open parent, require directory type for intermediate components, use `O_NOFOLLOW` for each open, and use `mkdirat`, `renameat`, `unlinkat`, and directory sync where supported.

**Gate P-01:** an adversarial-process test must prove leaf, parent, and higher-ancestor swaps do not change an external sentinel on each proposed POSIX filesystem. If a platform cannot implement the required no-follow walk/replacement semantics, it is not a supported containment platform.

### Windows implementation gate

Windows requires a separate implementation; pretending POSIX `openat` works through Node or shell is not support. Microsoft documents that `CreateFile` can open a directory with `FILE_FLAG_BACKUP_SEMANTICS`, and `FILE_FLAG_OPEN_REPARSE_POINT` opens an existing reparse point itself rather than its target [CITED: https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilea]. The documented `OBJECT_ATTRIBUTES` structure supports a relative object name plus a `RootDirectory` handle and has `OBJ_DONT_REPARSE` [CITED: https://learn.microsoft.com/en-us/windows/win32/api/ntdef/ns-ntdef-_object_attributes]. Microsoft’s `NtCreateFile` documentation describes this as the user-mode equivalent of `ZwCreateFile` and permits a path relative to `RootDirectory` [CITED: https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntcreatefile]. File rename information also has a `RootDirectory` field, but the protocol specification says it must be zero for network operations [CITED: https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-fscc/1d2673a8-8fb9-4868-920a-775ccaa30cf8].

**Gate W-01:** build a Windows-only proof of component walk, reparse rejection, temporary write, and handle-relative replacement against NTFS. It must use no pathname fallback. Record exact Windows API calls, sharing/delete policy, errors, and the result of tests against directory junctions and symlinks.

**Gate W-02:** obtain object identity through handles (for example `GetFileInformationByHandleEx` / `FILE_ID_INFO`) and use it as an observation, not an atomic lexical-containment proof. Microsoft states that a file identifier plus volume serial identifies a file on a single computer [CITED: https://learn.microsoft.com/en-us/windows/win32/api/fileapi/ns-fileapi-by_handle_file_information].

**Gate W-03:** prohibit network shares from the initial security-supported matrix unless a separate implementation and race evidence demonstrates their required semantics. The protocol documentation’s zero-`RootDirectory` network constraint prevents inferring local-handle guarantees on SMB.

### Root relocation, replacement, and hard links

| Situation | What a bound provider can guarantee | What it cannot truthfully claim | Required behavior/test |
|---|---|---|---|
| Leaf swapped to symlink/reparse point | Replacement in the bound parent replaces the leaf entry rather than following it. | It cannot make an unbound earlier `copyFile` safe. | External sentinel unchanged; operation commits only if the directory-bound replacement succeeds. |
| Parent or higher ancestor name replaced with a link, while the original directory remains in place | Existing opened capability resolves from the original object and cannot follow the new symbolic name. | It does not prove the original object is still lexically below the Git root. | External sentinel reached through the substituted link unchanged. |
| Any opened parent or descendant directory renamed/moved | Operations remain attached to that opened object. | The moved object can now sit outside the original repository path; a path recheck cannot close the race. | Deterministic test demonstrates the boundary. If strict lexical containment is required, this is a release-blocking feasibility failure, not an acceptable pass. |
| Root path replaced with another directory | Existing capability cannot silently switch to the replacement object. | It can still write the original object if that object or any opened descendant was relocated. | Detect identity drift when observable and report ambiguity for subsequent work; test no write enters the replacement root, while separately testing relocation of the original object. |
| Existing target is hard-linked outside root | Temp-and-replace changes this directory entry, leaving the other hard link’s content unchanged. | Reading/validating a hard link does not make it an owned object, and direct truncate/write would be unsafe. | Never direct-write existing targets; add hard-link sentinel test where supported. |
| Cross-device / exotic filesystem | Provider may get unsupported atomic replacement or identity behavior. | It cannot borrow POSIX/NTFS guarantees from another filesystem. | Fail before mutation and report unsupported filesystem; no skipped test counts as support. |

## Proposed support and evidence matrix

This matrix is a proposed release contract for human approval. “Supported” means both binary availability and the listed automated evidence for the declared local filesystem. It does **not** mean every filesystem, OS version, remote share, or power-loss case. The OS/libc proposals are anchored to the current Node `BUILDING.md` support table, which lists Linux x64/arm64 at kernel >= 4.18 and glibc >= 2.28, Windows x64 at Windows 10/Server 2016+, Windows arm64 at Windows 10+, and macOS x64/arm64 at 13.5+; it labels musl as experimental and WSL unsupported by Node upstream [CITED: https://github.com/nodejs/node/blob/main/BUILDING.md]. These are approval inputs, not an automatic Exspecso policy or evidence for a different Node release line.

| Environment | CPU | proposed OS/libc baseline | filesystem scope | Distribution | CI/evidence status required before calling supported | Proposed status |
|---|---|---|---|---|---|
| macOS | arm64 | macOS 13.5+ | local APFS | included prebuilt | packed isolated install; installed CLI; deterministic leaf/parent/ancestor/root-relocation races; all recovery points | pending approval and evidence |
| macOS | x64 | macOS 13.5+ | local APFS | included prebuilt | same as macOS arm64 on an Intel runner | pending approval and evidence |
| Windows | x64 | Windows 10/Server 2016+ | local NTFS | included prebuilt | Windows gate W-01/W-02; packed isolated install; installed CLI; junction/symlink/reparse races; all recovery points | pending approval and evidence |
| Windows | arm64 | Windows 10+ | local NTFS | included prebuilt | same as Windows x64 on native arm64 runner; emulation does not count | pending approval and evidence |
| Linux | x64 | kernel >= 4.18; glibc >= 2.28 | local ext4 | included prebuilt | glibc build and test; installed CLI; `openat2` and fallback coverage where applicable; all recovery points | pending approval and evidence |
| Linux | arm64 | kernel >= 4.18; glibc >= 2.28 | local ext4 | included prebuilt | same on native arm64 runner | pending approval and evidence |
| Linux | x64 and arm64 | kernel >= 3.10; musl >= 1.1.19 (Node experimental) | local musl filesystem (distribution named in release evidence) | separate musl prebuilts if loader ABI differs | isolated musl job and all race/recovery tests | pending explicit decision and feasibility; do not substitute glibc evidence |
| WSL2 | host Windows / guest Linux CPU | Node upstream marks WSL unsupported | guest local Linux filesystem | Linux prebuilt selected by guest Node | Linux matrix in a real WSL2 job, plus Windows host is not inferred | compatibility experiment only until separately approved/evidenced |
| Network shares, removable drives, FUSE, cloud-sync folders | any | varies | SMB/NFS/exFAT/FAT/FUSE/etc. | provider may load | No containment support claim until a per-filesystem contract and evidence exists | explicitly unsupported for secure mutation initially |

GitHub documents hosted runner labels for Linux/macOS/Windows x64 and arm64, with several arm64 options marked public preview [CITED: https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job]. Where a required stable hosted runner is unavailable, the release plan must provide a controlled self-hosted runner and publish its OS/image, filesystem, CPU, Node version, compiler, and test logs. A green job on emulation is not evidence for native arm64 support.

Each baseline is a lower compatibility proposal, not the selected test environment. Before execution, the human decision must name the exact OS image/version, Node patch version, libc/musl distribution, filesystem, and runner type used for each row; CI then records those values and rejects drift until the matrix is deliberately revised.

### Node policy decision

The current package declares `"node": ">=20"` [VERIFIED: `package.json:7-9`]. Node-API version 8 is supported by Node 20 and later, while version 9 is supported by Node 20.3.0 and later [CITED: https://nodejs.org/api/n-api.html]. A provider limited to the necessary stable Node-API version can therefore avoid per-major Node binary builds. This repository has only observed Node 20.19.5 locally during the prior planning work; that is not evidence for every `20.x` patch, for Node 20.0.0 specifically, or for future majors. The release matrix must name and test exact Node versions, then define an explicit policy for future majors (for example: reject until a release job verifies the included Node-API binary, or support only listed tested releases).

However, the Node project lists v20 as EOL on 2026-03-24 and recommends Active or Maintenance LTS releases for production [CITED: https://nodejs.org/en/about/previous-releases]. The replan must obtain a product decision before changing the package engine or calling a Node 20 lane security-supported:

| Policy choice | Consequence |
|---|---|
| Preserve `>=20` as compatibility | Build/test the explicitly selected Node 20 patch lane(s), label them EOL/compatibility-only, and do not claim untested lower patches or security support from Node upstream. |
| Raise the supported engine to a maintained LTS baseline | This is a public compatibility change that requires approval and migration messaging; do not make it implicitly in the provider work. |

Current release selection must be refreshed at release time, not frozen in this research. The current Node releases page reports v24 as LTS and v26 as Current as of this research [CITED: https://nodejs.org/en/about/previous-releases].

## Packaging, release, and supply-chain contract

1. Build every provider binary in controlled maintainer CI. The npm tarball includes the JavaScript, a checked-in binary manifest, and exact OS/CPU/ABI prebuilt files. It contains no source-build lifecycle script and no `binding.gyp`; npm documents that `binding.gyp` without an own install/preinstall script may trigger `node-gyp rebuild` [CITED: https://docs.npmjs.com/cli/v11/using-npm/scripts/].
2. The manifest records package version, target tuple, Node-API version, byte length, SHA-256, and build commit. The JS loader hashes/validates the selected included binary before `process.dlopen`; mismatch, unknown target, unsupported filesystem, or missing binary returns a stable containment-unavailable error **before** lock acquisition, staging, or canonical writes.
3. Installation is offline with respect to provider acquisition: `npm pack` then isolated `npm install` must work with lifecycle scripts disabled because no package lifecycle is needed. npm lifecycle scripts can run at `npm install` [CITED: https://docs.npmjs.com/cli/v11/using-npm/scripts/]; their absence is a deliberate testable property.
4. Release CI runs `npm pack --json`/`--dry-run` and asserts tarball inventory and no unexpected architecture binaries. It runs an isolated install of that tarball, with `NODE_PATH`, `NODE_OPTIONS`, workspace links, user npm config, and source checkout access removed. It verifies the loaded binary realpath and manifest hash belong to the installed package, not the checkout.
5. Create per-binary and final-tarball checksums plus provenance. GitHub Actions can produce binary artifact attestations containing workflow/repository/commit context [CITED: https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations]. Attestations complement npm integrity; they do not replace the in-package manifest check.
6. Treat prebuilt-binary build toolchains and any selected capability library as release dependencies. Before adding one, run the GSD Package Legitimacy Audit, inspect install scripts, pin versions, record advisory review, and get the required human gate. This research does not authorize a package.

## Validation architecture

“Complete tests” here means complete coverage of the declared threat model and approved support matrix, not a claim to prove all hardware failures or all filesystems. Every platform listed as supported must pass the required rows; a skipped, emulated-only, unavailable, or flaky job is **not** a pass.

### Required test layers

| Layer | Required proof |
|---|---|
| Existing regression suite | Run all existing 62 tests unchanged on every matrix platform; no containment migration may weaken D-18/D-19, validation, adapter, or ownership behavior. The 62 result is a current baseline, not future evidence. |
| Native provider unit tests | Reject invalid components, separators, dot paths, symlink/reparse ancestors, device names, unexpected types, missing binary, bad manifest hash, wrong target, cross-device replacement, and unsupported filesystem before mutation. |
| Real installed CLI | Pack the actual package, install outside the checkout with lifecycle scripts disabled and network unavailable, then invoke the installed bin from root and nested paths. Trace the loaded provider to the installed package’s selected manifest entry. Perform this on every support row. |
| Deterministic multi-process attack races | Choose and document one evidence mode per platform: (A) an external syscall/API trace or hook that coordinates the adversary around the **unmodified installed release binary**, or (B) a separately installed instrumented test package that provides deterministic barriers, accompanied by binary/source-build equivalence evidence and an uninstrumented release-binary end-to-end suite. In either mode, swap leaf, parent, higher ancestor, and root/repository paths with an independent adversary. Do not mock provider operations or describe an instrumented result as direct proof of the exact release binary. |
| Transaction/recovery fault matrix | For every write in the actual init plan, inject process termination after stage creation, journal creation, each temporary write/sync, each replacement, journal advancement, cleanup deletion, and ownership publication/release. Next invocation must recover only validated evidence or report ambiguity with zero new writes. Preserve actual forced-child termination: POSIX may assert the `SIGKILL` signal; Windows must use an explicit platform-appropriate termination oracle and still await the child’s observed exit. |
| Ownership/cleanup races | Race stale-owner reclamation, a new live owner, stage directory swaps, journal/backup swaps, cleanup of files and empty directories, and a second recovery. Assert UUID token isolation and evidence preservation. |
| Supplemental stress | Run repeated uncoordinated races for a bounded duration/count per platform after deterministic tests. Stress failures are release blockers and generate a minimized artifact; stress passing never replaces the deterministic barrier proof. |

### Coverage grid for real races

| Operation family | Swap points that require deterministic CLI evidence | Expected result |
|---|---|---|
| Read and preimage/identity check | leaf, parent, ancestor, root replacement | no external read/write used as mutation authority; drift is rejected or reported according to provider contract |
| Stage and backup write | `.exspecso`, `.staging`, transaction directory, `files`, `backups`, journal parent | no attacker-selected directory receives data; ambiguous evidence remains untouched |
| Promotion / atomic replace | final leaf, direct parent, higher ancestor, root path, relocation of an already-open directory | link/reparse substitution cannot alter an external sentinel; a relocation result is compared with the approved capability/lexical contract and blocks release if it violates that contract |
| Restore | final leaf, parent, ancestor, root path, relocation of an already-open directory | restore uses bound handles or reports ambiguity; relocated-handle behavior is a documented decision boundary, never silently counted as containment |
| Ownership publication/release | `.exspecso`, lock directory, candidate directory | no live/new owner is removed; no attacker destination receives lock state |
| Cleanup | stage file, journal, backup, each parent removal | deletes only known entries through bound parents; unknown evidence is preserved |

The two deterministic modes have different evidentiary strength and must not be conflated:

- **Mode A — external trace/hook:** the release tarball and its unmodified installed binary are exercised. The platform-specific test host observes the actual syscall/API boundary and schedules the adversary without changing Exspecso’s binary. This is the preferred exact-binary proof, but it is a feasibility gate: it must be available and reliable on each claimed platform.
- **Mode B — instrumented test package:** a build-excluded barrier may signal an external controller but must never accept an attacker path, select a different provider, or alter a production state-machine decision. It proves the instrumented provider’s operation ordering only. Release evidence must additionally prove the release and test builds came from the same pinned source/toolchain configuration apart from the instrumentation flag, compare exported operation contracts and binary manifests, and run uninstrumented installed-release E2E/negative tests. If the product requires deterministic proof on the literal release binary and Mode A is unavailable, the row remains blocked rather than treating Mode B as equivalent.

A simple “run many times” test is supplemental because timing cannot establish the desired race coverage.

### Release gate criteria

The planner should make these non-negotiable completion conditions:

- A supported matrix row has a native binary, manifest/hash verification, isolated installed-CLI proof, deterministic race grid, all recovery points, and the full regression suite on that row.
- An unsupported target fails before mutation with a stable diagnostic and test proof. It is documented as unsupported, not silently run through `fs/promises`.
- CI stores package inventory, installed provider identity/hash, OS/CPU/filesystem/Node versions, individual test logs, and fault/race artifacts for every row.
- A failed or missing required runner blocks publication. It cannot be waived into support with a README caveat.
- Documentation distinguishes: binary available; behavior tested; containment security-supported; compatibility-only. No category may be inferred from another.

## Open decisions and stop points

1. **Approve the object-capability containment boundary.** If “never write outside the textual repository path even if a peer moves the root directory” is required, stop: that is not portable with local user-space handles alone. Define the external authority needed before implementation.
2. **Approve the proposed support matrix.** Confirm whether the initial public contract includes every listed macOS/Windows/Linux CPU row or begins with a subset while the remainder are plainly unavailable. The user requested broad support, but no row may be marketed before evidence exists.
3. **Choose the provider route after prototypes.** Direct C Node-API is the preferred route only if P-01 and W-01/W-02 pass. Otherwise, perform a package-audited `cap-std` prototype; do not fall back to pathname checks.
4. **Decide Node 20 status.** Preserve its compatibility lane or approve a supported-engine increase; neither outcome is automatic.
5. **Define network/removable filesystem policy.** Initial recommendation is fail-before-write as unsupported. Supporting any requires its own primitive and race/recovery evidence.
6. **Approve release infrastructure scope.** Prebuilt binaries require CI runners, signing/provenance, artifact retention, and a binary manifest. This is implementation/release work, not an invisible dependency of `npm install`.

## Source notes

All web sources were accessed 2026-08-28. Claims with `[VERIFIED]` were read from the cited repository source in this session; external mechanism claims are cited to primary vendor/project documentation.

- Node-API ABI, version matrix, and prebuilt-binary guidance: https://nodejs.org/api/n-api.html
- Node release status: https://nodejs.org/en/about/previous-releases
- Linux resolution constraints: https://www.man7.org/linux/man-pages/man2/openat2.2.html
- Microsoft directory/reparse opens: https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilea
- Microsoft root-directory object attributes: https://learn.microsoft.com/en-us/windows/win32/api/ntdef/ns-ntdef-_object_attributes
- Microsoft user-mode relative `NtCreateFile`: https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntcreatefile
- Windows rename and network RootDirectory constraint: https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-fscc/1d2673a8-8fb9-4868-920a-775ccaa30cf8
- Windows file identity: https://learn.microsoft.com/en-us/windows/win32/api/fileapi/ns-fileapi-by_handle_file_information
- Capability-library evidence and advisory: https://docs.rs/cap-std/latest/cap_std/ ; https://github.com/bytecodealliance/cap-std ; https://github.com/bytecodealliance/cap-std/security/advisories/GHSA-hxf5-99xg-86hw
- npm lifecycle behavior: https://docs.npmjs.com/cli/v11/using-npm/scripts/
- GitHub Actions runner matrix: https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job
- GitHub build provenance: https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations
