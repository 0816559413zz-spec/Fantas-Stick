// =====================================================================
//  สายสายฟ้า (ผู้เล่นออกแบบทั้งหมด — designs/storm.md)
//  Lightning stack (สูงสุด 5, ไม่หมดอายุ) ได้จาก Dash ทะลุศัตรู / เส้นสายฟ้า / ระเบิดโล่ — ได้ stack ใหม่ = ยิงครั้งถัดไปเป็นสายฟ้าสามเหลี่ยม
// =====================================================================
// ตัวเลขพื้นฐานของสายสายฟ้าอยู่ใน STORMV + v:{...} ของแต่ละสกิล — ปรับได้ใน tune.html / F8
const STORMV=PATHS[2].v={stackMax:5,beamR:300,beamArc:0.6,beamDmg:3,beamTick:0.4,triLen:250,triW:120,triDmg:20,shock:0.3,dashN:3,dashRc:3,dashDist:220,dashT:0.15,dashDmg:10,
  shieldT:3,shieldCd:10,blastMax:30,blastMul:0.5,blastR:150,bashDmg:20,bashShock:0.3,bashKnock:260,bashBounce:600,bashBounceT:0.1};
PATHS[2].vn={stackMax:'Lightning stack สูงสุด',beamR:'ลำสายฟ้า • ระยะ',beamArc:'ลำสายฟ้า • ครึ่งมุมกรวย (เรเดียน)',beamDmg:'ลำสายฟ้า • ดาเมจต่อครั้ง',beamTick:'ลำสายฟ้า • ทุก (วิ)',triLen:'สายฟ้าสามเหลี่ยม • ยาว',triW:'สายฟ้าสามเหลี่ยม • ปลายกว้าง',triDmg:'สายฟ้าสามเหลี่ยม • ดาเมจ',
  shock:'Shock • นาน (วิ)',dashN:'Dash • จำนวนชาร์จ',dashRc:'Dash • ฟื้นชาร์จละ (วิ)',dashDist:'Dash • ระยะ',dashT:'Dash • เวลา (วิ)',dashDmg:'Dash • ดาเมจทะลุ',shieldT:'โล่ • เปิดนาน (วิ)',shieldCd:'โล่ • คูลดาวน์ (วิ)',blastMax:'โล่ระเบิด • ดาเมจสูงสุด',blastMul:'โล่ระเบิด • ดาเมจ (เท่าของที่ดูดซับ)',blastR:'โล่ระเบิด • รัศมี',bashDmg:'โล่+Dash ชน • ดาเมจ',bashShock:'โล่+Dash ชน • Shock (วิ)',bashKnock:'โล่+Dash ชน • กระเด็น (ต่ำกว่า ~280 = ไม่ล้มแบบ ragdoll)',bashBounce:'โล่+Dash ชน • เราเด้งกลับ (ความเร็ว)',bashBounceT:'โล่+Dash ชน • เด้งกลับนาน (วิ)'};
function stGain(p,n=1,empower=true){if(!p||p.pathIdx!==2)return;p.lst=Math.min(STORMV.stackMax,(p.lst|0)+n);if(empower)p.emp=1;emit({k:'efx',z:'stgain',x:p.x,y:p.y,h:p.z+1.6,id:p.id,n:p.lst|0,g:p.god>0?1:0});}
function stSpend(p,n){if((p.lst|0)<n){emit({k:'efx',z:'nostack',x:p.x,y:p.y,h:p.z+2.2,id:p.id,n,g:p.god>0?1:0});return false;}p.lst-=n;return true;}
// ศัตรูในกรวยหน้า (ใช้กับลำสายฟ้า)
function stormCone(p,range,arc){const out=[],ph=p.z+1.1;
  for(const t of foesOf(p.team)){const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);if(d>range+(t.r||PR))continue;
    if(d>14&&Math.abs(angDiff(Math.atan2(dy,dx),p.ang))>arc)continue;if(!aimLineH(p,ph,t,3))continue;out.push(t);}
  return out;}
// ศัตรูในแนวเส้นตรง (เส้นสายฟ้า / Railgun)
function stormLineFoes(p,x,y,a,len,half,from,h=p.z+1.1){const c=Math.cos(a),sn=Math.sin(a),out=[];len=Math.min(len,windBlockLen(p.team,x,y,a,len,h));{const q=bldRay(x,y,h,x+c*len,y+sn*len,h);if(q)len=q.t*len;}   // กำแพงลมศัตรูกันเส้นยิง
  for(const t of foesOf(p.team)){const dx=t.x-x,dy=t.y-y,u=dx*c+dy*sn;if(u<(from||0)-(t.r||PR)||u>len+(t.r||PR))continue;
    if(Math.abs(-dx*sn+dy*c)>half+(t.r||PR))continue;if(!aimLineH({x,y},h,t,4))continue;out.push(t);}
  return out;}
function stormBasic(p,inp,dt,setCd){
  const prev=p.bfPrev;p.bfPrev=inp.fire;
  // โล่สายฟ้า: คลิกขวา (กดครั้งเดียว) เปิด / กดอีกครั้งระเบิด — ใช้ได้ทุกเวลา รวมระหว่างอัลติ (ผู้ใช้ 2026-11-16) • bash=1 = มีประจุ Dash ชน 1 ครั้งต่อการกาง
  const shP=inp.sh&&!p.shPrv;p.shPrv=inp.sh;
  if(p.stMarkAim){p.beam=0;p.bTg=0;stormAllyMarkAim(p);return;}
  if(shP&&!SHIELD_OFF){if(p.stS)stormShieldBlast(p);else if(!(p.stCd>0)){p.stS={t:STORMV.shieldT,abs:0,bash:1};emit({k:'efx',z:'ston',x:p.x,y:p.y,h:p.z,id:p.id});}}
  p.bTg=0;
  if(p.sdome){if(p.sdome.ph===2&&inp.fire&&!prev)stormDomeFire(p);p.beam=0;return;}
  if(p.slnT>0||p.stPulse>0||p.sdW>0){p.beam=0;return;}
  if(p.stStaff>0){p.beam=0;if(p.stWind>0){p.stWind-=dt;if(p.stWind<=0)stormWaveShoot(p);}else if(inp.fire&&p.cd.basic<=0){p.stWind=.13;p.stSide=-(p.stSide||1);emit({k:'efx',z:'sswing',x:Math.round(p.x),y:Math.round(p.y),h:p.z+1.2,n:p.stSide,id:p.id});setCd('basic',SIPH.v.cd);}return;}
  if(p.god>0){
    // อัลติ (ผู้ใช้ 2026-11-11): 1 คลิก = พุ่ง 40 + ข่วน 2 ที 15/15 ห่าง 0.2 วิ แล้วคูล 0.7 • ไม่มี Shock
    // Special: Dash ชนแล้วคลิกภายใน 1.5 วิ (ใช้ได้แม้ติดคูล) = กวาดครั้งเดียว 30 + Shock
    p.beam=0;if(p.clT>0)p.clT-=dt;if(p.cEmpT>0){p.cEmpT-=dt;if(p.cEmpT<=0)p.cEmp=0;}
    const GV=GODL.v;
    if(p.clQ){for(const q of p.clQ){q.t-=dt;if(q.t<=0&&!q.done){q.done=1;stormClawStrike(p,q);}}if(p.clQ.every(q=>q.done))p.clQ=null;}
    if(inp.fire&&!p.clQ){
      const big=p.cEmp&&p.cEmpT>0;
      if(big||!(p.clT>0)){
        const L=GV.lunge;p.dashX=Math.cos(p.ang);p.dashY=Math.sin(p.ang);p.dash=0.07;p.dashSp=L/0.07;
        if(big){p.cEmp=0;p.cEmpT=0;p.clQ=[{t:0.07,n:3,r:GV.bigR,arc:GV.bigArc,dmg:GV.bigDmg,sh:1}];}
        else p.clQ=[{t:0.07,n:0,r:GV.clawR,arc:GV.clawArc,dmg:GV.c1},{t:0.07+GV.gap,n:1,r:GV.clawR,arc:GV.clawArc,dmg:GV.c2}];
        p.clT=0.07+(big?0:GV.gap)+GV.clawCd;
        emit({k:'efx',z:'sclawgo',x:Math.round(p.x),y:Math.round(p.y),h:p.z+1.1,a:Math.round(p.ang*100)/100,big:big?1:0,id:p.id});
      }}
    return;}
  if(inp.fire&&!prev&&p.emp){p.emp=0;stormTri(p);p.beam=0;return;}
  if(inp.fire){
    if(!p.beam){p.beam=1;p.bTk=0;}
    const tg=stormCone(p,STORMV.beamR,STORMV.beamArc);p.bTg=tg.slice(0,4).map(t=>[Math.round(t.x),Math.round(t.y),Math.round(cH(t)*10)/10]);
    p.bTk-=dt;if(p.bTk<=0){p.bTk=STORMV.beamTick;p.baHit=1;for(const t of tg)if(!darkShieldCross(t,p.x,p.y,p.z+1.1,t.x,t.y,cH(t)))aoeHit(p,t,STORMV.beamDmg);p.baHit=0;}
  }else p.beam=0;
}
// สายฟ้าสามเหลี่ยม: ยาว 250 ปลายกว้าง 120 ฟาดจากฟ้า 20 ดาเมจ + Shock
function stormTri(p){
  const c=Math.cos(p.ang),sn=Math.sin(p.ang);p.baHit=1;
  for(const t of foesOf(p.team)){const dx=t.x-p.x,dy=t.y-p.y,f=dx*c+dy*sn,l=-dx*sn+dy*c,r=t.r||PR;
    if(f<-r||f>STORMV.triLen+r)continue;if(Math.abs(l)>STORMV.triW/2*Math.max(0,f)/STORMV.triLen+r*0.7)continue;if(!aimLineH(p,p.z+1.1,t,4))continue;
    aoeHit(p,t,STORMV.triDmg,t=>shock(t,p.id,STORMV.shock));}
  p.baHit=0;emit({k:'efx',z:'stri',x:p.x,y:p.y,h:p.z,a:Math.round(p.ang*100)/100,id:p.id});
}
// ข่วนหนึ่งที: ตีกรวยหน้าจากตำแหน่งปัจจุบัน (หลังพุ่ง) แล้วส่งภาพรอยคม
function stormClawStrike(p,q){
  if(q.dmg>0){const hit=[];p.baHit=1;meleeHit(p,p.x,p.y,q.r,q.dmg,q.arc,t=>{hit.push(t);if(q.sh)shock(t,p.id,STORMV.shock);});p.baHit=0;
    for(const t of hit.slice(0,4))emit({k:'efx',z:'sclawhit',x:Math.round(t.x),y:Math.round(t.y),h:Math.round(cH(t)*10)/10,a:Math.round(p.ang*100)/100,n:q.n,id:p.id});}
  emit({k:'efx',z:'sclaw',x:Math.round(p.x),y:Math.round(p.y),h:p.z+1.1,a:Math.round(p.ang*100)/100,n:q.n,r:q.r,arc:q.arc,id:p.id});
}
function stormDash(p,inp,pr,dt,setCd){
  const rc=p.god>0?GODL.v.dashRc:STORMV.dashRc,N=STORMV.dashN;if(p.dch===undefined)p.dch=N;
  if(p.dch<N)p.dch=Math.min(N,p.dch+dt/rc);
  p.cd.dodge=p.dch>=1?0:(1-p.dch)*rc;p.cdMax.dodge=rc;
  if(pr.sp&&p.dch>=1&&!(p.dash>0)){
    let dx,dy;if(typeof inp.mx==='number'){dx=inp.mx;dy=inp.my;}else{dx=(inp.r?1:0)-(inp.l?1:0);dy=(inp.d?1:0)-(inp.u?1:0);}
    const l=Math.hypot(dx,dy);if(l>0.1){dx/=l;dy/=l;}else{dx=Math.cos(p.ang);dy=Math.sin(p.ang);}
    p.dch-=1;p.dash=STORMV.dashT;p.dashSp=STORMV.dashDist/STORMV.dashT;p.dashX=dx;p.dashY=dy;p.sdHit=new Set();p.sdAny=false;p.sdGod=p.god>0?1:0;p.sdX=p.x;p.sdY=p.y;
    emit({k:'efx',z:'sdash',x:p.x,y:p.y,h:p.z+1,id:p.id,g:p.sdGod});
  }
  return false;
}
// ระหว่าง Dash: ทะลุศัตรูคนละ 10 (อัลติ 15) • โดนอย่างน้อย 1 คน = +1 stack และยิงออร์บ
function stormDashTick(p){
  if(!p.sdHit)return;
  if(p.dash>0){
    for(const t of foesOf(p.team)){if(p.sdHit.has(t))continue;if(Math.hypot(t.x-p.x,t.y-p.y)>(p.stS&&p.stS.bash?46:PR)+(t.r||PR)+15||Math.abs(cH(t)-(p.z+1.1))>3)continue;
      p.sdHit.add(t);
      // ผู้ใช้ 2026-11-16: Dash ตอนกางโล่ = พุ่งชนด้วยโล่ → คนโดนกระเด็นถอยนิด Shock 0.3 วิ ดาเมจ 20 • เราเด้งกลับนิด (จบ Dash ทันที)
      if(p.stS&&p.stS.bash){p.stS.bash=0;damage(t,STORMV.bashDmg,p.id,'aoe');shock(t,p.id,STORMV.bashShock,true);knock(t,p.x,p.y,STORMV.bashKnock);
        p.dash=0;p.vx=-p.dashX*STORMV.bashBounce;p.vy=-p.dashY*STORMV.bashBounce;p.stBn=STORMV.bashBounceT;   // เด้งสั้น ๆ เร็ว ๆ แล้วหยุด (ไม่ไถล)
        emit({k:'efx',z:'stbash',x:Math.round((p.x+t.x)/2),y:Math.round((p.y+t.y)/2),h:Math.round(cH(t)*10)/10,a:Math.round(Math.atan2(p.dashY,p.dashX)*100)/100,id:p.id,t:t.id});
        if(!p.sdAny){p.sdAny=true;stGain(p);}break;}
      const mark=G.waveMarks?.get(t),advances=!(p.god>0)&&mark&&!mark.primed&&mark.until>G.time,hp=t.hp;
      damage(t,p.god>0?GODL.v.dashDmg:STORMV.dashDmg,p.id,'aoe',advances);
      if(advances&&t.hp<hp)stormWaveMark(p.id,t,false);
      emit({k:'efx',z:'sdhit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),a:Math.round(Math.atan2(p.dashY,p.dashX)*100)/100,g:p.sdGod,mark:advances&&t.hp<hp?1:undefined});
      if(!p.sdAny){p.sdAny=true;stGain(p);stormOrbLaunch(p,t.x,t.y,t);if(p.god>0){p.cEmp=1;p.cEmpT=GODL.v.bigWin;}}}
  }else{emit({k:'efx',z:'sdashe',x:Math.round(p.sdX),y:Math.round(p.sdY),h:p.z+1,x2:Math.round(p.x),y2:Math.round(p.y),a:Math.round(Math.atan2(p.y-p.sdY,p.x-p.sdX)*100)/100,len:Math.round(Math.hypot(p.x-p.sdX,p.y-p.sdY)),id:p.id,g:p.sdGod});p.sdHit=null;}
}
function stormShieldBlast(p,broken=false){
  const S=p.stS;p.stS=null;p.stCd=p.stCdMax=broken?SHIELD_BREAK_LOCK:STORMV.shieldCd;p.shieldE=0;
  if(!S||S.abs<=0){emit({k:'efx',z:'stoff',x:p.x,y:p.y,h:p.z,id:p.id});return;}
  const dm=Math.min(STORMV.blastMax,S.abs*STORMV.blastMul);let any=false;
  emit({k:'efx',z:'stblast',x:p.x,y:p.y,h:p.z,r:STORMV.blastR,n:Math.round(dm),id:p.id});
  for(const t of foesIn(p.team,p.x,p.y,STORMV.blastR,p.z+4,p.z-2))if(aoeHit(p,t,dm,t=>shock(t,p.id,STORMV.shock)))any=true;
  if(any)stGain(p);
}
// ทุกเฟรม (สายฟ้า): เวลาโล่ / อัลติ / ร่ายเส้นสายฟ้า / Thunderbomb / Lightning Mark / ออร์บ / Dash
function stormTick(p,dt){
  if(p.stBn>0){p.stBn-=dt;if(p.stBn<=0){p.stBn=0;p.vx=p.vy=0;}}
  if(p.stS){p.stS.t-=dt;if(p.stS.t<=0)stormShieldBlast(p);}
  else if(p.stCd>0)p.stCd-=dt;
  p.shieldE=p.stS||!(p.stCd>0)?100:100*(1-p.stCd/p.stCdMax);p.shieldBroken=0;
  if(p.god>0){p.god-=dt;if(p.god<=0){p.god=0;p.xhp=0;emit({k:'efx',z:'godoff',x:p.x,y:p.y,h:p.z+1,id:p.id,g:1});}}
  if(p.slnT>0){if(p.stun>0){p.slnT=0;}else{p.slnT-=dt;if(p.slnT<=0)stormLine(p);}}
  if(p.stPulse>0){
    p.stPulse-=dt;
    if(!p.alive||p.downed||p.stun>0||p.frz>0)p.stPulse=0;
    else if(p.stPulse<=0)stormPulse(p);
  }
  if(p.sdW>0){p.sdW-=dt;if(!p.alive||p.downed||p.stun>0||p.frz>0)p.sdW=0;else if(p.sdW<=0){p.sdW=0;stormDomeLaunch(p);}}   // Storm Dome: short aim delay, then fire (user 2026-11-28)
  if(p.stMarkAim&&(G.time>=p.stMarkAim.until||p.stun>0||p.frz>0))p.stMarkAim=null;
  if(p.stStaff>0)p.stStaff-=dt;
  if(p.sorb){p.sorb.t-=dt;if(p.sorb.t<=0||p.sorb.n<=0){p.sorb=null;emit({k:'efx',z:'sorboff',x:p.x,y:p.y,h:p.z+1.8,id:p.id,g:p.god>0?1:0});}}
}
// Thunder Line
const TLINE=defSpell(2,{id:'thunderline',v:{windup:.21,len:780,w:50,dmg:20,travel:.10},vn:{windup:'ท่าเตรียม (วิ)',len:'ยาว',w:'กว้าง',dmg:'ดาเมจ',travel:'สายฟ้าวิ่งสุดแนว (วิ)'},role:'builder',n:'เส้นสายฟ้า',ic:'⚡',cd:4,d:'ยิงสายฟ้าแนวยาว 780 จากสองมือ • ไม่ใช้ stack',fx:'20 ดาเมจ • โดนอย่างน้อย 1 คนได้ 1 stack โดยไม่เปิด BA เสริม',
  cast(p,S){p.slnT=S.v.windup;emit({k:'efx',z:'slup',x:p.x,y:p.y,h:p.z+1.25,id:p.id,g:p.god>0?1:0});}});
function stormLine(p){
  const a=p.ang,c=Math.cos(a),sn=Math.sin(a),h=p.z+1.25;
  let len=windBlockLen(p.team,p.x,p.y,a,TLINE.v.len,h);
  for(let d=20;d<=len;d+=20){const x=p.x+c*d,y=p.y+sn*d;if(x<30||x>MW-30||y<30||y>MH-30){len=d-20;break;}}
  const wall=bldRay(p.x,p.y,h,p.x+c*len,p.y+sn*len,h);
  if(wall)len*=wall.t;
  const g=p.god>0?1:0;
  if(len>0)G.slines.push({x:p.x,y:p.y,h,a,len,d:0,hit:new Set(),owner:p.id,any:false,g});
  emit({k:'efx',z:'sline',x:p.x,y:p.y,h,a,len,id:p.id,g,T:TLINE.v.travel});
}
// ----- สกิล 2 (1 stack): ดูดความเร็ว -----
const SIPH=defSpell(2,{id:'speedsiphon',v:{cost:1,dmg:20,spd:1500,range:700,marks:3,markT:6,primeT:1,boom:15,shockT:0.7,refund:2},vn:{cost:'ใช้ stack',dmg:'ดาเมจคลื่น',spd:'ความเร็วคลื่น',range:'ระยะคลื่น',marks:'เครื่องหมายที่ใช้ระเบิด',markT:'เครื่องหมายอยู่นาน (วิ)',primeT:'เวลารอก่อนระเบิด (วิ)',boom:'ระเบิด • ดาเมจเพิ่ม',shockT:'ระเบิด • Shock (วิ)',refund:'ระเบิด • stack ที่คืน'},role:'damage',n:'คลื่นสายฟ้า',ic:'⚡',cd:2,d:'ใช้ 1 stack: ยิงคลื่นทะลุ ดาเมจ 20 ระยะ 700 ติดเครื่องหมาย 6 วิ • คลื่นหรือ Dash ร่างปกติผ่านเป้าเพิ่มเครื่องหมาย • ครบ 3 รอ 1 วิ แล้วระเบิด 15 ดาเมจ + Shock 0.7 วิ คืน 2 stacks ให้คนที่เติมขีดสุดท้าย',
  cast(p,S){if(!stSpend(p,S.v.cost))return false;p.stSide=-(p.stSide||1);emit({k:'efx',z:'sswing',x:Math.round(p.x),y:Math.round(p.y),h:p.z+1.2,n:p.stSide,id:p.id});stormWaveShoot(p);}});   // ผู้ใช้ 2026-11-10: เลิกโหมดไม้เท้า 6 วิ → คลื่นทันที 1 stack
function stormWaveShoot(p){const V=SIPH.v;Object.assign(PDEF.swave,{spd:V.spd,life:V.range/V.spd,dmg:V.dmg});const pr=shoot(p,'swave',{sp:'b_storm',dmg:V.dmg,quiet:1});pr.pierce=1;pr.hs=new Set();pr.hw=40;pr.stGod=p.god>0?1:0;}
function stormWaveTargetLive(t){
  if(t.natKind)return G.nature.includes(t)&&natureLive(t);
  if(t.isE)return !t.dead&&G.en.includes(t);
  if(t.isM)return !t.dead&&G.mins.includes(t);
  return G.players[t.id]===t&&t.alive&&!t.downed;
}
function stormWaveMark(owner,t,opens=true,god=0){
  if(!stormWaveTargetLive(t))return;
  const V=SIPH.v,marks=G.waveMarks||(G.waveMarks=new Map()),prev=marks.get(t);
  if(prev?.primed)return;
  const n=(prev&&prev.until>G.time?prev.n:0)+1;
  if(n===1&&!opens)return;
  const primed=n>=V.marks;
  const duration=primed?V.primeT:V.markT;
  marks.set(t,{n,owner,primed,god,until:G.time+duration});
  emit({k:'efx',z:'smark',x:Math.round(t.x),y:Math.round(t.y),h:(t.z||t.h||0)+1.2,n,id:t.id,g:god,prime:primed?duration:undefined});
}
function clearStormWaveMarks(){
  for(const t of G.waveMarks?.keys()||[])emit({k:'efx',z:'smkoff',id:t.id});
  G.waveMarks?.clear();
}
function updateStormWaveMarks(){
  if(!G.waveMarks?.size)return;
  for(const [t,M] of G.waveMarks){
    const live=stormWaveTargetLive(t);
    if(live&&G.time+1e-6<M.until)continue;
    G.waveMarks.delete(t);
    if(!live||!M.primed){emit({k:'efx',z:'smkoff',id:t.id});continue;}
    damage(t,SIPH.v.boom,M.owner,'aoe',true);
    shock(t,M.owner,SIPH.v.shockT,true,M.god);
    stGain(G.players[M.owner],SIPH.v.refund);
    emit({k:'efx',z:'smkboom',x:Math.round(t.x),y:Math.round(t.y),h:(t.z||t.h||0)+1.2,id:t.id,g:M.god});
  }
}
// Keep the legacy ID and spell index for saved Storm kits.
const STPULSE=defSpell(2,{id:'triplestrike',v:{cost:2,r:200,dmg:30,windup:.7,knock:125,shockT:.3},vn:{cost:'ใช้ stack',r:'รัศมี',dmg:'ดาเมจ',windup:'ท่าเตรียม (วิ)',knock:'แรงผลัก',shockT:'Shock (วิ)'},role:'control',n:'Thunderbomb',ic:'🌩️',cd:12,d:'ใช้ 2 stacks • ขดตัวแล้วระเบิดสายฟ้ารอบตัว รัศมี 200',fx:'30 ดาเมจ + Shock และผลักถอยเล็กน้อย',
  cast(p,S){if(!stSpend(p,S.v.cost))return false;p.stPulse=S.v.windup;}});
function stormPulse(p){
  const V=STPULSE.v,g=p.god>0?1:0;
  emit({k:'efx',z:'stpulse',x:p.x,y:p.y,h:p.z,r:V.r,id:p.id,g});
  for(const t of foesIn(p.team,p.x,p.y,V.r,p.z+V.r/40+1,p.z-1)){
    if(!aimLineH({x:p.x,y:p.y},p.z+1.1,t,V.r/40+1))continue;
    aoeHit(p,t,V.dmg,target=>{knock(target,p.x,p.y,V.knock);shock(target,p.id,V.shockT,false,g);});
  }
}
// ----- สกิล 4 (1 stack): ออร์บสายฟ้าคู่ — ลอยหลังเรา Dash โดนศัตรู = ออร์บพุ่งกระแทกจุดนั้น -----
const SORBS=defSpell(2,{id:'stormorbs',v:{cost:1,n:2,time:8,dmg:15,r:60,fly:0.55},vn:{cost:'ใช้ stack',n:'จำนวนออร์บ',time:'อยู่นาน (วิ)',dmg:'ดาเมจต่อลูก',r:'รัศมีระเบิด',fly:'บินถึงเป้า (วิ)'},role:'builder',n:'ออร์บสายฟ้าคู่',ic:'🔮',cd:8,d:'ใช้ 1 stack: ออร์บสายฟ้า 2 ลูกลอยหลังเรา 8 วิ • Dash โดนศัตรู = ยิงออร์บ 1 ลูก (ต่อ Dash) กระแทกจุดที่ Dash โดน',fx:'ลูกละ 15 ดาเมจ รัศมี 60 • ระหว่างอัลติ: Dash โดน = ออร์บที่เหลือพุ่งพร้อมกันหมด',
  cast(p,S){if(!stSpend(p,S.v.cost))return false;p.sorb={n:S.v.n,t:S.v.time};emit({k:'efx',z:'sorbon',x:p.x,y:p.y,h:p.z+1.8,id:p.id,g:p.god>0?1:0});}});
// ⚠ Claude: บิน 0.55 วิ (ลอยขึ้น 0.2 + โค้งลง 0.35) ตามตัวคนที่ Dash โดน • คนนั้นตาย/หาย = ไปจุดเดิม
function stormOrbLaunch(p,x,y,tg){
  if(!p.sorb||p.sorb.n<=0)return;
  const god=p.god>0?1:0,k=god?p.sorb.n:1;p.sorb.n-=k;
  for(let i=0;i<k;i++){(G.sorbs||(G.sorbs=[])).push({x:x+(i?rnd(-20,20):0),y:y+(i?rnd(-20,20):0),ox:i?rnd(-20,20):0,oy:i?rnd(-20,20):0,tg:tg||null,t:SORBS.v.fly+i*0.08,owner:p.id,team:p.team,god});}
  emit({k:'efx',z:'sorbgo',x:p.x,y:p.y,h:p.z+1.8,x2:Math.round(x),y2:Math.round(y),n:k,id:p.id,g:god,T:SORBS.v.fly,tg:tg?(tg.isE?'e'+tg.id:tg.id):undefined});
}
// Keep the legacy ID and spell index for saved Storm kits.
Object.assign(PDEF,{swave:{spd:1500,r:16,dmg:25,life:.47,col:'#8fd8ff'}});
const STMARK=defSpell(2,{id:'railgun',v:{cost:3,wait:3,len:700,time:3,r:300,selfDmg:35,allyDmg:50,selfShock:.3,allyShock:.7,haste:1.25},vn:{cost:'ใช้ stack',wait:'เวลาเลือกเป้า (วิ)',len:'ระยะส่งให้เพื่อน',time:'ระเบิดหลัง (วิ)',r:'รัศมี',selfDmg:'ดาเมจ • ใส่ตัวเอง',allyDmg:'ดาเมจ • ใส่เพื่อน',selfShock:'Shock • ใส่ตัวเอง (วิ)',allyShock:'Shock • ใส่เพื่อน (วิ)',haste:'ความเร็วเพื่อน (เท่า)'},
  n:'Lightning Mark',d:'ใช้ 3 stacks • คลิกซ้ายเล็งเพื่อน หรือคลิกขวาใส่ตัวเอง',fx:'ระเบิดหลัง 3 วิ รัศมี 300 • เพื่อนได้ความเร็ว +25% และระเบิดแรงขึ้น',ic:'⚡',role:'support',cd:8,
  cast(p,S){if(p.stMarkAim||p.lst<S.v.cost)return false;p.stMarkAim={until:G.time+S.v.wait,fire:!!p.inp?.fire,sh:!!p.inp?.sh};}});
function stormAllyMarkAim(p){
  const V=STMARK.v,R=p.stMarkAim,inp=p.inp||{};
  if(!p.alive||p.downed||p.stun>0||p.frz>0||G.time>=R.until){p.stMarkAim=null;return;}
  const left=inp.fire&&!R.fire,right=inp.sh&&!R.sh;
  R.fire=!!inp.fire;R.sh=!!inp.sh;
  if(!left&&!right&&!p.bot)return;
  let target=right?p:null;
  if(p.bot){
    target=p;
    const foes=foesIn(p.team,p.x,p.y,V.len+V.r,p.z+5,p.z-1.5);
    let score=foes.filter(t=>dist2(t,p)<V.r*V.r).length;
    for(const q of plist()){
      if(q===p||q.team!==p.team||!q.alive||q.downed||q.stAllyMark||dist2(q,p)>V.len*V.len)continue;
      if(bldRay(p.x,p.y,p.z+1.3,q.x,q.y,q.z+1.15))continue;
      const count=foes.filter(t=>dist2(t,q)<V.r*V.r).length;
      if(count>=Math.max(1,score)){target=q;score=count;}
    }
  }
  if(!target){
    const h=p.z+1.3,ray=aimRay3(p,h,V.len);
    const a=p.ang,ap=clamp(inp.ap||0,-1.5,1.5);
    const dx=(ray?.x??p.x+Math.cos(a)*Math.cos(ap)*V.len)-p.x;
    const dy=(ray?.y??p.y+Math.sin(a)*Math.cos(ap)*V.len)-p.y;
    const dz=((ray?.h??h+Math.sin(ap)*V.len/20)-h)*20;
    const ss=dx*dx+dy*dy+dz*dz;
    let best=1;
    if(ss>1)for(const q of plist()){
      if(q===p||q.team!==p.team||!q.alive||q.downed||q.stAllyMark)continue;
      const x=q.x-p.x,y=q.y-p.y,z=(q.z+1.15-h)*20,f=(x*dx+y*dy+z*dz)/ss;
      if(f<=0||f>best||Math.hypot(x-f*dx,y-f*dy,z-f*dz)>36)continue;
      if(bldRay(p.x,p.y,h,q.x,q.y,q.z+1.15))continue;
      best=f;target=q;
    }
  }
  if(!target||target.stAllyMark)return;
  p.stMarkAim=null;
  if(!stSpend(p,V.cost))return;
  const g=p.god>0?1:0,ally=target!==p;
  target.stAllyMark={owner:p.id,team:p.team,until:G.time+V.time,g,ally};
  emit({k:'efx',z:'stallymark',x:p.x,y:p.y,h:p.z+1.3,id:p.id,target:target.id,
    x2:target.x,y2:target.y,h2:target.z+1.25,T:V.time,g,ally});
}
function updateStormAllyMark(t){
  const M=t.stAllyMark;
  if(!t.alive||t.downed||t.team!==M.team){t.stAllyMark=null;return;}
  if(G.time+1e-6<M.until)return;
  t.stAllyMark=null;
  const V=STMARK.v,p=G.players[M.owner];
  if(!p||p.team!==M.team)return;
  emit({k:'efx',z:'stallyburst',x:t.x,y:t.y,h:t.z,r:V.r,id:t.id,g:M.g});
  for(const foe of foesIn(M.team,t.x,t.y,V.r,t.z+5,t.z-1.5)){
    if(!aimLineH({x:t.x,y:t.y},t.z+1.1,foe,5))continue;
    aoeHit({id:p.id,x:t.x,y:t.y,z:t.z},foe,M.ally?V.allyDmg:V.selfDmg,hit=>shock(hit,p.id,M.ally?V.allyShock:V.selfShock,true,M.g));
  }
}
// ----- อัลติ: ร่างเทพสายฟ้า 10 วิ -----
const GODL=defSpell(2,{id:'godlightning',v:{time:10,xhp:75,dashRc:1,dashDmg:15,c1:15,c2:15,gap:0.2,clawCd:0.3,lunge:40,clawR:160,clawArc:0.96,bigR:200,bigArc:1.13,bigDmg:30,bigWin:1.5,slamR:150,slamDmg:80},vn:{time:'อยู่นาน (วิ)',xhp:'HP เสริม',dashRc:'Dash ฟื้นชาร์จละ (วิ)',dashDmg:'Dash • ดาเมจทะลุ',c1:'กรงเล็บ • จังหวะ 1',c2:'กรงเล็บ • จังหวะ 2',gap:'กรงเล็บ • ห่างระหว่าง 2 ที (วิ)',clawCd:'กรงเล็บ • คูล (วิ)',lunge:'กรงเล็บ • พุ่ง',clawR:'กรงเล็บ • ระยะ',clawArc:'กรงเล็บ • ครึ่งมุม (rad)',bigR:'กรงเล็บพิเศษ • ระยะ',bigArc:'กรงเล็บพิเศษ • ครึ่งมุม (rad)',bigDmg:'กรงเล็บพิเศษ • ดาเมจ',bigWin:'กรงเล็บพิเศษ • เวลากด (วิ)',slamR:'ลูกสายฟ้าโดม (อัลติ) • รัศมีทุบ',slamDmg:'ลูกสายฟ้าโดม (อัลติ) • ดาเมจทุบ'},role:'ult',n:'ร่างเทพสายฟ้า',ic:'⚡',cd:0,ult:true,d:'แปลงร่างเทพสายฟ้า 10 วิ: HP เสริม 75 • Dash ฟื้นชาร์จละ 1 วิ ทะลุ 15 ดาเมจ • โจมตีปกติพุ่งสั้นแล้วข่วน 2 จังหวะ (15/15) • Dash โดนศัตรู = โจมตีครั้งถัดไปภายใน 1.5 วิ ฟันกวาดทีเดียว ระยะ 200 ดาเมจ 30 + Shock • ใช้โล่ไม่ได้',fx:'สกิลเก่งขึ้น: ออร์บพุ่งพร้อมกัน • ลูกสายฟ้าโดมเป็นทุบลงแบบ Dragonfall 80 ดาเมจ ใช้ 3 stacks ในร่างเทพ',
  cast(p,S){p.god=S.v.time;p.xhp=S.v.xhp;p.dch=STORMV.dashN;p.cEmp=0;p.cEmpT=0;p.clQ=null;p.clT=0;emit({k:'efx',z:'godon',x:p.x,y:p.y,h:p.z,id:p.id,g:1});}});
// ----- ลูกสายฟ้าโดม: รวมไฟที่พื้น → ทะยานขึ้น → เล็ง → ฟาดไม้ยิงและค้างชี้เป้า -----
function stormDomeCost(p){return p.god>0?SDOME.v.godCost:SDOME.v.cost;}
function stormDomeLaunch(p){
  const V=SDOME.v,h=p.z+1.3;
  const q=aimRay3(p,h,V.range)||aimClip(p.x,p.y,h,aimPoint(p,V.range,false),0);
  const height=q.h??h;
  const end={x:q.x,y:q.y,h:height,floor:q.hit==='ground'||(!q.hit&&height<=groundH(q.x,q.y,height)+.1)};
  const t=Math.max(.045,Math.hypot(end.x-p.x,end.y-p.y,20*(end.h-h))/V.speed);
  G.sballs.push({...end,t,owner:p.id,team:p.team,g:p.god>0?1:0});
  emit({k:'efx',z:'stdomeshot',x:p.x,y:p.y,h,x2:end.x,y2:end.y,h2:end.h,t,id:p.id});
}
function stormDomeTick(p,inp,dt){
  const D=p.sdome;D.t-=dt;
  if(!p.alive||p.downed){p.sdome=null;return;}
  if(D.ph<3&&(p.stun>0||p.frz>0)){p.sdome=null;p.vz=0;emit({k:'efx',z:'dfcancel',x:p.x,y:p.y,h:p.z,id:p.id});return;}
  if(D.ph===1){
    if(D.t<0.25)p.z+=(D.H-p.z)*Math.min(1,14*dt);
    p.vz=0;
    if(D.t<=0){D.ph=2;D.t=3;}
  }else if(D.ph===2){
    D.H=clamp(D.H+((inp.jh?1:0)-(inp.ch?1:0))*2.5*dt,D.g0+4.5,D.g0+7.5);
    p.z+=(D.H-p.z)*Math.min(1,6*dt);p.vz=0;
    const q=aimClip(p.x,p.y,p.z,aimPoint(p,SDOME.v.range),PR+6);
    D.tx=q.x;D.ty=q.y;D.landH=q.hit?q.h:groundH(q.x,q.y,p.z);
    if(D.t<=0)stormDomeFire(p);
  }else{
    const k=1-Math.max(0,D.t)/.45,gh=D.landH??groundH(D.tx,D.ty,D.sz);
    p.x=lerp(D.sx,D.tx,k);p.y=lerp(D.sy,D.ty,k);p.z=lerp(D.sz,gh,k*k);p.vz=0;
    if(D.t<=0){p.x=D.tx;p.y=D.ty;p.z=gh;p.sdome=null;stormDomeSlam(p,D.tx,D.ty,gh);}
  }
}
function stormDomeFire(p){
  const D=p.sdome;
  D.ph=3;D.t=.45;D.sx=p.x;D.sy=p.y;D.sz=p.z;
  emit({k:'efx',z:'dfdive',x:p.x,y:p.y,h:p.z,x2:Math.round(D.tx),y2:Math.round(D.ty),id:p.id,g:1});
}
// อัลติ: ทุบลงพร้อมลูกสายฟ้า — ดูดเข้ากลาง + ระเบิดทันที 80
function stormDomeSlam(p,x,y,gh){
  const GV=GODL.v;emit({k:'efx',z:'sdboom',x:Math.round(x),y:Math.round(y),h:gh+0.08,r:GV.slamR,g:1,id:p.id});
  for(const t of foesIn(p.team,x,y,GV.slamR,gh+4,gh-1.5)){if(!t.isE&&!t.isM){const a=Math.atan2(y-t.y,x-t.x),d=Math.hypot(x-t.x,y-t.y);t.vx=(t.vx||0)+Math.cos(a)*Math.min(600,d*5);t.vy=(t.vy||0)+Math.sin(a)*Math.min(600,d*5);}aoeHit(p,t,GV.slamDmg,t=>shock(t,p.id,STORMV.shock,false,true));}
  damageEnv(x,y,GV.slamR,GV.slamDmg,p.id,'lightning',gh);
}
function updateStorm(dt){
  updateStormWaveMarks();
  for(const p of plist())if(p.stAllyMark)updateStormAllyMark(p);
  if(G.slines&&G.slines.length){
    for(const L of G.slines){
      const d0=L.d;L.d=Math.min(L.len,L.d+L.len/TLINE.v.travel*dt);const o=G.players[L.owner];
      if(o)for(const t of stormLineFoes(o,L.x,L.y,L.a,L.d,TLINE.v.w/2,d0-30,L.h)){if(L.hit.has(t))continue;L.hit.add(t);if(aoeHit(o,t,TLINE.v.dmg)){emit({k:'efx',z:'stlinehit',x:t.x,y:t.y,h:cH(t),g:L.g});if(!L.any){L.any=true;stGain(o,1,false);}}}
      if(L.d>=L.len)L.done=1;
    }
    G.slines=G.slines.filter(L=>!L.done);
  }
  if(G.sorbs&&G.sorbs.length){
    for(const b of G.sorbs){b.t-=dt;if(b.tg&&!b.tg.dead&&b.tg.alive!==false){b.x=b.tg.x+b.ox;b.y=b.tg.y+b.oy;}if(b.t<=0){b.done=1;const o=G.players[b.owner],bh=b.tg&&!b.tg.dead?(b.tg.isE?(b.tg.h||0):(b.tg.z||0)):groundH(b.x,b.y,o?o.z+1.2:1.2);emit({k:'efx',z:'sorbhit',x:Math.round(b.x),y:Math.round(b.y),h:bh+0.5,id:b.owner,g:b.god});if(o)for(const t of foesIn(b.team,b.x,b.y,SORBS.v.r,bh+5,bh-1.5))aoeHit(o,t,SORBS.v.dmg);}}
    G.sorbs=G.sorbs.filter(b=>!b.done);
  }
  if(!G.sballs.length&&!G.sdomes.length)return;
  const V=SDOME.v;
  for(const b of G.sballs){
    b.t-=dt;
    if(b.t>0)continue;
    G.sdomes.push({...b,t:V.time,tk:.5});
    emit({k:'efx',z:'stdomefield',x:b.x,y:b.y,h:b.h,r:V.r,t:V.time,floor:b.floor,g:b.g});
  }
  G.sballs=G.sballs.filter(b=>b.t>0);
  for(const D of G.sdomes){
    D.t-=dt;D.tk-=dt;
    if(D.tk>1e-6)continue;
    D.tk+=.5;
    const p=G.players[D.owner];
    if(!p||p.team!==D.team)continue;
    for(const t of foesIn(D.team,D.x,D.y,V.r,D.h+V.r/20,D.h-(D.floor?0.5:V.r/20))){
      if(Math.hypot(t.x-D.x,t.y-D.y,(cH(t)-D.h)*20)>V.r+(t.r||PR))continue;
      if(natureTrace({x:D.x,y:D.y},t,D.h+.4,cH(t),D.team,true))continue;   // no damage through walls (user 2026-11-28)
      aoeHit({id:p.id,x:D.x,y:D.y,z:D.h-1.2},t,V.tick,hit=>shock(hit,p.id,V.shockT,false,D.g));
    }
  }
  G.sdomes=G.sdomes.filter(D=>D.t>1e-6);
}
