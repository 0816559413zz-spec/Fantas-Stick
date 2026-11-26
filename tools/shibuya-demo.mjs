// Shibuya scramble crossing night test map (rain + reflection test) → maps/build/shibuya-demo.json + kit.json rows "shibuya/*"
// Steps: python assets/src/shibuya_prep.py <overpass.json>   (real layout, © OpenStreetMap contributors, ODbL)
//        python assets/src/shibuya_tex.py                     (facade / sign textures, generic words only, no brands)
//        blender -b --factory-startup --python assets/src/shibuya_build.py   (assets/mapkit/shibuya.glb + assets/src/shibuya_place.json)
//        node tools/shibuya-demo.mjs                          (this file)
//        python tools/serve.py  +  node tools/headless.js --url "mapbuild.html?export=shibuya-demo" --js tools/mb-export.js --quiet
// Test map: hidden from the game picker (MAP_TEST "-demo"), play it from Map Builder ▶ Play or index.html?playmap=shibuya-demo.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MD = await import(pathToFileURL(path.join(ROOT, 'mapbuild', 'model.js')).href);
const { newMap, pack, gh, C, SURF } = MD;
const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'src', 'shibuya_data.json'), 'utf8'));
const PL = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'src', 'shibuya_place.json'), 'utf8'));
const W = D.W, H = D.H, [CX, CZ] = D.cross;
const SI = k => { const i = SURF.findIndex(s => s.k === k); if (i < 0) throw new Error('SURF ' + k + ' missing'); return i; };
const ASPH = SI('asphalt'), WALK = SI('sidewalk'), CURB = 0.12;

// ---------- kit rows (buildings collide through invisible boxes below, so the kit itself has col 0) ----------
const kp = path.join(ROOT, 'assets', 'mapkit', 'kit.json'), K = JSON.parse(fs.readFileSync(kp, 'utf8')), V = Date.now();
K.user = (K.user || []).filter(u => !String(u.id).startsWith('shibuya/'));
for (const b of PL.buildings) K.user.push({ id: 'shibuya/b' + b.id, name: (b.name || 'Building ' + b.id) + ' · Shibuya', cat: 'shibuya', src: 'mapkit/shibuya.glb', node: b.node, col: 0, brk: 0, ns: 0, v: V });
for (const [n, nm] of [['street', 'Street Furniture (lamps, signals, statue)'], ['marks', 'Road Markings (zebra, lane lines)'], ['rail', 'Elevated Rail + Train']])
  K.user.push({ id: 'shibuya/' + n, name: nm + ' · Shibuya', cat: 'shibuya', src: 'mapkit/shibuya.glb', node: 'sb_' + n, col: 0, brk: 0, ns: 0, v: V });
fs.writeFileSync(kp, '{\n "_about": ' + JSON.stringify(K._about) + ',\n "v": ' + (K.v || 1) + ',\n "assets": [\n  ' + K.assets.map(a => JSON.stringify(a)).join(',\n  ') + '\n ],\n "user": [\n  ' + K.user.map(a => JSON.stringify(a)).join(',\n  ') + '\n ]\n}\n');

// ---------- ground: asphalt roads (0 m), raised sidewalks / plazas (CURB) ----------
const M = newMap({ id: 'shibuya-demo', name: '🌃 Shibuya Night (test)', W, H, surf: WALK });
Object.assign(M, {
  desc: 'Night rain test map: Shibuya scramble crossing from real OpenStreetMap footprints (© OpenStreetMap contributors). Weather + light reflection test.',
  sky: 'night', fog: ['#1b2130', 40, 420], weather: 'rain:100', music: '', modes: ['ffa', 'duel', 'tdm'], random: 0, autoProps: 0, skirt: 30,
  lt: { hemi: ['#5a6c96', '#1c1c26', 0.5], sun: ['#a8b8ff', 0.45, [30, 70, -40]], sky: '#0c111e', exp: 1.0 },
});
const road = new Uint8Array(M.nx * M.ny);
for (const r of D.R) {
  if (r.k.startsWith('rail') || r.k === 'pedestrian') continue;
  const hw = r.w / 2 + 0.25;
  for (let s = 0; s < r.p.length - 1; s++) {
    const [ax, az] = r.p[s], [bx, bz] = r.p[s + 1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1e-9;
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - hw) / C)), i1 = Math.min(M.nx - 1, Math.ceil((Math.max(ax, bx) + hw) / C));
    const j0 = Math.max(0, Math.floor((Math.min(az, bz) - hw) / C)), j1 = Math.min(M.ny - 1, Math.ceil((Math.max(az, bz) + hw) / C));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = i * C, z = j * C, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
      if (Math.hypot(x - ax - dx * t, z - az - dz * t) <= hw) road[j * M.nx + i] = 1;
    }
  }
}
for (let k = 0; k < road.length; k++) { M.sf[k] = road[k] ? ASPH : WALK; M.hg[k] = road[k] ? 0 : CURB; }

// ---------- objects ----------
let id = 1; const add = o => { M.objs.push(Object.assign({ id: id++ }, o)); return o; };
const inPoly = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [x1, z1] = P[i], [x2, z2] = P[j]; if ((z1 > z) !== (z2 > z) && x < (x2 - x1) * (z - z1) / (z2 - z1) + x1) c = !c; } return c; };
const inBld = (x, z, pad = 0) => PL.buildings.some(b => inPoly(x, z, b.p) || (pad > 0 && b.p.some(p => Math.hypot(p[0] - x, p[1] - z) < pad)));
for (const b of PL.buildings) add({ t: 'kit:shibuya/b' + b.id, x: b.x, z: b.z, y: 0, rot: 0, s: 1, col: 0 });
for (const n of ['street', 'marks', 'rail']) add({ t: 'kit:shibuya/' + n, x: PL['sb_' + n].x, z: PL['sb_' + n].z, y: -gh(M, PL['sb_' + n].x, PL['sb_' + n].z), rot: 0, s: 1, col: 0 });
// building collision: one invisible box per wall edge (2 m thick, inside the facade) → the exporter merges each into a capsule
const TH = 2.0; let ncol = 0;
const DATA = new Map(D.B.map(b => [b.id, b]));
for (const b of PL.buildings) {
  if ((DATA.get(b.id) || {}).k === 'roof') continue;   // canopies: walk under
  const P = b.p;   // counter-clockwise seen from above in Blender = outward normal (-ez, ex) in map axes
  for (let i = 0; i < P.length; i++) {
    const [ax, az] = P[i], [bx, bz] = P[(i + 1) % P.length], L = Math.hypot(bx - ax, bz - az); if (L < 0.8) continue;
    const ex = (bx - ax) / L, ez = (bz - az) / L, nx = ez, nz = -ex;   // inward
    add({ t: 'box', c: '#ff5a5a', vis: 0, col: 1, x: +((ax + bx) / 2 + nx * TH / 2).toFixed(3), z: +((az + bz) / 2 + nz * TH / 2).toFixed(3), y: 0, rot: +Math.atan2(-ez, ex).toFixed(4), sx: +(L + 0.4).toFixed(2), sy: Math.min(b.h, 60), sz: TH });
    ncol++;
  }
}
// spawns: ring on the crossing + team groups (Hachiko side / Q-FRONT side)
const free = (x, z) => !inBld(x, z, 1.5);
const spot = (x, z) => { for (let r = 0; r < 12; r += 0.5) for (let a = 0; a < 8; a++) { const X = x + Math.cos(a * Math.PI / 4) * r, Z = z + Math.sin(a * Math.PI / 4) * r; if (free(X, Z)) return [X, Z]; } return [x, z]; };
for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + 0.2, [x, z] = spot(CX + Math.cos(a) * 17, CZ + Math.sin(a) * 17); add({ t: 'spawn', x: +x.toFixed(2), z: +z.toFixed(2), y: 0, rot: Math.atan2(-(CX - x), -(CZ - z)) }); }
for (let k = 0; k < 4; k++) { const [x, z] = spot(CX - 6 + k * 4, CZ + 40); add({ t: 'spawnR', x: +x.toFixed(2), z: +z.toFixed(2), y: 0, rot: Math.PI }); }
for (let k = 0; k < 4; k++) { const [x, z] = spot(CX - 6 + k * 4, CZ - 34); add({ t: 'spawnB', x: +x.toFixed(2), z: +z.toFixed(2), y: 0, rot: 0 }); }
// map lights (game has 8 map light slots): warm street light on the corners + coloured screen spill
const LT = [[CX - 20, CZ - 20, '#ffd3a0'], [CX + 20, CZ - 20, '#ffd3a0'], [CX + 20, CZ + 20, '#ffd3a0'], [CX - 20, CZ + 20, '#ffd3a0'],
  [CX - 14, CZ - 34, '#7fd4ff'], [CX + 34, CZ - 38, '#ff6fb0'], [CX - 40, CZ + 22, '#b98cff'], [CX - 2, CZ + 46, '#ffe6b8']];
for (const [x, z, c] of LT) { const [X, Z] = spot(x, z); add({ t: 'light', x: +X.toFixed(2), z: +Z.toFixed(2), y: 5, c, int: 3.2, dist: 26 }); }
M.seq = id + 10;
const out = path.join(ROOT, 'maps', 'build', 'shibuya-demo.json');
fs.writeFileSync(out, JSON.stringify(pack(M)));
let nr = 0; for (const v of road) nr += v;
console.log('OK maps/build/shibuya-demo.json', W + 'x' + H, 'objs', M.objs.length, 'buildings', PL.buildings.length, 'col boxes', ncol, 'road cells', (100 * nr / road.length).toFixed(0) + '%');
