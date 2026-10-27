# city_kit_build.py — ชุดทดสอบเมืองลอนดอน (designs/city-bot-battle.md §7b): แผ่นผนังตึกแถวอิฐ + ของริมถนน 5 ชิ้น
# รัน:  "C:\Program Files (x86)\Steam\steamapps\common\Blender\blender.exe" -b --factory-startup --python assets/src/city_kit_build.py
# ได้:  assets/city/<ชื่อ>.glb (ชื่อใน manifest = city_<ชื่อ>) + assets/src/city_kit.blend + shots/city_kit_street.png / shots/city_kit_pieces.png
# แผ่นผนัง = กว้าง 4 ม. × สูง 1 ชั้น 3.5 ม. • origin = กลางขอบล่างของผิวนอก • ผิวนอกอยู่ที่ z=0 หันไป +z (หน้าในเกม) • ผนังหนา 0.4 ม. เข้าไปทาง −z
# วัสดุ 2 อย่างต่อชิ้น: city_pal (สีเรียบ + ไฟเรือง ตามช่อง palette) + city_brick (ลายอิฐ UV เป็นเมตร → ต่อกันไม่เห็นรอย)
# สไตล์ C: ทรงการ์ตูนนิด ๆ (ขอบหนา ของโค้งมน) สีหม่น
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from _kit import *

reset()
PI = math.pi
R = random.Random(11)
MW, MH, TH = 4.0, 3.5, 0.4          # แผ่นผนัง กว้าง/สูง/หนา

# ---- palette 4×4 (สีหม่นสไตล์ C) ----
PAL = ['#e6dfd0', '#b8b0a0', '#2a2c30', '#8e2a26',     # 0 ปูนขาว (ขอบหน้าต่าง/คิ้ว) 1 หินเทา 2 เหล็กดำ 3 แดงลอนดอน
       '#2f4a3a', '#26324a', '#6a4a32', '#d8b25a',     # 4 เขียวร้าน 5 กรมท่า 6 ไม้ 7 ทอง/เหลือง
       '#1c2230', '#ffcf86', '#cfe2f0', '#4a4e56',     # 8 กระจกมืด 9 กระจกไฟส้ม 10 ไฟขาว 11 ยาง/เทาเข้ม
       '#7a6a5a', '#b04a3a', '#f0eadc', '#141518']     # 12 กันสาดน้ำตาล 13 กันสาดแดง 14 ขาวครีม 15 ดำ
WHITE, STONE, IRON, RED, GREEN, NAVY, WOOD, GOLD, GLASS, GLASS_LIT, LIGHT, RUBBER, AWN_B, AWN_R, CREAM, BLACK = range(16)
EMIT = {GLASS_LIT: '#ffb860', LIGHT: '#fff2d0', GOLD: '#3a2a08'}


def make_pal():
    base = palette('city_pal_img', PAL)
    emi = palette('city_emit_img', [EMIT.get(i, '#000000') for i in range(16)])
    m = mat('city_pal', rough=0.82, img=base)
    nt = m.node_tree
    bs = nt.nodes.get('Principled BSDF')
    t2 = nt.nodes.new('ShaderNodeTexImage'); t2.image = emi; t2.interpolation = 'Closest'
    nt.links.new(t2.outputs['Color'], bs.inputs['Emission Color'])
    bs.inputs['Emission Strength'].default_value = 2.2
    return m


def make_brick():
    """ลายอิฐ 2×2 ม. ต่อแผ่น (128 px): อิฐการ์ตูนก้อนใหญ่ 0.5 × 0.17 ม. สีแดงน้ำตาลหม่นสลับอ่อนเข้ม ปูนสีครีมหม่น"""
    S = 128
    img = bpy.data.images.new('city_brick_img', S, S, alpha=False)
    rnd = random.Random(5)
    mort = srgb('#b9ab98')
    cols = [srgb(c) for c in ('#8a4a3a', '#7c4232', '#94553f', '#6e3c30', '#9a6048')]
    rows, per = 12, 4
    rh, bw = S / rows, S / per
    pix = [0.0] * (S * S * 4)
    shade = {}
    for y in range(S):
        r = int(y // rh)
        off = (bw / 2) if r % 2 else 0
        for x in range(S):
            xx = (x + off) % S
            b = int(xx // bw)
            gy, gx = y - r * rh, xx - b * bw
            if gy < 1.6 or gx < 1.6:
                c = mort
            else:
                k = (r, b)
                if k not in shade:
                    shade[k] = (rnd.choice(cols), rnd.uniform(0.92, 1.06))
                c0, f = shade[k]
                f *= 0.94 if gy > rh - 3 else 1.0          # ขอบล่างก้อนเข้มนิด (ดูนูน)
                c = [v * f for v in c0]
            j = (y * S + x) * 4
            pix[j:j + 4] = [c[0], c[1], c[2], 1.0]
    img.pixels = pix
    img.pack()
    m = mat('city_brick', rough=0.92, img=img)
    m.node_tree.nodes['Image Texture'].interpolation = 'Linear'
    return m


PALM = make_pal()
BRICK = make_brick()
PAL2C = ['#d8d0bc', '#b4ab96', '#22344a', '#7fa6c0',    # 0 หินพอร์ตแลนด์ 1 หินเงา 2 กระจกตึกมืด 3 กระจกตึกไฟ
         '#5a636e', '#3a4048', '#7d8590', '#4a6a8a',    # 4 โครงอลูมิเนียม 5 แผงทึบ 6 เหล็กลอนเทา 7 เหล็กลอนฟ้า
         '#9aa0a6', '#9a9890', '#6e6c66', '#d8b030',    # 8 ประตูม้วน 9 คอนกรีต 10 คอนกรีตเข้ม 11 เหลืองเตือน
         '#b02a24', '#3e6a32', '#24448a', '#2a8a4a']    # 12 แดงรถเมล์ 13 พุ่มไม้ 14 น้ำเงินรถไฟใต้ดิน 15 ไฟเขียว
P_STONE, P_STONE2, P_GLASS, P_GLASS_LIT, P_MULL, P_SPAND, P_COR, P_CORB, P_SHUT, P_CONC, P_CONC2, P_HAZ, P_BUS, P_HEDGE, P_TUBE, P_GREEN = range(16)


def make_pal2():
    base = palette('city_pal2_img', PAL2C)
    emi = palette('city_emit2_img', [{P_GLASS_LIT: '#9fd0ff', P_GREEN: '#40ff80'}.get(i, '#000000') for i in range(16)])
    m = mat('city_pal2', rough=0.6, img=base)
    nt = m.node_tree
    bs = nt.nodes.get('Principled BSDF')
    t2 = nt.nodes.new('ShaderNodeTexImage'); t2.image = emi; t2.interpolation = 'Closest'
    nt.links.new(t2.outputs['Color'], bs.inputs['Emission Color'])
    bs.inputs['Emission Strength'].default_value = 0.8
    return m


PAL2 = make_pal2()
PAINT = mat('city_paint', '#ffffff', rough=0.45, metal=0.3)
MATS = [PALM, BRICK, PAL2, PAINT]


def bx(m, x0, x1, y0, y1, z0, z1, mt=PALM, sw=STONE, rot=None):
    """กล่องจากขอบ (พิกัด three: x ขวา, y ขึ้น, z หน้า)"""
    c = ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    m.box((abs(x1 - x0), abs(y1 - y0), abs(z1 - z0)), trs3(c, rot or (0, 0, 0)), mt, sw if mt is PALM or mt is PAL2 else None)


def brick_uv(ob, scale=0.5):
    """UV ของหน้าอิฐ = พิกัดโลกเป็นเมตร × scale (ลาย 1 แผ่น = 2 ม.)"""
    me = ob.data
    bm = bmesh.new(); bm.from_mesh(me)
    uv = bm.loops.layers.uv.active
    for f in bm.faces:
        if f.material_index != 1:
            continue
        n = f.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        for l in f.loops:
            co = l.vert.co
            if ax == 2:
                l[uv].uv = (co.x * scale, co.y * scale)
            elif ax == 0:
                l[uv].uv = (co.y * scale, co.z * scale)
            else:
                l[uv].uv = (co.x * scale, co.z * scale)
    bm.to_mesh(me); bm.free()


def wall_with_hole(m, hx0, hx1, hy0, hy1, z0=-TH, z1=0.0):
    """ผนังอิฐเต็มแผ่น เว้นช่อง (hx0..hx1, hy0..hy1)"""
    bx(m, -MW / 2, MW / 2, 0, hy0, z0, z1, BRICK)
    bx(m, -MW / 2, MW / 2, hy1, MH, z0, z1, BRICK)
    bx(m, -MW / 2, hx0, hy0, hy1, z0, z1, BRICK)
    bx(m, hx1, MW / 2, hy0, hy1, z0, z1, BRICK)
    bx(m, -MW / 2, MW / 2, MH - 0.12, MH, z1, z1 + 0.06, PALM, STONE)        # แถบหินคั่นชั้น


def sash(m, x0, x1, y0, y1, lit):
    """หน้าต่างบานเลื่อนแบบอังกฤษ: กรอบขาว 2 บน-ล่าง ช่องกระจก 2×2 + ขอบหินล่าง + คิ้วบน"""
    d = -0.18
    bx(m, x0, x1, y0, y1, -TH, d - 0.02, PALM, GLASS_LIT if lit else GLASS)       # กระจก
    f = 0.07
    for xa, xb in ((x0, x0 + f), (x1 - f, x1), ((x0 + x1) / 2 - f / 2, (x0 + x1) / 2 + f / 2)):
        bx(m, xa, xb, y0, y1, d - 0.02, d + 0.03, PALM, WHITE)
    ym = (y0 + y1) / 2
    for ya, yb in ((y0, y0 + f), (y1 - f, y1), (ym - f, ym + f), ((y0 + ym) / 2 - f / 3, (y0 + ym) / 2 + f / 3), ((ym + y1) / 2 - f / 3, (ym + y1) / 2 + f / 3)):
        bx(m, x0, x1, ya, yb, d - 0.02, d + 0.03, PALM, WHITE)
    bx(m, x0 - 0.12, x1 + 0.12, y0 - 0.12, y0, -0.1, 0.1, PALM, CREAM)          # ขอบล่าง (sill)
    bx(m, x0 - 0.16, x1 + 0.16, y1, y1 + 0.2, -0.05, 0.07, PALM, CREAM)          # คิ้วบน (lintel)
    for xx in (x0 - 0.06, x1 + 0.06):                                             # ขอบข้างเว้าเข้า
        bx(m, xx - 0.06, xx + 0.06, y0, y1, -TH + 0.05, d - 0.02, BRICK)


def piece_win(lit):
    m = MB(MATS)
    hx, y0, y1 = 0.62, 0.95, 2.75
    wall_with_hole(m, -hx, hx, y0, y1)
    sash(m, -hx, hx, y0, y1, lit)
    return m.build('city_ct_win' + ('' if lit else '_d'))


def piece_plain():
    m = MB(MATS)
    bx(m, -MW / 2, MW / 2, 0, MH, -TH, 0, BRICK)
    bx(m, -MW / 2, MW / 2, MH - 0.12, MH, 0, 0.06, PALM, STONE)
    return m.build('city_ct_plain')


def piece_door():
    """ประตูบ้านสีแดง + ช่องแสงครึ่งวงกลมด้านบน + บันได 2 ขั้น + ราวเหล็กดำ"""
    m = MB(MATS)
    x0, x1, y1 = -0.6, 0.6, 2.35
    wall_with_hole(m, x0 - 0.25, x1 + 0.25, 0, 3.1)
    bx(m, x0 - 0.25, x1 + 0.25, y1, 3.1, -TH, 0, BRICK)
    bx(m, x0, x1, 0.3, y1, -0.28, -0.2, PALM, RED)                                # บานประตู
    for yy in (0.9, 1.6):
        bx(m, x0 + 0.15, x1 - 0.15, yy, yy + 0.5, -0.2, -0.17, PALM, RED)         # ลูกฟัก
    bx(m, 0.35, 0.42, 1.25, 1.32, -0.17, -0.12, PALM, GOLD)                        # ลูกบิด
    m.grid(g_cyl(0.6, 0.6, 0.08, 12, 1, t0=-PI / 2, tl=PI), trs3((0, y1 + 0.05, -0.22), (PI / 2, 0, 0)), PALM, GLASS_LIT)   # ช่องแสงครึ่งวงกลม
    for xa, xb in ((x0 - 0.25, x0), (x1, x1 + 0.25)):
        bx(m, xa, xb, 0, 3.1, -0.05, 0.08, PALM, CREAM)                            # เสาข้างประตู
    bx(m, x0 - 0.35, x1 + 0.35, 3.1, 3.3, -0.05, 0.14, PALM, CREAM)               # คิ้วบนประตู
    bx(m, x0 - 0.3, x1 + 0.3, 0, 0.15, 0, 0.75, PALM, STONE)                       # บันได
    bx(m, x0 - 0.3, x1 + 0.3, 0.15, 0.3, 0, 0.4, PALM, STONE)
    for s in (-1, 1):                                                              # ราวเหล็กดำหน้าบ้าน
        xr = s * 1.5
        bx(m, xr - 0.03, xr + 0.03, 0, 1.0, 0.7, 0.76, PALM, IRON)
        for k in range(6):
            zz = 0.1 + k * 0.12
            bx(m, xr - 0.02, xr + 0.02, 0, 0.95, zz, zz + 0.03, PALM, IRON)
            m.grid(g_cyl(0.0, 0.035, 0.1, 4), trs3((xr, 1.0, zz + 0.015)), PALM, IRON)
    return m.build('city_ct_door')


def piece_shop(awn):
    """หน้าร้านชั้นล่าง: กระจกบานใหญ่มีไฟ + ป้ายร้าน (fascia) + เสาข้าง + กันสาดลาย"""
    m = MB(MATS)
    sc = GREEN if awn == AWN_R else NAVY
    bx(m, -MW / 2, MW / 2, 0, 0.45, -TH, 0, PALM, sc)                             # ฐานใต้กระจก
    bx(m, -1.75, 0.55, 0.45, 2.55, -0.3, -0.26, PALM, GLASS_LIT)                    # กระจกโชว์
    for xx in (-1.75, -0.6, 0.55):
        bx(m, xx - 0.05, xx + 0.05, 0.45, 2.55, -0.26, -0.18, PALM, sc)
    bx(m, -1.75, 0.55, 2.5, 2.6, -0.26, -0.18, PALM, sc)
    bx(m, 0.7, 1.7, 0.0, 2.55, -0.3, -0.26, PALM, GLASS_LIT)                       # ประตูร้าน (กระจก)
    bx(m, 0.62, 0.7, 0, 2.55, -0.3, -0.15, PALM, sc); bx(m, 1.7, 1.78, 0, 2.55, -0.3, -0.15, PALM, sc)
    bx(m, -MW / 2, MW / 2, 2.55, 3.25, -0.1, 0.12, PALM, sc)                        # ป้ายร้าน
    bx(m, -MW / 2 + 0.3, MW / 2 - 0.3, 2.68, 3.12, 0.12, 0.14, PALM, GOLD)            # ตัวหนังสือ (แถบทอง)
    bx(m, -MW / 2, MW / 2, 3.25, MH, -TH, 0, BRICK)
    bx(m, -MW / 2, MW / 2, 3.25, 3.35, -0.05, 0.18, PALM, CREAM)                    # คิ้วบนป้าย
    for xx in (-MW / 2, MW / 2 - 0.22):                                           # เสาข้างร้าน
        bx(m, xx, xx + 0.22, 0, 3.25, -0.05, 0.16, PALM, sc)
    # กันสาด: แผ่นเอียงลาย 2 สีสลับ
    n = 8
    for k in range(n):
        xa = -MW / 2 + 0.1 + k * (MW - 0.2) / n
        xb = xa + (MW - 0.2) / n
        bx(m, xa, xb, 2.32, 2.4, 0.15, 1.25, PALM, awn if k % 2 == 0 else CREAM, rot=(-0.38, 0, 0))
    bx(m, -MW / 2 + 0.1, MW / 2 - 0.1, 2.02, 2.22, 1.12, 1.18, PALM, awn)              # ชายกันสาด
    bx(m, -MW / 2, MW / 2, MH - 0.12, MH, 0, 0.06, PALM, STONE)
    o = m.build('city_ct_shop' + ('_r' if awn == AWN_R else '_b'))
    return o


def piece_corner():
    """มุมตึก: เสาอิฐกับหินมุมสลับ (quoin) สูง 1 ชั้น — วางที่มุมตึก กว้าง 0.6"""
    m = MB(MATS)
    bx(m, -0.3, 0.3, 0, MH, -0.3, 0.3, BRICK)
    for k in range(5):
        y = 0.2 + k * 0.7
        w = 0.36 if k % 2 else 0.22
        bx(m, -0.32, -0.32 + w + 0.3, y, y + 0.32, -0.32, 0.32, PALM, CREAM)
    return m.build('city_ct_corner')


def piece_cornice():
    """ขอบดาดฟ้า (parapet) 4 ม.: อิฐเตี้ย + บัวหินยื่น"""
    m = MB(MATS)
    bx(m, -MW / 2, MW / 2, 0, 0.9, -TH, 0, BRICK)
    bx(m, -MW / 2, MW / 2, 0.0, 0.18, -0.05, 0.22, PALM, CREAM)
    bx(m, -MW / 2, MW / 2, 0.18, 0.3, -0.05, 0.12, PALM, CREAM)
    bx(m, -MW / 2, MW / 2, 0.9, 1.02, -TH - 0.05, 0.08, PALM, STONE)
    for k in range(5):
        xx = -MW / 2 + 0.4 + k * 0.8
        bx(m, xx - 0.07, xx + 0.07, -0.12, 0.0, 0.0, 0.16, PALM, CREAM)               # ค้ำบัว (dentil)
    return m.build('city_ct_cornice')


def piece_chimney():
    """ปล่องไฟบนหลังคา: แท่งอิฐ + ปากปล่องดินเผา 4 อัน"""
    m = MB(MATS)
    bx(m, -0.7, 0.7, 0, 1.6, -0.35, 0.35, BRICK)
    bx(m, -0.78, 0.78, 1.6, 1.75, -0.43, 0.43, PALM, CREAM)
    for k in range(4):
        x = -0.5 + k * 0.33
        m.grid(g_cyl(0.11, 0.13, 0.45, 8), trs3((x, 1.97, 0)), PALM, AWN_R)
    return m.build('city_ct_chimney')


# ---------------- ของริมถนน ----------------
def phone():
    """ตู้โทรศัพท์แดง (K6): 1.0 × 1.0 × 2.5 ม. หลังคาโค้ง กระจกตาราง ป้าย TELEPHONE ไฟขาว"""
    m = MB(MATS)
    W2, Hh = 0.48, 2.25
    bx(m, -0.52, 0.52, 0, 0.12, -0.52, 0.52, PALM, RED)                                  # ฐาน
    for sx in (-1, 1):
        for sz in (-1, 1):
            bx(m, sx * W2 - 0.07, sx * W2 + 0.07, 0.12, Hh, sz * W2 - 0.07, sz * W2 + 0.07, PALM, RED)   # เสามุม
    for ang in range(4):
        a = ang * PI / 2
        def B(x0, x1, y0, y1, z0, z1, sw, a=a):
            c = Matrix.Rotation(a, 3, 'Y') @ V(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
            m.box((abs(x1 - x0), abs(y1 - y0), abs(z1 - z0)), trs3(tuple(c), (0, a, 0)), PALM, sw)
        B(-0.41, 0.41, 0.12, 0.5, W2 - 0.04, W2, RED)                                     # แผงล่าง
        B(-0.41, 0.41, 0.5, 1.95, W2 - 0.03, W2 - 0.01, LIGHT if ang == 0 else GLASS_LIT)  # กระจก
        for k in range(4):
            x = -0.41 + k * 0.82 / 3
            B(x - 0.03, x + 0.03, 0.5, 1.95, W2 - 0.04, W2 + 0.01, RED)
        for k in range(7):
            y = 0.5 + k * 1.45 / 6
            B(-0.41, 0.41, y - 0.025, y + 0.025, W2 - 0.04, W2 + 0.01, RED)
        B(-0.4, 0.4, 1.98, 2.18, W2 - 0.02, W2 + 0.04, LIGHT)                             # ป้าย TELEPHONE
        B(-0.38, 0.38, 2.06, 2.1, W2 + 0.04, W2 + 0.05, BLACK)
    bx(m, -0.55, 0.55, Hh, Hh + 0.1, -0.55, 0.55, PALM, RED)
    m.grid(g_cyl(0.0, 0.55, 0.3, 4, 1, t0=PI / 4), trs3((0, Hh + 0.25, 0)), PALM, RED, smooth=False)   # หลังคาโค้ง (ทรงพีระมิดเตี้ย)
    m.grid(g_sphere(0.07, 8, 6), trs3((0, Hh + 0.45, 0)), PALM, GOLD)                      # มงกุฎ
    return m.build('city_cp_phone')


def postbox():
    """ตู้ไปรษณีย์ทรงเสา (pillar box): แดง สูง 1.5 ม. ฝาโดมกว้าง ช่องหยอดจดหมายดำ ฐานดำ"""
    m = MB(MATS)
    m.grid(g_cyl(0.3, 0.33, 0.12, 14), trs3((0, 0.06, 0)), PALM, BLACK)
    m.grid(g_cyl(0.27, 0.29, 1.15, 14, 2), trs3((0, 0.7, 0)), PALM, RED)
    m.grid(g_cyl(0.36, 0.36, 0.08, 14), trs3((0, 1.31, 0)), PALM, RED)
    m.grid(g_sphere(0.33, 14, 8, tl=PI / 2), trs3((0, 1.33, 0), scale=(1, 0.55, 1)), PALM, RED)
    bx(m, -0.13, 0.13, 1.08, 1.14, 0.22, 0.3, PALM, BLACK)                               # ช่องหยอด
    bx(m, -0.1, 0.1, 0.78, 0.92, 0.25, 0.3, PALM, CREAM)                                 # ป้ายเวลาเก็บ
    bx(m, -0.08, 0.08, 0.55, 0.62, 0.26, 0.31, PALM, GOLD)                               # ตรา
    return m.build('city_cp_postbox')


def lamp():
    """เสาไฟแบบวิกตอเรียน สูง 4.6 ม.: ฐานป่อง เสาเรียว แขนค้ำ โคมกระจก 4 ด้านไฟเหลือง"""
    m = MB(MATS)
    m.grid(g_cyl(0.16, 0.22, 0.6, 10), trs3((0, 0.3, 0)), PALM, IRON)
    m.grid(g_torus(0.17, 0.04, 6, 12), trs3((0, 0.62, 0), (PI / 2, 0, 0)), PALM, IRON)
    m.grid(g_cyl(0.07, 0.1, 3.4, 8), trs3((0, 2.3, 0)), PALM, IRON)
    bx(m, -0.35, 0.35, 3.55, 3.6, -0.025, 0.025, PALM, IRON)                               # แขนค้ำบันได
    m.grid(g_cyl(0.13, 0.08, 0.2, 8), trs3((0, 4.05, 0)), PALM, IRON)
    m.grid(g_cyl(0.24, 0.16, 0.55, 4, 1, t0=PI / 4), trs3((0, 4.42, 0)), PALM, LIGHT, smooth=False)   # โคม
    m.grid(g_cyl(0.02, 0.32, 0.22, 4, 1, t0=PI / 4), trs3((0, 4.8, 0)), PALM, IRON, smooth=False)     # หมวกโคม
    m.grid(g_sphere(0.05, 6, 4), trs3((0, 4.95, 0)), PALM, IRON)
    return m.build('city_cp_lamp')


def bench():
    """ม้านั่งริมทาง 1.8 ม.: ไม้ระแนงสีไม้ + ขาเหล็กดำโค้ง"""
    m = MB(MATS)
    for s in (-1, 1):
        x = s * 0.75
        bx(m, x - 0.05, x + 0.05, 0, 0.45, -0.25, 0.22, PALM, IRON)
        bx(m, x - 0.05, x + 0.05, 0.42, 0.95, -0.3, -0.2, PALM, IRON, rot=(0.18, 0, 0))
        bx(m, x - 0.05, x + 0.05, 0.6, 0.66, -0.25, 0.26, PALM, IRON)                          # ที่วางแขน
    for k in range(4):                                                                      # ที่นั่ง
        z = -0.2 + k * 0.12
        bx(m, -0.9, 0.9, 0.43, 0.48, z, z + 0.1, PALM, WOOD)
    for k in range(3):                                                                      # พนักพิง
        y = 0.6 + k * 0.13
        bx(m, -0.9, 0.9, y, y + 0.09, -0.3 - y * 0.18 + 0.1, -0.24 - y * 0.18 + 0.1, PALM, WOOD)
    return m.build('city_cp_bench')


def taxi():
    """แท็กซี่ดำลอนดอน: ยาว 4.4 กว้าง 1.8 สูง 1.75 • หน้ารถ = +z • ป้าย TAXI เหลืองเรือง"""
    m = MB(MATS)
    L, Wd = 4.4, 1.8
    bx(m, -Wd / 2, Wd / 2, 0.35, 0.95, -L / 2 + 0.15, L / 2 - 0.1, PALM, BLACK)           # ตัวถังล่าง
    bx(m, -Wd / 2 + 0.03, Wd / 2 - 0.03, 0.95, 1.05, -L / 2 + 0.2, L / 2 - 0.5, PALM, BLACK)
    bx(m, -Wd / 2 + 0.05, Wd / 2 - 0.05, 0.86, 0.96, L / 2 - 1.3, L / 2 - 0.05, PALM, BLACK, rot=(0.12, 0, 0))   # ฝากระโปรงเอียงลง
    bx(m, -Wd / 2 + 0.08, Wd / 2 - 0.08, 1.05, 1.62, -L / 2 + 0.35, L / 2 - 1.35, PALM, GLASS)   # ห้องโดยสาร (กระจก)
    bx(m, -Wd / 2 + 0.06, Wd / 2 - 0.06, 1.62, 1.72, -L / 2 + 0.3, L / 2 - 1.3, PALM, BLACK)       # หลังคา
    for zz in (-L / 2 + 0.33, -0.25, L / 2 - 1.37):                                          # เสาประตู
        bx(m, -Wd / 2 + 0.07, Wd / 2 - 0.07, 1.05, 1.62, zz, zz + 0.08, PALM, BLACK)
    bx(m, -Wd / 2 + 0.1, Wd / 2 - 0.1, 0.95, 1.4, L / 2 - 1.4, L / 2 - 1.3, PALM, GLASS, rot=(-0.35, 0, 0))   # กระจกหน้า
    bx(m, -0.3, 0.3, 1.72, 1.92, -0.05, 0.12, PALM, LIGHT)                                   # ป้าย TAXI
    bx(m, -0.2, 0.2, 1.78, 1.86, 0.12, 0.13, PALM, GOLD)
    bx(m, -0.55, 0.55, 0.45, 0.8, L / 2 - 0.12, L / 2 - 0.02, PALM, STONE)                     # กระจังหน้า
    for s in (-1, 1):
        m.grid(g_cyl(0.13, 0.13, 0.06, 10), trs3((s * 0.68, 0.72, L / 2 - 0.03), (PI / 2, 0, 0)), PALM, LIGHT)   # ไฟหน้า
        bx(m, s * 0.75 - 0.12, s * 0.75 + 0.12, 0.7, 0.85, -L / 2 + 0.1, -L / 2 + 0.16, PALM, AWN_R)              # ไฟท้าย
        for zz in (-L / 2 + 0.85, L / 2 - 0.85):                                             # ล้อ + ซุ้มล้อ
            m.grid(g_cyl(0.36, 0.36, 0.26, 12), trs3((s * (Wd / 2 - 0.1), 0.36, zz), (0, 0, PI / 2)), PALM, RUBBER)
            m.grid(g_cyl(0.18, 0.18, 0.28, 8), trs3((s * (Wd / 2 - 0.09), 0.36, zz), (0, 0, PI / 2)), PALM, STONE)
    bx(m, -Wd / 2 - 0.02, Wd / 2 + 0.02, 0.3, 0.42, -L / 2 + 0.02, -L / 2 + 0.15, PALM, STONE)   # กันชนหลัง
    bx(m, -Wd / 2 - 0.02, Wd / 2 + 0.02, 0.3, 0.42, L / 2 - 0.12, L / 2 + 0.02, PALM, STONE)     # กันชนหน้า
    return m.build('city_cp_taxi')


pieces = [piece_win(True), piece_win(False), piece_plain(), piece_door(), piece_shop(AWN_R), piece_shop(AWN_B),
          piece_corner(), piece_cornice(), piece_chimney()]
props = [phone(), postbox(), lamp(), bench(), taxi()]
exec(open(os.path.join(HERE, 'city_kit_more.py'), encoding='utf-8').read())
pieces2 = [co_win(True), co_win(False), co_plain(), co_lobby(), co_top(), co_corner(), cg_win(True), cg_win(False), cg_lobby(), cg_top(), cg_corner(),
           cw_wall(P_COR), cw_wall(P_CORB), cw_win(), cw_door(), cw_top(), cw_corner(), cc_open(), cc_entry(), cc_top(), cc_corner()]
props2 = [car(), van(), bus(), container(), train(), tlight(), busstop(), bin_(), bollard(), tube(), planter(), bush(), cone(), barrier(), pallet(), crane(), boat(), kiosk(), stand()]
for o in pieces:
    brick_uv(o)

out = {}
for o in pieces + props + pieces2 + props2:
    nm = o.name[len('city_'):]
    out[o.name] = (tris(o), export([o], 'assets/city/%s.glb' % nm))

# ---------------- ฉากตัวอย่าง: ตึกแถว 3 ชั้น 4 ห้อง + ของริมถนน ----------------
coll = bpy.data.collections.new('demo'); bpy.context.scene.collection.children.link(coll)
src = {o.name: o for o in pieces + props}


def put(name, x, y, z, rz=0.0):
    o = src[name].copy(); coll.objects.link(o)
    o.location = (x, -z, y); o.rotation_euler = (0, 0, rz); return o


units = 6
ground = ['city_ct_shop_r', 'city_ct_door', 'city_ct_shop_b', 'city_ct_shop_r', 'city_ct_door', 'city_ct_shop_b']
for i in range(units):
    x = (i - (units - 1) / 2) * MW
    put(ground[i], x, 0, 0)
    for f in (1, 2):
        put('city_ct_win' if R.random() < 0.6 else 'city_ct_win_d', x, f * MH, 0)
    put('city_ct_cornice', x, 3 * MH, 0)
    if i % 2 == 0:
        put('city_ct_chimney', x + 1.0, 3 * MH + 1.0, -2.5)
for s in (-1, 1):
    for f in range(3):
        put('city_ct_corner', s * (units * MW / 2 + 0.3), f * MH, 0)
put('city_cp_phone', -8.5, 0, 3.2)
put('city_cp_postbox', -6.4, 0, 3.0)
put('city_cp_lamp', -2.0, 0, 3.4)
put('city_cp_lamp', 10.0, 0, 3.4)
put('city_cp_bench', 3.0, 0, 2.6)
put('city_cp_taxi', 5.5, 0, 5.4, PI / 2)
# พื้นทางเท้า + ถนน
pm = MB(MATS)
bx(pm, -16, 16, -0.15, 0.0, 0, 4.2, PALM, STONE)
bx(pm, -16, 16, -0.3, -0.15, 4.2, 12, PALM, RUBBER)
pm.build('demo_ground', coll)

save_blend('assets/src/city_kit.blend')

# ---------------- เรนเดอร์ภาพตัวอย่าง (EEVEE) ----------------
sc = bpy.context.scene
for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
    try:
        sc.render.engine = eng; break
    except Exception:
        pass
sc.view_settings.view_transform = 'Standard'
wd = bpy.data.worlds.new('w'); sc.world = wd; wd.use_nodes = True
bgn = wd.node_tree.nodes['Background']; bgn.inputs[0].default_value = hexcol('#3a4258'); bgn.inputs[1].default_value = 0.8
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 2.6
sun.rotation_euler = (math.radians(55), 0, math.radians(-30)); sc.collection.objects.link(sun)
camd = bpy.data.cameras.new('cam'); camd.lens = 30
cam = bpy.data.objects.new('cam', camd); sc.collection.objects.link(cam); sc.camera = cam
for o in pieces + props:
    o.hide_render = True
sc.render.resolution_x, sc.render.resolution_y = 1280, 720


def shot(path, loc, tgt):
    cam.location = loc
    cam.rotation_euler = (V(tgt) - V(loc)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(ROOT, path)
    bpy.ops.render.render(write_still=True)


os.makedirs(os.path.join(ROOT, 'shots'), exist_ok=True)
shot('shots/city_kit_street.png', (9, -22, 6.5), (0, 0, 4.5))
shot('shots/city_kit_street2.png', (-14, -8, 2.2), (-4, 0, 2.6))
# เรียงชิ้นเดี่ยว
for o in coll.objects:
    o.hide_render = True
for i, o in enumerate(pieces + props):
    o.hide_render = False
    o.location = ((i % 7) * 5.2 - 15.6, 0, 0) if i < 14 else (0, 0, 0)
    if i >= 7:
        o.location.y = 9
shot('shots/city_kit_pieces.png', (0, -26, 14), (0, 4, 1.5))
print('RESULT', out)
demo2(shot, pieces + props + pieces2 + props2)
