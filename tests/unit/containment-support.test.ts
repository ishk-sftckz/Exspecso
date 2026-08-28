import { describe, expect, it } from "vitest";
import { isSupportedNodeVersion, loadSupportMatrix, resolveManifestEntry, resolveSupportRow, type RuntimeObservation } from "../../src/filesystem/support-matrix.js";

describe("native containment support matrix", () => {
  it("declares and resolves the local macOS 26.5.1 Node 25.2.1 support row", () => {
    const matrix = loadSupportMatrix();

    const row = resolveSupportRow(matrix, {
      platform: "darwin",
      arch: "arm64",
      osVersion: "26.5.1",
      osBuild: "25F80",
      filesystem: "apfs",
      libc: "system",
      nodeVersion: "25.2.1",
      napiVersion: 10,
    });

    expect(row.id).toBe("ENV-MA25");
    expect(row.target).toBe("darwin-arm64");
    expect(row.runnerKind).toBe("local");
    expect(row.buildPolicy.developerDirectory).toBe("/Library/Developer/CommandLineTools");
    expect(isSupportedNodeVersion(matrix.nodePolicy, "25.2.1")).toBe(true);
  });
});

describe("declared and undeclared support tuples", () => {
  const matrix = loadSupportMatrix();
  const observationFor = (row: (typeof matrix.rows)[number], nodeVersion = "25.2.1"): RuntimeObservation => ({
    platform: row.target.split("-")[0],
    arch: row.cpu,
    osVersion: row.os.version,
    osBuild: row.os.build ?? row.os.kernel ?? "missing",
    filesystem: row.filesystem,
    libc: row.libc,
    nodeVersion,
    napiVersion: 10,
  });

  it("accepts every declared row under each named Node lane", () => {
    for (const row of matrix.rows) {
      for (const lane of matrix.nodePolicy.testedVersions) {
        expect(resolveSupportRow(matrix, observationFor(row, lane)).id).toBe(row.id);
      }
    }
  });

  it("rejects undeclared, ambiguous, and malformed support or manifest tuples before native loading", () => {
    const row = matrix.rows.find((candidate) => candidate.id === "ENV-MA25")!;
    const observation = observationFor(row);
    const manifest = [{ supportRowId: row.id, target: row.target, platform: "darwin", arch: "arm64", osVersion: row.os.version, osBuild: row.os.build, filesystem: row.filesystem, libc: row.libc, napiVersion: 8, path: `${row.id}/${row.target}/contained-fs.node` }];
    expect(resolveManifestEntry(matrix, observation, manifest).supportRow.id).toBe(row.id);
    for (const key of ["platform", "arch", "osVersion", "osBuild", "filesystem", "libc"] as const) {
      expect(() => resolveSupportRow(matrix, { ...observation, [key]: `wrong-${observation[key]}` })).toThrow(/EXSPECSO_CONTAINMENT_UNAVAILABLE/);
    }
    for (const version of ["20.18.9", "21.0.0", "23.0.0", "25.2.0", "25.2.2", "27.0.0", "99.0.0"]) {
      expect(isSupportedNodeVersion(matrix.nodePolicy, version)).toBe(false);
      expect(() => resolveSupportRow(matrix, observationFor(row, version))).toThrow(/unsupported Node runtime/);
    }
    expect(() => resolveSupportRow({ ...matrix, rows: [...matrix.rows, row] }, observation)).toThrow(/duplicate row id/);
    expect(() => resolveSupportRow({ ...matrix, rows: [...matrix.rows, {} as typeof row] }, observation)).toThrow(/rows are missing or malformed/);
    expect(() => resolveManifestEntry(matrix, observation, [])).toThrow(/missing native support row/);
    expect(() => resolveManifestEntry(matrix, observation, [{ ...manifest[0], supportRowId: "ENV-MA" }])).toThrow(/native support row/);
    expect(() => resolveManifestEntry(matrix, observation, [{ ...manifest[0], osVersion: "wrong-os" }])).toThrow(/incompatible native support row/);
    expect(() => resolveManifestEntry(matrix, observation, [{ ...manifest[0], path: "darwin-arm64/contained-fs.node" }])).toThrow(/native support row/);
    expect(() => resolveManifestEntry(matrix, observation, [{ ...manifest[0], napiVersion: 7 }])).toThrow(/native support row/);
    expect(() => resolveManifestEntry(matrix, observation, [...manifest, manifest[0]])).toThrow(/duplicate native support row/);
  });
});
