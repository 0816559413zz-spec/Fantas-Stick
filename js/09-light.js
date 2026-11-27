// =====================================================================
//  สายแสง ✨ Radiance (ผู้ใช้ออกแบบทั้งหมด — designs/light.md) • ฝั่งโฮสต์ • รอบแรก 2026-11-16: ระบบเกมก่อน ภาพชั่วคราว
//  กลไกหลัก: คริสตัล 3 ชิ้น — เก็บกับตัว (BA/โล่/สกิลแรงขึ้น) หรือส่งให้คู่หูที่ลิงก์ (กัน/ตีแรง 5% ต่อชิ้น)
//  BA Prism Ray (ลำแสงตามจำนวนคริสตัล) • โล่ Crystal Aegis (หกเหลี่ยมหน้า HP ตามคริสตัล) • Dash Light Step (วาร์ป/ไปหาคู่หู)
//  สกิล: Crystal Bond • Shard Volley • Empower Light • Sanctum Crystal • Shard Storm • Radiant Sovereign
//  สถานะผู้เล่น: p.lc = คริสตัลกับตัว • p.lgA = id คู่หูที่ลิงก์ (หรือ 'prism' = ปริซึมที่วาง) • คู่หู t.lgN = คริสตัลที่ได้ • t.lgFrom = id เรา
// =====================================================================
const LIGHTP=PATHS.length;
ICONS.add('radiantsovereign');
PATHS.push({id:'light',n:'สายแสง',ic:'✨',col:'#ffe9a8',d:'ซัพพอร์ตคู่หู — แบ่งคริสตัล 3 ชิ้นให้ตัวเองหรือเพื่อนที่ลิงก์ ยิงลำแสง ฮีลพื้นที่ วางกับดักล่องหน',
  combo:'Crystal Bond ส่งคริสตัลให้เพื่อน (กัน/ตีแรงขึ้น) • เก็บไว้เอง = ลำแสง/โล่แรงสุด • Empower Light บัฟทั้งเราและเพื่อน • Light Step วาร์ปไปหาเพื่อน ให้โล่ลดดาเมจ'});
const LTV=PATHS[LIGHTP].v={max:3,linkR:650,linkPick:160,sendT:0.3,holdT:0.4,allyDR:0.05,allyDmg:0.05,
  baRange:600,baCharge:0.6,heatT:8,heatIdle:2,heatDrain:2,ohT:2,baFloat:0.5,baRise:1.3,baMove:0.7,ba0:[5,1.0],ba1:[7,0.5],ba2:[12,0.5],ba3:[15,0.4],baW:[10,14,18,22],
  shHp:[0,50,80,120],shReg:1,   // user 2026-11-25: shield back for Radiance only, less health (was 120/180/300)
  dsDist:250,dsAllyR:900,dsPick:180,dsCd:8,dsDmg:15,dsR:150,dsDR:0.3,dsDRT:2,
  prismT:0};   // 0 = ปริซึมอยู่ตลอดจนเรียกคืน/ลิงก์ใหม่ (ผู้ใช้ 2026-11-18)
PATHS[LIGHTP].vn={max:'คริสตัลสูงสุด',linkR:'ลิงก์ • ระยะหลุด',allyDR:'คริสตัลกับเพื่อน • กันดาเมจ/ชิ้น',allyDmg:'คริสตัลกับเพื่อน • ตีแรง/ชิ้น',
  baRange:'Prism Ray • ระยะ',shReg:'Crystal Aegis • ฟื้นเกจ (เท่า สายอื่น=1)',dsDist:'Light Step • วาร์ป',dsCd:'Light Step • คูลดาวน์',dsDmg:'Light Step • ระเบิดตอนถึงคู่หู',dsR:'Light Step • รัศมี'};
const lgOn=p=>p&&p.pathIdx===LIGHTP;
function lightShieldPitch(p){return clamp(p.inp?.ap||0,-1.5,1.5);}
const lightShieldGauge=p=>100/LTV.shHp[Math.max(1,Math.min(3,p.lc|0))];
function lightClearBond(a){
  if(a.lgEmpT>G.time)emit({k:'efx',z:'lgempend',id:a.id,x:Math.round(a.x),y:Math.round(a.y)});
  a.lgN=0;a.lgFrom=null;a.lgEmpT=0;a.lgEmpCd=0;
}
function lightReset(p,restoreUlt=false){
  if(p.lgUlt)lightUltEnd(p,restoreUlt,restoreUlt);
  p.lgUltWard=null;
  if(p.lgA&&p.lgA!=='prism'){const a=G.players[p.lgA];if(a&&a.lgFrom===p.id)lightClearBond(a);}
  p.lc=LTV.max;p.lgA=null;p.lgPr=null;p.lgHold=0;p.lgSend=null;p.lgEmp=0;p.lgVol=null;p.lgSan=null;p.lgVeil=null;p.lgUlt=null;p.lgBaT=0;p.lgDch=1;p.lgBeam=0;
  p.lgChg=p.lgFl=p.lgHeat=p.lgHI=p.lgOH=p.lgFiring=p.lgBeamW=0;}
function lightAlly(p){if(!p.lgA||p.lgA==='prism')return null;const a=G.players[p.lgA];return a&&a.alive&&!a.downed?a:null;}
function lightLinkPos(p){if(p.lgA==='prism'&&p.lgPr)return p.lgPr;const a=lightAlly(p);return a?{x:a.x,y:a.y,h:(a.z||0)}:null;}
function lightUnlink(p,recall=false,instant=false){
  const a=p.lgA&&p.lgA!=='prism'?G.players[p.lgA]:null;
  const ally=a?.lgFrom===p.id?a:null,source=ally||p.lgPr;
  const held=ally?ally.lgN|0:p.lgPr?.n|0;
  const restored=Math.min(held,Math.max(0,LTV.max-p.lc));
  if(ally)lightClearBond(ally);
  p.lc+=restored;
  p.lgA=null;p.lgPr=null;
  const ev={k:'efx',x:Math.round(p.x),y:Math.round(p.y),h:p.z+1.4,id:p.id};
  if(recall){
    const origin={};
    if(restored>0&&source){
      const h2=ally?ally.z+1.55:source.h+1;
      Object.assign(origin,{x2:Math.round(source.x),y2:Math.round(source.y),h2,blocked:!!natureTrace(p,source,ev.h,h2,p.team,true)});
    }
    emit({...ev,...origin,z:'lgrecall',n:restored,instant});
  }else emit({...ev,z:'lgunlink'});
}
function lightReleaseAlly(a){
  if(!a.lgFrom)return;
  const owner=G.players[a.lgFrom];
  if(owner&&owner.lgA===a.id)lightUnlink(owner,true,true);
  else lightClearBond(a);
}
// Crystal Bond locks on to one living, visible teammate in the aim cone.
function lightBondTarget(p){
  const i=p.inp||{},h=(p.z||0)+1.35,base=GY(p.x,p.y);
  const ax=Number.isFinite(i.ax)?i.ax:p.x+Math.cos(p.ang)*LTV.linkR;
  const ay=Number.isFinite(i.ay)?i.ay:p.y+Math.sin(p.ang)*LTV.linkR;
  const az=Number.isFinite(i.ah)?(i.ah-h)*20:0;
  const dx=ax-p.x,dy=ay-p.y,aim=Math.hypot(dx,dy,az);
  if(aim<1)return null;
  let best=null,score=Infinity;
  for(const q of plist()){
    if(q===p||q.team!==p.team||!q.alive||q.downed||q.gh)continue;
    const x=q.x-p.x,y=q.y-p.y,head=(q.z||0)+1.35,z=(GY(q.x,q.y)+head-base-h)*20;
    const length=Math.hypot(x,y,z),along=(x*dx+y*dy+z*az)/aim;
    if(length>LTV.linkR||along<=0)continue;
    const off=Math.sqrt(Math.max(0,length*length-along*along)),limit=Math.min(LTV.linkPick,13+.115*along);
    if(off>limit)continue;
    const r=off/limit;
    if(r<score&&!natureTrace(p,q,h,head,p.team,true)){best=q;score=r;}
  }
  return best;
}
function lightBondTap(p){
  const best=lightBondTarget(p);
  if(!best)return false;
  if(p.lgA!==best.id){
    if(p.lgA)lightUnlink(p);
    if(best.lgFrom&&best.lgFrom!==p.id){const owner=G.players[best.lgFrom];if(owner)lightUnlink(owner);}
    p.lgA=best.id;best.lgFrom=p.id;best.lgN=best.lgN|0;
    emit({k:'efx',z:'lglink',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id,t:best.id});
  }
  if(p.lc>0){
    p.lc--;best.lgN=(best.lgN|0)+1;
    emit({k:'efx',z:'lgsend',x:Math.round(p.x),y:Math.round(p.y),h:p.z+1.4,x2:Math.round(best.x),y2:Math.round(best.y),h2:(best.z||0)+1.4,id:p.id,t:best.id});
  }
  return true;
}
function lightRecall(p){if(p.lgA)lightUnlink(p,true);}
// ---------- ทุกเฟรม ----------
function lightTick(p,dt){
  if(p.lc===undefined)lightReset(p);
  // ลิงก์หลุดเมื่อไกลเกิน / คู่หูตาย
  if(p.lgA&&p.lgA!=='prism'){const a=G.players[p.lgA];if(!a||!a.alive||a.downed||Math.hypot(a.x-p.x,a.y-p.y)>LTV.linkR)lightUnlink(p);}
  if(p.lgA==='prism'&&p.lgPr&&LTV.prismT>0){p.lgPr.t-=dt;if(p.lgPr.t<=0)lightUnlink(p);}
  // กดค้างปุ่ม Crystal Bond = เรียกคืน
  {const k=lightSlotOf(p,'crystalbond');if(k){const held=p.inp&&p.inp['h'+k];if(held){p.lgHold+=dt;if(p.lgHold>=LTV.holdT&&p.lgHold-dt<LTV.holdT)lightRecall(p);}else p.lgHold=0;}}
  if(p.lgDch<1)p.lgDch=Math.min(1,p.lgDch+dt/(LTV.dsCd*p.buffs.cdr));
  p.cd.dodge=p.lgDch>=1?0:(1-p.lgDch)*LTV.dsCd;p.cdMax.dodge=LTV.dsCd;
  if(p.shieldOn&&p.lc<=0){p.shieldOn=false;}
  // Always hover at BA float height (user 2026-11-23): walking, standing, landing from a fall all settle at +baFloat
  const g=p.alive&&!p.downed&&!p.fly&&!p.lgUlt&&!(p.vz>0.5)?groundH(p.x,p.y,p.z):null;
  if(g!==null&&p.z<=g+LTV.baFloat+0.02){if(!(p.lgFl>0)&&p.z>g+0.1)p.lgFl=1;p.lgFl=Math.min(1,(p.lgFl||0)+dt/LTV.baRise);const u=p.lgFl,e=u*u*u*(u*(u*6-15)+10);p.z=g+LTV.baFloat*e;p.vz=0;p.hover=0.15;}
  else p.lgFl=0;
  lightHeatTick(p,dt);   // เกจร้อน BA เดินทุกเฟรม (ตอนกางโล่ด้วย)
  lightSkillsTick(p,dt);
}
function lightSlotOf(p,id){const i=p.kitIds?p.kitIds.indexOf(id):-1;return i<0?null:SLOTK[i];}
// ---------- BA Prism Ray: กดค้าง = ลำแสง • 0 ชิ้น = ลำบางทะลุ 5/1 วิ • 1/2/3 ชิ้น = ไม่ทะลุ 5/0.7 8/0.6 10/0.6 ----------
function lightBeamAng(p){const i=p.inp;return i&&Number.isFinite(i.ax)&&Math.hypot(i.ax-p.x,i.ay-p.y)>30?Math.atan2(i.ay-p.y,i.ax-p.x):p.ang;}
// เล็งขึ้น/ลง (ผู้ใช้ 2026-11-16): มุมก้มเงยจากความสูงที่เล็ง (inp.ah) — 1 ม. = 20 หน่วย
function lightBeamPitch(p){const i=p.inp;if(!i||p.bot||!Number.isFinite(i.ah)||!Number.isFinite(i.ax))return 0;
  return clamp(Math.atan2((i.ah-(p.z+1.35))*20,Math.max(1,Math.hypot(i.ax-p.x,i.ay-p.y))),-1.2,1.2);}
function lightBeamLength(p,len){
  const a=p.lgBeamA,pt=p.lgBeamP,cp=Math.cos(pt),h0=p.z+1.35;
  const dx=Math.cos(a)*cp,dy=Math.sin(a)*cp;
  const edgeX=dx?((dx>0?MW-40:40)-p.x)/dx:Infinity;
  const edgeY=dy?((dy>0?MH-40:40)-p.y)/dy:Infinity;
  len=Math.max(0,Math.min(len,edgeX,edgeY));
  if(len===0)return 0;
  const end={x:p.x+len*dx,y:p.y+len*dy};
  const h1=h0+len*Math.sin(pt)*S3+terrT(p.x,p.y)-terrT(end.x,end.y);
  const hit=natureTrace(p,end,h0,h1,p.team,true);
  // The shared trace samples solids at most six units apart. Stop on the near side.
  const stop=darkBeamStop(p.team,p.x,p.y,h0,end.x,end.y,h1);
  return Math.min(len*stop,hit?Math.max(0,len*(hit.t-1/Math.ceil(len*cp/6))):len);
}
// เกจร้อน BA (ผู้ใช้ 2026-11-17): ยิงจริง (มีคริสตัล) 8 วิ = เต็ม (2026-11-18 เดิม 10) → คริสตัลชาร์จใหม่ 2 วิ ยิงไม่ได้ • ปล่อยยิง 2 วิ แล้วเกจค่อยลด (เต็ม→0 ใน 2 วิ)
function lightHeatTick(p,dt){
  const emp=p.lgEmp>G.time;if(p.lgEmpOn&&!emp){p.lgHeat=0;p.lgHI=0;}p.lgEmpOn=emp;   // Empower (ผู้ใช้ 2026-11-18): ยิงไม่ร้อนตลอดบัฟ หมดบัฟเกจกลับเป็น 0
  if(p.lgOH>0){p.lgOH-=dt;p.lgHeat=Math.max(0,p.lgOH/LTV.ohT);if(p.lgOH<=0){p.lgOH=0;p.lgHeat=0;p.lgHI=0;p.lgChg=LTV.baCharge;}p.lgFiring=0;return true;}
  if(p.lgFiring){p.lgHI=0;if(!emp)p.lgHeat=Math.min(1,(p.lgHeat||0)+dt/LTV.heatT);
    if(!emp&&p.lgHeat>=1){p.lgOH=LTV.ohT;p.lgChg=0;p.lgBaT=0;emit({k:'efx',z:'lgoh',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id});p.lgFiring=0;return true;}}
  else{p.lgHI=(p.lgHI||0)+dt;if(p.lgHI>LTV.heatIdle)p.lgHeat=Math.max(0,(p.lgHeat||0)-dt/LTV.heatDrain);}
  p.lgFiring=0;return false;}
function lightBeamHits(p,len,w,pierce){
  if(len<=0)return [];
  const a=p.lgBeamA,pt=p.lgBeamP,c=Math.cos(a),s=Math.sin(a),fl=len*Math.cos(pt),tp=Math.tan(pt),h0=terrT(p.x,p.y)+p.z+1.35,out=[];
  for(const t of foesOf(p.team)){if(t.dead||t.alive===false||t.downed)continue;const dx=t.x-p.x,dy=t.y-p.y,f=dx*c+dy*s;if(f<0||f>fl)continue;if(Math.abs(-dx*s+dy*c)>w+(t.r||PR))continue;
    const bh=h0+tp*f*S3-terrT(t.x,t.y),tz=t.z??t.h??0;if(bh<tz-0.3-w/20||bh>tz+2.1+w/20)continue;if(darkShieldCross(t,p.x,p.y,p.z+1.35,t.x,t.y,bh))continue;out.push([f,t]);}
  out.sort((x,y)=>x[0]-y[0]);return pierce?out.map(x=>x[1]):out.slice(0,1).map(x=>x[1]);}
// ไม่มีคริสตัล (ผู้ใช้ 2026-11-17): คลิกหนึ่งครั้ง = ลำแสงสั้น ๆ แวบเดียว ไม่ยิงค้าง • ต้องปล่อยแล้วคลิกใหม่ • ห่างกันอย่างน้อย ba0[1] วิ
function lightTapShot(p,inp,dt){
  p.lgTapCd=Math.max(0,(p.lgTapCd||0)-dt);p.lgPulse=Math.max(0,(p.lgPulse||0)-dt);p.lgChg=0;
  if(inp.fire&&!p.lgTapH&&p.lgTapCd<=0){p.lgTapH=1;p.lgTapCd=LTV.ba0[1];p.lgPulse=0.2;
    const len=LTV.baRange;p.lgBeamA=lightBeamAng(p);p.lgBeamP=lightBeamPitch(p);p.lgBeamL=lightBeamLength(p,len);p.lgTapW=p.lgBeamL<len?1:0;
    const t=lightBeamHits(p,p.lgBeamL,LTV.baW[0],false)[0];
    if(t){const f=(t.x-p.x)*Math.cos(p.lgBeamA)+(t.y-p.y)*Math.sin(p.lgBeamA);p.lgBeamL=Math.max(0,(f-(t.r||PR)*0.7)/Math.cos(p.lgBeamP));p.lgTapW=2;
      damage(t,LTV.ba0[0],p.id,'aoe');emit({k:'efx',z:'lgbahit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),n:0,id:p.id});}}
  if(!inp.fire)p.lgTapH=0;
  if(p.lgPulse>0){p.lgBeam=1;p.lgBeamW=p.lgTapW|0;}}
function lightBasic(p,inp,dt,setCd){
  p.lgBeam=0;p.lgBeamW=0;
  if(p.lgOH>0){p.lgChg=0;p.lgBaT=0;return;}   // ร้อนเกิน: คริสตัลกำลังชาร์จใหม่
  if(p.shieldOn||p.lgUlt||p.lgVol){p.lgChg=0;return;}
  if(Math.max(0,Math.min(3,p.lc|0))===0){lightTapShot(p,inp,dt);return;}   // ไม่มีคริสตัล = ยิงทีละคลิก
  if(!inp.fire){p.lgBaT=0;p.lgChg=0;return;}
  const n=Math.max(0,Math.min(3,p.lc|0)),T=[LTV.ba0,LTV.ba1,LTV.ba2,LTV.ba3][n],emp=p.lgEmp>G.time;
  // มีคริสตัล: ชาร์จ 1.4 วิ (ลอยขึ้น 0.5 ม. คริสตัลเรียงเป็นวงหน้าไม้) แล้วค่อยยิง • 0 ชิ้น = ยิงทันทีจากไม้ ไม่ลอย
  if(n>0&&(p.lgChg||0)<LTV.baCharge){p.lgChg=(p.lgChg||0)+dt;p.lgBeam=-1;p.lgBeamA=lightBeamAng(p);p.lgBeamP=lightBeamPitch(p);return;}
  const rate=emp?1+0.1*n:1,len=LTV.baRange+(emp?50*n:0),w=LTV.baW[n]*(emp?1+0.15*n:1);
  p.lgBeam=1+n;p.lgBeamA=lightBeamAng(p);p.lgBeamP=lightBeamPitch(p);p.lgBeamL=lightBeamLength(p,len);
  p.lgBeamW=p.lgBeamL<len?1:0;if(n>0)p.lgFiring=1;
  // ไม่ทะลุศัตรู (ผู้ใช้ 2026-11-17): ลำหยุดที่ศัตรูตัวแรก ภาพปลายลำเหมือนชนกำแพง
  const tgt=lightBeamHits(p,p.lgBeamL,w,false)[0];
  if(tgt){const f=(tgt.x-p.x)*Math.cos(p.lgBeamA)+(tgt.y-p.y)*Math.sin(p.lgBeamA);p.lgBeamL=Math.max(0,(f-(tgt.r||PR)*0.7)/Math.cos(p.lgBeamP));p.lgBeamW=2;}   // 2 = ชนศัตรู (1 = ชนผนัง/พื้น)
  p.lgBaT-=dt;if(p.lgBaT>0)return;
  p.lgBaT=T[1]/rate;
  const hits=tgt?[tgt]:[];
  for(const t of hits){damage(t,T[0],p.id,'aoe');emit({k:'efx',z:'lgbahit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t),n,id:p.id});}
}
// ---------- Dash Light Step: วาร์ป 250 ตามทิศเดิน • เล็งคู่หู (ไม่เกิน 900) = วาร์ปใกล้ด้านหลังที่ความสูงเดียวกัน ----------
function lightStepBehind(p,ally){
  const height=terrT(ally.x,ally.y)+ally.z;
  for(const dist of [45,58])for(const turn of [0,-0.4,0.4,-0.8,0.8,-1.15,1.15]){
    const a=ally.ang+Math.PI+turn,x=ally.x+Math.cos(a)*dist,y=ally.y+Math.sin(a)*dist;
    const z=height-terrT(x,y),ground=groundH(x,y,z),ceiling=cityCeilH(x,y,z);
    if(ground>z+0.06||terrSolid(x,y,z+1.9)||(ceiling>z&&ceiling<z+1.9))continue;
    const point={x,y,z:Math.max(z,ground),team:p.team};
    collideWorld(point,PR,point.z);
    if(Math.hypot(point.x-x,point.y-y)>0.01||natureTrace(point,point,point.z+0.45,point.z+0.45,p.team,true))continue;
    return point;
  }
  return null;
}
function lightDash(p,inp,pr,dt,setCd){
  if(!pr.sp||p.lgDch<1||p.lgUlt)return false;
  const pos=lightLinkPos(p),ax=inp.ax,ay=inp.ay;
  const toLink=pos&&Number.isFinite(ax)&&Math.hypot(pos.x-ax,pos.y-ay)<LTV.dsPick&&Math.hypot(pos.x-p.x,pos.y-p.y)<=LTV.dsAllyR;
  const ally=toLink?lightAlly(p):null,landing=ally?lightStepBehind(p,ally):null;
  if(ally&&!landing)return false;
  const x0=p.x,y0=p.y,z0=p.z;p.lgDch=0;
  if(landing){
    p.x=landing.x;p.y=landing.y;p.z=landing.z;p.vz=0;p.hover=0;
    p.lgFl=0;_cwLast.delete(p);
  }
  else if(toLink){const a=Math.atan2(p.y-pos.y,p.x-pos.x);p.x=pos.x+Math.cos(a)*45;p.y=pos.y+Math.sin(a)*45;}
  else{let dx,dy;if(typeof inp.mx==='number'&&(inp.mx||inp.my)){dx=inp.mx;dy=inp.my;}else{dx=(inp.r?1:0)-(inp.l?1:0);dy=(inp.d?1:0)-(inp.u?1:0);}
    const l=Math.hypot(dx,dy);if(l>0.1){dx/=l;dy/=l;}else{dx=Math.cos(p.ang);dy=Math.sin(p.ang);}
    p.x+=dx*LTV.dsDist;p.y+=dy*LTV.dsDist;}
  collideWorld(p,PR,p.z);p._px=p.x;p._py=p.y;
  const air=!!landing&&p.z>groundH(p.x,p.y,p.z)+0.06;
  if(air&&p.fly){p.fly=false;p.flyOn=false;broomOff(p);}
  const x=Math.round(p.x),y=Math.round(p.y);
  emit({k:'efx',z:'lgstep',x:Math.round(x0),y:Math.round(y0),h:z0,x2:x,y2:y,h2:p.z,id:p.id,n:toLink?1:0,air});
  if(toLink){
    const height=terrT(p.x,p.y)+p.z;
    for(const t of foesIn(p.team,p.x,p.y,LTV.dsR,Infinity)){
      if(Math.abs(terrT(t.x,t.y)+(t.z??t.h??0)-height)<3)aoeHit(p,t,LTV.dsDmg,null);
    }
    if(ally)ally.lgDR=G.time+LTV.dsDRT;
    emit({k:'efx',z:'lgstepboom',x,y,h:p.z,r:LTV.dsR,id:p.id});
  }
  return false;}
// ดาเมจ: คริสตัลกับคู่หู = กัน/ตีแรง 5% ต่อชิ้น • Light Step ลดดาเมจ 30% 2 วิ (เรียกจาก damage js/12)
function lightDmgOut(src){if(!(src&&src.lgN>0))return 1;const o=src.lgFrom&&G.players[src.lgFrom],emp=o&&o.lgEmp>G.time?LT_EM.allyPct:0;return 1+(LTV.allyDmg+emp)*src.lgN;}   // Empower (ผู้ใช้ 2026-11-18): เพื่อนตีแรงเพิ่มอีก 5%/คริสตัลตอนบัฟ
function lightDmgIn(t){let k=1;if(t.lgN>0)k*=1-LTV.allyDR*t.lgN;if(t.lgDR>G.time)k*=1-LTV.dsDR;if(t.lgUltWard)k*=1-LT_UL.dr;return k;}
function lightSnapP(p){if(!lgOn(p)&&!(p.lgN>0)&&!p.lgUltWard)return undefined;
  const pos=lgOn(p)?lightLinkPos(p):null,a=lgOn(p)?lightAlly(p):null;
  return [lgOn(p)?(p.lgUlt?LTV.max:p.lc|0):0,a?a.id:p.lgA==='prism'?'P':0,pos?[Math.round(pos.x),Math.round(pos.y)]:0,p.lgN|0,p.lgBeam|0,p.lgEmp>G.time?1:0,p.lgDch>=1?1:0,
    p.lgSan?[Math.round(p.lgSan.x),Math.round(p.lgSan.y),p.lgSan.n|0]:0,p.lgVeil&&p.lgVeil.wind<=0?[Math.round(p.lgVeil.x),Math.round(p.lgVeil.y),Math.round(p.lgVeil.t*10),Math.round(p.lgVeil.h*100)]:0,p.lgBeamL|0,Math.round((p.lgBeamA||p.ang||0)*100)/100,p.shieldOn?1:0,Math.round((p.lgChg||0)*100)/100,Math.round((p.lgBeamP||0)*100)/100,
    p.lgUlt?lightUltSnap(p.lgUlt):0,p.lgUltWard?1:0,Math.round((p.lgHeat||0)*100),p.lgOH>0?1:0,p.lgBeamW|0,p.shieldOn&&lgOn(p)?lightShieldPitch(p):0,
    lgOn(p)&&!p.lgUlt&&!p.shieldOn&&lightSlotOf(p,'crystalbond')?lightBondTarget(p)?.id??null:null];}
// ---------- สกิล ----------
function lightSkillsTick(p,dt){
  const V=p.lgVol;   // Shard Volley: คริสตัลหยุดที่จุด → หมุนชาร์จ → ระเบิด → บินกลับ
  if(V){V.t+=dt;V.b=V.b|0;V.warned=V.warned|0;
    while(V.warned<V.pts.length&&V.t>=LT_VO.wind+V.warned*LT_VO.step){
      const [x,y,h,r]=V.pts[V.warned++];
      emit({k:'efx',z:'lgvolwarn',x,y,h,r,t:LT_VO.charge,id:p.id});
    }   // ผู้ใช้ 2026-11-17: ไปทีละชิ้น ใกล้ → ไกล • แต่ละชิ้นนับวงเตือนของตัวเอง แล้วระเบิดทีละลูก
    while(V.b<V.pts.length&&V.t>=LT_VO.wind+V.b*LT_VO.step+LT_VO.charge){const [x,y,h,r]=V.pts[V.b];for(const t of foesIn(p.team,x,y,r,h+13,h-2))aoeHit(p,t,LT_VO.dmg,null);   // เสาแสงสูง: โดนถึง 13 ม. (Wind บินได้สูงสุด 12)
      emit({k:'efx',z:'lgvolboom',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id,pts:[[Math.round(x),Math.round(y)]],r,i:V.b});V.b++;}
    if(V.b>=V.pts.length&&V.t>=LT_VO.wind+(V.pts.length-1)*LT_VO.step+LT_VO.charge+LT_VO.back){p.lc=Math.min(LTV.max,p.lc+V.n);p.lgVol=null;}}
  const Z=p.lgSan;   // Sanctum Crystal: ฮีลรอบวง 3/วิ ต่อคริสตัล (ผู้ใช้ 2026-11-18)
  if(Z){Z.t-=dt;Z.k=(Z.k||0)+dt;
    if(Z.k>=0.5){
      Z.k-=0.5;Z.e=(Z.e|0)+1;
      const radius=LT_SC.r+LT_SC.rUp*(Z.n-1),healed=Z.healed||(Z.healed=new Set());
      for(const q of plist())if(q.team===p.team&&q.alive&&!q.downed&&Math.hypot(q.x-Z.x,q.y-Z.y)<=radius){
        const hp=q.hp;healT(q,LT_SC.heal*Z.n*0.5);
        if(q.hp>hp)healed.add(q.id);
      }
      if(Z.e%2===0){   // รวมคนที่ฟื้น HP จากทั้งสองจังหวะ ให้ประกายขึ้นทุก 1 วิ
        if(healed.size)emit({k:'efx',z:'lgsanheal',x:Math.round(Z.x),y:Math.round(Z.y),h:Z.h,id:p.id,ids:[...healed],n:Z.n});
        healed.clear();
      }
    }
    const k=lightSlotOf(p,'sanctumcrystal');if(k){if(p.inp&&p.inp['h'+k])Z.hold=(Z.hold||0)+dt;else Z.hold=0;}
    if(Z.t<=0||Z.hold>=LTV.holdT)lightSanEnd(p);}
  const W=p.lgVeil;  // Shard Storm: วงใบมีดคริสตัลอยู่กับที่ ดาเมจทุก tick + ช้า
  if(W){
    const wind=Math.min(W.wind,dt);W.wind-=wind;
    if(W.wind>0)return;
    const active=Math.min(W.t,dt-wind);W.t-=active;W.k+=active;
    const fs=foesIn(p.team,W.x,W.y,LT_VS.r,W.h+3,W.h-3);for(const t of fs)addSlow(t,1-LT_VS.slow,0.2);
    if(W.k+1e-6>=LT_VS.tick){W.k=Math.max(0,W.k-LT_VS.tick);const ids=[];for(const t of fs){aoeHit(p,t,LT_VS.dmg);ids.push(t.id);}if(ids.length)emit({k:'efx',z:'lgveilhit',x:Math.round(W.x),y:Math.round(W.y),h:W.h,id:p.id,ids});}
    if(W.t<=1e-6)p.lgVeil=null;
  }
}

// Radiant Sovereign uses the caster's actual position above the linked ally.
// Keep the return point and the ally's bonus shield scoped to this cast.
const LIGHT_FORM_BASE=1.86;
const LIGHT_FORM_SCALE=.89;
const LIGHT_FORM_PIVOT=new THREE.Vector3(0,2.10,0);
const LIGHT_FORM_PALM=.20,LIGHT_FORM_PALM_DEPTH=.065;
const LIGHT_FORM_HEART_Y=2.762,LIGHT_FORM_HEART_Z=.569;
function lightFinishDrive(progress){return THREE.MathUtils.smoothstep(progress,.89,1);}
function lightFinishPitch(progress,lean){return lerp(.44*THREE.MathUtils.smoothstep(progress,0,.49),lean,lightFinishDrive(progress));}
function lightFinishPush(progress){return lerp(.12*THREE.MathUtils.smoothstep(progress,0,.42),.55,lightFinishDrive(progress));}
function lightFormAngles(side,amount,aim,angles,recoil=0){
  const elevation=Math.atan2(aim.y-2.86,Math.hypot(aim.x,aim.z));
  return angles.set(amount*clamp(-elevation*.95,-.17,.46)-.12*recoil,
    -side*(amount*.28+.065*recoil),side*(.056*amount+.072*recoil),'YXZ');
}
function lightFormRecoil(age){
  if(age<0)return 0;
  return 1.45*Math.exp(-age*17)+.34*Math.sin(age*39)+.18*Math.sin(age*62+.86);
}
function lightFormHand(side,aim,rotation,out){
  const distance=Math.hypot(aim.x,aim.z);
  // Retract the hand before it would overshoot a nearby aim point.
  const extension=THREE.MathUtils.smoothstep(Math.hypot(distance,(aim.y-3.1)*.50),3,6.5);
  const reach=lerp(1.81,4.38,extension)/Math.max(distance,.4);
  const lift=clamp((aim.y-2.90)*reach,-.88,.88);
  out.set(aim.x*reach,lift,aim.z*reach).applyQuaternion(rotation);
  out.x=side*lerp(1.04,.88,extension)+clamp(out.x*.42,-.65,.65);
  out.y+=2.92;
  return out;
}
const LIGHT_FORM_ARMS=[
  [[.83,2.905,-.007],[1.67,2.274,-.041],[2.79,2.62,.34],[.94,.28,.23]],
  [[-.827,2.878,-.008],[-1.62,2.15,-.035],[-2.69,2.21,.435],[-.95,-.045,.30]]
].map(([s,e,w,h])=>{
  const shoulder=new THREE.Vector3(...s),elbow=new THREE.Vector3(...e),wrist=new THREE.Vector3(...w);
  const upper=elbow.clone().sub(shoulder),lower=wrist.clone().sub(elbow),a=upper.length(),b=lower.length();
  return {shoulder,elbow,wrist,upper:upper.divideScalar(a),lower:lower.divideScalar(b),
    hand:new THREE.Vector3(...h).normalize(),a,b};
});
function lightArmRest(side){return LIGHT_FORM_ARMS[side>0?0:1];}
const _lightArmWork={reach:new THREE.Vector3(),bend:new THREE.Vector3(),upper:new THREE.Vector3(),
  lower:new THREE.Vector3(),hand:new THREE.Vector3(),wrist:new THREE.Vector3(),palm:new THREE.Vector3(),shoulder:new THREE.Vector3()};
function lightArmPose(side,aim,amount,pull=0,recoil=0){
  const A=lightArmRest(side),work=_lightArmWork;
  const shift=amount*(1-.77*pull);
  work.shoulder.copy(A.shoulder);
  work.shoulder.x+=side*.05*shift;
  work.shoulder.y+=.13*shift;
  work.shoulder.z+=.17*shift;
  const reach=work.reach.copy(aim).sub(work.shoulder);
  // Let the shoulder, elbow and wrist share the reach. The elbow bends downward and outward.
  const maxReach=A.a+A.b-.006;
  const length=clamp(reach.length()-.22,.45,maxReach-.77*pull);
  reach.normalize().multiplyScalar(length);reach.x+=side*.13;reach.y-=.07;
  const d=clamp(reach.length(),.40,maxReach);
  reach.normalize();
  const bend=work.bend.set(side*.83,-1,.05);
  bend.addScaledVector(reach,-bend.dot(reach)).normalize();
  const joint=(A.a*A.a-A.b*A.b+d*d)/(2*d);
  const offset=Math.sqrt(Math.max(0,A.a*A.a-joint*joint));
  work.upper.copy(reach).multiplyScalar(joint).addScaledVector(bend,offset).normalize().lerp(A.upper,1-amount).normalize();
  work.lower.copy(reach).multiplyScalar(d-joint).addScaledVector(bend,-offset).normalize().lerp(A.lower,1-amount).normalize();
  work.upper.addScaledVector(bend,-.077*recoil).normalize();
  work.lower.addScaledVector(bend,-.13*recoil).normalize();
  work.wrist.copy(work.shoulder).addScaledVector(work.upper,A.a).addScaledVector(work.lower,A.b);
  work.palm.copy(aim).sub(work.wrist).normalize().lerp(work.lower,.22).normalize();
  // Fingers lift into an open, forward-facing palm. Leave some flex at the wrist.
  work.hand.set(side*.19,1,0).addScaledVector(work.palm,.39-work.palm.y).normalize().lerp(A.hand,1-amount).normalize();
  return work;
}
function lightFormOpenPalm(wrist,target,up,fingers,normal){
  const distance=target.distanceTo(wrist);
  if(distance<.35)return;
  normal.copy(target).sub(wrist).divideScalar(distance);
  fingers.copy(up).addScaledVector(normal,-up.dot(normal));
  if(fingers.lengthSq()<.001)fingers.set(1,0,0).addScaledVector(normal,-normal.x);
  fingers.normalize();
  // Compensate for the emitting point being above the wrist, at the middle of the palm.
  const s=LIGHT_FORM_PALM/distance,c=Math.sqrt(1-s*s);
  normal.multiplyScalar(c).addScaledVector(fingers,-s);
  fingers.addScaledVector(normal,s).divideScalar(c);
}
function lightArmAim(p,inp){
  const dx=(Number.isFinite(inp.ax)?inp.ax-p.x:Math.cos(p.ang)*LT_UL.baRange)*.05;
  const dy=(Number.isFinite(inp.ay)?inp.ay-p.y:Math.sin(p.ang)*LT_UL.baRange)*.05;
  const c=Math.cos(p.ang),s=Math.sin(p.ang);
  const h=Number.isFinite(inp.ah)?inp.ah-p.z+LIGHT_FORM_BASE:LIGHT_FORM_BASE+1.05;
  return new THREE.Vector3(dx*s-dy*c,h,Math.max(.4,dx*c+dy*s));
}
function lightUltSnap(u){
  const shot=u.shot;
  return [u.phase,Math.round(u.t*100)/100,u.ally,Math.round(u.home.x),Math.round(u.home.y),
    Math.round(u.home.h*100)/100,shot?[u.arm,...shot.map(v=>Math.round(v*100)/100)]:0,
    Math.round((u.finish||0)*100)/100,u.pose?u.pose.map(v=>Math.round(v*100)/100):0,
    u.phase>=3?Math.round(u.lean*1000)/1000:0,
    u.xsh?1:u.xStun>0?2:0,Math.round(Math.max(0,u.xHp)/LT_UL.xCap*100),u.xBrk?1:0];   // [10] X guard 0/1 held/2 broken-stun • [11] shield left % • [12] used up
}
// X guard on/off (hold right click in god form): the linked duo gets the hex shield
function lightXGuard(p,u,on){const a=G.players[u.ally];u.xsh=on?1:0;if(a)a.lgXsh=on?p.id:null;
  emit({k:'efx',z:on?'lgxon':'lgxoff',x:Math.round(a?a.x:p.x),y:Math.round(a?a.y:p.y),h:(a?a.z:p.z)+1,id:p.id,t:a?a.id:null});}
// damage into a duo under the hex shield: 70% of it is stopped until the shield has stopped 100 in total, then it breaks
function lightHexAbsorb(t,amt){const o=G.players[t.lgXsh],u=o&&o.lgUlt;if(!u||!u.xsh||u.ally!==t.id){t.lgXsh=null;return amt;}
  const stop=Math.min(amt*LT_UL.xDR,u.xHp);u.xHp-=stop;amt-=stop;
  if(u.xHp<=1e-6){u.xHp=0;u.xsh=0;u.xBrk=1;u.xStun=LT_UL.xStun;u.burst=0;u.wind=0;u.shot=null;t.lgXsh=null;
    emit({k:'efx',z:'lgxbrk',x:Math.round(t.x),y:Math.round(t.y),h:(t.z||0)+1,id:o.id,t:t.id});}
  return amt;}
function lightUltEnd(p,restore=true,show=true){
  const u=p.lgUlt;
  if(!u)return;
  const a=G.players[u.ally];
  if(a?.lgUltWard?.owner===p.id)a.lgUltWard=null;
  if(a&&a.lgXsh===p.id)a.lgXsh=null;
  const origin=restore&&u.phase===5?{x2:p.x,y2:p.y,h2:p.z}:null;
  p.lgUlt=null;
  if(restore&&u.phase>1){
    p.x=u.home.x;p.y=u.home.y;p.z=Math.max(u.home.h,groundH(p.x,p.y,u.home.h));
    p.vx=p.vy=p.vz=p.mvx=p.mvy=0;
    collideWorld(p,PR,p.z);p._px=p.x;p._py=p.y;
  }
  if(show)emit({k:'efx',z:'lgultend',x:p.x,y:p.y,h:p.z,id:p.id,...origin});
}
const _lightFormAngles=new THREE.Euler(),_lightFormTurn=new THREE.Quaternion(),_lightFormHand=new THREE.Vector3();
const _lightFormAimLocal=new THREE.Vector3(),_lightFormUpLocal=new THREE.Vector3();
function lightUltOrigin(p,arm,aim,amount,pull=0,recoil=0){
  const c=Math.cos(p.ang),s=Math.sin(p.ang);
  const turn=_lightFormTurn.setFromEuler(lightFormAngles(arm,amount,aim,_lightFormAngles,recoil));
  const local=lightFormHand(arm,aim,turn.invert(),_lightFormHand);
  const pose=lightArmPose(arm,local,amount,pull,recoil);
  _lightFormAimLocal.set(aim.x,aim.y-LIGHT_FORM_BASE,aim.z).divideScalar(LIGHT_FORM_SCALE);
  _lightFormAimLocal.y+=LIGHT_FORM_BASE;
  _lightFormAimLocal.sub(LIGHT_FORM_PIVOT).applyQuaternion(turn).add(LIGHT_FORM_PIVOT);
  _lightFormUpLocal.set(0,1,0).applyQuaternion(turn);
  lightFormOpenPalm(pose.wrist,_lightFormAimLocal,_lightFormUpLocal,pose.hand,pose.palm);
  const palm=pose.wrist.addScaledVector(pose.hand,LIGHT_FORM_PALM).addScaledVector(pose.palm,LIGHT_FORM_PALM_DEPTH)
    .sub(LIGHT_FORM_PIVOT).applyQuaternion(turn.invert())
    .add(LIGHT_FORM_PIVOT).multiplyScalar(LIGHT_FORM_SCALE);
  palm.z-=.23*recoil*LIGHT_FORM_SCALE;
  const x=p.x+(c*palm.z+s*palm.x)*20,y=p.y+(s*palm.z-c*palm.x)*20;
  return {x,y,h:p.z+palm.y-LIGHT_FORM_BASE*LIGHT_FORM_SCALE+terrT(p.x,p.y)-terrT(x,y)};
}
function lightUltRay(p,origin,range,target){
  const i=target||p.inp||{};
  const ax=Number.isFinite(i.ax)?i.ax:p.x+Math.cos(p.ang)*range;
  const ay=Number.isFinite(i.ay)?i.ay:p.y+Math.sin(p.ang)*range;
  const ah=Number.isFinite(i.ah)?i.ah+terrT(target?ax:p.x,target?ay:p.y):origin.h+terrT(origin.x,origin.y);
  return aimRay3({x:origin.x,y:origin.y,ang:p.ang,inp:{ax,ay,ah}},origin.h,range,true);
}
function lightUltBeamHit(p,from,to){
  const fromHeight=from.h+terrT(from.x,from.y);
  const dx=to.x-from.x,dy=to.y-from.y,dz=(to.h+terrT(to.x,to.y)-fromHeight)*20;
  const lengthSq=dx*dx+dy*dy+dz*dz;
  if(lengthSq<1)return;
  let first=null,near=Infinity;
  for(const t of foesOf(p.team)){
    const x=t.x-from.x,y=t.y-from.y,z=(cH(t)+terrT(t.x,t.y)-fromHeight)*20;
    const f=(x*dx+y*dy+z*dz)/lengthSq;
    if(f<0||f>1||f>=near)continue;
    if(Math.hypot(x-f*dx,y-f*dy)>LT_UL.width+(t.r||PR)||Math.abs(z-f*dz)>(vR(t)+.22)*20)continue;
    near=f;first=t;
  }
  if(first&&!darkShieldCross(first,from.x,from.y,from.h,to.x,to.y,to.h))damage(first,LT_UL.baDmg,p.id,'aoe',true);
}
function lightUltFinish(p,target){
  const pitch=lightFinishPitch(1,p.lgUlt.lean),delta=LIGHT_FORM_HEART_Y-LIGHT_FORM_PIVOT.y;
  const reach=(LIGHT_FORM_HEART_Z*Math.cos(pitch)+delta*Math.sin(pitch)+lightFinishPush(1))*LIGHT_FORM_SCALE*20;
  const x=p.x+Math.cos(p.ang)*reach,y=p.y+Math.sin(p.ang)*reach;
  const from={x,y,h:p.z+(LIGHT_FORM_PIVOT.y+delta*Math.cos(pitch)-LIGHT_FORM_HEART_Z*Math.sin(pitch)-LIGHT_FORM_BASE)*LIGHT_FORM_SCALE
    +terrT(p.x,p.y)-terrT(x,y)};
  const to=lightUltRay(p,from,LT_UL.finishRange,target);
  emit({k:'efx',z:'lgultstrike',x:from.x,y:from.y,h:from.h,x2:to.x,y2:to.y,h2:to.h,id:p.id,
    ground:to.hit==='ground',t:LT_UL.finishRelease});
  (G.lgImpacts||(G.lgImpacts=[])).push({x:to.x,y:to.y,h:to.h,team:p.team,src:p.id,at:G.time+LT_UL.finishRelease+LT_UL.finishDelay});
}
function lightUltTick(p,inp,dt,canAct,finishPressed){
  const u=p.lgUlt,ally=lightAlly(p);
  if(u.phase<4&&(!ally||ally.id!==u.ally||ally.team!==p.team||ally.lgFrom!==p.id)){lightUltEnd(p);return;}
  lightSkillsTick(p,dt);
  p.shieldOn=false;p.wSpd=0;p.vx=p.vy=p.vz=p.mvx=p.mvy=0;
  p.inv=Math.max(p.inv||0,0.05);   // god form can't be hurt (user 2026-11-25)
  if(u.phase===1){
    u.cast-=dt;
    if(u.cast>0)return;
    u.phase=2;
    emit({k:'efx',z:'lgultform',x:ally.x,y:ally.y,h:(ally.z||0)+LT_UL.hover,id:p.id,t:ally.id});
  }else u.t=Math.max(0,u.t-dt);
  const forced=u.t<=0&&u.phase===2;   // time up = the finish fires anyway (user 2026-11-25)
  if(forced&&u.xsh)lightXGuard(p,u,false);
  if(u.phase<4){p.x=ally.x;p.y=ally.y;p.z=(ally.z||0)+LT_UL.hover;}
  p._px=p.x;p._py=p.y;
  const look=u.target||inp;
  if(u.phase<4&&Number.isFinite(look.ax)&&Math.hypot(look.ax-p.x,look.ay-p.y)>1)p.ang=Math.atan2(look.ay-p.y,look.ax-p.x);
  u.shot=null;
  u.pose=null;
  if(u.phase>=3){
    u.finish-=dt;
    if(u.phase===3){
      const charge=1-u.finish/LT_UL.finishCast;
      p.z+=LT_UL.finishRise*(.76*charge+.24*(1-(1-charge)**3));
      u.lean=clamp(Math.atan2(p.z+.65-u.target.ah,Math.hypot(u.target.ax-p.x,u.target.ay-p.y)*.05),.12,.53);
      if(u.finish<=1e-6){u.phase=4;u.finish=LT_UL.finishRelease+LT_UL.finishDelay;lightUltFinish(p,u.target);}
    }else if(u.finish<=1e-6){
      if(u.phase===4){u.phase=5;u.finish=LT_UL.finishDissolve;}
      else lightUltEnd(p);
    }
    return;
  }
  if(u.xStun>0){u.xStun-=dt;u.burst=0;u.wind=0;u.rest=LT_UL.baRest;if(!forced)return;}   // shield broke: stunned 2 s
  if(!forced){const want=canAct&&!!inp.sh&&!u.xBrk;if(want!==!!u.xsh)lightXGuard(p,u,want);if(u.xsh){u.burst=0;u.wind=0;u.rest=LT_UL.baRest;return;}}   // X guard: no shooting
  if(forced||canAct&&p.sil<=0&&finishPressed){
    const ground=Number.isFinite(inp.gx)&&inp.gx>=0&&Number.isFinite(inp.gy)&&inp.gy>=0;
    const ax=ground?inp.gx:Number.isFinite(inp.ax)?inp.ax:p.x+Math.cos(p.ang)*LT_UL.finishRange;
    const ay=ground?inp.gy:Number.isFinite(inp.ay)?inp.ay:p.y+Math.sin(p.ang)*LT_UL.finishRange;
    u.target={ax,ay,ah:surfH(p,ax,ay)};
    u.phase=3;u.finish=LT_UL.finishCast;
    u.lean=clamp(Math.atan2(p.z+.65-u.target.ah,Math.hypot(ax-p.x,ay-p.y)*.05),.12,.53);
    return;
  }
  u.rest=Math.max(0,u.rest-dt);
  if(!canAct||!inp.fire||p.sil>0){
    u.wind=0;
    if(u.burst>0){u.burst=0;u.rest=LT_UL.baRest;u.arm=-u.arm;}
    return;
  }
  if(u.rest>LT_UL.baWindup)return;
  const aim=lightArmAim(p,inp);
  if(u.burst<=0)u.wind=Math.min(LT_UL.baWindup,u.wind+dt);
  const reach=u.wind/LT_UL.baWindup;
  const smooth=THREE.MathUtils.smoothstep;
  const amount=smooth(reach,0,.84),pull=.27*Math.sin(Math.PI*reach);
  if(u.rest>1e-6||reach<1-1e-6){u.pose=[u.arm,amount,aim.x,aim.y,aim.z,pull,-1];return;}
  if(u.burst<=0){u.burst=LT_UL.baHold;u.hitIn=0;}
  const age=LT_UL.baHold-u.burst,recoil=lightFormRecoil(age);
  u.pose=[u.arm,1,aim.x,aim.y,aim.z,Math.max(0,recoil)*.022,age];
  const from=lightUltOrigin(p,u.arm,aim,1,u.pose[5],recoil),to=lightUltRay(p,from,LT_UL.baRange);
  u.shot=[from.x,from.y,from.h,to.x,to.y,to.h,aim.x,aim.y,aim.z,amount,to.hit==='ground'?1:0];
  if(u.hitIn<=1e-6){lightUltBeamHit(p,from,to);u.hitIn+=LT_UL.baTick;}
  u.hitIn-=dt;u.burst-=dt;
  if(u.burst<=1e-6){u.burst=0;u.wind=0;u.rest=LT_UL.baRest;u.arm=-u.arm;u.shot=null;}
}
function lightSanEnd(p){const Z=p.lgSan;if(!Z)return;p.lc=Math.min(LTV.max,p.lc+Z.n);p.lgSan=null;emit({k:'efx',z:'lgsanend',x:Math.round(Z.x),y:Math.round(Z.y),h:Z.h,id:p.id});}
function lightAimPt(p,max){const i=p.inp||{};let ax=Number.isFinite(i.ax)?i.ax:p.x+Math.cos(p.ang)*max,ay=Number.isFinite(i.ay)?i.ay:p.y+Math.sin(p.ang)*max;
  const d=Math.hypot(ax-p.x,ay-p.y);if(d>max){ax=p.x+(ax-p.x)/d*max;ay=p.y+(ay-p.y)/d*max;}return [ax,ay,groundH(ax,ay,p.z)];}
const LT_BOND=defSpell(LIGHTP,{id:'crystalbond',v:{},role:'support',n:'Crystal Bond',ic:'🔗',cd:0.25,
  d:`เล็งเพื่อนแล้วกด = ลิงก์ + ส่งคริสตัลให้ 1 ชิ้น (เพื่อนรับดาเมจน้อยลง 5% ตีแรงขึ้น 5% ต่อชิ้น) • ต้องเล็งเพื่อนที่อยู่ในระยะ • กดค้าง = เรียกคืนทั้งหมด • ห่างเกิน ${LTV.linkR} = ลิงก์หลุด`,
  cast(p){return lightBondTap(p)?undefined:false;}});
const LT_VO=defSpell(LIGHTP,{id:'shardvolley',v:{d0:250,overlap:25,gap:-15,wind:0.4,step:0.7,charge:1.4,dmg:30,r0:190,r:150,back:0.8},vn:{wind:'หมุนเข้าไม้ (วิ)',step:'ไปทีละชิ้น ห่าง (วิ)',d0:'ชิ้นแรก • ระยะ',overlap:'วงแรกกับวงสอง • ระยะที่ทับกัน',gap:'วงสองกับวงสาม • ช่องว่างระหว่างขอบ',charge:'หมุนชาร์จ (วิ)',dmg:'ระเบิด • ดาเมจ/ชิ้น',r0:'ระเบิด • รัศมีลูกแรก',r:'ระเบิด • รัศมีลูกถัดไป',back:'บินกลับ (วิ)'},role:'damage',n:'Shard Volley',ic:'💠',cd:8,
  d:'คริสตัลหมุนเข้ามาที่ไม้ ชี้ไปข้างหน้า คริสตัลที่ถือทั้งหมดพุ่งไปเป็นแถว (250 / 565 / 850) หมุนชาร์จแล้วระเบิดลูกละ 30 รัศมี 190 / 150 / 150 แล้วบินกลับ • ไม่มีคริสตัลกับตัว = ใช้ไม่ได้',
  cast(p,S){if(p.lc<=0||p.lgVol)return false;const V=S.v,a=p.ang,n=p.lc,pts=[];
    const second=V.d0+V.r0+V.r-V.overlap,step=2*V.r+V.gap;
    for(let k=0;k<n;k++){const d=k===0?V.d0:second+step*(k-1),x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d;
      pts.push([x,y,groundH(x,y,p.z),k===0?V.r0:V.r]);}
    p.lc=0;p.lgVol={t:0,n,pts};emit({k:'efx',z:'lgvol',x:Math.round(p.x),y:Math.round(p.y),h:p.z+1.4,id:p.id,pts:pts.map(([x,y,h,r])=>[Math.round(x),Math.round(y),r]),t:V.charge,w:V.wind,st:V.step});}}).v;
const LT_EM=defSpell(LIGHTP,{id:'empowerlight',v:{t:6,ally:5,icd:0.5,allyPct:0.05},vn:{t:'บัฟนาน (วิ)',ally:'เพื่อน • ดาเมจโบนัส/คริสตัล',icd:'เพื่อน • โบนัสทุก (วิ)',allyPct:'เพื่อน • ตีแรงขึ้น %/คริสตัล ตอนบัฟ'},role:'support',n:'Empower Light',ic:'✊',cd:12,
  d:'6 วิ: ลำแสงเรายิงถี่ +10% กว้าง +15% ยาว +50 ต่อคริสตัลที่ถือ • เพื่อนที่ลิงก์: ตอนตีโดน คริสตัลยิงกระสุนแสงโค้งตาม +5 ดาเมจต่อชิ้น (ทุก 0.5 วิ)',
  cast(p,S){p.lgEmp=G.time+S.v.t;const a=lightAlly(p);if(a)a.lgEmpT=G.time+S.v.t;emit({k:'efx',z:'lgemp',x:Math.round(p.x),y:Math.round(p.y),h:p.z,id:p.id,t:a?a.id:undefined});}}).v;
const LT_SC=defSpell(LIGHTP,{id:'sanctumcrystal',v:{range:400,t:8,r:200,rUp:25,heal:3},vn:{rUp:'รัศมีเพิ่ม/คริสตัลที่เพิ่ม',range:'ยิงได้ไกล',t:'วงอยู่ (วิ)',r:'รัศมีฮีล',heal:'ฮีล/วิ ต่อคริสตัล'},role:'support',n:'Sanctum Crystal',ic:'🔆',cd:20,
  d:'ชี้ไม้ลงจุด คริสตัลพุ่งโค้งปักพื้น (ไกล 400) คริสตัลแสงใหญ่ลอยขึ้น ฮีลเราและเพื่อนรัศมี 200 วิละ 3 ต่อคริสตัล • กดซ้ำ = เพิ่มคริสตัลเข้าวง • อยู่ 8 วินับจากชิ้นแรก • กดค้าง = เรียกคืน',
  toggle(p){const Z=p.lgSan;if(!Z)return false;if(p.lc>0){p.lc--;Z.n++;emit({k:'efx',z:'lgsanadd',x:Math.round(p.x),y:Math.round(p.y),h:p.z+1.4,x2:Math.round(Z.x),y2:Math.round(Z.y),h2:Z.h,id:p.id});}return true;},
  cast(p,S){if(p.lc<=0)return false;const [x,y,h]=lightAimPt(p,S.v.range);p.lc--;p.lgSan={x,y,h,n:1,t:S.v.t};emit({k:'efx',z:'lgsan',x:Math.round(x),y:Math.round(y),h,r:S.v.r,id:p.id});}}).v;
const LT_VS_RELEASE=0.58,LT_VS_TRAVEL=0.3;
const LT_VS_S=defSpell(LIGHTP,{id:'veiledshard',v:{t:5,r:300,dmg:6,tick:0.5,slow:0.3},vn:{t:'อยู่นาน (วิ)',r:'รัศมี',dmg:'ดาเมจต่อครั้ง',tick:'ตีทุก (วิ)',slow:'ช้า (สัดส่วน)'},role:'control',n:'Shard Storm',ic:'🌀',cd:12,
  d:'วางพายุใบมีดคริสตัลลงพื้นตรงเพื่อนที่ Bond อยู่ (ไม่มี Bond = ที่ตัวเรา) • หลังผลึกตก วงอยู่กับที่ 5 วิ รัศมี 300 • ศัตรูในวงโดน 6 ดาเมจทุก 0.5 วิ + ช้า 30%',
  cast(p,S){const a=lightAlly(p),c=a||p;p.lgVeil={x:c.x,y:c.y,h:c.z||0,wind:LT_VS_RELEASE+LT_VS_TRAVEL,t:S.v.t,k:0};emit({k:'efx',z:'lgveil',x:Math.round(c.x),y:Math.round(c.y),h:c.z||0,r:S.v.r,id:p.id,t:a?a.id:undefined});}});
const LT_VS=LT_VS_S.v;
// user 2026-11-25: 10 s, beams held 2x (1.4 s) but 8 dmg / 0.2 s, beam hitbox 30, finish 50 dmg r 400 with a longer charge + beam,
// forced finish when time runs out, caster can't be hurt, hold right click = X guard: duo gets a hex shield (70% less dmg, absorbs 100)
const LT_UL=defSpell(LIGHTP,{id:'radiantsovereign',v:{t:10,shield:75,dr:0.3,cast:0.45,hover:3.08,
  baRange:800,baDmg:8,baTick:0.20,baHold:1.4,baRest:0.39,baWindup:0.14,width:30,
  finishCast:1.3,finishRise:2.65,finishRelease:0.8,finishDelay:0.14,finishDissolve:0.65,finishRange:900,finishR:400,finishDmg:50,finishSlow:0.4,finishSlowT:2,
  xDR:0.7,xCap:100,xStun:2},
  vn:{t:'อยู่ (วิ)',shield:'คู่หู • โล่',dr:'คู่หู • ลดดาเมจ',baDmg:'ลำแสงแขน • ดาเมจต่อฮิต',finishDmg:'ท่าสุดท้าย • ดาเมจ'},
  role:'ult',ult:true,n:'Radiant Sovereign',ic:'👑',cd:0,
  d:'ลิงก์คู่หูแล้วแปลงร่างเหนือหัวเขา 10 วิ (ไม่โดนดาเมจ) • คลิกขวาค้าง = ไขว้แขน X: คู่หูได้โล่หกเหลี่ยม ลด 70% (กันได้รวม 100) แตก = สตัน 2 วิ ใช้ไม่ได้อีก • หมดเวลา = ยิงปิดท้ายเอง • คู่หูได้โล่ 75 และลดดาเมจ 30% • คลิกซ้ายค้างยิงลำแสงสลับแขน • กดอัลติซ้ำเพื่อชาร์จแล้วปล่อยลำแสงสั้นจากอก • จุดกระทบระเบิดหลังลำแสงแตะพื้น โดน 80 ดาเมจและช้า 40% 2 วิ จากนั้นสลายร่าง 1 วิแล้ววาร์ปกลับจุดเดิม',
  cast(p,S){
    const a=lightAlly(p);
    if(!a||a.team!==p.team||a.lgFrom!==p.id){
      emit({k:'efx',z:'lgultneed',x:p.x,y:p.y,id:p.id});return false;
    }
    if(p.lgUlt||p.shieldOn||p.fly||p.dash>0)return false;
    p.lgBeam=0;p.lgChg=0;p.lgFl=0;
    a.lgUltWard={owner:p.id,hp:S.v.shield};
    p.lgUlt={phase:1,t:S.v.t,cast:S.v.cast,ally:a.id,arm:1,burst:0,rest:0,wind:0,home:{x:p.x,y:p.y,h:p.z},xsh:0,xHp:S.v.xCap,xBrk:0,xStun:0};
    emit({k:'efx',z:'lgult',x:p.x,y:p.y,h:p.z,id:p.id,t:a.id});
  }}).v;
PATHS[LIGHTP].def=['crystalbond','shardvolley','empowerlight','sanctumcrystal'];
// คู่หูตีโดนตอน Empower Light: คริสตัลยิงกระสุนแสงโค้งตาม (โบนัส 5/ชิ้น ทุก 0.5 วิ) — เรียกจาก damage (js/12)
function lightAllyHit(src,t){if(!src||!(src.lgEmpT>G.time)||!(src.lgN>0)||src.lgEmpCd>G.time||src===t)return;src.lgEmpCd=G.time+LT_EM.icd;
  const n=src.lgN,from=src.lgFrom;emit({k:'efx',z:'lgbolt',x:Math.round(src.x),y:Math.round(src.y),h:(src.z||0)+1.6,x2:Math.round(t.x),y2:Math.round(t.y),h2:cH(t),n,id:src.id});
  (G.lgq||(G.lgq=[])).push({t:0.25,tg:t,dmg:LT_EM.ally*n,src:from||src.id});}
function lightQueueTick(dt){
  const bolts=G.lgq;
  for(let i=(bolts?.length||0)-1;i>=0;i--){
    const q=bolts[i];q.t-=dt;
    if(q.t<=0){bolts.splice(i,1);if(q.tg&&q.tg.alive!==false&&!q.tg.dead)damage(q.tg,q.dmg,q.src,'proj');}
  }
  const impacts=G.lgImpacts;
  if(G.ph!=='play'||!impacts?.length)return;
  for(let i=impacts.length-1;i>=0;i--){
    const {x,y,h,team,src,at}=impacts[i];
    if(G.time+1e-6<at)continue;
    impacts.splice(i,1);
    emit({k:'efx',z:'lgultboom',x,y,h,r:LT_UL.finishR,id:src});
    const caster=G.players[src]||{id:src};
    for(const t of foesIn(team,x,y,LT_UL.finishR,h+3.5,h-3.5)){
      if(Math.abs(cH(t)-h)<3.5)aoeHit(caster,t,LT_UL.finishDmg,q=>addSlow(q,1-LT_UL.finishSlow,LT_UL.finishSlowT));
    }
  }
}
PBASIC.push({id:'b_light',type:'lgray',n:'Prism Ray',d:`กดค้าง = ชาร์จ ${LTV.baCharge} วิ (ลอยขึ้นนิด คริสตัลเรียงเป็นวงหน้าไม้) แล้วยิงจากกลางวง ไกล ${LTV.baRange} • 0 คริสตัล = แตะยิง ${LTV.ba0[0]} ดาเมจ • 1/2/3 คริสตัล = ${[LTV.ba1,LTV.ba2,LTV.ba3].map(([d,t])=>d+'/'+t+' วิ').join(' • ')} • ลำหยุดที่เป้าแรก`,
  shd:'Crystal Aegis: คริสตัลบินมาเรียงเป็นโล่หกเหลี่ยมหน้าตัว กันได้แค่ด้านหน้า • เกจ 120/180/300 ตามคริสตัลที่ถือ • 0 ชิ้น = กางไม่ได้ • ระหว่างกางใช้สกิลไม่ได้',
  dsd:'Light Step (Shift): วาร์ป 250 ตามทิศเดิน • เล็งคู่หูที่ลิงก์ = วาร์ปใกล้ด้านหลังที่ความสูงเดียวกัน ถ้าไม่มีพื้นจะตก • ระเบิด 15 รัศมี 150 + คู่หูลดดาเมจ 30% 2 วิ • 1 ชาร์จ คูล 8 วิ',
  front:true,frontA:Math.PI/3,shDrain:0.25,aim3d:()=>true,shieldPitch:lightShieldPitch,
  noShield:p=>(p.lc|0)<=0,
  hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');},
  tick:lightBasic,dash:lightDash});
SPELLS.b_light=PBASIC[LIGHTP];
