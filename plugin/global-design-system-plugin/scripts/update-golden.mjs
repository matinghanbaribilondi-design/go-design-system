#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
const { gen } = require('../src/core.js'), build = require('../tests/fixture-golden.js');
const out = path.join(ROOT, 'tests', 'fixtures', 'golden-package');
fs.rmSync(out, { recursive: true, force: true });
for (const file of gen(build(), 'standard', [], [])) {
  if (file.binary) continue;
  const target = path.join(out, file.path);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, file.content);
}
console.log('golden package: ' + path.relative(ROOT, out));
