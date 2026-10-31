# เมืองพังได้ + เล่นกับบอท — แผน (2026-10-27)

> **For Claude:** plan only — nothing built yet. User wants (1) an extra-large **modern city** map, destructible like Battlefield, playable in **every mode**, and (2) a way to play **against bots that use player skills**. All decisions in §8 answered. Bot brain v1 is built by the training-room chat — don't build a second one here; this plan's step 1 waits for it. Bots = solo play only for now (no filling online rooms).
> **Shared with `designs/training-zones.md`:** that plan's "bot brain v1" (its step 2) is the SAME bot brain as step 1 here. Build it once (host side, `js/41` `botBrain` grows into its own file), whichever plan gets there first. Don't make two bot systems.

## 0. ภาพรวม (สำหรับผู้ใช้)
- **แมพ "เมือง"**: เมืองยุคปัจจุบัน ถนน ตึก รถ ไฟจราจร สวน ลานจอดรถ — ใหญ่กว่าแมพตอนนี้มาก
- **พังได้แบบ Battlefield**: ผนังแตกเป็นรู ตึกถล่มทีละชั้น กระจกแตก รถระเบิด เสาไฟล้ม — ร่องรอยค้างทั้งแมตช์ (กฎเดิมจาก `battlefield.md`: เริ่มสวย พังเพราะผู้เล่นเท่านั้น)
- **เล่นได้ทุกโหมด**: แต่ละโหมดใช้พื้นที่ต่างกัน (ดวล = แค่สี่แยกเดียว, FFA/ทีม = หลายบล็อก, แบทเทิลรอยัล = ทั้งเมือง)
- **บอท**: เพิ่มบอทในห้องได้ทุกโหมด เลือกธาตุ + ความเก่ง บอทใช้สกิลชุดเดียวกับผู้เล่น (คอมโบ หลบ อัลติ) และรู้จักหลบหลังตึก / พังกำแพงเข้าหาเรา

## 1. ขนาดแมพ (✅ 480 × 480 ม.)
| | ขนาด (px เกม) | ขนาดจริงประมาณ |
|---|---|---|
| แมพดวลตอนนี้ | 1600 × 1000 | 80 × 50 ม. |
| Test Place ใหม่ | 7200 × 5400 | 360 × 270 ม. |
| **เมือง (เสนอ)** | **9600 × 9600** | **480 × 480 ม. ≈ 4 × 4 บล็อกเมือง** |

แบ่งเป็นย่าน (ตัวอย่าง — ผู้ใช้ปรับได้):
```
 ┌──────────┬──────────┬──────────┬──────────┐
 │ สวนสาธารณะ│ ย่านบ้าน  │ ย่านบ้าน  │ ท่าเรือ/โกดัง│
 ├──────────┼──────────┼──────────┼──────────┤
 │ สถานีรถไฟ │ ★ ใจกลาง  │ ย่านร้านค้า│ โกดัง     │
 ├──────────┼─ ลานใหญ่ ─┼──────────┼──────────┤
 │ ลานจอดรถ  │ ตึกสูง     │ ตึกสูง     │ ไซต์ก่อสร้าง│
 ├──────────┼──────────┼──────────┼──────────┤
 │ สวน/สนาม │ ย่านบ้าน  │ ทางด่วนลอย │ ใต้สะพาน   │
 └──────────┴──────────┴──────────┴──────────┘
```
แต่ละย่านเล่นต่างกัน: โล่ง (สวน/ลานจอด = ยิงไกล) • แคบ (ซอยบ้าน = ประชิด) • สูง (ตึก/ทางด่วน = บินไม้กวาด ยิงจากบน)

## 2. ของที่พังได้ (Battlefield)
| ของ | พังยังไง | ขวางทาง? |
|---|---|---|
| บ้าน 1–2 ชั้น | แบบบ้านตอนนี้ (ผนัง/หลังคาแตกเป็นชิ้น) + ชั้นสอง | ✔ |
| ตึกแถว/ร้านค้า 2–3 ชั้น | ผนังเป็นรู → ชั้นบนถล่มเมื่อเสาชั้นล่างหายพอ → กลายเป็นกองซากปีนได้ | ✔ |
| ตึกสูง 6–10 ชั้น | ทำลายได้แค่ผนังด้านนอก + **ไฮไลต์ 1 ตึกถล่มทั้งตึก** (เหมือน Levolution — ต้องใช้แรงมาก ทั้งแมพเห็น) | ✔ |
| กระจกหน้าร้าน/หน้าต่าง | แตกทันทีที่โดน (ยิงทะลุได้หลังแตก) | ✘ (บังสายตา) |
| รถยนต์ | บุบ → ไฟลุก → ระเบิด (ดาเมจรอบตัว) → ซากค้าง | ✔ |
| เสาไฟ/ไฟจราจร/ป้าย | ล้มทั้งต้น | ล้มแล้ว ✘ |
| ต้นไม้ริมถนน รั้ว ม้านั่ง ถังขยะ | แตก/ล้ม (ต่อจาก battlefield ขั้น 4) | บางอย่าง |
| พื้นถนน | รอยไหม้/หลุม/แตก ค้างทั้งแมตช์ (ต่อจาก battlefield ขั้น 2) | ✘ |

## 3. เล่นได้ทุกโหมด
| โหมด | ใช้พื้นที่ | หมายเหตุ |
|---|---|---|
| ดวล 1v1 | ลานใหญ่ใจกลาง (≈1 บล็อก) มีขอบเขตล่องหน | ตึกรอบลานยังพังได้ |
| FFA / ทีม | 2×2 บล็อกกลางเมือง | จุดเกิดกระจายตามซอย |
| ดันเจียน Co-op | มอนสเตอร์บุกเมืองทีละคลื่น ไล่จากขอบเข้ากลาง | บอสพังตึกได้ |
| แบทเทิลรอยัล | ทั้งเมือง วงหด | ของเก็บอยู่ในร้าน/ตึก |
| แข่งไม้กวาด | ห่วงลอยผ่านถนน ลอดใต้ทางด่วน รอบตึกสูง | |
| ควิดดิช | ห่วงตั้งกลางลานใหญ่ / สวน | ✅ ผู้ใช้เอา |
| หาโวลเดอมอร์ | ภารกิจกระจายในตึก ใช้ครึ่งเมือง | ✅ ผู้ใช้เอา |
| ห้องฝึก | ไม่ใช้ (ห้องฝึกมีแมพของตัวเอง) | |

## 4. บอท
**เข้าห้องยังไง:** ในห้องรอ มีปุ่ม "+ บอท" → เลือกธาตุ (หรือสุ่ม) + ความเก่ง (ง่าย / กลาง / ยาก) → บอทเติมช่องว่าง เล่นคนเดียวไม่ต้องต่อเน็ตก็ได้ • บอทอยู่ทีมไหนก็ได้ (คน+บอท ผสมกัน)

**บอทเก่งแค่ไหน** (ตัวเลขจริงให้ทีมเกมเพลย์ปรับ):
| | ง่าย | กลาง | ยาก |
|---|---|---|---|
| เล็งพลาด | มาก | กลาง | น้อย (เล็งนำเป้า) |
| ตอบสนองช้า | 0.6 วิ | 0.35 วิ | 0.15 วิ |
| ใช้คอมโบธาตุ | ✘ | บางที | ✔ ตั้งต้น→ต่อยอด→ปิดจบ |
| หลบสกิล | แทบไม่ | บางที | หลบ/บล็อกเป็น |
| ใช้ที่กำบัง/พังกำแพง | ✘ | ✔ | ✔ + ซุ่ม + ดักทาง |

**บอทคิดยังไง (ทุกโหมด):** เลือกเป้า → เดินหาเป้า (หาทางผ่านเมือง อ้อมตึก หรือพังกำแพงทะลุ) → รักษาระยะตามธาตุ → ยิง/ใช้สกิลตามคอมโบ → หลบ → เลือดน้อยหนีไปหลบหลังตึก
**โหมดพิเศษ:** ควิดดิช (แย่งบอล/โยน) • แข่งไม้กวาด (บินตามห่วง) • BR (เก็บของ หนีวง) • Co-op (ช่วยทีมตีมอนสเตอร์) • หาโวลเดอมอร์ (ทำภารกิจ + โหวตแบบง่าย — ทำทีหลังสุด)

## 5. ลำดับการสร้าง
แต่ละขั้นเล่นได้จริงก่อนไปขั้นต่อไป
1. **บอท v1 + ปุ่ม "+ บอท" ในห้อง** — เล่นกับบอทได้ทันทีในแมพเดิม (ดวล / FFA / ทีม) ⟵ ใช้ร่วมกับแผนห้องฝึก
2. **เตรียมเครื่องยนต์สำหรับแมพใหญ่** — ยังไม่เห็นอะไรใหม่ แต่ถ้าไม่ทำ เมืองจะกระตุก (ดู §7)
   ✅ ทำแล้ว 2026-10-27: ส่งเฉพาะของที่พังเพิ่ม • ตารางช่องเช็กชน (โฮสต์เร็วขึ้น ~5 เท่า) • ซ่อนตึก/ของที่ไกลเกินหมอก (วาดน้อยลง ~3 เท่า) • แมพทดสอบ `citytest` • เหลือ: พื้นที่ต่อโหมด + งบเศษซาก (ทำตอนมีเมืองจริง)
3. **เมืองแบบกล่องเทา (blockout)** — ถนน ตึกเป็นกล่อง เดินเล่น/ทดสอบขนาดกับผู้ใช้ก่อนลงรายละเอียด
   ✅ ทำแล้ว 2026-10-27: แมพ `city` เลือกได้ในเมนูแมพ • ภาพผัง `designs/maps/city-greybox.svg` • ยังไม่มี: เดินขึ้นทางด่วน, น้ำจริงที่ท่าเรือ, พื้นที่ต่อโหมด (FFA/ทีม เกิดห่างกันมาก)
4. **ชุดตึกพังได้** — ตึกแถว 2–3 ชั้น ถล่มทีละชั้น, กระจก, รถระเบิด, เสาไฟล้ม
   ✅ ทำแล้ว 2026-10-27: แผ่นผนังแตกเป็นรู → ชั้นล่างพังพอ = ทั้งหลังทรุดเป็นกองซาก • เสา/ตู้ล้ม ของเล็กแตก • รถไฟลุก → ระเบิด → ซาก • บ้านลอนดอนพังได้แทนบ้านหิมะ • ยังไม่ได้ลองออนไลน์ 2 เครื่อง
5. **บอทหาทางในเมือง** — อ้อมตึก ใช้ที่กำบัง พังกำแพงเข้าหา อัปเดตทางเมื่อตึกพัง
   ✅ ทำแล้ว 2026-10-31 (`js/15-botnav.js`): อ้อมตึกตามถนน • เลือดน้อยวิ่งหลบหลังที่กำบัง • เป้าหลบหลังตึก = ยิงผนังตึกให้ถล่ม (ระดับกลาง/ยาก) • ทางอัปเดตเมื่อของพัง • เปิดเฉพาะแมพ city
6. **เปิดทุกโหมดในเมือง** — พื้นที่/จุดเกิด/ห่วง/ของ/ภารกิจ ต่อโหมด + บอทแต่ละโหมด
   ✅ ทำแล้ว 2026-10-31: พื้นที่เล่นต่อโหมด (กำแพงล่องหน + ม่านเรืองแสง) • จุดเกิด/ห่วงแข่งไม้กวาด/ภารกิจ/จุดเกิดมอนสเตอร์ต่อโหมด • ควิดดิชในสนามกีฬา • ควิดดิช/BR เลือกเมืองแทนแผนที่ประจำได้ • บอทยังใช้สมองต่อสู้อย่างเดียว (ยังไม่เล่นตามกติกาโหมด เช่น แย่งบอล/บินตามห่วง)
7. **ลงภาพจริง** (Blender + VFX Studio สไตล์ C) + ตึกสูงถล่มไฮไลต์ + บรรยากาศตามความพัง (battlefield ขั้น 5)

## 6. สไตล์ภาพ (✅ ธีมเมืองมักเกิ้ล)
เกมเป็นโลกเวทมนตร์ → เสนอธีม **"เมืองมักเกิ้ลยุคปัจจุบัน"** (เมืองคนธรรมดาที่พ่อมดมาดวลกัน) โทนสีหม่นแบบสไตล์ C ที่เลือกไว้ • ก่อนขั้น 7 ทำบอร์ดภาพอ้างอิง 2–3 ทางให้เลือก (ผู้ใช้ชอบดูภาพก่อน)

## 7. Tech notes (for Claude)
- **Bot brain:** today `botBrain(p,dt)` in `js/41-debug.js` (debug-grade: nearest foe, fixed range table per spell id, per-path hacks). Move to its own file (e.g. `js/1x-bots.js`, host side, before `js/11` uses it at load? — it's only called at runtime from `hostTick`, so any position works), keep the "write `p.inp` like a real player" approach so bots go through the exact same code as players (fair, no protocol change for the brain itself). Add: difficulty profile (aim error, reaction delay queue, combo use, dodge on incoming `G.proj`/telegraphs), per-spell data instead of the hard-coded range table (put `bot:{r,when}` hints next to the spell defs), mode goals (`botGoal(p)` per mode).
- **Bots in lobby:** host-only `addPlayer` with `bot:true` + `botLv` + kit; lobby UI button; bots must count for `MODES.min`. Solo offline play already works (`#btnSolo`). Snapshot carries bot name/kit like a player → maybe nothing new; if a bot flag is shown in UI → `PREFIX` bump.
- **Big-map engine work (step 2) — current code won't scale:**
  - `collideWorld` (js/12) loops every prop / BRK / building per mover → add a uniform spatial grid (e.g. 400 px cells) for OBS, PROPS, BRK, BLDG pieces; projectiles query the grid too.
  - `bldSnap` sends ALL buildings every snapshot as one string → with ~150 buildings that's too big. Change to **event/delta**: send only pieces that changed since the client's last ack + full state on join/midJoin. `PREFIX` bump.
  - Rendering: per-district chunk groups with frustum + distance culling, instanced windows/cars/lamps, merged static geometry per chunk, LOD for far buildings (box with baked texture). Shadow map can't cover 480 m → `shadowFollow` already follows the local player; keep shadow distance short.
  - Minimap: HUD4 already has one (top right) — check it scales to 480 m.
  - Debris/decal caps (`DEBRIS` 180, decals ~40 in battlefield plan) need per-chunk budgets, merge rubble into static mounds (house `BLD_MOUND` pattern).
  - Mode sub-areas: `MODES[x].area` → `{x1,y1,x2,y2}` per map, used by spawn points, `collideWorld` bounds (invisible wall), BR ring, camera clamp. Generic, also useful for other big maps.
- **Destruction kit (step 4):** generalise `BLDDEF`/`BLD_PIECES`/`BLD_GRID` (now one `house` type) into data-driven building types with floors: pieces per floor, support rule per floor (`bldSupport` already handles roof vs top wall row → extend: floor N collapses when floor N-1 supports < X%). Glass = cheap piece with 1 HP, no collision. Cars = new destructible object type (hp → burning → explode via existing `explode`). Big tower collapse = scripted host event + client animation (fx event), result = static rubble OBS.
- **Bot navigation (step 5):** 2D nav grid over the map (e.g. 40 px cells) built from OBS + building footprints; A* per bot every ~0.5 s (stagger bots), mark cells free when a building piece/wall breaks (BLD/BRK change hooks). Cover = cells next to solid pieces with line-of-sight blocked (`bldRay`) from the target. "Break through" = if path detour > N× straight distance and wall HP low → shoot the wall.
- **Map source:** city layout via code generator (like `genTest`, deterministic `mulberry` seed) for blockout; real buildings as Blender modular kit (`assets/src/` scripts, house_chunks.py pattern) → the file-map pipeline (`assets/maps/<id>.json+.glb`, `regFileMap`) can hold the static ground/roads.
- **Perf targets:** keep the existing median frame time (`tools/bench-vfx.js`) on the city with 6 players + bots; test low `QUAL`.
- **Team split:** balance/bot numbers = gameplay team; this user owns logic/systems/perf → build frameworks with placeholder numbers and say so.

## 7b. โมเดลตึก/ของในเมือง (2026-10-27)
✅ ผู้ใช้เลือก: **ลอนดอนยุคปัจจุบัน** (ตึกอิฐ ตู้โทรศัพท์แดง รถเมล์ 2 ชั้น แท็กซี่ดำ ตู้ไปรษณีย์แดง) • **สไตล์ C เดิม** (ทรงการ์ตูน สีหม่น เข้ากับบ้าน/ควันที่มี) • **ปั้นเองใน Blender ด้วยสคริปต์** (แบบ `assets/src/house_build.py` + `house_chunks.py`)
ของเพิ่มตามธีมลอนดอน: ตึกแถวอิฐ (terraced) + ประตูสี • ร้านหัวมุม/ผับ • ตึกออฟฟิศหินขาว • ตู้โทรศัพท์แดง • ตู้ไปรษณีย์แดง • รถเมล์แดง 2 ชั้น • แท็กซี่ดำ • ป้ายรถไฟใต้ดิน (วงกลมแดง) • ราวเหล็กดำหน้าบ้าน • เสาไฟแบบเก่า
**หลักคิด: ตึกประกอบจาก "แผ่นผนังสำเร็จรูป" (modular kit)** — ผนัง 1 แผ่น = กว้าง 4 ม. × สูง 1 ชั้น (3.5 ม.) • ตึกทุกหลังในผังสร้างจากการเรียงแผ่น (กล่องในผังตอนนี้ = ขนาดจริงของตึก)
- พังได้ตรงตัว: 1 แผ่น = 1 ชิ้นที่พัง (เหมือนบ้านตอนนี้ แต่ขยายเป็นหลายชั้น) → ขั้น 4 ใช้แผ่นเดียวกันเลย
- เบา: แผ่นชนิดเดียวกันวาดรวมครั้งเดียวทั้งเมือง (instancing) • ปั้นน้อยชิ้น ได้ตึกหลายแบบ
- แต่ละแผ่นมี 2–3 สภาพ: ปกติ / ร้าว / พัง (เหลือโครงเหล็ก-ขอบแตก) + เศษที่กระเด็น

**ชุดแผ่นผนัง (ต่อ 1 สไตล์ตึก)**
| ชิ้น | ใช้ที่ |
|---|---|
| ผนังหน้าต่าง / ผนังเรียบ / ผนังประตู | ทุกชั้น |
| หน้าร้าน (กระจกบานใหญ่ + ป้ายร้าน + กันสาด) | ชั้นล่างย่านร้านค้า |
| มุมตึก / เสา | ขอบตึก |
| ขอบดาดฟ้า + ของบนดาดฟ้า (แอร์ ถังน้ำ เสาอากาศ) | หลังคา |
| พื้น/เพดานระหว่างชั้น | ตอนผนังพังจะเห็นข้างใน |
สไตล์ตึกที่ต้องมี: ตึกแถว/ร้านค้า (อิฐ) • ออฟฟิศ (คอนกรีต+หน้าต่าง) • ตึกกระจก • โกดัง/สถานี (เหล็ก) • บ้าน (มีแล้ว — ปรับให้เข้าธีมเมือง)

**ของในเมือง (prop)**
| กลุ่ม | ของ | พังได้? |
|---|---|---|
| ถนน | เสาไฟ ไฟจราจร ป้ายจราจร ป้ายรถเมล์ ตู้โทรศัพท์ ตู้ไปรษณีย์ ก๊อกดับเพลิง ม้านั่ง ถังขยะ กระถางต้นไม้ | ล้ม/แตก |
| รถ | รถเก๋ง แท็กซี่ รถตู้ รถเมล์ รถขยะ (+ ซากไหม้) | บุบ → ไฟลุก → ระเบิด |
| ท่าเรือ/โกดัง | ตู้คอนเทนเนอร์ พาเลท ลัง ถังน้ำมัน (ระเบิด) เรือ | บางอย่าง |
| ก่อสร้าง | นั่งร้าน กรวย แผงกั้น ปั้นจั่น กองท่อ | ล้ม |
| สถานี | ตู้รถไฟ ชานชาลา ม้านั่ง | – |
| สวน | ต้นไม้ (มีแล้ว) พุ่มไม้ น้ำพุ ม้านั่ง ไฟสวน | ต้นไม้ล้ม |

✅ ชุดทดสอบทำแล้ว 2026-10-27: ตึกแถวอิฐ (9 แผ่น) + ตู้โทรศัพท์ ตู้ไปรษณีย์ เสาไฟ ม้านั่ง แท็กซี่ — วางในย่านร้านค้า • ภาพ `designs/maps/city-kit-street*.png` • รอผู้ใช้ตรวจ
✅ ครบทั้งเมืองแล้ว 2026-10-27: ตึกออฟฟิศ / ตึกกระจก / โกดัง / อาคารจอดรถ + รถ รถเมล์ รถไฟ ตู้คอนเทนเนอร์ เรือ ปั้นจั่น ไฟจราจร ป้ายรถเมล์ ฯลฯ • ภาพ `designs/maps/city-kit-*.png` • ที่ยังไม่เปลี่ยน: บ้านในย่านบ้าน (ยังเป็นบ้านหิมะแบบฮอกส์มี้ด — ต้องทำบ้านลอนดอนแบบพังได้ในขั้น 4)
**ลำดับทำ (เสนอ):** บอร์ดสไตล์ (ภาพ 2–3 ทางให้เลือก) → ชุดตึกแถว 1 สไตล์ + ของริมถนน 5–6 ชิ้น ลองใน 1 ย่าน → ผู้ใช้ผ่าน → ทำครบทุกสไตล์ → ต่อขั้น 4 (พัง)

## 8. การตัดสินใจ
✅ = ผู้ใช้ตอบแล้ว (2026-10-27)
1. ✅ ขนาดเมือง **480 × 480 ม. (9600 × 9600 px, 4×4 บล็อก)**
2. ✅ ธีม **"เมืองมักเกิ้ล"** (เมืองคนธรรมดายุคปัจจุบันที่พ่อมดมาดวลกัน)
3. ✅ **เอา** ตึกสูงถล่มทั้งตึก 1 ตึก (ไฮไลต์)
4. ✅ เล่นได้ **ทุกโหมดยกเว้นห้องฝึก** (ควิดดิช = ห่วงกลางลาน, หาโวลเดอมอร์ = ใช้ครึ่งเมือง)
5. ✅ **ตอนนี้ยัง** — บอทเล่นได้แค่ตอนเล่นคนเดียว (ไม่เติมคนในห้องออนไลน์กับเพื่อน) • ค่อยเปิดทีหลัง
6. ✅ **แชทห้องฝึกทำ** bot brain v1 (`designs/training-zones.md` ขั้น 2) → ขั้น 1 ของแผนนี้ = แค่ปุ่ม "+ บอท" ในห้องเล่นคนเดียว ต่อจากสมองบอทนั้น
