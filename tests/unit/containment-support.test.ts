import { describe, expect, it } from "vitest";
import { isSupportedNodeVersion, loadSupportMatrix, resolveSupportRow } from "../../src/filesystem/support-matrix.js";

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
