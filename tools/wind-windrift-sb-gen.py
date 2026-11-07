# Windrift — storyboard #19 (user 2026-11-05) → two variants: wind/windrift_sb_a, wind/windrift_sb_b
# Run: python tools/wind-windrift-sb-gen.py then node tools/fx-check.js • view studio.html?fx=wind/windrift_sb_a
# Timing follows the CODE (js/09-wind.js W_DR), not the guessed board shots:
#   (2026-11-07 faster/farther) charge 0–0.2 • dash 0.2–0.29 (400 = 20 m) • hero landing 0.29 • wind follows 0.6 s later = 0.89
#   along the dash line (width 100 = ±2.5 m) pushing foes forward (400 = 20 m) • fade by 1.9.
# The fx is played once at the cast point (no follow), so dash layers move by themselves along +z.
# Wings are NOT in the fx: the game draws the wind wings on the body (js/68-wind-view.js makeWindWings).
# Sketch (frames): 1-2 green wind spiral around the caster's legs • 3 white speed lines behind + a big air ring in front (Jett)
#   • 4-5 lines + ring follow the dash • 6-7 hook-shaped wind curls rising around the caster/target after landing.
import json,math,random
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
G=dict(hi='#ffffff',inner='#efffe8',mid='#8dff65',outer='#2ec772',deep='#196a40')
T=lambda n:'tex/'+n
T_GO,T_LAND,T_WIND=0.2,0.29,0.89
DASH=20.0
WEND=26.0          # how far the follow-up wind reaches (foes are blown ~20 m — fade before that)
DUR=2.0
def dash_z(t):
    if t<=T_GO:return 0.0
    if t>=T_LAND:return DASH
    u=(t-T_GO)/(T_LAND-T_GO);return DASH*(1-(1-u)**3)
def lift(t):       # small hover while charging (code: vz 2.5), drops on landing
    if t<=T_GO:return 0.5*min(1,t/T_GO)
    if t<=T_LAND:return 0.5*(1-(t-T_GO)/(T_LAND-T_GO))
    return 0.0
def ck(t,a,l):return str(round((t-a)/l,3))
def path(y,x,a,l,keys):return {ck(t,a,l):[x,round(y+lift(t),3),round(dash_z(t),3)] for t in keys}
def tex(id,at,life,model,tx,col,pos,**k):
    d={'id':id,'t':'mesh','at':round(at,3),'life':round(life,3),'att':'feet','shape':'model','model':model,'mat':'tex','tex':T(tx),
       'col':col,'col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],'pos':pos,'fade':0}
    d.update(k);return d

def common_dash(L,rg,style):
    """shots 2-3: launch + dash trails (both variants)"""
    DK=[T_GO+i*(T_LAND-T_GO)/6 for i in range(7)]+[T_LAND+.03]
    a,l=T_GO,T_LAND+.03-T_GO
    lines=[(0,1.3,.14,G['hi']),(-.45,1.9,.09,G['inner']),(.45,1.9,.09,G['inner']),(0,.6,.1,G['mid']),(-.9,1.1,.07,G['mid']),(.9,1.1,.07,G['mid']),(-.3,2.4,.06,G['hi']),(.35,.25,.06,G['inner'])]
    for i,(x,y,w,c) in enumerate(lines):
        L.append({'id':f's3_trail{i}','t':'trail','at':T_GO,'life':.5,'att':'feet','pos':path(y,x,a,l,DK),'col':c,'col2':G['outer'],'w':w,'tlife':.32 if style=='a' else .22,'k':1.1})
    L.append({'id':'s3_streaks','t':'emit','at':T_GO,'life':T_LAND-T_GO,'att':'feet','pos':path(1.2,0,a,l,DK),'rate':160,'from':'sphere','fr':1.0,'dir':'aim','yaw':180,'spread':.1,
        'speed':[8,16],'plife':[.12,.22],'look':'streak','size':[.9,1.7],'col':G['inner'],'c2':G['mid'],'gravity':0,'drag':2,'curl':False})
    L.append({'id':'s2_launch','t':'warp','at':T_GO,'life':.22,'att':'feet','pos':[0,1.2,.3],'kind':'shock','size':{'0':.4,'1':3.2},'str':.9,'op':{'0':1,'1':0},'col':G['inner'],'glow':.03})
    L.append({'id':'s2_kick','t':'emit','at':T_GO,'life':.06,'att':'feet','pos':[0,.08,-.2],'burst':30,'rate':0,'from':'disc','fr':.5,'dir':'aim','yaw':180,'spread':.6,'up':[.2,1.2],
        'speed':[4,9],'plife':[.25,.5],'look':'smoke','size':[4,7],'col':'#d9e6dc','c2':'#9fb3a4','gravity':0,'drag':3,'curl':False})

def shot1(L,style):
    """charge 0–0.3: green wind spiral wraps the caster from the feet up (sketch frames 1-2)"""
    if style=='a':
        for k,(tx,col,sc,y0,sp) in enumerate([('wind_swoosh_b',G['mid'],1.0,.15,720),('wind_swoosh_a_hi',G['hi'],.8,.55,-720),('wind_swoosh_b',G['mid'],.65,1.0,720)]):
            L.append(tex(f's1_wrap{k}',k*.02,(.33-k*.03)*(T_GO/.3),f'wind_pieces{k}',tx,col,{'0':[0,y0,0],'1':[0,y0+.45,0]},rot=[0,k*60,0],
                scale={'0':[sc*1.3,.25,sc*1.3],'0.6':[sc*.75,.4,sc*.75],'1':[sc*.55,.5,sc*.55],'ease':'in'},spin=sp,op={'0':0,'0.2':.95,'0.8':.9,'1':0}))
        L.append(tex('s1_ground',0,.33*(T_GO/.3),'wind_groundswirl','wind_swoosh_b',G['mid'],[0,.05,0],scale={'0':1.8,'1':.7,'ease':'in'},spin=-540,op={'0':0,'0.2':.85,'1':0}))
    else:   # B: clear twisting air column (Vortex Bind / Aegis "clear wind" look) around the caster
        for k,(m,col,op,ut,sp) in enumerate([('wind_vortex_air','#ffffff',.85,3,520),('wind_vortex_air2','#d8ffe0',.5,2,-420),('wind_vortex_air','#8dff65',.35,2,640)]):
            L.append(tex(f's1_air{k}',0,.34*(T_GO/.3),m,'wind_air_rise',col,{'0':[0,0,0],'1':[0,.35,0]},uvTile=[ut,1],uvScroll=[-.5,0],rot=[0,k*60,0],
                scale={'0':.75,'0.5':.55,'1':.42,'ease':'in'},spin=sp,op={'0':0,'0.25':op,'0.85':op,'1':0}))
        L.append({'id':'s1_dust','t':'emit','at':0,'life':.28*(T_GO/.3),'att':'feet','pos':[0,.05,0],'rate':90,'from':'ring','fr':1.4,'dir':'in','speed':[2,4],'up':[.3,1],'plife':[.3,.5],
            'look':'smoke','size':[3,5],'col':'#e2ece4','c2':'#a9bcae','gravity':-.5,'drag':1,'curl':True})
        L.append({'id':'s1_haze','t':'warp','at':0,'life':.32*(T_GO/.3),'att':'feet','pos':[0,1,0],'kind':'haze','size':2.2,'str':.7,'op':{'0':0,'0.3':1,'1':0},'col':G['inner'],'glow':0})
    L.append({'id':'s1_in','t':'emit','at':0,'life':.26*(T_GO/.3),'att':'feet','pos':[0,1.2,-.1],'rate':150,'from':'sphere','fr':1.9,'dir':'in','speed':[7,11],'plife':[.12,.18],
        'look':'streak','size':[1,1.9],'col':G['hi'],'c2':G['mid'],'gravity':0,'drag':0,'curl':False})
    L.append({'id':'s1_wingglow','t':'halo','at':.03,'life':.27*(T_GO/.3),'att':'feet','pos':[0,1.55,-.35],'col':G['mid'],'size0':.6,'size':2.0,'k':.5})
    L.append({'id':'s1_light','t':'light','at':0,'life':.35*(T_GO/.3),'att':'feet','pos':[0,1.6,0],'col':G['mid'],'int':{'0':0,'0.8':1.8,'1':0},'dist':6})

def shot2_ring(L,style):
    """release 0.3: the big air ring punched in front of the caster (sketch frame 3) — the caster flies through it"""
    RZ=1.6
    if style=='a':
        for k,(tx,col,sc,sp) in enumerate([('wind_swoosh_a_hi',G['hi'],1.15,-600),('wind_swoosh_b',G['mid'],1.45,500)]):
            L.append(tex(f's2_ring{k}',T_GO-.02,.24,'wind_groundswirl',tx,col,[0,1.25,RZ],rot=[90,0,0],
                scale={'0':sc*.35,'0.3':sc,'1':sc*1.2,'ease':'out'},spin=sp,op={'0':0,'0.12':.95,'0.6':.7,'1':0}))
    else:
        for k,(sc,sp) in enumerate([(1.0,-420),(1.35,380)]):
            L.append(tex(f's2_ring{k}',T_GO-.02,.26,'wind_groundswirl','wind_swoosh_a_ln','#f2fff0' if k==0 else '#c9ffb5',[0,1.25,RZ],rot=[90,0,0],
                scale={'0':sc*.3,'0.3':sc,'1':sc*1.25,'ease':'out'},spin=sp,op={'0':0,'0.12':.8,'0.6':.5,'1':0}))
        # air tunnel = GaleBurst helix stretched along the dash (cone lying forward)
        L.append(tex('s3_tunnel',T_GO,.4,'wind_gbhelix','wind_swoosh_a_ln','#eaffe2',{'0':[0,1.1,0],'1':[0,1.0,.5]},rot=[0,0,0],
            scale={'0':[1.0,1.0,1.5],'0.35':[1.3,1.3,DASH+.5],'1':[1.7,1.7,DASH+1]},spin=500,op={'0':0,'0.15':.75,'0.6':.45,'1':0}))
    L.append({'id':'s2_ringwarp','t':'warp','at':T_GO,'life':.26,'att':'feet','pos':[0,1.25,RZ],'kind':'shock','size':{'0':.5,'1':3.4},'str':1.1,'op':{'0':1,'1':0},'col':G['inner'],'glow':.03})
    L.append({'id':'s2_burst','t':'emit','at':T_GO,'life':.05,'att':'feet','pos':[0,1.25,RZ],'burst':36,'rate':0,'from':'ring','fr':1.0,'dir':'out','speed':[5,9],'plife':[.15,.3],
        'look':'streak','size':[1,1.8],'col':G['hi'],'c2':G['mid'],'gravity':0,'drag':3,'curl':False})

def hook_trails(L,LZ,hooks,c1,c2,w,at0=T_LAND+.02,life=.42):
    """trail heads that draw a hook: rise around the centre (slight swirl), then curl outward + over (radius .45 m)"""
    N=14
    for j,(ang,r0,h,turn) in enumerate(hooks):
        P={}
        for i in range(N+1):
            u=i/N
            if u<=.65:
                v=u/.65;a=math.radians(ang+turn*55*v);rr=r0;y=.1+h*v
                x,z=math.sin(a)*rr,math.cos(a)*rr
            else:
                v=(u-.65)/.35;a=math.radians(ang+turn*55);phi=v*math.radians(260);cr=.45
                rad=(math.sin(a),math.cos(a))
                d=r0+cr-cr*math.cos(phi);y=.1+h+cr*math.sin(phi)
                x,z=rad[0]*d,rad[1]*d
            P[str(round(u,3))]=[round(x,3),round(y,3),round(LZ+z,3)]
        t0=round(at0+j*.035,3)
        L.append({'id':f's4_hook{j}','t':'trail','at':t0,'life':life,'att':'feet','pos':P,'col':c1,'col2':c2,'w':w,'tlife':.7,'k':1.3})
        L.append({'id':f's4_hookg{j}','t':'trail','at':round(t0+.03,3),'life':life,'att':'feet','pos':{k:[v[0]*1.08,v[1]-.08,LZ+(v[2]-LZ)*1.08] for k,v in P.items()},
            'col':c2,'col2':G['outer'],'w':w*.75,'tlife':.6,'k':1.1})

def shot4_land(L,rg,style):
    """hero landing 0.45–~1.1: hook-shaped curls rising around the landing spot + ground swirl (sketch frames 6-7)"""
    LZ=DASH
    L.append({'id':'s4_dust','t':'emit','at':T_LAND,'life':.06,'att':'feet','pos':[0,.08,LZ],'burst':40,'rate':0,'from':'ring','fr':.5,'dir':'flat','speed':[4,8],'up':[.2,1.2],
        'plife':[.35,.7],'look':'smoke','size':[4,7],'col':'#e2ece4','c2':'#a9bcae','gravity':0,'drag':3,'curl':True})
    L.append({'id':'s4_spray','t':'emit','at':T_LAND,'life':.05,'att':'feet','pos':[0,.1,LZ],'burst':40,'rate':0,'from':'ring','fr':.4,'dir':'flat','speed':[6,11],'up':[.5,2],
        'plife':[.18,.35],'look':'streak','size':[1.2,2.2],'col':G['hi'],'c2':G['outer'],'gravity':3,'drag':3,'curl':False})
    L.append({'id':'s4_shock','t':'warp','at':T_LAND,'life':.25,'att':'feet','pos':[0,.15,LZ],'kind':'shock','flat':True,'size':{'0':.5,'1':5},'str':1,'op':{'0':1,'1':0},'col':G['inner'],'glow':.02})
    L.append({'id':'s4_shake','t':'screen','at':T_LAND,'life':.1,'shake':1.2,'own':True})
    if style=='a':
        for k,(tx,col,sc,sp) in enumerate([('wind_swoosh_a_hi',G['hi'],1.3,420),('wind_swoosh_b',G['mid'],1.8,-360)]):
            L.append(tex(f's4_ground{k}',T_LAND,.6,'wind_groundswirl',tx,col,[0,.05+k*.03,LZ],rot=[0,k*120,0],
                scale={'0':sc*.3,'0.4':sc,'1':sc*1.25,'ease':'out'},spin=sp,op={'0':0,'0.1':.75,'0.6':.45,'1':0}))
        # rising hooks = the sketch's "?" strokes: a line climbs from the ground around the landing spot, then curls outward and over
        hook_trails(L,LZ,[(20,1.1,2.6,1),(140,1.3,2.2,-1),(250,1.0,3.0,1),(80,1.6,1.8,-1),(200,1.5,2.4,1),(310,1.4,2.0,-1)],G['hi'],G['mid'],.15)
    else:   # B: stacked swirl rings like the reference picture (spiral discs piled up, spinning, rising)
        for k in range(4):
            y=.1+k*.6;sc=2.2-k*.35
            for c,(tx,col,op) in enumerate([('wind_swoosh_a_hi','#ffffff',.95),('wind_swoosh_b','#8dff65',.55)]):
                L.append(tex(f's4_stack{k}_{c}',T_LAND+k*.04+c*.02,.7,'wind_groundswirl',tx,col,
                    {'0':[0,y*.4,LZ],'0.35':[0,y,LZ],'1':[0,y+.5,LZ],'ease':'out'},rot=[0,k*70+c*40,0],scale={'0':sc*.3,'0.35':sc*(1+c*.12),'1':sc*1.3,'ease':'out'},spin=(560 if (k+c)%2 else -560),
                    op={'0':0,'0.12':op,'0.6':op*.6,'1':0}))
        for k,(m,col,op,ut,sp) in enumerate([('wind_vortex_air','#ffffff',.8,3,480),('wind_vortex_air','#8dff65',.3,2,620)]):
            L.append(tex(f's4_column{k}',T_LAND,.65,m,'wind_air_rise',col,[0,0,LZ],uvTile=[ut,1],uvScroll=[-.5,0],rot=[0,k*90,0],
                scale={'0':.25,'0.3':.8,'1':1.05,'ease':'out'},spin=sp,op={'0':0,'0.15':op,'0.7':op*.6,'1':0}))
        L.append({'id':'s4_haze','t':'warp','at':T_LAND,'life':.6,'att':'feet','pos':[0,1.2,LZ],'kind':'haze','size':2.5,'str':.6,'op':{'0':1,'1':0},'col':G['inner'],'glow':0})
    L.append({'id':'s4_chips','t':'emit','at':T_LAND+.02,'life':.4,'att':'feet','pos':[0,.4,LZ],'rate':40,'from':'ring','fr':1.0,'dir':'tangent','speed':[3,5],'up':[2,4],
        'plife':[.4,.7],'look':'model','model':'wind_leaf','mmat':'glow','msize':[.12,.22],'col':G['mid'],'c2':G['outer'],'mspin':500,'gravity':-.3,'drag':1,'bounce':0,'x':True})

def shot5_wind(L,rg,style):
    """wind follows 1.45: strong gust sweeps the dash line (±2.5 m) and blows on past the caster; lingers to 2.2, fades by 2.5"""
    WL=DUR-T_WIND-.05
    n=26 if style=='a' else 20
    for i in range(n):
        wave=i%3;y=rg.uniform(.2,2.8);x=rg.uniform(-2.2,2.2);t0=T_WIND+wave*.16+rg.uniform(-.02,.06);ln=rg.uniform(4,7);wl=rg.uniform(.5,.65)
        z0=rg.uniform(-2,2)+wave*3;z1=min(WEND+2,z0+rg.uniform(22,28))
        if style=='a':tx,col=[('wind_swoosh_a_hi',G['hi']),('wind_swoosh_b',G['mid']),('wind_swoosh_a',G['outer']),('wind_swoosh_b',G['mid'])][i%4];op=.9 if wave<2 else .7
        else:tx,col=[('wind_swoosh_a_hi','#ffffff'),('wind_swoosh_b_ln','#d2ffc0')][i%2];op=.85
        L.append(tex(f's5_line{i}',t0,wl,'wind_slashstroke',tx,col,
            {'0':[round(x,2),round(y,2),round(z0,2)],'0.5':[round(x,2),round(y-.1,2),round(z0+(z1-z0)*.7,2)],'1':[round(x,2),round(y-.2,2),round(z1,2)],'ease':'out'},
            rot=[rg.choice([88,92]),0,90],scale={'0':[ln*.4,1,.5],'0.3':[ln,1,.75],'1':[ln*1.4,1,.3]},op={'0':0,'0.1':op,'0.7':op*.7,'1':0}))
    if style=='a':
        # curls riding the wind front (side-view spirals) — two waves, the second passes the landing point
        for j,(y,sz,dz,wv) in enumerate([(2.2,.9,-2,0),(1.4,.8,-.5,0),(.7,.85,.5,0),(1.8,.6,-3,0),(2.5,.7,-1,1),(1.0,.95,-2.5,1),(.5,.6,0,1)]):
            zs=3+dz+wv*4;ze=WEND-2+dz*.3+wv
            for k,(tx,col,m) in enumerate([('wind_swoosh_a_hi',G['hi'],1.0),('wind_swoosh_b',G['mid'],1.25)]):
                L.append(tex(f's5_curl{j}_{k}',T_WIND+.03+j*.025+wv*.25,.6,f'wind_pieces{(j+k)%3}',tx,col,
                    {'0':[0,y,round(zs,2)],'0.4':[0,y,round(ze-1,2)],'1':[0,y+.4,round(ze+.6,2)],'ease':'out'},rot=[0,90,j*40],
                    scale={'0':[.3*sz*m,.2,.3*sz*m],'0.35':[sz*m,.3,sz*m],'1':[1.5*sz*m,.2,1.5*sz*m],'ease':'out'},spin=(-650 if j%2 else 650),op={'0':0,'0.1':.9,'0.7':.5,'1':0}))
    else:
        # wide air tunnel (GaleBurst helix lying forward) rolls down the dash line and on past the landing
        for k,(col,op,sc,sp) in enumerate([('#ffffff',.7,1.1,420),('#8dff65',.35,1.35,-360)]):
            L.append(tex(f's5_tunnel{k}',T_WIND+k*.05,.72,'wind_gbhelix','wind_swoosh_a_hi' if k==0 else 'wind_swoosh_b',col,
                {'0':[0,1.3,-2],'1':[0,1.3,WEND-7],'ease':'out'},scale={'0':[sc*.6,sc*.6,3],'0.3':[sc,sc,12],'1':[sc*1.1,sc*1.1,14]},spin=sp,op={'0':0,'0.12':op,'0.65':op*.6,'1':0}))
        L.append({'id':'s5_dust','t':'emit','at':T_WIND,'life':.6,'att':'feet','pos':{'0':[0,.08,0],'1':[0,.08,WEND-2]},'rate':80,'from':'disc','fr':2.2,'dir':'aim','spread':.3,'up':[.2,1],
            'speed':[6,10],'plife':[.4,.8],'look':'smoke','size':[4,7],'col':'#e2ece4','c2':'#a9bcae','gravity':-.3,'drag':1.5,'curl':True})
    L.append({'id':'s5_gust','t':'emit','at':T_WIND,'life':.75,'att':'feet','pos':{'0':[0,1.3,0],'0.4':[0,1.3,WEND-4],'1':[0,1.3,WEND-2]},'rate':140,'from':'sphere','fr':2.0,'dir':'aim','spread':.08,
        'speed':[16,24],'plife':[.15,.3],'look':'streak','size':[1,2.2],'col':G['mid'] if style=='a' else G['inner'],'c2':G['outer'],'gravity':0,'drag':1,'curl':False})
    L.append({'id':'s5_floor','t':'emit','at':T_WIND,'life':.75,'att':'feet','pos':{'0':[0,.08,0],'0.4':[0,.08,WEND-3],'1':[0,.08,WEND-2]},'rate':120,'from':'disc','fr':2.2,'dir':'aim','spread':.25,'up':[0,.6],
        'speed':[8,14],'plife':[.2,.45],'look':'streak','size':[1,1.8],'col':G['inner'],'c2':G['outer'],'gravity':1,'drag':1.5,'curl':False})
    L.append({'id':'s5_leaves','t':'emit','at':T_WIND+.05,'life':.7,'att':'feet','pos':{'0':[0,1,1],'1':[0,1,WEND-3]},'rate':40,'from':'sphere','fr':2.0,'dir':'aim','spread':.3,
        'speed':[9,15],'plife':[.35,.6],'look':'model','model':'wind_leaf','mmat':'glow','msize':[.12,.24],'col':G['mid'],'c2':G['outer'],'mspin':500,'gravity':-.2,'drag':.8,'bounce':0,'x':True})
    L.append({'id':'s5_warp','t':'warp','at':T_WIND,'life':.35,'att':'feet','pos':{'0':[0,1.3,0],'1':[0,1.3,WEND-3]},'kind':'shock','size':{'0':1.5,'1':3.5},'str':.7,'op':{'0':.8,'1':0},'col':G['inner'],'glow':.02})
    L.append({'id':'s5_shake','t':'screen','at':T_WIND+.05,'life':.12,'shake':1,'own':True})
    # shot 6 fade 2.2–2.5: last wisps lift and thin out past the landing point
    L.append({'id':'s6_wisp','t':'emit','at':T_WIND+.8,'life':.25,'att':'feet','pos':[0,.6,WEND-4],'rate':50,'from':'disc','fr':2.5,'dir':'up','speed':[1,2],'plife':[.2,.25],
        'look':'streak','size':[.8,1.4],'col':G['inner'],'c2':G['mid'],'gravity':-.5,'drag':1,'curl':True})

DESC={'a':'Windrift สตอรี่บอร์ด #19 แบบ A "เส้นลมตามภาพร่าง": เกลียวลมเขียวพันขาตอนชาร์จ → วงลมใหญ่ข้างหน้า + เส้นความเร็วขาว/เขียว ตอนพุ่ง 10 ม. → ลงท่าฮีโร่ = เส้นลมงอขอเกี่ยวลอยขึ้น + วงลมพื้น → 1 วิต่อมาลมแรงตามมาตามแนวพุ่ง (เส้นลมยาว + ม้วนลม) พัดไปข้างหน้า',
      'b':'Windrift สตอรี่บอร์ด #19 แบบ B "ลมใส": เสาอากาศบิดเกลียวรอบตัวตอนชาร์จ → วงลม + อุโมงค์ลมเกลียวตามทางพุ่ง → ลงท่าฮีโร่ = วงลมซ้อนชั้นหมุนลอยขึ้น (แบบรูปตัวอย่าง) → 1 วิต่อมาคลื่นลมเตี้ยกลิ้งไปตามแนวพุ่ง + ฝุ่น'}
for style in('a','b'):
    rg=random.Random(19);L=[]
    shot1(L,style);shot2_ring(L,style);common_dash(L,rg,style);shot4_land(L,rg,style);shot5_wind(L,rg,style)
    fx={'v':1,'desc':DESC[style],'tags':['wind','windrift','dash','storyboard'],'pal':'wind','dur':DUR,'seed':19,'layers':L}
    (ROOT/f'assets/fx/wind/windrift_sb_{style}.fx.json').write_text(json.dumps(fx,ensure_ascii=False,indent=1),encoding='utf-8')
    print(f'wind/windrift_sb_{style}',len(L),'layers')
