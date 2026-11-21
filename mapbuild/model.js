// Map Builder — data model + game export (no three.js here, so node can run it too: tools/mapbuild-test.js)
// Source map (maps/build/<id>.json) → game data (assets/maps/<id>.json, same format the Blender exporter writes: assets/src/maps/map_export.py)
// Units: 1 unit = 1 m in the 3D world = 20 game px. Map coords: x east (0..W), z south (0..H), y up. Game px: X = x*20, Y = z*20.
// Format + rules: guides/MAP-BUILDER.md

export const C = 0.5, PX = 20, NONE = -32768;   // height grid spacing (units) — the game's collision grid uses the same 0.5
export const HMIN = -8, HMAX = 40;
export const TSLOPE = 1.6, TSTEP = 1.1, HEADROOM = 2.8, PR = 0.9;   // game rules (js/05-terrain.js, guides/MAP-DESIGN.md §4) — keep in sync

// surfaces: painted per grid point. env = gameplay surface kind written to the game's "env" masks (MAP-DESIGN §8)
export const SURF = [
  { k: 'grass', n: 'หญ้า', c: '#4f8a38' }, { k: 'grass2', n: 'หญ้าเข้ม', c: '#35642c' }, { k: 'dry', n: 'หญ้าแห้ง', c: '#8f8d48' },
  { k: 'dirt', n: 'ดิน', c: '#7a5c3c' }, { k: 'path', n: 'ทางดินอัด', c: '#a08a62' }, { k: 'rock', n: 'หิน/กรวด', c: '#77736c' },
  { k: 'pave', n: 'พื้นหินปู', c: '#9c978e' }, { k: 'dark', n: 'หินเข้ม', c: '#4a4a52' }, { k: 'sand', n: 'ทราย', c: '#cdb97c' },
  { k: 'snow', n: 'หิมะ', c: '#e4eaf0' }, { k: 'wood', n: 'พื้นไม้', c: '#8a6238' }, { k: 'ash', n: 'เถ้า/ไหม้', c: '#2f2c2a' },
  { k: 'mud', n: 'โคลน (ช้า)', c: '#57452f', env: 'mud' }, { k: 'water', n: 'น้ำตื้น', c: '#3f7fa8', env: 'water' },
  { k: 'ice', n: 'น้ำแข็ง (ลื่น)', c: '#a9d4e8', env: 'ice' }, { k: 'lava', n: 'ลาวา', c: '#d8521e', env: 'lava' },
  // เพิ่มท้ายตาราง (ห้ามแทรกกลาง — ดัชนีถูกเก็บในไฟล์แผนที่) • โทนจางสำหรับป่าหมอก (แมพ gorge)
  { k: 'moss', n: 'ตะไคร่/มอส', c: '#575837' }, { k: 'litter', n: 'ใบไม้แห้ง/ดินป่า', c: '#5d4a34' }, { k: 'gravel', n: 'กรวดหิน', c: '#7a7569' }, { k: 'duff', n: 'ใบสนทับถม', c: '#4b4332' }, { k: 'trail', n: 'ทางเดินป่า (ดินคล้ำ)', c: '#6f5b44' },
];
export const WALL_PRESET = [
  { n: 'กำแพงหิน', th: 1, h: 3.5, c: '#8a8478', m: 'stone' }, { n: 'กำแพงปราสาท', th: 2, h: 6, c: '#77736c', m: 'stone' },
  { n: 'กำแพงเตี้ย/ที่กำบัง', th: 0.8, h: 1.2, c: '#8a8478', m: 'stone' }, { n: 'กำแพงอิฐ', th: 0.7, h: 3.2, c: '#8c5a48', m: 'stone' },
  { n: 'ผนังไม้', th: 0.5, h: 3, c: '#7a5a3a', m: 'wood' }, { n: 'รั้วไม้', th: 0.4, h: 1.1, c: '#8a6a44', m: 'wood' },
  { n: 'พุ่มไม้ตัดแต่ง', th: 1.2, h: 1.8, c: '#3f6a34', m: 'wood' }, { n: 'กำแพงน้ำแข็ง', th: 1, h: 3, c: '#bfe0ee', m: 'ice' },
];
export const FLOOR_PRESET = [
  { n: 'ชานหิน', w: 8, d: 8, th: 0.5, c: '#8a8478' }, { n: 'สะพานหิน', w: 4, d: 14, th: 0.6, c: '#7d7870' }, { n: 'สะพานไม้', w: 3, d: 12, th: 0.35, c: '#7a5a3a' },
  { n: 'ทางลาด', w: 4, d: 8, th: 0.4, c: '#8a8478', ramp: 1 }, { n: 'บันได', w: 4, d: 7, th: 0.4, c: '#8a8478', ramp: 1, steps: 1 }, { n: 'ระเบียง', w: 12, d: 4, th: 0.4, c: '#7a5a3a' },
];
// built-in object types (kit assets are 'kit:<id>' and come from assets/mapkit/kit.json)
export const OBJ = {
  spawn: { n: 'จุดเกิด', cat: 'sys', c: '#4a8cff', note: 'FFA / ดวล / Co-op (ควรมี 6+)' },
  spawnR: { n: 'จุดเกิดทีมแดง', cat: 'sys', c: '#f06a6a' }, spawnB: { n: 'จุดเกิดทีมน้ำเงิน', cat: 'sys', c: '#5aa0ff' },
  espawn: { n: 'จุดเกิดมอนสเตอร์', cat: 'sys', c: '#c77dff', note: 'Co-op' },
  ring: { n: 'ห่วงแข่งไม้กวาด', cat: 'sys', c: '#f2d45e', note: 'เรียงตามลำดับที่วาง (10 ห่วง)' }, task: { n: 'จุดภารกิจ', cat: 'sys', c: '#6fcf97', note: 'โหมดหาโวลเดอมอร์ (6–8)' },
  light: { n: 'ไฟ (แสง)', cat: 'sys', c: '#ffb060', note: 'ไม่เกิน 12 ดวง' },
  pcrate: { n: 'ลังไม้', cat: 'game', c: '#a07a46', r: 0.9, h: 1.4 }, pbarrel: { n: 'ถังไม้', cat: 'game', c: '#8a5a32', r: 0.75, h: 1.6 },
  pchest: { n: 'หีบสมบัติ', cat: 'game', c: '#e8c060', r: 0.9, h: 1.0, note: 'ไม่เกิน 2 ใบ' },
  ptree: { n: 'ต้นโอ๊ก (พังได้)', cat: 'game', c: '#4f8f3c', r: 1.1, h: 7.5 }, ppine: { n: 'ต้นสน (พังได้)', cat: 'game', c: '#2f6a30', r: 1.0, h: 7 },
  house: { n: 'บ้านพังได้', cat: 'game', c: '#b08a5a', note: 'ต้องอยู่บนพื้นเรียบ' },
  poly: { n: 'ทรงอิสระ', cat: 'hid' },
  box: { n: 'กล่อง', cat: 'prim' }, cyl: { n: 'ทรงกระบอก', cat: 'prim' }, cone: { n: 'กรวย/หลังคา', cat: 'prim' }, ball: { n: 'ก้อนกลม', cat: 'prim' }, wedge: { n: 'ลิ่ม', cat: 'prim' },
  // siege mode markers (guides/MAP-STANDARD.md) — exported as data.siege, the game builds collision/visuals itself
  core: { n: 'แกน (จุดยึด)', cat: 'mode', c: '#7fd8ff', note: 'เลข 1–N = ลำดับที่ต้องทำลาย' },
  sgA: { n: 'จุดเกิดฝ่ายบุก (ต่อเฟส)', cat: 'mode', c: '#f0a04a', note: 'เฟสละ 1 จุด (เกมวาง 6 คนรอบจุด)' },
  sgB: { n: 'จุดเกิดฝ่ายรับ (ต่อเฟส)', cat: 'mode', c: '#5aa0ff', note: 'เฟสละ 1 จุด' },
  phase: { n: 'พื้นที่เล่นของเฟส', cat: 'mode', c: '#f2d45e', note: 'สี่เหลี่ยม (ไม่หมุน) • หลายกรอบต่อเฟสได้' },
  // room helpers
  ceil: { n: 'เพดาน', cat: 'room', c: '#c77dff', note: 'กดคน/ตัวบิน/กล้องไว้ใต้เพดาน • ห้องมีหลังคาสูง ≥ 20' },
};
// breakable room props — mirror of RPK in js/02-fcs-rooms.js (keep in sync) • col = collision radius px (0 = walk through), h m
// L = has a length (tables, benches, rails) • w = editor proxy width (m) • look is drawn by the game (js/28-fcs-props.js frpBuild)
export const RPK = {
  table: { n: 'โต๊ะยาว', col: 20, h: 1.0, L: 1, w: 1.6 }, hightable: { n: 'โต๊ะประธาน', col: 22, h: 1.1, L: 1, w: 1.8 }, bench: { n: 'ม้านั่งยาว', col: 0, h: 0.5, L: 1, w: 0.5 },
  chair: { n: 'เก้าอี้', col: 0, h: 1.05, w: 0.6 }, throne: { n: 'บัลลังก์', col: 16, h: 2.2, w: 1.4 }, crate: { n: 'ลัง', col: 22, h: 1.2, w: 1.4 }, crate2: { n: 'ลังซ้อน', col: 22, h: 2.35, w: 1.4 },
  barrel: { n: 'ถัง', col: 16, h: 1.3, w: 1.1 }, barrels: { n: 'กองถัง', col: 30, h: 1.3, w: 2.4 }, sack: { n: 'กระสอบ', col: 0, h: 0.6, w: 0.8 }, rack: { n: 'ชั้นวางอาวุธ', col: 0, h: 2.0, w: 1.6 },
  armor: { n: 'ชุดเกราะตั้ง', col: 14, h: 2.1, w: 0.9 }, shelf: { n: 'ชั้นหนังสือ', col: 0, h: 3.0, w: 2.0 }, desk: { n: 'โต๊ะเขียน', col: 0, h: 0.9, w: 1.4 },
  candle: { n: 'เชิงเทียนตั้ง', col: 0, h: 2.2, w: 0.5 }, woodpile: { n: 'กองฟืน', col: 0, h: 0.8, w: 1.6 }, cart: { n: 'เกวียน', col: 30, h: 1.6, w: 2.6 }, keg: { n: 'ถังเล็ก', col: 0, h: 0.7, w: 0.7 },
  rail: { n: 'ราวกันตก', col: 9, h: 1.1, L: 1, w: 0.5 }, pillar: { n: 'เสาใหญ่', col: 26, h: 24, w: 2.6 },
};
for (const k in RPK) OBJ['rp_' + k] = { n: RPK[k].n, cat: 'room', c: '#a07a56', rp: k };
export const isRP = t => t.startsWith('rp_');
// game systems bound by tag, not by map name (MAP-STANDARD §1.7)
export const SYS_WALL = [['', '(ไม่มี)'], ['fence', 'รั้วไหม้ได้'], ['stonewall', 'ผนังหิน (รอยแตก/ไหม้)']];
export const SYS_FLOOR = [['', '(ไม่มี)'], ['eggshell', 'แตกแบบเปลือกไข่ (สะพาน)']];
export const SG_WALL = [['', '(ไม่ใช่)'], ['wall', 'กำแพงเป้าหมาย'], ['gate', 'ประตูเป้าหมาย']];
// look presets drawn by game code (MAP-STANDARD §1.5) — map default + per wall/floor/part override
export const STYLE = [['', '(ปกติ)'], ['castle-stone', 'ปราสาทหิน'], ['room-hall', 'ห้องโถงปราสาท'], ['forest-mist', 'ป่าสนหมอก']];
export const MODES = [['coop', 'Co-op'], ['ffa', 'FFA'], ['duel', 'ดวล'], ['tdm', 'ทีม'], ['br', 'Battle Royale'], ['race', 'แข่งไม้กวาด'], ['imp', 'หาโวลเดอมอร์'], ['siege', 'บุกปราสาท']];
export const SKY = [['day', 'กลางวัน'], ['sunset', 'เย็น'], ['night', 'กลางคืน'], ['indoor', 'ในอาคาร']];
export const FXS = [['snow', 'หิมะตก'], ['fireflies', 'หิ่งห้อย'], ['candles', 'เทียนลอย'], ['snitch', 'ลูกสนิช'], ['rune', 'วงเวทกลางแผนที่']];
export const MUSIC = ['', 'castle', 'meadow', 'forest', 'hogsmeade', 'lake', 'ruins', 'greathall', 'pitch'];

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

// ---------- create / pack ----------
export function newMap(o = {}) {
  const W = o.W || 100, H = o.H || 70, nx = Math.round(W / C) + 1, ny = Math.round(H / C) + 1;
  return { v: 1, id: o.id || '', name: o.name || 'แผนที่ใหม่', desc: '', W, H, nx, ny, hg: new Float32Array(nx * ny), sf: new Uint8Array(nx * ny).fill(o.surf || 0),
    sky: 'day', fog: null, music: '', weather: '', fx: [], modes: ['coop', 'ffa', 'duel', 'tdm'], random: 0, autoProps: 1, skirt: 40,
    walls: [], floors: [], objs: [], parts: [], seq: 1 };
}
const b64e = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const b64d = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
export const i16b64 = a => b64e(new Uint8Array(a.buffer, a.byteOffset, a.byteLength));
export function pack(M) {   // → plain JSON object (heights as int16 cm, base64)
  const h = new Int16Array(M.hg.length); for (let i = 0; i < h.length; i++) h[i] = Math.round(M.hg[i] * 100);
  return Object.assign({}, M, { hg: i16b64(h), sf: b64e(M.sf) });
}
export function unpack(j) {
  const M = Object.assign(newMap({ W: j.W, H: j.H }), j);
  M.nx = Math.round(M.W / C) + 1; M.ny = Math.round(M.H / C) + 1;
  const n = M.nx * M.ny, hb = b64d(j.hg), h = new Int16Array(hb.buffer, 0, hb.length >> 1);
  M.hg = new Float32Array(n); for (let i = 0; i < n && i < h.length; i++) M.hg[i] = h[i] / 100;
  const s = b64d(j.sf); M.sf = new Uint8Array(n); M.sf.set(s.subarray(0, n));
  for (const k of ['walls', 'floors', 'objs', 'fx', 'parts']) if (!Array.isArray(M[k])) M[k] = [];
  return M;
}
export function resize(M, W, H) {   // keep the content centred
  const N = newMap({ W, H }), ox = Math.round((N.nx - M.nx) / 2), oy = Math.round((N.ny - M.ny) / 2);
  for (let j = 0; j < N.ny; j++) for (let i = 0; i < N.nx; i++) {
    const si = clamp(i - ox, 0, M.nx - 1), sj = clamp(j - oy, 0, M.ny - 1);
    N.hg[j * N.nx + i] = M.hg[sj * M.nx + si]; N.sf[j * N.nx + i] = M.sf[sj * M.nx + si];
  }
  const dx = ox * C, dz = oy * C;
  for (const w of M.walls) for (const p of w.pts) { p[0] += dx; p[1] += dz; }
  for (const o of M.floors.concat(M.objs, M.parts || [])) { o.x += dx; o.z += dz; }
  Object.assign(M, { W, H, nx: N.nx, ny: N.ny, hg: N.hg, sf: N.sf });
}

// ---------- terrain ----------
export function gh(M, x, z) {   // ground height, bilinear (same maths as the game's terrT)
  const fx = clamp(x / C, 0, M.nx - 1.001), fz = clamp(z / C, 0, M.ny - 1.001), i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = j * M.nx + i, a = M.hg;
  return (a[k] * (1 - u) + a[k + 1] * u) * (1 - v) + (a[k + M.nx] * (1 - u) + a[k + M.nx + 1] * u) * v;
}
export function slopeAt(M, i, j) {   // rise / run at a grid point (steepest of the 4 neighbours)
  const a = M.hg, nx = M.nx, k = j * nx + i, h = a[k]; let s = 0;
  if (i > 0) s = Math.max(s, Math.abs(h - a[k - 1])); if (i < nx - 1) s = Math.max(s, Math.abs(h - a[k + 1]));
  if (j > 0) s = Math.max(s, Math.abs(h - a[k - nx])); if (j < M.ny - 1) s = Math.max(s, Math.abs(h - a[k + nx]));
  return s / C;
}
export function hash2(i, j) { let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function vnoise(x, z) { const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v);
  return (hash2(i, j) * (1 - a) + hash2(i + 1, j) * a) * (1 - b) + (hash2(i, j + 1) * (1 - a) + hash2(i + 1, j + 1) * a) * b; }

// ---------- walls ----------
// w = {id, pts:[[x,z]…], th, h, c (colour), m (break material), closed, curve, brk, base (absolute bottom height, null = follows the ground)}
export function wallPath(w) {   // control points → polyline (curve = Catmull-Rom through the points)
  let P = w.pts.map(p => [p[0], p[1]]);
  if (P.length < 2) return P;
  if (w.closed && P.length > 2) P.push([P[0][0], P[0][1]]);
  if (w.curve && P.length > 2) {
    const n = P.length, out = [], get = i => w.closed ? P[((i % (n - 1)) + (n - 1)) % (n - 1)] : P[clamp(i, 0, n - 1)];
    for (let i = 0; i < n - 1; i++) { const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      for (let s = 0; s < 8; s++) { const t = s / 8, t2 = t * t, t3 = t2 * t;
        out.push([0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3)]); } }
    out.push(P[n - 1]); P = out;
  }
  return P;
}
export function pathLen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return L; }
// polyline → points every `step` along it (corners kept). Returns [[x,z,dist]…]
export function resample(P, step) {
  const out = []; let d = 0;
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i], b = P[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / step));
    for (let s = 0; s < n; s++) out.push([a[0] + (b[0] - a[0]) * s / n, a[1] + (b[1] - a[1]) * s / n, d + L * s / n]);
    d += L;
  }
  if (P.length) out.push([P[P.length - 1][0], P[P.length - 1][1], d]);
  return out;
}
export const CHUNK = 4;   // a breakable wall breaks in pieces this long (units)
// → [{pts:[[x,z,dist]…], corner:[bool…]}] one entry per separately breakable piece (1 entry when not breakable)
export function wallChunks(w) {
  const P = wallPath(w); if (P.length < 2) return [];
  const R = resample(P, 0.75), L = R[R.length - 1][2];
  if (!w.brk) return [R];
  const n = Math.max(1, Math.round(L / CHUNK)), out = [];
  for (let c = 0; c < n; c++) { const d0 = L * c / n, d1 = L * (c + 1) / n, q = [pointAt(R, d0)];
    for (const p of R) if (p[2] > d0 + 1e-6 && p[2] < d1 - 1e-6) q.push(p);
    q.push(pointAt(R, d1)); out.push(q); }
  return out;
}
function pointAt(R, d) { for (let i = 1; i < R.length; i++) if (R[i][2] >= d - 1e-9) { const a = R[i - 1], b = R[i], t = (d - a[2]) / Math.max(1e-9, b[2] - a[2]); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, d]; } return R[R.length - 1].slice(); }
export const wallR = w => Math.max(0.25, w.th / 2);
export function wallBase(M, w, x, z) { return w.base != null ? w.base : gh(M, x, z); }
function chunkCircles(M, w, R) {   // collision: a chain of circles along the piece (the game only knows circles)
  const r = wallR(w), L = R[R.length - 1][2] - R[0][2], n = Math.max(1, Math.ceil(L / (r * 1.15))), out = [];
  for (let i = 0; i <= n; i++) { const p = pointAt(R, R[0][2] + L * i / n), g = gh(M, p[0], p[1]), b = wallBase(M, w, p[0], p[1]);
    const c = { x: p[0], z: p[1], r, top: b + w.h, hgt: b + w.h - g }; if (b - g > 0.3) c.bot = b - g; if (c.hgt > 0.05) out.push(c); }
  return out;
}

// ---------- floors (upper level: bridges, platforms, ramps) ----------
// f = {id, x, z (centre), w, d, rot, y (top height at the −d end), y2 (top at the +d end; = y when flat), th, c, steps}
export function floorTop(f, x, z) {   // top height at a map point, NaN outside
  const dx = x - f.x, dz = z - f.z, cs = Math.cos(f.rot || 0), sn = Math.sin(f.rot || 0), lx = dx * cs - dz * sn, lz = dx * sn + dz * cs;
  if (Math.abs(lx) > f.w / 2 + 1e-6 || Math.abs(lz) > f.d / 2 + 1e-6) return NaN;
  return f.y + ((f.y2 == null ? f.y : f.y2) - f.y) * (lz / f.d + 0.5);
}
export function floorCorners(f) { const cs = Math.cos(f.rot || 0), sn = Math.sin(f.rot || 0), o = [];
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const lx = a * f.w / 2, lz = b * f.d / 2; o.push([f.x + lx * cs + lz * sn, f.z - lx * sn + lz * cs]); } return o; }
export function surfTop(M, x, z, ref, fl) {   // highest walkable surface at or below ref (+step): ground or a floor (fl = floor list, default M.floors)
  let h = gh(M, x, z); for (const f of fl || M.floors) { const t = floorTop(f, x, z); if (t > h && (ref == null || t <= ref + TSTEP)) h = t; } return h;
}

// ---------- objects ----------
// o = {id, t, x, z, y (lift above ground), rot, s, sx, sy, sz, c, col (0/1 override), brk (0/1 override), cs (collision size %), + type fields}
// dim(o) (from the 3D view) → {ex, ez, h, col, brk, m} half extents on the ground before rotation, height, kit defaults
export function objCircles(M, o, d) {
  if (!d || !d.col) return [];
  const k = (o.cs == null ? d.cs || 1 : o.cs), ex = d.ex * k, ez = d.ez * k, g = gh(M, o.x, o.z), lift = o.y || 0, top = g + lift + d.h, out = [];
  const add = (x, z, r) => { const gg = gh(M, x, z), c = { x, z, r, top, hgt: top - gg }; if (lift > 0.3) c.bot = g + lift - gg; if (c.hgt > 0.05 && r > 0.05) out.push(c); };
  if (Math.abs(ex - ez) < 0.2 * Math.max(ex, ez) || Math.max(ex, ez) < 0.5) { add(o.x, o.z, Math.max(ex, ez)); return out; }
  const rot = o.rot || 0, long = ex > ez, r = Math.max(0.25, Math.min(ex, ez)), L = Math.max(ex, ez) - r, n = Math.max(1, Math.ceil(L / (r * 1.1)));
  const ax = long ? Math.cos(rot) : Math.sin(rot), az = long ? -Math.sin(rot) : Math.cos(rot);
  for (let i = 0; i <= n; i++) { const t = -L + 2 * L * i / n; add(o.x + ax * t, o.z + az * t, r); }
  return out;
}

// ---------- export to the game format ----------
const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
const cm = v => v !== v ? NONE : clamp(Math.round(v * 100), -32767, 32767);
export function gameData(M, dim) {
  const nx = M.nx, ny = M.ny, g = new Int16Array(nx * ny);
  for (let i = 0; i < g.length; i++) g[i] = cm(M.hg[i]);
  // floors → top/bottom grids on the same 0.5 grid
  const fl = [], XP = expandParts(M), allFloors = M.floors.concat(XP.floors), allObjs = M.objs.concat(XP.objs);
  for (const f of allFloors) {
    const cs = floorCorners(f), x0 = Math.floor(Math.min(...cs.map(c => c[0])) / C) * C, z0 = Math.floor(Math.min(...cs.map(c => c[1])) / C) * C;
    const fx = Math.round((Math.ceil(Math.max(...cs.map(c => c[0])) / C) * C - x0) / C) + 1, fy = Math.round((Math.ceil(Math.max(...cs.map(c => c[1])) / C) * C - z0) / C) + 1;
    const top = new Int16Array(fx * fy), bot = new Int16Array(fx * fy); let any = 0;
    for (let j = 0; j < fy; j++) for (let i = 0; i < fx; i++) { const t = floorTop(f, x0 + i * C, z0 + j * C); top[j * fx + i] = cm(t); bot[j * fx + i] = cm(t - (f.th || 0.4)); if (t === t) any++; }
    if (any) fl.push({ x0: r1(x0 * PX), y0: r1(z0 * PX), nx: fx, ny: fy, top: i16b64(top), bot: i16b64(bot) });
  }
  // collision + breakable groups
  const obs = [], brk = [], brkOf = new Map();
  const put = (c, gi, ex) => { const o = { x: r1(c.x * PX), y: r1(c.z * PX), r: r1(c.r * PX), hgt: r2(c.hgt), k: 'col' }; if (c.bot != null) o.bot = r2(c.bot); if (gi != null) o.b = gi; if (ex) Object.assign(o, ex); obs.push(o); };
  let fenceN = 0;   // fence segment index (same order as data.sys.fence below) → obs k:'fcf' + fid (js/12-efs lowers burnt sections)
  for (const w of M.walls) {
    if (w.sg) continue;   // siege target wall/gate: the game builds its collision + look from data.siege.bw (js/02-fcs sgFromFile)
    const P = w.sys === 'fence' ? wallPath(w) : null, f0 = fenceN; if (P) fenceN += P.length - 1;
    const fid = c => { let best = 0, bd = 1e9; for (let i = 1; i < P.length; i++) { const [ax, az] = P[i - 1], [bx, bz] = P[i], dx = bx - ax, dz = bz - az, t = clamp(((c.x - ax) * dx + (c.z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1), d = Math.hypot(c.x - ax - dx * t, c.z - az - dz * t); if (d < bd) { bd = d; best = i - 1; } } return f0 + best; };
    wallChunks(w).forEach((R, ci) => {
      let gi = null;
      if (w.brk && !P) { gi = brk.length; brkOf.set('w' + w.id + ':' + ci, gi); const L = R[R.length - 1][2] - R[0][2];
        brk.push({ h: r2(w.h), vh: r2(w.h), v: r1(L * w.th * w.h), m: w.m || 'stone', n: 'wall_' + w.id + '_' + ci }); }
      for (const c of chunkCircles(M, w, R)) put(c, gi, P ? { k: 'fcf', fid: fid(c) } : null);
    });
  }
  const spawns = [], espawn = [], rings = [], tasks = [], props = [], houses = [], lights = [];
  const sg = { cores: [], sp: { A: {}, B: {} }, phases: [], bw: [] }, ceil = [], rprops = [];
  const rect = o => { const w = (o.sx || 1) * PX, d = (o.sz || 1) * PX; return { x0: r1(o.x * PX - w / 2), y0: r1(o.z * PX - d / 2), x1: r1(o.x * PX + w / 2), y1: r1(o.z * PX + d / 2) }; };
  for (const o of allObjs) {
    const X = r1(o.x * PX), Y = r1(o.z * PX), rot = o.rot || 0;
    if (o.t === 'core') sg.cores.push({ n: o.n || sg.cores.length + 1, x: X, y: Y, s: r1((o.s || 4) * PX) });
    else if (o.t === 'sgA' || o.t === 'sgB') sg.sp[o.t === 'sgA' ? 'A' : 'B'][o.ph || 1] = { x: X, y: Y };
    else if (o.t === 'phase') { const q = rect(o), k = (o.ph || 1) - 1; (sg.phases[k] = sg.phases[k] || []).push({ x1: q.x0, y1: q.y0, x2: q.x1, y2: q.y1 }); }
    else if (o.t === 'ceil') ceil.push(Object.assign(rect(o), { h: r2(o.y == null ? 21 : o.y) }, o.zmax != null ? { zmax: r2(o.zmax) } : {}));
    else if (isRP(o.t)) rprops.push(Object.assign({ k: o.t.slice(3), x: X, y: Y, a: +(-rot).toFixed(3) }, o.L ? { L: r1(o.L * PX) } : {}, o.y ? { z0: r2(o.y) } : {}));
    else if (o.t === 'spawn' || o.t === 'spawnR' || o.t === 'spawnB') { const s = { x: X, y: Y, a: +Math.atan2(Math.cos(rot), Math.sin(rot)).toFixed(3) }; if (o.t !== 'spawn') s.t = o.t === 'spawnR' ? 1 : 0; spawns.push(s); }
    else if (o.t === 'espawn') espawn.push({ x: X, y: Y });
    else if (o.t === 'ring') rings.push({ x: X, y: Y, h: r2(Math.max(1, o.y || 6)) });
    else if (o.t === 'task') tasks.push({ x: X, y: Y });
    else if (o.t === 'light') lights.push({ x: X, y: Y, h: r2(o.y == null ? 2.2 : o.y), col: o.c || '#ffb060', int: o.int == null ? 2.4 : o.int, dist: o.dist || 14 });
    else if (o.t === 'house') houses.push(Object.assign({ x: X, y: Y, w: r1(160 * (o.sx || 1)), d: r1(130 * (o.sz || 1)), ry: +rot.toFixed(3) }, o.brk === 0 ? { nb: 1 } : {}));   // nb = unbreakable (inspector 'พังได้' off)
    else if (OBJ[o.t] && OBJ[o.t].cat === 'game') props.push(Object.assign({ k: o.t, x: X, y: Y, a: +rot.toFixed(3) }, o.brk === 0 ? { nb: 1 } : {}));
    else { const d = dim(o); if (!d) continue; const cs = objCircles(M, o, d); if (!cs.length) continue;
      let gi = null; const isBrk = o.brk == null ? d.brk : o.brk;
      if (isBrk) { gi = brk.length; brkOf.set('o' + o.id, gi); brk.push({ h: r2(d.h), vh: r2(d.h), v: r1(d.ex * 2 * d.ez * 2 * d.h), m: d.m || 'stone', n: 'obj_' + o.id }); }
      for (const c of cs) put(c, gi); }
  }
  spawns.sort((a, b) => (a.t == null ? -1 : a.t) - (b.t == null ? -1 : b.t));
  // siege target walls/gate (axis-aligned bounding rect of the wall) + tagged systems
  const sys = {};
  for (const w of M.walls) {
    const P = wallPath(w), xs = P.map(p => p[0]), zs = P.map(p => p[1]);
    if (w.sg) sg.bw.push({ k: w.sg, x: r1((Math.min(...xs) - w.th / 2) * PX), y: r1((Math.min(...zs) - w.th / 2) * PX), w: r1((Math.max(...xs) - Math.min(...xs) + w.th) * PX), d: r1((Math.max(...zs) - Math.min(...zs) + w.th) * PX), h: r2(w.h), id: w.id });
    if (w.sys && !(w.sg && w.sys === 'fence')) for (let i = 1; i < P.length; i++) (sys[w.sys] = sys[w.sys] || []).push([r1(P[i - 1][0] * PX), r1(P[i - 1][1] * PX), r1(P[i][0] * PX), r1(P[i][1] * PX), r2(w.th), r2(w.h)]);
  }
  for (const f of M.floors) if (f.sys) (sys[f.sys] = sys[f.sys] || []).push(floorCorners(f).map(c => [r1(c[0] * PX), r1(c[1] * PX)]));
  sg.cores.sort((a, b) => a.n - b.n);
  // gameplay surfaces → top-down bit masks on a 1-unit grid
  const env = [], kinds = {};
  SURF.forEach((s, i) => { if (s.env) kinds[i] = s.env; });
  for (const [si, kind] of Object.entries(kinds)) {
    let i0 = 1e9, i1 = -1, j0 = 1e9, j1 = -1;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (M.sf[j * nx + i] === +si) { if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j; }
    if (i1 < 0) continue;
    const x0 = Math.floor(i0 * C), z0 = Math.floor(j0 * C), ex = Math.ceil(i1 * C) - x0 + 1, ez = Math.ceil(j1 * C) - z0 + 1, bits = new Uint8Array((ex * ez + 7) >> 3);
    for (let j = 0; j < ez; j++) for (let i = 0; i < ex; i++) { const gi = Math.min(nx - 1, (x0 + i) * 2), gj = Math.min(ny - 1, (z0 + j) * 2); if (M.sf[gj * nx + gi] === +si) { const k = j * ex + i; bits[k >> 3] |= 1 << (k & 7); } }
    env.push({ k: kind, name: 'env_' + kind + '_mb', c: PX, x0: x0 * PX, y0: z0 * PX, nx: ex, ny: ez, m: b64e(bits) });
  }
  const data = { fmt: 1, id: M.id, name: M.name, desc: M.desc || '', sky: M.sky || 'day', fog: M.fog || null, modes: M.modes && M.modes.length ? M.modes : null, random: M.random ? 1 : 0,
    weather: M.weather || '', music: M.music || '', W: M.W * PX, H: M.H * PX, c: C * PX, nx, ny, g: i16b64(g), fl, obs, spawns, espawn, rings, tasks, houses, lights, env, brk, fx: M.fx || [], mb: 1 };
  if (props.length || !M.autoProps) data.props = props;
  if (M.look) data.look = M.look;   // พรีเซ็ต Look (js/74-look.js) • lt = แสง/ฟ้าเฉพาะแมพ (js/28 buildFileMap) — ตั้งโดยแก้ไฟล์ต้นฉบับตรง ๆ (ยังไม่มีช่องใน Editor)
  if (M.lt) data.lt = M.lt;
  if (M.style) data.style = M.style;
  if (sg.cores.length || sg.bw.length || sg.phases.length || Object.keys(sg.sp.A).length || Object.keys(sg.sp.B).length) data.siege = sg;
  if (ceil.length) data.ceil = ceil;
  if (rprops.length) data.rprops = rprops;
  if (Object.keys(sys).length) data.sys = sys;
  return { data, brkOf, counts: { obs: obs.length, brk: brk.length, spawns: spawns.filter(s => s.t == null).length, red: spawns.filter(s => s.t === 1).length, blue: spawns.filter(s => s.t === 0).length,
    espawn: espawn.length, rings: rings.length, tasks: tasks.length, lights: lights.length, props: props.length, houses: houses.length, floors: fl.length, parts: (M.parts || []).length,
    rprops: rprops.length, ceil: ceil.length }, sg, ceil };
}

// ---------- checks ----------
// → [{lv:'ok'|'warn'|'err', t:text, at:[x,z]?}]
export function check(M, G) {
  const out = [], c = G.counts, has = m => !M.modes || !M.modes.length || M.modes.includes(m), add = (lv, t, at) => out.push({ lv, t, at });
  const siegeOnly = M.modes && M.modes.length === 1 && M.modes[0] === 'siege';   // siege uses its own per-phase spawns
  if (siegeOnly) { /* general spawns not needed */ }
  else if (!c.spawns && !c.red && !c.blue) add('err', 'ยังไม่มีจุดเกิด — วางอย่างน้อย 6 จุด (เครื่องมือ "จุดเกม")');
  else if (c.spawns < 6) add('warn', 'จุดเกิดทั่วไปมี ' + c.spawns + ' จุด (ควรมี 6 กระจายห่างกัน)');
  else add('ok', 'จุดเกิดทั่วไป ' + c.spawns + ' จุด');
  if (has('tdm') && !siegeOnly) { if (c.red >= 3 && c.blue >= 3) add('ok', 'จุดเกิดทีม แดง ' + c.red + ' / น้ำเงิน ' + c.blue); else add('warn', 'โหมดทีม: จุดเกิดทีมมี แดง ' + c.red + ' / น้ำเงิน ' + c.blue + ' (ควรฝ่ายละ 3 — ไม่มี = เกมแบ่งจากจุดเกิดทั่วไปซ้าย/ขวา)'); }
  if (M.modes && M.modes.includes('race') && c.rings < 10) add('warn', 'แข่งไม้กวาด: ห่วงมี ' + c.rings + ' (ต้อง 10)');
  if (M.modes && M.modes.includes('imp') && c.tasks < 6) add('warn', 'หาโวลเดอมอร์: จุดภารกิจมี ' + c.tasks + ' (ควร 6–8)');
  if (has('coop') && c.espawn && c.espawn < 4) add('warn', 'Co-op: จุดเกิดมอนสเตอร์มี ' + c.espawn + ' (ควร 4+ หรือไม่วางเลยให้เกมสุ่มตามขอบ)');
  if (M.modes && M.modes.includes('siege')) {
    const S = G.sg, N = S.cores.length;
    if (!N) add('err', 'บุกปราสาท: ยังไม่มีแกน (วางของ → โหมดบุกปราสาท → แกน)');
    else {
      const ns = S.cores.map(k => k.n);
      if (ns.some((n, i) => n !== i + 1)) add('err', 'บุกปราสาท: เลขแกนต้องเป็น 1–' + N + ' ไม่ซ้ำ (ตอนนี้ ' + ns.join(', ') + ')'); else add('ok', 'บุกปราสาท: แกน ' + N + ' จุด');
      for (let p = 1; p <= N; p++) {
        const miss = [!S.sp.A[p] && 'จุดเกิดฝ่ายบุก', !S.sp.B[p] && 'จุดเกิดฝ่ายรับ', !S.phases[p - 1] && 'พื้นที่เล่น'].filter(Boolean);
        if (miss.length) { add('err', 'บุกปราสาท เฟส ' + p + ': ยังไม่มี ' + miss.join(', ')); continue; }
        const inA = q => S.phases[p - 1].some(r => q.x >= r.x1 && q.x <= r.x2 && q.y >= r.y1 && q.y <= r.y2);
        const k = S.cores.find(c => c.n === p); if (k && !inA(k)) add('warn', 'บุกปราสาท เฟส ' + p + ': แกน ' + p + ' อยู่นอกพื้นที่เล่นของเฟส', [k.x / PX, k.y / PX]);
        for (const [t, n] of [['A', 'ฝ่ายบุก'], ['B', 'ฝ่ายรับ']]) if (!inA(S.sp[t][p])) add('warn', 'บุกปราสาท เฟส ' + p + ': จุดเกิด' + n + 'อยู่นอกพื้นที่เล่น', [S.sp[t][p].x / PX, S.sp[t][p].y / PX]);
      }
      add(S.bw.length ? 'ok' : 'warn', 'บุกปราสาท: กำแพง/ประตูเป้าหมาย ' + S.bw.length + ' ชิ้น');
    }
  }
  for (const q of G.ceil) if (q.zmax == null && q.h < 20) add('warn', 'เพดานสูง ' + q.h + ' (ห้องมีหลังคาควร ≥ 20 ให้ตัวบินเล่นได้ • ใต้ชั้นลอยให้ใส่ "ใช้กับคนที่ต่ำกว่า")', [(q.x0 + q.x1) / 2 / PX, (q.y0 + q.y1) / 2 / PX]);
  if (c.lights > 12) add('warn', 'ไฟ ' + c.lights + ' ดวง (แนะนำไม่เกิน 12)');
  if (c.obs > 2000) add('err', 'ที่ชน ' + c.obs + ' วง — หนักเกิน (ไม่ควรเกิน 2000): ลดกำแพงบางยาว ๆ หรือทำให้หนาขึ้น');
  else if (c.obs > 1200) add('warn', 'ที่ชน ' + c.obs + ' วง (เริ่มหนัก — กำแพงยิ่งบางยิ่งใช้วงเยอะ)');
  else add('ok', 'ที่ชน ' + c.obs + ' วง');
  if (c.props > 0 && M.objs.filter(o => o.t === 'pchest').length > 2) add('warn', 'หีบสมบัติเกิน 2 ใบ');
  let lo = 1e9, hi = -1e9; for (const h of M.hg) { if (h < lo) lo = h; if (h > hi) hi = h; }
  if (lo < -5 || hi > 20) add('warn', 'ระดับพื้น ' + lo.toFixed(1) + ' ถึง ' + hi.toFixed(1) + ' (กล้อง/มินิแมพตั้งไว้ราว −5 ถึง +20)');
  // spawn points: on walkable ground and clear of collision
  const obs = G.data.obs;
  M.objs.filter(o => /^spawn/.test(o.t)).forEach((o, n) => {
    const i = clamp(Math.round(o.x / C), 0, M.nx - 1), j = clamp(Math.round(o.z / C), 0, M.ny - 1);
    if (slopeAt(M, i, j) > TSLOPE) add('warn', 'จุดเกิดอยู่บนทางชัน', [o.x, o.z]);
    if (obs.some(q => q.bot == null && Math.hypot(q.x - o.x * PX, q.y - o.z * PX) < q.r + 1.5 * PX)) add('warn', 'จุดเกิดชิดที่ชนเกินไป (ควรโล่งรัศมี 4)', [o.x, o.z]);
  });
  // floors: walk-under headroom
  for (const f of M.floors) { const g = gh(M, f.x, f.z), gap = Math.min(f.y, f.y2 == null ? f.y : f.y2) - (f.th || 0.4) - g;
    if (gap > 0.5 && gap < HEADROOM) add('warn', 'ใต้พื้นชั้นบนสูง ' + gap.toFixed(1) + ' (ต่ำกว่า ' + HEADROOM + ' = เดินลอดไม่ได้)', [f.x, f.z]); }
  // reachability from the first spawn (ground level only, 1-unit cells)
  const sp = M.objs.filter(o => /^spawn/.test(o.t)), FL = M.floors;   // castle part floors (walkways, gate tops) are left out: the check is ground-level only
  if (sp.length > 1) {
    const w = Math.floor(M.W), h = Math.floor(M.H), blk = new Uint8Array(w * h), seen = new Uint8Array(w * h);
    for (const q of obs) { if (q.bot != null || q.hgt < 0.6) continue; const cx = q.x / PX, cz = q.y / PX, R = q.r / PX + PR * 0.6;
      for (let j = Math.max(0, Math.floor(cz - R)); j <= Math.min(h - 1, Math.ceil(cz + R)); j++) for (let i = Math.max(0, Math.floor(cx - R)); i <= Math.min(w - 1, Math.ceil(cx + R)); i++) if (Math.hypot(i + 0.5 - cx, j + 0.5 - cz) < R) blk[j * w + i] = 1; }
    const cell = o => clamp(Math.floor(o.z), 0, h - 1) * w + clamp(Math.floor(o.x), 0, w - 1), H = k => surfTop(M, (k % w) + 0.5, ((k / w) | 0) + 0.5, null, FL);
    const st = [cell(sp[0])]; seen[st[0]] = 1;
    while (st.length) { const k = st.pop(), x = k % w, y = (k / w) | 0, hk = H(k);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const q = Y * w + X; if (seen[q] || blk[q]) continue;
        if (H(q) - hk > TSLOPE) continue; seen[q] = 1; st.push(q); } }
    const bad = sp.filter(o => !seen[cell(o)]);
    if (bad.length) bad.forEach(o => add('warn', 'จุดเกิดนี้เดินไปไม่ถึงจากจุดเกิดแรก (ตรวจคร่าว ๆ)', [o.x, o.z])); else add('ok', 'จุดเกิดทุกจุดเดินถึงกัน');
  }
  return out;
}

// ---------- castle parts (guides/MAP-BUILDER.md "ชิ้นส่วนปราสาท") ----------
// M.parts[] = {id, k, x, z, rot, base (absolute bottom height, null = follows the ground), c, brk, + params (PART[k].p) + flags (PART[k].f)}
// A part is NOT a new pipeline: expandParts() turns it into plain prim objs (box/cyl/cone/wedge → collision circles, glb, brk groups) and floors (walkable tops).
// Local frame: origin = part centre, +z = length axis, +x = across; rot = rotation.y (same as objs/floors). Expanded items carry _p = part id; hid:1 = collision only (no mesh).
export const PART = {   // p: name → [default, min, max, step] • f: flag defaults
  wall:   { n: 'กำแพงตรง', c: '#8a8478', p: { len: [10, 2, 60, 1], th: [2, 0.6, 6, 0.2], h: [6, 1, 20, 0.5] }, f: { bt: 1, wk: 1 }, main: 'len' },
  corner: { n: 'กำแพงมุม (L)', c: '#8a8478', p: { a: [10, 3, 40, 1], b: [10, 3, 40, 1], th: [2, 0.6, 6, 0.2], h: [6, 1, 20, 0.5] }, f: { bt: 1, wk: 1 }, main: 'a' },
  tower:  { n: 'หอคอย', c: '#77736c', p: { r: [3.5, 1.5, 10, 0.25], h: [10, 3, 30, 0.5] }, f: { round: 1, roof: 0, bt: 1 }, main: 'r' },
  gate:   { n: 'ประตูเมือง', c: '#77736c', p: { len: [14, 6, 40, 1], th: [3, 1, 8, 0.5], h: [7, 3, 20, 0.5], gw: [4, 2, 10, 0.5], gh: [4.5, 2.2, 12, 0.25] }, f: { bt: 1, wk: 1, door: 1 }, main: 'len' },
  keep:   { n: 'ตึกใหญ่ (Keep)', c: '#7d7870', p: { w: [14, 5, 40, 1], d: [12, 5, 40, 1], h: [12, 3, 30, 0.5] }, f: { bt: 1, roof: 0, turrets: 1 }, main: 'w' },
  stairs: { n: 'บันได', c: '#8a8478', p: { w: [3, 1, 10, 0.5], len: [8, 2, 30, 0.5], rise: [5, 0.5, 20, 0.25] }, f: {}, main: 'len' },
  ramp:   { n: 'ทางลาด', c: '#8a8478', p: { w: [3, 1, 10, 0.5], len: [10, 2, 40, 0.5], rise: [4, 0.5, 20, 0.25] }, f: {}, main: 'len' },
  walk:   { n: 'ทางเดินยก', c: '#7a7569', p: { w: [3, 1, 10, 0.5], len: [10, 2, 40, 1], up: [6, 0.5, 20, 0.25] }, f: { rail: 1 }, main: 'len' },
  free:   { n: 'ทรงอิสระ (วาดเอง)', c: '#8a8478', p: { h: [6, 0.5, 40, 0.5], tp: [1, 0, 1, 0.05] }, f: {}, main: 'h' },   // pts = footprint polygon (local x,z): drawn in the view, vertices draggable
  bridge: { n: 'สะพาน', c: '#7d7870', p: { w: [4, 2, 12, 0.5], len: [14, 3, 50, 1], up: [3, 0.5, 20, 0.25] }, f: { rail: 1, piers: 1 }, main: 'len' },
};
export const PART_P = { tp: 'หุบยอด (1 ตรง, 0 แหลม)', len: 'ยาว', th: 'หนา', h: 'สูง', a: 'แขน A', b: 'แขน B', r: 'รัศมี/ครึ่งกว้าง', gw: 'ช่องประตู กว้าง', gh: 'ช่องประตู สูง', w: 'กว้าง', d: 'ลึก', rise: 'สูงขึ้น', up: 'สูงจากพื้น' };
export const PART_F = { bt: 'ฟันปลายอดกำแพง', wk: 'ทางเดินบนยอด', door: 'บานประตูไม้ (พังได้)', round: 'ทรงกลม', roof: 'หลังคา (แทนยอดโล่ง)', turrets: 'หอมุมเล็ก', rail: 'ราว', piers: 'เสารองใต้สะพาน' };
export function partNew(k, o = {}) {
  const D = PART[k], p = { k, x: 0, z: 0, rot: 0, base: null, c: D.c, brk: 0 };
  for (const q in D.p) p[q] = D.p[q][0];
  for (const q in D.f) p[q] = D.f[q];
  return Object.assign(p, o);
}
const MERLON = { s: 0.8, h: 0.9, gap: 1.6 }, DOORC = '#6a4a2c', ROOF = '#7a4a36', WTOP = 0.03;   // WTOP: walkway sits a hair above the wall top (no z-fight)
function pctx(M, p, objs, floors) {
  const cs = Math.cos(p.rot || 0), sn = Math.sin(p.rot || 0), g0 = gh(M, p.x, p.z), c = { M, objs, base: p.base != null ? p.base : g0, grounded: p.base == null };
  let n = 0; const W = (lx, lz) => [p.x + lx * cs + lz * sn, p.z - lx * sn + lz * cs];
  // one prim box/cyl/cone/wedge: lx,lz centre (local), w=sx d=sz, y0 = bottom above part base, h = height; ra = extra rotation
  c.solid = (t, lx, lz, w, d, y0, h, o = {}) => {
    const [x, z] = W(lx, lz), sink = c.grounded && y0 === 0 && !o.nosink ? 0.8 : 0, g = gh(M, x, z);
    const it = { id: 'p' + p.id + '_' + (n++), t, x: +x.toFixed(3), z: +z.toFixed(3), y: +(c.base + y0 - g - sink).toFixed(3), rot: +((p.rot || 0) + (o.ra || 0)).toFixed(4), sx: w, sy: h + sink, sz: d, c: o.c || p.c, col: o.col == null ? 1 : o.col, brk: o.brk ? 1 : 0, _p: p.id };
    if (o.hid) it.hid = 1;
    if (o.m) it.m = o.m;
    objs.push(it); return it;
  };
  // big blocks: visible shell (no collision) + a ring of thin hidden strips = exact footprint for the game's circle collision
  c.block = (lx, lz, w, d, y0, h, o = {}) => {
    if (Math.min(w, d) <= 3.2 || p.brk) return c.solid('box', lx, lz, w, d, y0, h, o);
    c.solid('box', lx, lz, w, d, y0, h, Object.assign({}, o, { col: 0 })); const t = 1.6;
    for (const sg of [-1, 1]) { c.solid('box', lx, lz + sg * (d / 2 - t / 2), w, t, y0, h, { hid: 1 }); c.solid('box', lx + sg * (w / 2 - t / 2), lz, t, d - 2 * t, y0, h, { hid: 1 }); }
  };
  c.floor = (lx, lz, w, d, y, y2, th, o = {}) => { const [x, z] = W(lx, lz); floors.push({ id: 'p' + p.id + '_f' + (n++), x: +x.toFixed(3), z: +z.toFixed(3), w, d, rot: +((p.rot || 0) + (o.ra || 0)).toFixed(4), y: +y.toFixed(3), y2: +y2.toFixed(3), th, c: o.c || p.c, steps: o.steps ? 1 : 0, _p: p.id }); };
  // merlons along a line (centre cx,cz; length len; axis ra: 0 = +z, PI/2 = +x), on both edges; skip(lx,lz) filters
  c.cren = (cx, cz, len, th, ra, top, skip) => {
    if (th < 1.2 || len < 1) return;
    const nn = Math.max(1, Math.floor(len / MERLON.gap)), ux = ra ? 1 : 0, uz = ra ? 0 : 1, off = th / 2 - 0.4;
    for (const sg of [-1, 1]) for (let i = 0; i < nn; i++) {
      const t = -len / 2 + (i + 0.5) * len / nn, lx = cx + ux * t + uz * sg * off, lz = cz + uz * t + ux * sg * off;
      if (skip && skip(lx, lz)) continue;
      c.solid('box', lx, lz, MERLON.s, MERLON.s, top, MERLON.h, { col: 0, nosink: 1 });
    }
  };
  c.W = W; return c;
}
const BRK_CHUNK = 4;
// a wall bar along an axis: solid body (chunked when breakable) + merlons + walkway
function bar(c, p, cx, cz, len, ra, skip) {
  const ux = ra ? 1 : 0, uz = ra ? 0 : 1, th = p.th, h = p.h, nn = p.brk ? Math.max(1, Math.round(len / BRK_CHUNK)) : 1;
  for (let i = 0; i < nn; i++) { const t = -len / 2 + (i + 0.5) * len / nn; c.solid('box', cx + ux * t, cz + uz * t, th, len / nn + (nn > 1 ? 0.02 : 0), 0, h, { ra, brk: p.brk }); }
  if (!p.brk) { if (p.bt) c.cren(cx, cz, len, th, ra, h + WTOP, skip); if (p.wk) c.floor(cx, cz, th, len, c.base + h + WTOP, c.base + h + WTOP, 0.3, { ra }); }
}
function stairLike(c, p, steps) {   // floor ramp (y at −len/2 end → y+rise at +len/2) + a visual wedge under it
  if (p.base == null) c.base = gh(c.M, ...c.W(0, -p.len / 2));
  const th = 0.5; c.floor(0, 0, p.w, p.len, c.base, c.base + p.rise, th, { steps });
  c.solid('wedge', 0, 0, p.w, p.len, -th, p.rise, { col: 0, nosink: 1 });
}
function deck(c, p, th, piers) {
  c.floor(0, 0, p.w, p.len, c.base, c.base, th);
  c.solid('box', 0, 0, p.w, p.len, -th, th, { col: 0, nosink: 1 });
  if (p.rail) for (const sg of [-1, 1]) c.solid('box', sg * (p.w / 2 - 0.3), 0, 0.6, p.len, 0.03, 1.0, { nosink: 1 });
  if (piers) for (const sg of [-1, 1]) { const lz = sg * (p.len / 2 - 1.2), [x, z] = c.W(0, lz), gp = gh(c.M, x, z), hh = c.base - th - gp + 0.8; if (hh > 0.2) c.solid('box', 0, lz, p.w, 2.4, gp - 0.8 - c.base, hh, { nosink: 1 }); }
}
const EXP = {
  wall(c, p) { bar(c, p, 0, 0, p.len, 0); },
  corner(c, p) { const th = p.th; bar(c, p, 0, (p.a - th) / 2, p.a, 0, (lx, lz) => lx > 0 && lz < th / 2 + 0.1); bar(c, p, (p.b - th) / 2, 0, p.b, Math.PI / 2, lx => lx < th / 2 + 0.1); },
  tower(c, p) {
    const r = p.r, h = p.h, R = p.round ? 1 : 0;
    if (R) c.solid('cyl', 0, 0, 2 * r, 2 * r, 0, h, { brk: p.brk }); else c.block(0, 0, 2 * r, 2 * r, 0, h, { brk: p.brk });
    if (p.roof) c.solid('cone', 0, 0, 2 * r + 0.8, 2 * r + 0.8, h, Math.max(2, r * 1.2), { col: 0, c: ROOF, nosink: 1 });
    else if (!p.brk) {
      if (p.bt) {
        if (R) { const rr = r - 0.4, nn = Math.max(6, Math.floor(6.2832 * rr / MERLON.gap)); for (let i = 0; i < nn; i++) { const a = i / nn * 6.2832; c.solid('box', rr * Math.sin(a), rr * Math.cos(a), MERLON.s, MERLON.s, h + WTOP, MERLON.h, { ra: a, col: 0, nosink: 1 }); } }
        else { c.cren(0, 0, 2 * r, 2 * r, 0, h + WTOP); c.cren(0, 0, 2 * r - 1.6, 2 * r, Math.PI / 2, h + WTOP); }
      }
      const y = c.base + h + WTOP; if (R) { c.floor(0, 0, 1.94 * r, 1.2 * r, y, y, 0.3); c.floor(0, 0, 1.2 * r, 1.94 * r, y, y, 0.3); } else c.floor(0, 0, 2 * r - 0.2, 2 * r - 0.2, y, y, 0.3);   // round: plus-shaped floor
    }
  },
  gate(c, p) {
    const th = p.th, h = p.h, gw = p.gw, g = Math.min(p.gh, h - 0.5), pl = Math.max(0.5, (p.len - gw) / 2);
    for (const sg of [-1, 1]) c.solid('box', 0, sg * (gw / 2 + pl / 2), th, pl, 0, h, { brk: p.brk });
    c.solid('box', 0, 0, th, gw, g, h - g, { brk: p.brk });   // lintel (collides only above head height: bot > 0.3)
    if (p.door) c.solid('box', 0, 0, 0.6, gw - 0.1, 0, g, { brk: 1, c: DOORC, m: 'wood' });
    if (!p.brk) { if (p.bt) c.cren(0, 0, p.len, th, 0, h + WTOP); if (p.wk) c.floor(0, 0, th, p.len, c.base + h + WTOP, c.base + h + WTOP, 0.3); }
  },
  keep(c, p) {
    const w = p.w, d = p.d, h = p.h;
    c.block(0, 0, w, d, 0, h, { brk: p.brk });
    if (p.roof) c.solid('cone', 0, 0, w + 1.4, d + 1.4, h, Math.max(3, h * 0.45), { col: 0, c: ROOF, nosink: 1 });
    else if (!p.brk) {
      if (p.bt) { c.cren(0, 0, d, w, 0, h + WTOP); c.cren(0, 0, w - 1.6, d, Math.PI / 2, h + WTOP); }
      c.floor(0, 0, w, d, c.base + h + WTOP, c.base + h + WTOP, 0.3);
    }
    if (p.turrets) for (const sx of [-1, 1]) for (const sz of [-1, 1]) { c.solid('cyl', sx * w / 2, sz * d / 2, 3.2, 3.2, 0, h + 3, { brk: p.brk }); c.solid('cone', sx * w / 2, sz * d / 2, 4, 4, h + 3, 2.4, { col: 0, c: ROOF, nosink: 1 }); }
  },
  free(c, p) {   // extruded polygon: visual 'poly' obj (no collision) + inward collision strips along every edge (hollow inside, like blocks)
    const P = p.pts || []; if (P.length < 3) return;
    const sink = c.grounded ? 0.8 : 0, [x, z] = c.W(0, 0), g = gh(c.M, x, z);
    c.objs.push({ id: 'p' + p.id + '_v', t: 'poly', x: +x.toFixed(3), z: +z.toFixed(3), y: +(c.base - g - sink).toFixed(3), rot: p.rot || 0, pts: P, sy: p.h + sink, tp: p.tp == null ? 1 : p.tp, c: p.c, col: 0, brk: 0, _p: p.id });
    let A = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; A += a[0] * b[1] - b[0] * a[1]; }
    const sg = A >= 0 ? 1 : -1;
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < 0.2) continue;
      const nx = -dz / L * sg, nz = dx / L * sg;   // inward normal (rot-aware via local frame)
      c.solid('box', (a[0] + b[0]) / 2 + nx * 0.5, (a[1] + b[1]) / 2 + nz * 0.5, 1.0, L, 0, p.h, { ra: Math.atan2(dx, dz), hid: 1 }); }
  },
  stairs(c, p) { stairLike(c, p, 1); }, ramp(c, p) { stairLike(c, p, 0); },
  walk(c, p) { if (p.base == null) c.base += p.up; deck(c, p, 0.5, 0); },
  bridge(c, p) { if (p.base == null) c.base += p.up; deck(c, p, 0.8, p.piers ? 1 : 0); },
};
export function expandParts(M, list) {   // → {objs, floors} (prim objs + floor slabs generated from parts)
  const objs = [], floors = [];
  for (const p of list || M.parts || []) { const f = EXP[p.k]; if (!f) continue; f(pctx(M, p, objs, floors), p); }
  return { objs, floors };
}
// connection points for snapping: world x,z + top height `y` (absolute) + dy (height above the part's base)
export function partPorts(M, p) {
  const cs = Math.cos(p.rot || 0), sn = Math.sin(p.rot || 0), W = (lx, lz) => [p.x + lx * cs + lz * sn, p.z - lx * sn + lz * cs], out = [];
  let base = p.base != null ? p.base : gh(M, p.x, p.z);
  const add = (lx, lz, dy) => { const [x, z] = W(lx, lz); out.push({ x, z, dy, y: base + dy }); };
  switch (p.k) {
    case 'wall': add(0, -p.len / 2, p.h); add(0, p.len / 2, p.h); add(0, 0, p.h); break;
    case 'corner': add(0, p.a - p.th / 2, p.h); add(p.b - p.th / 2, 0, p.h); add(0, 0, p.h); break;
    case 'tower': add(p.r, 0, p.h); add(-p.r, 0, p.h); add(0, p.r, p.h); add(0, -p.r, p.h); break;
    case 'gate': add(0, -p.len / 2, p.h); add(0, p.len / 2, p.h); break;
    case 'keep': for (const a of [-1, 1]) { add(a * p.w / 2, 0, p.h); add(0, a * p.d / 2, p.h); for (const b of [-1, 1]) add(a * p.w / 2, b * p.d / 2, p.h); } break;
    case 'stairs': case 'ramp': if (p.base == null) base = gh(M, ...W(0, -p.len / 2)); add(0, -p.len / 2, 0); add(0, p.len / 2, p.rise); break;
    case 'walk': case 'bridge': if (p.base == null) base += p.up; add(0, -p.len / 2, 0); add(0, p.len / 2, 0); break;
  }
  return out;
}
// shift p so its nearest port meets a port of another part (within `reach`) → {dx, dz, base} or null
export function snapPart(M, p, reach = 1.6) {
  const mine = partPorts(M, p), best = { d: reach + 1 };
  for (const q of M.parts || []) { if (q.id === p.id) continue; for (const e of partPorts(M, q)) for (const m of mine) { const d = Math.hypot(e.x - m.x, e.z - m.z); if (d < best.d) Object.assign(best, { d, dx: e.x - m.x, dz: e.z - m.z, y: e.y, dy: m.dy, raised: q.base != null }); } }
  if (best.d > reach) return null;
  // level: only stairs/ramps/walkways/bridges (and anything meeting a raised part) take the neighbour's height; walls/towers keep their own base
  const lvl = best.raised || ['stairs', 'ramp', 'walk', 'bridge'].includes(p.k);
  return { dx: best.dx, dz: best.dz, base: lvl ? +(best.y - best.dy).toFixed(3) : undefined };
}
