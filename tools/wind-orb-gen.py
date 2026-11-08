#!/usr/bin/env python3
# Wind rework (designs/wind.md, user 2026-11-08): flying basic attack = big slow wind ball, explodes on the ground or on a player (splash 100 = 5 m).
# Look = approved clear-air wind (tex/wind_air_rise), green-white, no ink, no white-out.
import json, os
R = os.path.join(os.path.dirname(__file__), '..')
def W(n, d):
    with open(os.path.join(R, 'assets/fx/wind', n + '.fx.json'), 'w', encoding='utf-8') as o: json.dump(d, o, ensure_ascii=False, indent=1)
def M(**k):
    b = {"t": "mesh", "at": 0, "life": 1, "loop": True, "att": "point", "fade": 0}; b.update(k); return b
W('gale_orb_fly', {"v": 1, "desc": "ลูกลมใหญ่ยิงช้า (BA ตอนบิน): เปลือกลมใสหมุน 2 ชั้น + แกนมิ้นต์ + วงลมหมุนไขว้", "tags": ["wind", "ba"], "pal": "wind", "dur": 1, "seed": 3, "layers": [
 M(id="base", shape="sphere", mat="energy", col="#129a60", col2="#0a6b43", scroll=2.2, rim=0.9, scale=0.64, op=0.9),
 M(id="core", shape="sphere", mat="glow", col="#7dffb4", scale=0.12, op=0.8),
 M(id="in0", shape="sphere", mat="tex", tex="tex/wind_air_rise", col="#0b8f58", col2="#000000", rim=0, uvTile=[2, 4], uvScroll=[-3.0, 1.4], scale=0.34, op=1),
 M(id="in1", shape="sphere", mat="tex", tex="tex/wind_air_rise", col="#14b56e", col2="#000000", rim=0, uvTile=[2, 3], uvScroll=[2.4, -2.0], scale=0.48, op=1),
 M(id="in2", shape="sphere", mat="tex", tex="tex/wind_air_rise", col="#1fcf7d", col2="#000000", rim=0, uvTile=[2, 3], uvScroll=[-1.8, 2.4], scale=0.6, op=1),
 M(id="shell", shape="sphere", mat="tex", tex="tex/wind_air_rise", col="#2bdc88", col2="#000000", rim=0, uvTile=[2, 2], uvScroll=[1.4, -1.8], scale=0.72, op=1),
 M(id="ring0", shape="model", model="wind_groundswirl", mat="tex", tex="tex/wind_swoosh_a_hi", col="#5dffa8", col2="#000000", rim=0, rot=[62, 0, 20], spin=640, scale=0.56, op=1),
 M(id="ring1", shape="model", model="wind_groundswirl", mat="tex", tex="tex/wind_swoosh_b_hi", col="#b9ffd9", col2="#000000", rim=0, rot=[-48, 0, -40], spin=-520, scale=0.62, op=0.95),
 M(id="ring2", shape="model", model="wind_groundswirl", mat="tex", tex="tex/wind_swoosh_a_hi", col="#2bdc88", col2="#000000", rim=0, rot=[12, 0, 75], spin=430, scale=0.6, op=0.9),
 {"id": "wake", "t": "trail", "at": 0, "life": 1, "loop": True, "att": "point", "col": "#7dffb4", "col2": "#12a067", "w": 0.36, "tlife": 0.15, "k": 1.0},
 {"id": "wake2", "t": "trail", "at": 0, "life": 1, "loop": True, "att": "point", "col": "#2bdc88", "col2": "#0a6b43", "w": 0.6, "tlife": 0.1, "k": 1.0},
 {"id": "tail", "t": "emit", "at": 0, "life": 1, "loop": True, "att": "point", "from": "sphere", "fr": 0.45, "dir": "aim", "yaw": 180, "spread": 0.3, "gravity": 0, "drag": 0.8, "rate": 70, "speed": [6, 12], "plife": [0.18, 0.36], "look": "streak", "size": [1.4, 2.8], "col": "#b9ffd9", "c2": "#14b56e", "curl": True},
 {"id": "bits", "t": "emit", "at": 0, "life": 1, "loop": True, "att": "point", "from": "sphere", "fr": 0.95, "dir": "in", "gravity": 0, "drag": 0.5, "rate": 60, "speed": [2, 4], "plife": [0.18, 0.32], "look": "streak", "size": [1.0, 2.0], "col": "#8dffc0", "c2": "#14b56e", "curl": True},
]})
G = {"0": 0.06, "0.75": 0.62, "1": 0.72, "ease": "out"}
def C(**k):
    b = {"t": "mesh", "at": 0, "life": 0.36, "att": "wand", "fade": 0, "op": {"0": 0.6, "0.2": 1, "0.9": 1, "1": 0}}; b.update(k); return b
W('gale_orb_charge', {"v": 1, "desc": "ลูกลมก่อตัวที่ปลายไม้ตอนง้างไปข้าง (0.35 วิ)", "tags": ["wind", "ba"], "pal": "wind", "dur": 0.4, "seed": 4, "layers": [
 C(id="base", shape="sphere", mat="energy", col="#129a60", col2="#0a6b43", scroll=2.2, rim=0.9, scale={"0": 0.04, "0.75": 0.42, "1": 0.5, "ease": "out"}),
 C(id="shell", shape="sphere", mat="tex", tex="tex/wind_air_rise", col="#2bdc88", col2="#000000", rim=0, uvTile=[2, 2], uvScroll=[1.4, -1.8], scale=G),
 C(id="ring", shape="model", model="wind_groundswirl", mat="tex", tex="tex/wind_swoosh_a_hi", col="#5dffa8", col2="#000000", rim=0, rot=[62, 0, 20], spin=640, scale={"0": 0.1, "0.75": 0.5, "1": 0.56, "ease": "out"}),
 {"id": "gather", "t": "emit", "at": 0, "life": 0.32, "att": "wand", "from": "sphere", "fr": 1.3, "dir": "in", "gravity": 0, "drag": 0.2, "rate": 90, "speed": [5, 9], "plife": [0.14, 0.24], "look": "streak", "size": [1.0, 2.0], "col": "#b9ffd9", "c2": "#14b56e", "curl": True},
]})
W('gale_orb_launch', {"v": 1, "desc": "ตอนเหวี่ยงปล่อยลูกลม: วงลมหน้าไม้ + เส้นลมพุ่งตาม + แรงอากาศกระเพื่อม", "tags": ["wind", "ba"], "pal": "wind", "dur": 0.45, "seed": 6, "layers": [
 {"id": "ring", "t": "mesh", "at": 0, "life": 0.3, "att": "point", "fade": 0, "shape": "model", "model": "wind_groundswirl", "mat": "tex", "tex": "tex/wind_swoosh_a_hi", "col": "#5dffa8", "col2": "#000000", "rim": 0, "rot": [90, 0, 0], "spin": 500, "scale": {"0": 0.35, "1": 1.5, "ease": "out"}, "op": {"0": 1, "1": 0}},
 {"id": "shock", "t": "warp", "at": 0, "life": 0.22, "att": "point", "kind": "shock", "size": {"0": 0.6, "1": 4.5}, "str": 0.6, "op": {"0": 1, "1": 0}, "col": "#ffffff", "glow": 0},
 {"id": "fwd", "t": "emit", "at": 0, "life": 0.05, "att": "point", "from": "sphere", "fr": 0.3, "burst": 16, "rate": 0, "dir": "aim", "spread": 0.45, "gravity": 0, "drag": 1.6, "speed": [10, 20], "plife": [0.14, 0.3], "look": "streak", "size": [1.4, 2.8], "col": "#c9ffe2", "c2": "#14b56e", "curl": True},
 {"id": "back", "t": "emit", "at": 0, "life": 0.05, "att": "point", "from": "sphere", "fr": 0.3, "burst": 10, "rate": 0, "dir": "aim", "yaw": 180, "spread": 0.7, "gravity": 0, "drag": 2, "speed": [4, 9], "plife": [0.18, 0.34], "look": "streak", "size": [1.0, 2.0], "col": "#8dffc0", "c2": "#14b56e", "curl": True},
]})
def S(**k):
    b = {"t": "mesh", "at": 0, "life": 0.6, "fade": 0}; b.update(k); return b
W('gale_orb_boom', {"v": 1, "desc": "ลูกลมระเบิด วง 5 ม.: ลมแผ่บนพื้น + โดมลมใสพองแล้วจาง + เศษลมพุ่งออก", "tags": ["wind", "ba"], "pal": "wind", "dur": 0.75, "seed": 8, "layers": [
 S(id="dome", att="point", shape="sphere", mat="tex", tex="tex/wind_air_rise", col="#1fcf7d", col2="#000000", rim=0, uvTile=[3, 2], uvScroll=[0.6, -1.4], scale={"0": 0.7, "0.5": 4.2, "1": 5.0, "ease": "out"}, op={"0": 1, "0.5": 0.7, "1": 0}),
 S(id="dome2", att="point", shape="sphere", mat="energy", col="#129a60", col2="#0a6b43", scroll=2.5, rim=1, scale={"0": 0.6, "0.4": 3.6, "1": 4.6, "ease": "out"}, op={"0": 0.75, "0.45": 0.3, "1": 0}),
 S(id="sw0", att="ground", pos=[0, 0.08, 0], shape="model", model="wind_groundswirl", mat="tex", tex="tex/wind_swoosh_a_hi", col="#5dffa8", col2="#000000", rim=0, spin=260, scale={"0": 0.7, "1": 3.7, "ease": "out"}, op={"0": 0.95, "0.6": 0.6, "1": 0}),
 S(id="sw1", at=0.05, att="ground", pos=[0, 0.12, 0], shape="model", model="wind_groundswirl", mat="tex", tex="tex/wind_swoosh_b_hi", col="#9dffc9", col2="#000000", rim=0, spin=-200, rot=[0, 60, 0], scale={"0": 0.5, "1": 3.0, "ease": "out"}, op={"0": 0.9, "1": 0}),
 {"id": "shock", "t": "warp", "at": 0, "life": 0.35, "att": "point", "kind": "shock", "size": {"0": 1.5, "1": 10.5}, "str": 0.7, "op": {"0": 1, "1": 0}, "col": "#ffffff", "glow": 0},
 {"id": "out", "t": "emit", "at": 0, "life": 0.06, "att": "point", "from": "sphere", "fr": 0.8, "burst": 46, "rate": 0, "dir": "out", "gravity": 0, "drag": 1.4, "speed": [10, 20], "plife": [0.25, 0.5], "look": "streak", "size": [1.6, 3.2], "col": "#c9ffe2", "c2": "#12a067", "curl": True},
 {"id": "plume", "t": "emit", "at": 0, "life": 0.06, "att": "point", "from": "sphere", "fr": 1.0, "burst": 12, "rate": 0, "dir": "out", "gravity": 1, "drag": 1.5, "speed": [4, 9], "plife": [0.6, 1.0], "look": "model", "model": "wind_feather", "mmat": "glow", "msize": [0.2, 0.36], "col": "#b9ffd9", "c2": "#39cf8c", "mspin": 4},
 {"id": "dust", "t": "emit", "at": 0, "life": 0.06, "att": "ground", "from": "ring", "fr": 2.0, "burst": 16, "rate": 0, "dir": "out", "gravity": 0, "drag": 1.6, "speed": [3, 7], "up": [0.5, 2], "plife": [0.5, 0.9], "size": [3, 5], "grow": 0.6, "look": "smoke", "curl": True, "col": "#e4e0cf", "c2": "#a39d88"},
]})
print('ok')
