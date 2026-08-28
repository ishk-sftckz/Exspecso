import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const matrix = JSON.parse(readFileSync(join(root, "native/support-matrix.json"), "utf8"));
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();

function aggregate(records: unknown[], stage = "final", expectedSourceCommit?: string) {
  const evidenceDir = mkdtempSync(join(tmpdir(), "exspecso-containment-evidence-"));
  try {
    for (const [index, record] of records.entries()) {
      writeFileSync(join(evidenceDir, `record-${index}.json`), JSON.stringify(record));
    }
    const args = ["scripts/containment-evidence.mjs", "--stage", stage, "--evidence-dir", evidenceDir, "--matrix", "native/support-matrix.json"];
    if (expectedSourceCommit) args.push("--source-commit", expectedSourceCommit);
    return execFileSync(process.execPath, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } finally {
    rmSync(evidenceDir, { recursive: true, force: true });
  }
}

function completeRecord(row: (typeof matrix.rows)[number], nodeLane = row.node.testedVersion) {
  return {
    schemaVersion: 2,
    matrixRevision: matrix.revision,
    rowId: row.id,
    stage: "final",
    status: "passed",
    evidenceMode: "release",
    sourceCommit,
    provider: { sha256: "a".repeat(64), buildSHA256: "a".repeat(64), napi: 8 },
    manifest: { sha256: "b".repeat(64) },
    finalTarball: { sha256: "c".repeat(64) },
    nodeLanes: [nodeLane],
    toolchain: { headerSha256: "d".repeat(64) },
    tracer: { requiredTestIds: ["installed-native-promotion"], reachedTestIds: ["installed-native-promotion"], exitCode: 0 },
    environment: {
      native: true,
      cpu: row.cpu,
      os: row.os.family,
      osVersion: row.os.version,
      osBuild: row.os.build ?? row.os.kernel ?? "observed-build",
      kernel: row.os.kernel ?? "observed-kernel",
      filesystem: row.filesystem,
      libc: row.libc,
      libcObserved: row.libc === "glibc-2.39" ? "glibc 2.39" : row.libc,
      node: { version: nodeLane, liveNapi: 10 },
      compiler: "approved compiler",
      toolchain: "approved toolchain",
      operationRootFilesystem: row.os.family === "linux" ? {
        path: "/work/.ci-fixtures/exspecso-fixture",
        rawMagicDecimal: "61267",
        normalizedMagicDecimal: "61267",
        normalizedMagicHex: "0x0000ef53",
        mapping: "ext2/ext3",
        statText: "UNKNOWN",
        mountinfo: ["42 35 0:42 / /work rw,relatime - ext4 /dev/sda rw"],
      } : undefined,
    },
  };
}

function completeMatrixRecords() {
  return matrix.rows.flatMap((row: (typeof matrix.rows)[number]) => {
    const lanes = row.id === "ENV-MA25" ? [row.node.testedVersion] : matrix.nodePolicy.testedVersions;
    return lanes.map((lane: string) => completeRecord(row, lane));
  });
}

describe("containment evidence aggregate", () => {
  it("materializes every declared support row and named Node lane", () => {
    expect(matrix.revision).toMatch(/^01-19-/);
    expect(matrix.rows.map((row: { id: string }) => row.id)).toEqual(["ENV-MA", "ENV-MX", "ENV-WX", "ENV-WA", "ENV-LGX", "ENV-LGA", "ENV-LMX", "ENV-LMA", "ENV-MA25"]);
    expect(matrix.rows.filter((row: { runnerKind: string }) => row.runnerKind === "ci")).toHaveLength(matrix.rows.length - 1);
    expect(matrix.nodePolicy.testedVersions).toHaveLength(10);
    for (const row of matrix.rows) {
      expect(row.node.baseline).toBe(row.id === "ENV-MA25" ? "25.2.1" : "20.19.0");
      expect(row.node.testedVersion).toBeTruthy();
      expect(row.filesystem).toMatch(/^(apfs|ntfs|ext4)$/);
      expect(row.runner).toBeTruthy();
      if (row.libc === "musl") expect(row.image).toMatch(/^node:24\.20\.0-alpine3\.24@sha256:/);
    }
  });

  it("keeps native build prerequisites target-specific", () => {
    const build = readFileSync(join(root, "native/build.mjs"), "utf8");
    const loader = readFileSync(join(root, "src/filesystem/contained-fs.ts"), "utf8");
    const posix = readFileSync(join(root, "native/contained-fs-posix.cc"), "utf8");
    const workflow = readFileSync(join(root, ".github/workflows/containment.yml"), "utf8");
    expect(posix).toContain("#include <array>");
    expect(build).toContain('join(sdk, "Lib", sdkVersion, part, targetArchitecture)');
    expect(build).toContain('error.stderr.includes("musl libc")');
    expect(loader).toContain('error.stderr.includes("musl libc")');
    expect(build).toContain("EXSPECSO_SOURCE_COMMIT");
    const evidenceWriter = readFileSync(join(root, "scripts/write-containment-evidence.mjs"), "utf8");
    const filesystemCapture = readFileSync(join(root, "scripts/capture-filesystem-observation.mjs"), "utf8");
    expect(evidenceWriter).toContain("EXSPECSO_SOURCE_COMMIT");
    expect(evidenceWriter).toContain("napi: provider.napiVersion");
    expect(loader).toContain("loadProvider(operationRoot)");
    expect(loader).toContain("statfsSync(root, { bigint: true })");
    expect(loader).not.toContain('["stat", ["-f", "-c", "%T", packageRoot]');
    expect(filesystemCapture).toContain('mountpoint === "/"');
    expect(workflow).toContain('-e EXSPECSO_SOURCE_COMMIT="$GITHUB_SHA"');
    expect(workflow).toContain("wget -q https://nodejs.org/dist/v20.19.0/node-v20.19.0-headers.tar.gz");
  });

  it.each([
    ["missing prior row", (records: unknown[]) => records.slice(1)],
    ["missing ENV-MA25", (records: any[]) => records.filter((record) => record.rowId !== "ENV-MA25")],
    ["missing Node 25.2.1 lane", (records: any[]) => records.map((record) => ({ ...record, nodeLanes: record.nodeLanes.filter((lane: string) => lane !== "25.2.1") }))],
    ["Node 25.2.0", (records: any[]) => records.map((record) => record.rowId === "ENV-MA25" ? { ...record, environment: { ...record.environment, node: { ...record.environment.node, version: "25.2.0" } } } : record)],
    ["Node 25.2.2", (records: any[]) => records.map((record) => record.rowId === "ENV-MA25" ? { ...record, environment: { ...record.environment, node: { ...record.environment.node, version: "25.2.2" } } } : record)],
    ["failed", (records: any[]) => records.map((record, index) => index === 0 ? { ...record, status: "failed" } : record)],
    ["skipped", (records: any[]) => records.map((record, index) => index === 0 ? { ...record, status: "skipped" } : record)],
    ["cancelled", (records: any[]) => records.map((record, index) => index === 0 ? { ...record, status: "cancelled" } : record)],
    ["stale commit", (records: any[]) => records.map((record, index) => index === 0 ? { ...record, sourceCommit: "b".repeat(40) } : record)],
    ["wrong hash", (records: any[]) => records.map((record, index) => index === 0 ? { ...record, provider: { ...record.provider, buildSHA256: "f".repeat(64) } } : record)],
    ["wrong provider N-API", (records: any[]) => records.map((record, index) => index === 0 ? { ...record, provider: { ...record.provider, napi: 9 } } : record)],
    ["wrong live Node-API", (records: any[]) => records.map((record) => record.rowId === "ENV-MA25" ? { ...record, environment: { ...record.environment, node: { ...record.environment.node, liveNapi: 9 } } } : record)],
    ["emulated", (records: any[]) => records.map((record, index) => index === 0 ? { ...record, environment: { ...record.environment, native: false } } : record)],
    ["wrong libc observation", (records: any[]) => records.map((record) => record.rowId === "ENV-LGX" ? { ...record, environment: { ...record.environment, libcObserved: "glibc 2.38" } } : record)],
    ["missing operation-root filesystem evidence", (records: any[]) => records.map((record) => record.rowId === "ENV-LMX" ? { ...record, environment: { ...record.environment, operationRootFilesystem: undefined } } : record)],
    ["overlay operation-root filesystem", (records: any[]) => records.map((record) => record.rowId === "ENV-LMX" ? { ...record, environment: { ...record.environment, operationRootFilesystem: { ...record.environment.operationRootFilesystem, rawMagicDecimal: "2035054128", normalizedMagicDecimal: "2035054128", normalizedMagicHex: "0x794c7630", mapping: "overlay" } } } : record)],
    ["mismatched operation-root filesystem hexadecimal observation", (records: any[]) => records.map((record) => record.rowId === "ENV-LMX" ? { ...record, environment: { ...record.environment, operationRootFilesystem: { ...record.environment.operationRootFilesystem, normalizedMagicHex: "0x00000000" } } } : record)],
    ["environment paired with another row manifest", (records: any[]) => records.map((record) => record.rowId === "ENV-MA25" ? { ...record, environment: { ...record.environment, cpu: "x64" } } : record)],
  ])("rejects %s final evidence", (_name, mutate) => {
    const records = completeMatrixRecords();
    expect(() => aggregate(mutate(records))).toThrow();
  });

  it("rejects duplicate/conflicting row-lane evidence and accepts a complete exact native matrix", () => {
    const records = completeMatrixRecords();
    expect(() => aggregate([...records, { ...records[0], environment: { ...records[0].environment, kernel: "different" } }])).toThrow();
    expect(aggregate(records)).toContain('"plan_complete":true');
  });

  it("requires the current ENV-MA25 local record at the prerequisite stage", () => {
    const local = completeRecord(matrix.rows.find((row: { id: string }) => row.id === "ENV-MA25")!);
    local.stage = "prerequisite";
    local.nodeLanes = ["25.2.1"];
    delete local.finalTarball;
    expect(aggregate([local], "prerequisite", sourceCommit)).toContain('"plan_complete":true');
    expect(() => aggregate([], "prerequisite")).toThrow();
    expect(() => aggregate([{ ...local, sourceCommit: "b".repeat(40) }], "prerequisite", sourceCommit)).toThrow();
  });
});
