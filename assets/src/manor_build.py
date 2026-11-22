# manor_build.py — stone manor house frames for Map Builder (user 2026-11-22: "build houses like this, Blender + breakable")
# Run:  "C:\Program Files (x86)\Steam\steamapps\common\Blender\blender.exe" -b --factory-startup --python assets/src/manor_build.py
# Out:  assets/mapkit/manor.glb (node mn_<id>, origin = footprint centre on the ground, front = +z in three)
#       assets/src/manor.blend • shots/manor_preview_front.png / _back.png (frames + grey stand-in walls)
# Spec: assets/src/manor_spec.json (shared with tools/manor-prefabs.mjs, which adds the breakable pn_wall walls,
#       gable triangles, glass and door). This file = the unbreakable part: roof, corner piers, chimneys, dormers, porch, bay, ivy.
# Geometry is authored in three.js coords (x right, y up, z front) and converted when the mesh is built.
import sys, os, math, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
import numpy as np
from mathutils import Vector
from _kit import reset, mat, palette, swuv, ROOT, export, save_blend, srgb

reset()
SP = json.load(open(os.path.join(ROOT, 'assets', 'src', 'manor_spec.json'), encoding='utf-8'))
T, P, SH = SP['T'], SP['P'], SP['SH']
TH = 0.22          # roof slab thickness
OV = 0.45          # eave overhang
GOV = 0.12         # roof past the gable wall (coping covers the end)
TILE = 2.0         # texture tile size (m)

# ---------------- textures ----------------
def img_from(name, arr):
    S = arr.shape[0]
    im = bpy.data.images.new(name, S, S, alpha=False)
    a = np.ones((S, S, 4), np.float32); a[:, :, :3] = np.clip(arr, 0, 1)
    im.pixels.foreach_set(a.ravel()); im.pack(); return im

def hx(h): return np.array(srgb(h), np.float32)

def masonry(name, seed, lo, hi, mortar, rows=(0.18, 0.34), blk=(0.28, 0.65), S=256):
    """ashlar courses that tile in both directions (2 m per tile)"""
    R = np.random.RandomState(seed); px = S / TILE
    img = np.zeros((S, S, 3), np.float32)
    hs = []; t = 0
    while t < TILE: h = R.uniform(*rows); hs.append(h); t += h
    hs = np.array(hs) * TILE / t
    y0 = 0
    for h in hs:
        ya, yb = int(round(y0 * px)), int(round((y0 + h) * px)); y0 += h
        ws = []; t = 0
        while t < TILE: w = R.uniform(*blk); ws.append(w); t += w
        ws = np.array(ws) * TILE / t; off = R.uniform(0, TILE)
        x = off
        for w in ws:
            c = lo + (hi - lo) * R.uniform(0, 1); c = c * R.uniform(0.94, 1.05)
            xa, xb = int(round(x * px)), int(round((x + w) * px)); x += w
            for xi in range(xa, xb):
                X = xi % S
                img[ya:yb, X] = c
                img[ya:min(ya + 2, yb), X] *= 0.86          # bottom edge shade (rows are bottom→top in Blender pixels)
                img[max(yb - 2, ya):yb, X] *= 1.08          # top edge highlight
            img[ya:yb, xa % S] = mortar; img[ya:yb, (xa + 1) % S] = mortar * 1.05
        img[ya:ya + 1, :] = mortar
    img *= 1 + (R.rand(S, S, 1).astype(np.float32) - 0.5) * 0.10
    return img_from(name, img)

def slate(name, seed, S=256):
    R = np.random.RandomState(seed); px = S / TILE; ch = 0.2
    img = np.zeros((S, S, 3), np.float32)
    lo, hi, moss, gap = hx('#454a55'), hx('#626976'), hx('#5f6a48'), hx('#25282e')
    for r in range(int(TILE / ch)):
        ya, yb = int(round(r * ch * px)), int(round((r + 1) * ch * px))
        x = R.uniform(0, 0.3) + (0.17 if r % 2 else 0)
        while x < TILE + 0.5:
            w = R.uniform(0.24, 0.36)
            c = lo + (hi - lo) * R.uniform(0, 1)
            if R.rand() < 0.05: c = c * 0.6 + moss * 0.4
            xa, xb = int(round(x * px)), int(round((x + w) * px))
            for xi in range(xa, xb):
                X = xi % S
                img[ya:yb, X] = c * np.linspace(0.82, 1.06, yb - ya)[:, None]   # each slate lighter toward its lower edge... (Blender rows bottom→top)
            img[ya:yb, xa % S] = gap
            x += w
        img[ya:ya + 2, :] = gap
    img *= 1 + (R.rand(S, S, 1).astype(np.float32) - 0.5) * 0.08
    return img_from(name, img)

STONE = mat('mn_stone', rough=0.92, img=masonry('mn_stone_img', 3, hx('#a79d88'), hx('#8a8272'), hx('#5f594f')), double=True)
QUOIN = mat('mn_quoin', rough=0.9, img=masonry('mn_quoin_img', 5, hx('#c4b89c'), hx('#a89d84'), hx('#6c665a'), rows=(0.3, 0.38), blk=(0.4, 0.8)), double=True)
SLATE = mat('mn_slate', rough=0.8, img=slate('mn_slate_img', 9), double=True)
for m in (STONE, QUOIN, SLATE):
    for n in m.node_tree.nodes:
        if n.type == 'TEX_IMAGE': n.interpolation = 'Linear'
#            0 ivy dark  1 ivy mid   2 ivy light 3 terracotta 4 wood dark 5 wood      6 iron      7 cope light
PALC = ['#24401f', '#335a28', '#4e7a34', '#a5583a', '#3f2e22', '#6b4e36', '#2c2e30', '#cfc4aa',
        '#7a7f86', '#5a5f66', '#8d3f2c', '#d9cfb8', '#1d2a1a', '#3c4a2c', '#b8ad94', '#ffffff']
IVY, IVY2, IVY3, POT, WOODD, WOOD, IRON, COPE, RIDGE, LEAD, POT2, SILL, IVYD, IVYO, STONEL = range(15)
PAL = mat('mn_pal', rough=0.85, img=palette('mn_pal_img', PALC), double=True)
GLASS = mat('mn_glass', '#2a3644', rough=0.15, emit='#ffb860', emit_k=0.7, double=True)
TEXM = {'mn_stone', 'mn_quoin', 'mn_slate'}

# ---------------- mesh builder (three coords → blender) ----------------
class G:
    def __init__(s):
        s.bm = bmesh.new(); s.uv = s.bm.loops.layers.uv.new('UVMap'); s.mats = [STONE, QUOIN, SLATE, PAL, GLASS]
        s.mi = {m.name: i for i, m in enumerate(s.mats)}
    def _v(s, p): return s.bm.verts.new((p[0], -p[2], p[1]))
    def face(s, pts, m, sw=None):
        vs = [s._v(p) for p in pts]
        try: f = s.bm.faces.new(vs)
        except ValueError: return None
        f.material_index = s.mi[m.name]
        f.normal_update(); n = Vector(f.normal); a = max(range(3), key=lambda i: abs(n[i]))   # blender axes: 0 x, 1 y(-z three), 2 z(up)
        for l, p in zip(f.loops, pts):
            if sw is not None: l[s.uv].uv = swuv(sw)
            elif m.name in TEXM:
                x, y, z = p
                u, v = (z, y) if a == 0 else ((x, y) if a == 1 else (x, z))
                l[s.uv].uv = (u / TILE, v / TILE)
            else: l[s.uv].uv = (0.5, 0.5)
        return f
    def solid(s, bot, n, th, m, sw=None, mtop=None):
        """prism: bottom polygon (list of 3D points, any planar n-gon) extruded th along n"""
        top = [tuple(Vector(p) + Vector(n) * th) for p in bot]; fs = []
        fs.append(s.face(list(reversed(bot)), m, sw)); fs.append(s.face(top, mtop or m, sw))
        k = len(bot)
        for i in range(k): fs.append(s.face([bot[i], bot[(i + 1) % k], top[(i + 1) % k], top[i]], m, sw))
        fs = [f for f in fs if f]
        bmesh.ops.recalc_face_normals(s.bm, faces=fs)
    def box(s, c, size, m, sw=None, ry=0.0):
        hx_, hy, hz = size[0] / 2, size[1] / 2, size[2] / 2; cs, sn = math.cos(ry), math.sin(ry)
        R = lambda x, z: (c[0] + x * cs + z * sn, c[2] - x * sn + z * cs)
        bot = []
        for x, z in ((-hx_, -hz), (hx_, -hz), (hx_, hz), (-hx_, hz)):
            X, Z = R(x, z); bot.append((X, c[1] - hy, Z))
        s.solid(bot, (0, 1, 0), size[1], m, sw)
    def cyl(s, c, r, h, m, sw=None, seg=10, axis='y', r2=None):
        r2 = r if r2 is None else r2; pts = []
        for i in range(seg):
            a = i / seg * math.tau; pts.append((math.cos(a), math.sin(a)))
        if axis == 'y': B = [(c[0] + x * r, c[1], c[2] + z * r) for x, z in pts]; Tp = [(c[0] + x * r2, c[1] + h, c[2] + z * r2) for x, z in pts]
        elif axis == 'x': B = [(c[0], c[1] + x * r, c[2] + z * r) for x, z in pts]; Tp = [(c[0] + h, c[1] + x * r2, c[2] + z * r2) for x, z in pts]
        else: B = [(c[0] + x * r, c[1] + z * r, c[2]) for x, z in pts]; Tp = [(c[0] + x * r2, c[1] + z * r2, c[2] + h) for x, z in pts]
        fs = [s.face(list(reversed(B)), m, sw), s.face(Tp, m, sw)]
        for i in range(seg): fs.append(s.face([B[i], B[(i + 1) % seg], Tp[(i + 1) % seg], Tp[i]], m, sw))
        fs = [f for f in fs if f]; bmesh.ops.recalc_face_normals(s.bm, faces=fs)
    def seg_cyl(s, a, b, r, m, sw=None, seg=8):
        """cylinder from point a to point b"""
        a, b = Vector(a), Vector(b); d = b - a; L = d.length; d.normalize()
        up = Vector((0, 1, 0)) if abs(d.y) < 0.9 else Vector((1, 0, 0))
        e1 = d.cross(up).normalized(); e2 = d.cross(e1).normalized()
        B = [tuple(a + (e1 * math.cos(i / seg * math.tau) + e2 * math.sin(i / seg * math.tau)) * r) for i in range(seg)]
        Tp = [tuple(Vector(p) + d * L) for p in B]
        fs = [s.face(list(reversed(B)), m, sw), s.face(Tp, m, sw)]
        for i in range(seg): fs.append(s.face([B[i], B[(i + 1) % seg], Tp[(i + 1) % seg], Tp[i]], m, sw))
        fs = [f for f in fs if f]; bmesh.ops.recalc_face_normals(s.bm, faces=fs)
    def build(s, name):
        bmesh.ops.remove_doubles(s.bm, verts=s.bm.verts, dist=1e-5)
        me = bpy.data.meshes.new(name); s.bm.to_mesh(me); s.bm.free()
        for m in s.mats: me.materials.append(m)
        for p in me.polygons: p.use_smooth = False
        ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob); return ob

V3 = lambda *a: Vector(a)

# ---------------- house ----------------
def sides(H):
    w, d = H['w'], H['d']
    return {'f': (V3(0, 0, d / 2), V3(1, 0, 0), V3(0, 0, 1), w - P), 'b': (V3(0, 0, -d / 2), V3(-1, 0, 0), V3(0, 0, -1), w - P),
            'r': (V3(w / 2, 0, 0), V3(0, 0, -1), V3(1, 0, 0), d - P), 'l': (V3(-w / 2, 0, 0), V3(0, 0, 1), V3(-1, 0, 0), d - P)}

def roof_fn(H):
    """underside height of the main roof at (x, z) (None = outside) + data"""
    w, d, wh, t = H['w'], H['d'], H['wh'], H['roof']['t']
    xo, zo = w / 2 + T / 2, d / 2 + T / 2
    if t == 'gable':
        tp = math.tan(math.radians(H['roof']['pitch']))
        return lambda x, z: wh + (zo - abs(z)) * tp, tp
    if t == 'pyr':
        tp = math.tan(math.radians(H['roof']['pitch']))
        return lambda x, z: wh + min(xo - abs(x), zo - abs(z)) * tp, tp
    wb = H['wb']; tp = (wb - wh) / (2 * zo)
    return lambda x, z: wh + (zo - z) * tp, tp

def build_house(H):
    g = G(); w, d, wh = H['w'], H['d'], H['wh']; t = H['roof']['t']
    xo, zo = w / 2 + T / 2, d / 2 + T / 2
    rf, tp = roof_fn(H); cp = 1 / math.sqrt(1 + tp * tp); sp = tp * cp      # cos / sin of the pitch
    lift = TH / cp                                                          # vertical thickness of a roof slab
    rtop = lambda x, z: rf(x, z) + lift
    R = random.Random(hash(H['id']) & 0xffff)
    S = sides(H)

    # --- corner piers (quoins), plinth + cap ---
    for sx in (-1, 1):
        for sz in (-1, 1):
            ph = (H['wb'] if (t == 'shed' and sz < 0) else wh) + 0.1
            g.box((sx * w / 2, ph / 2, sz * d / 2), (P, ph, P), QUOIN)
            g.box((sx * w / 2, 0.25, sz * d / 2), (P + 0.18, 0.5, P + 0.18), QUOIN)

    def slab(bot, n, m=SLATE, th=TH):
        g.solid(bot, n, th, m)

    def coping(a, b, n_up, wide=0.62):
        """stone coping strip along a sloped gable edge from a to b (points on the roof underside line, centre of the wall)"""
        a, b = Vector(a), Vector(b); along = (b - a).normalized(); side = along.cross(Vector(n_up)).normalized()
        bot = [a - side * wide / 2, a + side * wide / 2, b + side * wide / 2, b - side * wide / 2]
        g.solid([tuple(p) for p in bot], n_up, lift * cp + 0.2, QUOIN)

    # --- roof ---
    if t == 'gable':
        Yr = rf(0, 0); ye = wh - OV * tp
        xr = [(-(xo + GOV), xo + GOV)]
        cut = [((H['w'] - P) * (q['u'] - 0.5), q['w']) for q in H.get('xg', [])]
        for side_z in (1, -1):
            n = (0, cp, side_z * sp)
            segs = [(-(xo + GOV), xo + GOV, zo + OV)]
            if side_z > 0 and cut:     # front: eave strip removed in front of each cross gable (slab starts behind the wall)
                xs = [-(xo + GOV)]
                for cx, cw in sorted(cut): xs += [cx - cw / 2 - T / 2, cx + cw / 2 + T / 2]
                xs.append(xo + GOV); segs = []
                for i in range(0, len(xs) - 1):
                    segs.append((xs[i], xs[i + 1], zo + OV if i % 2 == 0 else zo - T))
            for x0, x1, z0 in segs:
                y0 = rf(0, z0)
                slab([(x0, y0, side_z * z0), (x1, y0, side_z * z0), (x1, Yr, 0), (x0, Yr, 0)], n)
        g.cyl((-(xo + GOV), Yr + lift - 0.02, 0), 0.15, 2 * (xo + GOV), PAL, RIDGE, seg=8, axis='x')     # ridge tiles
        for sx in (-1, 1):   # gable coping + kneelers + finial
            for sz in (-1, 1):
                coping((sx * w / 2, ye - 0.05, sz * (zo + OV)), (sx * w / 2, Yr, 0), (0, cp, sz * sp))
                g.box((sx * w / 2, wh - 0.05, sz * (zo + OV - 0.35)), (0.75, 0.55, 0.75), QUOIN)
            g.box((sx * w / 2, Yr + lift + 0.35, 0), (0.32, 0.7, 0.32), QUOIN)
            g.cyl((sx * w / 2, Yr + lift + 0.7, 0), 0.12, 0.25, QUOIN, seg=8, r2=0.02)
        # cross gables on the front slope
        for cx, cw in cut:
            xw = cw / 2 + T / 2; Yx = wh + xw * tp; zb = zo - (Yx - wh) / tp - 0.8
            for sx in (-1, 1):
                n = (sx * sp, cp, 0)
                xe = cx + sx * (xw + OV)
                slab([(xe, wh - OV * tp, zo + GOV + 0.15), (xe, wh - OV * tp, zb), (cx, Yx, zb), (cx, Yx, zo + GOV + 0.15)], n)
                a = Vector((cx + sx * (xw + OV * 0.6), wh - OV * 0.6 * tp, d / 2)); b = Vector((cx, Yx, d / 2))
                bot = [a + Vector((0, 0, -0.32)), a + Vector((0, 0, 0.36)), b + Vector((0, 0, 0.36)), b + Vector((0, 0, -0.32))]
                g.solid([tuple(p) for p in bot], tuple(Vector((sx * sp, cp, 0))), lift * cp + 0.2, QUOIN)
                g.box((cx + sx * (xw + 0.1), wh - 0.05, d / 2), (0.7, 0.5, 0.75), QUOIN)
            g.cyl((cx, Yx + lift - 0.02, zb), 0.13, zo + 0.5 - zb, PAL, RIDGE, seg=8, axis='z')
            g.box((cx, Yx + lift + 0.3, d / 2), (0.3, 0.6, 0.3), QUOIN)
            g.cyl((cx, Yx + lift + 0.6, d / 2), 0.11, 0.22, QUOIN, seg=8, r2=0.02)
    elif t == 'pyr':
        Ya = rf(0, 0); ye = wh - OV * tp; e = (xo + OV, zo + OV)
        corners = [(-e[0], e[1]), (e[0], e[1]), (e[0], -e[1]), (-e[0], -e[1])]
        nrm = [(0, cp, sp), (sp, cp, 0), (0, cp, -sp), (-sp, cp, 0)]
        for i in range(4):
            a, b = corners[i], corners[(i + 1) % 4]
            slab([(a[0], ye, a[1]), (b[0], ye, b[1]), (0, Ya, 0)], nrm[i])
        for c in corners:
            g.seg_cyl((c[0], ye + lift, c[1]), (0, Ya + lift, 0), 0.13, PAL, RIDGE)
        g.cyl((0, Ya + lift - 0.1, 0), 0.2, 0.4, PAL, IRON, seg=8, r2=0.1)
        g.cyl((0, Ya + lift + 0.3, 0), 0.04, 1.3, PAL, IRON, seg=6)
        g.cyl((0, Ya + lift + 1.0, 0), 0.13, 0.22, PAL, IRON, seg=8)
    else:   # shed (lean-to): one slope down to the front, stone triangles fill the sides above the side walls
        wb = H['wb']; n = (0, cp, sp)
        zf, zbk = zo + OV, -zo - 0.15
        slab([(-(xo + GOV), rf(0, zf), zf), (xo + GOV, rf(0, zf), zf), (xo + GOV, rf(0, zbk), zbk), (-(xo + GOV), rf(0, zbk), zbk)], n)
        for sx in (-1, 1):
            xa = sx * w / 2
            tri = [(xa - T / 2, wh, d / 2 - P / 2), (xa - T / 2, wh, -d / 2 + P / 2), (xa - T / 2, rf(0, -d / 2 + P / 2), -d / 2 + P / 2)]
            tri = [(xa - T / 2, wh, zo - T), (xa - T / 2, wh, -zo + T), (xa - T / 2, rf(0, -zo + T), -zo + T), (xa - T / 2, rf(0, zo - T), zo - T)]
            g.solid(tri, (1, 0, 0), T, STONE)
            coping((xa, rf(0, zf) - 0.05, zf), (xa, rf(0, zbk), zbk), n)
            g.box((xa, wh - 0.05, zo + OV - 0.35), (0.75, 0.55, 0.75), QUOIN)
        g.box((0, wb + 0.25, -d / 2), (w + P, 0.5, T + 0.2), QUOIN)        # back wall cap (top of the high back wall)

    # --- dormers (front slope) ---
    for u in H.get('dormers', []):
        cx = (w - P) * (u - 0.5); dw, dh = 1.5, 1.4
        zd = zo - 0.9; y0 = rtop(cx, zd); zbk = zd - (dh + 0.3) / tp - 0.2
        g.box((cx, y0 + (dh - 0.4) / 2, (zd + zbk) / 2), (dw, dh + 0.4, zd - zbk), STONE)
        g.face([(cx - 0.5, y0 + 0.1, zd + 0.02), (cx + 0.5, y0 + 0.1, zd + 0.02), (cx + 0.5, y0 + dh - 0.12, zd + 0.02), (cx - 0.5, y0 + dh - 0.12, zd + 0.02)], GLASS)
        for bx, by, sx_, sy_ in ((cx, y0 + 0.07, 1.16, 0.12), (cx, y0 + dh - 0.09, 1.16, 0.1), (cx - 0.55, y0 + dh / 2, 0.1, dh - 0.1), (cx + 0.55, y0 + dh / 2, 0.1, dh - 0.1), (cx, y0 + dh / 2, 0.07, dh - 0.2), (cx, y0 + dh * 0.55, 1.0, 0.06)):
            g.box((bx, by, zd + 0.04), (sx_, sy_, 0.08), PAL, COPE)
        dtp = math.tan(math.radians(50)); xw = dw / 2 + 0.12; Yd = y0 + dh + xw * dtp
        for sx in (-1, 1):
            n = (sx * math.sin(math.radians(50)), math.cos(math.radians(50)), 0)
            slab([(cx + sx * xw, y0 + dh, zd + 0.3), (cx + sx * xw, y0 + dh, zbk), (cx, Yd, zbk), (cx, Yd, zd + 0.3)], n, th=0.14)
        g.solid([(cx - dw / 2, y0 + dh, zd), (cx + dw / 2, y0 + dh, zd), (cx, Yd - 0.05, zd)], (0, 0, -1), 0.3, STONE)
        g.cyl((cx, Yd + 0.17, zbk), 0.09, zd + 0.3 - zbk, PAL, RIDGE, seg=6, axis='z')

    # --- chimneys ---
    chim_boxes = []
    for c in H.get('chim', []):
        if c['k'] == 'breast':
            O, U, N, L = S[c['side']]
            base = O + U * ((c['u'] - 0.5) * L)
            inner = base - N * (T / 2)
            top = rtop(inner.x, inner.z) + 1.25
            if t == 'gable' and c['side'] in 'lr': top = rf(0, 0) + lift + 1.0
            ry = math.atan2(N.x, N.z)
            bh = min(wh - 0.3, top - 2.0)
            cb = base + N * (T / 2 + 0.45); g.box((cb.x, bh / 2, cb.z), (1.9, bh, 0.9), STONE, ry=ry)
            g.box((cb.x + N.x * 0.03, 0.3, cb.z + N.z * 0.03), (2.05, 0.6, 0.98), QUOIN, ry=ry)
            sb = base + N * (T / 2 + 0.3)
            g.solid([tuple(V3(cb.x, bh, cb.z) + U * s1 + N * s2) for s1, s2 in ((-0.95, -0.45), (0.95, -0.45), (0.95, 0.45), (-0.95, 0.45))], (0, 1, 0), 0.25, QUOIN)
            st = base + N * (T / 2 + 0.32)
            g.box((st.x, (bh + top) / 2, st.z), (1.15, top - bh, 0.62), STONE, ry=ry)
            chim_boxes.append((cb, U, N, bh, top))
            cap = st; sw, sd = 1.15, 0.62
        else:
            cx = (w - P) * (c['u'] - 0.5); cz = 0 if t != 'shed' else -d / 2 + 1.0
            top = rtop(cx, cz) + 1.3; bot = wh
            g.box((cx, (bot + top) / 2, cz), (0.95, top - bot, 1.5) if t != 'shed' else (1.4, top - bot, 0.9), STONE)
            cap = V3(cx, 0, cz); ry = 0; sw, sd = (0.95, 1.5) if t != 'shed' else (1.4, 0.9)
        U2 = V3(math.cos(ry), 0, -math.sin(ry)); N2 = V3(math.sin(ry), 0, math.cos(ry))
        g.box((cap.x, top - 0.32, cap.z), (sw + 0.2, 0.14, sd + 0.2), QUOIN, ry=ry)
        g.box((cap.x, top + 0.06, cap.z), (sw + 0.14, 0.12, sd + 0.14), QUOIN, ry=ry)
        long_u = sw >= sd; n_p = 2 if max(sw, sd) < 1.3 else 3
        for i in range(n_p):
            f = (i - (n_p - 1) / 2) * (max(sw, sd) / n_p)
            p = cap + (U2 if long_u else N2) * f
            g.cyl((p.x, top + 0.12, p.z), 0.13, 0.42, PAL, POT if i % 2 == 0 else POT2, seg=10, r2=0.11)

    # --- porch (timber, gabled) ---
    if 'porch' in H:
        cx = (w - P) * (H['porch'] - 0.5); z1 = zo + 1.35; hb = 2.55; pw = 1.0
        for sx in (-1, 1):
            g.box((cx + sx * pw, hb / 2, z1), (0.18, hb, 0.18), PAL, WOODD)
            g.box((cx + sx * pw, hb + 0.08, (zo + z1) / 2 + 0.05), (0.16, 0.16, z1 - zo + 0.25), PAL, WOODD)
            g.box((cx + sx * pw, 0.08, z1), (0.32, 0.16, 0.32), QUOIN)
        g.box((cx, hb + 0.08, z1), (2 * pw + 0.2, 0.18, 0.16), PAL, WOODD)
        ptp = math.tan(math.radians(42)); xw = pw + 0.25; Yp = hb + 0.16 + xw * ptp
        for sx in (-1, 1):
            n = (sx * math.sin(math.radians(42)), math.cos(math.radians(42)), 0)
            slab([(cx + sx * xw, hb + 0.16, z1 + 0.3), (cx + sx * xw, hb + 0.16, zo - 0.25), (cx, Yp, zo - 0.25), (cx, Yp, z1 + 0.3)], n, th=0.14)
        g.solid([(cx - pw - 0.08, hb + 0.17, z1 + 0.1), (cx + pw + 0.08, hb + 0.17, z1 + 0.1), (cx, Yp - 0.02, z1 + 0.1)], (0, 0, 1), 0.06, PAL, WOOD)
        g.cyl((cx, Yp + 0.12, zo - 0.25), 0.08, z1 + 0.55 - zo, PAL, RIDGE, seg=6, axis='z')
        g.box((cx, 0.08, zo + 0.7), (2.4, 0.16, 1.5), QUOIN)                       # step

    # --- bay window (front, ground floor) ---
    if 'bay' in H:
        b = H['bay']; cx = (w - P) * (b['u'] - 0.5); bw = b['w']; bd = 0.9; fw = bw - 1.3
        pts = [(cx - bw / 2, zo - 0.05), (cx - fw / 2, zo + bd), (cx + fw / 2, zo + bd), (cx + bw / 2, zo - 0.05)]
        foot = lambda y, o=0.0: [(pts[0][0] - o, y, pts[0][1]), (pts[1][0] - o, y, pts[1][1] + o), (pts[2][0] + o, y, pts[2][1] + o), (pts[3][0] + o, y, pts[3][1])]
        g.solid(foot(0), (0, 1, 0), 0.8, QUOIN)
        g.solid(foot(0.8, 0.05), (0, 1, 0), 0.1, QUOIN)
        for i in range(3):
            a, c2 = pts[i], pts[i + 1]
            g.face([(a[0], 0.9, a[1]), (c2[0], 0.9, c2[1]), (c2[0], 2.45, c2[1]), (a[0], 2.45, a[1])], GLASS)
        for i, p in enumerate(pts):
            g.box((p[0], 1.675, p[1]), (0.2, 1.55, 0.2), QUOIN)
        for f in (1 / 3, 2 / 3):
            g.box((cx - fw / 2 + fw * f, 1.675, zo + bd), (0.1, 1.55, 0.12), QUOIN)
        for i in range(3):
            a, c2 = pts[i], pts[i + 1]
            g.box(((a[0] + c2[0]) / 2, 1.8, (a[1] + c2[1]) / 2), (math.hypot(c2[0] - a[0], c2[1] - a[1]), 0.06, 0.1), PAL, LEAD, ry=-math.atan2(c2[1] - a[1], c2[0] - a[0]))
        g.solid(foot(2.45, 0.04), (0, 1, 0), 0.35, QUOIN)
        ye = 2.8; yr = 3.45; o = 0.15
        F = [(pts[0][0] - o, ye, pts[0][1]), (pts[1][0] - o, ye, pts[1][1] + o), (pts[2][0] + o, ye, pts[2][1] + o), (pts[3][0] + o, ye, pts[3][1])]
        Rl, Rr = (cx - fw / 2 + 0.1, yr, zo), (cx + fw / 2 - 0.1, yr, zo)
        g.face([F[1], F[2], Rr, Rl], SLATE); g.face([F[0], F[1], Rl], SLATE); g.face([F[2], F[3], Rr], SLATE)
        g.face([F[0], Rl, Rr, F[3]], SLATE)

    # --- ivy (leaf cards on piers / chimney breasts / bay sides) ---
    def ivy(o, a, n, width, height, dens):
        o, a, n = Vector(o), Vector(a).normalized(), Vector(n).normalized(); up = Vector((0, 1, 0))
        ph = [R.uniform(0, 6) for _ in range(3)]
        top = lambda s: height * (0.55 + 0.25 * math.sin(s * 2.3 + ph[0]) + 0.15 * math.sin(s * 5.1 + ph[1]) + 0.1 * math.sin(s * 9.7 + ph[2]))
        cnt = int(width * height * 90 * dens)
        for _ in range(cnt):
            s = R.uniform(0, width); hmax = max(0.3, top(s / max(width, 0.1) * 3))
            y = hmax * (R.random() ** 0.7)
            if R.random() < 0.15: y = min(hmax * 1.25, y + R.uniform(0, 0.8))      # tendrils above the mass
            c = o + a * s + up * y + n * R.uniform(0.02, 0.12)
            r = R.uniform(0.09, 0.15) * (1.15 - 0.4 * y / max(hmax, 0.1)); ang = R.uniform(0, math.tau)
            e1 = (a * math.cos(ang) + up * math.sin(ang)); e2 = (a * -math.sin(ang) + up * math.cos(ang)); tilt = n * R.uniform(0.0, 0.08)
            pts = [c + e1 * r, c + e2 * r * 0.7 + tilt, c - e1 * r * 0.8, c - e2 * r * 0.7 + tilt]
            for q in pts: q.y = max(q.y, 0.02)
            col = R.choice((IVY, IVY, IVY2, IVY2, IVY3, IVYD, IVYO))
            g.face([tuple(p) for p in pts], PAL, col)
    for iv in H.get('ivy', []):
        kind, k, dens = iv
        if kind == 'pier':
            sx = -1 if 'l' in k else 1; sz = 1 if 'f' in k else -1
            px, pz = sx * w / 2, sz * d / 2; h = (wh if not (t == 'shed' and sz < 0) else H['wb']) * 0.92
            x0 = px - P / 2 if sx < 0 else px - P / 2 - 0.45                     # front/back face: outer edge -> 0.45 onto the wall
            ivy((x0, 0, pz + sz * P / 2), (1, 0, 0), (0, 0, sz), P + 0.45, h, dens)
            z0 = pz - sz * (P / 2 + 0.45)                                        # side face: from the wall to the outer edge
            ivy((px + sx * P / 2, 0, z0), (0, 0, sz), (sx, 0, 0), P + 0.45, h * 0.85, dens * 0.8)
        elif kind == 'chim' and k < len(chim_boxes):
            cb, U, N, bh, top = chim_boxes[k]
            ivy(cb - U * 0.95 + N * 0.45, U, N, 1.9, bh * 0.95, dens)
            ivy(cb - U * 0.95 - N * 0.45, N, -U, 0.9, bh * 0.7, dens * 0.8)
        elif kind == 'bay' and 'bay' in H:
            b = H['bay']; cx = (w - P) * (b['u'] - 0.5)
            ivy((cx - b['w'] / 2 - 0.9, 0, zo + 0.02), (1, 0, 0), (0, 0, 1), 0.95, 2.6, dens)
    return g.build('mn_' + H['id'])

objs = [build_house(H) for H in SP['houses']]

# ---------------- preview: stand-in walls (not exported), row of houses ----------------
def standin(H, off):
    g = G(); w, d, wh = H['w'], H['d'], H['wh']
    for k, (O, U, N, L) in sides(H).items():
        hh = H['wb'] if (H['roof']['t'] == 'shed' and k == 'b') else wh
        c = O; ry = math.atan2(N.x, N.z)
        g.box((c.x, hh / 2, c.z), (L, hh, T), STONE, ry=ry)
    if H['roof']['t'] == 'gable':
        rf, tp = roof_fn(H)
        for sx in (-1, 1):
            g.solid([(sx * w / 2 - T / 2, wh, d / 2), (sx * w / 2 - T / 2, wh, -d / 2), (sx * w / 2 - T / 2, rf(0, 0), 0)], (1, 0, 0), T, STONE)
        for q in H.get('xg', []):
            cx = (w - P) * (q['u'] - 0.5); xw = q['w'] / 2
            g.solid([(cx - xw, wh, d / 2 - T / 2), (cx + xw, wh, d / 2 - T / 2), (cx, wh + (xw + T / 2) * tp - 0.05, d / 2 - T / 2)], (0, 0, 1), T, STONE)
    ob = g.build('standin_' + H['id']); ob.location = off; return ob

x = 0; tmp = []
for H, ob in zip(SP['houses'], objs):
    x += H['w'] / 2 + 2.5; off = (x, 0, 0); ob.location = off; tmp.append(standin(H, off)); x += H['w'] / 2 + 2.5
mid = x / 2
sc = bpy.context.scene
sc.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE_NEXT'
sc.render.resolution_x, sc.render.resolution_y = 1800, 640
sc.view_settings.view_transform = 'Standard'
wd = bpy.data.worlds.new('w'); sc.world = wd; wd.use_nodes = True
wd.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.62, 0.72, 1); wd.node_tree.nodes['Background'].inputs[1].default_value = 0.9
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 3.2; sc.collection.objects.link(sun)
sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(-35))
gnd = bpy.data.meshes.new('gnd'); gnd.from_pydata([(-20, -40, 0), (x + 20, -40, 0), (x + 20, 40, 0), (-20, 40, 0)], [], [(0, 1, 2, 3)])
go = bpy.data.objects.new('gnd', gnd); sc.collection.objects.link(go); gnd.materials.append(mat('gnd', '#6f7a52'))
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 35
os.makedirs(os.path.join(ROOT, 'shots'), exist_ok=True)
for name, pos in (('front', (mid, -mid * 0.95, mid * 0.42)), ('back', (mid, mid * 0.95, mid * 0.5))):
    cam.location = pos
    dirv = Vector((mid, 0, 4)) - Vector(pos); cam.rotation_euler = dirv.to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(ROOT, 'shots', 'manor_preview_' + name + '.png'); bpy.ops.render.render(write_still=True)
# close-up of the manor
for i, (H, ob) in enumerate(zip(SP['houses'], objs)):
    if H['id'] != 'manor': continue
    c = ob.location; cam.location = (c[0] - 9, c[1] - 17, 8); dirv = Vector((c[0], c[1], 4.5)) - cam.location
    cam.rotation_euler = dirv.to_track_quat('-Z', 'Y').to_euler(); sc.render.resolution_x, sc.render.resolution_y = 1200, 800
    sc.render.filepath = os.path.join(ROOT, 'shots', 'manor_preview_close.png'); bpy.ops.render.render(write_still=True)

for ob in objs: ob.location = (0, 0, 0)
for ob in tmp: bpy.data.objects.remove(ob)
bpy.data.objects.remove(go); bpy.data.objects.remove(cam); bpy.data.objects.remove(sun)
size = export(objs, 'assets/mapkit/manor.glb')
save_blend('assets/src/manor.blend')
info = {}
for H, ob in zip(SP['houses'], objs):   # bbox in three coords: Map Builder centres kit models on their bbox (tools/manor-prefabs.mjs offsets them back)
    vs = [v.co for v in ob.data.vertices]; X = [v.x for v in vs]; Y = [v.z for v in vs]; Z = [-v.y for v in vs]
    info[H['id']] = {'tris': sum(len(p.vertices) - 2 for p in ob.data.polygons), 'x': [round(min(X), 3), round(max(X), 3)], 'y': [round(min(Y), 3), round(max(Y), 3)], 'z': [round(min(Z), 3), round(max(Z), 3)]}
json.dump(info, open(os.path.join(ROOT, 'assets', 'mapkit', 'manor.info.json'), 'w'), indent=1)
print('MANOR', size, json.dumps(info))
