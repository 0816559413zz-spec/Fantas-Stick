// Courtyard prefabs (user 2026-11-22: "castle yards are empty — make room prefabs"): 5 open yards for Map Builder
//   room-yard-market / room-yard-training / room-yard-garden / room-yard-smithy / room-yard-camp
// No walls: drop into a walled yard (Place → Room Prefabs), then "explode into map" to edit piece by piece.
// Rules: centre cross lane (≈4 m) kept clear for siege pushes, cover clustered near the edges, nothing over 6 m
// that blocks fliers, few real lights (flames/lanterns are game-drawn). Run: node tools/yard-prefabs.mjs
import fs from 'fs';
import * as MD from '../mapbuild/model.js';
const PI = Math.PI;
function yard(id, name, desc, W, H, surf, build) {
  const M = MD.newMap({ id, name, W, H, surf });
  M.desc = desc; M.modes = ['ffa', 'tdm', 'coop']; M.random = 0; M.autoProps = 0; M.sky = 'day'; M.style = 'castle-stone';
  let n = 1; const o = (t, x, z, e = {}) => { M.objs.push(Object.assign({ id: n++, t, x: +x.toFixed(2), z: +z.toFixed(2), y: 0, rot: 0 }, e)); };
  const K = (k, x, z, rot = 0, s = 1, e = {}) => o('kit:' + k, x, z, Object.assign({ rot, s }, e));
  const P = (t, x, z, sx, sy, sz, c, e = {}) => o(t, x, z, Object.assign({ sx, sy, sz, c }, e));   // prim (y = bottom)
  const D = (t, x, z, e) => o('dc_' + t, x, z, e);                                                // game-drawn decor (box/cyl: y = centre)
  const floor = (x, z, sx, sz, k = 'floor') => D('box', x, z, { k, y: 0.03, sx, sy: 0.06, sz });
  build({ o, K, P, D, floor, W, H });
  M.seq = n;
  fs.writeFileSync('maps/build/' + id + '.json', JSON.stringify(MD.pack(M)));
  console.log(id, W + 'x' + H, M.objs.length, 'items');
}
const WOOD = '#8a6440', DARKW = '#5a4130', STRAW = '#d6bf78';
// lantern posts at the four corners
const corners = (K, W, H, k = 'valley/lantern_1', m = 2) => [[m, m], [W - m, m], [m, H - m], [W - m, H - m]].forEach(([x, z]) => K(k, x, z));

// 1) MARKET: stalls along both long sides, well in the middle, carts/crates as cover
yard('room-yard-market', 'ลานตลาด (Market Yard)', 'แผงขายของผ้าใบสี บ่อน้ำกลางลาน เกวียน ลัง กระสอบ — ทางเดินกลางโล่ง', 32, 24, 6, ({ o, K, P, D, floor, W, H }) => {
  floor(W / 2, H / 2, W - 2, H - 2);
  for (const z of [5.5, H - 5.5]) D('box', W / 2, z, { k: 'carpet', y: 0.07, sx: 3, sy: 0.02, sz: 7 });   // red runners from the edges to the well
  [7, 16, 25].forEach((x, i) => K('valley/market_stall', x, 3.2, 0, 1));
  [9, 23].forEach((x, i) => K(i ? 'hogsmeade/hog_stall_2' : 'hogsmeade/hog_stall_0', x, H - 3.2, PI));
  // two hand-built awning stalls on the west side (counter + posts + striped canopy)
  [[3.4, 9, '#b8403a', '#e8d6a0'], [3.4, 15, '#2f5fa0', '#e8d6a0']].forEach(([x, z, a, b]) => {
    P('box', x + 0.6, z, 1, 1, 3.2, WOOD, { col: 1 });
    for (const dz of [-1.6, 1.6]) for (const dx of [-0.9, 1.1]) P('cyl', x + dx, z + dz, 0.16, 2.9, 0.16, DARKW);
    P('wedge', x + 0.1, z - 0.9, 2.6, 0.5, 1.8, a, { y: 2.9, rot: PI / 2 }); P('wedge', x + 0.1, z + 0.9, 2.6, 0.5, 1.8, b, { y: 2.9, rot: PI / 2 });
    o('rp_crate', x - 0.4, z + 2.4); o('rp_sack', x + 0.2, z - 2.4);
  });
  K('valley/well', W / 2, H / 2, 0, 1);
  o('rp_cart', W - 4, H / 2 + 1, { rot: 0.35 }); o('rp_barrels', W - 3, H / 2 - 3); o('rp_crate2', W - 5.5, H / 2 - 3.5);
  for (const [x, z] of [[12, 6], [20, 6.3], [12.5, H - 6.4], [19.6, H - 6]]) { o('rp_crate', x, z, { rot: Math.random() }); o('rp_sack', x + 1.3, z + 0.4); }
  o('rp_barrel', 5.5, 5); o('rp_barrel', 6.6, 5.6); o('rp_keg', W - 5, H - 5);
  for (const [x, z] of [[2, 6], [2, 18], [W - 2, 6], [W - 2, 18]]) K('valley/flower_084', x, z, Math.random() * 6, 1.8);
  corners(K, W, H);
});

// 2) TRAINING YARD: sparring ring, dummies, archery range, weapon racks
yard('room-yard-training', 'ลานฝึก (Training Yard)', 'วงต่อสู้ หุ่นฟาง เป้าธนู ชั้นวางอาวุธ — ทางกลางโล่ง', 30, 24, 3, ({ o, K, P, D, floor, W, H }) => {
  P('cyl', W / 2, H / 2, 11, 0.05, 11, '#b9a47a');                  // sand sparring ring (flat, no collision)
  P('cyl', W / 2, H / 2, 11.6, 0.03, 11.6, '#7a6448');
  for (let i = 0; i < 10; i++) { const a = i / 10 * 2 * PI + 0.3; if (Math.abs(Math.sin(a)) > 0.9) continue; P('cyl', W / 2 + Math.cos(a) * 5.9, H / 2 + Math.sin(a) * 5.9, 0.25, 1.1, 0.25, DARKW, { col: 1 }); }
  // straw dummies (post + body + head + arm bar)
  [5, 8, 11].forEach(x => { const z = H - 3.5;
    P('cyl', x, z, 0.24, 2.2, 0.24, DARKW, { col: 1 }); P('cyl', x, z, 0.75, 1.0, 0.75, STRAW, { y: 0.9 }); P('ball', x, z, 0.5, 0.5, 0.5, STRAW, { y: 2.05 }); P('box', x, z, 1.5, 0.16, 0.16, DARKW, { y: 1.6 }); });
  // archery: targets on the east side, shooting line on the west
  [7, 12, 17].forEach(z => { const x = W - 2.6;
    for (const dz of [-0.5, 0.5]) P('cyl', x + 0.3, z + dz, 0.14, 1.6, 0.14, DARKW);
    P('box', x, z, 0.25, 1.5, 1.5, STRAW, { y: 0.9, col: 1 }); P('box', x - 0.14, z, 0.04, 0.9, 0.9, '#f2efe6', { y: 1.2 }); P('box', x - 0.16, z, 0.04, 0.45, 0.45, '#b8403a', { y: 1.42 });
    K('pitch/pitch_hay_0', x + 1.4, z + 1.6, Math.random() * 6, 0.4); });
  P('box', 4.5, H / 2, 0.15, 0.03, 14, '#e8e0cc');                    // chalk shooting line
  o('rp_rack', 4, 2.6); o('rp_rack', 8, 2.6); o('rp_armor', 12, 2.6, { rot: PI }); o('rp_armor', 18, 2.6, { rot: PI }); o('rp_rack', 22, 2.6);
  o('rp_bench', 2.2, 8, { rot: PI / 2, L: 4 }); o('rp_barrel', 2.4, 13); o('rp_barrel', 2.4, 14.2);
  K('castle/castle_brazier_0', 2.5, 2.5, 0, 0.4); K('castle/castle_brazier_0', W - 2.5, H - 2.5, 0, 0.4);
});

// 3) GARDEN: fountain in the middle, four planted beds, benches, statue
yard('room-yard-garden', 'สวนน้ำพุ (Fountain Garden)', 'น้ำพุกลาง ทางเดินปูหินรูปกากบาท แปลงต้นไม้ พุ่มไม้ ดอกไม้ ม้านั่ง', 30, 24, 0, ({ o, K, P, D, floor, W, H }) => {
  floor(W / 2, H / 2, W, 3.6); floor(W / 2, H / 2, 3.6, H); floor(W / 2, H / 2, 10, 10);
  // fountain: basin + water + column + top bowl, collision ring
  D('cyl', W / 2, H / 2, { k: 'stone', y: 0.45, rt: 3.3, rb: 3.5, sy: 0.9, seg: 16 });
  P('cyl', W / 2, H / 2, 5.8, 0.06, 5.8, '#4f86a8', { y: 0.92 });
  D('cyl', W / 2, H / 2, { k: 'stone', y: 1.4, rt: 0.35, rb: 0.5, sy: 2.4, seg: 10 }); D('cyl', W / 2, H / 2, { k: 'stone', y: 2.7, rt: 1.2, rb: 0.45, sy: 0.45, seg: 12 });
  o('col_cyl', W / 2, H / 2, { sx: 7, sy: 1.2, sz: 7 });
  // beds: hedge edges + a tree + bushes + flowers per quadrant
  for (const [qx, qz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const cx = W / 2 + qx * 8.2, cz = H / 2 + qz * 6.6;
    P('box', cx, H / 2 + qz * 2.6, 9, 1.1, 0.9, '#3f6a34', { col: 1 });           // hedge along the path
    K(qx < 0 ? 'meadow/meadow_tree' : 'valley/tree_01', cx + qx * 1.5, cz + qz * 1.2, Math.random() * 6, 0.9);
    K('forest/forest_bush', cx - qx * 2.6, cz, Math.random() * 6, 1.1); K('forest/forest_bush.045', cx + qx * 3.2, cz - qz * 1.6, Math.random() * 6, 1);
    for (let i = 0; i < 6; i++) K(['meadow/meadow_flower', 'valley/flower_004', 'valley/flower_160'][i % 3], cx + (Math.random() - 0.5) * 7, cz + (Math.random() - 0.5) * 3.5, Math.random() * 6, 1.6);
  }
  for (const [x, z, r] of [[W / 2, H / 2 - 4.6, 0], [W / 2, H / 2 + 4.6, PI], [W / 2 - 4.6, H / 2, PI / 2], [W / 2 + 4.6, H / 2, -PI / 2]]) K('castle/castle_bench_0', x, z, r);
  K('castle/castle_statue', 3, 3, PI / 4, 0.4); K('castle/castle_column_2', W - 2.4, 2.4, 0, 0.4);
  corners(K, W, H, 'valley/lantern_5', 1.4);
});

// 4) SMITHY + STABLE: open forge shed (west), stable stalls with hay (east)
yard('room-yard-smithy', 'โรงตีเหล็ก + คอกม้า (Smithy & Stable)', 'เพิงเตาหลอม (ไฟเรือง ปล่องควัน ทั่ง) + คอกม้ามีฟาง รางน้ำ เกวียน', 32, 24, 4, ({ o, K, P, D, floor, W, H }) => {
  // forge shed (x 2..12, z 2..10): posts + gable roof + forge + chimney + anvil
  for (const [x, z] of [[2.5, 2.5], [11.5, 2.5], [2.5, 9.5], [11.5, 9.5]]) { D('cyl', x, z, { k: 'wood', y: 2.1, rt: 0.22, rb: 0.26, sy: 4.2, seg: 8 }); o('col_cyl', x, z, { sx: 0.6, sy: 4, sz: 0.6 }); }
  D('roof', 7, 6, { y: 4.2, sx: 10.6, sz: 8, sy: 2.4 });
  floor(7, 6, 9.5, 7.5);
  D('box', 4.2, 3.6, { k: 'stone', y: 0.7, sx: 3, sy: 1.4, sz: 2.2 }); D('box', 4.2, 3.6, { k: 'lit', y: 1.0, sx: 1.6, sy: 0.5, sz: 1.2 }); D('flame', 4.2, 3.6, { y: 1.45 });
  D('box', 4.2, 2.6, { k: 'stone', y: 4, sx: 1.3, sy: 8, sz: 1.3 }); o('col_box', 4.2, 3.4, { sx: 3, sy: 2, sz: 2.6 });
  D('cyl', 7.6, 5.2, { k: 'wood', y: 0.4, rt: 0.45, rb: 0.5, sy: 0.8, seg: 10 }); D('box', 7.6, 5.2, { k: 'iron', y: 0.95, sx: 1, sy: 0.3, sz: 0.45 });
  P('box', 9.8, 4, 1.8, 0.8, 0.8, DARKW, { col: 1 }); P('box', 9.8, 4, 1.6, 0.04, 0.6, '#4f86a8', { y: 0.72 });   // quench trough
  o('rp_rack', 11, 8.6, { rot: PI }); o('rp_woodpile', 2.2, 11.8); o('rp_barrel', 5, 11.6); o('rp_crate', 6.4, 11.8);
  K('castle/castle_brazier_1', 13.4, 2.4, 0, 0.4);
  // stable (x 18..30, z 1..8): back roof on posts + 3 stalls + hay + trough
  for (const x of [18.5, 22.5, 26.5, 30.5]) { D('cyl', x, 7.6, { k: 'wood', y: 1.6, rt: 0.2, rb: 0.22, sy: 3.2, seg: 8 }); o('col_cyl', x, 7.6, { sx: 0.5, sy: 3.2, sz: 0.5 }); }
  D('roof', 24.5, 4.4, { y: 3.2, sx: 13, sz: 7.4, sy: 2 });
  D('box', 24.5, 1.2, { k: 'wood', y: 1.4, sx: 12.4, sy: 2.8, sz: 0.25 });                     // back boards
  for (const x of [18.5, 22.5, 26.5, 30.5]) D('box', x, 4.4, { k: 'wood', y: 0.75, sx: 0.2, sy: 1.5, sz: 6 });
  for (const x of [20.5, 24.5, 28.5]) { K('pitch/pitch_hay_2', x, 3, Math.random() * 6, 0.45); P('box', x, 6.6, 2.2, 0.7, 0.6, DARKW, { col: 1 }); }
  o('col_box', 24.5, 1.2, { sx: 12.4, sy: 2.8, sz: 0.5 });
  o('rp_cart', 24, 16.5, { rot: -0.4 }); o('rp_sack', 27, 17.5); o('rp_sack', 27.8, 16.6); K('pitch/pitch_hay_0', 29.5, 20, 0.4, 0.45);
  o('rp_barrels', 3.5, 19); o('rp_crate2', 5.5, 20.5);
});

// 5) CAMP: tents around a central fire, supply pile, weapon racks
yard('room-yard-camp', 'ค่ายทหาร (Soldier Camp)', 'เต็นท์รอบกองไฟ ขอนไม้นั่ง กองเสบียง ชั้นวางอาวุธ', 30, 24, 3, ({ o, K, P, D, floor, W, H }) => {
  K('ruins/ruins_tent_0', 4.5, 4.5, PI / 4); K('ruins/ruins_tent_1', W - 4.5, 4.5, -PI / 4); K('ruins/ruins_tent_0', 4.5, H - 4.5, 3 * PI / 4); K('ruins/ruins_tent_1', W - 4.5, H - 4.5, -3 * PI / 4);
  [[W / 2 - 6, 3.2, '#c8b48a'], [W / 2 + 6, H - 3.2, '#a89a7a']].forEach(([x, z, c]) => { P('cone', x, z, 4.6, 3.2, 4.6, c, { seg: 4, col: 1 }); P('cyl', x, z, 0.12, 3.8, 0.12, DARKW); });
  // campfire: stone ring + fire + logs to sit on
  for (let i = 0; i < 8; i++) { const a = i / 8 * 2 * PI; K('meadow/meadow_stone_0', W / 2 + Math.cos(a) * 1.3, H / 2 + Math.sin(a) * 1.3, a, 0.12); }
  D('flame', W / 2, H / 2, { y: 0.3 }); D('flame', W / 2 + 0.3, H / 2 - 0.2, { y: 0.25 });
  for (let i = 0; i < 3; i++) { const a = i / 3 * 2 * PI + 0.5; K('forest/forest_log', W / 2 + Math.cos(a) * 3.4, H / 2 + Math.sin(a) * 3.4, a + PI / 2, 0.35); }
  o('rp_woodpile', W / 2 + 5, H / 2 + 4);
  // supply pile + racks
  o('rp_crate', W - 3, H / 2 - 1); o('rp_crate2', W - 3.4, H / 2 + 1); o('rp_barrels', W - 5.4, H / 2); o('rp_sack', W - 2.4, H / 2 + 2.6); o('rp_keg', W - 2.6, H / 2 - 3);
  o('rp_rack', 2.6, H / 2 - 2, { rot: PI / 2 }); o('rp_rack', 2.6, H / 2 + 2, { rot: PI / 2 }); o('rp_armor', 4.4, H / 2, { rot: PI / 2 });
  K('castle/castle_brazier_0', W / 2 - 6, H - 2.5, 0, 0.4); K('castle/castle_brazier_0', W / 2 + 6, 2.5, 0, 0.4);
});
