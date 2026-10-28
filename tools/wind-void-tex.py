# Wind Void Spheres: draws the accretion-disk swirl textures (black-hole look, wind colours).
#   python tools/wind-void-tex.py   -> assets/fx/tex/wind_void_disk.png / wind_void_disk_b.png (+ .tex.json)
# Disk a = inner hot swirl (white -> mint -> neon green), disk b = wider outer swirl (teal / cyan / deep green).
# Centre is transparent (the black core sphere sits there); the effect spins the plane.
import json, math, os
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'tex')
PX = 512

def vnoise(rng, n, px, oct_=4):
    """tileable-ish fractal value noise in [0,1]"""
    out = np.zeros((px, px)); amp = 1.0; tot = 0.0
    for o in range(oct_):
        g = n * (2 ** o)
        grid = rng.random((g + 1, g + 1))
        img = Image.fromarray((grid * 255).astype(np.uint8)).resize((px, px), Image.BICUBIC)
        out += np.asarray(img, float) / 255 * amp; tot += amp; amp *= 0.5
    return out / tot

def ramp(stops, v):
    v = np.clip(v, 0, 1); out = np.zeros(v.shape + (3,))
    xs = [s[0] for s in stops]; cs = [np.array([int(s[1][i:i + 2], 16) for i in (1, 3, 5)], float) / 255 for s in stops]
    for c in range(3):
        out[..., c] = np.interp(v, xs, [q[c] for q in cs])
    return out

def disk(seed, arms, twist, r_in, r_out, stops_a, stops_b, sharp, wisp):
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:PX, 0:PX]
    u = (x + 0.5) / PX * 2 - 1; v = (y + 0.5) / PX * 2 - 1
    r = np.hypot(u, v); th = np.arctan2(v, u)
    n1 = vnoise(rng, 4, PX); n2 = vnoise(rng, 8, PX, 3)
    # spiral coordinate: arms curl inward (log spiral) + noise warp for feathery wisps
    phi = th + twist * np.log(np.maximum(r, 0.02)) + (n1 - 0.5) * 2.2 * wisp
    strand = 0.5 + 0.5 * np.cos(phi * arms)
    fine = 0.5 + 0.5 * np.cos(phi * arms * 3 + n2 * 6)
    s = strand ** sharp * (0.65 + 0.35 * fine)
    # radial envelope: hard inner edge (event horizon rim), ragged outer fade
    t = (r - r_in) / (r_out - r_in)
    inner = np.clip((r - r_in) / 0.03, 0, 1)
    outer = np.clip(1 - t + (n2 - 0.5) * 0.35, 0, 1) ** 1.6
    env = inner * outer
    rimglow = np.exp(-((r - r_in - 0.02) / 0.035) ** 2) * inner   # bright ring hugging the hole
    f = s * env * 1.35 + rimglow * 0.55
    # toon look: crisp arm shapes, bright (white-hot) middle of each arm, coloured edges
    a = np.clip((f - 0.16) / 0.12, 0, 1)
    heat = np.clip((f - 0.22) / 0.75, 0, 1) ** 1.15
    mixa = 0.5 + 0.5 * np.sin(th * 2 + n1 * 4)
    edge = ramp(stops_a, 1 - heat) * (1 - mixa[..., None]) + ramp(stops_b, 1 - heat) * mixa[..., None]
    # outer radius pushes toward the darker end of the ramp so the disk cools outward
    cool = np.clip(t, 0, 1)[..., None] * 0.35
    col = np.clip(edge * (1 - cool) + ramp(stops_a, np.ones_like(t)) * cool, 0, 1)
    a[r < r_in] = 0
    rgba = np.dstack([col * 255, a * 255]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')

def save(name, img, desc):
    img.save(os.path.join(ROOT, name + '.png'))
    meta = {"v": 1, "desc": desc, "gen": "image", "seed": 1, "px": 256, "cols": 1, "rows": 1,
            "kind": "loop", "fps": 24, "ramp": "white", "add": False, "p": {}}
    with open(os.path.join(ROOT, name + '.tex.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)

# inner hot disk: white rim -> mint -> neon green / lime
A1 = [(0, '#ffffff'), (0.07, '#c8ffe0'), (0.3, '#8dff65'), (0.65, '#2ec772'), (1, '#196a40')]
A2 = [(0, '#ffffff'), (0.07, '#e8ffc0'), (0.3, '#c6ff5a'), (0.65, '#4fd66a'), (1, '#1d5a30')]
# outer disk: aqua / teal / cyan-green
B1 = [(0, '#d0fff4'), (0.2, '#5cf0c8'), (0.55, '#21b89a'), (1, '#0f4a48')]
B2 = [(0, '#e0ffe0'), (0.2, '#7dffa0'), (0.55, '#2ec772'), (1, '#124a2a')]

save('wind_void_disk', disk(7, 3, 2.4, 0.17, 0.95, A1, A2, 2.2, 1.0),
     'Void Spheres: แผ่นจานหลุมดำวงใน (ขาว-มิ้นต์-เขียวนีออน-เขียวมะนาว) แขนลมบิดเกลียว รูกลางโปร่ง — หมุนด้วย spin ของชั้น')
save('wind_void_disk_b', disk(19, 4, 1.7, 0.12, 0.98, B1, B2, 1.6, 1.4),
     'Void Spheres: แผ่นจานหลุมดำวงนอก (เขียวน้ำทะเล-ฟ้าอมเขียว-เขียวเข้ม) แขนกว้างกว่า หมุนสวนทาง')
print('ok')
