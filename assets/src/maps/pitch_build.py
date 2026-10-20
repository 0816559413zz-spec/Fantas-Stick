# pitch_build.py — 🏟️ สนามควิดดิช (pitch) 150 × 90 ยามเย็น: สนามหญ้าวงรี เส้นสนาม ห่วงประตูทองฝั่งละ 3 อัฒจันทร์หอคอยรอบสนาม
# รัน: D:\Blender\blender.exe -b --factory-startup --python assets/src/maps/pitch_build.py
# ห่วง = col_ ที่มี custom property k="hoop" + ring (ความสูงห่วง) ตำแหน่ง/ความสูงตาม genPitch() เดิม (โหมดควิดดิชใช้คิดประตู)
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _mapkit import *

PAL = {0: 0x4f8a38, 1: 0x5a9a40, 2: 0x467c32, 3: 0xe8e4d8, 4: 0xb8a57a, 5: 0x8a6a44, 6: 0x7a5230, 7: 0x4e3420,
       8: 0x9a1f1f, 9: 0x1f6a3a, 10: 0x1f3f8a, 11: 0xd9a727, 12: 0xe8c060, 13: 0xc9b06a, 14: 0x7c7a74, 15: 0xffe9a0}
K = Kit("pitch", 75, 45, PAL, emit=(15,), gx=110, gy=80, seed=3)
G1, G2, G3, CHALK, SAND, DIRT, WOOD, DWOOD, RED, GRN, BLU, YEL, GOLD, HAY, STONE, LAMP = range(16)
EX, EY = 70.0, 41.0                       # วงรีสนาม


def ell(x, y): return (x / EX) ** 2 + (y / EY) ** 2


def height(x, y):
    e = ell(x, y)
    return 0.0 if e < 1.12 else 0.6 * smooth(1.12, 1.5, e)                         # ขอบสนามยกเป็นคันดินเล็กน้อย


def color(x, y, z, sl):
    e = ell(x, y)
    if 1.0 < e < 1.12: return SAND
    if e >= 1.12: return DIRT if K.R.random() < 0.12 else (G3 if K.R.random() < 0.6 else G2)
    r = math.hypot(x, y)
    if abs(r - 9) < 0.35 or abs(x) < 0.3 and abs(y) < 41 or abs(abs(x) - 52) < 0.35 and abs(y) < 22: return CHALK   # เส้นสนาม
    return G1 if int((x + 200) // 6) % 2 else G2                                      # ลายตัดหญ้า


K.ground(height, color)
K.bounds()
K.std_spawns(team_dx=0.1)

# ---------- ห่วงประตู 3 ห่วงต่อฝั่ง (เดิม: x = 7% / 93% ของความกว้าง, dy −160/0/+160 px, ring 13/17/15) ----------
m = K.mb()
for fx in (0.07, 0.93):
    x = -75 + 150 * fx
    for dy, h in ((-160, 13), (0, 17), (160, 15)):
        y = -dy / 20.0
        m.cyl((x, y, 0), (x, y, h - 1.6), 0.28, 0.2, GOLD, 8)
        m.cyl((x, y, 0), (x, y, 0.5), 0.8, 0.8, STONE, 8)
        torus(m, (x, y, h), 1.6, 0.16, GOLD, axis='X', n=20)
        K.col_cyl(x, y, 0.6, h + 1.6, k="hoop", ring=float(h))
    for dy in (-11, 11):                                                               # แท่นเสาประดับข้างประตู
        m.cyl((x, dy, 0), (x, dy, 4), 0.5, 0.4, STONE, 8)
        m.ico((x, dy, 4.4), 0.5, GOLD, sub=1)
K.obj("pitch_hoops", m.mesh("pitch_hoops"))

# ---------- ลังไม้ 10 กอง + ฟาง 4 ก้อน (ที่กำบังเดิม) ----------
m = K.mb()
m.box((0, 0, 0.75), (2.4, 2.4, 1.5), WOOD); m.box((0.3, -0.2, 2.05), (1.6, 1.6, 1.1), DWOOD)
for z in (0.05, 1.45): m.box((0, 0, z), (2.5, 2.5, 0.12), DWOOD)
crate = m.mesh("pitch_crates")
for i, (fx, fy) in enumerate(((.25, .3), (.25, .7), (.75, .3), (.75, .7), (.38, .5), (.62, .5), (.5, .24), (.5, .76), (.19, .5), (.81, .5))):
    x, y = K.sp(fx, fy); K.place("pitch_crate_%d" % i, crate, x, y, i * 0.7); K.col_cyl(x, y, 2.0, 2.6)
m = K.mb(); m.cyl((-1.2, 0, 0.9), (1.2, 0, 0.9), 0.95, 0.95, HAY, 12)
for dx in (-0.6, 0.6): m.cyl((dx, 0, 0.9), (dx + 0.1, 0, 0.9), 0.98, 0.98, DWOOD, 12)
hay = m.mesh("pitch_hay")
for i, (fx, fy) in enumerate(((.35, .14), (.65, .86), (.35, .86), (.65, .14))):
    x, y = K.sp(fx, fy); K.place("pitch_hay_%d" % i, hay, x, y, i * 1.3); K.col_cyl(x, y, 1.7, 2.0)

# ---------- อัฒจันทร์หอคอยรอบสนาม (นอกขอบเขต) ผ้าสีบ้าน ----------
m = K.mb()
m.box((0, 0, 5), (6, 6, 10), WOOD)
for z in (3.2, 6.6): m.box((0, -3.05, z), (6.1, 0.1, 0.25), DWOOD)
m.box((0, 0, 10.2), (7, 7, 0.4), DWOOD)
for sx in (-1, 1):
    for sy in (-1, 1): m.cyl((sx * 3.2, sy * 3.2, 10.4), (sx * 3.2, sy * 3.2, 12.4), 0.15, 0.15, DWOOD, 6)
m.box((0, 0, 12.6), (7.2, 7.2, 0.3), DWOOD)
m.cyl((0, 0, 12.75), (0, 0, 16.5), 5.1, 0.1, DWOOD, 4)
tower_core = m.mesh("pitch_tower")
drapes = []
for c in (RED, GRN, BLU, YEL):
    m = K.mb()
    m.box((0, -3.08, 6), (5.6, 0.06, 7.5), c)
    m.box((0, -3.1, 2.1), (5.6, 0.08, 0.4), GOLD)
    m.cyl((0, 0, 16.5), (0, 0, 19), 0.06, 0.06, DWOOD, 4); m.box((0.7, 0, 18.5), (1.4, 0.04, 0.8), c)
    drapes.append(m.mesh("pitch_drape_%d" % c))
n = 18
for i in range(n):
    a = i / n * math.tau
    x, y = math.cos(a) * (EX + 13), math.sin(a) * (EY + 11)
    rz = face_dir(x, y, 0, 0)
    K.obj("pitch_tower_%d" % i, tower_core, K.FAR, (x, y, height(x, y)), rz)
    K.obj("pitch_drape_%d" % i, drapes[i % 4], K.FAR, (x, y, height(x, y)), rz)
# ม้านั่งยาวระหว่างหอคอย
m = K.mb()
for k in range(4): m.box((0, k * 1.0, 0.5 + k * 0.8), (10, 1.0, 0.2), WOOD)
for x in (-4.5, 0, 4.5): m.box((x, 1.5, 1.4), (0.3, 3.2, 2.8), DWOOD)
stand = m.mesh("pitch_stand")
for i in range(n):
    a = (i + 0.5) / n * math.tau
    x, y = math.cos(a) * (EX + 12), math.sin(a) * (EY + 10)
    K.obj("pitch_stand_%d" % i, stand, K.FAR, (x, y, height(x, y)), face_dir(x, y, 0, 0))
# ไฟหัวเสารอบสนาม (เรืองแสง)
m = K.mb(); m.cyl((0, 0, 0), (0, 0, 6), 0.12, 0.1, DWOOD, 6); m.ico((0, 0, 6.3), 0.4, LAMP, sub=1)
lamp = m.mesh("pitch_lamp")
for i in range(24):
    a = i / 24 * math.tau
    x, y = math.cos(a) * EX * 1.07, math.sin(a) * EY * 1.08
    K.place("pitch_lamp", lamp, x, y)
# ภูเขา + ปราสาทไกลๆ
m = K.mb()
for i in range(16):
    a = i / 16 * math.tau + 0.2; r = K.R.uniform(190, 240); h = K.R.uniform(40, 90)
    m.cyl((math.cos(a) * r, math.sin(a) * r, -2), (math.cos(a) * r, math.sin(a) * r, h), K.R.uniform(50, 80), 1, G3, 7)
for x, y, r, h in ((-30, 150, 6, 50), (-10, 160, 8, 64), (12, 155, 5, 44)):
    m.cyl((x, y, 0), (x, y, h), r, r, STONE, 10); m.cyl((x, y, h), (x, y, h + r * 2.4), r * 1.3, 0.1, DWOOD, 10)
K.obj("pitch_far", m.mesh("pitch_far"), K.FAR)
tuft = mesh_tuft(K, (G1, G2, G3), name="pitch_tuft")
for x, y in K.scatter(140, 2, lambda x, y: ell(x, y) > 1.02, tries=8000):
    K.place("pitch_tuft", tuft, x, y, K.R.uniform(0, 6), 1.3, K.NOSH)

K.finish(name="🏟️ สนามควิดดิช", desc="สนามกว้างยามเย็น ห่วงทองฝั่งละ 3 อัฒจันทร์หอคอยสีบ้านรอบสนาม เหมาะกับบินไม้กวาด",
         sky="sunset", fog="#d8a888,140,560", random=1, weather="clear:60,wind:25,rain:15", music="pitch", fx="snitch",
         modes="quid,coop,duel,ffa,tdm,race,br,imp")
