# hogsmeade_build.py — ❄️ หมู่บ้านฮอกส์มี้ด (hogsmeade) 130 × 85 กลางคืนหิมะตก: บ้านพังได้ 14 หลังรอบลาน บ่อน้ำ แผงตลาด โคมไฟ ปราสาทบนเขาไกลๆ
# รัน: D:\Blender\blender.exe -b --factory-startup --python assets/src/maps/hogsmeade_build.py
# บ้าน = bld_house_ (เกมใส่ house.glb + ระบบพังเป็นชิ้นให้เอง) ประตูหันไปทาง −Y ของ empty
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _mapkit import *

PAL = {0: 0xe8eef6, 1: 0xd6dfeb, 2: 0xc2cede, 3: 0x8a8478, 4: 0x6f6a62, 5: 0x6a4a2a, 6: 0x4e3420, 7: 0x2a3a2e,
       8: 0x3a5a40, 9: 0x8a1f1f, 10: 0xe8d8b0, 11: 0x2e2e34, 12: 0x222a45, 13: 0xffc36b, 14: 0xff9a40, 15: 0x9a968c}
K = Kit("hogsmeade", 65, 42.5, PAL, emit=(13, 14), gx=80, gy=58, seed=1031)
SNOW, SNOW2, SNOW3, COB, COB2, WOOD, DWOOD, PINE, PINE2, RED, CREAM, IRON, NIGHT, GLOW, FIRE, STONE = range(16)

HOUSES = []
for i in range(5):
    HOUSES.append((-41 + i * 20.5 + K.R.uniform(-1.5, 1.5), 26.5, 0.0))                 # แถวเหนือ ประตูหันใต้ (เข้าลาน)
    HOUSES.append((-41 + i * 20.5 + K.R.uniform(-1.5, 1.5), -26.5, math.pi))            # แถวใต้ ประตูหันเหนือ
for x, y, rz in ((-50, 12.5, math.pi / 2), (-50, -12.5, math.pi / 2), (50, 12.5, -math.pi / 2), (50, -12.5, -math.pi / 2)):
    HOUSES.append((x, y, rz))


def near_house(x, y, pad):
    return any(abs(x - hx) < 6 + pad and abs(y - hy) < 6 + pad for hx, hy, _ in HOUSES)


def height(x, y):
    if near_house(x, y, 1.5) or (abs(x) < 60 and abs(y) < 38): h = 0.0
    else: h = 0.25 * math.sin(x * 0.4) * math.sin(y * 0.33)
    if abs(x) > 65 or abs(y) > 42.5: h += 3 * smooth(0, 12, max(abs(x) - 65, abs(y) - 42.5))
    return h


def color(x, y, z, sl):
    r = math.hypot(x / 1.3, y)
    road = abs(y) < 3.2 or abs(abs(y) - 19) < 2.6 and abs(x) < 52 or 10 < r < 14
    if road: return COB if (int(x + 100) + int(y + 100)) % 2 else COB2
    n = math.sin(x * 0.3 + y * 0.2) + K.R.uniform(-0.4, 0.4)
    return SNOW if n > 0.3 else SNOW2 if n > -0.6 else SNOW3


K.ground(height, color)
K.bounds()
K.std_spawns()
K.keep += [(0, 0, 4)]

for i, (x, y, rz) in enumerate(HOUSES):
    K.empty("bld_house_%02d" % (i + 1), (x, y, 0), rz, scale=(K.R.uniform(0.95, 1.15), K.R.uniform(0.92, 1.08), 1))
    K.keep.append((x, y, 8))

# ---------- บ่อน้ำกลางลาน ----------
m = K.mb()
m.cyl((0, 0, 0), (0, 0, 1.0), 2.3, 2.3, STONE, 14); m.cyl((0, 0, 0.9), (0, 0, 1.0), 1.9, 1.9, NIGHT, 14)
m.cyl((0, 0, 1.0), (0, 0, 1.15), 2.4, 2.4, SNOW, 14)
for s in (-1, 1): m.box((s * 1.9, 0, 2.2), (0.25, 0.25, 2.4), DWOOD)
m.box((0, 0, 3.5), (4.6, 2.6, 0.2), DWOOD, rx=0.0); m.box((0, 0.7, 3.65), (4.8, 1.6, 0.18), SNOW, rx=0.45); m.box((0, -0.7, 3.65), (4.8, 1.6, 0.18), SNOW, rx=-0.45)
m.cyl((-1.8, 0, 2.6), (1.8, 0, 2.6), 0.12, 0.12, WOOD, 6)
K.obj("hog_well", m.mesh("hog_well"))
K.col_cyl(0, 0, 2.3, 1.6)

# ---------- แผงตลาด 4 แผง (หลังคาผ้าลายแดงครีม) ----------
m = K.mb()
m.box((0, 0, 0.5), (3.6, 1.6, 1.0), WOOD)
for sx in (-1, 1):
    for sy in (-1, 1): m.box((sx * 1.7, sy * 0.75, 1.5), (0.14, 0.14, 3.0), DWOOD)
for k in range(6): m.box((-1.5 + k * 0.6, 0, 3.0), (0.6, 2.2, 0.12), RED if k % 2 else CREAM, rx=0.25)
m.box((0, 0, 3.12), (3.8, 2.3, 0.08), SNOW, rx=0.25)
for k in range(5): m.ico((-1.2 + k * 0.6, -0.2, 1.15), 0.18, (RED, GLOW, 8, CREAM, FIRE)[k], sub=1)
stall = m.mesh("hog_stall")
for i, (dx, dy) in enumerate(((-21, 12.5), (21, 12.5), (-21, -12.5), (21, -12.5))):
    K.place("hog_stall_%d" % i, stall, dx, dy, math.pi / 2 if dx < 0 else -math.pi / 2); K.col_cyl(dx, dy, 2.2, 3.0)

# ---------- โคมไฟ 8 ต้นรอบลาน ----------
m = K.mb()
m.cyl((0, 0, 0), (0, 0, 0.4), 0.3, 0.3, IRON, 8); m.cyl((0, 0, 0.4), (0, 0, 5.6), 0.1, 0.08, IRON, 6)
m.box((0, 0, 6.0), (0.55, 0.55, 0.8), GLOW); m.cyl((0, 0, 6.4), (0, 0, 6.9), 0.5, 0.05, IRON, 4)
m.cyl((0, 0, 6.7), (0, 0, 6.95), 0.3, 0.02, SNOW, 4)
lamp = m.mesh("hog_lamp")
for i in range(8):
    a = i / 8 * math.tau + 0.4; x, y = math.cos(a) * 12.5, math.sin(a) * 9.5
    K.place("hog_lamp_%d" % i, lamp, x, y); K.col_cyl(x, y, 0.45, 7)
    K.light("lamp_%d" % i, x, y, 6.0, (1, 0.72, 0.4), 140)

# ---------- รั้ว ม้านั่ง ถังหิมะ ต้นสน ----------
pine = mesh_pine(K, DWOOD, PINE, snow=SNOW, h=1.3, name="hog_pine")
pine2 = mesh_pine(K, DWOOD, PINE2, snow=SNOW, h=1.7, name="hog_pine_tall")
m = K.mb()
for x in (-1.9, 0, 1.9): m.box((x, 0, 0.5), (0.16, 0.16, 1.0), DWOOD)
for z in (0.4, 0.8): m.box((0, 0, z), (4.0, 0.08, 0.12), WOOD)
m.box((0, 0, 1.02), (4.0, 0.2, 0.06), SNOW)
fence = m.mesh("hog_fence")
m = K.mb(); m.box((0, 0, 0.45), (2.4, 0.7, 0.12), WOOD); m.box((0, 0, 0.53), (2.4, 0.7, 0.05), SNOW)
for dx in (-0.9, 0.9): m.box((dx, 0, 0.2), (0.15, 0.6, 0.4), IRON)
bench = m.mesh("hog_bench")
m = K.mb(); m.ico((0, 0, 0.45), 0.5, SNOW, sub=2); m.ico((0, 0, 1.15), 0.36, SNOW, sub=2); m.ico((0, 0, 1.65), 0.25, SNOW, sub=2)
m.cyl((0, -0.22, 1.67), (0, -0.45, 1.65), 0.05, 0.0, FIRE, 4); m.box((0, 0, 1.92), (0.36, 0.36, 0.3), IRON)
snowman = m.mesh("hog_snowman")
for x, y in ((-30, 7), (30, -7), (-8, 33), (8, -33)):
    K.place("hog_bench", bench, x, y, 0 if abs(y) < 20 else math.pi / 2)
for x, y in ((-36, -6), (36, 6)):
    K.place("hog_snowman", snowman, x, y, face_dir(x, y, 0, 0)); K.col_cyl(x, y, 0.6, 1.9)
for y in (36.5, -36.5):
    for x in range(-56, 57, 4):
        if not near_house(x, y, 0): K.place("hog_fence", fence, x, y)
for x, y in K.scatter(26, 5, lambda x, y: not near_house(x, y, 2) and (abs(x) > 40 or abs(y) > 32)):
    s = K.R.uniform(0.85, 1.2); K.place("hog_tree", pine2 if K.R.random() < 0.5 else pine, x, y, K.R.uniform(0, 6), s); K.col_cyl(x, y, 0.8 * s, 9)
for i in range(70):                                                                    # ต้นสนนอกขอบเขต
    a = K.R.uniform(0, math.tau); x = math.cos(a) * K.R.uniform(70, 90); y = math.sin(a) * K.R.uniform(48, 62)
    K.obj("hog_far_pine", pine2, K.FAR, (x, y, height(x, y)), K.R.uniform(0, 6), K.R.uniform(1.1, 1.6))
# กองหิมะเล็กๆ
m = K.mb(); m.ico((0, 0, 0), 0.8, SNOW, sc=(1.4, 1, 0.45), sub=1); drift = m.mesh("hog_drift")
for x, y in K.scatter(40, 4, lambda x, y: not near_house(x, y, 1)):
    K.place("hog_drift", drift, x, y, K.R.uniform(0, 6), K.R.uniform(0.6, 1.5), K.NOSH)

# ---------- ปราสาทบนเขาไกลๆ (หน้าต่างเรืองแสง) ----------
m = K.mb()
m.cyl((-60, 300, -5), (-60, 300, 40), 140, 40, PINE2, 9)
for x, y, r, h in ((-90, 300, 7, 70), (-62, 310, 9, 92), (-35, 296, 6, 64), (-10, 305, 8, 78), (-120, 290, 5, 55)):
    m.cyl((x, y, 30), (x, y, 30 + h), r, r * 1.05, NIGHT, 10); m.cyl((x, y, 30 + h), (x, y, 30 + h + r * 2.6), r * 1.35, 0.1, NIGHT, 10)
    for k in range(4): m.box((x + K.R.uniform(-r, r) * 0.7, y - r - 0.1, 30 + h * K.R.uniform(0.35, 0.9)), (2.2, 0.2, 3.2), GLOW)
m.box((-62, 302, 50), (110, 30, 40), NIGHT)
K.obj("hog_far_castle", m.mesh("hog_far_castle"), K.FAR)

K.finish(name="❄️ หมู่บ้านฮอกส์มี้ด", desc="หมู่บ้านหิมะยามค่ำ บ้านไม้พังได้ 14 หลัง บ่อน้ำกลางลาน แผงตลาด โคมไฟ ปราสาทบนเขาไกลๆ",
         sky="night", fog="#1c2640,70,260", random=1, weather="snow:60,clear:25,fog:15", music="forest", fx="snow",
         modes="coop,duel,ffa,tdm,race,br,imp")
