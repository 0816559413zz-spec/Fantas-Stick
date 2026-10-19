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
| `look` | enum (glow/spark/streak/ring/flake/smoke/fire/ember) | `spark` |  |  | หน้าตาเม็ด |
| `size` | num | `[2,3]` | 0.3–30 | สุ่มช่วง · สูตร | ขนาดเม็ด (8 ≈ 1 ม.) |
| `grow` | num | `0` | -2–4 |  | โตขึ้นต่อวินาที |
| `col` | col | `$core` |  |  | สีตอนเกิด |
| `c2` | col | `$deep` |  |  | สีท้ายอายุ |
| `gravity` | num | `2` | -10–20 |  | แรงโน้มถ่วง (ติดลบ = ลอย) |
| `drag` | num | `2.5` | 0–10 |  | แรงต้าน |
| `spin` | num | `0` | 0–20 |  | หมุน (เรเดียน/วิ) |
| `fin` | num | `8` | 0–40 |  | จางเข้าตอนเกิด |
| `curl` | bool | `true` |  |  | ลมหมุนวน |
| `fb` | str | `` |  |  | flipbook (smoke/fire) |

### `mesh` ⬢ รูปทรง 3D
3D shape with a shader material — fireballs, shells, domes, cones, crescents, spikes, beams, Blender models.

| ฟิลด์ | ชนิด | ค่าเริ่ม | ช่วง | รับ | ความหมาย |
|---|---|---|---|---|---|
| `shape` | enum (sphere/dome/disc/ring/cylinder/cone/torus/crescent/spikes/beam/plane/lathe/ribbon/glb) | `sphere` |  |  | รูปทรง |
| `glb` | str | `` |  |  | โมเดล (ชื่อใน manifest) |
| `inner` | num | `0.7` | 0–0.98 |  | รูใน (วง) |
| `n` | int | `10` | 3–40 |  | จำนวน (หนาม) |
| `wk` | num | `0.6` | 0.05–2 |  | ความกว้าง (เสี้ยว/ริบบิ้น) |
| `prof` | list | `[[0.2,0],[1,0.4],[0.6,1],[0,1.3]]` |  |  | เส้นโปรไฟล์ [รัศมี,สูง] (lathe) |
| `path` | list | `[[0,0,0],[0,1,2],[0,0,4]]` |  |  | เส้นทาง [x,y,z] (ribbon) |
| `mat` | enum (energy/fire/ice/glow/solid/flip) | `energy` |  |  | วัสดุ |
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
| `tex` | str | `` |  |  | ภาพ flipbook (mat=flip) |

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
- รูปทรง (shape): sphere, dome, disc, ring, cylinder, cone, torus, crescent, spikes, beam, plane, lathe, ribbon, glb
- วัสดุ (mat): energy, fire, ice, glow, solid, flip — energy = ขอบเรือง+ลายไหล (สีจากจาน) • fire = shader ไฟของเกม • ice = shader น้ำแข็ง • glow = สีเรียบบวกแสง • solid = ทึบ • flip = ภาพ flipbook
- ปล่อยจาก (from): point, sphere, hemisphere, ring, disc, cone, box, line, mesh
- ทิศ (dir): out, flat, up, down, in, aim, tangent, random — flat = กระจายแนวนอน (ความเร็วขึ้นจาก up)
- หน้าตาเม็ด (look): glow, spark, streak, ring, flake, smoke, fire, ember
- ยึดกับ (att): point, ground, feet, chest, head, wand

## ผูกกับเกม — `assets/fx/bind.json`
assets/fx/bind.json — ผูกเหตุการณ์ของเกมกับเอฟเฟกต์ โดยไม่แก้โค้ดสกิล
- คีย์: "efx:<ชื่อ efx>" (เช่น efx:dfboom) • "<k>:<t>" หรือ "<k>" สำหรับ event ทั่วไป (เช่น imp:fire, parry, die)
- `fx`: ชื่อเอฟเฟกต์ (path ใต้ assets/fx/ ไม่มี .fx.json)
- `mode`: add = เล่นเพิ่มจากภาพเดิม (ค่าเริ่ม) • replace = แทนภาพเดิมทั้งหมดของ event นี้
- `p`: params เป็นสูตรจาก ev ได้ เช่น {"r":"ev.r/20"}
- `s`: ขนาด (ตัวเลขหรือสูตร)
- `pal`: บังคับธาตุ
- `follow`: "ev.id" = ติดตามผู้เล่นคนนั้น

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
