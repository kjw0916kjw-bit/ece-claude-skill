#!/usr/bin/env node
'use strict';

// PostToolUse hook for the ece plugin.
// After Claude writes or edits a text document (.md .txt .html .htm .csv),
// scan the saved file for sensitive personal numbers and warn — without
// blocking. The warning goes to the user (systemMessage) and to Claude
// (additionalContext) so Claude can offer to mask the values.
//
// Detects: Korean mobile numbers, resident/foreigner registration numbers,
// and 16-digit card numbers. Values in the warning are partly masked.
// Disable with the environment variable ECE_PRIVACY_WARNING=0.
// Never fails the tool call: on any problem it exits 0 with no output.

const fs = require('fs');
const path = require('path');

const DOC_EXT = new Set(['.md', '.txt', '.html', '.htm', '.csv']);
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_LISTED = 10;

const PATTERNS = [
  {
    label: '휴대전화 번호',
    re: /(?<!\d)01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}(?!\d)/g,
    // template placeholders such as 010-0000-0000
    skip: (v) => /0{3,4}[-.\s]?0{4}$/.test(v),
    mask: (v) => v.replace(/(\d{3}[-.\s]?)(\d{3,4})([-.\s]?\d{4})/, (_, a, b, c) => a + '*'.repeat(b.length) + c),
  },
  {
    label: '주민·외국인등록번호',
    re: /(?<!\d)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[-\s]?[1-8]\d{6}(?!\d)/g,
    mask: (v) => v.replace(/^(\d{6}[-\s]?\d)\d{6}$/, '$1******'),
  },
  {
    label: '카드 번호',
    re: /(?<!\d)\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}(?!\d)/g,
    mask: (v) => v.replace(/^(\d{4}[-\s])\d{4}([-\s])\d{4}([-\s]\d{4})$/, '$1****$2****$3'),
  },
];

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch (_) {
    return '';
  }
}

function findings(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const p of PATTERNS) {
      for (const m of line.matchAll(p.re)) {
        if (p.skip && p.skip(m[0])) continue;
        out.push({ line: i + 1, label: p.label, masked: p.mask(m[0]) });
      }
    }
  });
  return out;
}

function main() {
  if (process.env.ECE_PRIVACY_WARNING === '0') return;

  const input = JSON.parse(readStdin() || '{}');
  const filePath = input.tool_input && (input.tool_input.file_path || input.tool_input.notebook_path);
  if (!filePath || typeof filePath !== 'string') return;

  if (!DOC_EXT.has(path.extname(filePath).toLowerCase())) return;
  if (/[\\/](\.git|node_modules)[\\/]/.test(filePath)) return;

  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size > MAX_BYTES) return;

  const found = findings(fs.readFileSync(filePath, 'utf8'));
  if (!found.length) return;

  const name = path.basename(filePath);
  const listed = found.slice(0, MAX_LISTED).map((f) => `  - ${f.line}번째 줄: ${f.label} (${f.masked})`);
  if (found.length > MAX_LISTED) listed.push(`  - 외 ${found.length - MAX_LISTED}건`);

  const userMsg = [
    `[ece 개인정보 경고] ${name}에 개인정보로 보이는 내용이 ${found.length}건 있어요.`,
    ...listed,
    '보호자 연락처나 주민등록번호가 꼭 필요한 문서인지 확인해 주세요.',
  ].join('\n');

  const claudeMsg = [
    `[ece 개인정보 경고] 방금 저장한 ${filePath}에 다음이 감지되었다:`,
    ...listed,
    '사용자에게 이 사실을 알리고, 해당 값을 가릴지(예: 010-****-5678, ○○) 물어본다.',
    '사용자가 원하지 않으면 그대로 둔다. 실제 번호를 대화에 다시 적지 않는다.',
  ].join('\n');

  process.stdout.write(JSON.stringify({
    systemMessage: userMsg,
    hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: claudeMsg },
  }));
}

try {
  main();
} catch (_) {
  // never break the tool call
}
process.exit(0);
