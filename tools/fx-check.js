// ตรวจไฟล์เอฟเฟกต์ทั้งหมด: node tools/fx-check.js
//  1) ตรวจทุก assets/fx/**/*.fx.json + assets/fx/bind.json (รูปแบบ ช่วงค่า งบ ชื่อที่อ้างถึง) — ใช้ tools/fx-lint.js ตัวเดียวกับหน้าสตูดิโอ
//  2) เขียน assets/fx/index.json ใหม่ (รายชื่อ + เวอร์ชันของทุกไฟล์ — เกมใช้โหลดล่วงหน้า/หลบแคช)
//  3) เขียน FX-FORMAT.md ใหม่จาก assets/fx/schema.json (เอกสารรูปแบบไฟล์ อย่าแก้ด้วยมือ)
// ตัวเลือก: --quiet (พิมพ์เฉพาะปัญหา) • ออกด้วยรหัส 1 ถ้ามี err
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..'), FXD = path.join(ROOT, 'assets', 'fx');
const { fxLint, fxLintBind } = require('./fx-lint.js');
const quiet = process.argv.includes('--quiet');
const schema = JSON.parse(fs.readFileSync(path.join(FXD, 'schema.json'), 'utf8'));
// ไฟล์เอฟเฟกต์ทั้งหมด
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (f.name.endsWith('.fx.json')) files.push(p); } })(FXD);
const nameOf = p => path.relative(FXD, p).replace(/\\/g, '/').replace(/\.fx\.json$/, '');
const names = new Set(files.map(nameOf));
// สิ่งที่อ้างถึงได้: โมเดล/flipbook ใน manifest, ชื่อเสียง, ชื่อ efx ในโค้ด host
let man = {}; try { man = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'manifest.json'), 'utf8')); } catch (e) {}
const models = new Set(Object.keys(man.models || {})), flips = new Set([...Object.keys(man.fx || {}), ...Object.keys(man.ptex || {})]);
const js = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')).join('\n');
const sounds = new Set(((js.match(/const SFXN=\{([^}]*)\}/) || [])[1] || '').split(',').map(s => s.split(':')[0].trim()).filter(Boolean));
const events = new Set([...js.matchAll(/z:'([a-z0-9_]+)'/g)].map(m => m[1]));
const ctx = { names, models, flips, sounds, events };
let errs = 0, warns = 0; const index = { v: 1, fx: {} };
const say = (lv, file, at, msg) => { if (lv === 'err') errs++; else warns++; console.log(`${lv === 'err' ? '✗' : '⚠'} ${file}${at ? ' › ' + at : ''}: ${msg}`); };
for (const p of files) {
  const n = nameOf(p), txt = fs.readFileSync(p, 'utf8');
  let fx; try { fx = JSON.parse(txt); } catch (e) { say('err', n, '', 'JSON ผิดรูปแบบ — ' + e.message); continue; }
  for (const r of fxLint(fx, schema, Object.assign({}, ctx, { self: n }))) say(r.lv, n, r.at, r.msg);
  index.fx[n] = { v: crypto.createHash('md5').update(txt).digest('hex').slice(0, 8), desc: fx.desc || '', pal: fx.pal || '', tags: fx.tags || [], dur: fx.dur || 0, n: (fx.layers || []).length };
}
let bind = {}; try { bind = JSON.parse(fs.readFileSync(path.join(FXD, 'bind.json'), 'utf8')); } catch (e) { say('err', 'bind.json', '', 'อ่านไม่ได้ — ' + e.message); }
for (const r of fxLintBind(bind, schema, ctx)) say(r.lv, 'bind.json', r.at, r.msg);
fs.writeFileSync(path.join(FXD, 'index.json'), JSON.stringify(index, null, 1) + '\n');
// ---------- FX-FORMAT.md (สร้างจาก schema) ----------
const fmt = v => v === undefined ? '' : typeof v === 'object' ? '`' + JSON.stringify(v) + '`' : '`' + v + '`';
const rng = s => s.min !== undefined ? `${s.min}–${s.max}` : '';
const tags = s => [s.range && 'สุ่มช่วง', s.curve && 'เส้นโค้ง', s.expr && 'สูตร'].filter(Boolean).join(' · ');
const table = F => '| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |\n|---|---|---|---|---|---|\n' + Object.entries(F).map(([k, s]) => `| \`${k}\` | ${s.type}${s.of ? ' (' + (Array.isArray(s.of) ? s.of.join('/') : s.of === 'types' ? 'ชนิดชั้นด้านล่าง' : (schema[s.of] || []).join('/')) + ')' : ''} | ${fmt(s.def)} | ${rng(s)} | ${tags(s)} | ${s.th || ''}${s.desc ? ' — ' + s.desc : ''} |`).join('\n');
let md = `# FX-FORMAT — รูปแบบไฟล์เอฟเฟกต์ \`.fx.json\` (สร้างอัตโนมัติจาก \`assets/fx/schema.json\` โดย \`node tools/fx-check.js\` — อย่าแก้ไฟล์นี้ด้วยมือ)

> อ่านไฟล์นี้ไฟล์เดียวก็เขียนเอฟเฟกต์ได้ ไม่ต้องเปิดโค้ด js • แผนและเหตุผล: \`designs/vfx-studio.md\` • แนวภาพ: \`VFX.md\` • สตูดิโอ: เปิด \`studio.html\`

${schema.about}

## ค่าที่ใส่ได้
- **ตัวเลข** — ${schema.value.num}
- **สี** — ${schema.value.col}
- **ตำแหน่ง (vec3)** — ${schema.value.vec3}
- **ธาตุ (pal)**: ${schema.pals.map(p => '`' + p + '`').join(' ')} (\`col\` = สร้างจานสีจากสีที่เกมส่งมา)

## ไฟล์
${table(schema.file)}

## ทุกชั้นมีฟิลด์เหล่านี้
${table(schema.common)}

## ชนิดชั้น
`;
for (const [t, T] of Object.entries(schema.types)) md += `\n### \`${t}\` ${T.icon || ''} ${T.th}\n${T.desc}\n\n${table(T.fields)}\n`;
md += `\n## ตัวเลือกของ enum\n- รูปทรง (shape): ${schema.shapes.join(', ')}\n- วัสดุ (mat): ${schema.mats.join(', ')} — energy = ขอบเรือง+ลายไหล (สีจากจาน) • fire = shader ไฟของเกม • ice = shader น้ำแข็ง • glow = สีเรียบบวกแสง • solid = ทึบ • flip = ภาพ flipbook\n- ปล่อยจาก (from): ${schema.froms.join(', ')}\n- ทิศ (dir): ${schema.dirs.join(', ')} — flat = กระจายแนวนอน (ความเร็วขึ้นจาก up)\n- หน้าตาเม็ด (look): ${schema.looks.join(', ')}\n- ยึดกับ (att): ${schema.atts.join(', ')}\n`;
md += `\n## ผูกกับเกม — \`assets/fx/bind.json\`\n${schema.bind.about}\n- คีย์: ${schema.bind.key}\n${Object.entries(schema.bind.fields).map(([k, v]) => `- \`${k}\`: ${v}`).join('\n')}\n\nตัวอย่าง:\n\`\`\`json\n{\n  "efx:dfboom": {"fx": "fire/dfboom", "mode": "add", "p": {"r": "ev.r/20"}},\n  "imp:fire":   {"fx": "fire/spark_hit"},\n  "efx:blaze":  {"fx": "fire/blaze_aura", "follow": "ev.id"}\n}\n\`\`\`\n`;
md += `\n## เรียกจากโค้ด\n\`\`\`js\nconst h=fxPlay('fire/dfboom',{x,y,h,a,s:1,pal:'ice',col:'#ff00aa',p:{r:6},follow:playerId,own:true});  // คืน handle (null = ไฟล์ยังไม่โหลด)\nfxStop(h);   // ชั้น loop หยุด + ชั้น end:true เริ่มเล่น\n\`\`\`\n`;
md += `\n## งาน Claude (เร็วที่สุด)\n1. คัดลอกไฟล์ใกล้เคียงจาก \`assets/fx/start/\` (แม่แบบ) หรือสร้างในสตูดิโอ → แก้ JSON\n2. \`node tools/fx-check.js\` — ต้องไม่มี ✗\n3. ดูผลไม่ต้องเข้าเกม: เปิด \`studio.html?fx=<ชื่อ>&sheet=0.05,0.15,0.3,0.6,1.2\` (แผ่นภาพสรุปทั้งไทม์ไลน์ + ตัวเลขจอขาว/บังตัวละคร) • รันผ่าน \`python tools/serve.py\` แล้วเติม \`&save=ชื่อ\` = เซฟภาพลง \`shots/ชื่อ.png\` ให้ Read ดูได้\n4. ผูกกับท่าใน \`bind.json\` (mode add ก่อน แล้วค่อย replace เมื่อผู้ใช้ชอบ)\n`;
fs.writeFileSync(path.join(ROOT, 'FX-FORMAT.md'), md);
if (!quiet || errs || warns) console.log(`fx-check: ${files.length} ไฟล์ • ✗ ${errs} • ⚠ ${warns} • เขียน assets/fx/index.json + FX-FORMAT.md แล้ว`);
process.exit(errs ? 1 : 0);
