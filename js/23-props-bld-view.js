// ---------- prop ฝั่งแสดงผล ----------
const PROP_BATCH_TYPES=new Set(['pcrate','pbarrel']);
const PROPV={g:null,map:null,list:[],batches:new Map(),sizes:new Map(),dirty:new Set()};
// โมเดลสำรองจากโค้ด (ใช้เมื่อยังไม่มี/โหลดไฟล์ไม่ได้) — st: 0 ปกติ, 1 พัง, 2 ใช้แล้ว
function propFallback(k,st){
  const D=PROPDEF[k],g=new THREE.Group(),s=D.r*S3;
  const M=(c,r,ex)=>sMat(Object.assign({color:c,roughness:r===undefined?0.85:r},ex||{}));
  const add=(par,geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);par.add(m);return m;};
  if(k==='pcrate'){
    const w=s*1.45,wd=M(D.col,0.9),dk=M('#5a3e22',0.9);
    if(st!==1){add(g,sGeo(THREE.BoxGeometry,w,w,w),wd,0,w/2,0);for(const y of [0.06,w-0.06])add(g,sGeo(THREE.BoxGeometry,w+0.05,0.1,w+0.05),dk,0,y,0);}
    else for(let i=0;i<6;i++){const m=add(g,sGeo(THREE.BoxGeometry,w*0.9,0.08,0.22),i%2?dk:wd,Math.cos(i*1.3)*w*0.55,0.05+i*0.03,Math.sin(i*1.7)*w*0.55);m.rotation.y=i*1.1;}
  }else if(k==='pbarrel'){
    const wd=M(D.col,0.85),ir=M('#3a3a40',0.5,{metalness:0.6});
    if(st!==1){add(g,sGeo(THREE.CylinderGeometry,s*0.9,s*0.9,D.hgt,14),wd,0,D.hgt/2,0);for(const y of [0.25,D.hgt-0.25])add(g,sGeo(THREE.CylinderGeometry,s*0.94,s*0.94,0.08,14),ir,0,y,0);}
    else{add(g,sGeo(THREE.CylinderGeometry,s*0.9,s*0.9,0.25,14),wd,0,0.125,0);for(let i=0;i<5;i++){const m=add(g,sGeo(THREE.BoxGeometry,0.18,0.06,D.hgt*0.8),wd,Math.cos(i*1.26)*s*1.4,0.04,Math.sin(i*1.26)*s*1.4);m.rotation.y=-i*1.26;}}
  }else if(k==='ptree'||k==='ppine'){
    const bark=M('#5a3a1c',0.9),leaf=M(D.col,0.85),pine=k==='ppine';
    if(st!==1){add(g,sGeo(THREE.CylinderGeometry,0.25,0.4,pine?2:3.4,8),bark,0,pine?1:1.7,0);
      if(pine)for(const [y,r,h] of [[1.6,1.9,2.6],[3,1.5,2.3],[4.3,1.05,2]])add(g,sGeo(THREE.ConeGeometry,r,h,8),leaf,0,y+h/2,0);
      else{add(g,sGeo(THREE.SphereGeometry,1.8,10,8),leaf,0,4.5,0);add(g,sGeo(THREE.SphereGeometry,1.2,10,8),leaf,1,4,0.4);}}
    else{add(g,sGeo(THREE.CylinderGeometry,0.32,0.42,0.7,8),bark,0,0.35,0);const t=add(g,sGeo(THREE.CylinderGeometry,0.28,0.36,2.8,8),bark,2,0.36,0);t.rotation.z=Math.PI/2;add(g,sGeo(THREE.SphereGeometry,1.3,8,6),leaf,4.2,1,0);}
  }else if(k==='pchest'){
    const w=s*1.6,d=s*1.1,wd=M('#6a4422',0.8),gold=M(D.col,0.35,{metalness:0.8});
    add(g,sGeo(THREE.BoxGeometry,w,0.55,d),wd,0,0.275,0);
    add(g,sGeo(THREE.BoxGeometry,w+0.05,0.08,d+0.05),gold,0,0.55,0);
    const lid=new THREE.Group();lid.position.set(0,0.55,-d/2);g.add(lid);
    add(lid,sGeo(THREE.BoxGeometry,w,0.28,d),wd,0,0.14,d/2);add(lid,sGeo(THREE.BoxGeometry,0.16,0.16,0.06),gold,0,0.08,d+0.01);
    if(st===2){lid.rotation.x=-1.9;const gl2=new THREE.Sprite(glowMat('#ffd86b',1.6));gl2.scale.setScalar(1.6);gl2.position.y=0.8;g.add(gl2);}
  }
  shadowAll(g);return g;
}
// แมพใหญ่: ของที่ไกลกว่าหมอก (มองไม่เห็นอยู่แล้ว) ไม่ต้องวาด — x,y,r = sim px • เช็กเป็นวงกลมรอบกล้องบนพื้น
function farCull(x,y,r){const dx=tx(x)-cam.position.x,dz=tz(y)-cam.position.z,R=(scene.fog?scene.fog.far:170)+10+r*S3;return dx*dx+dz*dz>R*R;}
const PROP_BATCH_SRC=new Map(),_propMatrix=new THREE.Matrix4();
function propBatchSource(name){
  if(PROP_BATCH_SRC.has(name))return PROP_BATCH_SRC.get(name);
  const model=MODELS.ready.get(name);
  if(!model)return null;
  const meshes=[];
  model.scene.traverseVisible(o=>{if(o.isMesh||o.isSprite||o.isLine||o.isPoints)meshes.push(o);});
  const o=meshes[0];
  if(model.animations.length||meshes.length!==1||!o.isMesh||o.isSkinnedMesh||o.isInstancedMesh||Array.isArray(o.material)||o.material.transparent){
    PROP_BATCH_SRC.set(name,null);return null;
  }
  model.scene.updateMatrixWorld(true);
  const source={name,geo:o.geometry,mat:matTwin(o.material,'inst'),transform:o.matrixWorld.clone(),shadow:o.castShadow,receive:o.receiveShadow};
  PROP_BATCH_SRC.set(name,source);
  return source;
}
function propBatchMesh(source,capacity){
  const mesh=new THREE.InstancedMesh(source.geo,source.mat,capacity);
  mesh.name=source.name+' batch';
  mesh.castShadow=source.shadow;mesh.receiveShadow=source.receive;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return mesh;
}
function propBatchWrite(batch,q,i){
  batch.mesh.setMatrixAt(i,_propMatrix.multiplyMatrices(q.g.matrix,batch.source.transform));
  q.batchIndex=i;
}
function propBatchAdd(q,source){
  const key=source.name+'|'+q.tile;
  let batch=PROPV.batches.get(key);
  if(!batch){
    const mesh=propBatchMesh(source,PROPV.sizes.get(q.tile));
    mesh.count=0;mesh.visible=false;PROPV.g.add(mesh);
    batch={mesh,source,members:[]};PROPV.batches.set(key,batch);
  }
  const i=batch.members.length;
  batch.members.push(q);q.batch=batch;propBatchWrite(batch,q,i);
  PROPV.dirty.add(batch);
}
function propBatchRemove(q){
  const batch=q.batch,last=batch.members.pop();
  if(last!==q){batch.members[q.batchIndex]=last;propBatchWrite(batch,last,q.batchIndex);}
  q.batch=null;PROPV.dirty.add(batch);
}
function syncProps(v){
  if(!v||!v.PB){if(PROPV.g)PROPV.g.visible=false;return;}
  if(!PROPV.g||PROPV.g.parent!==world||PROPV.map!==builtMap){
    PROPV.g=new THREE.Group();world.add(PROPV.g);PROPV.map=builtMap;PROPV.list=[];
    PROPV.batches.clear();PROPV.sizes.clear();PROPV.dirty.clear();
    prefetchModels(Object.values(PROPDEF).flatMap(D=>[D.model,D.model+'_broken',D.model+'_used']));
    for(const o of PROPS){
      const g=new THREE.Group();g.position.set(tx(o.x),GY(o.x,o.y),tz(o.y));g.rotation.y=o.a;
      g.updateMatrix();g.matrixAutoUpdate=false;PROPV.g.add(g);
      const tile=PROP_BATCH_TYPES.has(o.k)?Math.floor(g.position.x/72)+','+Math.floor(g.position.z/72)+'|'+o.k:null;
      if(tile!==null)PROPV.sizes.set(tile,(PROPV.sizes.get(tile)||0)+1);
      PROPV.list.push({g,st:-1,o,tile,batch:null});
    }
  }
  PROPV.g.visible=true;
  for(const q of PROPV.list){
    if(farCull(q.o.x,q.o.y,60)){
      q.g.visible=false;
      if(q.batch){propBatchRemove(q);q.st=-1;}
      continue;
    }
    q.g.visible=!q.batch;
    const st=+(v.PB[q.o.i]||0),D=PROPDEF[q.o.k],name=D.model+(st===1?'_broken':st===2?'_used':'');
    if(st===q.st&&q.batch)continue;
    const source=PROPV.sizes.get(q.tile)>1?propBatchSource(name):null;
    if(st===q.st&&!source)continue;
    if(q.batch)propBatchRemove(q);
    q.st=st;
    for(const c of [...q.g.children]){q.g.remove(c);disposeTree(c);}
    q.g.visible=!source;
    if(source)propBatchAdd(q,source);
    else q.g.add(modelOr(name,()=>propFallback(q.o.k,st)));
    gl.shadowMap.needsUpdate=true;
  }
  for(const batch of PROPV.dirty){
    const mesh=batch.mesh;
    mesh.count=batch.members.length;mesh.visible=mesh.count>0;
    if(mesh.count)mesh.computeBoundingSphere();
    mesh.instanceMatrix.needsUpdate=true;
    gl.shadowMap.needsUpdate=true;
  }
  PROPV.dirty.clear();
}
// ---------- flying debris (city towers / props): chunks fall, bounce, then rest as rubble for the match ----------
// The old breakable-house view lived here (removed 2026-11-21: houses are breakable panels now, js/12-pnl.js + js/28-pnl-build.js)
const CHARM=new Map(),DEBRIS=[];
let _bldIce=null;
function charMat(m){
  let c=CHARM.get(m.uuid);if(c)return c;
  c=m.clone();if(c.color)c.color.multiplyScalar(0.18);if(c.emissive)c.emissive.set('#000000');c.userData.keep=true;CHARM.set(m.uuid,c);return c;
}
function bldIceMat(){if(!_bldIce){_bldIce=iceMat(0.42);_bldIce.depthWrite=false;_bldIce.userData.keep=true;}return _bldIce;}
// ตก/กระดอน/ไถลบนพื้น (ระดับพื้นจริง GY) → หมดเวลาแล้วนิ่ง = ย้ายเข้ากองซากค้างทั้งแมตช์ (bfRest js/44) • สตูดิโอ VFX = หดหายแบบเดิม
function updateDebris(dt){
  for(let i=DEBRIS.length-1;i>=0;i--){
    const q=DEBRIS[i],m=q.m;q.life-=dt;
    if(q.gy===undefined)q.gy=GY(m.position.x/S3+MW/2,m.position.z/S3+MH/2);
    q.vy-=18*dt;m.position.x+=q.vx*dt;m.position.y+=q.vy*dt;m.position.z+=q.vz*dt;
    const fy=q.gy+(q.big?0.35:0.1);let gnd=false;
    if(m.position.y<fy){m.position.y=fy;gnd=true;if(q.vy<-4&&q.big&&!q.dust){q.dust=1;const p=simOf(m.position);smoke(p.x,p.y,0.2,3,'#8a7a68',1.4,9,60);snd('thud',{x:p.x,y:p.y,vol:0.4});}
      else if(q.vy<-5&&!q.tick&&Math.random()<0.2){q.tick=1;const p=simOf(m.position);snd('rubble',{x:p.x,y:p.y,vol:0.25});}   // เศษตกกระทบพื้น (สนามรบ ขั้น 5)
      q.vy=Math.abs(q.vy)*0.3;q.vx*=0.6;q.vz*=0.6;q.rx*=0.5;q.rz*=0.5;if(q.vy<0.8)q.vy=0;}
    if(gnd){const f=Math.exp(-5*dt);q.vx*=f;q.vz*=f;q.rx*=f;q.rz*=f;}
    m.rotation.x+=q.rx*dt;m.rotation.z+=q.rz*dt;
    if(q.life<=0&&(q.keep||(q.keep=(gnd&&Math.hypot(q.vx,q.vz)<0.5)||q.life<-2?1:0))){DEBRIS.splice(i,1);debrisDrop(q);continue;}
  }
}
// ชิ้นที่จบแล้ว: ค้างเป็นซาก (ไฟไหม้ = มีควันกรุ่น) • ค้างไม่ได้ (สตูดิโอ) = ลบ
function debrisDrop(q){if(!bfRest(q.m,q.fire,q.big))scene.remove(q.m);}
// เศษที่กำลังบินเกินเพดาน: ทิ้งเศษเล็กเก่าสุดก่อน (ชิ้นผนังใหญ่เก็บไว้ให้ตกถึงพื้น) — ยังไม่ตกถึงพื้น = ลบ ไม่ค้างกลางอากาศ
function debrisCap(){while(DEBRIS.length>260){let i=DEBRIS.findIndex(q=>!q.big);if(i<0)i=0;const q=DEBRIS.splice(i,1)[0];if(q.keep)debrisDrop(q);else scene.remove(q.m);}}
function clearDebris(){for(const q of DEBRIS)scene.remove(q.m);DEBRIS.length=0;}
function drawPropHint(me){
  const o=nearUseProp(me.x,me.y);if(!o)return;
  const t='['+keyName(KEYS.use)+']  '+PROPDEF[o.k].use;
  cx.font="600 15px 'Kanit',sans-serif";cx.textAlign='center';
  const w=cx.measureText(t).width+28,x=SW/2,y=SH*0.66;
  cx.fillStyle='rgba(10,14,30,0.72)';cx.fillRect(x-w/2,y-16,w,30);cx.strokeStyle='rgba(217,180,90,0.7)';cx.lineWidth=1;cx.strokeRect(x-w/2,y-16,w,30);
  cx.fillStyle='#f3dc94';cx.fillText(t,x,y+5);
}
function syncWalls(v){
  const seen=new Set();
  for(const w of (v.WL||[])){
    seen.add(w[0]);let o=WM3.get(w[0]);
    if(!o){
      const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:'#bfeaff',roughness:0.15,metalness:0.1,transparent:true,opacity:0.85,emissive:'#2f6a9a',flatShading:true});
      const r=w[3]*S3;
      for(const [ox,oz,sx,sy] of [[0,0,1.1,3.8],[0.5,0.3,0.55,2.4],[-0.5,-0.25,0.6,2.8]]){const m=new THREE.Mesh(new THREE.OctahedronGeometry(1,0),mat);m.scale.set(r*sx,sy,r*sx);m.position.set(ox,sy*0.9,oz);m.rotation.y=w[0]*1.7+ox;m.castShadow=true;g.add(m);}
      const gl2=new THREE.Sprite(glowMat('#8fe0ff',1.2));gl2.scale.set(5,4,1);gl2.position.y=2.2;g.add(gl2);
      scene.add(g);o={g,mat};WM3.set(w[0],o);
    }
    o.g.position.set(tx(w[1]),GY(w[1],w[2]),tz(w[2]));
    o.mat.opacity=0.5+0.4*clamp(w[4]/70,0,1);
    if(Math.random()<0.1)burst(w[1]+rnd(-30,30),w[2]+rnd(-30,30),'#cfeaff',1,20,0.8,1.6,{h:rnd(0.5,4),vh:[0,1],g:-0.2});
  }
  for(const [id,o] of WM3)if(!seen.has(id)){disposeObj(o.g);o.mat.dispose();WM3.delete(id);}
}

// ---------- ของบังในแผนที่ไฟล์ที่พังได้ ฝั่งแสดงผล (สถานะจาก BRK[].st — host js/12-buildings.js) ----------
// โมเดลที่ map_export.py ติด userData.brk ไว้: ไม่รวม batch → รวมเป็น InstancedMesh ต่อ (geometry, วัสดุ) • ร้าว = ดึงออกมาเป็น mesh วัสดุรอยร้าว
// พัง = ตัดโมเดลเหลือส่วนล่าง 1/3 (ขอบหยัก) + กองหินบนรอยตัด • ตอนพัง (event brk:b) ส่วนบนล้มออกจากจุดระเบิดแล้วจมหาย (เฉพาะเครื่องนี้)
const BRKV={sc:null,grp:[],fall:[]},BRK_COL={stone:'#7d776d',wood:'#6a4a30',ice:'#bfe6f5'};
function brkSetup(sc,skip){
  BRKV.sc=null;BRKV.grp=[];BRKV.fall.length=0;
  const objs=[];sc.traverse(o=>{const b=o.userData&&o.userData.brk;if(b!=null&&o!==sc){(objs[b]=objs[b]||[]).push(o);skip.add(o);}});
  if(!objs.length)return;
  sc.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(sc.matrixWorld).invert(),ims=new Map();
  objs.forEach((L,i)=>{if(!L)return;const q={i,parts:[],key:-1,dmg:null,cut:null};BRKV.grp[i]=q;
    for(const o of L){o.traverse(m=>{if(!m.isMesh||Array.isArray(m.material))return;
      const M=new THREE.Matrix4().multiplyMatrices(inv,m.matrixWorld),vp=phOf(m),k=m.geometry.uuid+'|'+m.material.uuid+'|'+(vp||'');   // vp = phase layer (js/28-maps-build)
      let e=ims.get(k);if(!e)ims.set(k,e={geo:m.geometry,mat:m.material,list:[],cs:m.castShadow,vp});
      const p={geo:m.geometry,mat:m.material,M,e,idx:e.list.length};e.list.push(p);q.parts.push(p);});
      if(o.parent)o.parent.remove(o);}
  });
  for(const e of ims.values()){
    const im=new THREE.InstancedMesh(e.geo,matTwin(e.mat,'inst'),e.list.length);   // วัสดุแฝด: ชิ้นแผนที่อื่นใช้วัสดุเดียวกันแบบไม่ instanced (js/22 matTwin)
    e.list.forEach((p,j)=>im.setMatrixAt(j,p.M));
    im.castShadow=e.cs;im.receiveShadow=true;im.computeBoundingSphere();if(e.vp)im.userData.vp=e.vp;sc.add(im);e.im=im;}
  BRKV.sc=sc;
}
// วัสดุรอยร้าว: เส้นร้าวจากลาย voronoi ในพิกัดโลก (ไม่ต้องมี uv) • lv 1 = ร้าวบาง, 2 = ร้าวหนา + มืดลง
const BRK_CM=new Map();
function brkCrackMat(mat,lv){
  const k=mat.uuid+'|'+lv;let m=BRK_CM.get(k);if(m)return m;
  m=mat.clone();const w=lv>1?0.07:0.04,dk=lv>1?0.85:0.97,dn=lv>1?'0.85':'0.4';   // dn = สัดส่วนเส้นร้าวที่โผล่
  m.onBeforeCompile=s=>{
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vBrkW;').replace('#include <project_vertex>','#include <project_vertex>\nvBrkW=(modelMatrix*vec4(transformed,1.0)).xyz;');
    s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vBrkW;
vec3 brkH(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return fract(sin(p)*43758.5453);}
vec2 brkCell(vec3 x){vec3 n=floor(x),f=fract(x);float d1=8.0,d2=8.0,id=0.0,id2=0.0;
  for(int k=-1;k<=1;k++)for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec3 g=vec3(float(i),float(j),float(k)),h=brkH(n+g),r=g+h-f;float d=dot(r,r);if(d<d1){d2=d1;id2=id;d1=d;id=h.y;}else if(d<d2){d2=d;id2=h.y;}}
  return vec2(sqrt(d2)-sqrt(d1),min(id,id2));}`).replace('#include <map_fragment>',`#include <map_fragment>
{vec2 e=brkCell(vBrkW*1.6);diffuseColor.rgb*=${dk.toFixed(2)}*mix(0.18,1.0,max(smoothstep(${(w*0.5).toFixed(3)},${w.toFixed(3)},e.x),step(${dn},e.y)));}`);
  };
  m.customProgramCacheKey=()=>'brk'+lv;BRK_CM.set(k,m);return m;
}
// ตัด geometry (พิกัดฉาก) ด้วยระนาบหยัก y = yc(x,z): below = เก็บส่วนล่าง ไม่งั้นเก็บส่วนบน
function brkClip(geo,M,yc,below){
  const g=(geo.index?geo.toNonIndexed():geo.clone()).applyMatrix4(M),names=Object.keys(g.attributes).filter(n=>g.attributes[n].itemSize<=4),A=names.map(n=>g.attributes[n]),pi=names.indexOf('position'),out=names.map(()=>[]);
  const P=g.attributes.position,get=['getX','getY','getZ','getW'];
  const vert=i=>A.map(a=>{const r=[];for(let k=0;k<a.itemSize;k++)r.push(a[get[k]](i));return r;});
  const lerpV=(u,v,t)=>u.map((arr,j)=>arr.map((x,k)=>x+(v[j][k]-x)*t));
  for(let i=0;i+2<P.count;i+=3){
    const vs=[vert(i),vert(i+1),vert(i+2)],sd=vs.map(v=>{const p=v[pi],y=yc(p[0],p[2]);return below?y-p[1]:p[1]-y;});
    if(sd.every(d=>d>=0)){vs.forEach(v=>v.forEach((a,j)=>out[j].push(...a)));continue;}
    if(sd.every(d=>d<0))continue;
    const poly=[];for(let e=0;e<3;e++){const a=vs[e],b=vs[(e+1)%3],da=sd[e],db=sd[(e+1)%3];if(da>=0)poly.push(a);if((da>=0)!==(db>=0))poly.push(lerpV(a,b,da/(da-db)));}
    for(let t=1;t+1<poly.length;t++)for(const v of [poly[0],poly[t],poly[t+1]])v.forEach((a,j)=>out[j].push(...a));
  }
  const r=new THREE.BufferGeometry();names.forEach((n,j)=>r.setAttribute(n,new THREE.BufferAttribute(new Float32Array(out[j]),A[j].itemSize)));
  g.dispose();if(r.attributes.normal)r.normalizeNormals();return r;
}
function brkYc(q){const g=BRK[q.i],b=GY(g.x,g.y)+(g.d.vh||g.d.h)*BRKDEF.rub,s=q.i*1.7;return (x,z)=>b+0.22*Math.sin(x*2.3+s)*Math.cos(z*1.9-s)+0.12*Math.sin((x+z)*5.1+s);}
// ซาก: ส่วนล่างของทุกชิ้น + ก้อนหิน/ไม้บนรอยตัด
function brkStump(q){
  if(q.cut)return q.cut;const g=BRK[q.i],yc=brkYc(q),G3=new THREE.Group();
  for(const p of q.parts){const m=new THREE.Mesh(brkClip(p.geo,p.M,yc,true),brkCrackMat(p.mat,2));m.castShadow=m.receiveShadow=true;G3.add(m);}
  const R=Math.max(...g.cs.map(o=>o.r))*S3*(g.d.m==='wood'?0.45:1),cx=tx(g.x),cz=tz(g.y),y=GY(g.x,g.y)+(g.d.vh||g.d.h)*BRKDEF.rub,mat=new THREE.MeshStandardMaterial({color:BRK_COL[g.d.m]||BRK_COL.stone,roughness:0.95,flatShading:true});
  const disc=new THREE.Mesh(new THREE.CircleGeometry(R*0.95,9),new THREE.MeshStandardMaterial({color:'#2a2622',roughness:1}));disc.rotation.x=-Math.PI/2;disc.position.set(cx,y-0.06,cz);G3.add(disc);
  const n=3+Math.min(5,Math.round(R*2));
  for(let k=0;k<n;k++){const a=k/n*6.283+q.i,d=R*(0.15+0.55*((k*0.37+q.i*0.11)%1)),s=R*(0.3+0.25*((k*0.53)%1));
    const m=new THREE.Mesh(sGeo(THREE.DodecahedronGeometry,1,0),mat);m.scale.set(s,s*0.7,s);m.position.set(cx+Math.cos(a)*d,y-s*0.2,cz+Math.sin(a)*d);m.rotation.set(k,k*2.1,k*0.7);m.castShadow=true;G3.add(m);}
  return q.cut=G3;
}
function brkSync(dt){
  if(!BRKV.sc)return;
  if(BRKV.sc.parent!==world){BRKV.sc=null;BRKV.grp=[];BRKV.fall.length=0;return;}
  let ch=false;
  for(const q of BRKV.grp){if(!q)continue;const g=BRK[q.i],st=g?g.st:0;if(st===q.key)continue;
    q.key=st;ch=true;
    if(q.dmg){BRKV.sc.remove(q.dmg);q.dmg=null;}
    for(const p of q.parts){p.e.im.setMatrixAt(p.idx,st?BRK_ZERO:p.M);p.e.im.instanceMatrix.needsUpdate=true;}
    if(st>=3)q.dmg=brkStump(q);
    else if(st){q.dmg=new THREE.Group();for(const p of q.parts){const m=new THREE.Mesh(p.geo,brkCrackMat(p.mat,st));m.matrixAutoUpdate=false;m.matrix.copy(p.M);m.castShadow=p.e.cs;m.receiveShadow=true;q.dmg.add(m);}}
    if(q.dmg)BRKV.sc.add(q.dmg);
  }
  if(ch)gl.shadowMap.needsUpdate=true;
  for(let i=BRKV.fall.length-1;i>=0;i--){const f=BRKV.fall[i];f.t+=dt;
    if(f.t<f.T){f.w+=f.acc*dt;f.ang=Math.min(f.max,f.ang+f.w*dt);f.piv.quaternion.setFromAxisAngle(f.ax,f.ang);if(f.ang>=f.max&&!f.hit){f.hit=1;f.T=f.t;if(f.onHit)f.onHit();}}
    else if(!FXSTUDIO.own&&BF.on){   // สนามรบ: ส่วนบนหล่นจากตอลงนอนราบกับพื้น แล้วค้างทั้งแมตช์ (รวม mesh — bfRest js/44)
      f.vy=(f.vy||0)+14*dt;f.piv.position.y=Math.max(f.gy+0.15,f.piv.position.y-f.vy*dt);f.ang=Math.min(Math.PI*0.5,f.ang+dt*1.2);f.piv.quaternion.setFromAxisAngle(f.ax,f.ang);
      if(f.piv.position.y<=f.gy+0.15&&f.ang>=Math.PI*0.5){bfRest(f.piv,false,true);f.piv.traverse(m=>{if(m.isMesh)m.geometry.dispose();});BRKV.fall.splice(i,1);}}
    else{f.piv.position.y-=dt*0.8;if(f.t>f.T+1.6){BRKV.sc.remove(f.piv);f.piv.traverse(m=>{if(m.isMesh)m.geometry.dispose();});BRKV.fall.splice(i,1);}}
    gl.shadowMap.needsUpdate=true;}
}
const BRK_ZERO=new THREE.Matrix4().makeScale(0,0,0);
// ตอนพัง: ส่วนบนเหนือรอยตัดล้มออกจากจุดระเบิด (ox,oy) แล้วหล่นนอนค้างบนพื้นทั้งแมตช์ (สตูดิโอ VFX = จมลงดินแบบเดิม)
function brkFall(ev){
  const q=BRKV.grp[ev.i],g=BRK[ev.i];if(!q||!g||!BRKV.sc)return;
  const yc=brkYc(q),cx=tx(g.x),cz=tz(g.y),y=GY(g.x,g.y)+(g.d.vh||g.d.h)*BRKDEF.rub,piv=new THREE.Group();piv.position.set(cx,y,cz);
  for(const p of q.parts){const m=new THREE.Mesh(brkClip(p.geo,p.M,yc,false),brkCrackMat(p.mat,2));m.position.set(-cx,-y,-cz);m.castShadow=true;piv.add(m);}
  let dx=g.x-ev.ox,dy=g.y-ev.oy;const dl=Math.hypot(dx,dy);if(dl<1){const a=ev.i*2.4;dx=Math.cos(a);dy=Math.sin(a);}else{dx/=dl;dy/=dl;}
  BRKV.sc.add(piv);
  const tall=(g.d.vh||g.d.h)*(1-BRKDEF.rub);
  BRKV.fall.push({piv,gy:GY(g.x,g.y),ax:new THREE.Vector3(dy,0,-dx).normalize(),ang:0,w:0.6,acc:Math.max(3,14/Math.max(1,tall*0.5)),max:Math.PI*0.48,t:0,T:3,
    onHit(){const lx=g.x+dx*tall*12,ly=g.y+dy*tall*12;fx({k:'brk',t:'land',i:ev.i,mi:ev.mi,col:ev.col,sz:ev.sz,hh:ev.hh,x:Math.round(lx),y:Math.round(ly),h:0.2,r:ev.r});}});
}
