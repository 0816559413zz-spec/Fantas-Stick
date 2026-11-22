# abbey_build.py — decor-only "abbey mount" for the castle map (user 2026-11-22: red zones of fcs-file become scenery,
# "like the castle in picture 2" = a rocky tidal-island abbey; this is an original design in that spirit, not a copy).
# Run:  "C:\Program Files (x86)\Steam\steamapps\common\Blender\blender.exe" -b --factory-startup --python assets/src/abbey_build.py
# Out:  assets/mapkit/abbey.glb (node ab_mount, origin = footprint bbox centre on the ground, three coords)
#       assets/mapkit/abbey.info.json (bbox + where the footprint sits on the map) • assets/src/abbey.blend • shots/abbey_preview_*.png
# Footprint (map metres, x east, z south): L shape = zone A x 262..530, z 0..100  +  zone B x 530..630, z 0..150.
# The playable castle is west/south of it: a rampart with round towers runs along that edge; behind it a rock mount with
# stacked village houses rises to an abbey church with a tall spire. No collision (tools/abbey-place.mjs adds invisible walls).
import sys, os, math, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
import numpy as np
from mathutils import Vector
from _kit import reset, mat, palette, swuv, ROOT, export, save_blend, srgb

reset()
R = random.Random(7)
TILE = 2.0
ZA = (262.0, 530.0, 0.0, 100.0)     # x0 x1 z0 z1
ZB = (530.0, 630.0, 0.0, 150.0)
BB = (262.0, 630.0, 0.0, 150.0)
CX, CZ = (BB[0] + BB[1]) / 2, (BB[2] + BB[3]) / 2   # kit origin on the map
EDGE = [((262, 0), (262, 100)), ((262, 100), (530, 100)), ((530, 100), (530, 150)), ((530, 150), (630, 150))]   # faces the playable castle
RW_H, RW_T = 13.0, 5.0                # rampart height / thickness

def inzone(x, z): return (ZA[0] <= x <= ZA[1] and ZA[2] <= z <= ZA[3]) or (ZB[0] <= x <= ZB[1] and ZB[2] <= z <= ZB[3])
def segd(p, a, b):
    ax, az = a; bx, bz = b; dx, dz = bx - ax, bz - az; t = max(0, min(1, ((p[0] - ax) * dx + (p[1] - az) * dz) / (dx * dx + dz * dz)))
    return math.hypot(p[0] - ax - dx * t, p[1] - az - dz * t)
def dedge(x, z): return min(segd((x, z), a, b) for a, b in EDGE)

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
def slate(name, seed, S=256):
    Rn = np.random.RandomState(seed); px = S / TILE; ch = 0.25; img = np.zeros((S, S, 3), np.float32)
    lo, hi, gap = hx('#3f4550'), hx('#5d6572'), hx('#23262c')
    for r in range(int(TILE / ch)):
        ya, yb = int(round(r * ch * px)), int(round((r + 1) * ch * px)); x = Rn.uniform(0, 0.3) + (0.2 if r % 2 else 0)
        while x < TILE + 0.5:
            w = Rn.uniform(0.3, 0.45); c = lo + (hi - lo) * Rn.uniform(0, 1); xa, xb = int(round(x * px)), int(round((x + w) * px))
            for xi in range(xa, xb): img[ya:yb, xi % S] = c * np.linspace(0.82, 1.06, yb - ya)[:, None]
            img[ya:yb, xa % S] = gap; x += w
        img[ya:ya + 2, :] = gap
    return img_from(name, img)
def rock(name, seed, S=256):
    Rn = np.random.RandomState(seed); img = np.zeros((S, S, 3), np.float32); a = np.zeros((S, S), np.float32)
    for k, amp in ((4, 0.5), (8, 0.28), (16, 0.14), (32, 0.08)):   # tileable value noise
        g = Rn.rand(k, k); up = np.kron(g, np.ones((S // k, S // k)))
        for _ in range(2): up = (up + np.roll(up, 1, 0) + np.roll(up, -1, 0) + np.roll(up, 1, 1) + np.roll(up, -1, 1)) / 5
        a += up * amp
    a = (a - a.min()) / (a.max() - a.min()); c0, c1, c2 = hx('#5e574c'), hx('#8a8070'), hx('#a89d88')
    img[:] = np.where(a[..., None] < 0.5, c0 + (c1 - c0) * (a[..., None] / 0.5), c1 + (c2 - c1) * ((a[..., None] - 0.5) / 0.5))
    cr = Rn.rand(S, S) < 0.012; img[cr] *= 0.55
    return img_from(name, img)

def tex_mat(n, img, rough):
    m = mat(n, rough=rough, img=img, double=True)
    for nd in m.node_tree.nodes:
        if nd.type == 'TEX_IMAGE': nd.interpolation = 'Linear'
    return m
STONE = tex_mat('ab_stone', masonry('ab_stone_img', 11, hx('#b3a88f'), hx('#988d77'), hx('#6a6355')), 0.92)
DARK = tex_mat('ab_dark', masonry('ab_dark_img', 12, hx('#8d8574'), hx('#746c5e'), hx('#4f4a41'), rows=(0.3, 0.5), blk=(0.5, 1.1)), 0.95)
SLATE = tex_mat('ab_slate', slate('ab_slate_img', 13), 0.8)
ROCK = tex_mat('ab_rock', rock('ab_rock_img', 14), 0.97)
#        0 grass dark 1 grass   2 plaster  3 timber   4 gold     5 lead     6 bush dark 7 bush
PALC = ['#4a5a33', '#66763f', '#d9cfb8', '#4a3626', '#d9a93a', '#6c727a', '#2f4426', '#45602f', '#8a3f2c', '#ffffff', '#3a3f46', '#c9bfa5', '#000000', '#000000', '#000000', '#000000']
GRD, GR, PLA, TIM, GOLD, LEAD, BSH, BSH2, BRK, WHT, LEADD, SILL = range(12)
PAL = mat('ab_pal', rough=0.85, img=palette('ab_pal_img', PALC), double=True)
GLASS = mat('ab_glass', '#2a3644', rough=0.15, emit='#ffb860', emit_k=0.8, double=True)
TEXM = {'ab_stone', 'ab_dark', 'ab_slate', 'ab_rock'}

class G:
    def __init__(s):
        s.bm = bmesh.new(); s.uv = s.bm.loops.layers.uv.new('UVMap'); s.mats = [STONE, DARK, SLATE, ROCK, PAL, GLASS]; s.mi = {m.name: i for i, m in enumerate(s.mats)}
    def _v(s, p): return s.bm.verts.new((p[0], -p[2], p[1]))
    def face(s, pts, m, sw=None, uvk=1.0):
        try: f = s.bm.faces.new([s._v(p) for p in pts])
        except ValueError: return None
        f.material_index = s.mi[m.name]; f.normal_update(); n = Vector(f.normal); a = max(range(3), key=lambda i: abs(n[i]))
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
    def cyl(s, c, r, h, m, sw=None, seg=12, r2=None, cap=True):
        r2 = r if r2 is None else r2; P = [(math.cos(i / seg * math.tau), math.sin(i / seg * math.tau)) for i in range(seg)]
        B = [(c[0] + x * r, c[1], c[2] + z * r) for x, z in P]; Tp = [(c[0] + x * r2, c[1] + h, c[2] + z * r2) for x, z in P]
        fs = [s.face(list(reversed(B)), m, sw)] + ([s.face(Tp, m, sw)] if cap and r2 > 0.01 else [])
        for i in range(seg):
            if r2 > 0.01: fs.append(s.face([B[i], B[(i + 1) % seg], Tp[(i + 1) % seg], Tp[i]], m, sw))
            else: fs.append(s.face([B[i], B[(i + 1) % seg], (c[0], c[1] + h, c[2])], m, sw))
        fs = [f for f in fs if f]; bmesh.ops.recalc_face_normals(s.bm, faces=fs)
    def build(s, name):
        bmesh.ops.remove_doubles(s.bm, verts=s.bm.verts, dist=1e-4); me = bpy.data.meshes.new(name); s.bm.to_mesh(me); s.bm.free()
        for m in s.mats: me.materials.append(m)
        for p in me.polygons: p.use_smooth = False
        ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob); return ob

g = G()
L = lambda x, z: (x - CX, z - CZ)          # map → kit local (three x, z)

# ---------------- rock mount (height field over the L footprint) ----------------
def noise(x, z):
    return (math.sin(x * 0.071 + 1.3) * math.cos(z * 0.083 - 0.4) + 0.6 * math.sin(x * 0.17 + z * 0.13 + 2.1) + 0.35 * math.sin(x * 0.41 - z * 0.37 + 0.7))
def hmount(x, z):
    d = dedge(x, z); east = max(0.0, min(1.0, (x - 500) / 110))   # the east wing (zone B) stays lower
    peak = 50 - 26 * east
    t = max(0.0, min(1.0, (d - 4) / 62)); t = t ** 0.8
    base = RW_H - 1.5 + (peak - RW_H + 1.5) * t * t * (3 - 2 * t)
    return base + 3.2 * noise(x, z) * min(1, d / 20)
STEP = 3.0
xs = np.arange(BB[0], BB[1] + 0.01, STEP); zs = np.arange(BB[2], BB[3] + 0.01, STEP)
H = {}
for i, x in enumerate(xs):
    for j, z in enumerate(zs):
        if inzone(x, z): H[(i, j)] = hmount(x, z)
def P(i, j): x, z = L(xs[i], zs[j]); return (x, H[(i, j)], z)
for (i, j), h in H.items():
    if (i + 1, j) in H and (i, j + 1) in H and (i + 1, j + 1) in H:
        quad = [P(i, j), P(i, j + 1), P(i + 1, j + 1), P(i + 1, j)]
        ys = [q[1] for q in quad]; steep = max(ys) - min(ys)
        m = ROCK if steep > 2.2 or (xs[i] * 7 + zs[j] * 3) % 11 < 3 else PAL
        g.face(quad, m, sw=None if m is ROCK else (GR if (i * 3 + j) % 5 else GRD), uvk=0.35)
# skirt down to the ground along the map edges (north z=0, east x=630) so far cameras never see under it
for (i, j) in list(H):
    for (di, dj) in ((1, 0), (0, 1)):
        a, b = (i, j), (i + di, j + dj)
        if b not in H: continue
        onN = zs[j] == BB[2] and dj == 0 and di == 1
        onE = xs[i] == BB[1] and di == 0 and dj == 1
        if onN or onE:
            pa, pb = P(*a), P(*b); g.face([pa, pb, (pb[0], 0, pb[2]), (pa[0], 0, pa[2])], ROCK, uvk=0.35)

def hat(x, z):   # mount height at a map point (nearest grid)
    i = int(round((x - BB[0]) / STEP)); j = int(round((z - BB[2]) / STEP)); return H.get((i, j), RW_H)

# ---------------- rampart + round towers along the playable edge ----------------
def inward(a, b):   # unit normal pointing into the zone
    dx, dz = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dz); nx, nz = -dz / l, dx / l
    mx, mz = (a[0] + b[0]) / 2 + nx * 3, (a[1] + b[1]) / 2 + nz * 3
    return (nx, nz) if inzone(mx, mz) else (-nx, -nz)
towers = []
for a, b in EDGE:
    nx, nz = inward(a, b); dx, dz = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dz); ux, uz = dx / l, dz / l; ry = math.atan2(-uz, ux)
    c = ((a[0] + b[0]) / 2 + nx * RW_T / 2, (a[1] + b[1]) / 2 + nz * RW_T / 2); X, Z = L(*c)
    g.box((X, RW_H / 2, Z), (l + RW_T, RW_H, RW_T), STONE, ry=ry, mtop=DARK)
    g.box((X - nx * 0.0, 1.4, Z), (l + RW_T + 0.6, 2.8, RW_T + 1.2), DARK, ry=ry)          # battered plinth
    g.box((X - nx * (RW_T / 2 + 0.15), RW_H - 1.2, Z - nz * (RW_T / 2 + 0.15)), (l + RW_T, 0.5, 0.6), DARK, ry=ry)   # string course (outer face)
    n = int(l / 2.4)
    for k in range(n + 1):                                    # merlons on the outer edge
        t = -l / 2 + k * l / max(1, n); px, pz = X + ux * t - nx * (RW_T / 2 - 0.45), Z + uz * t - nz * (RW_T / 2 - 0.45)
        if k % 2 == 0: g.box((px, RW_H + 0.75, pz), (1.3, 1.5, 0.9), STONE, ry=ry)
    k = 0; s = 0.0
    while s <= l + 0.1:
        towers.append((a[0] + ux * s + nx * 2.0, a[1] + uz * s + nz * 2.0)); s += l / max(1, round(l / 48)); k += 1
seen = []
for t in towers:
    if any(math.hypot(t[0] - q[0], t[1] - q[1]) < 10 for q in seen): continue
    seen.append(t)
for n_, (tx_, tz_) in enumerate(seen):
    X, Z = L(tx_, tz_); r = 6.0 if n_ % 3 else 7.0; h = RW_H + 6 + (n_ % 2) * 3
    g.cyl((X, 0, Z), r + 1.0, 3.0, DARK, seg=18, r2=r)                     # battered base
    g.cyl((X, 3.0, Z), r, h - 3.0, STONE, seg=18)
    g.cyl((X, h - 1.0, Z), r + 0.5, 1.2, DARK, seg=18)                     # corbel ring
    for q in range(12):
        if q % 2: continue
        a = q / 12 * math.tau; g.box((X + math.cos(a) * (r + 0.1), h + 0.95, Z + math.sin(a) * (r + 0.1)), (1.5, 1.7, 0.9), STONE, ry=-a + math.pi / 2)
    if n_ % 2 == 0: g.cyl((X, h + 0.2, Z), r - 0.6, r * 1.4, SLATE, seg=18, r2=0.0)    # conical roof on every other tower
    for q in range(3):                                                    # arrow slits / lit windows on the outer side
        a = math.atan2(-(tz_ - 125), -(tx_ - 446)) + (q - 1) * 0.5
        wy = 6 + q * 3.5; px, pz = X + math.cos(a) * (r + 0.05), Z + math.sin(a) * (r + 0.05); tx2, tz2 = -math.sin(a) * 0.4, math.cos(a) * 0.4
        g.face([(px - tx2, wy, pz - tz2), (px + tx2, wy, pz + tz2), (px + tx2, wy + 1.6, pz + tz2), (px - tx2, wy + 1.6, pz - tz2)], GLASS)

# ---------------- village: stacked houses on the slopes ----------------
def gable_house(mx, mz, w, d, hh, ry, plaster):
    X, Z = L(mx, mz); y0 = min(hat(mx - w / 2, mz), hat(mx + w / 2, mz), hat(mx, mz - d / 2), hat(mx, mz + d / 2)) - 1.0
    top = max(hat(mx, mz), y0) + hh; bh = top - y0
    body = PAL if plaster else STONE
    g.box((X, y0 + bh / 2, Z), (w, bh, d), body, sw=PLA if plaster else None, ry=ry)
    if plaster:   # timber frame lines on the long faces
        cs, sn = math.cos(ry), math.sin(ry)
        for sd in (-1, 1):
            for k in range(-1, 2):
                ox, oz = k * w / 3, sd * (d / 2 + 0.06); px, pz = X + ox * cs + oz * sn, Z - ox * sn + oz * cs
                g.box((px, top - hh / 2, pz), (0.25, hh, 0.12), PAL, sw=TIM, ry=ry)
    rh = d * 0.55; cs, sn = math.cos(ry), math.sin(ry)
    def lp(x, y, z): return (X + x * cs + z * sn, y, Z - x * sn + z * cs)
    tri = lambda sx: [lp(sx, top, -d / 2), lp(sx, top, d / 2), lp(sx, top + rh, 0)]
    g.face(tri(-w / 2), body, sw=PLA if plaster else None); g.face(list(reversed(tri(w / 2))), body, sw=PLA if plaster else None)
    for sz in (-1, 1):
        a, b = lp(-w / 2 - 0.4, top - 0.35, sz * (d / 2 + 0.5)), lp(w / 2 + 0.4, top - 0.35, sz * (d / 2 + 0.5))
        c, e = lp(w / 2 + 0.4, top + rh + 0.1, 0), lp(-w / 2 - 0.4, top + rh + 0.1, 0)
        g.solid([a, b, c, e] if sz > 0 else [e, c, b, a], (0, 1, 0), 0.25, SLATE)
    if R.random() < 0.6: g.box(lp(w * 0.3, top + rh * 0.7, 0), (0.9, rh * 1.1, 0.9), STONE, ry=ry)   # chimney
    fl = int(hh / 3)
    for f in range(fl):                                           # lit windows on the side facing the castle
        for k in (-1, 1):
            wy = top - hh + 1.4 + f * 3; o = lp(k * w / 4, wy, d / 2 + 0.05); o2 = lp(k * w / 4 + 0.8, wy, d / 2 + 0.05)
            if R.random() < 0.55: g.face([o, o2, (o2[0], wy + 1.2, o2[2]), (o[0], wy + 1.2, o[2])], GLASS)

def face_ry(mx, mz):   # houses face the nearest playable edge
    best = min(EDGE, key=lambda e: segd((mx, mz), *e)); nx, nz = inward(*best); return math.atan2(-nx, -nz)
cells = []
for mx in np.arange(BB[0] + 8, BB[1] - 4, 11.0):
    for mz in np.arange(BB[2] + 6, BB[3] - 4, 9.5):
        x = mx + R.uniform(-2.5, 2.5); z = mz + R.uniform(-2, 2)
        if not inzone(x, z): continue
        d = dedge(x, z)
        if d < 9 or d > 46: continue
        if 380 < x < 485 and z < 52: continue                    # abbey plateau
        if R.random() < 0.4: continue
        cells.append((x, z))
for x, z in cells:
    gable_house(x, z, R.uniform(6, 9.5), R.uniform(5.5, 7.5), R.choice((5.5, 7.5, 9.5)), face_ry(x, z), R.random() < 0.3)
# rock outcrops on the steep upper slopes
for k in range(70):
    x, z = R.uniform(BB[0], BB[1]), R.uniform(BB[2], BB[3])
    if not inzone(x, z) or dedge(x, z) < 30 or (380 < x < 485 and z < 55): continue
    X, Z = L(x, z); y = hat(x, z); r = R.uniform(3, 7)
    g.cyl((X, y - 2, Z), r, R.uniform(4, 9), ROCK, seg=6, r2=r * R.uniform(0.25, 0.5))
# bushes / trees clumps between the houses
for k in range(60):
    x, z = R.uniform(BB[0], BB[1]), R.uniform(BB[2], BB[3])
    if not inzone(x, z) or dedge(x, z) < 8: continue
    X, Z = L(x, z); y = hat(x, z); r = R.uniform(2, 4)
    g.cyl((X, y - 0.5, Z), r, r * 1.4, PAL, sw=BSH if k % 2 else BSH2, seg=7, r2=r * 0.35)

# ---------------- abbey on the summit ----------------
AX, AZ = 432.0, 32.0                  # nave centre (map)
ay = max(hat(AX + dx, AZ + dz) for dx in (-35, 0, 35) for dz in (-16, 0, 16)) + 0.5
X0, Z0 = L(AX, AZ)
# podium / retaining walls with buttresses, from the slope up to the church floor
g.box((X0 + 2, ay / 2, Z0 + 2), (84, ay, 42), DARK)
for k in range(-6, 7):
    g.box((X0 + k * 6.5, ay / 2 - 1, Z0 + 23.5), (2.4, ay - 2, 3.5), DARK)        # south buttresses (towards the castle)
for k in range(-3, 4):
    g.box((X0 - 41.5, ay / 2 - 1, Z0 + k * 6), (3.5, ay - 2, 2.4), DARK)          # west buttresses
NL, NW, NH = 58.0, 13.0, 18.0
g.box((X0, ay + NH / 2, Z0), (NL, NH, NW), STONE)                              # nave
for sd in (-1, 1):
    for k in range(-4, 5):
        bx = X0 + k * 6.2; bz = Z0 + sd * (NW / 2 + 1.0)
        g.box((bx, ay + NH * 0.42, bz), (1.6, NH * 0.84, 2.0), STONE)                  # buttress
        g.cyl((bx, ay + NH * 0.84, bz), 0.7, 3.2, SLATE, seg=6, r2=0.0)                # pinnacle
        if k < 4:
            wx = bx + 3.1; wz = Z0 + sd * (NW / 2 + 0.05)
            g.face([(wx - 0.9, ay + 5, wz), (wx + 0.9, ay + 5, wz), (wx + 0.9, ay + 13, wz), (wx, ay + 14.4, wz), (wx - 0.9, ay + 13, wz)], GLASS)
def gable_roof(cx, cz, length, width, y, along_x=True, pitch=1.15, m=SLATE):
    rh = width / 2 * pitch
    for sd in (-1, 1):
        if along_x:
            a, b = (cx - length / 2 - 0.5, y - 0.2, cz + sd * (width / 2 + 0.6)), (cx + length / 2 + 0.5, y - 0.2, cz + sd * (width / 2 + 0.6))
            c, e = (cx + length / 2 + 0.5, y + rh, cz), (cx - length / 2 - 0.5, y + rh, cz)
        else:
            a, b = (cx + sd * (width / 2 + 0.6), y - 0.2, cz - length / 2 - 0.5), (cx + sd * (width / 2 + 0.6), y - 0.2, cz + length / 2 + 0.5)
            c, e = (cx, y + rh, cz + length / 2 + 0.5), (cx, y + rh, cz - length / 2 - 0.5)
        g.solid([a, b, c, e] if sd > 0 else [e, c, b, a], (0, 1, 0), 0.35, m)
    for s in (-1, 1):   # gable end walls
        if along_x: pts = [(cx + s * length / 2, y, cz - width / 2), (cx + s * length / 2, y, cz + width / 2), (cx + s * length / 2, y + rh, cz)]
        else: pts = [(cx - width / 2, y, cz + s * length / 2), (cx + width / 2, y, cz + s * length / 2), (cx, y + rh, cz + s * length / 2)]
        g.face(pts if s > 0 else list(reversed(pts)), STONE)
    return rh
gable_roof(X0, Z0, NL, NW, ay + NH)
# transept (crossing at the nave's east third)
TX = X0 + 12; g.box((TX, ay + NH / 2, Z0), (12, NH, 34), STONE); gable_roof(TX, Z0, 34, 12, ay + NH, along_x=False)
for sd in (-1, 1):   # rose windows on the transept ends
    rz = Z0 + sd * 17.05; pts = [(TX + math.cos(q / 16 * math.tau) * 2.6, ay + 11 + math.sin(q / 16 * math.tau) * 2.6, rz) for q in range(16)]
    g.face(pts if sd > 0 else list(reversed(pts)), GLASS)
# apse (half-octagon choir at the east end)
ex = X0 + NL / 2
for k in range(5):
    a0, a1 = -math.pi / 2 + k * math.pi / 4, -math.pi / 2 + (k + 1) * math.pi / 4
    p0, p1 = (ex + math.cos(a0) * NW / 2, Z0 + math.sin(a0) * NW / 2), (ex + math.cos(a1) * NW / 2, Z0 + math.sin(a1) * NW / 2)
    g.face([(p0[0], ay, p0[1]), (p1[0], ay, p1[1]), (p1[0], ay + NH, p1[1]), (p0[0], ay + NH, p0[1])], STONE)
    g.face([(p0[0], ay + NH, p0[1]), (p1[0], ay + NH, p1[1]), (ex, ay + NH + NW * 0.6, Z0)], SLATE)
    m0 = ((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2); bx, bz = ex + (m0[0] - ex) * 1.18, Z0 + (m0[1] - Z0) * 1.18
    g.box((bx, ay + NH * 0.45, bz), (1.6, NH * 0.9, 1.6), STONE, ry=-(a0 + a1) / 2)
    g.cyl((bx, ay + NH * 0.9, bz), 0.7, 3.4, SLATE, seg=6, r2=0.0)
# crossing tower + octagonal spire with a golden figure on top
ty = ay + NH + 6.5; g.box((TX, ty + 7, Z0), (12.5, 14 + 2, 12.5), STONE)
for sx in (-1, 1):
    for sz in (-1, 1):
        g.cyl((TX + sx * 6.0, ty + 15, Z0 + sz * 6.0), 0.9, 5.5, SLATE, seg=6, r2=0.0)
        g.box((TX + sx * 6.6, ty + 6, Z0 + sz * 6.6), (1.6, 18, 1.6), STONE)
for sd in (-1, 1):
    for k in (-1, 1):
        g.face([(TX + k * 2.6 - 0.8, ty + 6, Z0 + sd * 6.3), (TX + k * 2.6 + 0.8, ty + 6, Z0 + sd * 6.3), (TX + k * 2.6 + 0.8, ty + 12, Z0 + sd * 6.3), (TX + k * 2.6 - 0.8, ty + 12, Z0 + sd * 6.3)], GLASS)
g.cyl((TX, ty + 15, Z0), 5.2, 6, STONE, seg=8)                               # drum
g.cyl((TX, ty + 21, Z0), 5.0, 30, SLATE, seg=8, r2=0.0)                      # spire
g.cyl((TX, ty + 49, Z0), 0.5, 3.0, PAL, sw=GOLD, seg=6, r2=0.25)             # gilded figure
g.box((TX, ty + 52.2, Z0), (1.8, 0.35, 0.35), PAL, sw=GOLD)                    # outstretched wings
# west front: two small towers + portal
wx = X0 - NL / 2
for sd in (-1, 1):
    g.box((wx - 2, ay + 13, Z0 + sd * 5.5), (6, 26, 5), STONE); g.cyl((wx - 2, ay + 26, Z0 + sd * 5.5), 3.3, 9, SLATE, seg=8, r2=0.0)
g.face([(wx - 5.05, ay, Z0 - 2), (wx - 5.05, ay, Z0 + 2), (wx - 5.05, ay + 7, Z0 + 2), (wx - 5.05, ay + 9, Z0), (wx - 5.05, ay + 7, Z0 - 2)], GLASS)
# monastic range on the north (tall, buttressed) + cloister block west + lodging south-west
g.box((X0 + 4, ay + 12, Z0 - 17.5), (52, 24, 10), DARK); gable_roof(X0 + 4, Z0 - 17.5, 52, 10, ay + 24)
for k in range(-4, 5): g.box((X0 + 4 + k * 6, ay + 10, Z0 - 23), (1.8, 20, 2.2), DARK)
for k in range(-3, 4):
    for f in range(3):
        g.face([(X0 + 4 + k * 6 + 2, ay + 5 + f * 6, Z0 - 12.45), (X0 + 4 + k * 6 + 3.4, ay + 5 + f * 6, Z0 - 12.45), (X0 + 4 + k * 6 + 3.4, ay + 8 + f * 6, Z0 - 12.45), (X0 + 4 + k * 6 + 2, ay + 8 + f * 6, Z0 - 12.45)], GLASS)
g.box((X0 - 33, ay + 8, Z0 + 4), (14, 16, 22), STONE); gable_roof(X0 - 33, Z0 + 4, 22, 14, ay + 16, along_x=False)
g.box((X0 - 18, ay + 6, Z0 + 15.5), (20, 12, 9), STONE); gable_roof(X0 - 18, Z0 + 15.5, 20, 9, ay + 12)
for k in range(-2, 3):
    g.face([(X0 - 18 + k * 3.6 - 0.6, ay + 4, Z0 + 20.05), (X0 - 18 + k * 3.6 + 0.6, ay + 4, Z0 + 20.05), (X0 - 18 + k * 3.6 + 0.6, ay + 6.5, Z0 + 20.05), (X0 - 18 + k * 3.6 - 0.6, ay + 6.5, Z0 + 20.05)], GLASS)
# great stair up the slope from the east wing towards the abbey
for k in range(14):
    sx, sz = 505 - k * 3.2, 62 - k * 1.6; X, Z = L(sx, sz); y = hat(sx, sz)
    g.box((X, y - 0.3, Z), (3.6, 1.2, 4.5), DARK, ry=0.46)

ob = g.build('ab_mount')
tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
vs = [v.co for v in ob.data.vertices]; X = [v.x for v in vs]; Y = [v.z for v in vs]; Z = [-v.y for v in vs]
info = {'tris': tris, 'x': [round(min(X), 3), round(max(X), 3)], 'y': [round(min(Y), 3), round(max(Y), 3)], 'z': [round(min(Z), 3), round(max(Z), 3)],
        'origin_map': [CX, CZ], 'zones': [ZA, ZB], 'edge': EDGE, 'rw_t': RW_T}
print('ABBEY tris', tris)

# ---------------- previews (from the playable castle side) ----------------
sc = bpy.context.scene
sc.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE_NEXT'
sc.render.resolution_x, sc.render.resolution_y = 1600, 800; sc.view_settings.view_transform = 'Standard'
wd = bpy.data.worlds.new('w'); sc.world = wd; wd.use_nodes = True
wd.node_tree.nodes['Background'].inputs[0].default_value = (0.45, 0.62, 0.85, 1); wd.node_tree.nodes['Background'].inputs[1].default_value = 0.9
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 3.4; sc.collection.objects.link(sun)
sun.rotation_euler = (math.radians(48), math.radians(8), math.radians(-30))
gnd = bpy.data.meshes.new('gnd'); gnd.from_pydata([(-400, -300, 0), (400, -300, 0), (400, 300, 0), (-400, 300, 0)], [], [(0, 1, 2, 3)])
go = bpy.data.objects.new('gnd', gnd); sc.collection.objects.link(go); gnd.materials.append(mat('gnd', '#c8b48a'))
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 28; cam.data.clip_end = 3000
os.makedirs(os.path.join(ROOT, 'shots'), exist_ok=True)
def shot(name, mpos, mlook, y, ly):
    p = L(*mpos); t = L(*mlook); cam.location = (p[0], -p[1], y); dirv = Vector((t[0], -t[1], ly)) - cam.location
    cam.rotation_euler = dirv.to_track_quat('-Z', 'Y').to_euler(); sc.render.filepath = os.path.join(ROOT, 'shots', 'abbey_preview_' + name + '.png'); bpy.ops.render.render(write_still=True)
shot('castle', (330, 190), (440, 50), 4, 22)        # standing in the castle courtyard
shot('high', (360, 330), (450, 40), 90, 10)          # high view like the editor
shot('east', (600, 215), (520, 60), 5, 25)          # from core 3 / sgB3
size = export([ob], 'assets/mapkit/abbey.glb')   # only the mount is selected/exported
for o in (go, cam, sun): bpy.data.objects.remove(o)
save_blend('assets/src/abbey.blend')
json.dump(info, open(os.path.join(ROOT, 'assets', 'mapkit', 'abbey.info.json'), 'w'), indent=1)
print('ABBEY', size, json.dumps({k: info[k] for k in ('tris', 'x', 'y', 'z')}))
