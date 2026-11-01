# Moonwater Arts textures (user 2026-11-01, ref designs/water_ref/moon_mark_ref.jpg):
#   water_moon_mark     — the mark shown on activation: long 4-point star (dark-blue ink outline, blue fill, white-hot centre),
#                         three orbit ellipses and small moons, hand-drawn look
#   water_moon_crescent — the half moon that stays behind the head: silver-white crescent with a soft cool glow
#   python tools/water-tex-moon.py  -> assets/fx/tex/<name>.png + .tex.json
import json, math, os, random
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'tex')
def meta(name, desc, add):
    json.dump({'v': 1, 'desc': desc, 'gen': 'image', 'seed': 3, 'px': 512, 'cols': 1, 'rows': 1, 'kind': 'loop', 'fps': 24, 'ramp': 'white', 'add': add, 'p': {}},
              open(os.path.join(ROOT, name + '.tex.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('tex/' + name)
N = 512; C = N / 2; rnd = random.Random(3)
INK, BLUE, LBLUE = (20, 30, 90, 255), (60, 140, 230, 255), (150, 210, 255, 255)

# ---------- mark ----------
im = Image.new('RGBA', (N, N), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
for k, (rx, ry, ang) in enumerate([(.42, .17, 35), (.42, .17, -35), (.3, .3, 0)]):   # orbits: 2 tilted ellipses + 1 circle (broken arcs)
    pts = []
    for i in range(181):
        t = i / 180 * 2 * math.pi; x, y = rx * N * math.cos(t), ry * N * math.sin(t); a = math.radians(ang)
        pts.append((C + x * math.cos(a) - y * math.sin(a), C + x * math.sin(a) + y * math.cos(a)))
    for i in range(180):
        if (i // 22) % 4 == 3: continue   # gaps like the sketch
        d.line([pts[i], pts[i + 1]], fill=LBLUE, width=9); d.line([pts[i], pts[i + 1]], fill=INK, width=2)
for (px, py, r) in [(.34, .4, .045), (.66, .64, .05), (.32, .62, .025), (.56, .3, .03), (.7, .47, .02)]:   # small moons
    x, y = px * N, py * N; R = r * N; d.ellipse([x - R, y - R, x + R, y + R], fill=LBLUE, outline=INK, width=3); d.ellipse([x - R * .5, y - R * .5, x + R * .4, y + R * .4], fill=(230, 245, 255, 255))
def spike(ang, L, w):
    a = math.radians(ang); ux, uy = math.cos(a), math.sin(a); px, py = -uy, ux
    return [(C + px * w, C + py * w), (C + ux * L, C + uy * L), (C - px * w, C - py * w)]
for k in range(4):   # long 4-point star (vertical/horizontal), ink outline + blue fill
    poly = spike(k * 90 - 90, N * (.47 if k % 2 == 0 else .46), N * .045); d.polygon(poly, fill=BLUE, outline=INK); d.line(poly + [poly[0]], fill=INK, width=4)
for k in range(16):   # spiky burst round the centre
    a = k / 16 * 360 + rnd.uniform(-8, 8); d.polygon(spike(a, N * rnd.uniform(.07, .12), N * .012), fill=(40, 80, 190, 255))
glow = Image.new('RGBA', (N, N), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
for r, a in [(.09, 120), (.05, 200), (.025, 255)]:
    R = r * N; gd.ellipse([C - R, C - R, C + R, C + R], fill=(255, 255, 255, a))
im = Image.alpha_composite(im, glow.filter(ImageFilter.GaussianBlur(10)))
im.save(os.path.join(ROOT, 'water_moon_mark.png')); meta('water_moon_mark', 'Moonwater ตราตอนเปิดสกิล (รูป moon_mark_ref): ดาว 4 แฉกยาว เส้นหมึกน้ำเงินเข้ม เติมฟ้า กลางขาวเรือง + วงโคจร 3 วง + ดวงจันทร์เล็ก', False)

# ---------- crescent ----------
im = Image.new('RGBA', (N, N), (0, 0, 0, 0))
m = Image.new('L', (N, N), 0); md = ImageDraw.Draw(m); R = .4 * N
md.ellipse([C - R, C - R, C + R, C + R], fill=255); md.ellipse([C - R + .28 * N, C - R - .06 * N, C + R + .28 * N, C + R - .06 * N], fill=0)   # bite → crescent
body = Image.new('RGBA', (N, N), (232, 240, 255, 255)); shade = Image.linear_gradient('L').resize((N, N)).rotate(35)
body = Image.composite(Image.new('RGBA', (N, N), (190, 215, 255, 255)), body, shade.point(lambda v: int(v * .7)))
glow = m.filter(ImageFilter.GaussianBlur(22)); halo = Image.new('RGBA', (N, N), (170, 215, 255, 0)); halo.putalpha(glow.point(lambda v: int(v * .7)))
im = Image.alpha_composite(halo, Image.composite(body, Image.new('RGBA', (N, N), (0, 0, 0, 0)), m))
rim = m.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(1.2)); rl = Image.new('RGBA', (N, N), (255, 255, 255, 0)); rl.putalpha(rim.point(lambda v: min(255, v * 3)))
im = Image.alpha_composite(im, rl)
im.save(os.path.join(ROOT, 'water_moon_crescent.png')); meta('water_moon_crescent', 'Moonwater จันทร์เสี้ยวน้ำสีเงินขาว ขอบขาว แสงฟ้าเย็นรอบ ๆ', False)
