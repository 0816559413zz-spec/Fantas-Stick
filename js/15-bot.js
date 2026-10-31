// =====================================================================
//  บอทรุ่นแรก (designs/training-zones.md ขั้น 2): ผู้เล่นปลอมฝั่งโฮสต์ ใช้สกิลผ่านปุ่มเหมือนคนจริง (p.inp)
//  p.bot = ให้ hostTick เรียกสมอง • p.ai = ค่าบอทในห้องฝึก (ระดับ / โซน / จุดเกิด / ทีม) — ไม่มี p.ai = บอททดสอบสมดุลเดิม (botBrain js/41)
// =====================================================================
// ระดับความเก่ง: react = วิที่ใช้คิดใหม่ (เลือกเป้า/ขยับเป้าเล็ง) • err = เล็งพลาดสูงสุด (px) • lead = เล็งดักทางกี่ส่วน
//   gap = เว้นวิระหว่างสกิล • dodge = โอกาสหลบกระสุนที่พุ่งใส่ • ult = ใช้อัลติตอนเป้าเลือดต่ำกว่านี้ (ส่วน)
//   blk = โอกาสยกโล่ (Block) รับกระสุนแทนการหลบ • par = ยกโล่ทันจังหวะ Perfect Parry (ใกล้ 1 = แม่น)
const BOT_LV=[
  {n:'ง่าย',react:0.5,err:110,lead:0.3,gap:2.6,dodge:0.15,ult:0.35,blk:0.05,par:0.1},
  {n:'กลาง',react:0.28,err:50,lead:0.7,gap:1.1,dodge:0.45,ult:0.6,blk:0.3,par:0.4},
  {n:'ยาก',react:0.12,err:14,lead:1,gap:0.3,dodge:0.85,ult:1,blk:0.5,par:0.85},
];
// นิสัยสุ่มต่อตัว (ตอนเสก): บอทหลายตัวจะได้ไม่ขยับ/กดสกิลพร้อมกันเป๊ะ
//   ph/sp/sd = จังหวะ+ความเร็ว+ทิศส่ายตัว • rng = ชอบยืนใกล้/ไกล (คูณระยะ) • wait = รอเพื่อนบอทที่เพิ่งกดสกิลใส่เป้าเดียวกันกี่วิ
function botPersona(){return {ph:rnd(0,Math.PI*2),sp:rnd(1.1,2.4),sd:Math.random()<0.5?1:-1,rng:rnd(0.65,1.35),wait:rnd(0.35,0.8)};}
const BOT_TEAM=50,BOT_MAX=6;   // บอททุกตัวทีมเดียวกัน (ศัตรูของคน) • สูงสุดทั้งห้อง
function bots(){return plist().filter(p=>p.ai);}
function humans(){return plist().filter(p=>!p.ai);}
// โซนของบอท: ชื่อใน TEST_Z (กล่อง หรือ วงกลมสังเวียน) • pad = ขยาย/หดขอบ
function botInZone(zk,x,y,pad){
  const z=TEST_Z[zk];if(!z)return true;pad=pad||0;
  if(z.r)return Math.hypot(x-z.cx,y-z.cy)<z.r+pad;
  return x>z.x1-pad&&x<z.x2+pad&&y>z.y1-pad&&y<z.y2+pad;
}
// เสกบอท: path = เลขสาย (PATHS) • lv 0–2 • ใกล้จุด x,y • owner = id คนเสก
function spawnBot(path,lv,x,y,zk,owner){
  if(bots().length>=BOT_MAX)return null;
  G.botN=(G.botN|0)+1;
  const P=PATHS[path]&&!PATHS[path].off?path:0,L=clamp(lv|0,0,2),id='bot'+G.botN+'_'+Math.floor(Math.random()*1e6).toString(36);
  const p=addPlayer(id,'🤖 '+PATHS[P].n.replace('สาย','')+' ('+BOT_LV[L].n+')',null,null,String(P));
  Object.assign(p,freshStats());p.kt=p.kit;p.bot=true;p.inp=emptyInput();
  p.ai={lv:L,zone:zk,home:{x,y},owner,team:BOT_TEAM,thinkT:rnd(0,BOT_LV[L].react),skT:G.time+rnd(0,BOT_LV[L].gap+0.8),errX:0,errY:0,tg:null,dodT:0,ps:botPersona(),lastSk:-9,blk:null};
  p.team=BOT_TEAM;resetBody(p,x+rnd(-60,60),y+rnd(-60,60));collideWorld(p,PR);p.inv=1;
  for(const k of SLOTK){p.cd[k]=rnd(0,2.5);p.cdMax[k]=Math.max(1,p.cd[k]);}   // คูลดาวน์เริ่มไม่พร้อมกัน
  emit({k:'revive',x:p.x,y:p.y});
  return p;
}
// ลบของที่คนเหล่านี้เสกไว้ (กำแพง/หินดิน/โซน/กระสุน/สัตว์เวท ...) — ใช้ตอนลบบอท และจบรอบสังเวียน
const OWNED_K=['proj','zones','strikes','walls','chan','mins','erings','ices','waves','glac','eso','edust'];
function clearOwned(ids){const S=new Set(ids);for(const k of OWNED_K)if(Array.isArray(G[k]))G[k]=G[k].filter(o=>!S.has(o.owner));}
function removeBots(filter){const L=bots().filter(p=>!filter||filter(p));if(!L.length)return;clearOwned(L.map(p=>p.id));for(const p of L)hostRemove(p.id);}
// เป้า: ศัตรูที่ยังสู้ได้ในโซนเดียวกัน (คนก่อน, คนที่เสกได้ก่อนนิดหน่อย) → ไม่มีก็มอนสเตอร์ในโซน (ไม่นับหุ่นซ้อม)
function botPickTarget(p){
  const A=p.ai,zk=A.zone;let best=null,bd=1e18;
  if(A.side){   // บอทสังเวียน: สู้เฉพาะตอนแข่ง กับฝั่งตรงข้ามเท่านั้น (js/15-arena)
    if(!p.arSide||!G.ar||G.ar.ph!=='fight')return null;
    for(const id of G.ar[p.arSide==='A'?'B':'A']){const q=G.players[id];if(!q||!q.alive||q.downed)continue;const d=(q.x-p.x)**2+(q.y-p.y)**2;if(d<bd){bd=d;best=q;}}
    return best;
  }
  for(const q of plist()){if(q===p||!q.alive||q.downed||q.team===p.team||q.gh)continue;if(!botInZone(zk,q.x,q.y,120))continue;
    let d=(q.x-p.x)**2+(q.y-p.y)**2;if(q.id===A.owner)d*=0.6;if(q===A.tg)d*=0.8;if(d<bd){bd=d;best=q;}}
  if(best)return best;
  for(const e of G.en){if(e.dead||e.type==='dummy'||!botInZone(zk,e.x,e.y,60))continue;const d=(e.x-p.x)**2+(e.y-p.y)**2;if(d<bd){bd=d;best=e;}}
  return best;
}
function aiBot(p,dt){
  const A=p.ai,L=BOT_LV[A.lv],inp=p.inp,t=G.time;
  if(!p.alive||p.downed){inp.fire=0;inp.mx=inp.my=0;inp.sh=0;A.blk=null;return;}
  // คิดใหม่เป็นจังหวะ (ระดับง่าย = ช้า): เลือกเป้า + สุ่มเล็งพลาดใหม่
  A.thinkT-=dt;
  if(A.thinkT<=0){A.thinkT=L.react*rnd(0.7,1.3);A.tg=botPickTarget(p);const a=rnd(0,Math.PI*2),r=L.err*Math.sqrt(Math.random());A.errX=Math.cos(a)*r;A.errY=Math.sin(a)*r;}
  const tg=A.tg&&(A.tg.isE?!A.tg.dead:(A.tg.alive&&!A.tg.downed&&G.players[A.tg.id]))?A.tg:null;
  // ไม่มีเป้า: เดินกลับจุดเกิด แล้วยืนรอ
  if(!tg){inp.fire=0;inp.sh=0;A.blk=null;const dx=A.home.x-p.x,dy=A.home.y-p.y,d=Math.hypot(dx,dy);inp.mx=d>80?dx/d:0;inp.my=d>80?dy/d:0;inp.ax=p.x+Math.cos(p.ang)*300;inp.ay=p.y+Math.sin(p.ang)*300;return;}
  // ใช้สมองต่อสู้เดิม (เดินรักษาระยะ / ยิง / เงื่อนไขสกิลแต่ละตัว) แต่กดสกิลได้เฉพาะตอนพ้นช่วงเว้น
  const c0=Object.assign({},inp.c);
  botBrain(p,dt,tg);
  const used=SLOTK.concat(['x']).some(k=>(inp.c[k]|0)!==(c0[k]|0));
  // ผลัดกัน: เพื่อนบอทที่ตีเป้าเดียวกันเพิ่งกดสกิล → รอแป๊บ (ไม่ปล่อยสกิลซ้อนวินาทีเดียวกัน)
  const pals=bots().filter(q=>q!==p&&q.ai.tg===tg&&q.alive&&!q.downed);
  const busy=used&&pals.some(q=>t-q.ai.lastSk<A.ps.wait);
  if(t<A.skT||busy)for(const k of SLOTK.concat(['x']))inp.c[k]=c0[k]|0;
  else if(used){A.skT=t+L.gap*rnd(0.6,1.4);A.lastSk=t;}
  // อัลติ: เก็บไว้จนเป้าเลือดน้อย (ระดับยาก = ใช้ทันที)
  if((inp.c.x|0)!==(c0.x|0)&&!tg.isE&&tg.hp>tg.maxHp*L.ult)inp.c.x=c0.x|0;
  // เล็ง: ดักทางตามระดับ + พลาดสุ่ม (botBrain เล็งดักเต็มที่)
  inp.ax=tg.x+(inp.ax-tg.x)*L.lead+A.errX;inp.ay=tg.y+(inp.ay-tg.y)*L.lead+A.errY;
  // รุมเป้าเดียวกัน: กระจายตัวไปคนละมุมรอบเป้า (ไม่ยืนกองข้างเดียวกัน)
  if(pals.length&&!tg.isE){const L2=pals.concat([p]).sort((a,b)=>a.id<b.id?-1:1),n=L2.length,i=L2.indexOf(p);
    let cx=0,cy=0;for(const q of L2){cx+=q.x;cy+=q.y;}cx/=n;cy/=n;
    const a0=Math.atan2(cy-tg.y,cx-tg.x),a=a0+(i-(n-1)/2)*Math.min(1.5,3.2/n),R=345*A.ps.rng;
    const fx=tg.x+Math.cos(a)*R-p.x,fy=tg.y+Math.sin(a)*R-p.y,fd=Math.hypot(fx,fy);
    if(fd>60){inp.mx=(inp.mx||0)*0.5+fx/fd*0.8;inp.my=(inp.my||0)*0.5+fy/fd*0.8;}}
  // Block: ยกโล่ค้างไว้ หันหน้าหากระสุน (ระดับยาก = ยกตอนใกล้โดน → Perfect Parry)
  const canSh=p.pathIdx!==2&&!p.aug&&!p.wwAim&&p.shieldBroken<=0;
  if(p.pathIdx!==2)inp.sh=0;
  if(A.blk){const B=A.blk;B.t-=dt;
    if(B.t<=0||!canSh)A.blk=null;
    else if(B.t<=B.hold){inp.sh=1;inp.fire=0;const pr=B.pr&&!B.pr.dead?B.pr:null;if(pr){inp.ax=pr.x;inp.ay=pr.y;}else{inp.ax=tg.x;inp.ay=tg.y;}}}
  // หลบ: กระสุนศัตรูพุ่งเข้าหาในระยะใกล้ → ยกโล่ / กระโดด / Dash ออกข้าง (สุ่มตามระดับ ครั้งละ 1 วิ)
  A.dodT-=dt;
  if(A.dodT<=0&&!A.blk)for(const pr of G.proj){if(pr.team===p.team)continue;const rx=p.x-pr.x,ry=p.y-pr.y,d=Math.hypot(rx,ry);if(d>260||d<1)continue;const sp=Math.hypot(pr.vx,pr.vy)||1;
    if((rx*pr.vx+ry*pr.vy)/(d*sp)<0.9)continue;A.dodT=rnd(0.7,1.3);
    if(canSh&&p.shieldE>30&&Math.random()<L.blk){
      // เวลาก่อนโดน − ช่วง Parry (0.28 วิ): ยกแม่น = ยกก่อนโดนนิดเดียว • ไม่แม่น = ยกเร็ว/ช้าไปบ้าง
      const tti=Math.max(0,(d-PR)/sp),lead=Math.random()<L.par?rnd(0.05,0.2):rnd(0.3,0.8),hold=rnd(0.5,1.1);
      A.blk={pr,hold,t:hold+Math.max(0,tti-lead)};
    }else if(Math.random()<L.dodge){if(Math.random()<0.5||p.cd.dodge>0)inp.c.jp=(inp.c.jp|0)+1;else{const s=Math.random()<0.5?1:-1;inp.mx=-pr.vy/sp*s;inp.my=pr.vx/sp*s;inp.c.sp=(inp.c.sp|0)+1;}}
    break;}
  // สายจูง: ห้ามออกนอกโซน — ใกล้ขอบแล้วยังจะเดินออก = หันกลับเข้าหาจุดเกิด
  const nx=p.x+(inp.mx||0)*90,ny=p.y+(inp.my||0)*90;
  if(!botInZone(A.zone,nx,ny,-60)){const dx=A.home.x-p.x,dy=A.home.y-p.y,d=Math.hypot(dx,dy)||1;inp.mx=dx/d;inp.my=dy/d;}
  botCombo(p,dt,tg);   // ท่าต่อเนื่องต่อสาย (js/15-botplay) — หลังเช็คจังหวะเว้นสกิล ไม่โดนตัดทิ้ง
}
// คำสั่งเสก/ลบบอทจากห้องฝึก (trCmd js/15): จุดเกิด = แท่นเสกบอท
function trBotCmd(p,d){
  if(d.c==='bot'&&d.side){const k=arAddBots(p,d);if(k){feed(`🤖 ${p.name} เพิ่มบอททีม ${d.side==='B'?'B':'A'} ×${k}`);broadcastLobby();}}
  else if(d.c==='bot'){
    const B=trBotPad(),n=clamp(d.n|0||1,1,3);let k=0;
    for(let i=0;i<n;i++){const a=i/n*Math.PI*2;if(spawnBot(d.p|0,d.lv|0,B.x+Math.cos(a)*120,B.y-300+Math.sin(a)*120,'bot',p.id))k++;}
    if(k){feed(`🤖 ${p.name} เสกบอท${PATHS[d.p|0]&&!PATHS[d.p|0].off?PATHS[d.p|0].n:''} ×${k}`);broadcastLobby();}
    else toast('บอทเต็มแล้ว (สูงสุด '+BOT_MAX+' ตัว)');
  }else if(d.c==='botclr'){const z=d.z==='arena'?'arena':'bot';if(z==='arena'&&arBusy())return toast('กำลังแข่งอยู่ — รอจบรอบก่อน');const n=bots().filter(q=>q.ai.zone===z).length;removeBots(q=>q.ai.zone===z);if(n){feed('🧹 ลบบอทแล้ว');broadcastLobby();}}
}
// ---------- บอทในห้องรอ (ผู้ใช้ 2026-10-31 "สร้างห้องเล่นกับบอทได้") ----------
// โฮสต์เพิ่มบอทในห้องรอได้ ทั้งเล่นคนเดียวและห้องออนไลน์ (ai.lb) • นับเป็นผู้เล่นของโหมด • อยู่ต่อข้ามแมตช์ (ไม่โดน removeBots ตอนเริ่ม/กลับล็อบบี้)
//   โหมดที่บอทเล่นเป็น = สู้กัน (BOT_MODES) • ควิดดิช/แข่งไม้กวาด/หาโวลเดอมอร์ = บอทยังไม่รู้กติกา → ห้ามเริ่มจนกว่าจะลบบอท (validate)
//   ห้องเต็ม 6 แล้วเพื่อนเข้ามา = ลบบอทออก 1 ตัวให้เพื่อน (hostOnData)
const BOT_MODES=['coop','duel','ffa','tdm','br'];
function lobbyBots(){return bots().filter(p=>p.ai.lb);}
function lobbyBotAdd(path,lv){
  if(!G||G.ph!=='lobby')return;
  const M=MODES[G.mode]||{};if(plist().length>=Math.min(6,M.max||6))return toast('ห้องเต็มแล้วสำหรับโหมดนี้');
  const ok=PATHS.map((P,i)=>i).filter(i=>!PATHS[i].off),P=path>=0&&ok.includes(path)?path:ok[Math.floor(Math.random()*ok.length)];
  const p=spawnBot(P,lv,800,500,null,NET.myId);if(!p)return toast('บอทเต็มแล้ว (สูงสุด '+BOT_MAX+' ตัว)');
  p.ai.lb=1;EVL.pop();if(NET.online)EVN.pop();   // ไม่เล่นเอฟเฟกต์เกิดในห้องรอ
  broadcastLobby();
}
function lobbyBotCmd(id,c){
  const p=G&&G.ph==='lobby'&&G.players[id];if(!p||!p.ai||!p.ai.lb)return;
  if(c==='x')hostRemove(id);else if(c==='t'){p.lteam^=1;broadcastLobby();}
}
// ตอนเริ่มแมตช์ (hostStart หลังวางจุดเกิด): ทีมตามโหมด + จุดกลับ = จุดเกิด + ล้างความจำเป้า/ทาง
function lobbyBotsStart(){for(const p of lobbyBots()){p.ai.team=p.team;p.ai.home={x:p.x,y:p.y};p.ai.tg=null;p.nav=null;p.inp=emptyInput();}}
// ดีบัก (คอนโซล): WD.bot(path, lv, n, side) = เสกบอทจากชื่อเรา (side 'A'/'B' = บอทสังเวียน) • WD.bot() = ลบบอททั้งหมด
function botDebug(path,lv,n,side){const me=G&&G.players[NET.myId];if(!me)return;if(path===undefined)return removeBots();trBotCmd(me,side?{c:'bot',p:path,lv,n,side}:{c:'bot',p:path,lv,n});return bots().map(q=>q.name);}
