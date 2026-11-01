# Tidecaller summon + Abyssal Beam hit (user 2026-11-01): the serpent flies out of the feet on a wide spiral up to the right shoulder,
# like the ult dragon, trailing a long water body. Beam hit = big splash on the target and a wave pushed outward.
# Patches the existing fx in place, keep this after tools/water-serpent-gen.py.   python tools/water-fam-rise-gen.py
import json, math, os
FX = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'water')
rd = lambda n: json.load(open(os.path.join(FX, n + '.fx.json'), encoding='utf-8'))
def wr(n, d): json.dump(d, open(os.path.join(FX, n + '.fx.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
INTRO = 1.3
d = rd('fam_serpent')
L = d['layers']; by = {l['id']: l for l in L}
end = [-.42, 1.95, .55]
N = 44; turns = 1.75; a_end = math.atan2(end[2], end[0])
def path(ofs=(0, 0, 0)):
    k = {}
    for i in range(N + 1):
        u = .16 + .84 * i / N; e = u * u * (3 - 2 * u); ee = e * .6 + u * .4          # เร่งออกจากเท้า ชะลอเข้าไหล่แบบเดียวกับอัลติ
        r = 1.5 * math.sin(math.pi * min(1, ee * 1.05)) ** .8 * (1 - .25 * ee) + .3 + (math.hypot(end[0], end[2]) - .3) * ee ** 3
        a = a_end - (1 - ee) * turns * 6.283
        y = -.2 + (end[1] + .2) * ee + .35 * math.sin(ee * math.pi)
        k[f'{i / N:.3f}'] = [round(r * math.cos(a) + ofs[0], 3), round(y + ofs[1], 3), round(r * math.sin(a) + ofs[2], 3)]
    return k
print('end', end)
L = [l for l in L if l['id'] not in ('rise_body', 'rise_tr0', 'rise_tr1', 'rise_head_gone')]
by = {l['id']: l for l in L}
head = by.get('rise_head')
if head: L.remove(head)   # ตัวงูจริงวาดใน js/68 (wtFamRise) ทางเดียวกับ path() ที่นี่
by['rise_drops']['pos'] = path(); by['rise_drops']['rate'] = 90
by['rise_eye0']['pos'] = path((-.08, .08, 0)); by['rise_eye1']['pos'] = path((.08, .08, 0))
d['layers'] = L
wr('fam_serpent', d)

TW = dict(t='mesh', att='point', mat='toonwater', col='#9ff4ff', col2='#36b8f5', rim=.5, scroll=3, fade=0)
d = rd('beam_hit')
d['layers'] = [
    dict(id='splash', t='emit', at=0, life=.04, att='point', pos=[0, 0, 0], burst=34, rate=0, **{'from': 'sphere'}, fr=.25, dir='random', speed=[3.5, 8], plife=[.3, .5], look='model', model='water_blob', mmat='ice', msize=[.07, .16], col='#e6ffff', c2='#7fe8ff', mspin=0, gravity=9, drag=0),
    dict(id='flakes0', t='mesh', at=0, life=0.36, att='point', shape='plane', mat='tex', tex='tex/water_splash_flakes', col='#1f6dff', col2='#000000', rim=0, uvTile=[1, 1], uvScroll=[0, 0], bill=True, nodepth=True, fade=0, pos=[0, 0, 0],
         scale={"0": 1.4, "1": 5.6, "ease": "out"}, rot={"0": [0, 0, 0], "1": [0, 0, 40]}, op={"0": 1, "0.6": 1, "1": 0}, int=1),
    dict(id='flakes1', t='mesh', at=0.03, life=0.32, att='point', shape='plane', mat='tex', tex='tex/water_splash_flakes', col='#27c8e8', col2='#000000', rim=0, uvTile=[1, 1], uvScroll=[0, 0], bill=True, nodepth=True, fade=0, pos=[0, 0, 0],
         scale={"0": 1.2, "1": 4.6, "ease": "out"}, rot={"0": [0, 0, 90], "1": [0, 0, 50]}, op={"0": 1, "0.6": 1, "1": 0}, int=1),
    dict(id='flakes2', t='mesh', at=0.06, life=0.28, att='point', shape='plane', mat='tex', tex='tex/water_splash_flakes', col='#ffffff', col2='#000000', rim=0, uvTile=[1, 1], uvScroll=[0, 0], bill=True, nodepth=True, fade=0, pos=[0, 0, 0],
         scale={"0": 1, "1": 3.4, "ease": "out"}, rot={"0": [0, 0, 180], "1": [0, 0, 240]}, op={"0": 1, "0.6": 1, "1": 0}, int=1),
    dict(id='flash', t='mesh', at=0, life=.14, att='point', shape='sphere', mat='glow', col='#bfeaff', pos=[0, 0, 0], scale={"0": .1, "0.4": .5, "1": .05}, op=.7, fade=0),
    dict(TW, id='crown', at=0, life=.32, shape='glb', glb='mesh_water_crown', pos=[0, -.9, 0], scale={"0": .4, "0.4": 1.1, "1": 1.4, "ease": "out"}, op={"0": 1, "0.6": 1, "1": 0}),
    dict(TW, id='wave', at=0, life=.42, shape='glb', glb='mesh_water_ringwave_low', pos=[0, -1.05, 0], scale={"0": [.4, 1.3, .4], "1": [4.2, .5, 4.2], "ease": "out"}, op={"0": 1, "0.6": .9, "1": 0}),
    dict(TW, id='wave2', at=.08, life=.34, shape='glb', glb='mesh_water_ringwave_low', pos=[0, -1.05, 0], scale={"0": [.3, 1, .3], "1": [2.8, .4, 2.8], "ease": "out"}, op={"0": .9, "1": 0}),
]
d['dur'] = .5
d['desc'] = 'Abyssal Beam โดน (รอบ 5): น้ำสาดใหญ่ที่ตัวคนโดน ชิ้นน้ำการ์ตูนบานออก มงกุฎน้ำ และคลื่น 2 วงดันออกรอบตัว'
wr('beam_hit', d)
