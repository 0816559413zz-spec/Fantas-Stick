// Builds the sample castle map maps/build/castle-demo.json from castle parts (Map Builder, guides/MAP-BUILDER.md "ชิ้นส่วนปราสาท")
// Run: node tools/castle-sample.mjs  → then open mapbuild.html?id=castle-demo and press ⬆ (or: node tools/headless.js --url "mapbuild.html?export=castle-demo" --js tools/mb-export.js --quiet)
import fs from 'fs';
import * as MD from '../mapbuild/model.js';
const M = MD.newMap({ id: 'castle-demo', name: 'Castle Demo (ชิ้นส่วนปราสาท)', W: 100, H: 80, surf: 0 });
M.desc = 'ตัวอย่างปราสาทจาก Map Builder: กำแพง หอคอย ประตู ตึกใหญ่ บันได ทางลาด สะพาน';
M.modes = ['coop', 'ffa', 'duel', 'tdm'];
const { nx, ny } = M;
for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {   // paved courtyard
  const x = i * MD.C, z = j * MD.C; if (x > 31 && x < 69 && z > 26 && z < 54) M.sf[j * nx + i] = 6; else if (Math.abs(x - 50) < 3 && z > 54) M.sf[j * nx + i] = 4;
}
M.seq = 1;
const part = (k, o) => { const p = MD.partNew(k, Object.assign({ id: M.seq++ }, o)); M.parts.push(p); return p; };
const H = Math.PI / 2;
for (const [x, z] of [[30, 25], [70, 25], [30, 55], [70, 55]]) part('tower', { x, z, r: 3.5, h: 6.5, round: 0 });
part('wall', { x: 50, z: 25, rot: H, len: 34 });           // north
part('wall', { x: 30, z: 40, rot: 0, len: 24 });           // west
part('wall', { x: 70, z: 40, rot: 0, len: 24 });           // east
part('wall', { x: 38.5, z: 55, rot: H, len: 11 });         // south left
part('wall', { x: 61.5, z: 55, rot: H, len: 11 });         // south right
part('gate', { x: 50, z: 55, rot: H, len: 12, th: 2, h: 6, gw: 4, gh: 4.5 });
part('keep', { x: 50, z: 34, w: 12, d: 8, h: 12 });
part('stairs', { x: 38, z: 31, rot: Math.PI, w: 3, len: 10, rise: 6 });   // up onto the north wall
part('ramp', { x: 36, z: 45, rot: -H, w: 3, len: 10, rise: 6 });          // up onto the west wall
part('bridge', { x: 50, z: 70, rot: H, w: 4, len: 16, up: 2.5 });
part('free', { x: 72, z: 68, h: 4.5, tp: 0.45, pts: [[-4, -3], [4, -3.5], [5, 2], [0, 4.5], [-5, 2]] });   // free-shape low-poly hut (drawn polygon, tapered top)
const spots = [[44, 46], [56, 46], [40, 38], [60, 38], [50, 48], [50, 62], [42, 64], [58, 64]];
spots.forEach(([x, z], i) => M.objs.push({ id: M.seq++, t: 'spawn', x, z, y: 0, rot: i < 5 ? Math.PI : 0 }));
const o = MD.pack(M);
fs.mkdirSync('maps/build', { recursive: true });
fs.writeFileSync('maps/build/castle-demo.json', JSON.stringify(o));
console.log('parts', M.parts.length, 'expanded', MD.expandParts(M).objs.length);
