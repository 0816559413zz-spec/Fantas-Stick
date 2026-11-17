// =====================================================================
//  สายแสง ✨ ภาพฝั่งเครื่องผู้เล่น (รอบแรก 2026-11-16 — ภาพชั่วคราวตามสเปก designs/light.md รอผู้ใช้ดู/สั่งแก้)
//  snapshot p.lt = [คริสตัลกับตัว, คู่หู id|'P'(ปริซึม)|0, จุดลิงก์ [x,y]|0, คริสตัลที่ได้จากคนอื่น, ลำแสง (-1 ชาร์จ / 1+n ยิง / 0),
//                   Empower, Dash พร้อม, วงฮีล [x,y,n]|0, กับดัก [x,y,arm]|0, ความยาวลำ, มุมลำ, กางโล่,
//                   ชาร์จ BA, มุมก้มเงย, อัลติ [phase,time,ally,homeX,homeY,homeH,shot,finish]|0, โล่คู่หู]
// =====================================================================
const LGV={st:new Map(),fx:[],empA:{}};
// โล่รังผึ้ง: กระเบื้องหกเหลี่ยม (ขนาด s) วงชั้น k = คริสตัล 1/2/3 → 7/19/37 แผ่น • โค้งรอบตัวรัศมี R
const LGSH={stepOut:0.09,stepHide:0.04,s:0.42,gap:0.035,R:1.25,bend:0,open:0.05,hitT:0.45,brkT:0.6};
// ระดับโล่ (ผู้ใช้ 2026-11-16): 1 ชิ้น = รังผึ้งวง 2 (19 แผ่น) • 2 ชิ้น = วง 4 ตัดแถวบนให้สูงเท่าระดับ 3 • 3 ชิ้น = กำแพงยาว 13×6 แถว (เดินถือไปได้)
const LGSH_L=[null,...[q=>Math.max(Math.abs(q[0]),Math.abs(q[1]),Math.abs(q[0]+q[1]))<=2,q=>Math.max(Math.abs(q[0]),Math.abs(q[1]),Math.abs(q[0]+q[1]))<=4&&q[1]<=3,q=>Math.abs(q[0]+q[1]/2)<=6.1&&q[1]>=-2&&q[1]<=3].map(f=>{
  const out=[],sz=LGSH.s+LGSH.gap;for(let q=-9;q<=9;q++)for(let r=-4;r<=4;r++){if(!f([q,r]))continue;out.push({x:sz*Math.sqrt(3)*(q+r/2),y:sz*1.5*r,d:Math.hypot(q+r/2,r*0.866)});}
  const m=Math.max(...out.map(t=>t.d));for(const t of out)t.u=t.d/m;return out.sort((a,b)=>a.d-b.d);})];
const _lgM4=new THREE.Matrix4(),_lgQ=new THREE.Quaternion(),_lgSV=new THREE.Vector3(),_lgS=new THREE.Vector3(),_lgC=new THREE.Color(),_lgC2=new THREE.Color();
function lgGlowTex(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,240,190,1)');g.addColorStop(.35,'rgba(255,170,40,0.45)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
// ร่างแสงนีออน: ซ้อนเมชเรืองแสงทับตัวละคร (ใช้ geometry/skeleton เดิม ไม่แตะวัสดุที่แชร์กัน)
function lgNeon(o,k){
  if(!(k>0.01)){if(o.lgNeon)for(const m of o.lgNeon)m.visible=false;return;}
  if(!o.lgNeon){o.lgNeon=[];o.lgNeonM=new THREE.MeshBasicMaterial({color:hdr('#ffd77a',0.7),transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false});
    const src=[];o.g.traverse(m=>{if(m.isMesh&&!m.userData.lgNeon&&m.visible)src.push(m);});
    for(const m of src){const n=m.isSkinnedMesh?new THREE.SkinnedMesh(m.geometry,o.lgNeonM):new THREE.Mesh(m.geometry,o.lgNeonM);if(m.isSkinnedMesh)n.bind(m.skeleton,m.bindMatrix);
      n.userData.lgNeon=1;n.position.copy(m.position);n.quaternion.copy(m.quaternion);n.scale.copy(m.scale).multiplyScalar(1.03);n.renderOrder=5;n.frustumCulled=false;m.parent.add(n);o.lgNeon.push(n);}}
  o.lgNeonM.opacity=k;for(const m of o.lgNeon)m.visible=true;}
// ลำแสงตอนบัฟ Empower (ผู้ใช้ 2026-11-17): คลื่นวงแหวนวิ่งไปตามลำ + เส้นพลังพุ่งออกจากลำแล้วโค้งกลับเข้าลำ (เหมือนพลังล้นจนแตกออก)
function lgEmpBeam(S,on,a,b,fwd,w,now){
  if(!S.ew){S.ew=[];S.ea=[];const tm=new THREE.MeshBasicMaterial({color:hdr('#ffe2a0',1.2),transparent:true,opacity:0.6,blending:THREE.AdditiveBlending,depthWrite:false});
    for(let k=0;k<4;k++){const r=new THREE.Mesh(new THREE.TorusGeometry(1,0.06,6,28),tm);r.visible=false;scene.add(r);S.ew.push(r);}
    S.eaM=new THREE.MeshBasicMaterial({color:hdr('#ffd77a',1.5),transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false});}
  if(!on){for(const r of S.ew)r.visible=false;for(const m of S.ea)m.visible=false;return;}
  const len=a.distanceTo(b),side=new THREE.Vector3().crossVectors(fwd,new THREE.Vector3(0,1,0)).normalize(),up=new THREE.Vector3().crossVectors(side,fwd).normalize();
  for(let k=0;k<S.ew.length;k++){const r=S.ew[k],u=((now/700)+k/S.ew.length)%1;r.visible=true;r.position.copy(a).addScaledVector(fwd,u*len);r.lookAt(r.position.clone().add(fwd));r.scale.setScalar(w*(1.7+0.8*Math.sin(u*Math.PI)));r.material.opacity=0.6*Math.sin(u*Math.PI);}
  if(!S.eaT||now-S.eaT>90){S.eaT=now;for(const m of S.ea){m.geometry.dispose();scene.remove(m);}S.ea.length=0;
    for(let k=0;k<5;k++){const u0=Math.random()*0.8,du=0.05+Math.random()*0.12,ang=Math.random()*Math.PI*2,h=w*2.5+0.25+Math.random()*0.45,dir=side.clone().multiplyScalar(Math.cos(ang)).addScaledVector(up,Math.sin(ang));
      const p0=a.clone().addScaledVector(fwd,u0*len),p1=a.clone().addScaledVector(fwd,(u0+du*0.5)*len).addScaledVector(dir,h),p2=a.clone().addScaledVector(fwd,(u0+du)*len);
      const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p0,p1,p2),12,0.03,5,false),S.eaM);m.frustumCulled=false;scene.add(m);S.ea.push(m);}}
  for(const m of S.ea)m.visible=true;S.eaM.opacity=0.6+0.4*Math.random();}
// คริสตัลนีออนล้วน (ไม่ใช่แก้ว) สำหรับ Sanctum: แกนเรืองทอง + ขอบเส้นขาวทอง
function lgNeonCrystal(scale){   // ผู้ใช้ 2026-11-17 รอบ 2: ทรงคริสตัลหกเหลี่ยม (แท่ง + ยอดแหลมบน/ล่าง) เหลี่ยมเห็นแสง + แกนเรือง + ขอบทอง + แสงฟุ้ง + ห่วงแสงรอบเอว
  if(!LGV.ncGeo){LGV.ncGeo=new THREE.LatheGeometry([new THREE.Vector2(0,-1),new THREE.Vector2(0.36,-0.42),new THREE.Vector2(0.36,0.42),new THREE.Vector2(0,1.15)],6);LGV.ncGeo.computeVertexNormals();LGV.ncEdge=new THREE.EdgesGeometry(LGV.ncGeo,20);}
  const g=new THREE.Group(),k=new THREE.Group();g.add(k);k.scale.setScalar(0.33);
  const shell=new THREE.Mesh(LGV.ncGeo,new THREE.MeshStandardMaterial({color:'#ffcf6a',emissive:'#d86a08',emissiveIntensity:0.55,metalness:0.4,roughness:0.2,flatShading:true,transparent:true,opacity:0.9,depthWrite:false}));
  const core=new THREE.Mesh(LGV.ncGeo,new THREE.MeshBasicMaterial({color:hdr('#ffc04a',1.1),transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,depthWrite:false}));core.scale.set(0.45,0.7,0.45);
  const edge=new THREE.LineSegments(LGV.ncEdge,new THREE.LineBasicMaterial({color:hdr('#fff0c0',1.6),transparent:true,opacity:0.9}));
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:LGV.glowT||(LGV.glowT=lgGlowTex()),color:hdr('#ffb040',0.8),transparent:true,opacity:0.3,blending:THREE.AdditiveBlending,depthWrite:false}));glow.scale.set(2.2,3.4,1);
  const hm=new THREE.MeshBasicMaterial({color:hdr('#ffd36a',1.5),transparent:true,opacity:0.75,blending:THREE.AdditiveBlending,depthWrite:false}),h1=new THREE.Mesh(new THREE.TorusGeometry(0.62,0.012,6,64),hm),h2=new THREE.Mesh(new THREE.TorusGeometry(0.78,0.008,6,64),hm);
  const heart=new THREE.Mesh(LGV.ncGeo,new THREE.MeshBasicMaterial({color:hdr('#fff3a0',2.4),transparent:true,opacity:0.35,blending:THREE.AdditiveBlending,depthWrite:false}));heart.scale.set(0.2,0.34,0.2);
  h1.rotation.x=Math.PI/2+0.25;h2.rotation.x=Math.PI/2-0.3;k.add(glow,shell,core,heart,edge,h1,h2);g.userData.halo=[h1,h2];g.userData.core=core;g.userData.heart=heart;g.userData.glow=glow;g.scale.setScalar(scale);return g;}
// ลายรังผึ้งบนพื้นวงฮีล (จางที่กลาง เข้มขึ้นไปทางขอบ)
function lgHoneyTex(){if(LGV.honey)return LGV.honey;const N=512,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),s=26,h=s*Math.sqrt(3);x.strokeStyle='rgba(255,220,140,1)';x.lineWidth=2.2;
  for(let row=-1;row<N/h+1;row++)for(let col=-1;col<N/(s*1.5)+1;col++){const cx=col*s*1.5,cy=row*h+(col%2?h/2:0);x.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3;x[k?'lineTo':'moveTo'](cx+Math.cos(a)*s*0.94,cy+Math.sin(a)*s*0.94);}x.closePath();x.stroke();}
  x.globalCompositeOperation='destination-in';const g=x.createRadialGradient(N/2,N/2,0,N/2,N/2,N/2);g.addColorStop(0,'rgba(0,0,0,0.35)');g.addColorStop(0.75,'rgba(0,0,0,0.8)');g.addColorStop(0.97,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,N,N);
  LGV.honey=new THREE.CanvasTexture(c);return LGV.honey;}
function lgShield(S,o,p,n,on,now,dt){
  if(!S.shF){const N=Math.max(LGSH_L[2].length,LGSH_L[3].length)+8,mk=(g,op,add)=>{const m=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:op,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,depthWrite:false,side:THREE.DoubleSide}),N);m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(N*3),3);m.frustumCulled=false;m.visible=false;scene.add(m);return m;};
    S.shF=mk(new THREE.CircleGeometry(LGSH.s*0.9,6).rotateZ(Math.PI/6),0.3,true);S.shE=mk(new THREE.RingGeometry(LGSH.s*0.84,LGSH.s*0.93,6).rotateZ(Math.PI/6),1,true);S.shG=mk(new THREE.CircleGeometry(LGSH.s*0.84,6).rotateZ(Math.PI/6),0.35,true);
    S.shGl=[];for(let k=0;k<3;k++){const g=new THREE.Sprite(new THREE.SpriteMaterial({map:LGV.glowT||(LGV.glowT=lgGlowTex()),color:hdr('#ff9a1a',2.4),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false}));g.renderOrder=11;g.visible=false;scene.add(g);S.shGl.push(g);}}
  for(let k=0;k<3;k++)if(!on||k>=n)S.shGl[k].visible=false;
  if(on){if(!S.shOn0){S.shOn0=now;S.shN=n;}S.shN=n;S.shA=p.a||0;S.shP=o.g.position.clone();S.brk=0;}
  else if(S.shOn0){S.shOn0=0;if(S.brkReq&&now-S.brkReq<400)S.brk=now;}
  const brk=S.brk&&now-S.brk<LGSH.brkT*1000?(now-S.brk)/(LGSH.brkT*1000):-1;
  if(!on&&brk<0){S.shF.visible=S.shE.visible=S.shG.visible=false;for(const g of S.shGl)g.visible=false;if(S.mote)for(const M of S.mote)M.g.visible=false;return;}
  const K=Math.max(1,Math.min(3,S.shN||n)),a=S.shA,P=on?o.g.position:S.shP,cx=P.x,cz=P.z,y0=P.y+1.25,t=on?(now-S.shOn0)/1000:0;
  const hit=S.hitT&&now-S.hitT<LGSH.hitT*1000?(now-S.hitT)/(LGSH.hitT*1000):-1;let i=0;
  const TL=LGSH_L[K],dm=TL[TL.length-1].d;
  for(const T of TL){
    let sc=1,b=(1-0.5*T.u)*(1+0.35*Math.sin(now/260+T.x*1.6-T.y*0.9));   // แสงไหลวิบวับข้ามแผ่น   // กลางสว่าง ขอบจาง
    if(on){const u=clamp((t-T.d*LGSH.open)/0.12,0,1);sc=u<1?u*(1.25-0.25*u):1;}   // เปิด: แผ่นเด้งออกจากกลางทีละวง
    if(hit>=0){const w=hit*(dm+1.2),dd=Math.abs(T.d-w);b+=1.6*Math.exp(-dd*dd*6)*(1-hit);}   // โดนตี: ระลอกแสงจากกลาง
    const yy=y0+T.y;if(yy<P.y+0.05)continue;   // แผ่นเรียบ (ไม่โค้ง) หน้าตัว • แผ่นที่จมดินไม่วาด
    const ca=Math.cos(a),sa=Math.sin(a),ang=a;let px=cx+ca*LGSH.R-sa*T.x,pz=cz+sa*LGSH.R+ca*T.x,py=yy;
    if(brk>=0){const f=brk;px+=Math.cos(ang)*f*1.4;pz+=Math.sin(ang)*f*1.4;py+=f*0.6-f*f*2.2;sc=1-f*0.6;b*=1-f;}   // แตก: แผ่นกระเด็นออก ตก จาง
    _lgSV.set(px,py,pz);_lgQ.setFromAxisAngle(_lgS.set(0,1,0),Math.PI/2-a);
    if(brk>=0)_lgQ.multiply(new THREE.Quaternion().setFromAxisAngle(_lgS.set(1,0.3,0).normalize(),brk*4*(T.d%1.7)));
    _lgM4.compose(_lgSV,_lgQ,_lgS.set(sc,sc,sc));S.shF.setMatrixAt(i,_lgM4);S.shE.setMatrixAt(i,_lgM4);
    S.shF.setColorAt(i,_lgC.set('#ff9a2a').lerp(_lgC2.set('#ffe2a0'),clamp(1-T.u,0,1)*0.45).multiplyScalar(0.45+0.45*clamp(b,0,1.8)));S.shE.setColorAt(i,_lgC.set('#ffcf5a').multiplyScalar(Math.max(0,b)*1.9));S.shG.setColorAt(i,_lgC.set('#ffb030').multiplyScalar(Math.max(0,b)*(0.45+0.55*(1-T.u))));S.shG.setMatrixAt(i,_lgM4);i++;}
  // ละอองแสงลอยขึ้นจากกำแพง
  if(!S.mote){S.mote=[];for(let k=0;k<26;k++){const g=new THREE.Sprite(new THREE.SpriteMaterial({map:LGV.glowT||(LGV.glowT=lgGlowTex()),color:hdr('#fff0c0',2),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));g.visible=false;scene.add(g);S.mote.push({g,t:Math.random(),x:0,y:0});}}
  {const W=TL[TL.length-1].x>0?Math.max(...TL.map(t=>Math.abs(t.x))):1;for(const M of S.mote){M.t+=dt/1.6;if(M.t>=1){M.t-=1;M.x=(Math.random()*2-1)*W;M.y=(Math.random()*2-1)*0.9;}
    const u=M.t,ca=Math.cos(a),sa=Math.sin(a),f=on?1:Math.max(0,1-brk*2);M.g.visible=f>0&&(on||brk>=0);if(!M.g.visible)continue;
    M.g.position.set(cx+ca*(LGSH.R+0.08)-sa*M.x,y0+M.y+u*1.1,cz+sa*(LGSH.R+0.08)+ca*M.x);M.g.scale.setScalar(0.12*Math.sin(u*Math.PI)+0.02);M.g.material.opacity=Math.sin(u*Math.PI)*f;}}
  for(const m of [S.shF,S.shE,S.shG]){m.count=i;m.visible=true;m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;}
  if(on){LREQ.push({x:cx+Math.cos(a)*LGSH.R,y:y0-0.6,z:cz+Math.sin(a)*LGSH.R,col:'#ffb84a',int:0.6+0.2*K,dist:4});
    if(o.armL){const k=clamp(t/0.15,0,1);o.armL.rotation.x=lerp(o.armL.rotation.x,-1.45,k);o.armL.rotation.z=lerp(o.armL.rotation.z,0.15,k);}}}   // ท่า: ยื่นมือซ้ายไปหน้า
// โดนตีโล่ / โล่แตก (เหตุการณ์ block / sbreak จาก host มี id) — คืน true = ไม่ต้องเล่นเอฟเฟกต์โล่ฟ้าปกติ
function lightShieldEv(ev,kind){const S=ev.id!=null&&LGV.st.get(ev.id);if(!S||!(S.shOn0||kind==='brk'&&S.shF&&S.shF.visible))return false;
  const now=LGV.now||performance.now();if(kind==='hit'){S.hitT=now;fxPlay('light/shield_hit',{x:ev.x,y:ev.y,h:ev.h||1.2,a:S.shA,aim:false});}
  else{S.brkReq=now;S.brk=now;S.shOn0=0;fxPlay('light/shield_break',{x:ev.x,y:ev.y,h:ev.h||1.2,a:S.shA,aim:false});}return true;}
const LGPOSE={body:1.45,head:-1.3,ax:-0.1,az:-1.5};   // ท่า BA: หมุนตัว / หัวกลับ / แขนขวา (x,z) — ปรับได้
let _lgGlass=null,_lgCore=null,_lgGeo=null,_lgEdge=null,_lgEdgeM=null;
// คริสตัล (ผู้ใช้ 2026-11-16 ออกแบบใหม่): แก้วทองทึบขึ้นเห็นชัด + ขอบเส้นสว่าง + แกนนีออนเหลืองกลางชิ้น
function lgCrystalMesh(scale=1){
  if(!_lgGeo){_lgGeo=new THREE.OctahedronGeometry(0.22,0);_lgGeo.scale(0.7,1.6,0.7);_lgGeo.userData.keep=true;
    _lgEdge=new THREE.EdgesGeometry(_lgGeo);_lgEdge.userData.keep=true;
    _lgGlass=new THREE.MeshPhysicalMaterial({color:'#ffe9a6',roughness:0.18,metalness:0.15,transparent:true,opacity:0.86,emissive:'#e8a21a',emissiveIntensity:0.7,flatShading:true,depthWrite:false});_lgGlass.userData.keep=true;
    _lgCore=new THREE.MeshBasicMaterial({color:hdr('#ffd21a',2.4),transparent:true,opacity:1});_lgCore.userData.keep=true;
    _lgEdgeM=new THREE.LineBasicMaterial({color:hdr('#fff3c4',2.2),transparent:true,opacity:0.95});_lgEdgeM.userData.keep=true;}
  const g=new THREE.Group(),o=new THREE.Mesh(_lgGeo,_lgGlass),c=new THREE.Mesh(_lgGeo,_lgCore),e=new THREE.LineSegments(_lgEdge,_lgEdgeM);
  c.scale.set(0.42,0.6,0.42);c.renderOrder=3;o.renderOrder=2;e.renderOrder=4;g.add(o,c,e);g.scale.setScalar(scale);return g;}
function lgState(id){let s=LGV.st.get(id);if(!s){s={cr:[],ally:[],t:0};LGV.st.set(id,s);}return s;}
const _lgV=new THREE.Vector3(),_lgW=new THREE.Vector3();
function lgWorld(x,y,h){return new THREE.Vector3(tx(x),GY(x,y)+(h||0),tz(y));}

// glTF geometry stays shared. Uniforms animate the materials without per-actor shader copies.
const LG_ULT_ASSET='radiant_sovereign',LG_CRYSTAL_ASSET='radiant_sovereign_crystal';
const LG_ULT_TIME={value:0};
let lgUltMaterials=null;
const lgSovereignFinishes=new Map();
function lgSovereignMaterials(){
  if(lgUltMaterials)return lgUltMaterials;
  const basic=(col,intensity)=>new THREE.MeshBasicMaterial({color:hdr(col,intensity),toneMapped:false});
  const body=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.48,transparent:true,alphaTest:.02});
  body.onBeforeCompile=s=>{
    s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>
      attribute float _palm_light, _palm_crease, _waist_fade, _body_height;
      varying vec4 vRadianceBody;`).replace('#include <begin_vertex>',`#include <begin_vertex>
      vRadianceBody=vec4(_palm_light,_palm_crease,_waist_fade,_body_height);`);
    s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
      varying vec4 vRadianceBody;`).replace('#include <color_fragment>',`#include <color_fragment>
      vec3 marble=mix(vec3(.61,.42,.21),vec3(.14,.072,.012),smoothstep(3.24,3.43,vRadianceBody.w));
      diffuseColor.rgb*=mix(marble,vec3(.82,.59,.20),vRadianceBody.x);
      diffuseColor.a*=max(smoothstep(0.,1.,vRadianceBody.z),vRadianceBody.x);`)
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      totalEmissiveRadiance+=vec3(1.,.70,.16)*(.075+.52*vRadianceBody.x)*(1.-.3*vRadianceBody.y);`);
  };
  const current=(base,peak,bodyLine=false)=>{
    const m=basic('#fff5d9',1);m.transparent=true;m.depthWrite=false;
    m.blending=bodyLine?THREE.NormalBlending:THREE.AdditiveBlending;
    m.customProgramCacheKey=()=>`radiance-line-${base}-${peak}-${bodyLine}`;
    m.onBeforeCompile=s=>{
      s.uniforms.uRadianceTime=LG_ULT_TIME;
      s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>
        attribute float _flow_distance;varying float vRadianceFlow;`).replace('#include <begin_vertex>',
        '#include <begin_vertex>\nvRadianceFlow=_flow_distance;');
      s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
        uniform float uRadianceTime;varying float vRadianceFlow;`).replace('#include <color_fragment>',`#include <color_fragment>
        float t=fract(vRadianceFlow-uRadianceTime*.58);
        float wave=smoothstep(0.,.05,t)*(1.-smoothstep(.05,.23,t));
        float filament=.13*pow(.5+.5*sin(vRadianceFlow*58.-uRadianceTime*14.),6.);
        diffuseColor.rgb*=mix(vec3(1.,.37,.028),vec3(1.,.94,.75),wave)*(${base}+${peak}*wave+filament);
        diffuseColor.a*=mix(${bodyLine?'0.88':'0.58'},1.,wave);`);
    };
    return m;
  };
  const shell=new THREE.MeshStandardMaterial({color:'#edf5ff',roughness:.15,metalness:.28,transparent:true,opacity:.32,depthWrite:false,
    emissive:'#a9c5ff',emissiveIntensity:.22});
  const core=basic('#ffce45',1);
  core.onBeforeCompile=s=>{
    s.uniforms.uRadianceTime=LG_ULT_TIME;
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying float vCrystalHeight;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvCrystalHeight=position.y;');
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform float uRadianceTime;varying float vCrystalHeight;')
      .replace('#include <color_fragment>',`#include <color_fragment>
      float phase=fract(uRadianceTime*.56);
      float wave=(1.-smoothstep(.035,.21,abs(abs(vCrystalHeight)-phase*.94)))*sin(3.14159*phase);
      diffuseColor.rgb*=mix(vec3(1.,.72,.18),vec3(2.0,1.55,.82),wave);`);
  };
  lgUltMaterials={body,flow:current(.91,2.8,true),wake:current(.52,1.45),shell,core};
  for(const m of Object.values(lgUltMaterials))m.userData.keep=true;
  return lgUltMaterials;
}
function lgSovereignFinish(source){
  if(!source.emissive)return source;
  if(lgSovereignFinishes.has(source))return lgSovereignFinishes.get(source);
  const m=source.clone(),name=m.name;
  m.userData.keep=true;
  if(name.startsWith('Solar blade')){
    m.color.multiplyScalar(.76);m.emissiveIntensity*=.28;
  }else if(name.startsWith('Wrist sigil')){
    m.color.multiplyScalar(.8);m.emissiveIntensity*=.44;
  }else{
    if(m.color.r*.2126+m.color.g*.7152+m.color.b*.0722>.08)m.color.lerp(new THREE.Color('#ffd36b'),.64);
    m.emissive.lerp(new THREE.Color('#ffbf31'),.32);
    m.color.multiplyScalar(.72);m.emissiveIntensity*=.50;
  }
  lgSovereignFinishes.set(source,m);return m;
}
function lgSovereignCrystal(){
  const inst=modelInst(LG_CRYSTAL_ASSET);
  if(!inst)return null;
  const {shell,core}=lgSovereignMaterials();
  inst.getObjectByName('SovereignCrystalShell').traverse(o=>{if(o.isMesh){o.material=shell;o.renderOrder=6;}});
  inst.getObjectByName('SovereignCrystalCore').traverse(o=>{if(o.isMesh)o.material=core;});
  inst.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false;});
  return inst;
}
function lgSkinSovereign(g){
  const old=g.getObjectByName('SovereignBody'),geo=old.geometry;
  // Skin attributes are immutable and shared by every clone of this GLB.
  if(!geo.hasAttribute('skinIndex')){
    const pos=geo.attributes.position,ids=new Uint16Array(pos.count*4),weights=new Float32Array(pos.count*4);
    const axis=LIGHT_FORM_ARMS.map(a=>a.upper.clone().add(a.lower).normalize());
    const v=new THREE.Vector3(),delta=new THREE.Vector3();
    for(let i=0;i<pos.count;i++){
      v.fromBufferAttribute(pos,i);
      const side=v.x>=0?0:1,a=LIGHT_FORM_ARMS[side],offset=i*4,first=side*3+1;
      const active=THREE.MathUtils.smoothstep(Math.abs(v.x),.60,1.04);
      const elbow=delta.copy(v).sub(a.elbow).dot(axis[side]),wrist=delta.copy(v).sub(a.wrist).dot(a.lower);
      const lower=THREE.MathUtils.smoothstep(elbow,-.17,.19),hand=THREE.MathUtils.smoothstep(wrist,-.10,.12);
      ids.set([0,first,first+1,first+2],offset);
      weights.set([1-active,active*(1-lower),active*lower*(1-hand),active*lower*hand],offset);
    }
    geo.setAttribute('skinIndex',new THREE.BufferAttribute(ids,4));
    geo.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
  }
  const mesh=new THREE.SkinnedMesh(geo,old.material);
  mesh.name=old.name;mesh.position.copy(old.position);mesh.quaternion.copy(old.quaternion);mesh.scale.copy(old.scale);
  mesh.frustumCulled=false;
  const parent=old.parent;parent.remove(old);parent.add(mesh);
  const root=new THREE.Bone(),bones=[root];mesh.add(root);
  const arms=[1,-1].map(sign=>{
    const A=lightArmRest(sign),tag=sign>0?'Positive':'Negative';
    const upper=new THREE.Bone(),lower=new THREE.Bone(),hand=new THREE.Bone();
    upper.name='SovereignShoulder'+tag;lower.name='SovereignElbow'+tag;hand.name='SovereignPalm'+tag;
    upper.position.copy(A.shoulder);lower.position.copy(A.elbow).sub(A.shoulder);hand.position.copy(A.wrist).sub(A.elbow);
    root.add(upper);upper.add(lower);lower.add(hand);bones.push(upper,lower,hand);
    return {sign,upper,lower,hand,mark:g.getObjectByName('Wrist'+tag),amount:0,
      target:new THREE.Vector3(sign*.35,2.3,5),q1:new THREE.Quaternion(),q2:new THREE.Quaternion(),q3:new THREE.Quaternion()};
  });
  g.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones));
  for(const a of arms)a.lower.attach(a.mark);
  return arms;
}
function lgPoseSovereign(V,shot,gesture,opening,dt){
  const blend=1-Math.exp(-20*dt),speed=1-Math.exp(-48*dt);
  const amount=gesture?gesture[1]:0;
  const recoil=gesture?lightFormRecoil(gesture[6]??-1):0;
  if(gesture){
    V.cursor.set(gesture[2],gesture[3],gesture[4]);
    lightFormAngles(gesture[0],amount,V.cursor,recoil,V.turn);
  }else V.turn.set(0,0,0,'YXZ');
  V.hover.quaternion.slerp(V.turnQ.setFromEuler(V.turn),shot?speed:blend);
  V.inverse.copy(V.hover.quaternion).invert();
  const resting=1-THREE.MathUtils.smoothstep(opening,.20,.84);
  for(const arm of V.arms){
    const A=lightArmRest(arm.sign),leading=gesture&&gesture[0]===arm.sign;
    const drop=Math.max(resting,amount*.85);
    const wanted=leading?lightFormHand(V.cursor,V.inverse,V.aim)
      :V.aim.set(arm.sign*lerp(1.15,1.97,opening),lerp(.56,1.22,opening),lerp(.9,-.34,opening));
    arm.target.lerp(wanted,blend);
    arm.amount=lerp(arm.amount,leading?amount:.84*drop,blend);
    arm.pull=lerp(arm.pull||0,leading?(gesture[5]||0):.38,leading?speed:blend);
    const pose=lightArmPose(arm.sign,arm.target,arm.amount,arm.pull);
    arm.q1.setFromUnitVectors(A.upper,pose.upper);
    arm.q2.setFromUnitVectors(A.lower,pose.lower);
    arm.q3.setFromUnitVectors(A.hand,pose.hand);
    arm.upper.quaternion.copy(arm.q1);
    arm.lower.quaternion.copy(arm.q1).invert().multiply(arm.q2);
    arm.hand.quaternion.copy(arm.q2).invert().multiply(arm.q3);
    if(shot&&shot[0]===arm.sign)V.muzzle.copy(pose.wrist).addScaledVector(pose.hand,.20);
  }
}

function lgSovereignRibbon(){
  const positions=[],uvs=[],indices=[],steps=88;
  for(let i=0;i<=steps;i++){
    const f=i/steps,a=f*Math.PI*2,x=Math.cos(a),z=Math.sin(a);
    for(const edge of [-1,1]){
      const r=1+edge*.073;
      positions.push(1.39*x*r,edge*.061,1.01*z*r);uvs.push(f,(edge+1)/2);
    }
    if(i<steps){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);
  const mat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,
    uniforms:{time:LG_ULT_TIME,alpha:{value:0},surge:{value:0}},
    vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 v;uniform float time,alpha,surge;
      void main(){
        float t=fract(v.x*2.-time*.44),w=sin(3.14159*v.y);
        float shape=.28+.72*smoothstep(.03,.15,t)*(1.-smoothstep(.83,.99,t));
        float edging=pow(abs(v.y*2.-1.),6.);
        float glint=1.-smoothstep(.03,.19,abs(t-.63));
        vec3 gold=mix(vec3(.92,.41,.057),vec3(1.39,1.08,.59),clamp(edging*.72+glint*.48+surge*.36,0.,1.));
        gl_FragColor=vec4(gold*(1.+.38*surge),alpha*shape*(.58*w+.90*edging));
      }`});
  const mesh=new THREE.Mesh(geo,mat);mesh.renderOrder=3;mesh.position.y=2.01;
  return mesh;
}

function lgSovereignCrossSparks(){
  const geo=new THREE.BufferGeometry(),seeds=[];
  for(let i=0;i<36;i++)seeds.push(i/36,(i*19%37)/37,i%4);
  geo.setAttribute('position',new THREE.Float32BufferAttribute(seeds,3));
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{time:LG_ULT_TIME,alpha:{value:0},surge:{value:0}},
    vertexShader:`uniform float time,surge;varying float glow;
      void main(){
        float t=fract(position.x+time*(.64+position.y*.34)),s=mod(position.z,2.)*2.-1.;
        float high=step(1.5,position.z),drift=t*t;
        vec3 p=vec3(s*t*mix(.64,1.10,high),2.75+t*mix(-.88,.53,high),.57-t*t*.20);
        p.xy+=vec2(s,position.y-.5)*drift*(.15+surge*.47);
        p.z+=sin(t*7.+position.y*10.)*.082+drift*.23;
        vec4 q=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*q;
        gl_PointSize=clamp((18.+position.y*28.+surge*23.)/(-q.z),1.,9.);
        glow=smoothstep(0.,.08,t)*(1.-t)*(.55+.45*position.y);
      }`,
    fragmentShader:`uniform float alpha,surge;varying float glow;
      void main(){vec2 p=abs(gl_PointCoord-.5);float a=1.-smoothstep(.19,.48,p.x+p.y);
        gl_FragColor=vec4(vec3(1.55,1.03,.26)*(1.+surge),a*glow*alpha);}`});
  const sparks=new THREE.Points(geo,mat);sparks.frustumCulled=false;sparks.renderOrder=4;
  return sparks;
}
function lgBuildSovereign(){
  const g=modelInst(LG_ULT_ASSET);
  if(!g)return null;
  const {body,flow,wake}=lgSovereignMaterials();
  const skin=lgSkinSovereign(g);
  const fades=new Map(),wings=[];
  const instance=(source,alpha,start=.08,end=.66)=>{
    if(fades.has(source))return fades.get(source).material;
    const material=source.clone();
    material.onBeforeCompile=source.onBeforeCompile;material.customProgramCacheKey=source.customProgramCacheKey;
    material.transparent=true;material.opacity=alpha;material.userData.keep=false;
    fades.set(source,{material,alpha,start,end});
    return material;
  };
  const set=(name,mat,alpha,start,end)=>g.getObjectByName(name).traverse(o=>{if(o.isMesh)o.material=instance(mat,alpha,start,end);});
  g.traverse(o=>{if(o.isMesh){
    o.castShadow=o.receiveShadow=false;
    if(/^(SovereignBody|SovereignCross)/.test(o.name))return;
    const finish=source=>{
      const name=source.name,mat=lgSovereignFinish(source);
      if(name.startsWith('Solar blade')){wings.push({mesh:o,width:o.scale.x});return instance(mat,.65,.29,.90);}
      if(name.startsWith('Wrist sigil'))return instance(mat,.94,.45,.93);
      if(name.startsWith('Eclipse'))return instance(mat,.94,.51,1);
      if(name.startsWith('Warm light'))return instance(mat,.94,0,.32);
      return instance(mat,.65);
    };
    o.material=Array.isArray(o.material)?o.material.map(finish):finish(o.material);
  }});
  set('SovereignBody',body,.65,.10,.63);set('SovereignCross',flow,.94,.22,.68);set('SovereignCrossWake',wake,.86,.30,.78);
  g.getObjectByName('SovereignCross').traverse(o=>{if(o.isMesh)o.renderOrder=2;});
  const hover=g.getObjectByName('SovereignHover'),halo=g.getObjectByName('SolarHalo');
  const sash=lgSovereignRibbon(),sparks=lgSovereignCrossSparks();hover.add(sash,sparks);
  const flash=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshBasicMaterial({
    color:hdr('#ffe4a1',2.2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  flash.visible=false;hover.add(flash);
  const wrists=[1,-1].map(sign=>{
    const name=sign>0?'Positive':'Negative';
    return {sign,marks:g.getObjectByName('WristMarks'+name),pulse:g.getObjectByName('WristPulse'+name)};
  });
  scene.add(g);
  return {g,hover,halo,haloHome:halo.position.clone(),heart:g.getObjectByName('SovereignHeart'),wrists,crystals:[],
    arms:skin,wings,sash,sparks,flash,aim:new THREE.Vector3(),cursor:new THREE.Vector3(),muzzle:new THREE.Vector3(),
    turn:new THREE.Euler(),turnQ:new THREE.Quaternion(),inverse:new THREE.Quaternion(),fades:[...fades.values()]};
}
function lgReturnMark(){
  const m=new THREE.Mesh(new THREE.RingGeometry(.74,.83,40),new THREE.MeshBasicMaterial({
    color:hdr('#ffc663',1.5),transparent:true,opacity:.78,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
  m.rotation.x=-Math.PI/2;scene.add(m);return m;
}
function lgUltVisual(o,p,S,U,alive,now,dt){
  const form=!!(U&&U[0]>1&&alive);
  const shot=form&&U[6];
  const rigShot=shot&&Number.isFinite(shot[10])?shot:null;
  const gesture=form&&(U[8]||(rigShot&&[shot[0],shot[10],shot[7],shot[8],shot[9],0,-1]));
  const firingAge=gesture?.[6]??-1;
  const surge=shot ? Math.exp(-(Math.max(0,firingAge)%LT_UL.baTick)*14)*(firingAge<.29?1:.60) : 0;
  if(U&&alive){
    if(!S.returnMark)S.returnMark=lgReturnMark();
    S.returnMark.visible=true;
    S.returnMark.position.copy(lgWorld(U[3],U[4],U[5]+.06));
    S.returnMark.material.opacity=.69+.13*Math.sin(now*.007);
  }else if(S.returnMark)S.returnMark.visible=false;
  if(form&&!S.sovereign)S.sovereign=lgBuildSovereign();
  const V=S.sovereign;
  if(V){
    V.g.visible=form;
    if(form){
      V.g.position.copy(o.g.position);V.g.rotation.copy(o.g.rotation);o.g.visible=false;
      V.g.scale.setScalar(LIGHT_FORM_SCALE);
      const introTime=.98,elapsed=Math.max(0,LT_UL.t-U[1]);
      V.age=clamp(Math.max(elapsed,(V.age??elapsed)+dt),0,introTime);
      const opening=V.age/introTime,open=THREE.MathUtils.smoothstep(opening,0,.86);
      const spread=THREE.MathUtils.smoothstep(opening,.26,.92);
      if(opening<1)V.g.position.y-=1.22*(1-open);
      for(const f of V.fades)f.material.opacity=f.alpha*THREE.MathUtils.smoothstep(opening,f.start,f.end);
      for(const w of V.wings)w.mesh.scale.x=w.width*(.46+.54*spread);
      lgPoseSovereign(V,rigShot,gesture,opening,dt);
      V.hover.position.copy(LIGHT_FORM_PIVOT).applyQuaternion(V.hover.quaternion).negate().add(LIGHT_FORM_PIVOT);
      V.hover.position.y+=-LIGHT_FORM_BASE+.135*open*Math.sin(now*.003);
      V.sash.rotation.set(.45+Math.sin(now*.003-.6)*.06,Math.sin(now*.00065)*.24,.58+.06*Math.sin(now*.004-.45));
      V.sash.scale.setScalar(.73+.27*spread+.083*surge);
      V.sash.material.uniforms.alpha.value=.88*spread;
      V.sash.material.uniforms.surge.value=surge;
      V.sparks.material.uniforms.alpha.value=open;
      V.sparks.material.uniforms.surge.value=surge;
      V.flash.visible=!!shot&&surge>.12;
      V.flash.position.copy(V.muzzle);V.flash.scale.set(.19+.27*surge,.18+.18*surge,.42+.28*surge);
      V.flash.material.opacity=.78*surge;
      if(opening<1){
        if(!S.arrivalRing)S.arrivalRing=lgReturnMark();
        const ring=S.arrivalRing;
        ring.visible=true;ring.position.copy(V.g.position);ring.position.y+=.15+opening*1.65;
        ring.scale.setScalar(.30+2.1*open);ring.material.opacity=Math.sin(opening*Math.PI)**2*.87;
      }else if(S.arrivalRing)S.arrivalRing.visible=false;
      const finish=U[0]===3?clamp(1-U[7]/LT_UL.finishCast,0,1):0;
      V.halo.position.copy(V.haloHome).lerp(V.heart.position,finish);
      const haloOpen=THREE.MathUtils.smoothstep(opening,.48,1);
      V.halo.scale.setScalar((.36+.64*haloOpen)*(1-.72*finish));V.halo.rotation.y=(1-haloOpen)*.96+finish*Math.PI;
      for(const w of V.wrists){w.marks.rotation.y=w.sign*now*.001;w.pulse.rotation.y=w.sign*now*.0029;}
      while(V.crystals.length<4){const c=lgSovereignCrystal();if(!c)break;V.halo.add(c);V.crystals.push(c);}
      V.crystals.forEach((c,i)=>{
        const a=now*.00092+i*Math.PI/2;
        c.position.set(Math.cos(a)*1.12,Math.sin(a)*1.12,0);
        c.rotation.set(0,now*.0018,a-Math.PI/2);c.scale.setScalar(.115*haloOpen);
      });
      LREQ.push({x:o.g.position.x,y:o.g.position.y+.9,z:o.g.position.z,col:'#ffdb83',int:.47,dist:3.7});
    }else{
      V.age=null;
      V.hover.rotation.y=0;
      for(const a of V.arms)a.amount=0;
    }
  }
  if(!form&&S.arrivalRing)S.arrivalRing.visible=false;
  if(shot){
    if(!S.ultBeam)S.ultBeam=lgTube(lgUltBeamMat(),1);
    const a=V&&rigShot?V.hover.localToWorld(V.muzzle.clone()):lgWorld(shot[1],shot[2],shot[3]);
    const b=lgWorld(shot[4],shot[5],shot[6]);
    S.ultBeam.visible=true;lgAim(S.ultBeam,a,b);S.ultBeam.scale.x=S.ultBeam.scale.y=.19+.055*surge;
    S.ultBeam.material.uniforms.uT.value=now/1000;
    LREQ.push({x:a.x,y:a.y,z:a.z,col:'#ffe399',int:.72,dist:3.5});
  }else if(S.ultBeam)S.ultBeam.visible=false;
  return form;
}
function lgWardVisual(o,S,active,now){
  const parts=S.wardCrystals||(S.wardCrystals=[]);
  while(active&&parts.length<3){
    const c=lgSovereignCrystal();if(!c)break;
    c.scale.setScalar(.23);scene.add(c);parts.push(c);
  }
  parts.forEach((c,i)=>{
    c.visible=active;if(!active)return;
    const a=-now*.00085+i*Math.PI*2/3;
    c.position.copy(o.g.position);c.position.x+=Math.cos(a)*.84;c.position.z+=Math.sin(a)*.84;
    c.position.y+=1.16+.10*Math.sin(now*.002+i);
    c.rotation.y=now*.0013;
  });
  return active&&parts.length===3;
}
// ลำแสง: ท่อเรืองแสงทอง-ขาว แกนสว่าง ขอบจาง + วงแหวนแสงตรงจุดเริ่ม
let _lgBeamM=null;
function lgBeamMat(){if(_lgBeamM)return _lgBeamM;_lgBeamM=new THREE.ShaderMaterial({uniforms:{uT:{value:0},uK:{value:1}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vU;varying vec3 vN,vV;void main(){vU=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uT,uK;varying vec2 vU;varying vec3 vN,vV;void main(){float f=abs(dot(normalize(vN),normalize(vV)));float core=smoothstep(0.35,0.95,f);float s=0.75+0.25*sin(vU.y*40.-uT*30.);float fade=smoothstep(1.,0.85,vU.y);vec3 col=mix(vec3(1.,0.7,0.15),vec3(1.,0.9,0.55),core);float a=(0.06+0.6*core)*s*fade*uK;gl_FragColor=vec4(col*a,a);}'});_lgBeamM.userData.keep=true;return _lgBeamM;}
let _lgUltBeamM=null;
function lgUltBeamMat(){
  if(!_lgUltBeamM){_lgUltBeamM=lgBeamMat().clone();_lgUltBeamM.uniforms.uK.value=.78;_lgUltBeamM.userData.keep=true;}
  return _lgUltBeamM;
}
// สายลิงก์: ความทึบไม่เท่ากันตามหน้าตัด (ขอบจาง กลางเข้ม เป็นแถบ) + ลายวิ่งไปตลอด
let _lgLinkM=null;
function lgLinkMat(){if(_lgLinkM)return _lgLinkM;_lgLinkM=new THREE.ShaderMaterial({uniforms:{uT:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uT;varying vec2 vU;void main(){float a=vU.x*6.2832;float band=0.5+0.5*sin(a*3.+vU.y*14.-uT*5.);float band2=0.5+0.5*sin(a*1.-vU.y*9.+uT*3.3);float run=smoothstep(0.6,1.,0.5+0.5*sin(vU.y*30.-uT*12.));float al=(0.12+0.5*band*band2+0.45*run)*smoothstep(0.,0.06,vU.y)*smoothstep(1.,0.94,vU.y);gl_FragColor=vec4(vec3(1.,0.72,0.2)*al*1.6,al);}'});_lgLinkM.userData.keep=true;return _lgLinkM;}
function lgTube(mat,r){const g=new THREE.CylinderGeometry(r,r,1,16,1,true).translate(0,0.5,0).rotateX(Math.PI/2);const m=new THREE.Mesh(g,mat);m.frustumCulled=false;m.renderOrder=5;scene.add(m);return m;}
function lgAim(m,a,b){m.position.copy(a);m.lookAt(b);m.scale.set(1,1,a.distanceTo(b));}
function lightFX(o,p,pz,now,dt){
  const L=p.lt,s=LGV.st.get(p.id);
  if(!L){if(s)lgClear(s);return;}
  LGV.now=now;const S=lgState(p.id),n=L[0]|0,alive=p.al&&!p.dn;S.t+=dt;if(L[1]&&L[1]!=='P'){S.allyId=L[1];S.sentN=Math.max(1,LTV.max-n);}
  LG_ULT_TIME.value=now/1000;
  if(getKit(p.id).path===LIGHTP||L[14]||L[15]){
    loadModel(LG_ULT_ASSET);loadModel(LG_CRYSTAL_ASSET);
  }
  const ward=lgWardVisual(o,S,!!L[15]&&alive,now);
  if(lgUltVisual(o,p,S,L[14],alive,now,dt)){lgClearBase(S);return;}
  o.g.updateWorldMatrix(true,false);
  // ---------- Light Step (ผู้ใช้ 2026-11-16 รอบ 2): วาร์ปแวบเดียว • ตัวโผล่มาเป็นร่างแสงนีออน แล้วจางกลับเป็นตัวปกติ + ท่าลงพื้น ----------
  // ลำดับ: 0–0.09 วิ ตัวยังอยู่ที่เดิมแต่กลายเป็นร่างแสงนีออน → แวบ (ปริซึมหดเป็นเส้น) → หาย 0.04 วิ (เส้นแสงแวบ) → โผล่ที่ใหม่เป็นร่างแสง แล้วจางกลับตัวปกติ • คริสตัลหาย/โผล่พร้อมตัว
  S.crHide=false;
  if(S.step){const st=S.step,t=(now-st.t0)/1000,T1=LGSH.stepOut,T2=T1+LGSH.stepHide;
    if(!S.orbT){S.orbT=lgTube(lgBeamMat(),1);}
    if(t<T1){o.g.visible=true;o.g.position.copy(st.a0);o.g.updateWorldMatrix(true,false);const k=clamp(t/0.05,0,1);lgNeon(o,k);
      o.b.rotation.x-=0.2*k;if(o.armL&&o.armR){o.armL.rotation.z-=0.5*k;o.armR.rotation.z+=0.5*k;}o.b.updateWorldMatrix(true,true);}   // ท่าก่อนแวบ: ตัวเอนหลังนิด แขนหุบ
    else{if(!st.outD){st.outD=1;fxPlay('light/step_out',{x:st.x,y:st.y,h:st.h,aim:false});}
      if(!st.inD&&t>=T1+0.02){st.inD=1;fxPlay('light/step_in',{x:st.x2,y:st.y2,h:st.h,aim:false});if(p.id===NET.myId)shake(0.2);}
      const lt=t-T1;if(lt<0.12){S.orbT.visible=true;lgAim(S.orbT,st.a,st.b);S.orbT.scale.x=S.orbT.scale.y=0.22*(1-lt/0.12);}else S.orbT.visible=false;   // เส้นแสงแวบระหว่าง 2 จุด
      o.g.visible=t>=T2;S.crHide=t<T2;if(t>=T2&&!st.crS){st.crS=1;S.crSnap=1;}
      const u=clamp((t-T2)/0.25,0,1);lgNeon(o,t<T2?0:0.85*(1-u*u));   // ร่างแสงนีออน → ตัวปกติ
      if(t>=T2&&u<1){const e=1-u,c=e*e;o.b.position.y-=0.22*c;o.b.rotation.x+=0.35*c;if(o.armL&&o.armR){o.armL.rotation.z+=0.9*c;o.armR.rotation.z-=0.9*c;}o.b.updateWorldMatrix(true,true);}}   // ท่าลงพื้น: ย่อ ก้ม แขนกาง แล้วยืดกลับ
    if(t>0.75){S.step=null;o.g.visible=true;lgNeon(o,0);S.orbT.visible=false;}}
  // ---------- Empower Light: ยกมือซ้ายแบ (ประกายดูดเข้ามือ) → กำมือดึงลงเร็ว (คลื่นแสงรอบตัว) • คริสตัลหมุนไว 2 รอบ ----------
  S.empSp=S.empSp||0;
  if(o.empOn){o.empT+=dt;const t=o.empT,R1=0.45,R2=0.6,HOLD=0.85,hand=()=>o.armL?o.armL.localToWorld(new THREE.Vector3(0,-0.5,0)):o.g.position.clone().add(new THREE.Vector3(0,1.8,0));
    if(t<dt*1.5){const h=hand();fxPlay('light/emp_gather',{x:h.x/S3+MW/2,y:h.z/S3+MH/2,h:h.y-GY(h.x/S3+MW/2,h.z/S3+MH/2),aim:false});}
    const w=t<0.12?t/0.12:(t>HOLD?Math.max(0,1-(t-HOLD)/0.25):1);
    if(o.armL&&w>0){let ax,tw,lx,dy=0,fa=0;
      if(t<R1){const e=t/R1;ax=-2.5-0.35*e*e;tw=0.3*e;lx=-0.12*e;}   // แบมือ: ยกขึ้นช้า ๆ ตัวบิดเปิดไปทางมือ เอนหลังนิด
      else{const e=clamp((t-R1)/(R2-R1),0,1),f=1-(1-e)*(1-e);ax=-2.85+1.35*f;tw=0.3-0.75*f;lx=-0.12+0.38*f;dy=-0.1*f;fa=f;}   // กำดึงลง: ศอกลง แขนท่อนล่างงอชี้ขึ้น ตัวบิดเข้าหามือ โน้มหน้า ย่อ
      o.armL.rotation.x=lerp(o.armL.rotation.x,ax,w);o.armL.rotation.z=lerp(o.armL.rotation.z,0.3,w);o.natFaL=Math.max(o.natFaL||0,fa*w);
      o.b.rotation.y+=tw*w;o.b.rotation.x+=lx*w;o.b.position.y+=dy*w;o.b.updateWorldMatrix(true,true);}
    if(t>=R1+0.06&&!o.empB){o.empB=1;fxPlay('light/emp_burst',{x:o.g.position.x/S3+MW/2,y:o.g.position.z/S3+MH/2,h:0,a:p.a||0,aim:false});fxPlay('light/emp_aura',{x:p.x,y:p.y,h:0,follow:p.id,p:{t:LT_EM.t},aim:false});if(p.id===NET.myId)shake(0.2);S.empX=now;}
    // คริสตัล: ตอนแบมือหมุนเร็วเข้ามาใกล้ตัว • กำมือ → กางออกวงกว้างแล้วค่อยกลับ
    S.empSp=(S.empSp||0)+dt*(t<R1?14:t<R2+0.1?24:5);S.empRr=t<R1+0.06?1.5:null;
    if(t>HOLD+0.3){o.empOn=0;}}
  {const k=S.empX?(now-S.empX)/1000:9;const base=(L[5]|0)===1?1.8:1.0;S.empR=S.empRr!=null?S.empRr:(k<1.6?base+0.6*Math.max(0,1-k/1.6)*Math.min(1,k/0.15):base);if(!o.empOn)S.empSp=(S.empSp||0)+dt*Math.max(0,3*(1-k/1.6));}
  const empOn=(L[5]|0)===1;if(empOn)S.empSp=(S.empSp||0)+dt*3.5;   // ระหว่างบัฟ คริสตัลหมุนเร็วขึ้นif(empOn&&S.allyId!=null)LGV.empA[S.allyId]=now;
  // ---------- คริสตัลกับตัว ----------
  while(S.cr.length<3){const c=lgCrystalMesh(1);scene.add(c);S.cr.push(c);}
  const beam=L[4]|0,ba=L[10]||0,shOn=L[11]|0,bp=beam!==0?(L[13]||0):0;
  if(shOn&&o.shield)o.shield.visible=false;   // ไม่ใช้โล่ลูกแก้วปกติ (ใช้หกเหลี่ยม)
  // ท่า BA (ผู้ใช้ 2026-11-16): ตัวหันข้างเต็ม ๆ หัวหันไปทางเล็ง แขนขวากางชี้ไปทางเล็ง
  if(beam!==0&&alive){o.g.rotation.y=Math.atan2(Math.cos(ba),Math.sin(ba));o.g.updateWorldMatrix(true,false);}
  // ลอยขึ้นนุ่ม ๆ ฝั่งภาพ (snapshot มาเป็นช่วง ๆ ทำให้ขึ้นแบบหยุด ๆ): นับเวลาเอง แล้วอิงพื้นจาก snapshot แบบกรองนุ่ม
  if(beam!==0&&alive&&n>0){const py=o.g.position.y;o.lgFlT=Math.min(1,(o.lgFlT||0)+dt/LTV.baRise);const u=o.lgFlT,e=u*u*u*(u*(u*6-15)+10),fl=LTV.baFloat*e;
    if(o.lgY0===undefined)o.lgY0=py;else o.lgY0+=(py-fl-o.lgY0)*Math.min(1,dt*3);
    o.g.position.y=o.lgY0+fl;o.g.updateWorldMatrix(true,false);}
  else{o.lgFlT=0;o.lgY0=undefined;}   // ตัวหันตามทิศลำแสงจริงเสมอ
  {const on=beam!==0&&alive,k=o.lgPose=(o.lgPose||0)+((on?1:0)-(o.lgPose||0))*Math.min(1,dt*(on?6:4));
    if(k>0.01){const LP=LGPOSE;o.b.rotation.y+=LP.body*k;if(o.armR){o.armR.rotation.x=lerp(o.armR.rotation.x,LP.ax,k);o.armR.rotation.z=lerp(o.armR.rotation.z,LP.az-bp,k);}
      o.b.updateWorldMatrix(true,true);}
    o.lgHeadYaw=k>0.01?LGPOSE.head*k:0;}
  if(o.tip){o.tip.getWorldPosition(_lgW);}else _lgW.copy(o.g.position).add(new THREE.Vector3(0,1.4,0));
  const fwd=new THREE.Vector3(Math.cos(ba)*Math.cos(bp),Math.sin(bp),Math.sin(ba)*Math.cos(bp)),side=new THREE.Vector3(-Math.sin(ba),0,Math.cos(ba)),up=new THREE.Vector3(0,1,0),rUp=new THREE.Vector3().crossVectors(side,fwd).normalize();
  const ringC=_lgW.clone().addScaledVector(fwd,0.35);
  for(let i=0;i<3;i++){const c=S.cr[i];c.visible=alive&&i<n&&!S.crHide;if(!c.visible)continue;if(!shOn)c.scale.setScalar(empOn?1.2+0.08*Math.sin(now/90+i):1);
    let P;
    if(beam!==0&&n>0){   // ชาร์จ 1.6 วิ: คริสตัลบินไปรวมที่ปลายไม้ทีละชิ้น → หมุนแรง • ยิง: หมุนช้าลง (1 ชิ้น = อยู่กลาง ไม่หมุน)
      const ch=beam<0?(L[12]||0):LTV.baCharge;
      const bk=(L[5]|0)===1?2:1;if(beam<0){S.spin=(S.spin||0)+dt*(ch<1.05?0:3.2*bk);}else S.spin=(S.spin||0)+dt*1.6*bk;
      let Pt;
      if(n===1)Pt=ringC.clone();
      else{const a=S.spin+i*Math.PI*2/n,r=0.5;Pt=ringC.clone().addScaledVector(side,Math.cos(a)*r).addScaledVector(rUp,Math.sin(a)*r);}
      const t0=0.15+i*0.3,u=beam<0?clamp((ch-t0)/0.5,0,1):1;   // ทีละชิ้น: บินเข้าปลายไม้ก่อน (0.3 วิ) แล้วกางออกไปที่วง (0.2 วิ)
      if(!c.lgFrom)c.lgFrom=c.position.clone();
      if(u<0.6){const e=u/0.6,f=e*e*(3-2*e);P=c.lgFrom.clone().lerp(_lgW,f);if(f>0&&f<1)P.y+=Math.sin(f*Math.PI)*0.2;}
      else{const e=(u-0.6)/0.4,f=e*e*(3-2*e);P=_lgW.clone().lerp(Pt,f);}
      c.position.copy(P);c.rotation.set(0,S.spin*2,0);continue;}   // ตัวคริสตัลตั้งขึ้นเสมอ
    c.lgFrom=null;
    if(shOn){   // โล่: คริสตัลเรียงสามเหลี่ยมกลางกำแพงรังผึ้ง (ด้านนอก)
      const a=p.a||0,sx=(i-(n-1)/2)*(n>2?2.2:1.3),sy=1.75+0.12*Math.sin(S.t*2+i);P=o.g.position.clone().add(new THREE.Vector3(Math.cos(a)*(LGSH.R-0.6)-Math.sin(a)*sx,sy,Math.sin(a)*(LGSH.R-0.6)+Math.cos(a)*sx));if(S.shGl){const g=S.shGl[i];g.visible=true;g.position.copy(c.position);g.scale.setScalar(1.5+0.2*Math.sin(S.t*5+i));}c.scale.setScalar(2.2);c.traverse(m=>m.renderOrder=12);   // คริสตัลหลังกำแพง ส่องแสง
      if(i<2)LREQ.push({x:P.x,y:P.y,z:P.z,col:'#ffc04a',int:1.1,dist:4});c.rotation.y+=dt*2;}
    else{const a=S.t*0.9+i*Math.PI*2/3+(S.empSp||0),er=S.empR||1.0;P=o.g.position.clone().add(new THREE.Vector3(Math.cos(a)*er,1.45+0.08*Math.sin(S.t*2+i),Math.sin(a)*er));c.rotation.y=S.t*1.5;}
    if(S.crSnap)c.position.copy(P);else c.position.lerp(P,Math.min(1,dt*14));}
  S.crSnap=0;
  // ---------- ลำแสง ----------
  if(!(beam>0&&alive))S.pb=0;
  if(beam>0&&alive){if(!S.beam){S.beam=lgTube(lgBeamMat(),1);S.ring=new THREE.Mesh(new THREE.TorusGeometry(0.3,0.03,8,40),new THREE.MeshBasicMaterial({color:hdr('#fff1c0',2.4),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(S.ring);}
    if(!(S.pb>0)){S.fireT=now;   // ลำแรกออก: แรงกระแทก (VFX Studio light/ba_fire) + ลำหนาพุ่งแล้วหด + จอสั่นเบา ๆ (ของเรา)
      {const q=ringC.clone().addScaledVector(fwd,-0.6),fx0=q.x/S3+MW/2,fy0=q.z/S3+MH/2;fxPlay('light/ba_fire',{x:fx0,y:fy0,h:q.y-1.3-GY(fx0,fy0),a:ba,aim:false,s:empOn?1.5:1});}if(p.id===NET.myId)shake(empOn?0.3:0.18);}
    const kick=Math.max(0,1-(now-(S.fireT||0))/220),len=(L[9]||600)*S3,w=[0.058,0.115,0.185,0.3][Math.min(3,beam-1)]*(1+1.6*kick*kick);S.pb=beam;
    const end=ringC.clone().addScaledVector(fwd,len);S.beam.visible=S.ring.visible=true;lgAim(S.beam,ringC,end);S.beam.scale.x=S.beam.scale.y=w;
    _lgBeamM.uniforms.uT.value=now/1000;S.ring.position.copy(ringC);S.ring.lookAt(end);S.ring.scale.setScalar(0.8+0.25*Math.sin(now/60));
    lgEmpBeam(S,empOn,ringC,end,fwd,w,now);if(empOn){S.beam.scale.x=S.beam.scale.y=w*1.45;}   // บัฟ: คลื่นวิ่งตามลำ + สายพลังแตกออกจากลำแล้วโค้งกลับเข้าลำ
    LREQ.push({x:ringC.x,y:ringC.y,z:ringC.z,col:'#ffd36a',int:0.7,dist:4});
}
  else if(S.beam){S.beam.visible=S.ring.visible=false;lgEmpBeam(S,false);}
  // ---------- โล่รังผึ้ง (ผู้ใช้ 2026-11-16 ref: กำแพงหกเหลี่ยมโค้งรอบหน้า คริสตัลมาก = กว้าง/ใหญ่) ----------
  lgShield(S,o,p,n,shOn&&alive,now,dt);
  // ---------- สายลิงก์ ----------
  const lp=L[2];
  if(lp&&alive){if(!S.link)S.link=lgTube(lgLinkMat(),0.09);S.link.visible=true;
    const a=o.g.position.clone().add(new THREE.Vector3(0,1.3,0));let b;
    if(L[1]&&L[1]!=='P'){const ao=PM3.get(L[1]);b=ao?ao.g.position.clone().add(new THREE.Vector3(0,1.3,0)):lgWorld(lp[0],lp[1],1.3);}else b=lgWorld(lp[0],lp[1],1.0);
    // สายลิงก์พุ่งออกจากอกเราไปหาคู่หู (0.6 วิ) มีหัวแสงนำ → ถึงแล้วแวบแสงที่คู่หู • ตอนหลุด/เรียกคืน สายหดกลับเข้าหาเรา
    const tgt=L[1]||'P';if(S.lkTo!==tgt){S.lkTo=tgt;S.lkT0=now;S.lkHit=0;}
    const gk=clamp((now-S.lkT0)/600,0,1),ge=1-(1-gk)*(1-gk),bb=a.clone().lerp(b,ge);S.lkA=a.clone();S.lkB=b.clone();S.unT0=0;
    lgAim(S.link,a,bb);_lgLinkM.uniforms.uT.value=now/1000;
    if(!S.lkHead){S.lkHead=new THREE.Sprite(new THREE.SpriteMaterial({map:LGV.glowT||(LGV.glowT=lgGlowTex()),color:hdr('#fff0c0',2.6),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(S.lkHead);}
    S.lkHead.visible=gk<1;if(gk<1){S.lkHead.position.copy(bb);S.lkHead.scale.setScalar(0.7);}
    if(gk>=1&&!S.lkHit){S.lkHit=1;const bx=b.x/S3+MW/2,by=b.z/S3+MH/2;fxPlay('light/crystal_in',{x:bx,y:by,h:b.y-GY(bx,by),aim:false});}
    if(L[1]==='P'){if(!S.prism){S.prism=lgCrystalMesh(2.2);scene.add(S.prism);}S.prism.visible=true;S.prism.position.copy(lgWorld(lp[0],lp[1],1.0+0.1*Math.sin(now/400)));S.prism.rotation.y=now/700;}
    else if(S.prism)S.prism.visible=false;}
  else{if(S.prism)S.prism.visible=false;
    if(S.lkTo&&S.lkA){S.lkTo=null;S.unT0=now;}   // หดกลับ
    const uk=S.unT0?clamp((now-S.unT0)/420,0,1):1;
    if(S.link&&uk<1&&alive){const a=o.g.position.clone().add(new THREE.Vector3(0,1.3,0)),e=uk*uk;S.link.visible=true;lgAim(S.link,a,S.lkB.clone().lerp(a,e));if(S.lkHead){S.lkHead.visible=true;S.lkHead.position.copy(S.lkB.clone().lerp(a,e));}}
    else{if(S.link)S.link.visible=false;if(S.lkHead)S.lkHead.visible=false;S.unT0=0;}}
  // ---------- คริสตัลที่ได้จากคู่หู (หมุนรอบตัวช้า ๆ) ----------
  const an=L[3]|0;
  while(S.ally.length<an){const c=lgCrystalMesh(0.85);scene.add(c);S.ally.push(c);}
  for(let i=0;i<S.ally.length;i++){const c=S.ally[i];c.visible=alive&&!ward&&i<an;if(!c.visible)continue;const a=-S.t*0.7+i*Math.PI*2/Math.max(1,an);
    c.scale.setScalar(LGV.empA[p.id]&&now-LGV.empA[p.id]<300?1.05+0.08*Math.sin(now/90+i):0.85);c.position.copy(o.g.position).add(new THREE.Vector3(Math.cos(a)*0.62,1.55+0.06*Math.sin(S.t*2+i),Math.sin(a)*0.62));c.rotation.y=S.t;}
  if(an>0&&alive&&!ward){if(!S.aura){S.aura=new THREE.Mesh(new THREE.CircleGeometry(0.9,40),new THREE.MeshBasicMaterial({map:LGV.glowT||(LGV.glowT=lgGlowTex()),color:hdr('#ffb847',1),transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,depthWrite:false}));S.aura.rotation.x=-Math.PI/2;scene.add(S.aura);}
    S.aura.visible=true;S.aura.position.copy(o.g.position).add(new THREE.Vector3(0,0.04,0));S.aura.scale.setScalar(0.8+0.15*an);S.aura.material.opacity=0.28+0.1*an+0.05*Math.sin(S.t*3);}else if(S.aura)S.aura.visible=false;   // ออร่าทองที่เท้าคู่หู
  // ---------- วงฮีล Sanctum (ผู้ใช้ 2026-11-17): คริสตัลนีออนทองใหญ่ค่อย ๆ ลอยขึ้น • พื้นรังผึ้งเรืองจาง ๆ + ขอบทอง • แสงลอยขึ้นทั่ววง • คริสตัลที่ส่งเข้ามาวนรอบ ----------
  const Z=L[7];
  if(Z){if(!S.san){S.san=lgNeonCrystal(4.5);S.sanR=new THREE.Mesh(new THREE.RingGeometry(0.95,1,72),new THREE.MeshBasicMaterial({color:hdr('#ffd36a',1.4),transparent:true,opacity:0.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));S.sanR.rotation.x=-Math.PI/2;
      S.sanF=new THREE.Mesh(new THREE.CircleGeometry(1,72),new THREE.MeshBasicMaterial({map:lgHoneyTex(),color:hdr('#ffc04a',1),transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,depthWrite:false}));S.sanF.rotation.x=-Math.PI/2;S.sanO=[];S.sanM=[];scene.add(S.san,S.sanR,S.sanF);}
    const P=lgWorld(Z[0],Z[1],0),nz=Z[2]|0,Rt=(LT_SC.r+LT_SC.rUp*Math.max(0,nz-1))*S3;if(!S.sanRc){S.sanRc=Rt;S.sanRv=0;}else{const h=Math.min(dt,0.05);S.sanRv+=((Rt-S.sanRc)*40-S.sanRv*7)*h;S.sanRc+=S.sanRv*h;}const R=S.sanRc;if(!S.sanT0||S.sanKey!==Z[0]+','+Z[1]){S.sanT0=now;S.sanKey=Z[0]+','+Z[1];S.sanN=nz;}
    if(nz>(S.sanN|0)){S.sanPulse=now;S.sanWr0=S.sanRc;S.sanWr1=Rt;}S.sanN=nz;const pulse=S.sanPulse?Math.max(0,1-(now-S.sanPulse)/500):0;
    const rise=clamp((now-S.sanT0-250)/900,0,1),re=1-(1-rise)*(1-rise);
    S.san.visible=S.sanR.visible=S.sanF.visible=true;const gt=1+0.3*Math.max(0,nz-1);if(!S.sanG){S.sanG=gt;S.sanGv=0;}else{const h=Math.min(dt,0.05);S.sanGv+=((gt-S.sanG)*30-S.sanGv*5)*h;S.sanG+=S.sanGv*h;}const NS=4.5*(0.4+0.6*re)*S.sanG*(1+0.1*pulse);S.san.scale.setScalar(NS);S.san.position.copy(P).add(new THREE.Vector3(0,(0.3+1.0*re)+0.38*NS*0.33*1.15+0.25*Math.sin(now/700),0));S.san.rotation.set(0.05*Math.sin(now/1300),now/1100,0.05*Math.cos(now/1500));{const H=S.san.userData.halo;if(H){H[0].rotation.z=now/600;H[1].rotation.z=-now/800;}}{const U=S.san.userData,L=Math.max(0,(S.sanG-1)/0.3),bt=0.08*Math.sin(now/260);if(U.core){U.core.material.opacity=Math.min(0.95,0.5+0.15*L+0.3*pulse+bt);U.heart.material.opacity=Math.min(1,0.35+0.25*L+0.5*pulse+bt);const hs=1+0.18*L;U.heart.scale.set(0.2*hs,0.34*hs,0.2*hs);U.glow.material.opacity=Math.min(0.65,0.3+0.1*L+0.25*pulse);}}
    S.sanR.position.copy(P).add(new THREE.Vector3(0,0.05,0));S.sanR.scale.setScalar(R*Math.min(1,0.2+rise*1.5));S.sanR.material.opacity=Math.min(1,0.45+0.2*Math.max(0,(S.sanG-1)/0.3)+0.4*pulse);
    S.sanF.position.copy(P).add(new THREE.Vector3(0,0.04,0));S.sanF.scale.setScalar(R*Math.min(1,0.2+rise*1.5));S.sanF.rotation.z=now/9000;S.sanF.material.opacity=Math.min(0.9,0.2+0.15*Math.max(0,(S.sanG-1)/0.3)+0.35*pulse)*(0.85+0.15*Math.sin(now/300));
    if(!S.sanWv){S.sanWv=new THREE.Mesh(new THREE.RingGeometry(0.94,1,72),new THREE.MeshBasicMaterial({color:hdr('#ffe08a',1.2),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));S.sanWv.rotation.x=-Math.PI/2;scene.add(S.sanWv);}
    {const e=S.sanPulse?clamp((now-S.sanPulse)/700,0,1):1,eo=1-(1-e)*(1-e)*(1-e);S.sanWv.visible=e<1;if(e<1){S.sanWv.position.copy(P).add(new THREE.Vector3(0,0.07,0));S.sanWv.scale.setScalar(0.3*(S.sanWr0||R)+((S.sanWr1||R)*1.08-0.3*(S.sanWr0||R))*eo);S.sanWv.material.opacity=0.55*(1-e);}}
    while(S.sanO.length<nz){const c=lgCrystalMesh(1);scene.add(c);S.sanO.push(c);}
    for(let i=0;i<S.sanO.length;i++){const c=S.sanO[i];c.visible=i<nz&&now-S.sanT0>300;const a=now/450+i*Math.PI*2/Math.max(1,nz);const cy=S.san.position.y-P.y,orr=0.3*NS*0.33+0.55;c.position.copy(P).add(new THREE.Vector3(Math.cos(a)*orr,cy+0.12*Math.sin(now/400+i*2),Math.sin(a)*orr));c.rotation.y=now/300;c.scale.setScalar(1.8);c.traverse(m=>m.renderOrder=9);}
    // แสงเส้นตั้งลอยขึ้นเบา ๆ ทั่ววง (แทนคลื่น — ผู้ใช้ 2026-11-17) • จำนวนตามคริสตัล
    if(!S.sanM.length)for(let k=0;k<36;k++){const g=new THREE.Sprite(new THREE.SpriteMaterial({map:LGV.glowT||(LGV.glowT=lgGlowTex()),color:hdr('#ffe2a0',1.3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(g);S.sanM.push({g,t:Math.random(),x:0,z:0,sp:1});}
    const live=12+8*nz;for(let k=0;k<S.sanM.length;k++){const M=S.sanM[k];M.t+=dt/(2.2*M.sp);if(M.t>=1){M.t-=1;M.sp=0.8+Math.random()*0.5;const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*R*0.95;M.x=Math.cos(a)*r;M.z=Math.sin(a)*r;}
      M.g.visible=rise>0.2&&k<live;const f=Math.sin(M.t*Math.PI);M.g.position.copy(P).add(new THREE.Vector3(M.x,0.3+M.t*2.6,M.z));M.g.scale.set(0.09*f+0.01,(0.7+0.5*M.sp)*f+0.05,1);M.g.material.opacity=0.85*f;}
    if(!S.sanTw){S.sanTw=[];for(let k=0;k<40;k++){const g=new THREE.Sprite(new THREE.SpriteMaterial({map:LGV.glowT||(LGV.glowT=lgGlowTex()),color:hdr(k%3?'#ffe9a8':'#d8ffb0',1.4),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(g);S.sanTw.push({g,t:Math.random(),x:0,y:0,z:0});}}
    for(let k=0;k<S.sanTw.length;k++){const M=S.sanTw[k];M.t+=dt/1.3;if(M.t>=1){M.t-=1;const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*R*0.95;M.x=Math.cos(a)*r;M.z=Math.sin(a)*r;M.y=0.15+Math.random()*1.6;}
      M.g.visible=rise>0.2&&k<16+8*nz;const f=Math.sin(M.t*Math.PI);M.g.position.copy(P).add(new THREE.Vector3(M.x+Math.sin(M.t*6+k)*0.15,M.y+M.t*0.5,M.z));M.g.scale.setScalar(0.16*f*f+0.01);}   // ประกายฮีลกระพริบลอยเบา ๆ ทั่ววง
    LREQ.push({x:P.x,y:P.y+0.3,z:P.z,col:'#ffb847',int:0.5+0.2*nz+pulse*0.5,dist:6+2*nz});}
  else if(S.san){S.sanW=0;S.sanRc=0;S.sanG=0;S.san.visible=S.sanR.visible=S.sanF.visible=false;if(S.sanWv)S.sanWv.visible=false;for(const c of S.sanO)c.visible=false;for(const M of S.sanM)M.g.visible=false;if(S.sanTw)for(const M of S.sanTw)M.g.visible=false;S.sanT0=0;}
  // ---------- กับดัก Veiled Shard (เจ้าของ/ทีมเห็นจาง ๆ • ศัตรูไม่เห็นหลังวาง) ----------
  const W=L[8];
  if(W){const myTeam=(VIEW.cur&&VIEW.cur.P.find(q=>q.id===NET.myId))?.tm,same=p.id===NET.myId||myTeam!==undefined&&myTeam===p.tm;
    if(!S.veil){S.veil=lgCrystalMesh(1.2);S.veilR=new THREE.Mesh(new THREE.RingGeometry(0.95,1,64),new THREE.MeshBasicMaterial({color:hdr('#fff1c0',1.8),transparent:true,opacity:0.7,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));S.veilR.rotation.x=-Math.PI/2;scene.add(S.veil,S.veilR);}
    const P=lgWorld(W[0],W[1],0.3);S.veil.position.copy(P);S.veil.visible=same||W[2];S.veil.traverse(m=>{if(m.material)m.material.opacity=W[2]?0.9:0.25;});
    S.veilR.visible=!!W[2];if(W[2]){S.veilT=(S.veilT||0)+dt;const k=Math.max(0.05,1-S.veilT/LT_VS.arm);S.veilR.position.copy(P).add(new THREE.Vector3(0,-0.25,0));S.veilR.scale.setScalar(LT_VS.r*S3*k);}else S.veilT=0;}
  else if(S.veil){S.veil.visible=S.veilR.visible=false;S.veilT=0;}
}
function lgBaseObjects(s){return [...s.cr,...s.ally,s.beam,s.ring,s.shF,s.shE,s.shG,s.orbT,s.aura,s.lkHead,...(s.ew||[]),...(s.ea||[]),...(s.shGl||[]),...(s.mote||[]).map(M=>M.g),s.link,s.prism,s.san,s.sanR,s.sanF,s.sanWv,...(s.sanO||[]),...(s.sanM||[]).map(M=>M.g),...(s.sanTw||[]).map(M=>M.g),s.veil,s.veilR];}
function lgClearBase(s){for(const m of lgBaseObjects(s))if(m)m.visible=false;}
function lgClear(s){
  lgClearBase(s);
  for(const m of [s.sovereign?.g,s.ultBeam,s.returnMark,s.arrivalRing,...(s.wardCrystals||[])])if(m)m.visible=false;
}
function lightDropView(id){
  const s=LGV.st.get(id);if(!s)return;
  for(const m of [...lgBaseObjects(s),s.sovereign?.g,s.returnMark,s.arrivalRing,s.ultBeam,...(s.wardCrystals||[])])if(m)disposeObj(m);
  LGV.st.delete(id);
}
// ---------- เหตุการณ์ ----------
// คริสตัลแวบ a→b: ปริซึมหดที่ a, เส้นแสงแวบ 0.1 วิ, ปริซึมกางที่ b (0.05 วิ ให้หลัง)
function lgBlip(a,b){const g=v=>[v.x/S3+MW/2,v.z/S3+MH/2];const[ax,ay]=g(a),[bx,by]=g(b);fxPlay('light/crystal_out',{x:ax,y:ay,h:a.y-GY(ax,ay),aim:false});
  const m=lgTube(lgBeamMat(),1);lgAim(m,a,b);m.scale.x=m.scale.y=0.06;LGV.fx.push({m:null,t:0,max:0.12,fn:k=>{m.scale.x=m.scale.y=0.06*(1-k);},end:()=>scene.remove(m)});
  later(0.05,()=>fxPlay('light/crystal_in',{x:bx,y:by,h:b.y-GY(bx,by),aim:false}));}
// คริสตัลพุ่งโค้งมีหางแสง a→b แล้วเรียก done ตอนถึง
function lgArcFx(a,b,t,arc,done){const c=lgCrystalMesh(1.2),tr=lgTube(lgBeamMat(),1),pts=[];scene.add(c);tr.visible=false;
  LGV.fx.push({m:null,t:0,max:t,fn:k=>{const e=k*k;const P=a.clone().lerp(b,e);P.y+=Math.sin(k*Math.PI)*arc*(1-k*0.3);c.position.copy(P);c.rotation.y+=0.4;pts.push(P.clone());if(pts.length>5)pts.shift();if(pts.length>1){tr.visible=true;lgAim(tr,pts[0],P);tr.scale.x=tr.scale.y=0.05;}},
    end:()=>{scene.remove(c);scene.remove(tr);if(done)done();}});}
function lgFlyFx(a,b,t,scale){const c=lgCrystalMesh(scale||1);scene.add(c);LGV.fx.push({m:c,a,b,t:0,max:t,arc:0.6});}
function lightFxTick(dt){for(let i=LGV.fx.length-1;i>=0;i--){const f=LGV.fx[i];f.t+=dt;const k=Math.min(1,f.t/f.max);
  if(f.m){f.m.position.lerpVectors(f.a,f.b,k);f.m.position.y+=Math.sin(k*Math.PI)*(f.arc||0);f.m.rotation.y+=dt*8;}
  if(f.fn)f.fn(k,f);
  if(k>=1){if(f.m)scene.remove(f.m);if(f.end)f.end(f);LGV.fx.splice(i,1);}}}
function lightEfx(ev){
  const z=ev.z,x=ev.x,y=ev.y,H=ev.h!==undefined?ev.h:0,me=myPos(),near=!me||Math.hypot(x-me.x,y-me.y)<1100;
  switch(z){
    case 'lgsanadd':{const o=PM3.get(ev.id);if(o)castStart(o,'line');const a=o&&o.tip?o.tip.getWorldPosition(new THREE.Vector3()):lgWorld(x,y,H);lgArcFx(a,lgWorld(ev.x2,ev.y2,1.4),0.4,1.6,()=>fxPlay('light/crystal_in',{x:ev.x2,y:ev.y2,h:1.4,aim:false}));if(near)snd('cast_pull',ev);return true;}   // เพิ่ม: พุ่งโค้งเข้าวง (วงสว่างขึ้นใน lightFX)
    case 'lgsend':{   // Crystal Bond ส่ง: สะบัดไม้ชี้หาคู่หู • คริสตัลแวบหายที่เรา → เส้นแสงแวบ → แวบโผล่ที่คู่หู
      const o=PM3.get(ev.id);if(o)castStart(o,'line');lgBlip(lgWorld(x,y,H+0.1),lgWorld(ev.x2,ev.y2,(ev.h2||1.4)+0.15));if(near)snd('cast_pull',ev);return true;}
    case 'lgrecall':{   // กดค้างเรียกคืน: กำมือดึงกลับ • คริสตัลทุกชิ้นแวบจากคู่หูกลับมาหาเรา
      const o=PM3.get(ev.id),S=LGV.st.get(ev.id),tid=S&&S.allyId,ao=tid!=null&&PM3.get(tid);if(o)castStart(o,'pullback');
      const me=lgWorld(x,y,H+0.2);if(ao){for(let k=0;k<(S.sentN||1);k++){const a=ao.g.position.clone().add(new THREE.Vector3(Math.cos(k*2.1)*0.6,1.55,Math.sin(k*2.1)*0.6));later(k*0.06,()=>lgBlip(a,me.clone().add(new THREE.Vector3(Math.cos(k*2.1)*0.7,0,Math.sin(k*2.1)*0.7))));}}
      else FX.flashSprite(x,y,H+0.1,'#ffd36a',0.2,1,0.1,1);if(near)snd('cast_pull',ev);return true;}
    case 'lglink':case 'lgprism':FX.flashSprite(x,y,H+1.3,'#fff1c0',0.25,1.2,0.1,1);if(near)snd('buff',ev);return true;
    case 'lgunlink':FX.flashSprite(x,y,H+1.3,'#ffd36a',0.2,1,0.1,1);return true;
    case 'lgbahit':FX.flashSprite(x,y,H,'#fff1c0',0.12,0.8,0.08,0.8);return true;
    case 'lgvol':{   // Shard Volley: คริสตัลหมุนเข้าปลายไม้ (0.15 วิ) → ชี้ไม้ → แวบไปจุด (ตัวใหญ่) → หมุนชาร์จเร็วขึ้น/สว่างขึ้น + วงเตือนพื้น
      const o=PM3.get(ev.id);if(o)castStart(o,'line');const C=ev.t||LT_VO.charge,W=ev.w||LT_VO.wind,ST=ev.st||LT_VO.step,r=(ev.r||LT_VO.r)/20,S=LGV.st.get(ev.id);
      const tip=()=>o&&o.tip?o.tip.getWorldPosition(new THREE.Vector3()):lgWorld(x,y,H);
      (ev.pts||[]).forEach((q,i)=>{const b=lgWorld(q[0],q[1],1.2),c=lgCrystalMesh(1),from=S&&S.cr[i]&&S.cr[i].visible!==undefined?S.cr[i].position.clone():tip();scene.add(c);let bl=0;
        const B=W+i*ST,T=B+C;   // ชิ้นที่ i: รอที่ปลายไม้จนถึงคิว → แวบไปกลางวงของตัวเอง → หมุนกลางวงขณะวงเตือนนับ (ช้าแล้วเร็วขึ้น)
        LGV.fx.push({m:null,t:0,max:T,fn:k=>{const tt=k*T;
          if(tt<B){const e=Math.min(1,tt/W),tp=tip(),a=Math.PI*2*(tt/W)+i*2.1,rr=0.25*(1-e)+(e>=1?0.32:0);c.position.copy(from).lerp(tp,e*e).add(new THREE.Vector3(Math.cos(a)*rr,0.05*i,Math.sin(a)*rr));c.scale.setScalar(1);c.rotation.y=a;}   // รอคิว: วนรอบปลายไม้
          else{if(!bl){bl=1;lgBlip(tip(),b.clone());fxPlay('light/volley_warn',{x:q[0],y:q[1],h:0,p:{r,t:C},aim:false});}
            const u=(tt-B)/C;c.visible=tt>B+0.05;c.position.copy(b).add(new THREE.Vector3(0,0.12*Math.sin(u*Math.PI*2),0));c.scale.setScalar(2.6+0.6*u);c.rotation.y=3*u+14*u*u;}},
          end:()=>scene.remove(c)});});
      if(near)snd('cast_pull',ev);return true;}
    case 'lgvolboom':{   // ระเบิด: เสาแสง + เศษคริสตัล + คลื่นพื้น • คริสตัลบินโค้งกลับหาเราช้า ๆ (~0.8 วิ)
      const r=(ev.r||150)/20,o=PM3.get(ev.id);
      for(const q of ev.pts||[]){fxPlay('light/volley_boom',{x:q[0],y:q[1],h:0,p:{r},aim:false});
        const a=lgWorld(q[0],q[1],1.2),c=lgCrystalMesh(1);scene.add(c);
        LGV.fx.push({m:null,t:0,max:LT_VO.back,fn:k=>{const b=o?o.g.position.clone().add(new THREE.Vector3(0,1.45,0)):lgWorld(x,y,1.45),e=k*k*(3-2*k);c.position.copy(a).lerp(b,e);c.position.y+=Math.sin(k*Math.PI)*1.2;c.rotation.y+=0.2;c.scale.setScalar(0.4+0.6*Math.min(1,k*3));},end:()=>scene.remove(c)});}
      if(near){snd('boom',ev);shake(3);}return true;}
    case 'lgemp':{const o=PM3.get(ev.id);if(o){o.empT=0;o.empOn=1;o.empB=0;}   // ท่า/เอฟเฟกต์ทำต่อใน lightFX (lgEmpPose)
      if(ev.t!=null){const a=PM3.get(ev.t);if(a)later(0.4,()=>{const P=a.g.position;fxPlay('light/crystal_in',{x:P.x/S3+MW/2,y:P.z/S3+MH/2,h:1.5,aim:false});});}
      if(near)snd('buff',ev);return true;}
    case 'lgbolt':{   // Empower: เศษคริสตัลแสงเล็กพุ่งโค้งมีหางทองไปหาศัตรู → แตกประกาย
      const a=lgWorld(x,y,ev.h||1.6),b=lgWorld(ev.x2,ev.y2,ev.h2||1.2),c=lgCrystalMesh(0.55);scene.add(c);
      const side=new THREE.Vector3(-(b.z-a.z),0,b.x-a.x).normalize().multiplyScalar((Math.random()<0.5?-1:1)*(0.6+Math.random()*0.6)),pts=[];
      const tr=lgTube(lgBeamMat(),1);tr.visible=false;
      LGV.fx.push({m:null,t:0,max:0.28,fn:k=>{const P=a.clone().lerp(b,k).addScaledVector(side,Math.sin(k*Math.PI)).add(new THREE.Vector3(0,Math.sin(k*Math.PI)*0.4,0));c.position.copy(P);c.rotation.y+=0.5;
        pts.push(P.clone());if(pts.length>4)pts.shift();if(pts.length>1){tr.visible=true;lgAim(tr,pts[0],P);tr.scale.x=tr.scale.y=0.035;}},
        end:()=>{scene.remove(c);scene.remove(tr);fxPlay('light/bolt_hit',{x:ev.x2,y:ev.y2,h:ev.h2||1.2,aim:false});}});return true;}
    case 'lgsan':{   // Sanctum: ชี้ไม้ลงจุด → คริสตัลพุ่งโค้งมีหางปักพื้น → แรงกระแทก (คริสตัลนีออนใหญ่ลอยขึ้นใน lightFX)
      const o=PM3.get(ev.id);if(o)castStart(o,'line');const a=o&&o.tip?o.tip.getWorldPosition(new THREE.Vector3()):lgWorld(x,y,1.4);
      lgArcFx(a,lgWorld(x,y,0.1),0.42,2.2,()=>{fxPlay('light/san_plant',{x,y,h:0,aim:false});if(near)shake(0.15);});if(near)snd('buff',ev);return true;}
    case 'lgsanheal':for(const id of ev.ids||[]){const o=PM3.get(id);if(o)fxPlay('light/heal_tick',{x:o.g.position.x/S3+MW/2,y:o.g.position.z/S3+MH/2,h:0,follow:id,p:{c:Math.min(1.6,0.6+0.35*(ev.n||1))},aim:false});}return true;
    case 'lgsanend':{   // จบ/เรียกคืน: คริสตัลใหญ่แตกเป็นแสง • คริสตัลที่วนอยู่แวบกลับหาเรา
      fxPlay('light/san_end',{x,y,h:0,aim:false});const S=LGV.st.get(ev.id),o=PM3.get(ev.id);
      if(S&&S.sanO&&o){S.sanO.forEach((c,i)=>{if(!c.visible)return;const from=c.position.clone(),to=o.g.position.clone().add(new THREE.Vector3(Math.cos(i*2.1),1.45,Math.sin(i*2.1)));later(0.05+i*0.06,()=>lgBlip(from,to));});}
      return true;}
    case 'lgveil':{const o=PM3.get(ev.id),a=o?o.g.position.clone().add(new THREE.Vector3(0,1.4,0)):lgWorld(x,y,1.4);lgFlyFx(a,lgWorld(x,y,0.3),0.3);if(near)snd('cast_pull',ev);return true;}
    case 'lgveilarm':if(near)snd('buff',ev);return true;
    case 'lgveilboom':{const P=lgWorld(x,y,0),col=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.8,6,24,1,true),new THREE.MeshBasicMaterial({color:hdr('#fff1c0',2),transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
      col.position.copy(P).add(new THREE.Vector3(0,3,0));scene.add(col);LGV.fx.push({m:null,t:0,max:0.5,fn:k=>{col.material.opacity=0.8*(1-k);col.scale.set(1+k,1,1+k);},end:()=>scene.remove(col)});
      ring(x,y,'#ffd36a',ev.r||200,0.4,0.1);burst(x,y,'#ffe9a8',24,260,0.5,2.4,{h:1,g:1});if(near){snd('boom',ev);shake(4);}return true;}
    case 'lgstep':{   // Light Step: แตกเป็นเศษแสง → ก้อนแสงพุ่ง 0.15 วิ (มีหาง) → รวมร่างที่จุดใหม่
      const S=ev.id!=null&&lgState(ev.id);
      if(S){S.step={t0:LGV.now||performance.now(),x,y,a0:lgWorld(x,y,ev.h||0),a:lgWorld(x,y,(ev.h||0)+1.1),b:lgWorld(ev.x2,ev.y2,(ev.h||0)+1.1),x2:ev.x2,y2:ev.y2,h:ev.h||0,link:ev.n|0,inD:0};}
      if(near)snd('whoosh',ev);return true;}
    case 'lgstepboom':fxPlay('light/step_boom',{x,y,h:0,p:{r:(ev.r||150)/20},aim:false});if(near)shake(2);return true;
    case 'lgultneed':if(ev.id===NET.myId)toast('ลิงก์คู่หูด้วย Crystal Bond ก่อนใช้ Radiant Sovereign');return true;
    case 'lgult':ring(x,y,'#ffc861',45,.52,H+.06);FX.flashSprite(x,y,H+1.6,'#fff1c0',.4,2.3,.22,1.8);if(near)snd('buff',ev);return true;
    case 'lgultform':FX.flashSprite(x,y,H+.8,'#fff1c0',.30,2.30,.16,1.24);
      burst(x,y,'#ffcd68',16,115,.45,1.8,{h:H+.83,g:0});return true;
    case 'lgultend':FX.flashSprite(x,y,H+1.1,'#ffe895',.24,1.75,.14,1.5);return true;
    case 'lgultstrike':{
      const a=lgWorld(x,y,H),b=lgWorld(ev.x2,ev.y2,ev.h2),ray=lgTube(lgUltBeamMat(),1);
      lgAim(ray,a,b);
      LGV.fx.push({t:0,max:.46,fn:k=>{ray.scale.x=ray.scale.y=.46*(1-.87*k);},end:()=>disposeObj(ray)});
      ring(ev.x2,ev.y2,'#ffe398',ev.r,.52,ev.h2+.10);
      FX.flashSprite(ev.x2,ev.y2,ev.h2+.42,'#fff1c0',.36,3.3,.19,2.45);
      burst(ev.x2,ev.y2,'#ffcf55',28,245,.55,2.3,{h:ev.h2+.32,g:1});
      if(near)snd('boom',ev);return true;
    }
  }
  return false;
}

// หัวหันไปทางเล็ง: ตั้งแบบค่าสัมบูรณ์ทุกเฟรม (กระดูกหัวใน idle เป็นค่าคงที่ mixer ไม่เขียนซ้ำ → ถ้าใช้ += หัวจะหมุนสะสม)
const _lgHq=new THREE.Quaternion(),_lgHy=new THREE.Vector3(0,1,0);
function lightHeadPose(o){
  const hb=o.fileModel&&(o.lgHead!==undefined?o.lgHead:(o.lgHead=o.fileModel.getObjectByName('head')||null));if(!hb)return;
  if(o.lgHeadSet&&hb.quaternion.equals(o.lgHeadSet))hb.quaternion.copy(o.lgHeadBase);   // mixer ไม่ได้เขียนทับ = คืนค่าเดิมก่อน
  const y=o.lgHeadYaw||0;if(Math.abs(y)<0.005){o.lgHeadSet=null;return;}
  o.lgHeadBase=(o.lgHeadBase||new THREE.Quaternion()).copy(hb.quaternion);
  hb.quaternion.multiply(_lgHq.setFromAxisAngle(_lgHy,y));o.lgHeadSet=(o.lgHeadSet||new THREE.Quaternion()).copy(hb.quaternion);}
