// =====================================================================
//  สายลม 🌪️ (ผู้ใช้ออกแบบทั้งหมด — designs/wind.md "คอนเซ็ปต์ใหม่") • ฝั่งโฮสต์ • ขั้นที่ 1 (2026-10-28)
//  "ผู้ผลัก" เล่นกับกำแพงลม: ผลักศัตรูชนกำแพงลม = สตัน 0.5 วิ • ตีศัตรูที่ติดกำแพงครบ 70 = กำแพงแตกระเบิด 50 + กระเด็นไกล
//  เกจ GaleBurst p.wg 0-100: BA โดน +12 • กดค้างคลิกซ้ายดูดลม +8/วิ • โล่โดนตี +10 • เต็ม = กดโจมตีปกติค้างเพื่อยิงลมกรวยต่อเนื่อง
//  กำแพงลม G.wwl: {x,y ศูนย์กลาง, a ทิศหน้ากำแพง, L ครึ่งความกว้าง, mv ระยะดันที่เหลือ, acc ดาเมจสะสม}
//  ขั้นที่ 2: Windrift / Vortex Bind / Void Spheres / Featherwing • ขั้นที่ 3: อัลติ Eye of Heaven (2026-10-28)
// =====================================================================
const WINDP=PATHS.length;
// ตัวเลขทั้งหมดของสายลม: WNV = PATHS[WINDP].v (ใบมีดลม/GaleBurst/โล่ปีก/Dash) + v:{...} ของแต่ละสกิล (W_WL W_DR W_VX W_VO W_FW W_UL = S.v) — ปรับได้ใน tune.html / F8 (js/73-tune.js)
PATHS.push({id:'wind',n:'สายลม',ic:'🌪️',col:'#8dff65',d:'พริ้วไหวกลางอากาศ — บนพื้นอ่อนลงทันที แต่ถ้าบินด้วย Featherwing สกิลทั้งชุดแรงขึ้น: พัดศัตรูลอย กดลง พาไปด้านหน้า ฟันช้า ต่อคอมโบได้ต่อเนื่อง จบด้วย Sonic Boom Strike',
  combo:'บิน Featherwing → Windup พัดศัตรูลอยค้าง → Wind Push กดลงสตัน / Windforce พาไปข้างหน้า / Windblade ฟันช้าแล้วลดคูล Featherwing → Sonic Boom Strike ปิดท้าย (ต่อเวลาบิน + รีเซ็ตคูลทุกสกิล) • BA ใบมีดลมเก็บเกจ GaleBurst เหมือนเดิม'});
const WNV=PATHS[WINDP].v={baDmg:5,baCd:0.30,baRange:600,baSpd:1100,baGain:12,baHold:0.35,baChg:8,gbHold:0.3,gbDur:2.6,gbLen:340,gbR0:10,gbR1:62,gbTick:0.25,gbDmg:5,gbAcc:800,gbMax:120,gbSlow:0.55,gbCd:0.5,
  shHp:75,shGain:10,shChg:0.3,shR:200,shStun:0.8,shPush:1500,shDmg:20,dsBack:1800,dsVz:7,dsPush:1500,dsReach:150,dsCone:60,dsWall:20,dsCd:8};
PATHS[WINDP].vn={baDmg:'ใบมีดลม • ดาเมจ',baCd:'ใบมีดลม • เว้น (วิ)',baRange:'ใบมีดลม • ระยะ',baSpd:'ใบมีดลม • ความเร็ว',baGain:'ใบมีดลม • โดนแล้วเกจ +%',baHold:'ดูดลม • กดค้างกี่วิเริ่ม',baChg:'ดูดลม • เกจ +%/วิ',
  gbHold:'GaleBurst • กดค้างก่อนยิง (วิ)',gbDur:'GaleBurst • ยิงต่อเนื่องได้นาน (วิ เกจเต็ม→หมด)',gbLen:'GaleBurst • ระยะ',gbR0:'GaleBurst • กว้างต้นทาง (รัศมี)',gbR1:'GaleBurst • กว้างปลาย (รัศมี)',gbTick:'GaleBurst • ติดดาเมจทุก (วิ)',gbDmg:'GaleBurst • ดาเมจต่อครั้ง',gbAcc:'GaleBurst • แรงดันศัตรู (เร่ง)',gbMax:'GaleBurst • ความเร็วดันศัตรูสูงสุด',gbSlow:'GaleBurst • ตัวเราเดินช้าลง (เท่า)',gbCd:'GaleBurst • เว้นหลังหยุดยิง (วิ)',
  shHp:'โล่ปีก • รับดาเมจได้',shGain:'โล่ปีก • โดนตีเกจ +%',shChg:'ระเบิดปีก • ชาร์จ (วิ)',shR:'ระเบิดปีก • รัศมี',shStun:'ระเบิดปีก • สตัน (วิ)',shPush:'ระเบิดปีก • แรงผลัก',shDmg:'ระเบิดปีก • ดาเมจ',
  dsBack:'Dash • แรงดีดถอยหลัง',dsVz:'Dash • แรงลอยขึ้น',dsPush:'Dash • แรงผลักศัตรู',dsReach:'Dash • ระยะผลักข้างหน้า',dsCone:'Dash • มุมผลัก (องศา ครึ่งซ้าย/ขวา)',dsWall:'Dash • ผลักชนกำแพง ดาเมจ',dsCd:'Dash • คูลดาวน์ (วิ)'};
Object.assign(PDEF,{wblade:{spd:WNV.baSpd,r:9,dmg:WNV.baDmg,life:WNV.baRange/WNV.baSpd,col:'#8dff65'}});
// ---------- ตัวช่วย ----------
const wOn=p=>p&&p.pathIdx===WINDP;
function wGain(p,n){if(!wOn(p))return;const was=p.wg|0;p.wg=Math.min(100,(p.wg||0)+n);if(was<100&&p.wg>=100)emit({k:'efx',z:'wngbfull',x:p.x,y:p.y,h:p.z,id:p.id});}
// ระยะจากจุดถึงกำแพง (เส้นตรงตั้งฉากกับทิศหน้า) → {d, qx, qy, s (ด้านหน้า +)}
function wSeg(w,x,y){const nx=Math.cos(w.a),ny=Math.sin(w.a),tx=-ny,ty=nx,dx=x-w.x,dy=y-w.y;const u=Math.max(-w.L,Math.min(w.L,dx*tx+dy*ty)),qx=w.x+tx*u,qy=w.y+ty*u;return {d:Math.hypot(x-qx,y-qy),qx,qy,s:dx*nx+dy*ny};}
function wFoeNear(p,x,y,r){return foesOf(p.team).filter(t=>Math.hypot(t.x-x,t.y-y)<r+(t.r||PR));}

// ---------- ทุกเฟรมของผู้เล่นสายลม (เรียกจาก updatePlayer หลังส่วนโล่) ----------
function windTick(p,dt){
  if(p.wg===undefined)p.wg=0;
  if(p.wwc===undefined){p.wwc=W_WL.max;p.wwr=0;}
  // ชาร์จกำแพงลมคืนทีละอัน (8 วิ/อัน สูงสุด 3) • ไม่มีชาร์จเหลือ = ช่องสกิลขึ้นคูลดาวน์จนกว่าจะได้คืน
  if(p.wwc<W_WL.max){p.wwr+=dt/p.buffs.cdr;if(p.wwr>=W_WL.charge){p.wwr=0;p.wwc++;}}
  {const i=p.kitIds?p.kitIds.indexOf('aegisgale'):-1;if(i>=0&&p.wwc<=0){const k=SLOTK[i],left=W_WL.charge-p.wwr;if(p.cd[k]<left){p.cd[k]=left;p.cdMax[k]=W_WL.charge;}}}
  // เลือกวิธีวางกำแพง: คลิกซ้าย = ดันไปข้างหน้า • คลิกขวา = วางที่จุดเล็ง
  if(p.wwAim){p.wwAim.t-=dt;const inp=p.inp||{};
    if(!p.alive||p.stun>0||p.wwAim.t<=0){p.wwAim=null;p.wwc=Math.min(W_WL.max,p.wwc+1);emit({k:'efx',z:'wnwaimoff',x:p.x,y:p.y,h:p.z,id:p.id});}
    else if(inp.fire&&!p.wwAim.f0)windWallMake(p,'push');
    else if(inp.sh&&!p.wwAim.s0)windWallMake(p,'place');
    if(p.wwAim){p.wwAim.f0=inp.fire;p.wwAim.s0=inp.sh;}}
  // ระเบิดปีก (ชาร์จ 0.3 วิ แล้วระเบิด)
  if(p.wsb){p.wsb.t-=dt;if(!p.alive){p.wsb=null;}else if(p.wsb.t<=0){p.wsb=null;windShieldBurst(p);}}
  if(p.wsbL>0)p.wsbL-=dt;
  if(p.wgs&&(!p.alive||p.stun>0))windStreamEnd(p,null);
  if(p.wdr)windDriftTick(p,dt);
  if(p.wfc)windForceTick(p,dt);
  if(p.wbl)windBladeTick(p,dt);
  if(p.wfw)windFlyTick(p,dt);
  if(p.wult)windUltTick(p,dt);
}
// ความเร็วเดินพิเศษ: ชาร์จอัลติ = นิ่ง • Featherwing: หมุนตัวขึ้น = นิ่ง (สคริปต์คุมตำแหน่ง) / บินปกติ = ×spd (บินเร็ว Shift ใช้ fastSpd ใน js/11)
function windSpd(p){return p.wgs?WNV.gbSlow:p.wult?0:p.wdr&&p.wdr.ph==='chg'?0:p.wfw?(p.wfw.ph==='spin'?0:p.wfw.ph==='focus'?(p.fly?1:W_FW.spd):1):1;}
// ความสูงตอนบิน (แทนแรงโน้มถ่วง) — เรียกจาก updatePlayer
function windFlyZ(p,dt){const F=p.wfw,gh=groundH(p.x,p.y,p.z);
  if(F.ph==='spin'){p.vz=0;}   // spin: windFlyTick ตั้งความสูงเอง
  else if(F.ph==='focus'){const inp=p.inp||{};   // บินปกติ: Space สูงขึ้น • Ctrl/C ต่ำลง — F.h = ความสูงเหนือพื้นที่อยากได้ • อัลติพุ่ง = สคริปต์คุมความสูงเอง • Windforce = ขึ้น/ลงตามเล็ก (dv)
    if(p.wult&&p.wult.ph==='dash'){F.h=clamp(p.z-gh,0.6,24);p.vz=0;}
    else{const dv=p.wult?0:p.wfc?p.wfc.dv:((inp.jh?1:0)-(inp.ch?1:0))*W_FW.vs;
      F.h=clamp(F.h+dv*dt,W_FW.hmin,W_FW.hmax+(p.wfc?6:0));
      p.vz=clamp((gh+F.h-p.z)*5,-Math.max(W_FW.vs,Math.abs(dv)*1.2),Math.max(W_FW.vs,Math.abs(dv)*1.2));p.z+=p.vz*dt;}}
  else{p.vz=Math.max(-W_FW.glide,Math.min(p.vz||0,0)-6*dt);p.z+=p.vz*dt;if(p.z<=gh){p.z=gh;p.vz=0;p.wfw=null;emit({k:'efx',z:'wnfwland',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}}}
function windReset(p){p.wult=null;p.wfc=null;p.wbl=null;p.wflt=0;p.wus=0;p.wdr=null;p.wfw=null;p.wg=0;p.wwc=W_WL.max;p.wwr=0;p.wwAim=null;p.wsb=null;p.wsbL=0;p.wchg=0;p.wfHeld=0;if(p.wgs)windStreamEnd(p,null);p.wgw=0;if(p.wfo){p.wfo=false;p.fly=false;p.flyOn=false;}p.wbCd=0;}

// ---------- ท่าพื้นฐาน (คลิกซ้าย): ใบมีดลม / ดูดลมชาร์จเกจ / GaleBurst ----------
function windBasic(p,inp,dt,setCd){
  const prev=p.wfPrev;p.wfPrev=inp.fire;
  if(p.wwAim)return;   // กำลังเลือกวิธีวางกำแพง (คลิกซ้าย = ดัน)
  if(p.wfo&&!p.shieldOn){windFocusAct(p,inp,dt);return;}   // บิน Focus: คลิกซ้าย = ลูกบอลลม
  if(p.shieldOn){   // ระหว่างยกโล่: เกจเต็ม + คลิก = ชาร์จปีกแล้วระเบิด
    if(inp.fire&&!prev&&p.wg>=100&&!p.wsb){p.wsb={t:WNV.shChg};emit({k:'efx',z:'wnsbchg',x:p.x,y:p.y,h:p.z,id:p.id});}
    p.wchg=0;return;}
  if(p.wgs){windStreamTick(p,inp,dt,setCd);return;}   // กำลังยิงลมต่อเนื่อง (GaleBurst)
  if(inp.fire&&!prev){p.wfHeld=0;p.wgw=0;
    if(p.wg>=100)return;   // เกจเต็ม: ไม่ยิงทันที ต้องกดโจมตีปกติค้างไว้ (ดูด้านล่าง)
    if(p.cd.basic<=0){PDEF.wblade.spd=WNV.baSpd;PDEF.wblade.life=WNV.baRange/WNV.baSpd;shoot(p,'wblade',{sp:'b_wind',dmg:WNV.baDmg});setCd('basic',WNV.baCd);}
    return;}
  if(inp.fire){p.wfHeld=(p.wfHeld||0)+dt;
    if(p.wg>=100){   // เกจเต็ม + กดค้าง = เตรียม 0.3 วิ แล้วยิงลมออกไปต่อเนื่องจนปล่อยปุ่มหรือเกจหมด
      if(p.wchg){p.wchg=0;emit({k:'efx',z:'wnchg',x:p.x,y:p.y,h:p.z,id:p.id,n:0});}
      if(p.cd.basic<=0){if(!p.wgw)emit({k:'efx',z:'wngbw',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});p.wgw=(p.wgw||0)+dt;if(p.wgw>=WNV.gbHold)windStreamStart(p);}
      return;}
    // กดค้างตอนเกจยังไม่เต็ม = ดูดลมรอบตัว +8%/วิ (ไม่ยิง) ⚠ เริ่มหลังกดค้าง 0.35 วิ
    if(p.wfHeld>=WNV.baHold&&p.wg<100){if(!p.wchg)emit({k:'efx',z:'wnchg',x:p.x,y:p.y,h:p.z,id:p.id,n:1});p.wchg=1;wGain(p,WNV.baChg*dt);}
    else if(p.wg>=100&&p.wchg){p.wchg=0;emit({k:'efx',z:'wnchg',x:p.x,y:p.y,h:p.z,id:p.id,n:0});}
    return;}
  if(prev&&p.wchg){p.wchg=0;emit({k:'efx',z:'wnchg',x:p.x,y:p.y,h:p.z,id:p.id,n:0});}
  p.wfHeld=0;p.wgw=0;
}
// GaleBurst (ผู้ใช้ 2026-11-07): เกจเต็ม → กดโจมตีปกติค้าง 0.3 วิ → ยิงลมเป็นลำกรวยกว้างต่อเนื่อง (เกจไหลหมดใน 2.6 วิ หรือปล่อยปุ่มก่อน = เกจที่เหลือเก็บไว้)
// ศัตรูในกรวยถูกดันออกไปเบา ๆ ต่อเนื่อง (เร่งจนความเร็วสูงสุด ~130 ตัวเดินสวนยังไหว) + ติดดาเมจทุก 0.25 วิ • ตัวเราเดินช้าลง
function windStreamStart(p){if(p.wgs)return;p.wgs={t:0,tk:0};p.wgw=0;p.wchg=0;emit({k:'efx',z:'wngb',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(p.ang*100)/100,id:p.id,n:1});}
function windStreamEnd(p,setCd){if(!p.wgs)return;p.wgs=null;p.wgw=0;if(setCd)setCd('basic',WNV.gbCd);emit({k:'efx',z:'wngb',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id,n:0});}
function windStreamTick(p,inp,dt,setCd){const S=p.wgs;
  if(!p.alive||p.stun>0||!inp.fire||p.shieldOn||p.wwAim||p.wg<=0){windStreamEnd(p,setCd);return;}
  S.t+=dt;p.wg=Math.max(0,p.wg-100/WNV.gbDur*dt);
  const a=p.ang,ca=Math.cos(a),sa=Math.sin(a),ox=p.x+ca*20,oy=p.y+sa*20,len=WNV.gbLen*Math.min(1,S.t/0.15),h=p.z+1.15;
  S.tk-=dt;const tick=S.tk<=0;if(tick)S.tk+=WNV.gbTick;
  for(const t of foesOf(p.team)){const dx=t.x-ox,dy=t.y-oy,u=dx*ca+dy*sa;if(u<-10||u>len)continue;
    const r=WNV.gbR0+(WNV.gbR1-WNV.gbR0)*Math.max(0,u)/WNV.gbLen,side=Math.abs(-dx*sa+dy*ca);if(side>r+(t.r||PR)||Math.abs(cH(t)-h+1.1)>3)continue;
    {const along=(t.vx||0)*ca+(t.vy||0)*sa,add=Math.min(WNV.gbAcc*dt,Math.max(0,WNV.gbMax-along))*(isBig(t)?0.35:1);t.vx=(t.vx||0)+ca*add;t.vy=(t.vy||0)+sa*add;t.wpush=0.3;}
    if(tick&&aoeHit(p,t,WNV.gbDmg,null))emit({k:'efx',z:'wngbhit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});}}

// ---------- โล่ปีก ----------
function windShieldBurst(p){if(p.wg<100)return;p.wg=0;p.wsbL=0.6;p.shieldOn=false;p.vz=Math.max(p.vz||0,3);   // ลอยขึ้นนิดเดียว ~0.3 ม. (ผู้ใช้)
  for(const t of wFoeNear(p,p.x,p.y,WNV.shR))aoeHit(p,t,WNV.shDmg,t=>{addStun(t,WNV.shStun);knock(t,p.x,p.y,WNV.shPush);t.wpush=0.8;});
  emit({k:'efx',z:'wnsb',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}

// ---------- Dash: ผลักศัตรูข้างหน้า + ดีดตัวเราถอยหลังลอยกลางอากาศ ----------
function windDash(p,inp,pr,dt,setCd){
  if(!pr.sp||p.cd.dodge>0||p.wwAim||(p.wfw&&(p.wfw.ph==='spin'||p.wfw.ph==='focus')))return false;   // บิน Featherwing: Shift = เอนตัวบินไว ไม่ใช่ Dash
  const a=p.ang,ca=Math.cos(a),sa=Math.sin(a);p.shieldOn=false;
  for(const t of foesOf(p.team)){const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);if(d>WNV.dsReach+(t.r||PR)||Math.abs(angDiff(Math.atan2(dy,dx),a))>(WNV.dsCone*Math.PI/180)||Math.abs(cH(t)-(p.z+1.1))>3.5)continue;
    knock(t,t.x-ca*10,t.y-sa*10,WNV.dsPush);t.wpush=0.8;t.wdk=0.8;t.wdkSrc=p.id;t.wdkN=t.solN|0;emit({k:'efx',z:'wndshit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});}
  p.vx=(p.vx||0)-ca*WNV.dsBack;p.vy=(p.vy||0)-sa*WNV.dsBack;p.vz=Math.max(p.vz||0,WNV.dsVz);   // (ไม่ใส่อมตะ: ตัวละครจะกะพริบหาย แต่ปีกยังอยู่ = ดูเหมือนปีกไม่ตามตัว)
  setCd('dodge',WNV.dsCd*p.buffs.cdr);
  emit({k:'efx',z:'wnds',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});
  return false;}

// ---------- กำแพงลม Aegis Gale ----------
function windWallMake(p,mode){const A=p.wwAim;p.wwAim=null;const a=p.ang;let x,y,mv=0;
  if(mode==='place'){const inp=p.inp||{};let gx=typeof inp.gx==='number'?inp.gx:p.x+Math.cos(a)*200,gy=typeof inp.gy==='number'?inp.gy:p.y+Math.sin(a)*200;
    const d=Math.hypot(gx-p.x,gy-p.y);if(d>W_WL.place){gx=p.x+(gx-p.x)/d*W_WL.place;gy=p.y+(gy-p.y)/d*W_WL.place;}x=gx;y=gy;}
  else{x=p.x+Math.cos(a)*40;y=p.y+Math.sin(a)*40;mv=W_WL.push;}
  const w={id:++G.zid,owner:p.id,team:p.team,x,y,a,L:W_WL.L,r:W_WL.r,t:W_WL.life,hp:W_WL.hp,mv,acc:0,uns:0,hitT:{},pass:{}};
  (G.wwl||(G.wwl=[])).push(w);
  emit({k:'efx',z:'wnwup',x:Math.round(x),y:Math.round(y),a:Math.round(a*100)/100,id:p.id,n:w.id,m:mode==='push'?1:0});
  emit({k:'sk',id:p.id,s:mode==='push'?'aegisgale_push':'aegisgale_place'});}   // ท่าตัวละคร
function windWallStop(w){if(w.mv<=0)return;w.mv=0;emit({k:'efx',z:'wnwstop',x:Math.round(w.x),y:Math.round(w.y),a:Math.round(w.a*100)/100,n:w.id});}
function windWallBoom(w){if(w.dead)return;w.dead=1;const o=G.players[w.owner],nx=Math.cos(w.a),ny=Math.sin(w.a);
  if(o)for(const t of foesOf(w.team)){const s=wSeg(w,t.x,t.y);if(s.d>W_WL.brad+(t.r||PR))continue;
    aoeHit(o,t,W_WL.bdmg,t=>{const d=s.d>2?s.d:1,ux=s.d>2?(t.x-s.qx)/d:nx,uy=s.d>2?(t.y-s.qy)/d:ny;knock(t,t.x-ux*10,t.y-uy*10,W_WL.bpush);t.vz=Math.max(t.vz||0,6);});}
  emit({k:'efx',z:'wnwboom',x:Math.round(w.x),y:Math.round(w.y),a:Math.round(w.a*100)/100,n:w.id});}
// ศัตรูโดนดาเมจระหว่างติดสตันกับกำแพง: นับเข้ากำแพงของคนตี (ครบ 70 = แตกระเบิด) • เรียกจาก damage()
function windDmg(t,amt,srcId){if(!(t.wwW>0)||!(t.stun>0)||srcId==null)return;const w=(G.wwl||[]).find(w=>w.id===t.wwW&&!w.dead);if(!w||w.owner!==srcId)return;
  w.acc+=amt;if(!w.uns&&w.acc>=W_WL.boom*0.7){w.uns=1;emit({k:'efx',z:'wnwuns',x:Math.round(w.x),y:Math.round(w.y),a:Math.round(w.a*100)/100,n:w.id});}
  if(w.acc>=W_WL.boom)windWallBoom(w);}
// เส้นตรง (x0,y0)→(x1,y1) ตัดกำแพงลมของทีมอื่นไหม (รวมความหนา + รัศมีของกระสุน) → {u:0..1, w} จุดแรกที่ชน หรือ null
function windRay(team,x0,y0,x1,y1,rad,h){if(!G.wwl||!G.wwl.length||(h!==undefined&&h>=5.8))return null;let best=null;
  for(const w of G.wwl){if(w.dead||w.team===team)continue;const nx=Math.cos(w.a),ny=Math.sin(w.a),T=w.r+(rad||0);
    const s0=(x0-w.x)*nx+(y0-w.y)*ny,s1=(x1-w.x)*nx+(y1-w.y)*ny;let u;
    if(Math.abs(s0)<=T)u=0;else{if((s0>0)===(s1>0)&&Math.abs(s1)>T)continue;const d=s1-s0;if(Math.abs(d)<1e-6)continue;u=((s0>0?T:-T)-s0)/d;if(u<0||u>1)continue;}
    const hx=x0+(x1-x0)*u,hy=y0+(y1-y0)*u;if(Math.abs(-(hx-w.x)*ny+(hy-w.y)*nx)>w.L+(rad||0))continue;
    if(!best||u<best.u)best={u,w,x:hx,y:hy};}
  return best;}
// ลำ/เส้นยิง: ระยะที่ไปได้ก่อนชนกำแพงลมของทีมอื่น (ไม่ชน = len) • dmg>0 = กำแพงเสีย HP (ใช้กับเส้นยิงครั้งเดียว ไม่ใช้กับลำต่อเนื่อง)
function windBlockLen(team,x,y,a,len,h,dmg){if(!G||!G.wwl||!G.wwl.length)return len;
  const r=windRay(team,x,y,x+Math.cos(a)*len,y+Math.sin(a)*len,0,h);if(!r)return len;
  if(dmg>0){emit({k:'efx',z:'wnwblk',x:Math.round(r.x),y:Math.round(r.y),h:h||1,n:r.w.id});windWallHurt(r.w,dmg);}
  return Math.max(0,len*r.u);}
// กระสุนศัตรูชนกำแพงลม = หายไป + กำแพงเสีย HP (ศัตรูตีพังได้) • กระสุนพวกเดียวกันทะลุ • ตรวจทั้งเส้นทางที่บินมาในเฟรมนี้ (กระสุนเร็วไม่ทะลุ)
function windProjHit(pr,dt){if(!G.wwl||!G.wwl.length)return false;
  const r=windRay(pr.team,pr.x-(pr.vx||0)*(dt||0),pr.y-(pr.vy||0)*(dt||0),pr.x,pr.y,pr.r,pr.h);
  if(r){pr.x=r.x;pr.y=r.y;emit({k:'efx',z:'wnwblk',x:Math.round(r.x),y:Math.round(r.y),h:pr.h,n:r.w.id});windWallHurt(r.w,pr.dmg||5);return true;}
  return false;}
function windWallHurt(w,n){if(w.dead||w.hp===undefined)return;w.hp-=n;if(w.hp<=0){w.dead=1;emit({k:'efx',z:'wnwboom',x:Math.round(w.x),y:Math.round(w.y),a:Math.round(w.a*100)/100,n:w.id,m:1});}}
// ศัตรูเดินผ่านกำแพงลมไม่ได้ (พวกเดียวกันผ่านได้) — เรียกจาก collideWorld
function windCollide(o,r,z){if(!G||!G.wwl||!G.wwl.length||o.team===undefined)return 0;let n=0;
  for(const w of G.wwl){if(w.dead||w.team===o.team||z>=5.4||w.mv>0)continue;const s=wSeg(w,o.x,o.y),m=w.r+r;if(s.d>=m)continue;   // กำแพงที่กำลังดันทะลุผ่านคน
    if(s.d>0.001){o.x=s.qx+(o.x-s.qx)/s.d*m;o.y=s.qy+(o.y-s.qy)/s.d*m;}else{const sg=s.s>=0?1:-1;o.x=s.qx+Math.cos(w.a)*m*sg;o.y=s.qy+Math.sin(w.a)*m*sg;}
    n++;}
  return n;}

// ---------- ทั้งสนาม: GaleBurst / กำแพงลม / ชนกำแพง ----------
function updateWind(dt){
  if(G.wdft&&G.wdft.length)G.wdft=G.wdft.filter(g=>{g.t-=dt;if(g.t<=0){windDriftWind(g);return false;}return true;});
  if(G.wup&&G.wup.length)G.wup=G.wup.filter(z=>windUpTick(z,dt));
  if(G.wvx&&G.wvx.length)G.wvx=G.wvx.filter(V=>windVortexTick(V,dt));
  if(G.wvh&&G.wvh.length)G.wvh=G.wvh.filter(o=>windVoidTick(o,dt));
  if(G.wwl&&G.wwl.length){
    for(const w of G.wwl){if(w.dead)continue;w.t-=dt;if(w.t<=0){w.dead=1;emit({k:'efx',z:'wnwend',x:Math.round(w.x),y:Math.round(w.y),n:w.id});continue;}
      for(const k in w.hitT)if((w.hitT[k]-=dt)<=0)delete w.hitT[k];
      // ดันไปข้างหน้า: กวาดศัตรูที่อยู่หน้ากำแพงไปด้วย หยุดเมื่อสุดระยะ
      if(w.mv>0){const st=Math.min(w.mv,W_WL.spd*dt),nx=Math.cos(w.a),ny=Math.sin(w.a);w.x+=nx*st;w.y+=ny*st;w.mv-=st;
        // ผู้ใช้ 2026-11-07: ศัตรูที่โดนกำแพงตอนดัน ถูกผลักไปตามกำแพงจนสุดทาง (ไม่ทะลุแล้ว) • แต่ละคนโดนครั้งแรก: สตัน 0.5 + 10 ดาเมจ
        // ถ้าคนที่ถูกผลักติดสิ่งกีดขวาง (กำแพงแผนที่/ตึก) = กำแพงลมหยุดตรงนั้น
        const carry=[];let blocked=false;
        for(const t of foesOf(w.team)){if(cH(t)>4.9)continue;const s=wSeg(w,t.x,t.y),m=w.r+(t.r||PR);if(s.d>m+0.5)continue;
          let tx,ty;if(Math.abs(s.d-Math.abs(s.s))<0.01){tx=s.qx+nx*(m+0.6);ty=s.qy+ny*(m+0.6);}else{const d=s.d>0.001?s.d:1;tx=s.qx+(t.x-s.qx)/d*(m+0.6);ty=s.qy+(t.y-s.qy)/d*(m+0.6);}
          const tmp={x:tx,y:ty};collideWorld(tmp,t.r||PR,cH(t));if(Math.hypot(tmp.x-tx,tmp.y-ty)>2)blocked=true;
          carry.push([t,tmp.x,tmp.y,s]);}
        if(blocked){w.x-=nx*st;w.y-=ny*st;windWallStop(w);}
        else{for(const [t,tx,ty,s] of carry){t.x=tx;t.y=ty;
            if(!w.pass[t.id]){w.pass[t.id]=1;const o=G.players[w.owner];if(o)aoeHit(o,t,W_WL.pdmg,t=>addStun(t,W_WL.pstun));emit({k:'efx',z:'wnwpass',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),a:Math.round(w.a*100)/100,n:w.id});}}
          if(w.mv<=0){w.mv=0.0001;windWallStop(w);}}}
      // ศัตรูที่โดนผลัก (ความเร็วกระเด็นสูง) วิ่งชนกำแพง = สตัน 0.5 วิ
      for(const t of foesOf(w.team)){if(w.hitT[t.id])continue;const sp=Math.hypot(t.vx||0,t.vy||0);if(sp<150&&!(t.wpush>0&&sp>60))continue;
        const s=wSeg(w,t.x,t.y);if(s.d>w.r+(t.r||PR))continue;
        w.hitT[t.id]=0.8;addStun(t,t.wus>0?W_UL.stun:W_WL.stun);t.wus=0;t.wwW=w.id;t.vx*=0.1;t.vy*=0.1;emit({k:'efx',z:'wnwhit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),a:Math.round(w.a*100)/100,n:w.id});
        if(t.wdk>0&&t.wdkSrc!=null){t.wdk=0;const o=G.players[t.wdkSrc];if(o)damage(t,WNV.dsWall,o.id,'proj');}}}
    G.wwl=G.wwl.filter(w=>!w.dead);}
  // Dash ผลักศัตรูชนกำแพงแผนที่/สิ่งก่อสร้าง = 20 ดาเมจ + สตัน (ชนกำแพง = สตันตามกติกาสาย ⚠ 0.5 วิ)
  for(const t of foesOf(-99)){if(t.wpush>0)t.wpush-=dt;if(t.wus>0)t.wus-=dt;if(t.wflt>0)t.wflt-=dt;
    if(t.wdk>0){t.wdk-=dt;if((t.solN|0)>(t.wdkN|0)&&Math.hypot(t.vx||0,t.vy||0)>120){t.wdk=0;const o=G.players[t.wdkSrc];if(o)damage(t,WNV.dsWall,o.id,'proj');addStun(t,W_WL.stun);emit({k:'efx',z:'wndswall',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});}}
    if(t.wwW&&!(t.stun>0))t.wwW=0;
    if(t.wsk>0)t.wsk-=dt;
    if(t.wsl>0){t.wsl-=dt;if(!windAirborne(t)){t.wsl=0;const o=G.players[t.wslS];if(o)damage(t,W_DR.slamDmg,o.id,'aoe');emit({k:'efx',z:'wnslam',x:Math.round(t.x),y:Math.round(t.y),h:0});}}   // กดลงถึงพื้น = ดาเมจ + ภาพกระแทก
    windTargetZ(t,dt);}
}
// ---------- Windrift: ชาร์จปีก 0.2 → พุ่ง 400 (20 ม. ใน 0.09 วิ) แบบ Jett → ลงท่าฮีโร่ → 0.6 วิต่อมาลมแรงตามมาพัดศัตรูในแนว ----------
function windDriftTick(p,dt){const R=p.wdr;R.t-=dt;
  if(!p.alive){p.wdr=null;return;}
  if(R.ph==='chg'){p.vz=Math.max(p.vz||0,0);if(R.t<=0){R.ph='dash';R.t=W_DR.t;p.dash=W_DR.t;p.dashSp=W_DR.dist/W_DR.t;p.dashX=Math.cos(R.a);p.dashY=Math.sin(R.a);p.inv=Math.max(p.inv||0,W_DR.t);p.shieldOn=false;}}
  else if(R.ph==='dash'){p.dash=Math.max(p.dash,0.02);
    for(const t of foesOf(p.team)){if(R.sl.has(t))continue;if(Math.hypot(t.x-p.x,t.y-p.y)<W_DR.w+(t.r||PR)){R.sl.add(t);addSlow(t,W_DR.slow,W_DR.slowT);emit({k:'efx',z:'wndrslow',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),id:t.id});}}
    if(R.t<=0){p.dash=0;p.dashSp=0;(G.wdft||(G.wdft=[])).push({o:p.id,team:p.team,x0:R.x0,y0:R.y0,x1:p.x,y1:p.y,a:R.a,h:p.z,t:W_DR.wait});p.wdr=null;
      emit({k:'efx',z:'wndrland',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(R.a*100)/100,id:p.id});}}}
function windDriftWind(g){const p=G.players[g.o];if(!p)return;
  // แนวทางพุ่ง = เส้นตรง x0→x1 กว้าง 100 (ใช้ wSeg กับเส้นสมมุติที่วางตามแนวพุ่ง)
  const w={x:(g.x0+g.x1)/2,y:(g.y0+g.y1)/2,a:Math.atan2(g.y1-g.y0,g.x1-g.x0)+Math.PI/2,L:Math.hypot(g.x1-g.x0,g.y1-g.y0)/2+20},ca=Math.cos(g.a),sa=Math.sin(g.a);
  for(const t of foesOf(g.team)){if(wSeg(w,t.x,t.y).d>W_DR.w+(t.r||PR)||Math.abs(cH(t)-g.h)>4)continue;
    aoeHit(p,t,W_DR.dmg,t=>{knock(t,t.x-ca*10,t.y-sa*10,W_DR.push);t.wpush=0.8;});}
  emit({k:'efx',z:'wndrwind',x:Math.round(g.x0),y:Math.round(g.y0),x2:Math.round(g.x1),y2:Math.round(g.y1),h:g.h,a:Math.round(g.a*100)/100});}

// ---------- Vortex Bind: ทอร์นาโด 3 อันโค้ง 45° ห่าง 200 → 0.6 วิ ดึงกลับมาหยุด 60 ลากศัตรูมาด้วย ----------
function windVortexTick(V,dt){V.t+=dt;const p=G.players[V.o];if(!p)return false;
  const k=V.t<W_VX.hold?0:Math.min(1,(V.t-W_VX.hold)/W_VX.pull),d=W_VX.far+(W_VX.near-W_VX.far)*k;
  V.c=V.as.map(a=>[V.x+Math.cos(a)*d,V.y+Math.sin(a)*d]);
  for(const t of foesOf(V.team)){
    if(!V.cap.has(t)){for(let i=0;i<3;i++){const c=V.c[i];if(Math.hypot(t.x-c[0],t.y-c[1])<W_VX.r+(t.r||PR)&&Math.abs(cH(t)-V.h)<4){V.cap.set(t,i);aoeHit(p,t,W_VX.dmg,null);emit({k:'efx',z:'wnvxcap',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});break;}}}
    const i=V.cap.get(t);if(i===undefined||(t.stun>0&&t.wwW))continue;
    {const c=V.c[i];t.vx=0;t.vy=0;if(k>0){t.x=c[0];t.y=c[1];t.wpush=0.3;}else{const dx=c[0]-t.x,dy=c[1]-t.y,dd=Math.hypot(dx,dy),st=Math.min(dd,900*dt);if(dd>0.5){t.x+=dx/dd*st;t.y+=dy/dd*st;}}}   // ถูกดูดเข้าแกนทอร์นาโดตอนค้าง แล้วติดแกนเป๊ะตอนดึง (มาพร้อมกัน ไม่ถึงก่อน/หลัง)
    if(k>0){const c=V.c[i];
      for(const w of G.wwl||[]){if(w.dead||w.team!==V.team||w.hitT[t.id])continue;if(wSeg(w,t.x,t.y).d<w.r+(t.r||PR)){w.hitT[t.id]=0.8;addStun(t,W_WL.stun);t.wwW=w.id;emit({k:'efx',z:'wnwhit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),a:Math.round(w.a*100)/100,n:w.id});}}}}
  if(k>=1)for(const [t] of V.cap)if(!(t.stun>0&&t.wwW)&&!t.dead&&t.alive!==false){addStun(t,W_VX.stun);emit({k:'efx',z:'wnvxstun',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});}   // ดึงมาถึงแล้วสตัน 0.5 วิ
  return k<1;}

// ---------- Void Spheres: หลุมดำลูกเดียว (ผู้ใช้ 2026-10-31, designs/wind.md) ----------
// แทงไม้ → สสารมืดพุ่ง 50 (ไม่โดนใคร) → สั่น 0.5 วิ → หลุมดำ 2.5 วิ ค่อยๆ เลื่อนไปข้างหน้า • ศัตรูในรัศมี 150 ถูกดูดมาติดขอบแกน ลอยหมุนติ้ว
// ควบคุมตัวไม่ได้ แต่โดนตีได้ • 1 ดาเมจทุก 0.5 วิ • ครบเวลา = ระเบิด 20 ผลักไปทางที่ยิง (ชนกำแพงลม = สตัน)
function windVoidCast(p){const a=p.ang,ca=Math.cos(a),sa=Math.sin(a),o={id:++G.zid,o:p.id,team:p.team,a,x:Math.max(20,Math.min(MW-20,p.x+ca*W_VO.dist)),y:Math.max(20,Math.min(MH-20,p.y+sa*W_VO.dist)),h:p.z,t:0,on:0,cg:new Map()};
  (G.wvh||(G.wvh=[])).push(o);emit({k:'efx',z:'wnvocast',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});}
function windVoidTick(o,dt){o.t+=dt;const p=G.players[o.o],ca=Math.cos(o.a),sa=Math.sin(o.a);if(o.t<W_VO.fly+W_VO.wait)return true;
  if(!o.on){o.on=1;emit({k:'efx',z:'wnvohole',x:Math.round(o.x),y:Math.round(o.y),h:o.h,a:Math.round(o.a*100)/100,n:o.id});}
  o.x=Math.max(20,Math.min(MW-20,o.x+ca*W_VO.drift*dt));o.y=Math.max(20,Math.min(MH-20,o.y+sa*W_VO.drift*dt));
  for(const t of foesOf(o.team)){if(o.cg.has(t)||t.dead||t.alive===false||t.downed)continue;if(Math.hypot(t.x-o.x,t.y-o.y)<=W_VO.r+(t.r||PR))o.cg.set(t,{k:0});}
  for(const [t,c] of o.cg){if(t.dead||t.alive===false||t.downed){o.cg.delete(t);continue;}
    const dx=t.x-o.x,dy=t.y-o.y,d=Math.hypot(dx,dy)||1,m=Math.min(W_VO.pull*dt,Math.max(0,d-W_VO.core));t.x-=dx/d*m;t.y-=dy/d*m;t.vx=0;t.vy=0;
    t.stun=Math.max(t.stun||0,0.2);t.ang=(t.ang||0)+W_VO.spin*dt;t.wflt=0.2;t.wfz=W_VO.lift;   // ลอยหมุนติ้ว (ท่าหันตาม ang)
    if((c.k+=dt)>=W_VO.tick){c.k-=W_VO.tick;if(p)aoeHit(p,t,W_VO.tdmg,null);}}
  if(o.t<W_VO.fly+W_VO.wait+W_VO.hold)return true;
  for(const [t] of o.cg){t.wflt=0;if(p)aoeHit(p,t,W_VO.dmg,t=>{knock(t,t.x-ca*10,t.y-sa*10,W_VO.push);t.wpush=1.2;});}
  emit({k:'efx',z:'wnvoboom',x:Math.round(o.x),y:Math.round(o.y),h:o.h,a:Math.round(o.a*100)/100,n:o.id,c:o.cg.size});return false;}
// ---------- รูปแบบการเล่นสายลม (ผู้ใช้ 2026-11-08): บนพื้น = อ่อนลงทันที • บิน (Featherwing Focus) = พริ้วต่อคอมโบกลางอากาศ ----------
// ทุกสกิลมี 2 โหมด: windAir(p) = กำลังบิน (ph:'focus') • นอกนั้น = บนพื้น • ระหว่างหมุนตัวขึ้น (spin) ใช้สกิลไม่ได้ • บินเร็ว (Shift, p.fly) ใช้สกิลไม่ได้
// สถานะที่สกิลใส่ให้เป้า: ลอยค้าง wflt/wfz (ผู้เล่น = windFloatZ, ศัตรู/ลูกสมุน = windTargetZ ยก t.h) • จมดิน wsk • กดลงแรง wsl → ตกถึงพื้น = ดาเมจ + ภาพกระแทก
const windAir=p=>!!(p.wfw&&p.wfw.ph==='focus'),windSpin=p=>!!(p.wfw&&p.wfw.ph==='spin');
function windAirborne(t){if(t.wflt>0)return true;if(t.isE||t.isM)return (t.h||0)>1.2;return (t.z||0)-groundH(t.x,t.y,t.z)>1.0;}
function windLift(t,dur,h){const d=dur*ccScale(t);addStun(t,dur);t.wflt=Math.max(t.wflt||0,d);t.wfz=h;t.wsk=0;t.wsl=0;t.wzd=1;t.vx*=0.3;t.vy*=0.3;}
function windSink(t,dur){const d=dur*ccScale(t);addStun(t,dur);t.wsk=Math.max(t.wsk||0,d);t.wflt=0;t.wsl=0;t.wzd=1;}
function windSlam(t,dur,src){addStun(t,dur);t.wflt=0;t.wsk=0;t.wsl=1.5;t.wslS=src;t.wzd=1;if(!(t.isE||t.isM))t.vz=-45;}
// ผู้เล่นจมดิน: ตัวจมลงพื้น ~0.9 ม. (หมดเวลา = ดีดขึ้นมาเอง) • ศัตรู/ลูกสมุน: ยก/จม/ตกด้วย t.h
function windSinkZ(p,dt){const gh=groundH(p.x,p.y,p.z);p.z+=(gh-0.9-p.z)*Math.min(1,12*dt);p.vz=0;}
function windTargetZ(t,dt){if(!(t.isE||t.isM)||(t.isE&&EDEF[t.type]&&EDEF[t.type].fly))return;const h=t.h||0;
  if(t.wsk>0)t.h=h+(-0.9-h)*Math.min(1,10*dt);
  else if(t.wflt>0)t.h=h+((t.wfz||2)-h)*Math.min(1,4*dt);
  else if(t.wzd){if(h<0)t.h=0;else{t.h=Math.max(0,h-(t.wsl>0?45:14)*dt);}if(t.h<=0)t.wzd=0;}}
function windSlotOf(p,id){const i=p.kitIds?p.kitIds.indexOf(id):-1;return i<0?null:SLOTK[i];}
function windCdCut(p,id,frac){const k=windSlotOf(p,id);if(k&&p.cd[k]>0)p.cd[k]=Math.max(0,p.cd[k]-(p.cdMax[k]||0)*frac);}
function windSlow(t,f,d){f=Math.max(f,isBig(t)?0.7:0.08);if(!(t.slowT>0)||f<t.slowF)t.slowF=f;t.slowT=Math.max(t.slowT||0,d);t.wbsT=Math.max(t.wbsT||0,d);}   // ช้าได้ถึง 90% (moveMul พื้น 0.08 ตอน wbsT>0)

// ---------- Featherwing: กด → หมุนตัวบินวนขึ้น → บิน 8 วิ (ผู้ใช้ 2026-11-08) ----------
// บินปกติ: WASD ทิศ (เร็วมาก แต่มีแรงเฉื่อย = เลี้ยวเป็นวง ไม่แคบเท่าไม้กวาด ไม่กว้างเท่าไม้กวาด) • Space สูงขึ้น • Ctrl/C ต่ำลง • คลิกซ้ายค้าง = ลูกบอลลม • สกิลอื่นใช้ได้ (โหมดบิน)
// Shift ค้าง = โหมดบินเร็ว: คุมด้วยเมาส์แบบเครื่องบิน (ระบบไม้กวาด js/69, BFW) ใช้สกิลไม่ได้ (ยิงลูกบอลลมได้) • ปล่อย Shift = กลับบินปกติ
// กดสกิลอีกครั้งตอนบินปกติ = สะบัดปีกไปข้างหน้า (ผลัก+ดาเมจ) จบโหมด แล้วตกลงแบบปกติ • หมดเวลา/โดนสตัน = จบโหมด ตกแบบปกติ
function windFlyTick(p,dt){const F=p.wfw;if(!p.alive){if(p.wfo){p.wfo=false;p.fly=false;p.flyOn=false;}p.wfw=null;return;}
  if(F.ph==='spin'){F.t+=dt;const u=Math.min(1,F.t/W_FW.spinT),a=F.a,ca=Math.cos(a),sa=Math.sin(a),rx=-sa*F.side,ry=ca*F.side,
      lat=W_FW.spinR*Math.sin(Math.PI*u),fwd=W_FW.spinR*0.55*Math.sin(2*Math.PI*u),e=u*u*(3-2*u);
    p.x=F.x0+rx*lat+ca*fwd;p.y=F.y0+ry*lat+sa*fwd;p.z=F.z0+W_FW.spinH*e;p.vz=0;p.vx=p.vy=0;p.mvx=p.mvy=0;collideWorld(p,PR,p.z);
    if(p.stun>0){p.wfw=null;emit({k:'efx',z:'wnfwend',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});return;}
    if(u>=1){F.ph='focus';F.t=W_FW.t;F.h=clamp(p.z-groundH(p.x,p.y,p.z),W_FW.hmin,W_FW.hmax);p.wfo=true;p.shieldOn=false;p.dash=0;p.wbCd=0;p.mvx=p.mvy=0;
      emit({k:'efx',z:'wnfwfocus',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});}
    return;}
  if(F.ph==='focus'){F.t-=dt;const inp=p.inp||{},want=!!inp.dh&&p.stun<=0&&!p.wult&&!p.wfc;   // Shift ค้าง = โหมดบินเร็ว
    if(want&&!p.fly)windFastOn(p);else if(!want&&p.fly&&p.wfo)windFastOff(p);
    if(F.t<=0||p.stun>0)windFocusEnd(p);}}
function windFastOn(p){const sp=Math.hypot(p.mvx||0,p.mvy||0),h=sp>20?Math.atan2(p.mvy,p.mvx):p.ang;
  p.fly=true;p.flyOn=true;p.fh=h;p.fs=sp;p.fyr=0;p.fcl=0;p.bab=p.bwm=false;p.lsd=null;p.lsc=0;p.shieldOn=false;p.dash=0;
  emit({k:'efx',z:'wnfast',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(h*100)/100,n:1,id:p.id});}
function windFastOff(p){const F=p.wfw;p.fly=false;p.flyOn=false;if(F)F.h=clamp(p.z-groundH(p.x,p.y,p.z),W_FW.hmin,W_FW.hmax);
  p.mvx=Math.cos(p.fh||0)*(p.fs||0);p.mvy=Math.sin(p.fh||0)*(p.fs||0);p.fs=0;p.wbCd=0;
  emit({k:'efx',z:'wnfast',x:Math.round(p.x),y:Math.round(p.y),h:p.z,n:0,id:p.id});}
function windFocusEnd(p){p.fly=false;p.wfo=false;p.flyOn=false;p.fs=0;p.wbCd=0;p.wfw=null;emit({k:'efx',z:'wnfwend',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}
// บินปกติ: ความเร็วมีแรงเฉื่อย — หมุนทิศวิ่งได้ช้ากว่าที่กด (เร็ว = วงกว้าง) เลี้ยวหักมากจะช้าลงนิด • ไม่กด = ค่อยๆ ชะลอ • เรียกจาก updatePlayer แทนการเดิน
function windAirMove(p,mx,my,spd,canAct,dt){const K=W_FW;let sp=Math.hypot(p.mvx||0,p.mvy||0),hd=sp>8?Math.atan2(p.mvy,p.mvx):p.ang;
  if(spd<1)sp*=Math.exp(-8*dt);   // ชาร์จอัลติ ฯลฯ = ลอยนิ่ง
  else if(mx||my){const want=Math.atan2(my,mx);
    if(sp<K.snapSp)hd=want;else{const om=K.omS+(K.omF-K.omS)*Math.min(1,sp/spd),d=angDiff(want,hd);hd=angDiff(hd+clamp(d,-om*dt,om*dt),0);}
    const tgt=spd*(1-K.turnSlow*Math.min(1,Math.abs(angDiff(want,hd))/Math.PI));sp+=(tgt-sp)*Math.min(1,K.acc*dt);}
  else sp*=Math.exp(-K.drag*dt);
  p.mvx=Math.cos(hd)*sp;p.mvy=Math.sin(hd)*sp;p.x+=p.mvx*dt;p.y+=p.mvy*dt;}
function windFlick(p){const F=p.wfw;if(!F||F.ph!=='focus'||p.fly)return;windFocusEnd(p);const a=p.ang;
  for(const t of foesOf(p.team)){const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);if(d>W_FW.range+(t.r||PR)||Math.abs(angDiff(Math.atan2(dy,dx),a))>(W_FW.cone*Math.PI/180))continue;
    const dz=cH(t)-p.z;if(dz>2||dz<-(W_FW.hgt+2))continue;   // เอียงลงพื้น: โดนคนที่อยู่ต่ำกว่าเราได้
    aoeHit(p,t,W_FW.dmg,t=>{knock(t,t.x-Math.cos(a)*10,t.y-Math.sin(a)*10,W_FW.push);t.wpush=0.8;});}
  emit({k:'efx',z:'wnfwflick',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});}
// บิน: คลิกซ้าย (กดค้างได้) = ลูกบอลลม — เรียกจาก windBasic / broomAct (โหมดบินเร็ว)
function windFocusAct(p,inp,dt){p.wbCd=Math.max(0,(p.wbCd||0)-dt);p.bbv=0;p.bbf=0;
  if(inp.fire&&p.wbCd<=0){p.wbCd=W_FW.fbCd;const a=p.ang;p.ang+=rnd(-W_FW.fbSpr,W_FW.fbSpr);Object.assign(PDEF.wball,{spd:W_FW.fbSpd,life:W_FW.fbRange/W_FW.fbSpd,dmg:W_FW.fbDmg});shoot(p,'wball',{sp:'b_wind',quiet:1});p.ang=a;}}

// ---------- Windup (เดิม Aegis Gale): ลมพัดขึ้น — วางวงลมตรงจุดเล็ง รอ 0.45 วิ แล้วศัตรูในวงลอยค้าง ----------
// ใช้ได้ 2 โหมด: พื้น = วงเล็ก ลอยสั้น • บิน = วงใหญ่ ลอยค้างนาน (ต่อคอมโบ) • ชาร์จ 2 อัน คืน 7 วิ/อัน
function windUpCast(p){if(windSpin(p)||(p.wwc|0)<=0)return false;
  const air=windAir(p),inp=p.inp||{},W=W_WL,R=air?W.placeA:W.placeG;let gx,gy;
  if(inp.gx>=0){gx=inp.gx;gy=inp.gy;}else if(typeof inp.ax==='number'&&(inp.ax||inp.ay)){gx=inp.ax;gy=inp.ay;}else{gx=p.x+Math.cos(p.ang)*R*0.6;gy=p.y+Math.sin(p.ang)*R*0.6;}
  const d=Math.hypot(gx-p.x,gy-p.y);if(d>R){gx=p.x+(gx-p.x)/d*R;gy=p.y+(gy-p.y)/d*R;}
  gx=clamp(gx,40,MW-40);gy=clamp(gy,40,MH-40);p.wwc--;
  const z={id:++G.zid,o:p.id,team:p.team,x:gx,y:gy,gh:groundH(gx,gy),air,t:0,act:air?W.actA:W.actG,r:air?W.rA:W.rG,hang:air?W.hangA:W.hangG,lift:air?W.liftA:W.liftG,dmg:air?W.dmgA:W.dmgG,cap:new Set()};
  (G.wup||(G.wup=[])).push(z);emit({k:'efx',z:'wnup',x:Math.round(gx),y:Math.round(gy),h:z.gh,r:Math.round(z.r),t:W.tele,m:air?1:0,id:p.id,n:z.id});}
function windUpTick(z,dt){const p=G.players[z.o];if(!p)return false;z.t+=dt;if(z.t<W_WL.tele)return true;
  if(!z.go){z.go=1;emit({k:'efx',z:'wnupgo',x:Math.round(z.x),y:Math.round(z.y),h:z.gh,r:Math.round(z.r),m:z.air?1:0,n:z.id});}
  for(const t of foesOf(z.team)){if(z.cap.has(t)||t.dead||t.alive===false||t.downed)continue;
    if(Math.hypot(t.x-z.x,t.y-z.y)>z.r+(t.r||PR))continue;const hh=cH(t)-z.gh;if(hh<-1.5||hh>10)continue;
    z.cap.add(t);aoeHit(p,t,z.dmg,t=>{windLift(t,z.hang,z.lift);emit({k:'efx',z:'wnuphit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),m:z.air?1:0});});}
  return z.t<W_WL.tele+z.act;}

// ---------- Wind Push (เดิม Windrift): ยิงลมแรงไปทางที่เล็ก ----------
// บิน: ลมพลังสูง — เป้าบนพื้น = ผลักหลังเล็กน้อย + ตัวจมดิน สตัน • เป้าลอยอยู่ = กดลงแรง สตัน
// พื้น: เป้าบนพื้น = ลมเปลี่ยนทิศพุ่งขึ้น ลอยสั้น ๆ • เป้าลอยอยู่ = กดลงด้วยความเร็วสูง สตันนาน
function windPushCast(p){if(windSpin(p))return false;const air=windAir(p),W=W_DR,SP=air?W.spdA:W.spdG;
  const q=shoot(p,'wpush',{sp:'b_wind',quiet:1,spd:SP,life:(air?W.rangeA:W.rangeG)/SP,r:air?W.rA:W.rG,dmg:air?W.dmgA:W.dmgG});q.air=air;
  emit({k:'efx',z:'wnpush',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(p.ang*100)/100,m:air?1:0,id:p.id});}
function windPushHit(pr,t){const o=G.players[pr.owner];if(!o)return;const W=W_DR,ab=windAirborne(t),a=Math.atan2(pr.vy,pr.vx),ca=Math.cos(a),sa=Math.sin(a);
  aoeHit(o,t,pr.dmg,t=>{
    if(ab){windSlam(t,W.slamT,o.id);emit({k:'efx',z:'wnpushslam',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});}
    else if(pr.air){knock(t,t.x-ca*10,t.y-sa*10,W.pushA);t.wpush=0.6;windSink(t,W.sinkT);emit({k:'efx',z:'wnpushsink',x:Math.round(t.x),y:Math.round(t.y),h:0});}
    else{windLift(t,W.launchT,W.launchH);emit({k:'efx',z:'wnpushup',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});}});}

// ---------- Windforce (เดิม Vortex Bind): พุ่งด้วยลม ----------
// บิน: พุ่งไปข้างหน้า (ตามเล็กขึ้น/ลงด้วย) แล้วหยุด — ศัตรูที่พุ่งผ่านถูกพาไปอยู่ด้านหน้า: คนลอยอยู่ = knockback ลอยตามมา • คนบนพื้น = ติดหน้าสไลด์ไปด้วยแล้วไหลต่อนิดเดียว
// พื้น: พุ่งสั้น ๆ ตามเมาส์ ไม่หยุดทันที ไหลต่อด้วย momentum • ผลักศัตรูในทางออกข้างเบา ๆ
function windForceCast(p){if(windSpin(p)||p.wfc||p.dash>0)return false;
  const air=windAir(p),W=W_VX,a=p.ang,inp=p.inp||{},D=air?W.distA:W.distG,T=air?W.tA:W.tG;let dv=0;
  if(air&&typeof inp.ah==='number'){const ad=Math.hypot((inp.ax||p.x)-p.x,(inp.ay||p.y)-p.y)/20,dh=inp.ah-(p.z+1.1),pit=clamp(Math.atan2(dh,Math.max(6,ad)),-0.7,0.7);dv=D/20*Math.tan(pit)/T;}
  p.wfc={t:T,a,air,dv,sp:D/T,cap:new Map()};p.dash=T;p.dashSp=D/T;p.dashX=Math.cos(a);p.dashY=Math.sin(a);p.shieldOn=false;
  emit({k:'efx',z:'wnfc',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,m:air?1:0,id:p.id});}
// พังบ้าน/กำแพง ณ จุดชน: ชิ้นบ้าน + ตึกเมือง + ลัง (damageEnv) และกำแพงเวทที่มี hp (ของศัตรู/กลาง)
function windSmash(p,x,y,h,rad,dmg){
  damageEnv(x,y,rad,dmg,p.id,'blast',h);
  for(const w of G.walls)if(!w.dead&&w.hp!==undefined&&w.team!==p.team&&Math.hypot(w.x-x,w.y-y)<rad+w.r&&w.hgt>(p.z||0))w.hp-=dmg;}
// มีบ้าน/กำแพงขวางข้างหน้า ≤ reach px ไหม → คืนจุดชน {x,y,h} หรือ null
function windAheadHit(p,ca,sa,reach){
  const h=p.z+1.1,c=bldRay(p.x,p.y,h,p.x+ca*reach,p.y+sa*reach,h);if(c)return c;
  for(const w of G.walls){if(w.dead||w.hp===undefined||w.team===p.team||w.hgt<=(p.z||0))continue;
    const dx=w.x-p.x,dy=w.y-p.y,u=dx*ca+dy*sa;if(u<0||u>reach+w.r)continue;
    if(Math.hypot(dx-ca*u,dy-sa*u)<w.r+PR)return {x:w.x,y:w.y,h:p.z+1};}
  return null;}
function windForceTick(p,dt){const R=p.wfc,W=W_VX,ca=Math.cos(R.a),sa=Math.sin(R.a);
  if(!p.alive||R.t<=0||p.stun>0){   // จบ: ปล่อยเป้าให้ไหลต่อ (ไม่ไกล) • บิน = หยุด • พื้น = ไหลต่อด้วย momentum • ชนบ้าน = หยุดสนิท
    if(!R.crash)for(const [t,m] of R.cap)if(m){const f=m===1?W.flowA:W.flowG;t.vx=(t.vx||0)+ca*f;t.vy=(t.vy||0)+sa*f;t.wpush=0.4;}
    p.dash=0;p.dashSp=0;p.wfc=null;
    if(R.air||R.crash){p.mvx=p.mvy=0;}else if(p.alive){p.slip=W.slipT;p.mvx=ca*R.sp*W.mom;p.mvy=sa*R.sp*W.mom;}
    emit({k:'efx',z:'wnfcend',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(R.a*100)/100,m:R.air?1:0,id:p.id});return;}
  R.t-=dt;p.dash=Math.max(p.dash,0.02);
  const lead=R.sp*dt;
  {const c=windAheadHit(p,ca,sa,lead+PR+14);   // ชนบ้าน/กำแพง: ทุบให้พัง + หยุดพุ่งทันที
   if(c){windSmash(p,c.x,c.y,c.h,W.smashR,W.smash);emit({k:'efx',z:'wnslam',x:Math.round(c.x),y:Math.round(c.y),h:c.h});R.crash=1;R.t=0;p.dash=0;p.dashSp=0;return;}}
  for(const t of foesOf(p.team)){if(t.dead||t.alive===false||t.downed)continue;
    if(!R.cap.has(t)){if(Math.hypot(t.x-p.x,t.y-p.y)>W.w+(t.r||PR)||Math.abs(cH(t)-(p.z+1.1))>W.hz)continue;
      const ab=windAirborne(t);
      if(!R.air){R.cap.set(t,0);aoeHit(p,t,W.dmgG,t=>{knock(t,p.x,p.y,W.sideG);t.wpush=0.4;});continue;}
      if(!aoeHit(p,t,W.dmgA,null)){R.cap.set(t,0);continue;}
      R.cap.set(t,ab?1:2);addStun(t,W.carry);emit({k:'efx',z:'wnfchit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),m:ab?1:0});}
    const m=R.cap.get(t);if(!m)continue;
    const gap=W.gap+(t.r||PR);t.x=p.x+ca*(gap+lead);t.y=p.y+sa*(gap+lead);collideWorld(t,t.r||PR,cH(t));t.vx=0;t.vy=0;t.wpush=0.3;t.stun=Math.max(t.stun||0,0.3);
    if(m===1){t.wflt=Math.max(t.wflt||0,0.3);t.wfz=clamp(p.z-groundH(t.x,t.y,t.z||0),1.5,14);t.wzd=1;}}}

// ---------- Windblade (เดิม Void Spheres): ใบมีดลมเล็ก ๆ รัว ๆ ----------
// บิน: ยิงเยอะ ถี่ ไปที่เล็ก ทะลุเป้า — โดน = ช้า 90% + ลดคูลดาวน์ Featherwing 20% (ครั้งเดียวต่อการร่าย) • พื้น: น้อยกว่า เบากว่า
function windBladeCast(p){if(windSpin(p)||p.wbl)return false;const air=windAir(p),B=W_VO;p.wbl={left:air?B.nA:B.nG,gap:B.gap,t:0,air,hit:0};}
function windBladeTick(p,dt){const R=p.wbl,B=W_VO;if(!p.alive||p.stun>0){p.wbl=null;return;}R.t-=dt;
  while(R.t<=0&&R.left>0){R.t+=R.gap;R.left--;const a=p.ang;p.ang+=rnd(-B.spr,B.spr);
    const q=shoot(p,'wbl',{sp:'b_wind',quiet:1,spd:B.spd,life:B.range/B.spd,r:B.br,dmg:R.air?B.dmgA:B.dmgG});q.vh+=rnd(-3,3);q.pierce=1;q.hs=new Set();q.air=R.air;q.bl=R;p.ang=a;}
  if(R.left<=0)p.wbl=null;}
function windBladeHit(pr,t){const o=G.players[pr.owner];if(!o)return;const B=W_VO;
  aoeHit(o,t,pr.dmg,t=>{windSlow(t,pr.air?B.slowA:B.slowG,pr.air?B.slowTA:B.slowTG);});
  if(pr.air&&pr.bl&&!pr.bl.hit){pr.bl.hit=1;windCdCut(o,'featherwing',B.cdCut);}}

// ---------- อัลติ Sonic Boom Strike (เดิม Eye of Heaven) ----------
// ชาร์จ 1 วิ (ลอยนิ่ง) → Impact frame ขาวดำ → พุ่งด้วยความเร็วสูงสุดตามที่เล็ก (บิน = ตามเล็กขึ้น/ลงได้) เสียง Sonic boom
// ทรงกระบอกนอน: แกนกลาง r1 = โดนชน ดาเมจแรงมาก knockback ไกลมาก • ทรงกระบอกนอก r2 = พุ่งผ่าน (ไม่โดนชน) knockback พอเปลี่ยนจุดยืน + ดาเมจตามหลัง 50
// บิน: จบแล้วต่อเวลา Featherwing +6 วิ และรีเซ็ตคูลดาวน์ทุกสกิล • พื้น: ดาเมจ −30% ระยะสั้น/แคบกว่า จบแล้วรีเซ็ต Featherwing อย่างเดียว
function windUltCast(p){if(p.wult||windSpin(p))return false;
  p.wult={ph:'chg',t:0,air:windAir(p),hit:new Set(),pass:new Map()};p.shieldOn=false;p.dash=0;p.wbl=null;
  emit({k:'efx',z:'wnsochg',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(p.ang*100)/100,m:p.wult.air?1:0,id:p.id});}
function windUltTick(p,dt){const U=p.wult,W=W_UL;
  if(!p.alive){p.wult=null;return;}
  if(U.ph==='chg'){U.t+=dt;
    if(p.stun>0){p.wult=null;p.ult=100;emit({k:'efx',z:'wnsocancel',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});return;}   // โดนสตันตอนชาร์จ = ยกเลิก คืนอัลติ
    if(U.t>=W.chg){const inp=p.inp||{},a=p.ang,D=U.air?W.dA:W.dG,T=U.air?W.tA:W.tG;let pit=0;
      if(U.air&&typeof inp.ah==='number'){const ad=Math.hypot((inp.ax||p.x)-p.x,(inp.ay||p.y)-p.y)/20;pit=clamp(Math.atan2(inp.ah-(p.z+1.1),Math.max(6,ad)),-0.8,0.8);}
      Object.assign(U,{ph:'dash',t:0,a,ca:Math.cos(a),sa:Math.sin(a),T,v:D/T,hv:D/T*Math.cos(pit),vv:D/T/20*Math.sin(pit),x0:p.x,y0:p.y,x1:p.x,y1:p.y,r1:U.air?W.r1A:W.r1G,r2:U.air?W.r2A:W.r2G,mul:U.air?1:W.gMul});
      emit({k:'efx',z:'wnsoimp',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});}
    return;}
  if(U.ph==='dash'){U.t+=dt;const de=Math.min(dt,U.T-U.t+dt),step=U.hv*de,n=Math.max(1,Math.ceil(step/50)),sx=step/n,sz=U.vv*de/n;
    for(let i=0;i<n;i++){const px=p.x,py=p.y,pz=p.z,ex=px+U.ca*sx,ey=py+U.sa*sx;
      windSmash(p,ex+U.ca*70,ey+U.sa*70,pz+1.1,W.smashR,W.smash*U.mul);   // พังบ้าน/กำแพงข้างหน้าก่อนชน → ทะลวงผ่านรูที่เปิด
      p.x=ex;p.y=ey;p.z=Math.max(groundH(ex,ey,p.z)+0.3,Math.min(24,p.z+sz));collideWorld(p,PR,p.z);
      const blocked=Math.hypot(p.x-ex,p.y-ey)>3;windUltSweep(p,U,px,py,pz+1.1,p.x,p.y,p.z+1.1);if(blocked){U.t=U.T;break;}}
    p.inv=Math.max(p.inv||0,0.1);p.vz=0;p.mvx=p.mvy=0;p.vx=p.vy=0;U.x1=p.x;U.y1=p.y;
    if(U.t>=U.T){U.ph='boom';U.t=0;emit({k:'efx',z:'wnsodash',x:Math.round(U.x0),y:Math.round(U.y0),x2:Math.round(p.x),y2:Math.round(p.y),h:p.z,a:Math.round(U.a*100)/100,m:U.air?1:0,id:p.id});}
    return;}
  if(U.ph==='boom'){U.t+=dt;if(U.t<W.boomT)return;   // เสียงบูมตามหลัง: คนที่พุ่งผ่านโดน knockback + ดาเมจ
    for(const [t,q] of U.pass){if(t.dead||t.alive===false||t.downed)continue;
      aoeHit(p,t,W.passDmg*U.mul,t=>{knock(t,q[0],q[1],W.passKnock*U.mul);t.wpush=0.8;emit({k:'efx',z:'wnsowave',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});});}
    if(U.air){const F=p.wfw;if(F&&F.ph==='focus')F.t+=W.ext;for(const k of SLOTK)p.cd[k]=0;p.wwc=W_WL.max;}
    else{const k=windSlotOf(p,'featherwing');if(k)p.cd[k]=0;}
    emit({k:'efx',z:'wnsoend',x:Math.round(p.x),y:Math.round(p.y),h:p.z,m:U.air?1:0,id:p.id});
    p.wult=null;}}
// กวาดทรงกระบอกตามเส้นพุ่ง (เฟรมนี้) — ระยะ 3 มิติจากเส้น: ≤r1 โดนชน (ครั้งเดียว) • ≤r2 พุ่งผ่าน (เก็บจุดใกล้สุดไว้ผลักตอนบูม)
function windUltSweep(p,U,x0,y0,h0,x1,y1,h1){const dx=x1-x0,dy=y1-y0,dh=(h1-h0)*20,L2=dx*dx+dy*dy+dh*dh||1,W=W_UL;
  for(const t of foesOf(p.team)){if(t.dead||t.alive===false||t.downed||U.hit.has(t))continue;
    const qx=t.x-x0,qy=t.y-y0,qh=(cH(t)-h0)*20,u=clamp((qx*dx+qy*dy+qh*dh)/L2,0,1),cx=x0+dx*u,cy=y0+dy*u,d=Math.hypot(t.x-cx,t.y-cy,(qh-dh*u)),rr=t.r||PR;
    if(d<=U.r1+rr){U.hit.add(t);U.pass.delete(t);
      aoeHit(p,t,W.hitDmg*U.mul,t=>{knock(t,t.x-U.ca*10,t.y-U.sa*10,W.hitKnock*U.mul);t.wpush=1.2;t.vz=Math.max(t.vz||0,3);addStun(t,W.hitStun);emit({k:'efx',z:'wnsohit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),a:Math.round(U.a*100)/100});});}
    else if(d<=U.r2+rr){const o=U.pass.get(t);if(!o||d<o[2])U.pass.set(t,[cx,cy,d]);}}}

// คนที่ลอยค้าง: ลอยขึ้นจากพื้นค้างไว้ (เรียกแทนแรงโน้มถ่วงใน updatePlayer)
function windFloatZ(p,dt){const gh=groundH(p.x,p.y,p.z);p.z+=(gh+(p.wfz||2.2)-p.z)*Math.min(1,4*dt);p.vz=0;}

// สำหรับ snapshot: [เกจ, ดูดลม, ชาร์จ Windup, (เลิกใช้), ชาร์จระเบิดปีก, บิน(1)/ร่อน, (เลิกใช้), 1=หมุนขึ้น 2=บิน, ด้านหมุน, 1=ชาร์จอัลติ 2=พุ่ง]
function windSnapP(p){if(!wOn(p))return undefined;return [Math.floor(p.wg||0),p.wchg?1:0,p.wwc|0,p.wwAim?1:0,p.wsb?1:0,p.wfw?(p.wfw.ph==='spin'||p.wfw.ph==='focus'?1:2):0,p.wdr?(p.wdr.ph==='chg'?1:2):0,p.wfw?(p.wfw.ph==='spin'?1:p.wfw.ph==='focus'?2:0):0,p.wfw&&p.wfw.ph==='spin'?p.wfw.side:0,p.wult?(p.wult.ph==='chg'?1:2):0];}
function windSnapW(){const o={};if(G.wwl&&G.wwl.length)o.WW=G.wwl.map(w=>[w.id,Math.round(w.x),Math.round(w.y),Math.round(w.a*100)/100,w.L,Math.round(w.t*10)/10,w.mv>0?1:0,w.team,w.owner]);
  if(G.wvh&&G.wvh.length)o.WO=G.wvh.filter(v=>v.on).map(v=>[v.id,Math.round(v.x),Math.round(v.y)]);return o;}

// ---------- สกิล (ผู้ใช้ 2026-11-08: รีดีไซน์ทั้งชุด — id เดิมไว้ให้ชุดสกิล/tune/ไอคอนไม่พัง เปลี่ยนแค่ชื่อกับพฤติกรรม) ----------
// ค่าที่ขึ้นต้น "(เลิกใช้)" = ของเดิม (กำแพง/Windrift/Vortex/Void/Eye) โค้ดเก่ายังอยู่แต่ไม่ถูกเรียกแล้ว
const W_WL=defSpell(WINDP,{id:'aegisgale',v:{charge:7,max:2,tele:0.45,rG:90,rA:140,actG:0.35,actA:1.0,hangG:1.0,hangA:1.8,liftG:2.0,liftA:3.5,dmgG:3,dmgA:6,placeG:450,placeA:650,
    L:125,r:14,life:12,hp:100,push:400,spd:900,place:500,stun:0.5,pdmg:10,pstun:0.5,boom:70,bdmg:50,bpush:2400,brad:110,aim:4},
  vn:{charge:'ชาร์จคืน 1 อัน (วิ)',max:'ชาร์จสูงสุด (อัน)',tele:'วงลม • รอก่อนพัดขึ้น (วิ)',rG:'พื้น • รัศมีวง',rA:'บิน • รัศมีวง',actG:'พื้น • วงพัดอยู่ (วิ)',actA:'บิน • วงพัดอยู่ (วิ)',hangG:'พื้น • เป้าลอยค้าง (วิ)',hangA:'บิน • เป้าลอยค้าง (วิ)',liftG:'พื้น • ลอยสูง (ม.)',liftA:'บิน • ลอยสูง (ม.)',dmgG:'พื้น • ดาเมจ',dmgA:'บิน • ดาเมจ',placeG:'พื้น • วางไกลสุด',placeA:'บิน • วางไกลสุด',
    L:'(เลิกใช้) กำแพง ครึ่งกว้าง',r:'(เลิกใช้) กำแพง หนา',life:'(เลิกใช้) กำแพง อยู่',hp:'(เลิกใช้) กำแพง HP',push:'(เลิกใช้) ดัน ระยะ',spd:'(เลิกใช้) ดัน เร็ว',place:'(เลิกใช้) วาง ไกลสุด',stun:'(เลิกใช้) ชนสตัน',pdmg:'(เลิกใช้) ทะลุดาเมจ',pstun:'(เลิกใช้) ทะลุสตัน',boom:'(เลิกใช้) แตกเมื่อตี',bdmg:'(เลิกใช้) ระเบิดดาเมจ',bpush:'(เลิกใช้) ระเบิดผลัก',brad:'(เลิกใช้) ระเบิดรัศมี',aim:'(เลิกใช้) เวลาเลือก'},
  role:'control',n:'Windup',ic:'🌬️',cd:0.4,d:'ลมพัดขึ้น (ชาร์จ 2 อัน คืน 7 วิ/อัน) — วางวงลมตรงจุดเล็ง รอ 0.45 วิ แล้วศัตรูในวงถูกพัดลอยขึ้นค้างกลางอากาศ ทำอะไรไม่ได้ • โหมดพื้น: วงเล็ก ลอยสั้น ~1 วิ • โหมดบิน: วงใหญ่ขึ้น ลอยค้างนาน ~1.8 วิ ต่อคอมโบ (Wind Push กดลง / Windforce พาไป / Windblade ซ้ำ)',
  cast(p){return windUpCast(p);}}).v;
const W_DR=defSpell(WINDP,{id:'windrift',v:{spdA:3400,rangeA:1100,rA:26,dmgA:18,pushA:500,sinkT:1.5,spdG:2600,rangeG:700,rG:18,dmgG:6,launchT:1.0,launchH:3.2,slamT:2.2,slamDmg:12,
    chg:0.2,dist:400,t:0.09,wait:0.6,w:50,push:2400,dmg:10,slow:0.5,slowT:1.2},
  vn:{spdA:'บิน • ความเร็วลม',rangeA:'บิน • ระยะ',rA:'บิน • ขนาดลม',dmgA:'บิน • ดาเมจ',pushA:'บิน • ผลักหลัง (เป้าบนพื้น)',sinkT:'บิน • จมดิน สตัน (วิ)',spdG:'พื้น • ความเร็วลม',rangeG:'พื้น • ระยะ',rG:'พื้น • ขนาดลม',dmgG:'พื้น • ดาเมจ',launchT:'พื้น • เป้าลอยสั้น (วิ)',launchH:'พื้น • ลอยสูง (ม.)',slamT:'เป้าลอยโดนกดลง • สตัน (วิ)',slamDmg:'กดลงถึงพื้น • ดาเมจ',
    chg:'(เลิกใช้) ชาร์จ',dist:'(เลิกใช้) พุ่ง',t:'(เลิกใช้) พุ่งเวลา',wait:'(เลิกใช้) ลมตามมา',w:'(เลิกใช้) ลมกว้าง',push:'(เลิกใช้) ผลัก',dmg:'(เลิกใช้) ดาเมจ',slow:'(เลิกใช้) ช้า',slowT:'(เลิกใช้) ช้านาน'},
  role:'utility',n:'Wind Push',ic:'💨',cd:10,d:'ยิงลมแรงไปทางที่เล็ก • โหมดบิน: ลมพลังสูง ถ้าโดนศัตรูบนพื้น = ผลักหลังเล็กน้อย ตัวจมลงดิน สตัน 1.5 วิ • ถ้าโดนศัตรูที่ลอยอยู่ = กดลงด้วยความเร็วสูง สตัน 2.2 วิ • โหมดพื้น: ลมเบากว่า ถ้าโดนศัตรูบนพื้น = พัดขึ้น ลอยสั้น ๆ 1 วิ • ถ้าโดนศัตรูที่ลอยอยู่ = กดลงแรง สตัน 2.2 วิ',
  cast(p){return windPushCast(p);}}).v;
const W_VX=defSpell(WINDP,{id:'vortexbind',v:{distA:520,tA:0.26,distG:300,tG:0.2,w:110,hz:8,gap:60,dmgA:10,dmgG:3,carry:0.5,flowA:700,flowG:350,sideG:300,mom:0.2,slipT:0.9,smash:120,smashR:90,
    far:380,near:60,arc:22.5,hold:0.8,pull:0.4,r:60,dmg:20,stun:0.75},
  vn:{distA:'บิน • ระยะพุ่ง',tA:'บิน • เวลาพุ่ง (วิ)',distG:'พื้น • ระยะพุ่ง',tG:'พื้น • เวลาพุ่ง (วิ)',w:'ความกว้างจับเป้า (รัศมี)',hz:'จับเป้า • ต่างความสูงได้ (ม.)',gap:'เป้าติดหน้าเรา • ห่าง',dmgA:'บิน • ดาเมจ',dmgG:'พื้น • ดาเมจ',carry:'บิน • เป้าถูกพา (สตัน วิ)',flowA:'บิน • เป้าลอยไหลต่อ (แรง)',flowG:'บิน • เป้าบนพื้นไหลต่อ (แรง)',sideG:'พื้น • ผลักเป้าออกข้าง',mom:'พื้น • momentum หลังพุ่ง (สัดส่วน)',slipT:'พื้น • ไหลต่อ (วิ)',
    smash:'ชนบ้าน/กำแพง • ดาเมจพัง',smashR:'ชนบ้าน/กำแพง • รัศมีพัง',far:'(เลิกใช้) ทอร์นาโด',near:'(เลิกใช้) ดึง',arc:'(เลิกใช้) มุม',hold:'(เลิกใช้) ค้าง',pull:'(เลิกใช้) ดึงเวลา',r:'(เลิกใช้) รัศมีจับ',dmg:'(เลิกใช้) ดาเมจ',stun:'(เลิกใช้) สตัน'},
  role:'control',n:'Windforce',ic:'🌀',cd:12,d:'พุ่งด้วยแรงลม • โหมดบิน: พุ่งไปข้างหน้าตามที่เล็ก (ขึ้น/ลงได้) แล้วหยุด — ศัตรูที่พุ่งผ่านถูกพามาอยู่ด้านหน้า: คนที่ลอยอยู่ = knockback ลอยตามมา • คนบนพื้น = ติดหน้าเราสไลด์ไปด้วยแล้วไหลต่ออีกนิด • โหมดพื้น: พุ่งสั้น ๆ ตามเมาส์ ไม่หยุดทันที ไหลต่อด้วย momentum ผลักศัตรูในทางออกข้างเบา ๆ • ชนบ้าน/กำแพง = ทุบให้พังแล้วหยุดทันที',
  cast(p){return windForceCast(p);}}).v;
const W_VO=defSpell(WINDP,{id:'voidspheres',v:{nA:14,nG:5,gap:0.04,spr:0.07,spd:2400,range:1200,br:10,dmgA:2.5,dmgG:1.5,slowA:0.1,slowG:0.4,slowTA:2.0,slowTG:1.2,cdCut:0.2,
    fly:1.0,dist:400,wait:0,hold:2.5,drift:40,r:110,core:28,pull:500,tick:0.5,tdmg:1,dmg:20,push:2400,spin:14,lift:0.6},
  vn:{nA:'บิน • จำนวนใบมีด',nG:'พื้น • จำนวนใบมีด',gap:'ยิงห่างกัน (วิ)',spr:'ส่ายกระสุน (rad)',spd:'ความเร็วใบมีด',range:'ระยะ',br:'ขนาดใบมีด',dmgA:'บิน • ดาเมจ/ใบ',dmgG:'พื้น • ดาเมจ/ใบ',slowA:'บิน • ความเร็วเป้าเหลือ (เท่า 0.1 = ช้า 90%)',slowG:'พื้น • ความเร็วเป้าเหลือ (เท่า)',slowTA:'บิน • ช้านาน (วิ)',slowTG:'พื้น • ช้านาน (วิ)',cdCut:'บิน • โดนแล้วลดคูลดาวน์ Featherwing (สัดส่วน)',
    fly:'(เลิกใช้) คลื่น',dist:'(เลิกใช้) ระยะ',wait:'(เลิกใช้) รอ',hold:'(เลิกใช้) หลุมดำอยู่',drift:'(เลิกใช้) เลื่อน',r:'(เลิกใช้) รัศมีดูด',core:'(เลิกใช้) ติดแกน',pull:'(เลิกใช้) แรงดูด',tick:'(เลิกใช้) ดาเมจย่อยทุก',tdmg:'(เลิกใช้) ดาเมจย่อย',dmg:'(เลิกใช้) ระเบิด',push:'(เลิกใช้) ผลัก',spin:'(เลิกใช้) หมุน',lift:'(เลิกใช้) ลอย'},
  role:'control',n:'Windblade',ic:'⚫',cd:8,d:'ยิงใบมีดลมเล็ก ๆ รัว ๆ ไปที่เล็ก ทะลุเป้า • โหมดบิน: ยิง 14 ใบ โดนแล้วเป้าช้าลง 90% นาน 2 วิ และลดคูลดาวน์ Featherwing 20% (ครั้งเดียวต่อการยิง) • โหมดพื้น: ยิงน้อยกว่า (5 ใบ) เบากว่า ช้าลง 60%',
  cast(p){return windBladeCast(p);}}).v;
const W_FW=defSpell(WINDP,{id:'featherwing',v:{t:8,spinT:1.2,spinR:64,spinH:3.5,spd:2.2,omS:6.0,omF:2.6,acc:2.4,drag:1.2,snapSp:60,turnSlow:0.4,fastSpd:1000,hmin:1,hmax:12,vs:5,hgt:6,range:250,cone:50.4,push:1800,dmg:15,glide:2.2,fbCd:0.1,fbSpd:2600,fbRange:1100,fbDmg:3,fbPush:200,fbSpr:0.025,fs0:240,boost:1.6},
  vn:{t:'บินนาน (วิ)',spinT:'หมุนตัวบินวนขึ้น (วิ)',spinR:'หมุนวน • กว้างข้าง',spinH:'หมุนวน • ลอยขึ้น (ม.)',spd:'บินปกติ • ความเร็ว (เท่าเดิน)',omS:'บินปกติ • หมุนทิศ (rad/วิ) ตอนช้า',omF:'บินปกติ • หมุนทิศ (rad/วิ) ตอนเร็วสุด (ยิ่งน้อย = วงกว้าง)',acc:'บินปกติ • เร่ง',drag:'บินปกติ • ชะลอตอนปล่อยปุ่ม',snapSp:'บินปกติ • ต่ำกว่านี้เลี้ยวทันที',turnSlow:'บินปกติ • เลี้ยวหักแล้วช้าลง (สัดส่วน)',fastSpd:'Shift บินเร็ว • ความเร็วสูงสุด (px/วิ)',hmin:'Ctrl • ต่ำสุดเหนือพื้น (ม.)',hmax:'Space • สูงสุดเหนือพื้น (ม.)',vs:'Space/Ctrl • ขึ้น-ลง (ม./วิ)',hgt:'สะบัดจบ • ลงถึงพื้นได้ลึก (ม.)',range:'สะบัดจบ • ระยะ',cone:'สะบัดจบ • มุม (องศา ครึ่งซ้าย/ขวา)',push:'สะบัดจบ • แรงผลัก',dmg:'สะบัดจบ • ดาเมจ',glide:'(เลิกใช้) ร่อนลง',
    fbCd:'ลูกบอลลม • เว้น (วิ)',fbSpd:'ลูกบอลลม • ความเร็ว',fbRange:'ลูกบอลลม • ระยะ',fbDmg:'ลูกบอลลม • ดาเมจ',fbPush:'ลูกบอลลม • แรงผลัก (เบา)',fbSpr:'ลูกบอลลม • ส่ายกระสุน (rad)',fs0:'(เลิกใช้)',boost:'(เลิกใช้)'},
  role:'utility',n:'Featherwing',ic:'🪽',cd:22,d:'กด → หมุนตัวมีปีกบินวนขึ้น (กด A/D ตอนใช้ = เลือกข้าง) แล้วบิน 8 วิ — เร็วมาก มีแรงเฉื่อย เลี้ยวเป็นวง (ไม่กว้างเท่าไม้กวาด) • WASD = ทิศ • Space = สูงขึ้น • Ctrl/C = ต่ำลง • ใช้สกิลได้ครบ (โหมดบิน = สกิลแรงขึ้น พริ้วต่อคอมโบ) • คลิกซ้ายค้าง = ลูกบอลลม • Shift ค้าง = บินเร็วมาก คุมด้วยเมาส์แบบเครื่องบิน ใช้สกิลไม่ได้ (ปล่อย = กลับบินปกติ) • กดสกิลอีกครั้ง (บินปกติ) = สะบัดปีกข้างหน้า 250 15 ดาเมจ จบโหมด • หมดเวลา = ตกลงแบบปกติ',
  toggle(p){if(p.wfw&&p.wfw.ph==='focus'&&!p.fly){windFlick(p);return true;}return false;},
  cast(p){if(p.wfw)return false;const inp=p.inp||{},side=inp.l&&!inp.r?-1:1;p.wfw={ph:'spin',t:0,side,x0:p.x,y0:p.y,z0:p.z,a:p.ang};p.shieldOn=false;p.dash=0;p.wsb=null;p.wgs&&windStreamEnd(p,null);
    emit({k:'efx',z:'wnfw',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(p.ang*100)/100,n:side,id:p.id});}}).v;
Object.assign(PDEF,{wball:{spd:W_FW.fbSpd,r:10,dmg:W_FW.fbDmg,life:W_FW.fbRange/W_FW.fbSpd,col:'#8dff65'},
  wpush:{spd:W_DR.spdA,r:22,dmg:30,life:W_DR.rangeA/W_DR.spdA,col:'#8dff65'},wbl:{spd:W_VO.spd,r:W_VO.br,dmg:6,life:W_VO.range/W_VO.spd,col:'#b8ff85'}});
const W_UL=defSpell(WINDP,{id:'eyeofheaven',v:{chg:1.0,dA:2400,tA:0.30,dG:1400,tG:0.22,r1A:70,r2A:210,r1G:42,r2G:125,hitDmg:100,hitKnock:4200,hitStun:0.8,passDmg:50,passKnock:1100,boomT:0.2,gMul:0.7,ext:6,smash:160,smashR:100},
  vn:{chg:'ชาร์จ (วิ)',dA:'บิน • ระยะพุ่ง',tA:'บิน • เวลาพุ่ง (วิ)',dG:'พื้น • ระยะพุ่ง',tG:'พื้น • เวลาพุ่ง (วิ)',r1A:'บิน • แกนกลางโดนชน (รัศมี)',r2A:'บิน • ทรงกระบอกนอก พุ่งผ่าน (รัศมี)',r1G:'พื้น • แกนกลางโดนชน',r2G:'พื้น • ทรงกระบอกนอก',hitDmg:'โดนชน • ดาเมจ',hitKnock:'โดนชน • knockback ไกลมาก',hitStun:'โดนชน • สตัน (วิ)',passDmg:'พุ่งผ่าน • ดาเมจตามหลัง',passKnock:'พุ่งผ่าน • knockback',boomT:'เสียงบูมตามหลัง (วิ)',gMul:'พื้น • คูณดาเมจ (0.7 = −30%)',ext:'บิน • ต่อเวลา Featherwing (วิ)',smash:'พังบ้าน/กำแพงตามทางพุ่ง • ดาเมจ',smashR:'พังบ้าน/กำแพง • รัศมี'},
  role:'ult',ult:true,n:'Sonic Boom Strike',ic:'👁️',cd:0,d:'ชาร์จ 1 วิ → Impact frame ขาวดำ → พุ่งด้วยความเร็วสูงมากตามที่เล็ก เสียง Sonic boom • ศัตรูที่ถูกชนตรง ๆ = ดาเมจแรงมาก knockback ไกลมาก • ศัตรูที่อยู่ในทางพุ่งแต่ไม่โดนชน = knockback พอเปลี่ยนจุดยืน + ดาเมจตามหลัง 50 • โหมดบิน: จบแล้วต่อเวลา Featherwing +6 วิ และรีเซ็ตคูลดาวน์ทุกสกิล • โหมดพื้น: ดาเมจ −30% ระยะสั้นและแคบกว่า จบแล้วรีเซ็ต Featherwing อย่างเดียว • พุ่งทะลวงบ้าน/กำแพงตามทางให้พังหมด',
  cast(p){return windUltCast(p);}}).v;

// ท่าพื้นฐาน + โล่ + Dash ของสาย (PBASIC ต้องอยู่ช่องเดียวกับลำดับใน PATHS)
PBASIC.push({id:'b_wind',type:'wblade',n:'ใบมีดลม / GaleBurst',d:'คลิก = ใบมีดลม (ลมพัดไป) 5 ดาเมจ ทุก 0.3 วิ ระยะ 600 ความเร็ว 1100 โดนแล้วเกจ GaleBurst +12% • กดค้าง (เกจยังไม่เต็ม) = ดูดลมรอบตัว +8%/วิ • เกจเต็ม = กดโจมตีปกติค้าง 0.3 วิ แล้วยิงลมกรวยกว้างต่อเนื่อง 17 ม. นาน 2.6 วิ (ปล่อยปุ่ม = หยุด เกจที่เหลือเก็บไว้) 5 ดาเมจ/0.25 วิ ผลักศัตรูเบา ๆ ตัวเราเดินช้าลง',
  shd:'โล่ปีกห่อตัว: กันรอบตัว 360° รับได้ 75 • โดนตีแต่ละครั้ง +10% เกจ • เกจเต็มระหว่างยกโล่ + คลิกซ้าย = ชาร์จปีกแล้วระเบิดรอบตัว รัศมี 200 ผลัก 250 สตัน 0.8 วิ 20 ดาเมจ',
  dsd:'Dash ถอยหลังผลัก (Shift): ผลักศัตรูข้างหน้า 250 ตัวเราดีดถอยหลัง 300 ลอยกลางอากาศ (ใช้สกิลกลางอากาศได้) • ศัตรูที่โดนผลักชนกำแพง = 20 ดาเมจ + สตัน • คูลดาวน์ 8 วิ',
  get shMul(){return 100/WNV.shHp;},shieldSwing:true,
  hit(pr,t){if(pr.type==='wpush'){windPushHit(pr,t);return;}if(pr.type==='wbl'){windBladeHit(pr,t);return;}damage(t,pr.dmg,pr.owner,'proj');if(pr.type==='wball'){knock(t,t.x-pr.vx,t.y-pr.vy,W_FW.fbPush);t.wpush=0.3;return;}const o=G.players[pr.owner];if(o)wGain(o,WNV.baGain);},   // ลูกบอลลม (Focus): ผลักเบา ๆ ไม่เพิ่มเกจ
  onBlock(p){wGain(p,WNV.shGain);},
  tick:windBasic,dash:windDash});
SPELLS.b_wind=PBASIC[WINDP];
