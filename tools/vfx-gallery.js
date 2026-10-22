// สร้างหน้ารวม VFX ตัวเลือก (vfx-variants.html) จาก assets/fx/var-<กลุ่ม>/*.fx.json + รูปเทียบ designs/vfx-variants/<กลุ่ม>-<ท่า>.jpg
// ใช้: node tools/vfx-gallery.js (รันใหม่ทุกครั้งที่เพิ่ม/แก้แบบ)
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),FXD=path.join(ROOT,'assets','fx');
const G=[['fire','🔥 สายไฟ (Pyro)'],['frost','❄️ สายน้ำแข็ง (Frost)'],['storm','⚡ สายสายฟ้า (Storm)']];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let body='';
for(const [g,title] of G){const d=path.join(FXD,'var-'+g);if(!fs.existsSync(d))continue;
  const moves={};for(const f of fs.readdirSync(d).filter(f=>/_[abc]\.fx\.json$/.test(f)).sort()){const m=f.replace(/_[abc]\.fx\.json$/,''),k=f.slice(-9,-8);
    const j=JSON.parse(fs.readFileSync(path.join(d,f),'utf8'));(moves[m]||(moves[m]={}))[k]=j.desc||'';}
  body+=`<h2>${title}</h2><div class="grid">`;
  for(const m in moves){const img=`designs/vfx-variants/${g}-${m}.jpg`,has=fs.existsSync(path.join(ROOT,img));
    const name=(moves[m].a||'').split('—')[0].replace(/^แบบ A \([^)]*\):\s*/,'').trim()||m;
    body+=`<section class="card"><h3>${esc(name)} <small>${g}/${m}</small></h3>${has?`<a href="${img}" target="_blank"><img loading="lazy" src="${img}" alt=""></a>`:'<p class="noimg">ยังไม่มีรูปเทียบ</p>'}<ul>`;
    for(const k of ['a','b','c'])if(moves[m][k]!==undefined)body+=`<li><b>${k.toUpperCase()}</b> ${esc(moves[m][k].replace(/^แบบ [ABC] /,''))} <a class="btn" href="studio.html?fx=var-${g}/${m}_${k}" target="_blank">เปิดในสตูดิโอ ▶</a></li>`;
    body+='</ul></section>';}
  body+='</div>';}
const html=`<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VFX ตัวเลือก</title>
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600&display=swap" rel="stylesheet">
<style>:root{--bg:#0b1020;--card:#151d36;--gold:#e2bd66;--tx:#e8ecff;--mut:#9aa3c7}body{margin:0;background:var(--bg);color:var(--tx);font-family:Kanit,sans-serif;padding:16px}
h1{color:var(--gold);margin:4px 0 8px}h2{color:var(--gold);border-bottom:1px solid #2a3560;padding-bottom:6px;margin-top:28px}.intro{max-width:900px;color:var(--mut);line-height:1.6}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,640px),1fr));gap:14px}.card{background:var(--card);border:1px solid #2a3560;border-radius:10px;padding:10px 12px}
h3{margin:2px 0 8px;font-size:18px}h3 small{color:var(--mut);font-weight:400;font-size:12px}img{width:100%;border-radius:6px;display:block}ul{list-style:none;padding:0;margin:8px 0 0}li{margin:6px 0;font-size:14px;line-height:1.45}
li b{color:var(--gold);display:inline-block;width:18px}.btn{display:inline-block;margin-left:6px;padding:1px 8px;border:1px solid var(--gold);border-radius:12px;color:var(--gold);text-decoration:none;font-size:12px;white-space:nowrap}.btn:hover{background:var(--gold);color:#000}.noimg{color:var(--mut)}</style></head>
<body><h1>✨ VFX ตัวเลือก — ทุกท่า อย่างละ 3 แบบ</h1>
<p class="intro">ยังไม่ได้ใส่เข้าเกม — เป็นตัวเลือกให้เลือก • <b>แบบ A</b> = พรีเมียม (เกลาจากของเดิม) • <b>แบบ B</b> = อนิเมะ (คม แฟลช เส้นความเร็ว) • <b>แบบ C</b> = สมจริง (ไฟ/ควัน/หมอกจริง เศษกระเด็น)<br>
ดูของจริงที่ขยับ: ดับเบิลคลิก <b>VFX Studio.bat</b> แล้วกด "เปิดในสตูดิโอ ▶" (ปุ่มใช้ได้เมื่อเปิดผ่าน VFX Studio.bat / tools/serve.py)<br>
เลือกแล้วบอก Claude เช่น <i>"Kindle ใช้แบบ B, Railgun ใช้แบบ A แต่ขอสีเข้มขึ้น"</i> แล้ว Claude จะใส่เข้าเกมให้</p>${body}</body></html>`;
fs.writeFileSync(path.join(ROOT,'vfx-variants.html'),html);console.log('✓ vfx-variants.html');
