// สร้าง CODEMAP.md ใหม่: node tools/codemap.js  (รันทุกครั้งหลังเพิ่ม/ย้าย/ลบโค้ดใน js/)
// อ่านแค่บรรทัดที่ขึ้นต้นคอลัมน์ 0 (ระดับบนสุด): function / const / let / var และหัวข้อ "// -----" / "// =====" — ไม่ต้องลงแพ็กเกจเพิ่ม
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), JS = path.join(ROOT, 'js');
const files = fs.readdirSync(JS).filter(f => f.endsWith('.js')).sort();
const clip = (t, n) => (t.length > n ? t.slice(0, n - 1) + '…' : t);
let out = `# CODEMAP — where everything is (auto-generated: \`node tools/codemap.js\`, re-run after editing js/)
Game = \`index.html\` (HTML only + loader) + \`css/game.css\` + \`js/NN-*.js\`. The loader fetches the js files **in number order and joins them into ONE module** → every file sees every other file's top-level names (no import/export). Code that runs at load time may only use things from earlier files. New file = add its name to \`FILES\` in index.html.
Format: \`name:line\` = top-level function/const/let in that file. \`§line title\` = section header comment. Errors show \`game.js:N\` → \`srcAt(N)\` in the console gives file:line.
`;
let total = 0;
for (const f of files) {
  const L = fs.readFileSync(path.join(JS, f), 'utf8').split('\n');
  if (L[L.length - 1] === '') L.pop();
  total += L.length;
  let title = '';
  const items = [];
  for (let i = 0; i < L.length; i++) {
    const t = L[i], n = i + 1;
    let m;
    if (/^\/\/ ?=+$/.test(t) && L[i + 1] && /^\/\/\s+\S/.test(L[i + 1]) && !/^\/\/ ?=+$/.test(L[i + 1])) {
      const h = L[i + 1].replace(/^\/\/\s*/, '');
      if (!title) title = h; else items.push(`\n§${n + 1} ${clip(h, 70)}\n`);
      i++; continue;
    }
    if (/^\/\/ ?(?:=+|-+)\s*$/.test(t)) continue;
    if ((m = t.match(/^\/\/ ?(?:-{3,}|={3,})\s*(.+?)\s*(?:-{3,}|={3,})?\s*$/))) { items.push(`\n§${n} ${clip(m[1].replace(/-+$/, '').trim(), 70)}\n`); continue; }
    if ((m = t.match(/^(?:async\s+)?function\*?\s+([\w$]+)/))) { items.push(`${m[1]}:${n}`); continue; }
    if ((m = t.match(/^(?:const|let|var)\s+(.+)/))) {
      // ชื่อทุกตัวที่ประกาศในบรรทัดนั้น (ระดับวงเล็บ 0): const a=1,b=[...],c=()=>{} → a b c
      const s = m[1]; let d = 0, q = null, start = true, names = [];
      for (let k = 0; k < s.length; k++) {
        const c = s[k];
        if (q) { if (c === '\\') k++; else if (c === q) q = null; continue; }
        if (c === '"' || c === "'" || c === '`') { q = c; continue; }
        if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) d--;
        else if (d === 0 && c === ',') start = true;
        else if (d === 0 && c === ';') break;
        if (start && d === 0) { const w = s.slice(k).match(/^\s*([\w$]+)\s*=/); if (w) { names.push(w[1]); start = false; } else if (/\S/.test(c) && c !== ',') start = false; }
      }
      if (names.length) items.push(names.map(x => `${x}:${n}`).join(' '));
    }
  }
  if (!title && items[0] && items[0].startsWith('\n§1 ')) title = items.shift().replace(/^\n§1 |\n$/g, '');
  out += `\n## js/${f} (${L.length}) — ${clip(title.replace(/^[-=\s]+|[-=\s]+$/g, ''), 90)}\n`;
  out += items.join(' ').replace(/ ?\n ?/g, '\n').replace(/\n{2,}/g, '\n').trim() + '\n';
}
out += `\n(${files.length} files, ${total} lines)\n`;
fs.writeFileSync(path.join(ROOT, 'CODEMAP.md'), out);
console.log('CODEMAP.md:', files.length, 'files,', total, 'lines,', out.length, 'chars');
