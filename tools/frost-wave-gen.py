# Glacier Rend คลื่นดาบใหม่ (ผู้ใช้ 2026-11-06 + รูป ref): คลื่นครึ่งเสี้ยวลากพื้น ขอบหน้าขาวร้อน ไล่ฟ้า→น้ำเงินเข้ม หางบางยาวตามพื้น
# สร้าง: assets/fx/mesh/frost_wave_blade.mesh.json • assets/fx/tex/frost_wave_body|streak.png • assets/fx/frost/rend_slash.fx.json
# ปรับค่าหน้าตา = แก้ค่าด้านล่างแล้วรัน: python tools/frost-wave-gen.py  แล้ว node tools/fx-check.js
import json,math,random
from pathlib import Path
from PIL import Image,ImageFilter
ROOT=Path(__file__).resolve().parents[1]
def save(p,d):Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=1),encoding='utf-8')
# ---------- รูปทรง (เมตร): +z = ทิศพุ่ง, y = ขึ้น • s = ตามขอบหน้า 0 พื้น → 1 ปลายบน • t = 0 ขอบหน้า → 1 ขอบหลัง
R,H=2.6,4.6      # ระยะพุ่งนำของขอบหน้าที่พื้น • ความสูง
W=3.0            # ความหนาเนื้อคลื่นกลางเสี้ยว
TAIL=8.5         # หางที่ลากตามพื้น
LEAN=0         # เอียงข้าง (มองจากหลังเห็นเป็นเสี้ยว ไม่ใช่เส้นบาง)
BOW=1.15          # โป่งด้านข้างกลางเนื้อ
NS,NT=44,16
def lead(s):
    a=s*math.pi*.5;return R*math.cos(a)-3.4*s**3.2, H*math.sin(a)+.9*s**4   # ปลายบนโค้งไปข้างหลังแล้วแหลม
def thick(s):return W*math.sin(math.pi*s)**.8*(1-s)**.55*1.5+TAIL*(1-s)**7+.015   # เรียวเหลือปลายเข็มที่ s=1
V=[];UV=[];F=[]
for i in range(NS+1):
    s=i/NS;z0,y0=lead(s);d=thick(s)
    for j in range(NT+1):
        t=j/NT;z=z0-d*t**1.25
        y=y0*(1-.35*t*t*min(1,d/W)*(1 if s>.15 else s/.15))+.04      # ขอบหลังตกลงหาพื้น = เสี้ยว
        x=LEAN*y+BOW*math.sin(math.pi*t)*math.sin(math.pi*s)
        V.append([round(x,4),round(y,4),round(z,4)]);UV.append([round(t,4),round(s,4)])
for i in range(NS):
    for j in range(NT):
        q=i*(NT+1)+j;F.append([q,q+NT+1,q+NT+2,q+1])
save(ROOT/'assets/fx/mesh/frost_wave_blade.mesh.json',{'v':1,'desc':'Glacier Rend: คลื่นครึ่งเสี้ยวลากพื้น หางบางยาวตามพื้น (สร้างจาก tools/frost-wave-gen.py)','pal':'ice','mat':'glow','parts':[{'id':'bladeR','k':'poly','v':V,'f':F,'uv':UV},{'id':'bladeL','k':'poly','v':[[-p[0],p[1],p[2]] for p in V],'f':F,'uv':UV}]})   # สองแผ่นสมมาตร: ตั้งตรง แต่มองจากหลังเห็นโค้งหนา ไม่เป็นเส้นบาง
# ---------- ภาพ: u = ขอบหน้า(ซ้าย)→หลัง(ขวา), v = พื้น→ปลาย (ภาพ y ลงล่าง: แถวบนคือ v=0 เพราะ flipY ปิดใน fxTex?) ใช้สมมาตรตามแกน v
random.seed(41)
W_,H_=512,256
stops=[(0,(255,255,255,255)),(.035,(255,255,255,255)),(.09,(214,246,255,250)),(.18,(96,200,255,250)),(.4,(34,118,245,238)),(.62,(18,66,200,170)),(.82,(12,40,150,70)),(.94,(10,30,120,16)),(1,(10,28,100,0))]
def ramp(u):
    for (a,c0),(b,c1) in zip(stops,stops[1:]):
        if u<=b:
            k=(u-a)/(b-a);return tuple(c0[i]+(c1[i]-c0[i])*k for i in range(4))
    return stops[-1][1]
fib=Image.new('L',(W_,H_),128);d=fib.load()
for n in range(900):      # เส้นใยยาวตามแนวไหล
    y=random.randrange(H_);x0=random.randrange(W_);L=random.randrange(40,300);v=random.choice((60,90,170,205,235))
    for k in range(L):
        x=(x0+k)%W_
        for yy in (y,(y+1)%H_):d[x,yy]=int(d[x,yy]*.72+v*.28)
fib=fib.filter(ImageFilter.GaussianBlur(1.1));d=fib.load()
im=Image.new('RGBA',(W_,H_));p=im.load()
for y in range(H_):
    for x in range(W_):
        u=x/(W_-1);n=(d[x,y]-128)/128;uu=max(0,min(1,u+n*.1*min(1,u*7)*(1-u*.7)))
        r,g,b,a=ramp(uu);a*=1+n*.55*min(1,u*4)*(1-u)
        v=1-y/(H_-1);k=max(0,min(1,(1-v)/.34));a*=k*k*(3-2*k)   # ปลายบน (v=1) จางหมด ไม่มีขอบตัด
        e=(1-u)**18*.0
        p[x,y]=(int(min(255,r*(1+n*.35))),int(min(255,g*(1+n*.3))),int(min(255,b)),int(max(0,min(255,a))))
im.save(ROOT/'assets/fx/tex/frost_wave_body.png',optimize=True)
save(ROOT/'assets/fx/tex/frost_wave_body.tex.json',{'v':1,'desc':'เนื้อคลื่น Glacier Rend: ขอบซ้ายขาวร้อน ไล่ฟ้า น้ำเงินเข้ม จางขวา มีเส้นใยไหล','gen':'image','seed':41,'px':W_,'cols':1,'rows':1,'kind':'loop','fps':1,'ramp':'white','add':False,'p':{}})
st=Image.new('RGBA',(512,256),(255,255,255,0));q=st.load()
for n in range(230):      # เส้นแสงบาง ๆ ไหลตามผิว (วนต่อเนื่องแนว u)
    y=random.randrange(256);x0=random.randrange(512);L=random.randrange(30,190);b=random.randrange(120,255)
    for k in range(L):
        x=(x0+k)%512;t=k/L;a=int(b*math.sin(math.pi*t)**1.4)
        fv=max(0,min(1,y/(.34*255)));a=int(a*fv*fv*(3-2*fv)*(1-x/511)**1.5)
        if a>q[x,y][3]:q[x,y]=(255,255,255,a)
st=st.filter(ImageFilter.GaussianBlur(.6));st.save(ROOT/'assets/fx/tex/frost_wave_streak.png',optimize=True)
save(ROOT/'assets/fx/tex/frost_wave_streak.tex.json',{'v':1,'desc':'เส้นแสงไหลบนผิวคลื่น Glacier Rend','gen':'image','seed':41,'px':512,'cols':1,'rows':1,'kind':'loop','fps':1,'ramp':'white','add':True,'p':{}})
# ออร่ารอบคลื่น: ฟุ้งนุ่ม จางหมดทุกขอบ (ไม่มีรอยตัด)
AW,AH=256,128;au=Image.new('RGBA',(AW,AH),(255,255,255,0));ap=au.load()
for y in range(AH):
    for x in range(AW):
        u=x/(AW-1);v=1-y/(AH-1);e=min(1,u/.06)*(1-u)**1.7*min(1,(1-v)/.4)**1.5*min(1,v/.05)
        ap[x,y]=(90,190,255,int(255*e*.8))
au=au.filter(ImageFilter.GaussianBlur(5));au.save(ROOT/'assets/fx/tex/frost_wave_aura.png',optimize=True)
save(ROOT/'assets/fx/tex/frost_wave_aura.tex.json',{'v':1,'desc':'ออร่าฟุ้งรอบคลื่น Glacier Rend จางนุ่มทุกขอบ','gen':'image','seed':41,'px':AW,'cols':1,'rows':1,'kind':'loop','fps':1,'ramp':'white','add':True,'p':{}})
# รอยฟันบนพื้น: แนวตรง กลางแตกขาวฟ้า ขอบไหม้เข้มจางออก ต่อกันได้แนวยาว (v วนรอบ)
SW,SH=128,256;random.seed(9)
def per(y,ph,f):return math.sin(2*math.pi*(y/SH*f+ph))
sc=Image.new('RGBA',(SW,SH),(255,255,255,0));sp=sc.load();gl=Image.new('RGBA',(SW,SH),(255,255,255,0));gp=gl.load()
P=[random.random() for _ in range(8)]
for y in range(SH):
    off=(per(y,P[0],2)*.05+per(y,P[1],5)*.03+per(y,P[2],11)*.012)
    wd=.3+per(y,P[3],3)*.05+per(y,P[4],7)*.03
    for x in range(SW):
        u=x/(SW-1)*2-1;d=abs(u-off);k=max(0,1-d/wd);burn=k*k*(3-2*k)
        core=max(0,1-d/(.05+.02*per(y,P[5],9)))
        c=(int(8+40*core),int(14+150*core),int(34+215*core))
        sp[x,y]=(c[0],c[1],c[2],int(255*min(1,burn*.72+core)))
        gp[x,y]=(255,255,255,int(255*max(0,1-d/.16)**2))
sc.save(ROOT/'assets/fx/tex/frost_wave_scar.png',optimize=True);gl.save(ROOT/'assets/fx/tex/frost_wave_scarglow.png',optimize=True)
save(ROOT/'assets/fx/tex/frost_wave_scar.tex.json',{'v':1,'desc':'รอยคลื่นฟันบนพื้น: แนวตรง กลางแตกเรืองฟ้า ขอบไหม้เข้มจางออก','gen':'image','seed':9,'px':SW,'cols':1,'rows':1,'kind':'loop','fps':1,'ramp':'white','add':False,'p':{}})
save(ROOT/'assets/fx/tex/frost_wave_scarglow.tex.json',{'v':1,'desc':'แสงเรืองกลางรอยคลื่นฟัน','gen':'image','seed':9,'px':SW,'cols':1,'rows':1,'kind':'loop','fps':1,'ramp':'white','add':True,'p':{}})
save(ROOT/'assets/fx/mesh/frost_wave_scar.mesh.json',{'v':1,'desc':'แผ่นรอยคลื่นฟันบนพื้น: กว้าง ±1 ยาว 0..1 ตาม +z','pal':'ice','mat':'glow','parts':[{'id':'scar','k':'poly','v':[[-1,0,0],[1,0,0],[1,0,1],[-1,0,1]],'f':[[0,3,2,1]],'uv':[[0,0],[1,0],[1,1],[0,1]]}]})
# ---------- เอฟเฟกต์ (เล่นคาตำแหน่งคลื่นจริง: js/25 + js/21 ย้าย x,y ตามคลื่น)
LIFE=3.0   # วนจนคลื่นจบ (js/21 สั่งหยุด) เส้นโค้งข้างล่างคิดเป็นสัดส่วนของ LIFE
GROW={'0':.3,'0.07':1}   # เริ่มเล็กใกล้ตัว ไม่จ้าใส่หน้าตอนออกจากมือ
OPIN={'0':0,'0.03':0,'0.06':1}   # รอออกจากตัวก่อนค่อยสว่าง: อัลติ 3 คลื่นจะได้ไม่ซ้อนกันจนจอขาว
def blade(lid,tex,col,**o):
    d={'id':lid,'t':'mesh','at':0,'life':LIFE,'loop':True,'loop':True,'shape':'model','model':'frost_wave_blade','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,'pos':[0,0,0],'scale':GROW,'op':OPIN,'fade':0}
    d.update(o);return d
L=[
 blade('aura','tex/frost_wave_aura','#ffffff',op={'0':0,'0.03':0,'0.06':.9},pos=[0,0,-.5],scale={'0':[.4,.4,.4],'0.07':[1,1.08,1.35]}),
 blade('body','tex/frost_wave_body','#ffffff'),
 blade('flow','tex/frost_wave_streak','#c8f2ff',uvTile=[1,1],uvScroll=[-1.3,0],op={'0':0,'0.03':0,'0.06':.7}),
 {'id':'gnd','t':'mesh','at':0,'life':LIFE,'loop':True,'shape':'sphere','mat':'glow','col':'#ffffff','pos':[0,.1,1.9],'scale':.06,'fade':0},
 {'id':'gline','t':'trail','at':0,'life':LIFE,'loop':True,'of':'gnd','col':'#e8fbff','col2':'#2f8fe8','w':.14,'tlife':.7,'k':1.25},
 {'id':'wisps','t':'emit','at':0,'life':LIFE,'loop':True,'rate':80,'from':'box','fr':.5,'fh':4.2,'pos':[0,.2,-.6],'dir':'aim','yaw':180,'spread':.2,'speed':[1,3],'plife':[.3,.6],'size':[6,11],'col':'#4fb4ff','c2':'#1a3fb0','gravity':-.5,'drag':1.2,'fin':5},
 {'id':'stars','t':'emit','at':0,'life':LIFE,'loop':True,'rate':90,'from':'box','fr':.5,'fh':4.2,'pos':[0,.2,-1],'dir':'random','spread':1,'speed':[.5,3],'plife':[.25,.7],'look':'spark','size':[.8,1.9],'col':'#ffffff','c2':'#7fd8ff','gravity':.4,'drag':1.2},
 {'id':'lines','t':'emit','at':0,'life':LIFE,'loop':True,'rate':60,'from':'box','fr':.9,'fh':4.6,'dir':'aim','yaw':180,'spread':.05,'speed':[14,26],'plife':[.14,.3],'look':'streak','size':[2.5,5],'col':'#ffffff','c2':'#4fb4ff','gravity':0,'drag':0,'pos':[0,.3,-.6]},
 {'id':'sparks','t':'emit','at':0,'life':LIFE,'loop':True,'rate':120,'from':'sphere','fr':.6,'dir':'random','spread':1,'speed':[2,7],'up':[1,5],'plife':[.2,.55],'look':'spark','size':[.7,1.5],'col':'#ffffff','c2':'#6fd8ff','gravity':7,'drag':1.5,'pos':[0,.15,.6]},
 {'id':'rocks','t':'emit','at':0,'life':LIFE,'loop':True,'rate':38,'from':'sphere','fr':.8,'pos':[0,.2,-.8],'dir':'random','spread':1,'speed':[1,4],'up':[2,5],'plife':[.5,.9],'look':'model','model':'frost_shard','mmat':'ice','msize':[.08,.2],'bounce':.3,'mspin':540,'gravity':11,'drag':1.2,'col':'#e6f7ff','c2':'#2f7fe0'},
 {'id':'debris','t':'emit','at':0,'life':LIFE,'loop':True,'rate':22,'from':'sphere','fr':.7,'pos':[0,.15,-1.2],'dir':'random','spread':1,'speed':[1,3],'up':[2,4.5],'plife':[.6,1],'look':'model','model':'frost_shard','mmat':'solid','msize':[.07,.16],'bounce':.3,'mspin':400,'gravity':12,'drag':1,'col':'#39404e','c2':'#191d28'},
 {'id':'light','t':'light','at':0,'life':LIFE,'loop':True,'col':'#8fe0ff','int':2,'dist':11,'pos':[0,1.6,0]},
]
save(ROOT/'assets/fx/frost/rend_slash.fx.json',{'v':1,'desc':'Glacier Rend คลื่นดาบ (ผู้ใช้ 2026-11-06 + ref): ครึ่งเสี้ยวตั้งตรงลากพื้น ขอบหน้าขาวร้อน ไล่ฟ้าน้ำเงิน ออร่าฟุ้งจางนุ่มตามหลัง ประกายดาว เส้นแสง เศษหิน • สร้างจาก tools/frost-wave-gen.py','tags':['frost','slash','projectile'],'pal':'ice','dur':LIFE,'layers':L})
print('ok',len(V),'verts',len(F),'quads')
