# Aegis Gale — storyboard #16 (สายลม) demo: 2 แบบ ลมสมจริง ไม่เยอะ (ผู้ใช้ 2026-11-04 "เน้นให้เป็นลมแบบสมจริง")
# ใช้: python tools/wind-aegis-sb-gen.py แล้ว node tools/fx-check.js
# ดู: studio.html?fx=wind/aegis_sb_a  /  wind/aegis_sb_b   (at=self: ผู้ร่ายที่ 0, เป้าห่าง 5 ตัว ≈ 10.5 ม. ทาง +z)
# Sketch (sb-16 frames): air streaks leave the caster → a low curved wave front (bulging toward the target, ends trailing back)
# rolls forward → at the target it stands up into a curved wall of wavy vertical wind lines.
# Timing = board shots: 1 aim/gather 0–3 • 2 release 3–3.2 • 3 travel 3.2–3.5 • 4 impact 3.5–3.9 • 5 linger 3.9–6.9 • 6 fade 6.9–7.2
# New textures (made here): tex/wind_air_rise (flipbook 4×4, wavy lines rising, fades at the top, loops seamlessly)
#                           tex/wind_air_band (soft translucent band + thin bright lines, like the user's ref picture)
# New meshes: mesh/wind_aegis_arc (curved wall, bulge toward +z), mesh/wind_aegis_flow (ground streamlines caster → front)
import json,math,random
from pathlib import Path
from PIL import Image,ImageFilter,ImageChops
ROOT=Path(__file__).resolve().parents[1]
def save(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=1),encoding='utf-8')
def r3(v):return [round(c,3) for c in v]

# ---------------------------------------------------------------- textures
def rise_field(W,H,seed):
    """v-tileable field of thin wavy vertical lines + soft haze columns (grey L image)."""
    rg=random.Random(seed);img=Image.new('L',(W,H),0);px=img.load()
    def strand(x0,w,b,amp,freq,ph,L,y0,soft):
        for dy in range(int(L)):
            t=dy/L;env=math.sin(math.pi*t)**.8*b
            y=int(y0+dy)%H
            x=x0+amp*math.sin(2*math.pi*(y/H*freq)+ph)          # wave tied to y → tiles in v
            for dx in range(int(-w*2.5),int(w*2.5)+1):
                xx=int(x+dx)%W;d=abs(dx)/w
                a=env*(math.exp(-(d*1.6)**2) if soft else (max(0,1-d)**1.5*.7+math.exp(-(d*2.4)**2)*.5))
                px[xx,y]=min(255,px[xx,y]+int(a*(90 if soft else 255)))
    for _ in range(22):  # soft haze columns (body of moving air)
        strand(rg.uniform(0,W),rg.uniform(16,34),rg.uniform(.3,.5),rg.uniform(4,14),rg.choice([1,2]),rg.uniform(0,6.3),rg.uniform(.5,1)*H,rg.uniform(0,H),True)
    for _ in range(22):  # thin wavy lines (the "hair" of the wind) — few, long, lazy waves (not grass)
        strand(rg.uniform(0,W),rg.uniform(1.4,3.6),rg.uniform(.35,1),rg.uniform(8,22),rg.choice([1,1,2]),rg.uniform(0,6.3),rg.uniform(.45,.9)*H,rg.uniform(0,H),False)
    return img.filter(ImageFilter.GaussianBlur(.6))

def make_rise():
    FW,FH,C,R=384,384,4,4;N=C*R
    field=rise_field(FW,FH,31)
    mask=Image.new('L',(FW,FH),0);mp=mask.load()
    for y in range(FH):            # y=0 top of image = top of wall: fade out top 45 %, soft at the very base
        v=1-y/(FH-1);k=(.3+.7*min(1,v/.35)**1.2)*min(1,(1-v)/.45)**1.3   # dim base, fullest at ~40–55 %, soft fade at the top (not grass tufts)
        for x in range(FW):mp[x,y]=int(255*min(1,k))
    atlas=Image.new('RGBA',(FW*C,FH*R),(255,255,255,0))
    for f in range(N):
        sh=int(round(f*FH/N))                 # streaks move UP one image height per loop
        fr=ImageChops.offset(field,0,-sh)
        a=ImageChops.multiply(fr,mask)
        tile=Image.new('RGBA',(FW,FH),(255,255,255,0));tile.putalpha(a)
        atlas.paste(tile,((f%C)*FW,(f//C)*FH))
    atlas.save(ROOT/'assets/fx/tex/wind_air_rise.png',optimize=True)
    save(ROOT/'assets/fx/tex/wind_air_rise.tex.json',{'v':1,'desc':'เส้นลมบางคลื่นไหวลอยขึ้น (flipbook 4×4 วนต่อเนื่อง) จางที่ยอด — กำแพงลม Aegis Gale แบบสมจริง (sb #16)','gen':'image','seed':31,'px':FW,'cols':C,'rows':R,'kind':'loop','fps':12,'ramp':'white','add':True,'p':{}})

def make_band():
    """u-tileable soft translucent band with a few thin bright lines (ref picture look); fades top+bottom."""
    W,H=1024,256;rg=random.Random(41);img=Image.new('L',(W,H),0);px=img.load()
    def line(yc,w,b,amp,fq,ph,soft):
        for x in range(W):
            y=yc+amp*math.sin(2*math.pi*x/W*fq+ph)
            for dy in range(int(-w*2.5),int(w*2.5)+1):
                yy=int(y+dy)
                if 0<=yy<H:
                    d=abs(dy)/w;a=b*(math.exp(-(d*1.5)**2) if soft else max(0,1-d)**1.5)
                    px[x,yy]=min(255,px[x,yy]+int(a*(80 if soft else 200)))
    for _ in range(5):line(rg.uniform(.3,.7)*H,rg.uniform(22,40),rg.uniform(.4,.7),rg.uniform(4,14),rg.choice([1,2]),rg.uniform(0,6.3),True)
    for _ in range(16):line(rg.uniform(.15,.85)*H,rg.uniform(.8,2.2),rg.uniform(.3,1),rg.uniform(3,16),rg.choice([1,2,3]),rg.uniform(0,6.3),False)
    img=img.filter(ImageFilter.GaussianBlur(.6))
    # lines break up along u (gaps) so it reads as moving air, not tubes
    gap=Image.new('L',(W,H),0);gp=gap.load()
    for x in range(W):
        g=.55+.45*math.sin(2*math.pi*x/W*3+1.3)*math.sin(2*math.pi*x/W*5+.4)
        for y in range(H):
            e=math.sin(math.pi*y/(H-1))**1.2;gp[x,y]=int(255*max(0,min(1,g))*e)
    img=ImageChops.multiply(img,gap)
    rgba=Image.new('RGBA',(W,H),(255,255,255,0));rgba.putalpha(img);rgba.save(ROOT/'assets/fx/tex/wind_air_band.png',optimize=True)
    save(ROOT/'assets/fx/tex/wind_air_band.tex.json',{'v':1,'desc':'แถบลมโปร่งนุ่ม + เส้นบางสว่าง (แบบรูปตัวอย่างผู้ใช้ sb #16) ต่อซ้าย-ขวาได้ เลื่อน u = ลมไหล','gen':'image','seed':41,'px':W,'cols':1,'rows':1,'kind':'loop','fps':24,'ramp':'white','add':True,'p':{}})

make_rise();make_band()

# ---------------------------------------------------------------- meshes
TZ=10.5                      # target distance (5 characters)
HALF=6.25                    # game wall half length L=125 → 6.25 m
AMAX=math.radians(32);RAD=HALF/math.sin(AMAX)   # arc radius so the chord = 12.5 m
def arc_pts(r,a0,a1,n):
    """arc around the local origin (= circle centre, UV u follows the angle); middle at z=+r, ends curve BACK toward the caster.
    Layers put pos z = (wanted middle z) − RAD."""
    return [(r*math.sin(a0+(a1-a0)*i/n), r*math.cos(a0+(a1-a0)*i/n)) for i in range(n+1)]
def arc_wall(pid,r,h,n=96,shape=6):
    V=[];F=[];P=arc_pts(r,-AMAX,AMAX,n)
    for i,(x,z) in enumerate(P):
        e=abs(i/n*2-1);hh=h*max(.1,1-e**shape)**.5
        V+=[[round(x,4),0,round(z,4)],[round(x,4),round(hh,4),round(z,4)]]
        if i<n:F.append([2*i,2*i+2,2*i+3,2*i+1])
    return {'id':pid,'k':'poly','v':V,'f':F}
def arc_roll(pid,r,depth,h,n=96):
    """low rolling wave front: sloped band from (r-depth, y≈0) up to (r, h) — leading face of a gust hugging the ground"""
    V=[];F=[];P=arc_pts(1,-AMAX*.9,AMAX*.9,n)
    for i,(sx,cz) in enumerate(P):
        e=abs(i/n*2-1);k=max(.15,1-e**4)**.5
        V+=[[round(sx*(r-depth),4),.03,round(cz*(r-depth),4)],[round(sx*r,4),round(h*k,4),round(cz*r,4)]]
        if i<n:F.append([2*i,2*i+2,2*i+3,2*i+1])
    return {'id':pid,'k':'poly','v':V,'f':F}
save(ROOT/'assets/fx/mesh/wind_aegis_arc.mesh.json',{'v':1,'desc':'Aegis Gale sb#16: ผนังโค้ง 12.5 ม. สูง 1 (ย่อขยายด้วย scale) ปลายโค้งกลับหาผู้ร่าย • จุดศูนย์กลางวงโค้ง = จุด 0 (กลางผนังอยู่ z=+รัศมี)','pal':'wind','mat':'solid',
    'parts':[arc_wall('body',RAD,1.0),arc_wall('back',RAD-.25,.92)]})
save(ROOT/'assets/fx/mesh/wind_aegis_roll.mesh.json',{'v':1,'desc':'Aegis Gale sb#16: คลื่นลมเตี้ยกลิ้งไปตามพื้น (แผ่นลาดโค้ง) จุดศูนย์กลางวงโค้ง = จุด 0','pal':'wind','mat':'solid',
    'parts':[arc_roll('roll',RAD,1.8,1.0)]})
URep=lambda reps:round(reps*180/math.degrees(AMAX),2)   # "reps across the wall" → uvTile u (u spans the whole circle)
# ground streamlines: thin ribbons from the caster's hand area fanning out to the arc front (local z 0 → TZ)
rgm=random.Random(5);parts=[]
for j in range(7):
    u=(j/6-.5);xe=u*HALF*1.6;y=.25+rgm.uniform(0,.9);P=[]
    for k in range(13):
        t=k/12;x=xe*t**1.2+.25*math.sin(t*6+j)*(1-t);z=t*(TZ-1.2)+.6
        P.append(r3([x,y+.15*math.sin(t*5+j*1.3),z]))
    parts.append({'id':f's{j}','k':'ribbon','path':P,'w':round(rgm.uniform(.12,.28),2),'taper':.6,'seg':60})
save(ROOT/'assets/fx/mesh/wind_aegis_flow.mesh.json',{'v':1,'desc':'Aegis Gale sb#16: เส้นลมจากผู้ร่ายแผ่ไปหาคลื่นหน้า (ริบบิ้นบาง 7 เส้น)','pal':'wind','mat':'solid','parts':parts})
# gather swirl around the caster (shot 1): 3 thin tilted loops
gp=[]
for j in range(3):
    P=[];r=.75+.2*j;y0=.5+.45*j;tl=[12,-18,8][j]
    for k in range(25):
        a=k/24*math.pi*1.7+j*2.1;x=r*math.cos(a);z=r*math.sin(a);y=y0+math.sin(math.radians(tl))*z+.12*k/24
        P.append(r3([x,y,z]))
    gp.append({'id':f'g{j}','k':'ribbon','path':P,'w':.16,'taper':.7,'seg':60})
save(ROOT/'assets/fx/mesh/wind_aegis_gather.mesh.json',{'v':1,'desc':'Aegis Gale sb#16: วงลมบางรอบตัวผู้ร่ายตอนเล็ง (3 วงเอียง)','pal':'wind','mat':'solid','parts':gp})


# ground base mark (user 2026-11-05: "มีเอฟเฟคบอกที่พื้น ว่าฐานของกำแพงอยู่ตรงนี้") — flat arc bands lying on the ground under the wall
def base_band(pid,r,w,a0,a1,n=64,y=.04):
    V=[];F=[]
    for i in range(n+1):
        a=a0+(a1-a0)*i/n;s_,c_=math.sin(a),math.cos(a)
        V+=[r3([s_*(r-w/2),y,c_*(r-w/2)]),r3([s_*(r+w/2),y,c_*(r+w/2)])]
        if i<n:F.append([2*i,2*i+1,2*i+3,2*i+2])
    return {'id':pid,'k':'poly','v':V,'f':F}
save(ROOT/'assets/fx/mesh/wind_aegis_base.mesh.json',{'v':1,'desc':'Aegis Gale: เส้นฐานกำแพงบนพื้น (แถบโค้งแบน กว้าง 0.14 ม.) ใต้ wind_aegis_arc — บอกว่ากำแพงตั้งตรงนี้','pal':'wind','mat':'glow','parts':[base_band('line',RAD,.14,-AMAX*1.02,AMAX*1.02)]})
save(ROOT/'assets/fx/mesh/wind_aegis_baseglow.mesh.json',{'v':1,'desc':'Aegis Gale: แสงนุ่มรอบเส้นฐานกำแพง (แถบโค้งแบน กว้าง 1.1 ม.)','pal':'wind','mat':'glow','parts':[base_band('glow',RAD,1.1,-AMAX*1.02,AMAX*1.02,y=.03)]})
# ---------------------------------------------------------------- effect builder
T1,T2,T3,T4,T5,T6,TE=0,3.0,3.2,3.5,3.9,6.9,7.2
DUR=TE;GREEN='#8dff65';WHITE='#ffffff'
def ck(t0,t1,t):return str(round(min(1,max(0,(t-t0)/(t1-t0))),4))

def build(v):
    A=v=='a'
    L=[]
    MINT='#c9ffd9' if A else '#e6fff4'
    # ===== shot 1: aim / gather (0–3) — air slowly gathers around the caster; no glow, just thin loops + dust + haze
    L.append({'id':'s1_loops','t':'mesh','at':.2,'life':2.85,'att':'ground','shape':'model','model':'wind_aegis_gather','mat':'tex','tex':'tex/wind_air_band','col':WHITE,'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[-.6,0],'spin':-70,'pos':[0,0,0],'scale':{'0':.6,'0.5':1,'1':.85},'op':{'0':0,'0.25':.85 if A else 1,'0.9':.9 if A else 1,'1':0},'fade':0})
    L.append({'id':'s1_curl','t':'emit','at':.5,'life':2.5,'att':'ground','pos':[0,.9,0],'from':'ring','fr':.9,'rate':{'0':4,'1':12},'dir':'tangent','speed':[2,3],'up':[.1,.4],'plife':[.3,.55],
        'look':'streak','size':[.8,1.4],'col':WHITE,'c2':GREEN,'gravity':0,'drag':.3,'curl':True})
    L.append({'id':'s1_dust','t':'emit','at':.3,'life':2.7,'att':'ground','pos':[0,.05,0],'from':'ring','fr':1.1,'rate':{'0':4,'0.7':14,'1':18},'dir':'tangent','speed':[.8,1.6],'up':[.1,.5],'plife':[.8,1.4],
        'look':'smoke','size':[3,5.5],'grow':.4,'col':'#d9d2bf','c2':'#b8b09a','gravity':-.1,'drag':.6,'curl':True,'fin':12})
    L.append({'id':'s1_leaf','t':'emit','at':.6,'life':2.3,'att':'ground','pos':[0,.2,0],'from':'ring','fr':1,'rate':3,'dir':'tangent','speed':[1.2,2],'up':[.3,.9],'plife':[1.2,1.8],
        'look':'model','model':'wind_leaf','mmat':'solid','msize':[.07,.12],'mspin':260,'bounce':0,'col':'#9fd86a','c2':'#4c8a2e','gravity':.4,'drag':.8,'curl':True,'x':True})
    L.append({'id':'s1_haze','t':'warp','at':.4,'life':2.6,'att':'ground','pos':[0,1.0,.3],'kind':'haze','size':2.2,'str':{'0':0,'0.5':.35,'1':.55},'op':{'0':0,'0.3':1,'1':1},'col':WHITE,'glow':0})
    # ===== shot 2: release (3–3.2) — a push of air off the hand: small pressure ring + a short streak spray + dust kick at the feet
    L.append({'id':'s2_push','t':'warp','at':T2,'life':.3,'att':'ground','pos':[0,1.2,.9],'kind':'shock','size':{'0':.4,'1':2.8},'str':.9,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    L.append({'id':'s2_spray','t':'emit','at':T2,'life':.06,'att':'ground','pos':[0,1.2,.7],'burst':22,'rate':0,'from':'sphere','fr':.2,'dir':'aim','yaw':0,'spread':.35,'speed':[10,16],'plife':[.18,.3],
        'look':'streak','size':[1.2,2.2],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1,'curl':False})
    L.append({'id':'s2_kick','t':'emit','at':T2,'life':.08,'att':'ground','pos':[0,.05,.4],'burst':10,'rate':0,'from':'disc','fr':.5,'dir':'aim','yaw':0,'spread':.9,'speed':[2.5,4.5],'up':[.2,.7],'plife':[.6,1],
        'look':'smoke','size':[3.5,6],'grow':.6,'col':'#ddd6c3','c2':'#bdb39c','gravity':0,'drag':2,'curl':True,'fin':10})
    # ===== shot 3: travel (3.2–3.5) — thin streamlines run forward along the ground, a LOW curved front rolls to the target
    L.append({'id':'s3_lines','t':'mesh','at':T2+.05,'life':.55,'att':'ground','shape':'model','model':'wind_aegis_flow','mat':'tex','tex':'tex/wind_air_band','col':WHITE,'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[-3.2,0],'pos':[0,0,0],'scale':{'0':[1,1,.2],'0.45':[1,1,1],'1':[1,1,1]},'op':{'0':0,'0.15':.75 if A else .9,'0.6':.6,'1':0},'fade':0})
    def front_pos(t):
        k=min(1,max(0,(t-T3)/(T4-T3)));k=1-(1-k)**2;return 2+k*(TZ-2)
    FK=[T3+i*.02 for i in range(16)]+[T4+.02]
    fpos={ck(T3,T4+.02,t):[0,0,round(front_pos(t)-RAD,3)] for t in FK}
    L.append({'id':'s3_front','t':'mesh','at':T3,'life':round(T4-T3+.02,3),'att':'ground','shape':'model','model':'wind_aegis_roll','mat':'tex','tex':'tex/wind_air_band','col':WHITE,'col2':'#000000','rim':0,
        'uvTile':[URep(3),1],'uvScroll':[.9,0],'pos':fpos,'scale':{'0':[.3,.7,.3],'1':[1,1.1,1]},'op':{'0':0,'0.25':.8 if A else .95,'1':.8 if A else .95},'fade':0})
    # the front is the arc laid down flat (rot −90): a rolling sheet just above the ground → stands up in shot 4
    L.append({'id':'s3_dust','t':'emit','at':T3,'life':.3,'att':'ground','pos':fpos,'from':'mesh','of':'s3_front','rate':35,'dir':'up','speed':[.6,1.6],'up':[.3,1],'plife':[.6,1.1],
        'look':'smoke','size':[3,6],'grow':.5,'col':'#ddd6c3','c2':'#b3aa92','gravity':0,'drag':1.5,'curl':True,'fin':10})
    L.append({'id':'s3_haze','t':'warp','at':T3,'life':.32,'att':'ground','pos':{k:[0,.8,round(p[2]+RAD,3)] for k,p in fpos.items()},'kind':'haze','size':5,'str':.8,'op':{'0':0,'0.3':1,'1':.6},'col':WHITE,'glow':0})
    # ===== shot 4: impact (3.5–3.9) — the front stands up into the wall; dust blows out along the base; one soft pressure ring
    WH=5.4 if A else 4.6                     # wall height (game: 5.4 m); B a bit lower & softer
    stand={'0':[1,.2,1],'0.06':[1,.75,1],'0.11':[1,1.04,1],'0.15':[1,1,1],'0.955':[1,1,1],'1':[1,.85,1]}
    def wall_layer(lid,col,c2,op,tile,scroll,rr=0,dz=0):
        return {'id':lid,'t':'mesh','at':T4,'life':round(TE-T4,3),'att':'ground','shape':'model','model':'wind_aegis_arc','mat':'tex','tex':'tex/wind_air_rise','col':col,'col2':c2,'rim':0,
            'uvTile':[URep(tile[0]),tile[1]],'uvScroll':scroll,'pos':[0,0,round(TZ-RAD+dz,3)],'rot':[0,rr,0],'scale':{k:[s[0],round(s[1]*WH,3),s[2]] for k,s in stand.items()},
            'op':{'0':0,'0.05':op,'0.92':op,'1':0},'fade':0}
    if A:
        L.append(wall_layer('s4_wall',WHITE,'#000000',.75,[1.7,1],[.03,0]))
        L.append(wall_layer('s4_wall2','#d8ffe0','#000000',.4,[1.1,1],[-.05,0],dz=-.35))
        L.append(wall_layer('s4_tint',GREEN,'#000000',.22,[1.1,1],[.02,0],dz=.3))
    else:
        # B: layered horizontal streams sweeping along the wall (ref picture bands), a faint rising layer behind
        def band_layer(lid,col,op,tile,scroll,dz,y0=0,hk=1):
            Lb=wall_layer(lid,col,'#000000',op,[1,1],[0,0],dz=dz)
            Lb.update({'tex':'tex/wind_air_band','uvTile':[URep(tile[0]),tile[1]],'uvScroll':scroll})
            return Lb
        L.append(band_layer('s4_wall',WHITE,.7,[1.3,2],[.22,0],0))
        L.append(band_layer('s4_wall2',MINT,.5,[.9,1],[-.16,0],-.4))
        L.append(band_layer('s4_band3',WHITE,.35,[1.8,3],[.3,0],.35))
        L.append(wall_layer('s4_tint',GREEN,'#000000',.25,[1.2,1],[.03,0],dz=-.7))
    L.append({'id':'s4_ring','t':'warp','at':T4,'life':.4,'att':'ground','pos':[0,.15,TZ],'kind':'shock','flat':True,'size':{'0':2,'1':9},'str':.9,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    L.append({'id':'s4_dust','t':'emit','at':T4,'life':.12,'att':'ground','pos':[0,.05,round(TZ-RAD,3)],'from':'mesh','of':'s4_wall','burst':16,'rate':0,'dir':'aim','yaw':0,'spread':1.2,'speed':[2,4.5],'up':[.2,.9],'plife':[.6,1.1],
        'look':'smoke','size':[3.5,6.5],'grow':.6,'col':'#ddd6c3','c2':'#b3aa92','gravity':0,'drag':1.8,'curl':True,'fin':10})
    L.append({'id':'s4_up','t':'emit','at':T4,'life':.1,'att':'ground','pos':[0,0,round(TZ-RAD,3)],'from':'mesh','of':'s4_wall','burst':40,'rate':0,'dir':'up','speed':[6,10],'plife':[.25,.45],'look':'streak','size':[1.4,2.6],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1.5,'curl':False})
    # ===== shot 5: linger (3.9–6.9) — wall breathes: lines keep rising, a few wisps peel off the top, light dust along the base
    L.append({'id':'s5_rise','t':'emit','at':T5-.2,'life':T6-T5+.2,'att':'ground','pos':[0,0,round(TZ-RAD,3)],'from':'mesh','of':'s4_wall','rate':26 if A else 34,'dir':'up','speed':[2.5,4.5],'plife':[.4,.8],
        'look':'streak','size':[1,2],'col':WHITE,'c2':GREEN,'gravity':0,'drag':.4,'curl':False})
    L.append({'id':'s5_wisp','t':'emit','at':T5,'life':T6-T5,'att':'ground','pos':[0,0,round(TZ-RAD,3)],'from':'mesh','of':'s4_wall','rate':7,'dir':'up','speed':[.6,1.4],'plife':[1,1.6],
        'look':'smoke','size':[3,5],'grow':.5,'col':'#f2fff6','c2':'#cfe8d6','gravity':-.3,'drag':.6,'curl':True,'fin':14,'x':True})
    L.append({'id':'s5_base','t':'emit','at':T5,'life':T6-T5,'att':'ground','pos':[0,.05,round(TZ-RAD,3)],'from':'mesh','of':'s4_wall','rate':10,'dir':'flat','speed':[.5,1.2],'up':[.05,.3],'plife':[1,1.6],
        'look':'smoke','size':[3,5.5],'grow':.4,'col':'#e3ddcb','c2':'#bdb39c','gravity':0,'drag':1,'curl':True,'fin':14})
    L.append({'id':'s5_haze','t':'warp','at':T4+.1,'life':TE-T4-.1,'att':'ground','pos':[0,WH*.5,TZ],'kind':'haze','size':7,'str':.45,'op':{'0':0,'0.1':1,'0.9':1,'1':0},'col':WHITE,'glow':0})
    if not A:
        # B only: soft white swirl bands lying round the base (ref picture's flat swirls), slowly turning
        for j,(sx,sp,sc) in enumerate([(-3.2,40,1.8),(3.4,-46,1.6),(0,32,2.2)]):
            L.append({'id':f's5_swirl{j}','t':'mesh','at':T4+.1+.08*j,'life':round(TE-T4-.1-.08*j,3),'att':'ground','shape':'model','model':'wind_aegis_gather','mat':'tex','tex':'tex/wind_air_band','col':WHITE,'col2':'#000000','rim':0,
                'uvTile':[1,1],'uvScroll':[-.5,0],'pos':[sx,0,TZ-.2-.3*abs(sx)/3],'scale':{'0':[sc*.5,.5,sc*.5],'0.08':[sc,.55,sc],'1':[sc*1.1,.5,sc*1.1]},'spin':sp,'op':{'0':0,'0.06':.8,'0.9':.7,'1':0},'fade':0})
    # ===== shot 6: fade (6.9–7.2) — lines lose their push and drift up / scatter; dust settles
    L.append({'id':'s6_lift','t':'emit','at':T6,'life':.12,'att':'ground','pos':[0,0,round(TZ-RAD,3)],'from':'mesh','of':'s4_wall','burst':40,'rate':0,'dir':'up','speed':[1.5,3],'plife':[.4,.7],'look':'streak','size':[1,1.8],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1.2,'curl':True})
    L.append({'id':'s6_puff','t':'emit','at':T6,'life':.1,'att':'ground','pos':[0,0,round(TZ-RAD,3)],'from':'mesh','of':'s4_wall','burst':14,'rate':0,'dir':'up','speed':[.8,1.6],'plife':[.6,1],'look':'smoke','size':[3.5,6],'grow':.6,
        'col':'#f2fff6','c2':'#cfe8d6','gravity':-.4,'drag':.8,'curl':True,'fin':10})
    desc=('Aegis Gale sb#16 แบบ A "ลมใส" — ลมจริงแบบโปร่ง: อากาศบิด + ฝุ่น + เส้นลมบาง คลื่นลมเตี้ยกลิ้งไปแล้วตั้งเป็นกำแพงเส้นลมคลื่นไหวลอยขึ้น (สูง 5.4 ม. กว้าง 12.5 ม.) สีขาวอมเขียวจาง' if A else
          'Aegis Gale sb#16 แบบ B "ม่านลมพัดผ่าน" — แบบรูปตัวอย่าง: คลื่นลมกลิ้งไปแล้วตั้งเป็นม่านลม (สูง 4.6 ม.) เป็นชั้นแถบลมขาวโปร่งพัดผ่านแนวนอนสวนกัน + เส้นลอยขึ้นจาง ๆ ด้านหลัง มีวงลมนอนวนรอบโคน')
    return {'v':1,'desc':desc,'tags':['wind','wall','storyboard'],'pal':'wind','dur':DUR,'seed':16,'layers':L}

for v in 'ab':
    save(ROOT/f'assets/fx/wind/aegis_sb_{v}.fx.json',build(v))
print('wind/aegis_sb_a, wind/aegis_sb_b + tex wind_air_rise/wind_air_band + mesh wind_aegis_arc/flow/gather')

# =====================================================================
# IN-GAME pieces of variant A "ลมใส" (user picked A 2026-11-04) — bound from js/68-wind-view.js windEfx
#  wind/aegis_aim   loop, follows the caster while choosing (wnwaim → stop on wnwup / wnwaimoff)
#  wind/aegis_cast  one-shot at the caster, a = wall direction (air push + streamlines forward)
#  wind/aegis_wall  12 s at the wall centre (+z = away from caster): low roll stands up into the curved wall, lingers, fades
#  wind/aegis_push  loop on top of the wall while it is pushed forward (low rolling front + dust + air dragged behind)
#  wind/aegis_stop  push ends; wind/aegis_unstable loop (damage >= 70 %); wind/aegis_break  wall bursts forward
# Arc meshes are centred on the circle centre → every arc layer uses pos z = −RAD (middle of the wall at the event point).
# =====================================================================
WALL=12.0;WHG=5.4;ZC=round(-RAD,3)
SMK=dict(look='smoke',col='#ddd6c3',c2='#b3aa92',curl=True,fin=10)
def g_aim():
    L=[]
    L.append({'id':'loops','t':'mesh','at':0,'life':2,'loop':True,'att':'ground','shape':'model','model':'wind_aegis_gather','mat':'tex','tex':'tex/wind_air_band','col':WHITE,'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[-.6,0],'spin':-70,'scale':1,'op':.8,'fade':0})
    L.append({'id':'curl','t':'emit','at':0,'life':2,'loop':True,'att':'ground','pos':[0,.9,0],'from':'ring','fr':.9,'rate':9,'dir':'tangent','speed':[2,3],'up':[.1,.4],'plife':[.3,.55],
        'look':'streak','size':[.8,1.4],'col':WHITE,'c2':GREEN,'gravity':0,'drag':.3,'curl':True})
    L.append({'id':'dust','t':'emit','at':0,'life':2,'loop':True,'att':'ground','pos':[0,.05,0],'from':'ring','fr':1.1,'rate':10,'dir':'tangent','speed':[.8,1.6],'up':[.1,.5],'plife':[.8,1.4],
        'look':'smoke','size':[3,5.5],'grow':.4,'col':'#d9d2bf','c2':'#b8b09a','gravity':-.1,'drag':.6,'curl':True,'fin':12})
    L.append({'id':'leaf','t':'emit','at':0,'life':2,'loop':True,'att':'ground','pos':[0,.2,0],'from':'ring','fr':1,'rate':3,'dir':'tangent','speed':[1.2,2],'up':[.3,.9],'plife':[1.2,1.8],
        'look':'model','model':'wind_leaf','mmat':'solid','msize':[.07,.12],'mspin':260,'bounce':0,'col':'#9fd86a','c2':'#4c8a2e','gravity':.4,'drag':.8,'curl':True,'x':True})
    L.append({'id':'haze','t':'warp','at':0,'life':2,'loop':True,'att':'ground','pos':[0,1.0,.3],'kind':'haze','size':2.2,'str':.45,'op':1,'col':WHITE,'glow':0,'x':True})
    return {'v':1,'desc':'กำแพงลม (แบบ A ลมใส) ตอนเล็ง: วงลมบางหมุนรอบตัว + ฝุ่น/ใบไม้ปลิว + อากาศบิด — วนจนวาง/ยกเลิก (ตามตัวผู้ร่าย)','tags':['wind','wall','aim','loop'],'pal':'wind','dur':2,'seed':3,'layers':L}
def g_cast():
    L=[]
    L.append({'id':'push','t':'warp','at':0,'life':.3,'att':'ground','pos':[0,1.2,.9],'kind':'shock','size':{'0':.4,'1':2.8},'str':.9,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    L.append({'id':'spray','t':'emit','at':0,'life':.06,'att':'ground','pos':[0,1.2,.7],'burst':22,'rate':0,'from':'sphere','fr':.2,'dir':'aim','yaw':0,'spread':.35,'speed':[10,16],'plife':[.18,.3],
        'look':'streak','size':[1.2,2.2],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1,'curl':False})
    L.append(dict(SMK,id='kick',t='emit',at=0,life=.08,att='ground',pos=[0,.05,.4],burst=10,rate=0,**{'from':'disc'},fr=.5,dir='aim',yaw=0,spread=.9,speed=[2.5,4.5],up=[.2,.7],plife=[.6,1],size=[3.5,6],grow=.6,gravity=0,drag=2))
    L.append({'id':'lines','t':'mesh','at':.03,'life':.55,'att':'ground','shape':'model','model':'wind_aegis_flow','mat':'tex','tex':'tex/wind_air_band','col':WHITE,'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[-3.2,0],'scale':{'0':[1,1,.2],'0.45':[1,1,1],'1':[1,1,1]},'op':{'0':0,'0.15':.75,'0.6':.6,'1':0},'fade':0})
    return {'v':1,'desc':'กำแพงลม (แบบ A ลมใส) ตอนปล่อย: อากาศดันออกจากมือ + เส้นลมสั้นพุ่ง + ฝุ่นที่เท้า + เส้นลมบางวิ่งเลียดพื้นไปข้างหน้า (ที่ตัวผู้ร่าย หันไปทางกำแพง)','tags':['wind','wall','cast'],'pal':'wind','dur':.7,'seed':4,'layers':L}
def arc_layer(lid,life,col,reps,scroll,dz=0,sc=None,at=0,loop=False,opc=1):
    return {'id':lid,'t':'mesh','at':at,'life':life,'loop':loop,'att':'ground','shape':'model','model':'wind_aegis_arc','mat':'tex','tex':'tex/wind_air_rise','col':col,'col2':'#000000','rim':0,
        'uvTile':[URep(reps),1],'uvScroll':scroll,'pos':[0,0,round(ZC+dz,3)],'scale':sc if sc is not None else [1,WHG,1],'op':opc,'fade':0}
def g_wall():
    L=[];U=lambda t:str(round(t/WALL,4))
    stand={'0':[1,.08*WHG,1],U(.08):[1,.35*WHG,1],U(.22):[1,1.04*WHG,1],U(.32):[1,WHG,1],U(WALL-.35):[1,WHG,1],'1':[1,.85*WHG,1]}
    opc=lambda pk:{'0':0,U(.08):pk,U(WALL-.35):pk,'1':0}
    L.append(arc_layer('wall',WALL,WHITE,1.7,[.03,0],sc=stand,opc=opc(.75)))
    L.append(arc_layer('wall2',WALL,'#d8ffe0',1.1,[-.05,0],dz=-.35,sc=stand,opc=opc(.4)))
    L.append(arc_layer('tint',WALL,GREEN,1.1,[.02,0],dz=.3,sc=stand,opc=opc(.22)))
    for bid,model,col,pk in [('gline','wind_aegis_base','#e6fff0',.85),('gglow','wind_aegis_baseglow',GREEN,.3)]:
        L.append({'id':bid,'t':'mesh','at':0,'life':WALL,'att':'ground','shape':'model','model':model,'mat':'glow','col':col,'col2':col,'pos':[0,0,ZC],
            'scale':{'0':[.2,1,.2],U(.15):[1,1,1],'1':[1,1,1]},'op':{'0':0,U(.06):pk,U(.5):pk*.75,U(1):pk,U(1.5):pk*.75,U(2):pk,U(WALL-.35):pk,'1':0},'fade':0})
    L.append({'id':'gflow','t':'emit','at':.3,'life':WALL-.6,'att':'ground','pos':[0,.08,ZC],'from':'mesh','of':'gline','rate':12,'dir':'flat','speed':[1,2],'up':[0,.2],'plife':[.5,.9],
        'look':'streak','size':[.8,1.4],'col':WHITE,'c2':GREEN,'gravity':0,'drag':.5,'curl':True,'x':True})
    L.append({'id':'ring','t':'warp','at':.05,'life':.4,'att':'ground','pos':[0,.15,0],'kind':'shock','flat':True,'size':{'0':2,'1':9},'str':.9,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    L.append(dict(SMK,id='dust',t='emit',at=.05,life=.12,att='ground',pos=[0,.05,ZC],**{'from':'mesh'},of='wall',burst=16,rate=0,dir='aim',yaw=0,spread=1.2,speed=[2,4.5],up=[.2,.9],plife=[.6,1.1],size=[3.5,6.5],grow=.6,gravity=0,drag=1.8))
    L.append({'id':'up','t':'emit','at':.05,'life':.1,'att':'ground','pos':[0,0,ZC],'from':'mesh','of':'wall','burst':40,'rate':0,'dir':'up','speed':[6,10],'plife':[.25,.45],'look':'streak','size':[1.4,2.6],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1.5,'curl':False})
    L.append({'id':'rise','t':'emit','at':.3,'life':WALL-.7,'att':'ground','pos':[0,0,ZC],'from':'mesh','of':'wall','rate':26,'dir':'up','speed':[2.5,4.5],'plife':[.4,.8],
        'look':'streak','size':[1,2],'col':WHITE,'c2':GREEN,'gravity':0,'drag':.4,'curl':False})
    L.append({'id':'wisp','t':'emit','at':.4,'life':WALL-.8,'att':'ground','pos':[0,0,ZC],'from':'mesh','of':'wall','rate':6,'dir':'up','speed':[.6,1.4],'plife':[1,1.6],
        'look':'smoke','size':[3,5],'grow':.5,'col':'#f2fff6','c2':'#cfe8d6','gravity':-.3,'drag':.6,'curl':True,'fin':14,'x':True})
    L.append({'id':'base','t':'emit','at':.4,'life':WALL-.8,'att':'ground','pos':[0,.05,ZC],'from':'mesh','of':'wall','rate':8,'dir':'flat','speed':[.5,1.2],'up':[.05,.3],'plife':[1,1.6],
        'look':'smoke','size':[3,5.5],'grow':.4,'col':'#e3ddcb','c2':'#bdb39c','gravity':0,'drag':1,'curl':True,'fin':14,'x':True})
    L.append({'id':'haze','t':'warp','at':.15,'life':WALL-.3,'att':'ground','pos':[0,WHG*.5,0],'kind':'haze','size':7,'str':.45,'op':{'0':0,'0.03':1,'0.97':1,'1':0},'col':WHITE,'glow':0,'x':True})
    L.append({'id':'lift','t':'emit','at':WALL-.3,'life':.12,'att':'ground','pos':[0,0,ZC],'from':'mesh','of':'wall','burst':40,'rate':0,'dir':'up','speed':[1.5,3],'plife':[.4,.7],'look':'streak','size':[1,1.8],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1.2,'curl':True})
    L.append({'id':'puff','t':'emit','at':WALL-.3,'life':.1,'att':'ground','pos':[0,0,ZC],'from':'mesh','of':'wall','burst':14,'rate':0,'dir':'up','speed':[.8,1.6],'plife':[.6,1],'look':'smoke','size':[3.5,6],'grow':.6,
        'col':'#f2fff6','c2':'#cfe8d6','gravity':-.4,'drag':.8,'curl':True,'fin':10})
    return {'v':1,'desc':'กำแพงลม Aegis Gale แบบ A "ลมใส" (ผู้ใช้เลือก 2026-11-04, สตอรี่บอร์ด #16): คลื่นลมเตี้ยยืดตั้งเป็นกำแพงโค้ง 12.5 ม. สูง 5.4 ม. เส้นลมคลื่นไหวลอยขึ้นตลอด ฝุ่นที่โคน อากาศบิด ไม่เรือง (ตรงกลางนูนไปทางศัตรู +z)','tags':['wind','wall','ground'],'pal':'wind','dur':WALL,'seed':11,'layers':L}
def g_push():
    L=[]
    L.append({'id':'roll','t':'mesh','at':0,'life':.6,'loop':True,'att':'ground','shape':'model','model':'wind_aegis_roll','mat':'tex','tex':'tex/wind_air_band','col':WHITE,'col2':'#000000','rim':0,
        'uvTile':[URep(3),1],'uvScroll':[.9,0],'pos':[0,0,round(ZC+.7,3)],'scale':[1,1.2,1],'op':.85,'fade':0})
    L.append(dict(SMK,id='dust',t='emit',at=0,life=.6,loop=True,att='ground',pos=[0,0,round(ZC+.7,3)],**{'from':'mesh'},of='roll',rate=40,dir='up',speed=[.6,1.6],up=[.3,1],plife=[.6,1.1],size=[3,6],grow=.5,gravity=0,drag=1.5))
    L.append({'id':'drag','t':'emit','at':0,'life':.6,'loop':True,'att':'ground','pos':[0,.6,round(ZC+.7,3)],'from':'mesh','of':'roll','rate':60,'dir':'aim','yaw':180,'spread':.25,'speed':[4,8],'plife':[.25,.5],
        'look':'streak','size':[1.4,2.8],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1,'curl':False})
    L.append({'id':'haze','t':'warp','at':0,'life':.6,'loop':True,'att':'ground','pos':[0,1,.6],'kind':'haze','size':5,'str':.7,'op':1,'col':WHITE,'glow':0,'x':True})
    return {'v':1,'desc':'กำแพงลม (แบบ A) ตอนดันพุ่ง: คลื่นลมเตี้ยกลิ้งนำหน้าโคนกำแพง + ฝุ่นตลบ + เส้นลมลากไปด้านหลัง + อากาศบิด (วนซ้อนกำแพงขณะวิ่ง)','tags':['wind','wall','push','loop'],'pal':'wind','dur':.6,'seed':8,'layers':L}
def g_stop():
    L=[arc_layer('probe',.3,WHITE,1.7,[0,0],opc={'0':.3,'1':0})]
    L.append({'id':'ring','t':'warp','at':0,'life':.35,'att':'ground','pos':[0,.15,.5],'kind':'shock','flat':True,'size':{'0':2,'1':8},'str':.8,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    L.append(dict(SMK,id='dust',t='emit',at=0,life=.08,att='ground',pos=[0,.05,ZC],**{'from':'mesh'},of='probe',burst=14,rate=0,dir='aim',yaw=0,spread=1,speed=[2,4],up=[.2,.8],plife=[.6,1],size=[3.5,6],grow=.6,gravity=0,drag=1.8))
    L.append({'id':'spray','t':'emit','at':0,'life':.05,'att':'ground','pos':[0,1.5,0],'from':'sphere','fr':1.5,'burst':24,'rate':0,'dir':'aim','yaw':0,'spread':.9,'speed':[4,8],'up':[.5,2],'plife':[.25,.5],'look':'streak','size':[1,2.2],'col':WHITE,'c2':GREEN,'gravity':0,'drag':2,'curl':False})
    return {'v':1,'desc':'กำแพงลม (แบบ A) หยุดหลังดัน: ฝุ่นพัดออกที่โคน + อากาศบิดวงเตี้ย + เส้นลมพ่นไปข้างหน้า','tags':['wind','wall','push'],'pal':'wind','dur':.5,'seed':9,'layers':L}
def g_unstable():
    L=[arc_layer('shiver',2,'#e6fff4',2.2,[.12,0],loop=True,opc={'0':.25,'0.2':.42,'0.45':.22,'0.7':.45,'1':.25},
        sc={'0':[1,WHG,1],'0.13':[1.005,WHG*1.05,1],'0.27':[.997,WHG*.96,1],'0.4':[1.004,WHG*1.04,1],'0.55':[.996,WHG*.97,1],'0.7':[1.006,WHG*1.06,1],'0.85':[.998,WHG*.96,1],'1':[1,WHG,1]})]
    L.append({'id':'rush','t':'emit','at':0,'life':2,'loop':True,'att':'ground','pos':[0,0,ZC],'from':'mesh','of':'shiver','rate':70,'dir':'up','speed':[4,6.5],'plife':[.25,.5],'look':'streak','size':[1.4,2.6],'col':WHITE,'c2':GREEN,'gravity':0,'drag':0,'curl':False})
    L.append({'id':'chips','t':'emit','at':0,'life':2,'loop':True,'att':'ground','pos':[0,0,ZC],'from':'mesh','of':'shiver','rate':25,'dir':'aim','yaw':0,'spread':.9,'speed':[1.5,3.5],'plife':[.3,.7],'look':'streak','size':[.5,1.1],'col':'#e6fff4','c2':GREEN,'gravity':0,'drag':1.2,'curl':True})
    L.append(dict(SMK,id='dust',t='emit',at=0,life=2,loop=True,att='ground',pos=[0,.05,ZC],**{'from':'mesh'},of='shiver',rate=12,dir='flat',speed=[1,2],up=[.1,.4],plife=[.8,1.3],size=[3,5],grow=.4,gravity=0,drag=1))
    return {'v':1,'desc':'กำแพงลม (แบบ A) ใกล้แตก: เส้นลมไหลขึ้นเร็วขึ้น กำแพงสั่น ฝุ่นตลบที่โคน เศษลมหลุดออก (วนซ้อนกำแพงจนแตก)','tags':['wind','wall','loop'],'pal':'wind','dur':2,'seed':6,'layers':L}
def g_break():
    L=[arc_layer('contract',.2,WHITE,1.7,[0,0],opc={'0':.6,'0.6':.9,'1':0},sc={'0':[1,WHG,1],'0.6':[.97,WHG*.72,.94],'1':[1.03,WHG*.3,1.1]})]
    for j,(col,dz,dl,op) in enumerate([(WHITE,7,0,.8),('#d8ffe0',10,.04,.55)]):
        b=arc_layer(f'blow{j}',.55,col,1.4,[0,-1.5],at=round(.12+dl,2),opc={'0':op,'0.4':round(op*.7,2),'1':0},sc={'0':[1,WHG,1],'0.3':[1.15,round(WHG*.85,2),1.15],'1':[1.4,round(WHG*.45,2),1.4]})
        b['pos']={'0':[0,0,ZC],'1':[0,0,round(ZC+dz,2)],'ease':'out'};L.append(b)
    L.append({'id':'shards','t':'emit','at':.12,'life':.05,'att':'ground','pos':[0,0,ZC],'from':'mesh','of':'contract','burst':70,'rate':0,'dir':'aim','yaw':0,'spread':.8,'speed':[7,14],'up':[0,3],'plife':[.35,.8],'look':'streak','size':[1.4,3],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1.4,'curl':False})
    L.append(dict(SMK,id='dust',t='emit',at=.12,life=.08,att='ground',pos=[0,.05,ZC],**{'from':'mesh'},of='contract',burst=40,rate=0,dir='aim',yaw=0,spread=1,speed=[4,8],up=[.3,1.2],plife=[.8,1.4],size=[4,7],grow=.8,gravity=0,drag=1.6))
    L.append({'id':'shock','t':'warp','at':.12,'life':.45,'att':'ground','pos':[0,.1,1.5],'kind':'shock','flat':True,'size':{'0':1,'1':14},'str':1.4,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    L.append({'id':'shake','t':'screen','at':.12,'life':.3,'shake':7,'flash':.03,'fcol':'#e6fff4'})
    return {'v':1,'desc':'กำแพงลม (แบบ A) แตกระเบิด: หดเข้าสั้น ๆ แล้วม่านเส้นลมถูกพัดพุ่งออกด้านหน้า + เส้นลมแตกกระจาย + ฝุ่นตลบ + คลื่นอากาศบิดบนพื้น + จอสั่น','tags':['wind','wall','break'],'pal':'wind','dur':1.2,'seed':7,'layers':L}
for n,f in [('aim',g_aim),('cast',g_cast),('wall',g_wall),('push',g_push),('stop',g_stop),('unstable',g_unstable),('break',g_break)]:
    save(ROOT/f'assets/fx/wind/aegis_{n}.fx.json',f())
print('in-game: wind/aegis_aim|cast|wall|push|stop|unstable|break')
