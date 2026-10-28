# Void Spheres (wind skill 4: 3 compressed black-hole wind orbs). Studio demo only (not bound to the game yet).
# Run: python tools/wind-void-tex.py (disk textures) then python tools/wind-void-gen.py, node tools/fx-check.js
# View: studio.html?fx=wind/void_spheres (demo) • wind/void_orb (one orb, loops — for the game projectile)
# Look (user 2026-10-28, reference picture): black core + spinning accretion disk of wind wisps, several wind colours
# (white-hot rim, mint, neon green, lime, aqua/teal) — not one flat colour. No ink layer.
# Demo: 3 orbs fired in a row • orb 1 catches the enemy at ENEMY_Z and drags it into the wind wall (stun burst)
# • orbs 2 and 3 fly the full 20 m and collapse.
import json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
G=dict(hi='#ffffff',inner='#efffe8',mint='#b8ffe0',mid='#8dff65',lime='#c6ff5a',aqua='#5cf0c8',teal='#21b89a',outer='#2ec772',deep='#0f4a2c')
T=lambda n:'tex/'+n
Y=1.2              # orb height
RANGE=20.0         # orb range m (400 units)
FLY=0.8            # seconds to fly the full range
GAP=0.2            # seconds between orbs
T0=0.12            # first orb leaves the hand (after the charge)
ENEMY_Z=8.0        # enemy in the path (caught by orb 1)
WALL_Z=17.0        # wind wall: drag ends here = stun (drag 9 m, max 10)
def z_at(u):return 1.0+(RANGE-1.0)*u          # orb z at life fraction u (constant speed)
def orb(L,pre,at,life,zend,end_pop=True,lit=True):
    """one void orb flying from the hand to zend over `life` s"""
    K=[i/10 for i in range(11)]
    P=lambda dy=0,dx=0:{str(round(u,2)):[dx,Y+dy,round(1.0+(zend-1.0)*u,3)] for u in (0,1)}
    op={'0':0,'0.06':1,'0.92':1,'1':0}
    # accretion disks (smaller since 2026-10-28 review): inner hot (white/mint/neon/lime), outer wide (aqua/teal/green), tilted, spinning
    for j,(tex,sc,tilt,sp,o) in enumerate([('wind_void_disk',2.4,18,560,1),('wind_void_disk_b',3.4,24,360,.85),('wind_void_disk',2.2,-30,-700,.45)]):
        L.append({'id':f'{pre}disk{j}','t':'mesh','at':at,'life':life,'att':'feet','shape':'plane','mat':'tex','tex':T(tex),'col':'#ffffff','col2':'#000000','rim':0,
            'uvTile':[1,1],'uvScroll':[0,0],'pos':P(),'rot':[90,j*40,tilt],'spin':sp,'int':.95,
            'scale':{'0':.2,'0.1':sc,'0.88':sc,'1':.15},'op':{k:v*o for k,v in op.items()},'fade':0})
    # black core, drawn after the disks so it stays black; toon rim = thin white-hot photon ring on its edge
    L.append({'id':pre+'core','t':'mesh','at':at,'life':life,'att':'feet','shape':'sphere','mat':'toon','col':'#000000','col2':'#000000','rim':1.0,
        'pos':P(),'scale':{'0':.05,'0.08':.27,'0.9':.27,'1':.05},'op':op,'fade':0})
    # wind bands orbiting the orb on crossed tilts (gyroscope look), 3 colours
    for j,(tex,col,sc,rx,rz,sp) in enumerate([('wind_swoosh_a_hi',G['mint'],.75,60,0,700),('wind_swoosh_b',G['aqua'],.85,-55,40,-620),('wind_swoosh_a_hi',G['lime'],.95,15,-70,540)]):
        L.append({'id':f'{pre}band{j}','t':'mesh','at':at,'life':life,'att':'feet','shape':'model','model':f'wind_pieces{j}','mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,
            'uvTile':[1,1],'uvScroll':[0,0],'pos':P(),'rot':[rx,j*60,rz],'spin':sp,'scale':{'0':[.2,.1,.2],'0.12':[sc,.25,sc],'0.88':[sc,.25,sc],'1':[.2,.1,.2]},
            'op':{'0':0,'0.1':.9,'0.88':.85,'1':0},'fade':0})
    # helix trails: two wind ribbons corkscrewing behind the orb (two colours)
    for h,(c,c2,ph) in enumerate([(G['mint'],G['outer'],0),(G['aqua'],G['teal'],math.pi)]):
        L.append({'id':f'{pre}helix{h}','t':'trail','at':at,'life':life,'att':'feet','col':c,'col2':c2,'w':.07,'tlife':.22,'k':1.0,
            'pos':{str(round(u,2)):[round(.4*math.cos(u*16+ph),3),round(Y+.4*math.sin(u*16+ph),3),round(1.0+(zend-1.0)*u,3)] for u in K}})
    L.append({'id':pre+'tail','t':'trail','at':at,'life':life,'att':'feet','pos':P(),'col':G['lime'],'col2':G['deep'],'w':.12,'tlife':.16,'k':1.0})
    # wind pulled into the hole (two colours), chips spiralling in, motes orbiting
    for j,(c,c2,fr) in enumerate([(G['lime'],G['aqua'],1.3),(G['inner'],G['mid'],.9)]):
        L.append({'id':f'{pre}suck{j}','t':'emit','at':at,'life':life,'att':'feet','pos':P(),'rate':90,'from':'sphere','fr':fr,'dir':'in','speed':[3.5,6],'plife':[.12,.22],
            'look':'streak','size':[.7,1.3],'col':c,'c2':c2,'gravity':0,'drag':0,'curl':False})
    L.append({'id':pre+'chips','t':'emit','at':at,'life':life,'att':'feet','pos':P(),'rate':30,'from':'ring','fr':1.1,'dir':'tangent','speed':[3,5],'plife':[.25,.4],
        'look':'model','model':'wind_wing_airchip','mmat':'glow','msize':[.05,.11],'col':G['mint'],'c2':G['teal'],'mspin':600,'gravity':0,'drag':3,'bounce':0,'x':True})
    for j,(c,c2) in enumerate([(G['mint'],G['teal']),(G['lime'],G['outer'])]):
        L.append({'id':f'{pre}spark{j}','t':'emit','at':at,'life':life,'att':'feet','pos':P(),'rate':45,'from':'ring','fr':1.0+.3*j,'dir':'tangent','speed':[2.5,4.5],'plife':[.2,.35],
            'look':'glow','size':[.4,.8],'col':c,'c2':c2,'gravity':0,'drag':1,'x':True})
    # no bulge warp: it redraws the scene over the black core
    #L.append({'id':pre+'warp','t':'warp','at':at,'life':life,'att':'feet','pos':P(),'kind':'bulge','size':1.6,'str':.6,'op':op,'col':G['inner'],'glow':0,'x':True})
    if lit:L.append({'id':pre+'light','t':'light','at':at,'life':life,'att':'feet','pos':P(),'col':G['mid'],'int':{'0':0,'0.1':2,'0.9':2,'1':0},'dist':6})
    if end_pop:   # collapse: shrink to a point, then a ring of green chips
        E=[0,Y,zend];te=at+life-.05
        L.append({'id':pre+'popflash','t':'flash','at':te,'life':.1,'att':'feet','pos':E,'col':G['mint'],'size0':.3,'size':1.4,'k':.5})
        L.append({'id':pre+'popchips','t':'emit','at':te,'life':.04,'att':'feet','pos':E,'burst':18,'rate':0,'from':'sphere','fr':.2,'dir':'out','speed':[4,8],'plife':[.25,.45],
            'look':'model','model':'wind_wing_airchip','mmat':'glow','msize':[.1,.22],'col':G['mid'],'c2':G['aqua'],'mspin':500,'gravity':.5,'drag':2,'bounce':0})
        L.append({'id':pre+'popwisp','t':'emit','at':te,'life':.04,'att':'feet','pos':E,'burst':26,'rate':0,'from':'sphere','fr':.2,'dir':'out','speed':[6,10],'plife':[.12,.22],
            'look':'streak','size':[1,1.8],'col':G['inner'],'c2':G['teal'],'gravity':0,'drag':3,'curl':False})

L=[]
# ---------- cast: wind spirals into the hand, squeezed into an orb (each shot) ----------
for i in range(3):
    a=round(T0+i*GAP-.12,3)
    L.append({'id':f'cast{i}_in','t':'emit','at':a,'life':.1,'att':'feet','pos':[0,Y,1],'rate':160,'from':'ring','fr':1.4,'dir':'in','speed':[8,12],'plife':[.08,.14],
        'look':'streak','size':[1,1.8],'col':[G['lime'],G['aqua'],G['mint']][i],'c2':G['outer'],'gravity':0,'drag':0,'curl':False})
    L.append({'id':f'cast{i}_flash','t':'flash','at':round(a+.1,3),'life':.08,'att':'feet','pos':[0,Y,1],'col':G['mint'],'size0':.2,'size':1.1,'k':.45})
    L.append({'id':f'cast{i}_kick','t':'warp','at':round(a+.1,3),'life':.16,'att':'feet','pos':[0,Y,1],'kind':'shock','size':{'0':.2,'1':1.8},'str':.6,'op':{'0':1,'1':0},'col':G['inner'],'glow':.03})
# no cast light (point-light budget)
#L.append({'id':'cast_light','t':'light','at':0,'life':T0+2*GAP+.1,'att':'feet','pos':[0,Y,.8],'col':G['mid'],'int':{'0':0,'0.2':1.6,'0.8':1.6,'1':0},'dist':5})

# ---------- orb 1: catches the enemy and drags it into the wind wall ----------
t_hit=T0+FLY*(ENEMY_Z-1)/(RANGE-1)              # reaches the enemy
t_wall=t_hit+FLY*(WALL_Z-ENEMY_Z)/(RANGE-1)*1.3  # slower while dragging
orb(L,'o0_',T0,round(t_wall-T0,3),WALL_Z-.6,end_pop=False)
for i in (1,2):
    orb(L,f'o{i}_',round(T0+i*GAP,3),FLY,RANGE,lit=i==2)   # max 2 point lights

# grab: wind rings bind the enemy and ride along with the orb into the wall
SL=round(t_wall-t_hit+.1,3)
def ez(u):return ENEMY_Z+(WALL_Z-.6-ENEMY_Z)*min(1,u*SL/(t_wall-t_hit))
EP=lambda y:{str(round(u,2)):[0,y,round(ez(u),3)] for u in (0,.25,.5,.75,1)}
L.append({'id':'grab_flash','t':'flash','at':round(t_hit,3),'life':.1,'att':'feet','pos':[0,Y,ENEMY_Z],'col':G['inner'],'size0':.3,'size':1.6,'k':.6})
for j,(y,sc,sp,tex,col) in enumerate([(.35,.8,560,'wind_swoosh_a_hi',G['mint']),(.95,.65,-480,'wind_swoosh_b',G['aqua']),(1.55,.55,640,'wind_swoosh_a_hi',G['lime'])]):
    L.append({'id':f'grab{j}','t':'mesh','at':round(t_hit,3),'life':SL,'att':'feet','shape':'model','model':f'wind_pieces{j}','mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[0,0],'pos':EP(y),'rot':[0,j*70,0],'scale':{'0':[1.5*sc,.25,1.5*sc],'0.2':[sc,.3,sc],'1':[sc*.8,.3,sc*.8],'ease':'out'},'spin':sp,
        'op':{'0':0,'0.12':.95,'0.85':.9,'1':0},'fade':0})
L.append({'id':'grab_drag','t':'emit','at':round(t_hit,3),'life':round(t_wall-t_hit,3),'att':'feet','pos':EP(.08),'rate':140,'from':'disc','fr':.7,'dir':'aim','yaw':180,'spread':.2,'up':[0,.5],
    'speed':[4,8],'plife':[.25,.45],'look':'streak','size':[1,1.8],'col':G['inner'],'c2':G['outer'],'gravity':1,'drag':1.5,'curl':False})
L.append({'id':'grab_dust','t':'emit','at':round(t_hit,3),'life':round(t_wall-t_hit,3),'att':'feet','pos':EP(.1),'rate':40,'from':'disc','fr':.6,'dir':'up','spread':.6,
    'speed':[.5,1.5],'plife':[.4,.7],'look':'smoke','size':[4,7],'grow':1,'col':'#cfd8d2','c2':'#7d8a84','gravity':-.2,'drag':2,'x':True})

# ---------- wall stun: orb implodes, then bursts out with cracks ----------
HP=[0,Y,WALL_Z-.6];tw=round(t_wall,3)
L.append({'id':'stun_hit','t':'use','at':tw,'life':.6,'att':'feet','pos':[0,0,WALL_Z],'fx':'wind/wall_hit'})
L.append({'id':'stun_suck','t':'emit','at':round(tw-.1,3),'life':.1,'att':'feet','pos':HP,'rate':200,'from':'sphere','fr':2.4,'dir':'in','speed':[14,20],'plife':[.08,.12],
    'look':'streak','size':[1.2,2.2],'col':G['hi'],'c2':G['aqua'],'gravity':0,'drag':0,'curl':False})
L.append({'id':'stun_flash','t':'flash','at':tw,'life':.12,'att':'feet','pos':HP,'col':G['inner'],'size0':.4,'size':2.4,'k':.8})
L.append({'id':'stun_ring','t':'mesh','at':tw,'life':.3,'att':'feet','shape':'plane','mat':'tex','tex':T('wind_void_disk_b'),'col':'#ffffff','col2':'#000000','rim':0,
    'uvTile':[1,1],'uvScroll':[0,0],'pos':HP,'rot':[0,0,0],'spin':700,'scale':{'0':1,'1':6,'ease':'out'},'op':{'0':1,'1':0},'fade':0})
L.append({'id':'stun_cracks','t':'emit','at':tw,'life':.04,'att':'feet','pos':HP,'burst':40,'rate':0,'from':'sphere','fr':.2,'dir':'out','speed':[7,13],'plife':[.12,.26],
    'look':'streak','size':[1.4,2.6],'col':'#ffffff','c2':'#b9c4bd','gravity':0,'drag':4,'curl':False})
L.append({'id':'stun_chips','t':'emit','at':tw,'life':.04,'att':'feet','pos':HP,'burst':22,'rate':0,'from':'sphere','fr':.3,'dir':'out','speed':[3,8],'plife':[.3,.55],
    'look':'model','model':'wind_wing_airchip','mmat':'glow','msize':[.14,.3],'col':G['lime'],'c2':G['teal'],'mspin':400,'gravity':2,'drag':1,'bounce':0})
L.append({'id':'stun_shock','t':'warp','at':tw,'life':.24,'att':'feet','pos':HP,'kind':'shock','size':{'0':.3,'1':3.4},'str':1,'op':{'0':1,'1':0},'col':G['inner'],'glow':.04})
L.append({'id':'stun_stars','t':'emit','at':round(tw+.08,3),'life':.5,'att':'feet','pos':[0,2.1,WALL_Z-.6],'rate':20,'from':'ring','fr':.45,'dir':'tangent','speed':[1.5,2.5],'plife':[.3,.5],
    'look':'glow','size':[.8,1.3],'col':G['lime'],'c2':G['aqua'],'gravity':0,'drag':0})
L.append({'id':'stun_shake','t':'screen','at':tw,'life':.14,'shake':2,'own':True})

DUR=round(max(T0+2*GAP+FLY,tw+.6)+.1,2)
fx={'v':1,'desc':'Void Spheres (สายลม สกิล 4): ยิงลูกหลุมดำลม 3 ลูกติดกัน — แกนดำ + จานลมหมุนหลายสี (ขาว มิ้นต์ เขียวนีออน มะนาว เขียวน้ำทะเล) • ลูกแรกจับศัตรูลากไปชนกำแพงลม = สตัน • ลูก 2-3 บินสุด 20 ม. แล้วยุบแตก • ไม่มีลมหมึก • ตัวอย่างใน Studio',
    'tags':['wind','void','blackhole','projectile'],'pal':'wind','dur':DUR,'seed':4,'layers':L}
(ROOT/'assets/fx/wind/void_spheres.fx.json').write_text(json.dumps(fx,ensure_ascii=False,indent=1),encoding='utf-8')
print('wind/void_spheres',len(L),'layers dur',DUR)

# ---------- single orb (loops in place) — the game attaches this to the projectile ----------
O=[]
orb(O,'',0,1.0,1.0,end_pop=False)
for l in O:
    l['loop']=True;l['at']=0
    if 'pos' in l:l['pos']=[0,Y,1.0] if l['t']!='trail' else l['pos']
    if l['t']=='trail':l['pos']=[0,Y,1.0]
    if isinstance(l.get('op'),dict):l['op']=1
    if isinstance(l.get('scale'),dict):l['scale']=[v for k,v in sorted(l['scale'].items())][2] if len(l['scale'])>3 else 1
    if l['t']=='light':l['int']=2
O=[l for l in O if l['t']!='trail']   # trails come from the moving projectile in game
fx={'v':1,'desc':'Void Spheres: ลูกหลุมดำลม 1 ลูก (วน) — แกนดำ วงแสงขาว จานลมหมุน 3 ชั้นหลายสี ลมถูกดูดเข้า • ให้เกมยึดกับกระสุน',
    'tags':['wind','void','blackhole','projectile','loop'],'pal':'wind','dur':1.0,'seed':4,'layers':O}
(ROOT/'assets/fx/wind/void_orb.fx.json').write_text(json.dumps(fx,ensure_ascii=False,indent=1),encoding='utf-8')
print('wind/void_orb',len(O),'layers')
