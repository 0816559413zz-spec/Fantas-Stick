# greathall_build.py — 🕯️ ห้องโถงใหญ่ (greathall) 120 × 75 ในอาคาร: โต๊ะยาว 4 บ้าน โต๊ะอาจารย์บนแท่นยก เสา 2 ต้น หน้าต่างสูง เทียนลอย เพดานเวทมนตร์ (เห็นฟ้า)
# รัน: D:\Blender\blender.exe -b --factory-startup --python assets/src/maps/greathall_build.py
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _mapkit import *

PAL = {0: 0x6c675f, 1: 0x5e5a55, 2: 0x8a8478, 3: 0x4a453f, 4: 0x6a4a2a, 5: 0x4e3420, 6: 0x8a1f1f, 7: 0x1f5a35,
       8: 0x1f3a7a, 9: 0xc9a227, 10: 0x7a1a20, 11: 0xe8c060, 12: 0x2e2e34, 13: 0x4a62a0, 14: 0xff9a40, 15: 0xffd890}
K = Kit("greathall", 60, 37.5, PAL, emit=(13, 14, 15), gx=66, gy=44, seed=909)
FL, FL2, ST, DK, WOOD, DWOOD, RED, GRN, BLU, YEL, CARPET, GOLD, IRON, WIN, FIRE, CANDLE = range(16)
HC = (RED, GRN, BLU, YEL)
TY = [37.5 - y / 20 for y in (330, 560, 940, 1170)]                                   # แนวโต๊ะเดิม (y px → blender)
TX0, TX1 = 440 / 20 - 60, 1700 / 20 - 60                                              # −38 … 25


def height(x, y):
    return 0.9 * smooth(41.5, 44.5, x)                                                  # แท่นยกโต๊ะอาจารย์ (ลาดขึ้นได้)


def color(x, y, z, sl):
    if sl > 10: return ST
    if abs(y) < 2.2 and x < 41: return CARPET                                           # พรมกลางทางเดิน
    if z > 0.5: return WOOD if int(x * 2) % 2 else DWOOD
    return FL if (int((x + 100) // 2.5) + int((y + 100) // 2.5)) % 2 else FL2


K.ground(height, color)
K.bounds()
K.std_spawns(team_dy=3)

# ---------- ผนังรอบห้อง หน้าต่างโค้งสูง ค้ำยัน ----------
WH = 17
m = K.mb()
for sy in (-1, 1):
    m.box((0, sy * 38.6, WH / 2), (124, 2.2, WH), ST)
    for x in range(-54, 55, 9):
        m.box((x, sy * 37.45, 9.5), (3.0, 0.08, 9.0), WIN)                              # หน้าต่างเรืองแสงจันทร์
        m.cyl((x - 1.5, sy * 37.42, 14.0), (x + 1.5, sy * 37.42, 14.0), 1.5, 1.5, WIN, 8)
        m.box((x + 4.5, sy * 37.0, WH / 2), (1.2, 1.2, WH), FL2)                        # ค้ำยัน
for sx in (-1, 1):
    m.box((sx * 61.1, 0, WH / 2), (2.2, 79, WH), ST)
m.box((61.05 - 1.15, 0, 12), (0.1, 16, 9), WIN)                                       # หน้าต่างกุหลาบหลังโต๊ะอาจารย์
for sy in (-1, 1): m.box((0, sy * 37.4, WH), (124, 1.0, 0.8), FL2)
# เตาผิงใหญ่ผนังตะวันตก
m.box((-59.6, 0, 3), (1.6, 9, 6), DK); m.box((-59.0, 0, 1.6), (0.4, 5, 3.2), FIRE); m.box((-59.5, 0, 6.3), (2.4, 10, 0.6), ST)
K.obj("hall_walls", m.mesh("hall_walls"))
for sy in (-1, 1): K.col_box(0, sy * 38.0, 122, 1.4, WH)
for sx in (-1, 1): K.col_box(sx * 60.6, 0, 1.4, 77, WH)
K.light("fire", -57.5, 0, 2.0, (1, 0.55, 0.25), 260)

# ---------- โต๊ะยาว 4 บ้าน + ม้านั่ง + ธงบ้าน ----------
L = TX1 - TX0 + 3
for i, y in enumerate(TY):
    cx = (TX0 + TX1) / 2
    m = K.mb()
    m.box((cx, y, 0.85), (L, 2.6, 0.18), WOOD)
    for x in range(int(TX0), int(TX1) + 1, 6):
        m.box((x, y, 0.4), (0.3, 2.2, 0.8), DWOOD)
    for sy in (-1, 1): m.box((cx, y + sy * 1.9, 0.48), (L, 0.6, 0.12), DWOOD)
    for x in range(int(TX0) + 1, int(TX1), 3):                                          # จาน/ถ้วยทอง
        for sy in (-0.7, 0.7): m.cyl((x, y + sy, 0.94), (x, y + sy, 0.99), 0.28, 0.28, GOLD, 8)
    m.box((cx, y, 0.95), (L - 2, 0.5, 0.02), HC[i])                                     # ผ้าคาดโต๊ะสีบ้าน
    K.obj("hall_table_%d" % i, m.mesh("hall_table_%d" % i))
    K.col_box(cx, y, L, 3.2, 1.8)
    m = K.mb()                                                                          # ธงห้อยเหนือโต๊ะ
    for x in (-30, -12, 6, 22):
        m.box((x, y, 10.5), (2.4, 0.06, 5.0), HC[i]); m.box((x, y, 8.0), (2.4, 0.08, 0.3), GOLD); m.cyl((x - 1.4, y, 13.1), (x + 1.4, y, 13.1), 0.06, 0.06, GOLD, 4)
    K.obj("hall_banners_%d" % i, m.mesh("hall_banners_%d" % i))

# ---------- แท่น + โต๊ะอาจารย์ + เก้าอี้ใหญ่ ----------
m = K.mb()
m.box((48, 0, 0.9 + 0.85), (3.0, 18.5, 0.18), WOOD)
for y in range(-8, 9, 4): m.box((48, y, 0.9 + 0.4), (2.4, 0.3, 0.8), DWOOD)
m.box((47.9, 0, 0.9 + 0.5), (2.9, 18.4, 0.9), RED)                                    # ผ้าหน้าโต๊ะ
for y in range(-8, 9, 2):
    m.box((50.6, y, 0.9 + 1.2), (0.8, 1.0, 2.4), DWOOD)
m.box((50.6, 0, 0.9 + 2.0), (1.0, 1.6, 4.0), GOLD)                                    # เก้าอี้ผู้อำนวยการ
K.obj("hall_teacher", m.mesh("hall_teacher"))
K.col_box(48, 0, 3.4, 18.6, 1.8, z0=0.9)
m = K.mb()
for i, y in enumerate((-30, -26, 26, 30)):
    m.cyl((54, y, 0.9), (54, y, 1.4), 1.0, 1.0, GOLD, 8)
    m.cyl((54, y, 1.4), (54, y, 5.2), 0.55, 0.55, WIN, 8)
    m.ico((54, y, 3.3), 0.45, HC[i], sub=1)
    m.cyl((54, y, 5.2), (54, y, 5.7), 1.0, 1.0, GOLD, 8)
K.obj("hall_hourglass", m.mesh("hall_hourglass"))
for y in (-28, 28): K.col_box(54, y, 2.2, 6.2, 5.7, z0=0.9)

# ---------- เสาหินใหญ่ 2 ต้น (ตำแหน่งเดิม r 2.5 สูง 14) ----------
m = K.mb()
m.cyl((0, 0, 0), (0, 0, 0.8), 3.0, 3.0, FL2, 12); m.cyl((0, 0, 0.8), (0, 0, 13), 2.3, 2.1, ST, 12)
m.cyl((0, 0, 13), (0, 0, 14.2), 2.4, 3.0, FL2, 12)
col = m.mesh("hall_pillar")
for i, (x, y) in enumerate(((850 / 20 - 60, 37.5 - 750 / 20), (1650 / 20 - 60, 37.5 - 750 / 20))):
    K.place("hall_pillar_%d" % i, col, x, y); K.col_cyl(x, y, 2.5, 14)

# ---------- เชิงเทียนตั้งพื้น (ไฟ) ----------
m = K.mb(); m.cyl((0, 0, 0), (0, 0, 0.3), 0.6, 0.6, IRON, 8); m.cyl((0, 0, 0.3), (0, 0, 3.6), 0.1, 0.1, IRON, 6)
m.cyl((0, 0, 3.6), (0, 0, 3.9), 0.7, 0.3, IRON, 8); m.ico((0, 0, 4.1), 0.35, FIRE, sc=(1, 1, 1.4), sub=1)
cand = m.mesh("hall_candelabra")
for i, (x, y) in enumerate(((-46, 15), (-46, -15), (34, 15), (34, -15), (-8, 30), (-8, -30))):
    K.place("hall_candle_%d" % i, cand, x, y); K.col_cyl(x, y, 0.6, 3.9)
    if i < 4: K.light("cand_%d" % i, x, y, 4.2, (1, 0.7, 0.4), 140)
K.light("teacher", 48, 0, 4.5, (1, 0.8, 0.55), 160)

K.finish(name="🕯️ ห้องโถงใหญ่", desc="โต๊ะยาวสี่บ้าน โต๊ะอาจารย์บนแท่นยก เทียนลอยใต้เพดานเวทมนตร์ หน้าต่างสูงแสงจันทร์",
         sky="night", fog="#1a1830,90,320", random=1, weather="clear:100", music="castle", fx="candles:130:8:14",
         modes="coop,duel,ffa,tdm,br,imp")
