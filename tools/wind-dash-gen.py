# Dash สายลม (ถอยหลังผลัก) — ร่าง VFX (⚠ Claude ออกแบบ รอผู้ใช้ดู): ระเบิดลมผลักไปข้างหน้า + ตัวเราดีดถอยหลังลอยกลางอากาศ
# ใช้: python tools/wind-dash-gen.py • ดู studio.html?fx=wind/dash_push • วางที่จุดร่าย หันตามทิศผู้ร่าย (+z = ข้างหน้า, ตัวเราถอยไป -z ~15 ม.)
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
W,LG,G,DG,LN='#ffffff','#efffe8','#8dff65','#2ec772','#1a7a45'
T=lambda n:'tex/'+n
def stroke(id_,at,life,model,tex,col,pos,scale,rot,spin=0,o=1,i=None):
    d={'id':id_,'t':'mesh','at':at,'life':life,'att':'feet','shape':'model','model':model,'mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
       'pos':pos,'rot':rot,'scale':scale,'spin':spin,'op':{'0':0,'0.1':o,'0.6':round(o*.8,2),'1':0},'fade':0}
    if i:d['int']=i
    return d
L=[]
# ข้างหน้า: คลื่นลมเป็นวงสโตรกพุ่งออก 3 ชั้น (หันหน้าไป +z) ขยาย + เคลื่อนไปข้างหน้า ~6 ม.
for j,(tex,col,sp,sc,o,i) in enumerate([('wind_swoosh_a_hi',W,620,1.0,1,1.5),('wind_swoosh_b',G,-540,1.2,.9,1.1),('wind_swoosh_b_ln',LN,-540,1.28,.7,None)]):
    L.append(stroke(f'wave{j}',j*.02,.42,f'wind_pieces{j}',tex,col,{'0':[0,1.1,.8],'1':[0,1.1,6.5]},{'0':[.4*sc,.5,.4*sc],'0.35':[1.5*sc,.6,1.5*sc],'1':[2.6*sc,.3,2.6*sc],'ease':'out'},[-90,0,j*100],sp,o,i))
L.append(stroke('wave3',.06,.4,'wind_pieces1','wind_swoosh_a_hi',LG,{'0':[0,1.1,.8],'1':[0,1.1,5]},{'0':[.3,.4,.3],'1':[1.8,.3,1.8],'ease':'out'},[-90,0,200],-700,.9,1.3))
L.append({'id':'blast','t':'emit','at':0,'life':.06,'att':'feet','pos':[0,1.1,.9],'burst':60,'rate':0,'from':'disc','fr':.6,'dir':'aim','yaw':0,'spread':.45,'speed':[10,18],'plife':[.18,.35],'look':'streak','size':[1.4,2.8],'col':W,'c2':G,'gravity':0,'drag':2,'curl':False})
L.append({'id':'leaves','t':'emit','at':0,'life':.06,'att':'feet','pos':[0,1,1],'burst':14,'rate':0,'from':'sphere','fr':.6,'dir':'aim','yaw':0,'spread':.6,'speed':[6,11],'plife':[.5,.9],'look':'model','model':'wind_leaf','mmat':'solid','msize':[.1,.18],'col':'#6fae5a','c2':'#3f7a3a','gravity':.6,'drag':1.5,'mspin':500,'bounce':0})
L.append({'id':'flash','t':'flash','at':0,'life':.1,'att':'feet','pos':[0,1.2,.7],'col':LG,'size0':.3,'size':1.8,'k':1})
L.append({'id':'shock','t':'warp','at':0,'life':.22,'att':'feet','pos':[0,1.1,1.2],'kind':'shock','size':{'0':.3,'1':2.6},'str':1,'op':{'0':1,'1':0},'col':LG,'glow':.04})
# ตัวเราดีดถอยหลัง: สโตรกลู่ตามทางถอย + เส้นลมยาว + วงลมกระแทกพื้นตอนออกตัว
for j,(tex,col) in enumerate([('wind_swoosh_a_hi',W),('wind_swoosh_b',G)]):
    L.append(stroke(f'trail{j}',.02+j*.03,.5,f'wind_pieces{j+1}',tex,col,{'0':[0,1.3,0],'1':[0,1.8,-12]},{'0':[.5,1.4,.5],'1':[.9,2.2,.9]},[90,0,j*120],500*(1-2*j),.85,1.2 if j==0 else None))
L.append({'id':'streaks','t':'emit','at':0,'life':.45,'att':'feet','pos':{'0':[0,1.3,0],'1':[0,1.8,-12]},'rate':120,'from':'sphere','fr':.5,'dir':'aim','yaw':0,'spread':.2,'speed':[3,6],'plife':[.2,.4],'look':'streak','size':[1.2,2.4],'col':W,'c2':G,'gravity':0,'drag':1,'curl':False})
for j,(tex,col,sp) in enumerate([('wind_swoosh_b',G,360),('wind_swoosh_a_hi',W,-300)]):
    L.append(stroke(f'ground{j}',0,.5,'wind_groundswirl',tex,col,[0,.04+j*.02,0],{'0':.4,'0.3':1.6,'1':2.4,'ease':'out'},[0,j*60,0],sp,.9))
L.append({'id':'dust','t':'emit','at':0,'life':.06,'att':'feet','pos':[0,.15,0],'burst':24,'rate':0,'from':'ring','fr':.6,'dir':'out','speed':[4,8],'up':[.5,2],'plife':[.3,.6],'look':'model','model':'wind_slash','mmat':'solid','msize':[.06,.14],'col':'#5b4a3a','c2':'#8a7560','gravity':6,'mspin':500,'bounce':0})
L.append({'id':'shake','t':'screen','at':0,'life':.1,'shake':1.5})
fx={'v':1,'desc':'Dash สายลม (⚠ ร่าง Claude): คลื่นวงสโตรกผลักไปข้างหน้า + เส้นลม/ใบไม้ + ตัวเราดีดถอยหลัง (สโตรกลู่ตามทาง) + วงลมพื้น — เขียวขาวแบบ Windrift','tags':['wind','dash'],'pal':'wind','dur':.7,'seed':5,'layers':L}
(ROOT/'assets/fx/wind/dash_push.fx.json').write_text(json.dumps(fx,ensure_ascii=False,indent=1),encoding='utf-8')
print('wind/dash_push',len(L),'layers')
