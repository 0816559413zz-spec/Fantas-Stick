# สร้างโมเดลน้ำแข็งประกอบเอฟเฟกต์สายน้ำแข็ง 2 ชิ้น แล้ว export เป็น .glb (เปิดใน Blender → Scripting → รันไฟล์นี้)
#   assets/vfx/ice_burst.glb = มงกุฎหนามน้ำแข็งบนพื้น (รัศมี ~1 สูงสุด ~1.2) — แผ่นแตกร้าว + หนามวงนอก(เอียงออก)/วงกลาง/วงใน(ตั้งตรง)
#   assets/vfx/ice_spire.glb = กลุ่มหนามน้ำแข็งก้อนเดียว (สูง 1 ฐานกว้าง ~0.45) — เสากลาง + เศษเอียง ใช้เรียงเป็นแนวภูเขาน้ำแข็ง Glacier Rend
#   assets/vfx/ice_sword.glb / ice_axe.glb = ดาบ/ขวานน้ำแข็ง (พิกัดตรงกับ makeIceSword/makeIceAxe — จุดหมุนในกำมือ ใบชี้ลง -Z)
#       วัสดุ ice (ใบผลึก → shader น้ำแข็ง) / core (แกนเรืองแสง) / metal / gem / wrap (หนังพันด้าม)
#   assets/vfx/ice_circle.glb = ริบบิ้นโค้งวนบนพื้น (Permafrost) วัสดุ swirl (เกมใส่ shader เรืองแสงหมุน)
# uv: v = 0 ที่ฐาน → 1 ที่ปลายหนาม (เกมใส่ shader น้ำแข็งแทนวัสดุ "ice") • ทิศ: +Z = บน (export เป็น Y-up)
import bpy, bmesh, math, os, random
from mathutils import Vector

ROOT = os.path.abspath(r"D:\AI\Fantas-Stick\assets")

def clear():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)

def mat(name, col):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*col, 1)
    return m

def basis(d):
    d = d.normalized()
    a = Vector((1, 0, 0)) if abs(d.x) < 0.9 else Vector((0, 1, 0))
    u = d.cross(a).normalized()
    return u, d.cross(u).normalized()

def spike(bm, uvl, base, d, h, w, rnd, sides=5):
    """หนามผลึก: 3 ชั้นหน้าตัด 5 เหลี่ยม บิดแต่ละชั้น + ปลายหักเล็กน้อย"""
    u, v = basis(d)
    kink = u * rnd.uniform(-0.12, 0.12) * h + v * rnd.uniform(-0.12, 0.12) * h
    levels = [(0.0, 1.0, 0.0), (0.42, 0.78, 0.5), (0.8, 0.34, 0.3)]
    rows = []
    for (t, k, tw) in levels:
        c = base + d * (h * t) + kink * t * t
        ang0 = tw + rnd.uniform(-0.15, 0.15) * (t > 0)
        row = []
        for i in range(sides):
            a = ang0 + i / sides * math.tau
            r = w * k * (1.0 + (0.18 if i % 2 else -0.1))
            row.append((bm.verts.new(c + u * math.cos(a) * r + v * math.sin(a) * r), t))
        rows.append(row)
    tip = bm.verts.new(base + d * h + kink)
    for r in range(len(rows) - 1):
        A, B = rows[r], rows[r + 1]
        for i in range(sides):
            j = (i + 1) % sides
            f = bm.faces.new((A[i][0], A[j][0], B[j][0], B[i][0]))
            for lp, t in zip(f.loops, (A[i][1], A[j][1], B[j][1], B[i][1])):
                lp[uvl].uv = (0.5, t)
    L = rows[-1]
    for i in range(sides):
        j = (i + 1) % sides
        f = bm.faces.new((L[i][0], L[j][0], tip))
        for lp, t in zip(f.loops, (L[i][1], L[j][1], 1.0)):
            lp[uvl].uv = (0.5, t)
    f = bm.faces.new([p[0] for p in reversed(rows[0])])       # ฐาน
    for lp in f.loops: lp[uvl].uv = (0.5, 0.0)

def lean(an, tilt):
    """ทิศหนามเอียงออกจากศูนย์กลางที่มุม an"""
    return Vector((math.cos(an) * math.sin(tilt), math.sin(an) * math.sin(tilt), math.cos(tilt)))

def build_burst():
    rnd = random.Random(7)
    me = bpy.data.meshes.new("ice_burst"); ob = bpy.data.objects.new("ice_burst", me)
    bpy.context.collection.objects.link(ob)
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new("UVMap")
    # แผ่นน้ำแข็งแตกร้าว: เฟินวงแหวน 3 ชั้น สันนูนสลับร่อง
    N = 28
    rings = [(0.0, 0.10)]
    rings += [(0.35, 0.07), (0.68, 0.045), (1.0, 0.0)]
    ctr = bm.verts.new((0, 0, 0.10))
    prev = None
    for ri, (rad, hz) in enumerate(rings[1:], 1):
        row = []
        for i in range(N):
            a = i / N * math.tau
            z = hz + (0.035 if i % 2 else -0.02) * (1 if rad < 1 else 0)
            rr = rad * (1 + rnd.uniform(-0.05, 0.05))
            row.append(bm.verts.new((math.cos(a) * rr, math.sin(a) * rr, max(0.0, z))))
        if prev is None:
            for i in range(N):
                f = bm.faces.new((ctr, row[i], row[(i + 1) % N]))
                for lp in f.loops: lp[uvl].uv = (0.5, 0.0)
        else:
            for i in range(N):
                j = (i + 1) % N
                f = bm.faces.new((prev[i], prev[j], row[j], row[i]))
                for lp in f.loops: lp[uvl].uv = (0.5, 0.0)
        prev = row
    # หนามวงนอก: เอียงออก ~38°
    n = 20
    for i in range(n):
        an = i / n * math.tau + rnd.uniform(-0.12, 0.12)
        rad = 0.9 + rnd.uniform(-0.06, 0.04)
        spike(bm, uvl, Vector((math.cos(an) * rad, math.sin(an) * rad, 0)), lean(an, math.radians(rnd.uniform(30, 48))),
              rnd.uniform(0.28, 0.6), rnd.uniform(0.06, 0.1), rnd)
    # วงกลาง: สูงกว่า เอียงออกน้อย
    n = 12
    for i in range(n):
        an = i / n * math.tau + rnd.uniform(-0.2, 0.2) + 0.2
        rad = 0.58 + rnd.uniform(-0.06, 0.06)
        spike(bm, uvl, Vector((math.cos(an) * rad, math.sin(an) * rad, 0)), lean(an, math.radians(rnd.uniform(14, 28))),
              rnd.uniform(0.55, 0.95), rnd.uniform(0.08, 0.13), rnd)
    # วงใน: ตั้งตรง สูงสุด (รอบหลุมกลางที่เว้นว่าง)
    n = 6
    for i in range(n):
        an = i / n * math.tau + rnd.uniform(-0.25, 0.25)
        rad = 0.26 + rnd.uniform(-0.04, 0.04)
        spike(bm, uvl, Vector((math.cos(an) * rad, math.sin(an) * rad, 0)), lean(an, math.radians(rnd.uniform(4, 14))),
              rnd.uniform(0.8, 1.2), rnd.uniform(0.09, 0.14), rnd)
    # เกล็ดเล็กแทรก
    for i in range(14):
        an = rnd.uniform(0, math.tau); rad = rnd.uniform(0.15, 0.85)
        spike(bm, uvl, Vector((math.cos(an) * rad, math.sin(an) * rad, 0)), lean(an, math.radians(rnd.uniform(10, 50))),
              rnd.uniform(0.15, 0.35), rnd.uniform(0.04, 0.07), rnd)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.normal_update(); bm.to_mesh(me); bm.free()
    me.materials.append(mat("ice", (0.8, 0.95, 1.0)))
    for p in me.polygons: p.use_smooth = False
    return ob

def build_spire():
    rnd = random.Random(21)
    me = bpy.data.meshes.new("ice_spire"); ob = bpy.data.objects.new("ice_spire", me)
    bpy.context.collection.objects.link(ob)
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new("UVMap")
    spike(bm, uvl, Vector((0, 0, -0.02)), Vector((0.04, 0.02, 1)), 1.0, 0.2, rnd, sides=6)       # เสากลาง
    n = 7
    for i in range(n):
        an = i / n * math.tau + rnd.uniform(-0.3, 0.3)
        rad = rnd.uniform(0.12, 0.26)
        spike(bm, uvl, Vector((math.cos(an) * rad, math.sin(an) * rad, -0.02)), lean(an, math.radians(rnd.uniform(14, 38))),
              rnd.uniform(0.4, 0.78), rnd.uniform(0.07, 0.12), rnd)
    for i in range(4):
        an = rnd.uniform(0, math.tau); rad = rnd.uniform(0.2, 0.34)
        spike(bm, uvl, Vector((math.cos(an) * rad, math.sin(an) * rad, -0.02)), lean(an, math.radians(rnd.uniform(40, 62))),
              rnd.uniform(0.2, 0.36), rnd.uniform(0.05, 0.08), rnd)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.normal_update(); bm.to_mesh(me); bm.free()
    me.materials.append(mat("ice", (0.8, 0.95, 1.0)))
    for p in me.polygons: p.use_smooth = False
    return ob

# ---------- อาวุธ (ดาบ/ขวาน) — พิกัดเดียวกับ makeIceSword/makeIceAxe ในเกม: Z = แกน Y ของเกม (ใบดาบชี้ลง -Z) • หน้าใบ = ±Y • คม = ±X ----------
def shard(bm, uvl, base, d, L, W, T, mi, curve=0.0, v0=0.0, v1=1.0, keep=0.0, M=4):
    """ใบผลึกแบน: หน้าตัดข้าวหลามตัด (สันกลางหนา T คมบาง) กว้าง W ยาว L ตามทิศ d (อยู่ในระนาบ XZ) ปลายแหลม"""
    d = d.normalized(); s = Vector((d.z, 0, -d.x)); y = Vector((0, 1, 0))
    rows = []
    for j in range(M):
        t = j / M
        c = base + d * (L * t) + s * (curve * L * t * t)
        u = max(0.0, (t - keep) / (1 - keep))            # keep = ช่วงต้นที่กว้างคงที่ (ใบดาบ)
        w = W * (1 - u) ** 0.8 * 0.5; th = T * (1 - u) * 0.5 + 0.004
        rows.append(([bm.verts.new(c + s * w), bm.verts.new(c + y * th), bm.verts.new(c - s * w), bm.verts.new(c - y * th)], lerp(v0, v1, t)))
    tip = bm.verts.new(base + d * L + s * (curve * L))
    for j in range(M - 1):
        (A, ta), (B, tb) = rows[j], rows[j + 1]
        for k in range(4):
            f = bm.faces.new((A[k], A[(k + 1) % 4], B[(k + 1) % 4], B[k])); f.material_index = mi
            for lp, uv in zip(f.loops, ((k / 4, ta), ((k + 1) / 4, ta), ((k + 1) / 4, tb), (k / 4, tb))): lp[uvl].uv = uv
    A, ta = rows[-1]
    for k in range(4):
        f = bm.faces.new((A[k], A[(k + 1) % 4], tip)); f.material_index = mi
        for lp, uv in zip(f.loops, ((k / 4, ta), ((k + 1) / 4, ta), (0.5, v1))): lp[uvl].uv = uv
    f = bm.faces.new(list(reversed(rows[0][0]))); f.material_index = mi
    for lp in f.loops: lp[uvl].uv = (0.5, v0)

def tube(bm, uvl, pts, rads, mi, sides=6):
    """ท่อตามเส้นจุด (ด้าม/การ์ด/ขากรงเล็บ) รัศมีต่อจุด"""
    rows = []
    for i, p in enumerate(pts):
        d = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        u, v = basis(d)
        rows.append([bm.verts.new(p + (u * math.cos(a) + v * math.sin(a)) * rads[i]) for a in [k / sides * math.tau for k in range(sides)]])
    for i in range(len(rows) - 1):
        for k in range(sides):
            f = bm.faces.new((rows[i][k], rows[i][(k + 1) % sides], rows[i + 1][(k + 1) % sides], rows[i + 1][k])); f.material_index = mi
            for lp, uv in zip(f.loops, ((k / sides, i / len(rows)),) * 4): lp[uvl].uv = uv
    for r in (rows[0], list(reversed(rows[-1]))):
        f = bm.faces.new(r); f.material_index = mi

def lerp(a, b, t): return a + (b - a) * t

def gem(bm, uvl, c, r, h, mi):
    top = bm.verts.new(c + Vector((0, 0, h))); bot = bm.verts.new(c - Vector((0, 0, h)))
    ring = [bm.verts.new(c + Vector((math.cos(a) * r, math.sin(a) * r, 0))) for a in [k / 6 * math.tau for k in range(6)]]
    for k in range(6):
        for f in (bm.faces.new((ring[k], ring[(k + 1) % 6], top)), bm.faces.new((ring[(k + 1) % 6], ring[k], bot))):
            f.material_index = mi
            for lp in f.loops: lp[uvl].uv = (0.5, 0.5)

def weapon_mats(me):
    for m in (mat("ice", (0.8, 0.95, 1.0)), mat("core", (0.6, 0.9, 1.0)), mat("metal", (0.07, 0.2, 0.24)), mat("gem", (0.4, 0.9, 1.0)), mat("wrap", (0.55, 0.42, 0.25))):
        me.materials.append(m)
    me.materials["metal"].node_tree.nodes["Principled BSDF"].inputs["Metallic"].default_value = 0.85
    me.materials["metal"].node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.35
    me.materials["wrap"].node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.85
ICE, CORE, METAL, GEM, WRAP = 0, 1, 2, 3, 4

def build_sword():
    rnd = random.Random(5)
    me = bpy.data.meshes.new("ice_sword"); ob = bpy.data.objects.new("ice_sword", me)
    bpy.context.collection.objects.link(ob); weapon_mats(me)
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new("UVMap")
    # ใบดาบยาวเรียว (ข้าวหลามตัด) z -0.04 → -2.05 • uv v = 0 โคน → 1 ปลาย
    shard(bm, uvl, Vector((0, 0, -0.04)), Vector((0, 0, -1)), 2.02, 0.2, 0.07, ICE, keep=0.62, M=9)
    # แกนเรืองแสงกลางใบ (สองหน้า)
    for sy in (1, -1):
        shard(bm, uvl, Vector((0, sy * 0.022, -0.12)), Vector((0, 0, -1)), 1.75, 0.04, 0.012, CORE, keep=0.6, M=8)
    # หนามหยักที่โคนใบ (ชี้ออกข้างเฉียงลง) — แบบในรูปอ้างอิง
    for i in range(4):
        z = -0.16 - i * 0.13
        for sx in (1, -1):
            L = 0.13 - i * 0.02 + rnd.uniform(-0.015, 0.015)
            shard(bm, uvl, Vector((sx * 0.085, 0, z)), Vector((sx * 0.6, 0, -1.0)), L, 0.055, 0.025, ICE, v0=0.1, v1=0.3)
    # การ์ด: แกนกลาง + ปีกโค้งขึ้นสองข้าง + เขี้ยวเล็กชี้ลง
    tube(bm, uvl, [Vector((-0.12, 0, 0)), Vector((0.12, 0, 0))], [0.05, 0.05], METAL, 8)
    for sx in (1, -1):
        pts = [Vector((sx * (0.08 + 0.38 * t), 0, 0.02 + 0.32 * t ** 2.2 - 0.05 * math.sin(t * math.pi))) for t in [k / 7 for k in range(8)]]
        tube(bm, uvl, pts, [lerp(0.045, 0.008, k / 7) for k in range(8)], METAL)
        shard(bm, uvl, Vector((sx * 0.3, 0, 0.03)), Vector((sx * 0.4, 0, 1)), 0.2, 0.05, 0.03, ICE, v0=0.5, v1=1)
        shard(bm, uvl, Vector((sx * 0.1, 0, -0.03)), Vector((sx * 0.25, 0, -1)), 0.14, 0.05, 0.035, METAL)
    gem(bm, uvl, Vector((0, 0, 0)), 0.06, 0.08, GEM)
    # ด้าม + ปลอกพันเป็นปล้อง + หัวด้าม (คริสตัลในกรงโลหะ)
    tube(bm, uvl, [Vector((0, 0, 0.04)), Vector((0, 0, 0.34))], [0.034, 0.03], METAL, 7)
    for i in range(4):
        tube(bm, uvl, [Vector((0, 0, 0.07 + i * 0.075)), Vector((0, 0, 0.1 + i * 0.075))], [0.042, 0.042], METAL, 7)
    gem(bm, uvl, Vector((0, 0, 0.42)), 0.05, 0.09, GEM)
    for a in range(4):
        an = a / 4 * math.tau
        tube(bm, uvl, [Vector((math.cos(an) * 0.02, math.sin(an) * 0.02, 0.33)), Vector((math.cos(an) * 0.06, math.sin(an) * 0.06, 0.42)), Vector((math.cos(an) * 0.015, math.sin(an) * 0.015, 0.52))], [0.014, 0.012, 0.004], METAL, 4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.normal_update(); bm.to_mesh(me); bm.free()
    return ob

def build_axe():
    rnd = random.Random(9)
    me = bpy.data.meshes.new("ice_axe"); ob = bpy.data.objects.new("ice_axe", me)
    bpy.context.collection.objects.link(ob); weapon_mats(me)
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new("UVMap")
    # ด้ามโลหะสีกรมท่า โค้งเล็กน้อย z +0.12 → -1.8
    tube(bm, uvl, [Vector((0.02 * math.sin(t * 3), 0, lerp(0.12, -1.8, t))) for t in [k / 8 for k in range(9)]], [0.04] * 8 + [0.05], METAL, 8)
    # หนังพันด้าม (ช่วงที่มือจับ) เป็นปล้อง ๆ
    for i in range(8):
        z = -0.04 - i * 0.06
        tube(bm, uvl, [Vector((0, 0, z)), Vector((0, 0, z - 0.05))], [0.052, 0.05], WRAP, 8)
    tube(bm, uvl, [Vector((0.05, 0, -0.5)), Vector((0.1, 0.02, -0.62)), Vector((0.07, 0.03, -0.75))], [0.014, 0.012, 0.006], WRAP, 4)   # ปลายเชือกห้อย
    # ปลายด้าม (เหนือมือ) = เกล็ดน้ำแข็ง
    for i in range(4):
        an = i / 4 * math.tau + 0.3
        shard(bm, uvl, Vector((0, 0, 0.1)), Vector((math.cos(an) * 0.35, math.sin(an) * 0.35, 1)), rnd.uniform(0.16, 0.26), 0.06, 0.04, ICE, v0=0.3, v1=1)
    # หัวขวาน: ปลอกโลหะมีเขี้ยว + อัญมณี
    tube(bm, uvl, [Vector((0, 0, -1.34)), Vector((0, 0, -1.76))], [0.085, 0.085], METAL, 8)
    for sx in (1, -1):
        for z in (-1.38, -1.72):
            shard(bm, uvl, Vector((0, 0, z)), Vector((sx * 0.5, 0, (1 if z > -1.5 else -1))), 0.14, 0.06, 0.05, METAL)
    for sy in (1, -1):
        gem(bm, uvl, Vector((0, sy * 0.08, -1.55)), 0.045, 0.06, GEM)
    # ใบขวานสองข้าง: แผ่นพระจันทร์เสี้ยว (ขอบนอกหยักแบบผลึก เขาบน/ล่างงอนกลับ) สันกลางนูน + ผลึกแหลมโผล่ตามขอบ
    for sx in (1, -1):
        out = [(0.06, 0.16), (0.2, 0.3), (0.36, 0.46), (0.52, 0.62)]                 # ขอบเว้าด้านบน → ปลายเขาบน
        edge = [(0.58, 0.44), (0.66, 0.34), (0.63, 0.24), (0.73, 0.14), (0.68, 0.04), (0.76, -0.06), (0.69, -0.16), (0.72, -0.27), (0.62, -0.36), (0.6, -0.48)]
        bot = [(0.5, -0.64), (0.34, -0.48), (0.19, -0.31), (0.06, -0.17)]
        poly = out + edge + bot
        cx, cz, T = 0.36, -0.02, 0.06
        cf = bm.verts.new((sx * cx, T, -1.55 + cz)); cb = bm.verts.new((sx * cx, -T, -1.55 + cz))
        ring = [bm.verts.new((sx * x, 0, -1.55 + z)) for (x, z) in poly]
        n = len(ring)
        for i in range(n - 1):
            a, b = ring[i], ring[i + 1]
            for c, order in ((cf, (a, b, cf)), (cb, (b, a, cb))):
                f = bm.faces.new(order if sx > 0 else tuple(reversed(order))); f.material_index = ICE
                for lp, vv in zip(f.loops, order if sx > 0 else tuple(reversed(order))):
                    x = abs(vv.co.x); lp[uvl].uv = (0.5, min(1.0, 0.15 + (x - 0.06) / 0.7 * 0.85) if vv not in (cf, cb) else 0.35)
        for (i0, L) in ((5, 0.2), (7, 0.24), (9, 0.18), (11, 0.22), (13, 0.16), (3, 0.22), (14, 0.2)):
            x, z = poly[i0]
            ang = math.atan2(z - cz, x - cx) + rnd.uniform(-0.25, 0.25)
            shard(bm, uvl, Vector((sx * (x - 0.05 * math.cos(ang)), 0, -1.55 + z - 0.05 * math.sin(ang))), Vector((sx * math.cos(ang), 0, math.sin(ang))), L, rnd.uniform(0.07, 0.1), 0.05, ICE, v0=0.6, v1=1)
    # หนามบนหัว (ทิศปลายด้าม) ชี้ลง
    shard(bm, uvl, Vector((0, 0, -1.76)), Vector((0, 0, -1)), 0.32, 0.1, 0.07, ICE)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.normal_update(); bm.to_mesh(me); bm.free()
    return ob

# ---------- Ice circle: ริบบิ้นโค้งวนเป็นก้นหอยบนพื้น (เกมใส่ shader เรืองแสงหมุน) uv u = ตามแนวโค้ง 0..1 • v = ขวาง 0..1 ----------
def build_circle():
    rnd = random.Random(3)
    me = bpy.data.meshes.new("ice_circle"); ob = bpy.data.objects.new("ice_circle", me)
    bpy.context.collection.objects.link(ob)
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new("UVMap")
    arcs = [(0.95, 0.0, 2.4, 0.07), (0.88, 3.3, 2.0, 0.05), (0.72, 1.2, 2.2, 0.06), (0.62, 4.3, 1.8, 0.05), (0.5, 0.4, 2.6, 0.07), (0.38, 3.0, 2.0, 0.05), (0.26, 1.8, 2.3, 0.05), (0.8, 5.4, 1.2, 0.035)]
    for li, (r, a0, span, w) in enumerate(arcs):
        S = 28; prev = None
        for j in range(S + 1):
            t = j / S; a = a0 + span * t
            rr = r * (1 - 0.18 * t)                      # ก้อนหอย: รัศมีหดตามแนวโค้ง
            ww = w * math.sin(math.pi * t) ** 0.6 + 0.004
            z = 0.02 + li * 0.004
            v0 = bm.verts.new((math.cos(a) * (rr - ww), math.sin(a) * (rr - ww), z)); v1 = bm.verts.new((math.cos(a) * (rr + ww), math.sin(a) * (rr + ww), z))
            if prev:
                f = bm.faces.new((prev[0], prev[1], v1, v0))
                for lp, uv in zip(f.loops, ((prev[2], 0), (prev[2], 1), (t, 1), (t, 0))): lp[uvl].uv = uv
            prev = (v0, v1, t)
    bm.to_mesh(me); bm.free()
    me.materials.append(mat("swirl", (0.6, 0.9, 1.0)))
    return ob

def export(ob, path):
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=True, export_yup=True, export_materials="EXPORT")

clear()
b = build_burst(); s = build_spire(); s.location.x = 3
export(b, os.path.join(ROOT, "vfx", "ice_burst.glb"))
s.location.x = 0
export(s, os.path.join(ROOT, "vfx", "ice_spire.glb"))
s.location.x = 3
sw = build_sword(); ax = build_axe(); ci = build_circle()
export(sw, os.path.join(ROOT, "vfx", "ice_sword.glb")); sw.location.x = 6
export(ax, os.path.join(ROOT, "vfx", "ice_axe.glb")); ax.location.x = 7.5
export(ci, os.path.join(ROOT, "vfx", "ice_circle.glb")); ci.location.x = -3
result = {"sword_tris": sum(len(p.vertices) - 2 for p in sw.data.polygons), "axe_tris": sum(len(p.vertices) - 2 for p in ax.data.polygons), "burst_tris": sum(len(p.vertices) - 2 for p in b.data.polygons), "spire_tris": sum(len(p.vertices) - 2 for p in s.data.polygons)}
