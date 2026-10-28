// =====================================================================
//  สายลม 🌪️ (ผู้ใช้ออกแบบทั้งหมด — designs/wind.md "คอนเซ็ปต์ใหม่") • ฝั่งโฮสต์ • ขั้นที่ 1 (2026-10-28)
//  "ผู้ผลัก" เล่นกับกำแพงลม: ผลักศัตรูชนกำแพงลม = สตัน 0.5 วิ • ตีศัตรูที่ติดกำแพงครบ 70 = กำแพงแตกระเบิด 50 + กระเด็นไกล
//  เกจ GaleBurst p.wg 0-100: BA โดน +12 • กดค้างคลิกซ้ายดูดลม +8/วิ • โล่โดนตี +10 • เต็ม = BA ถัดไปเป็นทอร์นาโดนอน
//  กำแพงลม G.wwl: {x,y ศูนย์กลาง, a ทิศหน้ากำแพง, L ครึ่งความกว้าง, mv ระยะดันที่เหลือ, acc ดาเมจสะสม}
//  ขั้นที่ 2: Windrift / Vortex Bind / Void Spheres / Featherwing • ขั้นที่ 3: อัลติ Eye of Heaven (2026-10-28)
// =====================================================================
const WINDP=PATHS.length;
const W_BA={dmg:5,cd:0.30,gain:12,hold:0.35,chg:8},                       // ใบมีดลม: ระยะ 400 (spd 1400 × life 0.286)
  W_GB={len:240,t:0.32,dmg:25,push:1500,r0:6,r1:27},                        // GaleBurst: 12 ม. ตามภาพ (ผู้ใช้ 2026-10-28) • ผลัก 250 (แรง 1500 ÷ แรงเสียดทาน 6)
  W_SH={mul:100/75,gain:10,chg:0.3,r:200,stun:0.8,push:1500,dmg:20},        // โล่ปีก: รับได้ 75 • ระเบิดปีก ชาร์จ 0.3 วิ ⚠
  W_DS={back:1800,vz:7,push:1500,reach:150,cone:Math.PI/3,wall:20,cd:8},    // Dash ถอยหลังผลัก: ถอย 300 ผลัก 250 ชนกำแพง 20 • ระยะผลักข้างหน้า 150 / มุม 60° ⚠
  W_DR={chg:0.3,dist:200,t:0.15,wait:1.0,w:50,push:2400,dmg:10,slow:0.5,slowT:1.2,cd:14},   // Windrift: ชาร์จ 0.3 พุ่ง 200 ลมตามมา 1 วิ แนวกว้าง 100 กระเด็น 400 10 ดาเมจ • slow ทันที ⚠ 50% 1.2 วิ
  W_VX={far:300,near:60,arc:Math.PI/8,hold:0.8,pull:0.25,r:60,dmg:20,stun:0.75,cd:10},   // ผู้ใช้ 2026-10-28: ดึงมาถึงตัวแล้วสตัน 0.5 วิ   // Vortex Bind: 3 อันโค้ง 45° (±22.5°) • รัศมีจับ ⚠ 40
  W_VO={n:3,gap:0.18,spd:700,range:400,carry:200,r:22,dmg:10,cd:12},   // Void Spheres: ⚠ ยิงห่างกัน 0.18 วิ เร็ว 700
  W_FW={t:5,hgt:6,vz:3.5,spd:1.3,range:250,cone:Math.PI*0.28,push:1800,dmg:15,glide:2.2,cd:14},   // Featherwing: บิน 5 วิ สูงสุด 6 ม. • สะบัด 250 ผลัก 300 15 ดาเมจ • ร่อนลง ⚠ 2.2 ม./วิ
  W_UL={r:350,slam:1.0,wall:1.15,imp:2.38,end:2.7,float:1.5,fz:2.2,dmg:30,stun:3,wlife:6.25,seg:8},   // Eye of Heaven: เขต/กำแพงวงรัศมี 350 • ลอยค้าง 1.5 วิ • กระแทก 30 ชนกำแพงวง = สตัน 3 วิ • กำแพงอยู่ 5 วิหลังกระแทก • ความสูงที่ลอย ⚠ 2.2 ม. (เวลาตรงกับ wind/eye_of_heaven)
  W_WL={L:125,r:14,life:12,hp:200,charge:8,max:3,push:400,spd:900,place:500,stun:0.5,pdmg:10,pstun:0.5,boom:70,bdmg:50,bpush:2400,brad:110,aim:4};   // กำแพงลม Aegis Gale
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
  if(p.wdr)windDriftTick(p,dt);
  if(p.wfw)windFlyTick(p,dt);
  if(p.wult)windUltTick(p,dt);
  if(p.wvs){const V=p.wvs;V.t-=dt;if(V.t<=0&&V.n>0){V.n--;V.t=W_VO.gap;windVoidFire(p);}if(V.n<=0)p.wvs=null;}
}
// ความเร็วเดินพิเศษ: ชาร์จ Windrift ยืนนิ่ง • บิน Featherwing 1.3 เท่า
function windSpd(p){return p.wult?0:p.wdr&&p.wdr.ph==='chg'?0:p.wfw&&p.wfw.ph==='fly'?W_FW.spd:1;}
// ความสูงตอนบิน (แทนแรงโน้มถ่วง) — เรียกจาก updatePlayer
function windFlyZ(p,dt){const F=p.wfw,gh=groundH(p.x,p.y,p.z);
  if(F.ph==='fly'){const top=gh+W_FW.hgt;p.vz=p.z<top-0.05?Math.min(W_FW.vz,(top-p.z)*4):0;p.z+=p.vz*dt;}
  else{p.vz=Math.max(-W_FW.glide,Math.min(p.vz||0,0)-6*dt);p.z+=p.vz*dt;if(p.z<=gh){p.z=gh;p.vz=0;p.wfw=null;emit({k:'efx',z:'wnfwland',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}}}
function windReset(p){p.wult=null;p.wflt=0;p.wus=0;p.wdr=null;p.wfw=null;p.wvs=null;p.wg=0;p.wwc=W_WL.max;p.wwr=0;p.wwAim=null;p.wsb=null;p.wsbL=0;p.wchg=0;p.wfHeld=0;}

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
  p.vx=(p.vx||0)-ca*W_DS.back;p.vy=(p.vy||0)-sa*W_DS.back;p.vz=Math.max(p.vz||0,W_DS.vz);   // (ไม่ใส่อมตะ: ตัวละครจะกะพริบหาย แต่ปีกยังอยู่ = ดูเหมือนปีกไม่ตามตัว)
  setCd('dodge',W_DS.cd*p.buffs.cdr);
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
// กระสุนศัตรูชนกำแพงลม = หายไป + กำแพงเสีย HP (ศัตรูตีพังได้) • กระสุนพวกเดียวกันทะลุ (ผู้ใช้ 2026-10-28)
function windProjHit(pr){if(!G.wwl)return false;
  for(const w of G.wwl){if(w.dead||pr.team===w.team||pr.h>4.6)continue;if(wSeg(w,pr.x,pr.y).d<w.r+pr.r){emit({k:'efx',z:'wnwblk',x:Math.round(pr.x),y:Math.round(pr.y),h:pr.h,n:w.id});windWallHurt(w,pr.dmg||5);return true;}}
  return false;}
function windWallHurt(w,n){if(w.dead||w.hp===undefined)return;w.hp-=n;if(w.hp<=0){w.dead=1;emit({k:'efx',z:'wnwboom',x:Math.round(w.x),y:Math.round(w.y),a:Math.round(w.a*100)/100,n:w.id,m:1});}}
// ศัตรูเดินผ่านกำแพงลมไม่ได้ (พวกเดียวกันผ่านได้) — เรียกจาก collideWorld
function windCollide(o,r,z){if(!G||!G.wwl||!G.wwl.length||o.team===undefined)return 0;let n=0;
  for(const w of G.wwl){if(w.dead||w.team===o.team||z>=4.2||w.mv>0)continue;const s=wSeg(w,o.x,o.y),m=w.r+r;if(s.d>=m)continue;   // กำแพงที่กำลังดันทะลุผ่านคน
    if(s.d>0.001){o.x=s.qx+(o.x-s.qx)/s.d*m;o.y=s.qy+(o.y-s.qy)/s.d*m;}else{const sg=s.s>=0?1:-1;o.x=s.qx+Math.cos(w.a)*m*sg;o.y=s.qy+Math.sin(w.a)*m*sg;}
    n++;}
  return n;}

// ---------- ทั้งสนาม: GaleBurst / กำแพงลม / ชนกำแพง ----------
function updateWind(dt){
  if(G.wgb&&G.wgb.length)G.wgb=G.wgb.filter(g=>windGBTick(g,dt));
  if(G.wdft&&G.wdft.length)G.wdft=G.wdft.filter(g=>{g.t-=dt;if(g.t<=0){windDriftWind(g);return false;}return true;});
  if(G.wvx&&G.wvx.length)G.wvx=G.wvx.filter(V=>windVortexTick(V,dt));
  if(G.wvo&&G.wvo.length)G.wvo=G.wvo.filter(o=>windVoidTick(o,dt));
  if(G.wwl&&G.wwl.length){
    for(const w of G.wwl){if(w.dead)continue;w.t-=dt;if(w.t<=0){w.dead=1;emit({k:'efx',z:'wnwend',x:Math.round(w.x),y:Math.round(w.y),n:w.id});continue;}
      for(const k in w.hitT)if((w.hitT[k]-=dt)<=0)delete w.hitT[k];
      // ดันไปข้างหน้า: กวาดศัตรูที่อยู่หน้ากำแพงไปด้วย หยุดเมื่อสุดระยะ
      if(w.mv>0){const st=Math.min(w.mv,W_WL.spd*dt),nx=Math.cos(w.a),ny=Math.sin(w.a);w.x+=nx*st;w.y+=ny*st;w.mv-=st;
        // ผู้ใช้ 2026-10-28: ดันแล้วไม่พาศัตรูไป — กำแพงทะลุผ่านศัตรูในทาง แต่ละคนโดนครั้งเดียว: สตัน 0.5 + 10 ดาเมจ
        for(const t of foesOf(w.team)){if(w.pass[t.id])continue;const s=wSeg(w,t.x,t.y);if(s.d>w.r+(t.r||PR)+st||cH(t)>4.6)continue;
          w.pass[t.id]=1;const o=G.players[w.owner];if(o)aoeHit(o,t,W_WL.pdmg,t=>addStun(t,W_WL.pstun));emit({k:'efx',z:'wnwpass',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),a:Math.round(w.a*100)/100,n:w.id});}
        if(w.mv<=0)windWallStop(w);}
      // ศัตรูที่โดนผลัก (ความเร็วกระเด็นสูง) วิ่งชนกำแพง = สตัน 0.5 วิ
      for(const t of foesOf(w.team)){if(w.hitT[t.id])continue;const sp=Math.hypot(t.vx||0,t.vy||0);if(sp<150&&!(t.wpush>0&&sp>60))continue;
        const s=wSeg(w,t.x,t.y);if(s.d>w.r+(t.r||PR))continue;
        w.hitT[t.id]=0.8;addStun(t,t.wus>0?W_UL.stun:W_WL.stun);t.wus=0;t.wwW=w.id;t.vx*=0.1;t.vy*=0.1;emit({k:'efx',z:'wnwhit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),a:Math.round(w.a*100)/100,n:w.id});
        if(t.wdk>0&&t.wdkSrc!=null){t.wdk=0;const o=G.players[t.wdkSrc];if(o)damage(t,W_DS.wall,o.id,'proj');}}}
    G.wwl=G.wwl.filter(w=>!w.dead);}
  // Dash ผลักศัตรูชนกำแพงแผนที่/สิ่งก่อสร้าง = 20 ดาเมจ + สตัน (ชนกำแพง = สตันตามกติกาสาย ⚠ 0.5 วิ)
  for(const t of foesOf(-99)){if(t.wpush>0)t.wpush-=dt;if(t.wus>0)t.wus-=dt;if(t.wflt>0)t.wflt-=dt;
    if(t.wdk>0){t.wdk-=dt;if((t.solN|0)>(t.wdkN|0)&&Math.hypot(t.vx||0,t.vy||0)>120){t.wdk=0;const o=G.players[t.wdkSrc];if(o)damage(t,W_DS.wall,o.id,'proj');addStun(t,W_WL.stun);emit({k:'efx',z:'wndswall',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});}}
    if(t.wwW&&!(t.stun>0))t.wwW=0;}
}
// ---------- Windrift: ชาร์จปีก → พุ่ง 200 แบบ Jett → ลงท่าฮีโร่ → 1 วิต่อมาลมแรงตามมาพัดศัตรูในแนว ----------
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
    if(k>0){const c=V.c[i];t.x=c[0];t.y=c[1];t.vx=0;t.vy=0;t.wpush=0.3;
      for(const w of G.wwl||[]){if(w.dead||w.team!==V.team||w.hitT[t.id])continue;if(wSeg(w,t.x,t.y).d<w.r+(t.r||PR)){w.hitT[t.id]=0.8;addStun(t,W_WL.stun);t.wwW=w.id;emit({k:'efx',z:'wnwhit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),a:Math.round(w.a*100)/100,n:w.id});}}}}
  if(k>=1)for(const [t] of V.cap)if(!(t.stun>0&&t.wwW)&&!t.dead&&t.alive!==false){addStun(t,W_VX.stun);emit({k:'efx',z:'wnvxstun',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});}   // ดึงมาถึงแล้วสตัน 0.5 วิ
  return k<1;}

// ---------- Void Spheres: ลูกหลุมดำลม 3 ลูก ลากศัตรูตามทาง (ไม่เกิน 200) ชนกำแพงลม = สตัน ----------
function windVoidFire(p){const a=p.ang,o={id:++G.zid,o:p.id,team:p.team,x:p.x+Math.cos(a)*26,y:p.y+Math.sin(a)*26,h:p.z+1.35,a,d:0,cr:null,cd:0};
  (G.wvo||(G.wvo=[])).push(o);emit({k:'efx',z:'wnvofire',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});}
function windVoidTick(o,dt){const p=G.players[o.o];if(!p)return false;const st=W_VO.spd*dt,ca=Math.cos(o.a),sa=Math.sin(o.a);
  o.x+=ca*st;o.y+=sa*st;o.d+=st;
  if(o.x<20||o.x>MW-20||o.y<20||o.y>MH-20)o.d=W_VO.range;
  if(!o.cr){for(const t of foesOf(o.team)){if(Math.hypot(t.x-o.x,t.y-o.y)<W_VO.r+(t.r||PR)&&Math.abs(cH(t)-o.h+1.1)<3.5){o.cr=t;aoeHit(p,t,W_VO.dmg,null);emit({k:'efx',z:'wnvohit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});break;}}}
  else{const t=o.cr;if(!t||t.dead||t.alive===false||t.downed){o.cr=null;}
    else{t.x=o.x+ca*((t.r||PR)*0.5);t.y=o.y+sa*((t.r||PR)*0.5);t.vx=0;t.vy=0;t.wpush=0.3;o.cd+=st;
      let hit=null;for(const w of G.wwl||[]){if(w.dead||w.team!==o.team||w.hitT[t.id])continue;if(wSeg(w,t.x,t.y).d<w.r+(t.r||PR)){hit=w;break;}}
      if(hit){hit.hitT[t.id]=0.8;addStun(t,W_WL.stun);t.wwW=hit.id;emit({k:'efx',z:'wnwhit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),a:Math.round(hit.a*100)/100,n:hit.id});o.cr=null;o.d=W_VO.range;}
      else if(o.cd>=W_VO.carry){t.vx=ca*200;t.vy=sa*200;o.cr=null;}}}
  if(o.d>=W_VO.range){if(o.cr){o.cr.vx=ca*200;o.cr.vy=sa*200;}emit({k:'efx',z:'wnvoend',x:Math.round(o.x),y:Math.round(o.y),h:o.h,n:o.id});return false;}
  return true;}

// ---------- Featherwing: บิน 5 วิ → กดอีกครั้งสะบัดปีกไปข้างหน้า (เอียงลงพื้น) → ร่อนลง ----------
function windFlyTick(p,dt){const F=p.wfw;if(!p.alive){p.wfw=null;return;}
  if(F.ph==='fly'){F.t-=dt;if(F.t<=0||p.stun>0){F.ph='glide';emit({k:'efx',z:'wnfwend',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}}}
function windFlick(p){const F=p.wfw;if(!F||F.ph!=='fly')return;F.ph='glide';const a=p.ang;
  for(const t of foesOf(p.team)){const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);if(d>W_FW.range+(t.r||PR)||Math.abs(angDiff(Math.atan2(dy,dx),a))>W_FW.cone)continue;
    const dz=cH(t)-p.z;if(dz>2||dz<-(W_FW.hgt+2))continue;   // เอียงลงพื้น: โดนคนที่อยู่ต่ำกว่าเราได้
    aoeHit(p,t,W_FW.dmg,t=>{knock(t,t.x-Math.cos(a)*10,t.y-Math.sin(a)*10,W_FW.push);t.wpush=0.8;});}
  emit({k:'efx',z:'wnfwflick',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});}

// ---------- อัลติ Eye of Heaven ----------
// 0 ชูไม้ → 1.0 ปักไม้ลงพื้น: ทุกคนในรัศมี 350 ลอยค้าง 1.5 วิ (ทำอะไรไม่ได้) → 1.15 กำแพงลมวงกลม 8 ชิ้นขึ้น
// → 2.38 สะบัดปีก: ลมกระแทก 30 ผลักทุกคนออกไปชนกำแพงวง = สตัน 3 วิ • กำแพงวงแต่ละชิ้นแตกได้แบบกำแพงปกติ (70 → ระเบิด 50) ชิ้นอื่นอยู่ต่อ
function windUltTick(p,dt){const U=p.wult;U.t+=dt;
  if(!p.alive){p.wult=null;return;}
  if(!U.slam&&U.t>=W_UL.slam){U.slam=1;
    for(const t of foesOf(p.team)){if(Math.hypot(t.x-U.x,t.y-U.y)>W_UL.r+(t.r||PR))continue;t.stun=Math.max(t.stun||0,W_UL.float);t.wflt=W_UL.float;U.fl.add(t);}
    emit({k:'efx',z:'wnulslam',x:Math.round(U.x),y:Math.round(U.y),h:p.z,id:p.id});}
  if(!U.wall&&U.t>=W_UL.wall){U.wall=1;const n=W_UL.seg,L=W_UL.r*Math.tan(Math.PI/n);
    for(let i=0;i<n;i++){const th=(i+0.5)*Math.PI*2/n,w={id:++G.zid,owner:p.id,team:p.team,x:U.x+Math.cos(th)*W_UL.r,y:U.y+Math.sin(th)*W_UL.r,a:th,L,r:W_WL.r,t:W_UL.wlife,hp:W_WL.hp,mv:0,acc:0,uns:0,hitT:{},ring:1};
      (G.wwl||(G.wwl=[])).push(w);emit({k:'efx',z:'wnwup',x:Math.round(w.x),y:Math.round(w.y),a:Math.round(th*100)/100,id:p.id,n:w.id,m:2});}}
  if(!U.imp&&U.t>=W_UL.imp){U.imp=1;
    for(const t of foesOf(p.team)){const d=Math.hypot(t.x-U.x,t.y-U.y);if(d>W_UL.r+(t.r||PR))continue;
      aoeHit(p,t,W_UL.dmg,t=>{const f=Math.max(900,(W_UL.r-d+80)*6.5);knock(t,U.x,U.y,f);t.wus=1.2;t.wpush=1.2;});}
    emit({k:'efx',z:'wnulimp',x:Math.round(U.x),y:Math.round(U.y),h:p.z,id:p.id});}
  if(U.t>=W_UL.end)p.wult=null;}
// คนที่ลอยค้าง: ลอยขึ้นจากพื้นค้างไว้ (เรียกแทนแรงโน้มถ่วงใน updatePlayer)
function windFloatZ(p,dt){const gh=groundH(p.x,p.y,p.z);p.z+=(gh+W_UL.fz-p.z)*Math.min(1,4*dt);p.vz=0;}

// สำหรับ snapshot: [เกจ, ดูดลม, ชาร์จกำแพง, เลือกวางกำแพง, ชาร์จระเบิดปีก]
function windSnapP(p){if(!wOn(p))return undefined;return [Math.floor(p.wg||0),p.wchg?1:0,p.wwc|0,p.wwAim?1:0,p.wsb?1:0,p.wfw?(p.wfw.ph==='fly'?1:2):0,p.wdr?(p.wdr.ph==='chg'?1:2):0];}
function windSnapW(){const o={};if(G.wwl&&G.wwl.length)o.WW=G.wwl.map(w=>[w.id,Math.round(w.x),Math.round(w.y),Math.round(w.a*100)/100,w.L,Math.round(w.t*10)/10,w.mv>0?1:0,w.team,w.owner]);
  if(G.wvo&&G.wvo.length)o.WO=G.wvo.map(v=>[v.id,Math.round(v.x),Math.round(v.y),Math.round(v.h*10)/10]);return o;}

// ---------- สกิล ----------
defSpell(WINDP,{id:'aegisgale',role:'control',n:'Aegis Gale',ic:'🌬️',cd:0.4,d:'กำแพงลม (ชาร์จ 3 อัน คืน 8 วิ/อัน) — กดสกิลแล้วเลือก: คลิกซ้าย = ดันกำแพงพุ่งไปข้างหน้า 400 ทะลุผ่านศัตรูในทาง: สตัน 0.5 วิ + 10 ดาเมจ (กดสกิลอีกครั้ง = หยุดก่อน) • คลิกขวา = วางตรงจุดเล็ง (ไกลสุด 500) • กว้าง 250 อยู่ 12 วิ • กันศัตรูเดินผ่าน + บล็อกลูกเวทศัตรู (พวกเดียวกันผ่านได้) • ศัตรูยิงพังได้ (200) • ศัตรูโดนผลักชน = สตัน 0.5 วิ • ตีศัตรูที่ติดกำแพงครบ 70 = กำแพงแตก ระเบิด 50 กระเด็นไกล',
  toggle(p){const w=(G.wwl||[]).find(w=>w.owner===p.id&&w.mv>0&&!w.dead);if(w){windWallStop(w);return true;}if(p.wwAim){p.wwAim=null;p.wwc=Math.min(W_WL.max,p.wwc+1);emit({k:'efx',z:'wnwaimoff',x:p.x,y:p.y,h:p.z,id:p.id});return true;}return false;},
  cast(p){if((p.wwc|0)<=0)return false;p.wwc--;const inp=p.inp||{};p.wwAim={t:W_WL.aim,f0:inp.fire,s0:inp.sh};emit({k:'efx',z:'wnwaim',x:p.x,y:p.y,h:p.z,id:p.id});}});
defSpell(WINDP,{id:'windrift',role:'utility',n:'Windrift',ic:'💨',cd:W_DR.cd,d:'ชาร์จปีก 0.3 วิ (ลอยนิดหน่อย) แล้วพุ่ง 200 แบบ Jett ลงท่าฮีโร่ • ศัตรูในทางพุ่งช้าลงทันที • 1 วิต่อมาลมแรงตามมา ศัตรูในแนวกว้าง 100 กระเด็น 400 ตามทิศที่พุ่ง 10 ดาเมจ • ใช้กลางอากาศได้',
  cast(p){if(p.wdr)return false;p.wdr={ph:'chg',t:W_DR.chg,a:p.ang,x0:p.x,y0:p.y,sl:new Set()};p.vz=Math.max(p.vz||0,2.5);emit({k:'efx',z:'wndr',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(p.ang*100)/100,id:p.id});}});
defSpell(WINDP,{id:'vortexbind',role:'control',n:'Vortex Bind',ic:'🌀',cd:W_VX.cd,d:'เสกทอร์นาโด 3 อันเรียงโค้ง 45° ข้างหน้าระยะ 300 → 0.8 วิ ดึงกลับมาหยุดห่างเรา 60 ลากศัตรูที่โดนมาด้วย 20 ดาเมจ แล้วสตัน 0.75 วิ • ระหว่างดึงชนกำแพงลม = สตัน • ใช้กลางอากาศไม่ได้',
  cast(p){if(p.z>groundH(p.x,p.y,p.z)+0.4)return false;const a=p.ang;(G.wvx||(G.wvx=[])).push({o:p.id,team:p.team,x:p.x,y:p.y,h:p.z+1,t:0,as:[a-W_VX.arc,a,a+W_VX.arc],c:[],cap:new Map()});
    emit({k:'efx',z:'wnvx',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*100)/100,id:p.id});}});
defSpell(WINDP,{id:'voidspheres',role:'control',n:'Void Spheres',ic:'⚫',cd:W_VO.cd,d:'ยิงลูกหลุมดำลม 3 ลูกติดกัน ลูกละ 10 ดาเมจ ระยะ 400 • โดนแล้วลากศัตรูไปตามทางที่ลูกพุ่ง (ไม่เกิน 200) • ลากไปชนกำแพงลม = สตัน • ใช้กลางอากาศได้',
  cast(p){p.wvs={n:W_VO.n-1,t:W_VO.gap};windVoidFire(p);}});
defSpell(WINDP,{id:'featherwing',role:'utility',n:'Featherwing',ic:'🪽',cd:W_FW.cd,d:'บินด้วยปีก 5 วิ สูงสุด ~6 ม. เร็ว 1.3 เท่า (ใช้ BA / กำแพงลม / Windrift / Void Spheres ได้) • กดสกิลอีกครั้ง = สะบัดปีกไปข้างหน้า 250 เอียงลงพื้น ผลัก 300 15 ดาเมจ แล้วร่อนลง',
  toggle(p){if(p.wfw&&p.wfw.ph==='fly'){windFlick(p);return true;}return false;},
  cast(p){if(p.wfw)return false;p.wfw={ph:'fly',t:W_FW.t};p.vz=W_FW.vz;emit({k:'efx',z:'wnfw',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});}});
defSpell(WINDP,{id:'eyeofheaven',role:'ult',ult:true,n:'Eye of Heaven',ic:'👁️',cd:0,d:'ชูไม้ขึ้นฟ้า แล้วปักลงพื้น: ทุกคนในรัศมี 350 ลอยค้าง 1.5 วิ (ทำอะไรไม่ได้) • กำแพงลมวงกลม 8 ชิ้นขึ้นรอบเขต • สะบัดปีก = ลมกระแทก 30 ผลักทุกคนไปชนกำแพงวง สตัน 3 วิ • กำแพงวงอยู่ 5 วิ แต่ละชิ้นตีแตกได้แบบกำแพงลมปกติ (ระเบิด 50) ชิ้นอื่นยังอยู่',
  cast(p){p.wult={t:0,x:p.x,y:p.y,fl:new Set()};p.shieldOn=false;p.wfw=null;p.wdr=null;emit({k:'efx',z:'wnult',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(p.ang*100)/100,id:p.id});}});

// ท่าพื้นฐาน + โล่ + Dash ของสาย (PBASIC ต้องอยู่ช่องเดียวกับลำดับใน PATHS)
PBASIC.push({id:'b_wind',type:'wblade',n:'ใบมีดลม / GaleBurst',d:'คลิก = ใบมีดลม 5 ดาเมจ ทุก 0.3 วิ ระยะ 400 โดนแล้วเกจ GaleBurst +12% • กดค้าง (เกจยังไม่เต็ม) = ดูดลมรอบตัว +8%/วิ • เกจเต็ม = คลิกถัดไปยิงทอร์นาโดนอน 12 ม. 25 ดาเมจ ผลัก 250',
  shd:'โล่ปีกห่อตัว: กันรอบตัว 360° รับได้ 75 • โดนตีแต่ละครั้ง +10% เกจ • เกจเต็มระหว่างยกโล่ + คลิกซ้าย = ชาร์จปีกแล้วระเบิดรอบตัว รัศมี 200 ผลัก 250 สตัน 0.8 วิ 20 ดาเมจ',
  dsd:'Dash ถอยหลังผลัก (Shift): ผลักศัตรูข้างหน้า 250 ตัวเราดีดถอยหลัง 300 ลอยกลางอากาศ (ใช้สกิลกลางอากาศได้) • ศัตรูที่โดนผลักชนกำแพง = 20 ดาเมจ + สตัน • คูลดาวน์ 8 วิ',
  shMul:W_SH.mul,shieldSwing:true,
  hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');const o=G.players[pr.owner];if(o)wGain(o,W_BA.gain);},
  onBlock(p){wGain(p,W_SH.gain);},
  tick:windBasic,dash:windDash});
SPELLS.b_wind=PBASIC[WINDP];
