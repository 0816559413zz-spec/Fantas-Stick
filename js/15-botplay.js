// =====================================================================
//  วิธีเล่นของบอทแต่ละสาย (ผู้ใช้ 2026-10-31 "บอทไม่รู้วิธีเล่นสายของตัวเอง")
//  botBrain (js/41) ถามที่นี่ก่อนกดสกิล: botWant = จะกดสกิลนี้ตอนนี้ไหม (true/false • undefined = ใช้ตารางระยะเดิม)
//  botCombo = ท่าต่อเนื่องหลังกด (คลิกดิ่ง / ยืนยัน / กดซ้ำบีบกำแพง / สลับดาบ-ไกล / ทิศกระโดดหนี) — เรียกท้าย aiBot (หลังเช็คจังหวะเว้นสกิล)
//  BOT_RANGE = ระยะที่ชอบยืนต่อสาย [ใกล้สุด, ไกลสุด] — ตัวเลขตั้งต้น ให้ทีมเกมเพลย์ปรับ
// =====================================================================
const BOT_RANGE={0:[340,580],1:[0,95],2:[0,240],6:[300,520],7:[220,420]};
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
    case 'speedsiphon':return st>=(botSave(p)?3:1)&&d<190;
    case 'stormorbs':return st>=(botSave(p)?3:1)&&!p.sorb&&d<450;
    case 'triplestrike':return st>=2&&d<600&&(stuck||st>=4);
    case 'railgun':return st>=2&&d>280&&d<850&&(stuck||hp>0.6);
    case 'stormdome':return st>=3&&d<560;
    // ---- ดิน: ผลักศัตรูชนของแข็ง • โคลน → กำแพงหนีบ ----
    case 'stonebreaker':return d<650&&(botWallBehind(p,tg,260)||d<360);
    case 'mudswamp':return d<580;
    case 'tectoniccrush':return d>110&&d<330&&(tg.mudT>0||stuck||Math.random()<0.3);
    case 'dustburst':return d<480;
    // ---- ลม: วางกำแพงหลังเป้า แล้วผลัก/ดูดใส่กำแพง ----
    case 'aegisgale':
      if(p.wwAim)return false;
      if(d>230&&d<500&&!botWallBehind(p,tg,200)){M.wall='place';return true;}
      if(d<360){M.wall='push';return true;}
      return false;
    case 'windrift':if(hp<0.35&&d<300){M.away=0.4;return true;}return d<260&&botWallBehind(p,tg,300);
    case 'vortexbind':return d<320&&!(p.z>groundH(p.x,p.y,p.z)+0.4);
    case 'voidspheres':return d<380&&(botWallBehind(p,tg,320)||stuck);
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
  if(p.sdome){inp.ax=tg.x;inp.ay=tg.y;if(p.sdome.ph===2){M.sd=(M.sd||0)+dt;if(M.sd>0.8)click();else inp.fire=0;}}else M.sd=0;
  // ดิน: Wrath บนฟ้า = ปาเสาใส่เป้าเรื่อย ๆ
  if(p.wr&&p.wr.ph==='sky'){inp.ax=tg.x;inp.ay=tg.y;click();}
  // ดิน: เป้าอยู่ระหว่างกำแพงหินคู่ = กดซ้ำบีบ (Crush)
  if(p.tec&&p.tec.ok&&!p.crush){const T=p.tec,c=Math.cos(T.a),s=Math.sin(T.a),rx=tg.x-(T.cx-c*210),ry=tg.y-(T.cy-s*210),al=rx*c+ry*s,lat=Math.abs(-rx*s+ry*c);
    const i=p.kitIds.indexOf('tectoniccrush');if(i>=0&&al>50&&al<370&&lat<105&&p.cd[SLOTK[i]]>0)press(SLOTK[i]);}
  // ลม: เลือกวิธีวางกำแพง — วางหลังเป้า (คลิกขวา ตรงจุด) หรือดันพุ่งใส่เป้า (คลิกซ้าย)
  if(p.wwAim){const a=Math.atan2(tg.y-p.y,tg.x-p.x);inp.ax=tg.x;inp.ay=tg.y;
    if(M.wall==='place'){inp.gx=tg.x+Math.cos(a)*110;inp.gy=tg.y+Math.sin(a)*110;inp.fire=0;inp.sh=M.clk;}
    else{inp.sh=0;click();}}
  else if(p.pathIdx===7&&inp.gx!==undefined&&!inp.sh){delete inp.gx;delete inp.gy;}
  // น้ำแข็ง: ไกล = สลับไปโหมดไกล (V) • เข้าใกล้ = กลับมาถือดาบ
  if(p.pathIdx===1&&!(p.fmCd>0)&&!(p.ffT>0)&&!(p.mirror>0)&&!(p.cryo>0)){M.v-=dt;
    if(M.v<=0&&(p.fmode!==1&&d>700||p.fmode===1&&d<380)){press('v');M.v=2.5;}}
}
