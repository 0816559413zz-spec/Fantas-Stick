// =====================================================================
//  สายสายฟ้า (ผู้เล่นออกแบบทั้งหมด — designs/storm.md)
//  Lightning stack (สูงสุด 5, ไม่หมดอายุ) ได้จาก Dash ทะลุศัตรู / เส้นสายฟ้า / ระเบิดโล่ — ได้ stack ใหม่ = ยิงครั้งถัดไปเป็นสายฟ้าสามเหลี่ยม
// =====================================================================
const ST_MAX=5;
function stGain(p){if(!p||p.pathIdx!==2)return;if((p.lst|0)<ST_MAX)p.lst=(p.lst|0)+1;p.emp=1;emit({k:'efx',z:'stgain',x:p.x,y:p.y,h:p.z+1.6,id:p.id,n:p.lst|0});}
function stSpend(p,n){if((p.lst|0)<n){emit({k:'efx',z:'nostack',x:p.x,y:p.y,h:p.z+2.2,id:p.id,n});return false;}p.lst-=n;return true;}
// ศัตรูในกรวยหน้า (ใช้กับลำสายฟ้า)
function stormCone(p,range,arc){const out=[],ph=p.z+1.1;
  for(const t of foesOf(p.team)){const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);if(d>range+(t.r||PR))continue;
    if(d>14&&Math.abs(angDiff(Math.atan2(dy,dx),p.ang))>arc)continue;if(Math.abs(cH(t)-ph)>3)continue;out.push(t);}
  return out;}
// ศัตรูในแนวเส้นตรง (เส้นสายฟ้า / Railgun)
function stormLineFoes(p,x,y,a,len,half,from){const c=Math.cos(a),sn=Math.sin(a),out=[];
  for(const t of foesOf(p.team)){const dx=t.x-x,dy=t.y-y,u=dx*c+dy*sn;if(u<(from||0)-(t.r||PR)||u>len+(t.r||PR))continue;
    if(Math.abs(-dx*sn+dy*c)>half+(t.r||PR))continue;if(Math.abs(cH(t)-(p.z+1.1))>4)continue;out.push(t);}
  return out;}
function stormBasic(p,inp,dt,setCd){
  const prev=p.bfPrev;p.bfPrev=inp.fire;
  // โล่สายฟ้า: คลิกขวา (กดครั้งเดียว) เปิด / กดอีกครั้งระเบิด — ระหว่างอัลติใช้ไม่ได้
  const shP=inp.sh&&!p.shPrv;p.shPrv=inp.sh;
  if(shP&&!(p.god>0)&&!p.sdome){if(p.stS)stormShieldBlast(p);else if(!(p.stCd>0)){p.stS={t:3,abs:0};emit({k:'efx',z:'ston',x:p.x,y:p.y,h:p.z,id:p.id});}}
  p.bTg=0;
  if(p.sdome){if(p.sdome.ph===2&&inp.fire&&!prev)stormDomeFire(p);p.beam=0;return;}
  if(p.rail||p.slnT>0){p.beam=0;return;}
  if(p.god>0){
    // อัลติ: กรงเล็บสายฟ้า 3 จังหวะ ระยะ 200 (15/15/25 จังหวะ 3 = Shock)
    p.beam=0;if(p.clT>0)p.clT-=dt;if(p.clR>0){p.clR-=dt;if(p.clR<=0)p.clN=0;}
    if(inp.fire&&!(p.clT>0)&&p.cEmp){p.cEmp=0;p.baHit=1;meleeHit(p,p.x,p.y,280,25,1.2,t=>shock(t,p.id,0.3));p.baHit=0;emit({k:'efx',z:'sclaw',x:p.x,y:p.y,h:p.z+1.1,a:Math.round(p.ang*100)/100,n:3,id:p.id});p.clT=0.4;p.clR=1;return;}
    if(inp.fire&&!(p.clT>0)){const n=p.clN|0;p.baHit=1;meleeHit(p,p.x,p.y,200,[15,15,25][n],0.8,n===2?t=>shock(t,p.id,0.3):null);
      p.baHit=0;emit({k:'efx',z:'sclaw',x:p.x,y:p.y,h:p.z+1.1,a:Math.round(p.ang*100)/100,n,id:p.id});p.clN=(n+1)%3;p.clT=0.35;p.clR=1;}
    return;}
  if(inp.fire&&!prev&&p.emp){p.emp=0;stormTri(p);p.beam=0;return;}
  if(inp.fire){
    if(!p.beam){p.beam=1;p.bTk=0;}
    const tg=stormCone(p,300,0.6);p.bTg=tg.slice(0,4).map(t=>[Math.round(t.x),Math.round(t.y),Math.round(cH(t)*10)/10]);
    p.bTk-=dt;if(p.bTk<=0){p.bTk=0.4;p.baHit=1;for(const t of tg)aoeHit(p,t,3);p.baHit=0;}
  }else p.beam=0;
}
// สายฟ้าสามเหลี่ยม: ยาว 250 ปลายกว้าง 120 ฟาดจากฟ้า 20 ดาเมจ + Shock
function stormTri(p){
  const c=Math.cos(p.ang),sn=Math.sin(p.ang);p.baHit=1;
  for(const t of foesOf(p.team)){const dx=t.x-p.x,dy=t.y-p.y,f=dx*c+dy*sn,l=-dx*sn+dy*c,r=t.r||PR;
    if(f<-r||f>250+r)continue;if(Math.abs(l)>60*Math.max(0,f)/250+r*0.7)continue;if(Math.abs(cH(t)-(p.z+1.1))>4)continue;
    aoeHit(p,t,20,t=>shock(t,p.id,0.3));}
  p.baHit=0;emit({k:'efx',z:'stri',x:p.x,y:p.y,h:p.z,a:Math.round(p.ang*100)/100,id:p.id});
}
function stormDash(p,inp,pr,dt,setCd){
  const rc=p.god>0?1:3;if(p.dch===undefined)p.dch=3;
  if(p.dch<3)p.dch=Math.min(3,p.dch+dt/rc);
  p.cd.dodge=p.dch>=1?0:(1-p.dch)*rc;p.cdMax.dodge=rc;
  if(pr.sp&&p.dch>=1&&!(p.dash>0)){
    let dx,dy;if(typeof inp.mx==='number'){dx=inp.mx;dy=inp.my;}else{dx=(inp.r?1:0)-(inp.l?1:0);dy=(inp.d?1:0)-(inp.u?1:0);}
    const l=Math.hypot(dx,dy);if(l>0.1){dx/=l;dy/=l;}else{dx=Math.cos(p.ang);dy=Math.sin(p.ang);}
    p.dch-=1;p.dash=0.15;p.dashSp=220/0.15;p.dashX=dx;p.dashY=dy;p.sdHit=new Set();p.sdAny=false;p.sdX=p.x;p.sdY=p.y;
    emit({k:'efx',z:'sdash',x:p.x,y:p.y,h:p.z+1,id:p.id});
  }
  return false;
}
// ระหว่าง Dash: ทะลุศัตรูคนละ 10 (อัลติ 15) • โดนอย่างน้อย 1 คน = +1 stack และยิงออร์บ
function stormDashTick(p){
  if(!p.sdHit)return;
  if(p.dash>0){
    for(const t of foesOf(p.team)){if(p.sdHit.has(t))continue;if(Math.hypot(t.x-p.x,t.y-p.y)>PR+(t.r||PR)+15||Math.abs(cH(t)-(p.z+1.1))>3)continue;
      p.sdHit.add(t);aoeHit(p,t,p.god>0?15:10);emit({k:'efx',z:'sdhit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),a:Math.round(Math.atan2(p.dashY,p.dashX)*100)/100});
      if(!p.sdAny){p.sdAny=true;stGain(p);stormOrbLaunch(p,t.x,t.y);if(p.god>0)p.cEmp=1;}}
  }else{emit({k:'efx',z:'sdashe',x:Math.round(p.sdX),y:Math.round(p.sdY),h:p.z+1,x2:Math.round(p.x),y2:Math.round(p.y),id:p.id});p.sdHit=null;}
}
function stormShieldBlast(p){
  const S=p.stS;p.stS=null;p.stCd=10;
  if(!S||S.abs<=0){emit({k:'efx',z:'stoff',x:p.x,y:p.y,h:p.z,id:p.id});return;}
  const dm=Math.min(30,S.abs/2);let any=false;
  emit({k:'efx',z:'stblast',x:p.x,y:p.y,h:p.z,r:150,n:Math.round(dm),id:p.id});
  for(const t of foesIn(p.team,p.x,p.y,150,p.z+4))if(aoeHit(p,t,dm,t=>shock(t,p.id,0.3)))any=true;
  if(any)stGain(p);
}
// ทุกเฟรม (สายฟ้า): เวลาโล่ / อัลติ / ร่ายเส้นสายฟ้า / Railgun / ออร์บ / Dash
function stormTick(p,dt){
  if(p.stS){p.stS.t-=dt;if(p.stS.t<=0)stormShieldBlast(p);}
  else if(p.stCd>0)p.stCd-=dt;
  p.shieldE=p.stS?100:100*(1-Math.max(0,p.stCd||0)/10);p.shieldBroken=0;
  if(p.god>0){p.god-=dt;if(p.god<=0){p.god=0;p.xhp=0;emit({k:'efx',z:'godoff',x:p.x,y:p.y,h:p.z+1,id:p.id});}}
  if(p.slnT>0){if(p.stun>0){p.slnT=0;}else{p.slnT-=dt;if(p.slnT<=0)stormLine(p);}}
  if(p.rail){if(p.stun>0)p.rail=null;else{p.rail.t-=dt;if(p.rail.t<=0)stormRailFire(p);}}
  if(p.sorb){p.sorb.t-=dt;if(p.sorb.t<=0||p.sorb.n<=0){p.sorb=null;emit({k:'efx',z:'sorboff',x:p.x,y:p.y,h:p.z+1.8,id:p.id});}}
}
// ----- สกิล 1 (ฟรี): เส้นสายฟ้า — ชี้ขึ้นแล้วกดลง 0.5 วิ จากนั้นสายฟ้าผ่าเป็นแนวจากตัวเราไปสุดระยะ 600 ใน 0.3 วิ -----
defSpell(2,{id:'thunderline',role:'builder',n:'เส้นสายฟ้า',ic:'⚡',cd:6,d:'ไม่ใช้ stack: ชูไม้ขึ้นแล้วกดลง (0.5 วิ) สายฟ้าผ่าเป็นแนวยาวจากตัวเราไปสุดระยะ 600 (กว้าง 50) ใน 0.3 วิ',fx:'โดนคนละ 20 ดาเมจ • โดนอย่างน้อย 1 คน = +1 Lightning stack',
  cast(p,S){p.slnT=0.5;emit({k:'efx',z:'slup',x:p.x,y:p.y,h:p.z+1,id:p.id});}});
function stormLine(p){
  const a=p.ang,c=Math.cos(a),sn=Math.sin(a);let len=600;
  for(let d=40;d<=600;d+=20){const x=p.x+c*d,y=p.y+sn*d;if(x<30||x>MW-30||y<30||y>MH-30){len=d-20;break;}}
  (G.slines||(G.slines=[])).push({x:p.x,y:p.y,a,len,d:0,hit:new Set(),owner:p.id,team:p.team,any:false});
  emit({k:'efx',z:'sline',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(a*1000)/1000,len:Math.round(len)});
}
// ----- สกิล 2 (1 stack): ดูดความเร็ว -----
defSpell(2,{id:'speedsiphon',role:'utility',n:'ดูดความเร็ว',ic:'💨',cd:10,d:'ใช้ 1 stack: ดูดสายฟ้าจากศัตรูรอบตัว (รัศมี 200) คนละ 15 ดาเมจ และขโมยความเร็ว 20% นาน 3 วิ',fx:'เราเร็วขึ้น 20% ต่อคนที่โดน (สูงสุด 60%) นาน 3 วิ • ระหว่างอัลติ: รัศมี 280 + Shock',
  cast(p,S){
    if(!stSpend(p,1))return false;
    const g=p.god>0,R=g?280:200,tg=[];let n=0;
    for(const t of foesIn(p.team,p.x,p.y,R,p.z+4)){if(aoeHit(p,t,15,t=>{addSlow(t,0.8,3);if(g)shock(t,p.id,0.3);})){n++;tg.push([Math.round(t.x),Math.round(t.y),Math.round(cH(t)*10)/10]);}}
    if(n>0){p.haste=3;p.hasteF=1+0.2*Math.min(3,n);}
    emit({k:'efx',z:'ssiph',x:p.x,y:p.y,h:p.z+1.1,id:p.id,r:R,tg:tg.slice(0,6)});
  }});
// ----- สกิล 3 (2 stacks): ฟ้าผ่าสามครั้ง — วางจุดครั้งเดียว ฟ้าผ่าจุดเดิม 3 ครั้ง ห่างกัน 0.5 วิ -----
defSpell(2,{id:'triplestrike',role:'control',n:'ฟ้าผ่าสามครั้ง',ic:'🌩️',cd:12,d:'ใช้ 2 stacks: กดแล้วเลือกจุด (เห็นวงก่อนวาง) กดซ้ำ/คลิกซ้าย = ยืนยัน • ระยะ 600 รัศมี 70 มีวงรูนเตือน แล้วฟ้าผ่าจุดเดิม 3 ครั้ง (0.6 วิ แล้วห่างกัน 0.5 วิ)',fx:'ครั้งละ 30 ดาเมจ (โดนครบ 3 = 90) • ระหว่างอัลติ: มีวงเล็กผ่าซ้าย/ขวาเพิ่มด้วย',
  cast(p,S){
    if(!stSpend(p,2))return false;
    const q=aimPoint(p,600),a=Math.atan2(q.y-p.y,q.x-p.x),pts=[[q.x,q.y,70]];
    if(p.god>0)for(const sd of [-1,1])pts.push([clamp(q.x-Math.sin(a)*110*sd,40,MW-40),clamp(q.y+Math.cos(a)*110*sd,40,MH-40),45]);
    for(const [x,y,r] of pts){
      emit({k:'efx',z:'tswarn',x:Math.round(x),y:Math.round(y),h:groundH(x,y),r});
      for(const tt of [0.6,1.1,1.6])G.strikes.push({x,y,r,t:tt,fn:s=>{
        emit({k:'efx',z:'tstrike',x:Math.round(s.x),y:Math.round(s.y),h:groundH(s.x,s.y),r:s.r});
        for(const t of foesIn(p.team,s.x,s.y,s.r,5))aoeHit(p,t,30);
        damageEnv(s.x,s.y,s.r,30,p.id,'lightning',0.5);   // พังบ้าน/ลัง
      }});
    }
  }});
// ----- สกิล 4 (1 stack): ออร์บสายฟ้าคู่ — ลอยหลังเรา Dash โดนศัตรู = ออร์บพุ่งกระแทกจุดนั้น -----
defSpell(2,{id:'stormorbs',role:'builder',n:'ออร์บสายฟ้าคู่',ic:'🔮',cd:8,d:'ใช้ 1 stack: ออร์บสายฟ้า 2 ลูกลอยหลังเรา 8 วิ • Dash โดนศัตรู = ยิงออร์บ 1 ลูก (ต่อ Dash) กระแทกจุดที่ Dash โดน',fx:'ลูกละ 15 ดาเมจ รัศมี 60 • ระหว่างอัลติ: Dash โดน = ออร์บที่เหลือพุ่งพร้อมกันหมด',
  cast(p,S){if(!stSpend(p,1))return false;p.sorb={n:2,t:8};emit({k:'efx',z:'sorbon',x:p.x,y:p.y,h:p.z+1.8,id:p.id});}});
function stormOrbLaunch(p,x,y){
  if(!p.sorb||p.sorb.n<=0)return;
  const k=p.god>0?p.sorb.n:1;p.sorb.n-=k;
  for(let i=0;i<k;i++){(G.sorbs||(G.sorbs=[])).push({x:x+(i?rnd(-20,20):0),y:y+(i?rnd(-20,20):0),t:0.18,owner:p.id,team:p.team});}
  emit({k:'efx',z:'sorbgo',x:p.x,y:p.y,h:p.z+1.8,x2:Math.round(x),y2:Math.round(y),n:k,id:p.id});
}
// ----- สกิล 5 (2 stacks): Railgun — เส้นเตือนเหลือง 0.8 วิ (อัลติ 0.5) แล้วลำสายฟ้าทะลุทุกคน -----
defSpell(2,{id:'railgun',role:'finisher',n:'Railgun',ic:'🔱',cd:10,d:'ใช้ 2 stacks: ร่ายวงเวท เส้นนำทางเหลืองแกนขาวลอยกลางอากาศ 0.8 วิ (ยืนนิ่ง กล้องล็อกทิศ) แล้วยิงลำสายฟ้ายาว 900 กว้าง 30 ทะลุทุกคน',fx:'45 ดาเมจ • ระหว่างอัลติ: เตือนแค่ 0.5 วิ ระยะ 1400',
  cast(p,S){if(!stSpend(p,2))return false;const g=p.god>0;p.rail={t:g?0.5:0.8,max:g?0.5:0.8,a:p.ang,len:g?1400:900};emit({k:'efx',z:'srailc',x:p.x,y:p.y,h:p.z+1,id:p.id});}});
function stormRailFire(p){
  const R=p.rail;p.rail=null;const c=Math.cos(R.a),sn=Math.sin(R.a);let len=R.len;
  for(let d=40;d<=R.len;d+=25){const x=p.x+c*d,y=p.y+sn*d;if(x<20||x>MW-20||y<20||y>MH-20){len=d;break;}}
  for(const t of stormLineFoes(p,p.x,p.y,R.a,len,15,0))aoeHit(p,t,45);
  for(let d=40;d<=len;d+=40)damageEnv(p.x+c*d,p.y+sn*d,30,45,p.id,'lightning',p.z+1.2);   // ลำทะลุบ้าน/ลัง
  emit({k:'efx',z:'srail',x:Math.round(p.x),y:Math.round(p.y),h:p.z+1.2,a:Math.round(R.a*1000)/1000,len:Math.round(len),id:p.id});
}
// ----- อัลติ: ร่างเทพสายฟ้า 10 วิ -----
defSpell(2,{id:'godlightning',role:'ult',n:'ร่างเทพสายฟ้า',ic:'⚡',cd:0,ult:true,d:'แปลงร่างเทพสายฟ้า 10 วิ: HP เสริม 75 • Dash ฟื้นชาร์จละ 1 วิ ทะลุ 15 ดาเมจ • ยิงปกติเป็นกรงเล็บสายฟ้า 3 จังหวะ ระยะ 200 (15/15/25 จังหวะ 3 = Shock) • Dash โดนศัตรู = ฟันครั้งถัดไปเป็นกรงเล็บใหญ่ ระยะ 280 กว้างขึ้น 25 ดาเมจ + Shock • ใช้โล่ไม่ได้',fx:'สกิลเก่งขึ้น: ดูดความเร็วไกลขึ้น+Shock • ออร์บพุ่งพร้อมกัน • Railgun เตือน 0.5 วิ ไกล 1400 • ฟ้าผ่าสามครั้งมีวงซ้าย/ขวา • ลูกสายฟ้าโดมเป็นทุบลงแบบ Dragonfall 80 ดาเมจ • stack ยังใช้เท่าเดิม',
  cast(p,S){p.god=10;p.xhp=75;p.dch=3;p.cEmp=0;if(p.stS){p.stS=null;p.stCd=0;}p.clN=0;emit({k:'efx',z:'godon',x:p.x,y:p.y,h:p.z,id:p.id});}});
// ----- สกิล 6 (3 stacks): ลูกสายฟ้าโดม — ทะยานขึ้น บินเล็ง 3 วิ คลิกยิงลูกสายฟ้า → โดมดูด 2 วิ แล้วระเบิด -----
function stormDomeTick(p,inp,dt){
  const D=p.sdome;D.t-=dt;
  if(!p.alive||p.downed){p.sdome=null;return;}
  if(D.ph<3&&(p.stun>0||p.frz>0)){p.sdome=null;p.vz=0;emit({k:'efx',z:'dfcancel',x:p.x,y:p.y,h:p.z,id:p.id});return;}
  if(D.ph===1){if(D.t<0.25)p.z+=(D.H-p.z)*Math.min(1,14*dt);p.vz=0;if(D.t<=0){D.ph=2;D.t=3;}}
  else if(D.ph===2){
    D.H=clamp(D.H+((inp.jh?1:0)-(inp.ch?1:0))*2.5*dt,D.g0+4.5,D.g0+7.5);p.z+=(D.H-p.z)*Math.min(1,6*dt);p.vz=0;
    const q=aimPoint(p,600);D.tx=q.x;D.ty=q.y;
    if(D.t<=0)stormDomeFire(p);
  }else{
    const k=1-Math.max(0,D.t)/0.45,gh=groundH(D.tx,D.ty);
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
  emit({k:'efx',z:'sdboom',x:Math.round(x),y:Math.round(y),h:gh+0.08,r:150,g:1});
  for(const t of foesIn(p.team,x,y,150,gh+4)){if(!t.isE&&!t.isM){const a=Math.atan2(y-t.y,x-t.x),d=Math.hypot(x-t.x,y-t.y);t.vx=(t.vx||0)+Math.cos(a)*Math.min(600,d*5);t.vy=(t.vy||0)+Math.sin(a)*Math.min(600,d*5);}aoeHit(p,t,80,t=>shock(t,p.id,0.3));}
  damageEnv(x,y,150,80,p.id,'lightning',gh);
}
function updateStorm(dt){
  if(G.slines&&G.slines.length){
    for(const L of G.slines){
      const d0=L.d;L.d=Math.min(L.len,L.d+L.len/0.3*dt);const o=G.players[L.owner];
      if(o)for(const t of stormLineFoes(o,L.x,L.y,L.a,L.d,25,d0-30)){if(L.hit.has(t))continue;L.hit.add(t);if(aoeHit(o,t,20)&&!L.any){L.any=true;stGain(o);}}
      if(L.d>=L.len)L.done=1;
    }
    G.slines=G.slines.filter(L=>!L.done);
  }
  if(G.sorbs&&G.sorbs.length){
    for(const b of G.sorbs){b.t-=dt;if(b.t<=0){b.done=1;const o=G.players[b.owner];emit({k:'efx',z:'sorbhit',x:Math.round(b.x),y:Math.round(b.y),h:groundH(b.x,b.y)+0.5});if(o)for(const t of foesIn(b.team,b.x,b.y,60,5))aoeHit(o,t,15);}}
    G.sorbs=G.sorbs.filter(b=>!b.done);
  }
  if(G.sballs&&G.sballs.length){
    for(const b of G.sballs){b.t-=dt;if(b.t<=0){b.done=1;(G.sdomes||(G.sdomes=[])).push({x:b.x,y:b.y,t:2,tk:0.5,owner:b.owner,team:b.team});emit({k:'efx',z:'sdome',x:Math.round(b.x),y:Math.round(b.y),h:groundH(b.x,b.y),r:150,t:2});}}
    G.sballs=G.sballs.filter(b=>!b.done);
  }
  if(G.sdomes&&G.sdomes.length){
    for(const D of G.sdomes){
      D.t-=dt;D.tk-=dt;const o=G.players[D.owner],tick=D.tk<=0;if(tick)D.tk+=0.5;
      for(const t of foesIn(D.team,D.x,D.y,150,5)){
        const dx=D.x-t.x,dy=D.y-t.y,d=Math.hypot(dx,dy);
        if(d>8&&!(t.isE&&isBig(t))){const st=Math.min(d-4,120*dt);t.x+=dx/d*st;t.y+=dy/d*st;}
        if(tick&&o)aoeHit(o,t,5);
      }
      if(D.t<=0){D.done=1;emit({k:'efx',z:'sdboom',x:Math.round(D.x),y:Math.round(D.y),h:groundH(D.x,D.y)+0.08,r:150});if(o)for(const t of foesIn(D.team,D.x,D.y,150,5))aoeHit(o,t,50,t=>shock(t,o.id,0.3));damageEnv(D.x,D.y,150,50,D.owner,'lightning',0.5);}
    }
    G.sdomes=G.sdomes.filter(D=>!D.done);
  }
}
