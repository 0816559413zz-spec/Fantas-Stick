// ---------- ไฟแบบใหม่ (2026-10-19): shader ไฟเคลื่อนไหวจริง (noise ไหล) ใช้กับลูกไฟ / หางไฟ / กำแพงไฟ / ปีกไฟ / เกราะ Colossus / ระเบิดลูกไฟ ----------
// หลักการสี: ส่วนร้อน (แกน) = เหลืองขาว ผสมแบบบวกแสง • ส่วนที่เย็นลง = ส้ม → แดงเข้ม ผสมแบบทึบ (บังฉากหลัง) → ไฟดูมีเนื้อ ไม่ขาวโพลน
// fireMat({mode:'ball'|'sheet', ...}) • mode ball = ทรงกลม/ชิ้นเกราะ (noise ในพิกัดวัตถุ ไหลตาม flow) • mode sheet = แผ่น/กรวย/แถบ (uv.y 0 = ฐานร้อน → 1 = ปลายเปลว)
const FIRE_U={time:{value:0}};
const FIRE_GLSL=`
vec3 m289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}vec4 m289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 perm(vec4 x){return m289(((x*34.0)+1.0)*x);}vec4 tis(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
 vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
 vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=m289(i);
 vec4 p=perm(perm(perm(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
 float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
 vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
 vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
 vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
 vec4 nm=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=nm.x;p1*=nm.y;p2*=nm.z;p3*=nm.w;
 vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
 return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
float fbm(vec3 p){float f=0.0,a=0.5;for(int i=0;i<3;i++){f+=a*snoise(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=0.5;}return f*0.57+0.5;}
vec3 fireRamp(float h){vec3 c=mix(vec3(0.28,0.03,0.0),vec3(0.9,0.2,0.02),smoothstep(0.0,0.35,h));
 c=mix(c,vec3(1.0,0.52,0.08),smoothstep(0.3,0.58,h));c=mix(c,vec3(1.0,0.84,0.42),smoothstep(0.58,0.82,h));return mix(c,vec3(1.0,0.97,0.86),smoothstep(0.82,1.05,h));}
`;
// สีเปลี่ยนได้ด้วย tint (คูณ) • int = ความสว่าง (bloom จับเฉพาะส่วนร้อน) • op = ความทึบรวม
function fireMat(o){o=o||{};const sheet=o.mode==='sheet';
  const U={time:FIRE_U.time,uOp:{value:o.op===undefined?1:o.op},uInt:{value:o.int||1.15},uScale:{value:new THREE.Vector3(...(o.scale||(sheet?[6,2.2,1]:[1.6,1.6,1.6])))},
    uFlow:{value:new THREE.Vector3(...(o.flow||[0,1,0]))},uSpeed:{value:o.speed||(sheet?1.4:1.2)},uHeat:{value:o.heat||0},uSeed:{value:o.seed===undefined?Math.random()*50:o.seed},
    uSide:{value:o.side?1:0},uTint:{value:new THREE.Color(o.tint||'#ffffff')},uDis:{value:0},uRim:{value:o.rim===undefined?1:o.rim},uDisp:{value:o.disp||0},uInv:{value:o.shell?1:0},uNz:{value:NOISETEX}};
  // ball + disp: ดันผิวออกตาม noise (ขอบเป็นลิ้นไฟ) และยืดไปด้านหลังทิศไหล (-flow) เป็นหางเปลว
  const vs=`uniform float time,uSpeed,uSeed,uDisp;uniform vec3 uScale,uFlow;varying vec3 vP;varying vec3 vN;varying vec3 vV;varying vec2 vUv;${!sheet&&o.disp?FIRE_GLSL:''}
  void main(){vUv=uv;vP=position;vec3 p=position;
  ${!sheet&&o.disp?`vec3 fd=normalize(uFlow+vec3(1e-4));float t=time*uSpeed;float dn=fbm(position*uScale*0.7-uFlow*t*1.1+vec3(uSeed));float bk=max(0.0,dot(normal,-fd));
    p+=normal*((dn-0.42)*uDisp*(1.0+bk*2.2))-fd*bk*bk*uDisp*1.6*dn;`:''}
  vec4 mv=modelViewMatrix*vec4(p,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`;
  const fs=`uniform sampler2D uNz;uniform float time,uOp,uInt,uSpeed,uHeat,uSeed,uSide,uDis,uRim,uInv;uniform vec3 uScale,uFlow,uTint;varying vec3 vP;varying vec3 vN;varying vec3 vV;varying vec2 vUv;${FIRE_GLSL}
  void main(){float h;
  ${sheet?`vec2 uv=vUv;float t=time*uSpeed;
    // noise จากภาพ (ต่อกันรอบวงพอดี: จำนวนรอบแนวนอนเป็นจำนวนเต็ม) • w = บิดเปลวให้พลิ้ว
    float fx=max(1.0,floor(uScale.x*0.25+0.5)),fy=uScale.y*0.25;
    float w=texture2D(uNz,vec2(uv.x*fx*0.5+uSeed,uv.y*fy*0.5-t*0.15)).r;
    float n=texture2D(uNz,vec2(uv.x*fx+(w-0.5)*0.22+uSeed*0.37,uv.y*fy-t*0.25)).r*0.68+texture2D(uNz,vec2(uv.x*fx*2.0+uSeed*0.71,uv.y*fy*2.0-t*0.5)).r*0.32;
    h=(1.0-uv.y)*0.92+(n-0.5)*2.3-0.06+uHeat;
    h*=mix(1.0,smoothstep(0.0,0.16,uv.x)*smoothstep(1.0,0.84,uv.x),uSide);
    h-=smoothstep(0.75,1.0,uv.y)*0.5;`
   :`float fr=abs(dot(normalize(vN),normalize(vV)));fr=mix(fr,1.0-fr,uInv);float t=time*uSpeed;
    vec3 q=vP*uScale-uFlow*t;float n=fbm(q+vec3(uSeed));float n2=fbm(q*2.1+vec3(uSeed*1.7,0.0,0.0));
    h=mix(0.5,fr*0.78,uRim)+(n-0.5)*1.9+(n2-0.5)*0.55+uHeat;`}
  h-=uDis*1.3;
  if(h<0.06)discard;
  float a=smoothstep(0.06,0.32,h)*uOp;float add=smoothstep(0.5,0.92,h);
  vec3 c=fireRamp(h)*uTint*uInt;
  gl_FragColor=vec4(c*a,a*(1.0-add*0.6));}`;
  const m=new THREE.ShaderMaterial({uniforms:U,vertexShader:vs,fragmentShader:fs,transparent:true,depthWrite:false,side:o.back?THREE.BackSide:o.single?THREE.FrontSide:THREE.DoubleSide,
    blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor});
  m.userData.keep=!!o.keep;return m;}
// ---------- ชิ้นงานสำเร็จรูป ----------
const _fbGeo=new THREE.SphereGeometry(1,40,28),_fbGeo2=new THREE.IcosahedronGeometry(1,4);
// ลูกไฟ: แกนเหลืองขาว + เปลือกเปลวไฟหมุนวน 2 ชั้น (เปลวไหลไปทาง -flow) • คืน Group (userData.mats ใช้ปรับ)
function makeFireBall(o){o=o||{};const g=new THREE.Group(),flow=o.flow||[0,0,-1];
  const m1=fireMat({mode:'ball',flow,scale:[2.2,2.2,2.2],speed:1.6,int:1.0,heat:0.02,disp:0.18,keep:o.keep});
  const m2=fireMat({mode:'ball',flow,scale:[1.5,1.5,1.5],speed:2.1,int:0.95,heat:-0.24,op:0.9,disp:0.45,keep:o.keep});
  const a=new THREE.Mesh(_fbGeo,m1),b=new THREE.Mesh(_fbGeo2,m2);b.scale.setScalar(1.3);a.scale.setScalar(0.85);g.add(a,b);
  const core=new THREE.Sprite(glowMat('#ffd890',0.8));core.scale.setScalar(1.15);if(o.keep)core.material.userData.keep=true;g.add(core);
  g.userData.mats=[m1,m2];g.userData.core=core;g.userData.shell=b;return g;}
// กรวยหางไฟ (ฐานอยู่ที่ z=0 ปลายแหลมไปทาง -z ยาว 1) — ใช้กับลูกไฟ / หางพุ่ง
// uv.y ของ CylinderGeometry: 0 = ฐาน (ติดลูกไฟ) → 1 = ปลายแหลม (ตรงกับที่ shader sheet ต้องการอยู่แล้ว)
const _ftGeo=(()=>{const g=new THREE.CylinderGeometry(0,1,1,20,8,true);g.rotateX(-Math.PI/2);g.translate(0,0,-0.5);return g;})();
function makeFireTail(o){o=o||{};const m=fireMat({mode:'sheet',scale:[5,2.4,1],speed:o.speed||3.2,int:o.int||1.15,heat:o.heat===undefined?0.0:o.heat,op:o.op,keep:o.keep});
  const t=new THREE.Mesh(_ftGeo,m);t.userData.mat=m;return t;}
// กำแพงไฟวงกลม (Ring of Embers): แถบทรงกระบอกเปิดซ้อนกัน เปลวเลียขึ้นด้านบน — r,h หน่วยโลก • o.thick = 4 ชั้น (หนา แน่น — รอบ Pyro 2026-10-19) • m.userData.h0 = ค่าความร้อนตั้งต้น
function makeFireWall(r,h,o){o=o||{};const g=new THREE.Group(),mats=[];
  const L=o.thick?[[r*0.975,h*0.8,Math.round(r*4.2),1.8,0.08],[r,h,Math.round(r*3.2),1.5,-0.02],[r*1.02,h*1.2,Math.round(r*2.3),1.2,-0.18],[r*1.045,h*1.05,Math.round(r*2.8),1.35,-0.1]]
    :[[r,h,Math.round(r*3.2),1.5,-0.02],[r*1.02,h*1.2,Math.round(r*2.3),1.2,-0.18]];
  for(const [rr,hh,sx,sp,ht] of L){
    const geo=new THREE.CylinderGeometry(rr,rr,hh,96,6,true);geo.translate(0,hh/2,0);
    const m=fireMat({mode:'sheet',scale:[sx,1.6,1],speed:sp,int:0.92,heat:ht});m.userData.h0=ht;mats.push(m);g.add(new THREE.Mesh(geo,m));}
  g.userData.mats=mats;return g;}
// ระเบิดลูกไฟ: ทรงกลมไฟขยายตัวแล้วสลายเป็นเปลวแดงเข้ม (uDis) — R หน่วยโลก
const FIREV=[];
function fireBlast(x,y,h,R,life,o){o=o||{};const g=new THREE.Group(),m1=fireMat({mode:'ball',flow:[0,1,0],scale:[1.4,1.4,1.4],speed:2.4,int:1.05,heat:0.2,disp:0.25}),m2=fireMat({mode:'ball',flow:[0,1,0],scale:[0.9,0.9,0.9],speed:1.6,int:0.95,heat:-0.05,op:0.9,disp:0.4});
  const a=new THREE.Mesh(_fbGeo2,m1),b=new THREE.Mesh(_fbGeo2,m2);b.scale.setScalar(1.25);g.add(a,b);
  g.position.set(tx(x),h+GY(x,y),tz(y));g.scale.setScalar(R*0.25);scene.add(g);
  FIREV.push({g,mats:[m1,m2],age:0,life:life||0.6,R,up:o.up||0.6,kind:'blast'});return g;}
// ของชั่วคราวที่ต้องอัปเดตเอง: {g,mats,age,life,fn(v,k,dt)}
function fireTemp(g,mats,life,fn){scene.add(g);FIREV.push({g,mats,age:0,life,fn,kind:'fn'});return g;}
function updateFireV(dt){FIRE_U.time.value+=dt;
  for(let i=FIREV.length-1;i>=0;i--){const v=FIREV[i];v.age+=dt;const k=Math.min(1,v.age/v.life);
    if(v.kind==='blast'){const e=1-Math.pow(1-k,3);v.g.scale.setScalar(v.R*(0.25+0.85*e));v.g.position.y+=v.up*dt*v.R*0.5;v.mats[0].uniforms.uDis.value=Math.pow(k,1.3)*0.95;v.mats[1].uniforms.uDis.value=Math.pow(k,1.1)*0.85;}
    else if(v.fn)v.fn(v,k,dt);
    if(v.age>=v.life){scene.remove(v.g);v.g.traverse(m=>{if(m.geometry&&m.geometry!==_fbGeo&&m.geometry!==_fbGeo2&&m.geometry!==_ftGeo&&!m.geometry.userData.keep)m.geometry.dispose();});v.mats.forEach(m=>m.dispose());FIREV.splice(i,1);}}}
// ---------- ปีกไฟ (Dragonfall) จากไฟล์ Blender mesh_fire_wing (assets/src/fx_meshes_build.py) ----------
// คืน Group ที่มีปีก 2 ข้าง (userData.wings=[{piv,sd}] — sd +1 = ปีกซ้าย −1 = ขวา) หรือ null ถ้าไฟล์ยังไม่โหลด (ระหว่างนั้นใช้ปีกอนุภาคเดิม)
// หมุนปีก: piv.rotation.z = sd×ยก/กระพือ • piv.rotation.y = sd×พับไปหลัง
function makeFireWings(){
  if(!MODELS.ready.get('mesh_fire_wing')){if(!MODELS.fail.has('mesh_fire_wing'))loadModel('mesh_fire_wing');return null;}
  const g=new THREE.Group(),mat=fireMat({mode:'sheet',scale:[1.5,2.6,1],speed:2.3,int:1.0,heat:0.06,side:true}),wings=[];
  for(const sd of [1,-1]){const piv=new THREE.Group(),inst=modelInst('mesh_fire_wing');inst.traverse(m=>{if(m.isMesh){m.material=mat;m.castShadow=m.receiveShadow=false;m.renderOrder=3;}});
    const mir=new THREE.Group();mir.scale.x=sd;mir.add(inst);piv.add(mir);g.add(piv);wings.push({piv,sd});}
  g.userData={wings,mat};return g;}
// ท่าปีก: open 0..1 (กาง) • flap = ยกขึ้นลง (เรเดียน) • fold 0..1 (พับไปหลัง)
function poseFireWings(W,open,flap,fold){for(const {piv,sd} of W.userData.wings){piv.rotation.set(0,sd*(fold*1.45+(1-open)*1.2+0.25),sd*(-0.3+flap)+sd*fold*0.3);piv.scale.setScalar(0.35+0.65*open*(1-fold*0.35));}}
// ---------- ชิ้นงานพื้น/กระแทก (รอบ Pyro 2026-10-19): พื้นแตกเป็นใย + ลาวาเรืองในรอย • พื้นไหม้ • วงเวทไฟ • เศษหินกระเด็น • เสาไฟพุ่ง • อุกกาบาต ----------
// ทุกชิ้นผสมแบบทึบ (Normal) → เห็นชัดบนพื้นขาว ไม่ขาวโพลน • สร้างครั้งเดียวต่อเหตุการณ์ (ไม่สร้างใหม่ทุกเฟรม) ลบเองเมื่อหมดอายุผ่าน fireTemp
// x,y,r = พิกเซลระบบเกม • h = ความสูงจากพื้น (หน่วยโลก)
function _crackPaths(R,n){const P=[],main=[];
  for(let i=0;i<n;i++){let an=i/n*6.283+rnd(-0.25,0.25),x=0,z=0;const segs=4+(Math.random()*3|0),len=R*rnd(0.72,1.05)/segs,pts=[[x,z]];main.push(an);
    for(let k=0;k<segs;k++){an+=rnd(-0.45,0.45);x+=Math.cos(an)*len;z+=Math.sin(an)*len;pts.push([x,z]);
      if(k>0&&k<segs-1&&Math.random()<0.55){let ba=an+(Math.random()<0.5?1:-1)*rnd(0.5,1.0),bx=x,bz=z;const bp=[[bx,bz]];for(let j=0;j<2;j++){ba+=rnd(-0.4,0.4);bx+=Math.cos(ba)*len*0.6;bz+=Math.sin(ba)*len*0.6;bp.push([bx,bz]);}P.push({pts:bp,w:0.45});}}
    P.push({pts,w:1});}
  // ใยวงรอบ: เส้นโค้งหยัก ๆ เชื่อมระหว่างรอยแตกหลัก 2 ระยะ
  for(const f of [0.38,0.7])for(let i=0;i<n;i++){if(Math.random()<0.35)continue;const a0=main[i],a1=main[(i+1)%n]+(i===n-1?6.283:0),pts=[];
    for(let k=0;k<=3;k++){const a=lerp(a0,a1,k/3),rr=R*f*rnd(0.9,1.1);pts.push([Math.cos(a)*rr,Math.sin(a)*rr]);}P.push({pts,w:0.35});}
  return P;}
function _crackGeo(P,w,y){const pos=[],idx=[];
  for(const L of P){const n=L.pts.length;for(let k=0;k<n-1;k++){const [ax,az]=L.pts[k],[bx,bz]=L.pts[k+1],dx=bx-ax,dz=bz-az,d=Math.hypot(dx,dz)||1,w0=w*L.w*(1-k/n*0.75),w1=w*L.w*(1-(k+1)/n*0.75);
    const nx=-dz/d,nz=dx/d,q=pos.length/3;pos.push(ax+nx*w0,y,az+nz*w0, ax-nx*w0,y,az-nz*w0, bx+nx*w1,y,bz+nz*w1, bx-nx*w1,y,bz-nz*w1);idx.push(q,q+1,q+2,q+1,q+3,q+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);return g;}
const _decM=o=>new THREE.MeshBasicMaterial(Object.assign({transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2},o));
// พื้นแตกเป็นใย: ร่องดำ + ลาวาเรืองข้างใน (ร้อนเหลืองตอนแรก → เย็นลงเป็นแดงเข้ม → จาง) • o.n จำนวนรอยหลัก, o.w ความกว้าง, o.hot เวลาที่ยังร้อน
const _ccA=new THREE.Color(),_ccB=new THREE.Color();
function fireCrackWeb(x,y,h,r,life,o){o=o||{};const R=r*S3,P=_crackPaths(R,o.n||9),w=(o.w||0.14)*Math.max(0.6,Math.min(1.6,R/6));
  const g=new THREE.Group();g.position.set(tx(x),h+GY(x,y),tz(y));g.rotation.y=rnd(0,6.283);
  const dk=_decM({color:'#160b06',opacity:0}),lv=_decM({color:hdr('#ffb040',2.2),opacity:0});
  const m1=new THREE.Mesh(_crackGeo(P,w*1.9,0.012),dk),m2=new THREE.Mesh(_crackGeo(P,w*0.75,0.022),lv);m1.renderOrder=2;m2.renderOrder=3;g.add(m1,m2);
  const hot=o.hot||life*0.6,C1=new THREE.Color(hdr('#ffc050',2.4)),C2=new THREE.Color(hdr('#ff4a0a',1.6)),C3=new THREE.Color('#5a1404');
  return fireTemp(g,[dk,lv],life,(v)=>{const t=v.age,grow=Math.min(1,t/0.12),out=t>life-0.4?Math.max(0,(life-t)/0.4):1;g.scale.setScalar(0.55+0.45*grow);
    dk.opacity=0.88*out;const c=Math.min(1,t/hot);lv.color.copy(c<0.3?_ccA.copy(C1).lerp(C2,c/0.3):_ccB.copy(C2).lerp(C3,(c-0.3)/0.7));lv.opacity=out*(c<0.3?1:1-0.35*(c-0.3));});}
// พื้นไหม้: แผ่นดำเป็นรอยด่าง ๆ + จุดถ่านแดง (ภาพวาดครั้งเดียว)
let _charTex=null;
function charTex(){return _charTex||(_charTex=texCanvas(256,256,(c,w)=>{const m=w/2;const gr=c.createRadialGradient(m,m,0,m,m,m);gr.addColorStop(0,'rgba(18,10,6,0.95)');gr.addColorStop(0.55,'rgba(28,16,10,0.8)');gr.addColorStop(0.85,'rgba(40,24,14,0.35)');gr.addColorStop(1,'rgba(40,24,14,0)');c.fillStyle=gr;c.fillRect(0,0,w,w);
  for(let i=0;i<90;i++){const a=Math.random()*6.283,d=Math.sqrt(Math.random())*m*0.95,s=rnd(6,26);c.fillStyle='rgba('+(Math.random()<0.5?10:48)+','+(Math.random()<0.5?6:28)+',4,'+rnd(0.15,0.45)+')';c.beginPath();c.arc(m+Math.cos(a)*d,m+Math.sin(a)*d,s,0,6.283);c.fill();}
  for(let i=0;i<60;i++){const a=Math.random()*6.283,d=Math.sqrt(Math.random())*m*0.8;c.fillStyle='rgba(255,'+(80+Math.random()*90|0)+',20,'+rnd(0.25,0.7)+')';c.fillRect(m+Math.cos(a)*d,m+Math.sin(a)*d,rnd(1,3),rnd(1,3));}}));}
const _discGeo=new THREE.CircleGeometry(1,40).rotateX(-Math.PI/2);_discGeo.userData.keep=true;
function scorch(x,y,h,r,life){const m=_decM({map:charTex(),opacity:0}),d=new THREE.Mesh(_discGeo,m);d.renderOrder=1;d.rotation.y=rnd(0,6.283);
  d.position.set(tx(x),h+0.006+GY(x,y),tz(y));const R=r*S3;
  return fireTemp(d,[m],life,(v)=>{const t=v.age;d.scale.setScalar(R*(0.6+0.4*Math.min(1,t/0.15)));m.opacity=0.85*Math.min(1,t/0.1)*(t>life-0.5?Math.max(0,(life-t)/0.5):1);});}
// วงเวทไฟบนพื้น: วงซ้อน + ตัวอักษรรูนรอบวง + ดาวหกแฉก (วาดครั้งเดียว) หมุนช้า ๆ เต้นเบา ๆ • มีเงาเข้มรองใต้ให้อ่านออกบนพื้นขาว
let _fruneTex=null;
function fruneTex(){return _fruneTex||(_fruneTex=texCanvas(512,512,(c,w)=>{const m=w/2;c.strokeStyle='#fff';c.fillStyle='#fff';c.lineCap='round';
  const circ=(r,lw)=>{c.lineWidth=lw;c.beginPath();c.arc(m,m,r,0,6.283);c.stroke();};
  circ(m*0.97,7);circ(m*0.9,3);circ(m*0.72,4);circ(m*0.66,2);circ(m*0.3,4);
  for(let i=0;i<24;i++){c.save();c.translate(m,m);c.rotate(i/24*6.283);c.translate(0,-m*0.81);c.lineWidth=4;c.beginPath();
    const s=m*0.06;for(let j=0;j<3;j++){c.moveTo(rnd(-1,1)*s,rnd(-1,1)*s);c.lineTo(rnd(-1,1)*s,rnd(-1,1)*s);}c.moveTo(0,-s);c.lineTo(0,s);c.stroke();c.restore();}
  c.lineWidth=4;for(const off of [0,Math.PI]){c.beginPath();for(let i=0;i<=3;i++){const a=off+i/3*6.283-Math.PI/2,px=m+Math.cos(a)*m*0.66,py=m+Math.sin(a)*m*0.66;i?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();}
  for(let i=0;i<12;i++){const a=i/12*6.283;c.lineWidth=3;c.beginPath();c.moveTo(m+Math.cos(a)*m*0.3,m+Math.sin(a)*m*0.3);c.lineTo(m+Math.cos(a)*m*0.42,m+Math.sin(a)*m*0.42);c.stroke();}
  c.beginPath();c.arc(m,m,m*0.08,0,6.283);c.fill();}));}
function fireRune(x,y,h,r,life){const g=new THREE.Group(),m=_decM({map:fruneTex(),color:hdr('#ff7a1a',1.7),opacity:0}),m2=_decM({map:fruneTex(),color:'#3a0c02',opacity:0});
  const a=new THREE.Mesh(_discGeo,m),b=new THREE.Mesh(_discGeo,m2);b.scale.setScalar(1.015);b.position.y=-0.004;a.renderOrder=4;b.renderOrder=3;g.add(b,a);
  g.position.set(tx(x),h+0.03+GY(x,y),tz(y));const R=r*S3;
  return fireTemp(g,[m,m2],life,(v,k,dt)=>{const t=v.age,inn=Math.min(1,t/0.3),out=t>life-0.4?Math.max(0,(life-t)/0.4):1;g.scale.setScalar(R*(0.85+0.15*inn));g.rotation.y+=dt*0.35;
    m.opacity=inn*out*(0.8+0.2*Math.sin(t*9));m2.opacity=0.45*inn*out;});}
// เศษหินกระเด็น 3 มิติ (หินดำขอบไฟ) — ตกกระดอนบนพื้นแล้วหดหาย • มีไฟติดตามช่วงแรก
const _rockGeo=new THREE.DodecahedronGeometry(1,0);_rockGeo.userData.keep=true;
let _rockM=null;
function rockChunks(x,y,h,n,spd,o){o=o||{};_rockM=_rockM||new THREE.MeshStandardMaterial({color:'#3a2c24',roughness:1,flatShading:true,emissive:new THREE.Color('#ff4a10'),emissiveIntensity:0.2});
  const g=new THREE.Group(),gy=GY(x,y),R=[],X=tx(x),Z=tz(y),life=o.life||1.3;
  for(let i=0;i<n;i++){const m=new THREE.Mesh(_rockGeo,_rockM),an=rnd(0,6.283),sp=rnd(0.4,1)*spd,s=rnd(0.12,0.3)*(o.s||1);m.scale.set(s*rnd(0.8,1.3),s*rnd(0.6,1),s*rnd(0.8,1.3));
    const r0=rnd(0,(o.r||20))*S3;m.position.set(X+Math.cos(an)*r0,gy+h+0.2,Z+Math.sin(an)*r0);g.add(m);R.push({m,v:new THREE.Vector3(Math.cos(an)*sp,rnd(6,12)*(o.up||1),Math.sin(an)*sp),w:new THREE.Vector3(rnd(-9,9),rnd(-9,9),rnd(-9,9)),s});}
  return fireTemp(g,[],life,(v,k,dt)=>{const t=v.age;for(const c of R){c.v.y-=26*dt;c.m.position.addScaledVector(c.v,dt);if(c.m.position.y<gy+c.s*0.5){c.m.position.y=gy+c.s*0.5;c.v.y=Math.abs(c.v.y)*0.3;c.v.x*=0.55;c.v.z*=0.55;c.w.multiplyScalar(0.6);}
      c.m.rotation.x+=c.w.x*dt;c.m.rotation.y+=c.w.y*dt;c.m.rotation.z+=c.w.z*dt;if(t>life-0.3)c.m.scale.multiplyScalar(Math.max(0,1-dt*3.5));
      if(t<0.45&&Math.random()<0.5){const q=simOf(c.m.position);flame(q.x,q.y,q.h-0.1,{vh:0.5,life:0.18,size:rnd(3,5),g:0});}}});}
// เสาไฟพุ่งจากพื้น (กรวย shader 2 ชั้น ชี้ขึ้น): พุ่งเร็ว → ค้างแป๊บ → สลาย • H สูง (หน่วยโลก) W รัศมีฐาน • dl หน่วงเวลา
function fireGeyser(x,y,h,H,W,life,dl){if(dl>0){later(dl,()=>fireGeyser(x,y,h,H,W,life,0));return;}
  const g=new THREE.Group(),a=makeFireTail({speed:4.2,heat:0.18,int:1.05}),b=makeFireTail({speed:3.2,heat:-0.1,int:0.95});
  for(const t of [a,b])t.rotation.x=Math.PI/2;b.scale.set(1.5,1.5,0.75);g.add(b,a);g.position.set(tx(x),h+GY(x,y),tz(y));g.rotation.y=rnd(0,6.283);
  const ma=a.userData.mat,mb=b.userData.mat;
  fireTemp(g,[ma,mb],life,(v,k)=>{const e=k<0.2?1-Math.pow(1-k/0.2,3):1,w=W*(k<0.2?0.6+0.4*e:1+0.3*(k-0.2));g.scale.set(w,Math.max(0.01,H*e*(k>0.7?1-0.4*(k-0.7)/0.3:1)),w);
    const dis=k>0.55?(k-0.55)/0.45:0;ma.uniforms.uDis.value=dis*0.9;mb.uniforms.uDis.value=dis*0.8;ma.uniforms.uHeat.value=0.18+(k<0.15?0.3*(1-k/0.15):0);});
  for(let i=0;i<6;i++)flame(x+rnd(-8,8),y+rnd(-8,8),h+0.1,{vh:rnd(H*1.6,H*2.4),life:rnd(0.35,0.5),size:rnd(7,11)*Math.min(1.6,W*2.5),g:-1,drag:1.5});}
// อุกกาบาตไฟ (Ring of Embers): ตกจากฟ้าเฉียง ๆ ลงจุด (x,y) ใน T วิ • ลูกไฟ + หางไฟ + ควัน/ถ่าน • เงาบนพื้นโตขึ้นจนกระแทก (ระเบิดอยู่ที่ efx 'ering')
const _mv1=new THREE.Vector3(),_mv2=new THREE.Vector3();
function fireMeteor(x,y,T,fromX,fromY){const gy=GY(x,y),E=new THREE.Vector3(tx(x),gy+0.4,tz(y));let dx=x-fromX,dy=y-fromY;const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
  // ตกเฉียงจากฝั่งผู้ร่าย (ไม่ใช่ตรงลงจากหัว) → กล้องหลังผู้ร่ายเห็นอุกกาบาตพุ่งข้ามหัวลงจุด
  const S=new THREE.Vector3(E.x-dx*13,gy+9.5,E.z-dy*13),g=new THREE.Group(),ball=makeFireBall({flow:[0,1,0]}),tail=makeFireTail({speed:5,heat:0.05,int:1.1});
  ball.userData.core.geometry.userData.keep=true;ball.scale.setScalar(0.75);tail.scale.set(0.7,0.7,4.2);g.add(ball,tail);g.position.copy(S);
  const sm=_decM({color:'#1a0a04',opacity:0}),sh=new THREE.Mesh(_discGeo,sm);sh.position.set(E.x,gy+0.02,E.z);sh.scale.setScalar(0.4);g.userData.sh=sh;scene.add(sh);
  fireTemp(g,[...ball.userData.mats,tail.userData.mat,sm],T,(v,k,dt)=>{const e=k*(0.45+0.55*k);_mv1.copy(g.position);g.position.lerpVectors(S,E,e);_mv2.subVectors(g.position,_mv1);
    if(_mv2.lengthSq()>1e-6)tail.lookAt(_mv2.add(g.position));ball.userData.shell.rotation.y+=dt*6;
    sh.scale.setScalar(0.4+2.2*k);sm.opacity=0.55*k;if(v.age+dt>=T)scene.remove(sh);
    const q=simOf(g.position);for(let i=0;i<3;i++)flame(q.x+rnd(-6,6),q.y+rnd(-6,6),q.h+rnd(-0.3,0.3),{vh:rnd(0.5,2),life:rnd(0.2,0.35),size:rnd(8,12),g:0,drag:3});
    if(Math.random()<0.6)PARTS.push({x:q.x,y:q.y,h:q.h+0.3,vx:rnd(-20,20),vy:rnd(-20,20),vh:rnd(0.5,1.5),life:0.8,max:0.8,col:'#2e2420',size:8,g:-0.3,smoke:true,grow:1.2,drag:2});
    LREQ.push({abs:1,x:g.position.x,y:g.position.y,z:g.position.z,col:'#ff8a3a',int:4,dist:14});});
  later(T+0.1,()=>scene.remove(sh));}
