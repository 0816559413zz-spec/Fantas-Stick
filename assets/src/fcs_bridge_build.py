# fcs_bridge_build.py - Castle Strike L-bridge outer stone shell made of real stone blocks, grouped into breakable chunks
# ("eggshell", user 2026-11-19; refs: collapsed dry-stone walls + damaged arch bridge model).
# Input : assets/src/fcs_bridge_layout.json  (tools/fcs-bridge-export.js; chunk seeds = js/12-fcs-bridge.js bskBuild, same order)
# Output: assets/buildings/fcs_bridge.glb  - one object per chunk named c<index> (index = BSKN.C index in the game)
# Run   : D:/Blender/blender.exe -b --python assets/src/fcs_bridge_build.py
# Side shell: ashlar courses (~0.3 m rows, 0.45-0.9 m blocks, running bond, 1.2 cm joints, slight relief), voussoir ring around
# every arch + jamb stones, all 0.35 m deep. Each block goes to the nearest chunk seed, so a broken chunk leaves a hole with
# edges stepped along the block joints. Rim: 3 courses of full-depth (1 m) coping blocks along each deck edge.
# The game splits every chunk back into its blocks (shared corner positions) to drop them one by one into rubble piles.
# Coordinates: game world (X, up, Z) -> Blender (X, -Z, up); the glTF exporter turns it back into Y-up.
import bpy, bmesh, json, os, math, random
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
L = json.load(open(os.path.join(HERE, 'fcs_bridge_layout.json')))
OUT = os.path.join(os.path.dirname(HERE), 'buildings', 'fcs_bridge.glb')
DH, SH, RW, RH = L['DH'], L['shell'], L['rimW'], L['rimH']
ROW, GAP, RG = 0.3, 0.012, 0.3          # course height, joint, voussoir ring width (crown outer = rim bottom)
BL = (0.45, 0.9)                        # block length range


def w2b(x, y, z):
    return Vector((x, -z, y))


def face_basis(f):
    c, n = f['c'], f['n']
    if f['ax'] == 'y':   # plane world X = c, along = world Z
        P = lambda a, u, d=0.0: w2b(c - n * d, u, a)
        A, N = w2b(0, 0, 1), w2b(n, 0, 0)
    else:                # plane world Z = c, along = world X
        P = lambda a, u, d=0.0: w2b(a, u, c - n * d)
        A, N = w2b(1, 0, 0), w2b(0, 0, n)
    return P, A, N


def ground_fn(f):
    G = f['ground']
    def g(a):
        if a <= G[0][0]: return G[0][1]
        for (a0, g0), (a1, g1) in zip(G, G[1:]):
            if a <= a1: return g0 + (g1 - g0) * (a - a0) / max(1e-6, a1 - a0)
        return G[-1][1]
    return g


def seg_at(segs, a):
    for s in segs:
        if s['p0'] - 1e-6 <= a <= s['p1'] + 1e-6: return s
    return None


def lower(segs, a):
    """bottom of the plain wall at along a (arch opening + voussoir ring + jamb column excluded)"""
    s = seg_at(segs, a)
    if not s: return 1e9
    if s['k'] == 's':
        d = abs(a - s['m']); R = s['r'] + RG
        if d < R: return s['spring'] + math.sqrt(max(0.0, R * R - d * d))
    return s['base']


def upper(segs, a):
    s = seg_at(segs, a)
    if not s: return -1e9
    if s['k'] == 'r': return s['t0'] + (s['t1'] - s['t0']) * (a - s['p0']) / max(1e-6, s['p1'] - s['p0'])
    return s['top']


def simplify(poly, tol=0.01):
    """drop points that sit on the line between their neighbours"""
    out = list(poly); i = 0
    while len(out) > 3 and i < len(out):
        p0, p1, p2 = out[i - 1], out[i], out[(i + 1) % len(out)]
        ux, uy, vx, vy = p1[0] - p0[0], p1[1] - p0[1], p2[0] - p0[0], p2[1] - p0[1]
        L = math.hypot(vx, vy)
        if L < 1e-6 or abs(ux * vy - uy * vx) / L < tol: out.pop(i)
        else: i += 1
    return out


def clip_block(segs, b0, b1, z0, z1):
    """block rectangle clipped to the wall between lower/upper curves -> list of polygons [(a,z)...]"""
    n = max(2, int(math.ceil((b1 - b0) / 0.12)) + 1)
    pts = []
    for k in range(n):
        a = b0 + (b1 - b0) * k / (n - 1)
        pts.append((a, max(z0, lower(segs, a)), min(z1, upper(segs, a))))
    if all(abs(b - z0) < 1e-6 and abs(t - z1) < 1e-6 for a, b, t in pts):   # not clipped: plain rectangle
        return [[(b0, z0), (b1, z0), (b1, z1), (b0, z1)]]
    polys, run = [], []
    for p in pts + [None]:
        if p and p[2] - p[1] > 0.03: run.append(p); continue
        if len(run) >= 2:
            polys.append(simplify([(a, b) for a, b, t in run] + [(a, t) for a, b, t in reversed(run)]))
        run = []
    return polys


def piece_add(bm, P, poly, d0, d1, back=False):
    """prism from a front polygon: front plane at depth d0 (negative = sticks out), back plane at d1"""
    pts = []
    for p in poly:   # drop repeated points
        if not pts or abs(pts[-1][0] - p[0]) > 1e-5 or abs(pts[-1][1] - p[1]) > 1e-5: pts.append(p)
    if len(pts) > 2 and abs(pts[0][0] - pts[-1][0]) < 1e-5 and abs(pts[0][1] - pts[-1][1]) < 1e-5: pts.pop()
    if len(pts) < 3: return
    fv = [bm.verts.new(P(a, z, d0)) for a, z in pts]
    bv = [bm.verts.new(P(a, z, d1)) for a, z in pts]
    ctr = sum((v.co for v in fv + bv), Vector()) / (2 * len(pts))
    def face(vs):
        try: fc = bm.faces.new(vs)
        except ValueError: return
        fc.normal_update()
        if fc.normal.dot(fc.calc_center_median() - ctr) < 0: fc.normal_flip()
    face(fv)
    if back: face(bv)
    m = len(pts)
    for i in range(m):
        j = (i + 1) % m
        face([fv[i], fv[j], bv[j], bv[i]])


def uv_world(bm):
    uv = bm.loops.layers.uv.verify()
    for fc in bm.faces:
        n = fc.normal; ax = max(range(3), key=lambda k: abs(n[k]))
        for lp in fc.loops:
            p = lp.vert.co
            lp[uv].uv = (p.y, p.z) if ax == 0 else (p.x, p.z) if ax == 1 else (p.x, p.y)


def to_obj(bm, name, coll):
    if not bm.faces:
        bm.free(); return None
    uv_world(bm)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = False
    ob = bpy.data.objects.new(name, me); coll.objects.link(ob)
    return ob


def side_pieces(f, rnd):
    """all stone pieces of one face: (centroid a, z, polygon, relief)"""
    segs, gr = f['segs'], ground_fn(f)
    a_lo, a_hi = segs[0]['p0'], segs[-1]['p1']
    top = max(s.get('top', s.get('t0', 0)) for s in segs)
    zmin = min(s['base'] for s in segs)
    out = []
    def keep(poly, rel):
        a = sum(p[0] for p in poly) / len(poly); z = sum(p[1] for p in poly) / len(poly)
        if max(p[1] for p in poly) < gr(a) - 0.35: return
        out.append((a, z, poly, rel))
    # ashlar courses from the top down
    z1, row = top, 0
    while z1 > zmin:
        h = ROW * rnd.uniform(0.82, 1.18); z0 = z1 - h
        a = a_lo - rnd.uniform(0, BL[1]) if row % 2 else a_lo
        while a < a_hi:
            b = min(a_hi, a + rnd.uniform(*BL))
            rel = -rnd.uniform(0.0, 0.028)
            for poly in clip_block(segs, max(a_lo, a) + GAP, b - GAP, z0 + GAP, z1 - GAP): keep(poly, rel)
            a = b
        z1, row = z0, row + 1
    # arches: voussoir ring + jamb column under the springing
    for s in segs:
        if s['k'] != 's': continue
        m, r, sp, base = s['m'], s['r'], s['spring'], s['base']
        n = max(9, round(math.pi * (r + RG / 2) / 0.34))
        g = GAP / (r + RG / 2)
        for k in range(n):
            t0, t1 = math.pi * k / n, math.pi * (k + 1) / n
            ts = [t0 + g + (t1 - t0 - 2 * g) * q / 2 for q in range(3)]
            poly = [(m + r * math.cos(t), sp + r * math.sin(t)) for t in ts] + [(m + (r + RG) * math.cos(t), sp + (r + RG) * math.sin(t)) for t in reversed(ts)]
            keep(poly, -0.04)   # ring stones stand out a little
        for side in (-1, 1):
            a0, a1 = (m - r - RG, m - r) if side < 0 else (m + r, m + r + RG)
            z, k = sp, 0
            while z > base + 0.02:
                h = ROW * (1.25 if k % 2 else 0.85); zb = max(base, z - h)
                keep([(a0 + GAP, zb + GAP), (a1 - GAP, zb + GAP), (a1 - GAP, z - GAP), (a0 + GAP, z - GAP)], -0.03)
                z, k = zb, k + 1
    return out


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    coll = bpy.context.scene.collection
    made = blocks = 0
    for fi, f in enumerate(L['faces']):
        P, A, N = face_basis(f)
        rnd = random.Random(9100 + fi)
        ch = [c for c in L['chunks'] if c['f'] == fi]
        seeds = [c for c in ch if not c.get('rim')]
        rims = [c for c in ch if c.get('rim')]
        groups = {}
        for a, z, poly, rel in side_pieces(f, rnd):
            best = min(seeds, key=lambda c: (c['a'] - a) ** 2 + (c['z'] - z) ** 2)
            groups.setdefault(best['i'], []).append((poly, rel, SH, False))
        # rim: 3 courses of full-depth coping blocks over the whole rim run, each block to the rim chunk holding its centre
        if rims:
            lo_a = min(min(c['a0'], c['a1']) for c in rims); hi_a = max(max(c['a0'], c['a1']) for c in rims)
            z1 = DH
            for row, h in enumerate((0.36, 0.32, 0.32)):
                z0 = z1 - h * RH
                a = lo_a if row % 2 == 0 else lo_a - rnd.uniform(0.2, 0.6)
                while a < hi_a:
                    b = min(hi_a, a + rnd.uniform(0.55, 1.0)); aa, bb = max(lo_a, a), b
                    if bb - aa > 0.1:
                        cm = (aa + bb) / 2
                        rc = next((c for c in rims if min(c['a0'], c['a1']) <= cm <= max(c['a0'], c['a1'])), None)
                        if rc:
                            zt = z1 if row == 0 else z1 - GAP
                            groups.setdefault(rc['i'], []).append(([(aa + GAP, z0 + GAP), (bb - GAP, z0 + GAP), (bb - GAP, zt), (aa + GAP, zt)], -rnd.uniform(0, 0.02), RW, False))
                    a = b
                z1 = z0
        for cid, pcs in groups.items():
            bm = bmesh.new()
            for poly, rel, dep, back in pcs:
                piece_add(bm, P, poly, rel, dep, back); blocks += 1
            if to_obj(bm, 'c%d' % cid, coll): made += 1
    tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects)
    print('chunks', made, 'of', len(L['chunks']), 'blocks', blocks, 'tris', tris)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    kw = dict(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True, export_normals=True, export_texcoords=True,
              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6, export_draco_position_quantization=16,
              export_draco_normal_quantization=8, export_draco_texcoord_quantization=10)   # 16-bit positions keep the 2.4 cm joints apart
    try:
        bpy.ops.export_scene.gltf(**kw, export_materials='NONE')
    except TypeError:
        bpy.ops.export_scene.gltf(**kw)
    print('wrote', OUT, os.path.getsize(OUT))


main()
