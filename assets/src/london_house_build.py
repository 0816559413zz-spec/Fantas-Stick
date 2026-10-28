# london_house_build.py — บ้านอิฐลอนดอนแบบพังได้ (แทนบ้านหิมะในแมพ city) ใช้โครงเดียวกับ house_build.py ทุกอย่าง
# (ชื่อชิ้น / ขนาด 8 × 6.5 × 4.2 / หลังคา 2 ซีก / ชิ้น _broken) → ระบบพังเดิม (js/12 BLDG, BLD_GRID) ใช้ได้เลย
# ต่างจากบ้านหิมะ: สี (อิฐ / ขอบครีม / หลังคาหินชนวน / ประตูแดง) + ผนังไม่มีโครงไม้ขัด + หน้าต่างบานเลื่อนกรอบครีม + มุมหินสลับ + ปล่องไฟมีปากปล่อง
# รัน (2 ขั้น):
#   blender -b --factory-startup --python assets/src/london_house_build.py                      → assets/src/house_ldn.blend
#   blender -b assets/src/house_ldn.blend --python assets/src/house_chunks.py -- house_ldn.glb   → assets/buildings/house_ldn.glb (ตัดชิ้นย่อย)
import os, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'house_build.py'), encoding='utf-8').read()
head, build = src.split('# ---- build ----', 1)
# สีลอนดอน (ลำดับช่องเดิม: PLASTER, PLASTER2, BEAM, ROOF, SNOW, DOOR, GLASS, STONE, LATH, DARK, EMBER, STONE2, WOOD2)
a = head.index('PAL = ['); b = head.index(']', a) + 1
head = head[:a] + """PAL = ['#8a4a3a', '#7a4232', '#e6dfd0', '#4a4e58',
       '#3a3e46', '#8e2a26', '#ffc36b', '#b4ab96',
       '#6a4a32', '#1a1412', '#ff6a20', '#9a9284',
       '#5a4030', '#2a2c30', '#c9d6e6', '#ffffff']""" + head[b:]
head = head.replace('EXPORT = True', 'EXPORT = False')
exec(head)


def window(f, u, zc, w=1.0, h=1.5):
    """หน้าต่างบานเลื่อนอังกฤษ: กระจก + กรอบครีม 2 บาน ช่อง 2×2 + ขอบล่างหิน + คิ้วบนหิน"""
    f.B(u, 0, zc, w, 0.76, h, GLASS)
    for e in (-1, 1):
        f.B(u + e * (w / 2 + 0.05), 0.4, zc, 0.1, 0.12, h + 0.1, BEAM)
    f.B(u, 0.4, zc + h / 2 + 0.05, w + 0.2, 0.12, 0.1, BEAM)
    f.B(u, 0.42, zc, w, 0.1, 0.08, BEAM)
    f.B(u, 0.42, zc, 0.06, 0.1, h, BEAM)
    f.B(u, 0.5, zc - h / 2 - 0.08, w + 0.35, 0.3, 0.14, STONE)
    f.B(u, 0.44, zc + h / 2 + 0.2, w + 0.4, 0.16, 0.22, STONE)


def wall_intact(kind):
    p = Piece('wall_' + kind)
    f = Frame(p, kind)
    L = f.L
    f.cut = kind == 'front'                                     # ช่องประตูเปิด (house_build.py Frame.B / doorway)
    f.B(0, 0.04, 0.3, 2 * L, 0.84, 0.6, STONE2)                 # ฐานหิน
    f.B(0, 0, 2.4, 2 * L, T, 3.6, PLASTER)                       # ผนังอิฐ
    f.B(0, 0.41, 4.05, 2 * L, 0.18, 0.3, STONE)                  # บัวบน
    for k in range(int(2 * L / 0.9)):                            # แถวอิฐสลับสี (ลายเตี้ย ๆ ให้รู้ว่าเป็นอิฐ)
        u = -L + 0.45 + k * 0.9
        f.B(u, 0.36, 3.6, 0.42, 0.04, 0.18, PLASTER2)
    if kind == 'front':
        for e in (-1, 1):
            window(f, e * 2.55, 2.35)
        f.B(0, 0.38, 1.25, 1.15, 0.1, 2.5, DOOR)                 # ประตูแดง
        for z in (0.75, 1.7):
            f.B(0, 0.44, z, 0.8, 0.04, 0.6, DOOR)
        f.B(0.36, 0.47, 1.25, 0.1, 0.1, 0.1, STONE)
        f.B(0, 0.4, 2.72, 1.1, 0.1, 0.36, GLASS)                 # ช่องแสงบนประตู
        for e in (-1, 1):
            f.B(e * 0.72, 0.45, 1.5, 0.24, 0.18, 3.0, BEAM)      # เสาข้างประตู
        f.B(0, 0.5, 3.05, 1.8, 0.3, 0.2, BEAM)
        f.B(0, 0.75, 0.08, 1.7, 0.7, 0.16, STONE)                # ขั้นบันได
        for e in (-1, 1):                                        # ราวเหล็กดำหน้าบ้าน
            for k in range(7):
                f.B(e * (1.25 + k * 0.32), 1.05, 0.5, 0.05, 0.05, 1.0, DARK)
            f.B(e * 2.2, 1.05, 1.0, 2.1, 0.06, 0.06, DARK)
    elif kind == 'back':
        for e in (-1, 1):
            window(f, e * 2.2, 2.4)
        f.B(0, -0.75, 0.8, 1.9, 0.8, 1.6, STONE)                 # เตาผิงด้านใน (เห็นตอนผนังอื่นพัง)
        f.B(0, -1.13, 0.55, 1.0, 0.06, 0.8, DARK)
        f.B(0, -1.0, 0.22, 0.8, 0.3, 0.16, EMBER)
        f.B(0, -0.58, 2.95, 1.0, 0.45, 2.5, STONE2)
    else:
        window(f, 0, 2.4, 0.9, 1.4)
    if kind in ('left', 'right'):
        for e in (-1, 1):                                        # หินมุมสลับ (quoin)
            for k in range(6):
                z = 0.75 + k * 0.58
                f.B(e * D2, 0.05, z, 0.62 if k % 2 else 0.42, 0.82, 0.3, STONE)
    if kind == 'front':
        f.doorway(DOOR)
    return p


RID, EAVE, EX = 7.6, 3.95, 4.7
ANG = math.atan2(RID - EAVE, EX)
SLOPE = math.hypot(RID - EAVE, EX)


def roof_intact(s):
    p = Piece('roof_' + ('left' if s < 0 else 'right'))
    n = Vector((s * math.sin(ANG), 0, math.cos(ANG)))
    mid = Vector((s * EX / 2, 0, (RID + EAVE) / 2))
    rot = (0, s * ANG, 0)
    p.box(mid + n * 0.13, (SLOPE + 0.1, 7.9, 0.26), ROOF, rot)  # หินชนวน
    for k in range(5):                                           # แถวกระเบื้องชนวน
        t = (k + 0.5) / 5
        c = Vector((s * EX * (1 - t), 0, EAVE + (RID - EAVE) * t)) + n * 0.28
        p.box(c, (0.12, 7.85, 0.06), SNOW, rot)
    p.box((s * 0.14, 0, RID + 0.18), (0.32, 7.95, 0.24), SNOW)
    p.box((s * (EX - 0.06), 0, EAVE - 0.04), (0.14, 7.9, 0.22), BEAM)
    for yc in (-D2, D2):
        p.prism([(0, WH), (s * W2, WH), (0, RID - 0.2)], yc - 0.35, yc + 0.35, PLASTER)   # หน้าจั่วอิฐ
        if yc < 0:
            p.box((s * 1.15, yc, 6.0), (0.55, 0.76, 0.6), GLASS)
            p.box((s * 1.15, yc - 0.44, 6.36), (0.75, 0.12, 0.12), BEAM)
            p.box((s * 1.15, yc - 0.44, 5.64), (0.75, 0.12, 0.12), BEAM)
    if s > 0:                                                    # ปล่องไฟอิฐ + ปากปล่องดินเผา
        p.box((2.2, 1.3, 6.9), (1.3, 0.95, 3.8), PLASTER)
        p.box((2.2, 1.3, 8.88), (1.45, 1.1, 0.24), STONE)
        for k in range(3):
            p.box((1.8 + k * 0.4, 1.3, 9.2), (0.24, 0.24, 0.45), DOOR)
    return p


exec(build.replace("export('DEBRIS_STONE'", "pass  # export('DEBRIS_STONE'").replace("export('DEBRIS_WOOD'", "pass  # export('DEBRIS_WOOD'"))
for n in ('HOUSE',):                                            # ให้ house_chunks.py (เปิดฉากแรก) เห็นชิ้นบ้าน
    if bpy.context.scene != sc and cols[n].name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(cols[n])
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'house_ldn.blend'), compress=True)
print('LDN', result)
