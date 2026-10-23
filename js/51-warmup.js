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
const WARM={reg:{},done:new Set(),hold:new THREE.Group(),holdF:new THREE.Group(),key:'',q:[],late:false,busy:false,log:[]};
const WARM_FXDIR={pyro:'fire',frost:'frost',earth:'earth'},WARM_COMMON=['tpl','sig','rec'];
const WARM_X=-20000,WARM_Y=-20000;   // นอกแผนที่ ~1 กม. (หมอก/ระยะกล้องซ่อนหมด, ไม่มีเสียงเพราะ nearMe)
// ย้ายของไป hold ของ scene เดิม (fxScene ไม่มีไฟ → program คนละแบบกับ scene) • วัสดุ dispose = ไม่ทำอะไร • อัปโหลด texture ไว้เลย
function warmKeep(o,fxs){(o.parent||scene).remove(o);(fxs?WARM.holdF:WARM.hold).add(o);
  o.traverse(q=>{if(!q.material)return;for(const m of [].concat(q.material)){if(!m||m.userData.warm)continue;m.userData.warm=1;m.dispose=()=>{};
    for(const k in m){const v=m[k];if(v&&v.isTexture&&v.image)try{gl.initTexture(v);}catch(e){}}
    if(m.uniforms)for(const k in m.uniforms){const v=m.uniforms[k]&&m.uniforms[k].value;if(v&&v.isTexture&&v.image)try{gl.initTexture(v);}catch(e){}}}});}
// compile ลง render target ของ composer — เกมวาดผ่าน RT (srgb-linear, ไม่ tone map) ไม่ใช่ลงจอตรง
// (compile ตอน RT = null ได้ program อีกแบบ (srgb + ACES) ที่เกมไม่ได้ใช้ → ยังกระตุกตอนใช้จริงอยู่ดี)
function warmCompile(scenes){const prev=gl.getRenderTarget();gl.setRenderTarget(composer.renderTarget1);
  try{return scenes.map(sc=>gl.compileAsync(sc,cam));}finally{gl.setRenderTarget(prev);}}
// ไฟล์เอฟเฟกต์: สร้างทุกชั้นพร้อมกัน → ของที่สร้างย้ายไป hold แล้วตัดออกจาก instance (fxKill จะได้ไม่ลบทิ้ง)
const WARM_SKIP=new Set(['sound','screen','light','code','use']);
function warmFx(dirs){const out=[];if(!FXR.ready)return out;const p0=PARTS.length;
  for(const n in FXR.index.fx){if(!dirs.includes(n.split('/')[0]))continue;const d=fxData(n);if(!d)continue;
    const I=fxStart(d,{x:WARM_X,y:WARM_Y,h:0,gh:0},n);if(!I)continue;
    for(const S of I.L){const L=S.d;if(WARM_SKIP.has(L.t)){S.st=2;continue;}
      S.st=1;S.life=Math.max(0.02,fxV(fxG(L,'life'),I,0));S.age=0;S.dt=1/60;
      try{fxSpawn(S,I,fxPos(I,S,0));}catch(e){S.st=2;}}
    out.push(I);}
  PARTS.length=Math.min(PARTS.length,p0);return out;}
function warmFxEnd(fxI){for(const I of fxI){for(const S of I.L){if(S.d.t==='trail'&&S.obj)trailStop(S.obj);S.obj=null;S.mats=null;}fxKill(I);}}
// เก็บทุกอย่างที่อยู่ไกล (ของจากไฟล์เอฟเฟกต์/ตัวช่วยสร้างเองลง scene หรือ fxScene)
function warmGather(){for(const sc of [scene,fxScene])for(const o of sc.children.slice())if(Math.abs(o.position.x-tx(WARM_X))<200&&Math.abs(o.position.z-tz(WARM_Y))<200)warmKeep(o,sc===fxScene);}
// สายในแมตช์ (จาก kit ของทุกคนในสแนปช็อต)
function warmPaths(v){const s=new Set();for(const p of (v&&v.P)||[]){const k=getKit(p.id);if(k&&PATHS[k.path])s.add(PATHS[k.path].id);}return [...s];}
// งาน 1 ขั้น: 'common' / 'fx:<สาย>' / 'reg:<สาย>:<i>' / 'compile'
function warmStep(step){
  if(step==='compile'){WARM.busy=true;scene.add(WARM.hold);fxScene.add(WARM.holdF);const t0=performance.now(),hid=[];
    for(const sc of [scene,fxScene])sc.traverse(o=>{if(!o.visible&&!o.isLight){o.visible=true;hid.push(o);}});   // ไฟที่ซ่อนอยู่ห้ามเปิด (จำนวนไฟเปลี่ยน = เชดเดอร์คนละชุดกับตอนเล่นจริง) • ของซ่อน (ระบบอนุภาค/ของรอใช้) — compile ปกติข้ามไป
    const fin=()=>{WARM.busy=false;WARM.log.push('compile '+(performance.now()-t0).toFixed(0)+'ms');};let ps=[];
    // compileAsync สร้าง program ทันที (ส่วน async แค่รอ GPU) → คืนค่า visible + เอา hold ออกได้เลย ไม่มีเฟรมไหนวาดของพวกนี้
    try{ps=warmCompile([scene,fxScene]);}finally{for(const o of hid)o.visible=false;scene.remove(WARM.hold);fxScene.remove(WARM.holdF);}
    Promise.race([Promise.all(ps),new Promise(r=>setTimeout(r,4000))]).then(fin,fin);return;}
  if(WARM.done.has(step))return;WARM.done.add(step);const t0=performance.now();
  if(step==='common'){const T=trailLayer();if(!T.mesh.parent)WARM.holdF.add(T.mesh);const fxI=warmFx(WARM_COMMON);warmGather();warmFxEnd(fxI);}
  else if(step.startsWith('fx:')){const fxI=warmFx([WARM_FXDIR[step.slice(3)]]);warmGather();warmFxEnd(fxI);}
  else if(step.startsWith('reg:')){const [,id,i]=step.split(':'),f=WARM.reg[id][+i];
    for(const o of [].concat(f()||[]))if(o&&o.isObject3D){if(!o.parent)scene.add(o);o.position.set(tx(WARM_X),0,tz(WARM_Y));}
    warmGather();}
  WARM.log.push(step+' '+(performance.now()-t0).toFixed(0)+'ms');}
// เรียกทุกเฟรมจาก render loop — ตอนเข้านับถอยหลังสร้างคิวงาน แล้วทำเฟรมละ 1 ขั้น
function warmTick(v){
  if(v.ph==='count'){const ps=warmPaths(v).sort(),key=builtKey+'|'+ps.join(',');
    if(key!==WARM.key){WARM.key=key;WARM.late=false;WARM.q=['common'];
      for(const p of ps){if(WARM_FXDIR[p])WARM.q.push('fx:'+p);(WARM.reg[p]||[]).forEach((f,i)=>WARM.q.push('reg:'+p+':'+i));}
      WARM.q=WARM.q.filter(s=>!WARM.done.has(s));WARM.q.push('compile');}
    if(!WARM.late&&v.cd<=1){WARM.late=true;WARM.q.push('compile');}}
  if(!WARM.q.length||WARM.busy)return;
  const step=WARM.q.shift();try{warmStep(step);}catch(e){console.warn('warmup',step,e);WARM.busy=false;}
}
// ---------- ภาพจากโค้ดของแต่ละสาย (เฟรมละฟังก์ชัน) ----------
WARM.reg.earth=[
  ()=>{const S=makeStand(1,false);standOp(S,0.5);return S.g;},
  ()=>{const S=makeStand(1,true);standOp(S,0.5);return S.g;},
  ()=>[makeDrill(),makePillar(),makeWarn(),eAirCone()],
  ()=>[makeSlab(true),makeSlab(false)],
  ()=>{eChunks(WARM_X,WARM_Y,0.3,2,10,1,0.1);},   // เศษหิน (InstancedMesh + ลายหิน) — เดิมไม่ได้อุ่น → กด Dash ครั้งแรก compile shader ใหม่ เกมค้าง
  ()=>{for(const k of [0,1,2,3])eMakeSO([0,k,WARM_X,WARM_Y,WARM_X+200,WARM_Y,30,100]);earthMudZone({x:WARM_X,y:WARM_Y,r:100,t:0.2});},
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
    for(const p of LOBBY.players){const L=getLook(p.id),k=lookStr(L);if(GWARM.chars.has(k))continue;const o=makeStudent(L,'warm'+GWARM.chars.size);useFileModel(o,'char_student',lookTint(L),L);GWARM.chars.set(k,o);}
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
if(window.WD)window.WD.warm=WARM;
if(window.WD)window.WD.gwarm=GWARM;
