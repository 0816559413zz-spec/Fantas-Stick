// =====================================================================
//  สายสายฟ้า (ผู้เล่นออกแบบทั้งหมด — designs/storm.md)
//  Lightning stack (สูงสุด 5, ไม่หมดอายุ) ได้จาก Dash ทะลุศัตรู / เส้นสายฟ้า / ระเบิดโล่ — ได้ stack ใหม่ = ยิงครั้งถัดไปเป็นสายฟ้าสามเหลี่ยม
// =====================================================================
// ตัวเลขพื้นฐานของสายสายฟ้าอยู่ใน STORMV + v:{...} ของแต่ละสกิล — ปรับได้ใน tune.html / F8
const STORMV=PATHS[2].v={stackMax:5,beamR:300,beamArc:0.6,beamDmg:3,beamTick:0.4,triLen:250,triW:120,triDmg:20,shock:0.3,dashN:3,dashRc:3,dashDist:220,dashT:0.15,dashDmg:10,
  shieldT:3,shieldCd:10,blastMax:30,blastMul:0.5,blastR:150};
PATHS[2].vn={stackMax:'Lightning stack สูงสุด',beamR:'ลำสายฟ้า • ระยะ',beamArc:'ลำสายฟ้า • ครึ่งมุมกรวย (เรเดียน)',beamDmg:'ลำสายฟ้า • ดาเมจต่อครั้ง',beamTick:'ลำสายฟ้า • ทุก (วิ)',triLen:'สายฟ้าสามเหลี่ยม • ยาว',triW:'สายฟ้าสามเหลี่ยม • ปลายกว้าง',triDmg:'สายฟ้าสามเหลี่ยม • ดาเมจ',
  shock:'Shock • นาน (วิ)',dashN:'Dash • จำนวนชาร์จ',dashRc:'Dash • ฟื้นชาร์จละ (วิ)',dashDist:'Dash • ระยะ',dashT:'Dash • เวลา (วิ)',dashDmg:'Dash • ดาเมจทะลุ',shieldT:'โล่ • เปิดนาน (วิ)',shieldCd:'โล่ • คูลดาวน์ (วิ)',blastMax:'โล่ระเบิด • ดาเมจสูงสุด',blastMul:'โล่ระเบิด • ดาเมจ (เท่าของที่ดูดซับ)',blastR:'โล่ระเบิด • รัศมี'};
function stGain(p){if(!p||p.pathIdx!==2)return;if((p.lst|0)<STORMV.stackMax)p.lst=(p.lst|0)+1;p.emp=1;emit({k:'efx',z:'stgain',x:p.x,y:p.y,h:p.z+1.6,id:p.id,n:p.lst|0});}
function stSpend(p,n){if((p.lst|0)<n){emit({k:'efx',z:'nostack',x:p.x,y:p.y,h:p.z+2.2,id:p.id,n});return false;}p.lst-=n;return true;}
// ศัตรูในกรวยหน้า (ใช้กับลำสายฟ้า)
function stormCone(p,range,arc){const out=[],ph=p.z+1.1;
  for(const t of foesOf(p.team)){const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);if(d>range+(t.r||PR))continue;
    if(d>14&&Math.abs(angDiff(Math.atan2(dy,dx),p.ang))>arc)continue;if(!aimLineH(p,ph,t,3))continue;out.push(t);}
  return out;}
// ศัตรูในแนวเส้นตรง (เส้นสายฟ้า / Railgun)
function stormLineFoes(p,x,y,a,len,half,from){const c=Math.cos(a),sn=Math.sin(a),out=[];len=Math.min(len,windBlockLen(p.team,x,y,a,len,p.z+1.1));   // กำแพงลมศัตรูกันเส้นยิง
  for(const t of foesOf(p.team)){const dx=t.x-x,dy=t.y-y,u=dx*c+dy*sn;if(u<(from||0)-(t.r||PR)||u>len+(t.r||PR))continue;
    if(Math.abs(-dx*sn+dy*c)>half+(t.r||PR))continue;if(!aimLineH(p,p.z+1.1,t,4))continue;out.push(t);}
  return out;}
function stormBasic(p,inp,dt,setCd){
  const prev=p.bfPrev;p.bfPrev=inp.fire;
  // โล่สายฟ้า: คลิกขวา (กดครั้งเดียว) เปิด / กดอีกครั้งระเบิด — ระหว่างอัลติใช้ไม่ได้
  const shP=inp.sh&&!p.shPrv;p.shPrv=inp.sh;
  if(shP&&!(p.god>0)&&!p.sdome){if(p.stS)stormShieldBlast(p);else if(!(p.stCd>0)){p.stS={t:STORMV.shieldT,abs:0};emit({k:'efx',z:'ston',x:p.x,y:p.y,h:p.z,id:p.id});}}
  p.bTg=0;
  if(p.sdome){if(p.sdome.ph===2&&inp.fire&&!prev)stormDomeFire(p);p.beam=0;return;}
  if(p.rail||p.slnT>0){p.beam=0;return;}
  if(p.stStaff>0){p.beam=0;if(p.stWind>0){p.stWind-=dt;if(p.stWind<=0)stormWaveShoot(p);}else if(inp.fire&&p.cd.basic<=0){p.stWind=.13;p.stSide=-(p.stSide||1);emit({k:'efx',z:'sswing',x:Math.round(p.x),y:Math.round(p.y),h:p.z+1.2,n:p.stSide,id:p.id});setCd('basic',SIPH.v.cd);}return;}
  if(p.god>0){
    // อัลติ: กรงเล็บสายฟ้า 3 จังหวะ ระยะ 200 (15/15/25 จังหวะ 3 = Shock)
    p.beam=0;if(p.clT>0)p.clT-=dt;if(p.clR>0){p.clR-=dt;if(p.clR<=0)p.clN=0;}
    const GV=GODL.v;if(inp.fire&&!(p.clT>0)&&p.cEmp){p.cEmp=0;p.baHit=1;meleeHit(p,p.x,p.y,GV.bigR,GV.bigDmg,1.2,t=>shock(t,p.id,STORMV.shock));p.baHit=0;emit({k:'efx',z:'sclaw',x:p.x,y:p.y,h:p.z+1.1,a:Math.round(p.ang*100)/100,n:3,id:p.id});p.clT=0.4;p.clR=1;return;}
    if(inp.fire&&!(p.clT>0)){const n=p.clN|0;p.baHit=1;meleeHit(p,p.x,p.y,GV.clawR,[GV.c1,GV.c2,GV.c3][n],0.8,n===2?t=>shock(t,p.id,STORMV.shock):null);
      p.baHit=0;emit({k:'efx',z:'sclaw',x:p.x,y:p.y,h:p.z+1.1,a:Math.round(p.ang*100)/100,n,id:p.id});p.clN=(n+1)%3;p.clT=0.35;p.clR=1;}
    return;}
  if(inp.fire&&!prev&&p.emp){p.emp=0;stormTri(p);p.beam=0;return;}
  if(inp.fire){
    if(!p.beam){p.beam=1;p.bTk=0;}
    const tg=stormCone(p,STORMV.beamR,STORMV.beamArc);p.bTg=tg.slice(0,4).map(t=>[Math.round(t.x),Math.round(t.y),Math.round(cH(t)*10)/10]);
    p.bTk-=dt;if(p.bTk<=0){p.bTk=STORMV.beamTick;p.baHit=1;for(const t of tg)aoeHit(p,t,STORMV.beamDmg);p.baHit=0;}
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
function stormDash(p,inp,pr,dt,setCd){
  const rc=p.god>0?GODL.v.dashRc:STORMV.dashRc,N=STORMV.dashN;if(p.dch===undefined)p.dch=N;
  if(p.dch<N)p.dch=Math.min(N,p.dch+dt/rc);
  p.cd.dodge=p.dch>=1?0:(1-p.dch)*rc;p.cdMax.dodge=rc;
  if(pr.sp&&p.dch>=1&&!(p.dash>0)){
    let dx,dy;if(typeof inp.mx==='number'){dx=inp.mx;dy=inp.my;}else{dx=(inp.r?1:0)-(inp.l?1:0);dy=(inp.d?1:0)-(inp.u?1:0);}
    const l=Math.hypot(dx,dy);if(l>0.1){dx/=l;dy/=l;}else{dx=Math.cos(p.ang);dy=Math.sin(p.ang);}
    p.dch-=1;p.dash=STORMV.dashT;p.dashSp=STORMV.dashDist/STORMV.dashT;p.dashX=dx;p.dashY=dy;p.sdHit=new Set();p.sdAny=false;p.sdX=p.x;p.sdY=p.y;
    emit({k:'efx',z:'sdash',x:p.x,y:p.y,h:p.z+1,id:p.id});
  }
  return false;
}
// ระหว่าง Dash: ทะลุศัตรูคนละ 10 (อัลติ 15) • โดนอย่างน้อย 1 คน = +1 stack และยิงออร์บ
function stormDashTick(p){
  if(!p.sdHit)return;
  if(p.dash>0){
    for(const t of foesOf(p.team)){if(p.sdHit.has(t))continue;if(Math.hypot(t.x-p.x,t.y-p.y)>PR+(t.r||PR)+15||Math.abs(cH(t)-(p.z+1.1))>3)continue;
      p.sdHit.add(t);aoeHit(p,t,p.god>0?GODL.v.dashDmg:STORMV.dashDmg);emit({k:'efx',z:'sdhit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),a:Math.round(Math.atan2(p.dashY,p.dashX)*100)/100,g:p.god>0?1:0});
      if(!p.sdAny){p.sdAny=true;stGain(p);stormOrbLaunch(p,t.x,t.y,t);if(p.god>0)p.cEmp=1;}}
  }else{emit({k:'efx',z:'sdashe',x:Math.round(p.sdX),y:Math.round(p.sdY),h:p.z+1,x2:Math.round(p.x),y2:Math.round(p.y),a:Math.round(Math.atan2(p.y-p.sdY,p.x-p.sdX)*100)/100,len:Math.round(Math.hypot(p.x-p.sdX,p.y-p.sdY)),id:p.id});p.sdHit=null;}
}
function stormShieldBlast(p){
  const S=p.stS;p.stS=null;p.stCd=STORMV.shieldCd;
  if(!S||S.abs<=0){emit({k:'efx',z:'stoff',x:p.x,y:p.y,h:p.z,id:p.id});return;}
  const dm=Math.min(STORMV.blastMax,S.abs*STORMV.blastMul);let any=false;
  emit({k:'efx',z:'stblast',x:p.x,y:p.y,h:p.z,r:STORMV.blastR,n:Math.round(dm),id:p.id});
  for(const t of foesIn(p.team,p.x,p.y,STORMV.blastR,p.z+4))if(aoeHit(p,t,dm,t=>shock(t,p.id,STORMV.shock)))any=true;
  if(any)stGain(p);
}
// ทุกเฟรม (สายฟ้า): เวลาโล่ / อัลติ / ร่ายเส้นสายฟ้า / Railgun / ออร์บ / Dash
function stormTick(p,dt){
  if(p.stS){p.stS.t-=dt;if(p.stS.t<=0)stormShieldBlast(p);}
  else if(p.stCd>0)p.stCd-=dt;
  p.shieldE=p.stS?100:100*(1-Math.max(0,p.stCd||0)/STORMV.shieldCd);p.shieldBroken=0;
  if(p.god>0){p.god-=dt;if(p.god<=0){p.god=0;p.xhp=0;emit({k:'efx',z:'godoff',x:p.x,y:p.y,h:p.z+1,id:p.id});}}
  if(p.slnT>0){if(p.stun>0){p.slnT=0;}else{p.slnT-=dt;if(p.slnT<=0)stormLine(p);}}
  if(p.rail)stormBowTick(p,dt);if(p.stStaff>0)p.stStaff-=dt;
  if(p.sorb){p.sorb.t-=dt;if(p.sorb.t<=0||p.sorb.n<=0){p.sorb=null;emit({k:'efx',z:'sorboff',x:p.x,y:p.y,h:p.z+1.8,id:p.id});}}
}
// ----- สกิล 1 (ฟรี): เส้นสายฟ้า — ชี้ขึ้นแล้วกดลง 0.5 วิ จากนั้นสายฟ้าผ่าเป็นแนวจากตัวเราไปสุดระยะ 600 ใน 0.3 วิ -----
const TLINE=defSpell(2,{id:'thunderline',v:{windup:0.5,len:600,w:50,dmg:20,travel:0.3},vn:{windup:'ท่าเตรียม (วิ)',len:'ยาว',w:'กว้าง',dmg:'ดาเมจ',travel:'สายฟ้าวิ่งสุดแนวใน (วิ)'},role:'builder',n:'เส้นสายฟ้า',ic:'⚡',cd:6,d:'ไม่ใช้ stack: ชูไม้ขึ้นแล้วกดลง (0.5 วิ) สายฟ้าผ่าเป็นแนวยาวจากตัวเราไปสุดระยะ 600 (กว้าง 50) ใน 0.3 วิ',fx:'โดนคนละ 20 ดาเมจ • โดนอย่างน้อย 1 คน = +1 Lightning stack',
  cast(p,S){p.slnT=S.v.windup;emit({k:'efx',z:'slup',x:p.x,y:p.y,h:p.z+1,id:p.id});}});
function stormLine(p){
  const a=p.ang,c=Math.cos(a),sn=Math.sin(a),L0=TLINE.v.len;let len=L0;
  for(let d=40;d<=L0;d+=20){const x=p.x+c*d,y=p.y+sn*d;if(x<30||x>MW-30||y<30||y>MH-30){len=d-20;break;}}
  (G.slines||(G.slines=[])).push({x:p.x,y:p.y,a,len,d:0,hit:new Set(),owner:p.id,team:p.team,any:false});
  emit({k:'efx',z:'sline',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*1000)/1000,len:Math.round(len),id:p.id});
}
// ----- สกิล 2 (1 stack): ดูดความเร็ว -----
const SIPH=defSpell(2,{id:'speedsiphon',v:{cost:2,time:6,cd:0.7,dmg:20,spd:1500,range:700},vn:{cost:'ใช้ stack',time:'อยู่นาน (วิ)',cd:'เว้นต่อคลื่น (วิ)',dmg:'ดาเมจคลื่น',spd:'ความเร็วคลื่น',range:'ระยะคลื่น'},role:'damage',n:'ไม้เท้าสายฟ้า',ic:'⚡',cd:10,d:'ใช้ 2 stack: ไม้ยาวขึ้นด้วยสายฟ้า 6 วิ โจมตีปกติเปลี่ยนเป็นคลื่นดาบสายฟ้า ระยะ 700 ดาเมจ 20 ทุก 0.7 วิ ตีคนบนฟ้าได้',
  cast(p,S){if(!stSpend(p,S.v.cost))return false;p.stStaff=S.v.time;emit({k:'efx',z:'ssta',x:Math.round(p.x),y:Math.round(p.y),h:p.z+1.2,id:p.id});}});
function stormWaveShoot(p){const V=SIPH.v;Object.assign(PDEF.swave,{spd:V.spd,life:V.range/V.spd,dmg:V.dmg});const pr=shoot(p,'swave',{sp:'b_storm',dmg:V.dmg,quiet:1});pr.pierce=1;pr.hs=new Set();pr.hw=40;}
// ----- สกิล 3 (2 stacks): ฟ้าผ่าสามครั้ง — วางจุดครั้งเดียว ฟ้าผ่าจุดเดิม 3 ครั้ง ห่างกัน 0.5 วิ -----
const TSTR=defSpell(2,{id:'triplestrike',v:{cost:2,range:600,r:100,dmg:30,env:30,delay:0.6,gap:0.5,spd:40,seek:300,sideR:45,side:110},vn:{cost:'ใช้ stack',range:'ระยะวาง',r:'รัศมีวง',dmg:'ดาเมจต่อครั้ง',env:'ดาเมจใส่บ้าน/ของ',delay:'ผ่าครั้งแรกหลัง (วิ)',gap:'เว้นระหว่างครั้ง (วิ)',spd:'วงเลื่อนหาศัตรู • ความเร็ว',seek:'วงเลื่อนหาศัตรู • มองไกล',sideR:'อัลติ • รัศมีวงข้าง',side:'อัลติ • วงข้างห่าง'},role:'control',n:'ฟ้าผ่าสามครั้ง',ic:'🌩️',cd:12,d:'ใช้ 2 stacks: กดแล้วเลือกจุด (เห็นวงก่อนวาง) กดซ้ำ/คลิกซ้าย = ยืนยัน • ระยะ 600 รัศมี 70 มีวงรูนเตือน แล้วฟ้าผ่าจุดเดิม 3 ครั้ง (0.6 วิ แล้วห่างกัน 0.5 วิ)',fx:'ครั้งละ 30 ดาเมจ (โดนครบ 3 = 90) • ระหว่างอัลติ: มีวงเล็กผ่าซ้าย/ขวาเพิ่มด้วย',
  cast(p,S){
    const V=S.v;if(!stSpend(p,V.cost))return false;
    const q=aimPoint(p,V.range),a=Math.atan2(q.y-p.y,q.x-p.x),pts=[[q.x,q.y,V.r]];
    if(p.god>0)for(const sd of [-1,1])pts.push([clamp(q.x-Math.sin(a)*V.side*sd,40,MW-40),clamp(q.y+Math.cos(a)*V.side*sd,40,MH-40),V.sideR]);
    for(const [x,y,r] of pts){
      const c={x,y,r,i:(G.tsid=(G.tsid|0)+1),team:p.team,t:V.delay+V.gap*2+0.05,mt:0};(G.tcells||(G.tcells=[])).push(c);
      emit({k:'efx',z:'tswarn',x:Math.round(x),y:Math.round(y),h:groundH(x,y),r,i:c.i});
      for(const tt of [V.delay,V.delay+V.gap,V.delay+V.gap*2])G.strikes.push({c,r,t:tt,fn:s=>{const C=s.c;
        emit({k:'efx',z:'tstrike',x:Math.round(C.x),y:Math.round(C.y),h:groundH(C.x,C.y),r:s.r,i:C.i,id:p.id});
        for(const t of foesIn(p.team,C.x,C.y,s.r,5))aoeHit(p,t,V.dmg);
        damageEnv(C.x,C.y,s.r,V.env,p.id,'lightning',0.5);   // พังบ้าน/ลัง
      }});
    }
  }});
// วงฟ้าผ่าเลื่อนช้า ๆ หาศัตรูที่ใกล้ที่สุด (ผู้ใช้ 2026-10-22) • ⚠ Claude: 40 px/วิ (2 ม./วิ) มองหาในระยะ 300 จากวง • ส่งตำแหน่งใหม่ทุก 0.1 วิ (efx tsmv)
function updateTCells(dt){
  if(!G.tcells||!G.tcells.length)return;
  const TV=TSTR.v;for(const c of G.tcells){c.t-=dt;let best=null,bd=TV.seek;
    for(const t of foesOf(c.team)){const d=Math.hypot(t.x-c.x,t.y-c.y);if(d<bd){bd=d;best=t;}}
    if(best&&bd>8){const st=Math.min(bd-8,TV.spd*dt);c.x+=(best.x-c.x)/bd*st;c.y+=(best.y-c.y)/bd*st;c.mv=1;}
    c.mt-=dt;if(c.mv&&c.mt<=0){c.mt=0.1;c.mv=0;emit({k:'efx',z:'tsmv',i:c.i,x:Math.round(c.x),y:Math.round(c.y),h:groundH(c.x,c.y)});}}
  G.tcells=G.tcells.filter(c=>c.t>0);
}
// ----- สกิล 4 (1 stack): ออร์บสายฟ้าคู่ — ลอยหลังเรา Dash โดนศัตรู = ออร์บพุ่งกระแทกจุดนั้น -----
const SORBS=defSpell(2,{id:'stormorbs',v:{cost:1,n:2,time:8,dmg:15,r:60,fly:0.55},vn:{cost:'ใช้ stack',n:'จำนวนออร์บ',time:'อยู่นาน (วิ)',dmg:'ดาเมจต่อลูก',r:'รัศมีระเบิด',fly:'บินถึงเป้า (วิ)'},role:'builder',n:'ออร์บสายฟ้าคู่',ic:'🔮',cd:8,d:'ใช้ 1 stack: ออร์บสายฟ้า 2 ลูกลอยหลังเรา 8 วิ • Dash โดนศัตรู = ยิงออร์บ 1 ลูก (ต่อ Dash) กระแทกจุดที่ Dash โดน',fx:'ลูกละ 15 ดาเมจ รัศมี 60 • ระหว่างอัลติ: Dash โดน = ออร์บที่เหลือพุ่งพร้อมกันหมด',
  cast(p,S){if(!stSpend(p,S.v.cost))return false;p.sorb={n:S.v.n,t:S.v.time};emit({k:'efx',z:'sorbon',x:p.x,y:p.y,h:p.z+1.8,id:p.id});}});
// ⚠ Claude: บิน 0.55 วิ (ลอยขึ้น 0.2 + โค้งลง 0.35) ตามตัวคนที่ Dash โดน • คนนั้นตาย/หาย = ไปจุดเดิม
function stormOrbLaunch(p,x,y,tg){
  if(!p.sorb||p.sorb.n<=0)return;
  const k=p.god>0?p.sorb.n:1;p.sorb.n-=k;
  for(let i=0;i<k;i++){(G.sorbs||(G.sorbs=[])).push({x:x+(i?rnd(-20,20):0),y:y+(i?rnd(-20,20):0),ox:i?rnd(-20,20):0,oy:i?rnd(-20,20):0,tg:tg||null,t:SORBS.v.fly+i*0.08,owner:p.id,team:p.team});}
  emit({k:'efx',z:'sorbgo',x:p.x,y:p.y,h:p.z+1.8,x2:Math.round(x),y2:Math.round(y),n:k,id:p.id,T:SORBS.v.fly,tg:tg?(tg.isE?'e'+tg.id:tg.id):undefined});
}
// ----- สกิล 5 (2 stacks): Railgun — เส้นเตือนเหลือง 0.8 วิ (อัลติ 0.5) แล้วลำสายฟ้าทะลุทุกคน -----
Object.assign(PDEF,{swave:{spd:1500,r:16,dmg:25,life:.47,col:'#8fd8ff'}});
const RAIL=defSpell(2,{id:'railgun',v:{cost:3,draw:1.8,len:1000,dmg:75,env:45,slow:0.28,shockT:1,w:20},vn:{cost:'ใช้ stack',draw:'ง้างเต็ม (วิ)',len:'ระยะ',dmg:'ดาเมจ',env:'ดาเมจใส่บ้าน/ของ',slow:'เดินตอนเล็ง (เท่า)',shockT:'Shock บินไม่ขึ้น (วิ)',w:'กว้างลูกธนู'},
  n:'ธนูสายฟ้า',d:'เข้าโหมดเล็ง กดซ้ายค้างง้าง 1.8 วิ ง้างไม่เต็มปล่อย = ไม่ยิงและเสีย 3 stack ระยะ 1000 ดาเมจ 75 โดนแล้วฟ้าผ่าลง Shock 1 วิ คนบนฟ้าบินไม่ขึ้น',ic:'🏹',role:'damage',cd:8,
  cast(p,S){if(p.rail)return false;const V=S.v;if(!stSpend(p,V.cost))return false;p.rail={d:0,t:V.draw,max:V.draw,a:p.ang,len:V.len,armed:!p.inp?.fire,s0:!!p.inp?.sh,life:7};emit({k:'efx',z:'srailc',x:p.x,y:p.y,h:p.z+1,id:p.id});}});
function stormBowTick(p,dt){const R=p.rail,V=RAIL.v,inp=p.inp||{};R.a=p.ang;R.life-=dt;
  if(p.stun>0||!p.alive||R.life<=0||(inp.sh&&!R.s0)){p.rail=null;return;}R.s0=!!inp.sh;
  if(p.bot){R.d+=dt;R.t=Math.max(0,V.draw-R.d);if(R.d>=V.draw)stormBowFire(p);return;}
  R.d+=dt;R.t=Math.max(0,V.draw-R.d);   // charges by itself as soon as the bow is out
  if(!R.armed){if(!inp.fire)R.armed=true;return;}
  if(inp.fire){if(R.d>=V.draw)stormBowFire(p);else{p.rail=null;emit({k:'efx',z:'sbowfail',x:Math.round(p.x),y:Math.round(p.y),h:p.z+1.4,id:p.id});}}}
function stormBowFire(p){const V=RAIL.v;p.rail=null;const h0=p.z+1.5,inp=p.inp||{},r=aimRay3(p,h0,V.len);let ex,ey,eh;
  if(r){ex=r.x;ey=r.y;eh=r.h;}else{const ap=clamp(inp.ap||0,-1.5,1.5);ex=p.x+Math.cos(p.ang)*V.len;ey=p.y+Math.sin(p.ang)*V.len;eh=h0+Math.tan(ap)*V.len/20;}
  const dx=ex-p.x,dy=ey-p.y,dh=(eh-h0)*20,L=Math.max(1,Math.hypot(dx,dy,dh));let best=null,bu=2;
  for(const t of foesOf(p.team)){if(t.dead||t.alive===false||t.downed)continue;const tx0=t.x-p.x,ty0=t.y-p.y,tz0=(cH(t)-h0)*20,u=(tx0*dx+ty0*dy+tz0*dh)/(L*L);if(u<0||u>1||u>=bu)continue;const off=Math.hypot(tx0-dx*u,ty0-dy*u,tz0-dh*u);if(off<=(t.r||PR)+V.w){bu=u;best=t;}}
  if(best){ex=best.x;ey=best.y;eh=cH(best);aoeHit(p,best,V.dmg,t=>{t.shk=V.shockT;t.shkSrc=p.id;t.boltDown=V.shockT;});}
  damageEnv(ex,ey,40,V.env,p.id,'lightning',eh);
  emit({k:'efx',z:'sbow',x:Math.round(p.x),y:Math.round(p.y),h:h0,x2:Math.round(ex),y2:Math.round(ey),h2:Math.round(eh*10)/10,hit:!!best,id:p.id});}
// ----- อัลติ: ร่างเทพสายฟ้า 10 วิ -----
const GODL=defSpell(2,{id:'godlightning',v:{time:10,xhp:75,dashRc:1,dashDmg:15,c1:15,c2:15,c3:25,clawR:200,bigR:280,bigDmg:25,slamR:150,slamDmg:80},vn:{time:'อยู่นาน (วิ)',xhp:'HP เสริม',dashRc:'Dash ฟื้นชาร์จละ (วิ)',dashDmg:'Dash • ดาเมจทะลุ',c1:'กรงเล็บ • จังหวะ 1',c2:'กรงเล็บ • จังหวะ 2',c3:'กรงเล็บ • จังหวะ 3',clawR:'กรงเล็บ • ระยะ',bigR:'กรงเล็บใหญ่ • ระยะ',bigDmg:'กรงเล็บใหญ่ • ดาเมจ',slamR:'ลูกสายฟ้าโดม (อัลติ) • รัศมีทุบ',slamDmg:'ลูกสายฟ้าโดม (อัลติ) • ดาเมจทุบ'},role:'ult',n:'ร่างเทพสายฟ้า',ic:'⚡',cd:0,ult:true,d:'แปลงร่างเทพสายฟ้า 10 วิ: HP เสริม 75 • Dash ฟื้นชาร์จละ 1 วิ ทะลุ 15 ดาเมจ • ยิงปกติเป็นกรงเล็บสายฟ้า 3 จังหวะ ระยะ 200 (15/15/25 จังหวะ 3 = Shock) • Dash โดนศัตรู = ฟันครั้งถัดไปเป็นกรงเล็บใหญ่ ระยะ 280 กว้างขึ้น 25 ดาเมจ + Shock • ใช้โล่ไม่ได้',fx:'สกิลเก่งขึ้น: ดูดความเร็วไกลขึ้น+Shock • ออร์บพุ่งพร้อมกัน • Railgun เตือน 0.5 วิ ไกล 1400 • ฟ้าผ่าสามครั้งมีวงซ้าย/ขวา • ลูกสายฟ้าโดมเป็นทุบลงแบบ Dragonfall 80 ดาเมจ • stack ยังใช้เท่าเดิม',
  cast(p,S){p.god=S.v.time;p.xhp=S.v.xhp;p.dch=STORMV.dashN;p.cEmp=0;if(p.stS){p.stS=null;p.stCd=0;}p.clN=0;emit({k:'efx',z:'godon',x:p.x,y:p.y,h:p.z,id:p.id});}});
// ----- สกิล 6 (3 stacks): ลูกสายฟ้าโดม — ทะยานขึ้น บินเล็ง 3 วิ คลิกยิงลูกสายฟ้า → โดมดูด 2 วิ แล้วระเบิด -----
function stormDomeTick(p,inp,dt){
  const D=p.sdome;D.t-=dt;
  if(!p.alive||p.downed){p.sdome=null;return;}
  if(D.ph<3&&(p.stun>0||p.frz>0)){p.sdome=null;p.vz=0;emit({k:'efx',z:'dfcancel',x:p.x,y:p.y,h:p.z,id:p.id});return;}
  if(D.ph===1){if(D.t<0.25)p.z+=(D.H-p.z)*Math.min(1,14*dt);p.vz=0;if(D.t<=0){D.ph=2;D.t=SDOME.v.fly;}}
  else if(D.ph===2){
    D.H=clamp(D.H+((inp.jh?1:0)-(inp.ch?1:0))*2.5*dt,D.g0+4.5,D.g0+7.5);p.z+=(D.H-p.z)*Math.min(1,6*dt);p.vz=0;
    const q=aimClip(p.x,p.y,p.z,aimPoint(p,SDOME.v.range),PR+6);D.tx=q.x;D.ty=q.y;D.th=q.hit?q.h:null;   // ไม่ทะลุบ้าน
    if(D.t<=0)stormDomeFire(p);
  }else{
    const k=1-Math.max(0,D.t)/0.45,gh=D.th!=null?D.th:groundH(D.tx,D.ty);
    p.x=lerp(D.sx,D.tx,k);p.y=lerp(D.sy,D.ty,k);p.z=lerp(D.sz,gh,k*k);p.vz=0;
    if(D.t<=0){p.x=D.tx;p.y=D.ty;p.z=gh;p.sdome=null;stormDomeSlam(p,D.tx,D.ty,gh);}
  }
}
function stormDomeFire(p){
  const D=p.sdome;
  if(D.god){D.ph=3;D.t=0.45;D.sx=p.x;D.sy=p.y;D.sz=p.z;emit({k:'efx',z:'dfdive',x:p.x,y:p.y,h:p.z,x2:Math.round(D.tx),y2:Math.round(D.ty),id:p.id});return;}
  p.sdome=null;p.vz=-12;
  (G.sballs||(G.sballs=[])).push({x:D.tx,y:D.ty,t:0.3,owner:p.id,team:p.team});
  emit({k:'efx',z:'sdball',x:Math.round(p.x),y:Math.round(p.y),h:p.z+2,x2:Math.round(D.tx),y2:Math.round(D.ty),id:p.id});
}
// อัลติ: ทุบลงพร้อมลูกสายฟ้า — ดูดเข้ากลาง + ระเบิดทันที 80
function stormDomeSlam(p,x,y,gh){
  const GV=GODL.v;emit({k:'efx',z:'sdboom',x:Math.round(x),y:Math.round(y),h:gh+0.08,r:GV.slamR,g:1});
  for(const t of foesIn(p.team,x,y,GV.slamR,gh+4)){if(!t.isE&&!t.isM){const a=Math.atan2(y-t.y,x-t.x),d=Math.hypot(x-t.x,y-t.y);t.vx=(t.vx||0)+Math.cos(a)*Math.min(600,d*5);t.vy=(t.vy||0)+Math.sin(a)*Math.min(600,d*5);}aoeHit(p,t,GV.slamDmg,t=>shock(t,p.id,STORMV.shock));}
  damageEnv(x,y,GV.slamR,GV.slamDmg,p.id,'lightning',gh);
}
function updateStorm(dt){
  updateTCells(dt);
  if(G.slines&&G.slines.length){
    for(const L of G.slines){
      const d0=L.d;L.d=Math.min(L.len,L.d+L.len/TLINE.v.travel*dt);const o=G.players[L.owner];
      if(o)for(const t of stormLineFoes(o,L.x,L.y,L.a,L.d,TLINE.v.w/2,d0-30)){if(L.hit.has(t))continue;L.hit.add(t);if(aoeHit(o,t,TLINE.v.dmg)&&!L.any){L.any=true;stGain(o);}}
      if(L.d>=L.len)L.done=1;
    }
    G.slines=G.slines.filter(L=>!L.done);
  }
  if(G.sorbs&&G.sorbs.length){
    for(const b of G.sorbs){b.t-=dt;if(b.tg&&!b.tg.dead&&b.tg.alive!==false){b.x=b.tg.x+b.ox;b.y=b.tg.y+b.oy;}if(b.t<=0){b.done=1;const o=G.players[b.owner];emit({k:'efx',z:'sorbhit',x:Math.round(b.x),y:Math.round(b.y),h:groundH(b.x,b.y)+0.5,id:b.owner});if(o)for(const t of foesIn(b.team,b.x,b.y,SORBS.v.r,5))aoeHit(o,t,SORBS.v.dmg);}}
    G.sorbs=G.sorbs.filter(b=>!b.done);
  }
  if(G.sballs&&G.sballs.length){
    for(const b of G.sballs){b.t-=dt;if(b.t<=0){b.done=1;const DV=SDOME.v;(G.sdomes||(G.sdomes=[])).push({x:b.x,y:b.y,t:DV.time,tk:0.5,owner:b.owner,team:b.team});emit({k:'efx',z:'sdome',x:Math.round(b.x),y:Math.round(b.y),h:groundH(b.x,b.y),r:DV.r,t:DV.time});}}
    G.sballs=G.sballs.filter(b=>!b.done);
  }
  if(G.sdomes&&G.sdomes.length){
    const DV=SDOME.v;for(const D of G.sdomes){
      D.t-=dt;D.tk-=dt;const o=G.players[D.owner],tick=D.tk<=0;if(tick)D.tk+=0.5;
      for(const t of foesIn(D.team,D.x,D.y,DV.r,5)){
        const dx=D.x-t.x,dy=D.y-t.y,d=Math.hypot(dx,dy);
        if(d>8&&!(t.isE&&isBig(t))){const st=Math.min(d-4,DV.pull*dt);t.x+=dx/d*st;t.y+=dy/d*st;}
        if(tick&&o)aoeHit(o,t,DV.tick);
      }
      if(D.t<=0){D.done=1;emit({k:'efx',z:'sdboom',x:Math.round(D.x),y:Math.round(D.y),h:groundH(D.x,D.y)+0.08,r:DV.r});if(o)for(const t of foesIn(D.team,D.x,D.y,DV.r,5))aoeHit(o,t,DV.boom,t=>shock(t,o.id,STORMV.shock));damageEnv(D.x,D.y,DV.r,DV.env,D.owner,'lightning',0.5);}
    }
    G.sdomes=G.sdomes.filter(D=>!D.done);
  }
}
