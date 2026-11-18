# dark_scythe_build.py — เคียวลอยของสาย Darkness (ผู้ใช้ 2026-11-18 ref: designs/darkness_ref/scythe_ref.png)
# รอบ 2: หัวด้านหลัง (C กลับหัว + หนามกลาง + แหว่งตรงกลางบน) ลอกเส้นรอบรูปจาก ref → assets/src/dark_scythe_trace.json
#        ใบมีดปั้นเอง: โค้งน้อย ไม่งุ้มลงมาก • ไล่สีหลายชั้น (สันดำ → เทาเงิน → คมเงินสว่าง) + บางลงหาคม
# รัน: blender -b --factory-startup --python assets/src/dark_scythe_build.py
#  → assets/models/dark_scythe.glb + assets/src/dark_scythe.blend
# พิกัด Blender (z ขึ้น) • ด้ามแกน z ปลายแหลมล่างที่ z=0 • ใบมีดไป +x • ยาวรวม ~2.2 ม.
import bpy, bmesh, math, sys, os, json
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import reset, mat, export, save_blend, hexcol, ROOT

reset()
TR = json.load(open(os.path.join(ROOT, 'assets/src/dark_scythe_trace.json')))
M_BLACK = mat('sc_black', '#070709', rough=0.3, metal=0.75)   # รอบ 7: ตัวเคียวดำสนิท
M_PLATE = mat('sc_plate', '#121318', rough=0.24, metal=0.8)
M_TRIM = mat('sc_trim', '#3a3d45', rough=0.2, metal=0.85)   # ลายนูนบนใบ: เทาเข้มพอให้เห็นบนดำสนิท
M_BTOP = mat('sc_btop', '#060608', rough=0.22, metal=0.8)   # รอบ 9: ใบชั้นบนดำสนิท
M_ACC = mat('sc_accent', '#0c0c10', rough=0.25, metal=0.9)   # ผู้ใช้รอบ 5: ดำทั้งหมด (ไม่มีน้ำเงิน)


def vcol_mat(name, rough=0.22, metal=0.92):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bs = nt.nodes.get('Principled BSDF')
    ca = nt.nodes.new('ShaderNodeVertexColor')
    ca.layer_name = 'Col'
    nt.links.new(ca.outputs['Color'], bs.inputs['Base Color'])
    bs.inputs['Roughness'].default_value = rough
    bs.inputs['Metallic'].default_value = metal
    return m


M_BLADE = vcol_mat('sc_blade', rough=0.3, metal=0.55)
COL = bpy.context.scene.collection
OBJS = []


def new_obj(name, bm, mats):
    name = name.replace('_', '-')   # _preview.py ซ่อนชื่อที่ลงท้าย _เลข (ถือเป็นตัวเลือก) → ใช้ - แทน
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    ob = bpy.data.objects.new(name, me)
    COL.objects.link(ob)
    OBJS.append(ob)
    return ob


def flat_part(name, pts, th, m, y0=0.0, bev=0.01, slope=0.6):
    """แผ่นจากเส้นรอบรูป (x,z) แบบ "เรียวมาประกบกัน" (ผู้ใช้รอบ 6): ขอบบางแหลม หนาขึ้นเข้าหากลาง (หน้าตัดเพชร) ไม่ใช่แผ่นหนาขอบตั้ง
    ความหนาแต่ละจุด = min(th, 2·slope·ระยะถึงขอบ) • สันกลางเกิดเองตามแนวกลางรูป"""
    bm = bmesh.new()
    vs = [bm.verts.new((x, 0, z)) for x, z in pts]
    es = [bm.edges.new((vs[i], vs[(i + 1) % len(vs)])) for i in range(len(vs))]
    bmesh.ops.triangle_fill(bm, use_beauty=True, use_dissolve=False, edges=es, normal=Vector((0, -1, 0)))
    for _ in range(3):
        bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if e.calc_length() > 0.02], cuts=1, use_grid_fill=True)
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bmesh.ops.beautify_fill(bm, faces=bm.faces[:], edges=bm.edges[:])
    seg = [(Vector((pts[i][0], pts[i][1])), Vector((pts[(i + 1) % len(pts)][0], pts[(i + 1) % len(pts)][1]))) for i in range(len(pts))]
    def dist(x, z):
        p = Vector((x, z))
        best = 9
        for a, b in seg:
            ab = b - a
            t = max(0, min(1, (p - a).dot(ab) / max(1e-9, ab.length_squared)))
            best = min(best, (a + ab * t - p).length)
        return best
    front = list(bm.faces)
    D = {v: dist(v.co.x, v.co.z) for v in bm.verts}
    ret = bmesh.ops.duplicate(bm, geom=front)
    back = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMFace)]
    vmap = ret['vert_map']
    for v, d in list(D.items()):
        h = min(th / 2, slope * d)
        v.co.y = y0 + h
        vb = vmap[v]
        vb.co.y = y0 - h
    bmesh.ops.reverse_faces(bm, faces=back)
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return new_obj(name, bm, [m])


def lathe(name, prof, sides, m, rot=0.0):
    bm = bmesh.new()
    rings = []
    for r, z in prof:
        rings.append([bm.verts.new((math.cos(rot + s / sides * math.tau) * r, math.sin(rot + s / sides * math.tau) * r, z)) for s in range(sides)])
    for i in range(len(rings) - 1):
        for s in range(sides):
            s2 = (s + 1) % sides
            bm.faces.new((rings[i][s], rings[i][s2], rings[i + 1][s2], rings[i + 1][s]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj(name, bm, [m])


# ---------- ด้าม + ปลอกล่าง จากความกว้างใน ref ----------
prof = sorted(TR['prof'], key=lambda p: p[0])     # [z, halfwidth, center-x]
HZ = min(p[1] for p in TR['head'])
NECK = [p for p in prof if p[0] > 0.5 and p[1] > 0.024]          # ปลอกคอใต้หัว (กว้างกว่าด้าม)
zs1 = min(p[0] for p in NECK) if NECK else HZ - 0.3
zs0 = 0.45                                                       # บนการ์ดเพชรล่าง
butt = [(0.0002, 0.0)] + [(max(0.0005, p[1]), p[0]) for p in prof if p[0] <= zs0 + 0.01]
lathe('butt', butt, 4, M_BLACK, rot=0)            # การ์ดเพชร + หนามแหลม 4 เหลี่ยม
shaft = lathe('shaft', [(0.0002, zs0 - 0.01)] + [(0.0165, zs0 + k * (zs1 - zs0) / 60) for k in range(61)] + [(0.0002, zs1 + 0.02)], 8, M_BLACK)
tw = shaft.modifiers.new('tw', 'SIMPLE_DEFORM')
tw.deform_method = 'TWIST'
tw.deform_axis = 'Z'
tw.angle = math.radians(2000)
collar = [(min(0.03, max(0.0005, p[1] * 0.85)), p[0]) for p in prof if zs1 - 0.01 <= p[0] <= HZ + 0.03]
lathe('collar', collar + [(0.0002, collar[-1][1] + 0.005)], 4, M_BLACK, rot=0)

# ---------- หัวด้านหลัง (ลอกจาก ref) ----------
head = TR['head']
flat_part('head', head, 0.075, M_BLACK, slope=0.45)
# แผ่นนูนสองหน้า (ย่อจากเส้นรอบหัวเข้าหาจุดกลาง) ให้เห็นชั้นโลหะ
cx = sum(p[0] for p in head) / len(head)
cz = sum(p[1] for p in head) / len(head)
for sd in (1, -1):
    inner = [(cx + (x - cx) * 0.78, cz + (z - cz) * 0.78) for x, z in head]
    flat_part('plate_%d' % (sd > 0), inner, 0.03, M_PLATE, y0=sd * 0.018, slope=0.35)
for sd in (1, -1):   # วงกลมซ้อนนูน (ลายในรูป)
    for r, off, mm in ((0.05, 0.038, M_PLATE), (0.032, 0.046, M_BLACK)):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=24, radius1=r, radius2=r * 0.92, depth=0.012)
        for v in bm.verts:
            v.co = Vector((v.co.x - 0.0, v.co.z, v.co.y))
        for v in bm.verts:
            v.co = Vector((v.co.x - 0.02, sd * off + v.co.y * sd, v.co.z + 1.97))
        new_obj('boss_%d_%d' % (sd > 0, int(r * 1000)), bm, [mm])
# ---------- ใบมีด (รอบ 4 ผู้ใช้ 2026-11-18): 2 ชั้นชัด — ชั้นบนแผ่นดำลายนูน/เว้า • ชั้นล่างใบเงินบางลงหาคม • โคนใบกลืนเข้าหัว ----------
def crv(pts, t):
    n = len(pts) - 1
    f = min(n - 1e-6, max(0.0, t * n))
    i = int(f)
    u = f - i
    P = [pts[max(0, i - 1)], pts[i], pts[i + 1], pts[min(n, i + 2)]]
    def cr(a, b, c, d):
        return 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u)
    return Vector((cr(*[q[0] for q in P]), 0, cr(*[q[1] for q in P])))


# ครึ่งแรกเกือบตรง → หลัง ~50% โค้งลง → ปลายลงระดับหนามใต้หัว • ใบเรียวกว่ารอบก่อน
# รอบ 7 (ผู้ใช้): โค้งให้ smooth — ความโค้งค่อย ๆ เริ่มที่ 20% แล้วโค้งจริงตั้งแต่ 50% • โค้งลงน้อยลง ปลายชี้ไปด้านหน้านิด ๆ
#   ใบเริ่มเล็กลงแล้วเรียวแหลมที่ปลาย • สร้างสันจากการไล่มุม (curvature) ทีละช่วงเล็ก ๆ แล้วคมห่างจากสันตามความกว้าง
# รอบ 8 (ผู้ใช้): ทรงครึ่งวงกลม — ความโค้งเริ่มสะสมตั้งแต่โคน (ช่วงลาย) ใบแค่สานต่อ ขึ้นนิดเดียวแล้วโค้งลงแบบ smooth
#   ความกว้างคงไว้ ค่อยแคบลงเล็กน้อย แล้วเริ่มเรียวแหลมที่ 80% • 3 แบบให้เลือก: --  A | B | C
VARS = {
    'A': dict(a0=12, turn=74, prof=lambda u: 1.0, w0=0.27, w80=0.16, S=1.20),                 # วงโค้งสม่ำเสมอ (ครึ่งวงกลมแท้)
    'B': dict(a0=8, turn=66, prof=lambda u: 0.45 + 0.55 * u, w0=0.28, w80=0.18, S=1.22),     # โค้งน้อยที่โคน ค่อย ๆ มากขึ้นไปทางปลาย
    'C': dict(a0=6, turn=86, prof=lambda u: 0.7 + 0.3 * u * u, w0=0.30, w80=0.20, S=1.30),   # เสี้ยวพระจันทร์กว้าง ปลายงุ้มกว่า
}
VAR = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'A'   # ผู้ใช้เลือกโค้งแบบ A
CFG = VARS[VAR]


def _blade_lines(n=80, root=(0.04, 2.17)):
    c = CFG
    ws = [c['prof'](i / n) for i in range(n + 1)]
    tot = sum(ws)
    sp, ed = [], []
    x, z, a = root[0], root[1], math.radians(c['a0'])
    for i in range(n + 1):
        u = i / n
        w = c['w0'] * (1 - 0.42 * u) * max(0.0, 1 - u ** 2.4) ** 1.05   # รอบ 9: แคบลงนุ่ม ๆ ตลอดใบ แล้วคมโค้งเข้าหาสันเป็นปลายแหลมยาว (ไม่เป็นลิ่ม)
        nx, nz = math.sin(a), -math.cos(a)
        sp.append((x, z))
        ed.append((x + nx * (w + 0.002), z + nz * (w + 0.002)))
        a -= math.radians(c['turn']) * ws[i] / tot
        x += math.cos(a) * c['S'] / n
        z += math.sin(a) * c['S'] / n
    return sp, ed


SPINE, EDGE = _blade_lines()
M_SILV = vcol_mat('sc_silver', rough=0.22, metal=0.5)
M_HOLE = mat('sc_hole', '#030304', rough=0.9, metal=0.0)


def band(name, t0, t1, k0f, k1f, thf, m, colf=None, NT=48, NK=10):
    """แผ่นตามแนวใบ: t ตามความยาว, k จากสัน(0)→คม(1) • thf(t,u) = ความหนา (u = ตำแหน่งในแถบ 0..1) • colf(t,u) = สีจุด"""
    bm = bmesh.new()
    cl = bm.loops.layers.color.new('Col') if colf else None
    G = {}
    for i in range(NT + 1):
        t = t0 + (t1 - t0) * i / NT
        S, E = crv(SPINE, t), crv(EDGE, t)
        k0, k1 = k0f(t), k1f(t)
        for j in range(NK + 1):
            u = j / NK
            P = S.lerp(E, k0 + (k1 - k0) * u)
            th = max(0.0005, thf(t, u))
            for sd in (1, -1):
                G[(i, j, sd)] = bm.verts.new((P.x, sd * th / 2, P.z))
    F = []
    for sd in (1, -1):
        for i in range(NT):
            for j in range(NK):
                q = [G[(i, j, sd)], G[(i + 1, j, sd)], G[(i + 1, j + 1, sd)], G[(i, j + 1, sd)]]
                F.append(bm.faces.new(q if sd > 0 else list(reversed(q))))
    for i in range(NT):
        for j in (0, NK):
            q = [G[(i, j, 1)], G[(i + 1, j, 1)], G[(i + 1, j, -1)], G[(i, j, -1)]]
            F.append(bm.faces.new(q if j == 0 else list(reversed(q))))
    for i, rev in ((0, False), (NT, True)):
        for j in range(NK):
            q = [G[(i, j, 1)], G[(i, j + 1, 1)], G[(i, j + 1, -1)], G[(i, j, -1)]]
            F.append(bm.faces.new(list(reversed(q)) if rev else q))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if cl:
        inv = {}
        for (i, j, sd), v in G.items():
            inv[v] = (t0 + (t1 - t0) * i / NT, j / NK)
        for f in bm.faces:
            for lp in f.loops:
                t, u = inv[lp.vert]
                lp[cl] = colf(t, u)
    return new_obj(name, bm, [m])


g = lambda x, c, w: math.exp(-((x - c) / w) ** 2)
def KB(t):   # เส้นแบ่งชั้น: โคนใบดำเต็มความกว้าง (กลืนกับหัว) แล้วตัดเฉียงลงเผยใบเงิน • ช่วงโคนเป็นขั้นบันได แล้วเรียบ
    k = 0.50 - 0.16 * t + 0.02 * math.sin(t * 30) * (t < 0.6)   # รอบ 5: ไม่เป็นเหลี่ยม — คลื่นนุ่มแทนขั้นบันได
    k = min(1.0, k + (1 - k) * max(0.0, 1 - t / 0.13) ** 1.3)
    return k * (1 - max(0.0, (t - 0.72) / 0.26) ** 1.5) if t > 0.72 else k   # ปลายใบชั้นบนเรียวหายไปกับสัน (ไม่แยกเป็นสองปลาย)


def thA(t, u):   # ชั้นบน: สันนูน + ขอบล่างนูน + ร่องเว้ากลาง • โคนหนาเท่าหัวเพื่อกลืนกัน
    base = 0.052 * (1 - t) ** 1.2 + 0.016 if t < 0.12 else 0.036 * (1 - 0.75 * t)
    if t < 0.12:   # โคนหนาเท่าหัว+แผ่นข้าง (กลืนรอยต่อ) แล้วค่อยบาง
        base = 0.078 - (0.078 - 0.036 * (1 - 0.75 * 0.12)) * (t / 0.12) ** 0.7
    return base * (0.12 + 0.88 * min(1.0, u / 0.22) ** 0.8) * (1 + 0.22 * g(u, 0.93, 0.06) - 0.25 * g(u, 0.55, 0.15))   # สันบนเรียวแหลม (ไม่ตัดตั้ง)


LEN = [(0.0, '#121216'), (0.5, '#3d4046'), (1.0, '#6e727a')]   # รอบ 9: ไล่ตามความยาว ต้นดำเข้ม → กลางเทาดำ → ปลายออกเทา


def lenc(t):
    for i in range(len(LEN) - 1):
        a, ca = LEN[i]
        b, cb = LEN[i + 1]
        if t <= b:
            w = (t - a) / (b - a)
            A, B = hexcol(ca), hexcol(cb)
            return [A[j] + (B[j] - A[j]) * w for j in range(3)]
    return list(hexcol(LEN[-1][1]))[:3]


def colA(t, u):   # ชั้นบนไล่ตามความยาวเหมือนกัน แต่เข้มกว่า
    return [c * 0.45 for c in lenc(t)] + [1.0]


def void_mat(name):   # ดำ 0% แสง: Background shader → glTF ส่งออกเป็น KHR_materials_unlit (three = MeshBasicMaterial ดำ ไม่รับแสง/สะท้อน)
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    bg = nt.nodes.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value = (0, 0, 0, 1)
    bg.inputs['Strength'].default_value = 1.0
    nt.links.new(bg.outputs['Background'], out.inputs['Surface'])
    return m


M_VOID = void_mat('sc_void')   # รอบ 10 (ผู้ใช้ ref scythe_void_ref.png): ชั้นบนดำสนิท 0% แสง — ในเกมสลับเป็นวัสดุไม่รับแสง + VFX สสารมืดไหลออก
band('blade_top', 0.0, 0.98, lambda t: 0.0, lambda t: max(0.02, KB(t)), thA, M_VOID)


def thB(t, u):   # ชั้นล่าง: บางกว่าชั้นบน (เห็นขั้นชัด) แล้วบางจนคม
    return (0.017 * (1 - 0.7 * t)) * (1 - u) ** 0.75 + 0.0006


SILV = [(0.0, '#2c2e34'), (0.09, '#101114'), (0.15, '#2a2c32'), (0.5, '#33363c'), (0.82, '#42454c'), (1.0, '#575b63')]   # ชั้นล่างเทาดำเข้ม   # รอบ 6: เทาดำ แต่สว่างพอเห็นชั้น   # รอบ 5: เทาดำเข้ม คมสว่างขึ้นนิดเดียว   # ร่องดำแคบใต้ชั้นบน แล้วไล่เงินสว่างหาคม


def colB(t, u):
    base = lenc(t)
    k = 0.55 if 0.07 < u < 0.14 else 1.0 + 0.45 * max(0.0, u - 0.6) / 0.4   # ร่องมืดใต้ชั้นบน • ใกล้คมสว่างขึ้นนิด
    return [min(1, c * k) for c in base] + [1.0]


band('blade_edge', 0.0, 1.0, lambda t: max(0.0, KB(t) - 0.04), lambda t: 1.0, thB, M_SILV, colB, NT=56, NK=12)

# ลายนูนบนชั้นบน (ทั้งสองหน้า): วงรีนูนใกล้โคน + กรอบสี่เหลี่ยมฝัง + เส้นน้ำเงินบางตามรอยแบ่งชั้นช่วงโคน
def on_blade(t, k, side, lift):
    S, E = crv(SPINE, t), crv(EDGE, t)
    P = S.lerp(E, k)
    return Vector((P.x, side * (thA(t, k / max(0.01, KB(t))) / 2 + lift), P.z))


for sd in ():   # รอบ 10: ปิดรูวงรี/เส้นบนชั้นบน (ดำสนิทล้วน)
    c = on_blade(0.27, 0.24, sd, 0.0)   # รูวงรี (ถัดจากแผ่นลาย)
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=False, segments=24, radius=1.0)
    ring = list(bm.verts)
    for v in ring:
        x, z = v.co.x, v.co.y
        v.co = Vector((c.x + x * 0.045, c.y, c.z + z * 0.028))
    ex = bmesh.ops.extrude_edge_only(bm, edges=list(bm.edges))
    for v in [e for e in ex['geom'] if isinstance(e, bmesh.types.BMVert)]:
        v.co = c + (v.co - c) * 0.62 + Vector((0, sd * 0.006, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    new_obj('oval_%d' % (sd > 0), bm, [M_BLACK])
    # เส้นน้ำเงินตามรอยแบ่งชั้น (โคน → 25%)
    pts = [on_blade(0.01 + 0.24 * i / 14, KB(0.01 + 0.24 * i / 14) - 0.02, sd, 0.002) for i in range(15)]
    bm = bmesh.new()
    top = [bm.verts.new(p + Vector((0, 0, 0.004))) for p in pts]
    bot = [bm.verts.new(p - Vector((0, 0, 0.004))) for p in pts]
    for i in range(14):
        f = bm.faces.new((bot[i], bot[i + 1], top[i + 1], top[i]) if sd > 0 else (top[i], top[i + 1], bot[i + 1], bot[i]))
    new_obj('vein_%d' % (sd > 0), bm, [M_ACC])

# (รอบ 10: เอาแผ่นลายโคนใบออก)

# รอบ 9: ลายบนใบชั้นบน (ผู้ใช้: "ด้านบนดูโล่ง") — สันนูนเส้นยาว + ร่องเว้า + หนามเล็กบนสัน + เพชรฝังเรียงตามรอยแบ่งชั้น
def strip(name, t0, t1, kf, wk, lift, m, n=40):
    for sd in (1, -1):
        bm = bmesh.new()
        A, B = [], []
        for i in range(n + 1):
            t = t0 + (t1 - t0) * i / n
            k = kf(t)
            kb = max(0.05, KB(t))
            yy = sd * (thA(t, min(1, k / kb)) / 2 + lift)
            for kk, L in ((k - wk / 2, A), (k + wk / 2, B)):
                x, z = bpt(t, kk)
                L.append(bm.verts.new((x, yy, z)))
        for i in range(n):
            q = (A[i], A[i + 1], B[i + 1], B[i])
            bm.faces.new(q if sd < 0 else tuple(reversed(q)))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        new_obj('%s_%d' % (name, sd > 0), bm, [m])


#strip('ridge', 0.04, 0.86, lambda t: 0.07, 0.025, 0.003, M_TRIM)                 # สันนูนเส้นยาวตามสัน
#strip('groove', 0.3, 0.78, lambda t: 0.5 * KB(t), 0.03, 0.001, M_HOLE)          # ร่องเว้ากลางแผ่นบน
#strip('ridge2', 0.3, 0.8, lambda t: 0.5 * KB(t) + 0.04, 0.012, 0.002, M_TRIM)  # ขอบร่อง
# (รอบ 10: เอาเพชรฝัง/หนามบนสันออก — ชั้นบนเป็นดำสนิท ให้ VFX สสารมืดทำหน้าที่แทนลาย)

# หมุดโคนใบ
for sd in (1, -1):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=0.016)
    c = on_blade(0.03, 0.75, sd, 0.0)
    for v in bm.verts:
        v.co += c
    new_obj('rivet_%d' % (sd > 0), bm, [M_PLATE])

for ob in OBJS:
    for p in ob.data.polygons:
        p.use_smooth = True
    try:
        ob.data.set_sharp_from_angle(angle=math.radians(60))
    except Exception:
        pass

# ข้อมูลแนวใบ/ด้าม ให้ VFX สสารมืด (studio/darkness-scythe.js) — พิกัด three: x = x, y = z ของ Blender
json.dump({'spine': [[round(crv(SPINE, i / 40).x, 4), round(crv(SPINE, i / 40).z, 4)] for i in range(41)],
           'edge': [[round(crv(EDGE, i / 40).x, 4), round(crv(EDGE, i / 40).z, 4)] for i in range(41)],
           'kb': [round(KB(i / 40), 4) for i in range(41)], 'shaft': [round(zs0, 4), round(zs1, 4)], 'top': 2.25},
          open(os.path.join(ROOT, 'assets/vfx/dark_scythe.lines.json'), 'w'))
bpy.context.view_layer.update()
sz = export(OBJS, 'assets/vfx/dark_scythe.glb' if VAR == 'A' else 'shots/dark_scythe_%s.glb' % VAR)
save_blend('assets/src/dark_scythe%s.blend' % ('' if VAR == 'A' else '_' + VAR))
print('dark_scythe.glb', sz, 'bytes', len(OBJS), 'objects')
