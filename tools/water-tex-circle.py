# Water magic circle for the Tidecaller serpent shot (user 2026-11-01 ref designs/water_ref/serpent_circle_ref.png): white glowing
# lines with a cyan glow — outer double ring, a band of runes, a ring of small circles, inner ring with a 6-point star.
#   python tools/water-tex-circle.py  -> assets/fx/tex/water_magic_circle.png + .tex.json  (additive)
import json, math, os, random
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'tex')
N = 512; C = N / 2; rnd = random.Random(5)
L = Image.new('L', (N, N), 0); d = ImageDraw.Draw(L)
def ring(r, w): d.ellipse([C - r * N, C - r * N, C + r * N, C + r * N], outline=255, width=w)
ring(.485, 5); ring(.455, 2); ring(.36, 3); ring(.2, 3); ring(.05, 3)
for k in range(36):                                  # runes: little glyphs in the band between 0.37 and 0.445
    a = k / 36 * 2 * math.pi; r0, r1 = .375 * N, .44 * N; cx, cy = C + math.cos(a) * (r0 + r1) / 2, C + math.sin(a) * (r0 + r1) / 2
    tx, ty = -math.sin(a), math.cos(a); nx, ny = math.cos(a), math.sin(a); s = (r1 - r0) / 2
    for _ in range(3):
        p = rnd.choice([(-.6, -.8, .6, -.8), (-.6, 0, .6, 0), (0, -.8, 0, .8), (-.6, .8, .6, -.8), (-.6, .8, .6, .8), (.6, -.8, .6, .8)])
        x1, y1 = cx + (tx * p[0] + nx * p[1]) * s, cy + (ty * p[0] + ny * p[1]) * s; x2, y2 = cx + (tx * p[2] + nx * p[3]) * s, cy + (ty * p[2] + ny * p[3]) * s
        d.line([x1, y1, x2, y2], fill=230, width=2)
for k in range(8):                                   # ring of small circles (ref)
    a = k / 8 * 2 * math.pi + math.pi / 8; cx, cy = C + math.cos(a) * .28 * N, C + math.sin(a) * .28 * N; r = .062 * N
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=255, width=3); d.ellipse([cx - r * .45, cy - r * .45, cx + r * .45, cy + r * .45], outline=200, width=2)
for k in range(6):                                   # 6-point star inside the inner ring
    a1 = k / 6 * 2 * math.pi - math.pi / 2; a2 = (k + 2) / 6 * 2 * math.pi - math.pi / 2
    d.line([C + math.cos(a1) * .2 * N, C + math.sin(a1) * .2 * N, C + math.cos(a2) * .2 * N, C + math.sin(a2) * .2 * N], fill=255, width=3)
for k in range(24):                                  # tick marks just inside the outer ring
    a = k / 24 * 2 * math.pi; d.line([C + math.cos(a) * .462 * N, C + math.sin(a) * .462 * N, C + math.cos(a) * .48 * N, C + math.sin(a) * .48 * N], fill=255, width=2)
glow = L.filter(ImageFilter.GaussianBlur(7)); glow2 = L.filter(ImageFilter.GaussianBlur(18))
out = Image.new('RGBA', (N, N))
px, g1, g2, o = L.load(), glow.load(), glow2.load(), out.load()
for y in range(N):
    for x in range(N):
        a, b, c = px[x, y] / 255, g1[x, y] / 255, g2[x, y] / 255
        r_ = min(1, a + b * .25 + c * .1); g_ = min(1, a + b * .75 + c * .45); bl = min(1, a + b * 1.0 + c * .8)
        al = min(1, a + b * 1.1 + c * .6)
        o[x, y] = (int(r_ * 255), int(g_ * 255), int(bl * 255), int(al * 255))
out.save(os.path.join(ROOT, 'water_magic_circle.png'))
json.dump({'v': 1, 'desc': 'วงเวทน้ำ (งู Tidecaller ยิง, รูป serpent_circle_ref): เส้นขาวเรืองฟ้า วงคู่นอก แถบอักษรเวท วงกลมเล็ก 8 วง ดาว 6 แฉก', 'gen': 'image', 'seed': 5, 'px': N, 'cols': 1, 'rows': 1,
           'kind': 'loop', 'fps': 24, 'ramp': 'white', 'add': True, 'p': {}}, open(os.path.join(ROOT, 'water_magic_circle.tex.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('tex/water_magic_circle')
