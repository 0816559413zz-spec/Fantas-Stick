// Map Editor (mapedit.html) — topdown reference map for Claude. Format: guides/MAP-FORMAT.md
// Layers: height (levels) + ramp, surface, wall, walk override; lists: objs (incl. interact), zones, routes, notes; ref image underlay.
// Saves through tools/serve.py: POST /api/map?id= {map, md, png} → maps/<id>.json/.md/.png
'use strict';
(() => {
// ================= catalogs =================
const HMIN = -5, HMAX = 15;
const SURF = [
  { n: 'ดิน/พื้นทั่วไป', c: '#8a7a5a', ch: '.', walk: 1, mul: 1 },
  { n: 'หญ้า', c: '#5d8a4a', ch: ',', walk: 1, mul: 1 },
  { n: 'หิน/พื้นปราสาท', c: '#8b8f96', ch: ':', walk: 1, mul: 1 },
  { n: 'พื้นไม้', c: '#9a6b3f', ch: '_', walk: 1, mul: 1 },
  { n: 'ทราย', c: '#c9b37a', ch: 's', walk: 1, mul: 1.2 },
  { n: 'โคลน (ช้า)', c: '#5e4a36', ch: 'm', walk: 1, mul: 1.6 },
  { n: 'น้ำตื้น (ช้า)', c: '#5aa6c8', ch: 'w', walk: 1, mul: 1.5 },
  { n: 'น้ำลึก (เดินไม่ได้)', c: '#2c5f8a', ch: 'W', walk: 0, mul: 1 },
  { n: 'น้ำแข็ง (ลื่น)', c: '#bfe3f0', ch: 'i', walk: 1, mul: 1 },
  { n: 'ลาวา (เดินไม่ได้)', c: '#d0552a', ch: 'L', walk: 0, mul: 1 },
  { n: 'หลุม/เหว', c: '#141414', ch: 'V', walk: 0, mul: 1 },
  { n: 'พุ่มสูง (ซ่อนตัว)', c: '#3e6b34', ch: '"', walk: 1, mul: 1.1 },
];
const WALL = [
  { n: 'ไม่มี (ลบ)', c: null, ch: '' },
  { n: 'กำแพงทึบ', c: '#2e2e34', ch: '#' },
  { n: 'กำแพงเตี้ย/ที่กำบัง', c: '#5e5e68', ch: '=' },
  { n: 'รั้ว/ราว (มองทะลุ)', c: '#a08a60', ch: '+' },
];
const WALK = [
  { n: 'อัตโนมัติ (ลบ)', c: null },
  { n: 'บังคับเดินได้', c: '#6fcf97' },
  { n: 'ห้ามเดิน', c: '#f06a6a' },
];
const DIRS = [null, [0, -1], [1, 0], [0, 1], [-1, 0]]; // 1 N(up) 2 E 3 S 4 W
const DIRN = ['', 'เหนือ ↑', 'ตะวันออก →', 'ใต้ ↓', 'ตะวันตก ←'];
const DIRCH = ['', '^', '>', 'v', '<'];
const IA_KIND = { break: 'พังได้', open: 'เปิด/ปิด', activate: 'กดใช้งาน/สั่งการ', launch: 'ดีดตัว (ไปเป้า)', warp: 'วาร์ป (ไปเป้า)', lift: 'ลิฟต์ขึ้นลง (กับเป้า)', climb: 'ปีน', push: 'ผลัก/เลื่อนได้', burn: 'เผาได้', freeze: 'แช่แข็ง/เปลี่ยนพื้น', other: 'อื่นๆ' };
const FOOT = { none: 'ไม่มีผล (ตามพื้น)', block: 'ขวางทาง', pass: 'เดินผ่านได้' };
const BY_CHIPS = ['โจมตีปกติ', 'สกิลใดก็ได้', 'ผู้เล่นกดใช้', 'ยืนทับ', 'Fire', 'Water', 'Wind', 'Earth', 'Frost', 'Storm', 'Nature', 'ฝ่ายบุกเท่านั้น', 'ฝ่ายรับเท่านั้น'];
const ELEM = ['', 'Fire', 'Water', 'Wind', 'Earth', 'Frost', 'Storm', 'Nature'];
// t: [name, icon, category, w, h, foot, color, ia default]
const OBJ = {
  spawnA: ['จุดเกิดฝ่ายบุก', 'A', 'sys', 2, 2, 'none', '#e05555'],
  spawnB: ['จุดเกิดฝ่ายรับ', 'B', 'sys', 2, 2, 'none', '#4a8cff'],
  core: ['แกน (เป้าหมาย)', '◆', 'sys', 2, 2, 'block', '#c77dff'],
  point: ['จุดยึด/ธง', '⚑', 'sys', 3, 3, 'none', '#f2d45e'],
  pickup: ['ของเก็บ/บัฟ', '✚', 'sys', 1, 1, 'none', '#6fcf97'],
  view: ['จุดมอง/มุมกล้อง', '◉', 'sys', 1, 1, 'none', '#dedede'],
  pillar: ['เสา', '▮', 'build', 1, 1, 'block', '#9a9aa4'],
  crate: ['ลัง/กล่อง (กำบัง)', '▣', 'build', 1, 1, 'block', '#b08850'],
  tree: ['ต้นไม้', '♣', 'build', 1, 1, 'block', '#3f7a3a'],
  bush: ['พุ่มไม้ (ซ่อนตัว)', '❦', 'build', 2, 2, 'none', '#4f8f45'],
  rock: ['หิน', '●', 'build', 2, 2, 'block', '#7d7d7d'],
  building: ['อาคาร/ห้องปิด', '⌂', 'build', 4, 4, 'block', '#7a6a5a'],
  tower: ['หอคอย', '♜', 'build', 3, 3, 'block', '#8a8090'],
  bridge: ['สะพาน/ทางยกระดับ', '═', 'build', 1, 4, 'pass', '#9a6b3f'],
  torch: ['คบเพลิง/แสง', '✹', 'build', 1, 1, 'none', '#f2a35e'],
  statue: ['รูปปั้น', '♞', 'build', 1, 1, 'block', '#a8a8b0'],
  deco: ['ของตกแต่ง', '✦', 'build', 1, 1, 'none', '#b0b0b0'],
  breakwall: ['กำแพงพังได้', '▦', 'ia', 3, 1, 'block', '#d08a4a', { kind: 'break', by: 'โจมตีปกติ', hp: '', res: 'เปิดทางผ่าน', post: 'pass' }],
  gate: ['ประตู/ประตูเหล็ก', '⊓', 'ia', 3, 1, 'block', '#c0a040', { kind: 'open', by: 'ผู้เล่นกดใช้', hp: '', res: 'เปิดทาง', post: 'pass' }],
  lever: ['คันโยก/สวิตช์', '⚲', 'ia', 1, 1, 'none', '#f2d45e', { kind: 'activate', by: 'ผู้เล่นกดใช้', hp: '', res: '', post: 'none' }],
  plate: ['แผ่นกดพื้น', '▢', 'ia', 1, 1, 'none', '#d8c070', { kind: 'activate', by: 'ยืนทับ', hp: '', res: '', post: 'none' }],
  drawbridge: ['สะพานชัก/สะพานยื่น', '⇕', 'ia', 2, 4, 'none', '#a07040', { kind: 'open', by: 'ผู้เล่นกดใช้', hp: '', res: 'สะพานลง เดินข้ามได้', post: 'pass' }],
  lift: ['ลิฟต์/ยกพื้น', '⇳', 'ia', 2, 2, 'none', '#70a0c0', { kind: 'lift', by: 'ยืนทับ', hp: '', res: '', post: 'none' }],
  jumppad: ['แท่นกระโดด', '⤒', 'ia', 1, 1, 'none', '#60c0a0', { kind: 'launch', by: 'ยืนทับ', hp: '', res: 'ดีดไปจุดเป้า', post: 'none' }],
  portal: ['จุดวาร์ป', '◎', 'ia', 1, 1, 'none', '#9070e0', { kind: 'warp', by: 'ผู้เล่นกดใช้', hp: '', res: 'วาร์ปไปจุดเป้า', post: 'none' }],
  barrel: ['ของระเบิดได้/ถัง', '◍', 'ia', 1, 1, 'block', '#c05040', { kind: 'break', by: 'Fire', hp: '', res: 'ระเบิดดาเมจรอบๆ', post: 'pass' }],
  climb: ['จุดปีน/เถาวัลย์', '⇡', 'ia', 1, 1, 'none', '#7aa050', { kind: 'climb', by: 'ผู้เล่นกดใช้', hp: '', res: 'ปีนขึ้นที่สูง', post: 'none' }],
  elem: ['แหล่งธาตุ/สิ่งแวดล้อม', '✺', 'ia', 2, 2, 'none', '#50b0d0', { kind: 'other', by: '', hp: '', res: '', post: 'none' }],
  trap: ['กับดัก', '⚠', 'ia', 1, 1, 'none', '#e07050', { kind: 'activate', by: 'ยืนทับ', hp: '', res: '', post: 'none' }],
  custom: ['อื่นๆ (กำหนดเอง)', '?', 'ia', 1, 1, 'none', '#c0c0c0', { kind: 'other', by: '', hp: '', res: '', post: 'none' }],
};
const OBJ_CAT = { sys: 'ระบบเกม', build: 'สิ่งก่อสร้าง/ของ', ia: 'Interact (โต้ตอบได้)' };
const ROUTE = { main: ['ทางหลัก', '#4a8cff'], flank: ['ทางอ้อม/ทางข้าง', '#f2a35e'], secret: ['ทางลับ', '#c77dff'], retreat: ['ทางถอย', '#6fcf97'], other: ['อื่นๆ', '#dedede'] };
const ZCOL = ['#4a8cff', '#f2a35e', '#6fcf97', '#c77dff', '#f06a6a', '#f2d45e', '#50b0d0'];

const TOOLS = [
  ['select', '⬚', 'V', 'เลือก/ย้าย'],
  null,
  ['height', '⛰', 'H', 'ความสูงพื้น / ทางลาด'],
  ['surf', '▧', 'S', 'พื้นผิว'],
  ['wall', '▤', 'W', 'กำแพง'],
  ['walk', '⊘', 'K', 'เดินได้/ห้ามเดิน (บังคับ)'],
  null,
  ['obj', '◆', 'O', 'วางของ / จุด Interact'],
  ['zone', '▭', 'Z', 'โซน (ตั้งชื่อพื้นที่)'],
  ['route', '〰', 'R', 'เส้นทาง (ทางหลัก/ทางอ้อม…)'],
  ['note', '✎', 'N', 'โน้ตบนแผนที่'],
  null,
  ['measure', '⇿', 'M', 'วัดระยะ / หาทางเดินจริง'],
];
const HINT = {
  select: 'คลิกเลือก • ลากย้าย • ลากมุมขวาล่าง = ปรับขนาด • Del ลบ • Ctrl+D สำเนา • , . หมุน • ลากที่ว่าง/คลิกกลาง/Space+ลาก = เลื่อนจอ',
  height: 'คลิกซ้าย = ทำ • คลิกขวา = กลับด้าน (ยก↔ลด / ตั้งค่า→ดูดค่า) • ทางลาด: ลากไปทางที่ "ขึ้น" • [ ] ขนาดแปรง • 0-9 ตั้งระดับ',
  surf: 'คลิกซ้าย = ระบาย • คลิกขวา = ดูดสีพื้นผิว • [ ] ขนาดแปรง',
  wall: 'คลิกซ้าย = วาด • คลิกขวา = ลบ • เส้นตรง/กรอบห้อง เลือกที่รูปแบบ • [ ] ขนาดแปรง',
  walk: 'บังคับเดินได้/ห้ามเดิน ทับผลอัตโนมัติ • คลิกขวา = ลบ (กลับเป็นอัตโนมัติ)',
  obj: 'คลิกวางของ (ลากต่อเพื่อย้าย) • Esc = กลับเครื่องมือเลือก',
  zone: 'ลากเป็นสี่เหลี่ยมเพื่อสร้างโซน',
  route: 'คลิกเพิ่มจุด • ดับเบิลคลิก/Enter/คลิกขวา = จบเส้น • Backspace ลบจุดล่าสุด • Esc ยกเลิก',
  note: 'คลิกวางโน้ต แล้วพิมพ์ข้อความทางขวา',
  measure: 'คลิกจุด A แล้วจุด B → หาทางเดินจริงตามกฎ (เส้นเขียว) + เส้นตรง (เส้นจาง)',
};

// ================= state =================
const $ = id => document.getElementById(id);
const cv = $('cv'), ctx = cv.getContext('2d');
let M = null, online = false, dirty = false, saveT = 0, list = [];
let tool = 'select';
const opt = { size: 1, shape: 'brush', hmode: 'raise', hval: 1, surf: 1, wall: 1, walk: 2, obj: 'spawnA', dir: 1, route: 'main' };
const show = { color: 'surf', grid: 1, hnum: 0, ramps: 1, walls: 1, objs: 1, zones: 1, routes: 1, notes: 1, ref: 1, walkov: 0, links: 1 };
let wstate = 'pre';
let sel = null; // {k:'obj'|'zone'|'route'|'note', id}
const view = { ox: 40, oy: 40, z: 16 };
let undo = [], redo = [];
let drag = null, hover = null, routeDraft = null, measure = null, linkMode = false, spaceDown = false;
let WK = null, REP = null, repT = 0;
const refImg = new Image(); let refSrc = '';
refImg.onload = () => req();

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const grid = (w, h, v) => Array.from({ length: h }, () => Array(w).fill(v));
const inb = (x, y) => x >= 0 && y >= 0 && x < M.w && y < M.h;
const nid = p => p + (M.seq = (M.seq || 1) + 1);
const byId = id => M.objs.find(o => o.id === id);
const odef = o => OBJ[o.t] || OBJ.custom;

function newMap(o) {
  const w = clamp(o.w | 0 || 48, 8, 200), h = clamp(o.h | 0 || 32, 8, 200);
  return { v: 1, id: o.id, name: o.name || o.id, desc: '', w, h, cell: +o.cell || 1, lvl: +o.lvl || 1, seq: 1,
    rules: { up: 0, down: 2, speed: 6, diag: true },
    height: grid(w, h, o.base | 0), surf: grid(w, h, o.surf == null ? 1 : o.surf), wall: grid(w, h, 0), walk: grid(w, h, 0), ramp: grid(w, h, 0),
    objs: [], zones: [], routes: [], notes: [], ref: null };
}
function fixMap(m) {
  const d = newMap({ id: m.id || 'map', w: m.w, h: m.h });
  for (const k in d) if (m[k] == null) m[k] = d[k];
  m.rules = Object.assign({}, d.rules, m.rules);
  for (const k of ['height', 'surf', 'wall', 'walk', 'ramp']) {
    const g = m[k], def = k === 'surf' ? 1 : 0;
    m[k] = Array.from({ length: m.h }, (_, y) => Array.from({ length: m.w }, (_, x) => (g && g[y] && g[y][x] != null) ? +g[y][x] : def));
  }
  for (const o of m.objs) { if (!o.foot) o.foot = odef(o)[5]; if (o.rot == null) o.rot = 0; }
  return m;
}

// ================= undo =================
function snap() { return JSON.stringify(M); }
function pushUndo() { undo.push(snap()); if (undo.length > 120) undo.shift(); redo = []; }
function doUndo() { if (!undo.length) return; redo.push(snap()); M = JSON.parse(undo.pop()); afterLoad(true); changed(); }
function doRedo() { if (!redo.length) return; undo.push(snap()); M = JSON.parse(redo.pop()); afterLoad(true); changed(); }

// ================= walkability =================
function walkInfo(st) {
  const W = M.w, H = M.h, N = W * H;
  const blk = new Uint8Array(N), hg = new Float32Array(N), mul = new Float32Array(N), ramp = new Uint8Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, s = SURF[M.surf[y][x]] || SURF[0];
    blk[i] = (!s.walk || M.wall[y][x] > 0) ? 1 : 0; hg[i] = M.height[y][x]; mul[i] = s.mul || 1; ramp[i] = M.ramp[y][x];
  }
  const edges = new Map();
  for (const o of M.objs) {
    const eff = (st === 'post' && o.ia) ? (o.ia.post || 'none') : o.foot;
    for (const [x, y] of foot(o)) {
      const i = y * W + x;
      if (eff === 'block') blk[i] = 1;
      else if (eff === 'pass') { blk[i] = 0; if (o.lv != null && o.lv !== '') hg[i] = +o.lv; }
    }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = M.walk[y][x]; if (v === 1) blk[y * W + x] = 0; else if (v === 2) blk[y * W + x] = 1; }
  // link edges: launch/warp one-way, lift two-way
  for (const o of M.objs) {
    if (!o.ia || !o.links || !o.links.length) continue;
    const k = o.ia.kind; if (k !== 'launch' && k !== 'warp' && k !== 'lift') continue;
    for (const tid of o.links) {
      const t = byId(tid); if (!t) continue;
      const a = cellsFor(o, blk), b = cellsFor(t, blk);
      if (!a.length || !b.length) continue;
      const add = (from, to) => { for (const i of from) { if (!edges.has(i)) edges.set(i, []); edges.get(i).push(to[0]); } };
      add(a, b); if (k === 'lift') add(b, a);
    }
  }
  return { W, H, blk, hg, mul, ramp, edges };
}
function foot(o) {
  const r = [];
  for (let y = Math.floor(o.y); y < Math.ceil(o.y + o.h); y++) for (let x = Math.floor(o.x); x < Math.ceil(o.x + o.w); x++) if (inb(x, y)) r.push([x, y]);
  return r;
}
// walkable cells for an object: its footprint, else ring around it
function cellsFor(o, blk) {
  const W = M.w; let r = foot(o).map(([x, y]) => y * W + x).filter(i => !blk[i]);
  if (r.length) return r;
  const x0 = Math.floor(o.x) - 1, y0 = Math.floor(o.y) - 1, x1 = Math.ceil(o.x + o.w), y1 = Math.ceil(o.y + o.h);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if ((x === x0 || x === x1 || y === y0 || y === y1) && inb(x, y) && !blk[y * W + x]) r.push(y * W + x);
  return r;
}
function stepOk(w, a, b, dx, dy) {
  if (w.blk[b]) return false;
  const dh = w.hg[b] - w.hg[a];
  if (dh === 0) return true;
  const R = M.rules;
  if (dh === 1 && w.ramp[a] && DIRS[w.ramp[a]][0] === dx && DIRS[w.ramp[a]][1] === dy) return true;
  if (dh === -1 && w.ramp[b] && DIRS[w.ramp[b]][0] === -dx && DIRS[w.ramp[b]][1] === -dy) return true;
  if (dh > 0) return dh <= (R.up || 0);
  return -dh <= (R.down || 0);
}
function* nbrs(w, a) {
  const x = a % w.W, y = (a / w.W) | 0;
  for (let d = 1; d <= 4; d++) {
    const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
    if (nx < 0 || ny < 0 || nx >= w.W || ny >= w.H) continue;
    const b = ny * w.W + nx; if (stepOk(w, a, b, DIRS[d][0], DIRS[d][1])) yield [b, 1];
  }
  if (M.rules.diag) for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= w.W || ny >= w.H) continue;
    const b = ny * w.W + nx, c1 = y * w.W + nx, c2 = ny * w.W + x;
    if (w.hg[b] !== w.hg[a] || w.hg[c1] !== w.hg[a] || w.hg[c2] !== w.hg[a]) continue;
    if (w.blk[b] || w.blk[c1] || w.blk[c2]) continue;
    yield [b, Math.SQRT2];
  }
  const e = w.edges.get(a); if (e) for (const b of e) yield [b, 0];
}
function flood(w, src) {
  const seen = new Uint8Array(w.W * w.H), q = [];
  for (const s of src) if (!seen[s]) { seen[s] = 1; q.push(s); }
  while (q.length) { const a = q.pop(); for (const [b] of nbrs(w, a)) if (!seen[b]) { seen[b] = 1; q.push(b); } }
  return seen;
}
// Dijkstra: returns {cells, len (m), time (s)} or null
function findPath(w, src, dst) {
  if (!src.length || !dst.length) return null;
  const N = w.W * w.H, dist = new Float64Array(N).fill(Infinity), geo = new Float64Array(N), prev = new Int32Array(N).fill(-1), goal = new Set(dst);
  const heap = [];
  const push = (i, d) => { heap.push([d, i]); let k = heap.length - 1; while (k) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  for (const s of src) { dist[s] = 0; push(s, 0); }
  let end = -1;
  while (heap.length) {
    const [d, a] = pop(); if (d > dist[a]) continue;
    if (goal.has(a)) { end = a; break; }
    for (const [b, c] of nbrs(w, a)) {
      const nd = d + c * w.mul[b];
      if (nd < dist[b]) { dist[b] = nd; geo[b] = geo[a] + c; prev[b] = a; push(b, nd); }
    }
  }
  if (end < 0) return null;
  const cells = []; for (let i = end; i >= 0; i = prev[i]) cells.push(i);
  cells.reverse();
  return { cells, len: geo[end] * M.cell, time: dist[end] * M.cell / (M.rules.speed || 6) };
}
function analyze() {
  const r = { pre: walkInfo('pre'), post: walkInfo('post') };
  const w = r.pre, N = w.W * w.H;
  let walkable = 0; for (let i = 0; i < N; i++) if (!w.blk[i]) walkable++;
  const spawns = M.objs.filter(o => o.t === 'spawnA' || o.t === 'spawnB');
  const reach = new Uint8Array(N);
  r.src = spawns.map(o => {
    const src = cellsFor(o, w.blk), seen = flood(w, src); let n = 0;
    for (let i = 0; i < N; i++) if (seen[i]) { n++; reach[i] = 1; }
    const s2 = flood(r.post, cellsFor(o, r.post.blk)); let n2 = 0; for (let i = 0; i < N; i++) if (s2[i]) n2++;
    return { o, n, n2 };
  });
  r.reach = spawns.length ? reach : null;
  // unreached walkable regions (4-neighbour, any height)
  r.islands = [];
  if (spawns.length) {
    const seen = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      if (w.blk[i] || reach[i] || seen[i]) continue;
      const q = [i]; seen[i] = 1; let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      while (q.length) {
        const a = q.pop(), x = a % w.W, y = (a / w.W) | 0; n++;
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
        for (let d = 1; d <= 4; d++) { const nx = x + DIRS[d][0], ny = y + DIRS[d][1]; if (nx < 0 || ny < 0 || nx >= w.W || ny >= w.H) continue; const b = ny * w.W + nx; if (!seen[b] && !w.blk[b] && !reach[b]) { seen[b] = 1; q.push(b); } }
      }
      r.islands.push({ n, x0, y0, x1, y1 });
    }
    r.islands.sort((a, b) => b.n - a.n);
  }
  r.walkable = walkable;
  // paths between spawns and goals
  const goals = M.objs.filter(o => o.t === 'core' || o.t === 'point');
  const pairs = [];
  for (const s of spawns) for (const g of goals) pairs.push([s, g]);
  if (!goals.length) for (let i = 0; i < spawns.length; i++) for (let j = i + 1; j < spawns.length; j++) if (spawns[i].t !== spawns[j].t) pairs.push([spawns[i], spawns[j]]);
  r.paths = pairs.slice(0, 16).map(([a, b]) => ({ a, b,
    pre: findPath(r.pre, cellsFor(a, r.pre.blk), cellsFor(b, r.pre.blk)),
    post: findPath(r.post, cellsFor(a, r.post.blk), cellsFor(b, r.post.blk)) }));
  return r;
}
function refreshReport() { clearTimeout(repT); repT = setTimeout(() => { REP = analyze(); WK = REP[wstate]; renderCheck(); req(); }, 120); }
function routeLen(rt) { let L = 0; for (let i = 1; i < rt.pts.length; i++) L += Math.hypot(rt.pts[i][0] - rt.pts[i - 1][0], rt.pts[i][1] - rt.pts[i - 1][1]); return L * M.cell; }

// ================= rendering =================
let raf = 0;
function req() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; drawMain(); }); }
const colCache = new Map();
function hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgb(a) { return 'rgb(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ')'; }
function shade(c, f) { const a = hex(c); return f >= 1 ? rgb(a.map(v => v + (255 - v) * Math.min(f - 1, 0.8))) : rgb(a.map(v => v * f)); }
const HSTOP = [[-5, '#1d3557'], [-2, '#3d6e8c'], [0, '#5f8a4c'], [3, '#b5a45a'], [6, '#a0713f'], [10, '#d9d4cc'], [15, '#ffffff']];
function hcol(l) {
  for (let i = 1; i < HSTOP.length; i++) if (l <= HSTOP[i][0]) {
    const [l0, c0] = HSTOP[i - 1], [l1, c1] = HSTOP[i], t = (l - l0) / (l1 - l0), a = hex(c0), b = hex(c1);
    return rgb(a.map((v, k) => v + (b[k] - v) * t));
  }
  return '#ffffff';
}
function cellCol(s, l) {
  const k = show.color + s * 100 + l; let c = colCache.get(k);
  if (!c) { c = show.color === 'height' ? hcol(l) : shade((SURF[s] || SURF[0]).c, clamp(1 + l * 0.07, 0.55, 1.6)); colCache.set(k, c); }
  return c;
}
function drawMain() {
  const r = cv.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  if (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg0') || '#161616';
  ctx.fillRect(0, 0, r.width, r.height);
  if (!M) return;
  render(ctx, view.z, view.ox, view.oy, r.width, r.height, true);
  $('sZoom').textContent = Math.round(view.z) + ' px/ช่อง';
}
function render(g, z, ox, oy, VW, VH, live) {
  const W = M.w, H = M.h;
  const x0 = clamp(Math.floor(-ox / z), 0, W), y0 = clamp(Math.floor(-oy / z), 0, H);
  const x1 = clamp(Math.ceil((VW - ox) / z), 0, W), y1 = clamp(Math.ceil((VH - oy) / z), 0, H);
  const X = x => ox + x * z, Y = y => oy + y * z;
  // ground
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { g.fillStyle = cellCol(M.surf[y][x], M.height[y][x]); g.fillRect(X(x), Y(y), z + 0.5, z + 0.5); }
  // reference image
  if (show.ref && M.ref && M.ref.src && refImg.complete && refImg.naturalWidth) {
    const rf = M.ref, wc = rf.wc || W, hc = wc * refImg.naturalHeight / refImg.naturalWidth;
    g.globalAlpha = rf.op == null ? 0.5 : rf.op; g.drawImage(refImg, X(rf.x || 0), Y(rf.y || 0), wc * z, hc * z); g.globalAlpha = 1;
  }
  // cliffs: shadow on the lower side + dark edge line
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const h = M.height[y][x];
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const nx = x + dx, ny = y + dy; if (nx >= W || ny >= H) continue;
      const d = M.height[ny][nx] - h; if (!d) continue;
      const ad = Math.min(Math.abs(d), 4);
      // ramp connection = soft edge
      const rampLink = (d === 1 && M.ramp[y][x] && DIRS[M.ramp[y][x]][0] === dx && DIRS[M.ramp[y][x]][1] === dy) || (d === -1 && M.ramp[ny][nx] && DIRS[M.ramp[ny][nx]][0] === -dx && DIRS[M.ramp[ny][nx]][1] === -dy);
      const lx = d > 0 ? x : nx, ly = d > 0 ? y : ny; // lower cell
      if (!rampLink) {
        g.fillStyle = 'rgba(0,0,0,' + (0.12 + 0.06 * ad) + ')';
        const band = z * (0.12 + 0.07 * ad);
        if (dx) g.fillRect(d > 0 ? X(nx) - band : X(nx), Y(ly), band, z); else g.fillRect(X(lx), d > 0 ? Y(ny) - band : Y(ny), z, band);
      }
      g.strokeStyle = rampLink ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.7)'; g.lineWidth = rampLink ? 1 : Math.min(1 + ad * 0.8, z * 0.25);
      g.beginPath(); if (dx) { g.moveTo(X(nx), Y(y)); g.lineTo(X(nx), Y(y + 1)); } else { g.moveTo(X(x), Y(ny)); g.lineTo(X(x + 1), Y(ny)); } g.stroke();
    }
  }
  // ramps
  if (show.ramps) {
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = Math.max(1, z * 0.08);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const d = M.ramp[y][x]; if (!d) continue;
      const [dx, dy] = DIRS[d], cx = X(x + 0.5), cy = Y(y + 0.5), s = z * 0.28, px = -dy, py = dx;
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(X(x), Y(y), z, z);
      for (const off of [-0.18, 0.14]) {
        const bx = cx + dx * off * z, by = cy + dy * off * z;
        g.beginPath(); g.moveTo(bx - dx * s * 0.5 + px * s, by - dy * s * 0.5 + py * s); g.lineTo(bx + dx * s * 0.5, by + dy * s * 0.5); g.lineTo(bx - dx * s * 0.5 - px * s, by - dy * s * 0.5 - py * s); g.stroke();
      }
    }
  }
  // walls
  if (show.walls) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const v = M.wall[y][x]; if (!v) continue;
    const c = WALL[v].c, sx = X(x), sy = Y(y);
    if (v === 1) { g.fillStyle = c; g.fillRect(sx, sy, z + 0.5, z + 0.5); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(sx, sy, z, z * 0.25); }
    else if (v === 2) { g.fillStyle = c; g.fillRect(sx + z * 0.1, sy + z * 0.1, z * 0.8, z * 0.8); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(sx + z * 0.1, sy + z * 0.9); g.lineTo(sx + z * 0.9, sy + z * 0.1); g.stroke(); }
    else { g.strokeStyle = c; g.lineWidth = Math.max(1.5, z * 0.12); g.beginPath(); g.moveTo(sx + z * 0.15, sy + z * 0.15); g.lineTo(sx + z * 0.85, sy + z * 0.85); g.moveTo(sx + z * 0.85, sy + z * 0.15); g.lineTo(sx + z * 0.15, sy + z * 0.85); g.stroke(); }
  }
  // walk override marks
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const v = M.walk[y][x]; if (!v) continue;
    g.strokeStyle = v === 1 ? 'rgba(111,207,151,.9)' : 'rgba(240,106,106,.9)'; g.lineWidth = 1.5;
    g.strokeRect(X(x) + 2, Y(y) + 2, z - 4, z - 4);
  }
  // walk overlay
  if (show.walkov && WK) {
    const reach = wstate === 'pre' ? (REP && REP.reach) : null;
    const rs = REP && wstate === 'post' && REP.src.length ? flood(WK, [].concat(...REP.src.map(s => cellsFor(s.o, WK.blk)))) : reach;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = y * W + x;
      if (WK.blk[i]) { g.fillStyle = 'rgba(240,80,80,.32)'; g.fillRect(X(x), Y(y), z, z); }
      else if (rs && !rs[i]) { g.fillStyle = 'rgba(242,163,94,.45)'; g.fillRect(X(x), Y(y), z, z); }
      else if (rs) { g.fillStyle = 'rgba(111,207,151,.18)'; g.fillRect(X(x), Y(y), z, z); }
    }
  }
  // grid
  if (show.grid && z >= 6) {
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1; g.beginPath();
    for (let x = x0; x <= x1; x++) { g.moveTo(Math.round(X(x)) + 0.5, Y(y0)); g.lineTo(Math.round(X(x)) + 0.5, Y(y1)); }
    for (let y = y0; y <= y1; y++) { g.moveTo(X(x0), Math.round(Y(y)) + 0.5); g.lineTo(X(x1), Math.round(Y(y)) + 0.5); }
    g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.beginPath();
    for (let x = Math.ceil(x0 / 10) * 10; x <= x1; x += 10) { g.moveTo(Math.round(X(x)) + 0.5, Y(y0)); g.lineTo(Math.round(X(x)) + 0.5, Y(y1)); }
    for (let y = Math.ceil(y0 / 10) * 10; y <= y1; y += 10) { g.moveTo(X(x0), Math.round(Y(y)) + 0.5); g.lineTo(X(x1), Math.round(Y(y)) + 0.5); }
    g.stroke();
  }
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.strokeRect(X(0) - 0.5, Y(0) - 0.5, W * z + 1, H * z + 1);
  // height numbers
  if (show.hnum && z >= 14) {
    g.font = Math.round(z * 0.42) + 'px Consolas,monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillText(M.height[y][x], X(x + 0.5) + 1, Y(y + 0.5) + 1); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillText(M.height[y][x], X(x + 0.5), Y(y + 0.5)); }
  }
  // zones
  if (show.zones) for (const zn of M.zones) {
    const sx = X(zn.x), sy = Y(zn.y), w = zn.w * z, h = zn.h * z, c = zn.col || ZCOL[0];
    g.fillStyle = c + '18'; g.fillRect(sx, sy, w, h);
    g.setLineDash([6, 4]); g.strokeStyle = c; g.lineWidth = isSel('zone', zn.id) ? 2.5 : 1.5; g.strokeRect(sx, sy, w, h); g.setLineDash([]);
    label(g, zn.name, sx + 4, sy + 3, c, Math.max(10, Math.min(14, z * 0.7)), 'left', 'top');
    if (isSel('zone', zn.id)) handle(g, sx + w, sy + h);
  }
  // routes
  if (show.routes) for (const rt of M.routes.concat(routeDraft ? [routeDraft] : [])) drawRoute(g, rt, z, X, Y);
  // links
  if (show.links && show.objs) for (const o of M.objs) if (o.links) for (const tid of o.links) {
    const t = byId(tid); if (!t) continue;
    arrow(g, X(o.x + o.w / 2), Y(o.y + o.h / 2), X(t.x + t.w / 2), Y(t.y + t.h / 2), '#f2d45e', 1.5, true);
  }
  // objects
  if (show.objs) for (const o of M.objs) {
    const d = odef(o), sx = X(o.x), sy = Y(o.y), w = o.w * z, h = o.h * z, c = d[6];
    g.fillStyle = c + (o.foot === 'block' ? 'cc' : '88'); g.fillRect(sx + 1, sy + 1, w - 2, h - 2);
    g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1; g.strokeRect(sx + 1, sy + 1, w - 2, h - 2);
    if (o.ia) { g.setLineDash([4, 3]); g.strokeStyle = '#f2d45e'; g.lineWidth = 2; g.strokeRect(sx - 1, sy - 1, w + 2, h + 2); g.setLineDash([]); }
    const fs = Math.max(9, Math.min(w, h) * 0.62);
    g.font = '600 ' + fs + 'px "Segoe UI Symbol","Segoe UI",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
    g.fillText(d[1], sx + w / 2, sy + h / 2 + 1);
    if (o.t === 'spawnA' || o.t === 'spawnB' || o.t === 'view') { // facing
      const a = (o.rot || 0) * Math.PI / 180, cx = sx + w / 2, cy = sy + h / 2, R = Math.max(w, h) / 2 + 3;
      g.fillStyle = c; g.beginPath(); g.moveTo(cx + Math.sin(a) * (R + 6), cy - Math.cos(a) * (R + 6)); g.lineTo(cx + Math.sin(a + 0.5) * R, cy - Math.cos(a + 0.5) * R); g.lineTo(cx + Math.sin(a - 0.5) * R, cy - Math.cos(a - 0.5) * R); g.fill();
    }
    if (z >= 9 && (o.lb || live === false)) label(g, (o.lb || d[0]) + (o.ia ? ' ⚡' : ''), sx + w / 2, sy + h + 2, '#fff', Math.max(10, Math.min(13, z * 0.6)), 'center', 'top');
    if (isSel('obj', o.id)) { g.strokeStyle = '#8fb9ff'; g.lineWidth = 2; g.strokeRect(sx - 3, sy - 3, w + 6, h + 6); handle(g, sx + w, sy + h); }
  }
  // notes
  if (show.notes) for (const n of M.notes) {
    const sx = X(n.x), sy = Y(n.y), s = isSel('note', n.id);
    g.fillStyle = s ? '#8fb9ff' : '#f2d45e'; g.beginPath(); g.arc(sx, sy, 5, 0, 7); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke();
    const tx = (n.text || '(โน้ต)').split('\n')[0].slice(0, 60);
    label(g, tx, sx + 8, sy - 7, s ? '#8fb9ff' : '#f2d45e', 12, 'left', 'top', true);
  }
  // measure
  if (measure) {
    const P = (p) => [X(p[0] + 0.5), Y(p[1] + 0.5)];
    if (measure.b) {
      const [ax, ay] = P(measure.a), [bx, by] = P(measure.b);
      g.setLineDash([3, 4]); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); g.setLineDash([]);
      if (measure.path) {
        g.strokeStyle = '#6fcf97'; g.lineWidth = Math.max(2, z * 0.18); g.lineJoin = 'round'; g.beginPath();
        measure.path.cells.forEach((i, k) => { const x = X(i % W + 0.5), y = Y(((i / W) | 0) + 0.5); k ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
      }
      const st = Math.hypot(measure.b[0] - measure.a[0], measure.b[1] - measure.a[1]) * M.cell;
      label(g, measure.path ? `เดินจริง ${measure.path.len.toFixed(1)} ม. (~${measure.path.time.toFixed(1)} วิ) • เส้นตรง ${st.toFixed(1)} ม.` : `ไปไม่ถึง! • เส้นตรง ${st.toFixed(1)} ม.`, bx + 10, by + 6, measure.path ? '#6fcf97' : '#f06a6a', 13, 'left', 'top', true);
    }
    const [ax, ay] = P(measure.a); g.fillStyle = '#fff'; g.beginPath(); g.arc(ax, ay, 5, 0, 7); g.fill();
    if (measure.b) { const [bx, by] = P(measure.b); g.beginPath(); g.arc(bx, by, 5, 0, 7); g.fill(); }
  }
  // tool preview
  if (live && drag && drag.prev) {
    const p = drag.prev; g.strokeStyle = '#8fb9ff'; g.lineWidth = 2; g.setLineDash([5, 4]);
    if (p.cells) { g.fillStyle = 'rgba(74,140,255,.3)'; for (const [x, y] of p.cells) g.fillRect(X(x), Y(y), z, z); }
    else g.strokeRect(X(p.x0), Y(p.y0), (p.x1 - p.x0 + 1) * z, (p.y1 - p.y0 + 1) * z);
    g.setLineDash([]);
  }
  if (live && hover && !drag && ['height', 'surf', 'wall', 'walk'].includes(tool) && opt.shape !== 'fill') {
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1;
    const [bx, by, bs] = brushBox(hover.cx, hover.cy); g.strokeRect(X(bx) + 0.5, Y(by) + 0.5, bs * z - 1, bs * z - 1);
  }
}
function isSel(k, id) { return sel && sel.k === k && sel.id === id; }
function handle(g, x, y) { g.fillStyle = '#8fb9ff'; g.fillRect(x - 4, y - 4, 8, 8); }
function label(g, t, x, y, c, fs, al, bl, box) {
  g.font = fs + 'px "Segoe UI","Noto Sans Thai",sans-serif'; g.textAlign = al; g.textBaseline = bl;
  if (box) { const w = g.measureText(t).width; g.fillStyle = 'rgba(20,20,20,.8)'; g.fillRect(al === 'left' ? x - 3 : x - w / 2 - 3, y - 2, w + 6, fs + 5); }
  else { g.fillStyle = 'rgba(0,0,0,.75)'; g.fillText(t, x + 1, y + 1); }
  g.fillStyle = c; g.fillText(t, x, y);
}
function arrow(g, x1, y1, x2, y2, c, lw, dash) {
  g.strokeStyle = c; g.fillStyle = c; g.lineWidth = lw; if (dash) g.setLineDash([5, 4]);
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.setLineDash([]);
  const a = Math.atan2(y2 - y1, x2 - x1), mx = (x1 + x2) / 2, my = (y1 + y2) / 2, s = 7;
  g.beginPath(); g.moveTo(mx + Math.cos(a) * s, my + Math.sin(a) * s); g.lineTo(mx + Math.cos(a + 2.5) * s, my + Math.sin(a + 2.5) * s); g.lineTo(mx + Math.cos(a - 2.5) * s, my + Math.sin(a - 2.5) * s); g.fill();
}
function drawRoute(g, rt, z, X, Y) {
  if (!rt.pts.length) return;
  const c = rt.col || (ROUTE[rt.kind] || ROUTE.other)[1], s = isSel('route', rt.id);
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = Math.max(3, z * 0.22) + 2; g.beginPath();
  rt.pts.forEach((p, i) => i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1]))); g.stroke();
  g.strokeStyle = c; g.lineWidth = Math.max(3, z * 0.22); g.beginPath();
  rt.pts.forEach((p, i) => i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1]))); g.stroke();
  let best = 0, bl = -1;
  for (let i = 1; i < rt.pts.length; i++) {
    const ax = X(rt.pts[i - 1][0]), ay = Y(rt.pts[i - 1][1]), bx = X(rt.pts[i][0]), by = Y(rt.pts[i][1]), L = Math.hypot(bx - ax, by - ay);
    if (L > bl) { bl = L; best = i; }
    if (L < 14) continue;
    const a = Math.atan2(by - ay, bx - ax), mx = (ax + bx) / 2, my = (ay + by) / 2, sz = Math.max(6, z * 0.35);
    g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1; g.beginPath();
    g.moveTo(mx + Math.cos(a) * sz, my + Math.sin(a) * sz); g.lineTo(mx + Math.cos(a + 2.4) * sz, my + Math.sin(a + 2.4) * sz); g.lineTo(mx + Math.cos(a - 2.4) * sz, my + Math.sin(a - 2.4) * sz); g.closePath(); g.fill(); g.stroke();
  }
  if (s) for (const p of rt.pts) { g.fillStyle = '#fff'; g.fillRect(X(p[0]) - 4, Y(p[1]) - 4, 8, 8); }
  if (rt.pts.length < 2) return;
  const pa = rt.pts[best - 1], pb = rt.pts[best], lx = X((pa[0] + pb[0]) / 2), ly = Y((pa[1] + pb[1]) / 2);
  label(g, (rt.name || '') + ' · ' + routeLen(rt).toFixed(0) + ' ม.', lx + 10, ly + 8, c, 12, 'left', 'top', true);
}

// ================= input helpers =================
function toCell(e) {
  const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
  const fx = (px - view.ox) / view.z, fy = (py - view.oy) / view.z;
  return { px, py, fx, fy, cx: Math.floor(fx), cy: Math.floor(fy) };
}
function brushBox(cx, cy) { const s = opt.size, o = Math.floor((s - 1) / 2); return [cx - o, cy - o, s]; }
function brushCells(cx, cy) { const [bx, by, s] = brushBox(cx, cy), r = []; for (let y = by; y < by + s; y++) for (let x = bx; x < bx + s; x++) if (inb(x, y)) r.push([x, y]); return r; }
function lineCells(x0, y0, x1, y1) {
  const r = [], dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
  for (;;) { r.push([x0, y0]); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  return r;
}
function rectCells(a, b, outline) {
  const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]), r = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y) && (!outline || x === x0 || x === x1 || y === y0 || y === y1)) r.push([x, y]);
  return r;
}
function floodCells(layer, sx, sy) {
  if (!inb(sx, sy)) return [];
  const g = M[layer], v = g[sy][sx], seen = new Set([sy * M.w + sx]), q = [[sx, sy]], r = [];
  while (q.length) {
    const [x, y] = q.pop(); r.push([x, y]);
    for (let d = 1; d <= 4; d++) { const nx = x + DIRS[d][0], ny = y + DIRS[d][1], k = ny * M.w + nx; if (inb(nx, ny) && !seen.has(k) && g[ny][nx] === v) { seen.add(k); q.push([nx, ny]); } }
    if (r.length > 50000) break;
  }
  return r;
}
const LAYER = { height: 'height', surf: 'surf', wall: 'wall', walk: 'walk' };
// apply paint tool on a cell; sec = right button
function paint(x, y, sec, visited, dir) {
  if (!inb(x, y)) return;
  const k = y * M.w + x; if (visited) { if (visited.has(k)) return; visited.add(k); }
  if (tool === 'height') {
    const m = opt.hmode;
    if (m === 'ramp') { M.ramp[y][x] = sec ? 0 : (dir || opt.dir); return; }
    if (m === 'raise' || m === 'lower') { const up = (m === 'raise') !== !!sec; M.height[y][x] = clamp(M.height[y][x] + (up ? 1 : -1), HMIN, HMAX); return; }
    if (m === 'set') { M.height[y][x] = opt.hval; return; }
    if (m === 'smooth') {
      let s = 0, n = 0; for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) if (inb(xx, yy)) { s += M.height[yy][xx]; n++; }
      M.height[y][x] = Math.round(s / n); return;
    }
  }
  if (tool === 'surf') M.surf[y][x] = opt.surf;
  if (tool === 'wall') M.wall[y][x] = sec ? 0 : opt.wall;
  if (tool === 'walk') M.walk[y][x] = sec ? 0 : opt.walk;
}
function pick(x, y) { // eyedropper
  if (!inb(x, y)) return;
  if (tool === 'height') { opt.hval = M.height[y][x]; opt.hmode = 'set'; }
  if (tool === 'surf') opt.surf = M.surf[y][x];
  renderOpts();
}
function hit(fx, fy) {
  const z = view.z, tol = 6 / z;
  if (show.notes) for (let i = M.notes.length - 1; i >= 0; i--) { const n = M.notes[i]; if (Math.hypot(n.x - fx, n.y - fy) < 8 / z) return { k: 'note', id: n.id }; }
  if (show.objs) for (let i = M.objs.length - 1; i >= 0; i--) { const o = M.objs[i]; if (fx >= o.x - tol && fx <= o.x + o.w + tol && fy >= o.y - tol && fy <= o.y + o.h + tol) return { k: 'obj', id: o.id }; }
  if (show.routes) for (let i = M.routes.length - 1; i >= 0; i--) {
    const rt = M.routes[i];
    for (let j = 0; j < rt.pts.length; j++) if (Math.hypot(rt.pts[j][0] - fx, rt.pts[j][1] - fy) < 8 / z) return { k: 'route', id: rt.id, pt: j };
    for (let j = 1; j < rt.pts.length; j++) if (segDist(fx, fy, rt.pts[j - 1], rt.pts[j]) < Math.max(0.3, 6 / z)) return { k: 'route', id: rt.id };
  }
  if (show.zones) for (let i = M.zones.length - 1; i >= 0; i--) { const q = M.zones[i]; if (fx >= q.x && fx <= q.x + q.w && fy >= q.y && fy <= q.y + q.h) return { k: 'zone', id: q.id }; }
  return null;
}
function segDist(px, py, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, t = clamp(((px - a[0]) * dx + (py - a[1]) * dy) / L, 0, 1); return Math.hypot(a[0] + t * dx - px, a[1] + t * dy - py); }
function getSel() { if (!sel) return null; const arr = { obj: M.objs, zone: M.zones, route: M.routes, note: M.notes }[sel.k]; return arr && arr.find(v => v.id === sel.id); }
function setSel(s) { sel = s; renderSide(); req(); }

// ================= pointer =================
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointerdown', e => {
  if (!M) return;
  cv.focus(); cv.setPointerCapture(e.pointerId);
  const c = toCell(e), sec = e.button === 2;
  if (e.button === 1 || spaceDown) { drag = { pan: 1, sx: e.clientX, sy: e.clientY, ox: view.ox, oy: view.oy }; return; }
  if (linkMode) {
    const h = hit(c.fx, c.fy), src = getSel();
    if (h && h.k === 'obj' && src && h.id !== src.id) { pushUndo(); src.links = src.links || []; const i = src.links.indexOf(h.id); i < 0 ? src.links.push(h.id) : src.links.splice(i, 1); changed(); renderSide(); }
    return;
  }
  if (tool === 'select') {
    const s = getSel();
    if (s && (sel.k === 'obj' || sel.k === 'zone') && Math.abs(c.fx - (s.x + s.w)) < 8 / view.z + 0.15 && Math.abs(c.fy - (s.y + s.h)) < 8 / view.z + 0.15) {
      pushUndo(); drag = { resize: s, moved: 0 }; return;
    }
    const h = hit(c.fx, c.fy);
    if (sec) { if (h) setSel(h); return; }
    if (h) {
      setSel({ k: h.k, id: h.id }); const it = getSel(); pushUndo();
      drag = { move: it, k: h.k, pt: h.pt, fx: c.fx, fy: c.fy, orig: JSON.parse(JSON.stringify(it)), moved: 0 };
    } else { setSel(null); drag = { pan: 1, sx: e.clientX, sy: e.clientY, ox: view.ox, oy: view.oy }; }
    return;
  }
  if (tool in LAYER) {
    if (e.altKey || (sec && (tool === 'surf' || (tool === 'height' && opt.hmode === 'set')))) { pick(c.cx, c.cy); return; }
    pushUndo();
    if (opt.shape === 'fill' && tool !== 'height' || (tool === 'height' && opt.shape === 'fill' && opt.hmode !== 'ramp' && opt.hmode !== 'smooth')) {
      for (const [x, y] of floodCells(LAYER[tool], c.cx, c.cy)) paint(x, y, sec, null);
      changed(); drag = null; return;
    }
    if (opt.shape === 'rect' || opt.shape === 'line' || opt.shape === 'frame') { drag = { shape: opt.shape, a: [c.cx, c.cy], b: [c.cx, c.cy], sec }; updShapePrev(); req(); return; }
    drag = { paint: 1, sec, visited: new Set(), last: [c.cx, c.cy] };
    for (const [x, y] of brushCells(c.cx, c.cy)) paint(x, y, sec, drag.visited);
    changed(); return;
  }
  if (tool === 'obj') {
    const d = OBJ[opt.obj]; pushUndo();
    const o = { id: nid('o'), t: opt.obj, x: clamp(c.cx - Math.floor((d[3] - 1) / 2), 0, M.w - d[3]), y: clamp(c.cy - Math.floor((d[4] - 1) / 2), 0, M.h - d[4]), w: d[3], h: d[4], rot: 0, lb: '', note: '', foot: d[5] };
    if (d[7]) o.ia = JSON.parse(JSON.stringify(d[7]));
    M.objs.push(o); setSel({ k: 'obj', id: o.id }); changed();
    drag = { move: o, k: 'obj', fx: c.fx, fy: c.fy, orig: JSON.parse(JSON.stringify(o)), moved: 0 };
    return;
  }
  if (tool === 'zone') { drag = { zone: 1, a: [c.cx, c.cy], b: [c.cx, c.cy] }; updShapePrev(); req(); return; }
  if (tool === 'route') {
    const p = snapPt(c, e);
    if (sec) { finishRoute(); return; }
    if (!routeDraft) routeDraft = { id: 'draft', name: ROUTE[opt.route][0], kind: opt.route, pts: [] };
    const L = routeDraft.pts[routeDraft.pts.length - 1];
    if (!L || L[0] !== p[0] || L[1] !== p[1]) routeDraft.pts.push(p);
    req(); return;
  }
  if (tool === 'note') {
    pushUndo(); const n = { id: nid('n'), x: +c.fx.toFixed(2), y: +c.fy.toFixed(2), text: '' };
    M.notes.push(n); setSel({ k: 'note', id: n.id }); changed();
    setTimeout(() => { const t = document.querySelector('#side textarea'); if (t) t.focus(); }, 30);
    return;
  }
  if (tool === 'measure') {
    if (!inb(c.cx, c.cy)) return;
    if (!measure || measure.b) measure = { a: [c.cx, c.cy] };
    else { measure.b = [c.cx, c.cy]; runMeasure(); }
    req();
  }
});
function runMeasure() {
  if (!measure || !measure.b) return;
  const w = walkInfo(wstate);
  measure.path = findPath(w, [measure.a[1] * M.w + measure.a[0]], [measure.b[1] * M.w + measure.b[0]]);
}
function snapPt(c, e) { return e.altKey ? [+c.fx.toFixed(2), +c.fy.toFixed(2)] : [c.cx + 0.5, c.cy + 0.5]; }
function updShapePrev() {
  const d = drag; if (!d) return;
  if (d.zone) { d.prev = { x0: Math.min(d.a[0], d.b[0]), y0: Math.min(d.a[1], d.b[1]), x1: Math.max(d.a[0], d.b[0]), y1: Math.max(d.a[1], d.b[1]) }; return; }
  d.prev = { cells: shapeCells(d) };
}
function shapeCells(d) {
  if (d.shape === 'line') { const out = new Map(); for (const [x, y] of lineCells(d.a[0], d.a[1], d.b[0], d.b[1])) for (const c of brushCells(x, y)) out.set(c[1] * M.w + c[0], c); return [...out.values()]; }
  return rectCells(d.a, d.b, d.shape === 'frame');
}
cv.addEventListener('pointermove', e => {
  if (!M) return;
  const c = toCell(e); hover = c; status(c);
  const d = drag;
  if (!d) { if (['height', 'surf', 'wall', 'walk'].includes(tool)) req(); return; }
  if (d.pan) { view.ox = d.ox + e.clientX - d.sx; view.oy = d.oy + e.clientY - d.sy; req(); return; }
  if (d.paint) {
    let dir = 0;
    if (tool === 'height' && opt.hmode === 'ramp') {
      const ddx = c.cx - d.last[0], ddy = c.cy - d.last[1];
      if (ddx || ddy) { dir = Math.abs(ddx) >= Math.abs(ddy) ? (ddx > 0 ? 2 : 4) : (ddy > 0 ? 3 : 1); d.dir = dir; if (!d.fixed) { d.fixed = 1; for (const k of d.visited) { const x = k % M.w, y = (k / M.w) | 0; if (M.ramp[y][x]) M.ramp[y][x] = dir; } } }
    }
    for (const [x, y] of lineCells(d.last[0], d.last[1], c.cx, c.cy)) for (const [bx, by] of brushCells(x, y)) paint(bx, by, d.sec, d.visited, d.dir);
    d.last = [c.cx, c.cy]; changed(true); return;
  }
  if (d.shape || d.zone) { d.b = [c.cx, c.cy]; updShapePrev(); req(); return; }
  if (d.resize) { const s = d.resize; s.w = clamp(Math.round(c.fx - s.x), 1, M.w); s.h = clamp(Math.round(c.fy - s.y), 1, M.h); d.moved = 1; changed(true); return; }
  if (d.move) {
    const dx = c.fx - d.fx, dy = c.fy - d.fy, it = d.move, o = d.orig;
    if (d.k === 'obj' || d.k === 'zone') { it.x = clamp(Math.round(o.x + dx), 0, M.w - it.w); it.y = clamp(Math.round(o.y + dy), 0, M.h - it.h); }
    else if (d.k === 'note') { it.x = +(o.x + dx).toFixed(2); it.y = +(o.y + dy).toFixed(2); }
    else if (d.k === 'route') {
      const r = v => e.altKey ? +v.toFixed(2) : Math.round(v - 0.5) + 0.5;
      if (d.pt != null) it.pts[d.pt] = [r(o.pts[d.pt][0] + dx), r(o.pts[d.pt][1] + dy)];
      else { const sx = Math.round(dx), sy = Math.round(dy); it.pts = o.pts.map(p => [p[0] + sx, p[1] + sy]); }
    }
    d.moved = 1; changed(true);
  }
});
cv.addEventListener('pointerup', e => {
  const d = drag; drag = null; if (!d || !M) return;
  if (d.shape) { for (const [x, y] of shapeCells(d)) paint(x, y, d.sec, null); changed(); }
  else if (d.zone) {
    const p = d.prev; pushUndo();
    const zn = { id: nid('z'), name: 'โซน ' + (M.zones.length + 1), x: clamp(p.x0, 0, M.w - 1), y: clamp(p.y0, 0, M.h - 1), w: p.x1 - p.x0 + 1, h: p.y1 - p.y0 + 1, col: ZCOL[M.zones.length % ZCOL.length], note: '' };
    M.zones.push(zn); setSel({ k: 'zone', id: zn.id }); changed();
  }
  else if ((d.move || d.resize) && !d.moved && tool === 'select') undo.pop();
  else if (d.paint || d.move || d.resize) changed();
  req();
});
cv.addEventListener('dblclick', () => { if (tool === 'route') finishRoute(); });
cv.addEventListener('pointerleave', () => { hover = null; req(); });
cv.addEventListener('wheel', e => {
  e.preventDefault(); const c = toCell(e), f = Math.exp(-e.deltaY * 0.0015), z = clamp(view.z * f, 2, 80);
  view.ox = c.px - c.fx * z; view.oy = c.py - c.fy * z; view.z = z; req();
}, { passive: false });
function finishRoute() {
  if (!routeDraft) return;
  if (routeDraft.pts.length >= 2) {
    pushUndo(); routeDraft.id = nid('r'); M.routes.push(routeDraft); setSel({ k: 'route', id: routeDraft.id }); changed();
  }
  routeDraft = null; req();
}
function status(c) {
  if (!inb(c.cx, c.cy)) { $('sCell').textContent = '–'; $('sInfo').textContent = ''; return; }
  const x = c.cx, y = c.cy;
  $('sCell').textContent = `x ${x}  y ${y}`;
  const parts = [`สูง ${M.height[y][x]} (${(M.height[y][x] * M.lvl).toFixed(1)} ม.)`, SURF[M.surf[y][x]].n];
  if (M.ramp[y][x]) parts.push('ทางลาดขึ้น ' + DIRN[M.ramp[y][x]]);
  if (M.wall[y][x]) parts.push(WALL[M.wall[y][x]].n);
  if (M.walk[y][x]) parts.push(WALK[M.walk[y][x]].n);
  if (WK) parts.push(WK.blk[y * M.w + x] ? '⛔ เดินไม่ได้' : '✓ เดินได้');
  $('sInfo').textContent = parts.join(' • ');
}

// ================= keyboard =================
addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') { if (e.key === 'Escape') e.target.blur(); if (!(e.ctrlKey && e.key.toLowerCase() === 's')) return; }
  const k = e.key.toLowerCase();
  if (e.ctrlKey || e.metaKey) {
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); doUndo(); }
    else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); doRedo(); }
    else if (k === 's') { e.preventDefault(); save(); }
    else if (k === 'd') { e.preventDefault(); dupSel(); }
    return;
  }
  if (e.key === ' ') { spaceDown = true; e.preventDefault(); return; }
  if (e.key === 'Escape') { if (linkMode) { linkMode = false; $('linkBanner').style.display = 'none'; renderSide(); } else if (routeDraft) { routeDraft = null; req(); } else if (measure) { measure = null; req(); } else if (tool !== 'select') setTool('select'); else setSel(null); return; }
  if (e.key === 'Enter' && routeDraft) { finishRoute(); return; }
  if (e.key === 'Backspace' && routeDraft) { routeDraft.pts.pop(); req(); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { delSel(); return; }
  if (e.key === '[') { opt.size = clamp(opt.size - 1, 1, 15); renderOpts(); req(); return; }
  if (e.key === ']') { opt.size = clamp(opt.size + 1, 1, 15); renderOpts(); req(); return; }
  if (e.key === ',' || e.key === '.') { rotSel(e.key === '.' ? 90 : -90); return; }
  if (tool === 'height' && /^[0-9]$/.test(e.key)) { opt.hval = +e.key; opt.hmode = 'set'; renderOpts(); return; }
  if (k === 'f') { fit(); return; }
  if (k === 'g') { show.grid ^= 1; renderSide(); req(); return; }
  const t = TOOLS.find(t => t && t[2].toLowerCase() === k); if (t) setTool(t[0]);
});
addEventListener('keyup', e => { if (e.key === ' ') spaceDown = false; });
addEventListener('resize', req);

function delSel() {
  const s = getSel(); if (!s) return; pushUndo();
  const arr = { obj: M.objs, zone: M.zones, route: M.routes, note: M.notes }[sel.k];
  arr.splice(arr.indexOf(s), 1);
  if (sel.k === 'obj') for (const o of M.objs) if (o.links) o.links = o.links.filter(i => i !== s.id);
  setSel(null); changed();
}
function dupSel() {
  const s = getSel(); if (!s) return; pushUndo();
  const c = JSON.parse(JSON.stringify(s)), arr = { obj: M.objs, zone: M.zones, route: M.routes, note: M.notes }[sel.k];
  c.id = nid(sel.k[0]); if (c.pts) c.pts = c.pts.map(p => [p[0] + 1, p[1] + 1]); else { c.x = Math.min(c.x + 1, M.w - (c.w || 1)); c.y = Math.min(c.y + 1, M.h - (c.h || 1)); }
  if (c.name) c.name += ' (สำเนา)';
  arr.push(c); setSel({ k: sel.k, id: c.id }); changed();
}
function rotSel(a) {
  const s = getSel(); if (!s || sel.k !== 'obj') return; pushUndo();
  s.rot = ((s.rot || 0) + a + 360) % 360;
  if (s.w !== s.h) { const cx = s.x + s.w / 2, cy = s.y + s.h / 2;[s.w, s.h] = [s.h, s.w]; s.x = clamp(Math.round(cx - s.w / 2), 0, M.w - s.w); s.y = clamp(Math.round(cy - s.h / 2), 0, M.h - s.h); }
  changed(); renderSide();
}

// ================= UI: tools + options =================
function setTool(t) { tool = t; if (t !== 'route') routeDraft = null; if (t !== 'measure') measure = null; renderTools(); renderOpts(); $('hint').textContent = HINT[t] || ''; req(); }
function renderTools() {
  const el = $('tools'); el.innerHTML = '';
  for (const t of TOOLS) {
    if (!t) { el.append(document.createElement('hr')); continue; }
    const b = document.createElement('button'); b.className = tool === t[0] ? 'on' : ''; b.title = t[3] + ' (' + t[2] + ')';
    b.innerHTML = t[1] + '<kbd>' + t[2] + '</kbd>'; b.onclick = () => setTool(t[0]); el.append(b);
  }
}
function seg(opts, cur, on) {
  const d = document.createElement('div'); d.className = 'seg';
  for (const [v, n, title] of opts) { const b = document.createElement('button'); b.textContent = n; if (title) b.title = title; if (v === cur) b.className = 'on'; b.onclick = () => on(v); d.append(b); }
  return d;
}
function h3(t) { const e = document.createElement('h3'); e.textContent = t; return e; }
function pal(items, cur, on, sw) {
  const d = document.createElement('div'); d.className = 'pal';
  items.forEach((it, i) => {
    if (!it) return; const v = it.v != null ? it.v : i;
    const b = document.createElement('button'); if (v === cur) b.className = 'on';
    b.innerHTML = `<span class="sw" style="background:${it.c || 'transparent'}">${it.ic || ''}</span><span>${esc(it.n)}</span>${it.k ? '<span class="k">' + it.k + '</span>' : ''}`;
    b.onclick = () => on(v); d.append(b);
  });
  return d;
}
function sizeRow() {
  const d = document.createElement('div'); d.className = 'row';
  d.innerHTML = `<label>ขนาดแปรง</label><input type="range" min="1" max="15" value="${opt.size}"><span style="width:20px;text-align:right">${opt.size}</span>`;
  d.querySelector('input').oninput = e => { opt.size = +e.target.value; d.querySelector('span').textContent = opt.size; };
  return d;
}
function shapeSeg(withLine) {
  const o = [['brush', 'แปรง'], ['rect', 'สี่เหลี่ยม']];
  if (withLine) o.push(['line', 'เส้นตรง'], ['frame', 'กรอบห้อง']);
  o.push(['fill', 'เติม', 'เติมพื้นที่ที่ติดกันและเหมือนกัน']);
  if (!o.find(x => x[0] === opt.shape)) opt.shape = 'brush';
  return seg(o, opt.shape, v => { opt.shape = v; renderOpts(); });
}
function renderOpts() {
  const el = $('opts'); el.innerHTML = '';
  const T = TOOLS.find(t => t && t[0] === tool); el.append(h3(T[3]));
  if (tool === 'select') {
    el.insertAdjacentHTML('beforeend', `<p class="mut">คลิกของ/โซน/เส้นทาง/โน้ต เพื่อแก้คุณสมบัติทางขวา<br>ไม่ได้เลือกอะไร = ตั้งค่าแผนที่ทางขวา</p>
      <h3>คีย์ลัด</h3><p class="mut">V เลือก • H ความสูง • S พื้นผิว • W กำแพง • K เดินได้ • O วางของ • Z โซน • R เส้นทาง • N โน้ต • M วัดระยะ<br>F ดูทั้งแผนที่ • G เส้นตาราง • ล้อเมาส์ = ซูม • Space/ปุ่มกลาง+ลาก = เลื่อน<br>Ctrl+Z/Y ย้อน/ทำซ้ำ • Ctrl+S บันทึก</p>`);
    return;
  }
  if (tool === 'height') {
    el.append(seg([['raise', '＋ ยก'], ['lower', '－ ลด'], ['set', '＝ ตั้งค่า'], ['smooth', '≈ เกลี่ย'], ['ramp', '⟋ ทางลาด']], opt.hmode, v => { opt.hmode = v; renderOpts(); }));
    if (opt.hmode === 'set') {
      el.append(h3('ระดับ (0-9 บนคีย์บอร์ด)'));
      const d = document.createElement('div'); d.className = 'row';
      d.innerHTML = `<input type="range" min="${HMIN}" max="${HMAX}" value="${opt.hval}"><input class="tl-in" type="number" min="${HMIN}" max="${HMAX}" value="${opt.hval}">`;
      const [r, n] = d.querySelectorAll('input'); r.oninput = () => { opt.hval = +r.value; n.value = r.value; }; n.oninput = () => { opt.hval = clamp(+n.value | 0, HMIN, HMAX); r.value = opt.hval; };
      el.append(d);
      el.insertAdjacentHTML('beforeend', `<p class="mut">1 ระดับ = ${M ? M.lvl : 1} ม. • คลิกขวา/Alt+คลิก = ดูดค่าจากพื้น</p>`);
    }
    if (opt.hmode === 'ramp') {
      el.append(h3('ทิศที่ทางลาด "ขึ้น"'));
      el.append(seg([[1, '↑'], [2, '→'], [3, '↓'], [4, '←']], opt.dir, v => { opt.dir = v; renderOpts(); }));
      el.insertAdjacentHTML('beforeend', '<p class="mut">ลากเมาส์ไปทางที่ขึ้น = ใช้ทิศที่ลากอัตโนมัติ<br>ทางลาดต่อช่องสูงต่างกัน 1 ระดับ (เช่น 0 → 1) ถ้าต่างกัน 2 ให้ทำทางลาด 2 ช่องติดกันแบบขั้นบันได<br>คลิกขวา = ลบทางลาด</p>');
    }
    el.append(h3('รูปแบบ'));
    if (opt.hmode === 'ramp' || opt.hmode === 'smooth') { if (opt.shape === 'fill') opt.shape = 'brush'; el.append(seg([['brush', 'แปรง'], ['rect', 'สี่เหลี่ยม']], opt.shape, v => { opt.shape = v; renderOpts(); })); }
    else el.append(shapeSeg(false));
    el.append(sizeRow());
    el.insertAdjacentHTML('beforeend', `<h3>สีตามความสูง</h3><div class="pal">${[-4, -2, 0, 2, 4, 6, 8, 10, 12].map(l => `<button style="pointer-events:none"><span class="sw" style="background:${hcol(l)}"></span>ระดับ ${l}</button>`).join('')}</div>`);
  }
  if (tool === 'surf') {
    el.append(pal(SURF.map(s => ({ n: s.n, c: s.c, k: s.ch })), opt.surf, v => { opt.surf = v; renderOpts(); }));
    el.append(h3('รูปแบบ')); el.append(shapeSeg(true)); el.append(sizeRow());
  }
  if (tool === 'wall') {
    el.append(pal(WALL.map((s, i) => i ? { n: s.n, c: s.c, k: s.ch } : null), opt.wall, v => { opt.wall = v; renderOpts(); }));
    el.append(h3('รูปแบบ')); el.append(shapeSeg(true)); el.append(sizeRow());
    el.insertAdjacentHTML('beforeend', '<p class="mut">กำแพงพังได้/ประตู ให้ใช้เครื่องมือ "วางของ" หมวด Interact (มีช่องบอกว่าพังด้วยอะไร เปิดแล้วเป็นยังไง)</p>');
  }
  if (tool === 'walk') {
    el.append(pal(WALK.map((s, i) => i ? { n: s.n, c: s.c } : null), opt.walk, v => { opt.walk = v; renderOpts(); }));
    el.append(h3('รูปแบบ')); el.append(shapeSeg(true)); el.append(sizeRow());
    el.insertAdjacentHTML('beforeend', '<p class="mut">ปกติระบบคำนวณเองจาก พื้นผิว + กำแพง + ของที่ขวาง + ความสูง ใช้อันนี้เฉพาะเมื่ออยากบังคับ เช่น ขอบหน้าผาที่ห้ามเดิน หรือทางที่ต้องเดินได้แน่ๆ<br>ดูผลได้ที่ "ตรวจทางเดิน" ทางขวา</p>');
  }
  if (tool === 'obj') {
    for (const cat in OBJ_CAT) {
      el.append(h3(OBJ_CAT[cat]));
      el.append(pal(Object.entries(OBJ).filter(([, d]) => d[2] === cat).map(([k, d]) => ({ v: k, n: d[0], c: d[6], ic: d[1] })), opt.obj, v => { opt.obj = v; renderOpts(); }));
    }
  }
  if (tool === 'route') {
    el.append(pal(Object.entries(ROUTE).map(([k, v]) => ({ v: k, n: v[0], c: v[1] })), opt.route, v => { opt.route = v; if (routeDraft) { routeDraft.kind = v; routeDraft.name = ROUTE[v][0]; } renderOpts(); req(); }));
    el.insertAdjacentHTML('beforeend', '<p class="mut">จุดจะจับกลางช่องอัตโนมัติ (กด Alt ค้าง = วางอิสระ)<br>เส้นทางนี้เป็นเส้นที่ "ตั้งใจ" ให้ผู้เล่นเดิน ส่วนทางเดินได้จริงดูจาก "ตรวจทางเดิน" / เครื่องมือวัดระยะ</p>');
  }
  if (tool === 'zone') el.insertAdjacentHTML('beforeend', '<p class="mut">ใช้ตั้งชื่อพื้นที่ เช่น ห้องหลัก ห้องข้าง ลานหน้าประตู แล้วเขียนหน้าที่/ความรู้สึกของพื้นที่ในโน้ต</p>');
  if (tool === 'note') el.insertAdjacentHTML('beforeend', '<p class="mut">โน้ตสำหรับอธิบายสิ่งที่วาดไม่ได้ เช่น "ตรงนี้มีเพดานต่ำ" "ฝ่ายรับควรเห็นจุดนี้จากหอคอย"</p>');
  if (tool === 'measure') {
    el.insertAdjacentHTML('beforeend', '<p class="mut">หาทางเดินจริงตามกฎการเดิน (ตั้งค่าที่ "ตั้งค่าแผนที่") คิดความช้าของพื้นผิวด้วย</p>');
    el.append(h3('สถานะ'));
    el.append(seg([['pre', 'ก่อน Interact'], ['post', 'หลัง Interact']], wstate, v => { wstate = v; WK = REP && REP[v]; runMeasure(); renderOpts(); renderCheck(); req(); }));
  }
}

// ================= UI: side panel =================
function field(lb, html) { const d = document.createElement('div'); d.className = 'row'; d.innerHTML = `<label>${lb}</label>` + html; return d; }
function bindIn(el, obj, key, opts = {}) {
  const i = el.querySelector('input,textarea,select');
  i.addEventListener('focus', () => { i._u = 0; });
  i.addEventListener('input', () => {
    if (!i._u) { pushUndo(); i._u = 1; }
    let v = i.type === 'checkbox' ? i.checked : i.value; if (opts.num) v = v === '' ? (opts.blank ? '' : 0) : +v;
    obj[key] = v; changed(true); if (opts.re) renderSide();
  });
  i.addEventListener('change', () => { i._u = 0; changed(); });
  return el;
}
function renderSide() {
  const el = $('side'); el.innerHTML = ''; if (!M) return;
  const s = getSel();
  const box = document.createElement('div'); box.className = 'sec';
  el.append(box);
  if (s && sel.k === 'obj') propObj(box, s);
  else if (s && sel.k === 'zone') propZone(box, s);
  else if (s && sel.k === 'route') propRoute(box, s);
  else if (s && sel.k === 'note') propNote(box, s);
  else propMap(box);
  // layers
  const lay = document.createElement('details'); lay.className = 'sec'; lay.open = true;
  lay.innerHTML = '<summary>การแสดงผล</summary>';
  lay.append(seg([['surf', 'สีพื้นผิว'], ['height', 'สีความสูง']], show.color, v => { show.color = v; colCache.clear(); renderSide(); req(); }));
  for (const [k, n] of [['grid', 'เส้นตาราง (G)'], ['hnum', 'ตัวเลขความสูง (ซูมใกล้)'], ['ramps', 'ทางลาด'], ['walls', 'กำแพง'], ['objs', 'ของ/Interact'], ['links', 'เส้นเชื่อม Interact'], ['zones', 'โซน'], ['routes', 'เส้นทาง'], ['notes', 'โน้ต'], ['ref', 'ภาพอ้างอิง'], ['walkov', 'ไฮไลต์ทางเดิน (เขียว=ไปถึง ส้ม=ไปไม่ถึง แดง=เดินไม่ได้)']]) {
    const l = document.createElement('label'); l.className = 'chk'; l.innerHTML = `<input type="checkbox" ${show[k] ? 'checked' : ''}> ${n}`;
    l.querySelector('input').onchange = e => { show[k] = e.target.checked ? 1 : 0; req(); }; lay.append(l);
  }
  el.append(lay);
  // check
  const ck = document.createElement('details'); ck.className = 'sec'; ck.open = true; ck.id = 'checkSec';
  ck.innerHTML = '<summary>ตรวจทางเดิน</summary><div id="checkBody"></div>';
  el.append(ck); renderCheck();
}
function propMap(box) {
  box.append(h3('ตั้งค่าแผนที่'));
  box.append(bindIn(field('ชื่อ', `<input class="tl-in" value="${esc(M.name)}">`), M, 'name'));
  box.append(field('id (ไฟล์)', `<span style="font:12px var(--fu);color:var(--tx2)">maps/${esc(M.id)}.*</span>`));
  box.append(h3('คำอธิบาย (Claude อ่าน)'));
  const ta = document.createElement('div'); ta.innerHTML = `<textarea class="tl-in" rows="4" placeholder="แผนที่นี้ทำเพื่ออะไร ใช้กับโหมดไหน ความรู้สึกที่อยากได้ ฯลฯ">${esc(M.desc)}</textarea>`;
  box.append(bindIn(ta, M, 'desc'));
  box.append(h3('ขนาด'));
  const sz = field('กว้าง×ยาว', `<input class="tl-in" type="number" min="8" max="200" value="${M.w}" style="width:60px"> × <input class="tl-in" type="number" min="8" max="200" value="${M.h}" style="width:60px"><button class="tl-btn" style="padding:2px 8px">ใช้</button>`);
  sz.querySelector('button').onclick = () => { const [a, b] = sz.querySelectorAll('input'); resizeMap(+a.value, +b.value); };
  box.append(sz);
  box.append(bindIn(field('1 ช่อง (ม.)', `<input class="tl-in" type="number" step="0.25" min="0.25" value="${M.cell}">`), M, 'cell', { num: 1 }));
  box.append(bindIn(field('1 ระดับ (ม.)', `<input class="tl-in" type="number" step="0.25" min="0.25" value="${M.lvl}">`), M, 'lvl', { num: 1 }));
  box.append(field('', `<span class="mut">= ${(M.w * M.cell).toFixed(0)} × ${(M.h * M.cell).toFixed(0)} ม.</span>`));
  box.append(h3('กฎการเดิน (ใช้ตรวจ/วัดระยะ)'));
  box.append(bindIn(field('ขึ้นได้', `<input class="tl-in" type="number" min="0" max="10" value="${M.rules.up}"><span class="mut">ระดับ (ไม่ใช้ทางลาด)</span>`), M.rules, 'up', { num: 1 }));
  box.append(bindIn(field('ลงได้', `<input class="tl-in" type="number" min="0" max="20" value="${M.rules.down}"><span class="mut">ระดับ (กระโดดลง)</span>`), M.rules, 'down', { num: 1 }));
  box.append(bindIn(field('ความเร็ว', `<input class="tl-in" type="number" step="0.5" min="0.5" value="${M.rules.speed}"><span class="mut">ม./วิ</span>`), M.rules, 'speed', { num: 1 }));
  box.append(bindIn(field('เดินทแยง', `<input type="checkbox" ${M.rules.diag ? 'checked' : ''}>`), M.rules, 'diag'));
  box.append(h3('ภาพอ้างอิง (วางใต้แผนที่ไว้ลอกลาย)'));
  const rb = document.createElement('div'); rb.className = 'btns';
  rb.innerHTML = `<button class="tl-btn">เลือกภาพ…</button>${M.ref ? '<button class="tl-btn dng">เอาออก</button>' : ''}`;
  rb.children[0].onclick = () => $('fileImg').click();
  if (M.ref) rb.children[1].onclick = () => { pushUndo(); M.ref = null; changed(); renderSide(); };
  box.append(rb);
  if (M.ref) {
    box.append(bindIn(field('ความทึบ', `<input type="range" min="0" max="1" step="0.05" value="${M.ref.op == null ? 0.5 : M.ref.op}">`), M.ref, 'op', { num: 1 }));
    box.append(bindIn(field('กว้าง (ช่อง)', `<input class="tl-in" type="number" step="0.5" value="${M.ref.wc || M.w}">`), M.ref, 'wc', { num: 1 }));
    box.append(bindIn(field('เลื่อน x', `<input class="tl-in" type="number" step="0.5" value="${M.ref.x || 0}">`), M.ref, 'x', { num: 1 }));
    box.append(bindIn(field('เลื่อน y', `<input class="tl-in" type="number" step="0.5" value="${M.ref.y || 0}">`), M.ref, 'y', { num: 1 }));
  }
  box.append(h3('อื่นๆ'));
  const ob = document.createElement('div'); ob.className = 'btns';
  ob.innerHTML = '<button class="tl-btn" title="ล้างทุกชั้นของแผนที่นี้">ล้างแผนที่</button>';
  ob.children[0].onclick = () => { if (!confirm('ล้างทุกอย่างในแผนที่นี้? (ย้อนกลับได้ด้วย Ctrl+Z)')) return; pushUndo(); const n = newMap({ id: M.id, name: M.name, w: M.w, h: M.h, cell: M.cell, lvl: M.lvl }); n.desc = M.desc; M = n; afterLoad(true); changed(); };
  box.append(ob);
}
function propObj(box, o) {
  const d = odef(o);
  box.append(h3(`${d[1]} ${d[0]} — ${o.id}`));
  const tsel = field('ประเภท', `<select class="tl-sel">${Object.entries(OBJ).map(([k, v]) => `<option value="${k}" ${k === o.t ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>`);
  tsel.querySelector('select').onchange = e => { pushUndo(); o.t = e.target.value; const nd = OBJ[o.t]; o.foot = nd[5]; if (nd[7] && !o.ia) o.ia = JSON.parse(JSON.stringify(nd[7])); changed(); renderSide(); };
  box.append(tsel);
  box.append(bindIn(field('ป้ายชื่อ', `<input class="tl-in" value="${esc(o.lb)}" placeholder="${esc(d[0])}">`), o, 'lb'));
  box.append(field('ตำแหน่ง', `<span style="font:12px var(--fu)">x ${o.x}  y ${o.y} • ${o.w}×${o.h} ช่อง • พื้นสูง ${inb(o.x, o.y) ? M.height[o.y][o.x] : '?'}</span>`));
  const rr = field('หัน/หมุน', `<span style="font:12px var(--fu);width:40px">${o.rot || 0}°</span><button class="tl-btn" style="padding:2px 8px">↺</button><button class="tl-btn" style="padding:2px 8px">↻</button>`);
  const [b1, b2] = rr.querySelectorAll('button'); b1.onclick = () => rotSel(-90); b2.onclick = () => rotSel(90);
  box.append(rr);
  box.append(bindIn(field('ผลต่อทางเดิน', `<select class="tl-sel">${Object.entries(FOOT).map(([k, v]) => `<option value="${k}" ${k === o.foot ? 'selected' : ''}>${v}</option>`).join('')}</select>`), o, 'foot'));
  if (o.foot === 'pass' || o.t === 'bridge') box.append(bindIn(field('ระดับพื้นบน', `<input class="tl-in" type="number" value="${o.lv == null ? '' : o.lv}" placeholder="ตามพื้น">`), o, 'lv', { num: 1, blank: 1 }));
  if (o.t === 'elem' || o.el) box.append(bindIn(field('ธาตุ', `<select class="tl-sel">${ELEM.map(v => `<option ${v === (o.el || '') ? 'selected' : ''} value="${v}">${v || '-'}</option>`).join('')}</select>`), o, 'el'));
  box.append(h3('โน้ต'));
  const nt = document.createElement('div'); nt.innerHTML = `<textarea class="tl-in" rows="2">${esc(o.note)}</textarea>`; box.append(bindIn(nt, o, 'note'));
  // interact
  const iaChk = document.createElement('label'); iaChk.className = 'chk'; iaChk.style.marginTop = '8px';
  iaChk.innerHTML = `<input type="checkbox" ${o.ia ? 'checked' : ''}> <b>โต้ตอบได้ (Interact)</b>`;
  iaChk.querySelector('input').onchange = e => { pushUndo(); o.ia = e.target.checked ? JSON.parse(JSON.stringify(d[7] || OBJ.custom[7])) : null; if (!o.ia) delete o.ia; changed(); renderSide(); };
  box.append(iaChk);
  if (o.ia) {
    const ia = o.ia;
    box.append(bindIn(field('ทำอะไร', `<select class="tl-sel">${Object.entries(IA_KIND).map(([k, v]) => `<option value="${k}" ${k === ia.kind ? 'selected' : ''}>${v}</option>`).join('')}</select>`), ia, 'kind', { re: 1 }));
    const by = bindIn(field('ทำได้ด้วย', `<input class="tl-in" value="${esc(ia.by)}" placeholder="เช่น สกิล Earth, ผู้เล่นกด">`), ia, 'by');
    box.append(by);
    const ch = document.createElement('div'); ch.className = 'chips';
    for (const c of BY_CHIPS) { const b = document.createElement('button'); b.textContent = c; b.onclick = () => { pushUndo(); ia.by = ia.by ? (ia.by.split(/,\s*/).includes(c) ? ia.by : ia.by + ', ' + c) : c; changed(); renderSide(); }; ch.append(b); }
    box.append(ch);
    box.append(bindIn(field('ความทน/เวลา', `<input class="tl-in" value="${esc(ia.hp)}" placeholder="เช่น โดน 3 ครั้ง, ร่าย 2 วิ">`), ia, 'hp'));
    box.append(bindIn(field('ผลลัพธ์', `<input class="tl-in" value="${esc(ia.res)}" placeholder="เกิดอะไรขึ้น">`), ia, 'res'));
    box.append(bindIn(field('คืนสภาพ', `<input class="tl-in" value="${esc(ia.reset || '')}" placeholder="เช่น ไม่คืน / 30 วิ">`), ia, 'reset'));
    box.append(bindIn(field('หลังทำแล้ว', `<select class="tl-sel">${Object.entries(FOOT).map(([k, v]) => `<option value="${k}" ${k === (ia.post || 'none') ? 'selected' : ''}>${v}</option>`).join('')}</select>`), ia, 'post'));
    box.append(h3('เชื่อมกับ (เช่น คันโยก → ประตู, วาร์ป → ปลายทาง)'));
    for (const tid of (o.links || [])) {
      const t = byId(tid); const r = document.createElement('div'); r.className = 'lnk';
      r.innerHTML = `<span>→ ${t ? esc(t.lb || odef(t)[0]) + ' (' + t.id + ')' : tid + ' (หายไป)'}</span><button>✕</button>`;
      r.querySelector('button').onclick = () => { pushUndo(); o.links = o.links.filter(i => i !== tid); changed(); renderSide(); };
      box.append(r);
    }
    const lb = document.createElement('div'); lb.className = 'btns';
    lb.innerHTML = `<button class="tl-btn ${linkMode ? 'on' : ''}">🔗 ${linkMode ? 'กำลังเชื่อม… (Esc เสร็จ)' : 'เชื่อมกับของอื่น'}</button>`;
    lb.children[0].onclick = () => { linkMode = !linkMode; $('linkBanner').style.display = linkMode ? 'block' : 'none'; renderSide(); };
    box.append(lb);
  }
  selBtns(box);
}
function propZone(box, z) {
  box.append(h3('โซน — ' + z.id));
  box.append(bindIn(field('ชื่อ', `<input class="tl-in" value="${esc(z.name)}">`), z, 'name'));
  box.append(field('ตำแหน่ง', `<span style="font:12px var(--fu)">x ${z.x} y ${z.y} • ${z.w}×${z.h} ช่อง (${(z.w * M.cell).toFixed(0)}×${(z.h * M.cell).toFixed(0)} ม.)</span>`));
  const cr = document.createElement('div'); cr.className = 'row'; cr.innerHTML = '<label>สี</label>';
  const sg = document.createElement('div'); sg.className = 'seg';
  for (const c of ZCOL) { const b = document.createElement('button'); b.style.cssText = `background:${c};width:22px;height:20px;${c === z.col ? 'outline:2px solid #fff' : ''}`; b.onclick = () => { pushUndo(); z.col = c; changed(); renderSide(); }; sg.append(b); }
  cr.append(sg); box.append(cr);
  box.append(h3('หน้าที่/โน้ตของพื้นที่'));
  const nt = document.createElement('div'); nt.innerHTML = `<textarea class="tl-in" rows="3">${esc(z.note)}</textarea>`; box.append(bindIn(nt, z, 'note'));
  selBtns(box);
}
function propRoute(box, r) {
  box.append(h3('เส้นทาง — ' + r.id));
  box.append(bindIn(field('ชื่อ', `<input class="tl-in" value="${esc(r.name)}">`), r, 'name'));
  box.append(bindIn(field('ประเภท', `<select class="tl-sel">${Object.entries(ROUTE).map(([k, v]) => `<option value="${k}" ${k === r.kind ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>`), r, 'kind'));
  box.append(field('ระยะ', `<span style="font:12px var(--fu)">${routeLen(r).toFixed(1)} ม. • ~${(routeLen(r) / (M.rules.speed || 6)).toFixed(1)} วิ • ${r.pts.length} จุด</span>`));
  const nt = document.createElement('div'); nt.innerHTML = `<textarea class="tl-in" rows="2" placeholder="โน้ต">${esc(r.note || '')}</textarea>`; box.append(bindIn(nt, r, 'note'));
  box.insertAdjacentHTML('beforeend', '<p class="mut">ลากจุดสีขาวเพื่อแก้ • ลากเส้น = ย้ายทั้งเส้น</p>');
  selBtns(box);
}
function propNote(box, n) {
  box.append(h3('โน้ต — ' + n.id));
  const nt = document.createElement('div'); nt.innerHTML = `<textarea class="tl-in" rows="5" placeholder="พิมพ์ข้อความ">${esc(n.text)}</textarea>`;
  box.append(bindIn(nt, n, 'text'));
  selBtns(box);
}
function selBtns(box) {
  const b = document.createElement('div'); b.className = 'btns';
  b.innerHTML = '<button class="tl-btn">⧉ สำเนา</button><button class="tl-btn dng">🗑 ลบ</button><button class="tl-btn">✕ เลิกเลือก</button>';
  b.children[0].onclick = dupSel; b.children[1].onclick = delSel; b.children[2].onclick = () => setSel(null);
  box.append(b);
}
function renderCheck() {
  const el = $('checkBody'); if (!el || !REP) return;
  const R = REP, sp = R.src;
  let h = '<div class="seg" id="wsSeg"></div><div class="rep">';
  h += `<div>พื้นที่เดินได้ ${R.walkable} ช่อง (${(R.walkable * M.cell * M.cell).toFixed(0)} ตร.ม.)</div>`;
  if (!sp.length) h += '<div class="wn">ยังไม่มีจุดเกิด — วาง "จุดเกิดฝ่ายบุก/รับ" เพื่อตรวจว่าไปถึงทุกที่ไหม</div>';
  for (const s of sp) h += `<div>${esc(s.o.lb || odef(s.o)[0])}: ไปถึง ${s.n} ช่อง ${s.n2 !== s.n ? `<span class="ok">(หลัง Interact ${s.n2})</span>` : ''}</div>`;
  if (R.islands.length) {
    h += `<div class="wn" style="margin-top:4px">พื้นที่ที่เดินได้แต่ไปไม่ถึง ${R.islands.length} จุด:</div><ul>`;
    for (const i of R.islands.slice(0, 8)) h += `<li><a href="#" data-go="${i.x0},${i.y0},${i.x1},${i.y1}">x${i.x0}-${i.x1} y${i.y0}-${i.y1}</a> (${i.n} ช่อง)</li>`;
    h += '</ul>';
  } else if (sp.length) h += '<div class="ok">✓ ทุกที่ที่เดินได้ ไปถึงจากจุดเกิด</div>';
  if (R.paths.length) {
    h += '<div style="margin-top:4px">ระยะเดินจริง:</div><ul>';
    for (const p of R.paths) {
      const f = q => q ? `${q.len.toFixed(0)} ม. ~${q.time.toFixed(1)} วิ` : '<span class="bad">ไปไม่ถึง</span>';
      h += `<li>${esc(p.a.lb || odef(p.a)[0])} → ${esc(p.b.lb || odef(p.b)[0])}: ${f(p.pre)}${(p.post && p.pre && Math.abs(p.post.len - p.pre.len) > 0.5) || (!p.pre !== !p.post) ? ` • หลัง Interact ${f(p.post)}` : ''}</li>`;
    }
    h += '</ul>';
  }
  h += '</div>';
  el.innerHTML = h;
  el.querySelector('#wsSeg').replaceWith(seg([['pre', 'ก่อน Interact'], ['post', 'หลัง Interact']], wstate, v => { wstate = v; WK = REP[v]; if (!show.walkov) show.walkov = 1; runMeasure(); renderSide(); req(); }));
  el.querySelectorAll('[data-go]').forEach(a => a.onclick = e => { e.preventDefault(); const [x0, y0, x1, y1] = a.dataset.go.split(',').map(Number); show.walkov = 1; focusRect(x0, y0, x1 + 1, y1 + 1); renderSide(); });
}
function focusRect(x0, y0, x1, y1) {
  const r = cv.getBoundingClientRect(), z = clamp(Math.min(r.width / (x1 - x0 + 6), r.height / (y1 - y0 + 6)), 2, 40);
  view.z = z; view.ox = r.width / 2 - (x0 + x1) / 2 * z; view.oy = r.height / 2 - (y0 + y1) / 2 * z; req();
}
function fit() { if (M) focusRect(0, 0, M.w, M.h); }
function resizeMap(w, h) {
  w = clamp(w | 0, 8, 200); h = clamp(h | 0, 8, 200); if (w === M.w && h === M.h) return;
  if ((w < M.w || h < M.h) && !confirm(`ย่อแผนที่เป็น ${w}×${h}? ส่วนที่เกิน (ขวา/ล่าง) จะถูกตัด (ย้อนได้ด้วย Ctrl+Z)`)) return;
  pushUndo();
  for (const k of ['height', 'surf', 'wall', 'walk', 'ramp']) {
    const g = M[k], def = k === 'surf' ? (M.surf[0][0]) : 0;
    M[k] = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (g[y] && g[y][x] != null) ? g[y][x] : def));
  }
  M.w = w; M.h = h;
  M.objs = M.objs.filter(o => o.x < w && o.y < h);
  changed(); renderSide(); fit();
}

// ================= change / save =================
function changed(light) {
  dirty = true; stat('ยังไม่บันทึก', 'warn');
  if (!light) refreshReport(); else { clearTimeout(repT); repT = setTimeout(() => { REP = analyze(); WK = REP[wstate]; renderCheck(); req(); }, 350); }
  req();
  clearTimeout(saveT); if (online) saveT = setTimeout(save, 2500);
  try { localStorage.setItem('fs_mapedit_backup', JSON.stringify(M)); } catch (e) { }
}
function stat(t, cls) { const s = $('stat'); s.textContent = t; s.className = cls || ''; }
function exportCanvas() {
  const z = clamp(Math.floor(2400 / Math.max(M.w, M.h)), 8, 32), pad = 22;
  const c = document.createElement('canvas'); c.width = M.w * z + pad * 2; c.height = M.h * z + pad * 2;
  const g = c.getContext('2d'); g.fillStyle = '#1f1f1f'; g.fillRect(0, 0, c.width, c.height);
  const keep = { ...show }; show.hnum = 0; colCache.clear();
  render(g, z, pad, pad, c.width, c.height, false);
  Object.assign(show, keep); colCache.clear();
  g.fillStyle = '#9b9b9b'; g.font = '11px Consolas,monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let x = 0; x <= M.w; x += 5) { g.fillText(x, pad + (x + 0.5) * z, pad / 2); g.fillText(x, pad + (x + 0.5) * z, c.height - pad / 2); }
  for (let y = 0; y <= M.h; y += 5) { g.fillText(y, pad / 2, pad + (y + 0.5) * z); g.fillText(y, c.width - pad / 2, pad + (y + 0.5) * z); }
  return c;
}
async function save() {
  if (!M) return; clearTimeout(saveT);
  if (!online) { stat('ออฟไลน์ — เก็บในเบราว์เซอร์แล้ว (เปิดผ่าน Tools.bat เพื่อบันทึกลงโปรเจกต์)', 'warn'); return; }
  stat('กำลังบันทึก…');
  try {
    REP = analyze(); WK = REP[wstate];
    const png = exportCanvas().toDataURL('image/png');
    const r = await fetch('/api/map?id=' + encodeURIComponent(M.id), { method: 'POST', body: JSON.stringify({ map: M, md: buildMD(REP), png }) });
    const j = await r.json(); if (!j.ok) throw j.err;
    dirty = false; stat('บันทึกแล้ว ✓ ' + new Date().toLocaleTimeString('th-TH') + ' → maps/' + M.id + '.md', 'ok');
    const it = list.find(m => m.id === M.id); if (it && it.name !== M.name) { it.name = M.name; renderList(); }
  } catch (e) { stat('บันทึกไม่สำเร็จ: ' + e, 'err'); }
}

// ================= markdown for Claude =================
function hch(l) { return l >= 0 && l <= 9 ? String(l) : l > 9 ? String.fromCharCode(65 + l - 10) : String.fromCharCode(96 - l); }
function buildMD(R) {
  const m = M, L = [], fx = v => +(+v).toFixed(2);
  let hmin = 99, hmax = -99; for (const r of m.height) for (const v of r) { hmin = Math.min(hmin, v); hmax = Math.max(hmax, v); }
  const name = o => o.lb ? `${o.lb} (${odef(o)[0]})` : odef(o)[0];
  L.push(`# แผนที่: ${m.name} (\`${m.id}\`)`, '',
    `> เขียนอัตโนมัติจาก \`mapedit.html\` (Map Editor) — อย่าแก้ไฟล์นี้ตรงๆ. ภาพ topdown: \`maps/${m.id}.png\` (เปิดด้วย Read). ข้อมูลดิบ: \`maps/${m.id}.json\` (รูปแบบ: \`guides/MAP-FORMAT.md\`).`,
    '> เป็นภาพอ้างอิง/แบบร่างของผู้ใช้ ไม่ใช่ผังที่ล็อกแล้ว เว้นแต่คำอธิบายบอกไว้.', '',
    '## ข้อมูลพื้นฐาน', '',
    `- ขนาด ${m.w}×${m.h} ช่อง • 1 ช่อง = ${m.cell} ม. → ${fx(m.w * m.cell)}×${fx(m.h * m.cell)} ม.`,
    `- ความสูง: 1 ระดับ = ${m.lvl} ม. • ใช้ระดับ ${hmin} ถึง ${hmax} (${fx(hmin * m.lvl)}..${fx(hmax * m.lvl)} ม.)`,
    '- พิกัด: `x` = คอลัมน์ ซ้าย→ขวา (0..w-1), `y` = แถว บน→ล่าง (0..h-1); ด้านบนของภาพ = เหนือ. ของ/โซน = มุมซ้ายบน (x,y) + กว้าง×ยาว (ช่อง). การหัน 0° = หันขึ้น (เหนือ), 90° = ขวา.',
    `- กฎเดินที่ใช้ตรวจ: ขึ้นต่างระดับได้เอง ${m.rules.up} ระดับ (มากกว่านั้นต้องมีทางลาด), ลง/กระโดดลงได้ ${m.rules.down} ระดับ, เดินทแยง ${m.rules.diag ? 'ได้' : 'ไม่ได้'}, ความเร็วอ้างอิง ${m.rules.speed} ม./วิ`, '');
  if (m.desc) L.push('## คำอธิบายจากผู้ใช้', '', m.desc, '');
  if (m.zones.length) {
    L.push('## โซน', '', '| id | ชื่อ | x,y | ขนาด (ช่อง) | ระดับพื้น | โน้ต |', '|---|---|---|---|---|---|');
    for (const z of m.zones) {
      const hs = new Set(); for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.w; x++) if (inb(x, y)) hs.add(m.height[y][x]);
      const hl = [...hs].sort((a, b) => a - b);
      L.push(`| ${z.id} | ${z.name} | ${z.x},${z.y} | ${z.w}×${z.h} | ${hl.length > 3 ? hl[0] + '..' + hl[hl.length - 1] : hl.join(', ')} | ${(z.note || '').replace(/\n/g, ' ')} |`);
    }
    L.push('');
  }
  if (m.objs.length) {
    L.push('## ของ / สิ่งก่อสร้าง', '', '| id | ประเภท | ป้าย | x,y | ขนาด | หัน | พื้นสูง | ทางเดิน | โน้ต |', '|---|---|---|---|---|---|---|---|---|');
    for (const o of m.objs) L.push(`| ${o.id} | ${odef(o)[0]}${o.ia ? ' ⚡' : ''} | ${o.lb || ''} | ${o.x},${o.y} | ${o.w}×${o.h} | ${o.rot || 0}° | ${inb(o.x, o.y) ? m.height[o.y][o.x] : ''}${o.lv != null && o.lv !== '' ? ' (บน ' + o.lv + ')' : ''} | ${FOOT[o.foot]} | ${[o.el ? 'ธาตุ ' + o.el : '', (o.note || '').replace(/\n/g, ' ')].filter(Boolean).join(' • ')} |`);
    L.push('');
  }
  const ias = m.objs.filter(o => o.ia);
  if (ias.length) {
    L.push('## จุด Interact', '');
    for (const o of ias) {
      const ia = o.ia;
      L.push(...[`### ${o.id} — ${name(o)} @ ${o.x},${o.y} (${o.w}×${o.h})`,
        `- ทำอะไร: **${IA_KIND[ia.kind] || ia.kind}**` + (ia.by ? ` • ทำได้ด้วย: ${ia.by}` : '') + (ia.hp ? ` • ความทน/เวลา: ${ia.hp}` : ''),
        ia.res ? `- ผลลัพธ์: ${ia.res}` : '',
        `- ทางเดิน: ก่อน = ${FOOT[o.foot]} → หลัง = ${FOOT[ia.post || 'none']}` + (ia.reset ? ` • คืนสภาพ: ${ia.reset}` : ''),
        (o.links && o.links.length) ? `- เชื่อมกับ: ${o.links.map(id => { const t = byId(id); return t ? `${id} ${name(t)} @ ${t.x},${t.y}` : id; }).join('; ')}` : '',
        o.note ? `- โน้ต: ${o.note.replace(/\n/g, ' ')}` : ''].filter(Boolean), '');
    }
  }
  if (m.routes.length) {
    L.push('## เส้นทางที่ตั้งใจ (วาดเอง)', '', '| id | ชื่อ | ประเภท | ระยะ (ม.) | เวลา (วิ) | จุด (x,y) | โน้ต |', '|---|---|---|---|---|---|---|');
    for (const r of m.routes) L.push(`| ${r.id} | ${r.name} | ${(ROUTE[r.kind] || ROUTE.other)[0]} | ${routeLen(r).toFixed(1)} | ${(routeLen(r) / m.rules.speed).toFixed(1)} | ${r.pts.map(p => fx(p[0]) + ',' + fx(p[1])).join(' → ')} | ${(r.note || '').replace(/\n/g, ' ')} |`);
    L.push('');
  }
  if (m.notes.length) { L.push('## โน้ตบนแผนที่', ''); for (const n of m.notes) L.push(`- (${fx(n.x)}, ${fx(n.y)}) ${(n.text || '').replace(/\n/g, ' / ')}`); L.push(''); }
  L.push('## ผลตรวจทางเดิน (คำนวณอัตโนมัติ)', '', `- เดินได้ ${R.walkable} ช่อง (สถานะก่อน Interact)`);
  if (!R.src.length) L.push('- ยังไม่มีจุดเกิด จึงไม่ได้ตรวจการเข้าถึง');
  for (const s of R.src) L.push(`- จาก ${name(s.o)} ${s.o.id}: ไปถึง ${s.n} ช่อง (หลัง Interact ${s.n2})`);
  if (R.src.length) L.push(R.islands.length ? `- ⚠ พื้นที่เดินได้แต่ไปไม่ถึงจากจุดเกิด: ${R.islands.slice(0, 10).map(i => `x${i.x0}-${i.x1} y${i.y0}-${i.y1} (${i.n} ช่อง)`).join('; ')}` : '- ✓ ทุกช่องที่เดินได้ไปถึงจากจุดเกิด');
  for (const p of R.paths) { const f = q => q ? `${q.len.toFixed(0)} ม. ~${q.time.toFixed(1)} วิ` : 'ไปไม่ถึง'; L.push(`- ${name(p.a)} → ${name(p.b)}: ก่อน Interact ${f(p.pre)} • หลัง ${f(p.post)}`); }
  L.push('');
  // ascii grids
  const head = () => { let a = '   ', b = '   '; for (let x = 0; x < m.w; x++) { a += x % 10 === 0 ? String((x / 10) % 10) : ' '; b += x % 10; } return [a, b]; };
  L.push('## กริดความสูง (ระดับ)', '', 'ตัวอักษรต่อช่อง: `0`-`9` = ระดับ 0-9, `A`=10 `B`=11 …, `a`=-1 `b`=-2 `c`=-3 …', '', '```', ...head());
  m.height.forEach((r, y) => L.push(String(y).padStart(2) + ' ' + r.map(hch).join('')));
  L.push('```', '');
  L.push('## กริดผัง (พื้นผิว/กำแพง/ทางลาด)', '', 'ลำดับความสำคัญ: กำแพง > ทางลาด > ห้ามเดิน(บังคับ) > พื้นผิว. ของ/Interact ดูในตารางด้านบน + ภาพ png.', '',
    '- พื้นผิว: ' + SURF.map(s => `\`${s.ch}\` ${s.n}`).join(', '),
    '- กำแพง: ' + WALL.slice(1).map(s => `\`${s.ch}\` ${s.n}`).join(', '),
    '- ทางลาด (ชี้ทางที่ขึ้น): `^` `>` `v` `<` • บังคับห้ามเดิน: `x`', '', '```', ...head());
  for (let y = 0; y < m.h; y++) {
    let s = String(y).padStart(2) + ' ';
    for (let x = 0; x < m.w; x++) s += m.wall[y][x] ? WALL[m.wall[y][x]].ch : m.ramp[y][x] ? DIRCH[m.ramp[y][x]] : m.walk[y][x] === 2 ? 'x' : (SURF[m.surf[y][x]] || SURF[0]).ch;
    L.push(s);
  }
  L.push('```', '');
  return L.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
}

// ================= list / new / load =================
async function loadList() {
  try { const r = await fetch('/api/maps', { cache: 'no-store' }); if (!r.ok) throw 0; list = await r.json(); online = true; }
  catch (e) { online = false; list = []; }
  renderList();
}
function renderList() {
  const s = $('mapSel'); s.innerHTML = '';
  for (const m of list) { const o = document.createElement('option'); o.value = m.id; o.textContent = m.name + ' (' + m.id + ')'; s.append(o); }
  if (M && !list.find(m => m.id === M.id)) { const o = document.createElement('option'); o.value = M.id; o.textContent = M.name + ' (ยังไม่บันทึก)'; s.append(o); }
  if (M) s.value = M.id;
}
async function openMap(id) {
  if (dirty && online) await save();
  try { const r = await fetch('/api/map?id=' + encodeURIComponent(id), { cache: 'no-store' }); if (!r.ok) throw 0; M = fixMap(await r.json()); }
  catch (e) { stat('เปิดแผนที่ไม่ได้', 'err'); return; }
  undo = []; redo = []; sel = null; afterLoad(); dirty = false; stat('เปิด maps/' + id + '.json', 'ok');
  try { localStorage.setItem('fs_mapedit_last', id); } catch (e) { }
}
function afterLoad(keepView) {
  sel = sel && getSel() ? sel : null; measure = null; routeDraft = null; colCache.clear();
  const src = M.ref && M.ref.src || ''; if (src !== refSrc) { refSrc = src; if (src) refImg.src = src; }
  renderList(); renderSide(); renderOpts(); if (!keepView) fit();
  REP = analyze(); WK = REP[wstate]; renderCheck(); req();
}
function uniqueId(base) { let id = base, n = 2; while (list.find(m => m.id === id) || (M && M.id === id)) id = base + '-' + n++; return id; }
function newDialog(dup) {
  const b = $('mbox');
  const sid = uniqueId(dup ? M.id + '-copy' : 'map' + (list.length + 1));
  b.innerHTML = `<h2>${dup ? 'ทำสำเนาแผนที่' : 'แผนที่ใหม่'}</h2>
    <div class="row"><label>ชื่อ</label><input class="tl-in" id="nName" value="${dup ? esc(M.name) + ' (สำเนา)' : 'แผนที่ใหม่'}"></div>
    <div class="row"><label>id (ไฟล์)</label><input class="tl-in" id="nId" value="${sid}" title="a-z 0-9 _ - เท่านั้น"></div>
    ${dup ? '' : `<div class="row"><label>ขนาด (ช่อง)</label><input class="tl-in" type="number" id="nW" value="48" style="width:64px"> × <input class="tl-in" type="number" id="nH" value="32" style="width:64px"></div>
    <div class="row"><label>1 ช่อง (ม.)</label><input class="tl-in" type="number" step="0.25" id="nC" value="1"></div>
    <div class="row"><label>พื้นเริ่มต้น</label><select class="tl-sel" id="nS">${SURF.map((s, i) => `<option value="${i}" ${i === 1 ? 'selected' : ''}>${s.n}</option>`).join('')}</select></div>
    <div class="row"><label>ตัวอย่าง</label><label class="chk"><input type="checkbox" id="nDemo"> ใส่ตัวอย่างการใช้เครื่องมือ (ไม่ใช่ผังจริง)</label></div>`}
    <p class="mut" id="nErr"></p>
    <div class="btns" style="justify-content:flex-end"><button class="tl-btn" id="nCancel">ยกเลิก</button><button class="tl-btn pri" id="nOk">สร้าง</button></div>`;
  $('modal').classList.add('show'); $('nName').focus(); $('nName').select();
  $('nCancel').onclick = () => $('modal').classList.remove('show');
  $('nOk').onclick = async () => {
    const id = $('nId').value.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_\-]{0,40}$/.test(id)) { $('nErr').textContent = 'id ใช้ได้เฉพาะ a-z 0-9 _ - (ขึ้นต้นด้วยตัวอักษร/ตัวเลข)'; return; }
    if (list.find(m => m.id === id)) { $('nErr').textContent = 'มี id นี้แล้ว'; return; }
    if (dirty && online) await save();
    if (dup) { M = JSON.parse(JSON.stringify(M)); M.id = id; M.name = $('nName').value; }
    else { M = newMap({ id, name: $('nName').value, w: +$('nW').value, h: +$('nH').value, cell: +$('nC').value, surf: +$('nS').value }); if ($('nDemo').checked) demo(M); }
    M = fixMap(M);
    $('modal').classList.remove('show'); undo = []; redo = []; sel = null;
    list.push({ id: M.id, name: M.name, w: M.w, h: M.h }); afterLoad(); changed(); if (online) save();
  };
}
// small demo that shows every feature (NOT a real layout)
function demo(m) {
  const W = m.w, H = m.h, set = (k, x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < W && y < H) m[k][y][x] = v; };
  const cx = W >> 1;
  m.desc = 'ตัวอย่างการใช้เครื่องมือเท่านั้น — ไม่ใช่ผังที่ออกแบบจริง';
  set('height', cx - 8, 4, cx + 8, 13, 2); set('surf', cx - 8, 4, cx + 8, 13, 2);
  set('wall', cx - 9, 3, cx + 9, 3, 1); set('wall', cx - 9, 3, cx - 9, 14, 1); set('wall', cx + 9, 3, cx + 9, 14, 1);
  set('wall', cx - 9, 14, cx - 2, 14, 1); set('wall', cx + 2, 14, cx + 9, 14, 1);
  set('ramp', cx - 1, 14, cx + 1, 14, 1); set('height', cx - 1, 14, cx + 1, 14, 1); set('ramp', cx - 1, 15, cx + 1, 15, 1);
  set('surf', 2, H - 8, 9, H - 3, 6); set('surf', 4, H - 7, 7, H - 4, 7);
  set('wall', cx - 6, 18, cx - 4, 18, 2); set('wall', cx + 4, 18, cx + 6, 18, 2);
  let id = 1; const o = (t, x, y, ex = {}) => { const d = OBJ[t]; const ob = Object.assign({ id: 'o' + (++id), t, x, y, w: d[3], h: d[4], rot: 0, lb: '', note: '', foot: d[5] }, d[7] ? { ia: JSON.parse(JSON.stringify(d[7])) } : {}, ex); m.objs.push(ob); return ob; };
  o('spawnA', cx - 1, H - 4);
  o('core', cx - 1, 7, { lb: 'แกน' });
  const bw = o('breakwall', cx + 9, 7, { w: 1, h: 3, lb: 'ผนังร้าว', ia: { kind: 'break', by: 'Earth, โจมตีปกติ', hp: 'โดน 3 ครั้ง', res: 'เปิดทางเข้าด้านข้าง', post: 'pass' } });
  set('height', cx + 10, 6, cx + 14, 10, 2); set('ramp', cx + 12, 11, cx + 12, 12, 1); set('height', cx + 12, 11, cx + 12, 11, 1);
  set('wall', cx + 9, 7, cx + 9, 9, 0); set('wall', cx - 9, 8, cx - 9, 9, 0);
  set('height', cx + 9, 7, cx + 9, 9, 2); set('height', cx - 9, 8, cx - 9, 9, 2);
  set('ramp', cx - 11, 8, cx - 10, 9, 2); set('height', cx - 10, 8, cx - 10, 9, 1);
  const lv = o('lever', cx - 12, 10, { lb: 'คันโยก' }); const gt = o('gate', cx - 9, 8, { w: 1, h: 2, lb: 'ประตูข้าง' }); lv.links = [gt.id];
  o('crate', cx - 3, 20); o('crate', cx + 3, 21); o('tree', 3, 3); o('tree', 6, 5); o('rock', W - 6, H - 6);
  m.zones.push({ id: 'z1', name: 'ห้องตัวอย่าง', x: cx - 8, y: 4, w: 17, h: 10, col: ZCOL[0], note: 'ตัวอย่างโซน' });
  m.routes.push({ id: 'r1', name: 'ทางหลัก', kind: 'main', pts: [[cx + 0.5, H - 4.5], [cx + 0.5, 15.5], [cx + 0.5, 10.5]] });
  m.routes.push({ id: 'r2', name: 'ทางอ้อม', kind: 'flank', pts: [[cx + 1.5, H - 4.5], [cx + 12.5, H - 8.5], [cx + 12.5, 12.5], [cx + 12.5, 8.5], [cx + 7.5, 8.5]] });
  m.notes.push({ id: 'n1', x: cx + 10.2, y: 5.2, text: 'ตัวอย่างโน้ต: ทางอ้อมต้องพังผนังก่อน' });
  m.seq = 40; void bw;
}

// ================= files =================
$('fileImg').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const data = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); });
  let src = data;
  if (online) { try { const r = await fetch('/api/map-img?name=' + M.id + '_ref', { method: 'POST', body: data }); const j = await r.json(); if (j.ok) src = j.path + '?t=' + Date.now(); } catch (er) { } }
  pushUndo(); M.ref = { src, x: 0, y: 0, wc: M.w, op: 0.5 }; refSrc = ''; afterLoad(true); changed();
};
$('fileJson').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const m = JSON.parse(await f.text()); if (!m.height) throw 'ไม่ใช่ไฟล์แผนที่';
    pushUndo(); const id = M ? M.id : uniqueId(m.id || 'map'); M = fixMap(m); M.id = id; afterLoad(); changed();
    stat('นำเข้าแล้ว (ใช้ id เดิม: ' + id + ')', 'ok');
  } catch (er) { stat('นำเข้าไม่ได้: ' + er, 'err'); }
};
function download(name, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
$('bPng').onclick = () => exportCanvas().toBlob(b => download(M.id + '.png', b));
$('bJson').onclick = () => download(M.id + '.json', new Blob([JSON.stringify(M, null, 1)], { type: 'application/json' }));
$('bImp').onclick = () => $('fileJson').click();
$('bSave').onclick = save;
$('bUndo').onclick = doUndo; $('bRedo').onclick = doRedo; $('bFit').onclick = fit;
$('bNew').onclick = () => newDialog(false);
$('bDup').onclick = () => M && newDialog(true);
$('bDel').onclick = async () => {
  if (!M || !online) return;
  if (!confirm(`ลบแผนที่ "${M.name}"? ไฟล์จะถูกย้ายไป maps/_deleted/ (กู้คืนได้)`)) return;
  await fetch('/api/map-del?id=' + M.id, { method: 'POST' }); dirty = false;
  list = list.filter(m => m.id !== M.id); M = null;
  if (list.length) openMap(list[0].id); else { renderList(); start(); }
};
$('mapSel').onchange = e => openMap(e.target.value);
addEventListener('beforeunload', e => { if (dirty) { if (online) save(); else { e.preventDefault(); e.returnValue = ''; } } });

async function start() {
  await loadList();
  renderTools(); setTool('select');
  if (!online) {
    let b = null; try { b = JSON.parse(localStorage.getItem('fs_mapedit_backup')); } catch (e) { }
    M = fixMap(b && b.height ? b : newMap({ id: 'map1', name: 'แผนที่ใหม่' })); afterLoad();
    stat('ออฟไลน์ — เปิดผ่าน Tools.bat เพื่อบันทึกลงโปรเจกต์', 'warn'); return;
  }
  let last = ''; try { last = localStorage.getItem('fs_mapedit_last'); } catch (e) { }
  const want = new URLSearchParams(location.search).get('map') || last;
  if (list.length) openMap(list.find(m => m.id === want) ? want : list[0].id);
  else { stat('ยังไม่มีแผนที่ — กด "＋ ใหม่"', 'warn'); newDialog(false); }
}
window.__mapedit = { get M() { return M; }, get measure() { return measure; }, get tool() { return tool; }, view, analyze, findPath, walkInfo }; // debug hook (console)
start();
})();
