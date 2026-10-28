# Windrift (สายลม สกิลพุ่งแบบ Jett — Gust เดิม) — storyboard #8. Studio demo only (not bound to the game yet).
# Run: python tools/wind-windrift-gen.py then node tools/fx-check.js • view studio.html?fx=wind/windrift
# Shots (user 2026-10-28): 1 wings charge (rise + spread, glow) 0–.15 • 2 very fast dash ~11 m, enemies in the path get a SLOW
# mark right away (before the wind) • landing = hero landing, wings raised • 3 strong wind follows .25–.35, curls at the front,
# blows the enemy further than the caster • 4 enemy slams the wind wall = crack burst. No ink layer (user: "no ink").
# The studio dummy cannot move, so the wings/trail travel by themselves to show the dash.
import json,math,random
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
WING=json.loads((ROOT/'assets/fx/wind/wing_angular.fx.json').read_text(encoding='utf-8'))
G=dict(inner='#efffe8',mid='#8dff65',outer='#2ec772',hi='#ffffff',line='#196a40',deep='#0f4a2c')
T=lambda n:'tex/'+n
DUR=1.2
T_CH,T_GO,T_LAND,T_WIND,T_HIT=0.0,0.15,0.25,0.25,0.38   # shot starts (s)
DASH=11.0          # dash distance m (~200 units + landing slide)
ENEMY_Z=6.0        # enemy standing in the path
WALL_Z=17.0        # wind wall face the enemy is blown into
WLIFE=0.95         # wing layers life
def ck(t):return str(round(t/WLIFE,3))
def dash_z(t):     # caster z over time: fast ease-out dash, small slide after landing
    if t<=T_GO:return 0.0
    if t>=T_LAND:return DASH+0.4*min(1,(t-T_LAND)/0.12)
    u=(t-T_GO)/(T_LAND-T_GO);return DASH*(1-(1-u)**2.2)
def lift(t):       # rise during charge, drop on landing, crouch (hero landing)
    if t<=T_GO:return 0.35*min(1,t/T_GO)
    if t<=T_LAND:return 0.35*(1-(t-T_GO)/(T_LAND-T_GO))
    return -0.35*min(1,(t-T_LAND)/0.06)
KEYS=[0,.05,.1,.15,.18,.21,.25,.28,.32,.45,.6,.8,WLIFE]
def wing_rot(t,side):   # side +1 = right wing • z = shoulder roll (up), y = sweep back
    z,y=-18,0
    if t<T_GO:u=t/T_GO;z,y=-18+56*u,0                  # charge: rise + spread
    elif t<T_LAND:z,y=30,38                               # dash: swept back
    elif t<.32:u=(t-T_LAND)/.07;z,y=30+32*u,38*(1-u)      # land: raise high (hero landing)
    else:u=min(1,(t-.32)/.4);z,y=62-50*u,0                # settle
    return [0,round(side*y,1),round(side*z,1)]
L=[]
# ---------- wings (reuse the approved angular wing models) ----------
for w in WING['layers']:
    side=1 if w['id'].startswith('R') else -1
    if w['t']=='mesh':
        n=dict(w);n.pop('loop',None);n['at']=0;n['life']=WLIFE
        p0=w['pos'];n['pos']={ck(t):[p0[0],round(p0[1]+lift(t),3),round(p0[2]+dash_z(t),3)] for t in KEYS}
        n['rot']={ck(t):wing_rot(t,side) for t in KEYS}
        b=n.get('op',.3);n['op']={'0':b,ck(.12):min(.85,b*2.6),ck(.25):b*1.8,ck(.6):b*1.4,'1':0}
        L.append(n)
    elif w['id'].endswith(('airchips','motes')):
        n=dict(w);n.pop('loop',None);n['at']=0;n['life']=WLIFE*.8;n['rate']=w['rate']*2;L.append(n)
# feather glow overlay: white flash on the feathers while charging
for side,suf in((1,''),(-1,'_L')):
    p0=[.135*side,1.602,-.238]
    L.append({'id':f's1_glow{suf or "_R"}','t':'mesh','at':0,'life':.32,'att':'feet','shape':'model','model':'wind_wing_angular_feathers'+suf,'mat':'energy',
        'col':G['hi'],'col2':G['mid'],'rim':.8,'fade':0,'scale':1.02,
        'pos':{str(round(t/.32,3)):[p0[0],round(p0[1]+lift(t),3),round(p0[2]+dash_z(t),3)] for t in(0,.08,.15,.2,.25,.32)},
        'rot':{str(round(t/.32,3)):wing_rot(t,side) for t in(0,.08,.15,.2,.25,.32)},'op':{'0':0,'0.35':.75,'0.5':.6,'1':0}})
# ---------- shot 1: charge — short wind dashes drawn in around the wings ----------
L.append({'id':'s1_in','t':'emit','at':0,'life':.14,'att':'feet','pos':[0,2.1,-.3],'rate':160,'from':'sphere','fr':2.0,'dir':'in','speed':[8,12],'plife':[.1,.16],
    'look':'streak','size':[1.2,2.2],'col':G['hi'],'c2':G['mid'],'gravity':0,'drag':0,'curl':False})
L.append({'id':'s1_flash','t':'flash','at':.1,'life':.1,'att':'feet','pos':[0,1.6,-.3],'col':G['mid'],'size0':.3,'size':1.6,'k':.5})
L.append({'id':'s1_light','t':'light','at':0,'life':.3,'att':'feet','pos':[0,1.8,0],'col':G['mid'],'int':{'0':0,'0.5':2.2,'1':0},'dist':6})
# ---------- shot 2: dash — thin clean trails behind the caster (no storm yet) ----------
DK=[T_GO+i*(T_LAND-T_GO)/6 for i in range(7)]+[T_LAND+.02]
def path(y,x=0):return {str(round((t-T_GO)/(T_LAND+.02-T_GO),3)):[x,round(y+lift(t),3),round(dash_z(t),3)] for t in DK}
for i,(x,y,wd,c) in enumerate([(0,1.2,.12,G['inner']),(-.5,1.9,.08,G['mid']),(.5,1.9,.08,G['mid']),(0,.55,.08,G['mid']),(-1.6,2.5,.06,G['mid']),(1.6,2.5,.06,G['mid'])]):
    L.append({'id':f's2_trail{i}','t':'trail','at':T_GO,'life':.45,'att':'feet','pos':path(y,x),'col':c,'col2':G['outer'],'w':wd,'tlife':.3,'k':1.0})
L.append({'id':'s2_streaks','t':'emit','at':T_GO,'life':T_LAND-T_GO,'att':'feet','pos':path(1.3),'rate':110,'from':'sphere','fr':1.1,'dir':'aim','yaw':180,'spread':.12,
    'speed':[6,14],'plife':[.1,.2],'look':'streak','size':[.8,1.6],'col':G['mid'],'c2':G['outer'],'gravity':0,'drag':2,'curl':False})
L.append({'id':'s2_launch','t':'warp','at':T_GO,'life':.2,'att':'feet','pos':[0,1.2,.2],'kind':'shock','size':{'0':.3,'1':2.6},'str':.8,'op':{'0':1,'1':0},'col':G['inner'],'glow':.03})
# slow mark: the enemy in the path is bound right as the caster passes (before the wind arrives)
TS=T_GO+.04
def epos(t):   # enemy z: stands until the wind, then is blown into the wall
    if t<T_WIND+.02:return ENEMY_Z
    u=min(1,(t-T_WIND-.02)/(T_HIT-T_WIND-.02));return ENEMY_Z+(WALL_Z-.5-ENEMY_Z)*(1-(1-u)**1.6)
SL=T_HIT+.08-TS
EK=[TS,T_WIND,T_WIND+.02,T_WIND+.06,T_WIND+.09,T_HIT-.02,T_HIT,T_HIT+.08]
def ep(y):return {str(round((t-TS)/SL,3)):[0,y,round(epos(t),3)] for t in EK}
for j,(y,sc,sp,tex,col) in enumerate([(.35,.75,520,'wind_swoosh_a_hi',G['hi']),(.95,.6,-460,'wind_swoosh_b',G['mid']),(1.5,.5,600,'wind_swoosh_a_hi',G['inner'])]):
    L.append({'id':f's2_slow{j}','t':'mesh','at':TS,'life':round(SL,3),'att':'feet','shape':'model','model':f'wind_pieces{j}','mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[0,0],'pos':ep(y),'rot':[0,j*70,0],'scale':{'0':[1.4*sc,.25,1.4*sc],'0.18':[sc,.3,sc],'1':[sc*.9,.3,sc*.9],'ease':'out'},'spin':sp,
        'op':{'0':0,'0.12':.95,'0.85':.9,'1':0},'fade':0})
L.append({'id':'s2_slowdrag','t':'emit','at':TS,'life':round(SL,3),'att':'feet','pos':ep(.15),'rate':70,'from':'ring','fr':.5,'dir':'aim','yaw':180,'spread':.3,
    'speed':[1.5,3],'plife':[.15,.3],'look':'streak','size':[.8,1.4],'col':G['inner'],'c2':G['outer'],'gravity':0,'drag':1,'curl':False})
# hero landing: ground burst + dust ring where the dash ends
LZ=DASH+.3
L.append({'id':'s2_land','t':'emit','at':T_LAND,'life':.05,'att':'feet','pos':[0,.1,LZ],'burst':45,'rate':0,'from':'ring','fr':.4,'dir':'flat','speed':[5,10],'up':[.3,1.5],
    'plife':[.2,.4],'look':'streak','size':[1.2,2.2],'col':G['inner'],'c2':G['outer'],'gravity':3,'drag':3,'curl':False})
for k,(tex,col,sc) in enumerate([('wind_swoosh_a_hi',G['hi'],1.6),('wind_swoosh_b',G['mid'],2.2)]):
    L.append({'id':f's2_landring{k}','t':'mesh','at':T_LAND,'life':.4,'att':'feet','shape':'model','model':'wind_groundswirl','mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[0,0],'pos':[0,.05+k*.03,LZ],'rot':[0,k*120,0],'scale':{'0':sc*.3,'1':sc,'ease':'out'},'spin':300*(1-2*k),'op':{'0':0,'0.1':.9,'1':0},'fade':0})
L.append({'id':'s2_shake','t':'screen','at':T_LAND,'life':.1,'shake':1.2,'own':True})
# ---------- shot 3: the strong wind follows the path — long streamlines, curls at the front ----------
rg=random.Random(8)
WL=.38
for i in range(14):
    y=rg.uniform(.25,2.9);x=rg.uniform(-1.3,1.3);t0=T_WIND+rg.uniform(-.03,.06);ln=rg.uniform(2.6,4.6)
    z0=rg.uniform(-.5,2.5);z1=min(WALL_Z-1,z0+rg.uniform(11,14))
    tex,col=[('wind_swoosh_a_hi',G['hi']),('wind_swoosh_b',G['mid']),('wind_swoosh_a',G['outer'])][i%3]
    L.append({'id':f's3_line{i}','t':'mesh','at':round(t0,3),'life':WL,'att':'feet','shape':'model','model':'wind_slashstroke','mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[0,0],'pos':{'0':[round(x,2),round(y,2),round(z0,2)],'0.55':[round(x,2),round(y-.1,2),round(z0+(z1-z0)*.8,2)],'1':[round(x,2),round(y-.15,2),round(z1,2)],'ease':'out'},
        'rot':[rg.choice([88,92]),0,90],'scale':{'0':[ln*.5,1,.5],'0.3':[ln,1,.7],'1':[ln*1.2,1,.35]},'op':{'0':0,'0.12':.9,'0.7':.7,'1':0},'fade':0})
# curls (spirals seen from the side) riding the wind front, ending around the enemy / wall
for j,(y,sz,dz) in enumerate([(2.4,.9,-2.5),(1.5,.75,-.8),(.8,.85,.3),(1.9,.55,-4)]):
    zs=ENEMY_Z+dz;ze=WALL_Z-1.6+dz*.3
    for k,(tex,col,m) in enumerate([('wind_swoosh_a_hi',G['hi'],1.0),('wind_swoosh_b',G['mid'],1.25)]):
        L.append({'id':f's3_curl{j}_{k}','t':'mesh','at':round(T_WIND+.03+j*.02,3),'life':.45,'att':'feet','shape':'model','model':f'wind_pieces{(j+k)%3}','mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,
            'uvTile':[1,1],'uvScroll':[0,0],'pos':{'0':[0,y,round(zs,2)],'0.35':[0,y,round(ze-.5,2)],'1':[0,y+.2,round(ze,2)],'ease':'out'},'rot':[0,90,j*40],
            'scale':{'0':[.3*sz*m,.2,.3*sz*m],'0.35':[sz*m,.3,sz*m],'1':[1.3*sz*m,.2,1.3*sz*m],'ease':'out'},'spin':(-700 if j%2 else 700),'op':{'0':0,'0.12':.9,'0.7':.6,'1':0},'fade':0})
L.append({'id':'s3_gust','t':'emit','at':T_WIND,'life':.16,'att':'feet','pos':{'0':[0,1.4,0],'1':[0,1.4,WALL_Z-2]},'rate':120,'from':'sphere','fr':1.5,'dir':'aim','spread':.08,
    'speed':[16,24],'plife':[.12,.24],'look':'streak','size':[1,2],'col':G['mid'],'c2':G['outer'],'gravity':0,'drag':1,'curl':False})
L.append({'id':'s3_floor','t':'emit','at':T_WIND,'life':.2,'att':'feet','pos':{'0':[0,.08,0],'1':[0,.08,WALL_Z-1.5]},'rate':160,'from':'disc','fr':1.4,'dir':'aim','spread':.25,'up':[0,.6],
    'speed':[8,14],'plife':[.2,.4],'look':'streak','size':[1,1.8],'col':G['inner'],'c2':G['outer'],'gravity':1,'drag':1.5,'curl':False})
L.append({'id':'s3_warp','t':'warp','at':T_WIND,'life':.22,'att':'feet','pos':{'0':[0,1.3,1],'1':[0,1.3,WALL_Z-2]},'kind':'shock','size':{'0':1.5,'1':3},'str':.6,'op':{'0':.8,'1':0},'col':G['inner'],'glow':.02})
# ---------- shot 4: enemy slams into the wind wall — crack burst ----------
HP=[0,1.1,WALL_Z-.5]
L.append({'id':'s4_hit','t':'use','at':T_HIT,'life':.6,'att':'feet','pos':[0,0,WALL_Z],'fx':'wind/wall_hit'})
L.append({'id':'s4_flash','t':'flash','at':T_HIT,'life':.1,'att':'feet','pos':HP,'col':G['inner'],'size0':.4,'size':2.0,'k':.7})
L.append({'id':'s4_cracks','t':'emit','at':T_HIT,'life':.04,'att':'feet','pos':HP,'burst':40,'rate':0,'from':'sphere','fr':.2,'dir':'out','speed':[7,13],'plife':[.12,.26],
    'look':'streak','size':[1.4,2.6],'col':'#ffffff','c2':'#b9c4bd','gravity':0,'drag':4,'curl':False})
L.append({'id':'s4_chips','t':'emit','at':T_HIT,'life':.04,'att':'feet','pos':HP,'burst':16,'rate':0,'from':'sphere','fr':.3,'dir':'out','speed':[3,7],'plife':[.3,.55],
    'look':'model','model':'wind_wing_airchip','mmat':'glow','msize':[.14,.3],'col':G['mid'],'c2':G['outer'],'mspin':400,'gravity':2,'drag':1,'bounce':0})
L.append({'id':'s4_shock','t':'warp','at':T_HIT,'life':.22,'att':'feet','pos':HP,'kind':'shock','size':{'0':.3,'1':3},'str':1,'op':{'0':1,'1':0},'col':G['inner'],'glow':.04})
L.append({'id':'s4_shake','t':'screen','at':T_HIT,'life':.14,'shake':2,'own':True})
fx={'v':1,'desc':'Windrift (สกิลพุ่งสายลม, storyboard #8): ปีกชาร์จ → พุ่ง 11 ม. (ศัตรูในทางติด slow ทันที) → ลงท่าฮีโร่ → ลมแรงตามมาพัดศัตรูไกลกว่า → ชนกำแพงลม เกิดรอยแตก • ไม่มีลมหมึก • ตัวอย่างใน Studio (ปีก/รอยพุ่งเคลื่อนเองแทนตัวละคร)',
    'tags':['wind','windrift','gust','dash'],'pal':'wind','dur':DUR,'seed':8,'layers':L}
(ROOT/'assets/fx/wind/windrift.fx.json').write_text(json.dumps(fx,ensure_ascii=False,indent=1),encoding='utf-8')
print('wind/windrift',len(L),'layers')
