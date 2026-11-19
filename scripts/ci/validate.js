#!/usr/bin/env node
'use strict';

// Structure and privacy checks for the ece plugin. No dependencies.
// Usage: node scripts/ci/validate.js   (run from the repo root)
// Exits 1 if any check fails.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const errors = [];
const passed = [];

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const fail = (msg) => errors.push(msg);
const ok = (msg) => passed.push(msg);

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  } catch (e) {
    fail(`${file}: invalid JSON (${e.message})`);
    return null;
  }
}

function listFiles(dir, filter) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const p = path.join(abs, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(rel(p), filter));
    else if (!filter || filter(p)) out.push(p);
  }
  return out;
}

// Minimal YAML frontmatter reader: top-level "key: value" lines only.
function frontmatter(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return fm;
}

// 1. Manifests -----------------------------------------------------------
const plugin = readJson('.claude-plugin/plugin.json');
const market = readJson('.claude-plugin/marketplace.json');
const hooks = readJson('hooks/hooks.json');

if (plugin) {
  for (const k of ['name', 'version', 'description']) {
    if (!plugin[k]) fail(`plugin.json: missing "${k}"`);
  }
  if (plugin.version && !/^\d+\.\d+\.\d+$/.test(plugin.version)) fail(`plugin.json: version "${plugin.version}" is not x.y.z`);
}
if (market) {
  const entry = (market.plugins || []).find((p) => plugin && p.name === plugin.name);
  if (!entry) fail(`marketplace.json: no plugin entry named "${plugin && plugin.name}"`);
  else if (plugin && entry.version !== plugin.version) {
    fail(`version mismatch: plugin.json ${plugin.version} vs marketplace.json ${entry.version}`);
  } else ok(`manifests valid, version ${plugin.version} matches`);
}
if (hooks) {
  for (const [event, groups] of Object.entries(hooks.hooks || {})) {
    for (const g of groups) {
      for (const h of g.hooks || []) {
        const m = (h.command || '').match(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^"\s]+)/);
        if (m && !fs.existsSync(path.join(ROOT, m[1]))) fail(`hooks.json ${event}: script not found: ${m[1]}`);
      }
    }
  }
  ok('hooks.json valid, hook scripts exist');
}

// 2. Skills, agents, commands frontmatter ------------------------------------
const names = new Map();
function checkNamed(kind, file, fm, expectedName) {
  if (!fm) return fail(`${rel(file)}: missing frontmatter`);
  if (!fm.description) fail(`${rel(file)}: missing "description"`);
  if (kind === 'command') return;
  if (!fm.name) return fail(`${rel(file)}: missing "name"`);
  if (expectedName && fm.name !== expectedName) fail(`${rel(file)}: name "${fm.name}" should be "${expectedName}"`);
  const key = `${kind}:${fm.name}`;
  if (names.has(key)) fail(`${rel(file)}: duplicate ${kind} name "${fm.name}" (also ${names.get(key)})`);
  names.set(key, rel(file));
}

const skillDirs = fs.readdirSync(path.join(ROOT, 'skills'), { withFileTypes: true }).filter((d) => d.isDirectory());
for (const d of skillDirs) {
  const file = path.join(ROOT, 'skills', d.name, 'SKILL.md');
  if (!fs.existsSync(file)) { fail(`skills/${d.name}: missing SKILL.md`); continue; }
  checkNamed('skill', file, frontmatter(file), d.name);

  // every `references/...` or `examples/...` path mentioned must exist, either in this
  // skill's folder or in the core early-childhood-education skill that workflow skills build on.
  // Placeholders such as `references/<주제>.md` are skipped.
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/`((?:references|examples)\/[^`\s]+\.md)`/g)) {
    if (m[1].includes('<')) continue;
    const candidates = [path.join(ROOT, 'skills', d.name, m[1]), path.join(ROOT, 'skills', 'early-childhood-education', m[1])];
    if (!candidates.some((c) => fs.existsSync(c))) fail(`${rel(file)}: links to missing file ${m[1]}`);
  }
}
const agents = listFiles('agents', (p) => p.endsWith('.md'));
for (const f of agents) checkNamed('agent', f, frontmatter(f), path.basename(f, '.md'));
const commands = listFiles('commands', (p) => p.endsWith('.md'));
for (const f of commands) checkNamed('command', f, frontmatter(f));
ok(`${skillDirs.length} skills, ${agents.length} agents, ${commands.length} commands checked`);

// 3. Privacy scan --------------------------------------------------------
// The repo is public; examples must stay fictional and anonymous.
const PRIVACY = [
  { name: 'Windows user path', re: /[A-Za-z]:\\Users\\[^\\\s]+|\/c\/Users\/[^/\s]+/ },
  { name: 'email address', re: /[A-Za-z0-9._%+-]+@(?!users\.noreply\.github\.com)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  // template placeholders such as 010-0000-0000 are allowed (same rule as scripts/privacy-warning.js)
  { name: 'Korean mobile number', re: /01[016789][-.\s]?(?!0{3,4}[-.\s]?0{4}(?!\d))\d{3,4}[-.\s]?\d{4}/ },
  { name: 'resident registration number', re: /\b\d{6}[-\s]?[1-4]\d{6}\b/ },
  { name: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{20,}/ },
  { name: 'Anthropic API key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
];
const SCAN_EXT = /\.(md|json|js|ya?ml|txt)$/;
const scanFiles = listFiles('.', (p) => SCAN_EXT.test(p) && !/[\\/](\.git|node_modules)[\\/]/.test(p));
let privacyHits = 0;
for (const f of scanFiles) {
  if (rel(f) === 'scripts/ci/validate.js') continue; // contains the patterns themselves
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const { name, re } of PRIVACY) {
      if (re.test(line)) { privacyHits++; fail(`${rel(f)}:${i + 1}: possible ${name}`); }
    }
  });
}
if (!privacyHits) ok(`privacy scan clean (${scanFiles.length} files)`);

// Report ------------------------------------------------------------------
for (const p of passed) console.log(`✔ ${p}`);
for (const e of errors) console.log(`✘ ${e}`);
console.log(errors.length ? `\n${errors.length} problem(s) found` : '\nAll checks passed');
process.exit(errors.length ? 1 : 0);
