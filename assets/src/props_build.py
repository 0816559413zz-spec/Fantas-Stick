# props_build.py — ของประกอบฉาก: ถังไม้ (ปกติ/พัง) + หีบสมบัติ (ปิด/เปิดแล้ว)  (ขนาดตาม PROPDEF ใน js/02-data.js / ASSETS.md §3)
# รัน:  D:\Blender\blender.exe -b --factory-startup --python assets/src/props_build.py
# ได้:  assets/props/barrel.glb, barrel_broken.glb, chest.glb, chest_used.glb + assets/src/props.blend
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from _kit import *

reset()
PI = math.pi
R = random.Random(3)
# palette: 0 ไม้ถัง 1 ไม้เข้ม 2 เหล็ก 3 ทอง 4 ไม้หีบ 5 ด้านในมืด 6 ไม้ถังอ่อน 7 กำมะหยี่แดง 8 ปลายไม้หัก
PAL = ['#8a5a32', '#5a3e22', '#5c5c66', '#e8c060', '#6a4422', '#24160c', '#9a6a3c', '#7a1a20', '#c8a070']
pal = mat('props_pal', img=palette('props_pal', PAL + ['#ffffff'] * (16 - len(PAL)), noise={0: 0.12, 1: 0.1, 4: 0.12, 6: 0.12, 8: 0.08}), rough=0.85)
gold = mat('props_gold', '#e8c060', rough=0.35, metal=0.8)
coin = mat('props_coin', '#ffcf5a', rough=0.3, metal=0.6, emit='#ffb030', emit_k=1.4)


def br(t):
    """รัศมีถังตามความสูง 0..1 (ป่องกลาง)"""
    return 0.6 + 0.09 * math.sin(t * PI)


HB = 1.6


def barrel(m, top=1.0, jag=False):
    n = 16
    for j in range(n):                                     # ไม้ทีละแผ่น (สลับสีนิดๆ)
        a0, a1 = j / n * math.tau, (j + 1) / n * math.tau
        tt = top if not jag else top * (0.35 + 0.65 * R.random())
        rows = []
        for i in range(9):
            t = tt * i / 8
            r = br(t)
            rows.append([V((r * math.sin(a0 + (a1 - a0) * k / 2), t * HB, r * math.cos(a0 + (a1 - a0) * k / 2))) for k in range(3)])
        rows_in = [[V((p.x * 0.93, p.y, p.z * 0.93)) for p in row] for row in rows]
        m.grid((rows, False), trs3(), pal, 0 if j % 3 else 6, recalc=False)
        m.grid(([list(reversed(r)) for r in rows_in], False), trs3(), pal, 1, recalc=False)
        top_row = [rows[-1][0], rows[-1][2], rows_in[-1][2], rows_in[-1][0]]
        m.grid(([[top_row[0], top_row[1]], [top_row[3], top_row[2]]], False), trs3(), pal, 8 if jag else 1, recalc=False)
    return n


def hoop(m, t, w=0.09):
    r = br(t)
    m.grid(lathe3([(r - 0.01, t * HB + w / 2), (r + 0.022, t * HB + w / 2), (r + 0.026, t * HB), (r + 0.022, t * HB - w / 2), (r - 0.01, t * HB - w / 2)], 20), trs3(), pal, 2, recalc=False)


def lathe3(prof, rs=16, closed=True):
    return [[V((r * math.sin(math.tau * j / rs), y, r * math.cos(math.tau * j / rs))) for j in range(rs + 1)] for r, y in prof], True


# ---------- ถังไม้ ----------
m = MB([pal])
barrel(m)
for t in (0.12, 0.3, 0.7, 0.88):
    hoop(m, t)
m.grid(lathe3([(0.0, HB - 0.06), (br(1) * 0.93, HB - 0.06)], 16), trs3(), pal, 0, recalc=False)       # ฝาบน
for k in (-1, 0, 1):
    m.box((0.02, 0.012, br(1) * 1.7 * math.cos(k * 0.5)), trs3((k * 0.2, HB - 0.055, 0)), pal, 1)        # ร่องไม้ฝา
m.grid(lathe3([(br(0) * 0.93, 0.04), (0.0, 0.04)], 16), trs3(), pal, 1, recalc=False)
o_bar = m.build('prop_barrel')

# ---------- ถังพัง: ตอถังเหลือฐาน + แผ่นไม้ร่วงรอบๆ + ห่วงเหล็กล้ม ----------
m = MB([pal])
barrel(m, top=0.32, jag=True)
hoop(m, 0.12)
m.grid(lathe3([(br(0) * 0.93, 0.04), (0.0, 0.04)], 16), trs3(), pal, 1, recalc=False)
for i in range(6):
    a = i / 6 * math.tau + R.uniform(-0.3, 0.3)
    d = R.uniform(0.9, 1.35)
    ln = R.uniform(0.55, 1.1)
    m.box((0.16, 0.035, ln), trs3((math.cos(a) * d, 0.02 + 0.02 * i, math.sin(a) * d), rot=(R.uniform(-0.15, 0.15), a + R.uniform(-0.6, 0.6), R.uniform(-0.1, 0.1))), pal, 0 if i % 2 else 6)
m.grid(g_torus(0.64, 0.03, 6, 20), trs3((1.05, 0.05, -0.45), rot=(PI / 2 + 0.06, 0, 0)), pal, 2)
o_barb = m.build('prop_barrel_broken')

# ---------- หีบสมบัติ (กว้าง 1.44 ลึก 0.99 สูงตัว 0.55 + ฝาโค้ง) หน้า = −Y ----------
CW, CD, CH = 1.44, 0.99, 0.55


def chest_body(m):
    m.box((CW, CH - 0.04, CD), trs3((0, CH / 2 + 0.02, 0)), pal, 4)
    m.box((CW - 0.1, 0.02, CD - 0.1), trs3((0, CH + 0.005, 0)), pal, 5)                    # ด้านในมืด
    for x in (-1, 1):
        m.box((0.07, CH, CD + 0.04), trs3((x * (CW / 2 - 0.02), CH / 2, 0)), gold)
    m.box((CW + 0.04, 0.06, CD + 0.04), trs3((0, 0.03, 0)), gold)
    m.box((CW + 0.04, 0.05, CD + 0.04), trs3((0, CH - 0.025, 0)), gold)
    for x in (-0.38, 0.38):
        m.box((0.05, CH - 0.1, 0.02), trs3((x, CH / 2, CD / 2 + 0.005)), pal, 1)
    m.box((0.2, 0.22, 0.04), trs3((0, CH - 0.12, CD / 2 + 0.02)), gold)                   # แผ่นกุญแจ
    m.grid(g_cyl(0.035, 0.035, 0.05, 10), trs3((0, CH - 0.14, CD / 2 + 0.045), rot=(PI / 2, 0, 0)), pal, 5)


def chest_lid(m, M):
    """ฝาโค้ง (มีความหนา) — pivot ที่บานพับด้านหลังบน (local three: +z ไปหน้า)"""
    def arc(k, th):          # k = 0..1 ตามแนวโค้ง, th = ระยะเข้าข้างใน
        a = PI * k
        return (0.28 - th) * math.sin(a), CD / 2 - (CD / 2 - th) * math.cos(a)
    N = 12
    out = [[V((-CW / 2 + CW * x / 4,) + arc(i / N, 0)) for i in range(N + 1)] for x in range(5)]
    inn = [[V((-CW / 2 + 0.03 + (CW - 0.06) * x / 4,) + arc(i / N, 0.05)) for i in range(N + 1)] for x in range(5)]
    for rows, sw, inner in ((out, 4, False), (inn, 5, True)):
        _, fs = m.grid((rows, False), M, pal, sw, recalc=False)
        for f in fs:                          # ด้านนอกหันออก / ด้านในหันเข้า (ดูจากศูนย์กลางโค้ง)
            f.normal_update()
            c = M.inverted() @ f.calc_center_median()
            n = (M.inverted().to_3x3() @ f.normal)
            if ((n.y * c.y + n.z * (c.z - CD / 2)) > 0) == inner:
                f.normal_flip()
    for x in (-1, 1):                         # ฝาข้าง (ทั้งสองหน้า)
        o = [V((x * CW / 2,) + arc(i / N, 0)) for i in range(N + 1)]
        c = [V((x * CW / 2, 0, CD / 2))] * (N + 1)
        m.grid(([c, o], False), M, pal, 4, recalc=False)
        m.grid(([o, c], False), M, pal, 4, recalc=False)
    rim = [[V((-CW / 2 + CW * x / 4, 0, z)) for x in range(5)] for z in (0, 0.05)]
    m.grid((rim, False), M, pal, 1, recalc=False)
    for x in (-1, 1):                         # แถบทองคาดฝา
        rows = [[V((x * (CW / 2 - 0.02) + d,) + arc(i / N, -0.012)) for i in range(N + 1)] for d in (-0.035, 0.035)]
        m.grid((rows, False), M, gold, recalc=False)
        m.grid(([list(r) for r in reversed(rows)], False), M, gold, recalc=False)
    m.box((0.16, 0.12, 0.05), M @ Matrix.Translation((0, 0.04, CD + 0.02)), gold)       # ตัวล็อก


LID0 = (0, CH, -CD / 2)
m = MB([pal, gold])
chest_body(m)
chest_lid(m, trs3(LID0))
o_ch = m.build('prop_chest')

m = MB([pal, gold, coin])
chest_body(m)
chest_lid(m, trs3(LID0, rot=(-1.9, 0, 0)))
for i in range(26):                                            # เหรียญทองเรืองแสงในหีบ + หล่นข้างหน้า
    inside = i < 20
    x = R.uniform(-CW / 2 + 0.15, CW / 2 - 0.15) if inside else R.uniform(-0.6, 0.6)
    z = R.uniform(-CD / 2 + 0.15, CD / 2 - 0.15) if inside else R.uniform(CD / 2 + 0.1, CD / 2 + 0.6)
    y = (CH - 0.03 + R.uniform(0, 0.12) * (1 - (abs(x) / CW + abs(z) / CD))) if inside else 0.015
    m.grid(g_cyl(0.06, 0.06, 0.018, 10), trs3((x, y, z), rot=(R.uniform(-0.5, 0.5), R.uniform(0, 3), R.uniform(-0.5, 0.5))), coin)
m.grid(g_sphere(0.09, 10, 8), trs3((0.25, CH + 0.1, -0.1)), pal, 7)                        # อัญมณีแดง
o_chu = m.build('prop_chest_used')

out = {}
for o, f in ((o_bar, 'barrel'), (o_barb, 'barrel_broken'), (o_ch, 'chest'), (o_chu, 'chest_used')):
    out[f] = (tris(o), export([o], 'assets/props/%s.glb' % f))
for i, o in enumerate((o_bar, o_barb, o_ch, o_chu)):
    o.location.x = (i - 1.5) * 2.4
save_blend('assets/src/props.blend')
print('RESULT', out)
