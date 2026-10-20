# _mapkit.py — ตัวช่วยร่วมของสคริปต์ปั้นแผนที่ (<id>_build.py) ตามกติกา MAP-DESIGN.md (ต่อยอดจาก valley_build.py)
# ใช้:  D:\Blender\blender.exe -b --factory-startup --python assets/src/maps/<id>_build.py
#   → assets/src/maps/<id>.blend + export ด้วย map_export.py → assets/maps/<id>.json + .glb (+ bump manifest)
# 1 หน่วย Blender = 1 หน่วยเกม, กลางแผนที่ (0,0,0), ทิศเหนือ = +Y, พื้นปกติ Z = 0
import bpy, bmesh, math, random, os, sys
import numpy as np
from mathutils import Vector, Matrix

V = Vector
HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.dirname(os.path.dirname(HERE))
SPAWNF = [(.1, .16), (.9, .84), (.9, .16), (.1, .84), (.5, .09), (.5, .91)]    # เหมือน SPAWNF ในเกม (สัดส่วน x, y จากมุมซ้ายบน)


def clamp(v, a=0.0, b=1.0): return a if v < a else b if v > b else v
def smooth(e0, e1, x):
    t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t)
def face_dir(px, py, tx, ty): return math.atan2(tx - px, -(ty - py))     # หมุน Z ให้ −Y ของ empty ชี้จาก p ไป t


class Kit:
    """PAL = {ช่อง 0..15: 0xRRGGBB} • EMIT = ช่องที่เรืองแสง • height(x, y) = ความสูงพื้น"""

    def __init__(self, mid, bx, by, pal, emit=(), gx=None, gy=None, seed=1, emit_k=1.6):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        self.id, self.BX, self.BY = mid, bx, by
        self.GX, self.GY = gx or bx + 8, gy or by + 8
        self.R = random.Random(seed)
        self.PAL, self.EMIT = pal, set(emit)
        sc = bpy.context.scene.collection
        self.ROOT = self.col("MAP_" + mid, sc)
        self.LOGIC = self.col(mid + "_logic", self.ROOT)
        self.DECO = self.col(mid + "_deco", self.ROOT)
        self.FAR = self.col("deco_far", self.ROOT)
        self.NOSH = self.col("noshadow", self.ROOT)
        self.PAL_M, self.COL_M = self._mats(emit_k)
        self.extra = {}
        self.height = lambda x, y: 0.0
        self.coln = 0
        self.keep = []                       # (x, y, r) พื้นที่ห้ามวางของตกแต่ง (จุดเกิด ทางเดิน)

    # ---------- วัสดุ: palette 64 px แผ่นเดียว + ภาพเรืองแสง ----------
    def _mats(self, emit_k):
        N, P = 64, 16
        rng = np.random.default_rng(11)
        col = np.zeros((N, N, 4), np.float32); col[..., 3] = 1
        emi = np.zeros((N, N, 4), np.float32); emi[..., 3] = 1
        for i, c in self.PAL.items():
            cx, cy = i % 4, i // 4
            base = np.array([(c >> 16) & 255, (c >> 8) & 255, c & 255], np.float32) / 255
            n = rng.normal(0, 0.035, (P, P))[..., None]
            col[cy * P:(cy + 1) * P, cx * P:(cx + 1) * P, :3] = np.clip(base * (1 + n), 0, 1)
            if i in self.EMIT:
                emi[cy * P:(cy + 1) * P, cx * P:(cx + 1) * P, :3] = base
        ims = []
        for name, a in ((self.id + "_palette", col), (self.id + "_emit", emi)):
            im = bpy.data.images.new(name, N, N, alpha=False)
            im.pixels.foreach_set(a.ravel()); im.file_format = 'PNG'; im.pack(); ims.append(im)
        m = bpy.data.materials.new(self.id + "_palette"); m.use_nodes = True
        nt = m.node_tree; b = nt.nodes["Principled BSDF"]
        tc = nt.nodes.new("ShaderNodeTexImage"); tc.image = ims[0]; tc.interpolation = 'Closest'
        te = nt.nodes.new("ShaderNodeTexImage"); te.image = ims[1]; te.interpolation = 'Closest'
        nt.links.new(tc.outputs["Color"], b.inputs["Base Color"])
        nt.links.new(te.outputs["Color"], b.inputs["Emission Color"])
        b.inputs["Emission Strength"].default_value = emit_k
        b.inputs["Roughness"].default_value = 0.9
        c = bpy.data.materials.new(self.id + "_col"); c.use_nodes = True
        b = c.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (1, 0.2, 0.2, 1); b.inputs["Alpha"].default_value = 0.25
        c.surface_render_method = 'BLENDED'
        return m, c

    def mat(self, name, rgba, rough=0.5, alpha=1.0, emit=None, emit_k=1.0, metal=0.0):
        m = bpy.data.materials.new(self.id + "_" + name); m.use_nodes = True
        b = m.node_tree.nodes["Principled BSDF"]
        b.inputs["Base Color"].default_value = rgba; b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
        if alpha < 1:
            b.inputs["Alpha"].default_value = alpha; m.surface_render_method = 'BLENDED'
        if emit:
            b.inputs["Emission Color"].default_value = emit; b.inputs["Emission Strength"].default_value = emit_k
        return m

    @staticmethod
    def col(name, parent):
        c = bpy.data.collections.new(name); parent.children.link(c); return c

    # ---------- objects ----------
    def mb(self): return MB(self)

    def obj(self, name, data, col=None, loc=(0, 0, 0), rz=0.0, scale=None):
        o = bpy.data.objects.new(name, data); (col or self.DECO).objects.link(o)
        o.location = loc; o.rotation_euler = (0, 0, rz)
        if scale: o.scale = scale if hasattr(scale, '__len__') else (scale, scale, scale)
        return o

    def place(self, name, me, x, y, rz=0.0, s=1.0, col=None, dz=0.0):
        """วางของตกแต่ง (ใช้ mesh ร่วม = instance) บนพื้น"""
        return self.obj(name, me, col, (x, y, self.height(x, y) + dz), rz, s)

    def empty(self, name, loc, rz=0.0, scale=None):
        o = bpy.data.objects.new(name, None); self.LOGIC.objects.link(o)
        o.empty_display_type = 'SINGLE_ARROW'; o.empty_display_size = 1.5
        o.location = loc; o.rotation_euler = (0, 0, rz)
        if scale: o.scale = scale
        return o

    def mark(self, name, x, y, face=(0, 0), dz=0.0, scale=None):
        return self.empty(name, (x, y, self.height(x, y) + dz), face_dir(x, y, *face), scale)

    def col_cyl(self, x, y, r, h, z0=None, **props):
        self.coln += 1
        z0 = self.height(x, y) if z0 is None else z0
        m = self.mb(); m.cyl((0, 0, 0), (0, 0, h), r, r, 0, n=10)
        o = self.obj("col_%03d" % self.coln, m.mesh("col_cyl", self.COL_M), self.LOGIC, (x, y, z0 - 0.3))
        o.display_type = 'WIRE'; o.hide_render = True
        for k, v in props.items(): o[k] = v
        return o

    def col_box(self, x, y, sx, sy, h, rz=0.0, z0=None):
        self.coln += 1
        z0 = self.height(x, y) if z0 is None else z0
        m = self.mb(); m.box(V((0, 0, h / 2)), (sx, sy, h), 0)
        o = self.obj("col_%03d" % self.coln, m.mesh("col_box", self.COL_M), self.LOGIC, (x, y, z0 - 0.3), rz)
        o.display_type = 'WIRE'; o.hide_render = True
        return o

    def light(self, name, x, y, z, col=(1, 0.7, 0.4), energy=120):
        L = bpy.data.lights.new(name, 'POINT'); L.color = col; L.energy = energy
        return self.obj("light_" + name, L, self.LOGIC, (x, y, self.height(x, y) + z))

    # ---------- พื้น ----------
    def ground(self, height, color, step=1.0):
        """height(x,y) → z ; color(x,y,z,slope) → ช่อง palette"""
        self.height = height
        bm = bmesh.new(); uvl = bm.loops.layers.uv.new("UVMap")
        xs = np.arange(-self.GX, self.GX + 0.001, step); ys = np.arange(-self.GY, self.GY + 0.001, step)
        grid = [[bm.verts.new((x, y, height(x, y))) for x in xs] for y in ys]
        for j in range(len(ys) - 1):
            for i in range(len(xs) - 1):
                f = bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
                cx, cy = xs[i] + step / 2, ys[j] + step / 2
                cz = height(cx, cy)
                e = 0.5
                sl = math.degrees(math.atan(math.hypot(height(cx + e, cy) - height(cx - e, cy), height(cx, cy + e) - height(cx, cy - e)) / (2 * e)))
                u = swuv(color(cx, cy, cz, sl))
                for l in f.loops: l[uvl].uv = u
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        me = bpy.data.meshes.new("ground"); bm.to_mesh(me); bm.free()
        me.materials.append(self.PAL_M)
        return self.obj("ground", me, self.ROOT)

    def bounds(self):
        bm = bmesh.new()
        v = [bm.verts.new(p) for p in ((-self.BX, -self.BY, 0), (self.BX, -self.BY, 0), (self.BX, self.BY, 0), (-self.BX, self.BY, 0))]
        bm.faces.new(v)
        me = bpy.data.meshes.new("bounds"); bm.to_mesh(me); bm.free()
        o = self.obj("bounds", me, self.LOGIC); o.display_type = 'WIRE'; o.hide_render = True
        return o

    # ---------- จุดเกิด ----------
    def sp(self, fx, fy):
        """สัดส่วนจากมุมซ้ายบน (แบบ SPAWNF ในเกม) → พิกัด blender"""
        return (-self.BX + 2 * self.BX * fx, self.BY - 2 * self.BY * fy)

    def std_spawns(self, team_dx=0.4, enemy=True, team_dy=6):
        """spawn_1..6 ตาม SPAWNF + ทีม (แดงขวา/น้ำเงินซ้าย) + enemy_spawn ตามขอบ — หันเข้ากลาง"""
        for i, (fx, fy) in enumerate(SPAWNF):
            x, y = self.sp(fx, fy); self.mark("spawn_%d" % (i + 1), x, y); self.keep.append((x, y, 5))
        for t, sx in (("blue", -1), ("red", 1)):
            for k, dy in enumerate((-team_dy, 0, team_dy)):
                x = sx * self.BX * (1 - team_dx * 0.5) * 0.82; self.mark("spawn_%s_%d" % (t, k + 1), x, dy); self.keep.append((x, dy, 5))
        if enemy:
            for k, (fx, fy) in enumerate(((.5, .04), (.5, .96), (.04, .5), (.96, .5), (.2, .06), (.8, .94))):
                x, y = self.sp(fx, fy); self.mark("enemy_spawn_%d" % (k + 1), x, y)

    def free(self, x, y, r=0.0):
        return all(math.hypot(x - kx, y - ky) > kr + r for kx, ky, kr in self.keep)

    def scatter(self, n, r, ok, tries=4000):
        """สุ่มจุด n จุดในขอบเขต ห่างกัน ≥ r และ ok(x,y) = True"""
        out = []
        for _ in range(tries):
            if len(out) >= n: break
            x = self.R.uniform(-self.BX + 2, self.BX - 2); y = self.R.uniform(-self.BY + 2, self.BY - 2)
            if not ok(x, y) or not self.free(x, y, r * 0.5): continue
            if any(math.hypot(x - a, y - b) < r for a, b in out): continue
            out.append((x, y))
        return out

    # ---------- จบ: ตั้งค่า + save + export ----------
    def finish(self, **settings):
        for k, v in settings.items(): self.ROOT[k] = v
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, self.id + ".blend"), compress=True)
        ns = {"MAP_ID": self.id, "ROOT_DIR": ASSETS}
        exec(open(os.path.join(HERE, "map_export.py"), encoding="utf-8").read(), ns)
        tris = sum(len(p.vertices) - 2 for o in self.ROOT.all_objects if o.type == 'MESH' and not o.name.lower().startswith(("col_", "bounds")) for p in o.data.polygons)
        print("MAPRESULT", self.id, {"tris": tris, "col": self.coln, **ns["result"]["info"]}, "PROBLEMS", ns["result"]["problems"])


def swuv(i):
    return ((i % 4 + 0.5) / 4, (i // 4 + 0.5) / 4)


class MB:
    """ตัวสะสม mesh แบบ valley: UV ชี้ช่อง palette ต่อรูปทรง"""

    def __init__(s, kit):
        s.k = kit; s.bm = bmesh.new(); s.uv = s.bm.loops.layers.uv.new("UVMap")

    def _paint(s, verts, sw):
        u = swuv(sw)
        for f in {f for v in verts for f in v.link_faces}:
            for l in f.loops: l[s.uv].uv = u

    def cyl(s, a, b, r1, r2, sw, n=8, caps=True):
        a, b = V(a), V(b); d = b - a
        q = V((0, 0, 1)).rotation_difference(d.normalized())
        M = Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4()
        res = bmesh.ops.create_cone(s.bm, cap_ends=caps, cap_tris=False, segments=n, radius1=r1, radius2=r2, depth=d.length, matrix=M)
        s._paint(res['verts'], sw); return res['verts']

    def box(s, c, size, sw, rz=0.0, rx=0.0, ry=0.0):
        M = Matrix.Translation(V(c)) @ Matrix.Rotation(rz, 4, 'Z') @ Matrix.Rotation(ry, 4, 'Y') @ Matrix.Rotation(rx, 4, 'X') @ Matrix.Diagonal((*size, 1))
        res = bmesh.ops.create_cube(s.bm, size=1, matrix=M)
        s._paint(res['verts'], sw); return res['verts']

    def ico(s, c, r, sw, sc=(1, 1, 1), sub=1, jit=0.0, seed=0):
        M = Matrix.Translation(V(c)) @ Matrix.Diagonal((sc[0], sc[1], sc[2], 1))
        res = bmesh.ops.create_icosphere(s.bm, subdivisions=sub, radius=r, matrix=M)
        if jit:
            rr = random.Random(seed); cc = V(c)
            for v in res['verts']: v.co = cc + (v.co - cc) * (1 + rr.uniform(-jit, jit))
        s._paint(res['verts'], sw); return res['verts']

    def ring(s, c, r_in, r_out, z0, z1, sw, n=24, a0=0.0, a1=math.tau):
        """กำแพงวงแหวน/โค้ง (หนา r_out-r_in สูง z0..z1)"""
        cx, cy = c
        arc = abs(a1 - a0) < math.tau - 1e-6
        m = n + 1 if arc else n
        P = lambda r, a, z: s.bm.verts.new((cx + r * math.cos(a), cy + r * math.sin(a), z))
        rows = [[P(r, a0 + (a1 - a0) * i / n, z) for i in range(m)] for r, z in ((r_out, z0), (r_out, z1), (r_in, z1), (r_in, z0))]
        fs = []
        for k in range(4):
            A, B = rows[k], rows[(k + 1) % 4]
            for i in range(n):
                j = (i + 1) % m if not arc else i + 1
                fs.append(s.bm.faces.new((A[i], A[j], B[j], B[i])))
        if arc:
            for idx in (0, m - 1):
                fs.append(s.bm.faces.new([rows[k][idx] for k in range(4)]))
        s._paint([v for r in rows for v in r], sw)

    def poly(s, pts, sw):
        f = s.bm.faces.new([s.bm.verts.new(p) for p in pts]); s._paint(f.verts, sw); return f

    def mesh(s, name, mat=None, flat=True):
        bmesh.ops.recalc_face_normals(s.bm, faces=s.bm.faces)
        me = bpy.data.meshes.new(name); s.bm.to_mesh(me); s.bm.free()
        me.materials.append(mat or s.k.PAL_M)
        for p in me.polygons: p.use_smooth = not flat
        return me


# ---------------- ของตกแต่งที่ใช้บ่อย (mesh ร่วม วางซ้ำได้) ----------------
def mesh_pine(k, trunk, leaf, snow=None, h=1.0, name="deco_pine"):
    m = k.mb(); m.cyl((0, 0, 0), (0, 0, 1.6 * h), 0.3, 0.22, trunk, n=6)
    for z, r, hh in ((1.2, 2.1, 2.6), (2.6, 1.65, 2.3), (3.9, 1.15, 2.0)):
        m.cyl((0, 0, z * h), (0, 0, (z + hh) * h), r, 0.05, leaf, n=7)
        if snow is not None: m.cyl((0, 0, (z + hh * 0.55) * h), (0, 0, (z + hh) * h + 0.02), r * 0.47, 0.04, snow, n=7)
    return m.mesh(name)


def mesh_oak(k, trunk, leaf1, leaf2, name="deco_oak", dead=False):
    m = k.mb(); m.cyl((0, 0, 0), (0, 0, 2.4), 0.34, 0.24, trunk, n=6)
    if dead:
        for a, l in ((0.3, 1.6), (2.4, 1.4), (4.2, 1.8)):
            m.cyl((0, 0, 2.0), (math.cos(a) * l, math.sin(a) * l, 3.4), 0.14, 0.03, trunk, n=4)
    else:
        m.ico((0, 0, 3.4), 1.9, leaf1, sc=(1.1, 1.0, 0.85))
        m.ico((0.9, 0.4, 2.9), 1.2, leaf2)
        m.ico((-0.8, -0.5, 3.0), 1.1, leaf1)
    return m.mesh(name)


def mesh_rock(k, sw, seed, sc=(1.0, 0.8, 0.65), name=None):
    m = k.mb(); m.ico((0, 0, 0.35), 1.0, sw, sc=sc, sub=1, jit=0.14, seed=seed)
    return m.mesh(name or "deco_rock%d" % seed)


def mesh_tuft(k, sws, name="deco_tuft", h=0.4, w=0.25):
    m = k.mb()
    for i in range(3):
        a = i * 2.1
        m.box((math.cos(a) * 0.08, math.sin(a) * 0.08, h / 2), (0.04, w, h), sws[i % len(sws)], rz=a)
    return m.mesh(name)


def mesh_flower(k, stem, head, name="deco_flower"):
    m = k.mb(); m.cyl((0, 0, 0), (0, 0, 0.35), 0.02, 0.02, stem, n=4)
    m.ico((0, 0, 0.38), 0.08, head, sub=0)
    return m.mesh(name)


def torus(m, c, R, r, sw, axis='Y', n=16, k=6):
    """ห่วง (เช่น ห่วงควิดดิช) จากท่อสั้นๆ เรียงเป็นวง — axis = แกนที่ห่วงหันหน้าไป"""
    cx, cy, cz = c
    pts = []
    for i in range(n):
        a = i / n * math.tau
        if axis == 'X': pts.append((cx, cy + R * math.cos(a), cz + R * math.sin(a)))
        elif axis == 'Y': pts.append((cx + R * math.cos(a), cy, cz + R * math.sin(a)))
        else: pts.append((cx + R * math.cos(a), cy + R * math.sin(a), cz))
    for i in range(n):
        m.cyl(pts[i], pts[(i + 1) % n], r, r, sw, n=k)
