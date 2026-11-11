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
// ชุดคาถาสุ่มต่อบอท (4 ท่าจากสายนั้น ไม่เอาท่าที่ยังสอนบอทไม่ได้) — หลายตัวสายเดียวกันจะได้ไม่เล่นเหมือนกัน
const BOT_SKIP=[];   // ท่าที่ยังสอนบอทไม่ได้ (ตอนนี้สอนครบแล้ว)
function botKit(P){
  const L=SPELL_LIST.filter(x=>x.path===P&&!x.ult&&!BOT_SKIP.includes(x.id));
  for(let i=L.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[L[i],L[j]]=[L[j],L[i]];}
  const core=P===WINDP?'featherwing':P===NATUREP?'poisondart':null;
  const f=L.findIndex(x=>x.id===core);if(f>0)L.unshift(L.splice(f,1)[0]);
  return P+'.'+L.slice(0,4).map(x=>x.i).join('.');
}
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
// fx: 1 = หุ่นผู้เล่น (ยืนนิ่ง ไม่โจมตี ทีม 51) • 2 = บอทโชว์สกิล (ยืนนิ่ง ใช้สกิลตามที่สั่ง trShowCmd ทีม 50) — ไม่นับในเพดานบอท
function spawnBot(path,lv,x,y,zk,owner,fx){
  if(!fx&&bots().filter(q=>!q.ai.still).length>=(G.ph==='lobby'?ROOM_MAX-1:BOT_MAX))return null;   // ห้องรอ: เติมบอทได้จนเต็มห้อง (12) • ห้องฝึก/สังเวียนยัง 6
  G.botN=(G.botN|0)+1;
  const P=PATHS[path]&&!PATHS[path].off?path:0,L=clamp(lv|0,0,2),id=(fx?'fix':'bot')+G.botN+'_'+Math.floor(Math.random()*1e6).toString(36);
  const p=addPlayer(id,fx===2?showName(P):fx?'🎯 หุ่นผู้เล่น':'🤖 '+PATHS[P].n.replace('สาย','')+' ('+BOT_LV[L].n+')',null,null,botKit(P));
  Object.assign(p,freshStats());p.kt=p.kit;p.bot=true;p.inp=emptyInput();
  p.ai={lv:L,zone:zk,home:{x,y},owner,team:fx===1?BOT_TEAM+1:BOT_TEAM,thinkT:rnd(0,BOT_LV[L].react),skT:G.time+rnd(0,BOT_LV[L].gap+0.8),errX:0,errY:0,tg:null,dodT:0,ps:botPersona(),lastSk:-9,blk:null};
  if(fx){p.ai.still=1;p.ai.show=fx===2?1:0;p.ai.nocd=0;p.ai.fT=0;p.ai.fM='h';p.ai.shT=0;p.ai.jhT=0;p.ai.chT=0;p.ai.hold=null;}
  p.team=p.ai.team;if(fx)resetBody(p,x,y);else resetBody(p,x+rnd(-60,60),y+rnd(-60,60));collideWorld(p,PR);p.inv=1;
  for(const k of SLOTK){p.cd[k]=rnd(0,2.5);p.cdMax[k]=Math.max(1,p.cd[k]);}   // คูลดาวน์เริ่มไม่พร้อมกัน
  emit({k:'revive',x:p.x,y:p.y});
  return p;
}
// ลบของที่คนเหล่านี้เสกไว้ (กำแพง/หินดิน/โซน/กระสุน/สัตว์เวท ...) — ใช้ตอนลบบอท และจบรอบสังเวียน
const OWNED_K=['proj','zones','strikes','walls','chan','mins','nature','erings','ices','waves','glac','eso','edust'];
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
  if(G.mode==='siege'&&G.sg)return sgBotTarget(p);   // บุกปราสาท: สนใจเฉพาะศัตรูที่เกี่ยวกับภารกิจ (js/15-siege)
  for(const q of plist()){if(q===p||!q.alive||q.downed||q.team===p.team||q.gh)continue;if(!botInZone(zk,q.x,q.y,120))continue;
    let d=(q.x-p.x)**2+(q.y-p.y)**2;if(q.id===A.owner)d*=0.6;if(q===A.tg)d*=0.8;if(d<bd){bd=d;best=q;}}
  for(const o of G.nature||[])if(o.isM&&o.team!==p.team&&natureLive(o)&&G.time>=o.ready&&botInZone(zk,o.x,o.y,60)){
    const d=dist2(p,o)*1.35;if(d<bd){bd=d;best=o;}
  }
  if(best)return best;
  for(const e of G.en){if(e.dead||e.type==='dummy'||!botInZone(zk,e.x,e.y,60))continue;const d=(e.x-p.x)**2+(e.y-p.y)**2;if(d<bd){bd=d;best=e;}}
  return best;
}
// =====================================================================
//  วิธีเล่นตามสาย (guides/CLASS-GUIDE.md): เงื่อนไขใช้แต่ละท่า + ท่าต่อเนื่อง (คลิกยืนยัน / กดค้าง / กดซ้ำ) ที่บอททั่วไป (botBrain js/41) ทำไม่เป็น
//  ใช้กับบอทห้องฝึกที่มี p.ai เท่านั้น • botPlay ทำงานหลัง botBrain: ทิ้งการกดสกิลของ botBrain แล้วตัดสินใจเองตามสายนี้
//  ตัวเลขระยะเป็น px (20 px = 1 ม.) — เป็นแค่ "ใช้ตอนไหน" ตามไกด์ ไม่ใช่ค่าบาลานซ์
// =====================================================================
const BOT_PB={0:1,1:1,2:1,6:1,8:1};   // ไฟ น้ำแข็ง สายฟ้า ดิน น้ำ • ลม/ธรรมชาติใช้ botClassPlan ร่วมกับบอทสมดุล
function botPlay(p,dt,tg,c0){
  const A=p.ai,inp=p.inp,t=G.time,pi=p.pathIdx;
  for(const k of SLOTK.concat(['x']))inp.c[k]=c0[k]|0;   // ทิ้งการกดของ botBrain
  inp.hq=inp.he=inp.hr=inp.hf=0;
  const dx=tg.x-p.x,dy=tg.y-p.y,d=Math.hypot(dx,dy),ang=Math.atan2(dy,dx),hpR=p.hp/p.maxHp;
  const key=id=>{const i=p.kitIds.indexOf(id);return i<0?null:SLOTK[i];};
  const rdy=id=>{const k=key(id);return !!k&&p.cd[k]<=0&&!(p.sil>0);};
  const go=id=>{const k=key(id);if(k)inp.c[k]=(inp.c[k]|0)+1;return k;};
  const roll=pr=>Math.random()<pr;
  const dash=()=>{inp.c.sp=(inp.c.sp|0)+1;};
  A.pf=!A.pf;const pulse=()=>{inp.fire=A.pf?1:0;};   // สลับ 0/1 ทุกเฟรม = มีขอบกดใหม่ (ท่าที่ต้อง "คลิกยืนยัน")
  const ult=(r)=>{if(p.ult>=100&&d<r)inp.c.x=(inp.c.x|0)+1;};
  // ---------- 🔥 ไฟ ----------
  if(pi===0){
    if(p.dfall){if(p.dfall.ph===2)pulse();return;}                    // Dragonfall: ถึงจุดบินแล้วคลิก = ดิ่งใส่
    if(p.colos>0){if(p.colN>0)pulse();return;}                        // ร่างยักษ์: ยิงหน้าไม้ทีละนัด
    if(p.kindle>0&&d<1000)pulse();                                    // Kindle: ลอยอยู่ ยิงลูกไฟใหญ่
    const burn=tg.brn|0;
    if(rdy('ignitionsnap')&&(burn>=3||(burn>=2&&tg.hp<tg.maxHp*0.35)))go('ignitionsnap');   // ปิดจบเมื่อมีหลายชั้น
    else if(rdy('ringofembers')&&d<380&&d>90)go('ringofembers');                              // ขังก่อน แล้วลูกไฟชาร์จ
    else if(rdy('blazeform')&&d<300&&hpR>0.5&&(burn>=1||roll(0.4)))go('blazeform');
    else if(rdy('dragonfall')&&d>260&&d<560)go('dragonfall');
    else if(rdy('kindle')&&d>200&&d<650&&!(p.kindle>0))go('kindle');
    ult(800);
    return;
  }
  // ---------- ❄️ น้ำแข็ง ----------
  if(pi===1){
    if(p.cryo>0){inp.mx=inp.my=0;return;}                             // แช่แข็งตัวเอง: ทำอะไรไม่ได้ รอ
    if(p.fmode===1&&!(p.fmCd>0)&&!(p.mirror>0)&&d<560)inp.c.v=(inp.c.v|0)+1;   // โหมดไกลเบา → กลับโหมดประชิด
    if(p.fmode!==1){
      if(rdy('cryoshell')&&hpR<0.35&&d<400)go('cryoshell');           // รีเซ็ตตัวเองตอนเลือดน้อย
      else if(rdy('frostforge')&&d<330&&!(p.ffT>0))go('frostforge');
      else if(rdy('permafrost')&&d<260)go('permafrost');
      else if(rdy('frostaura')&&d<210)go('frostaura');
      else if(rdy('glacierrend')&&d<400&&d>100)go('glacierrend');
    }
    ult(520);
    return;
  }
  // ---------- ⚡ สายฟ้า ----------
  if(pi===2){
    const st=p.lst|0;
    if(p.sdome){if(p.sdome.ph===2&&(p.sdome.god||stormDomeCharge(p.sdome.t)>=1))pulse();return;}
    if(p.rail||p.slnT>0)return;                                       // ร่าย Railgun/เส้นสายฟ้าอยู่ ยืนนิ่ง
    // เก็บ stack: Dash ทะลุศัตรู • stack ครบแล้วเก็บ Dash ไว้หนี
    if(p.dch>=1&&!(p.dash>0)&&d>150&&d<430&&(st<2||roll(0.2))&&roll(dt*4))dash();
    if(rdy('stormdome')&&st>=stormDomeCost(p)&&d<560)go('stormdome');
    else if(rdy('railgun')&&st>=3&&d<850&&d>200)go('railgun');
    else if(rdy('triplestrike')&&st>=2&&d<560)go('triplestrike');
    else if(rdy('speedsiphon')&&st>=2&&d<600)go('speedsiphon');
    else if(rdy('stormorbs')&&st>=1&&!p.sorb&&d<500)go('stormorbs');
    else if(rdy('thunderline')&&d<580&&st<3)go('thunderline');
    ult(340);
    return;
  }
  // ---------- ⛰️ ดิน ----------
  if(pi===6){
    const stand=!(p.stdB>0);
    if(p.wr){if(p.wr.ph==='sky'){pulse();inp.mx=Math.sin(t*0.8+A.ps.ph);inp.my=0;}return;}   // Wrath: ลอยบนฟ้า เล็งแล้วคลิกปาเสา
    if(p.aug){const T=A.augT||2.1;inp['h'+p.aug.k]=p.aug.t<T?1:0;inp.mx=inp.my=0;return;}     // Auger: กดค้างจนครบระดับที่ตั้งใจ แล้วปล่อย
    if(p.ramp||p.ecb)return;
    inp.fire=(t%0.8<0.15)?1:0;                                        // Stand ต่อยเป็นจังหวะ (ไม่กดค้างชาร์จ เดินช้า)
    // Tectonic Crush ซ้ำ: ศัตรูเข้าไปอยู่ระหว่างกำแพงสองแนว → กดอีกครั้ง = หนีบ
    if(p.tec&&p.tec.ok&&!p.crush&&stand){const T=p.tec,u=dx*Math.cos(T.a)+dy*Math.sin(T.a),v=-dx*Math.sin(T.a)+dy*Math.cos(T.a);
      if(u>40&&u<340&&Math.abs(v)<110){inp.c[T.k]=(inp.c[T.k]|0)+1;return;}}
    const slowed=(tg.slow>0)||(tg.stun>0);
    if(stand&&rdy('stonebreaker')&&d<520&&d>110)go('stonebreaker');
    else if(rdy('terraauger')&&d<560&&(slowed||roll(0.5))){const k=go('terraauger');A.augT=slowed?rnd(2.2,4.7):rnd(0.1,2.1);inp['h'+k]=1;}
    else if(stand&&rdy('tectoniccrush')&&d<320&&d>80)go('tectoniccrush');
    else if(rdy('mudswamp')&&d>140&&d<580)go('mudswamp');
    else if(stand&&rdy('dustburst')&&d>180&&d<500&&(hpR<0.6||roll(0.3)))go('dustburst');
    // Dash: Stand ปกติ = Rampage พุ่งชน • Stand แตก = Rock Boost หนี
    if(p.cd.dodge<=0&&!(p.dash>0)){if(stand&&d>320&&d<800&&roll(dt*0.8))dash();else if(!stand&&hpR<0.4&&d<300&&roll(dt*2))dash();}
    ult(700);
    return;
  }
  // ---------- 💧 น้ำ ----------
  if(pi===8){
    if(p.wdg){if(p.wdg.ph==='aim'){inp.gx=tg.x;inp.gy=tg.y;pulse();}return;}   // มังกรน้ำ: เลือกจุดแล้วคลิกดิ่ง
    if(p.wab){inp.mx=inp.my=0;return;}                                          // Abyssal Beam: ยืนนิ่งตอนร่าย/ยิง
    const caged=tg.wflt>0;
    if(rdy('aquacage')&&d<290&&d>60)go('aquacage');
    else if(rdy('abyssalbeam')&&d<650&&d>200&&(caged||roll(0.35)))go('abyssalbeam');   // ขังก่อนแล้วเสียบลำน้ำ
    else if(rdy('moonwater')&&d<850)go('moonwater');
    else if(rdy('tidecaller')&&d<650)go('tidecaller');
    else if(rdy('riptide')&&d<400&&d>110)go('riptide');
    // โล่โดมน้ำฮีลตัวเองเฉพาะตอนมีจังหวะพัก (ไกลศัตรู เลือดไม่เต็ม เกจพอ)
    if(!A.blk&&hpR<0.7&&d>260&&p.shieldE>20&&p.shieldBroken<=0)inp.sh=1;
    if(p.cd.dodge<=0&&!(p.dash>0)&&(hpR<0.35||d<110)&&roll(dt*2))dash();       // ร่างโคลนหนี
    ult(700);
    return;
  }
}
// ---------- บอทยืนนิ่ง (ห้องฝึก): หุ่นผู้เล่น = ไม่ทำอะไร • บอทโชว์สกิล (ai.show) = ยืนนิ่ง เล็งหุ่นเป้า แล้วกดสกิลตามคำสั่ง trShowCmd ----------
function showName(P){return '🎭 บอทโชว์ ('+PATHS[P].n.replace('สาย','')+')';}
function showBot(){return bots().find(q=>q.ai.show);}
function stillBot(p,dt){
  const A=p.ai,inp=p.inp;
  inp.mx=inp.my=0;inp.fire=0;inp.sh=0;inp.hq=inp.he=inp.hr=inp.hf=0;inp.jh=inp.ch=0;
  if(!A.show||!p.alive||p.downed){A.fT=A.shT=A.jhT=A.chT=0;A.hold=null;return;}
  if(A.nocd)for(const k of SLOTK)p.cd[k]=0;
  // เล็งหุ่นเป้า (ตายอยู่ = เล็งที่เดิมที่จะเกิดใหม่)
  const S=trShow(),T=plist().find(q=>q!==p&&q.ai&&q.ai.still&&!q.ai.show&&Math.hypot(q.ai.home.x-S.t.x,q.ai.home.y-S.t.y)<5)||{x:S.t.x,y:S.t.y,z:0};
  inp.ax=T.x;inp.ay=T.y;inp.ah=cH(T)+0.1;inp.dh=0;
  if(A.fT>0){A.fT-=dt;if(A.fM==='h')inp.fire=1;else{A.pf=!A.pf;inp.fire=A.pf?1:0;}}
  if(A.shT>0){A.shT-=dt;inp.sh=1;}
  if(A.jhT>0){A.jhT-=dt;inp.jh=1;}
  if(A.chT>0){A.chT-=dt;inp.ch=1;}
  if(A.hold){A.hold.t-=dt;if(A.hold.t<=0)A.hold=null;else inp['h'+A.hold.k]=1;}
}
// คำสั่งจากแท่นดูสกิล (trCmd c:'show'): a = path เปลี่ยนสาย • kit สุ่มชุดคาถาใหม่ • tap/hold กดสกิลช่อง k • fire คลิก/ค้าง/รัว • sh โล่ • sp Dash • jp กระโดด • up/dn บินสูง/ต่ำ • ult • heal • nocd • stop
function trShowCmd(p,d){
  const b=showBot();if(!b){toast('บอทโชว์ยังไม่เกิด');return;}
  const A=b.ai,a=d.a,k=SLOTK.includes(d.k)?d.k:null;
  if(a==='path'){const P=PATHS[d.p|0]&&!PATHS[d.p|0].off?d.p|0:0;setKit(b,botKit(P));b.kt=b.kit;b.name=showName(P);for(const s of SLOTK)b.cd[s]=0;b.ult=0;feed(`🎭 ${p.name} เปลี่ยนบอทโชว์เป็น${PATHS[P].n}`);}
  else if(a==='cast'){   // ใช้คาถาใดก็ได้ของสายนี้: ไม่อยู่ในช่อง → สลับเข้าช่องหมุนเวียน แล้วกดช่องนั้น (hold = กดค้าง)
    const sp=SPELL_LIST.find(x=>x.id===d.id&&x.path===b.pathIdx&&!x.ult);if(!sp)return;
    let i=b.kitIds.indexOf(sp.id);
    if(i<0){i=(A.rot|0)%4;A.rot=i+1;const ids=parseKit(b.kit).ids.slice();ids[i]=sp.i;setKit(b,[b.pathIdx,...ids].join('.'));b.kt=b.kit;b.cd[SLOTK[i]]=0;}
    const kk=SLOTK[i];if(d.hold)A.hold={k:kk,t:clamp(+d.t||2,0.2,6)};else b.inp.c[kk]=(b.inp.c[kk]|0)+1;}
  else if(a==='tap'&&k)b.inp.c[k]=(b.inp.c[k]|0)+1;
  else if(a==='hold'&&k)A.hold={k,t:clamp(+d.t||2,0.2,6)};
  else if(a==='fire'){A.fM=d.m==='p'?'p':'h';A.fT=clamp(+d.t||0.12,0.05,6);}
  else if(a==='sh')A.shT=clamp(+d.t||2,0.2,6);
  else if(a==='sp')b.inp.c.sp=(b.inp.c.sp|0)+1;
  else if(a==='jp')b.inp.c.jp=(b.inp.c.jp|0)+1;
  else if(a==='up')A.jhT=1.2;
  else if(a==='dn')A.chT=1.2;
  else if(a==='ult'){b.ult=100;b.inp.c.x=(b.inp.c.x|0)+1;}
  else if(a==='heal'){for(const q of plist())if(q.ai&&q.ai.still&&q.alive){q.hp=q.maxHp;q.shieldE=100;q.shieldBroken=0;q.stun=0;}b.ult=0;for(const s of SLOTK)b.cd[s]=0;feed('❤️ ฟื้นบอท/หุ่นทั้งหมด');}
  else if(a==='reset'){clearOwned([b.id]);for(const q of plist())if(q.ai&&q.ai.still&&q.alive){if(q.pathIdx!==undefined)pathReset(q);resetBody(q,q.ai.home.x,q.ai.home.y);q.hp=q.maxHp;q.shieldE=100;q.shieldBroken=0;q.inp=emptyInput();}
    A.fT=A.shT=A.jhT=A.chT=0;A.hold=null;for(const s of SLOTK)b.cd[s]=0;b.ult=0;feed('🔄 รีเซ็ตบอท/หุ่นกลับที่เดิม');}
  else if(a==='nocd'){A.nocd=A.nocd?0:1;}
  else if(a==='stop'){A.fT=A.shT=A.jhT=A.chT=0;A.hold=null;}
}
function aiBot(p,dt){
  const A=p.ai,L=BOT_LV[A.lv],inp=p.inp,t=G.time;
  if(A.still){stillBot(p,dt);return;}
  if(!p.alive||p.downed){inp.fire=0;inp.mx=inp.my=0;inp.sh=0;A.blk=null;return;}
  // คิดใหม่เป็นจังหวะ (ระดับง่าย = ช้า): เลือกเป้า + สุ่มเล็งพลาดใหม่
  A.thinkT-=dt;
  if(A.thinkT<=0){A.thinkT=L.react*rnd(0.7,1.3);A.tg=botPickTarget(p);const a=rnd(0,Math.PI*2),r=L.err*Math.sqrt(Math.random());A.errX=Math.cos(a)*r;A.errY=Math.sin(a)*r;}
  const tg=A.tg&&natureLive(A.tg)&&(A.tg.isE||A.tg.natKind||G.players[A.tg.id])?A.tg:null;
  // ไม่มีเป้า: เดินกลับจุดเกิด แล้วยืนรอ
  if(!tg){
    inp.fire=0;inp.sh=0;inp.jh=inp.ch=0;A.blk=null;
    if(p.wult||p.natureHook){inp.mx=inp.my=0;return;}
    const dx=A.home.x-p.x,dy=A.home.y-p.y,d=Math.hypot(dx,dy);
    inp.mx=d>80?dx/d:0;inp.my=d>80?dy/d:0;inp.ax=p.x+Math.cos(p.ang)*300;inp.ay=p.y+Math.sin(p.ang)*300;return;
  }
  // ใช้สมองต่อสู้เดิม (เดินรักษาระยะ / ยิง / เงื่อนไขสกิลแต่ละตัว) แต่กดสกิลได้เฉพาะตอนพ้นช่วงเว้น
  const c0=Object.assign({},inp.c);
  botBrain(p,dt,tg);
  const pals=bots().filter(q=>q!==p&&q.ai.tg===tg&&q.alive&&!q.downed);
  const classPlan=botClassPlanFor(p);
  if(classPlan)botClassPlan(p,tg);
  else if(BOT_PB[p.pathIdx])botPlay(p,dt,tg,c0);
  if(!classPlan&&(inp.c.x|0)!==(c0.x|0)&&!tg.isE&&tg.hp>tg.maxHp*L.ult)inp.c.x=c0.x|0;
  const used=SLOTK.concat(['x']).some(k=>(inp.c[k]|0)!==(c0[k]|0));
  // ผลัดกัน: เพื่อนบอทที่ตีเป้าเดียวกันเพิ่งกดสกิล → รอแป๊บ (ไม่ปล่อยสกิลซ้อนวินาทีเดียวกัน)
  const busy=used&&pals.some(q=>t-q.ai.lastSk<A.ps.wait);
  if(t<A.skT||busy)for(const k of SLOTK.concat(['x']))inp.c[k]=c0[k]|0;
  else if(used){A.skT=t+L.gap*rnd(0.6,1.4);A.lastSk=t;}
  // เล็ง: ดักทางตามระดับ + พลาดสุ่ม (botBrain เล็งดักเต็มที่)
  inp.ax=tg.x+(inp.ax-tg.x)*L.lead+A.errX;inp.ay=tg.y+(inp.ay-tg.y)*L.lead+A.errY;
  if(A.aimOv){inp.ax=A.aimOv.x;inp.ay=A.aimOv.y;A.aimOv=null;}   // จุดเล็งเฉพาะ เช่น ป้อมที่ Dash จะเกี่ยว
  if(p.wult||p.natureHook)return;
  // รุมเป้าเดียวกัน: กระจายตัวไปคนละมุมรอบเป้า (ไม่ยืนกองข้างเดียวกัน)
  const slip=p.pathIdx===WINDP&&windSlotOf(p,'vortexbind');
  const sideDash=slip&&(inp.c[slip]|0)!==(c0[slip]|0);
  if(pals.length&&!tg.isE&&!sideDash){const L2=pals.concat([p]).sort((a,b)=>a.id<b.id?-1:1),n=L2.length,i=L2.indexOf(p);
    let cx=0,cy=0;for(const q of L2){cx+=q.x;cy+=q.y;}cx/=n;cy/=n;
    const a0=Math.atan2(cy-tg.y,cx-tg.x),a=a0+(i-(n-1)/2)*Math.min(1.5,3.2/n),R=(p.pathIdx===NATUREP?170:345)*A.ps.rng;
    const fx=tg.x+Math.cos(a)*R-p.x,fy=tg.y+Math.sin(a)*R-p.y,fd=Math.hypot(fx,fy);
    if(fd>60){inp.mx=(inp.mx||0)*0.5+fx/fd*0.8;inp.my=(inp.my||0)*0.5+fy/fd*0.8;}}
  // Block: ยกโล่ค้างไว้ หันหน้าหากระสุน (ระดับยาก = ยกตอนใกล้โดน → Perfect Parry)
  const canSh=p.pathIdx!==2&&!p.aug&&!p.wwAim&&p.shieldBroken<=0;
  if(p.pathIdx!==2&&!classPlan)inp.sh=0;
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
    }else if(Math.random()<L.dodge){if(p.pathIdx===NATUREP||Math.random()<0.5||p.cd.dodge>0)inp.c.jp=(inp.c.jp|0)+1;else{const s=Math.random()<0.5?1:-1;inp.mx=-pr.vy/sp*s;inp.my=pr.vx/sp*s;inp.c.sp=(inp.c.sp|0)+1;}}
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
const BOT_MODES=['coop','duel','ffa','tdm','br','siege'];
function lobbyBots(){return bots().filter(p=>p.ai.lb);}
function lobbyBotAdd(path,lv,quiet){
  if(!G||G.ph!=='lobby')return;
  const M=MODES[G.mode]||{};if(plist().length>=Math.min(ROOM_MAX,M.max||6))return toast('ห้องเต็มแล้วสำหรับโหมดนี้');
  const ok=PATHS.map((P,i)=>i).filter(i=>!PATHS[i].off),P=path>=0&&ok.includes(path)?path:ok[Math.floor(Math.random()*ok.length)];
  const p=spawnBot(P,lv,800,500,null,NET.myId);if(!p)return toast('บอทเต็มแล้ว');
  p.ai.lb=1;EVL.pop();if(NET.online)EVN.pop();   // ไม่เล่นเอฟเฟกต์เกิดในห้องรอ
  if(!quiet)broadcastLobby();return p;
}
// เติมบอทจนเต็มห้องตามโหมด (ธาตุ/ความเก่งตามที่เลือก, สุ่มธาตุ = สุ่มทีละตัว) • ทีม: addPlayer แบ่งฝั่งให้เท่ากันเอง
function lobbyBotFill(path,lv){
  if(!G||G.ph!=='lobby')return;const M=MODES[G.mode]||{},cap=Math.min(ROOM_MAX,M.max||6);let n=0;
  while(plist().length<cap&&lobbyBotAdd(path,lv,1))n++;
  broadcastLobby();toast(n?'เพิ่มบอท '+n+' ตัว — ห้องเต็มแล้ว':'ห้องเต็มแล้วสำหรับโหมดนี้');
}
function lobbyBotCmd(id,c){
  const p=G&&G.ph==='lobby'&&G.players[id];if(!p||!p.ai||!p.ai.lb)return;
  if(c==='x')hostRemove(id);else if(c==='t'){p.lteam^=1;broadcastLobby();}
}
// ตอนเริ่มแมตช์ (hostStart หลังวางจุดเกิด): ทีมตามโหมด + จุดกลับ = จุดเกิด + ล้างความจำเป้า/ทาง
function lobbyBotsStart(){for(const p of lobbyBots()){p.ai.team=p.team;p.ai.home={x:p.x,y:p.y};p.ai.tg=null;p.nav=null;p.inp=emptyInput();}}
// ดีบัก (คอนโซล): WD.bot(path, lv, n, side) = เสกบอทจากชื่อเรา (side 'A'/'B' = บอทสังเวียน) • WD.bot() = ลบบอททั้งหมด
function botDebug(path,lv,n,side){const me=G&&G.players[NET.myId];if(!me)return;if(path===undefined)return removeBots();trBotCmd(me,side?{c:'bot',p:path,lv,n,side}:{c:'bot',p:path,lv,n});return bots().map(q=>q.name);}
