// =====================================================================
//  🏰 โหมดบุกปราสาท (siege) — แบบ Basic ตาม designs/castle-gameplay-concept.md + แผนที่ js/02-fcs.js
//  ทีม 0 (ฟ้า) = ฝ่ายบุก • ทีม 1 (แดง) = ฝ่ายรับ • 3 เฟส แบบ Breakthrough: แต่ละเฟสมีพื้นที่เล่น + จุดเกิดคู่ + แกน 1 จุด
//  เริ่ม: ฝ่ายรับมีเวลาเตรียมตัว (ฝ่ายบุกออกจากจุดเกิดไม่ได้) • ฝ่ายบุกเข้าเขตแกนแล้วกด G = ร่ายทำลายแกนต่อเนื่อง
//    ร่ายหยุดเมื่อ: ยิง/ยกโล่/ใช้สกิล/พุ่ง, โดนสตัน, ออกนอกเขต, ตาย, กด G อีกครั้ง
//    ดาเมจรวมต่อแกน × คนร่าย 1 / 1.2 / 1.4 (3 คนขึ้นไป) • มีฝ่ายรับในเขต = ลดลงคงที่ (ไม่ลดตามจำนวนคน)
//  แกนแตก = เฟสถัดไป (เวลาเพิ่ม + จุดเกิดย้าย + พื้นที่เปลี่ยน, แกน 1 แตก = ประตูเปิด) • แกนสุดท้ายแตก = ฝ่ายบุกชนะ
//  หมดเวลา: มีฝ่ายบุกในเขตแกน = ต่อเวลา (มีฝ่ายรับในเขต = แกนไม่รับดาเมจ, ฝ่ายบุกออกหมด = นับผ่อนผัน 5→1 วิ) • ไม่มี = ฝ่ายรับชนะ
//  แกนแตก (ไม่ใช่แกนสุดท้าย) + แมพมี Loot Area = ถอย (trT) → ช่วงชิงของ (lootT, ของชั่วคราว SG_ITEMS) → เฟสถัดไป • เวลาหลักหยุดระหว่างนั้น
//  ⚠ ตัวเลขทั้งหมดใน SGV = ค่าตั้งต้นชั่วคราว (เอกสารยังไม่กำหนด) ให้ทีมเกมเพลย์ปรับ
//  ยังไม่ทำ (รอคุยตามเอกสาร): สลับฝั่งรอบสอง, ซ่อมแกน, ยาฮีล/จุดฮีล, เปลี่ยนสายที่จุดเกิด, เสียงร่าย
// =====================================================================
const SGV={
  time0:330,     // เวลาบุกตั้งต้น (วิ)
  add:180,       // เวลาที่ได้เพิ่มเมื่อทำลายแกน (วิ)
  prep:20,       // เวลาเตรียมตัวฝ่ายรับก่อนเปิดบุก (วิ)
  coreHp:1000,   // เลือดแกน
  rate:22,       // ดาเมจ/วิ ของคนร่าย 1 คน (~45 วิ ต่อแกนถ้าไม่มีใครขัด)
  mul:[0,1,1.2,1.4],   // ตัวคูณดาเมจรวมตามจำนวนคนร่าย (ผู้ใช้กำหนด)
  defMul:0.5,    // มีฝ่ายรับในเขต: เหลือส่วนนี้ (ช่วงปกติ)
  zoneR:330,     // รัศมีเขตแกน (px)
  wallHp:400,    // เลือดกำแพงพังได้
  grace0:5,graceMin:1,graceT:60,
  lootT:45,      // loot phase length (s) after the retreat, main timer paused ⚠ temporary
  pickR:70,      // item pickup radius (px)
  trT:20,        // core fell: seconds for defenders to retreat into the next area before the next phase starts (attackers held at the old line, timer paused)   // ผ่อนผันตอนต่อเวลา: เริ่ม 5 วิ หดเหลือ 1 วิ ภายใน 60 วิของการต่อเวลา
};
const SG_TEAM=['ฝ่ายบุก','ฝ่ายรับ'];
// ---- loot-phase items (designs/castle-gameplay-concept.md "ลำดับแมตช์ใหม่") — item kinds are still open for the gameplay team ----
// Registry: a new kind = one entry. n name • ic HUD icon • col 3D/HUD colour • max carried per player (optional)
//   hooks (all optional, host only): pick(p) on pickup • drop(p) when it falls off a dead holder • tick(p,dt,count) every frame while carried
// Map Builder Item Spawn tier 1–3 → kind via SG_ITEM_T. Carried items fall where the holder dies; dropped during the loot phase = gone when
// it ends, dropped later = stays until picked up.
const SG_ITEMS={
  shard:{n:'ผลึกฟื้นฟู (ของชั่วคราว)',ic:'💠',col:'#6ff0c8',max:3,tick(p,dt,c){if(p.hp<p.maxHp)p.hp=Math.min(p.maxHp,p.hp+3*c*dt);}},   // placeholder: +3 HP/s per shard
};
const SG_ITEM_T=['shard','shard','shard'];
const SG_CARRY=3;   // items one player can hold (all kinds)
function sgF(){return sgFD();}   // js/02-fcs.js: code fcs or a Map Builder siege map
function sgCore(){const S=G.sg;return S?sgF().cores[S.ph-1]:null;}
function sgInZone(p,k){k=k||sgCore();return !!k&&Math.hypot(p.x-k.x,p.y-k.y)<SGV.zoneR+PR;}
function sgSpawn(t,ph){const s=sgF().sp[t?'B':'A'][ph||G.sg.ph];return s||{x:MW/2,y:MH/2};}
function sgInit(){
  const F=sgF();SGPH=1;SGTR=0;
  SGLT=0;G.sg={it:[],lt:0,tr:0,ph:1,prep:SGV.prep,ot:false,otT:0,grace:SGV.grace0,win:-1,atk:0,hp:F.cores.map(()=>SGV.coreHp),bw:F.bw.map(b=>b.k==='gate'?-1:SGV.wallHp),t0:0};
  G.timer=SGV.time0;AREA=mapArea(G.map,G.mode);
  sgWallsApply();
  for(const p of plist())p.sgc=0;
  banner(`🏰 ${SG_TEAM[1]} (${TEAMN[1]}) เตรียมตัว ${SGV.prep} วิ — ${SG_TEAM[0]} (${TEAMN[0]}) รอประตูเปิด`,4);
}
// สถานะกำแพง/ประตูลงที่ชน (hgt 0 = เดิน/ยิงผ่านได้) • gate = เปิดตั้งแต่เฟส 2
function sgWallsApply(){
  const S=G.sg,F=sgF();
  for(const o of OBS){if(o.sgw===undefined)continue;const b=F.bw[o.sgw],open=b.k==='gate'?S.ph>=2:S.bw[o.sgw]<=0;o.hgt=open?0:b.h;}
  phTick();   // phase layers (js/28-maps-build)
}
function sgWallDmg(i,dmg,x,y){
  const S=G.sg;if(!S||S.bw[i]===undefined||S.bw[i]<=0)return;   // ประตู (-1) ไม่โดนดาเมจ
  S.bw[i]-=dmg;
  if(S.bw[i]<=0){S.bw[i]=0;sgWallsApply();const b=sgF().bw[i];emit({k:'sgwall',i,x:Math.round(b.x+b.w/2),y:Math.round(b.y+b.d/2)});feed('🧱 กำแพงพังแล้ว — มีทางใหม่!');}
}
// กระสุนชนวงกำแพงพังได้ (updateProjectiles js/12) • คาถาวงกว้าง (damageEnv)
function sgWallHit(c,pr){if(G.mode==='siege')sgWallDmg(c.sgw,pr.dmg||8,pr.x,pr.y);}
function sgWallEnv(x,y,rad,dmg){
  if(G.mode!=='siege'||!G.sg||!(MAPS[MAPID]&&MAPS[MAPID].fcs))return;
  sgF().bw.forEach((b,i)=>{if(G.sg.bw[i]<=0)return;const dx=Math.max(b.x-x,0,x-(b.x+b.w)),dy=Math.max(b.y-y,0,y-(b.y+b.d));if(Math.hypot(dx,dy)<rad)sgWallDmg(i,dmg,x,y);});
}
// ปุ่ม (updatePlayer js/11): G = เริ่ม/หยุดร่ายที่แกน • ยิง/โล่/สกิล/พุ่ง = หยุดร่าย
function sgInput(p,pr,inp){
  const S=G.sg;if(!S||G.ph!=='play')return;
  if(p.sgc&&(inp.fire||inp.sh||pr.q||pr.e||pr.r||pr.f||pr.x||pr.sp||p.dash>0))sgStop(p);
  if(!pr.g||!p.alive||p.downed)return;
  if(p.sgc){sgStop(p);return;}
  if(p.team!==0||S.prep>0||S.tr>0||S.lt>0||!sgInZone(p)||p.stun>0)return;
  p.sgc=1;emit({k:'sgch',id:p.id,on:1});
}
function sgStop(p){if(!p.sgc)return;p.sgc=0;emit({k:'sgch',id:p.id,on:0});}
function sgTick(dt){
  const S=G.sg,F=sgF(),ps=plist(),k=sgCore();if(!S||!k)return;
  // จุดเกิดปลอดภัย: คนในทีมอยู่ในเขตจุดเกิดของตัวเอง = ไม่โดนดาเมจ
  for(const p of ps){if(!p.alive||(p.team!==0&&p.team!==1))continue;const s=sgSpawn(p.team);if(Math.hypot(p.x-s.x,p.y-s.y)<SG_SPR)p.inv=Math.max(p.inv,0.15);}
  if(S.prep>0){   // เตรียมตัว: ฝ่ายบุกออกจากเขตจุดเกิดไม่ได้
    S.prep-=dt;
    for(const p of ps){if(p.team!==0||!p.alive)continue;const s=sgSpawn(0),d=Math.hypot(p.x-s.x,p.y-s.y),m=SG_SPR-PR;if(d>m){p.x=s.x+(p.x-s.x)/d*m;p.y=s.y+(p.y-s.y)/d*m;}}
    if(S.prep<=0){S.prep=0;banner('⚔️ ประตูเปิด! บุกได้',3);}
    return;
  }
  sgItemsTick(dt);
  if(S.tr>0){   // phase transition: no core casting, timer paused
    S.tr-=dt;SGTR=Math.max(0,S.tr);
    if(S.tr<=0){if(sgHasLoot(S.ph-1))sgLootGo();else sgPhaseGo();}
    return;
  }
  if(S.lt>0){   // loot phase: own timer, main timer paused
    S.lt-=dt;SGLT=Math.max(0,S.lt);
    if(S.lt<=0)sgLootEnd();
    return;
  }
  // ร่ายแกน
  let n=0,def=0,atkIn=0;
  for(const p of ps){
    if(!p.alive||p.downed){if(p.sgc)sgStop(p);continue;}
    const inz=sgInZone(p,k);
    if(p.team===1&&inz)def++;
    if(p.team===0&&inz)atkIn++;
    if(p.sgc){if(!inz||p.stun>0)sgStop(p);else n++;}
  }
  S.atk=n>0?1:0;S.def=def>0?1:0;
  if(n){const m=SGV.mul[Math.min(3,n)],red=def?(S.ot?0:SGV.defMul):1;S.hp[S.ph-1]-=SGV.rate*m*red*dt;}
  if(S.hp[S.ph-1]<=0){sgCoreDown();return;}
  // เวลา / ต่อเวลา
  if(!S.ot){
    G.timer-=dt;
    if(G.timer<=0){G.timer=0;if(atkIn){S.ot=true;S.otT=0;S.grace=SGV.grace0;banner('⏱ ต่อเวลา! ฝ่ายรับอยู่ในเขต = แกนไม่รับดาเมจ',3);}else sgEnd(1);}
  }else{
    S.otT+=dt;const gmax=Math.max(SGV.graceMin,SGV.grace0-(SGV.grace0-SGV.graceMin)*S.otT/SGV.graceT);
    if(atkIn)S.grace=gmax;else{S.grace-=dt;if(S.grace<=0)sgEnd(1);}
  }
}
function sgCoreDown(){
  const S=G.sg,F=sgF();S.hp[S.ph-1]=0;
  for(const p of plist())sgStop(p);
  const k=sgCore();emit({k:'sgcore',n:S.ph,x:Math.round(k.x),y:Math.round(k.y)});
  if(S.ph>=F.n){sgEnd(0);return;}
  S.ph++;SGPH=S.ph;S.ot=false;S.otT=0;G.timer+=SGV.add;
  // Breakthrough-style: nobody is teleported now. Defenders get SGV.trT s to fall back into the new area, attackers are held at the old
  // line (area = old + new, attackers clamped to the old rects — sgAreaT js/02-fcs), respawns already use the new spawns.
  S.tr=SGV.trT;SGTR=S.tr;
  AREA=mapArea(G.map,G.mode);sgWallsApply();
  banner(`💥 แกน ${S.ph-1} แตก! ${S.ph===2?'ประตูเปิด • ':''}${SG_TEAM[1]}ถอยเข้าเขตใหม่ — `+(sgHasLoot(S.ph-1)?`ช่วงชิงของเริ่มใน ${SGV.trT} วิ`:`เฟส ${S.ph} เริ่มใน ${SGV.trT} วิ`),4);
}
// transition over: next phase live. Defenders still outside the new area die (out of bounds), attackers left behind move to their new spawn.
// soft (after a loot phase, nobody had time to fall back): defenders outside go to their spawn too instead of dying
function sgPhaseGo(soft){
  const S=G.sg;S.tr=0;SGTR=0;S.lt=0;SGLT=0;AREA=mapArea(G.map,G.mode);
  let i=0;
  for(const p of plist()){if(!p.alive||(p.team!==0&&p.team!==1)||sgInArea(p.x,p.y,S.ph))continue;
    if(p.team===1&&!soft){p.inv=0;damage(p,99999,null,'zone',true);continue;}
    const s=sgSpawn(p.team),a=i*1.047,rr=i%6?80:0,q=[s.x+Math.cos(a)*rr,s.y+Math.sin(a)*rr];i++;p.x=q[0];p.y=q[1];p.z=0;p.vz=0;collideWorld(p,PR);p.inv=Math.max(p.inv,1.5);emit({k:'revive',x:p.x,y:p.y});}
  banner(`⚔️ เฟส ${S.ph} เริ่ม! ไปแกน ${S.ph}`,3);
}
// ---- loot phase (after core b = S.ph-1 fell, between the retreat and the next point) ----
function sgLootR(b){const F=sgF();return (F.loot&&F.loot[b])||[];}
function sgHasLoot(b){return b>=1&&sgLootR(b).length>0;}
function sgLootGo(){
  const S=G.sg,F=sgF(),b=S.ph-1;S.tr=0;SGTR=0;S.lt=SGV.lootT;SGLT=S.lt;
  let pts=(F.items||[]).filter(i=>i.ph===b);
  if(!pts.length)pts=sgLootR(b).map(q=>({x:(q.x1+q.x2)/2,y:(q.y1+q.y2)/2,t:1}));   // area without Item Spawn points: one item in the middle of each rect
  for(const i of pts)S.it.push({k:SG_ITEM_T[(i.t||1)-1]||'shard',x:i.x,y:i.y,tmp:1});
  AREA=mapArea(G.map,G.mode);
  banner(`🎁 ช่วงชิงของ! เก็บของในเขตทอง ${SGV.lootT} วิ (ตาย = ของหล่น) — จากนั้นเฟส ${S.ph}`,4);
}
function sgLootEnd(){
  const S=G.sg;S.it=S.it.filter(o=>!o.tmp);   // loot-phase items not taken + dropped during it vanish
  sgPhaseGo(true);
}
// pickup on touch • carried-item effects • carried items fall off dead holders (host, every frame)
function sgItemsTick(dt){
  const S=G.sg;if(!S.it)S.it=[];
  for(const p of plist()){const c=p.sgi;
    if(!p.alive){if(c&&c.length){c.forEach((k,i)=>{const a=i*2.4+1;S.it.push({k,x:p.x+Math.cos(a)*28,y:p.y+Math.sin(a)*28,tmp:S.lt>0?1:0});const I=SG_ITEMS[k];if(I&&I.drop)I.drop(p);});p.sgi=[];}continue;}
    if(p.team!==0&&p.team!==1)continue;
    if(c&&c.length){const n={};for(const k of c)n[k]=(n[k]||0)+1;for(const k in n){const I=SG_ITEMS[k];if(I&&I.tick)I.tick(p,dt,n[k]);}}
    if(p.downed||(c&&c.length>=SG_CARRY))continue;
    for(let i=0;i<S.it.length;i++){const o=S.it[i],I=SG_ITEMS[o.k];if(!I||Math.hypot(o.x-p.x,o.y-p.y)>SGV.pickR)continue;
      if(I.max&&(p.sgi||[]).filter(k=>k===o.k).length>=I.max)continue;
      (p.sgi=p.sgi||[]).push(o.k);S.it.splice(i,1);if(I.pick)I.pick(p);emit({k:'sgitem',x:Math.round(o.x),y:Math.round(o.y),it:o.k});break;}
  }
}
function sgEnd(w){const S=G.sg;if(S.win>=0)return;S.win=w;endMatch();}
// ผลจบเกม (endMatch js/14)
function sgResult(ps){
  const S=G.sg||{win:1,ph:1},w=S.win<0?1:S.win,win=ps.filter(p=>p.team===w).map(p=>p.id);
  const title=w===0?`🏆 ${SG_TEAM[0]} (${TEAMN[0]}) ยึดปราสาทสำเร็จ!`:`🛡️ ${SG_TEAM[1]} (${TEAMN[1]}) ป้องกันปราสาทได้!`;
  const sub=w===0?'ทำลายแกนครบทั้ง 3 จุด':`ฝ่ายบุกทำลายได้ ${S.ph-1} แกน • แกน ${S.ph} เหลือ ${Math.ceil(Math.max(0,S.hp[S.ph-1]||0)/SGV.coreHp*100)}%`;
  return {title,sub,win};
}
function sgSnap(){
  const S=G.sg;if(!S)return null;
  return {ph:S.ph,n:sgF().n,pr:Math.ceil(S.prep),tr:Math.ceil(S.tr||0),hp:S.hp.map(v=>Math.max(0,Math.round(v))),mx:SGV.coreHp,ot:S.ot?1:0,gr:S.ot?Math.round(S.grace*10)/10:0,atk:S.atk|0,def:S.def|0,
    bw:S.bw.map((v,i)=>sgF().bw[i].k==='gate'?(S.ph>=2?1:0):v<=0?1:0).join(''),zr:SGV.zoneR,
    lt:Math.ceil(S.lt||0),lc:sgHasLoot(S.ph-1)?1:0,it:(S.it||[]).map(o=>o.k+','+Math.round(o.x)+','+Math.round(o.y)).join(';'),   // ground items
    iv:plist().filter(p=>p.sgi&&p.sgi.length).map(p=>p.id+':'+p.sgi.join('.')).join(';')};   // carried items
}
// =====================================================================
//  บอทเล่นบุกปราสาท: ฝ่ายบุก = เดินไปแกนแล้วร่าย (เจอศัตรูใกล้ = สู้ก่อน) • ฝ่ายรับ = เฝ้ารอบแกน ไล่คนที่เข้าใกล้แกน
//  ต่อสู้ใช้สมองเดิม (aiBot + botPlay ตามสาย) • เดินไกลใช้ตารางหาทาง (js/15-botnav)
// =====================================================================
const SGB={atkSee:800,defSee:850,defCore:2200,ring:200,brkD:70,brkDps:10};   // brkD = stand this close (px) to a wall being broken   // ระยะสนใจศัตรู (px) • รัศมียืนรอบแกน ⚠ ค่าตั้งต้น
// เป้าที่ "เกี่ยวกับภารกิจ": บุก = ศัตรูใกล้ตัว • รับ = ศัตรูใกล้ตัวหรือใกล้แกน
function sgBotTarget(p){
  const k=sgCore();let best=null,bd=1e18;
  for(const q of plist()){if(q===p||!q.alive||q.downed||q.team===p.team||q.gh)continue;
    const d=Math.hypot(q.x-p.x,q.y-p.y),dk=k?Math.hypot(q.x-k.x,q.y-k.y):1e9;
    if(d>SGB.defCore+SGB.defSee)continue;
    const vis=d<220||(navOn()&&NAV.s&&!navRay(p.x,p.y,q.x,q.y,true));   // มองเห็น (ไม่มีกำแพงสูงบัง) หรือประชิด
    const ok=p.team===0||G.sg.lt>0?d<SGB.atkSee&&vis:(d<SGB.defSee&&vis)||dk<SGV.zoneR*2.5;if(!ok)continue;   // loot phase: both sides fight whoever is near
    const s=p.team===1?Math.min(d,dk*0.8):d;if(s<bd){bd=s;best=q;}}
  return best;
}
// ---- team plan (user 2026-11-22: don't trickle in one by one) ----
// attackers: rally point R on the planned route ~SGT.rally px before the core • gather there, push together as a "wave" when enough are in,
// join a live push if friends are already fighting at the core, fall back to R when alone + outnumbered + hurt • defenders: fall back to the core
const SGT={rally:950,rallyR:380,maxWait:20,waveEnd:6,pushT:45,outn:2,hurt:0.55,near:600};   // ⚠ starting values
function sgTeamPlan(t){
  const S=G.sg;if(!S)return null;S.tp=S.tp||[{},{}];const T=S.tp[t],k=sgCore();
  if(T.at>G.time-0.4&&T.ph===S.ph)return T;T.at=G.time;
  if(T.ph!==S.ph){T.ph=S.ph;T.R=null;T.rt=0;T.wave=0;T.wt=G.time;}
  const all=plist().filter(q=>q.team===t&&!q.gh),alive=all.filter(q=>q.alive&&!q.downed),foes=plist().filter(q=>q.team!==t&&q.alive&&!q.downed&&!q.gh);
  if(t===0&&k&&(!T.R||G.time>T.rt)){T.rt=G.time+5;navEnsure();const sp=sgSpawn(0),P=navPath(sp.x,sp.y,k.x,k.y,true);let R=sp;
    if(P){const pts=[sp].concat(P);for(let i=pts.length-1;i>=0;i--)if(Math.hypot(pts[i].x-k.x,pts[i].y-k.y)>=SGT.rally&&!pts[i].b){R=pts[i];break;}}
    T.R={x:R.x,y:R.y};}
  const fz=SGV.zoneR*1.7;
  T.front=alive.filter(q=>k&&Math.hypot(q.x-k.x,q.y-k.y)<fz).length;
  T.atR=T.R?alive.filter(q=>Math.hypot(q.x-T.R.x,q.y-T.R.y)<SGT.rallyR).length:0;
  T.foes=foes.length;T.n=all.length;
  const soon=all.filter(q=>!q.alive&&(q.respawn||0)<6).length;   // friends respawning soon are worth waiting for
  T.need=Math.max(1,Math.min(all.length,Math.max(2,Math.ceil(foes.length*0.8))));
  const late=S.ot||G.timer<SGT.pushT;
  const sp0=sgSpawn(t);T.com=T.R?alive.filter(q=>Math.hypot(q.x-T.R.x,q.y-T.R.y)>SGT.rallyR&&Math.hypot(q.x-sp0.x,q.y-sp0.y)>400&&!(q.ai&&q.ai.sgm==='back')).length:0;   // committed = out past the rally point
  if(T.wave&&T.com===0&&!alive.some(q=>q.sgn&&q.sgn.bz)&&G.time-T.wt>SGT.waveEnd){T.wave=0;T.wt=G.time;}   // push died out (nobody left out front) → gather again
  if(!T.wave&&(late||T.atR>=T.need||(T.atR>=1&&T.atR+soon<T.need&&T.atR>=alive.length)&&G.time-T.wt>SGT.maxWait||G.time-T.wt>SGT.maxWait*2)){T.wave=1;T.wt=G.time;}
  T.late=late;return T;
}
// should this bot push to the core now, go to the rally point, or fall back? → 'push' | 'rally' | 'back'
function sgBotMode(p){
  const S=G.sg;if(!S||S.prep>0||S.tr>0||S.lt>0)return 'push';
  const T=sgTeamPlan(p.team),k=sgCore();if(!T||!k)return 'push';
  if(p.sgc||sgInZone(p))return 'push';
  const nf=plist().filter(q=>q.team!==p.team&&q.alive&&!q.downed&&!q.gh&&Math.hypot(q.x-p.x,q.y-p.y)<SGT.near).length,
        na=plist().filter(q=>q!==p&&q.team===p.team&&q.alive&&!q.downed&&Math.hypot(q.x-p.x,q.y-p.y)<SGT.near).length;
  if(nf>=na+1+SGT.outn&&p.hp<p.maxHp*SGT.hurt&&!T.late)return 'back';   // alone + outnumbered + hurt
  if(p.team===1)return 'push';
  if(T.late||T.n<=1)return 'push';
  if(T.wave&&(T.front>=2||(T.R&&Math.hypot(p.x-T.R.x,p.y-T.R.y)<SGT.rallyR+150)||Math.hypot(p.x-k.x,p.y-k.y)<SGT.rally+250))return 'push';   // late respawner: join only a push that is still alive
  if(T.front>=Math.max(1,T.need-1))return 'push';   // friends already fighting at the core → regroup with them
  return 'rally';
}
// first breakable on a planned path → where to stand/aim {x,y,ah,id} (siege wall box or breakable panel cell)
function sgBreachAim(p,id,px,py){
  if(id<256){const b=sgF().bw[id-1];if(!b)return null;return {id,x:clamp(p.x,b.x,b.x+b.w),y:clamp(p.y,b.y,b.y+b.d),ah:2};}
  const q=PNL[id-256];if(!q)return null;const [u0]=pnLoc(q,px,py),c0=clamp(Math.floor((u0+q.hl)/q.cw),0,q.nc-1),rB=Math.min(q.nr-1,Math.floor(PN_BODY/q.chh));
  for(const dc of [0,-1,1,-2,2])for(let r=0;r<=rB;r++){const col=c0+dc,kk=r*q.nc+col;if(col<0||col>=q.nc||!pnSolid(q,kk))continue;const P3=pnCellPos(q,kk);return {id,k:kk,x:P3[0],y:P3[1],ah:P3[2]};}
  return null;
}
// จุดที่บอทควรไป
function sgBotGoal(p){
  const S=G.sg,k=sgCore();if(!S||!k)return {x:p.x,y:p.y};
  if(p.team===0&&S.prep>0)return sgSpawn(0);
  p.ai.lootGo=0;
  if(S.lt>0)return sgBotLoot(p);
  if(S.tr>0&&sgHasLoot(S.ph-1)){const H=sgF().hold&&sgF().hold[p.team?'B':'A'][S.ph-1];if(H&&H.length)return sgBotIn(p,H,'hd');}   // retreat zone of the team
  if(p.team===0&&S.tr>0){const o=sgF().phases[S.ph-2];if(o){const k=sgCore();let bx=p.x,by=p.y,bd=1e18;for(const q of o){const x=clamp(k.x,q.x1+60,q.x2-60),y=clamp(k.y,q.y1+60,q.y2-60),d=(x-k.x)**2+(y-k.y)**2;if(d<bd){bd=d;bx=x;by=y;}}return {x:bx,y:by};}}   // wait at the old line, nearest the new core
  const md=p.ai.sgm=sgBotMode(p),T=S.tp&&S.tp[p.team];
  if(md==='back'&&p.team===1){const h=hashStr(p.id)%628/100;return {x:k.x+Math.cos(h)*SGB.ring*0.5,y:k.y+Math.sin(h)*SGB.ring*0.5};}
  if(p.team===0&&md!=='push'&&T&&T.R){const h=hashStr(p.id)%628/100,r=120;return {x:T.R.x+Math.cos(h)*r,y:T.R.y+Math.sin(h)*r};}
  if(p.team===0){const h=hashStr(p.id)%628/100,r=SGB.ring*0.6;return {x:k.x+Math.cos(h)*r,y:k.y+Math.sin(h)*r};}
  // ฝ่ายรับ: เดินลาดตระเวนรอบแกน (เปลี่ยนจุดทุก 4–8 วิ) — เดิมยืนนิ่งจุดเดียวจนดูเหมือนค้าง (ผู้ใช้ 2026-11-08)
  const A=p.ai;if(!A.pat||A.pat.k!==S.ph||G.time>A.pat.t){
    for(let n=0;n<12;n++){const a=Math.random()*6.283,r=rnd(SGB.ring*0.5,SGV.zoneR*1.2),x=k.x+Math.cos(a)*r,y=k.y+Math.sin(a)*r;
      if(sgInArea(x,y,S.ph)&&(!navOn()||!NAV.w||navWalk(x,y))){A.pat={k:S.ph,t:G.time+rnd(4,8),x,y};break;}}
    if(!A.pat||A.pat.k!==S.ph)A.pat={k:S.ph,t:G.time+2,x:k.x+SGB.ring,y:k.y};}
  return {x:A.pat.x,y:A.pat.y};
}
// a spot inside rects R (spread per bot, re-picked every 6–10 s) • key = cache slot on p.ai
function sgBotIn(p,R,key){
  const A=p.ai,S=G.sg,c=A[key];
  if(c&&c.ph===S.ph&&G.time<c.t&&R.some(q=>c.x>=q.x1&&c.x<=q.x2&&c.y>=q.y1&&c.y<=q.y2))return c;
  let best=null;
  for(let n=0;n<10;n++){const q=R[Math.floor(Math.random()*R.length)],x=rnd(q.x1+60,Math.max(q.x1+60,q.x2-60)),y=rnd(q.y1+60,Math.max(q.y1+60,q.y2-60));
    best={ph:S.ph,t:G.time+rnd(6,10),x,y};if(!navOn()||!NAV.w||navWalk(x,y))break;}
  A[key]=best;return best;
}
// loot phase goal: nearest free item (not already claimed by a closer teammate) • full bag / nothing left = hold a spot in the loot area
function sgBotLoot(p){
  const S=G.sg,A=p.ai,R=sgLootR(S.ph-1),full=(p.sgi||[]).length>=SG_CARRY;
  if(!full&&S.it.length){let best=null,bd=1e18;
    for(const o of S.it){const I=SG_ITEMS[o.k];if(!I||(I.max&&(p.sgi||[]).filter(k=>k===o.k).length>=I.max))continue;
      const d=Math.hypot(o.x-p.x,o.y-p.y);if(d>2600)continue;
      if(plist().some(q=>q!==p&&q.ai&&q.team===p.team&&q.alive&&q.ai.lootT===o&&Math.hypot(o.x-q.x,o.y-q.y)<d))continue;   // a closer teammate goes for it
      if(d<bd){bd=d;best=o;}}
    A.lootT=best;if(best){A.lootGo=1;return {x:best.x,y:best.y};}}
  A.lootT=null;
  return R.length?sgBotIn(p,R,'lz'):{x:p.x,y:p.y};
}
// กันบอทค้าง (ทุกสถานการณ์ในโหมดนี้): ตั้งใจเดินแต่ 1.2 วิขยับไม่ถึง 25 px = เลี่ยงไปทางที่เดินได้ใกล้ทิศเดิมสุด 0.7 วิ + คิดทางใหม่
function sgUnstick(p,dt){
  const inp=p.inp,U=p.sgu||(p.sgu={t:1.2,x:p.x,y:p.y,e:0,ex:0,ey:0});
  if(U.e>0){U.e-=dt;inp.mx=U.ex;inp.my=U.ey;return;}
  const m=Math.hypot(inp.mx||0,inp.my||0);U.t-=dt;
  if(U.t>0)return;
  const moved=Math.hypot(p.x-U.x,p.y-U.y);U.t=1.2;U.x=p.x;U.y=p.y;
  if(m<0.3||moved>=25||p.sgc||p.stun>0)return;
  const a0=Math.atan2(inp.my,inp.mx);let best=null;
  for(const da of [1.57,-1.57,0.8,-0.8,2.4,-2.4,3.14]){const a=a0+da*(U.sd=U.sd?-U.sd:1);if(!NAV.w||navWalk(p.x+Math.cos(a)*130,p.y+Math.sin(a)*130)){best=a;break;}}
  if(best===null)best=a0+Math.PI;
  U.e=0.7;U.ex=Math.cos(best);U.ey=Math.sin(best);inp.mx=U.ex;inp.my=U.ey;
  if(p.nav){p.nav.path=null;p.nav.rp=0;}if(p.sgn)p.sgn.path=null;
}
function sgBotThink(p,dt){
  const A=p.ai,inp=p.inp;
  if(!p.alive||p.downed){aiBot(p,dt);return;}
  A.home=sgBotGoal(p);
  const c0=Object.assign({},inp.c);
  aiBot(p,dt);
  let tg=A.tg&&A.tg.alive&&!A.tg.downed?A.tg:null;
  if(tg&&A.sgm==='back'&&Math.hypot(tg.x-p.x,tg.y-p.y)>200){tg=null;for(const kk of SLOTK.concat(['x']))inp.c[kk]=c0[kk]|0;}   // falling back: don't stop to trade shots
  if(tg&&p.team===0&&A.sgm==='rally'&&Math.hypot(tg.x-p.x,tg.y-p.y)>SGB.atkSee*0.6){tg=null;for(const kk of SLOTK.concat(['x']))inp.c[kk]=c0[kk]|0;}   // gathering: only fight what comes close
  if(tg&&A.lootGo&&Math.hypot(A.home.x-p.x,A.home.y-p.y)<320&&Math.hypot(tg.x-p.x,tg.y-p.y)>170){tg=null;for(const kk of SLOTK.concat(['x']))inp.c[kk]=c0[kk]|0;}   // item right there: grab it first
  if(tg){   // เดินไปหาเป้าไม่ได้ (กำแพงพังได้ขวาง) = ไม่สนเป้านี้ ไปทำภารกิจ/พังกำแพงก่อน
    const N=p.sgn||(p.sgn={path:null,t:0,gx:0,gy:0});N.rt=(N.rt||0)-dt;
    if(N.rt<=0||N.rtg!==tg){N.rt=1;N.rtg=tg;navEnsure();N.reach=Math.hypot(tg.x-p.x,tg.y-p.y)<220||!!navPath(p.x,p.y,tg.x,tg.y);}
    if(!N.reach){tg=null;for(const kk of SLOTK.concat(['x']))inp.c[kk]=c0[kk]|0;}
  }
  if(tg){botNav(p,dt,c0,tg);sgUnstick(p,dt);if(p.pathIdx===LIGHTP)botLightSupport(p);return;}
  // ไม่มีศัตรูเกี่ยวข้อง: เดินไปจุดภารกิจตามทาง
  const S=G.sg,g=A.home,d=Math.hypot(g.x-p.x,g.y-p.y);
  inp.fire=0;inp.sh=0;
  if(d>60){navEnsure();const N=p.sgn||(p.sgn={path:null,t:0,gx:0,gy:0});N.t-=dt;
    if(N.t<=0||!N.path||Math.hypot(g.x-N.gx,g.y-N.gy)>80){N.t=rnd(0.7,1.1);N.gx=g.x;N.gy=g.y;N.path=navPath(p.x,p.y,g.x,g.y,p.team===0?1:2);}   // may plan through breakable walls (defenders prefer walking: ×2 cost)
    const P=N.path;
    N.bz=null;
    if(P&&P.length){while(P.length>1&&Math.hypot(P[0].x-p.x,P[0].y-p.y)<NAV.c*0.7&&!P[0].b)P.shift();
      for(let j=Math.min(P.length-1,6);j>0;j--){if(P.slice(0,j).some(o=>o.b))continue;if(!navRay(p.x,p.y,P[j].x,P[j].y,false)){P.splice(0,j);break;}}
      const bi=P.findIndex(o=>o.b);   // planned route goes through a breakable: walk up to it, then shoot it open
      if(bi>=0&&(bi<=1||Math.hypot(P[bi].x-p.x,P[bi].y-p.y)<300)&&!NAV.w[navCell(p.x,p.y)]){const a=sgBreachAim(p,P[bi].b,P[bi].x,P[bi].y);
        if(a){N.bz=a;S.bt=S.bt||{};S.bt[a.id]=G.time+2;}else N.path=null;}
      const wx=P[0].x-p.x,wy=P[0].y-p.y,wd=Math.hypot(wx,wy)||1;inp.mx=wx/wd;inp.my=wy/wd;}
    else{inp.mx=(g.x-p.x)/d;inp.my=(g.y-p.y)/d;}
    inp.ax=p.x+inp.mx*300;inp.ay=p.y+inp.my*300;
    // ไม่มีทาง (กำแพงพังได้ขวาง เช่น ฝ่ายรับเฟส 1 ออกจากห้องโถง) = เดินไปยิงกำแพงพังได้ที่ใกล้ที่สุด
    if(!P&&S){let bb=null,bd=3000;sgF().bw.forEach((b,i)=>{if(S.bw[i]<=0||!sgInArea(b.x+b.w/2,b.y+b.d/2,S.ph))return;const qx=clamp(p.x,b.x,b.x+b.w),qy=clamp(p.y,b.y,b.y+b.d),dd=Math.hypot(qx-p.x,qy-p.y);if(dd<bd){bd=dd;bb={x:qx,y:qy};}});
      if(bb){inp.ax=bb.x;inp.ay=bb.y;inp.ah=2;inp.fire=(G.time%0.5<0.25)?1:0;if(bd>260){const P2=navPath(p.x,p.y,bb.x,bb.y);const t=P2&&P2[0]||bb,tx2=t.x-p.x,ty2=t.y-p.y,td=Math.hypot(tx2,ty2)||1;inp.mx=tx2/td;inp.my=ty2/td;}else inp.mx=inp.my=0;
        N.kick=0;}N.br=bb?1:0;}else N.br=0;
    if(N.bz){const a=N.bz,bd2=Math.hypot(a.x-p.x,a.y-p.y);inp.ax=a.x;inp.ay=a.y;inp.ah=a.ah;inp.fire=(G.time%0.5<0.25)?1:0;N.br=1;N.kick=0;
      if(bd2>SGB.brkD){inp.mx=(a.x-p.x)/bd2;inp.my=(a.y-p.y)/bd2;}else inp.mx=inp.my=0;   // close: short-range basics (water drops) must reach
      if(bd2<SGB.brkD+40){const dm=SGB.brkDps*dt;   // melee/beam basics (frost sword, storm beam, nature whip) don't hit walls → bot breaching = steady wall damage
        if(a.id<256)sgWallDmg(a.id-1,dm,a.x,a.y);else{const q=PNL[a.id-256];if(q&&a.k>=0)pnlHit(q,a.k,dm,'none',p.x,p.y,true);}}
      for(const kk of SLOTK.concat(['x']))inp.c[kk]=0;}
  }else{inp.mx=inp.my=0;}
  // ติด: ก้าวข้างสุ่ม
  const N=p.sgn||(p.sgn={});N.st=(N.st||1.5)-dt;
  if(N.st<=0){N.st=1.5;if(!N.br&&Math.hypot(p.x-(N.sx||0),p.y-(N.sy||0))<25&&d>60){N.path=null;N.kick=0.5;N.ka=Math.random()*6.283;}N.sx=p.x;N.sy=p.y;}
  if(N.kick>0){N.kick-=dt;inp.mx=Math.cos(N.ka);inp.my=Math.sin(N.ka);}
  // ฝ่ายบุกถึงเขตแกน = กด G ร่าย แล้วยืนนิ่ง
  for(const kk of SLOTK.concat(['x']))inp.c[kk]=c0[kk]|0;   // ไม่มีเป้า = ไม่กดสกิลใส่อากาศ
  if(p.team===0&&S&&S.prep<=0&&!(S.tr>0)&&sgInZone(p)){
    const k=sgCore();inp.ax=k.x;inp.ay=k.y;
    if(!p.sgc&&!(p.stun>0)){A.gT=(A.gT||0)-dt;if(A.gT<=0){A.gT=0.6;inp.c.g=(inp.c.g|0)+1;}}
    if(p.sgc){inp.mx=inp.my=0;}
  }
  sgUnstick(p,dt);
}
