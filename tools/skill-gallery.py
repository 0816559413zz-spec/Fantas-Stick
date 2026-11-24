"""Build designs/skill_gifs/index.html: every class + skill with its VFX Studio GIF.
Data: designs/skill_gifs/skills.json (from the game) + map.json (skill -> fx). GIFs: tools/export-skill-gifs.sh"""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
d = root / "designs" / "skill_gifs"
skills = json.loads((d / "skills.json").read_text(encoding="utf8"))
fxmap = json.loads((d / "map.json").read_text(encoding="utf8"))
guide = json.loads((d / "guide.json").read_text(encoding="utf8"))

# element look: slug, english, accent, deep tint
EL = {
    "0": ("fire", "Pyro", "#ff6a2b", "#2a120a"),
    "1": ("frost", "Frost", "#7fd6f5", "#0b1d26"),
    "2": ("storm", "Storm", "#ffd23f", "#24200a"),
    "3": ("nature", "Nature", "#6cc24a", "#0f1f0b"),
    "6": ("earth", "Earth", "#c8935a", "#21170e"),
    "7": ("wind", "Wind", "#8ef0c4", "#0c2019"),
    "8": ("water", "Water", "#3fa1ff", "#0a1729"),
    "9": ("light", "Light", "#ffe7a3", "#25210f"),
    "10": ("darkness", "Darkness", "#a77bff", "#150e22"),
}
ROLE = {"builder": "สะสม/เปิดเกม", "control": "ควบคุม", "utility": "ช่วยเหลือ", "finisher": "ปิดเกม",
        "damage": "ดาเมจ", "mobility": "เคลื่อนที่", "support": "ซัพพอร์ต", "summon": "อัญเชิญ", "ult": "อัลติเมต"}
DARK_BASE = {"n": "เคียวเงา", "d": "ฟันเคียวกวาดแนวนอนจากขวาไปซ้าย",
             "shd": "โล่เคียวหมุนเร่งจนกลายเป็นวงริ้วหมึก หันตามจุดเล็ง",
             "dsd": "แตะ Shift = พุ่งสั้นพร้อมเงาซ้อน • กดค้าง = ชาร์จ 0.5 วิ แล้วเข้าร่างลูกเงา 2 วิ"}

classes = []
for pid, (slug, en, acc, deep) in EL.items():
    c = skills[pid]
    m = fxmap.get(pid, {})
    ba = c["ba"] or DARK_BASE
    cards = [
        {"key": "คลิกซ้าย", "kind": "base", "n": ba["n"], "d": ba.get("d") or "", "fx": m.get("ba"), "id": "ba"},
        {"key": "คลิกขวา · โล่", "kind": "base", "n": "โล่", "d": ba.get("shd") or "", "fx": m.get("shield"), "id": "shield"},
        {"key": "Shift · Dash", "kind": "base", "n": "Dash", "d": ba.get("dsd") or "", "fx": m.get("dash"), "id": "dash"},
    ]
    n = 0
    for s in c["sk"]:
        if not s["ult"]:
            n += 1
        cards.append({"key": "อัลติ" if s["ult"] else f"สกิล {n}", "kind": "ult" if s["ult"] else "skill",
                      "n": s["n"], "d": s["d"] or "", "role": ROLE.get(s["role"], s["role"] or ""),
                      "cd": s["cd"], "fx": m.get(s["id"]), "id": s["id"]})
    for k in cards:
        k["gif"] = f"{pid}_{k['id']}.gif" if k["fx"] and (d / f"{pid}_{k['id']}.gif").exists() else None
    classes.append({"guide": guide.get(pid), "pid": pid, "slug": slug, "en": en, "th": c["n"], "acc": acc, "deep": deep, "cards": cards})

data = json.dumps(classes, ensure_ascii=False)
html = (root / "tools" / "skill-gallery.tpl.html").read_text(encoding="utf8").replace("/*DATA*/[]", data)
(d / "index.html").write_text(html, encoding="utf8")
have = sum(1 for c in classes for k in c["cards"] if k["gif"])
total = sum(len(c["cards"]) for c in classes)
print(f"index.html: {have}/{total} cards have a GIF")
