import { truncateSync } from "node:fs";
import { mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const filesystemSpies = vi.hoisted(() => ({
  fstatSync: vi.fn(),
  readSync: vi.fn(),
  writeSync: vi.fn(),
  actualFstatSync: undefined as undefined | ((...args: any[]) => any),
  actualReadSync: undefined as undefined | ((...args: any[]) => any),
  actualWriteSync: undefined as undefined | ((...args: any[]) => any),
}));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  filesystemSpies.actualFstatSync = actual.fstatSync;
  filesystemSpies.actualReadSync = actual.readSync;
  filesystemSpies.actualWriteSync = actual.writeSync;
  filesystemSpies.fstatSync.mockImplementation(actual.fstatSync);
  filesystemSpies.readSync.mockImplementation(actual.readSync);
  filesystemSpies.writeSync.mockImplementation(actual.writeSync);
  return { ...actual, fstatSync: filesystemSpies.fstatSync, readSync: filesystemSpies.readSync, writeSync: filesystemSpies.writeSync };
});
import { openContainedFilesystem } from "../../src/filesystem/contained-fs.js";
import { buildInitPlan } from "../../src/init/plan.js";
import { acquireInitOwnership, releaseInitOwnership } from "../../src/filesystem/ownership.js";
import { commitTransaction } from "../../src/filesystem/transaction.js";
import { createGitFixture, type GitFixture } from "../helpers/git-fixture.js";

const fixtures: GitFixture[] = [];

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
});

beforeEach(() => {
  filesystemSpies.fstatSync.mockReset();
  filesystemSpies.readSync.mockReset();
  filesystemSpies.writeSync.mockReset();
  filesystemSpies.fstatSync.mockImplementation(filesystemSpies.actualFstatSync!);
  filesystemSpies.readSync.mockImplementation(filesystemSpies.actualReadSync!);
  filesystemSpies.writeSync.mockImplementation(filesystemSpies.actualWriteSync!);
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

  it("rejects a file truncated after its initial descriptor stat instead of spinning", async () => {
    const repository = await fixture();
    const path = join(repository.root, "changing.txt");
    await writeFile(path, "initial bytes");
    const filesystem = openContainedFilesystem(repository.root);
    filesystemSpies.readSync
      .mockImplementationOnce(() => {
        truncateSync(path, 0);
        return 0;
      })
      .mockImplementationOnce(() => {
        throw new Error("unexpected second zero-progress read");
      });

    try {
      expect(() => filesystem.reader.read(["changing.txt"])).toThrow(/EXSPECSO_CONTAINMENT_CHANGED/);
    } finally {
      filesystem.close();
    }
  });

  it("rejects bytes when the descriptor changes after the read completes", async () => {
    const repository = await fixture();
    await writeFile(join(repository.root, "changing.txt"), "initial bytes");
    const filesystem = openContainedFilesystem(repository.root);
    let fstatCalls = 0;
    filesystemSpies.fstatSync.mockImplementation((...args: any[]) => {
      const observed = filesystemSpies.actualFstatSync!(...args);
      fstatCalls += 1;
      if (fstatCalls !== 2) return observed;
      const changed = Object.create(observed);
      Object.defineProperty(changed, "size", { value: observed.size + 1n });
      return changed;
    });

    try {
      expect(() => filesystem.reader.read(["changing.txt"])).toThrow(/EXSPECSO_CONTAINMENT_CHANGED/);
    } finally {
      filesystem.close();
    }
  });

  it("returns exactly the initially observed bytes for an unchanged descriptor", async () => {
    const repository = await fixture();
    await writeFile(join(repository.root, "stable.txt"), "stable bytes");
    const filesystem = openContainedFilesystem(repository.root);
    try {
      expect(filesystem.reader.read(["stable.txt"])).toEqual(Buffer.from("stable bytes"));
    } finally {
      filesystem.close();
    }
  });

  it("fails a preparation journal with no write progress and releases its internally owned lease", async () => {
    const repository = await fixture();
    const plan = await buildInitPlan({ repositoryRoot: repository.root, selectedAgents: ["codex"] });
    let zeroProgressCalls = 0;
    filesystemSpies.writeSync.mockImplementation((descriptor: number, bytes: Buffer, offset: number, length: number, position: number | null) => {
      if (bytes.subarray(offset, offset + length).toString("utf8").includes('"state": "preparing"')) {
        zeroProgressCalls += 1;
        if (zeroProgressCalls > 1) throw new Error("unchanged preparation-journal offset was retried");
        return 0;
      }
      return filesystemSpies.actualWriteSync!(descriptor, bytes, offset, length, position);
    });

    const result = await commitTransaction(plan);
    expect(result).toMatchObject({ kind: "failed" });
    if (result.kind !== "failed") throw new Error("zero-progress write unexpectedly committed");
    expect(result.error.code).toBe("EXSPECSO_CONTAINMENT_CHANGED");
    expect(zeroProgressCalls).toBe(1);

    const acquisition = await acquireInitOwnership(repository.root);
    expect(acquisition.kind).toBe("acquired");
    if (acquisition.kind === "acquired") await releaseInitOwnership(acquisition.ownership);
  });

  it("continues exact writes after positive partial progress", async () => {
    const repository = await fixture();
    const filesystem = openContainedFilesystem(repository.root);
    const file = filesystem.root.createFile("partial-write.txt");
    const bytes = Buffer.from("partial write stays exact");
    filesystemSpies.writeSync.mockImplementationOnce((descriptor: number, buffer: Buffer, offset: number, _length: number, position: number | null) => (
      filesystemSpies.actualWriteSync!(descriptor, buffer, offset, 1, position)
    ));

    try {
      file.write(bytes);
      expect(file.read()).toEqual(bytes);
    } finally {
      file.close();
      filesystem.close();
    }
  });
});
