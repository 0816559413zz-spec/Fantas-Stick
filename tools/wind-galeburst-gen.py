# GaleBurst (สายลม) — ยิงคลิกซ้ายเสริมพลังตอนเกจเต็ม = ทอร์นาโดนอนพุ่งไปข้างหน้า 25 ม. (500 หน่วย)
# ใช้: python tools/wind-galeburst-gen.py แล้ว node tools/fx-check.js • ดู studio.html?fx=wind/galeburst
# รอบ 2 (ผู้ใช้ 2026-10-28, รูปมังงะ): ไม่เอาลมหมึก • วงลม 3D เรียงตามทาง ใหญ่ขึ้นเรื่อย ๆ • หนามลมขาวรอบ ๆ (3D ไม่ใช่ 2D)
# • เร็ว แต่ต้องเห็นทอร์นาโด • เส้นแกนกลางเรืองตรง ๆ แบบในรูป
import json,math,random
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
src=(ROOT/'tools/wind-kit-gen.py').read_text(encoding='utf-8')
g={'__name__':'kit'};exec(src[:src.index('def stroke_fx')].replace("W('mesh/","(lambda *a:None)('mesh/"),g)   # เอาแค่ tornado() ที่ผู้ใช้อนุมัติ
tornado=g['tornado'];C=g['C']
G=dict(inner='#efffe8',mid='#8dff65',outer='#2ec772',hi='#ffffff',line='#1a7a45',ring='#8dff65',ring2='#ffffff',spark='#d2ffb8')   # เขียวแบบสกิลลมอื่น (Windrift)
DUR=1.1;FLY=0.32;DIST=12.0;Y=1.15   # ผู้ใช้ 2026-10-28: 'not that long' → ภาพยาว 12 ม. (⚠ ระยะโดนในเกมตาม wind.md ยัง 500)
Z0=1.0
hz=lambda t:Z0+DIST*min(1,max(0,t)/FLY)**.8          # หัวทอร์นาโดอยู่ที่ z ไหนตอนเวลา t
tat=lambda z:FLY*((z-Z0)/DIST)**1.25                  # หัวผ่านจุด z ตอนไหน
head=lambda t:[0,Y,hz(t)]
RZ=lambda z:0.27+1.08*(z-Z0)/DIST     # ผู้ใช้: ต้นทาง ~0.3 เท่าตัว (กว้าง ~0.55 ม.) → ปลาย ~1.5 เท่าตัว (กว้าง ~2.7 ม.)                       # รัศมีกรวย: เล็กที่มือ ใหญ่ขึ้นไปข้างหน้า (แบบในรูป)
T=lambda n:'tex/'+n
LN='#1a7a45'                                          # ลายเส้นฟ้าเข้ม (ไม่ใช่หมึกดำ)
def piece(id_,at,life,model,tex,col,pos,R,depth,spin,ry,o=1.0,i=None,pop=(0.5,1.0,1.2)):
    d={'id':id_,'t':'mesh','at':round(at,3),'life':life,'att':'feet','shape':'model','model':model,'mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,
       'uvTile':[1,1],'uvScroll':[0,0],'pos':pos,'rot':[-90,0,ry],'spin':spin,'fade':0,
       'scale':{'0':[round(R*pop[0],2),depth,round(R*pop[0],2)],'0.3':[round(R*pop[1],2),depth,round(R*pop[1],2)],'1':[round(R*pop[2],2),depth,round(R*pop[2],2)],'ease':'out'},
       'op':{'0':0,'0.12':o,'0.6':round(o*.8,2),'1':0}}
    if i:d['int']=i
    return d
L=[];rg=random.Random(7)
# 1) ตัวทอร์นาโด: แถบสโตรกหมุนเร็วรอบแกนพุ่ง วางตามทางทันทีที่หัวผ่าน → เป็นกรวยนอนบานไปข้างหน้า
# (ผู้ใช้ 2026-10-28 'not that messy': เอาชิ้นสโตรกแยกออก เหลือเกลียวต่อเนื่องอย่างเดียว)
# 1b) เกลียวลมต่อเนื่อง (ผู้ใช้: "เชื่อม ๆ กันแบบ tornado ไม่ใช่เส้นกลมแยกกัน"): เส้นเกลียว 5 เส้นยาวทั้งทาง ยืดตามหัว หมุนเร็ว ลายไหล
HL=FLY+.3;hp={};hs={}
for k in (0,.15,.3,.5,.75,1.0):
    tt=k*FLY;ln=max(.3,hz(tt)-Z0);kk=round(tt/HL,3);hs[str(kk)]=[1.35,round(ln,2),1.35]
hs['1']=[1.45,DIST*1.04,1.45]
for nm,tex,col,sc,sp,o,i,ry in [('hxw','wind_swoosh_a_hi','#ffffff',.92,720,1.0,1.5,0),('hxb','wind_swoosh_b','#8dff65',1.0,720,1.0,1.2,36),('hxl','wind_swoosh_b_ln',LN,1.06,720,.85,None,36)]:
    d={'id':nm,'t':'mesh','at':0,'life':round(HL,2),'att':'feet','shape':'model','model':'wind_gbhelix','mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,
       'uvTile':[6,1],'uvScroll':[round(-9*sp/720,1),0],'pos':[0,Y,Z0],'rot':[-90,0,0],'spin':0,'fade':0,
       'scale':{k:[round(v[0]*sc,2),v[1],round(v[2]*sc,2)] for k,v in hs.items()},'op':{'0':0,'0.08':o,'0.7':o,'1':0}}
    if i:d['int']=i
    L.append(d)
# 2) หัวทอร์นาโด: ทอร์นาโดลมใสที่อนุมัติแล้ว วิ่งนำหน้า (เห็นเป็นทอร์นาโดชัด ๆ) + แกนขาวในตัว
L+=tornado('h',head,0,FLY+.05,s=.22,axis='fwd',every=.07,life=.25,col=G,floor=False)
# 3) วงลม 3D เรียงตามทาง (แบบในรูป): วงหนาขาว หมุนเร็ว เกิดตอนหัวผ่าน ใหญ่ขึ้นเรื่อย ๆ ไปข้างหน้า
for j in range(4):
    z=Z0+2+j*(DIST-3)/3;at=tat(z);R=RZ(z);sp=720*(1 if j%2 else -1);ry=rg.uniform(0,360);pos=[0,Y,round(z,2)]
    # หนามลมขาวพุ่งออกรอบวง (3D: เส้นขีด + เข็มลม)
    L.append({'id':f'r{j}sp','t':'emit','at':round(at,3),'life':.05,'att':'feet','pos':pos,'burst':int(18+j*5),'rate':0,'from':'sphere','fr':round(R*.7,2),'dir':'out','speed':[5,9],'plife':[.1,.2],'look':'streak','size':[1.4,2.8],'col':'#ffffff','c2':'#8dff65','gravity':0,'drag':4,'curl':False})
# 4) เส้นแกนกลางเรืองตรง ๆ (แบบในรูป): ยืดตามหัว แล้วจาง
LIFE=FLY+.35;ks=[0,.2,.4,.6,.8,1.0]
pos={};sc={}
for k in ks:
    tt=min(k*FLY,FLY);ln=max(.1,hz(tt)-Z0);kk=round(k*FLY/LIFE,3)
    pos[str(kk)]=[0,Y,Z0];sc[str(kk)]=[.018,round(ln,2),.018]
pos['1']=pos[str(round(FLY/LIFE,3))];sc['1']=[.008,DIST,.008]
L.append({'id':'axis','t':'mesh','at':0,'life':round(LIFE,2),'att':'feet','shape':'cylinder','mat':'glow','col':'#ffffff','col2':'#8dff65','rot':[-90,0,0],'pos':pos,'scale':sc,'int':.9,'op':{'0':1,'0.7':.9,'1':0},'fade':0})
# 5) หนามลมขาวตามหัวตลอดทาง
L.append({'id':'hspk','t':'emit','at':0,'life':FLY,'att':'feet','pos':{str(k):head(k*FLY) for k in (0,.25,.5,.75,1)},'rate':50,'from':'sphere','fr':.5,'dir':'out','speed':[6,12],'plife':[.1,.2],'look':'streak','size':[1.2,2.4],'col':'#ffffff','c2':'#8dff65','gravity':0,'drag':3,'curl':False})
# 5b) เอฟเฟกต์รอบตัว (ผู้ใช้ "effect around more"): เส้นลมไหลขนานทาง + ประกายเขียว + สโตรกวงนอกไม่กี่ชิ้นหมุนรอบกรวย
HP={str(k):head(k*FLY) for k in (0,.25,.5,.75,1)}
L.append({'id':'flow','t':'emit','at':0,'life':FLY+.05,'att':'feet','pos':HP,'rate':110,'from':'sphere','fr':1.0,'dir':'aim','yaw':0,'spread':.25,'speed':[10,18],'plife':[.15,.3],'look':'streak','size':[1.2,2.6],'col':'#ffffff','c2':'#8dff65','gravity':0,'drag':1,'curl':False})
L.append({'id':'glint','t':'emit','at':.02,'life':FLY+.1,'att':'feet','pos':HP,'rate':70,'from':'sphere','fr':1.2,'dir':'random','speed':[1,3],'plife':[.3,.6],'look':'spark','size':[1,1.8],'col':'#d2ffb8','c2':'#8dff65','gravity':0})
for j in range(5):
    z=Z0+1.5+j*(DIST-2.5)/4;R=RZ(z)*1.4;at=tat(z);sp=720*(1 if j%2 else -1)
    L.append(piece(f'o{j}w',at,.4,f'wind_pieces{j%3}','wind_swoosh_a_hi','#ffffff',{'0':[0,Y,round(z,2)],'1':[0,Y,round(z+1.2,2)]},R,.8,sp,j*70,.9,1.3,(0.6,1.0,1.25)))
    L.append(piece(f'o{j}g',at,.4,f'wind_pieces{(j+1)%3}','wind_swoosh_b','#8dff65',{'0':[0,Y,round(z,2)],'1':[0,Y,round(z+1.2,2)]},R*1.08,.8,sp,j*70+150,.8,None,(0.6,1.0,1.25)))
# 6) ระเบิดตอนปล่อยที่มือ: แฟลช + หนามลมพุ่งรอบทิศ + วงกระแทก (ขาว/ฟ้า ไม่มีหมึก)
L.append({'id':'muzzle','t':'flash','at':0,'life':.12,'att':'feet','pos':[0,Y,.9],'col':'#efffe8','size0':.2,'size':1.2,'k':1})
L.append({'id':'spikes','t':'emit','at':0,'life':.05,'att':'feet','pos':[0,Y,.9],'burst':30,'rate':0,'from':'sphere','fr':.15,'dir':'out','speed':[4,8],'plife':[.1,.22],'look':'streak','size':[1,2],'col':'#ffffff','c2':'#8dff65','gravity':0,'drag':3,'curl':False})
for k,(tex,col) in enumerate([('wind_swoosh_a_hi','#ffffff'),('wind_swoosh_b','#8dff65')]):
    L.append(piece(f'muzring{k}',0,.3,f'wind_pieces{k}',tex,col,[0,Y,1.0],.35+k*.12,.3,700*(1-2*k),k*90,1.0,1.5 if k==0 else None,(0.2,1.0,1.3)))
L.append({'id':'shock','t':'warp','at':0,'life':.25,'att':'feet','pos':[0,Y,1.2],'kind':'shock','size':{'0':.2,'1':1.6},'str':1,'op':{'0':1,'1':0},'col':'#efffe8','glow':.04})
# 7) พื้นใต้ทาง: ลมเตะพื้น + เศษหินเล็ก ๆ ปลิว (สีเทา ไม่ใช่หมึก)
L.append({'id':'kick','t':'emit','at':.02,'life':FLY,'att':'feet','pos':{'0':[0,.1,1],'1':[0,.1,1+DIST]},'rate':50,'from':'disc','fr':.6,'dir':'aim','yaw':0,'spread':.8,'speed':[5,11],'up':[2,6],'plife':[.25,.5],'look':'streak','size':[1,2.4],'col':'#ffffff','c2':'#8dff65','gravity':4,'drag':1.5,'curl':False})
L.append({'id':'rocks','t':'emit','at':.02,'life':FLY,'att':'feet','pos':{'0':[0,.15,1],'1':[0,.15,1+DIST]},'rate':15,'from':'disc','fr':.8,'dir':'up','spread':.6,'speed':[3,7],'plife':[.4,.7],'look':'model','model':'wind_slash','mmat':'solid','msize':[.1,.22],'col':'#5d6b70','c2':'#8a979c','gravity':9,'mspin':600,'bounce':0})
L.append({'id':'shake','t':'screen','at':0,'life':.12,'shake':2})
fx={'v':1,'desc':'GaleBurst (เกจเต็ม → คลิกซ้าย): ทอร์นาโดนอนพุ่งเร็ว 25 ม. ใน 0.42 วิ — กรวยสโตรกลมใสบานไปข้างหน้า + หัวทอร์นาโด + วงลม 3D เรียงตามทาง + หนามลมขาว + เส้นแกนเรือง (ผู้ใช้ 2026-10-28: ไม่เอาหมึก)','tags':['wind','galeburst','ba'],'pal':'wind','dur':DUR,'seed':12,'layers':L}
(ROOT/'assets/fx/wind/galeburst.fx.json').write_text(json.dumps(fx,ensure_ascii=False,indent=1),encoding='utf-8')
print('wind/galeburst',len(L),'layers')
