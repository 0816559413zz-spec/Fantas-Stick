// =====================================================================
//  สายลม 🌪️ (ผู้ใช้ออกแบบทั้งหมด — designs/wind.md "คอนเซ็ปต์ใหม่") • ฝั่งโฮสต์ • ขั้นที่ 1 (2026-10-28)
//  "ผู้ผลัก" เล่นกับกำแพงลม: ผลักศัตรูชนกำแพงลม = สตัน 0.5 วิ • ตีศัตรูที่ติดกำแพงครบ 70 = กำแพงแตกระเบิด 50 + กระเด็นไกล
//  เกจ GaleBurst p.wg 0-100: BA โดน +12 • กดค้างคลิกซ้ายดูดลม +8/วิ • โล่โดนตี +10 • เต็ม = BA ถัดไปเป็นทอร์นาโดนอน
//  กำแพงลม G.wwl: {x,y ศูนย์กลาง, a ทิศหน้ากำแพง, L ครึ่งความกว้าง, mv ระยะดันที่เหลือ, acc ดาเมจสะสม}
//  ขั้นที่ 2-3 (Windrift / Vortex Bind / Void Spheres / Featherwing / อัลติ) ยังเป็นตัวว่าง
// =====================================================================
const WINDP=PATHS.length;
const W_BA={dmg:5,cd:0.30,gain:12,hold:0.35,chg:8},                       // ใบมีดลม: ระยะ 400 (spd 1400 × life 0.286)
  W_GB={len:240,t:0.32,dmg:25,push:1500,r0:6,r1:27},                        // GaleBurst: 12 ม. ตามภาพ (ผู้ใช้ 2026-10-28) • ผลัก 250 (แรง 1500 ÷ แรงเสียดทาน 6)
  W_SH={mul:100/75,gain:10,chg:0.3,r:200,stun:0.8,push:1500,dmg:20},        // โล่ปีก: รับได้ 75 • ระเบิดปีก ชาร์จ 0.3 วิ ⚠
  W_DS={back:1800,vz:7,push:1500,reach:150,cone:Math.PI/3,wall:20,cd:8},    // Dash ถอยหลังผลัก: ถอย 300 ผลัก 250 ชนกำแพง 20 • ระยะผลักข้างหน้า 150 / มุม 60° ⚠
  W_WL={L:125,r:14,life:6,charge:8,max:3,push:400,spd:600,place:500,stun:0.5,boom:70,bdmg:50,bpush:2400,brad:110,aim:4};   // กำแพงลม Aegis Gale
PATHS.push({id:'wind',n:'สายลม',ic:'🌪️',col:'#8dff65',d:'ผู้ผลัก — สร้างกำแพงลม ผลักศัตรูไปชนให้สตัน ตีต่อจนกำแพงแตกระเบิด คุมตำแหน่งศัตรูแล้วคิดตาต่อไป',
  combo:'BA ใบมีดลมเก็บเกจ GaleBurst → เต็มแล้วยิงทอร์นาโดนอนผลัก • ผลักศัตรูชนกำแพงลม = สตัน 0.5 วิ • ตีศัตรูที่ติดกำแพงครบ 70 = กำแพงแตก ระเบิด 50 กระเด็นไกล • Dash ดีดถอยหลังผลักศัตรูชนกำแพง 20 • ใช้สกิลกลางอากาศได้'});
Object.assign(PDEF,{wblade:{spd:1400,r:9,dmg:W_BA.dmg,life:0.286,col:'#8dff65'}});
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
}
function windReset(p){p.wg=0;p.wwc=W_WL.max;p.wwr=0;p.wwAim=null;p.wsb=null;p.wsbL=0;p.wchg=0;p.wfHeld=0;}

// ---------- ท่าพื้นฐาน (คลิกซ้าย): ใบมีดลม / ดูดลมชาร์จเกจ / GaleBurst ----------
function windBasic(p,inp,dt,setCd){
  const prev=p.wfPrev;p.wfPrev=inp.fire;
  if(p.wwAim)return;   // กำลังเลือกวิธีวางกำแพง (คลิกซ้าย = ดัน)
  if(p.shieldOn){   // ระหว่างยกโล่: เกจเต็ม + คลิก = ชาร์จปีกแล้วระเบิด
    if(inp.fire&&!prev&&p.wg>=100&&!p.wsb){p.wsb={t:W_SH.chg};emit({k:'efx',z:'wnsbchg',x:p.x,y:p.y,h:p.z,id:p.id});}
    p.wchg=0;return;}
  if(inp.fire&&!prev){p.wfHeld=0;
    if(p.wg>=100&&p.cd.basic<=0){windGaleBurst(p);setCd('basic',0.5);return;}
    if(p.cd.basic<=0){shoot(p,'wblade',{sp:'b_wind',dmg:W_BA.dmg});setCd('basic',W_BA.cd);}
    return;}
  if(inp.fire){p.wfHeld=(p.wfHeld||0)+dt;
    // กดค้างตอนเกจยังไม่เต็ม = ดูดลมรอบตัว +8%/วิ (ไม่ยิง) ⚠ เริ่มหลังกดค้าง 0.35 วิ
    if(p.wfHeld>=W_BA.hold&&p.wg<100){if(!p.wchg)emit({k:'efx',z:'wnchg',x:p.x,y:p.y,h:p.z,id:p.id,n:1});p.wchg=1;wGain(p,W_BA.chg*dt);}
    else if(p.wg>=100&&p.wchg){p.wchg=0;emit({k:'efx',z:'wnchg',x:p.x,y:p.y,h:p.z,id:p.id,n:0});}
    return;}
  if(prev&&p.wchg){p.wchg=0;emit({k:'efx',z:'wnchg',x:p.x,y:p.y,h:p.z,id:p.id,n:0});}
  p.wfHeld=0;
}
// GaleBurst: ทอร์นาโดนอนพุ่ง 12 ม. ใน 0.32 วิ • กรวยเล็กที่ไม้ (0.3 เท่าตัว) บานถึง 1.5 เท่าตัว • โดนแต่ละคนครั้งเดียว
function windGaleBurst(p){p.wg=0;const a=p.ang;
  (G.wgb||(G.wgb=[])).push({o:p.id,team:p.team,x:p.x+Math.cos(a)*20,y:p.y+Math.sin(a)*20,h:p.z+1.15,a,t:0,hit:new Set()});
  emit({k:'efx',z:'wngb',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});}
function windGBTick(g,dt){g.t+=dt;const p=G.players[g.o],k=Math.min(1,g.t/W_GB.t),len=W_GB.len*Math.pow(k,0.8),ca=Math.cos(g.a),sa=Math.sin(g.a);
  if(p)for(const t of foesOf(g.team)){if(g.hit.has(t))continue;const dx=t.x-g.x,dy=t.y-g.y,u=dx*ca+dy*sa;if(u<-10||u>len)continue;
    const r=W_GB.r0+(W_GB.r1-W_GB.r0)*Math.max(0,u)/W_GB.len,side=Math.abs(-dx*sa+dy*ca);if(side>r+(t.r||PR)||Math.abs(cH(t)-g.h+1.1)>3)continue;
    g.hit.add(t);if(aoeHit(p,t,W_GB.dmg,t=>{knock(t,t.x-ca*10,t.y-sa*10,W_GB.push);t.wpush=0.8;}))emit({k:'efx',z:'wngbhit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});}
  return g.t<W_GB.t+0.05;}

// ---------- โล่ปีก ----------
function windShieldBurst(p){if(p.wg<100)return;p.wg=0;p.wsbL=0.6;p.shieldOn=false;p.vz=Math.max(p.vz||0,3);   // ลอยขึ้นนิดเดียว ~0.3 ม. (ผู้ใช้)
  for(const t of wFoeNear(p,p.x,p.y,W_SH.r))aoeHit(p,t,W_SH.dmg,t=>{addStun(t,W_SH.stun);knock(t,p.x,p.y,W_SH.push);t.wpush=0.8;});
  emit({k:'efx',z:'wnsb',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}

// ---------- Dash: ผลักศัตรูข้างหน้า + ดีดตัวเราถอยหลังลอยกลางอากาศ ----------
function windDash(p,inp,pr,dt,setCd){
  if(!pr.sp||p.cd.dodge>0||p.wwAim)return false;
  const a=p.ang,ca=Math.cos(a),sa=Math.sin(a);p.shieldOn=false;
  for(const t of foesOf(p.team)){const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);if(d>W_DS.reach+(t.r||PR)||Math.abs(angDiff(Math.atan2(dy,dx),a))>W_DS.cone||Math.abs(cH(t)-(p.z+1.1))>3.5)continue;
    knock(t,t.x-ca*10,t.y-sa*10,W_DS.push);t.wpush=0.8;t.wdk=0.8;t.wdkSrc=p.id;t.wdkN=t.solN|0;emit({k:'efx',z:'wndshit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});}
  p.vx=(p.vx||0)-ca*W_DS.back;p.vy=(p.vy||0)-sa*W_DS.back;p.vz=Math.max(p.vz||0,W_DS.vz);p.inv=Math.max(p.inv||0,0.15);
  setCd('dodge',W_DS.cd*p.buffs.cdr);
  emit({k:'efx',z:'wnds',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});
  return false;}

// ---------- กำแพงลม Aegis Gale ----------
function windWallMake(p,mode){const A=p.wwAim;p.wwAim=null;const a=p.ang;let x,y,mv=0;
  if(mode==='place'){const inp=p.inp||{};let gx=typeof inp.gx==='number'?inp.gx:p.x+Math.cos(a)*200,gy=typeof inp.gy==='number'?inp.gy:p.y+Math.sin(a)*200;
    const d=Math.hypot(gx-p.x,gy-p.y);if(d>W_WL.place){gx=p.x+(gx-p.x)/d*W_WL.place;gy=p.y+(gy-p.y)/d*W_WL.place;}x=gx;y=gy;}
  else{x=p.x+Math.cos(a)*40;y=p.y+Math.sin(a)*40;mv=W_WL.push;}
  const w={id:++G.zid,owner:p.id,team:p.team,x,y,a,L:W_WL.L,r:W_WL.r,t:W_WL.life,mv,acc:0,uns:0,hitT:{}};
  (G.wwl||(G.wwl=[])).push(w);
  emit({k:'efx',z:'wnwup',x:Math.round(x),y:Math.round(y),a:Math.round(a*100)/100,id:p.id,n:w.id,m:mode==='push'?1:0});}
function windWallStop(w){if(w.mv<=0)return;w.mv=0;emit({k:'efx',z:'wnwstop',x:Math.round(w.x),y:Math.round(w.y),a:Math.round(w.a*100)/100,n:w.id});}
function windWallBoom(w){if(w.dead)return;w.dead=1;const o=G.players[w.owner],nx=Math.cos(w.a),ny=Math.sin(w.a);
  if(o)for(const t of foesOf(w.team)){const s=wSeg(w,t.x,t.y);if(s.d>W_WL.brad+(t.r||PR))continue;
    aoeHit(o,t,W_WL.bdmg,t=>{const d=s.d>2?s.d:1,ux=s.d>2?(t.x-s.qx)/d:nx,uy=s.d>2?(t.y-s.qy)/d:ny;knock(t,t.x-ux*10,t.y-uy*10,W_WL.bpush);t.vz=Math.max(t.vz||0,6);});}
  emit({k:'efx',z:'wnwboom',x:Math.round(w.x),y:Math.round(w.y),a:Math.round(w.a*100)/100,n:w.id});}
// ศัตรูโดนดาเมจระหว่างติดสตันกับกำแพง: นับเข้ากำแพงของคนตี (ครบ 70 = แตกระเบิด) • เรียกจาก damage()
function windDmg(t,amt,srcId){if(!(t.wwW>0)||!(t.stun>0)||srcId==null)return;const w=(G.wwl||[]).find(w=>w.id===t.wwW&&!w.dead);if(!w||w.owner!==srcId)return;
  w.acc+=amt;if(!w.uns&&w.acc>=W_WL.boom*0.7){w.uns=1;emit({k:'efx',z:'wnwuns',x:Math.round(w.x),y:Math.round(w.y),a:Math.round(w.a*100)/100,n:w.id});}
  if(w.acc>=W_WL.boom)windWallBoom(w);}
// กระสุนศัตรูชนกำแพงลม = หายไป (คนเดินทะลุได้ — ผู้ใช้ 2026-10-28)
function windProjHit(pr){if(!G.wwl)return false;
  for(const w of G.wwl){if(w.dead||pr.team===w.team||pr.h>7)continue;if(wSeg(w,pr.x,pr.y).d<w.r+pr.r){emit({k:'efx',z:'wnwblk',x:Math.round(pr.x),y:Math.round(pr.y),h:pr.h,n:w.id});return true;}}
  return false;}

// ---------- ทั้งสนาม: GaleBurst / กำแพงลม / ชนกำแพง ----------
function updateWind(dt){
  if(G.wgb&&G.wgb.length)G.wgb=G.wgb.filter(g=>windGBTick(g,dt));
  if(G.wwl&&G.wwl.length){
    for(const w of G.wwl){if(w.dead)continue;w.t-=dt;if(w.t<=0){w.dead=1;emit({k:'efx',z:'wnwend',x:Math.round(w.x),y:Math.round(w.y),n:w.id});continue;}
      for(const k in w.hitT)if((w.hitT[k]-=dt)<=0)delete w.hitT[k];
      // ดันไปข้างหน้า: กวาดศัตรูที่อยู่หน้ากำแพงไปด้วย หยุดเมื่อสุดระยะ
      if(w.mv>0){const st=Math.min(w.mv,W_WL.spd*dt),nx=Math.cos(w.a),ny=Math.sin(w.a);w.x+=nx*st;w.y+=ny*st;w.mv-=st;
        for(const t of foesOf(w.team)){const s=wSeg(w,t.x,t.y);if(s.s>-8&&s.s<w.r+(t.r||PR)+30&&Math.abs((t.x-w.x)*-ny+(t.y-w.y)*nx)<w.L+(t.r||PR)){t.x+=nx*st;t.y+=ny*st;t.wpush=Math.max(t.wpush||0,0.2);}}
        if(w.mv<=0)windWallStop(w);}
      // ศัตรูที่โดนผลัก (ความเร็วกระเด็นสูง) วิ่งชนกำแพง = สตัน 0.5 วิ
      for(const t of foesOf(w.team)){if(w.hitT[t.id])continue;const sp=Math.hypot(t.vx||0,t.vy||0);if(sp<150&&!(t.wpush>0&&sp>60))continue;
        const s=wSeg(w,t.x,t.y);if(s.d>w.r+(t.r||PR))continue;
        w.hitT[t.id]=0.8;addStun(t,W_WL.stun);t.wwW=w.id;t.vx*=0.1;t.vy*=0.1;emit({k:'efx',z:'wnwhit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),a:Math.round(w.a*100)/100,n:w.id});
        if(t.wdk>0&&t.wdkSrc!=null){t.wdk=0;const o=G.players[t.wdkSrc];if(o)damage(t,W_DS.wall,o.id,'proj');}}}
    G.wwl=G.wwl.filter(w=>!w.dead);}
  // Dash ผลักศัตรูชนกำแพงแผนที่/สิ่งก่อสร้าง = 20 ดาเมจ + สตัน (ชนกำแพง = สตันตามกติกาสาย ⚠ 0.5 วิ)
  for(const t of foesOf(-99)){if(t.wpush>0)t.wpush-=dt;
    if(t.wdk>0){t.wdk-=dt;if((t.solN|0)>(t.wdkN|0)&&Math.hypot(t.vx||0,t.vy||0)>120){t.wdk=0;const o=G.players[t.wdkSrc];if(o)damage(t,W_DS.wall,o.id,'proj');addStun(t,W_WL.stun);emit({k:'efx',z:'wndswall',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});}}
    if(t.wwW&&!(t.stun>0))t.wwW=0;}
}
// สำหรับ snapshot: [เกจ, ดูดลม, ชาร์จกำแพง, เลือกวางกำแพง, ชาร์จระเบิดปีก]
function windSnapP(p){if(!wOn(p))return undefined;return [Math.floor(p.wg||0),p.wchg?1:0,p.wwc|0,p.wwAim?1:0,p.wsb?1:0];}
function windSnapW(){return G.wwl&&G.wwl.length?{WW:G.wwl.map(w=>[w.id,Math.round(w.x),Math.round(w.y),Math.round(w.a*100)/100,w.L,Math.round(w.t*10)/10,w.mv>0?1:0,w.team,w.owner])}:{};}

// ---------- สกิล ----------
defSpell(WINDP,{id:'aegisgale',role:'control',n:'Aegis Gale',ic:'🌬️',cd:0.4,d:'กำแพงลม (ชาร์จ 3 อัน คืน 8 วิ/อัน) — กดสกิลแล้วเลือก: คลิกซ้าย = ดันกำแพงพุ่งไปข้างหน้า 400 กวาดศัตรูไปด้วย (กดสกิลอีกครั้ง = หยุดก่อน) • คลิกขวา = วางตรงจุดเล็ง (ไกลสุด 500) • กว้าง 250 อยู่ 6 วิ • บล็อกลูกเวทศัตรู (คนเดินทะลุได้) • ศัตรูโดนผลักชน = สตัน 0.5 วิ • ตีศัตรูที่ติดกำแพงครบ 70 = กำแพงแตก ระเบิด 50 กระเด็นไกล',
  toggle(p){const w=(G.wwl||[]).find(w=>w.owner===p.id&&w.mv>0&&!w.dead);if(w){windWallStop(w);return true;}if(p.wwAim){p.wwAim=null;p.wwc=Math.min(W_WL.max,p.wwc+1);emit({k:'efx',z:'wnwaimoff',x:p.x,y:p.y,h:p.z,id:p.id});return true;}return false;},
  cast(p){if((p.wwc|0)<=0)return false;p.wwc--;const inp=p.inp||{};p.wwAim={t:W_WL.aim,f0:inp.fire,s0:inp.sh};emit({k:'efx',z:'wnwaim',x:p.x,y:p.y,h:p.z,id:p.id});}});
// ขั้นที่ 2-3 (ยังไม่ทำ): กดแล้วขึ้นข้อความ คืนคูลดาวน์
const wSoon=n=>function(p){emit({k:'efx',z:'wnsoon',x:p.x,y:p.y,h:p.z+2.2,id:p.id});return false;};
defSpell(WINDP,{id:'windrift',role:'utility',n:'Windrift',ic:'💨',cd:14,d:'(กำลังทำ — ขั้นที่ 2) ชาร์จปีก 0.3 วิ พุ่ง 200 แบบ Jett ลงท่าฮีโร่ • 1 วิต่อมาลมตามมา ศัตรูในแนวกว้าง 100 กระเด็น 400 ตามทิศพุ่ง 10 ดาเมจ',cast:wSoon('windrift')});
defSpell(WINDP,{id:'vortexbind',role:'control',n:'Vortex Bind',ic:'🌀',cd:10,d:'(กำลังทำ — ขั้นที่ 2) ทอร์นาโด 3 อันเรียงโค้ง 45° ข้างหน้า → 0.6 วิ ดึงกลับมาหยุดห่าง 60 ลากศัตรูมาด้วย 20 ดาเมจ • ชนกำแพงลมระหว่างดึง = สตัน',cast:wSoon('vortexbind')});
defSpell(WINDP,{id:'voidspheres',role:'control',n:'Void Spheres',ic:'⚫',cd:12,d:'(กำลังทำ — ขั้นที่ 2) ยิงลูกหลุมดำลม 3 ลูกติดกัน ลูกละ 10 ระยะ 400 ลากศัตรูตามทางได้ไม่เกิน 200 • ลากไปชนกำแพงลม = สตัน',cast:wSoon('voidspheres')});
defSpell(WINDP,{id:'featherwing',role:'utility',n:'Featherwing',ic:'🪽',cd:14,d:'(กำลังทำ — ขั้นที่ 2) บินด้วยปีก 5 วิ สูงสุด ~6 ม. เร็ว 1.3 เท่า • กดอีกครั้ง = สะบัดปีกไปข้างหน้า 250 ผลัก 300 15 ดาเมจ แล้วร่อนลง',cast:wSoon('featherwing')});
defSpell(WINDP,{id:'eyeofheaven',role:'ult',ult:true,n:'Eye of Heaven',ic:'👁️',cd:0,d:'(กำลังทำ — ขั้นที่ 3) เขตไร้แรงโน้มถ่วงรัศมี 350 ศัตรูลอยค้าง 1.5 วิ → ลมกระแทก 30 ผลักชนกำแพงลมวงกลม 8 ชิ้น = สตัน 3 วิ • กำแพงวงอยู่ 5 วิ ทำแตกได้ทีละชิ้น',cast(p){emit({k:'efx',z:'wnsoon',x:p.x,y:p.y,h:p.z+2.2,id:p.id});p.ult=100;}});

// ท่าพื้นฐาน + โล่ + Dash ของสาย (PBASIC ต้องอยู่ช่องเดียวกับลำดับใน PATHS)
PBASIC.push({id:'b_wind',type:'wblade',n:'ใบมีดลม / GaleBurst',d:'คลิก = ใบมีดลม 5 ดาเมจ ทุก 0.3 วิ ระยะ 400 โดนแล้วเกจ GaleBurst +12% • กดค้าง (เกจยังไม่เต็ม) = ดูดลมรอบตัว +8%/วิ • เกจเต็ม = คลิกถัดไปยิงทอร์นาโดนอน 12 ม. 25 ดาเมจ ผลัก 250',
  shd:'โล่ปีกห่อตัว: กันรอบตัว 360° รับได้ 75 • โดนตีแต่ละครั้ง +10% เกจ • เกจเต็มระหว่างยกโล่ + คลิกซ้าย = ชาร์จปีกแล้วระเบิดรอบตัว รัศมี 200 ผลัก 250 สตัน 0.8 วิ 20 ดาเมจ',
  dsd:'Dash ถอยหลังผลัก (Shift): ผลักศัตรูข้างหน้า 250 ตัวเราดีดถอยหลัง 300 ลอยกลางอากาศ (ใช้สกิลกลางอากาศได้) • ศัตรูที่โดนผลักชนกำแพง = 20 ดาเมจ + สตัน • คูลดาวน์ 8 วิ',
  shMul:W_SH.mul,shieldSwing:true,
  hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');const o=G.players[pr.owner];if(o)wGain(o,W_BA.gain);},
  onBlock(p){wGain(p,W_SH.gain);},
  tick:windBasic,dash:windDash});
SPELLS.b_wind=PBASIC[WINDP];
