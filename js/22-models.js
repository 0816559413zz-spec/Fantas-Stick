// ---------- โมเดลจากไฟล์ (.glb จาก Blender) — ข้อตกลงฝั่งคนปั้นอยู่ใน guides/ASSETS.md ----------
// assets/manifest.json = {"v":1,"models":{"prop_crate":{"file":"props/crate.glb","v":1}}} (ไม่มีไฟล์/ไม่มีชื่อ = ใช้โมเดลจากโค้ดตามเดิม)
// loadModel(name) → Promise<{scene,animations,skinned}|null> โหลดครั้งเดียวใช้ซ้ำ • modelOr(name,fallback) → Group โชว์ของสำรองก่อน แล้วสลับเป็นไฟล์เมื่อโหลดเสร็จ
// GLTFLoader/Draco/Meshopt ถูก import ตอนมีโมเดลให้โหลดจริงเท่านั้น (เปิดหน้าเว็บไม่หนักขึ้น)
const MODELS={man:null,manP:null,loaderP:null,lib:null,cache:new Map(),ready:new Map(),fail:new Set()};
function modelManifest(){
  if(!MODELS.manP)MODELS.manP=fetch('assets/manifest.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null)
    .then(m=>{MODELS.man=(m&&m.models)?m:{v:0,models:{}};return MODELS.man;});
  return MODELS.manP;
}
function gltfLoader(){
  if(!MODELS.loaderP)MODELS.loaderP=Promise.all([import('three/addons/loaders/GLTFLoader.js'),import('three/addons/loaders/DRACOLoader.js'),import('three/addons/libs/meshopt_decoder.module.js'),import('three/addons/utils/SkeletonUtils.js')])
    .then(([GL,DL,MO,SU])=>{const L=new GL.GLTFLoader(),dr=new DL.DRACOLoader();dr.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');L.setDRACOLoader(dr);L.setMeshoptDecoder(MO.MeshoptDecoder);MODELS.lib={SU};return L;});
  return MODELS.loaderP;
}
function loadModel(name){
  if(MODELS.cache.has(name))return MODELS.cache.get(name);
  const pr=modelManifest().then(m=>{
    const e=m.models[name];if(!e)return null;
    return gltfLoader().then(L=>L.loadAsync('assets/'+e.file+'?v='+(e.v||m.v||0))).then(gltf=>{
      const sc=gltf.scene;let skinned=false;
      // ของจากไฟล์ใช้ร่วมกันทุกชิ้น → ทำเครื่องหมาย keep (disposeTree จะไม่ทิ้ง) • เปิดเงาให้ทุก mesh
      sc.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=true;if(o.isSkinnedMesh)skinned=true;o.geometry.userData.keep=true;
        for(const mt of [].concat(o.material)){mt.userData.keep=true;for(const k in mt){const v=mt[k];if(v&&v.isTexture)v.userData.keep=true;}}});
      if(!skinned&&/^(prop_|bld_|city_|debris_)/.test(name)&&typeof surfScene==='function')surfScene(sc,false);   // ผิววัสดุ (js/76): ของประกอบฉากไม่ใช่ตัวละคร/เอฟเฟกต์
      const r={scene:sc,animations:gltf.animations||[],skinned,info:e};MODELS.ready.set(name,r);return r;
    });
  }).catch(err=>{console.warn('model',name,err);MODELS.fail.add(name);return null;});
  MODELS.cache.set(name,pr);return pr;
}
function modelInst(name){const r=MODELS.ready.get(name);if(!r)return null;return r.skinned&&MODELS.lib?MODELS.lib.SU.clone(r.scene):r.scene.clone(true);}
function modelOr(name,fallback){
  const holder=new THREE.Group(),inst=modelInst(name);
  if(inst){holder.add(inst);return holder;}
  const fb=fallback?fallback():null;if(fb)holder.add(fb);
  if(name&&!MODELS.fail.has(name))loadModel(name).then(r=>{
    if(!r||!holder.parent)return;                 // ไม่มีไฟล์ หรือของถูกลบไปแล้ว
    const m=modelInst(name);if(!m)return;
    if(fb){holder.remove(fb);disposeTree(fb);}
    holder.add(m);gl.shadowMap.needsUpdate=true;
  });
  return holder;
}
function prefetchModels(names){modelManifest().then(m=>{for(const n of names)if(m.models[n])loadModel(n);});}

// ---------- Animation จากไฟล์ (Blender Actions) + โมเดลตัวละคร/ศัตรูจากไฟล์ ----------
// ชื่อท่า (ชื่อ Action ใน Blender, ไม่สนตัวพิมพ์ / ตัด "Armature|" ข้างหน้าออก): idle walk run fly cast attack hit down
// ท่าไหนไม่มี → ใช้ท่าใกล้เคียงตาม ANIM_ALT • ไม่มีเลย → ยืนนิ่งตามท่าในไฟล์ • ไม่ต้องแก้ protocol: เลือกท่าจาก snapshot ที่มีอยู่แล้ว
const ANIM_ALT={idle:['idle'],walk:['walk','run','idle'],run:['run','walk','idle'],fly:['fly','idle'],cast:['cast','attack'],attack:['attack','cast'],hit:['hit'],down:['down','die','idle']};
function makeAnimator(root,clips){
  const mixer=new THREE.AnimationMixer(root),acts={};
  for(const c of clips){const n=c.name.split('|').pop().toLowerCase().trim();if(!acts[n])acts[n]=mixer.clipAction(c);}
  return {mixer,acts,cur:null,curName:'',lockT:0,latch:{}};
}
function animResolve(A,name){for(const n of (ANIM_ALT[name]||[name]))if(A.acts[n])return n;return null;}
function animPlay(A,name,opt){
  opt=opt||{};const n=animResolve(A,name);if(!n)return null;
  const a=A.acts[n];a.timeScale=opt.speed||1;
  if(A.curName===n&&!opt.restart)return n;
  a.reset();a.setLoop(opt.once?THREE.LoopOnce:THREE.LoopRepeat,Infinity);a.clampWhenFinished=!!opt.once;a.enabled=true;a.setEffectiveWeight(1);
  if(A.cur&&A.cur!==a)a.crossFadeFrom(A.cur,opt.fade!==undefined?opt.fade:0.15,false);
  a.play();A.cur=a;A.curName=n;return n;
}
// st: {down, fly, sp (หน่วย/วินาที), castT (>0 = เพิ่งร่าย), atk (ศัตรูกำลังโจมตี), hitT (>0 = เพิ่งโดน)}
// lod = อัปเดตท่าทุกกี่เฟรม (ตัวไกล 2-3): สะสมเวลาไว้ ความเร็วท่าจึงเท่าเดิม • _animN สลับเฟรมกัน จะได้ไม่ลงเฟรมเดียวกันหมด
let _animN=0;const ANIM_NEAR=35*35,ANIM_FAR=70*70;
function animLod(g){const dx=g.position.x-cam.position.x,dz=g.position.z-cam.position.z,d=dx*dx+dz*dz;return d<ANIM_NEAR?1:d<ANIM_FAR?2:3;}
function animTick(o,st,dt,lod){
  const A=o.anim;if(!A)return;
  A.lockT=Math.max(0,A.lockT-dt);
  if(st.down){animPlay(A,'down',{once:true});A.lockT=0;A.mixer.update(dt);return;}
  const shot=(k,on)=>{
    if(on&&!A.latch[k]){A.latch[k]=1;const n=animPlay(A,k,{once:true,restart:true,fade:0.08});if(n)A.lockT=A.acts[n].getClip().duration*0.9;}
    else if(!on)A.latch[k]=0;
  };
  shot('cast',st.castT>0);shot('attack',!!st.atk);shot('hit',st.hitT>0);
  if(A.lockT<=0){
    if(st.fly)animPlay(A,'fly');
    else if(st.sp>4.5)animPlay(A,'run',{speed:clamp(st.sp/7,0.7,1.6)});
    else if(st.sp>0.6)animPlay(A,'walk',{speed:clamp(st.sp/3.5,0.6,1.6)});
    else animPlay(A,'idle');
  }
  if(lod>1){A.acc=(A.acc||0)+dt;if(A.skip===undefined)A.skip=_animN++;if(++A.skip%lod)return;dt=A.acc;A.acc=0;}
  else if(A.acc){dt+=A.acc;A.acc=0;}
  A.mixer.update(dt);
}
// สีตามหน้าตาผู้เล่น: วัสดุใน Blender ชื่อ tint_<ช่อง> จะถูกใส่สีให้ (โคลนวัสดุเฉพาะตัวนั้น)
function lookTint(look){
  const H=HOUSES[look.h]||HOUSES[0];
  return {house:H.c,house2:H.c2,hair:HAIRC[look.hr],skin:SKINC[look.sk],cloak:CLOAKC[look.cl],eyes:EYEC[look.ey],wand:WOODC[look.wd],core:WCOREC[look.wc]};
}
function tintModel(root,tint){
  const done=new Map();
  root.traverse(m=>{
    if(!m.isMesh)return;
    const one=mt=>{
      const k=(mt.name||'').toLowerCase();if(!k.startsWith('tint_'))return mt;
      const col=tint[k.slice(5)];if(!col)return mt;
      if(!done.has(mt)){const c=mt.clone();c.userData={};c.color.set(col);done.set(mt,c);}   // ตัวโคลนไม่ keep → ทิ้งพร้อมตัวละคร
      return done.get(mt);
    };
    m.material=Array.isArray(m.material)?m.material.map(one):one(m.material);
  });
}
// GLTF material splits have identical bone lists but separate Skeleton objects.
// Share one per compatible bind layout so the renderer uploads bones once.
function shareSkinSkeletons(root){const groups=[];
  root.traverse(m=>{if(!m.isSkinnedMesh)return;const s=m.skeleton;
    const same=groups.find(q=>q.bones.length===s.bones.length&&q.bones.every((b,i)=>b===s.bones[i]&&q.boneInverses[i].equals(s.boneInverses[i])));
    if(same){if(same!==s){m.skeleton=same;s.dispose();}}else groups.push(s);
  });
}
// Keep the palette and the two named cloth panels separate. Plain front-facing
// skin/iris/scarf trim can use the existing per-vertex colour/PBR body shader.
function batchStudentSkin(root){const groups=new Map();
  root.traverse(m=>{const mat=m.material,g=m.geometry;
    if(!m.isSkinnedMesh||!['tint_skin','tint_eyes','tint_house2'].includes(mat&&mat.name)||!mat.isMeshStandardMaterial||mat.transparent||mat.map||mat.side!==THREE.FrontSide||Object.keys(g.morphAttributes).length||m.children.length)return;
    const key=m.parent.uuid+'|'+m.skeleton.uuid;let L=groups.get(key);if(!L)groups.set(key,L=[]);L.push(m);
  });
  for(const L of groups.values()){const first=L[0];if(L.length<2||L.some(m=>!m.matrix.equals(first.matrix)||!m.bindMatrix.equals(first.bindMatrix)||m.castShadow!==first.castShadow||m.receiveShadow!==first.receiveShadow))continue;
    const geos=L.map(m=>{const g=m.geometry.clone(),n=g.attributes.position.count,c=m.material.color,C=new Float32Array(n*3),R=new Float32Array(n),M=new Float32Array(n);
      for(let i=0;i<n;i++){C[i*3]=c.r;C[i*3+1]=c.g;C[i*3+2]=c.b;R[i]=m.material.roughness;M[i]=m.material.metalness;}
      g.setAttribute('color',new THREE.BufferAttribute(C,3));g.setAttribute('aRough',new THREE.BufferAttribute(R,1));g.setAttribute('aMetal',new THREE.BufferAttribute(M,1));return g;});
    const geo=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());if(!geo)continue;geo.userData={};
    const mesh=new THREE.SkinnedMesh(geo,bodyMat(THREE.FrontSide));mesh.name='student_skin_batch';mesh.position.copy(first.position);mesh.quaternion.copy(first.quaternion);mesh.scale.copy(first.scale);
    mesh.bind(first.skeleton,first.bindMatrix);mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;mesh.frustumCulled=first.frustumCulled;
    first.parent.add(mesh);const unused=new Set(L.map(m=>m.material));for(const m of L)m.parent.remove(m);
    root.traverse(m=>{for(const mat of [].concat(m.material||[]))unused.delete(mat);});const keep=keepMatSet();for(const mat of unused)disposeMaterial(mat,keep);
  }
}
// รวมตัวละครของผู้เล่นคนอื่นทั้งตัวเป็น SkinnedMesh เดียว (ผู้ใช้ 2026-11-06: 10 draw → 2 ต่อคน รวมเงาอีกเท่าตัว)
// สี/ความหยาบลงที่จุดยอด (bodyMat) • ผม/เนคไทเดิมเป็นลูกของกระดูก = แปลงเป็นน้ำหนักกระดูกนั้น 100% • ไม้กายสิทธิ์แยกไว้
// ตัวเราไม่รวม: ผ้าคลุมจำลองจริง (js/49) ต้องใช้แผง tint_cloak/tint_house แยก • ?unbatchedStudent = ปิด
const _palPx=new Map();
function palPixels(t){let d=_palPx.get(t);if(d!==undefined)return d;d=null;
  try{const w=t.image.width,h=t.image.height,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(t.image,0,0);d={w,h,a:x.getImageData(0,0,w,h).data};}catch(e){}
  _palPx.set(t,d);return d;}
const _s2l=v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4);
function mergeStudent(root){
  root.updateMatrixWorld(true);
  const parts=[];let first=null;
  root.traverse(m=>{if(!m.isMesh)return;for(let q=m;q&&q!==root;q=q.parent)if(!q.visible||/^wand_/.test(q.name))return;
    const mat=m.material;if(!mat||!mat.isMeshStandardMaterial||mat.transparent||mat.emissiveMap||Object.keys(m.geometry.morphAttributes).length)return;
    if(m.isSkinnedMesh&&!first)first=m;parts.push(m);});
  if(!first||parts.length<2)return false;
  const sk=first.skeleton,B=first.bindMatrix,Bi=first.bindMatrixInverse.clone().copy(B).invert(),_i=new THREE.Matrix4(),_m=new THREE.Matrix4(),col=new THREE.Color();
  const geos=[];
  for(const m of parts){const mat=m.material;let g=m.geometry.clone();
    if(m.isSkinnedMesh){if(m.skeleton!==sk||!m.bindMatrix.equals(B)){geos.forEach(q=>q.dispose());g.dispose();return false;}}
    else{let b=m.parent;while(b&&!b.isBone)b=b.parent;const j=b?sk.bones.indexOf(b):-1;if(j<0){geos.forEach(q=>q.dispose());g.dispose();return false;}
      _m.copy(b.matrixWorld).invert().multiply(m.matrixWorld);_i.copy(sk.boneInverses[j]).invert();g.applyMatrix4(_m.premultiply(_i).premultiply(Bi));
      const n=g.attributes.position.count,SI=new Uint16Array(n*4),SW=new Float32Array(n*4);for(let i=0;i<n;i++){SI[i*4]=j;SW[i*4]=1;}
      g.setAttribute('skinIndex',new THREE.BufferAttribute(SI,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(SW,4));}
    const P=g.attributes.position,n=P.count,U=g.attributes.uv,C=new Float32Array(n*3),Rg=new Float32Array(n),Mt=new Float32Array(n),px=mat.map&&U?palPixels(mat.map):null;
    if(mat.map&&!px){geos.forEach(q=>q.dispose());g.dispose();return false;}
    for(let i=0;i<n;i++){col.copy(mat.color);
      if(px){const u=U.getX(i),v=U.getY(i),x=Math.min(px.w-1,Math.floor((u-Math.floor(u))*px.w)),y=Math.min(px.h-1,Math.floor((v-Math.floor(v))*px.h)),k=(y*px.w+x)*4;col.r*=_s2l(px.a[k]/255);col.g*=_s2l(px.a[k+1]/255);col.b*=_s2l(px.a[k+2]/255);}
      C[i*3]=col.r;C[i*3+1]=col.g;C[i*3+2]=col.b;Rg[i]=mat.roughness;Mt[i]=mat.metalness;}
    const SIo=g.attributes.skinIndex,SWo=g.attributes.skinWeight,SI=new Uint16Array(n*4),SW=new Float32Array(n*4);
    for(let i=0;i<n;i++){for(let k=0;k<4;k++){SI[i*4+k]=SIo.getComponent(i,k);SW[i*4+k]=SWo.getComponent(i,k);}}
    const h=new THREE.BufferGeometry();h.setAttribute('position',g.attributes.position);h.setAttribute('normal',g.attributes.normal);
    h.setAttribute('skinIndex',new THREE.BufferAttribute(SI,4));h.setAttribute('skinWeight',new THREE.BufferAttribute(SW,4));
    h.setAttribute('color',new THREE.BufferAttribute(C,3));h.setAttribute('aRough',new THREE.BufferAttribute(Rg,1));h.setAttribute('aMetal',new THREE.BufferAttribute(Mt,1));
    if(g.index)h.setIndex(new THREE.BufferAttribute(Uint32Array.from(g.index.array),1));else{const I=new Uint32Array(n);for(let i=0;i<n;i++)I[i]=i;h.setIndex(new THREE.BufferAttribute(I,1));}
    geos.push(h);}
  const geo=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());if(!geo)return false;geo.userData={};
  const mesh=new THREE.SkinnedMesh(geo,bodyMat(THREE.DoubleSide));mesh.name='student_all_batch';mesh.position.copy(first.position);mesh.quaternion.copy(first.quaternion);mesh.scale.copy(first.scale);
  mesh.bind(sk,B);mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;mesh.frustumCulled=first.frustumCulled;
  first.parent.add(mesh);const unused=new Set(parts.map(m=>m.material));for(const m of parts)m.parent.remove(m);
  root.traverse(m=>{for(const mt of [].concat(m.material||[]))unused.delete(mt);});const keep=keepMatSet();for(const mt of unused)disposeMaterial(mt,keep);
  return true;}
// ใส่โมเดลไฟล์ให้ตัวละคร/ศัตรูที่สร้างจากโค้ดแล้ว: ซ่อน mesh เดิมด้วย layer 31 (กล้อง/เงาไม่วาด — ไม่ใช้ visible เพราะโค้ดคาถาเปิดปิด visible เอง)
// look (ผู้เล่น) = เลือกชิ้น hair_N/tie_N/wand_N ตามหน้าตา + ใส่ไว้ใน o.b (ตัวเอน/ล้มตามโค้ด) + ผูกแขนขาโค้ดกับกระดูก (rigBind) + ไม้กวาดจากไฟล์
function useFileModel(o,name,tint,look){
  const apply=r=>{
    if(!r||o.fileModel||!o.g.parent)return;
    const inst=modelInst(name);if(!inst)return;
    if(tint)tintModel(inst,tint);
    if(look){fileVariants(inst,look);const off=[];inst.traverse(m=>{if(!m.visible&&/^(hair|tie|wand)_\d+$/.test(m.name))off.push(m);});for(const m of off)m.parent.remove(m);}   // ทรงที่ไม่ได้เลือก: ถอดทิ้ง (ซ่อนไว้ three ก็ยังคำนวณทุกเฟรม)
    if(name==='char_student'&&!new URLSearchParams(location.search).has('unbatchedStudent')){shareSkinSkeletons(inst);if(!(o.bat&&mergeStudent(inst)))batchStudentSkin(inst);}
    if(name==='char_student')inst.traverse(m=>{if(m.isMesh&&/^(tie_|wand_|hair_base|char_student_7$)/.test(m.name))m.castShadow=false;});   // ชิ้นเล็กไม่ทอดเงา: เงาแทบไม่เห็น แต่ต้องวาดใน shadow pass ทุกคน (OPTIMIZE §G)
    o.b.traverse(m=>{if(m.isMesh||m.isSprite||m.isPoints||m.isLine)m.layers.set(31);});
    if(look&&o.tip)o.tip.layers.set(0);
    if(look&&o.wnG)o.wnG.traverse(m=>m.layers.set(0));     // ไม้สำเร็จรูป (โค้ด) แทนไม้ในไฟล์                       // แสงปลายไม้ยังโชว์ (อยู่ที่แขนโค้ดซึ่งตามแขนโมเดล)
    if(look&&o.wWings)o.wWings.traverse(m=>m.layers.set(0));   // ปีกเป็นของติดตัว ไม่ใช่ร่างชั่วคราวที่ต้องซ่อนเมื่อ GLB โหลดเสร็จ
    // ร่างโค้ดที่ซ่อนไว้ (layer 31) ไม่ถูกวาดแต่ three ยังคำนวณตำแหน่งทุกเฟรม (~100 ชิ้น/คน, OPTIMIZE §H P2) → ถอดชิ้นปลายทิ้งเลย
    //   เหลือกลุ่มแขน/ขา/ปลายผ้าพันคอ (คาถาจัดท่า + rigBind ใช้) • ผ้าคลุมโค้ดเก็บไว้ (o.cloak ถูกอ้างที่อื่น) แต่หยุดจำลองใน syncPlayers
    if(look){const cl=o.cloak||{},drop=[];o.b.traverse(m=>{if(m.layers.mask>>>0===0x80000000&&!m.children.length&&m!==cl.outer&&m!==cl.inner)drop.push(m);});
      for(const m of drop){m.parent.remove(m);disposeTree(m);}}
    (look?o.b:o.g).add(inst);o.fileModel=inst;
    if(r.animations.length)o.anim=makeAnimator(inst,r.animations);
    if(look){rigBind(o,inst);fileBroom(o);}
    if(o.ghost)setGhost(o,true);
    gl.shadowMap.needsUpdate=true;
  };
  const ready=MODELS.ready.get(name);if(ready)apply(ready);else loadModel(name).then(apply);   // โหลดไว้แล้ว = ใส่ทันที
}
// เวที/เมนู: ท่าจากโค้ด (POSES) ไม่มีท่าเดินปกติให้เทียบ → ล้างแกน y แล้วใช้ 0 เป็นท่าปกติ
function rigStage(o){for(const k of o.rig){if(k.al)continue;const r=k.c.rotation;r.y=0;if(k.leg)r.z=0;k.sx=k.sz=0;}}
// ชิ้นที่ผู้เล่นเลือกได้: object ชื่อ hair_<ทรงผม> tie_<เนคไท> wand_<ไม้> → โชว์เฉพาะเลขที่ตรงกับหน้าตา
function fileVariants(inst,look){const K={hair:'hs',tie:'ti',wand:'ws'};inst.traverse(m=>{const r=/^(hair|tie|wand)_(\d+)$/.exec(m.name);if(r)m.visible=+r[2]===look[K[r[1]]]&&!(r[1]==='wand'&&look.wn>0);});}
function fileBroom(o){loadModel('char_broom').then(r=>{if(!r||!o.g.parent||!o.broom)return;const m=modelInst('char_broom');if(!m)return;for(const c of [...o.broom.children])o.broom.remove(c);o.broom.add(m);});}
// แขนขาโค้ด (o.armR/armL/legs ที่คาถาต่างๆ จัดท่า) ↔ กระดูกโมเดลไฟล์
//  • แขนขวา (ถือไม้) = ตามโค้ดเสมอ → ปลายไม้/ดาบน้ำแข็งที่ติดแขนโค้ดตรงกับมือโมเดล
//  • แขนซ้าย/ขา = ท่าจากไฟล์ แต่ถ้าคาถาจัดท่าต่างจากท่าเดินปกติ (rigStd) จะค่อยๆ เปลี่ยนไปตามโค้ด แล้วคัดลอกท่ากลับให้แขนขาโค้ด (ของที่ติดอยู่ตามไป)
const _rq=new THREE.Quaternion(),_rq2=new THREE.Quaternion(),_rq3=new THREE.Quaternion();
function rigBind(o,inst){
  const qbi=o.b.getWorldQuaternion(new THREE.Quaternion()).invert();
  o.rig=[[o.armR,'upper_arm_R',1],[o.armL,'upper_arm_L',0],[o.legs[0],'thigh_R',0],[o.legs[1],'thigh_L',0]].map(([c,n,al])=>{
    const bone=inst.getObjectByName(n);if(!c||!bone)return null;
    const rel=qbi.clone().multiply(bone.getWorldQuaternion(new THREE.Quaternion()));   // แกนกระดูกตอนยืนตรง เทียบ o.b (แขนขาโค้ดหมุน 0 = แกน o.b)
    return {c,bone,al,rel,irel:rel.clone().invert(),w:al,sx:0,sz:0,leg:n[0]==='t'};
  }).filter(Boolean);
}
function rigStd(o){for(const k of o.rig){if(k.al)continue;const r=k.c.rotation;r.y=0;if(k.leg)r.z=0;k.sx=r.x;k.sz=r.z;}}
function rigSync(o,dt){
  const qbi=o.b.getWorldQuaternion(_rq).invert();
  for(const k of o.rig){
    if(!k.al){const dev=Math.abs(k.c.rotation.x-k.sx)+Math.abs(k.c.rotation.z-k.sz);k.w=dev>0.02?Math.min(1,k.w+dt*12):Math.max(0,k.w-dt*6);}
    if(k.w>0){
      const pB=_rq2.copy(qbi).multiply(k.bone.parent.getWorldQuaternion(_rq3)).invert();
      k.bone.quaternion.slerp(_rq3.copy(k.c.quaternion).multiply(k.rel).premultiply(pB),k.w);
    }
    if(!k.al)k.c.quaternion.copy(_rq2.copy(qbi).multiply(k.bone.getWorldQuaternion(_rq3))).multiply(k.irel);
  }
}
const FILE_MODELS=()=>['char_student','char_broom',...Object.keys(EDEF).map(t=>'enemy_'+t)];

// ---------- VFX จากไฟล์ (รายละเอียดฝั่งคนทำอยู่ใน guides/ASSETS.md) ----------
// .glb ชื่อ vfx_<event> ใน manifest "models": vfx_<z> = เอฟเฟกต์ของ efx event z (เช่น vfx_swing), vfx_cast_<t> = ตอนร่ายกระสุนชนิด t, proj_<t> = หน้าตากระสุน t
//   ตัวเลือก: life (วินาที; ไม่ใส่ = ความยาว animation หรือ 1), radius:true (ปั้นที่รัศมี 1 แล้วขยายตามรัศมีของเอฟเฟกต์), scale, loop, fade (สัดส่วนช่วงท้ายที่จาง, ค่าเริ่ม 0.35), mode:"replace" (ไม่เล่นเอฟเฟกต์จากโค้ด; ค่าเริ่ม "add" = เล่นทับกัน)
//   วัสดุ: ชื่อขึ้นต้น add_ = เรืองแสงแบบบวกแสง • มีคำว่า fade = จางตอนท้าย • ขึ้นต้น tint_ = ใช้สีของคาถา (ถ้า event มีสี)
// flipbook (ภาพเรียงเป็นตาราง) ใน manifest "fx": {"vfx_x":{"file":"vfx/x.png","cols":4,"rows":4,"fps":24,"add":true,"size":2,"loop":false,"mode":"add"}} — ชื่อเดียวกับ .glb ได้ (เล่นทั้งคู่)
// ยังโหลดไม่เสร็จ/ไม่มีไฟล์ = ใช้เอฟเฟกต์จากโค้ดตามเดิม (prefetchFx() โหลดล่วงหน้าตอนสร้างแผนที่)
const VFXL=[],FLIPL=[],FLIPS=new Map();let FLIPGEO=null;
function prefetchFx(){modelManifest().then(m=>{for(const k in m.models)if(k.startsWith('vfx_')||k.startsWith('proj_'))loadModel(k);for(const k in (m.fx||{}))flipTex(k);});ptexLoad();}
function playVfx(name,o){
  const r=MODELS.ready.get(name);if(!r)return false;
  const e=r.info||{},inst=modelInst(name),mats=new Map();
  inst.traverse(m=>{
    if(!m.isMesh)return;m.castShadow=false;
    const one=mt=>{
      const n=(mt.name||'').toLowerCase();if(!n.startsWith('add_')&&!n.includes('fade')&&!n.startsWith('tint_'))return mt;
      if(!mats.has(mt)){
        const c=mt.clone();c.userData={base:mt.opacity!==undefined?mt.opacity:1,fade:n.includes('fade')};
        if(n.startsWith('add_')){c.blending=THREE.AdditiveBlending;c.transparent=true;c.depthWrite=false;}
        if(c.userData.fade)c.transparent=true;
        if(n.startsWith('tint_')&&o.col)c.color.set(o.col);
        mats.set(mt,c);
      }
      return mats.get(mt);
    };
    m.material=Array.isArray(m.material)?m.material.map(one):one(m.material);
  });
  const g=new THREE.Group();g.add(inst);
  g.position.set(tx(o.x),(o.h||0)+GY(o.x,o.y),tz(o.y));
  if(o.a!==undefined)g.rotation.y=Math.atan2(Math.cos(o.a),Math.sin(o.a));
  const rad=e.radius!==undefined?e.radius:o.zr;   // โซน (o.zr) ขยายตามรัศมีเป็นค่าเริ่ม
  g.scale.setScalar((e.scale||1)*(rad&&o.r?o.r*S3:1)*(o.scale||1));
  // ท่าชื่อ start / loop / end = เล่นเป็นช่วง: start ครั้งเดียว → loop วนจนใกล้หมดเวลา → end ครั้งเดียวตอนท้าย • ท่าชื่ออื่นเล่นพร้อมกันทั้งหมด
  // o.hold = อยู่ค้างกี่วินาที (โซน/พื้นไฟ: เท่าเวลาของโซนจริง แทน life ในไฟล์)
  let mixer=null,dur=0,seq=null;
  if(r.animations.length){
    mixer=new THREE.AnimationMixer(inst);const loop=e.loop||!!o.hold,ph={};
    for(const c of r.animations){
      const n=c.name.split('|').pop().toLowerCase().trim();
      if(n==='start'||n==='loop'||n==='end'){ph[n]=mixer.clipAction(c);continue;}
      const a=mixer.clipAction(c);a.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,Infinity);a.clampWhenFinished=true;a.play();dur=Math.max(dur,c.duration);
    }
    if(ph.start||ph.loop||ph.end){
      const d=k=>ph[k]?ph[k].getClip().duration:0;
      seq={...ph,st:0,startD:d('start'),endD:d('end')};dur=Math.max(dur,d('start')+d('loop')+d('end'));
      if(ph.start){ph.start.setLoop(THREE.LoopOnce,1);ph.start.clampWhenFinished=true;ph.start.play();}
      else if(ph.loop){ph.loop.setLoop(THREE.LoopRepeat,Infinity);ph.loop.play();seq.st=1;}
      else{ph.end.setLoop(THREE.LoopOnce,1);ph.end.clampWhenFinished=true;ph.end.play();seq.st=2;}
    }
  }
  const life=o.hold||e.life||o.life||dur||1;
  scene.add(g);VFXL.push({g,mixer,seq,age:0,life,max:life,mats:[...mats.values()],fadeK:e.fade!==undefined?e.fade:(seq&&seq.end?0:0.35)});
  return true;
}
// ช่วงต่อของ start → loop → end
function vfxSeq(v){
  const s=v.seq,sw=(from,to,once)=>{to.reset();to.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);to.clampWhenFinished=!!once;to.play();if(from)to.crossFadeFrom(from,0.12,false);};
  if(s.st===0&&v.age>=s.startD){s.st=1;if(s.loop)sw(s.start,s.loop,false);}
  if(s.st<2&&s.end&&v.life<=s.endD){const from=s.st===1&&s.loop?s.loop:s.start;s.st=2;sw(from,s.end,true);}
}
function flipTex(name){
  const m=MODELS.man,e=m&&m.fx&&m.fx[name];if(!e)return null;
  if(!FLIPS.has(name)){
    const t=new THREE.TextureLoader().load('assets/'+e.file+'?v='+(e.v||m.v||0),undefined,undefined,()=>{FLIPS.get(name).fail=true;});
    t.colorSpace=THREE.SRGBColorSpace;t.userData.keep=true;FLIPS.set(name,{t,e,fail:false});
  }
  return FLIPS.get(name);
}
function playFlip(name,o){
  const F=flipTex(name);if(!F||F.fail||!F.t.image)return false;
  const e=F.e,tex=F.t.clone();tex.userData={};tex.repeat.set(1/e.cols,1/e.rows);tex.needsUpdate=true;
  // flat:true = แผ่นราบบนพื้น (เช่นพื้นไฟ) แทนภาพที่หันหากล้อง • โซนเป็น flat เป็นค่าเริ่ม
  const flat=e.flat!==undefined?e.flat:!!o.zr,rad=e.radius!==undefined?e.radius:o.zr;
  const mo={map:tex,transparent:true,depthWrite:false,blending:e.add?THREE.AdditiveBlending:THREE.NormalBlending,color:o.col?hdr(o.col,e.add?1.5:1):0xffffff};
  if(flat&&!FLIPGEO){FLIPGEO=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);FLIPGEO.userData.keep=true;}
  const sp=flat?new THREE.Mesh(FLIPGEO,new THREE.MeshBasicMaterial(mo)):new THREE.Sprite(new THREE.SpriteMaterial(mo));
  sp.position.set(tx(o.x),(o.h!==undefined?o.h:(flat?0.06:1))+GY(o.x,o.y),tz(o.y));
  sp.scale.setScalar((e.size||2)*(rad&&o.r?o.r*S3*(flat?2:1):1)*(o.scale||1));scene.add(sp);
  const n=e.cols*e.rows,life=o.hold||o.life||e.life||(e.loop?1:n/(e.fps||24));
  FLIPL.push({sp,tex,e,n,t:0,life,max:life,loop:e.loop||!!o.hold});
  return true;
}
// เล่นเอฟเฟกต์จากไฟล์ของ event นี้ (ถ้ามี) — คืนค่า true เมื่อไฟล์ขอแทนที่เอฟเฟกต์จากโค้ด (mode:"replace")
function fileFx(name,o){
  const m=MODELS.man;if(!m)return false;
  const em=m.models[name],ef=m.fx&&m.fx[name];if(!em&&!ef)return false;
  const a=em?playVfx(name,o):false,b=ef?playFlip(name,o):false;
  return (a&&em.mode==='replace')||(b&&ef.mode==='replace');
}
// พื้น/โซนที่อยู่ค้าง (พื้นไฟ ลาวา วงเพลิง ฯลฯ): ไฟล์ vfx_zone_<ชนิด> อยู่ค้างเท่าเวลาของโซนจริง และขยายตามรัศมีโซน
function zoneFx(kind,x,y,r,t,col){return fileFx('vfx_zone_'+kind,{x,y,r,hold:t,zr:1,col});}
function clearVfx(){for(const v of VFXL){scene.remove(v.g);disposeTree(v.g);}for(const q of FLIPL){scene.remove(q.sp);q.sp.material.dispose();q.tex.dispose();}VFXL.length=FLIPL.length=0;}
function updateVfx(dt){
  for(let i=VFXL.length-1;i>=0;i--){
    const v=VFXL[i];v.life-=dt;v.age+=dt;if(v.seq)vfxSeq(v);if(v.mixer)v.mixer.update(dt);
    const k=v.life/v.max,f=k<v.fadeK?Math.max(0,k/v.fadeK):1;
    for(const m of v.mats)if(m.userData.fade)m.opacity=m.userData.base*f;
    if(v.life<=0){scene.remove(v.g);disposeTree(v.g);VFXL.splice(i,1);}
  }
  for(let i=FLIPL.length-1;i>=0;i--){
    const q=FLIPL[i],e=q.e;q.t+=dt;q.life-=dt;
    const fr=Math.floor(q.t*(e.fps||24)),f=q.loop?fr%q.n:Math.min(q.n-1,fr);
    q.tex.offset.set((f%e.cols)/e.cols,1-(Math.floor(f/e.cols)+1)/e.rows);
    const k=q.life/q.max;q.sp.material.opacity=k<0.2?Math.max(0,k/0.2):1;
    if(q.life<=0){scene.remove(q.sp);q.sp.material.dispose();q.tex.dispose();FLIPL.splice(i,1);}
  }
}
