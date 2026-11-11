// สร้างไฟล์เอฟเฟกต์ Inferno Colossus (สตอรี่บอร์ด #14) — node tools/gen-colossus-fx.js
// โมเดล: assets/fx/mesh/colossus_{torso,arm,palmball,coil}.mesh.json • เอฟเฟกต์: assets/fx/fire/colossus_{a,b}.fx.json
// กรอบ: ยึดที่เท้าผู้ร่าย (att feet) +x ขวา +y บน +z ทิศเล็ง • ช่วง: 1 ปล่อย 0–0.2 • 2 กระทบ 0.2–0.6 • 3 ค้าง 0.6–3.6 • 4 จาง 3.6–3.9
const fs=require('fs'),path=require('path');
const R=path.join(__dirname,'..','assets','fx');
const W=(f,o)=>{fs.writeFileSync(path.join(R,f),JSON.stringify(o,null,1)+'\n');console.log('wrote',f);};
const r2=v=>Math.round(v*100)/100;

// ---------- โมเดล ----------
// ร่างยักษ์รุ่น 2 (2026-11-11, ผู้ใช้: "ทำร่างยักษ์ใหม่" ตามภาพอ้างอิงสตอรี่บอร์ด #14 s14_ref_*): เกราะเหลี่ยมคม ๆ — อกเกราะมีสันกลาง วงแกนกลางอก บ่าเกราะปีกแหลมซ้อนชั้น
// ครีบหลังสูง หมวกเกราะมีหงอนกลาง+เขาข้าง กำปั้นใหญ่ • ใช้กับวัสดุ armor (เนื้อทองโปร่ง + เส้นขอบสว่างทุกสัน js/45) → ทุกหน้าต้องเหลี่ยม (flat)
// ตัวช่วยปั้น (k:"poly"): หน้าหันออกเอง (orient) — พิกัด x ขวา y บน z หน้า
const orient=(v,f)=>{const c=[0,0,0];for(const p of v)for(let a=0;a<3;a++)c[a]+=p[a]/v.length;
 return f.map(F=>{const A=v[F[0]],B=v[F[1]],D=v[F[2]],u=[B[0]-A[0],B[1]-A[1],B[2]-A[2]],w=[D[0]-A[0],D[1]-A[1],D[2]-A[2]],n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]],m=[0,0,0];
  for(const i of F)for(let a=0;a<3;a++)m[a]+=v[i][a]/F.length;return n[0]*(m[0]-c[0])+n[1]*(m[1]-c[1])+n[2]*(m[2]-c[2])<0?F.slice().reverse():F;});};
const R3=p=>p.map(r2);
// หน้าตัดลำตัว 7 จุด: ข้างกว้าง w • หลังลึก b • หน้าลึก f มีสันกลางยื่น (keel)
const sec=(y,w,f,b,z0=0)=>[[-w,y,z0],[-w*0.62,y,z0-b],[w*0.62,y,z0-b],[w,y,z0],[w*0.55,y,z0+f],[0,y,z0+f*1.22],[-w*0.55,y,z0+f]];
// ต่อหน้าตัดหลายชั้นเป็นทรงเดียว (ปิดหัวท้าย)
const loft=(S)=>{const v=[],f=[],n=S[0].length;for(const r of S)for(const p of r)v.push(R3(p));
 for(let i=0;i<S.length-1;i++)for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n;f.push([a,b,b+n,a+n]);}
 f.push([...Array(n).keys()]);f.push([...Array(n).keys()].map(j=>(S.length-1)*n+j));return {v,f:orient(v,f)};};
// แผ่นใบมีด: คู่จุด [ขอบบน(x,y), ขอบล่าง(x,y), ครึ่งความหนา] เรียงจากโคนไปปลาย
const strip=(P)=>{const v=[],f=[];for(const [t,b,h] of P){v.push(R3([t[0],t[1],h]),R3([b[0],b[1],h]),R3([t[0],t[1],-h]),R3([b[0],b[1],-h]));}
 for(let i=0;i<P.length-1;i++){const a=i*4,b=a+4;f.push([a,a+1,b+1,b],[a+2,b+2,b+3,a+3],[a,b,b+2,a+2],[a+1,a+3,b+3,b+1]);}
 const e=(P.length-1)*4;f.push([0,2,3,1],[e,e+1,e+3,e+2]);return {v,f:orient(v,f)};};
// แผ่นหลายเหลี่ยมนูน (outline ในระนาบ x-y) หนา d
const prism=(O,d)=>{const v=[],n=O.length;for(const q of O)v.push(R3([q[0],q[1],d/2]));for(const q of O)v.push(R3([q[0],q[1],-d/2]));
 const f=[[...Array(n).keys()],[...Array(n).keys()].map(j=>n+j)];for(let j=0;j<n;j++){const k=(j+1)%n;f.push([j,k,k+n,j+n]);}return {v,f:orient(v,f)};};
const poly=(id,g,o)=>Object.assign({id,k:'poly',v:g.v,f:g.f,flat:true},o||{});
W('mesh/colossus_torso.mesh.json',{v:2,desc:'Inferno Colossus รุ่น 2: ลำตัวครึ่งบนเกราะเหลี่ยม (กระโปรงเกราะ เข็มขัด ท้อง อกมีสันกลาง วงแกนอก บ่าปีกแหลมซ้อนชั้น ครีบหลัง หมวกเกราะหงอน+เขา) — ฐาน = เท้าผู้ร่าย, ผู้ร่ายอยู่ในท้อง',mat:'armor',pal:'fire',tags:['fire','colossus','storyboard14'],parts:[
 poly('tasset',prism([[-0.48,0.75],[-0.58,-0.15],[0,-1.05],[0.58,-0.15],[0.48,0.75]],0.16),{pos:[0,-0.15,0],rot:[-14,0,0],arr:6,arrR:1.28}),
 {id:'belt',k:'cyl',r0:1.3,r1:1.4,h:0.4,sides:8,pos:[0,0.55,0],scale:[1,1,0.8],caps:true,flat:true},
 poly('belly',loft([sec(0.9,1.0,0.6,0.5),sec(1.85,1.14,0.72,0.58)])),
 poly('chest',loft([sec(1.75,1.28,0.8,0.62),sec(2.6,1.78,1.12,0.82),sec(3.45,2.02,1.2,0.9),sec(3.95,1.45,0.85,0.7),sec(4.2,0.62,0.45,0.45)])),
 {id:'core',k:'torus',r:0.52,tube:0.1,sides:4,seg:8,pos:[0,2.85,1.34],rot:[90,0,0],flat:true},
 poly('collar',prism([[0.12,2.98],[0.5,2.8],[1.95,3.88],[1.55,4.12]],0.5),{pos:[0,0,0.95],rot:[-8,0,0],mir:true}),
 poly('pauld',strip([[[-0.7,0.75],[-0.7,0.0],0.95],[[0.5,0.98],[0.6,-0.3],1.02],[[1.6,0.95],[1.7,-0.1],0.82],[[2.5,1.3],[2.45,0.78],0.45],[[3.05,1.78],[3.03,1.72],0.1]]),{pos:[1.7,3.55,0],mir:true}),
 poly('pauld2',strip([[[-0.5,0.5],[-0.5,0.0],0.8],[[0.5,0.6],[0.6,-0.3],0.86],[[1.4,0.5],[1.45,-0.15],0.6],[[2.1,0.75],[2.08,0.68],0.1]]),{pos:[1.95,2.95,0],rot:[0,0,-14],mir:true}),
 poly('wing',strip([[[0,0.9],[0,0],0.22],[[1.2,1.9],[1.5,0.7],0.2],[[2.4,3.3],[2.8,2.4],0.14],[[3.2,5.0],[3.26,4.92],0.05]]),{pos:[1.05,3.25,-1.0],mir:true}),
 poly('wing2',strip([[[0,0.6],[0,0],0.18],[[1.3,1.0],[1.5,0.15],0.16],[[2.6,1.7],[2.9,1.1],0.1],[[3.7,2.6],[3.75,2.54],0.05]]),{pos:[1.2,2.5,-0.95],mir:true}),
 {id:'neck',k:'cyl',r0:0.72,r1:0.5,h:0.5,sides:6,pos:[0,4.05,0.05],flat:true},
 poly('helm',loft([sec(4.35,0.3,0.55,0.32,0.08),sec(4.7,0.58,0.78,0.52,0.08),sec(5.15,0.68,0.85,0.62,0.08),sec(5.55,0.56,0.62,0.56,0.08),sec(5.82,0.3,0.32,0.3,0.08)])),
 {id:'brow',k:'box',w:1.15,h:0.13,d:0.4,pos:[0,5.2,0.82],rot:[18,0,0],flat:true},
 {id:'crest',k:'shard',h:1.9,w:0.44,sides:4,mid:0.25,pos:[0,5.6,0.3],rot:[-10,0,0],flat:true},
 {id:'horn',k:'shard',h:1.5,w:0.34,sides:4,mid:0.25,pos:[0.42,5.5,0.05],rot:[0,0,-32],flat:true,mir:true},
 {id:'fin',k:'shard',h:1.05,w:0.32,sides:4,mid:0.3,pos:[0.58,4.95,-0.05],rot:[0,0,-78],flat:true,mir:true}
]});
// แขน 1 ข้าง: จุดหมุน = ข้อไหล่ (0,0,0) ห้อยลง -y • ใช้ทั้งสองข้าง (ทรงสมมาตรซ้ายขวา) • ปลอกแขนบานใหญ่ + กำปั้นยักษ์แบบภาพอ้างอิง
W('mesh/colossus_arm.mesh.json',{v:2,desc:'Inferno Colossus รุ่น 2: แขนเกราะ 1 ข้าง (จุดหมุนที่ไหล่ ห้อยลง) ข้อไหล่ ต้นแขน ศอกแหลม ปลอกแขนบาน กำปั้นยักษ์',mat:'armor',pal:'fire',tags:['fire','colossus','storyboard14'],parts:[
 {id:'joint',k:'sphere',r:0.62,seg:4,pos:[0,-0.15,0],flat:true},
 {id:'upper',k:'cyl',r0:0.46,r1:0.58,h:1.7,sides:6,pos:[0,-1.9,0],flat:true},
 {id:'elbow',k:'shard',h:1.0,w:0.55,sides:4,mid:0.3,pos:[0,-2.0,-0.25],rot:[110,0,0],flat:true},
 {id:'bracer',k:'cyl',r0:0.84,r1:0.56,h:1.7,sides:6,pos:[0,-3.7,0.03],caps:true,flat:true},
 {id:'cuff',k:'cyl',r0:0.98,r1:0.92,h:0.24,sides:6,pos:[0,-3.78,0.03],caps:true,flat:true},
 {id:'fist',k:'box',w:1.22,h:1.0,d:1.25,pos:[0,-4.3,0.1],flat:true},
 {id:'knuck',k:'box',w:0.27,h:0.44,d:0.3,pos:[-0.465,-4.55,0.74],arr:4,arrMode:'line',arrStep:[0.31,0,0],flat:true},
 {id:'thumb',k:'box',w:0.3,h:0.56,d:0.42,pos:[0.72,-4.15,0.3],flat:true,mir:true}
]});
// ลูกไฟในมือ: วางที่ปลายแขน (ใช้ pos/rot เดียวกับแขน → ติดมือพอดี)
W('mesh/colossus_palmball.mesh.json',{v:1,desc:'Inferno Colossus: ลูกไฟในกำมือ (อยู่ที่ปลายแขน colossus_arm — ใช้ pos/rot ชุดเดียวกับแขน)',mat:'fire',pal:'fire',tags:['fire','colossus','storyboard14'],parts:[
 {id:'ball',k:'sphere',r:0.8,seg:16,pos:[0,-4.75,0.35]}
]});
// เกลียวไฟตอนกระโดด: ท่อเกลียว 3 รอบ รัศมี 0.85 สูง 2.6 ม. (ไฟต่อเนื่องเส้นเดียว)
{const P=[],N=40,T=3;for(let i=0;i<=N;i++){const u=i/N,a=u*T*Math.PI*2;P.push([r2(Math.cos(a)*(1.25-0.35*u)),r2(u*3.4),r2(Math.sin(a)*(1.25-0.35*u))]);}
W('mesh/colossus_coil.mesh.json',{v:1,desc:'Inferno Colossus: เกลียวไฟพันตัวตอนกระโดดขึ้น (ท่อเส้นเดียว 3 รอบ สูง 2.7 ม.)',mat:'fire',pal:'fire',tags:['fire','colossus','storyboard14'],parts:[
 {id:'coil',k:'tube',path:P,r0:0.26,r1:0.08,curve:0.7,sides:8,seg:120}]});}

// ---------- ท่าแขน ----------
// ไหล่ซ้าย/ขวา (เมตร จากเท้าผู้ร่าย) • แขนซ้ายถือลูกไฟ: ยกขึ้นด้านข้าง → เหวี่ยงลงไปข้างหน้า (ปา) → กลับมาถือใหม่
const SH=[2.55,3.8,0];
// เวลา (วิ จากต้นเอฟเฟกต์) → ท่า [rotX, rotY, rotZ] (องศา, ตามสูตร runtime: x=เงย y=ขวา z=เอียง)
// rot x บวก = เหวี่ยงมือไปข้างหน้า, rot z ลบ = กางแขนซ้ายออกด้านข้าง/ยกขึ้น
const rest=[0,0,6],hold=[10,0,-125],wind=[40,0,-165],rel=[-40,0,-170],throwP=[70,0,-25],after=[35,0,-5];
const armKeys=[[0.2,[0,0,4]],[0.6,rest],[1.0,hold],[2.0,hold],[2.17,wind],[2.3,rel],[2.4,throwP],[2.6,after],[2.95,rest],[3.25,hold],[3.9,hold]];
// ตำแหน่งมือ (ลูกไฟในกำมือ) ของแขนซ้ายตามท่า — สูตรเดียวกับ runtime (rotation.set(-x,-y,z), ลำดับ XYZ)
function handAt(r){const D=Math.PI/180,a=-r[0]*D,b=-r[1]*D,c=r[2]*D;let [x,y,z]=[0,-4.75,0.35];
 const x1=x*Math.cos(c)-y*Math.sin(c),y1=x*Math.sin(c)+y*Math.cos(c),z1=z,x2=x1*Math.cos(b)+z1*Math.sin(b),z2=-x1*Math.sin(b)+z1*Math.cos(b);
 return [r2(-SH[0]+x2),r2(SH[1]+y1*Math.cos(a)-z2*Math.sin(a)),r2(y1*Math.sin(a)+z2*Math.cos(a))];}
function curve(keys,t0,life,map){const c={};for(const [t,v] of keys){const u=(t-t0)/life;if(u<-1e-6||u>1+1e-6)continue;c[String(r2(Math.min(1,Math.max(0,u))*1000)/1000)]=map?map(v):v;}return c;}

// ---------- เอฟเฟกต์ ----------
function build(V){
 const A=V==='a',C=V==='c';   // C = รุ่น 2 (ในเกม): เกราะทองเหลี่ยม + เส้นขอบ (วัสดุ armor) ตามภาพอ้างอิง
 const O='#ff6a2a',HOT='#ffd27a',WHT='#fff4e0',DEEP='#c2300a';
 const L=[];const add=o=>{L.push(o);return o;};
 // วัสดุผิวร่าง: A = เกราะพลังงานโปร่ง ขอบเรืองขาวแบบเรฟ + ผิวไฟเลีย • B = ไฟล้วน (shader ไฟลิ้นไฟบนทรงร่าง) + ไฟ 3D อัดเต็มตัว
 const skin=C?{mat:'armor',col:'#ff9410',col2:'#d83204',int:0.92}:A?{mat:'energy',col:'#ff5a14',col2:'#ffc060',rim:1.8,int:1.2,scroll:1.4}:{mat:'fire',col:O,col2:DEEP,mode:'sheet',disp:0.75,heat:0.15,int:1.2,flow:[0,1,0]};
 const flick=A?{mat:'fire',col:O,col2:DEEP,mode:'sheet',disp:0.6,heat:0.05,int:0.95,flow:[0,1,0]}:{mat:'energy',col:HOT,col2:O,rim:2.6,int:0.8,scroll:2};
 const skinOp=C?1:A?0.75:0.85,flickOp=A?0.6:0.3;
 // ช่วง 1: ปล่อย 0–0.2 — แฟลชที่ตัว วงกระแทกพื้น เสาไฟพุ่งที่จุดกระโดด เกลียวไฟพันตัวไต่ขึ้น + เปลวทิ้งเป็นทาง
 add({id:'s1_flash',t:'flash',at:0,life:0.14,att:'feet',pos:[0,1.1,0],col:HOT,size:3,k:1.6});
 add({id:'s1_ring',t:'ring',at:0,life:0.45,att:'ground',col:O,r:4.5,op:0.6});
 add({id:'s1_scorch',t:'decal',at:0,life:3.9,att:'ground',kind:'crack',r:3.2,n:9,burn:1.2});
 add({id:'s1_launch',t:'firevol',at:0.06,life:0.5,att:'ground',kind:'pillar',hx:0.7,hz:0.7,h:2.4,hgt:{'0':0.1,'0.25':1},dis:{'0':0,'0.4':0,'1':1},int:1.3,spd:1.8});
 add({id:'s1_coil',t:'mesh',at:0,life:0.5,att:'feet',shape:'model',model:'colossus_coil',mat:'fire',col:HOT,col2:O,mode:'sheet',disp:0.3,int:1.3,heat:0.2,
  scale:{'0':[1,0.08,1],'0.35':[1,1,1],'1':[1.25,1.15,1.25],ease:'out'},spin:720,op:{'0':1,'0.6':1,'1':0},dis:{'0':0,'0.55':0,'1':0.9},fade:0});
 add({id:'s1_trail',t:'emit',at:0,life:0.35,att:'feet',pos:[0,0.6,0],burst:0,rate:180,from:'ring',fr:0.9,dir:'tangent',speed:[1,2.5],up:[0,1],plife:[0.25,0.5],look:'fire',size:[9,13],col:HOT,c2:DEEP,gravity:-1,drag:2});
 add({id:'s1_snd',t:'sound',at:0,name:'cast_fire',vol:0.9});
 // ช่วง 2: กระทบ 0.2–0.6 — ไฟระเบิดเหนือหัวเป็นก้อนใหญ่ แล้วก่อตัวเป็นร่างยักษ์ (ไหม้เข้าจากลาย สลาย→เต็ม, ขยายออกจากกลาง)
 add({id:'s2_burst',t:'firevol',at:0.18,life:0.55,att:'feet',pos:[0,1.6,0],kind:'shell',hx:2.2,hz:1.6,h:4.6,hgt:{'0':0.15,'0.35':1},dis:{'0':0,'0.5':0,'1':1},int:1.45,den:1.2,spd:2});
 add({id:'s2_halo',t:'halo',at:0.2,life:0.5,att:'feet',pos:[0,3.4,0],col:O,size:9,size0:2,k:1});
 add({id:'s2_core',t:'flash',at:0.2,life:0.18,att:'feet',pos:[0,3.4,0.4],col:WHT,size:3.5,k:1.4});
 const formS={'0':0.3,'1':1,ease:'out'},formP={'0':[0,2.3,0],'1':[0,0,0],ease:'out'},formD={'0':0.85,'0.8':0,'1':0};
 add(Object.assign({id:'s2_torso',t:'mesh',at:0.2,life:0.42,att:'feet',shape:'model',model:'colossus_torso',scale:formS,pos:formP,dis:formD,op:{'0':0.3,'1':skinOp},fade:0},skin));
 for(const s of [-1,1]){const k=s<0?'L':'R';
  add(Object.assign({id:'s2_arm'+k,t:'mesh',at:0.2,life:0.42,att:'feet',shape:'model',model:'colossus_arm',
   pos:{'0':[s*SH[0]*0.3,2.3+SH[1]*0.3,0],'1':SH,ease:'out'},scale:formS,rot:s<0?curve(armKeys,0.2,0.42,v=>v):{'0':[0,0,-4],'1':[0,0,-6]},dis:formD,op:{'0':0.3,'1':skinOp},fade:0},skin));}
 add({id:'s2_light',t:'light',at:0.2,life:3.7,att:'feet',pos:[0,3.4,1],col:'#ff7a2a',int:{'0':2.5,'0.12':1.6,'0.9':1.6,'1':0},dist:16});
 add({id:'s2_shake',t:'screen',at:0.2,life:0.3,own:true,shake:5,flash:0.04,fcol:O});
 add({id:'s2_warp',t:'warp',at:0.2,life:0.5,att:'feet',pos:[0,3,0],kind:'shock',size:{'0':2,'1':14},str:1.2,op:{'0':1,'1':0}});
 add({id:'s2_roar',t:'sound',at:0.22,name:'roar',vol:0.9});
 // ช่วง 3: ค้าง 0.6–3.6 — ร่างยักษ์ลอยอยู่: ผิวเกราะ + ไฟลุกตามผิว, ท่อนล่างเป็นไฟ 3D ต่อเนื่อง, แกนอกเรือง, ตาไฟ, วงแหวนหลังหัว, ประกายในตัว,
 //   แขนซ้ายยกถือลูกไฟ → ปาตามเส้นสีขาวในภาพร่าง (2.15–2.6) → ระเบิดที่พื้นหน้าเป้า → ถือลูกใหม่
 const T3=0.6,L3=3.0;
 add(Object.assign({id:'s3_torso',t:'mesh',at:T3,life:L3,att:'feet',shape:'model',model:'colossus_torso',op:skinOp,fade:0,scale:{'0':1,'0.5':1.02,'1':1}},skin));
 if(!C)add(Object.assign({id:'s3_torsoF',t:'mesh',at:T3,life:L3,att:'feet',shape:'model',model:'colossus_torso',op:flickOp,fade:0,scale:1.05},flick));
 for(const s of [-1,1]){const k=s<0?'L':'R';
  const rot=s<0?curve(armKeys,T3,L3):{'0':[0,0,-6],'0.5':[-8,0,-10],'1':[0,0,-6]};
  add(Object.assign({id:'s3_arm'+k,t:'mesh',at:T3,life:L3,att:'feet',shape:'model',model:'colossus_arm',pos:[s*SH[0],SH[1],SH[2]],rot,op:skinOp,fade:0},skin));
  if(!C)add(Object.assign({id:'s3_arm'+k+'F',t:'mesh',at:T3,life:L3,att:'feet',shape:'model',model:'colossus_arm',pos:[s*SH[0],SH[1],SH[2]],rot,op:flickOp,fade:0,scale:1.06},flick));}
 // ท่อนล่าง = ไฟ 3D ต่อเนื่อง (ไม่มีขา) • B: ไฟ 3D อัดเต็มลำตัว/หัว/แขนด้วย
 add({id:'s3_skirt',t:'firevol',at:0.45,life:L3+0.15,att:'feet',pos:[0,-1.9,0],kind:'shell',hx:C?1.9:2.3,hz:C?1.5:1.8,h:C?2.6:A?3.6:4.4,hgt:{'0':0.2,'0.08':1},dis:{'0':0,'1':0},int:1.3,den:A||C?1:1.3,spd:1.4});
 if(V==='b'){
  add({id:'s3_volChest',t:'firevol',at:0.45,life:L3+0.15,att:'feet',pos:[0,0.6,0],kind:'pillar',hx:1.5,hz:1.05,h:4.4,hgt:{'0':0.2,'0.08':1},dis:{'0':0,'1':0},int:1.25,den:1.2,spd:1.2});
  add({id:'s3_volHead',t:'firevol',at:0.45,life:L3+0.15,att:'feet',pos:[0,4.2,0.1],kind:'pillar',hx:0.75,hz:0.75,h:2.6,hgt:{'0':0.2,'0.08':1},dis:{'0':0,'1':0},int:1.3,spd:1.6});
  add({id:'s3_volArmR',t:'firevol',at:0.45,life:L3+0.15,att:'feet',pos:[SH[0]+0.3,-0.3,0],kind:'pillar',hx:0.6,hz:0.6,h:4.6,hgt:{'0':0.2,'0.08':1},dis:{'0':0,'1':0},int:1.2,spd:1.3});
  add({id:'s3_smoke',t:'emit',at:T3,life:L3,att:'feet',pos:[0,6.8,-0.3],burst:0,rate:4,from:'disc',fr:1.4,dir:'up',spread:0.4,speed:[0.8,1.6],plife:[1,1.6],look:'smoke',size:[8,12],col:'#5a4a40',c2:'#221c1a',gravity:-0.5,grow:1,drag:1.5,x:true});
 }
 add({id:'s3_core',t:'halo',at:T3,life:L3,att:'feet',pos:C?[0,2.85,1.4]:[0,2.9,0.9],col:A||C?WHT:HOT,size:C?3:A?2.6:2,size0:2.4,k:C?1.6:A?1.3:1});
 add({id:'s3_coreG',t:'halo',at:T3,life:L3,att:'feet',pos:[0,2.9,0.6],col:O,size:6,size0:6,k:0.7});
 for(const s of [-1,1])add({id:'s3_eye'+(s<0?'L':'R'),t:'halo',at:T3,life:L3,att:'feet',pos:[s*0.3,5.0,1.0],col:'#fff2a0',size:0.75,size0:0.75,k:2});
 add({id:'s3_eyeFl',t:'emit',at:T3,life:L3,att:'feet',pos:[0,5.0,0.95],burst:0,rate:40,from:'line',fh:0.7,dir:'up',spread:0.5,speed:[0.6,1.6],plife:[0.25,0.45],look:'fire',size:[3,5],col:HOT,c2:O,gravity:-2,drag:2,x:true});
 add({id:'s3_halo',t:'mesh',at:T3,life:L3,att:'feet',shape:'torus',pos:C?[0,5.5,-0.7]:[0,5.1,-0.85],rot:[90,0,0],scale:C?{'0':2.6,'1':2.6}:{'0':1.6,'1':1.6},mat:A||C?'glow':'fire',col:A||C?HOT:O,col2:DEEP,op:A||C?0.8:0.9,int:A||C?1:1.2,mode:'sheet',inner:0.93,fade:0,spin:20});
 add({id:'s3_embers',t:'emit',at:T3,life:L3,att:'feet',pos:[0,1.8,0],burst:0,rate:A?45:60,from:'box',fr:2.2,fh:4,dir:'up',spread:0.6,speed:[0.6,2],up:[0.5,1.5],plife:[0.8,1.5],look:'ember',size:[2,3],col:HOT,c2:'#ff3a0a',gravity:-1.2,x:true});
 if(A||C)add({id:'s3_spark',t:'emit',at:T3,life:L3,att:'feet',pos:[0,2.6,0.2],burst:0,rate:30,from:'box',fr:1.8,fh:3.6,dir:'random',speed:[0.1,0.4],plife:[0.4,0.9],look:'glow',size:[1,1.8],col:WHT,c2:HOT,gravity:0,x:true});
 add({id:'s3_haze',t:'warp',at:T3,life:L3,att:'feet',pos:[0,3,0],kind:'haze',size:10,str:0.9,op:{'0':0,'0.05':1,'0.95':1,'1':0}});
 // ลูกไฟในมือซ้าย (ใช้ pos/rot ชุดเดียวกับแขนซ้าย) — ช่วงถือ 0.6–2.3 และ 2.9–3.9
 const ballL=(id,t0,t1,opC)=>add({id,t:'mesh',at:t0,life:t1-t0,att:'feet',shape:'model',model:'colossus_palmball',pos:[-SH[0],SH[1],SH[2]],rot:curve(armKeys,t0,t1-t0),
  mat:'fire',col:HOT,col2:O,mode:'ball',disp:0.7,heat:0.35,int:1.4,op:opC,fade:0,scale:{'0':0.2,'0.15':1,'1':1}});
 ballL('s3_ball',0.6,2.31,{'0':1,'1':1});
 ballL('s3_ball2',2.9,3.6,{'0':1,'1':1});
 // ลูกไฟที่ปาออก: จากมือ (คำนวณจากท่าปล่อย) ตามเส้นสีขาว → ตกพื้นหน้าเป้า ~10 ม.
 const h0=handAt(rel),shotP={'0':h0,'0.3':[r2(h0[0]*0.7),r2(h0[1]*0.8+0.6),r2(h0[2]+2.6)],'1':[-0.4,0.3,10.5],ease:'in'};console.log('release hand',h0);
 add({id:'s3_shot',t:'mesh',at:2.3,life:0.32,att:'feet',shape:'sphere',pos:shotP,scale:1.5,mat:'fire',col:HOT,col2:O,mode:'ball',disp:0.7,heat:0.4,int:1.5,fade:0});
 add({id:'s3_shotTr',t:'trail',at:2.3,life:0.32,of:'s3_shot',col:HOT,col2:DEEP,w:1.2,tlife:0.3,k:1.5});
 add({id:'s3_shotFl',t:'emit',at:2.3,life:0.32,att:'feet',pos:shotP,burst:0,rate:160,from:'sphere',fr:0.6,dir:'random',speed:[0.3,1],plife:[0.3,0.55],look:'fire',size:[10,14],col:HOT,c2:DEEP,gravity:-1.5,drag:2});
 add({id:'s3_boom',t:'firevol',at:2.62,life:0.7,att:'feet',pos:[-0.4,0,10.5],kind:'shell',hx:2.2,hz:2.2,h:4.2,hgt:{'0':0.15,'0.25':1},dis:{'0':0,'0.4':0,'1':1},int:1.5,spd:2});
 add({id:'s3_boomR',t:'ring',at:2.62,life:0.5,att:'feet',pos:[-0.4,0.1,10.5],col:O,r:6,op:0.6});
 add({id:'s3_boomF',t:'flash',at:2.62,life:0.16,att:'feet',pos:[-0.4,1,10.5],col:HOT,size:5,k:1.4});
 add({id:'s3_boomD',t:'decal',at:2.62,life:1.25,att:'feet',pos:[-0.4,0,10.5],kind:'crack',r:4,n:10,burn:1.5});
 add({id:'s3_boomE',t:'emit',at:2.62,life:0.06,att:'feet',pos:[-0.4,0.3,10.5],burst:50,from:'hemisphere',fr:0.8,dir:'out',speed:[4,10],plife:[0.4,0.9],look:'ember',size:[2,3],col:HOT,c2:'#ff3a0a',gravity:5});
 add({id:'s3_boomS',t:'screen',at:2.62,life:0.25,shake:4});
 add({id:'s3_boomSnd',t:'sound',at:2.62,name:'boom',vol:0.8});
 add({id:'s3_throwSnd',t:'sound',at:2.3,name:'throw',vol:0.8});
 // ช่วง 4: จาง 3.6–3.9 — เกราะไหม้สลายจากลาย ลอยขึ้น + ไฟพวยขึ้นทีเดียว + ถ่านไฟ/ควัน
 const fadeD={'0':0,'1':1},fadeS={'0':1,'1':1.1},fadeP={'0':[0,0,0],'1':[0,0.9,0]};
 add(Object.assign({id:'s4_torso',t:'mesh',at:3.6,life:0.3,att:'feet',shape:'model',model:'colossus_torso',dis:fadeD,scale:fadeS,pos:fadeP,op:{'0':skinOp,'1':0.2},fade:0},skin));
 for(const s of [-1,1]){const k=s<0?'L':'R';
  add(Object.assign({id:'s4_arm'+k,t:'mesh',at:3.6,life:0.3,att:'feet',shape:'model',model:'colossus_arm',pos:{'0':[s*SH[0],SH[1],0],'1':[s*SH[0]*1.1,SH[1]+0.9,0]},rot:s<0?hold:[0,0,-6],dis:fadeD,op:{'0':skinOp,'1':0.2},fade:0},skin));}
 add({id:'s4_fire',t:'firevol',at:3.55,life:0.35,att:'feet',pos:[0,-0.5,0],kind:'shell',hx:2.6,hz:2,h:7.5,hgt:{'0':0.6,'0.3':1},dis:{'0':0.1,'1':1},int:1.3,spd:2.4});
 add({id:'s4_embers',t:'emit',at:3.6,life:0.06,att:'feet',pos:[0,3,0],burst:70,from:'box',fr:2.4,fh:5,dir:'up',spread:0.8,speed:[1.5,4],plife:[0.6,1.2],look:'ember',size:[2,3.4],col:HOT,c2:'#ff3a0a',gravity:-1.5});
 add({id:'s4_smoke',t:'emit',at:3.6,life:0.06,att:'feet',pos:[0,4,0],burst:10,from:'box',fr:2,fh:3,dir:'up',spread:0.6,speed:[0.8,1.6],plife:[0.8,1.3],look:'smoke',size:[10,14],col:'#5a4a40',c2:'#221c1a',gravity:-0.5,grow:1,drag:1.5,x:true});
 return {v:1,desc:(A?'Inferno Colossus แบบ A (สตอรี่บอร์ด #14): ร่างยักษ์เกราะพลังงานไฟโปร่ง ขอบเรืองขาวแบบภาพเรฟ + ไฟเลียตามผิว ท่อนล่างเป็นไฟ 3D':'Inferno Colossus แบบ B (สตอรี่บอร์ด #14): ร่างยักษ์ไฟลุกท่วม (ผิวลิ้นไฟ + ไฟ 3D อัดเต็มตัว) ขอบเรืองบาง มีควัน')+' • เกลียวไฟตอนกระโดด → ไฟระเบิดเหนือหัวก่อตัวเป็นร่าง → ถือลูกไฟ/ปา → ไหม้สลาย • ยังไม่ผูกกับเกม',
  tags:['fire','pyro','ult','colossus','storyboard14'],pal:'fire',dur:3.9,seed:14,layers:L};
}
W('fire/colossus_a.fx.json',build('a'));
W('fire/colossus_b.fx.json',build('b'));

// ---------- เวอร์ชันในเกม (ผู้ใช้เลือกแบบ B 2026-10-31) ----------
// fire/colossus = ร่างตามตัว (bind loop:colossus, เริ่ม/หยุดจาก pyroFX ตอน p.co) • ช่วง 3 วนจน fxStop • ช่วง 4 = end
// fire/colossus_cast = จุดกระโดดบนพื้น (efx:colossus) • fire/colossus_shot = ลูกไฟปาจากมือซ้ายไปจุดเป้า (efx:colbolt) • fire/colossus_gone = ตอนร่างหาย (efx:colend)
{const B=build('c'),HOT='#ffd27a',O='#ff6a2a',DEEP='#c2300a';
 const cast=[],drop=new Set(['s3_ball2','s3_shot','s3_shotTr','s3_shotFl','s3_boom','s3_boomR','s3_boomF','s3_boomD','s3_boomE','s3_boomS','s3_boomSnd','s3_throwSnd']);
 // ท่าเหวี่ยงปา: tw = วินาทีหลังปาล่าสุด (pyroFX ตั้งให้ทุกเฟรม) • 0–0.06 ง้างไปหลัง → 0.06–0.16 เหวี่ยงไปข้างหน้า-ลง → ค้าง → 0.35–0.7 กลับมาท่าถือ
 const sw='(min(1,tw/0.06))',fw='(min(1,max(0,(tw-0.06)/0.1)))',bk='(min(1,max(0,(tw-0.35)/0.35)))';
 const swing=[0,1,2].map(i=>{const h=hold[i],w=wind[i],t=throwP[i];return `${h}+(${r2(w-h)})*${sw}*(1-${fw})+(${r2(t-h)})*${fw}*(1-${bk})`;});
 const L=[];
 for(const l0 of B.layers){const l=JSON.parse(JSON.stringify(l0));
  if(['s1_ring','s1_scorch','s1_launch','s1_snd'].includes(l.id)){cast.push(l);continue;}
  if(drop.has(l.id))continue;
  if(l.id==='s2_armL')l.rot={'0':[0,0,4],'1':hold};
  if(l.id==='s2_light'){l.life=0.4;l.int={'0':2.5,'1':1.6};}
  if(l.id.startsWith('s3_')){l.loop=true;
   if(l.id==='s3_armL'||l.id==='s3_armLF')l.rot=swing;
   if(l.id==='s3_ball'){l.rot=swing;l.scale='tw<0.1?1:min(1,max(0.001,(tw-0.35)/0.35))';l.life=1;l.op=1;}
   if(l.id==='s3_haze')l.op={'0':1};
   if(l.t==='firevol'){l.hgt={'0':1};l.dis={'0':0};l.life=1.5;}}
  if(l.id.startsWith('s4_')){l.end=true;l.at=r2(Math.max(0,l.at-3.6));}
  L.push(l);}
 L.push({id:'s3_light',t:'light',at:0.6,life:1,loop:true,att:'feet',pos:[0,3.4,1],col:'#ff7a2a',int:1.6,dist:16});
 W('fire/colossus.fx.json',{v:1,desc:'Inferno Colossus ในเกม (แบบ B, สตอรี่บอร์ด #14): เกลียวไฟพันตัวตอนกระโดด → ไฟระเบิดเหนือหัวก่อตัวเป็นร่างยักษ์ไฟ → ลอยตามตัวถือลูกไฟในมือซ้าย (วนจน fxStop) → ไหม้สลาย • bind loop:colossus (pyroFX เล่น/หยุดตาม p.co)',
  tags:['fire','pyro','ult','colossus','storyboard14','loop'],pal:'fire',dur:3.6,seed:14,params:{tw:{def:9,desc:'วินาทีหลังปาลูกไฟล่าสุด (เกมตั้งให้) — 0 = เริ่มเหวี่ยงแขน'}},layers:L});
 cast.push({id:'s1_light',t:'light',at:0,life:0.5,att:'ground',pos:[0,1.5,0],col:'#ff7a2a',int:{'0':2.2,'1':0},dist:14});
 cast.push({id:'s1_shake',t:'screen',at:0,life:0.25,own:true,shake:4});
 W('fire/colossus_cast.fx.json',{v:1,desc:'Inferno Colossus: จุดกระโดดบนพื้น (วงกระแทก เสาไฟ รอยไหม้ แสง เสียง) • efx:colossus replace',tags:['fire','pyro','ult','colossus','storyboard14'],pal:'fire',dur:3.9,seed:14,layers:cast});
 // ลูกไฟปา: event colbolt ไม่มีมุม (a=0 → แกน z = x แผนที่, แกน x = y แผนที่) • dx/dz/dy = ระยะไปเป้า (ม.), T = เวลาบิน
 // จุดเริ่ม = มือซ้ายกลางวงเหวี่ยง ปล่อยที่ 0.1 วิ (ระเบิดยังตรงเวลาเดิม: บิน T-0.1) (handAt เทียบกับจุด event ที่อยู่หน้าตัว 1.5 ม. สูง 4.2 ม.) หมุนตามทิศไปเป้า
 const h=handAt([55,0,-95]),R=r2(h[0]),U=r2(h[1]-4.2),F=r2(h[2]-1.5),N='(sqrt(dx*dx+dz*dz)+0.001)';
 const st=[`(${R}*dz+${F}*dx)/${N}`,U,`(${-R}*dx+${F}*dz)/${N}`];
 const P={'0':st,'1':['dx','dy+0.3','dz']};
 W('fire/colossus_shot.fx.json',{v:1,desc:'Inferno Colossus: ลูกไฟปาจากมือซ้ายของร่างยักษ์ไปจุดเป้า (หางไฟหนา) • efx:colbolt replace (ระเบิด = colboom โค้ดเดิม)',tags:['fire','pyro','ult','colossus','storyboard14','projectile'],pal:'fire',dur:0.8,seed:14,
  params:{dx:{def:0,desc:'ไปเป้า แกน y แผนที่ (ม.)'},dz:{def:20,desc:'ไปเป้า แกน x แผนที่ (ม.)'},dy:{def:-6,desc:'ต่างความสูง (ม.)'},T:{def:0.6,desc:'เวลาบิน (วิ)'}},
  layers:[
   {id:'flash',t:'flash',at:0.1,life:0.14,pos:st,col:HOT,size:3.5,k:1.4},
   {id:'ball',t:'mesh',at:0.1,life:'max(0.05,T-0.1)',shape:'sphere',pos:P,scale:1.5,mat:'fire',col:HOT,col2:O,mode:'ball',disp:0.7,heat:0.4,int:1.5,fade:0},
   {id:'tr',t:'trail',at:0.1,life:'max(0.05,T-0.1)',of:'ball',col:HOT,col2:DEEP,w:1.2,tlife:0.3,k:1.5},
   {id:'fl',t:'emit',at:0.1,life:'max(0.05,T-0.1)',pos:P,burst:0,rate:150,from:'sphere',fr:0.6,dir:'random',speed:[0.3,1],plife:[0.3,0.55],look:'fire',size:[10,14],col:HOT,c2:DEEP,gravity:-1.5,drag:2},
   {id:'lt',t:'light',at:0.1,life:'max(0.05,T-0.1)',pos:P,col:'#ff7a2a',int:1.8,dist:10},
   {id:'snd',t:'sound',at:0.05,name:'throw',vol:0.8},{id:'snd2',t:'sound',at:0.02,name:'cast_fire',vol:0.6}]});
 W('fire/colossus_gone.fx.json',{v:1,desc:'Inferno Colossus: ตอนร่างหาย (ถ่านไฟกระจาย + แสงวาบ) — ตัวร่างไหม้สลายอยู่ใน end ของ fire/colossus • efx:colend replace',tags:['fire','pyro','ult','colossus','storyboard14'],pal:'fire',dur:1,seed:14,layers:[
   {id:'flash',t:'halo',at:0,life:0.4,pos:[0,1.5,0],col:O,size:8,size0:3,k:0.8},
   {id:'lt',t:'light',at:0,life:0.4,pos:[0,1.5,0],col:'#ff7a2a',int:{'0':2,'1':0},dist:14}]});
}
