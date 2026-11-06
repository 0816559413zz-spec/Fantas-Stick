# Aegis Gale — variant C "ม่านลมโค้ง" (curtain wall, user 2026-11-06: "อยากให้นายลองทำ กำแพงลมแบบนี้ ... มาให้ดูก่อน", ref = a game wind-wall screenshot)
# Studio candidate only — NOT bound in game (the game uses variant A wind/aegis_*).
# Look: one wide curved, slightly barrel-shaped curtain of SOFT wide vertical streaks rising from the ground, brighter low at the two sides,
# fading upward, see-through; a thin pale-green line with curled ends on the ground at its base. Same size/shape as the A wall
# (12.5 m chord, 5.4 m, middle bulges away from the caster). Palette kept wind white + mint/green (not the ref's blue/gold).
# Run: python tools/wind-aegis-c-gen.py  (re-runs tools/wind-aegis-sb-gen.py first for shared helpers)  then node tools/fx-check.js
# Files: wind/aegis_c_wall (12 s, rise+hold+fade) • wind/aegis_c_hit (enemy pushed into it) • wind/aegis_c_break
#        wind/aegis_sb_c (studio demo: aim → cast → rise → hold → hit → break, caster at 0, wall at 10.5 m)
#        wind/aegis_sb_a2 (same demo timeline with the in-game A pieces, for side-by-side comparison)
import math,random,runpy,copy
from pathlib import Path
from PIL import Image,ImageChops,ImageFilter
ROOT=Path(__file__).resolve().parents[1]
NS=runpy.run_path(str(ROOT/'tools/wind-aegis-sb-gen.py'))
save,r3,RAD,AMAX,HALF,URep=NS['save'],NS['r3'],NS['RAD'],NS['AMAX'],NS['HALF'],NS['URep']
WHITE,GREEN,TZ=NS['WHITE'],NS['GREEN'],NS['TZ']
WHG=5.4;ZC=round(-RAD,3);WALL=12.0
MINT='#e6fff4';SOFTG='#b8ffcf'

# ---------------------------------------------------------------- texture: soft wide rising streaks (4×4 seamless flipbook)
def veil_field(W,H,seed):
    rg=random.Random(seed);img=Image.new('L',(W,H),0);px=img.load()
    def strand(x0,w,b,amp,ph,L,y0):
        for dy in range(int(L)):
            t=dy/L;env=math.sin(math.pi*t)**1.1*b;y=int(y0+dy)%H
            x=x0+amp*math.sin(2*math.pi*y/H+ph)
            for dx in range(int(-w*2.2),int(w*2.2)+1):
                d=abs(dx)/w;a=env*math.exp(-(d*1.3)**2)
                xx=int(x+dx)%W;px[xx,y]=min(255,px[xx,y]+int(a*120))
    for _ in range(13):strand(rg.uniform(0,W),rg.uniform(7,16),rg.uniform(.5,1),rg.uniform(2,7),rg.uniform(0,6.3),rg.uniform(.55,1)*H,rg.uniform(0,H))
    for _ in range(10):strand(rg.uniform(0,W),rg.uniform(2.5,5),rg.uniform(.6,1),rg.uniform(2,6),rg.uniform(0,6.3),rg.uniform(.4,.8)*H,rg.uniform(0,H))
    return img.filter(ImageFilter.GaussianBlur(1.6))
def make_veil():
    FW,FH,C,R=256,384,4,4;N=C*R;field=veil_field(FW,FH,57)
    mask=Image.new('L',(FW,FH),0);mp=mask.load()
    for y in range(FH):
        v=1-y/(FH-1);k=(.55+.45*min(1,v/.25))*min(1,(1-v)/.55)**1.5   # strong low, long soft fade upward (ref)
        for x in range(FW):mp[x,y]=int(255*min(1,k))
    atlas=Image.new('RGBA',(FW*C,FH*R),(255,255,255,0))
    for f in range(N):
        fr=ImageChops.offset(field,0,-int(round(f*FH/N)));tile=Image.new('RGBA',(FW,FH),(255,255,255,0));tile.putalpha(ImageChops.multiply(fr,mask))
        atlas.paste(tile,((f%C)*FW,(f//C)*FH))
    atlas.save(ROOT/'assets/fx/tex/wind_air_veil.png',optimize=True)
    save(ROOT/'assets/fx/tex/wind_air_veil.tex.json',{'v':1,'desc':'ม่านลมนุ่ม: เส้นลมกว้างฟุ้งแนวตั้งลอยขึ้น (flipbook 4×4 วนต่อเนื่อง) สว่างล่าง จางขึ้นบน — กำแพงลมแบบ C','gen':'image','seed':57,'px':FW,'cols':C,'rows':R,'kind':'loop','fps':10,'ramp':'white','add':True,'p':{}})
make_veil()

# ---------------------------------------------------------------- meshes: barrel curtain + base line with curls
def barrel(pid,r,h,bulge,n=96,rows=8):
    """arc around the origin (middle at z=+r); rows up the height bow outward (+r) by `bulge` at mid height; top corners rounded."""
    V=[];F=[]
    for i in range(n+1):
        a=-AMAX+2*AMAX*i/n;e=abs(i/n*2-1);hk=max(.12,1-e**5)**.45
        for j in range(rows+1):
            v=j/rows;rr=r+bulge*math.sin(math.pi*v)*(1-.6*e**2)
            V.append([round(rr*math.sin(a),4),round(h*hk*v,4),round(rr*math.cos(a),4)])
    for i in range(n):
        for j in range(rows):
            q=i*(rows+1)+j;F.append([q,q+rows+1,q+rows+2,q+1])
    return {'id':pid,'k':'poly','v':V,'f':F}
save(ROOT/'assets/fx/mesh/wind_aegis_curtain.mesh.json',{'v':1,'desc':'Aegis Gale แบบ C: ม่านโค้งทรงถังเล็กน้อย (โป่งกลางความสูง) ยอดมุมมน สูง 1 กว้าง 12.5 ม. จุดศูนย์กลางวงโค้ง = จุด 0','pal':'wind','mat':'solid',
    'parts':[barrel('front',RAD,1.0,.45),barrel('back',RAD-.3,.94,.3)]})
def cline(r,curl):
    P=[[r*math.sin(-AMAX+2*AMAX*i/40),.03,r*math.cos(-AMAX+2*AMAX*i/40)] for i in range(41)]
    def tail(s):
        a=s*AMAX;cx,cz=r*math.sin(a),r*math.cos(a);out=[]
        for k in range(1,11):
            t=k/10;ang=t*math.pi*1.7;rr=curl*(1-t*.7)
            out.append([cx+s*(math.sin(ang)*rr*.8+t*.2),.03,cz-(1-math.cos(ang))*rr])   # curls back toward the caster side
        return out
    return [r3(p) for p in list(reversed(tail(-1)))+P+tail(1)]
save(ROOT/'assets/fx/mesh/wind_aegis_cline.mesh.json',{'v':1,'desc':'Aegis Gale แบบ C: เส้นบางบนพื้นตามฐานม่าน ปลายสองข้างม้วน','pal':'wind','mat':'glow','parts':[
    {'id':'main','k':'ribbon','path':cline(RAD+.05,.55),'w':.06,'seg':180},{'id':'thin','k':'ribbon','path':cline(RAD-.2,.32),'w':.025,'seg':180}]})

# ---------------------------------------------------------------- effects (event frame: wall middle at the event point, +z = away from the caster)
def veil(lid,life,col,reps,scroll,op,dz=0,sc=None,at=0,loop=False,tex='tex/wind_air_veil'):
    return {'id':lid,'t':'mesh','at':at,'life':life,'loop':loop,'att':'ground','shape':'model','model':'wind_aegis_curtain','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,
        'uvTile':[URep(reps),1],'uvScroll':scroll,'pos':[0,0,round(ZC+dz,3)],'scale':sc if sc is not None else [1,WHG,1],'op':op,'fade':0}
def g_c_wall(dur=WALL):
    U=lambda t:str(round(t/dur,4));L=[]
    rise={'0':[1,.04*WHG,1],U(.12):[1,.4*WHG,1],U(.38):[1,1.02*WHG,1],U(.5):[1,WHG,1],U(dur-.4):[1,WHG,1],'1':[1,1.08*WHG,1]}   # grows up from the ground, at the end drifts up
    op=lambda pk:{'0':0,U(.1):pk,U(dur-.4):pk,'1':0}
    L.append(veil('veil',dur,WHITE,2.2,[.015,0],op(.6),sc=rise))
    L.append(veil('veil2',dur,MINT,1.4,[-.02,0],op(.32),dz=-.3,sc=rise))
    L.append(veil('tint',dur,GREEN,1.1,[.01,0],op(.14),dz=.25,sc=rise))
    L.append(veil('hair',dur,WHITE,1.3,[.02,0],op(.22),dz=.1,sc=rise,tex='tex/wind_air_rise'))   # a few thin lines for detail
    L.append({'id':'line','t':'mesh','at':0,'life':dur,'att':'ground','pos':[0,0,ZC],'shape':'model','model':'wind_aegis_cline','mat':'glow','col':SOFTG,'col2':GREEN,
        'op':{'0':0,U(.08):.75,U(dur-.4):.75,'1':0},'scale':{'0':[.15,1,1],U(.3):[1,1,1]},'fade':0})
    L.append({'id':'up','t':'emit','at':0,'life':.35,'att':'ground','pos':[0,0,ZC],'from':'mesh','of':'line','rate':160,'dir':'up','speed':[5,9],'plife':[.3,.6],'look':'streak','size':[1.4,2.8],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1.2,'curl':False})
    L.append({'id':'wisp','t':'emit','at':.4,'life':dur-.8,'att':'ground','pos':[0,0,ZC],'from':'mesh','of':'veil','rate':14,'dir':'up','speed':[1.5,3],'plife':[.6,1.1],'look':'streak','size':[1.2,2.4],'col':MINT,'c2':GREEN,'gravity':0,'drag':.3,'curl':False})
    L.append({'id':'base','t':'emit','at':.3,'life':dur-.7,'att':'ground','pos':[0,.05,ZC],'from':'mesh','of':'line','rate':6,'dir':'flat','speed':[.4,1],'up':[.05,.3],'plife':[1,1.6],
        'look':'smoke','size':[3,5],'grow':.4,'col':'#e3ddcb','c2':'#bdb39c','gravity':0,'drag':1,'curl':True,'fin':14,'x':True})
    L.append({'id':'haze','t':'warp','at':.2,'life':dur-.4,'att':'ground','pos':[0,WHG*.45,0],'kind':'haze','size':7,'str':.4,'op':{'0':0,'0.05':1,'0.95':1,'1':0},'col':WHITE,'glow':0,'x':True})
    L.append({'id':'lift','t':'emit','at':dur-.4,'life':.15,'att':'ground','pos':[0,0,ZC],'from':'mesh','of':'veil','burst':40,'rate':0,'dir':'up','speed':[2,4],'plife':[.4,.8],'look':'streak','size':[1.2,2.2],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1,'curl':True})
    return {'v':1,'desc':'กำแพงลม แบบ C "ม่านลมโค้ง" (ตัวเลือกให้ผู้ใช้ดู ยังไม่ใส่เกม): ม่านโค้งเส้นลมนุ่มกว้างลอยขึ้นจากพื้น สว่างล่าง จางขึ้นบน โปร่ง + เส้นบางบนพื้นปลายม้วน • 12.5 × 5.4 ม. ขาว/มิ้นต์/เขียว','tags':['wind','wall','ground'],'pal':'wind','dur':dur,'seed':21,'layers':L}
def g_c_hit():
    # event frame like wind/wall_hit: at the enemy, the wall is at −z (enemy pushed into it)
    L=[]
    L.append({'id':'patch','t':'mesh','at':0,'life':.45,'att':'ground','shape':'plane','mat':'tex','tex':'tex/wind_air_veil','col':WHITE,'col2':'#000000','rim':0,'uvTile':[.35,1],'uvScroll':[0,0],
        'pos':[0,1.6,-.45],'scale':{'0':[1.2,3,1],'0.3':[2.6,3.4,1],'1':[3.2,3.8,1]},'op':{'0':0,'0.1':.95,'1':0},'fade':0})
    L.append({'id':'spray','t':'emit','at':0,'life':.05,'att':'ground','pos':[0,1,-.4],'burst':26,'rate':0,'from':'sphere','fr':.3,'dir':'up','spread':.7,'speed':[4,8],'plife':[.25,.5],'look':'streak','size':[1.2,2.4],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1.5,'curl':False})
    L.append({'id':'side','t':'emit','at':0,'life':.05,'att':'ground','pos':[0,1,-.4],'burst':16,'rate':0,'from':'sphere','fr':.3,'dir':'flat','speed':[3,5],'up':[0,.5],'plife':[.25,.45],'look':'streak','size':[1,2],'col':MINT,'c2':GREEN,'gravity':0,'drag':2,'curl':True})
    L.append({'id':'shock','t':'warp','at':0,'life':.3,'att':'ground','pos':[0,1,-.35],'kind':'shock','size':{'0':.4,'1':2.4},'str':.7,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    L.append({'id':'dust','t':'emit','at':0,'life':.06,'att':'ground','pos':[0,.05,-.2],'burst':8,'rate':0,'from':'disc','fr':.4,'dir':'flat','speed':[1.5,3],'up':[.2,.6],'plife':[.6,1],'look':'smoke','size':[3,5],'grow':.5,'col':'#ddd6c3','c2':'#b3aa92','gravity':0,'drag':2,'curl':True,'fin':10})
    L.append({'id':'shake','t':'screen','at':0,'life':.12,'shake':2})
    return {'v':1,'desc':'กำแพงลม แบบ C: ศัตรูถูกผลักชนม่าน — ม่านสว่างวาบตรงจุดชน + เส้นลมพุ่งขึ้น/แตกข้าง + อากาศบิดวงเล็ก + ฝุ่น (วางที่ตัวศัตรู หัน −z เข้ากำแพง)','tags':['wind','wall','hit'],'pal':'wind','dur':.6,'seed':5,'layers':L}
def g_c_break():
    L=[veil('flare',.18,WHITE,2.6,[0,0],{'0':.8,'0.6':1,'1':0},sc={'0':[1,WHG,1],'1':[1.02,WHG*1.1,1.02]})]
    for j,(col,dz,dy,dl) in enumerate([(WHITE,6,1.25,0),(MINT,9,1.5,.05)]):
        b=veil(f'blow{j}',.6,col,2,[0,-1.2],{'0':.8,'0.4':.55,'1':0},at=round(.12+dl,2),sc={'0':[1,WHG,1],'0.4':[1.15,WHG*dy,1.15],'1':[1.4,WHG*dy*1.1,1.4]})
        b['pos']={'0':[0,0,ZC],'1':[0,0,round(ZC+dz,2)],'ease':'out'};L.append(b)
    L.append({'id':'shards','t':'emit','at':.12,'life':.05,'att':'ground','pos':[0,0,ZC],'from':'mesh','of':'flare','burst':70,'rate':0,'dir':'aim','yaw':0,'spread':.9,'speed':[6,12],'up':[1,4],'plife':[.4,.8],'look':'streak','size':[1.4,3],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1.4,'curl':False})
    L.append({'id':'dust','t':'emit','at':.12,'life':.08,'att':'ground','pos':[0,.05,ZC],'from':'mesh','of':'flare','burst':12,'rate':0,'dir':'aim','yaw':0,'spread':1,'speed':[3,7],'up':[.3,1.2],'plife':[.6,1.1],'look':'smoke','size':[3,5],'grow':.5,'col':'#ddd6c3','c2':'#b3aa92','gravity':0,'drag':1.6,'curl':True,'fin':10})
    L.append({'id':'shock','t':'warp','at':.12,'life':.45,'att':'ground','pos':[0,.1,1.5],'kind':'shock','flat':True,'size':{'0':1,'1':13},'str':1.2,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    L.append({'id':'shake','t':'screen','at':.12,'life':.3,'shake':6,'flash':.03,'fcol':'#e6fff4'})
    return {'v':1,'desc':'กำแพงลม แบบ C แตก: ม่านสว่างวาบสั้น แล้วถูกพัดพุ่งออกด้านหน้าและลอยสูงขึ้นจาง + เส้นลมแตกกระจาย + ฝุ่น + คลื่นอากาศบิดบนพื้น','tags':['wind','wall','break'],'pal':'wind','dur':1.2,'seed':7,'layers':L}
save(ROOT/'assets/fx/wind/aegis_c_wall.fx.json',g_c_wall())
save(ROOT/'assets/fx/wind/aegis_c_hit.fx.json',g_c_hit())
save(ROOT/'assets/fx/wind/aegis_c_break.fx.json',g_c_break())

# ---------------------------------------------------------------- studio demos (caster at 0 facing +z, wall middle at TZ)
# timeline: aim 0–1.4 • cast 1.4 • rise 1.5–2.1 • hold … • enemy hits at 3.6 • break at 5.4 • end 6.8
TA,TC,TW,TH,TB,DUR=0,1.4,1.5,3.6,5.4,6.8
def shift(L,t0,dz,pre,life=None):
    L=copy.deepcopy(L);ids={l['id'] for l in L}
    for l in L:
        l['id']=pre+l['id'];l['at']=round(l.get('at',0)+t0,3)
        if l.get('of') in ids:l['of']=pre+l['of']
        if l.get('loop'):l['loop']=False;l['life']=life
        p=l.get('pos')
        if isinstance(p,list):l['pos']=[p[0],p[1],round(p[2]+dz,3)]
        elif isinstance(p,dict):l['pos']={k:([v[0],v[1],round(v[2]+dz,3)] if isinstance(v,list) else v) for k,v in p.items()}
        elif p is None and l['t'] not in ('screen','sound'):l['pos']=[0,0,dz]
    return [l for l in L if l['t']!='screen']
def demo(wall,brk,hitfx,name,desc):
    L=shift(NS['g_aim']()['layers'],TA,0,'aim_',life=TC-TA)
    L+=shift(NS['g_cast']()['layers'],TC,0,'cast_')
    L+=shift(wall['layers'],TW,TZ,'w_')
    L+=shift(brk['layers'],TB,TZ,'b_')
    L.append({'id':'hit','t':'use','at':TH,'life':.6,'att':'ground','fx':hitfx,'pos':[1.6,0,round(TZ+.7,2)],'yaw':180})
    L.append({'id':'hit2','t':'use','at':TH+.25,'life':.6,'att':'ground','fx':hitfx,'pos':[-2.4,0,round(TZ+.5,2)],'yaw':180})
    save(ROOT/f'assets/fx/wind/{name}.fx.json',{'v':1,'desc':desc,'tags':['wind','wall','storyboard'],'pal':'wind','dur':DUR,'seed':16,'layers':L})
demo(g_c_wall(TB-TW+.15),g_c_break(),'wind/aegis_c_hit','aegis_sb_c','สตูดิโอเดโม กำแพงลมแบบ C "ม่านลมโค้ง": เล็ง → ปล่อย → ม่านลอยขึ้น → ค้าง → ศัตรูชน 2 ครั้ง → แตก (เทียบกับ wind/aegis_sb_a2)')
NS['WALL']=TB-TW+.15   # A in-game wall builder reads the global WALL
gw=NS['g_wall'];gw.__globals__['WALL']=TB-TW+.15
demo(gw(),NS['g_break'](),'wind/wall_hit','aegis_sb_a2','สตูดิโอเดโม กำแพงลมแบบ A (ที่ใช้ในเกม) ไทม์ไลน์เดียวกับ wind/aegis_sb_c ไว้เทียบ: เล็ง → ปล่อย → ตั้งกำแพง → ค้าง → ศัตรูชน → แตก')
gw.__globals__['WALL']=12.0
print('wind/aegis_c_wall|hit|break + demos wind/aegis_sb_c, wind/aegis_sb_a2')
