import { mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openContainedFilesystem } from "../../src/filesystem/contained-fs.js";
import { createGitFixture, type GitFixture } from "../helpers/git-fixture.js";

const fixtures: GitFixture[] = [];

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
});

async function fixture(): Promise<GitFixture> {
  const created = await createGitFixture();
  fixtures.push(created);
  return created;
}

describe("root-scoped Node filesystem", () => {
  it("reads and writes only validated regular-file components", async () => {
    const repository = await fixture();
    const filesystem = openContainedFilesystem(repository.root);
    try {
      expect(filesystem.provenance.path).toBe("node:fs");
      const directory = filesystem.root.createDirectory(".exspecso");
      const config = directory.createFile("exspecso.config.json");
      config.write(Buffer.from('{"schemaVersion":1}\n'));
      config.sync();
      config.close();

      expect(filesystem.reader.read([".exspecso", "exspecso.config.json"]).toString()).toContain("schemaVersion");
      expect(() => filesystem.root.openFile("../outside")).toThrow(/EXSPECSO_CONTAINMENT/);
      expect(() => filesystem.root.openFile("nested/file")).toThrow(/EXSPECSO_CONTAINMENT/);
    } finally {
      filesystem.close();
    }
  });

  it("rejects stable symlink segments before access", async () => {
    const repository = await fixture();
    const outside = await fixture();
    await mkdir(join(outside.root, "content"));
    await writeFile(join(outside.root, "content", "sentinel.json"), "outside\n");
    await symlink(join(outside.root, "content"), join(repository.root, "redirect"), "dir");

    const filesystem = openContainedFilesystem(repository.root);
    try {
      expect(() => filesystem.reader.read(["redirect", "sentinel.json"])).toThrow(/EXSPECSO_CONTAINMENT/);
      await expect(readFile(join(outside.root, "content", "sentinel.json"), "utf8")).resolves.toBe("outside\n");
    } finally {
      filesystem.close();
    }
  });
});
