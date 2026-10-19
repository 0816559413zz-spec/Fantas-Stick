// ตรวจโค้ดก่อน push: node tools/check.js
// ต่อ js/*.js ตามลำดับใน FILES (index.html) เป็นไฟล์เดียวแล้วให้ node ตรวจไวยากรณ์ (ไม่รันเกม) + เช็กว่ารายชื่อไฟล์ตรงกับโฟลเดอร์ js/
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const m = html.match(/const FILES=\[([^\]]*)\]/);
if (!m) { console.error('ไม่เจอ FILES ใน index.html'); process.exit(1); }
const files = m[1].split(',').map(s => s.trim().replace(/'/g, '')).filter(Boolean);
const onDisk = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3)).sort();
const missing = files.filter(f => !onDisk.includes(f)), extra = onDisk.filter(f => !files.includes(f));
if (missing.length || extra.length) { console.error('FILES ไม่ตรงกับ js/ — ขาด:', missing, 'เกิน:', extra); process.exit(1); }
let code = '', starts = [];
for (const f of files) { let t = fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'); if (!t.endsWith('\n')) t += '\n'; starts.push([code.split('\n').length, f]); code += t; }
// VFX Studio (index.html?studio) ต่อท้ายด้วย tools/fx-lint.js + studio/studio.js — ตรวจไวยากรณ์รวมกันด้วย
for (const f of ['tools/fx-lint.js', 'studio/studio.js']) { if (!fs.existsSync(path.join(ROOT, f))) continue; let t = fs.readFileSync(path.join(ROOT, f), 'utf8'); if (!t.endsWith('\n')) t += '\n'; starts.push([code.split('\n').length, '../' + f.replace(/\.js$/, '')]); code += t; }
const tmp = path.join(os.tmpdir(), 'fantas-stick-check.mjs');
fs.writeFileSync(tmp, code);
try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' }); console.log('OK —', files.length, 'files,', code.split('\n').length - 1, 'lines'); }
catch (e) {
  const msg = String(e.stderr || e.message), ln = +(msg.match(/\.mjs:(\d+)/) || [])[1];
  if (ln) { let k = 0; while (k + 1 < starts.length && starts[k + 1][0] <= ln) k++; console.error(`js/${starts[k][1]}.js:${ln - starts[k][0] + 1}`); }
  console.error(msg.split('\n').slice(0, 6).join('\n')); process.exit(1);
}
