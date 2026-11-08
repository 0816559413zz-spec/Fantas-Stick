#!/usr/bin/env python3
# Wind rework (designs/wind.md, user 2026-11-08): feather projectile for the ground basic attack.
# Writes assets/fx/mesh/wind_feather.mesh.json + wind_feather_spine.mesh.json and assets/fx/wind/feather_fly.fx.json
# Feather points along +z (travel direction), tip at z +0.5, flat with a slight V fold along the spine.
# Look = the wing feathers: mint-white glassy vane, white spine, green-white, no ink (memory wind-vfx-no-ink).
import json, os
R = os.path.join(os.path.dirname(__file__), '..')

# half-width of the vane at stations along the feather: (z, left, right). Notches on one side read as a real feather.
ST = [(-0.34, 0.010, 0.010), (-0.28, 0.070, 0.062), (-0.12, 0.112, 0.104), (-0.02, 0.070, 0.116),
      (0.02, 0.118, 0.112), (0.18, 0.112, 0.070), (0.22, 0.098, 0.100), (0.36, 0.066, 0.064), (0.46, 0.022, 0.024)]
TIP = 0.56; FOLD = 0.025

def vane():
    v, uv = [], []
    for z, l, r in ST:
        k = (z + 0.34) / (TIP + 0.34)
        v += [[-l, 0, z], [0, FOLD, z], [r, 0, z]]
        uv += [[0, k], [0.5, k], [1, k]]
    v.append([0, FOLD * 0.5, TIP]); uv.append([0.5, 1])
    f = []
    for i in range(len(ST) - 1):
        a = i * 3; b = a + 3
        f += [[a, b, b + 1, a + 1], [a + 1, b + 1, b + 2, a + 2]]
    t = len(v) - 1; e = (len(ST) - 1) * 3
    f += [[e, t, e + 1], [e + 1, t, e + 2]]
    return v, f, uv

def spine():
    w = 0.009; z0 = -0.56; z1 = 0.5
    v = [[-w, 0.03, z0], [w, 0.03, z0], [w, 0.03, z1], [-w, 0.03, z1]]
    return v, [[0, 3, 2, 1]], [[0, 0], [1, 0], [1, 1], [0, 1]]

def mesh(name, desc, part):
    v, f, uv = part
    d = {"v": 1, "desc": desc, "mat": "glow", "pal": "wind", "tags": ["projectile", "wind"], "parts": [
        {"id": "p", "k": "poly", "v": v, "f": f, "uv": uv, "flat": True}]}
    with open(os.path.join(R, 'assets/fx/mesh', name + '.mesh.json'), 'w', encoding='utf-8') as o:
        json.dump(d, o, ensure_ascii=False, indent=1)

mesh('wind_feather', 'ขนนกลม BA สายลม: ปลายแหลมไป +z มีรอยแหว่งข้างละจุด พับกลางเล็กน้อย', vane())

# feather texture: u across the vane, v along it (top of the image = tip). Dark-rooted mint, white-hot tip, barbs angled toward the tip.
from PIL import Image, ImageDraw, ImageFilter
W, H = 256, 512
def mix(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
im = Image.new('RGBA', (W, H)); px = im.load()
ROOT, MID, TIPC = (9, 122, 92), (84, 232, 168), (232, 255, 243)
for y in range(H):
    k = 1 - y / (H - 1)   # 0 root .. 1 tip
    base = mix(ROOT, MID, min(1, k / 0.55)) if k < 0.55 else mix(MID, TIPC, (k - 0.55) / 0.45)
    for x in range(W):
        e = abs(x / (W - 1) - 0.5) * 2   # 0 spine .. 1 edge
        px[x, y] = mix(base, TIPC, max(0, e - 0.72) / 0.28 * 0.75) + (255,)
barb = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(barb)
for i in range(-6, 46):
    y0 = i * 13
    for sx in (-1, 1):
        lit = i % 3 == 0
        d.line([(W / 2, y0 + 70), (W / 2 + sx * W / 2, y0)], fill=(238, 255, 247, 170) if lit else (6, 96, 74, 120), width=3 if lit else 2)
im.alpha_composite(barb.filter(ImageFilter.GaussianBlur(0.7)))
sp = ImageDraw.Draw(im); sp.line([(W / 2, 0), (W / 2, H)], fill=(245, 255, 250, 255), width=7)
im.save(os.path.join(R, 'assets/fx/tex/wind_feather.png'), optimize=True)
with open(os.path.join(R, 'assets/fx/tex/wind_feather.tex.json'), 'w', encoding='utf-8') as o:
    json.dump({"v": 1, "desc": "ขนนกลม BA สายลม: โคนเขียวเข้ม กลางมิ้นต์ ปลายขาว มีเส้นขนเฉียงและก้านขาว", "gen": "image", "seed": 11, "px": 512, "cols": 1, "rows": 1, "kind": "loop", "fps": 1, "ramp": "white", "add": False, "p": {}}, o, ensure_ascii=False, indent=1)

S = 1.4  # overall size of the feather on screen
def L(**k):
    b = {"at": 0, "life": 1, "att": "point", "loop": True}
    if k.get("t") == "mesh": b.update(fade=0, rot=[0, 0, 40])   # roll: flat vane must still read from behind
    b.update(k); return b
fx = {"v": 1, "desc": "BA สายลม (ผู้ใช้ 2026-11-08): ขนนกยิงจากปีก โค้งเข้าหา crosshair — ภาพร่างรอตรวจ", "tags": ["wind", "ba"],
      "pal": "wind", "dur": 1, "seed": 11, "layers": [
    L(id="vane", t="mesh", shape="model", model="wind_feather", mat="tex", tex="tex/wind_feather", col="#ffffff", col2="#8dffc9", rim=0.3, scale=[S, S, S], op=1),
    L(id="wake", t="trail", of="vane", col="#c9ffe2", col2="#12a067", w=0.09, tlife=0.14, k=1.1),
]}
with open(os.path.join(R, 'assets/fx/wind/feather_fly.fx.json'), 'w', encoding='utf-8') as o:
    json.dump(fx, o, ensure_ascii=False, indent=1)
print('ok')
