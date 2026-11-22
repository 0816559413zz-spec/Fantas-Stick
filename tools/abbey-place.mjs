// Abbey mount decor on the castle map (user 2026-11-22: red zones of fcs-file = scenery, not playable).
// Registers kit abbey/mount (assets/mapkit/abbey.glb from assets/src/abbey_build.py) and edits maps/build/<id>.json:
//  - removes walls / floors / objects / parts lying inside the footprint (L zone + the rampart band on the old castle wall row,
//    so the rampart is the only wall there: no double wall, no stray turrets)
//  - places the kit model + invisible tall collision boxes on the rampart + collision cylinders for its round towers
//  - everything new carries grp 'Abbey Mount (decor)'. Re-running replaces the previous placement.
// Usage: node tools/abbey-place.mjs [mapId=fcs-file]   (close/reload Map Builder on that map afterwards: it autosaves)
import fs from 'fs';
import * as MD from '../mapbuild/model.js';
const id = process.argv[2] || 'fcs-file', GRP = 'Abbey Mount (decor)';
const I = JSON.parse(fs.readFileSync('assets/mapkit/abbey.info.json', 'utf8'));
const [ZA, ZB] = I.zones, MG = 0.4;   // footprint incl. rampart; decor hugging the old wall row's outer face goes too
const inR = (x, z, m) => (x >= ZA[0] - m && x <= ZA[1] && z >= ZA[2] && z <= ZA[3] + m) || (x >= ZB[0] - m && x <= ZB[1] && z >= ZB[2] && z <= ZB[3] + m);
const inZ = (x, z) => inR(x, z, 0);

// ---- kit registration ----
const kp = 'assets/mapkit/kit.json', kit = JSON.parse(fs.readFileSync(kp, 'utf8'));
kit.user = (kit.user || []).filter(a => !String(a.id).startsWith('abbey/'));
kit.user.push({ id: 'abbey/mount', name: 'Abbey Mount (decor) · Castle', cat: 'build', src: 'mapkit/abbey.glb', node: 'ab_mount', col: 0, brk: 0, ns: 0, v: Date.now() });
const row = L => L.map(a => JSON.stringify(a)).join(',\n  ');
fs.writeFileSync(kp, '{\n "_about": ' + JSON.stringify(kit._about || '') + ',\n "v": 1,\n "assets": [\n  ' + row(kit.assets || []) + '\n ],\n "user": [\n  ' + row(kit.user) + '\n ]\n}\n');

// ---- map edit ----
const path = 'maps/build/' + id + '.json', M = MD.unpack(JSON.parse(fs.readFileSync(path, 'utf8')));
const gone = it => inR(it.x, it.z, MG);
const wmid = w => { const xs = w.pts.map(p => p[0]), zs = w.pts.map(p => p[1]); return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2]; };
const n0 = { walls: M.walls.length, floors: M.floors.length, objs: M.objs.length, parts: (M.parts || []).length };
M.objs = M.objs.filter(o => o.grp !== GRP && !gone(o));
M.floors = M.floors.filter(f => f.grp !== GRP && !gone(f));
M.parts = (M.parts || []).filter(p => p.grp !== GRP && !gone(p));
M.walls = M.walls.filter(w => w.grp !== GRP && !w.pts.every(([x, z]) => inR(x, z, MG)) && !inR(...wmid(w), MG));
let n = Math.max(M.seq || 1, ...['walls', 'floors', 'objs', 'parts'].flatMap(k => (M[k] || []).map(q => q.id || 0))) + 1;
const put = (t, x, z, e = {}) => M.objs.push(Object.assign({ id: n++, t, x: +x.toFixed(2), z: +z.toFixed(2), y: 0, rot: 0 }, e, { grp: GRP }));
put('kit:abbey/mount', I.origin_map[0] + (I.x[0] + I.x[1]) / 2, I.origin_map[1] + (I.z[0] + I.z[1]) / 2, { s: 1 });   // kit models are centred on their bbox
// invisible walls on the zone edge (inside the rampart), tall enough for fliers
for (const [[ax, az], [bx, bz]] of I.edge) {
  const T = I.rw_t, H = 80, vert = ax === bx;
  const mx = (ax + bx) / 2, mz = (az + bz) / 2, L = Math.hypot(bx - ax, bz - az) + T;
  const off = vert ? (inZ(mx + 3, mz) ? 1 : -1) : (inZ(mx, mz + 3) ? 1 : -1);   // the rampart lies inward of the outer face
  put('box', vert ? mx + off * T / 2 : mx, vert ? mz : mz + off * T / 2, { sx: vert ? T : L, sy: H, sz: vert ? L : T, c: '#ff5a5a', vis: 0, col: 1 });
}
for (const [x, z, r] of I.towers || []) put('cyl', x, z, { sx: +(2 * r).toFixed(2), sy: 80, sz: +(2 * r).toFixed(2), c: '#ff5a5a', vis: 0, col: 1 });
M.groups = (M.groups || []).filter(g => g !== GRP).concat([GRP]);
M.seq = n;
fs.writeFileSync(path, JSON.stringify(MD.pack(M)));
console.log(id, 'removed', { walls: n0.walls - M.walls.length, floors: n0.floors - M.floors.length, objs: n0.objs - M.objs.length + 5, parts: n0.parts - M.parts.length }, '• added kit +', I.edge.length, 'collision walls +', (I.towers || []).length, 'tower cylinders');
