import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sha256 } from "../../src/adapters/managed-file.js";
import { buildInitPlan } from "../../src/init/plan.js";
import { parseTransactionJournal } from "../../src/filesystem/journal.js";
import { recoverInterruptedTransaction } from "../../src/filesystem/recovery.js";
import { commitTransaction, readTransactionJournal, stagingRelativePath, type PromotionFaultPoint } from "../../src/filesystem/transaction.js";
import { createGitFixture, type GitFixture } from "../helpers/git-fixture.js";

vi.mock("node:path", async (importOriginal) => {
  const path = await importOriginal<typeof import("node:path")>();
  return {
    ...path,
    join: (...segments: string[]) => segments[0] === "backups" ? path.win32.join(...segments) : path.join(...segments),
  };
});

const fixtures: GitFixture[] = [];

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
});

async function fixture(): Promise<GitFixture> {
  const created = await createGitFixture();
  fixtures.push(created);
  return created;
}

describe("Windows journal backup paths", () => {
  it("uses slash-form backup data through additive interruption recovery while rejecting backslash journals", async () => {
    const repository = await fixture();
    const initial = await buildInitPlan({ repositoryRoot: repository.root, selectedAgents: ["codex"] });
    await expect(commitTransaction(initial)).resolves.toMatchObject({ kind: "committed" });
    const configPath = join(repository.root, ".exspecso", "exspecso.config.json");
    const codexPath = join(repository.root, ".agents", "skills", "exspecso-start", "SKILL.md");
    const initialConfig = JSON.parse(await readFile(configPath, "utf8")) as { project: { id: string } };
    const codexBefore = await readFile(codexPath, "utf8");

    const additive = await buildInitPlan({ repositoryRoot: repository.root, selectedAgents: ["claude"] });
    const point = `after-promotion:${additive.writes[0]!.relativePath}` as PromotionFaultPoint;
    const interrupted = await commitTransaction(additive, { faultAt: point });
    expect(interrupted).toMatchObject({ kind: "failed" });
    if (interrupted.kind !== "failed") throw new Error("additive transaction did not retain recovery evidence");

    const journal = await readTransactionJournal(join(repository.root, stagingRelativePath, interrupted.transactionId));
    const backupEntries = journal.entries.filter((entry) => entry.backupPath !== null);
    expect(backupEntries).not.toHaveLength(0);
    for (const entry of backupEntries) {
      expect(entry.backupPath).toMatch(/^backups\//);
      expect(entry.backupPath).not.toContain("\\\\");
    }
    expect(parseTransactionJournal(journal, journal.transactionId, sha256(resolve(repository.root))).kind).toBe("current");
    const malformed = {
      ...journal,
      entries: journal.entries.map((entry) => entry.backupPath === null ? entry : { ...entry, backupPath: `backups\\${entry.relativePath}` }),
    };
    expect(parseTransactionJournal(malformed, journal.transactionId, sha256(resolve(repository.root))).kind).toBe("invalid");

    await expect(recoverInterruptedTransaction(repository.root)).resolves.toMatchObject({ kind: "recovered", disposition: "restored-prior" });
    expect(JSON.parse(await readFile(configPath, "utf8"))).toMatchObject({ project: initialConfig.project, selectedAgents: ["codex"] });
    await expect(readFile(codexPath, "utf8")).resolves.toBe(codexBefore);
    await expect(readFile(join(repository.root, ".claude", "skills", "exspecso-start", "SKILL.md"), "utf8")).rejects.toThrow();
    await expect(readdir(join(repository.root, ".exspecso", ".staging"))).rejects.toThrow();
  });
});
