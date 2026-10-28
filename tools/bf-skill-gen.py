# Battlefield step 1 (designs/battlefield.md): smoke / dust / mist left by every skill, per element — style C (user pick 2026-10-27:
# cartoon puff shapes tex/smoke_toon, muted grey-black colours, real dust low on the ground).
# Writes assets/fx/env/bf_<el>.fx.json (hit near the ground), bf_<el>_air (hit in the air), bf_<el>_trail (on flying projectiles),
# bf_<el>_cast (puff at the wand). Played by bfAfter() in js/44-vfx-kit.js — size class comes in as the fx scale s
# (0.6 hit / 1 impact / 1.5 big). Edit this file, not the JSON. Run: python tools/bf-skill-gen.py
import json, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'env')
TOON = {"look": "smoke", "fb": "tex/smoke_toon", "fin": 30, "curl": False}
DUST = {"look": "smoke", "fb": "tex/smoke_puff"}


def em(d, base):
    return dict(d, **base)


def big_only(n):
    # emitters that should only run for impact/big hits (s ≥ ~0.9): count scales with how far s is above 0.8
    return f"max(0,s-0.8)*{n}"


def rocks(col, c2, n, model="rock_chunk", mmat="solid", size=(0.1, 0.26)):
    return {"id": "rocks", "t": "emit", "at": 0, "life": 0.05, "burst": n, "att": "ground", "from": "disc", "fr": 0.5, "dir": "up", "spread": 1.0,
            "speed": [4, 9], "plife": [2.5, 3.5], "look": "model", "model": model, "mmat": mmat, "msize": list(size), "bounce": 0.25,
            "mspin": 480, "col": col, "c2": c2, "gravity": 16, "drag": 0.5, "x": True}


def fx(desc, pal, dur, layers, tags=("env", "battlefield")):
    return {"v": 1, "desc": desc, "tags": list(tags), "pal": pal, "dur": dur, "layers": layers}


# ---------- 🔥 fire: black smoke rising + soot + scorch + embers ----------
def fire():
    return fx("สนามรบ/ไฟ (แบบ C): ควันดำก้อนการ์ตูนพวยขึ้น + ฝุ่นจริงวงล่าง + ถ่านไฟลอย + รอยไหม้/เขม่า • s = ขนาดการโจมตี", "fire", 6, [
        em({"id": "puff", "t": "emit", "at": 0.04, "life": 0.08, "burst": 13, "from": "hemisphere", "fr": 0.9, "dir": "out", "spread": 1.0, "up": [0.6, 1.6],
            "speed": [0.8, 2.6], "plife": [1.4, 2.4], "size": [8, 13], "col": "#6c655e", "c2": "#4a4540", "gravity": -0.45, "drag": 2.2, "grow": 0.55}, TOON),
        em({"id": "dust", "t": "emit", "at": 0.02, "life": 0.05, "burst": 12, "att": "ground", "from": "disc", "fr": 0.7, "dir": "flat", "up": [0.2, 0.6],
            "speed": [4, 9], "plife": [1.4, 2.2], "size": [10, 15], "col": "#9a8c7a", "c2": "#776d60", "gravity": -0.05, "drag": 2.8, "grow": 0.4, "x": True}, DUST),
        em({"id": "linger", "t": "emit", "at": 0.5, "life": 4.5, "rate": {"0": big_only(10), "1": big_only(2)}, "att": "ground", "from": "disc", "fr": 0.8,
            "dir": "up", "spread": 0.5, "speed": [0.4, 1.0], "plife": [2.2, 3.2], "size": [6, 10], "col": "#58524c", "c2": "#3a3632", "gravity": -0.4,
            "drag": 1.4, "grow": 0.4}, TOON),
        {"id": "embers", "t": "emit", "at": 0.1, "life": 2.5, "rate": {"0": 12, "1": 0}, "att": "ground", "from": "disc", "fr": 0.8, "dir": "up", "spread": 0.6,
         "speed": [0.6, 1.8], "plife": [0.9, 1.8], "look": "ember", "size": [1.2, 2], "col": "#ffb868", "c2": "#ff5a1a", "gravity": -0.8, "x": True},
        {"id": "scorch", "t": "decal", "at": 0, "life": 6, "kind": "scorch", "r": 1.6},
        {"id": "soot", "t": "decal", "at": 0, "life": 6, "kind": "dark", "r": 2.4, "op": 0.4},
    ])


def fire_air():
    return fx("สนามรบ/ไฟ กลางอากาศ: ควันดำก้อนเล็ก + ถ่านไฟ (ไม่มีรอยพื้น)", "fire", 2.6, [
        em({"id": "puff", "t": "emit", "at": 0.04, "life": 0.08, "burst": 5, "from": "sphere", "fr": 0.4, "dir": "out", "spread": 1.2,
            "speed": [0.8, 1.8], "plife": [1.3, 2], "size": [10, 15], "col": "#5a534c", "c2": "#3e3935", "gravity": -0.4, "drag": 2.4, "grow": 0.5}, TOON),
        {"id": "embers", "t": "emit", "at": 0.05, "life": 0.1, "burst": 8, "from": "sphere", "fr": 0.4, "dir": "out", "speed": [1, 3], "plife": [0.6, 1.2],
         "look": "ember", "size": [1.2, 2], "col": "#ffb868", "c2": "#ff5a1a", "gravity": 1, "x": True},
    ])


def fire_trail():
    return fx("สนามรบ/ไฟ หางควันตามลูกไฟที่บินอยู่ (วนจนลูกไฟหาย)", "fire", 1.5, [
        em({"id": "smoke", "t": "emit", "at": 0, "life": 0.5, "loop": True, "burst": 0, "rate": 16, "from": "sphere", "fr": 0.12, "dir": "up", "spread": 0.8,
            "speed": [0.3, 0.8], "plife": [0.7, 1.1], "size": [4, 6.5], "col": "#5e5750", "c2": "#3e3935", "gravity": -0.6, "drag": 2, "grow": 0.6, "x": True}, TOON),
    ])


def fire_cast():
    return fx("สนามรบ/ไฟ ควันพวยเล็กที่ปลายไม้ตอนร่าย", "fire", 1.4, [
        em({"id": "puff", "t": "emit", "at": 0.03, "life": 0.06, "burst": 3, "from": "sphere", "fr": 0.1, "dir": "up", "spread": 0.6,
            "speed": [0.4, 1], "plife": [0.8, 1.2], "size": [4, 6], "col": "#6a635c", "c2": "#46413c", "gravity": -0.6, "drag": 2, "grow": 0.5, "x": True}, TOON),
    ])


# ---------- ⚡ storm: branching burn lines + sparks + thin smoke from the marks ----------
def storm():
    return fx("สนามรบ/ฟ้า (แบบ C): รอยไหม้เป็นเส้นแตกแขนง + ประกายไฟกระเด็น + ควันจางลอยจากรอย • s = ขนาดการโจมตี", "storm", 5, [
        {"id": "lines", "t": "decal", "at": 0, "life": 5, "kind": "crack", "r": 2.2, "n": 11, "burn": 0},
        {"id": "char", "t": "decal", "at": 0, "life": 5, "kind": "dark", "r": 1.2, "op": 0.5},
        {"id": "sparks", "t": "emit", "at": 0, "life": 0.06, "burst": 16, "att": "ground", "from": "point", "dir": "up", "spread": 1.2, "speed": [3, 8],
         "plife": [0.3, 0.7], "look": "streak", "size": [1.6, 2.4], "col": "#fff6c0", "c2": "#ff9a1a", "gravity": 12, "drag": 1.5},
        em({"id": "wisp", "t": "emit", "at": 0.15, "life": 2.6, "rate": {"0": 7, "1": 1}, "att": "ground", "from": "disc", "fr": 1.2, "dir": "up", "spread": 0.25,
            "speed": [0.5, 1.0], "plife": [1.2, 1.8], "size": [5, 8], "col": "#8a857e", "c2": "#5e5a55", "gravity": -0.5, "drag": 1.6, "grow": 0.4}, TOON),
        em({"id": "dust", "t": "emit", "at": 0.02, "life": 0.05, "burst": 6, "att": "ground", "from": "disc", "fr": 0.4, "dir": "flat", "up": [0.2, 0.5],
            "speed": [3, 6], "plife": [0.9, 1.4], "size": [8, 12], "col": "#9a8c7a", "c2": "#776d60", "gravity": -0.05, "drag": 3, "grow": 0.4, "x": True}, DUST),
    ])


def storm_air():
    return fx("สนามรบ/ฟ้า กลางอากาศ: ประกายไฟแตก + ควันจางนิดหน่อย", "storm", 1.6, [
        {"id": "sparks", "t": "emit", "at": 0, "life": 0.06, "burst": 12, "from": "point", "dir": "out", "speed": [3, 7], "plife": [0.3, 0.6],
         "look": "streak", "size": [1.5, 2.2], "col": "#fff6c0", "c2": "#ff9a1a", "gravity": 9, "drag": 1.5},
        em({"id": "wisp", "t": "emit", "at": 0.05, "life": 0.06, "burst": 3, "from": "sphere", "fr": 0.3, "dir": "up", "speed": [0.4, 0.9],
            "plife": [0.8, 1.2], "size": [5, 7], "col": "#8a857e", "c2": "#5e5a55", "gravity": -0.5, "drag": 2, "grow": 0.4}, TOON),
    ])


# ---------- ⛰️ earth: big dust ring + gravel + cracked ground ----------
def earth():
    return fx("สนามรบ/ดิน (แบบ C): ฝุ่นก้อนการ์ตูนพุ่งเป็นวง + ฝุ่นจริงฟุ้งต่ำ + เศษกรวด + พื้นแตก • s = ขนาดการโจมตี", "earth", 5, [
        em({"id": "ring", "t": "emit", "at": 0.02, "life": 0.06, "burst": 16, "att": "ground", "from": "disc", "fr": 0.8, "dir": "flat", "up": [0.2, 0.7],
            "speed": [5, 10], "plife": [1.2, 1.9], "size": [11, 16], "col": "#a39582", "c2": "#857866", "gravity": -0.05, "drag": 3, "grow": 0.4}, TOON),
        em({"id": "dust", "t": "emit", "at": 0.02, "life": 0.05, "burst": 12, "att": "ground", "from": "disc", "fr": 0.9, "dir": "flat", "up": [0.2, 0.8],
            "speed": [5, 10], "plife": [1.6, 2.6], "size": [11, 17], "col": "#a8987f", "c2": "#7a7064", "gravity": -0.05, "drag": 2.6, "grow": 0.5, "x": True}, DUST),
        em({"id": "column", "t": "emit", "at": 0.05, "life": 0.08, "burst": big_only(9), "att": "ground", "from": "disc", "fr": 0.6, "dir": "up", "spread": 0.4,
            "speed": [1.4, 2.8], "plife": [1.8, 2.6], "size": [13, 19], "col": "#8f8372", "c2": "#6c6256", "gravity": -0.25, "drag": 2, "grow": 0.45}, TOON),
        rocks("#7a6e60", "#4a4238", 12),
        {"id": "gravel", "t": "emit", "at": 0, "life": 0.05, "burst": 22, "att": "ground", "from": "disc", "fr": 0.5, "dir": "up", "spread": 0.9,
         "speed": [5, 11], "plife": [2.5, 3.5], "look": "model", "model": "rock_chunk", "mmat": "solid", "msize": [0.03, 0.08], "bounce": 0.15,
         "mspin": 700, "col": "#5e5448", "c2": "#3a332b", "gravity": 18, "drag": 0.6, "x": True},
        {"id": "crack", "t": "decal", "at": 0, "life": 5, "kind": "crack", "r": 1.8, "n": 7, "burn": 0},
        {"id": "dirt", "t": "decal", "at": 0, "life": 5, "kind": "dark", "r": 2.0, "op": 0.3},
    ])


def earth_air():
    return fx("สนามรบ/ดิน กลางอากาศ: ฝุ่นก้อนเล็ก + กรวดร่วง", "earth", 2.2, [
        em({"id": "puff", "t": "emit", "at": 0.02, "life": 0.06, "burst": 5, "from": "sphere", "fr": 0.4, "dir": "out", "speed": [1, 2.5],
            "plife": [0.9, 1.4], "size": [9, 13], "col": "#a39582", "c2": "#857866", "gravity": -0.1, "drag": 2.6, "grow": 0.4}, TOON),
        {"id": "gravel", "t": "emit", "at": 0, "life": 0.05, "burst": 10, "from": "sphere", "fr": 0.3, "dir": "out", "speed": [2, 5], "plife": [1.2, 1.8],
         "look": "model", "model": "rock_chunk", "mmat": "solid", "msize": [0.04, 0.09], "bounce": 0.15, "mspin": 700, "col": "#5e5448", "c2": "#3a332b",
         "gravity": 16, "x": True},
    ])


# ---------- ❄️ ice: cold white mist flowing low + frost patch + lingering vapour ----------
def ice():
    return fx("สนามรบ/น้ำแข็ง (แบบ C): ไอเย็นขาวไหลเรี่ยพื้น + คราบน้ำแข็ง + ไอเย็นลอยค้าง + เกล็ดน้ำแข็ง • s = ขนาดการโจมตี", "ice", 5, [
        em({"id": "flow", "t": "emit", "at": 0.02, "life": 0.08, "burst": 16, "att": "ground", "from": "disc", "fr": 0.8, "dir": "flat", "up": [0, 0.3],
            "speed": [2.5, 5.5], "plife": [1.6, 2.4], "size": [10, 15], "col": "#d6e4ee", "c2": "#9fb6c8", "gravity": 0.15, "drag": 2.4, "grow": 0.5}, TOON),
        {"id": "mist", "t": "mist", "at": 0.05, "life": 3.5, "r": 2.2, "n": 8, "out": 1.2, "x": True},
        em({"id": "linger", "t": "emit", "at": 0.4, "life": 3.5, "rate": {"0": big_only(6), "1": big_only(1)}, "att": "ground", "from": "disc", "fr": 1.2,
            "dir": "up", "spread": 0.4, "speed": [0.2, 0.5], "plife": [1.6, 2.4], "size": [7, 11], "col": "#dfeaf2", "c2": "#aabfce", "gravity": -0.1,
            "drag": 1.8, "grow": 0.4}, TOON),
        {"id": "flakes", "t": "emit", "at": 0, "life": 0.08, "burst": 14, "att": "ground", "from": "disc", "fr": 0.6, "dir": "up", "spread": 1.1, "speed": [2, 5],
         "plife": [0.8, 1.4], "look": "flake", "size": [1.4, 2.2], "col": "#ffffff", "c2": "#9fe8ff", "gravity": 4, "drag": 2, "x": True},
        {"id": "frost", "t": "decal", "at": 0, "life": 5, "kind": "icecrack", "r": 1.8, "n": 9, "col": "#bfeaff"},
    ])


def ice_air():
    return fx("สนามรบ/น้ำแข็ง กลางอากาศ: ไอเย็นก้อนเล็กร่วงลง + เกล็ด", "ice", 2, [
        em({"id": "puff", "t": "emit", "at": 0.02, "life": 0.06, "burst": 5, "from": "sphere", "fr": 0.35, "dir": "out", "speed": [0.8, 1.8],
            "plife": [0.9, 1.4], "size": [8, 12], "col": "#e4eef4", "c2": "#b4c6d4", "gravity": 0.6, "drag": 2.4, "grow": 0.4}, TOON),
        {"id": "flakes", "t": "emit", "at": 0, "life": 0.06, "burst": 10, "from": "sphere", "fr": 0.3, "dir": "out", "speed": [1.5, 4], "plife": [0.6, 1.1],
         "look": "flake", "size": [1.3, 2], "col": "#ffffff", "c2": "#9fe8ff", "gravity": 4, "drag": 2, "x": True},
    ])


def ice_trail():
    return fx("สนามรบ/น้ำแข็ง ไอเย็นตามหลังลูกน้ำแข็งที่บินอยู่ (ร่วงลงช้าๆ)", "ice", 1.5, [
        em({"id": "mist", "t": "emit", "at": 0, "life": 0.5, "loop": True, "burst": 0, "rate": 14, "from": "sphere", "fr": 0.12, "dir": "down", "spread": 0.8,
            "speed": [0.2, 0.5], "plife": [0.7, 1.0], "size": [5, 7.5], "col": "#d6e2ea", "c2": "#a2b6c6", "gravity": 0.5, "drag": 2, "grow": 0.6, "x": True}, TOON),
    ])


def ice_cast():
    return fx("สนามรบ/น้ำแข็ง ไอเย็นพวยเล็กที่ปลายไม้ตอนร่าย", "ice", 1.2, [
        em({"id": "puff", "t": "emit", "at": 0.03, "life": 0.06, "burst": 3, "from": "sphere", "fr": 0.1, "dir": "down", "spread": 0.8,
            "speed": [0.3, 0.7], "plife": [0.7, 1.0], "size": [4, 6], "col": "#eef6fa", "c2": "#b4c6d4", "gravity": 0.6, "drag": 2, "grow": 0.5, "x": True}, TOON),
    ])


# ---------- 🏚 house / building collapse (step 2): huge rolling dust cloud + dust column + lingering haze + gravel ----------
def collapse():
    return fx("สนามรบ/ตึกถล่ม (แบบ C ขั้น 2): ฝุ่นก้อนการ์ตูนใหญ่กลิ้งออกเป็นวง + เสาฝุ่นพวยขึ้น + ฝุ่นจริงฟุ้งค้าง + เศษกรวด • s = ขนาดตึก (0.8–2.6)", "earth", 9, [
        em({"id": "roll", "t": "emit", "at": 0.0, "life": 0.25, "burst": 30, "att": "ground", "from": "disc", "fr": 1.6, "dir": "flat", "up": [0.1, 0.5],
            "speed": [6, 13], "plife": [2.2, 3.4], "size": [22, 34], "col": "#a39582", "c2": "#7d7262", "gravity": -0.05, "drag": 1.8, "grow": 0.6}, TOON),
        em({"id": "column", "t": "emit", "at": 0.1, "life": 0.6, "burst": 18, "att": "ground", "from": "disc", "fr": 1.0, "dir": "up", "spread": 0.45,
            "speed": [2.5, 5.5], "plife": [2.6, 3.8], "size": [24, 36], "col": "#968a78", "c2": "#6a6054", "gravity": -0.25, "drag": 1.4, "grow": 0.55}, TOON),
        em({"id": "haze", "t": "emit", "at": 0.3, "life": 6, "rate": {"0": 9, "1": 0}, "att": "ground", "from": "disc", "fr": 1.8, "dir": "up", "spread": 0.8,
            "speed": [0.3, 0.9], "plife": [3.5, 5], "size": [26, 40], "col": "#a89a86", "c2": "#857a6a", "gravity": -0.08, "drag": 1.2, "grow": 0.5, "x": True}, DUST),
        rocks("#7a6e60", "#4a4238", 26, size=(0.12, 0.34)),
        {"id": "gravel", "t": "emit", "at": 0, "life": 0.3, "burst": 40, "att": "ground", "from": "disc", "fr": 1.2, "dir": "up", "spread": 0.9,
         "speed": [4, 10], "plife": [2.5, 3.5], "look": "model", "model": "rock_chunk", "mmat": "solid", "msize": [0.04, 0.1], "bounce": 0.15,
         "mspin": 700, "col": "#6e6254", "c2": "#3a332b", "gravity": 18, "drag": 0.6, "x": True},
    ])


for name, fn in (("bf_fire", fire), ("bf_fire_air", fire_air), ("bf_fire_trail", fire_trail), ("bf_fire_cast", fire_cast),
                 ("bf_storm", storm), ("bf_storm_air", storm_air), ("bf_earth", earth), ("bf_earth_air", earth_air),
                 ("bf_ice", ice), ("bf_ice_air", ice_air), ("bf_ice_trail", ice_trail), ("bf_ice_cast", ice_cast), ("bf_collapse", collapse)):
    with open(os.path.join(OUT, name + ".fx.json"), "w", encoding="utf8") as f:
        json.dump(fn(), f, ensure_ascii=False, indent=1)
    print("wrote", name)
