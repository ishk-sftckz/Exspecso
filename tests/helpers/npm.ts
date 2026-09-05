import { spawn } from "node:child_process";
import { dirname, join } from "node:path";

/** Invoke npm's JavaScript entry point so Windows never has to spawn a .cmd shim. */
export function runNpm(args: readonly string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
  const npmCli = process.env.npm_execpath ?? join(
    dirname(process.execPath),
    process.platform === "win32" ? "node_modules/npm/bin/npm-cli.js" : "../lib/node_modules/npm/bin/npm-cli.js",
  );
  const env = { ...process.env };
  delete env.NODE_PATH;
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [npmCli, ...args], { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`npm ${args.join(" ")} failed (${code}): ${stderr || stdout}`));
    });
  });
}
