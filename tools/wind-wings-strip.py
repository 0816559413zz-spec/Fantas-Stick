# ตัดปีกเหลี่ยมเก่า (โมเดล wind_wing_angular_* / wind_shield_*) ออกจากเอฟเฟกต์สายลมที่ใช้ในเกม
# เพราะปีกตอนนี้เป็นปีกเวทสายลมจากโค้ด (makeWindWings ใน js/68-wind-view.js) ที่ห่อ/สะบัด/กางเองตามท่า
# ลบชั้น mesh ของปีก + ตัวปล่อยอนุภาคที่ปล่อยจากผิวปีกนั้น (from:"mesh", of:<ชั้นปีก>) — ชั้นอื่น (ลม แสง กำแพง ฝุ่น) อยู่ครบ
# รันซ้ำหลังสร้างไฟล์ใหม่จาก generator (wind-shield-study.py / wind-ingame-split.py / wind-featherwing-gen.py / wind-ult-gen.py):
#   python tools/wind-wings-strip.py
import json, os
ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'wind')
FILES = ['shield_guard', 'fw_flick', 'eye_of_heaven']
OLD = ('wind_wing_angular_', 'wind_shield_')

for name in FILES:
    p = os.path.join(ROOT, name + '.fx.json')
    d = json.load(open(p, encoding='utf-8'))
    gone = {L['id'] for L in d['layers'] if L['t'] == 'mesh' and str(L.get('model', '')).startswith(OLD)}
    keep = [L for L in d['layers'] if L['id'] not in gone and not (L['t'] == 'emit' and L.get('from') == 'mesh' and L.get('of') in gone)]
    n = len(d['layers']) - len(keep)
    d['layers'] = keep
    if n and 'ปีกเก่าถูกตัด' not in d.get('desc', ''):
        d['desc'] = d.get('desc', '') + ' • ปีกเก่าถูกตัด (ปีกเวทจากโค้ด)'
    json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{name}: ลบ {n} ชั้น เหลือ {len(keep)}')
