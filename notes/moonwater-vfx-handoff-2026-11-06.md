# Moonwater Arts — ส่งต่อก่อนผู้ใช้พัก (2026-11-06)

**สถานะ7พ.ย.2026:** ผู้ใช้สั่งsave/commit/pushทุกงานที่ค้าง จึงรวมโค้ด/โมเดล/generatorปลายโปร่งในรอบนี้ด้วย การบันทึกไม่ถือว่ารับภาพแล้ว ยังรอรีวิวก่อนGIF ข้อความ“ยังไม่commit/push”ด้านล่างเป็นสถานะก่อนคำสั่งใหม่นี้

**ตรวจซ้ำก่อนบันทึก7พ.ย.:** JS/Studio85ไฟล์ผ่าน, FX-checkไม่มีerror (258warningsของทั้งโปรเจกต์รวมโมเดลใหม่), training smoke-testผ่าน: beam len900/w28/life0.6/tick0.2/dmg10, page errors0; log `shots/save_all_moon_smoke.log`

## ทำแล้ว

- BA เสริมพลังเป็นลำน้ำฟ้า–ไซแอน แทนแกนเรืองแสงขาว เพิ่มคลื่นผิว ริ้วฟอง สเปรย์ และเส้นน้ำสะบัดรอบลำ
- ลดรัศมีภาพประมาณ28% ตามผู้ใช้ จุดออกจากไม้ ระยะ เวลาโจมตี ดาเมจ และการทะลุเดิม
- วงเวทชัดขึ้นและอยู่ตลอดช่วงยิง มีภาพ/GIF จากผู้ร่ายและมุมเฉียงให้รีวิว
- ตัวสร้างหลัก `tools/water-moon-pressure-gen.py` เขียน `assets/fx/water/moon_beam.fx.json` และสองโมเดล jet/foam ตัวสร้างเก่า `water-moon-gen.py` เรียกตัวใหม่นี้เฉพาะ beam
- `wtmb` ในเกมเรียก `water/moon_beam` อยู่แล้ว จึงเห็นภาพตัวลำรุ่นใหม่ในเกมได้ ไม่ได้แก้ host หรือ bind event ใหม่

## รอบต่อหลัง pull e5d21c2 — ทำตัวอย่างแล้ว รอผู้ใช้รีวิว

- ตรวจไฟล์จริงหลัง pull แล้วพบว่าบรรทัด HANDOFF ที่บอกว่าทำ soft end แล้วใหม่กว่างานที่อยู่ในโค้ด: runtime/schema/generator ยังไม่มี `endFrom/endTo` จึงทำต่อรอบนี้ ไม่ถือว่างานเก่าครบจากเอกสารเพียงอย่างเดียว
- เพิ่ม spatial alpha fade แบบ opt-in ให้ `toonwater`: `endFrom/endTo` ใช้ตำแหน่ง local +Z เดิมของ mesh ก่อน scale/rotation ค่าเริ่ม0ปิดความสามารถนี้ให้เอฟเฟกต์เดิม
- ลำและริ้วฟอง Moonwater จางช่วง z33..45; ลำคงรัศมี .18 ไม่คอดปลาย และตอนหมดช่วงยิงจางด้วย opacity แทนหดเส้นให้เล็ก ไม่มีชิ้น end splash เพิ่ม
- เปลี่ยน generator แล้วสร้างสองโมเดลและ effect ใหม่ ไม่แตะ host/bind/ดาเมจ/ระยะ/เวลายิง (effect นี้ถูกเรียกในเกมอยู่ก่อนแล้ว)
- ภาพนิ่งตรวจแล้ว: `shots/moon_soft_end_close.jpg` ภาพปลาย, `moon_soft_tip_detail.jpg` ใกล้ปลาย, `moon_soft_dark.jpg` ดูลำและวงเวทใน greathall ภาพ castle จากกล้องไกลถูกฉากบัง ไม่ใช้ส่งรีวิว
- ตรวจ `node tools/check.js` ผ่าน; `node tools/fx-check.js` ✗0 (230 warningsเดิม); สร้าง CODEMAP ใหม่; headless Studio ทั้งฉากสว่าง/มืดไม่มี page errors และ lintว่าง; training test `tools/check-moon-pressure.js` ยังสร้าง beam len900 life.6 tick.2 dmg10 ไม่มี page errors
- **ยังไม่ทำ GIF ไม่ถือว่าผู้ใช้รับภาพ ยังไม่ commit/push รอบนี้** ขั้นต่อไปให้ผู้ใช้รีวิวภาพนิ่งปลายโปร่งก่อนแล้วค่อย GIF ตามคำขอ

## ข้อตกลงที่ใช้ทำรอบนี้

ผู้ใช้เห็นว่าปลายที่ทดลองดูเป็นท่อหลายชิ้นตัดแล้วต่อกัน ไม่ชอบทั้งปลายตัด รุ่นคอดแคบ และรุ่นสาดยาว ต่อมารับข้อเสนอให้ **ไม่มีท่าจบพิเศษเมื่อยิงไม่โดน**

ให้ทำลำน้ำหลักต่อเนื่องชิ้นเดียว คงความกว้าง แล้วให้ความโปร่งของปลายกลืนหาย มีละอองเล็กน้อยประกอบ เมื่อหมดจังหวะจางทั้งลำ น้ำสาดเด่นใช้ตอนชนเป้าหรือผนังเป็นแนวเสนอที่ยังต้องพัฒนา/รีวิว

**การจางเชิงพื้นที่ทำตัวอย่างแล้วตามรายการด้านบน** ภาพ Moonwater ยังไม่จบจนกว่าผู้ใช้จะรีวิว ไม่ส่ง GIF อัตโนมัติ

ข้อสังเกตเรื่องรอยต่อเกิดในหลาย VFX ด้วย เก็บเป็นแนวทางตรวจทรงและการซ้อนชั้น ไม่ใช่คำสั่งให้รื้อทุกเอฟเฟกต์ทันที

## เก็บไว้เป็นการทดลองเท่านั้น

- `water/moon_end_free_study` และโมเดล `water_moon_free_breakup` เป็นแนวที่ผู้ใช้ไม่เลือก **ไม่ผูกเกม**
- `water/moon_end_hit_study` / impact_fan / end_wall เป็นร่างสาธิตจุดชน **ไม่ผูกเกม** ยังไม่ได้รับรองเป็นงานสุดท้าย
- ผนังและลำสั้นใน study เป็นบริบทให้ดูทรง ไม่มีผลต่อระยะหรือความเสียหายในเกม
- ภาพ/GIF `shots/moon_end_free*` เป็นประวัติรุ่นที่ถูกแก้/ปฏิเสธ ไม่ใช้แทนภาพของแนวใหม่ที่ยังไม่ได้ทำ

## ภาพและการสร้างซ้ำ

`shots/` ไม่ติด git ต้องสร้างใหม่เมื่อย้ายเครื่อง

```powershell
node tools/headless.js --url "studio.html?fx=water/moon_beam&cam=side&dist=9&look=3&at=self&map=greathall&still=1" --js tools/capture-moon-pressure.js --timeout 180 --quiet
node tools/headless.js --url "studio.html?fx=water/moon_beam&cam=orbit&look=1.8&at=self&map=greathall&motion=1" --js tools/capture-moon-pressure-views.js --timeout 240 --quiet
```

ตัวแรกภาพนิ่ง ตัวที่สองเฟรม GIF หลายมุม ใช้ `tools/pack-wind-wing-preview.py` ทำ palette/timing หรือ pack เฟรมที่จับด้วยชื่อเฉพาะรุ่น ต้องตรวจภาพที่เข้ารหัสแล้วก่อนส่ง

## งาน optimize ที่ทำร่วมช่วงนี้

อ่าน `notes/archive/perf-codex-2026-11-06.md` แยกจากงานภาพ มีแพตช์ reuse particle curl buffer และ regression ที่ยืนยันผลคำนวณเดิม แต่ stress12คนยังมีเฟรมช้า ไม่ประกาศว่า FPS หายแล้ว

ผู้ใช้สั่งให้เซฟ commit และ push งานที่ทำไว้ พร้อมแยก done/pending ให้ชัด ยังไม่ได้สั่งให้พัฒนาโหมดบุกปราสาท
