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
    x=random.uniform(0,TW);w=random.uniform(1.2,6.5);top=random.uniform(.12,.75)*TH;b=random.uniform(.35,1)
    for y in range(int(top),TH):
        t=max(0,(y-top)/(TH-top));env=b*min(1,t*3.5)**1.4*(1-.25*t)
        for dx in range(int(-w*2),int(w*2)+1):
            xx=int(x+dx)%TW;d=abs(dx)/w;a=env*(max(0,1-d)**1.6*.75+math.exp(-(d*2.2)**2)*.6)
            tp[xx,y]=min(255,tp[xx,y]+int(a*190))
for y in range(TH):   # ด้านล่างสุดค่อย ๆ จาง (ซ้อนกับตัวกำแพงไม่ให้เห็นรอยต่อ)
    k=min(1,(TH-1-y)/(TH*.25))*min(1,y/(TH*.22))**1.5   # บนสุดจางเป็น 0 = ไม่มีรอยตัดที่ยอด
    for x in range(TW):tp[x,y]=int(tp[x,y]*k)
tip=tip.filter(ImageFilter.GaussianBlur(.35))
rg=Image.new('RGBA',(TW,TH),(255,255,255,0));rg.putalpha(tip);rg.save(ROOT/'assets/fx/tex/wind_wall_tips.png')
save(ROOT/'assets/fx/tex/wind_wall_tips.tex.json',{'v':1,'desc':'ปลายเส้นลมยอดกำแพง สูงต่ำไม่เท่ากัน จางขึ้นบน (ห้ามเลื่อนแนวตั้ง)','gen':'image','seed':9,'px':1024,'cols':1,'rows':1,'kind':'loop','fps':24,'ramp':'white','add':True,'p':{}})

random.seed(13);CW,CH=1024,512
cur=Image.new('L',(CW,CH),0);cp=cur.load()
for _ in range(260):
    x=random.uniform(0,CW);w=random.uniform(1.0,6.0);top=random.uniform(.12,.8)*CH;b=random.uniform(.3,1)
    for y in range(int(top),CH):
        t=max(0,(y-top)/(CH-top));env=b*min(1,t*2.6)**1.5
        for dx in range(int(-w*2),int(w*2)+1):
            xx=int(x+dx)%CW;d=abs(dx)/w;a=env*(max(0,1-d)**1.6*.75+math.exp(-(d*2.2)**2)*.6)
            cp[xx,y]=min(255,cp[xx,y]+int(a*175))
for _ in range(420):   # เส้นบางคม (เส้นผมลม) ให้ดูละเอียด
    x=random.uniform(0,CW);top=random.uniform(.1,.85)*CH;b=random.uniform(.25,.8);wob=random.uniform(-1.5,1.5)
    for y in range(int(top),CH):
        t=max(0,(y-top)/(CH-top));xx=int(x+wob*t*6)%CW;env=b*min(1,t*3)**1.3
        cp[xx,y]=min(255,cp[xx,y]+int(env*150));cp[(xx+1)%CW,y]=min(255,cp[(xx+1)%CW,y]+int(env*55))
for _ in range(40):    # แผ่นจางกว้าง ให้ม่านมีเนื้อ
    x=random.uniform(0,CW);w=random.uniform(14,40);top=random.uniform(.25,.7)*CH;b=random.uniform(.12,.25)
    for y in range(int(top),CH):
        t=max(0,(y-top)/(CH-top));env=b*min(1,t*2)**1.2
        for dx in range(int(-w),int(w)+1):
            xx=int(x+dx)%CW;cp[xx,y]=min(255,cp[xx,y]+int(env*math.exp(-(dx/w*1.8)**2)*120))
for y in range(CH):
    k=min(1,y/(CH*.18))**1.5
    for x in range(CW):cp[x,y]=int(cp[x,y]*k)
cur=cur.filter(ImageFilter.GaussianBlur(.25))
rc=Image.new('RGBA',(CW,CH),(255,255,255,0));rc.putalpha(cur);rc.save(ROOT/'assets/fx/tex/wind_wall_curtain.png')
save(ROOT/'assets/fx/tex/wind_wall_curtain.tex.json',{'v':1,'desc':'ม่านเส้นลมกำแพง: เส้นตั้งจากพื้น ยอดสูงต่ำ จางหายก่อนขอบบน (เลื่อนแนวนอนได้ ห้ามเลื่อนแนวตั้ง)','gen':'image','seed':13,'px':1024,'cols':1,'rows':1,'kind':'loop','fps':24,'ramp':'white','add':True,'p':{}})

# ---- รูปทรง: ผนังโค้ง (ปลายสองข้างโค้งเข้าหาผู้ร่าย +z) ยอดมนตรงปลาย ----
R=10.9;AMAX=math.radians(35);HMAX=3.4   # กว้างรวม ~12.5 ม. = 250 หน่วยในเกม
def arc_wall(name,r,a0,a1,hmax,n=240,lift=0,seed=1):
    V=[];F=[];rg=random.Random(seed);jag=[1.0 for _ in range(n+1)]   # ยอดสูงต่ำมาจากภาพม่านแล้ว (ตัดรูปทรง = เห็นรอยตัด)
    for i in range(n+1):
        a=a0+(a1-a0)*i/n;x=r*math.sin(a);z=-r*math.cos(a)
        e=abs(a)/AMAX;h=hmax*jag[i]*max(.08,(1-e**6))**.5
        V+=[[round(x,4),lift,round(z,4)],[round(x,4),round(lift+h,4),round(z,4)]]
        if i<n:F.append([2*i,2*i+2,2*i+3,2*i+1])
    return {'id':name,'k':'poly','v':V,'f':F}
save(ROOT/'assets/fx/mesh/wind_wall_body.mesh.json',{'v':1,'desc':'กำแพงลมโค้ง (ผิวหลัก)','pal':'wind','mat':'solid','parts':[arc_wall('body',R,-AMAX,AMAX,HMAX,seed=2)]})
save(ROOT/'assets/fx/mesh/wind_wall_back.mesh.json',{'v':1,'desc':'กำแพงลมโค้ง (ชั้นหลัง)','pal':'wind','mat':'solid','parts':[arc_wall('back',R+.18,-AMAX,AMAX,HMAX*1.04,seed=5)]})
def arc_band(name,r,y0,y1,n=96,a0=None,a1=None):
    a0=-AMAX if a0 is None else a0;a1=AMAX if a1 is None else a1
    V=[];F=[]
    for i in range(n+1):
        a=a0+(a1-a0)*i/n;x=r*math.sin(a);z=-r*math.cos(a);e=abs(a)/AMAX;s=max(.08,(1-e**6))**.5
        V+=[[round(x,4),round(y0*s,4),round(z,4)],[round(x,4),round(y1*s,4),round(z,4)]]
        if i<n:F.append([2*i,2*i+2,2*i+3,2*i+1])
    return {'id':name,'k':'poly','v':V,'f':F}
NSEG=14;OVL=.35   # ช่วงซ้อนกันนิดหน่อย กันรอยต่อ
for s in range(NSEG):
    w=2*AMAX/NSEG;a0=-AMAX+s*w-w*OVL;a1=-AMAX+(s+1)*w+w*OVL
    save(ROOT/f'assets/fx/mesh/wind_wall_tips{s}.mesh.json',{'v':1,'desc':f'แถบปลายเส้นลมยอดกำแพง ช่วง {s}','pal':'wind','mat':'solid','parts':[arc_band('tips',R+.04+.01*(s%3),1.35,3.7,10,max(-AMAX,a0),min(AMAX,a1))]})
E=math.radians(8)
save(ROOT/'assets/fx/mesh/wind_wall_ends.mesh.json',{'v':1,'desc':'ปลายกำแพงสองข้าง (สว่าง)','pal':'wind','mat':'solid','parts':[arc_wall('endL',R-.06,-AMAX,-AMAX+E,HMAX,12),arc_wall('endR',R-.06,AMAX-E,AMAX,HMAX,12)]})
# เส้นพื้นบอกระยะ: โค้งตามกำแพง ปลายม้วนเข้า
def ground_path(r,curl):
    P=[]
    for i in range(29):
        a=-AMAX+2*AMAX*i/28;P.append([r*math.sin(a),.02,-r*math.cos(a)])
    def tail(s):
        a=s*AMAX;cx=r*math.sin(a);cz=-r*math.cos(a);out=[]
        for k in range(1,9):
            t=k/8;ang=t*math.pi*1.6;rr=curl*(1-t*.75)
            out.append([cx+s*(math.sin(ang)*rr*.8)+s*t*.25,.02,cz+(1-math.cos(ang))*rr])
        return out
    return [p for p in reversed(tail(-1))]+P+tail(1)
save(ROOT/'assets/fx/mesh/wind_wall_line.mesh.json',{'v':1,'desc':'เส้นพื้นบอกระยะกำแพงลม ปลายม้วน','pal':'wind','mat':'glow','parts':[
  {'id':'main','k':'ribbon','path':[[round(c,4) for c in p] for p in ground_path(R+.05,.55)],'w':.07,'seg':160},
  {'id':'thin','k':'ribbon','path':[[round(c,4) for c in p] for p in ground_path(R-.22,.3)],'w':.025,'seg':160}]})

# ---- เอฟเฟกต์ ----
DUR=6.0
grow={'0':[1,.02,1],'0.045':[1,1.08,1],'0.07':[1,1,1],'0.93':[1,1,1],'1':[1,.02,1]}
fade=lambda pk:{'0':0,'0.03':pk,'0.94':pk,'1':0}
def flick(seed,lo=.45,hi=.92,step=.22):
    rg=random.Random(seed);k={};t=0
    while t<=DUR+1e-6:
        v=rg.uniform(lo,hi)
        if rg.random()<.08:v=1.0          # แตะเพดานนาน ๆ ครั้ง
        u=round(t/DUR,4);g=min(1,t/.25)*(1 if t<DUR-.35 else max(.02,(DUR-t)/.35))
        k[str(u)]=[1,round(max(.02,v*g),3),1];t+=step*rg.uniform(.7,1.3)
    k['1']=[1,.02,1];return k
L=[]
L.append({'id':'back','t':'mesh','at':0,'life':DUR,'att':'ground','pos':[0,0,R],'shape':'model','model':'wind_wall_back','mat':'tex','tex':'tex/wind_wall_curtain','col':'#4fd07a','col2':'#14663c','rim':0,'uvTile':[72.0,.96],'uvScroll':[-.015,0],'op':fade(.32),'scale':flick(4,.8,1.0,.27),'fade':0})
L.append({'id':'body','t':'mesh','at':0,'life':DUR,'att':'ground','pos':[0,0,R],'shape':'model','model':'wind_wall_body','mat':'tex','tex':'tex/wind_wall_curtain','col':'#c9fff0','col2':'#3aa58a','rim':0,'uvTile':[51.4,.96],'uvScroll':[.01,0],'op':fade(.34),'scale':flick(3,.82,1.0,.3),'fade':0})
L.append({'id':'body2','t':'mesh','at':0,'life':DUR,'att':'ground','pos':[0,0,R],'shape':'model','model':'wind_wall_body','mat':'tex','tex':'tex/wind_wall_curtain','col':'#ffffff','col2':'#c9fff0','rim':0,'uvTile':[30.9,.96],'uvScroll':[.02,0],'op':fade(.12),'scale':grow,'fade':0})
# ยอดเส้นลมขยับขึ้นลงตลอดเหมือนเปลวไฟ (ผู้ใช้ 2026-10-27): 6 ชั้นปลายเส้น แต่ละชั้นสูง-ต่ำสุ่มคนละจังหวะ แตะเพดานนาน ๆ ครั้ง
for j,(col,c2,tile,sx,pk) in enumerate([('#c9fff0','#4fd07a',[7,1],.03,.45),('#4fd07a','#14663c',[11,.9],-.02,.38),('#ffffff','#c9fff0',[5,1],.05,.3),
                                         ('#7fe8b0','#2fae5e',[9,1.1],-.04,.36),('#c9fff0','#3aa58a',[13,.95],.02,.32),('#4fd07a','#14663c',[6,1.05],-.03,.34)]):
  for s in range(NSEG):
    L.append({'id':f'tips{j}_{s}','t':'mesh','at':0,'life':DUR,'att':'ground','pos':[0,0,R],'shape':'model','model':f'wind_wall_tips{s}','mat':'tex','tex':'tex/wind_wall_tips','col':col,'col2':c2,'rim':0,'uvTile':[round(tile[0]*360/70,1),tile[1]],'uvScroll':[sx,0],'op':fade(pk),'scale':flick(31+j*7+s*101,step=.16+.05*((j+s)%4)),'fade':0})
L.append({'id':'ends','t':'mesh','at':0,'life':DUR,'att':'ground','pos':[0,0,R],'shape':'model','model':'wind_wall_ends','mat':'tex','tex':'tex/wind_wall_curtain','col':'#ffffff','col2':'#c9fff0','rim':0,'uvTile':[15.4,.96],'uvScroll':[.03,0],'op':fade(.6),'scale':grow,'fade':0})
L.append({'id':'line','t':'mesh','at':0,'life':DUR,'att':'ground','pos':[0,0,R],'shape':'model','model':'wind_wall_line','mat':'glow','col':'#c9fff0','col2':'#4fd07a','op':{'0':0,'0.02':1,'0.94':1,'1':0},'scale':{'0':[.2,1,.2],'0.05':[1,1,1]},'fade':0})
# เศษลมร่วงลงตามกำแพง
for s,ph in [(-1,0),(1,.5)]:
    L.append({'id':f'wisp{"LR"[(s+1)//2]}','t':'emit','at':.15,'life':DUR-.4,'att':'ground','pos':[s*R*math.sin(AMAX*.92),2.6,0],'rate':10,'from':'sphere','fr':.4,'dir':'down','speed':[1.2,2.4],'plife':[.4,.9],'look':'streak','size':[.5,1.1],'col':'#e6fff4','c2':'#4fd07a','gravity':0,'drag':.5,'curl':False})
for j,(col,c2,rate) in enumerate([('#e6fff4','#4fd07a',70),('#4fd07a','#14663c',55)]):
    L.append({'id':f'fall{j}','t':'emit','at':.1,'life':DUR-.35,'att':'ground','pos':[0,0,R],'from':'mesh','of':'body','rate':rate,'dir':'down','speed':[2.6,4.2],'plife':[.35,.75],'look':'streak','size':[1.6,3.2],'col':col,'c2':c2,'gravity':0,'drag':0,'curl':False})
L.append({'id':'wispM','t':'emit','at':.15,'life':DUR-.4,'att':'ground','from':'mesh','of':'body','rate':14,'dir':'down','speed':[1,2],'plife':[.5,1],'look':'streak','size':[.4,.9],'col':'#c9fff0','c2':'#3aa58a','gravity':0,'drag':.5,'curl':False})
# ลมวนรอบกำแพง (ผู้ใช้ 2026-10-27 "add abit effect like wind around"): สโตรกลมเล็กวิ่งเลียบหน้ากำแพงไปมา + เศษลมลอยตาม
rgw=random.Random(21)
for j in range(9):
    s=1 if j%2 else -1;y=rgw.uniform(.5,2.6);a0=-s*AMAX*1.05;a1=s*AMAX*1.05;off=rgw.choice([-.55,.45])
    pts={}
    for k in range(7):
        u=k/6;a=a0+(a1-a0)*u;rr=R+off+.15*math.sin(u*6.3+j)
        pts[str(round(u,3))]=[round(rr*math.sin(a),3),round(y+.35*math.sin(u*9+j*1.7),3),round(-rr*math.cos(a)+R,3)]
    L.append({'id':f'gust{j}','t':'mesh','at':.3+j*.55,'life':round(min(DUR-.35-(.3+j*.55),1.6+rgw.uniform(0,.6)),2),'loop':True,'att':'ground','shape':'model','model':f'wind_pieces{j%3}','mat':'tex','tex':'tex/wind_swoosh_a_hi' if j%3 else 'tex/wind_swoosh_b',
        'col':'#e6fff4' if j%2 else '#7fe8b0','col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],'pos':pts,'rot':[0,0,90],'scale':[.35,.18,.35],'spin':s*420,'op':{'0':0,'0.15':.55,'0.8':.45,'1':0},'fade':0})
L.append({'id':'drift','t':'emit','at':.2,'life':DUR-.5,'att':'ground','pos':[0,0,R],'from':'mesh','of':'body','rate':18,'dir':'random','speed':[.6,1.6],'plife':[.8,1.6],'look':'streak','size':[.3,.6],'col':'#e6fff4','c2':'#4fd07a','gravity':0,'drag':.8,'curl':True})
# ตอนเกิด: วาบตามเส้นพื้น
L.append({'id':'rise','t':'emit','at':0,'life':.12,'att':'ground','from':'mesh','of':'line','burst':60,'rate':0,'dir':'up','speed':[3,6],'plife':[.25,.5],'look':'streak','size':[.8,1.6],'col':'#e6fff4','c2':'#4fd07a','gravity':0,'drag':2,'curl':False})
fx={'v':1,'desc':'กำแพงลม Aegis Gale — แบบกำแพงลม Yasuo (ผู้ใช้ 2026-10-27): ผนังโค้ง เส้นลมไหลลงตลอด ขอบสองข้างสว่าง กลางโปร่ง เส้นพื้นบอกระยะปลายม้วน','tags':['wind','wall','ground'],'pal':'wind','dur':DUR,'seed':11,'layers':L}
save(ROOT/'assets/fx/wind/wall.fx.json',fx)
print('wind/wall: Yasuo-style curved wall, 6 s')
