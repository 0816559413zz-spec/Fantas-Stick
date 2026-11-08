// =====================================================================
//  🏰 โหมดบุกปราสาท (siege) — แบบ Basic ตาม designs/castle-gameplay-concept.md + แผนที่ js/02-fcs.js
//  ทีม 0 (ฟ้า) = ฝ่ายบุก • ทีม 1 (แดง) = ฝ่ายรับ • 3 เฟส แบบ Breakthrough: แต่ละเฟสมีพื้นที่เล่น + จุดเกิดคู่ + แกน 1 จุด
//  เริ่ม: ฝ่ายรับมีเวลาเตรียมตัว (ฝ่ายบุกออกจากจุดเกิดไม่ได้) • ฝ่ายบุกเข้าเขตแกนแล้วกด G = ร่ายทำลายแกนต่อเนื่อง
//    ร่ายหยุดเมื่อ: ยิง/ยกโล่/ใช้สกิล/พุ่ง, โดนสตัน, ออกนอกเขต, ตาย, กด G อีกครั้ง
//    ดาเมจรวมต่อแกน × คนร่าย 1 / 1.2 / 1.4 (3 คนขึ้นไป) • มีฝ่ายรับในเขต = ลดลงคงที่ (ไม่ลดตามจำนวนคน)
//  แกนแตก = เฟสถัดไป (เวลาเพิ่ม + จุดเกิดย้าย + พื้นที่เปลี่ยน, แกน 1 แตก = ประตูเปิด) • แกนสุดท้ายแตก = ฝ่ายบุกชนะ
//  หมดเวลา: มีฝ่ายบุกในเขตแกน = ต่อเวลา (มีฝ่ายรับในเขต = แกนไม่รับดาเมจ, ฝ่ายบุกออกหมด = นับผ่อนผัน 5→1 วิ) • ไม่มี = ฝ่ายรับชนะ
//  ⚠ ตัวเลขทั้งหมดใน SGV = ค่าตั้งต้นชั่วคราว (เอกสารยังไม่กำหนด) ให้ทีมเกมเพลย์ปรับ
//  ยังไม่ทำ (รอคุยตามเอกสาร): สลับฝั่งรอบสอง, ซ่อมแกน, ช่วงแย่งของ, ยาฮีล/จุดฮีล, เปลี่ยนสายที่จุดเกิด, เสียงร่าย
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
  grace0:5,graceMin:1,graceT:60,   // ผ่อนผันตอนต่อเวลา: เริ่ม 5 วิ หดเหลือ 1 วิ ภายใน 60 วิของการต่อเวลา
};
const SG_TEAM=['ฝ่ายบุก','ฝ่ายรับ'];
function sgF(){return MAPS.fcs.fcs;}
function sgCore(){const S=G.sg;return S?sgF().cores[S.ph-1]:null;}
function sgInZone(p,k){k=k||sgCore();return !!k&&Math.hypot(p.x-k.x,p.y-k.y)<SGV.zoneR+PR;}
function sgSpawn(t,ph){const s=sgF().sp[t?'B':'A'][ph||G.sg.ph];return s||{x:MW/2,y:MH/2};}
function sgInit(){
  const F=sgF();SGPH=1;
  G.sg={ph:1,prep:SGV.prep,ot:false,otT:0,grace:SGV.grace0,win:-1,atk:0,hp:F.cores.map(()=>SGV.coreHp),bw:F.bw.map(b=>b.k==='gate'?-1:SGV.wallHp),t0:0};
  G.timer=SGV.time0;AREA=mapArea(G.map,G.mode);
  sgWallsApply();
  for(const p of plist())p.sgc=0;
  banner(`🏰 ${SG_TEAM[1]} (${TEAMN[1]}) เตรียมตัว ${SGV.prep} วิ — ${SG_TEAM[0]} (${TEAMN[0]}) รอประตูเปิด`,4);
}
// สถานะกำแพง/ประตูลงที่ชน (hgt 0 = เดิน/ยิงผ่านได้) • gate = เปิดตั้งแต่เฟส 2
function sgWallsApply(){
  const S=G.sg,F=sgF();
  for(const o of OBS){if(o.sgw===undefined)continue;const b=F.bw[o.sgw],open=b.k==='gate'?S.ph>=2:S.bw[o.sgw]<=0;o.hgt=open?0:b.h;}
}
function sgWallDmg(i,dmg,x,y){
  const S=G.sg;if(!S||S.bw[i]===undefined||S.bw[i]<=0)return;   // ประตู (-1) ไม่โดนดาเมจ
  S.bw[i]-=dmg;
  if(S.bw[i]<=0){S.bw[i]=0;sgWallsApply();const b=sgF().bw[i];emit({k:'sgwall',i,x:Math.round(b.x+b.w/2),y:Math.round(b.y+b.d/2)});feed('🧱 กำแพงพังแล้ว — มีทางใหม่!');}
}
// กระสุนชนวงกำแพงพังได้ (updateProjectiles js/12) • คาถาวงกว้าง (damageEnv)
function sgWallHit(c,pr){if(G.mode==='siege')sgWallDmg(c.sgw,pr.dmg||8,pr.x,pr.y);}
function sgWallEnv(x,y,rad,dmg){
  if(G.mode!=='siege'||!G.sg||MAPID!=='fcs')return;
  sgF().bw.forEach((b,i)=>{if(G.sg.bw[i]<=0)return;const dx=Math.max(b.x-x,0,x-(b.x+b.w)),dy=Math.max(b.y-y,0,y-(b.y+b.d));if(Math.hypot(dx,dy)<rad)sgWallDmg(i,dmg,x,y);});
}
// ปุ่ม (updatePlayer js/11): G = เริ่ม/หยุดร่ายที่แกน • ยิง/โล่/สกิล/พุ่ง = หยุดร่าย
function sgInput(p,pr,inp){
  const S=G.sg;if(!S||G.ph!=='play')return;
  if(p.sgc&&(inp.fire||inp.sh||pr.q||pr.e||pr.r||pr.f||pr.x||pr.sp||p.dash>0))sgStop(p);
  if(!pr.g||!p.alive||p.downed)return;
  if(p.sgc){sgStop(p);return;}
  if(p.team!==0||S.prep>0||!sgInZone(p)||p.stun>0)return;
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
  AREA=mapArea(G.map,G.mode);sgWallsApply();
  banner(`💥 แกน ${S.ph-1} แตก! ${S.ph===2?'ประตูเปิด • ':''}เวลา +${SGV.add} วิ — ไปแกน ${S.ph}`,4);
  // ใครอยู่นอกพื้นที่เฟสใหม่ (หรือฝ่ายรับที่อยู่หลังแนว) = ย้ายไปจุดเกิดใหม่ของทีม (เลือดคงเดิม)
  let i=0;
  for(const p of plist()){if(!p.alive||(p.team!==0&&p.team!==1))continue;
    if(!sgInArea(p.x,p.y,S.ph)){const s=sgSpawn(p.team),a=i*1.047,rr=i%6?80:0,q=[s.x+Math.cos(a)*rr,s.y+Math.sin(a)*rr];i++;p.x=q[0];p.y=q[1];p.z=0;p.vz=0;collideWorld(p,PR);p.inv=Math.max(p.inv,1.5);emit({k:'revive',x:p.x,y:p.y});}}
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
  return {ph:S.ph,n:sgF().n,pr:Math.ceil(S.prep),hp:S.hp.map(v=>Math.max(0,Math.round(v))),mx:SGV.coreHp,ot:S.ot?1:0,gr:S.ot?Math.round(S.grace*10)/10:0,atk:S.atk|0,def:S.def|0,
    bw:S.bw.map((v,i)=>sgF().bw[i].k==='gate'?(S.ph>=2?1:0):v<=0?1:0).join(''),zr:SGV.zoneR};
}
// =====================================================================
//  บอทเล่นบุกปราสาท: ฝ่ายบุก = เดินไปแกนแล้วร่าย (เจอศัตรูใกล้ = สู้ก่อน) • ฝ่ายรับ = เฝ้ารอบแกน ไล่คนที่เข้าใกล้แกน
//  ต่อสู้ใช้สมองเดิม (aiBot + botPlay ตามสาย) • เดินไกลใช้ตารางหาทาง (js/15-botnav)
// =====================================================================
const SGB={atkSee:800,defSee:850,defCore:2200,ring:200};   // ระยะสนใจศัตรู (px) • รัศมียืนรอบแกน ⚠ ค่าตั้งต้น
// เป้าที่ "เกี่ยวกับภารกิจ": บุก = ศัตรูใกล้ตัว • รับ = ศัตรูใกล้ตัวหรือใกล้แกน
function sgBotTarget(p){
  const k=sgCore();let best=null,bd=1e18;
  for(const q of plist()){if(q===p||!q.alive||q.downed||q.team===p.team||q.gh)continue;
    const d=Math.hypot(q.x-p.x,q.y-p.y),dk=k?Math.hypot(q.x-k.x,q.y-k.y):1e9;
    if(d>SGB.defCore+SGB.defSee)continue;
    const vis=d<220||(navOn()&&NAV.s&&!navRay(p.x,p.y,q.x,q.y,true));   // มองเห็น (ไม่มีกำแพงสูงบัง) หรือประชิด
    const ok=p.team===0?d<SGB.atkSee&&vis:(d<SGB.defSee&&vis)||dk<SGV.zoneR*2.5;if(!ok)continue;
    const s=p.team===1?Math.min(d,dk*0.8):d;if(s<bd){bd=s;best=q;}}
  return best;
}
// จุดที่บอทควรไป
function sgBotGoal(p){
  const S=G.sg,k=sgCore();if(!S||!k)return {x:p.x,y:p.y};
  if(p.team===0&&S.prep>0)return sgSpawn(0);
  const h=hashStr(p.id)%628/100,r=p.team===0?SGB.ring*0.6:SGB.ring+40;
  return {x:k.x+Math.cos(h)*r,y:k.y+Math.sin(h)*r};
}
function sgBotThink(p,dt){
  const A=p.ai,inp=p.inp;
  if(!p.alive||p.downed){aiBot(p,dt);return;}
  A.home=sgBotGoal(p);
  const c0=Object.assign({},inp.c);
  aiBot(p,dt);
  let tg=A.tg&&A.tg.alive&&!A.tg.downed?A.tg:null;
  if(tg){   // เดินไปหาเป้าไม่ได้ (กำแพงพังได้ขวาง) = ไม่สนเป้านี้ ไปทำภารกิจ/พังกำแพงก่อน
    const N=p.sgn||(p.sgn={path:null,t:0,gx:0,gy:0});N.rt=(N.rt||0)-dt;
    if(N.rt<=0||N.rtg!==tg){N.rt=1;N.rtg=tg;navEnsure();N.reach=Math.hypot(tg.x-p.x,tg.y-p.y)<220||!!navPath(p.x,p.y,tg.x,tg.y);}
    if(!N.reach){tg=null;for(const kk of SLOTK.concat(['x']))inp.c[kk]=c0[kk]|0;}
  }
  if(tg){botNav(p,dt,c0,tg);return;}
  // ไม่มีศัตรูเกี่ยวข้อง: เดินไปจุดภารกิจตามทาง
  const S=G.sg,g=A.home,d=Math.hypot(g.x-p.x,g.y-p.y);
  inp.fire=0;inp.sh=0;
  if(d>60){navEnsure();const N=p.sgn||(p.sgn={path:null,t:0,gx:0,gy:0});N.t-=dt;
    if(N.t<=0||!N.path||Math.hypot(g.x-N.gx,g.y-N.gy)>80){N.t=rnd(0.7,1.1);N.gx=g.x;N.gy=g.y;N.path=navPath(p.x,p.y,g.x,g.y);}
    const P=N.path;
    if(P&&P.length){while(P.length>1&&Math.hypot(P[0].x-p.x,P[0].y-p.y)<NAV.c*0.7)P.shift();
      for(let j=Math.min(P.length-1,6);j>0;j--)if(!navRay(p.x,p.y,P[j].x,P[j].y,false)){P.splice(0,j);break;}
      const wx=P[0].x-p.x,wy=P[0].y-p.y,wd=Math.hypot(wx,wy)||1;inp.mx=wx/wd;inp.my=wy/wd;}
    else{inp.mx=(g.x-p.x)/d;inp.my=(g.y-p.y)/d;}
    inp.ax=p.x+inp.mx*300;inp.ay=p.y+inp.my*300;
    // ไม่มีทาง (กำแพงพังได้ขวาง เช่น ฝ่ายรับเฟส 1 ออกจากห้องโถง) = เดินไปยิงกำแพงพังได้ที่ใกล้ที่สุด
    if(!P&&S){let bb=null,bd=3000;sgF().bw.forEach((b,i)=>{if(S.bw[i]<=0||!sgInArea(b.x+b.w/2,b.y+b.d/2,S.ph))return;const qx=clamp(p.x,b.x,b.x+b.w),qy=clamp(p.y,b.y,b.y+b.d),dd=Math.hypot(qx-p.x,qy-p.y);if(dd<bd){bd=dd;bb={x:qx,y:qy};}});
      if(bb){inp.ax=bb.x;inp.ay=bb.y;inp.ah=2;inp.fire=(G.time%0.5<0.25)?1:0;if(bd>260){const P2=navPath(p.x,p.y,bb.x,bb.y);const t=P2&&P2[0]||bb,tx2=t.x-p.x,ty2=t.y-p.y,td=Math.hypot(tx2,ty2)||1;inp.mx=tx2/td;inp.my=ty2/td;}else inp.mx=inp.my=0;
        N.kick=0;}N.br=bb?1:0;}else N.br=0;
  }else{inp.mx=inp.my=0;}
  // ติด: ก้าวข้างสุ่ม
  const N=p.sgn||(p.sgn={});N.st=(N.st||1.5)-dt;
  if(N.st<=0){N.st=1.5;if(!N.br&&Math.hypot(p.x-(N.sx||0),p.y-(N.sy||0))<25&&d>60){N.path=null;N.kick=0.5;N.ka=Math.random()*6.283;}N.sx=p.x;N.sy=p.y;}
  if(N.kick>0){N.kick-=dt;inp.mx=Math.cos(N.ka);inp.my=Math.sin(N.ka);}
  // ฝ่ายบุกถึงเขตแกน = กด G ร่าย แล้วยืนนิ่ง
  for(const kk of SLOTK.concat(['x']))inp.c[kk]=c0[kk]|0;   // ไม่มีเป้า = ไม่กดสกิลใส่อากาศ
  if(p.team===0&&S&&S.prep<=0&&sgInZone(p)){
    const k=sgCore();inp.ax=k.x;inp.ay=k.y;
    if(!p.sgc&&!(p.stun>0)){A.gT=(A.gT||0)-dt;if(A.gT<=0){A.gT=0.6;inp.c.g=(inp.c.g|0)+1;}}
    if(p.sgc){inp.mx=inp.my=0;}
  }
}
