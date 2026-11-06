"""Package actual Studio screenshots; no image synthesis or painted retouching."""
from pathlib import Path
import shutil
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
SHOTS=ROOT/'shots'
OUT=ROOT/'designs/nature_vfx/ult_tree_review'
OUT.mkdir(parents=True,exist_ok=True)
FONT='C:/Windows/Fonts/tahoma.ttf'
TITLE=ImageFont.truetype(FONT,28)
SMALL=ImageFont.truetype(FONT,20)
LABELS={'front':'ด้านหน้า / เทียบตัวละคร','hero':'มุมเฉียง',
        'back':'ด้านหลัง','side':'ด้านข้าง','roots':'รากและโคนต้น',
        'heart':'มัดไม้ / แกนด้านใน','crown':'กิ่งด้านบน','top':'มองจากด้านบน',
        'clay':'ดินปั้น / ตรวจรูปทรง'}
NAMES={'a':'A — มัดไม้บิดพัน ยอดแผ่กว้าง',
       'b':'B — รากโอบช่องแกนกลาง',
       'c':'C — ต้นเอน มีรากค้ำสวนทิศ'}


def sheet(tiles,cols,width,title,filename):
    gap=14
    tilew=(width-(cols+1)*gap)//cols
    tileh=round(tilew*.7)
    rows=(len(tiles)+cols-1)//cols
    canvas=Image.new('RGB',(width,80+rows*(tileh+48+gap)),(15,23,21))
    draw=ImageDraw.Draw(canvas)
    draw.text((gap,16),title,font=TITLE,fill=(225,241,221))
    for i,(path,label) in enumerate(tiles):
        x=gap+(i%cols)*(tilew+gap)
        y=75+(i//cols)*(tileh+48+gap)
        im=Image.open(path).convert('RGB')
        im=im.resize((tilew,tileh),Image.Resampling.LANCZOS)
        canvas.paste(im,(x,y))
        draw.text((x+6,y+tileh+10),label,font=SMALL,fill=(190,215,188))
    canvas.save(OUT/filename,quality=94)


for variant in 'abc':
    for label in LABELS:
        src=SHOTS/f'nature_ult_tree_{variant}_review_{label}.jpg'
        shutil.copyfile(src,OUT/f'{variant}_{label}.jpg')
    sheet([(OUT/f'{variant}_{k}.jpg',LABELS[k]) for k in LABELS],3,1800,
          NAMES[variant]+' | ร่างโมเดลอัลติ Nature',f'{variant}_all_views.jpg')

for label in ['front','hero']:
    shutil.copyfile(SHOTS/f'nature_ult_tree_a_dark_{label}.jpg',OUT/f'a_dark_{label}.jpg')

sheet([(OUT/f'{v}_hero.jpg',NAMES[v]) for v in 'abc'],3,2100,
      'Nature อัลติ — เปรียบเทียบ 3 ร่าง (ยังไม่ผูกเกม)',
      'three_silhouettes.jpg')
sheet([(OUT/'a_front.jpg','ด้านหน้า'),(OUT/'a_back.jpg','ด้านหลัง'),
       (OUT/'a_roots.jpg','รากแตกแขนงจากโคน'),(OUT/'a_heart.jpg','มัดไม้และแสงด้านใน')],
      2,1600,'A — ภาพตรวจรูปทรงและรายละเอียด','a_detail_review.jpg')
for variant in 'abc':
    for label in ['hero','front','side','back','roots','heart']:
        shutil.copyfile(SHOTS/f'nature_tree_{variant}_material_{label}.jpg',
                        OUT/f'{variant}_material_{label}.jpg')
    sheet([(OUT/f'{variant}_material_{k}.jpg',LABELS[k])
           for k in ['front','hero','side','back','roots','heart']],3,1800,
          NAMES[variant]+' | แสงแยกสำหรับดูวัสดุ',f'{variant}_material_views.jpg')
sheet([(OUT/f'{v}_material_hero.jpg',NAMES[v]) for v in 'abc'],3,2100,
      'Nature อัลติ — เทียบทรงด้วยแสงดูวัสดุ (แยกจากฉากเกม)',
      'three_material_silhouettes.jpg')
print('Packaged',len(list(OUT.glob('*.jpg'))),'actual Studio images/sheets in',OUT)
