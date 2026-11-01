# Aqua Cage + Abyssal Beam round 4 (user 2026-11-01): cage = see-through toon bubble so the caged player shows inside;
# beam = thick painted water with helix ribbons, foam rings and spray, big magic circles at the caster.
#   python tools/water-cage-beam2-gen.py  -> assets/fx/water/cage_bubble / beam_cast / beam_loop .fx.json
import json, math, os, random
FX = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'water')
rd = lambda n: json.load(open(os.path.join(FX, n + '.fx.json'), encoding='utf-8'))
def wr(n, d): json.dump(d, open(os.path.join(FX, n + '.fx.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
random.seed(14)
HI, MAIN, DEEP = '#ffffff', '#6fd8ff', '#1f6dff'
TW = dict(t='mesh', att='feet', mat='toonwater', col='#7fdcff', col2='#1466c8', rim=.5, scroll=4, fade=0)
GL = dict(t='mesh', att='feet', mat='glow', fade=0)
Y = 1.3

# ---------- Aqua Cage ----------
d = rd('cage_bubble')
L = [l for l in d['layers'] if l['id'] not in ('backing', 'orb', 'halo', 'toon') and not l['id'].startswith('streak')]
pos = {"0": [0, 1.05, 0], "0.15": [0, 1.15, 0], "0.4": [0, 1.21, 0], "0.65": [0, 1.13, 0], "0.9": [0, 1.21, 0], "1": [0, 1.17, 0]}
L.append(dict(id='toon', t='mesh', at=.08, life=2.32, att='feet', shape='plane', mat='tex', tex='tex/water_cage_toon', col='#ffffff', col2='#000000', rim=0, uvTile=[1, 1], uvScroll=[0, 0], bill=True, nodepth=True,
              int=1.05, fade=0, pos=pos, op={"0": 1, "0.94": 1, "1": 0},
              scale={"0": .3, "0.08": 3.9, "0.2": 3.5, "0.34": [3.7, 3.4, 3.7], "0.5": [3.45, 3.7, 3.45], "0.66": [3.68, 3.42, 3.68], "0.82": [3.48, 3.66, 3.48], "0.94": 3.6, "1": 4.3}))
d['layers'] = L
d['desc'] = 'Aqua Cage ฟองขัง (รอบ 4): ฟองน้ำลายการ์ตูนใส ขอบขาวหนา เห็นคนข้างใน ส่ายนิ่ม ๆ มีฟองเล็กลอย น้ำหยด แตกกระจายตอนจบ • js/68 ทำขอบสว่างให้คนที่ถูกขัง'
wr('cage_bubble', d)

# ---------- วงเวท ----------
CIRC = dict(t='mesh', att='feet', shape='plane', mat='tex', tex='tex/water_magic_circle', col='#7fd0ff', col2='#000000', rim=0, uvTile=[1, 1], uvScroll=[0, 0], fade=0)
def circles(loop):
    extra = dict(loop=True) if loop else {}
    big = {"0": .2, "0.55": 5.6, "1": 5.2, "ease": "out"} if not loop else 5.2
    mid = {"0": .1, "0.7": 3.4, "1": 3.2, "ease": "out"} if not loop else 3.2
    small = {"0": .1, "0.85": 1.9, "1": 1.8, "ease": "out"} if not loop else 1.8
    life = .6 if not loop else 1
    return [dict(CIRC, id='circle', at=0, life=life, pos=[0, Y, 1.3], scale=big, rot={"0": [0, 0, 0], "1": [0, 0, 90]}, op=1, int=1.5, **extra),
            dict(CIRC, id='circle2', at=0, life=life, pos=[0, Y, 2.2], scale=mid, rot={"0": [0, 0, 0], "1": [0, 0, -130]}, op=1, int=1.6, **extra),
            dict(CIRC, id='circle3', at=0, life=life, pos=[0, Y, 3.1], scale=small, rot={"0": [0, 0, 0], "1": [0, 0, 180]}, op=1, int=1.7, **extra),
            dict(id='disc', t='mesh', at=0, life=life, att='feet', shape='disc', mat='water', col='#2a7ff0', col2='#0f4fd0', rim=1, scroll=1.6, int=1, disp=0, pos=[0, Y, 1.25], rot=[-90, 0, 0],
                 scale={"0": .1, "0.55": 2.3, "1": 2.2, "ease": "out"} if not loop else 2.2, op=.62, fade=0, **extra)]

# ---------- ร่าย ----------
d = rd('beam_cast')
inflow = []
for i in range(6):                                        # สายน้ำม้วนเข้าวง
    a0 = i / 6 * 6.283; pts = {}
    for k in range(9):
        u = k / 8; r = 3.4 * (1 - u) + .15; a = a0 + u * 3.6
        pts[f'{u:.3f}'] = [round(r * math.cos(a), 2), round(Y + r * math.sin(a), 2), round(.6 + u * 2.4, 2)]
    inflow.append(dict(id=f'in{i}', t='trail', at=round(.02 * i, 2), life=.42, att='feet', pos=pts, col='#dff8ff', col2='#36b8f5', w=.3, tlife=.25, k=1.6))
d['layers'] = circles(False) + inflow + [
    dict(GL, id='charge', at=.1, life=.45, shape='sphere', col='#bfeaff', pos=[0, Y, 3.1], scale={"0": .1, "0.8": .7, "1": .3}, op=.5),
    dict(id='gather', t='emit', at=0, life=.5, att='feet', pos=[0, Y, 2.4], rate=120, **{'from': 'ring'}, fr=3.2, dir='in', speed=[5, 8], plife=[.25, .4], look='model', model='water_blob', mmat='ice', msize=[.07, .15], col='#e6ffff', c2='#7fe8ff', mspin=0, gravity=0, drag=.2),
    dict(TW, id='ground', at=0, life=.6, shape='glb', glb='mesh_water_ringwave_low', pos=[0, -.03, 0], scale={"0": [.5, 1, .5], "1": [4.5, .7, 4.5], "ease": "out"}, op={"0": 1, "1": 0}),
]
d['desc'] = 'Abyssal Beam ร่าย (รอบ 4): วงเวท 3 ชั้นใหญ่หน้าตัว หมุนสวนกัน + สายน้ำม้วนเข้าวง + ลูกแสงรวมพลัง + คลื่นที่พื้น'
wr('beam_cast', d)

# ---------- ลำน้ำ ----------
LEN = 35
BM = [0, Y, 2.8]
def helix(ph, r0, r1, turns):
    return [[round((r0 + (r1 - r0) * k / 60) * math.cos(ph + k / 60 * turns * 6.283), 3), round((r0 + (r1 - r0) * k / 60) * math.sin(ph + k / 60 * turns * 6.283), 3), round(k / 60 * LEN, 2)] for k in range(61)]
def wob(s0, s1, ph):
    return {f'{k/6:.3f}': [round(s0 * (1 + .1 * math.sin(k / 6 * 6.283 * 2 + ph)), 3), LEN, round(s0 * (1 + .1 * math.sin(k / 6 * 6.283 * 2 + ph)), 3)] for k in range(7)}
ly = circles(True) + [
    dict(TW, id='body', at=0, life=.4, shape='cone', pos=BM, rot=[-90, 0, 0], scale=wob(.62, .3, 0), op=1, scroll=6, loop=True),
    dict(GL, id='blue', at=0, life=.5, shape='cone', col=DEEP, pos=BM, rot=[-90, 0, 0], scale=wob(.85, .4, 1), op=.1, loop=True),
    dict(GL, id='mid', at=0, life=.37, shape='cone', col=MAIN, pos=BM, rot=[-90, 0, 0], scale=wob(.34, .2, 2), op=.14, loop=True),
    dict(GL, id='core', at=0, life=.21, shape='cone', col=HI, pos=BM, rot=[-90, 0, 0], scale=wob(.13, .1, 3), op=.5, loop=True),
    dict(TW, id='muzzle', at=0, life=.3, shape='glb', glb='mesh_water_crown', pos=[0, Y, 3.1], rot=[90, 0, 0], scale={"0": [1, .5, 1], "0.5": [2.1, 1.6, 2.1], "1": [2.6, .8, 2.6]}, op={"0": 1, "0.6": .9, "1": 0}, loop=True),
    dict(id='tip', t='emit', at=0, life=1, att='feet', pos=[0, Y, 36], rate=90, **{'from': 'sphere'}, fr=.6, dir='random', speed=[5, 11], plife=[.25, .45], look='model', model='water_blob', mmat='ice', msize=[.1, .22], col='#e6ffff', c2='#7fe8ff', mspin=0, gravity=6, drag=.2, loop=True),
    dict(TW, id='tipcrown', at=0, life=.32, shape='glb', glb='mesh_water_crown', pos=[0, Y, 36], rot=[-90, 0, 0], scale={"0": .5, "0.5": 1.6, "1": 2}, op={"0": 1, "1": 0}, loop=True),
    dict(id='spray', t='emit', at=0, life=1, att='feet', pos=[0, Y, 12], rate=150, **{'from': 'sphere'}, fr=9, dir='random', speed=[1.5, 5], plife=[.2, .4], look='model', model='water_blob', mmat='ice', msize=[.05, .13], col='#e6ffff', c2='#7fe8ff', mspin=0, gravity=7, drag=.2, loop=True),
    dict(id='speed', t='emit', at=0, life=1, att='feet', pos=[0, Y, 3], rate=70, **{'from': 'ring'}, fr=1, dir='aim', speed=[36, 48], plife=[.3, .5], look='streak', size=[2.5, 4.5], col='#ffffff', c2='#bfeaff', gravity=0, drag=0, loop=True),
]
for i, ph in enumerate((0, 2.09, 4.19)):                  # สายน้ำพันเกลียวรอบลำ
    ly.append(dict(TW, id=f'hx{i}', at=0, life=.42, shape='ribbon', path=helix(ph, .62, .2, 7), wk=.34, pos=BM, rot={"0": [0, 0, 0], "1": [0, 0, -360]}, op=1, scroll=6, loop=True))
for i in range(5):                                        # วงโฟมวิ่งตามลำ
    ly.append(dict(TW, id=f'ring{i}', at=round(i * .11, 2), life=.55, shape='glb', glb='mesh_water_ringwave_low', pos={"0": [0, Y, 3], "1": [0, Y, 30]}, rot=[90, 0, 0],
                   scale={"0": [1.1, 1.1, 1.1], "0.3": [1.5, 1, 1.5], "1": [.7, .6, .7]}, op={"0": 0, "0.1": .6, "0.85": .45, "1": 0}, loop=True))
d = rd('beam_loop'); d['layers'] = ly
d['desc'] = 'Abyssal Beam ยิง (รอบ 4): ลำน้ำหนา ผิวน้ำไหล + แกนขาว/ฟ้า/น้ำเงินส่าย + สายน้ำ 3 เส้นพันเกลียว + วงโฟมวิ่งตามลำ + น้ำสาดตลอดลำ + มงกุฎน้ำที่ปากและปลาย + วงเวท 3 ชั้น'
wr('beam_loop', d)
