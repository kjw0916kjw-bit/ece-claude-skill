#!/usr/bin/env node
'use strict';

// Tests for scripts/privacy-warning.js (the PostToolUse hook).
// Sample numbers are built from parts so this file itself does not trip
// the repository privacy scan (scripts/ci/validate.js).

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPT = path.resolve(__dirname, '..', 'scripts', 'privacy-warning.js');

const MOBILE = ['010', '1234', '5678'].join('-');
const RRN = ['150301', '4123456'].join('-');
const CARD = ['1234', '5678', '9012', '3456'].join('-');

function tempFile(name, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ece-priv-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, content);
  return file;
}

function run(input, env = {}) {
  return spawnSync(process.execPath, [SCRIPT], {
    input: JSON.stringify(input),
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

const writeInput = (file) => ({ hook_event_name: 'PostToolUse', tool_name: 'Write', tool_input: { file_path: file } });

test('clean document: no output', () => {
  const f = tempFile('notice.md', '# 가정통신문\n어린이집 전화 000-0000-0000\n');
  const r = run(writeInput(f));
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout, '');
});

test('mobile number: warns with masked value, never the full number', () => {
  const f = tempFile('상담기록.md', `보호자 연락처: ${MOBILE}\n`);
  const r = run(writeInput(f));
  assert.strictEqual(r.status, 0);
  const out = JSON.parse(r.stdout);
  assert.match(out.systemMessage, /휴대전화 번호/);
  assert.match(out.systemMessage, /1번째 줄/);
  assert.match(out.systemMessage, /010-\*\*\*\*-5678/);
  assert.ok(!r.stdout.includes(MOBILE), 'full number leaked into output');
  assert.strictEqual(out.hookSpecificOutput.hookEventName, 'PostToolUse');
});

test('resident registration number and card number are detected and masked', () => {
  const f = tempFile('기록.txt', `주민번호 ${RRN}\n\n카드 ${CARD}\n`);
  const out = JSON.parse(run(writeInput(f)).stdout);
  assert.match(out.systemMessage, /주민·외국인등록번호 \(150301-4\*{6}\)/);
  assert.match(out.systemMessage, /3번째 줄: 카드 번호 \(1234-\*{4}-\*{4}-3456\)/);
  assert.ok(!out.systemMessage.includes(RRN));
  assert.ok(!out.systemMessage.includes(CARD));
});

test('Edit tool input is handled the same way', () => {
  const f = tempFile('알림장.md', `연락 ${MOBILE}`);
  const r = run({ tool_name: 'Edit', tool_input: { file_path: f, old_string: 'a', new_string: 'b' } });
  assert.match(JSON.parse(r.stdout).systemMessage, /휴대전화 번호/);
});

test('non-document files (code) are ignored', () => {
  const f = tempFile('app.js', `const phone = '${MOBILE}';`);
  assert.strictEqual(run(writeInput(f)).stdout, '');
});

test('ECE_PRIVACY_WARNING=0 disables the warning', () => {
  const f = tempFile('memo.md', MOBILE);
  assert.strictEqual(run(writeInput(f), { ECE_PRIVACY_WARNING: '0' }).stdout, '');
});

test('bad input never fails: missing file, empty stdin, invalid JSON', () => {
  for (const input of [writeInput('/no/such/file.md'), {}]) {
    const r = run(input);
    assert.strictEqual(r.status, 0);
    assert.strictEqual(r.stdout, '');
  }
  const r = spawnSync(process.execPath, [SCRIPT], { input: 'not json', encoding: 'utf8' });
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout, '');
});

test('dates, times and template placeholders are not flagged', () => {
  const placeholder = ['010', '0000', '0000'].join('-');
  const f = tempFile('plan.md', `20OO. 5. 12 ~ 5. 16\n09:30 ~ 11:30\n2026-11-19\n연락처 ${placeholder} (양식)\n`);
  assert.strictEqual(run(writeInput(f)).stdout, '');
});
