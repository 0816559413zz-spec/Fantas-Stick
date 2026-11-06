# Eye of Heaven (ult สายลม) — แบบ "ลมสมจริง อลังการ" (ผู้ใช้ขอ 2026-11-06)
# ใช้: python tools/wind-eye-real-gen.py แล้ว node tools/fx-check.js
# ดู:  studio.html?fx=wind/eye_real  (at=self: ผู้ร่ายอยู่ที่ 0 หันทาง +z)
# แนวคิด: "ตาพายุ" เฮอริเคนจริง — ผู้ร่ายยืนในตาพายุที่สงบ (มีลำแสงจากช่องเมฆ) รอบตัวคือกำแพงพายุ (eyewall)
#   เมฆฝุ่นหมุนบานออกขึ้นไปชนเมฆบนฟ้า, ลมกระโชกเป็นพายุหมุนเล็ก ๆ + ฝุ่น/ใบไม้/เศษหินปลิว, คลื่นลมกระแทกกวาดฝุ่นทั้งเขต
# เวลา = โค้ดเกม (js/09-wind.js W_UL): 1.0 ปักไม้ • 1.15 กำแพงวง 8 ชิ้น • 2.38 สะบัดปีก ลมกระแทก • กำแพงอยู่ถึง 7.4
# ไม่ใช้หมึก/ริบบิ้นการ์ตูน (กฎผู้ใช้) • สีหลัก = ฝุ่น/เมฆเทาอุ่น + ลมขาว มีเขียวลมนิดเดียว (เอกลักษณ์สายลม)
import json,math,random
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def save(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=1),encoding='utf-8')
R=17.5
T_SLAM,T_WALL,T_IMP,T_END=1.0,1.15,2.38,7.4
DUR=7.5
WHITE='#ffffff';MINT='#d8ffe0';GREEN='#8dff65'
DUST='#b8ae96';DUST2='#8c846f';CLOUD='#8d9694';CLOUDHI='#d6ddd9';SUN='#fff4d0'

# ------------------------------------------------------------ meshes (lathe: [รัศมี, สูง] หมุนรอบแกนตั้ง; u=รอบ v=ตามโปรไฟล์)
def lathe(name,desc,prof,seg=72):
    save(ROOT/f'assets/fx/mesh/{name}.mesh.json',{'v':1,'desc':desc,'mat':'solid','pal':'wind','tags':['wind','ult'],
        'parts':[{'id':'l','k':'lathe','prof':[[round(a,3),round(b,3)] for a,b in prof],'seg':seg}]})
# กำแพงพายุ (eyewall) 3 แถบซ้อนบานออก: ล่าง 0–6 ม. (ทึบ = ตรงกับกำแพงจริงสูง 5.4) • กลาง 6–13 • บน 13–25 (จางเข้าเมฆ)
lathe('wind_real_wall_a','Eye of Heaven (สมจริง): กำแพงพายุแถบล่าง 0–6 ม. รัศมี 17.5',[(R,0),(R*1.01,3),(R*1.03,6)],96)
lathe('wind_real_wall_b','Eye of Heaven (สมจริง): กำแพงพายุแถบกลาง 6–13 ม. บานออก',[(R*1.03,6),(R*1.07,9.5),(R*1.12,13)],96)
lathe('wind_real_wall_c','Eye of Heaven (สมจริง): กำแพงพายุแถบบน 13–25 ม. บานออกแรงขึ้นไปชนเมฆ',[(R*1.12,13),(R*1.22,19),(R*1.38,25)],96)
# เมฆบนฟ้าเป็นวงรูตรงกลาง (ตาพายุ) สูง 25 ม. รัศมีนอก 40 ใน 10
lathe('wind_real_ceiling','Eye of Heaven (สมจริง): เมฆพายุหมุนบนฟ้าเป็นวงมีรูกลาง (ตาพายุ)',[(42,0),(30,.5),(19,1.2),(12,2.6),(9.5,3.6)],96)
# ลมหมุนเล็ก (dust devil) ปากกว้างขึ้นด้านบน รัศมีโคน 0.35 สูง 1 (ย่อขยายด้วย scale)
lathe('wind_real_devil','Eye of Heaven (สมจริง): พายุหมุนเล็ก (กรวยบานขึ้น สูง 1)',[(.18,0),(.24,.18),(.4,.45),(.7,.72),(1.0,1.0)],40)
# วงฝุ่นกระแทกเตี้ย (แผ่นลาด รัศมี 1)
lathe('wind_real_roll','Eye of Heaven (สมจริง): วงฝุ่นกระแทกเตี้ย รัศมี 1 สูง 1',[(.86,0),(.94,.35),(1,1)],96)

# ------------------------------------------------------------ helpers
def ck(t0,t1,t):return str(round(min(1,max(0,(t-t0)/(t1-t0))),4))
def keys(t0,t1,pairs,ease=None):
    d={ck(t0,t1,t):v for t,v in pairs}
    if ease:d['ease']=ease
    return d
def tmesh(lid,at,life,model,tex,col,op,pos=(0,0,0),scale=None,tile=(1,1),scroll=(0,0),spin=0,col2='#000000',rim=0):
    return {'id':lid,'t':'mesh','at':round(at,3),'life':round(life,3),'att':'ground','shape':'model','model':model,'mat':'tex','tex':tex,'col':col,'col2':col2,'rim':rim,
        'uvTile':list(tile),'uvScroll':list(scroll),'pos':list(pos),'scale':scale or 1,'op':op,'spin':spin,'fade':0}
def gmesh(lid,at,life,model,col,op,pos=(0,0,0),scale=None,spin=0):
    return {'id':lid,'t':'mesh','at':round(at,3),'life':round(life,3),'att':'ground','shape':'model','model':model,'mat':'glow','col':col,'col2':col,'pos':list(pos),
        'scale':scale or 1,'op':op,'spin':spin,'fade':0}
SM=dict(look='smoke',curl=True)
def smoke(lid,at,life,pos,frm,col=DUST,c2=DUST2,**k):
    d={'id':lid,'t':'emit','at':round(at,3),'life':round(life,3),'att':'ground','pos':list(pos),'from':frm,'col':col,'c2':c2,'gravity':0,'drag':1}
    d.update(SM);d.update(k);return d
def streak(lid,at,life,pos,frm,col=WHITE,c2=MINT,**k):
    d={'id':lid,'t':'emit','at':round(at,3),'life':round(life,3),'att':'ground','pos':list(pos),'from':frm,'look':'streak','col':col,'c2':c2,'gravity':0,'drag':.2,'curl':True}
    d.update(k);return d

def build():
    L=[]
    rg=random.Random(11)
    TB0,TB1=T_SLAM+.02,T_IMP
    # ===================== เมฆบนฟ้า (ตาพายุ) : ก่อตัว 0.15 → 1.3, อยู่จนจบ =====================
    CY=24
    cl=T_END-.15
    L.append(tmesh('a_ceil',.15,cl-.15,'wind_real_ceiling','tex/wind_dust',CLOUD,
        keys(.15,cl,[(.15,0),(1.2,.78),(T_END-.9,.78),(cl,0)]),pos=(0,CY,0),
        scale=keys(.15,cl,[(.15,[.25,.2,.25]),(1.4,[1,1,1])],'out'),tile=(5,1.6),scroll=(.03,-.02),spin=11))
    L.append(tmesh('a_ceil2',.3,cl-.3,'wind_real_ceiling','tex/wind_streaks',CLOUDHI,
        keys(.3,cl,[(.3,0),(1.4,.3),(T_END-.9,.3),(cl,0)]),pos=(0,CY-.3,0),
        scale=keys(.3,cl,[(.3,[.3,.3,.3]),(1.5,[.98,1,.98])],'out'),tile=(6,2),scroll=(.12,-.05),spin=-17))
    L.append(tmesh('a_ceil3',.2,cl-.2,'wind_real_ceiling','tex/wind_dust','#6b7472',
        keys(.2,cl,[(.2,0),(1.3,.55),(T_END-.9,.55),(cl,0)]),pos=(0,CY-1.5,0),
        scale=keys(.2,cl,[(.2,[.25,.2,.25]),(1.4,[.82,1,.82])],'out'),tile=(4,1.3),scroll=(-.04,.03),spin=-7))
    L.append({'id':'a_light','t':'light','at':.8,'life':round(cl-.8,3),'att':'ground','pos':[0,9,0],'col':SUN,'int':keys(.8,cl,[(.8,0),(1.5,1.3),(T_IMP,1.3),(T_IMP+.1,2.2),(T_IMP+.6,1.2),(T_END-.8,1),(cl,0)]),'dist':26})
    # ===================== ช่วง 1 (0–1.0): ลมรวมตัว =====================
    # ลมหมุนรอบตัวผู้ร่ายหนัก ๆ (ทอร์นาโดเล็ก โปร่ง เพื่อไม่บังกล้อง)
    L.append(tmesh('b_devil',.05,1.2,'wind_real_devil','tex/wind_dust',DUST,keys(.05,1.25,[(.05,0),(.5,.34),(1.0,.4),(1.25,0)]),
        scale=keys(.05,1.25,[(.05,[1.2,1.5,1.2]),(.8,[3.2,6.5,3.2]),(1.25,[3.6,7.5,3.6])],'out'),tile=(2,1),scroll=(.35,-.7),spin=420))
    L.append(tmesh('b_devil2',.1,1.15,'wind_real_devil','tex/wind_streaks',WHITE,keys(.1,1.25,[(.1,0),(.5,.5),(1.0,.55),(1.25,0)]),
        scale=keys(.1,1.25,[(.1,[1.1,1.6,1.1]),(.8,[3.0,6.8,3.0]),(1.25,[3.4,7.8,3.4])],'out'),tile=(3,1),scroll=(.3,-1.2),spin=-520))
    L.append(smoke('b_dustin',.05,.98,(0,.2,0),'disc',fr=11,rate=keys(.05,1.03,[(.05,30),(1.0,90)]),dir='tangent',speed=[9,14],up=[.2,1.5],plife=[.5,.8],size=[3,5.5],grow=.5,col=DUST,c2=DUST2,drag=.3,fin=8))
    L.append(streak('b_lines',.05,.98,(0,.3,0),'disc',fr=10,rate=keys(.05,1.03,[(.05,60),(1.0,190)]),dir='tangent',speed=[10,16],up=[.4,3.5],plife=[.3,.55],size=[3,5.5]))
    L.append(streak('b_lift',.2,.8,(0,.1,0),'ring',fr=1.6,rate=80,dir='up',spread=.15,speed=[5,9],plife=[.3,.5],size=[1.6,2.8],drag=.3,curl=False))
    L.append({'id':'b_debris','t':'emit','at':.1,'life':.9,'att':'ground','pos':[0,.4,0],'from':'disc','fr':9,'rate':22,'dir':'tangent','speed':[7,11],'up':[1.5,4],'plife':[.7,1.1],
        'look':'model','model':'wind_leaf','mmat':'solid','msize':[.14,.24],'mspin':420,'bounce':0,'col':'#d6f28f','c2':'#8cbf4a','gravity':.3,'drag':.5,'curl':True,'x':True})
    L.append({'id':'b_haze','t':'warp','at':.2,'life':.9,'att':'ground','pos':[0,1.5,0],'kind':'haze','size':10,'str':.45,'op':keys(.2,1.1,[(.2,0),(.5,1),(.95,1),(1.1,0)]),'col':WHITE,'glow':0,'x':True})
    # ===================== ช่วง 2 (1.0–2.38): ปักไม้ — พายุหมุนกระโชกทั่วเขต =====================
    L.append({'id':'c_shock','t':'warp','at':T_SLAM,'life':.6,'att':'ground','pos':[0,.15,0],'kind':'shock','flat':True,'size':{'0':1,'1':R*2},'str':1.2,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    L.append({'id':'c_flash','t':'flash','at':T_SLAM,'life':.16,'att':'ground','pos':[0,.4,.5],'size':2.2,'col':'#fffbe8','k':1})
    L.append(smoke('c_kick',T_SLAM,.1,(0,.05,0),'ring',fr=1,burst=34,rate=0,dir='out',spread=.2,speed=[7,13],up=[.2,.9],plife=[.9,1.4],size=[4,7.5],grow=.8,drag=1.6,fin=8))
    L.append(streak('c_kickline',T_SLAM,.06,(0,.5,0),'ring',fr=1.2,burst=60,rate=0,dir='out',spread=.1,speed=[24,34],up=[0,1.2],plife=[.3,.45],size=[5,8],drag=.8,curl=False))
    L.append({'id':'c_shake','t':'screen','at':T_SLAM,'life':.3,'shake':3.5,'flash':0,'own':True})
    # ผืนฝุ่นพัดวน + เส้นลมยาว + ลมยกขึ้น + ใบไม้ + เศษหิน
    L.append(smoke('c_dust',TB0,TB1-TB0,(0,.1,0),'disc',fr=R-1.5,rate=keys(TB0,TB1,[(TB0,20),(TB0+.4,34),(TB1,28)]),dir='tangent',speed=[5,9],up=[.15,.8],plife=[1,1.5],size=[3.5,6.5],grow=.6,drag=.5,fin=10))
    L.append(streak('c_curl',TB0,TB1-TB0,(0,.6,0),'disc',fr=R-1.5,rate=keys(TB0,TB1,[(TB0,100),(TB0+.3,190),(TB1,200)]),dir='tangent',speed=[6,11],up=[.5,3],plife=[.35,.65],size=[3.5,7]))
    L.append(streak('c_lift',TB0,TB1-TB0,(0,.2,0),'disc',fr=R-1,rate=60,dir='up',spread=.2,speed=[4,8],plife=[.4,.7],size=[2.5,4.5],curl=False,x=True))
    L.append({'id':'c_leaf','t':'emit','at':TB0,'life':TB1-TB0,'att':'ground','pos':[0,.5,0],'from':'disc','fr':R-2,'rate':28,'dir':'tangent','speed':[4,8],'up':[1,3.5],'plife':[1,1.6],
        'look':'model','model':'wind_leaf','mmat':'solid','msize':[.14,.24],'mspin':380,'bounce':0,'col':'#d6f28f','c2':'#8cbf4a','gravity':.2,'drag':.5,'curl':True,'x':True})
    L.append({'id':'c_rock','t':'emit','at':TB0,'life':TB1-TB0,'att':'ground','pos':[0,.5,0],'from':'disc','fr':R-3,'rate':5,'dir':'tangent','speed':[3,6],'up':[1.5,4],'plife':[1,1.5],
        'look':'model','model':'rock_chunks','mmat':'solid','msize':[.14,.3],'mspin':300,'bounce':.3,'col':'#8c8576','c2':'#6c6659','gravity':4,'drag':.2,'curl':False,'x':True})
    L.append({'id':'c_haze','t':'warp','at':TB0,'life':TB1-TB0,'att':'ground','pos':[0,1.5,4],'kind':'haze','size':15,'str':.6,'op':keys(TB0,TB1,[(TB0,0),(TB0+.2,1),(TB1-.1,1),(TB1,0)]),'col':WHITE,'glow':0,'x':True})
    # พายุหมุนเล็ก 7 ลูก (dust devil) กระจายในเขต — โตตอนปักไม้ แล้วโดนลมกระแทกพัดจางไป
    for j in range(7):
        a=j/7*2*math.pi+rg.uniform(-.35,.35);rr=rg.uniform(5.5,14.5)
        x,z=round(rr*math.sin(a),2),round(rr*math.cos(a),2)
        at=round(TB0+.045*j,3);life=round(T_IMP+.45-at,3)
        w=rg.uniform(1.6,2.5);h=rg.uniform(7,11);dir_=1 if j%2 else -1
        L.append(tmesh(f'd_dev{j}',at,life,'wind_real_devil','tex/wind_dust',DUST,keys(at,at+life,[(at,0),(at+.2,.55),(T_IMP-.05,.6),(T_IMP+.22,.45),(T_IMP+.45,0)]),pos=(x,0,z),
            scale=keys(at,at+life,[(at,[w*.25,h*.2,w*.25]),(at+.4,[w,h,w]),(T_IMP+.1,[w*1.15,h*1.05,w*1.15]),(T_IMP+.45,[w*1.6,h*.7,w*1.6])],'out'),tile=(2,1),scroll=(.3*dir_,-.9),spin=380*dir_))
        L.append(tmesh(f'd_devs{j}',at,life,'wind_real_devil','tex/wind_streaks',WHITE,keys(at,at+life,[(at,0),(at+.2,.55),(T_IMP-.05,.6),(T_IMP+.22,.4),(T_IMP+.45,0)]),pos=(x,0,z),
            scale=keys(at,at+life,[(at,[w*.22,h*.2,w*.22]),(at+.4,[w*.92,h*1.03,w*.92]),(T_IMP+.1,[w*1.05,h*1.08,w*1.05]),(T_IMP+.45,[w*1.5,h*.7,w*1.5])],'out'),tile=(3,1),scroll=(.25*dir_,-1.4),spin=-520*dir_))
        if j<5:
            L.append(smoke(f'd_skirt{j}',at+.05,life-.15,(x,.1,z),'ring',fr=w*.7,rate=34,dir='tangent',speed=[3,6],up=[.2,1.5],plife=[.7,1.1],size=[3,5.5],grow=.5,drag=.5,fin=10,x=(j>2)))
    # ===================== กำแพงพายุ (eyewall) ขึ้นที่ 1.15 =====================
    wl=T_END-T_WALL
    def wallband(lid,model,tex,col,op,tile,scroll,spin,k0=0,rise=.7,top=1.0):
        # สูงขึ้นทีละน้อย: ล่างขึ้นก่อน (แถบบนขึ้นช้ากว่า) แล้วพุ่งตอนลมกระแทกมาถึง (T_IMP+.3)
        a=T_WALL+k0
        sc=keys(a,T_END,[(a,[1,.04,1]),(a+rise,[1,.55*top,1]),(T_IMP+.3,[1,.6*top,1]),(T_IMP+.55,[1.03,1.12*top,1.03]),(T_IMP+.9,[1,top,1]),(T_END-.3,[1,top,1]),(T_END,[1,.75*top,1])],'out')
        return tmesh(lid,a,T_END-a,model,tex,col,keys(a,T_END,[(a,0),(a+.25,op),(T_IMP+.3,op),(T_IMP+.55,min(1,op*1.25)),(T_IMP+.9,op),(T_END-.35,op),(T_END,0)]),scale=sc,tile=tile,scroll=scroll,spin=spin)
    L.append(wallband('w_a','wind_real_wall_a','tex/wind_dust','#8d826b',1.0,(7,1.6),(.04,-.1),9))
    L.append(wallband('w_a3','wind_real_wall_a','tex/wind_dust','#cfc4aa',.55,(4.5,1.1),(-.06,-.16),-13,k0=.05))
    L.append(wallband('w_a4','wind_real_wall_a','tex/wind_dust','#a39983',.8,(11,2.6),(.07,-.2),7,k0=.02))
    L.append(wallband('w_a2','wind_real_wall_a','tex/wind_streaks',WHITE,.5,(16,1.5),(.12,-.35),-6))
    L.append(wallband('w_b','wind_real_wall_b','tex/wind_dust','#737b78',.88,(6,1.8),(.03,-.09),11,k0=.15))
    L.append(wallband('w_b3','wind_real_wall_b','tex/wind_dust','#8e9693',.6,(9,3.2),(-.05,-.15),-10,k0=.2))
    L.append(wallband('w_b2','wind_real_wall_b','tex/wind_streaks',MINT,.34,(14,2),(.1,-.3),-8,k0=.15))
    L.append(wallband('w_c','wind_real_wall_c','tex/wind_dust','#6a7371',.62,(5,2.2),(.025,-.08),13,k0=.3,rise=.9))
    # กำแพงลมใส Aegis แบบเดิม (8 ชิ้น — ตรงกับกำแพงที่ชนได้จริง สูง 5.4) บางๆ ใต้เมฆ ให้เห็นแนวชัด
    sw=keys(T_WALL,T_END,[(T_WALL,[1,.08*5.4,1]),(T_WALL+.35,[1,5.4,1]),(T_IMP+.4,[1,5.4*1.08,1]),(T_IMP+.55,[1,5.4,1]),(T_END-.3,[1,5.4,1]),(T_END,[1,.85*5.4,1])])
    L.append(tmesh('w_clear',T_WALL,wl,'wind_eye_ringwall','tex/wind_air_rise',WHITE,keys(T_WALL,T_END,[(T_WALL,0),(T_WALL+.12,.45),(T_END-.3,.45),(T_END,0)]),scale=sw,tile=(14,1),scroll=(.03,0)))
    L.append(smoke('w_base',T_WALL,wl-.3,(0,.05,0),'ring',fr=R,rate=keys(T_WALL,T_END-.3,[(T_WALL,0),(T_WALL+.05,170),(T_IMP,130),(T_IMP+.6,90),(T_END-.3,70)]),dir='tangent',speed=[3,6],up=[1,4],plife=[1.2,2],size=[8,14],col='#a39a84',c2='#7e7663',grow=.6,drag=.7,fin=10))
    L.append(smoke('w_burst',T_WALL,.15,(0,.05,0),'ring',fr=R,burst=70,rate=0,dir='up',speed=[2,5],up=[.3,1],plife=[1,1.6],size=[6,10],grow=.8,drag=1.4,fin=10))
    L.append(streak('w_up',T_WALL,.15,(0,.05,0),'ring',fr=R,burst=80,rate=0,dir='up',speed=[8,14],plife=[.35,.6],size=[2,4],drag=1.4,curl=False))
    L.append(streak('w_flow',T_WALL+.3,wl-.6,(0,.3,0),'ring',fr=R,rate=65,dir='tangent',speed=[10,16],up=[.5,3],plife=[.4,.7],size=[4,8]))
    # ===================== ช่วง 3 (2.38): ลมกระแทกกวาดทั้งเขต =====================
    L.append({'id':'e_shock','t':'warp','at':T_IMP,'life':.55,'att':'ground','pos':[0,.2,0],'kind':'shock','flat':True,'size':{'0':2,'1':R*2.1},'str':1.8,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    L.append({'id':'e_shock2','t':'warp','at':T_IMP,'life':.32,'att':'ground','pos':[0,1.3,0],'kind':'shock','size':{'0':1,'1':10},'str':1.3,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    L.append({'id':'e_flash','t':'flash','at':T_IMP,'life':.14,'att':'ground','pos':[0,1.3,0],'size':3,'col':'#fffbe8','k':1.1})
    rl=.55
    L.append(tmesh('e_roll',T_IMP,rl,'wind_real_roll','tex/wind_dust',DUST,{'0':.7,'0.15':.85,'0.7':.6,'1':0},tile=(16,1),scroll=(.7,-.2),
        scale={'0':[2,1.5,2],'0.5':[R*.72,4.2,R*.72],'1':[R*1.02,3.2,R*1.02],'ease':'out'}))
    L.append(tmesh('e_roll2',T_IMP+.03,rl,'wind_real_roll','tex/wind_streaks',WHITE,{'0':.3,'0.15':.7,'0.7':.5,'1':0},tile=(20,1),scroll=(.9,0),
        scale={'0':[1.8,.8,1.8],'0.5':[R*.68,2.6,R*.68],'1':[R*.98,1.8,R*.98],'ease':'out'}))
    L.append({'id':'e_ring','t':'ring','at':T_IMP,'life':.45,'att':'ground','pos':[0,.1,0],'col':WHITE,'r':R,'op':.4})
    L.append(streak('e_rays',T_IMP,.06,(0,.9,0),'ring',fr=1.2,burst=80,rate=0,dir='out',spread=.12,speed=[32,46],up=[0,1.6],plife=[.4,.55],size=[5,9],drag=.8,curl=False))
    L.append(smoke('e_dust',T_IMP,.1,(0,.05,0),'ring',fr=2,burst=80,rate=0,dir='out',spread=.25,speed=[18,28],up=[.2,1.1],plife=[.9,1.4],size=[5,9],grow=1,drag=2.2,fin=8))
    L.append({'id':'e_debris','t':'emit','at':T_IMP,'life':.08,'att':'ground','pos':[0,.5,0],'from':'ring','fr':1.5,'burst':36,'rate':0,'dir':'out','spread':.3,'speed':[16,28],'up':[1,4],'plife':[.9,1.4],
        'look':'model','model':'wind_leaf','mmat':'solid','msize':[.16,.26],'mspin':500,'bounce':0,'col':'#d6f28f','c2':'#8cbf4a','gravity':1.2,'drag':.6,'curl':True,'x':True})
    L.append({'id':'e_rock','t':'emit','at':T_IMP,'life':.08,'att':'ground','pos':[0,.5,0],'from':'ring','fr':1.5,'burst':14,'rate':0,'dir':'out','spread':.3,'speed':[14,24],'up':[2,5],'plife':[1,1.6],
        'look':'model','model':'rock_chunks','mmat':'solid','msize':[.15,.32],'mspin':350,'bounce':.35,'col':'#8c8576','c2':'#6c6659','gravity':8,'drag':.1,'curl':False,'x':True})
    L.append({'id':'e_hit','t':'emit','at':T_IMP+.33,'life':.14,'att':'ground','pos':[0,0,0],'from':'ring','fr':R,'burst':80,'rate':0,'dir':'up','speed':[9,16],'plife':[.35,.6],
        'look':'streak','size':[2,4],'col':WHITE,'c2':MINT,'gravity':0,'drag':1.4,'curl':False})
    L.append(smoke('e_hitdust',T_IMP+.33,.14,(0,.05,0),'ring',fr=R,burst=70,rate=0,dir='up',speed=[3,7],up=[.2,.9],plife=[1,1.6],size=[7,12],grow=.9,drag=1.4,fin=10))
    L.append({'id':'e_shake','t':'screen','at':T_IMP,'life':.4,'shake':9,'flash':.03,'fcol':'#f4fff4','own':True})
    L.append({'id':'e_radial','t':'screen','at':T_IMP,'life':.35,'radial':.5,'own':True})
    # ===================== ช่วง 4: ค้าง — ตาพายุสงบ กำแพงหมุนคำราม =====================
    LA=T_IMP+.6;LB=T_END-.35
    L.append(streak('f_rise',LA,LB-LA,(0,0,0),'ring',fr=R,rate=60,dir='up',speed=[3,6],plife=[.5,1],size=[1.4,2.6],drag=.4,curl=False))
    L.append(smoke('f_wisp',LA,LB-LA,(0,.2,0),'ring',fr=R,rate=11,dir='up',speed=[1,2.4],plife=[1.2,2],size=[5,9],grow=.6,col=CLOUDHI,c2=CLOUD,gravity=-.2,drag=.5,fin=14,x=True))
    L.append(streak('f_calm',LA,LB-LA,(0,.5,0),'disc',fr=R-3,rate=26,dir='tangent',speed=[2,4],up=[.1,.6],plife=[.6,1.1],size=[1.2,2.4]))
    L.append({'id':'f_leaf','t':'emit','at':LA,'life':LB-LA,'att':'ground','pos':[0,.6,0],'from':'disc','fr':R-3,'rate':4,'dir':'tangent','speed':[1.5,3],'up':[.4,1.4],'plife':[1.4,2.4],
        'look':'model','model':'wind_leaf','mmat':'solid','msize':[.13,.22],'mspin':220,'bounce':0,'col':'#d6f28f','c2':'#8cbf4a','gravity':.1,'drag':.8,'curl':True,'x':True})
    L.append(smoke('g_puff',T_END-.35,.15,(0,0,0),'ring',fr=R,burst=60,rate=0,dir='up',speed=[1,2.2],plife=[.9,1.5],size=[6,10],grow=.8,col=CLOUDHI,c2=CLOUD,gravity=-.3,drag=.8,fin=10))
    L.append(streak('g_lift',T_END-.35,.15,(0,0,0),'ring',fr=R,burst=80,rate=0,dir='up',speed=[2,4.5],plife=[.5,.9],size=[1.5,2.6],drag=1.2))
    return {'v':1,'desc':'Eye of Heaven (อัลติสายลม) แบบ "ลมสมจริง อลังการ" (ผู้ใช้ขอ 2026-11-06): ผู้ร่ายยืนในตาพายุ — เมฆพายุหมุนเปิดช่องบนฟ้ามีลำแสงลง • ลมหมุนรอบตัว → ปักไม้ 1.0 วิ ฝุ่นพัดวน พายุหมุนเล็ก 7 ลูก ใบไม้/เศษหินปลิว • กำแพงพายุ (eyewall) ขึ้น 1.15 วิ สูง 25 ม. บานออกชนเมฆ • 2.38 วิ ลมกระแทกกวาดฝุ่นทั้งเขตไปชนกำแพง • กำแพงอยู่ถึง 7.4 วิ แล้วจาง (จังหวะตรงกับเกมจริง) รัศมี 17.5 ม. ผู้ร่ายอยู่ตรงกลาง',
        'tags':['wind','ult','realistic'],'pal':'wind','dur':DUR,'seed':31,'layers':L}
save(ROOT/'assets/fx/wind/eye_real.fx.json',build())
print('wind/eye_real + meshes wind_real_*')
