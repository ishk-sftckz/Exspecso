import { link, mkdir, readFile, rename, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openContainedFilesystem } from "../../src/filesystem/contained-fs.js";
import { createGitFixture, type GitFixture } from "../helpers/git-fixture.js";

const fixtures: GitFixture[] = [];
const capabilities: Array<{ close(): void }> = [];
afterEach(async () => {
  for (const capability of capabilities.splice(0).reverse()) capability.close();
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
});
async function fixture() {
  const created = await createGitFixture();
  fixtures.push(created);
  return created;
}
function keep<T extends { close(): void }>(capability: T): T {
  capabilities.push(capability);
  return capability;
}

describe("contained filesystem provider", () => {
  it("NP-01 rejects invalid components and wrong types without creating entries", async () => {
    const directory = await fixture();
    const fs = keep(openContainedFilesystem(directory.root));
    for (const name of ["", ".", "..", "../out", "a/b", "a\\b", "/out", "a\0b", "C:out", "CON", "NUL.txt", "tail.", "tail "]) {
      expect(() => fs.root.createFile(name)).toThrow(/EXSPECSO_CONTAINMENT/);
      expect(() => fs.root.openDirectory(name)).toThrow(/EXSPECSO_CONTAINMENT/);
    }
    expect(() => fs.root.createFile(17 as unknown as string)).toThrow();
    expect(fs.root.list()).toEqual([".git"]);
  });

  it("NP-01 rejects symlink directories and file leaves", async () => {
    const directory = await fixture();
    const outside = await fixture();
    await writeFile(join(outside.root, "sentinel"), "outside");
    await symlink(outside.root, join(directory.root, "redirect"), "dir");
    await symlink(join(outside.root, "sentinel"), join(directory.root, "leaf"));
    const fs = keep(openContainedFilesystem(directory.root));
    expect(() => fs.root.openDirectory("redirect")).toThrow();
    expect(() => fs.root.openFile("leaf")).toThrow();
    expect(await readFile(join(outside.root, "sentinel"), "utf8")).toBe("outside");
  });

  it("NP-02 replaces an entry without modifying its hardlink alias", async () => {
    const directory = await fixture();
    const outside = await fixture();
    await writeFile(join(directory.root, "target"), "before");
    await link(join(directory.root, "target"), join(outside.root, "alias"));
    const fs = keep(openContainedFilesystem(directory.root));
    const temporary = keep(fs.root.createFile("temporary"));
    temporary.write(Buffer.from("after"));
    temporary.sync();
    fs.root.replace(temporary, "target");
    const target = keep(fs.root.openFile("target"));
    expect(target.read().toString()).toBe("after");
    expect(await readFile(join(outside.root, "alias"), "utf8")).toBe("before");
    expect(() => fs.root.openFile("temporary")).toThrow();
  });

  it("NP-02 binds a moved directory object and never follows its substituted name (limitation)", async () => {
    const directory = await fixture();
    const outside = await fixture();
    await mkdir(join(directory.root, "parent"));
    const fs = keep(openContainedFilesystem(directory.root));
    const parent = keep(fs.root.openDirectory("parent"));
    await rename(join(directory.root, "parent"), join(directory.root, "held"));
    await symlink(outside.root, join(directory.root, "parent"), "dir");
    const file = keep(parent.createFile("new"));
    file.write(Buffer.from("bound"));
    expect(await readFile(join(directory.root, "held", "new"), "utf8")).toBe("bound");
    await expect(readFile(join(outside.root, "new"))).rejects.toThrow();
  });

  it("NP-03 rejects replacement with a file from a different parent and closes idempotently", async () => {
    const directory = await fixture();
    const fs = keep(openContainedFilesystem(directory.root));
    const child = keep(fs.root.openDirectory("child", true));
    const file = keep(child.createFile("temporary"));
    expect(() => fs.root.replace(file, "target")).toThrow();
    file.close();
    file.close();
    expect(() => file.read()).toThrow();
    fs.close();
    expect(() => fs.root.list()).toThrow();
  });

  it("NP-01 creates exclusively and removes only the named file or empty directory", async () => {
    const directory = await fixture();
    const fs = keep(openContainedFilesystem(directory.root));
    const child = keep(fs.root.openDirectory("child", true));
    keep(child.createFile("file"));
    expect(() => child.createFile("file")).toThrow();
    expect(() => fs.root.removeDirectory("child")).toThrow();
    child.unlink("file");
    child.close();
    fs.root.removeDirectory("child");
    expect(fs.root.list()).toEqual([".git"]);
  });
});
