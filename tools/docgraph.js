// docgraph.js — scan the repo's markdown docs and build docgraph/graph.json for docgraph.html (3D doc graph, Obsidian style).
// Run: node tools/docgraph.js   (also run automatically at the end of tools/codemap.js)
// Nodes = .md files (git-tracked, minus .claude/ studio packs) + code/asset files the docs mention.
// Links = markdown links, backtick paths and bare file paths found in each doc.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..');

// Topics: keyword sets (lower-case). A doc gets every topic whose keywords appear often enough.
const TOPICS = [
  { id: 'castle', name: 'Castle Strike / โหมดปราสาท', kw: ['castle strike', 'castle', 'siege', 'ปราสาท', 'บุกปราสาท', 'sgv', 'sgtick', 'fcs', 'firstcastlestrike', 'capture', 'ยึด'] },
  { id: 'env', name: 'โต้ตอบสภาพแวดล้อม / ทำลาย', kw: ['destruct', 'destruction', 'ทำลาย', 'พัง', 'debris', 'ragdoll', 'environment', 'สิ่งแวดล้อม', 'สภาพแวดล้อม', 'element surface', 'โต้ตอบ', 'battlefield', 'collapse', 'chunk'] },
  { id: 'map', name: 'แผนที่ / Map', kw: ['map', 'แผนที่', 'mapbuild', 'mapedit', 'terrain', 'greybox', 'layout'] },
  { id: 'vfx', name: 'VFX / เอฟเฟกต์', kw: ['vfx', 'fx.json', 'effect', 'เอฟเฟกต์', 'storyboard', 'particle', 'shader'] },
  { id: 'class', name: 'คลาส / สกิล', kw: ['skill', 'สกิล', 'class', 'คลาส', 'ultimate', 'kit', 'cooldown', 'ธาตุ', 'element'] },
  { id: 'tech', name: 'ระบบ / โค้ด', kw: ['js/', 'network', 'snapshot', 'perf', 'optimize', 'render', 'host', 'bot', 'tool'] },
];
const TH = 6; // min keyword hits per topic

const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
const trackedSet = new Set(tracked);
const docs = tracked.filter(f => f.endsWith('.md') && !f.startsWith('.claude/'));

const nodes = new Map(), links = new Map();
function addNode(id, o) { if (!nodes.has(id)) nodes.set(id, Object.assign({ id }, o)); return nodes.get(id); }
function addLink(a, b) {
  if (a === b) return; const k = a < b ? a + '|' + b : b + '|' + a;
  const l = links.get(k); if (l) l.w++; else links.set(k, { source: a, target: b, w: 1 });
}
function kind(f) {
  if (f.endsWith('.md')) return 'doc';
  if (/\.(js|py|bat|css)$/.test(f)) return 'code';
  if (f.endsWith('.html')) return 'page';
  return 'data';
}
function resolve(ref, from) {
  ref = ref.replace(/[#?].*$/, '').replace(/^\.\//, '').replace(/[),.:;]+$/, '');
  if (!ref || /^https?:/.test(ref)) return null;
  const cands = [path.posix.normalize(path.posix.join(path.posix.dirname(from), ref)), path.posix.normalize(ref)];
  for (const c of cands) if (trackedSet.has(c)) return c;
  // bare filename like HANDOFF.md / Destruction.md — unique match only
  if (!ref.includes('/')) { const m = tracked.filter(t => t.endsWith('/' + ref) && !t.startsWith('.claude/')); if (m.length === 1) return m[0]; }
  return null;
}

for (const f of docs) {
  const txt = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const low = txt.toLowerCase();
  const lines = txt.split('\n');
  const title = ((lines.find(l => /^#\s/.test(l)) || '').replace(/^#\s+/, '').trim()) || path.basename(f);
  const heads = lines.filter(l => /^#{2,3}\s/.test(l)).map(l => l.replace(/^#+\s+/, '').trim()).slice(0, 40);
  const score = {};
  for (const t of TOPICS) { let n = 0; for (const k of t.kw) { let i = -1; while ((i = low.indexOf(k, i + 1)) >= 0) n++; } score[t.id] = n; }
  const topics = TOPICS.filter(t => score[t.id] >= TH).sort((a, b) => score[b.id] - score[a.id]).map(t => t.id);
  const para = lines.filter(l => l.trim() && !/^(#|\||```|>|-{3})/.test(l.trim())).slice(0, 3).join(' ').replace(/\*\*|`/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').slice(0, 300);
  let mtime = 0; try { mtime = +execSync(`git log -1 --format=%ct -- "${f}"`, { cwd: ROOT, encoding: 'utf8' }).trim() || 0; } catch (e) {}
  Object.assign(addNode(f, {}), { kind: 'doc', title, folder: f.includes('/') ? f.split('/')[0] : '(root)', lines: lines.length, heads, topics, score, para, mtime });
  const refs = new Set();
  for (const m of txt.matchAll(/\]\(([^)\s]+)\)/g)) refs.add(m[1]);
  for (const m of txt.matchAll(/`([^`\s]+\.(?:md|js|html|json|py|bat|css))`/g)) refs.add(m[1]);
  for (const m of txt.matchAll(/(?:^|[\s(])((?:[\w.-]+\/)*[\w.-]+\.(?:md|js|html|py))(?=[\s),.:;]|$)/gm)) refs.add(m[1]);
  for (const r of refs) {
    const t = resolve(r, f); if (!t) continue;
    if (t.startsWith('.claude/')) continue;
    if (f === 'CODEMAP.md' && !t.endsWith('.md')) continue; // auto-generated code index: would link every js file
    if (!nodes.has(t)) addNode(t, { kind: kind(t), title: path.basename(t), folder: t.includes('/') ? t.split('/')[0] : '(root)' });
    addLink(f, t);
  }
}
// second pass: code/page nodes created before their doc node existed are fine; drop non-doc nodes with a single link to keep it readable
const deg = {}; for (const l of links.values()) { deg[l.source] = (deg[l.source] || 0) + 1; deg[l.target] = (deg[l.target] || 0) + 1; }
for (const [id, n] of nodes) if (n.kind !== 'doc' && (deg[id] || 0) < 2) nodes.delete(id);
const out = {
  generated: new Date().toISOString(),
  topics: TOPICS.map(t => ({ id: t.id, name: t.name })),
  nodes: [...nodes.values()].map(n => Object.assign(n, { deg: deg[n.id] || 0 })),
  links: [...links.values()].filter(l => nodes.has(l.source) && nodes.has(l.target)),
};
fs.writeFileSync(path.join(ROOT, 'docgraph', 'graph.json'), JSON.stringify(out));
console.log('docgraph/graph.json:', out.nodes.filter(n => n.kind === 'doc').length, 'docs,', out.nodes.length, 'nodes,', out.links.length, 'links');
