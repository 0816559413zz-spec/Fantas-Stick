# Eye of Heaven (ult สายลม) — storyboard #20 demo: 3 แบบ (a/b/c)
# ใช้: python tools/wind-eye-sb-gen.py แล้ว node tools/fx-check.js
# ดู: studio.html?fx=wind/eye_sb_a  (at=self: ผู้ร่ายที่ 0 หันทาง +z, เป้าห่าง 5 ตัว ≈ 10.5 ม.)
# Sketch (sb-20 frames): 1 รอยแยกมิติบนฟ้า → 2 ตาลืมจากรอยแยก → 3 สนามลมปั่นป่วน → 4 ระเบิดลมผลักออก → 5 กำแพงลมวงกลม
# Timing = GAME CODE (js/09-wind.js W_UL), not the board's guess:
#   0–1.0 ชูไม้ (รอยแยก + ตาลืม) • 1.0 ปักไม้ = ทุกคนลอย (สนามลมปั่นป่วน) • 1.15 กำแพงวง 8 ชิ้นขึ้น
#   2.38 สะบัดปีก = ระเบิดลมผลักออก • กำแพงอยู่ถึง 1.15+6.25 = 7.4 แล้วสลาย
# Zone = caster-centred radius 350 = 17.5 m (game), so the ring is round the CASTER (sketch drew it round both).
# Wall look = Aegis Gale "ลมใส" (user picked 2026-11-04): tex/wind_air_rise (A,B) / tex/wind_air_band (C).
import json,math,random
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def save(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=1),encoding='utf-8')
def r3(v):return [round(c,4) for c in v]
GREEN='#8dff65';WHITE='#ffffff';MINT='#d8ffe0'
R=17.5                         # zone radius (m)
T_SLAM,T_WALL,T_IMP,T_END=1.0,1.15,2.38,7.4
DUR=7.5

# ---------------------------------------------------------------- meshes (eye = XY plane facing +z, used with bill:true)
def band(pts,w,closed=False):
    """flat band in the XY plane along a 2D polyline; w = width (number or per-point list)"""
    n=len(pts);V=[];F=[]
    for i,(x,y) in enumerate(pts):
        a=pts[(i-1)%n] if (closed or i>0) else pts[i];b=pts[(i+1)%n] if (closed or i<n-1) else pts[i]
        tx,ty=b[0]-a[0],b[1]-a[1];L=math.hypot(tx,ty) or 1;nx,ny=-ty/L,tx/L
        ww=(w[i] if isinstance(w,list) else w)*.5
        V+=[r3([x+nx*ww,y+ny*ww,0]),r3([x-nx*ww,y-ny*ww,0])]
    m=n if closed else n-1
    for i in range(m):j=(i+1)%n;F.append([2*i,2*j,2*j+1,2*i+1])
    return V,F
def part(pid,VF):return {'id':pid,'k':'poly','v':VF[0],'f':VF[1]}
def lid_curve(hu,hl,n=40,tail=.18):
    up=[(-1-tail+(2+2*tail)*i/n,0) for i in range(n+1)]
    P=[];Q=[]
    for i in range(n+1):
        x=-1-tail+(2+2*tail)*i/n;k=max(0,1-min(1,abs(x))**2)
        P.append((x,hu*k**.95+(.05 if x<-1 else 0)*(-1-x)/tail*0));Q.append((x,-hl*k**1.1))
    return P,Q
def eye_meshes():
    P,Q=lid_curve(.5,.36)
    wP=[.025+.075*max(0,1-abs(x))**.7 for x,_ in P];wQ=[.02+.05*max(0,1-abs(x))**.7 for x,_ in Q]
    P2,Q2=lid_curve(.62,.46)
    w2=[.01+.025*max(0,1-abs(x)) for x,_ in P2]
    save(ROOT/'assets/fx/mesh/wind_eye_lid.mesh.json',{'v':1,'desc':'Eye of Heaven sb#20: ขอบตา (เปลือกบน+ล่าง) แผ่นแบนบนระนาบ XY กว้าง 2 — ใช้ bill:true • scale y เล็ก = รอยแยก','pal':'wind','mat':'glow',
        'parts':[part('up',band(P,wP)),part('lo',band(Q,wQ)),part('up2',band(P2,w2)),part('lo2',band(Q2,[x*.8 for x in w2]))]})
    def circ(r,n=48):return [(r*math.cos(2*math.pi*i/n),r*math.sin(2*math.pi*i/n)) for i in range(n)]
    save(ROOT/'assets/fx/mesh/wind_eye_iris.mesh.json',{'v':1,'desc':'Eye of Heaven sb#20: วงม่านตา (2 วง) ระนาบ XY','pal':'wind','mat':'glow',
        'parts':[part('r1',band(circ(.33),.05,True)),part('r2',band(circ(.24),.018,True))]})
    def disc(r,n=40):
        V=[[0,0,0]]+[r3([r*math.cos(2*math.pi*i/n),r*math.sin(2*math.pi*i/n),0]) for i in range(n)]
        return V,[[0,1+i,1+(i+1)%n] for i in range(n)]
    save(ROOT/'assets/fx/mesh/wind_eye_disc.mesh.json',{'v':1,'desc':'Eye of Heaven sb#20: แผ่นกลมรัศมี 1 ระนาบ XY (ม่านตา/รูม่านตา)','pal':'wind','mat':'glow','parts':[part('d',disc(1))]})
    # vortex iris (B): 5 spiral arms in XY
    arms=[]
    for j in range(5):
        pts=[];ws=[]
        for i in range(30):
            t=i/29;a=j*2*math.pi/5+t*2.6;r=.06+.3*t
            pts.append((r*math.cos(a),r*math.sin(a)));ws.append(.012+.05*math.sin(math.pi*t))
        arms.append(part(f'a{j}',band(pts,ws)))
    save(ROOT/'assets/fx/mesh/wind_eye_vortex.mesh.json',{'v':1,'desc':'Eye of Heaven sb#20 แบบ B: ม่านตาเป็นวังวนลม 5 แขน ระนาบ XY','pal':'wind','mat':'glow','parts':arms})
eye_meshes()

def ringwall(pid_prefix,r,gap_deg=3.0,n=24,shape=6):
    parts=[]
    for s in range(8):
        a0=math.radians(s*45+gap_deg/2);a1=math.radians((s+1)*45-gap_deg/2);V=[];F=[]
        for i in range(n+1):
            a=a0+(a1-a0)*i/n;e=abs(i/n*2-1);hh=max(.12,1-e**shape)**.5
            x,z=r*math.sin(a),r*math.cos(a)
            V+=[r3([x,0,z]),r3([x,hh,z])]
            if i<n:F.append([2*i,2*i+2,2*i+3,2*i+1])
        parts.append({'id':f'{pid_prefix}{s}','k':'poly','v':V,'f':F})
    return parts
save(ROOT/'assets/fx/mesh/wind_eye_ringwall.mesh.json',{'v':1,'desc':'Eye of Heaven sb#20: กำแพงลมวงกลม 8 ชิ้น รัศมี 17.5 ม. สูง 1 (ย่อขยายด้วย scale y) — u ตามมุมรอบวง','pal':'wind','mat':'solid',
    'parts':ringwall('w',R)})
def roll_ring(n=128,depth=.12):
    V=[];F=[]
    for i in range(n+1):
        a=2*math.pi*i/n;s,c=math.sin(a),math.cos(a)
        V+=[r3([s*(1-depth),.0,c*(1-depth)]),r3([s,1,c])]
        if i<n:F.append([2*i,2*i+2,2*i+3,2*i+1])
    return {'id':'roll','k':'poly','v':V,'f':F}
save(ROOT/'assets/fx/mesh/wind_eye_roll.mesh.json',{'v':1,'desc':'Eye of Heaven sb#20: วงคลื่นลมเตี้ยรอบตัว (แผ่นลาด รัศมี 1 สูง 1) ขยายด้วย scale = ระเบิดลมผลักออก','pal':'wind','mat':'solid','parts':[roll_ring()]})

# ---------------------------------------------------------------- effect
def ck(t0,t1,t):return str(round(min(1,max(0,(t-t0)/(t1-t0))),4))
def keys(t0,t1,d):return {ck(t0,t1,t):v for t,v in d}

def build(v,game=False):
    A,B,C=v=='a',v=='b',v=='c'
    GM=game   # in-game cut: camera sits inside the zone right behind the caster → eye lower/further, nothing big near the caster
    L=[]
    EY=[0,8.5 if not C else 9.5,4.5] if not GM else [0,5.6,14]       # eye in the sky, a bit ahead of the caster (sketch: between caster and target)
    EW=3.6 if not C else 4.4               # half width (m) → eye 7.2 / 8.8 m wide
    eye_close=1.35 if not C else T_IMP+.12
    E0,E1=0,eye_close+.25
    # ===== shot 1: rift (0–0.35) → eye opens (0.35–0.7) → stares (–1.0) =====
    lid_sc=[(0,[.05*EW,.14*EW,1]),(.3,[EW,.12*EW,1]),(.38,[EW*1.02,.13*EW,1]),(.62,[EW*1.04,EW*1.05,1]),(.7,[EW,EW,1]),
            (eye_close-.12,[EW,EW,1]),(eye_close,[EW*1.03,.04*EW,1]),(E1,[EW*1.1,.01*EW,1])]
    lid_op=[(0,0),(.06,1),(eye_close,1),(E1,0)]
    def eyel(lid,model,col,op,sc_mul=1.0,spin=0,at=E0,life=None,dz=0):
        life=life or E1-at
        sc=[(t,[s[0]*sc_mul,s[1]*sc_mul,1]) for t,s in lid_sc if t>=at-1e-6]
        if sc[0][0]>at:sc=[(at,sc[0][1])]+sc
        return {'id':lid,'t':'mesh','at':at,'life':round(life,3),'att':'ground','shape':'model','model':model,'mat':'glow','col':col,'col2':col,'bill':True,
            'pos':[EY[0],EY[1],EY[2]+dz],'scale':keys(at,at+life,sc),'op':keys(at,at+life,[(t,o*op) for t,o in lid_op if t>=at-1e-6] or [(at,op)]),'spin':spin,'fade':0}
    L.append(eyel('s1_lid','wind_eye_lid',WHITE,1))
    L.append(eyel('s1_lidg','wind_eye_lid',GREEN,.55,sc_mul=1.06,dz=-.05))
    # rift = glowing slit (thin lens) that tears open sideways, then splits into the lids
    for rid,col,hy,op in [('s1_rift',WHITE,.09,1),('s1_riftg',GREEN,.22,.6)]:
        L.append({'id':rid,'t':'mesh','at':0,'life':.55,'att':'ground','shape':'model','model':'wind_eye_disc','mat':'glow','col':col,'col2':col,'bill':True,'pos':[EY[0],EY[1],EY[2]+.03],
            'scale':{'0':[.08*EW,hy*.5,1],'0.5':[EW*1.08,hy,1],'0.7':[EW*1.1,hy*2.2,1],'1':[EW*1.05,hy*5,1]},'op':{'0':0,'0.08':op,'0.62':op,'1':0},'fade':0})
    # iris / pupil appear once the lid is open (0.4)
    iris_sc=lambda r:[(.4,[EW*r*.2,EW*r*.2,1]),(.62,[EW*r*1.1,EW*r*1.1,1]),(.72,[EW*r,EW*r,1]),(T_SLAM-.04,[EW*r,EW*r,1]),(T_SLAM+.05,[EW*r*.8,EW*r*.8,1]),
                         (eye_close-.12,[EW*r*.85,EW*r*.85,1]),(eye_close,[EW*r*.85,.04*EW,1]),(E1,[EW*r*.8,.01,1])]
    def irisl(lid,model,col,op,r,spin=0):
        at=.4;life=E1-at
        return {'id':lid,'t':'mesh','at':at,'life':round(life,3),'att':'ground','shape':'model','model':model,'mat':'glow','col':col,'col2':col,'bill':True,
            'pos':[EY[0],EY[1],EY[2]+.05],'scale':keys(at,E1,iris_sc(r)),'op':keys(at,E1,[(.4,0),(.55,op),(eye_close,op),(E1,0)]),'spin':spin,'fade':0}
    if B:
        L.append(irisl('s1_vortex','wind_eye_vortex',GREEN,1,1.25,spin=-240))
        L.append(irisl('s1_vortex2','wind_eye_vortex',MINT,.45,.95,spin=-330))
        L.append(irisl('s1_iris','wind_eye_iris',GREEN,.7,1.2))
    else:
        L.append(irisl('s1_fill','wind_eye_disc',GREEN,.22,.33))
        L.append(irisl('s1_iris','wind_eye_iris',GREEN,1,1))
        L.append(irisl('s1_irisw','wind_eye_iris',WHITE,.7,.9))
    if B:
        pl=irisl('s1_pupil','wind_eye_disc','#000000',1,.075);pl['mat']='black';pl['pos']=[EY[0],EY[1],EY[2]-.3];L.append(pl)
    else:L.append(irisl('s1_pupil','wind_eye_disc',WHITE,1,.1 if not C else .085))
    # rift tear sparks + air sucked into the rift while it opens
    L.append({'id':'s1_tear','t':'emit','at':.02,'life':.35,'att':'ground','pos':EY,'from':'line','fh':EW*1.8,'fr':.1,'rate':{'0':60,'1':140},'dir':'random','speed':[1,3],'plife':[.2,.4],
        'look':'streak','size':[.8,1.5],'col':WHITE,'c2':GREEN,'gravity':0,'drag':2,'curl':False})
    L.append({'id':'s1_suck','t':'emit','at':.3,'life':.7,'att':'ground','pos':EY,'from':'sphere','fr':EW*1.5,'rate':80 if not C else 110,'dir':'in','speed':[6,10],'plife':[.3,.5],
        'look':'streak','size':[1.2,2.2],'col':WHITE,'c2':GREEN,'gravity':0,'drag':0,'curl':False})
    L.append({'id':'s1_haze','t':'warp','at':.3,'life':round(E1-.3,3),'att':'ground','pos':EY,'kind':'bulge','size':EW*1.6,'str':{'0':0,'0.4':.5,'1':.2},'op':{'0':0,'0.2':1,'0.85':1,'1':0},'col':WHITE,'glow':0})
    L.append({'id':'s1_glow','t':'light','at':.35,'life':round(E1-.35,3),'att':'ground','pos':EY,'col':GREEN,'int':{'0':0,'0.3':2.5,'0.8':2,'1':0},'dist':22})
    # caster: wand raised → small green air rising round the caster
    L.append({'id':'s1_aura','t':'emit','at':.1,'life':.9,'att':'ground','pos':[0,.1,0],'from':'ring','fr':.8,'rate':70,'dir':'up','spread':.1,'speed':[4,7],'plife':[.3,.5],
        'look':'streak','size':[1.1,2],'col':WHITE,'c2':GREEN,'gravity':0,'drag':.3,'curl':False})
    L.append({'id':'s1_dust','t':'emit','at':.2,'life':.8,'att':'ground','pos':[0,.05,0],'from':'ring','fr':1.3,'rate':12,'dir':'tangent','speed':[1,2],'up':[.1,.4],'plife':[.8,1.2],
        'look':'smoke','size':[3,5],'grow':.4,'col':'#d9d2bf','c2':'#b8b09a','gravity':-.1,'drag':.6,'curl':True,'fin':12})
    if C:   # C: a thin beam of light from the eye down to the caster's wand
        L.append({'id':'s1_beam','t':'emit','at':.55,'life':.45,'att':'ground','pos':[0,1.6,.3],'from':'line','fh':.1,'rate':0,'burst':0,'dir':'up','speed':[0,0],'plife':[.1,.2],'look':'glow','size':[1,1],'col':GREEN,'c2':GREEN,'gravity':0,'drag':0,'x':True})
    # ===== shot 2: slam (1.0) → turbulent wind field over the whole zone (1.0–2.38) =====
    L.append({'id':'s2_shock','t':'warp','at':T_SLAM,'life':.55,'att':'ground','pos':[0,.15,0],'kind':'shock','flat':True,'size':{'0':1,'1':R*2},'str':1.1,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    L.append({'id':'s2_flash','t':'flash','at':T_SLAM,'life':.18,'att':'ground','pos':[0,.3,.6],'size':2.2,'col':'#efffe8','k':1.2})
    L.append({'id':'s2_kick','t':'emit','at':T_SLAM,'life':.08,'att':'ground','pos':[0,.05,0],'from':'ring','fr':1,'burst':26,'rate':0,'dir':'out','spread':.2,'speed':[5,9],'up':[.2,.8],'plife':[.7,1.1],
        'look':'smoke','size':[3.5,6.5],'grow':.6,'col':'#ddd6c3','c2':'#bdb39c','gravity':0,'drag':1.6,'curl':True,'fin':10})
    TB0,TB1=T_SLAM+.02,T_IMP
    L.append({'id':'s2_curl','t':'emit','at':TB0,'life':round(TB1-TB0,3),'att':'ground','pos':[0,.6,0],'from':'disc','fr':R-1.5,'rate':{'0':110,'0.3':170,'1':190} if not C else {'0':130,'0.3':195,'1':200},'dir':'tangent','speed':[5,9],'up':[.5,2.5],
        'plife':[.35,.6],'look':'streak','size':[3.5,6],'col':WHITE,'c2':GREEN,'gravity':0,'drag':.2,'curl':True})
    L.append({'id':'s2_lift','t':'emit','at':TB0,'life':round(TB1-TB0,3),'att':'ground','pos':[0,.2,0],'from':'disc','fr':R-1,'rate':60,'dir':'up','spread':.25,'speed':[3,6],'plife':[.4,.7],
        'look':'streak','size':[2.5,4],'col':MINT,'c2':GREEN,'gravity':0,'drag':.3,'curl':False})
    L.append({'id':'s2_dust','t':'emit','at':TB0,'life':round(TB1-TB0,3),'att':'ground','pos':[0,.1,0],'from':'disc','fr':R-1.5,'rate':26,'dir':'tangent','speed':[2,4],'up':[.3,1],'plife':[.9,1.4],
        'look':'smoke','size':[4,7],'grow':.5,'col':'#ddd6c3','c2':'#b8b09a','gravity':-.1,'drag':.6,'curl':True,'fin':12})
    L.append({'id':'s2_leaf','t':'emit','at':TB0,'life':round(TB1-TB0,3),'att':'ground','pos':[0,.5,0],'from':'disc','fr':R-2,'rate':10,'dir':'tangent','speed':[3,5],'up':[1,2.5],'plife':[1,1.5],
        'look':'model','model':'wind_leaf','mmat':'solid','msize':[.08,.14],'mspin':300,'bounce':0,'col':'#9fd86a','c2':'#4c8a2e','gravity':.2,'drag':.6,'curl':True,'x':True})
    rg=random.Random({'a':3,'b':5,'c':7}[v])
    nsw=10 if not B else 7
    for j in range(nsw):
        a=j/nsw*2*math.pi+rg.uniform(-.3,.3);rr=(rg.uniform(4.5,R-5) if j else 0) if not GM else rg.uniform(7,R-4)
        sc=(rg.uniform(3.8,5.2) if not B else rg.uniform(5.5,7.5))*(1 if not GM else .7)
        hy=.5 if not GM else .28
        at=round(TB0+.05*j,3);life=round(TB1+.3-at,3)
        L.append({'id':f's2_sw{j}','t':'mesh','at':at,'life':life,'att':'ground','shape':'model','model':'wind_aegis_gather','mat':'tex','tex':'tex/wind_air_band','col':WHITE,'col2':'#000000','rim':0,
            'uvTile':[1,1],'uvScroll':[-.9 if j%2 else -.7,0],'pos':[round(rr*math.sin(a),2),0,round(rr*math.cos(a),2)],
            'scale':{'0':[sc*.4,.4*sc*hy,sc*.4],'0.18':[sc,sc*hy,sc],'0.85':[sc*1.05,sc*hy*1.1,sc*1.05],'1':[sc*1.3,sc*hy*.6,sc*1.3]},'spin':(-110 if j%2 else 95)*(1.4 if B else 1),
            'op':{'0':0,'0.15':1,'0.85':.9,'1':0},'fade':0})
        L.append({'id':f's2_swg{j}','t':'mesh','at':at,'life':life,'att':'ground','shape':'model','model':'wind_aegis_gather','mat':'glow','col':GREEN if j%2 else MINT,'col2':GREEN,
            'pos':[round(rr*math.sin(a),2),.05,round(rr*math.cos(a),2)],'scale':{'0':[sc*.4,.2*sc*hy,sc*.4],'0.18':[sc*1.03,sc*hy,sc*1.03],'0.85':[sc*1.08,sc*hy*1.1,sc*1.08],'1':[sc*1.3,sc*hy*.6,sc*1.3]},
            'spin':(-110 if j%2 else 95)*(1.4 if B else 1),'op':{'0':0,'0.15':.28 if not C else .35,'0.85':.22,'1':0},'fade':0,'x':True})
    L.append({'id':'s2_haze','t':'warp','at':TB0,'life':round(TB1-TB0,3),'att':'ground','pos':[0,1.5,4],'kind':'haze','size':14,'str':.5,'op':{'0':0,'0.15':1,'0.9':1,'1':0},'col':WHITE,'glow':0,'x':True})
    # ===== the ring wall (game: 8 pieces at 1.15, live 6.25 s) =====
    WH=5.4
    if B:   # B: low wall at 1.15, the blast (2.38) slams into it and it surges to full height (sketch order: blast → wall)
        st=[(T_WALL,[1,.08*WH,1]),(T_WALL+.2,[1,.36*WH,1]),(T_IMP+.3,[1,.4*WH,1]),(T_IMP+.42,[1,1.08*WH,1]),(T_IMP+.55,[1,WH,1]),(T_END-.3,[1,WH,1]),(T_END,[1,.85*WH,1])]
    else:
        st=[(T_WALL,[1,.08*WH,1]),(T_WALL+.12,[1,.6*WH,1]),(T_WALL+.25,[1,1.04*WH,1]),(T_WALL+.35,[1,WH,1]),(T_IMP+.3,[1,WH,1]),(T_IMP+.4,[1,WH*1.08,1]),(T_IMP+.55,[1,WH,1]),(T_END-.3,[1,WH,1]),(T_END,[1,.85*WH,1])]
    wl=round(T_END-T_WALL,3)
    def wall(lid,tex,col,op,tile,scroll,sm=1.0):
        return {'id':lid,'t':'mesh','at':T_WALL,'life':wl,'att':'ground','shape':'model','model':'wind_eye_ringwall','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,
            'uvTile':tile,'uvScroll':scroll,'pos':[0,0,0],'scale':keys(T_WALL,T_END,[(t,[s[0]*sm,s[1],s[2]*sm]) for t,s in st]),
            'op':keys(T_WALL,T_END,[(T_WALL,0),(T_WALL+.1,op),(T_END-.3,op),(T_END,0)]),'fade':0}
    if C:
        L.append(wall('s4_wall','tex/wind_air_band',WHITE,.7,[11,2],[.25,0]))
        L.append(wall('s4_wall2','tex/wind_air_band',MINT,.5,[8,1],[-.18,0],sm=.985))
        L.append(wall('s4_tint','tex/wind_air_rise',GREEN,.3,[9,1],[.03,0],sm=1.012))
    else:
        L.append(wall('s4_wall','tex/wind_air_rise',WHITE,.75,[14,1],[.03,0]))
        L.append(wall('s4_wall2','tex/wind_air_rise',MINT,.4,[9,1],[-.05,0],sm=.98))
        L.append(wall('s4_tint','tex/wind_air_rise',GREEN,.22,[9,1],[.02,0],sm=1.017))
    L.append({'id':'s4_up','t':'emit','at':T_WALL,'life':.12,'att':'ground','pos':[0,0,0],'from':'mesh','of':'s4_wall','burst':80,'rate':0,'dir':'up','speed':[6,10],'plife':[.25,.45],
        'look':'streak','size':[1.4,2.6],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1.5,'curl':False})
    L.append({'id':'s4_wdust','t':'emit','at':T_WALL,'life':.15,'att':'ground','pos':[0,.05,0],'from':'mesh','of':'s4_wall','burst':40,'rate':0,'dir':'up','speed':[1,2.5],'up':[.2,.8],'plife':[.7,1.2],
        'look':'smoke','size':[4,7],'grow':.6,'col':'#ddd6c3','c2':'#b3aa92','gravity':0,'drag':1.6,'curl':True,'fin':10})
    # ===== shot 3: blast (2.38) — wings flick, air bursts OUT from the caster to the ring =====
    L.append({'id':'s3_shock','t':'warp','at':T_IMP,'life':.5,'att':'ground','pos':[0,.2,0],'kind':'shock','flat':True,'size':{'0':2,'1':R*2.1},'str':1.6,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    L.append({'id':'s3_shock2','t':'warp','at':T_IMP,'life':.3,'att':'ground','pos':[0,1.3,0],'kind':'shock','size':{'0':1,'1':9},'str':1.2,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    L.append({'id':'s3_flash','t':'flash','at':T_IMP,'life':.15,'att':'ground','pos':[0,1.3,0],'size':3,'col':'#efffe8','k':1.3})
    rl=.42
    L.append({'id':'s3_roll','t':'mesh','at':T_IMP,'life':rl,'att':'ground','shape':'model','model':'wind_eye_roll','mat':'tex','tex':'tex/wind_air_band','col':WHITE,'col2':'#000000','rim':0,
        'uvTile':[18,1],'uvScroll':[.6,0],'pos':[0,0,0],'scale':{'0':[1.5,1.5,1.5],'0.5':[R*.72,3.4,R*.72],'1':[R,2.6,R],'ease':'out'},'op':{'0':.5,'0.12':1,'0.8':1,'1':0},'fade':0})
    L.append({'id':'s3_roll2','t':'mesh','at':T_IMP+.04,'life':rl,'att':'ground','shape':'model','model':'wind_eye_roll','mat':'tex','tex':'tex/wind_air_band','col':GREEN,'col2':'#000000','rim':0,
        'uvTile':[12,1],'uvScroll':[-.5,0],'pos':[0,0,0],'scale':{'0':[1.2,.6,1.2],'0.5':[R*.65,1.6,R*.65],'1':[R*.95,1.1,R*.95],'ease':'out'},'op':{'0':.2,'0.12':.6,'0.8':.5,'1':0},'fade':0})
    L.append({'id':'s3_ring','t':'ring','at':T_IMP,'life':.45,'att':'ground','pos':[0,.1,0],'col':MINT,'r':R,'op':.6})
    L.append({'id':'s3_ring2','t':'ring','at':T_IMP+.06,'life':.5,'att':'ground','pos':[0,.1,0],'col':GREEN,'r':R*.9,'op':.4})
    L.append({'id':'s3_rays','t':'emit','at':T_IMP,'life':.06,'att':'ground','pos':[0,.9,0],'from':'ring','fr':1.2,'burst':80,'rate':0,'dir':'out','spread':.12,'speed':[30,42],'up':[0,1.5],'plife':[.38,.5],
        'look':'streak','size':[5,8],'col':WHITE,'c2':GREEN,'gravity':0,'drag':.8,'curl':False})
    L.append({'id':'s3_dust','t':'emit','at':T_IMP,'life':.08,'att':'ground','pos':[0,.05,0],'from':'ring','fr':2,'burst':60,'rate':0,'dir':'out','spread':.2,'speed':[16,26],'up':[.2,1],'plife':[.7,1.1],
        'look':'smoke','size':[4,7.5],'grow':.8,'col':'#ddd6c3','c2':'#bdb39c','gravity':0,'drag':2.2,'curl':True,'fin':8})
    L.append({'id':'s3_hit','t':'emit','at':T_IMP+.35,'life':.12,'att':'ground','pos':[0,0,0],'from':'mesh','of':'s4_wall','burst':80,'rate':0,'dir':'up','speed':[7,12],'plife':[.25,.45],
        'look':'streak','size':[1.6,3],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1.4,'curl':False})
    L.append({'id':'s3_shake','t':'screen','at':T_IMP,'life':.35,'shake':8,'flash':.04,'fcol':'#e6fff4','own':True})
    # ===== shot 4: linger — walls breathe, calm air inside =====
    L.append({'id':'s5_rise','t':'emit','at':T_IMP+.5,'life':round(T_END-.3-T_IMP-.5,3),'att':'ground','pos':[0,0,0],'from':'mesh','of':'s4_wall','rate':70,'dir':'up','speed':[2.5,4.5],'plife':[.4,.8],
        'look':'streak','size':[1,2],'col':WHITE,'c2':GREEN,'gravity':0,'drag':.4,'curl':False})
    L.append({'id':'s5_wisp','t':'emit','at':T_IMP+.5,'life':round(T_END-.3-T_IMP-.5,3),'att':'ground','pos':[0,0,0],'from':'mesh','of':'s4_wall','rate':14,'dir':'up','speed':[.6,1.4],'plife':[1,1.6],
        'look':'smoke','size':[3,5],'grow':.5,'col':'#f2fff6','c2':'#cfe8d6','gravity':-.3,'drag':.6,'curl':True,'fin':14,'x':True})
    L.append({'id':'s5_base','t':'emit','at':T_IMP+.5,'life':round(T_END-.3-T_IMP-.5,3),'att':'ground','pos':[0,.05,0],'from':'mesh','of':'s4_wall','rate':18,'dir':'flat','speed':[.5,1.2],'up':[.05,.3],'plife':[1,1.6],
        'look':'smoke','size':[3,5.5],'grow':.4,'col':'#e3ddcb','c2':'#bdb39c','gravity':0,'drag':1,'curl':True,'fin':14,'x':True})
    L.append({'id':'s5_calm','t':'emit','at':T_IMP+.6,'life':round(T_END-.4-T_IMP-.6,3),'att':'ground','pos':[0,.4,0],'from':'disc','fr':R-3,'rate':30,'dir':'tangent','speed':[2,3.5],'up':[.1,.5],'plife':[.5,.9],
        'look':'streak','size':[1,1.8],'col':MINT,'c2':GREEN,'gravity':0,'drag':.3,'curl':True})
    # ===== shot 5: fade — walls lose their push, lines drift up =====
    L.append({'id':'s6_lift','t':'emit','at':T_END-.3,'life':.12,'att':'ground','pos':[0,0,0],'from':'mesh','of':'s4_wall','burst':80,'rate':0,'dir':'up','speed':[1.5,3],'plife':[.4,.7],'look':'streak','size':[1,1.8],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1.2,'curl':True})
    L.append({'id':'s6_puff','t':'emit','at':T_END-.3,'life':.1,'att':'ground','pos':[0,0,0],'from':'mesh','of':'s4_wall','burst':40,'rate':0,'dir':'up','speed':[.8,1.6],'plife':[.6,1],'look':'smoke','size':[3.5,6],'grow':.6,
        'col':'#f2fff6','c2':'#cfe8d6','gravity':-.4,'drag':.8,'curl':True,'fin':10})
    L=[l for l in L if l['id']!='s1_beam']
    desc={'a':'Eye of Heaven sb#20 แบบ A "ตาเส้นแสง" — รอยแยกบนฟ้าเปิดเป็นตาเส้นขาว-เขียว ม่านตาวงเรือง → ปักไม้: ลมหมุนปั่นป่วนทั้งเขต 17.5 ม. + กำแพงลมวง 8 ชิ้น (ลมใส สูง 5.4) ขึ้นทันที → สะบัดปีก: วงคลื่นลมระเบิดออกไปชนกำแพง → กำแพงอยู่ถึง 7.4 วิแล้วสลาย',
          'b':'Eye of Heaven sb#20 แบบ B "ตาวังวน" — ม่านตาเป็นวังวนลมหมุน • วงลมหมุนใหญ่ขึ้นทั่วเขต • กำแพงวงขึ้นเตี้ย ๆ ก่อน แล้วระเบิดลมพัดไปชนจนพุ่งสูงเต็ม (ลำดับแบบภาพร่าง: ระเบิด → กำแพง)',
          'c':'Eye of Heaven sb#20 แบบ C "ตาสวรรค์จ้องนาน" — ตาใหญ่กว่าและสูงกว่า ลืมค้างจ้องลงมาจนสะบัดปีกแล้วหลับพร้อมระเบิด • ลมปั่นป่วนหนาขึ้น • กำแพงวงเป็นม่านแถบลมพัดผ่านแนวนอน'}[v]
    return {'v':1,'desc':desc,'tags':['wind','ult','storyboard'],'pal':'wind','dur':DUR,'seed':20,'layers':L}

for v in 'abc':
    save(ROOT/f'assets/fx/wind/eye_sb_{v}.fx.json',build(v))
print('wind/eye_sb_a|b|c + mesh wind_eye_lid/iris/disc/vortex/ringwall/roll')

# =====================================================================
# IN-GAME pieces of variant B "ตาวังวน" (user picked B 2026-11-05) — played from js/68-wind-view.js windEfx
#  wind/eye_ult   at the caster on 'wnult' (aim:false): rift → vortex eye, slam turbulence, blast at 2.38 (= W_UL.imp)
#                 (no ring wall / no screen shake here: walls are real objects, shake comes from wnulslam/wnulimp)
#  wind/eye_wall  per ring segment on 'wnwup' m:2 (at the segment centre, a = outward): low wall → surges
#                 when the blast reaches it (2.38−1.15 = 1.23 s after it spawns) → lingers → fades at 6.25 s (W_UL.wlife)
#  break / unstable / hit of a segment = the Aegis "ลมใส" files (wind/aegis_break, aegis_unstable, wall_hit)
# =====================================================================
SEG_A=22.5-1.5
def seg_mesh(n=24,shape=6):
    V=[];F=[];a0,a1=math.radians(-SEG_A),math.radians(SEG_A)
    for i in range(n+1):
        a=a0+(a1-a0)*i/n;e=abs(i/n*2-1);hh=max(.12,1-e**shape)**.5
        V+=[r3([R*math.sin(a),0,R*math.cos(a)]),r3([R*math.sin(a),hh,R*math.cos(a)])]
        if i<n:F.append([2*i,2*i+2,2*i+3,2*i+1])
    return {'id':'w','k':'poly','v':V,'f':F}
save(ROOT/'assets/fx/mesh/wind_eye_seg.mesh.json',{'v':1,'desc':'Eye of Heaven: กำแพงวง 1 ชิ้น (โค้ง 42° ของวงรัศมี 17.5 ม.) สูง 1 — จุดศูนย์กลางวง = จุด 0 (กลางชิ้นอยู่ z=+17.5)','pal':'wind','mat':'solid','parts':[seg_mesh()]})
def g_ult():
    F=build('b',game=True);drop=('s4_','s5_rise','s5_wisp','s5_base','s6_','s3_hit','s3_shake')
    L=[l for l in F['layers'] if not l['id'].startswith(drop)]
    for l in L:
        i=l['id']
        if i in('s2_curl','s2_lift'):l['size']=[2,3.5];l['pos']=[0,.6,0]
        if i=='s2_curl':l['rate']={'0':80,'0.3':120,'1':130}
        if i=='s2_haze':l['size']=9;l['pos']=[0,1.5,9]
        if i.startswith('s2_sw') and not i.startswith('s2_swg'):l['op']={'0':0,'0.15':.65,'0.85':.55,'1':0}
        if i.startswith('s2_swg'):l['op']={'0':0,'0.15':.14,'0.85':.1,'1':0}
        if i in('s3_roll','s3_roll2'):
            sc=l['scale'];l['scale']={'0':[3.5,sc['0'][1],3.5],'0.5':sc['0.5'],'1':sc['1'],'ease':'out'}
            l['op']={k:round(v*(.6 if i=='s3_roll' else .7),3) for k,v in l['op'].items()}
        if i in('s3_flash','s2_flash'):l['k']=.7;l['size']=1.6
        if i=='s3_rays':l['size']=[3,5];l['pos']=[0,.6,0]
        if i=='s1_glow':l['int']={'0':0,'0.3':1.2,'0.8':1,'1':0}
    return {'v':1,'desc':'Eye of Heaven (อัลติสายลม) แบบ B "ตาวังวน" (ผู้ใช้เลือก 2026-11-05, สตอรี่บอร์ด #20): รอยแยกบนฟ้าลืมเป็นตาวังวน → ปักไม้ 1.0 วิ ลมปั่นป่วนทั้งเขต 17.5 ม. → สะบัดปีก 2.38 วิ วงคลื่นลมระเบิดออก • กำแพงวงแยกเป็น wind/eye_wall ต่อชิ้น',
        'tags':['wind','ult'],'pal':'wind','dur':7.1,'seed':20,'layers':L}
def g_seg():
    WH=5.4;LF=T_END-T_WALL;HIT=T_IMP-T_WALL;U=lambda t:str(round(t/LF,4));ZC=-R
    st={'0':[1,.08*WH,1],U(.2):[1,.36*WH,1],U(HIT+.3):[1,.4*WH,1],U(HIT+.42):[1,1.08*WH,1],U(HIT+.55):[1,WH,1],U(LF-.3):[1,WH,1],'1':[1,.85*WH,1]}
    def wl(lid,col,op,tile,scroll,sm=1.0):
        return {'id':lid,'t':'mesh','at':0,'life':round(LF,3),'att':'ground','shape':'model','model':'wind_eye_seg','mat':'tex','tex':'tex/wind_air_rise','col':col,'col2':'#000000','rim':0,
            'uvTile':[tile,1],'uvScroll':scroll,'pos':[0,0,ZC],'scale':{k:[v[0]*sm,v[1],v[2]*sm] for k,v in st.items()},'op':{'0':0,U(.1):op,U(LF-.3):op,'1':0},'fade':0}
    L=[wl('wall',WHITE,.75,14,[.03,0]),wl('wall2',MINT,.4,9,[-.05,0],.98),wl('tint',GREEN,.22,9,[.02,0],1.017)]
    SM=dict(look='smoke',curl=True,fin=10)
    L.append({'id':'up','t':'emit','at':0,'life':.12,'att':'ground','pos':[0,0,ZC],'from':'mesh','of':'wall','burst':16,'rate':0,'dir':'up','speed':[5,8],'plife':[.25,.45],'look':'streak','size':[1.4,2.6],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1.5,'curl':False})
    L.append(dict(SM,id='dust',t='emit',at=0,life=.15,att='ground',pos=[0,.05,ZC],**{'from':'mesh'},of='wall',burst=6,rate=0,dir='up',speed=[1,2.5],up=[.2,.8],plife=[.7,1.2],size=[4,7],grow=.6,col='#ddd6c3',c2='#b3aa92',gravity=0,drag=1.6))
    L.append({'id':'surge','t':'emit','at':round(HIT+.33,3),'life':.12,'att':'ground','pos':[0,0,ZC],'from':'mesh','of':'wall','burst':24,'rate':0,'dir':'up','speed':[7,12],'plife':[.25,.45],'look':'streak','size':[1.6,3],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1.4,'curl':False})
    L.append(dict(SM,id='sdust',t='emit',at=round(HIT+.33,3),life=.12,att='ground',pos=[0,.05,ZC],**{'from':'mesh'},of='wall',burst=8,rate=0,dir='aim',yaw=0,spread=1,speed=[2,4],up=[.2,.9],plife=[.7,1.1],size=[4,7],grow=.6,col='#ddd6c3',c2='#b3aa92',gravity=0,drag=1.8))
    LL=round(LF-HIT-.8,3)
    L.append({'id':'rise','t':'emit','at':round(HIT+.5,3),'life':LL,'att':'ground','pos':[0,0,ZC],'from':'mesh','of':'wall','rate':10,'dir':'up','speed':[2.5,4.5],'plife':[.4,.8],'look':'streak','size':[1,2],'col':WHITE,'c2':GREEN,'gravity':0,'drag':.4,'curl':False})
    L.append(dict(SM,id='wisp',t='emit',at=round(HIT+.5,3),life=LL,att='ground',pos=[0,0,ZC],**{'from':'mesh'},of='wall',rate=2,dir='up',speed=[.6,1.4],plife=[1,1.6],size=[3,5],grow=.5,col='#f2fff6',c2='#cfe8d6',gravity=-.3,drag=.6,fin=14,x=True))
    L.append(dict(SM,id='base',t='emit',at=round(HIT+.5,3),life=LL,att='ground',pos=[0,.05,ZC],**{'from':'mesh'},of='wall',rate=3,dir='flat',speed=[.5,1.2],up=[.05,.3],plife=[1,1.6],size=[3,5.5],grow=.4,col='#e3ddcb',c2='#bdb39c',gravity=0,drag=1,fin=14,x=True))
    L.append({'id':'lift','t':'emit','at':round(LF-.3,3),'life':.12,'att':'ground','pos':[0,0,ZC],'from':'mesh','of':'wall','burst':16,'rate':0,'dir':'up','speed':[1.5,3],'plife':[.4,.7],'look':'streak','size':[1,1.8],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1.2,'curl':True})
    L.append(dict(SM,id='puff',t='emit',at=round(LF-.3,3),life=.1,att='ground',pos=[0,0,ZC],**{'from':'mesh'},of='wall',burst=6,rate=0,dir='up',speed=[.8,1.6],plife=[.6,1],size=[3.5,6],grow=.6,col='#f2fff6',c2='#cfe8d6',gravity=-.4,drag=.8))
    return {'v':1,'desc':'Eye of Heaven แบบ B: กำแพงวง 1 ชิ้น (เล่นต่อชิ้น ที่กลางชิ้น a = หันออกนอกวง) ขึ้นเตี้ยก่อน → 1.23 วิ ระเบิดลมมาชนแล้วพุ่งสูง 5.4 ม. → อยู่ถึง 6.25 วิ แล้วยุบจาง • ใช้ภาพลมใสแบบ Aegis',
        'tags':['wind','ult','wall'],'pal':'wind','dur':round(LF,3),'seed':21,'layers':L}
save(ROOT/'assets/fx/wind/eye_ult.fx.json',g_ult());save(ROOT/'assets/fx/wind/eye_wall.fx.json',g_seg())
print('in-game: wind/eye_ult + wind/eye_wall + mesh wind_eye_seg')
