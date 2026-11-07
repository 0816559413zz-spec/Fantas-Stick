// ---------- ลูปเรนเดอร์ ----------
let lastFrame=performance.now();
// hit-stop / impact frame: เราตีโดนแรงๆ = ค้างภาพบนจอเราแว้บหนึ่ง (เกมจริงยังเดินต่อ ไม่หยุดของเพื่อน)
// หยุดภาพได้ครั้งละครั้ง แล้วพัก HSTOP.gap วินาที — กันตีถี่/โดนหลายตัวแล้วภาพหยุดๆ เดินๆ จนดูเหมือนกระตุก
const HSTOP={t:0,pend:0,until:0,gap:0.3};
function hitStop(d){if(screen==='game'&&performance.now()>=HSTOP.until)HSTOP.pend=Math.max(HSTOP.pend,d);}
// สตูดิโอ VFX (studio/studio.js) ขับเฟรมเอง: own = หยุดลูปนี้ • noDraw = อัปเดตเอฟเฟกต์โดยไม่วาด (กรอเวลา) • seek = กำลังกรอ: ข้ามตัวละคร/หญ้า/ผ้าคลุม (กินเวลา ~85% ของการกรอ)
const FXSTUDIO={own:false,noDraw:false,seek:false};
// ---------- เก็บ shader ที่ compile แล้วไว้ตลอดเกม (ผู้ใช้ 2026-11-02 "เล่นกับบอทเต็มห้อง สู้กันนัว ๆ กระตุกมาก") ----------
// เอฟเฟกต์สร้างวัสดุใหม่ทุกครั้งที่เกิด แล้ว dispose ตอนจบ → ถ้าไม่มีเอฟเฟกต์ชนิดเดียวกันค้างอยู่ three.js ลบ shader program ทิ้ง
// → บอทกดสกิลนั้นอีก = compile ใหม่ = ค้าง 90–280 ms (วัดจาก tools/bench-bots.js: program ใหม่กลางไฟต์ทุก ๆ 1–5 วิ)
// แก้: program ทุกตัวที่เพิ่งเกิด เพิ่ม usedTimes 1 ครั้ง → ไม่ถึง 0 = ไม่ถูกลบ (ชนิด shader มีจำกัด ~150–300 ตัว) • เพดาน PINMAX กันกรณี shader สร้างจากตัวเลขสุ่ม
const PINMAX=600,PINNED=new WeakSet();let pinLen=0;
// แค่ตรึง program ไม่พอสำหรับ ShaderMaterial: three.js จำ "ซอร์ส shader" แยก (ShaderCache) แล้วลบเมื่อวัสดุสุดท้ายที่ใช้ซอร์สนั้น dispose
// → ซอร์สเดิมได้เลขใหม่ = cacheKey ใหม่ = compile ใหม่ทั้งที่โค้ดเหมือนเดิม • แก้: วัสดุตัวแรกของแต่ละซอร์สที่เคยวาดแล้ว "ไม่ dispose จริง" (เก็บไว้ 1 ตัวต่อซอร์ส)
const KEEPSRC=new Set();
{const _sd=THREE.ShaderMaterial.prototype.dispose;
  THREE.ShaderMaterial.prototype.dispose=function(){
    if(KEEPSRC.size<PINMAX){const k=this.vertexShader+''+this.fragmentShader;
      if(!KEEPSRC.has(k)){const pr=gl.properties&&gl.properties.get(this);if(pr&&pr.currentProgram){KEEPSRC.add(k);this.userData.kept=1;return;}}}
    return _sd.call(this);};}
function pinPrograms(){const L=gl.info.programs;if(!L||L.length===pinLen)return;pinLen=L.length;
  let n=0;for(const pg of L){if(PINNED.has(pg))n++;}
  for(const pg of L){if(PINNED.has(pg)||n>=PINMAX)continue;PINNED.add(pg);pg.usedTimes++;n++;}}
function frame(now){
  if(FXSTUDIO.own)return;
  // นอกเกมไม่ต้องวาดเกิน 60 fps: จอ 165 Hz จะให้การ์ดจอวาดห้องนิ่ง ๆ 165 ครั้ง/วิ (เครื่องร้อน แล้วเข้าเกมยิ่งแลค)
  if(screen!=='game'&&now-lastFrame<15.5){requestAnimationFrame(frame);return;}
  const dt=Math.min(0.05,(now-lastFrame)/1000);lastFrame=now;
  if(HSTOP.t>0){HSTOP.t-=dt;requestAnimationFrame(frame);return;}
  qualTick(dt);
  h4PfRead();   // รูปโปรไฟล์ HUD ที่วาดไว้เฟรมก่อน (js/66)
  const c0=performance.now();   // เวลา CPU ของเฟรม (เกม + สั่งวาด) → qualTick แยกว่าช้าเพราะ CPU หรือการ์ดจอ
  if(NET.isHost&&screen==='game')hostLoop();
  const h1=performance.now();
  try{render(dt,now);}catch(e){console.error(e);}
  QUAL.cpu=performance.now()-c0;perfFrame(dt,QUAL.cpu,h1-c0);   // ตัววัดบนจอ (js/71)
  if(HSTOP.pend>0){HSTOP.t=HSTOP.pend;HSTOP.until=now+(HSTOP.pend+HSTOP.gap)*1000;HSTOP.pend=0;}
  requestAnimationFrame(frame);
}
let _fpsAcc=0,_fpsN=0,_fpsLast=performance.now();   // เวลาจริง ไม่ใช่ dt (dt ถูกตัดที่ 0.05 → ตัวเลขเดิมไม่มีทางต่ำกว่า 20 ทำให้ดูเหมือนล็อก 20 fps)
function render(dt,now){
  if(SET.fps){_fpsAcc+=(now-_fpsLast)/1000;_fpsLast=now;_fpsN++;if(_fpsAcc>=0.5){const el=document.getElementById('fps');if(el)el.textContent=Math.round(_fpsN/_fpsAcc)+' FPS';_fpsAcc=0;_fpsN=0;}}
  cx.setTransform(DPR,0,0,DPR,0,0);
  cx.clearRect(0,0,SW,SH);
  animateWorld(now);
  if(!NET.isHost&&screen==='game')sbufAdvance(now);   // ลูกข่าย: เลือก snapshot ที่จะแสดงจากบัฟเฟอร์ (js/19)
  if(POD.on&&screen==='game'){renderPodium(dt,now);return;}   // โพเดียมหลังจบเกม (js/55)
  const v=VIEW.cur;
  if(screen!=='game'||!v){
    if(PM3.size||EM3.size||JM3.size||WM3.size||MM3.size)clearDyn();
    PARTS.length=0;TEXTS.length=0;CAMRS.has=false;
    if(screen==='menu'||screen==='lobby'){renderStage(dt,now);return;}
    updateParticles(dt);updateShapes(dt);updateLights(dt);
    menuCamera(now);gl.shadowMap.needsUpdate=true;composer.render();return;
  }
  let a=VIEW.a!==null?VIEW.a:VIEW.prev?clamp((now-VIEW.tCur)/Math.max(8,VIEW.tCur-VIEW.tPrev),0,1):1,SA=v,SB=VIEW.prev;
  if(NET.isHost&&!HBOLD){a=1;SB=null;}   // โฮสต์เดินเกมก่อนวาดเฟรมนี้ (frame) ภาพคือสถานะล่าสุด ไม่หน่วง • ?hbold = แบบเดิม
  const pm={},em={};
  if(SB){for(const p of SB.P)pm[p.id]=p;for(const e of SB.E)em[e.id]=e;}
  const P=SA.P.map(p=>{const q=pm[p.id];if(!q||Math.abs(q.x-p.x)+Math.abs(q.y-p.y)>200)return p;return Object.assign({},p,{x:lerp(q.x,p.x,a),y:lerp(q.y,p.y,a),z:lerp(q.z||0,p.z||0,a),a:lerpAng(q.a,p.a,a)});});   // z ด้วย: เดิมความสูงกระโดดขยับเป็นขั้น 30 ครั้ง/วิ → กล้องสั่นตอนกระโดด (ผู้ใช้ 2026-10-26)
  const E=SA.E.map(e=>{const q=em[e.id];if(!q)return e;return Object.assign({},e,{x:lerp(q.x,e.x,a),y:lerp(q.y,e.y,a)});});
  predictMe(P,dt,now);
  const me=P.find(p=>p.id===NET.myId);
  // เริ่มรอบ: หันกล้องตามทิศเกิด เฉพาะตอนถูกย้ายไปจุดเกิดจริง (เริ่มเกม / รอบใหม่ PvP) — ไม่ใช่ทุกเวฟ Co-op (เดิมกล้องหันเองทุกเวฟ เพราะทิศจากเน็ตช้ากว่าเมาส์)
  if(v.ph==='count'&&lastPh!=='count'&&me&&(!CAMRS.has||Math.hypot(me.x-CAMRS.x,me.y-CAMRS.y)>150)){yaw=me.a;pitch=0.3;}
  if(me){CAMRS.has=true;CAMRS.x=me.x;CAMRS.y=me.y;}else CAMRS.has=false;
  lastPh=v.ph;warmTick(v);
  if(me){
    if(me.al&&!me.dn)me.a=yaw;
    const f=(INPUT.u?1:0)-(INPUT.d?1:0),s=(INPUT.r?1:0)-(INPUT.l?1:0);
    const fx=Math.cos(yaw),fy=Math.sin(yaw);
    INPUT.mx=fx*f-fy*s;INPUT.my=fy*f+fx*s;
    INPUT.ax=me.x+fx*2000;INPUT.ay=me.y+fy*2000;
    INPUT.ap=clamp((0.3-pitch)*1.2,-0.9,0.9);
    if(!dcamCam(P,me,dt))updateCamera(specTarget(P,me,dt)||me,dt);   // ตายนาน ≥2 วิ = ดูคนอื่น (js/52)
    aimFromCrosshair(me,P,E);
    updatePlaceGhost(me);
    const o=PM3.get(me.id);windUpdate(o?Math.hypot(o.svx,o.svz):0,!!me.fl);
  }else{const sv=specTarget(P,null,dt);if(sv)updateCamera(sv,dt);else menuCamera(now);}   // คนดู (ไม่มีตัวในเกม)
  shakeA=Math.max(0,shakeA-dt*30);
  vfxBegin(dt);try{renderGame(v,P,E,me,dt,now);}finally{vfxEnd();}
}
// ส่วนที่รันทุกเฟรมในเกม (อยู่ใต้งบเอฟเฟกต์ vfxBegin/vfxEnd)
function renderGame(v,P,E,me,dt,now){
  let t0=performance.now();
  if(!FXSTUDIO.seek){syncPlayers(P,v.mode,now,dt);pf('p.sync',t0);let t1=performance.now();grassTick(dt);pf('p.grass',t1);t1=performance.now();QUAL.clA+=dt;{const cs=qualCS();if(!cs||QUAL.frame%(cs+1)===0){clothTick(QUAL.clA);QUAL.clA=0;}}pf('p.cloth',t1);gameWarmFree(dt);}pf('players',t0);   // grassTick = ลม + หญ้า (js/50) • clothTick = ผ้าคลุมจริงของเรา (js/49)
  if(me&&me.al&&!me.fl&&!me.dn){const o=PM3.get(me.id);if(o){const k=Math.floor(o.walk/Math.PI);if(o.stepK!==undefined&&k!==o.stepK)snd('step',{vol:0.35,rev:0.1});o.stepK=k;}}t0=performance.now();
  syncEnemies(E,P,now,dt);pf('enemies',t0);t0=performance.now();
  let t1=t0;   // projMode แยกย่อยให้ WD.PROF (pm.proj / pm.earth / ...) — รวมยังเป็น 'projMode' เหมือนเดิม
  broomTick(dt);syncProj(v,now);pf('pm.proj',t1);t1=performance.now();syncWalls(v);syncPots(v,now);pf('pm.walls',t1);t1=performance.now();
  syncEarth(v,dt,now);pf('pm.earth',t1);t1=performance.now();syncWind(v,dt,now);pf('pm.wind',t1);t1=performance.now();syncWater(v,dt,now);pf('pm.water',t1);t1=performance.now();
  syncProps(v);syncBld(dt);cityCull();cityViewSync(dt);brkSync(dt);pf('pm.props',t1);t1=performance.now();syncMins(v,now,dt);pf('pm.mins',t1);t1=performance.now();
  syncModeObjs(v,P,me,now,dt);pf('projMode',t0);
  KC=Math.max(0,KC-dt);roleShowT=Math.max(0,roleShowT-dt);
  $('#trainEnd').classList.toggle('hidden',!(NET.isHost&&v.mode==='train'&&v.ph!=='over'));
  trSync(v);bpSync(v);
  tickFlash(dt);
  t0=performance.now();{let t1=t0;updateZV(dt);pf('fx.zv',t1);let t2=performance.now();updateParticles(dt);pf('fx.particles',t2);pf('fx.parts',t1);t1=performance.now();updateShapes(dt);pf('fx.shapes',t1);t1=performance.now();updateLights(dt);pf('fx.lights',t1);t1=performance.now();updateVfx(dt);pf('fx.vfx',t1);t1=performance.now();updateDebris(dt);pf('fx.debris',t1);}pf('fx',t0);
  QUAL.frame++;gl.shadowMap.needsUpdate=QUAL.mode==='high'||QUAL.frame%(QUAL.cs>=2?12:QUAL.cs?6:QUAL.mode==='auto'&&QUAL.lvl>=2?4:2)===0;if(gl.shadowMap.needsUpdate)shadowFollow();if(QUAL.frame%30===1)shadowDepthSplit();cullTick(dt);
  if(FXSTUDIO.noDraw)return;
  instzTick();t0=performance.now();taaBegin();composer.render();taaFinish();pf('gpuSubmit',t0);pinPrograms();
  t0=performance.now();const spk=speakingIds();
  drawLabels(P,E,v,me,spk);pf('h.labels',t0);
  {let t1=performance.now();const T=k=>{pf('h.'+k,t1);t1=performance.now();};drawMinBars(v,me);T('bars');
  drawTexts(dt);T('texts');
  if(me&&me.al&&!me.dn)drawCrosshair();
  if(!VIC.on)drawHUD(v,me,P);T('hud');drawSocial(P,me,dt,now);T('social');drawCombo(v,E,now);drawFFA(v,P,me,now);T('ffa');drawDeathCam(me);if(PROPON&&me&&me.al&&!me.dn&&!showBoard)drawPropHint(me);hud4Frame();T('hud4');}pf('hud2d',t0);   // ป้าย VICTORY/DEFEAT = ซ่อน HUD
}
