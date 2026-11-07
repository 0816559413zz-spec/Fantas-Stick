// =====================================================================
//  สายลม 🌪️ (ผู้ใช้ออกแบบทั้งหมด — designs/wind.md "คอนเซ็ปต์ใหม่") • ฝั่งโฮสต์ • ขั้นที่ 1 (2026-10-28)
//  "ผู้ผลัก" เล่นกับกำแพงลม: ผลักศัตรูชนกำแพงลม = สตัน 0.5 วิ • ตีศัตรูที่ติดกำแพงครบ 70 = กำแพงแตกระเบิด 50 + กระเด็นไกล
//  เกจ GaleBurst p.wg 0-100: BA โดน +12 • กดค้างคลิกซ้ายดูดลม +8/วิ • โล่โดนตี +10 • เต็ม = กดโจมตีปกติค้างเพื่อยิงลมกรวยต่อเนื่อง
//  กำแพงลม G.wwl: {x,y ศูนย์กลาง, a ทิศหน้ากำแพง, L ครึ่งความกว้าง, mv ระยะดันที่เหลือ, acc ดาเมจสะสม}
//  ขั้นที่ 2: Windrift / Vortex Bind / Void Spheres / Featherwing • ขั้นที่ 3: อัลติ Eye of Heaven (2026-10-28)
// =====================================================================
const WINDP=PATHS.length;
// ตัวเลขทั้งหมดของสายลม: WNV = PATHS[WINDP].v (ใบมีดลม/GaleBurst/โล่ปีก/Dash) + v:{...} ของแต่ละสกิล (W_WL W_DR W_VX W_VO W_FW W_UL = S.v) — ปรับได้ใน tune.html / F8 (js/73-tune.js)
PATHS.push({id:'wind',n:'สายลม',ic:'🌪️',col:'#8dff65',d:'ผู้ผลัก — สร้างกำแพงลม ผลักศัตรูไปชนให้สตัน ตีต่อจนกำแพงแตกระเบิด คุมตำแหน่งศัตรูแล้วคิดตาต่อไป',
  combo:'BA ใบมีดลมเก็บเกจ GaleBurst → เต็มแล้วกดค้างยิงลมต่อเนื่องผลักเบา ๆ • ผลักศัตรูชนกำแพงลม = สตัน 0.5 วิ • ตีศัตรูที่ติดกำแพงครบ 70 = กำแพงแตก ระเบิด 50 กระเด็นไกล • Dash ดีดถอยหลังผลักศัตรูชนกำแพง 20 • ใช้สกิลกลางอากาศได้'});
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
  if(p.wfw)windFlyTick(p,dt);
  if(p.wult)windUltTick(p,dt);
}
// ความเร็วเดินพิเศษ: ชาร์จ Windrift ยืนนิ่ง • Featherwing: หมุนตัวขึ้น = นิ่ง (สคริปต์คุมตำแหน่ง) / Focus = ×spd ของความเร็วบิน
function windSpd(p){return p.wgs?WNV.gbSlow:p.wult?0:p.wdr&&p.wdr.ph==='chg'?0:p.wfw?(p.wfw.ph==='spin'?0:p.wfw.ph==='focus'?W_FW.spd*(p.wfw.b?W_FW.boost:1):1):1;}
// ความสูงตอนบิน (แทนแรงโน้มถ่วง) — เรียกจาก updatePlayer
function windFlyZ(p,dt){const F=p.wfw,gh=groundH(p.x,p.y,p.z);
  if(F.ph==='spin'){p.vz=0;}   // spin: windFlyTick ตั้งความสูงเอง
  else if(F.ph==='focus'){const inp=p.inp||{};   // Focus (ผู้ใช้ 2026-11-07 ไม่ใช้ระบบไม้กวาด): Space สูงขึ้น • Ctrl/C ต่ำลง — F.h = ความสูงเหนือพื้นที่อยากได้
    F.h=clamp(F.h+((inp.jh?1:0)-(inp.ch?1:0))*W_FW.vs*dt,W_FW.hmin,W_FW.hmax);
    p.vz=clamp((gh+F.h-p.z)*5,-W_FW.vs,W_FW.vs);p.z+=p.vz*dt;}
  else{p.vz=Math.max(-W_FW.glide,Math.min(p.vz||0,0)-6*dt);p.z+=p.vz*dt;if(p.z<=gh){p.z=gh;p.vz=0;p.wfw=null;emit({k:'efx',z:'wnfwland',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}}}
function windReset(p){p.wult=null;p.wflt=0;p.wus=0;p.wdr=null;p.wfw=null;p.wg=0;p.wwc=W_WL.max;p.wwr=0;p.wwAim=null;p.wsb=null;p.wsbL=0;p.wchg=0;p.wfHeld=0;if(p.wgs)windStreamEnd(p,null);p.wgw=0;if(p.wfo){p.wfo=false;p.fly=false;p.flyOn=false;}p.wbCd=0;}

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
    if(t.wwW&&!(t.stun>0))t.wwW=0;}
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
// ---------- Featherwing: บิน 5 วิ → กดอีกครั้งสะบัดปีกไปข้างหน้า (เอียงลงพื้น) → ร่อนลง ----------
// ---------- Featherwing (ผู้ใช้ 2026-11-07, ท่าไฮไลต์): กด → หมุนตัวมีปีกบินวนขึ้นไปด้านซ้าย/ขวา (A/D ที่กดตอนใช้ • ไม่กด = ขวา) แล้วกลับมากลางตัว
// → เข้าโหมด Focus: บินแบบเดินในอากาศ ไม่ใช่ไม้กวาด (ผู้ใช้ 2026-11-07) — WASD = ทิศ • Shift ค้าง = เอนตัวไปหน้าบินไวขึ้น • Space = สูงขึ้น • Ctrl/C = ต่ำลง • ใช้สกิลอื่นได้ตามปกติ • คลิกซ้ายกดค้าง = ลูกบอลลมยิงรัว ไกล เร็ว แรง ผลักเบา
// กดสกิลอีกครั้งตอน Focus = สะบัดปีกไปข้างหน้า (ผลัก+ดาเมจ) จบโหมด แล้วร่อนลง • หมดเวลา/โดนสตัน = จบโหมดร่อนลง
function windFlyTick(p,dt){const F=p.wfw;if(!p.alive){if(p.wfo){p.wfo=false;p.fly=false;p.flyOn=false;}p.wfw=null;return;}
  if(F.ph==='spin'){F.t+=dt;const u=Math.min(1,F.t/W_FW.spinT),a=F.a,ca=Math.cos(a),sa=Math.sin(a),rx=-sa*F.side,ry=ca*F.side,
      lat=W_FW.spinR*Math.sin(Math.PI*u),fwd=W_FW.spinR*0.55*Math.sin(2*Math.PI*u),e=u*u*(3-2*u);
    p.x=F.x0+rx*lat+ca*fwd;p.y=F.y0+ry*lat+sa*fwd;p.z=F.z0+W_FW.spinH*e;p.vz=0;p.vx=p.vy=0;p.mvx=p.mvy=0;collideWorld(p,PR,p.z);
    if(p.stun>0){F.ph='glide';emit({k:'efx',z:'wnfwend',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});return;}
    if(u>=1){F.ph='focus';F.t=W_FW.t;F.h=clamp(p.z-groundH(p.x,p.y,p.z),W_FW.hmin,W_FW.hmax);F.b=false;p.wfo=true;p.shieldOn=false;p.dash=0;p.wbCd=0;
      emit({k:'efx',z:'wnfwfocus',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});}
    return;}
  if(F.ph==='focus'){F.t-=dt;F.b=!!(p.inp&&p.inp.dh)&&p.stun<=0;   // Shift ค้าง = เอนตัวไปหน้า บินไวขึ้น
    if(F.t<=0||p.stun>0)windFocusEnd(p);}}
function windFocusEnd(p){const F=p.wfw;p.fly=false;p.wfo=false;p.flyOn=false;p.fs=0;p.wbCd=0;if(F)F.ph='glide';emit({k:'efx',z:'wnfwend',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}
function windFlick(p){const F=p.wfw;if(!F||F.ph!=='focus')return;windFocusEnd(p);const a=p.ang;
  for(const t of foesOf(p.team)){const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);if(d>W_FW.range+(t.r||PR)||Math.abs(angDiff(Math.atan2(dy,dx),a))>(W_FW.cone*Math.PI/180))continue;
    const dz=cH(t)-p.z;if(dz>2||dz<-(W_FW.hgt+2))continue;   // เอียงลงพื้น: โดนคนที่อยู่ต่ำกว่าเราได้
    aoeHit(p,t,W_FW.dmg,t=>{knock(t,t.x-Math.cos(a)*10,t.y-Math.sin(a)*10,W_FW.push);t.wpush=0.8;});}
  emit({k:'efx',z:'wnfwflick',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});}
// Focus: คลิกซ้าย (กดค้างได้) = ลูกบอลลม — เรียกจาก windBasic
function windFocusAct(p,inp,dt){p.wbCd=Math.max(0,(p.wbCd||0)-dt);p.bbv=0;p.bbf=0;
  if(inp.fire&&p.wbCd<=0){p.wbCd=W_FW.fbCd;const a=p.ang;p.ang+=rnd(-W_FW.fbSpr,W_FW.fbSpr);Object.assign(PDEF.wball,{spd:W_FW.fbSpd,life:W_FW.fbRange/W_FW.fbSpd,dmg:W_FW.fbDmg});shoot(p,'wball',{sp:'b_wind',quiet:1});p.ang=a;}}

// ---------- อัลติ Eye of Heaven (v2 2026-11-07) ----------
// 0 รอยแยกมิติฉีก ตาลืมจากรอยแยก → 1.2 ตาลืมเต็ม = Impact frame (เห็นเฉพาะคนโดน + คนที่มองเห็นตา — js/44 impactFrame): ทุกคนในรัศมี 350 ลอยค้าง (ทำอะไรไม่ได้)
// → 1.35 กำแพงลมวงกลม 8 ชิ้นขึ้น → 1.45–3.1 ใบมีดลมฟันคนที่ลอยรัว ๆ ทุก 0.1 วิ (ดาเมจเบา 1 ต่อครั้ง)
// → 3.2 ลมกระแทก 15 ผลักทุกคนออกไปชนกำแพงวง = สตัน 3 วิ • กำแพงวงแต่ละชิ้นแตกได้แบบกำแพงปกติ (70 → ระเบิด 50) ชิ้นอื่นอยู่ต่อ
function windUltTick(p,dt){const U=p.wult;U.t+=dt;
  if(!p.alive){p.wult=null;return;}
  if(!U.slam&&U.t>=W_UL.slam){U.slam=1;const ids=[];
    for(const t of foesOf(p.team)){if(Math.hypot(t.x-U.x,t.y-U.y)>W_UL.r+(t.r||PR))continue;t.stun=Math.max(t.stun||0,W_UL.float);t.wflt=W_UL.float;t.wfz=W_UL.fz;t.vx*=0.2;t.vy*=0.2;U.fl.add(t);if(t.id!==undefined)ids.push(t.id);}
    emit({k:'efx',z:'wnulslam',x:Math.round(U.x),y:Math.round(U.y),h:p.z,a:U.a,v:ids,id:p.id});}
  if(U.slam&&!U.imp&&U.t>=W_UL.b0){U.bk=(U.bk||0)+dt;   // ใบมีดลมฟันรัว: ทุก W_UL.bt วิ ฟันทุกคนที่ลอยอยู่ 1 ครั้ง
    while(U.bk>=W_UL.bt){U.bk-=W_UL.bt;
      for(const t of U.fl){if(t.dead||t.alive===false||t.downed||!(t.wflt>0))continue;aoeHit(p,t,W_UL.bdmg,null);
        emit({k:'efx',z:'wnulblade',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),a:Math.round(rnd(0,6.28)*100)/100,n:(U.bn=((U.bn||0)+1))%3});}}}
  if(!U.wall&&U.t>=W_UL.wall){U.wall=1;const n=W_UL.seg,L=W_UL.r*Math.tan(Math.PI/n);
    for(let i=0;i<n;i++){const th=(i+0.5)*Math.PI*2/n,w={id:++G.zid,owner:p.id,team:p.team,x:U.x+Math.cos(th)*W_UL.r,y:U.y+Math.sin(th)*W_UL.r,a:th,L,r:W_WL.r,t:W_UL.wlife,hp:W_WL.hp,mv:0,acc:0,uns:0,hitT:{},ring:1};
      (G.wwl||(G.wwl=[])).push(w);emit({k:'efx',z:'wnwup',x:Math.round(w.x),y:Math.round(w.y),a:Math.round(th*100)/100,id:p.id,n:w.id,m:2});}}
  if(!U.imp&&U.t>=W_UL.imp){U.imp=1;
    for(const t of foesOf(p.team)){const d=Math.hypot(t.x-U.x,t.y-U.y);if(d>W_UL.r+(t.r||PR))continue;
      aoeHit(p,t,W_UL.dmg,t=>{const f=Math.max(W_UL.kmin,(W_UL.r-d+80)*6.5);knock(t,U.x,U.y,f);t.wus=1.2;t.wpush=1.2;});}
    emit({k:'efx',z:'wnulimp',x:Math.round(U.x),y:Math.round(U.y),h:p.z,id:p.id});}
  if(U.t>=W_UL.end)p.wult=null;}
// คนที่ลอยค้าง: ลอยขึ้นจากพื้นค้างไว้ (เรียกแทนแรงโน้มถ่วงใน updatePlayer)
function windFloatZ(p,dt){const gh=groundH(p.x,p.y,p.z);p.z+=(gh+(p.wfz||W_UL.fz)-p.z)*Math.min(1,4*dt);p.vz=0;}

// สำหรับ snapshot: [เกจ, ดูดลม, ชาร์จกำแพง, เลือกวางกำแพง, ชาร์จระเบิดปีก]
function windSnapP(p){if(!wOn(p))return undefined;return [Math.floor(p.wg||0),p.wchg?1:0,p.wwc|0,p.wwAim?1:0,p.wsb?1:0,p.wfw?(p.wfw.ph==='spin'||p.wfw.ph==='focus'?1:2):0,p.wdr?(p.wdr.ph==='chg'?1:2):0,p.wfw?(p.wfw.ph==='spin'?1:p.wfw.ph==='focus'?2:0):0,p.wfw&&p.wfw.ph==='spin'?p.wfw.side:0,p.wfw&&p.wfw.ph==='focus'&&p.wfw.b?1:0];}
function windSnapW(){const o={};if(G.wwl&&G.wwl.length)o.WW=G.wwl.map(w=>[w.id,Math.round(w.x),Math.round(w.y),Math.round(w.a*100)/100,w.L,Math.round(w.t*10)/10,w.mv>0?1:0,w.team,w.owner]);
  if(G.wvh&&G.wvh.length)o.WO=G.wvh.filter(v=>v.on).map(v=>[v.id,Math.round(v.x),Math.round(v.y)]);return o;}

// ---------- สกิล ----------
const W_WL=defSpell(WINDP,{id:'aegisgale',v:{L:125,r:14,life:12,hp:100,charge:8,max:3,push:400,spd:900,place:500,stun:0.5,pdmg:10,pstun:0.5,boom:70,bdmg:50,bpush:2400,brad:110,aim:4},vn:{L:'กำแพง • ครึ่งความกว้าง',r:'กำแพง • ความหนา',life:'กำแพง • อยู่ (วิ)',hp:'กำแพง • HP (โดนยิง)',charge:'ชาร์จคืน 1 อัน (วิ)',max:'ชาร์จสูงสุด (อัน)',push:'ดัน • ระยะ',spd:'ดัน • ความเร็ว',place:'วาง • ระยะไกลสุด',stun:'ศัตรูโดนผลักชน • สตัน (วิ)',pdmg:'ดันทะลุศัตรู • ดาเมจ',pstun:'ดันทะลุศัตรู • สตัน (วิ)',boom:'ตีครบเท่านี้ = แตก',bdmg:'แตกระเบิด • ดาเมจ',bpush:'แตกระเบิด • แรงผลัก',brad:'แตกระเบิด • รัศมี',aim:'เวลาเลือกดัน/วาง (วิ)'},role:'control',n:'Aegis Gale',ic:'🌬️',cd:0.4,d:'กำแพงลม (ชาร์จ 3 อัน คืน 8 วิ/อัน) — กดสกิลแล้วเลือก: คลิกซ้าย = ดันกำแพงพุ่งไปข้างหน้า 400 ศัตรูที่โดนถูกผลักไปตามกำแพงจนสุดทาง: สตัน 0.5 วิ + 10 ดาเมจ (ถ้าคนที่ถูกผลักติดสิ่งกีดขวาง กำแพงหยุด) (กดสกิลอีกครั้ง = หยุดก่อน) • คลิกขวา = วางตรงจุดเล็ง (ไกลสุด 500) • กว้าง 250 อยู่ 12 วิ • กันศัตรูเดินผ่าน + บล็อกท่าระยะไกลศัตรูทุกแบบ (กระสุน/BA ที่ยิงมา ลำแสง/เส้นยิง — กระสุนเร็วไม่ทะลุ) (พวกเดียวกันผ่านได้) • ศัตรูยิงพังได้ (200) • ศัตรูโดนผลักชน = สตัน 0.5 วิ • ตีศัตรูที่ติดกำแพงครบ 70 = กำแพงแตก ระเบิด 50 กระเด็นไกล',
  toggle(p){const w=(G.wwl||[]).find(w=>w.owner===p.id&&w.mv>0&&!w.dead);if(w){windWallStop(w);return true;}if(p.wwAim){p.wwAim=null;p.wwc=Math.min(W_WL.max,p.wwc+1);emit({k:'efx',z:'wnwaimoff',x:p.x,y:p.y,h:p.z,id:p.id});return true;}return false;},
  cast(p){if((p.wwc|0)<=0)return false;p.wwc--;const inp=p.inp||{};p.wwAim={t:W_WL.aim,f0:inp.fire,s0:inp.sh};emit({k:'efx',z:'wnwaim',x:p.x,y:p.y,h:p.z,id:p.id});}}).v;
const W_DR=defSpell(WINDP,{id:'windrift',v:{chg:0.2,dist:400,t:0.09,wait:0.6,w:50,push:2400,dmg:10,slow:0.5,slowT:1.2},vn:{chg:'ชาร์จ (วิ)',dist:'พุ่ง • ระยะ',t:'พุ่ง • เวลา (วิ)',wait:'ลมตามมาหลัง (วิ)',w:'ลม • ครึ่งความกว้าง',push:'ลม • แรงผลัก',dmg:'ลม • ดาเมจ',slow:'ทางพุ่ง • ช้า (เท่า)',slowT:'ทางพุ่ง • ช้านาน (วิ)'},role:'utility',n:'Windrift',ic:'💨',cd:14,d:'ชาร์จปีก 0.2 วิ (ลอยนิดหน่อย) แล้วพุ่ง 400 (20 ม.) เร็วแบบ Jett ลงท่าฮีโร่ • ศัตรูในทางพุ่งช้าลงทันที • 0.6 วิต่อมาลมแรงตามมา ศัตรูในแนวกว้าง 100 กระเด็น 400 ตามทิศที่พุ่ง 10 ดาเมจ • ใช้กลางอากาศได้',
  cast(p){if(p.wdr)return false;p.wdr={ph:'chg',t:W_DR.chg,a:p.ang,x0:p.x,y0:p.y,sl:new Set()};p.vz=Math.max(p.vz||0,2.5);emit({k:'efx',z:'wndr',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(p.ang*100)/100,id:p.id});}}).v;
const W_VX=defSpell(WINDP,{id:'vortexbind',v:{far:380,near:60,arc:22.5,hold:0.8,pull:0.4,r:60,dmg:20,stun:0.75},vn:{far:'ทอร์นาโด • ระยะเสก',near:'ดึงกลับมาหยุดห่าง',arc:'มุมห่างแต่ละอัน (องศา)',hold:'ค้างก่อนดึง (วิ)',pull:'เวลาดึง (วิ)',r:'ทอร์นาโด • รัศมีจับ',dmg:'ดาเมจ',stun:'ดึงถึงแล้วสตัน (วิ)'},role:'control',n:'Vortex Bind',ic:'🌀',cd:10,d:'เสกทอร์นาโด 3 อันเรียงโค้ง 45° ข้างหน้าระยะ 380 → 0.8 วิ ดึงกลับมาหยุดห่างเรา 60 (ใช้เวลาดึง 0.4 วิ) ลากศัตรูที่โดนมาติดกับทอร์นาโดทุกจังหวะ 20 ดาเมจ แล้วสตัน 0.75 วิ • ระหว่างดึงชนกำแพงลม = สตัน • ใช้กลางอากาศไม่ได้',
  cast(p){if(p.z>groundH(p.x,p.y,p.z)+0.4)return false;const a=p.ang;(G.wvx||(G.wvx=[])).push({o:p.id,team:p.team,x:p.x,y:p.y,h:p.z+1,t:0,as:[a-(W_VX.arc*Math.PI/180),a,a+(W_VX.arc*Math.PI/180)],c:[],cap:new Map()});
    emit({k:'efx',z:'wnvx',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});}}).v;
const W_VO=defSpell(WINDP,{id:'voidspheres',v:{fly:1.0,dist:400,wait:0,hold:2.5,drift:40,r:110,core:28,pull:500,tick:0.5,tdmg:1,dmg:20,push:2400,spin:14,lift:0.6},vn:{fly:'คลื่นลมพุ่งตรง (วิ)',dist:'คลื่นลม • ระยะ (หลุมดำเกิดที่ปลายทาง)',wait:'รอก่อนเป็นหลุมดำ (วิ)',hold:'หลุมดำอยู่ (วิ)',drift:'หลุมดำเลื่อน (ต่อวิ)',r:'รัศมีดูด',core:'ระยะติดขอบแกน',pull:'แรงดูด (ต่อวิ)',tick:'ดาเมจย่อยทุก (วิ)',tdmg:'ดาเมจย่อย',dmg:'ระเบิด • ดาเมจ',push:'ระเบิด • แรงผลัก',spin:'ความเร็วหมุนติ้ว',lift:'ลอยสูง (ม.)'},role:'control',n:'Void Spheres',ic:'⚫',cd:22,d:'แทงไม้ยิงคลื่นลมพุ่งตรงตามที่เล็ง 1 วิ ไกล 400 (ไม่โดนใคร) แล้วระเบิดเป็นลมดูดหลุมดำ 2.5 วิ ค่อยๆ เลื่อนไปข้างหน้า • ดูดศัตรูรัศมี 110 มาลอยหมุนติ้วที่หลุมดำ (ควบคุมตัวไม่ได้ แต่ตีได้) 1 ดาเมจทุก 0.5 วิ • จบ = ระเบิดผลักไปข้างหน้าแรงมาก 20 ดาเมจ (ชนกำแพงลม = สตัน) • ใช้กลางอากาศได้',
  cast(p){windVoidCast(p);}}).v;
const W_FW=defSpell(WINDP,{id:'featherwing',v:{t:16,spinT:1.2,spinR:64,spinH:3.5,fs0:240,spd:1.15,boost:1.6,hmin:1,hmax:12,vs:5,hgt:6,range:250,cone:50.4,push:1800,dmg:15,glide:2.2,fbCd:0.1,fbSpd:2600,fbRange:1100,fbDmg:5.5,fbPush:200,fbSpr:0.025},
  vn:{t:'โหมด Focus บินนาน (วิ)',spinT:'หมุนตัวบินวนขึ้น (วิ)',spinR:'หมุนวน • กว้างข้าง',spinH:'หมุนวน • ลอยขึ้น (ม.)',fs0:'(เลิกใช้)',spd:'บิน Focus • ความเร็ว (เท่า)',boost:'Shift เอนตัว • บินไวขึ้น (เท่าของความเร็วบิน)',hmin:'Ctrl • ต่ำสุดเหนือพื้น (ม.)',hmax:'Space • สูงสุดเหนือพื้น (ม.)',vs:'Space/Ctrl • ขึ้น-ลง (ม./วิ)',hgt:'สะบัดจบ • ลงถึงพื้นได้ลึก (ม.)',range:'สะบัดจบ • ระยะ',cone:'สะบัดจบ • มุม (องศา ครึ่งซ้าย/ขวา)',push:'สะบัดจบ • แรงผลัก',dmg:'สะบัดจบ • ดาเมจ',glide:'ร่อนลง (ม./วิ)',
    fbCd:'ลูกบอลลม • เว้น (วิ)',fbSpd:'ลูกบอลลม • ความเร็ว',fbRange:'ลูกบอลลม • ระยะ',fbDmg:'ลูกบอลลม • ดาเมจ',fbPush:'ลูกบอลลม • แรงผลัก (เบา)',fbSpr:'ลูกบอลลม • ส่ายกระสุน (rad)'},
  role:'utility',n:'Featherwing',ic:'🪽',cd:20,d:'กด → หมุนตัวมีปีกบินวนขึ้นไปด้านซ้าย/ขวา (กด A/D ตอนใช้ ไม่กด = ขวา) แล้วกลับมากลางตัว เข้าโหมด Focus 16 วิ: บินลอยกลางอากาศ (ไม่ใช่ไม้กวาด) WASD = ทิศ • Shift ค้าง = เอนตัวไปหน้าบินไวขึ้น • Space = สูงขึ้น (สูงสุด 12 ม.) • Ctrl/C = ต่ำลง • ใช้สกิลอื่นได้ปกติ • โจมตีปกติกลายเป็นลูกบอลลม ไกล เร็ว แรงกว่า ยิงรัวกดค้าง ผลักศัตรูเบา ๆ • กดสกิลอีกครั้ง = สะบัดปีกข้างหน้า 250 15 ดาเมจ จบโหมดแล้วร่อนลง',
  toggle(p){if(p.wfw&&p.wfw.ph==='focus'){windFlick(p);return true;}return false;},
  cast(p){if(p.wfw)return false;const inp=p.inp||{},side=inp.l&&!inp.r?-1:1;p.wfw={ph:'spin',t:0,side,x0:p.x,y0:p.y,z0:p.z,a:p.ang};p.shieldOn=false;p.dash=0;p.wsb=null;p.wgs&&windStreamEnd(p,null);
    emit({k:'efx',z:'wnfw',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(p.ang*100)/100,n:side,id:p.id});}}).v;
Object.assign(PDEF,{wball:{spd:W_FW.fbSpd,r:10,dmg:W_FW.fbDmg,life:W_FW.fbRange/W_FW.fbSpd,col:'#8dff65'}});
const W_UL=defSpell(WINDP,{id:'eyeofheaven',v:{r:350,slam:1.2,wall:1.35,imp:3.2,end:3.5,float:2.12,fz:2.4,dmg:15,b0:1.45,bt:0.1,bdmg:1,stun:3,wlife:6.25,seg:8,kmin:900},vn:{r:'รัศมีเขต/กำแพงวง',slam:'ตาลืมเต็ม + ลอย + Impact frame ที่ (วิ — ตรงกับภาพ)',wall:'กำแพงขึ้นที่ (วิ — ตรงกับภาพ)',imp:'ลมกระแทกที่ (วิ — ตรงกับภาพ)',end:'จบท่า (วิ)',float:'ลอยค้าง (วิ)',fz:'ลอยสูง (ม.)',dmg:'ลมกระแทก • ดาเมจ',b0:'ใบมีดลมเริ่มฟันที่ (วิ)',bt:'ใบมีดลมฟันทุก (วิ)',bdmg:'ใบมีดลม • ดาเมจต่อครั้ง',stun:'ชนกำแพงวง • สตัน (วิ)',wlife:'กำแพงวงอยู่ (วิ)',seg:'กำแพงวง • จำนวนชิ้น',kmin:'ลมกระแทก • แรงผลักต่ำสุด'},role:'ult',ult:true,n:'Eye of Heaven',ic:'👁️',cd:0,d:'รอยแยกมิติฉีกบนฟ้า ตาลืมออกมา 1.2 วิ → Impact frame (เห็นเฉพาะคนโดนและคนที่มองเห็นตา) ทุกคนในรัศมี 350 ลอยค้างทำอะไรไม่ได้ + กำแพงลมวงกลม 8 ชิ้นขึ้นรอบเขต • ใบมีดลมฟันคนที่ลอยรัว ๆ ทุก 0.1 วิ (เบาแต่ถี่ ครั้งละ 1) • 3.2 วิ ลมกระแทก 15 ผลักทุกคนไปชนกำแพงวง สตัน 3 วิ • กำแพงวงอยู่ 6 วิ แต่ละชิ้นตีแตกได้แบบกำแพงลมปกติ (ระเบิด 50) ชิ้นอื่นยังอยู่',
  cast(p){p.wult={t:0,x:p.x,y:p.y,a:Math.round(p.ang*100)/100,fl:new Set()};p.shieldOn=false;p.wfw=null;p.wdr=null;emit({k:'efx',z:'wnult',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(p.ang*100)/100,id:p.id});}}).v;

// ท่าพื้นฐาน + โล่ + Dash ของสาย (PBASIC ต้องอยู่ช่องเดียวกับลำดับใน PATHS)
PBASIC.push({id:'b_wind',type:'wblade',n:'ใบมีดลม / GaleBurst',d:'คลิก = ใบมีดลม (ลมพัดไป) 5 ดาเมจ ทุก 0.3 วิ ระยะ 600 ความเร็ว 1100 โดนแล้วเกจ GaleBurst +12% • กดค้าง (เกจยังไม่เต็ม) = ดูดลมรอบตัว +8%/วิ • เกจเต็ม = กดโจมตีปกติค้าง 0.3 วิ แล้วยิงลมกรวยกว้างต่อเนื่อง 17 ม. นาน 2.6 วิ (ปล่อยปุ่ม = หยุด เกจที่เหลือเก็บไว้) 5 ดาเมจ/0.25 วิ ผลักศัตรูเบา ๆ ตัวเราเดินช้าลง',
  shd:'โล่ปีกห่อตัว: กันรอบตัว 360° รับได้ 75 • โดนตีแต่ละครั้ง +10% เกจ • เกจเต็มระหว่างยกโล่ + คลิกซ้าย = ชาร์จปีกแล้วระเบิดรอบตัว รัศมี 200 ผลัก 250 สตัน 0.8 วิ 20 ดาเมจ',
  dsd:'Dash ถอยหลังผลัก (Shift): ผลักศัตรูข้างหน้า 250 ตัวเราดีดถอยหลัง 300 ลอยกลางอากาศ (ใช้สกิลกลางอากาศได้) • ศัตรูที่โดนผลักชนกำแพง = 20 ดาเมจ + สตัน • คูลดาวน์ 8 วิ',
  get shMul(){return 100/WNV.shHp;},shieldSwing:true,
  hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');if(pr.type==='wball'){knock(t,t.x-pr.vx,t.y-pr.vy,W_FW.fbPush);t.wpush=0.3;return;}const o=G.players[pr.owner];if(o)wGain(o,WNV.baGain);},   // ลูกบอลลม (Focus): ผลักเบา ๆ ไม่เพิ่มเกจ
  onBlock(p){wGain(p,WNV.shGain);},
  tick:windBasic,dash:windDash});
SPELLS.b_wind=PBASIC[WINDP];
