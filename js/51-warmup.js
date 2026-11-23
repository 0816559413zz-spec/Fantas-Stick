// =====================================================================
//  อุ่นเครื่องช่วงนับถอยหลัง (ผู้ใช้ 2026-10-21: "ช่วงนับถอยหลังให้โหลดสิ่งที่ต้องใช้ — กดสกิลครั้งแรกกระตุก")
//  ตอนเข้า ph 'count': สร้างภาพของทุกสายที่มีในแมตช์ไว้นอกแผนที่ (ไกลเกินกล้อง) → compile shader + อัปโหลด texture ล่วงหน้า
//  1) ไฟล์เอฟเฟกต์ของสาย (assets/fx/<โฟลเดอร์>/) + แม่แบบที่ทุกสายใช้ (tpl/sig/rec) — สร้างทุกชั้นทันที (ข้ามเสียง/จอสั่น/แสง/code)
//  2) ภาพที่สร้างจากโค้ด: WARM.reg[pathId] = [ฟังก์ชันคืน Object3D หรือ array] — เฟรมละ 1 ฟังก์ชัน (นับถอยหลังไม่สะดุด)
//  3) compile ทั้ง scene + fxScene รวมของที่ซ่อนอยู่ ลง render target ของ composer (แบบเดียวกับที่เกมวาดจริง)
//     ทำ 2 รอบ: หลังสร้างของเสร็จ + ตอนเหลือ 1 วิ (ระบบอนุภาค flipbook ที่โหลดภาพเสร็จทีหลังจะได้ครบ)
//  ของที่ใช้อุ่นเก็บไว้ใน hold ตลอด และวัสดุของมัน "ไม่ dispose" — three.js ลบ shader program ทิ้งเมื่อวัสดุสุดท้ายที่ใช้มันถูก dispose
//  (ไม่งั้นทุกครั้งที่เอฟเฟกต์จบแล้วกดใหม่ จะ compile ใหม่อีก) • ฝั่ง client ล้วน ไม่เปลี่ยนโปรโตคอล
// =====================================================================
const WARM={reg:{},done:new Set(),prepared:new Set(),hold:new THREE.Group(),holdF:new THREE.Group(),rt:null,key:'',q:[],late:false,busy:false,log:[]};
const WARM_FXDIR={pyro:'fire',frost:'frost',storm:'storm',earth:'earth',wind:'wind',water:'water',light:'light',darkness:'darkness',nature:'nature'},WARM_COMMON=['tpl','sig','rec'];   // light/darkness/nature added 2026-11-22 (were never warmed; their 'code' layers still are not, shReadyPre covers those) •   // storm เพิ่ม 2026-11-02 (เดิมขาด → เอฟเฟกต์สายฟ้า compile กลางไฟต์)
const WARM_SLICE=!/[?&]nowarmslice/.test(location.search);
const WARM_X=-20000,WARM_Y=-20000;   // นอกแผนที่ ~1 กม. (หมอก/ระยะกล้องซ่อนหมด, ไม่มีเสียงเพราะ nearMe)
// ย้ายของไป hold ของ scene เดิม (fxScene ไม่มีไฟ → program คนละแบบกับ scene) • วัสดุ dispose = ไม่ทำอะไร • อัปโหลด texture ไว้เลย
function warmKeep(o,fxs){(o.parent||scene).remove(o);(fxs?WARM.holdF:WARM.hold).add(o);
  o.traverse(q=>{if(!q.material)return;for(const m of [].concat(q.material)){if(!m||m.userData.warm)continue;m.userData.warm=1;m.dispose=()=>{};
    for(const k in m){const v=m[k];if(v&&v.isTexture&&v.image)try{gl.initTexture(v);}catch(e){}}
    if(m.uniforms)for(const k in m.uniforms){const v=m.uniforms[k]&&m.uniforms[k].value;if(v&&v.isTexture&&v.image)try{gl.initTexture(v);}catch(e){}}}});}
// Far models may not exist yet when the scene first compiles
// อุ่นต้นแบบจากไฟล์ทันทีที่โหลดเสร็จ โดยไม่สร้างบ้านจริงทุกหลังหรือเปิดเงาที่ซ่อนอยู่
function warmStaticModels(names){for(const name of new Set(names.filter(Boolean))){
  const key='model:'+name;if(WARM.done.has(key))continue;WARM.done.add(key);
  loadModel(name).then(r=>{if(!r)return;const o=r.scene.clone(true);o.position.set(tx(WARM_X),-1000,tz(WARM_Y));warmKeep(o);
    if(!WARM.q.includes('compile'))WARM.q.push('compile');
  }).catch(e=>console.warn('warm model',name,e));
}}
// compile ลง render target ของ composer — เกมวาดผ่าน RT (srgb-linear, ไม่ tone map) ไม่ใช่ลงจอตรง
// (compile ตอน RT = null ได้ program อีกแบบ (srgb + ACES) ที่เกมไม่ได้ใช้ → ยังกระตุกตอนใช้จริงอยู่ดี)
// รอการ์ดจอ compile เสร็จแบบไม่ค้างหน้าจอ (KHR_parallel_shader_compile) แล้วค่อยวาด: วาดก่อนเสร็จ = CPU ค้างรอ 100-300 ms
function glReady(max){const t0=performance.now();return new Promise(res=>{const chk=()=>{let ok=true;try{ok=gl.info.programs.every(p=>p.isReady());}catch(e){}if(ok||performance.now()-t0>(max||4000))res();else setTimeout(chk,30);};chk();});}
function warmCompile(scenes){const prev=gl.getRenderTarget();gl.setRenderTarget(composer.renderTarget1);
  try{for(const sc of scenes){sc.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material))flatMark(o.material,o.geometry);});gl.compile(sc,cam);}return [glReady()];}finally{gl.setRenderTarget(prev);}}   // compile (ไม่ใช่ compileAsync): r160 compileAsync โยน isReady of undefined ถ้าวัสดุไม่มี program → ค้างรอ 4 วิทุกแมตช์ • ไดรเวอร์ compile ขนานอยู่แล้ว
// compile อย่างเดียวไม่ส่ง vertex/index buffer ขึ้น GPU: วาดลงภาพเล็กที่ไม่แสดงไว้ด้วย
function warmDraw(){
  WARM.rt=WARM.rt||new THREE.WebGLRenderTarget(32,32,{type:composer.renderTarget1.texture.type,colorSpace:composer.renderTarget1.texture.colorSpace});
  const prev=gl.getRenderTarget(),hidden=[],culled=[],auto=gl.shadowMap.autoUpdate;
  scene.add(WARM.hold);fxScene.add(WARM.holdF);
  for(const sc of [scene,fxScene])sc.traverse(o=>{if(!o.visible&&!o.isLight){hidden.push(o);o.visible=true;}});
  for(const root of [WARM.hold,WARM.holdF])root.traverse(o=>{if(o.isMesh||o.isPoints){culled.push([o,o.frustumCulled]);o.frustumCulled=false;}});
  try{gl.shadowMap.autoUpdate=false;gl.shadowMap.needsUpdate=gl.shadowMap.enabled;gl.setRenderTarget(WARM.rt);gl.render(scene,cam);gl.shadowMap.needsUpdate=false;gl.render(fxScene,cam);}   // ให้เงาวาดด้วย: program ของเงาไม่ถูก compile ล่วงหน้าโดย compileAsync
  finally{gl.setRenderTarget(prev);gl.shadowMap.autoUpdate=auto;gl.shadowMap.needsUpdate=true;for(const o of hidden)o.visible=false;for(const [o,c] of culled)o.frustumCulled=c;scene.remove(WARM.hold);fxScene.remove(WARM.holdF);}
}
// ไฟล์เอฟเฟกต์: สร้างทุกชั้นพร้อมกัน → ของที่สร้างย้ายไป hold แล้วตัดออกจาก instance (fxKill จะได้ไม่ลบทิ้ง)
const WARM_SKIP=new Set(['sound','screen','light','code','use']);
// fetch FX/โมเดล/ภาพให้ครบก่อนสร้างตัวอย่าง มิฉะนั้นคิวที่เริ่มเร็วจะจบด้วย fx:<สาย> 0ms
// แล้วถูกทำเครื่องหมาย done ทั้งที่ยังไม่มีชั้นใดถูกเตรียมเลย
async function warmAssets(dirs){
  const names=Object.keys(FXR.index.fx).filter(n=>dirs.includes(n.split('/')[0]));
  const data=await Promise.all(names.map(n=>fxLoad(n))),jobs=[];
  for(const d of data)for(const L of d&&d.layers||[]){
    if(L.model&&((L.t==='mesh'&&L.shape==='model')||(L.t==='emit'&&L.look==='model')))jobs.push(fxMeshLoad(L.model));
    if(L.t==='mesh'&&L.shape==='glb'&&L.glb)jobs.push(loadModel(L.glb));
    for(const n of [L.tex,L.fb])if(typeof n==='string'&&n.startsWith('tex/'))jobs.push(fxTexLoad(n));
  }
  await Promise.all(jobs);
}
function warmFx(dirs){const out=[];if(!FXR.ready)return out;const p0=PARTS.length;
  for(const n in FXR.index.fx){if(!dirs.includes(n.split('/')[0]))continue;const d=fxData(n);if(!d)continue;
    const I=fxStart(d,{x:WARM_X,y:WARM_Y,h:0,gh:0},n);if(!I)continue;
    for(const S of I.L){const L=S.d;if(WARM_SKIP.has(L.t)){S.st=2;continue;}
      S.st=1;S.life=Math.max(0.02,fxV(fxG(L,'life'),I,0));S.age=0;S.dt=1/60;
      try{fxSpawn(S,I,fxPos(I,S,0));
        // emit แบบ rate ไม่มี burst: ยังไม่เกิดเม็ดตอนเริ่ม จึงต้องเตรียมวัสดุ instanced ไว้เอง
        if(L.t==='emit'&&fxG(L,'look')==='model'){const c=fxCol(fxG(L,'col'),I),c2=fxCol(fxG(L,'c2'),I);fxMPGroup(fxG(L,'model'),fxG(L,'mmat'),c,c2||c);}
      }catch(e){S.st=2;}}
    out.push(I);}
  PARTS.length=Math.min(PARTS.length,p0);return out;}
function warmFxEnd(fxI){for(const I of fxI){for(const S of I.L){if(S.d.t==='trail'&&S.obj)trailStop(S.obj);S.obj=null;S.mats=null;}fxKill(I);}}
// เก็บทุกอย่างที่อยู่ไกล (ของจากไฟล์เอฟเฟกต์/ตัวช่วยสร้างเองลง scene หรือ fxScene)
function warmGather(){for(const sc of [scene,fxScene])for(const o of sc.children.slice())if(Math.abs(o.position.x-tx(WARM_X))<200&&Math.abs(o.position.z-tz(WARM_Y))<200)warmKeep(o,sc===fxScene);}
// สายในแมตช์ (จาก kit ของทุกคนในสแนปช็อต)
function warmPaths(v){const s=new Set();for(const p of (v&&v.P)||[]){const k=getKit(p.id);if(k&&PATHS[k.path])s.add(PATHS[k.path].id);}return [...s];}
// Keep shader slices scheduled when the headless harness freezes the match loop.
const warmFrame=requestAnimationFrame.bind(window);
// งาน 1 ขั้น: 'common' / 'fx:<สาย>' / 'reg:<สาย>:<i>' / 'compile'
function warmStep(step){
  if(step==='compile'){WARM.busy=true;const t0=performance.now(),jobs=[];
    const fin=()=>{try{warmDraw();}catch(e){console.warn('warm draw',e);}WARM.busy=false;WARM.log.push('compile/upload '+(performance.now()-t0).toFixed(0)+'ms');};
    // compile in ~5 ms slices, one per frame (2026-11-22): the one-shot compile of scene + fxScene + hold froze the lobby/countdown
    //   for 0.6–1.5 s. three's compile() visits materials whether visible or not, so nothing has to be un-hidden; lights come from the
    //   real scene (visible ones only, same as before). `?nowarmslice` = old one-shot path.
    if(WARM_SLICE){
      for(const [sc,h] of [[scene,WARM.hold],[fxScene,WARM.holdF]]){const L=[];sc.traverse(o=>{if(o.material)L.push(o);});if(h.parent!==sc)h.traverse(o=>{if(o.material)L.push(o);});jobs.push([sc,L]);}
      let ji=0,i=0,part=[];const fk={traverse(f){for(const o of part)f(o);},traverseVisible(){}};
      const tick=()=>{const tEnd=performance.now()+5,prev=gl.getRenderTarget();gl.setRenderTarget(composer.renderTarget1);
        try{while(ji<jobs.length&&performance.now()<tEnd){const [sc,L]=jobs[ji];part=L.slice(i,i+24);i+=24;
          for(const o of part)if(o.isMesh&&!Array.isArray(o.material))flatMark(o.material,o.geometry);
          if(part.length)gl.compile(fk,cam,sc);if(i>=L.length){ji++;i=0;}}}
        catch(e){console.warn('warm compile',e);ji=jobs.length;}finally{gl.setRenderTarget(prev);part=[];}
        if(ji<jobs.length)warmFrame(tick);else Promise.race([glReady(),new Promise(r=>setTimeout(r,4000))]).then(fin,fin);};
      tick();return;}
    scene.add(WARM.hold);fxScene.add(WARM.holdF);const hid=[];
    for(const sc of [scene,fxScene])sc.traverse(o=>{if(!o.visible&&!o.isLight){o.visible=true;hid.push(o);}});   // ไฟที่ซ่อนอยู่ห้ามเปิด (จำนวนไฟเปลี่ยน = เชดเดอร์คนละชุดกับตอนเล่น)
    let ps=[];
    try{ps=warmCompile([scene,fxScene]);}finally{for(const o of hid)o.visible=false;scene.remove(WARM.hold);fxScene.remove(WARM.holdF);}
    Promise.race([Promise.all(ps),new Promise(r=>setTimeout(r,4000))]).then(fin,fin);return;}
  if(WARM.done.has(step))return;
  if((step==='common'||step.startsWith('fx:'))&&!WARM.prepared.has(step)){
    if(!FXR.ready){WARM.q.unshift(step);return;}
    WARM.busy=true;
    const finish=()=>{WARM.prepared.add(step);WARM.q.unshift(step);WARM.busy=false;};
    warmAssets(step==='common'?WARM_COMMON:[WARM_FXDIR[step.slice(3)]]).then(finish,e=>{console.warn('warm assets',step,e);finish();});return;
  }
  // cracked look of this map's own breakable pieces (real material + geometry: uv/colour attributes change the shader too) — was compiled at the first hit mid-fight (2026-11-22)
  //   per map: the group is rebuilt for every new map (old map's geometry is not kept alive)
  if(step==='brk'){const B=WARM.brk||(WARM.brk=new THREE.Group());if(!B.parent)WARM.hold.add(B);B.clear();const seen=new Set();
    for(const q of BRKV.grp||[])for(const p of (q&&q.parts)||[]){const k=p.geo.uuid+'|'+p.mat.uuid;if(seen.has(k)||seen.size>=48)continue;seen.add(k);
      for(const lv of [1,2]){const o=new THREE.Mesh(p.geo,brkCrackMat(p.mat,lv));o.castShadow=!!(p.e&&p.e.cs);o.receiveShadow=true;o.position.set(tx(WARM_X),-1000,tz(WARM_Y));o.frustumCulled=false;B.add(o);}}
    WARM.log.push('brk '+seen.size);return;}
  WARM.done.add(step);const t0=performance.now();
  if(step==='common'){const T=trailLayer();if(!T.mesh.parent)WARM.holdF.add(T.mesh);
    // เศษหินใช้ได้ทุกสาย (ไฟ/ของพังด้วย) ทั้ง mesh เดี่ยวและ instanced ไม่ใช่เฉพาะ Earth
    for(const o of [new THREE.Mesh(_rockGeo,_rockMat()),new THREE.InstancedMesh(_rockGeo,_rockMat(),1)]){o.position.set(tx(WARM_X),-1000,tz(WARM_Y));warmKeep(o);}
    // shader ที่ยังโผล่กลางไฟต์ (วัดจากบอท 12 ตัว 2026-11-06): ซับในเสื้อคลุมของตัวละคร (ด้านหลัง) + รอยร้าวบ้าน 2 ระดับ
    const warmM=[sMat({color:'#444444',roughness:0.8,side:THREE.BackSide})],bms=new Map();
    scene.traverse(o=>{for(const m of [].concat(o.material||[])){if(!m||!m.isMeshStandardMaterial||!m.map||m.transparent)continue;const k=[!!m.emissiveMap,!!m.roughnessMap,!!m.metalnessMap,!!m.normalMap,!!m.aoMap,!!m.vertexColors,m.flatShading].join();if(!bms.has(k))bms.set(k,m);}});
    if(!bms.size){const t=new THREE.DataTexture(new Uint8Array([128,128,128,255]),1,1);t.needsUpdate=true;bms.set('',new THREE.MeshStandardMaterial({map:t}));}
    for(const bm of bms.values())for(const sd of [THREE.FrontSide,THREE.DoubleSide])for(const em of [false,true]){const b=bm.clone();b.side=sd;if(em)b.emissiveMap=bm.map;warmM.push(brkCrackMat(b,1),brkCrackMat(b,2));}   // ทุกแบบวัสดุในแมพ ทั้งหน้าเดียว/สองหน้า + palette เรืองแสงของแมพไฟล์ (โหลดทีหลังรอบนี้)
    {const t=new THREE.Data3DTexture(new Uint8Array(1),1,1,1);t.format=THREE.RedFormat;t.needsUpdate=true;const v=fireSeqVol({tex:t,m:{nx:1,frames:1}},{hx:1,h:1,hz:1});v.position.set(tx(WARM_X),0,tz(WARM_Y));fxScene.add(v);}   // ไฟ bake (ใช้แบบเดียวกันทุกไฟล์ จึงไม่ต้องรอไฟล์จริง)
    for(const m of warmM){const o=new THREE.Mesh(_rockGeo,m);o.position.set(tx(WARM_X),-1000,tz(WARM_Y));warmKeep(o);}
    const fxI=warmFx(WARM_COMMON);warmGather();warmFxEnd(fxI);}
  else if(step.startsWith('fx:')){const fxI=warmFx([WARM_FXDIR[step.slice(3)]]);warmGather();warmFxEnd(fxI);}
  else if(step==='chars'){const g=warmCharVariants();if(g){g.position.set(tx(WARM_X),0,tz(WARM_Y));warmKeep(g);}}
  else if(step.startsWith('reg:')){const [,id,i]=step.split(':'),f=WARM.reg[id][+i];
    for(const o of [].concat(f()||[]))if(o&&o.isObject3D){if(!o.parent)scene.add(o);o.position.set(tx(WARM_X),0,tz(WARM_Y));}
    warmGather();}
  WARM.log.push(step+' '+(performance.now()-t0).toFixed(0)+'ms');}
// เรียกทุกเฟรมจาก render loop — ตอนเข้านับถอยหลังสร้างคิวงาน แล้วทำเฟรมละ 1 ขั้น
// Character material variants that only appear mid-fight (2026-11-23, user: freezes in siege fights, F3 shader+2..6 at 0.4–1 s each):
// hit flash (basic on skinned), ghost body (transparent clone), slash-split death pieces (clip plane + single-pass transparent),
// death dissolve of wand/attachments, Darkness body tint (opaque + soft fade, stDarkTintMat). Built once per new variant on copies
// of the loaded character meshes (lobby warm-up chars + players) so the countdown compile covers them. Kept in WARM.hold.
WARM.cv=new Set();
function warmCharVariants(){
  const g=new THREE.Group(),one={value:1},plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const flash=new THREE.MeshBasicMaterial({color:hdr('#ffffff',1.15)});
  const one4={value:new THREE.Vector4(0,1,0,1e9)};
  const fade=src=>{const m=src.clone();m.transparent=true;m.depthWrite=false;m.forceSinglePass=true;m.onBeforeCompile=src.onBeforeCompile;const k=src.customProgramCacheKey();m.customProgramCacheKey=()=>k;return m;};
  const V=[['flash',()=>flash,m=>m.isSkinnedMesh||m.isMesh],['ghost',ghostOf,()=>true],['clip',src=>deathClipMat(src,one4),()=>true],['fade',fade,m=>!m.isSkinnedMesh],
    ['dark',src=>stDarkTintMat(src,false,one,one),()=>true],['darkS',src=>stDarkTintMat(src,true,one,one),()=>true]];
  const roots=[...PM3.values(),...GWARM.chars.values()];
  for(const o of roots){const r=o&&o.g;if(!r||!o.fileModel)continue;   // whole actor: body + wand + darkness gear (scythe) etc.
    r.traverse(m=>{if(!m.isMesh||m.isInstancedMesh||!m.material||Array.isArray(m.material)||m.material.isShaderMaterial)return;const src=m.material;
      const base=(m.isSkinnedMesh?'S':'M')+src.type+'|'+src.customProgramCacheKey()+'|'+src.transparent+src.side+!!src.map+!!src.normalMap+!!src.emissiveMap+!!src.alphaMap+(src.vertexColors?1:0)+!!m.geometry.attributes.color;
      for(const [n,mk,ok] of V){if(!ok(m))continue;const k=n+'|'+base;if(WARM.cv.has(k))continue;WARM.cv.add(k);
        try{const c=m.clone();c.material=mk(src);c.frustumCulled=false;if(n==='clip'||n==='fade')c.castShadow=false;g.add(c);}catch(e){console.warn('warm char variant',n,e);}}});}
  return g.children.length?g:null;}
function warmQueue(ps,key){WARM.key=key;WARM.late=false;WARM.q=['common'];
  for(const p of ps){if(WARM_FXDIR[p])WARM.q.push('fx:'+p);(WARM.reg[p]||[]).forEach((f,i)=>WARM.q.push('reg:'+p+':'+i));}
  WARM.q=WARM.q.filter(s=>!WARM.done.has(s));WARM.q.push('brk','chars','compile');}
// Same queue while players wait in the lobby (2026-11-22): the 3 s countdown was too short — in a 10-player match the class
// effects + compile (1.2–2 s) ran into the first seconds of the fight. Starts once the lobby's game-scene warm-up is done; the
// countdown then finds the same key and only adds the late compile. `?nolobbywarm` = old path.
const WARM_LOBBY=!/[?&]nolobbywarm/.test(location.search);
function warmLobbyTick(){
  if(PRE.st===1||!WARM_LOBBY||GWARM.busy||!GWARM.key||!LOBBY||LOBBY.ph!=='lobby'||!world||screen!=='lobby')return;
  const ps=[...new Set(LOBBY.players.map(p=>{const k=getKit(p.id);return k&&PATHS[k.path]?PATHS[k.path].id:null;}).filter(Boolean))].sort(),key=builtKey+'|'+ps.join(',');
  if(key!==WARM.key)warmQueue(ps,key);
  if(!WARM.q.length||WARM.busy)return;
  const step=WARM.q.shift();try{warmStep(step);}catch(e){console.warn('warmup',step,e);WARM.busy=false;}
}
function warmTick(v){
  if(PRE.st===1&&v.ph==='count')preFin();   // match starting while still preloading: per-match queue takes over (done steps skipped)
  if(PRE.st===1)return;
  if(v.ph==='count'){const ps=warmPaths(v).sort(),key=builtKey+'|'+ps.join(',');
    if(key!==WARM.key)warmQueue(ps,key);
    if(!WARM.late&&v.cd<=1){WARM.late=true;if(!PRE.on)WARM.q.push('compile');}}
  if(!WARM.q.length||WARM.busy)return;
  const step=WARM.q.shift();try{warmStep(step);}catch(e){console.warn('warmup',step,e);WARM.busy=false;}
}
// ---------- Entry loader (PRELOAD-STANDARD step 3, 2026-11-23) ----------
// Warms every path at page load (during the title logo), not per match: FX files of all classes, code visuals (WARM.reg),
// character fight variants on two sample students (plain + batched, own look), then one sliced compile + draw. CLICK TO BEGIN
// waits on it with a progress bar. Lobby/countdown then only add what depends on the map (brk, map pieces) or on new looks
// (chars). New systems register code-built visuals with preloadReg(pathId, builder...) (builder returns Object3D or array;
// it is placed far off-map and kept in WARM.hold). `?nopreload` = old per-match path.
const PRE={on:!/[?&]nopreload/.test(location.search),st:0,n:0,best:0,t0:0,ms:0,cb:[],smp:[],max:45000};
function preloadReg(id,...f){(WARM.reg[id]||(WARM.reg[id]=[])).push(...f);}
function preProg(){return PRE.st===2?1:PRE.st===1?PRE.best:0;}
function preFin(){if(PRE.st===1){PRE.st=2;PRE.ms=performance.now()-PRE.t0;WARM.log.push('preload '+PRE.ms.toFixed(0)+'ms');}
  const cb=PRE.cb;PRE.cb=[];for(const f of cb)try{f();}catch(e){console.warn('preload cb',e);}}
function preStart(cb){if(cb)PRE.cb.push(cb);
  if(!PRE.on||PRE.st===2){preFin();return;}if(PRE.st===1)return;
  PRE.st=1;PRE.t0=performance.now();
  // samples for warmCharVariants: real file model with my look, one plain and one batched (merged skin) — kept in GWARM.chars
  //   (gameWarmTick reuses them by look, gameWarmFree frees them after the first match)
  try{const L=myLook,k=lookStr(L);for(const b of [0,1]){const key=k+(b?'#b':'');if(GWARM.chars.has(key))continue;
    const o=makeStudent(L,'pre'+b);o.bat=!!b;useFileModel(o,'char_student',lookTint(L),L);o.g.visible=false;o.g.position.set(tx(WARM_X),-1000,tz(WARM_Y));GWARM.chars.set(key,o);PRE.smp.push(o);}}
  catch(e){console.warn('preload chars',e);}
  const ps=[...new Set([...Object.keys(WARM_FXDIR),...Object.keys(WARM.reg)])].sort();
  WARM.key='pre|'+ps.join(',');WARM.late=true;WARM.q=['common'];
  for(const p of ps){if(WARM_FXDIR[p])WARM.q.push('fx:'+p);(WARM.reg[p]||[]).forEach((f,i)=>WARM.q.push('reg:'+p+':'+i));}
  WARM.q=WARM.q.filter(s=>!WARM.done.has(s));WARM.q.push('chars','compile');PRE.n=WARM.q.length+Object.keys(WARM_FXDIR).length+2;
  warmFrame(preTick);}
// start at page load (the title logo takes ~2.5 s anyway); not in VFX Studio / recorder pages
if(PRE.on&&!/[?&](studio|rec)/.test(location.search))setTimeout(()=>preStart(),0);
function preTick(){if(PRE.st!==1)return;
  const left=WARM.q.length+(WARM.busy?1:0)+WARM.q.filter(s=>s.startsWith('fx:')||s==='common').filter(s=>!WARM.prepared.has(s)).length;
  PRE.best=Math.max(PRE.best,Math.min(0.99,1-left/PRE.n));
  if(performance.now()-PRE.t0>PRE.max){console.warn('preload timeout, left:',WARM.q.join(' '));preFin();return;}   // never block the game: the rest goes on in lobby/countdown
  if(!WARM.q.length&&!WARM.busy){preFin();return;}
  if(!WARM.busy){const step=WARM.q[0];
    // character variants need the loaded model: wait for it (max 10 s)
    if(step==='chars'&&PRE.smp.some(o=>!o.fileModel)&&performance.now()-PRE.t0<10000){warmFrame(preTick);return;}
    WARM.q.shift();try{warmStep(step);}catch(e){console.warn('preload',step,e);WARM.busy=false;}}
  warmFrame(preTick);}
// ---------- ภาพจากโค้ดของแต่ละสาย (เฟรมละฟังก์ชัน) ----------
// ไฟ 3 มิติแบบ raymarch (fireVol) — เดิมไม่ได้อุ่น: compile ครั้งแรกกลางไฟต์ (tools/bench-bots.js 2026-11-02)
// These code-created materials are not covered by the FX JSON layer scan.
// Keep them in the same scene as the real effect (different lighting = different programs).
WARM.reg.pyro=[()=>{const m=fireVol([{c:[0,0,0],ax:[1,0],hx:1,hz:1,h:2}]);fxScene.add(m);return m;},
  ()=>{const out=[new THREE.Mesh(_hzPlane,hazeMat(0)),new THREE.Mesh(_hzRing,hazeMat(1))];for(const m of out)fxScene.add(m);return out;},
  ()=>[new THREE.Mesh(_fbGeo,fireMat({mode:'ball'})),makeFireBall(),makeFireTail()],
];
// Outline shells need both rigid and skinned programs. A tiny one-bone proxy
// prepares the actual material without creating a player or borrowing its skeleton.
function warmOutline(mat){
  const g=new THREE.BoxGeometry(1,1,1),n=g.attributes.position.count,w=new Float32Array(n*4);
  for(let i=0;i<n;i++)w[i*4]=1;
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(new Uint16Array(n*4),4));
  g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(w,4));
  const root=new THREE.Group(),skin=new THREE.SkinnedMesh(g,mat),bone=new THREE.Bone();
  skin.add(bone);skin.bind(new THREE.Skeleton([bone]));root.add(new THREE.Mesh(g,mat),skin);return root;
}
WARM.reg.earth=[
  ()=>{const S=makeStand(1,false);standOp(S,0.5);return S.g;},
  ()=>{const S=makeStand(1,true);standOp(S,0.5);return S.g;},
  ()=>[makeDrill(),makePillar(),makeWarn(),eAirCone()],
  ()=>[makeSlab(true),makeSlab(false)],
  ()=>{eChunks(WARM_X,WARM_Y,0.3,2,10,1,0.1);},   // เศษหิน (InstancedMesh + ลายหิน) — เดิมไม่ได้อุ่น → กด Dash ครั้งแรก compile shader ใหม่ เกมค้าง
  ()=>{for(const k of [0,1,2,3])eMakeSO([0,k,WARM_X,WARM_Y,WARM_X+200,WARM_Y,30,100]);earthMudZone({x:WARM_X,y:WARM_Y,r:100,t:0.2});},
  ()=>warmOutline(_eOlMat),
];
// ---------- อุ่นฉากเกมระหว่างรอในห้อง (ผู้ใช้ 2026-10-23: "กระตุกตอนเริ่มแมตช์แรก" ~1.3 วิ) ----------
// ห้องรอเริ่มวาดฉากของ hub — ฉากเกม (แผนที่ที่สร้างไว้แล้ว + ตัวละคร) ยังไม่เคยถูกวาดเลย → เฟรมแรกของแมตช์ compile ~18 เชดเดอร์
// + อัปโหลด geometry/texture พร้อมกัน • ตอนนี้: อยู่ในห้องครบ 1 วิ → สร้างตัวละครของทุกคนในห้องไว้ก่อน (syncPlayers ใช้ตัวเดิมตอนเริ่ม)
// → compileAsync (scene + fxScene) → วาดฉากเกมครั้งเดียวลงภาพเล็กที่ไม่แสดง ด้วยกล้องมุมกว้างมองทั้งแผนที่ (อัปโหลด + เชดเดอร์เงา)
// ทำใหม่เมื่อแผนที่/คนในห้องเปลี่ยน • ฝั่ง client ล้วน
const GWARM={key:'',t:0,busy:false,rt:null,cam:null,chars:new Map()};
function gameWarmTick(dt){
  if(GWARM.busy||!LOBBY||LOBBY.ph!=='lobby'||!world||screen!=='lobby')return;
  const key=builtKey+'|'+LOBBY.players.map(p=>p.id+':'+(p.lk||'')).join(',');
  if(key===GWARM.key){GWARM.t=0;return;}
  if((GWARM.t+=dt)<1)return;
  GWARM.t=0;GWARM.key=key;GWARM.busy=true;
  try{
    // ตัวละครตัวอย่างตามลุคของคนในห้อง — เก็บเองซ่อนไว้ (ห้ามใส่ PM3: syncPlayers ลบตัวที่ไม่มีในสแนปช็อต + dispose วัสดุ → program ถูกลบ ต้อง compile ใหม่ตอนเริ่ม)
    for(const p of LOBBY.players){const L=getLook(p.id),k=lookStr(L);if(GWARM.chars.has(k))continue;const o=makeStudent(L,'warm'+GWARM.chars.size);o.bat=GWARM.chars.size>0;useFileModel(o,'char_student',lookTint(L),L);GWARM.chars.set(k,o);}
    const ch=[...GWARM.chars.values()].map(o=>o.g);ch.forEach((g,i)=>{g.visible=true;g.position.set((i-2)*1.5,GY(MW/2,MH/2),0);});
    const hid=[];for(const sc of [scene,fxScene])sc.traverse(o=>{if(!o.visible&&!o.isLight){o.visible=true;hid.push(o);}});
    // compile (ไม่ใช่ compileAsync): three r160 compileAsync พังถ้าวัสดุบางชิ้นไม่มี program (isReady of undefined) • ไดรเวอร์ compile ขนานอยู่แล้ว (KHR_parallel_shader_compile)
    //   ฉากเกมกับ fxScene คนละเฟรม (กันห้องสะดุดทีเดียวนาน)
    const comp=sc=>{const pr0=gl.getRenderTarget();gl.setRenderTarget(composer.renderTarget1);try{gl.compile(sc,cam);}finally{gl.setRenderTarget(pr0);}};
    try{comp(scene);}finally{for(const o of hid)o.visible=false;}
    setTimeout(()=>{const h2=[];fxScene.traverse(o=>{if(!o.visible&&!o.isLight){o.visible=true;h2.push(o);}});try{comp(fxScene);}catch(e){}for(const o of h2)o.visible=false;},120);
    const fin=()=>{setTimeout(()=>{   // วาดครั้งเดียว (เฟรมถัดไป ไม่ซ้อนกับ compile)
      try{if(screen==='lobby'){
        GWARM.rt=GWARM.rt||new THREE.WebGLRenderTarget(64,64,{type:composer.renderTarget1.texture.type,colorSpace:composer.renderTarget1.texture.colorSpace});
        if(!GWARM.cam){GWARM.cam=new THREE.PerspectiveCamera(100,1,0.5,4000);}
        const r=Math.max(MW,MH)*S3*0.6;GWARM.cam.position.set(0,r,r*0.4);GWARM.cam.lookAt(0,0,0);
        ch.forEach(g=>g.visible=true);
        const pr=gl.getRenderTarget();gl.setRenderTarget(GWARM.rt);gl.shadowMap.needsUpdate=true;gl.render(scene,GWARM.cam);gl.render(fxScene,GWARM.cam);gl.setRenderTarget(pr);gl.shadowMap.needsUpdate=true;
        ch.forEach(g=>g.visible=false);}
      }catch(e){console.warn('gameWarm draw',e);}
      GWARM.busy=false;},50);};
    setTimeout(fin,800);
    ch.forEach(g=>g.visible=false);
  }catch(e){console.warn('gameWarm',e);GWARM.busy=false;}
}
// Build the next match's map while waiting in the lobby (2026-11-23, user: "สร้างตอนเลือกแมพ"): the host decides it with
// hostMapNext (js/11) and sends it in the lobby message; every client builds it here once its data is loaded, then
// gameWarmTick / warmLobbyTick (keyed on builtKey) compile its pieces. The countdown then finds the map built and warm.
const LMAP={t:0};
function lobbyMapTick(dt){
  if(!LOBBY||LOBBY.ph!=='lobby'||screen!=='lobby')return;
  if((LMAP.t+=dt)<0.5)return;LMAP.t=0;
  if(NET.isHost&&G&&G.ph==='lobby'&&typeof hostMapNext==='function'){const id=hostMapNext(true);if(id&&id!==G.map){G.map=id;broadcastLobby();return;}}
  const id=LOBBY.map;if(id&&id!==builtMap&&mapReady(id)){setMapVars(id);buildWorld(id);}}
// ตัวละครอุ่นเครื่องหมดหน้าที่เมื่อแมตช์เริ่มวาดแล้ว (เชดเดอร์ถูก pinPrograms ตรึงไว้, geometry/วัสดุของไฟล์เป็น keep) → ทิ้งหลังเข้าเกม 2 วิ
// เดิมเก็บไว้ตลอด + เพิ่มทุกลุคใหม่ (บอทสุ่มลุคทุกครั้งที่เติม) → ค้างในฉากหลายร้อย mesh, three ยังคำนวณ matrix ทุกเฟรม (OPTIMIZE §H)
// รอบหน้าในห้องรอ gameWarmTick สร้างใหม่ตามคนที่อยู่จริง (GWARM.key='' บังคับให้อุ่นใหม่)
function gameWarmFree(dt){
  if(!GWARM.chars.size||GWARM.busy||screen!=='game'){GWARM.ft=0;return;}
  if((GWARM.ft=(GWARM.ft||0)+dt)<2)return;
  for(const o of GWARM.chars.values())disposeObj(o.g);
  GWARM.chars.clear();GWARM.key='';GWARM.ft=0;
}
// ---------- Shader never seen before mid-match: compile in the background, hide that object until the GPU is done (2026-11-22) ----------
// three r160 links a new program at its first draw and then blocks on getProgramParameter (50–500 ms per program on a laptop):
// in a 6v4 bot match that was ~10% of all CPU time and the 0.5–1.2 s freezes. Every object added to the scene (Object3D.add hook,
// whole subtree, hidden pool pieces too) whose material has no program yet is compiled right away (KHR_parallel_shader_compile links
// on a driver thread); while its program is still linking the object is hidden for that frame (usually 2–6 frames, max SHR_MAX ms).
// A new material that reuses an existing shader is ready at once and never hidden. `?noshready` = old path.
// isReady() = getProgramParameter = a synchronous round trip to the GPU process: never asked for a shader that already existed, and at
// most once per frame, only after SHR_MIN ms (most links finish by then).
const SHR={sib:[],seen:new Set(),on:!/[?&]noshready/.test(location.search),q:[],retry:new Map(),pend:new Map(),wait:[],hid:[],list:[],rdy:new WeakSet(),polled:false,
  fake:{traverse(f){for(const o of SHR.list)f(o);},traverseVisible(){}},lit:new Map()},SHR_MIN=60,SHR_MAX=1500;
// compile() takes the lights from the scene it is given (a full traverse, ~0.25 ms in a fight): a stand-in with the scene's fog/environment
// and its light list (refreshed every 2 s; visibility checked live) gives the same program key
function shrLights(sc,now){let L=SHR.lit.get(sc);
  if(!L||now-L.t>2000){const a=[];sc.traverse(o=>{if(o.isLight)a.push(o);});
    if(!L){L={t:now,a,px:{get fog(){return sc.fog;},get environment(){return sc.environment;},get background(){return sc.background;},isScene:true,
      traverseVisible(f){for(const l of L.a){let v=l;while(v&&v.visible)v=v.parent;if(!v)f(l);}}}};SHR.lit.set(sc,L);}else{L.a=a;L.t=now;}}
  return L.px;}
const IMZ={on:!/[?&]noimz/.test(location.search),set:new Set(),hid:[],scan:0};
{const add0=THREE.Object3D.prototype.add;THREE.Object3D.prototype.add=function(o){
  if(SHR.on){for(let i=0;i<arguments.length;i++){const a=arguments[i];if(a&&a!==this&&a.isObject3D)SHR.q.push(a);}}
  if(IMZ.on){for(let i=0;i<arguments.length;i++){const a=arguments[i];if(a&&a.isInstancedMesh)IMZ.set.add(a);}}
  return add0.apply(this,arguments);};}
// Empty instanced pools (count 0: FX pools, debris, marks — ~90 in a TDM fight) still cost program + uniforms + buffers per pass
// in three r160 (no early-out). Hidden for the frame while empty, restored after render. ?noimz = old.
function imzPre(){if(!IMZ.on)return;if(--IMZ.scan<=0){IMZ.scan=120;for(const r of [scene,fxScene])r.traverse(o=>{if(o.isInstancedMesh)IMZ.set.add(o);});}   // also pools built before this file / added via children.push
  for(const im of IMZ.set){if(!im.parent){IMZ.set.delete(im);continue;}if(im.count===0&&im.visible){im.visible=false;IMZ.hid.push(im);}}}
function imzPost(){const H=IMZ.hid;if(!H.length)return;for(let i=0;i<H.length;i++)H[i].visible=true;H.length=0;}
function shrRoot(o){while(o.parent)o=o.parent;return o;}
function shrCollect(o){const m=o.material;
  if(m){for(const x of Array.isArray(m)?m:[m]){if(!x||x.userData.shr===1)continue;if(SHR.pend.has(x)){SHR.sib.push(o);continue;}   // another object already compiling this material: it waits too
    if(gl.properties.get(x).currentProgram!==undefined){x.userData.shr=1;continue;}
    if(o.isMesh)flatMark(x,o.geometry);SHR.pend.set(x,{t:0,pg:null});if(SHR.list[SHR.list.length-1]!==o)SHR.list.push(o);}}
  const c=o.children;for(let i=0;i<c.length;i++)shrCollect(c[i]);}
// material still linking? (polls at most one program per frame)
function shrPending(m,now){const e=SHR.pend.get(m);if(!e)return false;
  if(e.pg===null||now-e.t>SHR_MAX||SHR.rdy.has(e.pg)){SHR.pend.delete(m);m.userData.shr=1;return false;}
  if(!SHR.polled&&now-e.t>=SHR_MIN){SHR.polled=true;if(e.pg.isReady()){SHR.rdy.add(e.pg);SHR.pend.delete(m);m.userData.shr=1;return false;}}
  return true;}
function shReadyPre(){
  shReadyPost();imzPre();if(!SHR.on||!SHR.ext){SHR.q.length=0;return;}
  const now=performance.now();SHR.polled=false;
  if(SHR.q.length){const Q=SHR.q;SHR.q=[];SHR.seen.clear();const per=new Map();
    for(const o of Q){const r=shrRoot(o);
      if(SHR.seen.has(o))continue;SHR.seen.add(o);
      if(r===scene||r===fxScene){SHR.retry.delete(o);let L=per.get(r);if(!L)per.set(r,L=[]);L.push(o);}
      else{const n=(SHR.retry.get(o)||0)+1;if(n<30){SHR.retry.set(o,n);SHR.q.push(o);}else SHR.retry.delete(o);}}   // built first, put in the scene later
    const prev=gl.getRenderTarget();
    for(const [sc,L] of per){SHR.list.length=0;for(const o of L)shrCollect(o);if(!SHR.list.length)continue;
      const before=new Set(gl.info.programs),vis=SHR.list.map(o=>o.visible);for(const o of SHR.list)o.visible=true;
      gl.setRenderTarget(composer.renderTarget1);try{gl.compile(SHR.fake,cam,shrLights(sc,now));}catch(err){console.warn('shReady',err);}finally{gl.setRenderTarget(prev);}
      SHR.list.forEach((o,i)=>{o.visible=vis[i];let w=false;
        for(const m of [].concat(o.material)){const e=m&&SHR.pend.get(m);if(!e)continue;
          if(e.pg===null){const pg=gl.properties.get(m).currentProgram;if(!pg||before.has(pg)||SHR.rdy.has(pg)){SHR.pend.delete(m);m.userData.shr=1;continue;}e.pg=pg;e.t=now;}
          w=true;}
        if(w)SHR.wait.push(o);});
      SHR.list.length=0;}}
  if(SHR.sib.length){for(const o of SHR.sib){if(SHR.wait.includes(o))continue;for(const m of [].concat(o.material)){const e=m&&SHR.pend.get(m);if(e&&e.pg){SHR.wait.push(o);break;}}}SHR.sib.length=0;}
  if(SHR.wait.length){let j=0;for(const o of SHR.wait){let w=false;for(const m of [].concat(o.material))if(m&&shrPending(m,now))w=true;
      if(!w)continue;SHR.wait[j++]=o;if(o.visible){o.visible=false;SHR.hid.push(o);}}SHR.wait.length=j;}}
function shReadyPost(){imzPost();if(!SHR.hid.length)return;for(const o of SHR.hid)o.visible=true;SHR.hid.length=0;}
SHR.ext=!!gl.getContext().getExtension('KHR_parallel_shader_compile');
if(window.WD){window.WD.SHR=SHR;window.WD.IMZ=IMZ;}
if(window.WD){window.WD.warm=WARM;window.WD.PRE=PRE;window.WD.glProgs=()=>gl.info.programs.length;window.WD.glList=()=>gl.info.programs.map(p=>{const k=p.cacheKey.split(',');return k[0].slice(0,24)+'|'+p.name+'|'+k.slice(-3).join(',').slice(0,60);});}
if(window.WD)window.WD.gwarm=GWARM;
if(window.WD)window.WD.WARM=WARM;
