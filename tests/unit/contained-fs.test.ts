import { link, mkdir, readFile, rename, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { afterEach, describe, expect, it } from "vitest";
import { isApprovedLinuxFilesystemType, normalizeLinuxFilesystemType, openContainedFilesystem } from "../../src/filesystem/contained-fs.js";
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
  it("accepts only the approved ext-family statfs magic after unsigned normalization", () => {
    expect(normalizeLinuxFilesystemType(0xef53n)).toBe(0xef53n);
    expect(normalizeLinuxFilesystemType(-1n)).toBe(0xffffffffn);
    expect(isApprovedLinuxFilesystemType(0xef53n)).toBe(true);
    expect(isApprovedLinuxFilesystemType(0x794c7630n)).toBe(false);
  });

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

  it("NP-03 rejects writes through a read-only capability and invalid buffers", async () => {
    const directory = await fixture();
    await writeFile(join(directory.root, "existing"), "preserved");
    const fs = keep(openContainedFilesystem(directory.root));
    const readOnly = keep(fs.root.openFile("existing"));
    expect(() => readOnly.write(Buffer.from("overwrite"))).toThrow();
    const privateFile = keep(fs.root.createFile("space and é"));
    expect(() => privateFile.write("not a buffer" as unknown as Buffer)).toThrow();
    privateFile.write(Buffer.from("valid"));
    expect(privateFile.read().toString()).toBe("valid");
    expect(await readFile(join(directory.root, "existing"), "utf8")).toBe("preserved");
  });

  it("W-01 rejects junctions, alternate streams, device aliases and wrong entry kinds", async () => {
    const directory = await fixture();
    const outside = await fixture();
    await symlink(outside.root, join(directory.root, "junction"), "junction");
    await writeFile(join(directory.root, "ordinary"), "preserved");
    const fs = keep(openContainedFilesystem(directory.root));
    const child = keep(fs.root.openDirectory("child", true));
    expect(() => fs.root.openDirectory("junction")).toThrow();
    expect(() => fs.root.removeDirectory("junction")).toThrow();
    for (const name of ["ordinary:secret", "CON.txt", "COM1", "LPT9.log", "COM¹", "LPT².txt", "COM³"]) {
      expect(() => fs.root.createFile(name)).toThrow();
    }
    expect(() => fs.root.openFile("child")).toThrow();
    expect(() => fs.root.openDirectory("ordinary")).toThrow();
    expect(() => fs.root.unlink("child")).toThrow();
    expect(() => fs.root.removeDirectory("ordinary")).toThrow();
    const temporary = keep(child.createFile("temporary"));
    expect(() => child.replace(temporary, "..")).toThrow();
    expect(await readFile(join(directory.root, "ordinary"), "utf8")).toBe("preserved");
    expect(fs.root.list()).toEqual([".git", "child", "junction", "ordinary"]);
  });

  it("W-02 replaces with an open reader while preserving the old object and full identity observation", async () => {
    const directory = await fixture();
    await writeFile(join(directory.root, "target"), "before");
    const fs = keep(openContainedFilesystem(directory.root));
    const old = keep(fs.root.openFile("target"));
    const before = old.stat();
    const temporary = keep(fs.root.createFile("temporary"));
    temporary.write(Buffer.from("after"));
    fs.root.replace(temporary, "target");
    const current = keep(fs.root.openFile("target"));
    expect(old.read().toString()).toBe("before");
    expect(old.stat()).toEqual(before);
    expect(current.read().toString()).toBe("after");
    expect(current.stat().inode).not.toBe(before.inode);
    expect(current.stat().device).toBe(before.device);
    expect(() => temporary.write(Buffer.from("late"))).toThrow();
    expect(() => fs.root.openFile("absent")).toThrow(/EXSPECSO_CONTAINMENT_ENOENT/);
  });

  it("W-02 rejects a substituted private sibling without replacing the intended target", async () => {
    const directory = await fixture();
    await writeFile(join(directory.root, "target"), "before");
    const fs = keep(openContainedFilesystem(directory.root));
    const temporary = keep(fs.root.createFile("temporary"));
    temporary.write(Buffer.from("ours"));
    await rename(join(directory.root, "temporary"), join(directory.root, "held"));
    await writeFile(join(directory.root, "temporary"), "substituted");
    expect(() => fs.root.replace(temporary, "target")).toThrow();
    expect(await readFile(join(directory.root, "target"), "utf8")).toBe("before");
    expect(await readFile(join(directory.root, "temporary"), "utf8")).toBe("substituted");
    expect(temporary.read().toString()).toBe("ours");
  });

  // Windows sharing modes have no POSIX equivalent; this case belongs only to the native Windows row.
  if (process.platform === "win32") it("W-02 reports a real sharing conflict without modifying either file", async () => {
    const directory = await fixture();
    await writeFile(join(directory.root, "target"), "before");
    const fs = keep(openContainedFilesystem(directory.root));
    const temporary = keep(fs.root.createFile("temporary"));
    temporary.write(Buffer.from("after"));
    const program = "$s=[IO.File]::Open($env:EXSPECSO_LOCK_TARGET,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::Read);try{[Console]::WriteLine('locked');[Console]::ReadLine()|Out-Null}finally{$s.Dispose()}";
    const locker = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(program, "utf16le").toString("base64")], {
      env: { ...process.env, EXSPECSO_LOCK_TARGET: join(directory.root, "target") }, stdio: ["pipe", "pipe", "pipe"],
    });
    const exited = once(locker, "exit");
    try {
      const [chunk] = await Promise.race([once(locker.stdout, "data"), exited.then(() => { throw new Error("Windows sharing fixture exited before acquiring its lock"); })]);
      expect(String(chunk).trim()).toBe("locked");
      expect(() => fs.root.replace(temporary, "target")).toThrow(/EXSPECSO_CONTAINMENT/);
      expect(await readFile(join(directory.root, "target"), "utf8")).toBe("before");
      expect(temporary.read().toString()).toBe("after");
    } finally { locker.stdin.end("\n"); await exited; }
  });
});
