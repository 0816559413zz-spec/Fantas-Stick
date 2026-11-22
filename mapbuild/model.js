// Map Builder — data model + game export (no three.js here, so node can run it too: tools/mapbuild-test.js)
// Source map (maps/build/<id>.json) → game data (assets/maps/<id>.json, same format the Blender exporter writes: assets/src/maps/map_export.py)
// Units: 1 unit = 1 m in the 3D world = 20 game px. Map coords: x east (0..W), z south (0..H), y up. Game px: X = x*20, Y = z*20.
// Format + rules: guides/MAP-BUILDER.md

import { bdPack, bdUnpack, bdShift } from './backdrop.js';
export const C = 0.5, PX = 20, NONE = -32768;   // height grid spacing (units) — the game’s collision grid uses the same 0.5
export const HMIN = -8, HMAX = 40;
export const TSLOPE = 1.6, TSTEP = 1.1, HEADROOM = 2.8, PR = 0.9;   // game rules (js/05-terrain.js, guides/MAP-DESIGN.md §4) — keep in sync

// surfaces: painted per grid point. env = gameplay surface kind written to the game’s "env" masks (MAP-DESIGN §8)
export const SURF = [
  { k: 'grass', n: 'Grass', c: '#4f8a38' }, { k: 'grass2', n: 'Dark Grass', c: '#35642c' }, { k: 'dry', n: 'Dry Grass', c: '#8f8d48' },
  { k: 'dirt', n: 'Dirt', c: '#7a5c3c' }, { k: 'path', n: 'Packed Path', c: '#a08a62' }, { k: 'rock', n: 'Rock/Gravel', c: '#77736c' },
  { k: 'pave', n: 'Paved Stone', c: '#9c978e' }, { k: 'dark', n: 'Dark Rock', c: '#4a4a52' }, { k: 'sand', n: 'Sand', c: '#cdb97c' },
  { k: 'snow', n: 'Snow', c: '#e4eaf0' }, { k: 'wood', n: 'Wood Floor', c: '#8a6238' }, { k: 'ash', n: 'Ash/Burnt', c: '#2f2c2a' },
  { k: 'mud', n: 'Mud (slow)', c: '#57452f', env: 'mud' }, { k: 'water', n: 'Shallow Water', c: '#3f7fa8', env: 'water' },
  { k: 'ice', n: 'Ice (slippery)', c: '#a9d4e8', env: 'ice' }, { k: 'lava', n: 'Lava', c: '#d8521e', env: 'lava' },
  // เพิ่มท้ายตาราง (ห้ามแทรกกลาง — ดัชนีถูกเก็บในไฟล์แผนที่) • โทนจางสำหรับป่าหมอก (แมพ gorge)
  { k: 'moss', n: 'Moss', c: '#575837' }, { k: 'litter', n: 'Leaf Litter/Forest Soil', c: '#5d4a34' }, { k: 'gravel', n: 'Pebbles', c: '#7a7569' }, { k: 'duff', n: 'Pine Needles', c: '#4b4332' }, { k: 'trail', n: 'Forest Path (dark dirt)', c: '#6f5b44' },
];
export const WALL_PRESET = [
  { n: 'Stone Wall', th: 1, h: 3.5, c: '#8a8478', m: 'stone' }, { n: 'Castle Wall', th: 2, h: 6, c: '#77736c', m: 'stone' },
  { n: 'Low Wall/Cover', th: 0.8, h: 1.2, c: '#8a8478', m: 'stone' }, { n: 'Brick Wall', th: 0.7, h: 3.2, c: '#8c5a48', m: 'stone' },
  { n: 'Wood Wall', th: 0.5, h: 3, c: '#7a5a3a', m: 'wood' }, { n: 'Wood Fence', th: 0.4, h: 1.1, c: '#8a6a44', m: 'wood' },
  { n: 'Trimmed Hedge', th: 1.2, h: 1.8, c: '#3f6a34', m: 'wood' }, { n: 'Ice Wall', th: 1, h: 3, c: '#bfe0ee', m: 'ice' },
];
export const FLOOR_PRESET = [
  { n: 'Stone Platform', w: 8, d: 8, th: 0.5, c: '#8a8478' }, { n: 'Stone Bridge', w: 4, d: 14, th: 0.6, c: '#7d7870' }, { n: 'Wood Bridge', w: 3, d: 12, th: 0.35, c: '#7a5a3a' },
  { n: 'Ramp', w: 4, d: 8, th: 0.4, c: '#8a8478', ramp: 1 }, { n: 'Stairs', w: 4, d: 7, th: 0.4, c: '#8a8478', ramp: 1, steps: 1 }, { n: 'Balcony', w: 12, d: 4, th: 0.4, c: '#7a5a3a' },
];
// built-in object types (kit assets are 'kit:<id>' and come from assets/mapkit/kit.json)
export const OBJ = {
  spawn: { n: 'Spawn Point', cat: 'sys', c: '#4a8cff', note: 'FFA / Duel / Co-op (6+ recommended)' },
  spawnR: { n: 'Red Team Spawn', cat: 'sys', c: '#f06a6a' }, spawnB: { n: 'Blue Team Spawn', cat: 'sys', c: '#5aa0ff' },
  espawn: { n: 'Monster Spawn', cat: 'sys', c: '#c77dff', note: 'Co-op' },
  ring: { n: 'Broom Race Ring', cat: 'sys', c: '#f2d45e', note: 'ordered as placed (10 rings)' }, task: { n: 'Task Point', cat: 'sys', c: '#6fcf97', note: 'Find Voldemort mode (6–8)' },
  light: { n: 'Light', cat: 'sys', c: '#ffb060', note: '12 max' },
  pcrate: { n: 'Wood Crate', cat: 'game', c: '#a07a46', r: 0.9, h: 1.4 }, pbarrel: { n: 'Wood Barrel', cat: 'game', c: '#8a5a32', r: 0.75, h: 1.6 },
  pchest: { n: 'Treasure Chest', cat: 'game', c: '#e8c060', r: 0.9, h: 1.0, note: '2 max' },
  ptree: { n: 'Oak Tree (breakable)', cat: 'game', c: '#4f8f3c', r: 1.1, h: 7.5 }, ppine: { n: 'Pine Tree (breakable)', cat: 'game', c: '#2f6a30', r: 1.0, h: 7 },
  house: { n: 'Breakable House', cat: 'game', c: '#b08a5a', note: 'needs flat ground' },
  pn_wall: { n: 'Breakable Panel (wall)', cat: 'game', c: '#c0703c', note: 'split into cells, HP per cell • same group = hold each other up (guides/Destruction.md §13)' },
  poly: { n: 'Free Shape', cat: 'hid' },
  // collision shapes: placed as an invisible box/cylinder primitive (vis 0, collider on) — collision only, nothing drawn in the game
  col_box: { n: 'Collision Box', cat: 'collide', c: '#ff5a5a', note: 'Invisible in the game, blocks players/spells • size in the Inspector (or the R/T gizmo)' }, col_cyl: { n: 'Collision Cylinder', cat: 'collide', c: '#ff5a5a', note: 'Invisible in the game, blocks players/spells (round footprint)' },
  box: { n: 'Box', cat: 'prim' }, cyl: { n: 'Cylinder', cat: 'prim' }, cone: { n: 'Cone/Roof', cat: 'prim' }, ball: { n: 'Sphere', cat: 'prim' }, wedge: { n: 'Wedge', cat: 'prim' },
  // siege mode markers (guides/MAP-STANDARD.md) — exported as data.siege, the game builds collision/visuals itself
  core: { n: 'Core (anchor)', cat: 'mode', c: '#7fd8ff', note: 'number 1–N = order to destroy' },
  sgA: { n: 'Attacker Spawn (per phase)', cat: 'mode', c: '#f0a04a', note: '1 per phase (the game puts 6 players around it)' },
  sgB: { n: 'Defender Spawn (per phase)', cat: 'mode', c: '#5aa0ff', note: '1 per phase' },
  phase: { n: 'Phase Play Area', cat: 'mode', c: '#f2d45e', note: 'rectangle (no rotation) • several per phase allowed' },
  // room helpers
  ceil: { n: 'Ceiling', cat: 'room', c: '#c77dff', note: 'keeps players/fliers/camera below the ceiling • roofed rooms ≥ 20 high' },
  lz: { n: 'Indoor Light Zone', cat: 'room', c: '#7fb0ff', note: 'camera inside = dim cool indoor light • glass / lit windows inside get sun beams • Height Above Ground = roof (camera above it = outdoor)' },
};
// breakable room props — mirror of RPK in js/02-fcs-rooms.js (keep in sync) • col = collision radius px (0 = walk through), h m
// L = has a length (tables, benches, rails) • w = editor proxy width (m) • look is drawn by the game (js/28-fcs-props.js frpBuild)
export const RPK = {
  table: { n: 'Long Table', col: 20, h: 1.0, L: 1, w: 1.6 }, hightable: { n: 'High Table', col: 22, h: 1.1, L: 1, w: 1.8 }, bench: { n: 'Long Bench', col: 0, h: 0.5, L: 1, w: 0.5 },
  chair: { n: 'Chair', col: 0, h: 1.05, w: 0.6 }, throne: { n: 'Throne', col: 16, h: 2.2, w: 1.4 }, crate: { n: 'Crate', col: 22, h: 1.2, w: 1.4 }, crate2: { n: 'Crate Stack', col: 22, h: 2.35, w: 1.4 },
  barrel: { n: 'Barrel', col: 16, h: 1.3, w: 1.1 }, barrels: { n: 'Barrel Pile', col: 30, h: 1.3, w: 2.4 }, sack: { n: 'Sack', col: 0, h: 0.6, w: 0.8 }, rack: { n: 'Weapon Rack', col: 0, h: 2.0, w: 1.6 },
  armor: { n: 'Armor Stand', col: 14, h: 2.1, w: 0.9 }, shelf: { n: 'Bookshelf', col: 0, h: 3.0, w: 2.0 }, desk: { n: 'Desk', col: 0, h: 0.9, w: 1.4 },
  candle: { n: 'Candle Stand', col: 0, h: 2.2, w: 0.5 }, woodpile: { n: 'Firewood Pile', col: 0, h: 0.8, w: 1.6 }, cart: { n: 'Cart', col: 30, h: 1.6, w: 2.6 }, keg: { n: 'Small Barrel', col: 0, h: 0.7, w: 0.7 },
  rail: { n: 'Railing', col: 9, h: 1.1, L: 1, w: 0.5 }, pillar: { n: 'Big Pillar', col: 26, h: 24, w: 2.6 },
};
for (const k in RPK) OBJ['rp_' + k] = { n: RPK[k].n, cat: 'room', c: '#a07a56', rp: k };
export const isRP = t => t.startsWith('rp_');
// decor drawn by the game (MAP-STANDARD round 4): the same builder the code rooms use (js/28-fcs-castle.js fcsDecoKit) — no collision,
// not in the .glb. k = material key: stone/dark (castle ashlar), roof, lit (glowing window), wood, iron, carpet, slit (dark opening)
// y = lift of the shape centre above the ground (roof/cloth: base/top) • rot = yaw (roof ridge, cloth/shield facing)
export const DECO_MAT = [['stone', 'castle stone'], ['dark', 'Dark Rock'], ['roof', 'Roof'], ['lit', 'Lit Window'], ['wood', 'Wood'], ['iron', 'Metal'], ['carpet', 'Red Carpet'], ['slit', 'Dark Opening'], ['floor', 'Castle Floor Stone'], ['roof2', 'Red Roof (castle)'], ['lit2', 'Bright Lit Window (castle)']];
export const DECO_COL = { stone: '#c2b298', dark: '#8f8270', roof: '#5d6470', lit: '#ffc77a', wood: '#5a3f28', iron: '#2b2a2a', carpet: '#7a1a20', slit: '#17120e', floor: '#b4a68e', roof2: '#8c4a32', lit2: '#ffb15a' };
Object.assign(OBJ, {
  dc_box: { n: 'Decor Box', cat: 'deco', c: '#c2b298' }, dc_cyl: { n: 'Decor Cylinder', cat: 'deco', c: '#c2b298' }, dc_cone: { n: 'Cone/Spire', cat: 'deco', c: '#5d6470' },
  dc_roof: { n: 'Gable Roof', cat: 'deco', c: '#5d6470' }, dc_flame: { n: 'Flame (torch/candle)', cat: 'deco', c: '#ffb060' }, dc_cloth: { n: 'Hanging Cloth/Banner', cat: 'deco', c: '#7a1418' },
  dc_shield: { n: 'Wall Shield', cat: 'deco', c: '#7a1a20' }, dc_chand: { n: 'Chandelier (lit)', cat: 'deco', c: '#ffb36a' },
  dc_banner: { n: 'Castle Wall Banner', cat: 'deco', c: '#9a1c20' }, dc_torch: { n: 'Wall Torch', cat: 'deco', c: '#ffb060' },
  dc_flag: { n: 'Tower Flag', cat: 'deco', c: '#9a1c20' }, dc_post: { n: 'Flame on Pole', cat: 'deco', c: '#ffb060' },
});
export const isDeco = t => t.startsWith('dc_');
// game systems bound by tag, not by map name (MAP-STANDARD §1.7)
export const SYS_WALL = [['', '(none)'], ['fence', 'Burnable Fence'], ['stonewall', 'Stone Wall (cracks/burns)']];
export const SYS_FLOOR = [['', '(none)'], ['eggshell', 'Eggshell Break (bridge)']];
export const SG_WALL = [['', '(no)'], ['wall', 'Target Wall'], ['gate', 'Target Gate']];
// look presets drawn by game code (MAP-STANDARD §1.5) — map default + per wall/floor/part override
export const STYLE = [['', '(normal)'], ['castle-stone', 'Stone Castle'], ['room-hall', 'Castle Hall'], ['forest-mist', 'Misty Pine Forest']];
export const MODES = [['coop', 'Co-op'], ['ffa', 'FFA'], ['duel', 'Duel'], ['tdm', 'Team'], ['br', 'Battle Royale'], ['race', 'Broom Race'], ['imp', 'Find Voldemort'], ['siege', 'Siege']];
export const SKY = [['day', 'Day'], ['sunset', 'Evening'], ['night', 'Night'], ['indoor', 'Indoor']];
export const FXS = [['snow', 'Snowfall'], ['fireflies', 'Fireflies'], ['candles', 'Floating Candles'], ['snitch', 'Snitch'], ['rune', 'Magic Circle in the Centre']];
export const MUSIC = ['', 'castle', 'meadow', 'forest', 'hogsmeade', 'lake', 'ruins', 'greathall', 'pitch'];

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

// ---------- create / pack ----------
export function newMap(o = {}) {
  const W = o.W || 100, H = o.H || 70, nx = Math.round(W / C) + 1, ny = Math.round(H / C) + 1;
  return { v: 1, id: o.id || '', name: o.name || 'New Map', desc: '', W, H, nx, ny, hg: new Float32Array(nx * ny), sf: new Uint8Array(nx * ny).fill(o.surf || 0),
    sky: 'day', fog: null, music: '', weather: '', fx: [], modes: ['coop', 'ffa', 'duel', 'tdm'], random: 0, autoProps: 1, skirt: 40,
    walls: [], floors: [], objs: [], parts: [], rooms: [], seq: 1 };
}
const b64e = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const b64d = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
export const i16b64 = a => b64e(new Uint8Array(a.buffer, a.byteOffset, a.byteLength));
export function pack(M) {   // → plain JSON object (heights as int16 cm, base64)
  const h = new Int16Array(M.hg.length); for (let i = 0; i < h.length; i++) h[i] = Math.round(M.hg[i] * 100);
  const o = Object.assign({}, M, { hg: i16b64(h), sf: b64e(M.sf) }); if (M.bd) o.bd = bdPack(M.bd); else delete o.bd; return o;
}
export function unpack(j) {
  const M = Object.assign(newMap({ W: j.W, H: j.H }), j);
  M.nx = Math.round(M.W / C) + 1; M.ny = Math.round(M.H / C) + 1;
  const n = M.nx * M.ny, hb = b64d(j.hg), h = new Int16Array(hb.buffer, 0, hb.length >> 1);
  M.hg = new Float32Array(n); for (let i = 0; i < n && i < h.length; i++) M.hg[i] = h[i] / 100;
  const s = b64d(j.sf); M.sf = new Uint8Array(n); M.sf.set(s.subarray(0, n));
  for (const k of ['walls', 'floors', 'objs', 'fx', 'parts', 'rooms']) if (!Array.isArray(M[k])) M[k] = [];
  M.bd = j.bd ? bdUnpack(j.bd) : null;   // backdrop (mapbuild/backdrop.js)
  return M;
}
export function resize(M, W, H) {   // keep the content centred
  const N = newMap({ W, H }), ox = Math.round((N.nx - M.nx) / 2), oy = Math.round((N.ny - M.ny) / 2);
  for (let j = 0; j < N.ny; j++) for (let i = 0; i < N.nx; i++) {
    const si = clamp(i - ox, 0, M.nx - 1), sj = clamp(j - oy, 0, M.ny - 1);
    N.hg[j * N.nx + i] = M.hg[sj * M.nx + si]; N.sf[j * N.nx + i] = M.sf[sj * M.nx + si];
  }
  const dx = ox * C, dz = oy * C; bdShift(M.bd, dx, dz);
  for (const w of M.walls) for (const p of w.pts) { p[0] += dx; p[1] += dz; }
  for (const o of M.floors.concat(M.objs, M.parts || [])) { o.x += dx; o.z += dz; }
  Object.assign(M, { W, H, nx: N.nx, ny: N.ny, hg: N.hg, sf: N.sf });
}

// ---------- terrain ----------
export function gh(M, x, z) {   // ground height, bilinear (same maths as the game’s terrT)
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
// ---- breakable panels (pn_wall → data.pnl, game js/12-pnl.js) ----
export const PN_MAT = [['brick', 'Brick'], ['plaster', 'Plaster (brick inside)'], ['stone', 'Rocks'], ['wood', 'Wood (burns)'], ['glass', 'Glass'], ['metal', 'Metal'],
  ['timber', 'Plaster + Timber Frame'], ['roof', 'Tile Roof'], ['snowroof', 'Snow Roof'], ['litwin', 'Lit Window (glass)']];
export const PN_HP = { brick: 60, plaster: 50, stone: 90, wood: 35, glass: 12, metal: 120, roof: 40, snowroof: 40, timber: 45, litwin: 10 };   // mirror PNDEF.mat in js/12-pnl.js
export const PN_COL = { brick: '#b0603c', plaster: '#cfc6b4', stone: '#9a9488', wood: '#8a6440', glass: '#bfe4f0', metal: '#7c8288', roof: '#4a4e58', snowroof: '#e8eef4', timber: '#d8ccb4', litwin: '#ffcf80' };
export const PN_MODE = [['p', 'Holes + Rubble'], ['pn', 'Holes, No Rubble'], ['l', 'Peels in Layers'], ['g', 'Whole Panel']];   // pn → game m:'p' + np:1
export const PN_PRESET = [
  { n: 'Brick Wall', mat: 'brick', m: 'p', sy: 3.6, T: 0.3, cs: 0.6 }, { n: 'Plaster Wall', mat: 'plaster', m: 'l', sy: 3.6, T: 0.3, cs: 0.5 },
  { n: 'Stone Wall (no break-through)', mat: 'stone', m: 'l', thru: 0, sy: 2.5, T: 0.5, cs: 0.8 }, { n: 'Fence / Wood Wall', mat: 'wood', m: 'p', sy: 2.2, T: 0.15, cs: 0.5 },
  { n: 'Glass', mat: 'glass', m: 'g', sy: 1.8, T: 0.1, cs: 1, y: 1 }, { n: 'Metal Sheet', mat: 'metal', m: 'p', sy: 3, T: 0.1, cs: 1 }];
export function pnDims(o) { const L = o.L || 4, H = o.sy || 3, cs = o.cs || 1; return { L, H, T: o.T || 0.3, cs, nc: Math.max(1, Math.round(L / cs)), nr: Math.max(1, Math.round(H / cs)) }; }
// panel frame in map coords [x, up, z]: U along the length, W up the slab, V slab normal (same as js/12-pnl.js, editor rot = −game a)
export function pnFrame(M, o) {
  const r = o.rot || 0, tl = o.tl || 0, ct = Math.cos(tl), st = Math.sin(tl), U = [Math.cos(r), 0, -Math.sin(r)], N0 = [Math.sin(r), 0, Math.cos(r)];
  return { U, W: [st * N0[0], ct, st * N0[2]], V: [ct * N0[0], -st, ct * N0[2]], B: [o.x, gh(M, o.x, o.z) + (o.y || 0), o.z] };
}
// cell exists (gable triangle / openings) — mirror of pnlGen ex
export function pnExists(o, d, k) {
  const col = k % d.nc, r = (k / d.nc) | 0, cw = d.L / d.nc, ch = d.H / d.nr, u = -d.L / 2 + (col + 0.5) * cw, z = (r + 0.5) * ch;
  if (o.sh === 'tri' && z > d.H * (1 - Math.abs(u) / (d.L / 2)) + ch * 0.25) return false;
  if (o.ho && o.ho.some(q => u + d.L / 2 > q[0] && u + d.L / 2 < q[1] && z > q[2] && z < q[3])) return false;
  return true;
}
// support graph, same rules as the game (pnlLinks): 4-way inside a panel + same-group cells whose centres are close (3D); grounded = bottom row on the ground
export function pnGraph(M, objs) {
  const ps = objs.filter(o => o.t === 'pn_wall').map(o => Object.assign({ o, F: pnFrame(M, o) }, pnDims(o)));
  let n = 0; for (const p of ps) { p.base = n; n += p.nc * p.nr; }
  const nb = Array.from({ length: n }, () => []), gr = new Uint8Array(n), ex = new Uint8Array(n), C = new Float32Array(n * 3), cells = [];
  for (const p of ps) { const { U, W, B } = p.F, cw = p.L / p.nc, ch = p.H / p.nr; p.cw = cw; p.ch = ch;
    for (let k = 0; k < p.nc * p.nr; k++) { const col = k % p.nc, r = (k / p.nc) | 0, id = p.base + k, u = -p.L / 2 + (col + 0.5) * cw, w = (r + 0.5) * ch; cells.push([p, k]);
      for (let a = 0; a < 3; a++) C[id * 3 + a] = B[a] + U[a] * u + W[a] * w;
      if (!pnExists(p.o, p, k)) continue; ex[id] = 1;
      if (r === 0 && B[1] - gh(M, C[id * 3], C[id * 3 + 2]) < 0.35) gr[id] = 1; } }
  for (const p of ps) for (let k = 0; k < p.nc * p.nr; k++) { const id = p.base + k, col = k % p.nc, r = (k / p.nc) | 0; if (!ex[id]) continue;
    if (col > 0 && ex[id - 1]) nb[id].push(id - 1); if (col < p.nc - 1 && ex[id + 1]) nb[id].push(id + 1); if (r > 0 && ex[id - p.nc]) nb[id].push(id - p.nc); if (r < p.nr - 1 && ex[id + p.nc]) nb[id].push(id + p.nc); }
  const grp = o => o.g != null && o.g !== '' ? 'g' + o.g : null;
  for (let a = 0; a < ps.length; a++) for (let b = a + 1; b < ps.length; b++) { const A = ps[a], B = ps[b]; if (!grp(A.o) || grp(A.o) !== grp(B.o)) continue;
    if (Math.hypot(A.o.x - B.o.x, A.o.z - B.o.z) > (A.L + B.L) / 2 + A.H + B.H + 1) continue;
    const lim = (Math.max(A.cw, A.ch) + Math.max(B.cw, B.ch)) / 2 + (A.T + B.T) / 2 + 0.2;
    for (let i = A.base; i < A.base + A.nc * A.nr; i++) { if (!ex[i]) continue;
      for (let j = B.base; j < B.base + B.nc * B.nr; j++) { if (!ex[j]) continue; const dx = C[i * 3] - C[j * 3], dy = C[i * 3 + 1] - C[j * 3 + 1], dz = C[i * 3 + 2] - C[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < lim * lim) { nb[i].push(j); nb[j].push(i); } } } }
  return { ps, n, nb, gr, ex, C, cells };
}
// cells still held up when `broken` (Set of global cell ids) are gone → {seen: 1 = stands, dead}. 'g' panels: one broken cell = whole panel gone
export function pnSupported(G, broken) {
  const dead = new Uint8Array(G.n); for (const i of broken) dead[i] = 1; for (let i = 0; i < G.n; i++) if (!G.ex[i]) dead[i] = 0;
  for (const p of G.ps) if ((p.o.m || 'p') === 'g') { let any = false; for (let k = 0; k < p.nc * p.nr; k++) if (dead[p.base + k]) any = true; if (any) for (let k = 0; k < p.nc * p.nr; k++) if (G.ex[p.base + k]) dead[p.base + k] = 1; }
  const seen = new Uint8Array(G.n), q = [];
  for (let i = 0; i < G.n; i++) if (G.gr[i] && !dead[i]) { seen[i] = 1; q.push(i); }
  while (q.length) { const i = q.pop(); for (const j of G.nb[i]) if (!seen[j] && !dead[j]) { seen[j] = 1; q.push(j); } }
  for (let i = 0; i < G.n; i++) if (!G.ex[i]) seen[i] = 1;
  return { seen, dead };
}
// door / window opening in the middle of a panel → hole [u0,u1,z0,z1] (m from the left end) or null
export function pnOpening(o, kind) {
  const { L, H } = pnDims(o), w = Math.min(kind === 'door' ? 1.4 : 1.2, L - 0.6), sill = kind === 'door' ? 0 : Math.min(1, H - 0.6), top = Math.min(H - 0.3, kind === 'door' ? 2.4 : sill + 1.2);
  if (w < 0.6 || top <= sill + 0.3 || (o.ho || []).length >= 4) return null;
  return [+(L / 2 - w / 2).toFixed(3), +(L / 2 + w / 2).toFixed(3), +sill.toFixed(3), +top.toFixed(3)];
}
export function pnNewGroup(M) { const used = new Set(M.objs.filter(o => o.t === 'pn_wall' && o.g != null).map(o => String(o.g))); let i = 1; while (used.has('G' + i)) i++; return 'G' + i; }
// old breakable house (obj 'house') → panel objects. Mirror of js/12-pnl.js pnHouse (same sizes) — keep the two in step.
export const PN_HOUSE = { wh: 4.2, rh: 3.4, ov: 0.45, T: 0.3, cs: 0.7, rcs: 0.8, door: { w: 2.2, h: 2.7 }, win: { w: 1.2, h: 1.2, sill: 1.1 } };
export function pnHouseObjs(M, o, gid, ldn) {
  const H = PN_HOUSE, w = 8 * (o.sx || 1), d = 6.5 * (o.sz || 1), ry = o.rot || 0, c = Math.cos(ry), s = Math.sin(ry), hb = gh(M, o.x, o.z), out = [];
  const wall = ldn ? { mat: 'brick', m: 'p' } : { mat: 'plaster', m: 'l' }, roof = { mat: ldn ? 'roof' : 'snowroof', m: 'p' }, nb = o.brk === 0 ? { nb: 1 } : {};
  const Wp = (lx, ly) => [o.x + lx * c + ly * s, o.z - lx * s + ly * c], f3 = v => +v.toFixed(3);
  const put = (lx, ly, rot, L, z0, Hh, x) => { const [px, pz] = Wp(lx, ly); out.push(Object.assign({ t: 'pn_wall', x: f3(px), z: f3(pz), y: f3(hb + z0 - gh(M, px, pz)), rot: f3(rot), L: f3(L), sy: f3(Hh), T: H.T, cs: H.cs, g: gid }, wall, nb, x || {})); };
  const rX = ry, rY = -Math.atan2(c, s);
  const holed = (lx, ly, rot, ux, uy, L, holes) => { const at = u => [lx + ux * (u - L / 2), ly + uy * (u - L / 2)]; put(lx, ly, rot, L, 0, H.wh, { ho: holes.map(q => q.slice(0, 4).map(f3)) });
    for (const [u0, u1, z0, z1, glass] of holes) if (glass) { const [a, b] = at((u0 + u1) / 2); put(a, b, rot, u1 - u0 + 0.1, z0 - 0.05, z1 - z0 + 0.1, { mat: 'litwin', m: 'g', T: 0.1, cs: 9 }); } };
  const Wn = H.win, win = u => [u - Wn.w / 2, u + Wn.w / 2, Wn.sill, Wn.sill + Wn.h, 1], Lf = w + H.T;
  holed(0, d / 2, rX, 1, 0, Lf, [win(Lf * 0.22), [Lf / 2 - H.door.w / 2, Lf / 2 + H.door.w / 2, 0, H.door.h, 0], win(Lf * 0.78)]);
  holed(0, -d / 2, rX, 1, 0, Lf, [win(Lf * 0.3), win(Lf * 0.7)]);
  for (const sx of [-1, 1]) holed(sx * w / 2, 0, rY, 0, 1, d - H.T, [win((d - H.T) / 2)]);
  for (const sy of [-1, 1]) put(0, sy * d / 2, rX, Lf, H.wh, H.rh, { sh: 'tri' });
  const run = w / 2 + H.ov, rise = H.rh + H.ov * H.rh / (w / 2), len = Math.hypot(run, rise), tl = Math.atan2(run, rise);
  for (const sx of [-1, 1]) { const [px, pz] = Wp(sx * (w / 2 + H.ov), 0);
    out.push(Object.assign({ t: 'pn_wall', x: f3(px), z: f3(pz), y: f3(hb + H.wh - H.ov * H.rh / (w / 2) - gh(M, px, pz)), rot: f3(rY), L: f3(d + 2 * H.ov), sy: f3(len), T: 0.25, tl: f3(sx < 0 ? -tl : tl), cs: H.rcs, g: gid }, roof, nb)); }
  return out;
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

// Capsule colliders: consecutive circles of a straight run (same r / height / group, collinear, touching) → one obs with
// x,y = centre, hx,hy = half axis (px), r = radius. The game measures distance to the axis (obsD2, js/12-buildings).
// Fences (fcf: burn per section), floating pieces of other kinds and tagged colliders stay circles.
const CAP_KEYS = new Set(['x', 'y', 'r', 'hgt', 'k', 'bot', 'b']);
function mergeCaps(obs) {
  const out = [], same = (a, b) => a.k === b.k && a.r === b.r && a.b === b.b && Math.abs(a.hgt - b.hgt) < 0.25 && (a.bot == null) === (b.bot == null) && (a.bot == null || Math.abs(a.bot - b.bot) < 0.25);
  let run = null;   // {a: first circle, e: last circle, L: [circles]}
  const flush = () => { if (!run) return; const L = run.L, a = L[0], e = L[L.length - 1];
    if (L.length < 3) { out.push(...L); run = null; return; }
    const o = Object.assign({}, a, { x: r1((a.x + e.x) / 2), y: r1((a.y + e.y) / 2), hx: r1((e.x - a.x) / 2), hy: r1((e.y - a.y) / 2), hgt: Math.max(...L.map(q => q.hgt)) });
    if (a.bot != null) o.bot = Math.min(...L.map(q => q.bot)); out.push(o); run = null; };
  for (const c of obs) {
    const ok = c.k !== 'fcf' && Object.keys(c).every(k => CAP_KEYS.has(k));
    if (!ok) { flush(); out.push(c); continue; }
    if (run) { const a = run.L[0], e = run.L[run.L.length - 1], dx = c.x - e.x, dy = c.y - e.y, d = Math.hypot(dx, dy);
      let line = d > 0.5 && d <= c.r * 2.3 && same(a, c);   // wall chains ≈ r·1.15 apart, box chains ≈ r·2.1
      if (line && run.L.length > 1) { const ux = e.x - a.x, uy = e.y - a.y, ul = Math.hypot(ux, uy) || 1; line = Math.abs((c.x - a.x) * uy - (c.y - a.y) * ux) / ul < Math.max(1, c.r * 0.08) && (dx * ux + dy * uy) > 0; }
      if (line) { run.L.push(c); continue; }
      flush(); }
    run = { L: [c] };
  }
  flush(); obs.length = 0; obs.push(...out);
}
export const capD2 = (q, x, y) => { const hx = q.hx || 0, hy = q.hy || 0, l = hx * hx + hy * hy, t = l ? clamp(((x - q.x) * hx + (y - q.y) * hy) / l, -1, 1) : 0; return (x - q.x - hx * t) ** 2 + (y - q.y - hy * t) ** 2; };

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
  const k = (o.cs == null ? d.cs || 1 : o.cs), ex = d.ex * k, ez = d.ez * k, g = gh(M, o.x, o.z), lift = (o.y || 0) + (d.yo || 0), top = g + lift + d.h, out = [];
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
    for (let j = 0; j < fy; j++) for (let i = 0; i < fx; i++) { const t = floorTop(f, x0 + i * C, z0 + j * C); top[j * fx + i] = cm(t); bot[j * fx + i] = cm(Math.min(t - (f.th || 0.4), f.yb != null ? f.yb : Infinity)); if (t === t) any++; }
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
  // floors that are solid underneath (sol 1, or auto = a ramp/stair starting at the ground): collision circles below the slab, tops just under the
  // walking surface so feet on the ramp never touch them; parts lower than a step are left out (you walk onto the ramp there). k:'flr' = bots path over it.
  for (const f of allFloors) {
    const ramp = f.y2 != null && f.y2 !== f.y; if (!(f.sol === 1 || (f.sol == null && ramp && Math.min(f.y, f.y2) - gh(M, f.x, f.z) < 0.6))) continue;
    const r = clamp(Math.min(f.w, f.d) / 4, 0.5, 1), cs = Math.cos(f.rot || 0), sn = Math.sin(f.rot || 0), ln = (L, i, n) => n < 2 ? 0 : -L / 2 + r + (L - 2 * r) * i / (n - 1);
    const na = Math.max(1, Math.ceil((f.w - 2 * r) / (r * 1.4)) + 1), nb = Math.max(1, Math.ceil((f.d - 2 * r) / (r * 1.4)) + 1);
    for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) { const a = ln(f.w, i, na), b = ln(f.d, j, nb), x = f.x + a * cs + b * sn, z = f.z - a * sn + b * cs;
      let top = Infinity; for (const [ox, oz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) { const t = floorTop(f, x + ox, z + oz); if (t === t && t < top) top = t; }
      const g = gh(M, x, z), h = top - 0.15 - g; if (h === h && h < 1e9 && h > TSTEP) put({ x, z, r, hgt: h }, null, { k: 'flr' }); }
  }
  const spawns = [], espawn = [], rings = [], tasks = [], props = [], houses = [], lights = [];
  const sg = { cores: [], sp: { A: {}, B: {} }, phases: [], bw: [] }, ceil = [], lz = [], rprops = [], deco = [], pnl = [];
  const rect = o => { const w = (o.sx || 1) * PX, d = (o.sz || 1) * PX; return { x0: r1(o.x * PX - w / 2), y0: r1(o.z * PX - d / 2), x1: r1(o.x * PX + w / 2), y1: r1(o.z * PX + d / 2) }; };
  for (const o of allObjs) {
    const X = r1(o.x * PX), Y = r1(o.z * PX), rot = o.rot || 0;
    if (o.t === 'core') sg.cores.push({ n: o.n || sg.cores.length + 1, x: X, y: Y, s: r1((o.s || 4) * PX) });
    else if (o.t === 'sgA' || o.t === 'sgB') sg.sp[o.t === 'sgA' ? 'A' : 'B'][o.ph || 1] = { x: X, y: Y };
    else if (o.t === 'phase') { const q = rect(o), k = (o.ph || 1) - 1; (sg.phases[k] = sg.phases[k] || []).push({ x1: q.x0, y1: q.y0, x2: q.x1, y2: q.y1 }); }
    else if (o.t === 'lz') lz.push(Object.assign(rect(o), { top: r2(o.y == null ? 22 : o.y), k: r2(o.k == null ? 1 : o.k) }));   // indoor light zone (js/28-fcs-hall.js)
    else if (o.t === 'ceil') ceil.push(Object.assign(rect(o), { h: r2(o.y == null ? 21 : o.y) }, o.zmax != null ? { zmax: r2(o.zmax) } : {}));
    else if (isDeco(o.t)) { deco.push(Object.assign({ t: o.t.slice(3), x: X, y: Y, h: r2(o.y || 0) }, ...['k', 'sx', 'sy', 'sz', 'rt', 'rb', 'r', 'seg', 's', 'c', 'open', 'ry', 'ssx', 'ssz'].filter(q => o[q] != null).map(q => ({ [q]: o[q] })), rot ? { a: +rot.toFixed(4) } : {}));
    if (isDeco(o.t) && o.col) { const d = dim(o); if (d && d.col) for (const c of objCircles(M, o, d)) put(c, null); } }   // decor box/cylinder with Collides ticked
    else if (isRP(o.t)) rprops.push(Object.assign({ k: o.t.slice(3), x: X, y: Y, a: +(-rot).toFixed(3) }, o.L ? { L: r1(o.L * PX) } : {}, o.y ? { z0: r2(o.y) } : {}));
    else if (o.t === 'spawn' || o.t === 'spawnR' || o.t === 'spawnB') { const s = { x: X, y: Y, a: +Math.atan2(Math.cos(rot), Math.sin(rot)).toFixed(3) }; if (o.t !== 'spawn') s.t = o.t === 'spawnR' ? 1 : 0; spawns.push(s); }
    else if (o.t === 'espawn') espawn.push({ x: X, y: Y });
    else if (o.t === 'ring') rings.push({ x: X, y: Y, h: r2(Math.max(1, o.y || 6)) });
    else if (o.t === 'task') tasks.push({ x: X, y: Y });
    else if (o.t === 'light') lights.push({ x: X, y: Y, h: r2(o.y == null ? 2.2 : o.y), col: o.c || '#ffb060', int: o.int == null ? 2.4 : o.int, dist: o.dist || 14 });
    else if (o.t === 'pn_wall') pnl.push(Object.assign({ x: X, y: Y, a: +(-rot).toFixed(4), L: r1((o.L || 4) * PX), T: r1((o.T || 0.3) * PX), H: r2(o.sy || 3), cs: o.cs || 1, mat: o.mat || 'brick', m: o.m === 'pn' ? 'p' : o.m || 'p' }, o.m === 'pn' ? { np: 1 } : {},
      o.y ? { z0: r2(o.y) } : {}, o.hp ? { hp: o.hp } : {}, o.thru === 0 ? { thru: 0 } : {}, o.g != null && o.g !== '' ? { g: o.g } : {},
      o.tl ? { tl: +(+o.tl).toFixed(4) } : {}, o.sh === 'tri' ? { sh: 'tri' } : {}, o.ho && o.ho.length ? { ho: o.ho.slice(0, 4) } : {}, o.nb ? { nb: 1 } : {}));   // breakable panel (js/12-pnl)
    else if (o.t === 'house') houses.push(Object.assign({ x: X, y: Y, w: r1(160 * (o.sx || 1)), d: r1(130 * (o.sz || 1)), ry: +rot.toFixed(3) }, o.brk === 0 ? { nb: 1 } : {}));   // nb = unbreakable (inspector 'Breakable' off)
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
    if (w.sys && !(w.sg && w.sys === 'fence') && !(w.sys === 'stonewall' && w.base != null)) for (let i = 1; i < P.length; i++) (sys[w.sys] = sys[w.sys] || []).push([r1(P[i - 1][0] * PX), r1(P[i - 1][1] * PX), r1(P[i][0] * PX), r1(P[i][1] * PX), r2(w.th), r2(w.h)]);
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
  mergeCaps(obs);   // chains of wall circles → one capsule each (hx/hy)
  const data = { fmt: 1, id: M.id, name: M.name, desc: M.desc || '', sky: M.sky || 'day', fog: M.fog || null, modes: M.modes && M.modes.length ? M.modes : null, random: M.random ? 1 : 0,
    weather: M.weather || '', music: M.music || '', W: M.W * PX, H: M.H * PX, c: C * PX, nx, ny, g: i16b64(g), fl, obs, spawns, espawn, rings, tasks, houses, lights, env, brk, fx: M.fx || [], mb: 1 };
  if (props.length || !M.autoProps) data.props = props;
  if (M.look) data.look = M.look;   // พรีเซ็ต Look (js/74-look.js) • lt = แสง/ฟ้าเฉพาะแมพ (js/28 buildFileMap) — ตั้งโดยแก้ไฟล์ต้นฉบับตรง ๆ (ยังไม่มีช่องใน Editor)
  if (M.lt) data.lt = M.lt;
  if (M.bd && M.bd.on) data.bd = bdPack(M.bd);   // backdrop: the game draws it (js/67-coast.js)
  if (M.style) data.style = M.style;
  if (M.style === 'forest-mist' && !M.look) data.look = 'gorge';   // forest look preset (js/74-look.js)
  if (deco.length) data.deco = deco;
  if (pnl.length) data.pnl = pnl;
  if (sg.cores.length || sg.bw.length || sg.phases.length || Object.keys(sg.sp.A).length || Object.keys(sg.sp.B).length) data.siege = sg;
  if (ceil.length) data.ceil = ceil;
  if (lz.length) data.lz = lz;
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
  else if (!c.spawns && !c.red && !c.blue) add('err', 'No spawn points yet — place at least 6 (tool "Game Points") "Game Points")');
  else if (c.spawns < 6) add('warn', 'General spawns: ' + c.spawns + ' points (6 spread apart recommended)');
  else add('ok', 'General spawns: ' + c.spawns + ' points');
  if (has('tdm') && !siegeOnly) { if (c.red >= 3 && c.blue >= 3) add('ok', 'Team spawns: red ' + c.red + ' / blue ' + c.blue); else add('warn', 'Team mode: team spawns red ' + c.red + ' / blue ' + c.blue + ' (3 per side recommended — none = the game splits the general spawns left/right)'); }
  if (M.modes && M.modes.includes('race') && c.rings < 10) add('warn', 'Broom race: rings ' + c.rings + ' (need 10)');
  if (M.modes && M.modes.includes('imp') && c.tasks < 6) add('warn', 'Find Voldemort: task points ' + c.tasks + ' (6–8 recommended)');
  if (has('coop') && c.espawn && c.espawn < 4) add('warn', 'Co-op: Monster spawns: ' + c.espawn + ' (4+ recommended, or none to let the game spawn along the edges)');
  if (M.modes && M.modes.includes('siege')) {
    const S = G.sg, N = S.cores.length;
    if (!N) add('err', 'Siege: no cores yet (Place → Siege Mode → Core)');
    else {
      const ns = S.cores.map(k => k.n);
      if (ns.some((n, i) => n !== i + 1)) add('err', 'Siege: core numbers must be 1–' + N + ' with no repeats (now ' + ns.join(', ') + ')'); else add('ok', 'Siege: cores ' + N + ' points');
      for (let p = 1; p <= N; p++) {
        const miss = [!S.sp.A[p] && 'attacker spawn', !S.sp.B[p] && 'defender spawn', !S.phases[p - 1] && 'play area'].filter(Boolean);
        if (miss.length) { add('err', 'Siege phase ' + p + ': missing ' + miss.join(', ')); continue; }
        const inA = q => S.phases[p - 1].some(r => q.x >= r.x1 && q.x <= r.x2 && q.y >= r.y1 && q.y <= r.y2);
        const k = S.cores.find(c => c.n === p); if (k && !inA(k)) add('warn', 'Siege phase ' + p + ': Core ' + p + ' is outside the phase play area', [k.x / PX, k.y / PX]);
        for (const [t, n] of [['A', 'attacker'], ['B', 'defender']]) if (!inA(S.sp[t][p])) add('warn', 'Siege phase ' + p + ': ' + n + ' spawn is outside the play area', [S.sp[t][p].x / PX, S.sp[t][p].y / PX]);
      }
      add(S.bw.length ? 'ok' : 'warn', 'Siege: target walls/gates ' + S.bw.length + ' pieces');
    }
  }
  for (const q of G.ceil) if (q.zmax == null && q.h < 20) add('warn', 'Ceiling height ' + q.h + ' (roofed rooms should be ≥ 20 so fliers can play • under mezzanines set "Only for players lower than")', [(q.x0 + q.x1) / 2 / PX, (q.y0 + q.y1) / 2 / PX]);
  if (c.lights > 12) add('warn', 'Lights ' + c.lights + ' (12 max recommended)');
  { const P = M.objs.filter(o => o.t === 'pn_wall');
    if (P.length) { const G2 = pnGraph(M, M.objs), S = pnSupported(G2, new Set()), lim = 12000, warnN = 6000;
      if (G2.n > lim) add('err', 'Breakable Panel ' + G2.n + ' cells — too many (limit ' + lim + '): use bigger cells');
      else if (G2.n > warnN) add('warn', 'Breakable Panel ' + G2.n + ' cells — quite a lot (network/collision), try bigger cells on some panels');
      else add('ok', 'Breakable Panel ' + P.length + ' panels / ' + G2.n + ' cells');
      for (const p of G2.ps) { if (p.nc * p.nr > 600) add('warn', 'Dense breakable panel (' + p.nc + '×' + p.nr + ') — cells too small', [p.o.x, p.o.z]);
        let fl = 0; for (let k = 0; k < p.nc * p.nr; k++) if (!S.seen[p.base + k]) fl++;
        if (fl) add('warn', 'Floating breakable panel ' + fl + ' cells (nothing reaching the ground — set "Group" to match the panel below/beside) will fall on the group’s first hit', [p.o.x, p.o.z]); } } }
  const obsLim = Math.max(2000, Math.round(M.W * M.H * 0.035)), obsWarn = Math.round(obsLim * 0.6);   // budget scales with map area (spatial grid keeps cost local)
  if (c.obs > obsLim) add('err', 'Colliders ' + c.obs + ' colliders — too heavy (limit ' + obsLim + '): cut down long thin walls or make them thicker');
  else if (c.obs > obsWarn) add('warn', 'Colliders ' + c.obs + ' (getting heavy)');
  else add('ok', 'Colliders ' + c.obs + ' (straight walls = 1 box each)');
  if (c.props > 0 && M.objs.filter(o => o.t === 'pchest').length > 2) add('warn', 'More than 2 treasure chests');
  let lo = 1e9, hi = -1e9; for (const h of M.hg) { if (h < lo) lo = h; if (h > hi) hi = h; }
  if (lo < -5 || hi > 20) add('warn', 'Ground level ' + lo.toFixed(1) + ' to ' + hi.toFixed(1) + ' (camera/minimap set for about −5 to +20)');
  // spawn points: on walkable ground and clear of collision
  const obs = G.data.obs;
  M.objs.filter(o => /^spawn/.test(o.t)).forEach((o, n) => {
    const i = clamp(Math.round(o.x / C), 0, M.nx - 1), j = clamp(Math.round(o.z / C), 0, M.ny - 1);
    if (slopeAt(M, i, j) > TSLOPE) add('warn', 'Spawn point on a steep slope', [o.x, o.z]);
    if (obs.some(q => q.bot == null && Math.sqrt(capD2(q, o.x * PX, o.z * PX)) < q.r + 1.5 * PX)) add('warn', 'Spawn point too close to colliders (keep radius 4 clear)', [o.x, o.z]);
  });
  // floors: walk-under headroom
  for (const f of M.floors) { const g = gh(M, f.x, f.z), gap = Math.min(f.y, f.y2 == null ? f.y : f.y2) - (f.th || 0.4) - g;
    if (gap > 0.5 && gap < HEADROOM) add('warn', 'Clearance under upper floor ' + gap.toFixed(1) + ' (below ' + HEADROOM + ' = can’t walk under)', [f.x, f.z]); }
  // reachability from the first spawn (ground level only, 1-unit cells)
  const sp = M.objs.filter(o => /^spawn/.test(o.t)), FL = M.floors;   // castle part floors (walkways, gate tops) are left out: the check is ground-level only
  if (sp.length > 1) {
    const w = Math.floor(M.W), h = Math.floor(M.H), blk = new Uint8Array(w * h), seen = new Uint8Array(w * h);
    for (const q of obs) { if (q.bot != null || q.hgt < 0.6) continue; const cx = q.x / PX, cz = q.y / PX, R = q.r / PX + PR * 0.6, ex = Math.abs(q.hx || 0) / PX, ez = Math.abs(q.hy || 0) / PX;
      for (let j = Math.max(0, Math.floor(cz - ez - R)); j <= Math.min(h - 1, Math.ceil(cz + ez + R)); j++) for (let i = Math.max(0, Math.floor(cx - ex - R)); i <= Math.min(w - 1, Math.ceil(cx + ex + R)); i++) if (Math.sqrt(capD2(q, (i + 0.5) * PX, (j + 0.5) * PX)) / PX < R) blk[j * w + i] = 1; }
    const cell = o => clamp(Math.floor(o.z), 0, h - 1) * w + clamp(Math.floor(o.x), 0, w - 1), H = k => surfTop(M, (k % w) + 0.5, ((k / w) | 0) + 0.5, null, FL);
    const st = [cell(sp[0])]; seen[st[0]] = 1;
    while (st.length) { const k = st.pop(), x = k % w, y = (k / w) | 0, hk = H(k);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const q = Y * w + X; if (seen[q] || blk[q]) continue;
        if (H(q) - hk > TSLOPE) continue; seen[q] = 1; st.push(q); } }
    const bad = sp.filter(o => !seen[cell(o)]);
    if (bad.length) bad.forEach(o => add('warn', 'This spawn can’t be reached from the first spawn (rough check)', [o.x, o.z])); else add('ok', 'All spawns are reachable from each other');
  }
  return out;
}

// ---------- room prefabs (MAP-STANDARD §1.4, round 3) ----------
// A room = its own Map Builder map with id 'room-<name>' (flat ground at 0, its content in local coords 0..W, 0..H).
// A map places instances M.rooms[] = {id, ref, x, z, rot} (x,z = room centre in the map, rot = multiple of 90°).
// Heights inside the room are relative to its own ground → +ground height of the map at the instance centre.
export const isRoomId = id => /^room-/.test(id || '');
export function roomExpand(M, inst, R) {
  const rot = Math.round((inst.rot || 0) / (Math.PI / 2)) * (Math.PI / 2), c = Math.cos(rot), s = Math.sin(rot), g0 = gh(M, inst.x, inst.z);
  const P = (x, z) => { const lx = x - R.W / 2, lz = z - R.H / 2; return [+(inst.x + lx * c + lz * s).toFixed(3), +(inst.z - lx * s + lz * c).toFixed(3)]; };   // same as three rotation.y
  const tag = (o, k) => Object.assign(o, { id: 'r' + inst.id + k + o.id, room: inst.id, rref: inst.ref });
  const walls = R.walls.map(w => tag(Object.assign({}, w, { pts: w.pts.map(p => P(p[0], p[1])) }, w.base != null ? { base: +(w.base + g0).toFixed(2) } : {}), 'w'));
  const floors = R.floors.filter(f => !f.rf || inst.rfc).map(f => {   // rf = roof collision slab (house prefabs): only when the instance ticks 'Roof collision'
    const [x, z] = P(f.x, f.z); return tag(Object.assign({}, f, { x, z, rot: (f.rot || 0) + rot, y: +(f.y + g0).toFixed(2) }, f.y2 != null ? { y2: +(f.y2 + g0).toFixed(2) } : {}, f.yb != null ? { yb: +(f.yb + g0).toFixed(2) } : {}), 'f'); });
  const swap = o => (o.t === 'phase' || o.t === 'ceil' || o.t === 'lz' || o.t === 'dc_box') && Math.abs(s) > 0.5;   // axis-aligned boxes: swap sizes on 90°/270°
  const objs = R.objs.map(o => { const [x, z] = P(o.x, o.z); return tag(Object.assign({}, o, { x, z, rot: o.t === 'phase' || o.t === 'ceil' || o.t === 'lz' || o.t === 'dc_box' ? 0 : (o.rot || 0) + rot }, swap(o) ? { sx: o.sz, sz: o.sx } : {}, inst.nbk && o.t === 'pn_wall' ? { nb: 1 } : {},   // nbk = instance set Unbreakable
      o.t === 'dc_cone' && (o.ssx || o.ssz) && Math.abs(s) > 0.5 ? { ssx: o.ssz, ssz: o.ssx } : {}), 'o'); });
  const parts = (R.parts || []).map(p => { const [x, z] = P(p.x, p.z); return tag(Object.assign({}, p, { x, z, rot: (p.rot || 0) + rot }, p.base != null ? { base: +(p.base + g0).toFixed(2) } : {}), 'p'); });
  return { walls, floors, objs, parts };
}
// RM: Map ref → unpacked room map • → {walls, floors, objs, parts} of every instance (missing rooms skipped)
export function flatRooms(M, RM) {
  const out = { walls: [], floors: [], objs: [], parts: [] };
  for (const inst of M.rooms || []) { const R = RM && RM.get(inst.ref); if (!R) continue; const X = roomExpand(M, inst, R); for (const k in out) out[k].push(...X[k]); }
  return out;
}
// "Unpack Room into Map": copy an instance's content into the map as normal editable items (no longer linked to the room file),
// flatten the ground under the room to the room floor and paint the room’s surfaces onto it. Mutates M. (user 2026-11-21: one-file maps)
export function roomUnpack(M, inst, R) {
  const X = roomExpand(M, inst, R), g0 = gh(M, inst.x, inst.z);
  let seq = M.seq || 1;
  // Hierarchy groups from the room (item.grp): each unpack gets its own name ("Stone Manor", "Stone Manor 2", …)
  const used = new Set(M.groups || []); for (const k of ['walls', 'floors', 'objs', 'parts', 'rooms']) for (const o of M[k] || []) if (o.grp) used.add(o.grp);
  const ren = new Map(); for (const k of ['walls', 'floors', 'objs', 'parts']) for (const o of X[k]) if (o.grp && !ren.has(o.grp)) { let n = o.grp, i = 2; while (used.has(n)) n = o.grp + ' ' + i++; used.add(n); ren.set(o.grp, n); }
  if (ren.size) M.groups = [...(M.groups || []), ...ren.values()];
  for (const k of ['walls', 'floors', 'objs', 'parts']) for (const o of X[k]) { delete o.room; delete o.rref; if (o.grp) o.grp = ren.get(o.grp); o.id = ++seq; (M[k] = M[k] || []).push(o); }
  const rot = Math.round((inst.rot || 0) / (Math.PI / 2)) * (Math.PI / 2), c = Math.cos(rot), s = Math.sin(rot);
  for (let j = 0; j < M.ny; j++) for (let i = 0; i < M.nx; i++) {
    const dx = i * C - inst.x, dz = j * C - inst.z, rx = dx * c - dz * s + R.W / 2, rz = dx * s + dz * c + R.H / 2;
    if (rx < -1e-6 || rz < -1e-6 || rx > R.W + 1e-6 || rz > R.H + 1e-6) continue;
    const ri = clamp(Math.round(rx / C), 0, R.nx - 1), rj = clamp(Math.round(rz / C), 0, R.ny - 1), k = j * M.nx + i;
    M.hg[k] = g0 + R.hg[rj * R.nx + ri]; M.sf[k] = R.sf[rj * R.nx + ri];
  }
  M.rooms = (M.rooms || []).filter(r => r.id !== inst.id); M.seq = seq;
  return M;
}
// map + its expanded rooms as one plain map (for gameData / check / export)
export function withRooms(M, RX) { return RX && (RX.walls.length || RX.floors.length || RX.objs.length || RX.parts.length) ? Object.assign({}, M, { walls: M.walls.concat(RX.walls), floors: M.floors.concat(RX.floors), objs: M.objs.concat(RX.objs), parts: (M.parts || []).concat(RX.parts) }) : M; }

// ---------- castle parts (guides/MAP-BUILDER.md "Castle Pieces") ----------
// M.parts[] = {id, k, x, z, rot, base (absolute bottom height, null = follows the ground), c, brk, + params (PART[k].p) + flags (PART[k].f)}
// A part is NOT a new pipeline: expandParts() turns it into plain prim objs (box/cyl/cone/wedge → collision circles, glb, brk groups) and floors (walkable tops).
// Local frame: origin = part centre, +z = length axis, +x = across; rot = rotation.y (same as objs/floors). Expanded items carry _p = part id; hid:1 = collision only (no mesh).
export const PART = {   // p: name → [default, min, max, step] • f: flag defaults
  wall:   { n: 'Straight Wall', c: '#8a8478', p: { len: [10, 2, 60, 1], th: [2, 0.6, 6, 0.2], h: [6, 1, 20, 0.5] }, f: { bt: 1, wk: 1 }, main: 'len' },
  corner: { n: 'Corner Wall (L)', c: '#8a8478', p: { a: [10, 3, 40, 1], b: [10, 3, 40, 1], th: [2, 0.6, 6, 0.2], h: [6, 1, 20, 0.5] }, f: { bt: 1, wk: 1 }, main: 'a' },
  tower:  { n: 'Tower', c: '#77736c', p: { r: [3.5, 1.5, 10, 0.25], h: [10, 3, 30, 0.5] }, f: { round: 1, roof: 0, bt: 1 }, main: 'r' },
  gate:   { n: 'Gatehouse', c: '#77736c', p: { len: [14, 6, 40, 1], th: [3, 1, 8, 0.5], h: [7, 3, 20, 0.5], gw: [4, 2, 10, 0.5], gh: [4.5, 2.2, 12, 0.25] }, f: { bt: 1, wk: 1, door: 1 }, main: 'len' },
  keep:   { n: 'Keep', c: '#7d7870', p: { w: [14, 5, 40, 1], d: [12, 5, 40, 1], h: [12, 3, 30, 0.5] }, f: { bt: 1, roof: 0, turrets: 1 }, main: 'w' },
  stairs: { n: 'Stairs', c: '#8a8478', p: { w: [3, 1, 10, 0.5], len: [8, 2, 30, 0.5], rise: [5, 0.5, 20, 0.25] }, f: {}, main: 'len' },
  ramp:   { n: 'Ramp', c: '#8a8478', p: { w: [3, 1, 10, 0.5], len: [10, 2, 40, 0.5], rise: [4, 0.5, 20, 0.25] }, f: {}, main: 'len' },
  walk:   { n: 'Raised Walkway', c: '#7a7569', p: { w: [3, 1, 10, 0.5], len: [10, 2, 40, 1], up: [6, 0.5, 20, 0.25] }, f: { rail: 1 }, main: 'len' },
  free:   { n: 'Free Shape (draw)', c: '#8a8478', p: { h: [6, 0.5, 40, 0.5], tp: [1, 0, 1, 0.05] }, f: {}, main: 'h' },   // pts = footprint polygon (local x,z): drawn in the view, vertices draggable
  bridge: { n: 'Bridge', c: '#7d7870', p: { w: [4, 2, 12, 0.5], len: [14, 3, 50, 1], up: [3, 0.5, 20, 0.25] }, f: { rail: 1, piers: 1 }, main: 'len' },
};
export const PART_P = { tp: 'Taper (1 straight, 0 pointed)', len: 'Length', th: 'Thickness', h: 'Height', a: 'Arm A', b: 'Arm B', r: 'Radius/Half Width', gw: 'Door Width', gh: 'Door Height', w: 'Width', d: 'Depth', rise: 'Rise', up: 'Height Above Ground' };
export const PART_F = { bt: 'Battlements', wk: 'Walkway on Top', door: 'Wooden Gate Door (breakable)', round: 'Round', roof: 'Roof (instead of open top)', turrets: 'Small Corner Towers', rail: 'Rail', piers: 'Under-bridge Supports' };
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
  // big blocks: visible shell (no collision) + a ring of thin hidden strips = exact footprint for the game’s circle collision
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
