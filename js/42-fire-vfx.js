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
// กำแพงไฟวงกลม (Ring of Embers): แถบทรงกระบอกเปิด 2 ชั้น เปลวเลียขึ้นด้านบน — r,h หน่วยโลก
function makeFireWall(r,h){const g=new THREE.Group(),mats=[];
  for(const [rr,hh,sx,sp,ht] of [[r,h,Math.round(r*3.2),1.5,-0.02],[r*1.02,h*1.2,Math.round(r*2.3),1.2,-0.18]]){
    const geo=new THREE.CylinderGeometry(rr,rr,hh,96,6,true);geo.translate(0,hh/2,0);
    const m=fireMat({mode:'sheet',scale:[sx,1.6,1],speed:sp,int:0.92,heat:ht});mats.push(m);g.add(new THREE.Mesh(geo,m));}
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
