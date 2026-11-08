// แปลงแผนที่จาก Map Editor (maps/<id>.json) → ข้อมูลในเกม js/02-fcs-data.js (โหมดบุกปราสาท)
// ใช้: node tools/fcs-export.js [id]   (ค่าเริ่มต้น firstcastlestrike) — แก้แผนที่ใน mapedit.html แล้วรันใหม่
// เก็บเฉพาะที่เกมใช้: ความสูง / กำแพง / พื้นผิว (ตัวอักษร 1 ตัวต่อช่อง) + ของ + โซน
const fs = require('fs'), path = require('path');
const id = process.argv[2] || 'firstcastlestrike';
const root = path.join(__dirname, '..');
const m = JSON.parse(fs.readFileSync(path.join(root, 'maps', id + '.json'), 'utf8'));
const ch = v => { v = v | 0; if (v < 0 || v > 35) throw new Error('ค่าเกินช่วง ' + v); return v.toString(36); };
const grid = g => g.map(r => r.map(ch).join('')).join('');
// walk override 2 (ห้ามเดิน) = นับเป็นกำแพงทึบ
const wall = m.wall.map((r, y) => r.map((v, x) => (m.walk[y][x] === 2 && !v ? 1 : v)));
const T = { spawnA: 'sa', spawnB: 'sb', point: 'pt', breakwall: 'bw', gate: 'gt', pillar: 'pl', tree: 'tr', crate: 'cr' };
const objs = [];
for (const o of m.objs) {
  const t = T[o.t]; if (!t) { console.warn('ข้าม ชนิดที่เกมยังไม่รองรับ:', o.t, o.id); continue; }
  const n = (String(o.lb || '').match(/(\d+)\s*$/) || [])[1];   // เลขท้ายป้าย = เลขเฟส (จุดเกิด/จุดยึด)
  objs.push([t, o.x, o.y, o.w, o.h, n ? +n : 0, o.lv || 0]);
}
const zones = m.zones.map(z => [z.kind === 'phase' ? 'ph' : 'th', z.name, z.x, z.y, z.w, z.h, z.note || '']);
const out = { id, name: m.name, w: m.w, h: m.h, cell: m.cell, lvl: m.lvl, H: grid(m.height), W: grid(wall), S: grid(m.surf), objs, zones };
const js = `// สร้างอัตโนมัติจาก maps/${id}.json ด้วย node tools/fcs-export.js — ห้ามแก้มือ (แก้ใน mapedit.html แล้วรันใหม่)
// H = ความสูง (base36 ต่อช่อง) • W = กำแพง 0 ไม่มี 1 ทึบ 2 เตี้ย 3 รั้ว • S = พื้นผิว (index ใน Map Editor) • objs = [ชนิด, x, y, w, h, เลขเฟส, ระดับพื้น]
const FCS_DATA=${JSON.stringify(out)};
`;
fs.writeFileSync(path.join(root, 'js', '02-fcs-data.js'), js);
console.log('OK js/02-fcs-data.js', out.w + '×' + out.h, objs.length, 'ของ', zones.length, 'โซน', js.length, 'bytes');
