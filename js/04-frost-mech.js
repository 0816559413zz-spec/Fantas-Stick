// ---------- สายน้ำแข็ง: ประชิด/ไกล (V) • ฟันดาบ/ขวาน • ไถลน้ำแข็ง • พื้นน้ำแข็ง/ภูเขาน้ำแข็ง ----------
SPELLS.iceboulder={id:'iceboulder',hit(pr,t){}};
function frostBoom(pr){
  emit({k:'efx',z:'iceboom',x:pr.x,y:pr.y,h:pr.h,r:100});
  const o=G.players[pr.owner];if(!o)return;
  for(const t of foesIn(pr.team,pr.x,pr.y,100,pr.h+3))aoeHit(o,t,20,t=>{t.fslBigT=2;});
  damageEnv(pr.x,pr.y,100,30,pr.owner,'ice',pr.h);
}
// ฟันโดนทุกคนในกรวยหน้า (arc = ครึ่งมุม) จากจุด ox,oy
function meleeHit(p,ox,oy,range,dmg,arc,fn){
  let n=0;const ph=p.z+1;
  for(const t of foesOf(p.team)){
    const dx=t.x-ox,dy=t.y-oy,d=Math.hypot(dx,dy);
    if(d>range+(t.r||PR))continue;
    if(d>14&&Math.abs(angDiff(Math.atan2(dy,dx),p.ang))>arc)continue;
    if(Math.abs(cH(t)-ph)>2.8)continue;
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
      if(ff){shoot(p,'iceboulder',{sp:'iceboulder',dmg:20});setCd('basic',0.6);}
      else{shoot(p,'icicle',{sp:'b_frost',dmg:7});setCd('basic',0.3);}
    }
    return;
  }
  if(p.cmbT>0)p.cmbT-=dt;
  if(!inp.fire||p.cd.basic>0)return;
  // อยู่สูง (เช่นบนภูเขาน้ำแข็ง) = กระโดดฟาดลงพื้น
  if(p.z>4){p.slam=true;p.vz=5;p.vx+=Math.cos(p.ang)*420;p.vy+=Math.sin(p.ang)*420;setCd('basic',0.6);emit({k:'efx',z:'slamgo',x:p.x,y:p.y,h:p.z+1,id:p.id});return;}
  let ci=p.cmbT>0?(p.cmbN|0):0;if(p.ripT>0){ci=2;p.ripT=0;}
  const D=ff?[20,20,40]:[10,10,15],R=ff?160:120;
  if(ci===2){p.slam3={t:0.32,R,dm:D[2],ff};}
  else{meleeHit(p,p.x,p.y,R,D[ci],1.0);
  if(p.mirror>0)for(const s of [-1,1]){const q=mirrorPos(p,s);meleeHit(p,q.x,q.y,R,D[ci]*0.5,1.0);}}
  p.cmbN=(ci+1)%3;p.cmbT=1;p.swN=((p.swN|0)+1)%250;p.swC=ci;
  emit({k:'efx',z:'swing',x:p.x,y:p.y,h:p.z+1.1,a:Math.round(p.ang*100)/100,c:ci,ax:ff?1:0,r:R,id:p.id,m:p.mirror>0?1:0});
  setCd('basic',ci===2?0.85:p.shieldOn?0.6:ff?0.5:0.4);
}
// จังหวะ 3: ง้างแล้วฟาดลงพื้นตรงหน้า (ดาเมจออกหลังง้าง 0.32 วิ) + ระเบิดน้ำแข็ง
function frostSlam3(p){
  const q=p.slam3;p.slam3=null;if(!q||!p.alive||p.downed)return;
  const n=meleeHit(p,p.x,p.y,q.R,q.dm,1.0);
  if(n>0)healT(p,p.mirror>0?(q.ff?22:15):(q.ff?15:10));
  if(p.mirror>0)for(const s of [-1,1]){const m=mirrorPos(p,s);meleeHit(p,m.x,m.y,q.R,q.dm*0.5,1.0);}
  const fx=p.x+Math.cos(p.ang)*q.R*0.6,fy=p.y+Math.sin(p.ang)*q.R*0.6;
  emit({k:'efx',z:'slam3',x:fx,y:fy,h:p.z+0.1,r:q.R*0.75,ax:q.ff?1:0,m:p.mirror>0?1:0,a:Math.round(p.ang*100)/100,id:p.id});
}
function frostSlam(p){
  p.slam=false;const dm=p.ffT>0?50:30;
  emit({k:'efx',z:'slam',x:p.x,y:p.y,h:p.z+0.2,r:150,id:p.id,ax:p.ffT>0?1:0});
  for(const t of foesIn(p.team,p.x,p.y,150,p.z+3))aoeHit(p,t,dm);
  damageEnv(p.x,p.y,150,dm,p.id,'ice',p.z);
}
function frostDash(p,inp,pr,dt,setCd){
  if(pr.sp&&p.cd.dodge<=0&&!(p.slideT>0)&&!(p.cryo>0)){p.slideT=5;p.slX=p.x;p.slY=p.y;setCd('dodge',11*p.buffs.cdr);emit({k:'efx',z:'slide',x:p.x,y:p.y,h:p.z,id:p.id});}
  return false;
}
// พื้นน้ำแข็ง (ทางไถล / ทางคลื่นดาบ / วงน้ำแข็ง)
function addIce(o){const z=Object.assign({t:4},o);(G.ices||(G.ices=[])).push(z);const ev={k:'efx',z:'ice',x:z.x,y:z.y,r:z.r,t:z.t,c:z.kind==='ring'?1:0};if(o.lx!==undefined){ev.lx=Math.round(o.lx);ev.ly=Math.round(o.ly);}emit(ev);return z;}
function updateIces(dt){
  for(const q of plist())q.iceB=0;
  if(!G.ices||!G.ices.length)return;
  const all=[...plist().filter(q=>q.alive&&!q.downed),...G.en.filter(e=>!e.dead),...(G.mins||[]).filter(m=>!m.dead)];
  for(const z of G.ices){
    z.t-=dt;
    for(const t of all){
      if((t.z||t.h||0)>2.5)continue;
      if((t.x-z.x)**2+(t.y-z.y)**2>(z.r+(t.r||PR)*0.5)**2)continue;
      if(t.team===z.team){if(!t.isE&&!t.isM)t.iceB=Math.max(t.iceB||0,z.kind==='ring'?0.3:0.2);continue;}
      if(z.kind==='ring')t.fslR=0.3;else{t.fslP=0.3;t.slip=0.3;}
    }
  }
  G.ices=G.ices.filter(z=>z.t>0);
}
// คลื่นดาบ (Glacier Rend โหมดประชิด) วิ่งไปข้างหน้า ทิ้งทางน้ำแข็ง
function updateWaves(dt){
  if(!G.waves||!G.waves.length)return;
  for(const w of G.waves){
    const st=Math.min(w.left,1500*dt);w.x+=w.dx*st;w.y+=w.dy*st;w.left-=st;w.acc+=st;
    const o=G.players[w.owner];
    if(o)for(const t of foesOf(w.team)){if(w.hit.has(t))continue;if(Math.hypot(t.x-w.x,t.y-w.y)<40+(t.r||PR)&&cH(t)<4){w.hit.add(t);aoeHit(o,t,30,t=>addFrostSlow(t,5));}}
    if(w.acc>=50){w.acc=0;addIce({x:w.x,y:w.y,r:72,t:4,team:w.team,kind:'path',lx:w.x-w.dx*50,ly:w.y-w.dy*50});}
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
