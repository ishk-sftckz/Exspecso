# Exspecso

Exspecso is a local-first, spec-driven harness for AI coding agents. Its canonical project state remains ordinary repository files rather than a hidden service or database.

## Native containment support

The current tested local native tuple is exactly **ENV-MA25**: macOS 26.5.1 build 25F80, arm64, APFS, Node 25.2.1 (live Node-API 10), and a Node-API 8 provider built with Command Line Tools clang 17.0.0 `clang-1700.6.4.2` and macOS SDK 26.2 build 25C58. It is one declared support row, not a claim for other macOS 26 patches, other Node 25 patches, future macOS releases, or undeclared filesystem/toolchain combinations. Unknown tuples fail before repository mutation.

End-user installation uses the package's included provider only: it does not download a provider, invoke an npm lifecycle source build, or require a compiler or Node headers. Maintainers build and validate providers under the exact row contract; the retained ENV-MA25 evidence is in `.planning/phases/01-initialize-canonical-projects/01-20-EVIDENCE/local/`.

The support matrix may contain multiple environment rows for the same OS/CPU target. Provider and manifest selection is therefore by declared support-row ID, then revalidated against the live host, not by target string alone. See the approved [containment support contract](.planning/phases/01-initialize-canonical-projects/01-CONTAINMENT-SUPPORT.md) and [test matrix](.planning/phases/01-initialize-canonical-projects/01-CONTAINMENT-TEST-MATRIX.md) for the full evidence contract and remaining release gates.
