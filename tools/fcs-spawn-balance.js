// วัดระยะเดินจริง (ตามช่องที่เดินได้) จากจุดเกิดถึงแกนของแต่ละเฟส — แผนที่บุกปราสาท (maps/<id>.json)
// ใช้: node tools/fcs-spawn-balance.js [id] [--apply]
//   ไม่ใส่ --apply = แค่รายงาน • --apply = ขยับจุดเกิดฝ่ายบุกเข้าหาแกนตามทางเดิน จน "เวลาเกิด + เวลาวิ่ง" ของสองฝ่ายต่างกันไม่เกิน SLACK วิ
// เวลา: เดิน 175 px/วิ (PLAY.walk) • 1 ช่อง = 90 px • เวลาเกิด SGV.respawn [บุก 8, รับ 10]
const fs = require('fs'), path = require('path');
const id = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || 'firstcastlestrike', apply = process.argv.includes('--apply');
const file = path.join(__dirname, '..', 'maps', id + '.json'), m = JSON.parse(fs.readFileSync(file, 'utf8'));
const W = m.w, H = m.h, CELL_S = 90 / 175, RESP = [8, 10], SLACK = 3;
const ph = m.zones.filter(z => z.kind === 'phase'), num = s => +((String(s).match(/(\d+)\s*$/) || [])[1] || 0);
const free = (x, y, p) => x >= 0 && y >= 0 && x < W && y < H && !m.wall[y][x] && !(m.walk[y] && m.walk[y][x] === 2) && ph.some(z => num(z.name) === p && x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h);
const climb = (a, b) => Math.abs(m.height[b[1]][b[0]] - m.height[a[1]][a[0]]) <= 1;   // ต่าง 1 ระดับ = เนินเดินขึ้นได้
function field(cx, cy, p) {
  const d = Array.from({ length: H }, () => new Array(W).fill(Infinity)), q = [[cx, cy]]; d[cy][cx] = 0;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [dx, dy, c] of [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]]) {
      const nx = x + dx, ny = y + dy; if (!free(nx, ny, p) || !climb([x, y], [nx, ny])) continue;
      if (dx && dy && (!free(x + dx, y, p) || !free(x, y + dy, p))) continue;
      if (d[ny][nx] > d[y][x] + c + 1e-9) { d[ny][nx] = d[y][x] + c; q.push([nx, ny]); }
    }
  }
  return d;
}
const objs = t => m.objs.filter(o => o.t === t), at = o => [Math.floor(o.x + o.w / 2), Math.floor(o.y + o.h / 2)];
let moved = 0;
for (const core of objs('point')) {
  const p = num(core.lb), [cx, cy] = at(core), F = field(cx, cy, p);
  const A = objs('spawnA').find(o => num(o.lb) === p), B = objs('spawnB').find(o => num(o.lb) === p);
  if (!A || !B) continue;
  const da = F[at(A)[1]][at(A)[0]], db = F[at(B)[1]][at(B)[0]], ta = RESP[0] + da * CELL_S, tb = RESP[1] + db * CELL_S;
  console.log(`เฟส ${p}: ฝ่ายบุก ${(da * 4.5).toFixed(0)} ม. (${(da * CELL_S).toFixed(1)} วิ) + เกิด ${RESP[0]} = ${ta.toFixed(1)} วิ • ฝ่ายรับ ${(db * 4.5).toFixed(0)} ม. (${(db * CELL_S).toFixed(1)} วิ) + เกิด ${RESP[1]} = ${tb.toFixed(1)} วิ • ต่าง ${(ta - tb).toFixed(1)} วิ`);
  if (!apply || ta - tb <= SLACK) continue;
  // เดินตามทางลงเขาของสนามระยะ จากจุดเกิดเดิม จนเหลือเวลาตามเป้า • จุดใหม่ต้องเป็นช่องว่าง 2×2
  const goal = (tb + SLACK - RESP[0]) / CELL_S; let [x, y] = at(A);
  while (F[y][x] > goal) { let best = null; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (ny >= 0 && ny < H && nx >= 0 && nx < W && F[ny][nx] < F[y][x] && (!best || F[ny][nx] < F[best[1]][best[0]])) best = [nx, ny]; } if (!best) break; [x, y] = best; }
  while (!(free(x, y, p) && free(x + 1, y, p) && free(x, y + 1, p) && free(x + 1, y + 1, p))) { x--; if (x < 0) break; }   // หาช่อง 2×2 ว่าง (ถอยไปทางฝ่ายบุก)
  console.log(`  → ย้ายจุดเกิดฝ่ายบุก ${A.x},${A.y} → ${x},${y} (เหลือ ${(F[y][x] * 4.5).toFixed(0)} ม.)`);
  A.note = (A.note ? A.note + ' • ' : '') + `ย้ายจาก ${A.x},${A.y} (tools/fcs-spawn-balance.js)`; A.x = x; A.y = y; moved++;
}
if (apply && moved) fs.writeFileSync(file, JSON.stringify(m));
