# guides/Destruction.md — สิ่งที่พังได้ในเกม

> อัปเดต 2026-11-21: **บ้านเป็นแผ่นพังแล้ว (§13)** — ระบบบ้านแบบเก่า (6 ส่วน 54 ชิ้น, `bld_house.glb`, BLDG, snapshot `BD`) ถูกลบออกทั้งหมด
> ระบบที่ยังใช้: ของบังในแผนที่ไฟล์ (§9), เมืองพังได้ (§11), สะพานเปลือกไข่ (§12), แผ่นพัง + บ้าน (§13) • ปรับเลือดได้ใน Tune (`pnl.<วัสดุ>.hp`, `bld.brk.hp*`)

---

## 9. ของบังในแผนที่ไฟล์ที่พังได้ (หิน เสา รูปปั้น ต้นไม้ ของเล็ก) — 2026-10-20

ผู้ใช้เลือก: **ของบังเล็ก-กลาง** (กำแพงขอบ/กำแพงใหญ่/โต๊ะห้องโถงไม่พัง) • **ร้าว → แตก** • **โดนเฉพาะสกิลแรง** • **ซากเตี้ยยังบังได้** • เลือด **ตามขนาด 100/200/400** • ซากสูง **1/3 ของเดิม** • ร้าว **2 ขั้น (66%, 33%)** • กลุ่มของ: หิน/เสา/รูปปั้น + ต้นไม้ + ของเล็กในฉาก

| อะไร | ทำงานยังไง |
|---|---|
| อะไรพังได้ | ที่ชน `col_` ที่มี **โมเดลของตัวเอง** วางอยู่ในรอยเท้า (`map_export.py` ผูกให้เอง: ติด `brk` ที่โมเดล + `b` ที่วงกลมที่ชน + รายการ `brk[]` ในไฟล์ .json) ของที่ไม่มีโมเดลแยก (กำแพง ขอบแผนที่ โต๊ะ) = ไม่พัง • ไม่อยากให้อันไหนพัง: ใส่ custom property `nobrk = 1` ที่ `col_` นั้น • กังหันลมหุบเขาตัดออกแล้ว |
| จำนวน | castle 17 • forest 169 • greathall 8 • hogsmeade 45 • lake 47 • meadow 22 • pitch 34 • ruins 23 • valley 82 (2026-10-28) |
| ขนาด → เลือด | ปริมาตรโมเดล (กว้าง×ลึก×สูงโมเดล ม³) **< 15 = เล็ก 100 • < 60 = กลาง 200 • ที่เหลือ = ใหญ่ 400** (`BRKDEF` ใน `js/12-buildings.js`) |
| อะไรทำดาเมจ | เฉพาะ `damageEnv` (สกิลวงกว้างที่พังบ้านได้อยู่แล้ว: ลูกไฟใหญ่ Kindle, Dragonfall, อัลติ Pyro, Iceboom/Permafrost, Storm strike/Railgun/Dome, สาย Earth, ระเบิด) — กระสุนธรรมดา **ไม่** ทำ • ขอบวงเหลือ 30% เหมือนบ้าน • ไม่มีตัวคูณธาตุ |
| ร้าว | เลือด < 66% = ร้าวบาง, < 33% = ร้าวหนา (วัสดุรอยร้าว `brkCrackMat` ลาย voronoi ตามพิกัดโลก) + เศษเล็ก/ฝุ่น |
| พัง | เลือดหมด → ที่ชนเหลือสูง **1/3 ของความสูงโมเดล** (ยังเดินชน/บังกระสุนต่ำได้) • ภาพ: ตัดโมเดลเหลือส่วนล่าง (ขอบหยัก) + กองหินบนรอยตัด • ส่วนบนล้มออกจากจุดระเบิดแล้วจมหาย (เฉพาะเครื่องนี้) |
| กลับมา | ตอนเริ่มเกมใหม่เท่านั้น (เหมือนบ้าน) |
| ของเล็กที่ไม่มี col_ (2026-10-28) | ม้านั่ง / รั้ว / เสาไฟ / ตะเกียง / ลัง / ถัง / เกวียน / ป้าย (`AUTO` ใน `map_export.py`) ได้ที่ชนตามรอยเท้าโมเดล + กลุ่ม brk ของตัวเองอัตโนมัติ • รั้วห่างขอบแมพ < 10 หน่วย = รั้วขอบแมพ ไม่พัง • ห่างขอบ < 1 = นอกสนาม ข้าม |
| ส่วนบนที่ล้ม (2026-10-28) | หล่นจากตอลงนอนราบ ค้างทั้งแมตช์ (สนามรบ ขั้น 2–4, รวม mesh ใน `bfRest` js/44) |

- **ความสูง:** ต้นไม้ในไฟล์แผนที่มีที่ชนสูงกว่าตัวต้นมาก (~15 ม. เทียบ ~6 ม.) จึงใช้ **ความสูงโมเดล `vh`** สำหรับรอยตัด ซากที่ชน และปริมาตร
- **ส่งผ่านเน็ต:** snapshot `BK` = ตัวเลข 0–3 ต่อกลุ่ม (ว่าง = ไม่มีอะไรเสีย) → **protocol `v31`** • เหตุการณ์ `{k:'brk', t:'c'|'b', i, st, mi (0 หิน 1 ไม้ 2 น้ำแข็ง), col, sz, x, y, h, hh, r, ox, oy}` + `t:'land'` (ในเครื่อง ตอนส่วนบนตกถึงพื้น)
- **เอฟเฟกต์ (VFX Studio):** `assets/fx/env/brk_crack`, `brk_break` (+ `brk_break_wood` เสี้ยนไม้/ใบไม้, `brk_break_ice`), `brk_land` • โมเดลเศษไม้ `assets/fx/mesh/wood_splinter` • ผูกใน `bind.json` `brk:c` / `brk:b` / `brk:land` (mode add) • สีเศษตามวัสดุ (`BRK_MCOL`)
- **ฝั่งจอ (`js/23-props-bld-view.js`):** `brkSetup` (โมเดลที่ติด `brk` ไม่รวม batch → รวมเป็น InstancedMesh ต่อ geometry+วัสดุ: forest 169 ชิ้น = 12 draw call) • `brkSync` (สลับปกติ/ร้าว/ซาก) • `brkClip` (ตัด geometry ด้วยระนาบหยัก) • `brkStump` • `brkFall`
- **ทดสอบ:** `WD.BRK` (สถานะ/เลือดต่อกลุ่ม) • `WD.damageEnv(x,y,r,dmg,null,'blast',1)` • `WD.BRKV`
- **แก้ไฟล์แผนที่แล้ว export ใหม่:** ระบบผูกเองทุกครั้ง (ดูชื่อที่ข้ามใน `BRK_SKIP` ของ `map_export.py`: หญ้า ดอกไม้ ของไกล ฯลฯ)

## 11. เมืองพังได้ (แมพ city) — 2026-10-27
ไฟล์: `js/12-city-dmg.js` (ข้อมูล/โฮสต์/snapshot) • ภาพ `js/28-city-build.js` (`cityViewSync`, `cityFX`) • ตัวเลขทั้งหมดอยู่ใน `CDMG` (ค่าตั้งต้น ให้ทีมเกมเพลย์ปรับ)
- **ตึก** = แผ่นผนัง 4 ม. × 1 ชั้น (ผัง `cityLayout` — โฮสต์กับภาพใช้ลำดับเดียวกัน) • เลือดต่อแผ่นตามชนิด `CDMG.hp` (ตึกไฮไลต์ × `CDMG.hl`) • หมด = รู (แผ่นแตก `*_hole`) ข้างในยังทึบ เดินเข้าไม่ได้
- ~~ถล่มทั้งหลัง~~ **เลิกแล้ว 2026-10-28 (ผู้ใช้: แบบ Battlefield ผนังนอกพังอย่างเดียว)** — แผ่นแตกแล้วเศษกองเป็นเนินที่โคนผนัง (`cityMounds`: ต่อคอลัมน์ 0.45 + 0.28 ม./ชั้นที่แตก สูงสุด 1.7 ม. เดินขึ้นได้ ทั้งนอกและในตึก)
- **เกณฑ์พัง (ผู้ใช้ 2026-10-29):** บ้าน / ตึก 1 ชั้น = ถล่มได้ทั้งหลัง • ตึก 2–4 ชั้น = แกนกลางพังไม่ได้ + ขอบนอกพังได้ (ผนัง + ขอบพื้นทุกชั้น + ขอบหลังคา กว้าง `CIN.band` 3 ม. แบ่งช่องเท่าแผ่นผนัง เลือด ×`CIN.secHp`) — ผนังกับขอบพื้นเหนือมันพังคู่กัน = ช่องโล่งไม่เหลือขอบ • ตึกสูงกว่า 4 ชั้น = ผนังพังอย่างเดียว (เดิม)
- **ผนังห้องชั้นใน + ทางลาดพังได้ (2026-10-29):** ตึก 2–4 ชั้นมีผนังชั้นในตามขอบแกนกลางทุกชั้น (เป็นส่วนของแกนกลาง พังไม่ได้ — `CIN.iwBreak` มีช่องประตูตรงประตูหน้า เว้นโล่งตรงทางลาด) → ขอบนอกพังหมดแล้วยังเป็นห้อง • ทางลาดพังได้ (เลือด ×2) พังแล้วต้องกระโดด/บินขึ้น • แผ่นประตูหน้าพังได้แล้ว
- **เข้าได้ (2026-10-28):** ตึกที่มีชุดผนัง (ยกเว้นลานจอดรถ) กลวง 1–3 ชั้นล่าง (`cityInterior`) • ประตู = แผ่นกลางชั้นล่างด้านหน้า เปิดตลอด พังไม่ได้ • ทางลาดฟันปลาเลียบผนังหลัง ชั้นละอัน (ตึกเล็กเกิน = ชั้นเดียว) • ผนังชนทีละแผ่นทีละชั้น (แผ่นแตก = ช่องเดิน/ยิงลอด) • เหนือชั้นที่เข้าได้ = ทึบเหมือนเดิม • ค่าใน `CIN`
- **ของในเมือง**: เลือด `CDMG.ihp` • หมด: เสา/ตู้ (`topple`) ล้มลงพื้น ส่วนอื่นแตกหาย — ที่ชนหาย • **รถ** (car/van/taxi/bus): ไฟลุก `burn` วิ → ระเบิด (`boom`: รัศมี/ดาเมจคน/ดาเมจสิ่งแวดล้อม — ลามรถคันอื่นได้) → ซากไหม้สีดำ (ยังชน)
- โดนจาก: กระสุนที่ชนวงกลมของตึก (`cityHitObs` ใน updateProjectiles) + วงระเบิดทุกอย่างที่เรียก `damageEnv` (`cityDamageIn`) • ปิดในโหมดที่ไม่มีของพัง (`BLDON`)
- **snapshot** `CB` (ตึกคั่น `|`: `x` = ถล่ม + บิตแผ่นแตกฐาน 16) / `CS` (ของ: 0 ปกติ 1 พัง 2 ไฟลุก 3 ซาก) ส่งแบบเฉพาะที่เปลี่ยน (`NETD_KEYS`) • เหตุการณ์ `cb` (h/b/c) / `cs` (b/f) + `boom`
- **บ้านลอนดอน** (`bt:'ldn'` → `BLDDEF.ldn`, โมเดล `bld_house_ldn`) = ระบบบ้านพังเดิมทุกอย่าง (ชิ้น/ตาราง/กองซาก) แค่หน้าตาใหม่ — สร้างด้วย `assets/src/london_house_build.py` แล้วตัดชิ้นด้วย `house_chunks.py -- house_ldn.glb`
- ดีบัก: `WD.city.D` (สถานะ) / `WD.city.K.CV` (ภาพ) • ยังไม่มี: ไฟ/น้ำแข็งเกาะผนังตึก, ของตกแต่งในตึก, ตู้คอนเทนเนอร์/ซุ้ม/อัฒจันทร์พัง

## 12. Castle Strike bridge: eggshell shell (2026-11-19)
- Bridge = solid core (never breaks) + outer stone shell cut into ~1.5 m chunks: side shell 0.35 m on the 4 faces, rim = outer 1 m strip of the deck top.
- Code: `js/12-fcs-bridge.js` (`BSKN.C` layout, `bskEnv` damage, `bskCut` floor hole, snapshot `BS`) • view `fcsCore` / `fcsShellBuild` / `fcsShellView` in `js/28-fcs-build.js`.
- Rules: strong skills only (`damageEnv`), cracks at 66 % / 33 %, then the chunk falls off and rubble core shows. Broken rim = no floor there (path narrower) + parapet unit above breaks.
- Model pipeline (re-run when the bridge, ground under it or `BSKV` changes, chunk index must match):
  1. `node tools/headless.js --game --js tools/fcs-bridge-export.js --quiet` then copy `shots/fcs_bridge_layout.json` to `assets/src/`
  2. `D:/Blender/blender.exe -b --python assets/src/fcs_bridge_build.py` -> `assets/buildings/fcs_bridge.glb` (`map_fcs_bridge`)
- Shell = stone blocks (ashlar courses + arch voussoirs) grouped into chunks; the game splits chunks back into blocks (`fcsBlocks`) so broken stones fall one by one and pile up (`FPILE`).
- Dev: F2 'ทำลาย / ซ่อม' works on chunks.

## 13. Breakable panels from Map Builder (แผ่นพัง) — 2026-11-21 (MAP-STANDARD round A)
Generic system for building any breakable structure in Map Builder: a wall panel cut into cells, HP per cell. Parts that must not break are normal walls/boxes/decor.
- Map Builder object `pn_wall` → `data.pnl[]` {x,y px, a, L, T px, z0, H m, cs cell size m, hp per cell, mat, m mode, thru, g group}. Editor: tool ▦ แผ่นพัง (N), door/window cut, in-editor test-break and checks — guides/MAP-BUILDER.md.
- Modes `m`: **`g` gone** = one HP pool, whole panel shatters (glass, doors) • **`p` pile** = cells break into holes, rubble heap at the base • **`l` layer** = crack → outer skin falls off (still solid, inner layer shows) → through; `thru:0` = damage only, never a hole.
- Materials `mat`: brick, plaster (skin over brick), stone, wood (burns), glass, metal — HP defaults `PNDEF.mat` in `js/12-pnl.js`.
- Cell stages 0 ok / 1 crack (< 65 %) / 2 skin gone (layer < 40 %) / 3 broken. Hits splash 25 % to the 4 neighbours (organic holes). Element: blast ×1.5, ice ×0.7, glass ×1.5, fire sets wood burning (`PNDEF.burn`/`dps`).
- Support: panels with the same `g` link where their cells touch (side by side or stacked). A cell stays while connected through unbroken cells to a cell on the ground; cut off = falls (`el:'fall'`). Example: lintel over a door falls when both wall pieces beside it are gone.
- Collision: columns that block the body (feet → +1.75 m) push like house walls; holes are walkable. Bullets: segment test through the slab (no tunnelling). Aim/skills/camera use `pnlRay`. Rubble heap adds walkable ground (`pnlMoundH` in `bldMoundH`), lower right under the wall line so holes stay passable.
- Net: snapshot `PN` (panels joined by `|`, 3 cells per char, delta per panel in `NETD_KEYS`) • events `{k:'pn',e:'h'|'b',i,c}` → `pnlFX`. Protocol v102.
- View `js/28-pnl-build.js`: one box per panel; damage = DataTexture (1 texel per cell) sampled smooth + noise; brick/stone/wood sample at the brick/plank centre so holes step along whole bricks; holes/recesses are ray-marched through the thickness (rim + inner layer visible). Pattern coords are world-continuous so panels line up. Shadow depth material cuts the holes too.
- Test map `pnl-demo` (`node tools/pnl-sample.mjs` → export). Debug: `WD.PNL`, `WD.pnlHit(panel,cell,dmg)`, `WD.damageEnv(...)`, `WD.pnlSnap/pnlParse`.
- Sloped panels `tl` (roofs: the slab leans about its length axis), gable triangles `sh:'tri'`, openings `ho` [[u0,u1,z0,z1]] (≤ 4 per panel: door/window holes cut exactly by the shader, cells inside do not exist). Extra materials: roof (slate), snowroof, timber (plaster + beams), litwin (lit window glass, glows).
- **Round C (2026-11-21): every old breakable house (OBS `k:'house'`, file maps `houses`, code maps test / city / valley …) is rebuilt as a panel group at map load** (`pnlHouseConv` → `MAPS[id].pnH`, house circles leave OBS, `BLDG` stays empty). Snow house = plaster over brick (skin falls off), snowy roof, lit windows, open door; London (`bt:'ldn'`) = brick + slate. 14 panels per house (4 walls with holes, 6 window panes, 2 gables, 2 roof slopes), ~520 cells. Unbreakable houses (`nb`) = panels with `nb`. Roof falls when the walls under it are gone (support graph). Map Builder: house → "แตกเป็นแผ่นพัง" to edit it panel by panel (`MD.pnHouseObjs`, mirror of `pnHouse`).
- Grass: panels are hidden while the grass is baked (blades next to a wall used to take the wall-top height and float after it broke) and no grass under wall lines / inside houses.
- Not yet: chimney, game-look preview inside the editor, burning flames on panels, bots do not path around panels, the old house code in js/12-buildings.js / 23-props-bld-view.js is now unused (delete later).
