#!/usr/bin/env node
'use strict';

// Tests for scripts/load-user-notes.js (the SessionStart hook).
// Uses only node:test and node:assert. Run: node --test tests/

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'load-user-notes.js');
const TEMPLATE = path.join(ROOT, 'skills', 'early-childhood-education', 'references', 'user-notes.template.md');

function run(configDir) {
  return spawnSync(process.execPath, [SCRIPT], {
    env: { ...process.env, CLAUDE_CONFIG_DIR: configDir },
    encoding: 'utf8',
  });
}

function tempConfig(notes) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ece-test-'));
  if (notes !== undefined) {
    fs.mkdirSync(path.join(dir, 'ece'));
    fs.writeFileSync(path.join(dir, 'ece', 'user-notes.md'), notes);
  }
  return dir;
}

test('no notes file: no output, exit 0', () => {
  const r = run(tempConfig());
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout, '');
});

test('empty template: no output, exit 0', () => {
  const r = run(tempConfig(fs.readFileSync(TEMPLATE, 'utf8')));
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout, '');
});

test('real notes: SessionStart JSON with the notes as additionalContext', () => {
  const notes = '## 사용자 정보\n- 역할: 어린이집 보육교사\n- 주로 다루는 연령: 만 3세\n';
  const r = run(tempConfig(notes));
  assert.strictEqual(r.status, 0);
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(out.hookSpecificOutput.additionalContext, /어린이집 보육교사/);
  assert.match(out.hookSpecificOutput.additionalContext, /\[ece 플러그인\]/);
});

test('long notes are truncated', () => {
  const notes = '- 규칙: ' + '가'.repeat(20000);
  const r = run(tempConfig(notes));
  const ctx = JSON.parse(r.stdout).hookSpecificOutput.additionalContext;
  assert.ok(ctx.length < 9000, `context too long: ${ctx.length}`);
  assert.match(ctx, /이하 생략/);
});

test('unreadable notes path (directory instead of file): exit 0, no output', () => {
  const dir = tempConfig();
  fs.mkdirSync(path.join(dir, 'ece', 'user-notes.md'), { recursive: true });
  const r = run(dir);
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout, '');
});
