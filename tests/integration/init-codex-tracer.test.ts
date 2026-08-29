import { createHash } from "node:crypto";
import { cp, link, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, delimiter, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { findGitRoot } from "../../src/filesystem/git-root.js";
import { createGitFixture, createNoGitFixture, type GitFixture } from "../helpers/git-fixture.js";
import { runCli } from "../helpers/run-cli.js";
import { inspectInstalledPackage, installContainedPackage, installVulnerablePackage, runAtHistoricalReplacement, runAtNativeReplacement, runNpm } from "../helpers/containment-fixture.js";

const temporaryPaths: string[] = [];
const fixtures: GitFixture[] = [];
const packageRoot = resolve(import.meta.dirname, "../..");
const tracerTimeout = process.platform === "win32" ? 240_000 : 60_000;

afterEach(async () => {
  await Promise.all(temporaryPaths.splice(0).map((path) => rm(path, { force: true, recursive: true })));
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
});

async function createTemporaryDirectory(prefix: string): Promise<string> {
  const configured = process.env.EXSPECSO_TEST_TMPDIR;
  const parent = configured === undefined ? tmpdir() : configured;
  if (configured !== undefined && (!isAbsolute(parent) || resolve(parent) !== parent)) throw new Error("EXSPECSO_TEST_TMPDIR must be an absolute canonical test fixture path");
  await mkdir(parent, { recursive: true });
  const path = await mkdtemp(join(parent, prefix));
  temporaryPaths.push(path);
  return path;
}

async function useFixture(factory: () => Promise<GitFixture>): Promise<GitFixture> {
  const fixture = await factory();
  fixtures.push(fixture);
  return fixture;
}

async function repositorySnapshot(root: string): Promise<Record<string, string>> {
  const entries: Record<string, string> = {};
  for (const relativePath of await readdir(root, { recursive: true })) {
    const path = join(root, relativePath);
    const entry = await lstat(path);
    entries[relativePath] = entry.isFile()
      ? `file:${createHash("sha256").update(await readFile(path)).digest("hex")}`
      : entry.isDirectory() ? "directory" : `other:${entry.mode}`;
  }
  return Object.fromEntries(Object.entries(entries).sort(([left], [right]) => left.localeCompare(right)));
}

async function installPackedRelease(): Promise<{ installed: Awaited<ReturnType<typeof inspectInstalledPackage>>; tarballSHA256: string; installation: { offline: boolean; ignoreScripts: boolean; sanitizedLoaderPaths: boolean; compilerAndHeadersUnavailable: boolean } }> {
  const packingDirectory = await createTemporaryDirectory("exspecso-pack-");
  await runNpm(["run", "build"], { cwd: packageRoot });
  const staged = join(packingDirectory, "package");
  const cache = join(packingDirectory, "npm-cache");
  const prefetch = join(packingDirectory, "prefetch");
  const userconfig = join(packingDirectory, "npmrc");
  await mkdir(staged, { recursive: true });
  await cp(join(packageRoot, "dist"), join(staged, "dist"), { recursive: true });
  const { scripts: _developmentScripts, ...publishedPackage } = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
  publishedPackage.files = ["dist", "npm-shrinkwrap.json"];
  await writeFile(join(staged, "package.json"), `${JSON.stringify(publishedPackage, null, 2)}\n`);
  await cp(join(packageRoot, "package-lock.json"), join(staged, "npm-shrinkwrap.json"));
  await writeFile(userconfig, "");
  await mkdir(prefetch, { recursive: true });
  await cp(join(packageRoot, "package.json"), join(prefetch, "package.json"));
  await cp(join(packageRoot, "package-lock.json"), join(prefetch, "package-lock.json"));
  await runNpm(["ci", "--ignore-scripts", "--cache", cache, "--prefer-offline", "--userconfig", userconfig], { cwd: prefetch });
  const locked = JSON.parse(await readFile(join(packageRoot, "package-lock.json"), "utf8")) as { packages: Record<string, { version?: string; dependencies?: Record<string, string> }> };
  const packages: string[] = [];
  const visit = (name: string) => {
    const entry = locked.packages[`node_modules/${name}`];
    if (!entry?.version || packages.some((specification) => specification.startsWith(`${name}@`))) return;
    packages.push(`${name}@${entry.version}`);
    for (const dependency of Object.keys(entry.dependencies ?? {})) visit(dependency);
  };
  for (const dependency of Object.keys(locked.packages[""]?.dependencies ?? {})) visit(dependency);
  await runNpm(["cache", "add", "--cache", cache, "--prefer-offline", "--userconfig", userconfig, ...packages], { cwd: prefetch });
  const { stdout: packOutput } = await runNpm(
    ["pack", "--json", "--pack-destination", packingDirectory],
    { cwd: staged },
  );
  const [{ filename }] = JSON.parse(packOutput) as Array<{ filename: string }>;
  const runner = await createTemporaryDirectory("exspecso-runner-");
  const isolatedEnvironment = {
    ...process.env,
    NODE_OPTIONS: "",
    NODE_PATH: "",
    PATH: [dirname(process.execPath), process.env.PATH ?? ""].filter(Boolean).join(delimiter),
    EXSPECSO_NODE_HEADERS: join(packingDirectory, "compiler-and-headers-unavailable"),
    npm_config_userconfig: userconfig,
  };
  await runNpm(
    ["install", "--offline", "--ignore-scripts", "--no-package-lock", "--cache", cache, "--userconfig", userconfig, "--prefix", runner, join(packingDirectory, filename)],
    { env: isolatedEnvironment },
  );
  const installed = await inspectInstalledPackage(join(runner, "node_modules/exspecso"));
  return { installed, tarballSHA256: createHash("sha256").update(await readFile(join(packingDirectory, filename))).digest("hex"), installation: { offline: true, ignoreScripts: true, sanitizedLoaderPaths: true, compilerAndHeadersUnavailable: true } };
}

async function packAndRun(
  cwd: string,
  args: string[] = ["init", "--agent", "codex"],
): Promise<{ exitCode: number; stdout: string; stderr: string; installed: Awaited<ReturnType<typeof inspectInstalledPackage>>; tarballSHA256: string; installation: { offline: boolean; ignoreScripts: boolean; sanitizedLoaderPaths: boolean; compilerAndHeadersUnavailable: boolean } }> {
  const packed = await installPackedRelease();
  const isolatedEnvironment = {
    ...process.env,
    NODE_OPTIONS: "",
    NODE_PATH: "",
    PATH: [dirname(process.execPath), process.env.PATH ?? ""].filter(Boolean).join(delimiter),
    EXSPECSO_NODE_HEADERS: join(tmpdir(), "compiler-and-headers-unavailable"),
  };
  const result = await runCli(process.execPath, [join(packed.installed.installed, "dist/cli/main.js"), ...args], { cwd, env: isolatedEnvironment });
  return { ...result, ...packed };
}

describe("packed Codex initializer tracer", () => {
  it("PK-03 prebuilt install runs a scripts-disabled tarball offline outside the checkout for root and nested CLI runs", async () => {
    const fixture = await useFixture(createGitFixture);
    const nested = await fixture.createNestedDirectory("packages", "cli", "deep");
    const rootRun = await packAndRun(fixture.root);
    const nestedRun = await packAndRun(nested, ["init", "--agent", "claude"]);
    const installation = rootRun as typeof rootRun & { installation?: { offline: boolean; ignoreScripts: boolean; sanitizedLoaderPaths: boolean; compilerAndHeadersUnavailable: boolean } };

    expect(rootRun.exitCode, rootRun.stderr).toBe(0);
    expect(nestedRun.exitCode, nestedRun.stderr).toBe(0);
    expect(installation.installation).toEqual({
      offline: true,
      ignoreScripts: true,
      sanitizedLoaderPaths: true,
      compilerAndHeadersUnavailable: true,
    });
    expect(rootRun.installed.provider).toContain(join("node_modules", "exspecso", "dist", "native"));
    expect(await realpath(rootRun.installed.installed)).not.toBe(await realpath(packageRoot));
    expect(rootRun.installed.sha256).toBe(rootRun.installed.manifest.targets[0].sha256);
    expect(rootRun.installed.provenance.binarySHA256).toBe(rootRun.installed.sha256);
    const publishedPackage = JSON.parse(await readFile(join(rootRun.installed.installed, "package.json"), "utf8"));
    expect(publishedPackage.private).toBe(true);
    expect(publishedPackage.engines.node).toBe("^20.19.0 || ^22.13.0 || ^24.0.0 || 25.2.1 || ^26.0.0");
    expect(publishedPackage.scripts).toBeUndefined();
    await expect(readFile(join(rootRun.installed.installed, "npm-shrinkwrap.json"), "utf8")).resolves.toContain("lockfileVersion");
  }, tracerTimeout);

  it("PK-04 provider unavailable rejects missing, corrupt, or manifest-swapped providers before exact repository mutation", async () => {
    for (const kind of ["missing", "corrupt", "manifest-swap"] as const) {
      const fixture = await useFixture(createGitFixture);
      const packed = await installPackedRelease();
      const installed = packed.installed;
      const before = await repositorySnapshot(fixture.root);
      const releaseBytes = await readFile(installed.provider);
      for (const marker of ["EXSPECSO_CONTAINMENT_TEST_OPERATION", "EXSPECSO_CONTAINMENT_TEST_CHANNEL_ID", "EXSPECSO_CONTAINMENT_TEST_CONTROLLER_PID", "exspecso-containment-", "BCryptGenRandom"]) expect(releaseBytes.includes(Buffer.from(marker))).toBe(false);
      if (kind === "missing") await rename(installed.provider, `${installed.provider}.removed`);
      if (kind === "corrupt") await writeFile(installed.provider, "corrupt provider bytes");
      if (kind === "manifest-swap") {
        const manifestPath = join(installed.installed, "dist/native/manifest.json");
        const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
        manifest.targets[0].sha256 = "0".repeat(64);
        await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      }
      const result = await runCli(process.execPath, [join(installed.installed, "dist/cli/main.js"), "init", "--agent", "codex"], { cwd: fixture.root });
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("EXSPECSO_CONTAINMENT_UNAVAILABLE");
      expect(await repositorySnapshot(fixture.root)).toEqual(before);
    }
  }, tracerTimeout);

  for (const site of ["leaf", "parent", "ancestor"] as const) {
    it(`contained promotion tracer reaches the native ${site} substitution boundary`, async () => {
      const fixture = await useFixture(createGitFixture);
      const historical = process.env.EXSPECSO_RUN_VULNERABLE_TRACER === "1" ? await installVulnerablePackage() : undefined;
      if (historical) temporaryPaths.push(historical.directory);
      let release: Awaited<ReturnType<typeof packAndRun>> | undefined;
      const initial = historical
        ? await runCli(process.execPath, [historical.cli, "init", "--agent", "codex"], { cwd: fixture.root })
        : (release = await packAndRun(fixture.root));
      expect(initial.exitCode, `initial ${historical ? "historical" : "release"} CLI stderr:\n${initial.stderr}`).toBe(0);
      if (release) {
        expect(release.installed.manifest.variant).toBe("release");
        expect(release.installed.sha256).toBe(release.installed.manifest.targets[0].sha256);
        expect(await realpath(fixture.root)).not.toBe(await realpath(release.installed.installed));
        console.log(JSON.stringify({ family: "TR-02", mode: "uninstrumented release CLI", provider: release.installed.provider, providerSHA256: release.installed.sha256, tarballSHA256: release.tarballSHA256, manifest: release.installed.manifest, provenance: release.installed.provenance, packageInventory: release.installed.packageInventory, exitCode: release.exitCode }));
      }
      const relativeAdapter = ".agents/skills/exspecso-start/SKILL.md";
      const adapter = join(fixture.root, relativeAdapter);
      await writeFile(adapter, "user-modified adapter\n");
      const outside = await createTemporaryDirectory("exspecso-sentinel-");
      const externalTarget = site === "ancestor" ? join(outside, "exspecso-start", "SKILL.md") : join(outside, "SKILL.md");
      if (site === "ancestor") await mkdir(join(outside, "exspecso-start"));
      await writeFile(externalTarget, "external sentinel\n");
      const outsideInventory = await readdir(outside, { recursive: true });
      const installed = historical ? undefined : await installContainedPackage("test");
      if (installed) temporaryPaths.push(installed.directory);
      const moved = join(fixture.root, "held-original");
      const relocationDirectory = site === "leaf" ? undefined : join(fixture.root, site === "parent" ? ".agents/skills/exspecso-start" : ".agents/skills");
      const attack = async () => {
        if (site === "leaf") {
          await rename(adapter, moved);
          await symlink(externalTarget, adapter);
        } else {
          try {
            await rename(relocationDirectory!, moved);
          } catch (error) {
            const blocked = error as NodeJS.ErrnoException & { stage?: string };
            blocked.stage = "directory-rename";
            throw blocked;
          }
          await symlink(outside, relocationDirectory!, "dir");
        }
      };
      if (historical) {
        const result = await runAtHistoricalReplacement(historical.cli, fixture.root, attack);
        expect(await realpath(fileURLToPath(result.record.module))).toBe(await realpath(historical.module));
        const externalBytes = await readFile(externalTarget, "utf8");
        console.log(JSON.stringify({ family: "TR-01-RED", site, mode: "instrumented historical CLI", ...historical.provenance, reached: result.record, exitCode: result.exitCode, externalChanged: externalBytes !== "external sentinel\n" }));
        expect(externalBytes).toBe("external sentinel\n");
        return;
      }
      if (!installed || !release) throw new Error("Missing installed package");
      expect(installed.packageInventory).toEqual(release.installed.packageInventory);
      const result = await runAtNativeReplacement(installed.cli, fixture.root, attack, installed, { allowBlockedRelocation: site !== "leaf" });
      expect(result.record.op).toBe("replace:before");
      expect(await readFile(externalTarget, "utf8")).toBe("external sentinel\n");
      expect(installed.provider).toContain(join("node_modules", "exspecso", "dist", "native"));
      expect(await realpath(result.record.providerpath)).toBe(installed.provider);
      if (site === "leaf") {
        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toContain("EXSPECSO_CONTAINMENT");
        expect(result.stdout).toBe("");
      } else if (result.attackBlocked) {
        // On Windows the held native directory prevents this controller-side
        // relocation. This is recorded as an unscheduled limitation case, not
        // as evidence that a moved object followed the held authority.
        expect(result.attackBlocked.code).toBe("EPERM");
        expect(result.attackBlocked.stage).toBe("directory-rename");
        expect(result.exitCode).toBe(0);
        expect((await lstat(relocationDirectory!)).isDirectory()).toBe(true);
        await expect(lstat(moved)).rejects.toThrow();
        expect(await readFile(externalTarget, "utf8")).toBe("external sentinel\n");
        expect(await readdir(outside, { recursive: true })).toEqual(outsideInventory);
        expect(await readFile(adapter, "utf8")).toContain("exspecso-start");
      } else {
        // Approved limitation: the held original object can be written after relocation.
        expect(result.exitCode).toBe(0);
        const heldTarget = site === "parent" ? join(moved, "SKILL.md") : join(moved, "exspecso-start", "SKILL.md");
        expect(await readFile(heldTarget, "utf8")).toContain("exspecso-start");
      }
      console.log(JSON.stringify({ family: "TR-01", site, mode: "instrumented", attackOutcome: result.attackBlocked ? "blocked-before-relocation" : "scheduled", relocationPerformed: !result.attackBlocked, movedObjectOracle: result.attackBlocked ? "not exercised" : site === "leaf" ? "not applicable" : "held-object relocation observed", attackBlocked: result.attackBlocked, provider: installed.provider, providerSHA256: installed.sha256, providerManifest: installed.manifest, tarballSHA256: installed.tarballSHA256, provenance: installed.provenance, packageInventory: installed.packageInventory, reached: result.record, exitCode: result.exitCode }));
    }, tracerTimeout);
  }

  it("contained promotion tracer rejects incomplete test activation before replacement", async () => {
    const fixture = await useFixture(createGitFixture);
    const release = await packAndRun(fixture.root);
    const installed = await installContainedPackage("test");
    temporaryPaths.push(installed.directory);
    const adapter = join(fixture.root, ".agents/skills/exspecso-start/SKILL.md");
    await writeFile(adapter, "user-modified adapter\n");
    const child = await runCli(process.execPath, [installed.cli, "init", "--agent", "codex", "--replace-agent", "codex"], {
      cwd: fixture.root,
      env: { ...process.env, EXSPECSO_CONTAINMENT_TEST_OPERATION: "replace:before" },
    });
    expect(release.exitCode).toBe(0);
    expect(child.exitCode).not.toBe(0);
    expect(child.stderr).toContain("EXSPECSO_CONTAINMENT");
    expect(await readFile(adapter, "utf8")).toBe("user-modified adapter\n");
  }, tracerTimeout);

  it("contained promotion tracer preserves an external hardlink during an additive rerun", async () => {
    const fixture = await useFixture(createGitFixture);
    expect((await packAndRun(fixture.root)).exitCode).toBe(0);
    const config = join(fixture.root, ".exspecso", "exspecso.config.json");
    const before = await readFile(config, "utf8");
    const outside = await createTemporaryDirectory("exspecso-external-");
    const sentinel = join(outside, "prior-config.json");
    await link(config, sentinel);

    const result = await packAndRun(fixture.root, ["init", "--agent", "claude"]);

    expect(result.exitCode).toBe(0);
    expect(await readFile(config, "utf8")).not.toBe(before);
    expect(await readFile(sentinel, "utf8")).toBe(before);
  }, tracerTimeout);

  it("creates only the canonical foundation and Codex adapter", async () => {
    const fixture = await useFixture(createGitFixture);
    const repositoryRoot = fixture.root;

    const result = await packAndRun(repositoryRoot);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toMatch(/^\/exspecso-start/);
    expect(result.stdout).toContain("$exspecso-start");
    expect(result.stdout).not.toContain("/exspecso-start for Claude");
    expect(result.stdout).not.toContain("/exspecso-start for OpenCode");

    const configPath = join(repositoryRoot, ".exspecso", "exspecso.config.json");
    const constitutionPath = join(repositoryRoot, ".exspecso", "constitution.md");
    const adapterPath = join(repositoryRoot, ".agents", "skills", "exspecso-start", "SKILL.md");
    const config = JSON.parse(await readFile(configPath, "utf8")) as {
      schemaVersion: number;
      project: { id: string; title: string };
      mode: string;
      selectedAgents: string[];
      onboardingStatus: string;
    };

    expect(config).toMatchObject({
      schemaVersion: 1,
      project: { title: basename(repositoryRoot) },
      mode: "unclassified",
      selectedAgents: ["codex"],
      onboardingStatus: "not-started",
    });
    expect(config.project.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    const constitution = await readFile(constitutionPath, "utf8");
    expect(constitution).toContain("Artifact truth");
    expect(constitution).toContain("Human control");
    expect(constitution).toContain("Evidence integrity");
    expect(constitution).toContain("Bounded scope");
    expect(constitution).toContain("Runtime portability");

    const adapter = await readFile(adapterPath, "utf8");
    expect(adapter).toMatch(/template-version=1 original-body-sha256=[a-f0-9]{64}/);
    expect(adapter).toContain("exspecso-start");

    await expect(readFile(join(repositoryRoot, ".exspecso", "roadmap.md"), "utf8")).rejects.toThrow();
    await expect(writeFile(join(repositoryRoot, "unrelated.txt"), "unchanged")).resolves.toBeUndefined();
  });

  it("returns an error before writing when the selected agent is unsupported", async () => {
    const fixture = await useFixture(createGitFixture);
    const repositoryRoot = fixture.root;

    const result = await packAndRun(repositoryRoot, ["init", "--agent", "unknown"]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("EXSPECSO_INIT_INVALID_AGENT");
    await expect(readFile(join(repositoryRoot, ".exspecso", "exspecso.config.json"), "utf8")).rejects.toThrow();
    await expect(readFile(join(repositoryRoot, ".agents", "skills", "exspecso-start", "SKILL.md"), "utf8")).rejects.toThrow();
  });

  it("resolves the containing Git root before initialization", async () => {
    const fixture = await useFixture(createGitFixture);
    const nestedDirectory = await fixture.createNestedDirectory("packages", "cli", "deep");
    const canonicalRoot = await realpath(fixture.root);

    await expect(findGitRoot(fixture.root)).resolves.toBe(canonicalRoot);
    await expect(findGitRoot(nestedDirectory)).resolves.toBe(canonicalRoot);
  });

  it("initializes at the nearest containing Git root from a deep nested cwd", async () => {
    const fixture = await useFixture(createGitFixture);
    const nestedDirectory = await fixture.createNestedDirectory("packages", "cli", "deep");

    const result = await packAndRun(nestedDirectory);

    expect(result.exitCode).toBe(0);
    await expect(readFile(join(fixture.root, ".exspecso", "exspecso.config.json"), "utf8")).resolves.toContain("unclassified");
    await expect(readFile(join(nestedDirectory, ".exspecso", "exspecso.config.json"), "utf8")).rejects.toThrow();
  });

  it("uses a nested Git repository instead of its parent repository", async () => {
    const fixture = await useFixture(createGitFixture);
    const nestedRepository = await fixture.createNestedRepository("packages", "module");
    const nestedDirectory = await fixture.createNestedDirectory("packages", "module", "src", "deep");

    const result = await packAndRun(nestedDirectory);

    expect(result.exitCode).toBe(0);
    await expect(readFile(join(nestedRepository, ".exspecso", "exspecso.config.json"), "utf8")).resolves.toContain("unclassified");
    await expect(readFile(join(fixture.root, ".exspecso", "exspecso.config.json"), "utf8")).rejects.toThrow();
  });

  it("reports a repairable no-repository diagnostic without writes", async () => {
    const fixture = await useFixture(createNoGitFixture);
    const nestedDirectory = await fixture.createNestedDirectory("work", "deep");

    const result = await packAndRun(nestedDirectory);

    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("EXSPECSO_INIT_NO_GIT_ROOT");
    expect(result.stderr).toContain(resolve(nestedDirectory));
    expect(result.stderr).toContain("git init");
    expect(result.stderr).toContain("move into the intended repository");
    await expect(readFile(join(nestedDirectory, ".exspecso", "exspecso.config.json"), "utf8")).rejects.toThrow();
  });
});
