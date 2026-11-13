// เติมที่กำบังในที่โล่งของแผนที่ Map Editor (maps/<id>.json) — ผังเดิมไม่ถูกแตะ: เพิ่มเฉพาะกำแพงเตี้ย (wall=2) + ลัง
// ใช้: node tools/fcs-cover.js [id] [--dry]   แล้ว node tools/fcs-export.js [id]   (ผู้ใช้ 2026-11-13: "มีที่กำบังเพิ่ม")
// กติกา: ช่องว่างที่ห่างกำแพง/ของเดิม ≥ OPEN ช่อง, พื้นเรียบ, ไม่ใกล้จุดเกิด/แกนเกินไป → วางที่กำบังทีละอันจากที่โล่งที่สุดก่อน
//   แล้วกันรัศมี GAP รอบอันที่วาง • ทิศ: ฝ่ายบุกเดิน +x (ซ้าย→ขวา) → กำแพงเตี้ยวางแนวตั้ง (ตามแกน y) กันยิงตามแนว x
// ของที่เพิ่มมีป้าย "ที่กำบัง (Claude)" + id ขึ้นต้น cv → ลบ/ย้ายใน mapedit.html ได้ • รันซ้ำ = ลบของเดิมที่ตัวเองใส่ก่อน
const fs = require('fs'), path = require('path');
const id = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || 'firstcastlestrike', dry = process.argv.includes('--dry');
const file = path.join(__dirname, '..', 'maps', id + '.json'), m = JSON.parse(fs.readFileSync(file, 'utf8'));
const W = m.w, H = m.h, OPEN = 4, GAP = 7, NEAR_SPAWN = 6, NEAR_POINT = 3;
// ล้างของที่สคริปต์นี้เคยใส่
const mine = m.objs.filter(o => String(o.id).startsWith('cv'));
for (const o of mine) if (o.t === 'lowwall' || /กำแพงเตี้ย/.test(o.note || '')) for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (m.wall[y][x] === 2) m.wall[y][x] = 0;
m.objs = m.objs.filter(o => !String(o.id).startsWith('cv'));
const blocked = (x, y) => x < 0 || y < 0 || x >= W || y >= H || m.wall[y][x] || (m.walk[y] && m.walk[y][x] === 2);
// ระยะถึงกำแพง (BFS แบบ chebyshev)
const dist = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => Math.min(x + 1, y + 1, W - x, H - y))), q = [];   // ขอบแผนที่ = กำแพง
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (blocked(x, y)) { dist[y][x] = 0; q.push([x, y]); }
for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; if (dist[ny][nx] > dist[y][x] + 1) { dist[ny][nx] = dist[y][x] + 1; q.push([nx, ny]); } } }
// ของเดิม = จุดกันระยะ (ต้นไม้/ลัง/เสา ก็เป็นที่กำบังอยู่แล้ว)
const pts = m.objs.map(o => ({ x: o.x + o.w / 2, y: o.y + o.h / 2, t: o.t }));
const cd = (x, y) => Math.min(99, ...pts.map(p => { const d = Math.max(Math.abs(p.x - x - 0.5), Math.abs(p.y - y - 0.5)); return p.t === 'spawnA' || p.t === 'spawnB' ? d - NEAR_SPAWN + OPEN : p.t === 'point' ? d - NEAR_POINT + OPEN : d; }));
const flat = (x, y) => { const h = m.height[y][x]; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const r = m.height[y + dy]; if (!r || r[x + dx] !== h) return false; } return true; };
// เฉพาะในพื้นที่เล่นของเฟส (โซนชนิด phase)
const ph = m.zones.filter(z => z.kind === 'phase'), inPh = (x, y) => ph.some(z => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h);
const added = [];let n = 0;
for (;;) {
  let best = null, bs = 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (blocked(x, y) || !inPh(x, y) || !flat(x, y)) continue;
    const s = Math.min(dist[y][x], cd(x, y), ...added.map(a => Math.max(Math.abs(a.x - x), Math.abs(a.y - y)) - GAP + OPEN));
    if (s >= OPEN && s > bs) { bs = s; best = [x, y]; }
  }
  if (!best) break;
  const [x, y] = best;
  // กำแพงเตี้ยแนวตั้ง 3 ช่อง ถ้าวางได้ทั้งหมด • ไม่งั้น = ลัง 1 ช่อง
  const seg = [-1, 0, 1].every(d => !blocked(x, y + d) && flat(x, y + d) && inPh(x, y + d)) && n % 3 !== 2;
  if (seg) { for (const d of [-1, 0, 1]) m.wall[y + d][x] = 2; m.objs.push({ id: 'cv' + n, t: 'deco', x, y: y - 1, w: 1, h: 3, rot: 0, lb: 'ที่กำบัง (Claude)', note: 'กำแพงเตี้ย 1.2 ม. เพิ่มโดย tools/fcs-cover.js', foot: 'none' }); }
  else m.objs.push({ id: 'cv' + n, t: 'crate', x, y, w: 1, h: 1, rot: 0, lb: 'ที่กำบัง (Claude)', note: 'ลัง เพิ่มโดย tools/fcs-cover.js', foot: 'none' });
  added.push({ x, y }); n++;
  for (const d of seg ? [-1, 0, 1] : [0]) { dist[y + d][x] = 0; }
}
console.log((dry ? '[ทดลอง] ' : '') + 'เพิ่มที่กำบัง', n, 'จุด:', added.map(a => a.x + ',' + a.y).join(' '));
if (!dry) fs.writeFileSync(file, JSON.stringify(m));
