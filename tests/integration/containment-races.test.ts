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
});
