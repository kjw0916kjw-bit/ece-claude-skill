#!/usr/bin/env node
'use strict';

// SessionStart hook for the ece plugin.
// Reads ~/.claude/ece/user-notes.md and passes it to Claude as additional
// context, so rules taught with /ece:learn apply in every session — not only
// when an ece skill happens to load.
//
// Never blocks the session: on any problem it exits 0 with no output.

const fs = require('fs');
const os = require('os');
const path = require('path');

const MAX_CHARS = 8000;

function notesPath() {
  const configDir = (process.env.CLAUDE_CONFIG_DIR || '').trim() || path.join(os.homedir(), '.claude');
  return path.join(configDir, 'ece', 'user-notes.md');
}

// True when the notes contain something beyond the empty template:
// a list item that is not just a "(placeholder)" and not the example line.
function hasRealContent(text) {
  return text.split(/\r?\n/).some((line) => {
    const m = line.match(/^\s*-\s+(.*)$/);
    if (!m) return false;
    const item = m[1].trim();
    if (!item || item.startsWith('(')) return false;
    // "- 역할: (아직 모름 ...)" style lines: value part is a placeholder
    const value = item.includes(':') ? item.slice(item.indexOf(':') + 1).trim() : item;
    return value !== '' && !value.startsWith('(');
  });
}

function main() {
  let text;
  try {
    text = fs.readFileSync(notesPath(), 'utf8');
  } catch (_) {
    return; // no notes yet
  }
  if (!hasRealContent(text)) return;

  let body = text.trim();
  if (body.length > MAX_CHARS) {
    body = body.slice(0, MAX_CHARS) + '\n\n…(이하 생략 — 전체는 ~/.claude/ece/user-notes.md)';
  }

  const context = [
    '[ece 플러그인] 사용자의 유아교육 작업 규칙 (~/.claude/ece/user-notes.md).',
    '유아교육·보육 관련 작업을 할 때 이 규칙을 다른 기본 지침보다 우선 적용한다. 유아교육과 관계없는 작업에는 적용하지 않는다.',
    '',
    body,
  ].join('\n');

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: context,
    },
  }));
}

try {
  main();
} catch (_) {
  // never break session start
}
process.exit(0);
