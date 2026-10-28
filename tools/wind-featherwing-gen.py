# Featherwing (wind skill 5: fly on the wind wings). Studio demo only (not bound to the game yet).
# Run: python tools/wind-featherwing-gen.py then node tools/fx-check.js • view studio.html?fx=wind/featherwing
# Shots (user 2026-10-28):
#  1 take-off: one strong flap, wind ring bursts on the ground, rise with up-streaks
#  2 flight: mostly gliding — wings held open, only a few light flaps with long gaps
#  3 flick: short charge (wings sweep back and instantly glow brighter neon green), then both wings snap forward and
#    launch a wide wind fan forward, slanted down to the ground (range 250 = 12.5 m)
#  4 just fall to the ground; wings return to the open (กางปีก) pose after the flick — no extra effect
# The studio dummy cannot fly, so the wings and effects rise by themselves to show the height. No ink.
import json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
WING=json.loads((ROOT/'assets/fx/wind/wing_angular.fx.json').read_text(encoding='utf-8'))
G=dict(inner='#efffe8',mid='#8dff65',outer='#2ec772',hi='#ffffff',line='#196a40',neon='#b6ff4a',deep='#0f4a2c')
T=lambda n:'tex/'+n
H=3.2                                   # flight height shown in the demo (m)
T_UP,T_GLIDE,T_CH,T_FL,T_FALL,T_LAND=0.0,0.5,3.0,3.32,3.5,4.25
FLAPS=[1.25,2.3]                        # light flaps during the glide (few, long gaps)
DUR=4.6
FAN=12.5                                # flick range m (250 units)
def lift(t):
    if t<0.12:return 0.0
    if t<0.85:u=(t-.12)/.73;return H*(1-(1-u)**2.4)
    if t<T_FALL:return H+0.12*math.sin((t-.85)*2.4)                 # slow bob while gliding
    if t<T_LAND:u=(t-T_FALL)/(T_LAND-T_FALL);return (H+0.12*math.sin((T_FALL-.85)*2.4))*(1-u*u)   # falls (gravity)
    return 0.0
OPEN=(12,0)                             # (z roll, y sweep) = wings held open (glide pose)
def wing_rot(t,side):
    z,y=OPEN
    if t<.12:u=t/.12;z=-10+50*u                                          # raise high
    elif t<.24:u=(t-.12)/.12;z=40-70*u                                   # strong down-beat
    elif t<T_GLIDE:u=(t-.24)/(T_GLIDE-.24);z=-30+42*u                    # back to open
    elif t<T_CH:
        for f in FLAPS:                                                  # light flap: small and slow
            if f<=t<f+.6:
                u=(t-f)/.6;z=OPEN[0]+(14*math.sin(u*math.pi*2) if u<.5 else -10*math.sin((u-.5)*math.pi*2));break
    elif t<T_FL:u=(t-T_CH)/(T_FL-T_CH);z,y=12+20*u,48*u                  # charge: sweep back
    elif t<T_FALL:u=min(1,(t-T_FL)/.1);z,y=32-30*u,48-90*u               # snap forward
    else:u=min(1,(t-T_FALL)/.4);z,y=2+10*u,-42+42*u                      # back to the open pose while falling
    return [0,round(side*y,1),round(side*z,1)]
KEYS=sorted(set([round(x*.05,3) for x in range(int(DUR/.05)+1)]+[.12,.24,T_GLIDE,T_CH,T_FL,T_FL+.1,T_FALL,T_LAND]+[f+d for f in FLAPS for d in (0,.15,.3,.45,.6)]))
ck=lambda t:str(round(t/DUR,4))
BIG=1.6                                 # wings grow while flying (user: bigger than the normal wing)
def wscale(t):
    if t<.05:return 1.0
    if t<.25:return 1+(BIG-1)*(t-.05)/.2
    if t<T_LAND+.05:return BIG
    return BIG-(BIG-1)*min(1,(t-T_LAND-.05)/.25)
L=[]
# ---------- the approved angular wings, posed by the curves above ----------
for w in WING['layers']:
    side=1 if w['id'].startswith('R') else -1
    if w['t']=='mesh':
        n=dict(w);n.pop('loop',None);n['at']=0;n['life']=DUR
        p0=w['pos'];n['pos']={ck(t):[p0[0],round(p0[1]+lift(t),3),p0[2]] for t in KEYS}
        n['rot']={ck(t):wing_rot(t,side) for t in KEYS}
        n['scale']={ck(t):round(wscale(t),3) for t in KEYS}
        b=n.get('op',.3);n['op']={'0':0,ck(.08):b*1.6,ck(.5):b*1.2,ck(T_CH):b*1.2,ck(T_CH+.05):min(.9,b*2.6),ck(T_FL+.1):min(.9,b*2.4),ck(T_FALL+.3):b*1.3,ck(DUR-.15):b*1.2,'1':0}
        L.append(n)
    elif w['id'].endswith(('airchips','motes')):
        n=dict(w);n.pop('loop',None);n['at']=0;n['life']=DUR-.2;L.append(n)
# neon charge glow: feathers + spines light up instantly when the charge starts, peak at the flick
for side,suf in((1,''),(-1,'_L')):
    p0=[.135*side,1.602,-.238]
    GK=[t for t in KEYS if T_CH-.01<=t<=T_FALL+.25]
    for part,col,c2,pk in(('feathers',G['neon'],G['mid'],.85),('spines',G['hi'],G['neon'],.95)):
        L.append({'id':f's3_glow_{part}{suf or "_R"}','t':'mesh','at':T_CH,'life':round(T_FALL+.25-T_CH,3),'att':'feet','shape':'model','model':f'wind_wing_angular_{part}'+suf,
            'mat':'energy' if part=='feathers' else 'glow','col':col,'col2':c2,'rim':.9,'fade':0,'scale':round(BIG*1.02,3),
            'pos':{str(round((t-T_CH)/(T_FALL+.25-T_CH),3)):[p0[0],round(p0[1]+lift(t),3),p0[2]] for t in GK},
            'rot':{str(round((t-T_CH)/(T_FALL+.25-T_CH),3)):wing_rot(t,side) for t in GK},'op':{'0':0,'0.06':pk*.8,'0.6':pk,'0.75':pk,'1':0}})

# ---------- shot 1: take-off ----------
L.append({'id':'s1_ring','t':'emit','at':.2,'life':.05,'att':'feet','pos':[0,.1,0],'burst':55,'rate':0,'from':'ring','fr':.5,'dir':'flat','speed':[6,11],'up':[.2,1.2],
    'plife':[.25,.45],'look':'streak','size':[1.2,2.2],'col':G['inner'],'c2':G['outer'],'gravity':2,'drag':3,'curl':False})
for k,(tex,col,sc,sp) in enumerate([('wind_swoosh_a_hi',G['hi'],2.0,380),('wind_swoosh_b',G['mid'],2.8,-300),('wind_swoosh_a_hi',G['neon'],3.4,240)]):
    L.append({'id':f's1_swirl{k}','t':'mesh','at':.2,'life':.5,'att':'feet','shape':'model','model':'wind_groundswirl','mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[0,0],'pos':[0,.05+k*.03,0],'rot':[0,k*120,0],'scale':{'0':sc*.3,'1':sc,'ease':'out'},'spin':sp,'op':{'0':0,'0.1':.9,'1':0},'fade':0})
L.append({'id':'s1_dust','t':'emit','at':.2,'life':.08,'att':'feet','pos':[0,.15,0],'burst':14,'rate':0,'from':'ring','fr':.8,'dir':'flat','speed':[2,4],'up':[.2,.8],
    'plife':[.5,.9],'look':'smoke','size':[5,8],'grow':1.2,'col':'#d9e3dc','c2':'#8a9690','gravity':-.2,'drag':2.5,'x':True})
L.append({'id':'s1_up','t':'emit','at':.18,'life':.6,'att':'feet','pos':{'0':[0,.4,0],'1':[0,H*.9,0],'ease':'out'},'rate':90,'from':'disc','fr':.8,'dir':'up','spread':.12,
    'speed':[7,12],'plife':[.12,.22],'look':'streak','size':[1,1.8],'col':G['inner'],'c2':G['mid'],'gravity':0,'drag':1,'curl':False})
L.append({'id':'s1_kick','t':'warp','at':.2,'life':.22,'att':'feet','pos':[0,.2,0],'kind':'shock','flat':True,'size':{'0':.4,'1':3.5},'str':.7,'op':{'0':1,'1':0},'col':G['inner'],'glow':.03})
L.append({'id':'s1_light','t':'light','at':.15,'life':.4,'att':'feet','pos':[0,1.5,0],'col':G['mid'],'int':{'0':0,'0.3':2,'1':0},'dist':6})

# ---------- shot 2: glide — soft air under the body, wind slipping off the wings, chips on each light flap ----------
GL=T_CH-T_GLIDE
L.append({'id':'s2_under','t':'mesh','at':T_GLIDE,'life':GL,'att':'feet','shape':'model','model':'wind_groundswirl','mat':'tex','tex':T('wind_swoosh_b'),'col':G['mid'],'col2':'#000000','rim':0,
    'uvTile':[1,1],'uvScroll':[0,0],'pos':[0,H-.15,0],'rot':[0,0,0],'scale':1.3,'spin':160,'op':{'0':0,'0.1':.35,'0.9':.35,'1':0},'fade':0})
L.append({'id':'s2_slip','t':'emit','at':T_GLIDE,'life':GL,'att':'feet','pos':[0,H+1.7,-.5],'rate':40,'from':'line','fh':.1,'dir':'aim','yaw':180,'spread':.15,
    'speed':[3,5],'plife':[.3,.5],'look':'streak','size':[.8,1.4],'col':G['inner'],'c2':G['outer'],'gravity':0,'drag':.5,'curl':False,'x':True})
for side in(1,-1):
    L.append({'id':f's2_tipwind{"R" if side>0 else "L"}','t':'emit','at':T_GLIDE,'life':GL,'att':'feet','pos':[side*3.4,H+2.9,-.8],'rate':30,'from':'sphere','fr':.4,'dir':'aim','yaw':180,
        'spread':.1,'speed':[3,5],'plife':[.25,.45],'look':'streak','size':[.7,1.2],'col':G['mid'],'c2':G['outer'],'gravity':0,'drag':.3,'curl':False})
for i,f in enumerate(FLAPS):
    L.append({'id':f's2_flapchips{i}','t':'emit','at':f+.3,'life':.05,'att':'feet','pos':[0,H+1.6,-.4],'burst':10,'rate':0,'from':'line','fh':.1,'dir':'down','spread':.8,
        'speed':[1,2.5],'plife':[.5,.8],'look':'model','model':'wind_wing_airchip','mmat':'glow','msize':[.1,.2],'col':G['mid'],'c2':G['outer'],'mspin':300,'gravity':-.3,'drag':1.5,'bounce':0})
    L.append({'id':f's2_flappuff{i}','t':'emit','at':f+.3,'life':.05,'att':'feet','pos':[0,H+.6,0],'burst':16,'rate':0,'from':'ring','fr':.6,'dir':'down','spread':.6,
        'speed':[2,4],'plife':[.2,.35],'look':'streak','size':[.8,1.4],'col':G['inner'],'c2':G['mid'],'gravity':0,'drag':2,'curl':False})

# ---------- shot 3: charge (instant neon glow) then flick — a wide wind fan forward, slanted down ----------
HC=H+2.0
L.append({'id':'s3_flashon','t':'flash','at':T_CH,'life':.1,'att':'feet','pos':[0,HC,-.4],'col':G['neon'],'size0':.5,'size':2.2,'k':.55})
L.append({'id':'s3_suck','t':'emit','at':T_CH,'life':T_FL-T_CH,'att':'feet','pos':[0,HC,-.4],'rate':180,'from':'sphere','fr':2.8,'dir':'in','speed':[9,13],'plife':[.12,.2],
    'look':'streak','size':[1,1.8],'col':G['neon'],'c2':G['mid'],'gravity':0,'drag':0,'curl':False})
L.append({'id':'s3_light','t':'light','at':T_CH,'life':.75,'att':'feet','pos':[0,HC,0],'col':G['neon'],'int':{'0':1.5,'0.4':2.4,'1':0},'dist':8})
L.append({'id':'s3_snap','t':'flash','at':T_FL+.06,'life':.12,'att':'feet','pos':[0,HC,.6],'col':G['inner'],'size0':.5,'size':2.6,'k':.7})
L.append({'id':'s3_kick','t':'warp','at':T_FL+.06,'life':.25,'att':'feet','pos':[0,HC,.8],'kind':'shock','size':{'0':.5,'1':4},'str':.9,'op':{'0':1,'1':0},'col':G['inner'],'glow':.04})
TL=T_FL+.06
for j,(x,dy,dz) in enumerate([(-3.2,.4,-1.5),(-1.6,0,-.5),(0,.2,0),(1.6,0,-.5),(3.2,.4,-1.5),(-2.4,1,-2.5),(2.4,1,-2.5),(0,1.2,-3)]):
    zs=1+dz*.3;ze=FAN+dz;y0=HC+dy-.4;y1=.6+dy*.4
    for k,(tex,col,m) in enumerate([('wind_swoosh_a_hi',G['hi'],1.0),('wind_swoosh_b',G['mid'],1.3)]):
        L.append({'id':f's3_curl{j}_{k}','t':'mesh','at':round(TL+j*.015,3),'life':.55,'att':'feet','shape':'model','model':f'wind_pieces{(j+k)%3}','mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,
            'uvTile':[1,1],'uvScroll':[0,0],'pos':{'0':[x*.4,round(y0,2),round(zs,2)],'0.45':[x,round((y0+y1)/2+.3,2),round(ze*.62,2)],'1':[x*1.15,round(y1,2),round(ze,2)],'ease':'out'},
            'rot':[-25,90,j*35],'scale':{'0':[.4*m,.2,.4*m],'0.4':[1.1*m,.3,1.1*m],'1':[1.6*m,.2,1.6*m],'ease':'out'},'spin':(-620 if j%2 else 620),'op':{'0':0,'0.08':.9,'0.7':.6,'1':0},'fade':0})
L.append({'id':'s3_fan','t':'emit','at':TL,'life':.35,'att':'feet','pos':[0,HC,.6],'rate':200,'from':'line','fh':.1,'dir':'aim','spread':.55,
    'speed':[18,26],'up':[-8,-5],'plife':[.25,.45],'look':'streak','size':[1.2,2.4],'col':G['inner'],'c2':G['mid'],'gravity':0,'drag':1,'curl':False})
L.append({'id':'s3_chips','t':'emit','at':TL,'life':.3,'att':'feet','pos':[0,HC,.6],'rate':60,'from':'sphere','fr':1.2,'dir':'aim','spread':.6,'speed':[12,18],'up':[-5,-2],
    'plife':[.4,.7],'look':'model','model':'wind_wing_airchip','mmat':'glow','msize':[.12,.26],'col':G['neon'],'c2':G['outer'],'mspin':500,'gravity':.5,'drag':.8,'bounce':0})
# where the fan reaches the ground: wind scraping along the floor
L.append({'id':'s3_floor','t':'emit','at':round(TL+.2,3),'life':.4,'att':'feet','pos':{'0':[0,.1,6],'1':[0,.1,FAN]},'rate':160,'from':'disc','fr':3,'dir':'aim','spread':.35,'up':[0,.5],
    'speed':[8,14],'plife':[.2,.4],'look':'streak','size':[1,1.8],'col':G['inner'],'c2':G['outer'],'gravity':1,'drag':1.5,'curl':False})
L.append({'id':'s3_dust','t':'emit','at':round(TL+.22,3),'life':.3,'att':'feet','pos':{'0':[0,.15,6],'1':[0,.15,FAN]},'rate':40,'from':'disc','fr':3,'dir':'aim','spread':.6,'up':[.2,.8],
    'speed':[3,6],'plife':[.5,.9],'look':'smoke','size':[5,8],'grow':1,'col':'#d9e3dc','c2':'#8a9690','gravity':-.2,'drag':2,'x':True})
L.append({'id':'s3_shake','t':'screen','at':TL,'life':.15,'shake':1.6,'own':True})
# shot 4: just falls — the wing curves return to the open pose (no extra layers, user)

fx={'v':1,'desc':'Featherwing (สายลม สกิล 5 บินปีก): กระพือแรงขึ้นบิน + วงลมพื้น → ร่อนเป็นหลัก กระพือเบา ๆ นาน ๆ ครั้ง → ชาร์จ ปีกเรืองเขียวนีออนทันที แล้วสะบัดลมพัดไปข้างหน้าเอียงลงพื้น 12.5 ม. → ตกลงพื้น ปีกกลับท่ากาง • ไม่มีลมหมึก • ตัวอย่างใน Studio',
    'tags':['wind','featherwing','fly','wing'],'pal':'wind','dur':DUR,'seed':5,'layers':L}
(ROOT/'assets/fx/wind/featherwing.fx.json').write_text(json.dumps(fx,ensure_ascii=False,indent=1),encoding='utf-8')
print('wind/featherwing',len(L),'layers')
