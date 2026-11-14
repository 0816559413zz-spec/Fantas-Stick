// ---------- สายน้ำแข็ง: ประชิด/ไกล (V) • ฟันดาบ/ขวาน • ไถลน้ำแข็ง • พื้นน้ำแข็ง/ภูเขาน้ำแข็ง ----------
// ตัวเลขพื้นฐานของสายน้ำแข็งอยู่ใน FROSTV + v:{...} ของแต่ละสกิล (js/07) — ปรับได้ใน tune.html / F8
const FROSTV=PATHS[1].v={icicleDmg:7,icicleCd:0.4,icicleSlow:10,c1:10,c2:10,c3:15,meleeR:120,swingCd:0.46,swing3Cd:0.93,swingShCd:0.66,heal3:10,slamDmg:30,slamR:150,slamCd:0.6,
  slideT:5,slideCd:11,slowMax:30,slowT:3,slowPath:10,ripT:1.5};
PATHS[1].vn={icicleDmg:'แท่งน้ำแข็ง (ไกล) • ดาเมจ',icicleCd:'แท่งน้ำแข็ง • เว้นยิง (วิ)',icicleSlow:'แท่งน้ำแข็ง • สลอว์ต่อนัด (%)',c1:'ดาบ • ดาเมจจังหวะ 1',c2:'ดาบ • ดาเมจจังหวะ 2',c3:'ดาบ • ดาเมจจังหวะ 3',meleeR:'ดาบ • ระยะฟัน',
  swingCd:'ดาบ • เว้นฟัน (วิ)',swing3Cd:'ดาบ • เว้นหลังจังหวะ 3 (วิ)',swingShCd:'ดาบ • เว้นฟันตอนยกโล่ (วิ)',heal3:'ดาบ • ฮีลจังหวะ 3',slamDmg:'กระโดดฟาดจากที่สูง • ดาเมจ',slamR:'กระโดดฟาด • รัศมี',slamCd:'กระโดดฟาด • เว้น (วิ)',
  slideT:'ไถลน้ำแข็ง (พุ่ง) • นาน (วิ)',slideCd:'ไถลน้ำแข็ง • คูลดาวน์ (วิ)',slowMax:'สลอว์สะสมสูงสุด (%)',slowT:'สลอว์อยู่นาน (วิ)',slowPath:'ยืนบนทางน้ำแข็ง • สลอว์ (%)',ripT:'Parry • จังหวะ 3 พร้อมใช้ (วิ)'};
SPELLS.iceboulder={id:'iceboulder',hit(pr,t){}};
const FROST_SWING3_HIT=0.36;
function frostShieldPitch(p){
  const i=p.inp,dist=Math.hypot(i?.ax-p.x,i?.ay-p.y);
  const pitch=dist>1&&Number.isFinite(i.ah)?Math.atan2((i.ah-p.z-1.2)*20,dist):i?.ap||0;
  return clamp(pitch,-0.55,1.5);
}
function frostBoom(pr){
  const V=FROSTF.v;emit({k:'efx',z:'iceboom',x:pr.x,y:pr.y,h:pr.h,r:V.r});
  const o=G.players[pr.owner];if(!o)return;
  for(const t of foesIn(pr.team,pr.x,pr.y,V.r,pr.h+3))aoeHit(o,t,V.dmg,t=>{t.fslBigT=V.slowT;});
  damageEnv(pr.x,pr.y,V.r,V.env,pr.owner,'ice',pr.h);
}
// ฟันโดนทุกคนในกรวยหน้า (arc = ครึ่งมุม) จากจุด ox,oy
function meleeHit(p,ox,oy,range,dmg,arc,fn){
  let n=0;const ph=p.z+1;
  for(const t of foesOf(p.team)){
    const dx=t.x-ox,dy=t.y-oy,d=Math.hypot(dx,dy);
    if(d>range+(t.r||PR))continue;
    if(d>14&&Math.abs(angDiff(Math.atan2(dy,dx),p.ang))>arc)continue;
    if(!aimLineH(p,ph,t,2.8))continue;
    if(aoeHit(p,t,dmg,fn))n++;
  }
  return n;
}
function mirrorPos(p,s){const c=Math.cos(p.ang),sn=Math.sin(p.ang);return {x:p.x+c*30-sn*55*s,y:p.y+sn*30+c*55*s};}
function frostBasic(p,inp,dt,setCd){
  if(p.cryo>0||p.grT>0||p.slam)return;
  const ff=p.ffT>0;
  if(p.fmode===1){
    if(inp.fire&&p.cd.basic<=0){
      if(ff){shoot(p,'iceboulder',{sp:'iceboulder',dmg:FROSTF.v.dmg});setCd('basic',FROSTF.v.cd2);}
      else{shoot(p,'icicle',{sp:'b_frost',dmg:FROSTV.icicleDmg});setCd('basic',FROSTV.icicleCd);}
    }
    return;
  }
  if(p.cmbT>0)p.cmbT-=dt;
  if(!inp.fire||p.cd.basic>0)return;
  // อยู่สูง (เช่นบนภูเขาน้ำแข็ง) = กระโดดฟาดลงพื้น
  if(p.z>4){p.slam=true;p.vz=5;p.vx+=Math.cos(p.ang)*420;p.vy+=Math.sin(p.ang)*420;setCd('basic',FROSTV.slamCd);emit({k:'efx',z:'slamgo',x:p.x,y:p.y,h:p.z+1,id:p.id});return;}
  let ci=p.cmbT>0?(p.cmbN|0):0;if(p.ripT>0){ci=2;p.ripT=0;}
  const FV=FROSTF.v,D=ff?[FV.a1,FV.a2,FV.a3]:[FROSTV.c1,FROSTV.c2,FROSTV.c3],R=ff?FV.axeR:FROSTV.meleeR;
  if(ci===2){p.slam3={t:FROST_SWING3_HIT,R,dm:D[2],ff};}
  else{meleeHit(p,p.x,p.y,R,D[ci],1.0);
  if(p.mirror>0)for(const s of [-1,1]){const q=mirrorPos(p,s);meleeHit(p,q.x,q.y,R,D[ci]*MIRROR.v.clone,1.0);}}
  p.cmbN=(ci+1)%3;p.cmbT=1;p.swN=((p.swN|0)+1)%250;p.swC=ci;
  emit({k:'efx',z:'swing',x:p.x,y:p.y,h:p.z+1.1,a:Math.round(p.ang*100)/100,c:ci,ax:ff?1:0,r:R,id:p.id,m:p.mirror>0?1:0});
  setCd('basic',ci===2?FROSTV.swing3Cd:p.shieldOn?FROSTV.swingShCd:ff?FV.axeCd:FROSTV.swingCd);
}
// จังหวะ 3: ง้างแล้วฟาดลงพื้นตรงหน้า (ดาเมจออกหลังง้าง 0.32 วิ) + ระเบิดน้ำแข็ง
function frostSlam3(p){
  const q=p.slam3;p.slam3=null;if(!q||!p.alive||p.downed)return;
  const n=meleeHit(p,p.x,p.y,q.R,q.dm,1.0);
  if(n>0)healT(p,p.mirror>0?(q.ff?MIRROR.v.healAxe:MIRROR.v.heal):(q.ff?FROSTF.v.heal3:FROSTV.heal3));
  if(p.mirror>0)for(const s of [-1,1]){const m=mirrorPos(p,s);meleeHit(p,m.x,m.y,q.R,q.dm*MIRROR.v.clone,1.0);}
  const fx=p.x+Math.cos(p.ang)*q.R*0.6,fy=p.y+Math.sin(p.ang)*q.R*0.6;
  emit({k:'efx',z:'slam3',x:fx,y:fy,h:p.z+0.1,r:q.R*0.75,ax:q.ff?1:0,m:p.mirror>0?1:0,a:Math.round(p.ang*100)/100,id:p.id});
}
function frostSlam(p){
  p.slam=false;const dm=p.ffT>0?FROSTF.v.slamDmg:FROSTV.slamDmg,R=FROSTV.slamR;
  emit({k:'efx',z:'slam',x:p.x,y:p.y,h:p.z+0.2,r:R,id:p.id,ax:p.ffT>0?1:0});
  for(const t of foesIn(p.team,p.x,p.y,R,p.z+3))aoeHit(p,t,dm);
  damageEnv(p.x,p.y,R,dm,p.id,'ice',p.z);
}
function frostDash(p,inp,pr,dt,setCd){
  if(pr.sp&&p.cd.dodge<=0&&!(p.slideT>0)&&!(p.cryo>0)){p.slideT=FROSTV.slideT;p.slX=p.x;p.slY=p.y;setCd('dodge',FROSTV.slideCd*p.buffs.cdr);emit({k:'efx',z:'slide',x:p.x,y:p.y,h:p.z,id:p.id});}
  return false;
}
// พื้นน้ำแข็ง (ทางไถล / ทางคลื่นดาบ / วงน้ำแข็ง)
function addIce(o){const z=Object.assign({t:4},o);(G.ices||(G.ices=[])).push(z);const ev={k:'efx',z:'ice',x:z.x,y:z.y,r:z.r,t:z.t,c:z.kind==='ring'?1:0};if(o.wv)ev.w=1;if(o.lx!==undefined){ev.lx=Math.round(o.lx);ev.ly=Math.round(o.ly);}emit(ev);return z;}
function updateIces(dt){
  for(const q of plist())q.iceB=0;
  if(!G.ices||!G.ices.length)return;
  const all=[...plist().filter(q=>q.alive&&!q.downed),...G.en.filter(e=>!e.dead),...(G.mins||[]).filter(m=>!m.dead)];
  for(const z of G.ices){
    z.t-=dt;
    for(const t of all){
      if((t.z||t.h||0)>2.5)continue;
      if((t.x-z.x)**2+(t.y-z.y)**2>(z.r+(t.r||PR)*0.5)**2)continue;
      if(t.team===z.team){if(!t.isE&&!t.isM)t.iceB=Math.max(t.iceB||0,z.kind==='ring'?PERMA.v.selfSpd:0.2);continue;}
      if(z.kind==='ring')t.fslR=0.3;else{t.fslP=0.3;t.slip=0.3;}
    }
  }
  G.ices=G.ices.filter(z=>z.t>0);
}
// คลื่นดาบ (Glacier Rend โหมดประชิด) วิ่งไปข้างหน้า ทิ้งทางน้ำแข็ง
// มุมเงย/ก้มของคลื่นดาบ = ตามเป้ากลางจอ (ผู้ใช้ 2026-11-11) • บอท/ไม่มีข้อมูลเล็ง = ก้มนิดเดียวให้ลงพื้น
function frostWavePitch(p){const i=p.inp;if(!i||p.bot||typeof i.ah!=='number')return -0.12;
  const d=Math.hypot(i.ax-p.x,i.ay-p.y);return clamp(Math.atan2((i.ah-(p.z+1))*20,Math.max(1,d)),-1.2,1.35);}
// คลื่นกลางอากาศชนของแข็ง (เนิน/หิน/บ้าน/กำแพงเวทศัตรู/ตึก) = แตกตรงนั้น — เงื่อนไขเดียวกับลำน้ำ (waterBeamStop)
function frostWaveSolid(w){const x=w.x,y=w.y,hh=w.h;
  if(TERR&&terrSolid(x,y,hh))return true;
  for(const o of sgNear(sgObs(),x,y,8,_sgPO))if(o.bi===undefined&&!(o.bot!==undefined&&hh<o.bot)&&(o.top!==undefined?terrT(x,y)+hh<o.top:hh<o.hgt)&&(x-o.x)**2+(y-o.y)**2<(o.r+8)**2)return true;
  if(BLDG.length)for(const b of sgNear(sgBld(),x,y,8,_sgPB))if(bldNear(b,x,y,8)&&bldPieceAt(b,x,y,hh,8)>=0)return true;
  for(const q of G.walls)if(w.team!==q.team&&hh<q.hgt&&(x-q.x)**2+(y-q.y)**2<(q.r+8)**2)return true;
  return citySolidAt(x,y,hh);}
function updateWaves(dt){
  if(!G.waves||!G.waves.length)return;
  for(const w of G.waves){
    const GV=GREND.v,st=Math.min(w.left,GV.waveSpd*dt);w.left-=st;
    // กลางอากาศ: บินตามแนวเล็ง ไม่ทิ้งทางน้ำแข็ง • แตะพื้น = ไถลไปตามพื้น ทิ้งทางน้ำแข็ง (เดิมวิ่งบนพื้นอย่างเดียว)
    if(!w.gnd&&w.pt!==undefined){const cp=Math.cos(w.pt);w.x+=w.dx*cp*st;w.y+=w.dy*cp*st;w.h+=Math.sin(w.pt)*st/20;if(w.h<=0.25){w.gnd=1;w.h=0;w.acc=50;}
      else if(frostWaveSolid(w)){w.left=0;emit({k:'efx',z:'gwend',n:w.n,x:Math.round(w.x),y:Math.round(w.y),h:Math.round(w.h*10)/10});}}
    else{w.x+=w.dx*st;w.y+=w.dy*st;w.acc+=st;}
    const o=G.players[w.owner];
    if(o)for(const t of foesOf(w.team)){if(w.hit.has(t))continue;if(Math.hypot(t.x-w.x,t.y-w.y)<40+(t.r||PR)&&(w.gnd||w.pt===undefined?cH(t)<4:Math.abs(cH(t)-w.h)<2.6)){w.hit.add(t);aoeHit(o,t,GV.waveDmg,t=>addFrostSlow(t,GV.waveSlow));}}
    if((w.gnd||w.pt===undefined)&&w.acc>=50){w.acc=0;addIce({x:w.x,y:w.y,r:72,t:4,team:w.team,kind:'path',lx:w.x-w.dx*50,ly:w.y-w.dy*50,wv:1});}
    if(w.x<30||w.x>MW-30||w.y<30||w.y>MH-30)w.left=0;
  }
  G.waves=G.waves.filter(w=>w.left>0);
}
// ภูเขาน้ำแข็ง (Glacier Rend โหมดไกล): แท่งน้ำแข็งแหลมต่อกันเป็นแนว สูงขึ้นเรื่อยๆ เดินขึ้นไปได้
// พื้นที่ยืนได้ตรง (x,y) วัดเป็น "ความสูงจากพื้นหลัก" (0 = พื้นหลัก/เนิน) • z = ความสูงปัจจุบันของตัวที่ถาม (นับพื้นชั้นบน เช่น สะพาน เฉพาะที่ก้าวขึ้นถึง)
// ที่ชนที่ยืนบนหลังได้ของแผนที่นี้ (แคชตาม OBS)
let _stO=null,_stL=[];function standObs(){if(_stO!==OBS){_stO=OBS;_stL=(OBS||[]).filter(o=>o.st);}return _stL;}
function groundH(x,y,z){
  let g=0;
  if(TERR&&TERR.fl.length){const t=terrT(x,y),a=t+(z||0)+TSTEP;for(const f of TERR.fl){const v=floorAt(f,x,y,'top');if(v<=a&&v-t>g)g=v-t;}}
  if(G&&G.glac)for(const s of G.glac)if(s.h>0&&(x-s.x)**2+(y-s.y)**2<s.r*s.r&&s.h>g)g=s.h;
  if(G&&G.eso)for(const w of G.eso)if(w.k==='mound'&&!w.dead){const d2=(x-w.x1)**2+(y-w.y1)**2,r2=w.r*w.r;if(d2<r2){const v=w.hgt*(1-d2/r2);if(v>g)g=v;}}   // เนินสายดิน = พื้นโดมเดินขึ้นได้
  {const m=bldMoundH(x,y);if(m>g)g=m;}
  {const c=cityFloorH(x,y,z);if(c>g)g=c;}   // พื้นชั้นบน/ทางลาดในตึกเมือง (js/12-city-dmg)   // เนินซากบ้านที่พังครบทั้งหลัง (js/12)
  {const S=standObs();if(S.length){const t=TERR?terrT(x,y):0,a=t+(z||0)+0.35;for(const o of S){if((x-o.x)**2+(y-o.y)**2>=o.r*o.r)continue;const v=o.top!==undefined?o.top:t+o.hgt;if(v<=a&&v-t>g)g=v-t;}}}   // โต๊ะ (st): ลงยืนได้เมื่อกระโดดสูงพอ — เดินชนยังกั้นอยู่ (ก้าวขึ้นได้แค่ 0.35 ไม่ใช่ TSTEP)
  return g;
}
