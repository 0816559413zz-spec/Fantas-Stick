# Vortex Bind (สายลม, เดิมชื่อ Vacuum) — ทอร์นาโด 3 อันเรียงโค้ง 45° ข้างหน้า ~10 ม. → รอ 0.6 วิ → ดึงกลับมาหยุดห่างเรา ~3 ม. แล้วสลาย
# ใช้: python tools/wind-vortex-gen.py แล้ว node tools/fx-check.js • ดู studio.html?fx=wind/vortex_bind
# ผู้ใช้ 2026-10-28: ใช้ทอร์นาโดแบบ wind/style_tornado_c (เกลียวเส้นยาวพันขึ้น) แต่สะท้อนแสงน้อยลง เอฟเฟกต์รอบ ๆ มากขึ้น ใหญ่ขึ้นนิด
#   + สีเขียวขาวแบบสกิลลมอื่น (Windrift) + แกนขาวเรืองใหญ่ขึ้นพร้อมทอร์นาโด (ไม่ขึ้นก่อน)
import json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
_src=(ROOT/'tools/wind-kit-gen.py').read_text(encoding='utf-8');_g={'__name__':'kit'};exec(_src[:_src.index('def stroke_fx')].replace("W('mesh/","(lambda *a:None)('mesh/"),_g);tornado=_g['tornado']   # ทอร์นาโดเส้นพู่กันที่ผู้ใช้อนุมัติ
DUR=1.7;LIFE=1.35;T_PULL=0.8;T_ARR=1.05;FAR=15.0;NEAR=3.0;S=1.5   # ผู้ใช้ 2026-10-28 รอบ 2: ใหญ่ขึ้น ดึงไกลขึ้น (300) มีจังหวะก่อนดึงนานขึ้นนิด (0.8 วิ) เอฟเฟกต์มากขึ้น
W,LG,G,DG,LN='#ffffff','#efffe8','#8dff65','#2ec772','#0f4a2c'
GP=dict(inner='#efffe8',mid='#8dff65',outer='#2ec772',hi='#ffffff',line='#0f4a2c',ring='#8dff65',ring2='#ffffff',spark='#d2ffb8')   # ลายเส้นเข้มขึ้น (ตัดกับพื้นสว่าง)
k=lambda t:str(round(t/LIFE,3))
def path(a,y=0.0):
    sx,cz=math.sin(a),math.cos(a)
    P=lambda d:[round(sx*d,2),y,round(cz*d,2)]
    return {'0':P(FAR),k(T_PULL):P(FAR),k(T_PULL+.12):P(FAR-1.2),k(T_ARR):P(NEAR),'1':P(NEAR)}
def grow(s,end=.15):   # โผล่จากพื้น → ค้าง → ตอนดึงหดเล็กลง (ถูกดูดเข้าหาเรา ไม่บังจอในเกม — ผู้ใช้ 2026-10-28) → ยุบลงพื้น
    return {'0':round(.15*s,3),k(.2):round(s,3),k(T_PULL-.12):round(s,3),k(T_PULL):round(1.1*s,3),k(T_ARR):round(.8*s,3),k(T_ARR+.1):round(.6*s,3),'1':round(end*s,3)}   # ง้างพองก่อนดึง แล้วหดลงตอนมาถึง
OP=lambda o:{'0':0,k(.06):o,k(T_ARR+.1):o,'1':0}
L=[]
for n,a in enumerate([math.radians(-22.5),0.0,math.radians(22.5)]):
    p=f't{n}_';P=path(a);at=round(n*.04,2)
    # ผู้ใช้ รอบ 5 "ไม่เอาหมึก ทำทอร์นาโดทึบมี layer" (รูป designs/wind_ref/normal_tornado.png เวอร์ชันเขียว):
    # ริบบิ้นหนาทึบแบบการ์ตูน (toon cel-shade 2 เฉด) วางซ้อนเป็นกรวยบานขึ้น หมุนสลับทิศ ขอบแหว่งนิด ๆ + แกนขาวสว่างกลางลำ + เส้นลมบาง ๆ รอบนอก
    RIB=[(0.15,.42,'#b6ffb0','#2ec772',660),(0.6,.5,'#8dff65','#1f9a55',-600),(1.05,.58,'#5fe0a0','#178a5a',560),(1.5,.68,'#8dff65','#1f9a55',-520),
         (1.95,.8,'#b6ffb0','#2ec772',500),(2.4,.94,'#5fe0a0','#178a5a',-470),(2.85,1.1,'#8dff65','#1f9a55',450),(3.3,1.28,'#b6ffb0','#2ec772',-430),(3.75,1.46,'#5fe0a0','#178a5a',410)]
    for j,(y,r,c1,c2,sp) in enumerate(RIB):
        for q in range(2):   # 2 ริบบิ้นต่อชั้น (หมุนเหลื่อมกัน 180°) = ดูหนา ทึบรอบลำ
            L.append({'id':p+f'rb{j}_{q}','t':'mesh','at':at+j*.02,'life':LIFE-j*.02,'att':'feet','shape':'model','model':f'wind_pieces{(j+q)%3}','mat':'toon','col':c1,'col2':c2,'rim':.7,
                      'dis':.04,'pos':path(a,round(y*S/1.5,2)),'rot':[(11 if (j+q)%2 else -9),j*41+q*180,(7 if q else -6)],'spin':sp,'scale':{kk:[round(v*r*(1.06 if q else 1),3),round(v*.58,3),round(v*r*(1.06 if q else 1),3)] for kk,v in grow(S*.95).items()},'op':OP(1),'fade':0})
    # แกนขาวสว่างกลางลำ (เรืองแรง) + ไส้เขียวอ่อน
    L.append({'id':p+'corew','t':'mesh','at':at,'life':LIFE,'att':'feet','shape':'model','model':'wind_core','mat':'glow','col':W,'pos':P,'spin':700,
              'scale':{kk:[round(v*.55,3),round(v*.85,3),round(v*.55,3)] for kk,v in grow(S).items()},'int':2.2,'op':OP(1),'fade':0})
    L.append({'id':p+'coreg','t':'mesh','at':at,'life':LIFE,'att':'feet','shape':'model','model':'wind_core','mat':'tex','tex':'tex/wind_streaks','col':'#d2ffb8','col2':'#000000','rim':0,'uvTile':[2,3],'uvScroll':[-2.5,-.8],'pos':P,'spin':-500,
              'scale':{kk:[round(v*.8,3),round(v*.82,3),round(v*.8,3)] for kk,v in grow(S).items()},'int':1.2,'op':OP(.9),'fade':0})
    # เส้นลมบาง ๆ วนรอบนอก (สีขาว ไม่ใช่หมึก)
    for j,(y,sc,sp) in enumerate([(1.2,1.9,520),(2.6,2.4,-460),(3.8,2.8,420)]):
        L.append({'id':p+f'wisp{j}','t':'mesh','at':at+.05,'life':LIFE-.05,'att':'feet','shape':'model','model':f'wind_pieces{j}','mat':'tex','tex':'tex/wind_swoosh_a_hi','col':W,'col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
                  'pos':path(a,round(y*S/1.5,2)),'rot':[0,j*70,0],'spin':sp,'scale':{kk:[round(v*sc*.5,3),round(v*.12,3),round(v*sc*.5,3)] for kk,v in grow(S).items()},'op':OP(.6),'int':1.2,'fade':0})
    L.append({'id':p+'needles','t':'emit','at':at,'life':T_ARR+.05,'att':'feet','pos':P,'rate':45,'from':'cone','fr':1.6,'fh':4.4,'dir':'tangent','speed':[5,9],'up':[1,3],'plife':[.3,.55],'look':'model','model':'wind_needle','mmat':'solid','msize':[.25,.5],'col':W,'c2':'#d2ffb8','gravity':-.5,'mspin':0,'bounce':0})
    L.append({'id':p+'baseglow','t':'mesh','at':at,'life':LIFE,'att':'feet','shape':'ring','inner':.55,'mat':'tex','tex':'tex/wind_streaks','col':G,'col2':'#000000','rim':0,'uvTile':[3,1],'uvScroll':[-1.6,0],'pos':path(a,.06),'scale':grow(2.2*S),'int':1.4,'op':OP(.9),'fade':0})
    # พื้น: สโตรกวนพื้น + คลื่นวง
    for j,(tex,col,sp,sc) in enumerate([('tex/wind_swoosh_b',G,300,1.5),('tex/wind_swoosh_a_hi',W,-240,1.1)]):
        L.append({'id':p+f'gs{j}','t':'mesh','at':at,'life':LIFE,'att':'feet','shape':'model','model':'wind_groundswirl','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
                  'pos':path(a,.04+j*.02),'rot':[0,j*60,0],'spin':sp,'scale':grow(sc*S),'op':OP(.9),'fade':0})
    # อนุภาครอบตัว: ละอองหมุนตามเกลียว + เส้นลมสั้น + ใบไม้ + ประกาย
    L.append({'id':p+'motes','t':'emit','at':at,'life':T_ARR+.05,'att':'feet','pos':P,'rate':50,'from':'cone','fr':1.4,'fh':3.4,'dir':'tangent','speed':[3,6],'up':[.5,2],'plife':[.5,.9],'look':'spark','size':[1,1.8],'col':'#d2ffb8','c2':G,'gravity':-.3})
    L.append({'id':p+'swirl','t':'emit','at':at,'life':T_ARR+.05,'att':'feet','pos':path(a,1.2),'rate':40,'from':'ring','fr':1.5,'dir':'tangent','speed':[5,8],'up':[.5,1.5],'plife':[.2,.4],'look':'streak','size':[1.2,2.2],'col':W,'c2':G,'gravity':0,'drag':1})
    L.append({'id':p+'leaves','t':'emit','at':at,'life':T_ARR+.05,'att':'feet','pos':P,'rate':10,'from':'ring','fr':1.3,'dir':'tangent','speed':[3,5],'up':[2,4],'plife':[.6,1],'look':'model','model':'wind_leaf','mmat':'solid','msize':[.1,.18],'col':'#6fae5a','c2':'#3f7a3a','gravity':-.2,'mspin':400,'bounce':0})
    # ตอนดึง: เส้นลมลากพื้นชี้กลับหาเรา
    L.append({'id':p+'drag','t':'emit','at':T_PULL+at,'life':T_ARR-T_PULL,'att':'feet','pos':{'0':[round(math.sin(a)*FAR,2),.15,round(math.cos(a)*FAR,2)],'1':[round(math.sin(a)*NEAR,2),.15,round(math.cos(a)*NEAR,2)]},
              'rate':120,'from':'disc','fr':.8,'dir':'aim','yaw':round((math.degrees(a)+360)%360-180,1),'spread':.25,'speed':[8,14],'plife':[.15,.3],'look':'streak','size':[1.2,2.4],'col':W,'c2':G,'gravity':0,'drag':1,'curl':False})
    # มาถึงแล้วสลาย: แฟลช + เส้นลมแตกออก
    E=[round(math.sin(a)*NEAR,2),1.2,round(math.cos(a)*NEAR,2)]
    L.append({'id':p+'pop','t':'flash','at':T_ARR+at+.08,'life':.12,'att':'feet','pos':E,'col':LG,'size0':.3,'size':2.2,'k':.8})
    L.append({'id':p+'popstk','t':'emit','at':T_ARR+at+.08,'life':.05,'att':'feet','pos':E,'burst':30,'rate':0,'from':'sphere','fr':.6,'dir':'out','speed':[5,9],'plife':[.15,.3],'look':'streak','size':[1.2,2.2],'col':W,'c2':G,'gravity':0,'drag':2,'curl':False})
# เพิ่มเอฟเฟกต์ (ผู้ใช้ รอบ 2): ระหว่างรอ = ลมดูดพื้นเข้าแกน + วงรอบโคน • ก่อนดึง = ทอร์นาโดพองเรือง • ตอนดึง = สายลมยาวโยงจากไม้ไปหาทอร์นาโด + รอยลากพื้นยาว + เศษหิน/ใบไม้ถูกดูดตาม
for n,a in enumerate([math.radians(-22.5),0.0,math.radians(22.5)]):
    p=f'x{n}_';P=path(a);at=round(n*.04,2);sx,cz=math.sin(a),math.cos(a)
    L.append({'id':p+'suck','t':'emit','at':at+.15,'life':T_PULL-.1,'att':'feet','pos':P,'rate':70,'from':'ring','fr':2.6,'dir':'in','speed':[4,7],'up':[0,1.5],'plife':[.3,.5],'look':'streak','size':[1,2],'col':W,'c2':G,'gravity':0,'drag':.5,'curl':False})
    L.append({'id':p+'chips','t':'emit','at':at+.1,'life':T_ARR-.1,'att':'feet','pos':P,'rate':25,'from':'ring','fr':1.8,'dir':'tangent','speed':[3,6],'up':[2,5],'plife':[.5,.9],'look':'model','model':'wind_slash','mmat':'solid','msize':[.07,.16],'col':'#5b4a3a','c2':'#8a7560','gravity':3,'mspin':600,'bounce':0})
    L.append({'id':p+'charge','t':'flash','at':T_PULL-.12+at,'life':.16,'att':'feet','pos':{kk:[v[0],1.6,v[2]] for kk,v in P.items()},'col':G,'size0':.6,'size':3.2,'k':.7})
    L.append({'id':p+'tether','t':'emit','at':T_PULL+at,'life':T_ARR-T_PULL,'att':'feet','pos':{'0':[round(sx*FAR*.5,2),1.2,round(cz*FAR*.5,2)],'1':[round(sx*NEAR*.5,2),1.2,round(cz*NEAR*.5,2)]},'rate':160,'from':'line','fr':FAR*.5,'dir':'aim','yaw':round((math.degrees(a)+360)%360-180,1),'spread':.05,'speed':[14,20],'plife':[.1,.2],'look':'streak','size':[1.4,2.6],'col':W,'c2':G,'gravity':0,'drag':.5,'curl':False})
    for j,(tex,col) in enumerate([('tex/wind_swoosh_b',G),('tex/wind_swoosh_a_hi',W)]):
        L.append({'id':p+f'trail{j}','t':'mesh','at':T_PULL+at,'life':T_ARR-T_PULL+.25,'att':'feet','shape':'model','model':'wind_groundswirl','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
                  'pos':{kk:[v[0],.05+j*.02,v[2]] for kk,v in path(a).items()},'rot':[0,j*70,0],'spin':500*(1-2*j),'scale':{'0':1.6,'0.5':2.6,'1':1.2},'op':{'0':0,'0.1':.95,'0.7':.8,'1':0},'fade':0,**({'int':1.2} if j else {})})
# ท่าร่าย: แสงที่ไม้ตอนชี้ + ตอนพับแขนดึง
L.append({'id':'cast','t':'flash','at':0,'life':.15,'att':'feet','pos':[0,1.2,.6],'col':LG,'size0':.2,'size':1.2,'k':1})
L.append({'id':'pull','t':'flash','at':T_PULL,'life':.15,'att':'feet','pos':[0,1.2,.5],'col':G,'size0':.2,'size':1.5,'k':1})
L.append({'id':'shake','t':'screen','at':T_PULL,'life':.12,'shake':1.5})
fx={'v':1,'desc':'Vortex Bind: ทอร์นาโด 3 อันเรียงโค้ง 45° ข้างหน้า 10 ม. → 0.6 วิ ดึงกลับมาหยุด 3 ม. แล้วสลาย (แบบ style_tornado_c, เขียวขาว, แสงสะท้อนน้อยลง, เอฟเฟกต์รอบมากขึ้น)','tags':['wind','vortex','vacuum'],'pal':'wind','dur':DUR,'seed':21,'layers':L}
(ROOT/'assets/fx/wind/vortex_bind.fx.json').write_text(json.dumps(fx,ensure_ascii=False,indent=1),encoding='utf-8')
print('wind/vortex_bind',len(L),'layers')
