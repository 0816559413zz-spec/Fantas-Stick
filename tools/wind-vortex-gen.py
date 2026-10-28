# Vortex Bind (สายลม, เดิมชื่อ Vacuum) — ทอร์นาโด 3 อันเรียงโค้ง 45° ข้างหน้า ~10 ม. → รอ 0.6 วิ → ดึงกลับมาหยุดห่างเรา ~3 ม. แล้วสลาย
# ใช้: python tools/wind-vortex-gen.py แล้ว node tools/fx-check.js • ดู studio.html?fx=wind/vortex_bind
# ผู้ใช้ 2026-10-28: ใช้ทอร์นาโดแบบ wind/style_tornado_c (เกลียวเส้นยาวพันขึ้น) แต่สะท้อนแสงน้อยลง เอฟเฟกต์รอบ ๆ มากขึ้น ใหญ่ขึ้นนิด
#   + สีเขียวขาวแบบสกิลลมอื่น (Windrift) + แกนขาวเรืองใหญ่ขึ้นพร้อมทอร์นาโด (ไม่ขึ้นก่อน)
import json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DUR=1.4;LIFE=1.2;T_PULL=0.6;T_ARR=0.95;FAR=10.0;NEAR=3.0;S=1.15
W,LG,G,DG,LN='#ffffff','#efffe8','#8dff65','#2ec772','#1a7a45'
k=lambda t:str(round(t/LIFE,3))
def path(a,y=0.0):
    sx,cz=math.sin(a),math.cos(a)
    P=lambda d:[round(sx*d,2),y,round(cz*d,2)]
    return {'0':P(FAR),k(T_PULL):P(FAR),k(T_PULL+.12):P(FAR-1.2),k(T_ARR):P(NEAR),'1':P(NEAR)}
def grow(s,end=.15):   # โผล่จากพื้น → ค้าง → ตอนดึงหดเล็กลง (ถูกดูดเข้าหาเรา ไม่บังจอในเกม — ผู้ใช้ 2026-10-28) → ยุบลงพื้น
    return {'0':round(.15*s,3),k(.2):round(s,3),k(T_PULL):round(s,3),k(T_ARR):round(.62*s,3),k(T_ARR+.1):round(.5*s,3),'1':round(end*s,3)}
OP=lambda o:{'0':0,k(.06):o,k(T_ARR+.1):o,'1':0}
L=[]
for n,a in enumerate([math.radians(-22.5),0.0,math.radians(22.5)]):
    p=f't{n}_';P=path(a);at=round(n*.04,2)
    # ตัวทอร์นาโด: เกลียวเส้นยาวพันขึ้น 3 ชั้น (ขาวใน / เขียว / เส้นเข้มนอก) — ลด rim/glow ลง (ผู้ใช้: สะท้อนแสงน้อยลง)
    L.append({'id':p+'helix','t':'mesh','at':at,'life':LIFE,'att':'feet','shape':'model','model':'wind_helix','mat':'glow','col':LG,'int':.5,'pos':P,'spin':600,'scale':grow(S),'op':OP(.95),'fade':0})
    L.append({'id':p+'helix2','t':'mesh','at':at,'life':LIFE,'att':'feet','shape':'model','model':'wind_helix','mat':'energy','col':G,'col2':DG,'rot':[0,45,0],'pos':P,'spin':420,'scale':grow(S*1.12),'rim':.3,'op':OP(.85),'fade':0})
    L.append({'id':p+'helix3','t':'mesh','at':at,'life':LIFE,'att':'feet','shape':'model','model':'wind_helix','mat':'solid','col':DG,'col2':LN,'rot':[0,100,0],'pos':P,'spin':-380,'scale':grow(S*1.22),'rim':0,'op':OP(.7),'fade':0})
    # แกนขาวเรือง ใหญ่ขึ้น ขึ้นพร้อมทอร์นาโด
    L.append({'id':p+'core','t':'mesh','at':at,'life':LIFE,'att':'feet','shape':'model','model':'wind_core','mat':'tex','tex':'tex/wind_streaks','col':W,'col2':'#000000','rim':0,'uvTile':[2,3],'uvScroll':[-2.5,-.8],'pos':P,'spin':700,
              'scale':{kk:[round(v*.75,3),round(v*.8,3),round(v*.75,3)] for kk,v in grow(S).items()},'int':1.0,'op':OP(.9),'fade':0})
    # เอฟเฟกต์รอบ ๆ: แถบสโตรกพู่กันวนรอบกลางลำ 2 ชั้น
    for j,(y,tex,col,sp,sc) in enumerate([(1.0,'tex/wind_swoosh_a_hi',W,560,1.25),(2.2,'tex/wind_swoosh_b',G,-480,1.55)]):
        L.append({'id':p+f'band{j}','t':'mesh','at':at+.05,'life':LIFE-.05,'att':'feet','shape':'model','model':f'wind_pieces{j}','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
                  'pos':path(a,y),'rot':[0,j*90,0],'spin':sp,'scale':{kk:[v,round(v*.45,3),v] for kk,v in grow(sc*S*.75).items()},'op':OP(.9),'fade':0,**({'int':1.2} if j==0 else {})})
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
# ท่าร่าย: แสงที่ไม้ตอนชี้ + ตอนพับแขนดึง
L.append({'id':'cast','t':'flash','at':0,'life':.15,'att':'feet','pos':[0,1.2,.6],'col':LG,'size0':.2,'size':1.2,'k':1})
L.append({'id':'pull','t':'flash','at':T_PULL,'life':.15,'att':'feet','pos':[0,1.2,.5],'col':G,'size0':.2,'size':1.5,'k':1})
L.append({'id':'shake','t':'screen','at':T_PULL,'life':.12,'shake':1.5})
fx={'v':1,'desc':'Vortex Bind: ทอร์นาโด 3 อันเรียงโค้ง 45° ข้างหน้า 10 ม. → 0.6 วิ ดึงกลับมาหยุด 3 ม. แล้วสลาย (แบบ style_tornado_c, เขียวขาว, แสงสะท้อนน้อยลง, เอฟเฟกต์รอบมากขึ้น)','tags':['wind','vortex','vacuum'],'pal':'wind','dur':DUR,'seed':21,'layers':L}
(ROOT/'assets/fx/wind/vortex_bind.fx.json').write_text(json.dumps(fx,ensure_ascii=False,indent=1),encoding='utf-8')
print('wind/vortex_bind',len(L),'layers')
