# light_god_build.py — Radiant Sovereign (ร่างเทพอัลติสาย Light) • ผู้ใช้ 2026-11-16
# ref: designs/light_ref/ult_god_ref.webp, ult_god_ref2.webp • สเปก: designs/light.md (หัวข้อโมเดลร่างเทพ)
# รูปทรง: ครึ่งบนเท่านั้น (ส่วนล่างเรียวเป็นหางให้จางในเกม) • เหลี่ยมบล็อกแต่สัดส่วนเทพเรียว (ไหล่กว้าง เอวคอด แขนยาว)
#         หัวทรงไข่ไม่มีหน้า (ไม่ใช่บล็อก) • ฝ่ามือเปิดนิ้วแยก • อกมีเบ้าคริสตัล • ไหล่มีคริสตัลแหลม
# รัน: blender -b --factory-startup --python assets/src/light_god_build.py
# ออก: assets/models/light_god.glb (3 ชิ้น: god_body / god_head / god_tail) + assets/src/light_god.blend
# พิกัด Blender: z ขึ้น, -y = หน้า (three +z) • เอวที่ z=0
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import reset, mat, export, save_blend

VAR=(sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'base')
reset()
M_BODY = mat('god_body', '#cfe2ff', rough=0.55, emit='#8fb8ff', emit_k=0.25)
M_HEAD = mat('god_head', '#eef5ff', rough=0.4, emit='#bfd8ff', emit_k=0.35)
M_GOLD = mat('god_gold', '#ffc23d', rough=0.35, metal=0.6, emit='#ffb000', emit_k=0.6)
M_CRY = mat('god_crystal', '#ffffff', rough=0.1, emit='#ffe9a8', emit_k=1.5)


def obj_from_bm(bm, name, m):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(m)
    return o


def frustum(name, m, w0, d0, w1, d1, h, z0=0.0, x=0.0, y=0.0, rot=(0, 0, 0)):
    """กล่องเรียว: ฐานกว้าง w0×d0 ที่ z0 → บน w1×d1 สูง h"""
    bm = bmesh.new()
    vs = []
    for (w, d, z) in ((w0, d0, 0), (w1, d1, h)):
        for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            vs.append(bm.verts.new((sx * w / 2, sy * d / 2, z)))
    f = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    for a in f:
        bm.faces.new([vs[i] for i in a])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = obj_from_bm(bm, name, m)
    o.location = (x, y, z0)
    o.rotation_euler = rot
    return o


def spike(name, m, r, h, x, y, z, rot=(0, 0, 0), verts=4):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=0, depth=h, location=(0, 0, 0))
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(m)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    # ฐานที่จุดหมุน: เลื่อนให้ฐานอยู่ที่ origin
    for v in o.data.vertices:
        v.co.z += h / 2
    o.location = (x, y, z)
    o.rotation_euler = rot
    return o


def bevel(o, w=0.012, seg=2):
    md = o.modifiers.new('bev', 'BEVEL')
    md.width = w
    md.segments = seg
    md.limit_method = 'ANGLE'


parts = []
R = math.radians
# ---------- ลำตัว: อกกว้าง → เอวคอด (บล็อกเรียว) ----------
chest = frustum('chest', M_BODY, 0.36, 0.24, 0.66, 0.32, 0.5, z0=0.32)
belly = frustum('belly', M_BODY, 0.3, 0.22, 0.36, 0.24, 0.32, z0=0.0)
plate = frustum('plate', M_BODY, 0.42, 0.06, 0.52, 0.06, 0.26, z0=0.52, y=-0.15)          # เกราะอก
collar = frustum('collar', M_GOLD, 0.5, 0.3, 0.3, 0.22, 0.06, z0=0.82)
parts += [chest, belly, plate, collar]
# เบ้าคริสตัลกลางอก (วงทอง) + คริสตัล
bpy.ops.mesh.primitive_torus_add(major_radius=0.085, minor_radius=0.016, location=(0, -0.19, 0.62), rotation=(R(90), 0, 0))
ring = bpy.context.active_object; ring.name = 'socket'; ring.data.materials.append(M_GOLD); parts.append(ring)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.07, location=(0, -0.19, 0.62))
gem = bpy.context.active_object; gem.name = 'gem'; gem.scale = (0.8, 0.6, 1.15); gem.data.materials.append(M_CRY); parts.append(gem)
# ---------- ไหล่ + คริสตัลแหลมบนไหล่ ----------
for s in (-1, 1):
    pd = frustum('pad%d' % s, M_GOLD, 0.24, 0.26, 0.16, 0.2, 0.14, z0=0.74, x=s * 0.36, rot=(0, R(-18 * s), 0))
    parts.append(pd)
    parts.append(spike('spA%d' % s, M_CRY, 0.04, 0.26, s * 0.42, 0.0, 0.84, rot=(0, R(-38 * s), 0)))
    parts.append(spike('spB%d' % s, M_CRY, 0.03, 0.18, s * 0.33, 0.04, 0.86, rot=(R(-10), R(-18 * s), 0)))
    # ---------- แขน: ต้นแขน → ปลายแขน → ถุงมือ → ฝ่ามือเปิด นิ้วแยก (กางออก เปิดฝ่ามือไปข้างหน้า) ----------
    sh = Vector((s * 0.36, 0.0, 0.76))
    el = Vector((s * 0.62, -0.04, 0.42))
    wr = Vector((s * 0.86, -0.12, 0.16))

    def seg(name, a, b, w0, w1, m):
        d = b - a
        L = d.length
        o = frustum(name, m, w0, w0 * 0.9, w1, w1 * 0.9, L)
        o.location = a
        o.rotation_mode = 'QUATERNION'
        o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
        return o
    parts.append(seg('upper%d' % s, sh, el, 0.13, 0.1, M_BODY))
    parts.append(seg('fore%d' % s, el, wr, 0.1, 0.085, M_BODY))
    parts.append(seg('glove%d' % s, el + (wr - el) * 0.55, wr + (wr - el).normalized() * 0.02, 0.11, 0.1, M_GOLD))
    hd = (wr - el).normalized()
    side = Vector((0, -1, 0))          # ฝ่ามือหันหน้า
    palm_c = wr + hd * 0.07
    palm = frustum('palm%d' % s, M_HEAD, 0.11, 0.035, 0.12, 0.035, 0.11)
    palm.location = wr
    palm.rotation_mode = 'QUATERNION'
    palm.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(hd)
    parts.append(palm)
    for i in range(4):
        spread = R(-24 + i * 16) * s
        fd = (Matrix.Rotation(spread, 3, side) @ hd).normalized()
        base = wr + hd * 0.11 + (Matrix.Rotation(R(90), 3, side) @ hd) * (-0.045 + 0.03 * i) * s
        parts.append(seg('fing%d_%d' % (s, i), base, base + fd * (0.1 + 0.02 * (i in (1, 2))), 0.026, 0.018, M_HEAD))
    tb = wr + hd * 0.04
    tdir = (Matrix.Rotation(R(-70) * s, 3, side) @ hd).normalized()
    parts.append(seg('thumb%d' % s, tb, tb + tdir * 0.08, 0.028, 0.02, M_HEAD))
# ---------- คอ + หัวทรงไข่ (ไม่ใช่บล็อก ไม่มีหน้า) ----------
neck = frustum('neck', M_BODY, 0.1, 0.1, 0.09, 0.09, 0.1, z0=0.86)
parts.append(neck)
bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=0.13, location=(0, 0, 1.08))
head = bpy.context.active_object
head.name = 'god_head'
head.scale = (0.92, 0.95, 1.25)
head.data.materials.append(M_HEAD)
bpy.ops.object.shade_smooth()
if VAR=='B':
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.14, location=(0, 0, 1.1))
    hm=bpy.context.active_object;hm.name='helm';hm.scale=(0.98,1.0,1.2);hm.data.materials.append(M_GOLD)
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='DESELECT');bpy.ops.object.mode_set(mode='OBJECT')
    for v in hm.data.vertices:
        if v.co.y<-0.02 and v.co.z<0.05:v.select=True
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.delete(type='VERT');bpy.ops.object.mode_set(mode='OBJECT')
    parts.append(hm)
    parts.append(spike('crest', M_GOLD, 0.03, 0.3, 0, 0.02, 1.25, rot=(R(-15),0,0)))
# ---------- ส่วนล่าง: หางเรียวแหลม (จางในเกม) ----------
tail = frustum('god_tail', M_BODY, 0.02, 0.02, 0.3, 0.22, 0.9, z0=-0.9)

if VAR=='B':   # เกราะทองหนา: อก/ถุงมือเต็มแขน/หมวกครอบ
    parts.append(frustum('bplate', M_GOLD, 0.5, 0.08, 0.64, 0.08, 0.36, z0=0.46, y=-0.17))
    for s2 in (-1,1):
        parts.append(frustum('bpad%d'%s2, M_GOLD, 0.34, 0.34, 0.2, 0.26, 0.2, z0=0.72, x=s2*0.4, rot=(0, R(-24*s2), 0)))
        for k in range(3):parts.append(spike('bsp%d%d'%(s2,k), M_GOLD, 0.035, 0.2+0.05*k, s2*(0.38+0.06*k), 0.06-0.06*k, 0.88, rot=(0, R(-30*s2), 0)))
    parts.append(frustum('belt', M_GOLD, 0.34, 0.25, 0.36, 0.26, 0.08, z0=0.02))
for o in parts:
    bpy.context.view_layer.objects.active = o
    if o.name in ('gem', 'socket'):continue
    if VAR=='A':
        md=o.modifiers.new('sub','SUBSURF');md.levels=2;md.render_levels=2
    else:
        bevel(o)
bpy.ops.object.select_all(action='DESELECT')
for o in parts:
    o.select_set(True)
bpy.context.view_layer.objects.active = chest
bpy.ops.object.convert(target='MESH')       # ใช้ bevel modifier
bpy.ops.object.join()
body = bpy.context.active_object
body.name = 'god_body'
for o in (head, tail):
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    if o is tail:
        bevel(o)
        bpy.ops.object.convert(target='MESH')
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
suf='' if VAR=='base' else '_'+VAR
size = export([body, head, tail], 'assets/models/light_god%s.glb'%suf)
save_blend('assets/src/light_god%s.blend'%suf)
print('LIGHT_GOD_OK', size, len(body.data.vertices), len(head.data.vertices))
