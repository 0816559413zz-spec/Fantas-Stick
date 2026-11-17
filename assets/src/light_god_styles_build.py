# light_god_styles_build.py — Radiant Sovereign: 3 สไตล์ใหม่ทั้งหมด (ผู้ใช้ 2026-11-16: "dont keep these style try new style")
#   S1 ร่างแสงเนียน: ตัวมนเรียวเป็นธรรมชาติ (Skin modifier + subdivision) แบบ ref2 ไม่มีเกราะ
#   S2 เทพคลุมผ้า: เสื้อคลุมแสงยาวพลิ้วบานลง มีฮู้ด + วงรัศมีหลังหัว แขนกางออกจากแขนเสื้อกว้าง
#   S3 เทพนามธรรม: วงแหวนหลายวงซ้อนเอียงกัน + แกนแสงกลาง + ปีกแผ่นบาง (ไม่ใช่รูปคน)
# รัน: blender -b --factory-startup --python assets/src/light_god_styles_build.py -- S1|S2|S3
import bpy, bmesh, math, os, sys
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import reset, mat, export, save_blend

VAR = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'S1'
reset()
R = math.radians
M_BODY = mat('g_body', '#e4efff', rough=0.35, emit='#a9c8ff', emit_k=0.4)
M_GOLD = mat('g_gold', '#ffc23d', rough=0.3, metal=0.6, emit='#ffb000', emit_k=0.7)
M_CORE = mat('g_core', '#ffffff', rough=0.1, emit='#ffe9a8', emit_k=1.8)
M_ROBE = mat('g_robe', '#f4f8ff', rough=0.6, emit='#c8dcff', emit_k=0.3, double=True)
parts = []


def link(o, m):
    if o.data.materials:
        o.data.materials[0] = m
    else:
        o.data.materials.append(m)
    parts.append(o)
    return o


def skin_body(verts, edges, radii, name, m, sub=2):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, edges, [])
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o
    sk = o.modifiers.new('skin', 'SKIN')
    for i, r in enumerate(radii):
        o.data.skin_vertices[0].data[i].radius = r
    o.data.skin_vertices[0].data[0].use_root = True
    sd = o.modifiers.new('sub', 'SUBSURF')
    sd.levels = sub
    sd.render_levels = sub
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.ops.object.convert(target='MESH')
    bpy.ops.object.shade_smooth()
    return link(o, m)


def torus(name, m, R0, r, loc, rot):
    bpy.ops.mesh.primitive_torus_add(major_radius=R0, minor_radius=r, major_segments=64, minor_segments=10, location=loc, rotation=rot)
    return link(bpy.context.active_object, m)


def sphere(name, m, r, loc, scale=(1, 1, 1), seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    bpy.ops.object.shade_smooth()
    return link(o, m)


def cone(name, m, r1, r2, h, loc, rot=(0, 0, 0), v=24):
    bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r1, radius2=r2, depth=h, location=loc, rotation=rot)
    return link(bpy.context.active_object, m)


def blade(name, m, root, tip, w):
    """แผ่นบางเรียวแหลม (ใบปีกแสง)"""
    root, tip = Vector(root), Vector(tip)
    d = (tip - root)
    n = Vector((0, 1, 0)).cross(d).normalized()
    bm = bmesh.new()
    pts = []
    N = 8
    for i in range(N + 1):
        t = i / N
        ww = w * math.sin(math.pi * min(1, t * 1.2) * 0.5 + 0.0001) * (1 - t) ** 0.4
        c = root + d * t
        pts.append((c + n * ww, c - n * ww * 0.6))
    vs = [(bm.verts.new(a), bm.verts.new(b)) for a, b in pts]
    for i in range(N):
        bm.faces.new([vs[i][0], vs[i + 1][0], vs[i + 1][1], vs[i][1]])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    sol = o.modifiers.new('th', 'SOLIDIFY')
    sol.thickness = 0.015
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.ops.object.convert(target='MESH')
    return link(o, m)


if VAR == 'S1':
    # โครงกระดูกง่าย ๆ (z ขึ้น) → Skin modifier ให้เป็นตัวมนเรียว
    V = [(0, 0, -0.9), (0, 0, -0.4), (0, 0, 0.05), (0, 0, 0.4), (0, 0, 0.72), (0, 0, 0.92),   # 0-5 หาง→คอ
         (-0.3, 0, 0.78), (-0.58, -0.05, 0.5), (-0.82, -0.14, 0.2), (-0.92, -0.18, 0.08),       # 6-9 แขนซ้าย
         (0.3, 0, 0.78), (0.58, -0.05, 0.5), (0.82, -0.14, 0.2), (0.92, -0.18, 0.08)]           # 10-13 แขนขวา
    E = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (4, 6), (6, 7), (7, 8), (8, 9), (4, 10), (10, 11), (11, 12), (12, 13)]
    Rr = [(0.01, 0.01), (0.07, 0.06), (0.13, 0.1), (0.17, 0.12), (0.21, 0.13), (0.06, 0.06),
          (0.09, 0.08), (0.06, 0.06), (0.05, 0.05), (0.05, 0.03),
          (0.09, 0.08), (0.06, 0.06), (0.05, 0.05), (0.05, 0.03)]
    skin_body(V, E, Rr, 'god_body', M_BODY)
    sphere('god_head', M_BODY, 0.13, (0, 0, 1.1), (0.9, 0.95, 1.2))
    cone('headcrest', M_BODY, 0.06, 0, 0.26, (0, 0.02, 1.33))
    sphere('core', M_CORE, 0.07, (0, -0.15, 0.6), (1, 0.6, 1.2), seg=12)
    torus('socket', M_GOLD, 0.09, 0.015, (0, -0.15, 0.6), (R(90), 0, 0))
    for s in (-1, 1):
        sphere('hand%d' % s, M_CORE, 0.06, (s * 0.96, -0.2, 0.04), (1, 0.6, 1.3), seg=12)
        blade('wingA%d' % s, M_GOLD, (s * 0.15, 0.12, 0.75), (s * 1.0, 0.3, 1.7), 0.12)
        blade('wingB%d' % s, M_GOLD, (s * 0.15, 0.12, 0.7), (s * 1.25, 0.3, 1.35), 0.11)
        blade('wingC%d' % s, M_GOLD, (s * 0.15, 0.12, 0.65), (s * 1.3, 0.3, 0.95), 0.09)
elif VAR == 'S2':
    # เสื้อคลุมแสงยาวบานลง (lathe แบบมีจีบ) + ฮู้ด + วงรัศมี + แขนเสื้อกว้าง
    bm = bmesh.new()
    rings = []
    prof = [(0.12, 0.92), (0.24, 0.78), (0.3, 0.5), (0.32, 0.1), (0.4, -0.3), (0.55, -0.7), (0.7, -1.0)]
    N = 48
    for (r, z) in prof:
        ring = []
        for j in range(N):
            a = 2 * math.pi * j / N
            fold = 1 + (0.08 * math.sin(a * 7) if z < 0.2 else 0)
            ring.append(bm.verts.new((math.cos(a) * r * fold, math.sin(a) * r * 0.8 * fold, z)))
        rings.append(ring)
    for i in range(len(rings) - 1):
        for j in range(N):
            bm.faces.new([rings[i][j], rings[i][(j + 1) % N], rings[i + 1][(j + 1) % N], rings[i + 1][j]])
    me = bpy.data.meshes.new('robe')
    bm.to_mesh(me)
    o = bpy.data.objects.new('god_body', me)
    bpy.context.scene.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o
    o.modifiers.new('th', 'SOLIDIFY').thickness = 0.02
    sd = o.modifiers.new('sub', 'SUBSURF')
    sd.levels = 1
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.ops.object.convert(target='MESH')
    bpy.ops.object.shade_smooth()
    link(o, M_ROBE)
    # ฮู้ด: ครึ่งทรงกลมยืดเหนือหัว + หน้าเป็นแสง (ไม่มีหน้า)
    sphere('hood', M_ROBE, 0.17, (0, 0.02, 1.1), (1, 1, 1.3))
    sphere('face', M_CORE, 0.1, (0, -0.07, 1.08), (0.8, 0.5, 1.1), seg=16)
    torus('halo', M_GOLD, 0.3, 0.02, (0, 0.18, 1.2), (R(90), 0, 0))
    for k in range(12):
        a = R(k * 30)
        cone('ray%d' % k, M_GOLD, 0.02, 0, 0.14, (math.cos(a) * 0.38, 0.18, 1.2 + math.sin(a) * 0.38), (R(90), 0, a - R(90)), v=4)
    for s in (-1, 1):
        cone('sleeve%d' % s, M_ROBE, 0.06, 0.16, 0.55, (s * 0.52, -0.02, 0.55), (0, R(-60 * s), 0))
        sphere('hand%d' % s, M_CORE, 0.07, (s * 0.8, -0.05, 0.36), (1, 0.6, 1.3), seg=12)
        torus('cuff%d' % s, M_GOLD, 0.15, 0.015, (s * 0.72, -0.04, 0.4), (0, R(30 * s), 0))
    sphere('core', M_CORE, 0.07, (0, -0.25, 0.55), (1, 0.6, 1.2), seg=12)
    for s in (-1, 1):
        cone('trim%d' % s, M_GOLD, 0.012, 0.012, 1.6, (s * 0.08, -0.26, 0.1), (R(-8), R(5 * s), 0), v=6)
else:
    # เทพนามธรรม: วงแหวนซ้อน 3 วงเอียงต่างกัน + แกนแสง + ปีกแผ่นบาง 3 คู่
    sphere('god_body', M_CORE, 0.22, (0, 0, 0.6), (1, 1, 1.2))
    torus('r1', M_GOLD, 0.55, 0.03, (0, 0, 0.6), (R(90), 0, 0))
    torus('r2', M_GOLD, 0.48, 0.025, (0, 0, 0.6), (R(30), R(60), 0))
    torus('r3', M_BODY, 0.42, 0.025, (0, 0, 0.6), (R(-30), R(-60), 0))
    torus('r4', M_BODY, 0.3, 0.02, (0, 0, 0.6), (0, 0, 0))
    for k in range(8):   # ประกายแหลมรอบวงนอก
        a = R(k * 45)
        cone('sp%d' % k, M_GOLD, 0.03, 0, 0.18, (math.cos(a) * 0.62, 0, 0.6 + math.sin(a) * 0.62), (R(90), 0, a - R(90)), v=4)
    cone('beam', M_BODY, 0.06, 0.0, 1.4, (0, 0, -0.4), (R(180), 0, 0))
    for s in (-1, 1):
        for i in range(3):
            blade('w%d%d' % (s, i), M_GOLD, (s * 0.25, 0.1, 0.65 + 0.1 * i), (s * (1.2 - 0.2 * i), 0.15, 1.3 - 0.35 * i), 0.13 - 0.02 * i)
bpy.ops.object.select_all(action='DESELECT')
for o in parts:
    o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
body = bpy.context.active_object
body.name = 'god_body'
export([body], 'assets/models/light_god_%s.glb' % VAR)
save_blend('assets/src/light_god_%s.blend' % VAR)
print('LIGHT_GOD_%s_OK' % VAR)
