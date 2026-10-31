// Run: node tests/zip-roundtrip.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const core = require('../src/core.js');
const build = require('./fixture-golden.js');

function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = crc & 1 ? 0xEDB88320 ^ (crc >>> 1) : crc >>> 1; }
  return (~crc) >>> 0;
}

function readZip(bytes) {
  const entries = [], expected = [];
  let offset = 0;
  while (bytes.readUInt32LE(offset) === 0x04034b50) {
    const method = bytes.readUInt16LE(offset + 8), crc = bytes.readUInt32LE(offset + 14), size = bytes.readUInt32LE(offset + 22), nameLength = bytes.readUInt16LE(offset + 26), extraLength = bytes.readUInt16LE(offset + 28);
    const name = bytes.subarray(offset + 30, offset + 30 + nameLength).toString('utf8'), start = offset + 30 + nameLength + extraLength;
    assert.equal(method, 0, 'UI ZIP stores entries without compression'); const data = bytes.subarray(start, start + size);
    assert.equal(crc32(data), crc, 'CRC matches for ' + name); entries.push({ name, data }); expected.push(name);
    offset = start + size;
  }
  assert.equal(bytes.readUInt32LE(offset), 0x02014b50, 'central directory follows local entries');
  const eocd = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(eocd > offset); assert.equal(bytes.readUInt16LE(eocd + 10), entries.length, 'ZIP entry count matches');
  return new Map(entries.map(entry => [entry.name, entry.data]));
}

function tree(root, prefix) {
  const out = {};
  fs.readdirSync(root, { withFileTypes: true }).forEach(entry => {
    const relative = prefix ? prefix + '/' + entry.name : entry.name;
    if (entry.isDirectory()) Object.assign(out, tree(path.join(root, entry.name), relative));
    else out[relative] = fs.readFileSync(path.join(root, entry.name), 'utf8');
  });
  return out;
}

function compareArchive(intended, archive) {
  const missing = [...intended.keys()].filter(file => !archive.has(file)), unexpected = [...archive.keys()].filter(file => !intended.has(file)), changed = [];
  [...intended.entries()].filter(([file]) => archive.has(file)).forEach(([file, value]) => { if (!Buffer.from(value).equals(archive.get(file))) changed.push(file); });
  return { missing, unexpected, changed };
}

(async () => {
  const { verifyPackage } = await import(pathToFileURL(path.join(__dirname, '..', 'scripts', 'verify.mjs')).href);
  const model = build(), png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
  model.refEmbed = false; model.refs.forEach((ref, i) => { ref.files = [{ path: 'assets/pixel-' + (i + 1) + '.png', base64: png.toString('base64') }]; });
  const generated = core.gen(model, 'full', [], []), intended = new Map(generated.map(file => [file.path, file.binary ? Buffer.from(file.content, 'base64') : Buffer.from(file.content)]));

  const ui = fs.readFileSync(path.join(__dirname, '..', 'ui.html'), 'utf8'), start = ui.indexOf('// ---------- ZIP ----------'), end = ui.indexOf("$('download').onclick", start);
  assert.ok(start > 0 && end > start, 'UI ZIP implementation is found');
  const context = { TextEncoder, DataView, ArrayBuffer, Uint8Array, Blob, console, b64bytes: value => new Uint8Array(Buffer.from(value, 'base64')) };
  vm.createContext(context); vm.runInContext(ui.slice(start, end) + '\nglobalThis.__zip = zip;', context, { timeout: 5000 });
  const blob = context.__zip(generated.map(file => ({ path: file.path, content: file.content, binary: !!file.binary }))), archive = readZip(Buffer.from(await blob.arrayBuffer()));

  const compared = compareArchive(intended, archive);
  assert.deepEqual(compared, { missing: [], unexpected: [], changed: [] }, 'ZIP exactly contains every generated file and no extra file');
  assert.ok([...archive.keys()].includes('reference/assets/pixel-1.png'), 'binary reference asset survives ZIP encoding');
  const broken = compareArchive(intended, new Map([...archive].filter(([file]) => file !== 'SKILL.md').concat([['unexpected.txt', Buffer.from('x')]])));
  assert.deepEqual(broken.missing, ['SKILL.md']); assert.deepEqual(broken.unexpected, ['unexpected.txt']);

  const temp = path.join(os.tmpdir(), 'gds-zip-' + process.pid); fs.rmSync(temp, { recursive: true, force: true });
  [...archive.entries()].forEach(([file, bytes]) => { const target = path.join(temp, ...file.split('/')); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes); });
  ['SKILL.md', 'design.md', 'tokens.css', 'manifest.json', 'metadata/token-map.json', 'components/index.json', 'reference/index.json', 'validation-report.json'].forEach(file => assert.ok(archive.has(file), 'required package file ' + file));
  assert.equal(verifyPackage(temp).errors, 0);
  const golden = tree(path.join(__dirname, 'fixtures', 'golden-package'), '');
  Object.entries(golden).forEach(([file, content]) => assert.equal(archive.get(file).toString('utf8'), content, 'stable output differs: ' + file));
  fs.rmSync(temp, { recursive: true, force: true });
  console.log('ZIP round-trip passed: ' + archive.size + ' files');
})().catch(e => { console.error(e); process.exit(1); });
