#!/usr/bin/env python3
# Wind rework (designs/wind.md): Plume Volley = big feathers from both wings, curving in from behind, small splash on hit.
import json, os
R = os.path.join(os.path.dirname(__file__), '..')
def write(name, fx):
    with open(os.path.join(R, 'assets/fx/wind', name + '.fx.json'), 'w', encoding='utf-8') as o:
        json.dump(fx, o, ensure_ascii=False, indent=1)
# neon feather texture: deep teal see-through inside, solid saturated neon rim and barbs, white spine. Alpha-blended, not additive, so it stays green on the bright floor (additive washed out to white).
from PIL import Image, ImageDraw, ImageFilter
W, H = 256, 512
barb = Image.new('L', (W, H), 0); d = ImageDraw.Draw(barb)
for i in range(-6, 46):
    y0 = i * 16
    for sx in (-1, 1):
        d.line([(W / 2, y0 + 80), (W / 2 + sx * W / 2, y0)], fill=255 if i % 2 == 0 else 150, width=5 if i % 2 == 0 else 3)
barb = barb.filter(ImageFilter.GaussianBlur(0.8)); bp = barb.load()
im = Image.new('RGBA', (W, H)); px = im.load()
INNER, NEON, HOT = (0, 215, 85), (0, 255, 115), (120, 255, 190)
def mix(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
for y in range(H):
    k = 1 - y / (H - 1)
    for x in range(W):
        e = abs(x / (W - 1) - 0.5) * 2
        rim = max(0, (e - 0.72) / 0.28); b = bp[x, y] / 255
        c = mix(INNER, NEON, min(1, b + rim * 1.4))
        c = mix(c, HOT, max(0, rim - 0.55) / 0.45 * 0.8)
        px[x, y] = c + (int(215 + 40 * min(1, b + rim * 1.4)),)
sp = ImageDraw.Draw(im); sp.line([(W / 2, 0), (W / 2, H)], fill=(205, 255, 225, 255), width=9)
im.save(os.path.join(R, 'assets/fx/tex/wind_feather_neon.png'), optimize=True)
with open(os.path.join(R, 'assets/fx/tex/wind_feather_neon.tex.json'), 'w', encoding='utf-8') as o:
    json.dump({"v": 1, "desc": "ขนนกนีออน Plume Volley: ขอบกับเส้นขนเขียวเรือง ก้านขาว ข้างในใส", "gen": "image", "seed": 12, "px": 512, "cols": 1, "rows": 1, "kind": "loop", "fps": 1, "ramp": "white", "add": False, "p": {}}, o, ensure_ascii=False, indent=1)
S = 1.4
write('plume_fly', {"v": 1, "desc": "Plume Volley: ขนนกนีออน เรืองแสง มีหางนีออนกับประกายร่วง (คนละแบบกับ BA)", "tags": ["wind", "skill"], "pal": "wind", "dur": 1, "seed": 41, "layers": [
 {"at": 0, "life": 1, "att": "point", "loop": True, "fade": 0, "rot": [0, 0, 62], "id": "vane", "t": "mesh", "shape": "model", "model": "wind_feather", "mat": "tex", "tex": "tex/wind_feather_neon", "col": "#ffffff", "col2": "#00ff66", "rim": 0.5, "int": 1.3, "scale": [S, S, S], "op": 1},
 {"at": 0, "life": 1, "att": "point", "loop": True, "fade": 0, "rot": [0, 0, 62], "id": "glow", "t": "mesh", "shape": "model", "model": "wind_feather", "mat": "glow", "col": "#00ff66", "col2": "#00ff66", "rim": 0, "scale": [S * 1.45, S * 1.45, S * 1.2], "op": 0.5},
 {"at": 0, "life": 1, "att": "point", "loop": True, "id": "wake", "t": "trail", "of": "vane", "col": "#3dff9e", "col2": "#00e070", "w": 0.07, "tlife": 0.08, "k": 1.5},
 {"at": 0, "life": 1, "att": "point", "loop": True, "id": "spark", "t": "emit", "from": "point", "rate": 45, "dir": "out", "gravity": 2, "drag": 2, "speed": [0.4, 1.8], "plife": [0.18, 0.34], "look": "spark", "size": [0.1, 0.2], "col": "#b8ffda", "c2": "#14ff8c"},
]})
write('plume_pop', {"v": 1, "desc": "Plume Volley โดนเป้า: ลมแตกเล็ก วง 2 ม. + ขนนกปลิว", "tags": ["wind", "skill"], "pal": "wind", "dur": 0.55, "seed": 42, "layers": [
 {"id": "sw", "t": "mesh", "at": 0, "life": 0.3, "att": "point", "fade": 0, "shape": "model", "model": "wind_groundswirl", "mat": "tex", "tex": "tex/wind_swoosh_a_hi", "col": "#5dffa8", "col2": "#000000", "rim": 0, "spin": 620, "rot": [20, 0, 15], "scale": {"0": 0.3, "1": 1.5, "ease": "out"}, "op": {"0": 1, "1": 0}},
 {"id": "shock", "t": "warp", "at": 0, "life": 0.2, "att": "point", "kind": "shock", "size": {"0": 0.8, "1": 4.2}, "str": 0.4, "op": {"0": 1, "1": 0}, "col": "#ffffff", "glow": 0},
 {"id": "out", "t": "emit", "at": 0, "life": 0.05, "att": "point", "from": "sphere", "fr": 0.25, "burst": 14, "rate": 0, "dir": "out", "gravity": 0, "drag": 2, "speed": [8, 15], "plife": [0.14, 0.26], "look": "streak", "size": [1, 2], "col": "#c9ffe2", "c2": "#16b872", "curl": True},
 {"id": "bits", "t": "emit", "at": 0, "life": 0.05, "att": "point", "from": "sphere", "fr": 0.3, "burst": 4, "rate": 0, "dir": "out", "gravity": -1.5, "drag": 1.6, "speed": [2, 5], "plife": [0.4, 0.55], "look": "model", "model": "wind_feather", "mmat": "glow", "msize": [0.16, 0.28], "col": "#b9ffd9", "c2": "#39cf8c", "mspin": 4},
]})
write('plume_cast', {"v": 1, "desc": "Plume Volley ง้างปีก: เส้นลมไหลเข้าปีกด้านหลัง + ขนนกปลิวตอนปล่อย", "tags": ["wind", "skill"], "pal": "wind", "dur": 0.5, "seed": 43, "layers": [
 {"id": "suck", "t": "emit", "at": 0, "life": 0.2, "att": "chest", "pos": [0, 0.8, -0.5], "from": "sphere", "fr": 2.2, "rate": 90, "dir": "in", "gravity": 0, "drag": 0, "speed": [8, 12], "plife": [0.12, 0.2], "look": "streak", "size": [0.8, 1.5], "col": "#e6fff4", "c2": "#39cf8c"},
 {"id": "rel", "t": "emit", "at": 0.2, "life": 0.05, "att": "chest", "pos": [0, 0.8, -0.5], "from": "sphere", "fr": 1.0, "burst": 12, "rate": 0, "dir": "out", "gravity": -1.5, "drag": 1.5, "speed": [3, 7], "plife": [0.45, 0.7], "look": "model", "model": "wind_feather", "mmat": "glow", "msize": [0.16, 0.3], "col": "#b9ffd9", "c2": "#39cf8c", "mspin": 4},
]})
print('ok')
