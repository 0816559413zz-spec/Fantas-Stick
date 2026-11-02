# สาย Nature (ธรรมชาติ) — ผู้ใช้ออกแบบเอง (เริ่ม 2026-11-02)

> ของเก่า (พิษ/สปอร์/เถาวัลย์/หนามระเบิด ใน commit dac9239, `off:1` ใน PATHS js/03) เป็นของชั่วคราวที่ Claude ทำไว้ — **ไม่ใช้แล้ว** ออกแบบใหม่ทั้งหมดตามคำผู้ใช้ด้านล่าง

## ภาพรวม
- คำผู้ใช้: "is like summoning plant to help u like turrent and with skill that can be use depand on situation"
- = เรียกพืชมาช่วยสู้แบบป้อมปืน (turret) + สกิลที่เลือกใช้ตามสถานการณ์

## ยิงปกติ (BA) — แส้หนาม
- คำผู้ใช้: "ba is using whip thorn u will wield left and right kinda slow but middle range 7 damage whip will only come out when u wield wand and gotta make it smooth too when wielding like actual whip"
- แส้หนามออกจากไม้กายสิทธิ์ **เฉพาะตอนตวัด** (ไม่ตวัด = ไม่มีแส้)
- ตวัด ซ้าย → ขวา สลับกัน ค่อนข้างช้า
- ระยะกลาง • ดาเมจ 7 ต่อครั้ง
- ภาพ: แส้ต้องลื่นเหมือนแส้จริง (โค้งตามแรงเหวี่ยง ปลายตามหลัง สะบัดที่ปลาย)
- **ตัวเลข (ผู้ใช้เลือก):** ระยะ 6 ม. (120) • ตวัดห่างกัน 0.8 วิ (~9 ดาเมจ/วิ) • กวาดเป็นวงโค้งหน้า โดนทุกคนในทาง (คนละครั้งต่อการตวัด) • กดค้าง = ตวัดซ้าย-ขวาสลับไปเรื่อยๆ ต่อกันลื่น

## สี
- ผู้ใช้เลือก "1 and 2" = เขียวสด + เหลืองทอง (ใบไม้ แสงเกสร) ผสม เขียวเข้ม + น้ำตาลเปลือกไม้ (ป่าลึก)

## พุ่ง (Dash) — เถาวัลย์เกี่ยว (grappling hook)
- คำผู้ใช้: "so dash is maybe like grappling hook but only work with ur own plant teammate and enemies not sure if i should do enemies too? but u have to aim if u wanna hook to teammate there will be like easier to lock cuz there assist aim bigger hitbox i can send image of ref how will it look as hitbox ui for teammate and our plant for enemy u gotta aim directly to and hit only to pull u into when hit enemies or teammate thorn will พันรอบตัว them and last like 3 sec for teammate thorn will heal them up 10/0.5sec if hit enemy it will poison them 7/sec and slow 50% if u hook to plant u get speed boost 50% 3 sec too but not sure if plant will buff or sum"
- เกี่ยวได้เฉพาะ: **พืชของเรา • เพื่อนร่วมทีม • ศัตรู (ผู้ใช้ยังไม่แน่ใจเรื่องศัตรู)**
- ต้องเล็ง • เพื่อน/พืชเรา = มีตัวช่วยเล็ง (hitbox ใหญ่ + UI ล็อกเป้า — ผู้ใช้จะส่งรูป ref ของ UI) • ศัตรู = ต้องเล็งโดนตรงๆ
- โดนแล้ว **ดึงตัวเราไปหาเป้า**
- โดนเพื่อน/ศัตรู: หนามพันรอบตัวเป้า 3 วิ
  - เพื่อน: ฮีล 10 ทุก 0.5 วิ (= 60 ใน 3 วิ)
  - ศัตรู: พิษ 7/วิ + ช้า 50% (3 วิ = 21 ดาเมจ)
- เกี่ยวพืชเรา: เราได้วิ่งเร็วขึ้น 50% 3 วิ (ผู้ใช้ยังคิดว่าพืชจะได้บัฟอะไรไหม)

- **ตัวเลข (ผู้ใช้เลือก):** เกี่ยวศัตรูได้ • คูลดาวน์ 8 วิ เท่ากันทุกเป้า • ระยะ 15 ม. (300) • เกี่ยวพลาด = เสียคูลดาวน์เต็ม
- ⚠ Claude ตั้งเอง (ยังไม่ได้ถาม): เถาวัลย์พุ่งไป ~0.2 วิ, ดึงตัวเรา ~40 ม./วิ

## โล่ — เถาวัลย์หนามหมุนรอบตัว
- ผู้ใช้เลือก (รอบ 2): เถาหนามหมุนเป็นกรงรอบตัว
- กันกระสุนทุกทิศ • เกจโล่ 100 หมด = เถาขาด รอ 3 วิ ไม่ใช้ค่อยๆ ฟื้น (⚠ อัตราฟื้นยังไม่ได้ถาม)
- คนเข้าใกล้ 2 ม. โดนหนาม 3 ดาเมจ ทุก 0.5 วิ
- **เดินปกติ ไม่ช้าลง • ไม่มี parry/สะท้อน**

## สกิล 5 อัน (เลือกใส่ 4 ช่อง) = พืช 2 + สกิลตามสถานการณ์ 3

### พืช 1 — ป้อมยิง (ตัวหลัก)
- คำผู้ใช้: "well peashooter lol but copyright so shoot something else and different model but still ref from peashooter"
- = ได้แรงบันดาลใจจากพืชยิงถั่ว แต่ต้องเป็นของเราเอง: กระสุนคนละอย่าง โมเดลคนละแบบ (ห้ามเหมือนของเกมนั้น)
- **ผู้ใช้เลือก:** ต้นกล้าฝักยิงหนาม — หัวเป็นฝักเมล็ดทรงหยดน้ำ ใบเป็นปีก ยิงหนามแหลมสีเขียวจากปลายฝัก
- ยิงเองหาศัตรูใกล้สุด: 5 ดาเมจ ทุก 0.7 วิ ระยะ 20 ม. (400) (~7/วิ)
- วางได้สูงสุด 2 ต้น อยู่ 20 วิ คูลดาวน์ 10 วิ (วางต้นที่ 3 = ต้นแรกหาย)
- เลือด 60 HP ศัตรู/บอทตีตายได้
- วาง: คำผู้ใช้ "u will throw like seed or sum if it hit where it can be place it will instantly come up with animation for sure can be place on wall too if wall like flat" = โยนเมล็ด → ตกตรงที่วางได้ = งอกขึ้นทันทีพร้อมแอนิเมชัน • **ติดกำแพงได้ถ้ากำแพงเรียบ** (งอกออกข้างกำแพง)
- โยนไกลสุด 15 ม. (300) • ตกที่วางไม่ได้ (เช่นหลังคาเอียง) = เมล็ดกลิ้งต่อจนเจอพื้นแล้วงอก (ใช้กับพืชทั้ง 2)

### พืช 2 — ดอกไม้กินคน
- ผู้ใช้เลือก "ดอกไม้กินคน" แล้วลังเล: "im not sure now should i do this plant im out of idea like who will get into it range? it short range right?? if we just planted and it stay still there" (ปัญหา: ระยะสั้น ยืนนิ่ง ใครจะเดินเข้าไป)
- ทางแก้ที่เสนอ: โยนใส่ศัตรู = งอกงับทันที / คอยาว-เถาดึง / คุมประตู / เปลี่ยนพืช — ผู้ใช้: "keep it first not sure" → **พักไว้ ยังไม่ตัดสิน**

### สกิล 3 — ต้นไม้ใหญ่บัฟ + ฮีล (ชื่อยังไม่มี)
- คำผู้ใช้: "grow kinda big plant that will buff plant and heal and area 100 hp i can send ref plant will be like green body tall and บานออกเหมือนดอกบัว pink color middle yellow like its core"
- ปลูกพืชต้นใหญ่ เลือด 100 HP • มีพื้นที่รอบตัว: บัฟพืชของเรา + ฮีล
- หน้าตา: ลำต้นสีเขียวสูง ด้านบนบานออกเหมือนดอกบัว กลีบสีชมพู ตรงกลางเหลืองเหมือนแกน (ผู้ใช้จะส่งรูป ref)
- **ผู้ใช้เลือก:** วง 8 ม. (160) ฮีล เรา + เพื่อน + พืชของเรา 5/วิ • พืชในวงยิงเร็วขึ้น 50% • อยู่ 15 วิ คูลดาวน์ 22 วิ ทีละ 1 ต้น • โยนเมล็ดไกล 15 ม. เหมือนพืชอื่น (พื้นเท่านั้น ไม่ติดกำแพง)

## ยังต้องถาม
- Dash: พืชได้บัฟอะไรตอนถูกเกี่ยว (ผู้ใช้: "dont know yet") / รูป ref UI ล็อกเป้า (ผู้ใช้จะส่ง) / โดนตัวกลางทาง (บ้าน) เป็นยังไง
- ดอกไม้กินคน (พัก) • สกิลตามสถานการณ์อีก 2 อัน • อัลติ • ชื่อทุกอย่าง • รูป ref (ดอกบัว, UI ล็อกเป้า) • พุ่ง • สกิล 5 อัน (พืชป้อมปืน + สกิลตามสถานการณ์) • อัลติ • ชื่อ • สี
