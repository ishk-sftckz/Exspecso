import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { containmentOperationGrid, type ContainmentOperationCase } from "../helpers/containment-fixture.js";

const requiredOperations: readonly ContainmentOperationCase[] = [
  { caseId: "RACE-01", operationId: "stage:create-directory", boundaryId: "create-directory:before" },
  { caseId: "RACE-02", operationId: "read:bytes", boundaryId: "read:before" },
  { caseId: "RACE-03", operationId: "ownership:open-root", boundaryId: "open-root:before" },
  { caseId: "RACE-04", operationId: "promotion:replace", boundaryId: "replace:before" },
  { caseId: "RACE-05", operationId: "restore:replace", boundaryId: "replace:before" },
  { caseId: "RACE-06", operationId: "cleanup:unlink", boundaryId: "unlink:before" },
];

describe("installed containment operation grid", () => {
  it("RACE-01 through RACE-06 bind every declared operation to a fixed native boundary", () => {
    expect(containmentOperationGrid).toEqual(requiredOperations);
    expect(new Set(containmentOperationGrid.map((entry) => entry.caseId))).toHaveLength(requiredOperations.length);
    expect(new Set(containmentOperationGrid.map((entry) => entry.operationId))).toHaveLength(requiredOperations.length);
  });

  it("requires one real observed Node lane per matrix record instead of stamping unrun lanes", async () => {
    const root = resolve(import.meta.dirname, "../..");
    const [writer, workflow] = await Promise.all([
      readFile(resolve(root, "scripts/write-containment-evidence.mjs"), "utf8"),
      readFile(resolve(root, ".github/workflows/containment.yml"), "utf8"),
    ]);

    expect(writer).toContain("EXSPECSO_OBSERVED_NODE_LANE");
    expect(writer).toContain("process.version.slice(1) !== observedNodeLane");
    expect(writer).toContain("nodeLanes: [observedNodeLane]");
    expect(workflow).toContain("EXSPECSO_OBSERVED_NODE_LANE");
    expect(workflow).not.toContain("nodeLanes: stage === \"final\" ? matrix.nodePolicy.testedVersions");
  });

  it("installs the declared Node lane before checking the observed process version", async () => {
    const root = resolve(import.meta.dirname, "../..");
    const workflow = await readFile(resolve(root, ".github/workflows/containment.yml"), "utf8");

    expect(workflow).toContain("NODE_LANE: ${{ matrix.nodeLane }}");
    expect(workflow).toContain("node-v$NODE_LANE-$TARGET.tar.gz");
    expect(workflow).toContain("node-v$env:NODE_LANE-$nodeTarget.zip");
    expect(workflow).toContain('case "$NODE_LANE/$TARGET" in');
    expect(workflow).toContain("diagnostic=undefined");
    expect(workflow).not.toContain("DYLD_INSERT_LIBRARIES");
  });
});
