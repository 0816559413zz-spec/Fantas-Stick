// Small siege test map from Map Builder (MAP-STANDARD round 2): maps/build/siege-demo.json
// Run: node tools/siege-sample.mjs → export: python tools/serve.py (other window) then
//   node tools/headless.js --url "mapbuild.html?export=siege-demo" --js tools/mb-export.js --quiet
// Play: index.html?nosw&playmap=siege-demo&pm=siege   (3 phases left → right)
import fs from 'fs';
import * as MD from '../mapbuild/model.js';
const M = MD.newMap({ id: 'siege-demo', name: 'Siege Demo (ทดสอบบุกปราสาท)', W: 150, H: 60, surf: 0 });
M.desc = 'แผนที่ทดสอบโหมดบุกปราสาทจาก Map Builder: 3 เฟส ซ้ายไปขวา ประตู กำแพงเป้าหมาย รั้วไหม้ได้ เพดาน';
M.modes = ['siege']; M.random = 0; M.autoProps = 0; M.sky = 'day'; M.style = 'castle-stone';
const { nx, ny } = M;
for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
  const x = i * MD.C, z = j * MD.C, k = j * nx + i;
  M.hg[k] = 0.6 * Math.sin(x / 9) * Math.sin(z / 7) * (x < 55 ? 1 : 0);   // gentle bumps in the field (phase 1)
  M.sf[k] = x > 60 ? 6 : Math.abs(z - 30) < 3 ? 4 : 0;   // castle paving east of the gate, path through the field
}
let id = 1;
const nid = () => id++;
const wall = (pts, o = {}) => M.walls.push(Object.assign({ id: nid(), pts, th: 2, h: 6, c: '#77736c', m: 'stone', closed: 0, curve: 0, brk: 0 }, o));
const obj = o => M.objs.push(Object.assign({ id: nid(), y: 0, rot: 0 }, o));
// outer castle wall at x 60 with the gate (opens at phase 2)
wall([[60, 0], [60, 25]]); wall([[60, 35], [60, 60]]);
wall([[60, 25], [60, 35]], { sg: 'gate', brk: 1, c: '#7a5a3a', m: 'wood', th: 1.5, h: 5 });
// inner wall at x 110 with a breakable target section
wall([[110, 0], [110, 20]]); wall([[110, 40], [110, 60]]);
wall([[110, 20], [110, 40]], { sg: 'wall', brk: 1, c: '#9a6a5a' });
// burnable fences in the field
wall([[18, 12], [40, 12]], { th: 0.4, h: 1.1, c: '#8a6a44', m: 'wood', sys: 'fence' });
wall([[18, 48], [40, 48]], { th: 0.4, h: 1.1, c: '#8a6a44', m: 'wood', sys: 'fence' });
// low cover inside
for (const [x, z] of [[75, 18], [85, 42], [125, 20], [125, 40]]) wall([[x - 3, z], [x + 3, z]], { th: 0.8, h: 1.2, c: '#8a8478' });
// hall roof over the last core (ceiling only, see-through in game)
obj({ t: 'ceil', x: 135, z: 30, sx: 26, sz: 30, y: 21 });
// siege markers
[[45, 30], [92, 30], [138, 30]].forEach(([x, z], i) => obj({ t: 'core', x, z, n: i + 1, s: 6 }));
[[6, 30], [64, 30], [114, 30]].forEach(([x, z], i) => obj({ t: 'sgA', x, z, ph: i + 1 }));
[[56, 52], [104, 52], [146, 52]].forEach(([x, z], i) => obj({ t: 'sgB', x, z, ph: i + 1 }));
[[0, 60], [50, 110], [100, 150]].forEach(([a, b], i) => obj({ t: 'phase', ph: i + 1, x: (a + b) / 2, z: 30, sx: b - a, sz: 60 }));
// a few room props near the last core
for (const [k, x, z, o] of [['table', 130, 22, { L: 6 }], ['bench', 130, 20.5, { L: 5 }], ['crate', 142, 40], ['barrel', 143, 42]]) obj(Object.assign({ t: 'rp_' + k, x, z }, o || {}));
M.seq = id;
fs.mkdirSync('maps/build', { recursive: true });
fs.writeFileSync('maps/build/siege-demo.json', JSON.stringify(MD.pack(M)));
const dim = o => MD.OBJ[o.t] && MD.OBJ[o.t].cat === 'prim' ? { ex: (o.sx || 1) / 2, ez: (o.sz || 1) / 2, h: o.sy || 1, col: 1, brk: 0, cs: 1 } : null;
const G = MD.gameData(M, dim);
console.log('siege-demo written •', MD.check(M, G).map(q => q.lv + ' ' + q.t).join(' | '));
