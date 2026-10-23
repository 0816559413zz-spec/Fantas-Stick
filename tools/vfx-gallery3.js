// หน้ารวม VFX ตัวเลือกรอบ 3 (vfx-variants3.html) จาก assets/fx/var3-<กลุ่ม>/*.fx.json + รูปเทียบ designs/vfx-variants3/<กลุ่ม>-<ท่า>.jpg
// ใช้: node tools/vfx-gallery3.js (รันใหม่ทุกครั้งที่เพิ่ม/แก้แบบ) • สร้างไฟล์: node tools/vfx-var3-gen.js • รูปเทียบ: node tools/vfx-var3-sheets.js
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),FXD=path.join(ROOT,'assets','fx');
const G=[['frost','❄️ สายน้ำแข็ง (Frost) — 4 แบบใหม่','1 แสงเหนือ (ม่านออโรร่าเขียวฟ้า-ม่วง) • 2 น้ำแข็งดำ (ผลึกดำ รอยร้าวฟ้าเรือง หมอกมืด) • 3 พายุหิมะ (หิมะฟุ้ง ลมหมุน เกล็ดหิมะ) • 4 แก้วปริซึม (คริสตัลใส ประกายรุ้ง)'],
  ['storm','⚡ สายสายฟ้า (Storm) — 4 แบบใหม่','1 พลาสมาม่วงเทสลา • 2 สายฟ้าแดงเลือด (ควันดำ) • 3 เทพสายฟ้าทอง (วงรูน หอกสายฟ้า) • 4 พายุเมฆ (เมฆดำ ฝน ฟ้าผ่าจากเมฆ)']];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let body='';
for(const [g,title,sub] of G){const d=path.join(FXD,'var3-'+g);if(!fs.existsSync(d))continue;
  const moves={};for(const f of fs.readdirSync(d).filter(f=>/_[1-4]\.fx\.json$/.test(f)).sort()){const m=f.replace(/_[1-4]\.fx\.json$/,''),k=f.slice(-9,-8);
    const j=JSON.parse(fs.readFileSync(path.join(d,f),'utf8'));(moves[m]||(moves[m]={}))[k]=j.desc||'';}
  body+=`<h2>${title}</h2><p class="sub">${esc(sub)}</p><div class="grid">`;
  for(const m in moves){const img=`designs/vfx-variants3/${g}-${m}.jpg`,has=fs.existsSync(path.join(ROOT,img));
    const name=((moves[m]['1']||'').split(':')[1]||m).split('—')[0].trim();
    body+=`<section class="card"><h3>${esc(name)} <small>${g}/${m}</small></h3>${has?`<a href="${img}" target="_blank"><img loading="lazy" src="${img}" alt=""></a>`:'<p class="noimg">ยังไม่มีรูปเทียบ</p>'}<ul>`;
    for(const k of ['1','2','3','4'])if(moves[m][k]!==undefined){const t=moves[m][k],th=(t.match(/\(([^)]*)\)/)||[])[1]||'';
      body+=`<li><b>${k}</b> ${esc(th)} <a class="btn" href="studio.html?fx=var3-${g}/${m}_${k}" target="_blank">เปิดในสตูดิโอ ▶</a></li>`;}
    body+='</ul></section>';}
  body+='</div>';}
const html=`<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VFX ตัวเลือก รอบ 3</title>
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600&display=swap" rel="stylesheet">
<style>:root{--bg:#0b1020;--card:#151d36;--gold:#e2bd66;--tx:#e8ecff;--mut:#9aa3c7}body{margin:0;background:var(--bg);color:var(--tx);font-family:Kanit,sans-serif;padding:16px}
h1{color:var(--gold);margin:4px 0 8px}h2{color:var(--gold);border-bottom:1px solid #2a3560;padding-bottom:6px;margin:28px 0 4px}.sub,.intro{color:var(--mut);line-height:1.6;max-width:900px;margin:4px 0 12px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,640px),1fr));gap:14px}.card{background:var(--card);border:1px solid #2a3560;border-radius:10px;padding:10px 12px}
h3{margin:2px 0 8px;font-size:18px}h3 small{color:var(--mut);font-weight:400;font-size:12px}img{width:100%;border-radius:6px;display:block}ul{list-style:none;padding:0;margin:8px 0 0}li{margin:6px 0;font-size:14px}
li b{color:var(--gold);display:inline-block;width:18px}.btn{display:inline-block;margin-left:6px;padding:1px 8px;border:1px solid var(--gold);border-radius:12px;color:var(--gold);text-decoration:none;font-size:12px}.btn:hover{background:var(--gold);color:#000}.noimg{color:var(--mut)}</style></head><body>
<h1>✨ VFX ตัวเลือก รอบ 3 — น้ำแข็ง + สายฟ้า อย่างละ 4 แบบ</h1>
<p class="intro">ยังไม่ได้ใส่เข้าเกม — เลือกแล้วบอก Claude เช่น <i>"Permafrost ใช้แบบ 2, Railgun ใช้แบบ 3"</i> • ไม่ซ้ำแบบ A/B/C ของเพื่อน และไม่ซ้ำของที่อยู่ในเกม • ดูของจริงที่ขยับ: ดับเบิลคลิก <b>VFX Studio.bat</b> แล้วกด "เปิดในสตูดิโอ ▶"</p>
${body}</body></html>`;
fs.writeFileSync(path.join(ROOT,'vfx-variants3.html'),html);console.log('vfx-variants3.html');
