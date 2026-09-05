# Plan 01-10 Task 2 — verified Windows parity

Task 2 is complete. RED `240e636`; GREEN `0093733`. Plan 01-10 remains incomplete (2/3 tasks); Phase 1 remains incomplete (9/18 plans). Both the native design and POSIX tracer approvals are already recorded. No new human checkpoint is required before Task 3.

## Native implementation and API checks

The pinned SDK declarations were inspected before implementation. Component opens use user-mode `NtCreateFile` with `OBJECT_ATTRIBUTES.RootDirectory`, a single UTF-16 name, `FILE_OPEN_REPARSE_POINT`, synchronous handles, and explicit read/write/delete sharing. Exclusive creation requests `FILE_CREATE`; existing files never receive write access. Reparse/device objects and wrong kinds are rejected from handle metadata. Root acquisition permits an ordinary fixed local drive and verifies NTFS through its handle.

Replacement calls user-mode `NtSetInformationFile`, class 65 (`FileRenameInformationEx`), with the held parent as RootDirectory and the held private file as source. The SDK `FILE_RENAME_INFO` layout is checked with compile-time offsets; documented replacement/POSIX flags preserve open readers of the old object. No pathname or access-check-bypass fallback exists. Before replacement, all 128 file-ID bits and the volume serial are compared for the source and its parent. Public BigInt identity also preserves all 128 bits. Deletion uses a no-follow handle and `FileDispositionInfoEx`; NTFS enforces empty-directory removal.

Primary API references: [NtCreateFile](https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntcreatefile), [NtSetInformationFile, including its user-mode note](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntsetinformationfile), [rename layout and flags](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/ns-ntifs-_file_rename_information), [information-class values](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/ne-wdm-_file_information_class). SDK snippets and hashes are saved with the preflight evidence; driver documentation is not treated as permission to link kernel libraries.

## Actual evidence

[Final run 33144287790](https://github.com/ishk-sftckz/exspecso/actions/runs/33144287790), snapshot `48aeed78bfb8ea10cc130d9a15e230197d80e837`:

- Windows: **11/11 provider tests passed**, no failed/pending cases. NP-01/02 and W-01/W-02 exercise symlinks, junctions, device/ADS rejection, exclusive creation, wrong kinds, hardlink preservation, moved parent binding, source substitution, full identity, open-reader replacement and an actual independent Windows sharing conflict. These satisfy this task's W feasibility gate, not every later NP expansion.
- macOS: **21/21 focused tests and 77/77 full regression tests passed**, no failed/pending cases, on the approved native arm64 OS/toolchain. The Windows-only sharing-mode test has no POSIX counterpart and is not registered on macOS; there is no blanket skip of a required Windows case.
- All **43** submitted source/config hashes match GREEN source. Downloaded native bytes match the manifest hashes and lengths.
- Windows provider: 183,296 bytes; SHA-256 `956cf83c3055810ac072db202c3d54570d9e2c93d956e7181c6800dba2e30bab`. macOS provider: 98,480 bytes; SHA-256 `0f96f9185b7caedb8f355c7a8440b074e8b0c6f51c6efc99e1c46b6e4ede990e`.
- Windows Server 2025 Datacenter 10.0.26100.33296, native x64, local NTFS; VS 18.9.12112.369, selected MSVC 14.44.35207 / compiler file 19.44.35228.0; SDK 10.0.26100.0. Checksum-verified official Node 20.19.0 headers/import library and native executable; addon Node-API 8.
- `/MT` links the C/C++ runtime statically. `dumpbin /DEPENDENTS` reports only `node.exe` and `KERNEL32.dll`; ntdll entrypoints are resolved from the already-loaded system module. No new npm/native dependency or installer hook.
- Local TypeScript build, POSIX syntax check and diff checks passed. Local macOS is not acceptance evidence.

Raw reports, job log, exact environment, SDK excerpts, provenance, source ledgers and actual binaries are under `01-10-EVIDENCE/windows-task-2/`. Run 33143857626 records all 11 tests failing before implementation because the provider manifest was absent. The RED workflow retained exit 1, and its JSON confirms test failures rather than a runner failure. Run 33144055505 failed before compilation because the maintainer script selected Windows PowerShell instead of the inspected PowerShell 7 runtime; the explicit runtime selection was corrected. The separate image-drift stops and comparison/disposition are documented in SUPPORT. No stopped run is counted as a test pass.

## Limits and next task

Windows directory sync explicitly reports unsupported; the approved promise remains process interruption, not power-loss durability. Sharing conflicts stop without changing either file. Root/ancestor relocation and final-entry races retain the approved trusted-namespace/cooperating-writer limits. The Windows controller for deterministic installed-package races is not implemented yet. Windows full-suite harness/installed CLI evidence, historical vulnerable-CLI race reproductions and Task 3 remain pending; no full Windows initializer/recovery claim is made here. Windows arm64, Linux and other Node lanes remain Plan 11 evidence obligations. Wider read/ownership/journal/recovery/cleanup migrations remain Plans 12–15.
