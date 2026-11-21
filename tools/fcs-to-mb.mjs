// Converts the game's map First Castle Strike / Cliff Side Castle (code map fcs) into ONE Map Builder file: maps/build/fcs-file.json
// Run: node tools/fcs-to-mb.mjs   → open mapbuild.html?id=fcs-file (python tools/serve.py) • export → game map 'fcs-file' (siege)
//   Rooms are also written as prefab files (maps/build/room-<id>.json) and unpacked into fcs-file (--prefab = keep linked instances).
// Source = the same code the game runs: genFcs (js/02-fcs-data.js + rooms js/02-fcs-rooms.js + js/02-room-*.js + js/02-fcs.js) for
// terrain, collision, floors, siege markers; fcsCastle (js/28-fcs-castle.js) + room view() replayed with recorders for the look
// → game-drawn decor dc_* (castle wall bodies, battlements, towers, roofs, slits, windows, banners, torches, flags, terraces).
// Not carried over yet: forest ground paint / zone fog (js/28-fcs-forest.js), castle floor shader on the ground, rubble piles,
// bridge arches + eggshell shell (js/12-fcs-bridge.js) → see guides/MAP-STANDARD.md.
import fs from 'fs';
import vm from 'vm';
import * as MD from '../mapbuild/model.js';

// ---------- run the game's genFcs in a sandbox ----------
const src = fs.readFileSync('js/02-fcs.js', 'utf8');
const body = src.slice(src.indexOf('const FCS_C'), src.indexOf('// ---------- พื้นที่เล่นตามเฟส'));
// room pieces load between 02-fcs-data and 02-fcs (index.html FILES order)
const files = (fs.readFileSync('index.html', 'utf8').match(/const FILES=\[([^\]]*)\]/)[1].match(/'([^']+)'/g) || []).map(s => s.slice(1, -1));
const rooms = files.slice(files.indexOf('02-fcs-rooms'), files.indexOf('02-fcs')).map(f => fs.readFileSync('js/' + f + '.js', 'utf8'));
const sb = {};
vm.createContext(sb);
vm.runInContext([
  'const clamp=(v,a,b)=>v<a?a:v>b?b:v;',
  'function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}',
  fs.readFileSync('js/02-fcs-data.js', 'utf8'), ...rooms, body,
  'globalThis.OUT=genFcs();globalThis.D=FCS_DATA;globalThis.CC=FCS_C;globalThis.WH=FCS_WH;globalThis.ROOMS=FCS_ROOMS;',
].join('\n'), sb);
const { OUT, D, CC, WH, ROOMS } = sb;
const F = OUT.fcs, T = OUT.terr, PX = MD.PX, m = v => v / PX;   // game px → metres

// ---------- map + terrain ----------
const W = Math.round(m(OUT.W)), H = Math.round(m(OUT.H));
const M = MD.newMap({ id: 'fcs-file', name: 'Cliff Side Castle (ไฟล์ Map Builder)', W, H, surf: 3 });
M.desc = 'แผนที่บุกปราสาท Cliff Side Castle แปลงจากโค้ด (tools/fcs-to-mb.mjs) — ไฟล์เดียว แก้ได้ทุกจุด (MAP-STANDARD รอบ 5)';
M.modes = ['siege']; M.sky = 'day'; M.autoProps = 0; M.random = 0; M.style = 'castle-stone'; M.fog = ['#c9d6e2', 500, 1600];   // big map: push fog out so the whole map reads
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
const wc = (x, y) => x < 0 || y < 0 || x >= D.w || y >= D.h || sb.fcsCut(x, y) ? 0 : at(D.W, x, y);   // room pieces own their rect (like genFcs)
const WSTYLE = { 1: { c: '#77736c', m: 'stone', vis: 0 }, 2: { c: '#8a8478', m: 'stone' } };   // solid walls: look = castle decor (fcsCastle), collision here
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
for (const [x1, y1, x2, y2] of F.fences) M.walls.push({ id: nid(), pts: [[m(x1), m(y1)], [m(x2), m(y2)]], th: 0.4, h: WH[3], c: '#8a6a44', m: 'wood', closed: 0, curve: 0, brk: 0, sys: 'fence' });
// breakable walls + gate = siege targets (sg) — reddish so they stand out
for (const b of F.bw) {
  const horiz = b.w >= b.d, th = m(horiz ? b.d : b.w);
  const pts = horiz ? [[m(b.x), m(b.y + b.d / 2)], [m(b.x + b.w), m(b.y + b.d / 2)]] : [[m(b.x + b.w / 2), m(b.y)], [m(b.x + b.w / 2), m(b.y + b.d)]];
  M.walls.push({ id: nid(), pts, th, h: b.h, c: b.k === 'gate' ? '#7a5a3a' : '#9a6a5a', m: b.k === 'gate' ? 'wood' : 'stone', closed: 0, curve: 0, brk: 1, sg: b.k });
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
// siege markers: cores, spawns per phase, phase play areas
for (const k of F.cores) obj({ t: 'core', x: m(k.x), z: m(k.y), n: k.n, s: +m(k.s).toFixed(2) });
for (const [t, key] of [['sgA', 'A'], ['sgB', 'B']]) for (const n in F.sp[key]) { const s = F.sp[key][n]; obj({ t, x: m(s.x), z: m(s.y), ph: +n }); }
F.phases.forEach((rs, i) => { for (const q of rs || []) obj({ t: 'phase', ph: i + 1, x: m((q.x1 + q.x2) / 2), z: m((q.y1 + q.y2) / 2), sx: m(q.x2 - q.x1), sz: m(q.y2 - q.y1) }); });

// ---------- room pieces (js/02-room-*.js) → room prefab maps maps/build/room-<id>.json + an instance in this map ----------
// Room map = local metres (0..W, 0..H), flat ground 0, heights relative to the room's ground (K.g0). MAP-STANDARD §1.4
const roomMaps = [];
for (const r of ROOMS) {
  const K = r.K, D2 = r.data; if (!K || !D2) continue;
  const RM = MD.newMap({ id: 'room-' + r.id, name: 'ห้อง: ' + (r.name || r.id), W: m(K.w), H: m(K.h), surf: 6 });
  RM.desc = 'ห้องสำเร็จ (prefab) จาก js/02-room-' + r.id + '.js (tools/fcs-to-mb.mjs) • ประตู: ' + (r.doors || []).map(d => d.side + '@' + m(d.at) + 'm/' + m(d.w) + 'm/' + d.kind).join(', ');
  RM.modes = []; RM.random = 0; RM.autoProps = 0; RM.style = 'room-hall'; RM.sky = 'day';
  let rid = 1; const rn = () => rid++, ro = o => RM.objs.push(Object.assign({ id: rn(), y: 0, rot: 0 }, o));
  const X = u => +m(u).toFixed(3), Z = v => +m(v).toFixed(3), RS = { c: '#8a8478', m: 'stone', closed: 0, curve: 0, brk: 0, sys: 'stonewall', vis: 0 };   // vis 0 = collision only: the decor below draws the look
  for (const w of D2.walls) {   // axis-aligned: split at door gaps, lintel pieces above gaps that have one
    const along = w.v1 === w.v2, a0 = Math.min(along ? w.u1 : w.v1, along ? w.u2 : w.v2), a1 = Math.max(along ? w.u1 : w.v1, along ? w.u2 : w.v2);
    const P = a => along ? [X(a), Z(w.v1)] : [X(w.u1), Z(a)], gaps = (w.gaps || []).slice().sort((p, q) => p[0] - q[0]);
    let s = a0;
    for (const [p, q, lh] of gaps) {
      if (p > s) RM.walls.push(Object.assign({ id: rn(), pts: [P(s), P(p)], th: m(w.th), h: w.h }, RS));
      if (lh != null && lh < w.h) RM.walls.push(Object.assign({ id: rn(), pts: [P(p), P(q)], th: m(w.th), h: +(w.h - lh).toFixed(2), base: lh }, RS));
      s = Math.max(s, q);
    }
    if (a1 > s) RM.walls.push(Object.assign({ id: rn(), pts: [P(s), P(a1)], th: m(w.th), h: w.h }, RS));
  }
  for (const c of D2.cols) ro({ vis: 0, t: 'cyl', x: X(c.u), z: Z(c.v), sx: +(m(c.r) * 2).toFixed(2), sz: +(m(c.r) * 2).toFixed(2), y: c.bot || 0, sy: +Math.max(0.2, c.h - (c.bot || 0)).toFixed(2), c: '#7d7870', tag: c.tag || '' });
  for (const q of D2.ceil) { const o = { t: 'ceil', x: X((q.x0 + q.x1) / 2 - K.ox), z: Z((q.y0 + q.y1) / 2 - K.oy), sx: m(q.x1 - q.x0), sz: m(q.y1 - q.y0), y: q.h }; if (q.zmax !== Infinity && q.zmax != null) o.zmax = q.zmax; ro(o); }
  // look: replay the room's view(K,V) with a recording V → decor objects dc_* (game draws them with the same builder, js/28-fcs-castle.js)
  if (r.view) {
    sb.tx = px => px / PX; sb.tz = py => py / PX;   // view works in world metres; here = map metres from the top-left
    const LX = x => +(x - m(K.ox)).toFixed(3), LZ = z => +(z - m(K.oy)).toFixed(3), LY = y => +(y - K.g0).toFixed(3);
    const V = {
      box: (k, x, y, z, sx, sy, sz) => ro({ t: 'dc_box', k, x: LX(x), z: LZ(z), y: LY(y), sx: +sx.toFixed(3), sy: +sy.toFixed(3), sz: +sz.toFixed(3) }),
      cyl: (k, x, y, z, rt, rb, h, seg) => ro({ t: 'dc_cyl', k, x: LX(x), z: LZ(z), y: LY(y), rt, rb, sy: h, seg: seg || 8 }),
      cone: (k, x, y, z, r, h, seg) => ro({ t: 'dc_cone', k, x: LX(x), z: LZ(z), y: LY(y), r, sy: h, seg: seg || 8 }),
      roof: (x, y, z, w, d, h) => ro({ t: 'dc_roof', x: LX(x), z: LZ(z), y: LY(y), sx: +w.toFixed(3), sz: +d.toFixed(3), sy: h }),
      light: (x, y, z) => ro({ t: 'dc_flame', x: LX(x), z: LZ(z), y: LY(y) }),
      cloth: (x, y, z, w, h, a, col) => ro({ t: 'dc_cloth', x: LX(x), z: LZ(z), y: LY(y), sx: w, sy: h, c: col, rot: a || 0 }),
      shield: (x, y, z, a) => ro({ t: 'dc_shield', x: LX(x), z: LZ(z), y: LY(y), rot: a || 0 }),
      chandelier: (x, y, z) => ro({ t: 'dc_chand', x: LX(x), z: LZ(z), y: LY(y) }),
    };
    r.view(K, V);
    ro({ t: 'dc_box', k: 'floor', x: +(RM.W / 2).toFixed(3), z: +(RM.H / 2).toFixed(3), y: 0.02, sx: RM.W, sy: 0.04, sz: RM.H });   // castle floor (fcs paints it from the Map Editor surface)
  }
  for (const p of D2.props) { const o = { t: 'rp_' + p.kind, x: X(p.u), z: Z(p.v), rot: -(p.a || 0), y: p.z0 || 0 }; if (p.L) o.L = +m(p.L).toFixed(2); ro(o); }
  // walkable floors of this room (terr.fl k:'room' inside its rect): straight pieces along x (gallery deck + end ramps)
  for (const f of T.fl) {
    if (f.k !== 'room' || f.x0 < K.ox - 1 || f.x0 > K.ox + K.w || f.y0 < K.oy - 1 || f.y0 > K.oy + K.h) continue;
    const j = f.ny >> 1, top = i => f.top[j * f.nx + i], gnd = i => terrH(f.x0 + i * tc, f.y0 + j * tc), z0 = Z(f.y0 - K.oy), z1 = Z(f.y0 + (f.ny - 1) * tc - K.oy);
    let i0 = 0;
    while (i0 < f.nx - 1) {
      const sl = top(i0 + 1) - top(i0); let i1 = i0 + 1;
      while (i1 < f.nx - 1 && Math.abs(top(i1 + 1) - top(i1) - sl) < 0.02) i1++;
      if (Math.max(top(i0) - gnd(i0), top(i1) - gnd(i1)) > 0.1) {
        const x0 = X(f.x0 + i0 * tc - K.ox), x1 = X(f.x0 + i1 * tc - K.ox);
        RM.floors.push({ vis: 0, id: rn(), x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: z1 - z0, d: x1 - x0, rot: Math.PI / 2, y: +(top(i0) - K.g0).toFixed(2), y2: +(top(i1) - K.g0).toFixed(2), th: 0.6, c: '#7a5a3a' });
      }
      i0 = i1;
    }
  }
  RM.seq = rid; roomMaps.push(RM);
  const inst = { id: nid(), ref: RM.id, x: +m(K.ox + K.w / 2).toFixed(3), z: +m(K.oy + K.h / 2).toFixed(3), rot: 0 };
  M.rooms.push(inst);
  if (!process.argv.includes('--prefab')) { M.seq = id; MD.roomUnpack(M, inst, RM); id = M.seq + 1; }   // one-file map
}

// ---------- L bridge (deck + ramps as floors, parapet as raised walls, piers as boxes) ----------
const B = F.bridge;
if (B) {
  const rect = (r, _y, _y2, alongZ) => { const w = m(r.x2 - r.x1), d = m(r.y2 - r.y1);
    // floor's +d end is local +z; ramps: rs runs south (+z) going down; re runs east (+x) going down → rot +90° puts its +d end east
    return alongZ ? { x: m(r.x1) + w / 2, z: m(r.y1) + d / 2, w, d, rot: 0 } : { x: m(r.x1) + w / 2, z: m(r.y1) + d / 2, w: d, d: w, rot: Math.PI / 2 }; };
  const fl = (o, y, y2) => M.floors.push(Object.assign({ id: nid(), y, y2, th: 0.6, c: '#7d7870', sys: 'eggshell' }, o));
  fl(rect(B.ns, 0, 0, true), B.DH, B.DH);
  fl(rect(B.ew, 0, 0, true), B.DH, B.DH);
  fl(rect(B.rs, 0, 0, true), B.DH, B.gS);
  fl(rect(B.re, 0, 0, false), B.DH, B.gE);
  for (const [x1, y1, x2, y2] of B.par) M.walls.push({ id: nid(), pts: [[m(x1), m(y1)], [m(x2), m(y2)]], th: 0.5, h: 1.2, base: B.DH, c: '#8a8478', m: 'stone', closed: 0, curve: 0, brk: 0 });
  for (const s of B.spans.slice(1)) {   // one pier at the start of each span except the first
    const x = m(s.x1), z = m(s.y1), along = Math.abs(s.x2 - s.x1) > Math.abs(s.y2 - s.y1), g = MD.gh(M, x, z);
    obj({ col: 0, t: 'box', x, z, sx: along ? 1.6 : m(B.HW * 2), sy: Math.max(0.5, B.DH - 0.6 - g), sz: along ? m(B.HW * 2) : 1.6, c: '#77736c' });
  }
}

// ---------- bridge collision: the game's own circles (piers, corner block, ramp side walls) as collision-only cylinders ----------
const colCyl = (o, top) => obj({ t: 'cyl', vis: 0, cs: 1, x: +m(o.x).toFixed(3), z: +m(o.y).toFixed(3), sx: +(m(o.r) * 2).toFixed(3), sz: +(m(o.r) * 2).toFixed(3), sy: +Math.max(0.2, top).toFixed(2), c: '#7d7870' });
for (const o of OUT.obs) if (o.k === 'fbr') colCyl(o, (o.top != null ? o.top : o.hgt) - terrH(o.x, o.y));

// ---------- raised terraces ('tc'): walkable top + stair ramp (floors), edge / ramp-side collision (game circles) ----------
const flPieces = f => {   // a TERR floor grid → straight planar pieces along the axis it slopes on (flat = one piece)
  const T2 = (i, j) => f.top[j * f.nx + i], vx = Math.abs(T2(f.nx - 1, f.ny >> 1) - T2(0, f.ny >> 1)), vz = Math.abs(T2(f.nx >> 1, f.ny - 1) - T2(f.nx >> 1, 0)), alongX = vx >= vz;
  const N = alongX ? f.nx : f.ny, top = k => alongX ? T2(k, f.ny >> 1) : T2(f.nx >> 1, k), out = [];
  let i0 = 0;
  while (i0 < N - 1) { const sl = top(i0 + 1) - top(i0); let i1 = i0 + 1; while (i1 < N - 1 && Math.abs(top(i1 + 1) - top(i1) - sl) < 0.02) i1++; out.push([i0, i1, top(i0), top(i1)]); i0 = i1; }
  return out.map(([a, b, y0, y1]) => { const x0 = m(f.x0 + (alongX ? a : 0) * tc), x1 = m(f.x0 + (alongX ? b : f.nx - 1) * tc), z0 = m(f.y0 + (alongX ? 0 : a) * tc), z1 = m(f.y0 + (alongX ? f.ny - 1 : b) * tc);
    return alongX ? { x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: z1 - z0, d: x1 - x0, rot: Math.PI / 2, y: +y0.toFixed(2), y2: +y1.toFixed(2) } : { x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0, rot: 0, y: +y0.toFixed(2), y2: +y1.toFixed(2) }; });
};
for (const f of T.fl) if (f.k === 'terr') for (const q of flPieces(f)) M.floors.push(Object.assign({ id: nid(), th: 0.6, c: '#8a8478', vis: 0 }, q));   // look = castle decor
for (const q of F.props) if (q[0] === 'tc') { const [, X0, Y0, X1, Y1, , , , , Lp] = q, pad = Lp + 30;
  for (const o of OUT.obs) if (o.k === 'fcr' && o.x > X0 - pad && o.x < X1 + pad && o.y > Y0 - pad && o.y < Y1 + pad) colCyl(o, o.hgt); }

// ---------- castle look: replay fcsCastle (js/28-fcs-castle.js) with a recording THREE → game-drawn decor dc_* ----------
{
  const cs = fs.readFileSync('js/28-fcs-castle.js', 'utf8'), a = cs.indexOf('function fcsCastle(){'), b = cs.indexOf('// ---------- merge + add', a);
  class Geo { constructor(t, a) { this.t = t; this.a = a; this.ops = []; } clone() { const g = new Geo(this.t, this.a); g.ops = this.ops.slice(); return g; } scale(...v) { this.ops.push(['s', ...v]); return this; } translate(...v) { this.ops.push(['t', ...v]); return this; } rotateY(v) { this.ops.push(['ry', v]); return this; } rotateX(v) { this.ops.push(['rx', v]); return this; } rotateZ(v) { this.ops.push(['rz', v]); return this; } dispose() { } }
  sb.THREE = { BoxGeometry: class extends Geo { constructor(...a) { super('box', a); } }, ConeGeometry: class extends Geo { constructor(...a) { super('cone', a); } }, CylinderGeometry: class extends Geo { constructor(...a) { super('cyl', a); } } };
  sb.GYpx = (x, y) => terrH(x, y);
  vm.runInContext('const MAPS={fcs:OUT};const S3=1/20,FCSC={n:{}};const tx=p=>p/20,tz=p=>p/20;function GY(x,y){return GYpx(x,y);}' + cs.slice(a, b) + 'return {G,n:FCSC.n};}\nglobalThis.CASTLE=fcsCastle();', sb);
  const KMAP = { stone: 'stone', dark: 'dark', roof: 'roof2', slit: 'slit', lit: 'lit2', wood: 'wood', iron: 'iron' }, gnd = (x, z) => terrH(x * PX, z * PX), r3 = v => +v.toFixed(3);
  let nd = 0;
  for (const k in sb.CASTLE.G) for (const g of sb.CASTLE.G[k]) {
    const t = g.ops.filter(o => o[0] === 't').reduce((p, o) => [p[0] + o[1], p[1] + o[2], p[2] + o[3]], [0, 0, 0]), sc = g.ops.find(o => o[0] === 's'), ry = g.ops.find(o => o[0] === 'ry');
    const base = { k: KMAP[k] || 'stone', x: r3(t[0]), z: r3(t[2]), y: r3(t[1] - gnd(t[0], t[2])), castle: 1 };
    if (g.t === 'box') obj(Object.assign({ t: 'dc_box' }, base, { sx: r3(sc ? sc[1] : 1), sy: r3(sc ? sc[2] : 1), sz: r3(sc ? sc[3] : 1) }));
    else if (g.t === 'cyl') obj(Object.assign({ t: 'dc_cyl' }, base, { rt: g.a[0], rb: g.a[1], sy: g.a[2], seg: g.a[3] || 8 }));
    else if (g.t === 'cone') obj(Object.assign({ t: 'dc_cone' }, base, { r: r3(g.a[0]), sy: r3(g.a[1]), seg: g.a[2] || 8 }, g.a[4] ? { open: 1 } : {}, ry ? { ry: r3(ry[1]) } : {}, sc ? { ssx: r3(sc[1]), ssz: r3(sc[3]) } : {}));
    nd++;
  }
  const N = sb.CASTLE.n;
  for (const [x, z, bb, dx, dy] of N.banner || []) obj({ t: 'dc_banner', x: r3(x), z: r3(z), y: r3(bb - gnd(x, z)), rot: r3(Math.atan2(dx, dy)), castle: 1 });
  for (const [x, z, bb, dx, dy] of N.torch || []) obj({ t: 'dc_torch', x: r3(x), z: r3(z), y: r3(bb - gnd(x, z)), rot: r3(Math.atan2(dx, dy)), castle: 1 });
  for (const [x, y, z] of N.flag || []) obj({ t: 'dc_flag', x: r3(x), z: r3(z), y: r3(y - gnd(x, z)), castle: 1 });
  for (const [x, z, y] of N.post || []) obj({ t: 'dc_post', x: r3(x), z: r3(z), y: r3(y - gnd(x, z)), castle: 1 });
  console.log('castle decor', nd, 'shapes +', ['banner', 'torch', 'flag', 'post'].map(k => (N[k] || []).length).join('/'));
}

M.seq = id;
fs.mkdirSync('maps/build', { recursive: true });
fs.writeFileSync('maps/build/fcs-file.json', JSON.stringify(MD.pack(M)));
for (const R of roomMaps) fs.writeFileSync('maps/build/' + R.id + '.json', JSON.stringify(MD.pack(R)));
console.log(`fcs-file: ${W}x${H} m, grid ${nx}x${ny}, walls ${M.walls.length}, floors ${M.floors.length}, objs ${M.objs.length}, rooms ${roomMaps.map(R => R.id + ' (' + R.walls.length + ' walls, ' + R.floors.length + ' floors, ' + R.objs.length + ' objs)').join(', ')}`);
