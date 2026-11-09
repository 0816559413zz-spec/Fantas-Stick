#!/usr/bin/env python3
# Wind rework (designs/wind.md): Tailwind = wind lane, 30 m long (600) x 6 m wide (120), 5 s. +z = aim direction, starts at the caster.
import json, os
R = os.path.join(os.path.dirname(__file__), '..')
LEN, W = 30, 6
def ribbon(i, x, w):
    return {"id": i, "k": "ribbon", "path": [[x, 0, 0], [x, 0, LEN / 2], [x, 0, LEN]], "w": w, "seg": 40}
def mesh(name, desc, mat, parts):
    with open(os.path.join(R, 'assets/fx/mesh', name + '.mesh.json'), 'w', encoding='utf-8', newline='\n') as o:
        json.dump({"v": 1, "desc": desc, "mat": mat, "pal": "wind", "tags": ["wind"], "parts": parts}, o, ensure_ascii=False, indent=1)
mesh('wind_tail_lane', "Tailwind: แผ่นร่องลมแบนบนพื้น ยาว 30 ม. กว้าง 6 ม.", "glow", [ribbon("lane", 0, W)])
mesh('wind_tail_edge', "Tailwind: เส้นขอบร่องลมสองข้าง", "glow", [ribbon("l", -W / 2, 0.22), ribbon("r", W / 2, 0.22)])
L = [
 {"id": "lane", "t": "mesh", "at": 0, "life": 5, "att": "ground", "pos": [0, 0.08, 0], "fade": 0, "shape": "model", "model": "wind_tail_lane", "mat": "solid", "col": "#2fd08f", "scale": 1, "op": {"0": 0, "0.04": 0.3, "0.92": 0.3, "1": 0}},
 {"id": "edge", "t": "mesh", "at": 0, "life": 5, "att": "ground", "pos": [0, 0.1, 0], "fade": 0, "shape": "model", "model": "wind_tail_edge", "mat": "solid", "col": "#0f9e68", "scale": 1, "op": {"0": 0, "0.04": 0.9, "0.92": 0.9, "1": 0}},
 {"id": "open", "t": "emit", "at": 0, "life": 0.25, "att": "ground", "pos": [0, 0.5, 1], "burst": 0, "rate": 60, "from": "disc", "fr": 2.6, "dir": "aim", "spread": 0.12, "speed": [18, 30], "plife": [0.5, 0.9], "look": "streak", "size": [3, 5], "col": "#e8fff2", "c2": "#14ff8c", "gravity": 0, "drag": 0.4, "curl": False},
]
for i in range(6):
    L.append({"id": "st%d" % i, "t": "emit", "at": 0.05, "life": 4.7, "att": "ground", "pos": [0, 0.55, 2.5 + i * 5], "burst": 0, "rate": 7, "from": "disc", "fr": 2.6, "dir": "aim", "spread": 0.08, "speed": [9, 15], "plife": [0.45, 0.8], "look": "streak", "size": [2, 3.4], "col": "#d8ffe8", "c2": "#14ff8c", "gravity": 0, "drag": 0.3, "curl": False, "x": i % 2 == 1})
L.append({"id": "fth", "t": "emit", "at": 0.1, "life": 4.6, "att": "ground", "pos": [0, 0.8, 15], "burst": 0, "rate": 4, "from": "disc", "fr": 6, "dir": "aim", "spread": 0.2, "speed": [6, 10], "plife": [0.8, 1.3], "look": "model", "model": "wind_feather", "mmat": "solid", "msize": [0.2, 0.3], "col": "#17b877", "c2": "#0f9e68", "gravity": 0, "drag": 0.2, "mspin": 120, "x": True})
# The effect waits for the 0.2 s cast wind-up (W_VO.tlD).
for l in L: l["at"] = round(l["at"] + 0.2, 3)
with open(os.path.join(R, 'assets/fx/wind/tailwind.fx.json'), 'w', encoding='utf-8', newline='\n') as o:
    json.dump({"v": 1, "desc": "Tailwind: ร่องลมยาว 30 ม. กว้าง 6 ม. อยู่ 5 วิ ลายลมไหลไปข้างหน้า มีเส้นขอบและเส้นลม", "tags": ["wind", "zone", "buff"], "pal": "wind", "dur": 5.2, "seed": 71, "layers": L}, o, ensure_ascii=False, indent=1)
