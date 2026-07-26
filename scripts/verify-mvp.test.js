#!/usr/bin/env node
// Self-check for verify-mvp.js: it must fail on a broken tree and pass on the real one.

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const script = path.join(__dirname, 'verify-mvp.js');

function run(rootDir) {
  try {
    execFileSync(process.execPath, [script], {
      env: { ...process.env, VERIFY_ROOT: rootDir },
      stdio: 'pipe',
    });
    return 0;
  } catch (error) {
    return error.status ?? 1;
  }
}

// 1. Real repository must pass.
const realRoot = path.resolve(__dirname, '..');
assert.strictEqual(run(realRoot), 0, 'verify-mvp must pass on the real repository');

// 2. Empty tree must fail (missing files).
const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-empty-'));
assert.notStrictEqual(run(emptyDir), 0, 'verify-mvp must fail on an empty tree');

// 3. Tree with a planted secret must fail.
// Assembled at runtime so this test file itself never contains the secret pattern.
const plantedSecret = ['sk', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456'].join('-');
const secretDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-secret-'));
fs.writeFileSync(path.join(secretDir, 'leak.md'), `key: ${plantedSecret}`);
assert.notStrictEqual(run(secretDir), 0, 'verify-mvp must fail when a secret pattern is present');

fs.rmSync(emptyDir, { recursive: true, force: true });
fs.rmSync(secretDir, { recursive: true, force: true });

console.log('OK: verify-mvp self-check passed.');
