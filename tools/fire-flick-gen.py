# Fire shield flick (user 2026-11-11): hold shield + click = half spin, a thick fire ribbon spirals out round the caster to the hit radius.
#   python tools/fire-flick-gen.py  -> assets/fx/fire/flick.fx.json   (played by efx 'pflick' in js/25-efx.js)
import json, math, os
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'fire', 'flick.fx.json')
R = 9             # PYV.flR 180 px = 9 m
LIFE = .5         # PYV.flGrow
def spiral(a0, h0, h1, turns=.85, n=14):
    k = {}
    for i in range(n + 1):
        u = i / n; e = 1 - (1 - u) ** 1.6; r = .7 + (R - .7) * e; a = a0 + turns * 6.283 * e
        k[f'{u:.3f}'] = [round(r * math.cos(a), 2), round(h0 + (h1 - h0) * u, 2), round(r * math.sin(a), 2)]
    return k
L = []
for i in range(3):
    a0 = i / 3 * 6.283; P = spiral(a0, 1.2, .5)
    L.append(dict(id=f'arm{i}', t='trail', at=i * .03, life=LIFE, att='feet', pos=P, col='#ff9a2e', col2='#d92a08', w=1.2, tlife=.34, k=1.25))
    L.append(dict(id=f'arm{i}c', t='trail', at=i * .03, life=LIFE, att='feet', pos=P, col='#ffe3a0', col2='#ff7a1a', w=.38, tlife=.24, k=1.5))
    L.append(dict(id=f'fire{i}', t='emit', at=i * .03, life=LIFE, att='feet', pos=P, rate=360, **{'from': 'sphere'}, fr=.3, dir='up', spread=.6, speed=[.4, 1.2], plife=[.2, .34], look='fire', size=[7, 12], grow=1.2, col='#ffcf6a', c2='#ff3a10', gravity=-2, drag=1.5))
L += [dict(id='embers', t='emit', at=.05, life=.4, att='feet', pos=[0, .8, 0], rate=120, **{'from': 'ring'}, fr=1.5, dir='out', speed=[10, 20], plife=[.3, .6], look='ember', size=[2.5, 4], col='#ffd27a', c2='#ff5a1a', gravity=3, drag=1.2),
      dict(id='flash', t='flash', at=0, life=.18, att='feet', pos=[0, 1.1, 0], col='#ffb347', size=2.5),
      dict(id='heat', t='light', at=0, life=.45, att='feet', pos=[0, 1, 0], col='#ff8a2a', int=2.2, dist=12)]
json.dump({'v': 1, 'desc': 'โล่ไฟ สะบัด: หมุนตัวครึ่งรอบ ริบบิ้นไฟหนา 3 สายหมุนเกลียวออกถึงรัศมี 9 ม. ใน 0.5 วิ + ไฟลุกตามสาย + ประกาย', 'tags': ['fire', 'ingame'], 'pal': 'fire', 'dur': .6, 'seed': 41, 'layers': L},
          open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
