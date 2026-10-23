// ---------- ระบบผ้า (เสื้อคลุมพลิ้วตามการเคลื่อนที่) ----------
function makeCloak(outerCol,innerCol,rTop,rBot,h,gap,shared){
  const geo=new THREE.CylinderGeometry(rTop,rBot,h,26,10,true,gap/2,Math.PI*2-gap);   // geometry แยกต่อตัว (ผ้าขยับเอง)
  const mk=o=>shared?sMat(o):new THREE.MeshStandardMaterial(o);
  const outer=new THREE.Mesh(geo,mk({color:outerCol,roughness:0.92,side:THREE.FrontSide}));
  const inner=new THREE.Mesh(geo,mk({color:innerCol,roughness:0.8,side:THREE.BackSide}));
  return {geo,outer,inner,rest:Float32Array.from(geo.attributes.position.array),h,dx:0,dz:0,vx:0,vz:0};
}
// lvx/lvz = ความเร็วในแกนของตัวละคร (หน่วย/วินาที) — ชายผ้าจะลากตามหลังแบบสปริง
function updateCloth(c,lvx,lvz,speed,now,dt){
  // กัน NaN: ถ้าเคยพังครั้งเดียวผ้าจะหายไปถาวร (bounding sphere = NaN) — รีเซ็ตสปริงแทน
  if(!Number.isFinite(lvx))lvx=0;if(!Number.isFinite(lvz))lvz=0;if(!Number.isFinite(speed))speed=0;if(!(dt>0))dt=0;else if(dt>0.05)dt=0.05;
  if(!Number.isFinite(c.dx+c.dz+c.vx+c.vz)){c.dx=c.dz=c.vx=c.vz=0;c.fixBS=true;}
  const tX=clamp(-lvx*0.075,-0.9,0.9),tZ=clamp(-lvz*0.075,-0.9,0.9);
  c.vx+=((tX-c.dx)*55-c.vx*7)*dt;c.vz+=((tZ-c.dz)*55-c.vz*7)*dt;
  c.dx+=c.vx*dt;c.dz+=c.vz*dt;
  const pos=c.geo.attributes.position.array,rest=c.rest,hh=c.h/2,t=now*0.008;
  const amp=0.018+Math.min(0.07,speed*0.005),disp=Math.hypot(c.dx,c.dz),flr=Math.min(0.3,speed*0.018),kk=c.kick||0;
  for(let i=0;i<pos.length;i+=3){
    const rx=rest[i],ry=rest[i+1],rz=rest[i+2];
    const w=Math.pow(Math.max(0,(hh-ry)/c.h),1.5);   // max(0): ry อาจเกิน hh นิดหน่อยจากทศนิยม → pow(ลบ) = NaN
    const fl=Math.sin(t+ry*4.5+Math.atan2(rx,rz)*3)*amp*w;
    const f=1+flr*w;
    pos[i]=rx*f+c.dx*w+fl*rz*2;
    pos[i+1]=ry+disp*0.5*w*w;
    pos[i+2]=rz*f+c.dz*w-fl*rx*2;
    if(kk>0){const fr=Math.pow(Math.max(0,rz/(Math.hypot(rx,rz)||1)),1.5)*w*kk;pos[i+1]+=fr*0.75;pos[i+2]+=fr*0.45;}
  }
  c.geo.attributes.position.needsUpdate=true;c.geo.computeVertexNormals();
  if(c.fixBS||!c.geo.boundingSphere||!Number.isFinite(c.geo.boundingSphere.radius)){c.geo.computeBoundingSphere();c.fixBS=false;}
}

// ไม้สำเร็จรูป (WANDN js/02) → กลุ่ม mesh ในแกนของ wandG: โคน y −0.56 • ด้ามถึง −0.74 (มืออยู่ −0.64) • ปลาย −1.12
function wandNamed(parent,W,M){
  const G=new THREE.Group();parent.add(G);
  const yb=-0.56,yh=-0.74,yt=-1.12,L=yh-yt,em=(c,k)=>sMat({color:c,emissive:c,emissiveIntensity:k||1.4,roughness:0.35}),
    put=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x||0,y,z||0);G.add(m);return m;},
    rr=u=>W.r0+(W.r1-W.r0)*u,wob=u=>W.wb?Math.sin(u*9)*W.wb:0,yU=u=>yh-L*u;   // u: 0 = ด้าม → 1 = ปลาย
  const tube=(pts,r,mat)=>put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),Math.max(8,pts.length*3),r,5,false),mat,0,0);
  // ก้าน: 8 ท่อนเรียว สีไล่ตาม W.sh (ปลาย→โคน)
  const N=8,C=W.sh,shM=C.map(c=>M('#'+new THREE.Color(c).multiplyScalar(1.25).getHexString(),W.ice?0.25:0.5));   // สีสว่างขึ้นนิด (ไม่ใช้ emissive = ยังรวม mesh ได้ → draw call น้อย)
  for(let i=0;i<N;i++){const u0=i/N,u1=(i+1)/N,ci=Math.min(C.length-1,Math.floor((1-(u0+u1)/2)*C.length));
    const m=put(new THREE.CylinderGeometry(rr(u0),rr(u1),L/N+0.002,10),shM[ci],wob((u0+u1)/2),yU((u0+u1)/2));m.rotation.z=(wob(u1)-wob(u0))/(L/N);}
  const helix=(turns,ph,rk,steps)=>Array.from({length:steps+1},(_,i)=>{const u=i/steps,a=u*turns*Math.PI*2+ph,r=rr(u)*rk;return new THREE.Vector3(Math.cos(a)*r+wob(u),yU(u),Math.sin(a)*r);});
  if(W.sp){tube(helix(5,0,1.02,60),0.0028,M(W.sp,0.4));tube(helix(5,Math.PI,1.0,60),0.0016,M(W.sp,0.4));}
  if(W.zg)tube(Array.from({length:13},(_,i)=>{const u=0.04+i*0.075;return new THREE.Vector3((i%2?-1:1)*rr(u)*0.75,yU(u),rr(u)*0.75);}),0.0022,em(W.zg,1.8));
  if(W.ck)for(let i=0;i<7;i++){const u=0.08+i*0.12,a=i*2.1;const m=put(new THREE.BoxGeometry(0.004,0.03,0.004),em(W.ck,2),Math.cos(a)*rr(u),yU(u),Math.sin(a)*rr(u));m.rotation.z=(i%2?0.5:-0.5);}
  if(W.sg)for(let i=1;i<6;i++){const u=i/6,t=put(new THREE.TorusGeometry(rr(u)+0.0015,0.0028,5,12),M(W.sg,0.4,{metalness:0.6}),wob(u),yU(u));t.rotation.x=Math.PI/2;}
  if(W.vn){tube(helix(2.2,0.6,1.25,40).map(p=>{p.y=Math.max(p.y,yU(0.55));return p;}),0.0042,M(W.vn,0.7));
    for(let i=0;i<5;i++){const u=0.06+i*0.1,a=i*1.9,lf=put(new THREE.SphereGeometry(0.012,6,4),M(W.vn,0.7),Math.cos(a)*rr(u)*1.6,yU(u),Math.sin(a)*rr(u)*1.6);lf.scale.set(1,0.35,0.6);lf.rotation.z=a;}}
  // ด้าม
  const hM=M('#'+new THREE.Color(W.hd).multiplyScalar(1.2).getHexString(),0.6),gold=W.band?M(W.band,0.3,{metalness:0.85}):null,ym=(yb+yh)/2,HL=yb-yh;
  const ring=(y,r,t,mat)=>{const m=put(new THREE.TorusGeometry(r,t,6,14),mat,0,y);m.rotation.x=Math.PI/2;return m;};
  switch(W.hd2){
    case 'wrap':put(new THREE.CylinderGeometry(0.029,0.031,HL,10),hM,0,ym);for(let i=0;i<5;i++)ring(yb-0.02-i*0.034,0.031,0.004,M(new THREE.Color(W.hd).multiplyScalar(1.8),0.6));if(gold)ring(yh+0.004,0.03,0.005,gold);break;
    case 'bulb':put(new THREE.LatheGeometry([[0.02,0],[0.03,0.04],[0.036,0.11],[0.024,0.168],[0.001,0.18]].map(([x,y])=>new THREE.Vector2(x,y)),12),M(W.hd,0.3,{metalness:0.15}),0,yb-HL);
      if(gold){ring(yh+0.005,0.021,0.004,gold);ring(yb-0.002,0.024,0.0045,gold);}if(W.gem)put(new THREE.SphereGeometry(0.016,8,6),em(W.gem,1),0,yb+0.012);break;
    case 'root':put(new THREE.CylinderGeometry(0.028,0.036,HL,9),hM,0,ym);put(new THREE.ConeGeometry(0.045,0.05,9),hM,0,yb+0.012).rotation.x=Math.PI;
      for(let k=0;k<3;k++)tube(Array.from({length:7},(_,i)=>{const t=i/6,a=k*2.1+t*2.4;return new THREE.Vector3(Math.cos(a)*0.032,yb+0.02-HL*t,Math.sin(a)*0.032);}),0.006,M(new THREE.Color(W.hd).multiplyScalar(1.4),0.8));break;
    case 'facet':{const m=put(new THREE.CylinderGeometry(0.032,0.024,HL,6),M(W.hd,0.35,{metalness:0.4,flatShading:true}),0,ym);if(gold){ring(yh+0.004,0.026,0.005,gold);ring(yb-0.004,0.03,0.004,gold);}
      put(new THREE.SphereGeometry(0.02,6,2),M(W.hd,0.35,{metalness:0.4,flatShading:true}),0,yb+0.01);break;}
    case 'stone':for(let i=0;i<4;i++){const m=put(new THREE.BoxGeometry(0.052,HL/4-0.004,0.052),M(new THREE.Color(W.hd).multiplyScalar(0.85+0.12*(i%2)),0.95,{flatShading:true}),0,yb-HL/8-i*HL/4);m.rotation.y=i*0.4;
      put(new THREE.BoxGeometry(0.005,0.03,0.054),em(W.ck||'#ffb84a',1.8),0.012*(i%2?1:-1),m.position.y,0).rotation.y=i*0.4;}break;
    case 'heart':put(new THREE.CylinderGeometry(0.022,0.026,HL,10),hM,0,ym);
      for(const s of [-1,1])put(new THREE.SphereGeometry(0.012,8,6),em('#ff3a5a',0.6),s*0.009,ym+0.008,0.022);put(new THREE.ConeGeometry(0.017,0.022,8),em('#ff3a5a',0.6),0,ym-0.008,0.022).rotation.z=Math.PI;
      ring(yh+0.004,0.022,0.004,M('#e8c26a',0.3,{metalness:0.85}));put(new THREE.SphereGeometry(0.014,8,6),em('#ff3a5a',0.6),0,yb+0.01);break;
    case 'petal':for(let i=0;i<6;i++){const p=put(new THREE.SphereGeometry(0.026,8,6),M(new THREE.Color(W.hd).multiplyScalar(1-i*0.08),0.5),0,yb-0.012-i*0.03);p.scale.set(1,0.7,1);}
      put(new THREE.ConeGeometry(0.008,0.03,6),M('#ffc0d0',0.4),0,yb+0.006).rotation.x=Math.PI;break;
  }
  // ปลายไม้
  const tM=em(W.tc||W.gl,1.6),ty=yt-0.004;
  switch(W.tip){
    case 'gem':put(new THREE.OctahedronGeometry(0.016,0),tM,0,ty).scale.y=1.7;break;
    case 'crys':put(new THREE.OctahedronGeometry(0.02,0),tM,0,ty-0.01).scale.y=2;break;
    case 'cage':put(new THREE.SphereGeometry(0.016,10,8),tM,0,ty-0.01);ring(ty-0.01,0.026,0.0025,M('#e8c84a',0.3,{metalness:0.85}));{const r=ring(ty-0.01,0.026,0.0025,M('#e8c84a',0.3,{metalness:0.85}));r.rotation.y=Math.PI/2;r.rotation.x=0;}break;
    case 'flake':for(let i=0;i<3;i++){const b=put(new THREE.BoxGeometry(0.004,0.07,0.004),tM,0,ty-0.026);b.rotation.z=i*Math.PI/3;}break;
    case 'claw':put(new THREE.SphereGeometry(0.018,10,8),tM,0,ty-0.012);for(let i=0;i<3;i++){const a=i*2.1,c=put(new THREE.ConeGeometry(0.006,0.05,5),M('#1a0c08',0.6),Math.cos(a)*0.02,ty-0.012,Math.sin(a)*0.02);c.rotation.set(Math.sin(a)*0.5,0,-Math.cos(a)*0.5+Math.PI);}break;
    case 'star':{const a=put(new THREE.OctahedronGeometry(0.02,0),tM,0,ty-0.014);a.scale.set(0.35,1.8,0.35);const b=put(new THREE.OctahedronGeometry(0.02,0),tM,0,ty-0.014);b.scale.set(1.5,0.35,0.35);break;}
  }
  return G;
}
// ประกายไม้สำเร็จรูป (ไม้ธาตุทุกอัน + เลเวล 20+) — เรียกทุกเฟรมจาก syncPlayers (js/35) • ไม่เกิน ~12 เม็ด/วิ ต่อคน
function wandSparks(o,dt){const S=o.wspk;if(!S||!o.tip.visible||Math.random()>dt*12)return;
  o.tip.getWorldPosition(_pw);const q=simOf(_pw),t=S[1],c=S[0];
  const P={x:q.x+rnd(-4,4),y:q.y+rnd(-4,4),h:q.h+rnd(-0.05,0.1),vx:rnd(-12,12),vy:rnd(-12,12),vh:rnd(0.2,0.8),life:0.7,max:0.7,col:c,size:rnd(1,1.8),g:-0.4};
  if(t==='ember'){P.vh=rnd(1,2);P.g=-1;P.col=Math.random()<0.5?c:'#ffe27a';}
  else if(t==='snow'){P.vh=rnd(-0.3,0.2);P.g=0.3;P.life=P.max=1.1;P.size=rnd(1.4,2.2);}
  else if(t==='bolt'){P.life=P.max=0.14;P.size=rnd(1.6,2.6);P.vx*=3;P.vy*=3;P.g=0;P.col=Math.random()<0.5?'#ffffff':c;}
  else if(t==='rock'){P.vh=rnd(0.5,1.2);P.g=3;P.life=P.max=0.8;}
  else if(t==='star'){P.size=rnd(1.8,2.8);P.life=P.max=0.9;P.g=-0.2;}
  PARTS.push(P);}
// ---------- โมเดลนักเรียนเวทมนตร์ ----------
// geometry/material/texture ที่ใช้ร่วมกันระหว่างตัวละคร: สร้างครั้งเดียวต่อรูปทรง/สี แล้วใช้ซ้ำ (userData.keep = disposeTree จะไม่ทิ้ง)
const SHGEO=new Map(),SHMAT=new Map(),SHTEX=new Map();
function sGeo(C,...a){const k=C.name+'('+a.join(',')+')';let g=SHGEO.get(k);if(!g){g=new C(...a);g.userData.keep=true;SHGEO.set(k,g);}return g;}
function sMat(o){
  const k='S|'+matKey(o);let m=SHMAT.get(k);if(!m){m=new THREE.MeshStandardMaterial(o);m.userData.keep=true;SHMAT.set(k,m);}return m;
}
function bMat(o){const k='B|'+matKey(o);let m=SHMAT.get(k);if(!m){m=new THREE.MeshBasicMaterial(o);m.userData.keep=true;SHMAT.set(k,m);}return m;}
// คีย์ของวัสดุ: สีเก็บเป็นตัวเลขจริง (สี HDR เกิน 1 ไม่ถูกปัดรวมกัน)
function matKey(o){return Object.keys(o).sort().map(n=>{const v=o[n];if(v&&v.isTexture)return n+'='+v.uuid;
  if(n==='color'||n==='emissive'){const c=new THREE.Color(v);return n+'='+c.r.toFixed(4)+','+c.g.toFixed(4)+','+c.b.toFixed(4);}return n+'='+String(v);}).join(';');}
// รวมชิ้นส่วนที่ไม่ขยับของตัวละครให้เหลือน้อย draw call ที่สุด:
// ทุกชิ้นที่เป็นวัสดุสีล้วน (ไม่มี texture/โปร่งใส/เรืองแสง) ในกลุ่มเดียวกัน → mesh เดียว ใช้วัสดุกลาง BODYM
// สี/ความด้าน/ความเป็นโลหะ เก็บต่อจุด (attribute color/aRough/aMetal) แทนการแยกวัสดุ
// แยกต่อกลุ่ม (b, ขา, แขน, ไม้, ปลายผ้าพันคอ) เพราะกลุ่มขยับเอง; ชิ้นที่มี userData.anim (ผ้าคลุม) ไม่รวม
function bodyPatch(sh){
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aRough;attribute float aMetal;varying float vRough;varying float vMetal;')
    .replace('#include <begin_vertex>','#include <begin_vertex>\nvRough=aRough;vMetal=aMetal;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vRough;varying float vMetal;')
    .replace('#include <roughnessmap_fragment>','float roughnessFactor=roughness*vRough;')
    .replace('#include <metalnessmap_fragment>','float metalnessFactor=metalness*vMetal;');
}
const BODYM={};
function bodyMat(side){
  if(!BODYM[side]){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:1,side});
    m.onBeforeCompile=bodyPatch;m.customProgramCacheKey=()=>'wdBody';m.userData.keep=true;BODYM[side]=m;}
  return BODYM[side];
}
function plainMat(m){return m&&m.isMeshStandardMaterial&&m.userData.keep&&!m.map&&!m.transparent&&!m.vertexColors&&!m.flatShading&&!m.wireframe&&m.emissive.r+m.emissive.g+m.emissive.b===0&&m.side!==THREE.BackSide;}
function mergeBody(root){
  const conts=[];root.traverse(o=>{if(!o.isMesh&&o.children.length)conts.push(o);});
  for(const C of conts){
    const bySide=new Map();
    for(const m of C.children){if(!m.isMesh||m.userData.anim||!plainMat(m.material))continue;const sd=m.material.side;let L=bySide.get(sd);if(!L)bySide.set(sd,L=[]);L.push(m);}
    for(const [sd,L] of bySide){
      if(L.length<2)continue;
      const geos=L.map(m=>{
        m.updateMatrix();
        const g=m.geometry.index?m.geometry.clone():m.geometry.toNonIndexed();
        g.applyMatrix4(m.matrix);
        for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
        const n=g.attributes.position.count,c=m.material.color,col=new Float32Array(n*3),r=new Float32Array(n),mt=new Float32Array(n);
        for(let i=0;i<n;i++){col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;r[i]=m.material.roughness;mt[i]=m.material.metalness;}
        g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('aRough',new THREE.BufferAttribute(r,1));g.setAttribute('aMetal',new THREE.BufferAttribute(mt,1));
        return g;
      });
      const g=mergeGeometries(geos,false);geos.forEach(x=>x.dispose());
      if(!g)continue;
      const mm=new THREE.Mesh(g,bodyMat(sd));mm.castShadow=L[0].castShadow;mm.receiveShadow=L[0].receiveShadow;
      for(const m of L)C.remove(m);C.add(mm);
    }
    // รอบสอง: ชิ้นที่เหลือที่ใช้วัสดุแชร์ตัวเดียวกัน (เช่น ตาเรืองแสง) รวมกันตรงๆ
    const byMat=new Map();
    for(const m of C.children){if(!m.isMesh||m.userData.anim||!m.material.userData.keep||m.material.transparent||m.material===BODYM[m.material.side])continue;let L=byMat.get(m.material);if(!L)byMat.set(m.material,L=[]);L.push(m);}
    for(const [mat,L] of byMat){
      if(L.length<2)continue;
      const geos=L.map(m=>{m.updateMatrix();const g=m.geometry.index?m.geometry.clone():m.geometry.toNonIndexed();g.applyMatrix4(m.matrix);for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal'&&k!=='uv')g.deleteAttribute(k);if(!g.attributes.uv)return null;return g;});
      if(geos.includes(null)){geos.forEach(x=>x&&x.dispose());continue;}
      const g=mergeGeometries(geos,false);geos.forEach(x=>x.dispose());
      if(!g)continue;
      const mm=new THREE.Mesh(g,mat);mm.castShadow=L[0].castShadow;mm.receiveShadow=L[0].receiveShadow;
      for(const m of L)C.remove(m);C.add(mm);
    }
  }
}
function sStripe(c1,c2){const k=c1+'|'+c2;let t=SHTEX.get(k);if(!t){t=stripeTex(c1,c2);t.userData.keep=true;SHTEX.set(k,t);}return t;}
function hashStr(s){let h=7;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))|0;return Math.abs(h);}
function stripeTex(c1,c2){const t=texCanvas(32,64,(g)=>{for(let i=0;i<8;i++){g.fillStyle=i%2?c2:c1;g.fillRect(0,i*8,32,8);}});t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
function shieldMat(){
  return new THREE.ShaderMaterial({
    uniforms:{t:{value:0},c:{value:new THREE.Color('#7ff0ff')}},
    vertexShader:'varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){vP=position;vec4 mv=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float t;uniform vec3 c;varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){float f=pow(1.0-abs(dot(vN,vV)),2.2);float hx=abs(sin(vP.x*8.0+t*2.0)*sin(vP.y*8.0-t)*sin(vP.z*8.0));float lat=smoothstep(0.85,1.0,hx);float a=f*0.9+lat*0.35+0.04;gl_FragColor=vec4(c*(1.2+f*2.5+lat*2.0),a);}',
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide
  });
}
function addStatus(g,h){
  const stars=new THREE.Group();
  for(let i=0;i<3;i++){const s=new THREE.Sprite(glowMat('#ffe066',2));s.scale.set(0.35,0.35,1);s.position.set(Math.cos(i*2.09)*0.5,0,Math.sin(i*2.09)*0.5);stars.add(s);}
  stars.position.y=h;stars.visible=false;g.add(stars);
  return stars;
}
function makeStudent(look,id){
  const g=new THREE.Group(),b=new THREE.Group();g.add(b);
  const H=HOUSES[look.h],house=new THREE.Color(H.c),cloakCol=CLOAKC[look.cl];
  const M=(c,r,ex)=>sMat(Object.assign({color:c,roughness:r===undefined?0.85:r},ex||{}));   // วัสดุใช้ร่วมกันทุกตัวละคร (ห้ามแก้ค่าบนวัสดุโดยตรง ให้สลับวัสดุแทน)
  const blackM=M(cloakCol,0.92),skinM=M(SKINC[look.sk],0.7),hairM=M(HAIRC[look.hr],0.55,{side:THREE.DoubleSide});
  const add=(p,geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);p.add(m);return m;};
  const legs=[];
  for(const s of [-1,1]){
    const L=new THREE.Group();L.position.set(s*0.12,0.86,0);b.add(L);
    add(L,sGeo(THREE.CylinderGeometry,0.095,0.085,0.78,10),M('#222228'),0,-0.4,0);
    add(L,sGeo(THREE.BoxGeometry,0.15,0.1,0.3),M('#0b0b0d',0.4),0,-0.8,0.05);
    legs.push(L);
  }
  add(b,sGeo(THREE.CylinderGeometry,0.25,0.23,0.72,14),M('#3b3b44'),0,1.2,0);
  add(b,sGeo(THREE.CylinderGeometry,0.13,0.16,0.08,12),M('#eeeeee'),0,1.57,0.02);
  // เนคไท (หัวเงื่อน + แถบห้อย) ตามสไตล์ที่เลือก
  if(look.ti!==3){
    const tm=look.ti===0?sMat({map:sStripe(H.c,H.c2),roughness:0.6}):M(look.ti===1?H.c:H.c2,0.6);
    add(b,sGeo(THREE.BoxGeometry,0.085,0.07,0.05),M(look.ti===2?H.c2:H.c,0.6),0,1.51,0.243);
    add(b,sGeo(THREE.BoxGeometry,0.095,0.3,0.026),tm,0,1.34,0.252);
  }
  add(b,sGeo(THREE.CylinderGeometry,0.075,0.085,0.14,10),skinM,0,1.64,0);
  add(b,sGeo(THREE.SphereGeometry,0.235,20,16),skinM,0,1.86,0).scale.set(1,1.08,1);
  // ตา: ตาขาว + ม่านตาสีที่เลือก + รูม่านตา
  const eyeWM=M('#f4f2ee',0.4),irisM=M(EYEC[look.ey],0.3),pupM=M('#0a0806',0.3);
  for(const s of [-1,1]){
    add(b,sGeo(THREE.SphereGeometry,0.038,10,8),eyeWM,s*0.085,1.865,0.2);
    add(b,sGeo(THREE.SphereGeometry,0.028,10,8),irisM,s*0.085,1.865,0.221);
    add(b,sGeo(THREE.SphereGeometry,0.014,8,6),pupM,s*0.085,1.865,0.238);
  }
  // ผม: ฝาบนสุด + ครึ่งหลัง (เปิดหน้าไว้) แล้วต่อทรงตามที่เลือก
  {
    const hS=look.hs,HCt=new THREE.Vector3(0,1.88,-0.02),UP=new THREE.Vector3(0,1,0),tieM=M(H.c2,0.4);
    const backTh=[0.5,0.6,0.62,0.55,0.55,0.62,0.6,0.6,0.55,0.55,0.5][hS];
    add(b,sGeo(THREE.SphereGeometry,0.255,24,12,0,Math.PI*2,0,Math.PI*0.34),hairM,0,1.88,-0.02);
    add(b,sGeo(THREE.SphereGeometry,0.255,24,14,Math.PI,Math.PI,0,Math.PI*backTh),hairM,0,1.88,-0.02);
    for(const sd of[-1,1]){const m=add(b,sGeo(THREE.SphereGeometry,0.1,12,10),hairM,sd*0.222,1.91,0.03);m.scale.set(0.5,1.2,0.95);}   // จอนผมข้างหู ไม่ให้ดูเป็นหมวก
    const ball=(x,y,z,r,m)=>add(b,sGeo(THREE.SphereGeometry,r,12,10),m||hairM,x,y,z);
    const caps=(r,l,x,y,z,rx,rz)=>{const m=add(b,sGeo(THREE.CapsuleGeometry,r,l,4,10),hairM,x,y,z);m.rotation.x=rx||0;m.rotation.z=rz||0;return m;};
    const tuft=(dx,dy,dz,len,rad)=>{const d=new THREE.Vector3(dx,dy,dz).normalize(),m=new THREE.Mesh(sGeo(THREE.ConeGeometry,rad,len,6),hairM);
      m.quaternion.setFromUnitVectors(UP,d);m.position.copy(HCt).addScaledVector(d,0.23+len*0.35);b.add(m);};
    const bangs=(w,y,z,k)=>{const m=add(b,sGeo(THREE.SphereGeometry,0.22,18,10),hairM,0,y,z);m.scale.set(w,k,0.62);return m;};
    if(hS===0){const m=add(b,sGeo(THREE.SphereGeometry,0.17,14,8),hairM,-0.06,2.02,0.17);m.scale.set(1.05,0.42,0.6);m.rotation.z=0.28;const m2=add(b,sGeo(THREE.SphereGeometry,0.13,14,8),hairM,0.1,2.0,0.17);m2.scale.set(0.9,0.4,0.55);m2.rotation.z=-0.2;}
    else if(hS===1){bangs(1.05,2.0,0.17,0.36);ball(-0.2,1.93,0.11,0.06);ball(0.2,1.93,0.11,0.06);}
    else if(hS===2){const m=caps(0.17,0.5,0,1.6,-0.17);m.scale.set(1.25,1,0.55);for(const s of[-1,1])caps(0.045,0.34,s*0.215,1.72,0.04);bangs(1.0,2.0,0.17,0.3);}
    else if(hS===3){ball(0,2.14,-0.08,0.12);const r=add(b,sGeo(THREE.TorusGeometry,0.115,0.022,6,16),tieM,0,2.06,-0.08);r.rotation.x=Math.PI/2;}
    else if(hS===4){for(const [x,y,z] of [[0.3,1,0.5],[-0.4,1,0.4],[0,1,0.75],[0.6,0.9,0],[-0.6,0.9,0.1],[0.2,1,-0.5],[-0.3,1,-0.4],[0.7,0.5,-0.3],[-0.7,0.5,-0.2]])tuft(x,y,z,0.2,0.075);}
    else if(hS===5){add(b,sGeo(THREE.SphereGeometry,0.285,24,12,Math.PI*0.85,Math.PI*1.3,Math.PI*0.3,Math.PI*0.52),hairM,0,1.82,-0.04);bangs(1.0,2.0,0.17,0.32);}
    else if(hS===6){ball(0,1.93,-0.27,0.045,tieM);caps(0.075,0.42,0,1.7,-0.4,0.45);}
    else if(hS===7){for(let i=0;i<5;i++)ball(0,1.78-0.11*i,-0.29,0.085-0.009*i);ball(0,1.2,-0.29,0.04,tieM);}
    else if(hS===8){
      ball(0,2.12,-0.02,0.12);
      for(const th of [0.3,0.5,0.68])for(let k=0;k<8;k++){const ph=k/8*Math.PI*2;if(th>0.42&&Math.sin(ph)>0.35)continue;
        const r=0.265*Math.sin(th*Math.PI),y=1.88+0.265*Math.cos(th*Math.PI);ball(Math.cos(ph)*r,y,-0.02+Math.sin(ph)*r,0.1);}
    }
    else if(hS===9){for(const s of[-1,1]){ball(s*0.26,1.94,-0.02,0.04,tieM);caps(0.07,0.36,s*0.3,1.74,-0.04,0,-s*0.3);}}
    else if(hS===10){for(const [x,y,z] of [[0,1,0],[0.5,1,0.2],[-0.5,1,0.2],[0.3,1,-0.5],[-0.3,1,-0.5],[0.85,0.7,0],[-0.85,0.7,0],[0,1,0.6]])tuft(x,y,z,0.3,0.09);}
  }
  const scM=sMat({map:sStripe(H.c,H.c2),roughness:0.9});
  add(b,sGeo(THREE.TorusGeometry,0.17,0.075,8,18),scM,0,1.6,0).rotation.x=Math.PI/2;
  const ends=[];
  for(const [x,len] of [[0.08,0.5],[-0.04,0.42]]){
    const E=new THREE.Group();E.position.set(x,1.57,0.2);b.add(E);
    add(E,sGeo(THREE.BoxGeometry,0.13,len,0.035),scM,0,-len/2,0);ends.push(E);
  }
  const cloak=makeCloak(cloakCol,house.clone().multiplyScalar(0.7),0.33,0.82,1.5,0.75,true);
  cloak.outer.position.y=cloak.inner.position.y=0.83;b.add(cloak.outer,cloak.inner);cloak.outer.userData.anim=cloak.inner.userData.anim=true;
  const hood=add(b,sGeo(THREE.SphereGeometry,0.3,14,10,0,Math.PI*2,0,Math.PI/2),blackM,0,1.52,-0.2);hood.rotation.x=-1.9;hood.scale.set(1,0.6,1);
  const sleeveM=M(cloakCol,0.92,{side:THREE.DoubleSide});
  const mkArm=s=>{
    const A=new THREE.Group();A.position.set(s*0.33,1.5,0);b.add(A);
    add(A,sGeo(THREE.CylinderGeometry,0.085,0.16,0.62,12,1,true),sleeveM,0,-0.3,0);
    add(A,sGeo(THREE.SphereGeometry,0.075,10,8),skinM,0,-0.64,0);
    return A;
  };
  const armR=mkArm(-1),armL=mkArm(1);
  const wandG=new THREE.Group();armR.add(wandG);
  const WN=look.wn>0&&WANDN[look.wn],wnG=WN?wandNamed(wandG,WN,M):null;   // ไม้สำเร็จรูป (WANDN js/02)
  if(!WN){
    const wC=WOODC[look.wd],wM=M(wC,0.5),dkM=M(new THREE.Color(wC).multiplyScalar(0.55),0.6),goldW=sMat({color:'#e8c060',metalness:0.85,roughness:0.3,emissive:'#2a1c04'});
    add(wandG,sGeo(THREE.CylinderGeometry,0.014,0.026,0.46,8),wM,0,-0.87,0);
    if(look.ws===0)add(wandG,sGeo(THREE.SphereGeometry,0.034,8,6),wM,0,-0.65,0);
    else if(look.ws===1)for(let i=0;i<7;i++){const r=add(wandG,sGeo(THREE.TorusGeometry,0.024-i*0.0014,0.006,5,10),dkM,0,-0.7-i*0.055,0);r.rotation.x=Math.PI/2+0.35;}
    else if(look.ws===2){add(wandG,sGeo(THREE.SphereGeometry,0.04,8,6),wM,0,-0.65,0);for(const [y,r] of [[-0.72,0.034],[-0.84,0.028],[-0.95,0.026]])add(wandG,sGeo(THREE.SphereGeometry,r,8,6),wM,0.007,y,0);}
    else if(look.ws===4){const bM=M('#e8e0c8',0.7);for(let i=0;i<5;i++)add(wandG,sGeo(THREE.SphereGeometry,0.03-i*0.002,8,6),bM,0,-0.68-i*0.09,0);add(wandG,sGeo(THREE.CylinderGeometry,0.012,0.022,0.46,8),bM,0,-0.87,0);}   // กระดูก (ปลดล็อค Lv16)
    else if(look.ws===5){for(let i=0;i<6;i++)add(wandG,sGeo(THREE.SphereGeometry,0.024-i*0.002,7,5),dkM,(i%2?0.006:-0.006),-0.68-i*0.085,0);add(wandG,sGeo(THREE.SphereGeometry,0.04,8,6),dkM,0,-0.64,0);}   // เอลเดอร์วอนด์: ปุ่มไม้เป็นข้อ ๆ (Lv24)
    else if(look.ws===6){add(wandG,sGeo(THREE.CylinderGeometry,0.03,0.03,0.12,8),goldW,0,-0.7,0);const cr=add(wandG,sGeo(THREE.OctahedronGeometry,0.05,0),sMat({color:WCOREC[look.wc],emissive:WCOREC[look.wc],emissiveIntensity:1.4,metalness:0.2,roughness:0.1,transparent:true,opacity:0.9}),0,-1.1,0);cr.scale.y=1.6;}   // คริสตัลปลายไม้ (Lv28)
    else{add(wandG,sGeo(THREE.CylinderGeometry,0.031,0.031,0.13,10),goldW,0,-0.71,0);for(const y of[-0.79,-1.0]){const r=add(wandG,sGeo(THREE.TorusGeometry,0.024,0.007,6,12),goldW,0,y,0);r.rotation.x=Math.PI/2;}add(wandG,sGeo(THREE.SphereGeometry,0.02,8,6),goldW,0,-1.1,0);}
  }
  const tip=new THREE.Sprite(glowMat(WN?WN.gl:WCOREC[look.wc],2.2));tip.scale.setScalar(0.32);tip.position.set(0,WN?-1.13:-1.09,0);armR.add(tip);
  shadowAll(b);mergeBody(b);
  const shield=new THREE.Mesh(sGeo(THREE.SphereGeometry,1.35,32,20),shieldMat());shield.position.y=1.1;shield.visible=false;g.add(shield);
  const ring=new THREE.Mesh(sGeo(THREE.RingGeometry,0.85,1.05,32),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0.7,depthWrite:false}));
  ring.rotation.x=-Math.PI/2;ring.position.y=0.04;g.add(ring);
  const stars=addStatus(g,2.55);
  // ไม้กวาด (โชว์ตอนบิน)
  const broom=new THREE.Group();
  const handle=new THREE.Mesh(sGeo(THREE.CylinderGeometry,0.04,0.05,2.5,8),M('#5a3a1c',0.55));handle.rotation.x=Math.PI/2;handle.position.z=0.15;broom.add(handle);
  const bristle=new THREE.Mesh(sGeo(THREE.ConeGeometry,0.26,0.9,10,1,true),M('#b08a50',1,{side:THREE.DoubleSide}));bristle.rotation.x=Math.PI/2;bristle.position.z=-1.35;broom.add(bristle);
  const band=new THREE.Mesh(sGeo(THREE.TorusGeometry,0.075,0.025,6,12),sMat({color:'#e8c060',metalness:0.8,roughness:0.3}));band.position.z=-0.92;broom.add(band);
  broom.position.y=0.8;broom.visible=false;shadowAll(broom);g.add(broom);
  // ใยแมงมุมรัดตัว (ตอนโดนใย)
  const cocoon=new THREE.Mesh(sGeo(THREE.IcosahedronGeometry,0.75,1),sMat({color:'#e8e8f0',transparent:true,opacity:0.55,roughness:1,wireframe:true}));
  cocoon.position.y=0.7;cocoon.scale.set(1,1.2,1);cocoon.visible=false;g.add(cocoon);
  scene.add(g);
  return {g,b,legs,armR,armL,wandG,wnG,wspk:WN&&WN.spk||null,ends,cloak,tip,shield,ring,stars,broom,cocoon,walk:0,castT:0,lx:null,lz:null,svx:0,svz:0};
}
function makeEnemy(t){
  const g=new THREE.Group(),b=new THREE.Group();g.add(b);
  const add=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);b.add(m);return m;};
  const eyeM=c=>bMat({color:hdr(c,2.5)});
  let tele=null,club=null,cloak=null,h=2;
  if(t==='gob'){
    const sk=sMat({color:'#6bbf4e',roughness:0.8}),cl=sMat({color:'#5a3d22',roughness:1});
    add(sGeo(THREE.SphereGeometry,0.5,12,10),cl,0,0.6,0).scale.set(1,1.1,0.9);
    add(sGeo(THREE.SphereGeometry,0.4,14,10),sk,0,1.25,0.05);
    for(const s of [-1,1]){const e=add(sGeo(THREE.ConeGeometry,0.12,0.55,8),sk,s*0.45,1.35,0);e.rotation.z=-s*Math.PI/2.4;}
    for(const s of [-1,1])add(sGeo(THREE.SphereGeometry,0.07,6,6),eyeM('#ffe600'),s*0.14,1.3,0.38);
    add(sGeo(THREE.ConeGeometry,0.06,0.5,6),sMat({color:'#aaa',metalness:0.6,roughness:0.3}),-0.45,0.8,0.35).rotation.x=Math.PI/2;
    h=1.9;
  }else if(t==='wiz'){
    const rm=sMat({color:'#1a0f26',roughness:0.9});
    cloak=makeCloak('#1a0f26','#1f5a1a',0.32,0.85,1.7,0.3);
    cloak.outer.position.y=cloak.inner.position.y=0.85;b.add(cloak.outer,cloak.inner);
    add(sGeo(THREE.SphereGeometry,0.42,14,10),rm,0,1.75,0).scale.set(1,0.7,0.85);
    add(sGeo(THREE.ConeGeometry,0.42,0.95,14),rm,0,2.2,-0.05);
    add(sGeo(THREE.SphereGeometry,0.24,10,8),bMat({color:'#05030a'}),0,1.92,0.18);
    for(const s of [-1,1])add(sGeo(THREE.SphereGeometry,0.05,6,6),eyeM('#7dff6a'),s*0.09,1.95,0.4);
    const gl2=new THREE.Sprite(glowMat('#8dff5a',1.8));gl2.position.set(-0.45,1.3,0.5);gl2.scale.set(0.9,0.9,1);b.add(gl2);
    h=2.7;
  }else if(t==='spl'||t==='spider'||t==='queen'){
    // แมงมุม: ท้องใหญ่มีขน + ตา 8 ดวงเรืองแดง + ขา 8 ขาแบบ 2 ข้อ
    const sc=t==='spl'?0.5:t==='spider'?1.05:2.6;
    const bodyM=sMat({color:t==='queen'?'#1d1410':'#2a1d18',roughness:0.7});
    const hairM=sMat({color:t==='queen'?'#2e2018':'#4a3628',roughness:1,flatShading:true});
    const M_fang=sMat({color:'#d8d0c0',roughness:0.4});
    const sp=new THREE.Group();sp.scale.setScalar(sc);b.add(sp);
    const ad=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);sp.add(m);return m;};
    const seg=(par,a,c,r,mat)=>{const d=new THREE.Vector3().subVectors(c,a),len=d.length();const m=new THREE.Mesh(sGeo(THREE.CylinderGeometry,r*0.75,r,len,6),mat);m.position.copy(a).add(c).multiplyScalar(0.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());par.add(m);};
    ad(sGeo(THREE.IcosahedronGeometry,0.62,2),hairM,0,0.78,-0.78).scale.set(1,0.85,1.25);
    ad(sGeo(THREE.SphereGeometry,0.38,16,12),bodyM,0,0.62,0.05);
    ad(sGeo(THREE.SphereGeometry,0.25,14,10),bodyM,0,0.6,0.45);
    if(t!=='spl')ad(sGeo(THREE.OctahedronGeometry,0.16),eyeM('#b01010'),0,1.3,-0.82).scale.set(1,0.3,1.7);
    for(const [x,y,r] of [[-0.07,0.7,0.06],[0.07,0.7,0.06],[-0.16,0.68,0.04],[0.16,0.68,0.04],[-0.11,0.63,0.035],[0.11,0.63,0.035],[-0.2,0.62,0.03],[0.2,0.62,0.03]])ad(sGeo(THREE.SphereGeometry,r,8,6),eyeM('#ff2020'),x,y,0.66);
    for(const s of [-1,1]){const f=ad(sGeo(THREE.ConeGeometry,0.045,0.25,6),M_fang,s*0.07,0.46,0.66);f.rotation.x=Math.PI;}
    var legs=[];
    for(const s of [-1,1])for(let i=0;i<4;i++){
      const L=new THREE.Group();L.position.set(s*0.25,0.62,0.25-i*0.15);sp.add(L);
      const th=1.0-i*0.65,base=s>0?-th:Math.PI+th;L.rotation.y=base;
      const hip=new THREE.Vector3(0,0,0),knee=new THREE.Vector3(0.6,0.55,0),foot=new THREE.Vector3(1.3,-0.62,0);
      seg(L,hip,knee,0.06,hairM);seg(L,knee,foot,0.045,bodyM);
      legs.push({L,base,ph:i*Math.PI/2+(s>0?0:Math.PI),s});
    }
    if(t==='queen'){
      tele=new THREE.Mesh(sGeo(THREE.CircleGeometry,150*S3,48),new THREE.MeshBasicMaterial({color:hdr('#ff3030',1.5),transparent:true,opacity:0.3,depthWrite:false}));
      tele.rotation.x=-Math.PI/2;tele.position.y=0.05;tele.visible=false;g.add(tele);
    }
    h=t==='spl'?0.9:t==='spider'?1.7:3.9;
    shadowAll(b);mergeBody(b);
    const stars=addStatus(g,h+0.2);
    scene.add(g);
    return {g,b,tele,club,cloak,stars,h,legs,walk:0,lx:null,lz:null,svx:0,svz:0};
  }else if(t==='dragon'){
    // มังกร: ลำตัวยาว คอ หัวมีเขา ปีกใหญ่ หางยาว ตาเรืองแสง
    const sk=sMat({color:'#6a1818',roughness:0.55,metalness:0.15});
    const belly=sMat({color:'#c8964a',roughness:0.7});
    const hornM=sMat({color:'#e8dcc0',roughness:0.4});
    const wingM=sMat({color:'#4a1010',roughness:0.8,side:THREE.DoubleSide});
    const Dg=new THREE.Group();Dg.scale.setScalar(1.55);b.add(Dg);
    const ad=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);Dg.add(m);return m;};
    const seg=(a,c,r,mat)=>{const d=new THREE.Vector3().subVectors(c,a),len=d.length();const m=new THREE.Mesh(sGeo(THREE.CylinderGeometry,r*0.8,r,len,10),mat);m.position.copy(a).add(c).multiplyScalar(0.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());Dg.add(m);return m;};
    const V=(x,y,z)=>new THREE.Vector3(x,y,z);
    ad(sGeo(THREE.SphereGeometry,1.2,20,14),sk,0,2.2,0).scale.set(1,0.85,1.8);
    ad(sGeo(THREE.SphereGeometry,1.05,16,10),belly,0,1.9,0.1).scale.set(0.85,0.7,1.6);
    seg(V(0,2.6,1.6),V(0,3.7,2.8),0.5,sk);
    const head=ad(sGeo(THREE.SphereGeometry,0.62,16,12),sk,0,3.95,3.25);head.scale.set(0.8,0.65,1.25);
    ad(sGeo(THREE.BoxGeometry,0.55,0.25,0.9),sk,0,3.7,3.85);
    for(const s of [-1,1]){
      const h=ad(sGeo(THREE.ConeGeometry,0.11,0.8,8),hornM,s*0.28,4.35,2.9);h.rotation.x=-0.9;
      ad(sGeo(THREE.SphereGeometry,0.09,8,6),bMat({color:hdr('#ffcc33',3)}),s*0.27,4.05,3.65);
      seg(V(s*0.7,1.6,1),V(s*0.9,0,1.1),0.32,sk);seg(V(s*0.7,1.6,-1),V(s*0.9,0,-1.2),0.36,sk);
    }
    seg(V(0,2,-2),V(0,1.5,-3.6),0.55,sk);seg(V(0,1.5,-3.6),V(0,1.05,-5),0.38,sk);seg(V(0,1.05,-5),V(0,0.8,-6.3),0.24,sk);
    const tip=ad(sGeo(THREE.ConeGeometry,0.3,0.8,4),hornM,0,0.75,-6.8);tip.rotation.x=-Math.PI/2;
    for(let i=0;i<5;i++){const sp=ad(sGeo(THREE.ConeGeometry,0.14,0.45,4),hornM,0,3.05-i*0.12,1.2-i*0.7);sp.rotation.x=-0.3;}
    var wings=[];
    for(const s of [-1,1]){
      const W2=new THREE.Group();W2.position.set(s*0.8,3,0.4);Dg.add(W2);
      const geo=new THREE.BufferGeometry();
      const v=[0,0,0, s*5,0.9,0.3, s*5.6,-0.4,-2.2, 0,0,0, s*5.6,-0.4,-2.2, s*1.6,0,-2.3];
      geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.computeVertexNormals();
      W2.add(new THREE.Mesh(geo,wingM));
      const bone=new THREE.Mesh(sGeo(THREE.CylinderGeometry,0.07,0.1,5.1,6),sk);bone.rotation.z=-s*Math.PI/2+s*0.18;bone.position.set(s*2.5,0.45,0.15);W2.add(bone);
      wings.push({wg:W2,s});
    }
    h=7.2;
    shadowAll(b);mergeBody(b);
    const stars=addStatus(g,h);
    scene.add(g);
    return {g,b,tele,club,cloak,stars,h,wings,dragon:true,lx:null,lz:null,svx:0,svz:0};
  }else if(t==='dummy'){
    // หุ่นซ้อม: เสาไม้ + ตัวฟาง + เป้าบนหน้าอก
    const wood=sMat({color:'#6a4a2a',roughness:0.9}),straw=sMat({color:'#c8a060',roughness:1});
    add(sGeo(THREE.CylinderGeometry,0.08,0.1,2,8),wood,0,1,0);
    add(sGeo(THREE.CylinderGeometry,0.4,0.34,1,12),straw,0,1.3,0);
    add(sGeo(THREE.SphereGeometry,0.28,12,10),straw,0,2.05,0);
    add(sGeo(THREE.CylinderGeometry,0.06,0.06,1.3,6),wood,0,1.55,0).rotation.z=Math.PI/2;
    const tg=new THREE.Mesh(sGeo(THREE.CircleGeometry,0.26,24),bMat({color:'#ffffff'}));tg.position.set(0,1.35,0.36);b.add(tg);
    const tr=new THREE.Mesh(sGeo(THREE.RingGeometry,0.1,0.18,24),bMat({color:hdr('#ff3030',1.4)}));tr.position.set(0,1.35,0.37);b.add(tr);
    h=2.4;
  }else if(t==='pixie'){
    const bl=sMat({color:'#3a8aff',roughness:0.5,emissive:'#0a2a6a'});
    add(sGeo(THREE.SphereGeometry,0.2,12,10),bl,0,0,0).scale.set(1,1.2,1);
    add(sGeo(THREE.SphereGeometry,0.18,12,10),bl,0,0.3,0.03);
    for(const s of [-1,1]){const e=add(sGeo(THREE.ConeGeometry,0.05,0.22,6),bl,s*0.17,0.4,0);e.rotation.z=-s*1.1;add(sGeo(THREE.SphereGeometry,0.035,6,6),eyeM('#ffffff'),s*0.07,0.33,0.17);}
    var wings=[];
    for(const s of [-1,1]){
      const wg=new THREE.Group();wg.position.set(0,0.12,-0.12);b.add(wg);
      const w=new THREE.Mesh(sGeo(THREE.PlaneGeometry,0.5,0.32),new THREE.MeshBasicMaterial({color:hdr('#cfe8ff',1.3),transparent:true,opacity:0.55,side:THREE.DoubleSide,depthWrite:false}));
      w.position.x=s*0.27;wg.add(w);wings.push({wg,s});
    }
    const gl3=new THREE.Sprite(glowMat('#4fa8ff',1.2));gl3.scale.setScalar(1.3);b.add(gl3);
    h=0.8;
    shadowAll(b);mergeBody(b);
    const stars=addStatus(g,h);
    scene.add(g);
    return {g,b,tele,club,cloak,stars,h,wings,lx:null,lz:null,svx:0,svz:0};
  }else{
    const sk=sMat({color:'#7a5c42',roughness:0.95});
    add(sGeo(THREE.SphereGeometry,1.6,18,14),sk,0,2.3,0).scale.set(1,1.15,0.9);
    add(sGeo(THREE.SphereGeometry,0.75,14,10),sk,0,4.1,0.45);
    for(const s of [-1,1]){add(sGeo(THREE.CylinderGeometry,0.45,0.55,1.6,10),sk,s*0.8,0.8,0);add(sGeo(THREE.CylinderGeometry,0.35,0.45,2.2,10),sk,s*1.8,2.3,0.2).rotation.z=s*0.3;}
    for(const s of [-1,1])add(sGeo(THREE.SphereGeometry,0.1,6,6),eyeM('#ff3030'),s*0.25,4.2,1.1);
    club=add(sGeo(THREE.CylinderGeometry,0.28,0.5,3,10),sMat({color:'#4a3220',roughness:1}),-2.1,2.4,1.1);
    club.rotation.x=Math.PI/2.6;club.userData.anim=true;
    tele=new THREE.Mesh(sGeo(THREE.CircleGeometry,135*S3,48),new THREE.MeshBasicMaterial({color:hdr('#ff3030',1.5),transparent:true,opacity:0.3,depthWrite:false}));
    tele.rotation.x=-Math.PI/2;tele.position.y=0.05;tele.visible=false;g.add(tele);
    h=5.2;
  }
  shadowAll(b);mergeBody(b);
  const stars=addStatus(g,h+0.2);
  scene.add(g);
  return {g,b,tele,club,cloak,stars,h,lx:null,lz:null,svx:0,svz:0};
}
// คืนหน่วยความจำ GPU: geometry + material + texture (ข้ามของที่ใช้ร่วมกัน/แคชไว้ ที่ทำเครื่องหมาย userData.keep)
function keepTex(t){return t===glowTex||t===stoneTex||t===runeTex||t===decalTex||CRESTTEX.includes(t)||!!(t.userData&&t.userData.keep);}
function keepMatSet(){const s=new Set([...Object.values(glowMats),...Object.values(STONEM)]);return s;}
function disposeMaterial(m,keep){
  if(!m||keep.has(m)||(m.userData&&m.userData.keep))return;
  for(const k in m){const v=m[k];if(v&&v.isTexture&&!keepTex(v))v.dispose();}
  if(m.uniforms)for(const k in m.uniforms){const v=m.uniforms[k]&&m.uniforms[k].value;if(v&&v.isTexture&&!keepTex(v))v.dispose();}
  m.dispose();
}
function disposeTree(root){
  const keep=keepMatSet(),seen=new Set();
  root.traverse(o=>{
    if(o.geometry&&o.geometry!==projGeo&&o.geometry!==tailGeo&&!(o.geometry.userData&&o.geometry.userData.keep))o.geometry.dispose();
    if(o.material)for(const m of [].concat(o.material))if(!seen.has(m)){seen.add(m);disposeMaterial(m,keep);}
  });
}
function disposeObj(o){scene.remove(o);if(o.userData&&o.userData.extra)for(const e of o.userData.extra){(e.parent||scene).remove(e);disposeTree(e);}disposeTree(o);}
const PM3=new Map(),EM3=new Map(),JM3=new Map();
function clearDyn(){for(const M of [PM3,EM3,JM3,WM3,MM3]){for(const o of M.values())disposeObj(o.g);M.clear();}ZV.length=0;clearVfx();earthClear();if(typeof MO!=='undefined')clearModeObjs();}
