// Tone Lab test map → maps/build/tonelab.json (Map Builder source). 12 zones = every ground surface/environment,
// each with the same colour chart (white / 18% grey / black / skin / red / green / blue) so light presets can be compared.
// Use: node tools/tonelab-map.mjs  then export: node tools/headless.js --url "mapbuild.html?export=tonelab" --js tools/mb-export.js --quiet
// Shots: tools/tonelab-shots.js (zones x light scenarios matrix). Zone list is shared with that script via TONELAB_ZONES below.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { newMap, pack, vnoise, C } = await import(pathToFileURL(path.join(ROOT, 'mapbuild', 'model.js')).href);

// 4 cols x 3 rows, each zone 30 x 30 m, 2 m packed-path strips between zones
const ZW = 30, GAP = 2, COLS = 4, ROWS = 3, W = COLS * ZW + (COLS + 1) * GAP, H = ROWS * ZW + (ROWS + 1) * GAP;
const S = { grass: 0, grass2: 1, dry: 2, dirt: 3, path: 4, rock: 5, pave: 6, dark: 7, sand: 8, snow: 9, wood: 10, ash: 11, mud: 12, water: 13, ice: 14, lava: 15, moss: 16, litter: 17, gravel: 18, duff: 19, trail: 20 };
// k = id, n = label, s = main surface, s2 = patch surface (centre-back blob)
export const ZONES = [
  { k: 'grass', n: 'Grass + oak', s: 'grass', s2: 'grass2' }, { k: 'forest', n: 'Dark forest', s: 'grass2', s2: 'litter' },
  { k: 'dry', n: 'Dry grass + house', s: 'dry', s2: 'dirt' }, { k: 'dirt', n: 'Dirt / mud', s: 'dirt', s2: 'mud' },
  { k: 'sand', n: 'Desert sand', s: 'sand', s2: 'path' }, { k: 'snow', n: 'Snow village', s: 'snow', s2: 'snow' },
  { k: 'ice', n: 'Ice lake', s: 'ice', s2: 'snow' }, { k: 'water', n: 'Shallow water', s: 'grass', s2: 'water' },
  { k: 'lava', n: 'Lava / ash', s: 'ash', s2: 'lava' }, { k: 'castle', n: 'Castle stone', s: 'pave', s2: 'rock' },
  { k: 'indoor', n: 'Indoor (wood)', s: 'pave', s2: 'wood' }, { k: 'moss', n: 'Misty pine (moss)', s: 'moss', s2: 'duff' },
];
const M = newMap({ id: 'tonelab', name: '🎨 Tone Lab (ทดสอบแสง)', W, H, surf: S.path });
Object.assign(M, { desc: 'แมพทดสอบโทนสี: 12 โซนพื้นผิว/สภาพแวดล้อม + ชาร์ตสีอ้างอิงทุกโซน (ไม่อยู่ในการสุ่ม)', sky: 'sunset', modes: ['ffa', 'tdm', 'coop', 'duel'], random: 0, autoProps: 0, skirt: 40 });

const zoneOrg = i => [GAP + (i % COLS) * (ZW + GAP), GAP + Math.floor(i / COLS) * (ZW + GAP)];   // top-left (x,z) of zone i
for (let j = 0; j < M.ny; j++) for (let i = 0; i < M.nx; i++) {
  const x = i * C, z = j * C, k = j * M.nx + i;
  M.hg[k] = Math.round((vnoise(x * 0.08, z * 0.08) - 0.5) * 0.3 * 100) / 100;   // almost flat, tiny undulation
  for (let q = 0; q < ZONES.length; q++) {
    const [x0, z0] = zoneOrg(q); if (x < x0 || x > x0 + ZW || z < z0 || z > z0 + ZW) continue;
    const Z = ZONES[q], bx = x0 + ZW / 2, bz = z0 + 9;   // patch blob centre (back half, behind the chart)
    const d = Math.hypot((x - bx) / 9, (z - bz) / 6) + (vnoise(x * 0.3, z * 0.3) - 0.5) * 0.3;
    M.sf[k] = S[d < 1 ? Z.s2 : Z.s];
    if (Z.k === 'water' && d < 1) M.hg[k] -= 0.25 * (1 - d);   // shallow pond dip
    if (Z.k === 'indoor') M.sf[k] = S.wood;
  }
}

let id = 1, wid = 1, fid = 1;
const put = (t, x, z, o = {}) => { M.objs.push(Object.assign({ id: id++, t, x: +x.toFixed(2), z: +z.toFixed(2), y: 0, rot: 0 }, o)); };
const box = (x, z, sx, sy, sz, c, o = {}) => put('box', x, z, Object.assign({ sx, sy, sz, c }, o));
const wall = (pts, th, h, c, m = 'stone', closed = 0) => M.walls.push({ id: wid++, pts, th, h, c, m, closed, curve: 0, brk: 0, base: null });
const CHART = ['#f2f2f2', '#767676', '#161616', '#e0b090', '#b03030', '#3a8a3a', '#3050b0'];   // #767676 ≈ 18% linear grey

ZONES.forEach((Z, q) => {
  const [x0, z0] = zoneOrg(q), cx = x0 + ZW / 2;
  // colour chart: row of 0.9 m cubes on a 0.25 m dark plinth, 12 m from the south edge (camera stands at the south edge facing north)
  const cz = z0 + 18;
  box(cx, cz, CHART.length * 1.1 + 0.4, 0.25, 1.3, '#2a2a2a', { col: 0 });
  CHART.forEach((c, i) => box(cx + (i - (CHART.length - 1) / 2) * 1.1, cz, 0.9, 0.9, 0.9, c, { y: 0.25, col: 0 }));
  put('spawn', cx, z0 + 25, { rot: Math.PI });
  const L = (dx, dz) => [cx + dx, z0 + dz];
  switch (Z.k) {
    case 'grass': for (const [dx, dz] of [[-9, 6], [8, 5], [11, 13]]) put('ptree', ...L(dx, dz), { rot: dx }); put('pcrate', ...L(-5, 17)); break;
    case 'forest': for (const [dx, dz] of [[-11, 4], [-6, 7], [-1, 3], [5, 6], [10, 4], [12, 11], [-12, 11]]) put('ppine', ...L(dx, dz), { rot: dx }); break;
    case 'dry': put('house', ...L(0, 6), { sx: 1, sz: 1 }); put('pbarrel', ...L(6, 17)); wall([L(-13, 18), L(-7, 18)], 0.4, 1.1, '#8a6a44', 'wood'); break;
    case 'dirt': put('pcrate', ...L(-4, 8)); put('pcrate', ...L(-2.6, 8.4)); put('pbarrel', ...L(5, 9)); wall([L(-13, 4), L(13, 4)], 0.4, 1.1, '#8a6a44', 'wood'); break;
    case 'sand': for (const dx of [-9, -3, 3, 9]) put('cyl', ...L(dx, 6), { sx: 1.4, sy: 6, sz: 1.4, c: '#d8c8a0' }); wall([L(-12, 11), L(-5, 11)], 0.8, 1.2, '#c9b48a'); break;
    case 'snow': put('house', ...L(-5, 6), { sx: 0.9, sz: 0.9 }); for (const [dx, dz] of [[8, 5], [11, 9], [6, 10]]) put('ppine', ...L(dx, dz), { rot: dx }); break;
    case 'ice': wall([L(-11, 5), L(-3, 5)], 1, 3, '#bfe0ee', 'ice'); for (const [dx, dz, s] of [[4, 7, 3], [8, 5, 4.5], [10, 9, 2.5]]) put('cone', ...L(dx, dz), { sx: s * 0.6, sy: s, sz: s * 0.6, c: '#bfe0ee', col: 0 }); break;
    case 'water': for (let a = 0; a < 10; a++) { const t = a / 10 * 6.283; put('ball', ...L(Math.cos(t) * 10, 9 + Math.sin(t) * 6.6), { sx: 1.2, sy: 0.7, sz: 1, c: '#5a5852', col: 0 }); } put('ptree', ...L(-12, 4)); break;
    case 'lava': for (const [dx, dz, s] of [[-9, 6, 2.4], [-4, 4, 1.6], [7, 5, 3], [11, 10, 2]]) put('ball', ...L(dx, dz), { sx: s, sy: s * 0.7, sz: s, c: '#3a3a40' }); put('box', ...L(0, 9), { sx: 1.2, sy: 0.3, sz: 1.2, c: '#ff7a2a', glow: 1, col: 0 }); break;
    case 'castle': wall([L(-14, 3), L(14, 3)], 2, 6, '#77736c'); wall([L(-14, 3), L(-14, 12)], 1, 3.5, '#8a8478'); wall([L(14, 3), L(14, 12)], 1, 3.5, '#8a8478');
      put('light', ...L(-6, 4.5), { y: 3, c: '#ffb060', int: 2.4, dist: 14 }); put('light', ...L(6, 4.5), { y: 3, c: '#ffb060', int: 2.4, dist: 14 }); break;
    case 'indoor': {   // closed stone room 26 x 26 with a door gap on the south side, flat roof at 6 m, warm lamps
      const a = 2, b = ZW - 2;
      wall([[x0 + a, z0 + b], [x0 + a, z0 + a], [x0 + b, z0 + a], [x0 + b, z0 + b], [cx + 2, z0 + b]], 0.8, 6, '#8a8478');
      wall([[cx - 2, z0 + b], [x0 + a, z0 + b]], 0.8, 6, '#8a8478');
      M.floors.push({ id: fid++, x: cx, z: z0 + ZW / 2, w: b - a + 1, d: b - a + 1, rot: 0, y: 6, y2: 6, th: 0.4, c: '#5a5048', steps: 0 });
      put('lz', cx, z0 + ZW / 2, { sx: b - a, sz: b - a, y: 6, k: 1 });
      put('ceil', cx, z0 + ZW / 2, { sx: b - a, sz: b - a, y: 5.6 });
      box(cx, z0 + 7, 10, 0.05, 3, '#7a1a20', { col: 0 });   // red carpet strip
      put('light', ...L(-6, 8), { y: 4, c: '#ffb060', int: 2.4, dist: 14 }); put('light', ...L(6, 8), { y: 4, c: '#ffb060', int: 2.4, dist: 14 });
      put('pchest', ...L(0, 5)); break; }
    case 'moss': for (const [dx, dz] of [[-10, 4], [-5, 8], [6, 4], [11, 8], [2, 11]]) put('ppine', ...L(dx, dz), { rot: dx });
      for (const [dx, dz, s] of [[-2, 6, 1.6], [8, 13, 1.2]]) put('ball', ...L(dx, dz), { sx: s, sy: s * 0.6, sz: s, c: '#6a675e' }); break;
  }
});
// team spawns (tdm): red north row, blue south row on the path strips
for (let i = 0; i < 3; i++) { put('spawnR', W / 2 - 4 + i * 4, 1, { rot: 0 }); put('spawnB', W / 2 - 4 + i * 4, H - 1, { rot: Math.PI }); }
M.seq = id + 1;
const out = path.join(ROOT, 'maps', 'build', 'tonelab.json');
fs.writeFileSync(out, JSON.stringify(pack(M)));
console.log('wrote', out, W + 'x' + H, M.objs.length, 'objs');
