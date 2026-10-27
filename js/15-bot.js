// =====================================================================
//  บอทรุ่นแรก (designs/training-zones.md ขั้น 2): ผู้เล่นปลอมฝั่งโฮสต์ ใช้สกิลผ่านปุ่มเหมือนคนจริง (p.inp)
//  p.bot = ให้ hostTick เรียกสมอง • p.ai = ค่าบอทในห้องฝึก (ระดับ / โซน / จุดเกิด / ทีม) — ไม่มี p.ai = บอททดสอบสมดุลเดิม (botBrain js/41)
// =====================================================================
// ระดับความเก่ง: react = วิที่ใช้คิดใหม่ (เลือกเป้า/ขยับเป้าเล็ง) • err = เล็งพลาดสูงสุด (px) • lead = เล็งดักทางกี่ส่วน
//   gap = เว้นวิระหว่างสกิล • dodge = โอกาสหลบกระสุนที่พุ่งใส่ • ult = ใช้อัลติตอนเป้าเลือดต่ำกว่านี้ (ส่วน)
const BOT_LV=[
  {n:'ง่าย',react:0.5,err:110,lead:0.3,gap:2.6,dodge:0.15,ult:0.35},
  {n:'กลาง',react:0.28,err:50,lead:0.7,gap:1.1,dodge:0.45,ult:0.6},
  {n:'ยาก',react:0.12,err:14,lead:1,gap:0.3,dodge:0.85,ult:1},
];
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
  p.ai={lv:L,zone:zk,home:{x,y},owner,team:BOT_TEAM,thinkT:0,skT:0,errX:0,errY:0,tg:null,dodT:0};
  p.team=BOT_TEAM;resetBody(p,x+rnd(-60,60),y+rnd(-60,60));collideWorld(p,PR);p.inv=1;
  emit({k:'revive',x:p.x,y:p.y});
  return p;
}
function removeBots(filter){for(const p of bots())if(!filter||filter(p))hostRemove(p.id);}
// เป้า: ศัตรูที่ยังสู้ได้ในโซนเดียวกัน (คนก่อน, คนที่เสกได้ก่อนนิดหน่อย) → ไม่มีก็มอนสเตอร์ในโซน (ไม่นับหุ่นซ้อม)
function botPickTarget(p){
  const A=p.ai,zk=A.zone;let best=null,bd=1e18;
  for(const q of plist()){if(q===p||!q.alive||q.downed||q.team===p.team||q.gh)continue;if(!botInZone(zk,q.x,q.y,120))continue;
    let d=(q.x-p.x)**2+(q.y-p.y)**2;if(q.id===A.owner)d*=0.6;if(q===A.tg)d*=0.8;if(d<bd){bd=d;best=q;}}
  if(best)return best;
  for(const e of G.en){if(e.dead||e.type==='dummy'||!botInZone(zk,e.x,e.y,60))continue;const d=(e.x-p.x)**2+(e.y-p.y)**2;if(d<bd){bd=d;best=e;}}
  return best;
}
function aiBot(p,dt){
  const A=p.ai,L=BOT_LV[A.lv],inp=p.inp,t=G.time;
  if(!p.alive||p.downed){inp.fire=0;inp.mx=inp.my=0;inp.sh=0;return;}
  // คิดใหม่เป็นจังหวะ (ระดับง่าย = ช้า): เลือกเป้า + สุ่มเล็งพลาดใหม่
  A.thinkT-=dt;
  if(A.thinkT<=0){A.thinkT=L.react*rnd(0.7,1.3);A.tg=botPickTarget(p);const a=rnd(0,Math.PI*2),r=L.err*Math.sqrt(Math.random());A.errX=Math.cos(a)*r;A.errY=Math.sin(a)*r;}
  const tg=A.tg&&(A.tg.isE?!A.tg.dead:(A.tg.alive&&!A.tg.downed&&G.players[A.tg.id]))?A.tg:null;
  // ไม่มีเป้า: เดินกลับจุดเกิด แล้วยืนรอ
  if(!tg){inp.fire=0;inp.sh=0;const dx=A.home.x-p.x,dy=A.home.y-p.y,d=Math.hypot(dx,dy);inp.mx=d>80?dx/d:0;inp.my=d>80?dy/d:0;inp.ax=p.x+Math.cos(p.ang)*300;inp.ay=p.y+Math.sin(p.ang)*300;return;}
  // ใช้สมองต่อสู้เดิม (เดินรักษาระยะ / ยิง / เงื่อนไขสกิลแต่ละตัว) แต่กดสกิลได้เฉพาะตอนพ้นช่วงเว้น
  const c0=Object.assign({},inp.c);
  botBrain(p,dt,tg);
  const used=SLOTK.concat(['x']).some(k=>(inp.c[k]|0)!==(c0[k]|0));
  if(t<A.skT)for(const k of SLOTK.concat(['x']))inp.c[k]=c0[k]|0;
  else if(used)A.skT=t+L.gap*rnd(0.7,1.3);
  // อัลติ: เก็บไว้จนเป้าเลือดน้อย (ระดับยาก = ใช้ทันที)
  if((inp.c.x|0)!==(c0.x|0)&&!tg.isE&&tg.hp>tg.maxHp*L.ult)inp.c.x=c0.x|0;
  // เล็ง: ดักทางตามระดับ + พลาดสุ่ม (botBrain เล็งดักเต็มที่)
  inp.ax=tg.x+(inp.ax-tg.x)*L.lead+A.errX;inp.ay=tg.y+(inp.ay-tg.y)*L.lead+A.errY;
  // หลบ: กระสุนศัตรูพุ่งเข้าหาในระยะใกล้ → กระโดด หรือ Dash ออกข้าง (สุ่มตามระดับ ครั้งละ 1 วิ)
  A.dodT-=dt;
  if(A.dodT<=0)for(const pr of G.proj){if(pr.team===p.team)continue;const rx=p.x-pr.x,ry=p.y-pr.y,d=Math.hypot(rx,ry);if(d>260||d<1)continue;const sp=Math.hypot(pr.vx,pr.vy)||1;
    if((rx*pr.vx+ry*pr.vy)/(d*sp)<0.9)continue;A.dodT=1;
    if(Math.random()<L.dodge){if(Math.random()<0.5||p.cd.dodge>0)inp.c.jp=(inp.c.jp|0)+1;else{const s=Math.random()<0.5?1:-1;inp.mx=-pr.vy/sp*s;inp.my=pr.vx/sp*s;inp.c.sp=(inp.c.sp|0)+1;}}
    break;}
  // สายจูง: ห้ามออกนอกโซน — ใกล้ขอบแล้วยังจะเดินออก = หันกลับเข้าหาจุดเกิด
  const nx=p.x+(inp.mx||0)*90,ny=p.y+(inp.my||0)*90;
  if(!botInZone(A.zone,nx,ny,-60)){const dx=A.home.x-p.x,dy=A.home.y-p.y,d=Math.hypot(dx,dy)||1;inp.mx=dx/d;inp.my=dy/d;}
}
// คำสั่งเสก/ลบบอทจากห้องฝึก (trCmd js/15): จุดเกิด = แท่นเสกบอท
function trBotCmd(p,d){
  if(d.c==='bot'){
    const B=trBotPad(),n=clamp(d.n|0||1,1,3);let k=0;
    for(let i=0;i<n;i++){const a=i/n*Math.PI*2;if(spawnBot(d.p|0,d.lv|0,B.x+Math.cos(a)*120,B.y-300+Math.sin(a)*120,'bot',p.id))k++;}
    if(k){feed(`🤖 ${p.name} เสกบอท${PATHS[d.p|0]&&!PATHS[d.p|0].off?PATHS[d.p|0].n:''} ×${k}`);broadcastLobby();}
    else toast('บอทเต็มแล้ว (สูงสุด '+BOT_MAX+' ตัว)');
  }else if(d.c==='botclr'){const n=bots().length;removeBots(q=>q.ai.zone==='bot');if(n){feed('🧹 ลบบอทแล้ว');broadcastLobby();}}
}
// ดีบัก (คอนโซล): WD.bot(path, lv, n) = เสกบอทจากชื่อเรา • WD.bot() = ลบบอททั้งหมด
function botDebug(path,lv,n){const me=G&&G.players[NET.myId];if(!me)return;if(path===undefined)return trBotCmd(me,{c:'botclr'});trBotCmd(me,{c:'bot',p:path,lv,n});return bots().map(q=>q.name);}
