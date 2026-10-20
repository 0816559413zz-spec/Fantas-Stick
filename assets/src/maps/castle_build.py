# castle_build.py — 🏰 ลานปราสาท (castle) 80 × 50 กลางคืน: ลานหินกลางกำแพงปราสาท ระเบียงยกสูงเหนือ/ใต้ เสา 4 ต้น รูปปั้นกลางลาน
# รัน: D:\Blender\blender.exe -b --factory-startup --python assets/src/maps/castle_build.py
# ตำแหน่งที่กำบังเหมือนแผนที่จากโค้ดเดิม (PILLARS ใน js/02-data.js) — แทนที่ด้วยไฟล์ (id ซ้ำ = แทนของเดิม)
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _mapkit import *

PAL = {0: 0x8a8478, 1: 0x77726a, 2: 0x5e5a55, 3: 0x6c675f, 4: 0x4a5a3a, 5: 0x6a4a2a, 6: 0x3a4050, 7: 0x2e2e34,
       8: 0x8a1f1f, 9: 0x1f5a35, 10: 0x1f3a7a, 11: 0xc9a227, 12: 0x3a7aa0, 13: 0xffc36b, 14: 0xff8a2a, 15: 0x9a7aff}
K = Kit("castle", 40, 25, PAL, emit=(13, 14, 15), gx=48, gy=33, seed=7)
STONE, STONE2, DARK, PAVE, MOSS, WOOD, SLATE, IRON, GLOW, FIRE, MAGIC = 0, 1, 2, 3, 4, 5, 6, 7, 13, 14, 15
BAN = (8, 9, 10, 11)


def height(x, y):
    t = 1.6 * smooth(19.0, 21.0, abs(y)) * (1 - smooth(27, 29, abs(x)))       # ระเบียงยกสูงเหนือ/ใต้ (ลาดขึ้นได้ทั้งแนว)
    return t


def color(x, y, z, sl):
    if sl > 25: return STONE2
    if abs(x) > 40.5 or abs(y) > 25.5: return DARK
    if z > 1.2: return STONE if (int(x // 2) + int(y // 2)) % 2 else STONE2
    r = math.hypot(x, y)
    if 4.2 < r < 5.0 or 9.0 < r < 9.6: return DARK                                  # วงหินรอบรูปปั้น
    if K.R.random() < 0.04: return MOSS
    return PAVE if (int((x + 100) // 2) + int((y + 100) // 2)) % 2 else STONE2


K.ground(height, color)
K.bounds()
K.std_spawns()

# ---------- กำแพงปราสาทรอบลาน + หอคอยมุม (นอกขอบเขต) ----------
m = K.mb()
WX, WY, WH = 41.5, 26.5, 9.0
for sx in (-1, 1):
    m.box((sx * WX, 0, WH / 2), (2.0, 2 * WY + 2, WH), STONE2)
    for k in range(-12, 13):
        m.box((sx * WX, k * 2.1, WH + 0.5), (2.2, 1.0, 1.0), STONE2)                 # ใบเสมา
for sy in (-1, 1):
    m.box((0, sy * WY, WH / 2), (2 * WX + 2, 2.0, WH), STONE2)
    for k in range(-19, 20):
        m.box((k * 2.1, sy * WY, WH + 0.5), (1.0, 2.2, 1.0), STONE2)
for sx in (-1, 1):                                                                   # ประตูโค้งใหญ่ตะวันออก/ตะวันตก (ปิดด้วยประตูไม้)
    m.box((sx * (WX - 1.05), 0, 3.0), (0.1, 6.0, 6.0), WOOD)
    m.cyl((sx * (WX - 1.1), -3.2, 0), (sx * (WX - 1.1), -3.2, 7.0), 0.6, 0.6, STONE, 8)
    m.cyl((sx * (WX - 1.1), 3.2, 0), (sx * (WX - 1.1), 3.2, 7.0), 0.6, 0.6, STONE, 8)
    m.box((sx * (WX - 1.1), 0, 7.2), (1.4, 7.6, 1.0), STONE)
for x in range(-36, 37, 8):                                                          # หน้าต่างเรืองแสงบนกำแพงเหนือ/ใต้
    for sy in (-1, 1):
        m.box((x, sy * (WY - 1.02), 6.0), (1.0, 0.06, 1.8), GLOW)
for sx, sy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
    cx, cy = sx * (WX + 1), sy * (WY + 1)
    m.cyl((cx, cy, 0), (cx, cy, 15), 4.2, 4.0, STONE, 14)
    m.cyl((cx, cy, 15), (cx, cy, 16), 4.6, 4.6, STONE2, 14)
    m.cyl((cx, cy, 16), (cx, cy, 23), 4.8, 0.2, SLATE, 14)
    for a in range(4):
        aa = a * math.pi / 2 + math.pi / 4
        m.box((cx + math.cos(aa) * 4.15, cy + math.sin(aa) * 4.15, 10), (0.08, 0.8, 1.6), GLOW, rz=aa)
K.obj("castle_walls", m.mesh("castle_walls"))
for sx in (-1, 1):
    K.col_box(sx * (WX - 0.3), 0, 1.2, 2 * WY, WH)
for sy in (-1, 1):
    K.col_box(0, sy * (WY - 0.3), 2 * WX, 1.2, WH)

# ---------- ธงประจำบ้านบนกำแพง ----------
m = K.mb()
for i, x in enumerate((-30, -10, 10, 30)):
    for sy in (-1, 1):
        y = sy * (WY - 1.1)
        m.box((x, y, 5.6), (2.2, 0.08, 4.4), BAN[i % 4])
        m.box((x, y - sy * 0.02, 3.3), (2.2, 0.1, 0.3), 11)
        m.box((x, y, 7.9), (2.8, 0.25, 0.2), WOOD)
K.obj("castle_banners", m.mesh("castle_banners"))

# ---------- เสา 4 ต้น (ตำแหน่งเดิม r 2.25 สูง 9.5) ----------
col_mesh = K.mb()
col_mesh.cyl((0, 0, 0), (0, 0, 0.6), 2.6, 2.6, STONE2, 12)
col_mesh.cyl((0, 0, 0.6), (0, 0, 8.6), 1.9, 1.7, STONE, 12)
for k in range(12):
    a = k / 12 * math.tau
    col_mesh.box((math.cos(a) * 1.75, math.sin(a) * 1.75, 4.6), (0.18, 0.18, 7.8), STONE2, rz=a)
col_mesh.cyl((0, 0, 8.6), (0, 0, 9.5), 2.1, 2.5, STONE2, 12)
col_mesh.box((0, 0, 9.7), (5.0, 5.0, 0.4), STONE)
cm = col_mesh.mesh("castle_column")
for i, (x, y) in enumerate(((-20, 10), (20, 10), (-20, -10), (20, -10))):
    K.place("castle_column_%d" % i, cm, x, y)
    K.col_cyl(x, y, 2.25, 9.5)

# ---------- รูปปั้นพ่อมดกลางลาน (r 3.5 กำบัง) ----------
m = K.mb()
m.cyl((0, 0, 0), (0, 0, 0.9), 4.0, 4.0, STONE2, 20)
m.cyl((0, 0, 0.9), (0, 0, 1.0), 3.6, 3.6, 12, 20)                                    # น้ำ
m.cyl((0, 0, 0.9), (0, 0, 2.6), 1.6, 1.4, STONE, 10)
m.cyl((0, 0, 2.6), (0, 0, 6.0), 1.0, 0.45, STONE2, 10)                               # เสื้อคลุม
m.ico((0, 0, 6.4), 0.5, STONE2, sub=2)
m.cyl((0, 0, 6.6), (0, 0, 7.8), 0.55, 0.05, STONE2, 8)                               # หมวก
m.cyl((0.6, -0.3, 5.2), (1.4, -0.9, 6.9), 0.12, 0.06, STONE2, 6)                    # แขนชูไม้
m.ico((1.45, -0.95, 7.0), 0.28, MAGIC, sub=1)
K.obj("castle_statue", m.mesh("castle_statue"))
K.col_cyl(0, 0, 3.5, 6.0)
K.light("statue", 1.4, -0.9, 7.0, (0.7, 0.55, 1.0), 160)

# ---------- เตาไฟ 2 จุด (ตำแหน่งเสาเล็กเดิม r 1.5) ----------
m = K.mb()
m.cyl((0, 0, 0), (0, 0, 0.3), 1.4, 1.4, STONE2, 10)
m.cyl((0, 0, 0.3), (0, 0, 2.0), 0.6, 0.45, STONE, 8)
m.cyl((0, 0, 2.0), (0, 0, 2.6), 0.7, 1.3, IRON, 10)
m.ico((0, 0, 2.7), 0.8, FIRE, sc=(1, 1, 0.8), sub=1, jit=0.25, seed=3)
br = m.mesh("castle_brazier")
for i, y in enumerate((15, -15)):
    K.place("castle_brazier_%d" % i, br, 0, y)
    K.col_cyl(0, y, 1.5, 2.6)
    K.light("brazier_%d" % i, 0, y, 3.4, (1, 0.6, 0.3), 200)

# ---------- คบไฟบนกำแพง ----------
m = K.mb()
m.box((0, 0, 0), (0.3, 0.3, 0.6), IRON)
m.cyl((0, 0, -0.6), (0, 0.5, 0.2), 0.08, 0.1, WOOD, 6)
m.ico((0, 0.55, 0.45), 0.32, FIRE, sc=(1, 1, 1.5), sub=1)
tm = m.mesh("castle_torch")
TORCH = [(-36, 1), (36, 1), (-36, -1), (36, -1), (-20, 1), (20, 1), (-20, -1), (20, -1)]
for i, (x, sy) in enumerate(TORCH):
    K.obj("castle_torch_%d" % i, tm, None, (x, sy * (WY - 1.2), 4.6), 0 if sy < 0 else math.pi)
for i, (x, sy) in enumerate(TORCH[:4] + [(0, 1), (0, -1)]):
    K.light("torch_%d" % i, x, sy * (WY - 2.2), 4.4, (1, 0.62, 0.32), 130)

# ---------- ระเบียง: ราวหินริมขอบ + ม้านั่ง + รูปปั้นการ์กอยล์ ----------
m = K.mb()
for sy in (-1, 1):
    for x in range(-26, 27, 4):
        m.box((x, sy * 19.0, 1.0), (0.4, 0.4, 1.2), STONE)
K.obj("castle_rail_posts", m.mesh("castle_rail_posts"))
m = K.mb()
m.box((0, 0, 0.45), (2.4, 0.7, 0.12), STONE)
for dx in (-0.9, 0.9): m.box((dx, 0, 0.2), (0.3, 0.6, 0.4), STONE2)
bench = m.mesh("castle_bench")
for i, (x, y) in enumerate(((-12, 23.2), (12, 23.2), (-12, -23.2), (12, -23.2), (-32, 6), (32, -6))):
    K.place("castle_bench_%d" % i, bench, x, y, 0 if abs(y) > 20 else math.pi / 2)
m = K.mb()
m.box((0, 0, 0.6), (1.3, 1.3, 1.2), STONE2)
m.ico((0, 0, 1.75), 0.55, DARK, sc=(0.9, 1.1, 1.0), sub=1)
for s in (-1, 1): m.cyl((s * 0.35, 0.1, 1.6), (s * 1.1, 0.35, 2.4), 0.25, 0.04, DARK, 4)   # ปีก
gm = m.mesh("castle_gargoyle")
for i, (x, y) in enumerate(((-26, 22.5), (26, 22.5), (-26, -22.5), (26, -22.5))):
    K.place("castle_gargoyle_%d" % i, gm, x, y, face_dir(x, y, 0, 0) + math.pi)
    K.col_cyl(x, y, 0.9, 2.4)

# ---------- ฉากหลังไกล: หอคอยปราสาทเงาๆ + ภูเขา ----------
m = K.mb()
for i in range(14):
    a = i / 14 * math.tau + 0.3
    r = K.R.uniform(120, 170); h = K.R.uniform(30, 60)
    m.cyl((math.cos(a) * r, math.sin(a) * r, -2), (math.cos(a) * r, math.sin(a) * r, h), K.R.uniform(20, 34), 1.0, DARK, 7)
for x, y, r, h in ((-18, 48, 4, 34), (8, 52, 5, 42), (30, 46, 3.5, 28), (-40, 44, 3, 24)):
    m.cyl((x, y, 0), (x, y, h), r, r, SLATE, 10)
    m.cyl((x, y, h), (x, y, h + r * 2.4), r * 1.3, 0.1, SLATE, 10)
    m.box((x, y - r, h * 0.7), (0.6, 0.1, 1.0), GLOW)
K.obj("castle_far", m.mesh("castle_far"), K.FAR)

K.finish(name="🏰 ลานปราสาท", desc="ลานหินกลางปราสาทยามค่ำคืน ระเบียงสูงเหนือใต้ เสาใหญ่ 4 ต้น รูปปั้นพ่อมดกลางลาน",
         sky="night", fog="#141a33,80,300", random=1, weather="clear:60,fog:25,rain:15", music="castle",
         fx="rune:#b58cff:19,candles:60:10:15", modes="coop,duel,ffa,tdm,race,br,imp")
