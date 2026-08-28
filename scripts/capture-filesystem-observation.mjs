import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync, statfsSync, writeFileSync } from "node:fs";

function option(name) {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`${name} is required`);
  return process.argv[index + 1];
}
function normalizedHex(value) { return `0x${value.toString(16).padStart(8, "0")}`; }
function unescapeMountPath(value) { return value.replace(/\\([0-7]{3})/g, (_match, octal) => String.fromCharCode(Number.parseInt(octal, 8))); }
function matchingMountinfo(path) {
  const resolved = realpathSync(path);
  const lines = readFileSync("/proc/self/mountinfo", "utf8").trim().split("\n");
  const candidates = lines.map((line) => ({ line, mountpoint: unescapeMountPath(line.split(" - ", 1)[0].split(" ")[4] ?? "") }))
    .filter(({ mountpoint }) => resolved === mountpoint || resolved.startsWith(`${mountpoint}/`))
    .sort((left, right) => right.mountpoint.length - left.mountpoint.length);
  return candidates.length ? [candidates[0].line] : [];
}
function statText(path) {
  try { return execFileSync("stat", ["-f", "-c", "%T", path], { encoding: "utf8" }).trim(); }
  catch (error) { return `unavailable:${error instanceof Error ? error.message : "stat failed"}`; }
}
function observe(path) {
  const resolved = realpathSync(path);
  const raw = BigInt(statfsSync(resolved, { bigint: true }).type);
  const normalized = BigInt.asUintN(32, raw);
  return {
    path: resolved,
    rawMagicDecimal: raw.toString(),
    normalizedMagicDecimal: normalized.toString(),
    normalizedMagicHex: normalizedHex(normalized),
    mapping: normalized === 0xef53n ? "ext2/ext3" : "unapproved",
    statText: statText(resolved),
    mountinfo: matchingMountinfo(resolved),
  };
}
const fixtureRoot = option("--fixture-root");
const output = option("--out");
const workRoot = process.argv.includes("--work-root") ? option("--work-root") : "/work";
const tmpRoot = process.argv.includes("--tmp-root") ? option("--tmp-root") : "/tmp";
writeFileSync(output, JSON.stringify({ schemaVersion: 1, fixtureRoot: observe(fixtureRoot), work: observe(workRoot), tmp: observe(tmpRoot) }, null, 2) + "\n");
