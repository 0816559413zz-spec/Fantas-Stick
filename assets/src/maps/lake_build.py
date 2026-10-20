# lake_build.py — 🧊 ทะเลสาบน้ำแข็ง (lake) 150 × 100 กลางคืน: ลานน้ำแข็งกว้างกลางแผนที่ เกาะหินกลางทะเลสาบ ก้อนน้ำแข็งให้หลบ ชายฝั่งหิมะและป่าสน
# รัน: D:\Blender\blender.exe -b --factory-startup --python assets/src/maps/lake_build.py   (โหมด BR ใช้แผนที่นี้)
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _mapkit import *

PAL = {0: 0xe8eef6, 1: 0xd2dceb, 2: 0xbccbe0, 3: 0x8fb4d8, 4: 0x7aa4cc, 5: 0x6a94bf, 6: 0x5c5a55, 7: 0x46443f,
       8: 0x2a1d14, 9: 0x1e3a2a, 10: 0x24472f, 11: 0xa8d8f0, 12: 0xd8f4ff, 13: 0x6ae0ff, 14: 0x2a3a5a, 15: 0x9ab8d8}
K = Kit("lake", 75, 50, PAL, emit=(13,), gx=92, gy=68, seed=7777)
SNOW, SNOW2, SNOW3, ICE, ICE2, ICE3, ROCK, ROCK2, BARK, PINE, PINE2, CRY, CRY2, GLOW, NIGHT, FROST = range(16)
LX, LY = 56.0, 36.0


def lake(x, y): return (x / LX) ** 2 + (y / LY) ** 2


def height(x, y):
    e = lake(x, y)
    if e < 1: h = -0.35
    else: h = -0.35 + 0.35 * smooth(1.0, 1.15, e) + 0.6 * smooth(1.15, 1.8, e) * (0.6 + 0.4 * math.sin(x * 0.3 + y * 0.2))
    h += 1.4 * (1 - smooth(2.5, 6, math.hypot(x, y)))                                   # เกาะหินกลางทะเลสาบ
    if abs(x) > 75 or abs(y) > 50: h += 5 * smooth(0, 15, max(abs(x) - 75, abs(y) - 50))
    return h


def color(x, y, z, sl):
    e = lake(x, y)
    if math.hypot(x, y) < 5.5: return ROCK2 if sl > 15 else SNOW2
    if e < 1:
        n = math.sin(x * 0.25 + y * 0.4) + math.sin(y * 0.33 - x * 0.12) + K.R.uniform(-0.3, 0.3)
        return ICE if n > 0.6 else ICE2 if n > -0.7 else ICE3
    if e < 1.12: return FROST
    return SNOW if K.R.random() < 0.6 else SNOW2


K.ground(height, color)
K.bounds()
K.std_spawns()
K.keep += [(0, 0, 6)]

# ผิวน้ำแข็งเงา (พื้นผิวลื่น env_ice_ — ระบบเฟส 2)
import bmesh
bm = bmesh.new(); n = 48
c = bm.verts.new((0, 0, -0.32)); ring = [bm.verts.new((math.cos(i / n * math.tau) * LX * 0.995, math.sin(i / n * math.tau) * LY * 0.995, -0.32)) for i in range(n)]
for i in range(n): bm.faces.new((c, ring[i], ring[(i + 1) % n]))
me = bpy.data.meshes.new("env_ice_lake"); bm.to_mesh(me); bm.free()
me.materials.append(K.mat("ice", (0.62, 0.8, 0.95, 1), 0.05, 0.55))
K.obj("env_ice_lake", me, K.ROOT)

# ---------- ก้อนน้ำแข็ง 7 กอง (ตำแหน่งเดิม) — ผลึกแหลมหลายแท่ง ----------
def chunk(seed):
    m = K.mb(); r = random.Random(seed)
    for k in range(7):
        a = r.uniform(0, 6.3); d = r.uniform(0, 0.6); h = r.uniform(1.4, 3.2)
        b = V((math.cos(a) * d, math.sin(a) * d, -0.2)); t = b + V((r.uniform(-0.5, 0.5), r.uniform(-0.5, 0.5), h))
        m.cyl(b, t, r.uniform(0.35, 0.6), 0.02, CRY if k % 2 else CRY2, 5)
    m.ico((0, 0, 0.1), 0.9, ICE, sc=(1.2, 1.2, 0.5), sub=1, jit=0.2, seed=seed)
    return m.mesh("lake_chunk%d" % seed)


chunks = [chunk(s) for s in range(3)]
for i, (fx, fy, r) in enumerate(((.32, .3, 46), (.68, .7, 46), (.5, .5, 38), (.22, .62, 30), (.78, .38, 30), (.5, .18, 26), (.5, .82, 26))):
    x, y = K.sp(fx, fy); rr = r / 20
    if i == 2:                                                                           # เกาะกลาง: ต้นไม้ตายแข็ง + ผลึก
        m = K.mb(); m.cyl((0, 0, 0), (0, 0, 3.5), 0.4, 0.2, BARK, 6)
        for a, l in ((0.4, 1.8), (2.3, 1.6), (4.1, 2.0), (5.3, 1.2)):
            m.cyl((0, 0, 2.6), (math.cos(a) * l, math.sin(a) * l, 4.2), 0.14, 0.03, BARK, 4)
            m.ico((math.cos(a) * l, math.sin(a) * l, 4.25), 0.18, FROST, sub=0)
        for k in range(5):
            a = k / 5 * math.tau; m.cyl((math.cos(a) * 1.6, math.sin(a) * 1.6, 0), (math.cos(a) * 2.0, math.sin(a) * 2.0, 2.2), 0.4, 0.02, CRY, 5)
        K.place("lake_island", m.mesh("lake_island"), x, y)
        K.col_cyl(x, y, rr, 2.4)
        K.light("island", x, y, 2.5, (0.5, 0.85, 1.0), 150)
        continue
    K.place("lake_chunk_%d" % i, chunks[i % 3], x, y, K.R.uniform(0, 6), rr / 1.0)
    K.col_cyl(x, y, rr, 2.4)

# ---------- ชายฝั่ง: ต้นสนหิมะ หิน ผลึกเรืองแสง ----------
pine = mesh_pine(K, BARK, PINE, snow=SNOW, h=1.4, name="lake_pine")
pine2 = mesh_pine(K, BARK, PINE2, snow=SNOW, h=1.8, name="lake_pine_tall")
rocks = [mesh_rock(K, ROCK if i % 2 else ROCK2, i + 30, name="lake_rock%d" % i) for i in range(3)]
for x, y in K.scatter(40, 6, lambda x, y: lake(x, y) > 1.25):
    s = K.R.uniform(0.85, 1.25)
    if K.R.random() < 0.25: K.place("lake_rock", rocks[int(x) % 3], x, y, K.R.uniform(0, 6), 1.6 * s, dz=-0.2); K.col_cyl(x, y, 1.3 * s, 1.6)
    else: K.place("lake_tree", pine2 if K.R.random() < 0.5 else pine, x, y, K.R.uniform(0, 6), s); K.col_cyl(x, y, 0.8 * s, 9)
m = K.mb(); m.cyl((0, 0, 0), (0.2, 0.1, 1.6), 0.3, 0.02, GLOW, 5); m.cyl((0.3, 0, 0), (0.6, -0.2, 1.0), 0.2, 0.02, GLOW, 5); m.cyl((-0.25, 0.1, 0), (-0.5, 0.3, 1.2), 0.22, 0.02, CRY, 5)
gl = m.mesh("lake_glowcrystal")
for i, (x, y) in enumerate(((-62, 30), (62, -30), (-64, -26), (64, 28), (0, 44), (0, -44))):
    K.place("lake_glow_%d" % i, gl, x, y, K.R.uniform(0, 6), 1.4)
    K.light("crystal_%d" % i, x, y, 1.5, (0.4, 0.85, 1.0), 110)
m = K.mb(); m.ico((0, 0, 0), 0.8, SNOW, sc=(1.4, 1, 0.45), sub=1); drift = m.mesh("lake_drift")
for x, y in K.scatter(50, 4, lambda x, y: lake(x, y) > 1.15):
    K.place("lake_drift", drift, x, y, K.R.uniform(0, 6), K.R.uniform(0.6, 1.6), K.NOSH)
for i in range(90):
    a = K.R.uniform(0, math.tau); x = math.cos(a) * K.R.uniform(80, 100); y = math.sin(a) * K.R.uniform(55, 72)
    K.obj("lake_far_pine", pine2, K.FAR, (x, y, height(x, y)), K.R.uniform(0, 6), K.R.uniform(1.1, 1.7))
m = K.mb()
for i in range(16):
    a = i / 16 * math.tau; r = K.R.uniform(200, 250); h = K.R.uniform(50, 100)
    m.cyl((math.cos(a) * r, math.sin(a) * r, -2), (math.cos(a) * r, math.sin(a) * r, h), K.R.uniform(50, 80), 1, NIGHT, 7)
    m.cyl((math.cos(a) * r, math.sin(a) * r, h * 0.7), (math.cos(a) * r, math.sin(a) * r, h + 0.5), K.R.uniform(16, 24), 1, SNOW2, 7)
K.obj("lake_far", m.mesh("lake_far"), K.FAR)

K.finish(name="🧊 ทะเลสาบน้ำแข็ง", desc="ลานน้ำแข็งกว้างใต้แสงจันทร์ เกาะหินกลางทะเลสาบ ก้อนผลึกน้ำแข็งให้หลบ ชายฝั่งป่าสนหิมะ",
         sky="night", fog="#1a2a44,80,320", random=1, weather="snow:45,clear:35,fog:20", music="forest", fx="snow",
         modes="coop,duel,ffa,tdm,race,br,imp")
