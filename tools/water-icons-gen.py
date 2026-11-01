# Water skill icons, drawn for this game (white on transparent, 512 box like the Wind set).   python tools/water-icons-gen.py -> icons/*.svg
import os
OUT = os.path.join(os.path.dirname(__file__), '..', 'icons')
W = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">%s</svg>'
ST = '<g fill="none" stroke="#fff" stroke-width="%d" stroke-linecap="round" stroke-linejoin="round">%s</g>'
F = '<g fill="#fff">%s</g>'
DROP = 'M256 40C256 40 410 200 410 320A154 154 0 0 1 102 320C102 200 256 40 256 40Z'
I = {
 # ธาตุน้ำ: หยดน้ำ + ไฮไลต์เว้า
 'p_water': '<path fill="#fff" fill-rule="evenodd" d="%s M176 300a80 80 0 0 0 80 90a18 18 0 0 0 0-36a44 44 0 0 1-44-54a18 18 0 0 0-36 0z"/>' % DROP,
 # BA: รอยฟันโค้ง + กระสุนน้ำ 3 เม็ด
 'b_water': ST % (36, '<path d="M90 110C210 90 340 170 400 320"/>') + F % '<ellipse cx="150" cy="300" rx="52" ry="26" transform="rotate(35 150 300)"/><ellipse cx="240" cy="360" rx="52" ry="26" transform="rotate(35 240 360)"/><ellipse cx="330" cy="430" rx="52" ry="26" transform="rotate(35 330 430)"/>',
 # โล่: โดมน้ำ + หยดฮีลข้างใน
 'sh_water': ST % (40, '<path d="M70 400A186 186 0 0 1 442 400"/><path d="M50 440q50-34 103 0t103 0t103 0t103 0"/>') + F % '<path d="M256 240C256 240 318 300 318 340A62 62 0 0 1 194 340C194 300 256 240 256 240Z"/>',
 # Dash: จมพื้น โผล่อีกจุด
 'dsh_water': ST % (38, '<path d="M60 400q48-36 98 0t98 0t98 0t98 0"/><path d="M120 300C150 150 300 100 400 200"/><path d="M340 110l66 96-108 28"/>'),
 # Riptide: คลื่นม้วน
 'riptide': '<path fill="#fff" d="M40 420C60 240 170 90 320 90c80 0 140 50 150 120-40-40-110-40-140 10-24 42 0 90 40 104-70 30-150 10-180-60-50 50-90 110-110 156z"/>' + ST % (34, '<path d="M50 470q52-34 104 0t104 0t104 0t104 0"/>'),
 # Tidecaller: งูน้ำขดขึ้น หัวมีตา
 'tidecaller': ST % (46, '<path d="M120 450C300 450 400 380 340 310C290 250 130 290 130 200C130 120 230 80 320 90"/>') + '<path fill="#fff" fill-rule="evenodd" d="M300 50C370 40 450 60 480 100C450 140 370 160 300 140C310 110 310 80 300 50Z M390 84a14 14 0 1 0 .1 0z"/>',
 # Aqua Cage: ฟองน้ำ มีคนอยู่ข้างใน
 'aquacage': ST % (36, '<circle cx="256" cy="256" r="196"/><path d="M130 200A140 140 0 0 1 200 124"/>') + F % '<circle cx="256" cy="210" r="46"/><path d="M180 370C180 300 216 270 256 270S332 300 332 370Z"/><circle cx="420" cy="90" r="24"/><circle cx="470" cy="150" r="14"/>',
 # Abyssal Beam: วงเวท + ลำเรียวแหลม
 'abyssalbeam': ST % (26, '<ellipse cx="130" cy="256" rx="62" ry="176"/><ellipse cx="130" cy="256" rx="28" ry="90"/>') + F % '<path d="M130 208L490 256L130 304Z"/>' + ST % (24, '<path d="M250 150q70 20 90 60"/><path d="M250 362q70-20 90-60"/>'),
 # Moonwater: พระจันทร์เสี้ยว + ลำเงินลง
 'moonwater': '<path fill="#fff" d="M330 50A170 170 0 1 0 462 270A140 140 0 0 1 330 50Z"/>' + F % '<path d="M380 120l14 46 46 14-46 14-14 46-14-46-46-14 46-14z"/>' + ST % (28, '<path d="M60 470q40-28 80 0t80 0t80 0"/>'),
 # Dragon of the Deep: มังกรพุ่งลง ตัวเป็นคลื่น
 'dragondeep': ST % (52, '<path d="M410 60C300 60 150 110 210 200C260 270 400 230 370 330C356 360 300 350 260 370"/>') + '<path fill="#fff" fill-rule="evenodd" d="M300 300L340 390L262 506L170 400L180 300L232 350Z M232 396a18 18 0 1 0 .1 0z M286 386a18 18 0 1 0 .1 0z"/>' + ST % (30, '<path d="M70 470q40-26 80 0"/><path d="M340 470q40-26 80 0"/>'),
}
for k, v in I.items(): open(os.path.join(OUT, k + '.svg'), 'w', encoding='utf-8').write(W % v)
print(len(I))
