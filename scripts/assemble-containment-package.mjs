import { createHash } from "node:crypto";
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const expectedEngine = "^20.19.0 || ^22.13.0 || ^24.0.0 || 25.2.1 || ^26.0.0";
const values = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (!['--matrix', '--input', '--out', '--build-commit'].includes(key) || values.has(key) || !value) throw new Error("Invalid assembly arguments");
  values.set(key, value);
}

const matrixPath = resolve(values.get('--matrix') ?? join(root, 'native/support-matrix.json'));
const input = values.get('--input') && resolve(values.get('--input'));
const output = values.get('--out') && resolve(values.get('--out'));
const buildCommit = values.get('--build-commit');
if (!input || !output || !buildCommit || !/^[a-f0-9]{40}$/.test(buildCommit)) throw new Error("--input, --out, and an exact 40-hex --build-commit are required");

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const fail = (message) => { throw new Error(`EXSPECSO_PACKAGE_ASSEMBLY: ${message}`); };

function validatePackageMetadata(metadata) {
  if (metadata.private !== true) fail('package must remain private');
  if (metadata.engines?.node !== expectedEngine) fail('package engine is not the approved ten-lane policy');
  for (const lifecycle of ['preinstall', 'install', 'postinstall']) if (metadata.scripts?.[lifecycle]) fail(`package must not define ${lifecycle}`);
  if (!Array.isArray(metadata.files) || metadata.files.length !== 1 || metadata.files[0] !== 'dist') fail('package must expose only dist');
}

function validateMatrix(matrix) {
  if (matrix?.schemaVersion !== 2 || !Array.isArray(matrix.rows) || matrix.rows.length === 0) fail('support matrix is invalid');
  const ids = new Set();
  for (const row of matrix.rows) {
    if (!row || typeof row.id !== 'string' || typeof row.target !== 'string' || !row.os || typeof row.os.family !== 'string' || typeof row.os.version !== 'string' || typeof row.cpu !== 'string' || typeof row.libc !== 'string' || typeof row.filesystem !== 'string' || typeof row.toolchain !== 'string') fail('support matrix contains an invalid row');
    if (ids.has(row.id)) fail(`duplicate support row ${row.id}`);
    ids.add(row.id);
  }
  if (matrix.nodePolicy?.engine !== expectedEngine || matrix.nodePolicy?.napi !== 8 || !Array.isArray(matrix.nodePolicy?.testedVersions) || matrix.nodePolicy.testedVersions.length !== 10) fail('support matrix does not retain the approved Node policy');
}

function exactInputRows(matrix) {
  if (!existsSync(input) || !lstatSync(input).isDirectory()) fail('release artifact input directory is missing');
  const expected = new Set(matrix.rows.map((row) => row.id));
  for (const entry of readdirSync(input)) if (!expected.has(entry)) fail(`unexpected release artifact support row ${entry}`);
  return expected;
}

function rowArtifact(row) {
  const directory = join(input, row.id, row.target);
  const binary = join(directory, 'contained-fs.node');
  const provenancePath = join(directory, 'build-provenance.json');
  if (!existsSync(binary) || !lstatSync(binary).isFile() || !existsSync(provenancePath) || !lstatSync(provenancePath).isFile()) fail(`missing release artifact for support row ${row.id}`);
  const entries = readdirSync(directory).sort();
  if (entries.length !== 2 || entries[0] !== 'build-provenance.json' || entries[1] !== 'contained-fs.node') fail(`duplicate release artifact for support row ${row.id}`);
  const provenance = readJson(provenancePath);
  if (provenance.supportRowId !== row.id || provenance.target !== row.target || provenance.variant !== 'release' || provenance.buildCommit !== buildCommit || provenance.toolchain !== row.toolchain) fail(`release provenance does not match support row ${row.id}`);
  const bytes = readFileSync(binary);
  if (provenance.binarySHA256 !== undefined && provenance.binarySHA256 !== hash(bytes)) fail(`release provenance checksum does not match support row ${row.id}`);
  return { bytes, sha256: hash(bytes), byteLength: bytes.length };
}

function cleanPackageTree(metadata) {
  if (existsSync(output)) fail('output package directory already exists');
  mkdirSync(output, { recursive: false });
  const { scripts: _developmentScripts, ...publishedMetadata } = metadata;
  writeFileSync(join(output, 'package.json'), JSON.stringify(publishedMetadata, null, 2) + '\n');
  cpSync(join(root, 'dist'), join(output, 'dist'), { recursive: true });
  const native = join(output, 'dist', 'native');
  if (existsSync(native)) {
    const entries = readdirSync(native);
    for (const entry of entries) {
      const path = join(native, entry);
      if (lstatSync(path).isDirectory()) {
        rmSync(path, { recursive: true, force: false });
      } else {
        unlinkSync(path);
      }
    }
  } else mkdirSync(native, { recursive: true });
  return native;
}

const matrix = readJson(matrixPath);
const metadata = readJson(join(root, 'package.json'));
validateMatrix(matrix);
validatePackageMetadata(metadata);
exactInputRows(matrix);
const native = cleanPackageTree(metadata);
const targets = matrix.rows.map((row) => {
  const artifact = rowArtifact(row);
  const path = `${row.id}/${row.target}/contained-fs.node`;
  const destination = join(native, path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, artifact.bytes, { flag: 'wx' });
  return {
    supportRowId: row.id,
    target: row.target,
    platform: row.target.split('-')[0],
    arch: row.target.slice(row.target.indexOf('-') + 1),
    osVersion: row.os.version,
    osBuild: row.os.build ?? row.os.kernel ?? '',
    filesystem: row.filesystem,
    libc: row.libc,
    napiVersion: matrix.nodePolicy.napi,
    byteLength: artifact.byteLength,
    sha256: artifact.sha256,
    path,
  };
});

writeFileSync(join(native, 'support-matrix.json'), JSON.stringify(matrix, null, 2) + '\n');
writeFileSync(join(native, 'manifest.json'), JSON.stringify({ schemaVersion: 2, packageVersion: metadata.version, buildCommit, variant: 'release', targets }, null, 2) + '\n');
console.log(JSON.stringify({ output, targets: targets.map((entry) => ({ supportRowId: entry.supportRowId, sha256: entry.sha256, path: entry.path })) }));
