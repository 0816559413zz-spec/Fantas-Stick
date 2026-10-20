# ruins_build.py — 🏛️ ซากลานประลอง (ruins) 130 × 90 ยามเย็น: ลานทรายในวงเสาโบราณ 10 ต้น (บางต้นหัก) แท่นกลางยกสูง เสาล้ม 2 ต้น กำแพงอัฒจันทร์พังรอบนอก
# รัน: D:\Blender\blender.exe -b --factory-startup --python assets/src/maps/ruins_build.py
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _mapkit import *

PAL = {0: 0xd8b878, 1: 0xc9a868, 2: 0xb8975a, 3: 0xe6c98c, 4: 0xc4b496, 5: 0xb0a284, 6: 0xa8987a, 7: 0x8a7a60,
       8: 0x6a4a2a, 9: 0x7a5a3a, 10: 0x9a3a2a, 11: 0x3a6a8a, 12: 0x4f7a3a, 13: 0xff8a2a, 14: 0xffd890, 15: 0x5a4a3a}
K = Kit("ruins", 65, 45, PAL, emit=(13, 14), gx=95, gy=75, seed=3141)
S1, S2, S3, S4, M1, M2, M3, M4, WOOD, WOOD2, CLOTH, TILE, PLANT, FIRE, GLOW, DARK = range(16)


def height(x, y):
    r = math.hypot(x, y)
    h = 1.0 * (1 - smooth(6.5, 8.5, r))                                                 # แท่นกลาง (ขอบลาด)
    h += 0.25 * math.sin(x * 0.21) * math.sin(y * 0.27) * smooth(12, 20, r)
    e = (x / 46) ** 2 + (y / 33) ** 2
    if e > 1.35: h += 2.2 * smooth(1.35, 2.3, e) * (0.7 + 0.3 * math.sin(x * 0.15 + y * 0.1))   # เนินทรายรอบนอก
    if abs(x) > 65 or abs(y) > 45: h += 6 * smooth(0, 20, max(abs(x) - 65, abs(y) - 45))
    return h


def color(x, y, z, sl):
    r = math.hypot(x, y)
    if r < 8.6: return M1 if (int((math.atan2(y, x) + 4) * 4) + int(r)) % 2 else M2                 # หินแท่นกลาง
    if abs(r - 9.2) < 0.4: return M4
    if sl > 20: return S3
    ring = (x / 31) ** 2 + (y / 21) ** 2
    if abs(ring - 1) < 0.08: return M3                                                   # แนวฐานวงเสา
    n = math.sin(x * 0.3 + y * 0.1) + K.R.uniform(-0.4, 0.4)
    return S1 if n > 0.4 else S2 if n > -0.5 else S4


K.ground(height, color)
K.bounds()
K.std_spawns()
K.keep += [(0, 0, 9)]

# ---------- วงเสา 10 ต้น (เดิม: วงรี 31 × 21, ทุกต้นที่ i%3 != 0 หัก) ----------
def column(h, broken, seed):
    m = K.mb(); r = random.Random(seed)
    m.box((0, 0, 0.3), (3.4, 3.4, 0.6), M3)
    top = h if not broken else h
    m.cyl((0, 0, 0.6), (0, 0, top), 1.35, 1.2, M1, 12)
    for k in range(12):
        a = k / 12 * math.tau; m.box((math.cos(a) * 1.26, math.sin(a) * 1.26, (0.6 + top) / 2), (0.14, 0.14, top - 0.6), M2, rz=a)
    if broken:
        m.ico((0, 0, top), 1.25, M2, sc=(1, 1, 0.45), sub=1, jit=0.25, seed=seed)
        for k in range(3):
            a = r.uniform(0, 6.3); d = r.uniform(2.2, 3.4)
            m.ico((math.cos(a) * d, math.sin(a) * d, 0.3), r.uniform(0.35, 0.7), M2, sub=1, jit=0.3, seed=seed + k)
    else:
        m.cyl((0, 0, top), (0, 0, top + 0.7), 1.3, 1.7, M3, 12); m.box((0, 0, top + 0.95), (3.8, 3.8, 0.5), M1)
    return m.mesh("ruins_col_%d" % seed)


R0 = random.Random(3141)
for i in range(10):
    a = i / 10 * math.tau + 0.3
    broken = i % 3 != 0
    h = (2.6 + R0.random() * 2) if broken else 8.0
    x, y = math.cos(a) * 31, -math.sin(a) * 21
    K.place("ruins_column_%d" % i, column(h, broken, i), x, y, R0.uniform(0, 1))
    K.col_cyl(x, y, 1.5, h)

# ---------- เสาล้ม 2 ต้น (เดิม: (−13, +6) หมุน 0.4 และ (+13, −6.5) หมุน −0.6, กว้าง 2.2 สูง 1.8) ----------
m = K.mb()
m.cyl((-4.5, 0, 1.0), (4.5, 0, 1.0), 1.1, 1.1, M1, 12)
for k in range(10):
    a = k / 10 * math.tau; m.box((0, math.cos(a) * 1.05, 1.0 + math.sin(a) * 1.05), (9.0, 0.12, 0.12), M2)
m.ico((5.2, 0.4, 0.6), 0.9, M2, sc=(1, 1, 0.6), sub=1, jit=0.3, seed=4)
fallen = m.mesh("ruins_fallen")
for i, (x, y, a) in enumerate(((-13, 6, 0.4), (13, -6.5, -0.6))):
    K.place("ruins_fallen_%d" % i, fallen, x, y, -a); K.col_box(x, y, 9.2, 2.2, 1.8, -a)

# ---------- แท่นกลาง: รูปปั้นนักรบหัก + เตาไฟ 4 มุม ----------
m = K.mb()
m.box((0, 0, 0.6), (2.6, 2.6, 1.2), M3)
m.cyl((0, 0, 1.2), (0, 0, 3.4), 0.6, 0.75, M1, 10)
m.cyl((0.3, 0, 3.2), (1.6, 0.2, 4.4), 0.18, 0.12, M1, 6)
m.ico((0, 0, 3.6), 0.4, M2, sub=1)
m.box((0.9, -1.8, 0.25), (1.2, 0.8, 0.5), M2, rz=0.5)                                 # หัวรูปปั้นหล่น
K.obj("ruins_statue", m.mesh("ruins_statue"), None, (0, 0, height(0, 0)))
K.col_cyl(0, 0, 1.6, 3.5)
m = K.mb(); m.cyl((0, 0, 0), (0, 0, 1.4), 0.5, 0.35, DARK, 8); m.cyl((0, 0, 1.4), (0, 0, 1.8), 0.4, 0.8, DARK, 8)
m.ico((0, 0, 1.95), 0.55, FIRE, sc=(1, 1, 1.2), sub=1, jit=0.25, seed=2)
brz = m.mesh("ruins_brazier")
for i, a in enumerate((0.8, 2.35, 3.9, 5.5)):
    x, y = math.cos(a) * 6.0, math.sin(a) * 6.0
    K.place("ruins_brazier_%d" % i, brz, x, y); K.col_cyl(x, y, 0.6, 1.9)
    K.light("brazier_%d" % i, x, y, 2.4, (1, 0.6, 0.3), 120)

# ---------- กำแพงอัฒจันทร์โบราณรอบนอก (พังเป็นช่วง) + ซุ้มประตู ----------
m = K.mb()
segs = 28
for i in range(segs):
    a0, a1 = i / segs * math.tau, (i + 0.86) / segs * math.tau
    hgt = 7.5 if (i * 7) % 5 else 3.0
    if i % 9 == 4: continue
    xs = [(math.cos(a0), math.sin(a0)), (math.cos(a1), math.sin(a1))]
    RX, RY = 72, 54
    p0 = (xs[0][0] * RX, xs[0][1] * RY); p1 = (xs[1][0] * RX, xs[1][1] * RY)
    cx, cy = (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2; L = math.hypot(p1[0] - p0[0], p1[1] - p0[1]); rz = math.atan2(p1[1] - p0[1], p1[0] - p0[0])
    m.box((cx, cy, hgt / 2), (L, 3.0, hgt), M3, rz=rz)
    for k in range(3):
        m.box((cx * 1.04, cy * 1.04, 1.0 + k * 1.1), (L, 1.2, 0.5), M4, rz=rz)
    if hgt > 5:
        for t in (-0.3, 0.3):
            m.box((cx + math.cos(rz) * L * t, cy + math.sin(rz) * L * t, hgt * 0.62), (1.4, 3.1, 2.4), DARK, rz=rz)   # ช่องโค้ง
K.obj("ruins_wall", m.mesh("ruins_wall"), K.FAR)

# ---------- เสาโอเบลิสก์ ผ้าใบ เศษหิน หญ้าแห้ง ----------
m = K.mb(); m.box((0, 0, 0.4), (2.0, 2.0, 0.8), M3); m.cyl((0, 0, 0.8), (0, 0, 7.5), 0.85, 0.45, M4, 4); m.cyl((0, 0, 7.5), (0, 0, 8.4), 0.45, 0.0, GLOW, 4)
obel = m.mesh("ruins_obelisk")
for i, (x, y) in enumerate(((-30, 39), (30, -39), (-30, -39), (30, 39))):
    K.place("ruins_obelisk_%d" % i, obel, x, y, 0.785); K.col_cyl(x, y, 1.0, 8)
m = K.mb()
for sx in (-1, 1):
    for sy in (-1, 1): m.cyl((sx * 1.8, sy * 1.4, 0), (sx * 1.8, sy * 1.4, 2.6), 0.08, 0.08, WOOD, 5)
m.box((0, 0, 2.7), (4.0, 3.2, 0.06), CLOTH, rx=0.12)
m.box((0, 0, 0.4), (1.2, 0.8, 0.8), WOOD2)
tent = m.mesh("ruins_tent")
for i, (x, y) in enumerate(((-46, 18), (46, -18))):
    K.place("ruins_tent_%d" % i, tent, x, y, 1.57); K.col_box(x, y, 1.4, 1.0, 0.9)
rub = [mesh_rock(K, M2 if i % 2 else M3, i + 50, sc=(0.8, 0.7, 0.5), name="ruins_rubble%d" % i) for i in range(3)]
for x, y in K.scatter(40, 4, lambda x, y: math.hypot(x, y) > 10):
    K.place("ruins_rubble", rub[int(abs(x)) % 3], x, y, K.R.uniform(0, 6), K.R.uniform(0.3, 0.7), K.NOSH, dz=-0.1)
tuft = mesh_tuft(K, (PLANT, S3, M4), name="ruins_tuft", h=0.5)
for x, y in K.scatter(160, 2, lambda x, y: math.hypot(x, y) > 9, tries=6000):
    K.place("ruins_tuft", tuft, x, y, K.R.uniform(0, 6), K.R.uniform(0.7, 1.4), K.NOSH)
m = K.mb()
for i in range(14):
    a = i / 14 * math.tau; r = K.R.uniform(180, 240); h = K.R.uniform(25, 60)
    m.cyl((math.cos(a) * r, math.sin(a) * r, -2), (math.cos(a) * r, math.sin(a) * r, h), K.R.uniform(60, 90), 1, S3, 6)
K.obj("ruins_far", m.mesh("ruins_far"), K.FAR)

K.finish(name="🏛️ ซากลานประลอง", desc="ลานประลองโบราณกลางทรายยามเย็น วงเสาหัก แท่นกลางยกสูง เสาล้มให้หลบ กำแพงอัฒจันทร์พังรอบนอก",
         sky="sunset", fog="#e0b088,120,500", random=1, weather="clear:50,heat:30,wind:20", music="pitch",
         modes="coop,duel,ffa,tdm,race,br,imp")
