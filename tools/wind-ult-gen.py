# Eye of Heaven (wind ultimate: anti-gravity zone). Studio demo only (not bound to the game yet).
# Run: python tools/wind-ult-gen.py then node tools/fx-check.js • view studio.html?fx=wind/eye_of_heaven
# Shots (user 2026-10-28, reference picture = one arm stretched straight up):
#  A hand up, wand raised as high as it goes: the wand glows, a very bright aura, heavy wind spinning around the body
#  B bend down and plant the wand tip on the ground: impact wave → everyone in the zone floats at once,
#    then the round wind wall rises (after they float)
#  C rise a little, wrap the wings like the block pose (one leg up), wings glow very bright,
#    then flick them open: a fast, violent impact wave all around → everyone is blown into the wall, stun 3 s
#  D the wall stays 5 s after the impact, then dissolves. No ink.
# The studio dummy cannot pose or rise, so the wand tip / wings / effects move by themselves.
import json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
WING=json.loads((ROOT/'assets/fx/wind/wing_angular.fx.json').read_text(encoding='utf-8'))
G=dict(inner='#efffe8',mid='#8dff65',outer='#2ec772',hi='#ffffff',neon='#b6ff4a',aqua='#5cf0c8',teal='#21b89a',deep='#0f4a2c')
T=lambda n:'tex/'+n
R=17.5                    # zone + wall radius (350 units)
WH=4.5                    # wall height
T_SLAM=1.0                # wand tip hits the ground
T_WALL=1.15               # wall starts rising (after everyone floats)
T_WRAP=1.4                # rise + wrap the wings
T_IMP=2.38                # wings flick open = impact wave
T_HITW=2.72               # enemies reach the wall
WALL_END=T_IMP+5.0        # wall stays 5 s after the impact
DUR=round(WALL_END+.6,2)
STUN=3.0
def lift(t):
    if t<T_WRAP:return 0.0
    if t<T_WRAP+.4:u=(t-T_WRAP)/.4;return .8*(1-(1-u)**2)
    if t<3.0:return .8
    if t<3.5:u=(t-3.0)/.5;return .8*(1-u*u)
    return 0.0
OPEN=(12,0)
def wing_rot(t,side):
    z,y=OPEN
    if t<.8:u=t/.8;z=12+20*u                                         # hand up: wings rise with the arm
    elif t<T_SLAM:u=(t-.8)/(T_SLAM-.8);z=32-34*u                     # bend down
    elif t<T_WRAP:u=(t-T_SLAM)/(T_WRAP-T_SLAM);z=-2+14*u
    elif t<T_WRAP+.2:u=(t-T_WRAP)/.2;z,y=12-17*u,-82*u               # wrap forward around the body (block pose)
    elif t<T_IMP-.06:z,y=-5,-82
    elif t<T_IMP+.06:u=(t-T_IMP+.06)/.12;z,y=-5+45*u,-82+92*u         # flick open, wide and high
    else:u=min(1,(t-T_IMP-.06)/.6);z,y=40-28*u,10-10*u               # settle to open
    return [0,round(side*y,1),round(side*z,1)]
BIG=1.6
def wscale(t):
    if t<T_WRAP:return 1.0
    if t<T_WRAP+.25:return 1+(BIG-1)*(t-T_WRAP)/.25
    if t<3.6:return BIG
    return BIG-(BIG-1)*min(1,(t-3.6)/.4)
KEYS=sorted(set([round(x*.05,3) for x in range(int(4.2/.05)+1)]+[T_SLAM,T_WRAP,T_WRAP+.2,T_IMP-.06,T_IMP,T_IMP+.06,4.6,DUR-.2,DUR]))
ck=lambda t:str(round(t/DUR,4))
L=[]
# ---------- wings (approved angular wings), posed by the curves above ----------
for w in WING['layers']:
    side=1 if w['id'].startswith('R') else -1
    if w['t']=='mesh':
        n=dict(w);n.pop('loop',None);n['at']=0;n['life']=DUR
        p0=w['pos'];n['pos']={ck(t):[p0[0],round(p0[1]+lift(t),3),p0[2]] for t in KEYS}
        n['rot']={ck(t):wing_rot(t,side) for t in KEYS}
        n['scale']={ck(t):round(wscale(t),3) for t in KEYS}
        b=n.get('op',.3);n['op']={'0':0,ck(.1):b*1.4,ck(T_WRAP):b*1.4,ck(T_WRAP+.3):min(.9,b*2.6),ck(T_IMP+.1):min(.9,b*2.6),ck(T_IMP+.8):b*1.3,ck(4.6):b*1.2,ck(5.0):0,'1':0}
        L.append(n)
    elif w['id'].endswith(('airchips','motes')):
        n=dict(w);n.pop('loop',None);n['at']=0;n['life']=4.6;L.append(n)
# very bright neon on the wrapped wings, peaks right before the flick
for side,suf in((1,''),(-1,'_L')):
    p0=[.135*side,1.602,-.238];a,b=T_WRAP,T_IMP+.35
    GK=[t for t in KEYS if a-.01<=t<=b]
    for part,col,c2,pk in(('feathers',G['neon'],G['mid'],.95),('spines',G['hi'],G['neon'],1.0),('body'+('' if side>0 else ''),G['mid'],G['neon'],.55)):
        L.append({'id':f'c_glow_{part}{suf or "_R"}','t':'mesh','at':a,'life':round(b-a,3),'att':'feet','shape':'model','model':f'wind_wing_angular_{part}'+suf,
            'mat':'glow' if part=='spines' else 'energy','col':col,'col2':c2,'rim':.9,'fade':0,
            'pos':{str(round((t-a)/(b-a),3)):[p0[0],round(p0[1]+lift(t),3),p0[2]] for t in GK},
            'rot':{str(round((t-a)/(b-a),3)):wing_rot(t,side) for t in GK},
            'scale':{str(round((t-a)/(b-a),3)):round(wscale(t)*1.02,3) for t in GK},'op':{'0':0,'0.3':pk*.6,'0.75':pk,'0.85':pk,'1':0}})

# ---------- A: hand up — glowing wand, bright aura, heavy wind spinning around the body ----------
TIP=[.3,2.65,.05]
TIPK={'0':[.3,1.5,.3],'0.35':TIP,'0.78':TIP,'0.9':[.1,1.4,.7],'1':[0,.05,.9]}      # raise → hold → plant on the ground
L.append({'id':'a_tip','t':'mesh','at':0,'life':T_SLAM,'att':'feet','shape':'sphere','mat':'glow','col':G['inner'],'col2':G['neon'],'pos':TIPK,
    'scale':{'0':.05,'0.3':.18,'0.5':.26,'0.75':.3,'1':.15},'op':{'0':0,'0.2':1,'1':1},'fade':0})
L.append({'id':'a_tipglow','t':'emit','at':.15,'life':T_SLAM-.15,'att':'feet','pos':TIPK,'rate':70,'from':'sphere','fr':.15,'dir':'out','speed':[.5,1.5],'plife':[.2,.35],
    'look':'glow','size':[1.5,2.6],'col':G['neon'],'c2':G['outer'],'gravity':-.5,'drag':2})
L.append({'id':'a_tipsuck','t':'emit','at':.2,'life':.65,'att':'feet','pos':TIP,'rate':120,'from':'sphere','fr':1.6,'dir':'in','speed':[5,8],'plife':[.14,.22],
    'look':'streak','size':[.8,1.4],'col':G['inner'],'c2':G['neon'],'gravity':0,'drag':0,'curl':False})
# aura: rising bright wind lines hugging the body (no solid cylinder — it read as a box)
L.append({'id':'a_aura','t':'emit','at':.1,'life':.85,'att':'feet','pos':[0,.1,0],'rate':160,'from':'ring','fr':.75,'dir':'up','spread':.05,'speed':[4,7],'plife':[.35,.55],
    'look':'streak','size':[1.2,2.2],'col':G['hi'],'c2':G['neon'],'gravity':0,'drag':.3,'curl':False})
L.append({'id':'a_auraglow','t':'emit','at':.1,'life':.85,'att':'feet','pos':[0,1.2,0],'rate':40,'from':'sphere','fr':.8,'dir':'up','spread':.4,'speed':[.5,1.5],'plife':[.4,.7],
    'look':'glow','size':[3,5],'col':G['mid'],'c2':G['outer'],'gravity':-.5,'drag':1})
for j,(y,sc,sp,tex,col) in enumerate([(.4,1.5,700,'wind_swoosh_a_hi',G['hi']),(1.1,1.35,-640,'wind_swoosh_b',G['mid']),(1.8,1.25,710,'wind_swoosh_a_hi',G['neon']),(2.5,1.1,-600,'wind_swoosh_b',G['aqua'])]):
    L.append({'id':f'a_spin{j}','t':'mesh','at':round(.1+j*.04,3),'life':round(.9-j*.04,3),'att':'feet','shape':'model','model':f'wind_pieces{j%3}','mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[0,0],'pos':{'0':[0,y-.3,0],'1':[0,y+.3,0]},'rot':[0,j*50,j*6],'scale':{'0':[sc*.5,.3,sc*.5],'0.3':[sc,.35,sc],'1':[sc*1.1,.3,sc*1.1]},'spin':sp,
        'op':{'0':0,'0.15':.9,'0.85':.85,'1':0},'fade':0})
L.append({'id':'a_swirl','t':'emit','at':.1,'life':.85,'att':'feet','pos':[0,1.2,0],'rate':150,'from':'ring','fr':1.6,'dir':'tangent','up':[1,3],'speed':[6,9],'plife':[.2,.35],
    'look':'streak','size':[1,1.8],'col':G['inner'],'c2':G['mid'],'gravity':0,'drag':.5,'curl':False})
L.append({'id':'a_floor','t':'mesh','at':.1,'life':.9,'att':'feet','shape':'model','model':'wind_groundswirl','mat':'tex','tex':T('wind_swoosh_b'),'col':G['mid'],'col2':'#000000','rim':0,
    'uvTile':[1,1],'uvScroll':[0,0],'pos':[0,.05,0],'scale':{'0':1,'1':2.4},'spin':420,'op':{'0':0,'0.2':.7,'1':.3},'fade':0})
L.append({'id':'a_light','t':'light','at':0,'life':T_SLAM+.2,'att':'feet','pos':[0,2.2,0],'col':G['neon'],'int':{'0':0,'0.4':2.4,'0.8':2.5,'1':0},'dist':9})

# ---------- B: wand planted — impact wave over the whole zone, everyone floats, the wall rises after ----------
SP=[0,.05,.9]
L.append({'id':'b_flash','t':'flash','at':T_SLAM,'life':.14,'att':'feet','pos':[0,.4,.9],'col':G['inner'],'size0':.4,'size':1.8,'k':.6})
L.append({'id':'b_shock','t':'warp','at':T_SLAM,'life':.45,'att':'feet','pos':[0,.15,.9],'kind':'shock','flat':True,'size':{'0':.5,'1':R},'str':1,'op':{'0':1,'1':0},'col':G['inner'],'glow':.05})
for k,(col,c2,inn,dl) in enumerate([(G['hi'],G['neon'],.975,0),(G['mid'],G['outer'],.96,.06)]):
    L.append({'id':f'b_ring{k}','t':'mesh','at':round(T_SLAM+dl,3),'life':.5,'att':'feet','shape':'ring','inner':inn,'mat':'energy','rim':0,'col':col,'col2':c2,'pos':[0,.08+k*.03,.9],
        'scale':{'0':.5,'1':R,'ease':'out'},'op':{'0':.8,'0.6':.5,'1':0},'fade':0})
L.append({'id':'b_streaks','t':'emit','at':T_SLAM,'life':.05,'att':'feet','pos':SP,'burst':80,'rate':0,'from':'ring','fr':.6,'dir':'flat','speed':[26,36],'up':[0,.8],
    'plife':[.4,.55],'look':'streak','size':[1.4,2.6],'col':G['inner'],'c2':G['mid'],'gravity':0,'drag':.8,'curl':False})
for k,(tex,col,sc,sp) in enumerate([('wind_swoosh_a_hi',G['hi'],2.2,520),('wind_swoosh_b',G['mid'],3,-420)]):
    L.append({'id':f'b_swirl{k}','t':'mesh','at':T_SLAM,'life':.55,'att':'feet','shape':'model','model':'wind_groundswirl','mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[0,0],'pos':[0,.06+k*.03,.9],'rot':[0,k*90,0],'scale':{'0':sc*.2,'1':sc,'ease':'out'},'spin':sp,'op':{'0':0,'0.1':.95,'1':0},'fade':0})
L.append({'id':'b_dust','t':'emit','at':T_SLAM,'life':.08,'att':'feet','pos':SP,'burst':20,'rate':0,'from':'ring','fr':1,'dir':'flat','speed':[4,7],'up':[.2,.8],
    'plife':[.6,1],'look':'smoke','size':[6,10],'grow':1.2,'col':'#d9e3dc','c2':'#8a9690','gravity':-.2,'drag':2,'x':True})
L.append({'id':'b_shake','t':'screen','at':T_SLAM,'life':.16,'shake':2,'own':True})
# anti-gravity: wind rising from the whole zone, dust and chips drifting up slowly
FL=T_IMP-T_SLAM+.2
L.append({'id':'b_upwind','t':'emit','at':T_SLAM+.02,'life':FL,'att':'feet','pos':[0,.1,0],'rate':200,'from':'disc','fr':R-.5,'dir':'up','spread':.08,'speed':[5,9],'plife':[.3,.6],
    'look':'streak','size':[1,2],'col':G['inner'],'c2':G['mid'],'gravity':0,'drag':.3,'curl':False})
L.append({'id':'b_upchips','t':'emit','at':T_SLAM+.02,'life':FL,'att':'feet','pos':[0,.2,0],'rate':70,'from':'disc','fr':R-1,'dir':'up','spread':.3,'speed':[.6,1.6],'plife':[1,1.6],
    'look':'model','model':'wind_wing_airchip','mmat':'glow','msize':[.1,.22],'col':G['mid'],'c2':G['aqua'],'mspin':200,'gravity':-.6,'drag':.6,'bounce':0})
L.append({'id':'b_updust','t':'emit','at':T_SLAM+.02,'life':FL,'att':'feet','pos':[0,.15,0],'rate':30,'from':'disc','fr':R-1,'dir':'up','spread':.3,'speed':[.3,.8],'plife':[1.2,1.8],
    'look':'smoke','size':[5,9],'grow':.6,'col':'#d9e3dc','c2':'#8a9690','gravity':-.4,'drag':1,'x':True})
L.append({'id':'b_rocks','t':'emit','at':T_SLAM+.02,'life':.6,'att':'feet','pos':[0,.2,0],'rate':40,'from':'disc','fr':R-2,'dir':'up','spread':.4,'speed':[.8,1.6],'plife':[1.4,2],
    'look':'model','model':'rock_chunk','mmat':'solid','msize':[.12,.3],'col':'#8d958f','c2':'#3a403c','mspin':120,'gravity':-.5,'drag':.5,'bounce':0,'x':True})
# sample floating enemies (studio only): a wind cushion under each + slow orbiting motes = "cannot move"
ENS=[(-50,8),(35,6),(160,10)]
for i,(a,r) in enumerate(ENS):
    x,z=round(r*math.sin(math.radians(a)),2),round(r*math.cos(math.radians(a)),2)
    L.append({'id':f'b_float{i}','t':'mesh','at':T_SLAM+.05,'life':round(T_IMP-T_SLAM,3),'att':'feet','shape':'model','model':'wind_groundswirl','mat':'tex','tex':T('wind_swoosh_a_hi'),'col':G['mid'],'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[0,0],'pos':{'0':[x,.1,z],'0.3':[x,1.1,z],'1':[x,1.3,z]},'scale':.9,'spin':300,'op':{'0':0,'0.15':.8,'0.9':.8,'1':0},'fade':0})
    L.append({'id':f'b_floatmotes{i}','t':'emit','at':T_SLAM+.05,'life':round(T_IMP-T_SLAM,3),'att':'feet','pos':{'0':[x,.8,z],'0.3':[x,2,z],'1':[x,2.2,z]},'rate':20,'from':'ring','fr':.7,'dir':'tangent',
        'speed':[1,2],'plife':[.4,.6],'look':'glow','size':[.6,1],'col':G['neon'],'c2':G['outer'],'gravity':0,'drag':0})
# the round wind wall rises after everyone floats — 8 real Aegis Gale wall pieces in a circle (user: "same like the wind
# wall we designed"). Ring meshes wind_ringwall_* = the wall's own arc shapes (tools/wind-wall-gen.py) rebuilt at radius R,
# 8 arcs of 42° (each ≈ one normal wall, 13 m) with small gaps; the layers are the approved wind/wall layers, retimed.
WA=math.radians(21);WHM=3.4;RW=R
def _rot(p,th):x,y,z=p;return [round(x*math.cos(th)+z*math.sin(th),4),round(y,4),round(-x*math.sin(th)+z*math.cos(th),4)]
SEGA=[math.radians(s*45+22.5) for s in range(8)]
def ring_wall(name,r,a0,a1,hmax,n=60,lift=0):
    parts=[]
    for k,th in enumerate(SEGA):
        V=[];F=[]
        for i in range(n+1):
            a=a0+(a1-a0)*i/n;e=abs(a)/WA;h=hmax*max(.08,(1-e**6))**.5
            V+=[_rot([r*math.sin(a),lift,-r*math.cos(a)],th),_rot([r*math.sin(a),lift+h,-r*math.cos(a)],th)]
            if i<n:F.append([2*i,2*i+2,2*i+3,2*i+1])
        parts.append({'id':f'{name}{k}','k':'poly','v':V,'f':F})
    return parts
def ring_band(name,r,y0,y1,a0,a1,n=12):
    parts=[]
    for k,th in enumerate(SEGA):
        V=[];F=[]
        for i in range(n+1):
            a=a0+(a1-a0)*i/n;e=abs(a)/WA;sc=max(.08,(1-e**6))**.5
            V+=[_rot([r*math.sin(a),y0*sc,-r*math.cos(a)],th),_rot([r*math.sin(a),y1*sc,-r*math.cos(a)],th)]
            if i<n:F.append([2*i,2*i+2,2*i+3,2*i+1])
        parts.append({'id':f'{name}{k}','k':'poly','v':V,'f':F})
    return parts
def ring_line(r,curl):
    out=[]
    for k,th in enumerate(SEGA):
        P=[[r*math.sin(-WA+2*WA*i/16),.02,-r*math.cos(-WA+2*WA*i/16)] for i in range(17)]
        def tail(sg):
            a=sg*WA;cx=r*math.sin(a);cz=-r*math.cos(a);o=[]
            for q in range(1,9):
                t=q/8;ang=t*math.pi*1.6;rr=curl*(1-t*.75)
                o.append([cx+sg*(math.sin(ang)*rr*.8)+sg*t*.25,.02,cz+(1-math.cos(ang))*rr])
            return o
        pts=[p for p in reversed(tail(-1))]+P+tail(1)
        out.append([_rot(p,th) for p in pts])
    return out
MESH=ROOT/'assets/fx/mesh'
def msave(n,d,parts):(MESH/f'{n}.mesh.json').write_text(json.dumps({'v':1,'desc':d,'pal':'wind','mat':'solid','parts':parts},ensure_ascii=False),encoding='utf-8')
msave('wind_ringwall_body','อัลติ: กำแพงลมวงกลม 8 ชิ้น (ผิวหลัก) รูปเดียวกับกำแพงลม',ring_wall('body',RW,-WA,WA,WHM))
msave('wind_ringwall_back','อัลติ: กำแพงลมวงกลม 8 ชิ้น (ชั้นหลัง)',ring_wall('back',RW+.18,-WA,WA,WHM*1.04))
NSEG=14;OVL=.35
for q in range(NSEG):
    w=2*WA/NSEG;a0=-WA+q*w-w*OVL;a1=-WA+(q+1)*w+w*OVL
    msave(f'wind_ringwall_tips{q}',f'อัลติ: แถบปลายเส้นลมยอดกำแพงวง ช่วง {q}',ring_band('tips',RW+.04+.01*(q%3),1.35,3.7,max(-WA,a0),min(WA,a1)))
E=math.radians(5)
msave('wind_ringwall_ends','อัลติ: ปลายกำแพงวงทั้ง 16 ข้าง (สว่าง)',ring_wall('endL',RW-.06,-WA,-WA+E,WHM,6)+ring_wall('endR',RW-.06,WA-E,WA,WHM,6))
(MESH/'wind_ringwall_line.mesh.json').write_text(json.dumps({'v':1,'desc':'อัลติ: เส้นพื้นกำแพงวง ปลายม้วน','pal':'wind','mat':'glow','parts':
    [{'id':f'main{k}','k':'ribbon','path':[[round(c,4) for c in p] for p in pts],'w':.07,'seg':80} for k,pts in enumerate(ring_line(RW+.05,.55))]+
    [{'id':f'thin{k}','k':'ribbon','path':[[round(c,4) for c in p] for p in pts],'w':.025,'seg':80} for k,pts in enumerate(ring_line(RW-.22,.3))]},ensure_ascii=False),encoding='utf-8')
WALLFX=json.loads((ROOT/'assets/fx/wind/wall.fx.json').read_text(encoding='utf-8'))
WL=round(WALL_END+.4-T_WALL,3);KW=WL/WALLFX.get('dur',6.0)
for w in WALLFX['layers']:
    if w.get('loop') or (w['t']=='emit' and isinstance(w.get('pos'),list) and w['pos']!=[0,0,10.9] and not w.get('of')):continue   # gusts / end wisps belong to one straight wall
    if w['t']=='mesh' and not str(w.get('model','')).startswith('wind_wall_'):continue
    n=json.loads(json.dumps(w));n['id']='w_'+w['id']
    if 'of' in n:n['of']='w_'+n['of']
    if n['t']=='mesh':n['model']=n['model'].replace('wind_wall_','wind_ringwall_')
    if 'pos' in n:n['pos']=[0,0,0]
    n['at']=round(T_WALL+w.get('at',0)*KW,3);n['life']=round(w.get('life',.4)*KW,3)
    if n['t']=='emit' and n.get('rate'):n['rate']=min(200,round(n['rate']*1.6))      # 8 pieces of wall to cover
    if n['t']=='emit' and n.get('burst'):n['burst']=min(80,n['burst']*2)
    L.append(n)
L.append({'id':'w_end','t':'emit','at':WALL_END,'life':.35,'att':'ground','pos':[0,1.5,0],'rate':200,'from':'ring','fr':R,'dir':'up','spread':.3,'speed':[4,8],'plife':[.4,.7],
    'look':'model','model':'wind_wing_airchip','mmat':'glow','msize':[.12,.26],'col':G['mid'],'c2':G['outer'],'mspin':400,'gravity':-1,'drag':1,'bounce':0})
L.append({'id':'w_endstreak','t':'emit','at':WALL_END,'life':.35,'att':'ground','pos':[0,.5,0],'rate':200,'from':'ring','fr':R,'dir':'up','spread':.15,'speed':[8,14],'plife':[.3,.5],
    'look':'streak','size':[1.2,2],'col':G['inner'],'c2':G['mid'],'gravity':0,'drag':1,'curl':False})

# ---------- C: rise, wrap, charge — then a violent impact wave all around ----------
CP=[0,1.4+.8,0]
L.append({'id':'c_suck','t':'emit','at':T_WRAP+.15,'life':round(T_IMP-T_WRAP-.15,3),'att':'feet','pos':CP,'rate':200,'from':'sphere','fr':6,'dir':'in','speed':[16,24],'plife':[.18,.3],
    'look':'streak','size':[1.2,2.2],'col':G['neon'],'c2':G['mid'],'gravity':0,'drag':0,'curl':False})
L.append({'id':'c_glow','t':'emit','at':T_WRAP+.1,'life':round(T_IMP-T_WRAP-.1,3),'att':'feet','pos':CP,'rate':60,'from':'sphere','fr':1.1,'dir':'out','speed':[.3,1],'plife':[.25,.4],
    'look':'glow','size':[2,3.5],'col':G['neon'],'c2':G['outer'],'gravity':0,'drag':2})
L.append({'id':'c_light','t':'light','at':T_WRAP,'life':round(T_IMP-T_WRAP+.5,3),'att':'feet','pos':CP,'col':G['neon'],'int':{'0':.5,'0.7':2.5,'0.75':2.5,'1':0},'dist':12})
L.append({'id':'c_flash','t':'flash','at':T_IMP,'life':.16,'att':'feet','pos':CP,'col':G['inner'],'size0':.5,'size':2.6,'k':.7})
L.append({'id':'c_shock','t':'warp','at':T_IMP,'life':.4,'att':'feet','pos':CP,'kind':'shock','size':{'0':.4,'1':4.5},'str':.8,'op':{'0':1,'1':0},'col':G['inner'],'glow':.05})
L.append({'id':'c_shockfloor','t':'warp','at':T_IMP,'life':.4,'att':'feet','pos':[0,.15,0],'kind':'shock','flat':True,'size':{'0':1,'1':R},'str':1,'op':{'0':1,'1':0},'col':G['inner'],'glow':.04})
for k,(col,c2,inn,y,dl) in enumerate([(G['hi'],G['neon'],.9,CP[1],0),(G['mid'],G['outer'],.86,CP[1]-.6,.04),(G['inner'],G['mid'],.94,.1,.02)]):
    L.append({'id':f'c_ring{k}','t':'mesh','at':round(T_IMP+dl,3),'life':.36,'att':'feet','shape':'ring','inner':inn,'mat':'energy','rim':0,'col':col,'col2':c2,'pos':[0,round(y,2),0],
        'scale':{'0':1,'1':(R-.3) if k==2 else 9,'ease':'out'},'op':{'0':.9 if k==2 else .7,'0.75':.6,'1':0},'fade':0})
# 16 wind curls racing outward in every direction (fast)
for j in range(10):
    a=j*36+(9 if j%2 else 0);sa,ca=math.sin(math.radians(a)),math.cos(math.radians(a));y=[.7,1.6,2.4][j%3]
    for k,(tex,col,m) in enumerate([('wind_swoosh_a_hi',G['hi'],1.0),('wind_swoosh_b',[G['mid'],G['aqua'],G['neon']][j%3],1.3)]):
        L.append({'id':f'c_curl{j}_{k}','t':'mesh','at':round(T_IMP+(j%4)*.012,3),'life':.5,'att':'feet','shape':'model','model':f'wind_pieces{(j+k)%3}','mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,
            'uvTile':[1,1],'uvScroll':[0,0],'pos':{'0':[round(1.2*sa,2),y,round(1.2*ca,2)],'0.6':[round((R-2)*sa,2),y,round((R-2)*ca,2)],'1':[round((R-.8)*sa,2),y+.3,round((R-.8)*ca,2)],'ease':'out'},
            'rot':[0,round(a+90,1),j*25],'scale':{'0':[.4*m,.2,.4*m],'0.5':[.85*m,.25,.85*m],'1':[1.1*m,.2,1.1*m],'ease':'out'},'spin':(-700 if j%2 else 700),'op':{'0':0,'0.06':.95,'0.7':.6,'1':0},'fade':0})
L.append({'id':'c_blast','t':'emit','at':T_IMP,'life':.05,'att':'feet','pos':CP,'burst':80,'rate':0,'from':'sphere','fr':.8,'dir':'flat','speed':[30,42],'up':[-2,2],'plife':[.35,.5],
    'look':'streak','size':[1.6,3],'col':G['inner'],'c2':G['mid'],'gravity':0,'drag':.6,'curl':False})
L.append({'id':'c_floor','t':'emit','at':T_IMP,'life':.05,'att':'feet','pos':[0,.1,0],'burst':80,'rate':0,'from':'ring','fr':1,'dir':'flat','speed':[28,38],'up':[0,.6],'plife':[.4,.55],
    'look':'streak','size':[1.4,2.6],'col':G['inner'],'c2':G['outer'],'gravity':0,'drag':.6,'curl':False})
L.append({'id':'c_blast2','t':'emit','at':T_IMP+.03,'life':.05,'att':'feet','pos':CP,'burst':80,'rate':0,'from':'sphere','fr':.8,'dir':'flat','speed':[24,34],'up':[-3,1],'plife':[.35,.5],
    'look':'streak','size':[1.4,2.6],'col':G['mid'],'c2':G['outer'],'gravity':0,'drag':.6,'curl':False})
L.append({'id':'c_floor2','t':'emit','at':T_IMP+.03,'life':.05,'att':'feet','pos':[0,.1,0],'burst':80,'rate':0,'from':'ring','fr':1,'dir':'flat','speed':[22,32],'up':[0,.6],'plife':[.4,.55],
    'look':'streak','size':[1.2,2.2],'col':G['mid'],'c2':G['outer'],'gravity':0,'drag':.6,'curl':False})
L.append({'id':'c_chips','t':'emit','at':T_IMP,'life':.05,'att':'feet','pos':CP,'burst':60,'rate':0,'from':'sphere','fr':1,'dir':'flat','speed':[14,22],'up':[-1,2],'plife':[.6,.9],
    'look':'model','model':'wind_wing_airchip','mmat':'glow','msize':[.14,.3],'col':G['neon'],'c2':G['outer'],'mspin':600,'gravity':1,'drag':1,'bounce':0})
L.append({'id':'c_dust','t':'emit','at':T_IMP+.05,'life':.1,'att':'feet','pos':[0,.2,0],'burst':40,'rate':0,'from':'ring','fr':3,'dir':'flat','speed':[10,16],'up':[0,1],'plife':[.7,1.1],
    'look':'smoke','size':[7,12],'grow':1,'col':'#d9e3dc','c2':'#8a9690','gravity':-.2,'drag':1.5,'x':True})
L.append({'id':'c_shake','t':'screen','at':T_IMP,'life':.3,'shake':2,'own':True})
L.append({'id':'c_shake2','t':'screen','at':T_IMP,'life':.2,'shake':1.4,'other':True})

# ---------- enemies slam into the wall: ripples, cracks, stun 3 s (sample enemies) ----------
for i,(a,r) in enumerate(ENS):
    sa,ca=math.sin(math.radians(a)),math.cos(math.radians(a));HP=[round((R-.6)*sa,2),1.3,round((R-.6)*ca,2)];th=round(T_HITW+(r-6)*.015,3)
    # wall_hit faces -z into the wall: turn it so +z points back to the centre
    L.append({'id':f'd_hit{i}','t':'use','at':th,'life':.6,'att':'feet','pos':[HP[0],0,HP[2]],'yaw':round((a+360)%360-180,1),'fx':'wind/wall_hit'})
    L.append({'id':f'd_flash{i}','t':'flash','at':th,'life':.1,'att':'feet','pos':HP,'col':G['inner'],'size0':.4,'size':2.2,'k':.7})
    L.append({'id':f'd_cracks{i}','t':'emit','at':th,'life':.04,'att':'feet','pos':HP,'burst':30,'rate':0,'from':'sphere','fr':.2,'dir':'out','speed':[7,12],'plife':[.12,.24],
        'look':'streak','size':[1.4,2.4],'col':'#ffffff','c2':'#b9c4bd','gravity':0,'drag':4,'curl':False})
    L.append({'id':f'd_stun{i}','t':'emit','at':round(th+.05,3),'life':STUN,'att':'feet','pos':[HP[0]*.97,2.2,HP[2]*.97],'rate':14,'from':'ring','fr':.45,'dir':'tangent','speed':[1.5,2.5],
        'plife':[.3,.5],'look':'glow','size':[.8,1.3],'col':G['neon'],'c2':G['aqua'],'gravity':0,'drag':0})
    L.append({'id':f'd_bind{i}','t':'mesh','at':round(th+.05,3),'life':STUN,'att':'feet','shape':'model','model':f'wind_pieces{i%3}','mat':'tex','tex':T('wind_swoosh_a_hi'),'col':G['mint'] if 'mint' in G else G['inner'],'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[0,0],'pos':[HP[0]*.97,1.0,HP[2]*.97],'scale':[.7,.3,.7],'spin':500,'op':{'0':0,'0.05':.85,'0.9':.8,'1':0},'fade':0})

fx={'v':1,'desc':'Eye of Heaven (อัลติสายลม): ชูแขนสุด ไม้คทาเรือง ออร่าสว่าง ลมหมุนรอบตัว → ปักไม้ลงพื้น คลื่นกระแทกทั้งเขต (รัศมี 17.5 ม.) ทุกคนลอย กำแพงลมวงกลม 8 ชิ้นขึ้นตาม → ลอยขึ้น ห่อปีกเรืองนีออนสุด แล้วสะบัดเปิด คลื่นกระแทกรุนแรงรอบตัว ทุกคนกระเด็นชนกำแพง สตัน 3 วิ → กำแพงอยู่ 5 วิแล้วสลาย • ไม่มีลมหมึก • ตัวอย่างใน Studio',
    'tags':['wind','ult','eye_of_heaven','zone','antigravity'],'pal':'wind','dur':DUR,'seed':9,'layers':L}
(ROOT/'assets/fx/wind/eye_of_heaven.fx.json').write_text(json.dumps(fx,ensure_ascii=False,indent=1),encoding='utf-8')
print('wind/eye_of_heaven',len(L),'layers dur',DUR)
