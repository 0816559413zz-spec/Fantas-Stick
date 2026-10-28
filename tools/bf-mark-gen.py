# Battlefield step 2 (designs/battlefield.md): ground marks that stay the whole match — style C (cartoon shapes, muted colours).
# assets/fx/tex/bf_marks.png = atlas 4 x 2 cells of 256 px, real colours (not tinted):
#   row 0: burn A, burn B (fire) · storm A, storm B (branching burnt lines)
#   row 1: crack A, crack B (earth: dirt patch + dark cracks + pebbles) · frost A, frost B (white-blue patch + frost ferns)
# Used by bfMark() in js/44-vfx-kit.js (one InstancedMesh, cell picked per mark). Needs numpy + Pillow.
# Run: python tools/bf-mark-gen.py
import json, math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'tex')
PX, COLS, ROWS, SS = 256, 4, 2, 3          # SS = supersample for smooth edges
W = PX * SS


def noise(rng, n):
    a = Image.fromarray((rng.random((n, n)) * 255).astype(np.uint8)).resize((W, W), Image.BICUBIC)
    return np.asarray(a, np.float32) / 255.0


def grid():
    y, x = np.mgrid[0:W, 0:W].astype(np.float32)
    x = x / W * 2 - 1
    y = y / W * 2 - 1
    return x, y, np.hypot(x, y), np.arctan2(y, x)


def blob(rng, r0, wob=0.12, fine=0.05):
    # wobbly round mask (0..1, ~1.5 px soft edge) of radius r0 (cell = -1..1)
    x, y, d, a = grid()
    k = [rng.uniform(0, 6.3) for _ in range(4)]
    rr = r0 * (1 + wob * (0.6 * np.sin(a * 3 + k[0]) + 0.4 * np.sin(a * 5 + k[1])) + fine * np.sin(a * 11 + k[2]))
    rr = rr * (1 + 0.25 * wob * (noise(rng, 7) - 0.5))
    return np.clip((rr - d) * W / 3.0 + 0.5, 0, 1)


def layer(img, mask, col, a):
    # paint flat colour col (hex) with alpha a*mask over img (float RGBA, premultiplied-free "over")
    c = np.array([int(col[i:i + 2], 16) / 255 for i in (1, 3, 5)], np.float32)
    m = (mask * a)[..., None]
    img[..., :3] = img[..., :3] * (1 - m) * img[..., 3:4] + c * m
    img[..., 3:4] = img[..., 3:4] * (1 - m) + m
    img[..., :3] /= np.maximum(img[..., 3:4], 1e-4)


def lines_mask(paths, widths, soft=1):
    im = Image.new('L', (W, W), 0)
    dr = ImageDraw.Draw(im)
    for pts, w in zip(paths, widths):
        P = [((p[0] + 1) / 2 * W, (p[1] + 1) / 2 * W) for p in pts]
        for i in range(len(P) - 1):
            ww = max(1, int(w * (1 - i / len(P) * 0.7) * W))
            dr.line([P[i], P[i + 1]], fill=255, width=ww)
            dr.ellipse([P[i + 1][0] - ww / 2, P[i + 1][1] - ww / 2, P[i + 1][0] + ww / 2, P[i + 1][1] + ww / 2], fill=255)
    if soft:
        im = im.filter(ImageFilter.GaussianBlur(soft * SS))
    return np.asarray(im, np.float32) / 255.0


def branch(rng, n, r, jag=0.5, sub=0.5, start=0.05):
    # jagged lines from the centre out (+ side branches) — cracks / lightning scars
    paths, widths = [], []
    for i in range(n):
        an = i / n * 6.283 + rng.uniform(-0.3, 0.3)
        segs = rng.integers(4, 7)
        ln = r * rng.uniform(0.7, 1.0) / segs
        x, y = math.cos(an) * start, math.sin(an) * start
        pts = [(x, y)]
        for k in range(segs):
            an += rng.uniform(-jag, jag)
            x += math.cos(an) * ln
            y += math.sin(an) * ln
            pts.append((x, y))
            if 0 < k < segs - 1 and rng.random() < sub:
                ba, bx, by, bp = an + rng.choice([-1, 1]) * rng.uniform(0.5, 1.1), x, y, [(x, y)]
                for _ in range(2):
                    ba += rng.uniform(-0.4, 0.4)
                    bx += math.cos(ba) * ln * 0.6
                    by += math.sin(ba) * ln * 0.6
                    bp.append((bx, by))
                paths.append(bp)
                widths.append(0.5)
        paths.append(pts)
        widths.append(1.0)
    return paths, widths


def dots(rng, n, rmin, rmax, size):
    x, y, d, a = grid()
    m = np.zeros((W, W), np.float32)
    for _ in range(n):
        an, dd = rng.uniform(0, 6.283), rng.uniform(rmin, rmax)
        cx, cy, s = math.cos(an) * dd, math.sin(an) * dd, rng.uniform(*size)
        m = np.maximum(m, np.clip((s - np.hypot(x - cx, y - cy)) * W / 3.0 + 0.5, 0, 1))
    return m


def burn(seed):
    rng = np.random.default_rng(seed)
    img = np.zeros((W, W, 4), np.float32)
    layer(img, dots(rng, 26, 0.6, 0.92, (0.02, 0.06)), '#2c241e', 0.55)     # soot splatter around the edge
    layer(img, blob(rng, 0.78, 0.16), '#5b4634', 0.55)                     # brown scorched rim
    layer(img, blob(rng, 0.62, 0.18), '#2b211a', 0.88)                     # dark burn
    layer(img, blob(rng, 0.38, 0.22), '#141010', 0.92)                     # black centre
    layer(img, dots(rng, 22, 0.05, 0.5, (0.012, 0.03)), '#6d6660', 0.7)     # grey ash specks
    return img


def storm(seed):
    rng = np.random.default_rng(seed)
    img = np.zeros((W, W, 4), np.float32)
    p, w = branch(rng, 7, 0.85, jag=0.7, sub=0.6)
    layer(img, lines_mask(p, [q * 0.045 for q in w], soft=3), '#3a3430', 0.45)  # grey singed halo
    layer(img, lines_mask(p, [q * 0.016 for q in w], soft=0.6), '#151111', 0.92)  # black burnt line
    layer(img, blob(rng, 0.2, 0.25), '#1c1715', 0.85)                      # small burnt spot at the strike
    layer(img, dots(rng, 14, 0.15, 0.7, (0.01, 0.025)), '#26201c', 0.7)
    return img


def crack(seed):
    rng = np.random.default_rng(seed)
    img = np.zeros((W, W, 4), np.float32)
    layer(img, blob(rng, 0.85, 0.2) * (0.55 + 0.45 * noise(rng, 9)), '#6e5c48', 0.55)   # churned dirt patch
    layer(img, blob(rng, 0.5, 0.25), '#57483a', 0.5)
    p, w = branch(rng, 5, 0.9, jag=0.4, sub=0.25, start=0.08)
    layer(img, lines_mask(p, [q * 0.05 for q in w], soft=1), '#4a3d31', 0.6)   # crack shoulder
    layer(img, lines_mask(p, [q * 0.022 for q in w], soft=0.5), '#1e1813', 0.95)  # dark crack
    layer(img, dots(rng, 18, 0.1, 0.85, (0.015, 0.04)), '#8d7d68', 0.85)     # pebbles
    layer(img, dots(rng, 10, 0.1, 0.85, (0.01, 0.025)), '#3a3028', 0.8)
    return img


def frost(seed):
    rng = np.random.default_rng(seed)
    img = np.zeros((W, W, 4), np.float32)
    layer(img, blob(rng, 0.82, 0.2), '#9cc4e0', 0.45)                      # blue edge
    layer(img, blob(rng, 0.68, 0.18) * (0.7 + 0.3 * noise(rng, 11)), '#dcecf8', 0.75)   # frost patch
    p, w = branch(rng, 9, 0.88, jag=0.25, sub=0.9)
    layer(img, lines_mask(p, [q * 0.03 for q in w], soft=1.5), '#ffffff', 0.85)   # frost ferns
    layer(img, lines_mask(p, [q * 0.012 for q in w], soft=0.4), '#8fb8d8', 0.6)
    layer(img, dots(rng, 20, 0.1, 0.8, (0.01, 0.022)), '#ffffff', 0.9)       # glints
    return img


cells = [burn(3), burn(17), storm(5), storm(29), crack(7), crack(41), frost(11), frost(23)]
sheet = Image.new('RGBA', (PX * COLS, PX * ROWS))
for i, c in enumerate(cells):
    a = np.clip(c, 0, 1)
    im = Image.fromarray((a * 255).astype(np.uint8), 'RGBA').resize((PX, PX), Image.LANCZOS)
    sheet.paste(im, ((i % COLS) * PX, (i // COLS) * PX))
sheet.save(os.path.join(ROOT, 'bf_marks.png'), optimize=True)
meta = {"v": 1, "desc": "รอยสนามรบค้างทั้งแมตช์ (แบบ C): ไหม้ ×2 / สายฟ้า ×2 / พื้นแตก ×2 / น้ำแข็ง ×2 — สีจริง ไม่ย้อม • tools/bf-mark-gen.py • designs/battlefield.md ขั้น 2",
        "gen": "image", "seed": 3, "px": PX, "cols": COLS, "rows": ROWS, "kind": "loop", "fps": 4, "ramp": "white", "add": False, "rand": True, "p": {}}
with open(os.path.join(ROOT, 'bf_marks.tex.json'), 'w', encoding='utf8') as f:
    json.dump(meta, f, ensure_ascii=False, indent=1)
print('wrote bf_marks')
