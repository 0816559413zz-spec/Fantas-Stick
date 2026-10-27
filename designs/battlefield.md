# สนามรบแบบ Battlefield — แผน (ผู้ใช้อนุมัติ 2026-10-27)

> **For Claude:** user plan for a "battlefield" feel. Read this before any work on dust/smoke/debris/scorch/grass.
> Core rule from the user: **the map starts clean and pretty — every mark comes from players fighting** (no pre-placed wreckage). Marks stay until the match ends; a new match = clean map again.
> Status: **ขั้น 0 done (user picked C). ขั้น 1 built 2026-10-27 (not hand-played)** — files/routing in HANDOFF §0 BATTLEFIELD. Next: ขั้น 2 (marks stay all match).

## หลักการ
- แมพเริ่มสวยสะอาด 100% ทุกร่องรอยมาจากการต่อสู้ของผู้เล่นเท่านั้น
- ร่องรอยค้างจนจบแมตช์ → แมตช์ใหม่แมพกลับมาสวย
- ยิ่งสู้ตรงไหนหนัก ตรงนั้นยิ่งเละ

## ขั้น 0 — เทียบสไตล์ ✅ เลือก C
ระเบิดชุดเดียวกัน (ฝุ่นวง + ควันค้าง + รอยไหม้ + เศษ) 3 แบบ ให้ผู้ใช้เลือก:
- **A สมจริง** — ฝุ่นเทาน้ำตาล ควันดำทึบ เศษคม (`assets/fx/env/bf_style_a`)
- **B การ์ตูน** — ควันก้อนนุ่ม ขอบชัด สีอุ่น (`assets/fx/env/bf_style_b`)
- **C ผสม** — ทรงการ์ตูน สีหม่น (`assets/fx/env/bf_style_c`)
สร้างด้วย `python tools/bf-style-gen.py` (ควันการ์ตูน `tex/smoke_toon` จาก `tools/bf-tex-gen.py`) • ภาพเทียบ `designs/vfx-variants/bf-style-v3.jpg` (ด้านข้าง) + `bf-style-v3-game.jpg` (มุมเกม)
ผลที่เลือก: **C ผสม** (ผู้ใช้ 2026-10-27) → ทุกเอฟเฟกต์หลังจากนี้ใช้สไตล์นี้

## ขั้น 1 — ควัน/ไอจากสกิล ✅ ทำแล้ว (รอเล่นจริง)
`assets/fx/env/bf_<ธาตุ>` (+ `_air`, `_trail`, `_cast`) จาก `tools/bf-skill-gen.py` • ตัวเลือกไฟล์ `bfAfter` ใน js/44
| ธาตุ | ตอนใช้ | หลังสกิลลง |
|---|---|---|
| 🔥 ไฟ | ควันลอยจากลูกไฟ/เปลว/มือ | ควันดำค้าง เขม่า รอยไหม้ |
| ⚡ สายฟ้า | ประกายแตก | รอยไหม้เป็นเส้นแตกแขนง + ควันจาง |
| ⛰️ หิน | ฝุ่นตอนหินโผล่/พุ่ง | ฝุ่นก้อนใหญ่ เศษกรวด พื้นแตก |
| ❄️ น้ำแข็ง | ไอเย็นสีขาวไหลลงต่ำ | คราบน้ำแข็ง + ไอเย็นค้าง |

## ขั้น 2 — ร่องรอยค้างบนพื้น + เศษซาก
- รอย (ยังไม่เป็นหลุมจริง — ผู้ใช้: "ในอนาคตจะทำเพิ่ม" → ออกแบบให้เปลี่ยนเป็นหลุมจริงได้ทีหลัง) ค้างทั้งแมตช์ หน้าตาตามธาตุ
- เศษบ้าน/หิน/ไม้กองค้าง ไม่หาย (ตอนนี้หายใน 3–4 วิ)
- บ้านถล่ม = ฝุ่นก้อนใหญ่ฟุ้ง • ของที่โดนเผาไฟค้างสักพัก → ตอไหม้/เถ้า

## ขั้น 3 — หญ้าใหม่ (ผู้ใช้อยากให้สวยกว่านี้)
- ใบโค้ง โคนเข้มปลายอ่อน แสงทะลุใบเวลาย้อนแสง ขึ้นเป็นกอ สูงต่ำไม่เท่ากัน หลายแบบปน + ดอกไม้เล็ก ลมพัดเป็นคลื่น
- พังได้: ไฟ = ไหม้ดำ • น้ำแข็ง = แข็งขาว • ระเบิด/หิน = ราบ/หายเป็นหย่อม • คนเดินแหวก (มีแล้ว ปรับให้ดีขึ้น)
- ทำภาพเทียบเก่า/ใหม่ให้ดูก่อน • กราฟิกต่ำ = หญ้าน้อยลงเอง

## ขั้น 4 — ทำลายได้มากขึ้น (ทีหลัง)
- รั้ว ลัง ม้านั่ง พังได้ • ต้นไม้ล้มทั้งต้น
- ⚠ ขวางทาง → โฮสต์ต้องคุม (แก้ระบบออนไลน์ + bump PREFIX) • เลือดของแต่ละชิ้นถามทีมเกมเพลย์

## ขั้น 5 — บรรยากาศตามความพัง (ทีหลัง)
- นับความพังของแมพ → ยิ่งพัง ควันในอากาศหนา แสงหม่น เถ้าลอย • เสียงไฟลุก/เศษหล่น (CC0 เท่านั้น)

## Tech notes (for Claude)
- Steps 1, 2, 3, 5 are **client-only visuals** driven by existing host events (`fx(ev)` js/26, `efxFX` js/25, `bldDebris` js/23, `bind.json`) → no protocol change. Marks land at the event position, so every client sees them in the same place; small random debris may differ (fine, like ragdoll).
- Step 4 changes collision → host-side (`js/12-buildings.js` BRK/BLDG pattern) + snapshot + `PREFIX` bump.
- Existing pieces to reuse: particles `js/30` (PMAX 5000, smoke layer), decals `decal` layer / `scorch()` js/42, debris `DEBRIS` js/23 (cap 180, life 3–4.5 s), grass `GRASS` js/50 (`uMark`/`uPush` uniforms), wind `AIR` js/50 (for smoke drift), fx runtime `js/45`.
- Budget: caps on persistent decals (~40, fade oldest), rubble (merge/instance), lingering smoke; scale with `QUAL` (low = fewer/none).
- All looks through VFX Studio + contact sheets, shown to the user before binding (CLAUDE.md §9).
