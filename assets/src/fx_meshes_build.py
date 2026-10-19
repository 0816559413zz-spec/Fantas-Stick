# สร้างโมเดลประกอบเอฟเฟกต์ 2 ชิ้น แล้ว export เป็น .glb (เปิดใน Blender → Scripting → รันไฟล์นี้)
#   assets/vfx/fire_wing.glb  = ปีกไฟข้างขวา (เกมกลับด้านเป็นข้างซ้ายเอง) — ขนนก 8 เส้นเรียงเป็นพัด
#       uv: v = 0 ที่โคนขนนก (ไฟร้อน) → 1 ที่ปลาย • u = ขวางขนนก 0..1  (เกมใส่ shader ไฟแทนวัสดุ "fire")
#   assets/vfx/storm_claw.glb = สนับมือ + กรงเล็บโค้ง 3 เล่ม (ร่างอัลติสายฟ้า) วัสดุ "claw_dark" (ตัวใบมีดเข้ม) / "claw_edge" (คมเหลือง) / "claw_metal" (สนับมือ)
# ทิศ: Blender -Y = ด้านหน้า, +Z = บน • origin ปีก = โคนปีก (ติดหลัง) • origin กรงเล็บ = กลางฝ่ามือ (ใบมีดชี้ลง -Z โค้งไปหน้า -Y)
import bpy, bmesh, math, os
from mathutils import Vector

ROOT = os.path.join(os.path.dirname(bpy.data.filepath) if bpy.data.filepath else r"D:\AI\Fantas-Stick\assets\src", "..")
ROOT = os.path.abspath(r"D:\AI\Fantas-Stick\assets")

def clear():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)

def mat(name, col, metal=0.0, rough=0.5, emit=None):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*col, 1)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = 1.0
    return m

def lerp(a, b, t): return a + (b - a) * t

# ---------- ปีกไฟ ----------
def build_wing():
    me = bpy.data.meshes.new("wing")
    ob = bpy.data.objects.new("wing", me)
    bpy.context.collection.objects.link(ob)
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    # แขนปีก (เส้นโค้ง) จากโคน → ปลายปีก: ออกข้าง (+X) ไปหลัง (+Y) และยกขึ้น (+Z)
    def arm(s):
        return Vector((2.3 * s, 0.25 + 0.55 * s * s, 0.15 + 1.25 * math.sin(s * 2.0) * 0.62 + 0.2 * s))
    N, M = 11, 10
    for i in range(N):
        k = i / (N - 1)                      # 0 = ขนในสุด (ใกล้ตัว) → 1 = ขนปลายปีก
        s = lerp(0.12, 1.0, k)
        root = arm(s)
        # ทิศขนนก: ขนใน = ลงล่างเอียงหลัง • ขนปลาย = ออกข้างชี้ขึ้นเล็กน้อย
        d = Vector((lerp(0.15, 1.0, k ** 1.3), lerp(0.55, 0.35, k), lerp(-1.0, 0.25, k))).normalized()
        L = lerp(1.05, 1.75, k ** 0.8) * (1.0 if i % 2 == 0 else 0.86)
        W = lerp(0.62, 0.5, k)
        side = d.cross(Vector((0.0, 1.0, 0.0)))   # แนวขวางขนนก (อยู่ในระนาบปีก)
        if side.length < 1e-3: side = Vector((0, 0, 1))
        side.normalize()
        rows = []
        for j in range(M + 1):
            t = j / M
            c = root + d * (L * t) + Vector((0, 0.18 * t * t, -0.12 * t * t))   # ปลายขนโค้งไปหลัง/ลง
            w = W * (1 - t) ** 0.65 * (0.55 + 0.45 * math.sin(math.pi * min(1, t * 1.6 + 0.2))) + 0.01
            rows.append((bm.verts.new(c - side * w * 0.5), bm.verts.new(c + side * w * 0.5), t))
        for j in range(M):
            a0, a1, t0 = rows[j]; b0, b1, t1 = rows[j + 1]
            f = bm.faces.new((a0, a1, b1, b0))
            for lp, uv in zip(f.loops, ((0, t0), (1, t0), (1, t1), (0, t1))):
                lp[uvl].uv = uv
    # เยื่อปีกบาง ๆ ตามแขนปีก (ให้ปีกดูเป็นผืน ไม่ใช่แค่เส้นขน) uv v = ระยะจากแขนปีกลงมา
    S = 14
    top, bot = [], []
    for j in range(S + 1):
        s = j / S
        a = arm(lerp(0.02, 1.0, s))
        dn = Vector((0.1, 0.3, -1.0)).normalized()
        depth = 0.55 * math.sin(math.pi * min(1, s * 1.15)) + 0.08
        top.append((bm.verts.new(a + Vector((0, 0.02, 0.05))), s))
        bot.append((bm.verts.new(a + dn * depth), s))
    for j in range(S):
        (t0, s0), (t1, s1) = top[j], top[j + 1]
        (b0, _), (b1, _) = bot[j], bot[j + 1]
        f = bm.faces.new((t0, t1, b1, b0))
        for lp, uv in zip(f.loops, ((s0, 0), (s1, 0), (s1, 1), (s0, 1))):
            lp[uvl].uv = uv
    bm.to_mesh(me); bm.free()
    me.materials.append(mat("fire", (1.0, 0.45, 0.08), emit=(1.0, 0.4, 0.05)))
    for p in me.polygons: p.use_smooth = True
    return ob

# ---------- กรงเล็บสายฟ้า ----------
def build_claw():
    me = bpy.data.meshes.new("claw")
    ob = bpy.data.objects.new("claw", me)
    bpy.context.collection.objects.link(ob)
    md, me_, mm = mat("claw_dark", (0.05, 0.045, 0.04), metal=0.85, rough=0.32), mat("claw_edge", (1.0, 0.8, 0.1), emit=(1.0, 0.75, 0.1)), mat("claw_metal", (0.12, 0.11, 0.1), metal=0.9, rough=0.4)
    me.materials.append(md); me.materials.append(me_); me.materials.append(mm)
    bm = bmesh.new()
    M = 14
    for i in range(3):
        x0 = (i - 1) * 0.09
        L = 0.82 if i == 1 else 0.74
        sp = (i - 1) * 0.16                  # กางออกเล็กน้อย
        rows = []
        for j in range(M + 1):
            t = j / M
            c = Vector((x0 + sp * t, -0.02 - 0.55 * t * t * L, -0.06 - L * t * (1 - 0.18 * t)))
            # tangent (ในระนาบ YZ) → normal ด้านคม (ด้านหน้า = -Y)
            tg = Vector((sp, -1.1 * t * L, -L * (1 - 0.36 * t))).normalized()
            nf = Vector((0, -tg.z, tg.y)) * -1          # ชี้ไปหน้า/ลงตามโค้ง (ด้านคม)
            if nf.y > 0: nf = -nf
            w = 0.14 * (1 - t) ** 0.7 * (0.75 + 0.25 * math.sin(math.pi * min(1, t * 2.2))) + 0.004         # กว้างใบมีด
            th = 0.034 * (1 - t) + 0.004                 # หนาใบมีด
            ex = Vector((1, 0, 0))
            pts = [c + nf * w * 0.62,                    # คม (หน้า)
                   c + nf * w * 0.4 + ex * th * 0.35, c + ex * th * 0.5 - nf * w * 0.1, c - nf * w * 0.38,   # ด้านขวา → สัน
                   c - ex * th * 0.5 - nf * w * 0.1, c + nf * w * 0.4 - ex * th * 0.35]
            rows.append([bm.verts.new(p) for p in pts])
        for j in range(M):
            A, B = rows[j], rows[j + 1]
            for k in range(6):
                f = bm.faces.new((A[k], A[(k + 1) % 6], B[(k + 1) % 6], B[k]))
                f.material_index = 1 if k in (0, 5) else 0
        tip = bm.verts.new(rows[-1][0].co + Vector((0, -0.01, -0.02)))
        for k in range(6):
            f = bm.faces.new((rows[-1][k], rows[-1][(k + 1) % 6], tip)); f.material_index = 1 if k in (0, 5) else 0
        bot = rows[0]
        f = bm.faces.new(list(reversed(bot))); f.material_index = 0
    bm.to_mesh(me); bm.free()
    # สนับมือ: กล่องลบมุมคลุมหลังมือ + ฐานยึดใบมีด
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.02, -0.02))
    g = bpy.context.active_object; g.name = "claw_guard"; g.scale = (0.34, 0.2, 0.16)
    bpy.ops.object.transform_apply(scale=True)
    mod = g.modifiers.new("bev", "BEVEL"); mod.width = 0.025; mod.segments = 2
    bpy.ops.object.modifier_apply(modifier="bev")
    g.data.materials.append(mm)
    for p in g.data.polygons: p.use_smooth = True
    # รวมเป็นชิ้นเดียว
    bpy.ops.object.select_all(action="DESELECT")
    g.select_set(True); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.join()
    for p in ob.data.polygons: p.use_smooth = True
    return ob

def export(ob, path):
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=True, export_yup=True, export_materials="EXPORT")

clear()
w = build_wing()
c = build_claw()
c.location.x = 4
export(w, os.path.join(ROOT, "vfx", "fire_wing.glb"))
c.location.x = 0
export(c, os.path.join(ROOT, "vfx", "storm_claw.glb"))
c.location.x = 4
result = {"wing_tris": sum(len(p.vertices) - 2 for p in w.data.polygons), "claw_tris": sum(len(p.vertices) - 2 for p in c.data.polygons)}
