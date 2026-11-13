// เติมที่กำบังในแผนที่ Map Editor (maps/<id>.json) — ผังเดิมไม่ถูกแตะ: เพิ่มเฉพาะกำแพงเตี้ย (wall=2) + หิน + เสา
// ใช้: node tools/fcs-cover.js [id] [--dry]   แล้ว node tools/fcs-export.js [id]
// ผู้ใช้ 2026-11-13: "มีที่กำบังเพิ่ม" → ต่อมา "อยากให้มีพวก หิน เสา เพิ่ม เอากล่องสีน้ำตาลออก ... โซนป่าด้านนอกมีที่กำบังเพิ่ม ... มีที่กำบังเวลาอยู่ในโซนยึด"
// ขั้น:
//   0. ลังทุกอัน (ของเดิมในแผนที่) → หิน (ชนิด rock ใน Map Editor, ตำแหน่งเดิม)
//   1. ที่โล่งในพื้นที่เฟส: ห่างกำแพง/ของเดิม ≥ OPEN ช่อง → กำแพงเตี้ยแนวตั้ง 3 ช่อง / หิน / เสา สลับกัน (จากที่โล่งที่สุดก่อน กันรัศมี GAP)
//   2. ป่า (ช่องที่มีต้นไม้รอบ ๆ ≥ FOREST_N ต้นในรัศมี FOREST_R): หิน/เสา/หินใหญ่ ถี่กว่า (OPEN_F, GAP_F) → เข้าไฟต์จากต้นไม้ถึงหินได้
//   3. รอบจุดยึด: วงแหวนรัศมี RING ช่อง (เขตยึด 330 px ≈ 3.7 ช่อง) 8 ทิศ: ซ้าย/ขวา = กำแพงเตี้ย 2 ช่อง, บน/ล่าง = เสา, ทแยง = หิน
//      → ยืนยึดแล้วมีที่หลบสกิลที่สาดเข้ามา แต่มีช่องเดินเข้าออกทุกทิศ
//   ทิศ: ฝ่ายบุกเดิน +x (ซ้าย→ขวา) → กำแพงเตี้ยวางแนวตั้ง (ตามแกน y) กันยิงตามแนว x
// ของที่เพิ่มมีป้าย "ที่กำบัง (Claude)" + id ขึ้นต้น cv → ลบ/ย้ายใน mapedit.html ได้ • รันซ้ำ = ลบของเดิมที่ตัวเองใส่ก่อน
const fs = require('fs'), path = require('path');
const id = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || 'firstcastlestrike', dry = process.argv.includes('--dry');
const file = path.join(__dirname, '..', 'maps', id + '.json'), m = JSON.parse(fs.readFileSync(file, 'utf8'));
const W = m.w, H = m.h, OPEN = 4, GAP = 7, NEAR_SPAWN = 6, NEAR_POINT = 3;
const OPEN_F = 1, GAP_F = 3, FOREST_R = 5, FOREST_N = 3, RING = 1.5;
const LB = 'ที่กำบัง (Claude)';
// ล้างของที่สคริปต์นี้เคยใส่
const mine = m.objs.filter(o => String(o.id).startsWith('cv'));
for (const o of mine) if (o.t === 'lowwall' || /กำแพงเตี้ย/.test(o.note || '')) for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (m.wall[y][x] === 2) m.wall[y][x] = 0;
m.objs = m.objs.filter(o => !String(o.id).startsWith('cv'));
// 0. ลัง → หิน
let conv = 0;
for (const o of m.objs) if (o.t === 'crate') { o.t = 'rock'; o.note = (o.note ? o.note + ' • ' : '') + 'เดิมเป็นลัง (tools/fcs-cover.js)'; conv++; }
const blocked = (x, y) => x < 0 || y < 0 || x >= W || y >= H || m.wall[y][x] || (m.walk[y] && m.walk[y][x] === 2);
const occ = (x, y) => m.objs.some(o => o.t !== 'deco' && x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h);
// ระยะถึงกำแพง (BFS แบบ chebyshev) • ขอบแผนที่ = กำแพง
const dist = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => Math.min(x + 1, y + 1, W - x, H - y))), q = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (blocked(x, y)) { dist[y][x] = 0; q.push([x, y]); }
for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; if (dist[ny][nx] > dist[y][x] + 1) { dist[ny][nx] = dist[y][x] + 1; q.push([nx, ny]); } } }
// ของเดิม = จุดกันระยะ (ต้นไม้/หิน/เสา ก็เป็นที่กำบังอยู่แล้ว)
const pts = m.objs.filter(o => o.t !== 'deco').map(o => ({ x: o.x + o.w / 2, y: o.y + o.h / 2, t: o.t }));
const cd = (x, y, open) => Math.min(99, ...pts.map(p => { const d = Math.max(Math.abs(p.x - x - 0.5), Math.abs(p.y - y - 0.5)); return p.t === 'spawnA' || p.t === 'spawnB' ? d - NEAR_SPAWN + open : p.t === 'point' ? d - NEAR_POINT + open : d; }));
const flat = (x, y) => { const h = m.height[y][x]; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const r = m.height[y + dy]; if (!r || r[x + dx] !== h) return false; } return true; };
const ph = m.zones.filter(z => z.kind === 'phase'), inPh = (x, y) => ph.some(z => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h);
const trees = m.objs.filter(o => o.t === 'tree');
const forest = (x, y) => trees.filter(t => Math.max(Math.abs(t.x - x), Math.abs(t.y - y)) <= FOREST_R).length >= FOREST_N;
const nearSpawn = (x, y, r) => m.objs.some(o => (o.t === 'spawnA' || o.t === 'spawnB') && Math.max(Math.abs(o.x + o.w / 2 - x - 0.5), Math.abs(o.y + o.h / 2 - y - 0.5)) < r);
const added = []; let n = 0;
const ok = (x, y) => !blocked(x, y) && inPh(x, y) && flat(x, y) && !occ(x, y);
// วางของ 1 ชิ้น: k = 'wall'(แนวตั้ง len ช่อง) | 'wallh'(แนวนอน) | 'rock' | 'rockbig' | 'pillar' • zone = เหตุผล (เก็บใน note)
function place(k, x, y, len, zone) {
  const idn = 'cv' + n;
  if (k === 'wall' || k === 'wallh') {
    const cs = Array.from({ length: len }, (_, i) => k === 'wall' ? [x, y + i] : [x + i, y]);
    for (const [cx, cy] of cs) { m.wall[cy][cx] = 2; dist[cy][cx] = 0; }
    m.objs.push({ id: idn, t: 'deco', x, y, w: k === 'wall' ? 1 : len, h: k === 'wall' ? len : 1, rot: 0, lb: LB, note: `กำแพงเตี้ย 1.2 ม. (${zone}) เพิ่มโดย tools/fcs-cover.js`, foot: 'none' });
  } else {
    const s = k === 'rockbig' ? 2 : 1;
    m.objs.push({ id: idn, t: k === 'pillar' ? 'pillar' : 'rock', x, y, w: s, h: s, rot: 0, lb: LB, note: `${k === 'pillar' ? 'เสา' : 'หิน'} (${zone}) เพิ่มโดย tools/fcs-cover.js`, foot: 'none' });
    for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) dist[y + dy][x + dx] = 0;
  }
  added.push({ x, y, k, zone }); pts.push({ x: x + 0.5, y: y + 0.5, t: k }); n++;
}
// 3. รอบจุดยึด (ก่อน เพื่อให้ได้ตำแหน่งตามแบบ)
for (const p of m.objs.filter(o => o.t === 'point')) {
  const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
  const R = RING + p.w / 2;
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, x = Math.floor(cx + Math.cos(a) * R), y = Math.floor(cy + Math.sin(a) * R);
    if (nearSpawn(x, y, 4)) continue;
    if (i === 0 || i === 4) { if ([0, 1].every(d => ok(x, y + d))) place('wall', x, y, 2, 'จุดยึด'); else if (ok(x, y)) place('rock', x, y, 1, 'จุดยึด'); }
    else if (i === 2 || i === 6) { if (ok(x, y)) place('pillar', x, y, 1, 'จุดยึด'); }
    else if (ok(x, y)) place('rock', x, y, 1, 'จุดยึด');
  }
}
// 1+2. ที่โล่ง + ป่า: เลือกช่องที่โล่งที่สุดทีละอัน
for (const pass of ['open', 'forest']) {
  const O = pass === 'open' ? OPEN : OPEN_F, G = pass === 'open' ? GAP : GAP_F;
  for (let c = 0; ; c++) {
    let best = null, bs = 0;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (!ok(x, y)) continue;
      if (pass === 'forest' && !forest(x, y)) continue;
      const s = Math.min(dist[y][x], cd(x, y, O), ...added.map(a => Math.max(Math.abs(a.x - x), Math.abs(a.y - y)) - G + O));
      if (s >= O && s > bs) { bs = s; best = [x, y]; }
    }
    if (!best) break;
    const [x, y] = best;
    if (pass === 'open') {
      const seg = c % 3 !== 2 && [-1, 0, 1].every(d => ok(x, y + d));
      if (seg) place('wall', x, y - 1, 3, 'ที่โล่ง'); else place(c % 2 ? 'pillar' : 'rock', x, y, 1, 'ที่โล่ง');
    } else {
      const big = c % 4 === 1 && [[1, 0], [0, 1], [1, 1]].every(([dx, dy]) => ok(x + dx, y + dy) && dist[y + dy][x + dx] >= 1);
      place(big ? 'rockbig' : c % 3 === 2 ? 'pillar' : 'rock', x, y, 1, 'ป่า');
    }
  }
}
const by = {}; for (const a of added) { const k = a.zone + ':' + a.k; by[k] = (by[k] || 0) + 1; }
console.log((dry ? '[ทดลอง] ' : '') + 'ลัง→หิน', conv, '• เพิ่มที่กำบัง', n, 'ชิ้น', JSON.stringify(by));
if (!dry) fs.writeFileSync(file, JSON.stringify(m));
