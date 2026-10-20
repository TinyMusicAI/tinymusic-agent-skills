#!/usr/bin/env node
// Zero-dependency repository verifier. Requires Node >= 18.
//
//   node scripts/verify-skills.mjs                 offline checks
//   node scripts/verify-skills.mjs --live          also compare live tools/list with the contract
//   node scripts/verify-skills.mjs --live --url <endpoint>
//
// Checks the skills repository (frontmatter, dual-mode sections, tool names, URL allow-list,
// marketplaces, secrets). The MCP checks are optional references.
// Source of truth for tool names: docs/tool-contract.md (headings of the form ### `tool_name`).

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MCP_URL = 'https://tinymusic.ai/mcp';
const DESC_MAX = 1024;
const REQUIRED_FIELDS = ['name', 'description', 'homepage', 'author', 'license', 'tags', 'version'];

const args = process.argv.slice(2);
const live = args.includes('--live');
const urlArg = (() => {
  const i = args.findIndex((a) => a === '--url' || a.startsWith('--url='));
  if (i === -1) return null;
  return args[i].includes('=') ? args[i].split('=').slice(1).join('=') : args[i + 1] ?? null;
})();
const liveUrl = urlArg || MCP_URL;

let failures = 0;
const ok = (msg) => console.log(`  ok   ${msg}`);
const fail = (msg) => {
  failures++;
  console.log(`  FAIL ${msg}`);
};
const section = (title) => console.log(`\n${title}`);
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

function readJson(p) {
  try {
    return JSON.parse(read(p));
  } catch (e) {
    fail(`${p}: ${existsSync(join(ROOT, p)) ? 'invalid JSON (' + e.message + ')' : 'file not found'}`);
    return null;
  }
}

// ---------- helpers ----------

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      v = v
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else if (v.startsWith('"') && v.endsWith('"')) {
      try {
        v = JSON.parse(v);
      } catch {
        v = v.slice(1, -1);
      }
    } else if (v.startsWith("'") && v.endsWith("'")) {
      v = v.slice(1, -1);
    }
    data[kv[1]] = v;
  }
  return { data, body: text.slice(m[0].length) };
}

function contractTools() {
  const text = read('docs/tool-contract.md');
  return [...text.matchAll(/^### `([^`]+)`\s*$/gm)].map((m) => m[1]);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip', '.gz', '.woff', '.woff2', '.mp3', '.wav', '.mp4']);

// ---------- offline checks ----------

const contract = contractTools();
const contractSet = new Set(contract);

section('Tool contract');
if (contract.length === 0) fail('docs/tool-contract.md: no tools found (expected headings like ### `tool_name`)');
else ok(`${contract.length} tools: ${contract.join(', ')}`);
if (new Set(contract).size !== contract.length) fail('docs/tool-contract.md: duplicate tool headings');

const skillsDir = join(ROOT, 'skills');
const skillDirs = existsSync(skillsDir)
  ? readdirSync(skillsDir).filter((n) => statSync(join(skillsDir, n)).isDirectory()).sort()
  : [];

section('Skills');
if (skillDirs.length === 0) fail('skills/: no skill directories found');
for (const dir of skillDirs) {
  const rel = `skills/${dir}/SKILL.md`;
  if (!existsSync(join(ROOT, rel))) {
    fail(`${rel}: missing`);
    continue;
  }
  const parsed = parseFrontmatter(read(rel));
  if (!parsed) {
    fail(`${rel}: missing or malformed frontmatter`);
    continue;
  }
  const { data, body } = parsed;
  const before = failures;

  for (const f of REQUIRED_FIELDS) {
    const v = data[f];
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) fail(`${rel}: missing required field "${f}"`);
  }
  if (data.name !== undefined && data.name !== dir) fail(`${rel}: name "${data.name}" does not match directory "${dir}"`);
  if (typeof data.description === 'string') {
    if (data.description.length > DESC_MAX) fail(`${rel}: description is ${data.description.length} chars (max ${DESC_MAX})`);
  } else if (data.description !== undefined) fail(`${rel}: description must be a string`);
  if (data.tags !== undefined && !Array.isArray(data.tags)) fail(`${rel}: tags must be an inline list like [a, b]`);
  if (typeof data.version === 'string' && !/^\d+\.\d+\.\d+$/.test(data.version)) fail(`${rel}: version "${data.version}" is not semver`);
  if (data.homepage !== undefined && data.homepage !== 'https://tinymusic.ai') fail(`${rel}: homepage should be https://tinymusic.ai`);

  // Tool names declared on "Tool:" / "Tools:" lines.
  const used = [];
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:[-*>]\s*)?(?:\*\*)?Tools?:(?:\*\*)?\s*(.*)$/);
    if (!m) continue;
    for (const t of m[1].matchAll(/`([^`]+)`/g)) used.push(t[1]);
  }
  for (const t of used) {
    if (!contractSet.has(t)) fail(`${rel}: references tool "${t}" which is not in docs/tool-contract.md`);
  }

  if (used.length > 0) {
    for (const h of ['## Without the MCP', '## With the MCP connected']) {
      if (!new RegExp('^' + h + '\\b', 'm').test(body)) fail(`${rel}: skill uses tools but has no "${h}" heading`);
    }
  }
  // Any contract tool named in backticks must be declared on the Tool(s) line.
  for (const t of contractSet) {
    if (body.includes('`' + t + '`') && !used.includes(t)) fail(`${rel}: mentions tool "${t}" but does not list it on its Tool(s): line`);
  }

  if (failures === before) ok(`${dir}  (tools: ${used.length ? [...new Set(used)].join(', ') : 'none'})`);

  const pj = `skills/${dir}/.claude-plugin/plugin.json`;
  if (existsSync(join(ROOT, pj))) {
    const j = readJson(pj);
    if (j && j.name !== dir) fail(`${pj}: name "${j.name}" does not match directory "${dir}"`);
  }
}

section('Marketplaces');
for (const file of ['.claude-plugin/marketplace.json', '.cursor-plugin/marketplace.json']) {
  const j = readJson(file);
  if (!j) continue;
  const before = failures;
  if (!Array.isArray(j.plugins)) {
    fail(`${file}: "plugins" must be an array`);
    continue;
  }
  const names = j.plugins.map((p) => p.name);
  if (new Set(names).size !== names.length) fail(`${file}: duplicate plugin names`);
  for (const d of skillDirs) if (!names.includes(d)) fail(`${file}: skill "${d}" has no plugin entry`);
  for (const p of j.plugins) {
    if (!skillDirs.includes(p.name)) fail(`${file}: plugin "${p.name}" has no matching skills/ directory`);
    if (p.source !== `./skills/${p.name}`) fail(`${file}: plugin "${p.name}" source should be "./skills/${p.name}" (got "${p.source}")`);
    for (const f of ['version', 'description', 'category']) if (!p[f]) fail(`${file}: plugin "${p.name}" missing "${f}"`);
  }
  if (failures === before) ok(`${file}  (${j.plugins.length} plugins match skills/)`);
}

section('MCP endpoint URL');
{
  const readme = read('README.md');
  const urls = [...readme.matchAll(/https?:\/\/[^\s"'`)<>]*\/mcp\b/g)].map((m) => m[0]);
  if (urls.length === 0) fail('README.md: no MCP URL found');
  else {
    const bad = urls.filter((u) => u !== MCP_URL);
    if (bad.length) fail(`README.md: MCP URL mismatch: ${[...new Set(bad)].join(', ')}`);
    else ok(`README.md MCP URL = ${MCP_URL} (${urls.length} occurrences)`);
  }
  for (const stale of ['mcp.json', 'plugin.json']) {
    if (existsSync(join(ROOT, stale))) fail(`${stale}: not part of the skills repository, remove it`);
  }
}

section('Content scan');
{
  const files = walk(ROOT).filter((f) => !BINARY_EXT.has(extname(f).toLowerCase()));
  const before = failures;
  const secretRe = /sk_[A-Za-z0-9_-]{20,}/g;
  // Features that are out of scope for this release must not be mentioned or promised.
  const bannedRe = /vocal[- ](?:removal|separation|remover|isolation)|stem[- ](?:separation|splitt?er)|karaoke track|去人声|人声分离/i;
  for (const f of files) {
    const rel = relative(ROOT, f).split(sep).join('/');
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(secretRe)) {
      if (m[0] === 'sk_your_api_key') continue;
      fail(`${rel}: possible secret "${m[0].slice(0, 6)}..." (sk_ followed by 20+ chars)`);
    }
    if (!rel.startsWith('scripts/') && bannedRe.test(text)) fail(`${rel}: mentions an unsupported feature (vocal removal / separation)`);
  }
  // Only these tinymusic.ai URLs may appear (guards against invented pages).
  const allowedPaths = new Set([
    '', '/', '/text-to-song-generator', '/ai-music-generator', '/lyrics-to-song-generator',
    '/ai-lyrics-generator', '/royalty-free-ai-music', '/settings/apikeys', '/pricing', '/songs', '/mcp', '/terms-of-service',
  ]);
  const urlRe = /https?:\/\/(?:[a-z0-9-]+\.)*tinymusic\.ai(\/[^\s"'`)<>\]]*)?/gi;
  for (const f of files) {
    const rel = relative(ROOT, f).split(sep).join('/');
    if (rel.startsWith('scripts/')) continue;
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(urlRe)) {
      const full = m[0].replace(/[.,;:!?]+$/, '');
      const host = full.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
      const path = (m[1] || '').replace(/[.,;:!?]+$/, '').split(/[?#]/)[0];
      if (host !== 'tinymusic.ai' || !allowedPaths.has(path.replace(/\/$/, '') || '')) fail(`${rel}: tinymusic.ai URL not on the allow-list: ${full}`);
    }
  }
  if (failures === before) ok(`${files.length} files scanned: no secrets, no unsupported-feature mentions, all tinymusic.ai URLs allow-listed`);
}

// ---------- live check ----------

function parseRpcBody(text, contentType, id) {
  const candidates = [];
  if ((contentType || '').includes('text/event-stream') || /^\s*(event|data):/m.test(text)) {
    for (const block of text.split(/\r?\n\r?\n/)) {
      const data = block
        .split(/\r?\n/)
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).replace(/^ /, ''))
        .join('\n');
      if (!data.trim()) continue;
      try {
        candidates.push(JSON.parse(data));
      } catch {
        /* ignore non-JSON events */
      }
    }
  } else {
    try {
      const j = JSON.parse(text);
      Array.isArray(j) ? candidates.push(...j) : candidates.push(j);
    } catch {
      throw new Error(`response is neither JSON nor SSE: ${text.slice(0, 200)}`);
    }
  }
  const msg = candidates.find((c) => c && c.id === id) || candidates.find((c) => c && (c.result || c.error));
  if (!msg) throw new Error('no JSON-RPC response message found');
  if (msg.error) throw new Error(`JSON-RPC error ${msg.error.code}: ${msg.error.message}`);
  return msg.result;
}

async function rpc(url, body, sessionId) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  const text = await res.text();
  if (body.id === undefined) return { result: null, sessionId };
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  return {
    result: parseRpcBody(text, res.headers.get('content-type'), body.id),
    sessionId: res.headers.get('mcp-session-id') || sessionId,
  };
}

async function liveCheck() {
  section(`Live check: ${liveUrl}`);
  try {
    const init = await rpc(liveUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'tinymusic-agent-skills-verify', version: '1.0.0' },
      },
    });
    ok(`initialize: server ${init.result?.serverInfo?.name ?? '(unnamed)'} ${init.result?.serverInfo?.version ?? ''}`.trim());
    // Stateless servers ignore this; stateful ones may require it.
    try {
      await rpc(liveUrl, { jsonrpc: '2.0', method: 'notifications/initialized' }, init.sessionId);
    } catch {
      /* best effort */
    }
    const list = await rpc(liveUrl, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, init.sessionId);
    const remote = (list.result?.tools || []).map((t) => t.name).sort();
    const local = [...contractSet].sort();
    const missing = local.filter((t) => !remote.includes(t));
    const extra = remote.filter((t) => !contractSet.has(t));
    if (missing.length) fail(`live server is missing tools from the contract: ${missing.join(', ')}`);
    if (extra.length) fail(`live server exposes tools not in the contract: ${extra.join(', ')}`);
    if (!missing.length && !extra.length) ok(`tools/list matches the contract exactly: ${remote.join(', ')}`);

    // tools/call without a key must be rejected at the HTTP layer.
    const anon = await fetch(liveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_credits', arguments: {} } }),
      signal: AbortSignal.timeout(20000),
    });
    await anon.text();
    if (anon.status === 401) {
      ok('tools/call without a key returns HTTP 401');
      const www = anon.headers.get('www-authenticate') || '';
      if (!/^Bearer\b/i.test(www)) fail(`401 response is missing WWW-Authenticate: Bearer (got "${www}")`);
    } else {
      fail(`tools/call without a key returned HTTP ${anon.status}, expected 401`);
    }
  } catch (e) {
    fail(`live check failed: ${e.message}`);
  }
}

if (live) await liveCheck();

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
