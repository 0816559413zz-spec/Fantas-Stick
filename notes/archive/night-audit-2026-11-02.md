# ตรวจบั๊ก ประสิทธิภาพ และสถานะแอนิเมชัน — คืน 1–2 พ.ย. 2026

**อัปเดตหลังรายงาน: pull ตามผู้ใช้ (2 พ.ย.)** ดึง `380fc77` และ `503a6e0` จาก origin/main แล้ว รวมงาน local กล้อง/แอนิเมชัน/warmup/แก้ท่าหลังเกิดใหม่กลับครบ เก็บ safety stash `6ec839c` ไว้ ไม่มี commit/push เพิ่ม ชนกันเฉพาะ CODEMAP (สร้างใหม่จากโค้ด) และ CHANGELOG (เก็บทั้งสองฝั่ง) ผล audit ในส่วนล่างเป็น **ก่อน** สอง commit นี้ จึงไม่ใช้แทนผลหลัง pull

อัปเดตมี auto quality แยกภาระ CPU, เปลี่ยนวิธีลดคุณภาพเงาอัตโนมัติเพื่อลดการ compile shader ซ้ำ, ลดงานผ้าคลุม/อนุภาค/วัสดุ additive และ cache ตัวเลข Burning หลังรวม `node tools/check.js` ผ่าน 82 ไฟล์; benchmark ห้องฝึก 930 เฟรม (`shots/pull-performance-training-2026-11-02.log`) ผ่าน ไม่มีเฟรมทำงานเกิน50ms ไม่มี shader ใหม่กลางชุดทดสอบ และไม่มี error สูงสุดแต่ละช่วง: idle31.1 / walk37.3 / BA34.4 / Beam39.0 / dragon43.8ms นี่เป็นผลรอบเดียวใน headless และชุดเดินเฟรมเองไม่ผ่าน RAF/auto-quality tick ปกติ จึงยังไม่รับรอง FPS หน้าจอจริงหรือประโยชน์ของ auto quality จากชุดนี้

ตรวจลูป RAF ปกติต่อ โดยไม่เรียก HL.freeze/HL.step: เข้า training สายน้ำ รอ14วิ เก็บเฟรม10วิขณะยิงและเรียกอัลติ (`shots/pull-live-loop-2026-11-02.log`) ได้512ช่วงเฟรม ไม่มีerror ตัว auto quality ทำงาน (`cpu` เป็นค่าจริง, scale0.7→0.55) ช่วงเฟรม median18.2/p9536.6/max60.6ms มี6ช่วง>50ms ตัวเลขนี้รวมการพักภาพ hit-stop ตามกลไกเกมและผลของ headless จึงไม่ใช่หลักฐานว่า6ช่วงนั้นเป็นบั๊ก performance ทั้งหมด และไม่ถือว่าผู้ใช้จะได้ค่าความละเอียด/FPSเดียวกัน ตรวจการทำงานได้ แต่ยังรับรองว่าอาการจริงหายสนิทไม่ได้

หลังรวมทดสอบตาย→เกิดใหม่ระหว่าง Abyssal Beam ซ้ำผ่าน ท่าBeamไม่กลับมาเล่นต่อ ไม่มีerror (`shots/pull-respawn-animation-2026-11-02.log`) `git diff --check` ผ่าน ไม่มีไฟล์ค้าง conflict; indexคืนเป็น unstaged เหมือนก่อนpull

ผู้ใช้เลือกงานข้อ 2 และ 3: ตรวจบั๊ก/ประสิทธิภาพ และตรวจแอนิเมชันที่ขาดหรือค้าง งานนี้ใช้เกมจริงในห้องฝึกผ่าน headless Chrome ทีละตัว ไม่ออกแบบ Wind ใหม่ ผู้ใช้บอกว่าสกิล Wind ส่วนใหญ่ยังไม่ตรงภาพในหัว จึงต้องกลับมาคุยทีละสกิลก่อน งานทั้งหมดอยู่ local ยังไม่ commit/push

## สิ่งที่แก้แล้ว: ท่าร่ายเก่ากลับมาเล่นหลังเกิดใหม่

ทำซ้ำได้กับ Eye of Heaven และ Abyssal Beam: เริ่มสกิล → ฆ่าตัวละครด้วย `WD.damage` จริง → รอ host ให้เกิดใหม่ ตัว host ยกเลิกสกิลแล้ว แต่ client ยังมีชื่อท่า `heavenslam` หรือ `wBeamPose` ค้างอยู่ แขนกลับไปยกยิง และปีกกลับไปเล่นจังหวะอัลติเก่าหลังเกิด

สาเหตุอยู่ใน `syncPlayers` (`js/35-sync.js`): คนตายเข้าทาง ragdoll แล้ว `continue` ก่อนเดินนาฬิกาท่าร่าย ทำให้นาฬิกาถูกแช่ไว้จนเกิดใหม่ ไม่ใช่ host ยังเปิดสกิลอยู่

เพิ่ม `clearCharacterCast` ก่อนทางแยกคนตาย ล้างนาฬิกาท่าร่าย/ฟาดไม้ ท่าค้าง Water/Wind หางแสงจากไม้ และนาฬิกา action ปีก เมื่อผู้เล่นตาย ล้ม เปลี่ยนสาย หรือเพิ่งโดนสตัน ไม่เปลี่ยนดาเมจ เวลาร่าย คูลดาวน์ อินพุต หรือท่า ragdoll

หลักฐานก่อนแก้: `shots/night-death-eyeofheaven-before.log`, `night-death-wing-before.log`, `night-death-abyssalbeam-before.log` หลังแก้ทดสอบการตายและเกิดใหม่กับ Eye of Heaven, Abyssal Beam, Railgun, Terra Auger, Glacier Rend, Dragonfall และ Featherwing ครบ 7 กรณี ท่าเก่าไม่กลับมา ไม่มี error (`shots/night-death-*-after.log`)

## ขอบเขตที่ตรวจและผล

| ชุดทดสอบ | ผล | ข้อจำกัด |
|---|---|---|
| 37 สกิล/อัลติ + BA/Shield/Dash ทั้ง 6 สาย รวม 55 กรณี | รับคำสั่ง ท่าเป็นตัวเลขปกติ เปลี่ยนสายแล้วเคลียร์สถานะและลงพื้นได้; ไม่มี error | ทดสอบสถานะและการเคลื่อนไหว ไม่ใช่ผู้ใช้รับความสวยของทุกท่า |
| สตันขัด Dragonfall, Storm Dome, Terra Auger, Abyssal Beam | สกิลที่ควรถูกยกเลิกถูกยกเลิก | ไม่ครอบคลุมการขัดทุกชนิดในทุกจังหวะ |
| ตาย→เกิดใหม่ 7 สกิลข้างต้น | ผ่านหลังแก้ | ใช้ host local และการตายจริงใน training |
| เริ่ม–ออกห้อง 9 โหมด | train/coop/duel/ffa/tdm/quid/race/br/imp เข้าเล่นได้ ตำแหน่งคน/กล้องปกติ ไม่มี error | ผู้เล่นจำลอง local 2 คน (Imp 4); ไม่ใช่ทดสอบเน็ตหรือเล่นครบแมตช์ |
| มังกรน้ำซ้ำ 16 รอบ | จบแล้ว live=0, pool=1 ทุกครั้ง; ทรัพยากรภาพคงที่ | วัดฉาก/สกิลนี้ ไม่ได้พิสูจน์ว่าไม่มี leak ทุกระบบ |
| Abyssal Beam ซ้ำ 24 รอบ | จบสกิลทุกครั้ง ทรัพยากรภาพคงที่ | เหมือนข้างต้น |
| ผู้เล่น local 6 สาย ใช้สกิลร่วมฉาก 720 เฟรม | ไม่มี runtime error แต่โหลดภาพสูงและมีเฟรมช้า | pass หมายถึงไม่พัง ไม่ใช่ผ่านเป้า FPS |
| ตัวบันทึกเฟรมสำหรับหน้าเกมจริง | เริ่ม เก็บ 53 frame intervals และหยุดเองได้ ไม่มี error | smoke ในหน้าเมนู ตรวจเครื่องมือเท่านั้น ไม่ใช่ FPS ใน training |

ไฟล์ผลหลัก: `shots/night-transitions-final.log`, `night-modes.log`, `night-soak-dragon.log`, `night-soak-beam.log`, `night-party.log`, `night-live-probe-smoke.log` ในชุดแรก test เคยนับ cooldown ติดลบเป็นสถานะทำงาน จึงแก้ predicate ให้เช็ก `>0` แล้วตรวจครบใหม่ ไม่ได้แก้เกมเพื่อให้ผ่านกรณีนั้น

## ผลทรัพยากรหลังสกิลจบ

| สกิล | จำนวนรอบ | Geometry | Texture | Shader programs | Scene objects | JS heap ที่พบ |
|---|---:|---:|---:|---:|---:|---:|
| Dragon Deep | 16 | 663 | 134 | 118 | 979 | ประมาณ 87–141 MB |
| Abyssal Beam | 24 | 656 | 134 | 118 | 979 | ประมาณ 86–145 MB |

ค่าภาพข้างต้นคงที่ในแต่ละรอบหลังเก็บเอฟเฟกต์ ช่วงต้นอาจสร้าง cache/pool ก่อนเปรียบเทียบ Heap ขึ้นลงตาม GC: มังกรรอบแรก 140.7 MB รอบท้าย 112.8 MB; Beam 144.8 → 104.6 MB ไม่เห็นแนวโน้มเพิ่มต่อเนื่องในเคสนี้ `performance.memory` วัด JS heap ไม่ใช่ RAM รวมของเครื่อง/Chrome และจำนวน geometry ไม่ใช่ขนาด VRAM

ช่วงสกิลทำงานวาดภาพจริง ส่วนช่วงรอเก็บเอฟเฟกต์เดิน host/view/animation ต่อแต่ข้าม compositor แล้ววาดจริงอีก 3 เฟรมก่อนอ่านค่า ไม่ได้บังคับ GC

## ประสิทธิภาพ: ยังมีอาการให้ตามต่อ

ยังไม่สรุปว่า FPS หายตกทั้งหมด ค่าด้านล่างเป็น **เวลาทำงานของหนึ่งเฟรมใน headless** รวมการส่งงานวาด ไม่ใช่ FPS ที่ผู้ใช้เห็นหรือ GPU execution time

- ชุด training baseline มี 2 เฟรมเกิน 50 ms ตอน BA (สูงสุด 51.5 ms) ทั้งที่ shader ไม่เพิ่ม ชุดนิ่ง/เดิน/Beam/มังกรรอบนั้นสูงสุดประมาณ 39–44 ms (`night-training-baseline.log`)
- ใน soak ยังมีเฟรมช้า: Beam รอบแรกสูงสุด 142.9 ms แม้จบรอบแล้วทรัพยากรไม่สะสม จึงใช้ผล leak test ยืนยันว่าลื่นไม่ได้
- ผู้เล่น 6 สาย: median 31.5 ms, p95 53.7 ms, max 148.9 ms; 49/720 เฟรมเกิน 50 ms; draw calls median 956 สูงสุด 1,688; triangles median 989,080 สูงสุด 3,640,534 (`night-party.log`) เป็นเคสกดหลายสกิลพร้อมกัน ไม่ใช่ภาระเฉลี่ยของทุกห้อง
- รอบเพิ่มตัวจับ shader (`night-party-materials.log`) ช้ากว่ารอบแรก: median 42.9 ms, p95 110.8 ms, max 232.2 ms; 272/720 เฟรมเกิน 50 ms จึงไม่ควรเลือกรายงานเฉพาะรอบที่เร็วกว่า พบ program ใหม่ที่เฟรม 0/110/240/420 (จำนวนคงค้าง 140→144) เฟรม 0 เป็น MeshBasicMaterial ของฉาก/หุ่นฝึกบางชิ้น ส่วนเฟรม 420 พบ ShaderMaterial กลุ่ม `uScene/uNz/uStr/uTint/uGlow/uMode` ขณะที่บาง program จับ material ใน scene ไม่ทัน ยังไม่แยกพิสูจน์ว่าการ compile เป็นสาเหตุของเวลาช้าทั้งเฟรมหรือเป็นเพียงสิ่งที่เกิดพร้อมกัน ไม่เพิ่ม warmup แบบเดาสุ่มและไม่สรุปว่าทุก hitch มาจาก shader
- ชุดเปลี่ยนโหมดก็พบเฟรมช้า โดยเฉพาะช่วงเริ่มเล่น/สร้างฉาก การทดสอบไม่พังไม่ได้หมายความว่าทุกโหมดลื่น
- เครื่องระหว่าง audit เคยเหลือ RAM ราว 1 GB และมี paging แต่ headless ที่เราเปิดเองก็เพิ่มภาระด้วย จึงแยกไม่ได้จากข้อมูลนี้ว่า RAM เป็นสาเหตุของอาการผู้ใช้ ข้อมูลไม่พอให้สรุปว่า GPU ไม่ทำงานหรือควรเพิ่ม RAM

ไม่ลดคุณภาพ VFX หรือเปลี่ยนกลไกเพื่อทำตัวเลขให้ผ่าน ขั้นต่อไปควรเก็บอาการในหน้าเกมที่ผู้ใช้เล่นจริง แล้วดูว่าเฟรมช้าเกิดพร้อม long task, shader ใหม่ หรือภาระฉาก โดยใช้ตัวเก็บด้านล่าง

## สถานะแอนิเมชันสำหรับกลับมาทำต่อ

- ทั้ง 37 สกิล/อัลติที่เปิดใช้มีท่าตัวละครจาก mapping หรือ logic ของสาย ตรวจร่วมกับ BA/Shield/Dash แล้ว ไม่พบกรณีท่ากลายเป็น NaN/Infinity หรือสถานะค้างหลังเปลี่ยนสาย
- โล่ Earth ตัวผู้ร่ายขยับน้อย (ค่าท่าต่างจากฐานประมาณ 0.044 rad) เพราะ Stand เป็นตัวตั้งรับ ไม่ควรตีความจากตัวเลขอย่างเดียวว่าท่าหาย
- Beam ค้างระหว่างยิงและมีคืนท่า; Windrift/Featherwing/ปีกใช้สถานะของสกิลต่อเนื่อง รายละเอียดงานรอบก่อนอยู่ [บันทึกแอนิเมชัน](character-animation-2026-11-01.md)
- การตรวจนี้ไม่ได้รับรองว่าทุกท่าสวย/ตรงจินตนาการ การจัดมือจับไม้ นิ้ว เท้าวางตามพื้น และรายละเอียด rig ยังเป็นงานคุณภาพที่ต้องดูภาพ/ผู้ใช้รีวิว ไม่ควรเพิ่มการล็อกการเคลื่อนไหวเพื่อให้ท่าดูเข้าที่
- Wind ต้องกลับมาออกแบบทีละสกิลกับผู้ใช้ รวมท่าปีก/โล่ ไม่ทำใหม่ทั้งชุดระหว่าง audit และ SFX ผู้ใช้ให้ทำทีหลัง

## เก็บอาการจากหน้าเกมจริงโดยไม่เปลี่ยนเกม

เปิด DevTools Console ของหน้าเกมปกติ แล้วรัน:

```js
eval(await (await fetch('/tools/live-frame-probe.js')).text());
WD.frameProbe.start(60);
```

เล่น training ตามปกติ 60 วินาที ให้แท็บอยู่ด้านหน้า แล้วอ่าน `WD.frameProbe.last` หรือรัน `WD.frameProbe.download()` เพื่อบันทึก JSON ลงเครื่อง ไม่มีการส่งข้อมูล/ดาวน์โหลดอัตโนมัติ หยุดก่อนเวลาได้ด้วย `WD.frameProbe.stop()`

ตัวเก็บใช้ RAF วัดระยะห่างของเฟรมที่แท็บมองเห็น ตัดช่วงแท็บถูกซ่อน บันทึก mode/map/class, resource counts และ long task เมื่อเบราว์เซอร์รองรับ เก็บรายละเอียดเฟรมช้าไม่เกิน 120 รายการ ไม่ได้ติดตั้งใน runtime ปกติและไม่เพิ่มภาระทุกครั้งที่เปิดเกม ค่าก็ยังได้รับผลจากเครื่องและแท็บอื่นได้

## ทำซ้ำ

ใช้ server เดิมพอร์ต 8765 รัน browser test ทีละคำสั่งเพื่อลดภาระเครื่อง:

```powershell
node tools/headless.js --game --js tools/audit-night.js --timeout 1200 --quiet
node tools/headless.js --game --url "index.html?nosw&deathSkill=abyssalbeam" --js tools/check-respawn-animation.js --timeout 180 --quiet
node tools/headless.js --game --url "index.html?nosw&soak=dragondeep&cycles=16" --js tools/audit-resource-soak.js --timeout 600 --quiet
node tools/headless.js --game --url "index.html?nosw&soak=abyssalbeam&cycles=24" --js tools/audit-resource-soak.js --timeout 600 --quiet
node tools/headless.js --game --js tools/check-mode-lifecycle.js --timeout 600 --quiet
node tools/headless.js --game --js tools/bench-party.js --timeout 300 --quiet
node tools/check.js
git diff --check
```

สคริปต์ที่ส่งผ่าน `--js` เป็น body ของ async function ใน browser ไม่ใช่ Node script โดยตรง ทุกผลทดสอบเป็น local ไม่ได้ครอบคลุมความหน่วงเน็ต/host migration/แมตช์ยาวทุกโหมด และไม่ได้อัดทับ Storyboard เดิม

ตรวจส่งท้าย: `node tools/check.js` ผ่าน 82 ไฟล์; parse ชุดทดสอบใหม่ทั้ง 5 ตัวด้วย AsyncFunction และ `node --check tools/live-frame-probe.js` ผ่าน; สร้าง CODEMAP ใหม่และ `git diff --check` ผ่าน ภาพ `shots/night_party_peak.jpg` เปิดตรวจแล้ว ใช้ยืนยันฉากทดสอบเท่านั้น ไม่ใช้ตัดสินความสวยของทุกแอนิเมชัน
