// =====================================================================
//  ลม + หญ้า 3D (ภาพบนเครื่องตัวเองล้วน ไม่แตะโฮสต์/โปรโตคอล)
//  • AIR = ลมกลาง: ลมประจำแผนที่ (ทิศ/แรง) + ลมกระโชกจากสกิล (ระเบิด/แสงวาบ/วงคลื่นบนพื้น) — หญ้า + ผ้าคลุมอ่านจากที่นี่
//  • หญ้า: ใบหญ้าเป็นหมื่นใบรอบกล้อง (การ์ดจอขยับเองทั้งหมด) วางเฉพาะพื้นที่ "เขียว" ของแผนที่
//    ตอนโหลดแผนที่ ถ่ายภาพแผนที่จากด้านบน 1 ครั้ง (grassBake) → รู้สีพื้น + ความสูงพื้น + ตรงไหนมีหลังคา/ต้นไม้บัง
//  • หญ้าแหวกตามตัวละคร/ไม้กวาดบินต่ำ (+ รอยเท้า), ลู่ออกเป็นวงตอนระเบิด แล้วเด้งกลับ
//  • รอยสนามรบทั้งแมตช์ (SCAR): ไฟ = ไหม้ดำ • น้ำแข็ง = ขาว • ระเบิด/หิน = ล้มราบ/หาย — บนหญ้าและพื้น (grLive)
//  ตัวเลขข้างล่างเป็นค่าภาพล้วน ปรับได้ตามชอบ • ดีบัก: WD.grass (GRASS, AIR, SCAR, grassBake, grassScar, scarPaint)
// =====================================================================
const AIR={
  dir:new THREE.Vector2(1,0),   // ทิศลมประจำแผนที่ (ตั้งใน grassBake ตามแผนที่)
  str:0.35,                      // แรงลมปกติ (หน่วยงอของหญ้า; ผ้าคลุม ×CLW_K)
  t:0,
  G:[],                          // ลมกระโชก {x,z,R,s,age,life}
  M:[],                          // รอยบนหญ้า {x,z,r,burn(1)/frost(-1),age,life}
};
const AIR_MAP={pitch:0.5,meadow:0.5,lake:0.45,ruins:0.45,forest:0.25,castle:0.3,greathall:0,hogsmeade:0.35,test:0.35};
// เพิ่มลมกระโชกที่จุด (หน่วย 3D) — R = รัศมี, s = แรง (1 ≈ ระเบิดใหญ่)
// o (ไม่ใส่ก็ได้): sw = หมุนวนรอบจุด (ทอร์นาโด, ลบ = วนกลับ) • dx,dz = ดันไปทางเดียว (หน่วยแรงเดียวกับ s) • s ติดลบ = ดูดเข้าหาจุด • life = อายุ (วิ) • hold = ค้างไว้ไม่จาง จนกว่า airGustOff(id)
const AIR_NG=12;   // จำนวนช่องลมกระโชกพร้อมกัน (shader วนเฉพาะช่องที่ใช้)
function airGust(x,z,R,s,o){o=o||{};const sw=o.sw||0,dx=o.dx||0,dz=o.dz||0;if(!(Math.abs(s)>0.02||Math.abs(sw)>0.02||Math.hypot(dx,dz)>0.02))return;const G=AIR.G;
  const ng={x,z,R:Math.min(R,18),s:Math.max(-2,Math.min(s,2)),sw:Math.max(-2,Math.min(sw,2)),dx,dz,age:0,life:o.life||1.4,hold:!!o.hold,id:o.id};
  if(o.id!==undefined){const i=G.findIndex(g=>g.id===o.id);if(i>=0){G[i]=ng;return;}}
  if(G.length>=AIR_NG){let w=0;for(let i=1;i<G.length;i++)if(airGs(G[i])<airGs(G[w]))w=i;if(airGs(G[w])>airGs(ng))return;G.splice(w,1);}
  G.push(ng);}
function airGustOff(id){const G=AIR.G;for(let i=G.length-1;i>=0;i--)if(G[i].id===id)G[i].hold=false;}   // ปล่อยให้จางตามปกติ
function airEnv(g){return g.hold?1:Math.exp(-g.age*2.5);}
function airGs(g){return Math.max(Math.abs(g.s),Math.abs(g.sw),Math.hypot(g.dx,g.dz))*airEnv(g);}
// รอยไหม้ (k=1) / น้ำแข็ง (k=-1) บนหญ้า — ตอนนี้เป็นรอยถาวรทั้งแมตช์ (scarPaint ข้างล่าง) • life ไม่ใช้แล้ว
function airMark(x,z,r,k,life){scarPaint(x,z,Math.min(r,10),k>0?'burn':'frost',0.45);}
// ลม ณ จุด (สำหรับ CPU: ผ้าคลุม) — สูตรเดียวกับใน shader หญ้าแบบย่อ → {x,z}
// ลมประจำแผนที่: ทิศคงที่ตามชื่อแผนที่ (ทุกเครื่องเห็นเหมือนกัน)
function airForMap(){const a=(hashStr(MAPID)%628)/100;AIR.dir.set(Math.cos(a),Math.sin(a));AIR.str=AIR_MAP[MAPID]!==undefined?AIR_MAP[MAPID]:0.35;}
const _airV={x:0,z:0};
function airAt(x,z){
  const ph=(x*AIR.dir.x+z*AIR.dir.y)*0.25-AIR.t*1.6,w=0.6+0.4*Math.sin(ph)+0.2*Math.sin(ph*2.3+x*0.7);
  let vx=AIR.dir.x*AIR.str*w,vz=AIR.dir.y*AIR.str*w;
  for(const g of AIR.G){const dx=x-g.x,dz=z-g.z,L=Math.hypot(dx,dz),r=g.R*Math.min(1,g.age/0.18+0.25);if(L>r)continue;const k=1-L/r,f=airGv(g)*k/(L+0.2),e=airEnv(g)*k;vx+=dx*f-dz*g.sw*e/(L+0.2)+g.dx*e;vz+=dz*f+dx*g.sw*e/(L+0.2)+g.dz*e;}
  _airV.x=vx;_airV.z=vz;return _airV;}
// แรงกระโชกตามเวลา: พุ่งออก แล้วเด้งกลับนิดหน่อย (หญ้าโยกกลับ)
function airGv(g){return g.s*airEnv(g)*(g.hold?1:Math.cos(Math.min(g.age*5,3.6)));}
function airTick(dt){AIR.t+=dt;
  for(let i=AIR.G.length-1;i>=0;i--){const g=AIR.G[i];g.age+=dt;if(g.age>g.life&&!g.hold)AIR.G.splice(i,1);else if(g.hold&&g.age>12)g.hold=false;}   // hold นานสุด 12 วิ (กันค้างถ้าไม่มี event จบ)
  for(let i=AIR.M.length-1;i>=0;i--){const m=AIR.M[i];m.age+=dt;if(m.age>m.life)AIR.M.splice(i,1);}}
// ----- ต่อเข้ากับเอฟเฟกต์เดิม (ไม่ต้องแก้ทุกสกิล): แสงวาบ = ลมกระโชก • วงคลื่นบนพื้น = ลมกระโชกกว้าง -----
{const fl=FX.flashLight;FX.flashLight=function(x,y,h,col,int,dist,life){
  try{if(h-GY(x,y)<5&&int>=2.5)airGust(tx(x),tz(y),Math.max(2,dist*0.3),Math.min(1.6,(int-1.5)*0.16));}catch(e){}
  return fl.apply(this,arguments);};}
SHAPES_Q.push=function(...a){
  try{for(const s of a){if(!s)continue;
    if(s.k==='ring'&&(s.h===undefined||s.h<1.5)&&s.s1>1.2)airGust(tx(s.x),tz(s.y),s.s1*1.25,Math.min(1.2,0.25+s.s1*0.06));}}catch(e){}   // รอยไหม้/น้ำแข็ง/ราบ = grassScar จาก bfAfter (js/44) ตามธาตุ
  return Array.prototype.push.apply(this,a);};
// ผ้าคลุมของเรา: แรงลม (หน่วย/วิ²) ณ ตัวเรา — js/49 clStep บวกเข้าไป
const CLW={x:0,z:0,K:9};

// ---------- หญ้า ----------
// DENS = ใบต่อตร.หน่วย • S = ขนาดผืนหญ้ารอบกล้อง (หน่วย 3D) ตามระดับกราฟิก • H = ความสูงใบ • MAXN = จำนวนสูงสุด
const GRASS={ON:true,DENS:70,H:0.32,W:0.034,MAXN:160000,CAP:160000,gustK:1.8,pushK:2.2,S:{high:46,auto:36,auto1:28},mesh:null,key:'',cache:new Map(),tex:null,box:null,bakeMs:0,n:0,trail:[],trLast:new WeakMap()};
// ---------- รอยสนามรบบนหญ้า + พื้น (อยู่ทั้งแมตช์ — designs/battlefield.md ขั้น 3) ----------
// ภาพรอยขนาดเท่าแผนที่ (RES ช่อง/หน่วย): R = ไหม้ • G = น้ำแข็ง • B = ราบ/หาย • A = ทิศที่ล้ม (0..1 = 0..2π)
// ล้างเมื่อเข้าหน้าเกม (แมตช์ใหม่ — setScreen js/19) / เปลี่ยนแผนที่ • ทุกเครื่องทาที่จุดเดียวกัน (มาจาก event ของโฮสต์) • ภาพล้วน ไม่แตะโปรโตคอล
const SCAR={RES:2,w:0,h:0,D:null,tex:null,dirty:false,key:'',clearNext:true,empty:null,U:{uScar:{value:null},uScarMap:{value:new THREE.Vector4(0,0,1,1)},uGrLo:{value:0},uFire:{value:null}}};
SCAR.empty=new THREE.DataTexture(new Uint8Array(4),1,1);SCAR.empty.needsUpdate=true;SCAR.U.uScar.value=SCAR.empty;SCAR.U.uFire.value=SCAR.empty;
function scarReset(){const b=GRASS.box;if(!b)return;
  const w=Math.min(1024,Math.max(8,Math.round(b[2]*SCAR.RES))),h=Math.min(1024,Math.max(8,Math.round(-b[3]*SCAR.RES)));
  if(!SCAR.tex||SCAR.w!==w||SCAR.h!==h){if(SCAR.tex)SCAR.tex.dispose();SCAR.w=w;SCAR.h=h;SCAR.D=new Uint8Array(w*h*4);
    SCAR.tex=new THREE.DataTexture(SCAR.D,w,h,THREE.RGBAFormat);SCAR.tex.magFilter=SCAR.tex.minFilter=THREE.LinearFilter;}
  else SCAR.D.fill(0);
  SCAR.tex.needsUpdate=true;SCAR.U.uScar.value=SCAR.tex;SCAR.U.uScarMap.value.set(...b);SCAR.dirty=false;fireReset();}
// ทารอย ณ จุด (หน่วย 3D) • kind: 'burn' | 'frost' | 'flat' (ล้ม → สูงมาก = หญ้าหาย) • r = รัศมี (หน่วย) • a = ความแรง 0..1 (ทาซ้ำ = เข้มขึ้นจนเต็ม)
function scarPaint(X,Z,r,kind,a){if(!SCAR.D||!(r>0)||!(a>0))return;
  const b=SCAR.U.uScarMap.value,w=SCAR.w,h=SCAR.h,D=SCAR.D,ch=kind==='burn'?0:kind==='frost'?1:2;
  const cu=(X-b.x)/b.z*w,cv=(Z-b.y)/b.w*h,rp=r*SCAR.RES,sd=Math.random()*6.283;
  const i0=Math.max(0,Math.floor(cu-rp)),i1=Math.min(w-1,Math.ceil(cu+rp)),j0=Math.max(0,Math.floor(cv-rp)),j1=Math.min(h-1,Math.ceil(cv+rp));
  if(i0>i1||j0>j1)return;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
    const dx=i+0.5-cu,dy=j+0.5-cv,dd=Math.hypot(dx,dy),an=Math.atan2(dy,dx);
    const rr=rp*(0.82+0.12*Math.sin(an*3+sd)+0.07*Math.sin(an*7+sd*2));   // ขอบรอยไม่กลมเป๊ะ
    if(dd>=rr)continue;
    const e=Math.max(0,(dd-rr*0.4)/(rr*0.6)),k=(1-e*e*(3-2*e))*a,p=(j*w+i)*4,o=D[p+ch],nv=o+(255-o)*k;
    D[p+ch]=nv;
    if(ch===0)D[p+1]*=1-k;   // ไฟละลายน้ำแข็ง
    if(ch===2&&k*255>o*0.5)D[p+3]=Math.round(((Math.atan2(dy/h*b.w,dx/w*b.z)/6.2832)+1)%1*255);}   // ทิศล้ม = ออกจากจุดระเบิด
  SCAR.dirty=true;}
// รอยจากสกิล (เรียกจาก bfAfter js/44 ตามธาตุ + ขนาด s 0.45–1.8) • x,y = พิกัดเกม
function grassScar(x,y,el,s){const X=tx(x),Z=tz(y),r=0.8+2.1*s;
  if(el==='fire'){scarPaint(X,Z,r,'burn',Math.min(1,0.4+0.35*s));fireIgnite(X,Z,r);if(s>=1.2)scarPaint(X,Z,r*0.5,'flat',0.55);}
  else if(el==='storm')scarPaint(X,Z,r*0.75,'burn',0.3+0.2*s);
  else if(el==='ice')scarPaint(X,Z,r*1.1,'frost',Math.min(1,0.45+0.3*s));
  else if(el==='earth'){scarPaint(X,Z,r,'flat',Math.min(1,0.4+0.35*s));if(s>=1)scarPaint(X,Z,r*0.45,'flat',0.7);}}
// ---------- ไฟลามหญ้า (ภาพล้วน: ไม่มีดาเมจ ไม่ซิงก์ — แต่ละเครื่องลามไม่เหมือนกันเป๊ะได้) ----------
// ตารางเดียวกับ SCAR (RES ช่อง/หน่วย) • fuel = ความหนาแน่นหญ้าจากภาพถ่ายแผนที่ (คอนกรีต/หลังคา/ในบ้าน = 0 → เป็นแนวกันไฟ)
// สกิลไฟ (grassScar) จุดไฟรอบรอยกระแทก → ช่องที่ไหม้จุดช่องข้าง ๆ (ตามลมลามเร็วกว่า ทวนลมช้ามาก) • ไหม้ดำ = SCAR.R • เรือง = FIRE.tex (R = ความร้อน 0..1)
// ช่องหนึ่ง: 0 ยังไม่ไหม้ → 1 ไหม้ (FIRE.burn วิ) → 2 ถ่านคุ (FIRE.ember วิ) → 3 ดับ (ไม่ไหม้ซ้ำ) • สร้างตอนไฟแรกของแมตช์ (ล้างพร้อม SCAR)
// ปรับ: spread = ความเร็วลาม • burn = ช่องหนึ่งไหม้นานกี่วิ • max = เพดานช่องที่ไหม้พร้อมกัน (กันเฟรมตก)
// on = สวิตช์หลัก: ปิดไว้ก่อน (ผู้ใช้ 2026-11-07 ขอเอาออกชั่วคราว เผื่อใช้อีก) • เปิดได้ด้วย ?firespread หรือ tune key gfx.fire.on = 1 • ปิด = ไฟไม่ลาม/ไม่เรือง (รอยไหม้ดำจาก grassScar ยังอยู่ตามเดิม)
const FIRE={on:/[?&]firespread\b/.test(location.search),w:0,h:0,fuel:null,st:null,age:null,dur:null,D:null,tex:null,list:[],nw:[],acc:0,dirty:false,max:5000,burn:2.6,ember:3.2,spread:0.35,
  OFF:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1],[2,0],[-2,0],[0,2],[0,-2]],rate:new Float32Array(12)};
// เรืองบนพื้น (ถ่านคุ) — ต่อท้าย emissivemap_fragment ของวัสดุพื้น (grLive)
const GR_FIRE='{float fh=texture2D(uFire,(vGW.xz-uScarMap.xy)/uScarMap.zw).r*smoothstep(0.5,0.85,vGU);fh*=0.55+0.9*grN(vGW.xz*2.1+7.7);'+
  'totalEmissiveRadiance+=mix(vec3(1.3,0.3,0.04),vec3(2.0,0.9,0.25),smoothstep(0.6,1.0,fh))*fh*fh*0.9;}';
function fireReset(){if(FIRE.tex){FIRE.tex.dispose();FIRE.tex=null;}
  FIRE.fuel=FIRE.st=FIRE.age=FIRE.dur=FIRE.D=null;FIRE.list.length=0;FIRE.nw.length=0;FIRE.acc=0;FIRE.dirty=false;SCAR.U.uFire.value=SCAR.empty;}
function fireBuild(){
  const T=GRASS.tex,im=T&&T.image;if(!im||!im.data||!SCAR.D||!SCAR.tex)return false;
  const w=SCAR.w,h=SCAR.h,gw=im.width,gh=im.height,G=im.data,N=w*h,fu=new Uint8Array(N);
  for(let j=0;j<h;j++){const r=Math.min(gh-1,((j+0.5)/h*gh)|0)*gw;for(let i=0;i<w;i++){const a=G[(r+Math.min(gw-1,((i+0.5)/w*gw)|0))*4+3];fu[j*w+i]=a>40?a:0;}}
  FIRE.w=w;FIRE.h=h;FIRE.fuel=fu;FIRE.st=new Uint8Array(N);FIRE.age=new Float32Array(N);FIRE.dur=new Float32Array(N);FIRE.D=new Uint8Array(N*4);
  FIRE.tex=new THREE.DataTexture(FIRE.D,w,h,THREE.RGBAFormat);FIRE.tex.magFilter=FIRE.tex.minFilter=THREE.LinearFilter;FIRE.tex.needsUpdate=true;
  SCAR.U.uFire.value=FIRE.tex;FIRE.list.length=0;FIRE.acc=0;return true;}
function fireLight(k,a0){FIRE.st[k]=1;FIRE.age[k]=a0;FIRE.dur[k]=FIRE.burn*(0.75+0.5*Math.random())*(0.6+0.4*FIRE.fuel[k]/255);}
// จุดไฟรอบรอยกระแทก (X,Z = หน่วย 3D, r = รัศมี) — เรียกจาก grassScar
function fireIgnite(X,Z,r){
  if(!FIRE.on)return;
  if(!SCAR.D||GRASS.n<=20||!grassCount()[0])return;
  if(!FIRE.fuel&&!fireBuild())return;
  const b=SCAR.U.uScarMap.value,w=FIRE.w,h=FIRE.h,fu=FIRE.fuel,st=FIRE.st,S=SCAR.D,L=FIRE.list;
  const cu=(X-b.x)/b.z*w,cv=(Z-b.y)/b.w*h,rp=r*SCAR.RES;
  const i0=Math.max(0,Math.floor(cu-rp)),i1=Math.min(w-1,Math.ceil(cu+rp)),j0=Math.max(0,Math.floor(cv-rp)),j1=Math.min(h-1,Math.ceil(cv+rp));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
    const dd=Math.hypot(i+0.5-cu,j+0.5-cv);if(dd>=rp)continue;
    const k=j*w+i;if(!fu[k]||st[k]||S[k*4+2]>180||L.length>=FIRE.max)continue;   // ไม่มีหญ้า / ไหม้แล้ว / หญ้าถูกระเบิดหาย
    if(Math.random()<0.3+0.6*(1-dd/rp)){fireLight(k,-Math.random()*0.5);L.push(k);}}}
// เปลว + ถ่านลอย + ควัน ณ จุดที่กำลังไหม้ (ใช้ระบบอนุภาคเดิม)
function fireFx(X,Z){
  const gx=X*20+MW/2,gy=Z*20+MH/2,wv=AIR.str*25,vx=AIR.dir.x*wv,vy=AIR.dir.y*wv,q=Math.random();
  flame(gx,gy,0.05,{vh:rnd(0.7,1.5),vx:vx+rnd(-6,6),vy:vy+rnd(-6,6),life:rnd(0.35,0.6),size:rnd(5,9)});
  if(q<0.3){const l=rnd(0.8,1.6);PARTS.push({x:gx,y:gy,h:0.25,vx:vx*2+rnd(-14,14),vy:vy*2+rnd(-14,14),vh:rnd(1.2,3),life:l,max:l,col:'#ff9a3a',size:1.7,g:1.3,drag:1.2});}
  else if(q>0.8)smoke(gx,gy,0.5,1,'#2b2724',rnd(1.3,2.0),7,12);}
function fireStep(dt){
  const w=FIRE.w,h=FIRE.h,st=FIRE.st,age=FIRE.age,dur=FIRE.dur,fu=FIRE.fuel,D=FIRE.D,S=SCAR.D,L=FIRE.list,NW=FIRE.nw,OFF=FIRE.OFF,R=FIRE.rate;
  const b=SCAR.U.uScarMap.value,cx=b.z/w,cz=-b.w/h,E=FIRE.ember,cp=cam.position,wx=AIR.dir.x,wz=AIR.dir.y,ws=AIR.str;
  // โอกาสจุดช่องข้าง ๆ ต่อก้าว (ไกลลดลง • ลมพัดไปทางนั้นแรงขึ้น ทวนลมเกือบไม่ลาม)
  for(let o=0;o<12;o++){const di=OFF[o][0],dj=OFF[o][1],ln=Math.hypot(di,dj),dot=(di*cx*wx-dj*cz*wz)/Math.hypot(di*cx,dj*cz);
    R[o]=1-Math.exp(-FIRE.spread/ln*Math.max(0.2,1+2.2*ws*dot)*dt);}
  const nL=L.length,pf=Math.min(0.5,10/(nL+1)),room=FIRE.max-nL,okFx=PARTS.length<VFXB.cap*0.7;let nF=0,w2=0;NW.length=0;
  for(let n=0;n<nL;n++){
    const k=L[n],a=age[k]+dt,p=k*4,T=dur[k];age[k]=a;let ht;
    if(a<0)ht=0;else if(a<0.3)ht=a/0.3;else if(a<T)ht=1;
    else if(a<T+E){ht=0.5*Math.pow(1-(a-T)/E,1.4);st[k]=2;}
    else{st[k]=3;D[p]=0;continue;}   // ดับ → ออกจากรายการ
    D[p]=ht*255;
    if(a>0&&a<T){const sv=Math.min(255,a/(T*0.85)*255);if(S[p]<sv){S[p]=sv;SCAR.dirty=true;}if(S[p+1]){S[p+1]=0;SCAR.dirty=true;}}   // ไหม้ดำค่อย ๆ เข้ม + ละลายน้ำแข็ง
    L[w2++]=k;
    if(st[k]!==1||a<0.25)continue;
    const j=(k/w)|0,i=k-j*w;
    for(let o=0;o<12;o++){const ni=i+OFF[o][0],nj=j+OFF[o][1];if(ni<0||nj<0||ni>=w||nj>=h)continue;
      const nk=nj*w+ni;if(st[nk]||!fu[nk]||S[nk*4+2]>180||room<=NW.length)continue;
      if(Math.random()*255<R[o]*fu[nk]){fireLight(nk,0);NW.push(nk);}}
    if(okFx&&nF<12&&a>0.3&&Math.random()<pf){
      const X=b.x+(i+0.5)/w*b.z+(Math.random()-0.5)*cx,Z=b.y+(j+0.5)/h*b.w+(Math.random()-0.5)*cz,dx=X-cp.x,dz=Z-cp.z;
      if(dx*dx+dz*dz<2500){fireFx(X,Z);nF++;}}}   // เปลว/ควันเฉพาะรัศมี 50 หน่วยรอบกล้อง
  L.length=w2;for(let n=0;n<NW.length;n++)L.push(NW[n]);FIRE.dirty=true;}
function fireTick(dt){
  if(FIRE.list.length){FIRE.acc+=Math.min(dt,0.1);const H=1/12;let n=0;
    while(FIRE.acc>=H&&n<2){FIRE.acc-=H;n++;fireStep(H);}
    if(FIRE.acc>H)FIRE.acc=0;}
  if(FIRE.dirty&&FIRE.tex){FIRE.tex.needsUpdate=true;FIRE.dirty=false;}}
// ---------- พื้นหญ้ามีชีวิต: สีเป็นหย่อม (เขียวเข้ม / แห้งเหลือง / ดินโผล่) + จุดเล็ก ๆ + รอยถาวรบนพื้น (ไหม้ดำ / น้ำแข็งขาว / ดินแตก) ----------
// ใช้กับวัสดุพื้นหญ้าใน js/28 (grLive(mat)) • พิกัดโลกล้วน ไม่มีลายซ้ำ • ตอนถ่ายแผนที่ (grassBake) ก็ใส่ด้วย → ใบหญ้าได้สีตามหย่อมด้วย
// noise = อ่านจากภาพ 128² ที่ต่อกันไร้รอยต่อ (1 หน่วยของ p = 1 ช่องตาราง) — ถูกกว่าคำนวณ sin ทุกพิกเซลมาก (เคยกิน ~0.6 ms)
const GR_NOISE='uniform sampler2D uGrNz;uniform float uGrLo;float grN(vec2 p){return texture2D(uGrNz,p*0.0625).r;}\n';
SCAR.U.uGrNz={value:(()=>{const N=128,G=16,C=N/G,R=mulberry(4242),L=Array.from({length:G*G},()=>R()),D=new Uint8Array(N*N*4),sm=t=>t*t*(3-2*t);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const gx=i/C,gy=j/C,x0=Math.floor(gx),y0=Math.floor(gy),fx=sm(gx-x0),fy=sm(gy-y0),v=(a,b)=>L[(b%G)*G+(a%G)];
    const n=(v(x0,y0)*(1-fx)+v(x0+1,y0)*fx)*(1-fy)+(v(x0,y0+1)*(1-fx)+v(x0+1,y0+1)*fx)*fy,p=(j*N+i)*4;D[p]=D[p+1]=D[p+2]=Math.round(n*255);D[p+3]=255;}
  const t=new THREE.DataTexture(D,N,N,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;})()};
const GR_LIVE='{vec2 q=vGW.xz;float n1=grN(q*0.031)*0.62+grN(q*0.083+5.1)*0.38,n2=grN(q*0.23+9.7),n3=grN(q*1.15+3.3),n4=grN(q*3.7+1.7);'+
  'float sk=grN(vec2(q.x*5.0+q.y*1.3,q.y*1.6-q.x*0.6)+4.4);'+                        // ลายเส้นหญ้าเล็ก ๆ (ยืดตามแนวหนึ่ง)
  'vec3 c=diffuseColor.rgb;float L=dot(c,vec3(0.3,0.59,0.11)),up=smoothstep(0.55,0.85,vGU),gk=clamp((c.g-max(c.r,c.b))/max(c.g,0.001)*4.0-0.15,0.0,1.0)*up;'+   // gk = ความเขียว × หันขึ้นฟ้า (เส้นสนาม/ทางเดิน/หน้าผาไม่โดน)
  'if(uGrLo<0.5){'+   // กราฟิกต่ำ: ข้ามลวดลาย (เหลือแต่รอยสนามรบ)
  'c*=1.0+(n1-0.5)*0.3*gk;'+                                                         // สว่าง/มืดเป็นผืนใหญ่
  'c=mix(c,c*vec3(0.7,0.97,0.66),smoothstep(0.45,0.18,n1)*0.8*gk);'+                  // หย่อมเขียวเข้มชุ่ม
  'c=mix(c,L*vec3(1.55,1.35,0.6),smoothstep(0.56,0.84,n1)*0.75*gk);'+                 // หย่อมแห้งออกทอง
  'c*=1.0+(n2-0.5)*0.28*gk;'+                                                        // ด่างกลาง ๆ
  'c=mix(c,c*vec3(0.62,0.9,0.75),smoothstep(0.62,0.72,grN(q*0.55+2.2))*smoothstep(0.35,0.6,n3)*0.6*gk);'+   // กอโคลเวอร์ (เขียวอมฟ้า)
  'c=mix(c,L*vec3(1.3,0.92,0.58)*0.8,smoothstep(0.66,0.8,n2*0.55+n3*0.45)*0.75*gk);'+  // ดินโผล่เป็นจุด
  'c*=1.0+((sk-0.5)*0.22+(n4-0.5)*0.12)*gk+((n2-0.5)*0.24+(n4-0.5)*0.14)*up*(1.0-gk);'+   // ลายเล็ก (ดิน/พื้นป่าก็ด่างนิด ๆ)
  'vec2 pc=floor(q*1.6),pf=fract(q*1.6)-0.5,ph=fract(sin(vec2(dot(pc,vec2(41.3,17.1)),dot(pc,vec2(13.7,59.9))))*43758.5453);'+
  'c=mix(c,vec3(L*1.1+0.08)*vec3(0.95,0.92,0.85),step(0.93,ph.x)*(1.0-smoothstep(0.07,0.11,length(pf-(ph-0.5)*0.5)))*0.8*up);}'+   // ก้อนกรวดเล็ก ๆ
  'vec4 sc=texture2D(uScar,(q-uScarMap.xy)/uScarMap.zw)*up;sc.r*=0.75+0.45*n3;sc.g*=0.6+0.5*n4+0.2*sk;sc.b*=0.8+0.35*n3;'+   // ขอบ/เนื้อรอยไม่เรียบเป็นสีทา
  'c=mix(c,L*vec3(1.2,0.85,0.55)*0.75,smoothstep(0.25,0.85,sc.b)*0.85);'+            // ระเบิด/หิน = ดินแตก
  'c=mix(c,c*vec3(0.62,0.45,0.3),smoothstep(0.02,0.35,sc.r));c=mix(c,vec3(0.028,0.024,0.02),smoothstep(0.3,0.95,sc.r));'+   // ไหม้: ขอบน้ำตาล กลางดำ
  'c=mix(c,mix(c*vec3(0.75,0.95,1.15),vec3(0.72,0.82,0.92),0.7),smoothstep(0.05,0.85,sc.g)*0.85);'+   // น้ำแข็ง: เกล็ดขาวฟ้า (ยังเห็นพื้นเดิมนิด ๆ)
  'diffuseColor.rgb=c;}';
function grLive(m){m.userData.grLive=true;
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,SCAR.U);
    sh.vertexShader='varying vec3 vGW;varying float vGU;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvGW=(modelMatrix*vec4(transformed,1.0)).xyz;vGU=normalize(mat3(modelMatrix)*normal).y;');
    sh.fragmentShader='varying vec3 vGW;varying float vGU;uniform sampler2D uScar;uniform vec4 uScarMap;uniform sampler2D uFire;\n'+GR_NOISE+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+GR_LIVE)   // หลังสีจุดยอด (แผนที่จากไฟล์ใช้สีจุดยอด)
      .replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nnormal=normalize(mix(normal,(viewMatrix*vec4(0.0,1.0,0.0,0.0)).xyz,0.45*smoothstep(0.5,0.9,vGU)));')
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n'+GR_FIRE);};   // เหลี่ยมพื้นนุ่มลง (เนินดูโค้ง)
  m.customProgramCacheKey=()=>'grlive4';
  return m;}
const GR_GLSL_V='uniform vec4 uGrMap;uniform sampler2D uGround;uniform vec3 uGrCam;uniform vec4 uWind;uniform vec2 uGrK;uniform vec4 uGust[12];uniform vec4 uGustB[12];uniform vec4 uPush[16];uniform sampler2D uScar;uniform float uGrH;uniform float uGrW;uniform sampler2D uGroundH;uniform vec3 uSun;uniform vec3 uGrN;uniform sampler2D uFire;uniform vec4 uGrPt;uniform vec2 uGrCl;'+
  'attribute vec4 aOff;varying vec3 vGC;varying vec2 vMk;varying float vTr;varying vec4 vFl;varying vec2 vHu;varying float vFi;\n'+
  'vec2 grH2(vec2 c){return fract(sin(vec2(dot(c,vec2(127.1,311.7)),dot(c,vec2(269.5,183.3))))*43758.5453);}\n';
// ใบหญ้า (ทำในการ์ดจอทั้งหมด): ขึ้นเป็นกอ (ดึงเข้าหาจุดกลางกอทุก ~0.9 หน่วย) • 3 แบบปนกัน (ปกติ / ยาวเรียว / สั้นกว้าง) + ดอกไม้เล็ก ~3%
// โคนเข้ม → ปลายอ่อนออกเหลือง • ใบโค้งออกจากกลางกอ • ลมเป็นคลื่นใหญ่วิ่งผ่านทุ่ง (ยอดคลื่นใบสว่างขึ้น) • ย้อนแสง = แสงทะลุใบ (vTr)
const GR_BEGIN=
  'vec3 transformed;{'+
  'float S=uGrCam.z;vec2 c=uGrCam.xy;vec2 wp=c+(fract(aOff.xy-c/S+0.5)-0.5)*S;'+
  'float r1=fract(aOff.w*7.31),r2=fract(aOff.w*3.7),r3=fract(aOff.w*13.13),r4=fract(aOff.w*29.71);'+
  // กอหญ้า: ใบในช่องเดียวกันถูกดึงเข้าหาจุดกลางกอ (ระหว่างกอเห็นพื้นนิด ๆ)
  'vec2 wo=vec2(sin(wp.y*0.83+sin(wp.x*0.37)*2.0),sin(wp.x*0.71+sin(wp.y*0.43)*2.0))*uGrCl.x;vec2 wq=wp+wo;'+   // uGrCl (ลุคภาพวาด js/77): x = บิดตารางกอให้ไม่เป็นแถวตรง • y = แรงดึงเข้ากลางกอ (เดิม 0.78)
  'vec2 ci=floor(wq/0.9);vec2 ch=grH2(ci);vec2 cc=(ci+0.2+0.6*ch)*0.9-wo;vec2 tc=(wp-cc)*uGrCl.y;wp=cc+tc;float cd=length(tc);'+
  'vec2 muv=(wp-uGrMap.xy)/uGrMap.zw;vec4 gm=texture2D(uGround,muv);'+
  'float ok=step(0.0,muv.x)*step(muv.x,1.0)*step(0.0,muv.y)*step(muv.y,1.0)*step(aOff.z,gm.a*1.15-0.15);'+
  'float d=length(wp-c);float fade=1.0-smoothstep(S*0.3,S*0.48,d);'+
  // ใบที่ไม่ขึ้น (นอกผืน/ไม่มีหญ้า) = ยุบเป็นจุดเดียว ข้ามลูปลม/รอยทั้งหมด (ประหยัดการ์ดจอ)
  'if(ok*fade<0.001){transformed=vec3(wp.x,-1000.0,wp.y);vGC=vec3(0.0);vMk=vec2(0.0);vTr=0.0;vFl=vec4(0.0);vHu=vec2(0.0);vFi=0.0;}else{'+
  // รอยสนามรบ (ภาพเดียวกับพื้น ขนาดเท่าแผนที่): ไหม้ / น้ำแข็ง / ราบ-หาย + ทิศล้ม
  'vec4 sc=texture2D(uScar,muv);float bu=sc.r,fr=sc.g,fb=sc.b,fa=sc.a*6.2832;vMk=vec2(bu,fr);'+
  'float cl=0.5+0.25*sin(wp.x*0.43+sin(wp.y*0.31)*2.0)+0.25*sin(wp.y*0.57+sin(wp.x*0.23)*2.0);'+   // หย่อมใหญ่สูง/เตี้ย
  // แบบใบ: ปกติ 62% • ยาวเรียว 23% • สั้นกว้าง 13% • ดอกไม้ ~2% (เฉพาะตรงที่หญ้าหนา)
  'float fl=step(0.991,r3)*step(0.45,gm.a);'+
  'float tw=r3<0.62?1.0:(r3<0.85?0.62:1.5);float th=r3<0.62?1.0:(r3<0.85?1.32:0.6);'+
  'float hgt=uGrH*(0.55+0.6*r1)*mix(th*(0.7+0.6*ch.x)*(1.0-0.3*smoothstep(0.0,0.45,cd)),1.05+0.3*r1,fl)*(0.5+0.85*cl)*fade*ok*(1.0-0.55*bu)*(1.0-smoothstep(0.62,0.92,fb));'+
  // ลม: คลื่นใหญ่วิ่งตามทิศลม (band) + คลื่นเล็ก + สั่นเล็กน้อย + กระโชก + ตัวละครแหวก
  'vec2 wd=uWind.xy;float ph=dot(wp,wd)*0.25-uWind.w*1.6;'+
  'float band=smoothstep(-0.1,1.0,sin(dot(wp,wd)*0.24-uWind.w*1.25+sin(dot(wp,vec2(-wd.y,wd.x))*0.11)*1.8));'+
  'vec2 v=wd*uWind.z*(0.4+0.3*sin(ph)+0.15*sin(ph*2.3+wp.x*0.7)+1.0*band);'+
  'v+=vec2(sin(uWind.w*3.1+wp.y*1.7+wp.x),cos(uWind.w*2.7+wp.x*1.3+aOff.w*6.0))*0.07*(uWind.z+0.15);'+
  'for(int i=0;i<12;i++){if(float(i)>=uGrN.x)break;vec4 g=uGust[i];vec4 gb=uGustB[i];vec2 dd=wp-g.xy;float L=length(dd);float fl2=1.0-smoothstep(g.z*0.6,g.z,L);v+=(dd/(L+0.2)*g.w*fl2+(vec2(-dd.y,dd.x)/(L+0.2)*gb.x+gb.yz)*fl2)*uGrK.x;}'+   // ระเบิด/ดูด (g.w) + หมุนวน (gb.x) + ดันทางเดียว (gb.yz)
  'float trm=0.0;for(int i=0;i<16;i++){if(float(i)>=uGrN.y)break;vec4 q=uPush[i];vec2 dd=wp-q.xy;float L=length(dd);v+=dd/(L+0.05)*q.w*(1.0-smoothstep(q.z*0.35,q.z,L))*uGrK.y;trm=max(trm,q.w*(1.0-smoothstep(q.z*0.15,q.z*0.8,L)));}hgt*=1.0-0.4*trm;'+   // trm = ถูกเหยียบ/แหวก → หญ้าเตี้ยลงใต้ตัวละคร
  'v*=(1.0-0.8*fr)*(1.0-0.5*bu);v=mix(v,vec2(cos(fa),sin(fa))*1.7,smoothstep(0.12,0.5,fb));'+   // น้ำแข็ง = แข็งไม่ไหว • ไหม้ = ห้อย • ราบ = ล้มออกจากจุดระเบิด
  // ทรงใบ: โค้งไปด้านหน้าใบ (หันออกจากกลางกอ) + เอนออกจากกลางกอ
  'float a=aOff.w*6.2832;vec2 sd=vec2(cos(a),sin(a));vec2 fw=vec2(-sd.y,sd.x);if(dot(fw,tc)<0.0)fw=-fw;'+
  'vec2 bv=v+(fw*(0.15+0.45*r2)+tc*0.4)*(1.0-0.8*fl);float bl=length(bv);if(bl>2.3){bv*=2.3/bl;bl=2.3;}'+
  'float t=position.y,isH=fl*step(0.3,t),tt=mix(t,step(0.3,t),fl);'+
  // หัวดอก = ห้าเหลี่ยม (จุด 2-6) หันหากล้อง เอนไปด้านหลังนิด ๆ — มองจากบนหรือข้างก็เห็นเป็นดอกกลม
  'float R=0.075+0.03*r4;vec2 fwc=normalize(cameraPosition.xz-wp+0.0001);vec3 vax=normalize(vec3(-fwc.x*0.55,0.85,-fwc.y*0.55));'+
  'vHu=vec2(position.x*(t<0.5?0.3:1.92),t<0.5?-0.8:(t<0.9?0.15:1.0));vec3 hq=(vec3(-fwc.y,0.0,fwc.x)*vHu.x+vax*vHu.y)*R;'+
  'vec3 p=vec3(0.0);p.xz=sd*position.x*uGrW*mix(tw,0.4,fl)*(1.0-isH);'+
  'p.xz+=bv*(tt*tt)*hgt*0.9;p.y=tt*hgt*(1.0-0.55*bl*bl/(1.0+bl*bl));p+=hq*isH;'+
  'transformed=vec3(wp.x,texture2D(uGroundH,muv).r,wp.y)+p;'+
  // สี: บางกอแห้งออกเหลือง • โคนเข้ม → ปลายอ่อน • ยอดคลื่นลมสว่าง • ดอกไม้ 4 สี (ก้านเขียว สีดอกเฉพาะหัว ใน fragment; แผนที่มืดดอกหม่นลง)
  'vec3 base=gm.rgb*uGrPt.rgb;base=mix(base,vec3(dot(base,vec3(0.4,0.5,0.1)))*vec3(1.3,1.15,0.55),0.4*step(0.8,ch.y));'+
  'vec3 col=mix(base*mix(vec3(0.3,0.36,0.4),vec3(0.7,0.8,0.62),uGrPt.a),base*vec3(1.25,1.2,0.85)+vec3(0.02,0.022,0.0),pow(tt,0.8))*(0.88+0.24*r2)*(0.9+0.55*band*tt);'+
  'col*=mix(vec3(1.0),mix(vec3(0.8,1.0,1.14),vec3(1.2,1.07,0.76),ch.x),uGrPt.a);col+=base*vec3(0.38,0.36,0.1)*smoothstep(0.6,1.0,tt)*uGrPt.a;'+   // ลุคภาพวาด: แต่ละกอสีต่างกัน (อมฟ้า ↔ อมเหลือง) + ปลายใบสว่าง
  'vec3 fc=r4<0.3?vec3(0.92,0.9,0.82):(r4<0.55?vec3(1.0,0.8,0.22):(r4<0.8?vec3(0.92,0.48,0.78):vec3(0.58,0.68,1.0)));'+
  // ไหม้: แห้งน้ำตาล → ดำ (ปลายยังมีถ่านน้ำตาลนิด ๆ) • น้ำแข็ง: ขาวฟ้า ปลายสว่าง
  'col=mix(col,mix(base*vec3(0.9,0.62,0.32),vec3(0.16,0.09,0.035)*tt,smoothstep(0.35,0.9,bu))*mix(0.35,1.0,tt),smoothstep(0.03,0.4,bu));'+
  'col=mix(col,vec3(0.72,0.84,0.96)*(0.7+0.35*tt),smoothstep(0.05,0.7,fr)*0.88);'+
  'vGC=col;vFl=vec4(fc*clamp(0.3+2.5*dot(gm.rgb,vec3(0.3,0.6,0.1)),0.3,0.8)*(1.0-bu),isH);'+
  'float hf=texture2D(uFire,muv).r;vFi=hf*(0.3+0.7*tt)*(1.0-isH)*(0.75+0.25*sin(uWind.w*14.0+aOff.w*60.0));'+
  'vec3 V=normalize(transformed-cameraPosition);vTr=(pow(max(dot(V,uSun),0.0),2.0)*1.3+0.08)*tt*tt*(1.0-isH);'+
  '}}';
function grassMat(){
  const m=new THREE.MeshLambertMaterial({side:THREE.DoubleSide});
  const U={uGrMap:{value:new THREE.Vector4(0,0,1,1)},uGround:{value:null},uGroundH:{value:null},uGrCam:{value:new THREE.Vector3(0,0,40)},uWind:{value:new THREE.Vector4(1,0,0.3,0)},
    uGust:{value:Array.from({length:AIR_NG},()=>new THREE.Vector4(0,0,1,0))},uGustB:{value:Array.from({length:AIR_NG},()=>new THREE.Vector4(0,0,0,0))},uPush:{value:Array.from({length:16},()=>new THREE.Vector4(0,0,1,0))},uScar:SCAR.U.uScar,uFire:SCAR.U.uFire,uGrK:{value:new THREE.Vector2(GRASS.gustK,GRASS.pushK)},uGrH:{value:GRASS.H},uGrW:{value:GRASS.W},
    uGrPt:{value:new THREE.Vector4(1,1,1,0)},uGrCl:{value:new THREE.Vector2(0,0.78)},uSun:{value:new THREE.Vector3(0,1,0)},uGrN:{value:new THREE.Vector3()},uSunC:{value:new THREE.Color(1,1,1)}};
  m.userData.U=U;
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader=GR_GLSL_V+sh.vertexShader
      .replace('#include <beginnormal_vertex>','float na=aOff.w*6.2832;vec3 objectNormal=normalize(vec3(-sin(na)*0.3,1.0,cos(na)*0.3));')
      .replace('#include <begin_vertex>',GR_BEGIN);
    sh.fragmentShader='varying vec3 vGC;varying vec2 vMk;varying float vTr;varying vec4 vFl;varying vec2 vHu;varying float vFi;uniform vec3 uSunC;\n'+sh.fragmentShader
      .replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nnormal=normalize(vNormal);')   // ด้านหลังใบไม่มืด (normal ชี้ขึ้นทั้งสองด้าน)
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );','vec2 hu=vHu-vec2(0.0,0.1);float hr=length(hu),pe=0.75+0.25*cos(5.0*atan(hu.y,hu.x));'+
        'vec3 fh=mix(vFl.rgb*(1.0-0.45*smoothstep(pe*0.75,pe,hr)),vec3(1.0,0.78,0.2)*vFl.rgb.g*1.1,1.0-smoothstep(0.22,0.32,hr));'+
        'vec3 gc=mix(vGC,fh,step(0.985,vFl.a));vec4 diffuseColor=vec4(gc,opacity);')
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=gc*vTr*uSunC*(1.0-vMk.x)*(1.0-vMk.y);\ntotalEmissiveRadiance+=mix(vec3(1.5,0.36,0.05),vec3(2.4,1.4,0.45),smoothstep(0.55,1.0,vFi))*vFi*vFi*1.3;');};   // แสงทะลุใบ
  m.customProgramCacheKey=()=>'grass6';
  return m;}
function grassBuild(){
  // ใบหญ้า: 7 จุด 3 ช่วง (โคนกว้าง → ปลายแหลม ใบโค้งได้นุ่ม) x = ซ้าย/ขวา (-1..1), y = 0 โคน → 1 ปลาย • ดอกไม้ใช้จุด 4-6 เป็นหัวดอก
  const g=new THREE.InstancedBufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,0, 1,0,0, -0.85,0.38,0, 0.85,0.38,0, -0.52,0.72,0, 0.52,0.72,0, 0,1,0],3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute([0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0],3));
  g.setIndex([0,1,2, 1,3,2, 2,3,4, 3,5,4, 4,5,6]);
  const N=GRASS.CAP,A=new Float32Array(N*4);
  // ลำดับกระจายสม่ำเสมอ (R2) → ใช้แค่ n ใบแรกก็ยังกระจายทั่วผืน
  for(let i=0;i<N;i++){A[i*4]=(0.5+i*0.7548776662)%1;A[i*4+1]=(0.5+i*0.5698402910)%1;const h=Math.sin(i*12.9898)*43758.5453;A[i*4+2]=h-Math.floor(h);const h2=Math.sin(i*78.233)*12543.13;A[i*4+3]=h2-Math.floor(h2);}
  g.setAttribute('aOff',new THREE.InstancedBufferAttribute(A,4));
  g.instanceCount=0;g.boundingSphere=new THREE.Sphere(new THREE.Vector3(),1e6);
  const m=new THREE.Mesh(g,grassMat());m.frustumCulled=false;m.receiveShadow=true;m.castShadow=false;m.renderOrder=-1;m.userData.keep=true;
  GRASS.mesh=m;scene.add(m);}
// ถ่ายแผนที่จากด้านบน: สีพื้นจริง (ไม่มีแสง) + ความสูงผิวบนสุด → ตรงไหน "เขียว" และไม่มีอะไรบัง = ปลูกหญ้า
const _grBasic=new WeakMap();
function grassBake(){
  const t0=performance.now();SCAR.U.uScar.value=SCAR.empty;
  const hx=MW*S3/2+4,hz=MH*S3/2+4,res=Math.min(1024,Math.max(128,Math.round(Math.max(hx,hz)*2/0.22)));
  const rw=Math.max(32,Math.round(res*hx/Math.max(hx,hz))),rh=Math.max(32,Math.round(res*hz/Math.max(hx,hz)));
  const oc=new THREE.OrthographicCamera(-hx,hx,hz,-hz,1,600);oc.position.set(0,300,0);oc.up.set(0,0,-1);oc.lookAt(0,0,0);oc.updateMatrixWorld();
  const hidden=[];for(const o of scene.children)if(o!==world&&o.visible){o.visible=false;hidden.push(o);}
  const swaps=[];world.traverse(o=>{if(!o.visible){return;}if(o.isSprite||o.isPoints||o.isLine){o.visible=false;hidden.push(o);return;}
    if(!o.isMesh)return;const ms=[].concat(o.material);if(ms.some(m=>m&&m.userData&&m.userData.noBake)){o.visible=false;hidden.push(o);return;}   // พุ่มใบ/ลำแสงของลุคภาพวาด (js/77) ไม่นับเป็นของบังหญ้า
    const nb=ms.map(m=>{let b=_grBasic.get(m);if(!b){b=new THREE.MeshBasicMaterial({color:m.color?m.color.clone():new THREE.Color(0),map:m.map||null,vertexColors:!!m.vertexColors,side:THREE.DoubleSide,transparent:!!m.transparent,opacity:m.opacity??1});if(m.userData&&m.userData.grLive)grLive(b);_grBasic.set(m,b);}return b;});
    swaps.push([o,o.material]);o.material=Array.isArray(o.material)?nb:nb[0];});
  const fog=scene.fog,bg=scene.background,ov=scene.overrideMaterial,ac=gl.autoClear,cc=gl.getClearColor(new THREE.Color()),ca=gl.getClearAlpha(),sh=gl.shadowMap.autoUpdate;
  scene.fog=null;scene.background=null;gl.autoClear=true;gl.shadowMap.autoUpdate=false;
  const rtC=new THREE.WebGLRenderTarget(rw,rh),rtH=new THREE.WebGLRenderTarget(rw,rh,{type:THREE.FloatType});
  const col=new Uint8Array(rw*rh*4),hgt=new Float32Array(rw*rh*4);
  try{
    gl.setClearColor(0x000000,0);gl.setRenderTarget(rtC);gl.render(scene,oc);gl.readRenderTargetPixels(rtC,0,0,rw,rh,col);
    for(const [o,m] of swaps)o.material=m;swaps.length=0;
    scene.overrideMaterial=new THREE.ShaderMaterial({side:THREE.DoubleSide,vertexShader:'varying float vY;void main(){vec4 w=modelMatrix*vec4(position,1.0);\n#ifdef USE_INSTANCING\nw=modelMatrix*instanceMatrix*vec4(position,1.0);\n#endif\nvY=w.y;gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:'varying float vY;void main(){gl_FragColor=vec4(vY,0.0,0.0,1.0);}'});
    gl.setRenderTarget(rtH);gl.render(scene,oc);gl.readRenderTargetPixels(rtH,0,0,rw,rh,hgt);
  }finally{
    for(const [o,m] of swaps)o.material=m;
    if(scene.overrideMaterial&&scene.overrideMaterial!==ov)scene.overrideMaterial.dispose();
    scene.overrideMaterial=ov;scene.fog=fog;scene.background=bg;gl.autoClear=ac;gl.setClearColor(cc,ca);gl.shadowMap.autoUpdate=sh;gl.setRenderTarget(null);
    for(const o of hidden)o.visible=true;rtC.dispose();rtH.dispose();}
  // สีในภาพเป็นค่าเส้นตรง (render target ไม่แปลง sRGB) → เก็บเป็น sRGB 8 บิต (เข้มไม่เป็นขั้น) • ความหนาแน่นหญ้า = ความเขียว • ปิดตรงที่ผิวบนสูงกว่าพื้นดิน (หลังคา/ต้นไม้/กำแพง)
  const C=new Uint8Array(rw*rh*4),H=new Uint16Array(rw*rh),toS=v=>{v=Math.max(0,Math.min(1,v));return Math.round(255*(v<=0.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-0.055));};
  const N=rw*rh,D=new Float32Array(N),R=new Float32Array(N),Gc=new Float32Array(N),B=new Float32Array(N),Y=new Float32Array(N),st=new Uint8Array(N);   // st: 0 = ใช้ได้, 1 = ใต้พุ่มไม้ (เติมจากรอบ ๆ), 2 = ไม่มีหญ้า
  for(let j=0;j<rh;j++)for(let i=0;i<rw;i++){const k=j*rw+i,p=k*4;
    const r=col[p]/255,g=col[p+1]/255,b=col[p+2]/255,y=hgt[p],has=hgt[p+3]>0.5;
    const X=-hx+(i+0.5)/rw*2*hx,Z=hz-(j+0.5)/rh*2*hz,ground=TW(X,Z);
    const green=has&&g>0.02?Math.max(0,Math.min(1,((g-Math.max(r,b))/g-0.04)*4)):0;
    R[k]=r;Gc[k]=g;B[k]=b;Y[k]=has?y:ground;D[k]=green;
    // ผิวบนสูงกว่าพื้น: เขียว + สูง ≥2 = พุ่มไม้ (ใต้นั้นยังมีหญ้า เติมจากรอบ ๆ) / อื่น ๆ (หลังคา กำแพง หิน) = ไม่มีหญ้า
    st[k]=has&&y>ground+0.9?(green>0.3&&y>ground+2?1:2):0;if(st[k]===2)D[k]=0;}
  // ในบ้าน/ตึก = ไม่มีหญ้า (เดินเข้าบ้านได้แล้ว 2026-10-28 • บ้านสร้างทีหลังการถ่าย เลยไม่ติดในภาพ) — กรอบบ้านหมุนได้ / กล่องตึกเมือง
  const noGrass=(x0,y0,x1,y1,inside)=>{const i0=Math.max(0,Math.floor(((x0-MW/2)*S3+hx)/(2*hx)*rw)),i1=Math.min(rw-1,Math.ceil(((x1-MW/2)*S3+hx)/(2*hx)*rw)),
      j0=Math.max(0,Math.floor((hz-(y1-MH/2)*S3)/(2*hz)*rh)),j1=Math.min(rh-1,Math.ceil((hz-(y0-MH/2)*S3)/(2*hz)*rh));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=(-hx+(i+0.5)/rw*2*hx)/S3+MW/2,y=(hz-(j+0.5)/rh*2*hz)/S3+MH/2;if(inside(x,y)){D[j*rw+i]=0;st[j*rw+i]=2;}}};
  for(const b of BLDG){const r=Math.hypot(b.o.w,b.o.d)/2+6;noGrass(b.o.x-r,b.o.y-r,b.o.x+r,b.o.y+r,(x,y)=>{const [lx,ly]=bldLocal(b,x,y);return Math.abs(lx)<b.o.w/2+6&&Math.abs(ly)<b.o.d/2+6;});}
  for(const B of (MAPS[MAPID]&&MAPS[MAPID].boxes)||[])noGrass(B.x,B.y,B.x+B.w,B.y+B.d,()=>true);
  // เติมใต้พุ่มไม้: ค่อย ๆ ลามสี/ความสูง/ความหนาแน่นจากช่องข้าง ๆ เข้าไป (พุ่มใหญ่เกินไปตรงกลางยังว่าง)
  for(let it=0;it<24;it++){const fill=[];
    for(let j=1;j<rh-1;j++)for(let i=1;i<rw-1;i++){const k=j*rw+i;if(st[k]!==1)continue;let c=0,r=0,g=0,b=0,y=0,d=0;
      for(const q of [k-1,k+1,k-rw,k+rw])if(st[q]===0){c++;r+=R[q];g+=Gc[q];b+=B[q];y+=Y[q];d+=D[q];}
      if(c)fill.push(k,r/c,g/c,b/c,y/c,d/c*0.97);}
    for(let f=0;f<fill.length;f+=6){const k=fill[f];R[k]=fill[f+1];Gc[k]=fill[f+2];B[k]=fill[f+3];Y[k]=fill[f+4];D[k]=fill[f+5];st[k]=0;}
    if(!fill.length)break;}
  let n=0;
  for(let k=0;k<N;k++){const p=k*4,d=st[k]?0:D[k];C[p]=toS(R[k]);C[p+1]=toS(Gc[k]);C[p+2]=toS(B[k]);C[p+3]=Math.round(d*255);if(d>0.2)n++;H[k]=THREE.DataUtils.toHalfFloat(Y[k]);}
  GRASS.tex=new THREE.DataTexture(C,rw,rh,THREE.RGBAFormat);GRASS.tex.colorSpace=THREE.SRGBColorSpace;GRASS.tex.magFilter=GRASS.tex.minFilter=THREE.LinearFilter;GRASS.tex.needsUpdate=true;
  GRASS.texH=new THREE.DataTexture(H,rw,rh,THREE.RedFormat,THREE.HalfFloatType);GRASS.texH.magFilter=GRASS.texH.minFilter=THREE.LinearFilter;GRASS.texH.needsUpdate=true;
  GRASS.box=[-hx,hz,2*hx,-2*hz];GRASS.n=n;
  // เก็บไว้ 4 แผนที่ล่าสุด (กลับมาแผนที่เดิมไม่ต้องถ่ายใหม่)
  const BC=GRASS.cache;BC.delete(builtKey);BC.set(builtKey,{tex:GRASS.tex,texH:GRASS.texH,box:GRASS.box,n});
  while(BC.size>4){const [k,v]=BC.entries().next().value;BC.delete(k);v.tex.dispose();v.texH.dispose();}
  airForMap();
  GRASS.bakeMs=+(performance.now()-t0).toFixed(1);}
function grassCount(){
  if(!GRASS.ON||QUAL.mode==='low'||(QUAL.mode==='auto'&&QUAL.lvl>=2))return [0,0];
  const S=QUAL.mode==='high'?GRASS.S.high:QUAL.lvl>=1||QUAL.scale<0.8?GRASS.S.auto1:GRASS.S.auto;
  return [Math.min(GRASS.MAXN,Math.round(GRASS.DENS*S*S)),S];}
// ทุกเฟรมในเกม: ลม + หญ้า + แรงลมให้ผ้าคลุม
function grassTick(dt){
  airTick(dt);
  if(!GRASS.mesh)grassBuild();
  const m=GRASS.mesh;
  if(screen!=='game'||!world){m.visible=false;GRASS.trail.length=0;return;}   // ล้างรอยตอนเข้าแมตช์ใหม่ = setScreen (js/19)
  if(world.userData.grPend){m.visible=false;return;}   // รอ .glb พื้นจริง (js/28 buildFileMap) ก่อนถ่ายแผนที่หญ้า
  if(GRASS.key!==builtKey){GRASS.key=builtKey;const c=GRASS.cache.get(builtKey);
    if(c){Object.assign(GRASS,{tex:c.tex,texH:c.texH,box:c.box,n:c.n});airForMap();}
    else try{grassBake();}catch(e){console.error(e);GRASS.n=0;}}
  if(SCAR.clearNext||SCAR.key!==builtKey){SCAR.clearNext=false;SCAR.key=builtKey;scarReset();}
  if(SCAR.dirty&&SCAR.tex){SCAR.tex.needsUpdate=true;SCAR.dirty=false;}
  SCAR.U.uGrLo.value=QUAL.mode==='low'||(QUAL.mode==='auto'&&QUAL.lvl>=2)?1:0;   // พื้นมีลาย: ปิดเมื่อกราฟิกต่ำ (เหมือนหญ้า)
  const [cnt,S]=grassCount();
  m.visible=cnt>0&&GRASS.n>20;
  {const me=typeof myPos==='function'?myPos():null;if(me){const w=airAt(tx(me.x),tz(me.y));CLW.x=w.x*CLW.K;CLW.z=w.z*CLW.K;}else CLW.x=CLW.z=0;}
  if(!m.visible)return;
  fireTick(dt);
  m.geometry.instanceCount=cnt;
  const U=m.material.userData.U;
  U.uGround.value=GRASS.tex;U.uGroundH.value=GRASS.texH;U.uGrMap.value.set(...GRASS.box);
  U.uGrCam.value.set(cam.position.x,cam.position.z,S);U.uSun.value.copy(LDIR);U.uSunC.value.copy(moonL.color).multiplyScalar(moonL.intensity*0.7);U.uWind.value.set(AIR.dir.x,AIR.dir.y,AIR.str,AIR.t);
  U.uGrH.value=GRASS.H;U.uGrW.value=GRASS.W;U.uGrK.value.set(GRASS.gustK,GRASS.pushK);
  for(let i=0;i<AIR_NG;i++){const g=AIR.G[i],u=U.uGust.value[i],b=U.uGustB.value[i];if(g){const e=airEnv(g);u.set(g.x,g.z,g.R*Math.min(1,g.age/0.18+0.25),airGv(g));b.set(g.sw*e,g.dx*e,g.dz*e,0);}else{u.w=0;b.set(0,0,0,0);}}
  // ตัวละคร/ศัตรูใกล้กล้องที่สุด 8 ตัว แหวกหญ้า (บินต่ำ = วงกว้างขึ้น จางตามความสูง) + รอยเท้า: จุดที่เพิ่งเดินผ่าน หญ้าค่อย ๆ เด้งกลับใน ~1.3 วิ
  const L=[],T=GRASS.trail,TL=GRASS.trLast;
  for(let i=T.length-1;i>=0;i--){T[i].age+=dt;if(T[i].age>1.3)T.splice(i,1);}
  const add=o=>{if(!o||!o.g||!o.g.parent||!o.g.visible)return;const p=o.g.position,dh=p.y-TW(p.x,p.z);if(dh>3)return;const d=Math.hypot(p.x-cam.position.x,p.z-cam.position.z);if(d>S*0.5)return;L.push([d,p.x,p.z,dh<0.6?0.95:1.7,dh<0.6?1:Math.max(0,1-dh/3)*0.8]);
    if(dh<0.6){const l=TL.get(o);if(!l)TL.set(o,{x:p.x,z:p.z});else if(Math.hypot(p.x-l.x,p.z-l.z)>0.4){if(T.length<40)T.push({x:l.x,z:l.z,age:0});l.x=p.x;l.z=p.z;}}};
  for(const o of PM3.values())add(o);for(const o of EM3.values())add(o);
  L.sort((a,b)=>a[0]-b[0]);if(L.length>8)L.length=8;
  const TR=T.map(t=>[Math.hypot(t.x-cam.position.x,t.z-cam.position.z),t.x,t.z,0.8,0.7*Math.pow(1-t.age/1.3,1.5)]).sort((a,b)=>a[0]-b[0]);
  for(const t of TR){if(L.length>=16)break;L.push(t);}
  for(let i=0;i<16;i++){const q=L[i],u=U.uPush.value[i];if(q)u.set(q[1],q[2],q[3],q[4]);else u.w=0;}
  U.uGrN.value.set(Math.min(AIR_NG,AIR.G.length),L.length,0);   // ลูปใน shader วนเฉพาะช่องที่ใช้
}

window.WD&&Object.assign(window.WD,{FIRE,grassScar,GRASS});   // ทดสอบ/ดีบัก

// ---------- สกิลลม → หญ้า (ภาพล้วน เรียกจาก windEfx js/68) ----------
// ev.x/y = พิกัดเกม, a = ทิศ (เรเดียน) • รัศมี/แรงเป็นหน่วย 3D (เมตร) / แรงกระโชก (1 ≈ ระเบิดใหญ่) • ทุกท่าแค่ตั้งตาราง ปรับค่าได้ที่นี่
const WIND_GRASS={
  wnsb:{R:11,s:1.3},                 // โล่ปีกระเบิด: ลมพุ่งออกรอบตัว
  wngbhit:{R:4,s:0.5},wndshit:{R:4,s:0.6},wnwblk:{R:4,s:0.5},wnvxcap:{R:5,s:0.7},wnvxstun:{R:5,s:0.7},wndswall:{R:4,s:0.5},
  wnds:{R:7,s:0.4,dir:1.2},           // Dash ผลัก: ดันไปข้างหน้า
  wngb:{R:8,s:0.2,dir:1.1,ahead:5,life:0.9},   // ยิงลมต่อเนื่อง (เฉพาะตอนเริ่ม n=1): ดันไปทางยิง
  wndr:{R:8,s:0.3,dir:1.6,ahead:6,life:1.0},   // Windrift พุ่ง: ลมตามแนวพุ่ง
  wnvx:{R:9,s:0,sw:1.6,life:1.6},      // Vortex Bind: ทอร์นาโดหมุนวน
  wnvohole:{R:12,s:-1.0,sw:0.5,hold:1,id:'vo'},   // Void Sphere: ดูดหญ้าเข้าหาหลุม (ค้างจนระเบิด)
  wnvoboom:{R:14,s:1.8,off:'vo'},      // หลุมระเบิด: พุ่งออก
  wnwup:{R:6,s:0.3,dir:0.9,life:1.0},wnwboom:{R:9,s:1.1},wnwhit:{R:4,s:0.5},wnwpass:{R:4,s:0.5},   // กำแพงลม
  wnfw:{R:9,s:1.1},                   // Featherwing เริ่มบิน: ลมกดลงรอบตัว
  wnfwflick:{R:9,s:0.7,dir:1.4,ahead:4,life:1.0},   // สะบัดปีก: ลมข้างหน้า
  wnult:{R:16,s:1.0,sw:0.6,life:2.0},wnulslam:{R:18,s:2.0},   // อัลติ Eye of Heaven
  wnulblade:{R:7,s:0.4,dir:1.2,life:1.0}};
function airWind(ev){
  const c=WIND_GRASS[ev.z];if(!c)return;if(ev.z==='wngb'&&ev.n!==1)return;
  const me=typeof myPos==='function'?myPos():null;if(me&&Math.hypot(ev.x-me.x,ev.y-me.y)>1500)return;   // ไกลมาก = ไม่ต้อง
  const a=ev.a||0,ca=Math.cos(a),sa=Math.sin(a),ah=c.ahead||0,x=tx(ev.x)+ca*ah,z=tz(ev.y)+sa*ah;
  if(c.off!==undefined)airGustOff(c.off);
  airGust(x,z,c.R,c.s,{sw:c.sw,dx:ca*(c.dir||0),dz:sa*(c.dir||0),life:c.life,hold:!!c.hold,id:c.id});}
window.WD&&Object.assign(window.WD,{AIR,airGust,airWind});

