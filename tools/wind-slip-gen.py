#!/usr/bin/env python3
# Wind rework (designs/wind.md): Slipstream = spin dodge dash. Helix of wind wraps the body while dashing, streaks and feathers shed behind.
import json, os
R = os.path.join(os.path.dirname(__file__), '..')
with open(os.path.join(R, 'assets/fx/mesh/wind_slip_helix.mesh.json'), 'w', encoding='utf-8') as o:
    json.dump({"v": 1, "desc": "Slipstream: เกลียวลม 2 เส้นพันรอบตัว สูง 2.6 ม.", "mat": "glow", "pal": "wind", "tags": ["wind"], "parts": [
     {"id": "a", "k": "spiral", "turns": 1.9, "r0": 0.72, "r1": 0.95, "rise": 2.6, "w": 0.36, "taper": 0.3, "wall": True, "seg": 72},
     {"id": "b", "k": "spiral", "turns": 1.9, "r0": 0.72, "r1": 0.95, "rise": 2.6, "w": 0.36, "taper": 0.3, "wall": True, "seg": 72, "rot": [0, 180, 0]}]}, o, ensure_ascii=False, indent=1)
def write(name, fx):
    with open(os.path.join(R, 'assets/fx/wind', name + '.fx.json'), 'w', encoding='utf-8') as o:
        json.dump(fx, o, ensure_ascii=False, indent=1)
def hx(i, cc, spin, sc, op, tex="tex/wind_swoosh_a_hi"):
    return {"id": i, "t": "mesh", "at": 0, "life": 0.3, "att": "feet", "pos": [0, 0.15, 0], "fade": 0, "shape": "model", "model": "wind_slip_helix", "mat": "tex", "tex": tex, "col": cc, "col2": "#000000", "rim": 0, "spin": spin, "scale": {"0": sc * 0.7, "0.4": sc, "1": sc * 1.25, "ease": "out"}, "op": {"0": 0, "0.2": op, "0.65": op, "1": 0}}
write('slip_dash', {"v": 1, "desc": "Slipstream: เกลียวลมพันตัว + เส้นลมสะบัด + ขนนกร่วง", "tags": ["wind", "dash"], "pal": "wind", "dur": 0.55, "seed": 51, "layers": [
 hx("h0", "#3dff9e", 980, 1, 1), hx("h1", "#c9ffe2", -760, 1.22, 0.75, "tex/wind_swoosh_b_hi"),
 {"id": "wake", "t": "emit", "at": 0, "life": 0.22, "att": "chest", "from": "sphere", "fr": 0.75, "rate": 180, "dir": "out", "gravity": 0, "drag": 2.5, "speed": [2, 5], "plife": [0.14, 0.3], "look": "streak", "size": [0.9, 1.9], "col": "#c9ffe2", "c2": "#16b872", "curl": True},
 {"id": "bits", "t": "emit", "at": 0.02, "life": 0.05, "att": "chest", "from": "sphere", "fr": 0.8, "burst": 9, "rate": 0, "dir": "out", "gravity": -1.5, "drag": 1.5, "speed": [2, 5], "plife": [0.5, 0.8], "look": "model", "model": "wind_feather", "mmat": "glow", "msize": [0.14, 0.26], "col": "#b9ffd9", "c2": "#39cf8c", "mspin": 4},
]})
write('slip_ready', {"v": 1, "desc": "Slipstream นัดถัดไปพร้อม: ประกายนีออนลอยขึ้นรอบตัว", "tags": ["wind", "buff"], "pal": "wind", "dur": 0.9, "seed": 52, "layers": [
 {"id": "rise", "t": "emit", "at": 0, "life": 0.85, "att": "chest", "from": "ring", "fr": 0.8, "rate": 34, "dir": "up", "gravity": 0, "drag": 0.5, "speed": [1.2, 2.4], "plife": [0.35, 0.6], "look": "spark", "size": [0.12, 0.24], "col": "#b8ffda", "c2": "#14ff8c"},
 {"id": "fth", "t": "emit", "at": 0, "life": 0.85, "att": "chest", "from": "ring", "fr": 0.95, "rate": 5, "dir": "up", "gravity": 0, "drag": 0.5, "speed": [0.7, 1.5], "plife": [0.5, 0.8], "look": "model", "model": "wind_feather", "mmat": "glow", "msize": [0.13, 0.2], "col": "#3dff9e", "c2": "#00e070", "mspin": 2},
]})
write('slip_shot', {"v": 1, "desc": "Slipstream ยิงนัด Enhanced: ลมแตกรอบตัว", "tags": ["wind", "ba"], "pal": "wind", "dur": 0.4, "seed": 53, "layers": [
 {"id": "out", "t": "emit", "at": 0, "life": 0.05, "att": "chest", "from": "sphere", "fr": 0.5, "burst": 22, "rate": 0, "dir": "out", "gravity": 0, "drag": 2.4, "speed": [8, 14], "plife": [0.14, 0.26], "look": "streak", "size": [1, 2], "col": "#c9ffe2", "c2": "#16b872", "curl": True},
 {"id": "sh", "t": "warp", "at": 0, "life": 0.18, "att": "chest", "kind": "shock", "size": {"0": 0.8, "1": 4.5}, "str": 0.4, "op": {"0": 1, "1": 0}, "col": "#ffffff", "glow": 0},
]})
print('ok')
