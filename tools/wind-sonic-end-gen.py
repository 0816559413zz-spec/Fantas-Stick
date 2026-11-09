#!/usr/bin/env python3
# Sonic Boom Strike finish (user 2026-11-09): hard wind arrives with you at the end of the dash; air finish keeps a ball on the wand tip.
# +z = dash direction. Colours are solid/normal-blend so they read on the bright training floor too.
import json, os
R = os.path.join(os.path.dirname(__file__), '..')
HI, MID = "#7fe8bd", "#2fbf88"
def save(name, desc, dur, layers):
    with open(os.path.join(R, 'assets/fx/wind', name + '.fx.json'), 'w', encoding='utf-8', newline='\n') as o:
        json.dump({"v": 1, "desc": desc, "tags": ["wind", "ult"], "pal": "wind", "dur": dur, "seed": 91, "layers": layers}, o, ensure_ascii=False, indent=1)
END = [
    {"id": "ring", "t": "ring", "at": 0, "life": 0.45, "att": "ground", "pos": [0, 0.15, 0], "col": HI, "r": 11, "op": 0.8},
    {"id": "ring2", "t": "ring", "at": 0.08, "life": 0.5, "att": "ground", "pos": [0, 0.15, 3], "col": MID, "r": 15, "op": 0.6},
    {"id": "blast", "t": "emit", "at": 0, "life": 0.12, "att": "ground", "pos": [0, 1, -3], "burst": 22, "rate": 0, "from": "disc", "fr": 3.2, "dir": "aim", "spread": 0.3, "speed": [24, 52], "plife": [0.4, 0.75], "look": "smoke", "size": [4, 8], "col": HI, "c2": MID, "gravity": 0, "drag": 2.4, "grow": 1.5},
    {"id": "side", "t": "emit", "at": 0, "life": 0.1, "att": "ground", "pos": [0, 0.5, 0], "burst": 18, "rate": 0, "from": "disc", "fr": 1.6, "dir": "out", "spread": 0.5, "speed": [14, 30], "up": [0.5, 3], "plife": [0.4, 0.8], "look": "smoke", "size": [3.5, 6.5], "col": "#a8f2d2", "c2": HI, "gravity": 0, "drag": 3, "grow": 1.4},
    {"id": "fth", "t": "emit", "at": 0, "life": 0.12, "att": "ground", "pos": [0, 1.2, 0], "burst": 30, "rate": 0, "from": "disc", "fr": 2, "dir": "aim", "spread": 0.6, "speed": [18, 44], "up": [0, 4], "plife": [0.6, 1.1], "look": "model", "model": "wind_feather", "mmat": "solid", "msize": [0.24, 0.38], "col": "#17b877", "c2": "#0f9e68", "gravity": -2, "drag": 1.6, "mspin": 220},
]
save("sonic_end", "Sonic Boom จบแดช: ลมตามมาชนแรง", 1.2, END)
ORB = [
    {"id": "core", "t": "mesh", "at": 0, "life": 0.72, "att": "wand", "pos": [0, 0, 0], "fade": 0, "shape": "sphere", "mat": "solid", "col": "#eafff5", "scale": {"0": 0.05, "0.12": 0.32, "0.8": 0.3, "1": 0.02}, "op": 1},
    {"id": "shell", "t": "mesh", "at": 0, "life": 0.72, "att": "wand", "pos": [0, 0, 0], "fade": 0, "shape": "sphere", "mat": "solid", "col": "#2fd08f", "scale": {"0": 0.05, "0.14": 0.5, "0.8": 0.46, "1": 0.02}, "op": 0.55},
]
save("sonic_orb", "Sonic Boom จบกลางอากาศ: ลูกบอลปลายคทา", 0.8, ORB)
