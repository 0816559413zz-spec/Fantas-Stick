// Breakable panel test map (guides/Destruction.md §13): maps/build/pnl-demo.json
//   brick house (mode p = holes + rubble) • plaster-over-brick house (mode l = skin falls off, then through) • stone base (l, thru 0 = damage only) + glass (g = whole pane)
//   • wood fence (p, burns) • unbreakable stone pillars at the house corners (normal Map Builder boxes)
// Export: python tools/serve.py (other window) then  node tools/headless.js --url "mapbuild.html?export=pnl-demo" --js tools/mb-export.js --quiet
// Play: index.html?nosw&playmap=pnl-demo
import fs from 'fs';
import * as MD from '../mapbuild/model.js';
const W = 70, H = 70;
const M = MD.newMap({ id: 'pnl-demo', name: 'Panel Demo (แผ่นพัง)', W, H, surf: 0 });
M.desc = 'ทดสอบแผ่นพัง: บ้านอิฐ (เป็นรู+กองซาก) • บ้านฉาบปูน (ผิวหลุดเป็นชั้น) • กระจก (แตกทั้งแผ่น) • รั้วไม้';
M.modes = ['ffa', 'tdm', 'coop', 'duel']; M.random = 0; M.autoProps = 0; M.sky = 'day';
let id = 1;
const nid = () => id++, P = Math.PI / 2;
const pn = (x, z, rot, L, sy, o = {}) => M.objs.push(Object.assign({ id: nid(), t: 'pn_wall', x, z, y: 0, rot, L, sy, T: 0.3, cs: 0.6 }, o));
const box = (x, z, sx, sy, sz, c) => M.objs.push({ id: nid(), t: 'box', x, z, y: 0, rot: 0, sx, sy, sz, c });
// house shell 8 × 6 m, door gap 1.6 m in the front (+z) wall with a lintel panel over it
function house(cx, cz, o, pillar) {
  const h = 3.6, x0 = cx - 4, x1 = cx + 4, z0 = cz - 3, z1 = cz + 3, d0 = cx - 0.8, d1 = cx + 0.8;
  pn(cx, z0, 0, 8, h, o);
  pn((x0 + d0) / 2, z1, 0, d0 - x0, h, o); pn((d1 + x1) / 2, z1, 0, x1 - d1, h, o); pn(cx, z1, 0, 1.6, 1.2, Object.assign({ y: 2.4 }, o));
  pn(x0, cz, P, 6, h, o); pn(x1, cz, P, 6, h, o);
  if (pillar) for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) box(x, z, 0.7, h + 0.4, 0.7, '#8a8478');
}
house(20, 22, { mat: 'brick', m: 'p', g: 'A' }, true);
house(48, 22, { mat: 'plaster', m: 'l', cs: 0.5, g: 'B' }, true);
// stone base wall (damage only) with three glass panes on top
pn(20, 44, 0, 9, 1, { mat: 'stone', m: 'l', thru: 0, cs: 0.5, T: 0.5, g: 'C' });
for (const i of [-1, 0, 1]) pn(20 + i * 3, 44, 0, 2.8, 1.8, { mat: 'glass', m: 'g', y: 1, T: 0.1, g: 'C', hp: 20 });
for (const i of [-1.5, -0.5, 0.5, 1.5]) box(20 + i * 3, 44, 0.25, 2.9, 0.6, '#6a5a48');
// wood fence
pn(48, 44, 0, 10, 2.2, { mat: 'wood', m: 'p', cs: 0.5, T: 0.15, g: 'D' });
const sp = [[10, 8], [60, 8], [10, 62], [60, 62], [35, 10], [35, 60], [8, 35], [62, 35]];
sp.forEach(([x, z]) => M.objs.push({ id: nid(), t: 'spawn', x, z, y: 0, rot: 0 }));
M.objs.push({ id: nid(), t: 'spawnR', x: 6, z: H / 2, y: 0, rot: P }, { id: nid(), t: 'spawnB', x: W - 6, z: H / 2, y: 0, rot: -P });
M.seq = id;
fs.writeFileSync('maps/build/pnl-demo.json', JSON.stringify(MD.pack(M)));
console.log('pnl-demo written', W + 'x' + H, M.objs.filter(o => o.t === 'pn_wall').length + ' panels');
