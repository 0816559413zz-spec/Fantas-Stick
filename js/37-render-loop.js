// ---------- ลูปเรนเดอร์ ----------
let lastFrame=performance.now();
// hit-stop / impact frame: เราตีโดนแรงๆ = ค้างภาพบนจอเราแว้บหนึ่ง (เกมจริงยังเดินต่อ ไม่หยุดของเพื่อน)
// หยุดภาพได้ครั้งละครั้ง แล้วพัก HSTOP.gap วินาที — กันตีถี่/โดนหลายตัวแล้วภาพหยุดๆ เดินๆ จนดูเหมือนกระตุก
const HSTOP={t:0,pend:0,until:0,gap:0.3};
function hitStop(d){if(screen==='game'&&performance.now()>=HSTOP.until)HSTOP.pend=Math.max(HSTOP.pend,d);}
// สตูดิโอ VFX (studio/studio.js) ขับเฟรมเอง: own = หยุดลูปนี้ • noDraw = อัปเดตเอฟเฟกต์โดยไม่วาด (กรอเวลา) 
const FXSTUDIO={own:false,noDraw:false};
function frame(now){
  if(FXSTUDIO.own)return;
  const dt=Math.min(0.05,(now-lastFrame)/1000);lastFrame=now;
  if(HSTOP.t>0){HSTOP.t-=dt;requestAnimationFrame(frame);return;}
  qualTick(dt);
  try{render(dt,now);}catch(e){console.error(e);}
  if(HSTOP.pend>0){HSTOP.t=HSTOP.pend;HSTOP.until=now+(HSTOP.pend+HSTOP.gap)*1000;HSTOP.pend=0;}
  requestAnimationFrame(frame);
}
let _fpsAcc=0,_fpsN=0;
function render(dt,now){
  if(SET.fps){_fpsAcc+=dt;_fpsN++;if(_fpsAcc>=0.5){const el=document.getElementById('fps');if(el)el.textContent=Math.round(_fpsN/_fpsAcc)+' FPS';_fpsAcc=0;_fpsN=0;}}
  cx.setTransform(DPR,0,0,DPR,0,0);
  cx.clearRect(0,0,SW,SH);
  animateWorld(now);
  const v=VIEW.cur;
  if(screen!=='game'||!v){
    if(PM3.size||EM3.size||JM3.size||WM3.size||MM3.size)clearDyn();
    PARTS.length=0;TEXTS.length=0;
    if(screen==='menu'||screen==='lobby'){renderStage(dt,now);return;}
    updateParticles(dt);updateShapes(dt);updateLights(dt);
    menuCamera(now);gl.shadowMap.needsUpdate=true;composer.render();return;
  }
  const a=VIEW.prev?clamp((now-VIEW.tCur)/Math.max(8,VIEW.tCur-VIEW.tPrev),0,1):1;
  const pm={},em={};
  if(VIEW.prev){for(const p of VIEW.prev.P)pm[p.id]=p;for(const e of VIEW.prev.E)em[e.id]=e;}
  const P=v.P.map(p=>{const q=pm[p.id];if(!q||Math.abs(q.x-p.x)+Math.abs(q.y-p.y)>200)return p;return Object.assign({},p,{x:lerp(q.x,p.x,a),y:lerp(q.y,p.y,a),a:lerpAng(q.a,p.a,a)});});
  const E=v.E.map(e=>{const q=em[e.id];if(!q)return e;return Object.assign({},e,{x:lerp(q.x,e.x,a),y:lerp(q.y,e.y,a)});});
  const me=P.find(p=>p.id===NET.myId);
  if(v.ph==='count'&&lastPh!=='count'&&me){yaw=me.a;pitch=0.3;}
  lastPh=v.ph;
  if(me){
    if(me.al&&!me.dn)me.a=yaw;
    const f=(INPUT.u?1:0)-(INPUT.d?1:0),s=(INPUT.r?1:0)-(INPUT.l?1:0);
    const fx=Math.cos(yaw),fy=Math.sin(yaw);
    INPUT.mx=fx*f-fy*s;INPUT.my=fy*f+fx*s;
    INPUT.ax=me.x+fx*2000;INPUT.ay=me.y+fy*2000;
    INPUT.ap=clamp((0.3-pitch)*1.2,-0.9,0.9);
    updateCamera(me,dt);
    aimFromCrosshair(me,P,E);
    updatePlaceGhost(me);
    const o=PM3.get(me.id);windUpdate(o?Math.hypot(o.svx,o.svz):0,!!me.fl);
  }else menuCamera(now);
  shakeA=Math.max(0,shakeA-dt*30);
  vfxBegin(dt);try{renderGame(v,P,E,me,dt,now);}finally{vfxEnd();}
}
// ส่วนที่รันทุกเฟรมในเกม (อยู่ใต้งบเอฟเฟกต์ vfxBegin/vfxEnd)
function renderGame(v,P,E,me,dt,now){
  let t0=performance.now();
  syncPlayers(P,v.mode,now,dt);pf('players',t0);
  if(me&&me.al&&!me.fl&&!me.dn){const o=PM3.get(me.id);if(o){const k=Math.floor(o.walk/Math.PI);if(o.stepK!==undefined&&k!==o.stepK)snd('step',{vol:0.35,rev:0.1});o.stepK=k;}}t0=performance.now();
  syncEnemies(E,P,now,dt);pf('enemies',t0);t0=performance.now();
  syncProj(v,now);syncWalls(v);syncProps(v);syncBld(dt);syncMins(v,now,dt);
  syncModeObjs(v,P,me,now,dt);pf('projMode',t0);
  KC=Math.max(0,KC-dt);roleShowT=Math.max(0,roleShowT-dt);
  $('#trainEnd').classList.toggle('hidden',!(NET.isHost&&v.mode==='train'&&v.ph!=='over'));
  trSync(v);
  tickFlash(dt);
  t0=performance.now();updateZV(dt);updateParticles(dt);updateShapes(dt);updateLights(dt);updateVfx(dt);updateDebris(dt);pf('fx',t0);
  QUAL.frame++;gl.shadowMap.needsUpdate=QUAL.mode==='high'||QUAL.frame%2===0;
  if(FXSTUDIO.noDraw)return;
  t0=performance.now();composer.render();pf('gpuSubmit',t0);
  t0=performance.now();const spk=speakingIds();
  drawLabels(P,E,v,me,spk);drawMinBars(v,me);
  drawTexts(dt);
  if(me&&me.al&&!me.dn)drawCrosshair();
  drawHUD(v,me,P);if(PROPON&&me&&me.al&&!me.dn&&!showBoard)drawPropHint(me);pf('hud2d',t0);
}
