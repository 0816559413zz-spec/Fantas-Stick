# abbey_build.py — decor-only "abbey mount" for the castle map (user 2026-11-22: red zones of fcs-file become scenery,
# "like the castle in picture 2" = a rocky tidal-island abbey; this is an original design in that spirit, not a copy).
# v2 (user 2026-11-22 "sculpt it in Blender, it's the map's highlight"): stratified rock with ledges, winding streets + stairs,
# houses on stone terraces (inset-look windows, shutters, dormers, timber frames), gothic abbey (aisles, flying buttresses,
# pinnacles, lancet windows, rose windows, crossing tower + crocketed spire), machicolated rampart joined to the castle wall line.
# Run:  "C:\Program Files (x86)\Steam\steamapps\common\Blender\blender.exe" -b --factory-startup --python assets/src/abbey_build.py
# Out:  assets/mapkit/abbey.glb (node ab_mount, three coords) • assets/mapkit/abbey.info.json • assets/src/abbey.blend • shots/abbey_preview_*.png
# Footprint (map metres, x east, z south): L shape = zone A x 262..530, z 0..100 + zone B x 530..630, z 0..150; the rampart's outer
# face sits OUT m further out (on the old castle wall row), tools/abbey-place.mjs removes what is under it and adds the colliders.
import sys, os, math, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
import numpy as np
from mathutils import Vector
from _kit import reset, mat, palette, swuv, ROOT, export, save_blend, srgb

reset()
R = random.Random(11)
TILE = 2.0
OUT = 3.5                                   # rampart outer face beyond the zone edge (old castle wall row z 99..103.5)
ZA0 = (262.0, 530.0, 0.0, 100.0)            # terrain zones (x0 x1 z0 z1)
ZB0 = (530.0, 630.0, 0.0, 150.0)
ZA = (ZA0[0] - OUT, ZA0[1], 0.0, ZA0[3] + OUT)   # footprint incl. rampart
ZB = (ZB0[0] - OUT, ZB0[1], 0.0, ZB0[3] + OUT)
BB = (ZA[0], 630.0, 0.0, ZB[3])
CX, CZ = (BB[0] + BB[1]) / 2, (BB[2] + BB[3]) / 2
EDGE0 = [((262, 0), (262, 100)), ((262, 100), (530, 100)), ((530, 100), (530, 150)), ((530, 150), (630, 150))]
EDGE = [((ZA[0], 0), (ZA[0], ZA[3])), ((ZA[0], ZA[3]), (ZB[0], ZA[3])), ((ZB[0], ZA[3]), (ZB[0], ZB[3])), ((ZB[0], ZB[3]), (630, ZB[3]))]
RW_H, RW_T = 13.0, 5.0

def inz(x, z, A, B): return (A[0] <= x <= A[1] and A[2] <= z <= A[3]) or (B[0] <= x <= B[1] and B[2] <= z <= B[3])
def inzone0(x, z): return inz(x, z, ZA0, ZB0)
def inzone(x, z): return inz(x, z, ZA, ZB)
def segd(px, pz, a, b):
    ax, az = a; bx, bz = b; dx, dz = bx - ax, bz - az
    t = np.clip(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz), 0, 1)
    return np.hypot(px - ax - dx * t, pz - az - dz * t)
def dedge(x, z):
    d = segd(x, z, *EDGE0[0])
    for a, b in EDGE0[1:]: d = np.minimum(d, segd(x, z, a, b))
    return d
def sstep(t): t = np.clip(t, 0, 1); return t * t * (3 - 2 * t)

# ---------------- textures ----------------
def img_from(name, arr):
    S = arr.shape[0]; im = bpy.data.images.new(name, S, S, alpha=False)
    a = np.ones((S, S, 4), np.float32); a[:, :, :3] = np.clip(arr, 0, 1); im.pixels.foreach_set(a.ravel()); im.pack(); return im
def hx(h): return np.array(srgb(h), np.float32)
def masonry(name, seed, lo, hi, mortar, rows=(0.22, 0.4), blk=(0.35, 0.8), S=256):
    Rn = np.random.RandomState(seed); px = S / TILE; img = np.zeros((S, S, 3), np.float32); hs = []; t = 0
    while t < TILE: h = Rn.uniform(*rows); hs.append(h); t += h
    hs = np.array(hs) * TILE / t; y0 = 0
    for h in hs:
        ya, yb = int(round(y0 * px)), int(round((y0 + h) * px)); y0 += h; ws = []; t = 0
        while t < TILE: w = Rn.uniform(*blk); ws.append(w); t += w
        ws = np.array(ws) * TILE / t; x = Rn.uniform(0, TILE)
        for w in ws:
            c = (lo + (hi - lo) * Rn.uniform(0, 1)) * Rn.uniform(0.94, 1.05); xa, xb = int(round(x * px)), int(round((x + w) * px)); x += w
            for xi in range(xa, xb):
                X = xi % S; img[ya:yb, X] = c; img[ya:min(ya + 2, yb), X] *= 0.86; img[max(yb - 2, ya):yb, X] *= 1.07
            img[ya:yb, xa % S] = mortar
        img[ya:ya + 1, :] = mortar
    img *= 1 + (Rn.rand(S, S, 1).astype(np.float32) - 0.5) * 0.1
    return img_from(name, img)
def slate(name, seed, lo, hi, gap, S=256):
    Rn = np.random.RandomState(seed); px = S / TILE; ch = 0.25; img = np.zeros((S, S, 3), np.float32)
    for r in range(int(TILE / ch)):
        ya, yb = int(round(r * ch * px)), int(round((r + 1) * ch * px)); x = Rn.uniform(0, 0.3) + (0.2 if r % 2 else 0)
        while x < TILE + 0.5:
            w = Rn.uniform(0.3, 0.45); c = lo + (hi - lo) * Rn.uniform(0, 1); xa, xb = int(round(x * px)), int(round((x + w) * px))
            for xi in range(xa, xb): img[ya:yb, xi % S] = c * np.linspace(0.82, 1.06, yb - ya)[:, None]
            img[ya:yb, xa % S] = gap; x += w
        img[ya:ya + 2, :] = gap
    return img_from(name, img)
def tnoise(Rn, S, octs):
    a = np.zeros((S, S), np.float32)
    for k, amp in octs:   # tileable value noise
        g = Rn.rand(k, k); up = np.kron(g, np.ones((S // k, S // k)))
        for _ in range(2): up = (up + np.roll(up, 1, 0) + np.roll(up, -1, 0) + np.roll(up, 1, 1) + np.roll(up, -1, 1)) / 5
        a += up * amp
    return (a - a.min()) / (a.max() - a.min())
def rock(name, seed, S=256):
    # stratified granite: horizontal bands (v = height on cliff faces), cracks, lichen speckles
    Rn = np.random.RandomState(seed); a = tnoise(Rn, S, ((4, 0.5), (8, 0.28), (16, 0.14), (32, 0.08)))
    yy = np.arange(S)[:, None] / S; band = 0.5 + 0.5 * np.sin((yy * 5 + a * 0.6) * math.tau)
    v = np.clip(0.55 * a + 0.45 * band, 0, 1)
    c0, c1, c2 = hx('#37342f'), hx('#5d574c'), hx('#867d6b')
    img = np.where(v[..., None] < 0.5, c0 + (c1 - c0) * (v[..., None] / 0.5), c1 + (c2 - c1) * ((v[..., None] - 0.5) / 0.5))
    seams = np.abs(np.sin((yy * 5 + a * 0.6) * math.tau)) < 0.06; img[seams] *= 0.62
    cr = Rn.rand(S, S) < 0.01; img[cr] *= 0.5
    lich = (tnoise(Rn, S, ((16, 0.6), (32, 0.4))) > 0.78); img[lich] = img[lich] * 0.6 + hx('#8f9a6a') * 0.4
    return img_from(name, img.astype(np.float32))
def cobble(name, seed, S=256):
    Rn = np.random.RandomState(seed); img = np.zeros((S, S, 3), np.float32); px = S / TILE; ch = 0.33
    for r in range(int(TILE / ch) + 1):
        ya, yb = int(r * ch * px), min(S, int((r + 1) * ch * px)); x = Rn.uniform(0, 0.3)
        while x < TILE + 0.4:
            w = Rn.uniform(0.28, 0.42); c = hx('#8a8272') * Rn.uniform(0.75, 1.1); xa, xb = int(x * px), int((x + w) * px)
            for xi in range(xa, xb): img[ya:yb, xi % S] = c
            img[ya:yb, xa % S] = hx('#4a463e'); x += w
        if ya < S: img[ya:ya + 2, :] = hx('#4a463e')
    img *= 1 + (Rn.rand(S, S, 1).astype(np.float32) - 0.5) * 0.15
    return img_from(name, img)

def tex_mat(n, img, rough):
    m = mat(n, rough=rough, img=img, double=True)
    for nd in m.node_tree.nodes:
        if nd.type == 'TEX_IMAGE': nd.interpolation = 'Linear'
    return m
STONE = tex_mat('ab_stone', masonry('ab_stone_img', 11, hx('#b0a58e'), hx('#938871'), hx('#665f52')), 0.92)
DARK = tex_mat('ab_dark', masonry('ab_dark_img', 12, hx('#8a8272'), hx('#6f675a'), hx('#4b463e'), rows=(0.3, 0.5), blk=(0.5, 1.1)), 0.95)
SLATE = tex_mat('ab_slate', slate('ab_slate_img', 13, hx('#3d434e'), hx('#5b6370'), hx('#22252b')), 0.8)
SLATE2 = tex_mat('ab_slate2', slate('ab_slate2_img', 15, hx('#4a4640'), hx('#6c655a'), hx('#2a2824')), 0.85)
ROCK = tex_mat('ab_rock', rock('ab_rock_img', 14), 0.97)
PAVE = tex_mat('ab_pave', cobble('ab_pave_img', 16), 0.95)
#        0 grass dark 1 grass  2 plaster 3 timber  4 gold    5 lead    6 bush dk 7 bush   8 brick   9 white  10 void    11 sill    12 shut grn 13 shut red 14 shut blu 15 door
PALC = ['#4a5a33', '#66763f', '#d9cfb8', '#4a3626', '#d9a93a', '#6c727a', '#2f4426', '#45602f', '#8a3f2c', '#ffffff', '#1d1f24', '#c9bfa5', '#55705f', '#7a4536', '#4c6079', '#5a3a22']
GRD, GR, PLA, TIM, GOLD, LEAD, BSH, BSH2, BRK, WHT, VOID, SILL, SHG, SHR, SHB, DOOR = range(16)
PAL = mat('ab_pal', rough=0.85, img=palette('ab_pal_img', PALC), double=True)
GLASS = mat('ab_glass', '#2a3644', rough=0.15, emit='#f0a050', emit_k=0.4, double=True)
TEXM = {'ab_stone', 'ab_dark', 'ab_slate', 'ab_slate2', 'ab_rock', 'ab_pave'}

class G:
    def __init__(s):
        s.bm = bmesh.new(); s.uv = s.bm.loops.layers.uv.new('UVMap'); s.mats = [STONE, DARK, SLATE, SLATE2, ROCK, PAVE, PAL, GLASS]; s.mi = {m.name: i for i, m in enumerate(s.mats)}
    def _v(s, p): return s.bm.verts.new((p[0], -p[2], p[1]))
    def face(s, pts, m, sw=None, uvk=1.0, smooth=False):
        try: f = s.bm.faces.new([s._v(p) for p in pts])
        except ValueError: return None
        f.material_index = s.mi[m.name]; f.normal_update(); n = Vector(f.normal); a = max(range(3), key=lambda i: abs(n[i])); f.smooth = smooth
        for l, p in zip(f.loops, pts):
            if sw is not None: l[s.uv].uv = swuv(sw)
            elif m.name in TEXM:
                x, y, z = p; u, v = (z, y) if a == 0 else ((x, y) if a == 1 else (x, z)); l[s.uv].uv = (u / TILE * uvk, v / TILE * uvk)
            else: l[s.uv].uv = (0.5, 0.5)
        return f
    def solid(s, bot, n, th, m, sw=None, mtop=None):
        top = [tuple(Vector(p) + Vector(n) * th) for p in bot]; fs = [s.face(list(reversed(bot)), m, sw), s.face(top, mtop or m, sw)]; k = len(bot)
        for i in range(k): fs.append(s.face([bot[i], bot[(i + 1) % k], top[(i + 1) % k], top[i]], m, sw))
        fs = [f for f in fs if f]; bmesh.ops.recalc_face_normals(s.bm, faces=fs)
    def box(s, c, size, m, sw=None, ry=0.0, mtop=None):
        hx_, hy, hz = size[0] / 2, size[1] / 2, size[2] / 2; cs, sn = math.cos(ry), math.sin(ry); bot = []
        for x, z in ((-hx_, -hz), (hx_, -hz), (hx_, hz), (-hx_, hz)): bot.append((c[0] + x * cs + z * sn, c[1] - hy, c[2] - x * sn + z * cs))
        s.solid(bot, (0, 1, 0), size[1], m, sw, mtop)
    def cyl(s, c, r, h, m, sw=None, seg=12, r2=None, cap=True, a0=0.0):
        r2 = r if r2 is None else r2; P = [(math.cos(a0 + i / seg * math.tau), math.sin(a0 + i / seg * math.tau)) for i in range(seg)]
        B = [(c[0] + x * r, c[1], c[2] + z * r) for x, z in P]; Tp = [(c[0] + x * r2, c[1] + h, c[2] + z * r2) for x, z in P]
        fs = [s.face(list(reversed(B)), m, sw)] + ([s.face(Tp, m, sw)] if cap and r2 > 0.01 else [])
        for i in range(seg):
            if r2 > 0.01: fs.append(s.face([B[i], B[(i + 1) % seg], Tp[(i + 1) % seg], Tp[i]], m, sw))
            else: fs.append(s.face([B[i], B[(i + 1) % seg], (c[0], c[1] + h, c[2])], m, sw))
        fs = [f for f in fs if f]; bmesh.ops.recalc_face_normals(s.bm, faces=fs)
    def blob(s, c, rad, m, sw=None, seed=0, sub=1, rough=0.35, flat=0.0):
        # displaced icosphere (boulders, tree crowns); flat > 0 squashes the bottom
        tb = bmesh.new(); bmesh.ops.create_icosphere(tb, subdivisions=sub, radius=1.0); Rn = random.Random(seed)
        P = {}
        for v in tb.verts:
            x, y, z = v.co.x, v.co.z, -v.co.y; k = 1 + rough * (Rn.random() - 0.5) * 2
            yy = y * rad[1] * k
            if flat and yy < -rad[1] * (1 - flat): yy = -rad[1] * (1 - flat)
            P[v.index] = (c[0] + x * rad[0] * k, c[1] + yy, c[2] + z * rad[2] * k)
        tb.verts.index_update()
        for f in tb.faces: s.face([P[v.index] for v in reversed(f.verts)], m, sw, uvk=0.5, smooth=True)
        tb.free()
    def build(s, name):
        bmesh.ops.remove_doubles(s.bm, verts=s.bm.verts, dist=1e-4); me = bpy.data.meshes.new(name); s.bm.to_mesh(me); s.bm.free()
        for m in s.mats: me.materials.append(m)
        ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob); return ob

g = G()
L = lambda x, z: (x - CX, z - CZ)          # map → kit local (three x, z)

# oriented helpers on a vertical wall: o = 3D point on the wall face (local), u = 2D tangent, n = 2D outward normal
def WP(o, u, n, a, y, k=0.0): return (o[0] + u[0] * a + n[0] * k, o[1] + y, o[2] + u[1] * a + n[1] * k)
def slab(o, u, n, poly, k0, k1, m, sw=None):
    g.solid([WP(o, u, n, a, y, k0) for a, y in poly], (n[0], 0, n[1]), k1 - k0, m, sw)
def rect(a0, a1, y0, y1): return [(a0, y0), (a1, y0), (a1, y1), (a0, y1)]
def lancet(o, u, n, w, h, lit=True, fr=0.22, dp=0.24, mull=True, m=STONE):
    # pointed window: glass + proud jambs / two-centred arch / sill / mullion (reads as an inset window)
    pk = h + w * 0.78; gl = [(-w / 2, 0), (w / 2, 0), (w / 2, h), (w * 0.3, h + w * 0.5), (0, pk), (-w * 0.3, h + w * 0.5), (-w / 2, h)]
    if lit is not None: g.face([WP(o, u, n, a, y, 0.04) for a, y in gl], GLASS if lit else PAL, None if lit else VOID)
    for sd in (-1, 1):
        q = lambda a, y: (a * sd, y)
        slab(o, u, n, [q(w / 2, 0), q(w / 2 + fr, 0), q(w / 2 + fr, h), q(w / 2, h)][::sd], 0, dp, m)
        I = [(w / 2, h), (w * 0.3, h + w * 0.5), (0, pk)]; O = [(w / 2 + fr, h), (w * 0.3 + fr * 0.8, h + w * 0.5 + fr * 0.6), (0, pk + fr)]
        for i in range(2): slab(o, u, n, [q(*I[i]), q(*O[i]), q(*O[i + 1]), q(*I[i + 1])][::sd], 0, dp, m)
    slab(o, u, n, rect(-w / 2 - fr - 0.1, w / 2 + fr + 0.1, -0.22, 0), 0, dp + 0.12, m)
    if mull: slab(o, u, n, rect(-0.07, 0.07, 0, h + w * 0.42), 0, dp * 0.7, m)
def rose(o, u, n, r, m=STONE):
    N = 20; ring = lambda rr, i: (math.cos(i / N * math.tau) * rr, r + 0.3 + math.sin(i / N * math.tau) * rr)
    g.face([WP(o, u, n, *ring(r, i), 0.04) for i in range(N)], GLASS)
    for i in range(N): slab(o, u, n, [ring(r, i), ring(r + 0.45, i), ring(r + 0.45, i + 1), ring(r, i + 1)], 0, 0.35, m)
    for i in range(0, N, 2):   # spokes
        a = i / N * math.tau; ca, sa = math.cos(a), math.sin(a); t = (-sa * 0.07, ca * 0.07)
        slab(o, u, n, [(ca * 0.5 + t[0], r + 0.3 + sa * 0.5 + t[1]), (ca * r + t[0], r + 0.3 + sa * r + t[1]), (ca * r - t[0], r + 0.3 + sa * r - t[1]), (ca * 0.5 - t[0], r + 0.3 + sa * 0.5 - t[1])], 0, 0.2, m)
    g.cyl(WP(o, u, n, 0, r + 0.3, 0.1), 0.6, 0.01, m, seg=8)
def pinnacle(c, s=1.0, m=STONE):
    g.box((c[0], c[1] + 1.1 * s, c[2]), (0.9 * s, 2.2 * s, 0.9 * s), m)
    g.cyl((c[0], c[1] + 2.2 * s, c[2]), 0.75 * s, 2.6 * s, m, seg=4, r2=0.0, a0=math.pi / 4)
    for k in range(2):   # crockets
        yy = c[1] + 2.2 * s + (0.7 + k * 0.8) * s; rr = 0.75 * s * (1 - (0.7 + k * 0.8) / 2.6)
        for q in range(4): a = q * math.pi / 2; g.box((c[0] + math.cos(a) * rr, yy, c[2] + math.sin(a) * rr), (0.22 * s, 0.22 * s, 0.22 * s), m)
def obox(c, u, along, hgt, across, m, sw=None, y0=None):   # box aligned with tangent u, bottom at y0 (or centred at c[1])
    ry = math.atan2(-u[1], u[0]); cy = c[1] + hgt / 2 if y0 is None else y0 + hgt / 2
    g.box((c[0], cy, c[2]), (along, hgt, across), m, sw, ry=ry)

# ---------------- height field ----------------
def vhash(i, j, sd): return (np.sin(i * 127.1 + j * 311.7 + sd * 17.3) * 43758.5453) % 1.0
def vnoise(x, z, f, sd):
    x = x * f; z = z * f; i = np.floor(x); j = np.floor(z); fx = x - i; fz = z - j; ux = fx * fx * (3 - 2 * fx); uz = fz * fz * (3 - 2 * fz)
    a, b, c, d = vhash(i, j, sd), vhash(i + 1, j, sd), vhash(i, j + 1, sd), vhash(i + 1, j + 1, sd)
    return (a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz) * 2 - 1
def fbm(x, z, f, sd, oc=4):
    s = 0; amp = 1; tot = 0
    for k in range(oc): s = s + vnoise(x, z, f * 2 ** k, sd + k) * amp; tot += amp; amp *= 0.5
    return s / tot
AX, AZ = 432.0, 32.0                  # abbey nave centre (map)
def hbase(x, z):
    d = dedge(x, z); east = np.clip((x - 500) / 110, 0, 1)
    peak = 44 - 18 * east
    t = np.clip((d - 5) / 58, 0, 1) ** 0.8; h = RW_H - 1.0 + (peak - RW_H + 1.0) * sstep(t)
    cone = np.clip(1 - np.hypot((x - AX) / 95, (z - AZ) / 62), 0, 1); h = h + 22 * cone ** 1.6        # rocky cone under the abbey
    h = h + 4.0 * fbm(x, z, 0.018, 3) * np.minimum(1, d / 18) + 1.3 * fbm(x, z, 0.09, 9, 3) * np.minimum(1, d / 10)
    q = 4.2; f = h / q; i = np.floor(f); fr = f - i; hq = (i + fr ** 5) * q          # rock ledges: flat shelves + steep risers
    h = h + (hq - h) * np.clip((d - 12) / 22, 0, 0.92)
    sm = sstep(1 - np.hypot((x - AX) / 52, (z - AZ) / 34))                          # summit crown under the abbey
    return h + sm * 4.0

STEP = 2.0
xs = np.arange(ZA0[0], BB[1] + 0.01, STEP); zs = np.arange(0.0, ZB0[3] + 0.01, STEP)
GX, GZ = np.meshgrid(xs, zs, indexing='ij')
MASK = np.vectorize(inzone0)(GX, GZ)
H = hbase(GX, GZ)

def hat(x, z):   # bilinear height at a map point
    fi = np.clip((x - xs[0]) / STEP, 0, len(xs) - 1.001); fj = np.clip((z - zs[0]) / STEP, 0, len(zs) - 1.001)
    i, j = int(fi), int(fj); a, b = fi - i, fj - j
    return float(H[i, j] * (1 - a) * (1 - b) + H[i + 1, j] * a * (1 - b) + H[i, j + 1] * (1 - a) * b + H[i + 1, j + 1] * a * b)

# rock pedestal under the abbey: the podium walls stand on cliffs instead of reaching down to the slope
ay = max(hat(AX + dx, AZ + dz) for dx in (-40, -20, 0, 20, 40) for dz in (-18, 0, 18)) + 0.5
tY = ay - 7.0; pmin = ay - 13.0
def rdist(x0, x1, z0, z1): return np.hypot(np.maximum(np.maximum(x0 - GX, GX - x1), 0), np.maximum(np.maximum(z0 - GZ, GZ - z1), 0))
cl = 2.2 * fbm(GX, GZ, 0.12, 31)
H = np.maximum(H, ay - 11.5 - 1.25 * rdist(390, 478, 10, 54) + cl)
H = np.maximum(H, tY - 9.0 - 1.25 * rdist(392, 464, 53.5, 62.5) + cl)

# ---------------- streets + stairs (carved ledges that wind up the mount) ----------------
def dense(pts, step=1.0):
    out = []
    for (ax, az), (bx, bz) in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(bx - ax, bz - az) / step))
        for k in range(n): out.append((ax + (bx - ax) * k / n, az + (bz - az) * k / n))
    out.append(pts[-1]); return np.array(out)
ROADS = [   # pts, width, sides that get houses (+1 = left of travel, -1 = right)
    ([(268, 92.5), (330, 92.5), (400, 92), (470, 92.5), (520, 92), (536, 106), (536, 141), (580, 142.5), (624, 142.5)], 4.0, (-1,)),
    ([(272, 72), (330, 73), (400, 71), (460, 73), (505, 77), (548, 97), (566, 116), (592, 124), (624, 124)], 4.0, (1, -1)),
    ([(280, 50), (330, 52), (366, 58), (386, 56)], 3.0, ()),
    ([(624, 98), (594, 86), (560, 70), (522, 62), (494, 58)], 3.6, (1, -1)),
]
RD = []   # [samples (n,2), heights (n,), width]
for pts, w, sides in ROADS:
    S = dense(pts); hb = np.array([hbase(x, z) for x, z in S], float)
    k = 25; ker = np.ones(k) / k; pad = np.pad(hb, (k // 2, k // 2), mode='edge'); hs = np.convolve(pad, ker, mode='valid')[:len(hb)]
    hs = np.maximum(hs, RW_H - 0.6); RD.append([S, hs, w, sides])
def road_h(r, i): return float(RD[r][1][i])
def nearest(r, x, z):
    S = RD[r][0]; d2 = (S[:, 0] - x) ** 2 + (S[:, 1] - z) ** 2; i = int(np.argmin(d2)); return i, float(np.sqrt(d2[i]))
STAIRS = []   # (x0, z0, h0, x1, z1, h1, width)
def link(ra, pa, rb, pb, w=3.0):
    ia, _ = nearest(ra, *pa); ib, _ = nearest(rb, *pb); A, B = RD[ra][0][ia], RD[rb][0][ib]
    STAIRS.append((float(A[0]), float(A[1]), road_h(ra, ia), float(B[0]), float(B[1]), road_h(rb, ib), w))
link(0, (318, 92.5), 1, (322, 72.5)); link(0, (452, 92.5), 1, (456, 72.5)); link(1, (346, 72.5), 2, (348, 54))
link(1, (544, 95), 3, (556, 68)); link(0, (600, 142.5), 1, (606, 124))
_i3, _ = nearest(3, 494.0, 58.0); STAIRS.append((494.0, 58.0, road_h(3, _i3), 466.0, 58.0, tY, 3.2))   # great stair to the abbey terrace
def carve(Sx, Sz, Sh, inner, blend):
    d2 = (GX[..., None] - Sx[None, None, :]) ** 2 + (GZ[..., None] - Sz[None, None, :]) ** 2
    i = np.argmin(d2, axis=2); d = np.sqrt(np.take_along_axis(d2, i[..., None], 2)[..., 0]); rh = Sh[i]
    t = sstep((d - inner) / blend); return np.where(d < inner + blend, rh + (H - rh) * t, H)
for S, hs, w, _ in RD: H = carve(S[:, 0], S[:, 1], hs, w / 2 + 0.6, 4.0)
for x0, z0, h0, x1, z1, h1, w in STAIRS:
    n = max(2, int(math.hypot(x1 - x0, z1 - z0))); t = np.linspace(0, 1, n)
    H = carve(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, h0 + (h1 - h0) * t, w / 2 + 0.5, 2.5)

# ---------------- houses along the streets ----------------
def rect_pts(cx, cz, w, d, ry, m=0.0):
    cs, sn = math.cos(ry), math.sin(ry); U, N = (cs, -sn), (sn, cs)
    return [(cx + U[0] * a + N[0] * b, cz + U[1] * a + N[1] * b) for a, b in ((-w / 2 - m, -d / 2 - m), (w / 2 + m, -d / 2 - m), (w / 2 + m, d / 2 + m), (-w / 2 - m, d / 2 + m))]
def sat(A, B):
    for P in (A, B):
        for i in range(4):
            ex, ez = P[(i + 1) % 4][0] - P[i][0], P[(i + 1) % 4][1] - P[i][1]; ax = (-ez, ex)
            pa = [p[0] * ax[0] + p[1] * ax[1] for p in A]; pb = [p[0] * ax[0] + p[1] * ax[1] for p in B]
            if max(pa) < min(pb) or max(pb) < min(pa): return False
    return True
PODIUM = (386, 482, 8, 62)
def in_podium(x, z, m=0): return PODIUM[0] - m < x < PODIUM[1] + m and PODIUM[2] - m < z < PODIUM[3] + m
def clear_of_paths(x, z, own, w_own):
    for r, (S, hs, w, _) in enumerate(RD):
        _, d = nearest(r, x, z)
        if d < w / 2 + 0.5: return False
    for x0, z0, h0, x1, z1, h1, w in STAIRS:
        if float(segd(x, z, (x0, z0), (x1, z1))) < w / 2 + 1.2: return False
    return True
HOUSES, GARDENS, RECTS = [], [], []
for r, (S, hs, w, sides) in enumerate(RD):
    for sd in sides:
        s = R.uniform(2, 6)
        while s < len(S) - 6:
            hw = R.uniform(5.5, 9.5); i = int(min(len(S) - 2, s + hw / 2)); p = S[i]; q = S[min(len(S) - 1, i + 2)]; q0 = S[max(0, i - 2)]
            tx, tz = q[0] - q0[0], q[1] - q0[1]; tl = math.hypot(tx, tz) or 1; tx, tz = tx / tl, tz / tl
            nx, nz = -tz * sd, tx * sd                                # side normal (away from the street)
            hd = R.uniform(5.5, 8.0); off = w / 2 + 0.7 + hd / 2; cx, cz = p[0] + nx * off, p[1] + nz * off
            ry = math.atan2(-nx, -nz)                                 # front (+local z) faces the street
            Pts = rect_pts(cx, cz, hw, hd, ry); ok = all(inzone0(x, z) and float(dedge(x, z)) > 2.5 for x, z in Pts + [(cx, cz)])
            ok = ok and not any(in_podium(x, z, 2) for x, z in Pts) and all(clear_of_paths(x, z, r, w) for x, z in Pts)
            ok = ok and not any(sat(rect_pts(cx, cz, hw, hd, ry, 0.15), B) for B in RECTS)
            if ok:
                if R.random() < (0.2 if r < 2 else 0.45): GARDENS.append((cx, cz, hw, hd)); RECTS.append(rect_pts(cx, cz, hw, hd, ry))
                else:
                    y0 = road_h(r, i) + 0.12; HOUSES.append((cx, cz, hw, hd, ry, y0)); RECTS.append(rect_pts(cx, cz, hw, hd, ry))
                s += hw + (R.choice((0.2, 0.2, 0.6, 1.5)))
            else: s += 2.0
# pads: cut the slope behind/under each house down to its floor (the downhill side gets a stone terrace)
for cx, cz, hw, hd, ry, y0 in HOUSES:
    cs, sn = math.cos(ry), math.sin(ry); rr = max(hw, hd) / 2 + 6
    i0, i1 = np.searchsorted(xs, cx - rr), np.searchsorted(xs, cx + rr); j0, j1 = np.searchsorted(zs, cz - rr), np.searchsorted(zs, cz + rr)
    sx, sz = GX[i0:i1, j0:j1] - cx, GZ[i0:i1, j0:j1] - cz
    la, lb = np.abs(sx * cs - sz * sn) - hw / 2, np.abs(sx * sn + sz * cs) - hd / 2
    dd = np.hypot(np.maximum(la, 0), np.maximum(lb, 0)); lim = y0 - 0.15 + np.maximum(dd - 1.0, 0) * 1.7
    H[i0:i1, j0:j1] = np.minimum(H[i0:i1, j0:j1], lim)

# ---------------- terrain mesh (smooth-shaded rock, grass shelves) ----------------
def P(i, j): x, z = L(xs[i], zs[j]); return (x, float(H[i, j]), z)
NI, NJ = len(xs), len(zs)
GN = fbm(GX, GZ, 0.05, 21)
for i in range(NI - 1):
    for j in range(NJ - 1):
        if not (MASK[i, j] and MASK[i + 1, j] and MASK[i, j + 1] and MASK[i + 1, j + 1]): continue
        quad = [P(i, j), P(i, j + 1), P(i + 1, j + 1), P(i + 1, j)]; ys = [q[1] for q in quad]; steep = max(ys) - min(ys)
        rk = steep > 1.5 or (steep > 0.9 and GN[i, j] > -0.1) or GN[i, j] > 0.5
        if rk: g.face(quad, ROCK, uvk=0.4, smooth=True)
        else: g.face(quad, PAL, GR if GN[i, j] < 0.1 else GRD, smooth=True)
# skirt down to the ground along the map edges (north z=0, east x=630) so far cameras never see under it
for i in range(NI - 1):
    if MASK[i, 0] and MASK[i + 1, 0]: a, b = P(i, 0), P(i + 1, 0); g.face([b, a, (a[0], 0, a[2]), (b[0], 0, b[2])], ROCK, uvk=0.4)
for j in range(NJ - 1):
    if MASK[NI - 1, j] and MASK[NI - 1, j + 1]: a, b = P(NI - 1, j), P(NI - 1, j + 1); g.face([a, b, (b[0], 0, b[2]), (a[0], 0, a[2])], ROCK, uvk=0.4)

# street surfaces (cobbles) + low parapets where the downhill side drops away
for S, hs, w, _ in RD:
    n = len(S)
    def side(i, k):
        a, b = S[max(0, i - 1)], S[min(n - 1, i + 1)]; tx, tz = b[0] - a[0], b[1] - a[1]; tl = math.hypot(tx, tz) or 1
        return (-tz / tl * k, tx / tl * k)
    for i in range(0, n - 1):
        o0, o1 = side(i, w / 2), side(i + 1, w / 2); y0, y1 = hs[i] + 0.08, hs[i + 1] + 0.08
        p0, p1 = L(*S[i]), L(*S[i + 1])
        g.face([(p0[0] - o0[0], y0, p0[1] - o0[1]), (p1[0] - o1[0], y1, p1[1] - o1[1]), (p1[0] + o1[0], y1, p1[1] + o1[1]), (p0[0] + o0[0], y0, p0[1] + o0[1])], PAVE)
    for i in range(0, n - 2, 2):
        for sd in (1, -1):
            o = side(i, (w / 2 + 2.2) * sd); x, z = S[i][0] + o[0], S[i][1] + o[1]
            if not inzone0(x, z) or hat(x, z) > hs[i] - 1.4: continue
            j = min(n - 1, i + 2); oa, ob = side(i, (w / 2 + 0.2) * sd), side(j, (w / 2 + 0.2) * sd)
            a, b = L(S[i][0] + oa[0], S[i][1] + oa[1]), L(S[j][0] + ob[0], S[j][1] + ob[1])
            ux, uz = b[0] - a[0], b[1] - a[1]; ul = math.hypot(ux, uz) or 1
            obox(((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2), (ux / ul, uz / ul), ul + 0.05, 2.4, 0.45, DARK, y0=(hs[i] + hs[j]) / 2 - 1.4)
# stairs
for x0, z0, h0, x1, z1, h1, w in STAIRS:
    ln = math.hypot(x1 - x0, z1 - z0); ux, uz = (x1 - x0) / ln, (z1 - z0) / ln; n = max(2, int(abs(h1 - h0) / 0.32)); dl = ln / n
    for k in range(n):
        t = (k + 0.5) / n; X, Z = L(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t); y = h0 + (h1 - h0) * (k + 1) / n
        obox((X, 0, Z), (-uz, ux), w, 1.6, dl + 0.02, DARK, y0=y - 1.6 + 0.08)
    for sd in (-1, 1):   # side walls
        for k in range(0, n, 3):
            t0, t1 = k / n, min(1, (k + 3) / n); xa, za = x0 + (x1 - x0) * t0 - uz * sd * (w / 2 + 0.25), z0 + (z1 - z0) * t0 + ux * sd * (w / 2 + 0.25)
            xb, zb = x0 + (x1 - x0) * t1 - uz * sd * (w / 2 + 0.25), z0 + (z1 - z0) * t1 + ux * sd * (w / 2 + 0.25)
            A, B = L(xa, za), L(xb, zb); ya = h0 + (h1 - h0) * t0; yb = h0 + (h1 - h0) * t1
            obox(((A[0] + B[0]) / 2, 0, (A[1] + B[1]) / 2), (ux, uz), math.hypot(B[0] - A[0], B[1] - A[1]) + 0.1, max(ya, yb) - min(ya, yb) + 2.0, 0.45, STONE, y0=min(ya, yb) - 0.6)

# ---------------- village house ----------------
def win_rect(o, u, n, w, h, lit, shut):
    g.face([WP(o, u, n, a, y, 0.03) for a, y in rect(-w / 2, w / 2, 0, h)], GLASS if lit else PAL, None if lit else VOID)
    slab(o, u, n, rect(-w / 2 - 0.18, w / 2 + 0.18, -0.2, 0), 0, 0.22, DARK)            # sill
    slab(o, u, n, rect(-w / 2 - 0.2, w / 2 + 0.2, h, h + 0.28), 0, 0.16, DARK)          # lintel
    if shut is not None:
        for sd in (-1, 1): g.face([WP(o, u, n, a, y, 0.05) for a, y in rect(sd * (w / 2 + 0.05), sd * (w / 2 + 0.05 + w * 0.5), 0, h)][::sd], PAL, shut)
def house(cx, cz, w, d, ry, y0, rng):
    X, Z = L(cx, cz); cs, sn = math.cos(ry), math.sin(ry); U, N = (cs, -sn), (sn, cs)
    lp = lambda a, y, b: (X + U[0] * a + N[0] * b, y, Z + U[1] * a + N[1] * b)
    corners = rect_pts(cx, cz, w, d, ry); gmin = min(hat(x, z) for x, z in corners + [(cx, cz)])
    kind = rng.choice(('stone', 'stone', 'plaster', 'tall')); fl = 3 if kind == 'tall' else rng.choice((2, 2, 3)); hh = fl * 2.9 + 0.3
    body = PAL if kind == 'plaster' else STONE; bsw = PLA if kind == 'plaster' else None
    # terrace / plinth
    drop = y0 - gmin
    if drop > 0.7:
        g.box((X, (y0 + gmin - 2.0) / 2, Z), (w + 1.4, y0 - gmin + 2.0, d + 1.4), DARK, ry=ry)
        g.box((X, y0 - 0.05, Z), (w + 1.7, 0.3, d + 1.7), DARK, ry=ry)                   # coping
        if drop > 3.0:
            for k in range(-1, 2, 2): g.box(lp(k * (w / 2 + 0.3), (y0 + gmin) / 2 - 1, -d / 2 - 1.1), (1.0, drop + 0.5, 1.0), DARK, ry=ry)   # buttresses
    else: g.box((X, y0 - 1.0, Z), (w + 0.3, 2.2, d + 0.3), DARK, ry=ry)
    # body (plaster houses: stone ground floor, jettied plaster upper floors)
    if kind == 'plaster':
        g.box((X, y0 + 1.5, Z), (w, 3.0, d), STONE, ry=ry); g.box((X, y0 + 3.0 + (hh - 3.0) / 2, Z), (w + 0.2, hh - 3.0, d + 0.7), PAL, PLA, ry=ry)
        dj = d / 2 + 0.35
        for b in (dj, -dj):
            nn = (N[0] * (1 if b > 0 else -1), N[1] * (1 if b > 0 else -1)); uu = (U[0] * (1 if b > 0 else -1), U[1] * (1 if b > 0 else -1))
            o = lp(0, 0, b); nposts = max(3, int(w / 1.6))
            for k in range(nposts + 1):
                a = -w / 2 + k * w / nposts; slab((o[0], y0 + 3.0, o[2]), uu, nn, rect(a - 0.1, a + 0.1, 0, hh - 3.0), 0, 0.07, PAL, TIM)
            for f in range(fl): slab((o[0], y0 + 3.0, o[2]), uu, nn, rect(-w / 2, w / 2, f * 2.9 - 0.1 if f else 0, f * 2.9 + 0.12 if f else 0.22), 0, 0.08, PAL, TIM)
    else:
        g.box((X, y0 + hh / 2, Z), (w, hh, d), STONE, ry=ry)
        for a in (-1, 1):
            for b in (-1, 1): g.box(lp(a * (w / 2 - 0.2), y0 + hh / 2, b * (d / 2 - 0.2)), (0.55, hh, 0.55), DARK, ry=ry)   # quoins
        g.box(lp(0, y0 + 2.95, 0), (w + 0.12, 0.22, d + 0.12), DARK, ry=ry)             # string course
    top = y0 + hh
    # windows + door, front (+b) and back (-b)
    shut = rng.choice((None, SHG, SHR, SHB, None))
    jet = 0.35 if kind == 'plaster' else 0.0
    for b in (1, -1):
        nn = (N[0] * b, N[1] * b); uu = (U[0] * b, U[1] * b); nw = max(1, min(3, int(w / 2.7)))
        for f in range(fl):
            dd = d / 2 + (jet if f > 0 else 0.0)
            for k in range(nw):
                a = (k - (nw - 1) / 2) * (w / nw)
                if f == 0 and b == 1 and k == nw // 2:   # door
                    o = lp(a * b, y0, dd * b); slab(o, uu, nn, rect(-0.65, 0.65, 0, 2.2), 0, 0.06, PAL, DOOR)
                    slab(o, uu, nn, rect(-0.9, 0.9, 2.2, 2.55), 0, 0.18, DARK); continue
                if rng.random() < 0.15: continue
                o = lp(a * b, y0 + f * 2.9 + 1.0, dd * b); win_rect(o, uu, nn, 0.9, 1.3, rng.random() < 0.3, shut)
    # roof: ridge along the street (gable ends at the sides) or a front gable
    front = rng.random() < 0.3; pitch = rng.uniform(0.95, 1.35); RM = SLATE if rng.random() < 0.7 else SLATE2
    span, length = (w, d + 2 * jet) if front else (d + 2 * jet, w + (0.2 if kind == 'plaster' else 0))
    rh = span / 2 * pitch; ov = 0.45
    def rp(a, y, b): return lp(b, y, a) if front else lp(a, y, b)     # (along ridge, y, across)
    for sd in (-1, 1):
        A, B = rp(-length / 2 - ov, top - ov * pitch, sd * (span / 2 + ov)), rp(length / 2 + ov, top - ov * pitch, sd * (span / 2 + ov))
        C, E = rp(length / 2 + ov, top + rh + 0.05, 0), rp(-length / 2 - ov, top + rh + 0.05, 0)
        g.solid([A, B, C, E], (0, 1, 0), 0.22, RM)
    g.box(rp(0, top + rh + 0.15, 0), (length + 2 * ov, 0.22, 0.3) if not front else (0.3, 0.22, length + 2 * ov), DARK, ry=ry)   # ridge cap
    for e in (-1, 1):
        tri = [rp(e * length / 2, top, -span / 2), rp(e * length / 2, top, span / 2), rp(e * length / 2, top + rh, 0)]
        g.face(tri if e > 0 else tri[::-1], body, bsw)
        if rng.random() < 0.5:   # gable-end attic window
            o = rp(e * (length / 2), top + rh * 0.25, 0); ue = (U[0], U[1]) if front else (-N[0] * e, -N[1] * e)
            ne = (N[0] * e, N[1] * e) if front else (U[0] * e, U[1] * e)
            if front: ue, ne = (U[0] * e, U[1] * e), (N[0] * e, N[1] * e)
            win_rect(o, ue, ne, 0.7, 0.9, rng.random() < 0.5, None)
    if rng.random() < 0.7:   # chimney + cap
        ca = rng.uniform(-0.35, 0.35) * length; cy = top + rh * 0.55
        g.box(rp(ca, cy + 1.0, span * 0.12), (0.95, rh * 0.9 + 1.4, 0.95), STONE, ry=ry); g.box(rp(ca, cy + rh * 0.45 + 1.75, span * 0.12), (1.25, 0.25, 1.25), DARK, ry=ry)
        g.box(rp(ca, cy + rh * 0.45 + 2.05, span * 0.12), (0.5, 0.35, 0.5), PAL, BRK, ry=ry)
    if not front and length > 7 and rng.random() < 0.55:   # dormer on the street slope
        da = rng.uniform(-0.2, 0.2) * length; db = span * 0.22; dy = top + (span / 2 - db) * pitch - 0.6
        g.box(rp(da, dy + 0.9, db + 0.3), (1.6, 1.8, 1.4), body, bsw, ry=ry)
        o = rp(da, dy + 0.35, db + 1.02); win_rect(o, U, N, 0.8, 1.0, rng.random() < 0.5, None)
        for sd in (-1, 1):
            A, B = rp(da + sd * 1.05, dy + 1.75, db + 1.15), rp(da + sd * 1.05, dy + 1.75, db - 0.6)
            g.solid([A, B, rp(da, dy + 2.55, db - 0.6), rp(da, dy + 2.55, db + 1.15)][::sd], (0, 1, 0), 0.14, RM)
for k, (cx, cz, hw, hd, ry, y0) in enumerate(HOUSES): house(cx, cz, hw, hd, ry, y0, random.Random(100 + k))
# gardens: hedges + trees
def tree(x, z, rng, y=None):
    X, Z = L(x, z); y = hat(x, z) if y is None else y
    if rng.random() < 0.4:   # cypress
        hh = rng.uniform(5, 8); g.cyl((X, y - 0.3, Z), 0.9, hh, PAL, BSH, seg=7, r2=0.15)
    else:
        r = rng.uniform(1.8, 3.0); g.box((X, y + 0.9, Z), (0.35, 2.0, 0.35), PAL, TIM); g.blob((X, y + 1.6 + r * 0.8, Z), (r, r * 0.85, r), PAL, BSH if rng.random() < 0.5 else BSH2, seed=rng.randrange(9999), sub=1, rough=0.25)
for k, (cx, cz, hw, hd) in enumerate(GARDENS):
    rng = random.Random(500 + k)
    for q in range(rng.randint(1, 3)): tree(cx + rng.uniform(-hw / 3, hw / 3), cz + rng.uniform(-hd / 3, hd / 3), rng)

# ---------------- rampart (machicolated) + round towers on the castle wall line ----------------
def inward(a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dz); nx, nz = -dz / l, dx / l
    mx, mz = (a[0] + b[0]) / 2 + nx * 6, (a[1] + b[1]) / 2 + nz * 6
    return (nx, nz) if inzone(mx, mz) else (-nx, -nz)
TOWERS = []
for ei, (a, b) in enumerate(EDGE):
    nx, nz = inward(a, b); dx, dz = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dz); ux, uz = dx / l, dz / l
    on = (-nx, -nz)                                                     # outward (towards the playable castle)
    c = ((a[0] + b[0]) / 2 + nx * RW_T / 2, (a[1] + b[1]) / 2 + nz * RW_T / 2); X, Z = L(*c)
    LL = l + RW_T
    obox((X, 0, Z), (ux, uz), LL, RW_H - 1.2, RW_T, STONE, y0=0)
    obox((X - on[0] * 0.3, 0, Z - on[1] * 0.3), (ux, uz), LL + 0.6, 2.8, RW_T + 0.6, DARK, y0=0)              # battered plinth
    obox((X - on[0] * 0.25, 0, Z - on[1] * 0.25), (ux, uz), LL, 0.4, RW_T + 0.5, DARK, y0=4.0)                # string course
    obox((X, 0, Z), (ux, uz), LL - 0.2, 0.4, RW_T - 0.6, DARK, y0=RW_H - 1.2)                                  # wall walk
    # outer parapet carried on corbels (machicolations)
    po = (X + on[0] * (RW_T / 2 + 0.15), Z + on[1] * (RW_T / 2 + 0.15))
    obox((po[0], 0, po[1]), (ux, uz), LL, 2.0, 1.1, STONE, y0=RW_H - 1.4)
    nc = int(LL / 1.6)
    for k in range(nc):
        t = -LL / 2 + (k + 0.5) * LL / nc; px, pz = po[0] + ux * t, po[1] + uz * t
        obox((px - on[0] * 0.1, 0, pz - on[1] * 0.1), (ux, uz), 0.55, 1.1, 1.0, DARK, y0=RW_H - 2.5)
    nm = int(LL / 2.6)
    for k in range(nm):
        t = -LL / 2 + (k + 0.5) * LL / nm; px, pz = po[0] + ux * t, po[1] + uz * t
        obox((px, 0, pz), (ux, uz), 1.4, 1.3, 1.1, STONE, y0=RW_H + 0.6)
    ip = (X - on[0] * (RW_T / 2 - 0.25), Z - on[1] * (RW_T / 2 - 0.25)); obox((ip[0], 0, ip[1]), (ux, uz), LL, 1.0, 0.5, DARK, y0=RW_H - 0.8)   # inner parapet
    for k in range(int(LL / 9)):   # arrow slits
        t = -LL / 2 + (k + 0.5) * LL / int(LL / 9); px, pz = X + on[0] * (RW_T / 2 + 0.02) + ux * t, Z + on[1] * (RW_T / 2 + 0.02) + uz * t
        g.face([(px - ux * 0.2, 6.5, pz - uz * 0.2), (px + ux * 0.2, 6.5, pz + uz * 0.2), (px + ux * 0.2, 8.6, pz + uz * 0.2), (px - ux * 0.2, 8.6, pz - uz * 0.2)][::(1 if (on[0] * -uz + on[1] * ux) < 0 else -1)], PAL, VOID)
    kk = max(1, round(l / 45))
    for q in range(1, kk): TOWERS.append((a[0] + ux * l * q / kk, a[1] + uz * l * q / kk, (nx, nz), None))
for cpt in ((ZA[0], ZA[3]), (ZB[0], ZA[3]), (ZB[0], ZB[3])):
    ns = [inward(a, b) for a, b in EDGE if cpt in (a, b)]; TOWERS.append((cpt[0], cpt[1], ns[0], ns[1]))
TW = []
for n_, (tx, tz, n1, n2) in enumerate(TOWERS):
    r = 7.0 if n2 else (5.8 if n_ % 2 else 6.4); sh = r - 3.0
    cx_, cz_ = tx + n1[0] * sh + (n2[0] * sh if n2 else 0), tz + n1[1] * sh + (n2[1] * sh if n2 else 0)
    TW.append((round(cx_, 2), round(cz_, 2), r)); X, Z = L(cx_, cz_); h = RW_H + 4 + (n_ % 2) * 3 + (3 if n2 else 0)
    g.cyl((X, 0, Z), r + 0.9, 3.0, DARK, seg=20, r2=r)
    g.cyl((X, 3.0, Z), r, h - 4.5, STONE, seg=20)
    g.cyl((X, 4.0, Z), r + 0.2, 0.4, DARK, seg=20)
    for q in range(16):   # corbel ring
        aq = q / 16 * math.tau; g.box((X + math.cos(aq) * (r + 0.25), h - 2.6, Z + math.sin(aq) * (r + 0.25)), (0.55, 1.1, 0.9), DARK, ry=-aq + math.pi / 2)
    g.cyl((X, h - 2.0, Z), r + 0.6, 2.0, STONE, seg=20)
    for q in range(10):   # merlons
        aq = (q + 0.5) / 10 * math.tau; g.box((X + math.cos(aq) * (r + 0.2), h + 0.6, Z + math.sin(aq) * (r + 0.2)), (1.6, 1.3, 0.8), STONE, ry=-aq + math.pi / 2)
    if n_ % 3 != 1:
        g.cyl((X, h - 0.1, Z), r - 0.2, r * 1.5, SLATE, seg=20, r2=0.0)    # conical roof
        g.cyl((X, h - 0.1 + r * 1.5 - 0.2, Z), 0.12, 1.6, PAL, sw=LEAD, seg=6)
    oa = math.atan2(-(n1[1] + (n2[1] if n2 else 0)), -(n1[0] + (n2[0] if n2 else 0)))
    for q in range(5):   # slits facing the castle
        aq = oa + (q - 2) * 0.42; wy = 6.0 + (q % 2) * 3.5; px, pz = X + math.cos(aq) * (r + 0.03), Z + math.sin(aq) * (r + 0.03); t2 = (-math.sin(aq) * 0.22, math.cos(aq) * 0.22)
        g.face([(px - t2[0], wy, pz - t2[1]), (px + t2[0], wy, pz + t2[1]), (px + t2[0], wy + 2.0, pz + t2[1]), (px - t2[0], wy + 2.0, pz - t2[1])], PAL, VOID)

# ---------------- abbey on the summit (gothic) ----------------
X0, Z0 = L(AX, AZ)
# podium: main platform + lower south terrace, buttressed, with cell windows
g.box((X0 + 2, (ay + pmin - 6) / 2, Z0), (88, ay - pmin + 6, 44), DARK)
g.box((X0 + 2, ay - 0.1, Z0), (88.6, 0.4, 44.6), STONE)
g.box((X0 - 4, (tY + pmin - 6) / 2, Z0 + 26), (72, tY - pmin + 6, 9), DARK); g.box((X0 - 4, tY - 0.1, Z0 + 26), (72.6, 0.4, 9.6), STONE)
for k in range(-11, 12):
    bx = X0 - 4 + k * 3.1
    if k % 3 == 0: g.box((bx, (tY + pmin - 6) / 2, Z0 + 31.2), (1.8, tY - pmin + 6, 1.6), DARK)
    if k % 2 == 0: g.box((bx, tY + 0.75, Z0 + 30.2), (1.3, 1.1, 0.8), STONE)            # merlons on the terrace
for k in range(-6, 7):
    bx = X0 + 2 + k * 6.6; g.box((bx, (ay + tY) / 2, Z0 + 22.7), (2.2, ay - tY, 1.6), DARK)
    if -5 <= k <= 4:
        for f in range(2): lancet((bx + 3.3, tY + 1.2 + f * 3.2, Z0 + 22.02), (1, 0), (0, 1), 0.8, 1.2, R.random() < 0.5, fr=0.16, dp=0.16, mull=False, m=STONE)
for k in range(-3, 4):
    g.box((X0 - 42.8, (ay + pmin - 6) / 2, Z0 + k * 6.2), (1.8, ay - pmin + 6, 2.2), DARK)   # west buttresses
    lancet((X0 - 42.02, ay - 5.5, Z0 + k * 6.2 + 3.1), (0, 1), (-1, 0), 0.8, 1.6, R.random() < 0.5, fr=0.16, dp=0.16, mull=False)
# church: west front x=-30, nave to 6, crossing 6..18, choir 18..30, apse
NW, NH, AW, AH = 12.0, 24.0, 5.0, 11.0
WX, CX0, CX1, EX = X0 - 30, X0 + 6, X0 + 18, X0 + 30
TX = (CX0 + CX1) / 2
def vessel(x0, x1, bays):
    xm, ln = (x0 + x1) / 2, x1 - x0
    g.box((xm, ay + NH / 2, Z0), (ln, NH, NW), STONE)
    g.box((xm, ay + NH - 0.6, Z0), (ln, 0.5, NW + 0.5), DARK)                            # cornice
    for sd in (-1, 1):
        g.box((xm, ay + AH / 2, Z0 + sd * (NW / 2 + AW / 2)), (ln, AH, AW), STONE)       # aisle
        A, B = (x0, ay + AH + 0.3, Z0 + sd * (NW / 2 + AW + 0.4)), (x1, ay + AH + 0.3, Z0 + sd * (NW / 2 + AW + 0.4))
        C, E = (x1, ay + AH + 4.6, Z0 + sd * NW / 2), (x0, ay + AH + 4.6, Z0 + sd * NW / 2)
        g.solid([A, B, C, E] if sd > 0 else [E, C, B, A], (0, 1, 0), 0.3, SLATE)       # lean-to aisle roof
        for k in range(bays + 1):
            bx = x0 + k * ln / bays; pz = Z0 + sd * (NW / 2 + AW + 1.0)
            g.box((bx, ay + (AH + 2.5) / 2, pz), (1.4, AH + 2.5, 2.0), STONE)              # aisle buttress
            g.box((bx, ay + 3.0, pz + sd * 0.3), (1.7, 6.0, 2.6), STONE)
            pinnacle((bx, ay + AH + 2.5, pz), 1.0)
            # flying buttress: quarter arch from the pier to the clerestory
            o = (bx, ay, Z0 + sd * NW / 2); u = (0, sd); n = (1, 0)
            arc = [(AW + 1.0 - (AW + 1.0) * math.cos(t), (NH - 6.0) - (NH - 6.0 - AH - 2.0) * math.sin(t)) for t in np.linspace(0, math.pi / 2, 6)]
            up = [(a, (NH - 3.6) + ((AH + 3.0) - (NH - 3.6)) * a / (AW + 1.0)) for a, _ in arc]
            arc[0] = (0, NH - 6.0)
            for i in range(5): slab(o, u, n, [arc[i], arc[i + 1], up[i + 1], up[i]], -0.35, 0.35, STONE)
            g.box((bx, ay + NH - 2.5, Z0 + sd * (NW / 2 + 0.4)), (1.2, 5.0, 0.8), STONE)    # wall respond
            if k < bays:
                wx = bx + ln / bays / 2
                lancet((wx, ay + AH + 5.6, Z0 + sd * NW / 2), (sd, 0) if sd > 0 else (-1, 0), (0, sd), 1.9, 4.2, True)        # clerestory
                lancet((wx, ay + 2.4, Z0 + sd * (NW / 2 + AW)), (sd, 0) if sd > 0 else (-1, 0), (0, sd), 1.6, 4.4, True)      # aisle window
        for k in range(int(ln / 1.1)):   # balustrade on the clerestory
            g.box((x0 + 0.5 + k * 1.1, ay + NH + 0.3, Z0 + sd * (NW / 2 + 0.05)), (0.5, 0.8, 0.35), STONE)
    rh = NW / 2 * 1.45
    for sd in (-1, 1):
        A, B = (x0, ay + NH - 0.2, Z0 + sd * (NW / 2 + 0.5)), (x1, ay + NH - 0.2, Z0 + sd * (NW / 2 + 0.5))
        C, E = (x1, ay + NH + rh, Z0), (x0, ay + NH + rh, Z0)
        g.solid([A, B, C, E] if sd > 0 else [E, C, B, A], (0, 1, 0), 0.35, SLATE)
    for k in range(int(ln / 1.4)): g.box((x0 + 0.7 + k * 1.4, ay + NH + rh + 0.35, Z0), (0.25, 0.7, 0.25), PAL, sw=LEAD)   # ridge cresting
    return rh
rh = vessel(WX, CX0, 6); vessel(CX1, EX, 2)
# crossing + transept
g.box((TX, ay + NH / 2, Z0), (CX1 - CX0, NH, 2 * 20), STONE)
for sd in (-1, 1):
    ez = Z0 + sd * 20
    for s2 in (-1, 1):
        g.cyl((TX + s2 * 6.4, ay, ez - sd * 0.6), 1.2, NH + 2, STONE, seg=8)              # corner turrets
        g.cyl((TX + s2 * 6.4, ay + NH + 2, ez - sd * 0.6), 1.3, 6.5, SLATE, seg=8, r2=0.0)
    rose((TX, ay + 11.5, ez), (sd, 0) if sd > 0 else (-1, 0), (0, sd), 3.4)
    lancet((TX - 2.6, ay + 2.6, ez), (sd, 0) if sd > 0 else (-1, 0), (0, sd), 1.5, 4.5, True)
    lancet((TX + 2.6, ay + 2.6, ez), (sd, 0) if sd > 0 else (-1, 0), (0, sd), 1.5, 4.5, True)
    A, B = (CX0 - 0.5, ay + NH - 0.2, ez + sd * 0.5), (CX0 - 0.5, ay + NH - 0.2, Z0)
    tri = [(TX - 6.0, ay + NH, ez), (TX + 6.0, ay + NH, ez), (TX, ay + NH + 6.0 * 1.45, ez)]
    g.face(tri if sd > 0 else tri[::-1], STONE)
    for s2 in (-1, 1):
        A, B = (TX + s2 * 6.5, ay + NH - 0.2, Z0), (TX + s2 * 6.5, ay + NH - 0.2, ez + sd * 0.5)
        C, E = (TX, ay + NH + 6.0 * 1.45, ez + sd * 0.5), (TX, ay + NH + 6.0 * 1.45, Z0)
        g.solid([A, B, C, E] if s2 * sd > 0 else [E, C, B, A], (0, 1, 0), 0.35, SLATE)
# crossing tower + octagonal spire with lucarnes, ribs and crockets, gilded figure
ty = ay + NH + 7.5; TH = 15.0
g.box((TX, (ay + NH + ty + TH) / 2, Z0), (12.4, ty + TH - ay - NH, 12.4), STONE)
g.box((TX, ty + 0.2, Z0), (13.2, 0.5, 13.2), DARK); g.box((TX, ty + TH - 0.3, Z0), (13.4, 0.6, 13.4), DARK)
for sx in (-1, 1):
    for sz in (-1, 1):
        g.box((TX + sx * 6.5, ty + TH / 2 - 2, Z0 + sz * 6.5), (1.6, TH + 4, 1.6), STONE); pinnacle((TX + sx * 6.5, ty + TH + 1.0, Z0 + sz * 6.5), 1.5)
for o, u, n in (((TX, ty, Z0 + 6.2), (1, 0), (0, 1)), ((TX, ty, Z0 - 6.2), (-1, 0), (0, -1)), ((TX + 6.2, ty, Z0), (0, -1), (1, 0)), ((TX - 6.2, ty, Z0), (0, 1), (-1, 0))):
    for a in (-2.6, 2.6): lancet((o[0] + u[0] * a, o[1] + 3.2, o[2] + u[1] * a), u, n, 1.8, 6.0, False)
for k in range(24):   # parapet merlons
    a = -6.0 + (k % 6) * 2.4; side_ = k // 6
    px, pz = [(TX + a, Z0 + 6.4), (TX + a, Z0 - 6.4), (TX + 6.4, Z0 + a), (TX - 6.4, Z0 + a)][side_]
    g.box((px, ty + TH + 0.6, pz), (0.9 if side_ < 2 else 0.6, 1.1, 0.6 if side_ < 2 else 0.9), STONE)
sy0, SPH = ty + TH, 28.0
g.cyl((TX, sy0, Z0), 5.4, 2.0, STONE, seg=8, a0=math.pi / 8)
g.cyl((TX, sy0 + 2.0, Z0), 5.2, SPH, SLATE, seg=8, r2=0.0, a0=math.pi / 8)
for q in range(8):   # ribs with crockets
    aq = math.pi / 8 + q * math.tau / 8
    for k in range(10):
        t = (k + 0.5) / 11; rr = 5.2 * (1 - t) + 0.12; g.box((TX + math.cos(aq) * rr, sy0 + 2 + SPH * t, Z0 + math.sin(aq) * rr), (0.35, 0.45, 0.35), STONE)
for q in range(4):   # lucarnes
    aq = q * math.pi / 2; px, pz = TX + math.cos(aq) * 4.2, Z0 + math.sin(aq) * 4.2; u = (-math.sin(aq), math.cos(aq)); n = (math.cos(aq), math.sin(aq))
    slab((px, sy0 + 2.0, pz), u, n, [(-1.1, 0), (1.1, 0), (1.1, 3.0), (0, 4.8), (-1.1, 3.0)], -0.8, 0.4, STONE)
    g.face([WP((px, sy0 + 2.0, pz), u, n, a, y, 0.42) for a, y in [(-0.5, 0.5), (0.5, 0.5), (0.5, 2.6), (0, 3.4), (-0.5, 2.6)]], PAL, VOID)
g.cyl((TX, sy0 + 2 + SPH - 0.5, Z0), 0.35, 2.4, PAL, sw=GOLD, seg=6, r2=0.25)             # gilded figure
g.box((TX, sy0 + 2 + SPH + 1.7, Z0), (2.0, 0.35, 0.35), PAL, sw=GOLD)
g.cyl((TX, sy0 + 2 + SPH + 1.9, Z0), 0.3, 0.6, PAL, sw=GOLD, seg=6)
# apse (tall half-decagon) + ambulatory + radiating chapels + radial flying buttresses
NA = 5
for k in range(NA):
    a0, a1 = -math.pi / 2 + k * math.pi / NA, -math.pi / 2 + (k + 1) * math.pi / NA; am = (a0 + a1) / 2
    p0, p1 = (EX + math.cos(a0) * NW / 2, Z0 + math.sin(a0) * NW / 2), (EX + math.cos(a1) * NW / 2, Z0 + math.sin(a1) * NW / 2)
    g.face([(p0[0], ay, p0[1]), (p1[0], ay, p1[1]), (p1[0], ay + NH, p1[1]), (p0[0], ay + NH, p0[1])], STONE)
    g.face([(p0[0], ay + NH, p0[1]), (p1[0], ay + NH, p1[1]), (EX, ay + NH + rh, Z0)], SLATE)
    n = (math.cos(am), math.sin(am)); u = (-n[1], n[0]); mc = ((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2)
    lancet((mc[0], ay + AH + 5.6, mc[1]), u, n, 1.6, 4.2, True)
    q0, q1 = (EX + math.cos(a0) * (NW / 2 + AW), Z0 + math.sin(a0) * (NW / 2 + AW)), (EX + math.cos(a1) * (NW / 2 + AW), Z0 + math.sin(a1) * (NW / 2 + AW))
    g.solid([(EX + math.cos(a0) * NW / 2, ay, Z0 + math.sin(a0) * NW / 2), (q0[0], ay, q0[1]), (q1[0], ay, q1[1]), (EX + math.cos(a1) * NW / 2, ay, Z0 + math.sin(a1) * NW / 2)], (0, 1, 0), AH, STONE)
    g.solid([(q0[0], ay + AH + 0.3, q0[1]), (q1[0], ay + AH + 0.3, q1[1]), (p1[0], ay + AH + 4.6, p1[1]), (p0[0], ay + AH + 4.6, p0[1])], (0, 1, 0), 0.3, SLATE)
    cc = (EX + n[0] * (NW / 2 + AW + 1.6), Z0 + n[1] * (NW / 2 + AW + 1.6))   # chapel
    g.cyl((cc[0], ay, cc[1]), 3.0, AH - 2.0, STONE, seg=8, a0=am); g.cyl((cc[0], ay + AH - 2.0, cc[1]), 3.2, 3.2, SLATE, seg=8, r2=0.0, a0=am)
    lancet((cc[0] + n[0] * 2.95, ay + 2.2, cc[1] + n[1] * 2.95), u, n, 0.9, 3.6, True, fr=0.16, mull=False)
    if k < NA - 1 or True:
        ab = a1; nb = (math.cos(ab), math.sin(ab)); pr = (EX + nb[0] * (NW / 2 + AW + 1.0), Z0 + nb[1] * (NW / 2 + AW + 1.0))
        if k < NA - 1:
            g.box((pr[0], ay + (AH + 2.5) / 2, pr[1]), (1.6, AH + 2.5, 1.6), STONE, ry=-ab); pinnacle((pr[0], ay + AH + 2.5, pr[1]), 1.0)
            o = (EX + nb[0] * NW / 2, ay, Z0 + nb[1] * NW / 2); uu = nb; nn = (-nb[1], nb[0])
            arc = [(AW + 1.0 - (AW + 1.0) * math.cos(t), (NH - 6.0) - (NH - 6.0 - AH - 2.0) * math.sin(t)) for t in np.linspace(0, math.pi / 2, 6)]
            up = [(a, (NH - 3.6) + ((AH + 3.0) - (NH - 3.6)) * a / (AW + 1.0)) for a, _ in arc]
            for i in range(5): slab(o, uu, nn, [arc[i], arc[i + 1], up[i + 1], up[i]], -0.35, 0.35, STONE)
# west front: twin towers with spires, triple portal, rose window
for sd in (-1, 1):
    tz = Z0 + sd * (NW / 2 + AW / 2 + 0.5); g.box((WX - 3.5, ay + (NH + 14) / 2, tz), (7.5, NH + 14, 7.5), STONE)
    for c2 in (-1, 1):
        g.box((WX - 3.5 - 3.9, ay + (NH + 10) / 2, tz + c2 * 3.0), (1.2, NH + 10, 1.4), STONE); pinnacle((WX - 3.5 - 3.9, ay + NH + 10, tz + c2 * 3.0), 1.2)
    g.box((WX - 3.5, ay + NH + 13.7, tz), (8.1, 0.6, 8.1), DARK)
    for a in (-1.4, 1.4): lancet((WX - 7.26, ay + NH + 2.5, tz + a), (0, -1), (-1, 0), 0.9, 6.0, False, fr=0.16, mull=False)
    g.cyl((WX - 3.5, ay + NH + 14, tz), 3.6, 16, SLATE, seg=8, r2=0.0, a0=math.pi / 8)
    g.cyl((WX - 3.5, ay + NH + 29.6, tz), 0.15, 1.8, PAL, sw=GOLD, seg=6)
    lancet((WX - 7.26, ay + 6.0, tz), (0, -1), (-1, 0), 1.3, 6.0, True, mull=False)
gtop = ay + NH; g.face([(WX - 0.02, gtop, Z0 + NW / 2), (WX - 0.02, gtop, Z0 - NW / 2), (WX - 0.02, gtop + rh, Z0)], STONE)
for k, (pw, ph, dp) in enumerate(((5.2, 7.5, 1.6), (4.2, 6.6, 1.1), (3.2, 5.8, 0.6))):   # recessed portal (nested arches)
    lancet((WX - 0.5 - dp, ay, Z0), (0, -1), (-1, 0), pw, ph, False if k == 2 else None, fr=0.5, dp=0.5, mull=False)
rose((WX, ay + 13.0, Z0), (0, -1), (-1, 0), 3.6)
# monastic range on the north + lodging block west + cloister walk south
g.box((X0 + 2, ay + 13, Z0 - 17.5), (60, 26, 9), DARK); g.box((X0 + 2, ay + 26.4, Z0 - 17.5), (60.4, 0.6, 9.4), STONE)
for sd in (-1, 1):
    A, B = (X0 - 28.5, ay + 26.5, Z0 - 17.5 + sd * 5.0), (X0 + 32.5, ay + 26.5, Z0 - 17.5 + sd * 5.0)
    g.solid([A, B, (X0 + 32.5, ay + 26.5 + 6.5, Z0 - 17.5), (X0 - 28.5, ay + 26.5 + 6.5, Z0 - 17.5)][::sd], (0, 1, 0), 0.35, SLATE)
for k in range(-4, 5): g.box((X0 + 2 + k * 6.6, ay + 11, Z0 - 22.6), (2.0, 22, 2.4), DARK)
g.box((X0 - 37, ay + 9, Z0 + 3), (12, 18, 24), STONE)
for sd in (-1, 1):
    A, B = (X0 - 37 + sd * 6.6, ay + 18, Z0 - 9.5), (X0 - 37 + sd * 6.6, ay + 18, Z0 + 15.5)
    g.solid([A, B, (X0 - 37, ay + 18 + 7.5, Z0 + 15.5), (X0 - 37, ay + 18 + 7.5, Z0 - 9.5)][::-sd], (0, 1, 0), 0.35, SLATE2)
for zz in (Z0 - 9, Z0 + 15): g.face([(X0 - 43, ay + 18, zz), (X0 - 31, ay + 18, zz), (X0 - 37, ay + 25.5, zz)], STONE)
for f in range(3):
    for k in range(-1, 2): win_rect((X0 - 37 + k * 3.6, ay + 3 + f * 4.6, Z0 + 15.02), (1, 0), (0, 1), 1.0, 1.8, R.random() < 0.5, None)
g.box((X0 - 6.4, ay + 2.6, Z0 + 20.9), (31.5, 5.2, 0.6), STONE)
A_, B_ = (X0 - 22.2, ay + 5.0, Z0 + 21.6), (X0 + 9.4, ay + 5.0, Z0 + 21.6)
g.solid([A_, B_, (X0 + 9.4, ay + 6.6, Z0 + 18.5), (X0 - 22.2, ay + 6.6, Z0 + 18.5)], (0, 1, 0), 0.25, SLATE2)
for k in range(9):   # cloister arcade on the south platform edge
    lancet((X0 - 20 + k * 3.4, ay, Z0 + 21.4), (1, 0), (0, 1), 2.2, 2.4, False, fr=0.35, dp=0.4, mull=False)
# gate tower at the east end of the south terrace (the great stair lands here)
GX0, GZ0 = L(462.0, 58.0); g.box((GX0, (pmin - 6 + ay + 9) / 2, GZ0), (7, ay + 15 - pmin, 7), STONE)
lancet((GX0 + 3.52, tY, GZ0), (0, -1), (1, 0), 2.2, 2.8, False, fr=0.4, dp=0.4, mull=False)
for q in range(4): g.box((GX0 - 3 + q * 2, ay + 9.6, GZ0 + 3.3), (1.0, 1.2, 0.6), STONE)
g.cyl((GX0 + 3.0, pmin, GZ0 - 3.0), 1.7, ay + 13 - pmin, STONE, seg=8); g.cyl((GX0 + 3.0, ay + 13, GZ0 - 3.0), 1.9, 4.8, SLATE, seg=8, r2=0.0)

# ---------------- boulders + trees on the slopes ----------------
for k in range(260):
    x, z = R.uniform(ZA0[0], BB[1]), R.uniform(0, ZB0[3])
    if abs(hat(x + 2, z) - hat(x - 2, z)) + abs(hat(x, z + 2) - hat(x, z - 2)) < 2.5: continue
    if not inzone0(x, z) or float(dedge(x, z)) < 9 or in_podium(x, z, 4) or not clear_of_paths(x, z, -1, 0): continue
    if any(sat(rect_pts(x, z, 6, 6, 0), B) for B in RECTS): continue
    X, Z = L(x, z); y = hat(x, z); r = R.uniform(1.8, 4.5)
    g.blob((X, y + r * 0.2, Z), (r * R.uniform(1, 1.6), r * R.uniform(0.6, 0.9), r), ROCK, seed=k, sub=1, rough=0.35, flat=0.3)
for k in range(110):
    x, z = R.uniform(ZA0[0], BB[1]), R.uniform(0, ZB0[3])
    if not inzone0(x, z) or float(dedge(x, z)) < 8 or in_podium(x, z, 3) or not clear_of_paths(x, z, -1, 0): continue
    if any(sat(rect_pts(x, z, 4, 4, 0), B) for B in RECTS): continue
    tree(x, z, random.Random(900 + k))

ob = g.build('ab_mount')
tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
vs = [v.co for v in ob.data.vertices]; Xs = [v.x for v in vs]; Ys = [v.z for v in vs]; Zs = [-v.y for v in vs]
info = {'tris': tris, 'x': [round(min(Xs), 3), round(max(Xs), 3)], 'y': [round(min(Ys), 3), round(max(Ys), 3)], 'z': [round(min(Zs), 3), round(max(Zs), 3)],
        'origin_map': [CX, CZ], 'zones': [ZA, ZB], 'zones0': [ZA0, ZB0], 'edge': EDGE, 'rw_t': RW_T, 'towers': TW, 'houses': len(HOUSES)}
print('ABBEY tris', tris, 'houses', len(HOUSES), 'gardens', len(GARDENS))

# ---------------- previews (from the playable castle side) ----------------
sc = bpy.context.scene
sc.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE_NEXT'
sc.render.resolution_x, sc.render.resolution_y = 1600, 800; sc.view_settings.view_transform = 'Standard'
wd = bpy.data.worlds.new('w'); sc.world = wd; wd.use_nodes = True
wd.node_tree.nodes['Background'].inputs[0].default_value = (0.45, 0.62, 0.85, 1); wd.node_tree.nodes['Background'].inputs[1].default_value = 0.8
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 3.6; sc.collection.objects.link(sun)
sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(-35))
gnd = bpy.data.meshes.new('gnd'); gnd.from_pydata([(-400, -300, 0), (400, -300, 0), (400, 300, 0), (-400, 300, 0)], [], [(0, 1, 2, 3)])
go = bpy.data.objects.new('gnd', gnd); sc.collection.objects.link(go); gnd.materials.append(mat('gnd', '#c8b48a'))
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 28; cam.data.clip_end = 3000
os.makedirs(os.path.join(ROOT, 'shots'), exist_ok=True)
def shot(name, mpos, mlook, y, ly, lens=28):
    p = L(*mpos); t = L(*mlook); cam.location = (p[0], -p[1], y); dirv = Vector((t[0], -t[1], ly)) - cam.location; cam.data.lens = lens
    cam.rotation_euler = dirv.to_track_quat('-Z', 'Y').to_euler(); sc.render.filepath = os.path.join(ROOT, 'shots', 'abbey_preview_' + name + '.png'); bpy.ops.render.render(write_still=True)
ONLY = os.environ.get('AB_SHOTS', 'castle,high,east,abbey,street')
if 'castle' in ONLY: shot('castle', (330, 190), (440, 50), 4, 22)        # standing in the castle courtyard
if 'high' in ONLY: shot('high', (360, 330), (450, 40), 90, 10)           # high view like the editor
if 'east' in ONLY: shot('east', (600, 215), (520, 60), 5, 25)            # from core 3 / sgB3
if 'abbey' in ONLY: shot('abbey', (400, 150), (432, 32), 30, 60, 40)     # abbey close-up
if 'street' in ONLY: shot('street', (300, 125), (380, 70), 14, 22, 35)  # village + streets
size = export([ob], 'assets/mapkit/abbey.glb')   # only the mount is selected/exported
for o in (go, cam, sun): bpy.data.objects.remove(o)
save_blend('assets/src/abbey.blend')
json.dump(info, open(os.path.join(ROOT, 'assets', 'mapkit', 'abbey.info.json'), 'w'), indent=1)
print('ABBEY', size, json.dumps({k: info[k] for k in ('tris', 'x', 'y', 'z')}))
