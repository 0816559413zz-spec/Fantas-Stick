// Converts the game's First Castle Strike map (fcs) into a Map Builder draft: maps/build/fcs-draft.json
// Run: node tools/fcs-to-mb.mjs   → open mapbuild.html?id=fcs-draft (python tools/serve.py)
// Draft only: for looking at / sketching on the real map in 3D. Siege mode still plays js/02-fcs*.js —
// do NOT press "⬆ ส่งเข้าเกม" expecting it to replace fcs (it would become a separate map 'fcs-draft').
// Source = the same genFcs() the game runs (js/02-fcs-data.js + js/02-fcs.js), so terrain, walls, fences,
// breakable walls/gate, trees/crates/pillars, extra forest trees/rocks, castle ruins and the L bridge match the game.
// Not carried over (code-only visuals): castle building look (js/28-fcs-build.js), forest ground paint / fog
// (js/28-fcs-forest.js), rubble piles, bridge arches/eggshell (js/12-fcs-bridge.js), phase zones (only noted in desc).
import fs from 'fs';
import vm from 'vm';
import * as MD from '../mapbuild/model.js';

// ---------- run the game's genFcs in a sandbox ----------
const src = fs.readFileSync('js/02-fcs.js', 'utf8');
const body = src.slice(src.indexOf('const FCS_C'), src.indexOf('// ---------- พื้นที่เล่นตามเฟส'));
const sb = {};
vm.createContext(sb);
vm.runInContext([
  'const clamp=(v,a,b)=>v<a?a:v>b?b:v;',
  'function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}',
  fs.readFileSync('js/02-fcs-data.js', 'utf8'), body,
  'globalThis.OUT=genFcs();globalThis.D=FCS_DATA;globalThis.CC=FCS_C;globalThis.WH=FCS_WH;',
].join('\n'), sb);
const { OUT, D, CC, WH } = sb;
const F = OUT.fcs, T = OUT.terr, PX = MD.PX, m = v => v / PX;   // game px → metres

// ---------- map + terrain ----------
const W = Math.round(m(OUT.W)), H = Math.round(m(OUT.H));
const M = MD.newMap({ id: 'fcs-draft', name: 'FCS ร่าง (จากเกม)', W, H, surf: 3 });
M.desc = 'ร่างจากแผนที่ First Castle Strike ในเกม (tools/fcs-to-mb.mjs) — ไว้ดู/ดราฟ ไม่ใช่แผนที่ที่โหมดบุกปราสาทใช้. ' +
  'เฟส: ' + F.phases.map((r, i) => (i + 1) + '=' + r.map(q => `x${m(q.x1)}-${m(q.x2)} z${m(q.y1)}-${m(q.y2)}`).join('+')).join(' • ');
M.modes = ['tdm']; M.sky = 'day'; M.autoProps = 0; M.fog = ['#c9d6e2', 500, 1600];   // big map: push fog out so the whole map reads
const { nx, ny } = M;
const tc = T.c;   // terrain lattice spacing (px)
const terrH = (px, py) => {   // same bilinear maths as the game
  const fx = Math.min(Math.max(px / tc, 0), T.nx - 1.001), fy = Math.min(Math.max(py / tc, 0), T.ny - 1.001), i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, k = j * T.nx + i, g = T.g;
  return (g[k] * (1 - u) + g[k + 1] * u) * (1 - v) + (g[k + T.nx] * (1 - u) + g[k + T.nx + 1] * u) * v;
};
// Map Editor surface index → Map Builder SURF index
const SMAP = [3, 0, 6, 10, 8, 12, 13, 13, 14, 15, 7, 1];
const at = (s, x, y) => parseInt(s[Math.min(Math.max(y, 0), D.h - 1) * D.w + Math.min(Math.max(x, 0), D.w - 1)], 36) || 0;
for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
  const px = i * MD.C * PX, py = j * MD.C * PX, k = j * nx + i;
  M.hg[k] = terrH(px, py);
  const cx = Math.floor(px / CC), cy = Math.floor(py / CC);
  let s = SMAP[at(D.S, cx, cy)] ?? 3;
  if (s === 0 && cx < 28) s = 17;   // forest floor (phase 1) reads as forest litter
  M.sf[k] = s;
}

let id = 1;
const nid = () => id++;
const C4 = m(CC);   // one Map Editor cell in metres (4.5)

// ---------- grid walls (1 solid, 2 low cover) ----------
const wc = (x, y) => x < 0 || y < 0 || x >= D.w || y >= D.h ? 0 : at(D.W, x, y);
const WSTYLE = { 1: { c: '#77736c', m: 'stone' }, 2: { c: '#8a8478', m: 'stone' } };
const used = new Set();
for (const v of [1, 2]) {
  for (let y = 0; y < D.h; y++) for (let x = 0; x < D.w; x++) {   // horizontal runs (2+ cells)
    if (wc(x, y) !== v || used.has(x + ',' + y) || wc(x - 1, y) === v) continue;
    let e = x; while (wc(e + 1, y) === v) e++;
    if (e === x) continue;
    for (let i = x; i <= e; i++) used.add(i + ',' + y);
    M.walls.push({ id: nid(), pts: [[x * C4, (y + 0.5) * C4], [(e + 1) * C4, (y + 0.5) * C4]], th: C4, h: WH[v], ...WSTYLE[v], closed: 0, curve: 0, brk: 0 });
  }
  for (let x = 0; x < D.w; x++) for (let y = 0; y < D.h; y++) {   // what is left: vertical runs / single cells
    if (wc(x, y) !== v || used.has(x + ',' + y)) continue;
    let e = y; while (wc(x, e + 1) === v && !used.has(x + ',' + (e + 1))) e++;
    for (let i = y; i <= e; i++) used.add(x + ',' + i);
    M.walls.push({ id: nid(), pts: [[(x + 0.5) * C4, y * C4], [(x + 0.5) * C4, (e + 1) * C4]], th: C4, h: WH[v], ...WSTYLE[v], closed: 0, curve: 0, brk: 0 });
  }
}
// fences (type 3) — the game's own fence lines
for (const [x1, y1, x2, y2] of F.fences) M.walls.push({ id: nid(), pts: [[m(x1), m(y1)], [m(x2), m(y2)]], th: 0.4, h: WH[3], c: '#8a6a44', m: 'wood', closed: 0, curve: 0, brk: 0 });
// breakable walls + gate (siege targets) — reddish so they stand out
for (const b of F.bw) {
  const horiz = b.w >= b.d, th = m(horiz ? b.d : b.w);
  const pts = horiz ? [[m(b.x), m(b.y + b.d / 2)], [m(b.x + b.w), m(b.y + b.d / 2)]] : [[m(b.x + b.w / 2), m(b.y)], [m(b.x + b.w / 2), m(b.y + b.d)]];
  M.walls.push({ id: nid(), pts, th, h: b.h, c: b.k === 'gate' ? '#7a5a3a' : '#9a6a5a', m: b.k === 'gate' ? 'wood' : 'stone', closed: 0, curve: 0, brk: 1 });
}

// ---------- props ----------
const PINES = ['gorge/pine_a', 'gorge/pine_b', 'gorge/pine_c', 'gorge/pine_d'];
const BOULD = ['gorge/boulder_a', 'gorge/boulder_b', 'gorge/boulder_c', 'gorge/boulder_d', 'gorge/cliff_a'];
const rot = (x, y) => MD.hash2(Math.round(x), Math.round(y)) * Math.PI * 2;
const obj = o => M.objs.push(Object.assign({ id: nid(), y: 0, rot: 0 }, o));
for (const q of F.props) {
  const [k, px, py] = q, x = m(px), z = m(py);
  if (k === 'tr' || k === 'te') obj({ t: 'kit:' + PINES[(MD.hash2(px | 0, py | 0) * 4) | 0], x, z, rot: rot(px, py), s: k === 'te' ? 1.15 : 1 });
  else if (k === 'cr') obj({ t: 'pcrate', x, z, rot: rot(px, py) });
  else if (k === 'pl') obj({ t: 'cyl', x, z, sx: 1.3, sy: 6, sz: 1.3, c: '#8b8f96' });
  else if (k === 'bd') obj({ t: 'kit:' + BOULD[q[3] | 0], x, z, rot: rot(px, py), s: q[4] || 1 });
  else if (k === 'ru') {   // castle ruin wall: ['ru',x1,y1,x2,y2,thick px,[heights]]
    const hs = q[6], h = hs.reduce((a, b) => a + b, 0) / hs.length;
    M.walls.push({ id: nid(), pts: [[m(q[1]), m(q[2])], [m(q[3]), m(q[4])]], th: m(q[5]), h: +h.toFixed(2), c: '#7d7870', m: 'stone', closed: 0, curve: 0, brk: 0 });
  } else if (k === 'rt') obj({ t: 'cyl', x, z, sx: m(q[3]) * 2, sy: q[4], sz: m(q[3]) * 2, c: '#7d7870' });
  // 'rr' rubble piles: visual only, skipped
}
// capture points (crystals) + spawns per phase
for (const k of F.cores) obj({ t: 'cyl', x: m(k.x), z: m(k.y), sx: 4, sy: 6, sz: 4, c: '#7fd8ff', glow: 1, n: k.n, note: 'จุดยึด ' + k.n });
for (const [t, key] of [['spawnR', 'A'], ['spawnB', 'B']]) for (const n in F.sp[key]) { const s = F.sp[key][n]; obj({ t, x: m(s.x), z: m(s.y), ph: +n, note: (key === 'A' ? 'ฝ่ายบุก' : 'ฝ่ายรับ') + ' เฟส ' + n }); }

// ---------- L bridge (deck + ramps as floors, parapet as raised walls, piers as boxes) ----------
const B = F.bridge;
if (B) {
  const rect = (r, _y, _y2, alongZ) => { const w = m(r.x2 - r.x1), d = m(r.y2 - r.y1);
    // floor's +d end is local +z; ramps: rs runs south (+z) going down; re runs east (+x) going down → rot +90° puts its +d end east
    return alongZ ? { x: m(r.x1) + w / 2, z: m(r.y1) + d / 2, w, d, rot: 0 } : { x: m(r.x1) + w / 2, z: m(r.y1) + d / 2, w: d, d: w, rot: Math.PI / 2 }; };
  const fl = (o, y, y2) => M.floors.push(Object.assign({ id: nid(), y, y2, th: 0.6, c: '#7d7870' }, o));
  fl(rect(B.ns, 0, 0, true), B.DH, B.DH);
  fl(rect(B.ew, 0, 0, true), B.DH, B.DH);
  fl(rect(B.rs, 0, 0, true), B.DH, B.gS);
  fl(rect(B.re, 0, 0, false), B.DH, B.gE);
  for (const [x1, y1, x2, y2] of B.par) M.walls.push({ id: nid(), pts: [[m(x1), m(y1)], [m(x2), m(y2)]], th: 0.5, h: 1.2, base: B.DH, c: '#8a8478', m: 'stone', closed: 0, curve: 0, brk: 0 });
  for (const s of B.spans.slice(1)) {   // one pier at the start of each span except the first
    const x = m(s.x1), z = m(s.y1), along = Math.abs(s.x2 - s.x1) > Math.abs(s.y2 - s.y1), g = MD.gh(M, x, z);
    obj({ t: 'box', x, z, sx: along ? 1.6 : m(B.HW * 2), sy: Math.max(0.5, B.DH - 0.6 - g), sz: along ? m(B.HW * 2) : 1.6, c: '#77736c' });
  }
}

M.seq = id;
fs.mkdirSync('maps/build', { recursive: true });
fs.writeFileSync('maps/build/fcs-draft.json', JSON.stringify(MD.pack(M)));
console.log(`fcs-draft: ${W}x${H} m, grid ${nx}x${ny}, walls ${M.walls.length}, floors ${M.floors.length}, objs ${M.objs.length}`);
