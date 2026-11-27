# shibuya_build.py — Shibuya scramble crossing (night test map) kit, built from real OpenStreetMap footprints
# Run:  python assets/src/shibuya_tex.py   (textures, Pillow)  then
#       "C:\Program Files (x86)\Steam\steamapps\common\Blender\blender.exe" -b --factory-startup --python assets/src/shibuya_build.py
# Out:  assets/mapkit/shibuya.glb (nodes sbb_<osm id> = one building each, origin = footprint centroid at ground;
#       sb_street / sb_marks / sb_rail = street furniture, road markings, elevated rail — origin = map centre)
#       assets/src/shibuya_place.json (node → map position, used by tools/shibuya-demo.mjs) • assets/src/shibuya.blend
# Data © OpenStreetMap contributors (ODbL) via shibuya_prep.py. Shop/sign words are generic nouns, no real brands or logos.
# Axes: map metres (x east, z south). Blender: X = x, Y = -z, Z = up (glTF export y-up → game x, y, z).
import sys, os, math, random, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector as V
from _kit import reset, hexcol, ROOT, HERE, save_blend

reset()
D = json.load(open(os.path.join(HERE, 'shibuya_data.json'), encoding='utf8'))
W, H = D['W'], D['H']; CX, CZ = D['cross']
TEXD = os.path.join(HERE, 'shibuya_tex')
RND = random.Random(42)


# ---------------- materials ----------------
def img(n, data=False):
    im = bpy.data.images.load(os.path.join(TEXD, n)); im.pack()
    if data: im.colorspace_settings.name = 'Non-Color'
    return im


def tmat(name, base, emis=None, ek=1.0, rough=0.85, metal=0.0, interp='Linear'):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; bs = nt.nodes.get('Principled BSDF')
    bs.inputs['Roughness'].default_value = rough; bs.inputs['Metallic'].default_value = metal
    if isinstance(base, str): bs.inputs['Base Color'].default_value = hexcol(base)
    else:
        tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = base; tx.interpolation = interp; nt.links.new(tx.outputs['Color'], bs.inputs['Base Color'])
    if emis is not None:
        if isinstance(emis, str): bs.inputs['Emission Color'].default_value = hexcol(emis)
        else:
            te = nt.nodes.new('ShaderNodeTexImage'); te.image = emis; te.interpolation = interp; nt.links.new(te.outputs['Color'], bs.inputs['Emission Color'])
        bs.inputs['Emission Strength'].default_value = ek
    m.use_backface_culling = True
    return m


FAC = ['glass', 'ribbon', 'tile', 'dark']
M = {}
for f in FAC: M['fac_' + f] = tmat('sb_fac_' + f, img('fac_%s.png' % f), img('fac_%s_e.png' % f), 1.6, 0.35 if f == 'glass' else 0.85, 0.2 if f == 'glass' else 0)
M['shop'] = tmat('sb_shop', img('shop.png'), img('shop_e.png'), 2.2, 0.5)
SIGN_I = img('signs.png'); SIGN_E = img('signs_e.png')
M['sign'] = tmat('glow_sb_sign', SIGN_I, SIGN_E, 3.0, 0.4)
M['screen'] = tmat('glow_sb_screen', SIGN_I, SIGN_E, 3.5, 0.3)
M['roof'] = tmat('sb_roof', '#5c5e62', None, rough=0.95)
M['conc'] = tmat('sb_conc', '#a9a69e', None, rough=0.9)
M['metal'] = tmat('sb_metal', '#3a3d42', None, rough=0.55, metal=0.6)
M['mark'] = tmat('sb_mark', '#e8e8e2', None, rough=0.6)
M['glow'] = tmat('glow_sb_light', '#fff4dc', '#fff2d0', 6.0)
M['glowG'] = tmat('glow_sb_green', '#40ff9a', '#40ff9a', 6.0)
M['glowR'] = tmat('glow_sb_red', '#ff3a2a', '#ff3a2a', 6.0)
M['glowW'] = tmat('glow_sb_window', '#fff0cc', '#ffe6b0', 2.5)
M['train'] = tmat('sb_train', '#c9ccd0', None, rough=0.4, metal=0.5)
M['trainG'] = tmat('sb_train_stripe', '#5cbf3a', None, rough=0.5)
M['glassL'] = tmat('sb_glass_lit', '#1e2a34', '#7fa6c4', 0.22, rough=0.2)
M['bronze'] = tmat('sb_bronze', '#5e4a32', None, rough=0.45, metal=0.8)
M['green'] = tmat('sb_hedge', '#3c5a34', None, rough=0.95)
M['alum'] = tmat('sb_alum', '#9aa2ad', None, rough=0.4, metal=0.5)       # glass-facade mullions
M['awn'] = tmat('sb_awning', '#ffffff', None, rough=0.8)                 # awnings, tinted by vertex colour
M['dark'] = tmat('sb_darkmetal', '#24262a', None, rough=0.6, metal=0.4)  # fans, bogies, insulators
MAT_ORDER = list(M.keys())


# ---------------- mesh builder ----------------
class MB:
    def __init__(self):
        self.bm = bmesh.new(); self.uv = self.bm.loops.layers.uv.new('UVMap'); self.col = self.bm.loops.layers.color.new('Color'); self.mats = []

    def mi(self, key):
        if key not in self.mats: self.mats.append(key)
        return self.mats.index(key)

    def face(self, pts, mat, uvs=None, col=(1, 1, 1, 1)):
        vs = [self.bm.verts.new(p) for p in pts]
        try: f = self.bm.faces.new(vs)
        except ValueError: return None
        f.material_index = self.mi(mat)
        for i, l in enumerate(f.loops):
            l[self.uv].uv = uvs[i] if uvs else (0, 0); l[self.col] = col
        return f

    def quad(self, a, b, c, d, mat, uv=((0, 0), (1, 0), (1, 1), (0, 1)), col=(1, 1, 1, 1)):
        return self.face([a, b, c, d], mat, list(uv), col)

    def box(self, c, sx, sy, sz, mat, rotz=0.0, col=(1, 1, 1, 1), uvr=None):
        """axis box centred at c (blender coords), sx along local X, sy along local Y, sz up; rotz about Z"""
        cs, sn = math.cos(rotz), math.sin(rotz)
        P = lambda x, y, z: V((c[0] + x * cs - y * sn, c[1] + x * sn + y * cs, c[2] + z))
        hx, hy, hz = sx / 2, sy / 2, sz / 2
        v = [P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(-hx, hy, -hz), P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz)]
        u = uvr or ((0, 0), (1, 0), (1, 1), (0, 1))
        for q in ((0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (4, 5, 6, 7), (3, 2, 1, 0)):
            self.quad(v[q[0]], v[q[1]], v[q[2]], v[q[3]], mat, u, col)

    def cyl(self, c, r, h, mat, n=10, col=(1, 1, 1, 1), cap=True):
        ring = lambda z: [V((c[0] + r * math.cos(i * math.tau / n), c[1] + r * math.sin(i * math.tau / n), c[2] + z)) for i in range(n)]
        a, b = ring(0), ring(h)
        for i in range(n):
            j = (i + 1) % n; self.quad(a[i], a[j], b[j], b[i], mat, ((i / n, 0), ((i + 1) / n, 0), ((i + 1) / n, 1), (i / n, 1)), col)
        if cap: self.face(b, mat, [(0.5, 0.5)] * n, col)

    def obj(self, name, coll):
        me = bpy.data.meshes.new(name); self.bm.normal_update(); self.bm.to_mesh(me); self.bm.free()
        for k in self.mats: me.materials.append(M[k])
        if me.color_attributes: me.color_attributes.active_color_index = 0; me.color_attributes.render_color_index = 0
        ob = bpy.data.objects.new(name, me); coll.objects.link(ob); return ob


# ---------------- helpers (map space → blender) ----------------
B3 = lambda x, z, y=0.0, ox=0.0, oz=0.0: V((x - ox, -(z - oz), y))
ROADS = [r for r in D['R'] if not r['k'].startswith('rail')]
SEGS = [(r, r['p'][i], r['p'][i + 1]) for r in ROADS for i in range(len(r['p']) - 1)]


def seg_d(p, a, b):
    ax, az = a; bx, bz = b; dx, dz = bx - ax, bz - az; L2 = dx * dx + dz * dz or 1e-9
    t = max(0, min(1, ((p[0] - ax) * dx + (p[1] - az) * dz) / L2)); return math.hypot(p[0] - ax - dx * t, p[1] - az - dz * t)


def road_near(p, pad=6.0):
    best = 1e9
    for r, a, b in SEGS:
        d = seg_d(p, a, b) - r['w'] / 2
        if d < best: best = d
    return best < pad


def in_poly(p, P):
    x, z = p; c = False; n = len(P)
    for i in range(n):
        x1, z1 = P[i]; x2, z2 = P[i - 1]
        if (z1 > z) != (z2 > z) and x < (x2 - x1) * (z - z1) / (z2 - z1 + 1e-12) + x1: c = not c
    return c


def in_any_bld(p): return any(in_poly(p, b['p']) for b in D['B'])


def dist_cross(p): return math.hypot(p[0] - CX, p[1] - CZ)


HERO = {'Q-FRONT': 'qfront', 'MAGNET SHIBUYA': 'magnet', '渋谷駅前ビル': 'ekimae', 'Shibuya 109': '109'}
coll = bpy.data.collections.new('shibuya'); bpy.context.scene.collection.children.link(coll)
place = {'buildings': [], 'street': None}
SIGN_V = [((i * 128) / 2048, 1.0, ((i + 1) * 128) / 2048, 0.5) for i in range(8)]           # (u0, v_top, u1, v_bot)
SIGN_H = [(0.5, 1 - (i * 128) / 2048, 1.0, 1 - ((i + 1) * 128) / 2048) for i in range(8)]
SCREEN = [((i % 2) * 0.5, 0.5 - (i // 2) * 0.25, (i % 2) * 0.5 + 0.5, 0.25 - (i // 2) * 0.25) for i in range(4)]


def uvq(r):  # (u0, vt, u1, vb) → quad uv order a(bottom-left) b(bottom-right) c(top-right) d(top-left)
    return ((r[0], r[3]), (r[2], r[3]), (r[2], r[1]), (r[0], r[1]))


# ---------------- relief helpers ----------------
WHITE = (1, 1, 1, 1)
FLH, BAYW = 3.5, 3.0     # facade texture grid: floor height from G, bay width along the wall run (shibuya_tex.py)


def wbox(mb, L3, a, e, n, t0, t1, y0, y1, d1, mat, col=WHITE, d0=-0.03, bot=True, ends=True):
    """box stuck on a wall: t along edge (from a, dir e), y up, d out along normal n (map); no back face"""
    if t1 - t0 < 1e-3 or y1 - y0 < 1e-3: return
    P = lambda t, y, d: L3(a[0] + e[0] * t + n[0] * d, a[1] + e[1] * t + n[1] * d, y)
    q = mb.quad
    q(P(t0, y0, d1), P(t1, y0, d1), P(t1, y1, d1), P(t0, y1, d1), mat, col=col)
    q(P(t0, y1, d0), P(t0, y1, d1), P(t1, y1, d1), P(t1, y1, d0), mat, col=col)
    if bot: q(P(t1, y0, d0), P(t1, y0, d1), P(t0, y0, d1), P(t0, y0, d0), mat, col=col)
    if ends:
        q(P(t1, y0, d1), P(t1, y0, d0), P(t1, y1, d0), P(t1, y1, d1), mat, col=col)
        q(P(t0, y0, d0), P(t0, y0, d1), P(t0, y1, d1), P(t0, y1, d0), mat, col=col)


def beam(mb, p, q, w, mat, col=WHITE):
    """square bar between two blender points (4 sides, no caps)"""
    d = q - p; L = d.length
    if L < 1e-4: return
    d = d / L; up = V((0, 0, 1)) if abs(d.z) < 0.9 else V((1, 0, 0))
    s = d.cross(up).normalized() * (w / 2); u = s.cross(d).normalized() * (w / 2)
    c = [s + u, -s + u, -s - u, s - u]
    for i in range(4):
        j = (i + 1) % 4; mb.quad(p + c[i], q + c[i], q + c[j], p + c[j], mat, col=col)


def grid(run0, L, step, off=0.0, m=0.25):
    """positions t in [m, L-m] where (run0 + t - off) is a multiple of step"""
    t = math.ceil((run0 - off) / step - 1e-6) * step + off - run0
    while t <= L - m:
        if t >= m: yield t
        t += step


def is_bay(run0, t): return abs((run0 + t) / BAYW - round((run0 + t) / BAYW)) < 0.02


def facade_relief(mb, L3, a, e, n, L, run0, style, G, top, col, shop, back, R):
    """3D relief lined up with the painted facade grid (floors every 3.5 m from G, bays every 3 m of wall run)"""
    base = G if shop else 0.0
    if top - base < 2: return
    cells = [G + k * FLH for k in range(-1, int((top - G) / FLH) + 1) if G + k * FLH >= base - 1e-6 and G + k * FLH + FLH <= top + 0.05]   # full floor cells (bottom y)
    lines = [G + k * FLH for k in range(-1, int((top - G) / FLH) + 1) if base + 0.4 < G + k * FLH < top - 0.3]
    cc = col
    if style == 'glass':
        for y in lines: wbox(mb, L3, a, e, n, 0, L, y - 0.14, y + 0.2, 0.22, 'conc', cc)               # slab edge
        for t in grid(run0, L, BAYW / 2):
            big = is_bay(run0, t); w = 0.16 if big else 0.07
            wbox(mb, L3, a, e, n, t - w / 2, t + w / 2, base, top, 0.34 if big else 0.16, 'alum', bot=False)   # mullions
    elif style == 'ribbon':
        for y in cells:
            wbox(mb, L3, a, e, n, 0, L, y + 0.22, y + 0.4, 0.5, 'conc', cc)                         # window-sill lip
            wbox(mb, L3, a, e, n, 0, L, y + 2.42, y + 2.54, 0.34, 'metal')                          # sun shade
        for t0 in (0, L - 0.45): wbox(mb, L3, a, e, n, t0, t0 + 0.45, base, top, 0.24, 'conc', cc, bot=False)
    elif style == 'tile':
        for t in grid(run0, L, BAYW): wbox(mb, L3, a, e, n, t - 0.22, t + 0.22, base, top, 0.14, 'conc', cc, bot=False)   # pilasters
        tb = -(run0 % BAYW)
        while tb < L:
            if tb + 0.56 >= 0 and tb + 2.44 <= L:
                for y in cells:
                    wbox(mb, L3, a, e, n, tb + 0.56, tb + 2.44, y + 0.6, y + 0.74, 0.2, 'conc', cc)    # sill
                    wbox(mb, L3, a, e, n, tb + 0.6, tb + 2.4, y + 2.68, y + 2.8, 0.1, 'conc', cc)      # lintel
                    if back and R.random() < 0.16: wbox(mb, L3, a, e, n, tb + 0.9, tb + 1.75, y + 0.05, y + 0.58, 0.42, 'metal')   # AC unit
            tb += BAYW
    elif style == 'dark':
        for y in lines: wbox(mb, L3, a, e, n, 0, L, y - 0.08, y + 0.1, 0.55, 'metal')                 # egg-crate rows
        for t in grid(run0, L, BAYW / 2, 1.43): wbox(mb, L3, a, e, n, t - 0.06, t + 0.06, base, top, 0.55, 'metal', bot=False)
    if back:
        if L > 5 and R.random() < 0.7:                                                              # drain pipe + brackets
            t = R.uniform(0.6, L - 0.6); px, pz = a[0] + e[0] * t + n[0] * 0.16, a[1] + e[1] * t + n[1] * 0.16
            mb.cyl(L3(px, pz, 0), 0.07, top + 0.4, 'metal', 6, cap=False)
            for y in lines[::2]: wbox(mb, L3, a, e, n, t - 0.1, t + 0.1, y, y + 0.08, 0.2, 'metal')
        if style != 'tile':
            for y in cells:
                for tb in grid(run0, L, BAYW, 1.5, 0.9):
                    if R.random() < 0.07: wbox(mb, L3, a, e, n, tb - 0.42, tb + 0.42, y + 0.1, y + 0.62, 0.42, 'metal')


def shop_relief(mb, L3, a, e, n, L, run0, G, col, R):
    wbox(mb, L3, a, e, n, 0, L, 0, 0.32, 0.06, 'conc', col, bot=False)                                # plinth
    wbox(mb, L3, a, e, n, 0, L, G - 0.12, G + 0.28, 0.42, 'conc', col)                                # fascia cornice
    for t in grid(run0, L, BAYW, 0, 0.2): wbox(mb, L3, a, e, n, t - 0.14, t + 0.14, 0.32, G - 0.12, 0.2, 'metal', bot=False)   # shop pillars
    for t0 in (0, L - 0.5): wbox(mb, L3, a, e, n, t0, t0 + 0.5, 0, G - 0.12, 0.3, 'conc', col, bot=False)
    if L > 3 and R.random() < 0.45:                                                                 # awning
        aw = min(L - 1.2, R.uniform(2.5, 6)); t0 = R.uniform(0.6, L - 0.6 - aw); t1 = t0 + aw
        ac = R.choice([(0.75, 0.16, 0.12, 1), (0.14, 0.36, 0.2, 1), (0.85, 0.72, 0.4, 1), (0.2, 0.26, 0.5, 1), (0.82, 0.82, 0.8, 1)])
        yw, yf, d = 3.3, 2.85, 1.3
        P = lambda t, y, dd: L3(a[0] + e[0] * t + n[0] * dd, a[1] + e[1] * t + n[1] * dd, y)
        mb.quad(P(t0, yw, 0), P(t0, yf, d), P(t1, yf, d), P(t1, yw, 0), 'awn', col=ac)
        mb.quad(P(t1, yw, 0), P(t1, yf, d), P(t0, yf, d), P(t0, yw, 0), 'awn', col=(ac[0] * 0.6, ac[1] * 0.6, ac[2] * 0.6, 1))
        wbox(mb, L3, a, e, n, t0, t1, yf - 0.28, yf, d + 0.02, 'awn', ac, d0=d - 0.02)              # valance
        mb.face([P(t0, yw, 0.0), P(t0, yf - 0.28, d), P(t0, yf, d)][::-1], 'awn', col=ac)
        mb.face([P(t1, yw, 0.0), P(t1, yf - 0.28, d), P(t1, yf, d)], 'awn', col=ac)


def roof_rail(mb, L3, a, e, n, L, h):
    for t in grid(0, L, 1.6, 0, 0.1): wbox(mb, L3, a, e, n, t - 0.03, t + 0.03, h + 0.12, h + 1.05, -0.32, 'metal', d0=-0.38, bot=False)
    wbox(mb, L3, a, e, n, 0.05, L - 0.05, h + 1.0, h + 1.07, -0.3, 'metal', d0=-0.4)
    wbox(mb, L3, a, e, n, 0.05, L - 0.05, h + 0.55, h + 0.59, -0.33, 'metal', d0=-0.37, bot=False, ends=False)


def roof_stuff(mb, L3, P, cx, cz, h, ang, R):
    """water tanks on legs, condenser rows, stair penthouse, antenna mast"""
    n = len(P); ca, sa = math.cos(ang), math.sin(ang)
    def ok(q, r):
        return all(in_poly((q[0] + dx, q[1] + dz), P) for dx, dz in ((r, r), (-r, r), (r, -r), (-r, -r), (0, 0)))
    def spot(r):
        for _ in range(12):
            p = P[R.randrange(n)]; k = R.uniform(0.1, 0.7); q = (cx + (p[0] - cx) * k, cz + (p[1] - cz) * k)
            if ok(q, r): return q
        return None
    kinds = ['cond', 'cond', 'tank', 'pent', 'duct', 'mast', 'cond']
    for _ in range(R.randint(2, 6)):
        kd = R.choice(kinds)
        if kd == 'tank':
            q = spot(1.8)
            if not q: continue
            r = R.uniform(0.9, 1.4); c0 = L3(q[0], q[1], h)
            for dx, dy in ((1, 1), (-1, 1), (1, -1), (-1, -1)): mb.box(c0 + V((dx * r * 0.7, dy * r * 0.7, 0.6)), 0.14, 0.14, 1.2, 'metal')
            mb.box(c0 + V((0, 0, 1.25)), r * 2.1, r * 2.1, 0.1, 'metal'); mb.cyl(c0 + V((0, 0, 1.3)), r, 2.0, 'conc', 12)
            beam(mb, c0 + V((r, 0, 0.1)), c0 + V((r, 0, 3.3)), 0.05, 'metal')
        elif kd == 'cond':
            q = spot(2.2)
            if not q: continue
            c0 = L3(q[0], q[1], h); k = R.randint(2, 4)
            for j in range(k):
                o = c0 + V((ca * (j - (k - 1) / 2) * 1.15, sa * (j - (k - 1) / 2) * 1.15, 0))
                mb.box(o + V((0, 0, 0.5)), 1.0, 0.8, 0.9, 'metal', rotz=ang); mb.cyl(o + V((0, 0, 0.95)), 0.3, 0.03, 'dark', 10)
            mb.box(c0 + V((0, 0, 0.05)), k * 1.15 + 0.3, 1.0, 0.1, 'conc', rotz=ang)
        elif kd == 'pent':
            q = spot(1.8)
            if not q: continue
            c0 = L3(q[0], q[1], h); mb.box(c0 + V((0, 0, 1.4)), 3.0, 2.4, 2.8, 'conc', rotz=ang)
            mb.box(c0 + V((0, 0, 2.9)), 3.4, 2.8, 0.2, 'conc', rotz=ang)
            mb.box(c0 + V((-sa * 1.21, ca * 1.21, 1.05)), 0.9, 0.04, 2.0, 'metal', rotz=ang)
            mb.box(c0 + V((-sa * 1.3, ca * 1.3, 2.35)), 0.25, 0.1, 0.12, 'glow', rotz=ang)
        elif kd == 'duct':
            q = spot(2.6)
            if not q: continue
            c0 = L3(q[0], q[1], h); mb.box(c0 + V((0, 0, 0.55)), 5.0, 0.6, 0.6, 'metal', rotz=ang)
            for j in (-2, 0, 2): mb.box(c0 + V((ca * j, sa * j, 0.12)), 0.2, 0.8, 0.24, 'metal', rotz=ang)
            mb.box(c0 + V((ca * 2.6, sa * 2.6, 1.0)), 0.7, 0.7, 1.5, 'metal', rotz=ang)
        else:
            q = spot(0.5)
            if not q: continue
            c0 = L3(q[0], q[1], h); hm = R.uniform(5, 10)
            mb.box(c0 + V((0, 0, 0.15)), 0.8, 0.8, 0.3, 'conc'); mb.cyl(c0, 0.07, hm, 'metal', 6)
            for y in (hm * 0.55, hm * 0.8): beam(mb, c0 + V((-0.8 * ca, -0.8 * sa, y)), c0 + V((0.8 * ca, 0.8 * sa, y)), 0.05, 'metal')
            mb.box(c0 + V((0, 0, hm + 0.1)), 0.18, 0.18, 0.2, 'glowR')
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)): beam(mb, c0 + V((0, 0, hm * 0.6)), c0 + V((dx * 2.2, dy * 2.2, 0.05)), 0.02, 'metal')


def screen_frame(mb, L3, a, e, n, t0, t1, y0, y1, d, R, lights=True):
    fr = 0.35
    wbox(mb, L3, a, e, n, t0 - fr, t1 + fr, y1, y1 + fr, d + 0.4, 'metal')
    wbox(mb, L3, a, e, n, t0 - fr, t1 + fr, y0 - fr, y0, d + 0.4, 'metal')
    wbox(mb, L3, a, e, n, t0 - fr, t0, y0, y1, d + 0.4, 'metal'); wbox(mb, L3, a, e, n, t1, t1 + fr, y0, y1, d + 0.4, 'metal')
    if lights:
        for t in grid(0, t1 - t0, 2.0, 0, 0.4):
            wbox(mb, L3, a, e, n, t0 + t - 0.04, t0 + t + 0.04, y1 + 0.1, y1 + 0.18, d + 1.1, 'metal')
            wbox(mb, L3, a, e, n, t0 + t - 0.16, t0 + t + 0.16, y1 + 0.0, y1 + 0.2, d + 1.35, 'glow', d0=d + 1.05)


def billboard_truss(mb, L3, pa, pb, e, n, sw, h, y0, sh):
    """steel frame behind a rooftop billboard: posts, rails, X-braces, catwalk, lamp arms in front"""
    ex, ez = e; nx, nz = n
    P = lambda t, y, d: L3(pa[0] + ex * t + nx * d, pa[1] + ez * t + nz * d, y)
    k = max(2, int(sw / 2.5)); ts = [sw * i / k for i in range(k + 1)]
    for t in ts:
        beam(mb, P(t, h, -0.25), P(t, y0 + sh, -0.25), 0.16, 'metal')
        beam(mb, P(t, h, -1.6), P(t, y0 + sh * 0.6, -0.25), 0.1, 'metal')                         # back strut
    for y in (y0, y0 + sh * 0.5, y0 + sh): beam(mb, P(0, y, -0.25), P(sw, y, -0.25), 0.12, 'metal')
    for i in range(k):
        beam(mb, P(ts[i], y0, -0.3), P(ts[i + 1], y0 + sh * 0.5, -0.3), 0.07, 'metal'); beam(mb, P(ts[i + 1], y0, -0.3), P(ts[i], y0 + sh * 0.5, -0.3), 0.07, 'metal')
    wbox(mb, L3, pa, e, n, 0, sw, y0 - 0.12, y0 - 0.02, 1.0, 'metal', d0=-0.3)                          # catwalk
    wbox(mb, L3, pa, e, n, 0, sw, y0 + 0.9, y0 + 0.95, 1.0, 'metal', d0=0.95, ends=False)
    for t in ts[1:-1:1] if k > 2 else ts:
        beam(mb, P(t, y0 - 0.1, 0.1), P(t, y0 - 0.1, 1.4), 0.06, 'metal'); wbox(mb, L3, pa, e, n, t - 0.18, t + 0.18, y0 - 0.25, y0 + 0.05, 1.6, 'glow', d0=1.3)


# ---------------- buildings ----------------
nB = 0
for b in D['B']:
    P = b['p']; n = len(P)
    cx = sum(p[0] for p in P) / n; cz = sum(p[1] for p in P) / n
    A2 = sum(P[i][0] * (-P[i - 1][1]) - P[i - 1][0] * (-P[i][1]) for i in range(n))   # signed area in blender XY (y = -z)
    if A2 > 0: P = P[::-1]                               # → counter-clockwise in blender XY so wall quads a→c face outward
    h = b['h']; R = random.Random(b['id']); hero = HERO.get(b['name'], '')
    small = h < 5.5; station = b['k'] in ('train_station',)
    style = 'glass' if h > 34 or b['k'] in ('commercial', 'office') or hero in ('qfront', 'magnet') else R.choice(['ribbon', 'tile', 'tile', 'dark', 'ribbon', 'glass'])
    if station: style = 'ribbon'
    tint = R.uniform(0.4, 0.6); hue = R.choice([(1, 1, 1), (1.04, 0.98, 0.92), (0.94, 0.98, 1.05), (1.05, 1.0, 0.95)])
    col = (min(1, tint * hue[0]), min(1, tint * hue[1]), min(1, tint * hue[2]), 1)
    G = 4.4 if not small else h; par = 0.8 if h > 8 else 0.3
    mb = MB(); run = R.uniform(0, 12); railB = h > 10 and not station and R.random() < 0.55
    lo = max(range(n), key=lambda i: math.hypot(P[(i + 1) % n][0] - P[i][0], P[(i + 1) % n][1] - P[i][1]))
    bang = math.atan2(-(P[(lo + 1) % n][1] - P[lo][1]), P[(lo + 1) % n][0] - P[lo][0])   # blender angle of the longest wall
    L3 = lambda x, z, y: B3(x, z, y, cx, cz)
    if b['k'] == 'roof':                                      # canopy: slab on posts
        mb.face([L3(p[0], p[1], h) for p in P], 'roof'); mb.face([L3(p[0], p[1], h - 0.3) for p in P[::-1]], 'conc')
        for p in P[::max(1, n // 4)]: mb.box(L3(p[0], p[1], (h - 0.3) / 2), 0.3, 0.3, h - 0.3, 'metal')
    else:
        for i in range(n):
            a, c = P[i], P[(i + 1) % n]; L = math.hypot(c[0] - a[0], c[1] - a[1])
            if L < 0.05: continue
            u0, u1 = run / 12, (run + L) / 12; run += L
            mid = ((a[0] + c[0]) / 2, (a[1] + c[1]) / 2); street = road_near(mid, 9) and not small
            # ground band
            if small:                                             # kiosk / subway exit: metal base + lit glass + metal fascia
                for y0, y1, m in ((0, 0.9, 'metal'), (0.9, h - 0.6, 'glassL'), (h - 0.6, h, 'metal')):
                    if y1 > y0: mb.quad(L3(a[0], a[1], y0), L3(c[0], c[1], y0), L3(c[0], c[1], y1), L3(a[0], a[1], y1), m, ((u0, 0), (u1, 0), (u1, 1), (u0, 1)))
                continue
            gm = 'shop' if (street or station) else 'fac_' + style
            gv = (0, 1) if gm == 'shop' else (-G / 14, 0)
            mb.quad(L3(a[0], a[1], 0), L3(c[0], c[1], 0), L3(c[0], c[1], G), L3(a[0], a[1], G), gm, ((u0, gv[0]), (u1, gv[0]), (u1, gv[1]), (u0, gv[1])), col if gm != 'shop' else (1, 1, 1, 1))
            top = h - par
            if top > G: mb.quad(L3(a[0], a[1], G), L3(c[0], c[1], G), L3(c[0], c[1], top), L3(a[0], a[1], top), 'fac_' + style, ((u0, 0), (u1, 0), (u1, (top - G) / 14), (u0, (top - G) / 14)), col)
            mb.quad(L3(a[0], a[1], top), L3(c[0], c[1], top), L3(c[0], c[1], h), L3(a[0], a[1], h), 'conc', col=col)
            ex, ez = (c[0] - a[0]) / L, (c[1] - a[1]) / L; E, N = (ex, ez), (-ez, ex)
            facade_relief(mb, L3, a, E, N, L, u0 * 12, style, G, top, col, gm == 'shop', not (street or station), R)
            if gm == 'shop': shop_relief(mb, L3, a, E, N, L, u0 * 12, G, col, R)
            else: wbox(mb, L3, a, E, N, 0, L, 0, 0.4, 0.08, 'conc', col, bot=False)
            wbox(mb, L3, a, E, N, 0, L, h - 0.02, h + 0.14, 0.12, 'conc', col, d0=-0.45)                    # coping
            if railB: roof_rail(mb, L3, a, E, N, L, h)
            if station and street and L > 4:                                                            # station canopy on posts
                wbox(mb, L3, a, E, N, 0.2, L - 0.2, 3.7, 3.95, 3.2, 'roof', col)
                wbox(mb, L3, a, E, N, 0.2, L - 0.2, 3.5, 3.7, 3.25, 'glow', d0=3.05, ends=False)
                for t in grid(0, L, 6, 0, 0.5): mb.box(L3(a[0] + ex * t - ez * 2.9, a[1] + ez * t + ex * 2.9, 1.75), 0.2, 0.2, 3.5, 'metal')
            # signs on street sides
            if street and L > 3.5 and h > 9:
                ex, ez = (c[0] - a[0]) / L, (c[1] - a[1]) / L; nx, nz = -ez, ex          # outward normal (map)
                k = max(1, int(L // 4.5))
                for s in range(k):
                    if R.random() < 0.15: continue
                    t = (s + 0.5) / k * L + R.uniform(-1, 1); px, pz = a[0] + ex * t, a[1] + ez * t
                    sh = min(R.uniform(6, 11), h - 6); y0 = 5.2
                    if sh < 3: continue
                    base = (px + nx * 0.8, pz + nz * 0.8)                                    # vertical sign sticks out 1.4 m
                    r = SIGN_V[R.randrange(8)]
                    o = L3(base[0], base[1], y0); e1 = V((nx * 0.7, -nz * 0.7, 0)); up = V((0, 0, sh)); th = V((ex * 0.18, -ez * 0.18, 0))
                    for sgn in (1, -1):
                        q0 = o + th * sgn
                        if sgn < 0: mb.quad(q0 - e1, q0 + e1, q0 + e1 + up, q0 - e1 + up, 'sign', uvq(r))
                        else: mb.quad(q0 + e1, q0 - e1, q0 - e1 + up, q0 + e1 + up, 'sign', uvq(r))
                    mb.quad(o - th + e1, o + th + e1, o + th + e1 + up, o - th + e1 + up, 'metal'); mb.quad(o + th - e1 + up, o - th - e1 + up, o - th + e1 + up, o + th + e1 + up, 'metal')
                if L > 6 and R.random() < 0.7:                                               # flat sign above shop band
                    sw = min(L - 1.5, R.uniform(4, 9)); t = L / 2 + R.uniform(-(L - sw) / 2, (L - sw) / 2)
                    pa = (a[0] + ex * (t - sw / 2) + nx * 0.06, a[1] + ez * (t - sw / 2) + nz * 0.06); pb = (a[0] + ex * (t + sw / 2) + nx * 0.06, a[1] + ez * (t + sw / 2) + nz * 0.06)
                    y0 = G + 0.25; r = SIGN_H[R.randrange(8)]
                    mb.quad(L3(pa[0], pa[1], y0), L3(pb[0], pb[1], y0), L3(pb[0], pb[1], y0 + 1.1), L3(pa[0], pa[1], y0 + 1.1), 'sign', uvq(r))
        mb.face([L3(p[0], p[1], h) for p in P], 'roof', col=col)
        if h > 8 and not station and hero != '109': roof_stuff(mb, L3, P, cx, cz, h, bang, R)   # rooftop clutter
        # hero screens / billboards facing the crossing
        dc = dist_cross((cx, cz))
        if (hero or (dc < 75 and h > 14 and R.random() < 0.6)) and hero != '109':
            best = None
            for i in range(n):
                a, c = P[i], P[(i + 1) % n]; L = math.hypot(c[0] - a[0], c[1] - a[1])
                if L < 6: continue
                ex, ez = (c[0] - a[0]) / L, (c[1] - a[1]) / L; nx, nz = -ez, ex; mx, mz = (a[0] + c[0]) / 2, (a[1] + c[1]) / 2
                tx, tz = CX - mx, CZ - mz; tl = math.hypot(tx, tz) or 1; dot = (nx * tx + nz * tz) / tl
                if best is None or dot * L ** 0.5 > best[0]: best = (dot * L ** 0.5, a, c, L, ex, ez, nx, nz)
            if best and best[0] > 0:
                _, a, c, L, ex, ez, nx, nz = best
                if hero == 'qfront' or (not hero and R.random() < 0.5):   # big facade screen
                    sw = min(L * 0.82, 24); y0 = 9 if hero == 'qfront' else max(G + 3, h * 0.45); sh = min(sw * 0.5625 * (1.3 if hero == 'qfront' else 1), h - y0 - 2)
                    if sh > 3:
                        t = L / 2; pa = (a[0] + ex * (t - sw / 2) + nx * 0.25, a[1] + ez * (t - sw / 2) + nz * 0.25); pb = (a[0] + ex * (t + sw / 2) + nx * 0.25, a[1] + ez * (t + sw / 2) + nz * 0.25)
                        mb.quad(L3(pa[0], pa[1], y0), L3(pb[0], pb[1], y0), L3(pb[0], pb[1], y0 + sh), L3(pa[0], pa[1], y0 + sh), 'screen', uvq(SCREEN[R.randrange(4)]))
                        screen_frame(mb, L3, a, (ex, ez), (nx, nz), t - sw / 2, t + sw / 2, y0, y0 + sh, 0.0, R)
                        if hero == 'qfront':                                                                # deep vertical fins either side
                            for k in range(1, 5):
                                for tt in (t - sw / 2 - 0.35 - k * 0.9, t + sw / 2 + 0.35 + k * 0.9):
                                    if 0.2 < tt < L - 0.2: wbox(mb, L3, a, (ex, ez), (nx, nz), tt - 0.08, tt + 0.08, G, h - 0.8, 0.9, 'alum', bot=False)
                if hero in ('magnet', 'ekimae') or (not hero and R.random() < 0.6):   # rooftop billboard(s)
                    nbb = 3 if hero == 'ekimae' else 1
                    for s in range(nbb):
                        sw = min(L * 0.8 / nbb, 14); sh = sw * 0.5625; t = L * (s + 0.5) / nbb
                        pa = (a[0] + ex * (t - sw / 2) - nx * 1.5, a[1] + ez * (t - sw / 2) - nz * 1.5); pb = (a[0] + ex * (t + sw / 2) - nx * 1.5, a[1] + ez * (t + sw / 2) - nz * 1.5)
                        y0 = h + 1.2 + (s % 2) * 0.5
                        mb.quad(L3(pa[0], pa[1], y0), L3(pb[0], pb[1], y0), L3(pb[0], pb[1], y0 + sh), L3(pa[0], pa[1], y0 + sh), 'screen', uvq(SCREEN[R.randrange(4)]))
                        mb.quad(L3(pb[0], pb[1], y0), L3(pa[0], pa[1], y0), L3(pa[0], pa[1], y0 + sh), L3(pb[0], pb[1], y0 + sh), 'metal')
                        billboard_truss(mb, L3, pa, pb, (ex, ez), (nx, nz), sw, h, y0, sh)
        if hero == '109':                                          # cylinder landmark: glowing ring + tall sign pillar on top
            r0 = max(math.hypot(p[0] - cx, p[1] - cz) for p in P) * 0.55
            mb.cyl(V((0, 0, h)), r0, 1.2, 'glowW', 24, cap=False); mb.cyl(V((0, 0, h + 1.2)), r0 * 0.5, 9, 'conc', 16)
            mb.cyl(V((0, 0, h + 7)), r0 * 0.52, 2.4, 'screen', 16, cap=False)
            for y in (h + 1.2, h + 3.6, h + 6.8, h + 9.4): mb.cyl(V((0, 0, y)), r0 * 0.56, 0.22, 'metal', 16)
            mb.cyl(V((0, 0, h + 10.2)), r0 * 0.4, 0.5, 'metal', 16)
            for k in range(16):
                a_ = k * math.tau / 16; rr = r0 * 0.5
                beam(mb, V((math.cos(a_) * rr * 1.08, math.sin(a_) * rr * 1.08, h + 1.2)), V((math.cos(a_) * rr * 1.08, math.sin(a_) * rr * 1.08, h + 6.8)), 0.12, 'alum')
            for k in range(24):                                                                     # crown fins over the lit ring
                a_ = k * math.tau / 24; beam(mb, V((math.cos(a_) * r0 * 1.02, math.sin(a_) * r0 * 1.04, h)), V((math.cos(a_) * r0 * 1.02, math.sin(a_) * r0 * 1.02, h + 1.4)), 0.18, 'alum')
    ob = mb.obj('sbb_%d' % b['id'], coll); nB += 1
    place['buildings'].append({'node': ob.name, 'id': b['id'], 'name': b['name'], 'x': round(cx, 2), 'z': round(cz, 2), 'h': h, 'p': [[round(p[0], 2), round(p[1], 2)] for p in P]})


# ---------------- street furniture (one node, origin = map centre) ----------------
OXc, OZc = W / 2, H / 2
S3 = lambda x, z, y=0.0: B3(x, z, y, OXc, OZc)
st = MB()


def lamp(x, z, ang):
    ca, sa = math.cos(ang), math.sin(ang)
    st.cyl(S3(x, z, 0), 0.11, 8.0, 'metal', 8)
    hx, hz = x + ca * 1.6, z + sa * 1.6
    a = S3(x, z, 7.9); c = S3(hx, hz, 8.0)
    st.box((a + c) / 2, 1.7, 0.1, 0.1, 'metal', rotz=-ang)
    st.box(S3(hx, hz, 7.85), 0.9, 0.35, 0.18, 'metal', rotz=-ang); st.box(S3(hx, hz, 7.74), 0.75, 0.25, 0.05, 'glow', rotz=-ang)


def ped_signal(x, z, ang):
    st.cyl(S3(x, z, 0), 0.07, 3.0, 'metal', 6)
    st.box(S3(x, z, 2.5), 0.45, 0.3, 0.9, 'metal', rotz=-ang)
    ca, sa = math.cos(ang), math.sin(ang); f = S3(x + ca * 0.16, z + sa * 0.16, 2.72)
    st.box(f, 0.34, 0.04, 0.34, 'glowG', rotz=-ang); st.box(S3(x + ca * 0.16, z + sa * 0.16, 2.3), 0.34, 0.04, 0.34, 'metal', rotz=-ang)


def car_signal(x, z, ang):
    ca, sa = math.cos(ang), math.sin(ang)
    st.cyl(S3(x, z, 0), 0.13, 6.0, 'metal', 8)
    a = S3(x, z, 5.8); c = S3(x + ca * 4.0, z + sa * 4.0, 5.8); st.box((a + c) / 2, 4.0, 0.12, 0.12, 'metal', rotz=-ang)
    hx, hz = x + ca * 3.6, z + sa * 3.6
    st.box(S3(hx, hz, 5.35), 1.3, 0.3, 0.45, 'metal', rotz=-ang)
    nx, nz = -sa, ca
    for k, m in ((-0.4, 'glowG'), (0, 'metal'), (0.4, 'metal')):
        st.cyl(S3(hx + ca * k + nx * 0.17, hz + sa * k + nz * 0.17, 5.18), 0.14, 0.04, m, 8) if False else st.box(S3(hx + ca * k + nx * 0.16, hz + sa * k + nz * 0.16, 5.35), 0.28, 0.04, 0.28, m, rotz=-ang)


nL = 0
for r in ROADS:
    if r['k'] not in ('trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'tertiary_link'): continue
    acc = RND.uniform(0, 20)
    for i in range(len(r['p']) - 1):
        a, b = r['p'][i], r['p'][i + 1]; L = math.hypot(b[0] - a[0], b[1] - a[1])
        if L < 0.1: continue
        ex, ez = (b[0] - a[0]) / L, (b[1] - a[1]) / L; nx, nz = -ez, ex; t = acc
        while t < L:
            for side in (1, -1):
                off = r['w'] / 2 + 1.1; px, pz = a[0] + ex * t + nx * off * side, a[1] + ez * t + nz * off * side
                if not (0 < px < W and 0 < pz < H) or in_any_bld((px, pz)) or dist_cross((px, pz)) < 24: continue
                if any(seg_d((px, pz), q1, q2) < r2['w'] / 2 + 0.6 for r2, q1, q2 in SEGS): continue
                lamp(px, pz, math.atan2(-nz * side, -nx * side)); nL += 1
            t += 24
        acc = t - L

nS = 0
for x in D['X']:
    p = x['p']
    for end, nxt in ((p[0], p[1]), (p[-1], p[-2])):
        dx, dz = end[0] - nxt[0], end[1] - nxt[1]; l = math.hypot(dx, dz) or 1; dx, dz = dx / l, dz / l
        px, pz = end[0] + dx * 0.8 + dz * 2.4, end[1] + dz * 0.8 - dx * 2.4
        if in_any_bld((px, pz)): continue
        ped_signal(px, pz, math.atan2(-dz, -dx)); nS += 1
for k, (ox, oz) in enumerate(((-22, -20), (22, -20), (22, 20), (-22, 20))):   # main crossing: car signals on the 4 corners, arms over the road
    ang = [0, math.pi / 2, math.pi, -math.pi / 2][k]
    car_signal(CX + ox, CZ + oz, ang)

# Hachiko-style dog statue on a plinth (generic Akita dog sculpture) + square planters
HX, HZ = CX - 2.0, CZ + 50.5
st.box(S3(HX, HZ, 0.6), 1.6, 1.0, 1.2, 'conc')
dog = [((0, 0, 1.55), 1.0, 0.42, 0.5), ((0.42, 0, 1.95), 0.32, 0.3, 0.42), ((0.6, 0, 2.15), 0.34, 0.26, 0.26), ((0.82, 0, 2.1), 0.18, 0.16, 0.14),
       ((0.56, 0.08, 2.35), 0.08, 0.06, 0.12), ((0.56, -0.08, 2.35), 0.08, 0.06, 0.12), ((-0.42, 0, 1.4), 0.36, 0.38, 0.4), ((-0.55, 0, 1.75), 0.14, 0.14, 0.3),
       ((0.3, 0.14, 1.35), 0.12, 0.12, 0.45), ((0.3, -0.14, 1.35), 0.12, 0.12, 0.45)]
for (dx, dy, dz), sx, sy, sz in dog: st.box(S3(HX, HZ, 0) + V((dx, dy, dz)), sx, sy, sz, 'bronze')
for k in range(6):
    a = k * math.tau / 6 + 0.3; st.box(S3(HX + math.cos(a) * 9, HZ + math.sin(a) * 7, 0.35), 3.0, 1.2, 0.7, 'conc', rotz=a); st.box(S3(HX + math.cos(a) * 9, HZ + math.sin(a) * 7, 0.85), 2.8, 1.0, 0.3, 'green', rotz=a)

# subway-exit glass huts / smoking area handled as buildings (small) • vending machines along a few street walls
for k in range(18):
    b = RND.choice([q for q in D['B'] if q['h'] > 8 and dist_cross(q['p'][0]) < 120])
    P = b['p']; i = RND.randrange(len(P)); a, c = P[i], P[(i + 1) % len(P)]; L = math.hypot(c[0] - a[0], c[1] - a[1])
    if L < 3: continue
    ex, ez = (c[0] - a[0]) / L, (c[1] - a[1]) / L; nx, nz = -ez, ex
    for sgn in (1, -1):
        px, pz = (a[0] + c[0]) / 2 + nx * 0.5 * sgn, (a[1] + c[1]) / 2 + nz * 0.5 * sgn
        if not in_any_bld((px, pz)) and not in_any_bld(((a[0] + c[0]) / 2 + nx * 1.2 * sgn, (a[1] + c[1]) / 2 + nz * 1.2 * sgn)):
            ang = math.atan2(-nz * sgn, nx * sgn)
            st.box(S3(px, pz, 0.92), 1.0, 0.75, 1.84, 'metal', rotz=-math.atan2(ez, ex)); st.box(S3(px + nx * 0.39 * sgn, pz + nz * 0.39 * sgn, 1.15), 0.86, 0.03, 1.1, 'glassL', rotz=-math.atan2(ez, ex))
            break
ost = st.obj('sb_street', coll)

# ---------------- road markings ----------------
mk = MB(); y = 0.03
for x in D['X']:
    p = x['p']; main = dist_cross(((p[0][0] + p[-1][0]) / 2, (p[0][1] + p[-1][1]) / 2)) < 40
    cw = 6.0 if main else 4.0
    for i in range(len(p) - 1):
        a, b = p[i], p[i + 1]; L = math.hypot(b[0] - a[0], b[1] - a[1])
        if L < 0.5: continue
        ex, ez = (b[0] - a[0]) / L, (b[1] - a[1]) / L; nx, nz = -ez, ex; t = 0.6
        while t < L - 0.4:
            cxm, czm = a[0] + ex * t, a[1] + ez * t
            q = [(cxm - ex * 0.22 - nx * cw / 2, czm - ez * 0.22 - nz * cw / 2), (cxm + ex * 0.22 - nx * cw / 2, czm + ez * 0.22 - nz * cw / 2),
                 (cxm + ex * 0.22 + nx * cw / 2, czm + ez * 0.22 + nz * cw / 2), (cxm - ex * 0.22 + nx * cw / 2, czm - ez * 0.22 + nz * cw / 2)]
            v = [S3(qx, qz, y) for qx, qz in q]
            if (v[1] - v[0]).cross(v[3] - v[0]).z < 0: v = v[::-1]
            mk.quad(*v, 'mark'); t += 0.9
for r in ROADS:                                                  # dashed centre line on wide roads, stop short of crossings
    if r['w'] < 8 or r['k'] in ('pedestrian', 'service'): continue
    for i in range(len(r['p']) - 1):
        a, b = r['p'][i], r['p'][i + 1]; L = math.hypot(b[0] - a[0], b[1] - a[1])
        if L < 1: continue
        ex, ez = (b[0] - a[0]) / L, (b[1] - a[1]) / L; nx, nz = -ez, ex; t = 1
        while t < L - 3:
            px, pz = a[0] + ex * t, a[1] + ez * t
            if dist_cross((px, pz)) > 30 and all(min(seg_d((px, pz), x['p'][j], x['p'][j + 1]) for j in range(len(x['p']) - 1)) > 5 for x in D['X']):
                q = [(px - nx * 0.08, pz - nz * 0.08), (px + ex * 4 - nx * 0.08, pz + ez * 4 - nz * 0.08), (px + ex * 4 + nx * 0.08, pz + ez * 4 + nz * 0.08), (px + nx * 0.08, pz + nz * 0.08)]
                v = [S3(qx, qz, y) for qx, qz in q]
                if (v[1] - v[0]).cross(v[3] - v[0]).z < 0: v = v[::-1]
                mk.quad(*v, 'mark')
            t += 9
omk = mk.obj('sb_marks', coll)

# ---------------- elevated rail (viaduct deck, girders, track, catenary, piers + a parked train) ----------------
rl = MB(); trainDone = False


def RP(px, pz, ex, ez, k, side, y):   # point along a rail segment: k along, side across (map +normal), y up
    return S3(px + ex * k - ez * side, pz + ez * k + ex * side, y)


for r in D['R']:
    if r['k'] not in ('rail_rail', 'rail_subway'): continue
    top = 7.0 if r['k'] == 'rail_rail' else 11.0; acc = 8.0
    for i in range(len(r['p']) - 1):
        a, b = r['p'][i], r['p'][i + 1]; L = math.hypot(b[0] - a[0], b[1] - a[1])
        if L < 0.2: continue
        ex, ez = (b[0] - a[0]) / L, (b[1] - a[1]) / L; ang = math.atan2(-ez, ex); mx, mz = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        M3 = lambda side, y: RP(mx, mz, ex, ez, 0, side, y)
        A3 = lambda k, side, y: RP(a[0], a[1], ex, ez, k, side, y)
        rl.box(M3(0, top - 0.5), L + 0.3, 5.0, 1.0, 'conc', rotz=ang)                                     # deck
        for sgn in (1, -1):
            rl.box(M3(2.4 * sgn, top + 0.5), L + 0.3, 0.2, 1.0, 'conc', rotz=ang)                          # side wall
            rl.box(M3(2.42 * sgn, top + 1.05), L + 0.3, 0.36, 0.1, 'conc', rotz=ang)                        # coping
            rl.box(M3(2.56 * sgn, top - 0.2), L + 0.3, 0.12, 0.25, 'conc', rotz=ang)                        # drip edge
            g = 1.5 * sgn                                                                                   # steel I-girders under the deck
            rl.box(M3(g, top - 1.05), L + 0.3, 0.5, 0.1, 'metal', rotz=ang); rl.box(M3(g, top - 1.45), L + 0.3, 0.14, 0.7, 'metal', rotz=ang)
            rl.box(M3(g, top - 1.85), L + 0.3, 0.5, 0.1, 'metal', rotz=ang)
            rl.box(M3(0.53 * sgn, top + 0.375), L + 0.3, 0.07, 0.15, 'metal', rotz=ang)                     # rails
        rl.box(M3(0, top + 0.1), L + 0.3, 2.6, 0.2, 'roof', rotz=ang)                                       # ballast
        t = 0.3
        while t < L:
            rl.box(A3(t, 0, top + 0.25), 0.22, 2.0, 0.1, 'conc', rotz=ang); t += 0.62                      # sleepers
        t = 2.0
        while t < L - 1:                                                                                    # cross-bracing between girders
            beam(rl, A3(t, -1.5, top - 1.8), A3(t + 2, 1.5, top - 1.1), 0.08, 'metal')
            beam(rl, A3(t, 1.5, top - 1.8), A3(t + 2, -1.5, top - 1.1), 0.08, 'metal'); t += 4
        t = 0
        while t < L:                                                                                        # piers + caps
            px, pz = a[0] + ex * t, a[1] + ez * t
            if not road_near((px, pz), -1.5) and not in_any_bld((px, pz)):
                rl.box(S3(px, pz, (top - 2.6) / 2), 1.2, 3.6, top - 2.6, 'conc', rotz=ang); rl.box(S3(px, pz, top - 2.25), 1.8, 5.4, 0.7, 'conc', rotz=ang)
            t += 14
        cw = top + 5.0                                                                                      # catenary: contact + messenger wire
        beam(rl, A3(0, 0.15, cw), A3(L, 0.15, cw), 0.05, 'metal')
        beam(rl, A3(0, 0.15, cw + 0.9), A3(L, 0.15, cw + 0.9), 0.05, 'metal')
        t = 3.0
        while t < L: beam(rl, A3(t, 0.15, cw), A3(t, 0.15, cw + 0.9), 0.025, 'metal'); t += 6
        t = acc
        while t < L:                                                                                        # masts every 30 m
            rl.box(A3(t, 2.4, top + 1.1), 0.5, 0.5, 0.2, 'conc', rotz=ang)
            rl.box(A3(t, 2.4, top + 4.2), 0.26, 0.26, 6.2, 'metal', rotz=ang)
            beam(rl, A3(t, 2.4, cw + 1.2), A3(t, -0.4, cw + 1.2), 0.12, 'metal')
            beam(rl, A3(t, 2.4, cw + 0.3), A3(t, 0.15, cw + 0.05), 0.07, 'metal')
            beam(rl, A3(t, 2.4, cw - 0.3), A3(t, 1.2, cw + 1.15), 0.06, 'metal')
            rl.box(A3(t, 0.15, cw + 1.05), 0.14, 0.14, 0.3, 'dark', rotz=ang)                              # insulator
            t += 30
        acc = t - L
        if r['k'] == 'rail_rail' and not trainDone and L > 60 and dist_cross(a) < 160:
            trainDone = True; nCar = min(4, int(L // 20)); yb = top + 0.9; yr = yb + 3.0                   # body bottom / roof
            for c in range(nCar):
                t = 6 + c * 20.5 + 10; px, pz = a[0] + ex * t, a[1] + ez * t
                T3 = lambda k, side, y: RP(px, pz, ex, ez, k, side, y)
                rl.box(T3(0, 0, yb + 1.5), 20, 2.9, 3.0, 'train', rotz=ang)
                rl.box(T3(0, 0, yb + 1.8), 20.05, 2.95, 0.35, 'trainG', rotz=ang)
                rl.box(T3(0, 0, yr + 0.05), 19.6, 2.4, 0.12, 'train', rotz=ang)                                  # roof crown
                for sgn in (1, -1):
                    rl.box(T3(0, 1.455 * sgn, yb + 2.15), 19.4, 0.02, 1.05, 'dark', rotz=ang)                   # window band
                    for w in range(6): rl.box(T3(-8 + w * 3.2, 1.46 * sgn, yb + 2.1), 1.6, 0.04, 0.9, 'glowW', rotz=ang)
                    for k in (-6.4, 0, 6.4):
                        rl.box(T3(k, 1.47 * sgn, yb + 1.35), 1.3, 0.05, 2.2, 'metal', rotz=ang)                 # doors
                        rl.box(T3(k, 1.5 * sgn, yb + 2.05), 0.9, 0.04, 0.75, 'glowW', rotz=ang)
                    rl.box(T3(0, 1.2 * sgn, yb - 0.25), 12, 0.25, 0.5, 'dark', rotz=ang)                       # underfloor boxes
                for k in (-5, 5): rl.box(T3(k, 0, yr + 0.3), 3.0, 1.8, 0.45, 'metal', rotz=ang)               # roof AC
                for k in (-7, 7):                                                                                # bogies + wheels
                    rl.box(T3(k, 0, top + 0.7), 2.6, 2.0, 0.35, 'dark', rotz=ang)
                    for w in (-0.9, 0.9):
                        for sgn in (1, -1): rl.box(T3(k + w, 0.6 * sgn, top + 0.85), 0.86, 0.12, 0.86, 'metal', rotz=ang)
                for k in (-10.2, 10.2):
                    if (k < 0 and c > 0) or (k > 0 and c < nCar - 1): rl.box(T3(k, 0, yb + 1.4), 0.6, 2.0, 2.5, 'dark', rotz=ang)   # gangway
                if c == 0 or c == nCar - 1:                                                                     # cab end
                    k = -10.0 if c == 0 else 10.0; s_ = -1 if c == 0 else 1
                    rl.box(T3(k + s_ * 0.02, 0, yb + 2.1), 0.05, 2.5, 1.1, 'glassL', rotz=ang)
                    for sd in (-0.95, 0.95): rl.box(T3(k + s_ * 0.03, sd, yb + 0.7), 0.05, 0.35, 0.2, 'glow', rotz=ang)
                if c in (1, 2):                                                                                 # pantograph up to the wire
                    rl.box(T3(-3, 0, yr + 0.15), 1.4, 1.4, 0.16, 'dark', rotz=ang)
                    for sd in (-0.35, 0.35):
                        knee = T3(-2.2, sd, yr + 0.75)
                        beam(rl, T3(-3.6, sd, yr + 0.25), knee, 0.06, 'metal'); beam(rl, knee, T3(-3.0, sd, cw - 0.05), 0.05, 'metal')
                    beam(rl, T3(-3.0, -0.8, cw - 0.06), T3(-3.0, 0.8, cw - 0.06), 0.07, 'metal')
orl = rl.obj('sb_rail', coll)

for o in (ost, omk, orl): place[o.name] = {'x': OXc, 'z': OZc}
print('buildings', nB, 'lamps', nL, 'signals', nS)

# ---------------- export ----------------
objs = [o for o in coll.objects]
for o in bpy.context.view_layer.objects: o.select_set(False)
for o in objs: o.select_set(True)
out = os.path.join(ROOT, 'assets', 'mapkit', 'shibuya.glb')
kw = dict(filepath=out, export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_materials='EXPORT', export_image_format='AUTO', export_animations=False)
try: bpy.ops.export_scene.gltf(export_vertex_color='ACTIVE', **kw)
except TypeError: bpy.ops.export_scene.gltf(**kw)
json.dump(place, open(os.path.join(HERE, 'shibuya_place.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
save_blend('assets/src/shibuya.blend')
tris = sum(len(o.data.polygons) for o in objs)
print('glb', out, os.path.getsize(out) // 1024, 'KB', 'faces', tris)
