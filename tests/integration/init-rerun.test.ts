import { describe, expect, it } from "vitest";
import { inspectManagedFile, renderManagedFile } from "../../src/adapters/managed-file.js";

describe("managed adapter ownership", () => {
  const body = "# Exspecso Start\n\nGenerated adapter body.\n";
  const generated = renderManagedFile(body);

  it("classifies a missing target and an unchanged generated adapter", () => {
    expect(inspectManagedFile(undefined, generated)).toMatchObject({ state: "absent" });
    expect(inspectManagedFile(generated, generated)).toMatchObject({ state: "owned-unchanged" });
  });

  it("preserves a changed owned adapter and returns a deterministic concise diff", () => {
    const modified = `${generated}Local user note.\n`;
    const inspection = inspectManagedFile(modified, generated);

    expect(inspection.state).toBe("owned-modified");
    expect(inspection.existingContent).toBe(modified);
    expect(inspection.diff).toContain("--- existing");
    expect(inspection.diff).toContain("+++ generated");
    expect(inspection.diff).toContain("+Local user note.");
  });

  it("does not grant ownership to unowned or malformed headers", () => {
    expect(inspectManagedFile("# User-owned adapter\n", generated)).toMatchObject({ state: "unowned" });
    expect(inspectManagedFile("<!-- exspecso:managed template-version=wrong -->\nbody\n", generated)).toMatchObject({
      state: "malformed-header",
    });
  });

  it("writes only a self-contained version and original body fingerprint", () => {
    expect(generated).toMatch(/^<!-- exspecso:managed template-version=1 original-body-sha256=[a-f0-9]{64} -->\n/);
    expect(generated).not.toContain("manifest");
  });
});
