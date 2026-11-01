# Abyssal Beam round 5 (user 2026-11-01, two refs in chat): the moving water body is code (wtBeamMesh, js/68). These fx hold the rest:
# 2 s cast, a few rings/crescents around the beam near the caster only, and the toon splash at the point where the beam stops.
#   python tools/water-beam3-gen.py  -> assets/fx/water/beam_cast, beam_loop, beam_tip .fx.json + assets/fx/tex/water_splash_flakes.png
import json, math, os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx')
FX = os.path.join(ROOT, 'water')
rd = lambda n: json.load(open(os.path.join(FX, n + '.fx.json'), encoding='utf-8'))
def wr(n, d): json.dump(d, open(os.path.join(FX, n + '.fx.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
random.seed(21)

# ---------- ลายน้ำแตกกระจาย: เส้นน้ำโค้งเรียวเป็นชิ้น ๆ รอบจุดกลาง ----------
S = 1024
im = Image.new('L', (S, S), 0); dr = ImageDraw.Draw(im)
def swoosh(a0, r0, r1, bend, w):
    n = 40
    for k in range(n):
        u = k / (n - 1); r = r0 + (r1 - r0) * u; a = a0 + bend * u ** 1.6; q = w * math.sin(u * math.pi) ** .75 * (1 - .45 * u) + 2
        x, y = S / 2 + r * math.cos(a), S / 2 + r * math.sin(a); dr.ellipse([x - q, y - q, x + q, y + q], fill=255)
for i in range(13):
    a = i / 13 * 6.283 + random.uniform(-.2, .2); r0 = random.uniform(110, 190); r1 = r0 + random.uniform(130, 270)
    swoosh(a, r0, r1, random.choice([-1, 1]) * random.uniform(.4, 1.1), random.uniform(16, 36))
    if i % 2: swoosh(a + .4, r1 * .8, r1 + 60, random.uniform(-.8, .8), random.uniform(7, 13))
for i in range(36):
    a = random.uniform(0, 6.283); r = random.uniform(130, 470); q = random.uniform(3, 11)
    x, y = S / 2 + r * math.cos(a), S / 2 + r * math.sin(a); dr.ellipse([x - q, y - q * .6, x + q, y + q * .6], fill=255)
mask = np.asarray(im.filter(ImageFilter.GaussianBlur(2)), float) / 255; mask = np.clip((mask - .35) * 8, 0, 1)
core = np.asarray(im.filter(ImageFilter.MinFilter(13)).filter(ImageFilter.GaussianBlur(3)), float) / 255
glow = np.asarray(im.filter(ImageFilter.GaussianBlur(14)), float) / 255
c0 = np.array([.50, .90, 1.0]); c1 = np.array([.95, 1, 1.0])
col = c0 + (c1 - c0) * core[..., None]
a = np.maximum(mask, glow * .4)
img = (np.clip(np.dstack([col, a]), 0, 1) * 255).astype(np.uint8)
Image.fromarray(img, 'RGBA').resize((512, 512), Image.LANCZOS).save(os.path.join(ROOT, 'tex', 'water_splash_flakes.png'))
json.dump({'v': 1, 'desc': 'น้ำแตกกระจายลายการ์ตูน ปลาย Abyssal Beam', 'gen': 'image', 'seed': 21, 'px': 512, 'cols': 1, 'rows': 1, 'kind': 'loop', 'fps': 24, 'ramp': 'white', 'add': False, 'p': {}},
          open(os.path.join(ROOT, 'tex', 'water_splash_flakes.tex.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

TW = dict(t='mesh', att='feet', mat='toonwater', col='#a9efff', col2='#2f9cf2', rim=.5, scroll=5, fade=0)
GL = dict(t='mesh', att='feet', mat='glow', fade=0)
CIRC = dict(t='mesh', att='feet', shape='plane', mat='tex', tex='tex/water_magic_circle', col='#7fd0ff', col2='#000000', rim=0, uvTile=[1, 1], uvScroll=[0, 0], fade=0)
Y = 1.3
def circles(life, grow, **extra):
    k = {"0": .2, "0.5": 1.08, "1": 1, "ease": "out"} if grow else None
    sc = lambda v: {a: (round(b * v, 2) if a != 'ease' else b) for a, b in k.items()} if grow else v
    return [dict(CIRC, id='circle', at=0, life=life, pos=[0, Y, 1.3], scale=sc(5.2), rot={"0": [0, 0, 0], "1": [0, 0, 110]}, op=1, int=1.5, **extra),
            dict(CIRC, id='circle2', at=.1 if grow else 0, life=life - (.1 if grow else 0), pos=[0, Y, 2.2], scale=sc(3.2), rot={"0": [0, 0, 0], "1": [0, 0, -150]}, op=1, int=1.6, **extra),
            dict(id='disc', t='mesh', at=0, life=life, att='feet', shape='disc', mat='water', col='#2a7ff0', col2='#0f4fd0', rim=1, scroll=1.6, int=1, disp=0, pos=[0, Y, 1.25], rot=[-90, 0, 0],
                 scale=sc(2.2), op=.62, fade=0, **extra)]

# ---------- ร่าย 2 วิ ----------
d = rd('beam_cast')
ly = circles(1.8, True)
for w in range(3):                                         # สายน้ำม้วนเข้าวงทีละชุด
    for i in range(5):
        a0 = i / 5 * 6.283 + w; pts = {}
        for k in range(9):
            u = k / 8; r = 3.2 * (1 - u) + .15; a = a0 + u * 3.6
            pts[f'{u:.3f}'] = [round(r * math.cos(a), 2), round(Y + r * math.sin(a), 2), round(.6 + u * 2.2, 2)]
        ly.append(dict(id=f'in{w}{i}', t='trail', at=round(.1 + w * .42 + i * .03, 2), life=.45, att='feet', pos=pts, col='#dff8ff', col2='#36b8f5', w=.28, tlife=.25, k=1.6))
ly += [dict(GL, id='charge', at=.15, life=1.6, shape='sphere', col='#bfeaff', pos=[0, Y, 2.8], scale={"0": .08, "0.9": .75, "1": .95}, op=.55),
       dict(id='gather', t='emit', at=0, life=1.5, att='feet', pos=[0, Y, 2.4], rate=70, **{'from': 'ring'}, fr=3, dir='in', speed=[4, 7], plife=[.3, .45], look='model', model='water_blob', mmat='ice', msize=[.07, .15], col='#e6ffff', c2='#7fe8ff', mspin=0, gravity=0, drag=.2),
       dict(TW, id='ground', at=0, life=1.5, shape='glb', glb='mesh_water_ringwave_low', pos=[0, -.03, 0], scale={"0": [.5, 1, .5], "1": [3.2, .7, 3.2], "ease": "out"}, op={"0": 1, "0.8": .8, "1": 0})]
d['layers'] = ly; d['dur'] = 1.8
d['desc'] = 'Abyssal Beam ร่าย 1.5 วิ (รอบ 5): วงเวทกางแล้วหมุนสวนกัน + สายน้ำม้วนเข้าวงเป็นชุด + ลูกแสงโตขึ้น + คลื่นที่พื้น'
wr('beam_cast', d)

# ---------- ตอนยิง: พลังรอบลำ เฉพาะใกล้ตัวเรา ----------
ly = circles(1, False, loop=True)
for i in range(3):                                         # วงน้ำวิ่งออกจากตัว แล้วจางก่อนถึง 9 ม.
    ly.append(dict(TW, id=f'ring{i}', at=round(i * .2, 2), life=.6, shape='glb', glb='mesh_water_ringwave_low', pos={"0": [0, Y, 3], "1": [0, Y, 9]}, rot=[90, 0, 0],
                   scale={"0": [1, .9, 1], "0.3": [1.9, 1.1, 1.9], "1": [2.5, .5, 2.5], "ease": "out"}, op={"0": 0, "0.15": .85, "0.7": .6, "1": 0}, loop=True))
for i in range(2):                                         # เสี้ยวน้ำโค้งพันรอบลำ
    ly.append(dict(TW, id=f'arc{i}', at=round(i * .3, 2), life=.6, shape='glb', glb='mesh_water_crescent', pos={"0": [0, Y, 3.5 + i], "1": [0, Y, 6.5 + i]},
                   rot={"0": [0, 90, i * 150], "1": [0, 90, i * 150 + 240]}, scale={"0": 1, "0.4": 2, "1": 1.5}, op={"0": 0, "0.2": 1, "0.75": .8, "1": 0}, loop=True))
ly.append(dict(id='speed', t='emit', at=0, life=1, att='feet', pos=[0, Y, 3], rate=26, **{'from': 'ring'}, fr=1.4, dir='aim', speed=[24, 34], plife=[.2, .32], look='streak', size=[2.5, 4.5], col='#ffffff', c2='#bfeaff', gravity=0, drag=0, loop=True))
d = rd('beam_loop'); d['layers'] = ly
d['desc'] = 'Abyssal Beam ตอนยิง (รอบ 5): วงเวท + วงน้ำกับเสี้ยวน้ำรอบลำเฉพาะใกล้ตัว (ลำน้ำจริงอยู่ wtBeamMesh ใน js/68, น้ำแตกปลายลำอยู่ water/beam_tip)'
wr('beam_loop', d)

# ---------- น้ำแตกกระจายตรงจุดที่ลำหยุด ----------
FL = dict(t='mesh', att='feet', shape='plane', mat='tex', tex='tex/water_splash_flakes', col='#ffffff', col2='#000000', rim=0, uvTile=[1, 1], uvScroll=[0, 0], bill=True, nodepth=True, fade=0, pos=[0, 0, 0], loop=True)
ly = []
TIPC = [('#1f6dff', 3.2, 9.5, 0, 25), ('#27c8e8', 2.6, 8, .13, -40), ('#9ff4ff', 2.2, 6.6, .26, 55), ('#ffffff', 1.6, 4.6, .39, -70)]   # หลังสุดน้ำเงิน → หน้าสุดขาว
for i, (c, s0, s1, at, spin) in enumerate(TIPC):
    ly.append(dict(FL, id=f'fl{i}', col=c, at=at, life=.52, scale={"0": s0, "1": s1, "ease": "out"}, rot={"0": [0, 0, i * 80], "1": [0, 0, i * 80 + spin]}, op={"0": 0, "0.12": 1, "0.6": .95, "1": 0}, int=1))
WT = dict(TW, att='feet')
ly += [dict(GL, id='hot', at=0, life=.2, shape='sphere', col='#c8f6ff', pos=[0, 0, 0], scale={"0": .35, "0.5": .6, "1": .35}, op=.6, loop=True),
       dict(WT, id='crown', at=0, life=.3, shape='glb', glb='mesh_water_crown', pos=[0, -.5, 0], scale={"0": .4, "0.4": 1.2, "1": 1.6, "ease": "out"}, op={"0": 1, "0.6": .9, "1": 0}, loop=True),
       dict(WT, id='wave', at=.1, life=.42, shape='glb', glb='mesh_water_ringwave_low', pos=[0, -.7, 0], scale={"0": [.4, 1.2, .4], "1": [3.4, .5, 3.4], "ease": "out"}, op={"0": 1, "0.6": .8, "1": 0}, loop=True),
       dict(id='drops', t='emit', at=0, life=1, att='feet', pos=[0, 0, 0], rate=75, **{'from': 'sphere'}, fr=.5, dir='random', speed=[6, 13], plife=[.3, .55], look='model', model='water_blob', mmat='ice', msize=[.08, .2], col='#e6ffff', c2='#3fb8ff', mspin=0, gravity=9, drag=.15, loop=True),
       dict(id='lines', t='emit', at=0, life=1, att='feet', pos=[0, 0, 0], rate=40, **{'from': 'sphere'}, fr=.3, dir='out', speed=[10, 16], plife=[.12, .22], look='streak', size=[2.5, 4], col='#ffffff', c2='#6fd8ff', gravity=0, drag=0, loop=True)]
wr('beam_tip', {'v': 1, 'desc': 'Abyssal Beam น้ำแตกกระจายปลายลำ (รอบ 5, รูปผู้ใช้): ชิ้นน้ำการ์ตูนบานออกรอบจุดชน + แสงกลาง + หยดน้ำ', 'tags': ['water', 'ingame'], 'pal': 'ice', 'dur': 1, 'seed': 22, 'layers': ly})
