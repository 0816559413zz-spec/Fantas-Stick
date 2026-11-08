# Windblade — storyboard #21 (user 2026-11-08) → two variants: wind/windblade_sb_a, wind/windblade_sb_b
# Run: python tools/wind-blade-sb-gen.py then node tools/fx-check.js • view studio.html?fx=wind/windblade_sb_a
# Showcase of the WHOLE timeline (played once at the caster, +z = toward the target 10.5 m = 5 characters away):
#   shot1 release 0–0.2 • shot2 travel 0.2–0.5 • shot3 impact 0.5–0.9 • shot4 linger 0.9–2.9 (= the 2 s slow) • shot5 fade 2.9–3.2
# NOTE: in the game the blades fly 120 m/s (hit within ~0.1 s) and are shot 14× 0.04 s apart (0.56 s); the board's slower flow is for reading the look.
#   After the user picks a variant the pieces get split per event (per-blade fly / hit / slow) — not bound yet.
# Sketch: many short white + green dashes (tiny curved blades) streaming from the caster's front to the target, swarming around it,
#   target gets glowing green slash scars, then a few dashes keep circling its feet while it is slowed. Reference = long thin white wind streaks.
#   A "swarm of dashes" (particles)   B "real small crescent blades" (meshes with trails)
import json,math,random
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
G=dict(g1='#27c765',hi='#ffffff',mint='#d8ffe0',mid='#8dff65',lime='#c6ff5a',deep='#0f9d55',gray='#cfcfcf')
TZ=10.5          # target distance (m)
CY=1.15          # chest height of the target (m)
def save(n,layers,desc,dur=3.2,params=None,tags=None):
    d={'v':1,'desc':desc,'tags':['wind','blade']+(tags or ['storyboard']),'pal':'wind','dur':dur,'seed':21,'layers':layers}
    if params:d['params']=params
    (ROOT/f'assets/fx/wind/{n}.fx.json').write_text(json.dumps(d,ensure_ascii=False,indent=1),encoding='utf-8')
    print('wind/'+n,len(layers),'layers')
def r2(v):return v if isinstance(v,str) else round(v,3)
def emit(lid,at,life,pos,frm,**k):
    d={'id':lid,'t':'emit','at':r2(at),'life':r2(life),'att':'point','pos':pos,'from':frm,'gravity':0,'drag':1,'curl':False};d.update(k);return d
def flash(lid,at,life,pos,size,col,k=1.2):
    return {'id':lid,'t':'flash','at':r2(at),'life':r2(life),'att':'point','pos':pos,'col':col,'size0':size*.4,'size':size,'k':k}
def sweep(lid,at,tilt,a0,a1,r,r0,w,col=G['mid'],col2=G['hi'],tlife=.35,k=2.2,yaw=0,pos=None):
    return {'id':lid,'t':'trail','at':r2(at),'life':.3,'att':'point','pos':pos or [0,CY,TZ],'yaw':yaw,'sweep':True,'a0':a0,'a1':a1,'r':r,'r0':r0,'tilt':tilt,'col':col,'col2':col2,'w':w,'tlife':tlife,'k':k}
rnd=random.Random(21)

# ============ A: swarm of dashes ============
def dash(lid,at,life,pa,pb,L_=.6,w=.05,green=True,op=1):
    """a short crisp dash: a thin elongated bar flying pa→pb (long axis = z = flight direction)"""
    d=pb[2]-pa[2];dxz=math.hypot(pb[0]-pa[0],d);yaw=math.degrees(math.atan2(pb[0]-pa[0],d));pit=-math.degrees(math.atan2(pb[1]-pa[1],dxz))
    m=dict(mat='toon',col=G['g1'],col2=G['deep']) if green else dict(mat='glow',col=G['hi'],col2=G['mint'])
    return {'id':lid,'t':'mesh','at':r2(at),'life':r2(life),'att':'point','shape':'sphere','fade':0,'rim':0,**m,
            'pos':{'0':[r2(v) for v in pa],'1':[r2(v) for v in pb]},'rot':[r2(pit),r2(yaw),0],'scale':[w,w,L_],'op':{'0':0,'.1':op,'.8':op,'1':0}}
def variant_a():
    L=[]
    # shot 1 release 0–0.2: dashes burst from in front of the hand
    L.append(flash('s1_hand',0,.2,[0,1.3,.7],.7,G['hi'],1.0))
    L.append(emit('s1_white',0,.2,[0,1.3,1.8],'sphere',burst=40,fr=.8,dir='aim',spread=.35,speed=[14,26],plife=[.15,.3],look='streak',size=[4.5,7],col=G['hi'],c2=G['g1'],drag=.8))
    L.append(emit('s1_green',0,.2,[0,1.3,1.8],'sphere',burst=34,fr=.9,dir='aim',spread=.45,speed=[12,22],plife=[.15,.3],look='streak',size=[4,6.5],col=G['g1'],c2=G['mid'],drag=.8))
    for i in range(14):   # first dashes already leaving the hand
        x=rnd.uniform(-.7,.7);y=rnd.uniform(.9,1.7);z=rnd.uniform(.8,1.6)
        L.append(dash(f's1_d{i}',rnd.uniform(.03,.14),.18,[x,y,z],[x*1.3,y+rnd.uniform(-.2,.2),z+3.2],rnd.uniform(.4,.7),.05,i%3!=0))
    # shot 2 travel 0.2–0.5: a swarm of ~40 dashes flows to the target and spreads around it
    for i in range(40):
        x=rnd.uniform(-1.1,1.1);y=rnd.uniform(.8,1.8);z=rnd.uniform(1.4,3.0);at=.2+rnd.uniform(0,.12)
        L.append(dash(f's2_d{i}',at,rnd.uniform(.27,.34),[x,y,z],[x*.5+rnd.uniform(-.4,.4),CY+rnd.uniform(-.55,.55),TZ+rnd.uniform(-1.2,.6)],rnd.uniform(.4,.8),rnd.uniform(.045,.07),i%3!=0))
    # shot 3 impact 0.5–0.9: dashes swarm around the target + glowing green slash scars across its body
    L.append(emit('s3_burst',.5,.1,[0,CY,TZ],'sphere',burst=56,fr=.9,dir='out',spread=1,speed=[5,12],plife=[.2,.45],look='streak',size=[4.5,7],col=G['g1'],c2=G['mid'],drag=2))
    L.append(flash('s3_glow',.5,.35,[0,CY,TZ],1.3,G['mid'],.9))
    for i,(dx,dz,dy,dt) in enumerate([(-.7,-.7,.9,0),(.7,-.6,.8,.05),(-.8,.5,.6,.1),(.6,.7,.9,.15),(0,0,1.0,.2)]):
        d=dash(f's3_cut{i}',.5+dt,.3,[dx,CY+dy,TZ+dz],[-dx,CY-dy*.9,TZ-dz],1.9,.09,True)
        d['col']=G['mid'];d['mat']='glow';d['col2']=G['hi'];d['pos']={'0':[dx,CY+dy,TZ+dz],'.5':[0,CY,TZ],'1':[-dx,CY-dy*.9,TZ-dz]};L.append(d)
    # shot 4 linger 0.9–2.9: a few dashes keep circling the target's feet (it is slowed), green shimmer on the body
    for i in range(6):
        ph=i*2*math.pi/6;rev=2.2
        th=lambda j:ph+j/20*rev*2*math.pi
        pk={str(round(j/20,4)):[r2(math.cos(th(j))*1.05),r2(.35+.1*math.sin(j)),r2(TZ+math.sin(th(j))*1.05)] for j in range(21)}
        rk={str(round(j/20,4)):[0,r2(math.degrees(math.atan2(-math.sin(th(j)),math.cos(th(j))))),0] for j in range(21)}
        L.append({'id':f's4_o{i}','t':'mesh','at':.9,'life':2.0,'att':'point','pos':pk,'rot':rk,'shape':'sphere','mat':'toon','col':G['g1'] if i%2 else G['mid'],'col2':G['deep'],'rim':0,'fade':0,'scale':[.06,.06,.55],'op':{'0':0,'.1':1,'.85':1,'1':0}})
    L.append(emit('s4_glint',.9,1.7,[0,CY-.1,TZ],'sphere',rate=9,fr=.5,dir='out',speed=[.3,1],plife=[.3,.6],look='glow',size=[.9,1.5],col=G['mid'],c2=G['deep'],drag=2,gravity=-.2))
    return L

# ============ B: real small crescent blades ============
def variant_b():
    L=[]
    N=14
    L.append(flash('s1_hand',0,.2,[0,1.3,.7],.9,G['hi']))
    L.append(emit('s1_air',0,.25,[0,1.3,1.2],'sphere',burst=18,fr=.5,dir='aim',spread=.5,speed=[8,16],plife=[.12,.22],look='streak',size=[3,5],col=G['hi'],c2=G['g1'],drag=1))
    for i in range(N):
        at=.02+i*.03;T=.3
        sx,sy=rnd.uniform(-.55,.55),rnd.uniform(1.0,1.7)
        ex,ey=rnd.uniform(-.45,.45),CY+rnd.uniform(-.45,.5)
        bid=f's2_blade{i}'
        L.append({'id':bid,'t':'mesh','at':r2(at),'life':T,'att':'point','shape':'crescent','mat':'toon','col':G['hi'] if i%2 else G['mint'],'col2':G['deep'],'fade':0,'rim':1.4,
                  'pos':{'0':[r2(sx),r2(sy),.9],'1':[r2(ex),r2(ey),TZ+3.5]},'scale':[.55,.55,.55],'rot':[0,0,rnd.choice([-35,0,25,70])],'op':{'0':0,'.1':1,'.85':1,'1':0}})
        L.append({'id':f's2_tr{i}','t':'trail','at':r2(at),'life':T,'of':bid,'col':G['g1'] if i%3 else G['hi'],'col2':G['mid'],'w':.1,'tlife':.22,'k':1.8})
        # hit spark when blade i reaches the target (z=TZ at 0.8 of its flight)
        h=at+T*(TZ-.9)/(TZ+3.5-.9)
        L.append(flash(f's3_pop{i}',h,.14,[r2(ex*.8),r2(ey),TZ],.55,G['mid'],1.4))
    # slash scars on the target: big thin green crescents flashing across the body (glowing cuts)
    for i,(rz,dx,dy,dt) in enumerate([(-40,-.2,.35,0),(35,.25,.1,.07),(-15,0,-.2,.14),(60,-.3,.15,.21),(0,.15,.5,.28)]):
        L.append({'id':f's3_cut{i}','t':'mesh','at':r2(.52+dt),'life':.34,'att':'point','pos':[dx,r2(CY+dy),TZ],'shape':'crescent','mat':'toon','col':G['mid'],'col2':G['deep'],'fade':0,'rim':1.5,
                  'rot':[0,90,rz],'scale':{'0':[.5,.5,.5],'.25':[1.5,1.5,1.5],'1':[1.7,1.7,1.7],'ease':'out'},'op':{'0':0,'.12':1,'.6':.9,'1':0}})
    L.append(emit('s3_burst',.5,.45,[0,CY,TZ],'sphere',rate=90,fr=.8,dir='out',spread=1,speed=[3,9],plife=[.2,.4],look='streak',size=[3.5,6],col=G['g1'],c2=G['mid'],drag=2))
    L.append(flash('s3_glow',.55,.35,[0,CY,TZ],1.2,G['mid'],.9))
    # shot 4 linger: three small crescent blades orbit slowly at the feet (= slowed), green glints on the body
    for i in range(3):
        ph=i*2*math.pi/3
        pk={str(round(j/16,4)):[r2(math.cos(ph+j/16*2.2*math.pi)*1.0),.5,r2(TZ+math.sin(ph+j/16*2.2*math.pi)*1.0)] for j in range(17)}
        rk={str(round(j/16,4)):[0,r2(-math.degrees(ph+j/16*2.2*math.pi)),0] for j in range(17)}
        L.append({'id':f's4_orb{i}','t':'mesh','at':.9,'life':2.0,'att':'point','pos':pk,'shape':'crescent','mat':'toon','col':G['mid'],'col2':G['deep'],'rim':1.2,'fade':0,
                  'scale':[.5,.5,.5],'rot':rk,'op':{'0':0,'.12':.9,'.85':.8,'1':0}})
    L.append(emit('s4_ring',.9,1.7,[0,.35,TZ],'ring',rate=18,fr=1.0,dir='tangent',speed=[2,3.5],plife=[.4,.7],look='streak',size=[3,5],col=G['g1'],c2=G['mid'],drag=.3,gravity=-.1))
    L.append(emit('s4_glint',.9,1.7,[0,CY-.1,TZ],'sphere',rate=9,fr=.5,dir='out',speed=[.3,1],plife=[.3,.6],look='glow',size=[.9,1.5],col=G['mid'],c2=G['deep'],drag=2,gravity=-.2))
    return L

save('windblade_sb_a',variant_a(),'Windblade (สตอรี่บอร์ด #21) แบบ A: ฝูงขีดลมสั้นขาว+เขียวพุ่งเป็นกลุ่มจากหน้าผู้ร่ายไปเป้า → รุมเป้า + รอยฟันเขียวเรือง → ขีดลมวนที่เท้าเป้าตอนช้า 2 วิ → จาง')
save('windblade_sb_b',variant_b(),'Windblade (สตอรี่บอร์ด #21) แบบ B: ใบมีดเสี้ยวเล็กจริง 14 ใบ มีหางแสง ยิงรัวเป็นพัด ทะลุเป้า → ประกายที่เป้า + รอยฟันเขียวเรือง → ใบมีด 3 ใบวนช้า ๆ ที่เท้าเป้าตอนช้า 2 วิ → จาง')


# ============ GAME PIECES of variant A (user chose A 2026-11-08) — bound in js/68-wind-view.js (wnblcast / wnblhit) + PJFX wbl (js/35-sync.js) ============
# Event anchors: cast = caster feet (+z aim) • hit = target CHEST (cH) • slow = target chest (orbit sits at the feet = y -0.75)
def pieces():
    # cast (shot 1): dashes burst from in front of the hand
    L=[flash('s1_hand',0,.2,[0,1.3,.7],.7,G['hi'],1.0),
       emit('s1_white',0,.2,[0,1.3,1.8],'sphere',burst=40,fr=.8,dir='aim',spread=.35,speed=[14,26],plife=[.15,.3],look='streak',size=[4.5,7],col=G['hi'],c2=G['g1'],drag=.8),
       emit('s1_green',0,.2,[0,1.3,1.8],'sphere',burst=34,fr=.9,dir='aim',spread=.45,speed=[12,22],plife=[.15,.3],look='streak',size=[4,6.5],col=G['g1'],c2=G['mid'],drag=.8)]
    for i in range(14):
        x=rnd.uniform(-.7,.7);y=rnd.uniform(.9,1.7);z=rnd.uniform(.8,1.6)
        L.append(dash(f's1_d{i}',rnd.uniform(.03,.14),.18,[x,y,z],[x*1.3,y+rnd.uniform(-.2,.2),z+3.2],rnd.uniform(.4,.7),.05,i%3!=0))
    save('blade_cast',L,'Windblade ปล่อย: ขีดลมสั้นเขียว-ขาวพุ่งออกจากหน้ามือเป็นฝอย (สตอรี่บอร์ด #21 แบบ A ช่วง 1)',.35,tags=['cast'])
    # fly (per blade, loops with the projectile): a short crisp green dash with a white core + a few streaks
    F=[{'id':'body','t':'mesh','at':0,'life':.3,'loop':True,'att':'point','pos':[0,0,0],'shape':'sphere','mat':'toon','col':G['g1'],'col2':G['deep'],'fade':0,'rim':0,'scale':[.08,.08,1.0],'op':1},
       {'id':'core','t':'mesh','at':0,'life':.3,'loop':True,'att':'point','pos':[0,0,.05],'shape':'sphere','mat':'glow','col':G['hi'],'col2':G['mint'],'fade':0,'rim':0,'scale':[.04,.04,.6],'op':.95},
       emit('streak',0,.3,[0,0,0],'sphere',loop=True,fr=.1,dir='aim',yaw=180,spread=.15,speed=[8,14],plife=[.08,.14],look='streak',size=[3,5],col=G['hi'],c2=G['g1'],rate=30,drag=.6,x=True)]
    save('blade_fly',F,'Windblade ใบมีดลมตามกระสุน (แบบ A): ขีดเขียวสั้นมีแกนขาว + ประกายเส้นลมตามหลัง',.3,tags=['projectile'])
    # pop (every blade that connects): small spark burst + one short cut
    P=[flash('p_glow',0,.22,[0,0,0],.7,G['mid'],.9),
       emit('p_burst',0,.1,[0,0,0],'sphere',burst=14,fr=.3,dir='out',spread=1,speed=[4,9],plife=[.15,.3],look='streak',size=[4,6.5],col=G['g1'],c2=G['mid'],drag=2),
       dash('p_cut',0,.22,[-.4,.4,-.35],[.4,-.35,.35],1.0,.07,True)]
    P[-1]['col']=G['mid'];P[-1]['mat']='glow';P[-1]['col2']=G['hi']
    save('blade_pop',P,'Windblade ใบมีดแต่ละใบโดนเป้า: ประกายขีดสั้น + รอยฟันเล็ก 1 เส้น',.35,tags=['hit'])
    # hit (first blade of a volley): dashes swarm out + 5 glowing slash scars across the body
    H=[emit('s3_burst',0,.1,[0,0,0],'sphere',burst=56,fr=.9,dir='out',spread=1,speed=[5,12],plife=[.2,.45],look='streak',size=[4.5,7],col=G['g1'],c2=G['mid'],drag=2),
       flash('s3_glow',0,.35,[0,0,0],1.3,G['mid'],.9)]
    for i,(dx,dz,dy,dt) in enumerate([(-.7,-.7,.9,0),(.7,-.6,.8,.05),(-.8,.5,.6,.1),(.6,.7,.9,.15),(0,0,1.0,.2)]):
        d=dash(f's3_cut{i}',dt,.3,[dx,dy,dz],[-dx,-dy*.9,-dz],1.9,.09,True)
        d['col']=G['mid'];d['mat']='glow';d['col2']=G['hi'];d['pos']={'0':[dx,dy,dz],'.5':[0,0,0],'1':[-dx,-dy*.9,-dz]};H.append(d)
    save('blade_hit',H,'Windblade โดนเป้า (ใบแรกของชุด): ขีดแผ่ออกรอบตัว + รอยฟันเขียวเรืองแสงไขว้ 5 เส้น',.6,tags=['hit'])
    # slow (p.t seconds): dashes circle the target's feet + green shimmer on the body
    S=[]
    for i in range(6):
        ph=i*2*math.pi/6;rev=2.2
        th=lambda j:ph+j/20*rev*2*math.pi
        pk={str(round(j/20,4)):[r2(math.cos(th(j))*1.05),r2(-.75+.1*math.sin(j)),r2(math.sin(th(j))*1.05)] for j in range(21)}
        rk={str(round(j/20,4)):[0,r2(math.degrees(math.atan2(-math.sin(th(j)),math.cos(th(j))))),0] for j in range(21)}
        S.append({'id':f's4_o{i}','t':'mesh','at':0,'life':'t','att':'point','pos':pk,'rot':rk,'shape':'sphere','mat':'toon','col':G['g1'] if i%2 else G['mid'],'col2':G['deep'],'rim':0,'fade':0,'scale':[.06,.06,.55],'op':{'0':0,'.1':1,'.85':1,'1':0}})
    S.append(emit('s4_glint',0,'t',[0,-.1,0],'sphere',rate=9,fr=.5,dir='out',speed=[.3,1],plife=[.3,.6],look='glow',size=[.9,1.5],col=G['mid'],c2=G['deep'],drag=2,gravity=-.2))
    save('blade_slow',S,'Windblade เป้าถูกถ่วง (ช้า): ขีดเขียวหมุนวนรอบเท้า + ประกายเขียวที่ตัว นาน p.t วิ',2.0,params={'t':{'def':2,'desc':'ระยะเวลาช้า (วิ)'}},tags=['slow'])
pieces()
