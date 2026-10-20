# forest_build.py — 🌲 ป่ามืด (forest) 160 × 110 กลางคืน: เนินลูกคลื่น ลำธารตื้น วงหินโบราณกลางป่า เห็ดเรืองแสง ใยแมงมุม หิ่งห้อย
# รัน: D:\Blender\blender.exe -b --factory-startup --python assets/src/maps/forest_build.py   (ไม่อยู่ในรายการสุ่ม เหมือนเดิม)
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _mapkit import *

PAL = {0: 0x2f4a2c, 1: 0x36552f, 2: 0x283f26, 3: 0x3d3326, 4: 0x4a3c2a, 5: 0x5c5a55, 6: 0x46443f, 7: 0x2a1d14,
       8: 0x1e3a24, 9: 0x24472a, 10: 0x8e8e9c, 11: 0x7a7468, 12: 0x2a5a6a, 13: 0x4fe8d0, 14: 0xb77dff, 15: 0x8affc8}
K = Kit("forest", 80, 55, PAL, emit=(13, 14, 15), gx=90, gy=65, seed=20251016)
G1, G2, G3, DIRT, DIRT2, ROCK, ROCK2, BARK, LEAF, LEAF2, WEB, STONE, WATER, MUSH1, MUSH2, RUNEG = range(16)


def creek_x(y): return -34 + 6 * math.sin(y / 13.0) + 2 * math.sin(y / 5.1)


def height(x, y):
    h = 1.6 * math.sin(x / 15.0 + 1.3) * math.sin(y / 12.0 + 0.4) + 0.9 * math.sin(x / 7.3 + y / 9.1)
    h = max(h, -0.4) * 1.1
    h *= 1 - smooth(10, 18, 18 - math.hypot(x, y))                                   # ลานวงหินกลางป่าเรียบ
    for fx, fy in SPAWNF + [(0.14, 0.5), (0.86, 0.5)]:
        sx, sy = K.sp(fx, fy); h *= smooth(4, 9, math.hypot(x - sx, y - sy))          # จุดเกิดเรียบ
    d = abs(x - creek_x(y))
    h = h * smooth(3, 7, d) - 0.7 * (1 - smooth(1.5, 4, d))                           # ลำธารตื้น
    if abs(x) > 80 or abs(y) > 55: h += 2.5 * smooth(0, 10, max(abs(x) - 80, abs(y) - 55))
    return h


def color(x, y, z, sl):
    if z < -0.45: return DIRT2
    if sl > 30: return ROCK2
    r = math.hypot(x, y)
    if 9 < r < 14 and abs(math.atan2(y, x) * 8 / math.pi % 2 - 1) < 0.2: return STONE
    if r < 15: return DIRT if K.R.random() < 0.6 else G3
    n = math.sin(x * 0.2 + math.sin(y * 0.15) * 2) + math.sin(y * 0.23 + x * 0.06) + K.R.uniform(-0.3, 0.3)
    return G3 if n < -1 else DIRT if n > 1.4 else (G1 if n < 0.3 else G2)


K.ground(height, color)
K.bounds()
K.std_spawns()
K.keep += [(0, 0, 16), (K.sp(.14, .5)[0], 0, 9), (K.sp(.86, .5)[0], 0, 9)]

# น้ำลำธาร (พื้นผิวน้ำตื้น)
import bmesh, numpy as np
bm = bmesh.new()
rows = []
for y in np.arange(-K.GY, K.GY + 0.01, 1.5):
    cx = creek_x(y); rows.append((bm.verts.new((cx - 3.2, y, -0.35)), bm.verts.new((cx + 3.2, y, -0.35))))
for (a0, b0), (a1, b1) in zip(rows, rows[1:]): bm.faces.new((a0, b0, b1, a1))
me = bpy.data.meshes.new("env_water_creek"); bm.to_mesh(me); bm.free()
me.materials.append(K.mat("water", (0.1, 0.25, 0.32, 1), 0.06, 0.75))
K.obj("env_water_creek", me, K.ROOT)
# หินก้าวข้ามลำธาร 3 จุด
st = mesh_rock(K, ROCK, 91, sc=(0.7, 0.6, 0.35), name="deco_steprock")
for y0 in (-30, 4, 34):
    for k in range(-1, 2):
        K.obj("forest_step", st, None, (creek_x(y0) + k * 1.8, y0 + K.R.uniform(-0.5, 0.5), -0.55))

# ---------- วงหินโบราณกลางป่า (8 ก้อน รัศมี 12.5 r 1.2 สูง 6.5 ตามเดิม) + แท่นบูชาเรืองแสง ----------
m = K.mb()
m.box((0, 0, 3.2), (2.0, 1.2, 6.6), STONE)
m.box((0, 0, 6.6), (2.3, 1.4, 0.4), STONE)
m.box((0, -0.62, 3.6), (0.8, 0.05, 2.2), RUNEG)
sm = m.mesh("forest_stone")
for i in range(8):
    a = i / 8 * math.tau + 0.2
    x, y = math.cos(a) * 12.5, math.sin(a) * 12.5
    K.place("forest_stone_%d" % i, sm, x, y, a + math.pi / 2)
    K.col_cyl(x, y, 1.2, 6.5)
m = K.mb()
m.cyl((0, 0, 0), (0, 0, 0.5), 3.0, 3.2, STONE, 12)
m.cyl((0, 0, 0.5), (0, 0, 1.2), 1.6, 1.8, STONE, 8)
m.ico((0, 0, 2.0), 0.6, RUNEG, sub=1)
K.obj("forest_altar", m.mesh("forest_altar"))
K.col_cyl(0, 0, 1.8, 1.2)
K.light("altar", 0, 0, 2.6, (0.5, 1, 0.8), 180)

# ---------- ต้นไม้ (ที่กำบัง) + หิน ----------
pine = mesh_pine(K, BARK, LEAF, h=1.5, name="forest_pine")
pine2 = mesh_pine(K, BARK, LEAF2, h=1.9, name="forest_pine_tall")
oak = mesh_oak(K, BARK, LEAF2, LEAF, name="forest_oak")
dead = mesh_oak(K, BARK, 0, 0, name="forest_dead", dead=True)
rocks = [mesh_rock(K, ROCK if i % 2 else ROCK2, i, name="forest_rock%d" % i) for i in range(4)]
ok = lambda x, y: abs(x - creek_x(y)) > 5
trees = K.scatter(150, 5.0, ok)
for i, (x, y) in enumerate(trees):
    k = K.R.random()
    if k < 0.12:
        s = K.R.uniform(1.3, 2.2); K.place("forest_rock", rocks[i % 4], x, y, K.R.uniform(0, 6), s, dz=-0.2); K.col_cyl(x, y, 1.1 * s, 1.5 * s)
    else:
        me = pine2 if k < 0.45 else pine if k < 0.8 else oak if k < 0.93 else dead
        s = K.R.uniform(0.85, 1.25)
        K.place("forest_tree", me, x, y, K.R.uniform(0, 6), s)
        K.col_cyl(x, y, 0.75 * s, 9 + 6 * s)
K.keep += [(x, y, 2) for x, y in trees]

# ---------- เห็ดเรืองแสง + ใยแมงมุม + พุ่มไม้ ----------
m = K.mb(); m.cyl((0, 0, 0), (0, 0, 0.35), 0.07, 0.06, WEB, 6); m.cyl((0, 0, 0.32), (0, 0, 0.5), 0.28, 0.02, MUSH1, 8)
mu1 = m.mesh("forest_mush1")
m = K.mb(); m.cyl((0, 0, 0), (0, 0, 0.45), 0.08, 0.07, WEB, 6); m.cyl((0, 0, 0.42), (0, 0, 0.6), 0.32, 0.02, MUSH2, 8)
mu2 = m.mesh("forest_mush2")
for j, (cx, cy) in enumerate(K.scatter(40, 6, lambda x, y: True)):
    for n in range(K.R.randint(3, 7)):
        a = K.R.uniform(0, 6.3); d = K.R.uniform(0.2, 1.4)
        K.place("forest_mush", mu1 if (n + j) % 2 else mu2, cx + math.cos(a) * d, cy + math.sin(a) * d, 0, K.R.uniform(0.6, 1.5), K.NOSH)
for i, (x, y) in enumerate(((-55, 30), (50, -35), (30, 38), (-48, -28), (60, 20), (-20, 42))):
    K.light("mush_%d" % i, x, y, 1.2, (0.4, 0.9, 1.0) if i % 2 else (0.7, 0.45, 1.0), 90)
m = K.mb()
for a in range(6):
    aa = a / 6 * math.pi
    m.cyl((-1.5 * math.cos(aa), 0, 1.5 - 1.5 * math.sin(aa)), (1.5 * math.cos(aa), 0, 1.5 + 1.5 * math.sin(aa)), 0.015, 0.015, WEB, 3)
for r in (0.5, 1.0, 1.45):
    for a in range(12):
        a0, a1 = a / 12 * math.tau, (a + 1) / 12 * math.tau
        m.cyl((r * math.cos(a0), 0, 1.5 + r * math.sin(a0)), (r * math.cos(a1), 0, 1.5 + r * math.sin(a1)), 0.012, 0.012, WEB, 3)
web = m.mesh("forest_web")
for i in range(8):
    x, y = trees[(i * 17) % len(trees)]
    K.place("forest_web", web, x + 1.6, y, K.R.uniform(0, 6), K.R.uniform(0.9, 1.4), K.NOSH, dz=K.R.uniform(0.5, 1.5))
bush = K.mb(); bush.ico((0, 0, 0.5), 0.9, LEAF, sc=(1.2, 1.0, 0.7)); bush.ico((0.7, 0.3, 0.4), 0.6, LEAF2); bushm = bush.mesh("forest_bush")
tuft = mesh_tuft(K, (G1, G2, LEAF), name="forest_tuft", h=0.6)
for x, y in K.scatter(90, 3, lambda x, y: True):
    K.place("forest_bush", bushm, x, y, K.R.uniform(0, 6), K.R.uniform(0.7, 1.4), K.NOSH)
for x, y in K.scatter(300, 1.2, lambda x, y: True, tries=6000):
    K.place("forest_tuft", tuft, x, y, K.R.uniform(0, 6), K.R.uniform(0.8, 1.6), K.NOSH)
# ท่อนไม้ล้ม (ที่กำบังเตี้ย กระโดดข้ามได้)
m = K.mb(); m.cyl((-3, 0, 0.5), (3, 0, 0.5), 0.55, 0.5, BARK, 8); m.ico((2.2, 0.3, 0.9), 0.5, LEAF, sub=1)
logm = m.mesh("forest_log")
for x, y in K.scatter(10, 14, lambda x, y: abs(x - creek_x(y)) > 7):
    a = K.R.uniform(0, 3.14); K.place("forest_log", logm, x, y, a); K.col_box(x, y, 6.0, 1.1, 1.0, a)

# ฉากหลัง: ต้นไม้นอกขอบเขต (ป่าทึบ)
farp = mesh_pine(K, BARK, LEAF2, h=2.4, name="forest_far_pine")
for i in range(110):
    a = K.R.uniform(0, math.tau)
    x = math.cos(a) * K.R.uniform(85, 110); y = math.sin(a) * K.R.uniform(60, 85)
    K.obj("forest_far", farp, K.FAR, (x, y, height(x, y) - 0.5), K.R.uniform(0, 6), K.R.uniform(1, 1.6))

K.finish(name="🌲 ป่ามืด", desc="ป่ากว้างกลางคืน ลำธารตื้น วงหินโบราณกลางป่า เห็ดเรืองแสง ระวังแมงมุมยักษ์!", sky="night",
         fog="#0e1a1a,40,190", random=0, weather="clear:40,fog:40,rain:20", music="forest", fx="fireflies:420",
         modes="coop,duel,ffa,tdm,race,br,imp")
