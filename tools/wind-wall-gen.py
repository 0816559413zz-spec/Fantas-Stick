# กำแพงลม Aegis Gale (สายลม) — สร้างเอฟเฟกต์ wind/wall + ภาพ tex/wind_wall_fall + โมเดล mesh/wind_wall_*
# ใช้: python tools/wind-wall-gen.py แล้ว node tools/fx-check.js • ดูใน studio.html?fx=wind/wall
# Build the Yasuo-style curved wind wall (user ref 2026-10-27): vertical wind streaks flowing DOWN all the time,
# brighter at both ends, see-through middle, rounded top corners, a glowing ground line with curled ends showing the wall's range.
import json,math,random
from pathlib import Path
from PIL import Image,ImageFilter
ROOT=Path(__file__).resolve().parents[1]
def save(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=1),encoding='utf-8')

# ---- ภาพเส้นลมแนวตั้ง (ต่อบน-ล่างได้ ไหลลงด้วย uvScroll) ----
random.seed(7);W,H=1024,1024
img=Image.new('L',(W,H),0);px=img.load()
for _ in range(230):
    x=random.uniform(0,W);w=random.uniform(1.0,7.0);L=random.uniform(140,820);y0=random.uniform(0,H);b=random.uniform(.3,1.0)
    for dy in range(int(L)):
        t=dy/L;env=math.sin(math.pi*t)**.7*b
        y=int(y0+dy)%H
        for dx in range(int(-w*2),int(w*2)+1):
            xx=int(x+dx)%W;d=abs(dx)/w;a=env*(max(0,1-d)**1.6*.75+math.exp(-(d*2.2)**2)*.6)
            px[xx,y]=min(255,px[xx,y]+int(a*200))
img=img.filter(ImageFilter.GaussianBlur(.35))
rgba=Image.new('RGBA',(W,H),(255,255,255,0));rgba.putalpha(img)
rgba.save(ROOT/'assets/fx/tex/wind_wall_fall.png')
save(ROOT/'assets/fx/tex/wind_wall_fall.tex.json',{'v':1,'desc':'เส้นลมแนวตั้งต่อบน-ล่างได้ — ใช้กับกำแพงลม (uvScroll [0,-1] = ไหลลง)','gen':'image','seed':7,'px':1024,'cols':1,'rows':1,'kind':'loop','fps':24,'ramp':'white','add':True,'p':{}})

random.seed(9);TW,TH=1024,512
tip=Image.new('L',(TW,TH),0);tp=tip.load()
for _ in range(170):
    x=random.uniform(0,TW);w=random.uniform(1.2,6.5);top=random.uniform(.05,.75)*TH;b=random.uniform(.35,1)
    for y in range(int(top),TH):
        t=max(0,(y-top)/(TH-top));env=b*min(1,t*3.5)**1.4*(1-.25*t)
        for dx in range(int(-w*2),int(w*2)+1):
            xx=int(x+dx)%TW;d=abs(dx)/w;a=env*(max(0,1-d)**1.6*.75+math.exp(-(d*2.2)**2)*.6)
            tp[xx,y]=min(255,tp[xx,y]+int(a*190))
for y in range(TH):   # ด้านล่างสุดค่อย ๆ จาง (ซ้อนกับตัวกำแพงไม่ให้เห็นรอยต่อ)
    k=min(1,(TH-1-y)/(TH*.25))
    for x in range(TW):tp[x,y]=int(tp[x,y]*k)
tip=tip.filter(ImageFilter.GaussianBlur(.35))
rg=Image.new('RGBA',(TW,TH),(255,255,255,0));rg.putalpha(tip);rg.save(ROOT/'assets/fx/tex/wind_wall_tips.png')
save(ROOT/'assets/fx/tex/wind_wall_tips.tex.json',{'v':1,'desc':'ปลายเส้นลมยอดกำแพง สูงต่ำไม่เท่ากัน จางขึ้นบน (ห้ามเลื่อนแนวตั้ง)','gen':'image','seed':9,'px':1024,'cols':1,'rows':1,'kind':'loop','fps':24,'ramp':'white','add':True,'p':{}})

# ---- รูปทรง: ผนังโค้ง (ปลายสองข้างโค้งเข้าหาผู้ร่าย +z) ยอดมนตรงปลาย ----
R=10.9;AMAX=math.radians(35);HMAX=2.25   # กว้างรวม ~12.5 ม. = 250 หน่วยในเกม
def arc_wall(name,r,a0,a1,hmax,n=96,lift=0,seed=1):
    V=[];F=[];rg=random.Random(seed);jag=[rg.uniform(.62,1.12) for _ in range(n+1)]
    jag=[(jag[max(0,i-1)]+2*jag[i]+jag[min(n,i+1)])/4 for i in range(n+1)]
    for i in range(n+1):
        a=a0+(a1-a0)*i/n;x=r*math.sin(a);z=r*(1-math.cos(a))
        e=abs(a)/AMAX;h=hmax*jag[i]*max(.08,(1-e**6))**.5
        V+=[[round(x,4),lift,round(z,4)],[round(x,4),round(lift+h,4),round(z,4)]]
        if i<n:F.append([2*i,2*i+2,2*i+3,2*i+1])
    return {'id':name,'k':'poly','v':V,'f':F}
save(ROOT/'assets/fx/mesh/wind_wall_body.mesh.json',{'v':1,'desc':'กำแพงลมโค้ง (ผิวหลัก)','pal':'wind','mat':'solid','parts':[arc_wall('body',R,-AMAX,AMAX,HMAX,seed=2)]})
save(ROOT/'assets/fx/mesh/wind_wall_back.mesh.json',{'v':1,'desc':'กำแพงลมโค้ง (ชั้นหลัง)','pal':'wind','mat':'solid','parts':[arc_wall('back',R+.18,-AMAX,AMAX,HMAX*1.04,seed=5)]})
def arc_band(name,r,y0,y1,n=96):
    V=[];F=[]
    for i in range(n+1):
        a=-AMAX+2*AMAX*i/n;x=r*math.sin(a);z=r*(1-math.cos(a));e=abs(a)/AMAX;s=max(.08,(1-e**6))**.5
        V+=[[round(x,4),round(y0*s,4),round(z,4)],[round(x,4),round(y1*s,4),round(z,4)]]
        if i<n:F.append([2*i,2*i+2,2*i+3,2*i+1])
    return {'id':name,'k':'poly','v':V,'f':F}
save(ROOT/'assets/fx/mesh/wind_wall_tips.mesh.json',{'v':1,'desc':'แถบปลายเส้นลมยอดกำแพง','pal':'wind','mat':'solid','parts':[arc_band('tips',R+.04,1.35,3.7)]})
E=math.radians(8)
save(ROOT/'assets/fx/mesh/wind_wall_ends.mesh.json',{'v':1,'desc':'ปลายกำแพงสองข้าง (สว่าง)','pal':'wind','mat':'solid','parts':[arc_wall('endL',R-.06,-AMAX,-AMAX+E,HMAX,12),arc_wall('endR',R-.06,AMAX-E,AMAX,HMAX,12)]})
# เส้นพื้นบอกระยะ: โค้งตามกำแพง ปลายม้วนเข้า
def ground_path(r,curl):
    P=[]
    for i in range(29):
        a=-AMAX+2*AMAX*i/28;P.append([r*math.sin(a),.02,r*(1-math.cos(a))])
    def tail(s):
        a=s*AMAX;cx=r*math.sin(a);cz=r*(1-math.cos(a));out=[]
        for k in range(1,9):
            t=k/8;ang=t*math.pi*1.6;rr=curl*(1-t*.75)
            out.append([cx+s*(math.sin(ang)*rr*.8)+s*t*.25,.02,cz-(1-math.cos(ang))*rr])
        return out
    return [p for p in reversed(tail(-1))]+P+tail(1)
save(ROOT/'assets/fx/mesh/wind_wall_line.mesh.json',{'v':1,'desc':'เส้นพื้นบอกระยะกำแพงลม ปลายม้วน','pal':'wind','mat':'glow','parts':[
  {'id':'main','k':'ribbon','path':[[round(c,4) for c in p] for p in ground_path(R+.05,.55)],'w':.07,'seg':160},
  {'id':'thin','k':'ribbon','path':[[round(c,4) for c in p] for p in ground_path(R-.22,.3)],'w':.025,'seg':160}]})

# ---- เอฟเฟกต์ ----
DUR=6.0
grow={'0':[1,.02,1],'0.045':[1,1.08,1],'0.07':[1,1,1],'0.93':[1,1,1],'1':[1,.02,1]}
fade=lambda pk:{'0':0,'0.03':pk,'0.94':pk,'1':0}
L=[]
L.append({'id':'back','t':'mesh','at':0,'life':DUR,'att':'ground','shape':'model','model':'wind_wall_back','mat':'tex','tex':'tex/wind_wall_fall','col':'#4fd07a','col2':'#14663c','rim':0,'uvTile':[14,1.3],'uvScroll':[0,-1.5],'op':fade(.32),'scale':grow,'fade':0})
L.append({'id':'body','t':'mesh','at':0,'life':DUR,'att':'ground','shape':'model','model':'wind_wall_body','mat':'tex','tex':'tex/wind_wall_fall','col':'#c9fff0','col2':'#3aa58a','rim':0,'uvTile':[10,1],'uvScroll':[0,-1.0],'op':fade(.34),'scale':grow,'fade':0})
L.append({'id':'body2','t':'mesh','at':0,'life':DUR,'att':'ground','shape':'model','model':'wind_wall_body','mat':'tex','tex':'tex/wind_wall_fall','col':'#ffffff','col2':'#c9fff0','rim':0,'uvTile':[6,.8],'uvScroll':[.02,-.7],'op':fade(.12),'scale':grow,'fade':0})
L.append({'id':'tips','t':'mesh','at':0,'life':DUR,'att':'ground','shape':'model','model':'wind_wall_tips','mat':'tex','tex':'tex/wind_wall_tips','col':'#c9fff0','col2':'#4fd07a','rim':0,'uvTile':[7,1],'uvScroll':[.03,0],'op':fade(.5),'scale':grow,'fade':0})
L.append({'id':'tips2','t':'mesh','at':0,'life':DUR,'att':'ground','shape':'model','model':'wind_wall_tips','mat':'tex','tex':'tex/wind_wall_tips','col':'#4fd07a','col2':'#14663c','rim':0,'uvTile':[11,.9],'uvScroll':[-.02,0],'op':fade(.4),'scale':grow,'fade':0})
L.append({'id':'ends','t':'mesh','at':0,'life':DUR,'att':'ground','shape':'model','model':'wind_wall_ends','mat':'tex','tex':'tex/wind_wall_fall','col':'#ffffff','col2':'#c9fff0','rim':0,'uvTile':[3,1.1],'uvScroll':[0,-1.8],'op':fade(.6),'scale':grow,'fade':0})
L.append({'id':'line','t':'mesh','at':0,'life':DUR,'att':'ground','shape':'model','model':'wind_wall_line','mat':'glow','col':'#c9fff0','col2':'#4fd07a','op':{'0':0,'0.02':1,'0.94':1,'1':0},'scale':{'0':[.2,1,.2],'0.05':[1,1,1]},'fade':0})
# เศษลมร่วงลงตามกำแพง
for s,ph in [(-1,0),(1,.5)]:
    L.append({'id':f'wisp{"LR"[(s+1)//2]}','t':'emit','at':.15,'life':DUR-.4,'att':'ground','pos':[s*R*math.sin(AMAX*.92),2.6,R*(1-math.cos(AMAX*.92))],'rate':10,'from':'sphere','fr':.4,'dir':'down','speed':[1.2,2.4],'plife':[.4,.9],'look':'streak','size':[.5,1.1],'col':'#e6fff4','c2':'#4fd07a','gravity':0,'drag':.5,'curl':False})
L.append({'id':'wispM','t':'emit','at':.15,'life':DUR-.4,'att':'ground','from':'mesh','of':'body','rate':14,'dir':'down','speed':[1,2],'plife':[.5,1],'look':'streak','size':[.4,.9],'col':'#c9fff0','c2':'#3aa58a','gravity':0,'drag':.5,'curl':False})
# ตอนเกิด: วาบตามเส้นพื้น
L.append({'id':'rise','t':'emit','at':0,'life':.12,'att':'ground','from':'mesh','of':'line','burst':60,'rate':0,'dir':'up','speed':[3,6],'plife':[.25,.5],'look':'streak','size':[.8,1.6],'col':'#e6fff4','c2':'#4fd07a','gravity':0,'drag':2,'curl':False})
fx={'v':1,'desc':'กำแพงลม Aegis Gale — แบบกำแพงลม Yasuo (ผู้ใช้ 2026-10-27): ผนังโค้ง เส้นลมไหลลงตลอด ขอบสองข้างสว่าง กลางโปร่ง เส้นพื้นบอกระยะปลายม้วน','tags':['wind','wall','ground'],'pal':'wind','dur':DUR,'seed':11,'layers':L}
save(ROOT/'assets/fx/wind/wall.fx.json',fx)
print('wind/wall: Yasuo-style curved wall, 6 s')
