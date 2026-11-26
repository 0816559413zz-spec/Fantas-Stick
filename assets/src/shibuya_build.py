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
    mb = MB(); run = R.uniform(0, 12)
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
        if h > 12 and not station:                              # rooftop clutter
            for k in range(R.randint(1, 4)):
                p = P[R.randrange(n)]; q = (cx + (p[0] - cx) * R.uniform(0.2, 0.6), cz + (p[1] - cz) * R.uniform(0.2, 0.6))
                if in_poly(q, P): mb.box(L3(q[0], q[1], h + 0.8), R.uniform(1.5, 3.5), R.uniform(1.2, 2.5), 1.6, 'metal')
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
                        fr = 0.4; mb.quad(L3(pa[0], pa[1], y0 - fr), L3(pb[0], pb[1], y0 - fr), L3(pb[0], pb[1], y0), L3(pa[0], pa[1], y0), 'metal')
                if hero in ('magnet', 'ekimae') or (not hero and R.random() < 0.6):   # rooftop billboard(s)
                    nbb = 3 if hero == 'ekimae' else 1
                    for s in range(nbb):
                        sw = min(L * 0.8 / nbb, 14); sh = sw * 0.5625; t = L * (s + 0.5) / nbb
                        pa = (a[0] + ex * (t - sw / 2) - nx * 1.5, a[1] + ez * (t - sw / 2) - nz * 1.5); pb = (a[0] + ex * (t + sw / 2) - nx * 1.5, a[1] + ez * (t + sw / 2) - nz * 1.5)
                        y0 = h + 1.2 + (s % 2) * 0.5
                        mb.quad(L3(pa[0], pa[1], y0), L3(pb[0], pb[1], y0), L3(pb[0], pb[1], y0 + sh), L3(pa[0], pa[1], y0 + sh), 'screen', uvq(SCREEN[R.randrange(4)]))
                        mb.quad(L3(pb[0], pb[1], y0), L3(pa[0], pa[1], y0), L3(pa[0], pa[1], y0 + sh), L3(pb[0], pb[1], y0 + sh), 'metal')
                        for pp in (pa, pb): mb.box(L3(pp[0] - nx * 0.4, pp[1] - nz * 0.4, h + 0.6), 0.3, 0.3, 1.2, 'metal')
        if hero == '109':                                          # cylinder landmark: glowing ring + tall sign pillar on top
            r0 = max(math.hypot(p[0] - cx, p[1] - cz) for p in P) * 0.55
            mb.cyl(V((0, 0, h)), r0, 1.2, 'glowW', 24, cap=False); mb.cyl(V((0, 0, h + 1.2)), r0 * 0.5, 9, 'conc', 16)
            mb.cyl(V((0, 0, h + 7)), r0 * 0.52, 2.4, 'screen', 16, cap=False)
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

# ---------------- elevated rail (viaduct deck + piers + a parked train) ----------------
rl = MB(); trainDone = False
for r in D['R']:
    if r['k'] not in ('rail_rail', 'rail_subway'): continue
    top = 7.0 if r['k'] == 'rail_rail' else 11.0
    for i in range(len(r['p']) - 1):
        a, b = r['p'][i], r['p'][i + 1]; L = math.hypot(b[0] - a[0], b[1] - a[1])
        if L < 0.2: continue
        ex, ez = (b[0] - a[0]) / L, (b[1] - a[1]) / L; ang = math.atan2(-ez, ex); m = S3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, top - 0.5)
        rl.box(m, L + 0.3, 5.0, 1.0, 'conc', rotz=ang)
        for sgn in (1, -1):
            nx, nz = -ez * 2.4 * sgn, ex * 2.4 * sgn; rl.box(S3((a[0] + b[0]) / 2 + nx, (a[1] + b[1]) / 2 + nz, top + 0.5), L + 0.3, 0.2, 1.0, 'conc', rotz=ang)
        t = 0
        while t < L:
            px, pz = a[0] + ex * t, a[1] + ez * t
            if not road_near((px, pz), -1.5) and not in_any_bld((px, pz)): rl.box(S3(px, pz, (top - 1) / 2), 1.2, 3.6, top - 1, 'conc', rotz=ang)
            t += 14
        if r['k'] == 'rail_rail' and not trainDone and L > 60 and dist_cross(a) < 160:
            trainDone = True; nCar = min(4, int(L // 20))
            for c in range(nCar):
                t = 6 + c * 20.5; px, pz = a[0] + ex * (t + 10), a[1] + ez * (t + 10)
                cc = S3(px, pz, top + 2.0); rl.box(cc, 20, 2.9, 3.0, 'train', rotz=ang)
                rl.box(cc + V((0, 0, 0.3)), 20.05, 2.95, 0.35, 'trainG', rotz=ang)
                for w in range(6):
                    k = -8 + w * 3.2; wx, wz = ex * k, ez * k
                    for sgn in (1, -1): rl.box(S3(px + wx - ez * 1.46 * sgn, pz + wz + ex * 1.46 * sgn, top + 2.6), 1.6, 0.04, 0.9, 'glowW', rotz=ang)
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
