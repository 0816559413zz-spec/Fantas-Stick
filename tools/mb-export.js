// ส่งแผนที่ Map Builder เข้าเกมจากบรรทัดคำสั่ง (ไม่ต้องกดปุ่ม ⬆) — ใช้: python tools/serve.py (อีกหน้าต่าง) แล้ว
//   node tools/headless.js --url "mapbuild.html" --js tools/mb-export.js --quiet     (แก้ id ด้านล่าง หรือส่ง ?id= ใน url: "mapbuild.html?export=gorge")
const id = new URLSearchParams(location.search).get('export') || 'gorge';
for (let i = 0; i < 100 && !(window.__mb && window.__mb.M && window.__mb.M.id); i++) await new Promise(r => setTimeout(r, 100));   // รอให้หน้าเปิดแผนที่ล่าสุดเสร็จก่อน (ไม่งั้นมันเปิดทับ)
await new Promise(r => setTimeout(r, 500));
const MD = await import('/mapbuild/model.js');
const r = await (await fetch('/api/mb?id=' + id)).json();
if (!r.ok) throw new Error(r.err);
__mb.setMap(MD.unpack(r.map));
for (let i = 0; i < 200; i++) { await new Promise(r => setTimeout(r, 100)); const o = __mb.M.objs.filter(o => o.t.startsWith('kit:')); if (o.every(q => __mb.KIT.tplNow && __mb.KIT.tplNow.get(q.t.slice(4)))) break; }
const ok = await __mb.exportGame();
return { ok, stat: document.getElementById('stat').textContent, check: [...document.querySelectorAll('#chk li')].map(li => li.className + ': ' + li.textContent) };
