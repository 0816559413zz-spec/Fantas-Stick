# meadow_build.py — 🌄 ทุ่งหญ้าฮอกวอตส์ (meadow) 140 × 90 ยามเย็น: เนินหญ้าลูกคลื่น เนินกลางมีซุ้มหินโบราณ หินตั้ง 4 ก้อน ดอกไม้ป่า ปราสาทไกลๆ
# รัน: D:\Blender\blender.exe -b --factory-startup --python assets/src/maps/meadow_build.py
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _mapkit import *

PAL = {0: 0x6aa845, 1: 0x7ab650, 2: 0x5f9a3c, 3: 0x4f8a34, 4: 0x8a6a44, 5: 0x9a968c, 6: 0x7c7a74, 7: 0x66645f,
       8: 0x4e3420, 9: 0x3d7a35, 10: 0x4f8f3c, 11: 0xd8c050, 12: 0xc04a6a, 13: 0x8a6ad0, 14: 0xf0f0f0, 15: 0x2a3050}
K = Kit("meadow", 70, 45, PAL, gx=90, gy=62, seed=5150)
G1, G2, G3, G4, DIRT, STONE, ROCK, ROCK2, BARK, LEAF, LEAF2, FY, FP, FV, FW, FAR = range(16)


def height(x, y):
    h = 0.9 * math.sin(x / 11.0 + 0.6) * math.sin(y / 9.0 + 1.1) + 0.5 * math.sin(x / 5.7 - y / 7.9)
    h = max(-0.3, h)
    h += 2.6 * (1 - smooth(4, 13, math.hypot(x, y * 1.25)))                              # เนินกลาง (ลาดขึ้นได้)
    for fx, fy in SPAWNF:
        sx, sy = K.sp(fx, fy); h *= smooth(3, 8, math.hypot(x - sx, y - sy))
    if abs(x) > 70 or abs(y) > 45: h += 6 * smooth(0, 18, max(abs(x) - 70, abs(y) - 45))
    return h


def color(x, y, z, sl):
    if sl > 32: return ROCK
    if abs(y - 3 * math.sin(x / 9)) < 1.3 and abs(x) < 66: return DIRT                 # ทางเดินดินผ่านทุ่ง
    n = math.sin(x * 0.18 + math.sin(y * 0.15) * 2) + math.sin(y * 0.2 + x * 0.05) + K.R.uniform(-0.3, 0.3)
    return G4 if n < -1.2 else G3 if n < -0.3 else G1 if n < 0.8 else G2


K.ground(height, color)
K.bounds()
K.std_spawns(team_dx=0.1)
K.keep += [(0, 0, 6)]

# ---------- ซุ้มหินโบราณบนเนินกลาง (เสา 2 ต้น + คานพาด เดินลอดได้) ----------
m = K.mb()
for sx in (-1, 1):
    m.box((sx * 2.6, 0, 2.5), (1.2, 1.2, 5.0), STONE)
    m.box((sx * 2.6, 0, 0.2), (1.6, 1.6, 0.4), ROCK2)
m.box((0, 0, 5.4), (7.4, 1.5, 0.8), STONE)
m.box((3.6, 0.5, 0.35), (2.2, 1.0, 0.7), ROCK, rz=0.4)                                 # หินหล่น
K.obj("meadow_arch", m.mesh("meadow_arch"), None, (0, 0, height(0, 0) - 0.1), 0.3)
for sx in (-1, 1):
    c, s_ = math.cos(0.3), math.sin(0.3)
    K.col_cyl(sx * 2.6 * c, sx * 2.6 * s_, 0.8, 5.0)

# ---------- หินตั้ง 4 ก้อน (ตำแหน่งเดิม r 1.1 สูง 5) + ก้อนหินใหญ่ 6 ก้อน ----------
m = K.mb(); m.box((0, 0, 2.6), (1.6, 1.0, 5.2), STONE); m.box((0, 0, 5.3), (1.3, 0.8, 0.4), ROCK2)
st = m.mesh("meadow_standing")
for i, (fx, fy) in enumerate(((.3, .32), (.7, .68), (.3, .68), (.7, .32))):
    x, y = K.sp(fx, fy); K.place("meadow_stone_%d" % i, st, x, y, K.R.uniform(0, 3), 1.0, dz=-0.2); K.col_cyl(x, y, 1.1, 5)
rocks = [mesh_rock(K, ROCK if i % 2 else ROCK2, i + 5, name="meadow_rock%d" % i) for i in range(3)]
for i, (fx, fy, r) in enumerate(((.5, .2, 2.0), (.5, .8, 2.0), (.17, .5, 1.7), (.83, .5, 1.7), (.42, .5, 1.3), (.58, .5, 1.3))):
    x, y = K.sp(fx, fy); K.place("meadow_boulder_%d" % i, rocks[i % 3], x, y, K.R.uniform(0, 6), r * 1.25, dz=-0.3); K.col_cyl(x, y, r, 2)

# ---------- ต้นโอ๊กริมทุ่ง รั้วไม้ ดอกไม้ หญ้าสูง ----------
oak = mesh_oak(K, BARK, LEAF, LEAF2, name="meadow_oak")
for x, y in K.scatter(12, 10, lambda x, y: abs(x) > 48 or abs(y) > 33):
    s = K.R.uniform(1.0, 1.4); K.place("meadow_tree", oak, x, y, K.R.uniform(0, 6), s); K.col_cyl(x, y, 0.6 * s, 6)
m = K.mb()
for x in (-1.9, 0, 1.9): m.box((x, 0, 0.5), (0.16, 0.16, 1.0), BARK)
for z in (0.4, 0.8): m.box((0, 0, z), (4.0, 0.08, 0.12), DIRT)
fence = m.mesh("meadow_fence")
for i in range(9):
    x = -66 + i * 4.1; y = 38 + 1.5 * math.sin(i)
    K.place("meadow_fence", fence, x, y, 0.05 * math.sin(i))
flowers = [mesh_flower(K, LEAF, c, name="meadow_flower%d" % c) for c in (FY, FP, FV, FW)]
for j, (cx, cy) in enumerate(K.scatter(45, 6, lambda x, y: True)):
    for n in range(K.R.randint(6, 14)):
        a = K.R.uniform(0, 6.3); d = K.R.uniform(0, 2.2)
        K.place("meadow_flower", flowers[(j + n // 4) % 4], cx + math.cos(a) * d, cy + math.sin(a) * d, 0, K.R.uniform(0.8, 1.4), K.NOSH)
tuft = mesh_tuft(K, (G1, G2, G3), name="meadow_tuft", h=0.55, w=0.12)
for x, y in K.scatter(420, 1.4, lambda x, y: True, tries=8000):
    K.place("meadow_tuft", tuft, x, y, K.R.uniform(0, 6), K.R.uniform(0.8, 1.7), K.NOSH)

# ---------- ปราสาทบนผาไกลๆ + ภูเขา ----------
m = K.mb()
for i in range(18):
    a = i / 18 * math.tau; r = K.R.uniform(170, 230); h = K.R.uniform(35, 75)
    m.cyl((math.cos(a) * r, math.sin(a) * r, -2), (math.cos(a) * r, math.sin(a) * r, h), K.R.uniform(45, 75), 1, G4, 7)
m.cyl((40, 190, -2), (40, 190, 30), 60, 36, ROCK2, 9)
for x, y, r, h in ((20, 190, 6, 46), (40, 200, 8, 64), (58, 186, 5, 40), (75, 196, 6, 52)):
    m.cyl((x, y, 28), (x, y, 28 + h), r, r, STONE, 10); m.cyl((x, y, 28 + h), (x, y, 28 + h + r * 2.5), r * 1.35, 0.1, FAR, 10)
m.box((47, 194, 44), (60, 18, 30), STONE)
K.obj("meadow_far", m.mesh("meadow_far"), K.FAR)

K.finish(name="🌄 ทุ่งหญ้าฮอกวอตส์", desc="ทุ่งหญ้าลูกคลื่นยามเย็น เนินกลางมีซุ้มหินโบราณ หินตั้งไม่กี่ก้อน มองเห็นปราสาทไกลๆ",
         sky="sunset", fog="#d8a888,120,480", random=1, weather="clear:55,wind:25,rain:20", music="pitch", fx="fireflies:140",
         modes="coop,duel,ffa,tdm,race,br,imp")
