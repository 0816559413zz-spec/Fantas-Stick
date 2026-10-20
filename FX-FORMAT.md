# FX-FORMAT — รูปแบบไฟล์เอฟเฟกต์ `.fx.json` (สร้างอัตโนมัติจาก `assets/fx/schema.json` โดย `node tools/fx-check.js` — อย่าแก้ไฟล์นี้ด้วยมือ)

> อ่านไฟล์นี้ไฟล์เดียวก็เขียนเอฟเฟกต์ได้ ไม่ต้องเปิดโค้ด js • แผนและเหตุผล: `designs/vfx-studio.md` • แนวภาพ: `VFX.md` • สตูดิโอ: เปิด `studio.html`

รูปแบบไฟล์เอฟเฟกต์ .fx.json ของ Fantas Stick — แหล่งเดียวของค่าเริ่ม/ช่วง/ป้ายชื่อ (เกม สตูดิโอ fx-check และ FX-FORMAT.md อ่านจากไฟล์นี้) • หน่วย: เมตร (= หน่วย 3D = 20 px ของแผนที่), วินาที, องศา • กรอบของเอฟเฟกต์: +x ขวา, +y ขึ้น, +z ทิศเล็ง

## ค่าที่ใส่ได้
- **ตัวเลข** — ตัวเลข • [min,max] = สุ่มในช่วง (ฟิลด์ที่มี range) • "r*0.5" = สูตรจาก params (+ - * / ( ) min max abs sqrt) • ฟิลด์ที่มี curve รับเส้นโค้งตามอายุชั้น {"0":0,"0.3":1,"1":0} (+ "ease":"in|out|inout|step", "x":ตัวคูณ)
- **สี** — #rrggbb หรือสีจากจานธาตุ $core $hi $main $deep $light
- **ตำแหน่ง (vec3)** — [x,y,z] เมตร (+x ขวา +y ขึ้น +z หน้า) • รับเส้นโค้งได้ (ค่าเป็น [x,y,z] ทุกจุด)
- **ธาตุ (pal)**: `fire` `ice` `storm` `nature` `hex` `summon` `earth` `arcane` `shield` `heal` `col` (`col` = สร้างจานสีจากสีที่เกมส่งมา)

## ไฟล์
| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `v` | int | `1` |  |  | เวอร์ชันรูปแบบไฟล์ — Format version (always 1 for now). |
| `desc` | str | `` |  |  | คำอธิบาย — What this effect is for (one line). |
| `tags` | list | `[]` |  |  | ป้ายค้นหา — Search tags, e.g. impact, ult, aura. |
| `pal` | enum (fire/ice/storm/nature/hex/summon/earth/arcane/shield/heal/col) | `arcane` |  |  | ธาตุ (จานสี) — Palette the $ colours come from. Callers may override (pal or col). |
| `dur` | num | `0` | 0–20 |  | ความยาวไทม์ไลน์ (วิ) — Timeline length shown in the studio. 0 = auto (latest layer end). |
| `k` | num | `1` | 0.3–2 |  | ความแรงรวม — Intensity: multiplies counts, sizes and brightness of every layer. |
| `seed` | int | `0` |  |  | เลขสุ่มคงที่ — 0 = random every play. Any other number = same random values every play (screenshots). |
| `params` | params | `{}` |  |  | ค่าที่รับจากเกม — Named numbers the game (bind.json) can pass in, e.g. {"r":{"def":6,"desc":"radius m"}}. Use them in expressions: "r*0.5". |
| `layers` | layers | `[]` |  |  | ชั้น — Layers on the timeline (drawn in order). |

## ทุกชั้นมีฟิลด์เหล่านี้
| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `id` | str | `` |  |  | ชื่อชั้น — Unique layer name. |
| `t` | enum (ชนิดชั้นด้านล่าง) | `flash` |  |  | ชนิดชั้น — Layer type. |
| `at` | num | `0` | 0–10 | สูตร | เริ่มที่ (วิ) — Start time in seconds. |
| `life` | num | `0.4` | 0.02–10 | สูตร | อยู่นาน (วิ) — How long the layer lives (for emitters: how long they emit). |
| `loop` | bool | `false` |  |  | วนจนสั่งหยุด — Keep repeating until the effect is stopped (auras, zones, buffs). Curves cycle every 'life' seconds. |
| `end` | bool | `false` |  |  | เล่นตอนจบ — Start only when the effect is stopped (end burst of an aura). 'at' counts from the stop. |
| `att` | enum (point/ground/feet/chest/head/wand) | `point` |  |  | ยึดกับ — Anchor: point (event point incl. height) • ground (event point on the ground) • feet/chest/head/wand (of the followed player; without one: point at 0/1.2/1.9 m). |
| `pos` | vec3 | `[0,0,0]` |  | เส้นโค้ง · สูตร | ตำแหน่ง (ม.) — Offset from the anchor in metres: +x right, +y up, +z forward (aim). A curve moves the layer. |
| `yaw` | num | `0` | -180–180 | สูตร | หมุนซ้าย-ขวา (องศา) — Turn the layer's forward direction (positive = to the right). |
| `x` | bool | `false` |  |  | ชั้นเสริม — Optional pretty layer: skipped on low graphics and far away. |
| `near` | num | `0` | 0–100 |  | เล่นเมื่อใกล้ (ม.) — Only play when the camera is within this many metres (0 = always). |
| `own` | bool | `false` |  |  | เฉพาะของเรา — Only when the effect belongs to my own player (screen effects, big flashes). |

## ชนิดชั้น

### `flash` ✦ แฟลชแกน
Short white-hot core sprite (additive).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `col` | col | `$core` |  |  | สี |
| `size` | num | `2.5` | 0.2–12 | สุ่มช่วง · สูตร | ขนาดสุดท้าย (ม.) |
| `size0` | num | `0.3` | 0–6 | สูตร | ขนาดเริ่ม (ม.) |
| `k` | num | `2.2` | 0.2–4 |  | ความสว่าง |

### `halo` ◎ ฮาโล
Wide coloured glow sprite that fades slower than the core.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `col` | col | `$main` |  |  | สี |
| `size` | num | `5` | 0.5–20 | สุ่มช่วง · สูตร | ขนาดสุดท้าย (ม.) |
| `size0` | num | `0.5` | 0–10 | สูตร | ขนาดเริ่ม (ม.) |
| `k` | num | `1.2` | 0.1–3 |  | ความสว่าง |

### `ring` ◯ วงกระแทก
Expanding shock ring on the ground (or facing the camera with vert).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `col` | col | `$main` |  |  | สี |
| `r` | num | `4` | 0.2–40 | สุ่มช่วง · สูตร | รัศมีสุดท้าย (ม.) |
| `op` | num | `0.5` | 0.05–1 |  | ความทึบ |
| `vert` | bool | `false` |  |  | ตั้งหันหากล้อง |

### `light` ☀ ไฟจุด
Real point light on the ground and characters (max 6 in the scene, game picks the nearest/brightest).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `col` | col | `$light` |  |  | สี |
| `int` | num | `2` | 0.1–6 | เส้นโค้ง · สูตร | ความแรง (แนะนำ ≤ 2.5) |
| `dist` | num | `10` | 1–50 | สูตร | ระยะส่อง (ม.) |

### `screen` ▣ เอฟเฟกต์ทั้งจอ
Camera shake, full-screen flash, radial blur, colour kick, red hurt edge.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `shake` | num | `0` | 0–14 | สูตร | จอสั่น |
| `flash` | num | `0` | 0–0.2 | สูตร | แฟลชทั้งจอ (≤ 0.06) |
| `fcol` | col | `$main` |  |  | สีแฟลช |
| `radial` | num | `0` | 0–1.5 | สูตร | เบลอพุ่งเข้าจุด |
| `kick` | num | `0` | 0–1 | สูตร | สีเหลื่อม |
| `hurt` | num | `0` | 0–1 |  | ขอบจอแดง |

### `sound` ♪ เสียง
Play a game sound (names from SFXN in js/18-audio.js).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `name` | str | `boom` |  |  | ชื่อเสียง |
| `vol` | num | `0.7` | 0–1.5 |  | ความดัง |

### `emit` ⁂ ตัวปล่อยอนุภาค
3D particle emitter: a burst at start and/or a steady rate while alive.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `burst` | int | `16` | 0–300 | สูตร | ปล่อยทีเดียว (เม็ด) |
| `rate` | num | `0` | 0–400 | เส้นโค้ง · สูตร | ปล่อยต่อวินาที |
| `from` | enum (point/sphere/hemisphere/ring/disc/cone/box/line/mesh) | `point` |  |  | ปล่อยจากรูปทรง |
| `fr` | num | `0.3` | 0–20 | สูตร | รัศมีรูปทรง (ม.) |
| `fh` | num | `1` | 0–20 | สูตร | สูง/ยาวรูปทรง (ม.) |
| `of` | str | `` |  |  | ชั้นรูปทรง (from=mesh) |
| `dir` | enum (out/flat/up/down/in/aim/tangent/random) | `out` |  |  | ทิศพุ่ง |
| `spread` | num | `0.6` | 0–3.2 |  | กระจาย (เรเดียน) |
| `speed` | num | `[3,8]` | 0–60 | สุ่มช่วง · สูตร | ความเร็ว (ม./วิ) |
| `up` | num | `0` | -20–30 | สุ่มช่วง | ความเร็วขึ้น (ม./วิ) |
| `plife` | num | `[0.4,0.8]` | 0.05–6 | สุ่มช่วง | อายุเม็ด (วิ) |
| `look` | enum (glow/spark/streak/ring/flake/smoke/fire/ember/model) | `spark` |  |  | หน้าตาเม็ด |
| `size` | num | `[2,3]` | 0.3–30 | สุ่มช่วง · สูตร | ขนาดเม็ด (8 ≈ 1 ม.) |
| `grow` | num | `0` | -2–4 |  | โตขึ้นต่อวินาที |
| `col` | col | `$core` |  |  | สีตอนเกิด |
| `c2` | col | `$deep` |  |  | สีท้ายอายุ |
| `gravity` | num | `2` | -10–20 |  | แรงโน้มถ่วง (ติดลบ = ลอย) |
| `drag` | num | `2.5` | 0–10 |  | แรงต้าน |
| `spin` | num | `0` | 0–20 |  | หมุน (เรเดียน/วิ) |
| `fin` | num | `8` | 0–40 |  | จางเข้าตอนเกิด |
| `curl` | bool | `true` |  |  | ลมหมุนวน |
| `fb` | str | `` |  |  | ภาพของเม็ด: tex/<ชื่อ> (ทุก look) หรือ smoke/fire (manifest) |
| `model` | str | `` |  |  | โมเดล (look=model) — look "model":  each particle is a studio model (assets/fx/mesh) — rocks, shards, feathers |
| `mmat` | enum (solid/ice/glow) | `solid` |  |  | วัสดุเศษ (look=model) |
| `msize` | num | `[0.25,0.5]` | 0.02–5 | สุ่มช่วง | ขนาดเศษ ม. (look=model) |
| `bounce` | num | `0.35` | 0–1 |  | เด้งพื้น (look=model, 0 = ไม่เด้ง) |
| `mspin` | num | `360` | 0–1440 |  | หมุน องศา/วิ (look=model) |

### `mesh` ⬢ รูปทรง 3D
3D shape with a shader material — fireballs, shells, domes, cones, crescents, spikes, beams, Blender models.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `shape` | enum (sphere/dome/disc/ring/cylinder/cone/torus/crescent/spikes/beam/plane/lathe/ribbon/glb/model) | `sphere` |  |  | รูปทรง |
| `glb` | str | `` |  |  | โมเดล (ชื่อใน manifest) |
| `model` | str | `` |  |  | โมเดลที่ปั้นในสตูดิโอ (assets/fx/mesh/<ชื่อ>) — shape:"model" — name of a .mesh.json made in the studio Model tab |
| `inner` | num | `0.7` | 0–0.98 |  | รูใน (วง) |
| `n` | int | `10` | 3–40 |  | จำนวน (หนาม) |
| `wk` | num | `0.6` | 0.05–2 |  | ความกว้าง (เสี้ยว/ริบบิ้น) |
| `prof` | list | `[[0.2,0],[1,0.4],[0.6,1],[0,1.3]]` |  |  | เส้นโปรไฟล์ [รัศมี,สูง] (lathe) |
| `path` | list | `[[0,0,0],[0,1,2],[0,0,4]]` |  |  | เส้นทาง [x,y,z] (ribbon) |
| `mat` | enum (energy/fire/ice/glow/solid/flip/tex) | `energy` |  |  | วัสดุ |
| `col` | col | `$main` |  |  | สีหลัก |
| `col2` | col | `$deep` |  |  | สีขอบ/ท้าย |
| `scale` | vec3 | `1` | 0–30 | เส้นโค้ง · สูตร | ขนาด (ม. หรือ [x,y,z]) |
| `rot` | vec3 | `[0,0,0]` |  |  | หมุน [เงย, ขวา, เอียง] (องศา) |
| `spin` | num | `0` | -720–720 |  | หมุนรอบตัว (องศา/วิ) |
| `op` | num | `1` | 0–1 | เส้นโค้ง | ความทึบ |
| `fade` | num | `0.25` | 0–1 |  | จางท้ายอายุ (สัดส่วน) |
| `int` | num | `1` | 0–3 | เส้นโค้ง | ความสว่าง |
| `heat` | num | `0` | -0.5–0.8 | เส้นโค้ง | ความร้อน (ไฟ) |
| `dis` | num | `0` | 0–1 | เส้นโค้ง | สลายตัว |
| `scroll` | num | `1` | -6–6 |  | ความเร็วลายไหล |
| `rim` | num | `1` | 0–3 |  | ขอบเรือง |
| `disp` | num | `0` | 0–1 |  | ผิวเป็นลิ้นไฟ (ไฟ) |
| `flow` | vec3 | `[0,1,0]` |  |  | ทิศไฟไหล |
| `mode` | enum (auto/ball/sheet) | `auto` |  |  | แบบไฟ |
| `bill` | bool | `false` |  |  | หันหากล้อง |
| `tex` | str | `` |  |  | ภาพ (mat=flip): tex/<ชื่อ> = ภาพที่วาดในสตูดิโอ หรือชื่อใน manifest |
| `uvTile` | list | `[1,1]` |  |  | ปูภาพกี่ซ้ำ [u,v] (mat=tex) |
| `uvScroll` | list | `[0,0]` |  |  | ภาพไหลกี่รอบ/วิ [u,v] (mat=tex) |
| `grow` | num | `1` | 0–1 | เส้นโค้ง | งอก 0→1 (โมเดล: ทีละชิ้น) — shape model only: each piece (spike, copy, feather) grows from its own base; use a curve {"0": 0,"0.4": 1} |
| `stagger` | num | `0.7` | 0–0.98 |  | ไล่ทีละชิ้น (0 = พร้อมกัน) |
| `growBy` | enum (center/order/random/height) | `center` |  |  | ลำดับงอก: จากกลางออก / ตามลำดับ / สุ่ม / ล่างขึ้นบน |

### `firevol` 🔥 ไฟ 3 มิติจริง
Volumetric raymarched fire (fireVol): pillars, walls of fire, shells around a body.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `kind` | enum (pillar/wall/shell) | `pillar` |  |  | แบบ |
| `hx` | num | `0.8` | 0.1–20 | สูตร | กว้างครึ่ง (ม.) |
| `hz` | num | `0.8` | 0.1–20 | สูตร | หนาครึ่ง (ม.) |
| `h` | num | `3` | 0.2–30 | สูตร | สูง (ม.) |
| `hgt` | num | `{"0":0.05,"1":0.5,"0.15":1,"0.7":1}` | 0–1 | เส้นโค้ง | ความสูงตามเวลา (0–1) |
| `dis` | num | `{"0":0,"1":1,"0.6":0}` | 0–1 | เส้นโค้ง | ดับ (0–1) |
| `int` | num | `1` | 0.2–2.5 | เส้นโค้ง | ความสว่าง |
| `den` | num | `1` | 0.2–3 |  | ความหนาแน่น |
| `spd` | num | `0.55` | 0–3 |  | ความเร็วเปลว |

### `trail` 〰 หางแสง / รอยฟัน
Ribbon trail following another layer or its own moving pos, or a slash sweep (sweep).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `of` | str | `` |  |  | ตามชั้น (id) |
| `sweep` | bool | `false` |  |  | รอยฟัน (กวาดเป็นวง) |
| `a0` | num | `-70` | -360–360 |  | มุมเริ่ม (องศา, 0 = หน้า, + = ขวา) |
| `a1` | num | `70` | -360–360 |  | มุมจบ (องศา) |
| `r` | num | `2` | 0.1–20 | สูตร | รัศมีนอก (ม.) |
| `r0` | num | `1.2` | 0–20 | สูตร | รัศมีใน (ม.) |
| `tilt` | num | `0` | -90–90 |  | เอียงรอยฟัน (องศา) |
| `col` | col | `$hi` |  |  | สีหัว |
| `col2` | col | `$deep` |  |  | สีหาง |
| `w` | num | `0.3` | 0.02–3 |  | ความกว้าง (ม.) |
| `tlife` | num | `0.25` | 0.03–2 |  | อายุหาง (วิ) |
| `k` | num | `1.6` | 0.2–4 |  | ความสว่าง |

### `bolt` ϟ สายฟ้า
Thick lightning (tbolt, yellow with white core; acc = blue accent).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `to` | vec3 | `[0,0,4]` |  | สูตร | ปลายทาง (ม.) |
| `n` | int | `1` | 1–20 |  | จำนวนเส้น |
| `radial` | num | `0` | 0–20 | สุ่มช่วง | แตกออกรอบจุด (ม., 0 = ใช้ to) |
| `jit` | num | `0.3` | 0–10 |  | สุ่มปลาย (ม.) |
| `w` | num | `0.14` | 0.02–1 |  | ความหนา (ม.) |
| `br` | int | `0` | 0–6 |  | กิ่ง |
| `blife` | num | `0.12` | 0.03–1 |  | อายุเส้น (วิ) |
| `rate` | num | `0` | 0–60 |  | ผ่าซ้ำต่อวิ (0 = ครั้งเดียว) |
| `acc` | bool | `false` |  |  | สีรองฟ้า |

### `decal` ▦ ลายบนพื้น
Ground marks that follow the terrain: scorch, fire rune, burning crack web, ice cracks, dark burn, glowing glyph.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `kind` | enum (scorch/rune/crack/icecrack/dark/glyph) | `scorch` |  |  | แบบ |
| `r` | num | `3` | 0.3–30 | สูตร | รัศมี (ม.) |
| `n` | int | `9` | 3–24 |  | จำนวนแนวแตก |
| `burn` | num | `0` | 0–4 |  | ไฟลุกตามรอย (crack) |
| `col` | col | `$main` |  |  | สี (icecrack / glyph) |
| `op` | num | `0.55` | 0.05–1 |  | ความทึบ (dark) |

### `debris` ⬩ ชิ้นส่วนกระเด็น
3D chunks thrown out then falling: rocks or ice crystals.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `kind` | enum (rock/ice) | `rock` |  |  | แบบ |
| `n` | int | `10` | 1–60 | สูตร | จำนวน |
| `speed` | num | `8` | 0.5–30 | สูตร | ความเร็ว (ม./วิ) |
| `r` | num | `1` | 0–15 | สูตร | รัศมีจุดเกิด (ม.) |
| `size` | num | `1` | 0.2–5 |  | ขนาด |
| `dlife` | num | `1.2` | 0.2–5 |  | อยู่นาน (วิ) |

### `mist` ☁ หมอกต่ำ
Low cold mist puffs (Glacier Mist).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `r` | num | `3` | 0.3–20 | สูตร | รัศมี (ม.) |
| `n` | int | `8` | 1–60 |  | จำนวน |
| `out` | num | `1.4` | 0–5 |  | แรงพุ่งออก |

### `crown` ♛ มงกุฎหนามน้ำแข็ง
Ice spike crown bursting from the ground (Blender mesh_ice_burst).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `r` | num | `1.5` | 0.2–8 | สูตร | รัศมี (ม.) |
| `hy` | num | `1` | 0.2–3 |  | ยืดสูง |
| `mist` | int | `0` | 0–40 |  | หมอก (0 = ตามขนาด) |

### `geyser` ⇧ เสาไฟพุ่ง
Fire geyser column from the ground (fireGeyser).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `hgt` | num | `8` | 1–30 | สูตร | สูง (ม.) |
| `w` | num | `1.2` | 0.2–6 | สูตร | กว้าง (ม.) |

### `vol` 🔥 ไฟ 3 มิติจากการจำลอง
Baked 3D fire volume played with the game's raymarcher (fireSeqVol): studio-made (🔥 tab, src vol/<name>) or Blender-baked files in assets/vfx (fire_column, df_impact). loop = endless column; one-shot volumes play over the layer life (set life = frames / fps).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `src` | str | `` |  |  | ไฟ 3D: vol/<ชื่อ> (ทำในสตูดิโอ) หรือชื่อไฟล์ bake จาก Blender (fire_column, df_impact) |
| `hx` | num | `1` | 0.05–20 | สูตร | กว้างครึ่ง (ม.) |
| `hz` | num | `1` | 0.05–20 | สูตร | หนาครึ่ง (ม.) |
| `h` | num | `3` | 0.1–40 | สูตร | สูง (ม.) |
| `fps` | int | `24` | 4–60 |  | เฟรม/วิ |
| `speed` | num | `1` | 0.1–4 |  | ความเร็วเล่น |
| `int` | num | `1.15` | 0.2–2.5 | เส้นโค้ง | ความสว่าง |
| `den` | num | `1.2` | 0.2–3 |  | ความหนาแน่น |
| `dis` | num | `{"0":0,"1":1,"0.75":0}` | 0–1 | เส้นโค้ง | ดับ (0–1) |
| `hgt` | num | `{"0":0.05,"0.12":1}` | 0–1 | เส้นโค้ง | ตัดความสูง (0–1) |
| `rand` | bool | `true` |  |  | เริ่มเฟรมสุ่ม (วนเฟรม) |
| `once` | bool | `false` |  |  | เล่นครั้งเดียว (ระเบิด) — ปิด = วนเฟรม (เสาไฟ) |

### `warp` ≋ อากาศบิดเบี้ยว
Screen-space distortion: rising heat haze, an expanding shockwave that bends the image, or a lens bulge. Needs medium/high graphics (hidden on low), like the game's heat haze.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `kind` | enum (haze/shock/bulge) | `haze` |  |  | แบบ: ไอร้อน / คลื่นกระแทก / เลนส์โป่ง |
| `size` | num | `2.5` | 0.2–40 | เส้นโค้ง · สูตร | ขนาด (ม.) |
| `str` | num | `1` | 0–4 | เส้นโค้ง | ความแรงการบิด |
| `op` | num | `1` | 0–1 | เส้นโค้ง | ความเข้ม (จางเข้า/ออก) |
| `col` | col | `#ff7a3a` |  |  | สีอมเล็กน้อย |
| `glow` | num | `0.06` | 0–1 |  | สีอม (0 = ใส) |
| `flat` | bool | `false` |  |  | นอนบนพื้น (shock) |

### `use` ⧉ ใส่เอฟเฟกต์อื่น
Play another .fx.json inside this one (prefab), with its own params/scale/palette.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `fx` | str | `` |  |  | ชื่อเอฟเฟกต์ |
| `s` | num | `1` | 0.1–5 | สูตร | ขนาด |
| `pal` | str | `` |  |  | ธาตุ (ว่าง = ตามแม่) |
| `p` | obj | `{}` |  |  | ค่า params |

### `code` ƒ ฟังก์ชันในโค้ด
Escape hatch: call a registered helper (FXCODE in js/45-fx-runtime.js) with args.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `fn` | str | `` |  |  | ชื่อฟังก์ชัน |
| `args` | obj | `{}` |  |  | ค่าที่ส่ง |

## ตัวเลือกของ enum
- รูปทรง (shape): sphere, dome, disc, ring, cylinder, cone, torus, crescent, spikes, beam, plane, lathe, ribbon, glb, model
- วัสดุ (mat): energy, fire, ice, glow, solid, flip, tex — energy = ขอบเรือง+ลายไหล (สีจากจาน) • fire = shader ไฟของเกม • ice = shader น้ำแข็ง • glow = สีเรียบบวกแสง • solid = ทึบ • flip = ภาพ flipbook
- ปล่อยจาก (from): point, sphere, hemisphere, ring, disc, cone, box, line, mesh
- ทิศ (dir): out, flat, up, down, in, aim, tangent, random — flat = กระจายแนวนอน (ความเร็วขึ้นจาก up)
- หน้าตาเม็ด (look): glow, spark, streak, ring, flake, smoke, fire, ember, model
- ยึดกับ (att): point, ground, feet, chest, head, wand

## โมเดลที่ปั้นเอง — `assets/fx/mesh/<ชื่อ>.mesh.json` (แท็บ 🧊 โมเดล ในสตูดิโอ)
โมเดลที่ปั้นในสตูดิโอ assets/fx/mesh/<ชื่อ>.mesh.json = รายการชิ้นส่วน (parts) — เกมปั้นเองตอนโหลด • ใช้: ชั้น mesh {"shape": "model","model": "<ชื่อ>"} • หน่วยเมตร +x ขวา +y บน +z หน้า • uv v: 0 โคน/ใน → 1 ปลาย/นอก (ไฟ/พลังงานไหลตาม v)

### ไฟล์
| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `v` | int | `1` |  |  | เวอร์ชันรูปแบบไฟล์ |
| `desc` | str | `` |  |  | คำอธิบาย |
| `mat` | enum (energy/fire/ice/glow/solid) | `energy` |  |  | วัสดุที่แนะนำ (ใช้ตอนดูในสตูดิโอ / ตอนกดใช้ในเอฟเฟกต์) |
| `pal` | enum (fire/ice/storm/nature/hex/summon/earth/arcane/shield/heal/col) | `arcane` |  |  | ธาตุที่ใช้ดูในสตูดิโอ |
| `tags` | list | `[]` |  |  | แท็ก |
| `parts` | list | `[]` |  |  | ชิ้นส่วน |
### ทุกชิ้นส่วนมีฟิลด์เหล่านี้ (ลำดับตัวแต่ง: เรียว → บิด → โค้ง → ขรุขระ → ขนาด/หมุน/ตำแหน่ง → ทำซ้ำ → กระจก)
| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `id` | str | `` |  |  | ชื่อชิ้น (ไม่ซ้ำ) |
| `k` | enum (shard/crown/cluster/burst/blade/fan/spiral/tube/ribbon/lathe/sphere/cyl/torus/disc/star/box/poly) | `shard` |  |  | แบบชิ้นส่วน |
| `off` | bool | `false` |  |  | ซ่อน (ไม่ใส่ในโมเดล) |
| `pos` | vec3 | `[0,0,0]` |  |  | ตำแหน่ง [x,y,z] ม. |
| `rot` | vec3 | `[0,0,0]` |  |  | หมุน [x,y,z] องศา |
| `scale` | vec3 | `1` |  |  | ขนาด (ตัวเลข หรือ [x,y,z]) |
| `topScale` | num | `1` | 0–3 |  | เรียว: ขนาดด้านบน (1 = ไม่เรียว) |
| `twist` | num | `0` | -720–720 |  | บิดตามความสูง (องศา) |
| `bend` | num | `0` | -180–180 |  | โค้งไปข้างหน้าตามความสูง (องศา) |
| `noise` | num | `0` | 0–1 |  | ผิวขรุขระ (ม.) |
| `nfreq` | num | `2` | 0.2–12 |  | ความถี่ขรุขระ |
| `seed` | int | `1` | 1–9999 |  | เลขสุ่ม |
| `flat` | bool | `false` |  |  | ผิวเหลี่ยม (ผลึก/หิน) |
| `arr` | int | `1` | 1–64 |  | ทำซ้ำกี่ชิ้น |
| `arrMode` | enum (ring/line) | `ring` |  |  | ทำซ้ำแบบ: วงรอบแกนตั้ง / แถว |
| `arrR` | num | `0` | 0–20 |  | รัศมีวง (ทำซ้ำแบบ ring) ม. |
| `arrStep` | vec3 | `[0,0,1]` |  |  | ระยะต่อชิ้น (ทำซ้ำแบบ line) ม. |
| `arrScale` | num | `1` | 0.3–2 |  | ขนาดชิ้นถัดไป (×) |
| `arrJit` | num | `0` | 0–1 |  | สุ่มมุม/ขนาดของชิ้นซ้ำ |
| `mir` | bool | `false` |  |  | กระจกซ้าย-ขวา (เพิ่มอีกข้าง) |

#### `shard` ◆ แท่งผลึก / หนาม
One crystal spike / horn tip. Base at y=0, tip at h.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `h` | num | `1.2` | 0.05–20 |  | สูง ม. |
| `w` | num | `0.3` | 0.01–5 |  | กว้างฐาน ม. |
| `sides` | int | `5` | 3–12 |  | จำนวนเหลี่ยม |
| `tip` | num | `0` | 0–1 |  | ปลาย (0 = แหลม) |
| `mid` | num | `0.35` | 0.05–0.95 |  | ตำแหน่งส่วนป่อง |
| `flat` | bool | `true` |  |  | ผิวเหลี่ยม |

#### `crown` ♛ มงกุฎหนาม (วงหนาม)
Ring of spikes leaning outward (ice burst, earth crown). rings>1 adds inner taller rings.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `n` | int | `10` | 1–60 |  | จำนวนหนาม |
| `r` | num | `0.8` | 0–20 |  | รัศมีวง ม. |
| `h` | num | `[0.7,1.3]` | 0.05–20 | สุ่มช่วง | สูง ม. (สุ่มช่วง) |
| `w` | num | `0.28` | 0.01–5 |  | กว้างหนาม ม. |
| `tilt` | num | `25` | -80–80 |  | เอียงออก (องศา) |
| `sides` | int | `5` | 3–10 |  | เหลี่ยม |
| `tip` | num | `0` | 0–1 |  | ปลาย |
| `mid` | num | `0.3` | 0.05–0.95 |  | ส่วนป่อง |
| `jit` | num | `0.4` | 0–1 |  | สุ่มระยะห่าง |
| `rings` | int | `1` | 1–3 |  | จำนวนวง |
| `flat` | bool | `true` |  |  | ผิวเหลี่ยม |

#### `cluster` ⟁ กลุ่มผลึก
Crystal cluster: one tall centre spike + shorter tilted ones around it.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `n` | int | `7` | 1–40 |  | จำนวน |
| `spread` | num | `0.5` | 0–10 |  | กระจายรัศมี ม. |
| `h` | num | `[0.5,1.4]` | 0.05–20 | สุ่มช่วง | สูง ม. (ขอบ → กลาง) |
| `tilt` | num | `[5,35]` | -80–80 | สุ่มช่วง | เอียง องศา (กลาง → ขอบ) |
| `w` | num | `0.3` | 0.01–5 |  | กว้าง ม. |
| `sides` | int | `5` | 3–10 |  | เหลี่ยม |
| `tip` | num | `0` | 0–1 |  | ปลาย |
| `mid` | num | `0.35` | 0.05–0.95 |  | ส่วนป่อง |
| `flat` | bool | `true` |  |  | ผิวเหลี่ยม |

#### `burst` ✹ หนามรอบทิศ (เม่น)
Spikes pointing out in all directions from a sphere (spiky shell, explosion crystals). hemi = only the upper half.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `n` | int | `24` | 1–120 |  | จำนวนหนาม |
| `r` | num | `0.3` | 0–10 |  | รัศมีแกนใน ม. |
| `h` | num | `[0.5,1]` | 0.05–20 | สุ่มช่วง | ยาวหนาม ม. |
| `w` | num | `0.14` | 0.01–3 |  | กว้าง ม. |
| `sides` | int | `4` | 3–8 |  | เหลี่ยม |
| `tip` | num | `0` | 0–1 |  | ปลาย |
| `mid` | num | `0.25` | 0.05–0.95 |  | ส่วนป่อง |
| `jit` | num | `0.3` | 0–3 |  | สุ่มทิศ |
| `hemi` | bool | `false` |  |  | ครึ่งบนเท่านั้น |
| `flat` | bool | `true` |  |  | ผิวเหลี่ยม |

#### `blade` ☾ ใบฟัน / เสี้ยว
Crescent blade on the ground plane facing +z (slash arcs, claws, scythe). v: 0 inner → 1 outer edge.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `arc` | num | `140` | 10–360 |  | มุมโค้ง องศา |
| `r` | num | `1.2` | 0.05–20 |  | รัศมี ม. |
| `w` | num | `0.35` | 0.01–10 |  | กว้างตรงกลาง ม. |
| `thick` | num | `0.06` | 0–2 |  | หนา ม. (0 = แผ่นบาง) |
| `taper` | num | `0.8` | 0.15–4 |  | ปลายแหลม |
| `skew` | num | `0` | -2–2 |  | ส่วนกว้างเอียงไปหัว/ท้าย |
| `seg` | int | `40` | 4–160 |  | ความละเอียด |

#### `fan` ❦ พัด / ปีก
Feathers fanned out in the x-y plane (wings, peacock tail, flame fan). v: 0 root → 1 tip.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `n` | int | `7` | 1–30 |  | จำนวนขน |
| `spread` | num | `100` | 0–360 |  | กางกว้าง องศา |
| `len` | num | `1.4` | 0.05–20 |  | ยาว ม. |
| `lvar` | num | `0.35` | 0–1 |  | ขนริมสั้นลง |
| `w` | num | `0.22` | 0.01–5 |  | กว้างขน ม. |
| `tipw` | num | `0.2` | 0–1 |  | ปลายขนกว้าง (สัดส่วน) |
| `curve` | num | `25` | -120–120 |  | โค้งไปข้างหลัง องศา |
| `seg` | int | `12` | 3–48 |  | ความละเอียด |

#### `spiral` @ เกลียว (วนพื้น / พายุหมุน)
Spiral ribbon: flat on the ground (rune swirl) or wall=true for a vertical band (tornado). u along, v across.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `turns` | num | `1.5` | 0.1–10 |  | จำนวนรอบ |
| `r0` | num | `0.3` | 0–20 |  | รัศมีเริ่ม ม. |
| `r1` | num | `1.2` | 0–20 |  | รัศมีจบ ม. |
| `rise` | num | `0` | -20–20 |  | สูงขึ้น ม. |
| `w` | num | `0.25` | 0.01–10 |  | กว้างแถบ ม. |
| `taper` | num | `0` | 0–1 |  | แถบเรียวลง |
| `wall` | bool | `false` |  |  | แถบตั้ง (พายุหมุน) |
| `seg` | int | `96` | 8–400 |  | ความละเอียด |

#### `tube` 〰 ท่อตามเส้น (เขา / หนวด)
Tube along a smooth path (horn, tentacle, claw, root). r1 = 0 gives a sharp tip. v along the path.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `path` | list | `[[0,0,0],[0,0.6,0.2],[0,1.1,0.6]]` |  |  | จุดเส้นทาง [x,y,z] ม. |
| `r0` | num | `0.12` | 0–5 |  | รัศมีต้น ม. |
| `r1` | num | `0` | 0–5 |  | รัศมีปลาย ม. |
| `curve` | num | `1` | 0.2–4 |  | เรียวเร็ว/ช้า |
| `sides` | int | `8` | 3–24 |  | เหลี่ยม |
| `seg` | int | `24` | 2–160 |  | ความละเอียด |

#### `ribbon` ∿ ริบบิ้นตามเส้น
Flat strip along a smooth path (trails, swooshes). wall=true = width points up.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `path` | list | `[[-1,0,0],[0,0.3,1],[1,0,0]]` |  |  | จุดเส้นทาง [x,y,z] ม. |
| `w` | num | `0.4` | 0.01–10 |  | กว้าง ม. |
| `taper` | num | `0` | 0–1 |  | เรียวไปปลาย |
| `wall` | bool | `false` |  |  | แถบตั้ง |
| `seg` | int | `32` | 2–200 |  | ความละเอียด |

#### `lathe` ⏚ หมุนเส้นโปรไฟล์ (โดม / แจกัน / เปลือก)
Profile [radius, height] points spun around the vertical axis (domes, cups, shells, vortex funnels).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `prof` | list | `[[0.3,0],[0.8,0.4],[0.5,1],[0,1.3]]` |  |  | โปรไฟล์ [รัศมี, สูง] ม. |
| `seg` | int | `32` | 3–96 |  | ความละเอียดรอบ |

#### `sphere` ● ทรงกลม
Sphere centred at the origin (hemi = dome sitting on y=0).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `r` | num | `0.5` | 0.02–20 |  | รัศมี ม. |
| `seg` | int | `12` | 3–48 |  | ความละเอียด |
| `hemi` | bool | `false` |  |  | ครึ่งทรงกลม (โดม) |

#### `cyl` ▮ ทรงกระบอก / กรวย
Cylinder or cone standing on y=0 (r1 = 0 → cone). Open (no caps) unless caps=true.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `r0` | num | `0.4` | 0–20 |  | รัศมีล่าง ม. |
| `r1` | num | `0.4` | 0–20 |  | รัศมีบน ม. |
| `h` | num | `1` | 0.01–30 |  | สูง ม. |
| `sides` | int | `16` | 3–64 |  | เหลี่ยม |
| `segs` | int | `1` | 1–32 |  | แบ่งชั้น (ใช้กับ บิด/โค้ง) |
| `caps` | bool | `false` |  |  | ปิดหัวท้าย |

#### `torus` ◎ โดนัท / ห่วงหนา
Torus lying flat (arc < 360 = partial ring).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `r` | num | `0.6` | 0.02–20 |  | รัศมี ม. |
| `tube` | num | `0.12` | 0.005–5 |  | หนาท่อ ม. |
| `arc` | num | `360` | 10–360 |  | มุม องศา |
| `sides` | int | `10` | 3–32 |  | เหลี่ยมท่อ |
| `seg` | int | `40` | 3–128 |  | ความละเอียดรอบ |

#### `disc` ◯ แผ่นวง / พัดแผ่น
Flat disc or ring on the ground (inner > 0 = ring, arc < 360 = fan slice facing +z). v: 0 inner → 1 outer.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `r` | num | `1` | 0.02–30 |  | รัศมี ม. |
| `inner` | num | `0` | 0–30 |  | รัศมีรูใน ม. |
| `arc` | num | `360` | 5–360 |  | มุม องศา |
| `seg` | int | `48` | 3–160 |  | ความละเอียด |

#### `star` ✶ ดาว / แฉก
Flat star on the ground (h > 0 raises the centre into a low pyramid).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `n` | int | `6` | 2–32 |  | จำนวนแฉก |
| `r` | num | `1` | 0.02–30 |  | รัศมี ม. |
| `inner` | num | `0.35` | 0.02–1 |  | ร่องใน (สัดส่วน) |
| `h` | num | `0` | -5–5 |  | ยกกลาง ม. |

#### `box` ■ กล่อง
Box centred at the origin.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `w` | num | `0.5` | 0.01–20 |  | กว้าง ม. |
| `h` | num | `0.5` | 0.01–20 |  | สูง ม. |
| `d` | num | `0.5` | 0.01–20 |  | ลึก ม. |

#### `poly` ✎ ปั้นเอง (แก้จุดแบบ Blender)
Free-form polygon mesh you shape point by point in the studio (select the part, press Tab = edit mode: points / edges / faces, move, extrude, inset, fill, merge, delete). v = points [x,y,z] m, f = faces as lists of 3+ point numbers, counter-clockwise seen from outside. sub = smooth subdivision (Catmull-Clark) levels — use with flat off for round shapes.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `v` | list | `[[-0.25,0,-0.25],[0.25,0,-0.25],[0.25,0,0.25],[-0.25,0,0.25],[-0.25,0.5,-0.25],[0.25,0.5,-0.25],[0.25,0.5,0.25],[-0.25,0.5,0.25]]` |  |  | จุด [x,y,z] ม. |
| `f` | list | `[[0,1,2,3],[4,7,6,5],[3,2,6,7],[1,0,4,5],[2,1,5,6],[0,3,7,4]]` |  |  | หน้า (เลขจุด 3 ตัวขึ้นไป ทวนเข็มเมื่อมองจากด้านนอก) |
| `sub` | int | `0` | 0–3 |  | ทำให้เนียน (แบ่งหน้าโค้งมน) กี่รอบ |

ตัวอย่าง (มงกุฎหนามน้ำแข็ง 2 วง + กลุ่มผลึกกลาง):
```json
{"v":1,"desc":"มงกุฎน้ำแข็ง","mat":"ice","pal":"ice","parts":[
  {"id":"ring","k":"crown","n":12,"r":0.9,"h":[0.6,1.2],"tilt":30,"rings":2},
  {"id":"core","k":"cluster","n":5,"spread":0.25,"h":[0.8,1.8]}
]}
```
ใช้ในเอฟเฟกต์: `{"id":"crown","t":"mesh","shape":"model","model":"ice_crown","mat":"ice","scale":{"0":[1,0.05,1],"0.2":1,"ease":"out"}}`

## ภาพที่วาดเอง — `assets/fx/tex/<ชื่อ>.png` + `.tex.json` (แท็บ 🎞 ภาพ ในสตูดิโอ)
ภาพที่วาดในสตูดิโอ assets/fx/tex/<ชื่อ>.png + <ชื่อ>.tex.json (สูตรวาด + วิธีเล่น) • ใช้: emit {"fb": "tex/<ชื่อ>"} (ทุก look) หรือ mesh {"mat": "flip","tex": "tex/<ชื่อ>"} • ภาพมีสีในตัว → ตั้ง col เป็น #ffffff ในเอฟเฟกต์ (สีอื่น = ย้อมทับ)

### ไฟล์ .tex.json
| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `v` | int | `1` |  |  | เวอร์ชันรูปแบบไฟล์ |
| `desc` | str | `` |  |  | คำอธิบาย |
| `gen` | enum (image/fire/smoke/explosion/electric/vortex/shock/burst/slash/flare/glow/ring/circle/noise/sim) | `fire` |  |  | ตัววาด |
| `p` | obj | `{}` |  |  | ค่าของตัววาด (ดู gens) |
| `seed` | int | `1` | 1–9999 |  | เลขสุ่ม |
| `px` | enum (32/64/128/256) | `128` |  |  | ความละเอียดต่อเฟรม (px) |
| `cols` | int | `8` | 1–8 |  | จำนวนคอลัมน์ |
| `rows` | int | `8` | 1–8 |  | จำนวนแถว |
| `kind` | enum (loop/life) | `loop` |  |  | loop = เล่นวนต่อเนื่อง • life = เล่นครั้งเดียวตามอายุเม็ด |
| `fps` | int | `24` | 4–60 |  | เฟรม/วิ (loop บนการ์ดภาพ) |
| `ramp` | ramp | `fire` |  |  | สี: ชื่อจาน (ramps) หรือ [[ตำแหน่ง 0-1,"#rrggbb"],...] |
| `add` | bool | `true` |  |  | เรืองแสง (บวกแสง) — ปิด = ทึบแบบควัน |
| `span` | num | `1` | 0.25–8 |  | เล่นกี่รอบตลอดอายุเม็ด |
| `rand` | bool | `false` |  |  | สุ่มเฟรมเริ่มต่อเม็ด |
| `rot` | num | `0` | 0–6.28 |  | สุ่มเอียงเม็ด (เรเดียน) |
| `spin` | num | `0` | -12–12 |  | หมุนตลอดอายุ (เรเดียน) |
| `size` | num | `1` | 0.2–4 |  | ตัวคูณขนาดเม็ด |
| `occ` | num | `0.6` | 0–1 |  | บังฉากหลัง (เฉพาะเรืองแสง) |
| `tags` | list | `[]` |  |  | แท็ก |
### จานสี (ramp)
- `fire`: #1a0f0a → #7a1c06 → #e0520f → #ffae2e → #fff6d0
- `ice`: #0a1a3a → #2a6fd0 → #8fd8ff → #ffffff
- `storm`: #1a0a40 → #5a3ae0 → #9fd0ff → #ffffff
- `nature`: #0a2010 → #2f9a3a → #b8f070 → #f8ffe0
- `hex`: #14001e → #7a1aa8 → #e070ff → #ffe8ff
- `arcane`: #100828 → #4a40d0 → #c0a0ff → #ffffff
- `gold`: #2a1404 → #b07818 → #ffd870 → #fffbe8
- `blood`: #1a0204 → #8a0a14 → #ff4a3a → #ffd0c0
- `smoke`: #1e1e24 → #6a6a72 → #d4d4dc
- `white`: #5a5a5a → #ffffff

### ตัววาด (gen) — ค่าใส่ใน `p`

#### `fire` 🔥 เปลวไฟ (วน) — kind `loop` • ตาราง 8×8 • จานสี `fire` • เรืองแสง
Rising flame that loops seamlessly (periodic noise). For fire particles and flame cards.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `speed` | int | `1` | 1–4 |  | ความเร็วไหลขึ้น |
| `scale` | int | `3` | 1–8 |  | ขนาดลาย |
| `detail` | int | `4` | 1–6 |  | รายละเอียด |
| `width` | num | `0.75` | 0.1–1 |  | กว้างเปลว |
| `height` | num | `0.9` | 0.2–1.2 |  | สูงเปลว |
| `turb` | num | `0.6` | 0–1.5 |  | ปั่นป่วน |
| `sharp` | num | `1.2` | 0.4–3 |  | คม (ขอบชัด) |

#### `smoke` ☁ ควันพวย (ตามอายุ) — kind `life` • ตาราง 6×6 • จานสี `smoke` • ทึบ
Billowing smoke puff that grows and fades over the particle life (lit from above).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `scale` | num | `3` | 0.5–10 |  | ขนาดลาย |
| `detail` | int | `4` | 1–6 |  | รายละเอียด |
| `grow` | num | `0.6` | 0–1 |  | ขยายตัว |
| `soft` | num | `0.5` | 0–1 |  | ขอบนุ่ม |
| `turb` | num | `0.6` | 0–2 |  | ม้วนตัว |
| `dark` | num | `0.5` | 0–1.5 |  | เงา (แสงจากบน) |
| `dens` | num | `1` | 0.2–2 |  | ความหนาแน่น |

#### `explosion` 💥 ระเบิด (ตามอายุ) — kind `life` • ตาราง 8×8 • จานสี `fire` • เรืองแสง
Fireball that expands, cools from white-hot to dark smoke and breaks up.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `scale` | num | `3` | 0.5–10 |  | ขนาดลาย |
| `detail` | int | `5` | 1–6 |  | รายละเอียด |
| `grow` | num | `0.8` | 0–1.5 |  | พองเร็ว |
| `heat` | num | `1` | 0.3–2 |  | ร้อน |
| `cool` | num | `0.6` | 0–1.2 |  | เย็นลงเร็ว |
| `rough` | num | `0.55` | 0–1.2 |  | ขอบขรุขระ |

#### `electric` ⚡ สายฟ้า / กระแสไฟ (วน) — kind `loop` • ตาราง 4×4 • จานสี `storm` • เรืองแสง
Crackling arcs pinned at both ends, jittering in a seamless loop.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `arcs` | int | `3` | 1–6 |  | จำนวนเส้น |
| `jag` | num | `1.2` | 0.3–3 |  | หยัก |
| `amp` | num | `1` | 0.2–2 |  | แกว่งกว้าง |
| `width` | num | `0.02` | 0.004–0.1 |  | หนาแกน |
| `glow` | num | `0.4` | 0–2 |  | เรือง |

#### `vortex` 🌀 วังวน / เวทหมุน (วน) — kind `loop` • ตาราง 4×4 • จานสี `arcane` • เรืองแสง
Spiral arms rotating in a seamless loop (portals, charge-ups, vortex ground marks).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `arms` | int | `3` | 1–8 |  | จำนวนแขน |
| `twist` | num | `1.5` | -4–4 |  | บิดเกลียว |
| `speed` | int | `1` | 1–4 |  | ความเร็วหมุน |
| `inner` | num | `0.12` | 0–0.8 |  | รูกลาง |
| `outer` | num | `0.95` | 0.3–1 |  | ขอบนอก |
| `noise` | num | `0.4` | 0–1.5 |  | ลายปั่นป่วน |
| `scale` | num | `4` | 0.5–12 |  | ขนาดลาย |
| `sharp` | num | `1.5` | 0.3–5 |  | แขนคม |
| `core` | num | `0.3` | 0–1.5 |  | แกนกลางสว่าง |

#### `shock` ◌ คลื่นกระแทก (ตามอายุ) — kind `life` • ตาราง 4×4 • จานสี `white` • เรืองแสง
Expanding shockwave ring with a faint fill behind the front.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `start` | num | `0.1` | 0–0.9 |  | รัศมีเริ่ม |
| `end` | num | `0.92` | 0.2–1 |  | รัศมีจบ |
| `width` | num | `0.08` | 0.005–0.4 |  | หนา |
| `noise` | num | `0.4` | 0–1 |  | ขาดเป็นช่วง |
| `scale` | num | `6` | 0.5–20 |  | ขนาดลาย |
| `fill` | num | `0.35` | 0–1 |  | แสงด้านใน |

#### `burst` ✺ ประกายแตก (ตามอายุ) — kind `life` • ตาราง 4×4 • จานสี `gold` • เรืองแสง
Radial streaks shooting out from the centre (hit sparks, impact star).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `rays` | int | `16` | 3–48 |  | จำนวนเส้น |
| `len` | num | `0.45` | 0.05–1 |  | ยาว |
| `width` | num | `0.25` | 0.02–1 |  | หนา |
| `core` | num | `0.8` | 0–2 |  | แสงกลาง |

#### `slash` ☾ รอยฟัน (ตามอายุ) — kind `life` • ตาราง 4×4 • จานสี `white` • เรืองแสง
Crescent slash that sweeps in then fades (1 frame = the full arc).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `arc` | num | `130` | 20–300 |  | มุมโค้ง องศา |
| `radius` | num | `0.42` | 0.1–0.5 |  | รัศมี |
| `width` | num | `0.14` | 0.01–0.4 |  | กว้าง |
| `streak` | num | `0.6` | 0–1 |  | เส้นลาย |
| `scale` | num | `6` | 1–20 |  | ความถี่เส้นลาย |

#### `flare` ✦ ดาวประกาย — kind `loop` • ตาราง 1×1 • จานสี `white` • เรืองแสง
Star flare: glow + long rays + short rays (grid > 1 + twinkle = twinkling loop).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `rays` | int | `4` | 2–16 |  | จำนวนแฉก |
| `len` | num | `0.95` | 0.1–1 |  | ยาวแฉก |
| `thin` | num | `40` | 2–200 |  | แฉกบาง |
| `rays2` | num | `0.5` | 0–1 |  | แฉกรอง |
| `glow` | num | `0.3` | 0.02–1 |  | เรือง |
| `core` | num | `0.08` | 0.01–0.4 |  | แกน |
| `twinkle` | num | `0` | 0–1 |  | กะพริบ (ต้องหลายเฟรม) |

#### `glow` ◉ แสงนุ่ม — kind `loop` • ตาราง 1×1 • จานสี `white` • เรืองแสง
Soft radial glow (sprite for orbs, lights, soft particles).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `radius` | num | `1` | 0.1–1 |  | รัศมี |
| `power` | num | `2.2` | 0.3–8 |  | ความนุ่ม |
| `core` | num | `0.12` | 0–0.5 |  | แกนสว่าง |

#### `ring` ○ วงแหวน — kind `loop` • ตาราง 1×1 • จานสี `white` • เรืองแสง
Soft ring (halo, rune ring sprite).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `radius` | num | `0.75` | 0.05–1 |  | รัศมี |
| `width` | num | `0.08` | 0.005–0.5 |  | หนา |
| `fill` | num | `0.15` | 0–1 |  | แสงด้านใน |
| `noise` | num | `0` | 0–1 |  | ขาดเป็นช่วง |
| `scale` | num | `6` | 0.5–20 |  | ขนาดลาย |

#### `circle` ⛤ วงเวท — kind `loop` • ตาราง 1×1 • จานสี `gold` • เรืองแสง
Magic circle: rings, star polygon, tick marks and a band of runes (spin > 0 + several frames = rotating loop).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `rings` | int | `3` | 1–5 |  | จำนวนวง |
| `points` | int | `6` | 0–12 |  | ดาว (จำนวนแฉก, 0 = ไม่มี) |
| `runes` | int | `24` | 0–64 |  | อักษรเวท |
| `width` | num | `0.012` | 0.003–0.05 |  | หนาเส้น |
| `spin` | int | `0` | 0–3 |  | หมุน (รอบต่อวง loop) |

#### `noise` ▒ ลายนอยส์ (ต่อขอบได้) — kind `loop` • ตาราง 1×1 • จานสี `white` • เรืองแสง
Tileable noise mask: 0 = cloudy, 1 = ridged (veins/lightning web), 2 = cells (scales/cracks).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `mode` | int | `0` | 0–2 |  | แบบ: 0 เมฆ / 1 เส้นเลือด / 2 เซลล์ |
| `scale` | int | `4` | 1–16 |  | ขนาดลาย |
| `detail` | int | `5` | 1–6 |  | รายละเอียด |
| `contrast` | num | `1.2` | 0.3–4 |  | คมชัด |

#### `image` 🖼 ภาพที่นำเข้าเอง — kind `loop` • ตาราง 1×1 • จานสี `white` • เรืองแสง
Your own picture or sprite sheet (PNG/JPG, drawn anywhere). One file = set cols × rows to its frame grid; several files = packed into frames in name order. The .png is the source (no generator).

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|


#### `sim` ♨ จำลองของไหลจริง (ไฟ / ควัน) — kind `loop` • ตาราง 8×8 • จานสี `fire` • เรืองแสง
Real 2D fluid simulation (stable fluids with buoyancy + vorticity) — like Blender Mantaflow but in seconds. mode 0 = fire, 1 = smoke. loop crossfades the end into the start.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `mode` | int | `0` | 0–1 |  | แบบ: 0 ไฟ / 1 ควัน |
| `emit` | num | `0.5` | 0.1–1 |  | ขนาดต้นไฟ |
| `buoy` | num | `1` | 0–3 |  | ลอยขึ้น |
| `vort` | num | `0.6` | 0–3 |  | ม้วนตัว |
| `cool` | num | `0.6` | 0–2 |  | ดับเร็ว |
| `wind` | num | `0` | -2–2 |  | ลมข้าง |
| `flick` | num | `0.5` | 0–1 |  | สั่นไหว |
| `steps` | int | `2` | 1–4 |  | ช่วงเวลาต่อเฟรม |

ภาพ (.png) ต้องวาดในสตูดิโอ (GPU / จำลองของไหล): แก้ `.tex.json` แล้วเปิด `studio.html?tex=<ชื่อ>&bake=1` = วาดใหม่ + บันทึก .png ให้เอง (ต้องเปิดผ่าน `python tools/serve.py`) • ใช้ในเอฟเฟกต์: `{"t":"emit","fb":"tex/<ชื่อ>","col":"#ffffff",...}` หรือการ์ดภาพ `{"t":"mesh","shape":"plane","bill":true,"mat":"flip","tex":"tex/<ชื่อ>","col":"#ffffff"}`

## ไฟ 3 มิติที่จำลองเอง — `assets/fx/vol/<ชื่อ>.vol.json` + `.bin` (แท็บ 🔥 ไฟ 3D ในสตูดิโอ)
ไฟ 3 มิติที่จำลองในสตูดิโอ (แท็บ 🔥 ไฟ 3D) assets/fx/vol/<ชื่อ>.vol.json (สูตร + nx ny nz frames) + <ชื่อ>.bin (ข้อมูลไฟ uint8 รูปแบบเดียวกับ tools/pack_volseq.py) • ใช้: ชั้น vol {"src":"vol/<ชื่อ>"}

### ไฟล์ .vol.json
| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `v` | int | `1` |  |  | เวอร์ชัน |
| `desc` | str | `` |  |  | คำอธิบาย |
| `mode` | enum (column/burst) | `column` |  |  | column = ไฟลุกวนต่อเนื่อง • burst = ระเบิดไฟครั้งเดียว |
| `res` | int | `24` | 16–40 |  | ความละเอียด (กว้าง; สูง = ×2) |
| `frames` | int | `32` | 8–64 |  | จำนวนเฟรม |
| `xfade` | int | `10` | 0–24 |  | เฟดต่อวน (column) |
| `seed` | int | `1` | 1–9999 |  | เลขสุ่ม |
| `p` | obj | `{}` |  |  | ค่าการจำลอง (ดู params) |
| `nx` | int | `0` |  |  | (เขียนเองตอนบันทึก) |
| `ny` | int | `0` |  |  | (เขียนเองตอนบันทึก) |
| `nz` | int | `0` |  |  | (เขียนเองตอนบันทึก) |
| `tags` | list | `[]` |  |  | แท็ก |
### ค่าการจำลอง (ใส่ใน `p`)
| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `shape` | enum (ball/disc/ring/line) | `ball` |  |  | รูปต้นไฟ: ก้อน / แผ่น / วงแหวน / แนวยาว |
| `size` | num | `0.32` | 0.05–0.45 |  | ขนาดต้นไฟ (สัดส่วนความกว้าง) |
| `buoy` | num | `1` | 0–3 |  | ลอยขึ้น |
| `vort` | num | `1.2` | 0–4 |  | ม้วนตัว |
| `turb` | num | `0.8` | 0–3 |  | ปั่นป่วน |
| `cool` | num | `0.7` | 0.1–2 |  | ดับเร็ว (เปลวสั้น) |
| `burst` | num | `0` | 0–4 |  | แรงระเบิดออก (burst) |
| `emitT` | num | `0.25` | 0.02–1 |  | ต้นไฟติดนานแค่ไหน (burst, สัดส่วน) |
| `wind` | num | `0` | -2–2 |  | ลมข้าง |
| `detail` | num | `0.8` | 0–1.6 |  | รายละเอียดลิ้นเปลว |
| `flick` | num | `0.5` | 0–1 |  | สั่นไหว |
| `steps` | int | `2` | 1–4 |  | ช่วงเวลาต่อเฟรม |
| `warm` | int | `40` | 0–150 |  | อุ่นเครื่องก่อนเก็บ (column) |

ข้อมูล .bin ต้องจำลองในสตูดิโอ: `studio.html?vol=<ชื่อ>` แล้ว `STUDIO.vol.bake()` + `STUDIO.vol.save()` • ใช้ในเอฟเฟกต์: `{"t":"vol","src":"vol/<ชื่อ>","hx":0.9,"hz":0.9,"h":3.6}` (ระเบิด: `"once":true`) • ไฟล์ bake จาก Blender ใน assets/vfx ก็ใช้ชั้นเดียวกัน: `"src":"fire_column"`

## ผูกกับเกม — `assets/fx/bind.json`
assets/fx/bind.json — ผูกเหตุการณ์ของเกมกับเอฟเฟกต์ โดยไม่แก้โค้ดสกิล
- คีย์: "efx:<ชื่อ efx>" (เช่น efx:dfboom) • "<k>:<t>" หรือ "<k>" สำหรับ event ทั่วไป (เช่น imp:fire, parry, die)
- `fx`: ชื่อเอฟเฟกต์ (path ใต้ assets/fx/ ไม่มี .fx.json)
- `mode`: add = เล่นเพิ่มจากภาพเดิม (ค่าเริ่ม) • replace = แทนภาพเดิมทั้งหมดของ event นี้
- `p`: params เป็นสูตรจาก ev ได้ เช่น {"r":"ev.r/20"}
- `s`: ขนาด (ตัวเลขหรือสูตร)
- `pal`: บังคับธาตุ
- `follow`: "ev.id" = ติดตามผู้เล่นคนนั้น
- `if`: เล่นเฉพาะเมื่อสูตรไม่เป็น 0 เช่น "ev.ax*1" (ขวาน) / "1-ev.ax*1" (ดาบ) — คีย์เดียวใส่เป็นรายการ [ ] ได้หลายอัน

ตัวอย่าง:
```json
{
  "efx:dfboom": {"fx": "fire/dfboom", "mode": "add", "p": {"r": "ev.r/20"}},
  "imp:fire":   {"fx": "fire/spark_hit"},
  "efx:blaze":  {"fx": "fire/blaze_aura", "follow": "ev.id"}
}
```

## เรียกจากโค้ด
```js
const h=fxPlay('fire/dfboom',{x,y,h,a,s:1,pal:'ice',col:'#ff00aa',p:{r:6},follow:playerId,own:true});  // คืน handle (null = ไฟล์ยังไม่โหลด)
fxStop(h);   // ชั้น loop หยุด + ชั้น end:true เริ่มเล่น
```

## งาน Claude (เร็วที่สุด)
1. คัดลอกไฟล์ใกล้เคียงจาก `assets/fx/start/` (แม่แบบ) หรือสร้างในสตูดิโอ → แก้ JSON
2. `node tools/fx-check.js` — ต้องไม่มี ✗
3. ดูผลไม่ต้องเข้าเกม: เปิด `studio.html?fx=<ชื่อ>&sheet=0.05,0.15,0.3,0.6,1.2` (แผ่นภาพสรุปทั้งไทม์ไลน์ + ตัวเลขจอขาว/บังตัวละคร) • รันผ่าน `python tools/serve.py` แล้วเติม `&save=ชื่อ` = เซฟภาพลง `shots/ชื่อ.png` ให้ Read ดูได้
4. ผูกกับท่าใน `bind.json` (mode add ก่อน แล้วค่อย replace เมื่อผู้ใช้ชอบ)
