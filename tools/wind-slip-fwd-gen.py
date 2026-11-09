#!/usr/bin/env python3
# Slipstream forward dash (user 2026-11-09): one hard wing beat -> wind wave bursts behind, tail follows the body. Air and ground versions.
# +z = dash direction. att point stays at the start, att chest/feet follows the player.
import json, os
R = os.path.join(os.path.dirname(__file__), '..')
HI, MID = "#9dffc8", "#00d870"
def wave(i, y, z, s0, s1, at=0.03, life=0.3, op=0.8):
    return {"id": i, "t": "mesh", "at": at, "life": life, "att": "point", "pos": [0, y, z], "fade": 0, "shape": "ring", "inner": 0.76, "int": 0.45, "mat": "glow", "col": HI, "col2": MID, "rot": [90, 0, 0], "scale": {"0": s0, "1": s1, "ease": "out"}, "op": {"0": op, "1": 0}}
def tail(i, att, pos, w, life):
    return {"id": i, "t": "trail", "at": 0, "life": life, "att": att, "pos": pos, "col": HI, "col2": MID, "w": w, "tlife": 0.3, "k": 0.8}
def streaks(i, att, y, rate, life):
    return {"id": i, "t": "emit", "at": 0, "life": life, "att": att, "pos": [0, y, -0.5], "yaw": 180, "burst": 0, "rate": rate, "from": "disc", "fr": 0.9, "dir": "aim", "spread": 0.2, "speed": [8, 15], "plife": [0.14, 0.3], "look": "streak", "size": [1.1, 2.2], "col": HI, "c2": MID, "gravity": 0, "drag": 1, "curl": False}
air = [wave("wave", 1.3, -1.3, 1.0, 5.0, op=0.6), wave("wave2", 1.3, -2.2, 0.5, 4.0, at=0.06, life=0.28, op=0.4),
       tail("t_c", "chest", [0, 0.1, -0.2], 0.42, 0.3), tail("t_l", "chest", [-0.75, 0.25, -0.2], 0.2, 0.3), tail("t_r", "chest", [0.75, 0.25, -0.2], 0.2, 0.3),
       streaks("rush", "chest", 0, 120, 0.22),
       {"id": "fth", "t": "emit", "at": 0.03, "life": 0.05, "att": "point", "pos": [0, 1.3, -1], "burst": 10, "rate": 0, "from": "disc", "fr": 1.1, "dir": "out", "gravity": -1.2, "drag": 2, "speed": [3, 7], "plife": [0.45, 0.8], "look": "model", "model": "wind_feather", "mmat": "glow", "msize": [0.14, 0.24], "col": "#b9ffd9", "c2": "#39cf8c", "mspin": 240}]
ground = [wave("wave", 0.9, -1.2, 0.8, 3.6, op=0.55), {"id": "kick", "t": "ring", "at": 0.02, "life": 0.3, "att": "ground", "pos": [0, 0.1, -0.5], "col": HI, "r": 3.6, "op": 0.55},
          tail("t_c", "chest", [0, -0.2, -0.2], 0.34, 0.24), tail("t_l", "feet", [-0.45, 0.15, -0.1], 0.2, 0.24), tail("t_r", "feet", [0.45, 0.15, -0.1], 0.2, 0.24),
          streaks("rush", "feet", 0.5, 90, 0.18),
          {"id": "dust", "t": "emit", "at": 0.02, "life": 0.08, "att": "ground", "pos": [0, 0.15, -0.6], "yaw": 180, "burst": 12, "rate": 0, "from": "disc", "fr": 0.9, "dir": "aim", "spread": 0.7, "speed": [3, 7], "up": [0.3, 1], "plife": [0.35, 0.6], "look": "smoke", "size": [5, 8], "col": "#e5efe9", "c2": "#9fb5a8", "gravity": -0.2, "grow": 1.2, "drag": 3}]
STAY = ("wave", "wave2", "fth", "kick", "dust")   # stays where the dash started (played without follow)
def part(L, stay): return [x for x in L if (x["id"] in STAY) == stay]
for n, L, d in [("slip_fwd", part(air, False), "ตอนบิน หางลมตามตัว"), ("slip_fwd_w", part(air, True), "ตอนบิน คลื่นลมจุดเริ่ม"), ("slip_fwd_g", part(ground, False), "ตอนอยู่พื้น หางลมตามตัว"), ("slip_fwd_gw", part(ground, True), "ตอนอยู่พื้น คลื่นลมจุดเริ่ม")]:
    with open(os.path.join(R, 'assets/fx/wind', n + '.fx.json'), 'w', encoding='utf-8', newline='\n') as o:
        json.dump({"v": 1, "desc": "Slipstream แดชหน้า " + d + ": ปีกสะบัดแล้วคลื่นลมระเบิดด้านหลัง หางลมตามตัว", "tags": ["wind", "dash"], "pal": "wind", "dur": 0.6, "seed": 83, "layers": L}, o, ensure_ascii=False, indent=1)
