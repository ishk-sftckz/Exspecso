// Run after npm run build. Discovery only: no user prompts or model turns.
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { ADAPTER_REGISTRY } from "../../../dist/adapters/registry.js";

const work = await realpath(await mkdtemp(join(tmpdir(), "exspecso-native-discovery-")));
const description = "Begin Exspecso project orientation from the canonical repository artifacts.";
const results = [];

async function probe(runtime, layout, cwd, skillPath) {
  const isCodex = runtime === "codex";
  const args = isCodex
    ? ["app-server", "--stdio", "-c", "analytics.enabled=false"]
    : ["--print", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose", "--no-session-persistence", "--setting-sources", "project", "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}', "--tools", ""];
  const environment = { ...process.env };
  if (!isCodex) {
    environment.CLAUDE_CONFIG_DIR = join(work, "claude-config");
    environment.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "1";
  }
  const child = spawn(runtime, args, { cwd, env: environment, stdio: ["pipe", "pipe", "pipe"] });
  const closed = new Promise((resolve) => child.once("close", resolve));
  const lines = createInterface({ input: child.stdout });
  const send = (message) => child.stdin.write(JSON.stringify(message) + "\n");
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  try {
    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`${runtime} discovery timed out: ${stderr}`)), 20000);
      const finish = (value, error) => {
        clearTimeout(timeout);
        if (error) reject(error); else resolve(value);
      };
      child.once("error", (error) => finish(null, error));
      child.once("close", (code) => finish(null, new Error(`${runtime} exited before discovery (${code}): ${stderr}`)));
      lines.on("line", (line) => {
        let message;
        try { message = JSON.parse(line); } catch { return; }
        if (isCodex && message.id === 1) {
          if (message.error) return finish(null, new Error(JSON.stringify(message.error)));
          send({ method: "initialized", params: {} });
          send({ id: 2, method: "skills/list", params: { cwds: [cwd], forceReload: true } });
        } else if (isCodex && message.id === 2) {
          if (message.error) return finish(null, new Error(JSON.stringify(message.error)));
          const entries = message.result.data;
          const skills = entries.flatMap((entry) => entry.skills).filter((skill) => skill.path === skillPath);
          const errors = entries.flatMap((entry) => entry.errors).filter((error) => error.path === skillPath);
          finish({ runtime, layout, skills, errors });
        } else if (!isCodex && message.type === "control_response" && message.response.request_id === "discovery") {
          if (message.response.subtype === "error") return finish(null, new Error(JSON.stringify(message.response)));
          const commands = message.response.response.commands.filter((command) => command.name === "exspecso-start");
          finish({ runtime, layout, commands });
        }
      });
      send(isCodex
        ? { id: 1, method: "initialize", params: { clientInfo: { name: "exspecso_discovery_check", version: "1.0.0" }, capabilities: null } }
        : { type: "control_request", request_id: "discovery", request: { subtype: "initialize", hooks: null } });
    });
  } finally {
    lines.close();
    child.stdin.end();
    child.kill("SIGTERM");
    const kill = setTimeout(() => child.kill("SIGKILL"), 2000);
    await closed;
    clearTimeout(kill);
  }
}

try {
  for (const runtime of ["codex", "claude"]) {
    const version = execFileSync(runtime, ["--version"], { encoding: "utf8" }).trim();
    for (const layout of ["legacy", "native"]) {
      const cwd = join(work, runtime, layout);
      const adapter = ADAPTER_REGISTRY[runtime];
      const skillPath = join(cwd, adapter.relativePath);
      const generated = adapter.render();
      const marker = generated.match(/<!-- exspecso:managed[^\n]*\n/)[0];
      const content = layout === "native" ? generated : marker + generated.replace(marker, "");
      await mkdir(dirname(skillPath), { recursive: true });
      execFileSync("git", ["init", "--quiet", cwd]);
      await writeFile(skillPath, content);
      const result = { version, inputSha256: createHash("sha256").update(content).digest("hex"), ...await probe(runtime, layout, cwd, skillPath) };
      assert.equal(await readFile(skillPath, "utf8"), content);
      if (layout === "native") {
        const metadata = runtime === "codex" ? result.skills : result.commands;
        assert.equal(metadata.length, 1);
        assert.equal(metadata[0].name, "exspecso-start");
        // Claude appends a source label to descriptions in its command list.
        assert.ok(metadata[0].description.startsWith(description));
        if (runtime === "codex") assert.deepEqual(result.errors, []);
      }
      results.push(result);
      console.log(JSON.stringify(result));
    }
  }
  await writeFile(join(dirname(fileURLToPath(import.meta.url)), "native-discovery.json"), JSON.stringify({ checkedAt: new Date().toISOString(), node: process.version, modelTurns: 0, results }, null, 2) + "\n");
} finally {
  await rm(work, { recursive: true, force: true });
}
