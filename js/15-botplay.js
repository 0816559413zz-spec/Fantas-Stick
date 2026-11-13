// =====================================================================
//  วิธีเล่นของบอทแต่ละสาย (ผู้ใช้ 2026-10-31 "บอทไม่รู้วิธีเล่นสายของตัวเอง")
//  botBrain (js/41) ถามที่นี่ก่อนกดสกิล: botWant = จะกดสกิลนี้ตอนนี้ไหม (true/false • undefined = ใช้ตารางระยะเดิม)
//  botCombo = ท่าต่อเนื่องหลังกด (คลิกดิ่ง / ยืนยัน / กดซ้ำบีบกำแพง / สลับดาบ-ไกล / ทิศกระโดดหนี) — เรียกท้าย aiBot (หลังเช็คจังหวะเว้นสกิล)
//  BOT_RANGE = ระยะที่ชอบยืนต่อสาย [ใกล้สุด, ไกลสุด] — ตัวเลขตั้งต้น ให้ทีมเกมเพลย์ปรับ
// =====================================================================
const BOT_RANGE={0:[340,580],1:[0,95],2:[0,240],3:[105,205],6:[300,520],7:[275,480]};
// ความจำบอทเรื่องท่าต่อเนื่อง (ต่อตัว)
function botMem(p){return p.bp||(p.bp={away:0,clk:0,wall:null,v:0});}
// มีของแข็ง (กำแพง/ตึก/กำแพงลม-หินของเรา) อยู่หลังเป้าในแนวที่เราผลักไหม — ใช้กับสกิลผลัก (ดิน/ลม)
function botWallBehind(p,tg,dist){
  const a=Math.atan2(tg.y-p.y,tg.x-p.x),c=Math.cos(a),s=Math.sin(a);
  for(let k=60;k<=dist;k+=40){const x=tg.x+c*k,y=tg.y+s*k;
    if(x<40||y<40||x>MW-40||y>MH-40)return true;
    if(typeof navOn==='function'&&navOn()&&!navWalk(x,y))return true;
    for(const o of OBS)if(!o.bi&&o.hgt>1.5&&(o.x-x)**2+(o.y-y)**2<(o.r+10)**2)return true;
    for(const w of (G.wwl||[]))if(w.owner===p.id&&!w.dead&&(w.x-x)**2+(w.y-y)**2<120*120)return true;
    for(const w of (G.eso||[]))if(w.owner===p.id&&!w.dead&&w.x1!==undefined&&(((w.x1+w.x2)/2-x)**2+((w.y1+w.y2)/2-y)**2)<150*150)return true;}
  return false;
}
const _bspd=t=>Math.hypot(t.vx||0,t.vy||0);
// สายฟ้า: มีสกิลใช้ 2 stack พร้อม (Triple Strike / Railgun) = เก็บ stack ไว้ ไม่ใช้สกิล 1 stack จนกว่าจะมี 3
const botSave=p=>p.kitIds.some((id,i)=>(id==='triplestrike'||id==='railgun')&&!(p.cd[SLOTK[i]]>0));
// จะกดสกิล id ตอนนี้ไหม • tg = เป้า • d = ระยะ
function botWant(p,id,tg,d){
  const M=botMem(p),hp=p.hp/p.maxHp,st=(p.lst|0),stuck=tg.stun>0||tg.root>0||tg.mudT>0||tg.frz>0||_bspd(tg)<90;
  switch(id){
    // ---- ไฟ: ยืนไกล สะสมไฟ แล้วระเบิด • ไม่ว่องไว = โดนประชิดแล้วกระโดดหนี ----
    case 'kindle':if(d<240||hp<0.4&&d<420){M.away=0.35;return true;}return false;
    case 'dragonfall':return d>260&&d<560&&!tg.isE&&!(tg.z>2);
    case 'ringofembers':return d<420&&(stuck||Math.random()<0.5);
    case 'blazeform':return d<480&&((tg.brn|0)>=2||hp<0.6);
    case 'ignitionsnap':return (tg.brn|0)>=3&&d<480;
    // ---- น้ำแข็ง: นักดาบ คลุกวงใน • ไกล = คลื่นดาบ/ภูเขาน้ำแข็ง ----
    case 'frostforge':return p.fmode===1?d<500:d<200;
    case 'glacierrend':return p.fmode===1?d<650:d>180&&d<560;
    case 'permafrost':return d<260;
    case 'frostaura':return d<180;
    case 'cryoshell':return hp<0.3&&d<450;
    // ---- สายฟ้า: Dash ทะลุเก็บ stack แล้วจ่าย stack ----
    case 'thunderline':return d<560;
    case 'speedsiphon':return st>=(botSave(p)?4:2)&&d<600;
    case 'stormorbs':return st>=(botSave(p)?3:1)&&!p.sorb&&d<450;
    case 'triplestrike':return st>=2&&d<600&&(stuck||st>=4);
    case 'railgun':return st>=3&&d>280&&d<850&&(stuck||hp>0.6);
    case 'stormdome':return st>=stormDomeCost(p)&&d<560;
    // ---- ดิน: ผลักศัตรูชนของแข็ง • โคลน → กำแพงหนีบ ----
    case 'stonebreaker':return d<650&&(botWallBehind(p,tg,260)||d<360);
    case 'mudswamp':return d<580;
    case 'tectoniccrush':return d>110&&d<330&&(tg.mudT>0||stuck||Math.random()<0.3);
    case 'dustburst':return d<480;
  }
}

// Both combat bots and balance bots use these inputs. Combos advance from the actual
// spell state, so a cast denied by reaction timing, navigation, or a shield is retried.
const botClassPlanFor=p=>p.pathIdx===WINDP||p.pathIdx===NATUREP;
function botClassAim(p,t){
  const h=cH(t)+terrT(t.x,t.y)-terrT(p.x,p.y);
  Object.assign(p.inp,{ax:t.x,ay:t.y,ah:h});
  if(p.ai)p.ai.aimOv={x:t.x,y:t.y};
}
function botClassGround(inp,x,y){inp.gx=clamp(x,40,MW-40);inp.gy=clamp(y,40,MH-40);}
function botClassTarget(p,t,wait){
  const lv=p.ai?BOT_LV[p.ai.lv]:null;
  const drift=Math.max(.10,wait)*(lv?.lead??1);
  return {x:t.x+((t.mvx||0)+(t.vx||0))*drift+(p.ai?.errX||0)*.35,
    y:t.y+((t.mvy||0)+(t.vy||0))*drift+(p.ai?.errY||0)*.35};
}
function botClassLane(p,x,y,h=p.z){
  return botInZone(p.ai?.zone,x,y,-30)&&!natureTrace(p,{x,y},h+.7,h+.7,p.team,true);
}
function botClassPlan(p,t){
  const i=p.inp,dist=natureDist(p,t),dx=t.x-p.x,dy=t.y-p.y,d=dist||1;
  const ux=dx/d,uy=dy/d,hp=p.hp/p.maxHp;
  const slot=id=>SLOTK[p.kitIds.indexOf(id)];
  const ready=id=>!!slot(id)&&p.cd[slot(id)]<=0&&p.sil<=0;
  const press=k=>{i.c[k]=(i.c[k]|0)+1;};
  const cast=id=>press(slot(id));
  i.sh=0;i.jh=0;i.ch=0;i.dh=0;i.gx=-1;i.gy=-1;
  i.ah=cH(t)+terrT(t.x,t.y)-terrT(p.x,p.y);
  i.fire=0;
  if(p.stun>0||p.fly)return;
  const see=dist<Math.max(W_FW.fbRange,NAT.treeRange)&&natureSight(p,t,p.z+1.5,cH(t));
  const C={i,dist,ux,uy,hp,slot,ready,press,cast,see};
  if(p.pathIdx===WINDP)botWindPlan(p,t,C);
  else botNaturePlan(p,t,C);
}
function botWindPlan(p,t,{i,dist,ux,uy,hp,slot,ready,press,cast,see}){
  if(p.wult||windSpin(p)||p.wdc!==undefined||p.wbw!==undefined){
    i.mx=i.my=0;
    if(p.wult?.ph==='chg'){
      const aim=botClassTarget(p,t,W_UL.impPre);
      botClassAim(p,t);i.ax=aim.x;i.ay=aim.y;
      if(p.ai)p.ai.aimOv=aim;
    }
    return;
  }
  const air=windAir(p),fly=p.wfw;
  const glide=fly?.orbGlide&&p.wbAmmo>0&&see&&dist<W_FW.fbRange;
  if(glide)i.jh=1;
  const range=air||glide?W_FW.fbRange:WNV.baRange,volley=slot('windrift');
  const controlled=(G.wdb||[]).find(o=>o.team===p.team&&natureDist(o,t)<=W_WL.dbR+(t.r||PR));
  const waiting=controlled&&controlled.t<W_WL.dbTele;
  const lowShot=air&&i.ah<p.z-2.5&&dist<480;
  if(air){
    const h=fly.h??p.z-groundH(p.x,p.y,p.z);
    const height=clamp(i.ah-groundH(p.x,p.y,p.z)+2.4,3.3,6);
    i.jh=h<height-.35?1:0;i.ch=h>height+.35?1:0;
  }
  i.fire=see&&dist<range&&!waiting?1:0;
  if(!see)return;

  if(!air&&ready('featherwing')&&dist<Math.min(W_FW.fbRange,850)){
    cast('featherwing');return;
  }
  // A wing blast is a deliberate shield + click, with its own wind-up.
  if(!air&&!fly&&dist>55&&dist<WNV.wbAhead+WNV.wbR*.65&&p.shieldBroken<=0&&p.shieldE>33&&!(p.wsbC>0)
    &&(hp<.6||dist<145)){
    i.sh=1;i.fire=p.wfPrev?0:1;i.mx=-ux;i.my=-uy;return;
  }
  if(ready('voidspheres')&&dist>440&&dist<W_VO.tlL&&!controlled&&!(p.wtlT>0)){
    cast('voidspheres');return;
  }
  const place=air?W_WL.placeA:W_WL.placeG;
  if(!controlled&&ready('aegisgale')&&p.wwc>0&&dist<=place+W_WL.dbR*.45){
    const q=botClassTarget(p,t,W_WL.dbTele);
    botClassGround(i,q.x,q.y);cast('aegisgale');return;
  }
  if(waiting)return;
  if(ready('windrift')&&!p.wpv&&dist>145&&dist<W_DR.vRange*.91
    &&(controlled||dist<W_DR.vRange*.66||!ready('aegisgale'))){
    cast('windrift');return;
  }

  // Spend the refresh after using Volley/Downburst, then aim again throughout the charge.
  const ultRange=air?W_UL.dA:W_UL.dG;
  const canUlt=!p.ai||t.isE||t.hp<=t.maxHp*BOT_LV[p.ai.lv].ult;
  const spent=(!volley||p.cd[volley]>0)&&(!slot('aegisgale')||controlled||!(p.wwc>0)||dist>place+W_WL.dbR);
  if(p.ult>=100&&p.sil<=0&&canUlt&&dist>130&&dist<ultRange*.86&&!p.wpv&&!p.wbCh
    &&(air?fly.t>W_UL.chg+.30&&(spent||hp<.45):!ready('featherwing')&&(hp<.45||!slot('featherwing')))){
    i.fire=0;i.mx=i.my=0;press('x');return;
  }
  if(air&&fly.t<.52&&!p.wbCh&&dist<W_FW.range&&i.ah-p.z>=-(W_FW.hgt+2)&&i.ah-p.z<=2&&slot('featherwing')){
    i.fire=0;cast('featherwing');return;
  }
  if(ready('vortexbind')&&p.wsc>0&&!p.wsl&&!p.dash&&!p.wse&&!p.wbCh&&dist<range*.91
    &&(air?p.wbCd>.25:p.cd.basic>.16)){
    const amount=air?W_VX.sA:W_VX.sG,side=p.ai?.ps.sd||(p.id.length%2?1:-1);
    for(const turn of [side,-side]){
      if(!botClassLane(p,p.x-uy*amount*turn,p.y+ux*amount*turn))continue;
      i.mx=-uy*turn;i.my=ux*turn;cast('vortexbind');return;
    }
  }
  if(ready('voidspheres')&&dist>165&&dist<W_VO.tlL&&!controlled&&!(p.wtlT>0)){
    cast('voidspheres');return;
  }
  if(!air&&!fly&&p.cd.dodge<=0&&!ready('featherwing')&&dist<240&&(hp<.65||!slot('featherwing'))){
    i.mx=-ux;i.my=-uy;press('sp');return;
  }
  if(air&&lowShot&&dist<205){i.mx=-ux;i.my=-uy;}
}

function botNaturePlan(p,t,{i,dist,ux,uy,hp,slot,ready,press,cast,see}){
  if(p.natureHook)return;
  const team=plist().filter(q=>q.team===p.team&&natureLive(q));
  const plants=naturePlants(p),turrets=plants.filter(o=>o.natKind==='turret');
  const usable=o=>G.time>=o.ready&&!o.move;
  const lotus=plants.find(o=>o.natKind==='lotus');
  const inWhip=see&&dist<=NATURE_WHIP.range&&Math.abs(i.ah-cH(p))<2.75;
  const swing=p.natureWhip,following=swing&&!swing.second&&!swing.cancelled&&G.time-swing.start<=NATURE_WHIP.window;
  i.fire=inWhip?1:0;

  // Finish an aimed double whip before spending another input on a different target.
  if(following&&inWhip)return;
  const close=see&&dist<=180&&Math.abs(i.ah-cH(p))<2.75;
  const fresh=t0=>G.time>=(p.natureShieldHits?.get(t0)||0);
  const pack=close&&foesOf(p.team).some(q=>q!==t&&fresh(q)&&natureDist(p,q)<=180&&Math.abs(cH(q)-cH(p))<2.8
    &&natureSight(p,q,cH(p),cH(q)));
  if(close&&fresh(t)&&p.shieldBroken<=0&&p.shieldE>30&&(pack||hp<.43||(p.natureSpores?.length||0)>=2)){
    i.sh=1;i.fire=0;return;
  }

  const here=turrets.filter(o=>usable(o)&&natureDist(p,o)<NAT.hookRange);
  const injured=team.some(q=>natureDist(p,q)<250&&q.hp/q.maxHp<.68);
  if(p.ult>=100&&p.sil<=0&&!plants.some(o=>o.natKind==='tree')&&dist<490&&(hp<.73||injured||here.length>=2)){
    botClassGround(i,p.x-ux*60,p.y-uy*60);press('x');return;
  }
  if(ready('vinelash')&&plants.some(o=>o.natKind!=='tree'&&usable(o)&&o.end>G.time+2
    &&(o.hp<o.maxHp*.66||see&&dist<380&&natureDist(o,t)>405))){
    cast('vinelash');return;
  }
  if(ready('poisondart')&&dist<490&&see&&turrets.filter(o=>natureDist(o,t)<400).length<2){
    const f=dist<130?-65:105,s=p.ai?.ps.sd||1;
    const x=p.x+ux*f-uy*74*s,y=p.y+uy*f+ux*74*s;
    if(botClassLane(p,x,y)){botClassGround(i,x,y);cast('poisondart');return;}
  }
  if(ready('bloom')&&!lotus&&dist<470&&(here.length||injured||inWhip)){
    const o=here[0],x=o?lerp(p.x,o.x,.44):p.x-ux*37,y=o?lerp(p.y,o.y,.44):p.y-uy*37;
    botClassGround(i,x,y);cast('bloom');return;
  }
  if(lotus&&slot('bloom')&&p.sil<=0&&usable(lotus)&&lotus.end>G.time+1&&G.time>=(lotus.switchAt||0)){
    const healing=team.some(q=>q.hp<q.maxHp*(lotus.mode?.70:.87)&&natureDist(lotus,q)<=NAT.lotusRange
      &&natureSight(lotus,q,natureHead(lotus),cH(q)));
    const feeds=turrets.some(o=>usable(o)&&natureDist(lotus,o)<=NAT.lotusRange&&natureDist(o,t)<400
      &&natureSight(lotus,o,natureHead(lotus),natureHead(o)));
    if(lotus.mode?healing||!feeds:feeds&&!healing){cast('bloom');return;}
  }
  if(ready('sporecloud')&&see&&dist<NAT.seedRange+70&&Math.abs(i.ah-p.z)<3.3&&!t.natureSlow){
    const q=botClassTarget(p,t,.48);
    botClassGround(i,q.x,q.y);cast('sporecloud');return;
  }
  if(ready('thornburst')&&see&&dist>135&&dist<395&&hp<.55&&!G.walls.some(w=>w.wood&&w.owner===p.id)){
    const away=Math.min(dist*.54,155);
    botClassGround(i,p.x+ux*away,p.y+uy*away);cast('thornburst');return;
  }
  if(p.cd.dodge<=0&&!p.shk&&!p.root&&!p.ai?.blk){
    const safe=o=>natureDist(o,p)>42&&botInZone(p.ai?.zone,o.x,o.y,-30)
      &&Math.hypot(natureDist(p,o),(terrT(o.x,o.y)+cH(o)-terrT(p.x,p.y)-p.z-1.35)*20)<=NAT.hookRange
      &&natureSight(p,o,p.z+1.35,cH(o));
    const ally=team.filter(q=>q!==p&&q.hp<q.maxHp*.67&&(!see||natureDist(q,t)>dist+45)&&safe(q))
      .sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
    const turret=here.find(o=>!o.bigPea&&o.end>G.time+1&&natureDist(o,t)<380&&safe(o)
      &&natureSight(o,t,natureHead(o),cH(t))&&(hp>.45||natureDist(o,t)>dist));
    const enemy=!t.natKind&&see&&dist>190&&hp>.65&&!turrets.some(o=>o.ready>G.time)&&safe(t)?t:null;
    const hook=ally||turret||enemy;
    if(hook){botClassAim(p,hook);i.fire=0;press('sp');return;}
  }
  if(hp<.68&&lotus&&!lotus.mode&&natureDist(p,lotus)>NAT.lotusRange*.72&&natureDist(lotus,t)>dist-20){
    const d=natureDist(p,lotus)||1;i.mx=(lotus.x-p.x)/d;i.my=(lotus.y-p.y)/d;
  }
}
// ท่าต่อเนื่อง (หลังสมองหลักตัดสินใจแล้ว): เขียนทับ p.inp ตามสถานะของสกิลที่กำลังทำอยู่
function botCombo(p,dt,tg){
  if(!tg||!p.alive||p.downed)return;
  const M=botMem(p),inp=p.inp,d=Math.hypot(tg.x-p.x,tg.y-p.y),press=k=>{inp.c[k]=(inp.c[k]|0)+1;};
  M.clk^=1;const click=()=>{inp.fire=M.clk;};   // ท่าที่ต้อง "คลิกใหม่" (ปล่อยแล้วกด) — กดสลับทุกเฟรม
  // กระโดด/พุ่งหนี: ทิศตรงข้ามเป้า
  if(M.away>0){M.away-=dt;const a=Math.atan2(p.y-tg.y,p.x-tg.x)+Math.sin(G.time*3)*0.5;inp.mx=Math.cos(a);inp.my=Math.sin(a);
    if(p.kitIds.includes('windrift')&&p.wdr&&p.wdr.ph==='chg'){inp.ax=p.x+Math.cos(a)*300;inp.ay=p.y+Math.sin(a)*300;}}
  // ไฟ: ดิ่ง Dragonfall ใส่เป้า (บินเล็งตามสักพักก่อน)
  if(p.dfall){inp.ax=tg.x;inp.ay=tg.y;if(p.dfall.ph===2){M.df=(M.df||0)+dt;if(M.df>0.7)click();else inp.fire=0;}}else M.df=0;
  // สายฟ้า: ลูกสายฟ้าโดม = คลิกยิงลงเป้า
  if(p.sdome){inp.ax=tg.x;inp.ay=tg.y;if(p.sdome.ph===2){
    M.sd=(M.sd||0)+dt;
    if(p.sdome.god?M.sd>0.8:stormDomeCharge(p.sdome.t)>=1)click();else inp.fire=0;
  }}else M.sd=0;
  // ดิน: Wrath บนฟ้า = ปาเสาใส่เป้าเรื่อย ๆ
  if(p.wr&&p.wr.ph==='aim'){inp.ax=tg.x;inp.ay=tg.y;click();}
  // ดิน: เป้าอยู่ระหว่างกำแพงหินคู่ = กดซ้ำบีบ (Crush)
  if(p.tec&&p.tec.ok&&!p.crush){const T=p.tec,c=Math.cos(T.a),s=Math.sin(T.a),rx=tg.x-(T.cx-c*210),ry=tg.y-(T.cy-s*210),al=rx*c+ry*s,lat=Math.abs(-rx*s+ry*c);
    const i=p.kitIds.indexOf('tectoniccrush');if(i>=0&&al>50&&al<370&&lat<105&&p.cd[SLOTK[i]]>0)press(SLOTK[i]);}
  // ลม: เลือกวิธีวางกำแพง — วางหลังเป้า (คลิกขวา ตรงจุด) หรือดันพุ่งใส่เป้า (คลิกซ้าย)
  if(p.wwAim){const a=Math.atan2(tg.y-p.y,tg.x-p.x);inp.ax=tg.x;inp.ay=tg.y;
    if(M.wall==='place'){inp.gx=tg.x+Math.cos(a)*110;inp.gy=tg.y+Math.sin(a)*110;inp.fire=0;inp.sh=M.clk;}
    else{inp.sh=0;click();}}
  // น้ำแข็ง: ไกล = สลับไปโหมดไกล (V) • เข้าใกล้ = กลับมาถือดาบ
  if(p.pathIdx===1&&!(p.fmCd>0)&&!(p.ffT>0)&&!(p.mirror>0)&&!(p.cryo>0)){M.v-=dt;
    if(M.v<=0&&(p.fmode!==1&&d>700||p.fmode===1&&d<380)){press('v');M.v=2.5;}}
}
