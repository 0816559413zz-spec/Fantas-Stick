# Nature อัลติ — ร่าง Model สำหรับรีวิว 7 พ.ย. 2026

**สถานะล่าสุดหลังส่งภาพ:** ผู้ใช้ยังไม่เลือก/รับร่างA/B/C ขอเก็บงานเพื่อพักคิดดีไซน์ และสั่ง“save and commit push everything” จึงรวมต้นไม้ ภาพ งานวิจัย วัสดุ และMoonwaterที่ค้างไว้บันทึกขึ้นremoteด้วย คำว่าไม่commit/pushในบันทึกช่วงสร้างด้านล่างเป็นประวัติ ไม่ใช่ข้อจำกัดของคำสั่งล่าสุด ไม่ทำแบบต่อหรือผูกเกมจนผู้ใช้กลับมาคุย

## งานที่ผู้ใช้มอบหมาย

ผู้ใช้รับกำแพงr7และสั่งsave v1 แล้วเลือกงานยาวขณะนอน: **ต้นไม้อัลติ Nature ตามภาพ Loki พร้อมภาพหลายมุม** ต่อมาขอทำเพิ่มและให้ค้นคว้าละเอียด จึงทำร่างหลักA + ทางเลือกทรงB/C พร้อมทบทวนข้อค้างในสเปกNature ไม่เปลี่ยนกลไกหรือตัวเลข ไม่มีคำสั่งเอาเข้าเกม/ทำGIF/commitหรือpushร่างต้นไม้

กำแพงที่รับอยู่ `nature_wood_wall_v1` และตัวสร้างfreezeเดิม ห้ามแก้ทับ รอบนี้ไม่ได้เปลี่ยนโมเดลกำแพงหรือสี/ผิวของมัน

## สิ่งที่ทำแล้ว

| ร่าง | ชื่อใน Model | แนวทาง |
|---|---|---|
| **A (แนะนำให้เริ่มรีวิว)** | `nature_ult_tree_a` | มัดไม้จากรากขึ้นลำต้นไขว้กัน แล้วยอดแตกกว้าง ใกล้แนวภาพLokiที่เลือกที่สุด |
| B | `nature_ult_tree_b` | มัดรากเปิดช่องแกนกลางกว้างกว่าA รูปทรงพลังเวทอ่านชัด |
| C | `nature_ult_tree_c` | ลำต้นและยอดเอนออกด้านหนึ่ง รากฐานอีกด้านช่วยค้ำให้มีน้ำหนัก |

ทั้งสามเป็น**ข้อเสนอใหม่รอผู้ใช้รีวิว** ไม่มีใบในร่างนี้เพื่อดูโครงไม้/รากตรง ๆ ยังไม่ได้ตัดสินว่าจะห้ามมีใบในแบบสุดท้าย

- 83ชิ้น / **29,356สามเหลี่ยมจริงต่อร่าง** รวมแสงแกนและเส้นพลังแล้ว โดยยังเป็นโมเดลsolidรวมหนึ่งวัสดุ ไม่เพิ่มscene light/particles
- โครงหลักแต่ละมัดต่อเนื่องจากรากปลายไกล ผ่านฐานค้ำ ลำต้น และออกกิ่งบน ไม่ใช้ลำต้นกระบอกหนึ่งต้นแล้วเอาเชือกพันรอบ
- หน้าตัดรากเปลี่ยนเป็นสันค้ำ/ฐานแผ่ใกล้โคน พอแตะพื้นจะแบนและแตกแขนงจากรากแม่ ปลายค่อยฝังใต้พื้นเพื่อไม่ให้เหลือแผ่นบางซ้อนพื้น
- มัดหลักบิดต่างมุม/ระดับ ใช้poly sweepกรอบแนวผิวต่อเนื่อง แล้วต่อกิ่งลูกจากข้างในกิ่งแม่ให้ไม่มีปลายท่อตัดลอยอยู่ภายนอก จุดต่อเป็นการซ้อนผิวเพื่อภาพ ไม่ใช่ topologyผิวunionเดียวทั้งหมด
- ผิวเปลือกไม้ใช้วัสดุbarkเดิม แต่UVของต้นไม้ยืดตามเส้นให้เป็นเส้นใยถี่แทนลายปมกว้าง มีสันเส้นไม้รองที่เดินตามมัดหลัก
- เนื้อไม้เข้ม แกนเขียว/เขียวอ่อนอยู่ภายในช่องจริง ไม่ทำผิวไม้ทั้งต้นเป็นนีออน
- ขนาดภาพทดลองสูงประมาณ9.0–9.3ม. ฐานกว้างประมาณ10–11.6ม. **ไม่ใช่ขนาดเกม/radius/collisionที่อนุมัติ** ภาพมีตัวละครจริงช่วยเทียบ
- ไม่ได้ทำท่างอก/รับดาเมจ/แตกฮีล/หมดเวลา ไม่ได้ให้ทั้งต้นหมุน และไม่เรียกท่ารากยักษ์/ต้นไม้ล้มที่ถูกยกเลิกกลับมา

## ภาพและการเปิดดู

โฟลเดอร์ `designs/nature_vfx/ult_tree_review/` มีภาพที่สร้างจากmeshจริงในStudio:

- `a_hero.jpg`, `b_hero.jpg`, `c_hero.jpg`: มุมเฉียงในแมพทดสอบจริง
- `a_all_views.jpg` / `b_all_views.jpg` / `c_all_views.jpg`: แบบละ9มุม รวมหน้า/เฉียง/หลัง/ข้าง/ราก/แกน/ยอด/บน/ดินปั้น
- `three_silhouettes.jpg`: เทียบ3ร่างด้วยกล้องและฉากเดียวกัน
- `a_detail_review.jpg`: หน้า/หลัง/ราก/มัดไม้
- `a_dark_front.jpg`, `a_dark_hero.jpg`: ร่างAในgreathall แสดงว่าแกนเห็นได้ในฉากมืด แต่แสงในตัววัสดุไม่ได้ส่องพื้น/เปลือกเหมือนไฟจริง
- `*_material_*.jpg` และชุดmaterial sheet: geometry+shaderจริงในrigแสงแยกเพื่อดูวัสดุ พื้นหลังเรียบ **ไม่ใช่ภาพแสงเกม** ไม่ใช้ภาพสร้างAIแทนโมเดล

เปิดStudioโดยตรง:

```
http://localhost:8765/studio.html?mesh=nature_ult_tree_a&at=front&map=test&cam=front&dist=22&mview=mat
```

สลับชื่อท้ายเป็น`_b`/`_c`ได้ กำแพงที่รับเปิดชื่อ`nature_wood_wall_v1` ไม่เปิดstudyแล้วคิดว่าเป็นตัวfreeze

## สร้างซ้ำ

ต้องมีnumpyและPillow เซิร์ฟเวอร์เดิมพอร์ต8765เปิดอยู่ อย่าเปิดซ้ำ/ฆ่าของเซสชันอื่น

```powershell
python tools/nature-ult-tree-gen.py
node tools/fx-check.js
node tools/headless.js --url "studio.html?fx=start/hit&at=self&map=test&variant=all" --js tools/capture-nature-ult-tree.js --w 1600 --h 1120 --timeout 300 --quiet
node tools/headless.js --url "studio.html?fx=start/hit&at=self&map=greathall&variant=a&quick&name=nature_ult_tree_a_dark" --js tools/capture-nature-ult-tree.js --w 1600 --h 1120 --timeout 180 --quiet
node tools/headless.js --url "studio.html?fx=start/hit&at=self&map=test" --js tools/capture-nature-tree-material.js --w 1600 --h 1120 --timeout 240 --quiet
python tools/pack-nature-ult-tree.py
```

ตัวสร้างdeterministic ใช้seedต่อร่าง มีgeometryพร้อมUVที่แก้จุดได้ในแท็บModel จับภาพทีละprocessเพื่อลดการแย่งโหลด Chrome ทุกcaptureรอeffectเริ่มโหลดเสร็จก่อนเข้าModel แล้วปิดeffectชั่วคราว/เส้นwire/grid ไม่ผูกเอฟเฟกต์ใดเข้าตัวละคร

## ส่วนรองรับวัสดุ/ผิวที่เพิ่ม

เพิ่ม `emit` แบบopt-inต่อชิ้นpoly/part (0..5, ค่าเริ่มต้น0) สำหรับsolid model ส่งไปvertex attribute `aEmit` แล้วเติมแสงในตัวด้วยสีของชิ้นนั้น รองรับทั้งModel previewและruntimeชั้นmodel ไม่เพิ่มdrawcall/ไฟในฉาก ไม่เลือกแสงจากการเดาสีเขียว และไม่ทำให้ใบเขียวเดิมเรืองเอง

- `js/46-fx-make.js`: buildattributeเฉพาะมีชิ้นที่ไม่offและemit>0, clampค่าถูกต้อง; `fxModelEmission`ต่อshaderหลังbarkด้วยcache keyแยก
- `studio/maker.js`: material modeใช้แสงต่อชิ้น; clayไม่ใช้ ทั้งไฟล์geometry/วัสดุเก่าที่ไม่ใส่emitยังใช้ทางเดิม
- `js/45-fx-runtime.js`: solid modelเลือกpatchเมื่อgeometryมีattributeเท่านั้น รวมกรณีgrow
- `assets/fx/schema.json` / `FX-FORMAT.md`: อธิบายfieldในcommon model parts

**เกลี่ยรอยต่อผิว:** เพิ่ม`seamNormals`แบบopt-inต่อpart เฉลี่ยnormalของจุดตำแหน่งเดียวกันภายในชิ้นเดียวเพื่อไม่ให้UV seamเป็นเส้นขอบแข็ง ไม่เปลี่ยนจุด/UV/index ไม่เกลี่ยข้ามกิ่งคนละpart และpartที่ตั้งflat:trueยังคงแบนตามเดิม เปิดเฉพาะต้นไม้ร่างใหม่ กำแพงv1ไม่รับการเกลี่ยนี้ มีfixtureตรวจรอยต่อและflat bypassในcheckเดียวกัน

**งานMoonwater `endFrom/endTo` ในschema/runtime/formatเป็นคนละส่วนกับต้นไม้** เดิมแยกไว้ แต่คำสั่งล่าสุดของผู้ใช้ให้save/commit/pushทุกงาน จึงรวมบันทึกไว้พร้อมกัน ไม่มีการแก้binding/host/network/คลาสNatureในงานนี้

## การตรวจ

- `node tools/check.js`: ผ่าน85ไฟล์ (รวมStudio)
- `node tools/fx-check.js`: ไม่มีerror; มีwarningเดิมของโปรเจกต์ และคำเตือนประมาณpolyสูงของต้นไม้ ตัวlintนับpolyแบบเผื่อสูงกว่าจำนวนสามเหลี่ยมจากindexจริง จึงตรวจgeometryได้29,356tri ไม่อ้างว่าwarningเป็นศูนย์
- `tools/check-nature-tree-model.js`: compile shaderจริงในheadless, finiteattributes/index, emitส่วนที่ซ่อน/ค่าเริ่มต้น/ค่าผสม/clamp, material/clay, runtime default+grow ผ่าน page errors0
- เปิดสลับต้นไม้7รอบ: gl.info.memoryคง529geometries/136texturesตลอด7รอบที่วัด ไม่ใช้ตัวเลขนี้อ้างว่าFPSเกมหรือเครื่องผู้ใช้แก้แล้ว
- เปรียบเทียบgeometryทุกattribute/indexเมื่อเติมemit0ให้`poly_horn`และ`nature_wood_wall_v1`ได้ตรงกันทุกค่า กำแพงยังใช้cache key `fx-model-bark-v2`และไม่รับemissionpatch
- ภาพหลายมุมรวมราก/จุดต่อ/ดินปั้นตรวจด้วยตา มีcaptureฉากสว่างและมืด; ไม่ได้ทดสอบการชน/terrain/แมตช์12คนเพราะยังไม่ผูกเกม

หลักฐานlogsอยู่`shots/nature_tree_full_review.log`, `nature_tree_dark.log`, `nature_tree_material.log`, `nature_tree_validation_final.log`, `nature_tree_fxcheck.log` (shotsไม่ติดgit)

## งานค้างสำหรับคุยกับผู้ใช้

1. เลือกA/B/Cหรือแก้รูปทรงจากภาพก่อน ยังไม่ถือว่าผู้ใช้รับต้นนี้เพราะสั่งให้ลองทำ
2. คุยความกว้างราก/ความแน่นมัด/ทรงยอด/ความแรงแกนตามภาพ เมื่อได้ทรงแล้วค่อยวางanimation/VFXของสภาวะสกิล
3. ต้นไม้รับดาเมจแทนส่วนใหญ่และแตกฮีลครั้งเดียวเป็นทิศทางที่เลือกแล้ว แต่เปอร์เซ็นต์/HP/เวลา/รัศมี/ฮีล/CCยังไม่ล็อก อย่าสืบทอดตัวเลขอัลติดอกบัวยักษ์
4. ดูรายงาน`nature-design-consistency-review-2026-11-07.md`ก่อนพัฒนาNature คำถามค้างสำคัญคือต้นยิงfirerateใหม่กับกติกาโฟกัสเป้า

## งานร่วมกับเซสชันอื่น

กำแพงv1เก็บแล้วในcommit`6f927a9`; ภายหลังอีกเซสชันอัปเดตremoteจนorigin/mainมีcommitนี้แล้ว รอบต้นไม้ไม่ได้สั่งgitpushหรือcommitเอง

ระหว่างทำงานพบHANDOFFมีconflictจากstash apply (ไม่มีMERGE_HEAD/rebase) ฝั่งหนึ่งเป็นบันทึกNature/optimizationใหม่ อีกฝั่งเป็นบันทึกรากเก่า จึงเก็บทั้งสองฝ่าย ลบmarkerและติดป้ายรากเก่าว่าเป็นประวัติก่อนเปลี่ยนเป็นกำแพง แล้วstageเฉพาะHANDOFFเพื่อmarkresolution ไม่สร้างmergecommit และไม่แก้เนื้อหาCHANGELOGที่อีกเซสชันstageไว้ งานต้นไม้/ภาพใหม่ยังเป็นworking draft ไม่ได้commit

manifestภาพ/model hashและผลตรวจรอบสุดท้าย: `../designs/nature_vfx/ult_tree_review/review-manifest.json`

งานวิจัยแยก: `nature-ult-tree-deep-reference.md` มีแหล่งปฐมภูมิLoki/ต้นไทร/รากค้ำ/โคนกิ่ง พร้อมแยกข้ออนุมานศิลปะออกจากข้อเท็จจริง
