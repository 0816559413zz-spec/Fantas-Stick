// ---------- HUD ----------
function rr(x,y,w,h,r){cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath();}
const SLOTS=[['คลิกซ้าย','✨','ยิง',0],['คลิกขวา','🛡️','โล่',-1],['Q','🔥','ลูกไฟ',1],['E','⚡','สตัน',2],['R','💨','ผลัก',3],['F','🌀','ดึง',4],['Shift','💫','หลบ',5],['X','🌟','เวทโบราณ',-2],['B','🧹','ไม้กวาด',-3]];
function fmtTime(s){return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
// ---------- ชิ้นส่วน HUD ธีมทอง-น้ำเงิน ----------
let HG='#d9b45a',HG2='#f3dc94';const HN='rgba(7,11,24,0.84)';
// สถานะความรู้สึกของ HUD ฝั่งจอเรา (ไม่เกี่ยวกับเน็ต): แฟลชโดนตี / แถบเลือดค้าง / ช่องคาถาเพิ่งพร้อม / นับถอยหลัง / kill feed เลื่อนเข้า
const HUDF={t:0,dt:0,id:null,hp:0,hit:0,trail:1,trailHold:0,rdy:{},rdyT:{},ph:'',go:0,uFull:false,uT:-9,feed:new Map()};
function hudTick(){const n=performance.now();HUDF.dt=HUDF.t?Math.min(0.1,(n-HUDF.t)/1000):0;HUDF.t=n;return n;}
// วงเพชรขยายออกตอนช่องคาถาเพิ่งคูลดาวน์เสร็จ (k = 0→1)
function readyPulse(x,y,r,k){cx.save();cx.globalAlpha=1-k;cx.strokeStyle=HG2;cx.lineWidth=3*(1-k)+1;cx.shadowColor=HG2;cx.shadowBlur=12;diaPath(x,y,r+3+k*16);cx.stroke();
  cx.globalCompositeOperation='lighter';cx.globalAlpha=0.45*(1-k);diaPath(x,y,r);cx.fillStyle='#f3dc94';cx.fill();cx.restore();}
function diaPath(x,y,r){cx.beginPath();cx.moveTo(x,y-r);cx.lineTo(x+r,y);cx.lineTo(x,y+r);cx.lineTo(x-r,y);cx.closePath();}
// แผ่นป้ายกรอบทอง มีเพชรเล็กสองข้าง
function plate(x,y,w,h,hl){
  cx.fillStyle=HN;cx.fillRect(x,y,w,h);
  cx.strokeStyle=hl?HG2:'rgba(217,180,90,0.55)';cx.lineWidth=1;cx.strokeRect(x+0.5,y+0.5,w-1,h-1);
  for(const sx of [x,x+w]){diaPath(sx,y+h/2,4.5);cx.fillStyle='#05070f';cx.fill();cx.strokeStyle=HG;cx.stroke();}
}
// กล่องใหญ่มีมุมทอง (ตารางคะแนน)
function frameBox(x,y,w,h){
  const g=cx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'rgba(15,23,46,0.95)');g.addColorStop(1,'rgba(6,10,22,0.96)');
  cx.fillStyle=g;cx.fillRect(x,y,w,h);
  cx.strokeStyle='rgba(217,180,90,0.32)';cx.lineWidth=1;cx.strokeRect(x+0.5,y+0.5,w-1,h-1);
  cx.fillStyle=HG;const k=20;
  for(const [px,py,sx,sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]){cx.fillRect(sx>0?px:px-k,sy>0?py:py-2,k,2);cx.fillRect(sx>0?px:px-2,sy>0?py:py-k,2,k);}
}
// หลอดเลือดบอสด้านบนกลางจอ (มีแถบดาเมจค้างสีขาว)
let bossTrail={id:null,v:1};
function drawBossBar(e){
  const w=Math.min(560,SW-120),x=SW/2-w/2,y=96,r=clamp(e.hp/e.mh,0,1),name=EDEF[e.t].name;
  if(bossTrail.id!==e.id)bossTrail={id:e.id,v:r};
  bossTrail.v=Math.max(r,bossTrail.v-0.004);
  cx.textAlign='center';cx.font='600 17px Kanit,sans-serif';
  const nw=cx.measureText(name).width;
  plate(SW/2-nw/2-22,y-34,nw+44,26);
  cx.fillStyle=HG2;cx.fillText(name,SW/2,y-15);
  cx.strokeStyle='rgba(217,180,90,0.6)';cx.lineWidth=1;
  for(const s of [-1,1]){cx.beginPath();cx.moveTo(SW/2+s*(nw/2+30),y-21);cx.lineTo(SW/2+s*(nw/2+130),y-21);cx.stroke();}
  cx.fillStyle='rgba(5,7,15,0.85)';cx.fillRect(x,y,w,10);
  cx.fillStyle='rgba(255,226,190,0.6)';cx.fillRect(x,y,w*bossTrail.v,10);
  const g=cx.createLinearGradient(0,y,0,y+10);g.addColorStop(0,'#ff5d6c');g.addColorStop(1,'#9e1229');
  cx.fillStyle=g;cx.fillRect(x,y,w*r,10);
  {const h=cx.createLinearGradient(0,y,0,y+10);h.addColorStop(0,'rgba(255,255,255,0.3)');h.addColorStop(0.5,'rgba(255,255,255,0)');cx.fillStyle=h;cx.fillRect(x,y,w*r,10);}   // เงาแก้ว + ขีดทุก 10%
  cx.fillStyle='rgba(5,7,15,0.55)';for(let i=1;i<10;i++)cx.fillRect(Math.round(x+w*i/10),y+(i===5?0:3),1,i===5?10:7);
  cx.strokeStyle=HG;cx.strokeRect(x-0.5,y-0.5,w+1,11);
  for(const sx of [x-1,x+w+1]){diaPath(sx,y+5,6);cx.fillStyle='#05070f';cx.fill();cx.strokeStyle=HG;cx.stroke();}
}
// ช่องคาถารูปเพชร (แบบ Hogwarts Legacy) — st: {ratio,txt,ready,hl,dim}
function spellDia(x,y,r,ic,key,name,st){
  diaPath(x,y,r);
  if(st.hl){const g=cx.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,'rgba(140,105,30,0.95)');g.addColorStop(1,'rgba(40,28,6,0.95)');cx.fillStyle=g;}
  else cx.fillStyle=st.ready?'rgba(16,24,48,0.92)':'rgba(7,10,22,0.88)';
  cx.fill();
  if(st.hl){cx.save();cx.shadowColor=HG2;cx.shadowBlur=14;}
  cx.strokeStyle=st.ready?HG:'rgba(217,180,90,0.35)';cx.lineWidth=st.hl?2.5:1.5;diaPath(x,y,r);cx.stroke();
  if(st.hl)cx.restore();
  diaPath(x,y,r-5);cx.strokeStyle='rgba(217,180,90,0.16)';cx.lineWidth=1;cx.stroke();
  cx.globalAlpha=st.ready&&!st.dim?1:0.45;
  if(ic&&typeof ic==='object'){const im=icoTint(ic.id,ic.c,72);if(im){const z=r*1.25;cx.drawImage(im,x-z/2,y-z/2,z,z);}}
  else{cx.font=`${Math.round(r*0.78)}px sans-serif`;cx.textAlign='center';cx.fillStyle='#fff';cx.fillText(ic,x,y+r*0.28);}
  cx.globalAlpha=1;
  if(st.ratio>0){
    cx.save();diaPath(x,y,r);cx.clip();
    cx.fillStyle='rgba(0,0,0,0.62)';cx.beginPath();cx.moveTo(x,y);cx.arc(x,y,r*1.5,-Math.PI/2,-Math.PI/2+Math.PI*2*st.ratio);cx.closePath();cx.fill();cx.restore();
  }
  if(st.bar>0){const R=r+5,k=Math.min(1,st.bar),P=[[0,-R],[R,0],[0,R],[-R,0],[0,-R]];   // เวลาที่เหลือ (เช่น Tectonic รอหนีบ) = เส้นบางวิ่งรอบขอบช่อง เริ่มจากมุมบน หมุนตามเข็ม
    cx.lineWidth=2;cx.strokeStyle='rgba(255,194,122,0.18)';diaPath(x,y,R);cx.stroke();
    cx.save();cx.lineWidth=3;cx.lineCap='round';cx.lineJoin='round';cx.strokeStyle='#ffc27a';cx.shadowColor='#ff9a4a';cx.shadowBlur=6;cx.beginPath();cx.moveTo(x,y-R);
    let q=k*4;for(let i=0;i<4&&q>0;i++){const f=Math.min(1,q);q-=1;cx.lineTo(x+P[i][0]+(P[i+1][0]-P[i][0])*f,y+P[i][1]+(P[i+1][1]-P[i][1])*f);}cx.stroke();cx.restore();}
  if(st.txt){const fs=Math.max(14,Math.round(r*0.6));cx.font=`700 ${fs}px Kanit,sans-serif`;cx.lineJoin='round';cx.lineWidth=4;cx.strokeStyle='rgba(0,0,0,0.85)';cx.strokeText(st.txt,x,y+fs*0.36);cx.fillStyle='#fff';cx.fillText(st.txt,x,y+fs*0.36);}
  cx.font='600 10px Kanit,sans-serif';
  const kw=Math.max(18,cx.measureText(key).width+10),ky=y+r-4;
  cx.fillStyle='#05070f';cx.fillRect(x-kw/2,ky,kw,15);cx.strokeStyle=st.ready?HG:'rgba(217,180,90,0.4)';cx.lineWidth=1;cx.strokeRect(x-kw/2+0.5,ky+0.5,kw-1,14);
  cx.fillStyle=HG2;cx.fillText(key,x,ky+11);
  if(name){cx.font='11px Kanit,sans-serif';cx.fillStyle='rgba(0,0,0,0.7)';cx.fillText(name,x+1,ky+28);cx.fillStyle='#c3cadb';cx.fillText(name,x,ky+27);}
}
// แถบบางๆ แบบ Elden Ring
function thinBar(x,y,w,h,ratio,c1,c2){
  cx.fillStyle='rgba(5,7,15,0.82)';cx.fillRect(x,y,w,h);
  if(ratio>0){const g=cx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,c1);g.addColorStop(1,c2);cx.fillStyle=g;cx.fillRect(x,y,w*clamp(ratio,0,1),h);}
  cx.strokeStyle='rgba(217,180,90,0.7)';cx.lineWidth=1;cx.strokeRect(x-0.5,y-0.5,w+1,h+1);
}
function drawHUD(v,me,P){
  cx.textAlign='center';cx.textBaseline='alphabetic';
  if(me&&(me.fm&4096)){const g=cx.createRadialGradient(SW/2,SH/2,SH*0.12,SW/2,SH/2,SH*0.75);g.addColorStop(0,'rgba(10,4,20,0.55)');g.addColorStop(1,'rgba(4,0,10,0.96)');cx.fillStyle=g;cx.fillRect(0,0,SW,SH);}
  const now=hudTick(),dt=HUDF.dt;hud4Col(me);   // สีทอง → สีธาตุของเรา (js/66)
  // ขอบจอแดง: เลือดต่ำกว่า 35% = เต้นตามชีพจร (ต่ำกว่า 15% เต้นเร็ว) + แฟลชสั้นๆ ตอนโดนตี
  if(me&&me.al&&!me.dn){const hr=me.hp/me.mh;
    if(HUDF.id===me.id&&me.hp<HUDF.hp)HUDF.hit=Math.min(1,HUDF.hit+0.3+(HUDF.hp-me.hp)/me.mh*3);
    const low=hr<0.35?(0.35-hr)/0.35*(0.72+0.28*Math.sin(now/(hr<0.15?130:230))):0,a=Math.min(0.85,low*0.95+HUDF.hit*0.45);
    if(a>0.01){const g=cx.createRadialGradient(SW/2,SH/2,SH*(0.42-low*0.1),SW/2,SH/2,Math.hypot(SW,SH)*0.55);g.addColorStop(0,'rgba(120,0,12,0)');g.addColorStop(0.7,`rgba(130,6,18,${a*0.55})`);g.addColorStop(1,`rgba(165,10,24,${a})`);cx.fillStyle=g;cx.fillRect(0,0,SW,SH);}}
  HUDF.hit=Math.max(0,HUDF.hit-dt*2.2);if(me){HUDF.id=me.id;HUDF.hp=me.hp;}
  // แถบบน
  let top='';const M=v.M||{};
  if(v.mode==='coop')top=`🗝️ ดันเจียนชั้น ${v.wave}   •   ศัตรูเหลือ ${v.el}`;
  else if(v.mode==='train')top='🎯 ห้องฝึก   •   ลองทุกคาถากับหุ่นซ้อม';
  else if(v.mode==='duel')top=`รอบ ${v.round}   •   `+P.map(p=>`${p.n} ${v.rw[p.id]||0}`).join('  :  ');
  else if(v.mode==='ffa')top=v.ot?`FFA   •   ⏱ ต่อเวลา!   •   ใครฆ่าก่อนชนะ`:`FFA   •   ⏱ ${fmtTime(v.tm)}   •   ใครได้ ${FFA.TARGET} kill ก่อนชนะ`;
  else if(v.mode==='quid')top=`🏟️ ${TEAMN[0]} ${(M.qs||[0,0])[0]}   —   ${(M.qs||[0,0])[1]} ${TEAMN[1]}   •   ⏱ ${fmtTime(v.tm)}${M.sn?'   •   ✨ ลูกบอลทองโผล่แล้ว!':''}`;
  else if(v.mode==='race'&&me){const rk=raceRankClient(P).findIndex(p=>p.id===me.id)+1;top=me.fin?`🏁 เข้าเส้นชัยอันดับ ${me.fin}!`:`🏁 รอบ ${Math.min(me.lap+1,M.laps||2)}/${M.laps||2}   •   ห่วง ${me.cp+1}/${(M.rings||[]).length}   •   อันดับ ${rk}/${P.length}   •   ⏱ ${(M.rt||0).toFixed(1)}`+(M.re>=0?`   •   เหลือ ${M.re} วิ`:'');}
  else if(v.mode==='br')top=`🌀 เหลือ ${M.al||0} คน   •   `+(M.zone&&!M.zone.sh?`วงเริ่มหดใน ${M.zone.tl} วิ`:'วงกำลังหด!');
  else if(v.mode==='siege')top=sgTop(v);
  else if(v.mode==='imp'){const r=ROLE?(ROLE.role==='imp'?'🐍 คุณคือ'+ROLE.title:'⚡ คุณคือนักเรียน'):'';top=`${r}   •   ภารกิจ ${M.td||0}/${M.tt||0}`;}
  else top=`${TEAMN[0]} ${v.ts[0]}   —   ${v.ts[1]} ${TEAMN[1]}   •   ⏱ ${fmtTime(v.tm)}`;
  cx.font='600 16px Kanit,sans-serif';
  const tw=cx.measureText(top).width+56;
  plate(SW/2-tw/2,12,tw,34);
  cx.fillStyle='#efe6cf';cx.fillText(top,SW/2,35);
  // หลอดเลือดบอส
  const boss=v.E.find(e=>EDEF[e.t]&&EDEF[e.t].boss&&e.hp>0);
  if(boss)drawBossBar(boss);

  // kill feed
  // (ข้อความใหม่เลื่อนเข้าจากขวา • ข้อความที่มีชื่อเรา = ตัวทอง) • ห้องฝึก: เลื่อนลงให้พ้นปุ่ม "จบการฝึก" ใต้แผนที่ย่อ
  cx.textAlign='right';cx.font='14px Kanit,sans-serif';
  {const F=HUDF.feed,y0=58+(v.mode==='train'?46:0);for(const k of [...F.keys()])if(!v.feed.includes(k))F.delete(k);
  v.feed.forEach((f,i)=>{if(!F.has(f))F.set(f,now);const k=Math.min(1,(now-F.get(f))/220),e=1-Math.pow(1-k,3),w=cx.measureText(f).width+30,y=y0+i*28,ox=(1-e)*60,mine=me&&f.includes(me.n);
    cx.globalAlpha=e;const g=cx.createLinearGradient(SW-12-w,0,SW-12,0);g.addColorStop(0,'rgba(7,11,24,0)');g.addColorStop(0.18,HN);g.addColorStop(1,mine?'rgba(60,44,12,0.9)':HN);
    cx.fillStyle=g;cx.fillRect(SW-12-w+ox,y,w,24);cx.fillStyle=mine?HG2:HG;cx.fillRect(SW-14+ox,y,2,24);
    if(k<1){cx.fillStyle=`rgba(243,220,148,${0.35*(1-k)})`;cx.fillRect(SW-12-w+ox,y,w,24);}
    cx.fillStyle=mine?HG2:'#efe6cf';cx.fillText(f,SW-24+ox,y+17);cx.globalAlpha=1;});}

  // ข้อความกลางจอ
  cx.textAlign='center';
  const big=(t,y,size,col)=>{cx.font=`600 ${size}px Kanit,sans-serif`;const mw=cx.measureText(t).width;if(mw>SW-40){size=Math.max(11,Math.floor(size*(SW-40)/mw));cx.font=`600 ${size}px Kanit,sans-serif`;}cx.fillStyle='rgba(0,0,0,0.6)';cx.fillText(t,SW/2+2,y+2);cx.fillStyle=col;cx.fillText(t,SW/2,y);};
  if(v.ban){
    big(v.ban,SH*0.28,34,HG2);
    const bw=Math.min(cx.measureText(v.ban).width,SW-40)/2;cx.strokeStyle='rgba(217,180,90,0.7)';cx.lineWidth=1;
    for(const sd of [-1,1]){cx.beginPath();cx.moveTo(SW/2+sd*(bw+14),SH*0.28-11);cx.lineTo(SW/2+sd*(bw+90),SH*0.28-11);cx.stroke();diaPath(SW/2+sd*(bw+14),SH*0.28-11,4);cx.fillStyle=HG;cx.fill();}
  }
  // นับถอยหลัง 3-2-1: ตัวเลขกระแทกลงจากใหญ่ → ปกติ + วงคลื่นทองขยายออก แล้วจางตอนท้าย • จบนับ = "เริ่ม!" แว้บหนึ่ง
  if(v.ph==='count'){
    const ni=Math.max(1,Math.ceil(v.cd)),n=String(ni),f=clamp(ni-v.cd,0,1),cy=SH*0.44-40,s=1+0.75*Math.pow(1-Math.min(1,f/0.16),2),al=f>0.8?1-(f-0.8)/0.2*0.7:Math.min(1,f/0.06+0.2);
    cx.save();cx.globalAlpha=0.55*(1-f);cx.strokeStyle=HG2;cx.lineWidth=3*(1-f)+0.5;cx.beginPath();cx.arc(SW/2,cy,50+f*170,0,Math.PI*2);cx.stroke();
    cx.globalAlpha=0.3*(1-f);cx.lineWidth=1;cx.beginPath();cx.arc(SW/2,cy,40+f*120,0,Math.PI*2);cx.stroke();
    diaPath(SW/2,cy,70+f*40);cx.globalAlpha=0.25*(1-f);cx.stroke();cx.restore();
    cx.save();cx.translate(SW/2,cy);cx.scale(s,s);cx.globalAlpha=al;cx.font='800 110px Cinzel,serif';
    cx.fillStyle='rgba(0,0,0,0.55)';cx.fillText(n,3,43);
    cx.shadowColor='rgba(255,200,90,0.8)';cx.shadowBlur=18+30*(1-Math.min(1,f/0.3));
    const g=cx.createLinearGradient(0,-50,0,40);g.addColorStop(0,'#fff4cc');g.addColorStop(0.6,'#e2bd66');g.addColorStop(1,'#94692a');cx.fillStyle=g;cx.fillText(n,0,40);cx.restore();
  }
  if(HUDF.ph==='count'&&v.ph==='play')HUDF.go=now;HUDF.ph=v.ph;
  if(now-HUDF.go<850&&v.ph==='play'){const k=(now-HUDF.go)/850,cy=SH*0.44-40,s=0.8+0.5*Math.pow(k,0.5);
    cx.save();cx.globalAlpha=k<0.15?k/0.15:1-Math.pow((k-0.15)/0.85,2);cx.translate(SW/2,cy);cx.scale(s,s);cx.font='800 76px Cinzel,Kanit,serif';
    cx.shadowColor='rgba(255,200,90,0.9)';cx.shadowBlur=26;cx.fillStyle=HG2;cx.fillText('เริ่ม!',0,26);cx.restore();
    cx.save();cx.globalAlpha=0.5*(1-k);cx.strokeStyle=HG2;cx.lineWidth=2;cx.beginPath();cx.arc(SW/2,cy,90+k*260,0,Math.PI*2);cx.stroke();cx.restore();}
  if(v.ph==='buff'){
    const waiting=P.filter(p=>!p.pk).map(p=>p.n);
    big(`พักระหว่างด่าน — เหลือ ${v.bt} วิ`,SH*0.36,24,'#efe9ff');
    if(me&&me.pk&&waiting.length)big('รอ '+waiting.join(', ')+' เลือกพลังเสริม',SH*0.36+34,18,'#a79cc0');
  }
  if(me&&!me.al&&v.ph==='play'&&['ffa','tdm','quid','race','train','siege'].includes(v.mode))big(`เกิดใหม่ใน ${me.rs}...`,SH*0.45,30,'#ff9a9a');
  if(me&&!me.al&&v.mode==='br')big('💀 คุณตกรอบแล้ว — ดูคนอื่นสู้ต่อ',SH*0.45,26,'#ff9a9a');
  drawModeHUD(v,me,P,big);
  if(me&&!me.al&&v.mode==='duel'&&v.ph==='play')big('คุณแพ้รอบนี้',SH*0.45,30,'#ff9a9a');
  if(me&&me.dn)big('คุณล้ม! รอเพื่อนมายืนข้างๆ เพื่อชุบ',SH*0.62,22,'#ff9a9a');
  if(me&&me.fl&&!showBoard)big(`🧹 บินอยู่ (สูง ${me.z.toFixed(0)} ม.)  •  W เร่ง  •  เมาส์ เลี้ยว/เงยขึ้น-ก้มลง  •  คลิก ยิงลำแสง${broomHud(me)}  •  B ลง`,SH-150,15,'#ffe9a8');
  if(me&&me.rt)big('🕸️ ติดใยแมงมุม! ขยับไม่ได้ชั่วคราว',SH*0.62,20,'#e8e8f0');

  if(me)drawBottom(me,v);
  if(me&&!showBoard&&SET.mini&&!h4PfMode(v))drawMinimap(v,me,P);   // FFA/TDM = รูปตัวละครแทน (js/66)
  if(showBoard)drawBoard(v,P);
}
function raceRankClient(P){
  return [...P].sort((a,b)=>{if(a.fin&&b.fin)return a.fin-b.fin;if(a.fin)return -1;if(b.fin)return 1;return (b.lap*100+b.cp)-(a.lap*100+a.cp);});
}
// HUD เฉพาะโหมด: ลูกศรไปห่วงถัดไป / เตือนนอกวง / แถบภารกิจ / บทบาท
function drawModeHUD(v,me,P,big){
  const M=v.M||{};
  if(!me)return;
  if(v.mode==='siege')sgHud(v,me,big);   // บุกปราสาท (js/28-fcs-build)
  if(v.mode==='quid'&&me.hb)big('🔴 ถือบอลอยู่! คลิกซ้าย = โยน (เล็งไปที่ห่วงฝั่งตรงข้าม)',SH-150,16,'#ff9a9a');
  else if(v.mode==='quid'&&!me.fl)big('กด B เพื่อขึ้นไม้กวาด',SH-150,16,'#ffe9a8');
  if(v.mode==='race'&&M.rings&&!me.fin){
    const r=M.rings[me.cp],s=toScreen(r[0],r[2],r[1]);
    const inView=s&&s[0]>40&&s[0]<SW-40&&s[1]>40&&s[1]<SH-40;
    if(inView){cx.strokeStyle='#ffd86b';cx.lineWidth=3;cx.beginPath();cx.arc(s[0],s[1],18+3*Math.sin(performance.now()/150),0,Math.PI*2);cx.stroke();}
    else{
      // ลูกศรชี้ไปทางห่วงถัดไป
      const a=Math.atan2(r[1]-me.y,r[0]-me.x)-yaw+Math.PI/2*0;
      const ang=a-Math.PI/2,R=Math.min(SW,SH)*0.32,ax=SW/2+Math.cos(ang)*R,ay=SH/2+Math.sin(ang)*R;
      cx.save();cx.translate(ax,ay);cx.rotate(ang+Math.PI/2);
      cx.fillStyle='#ffd86b';cx.beginPath();cx.moveTo(0,-16);cx.lineTo(12,10);cx.lineTo(-12,10);cx.closePath();cx.fill();cx.restore();
    }
    if(!me.fl)big('กด B เพื่อขึ้นไม้กวาด!',SH-150,18,'#ffe9a8');
  }
  if(v.mode==='br'&&M.zone&&me.al){
    const out=Math.hypot(me.x-M.zone.cx,me.y-M.zone.cy)>M.zone.r;
    if(out){cx.fillStyle=`rgba(140,60,255,${0.12+0.06*Math.sin(performance.now()/200)})`;cx.fillRect(0,0,SW,SH);big('⚠️ อยู่นอกวงเวท! กลับเข้าวงด่วน',SH*0.2,22,'#d0a0ff');}
  }
  if(v.mode==='imp'&&ROLE){
    // แถบภารกิจรวม
    const bw=Math.min(360,SW-40),bx=SW/2-bw/2,ratio=M.tt?M.td/M.tt:0;
    thinBar(bx,56,bw,8,ratio,'#8ff0a0','#2c8a45');
    if(me.tk>0)big(`📜 กำลังทำภารกิจ... ${me.tk.toFixed(1)} วิ (ห้ามเดินออก)`,SH*0.62,20,'#ffd86b');
    if(roleShowT>0){
      cx.fillStyle=`rgba(5,3,10,${Math.min(0.75,roleShowT)})`;cx.fillRect(0,0,SW,SH);
      big(ROLE.role==='imp'?'🐍 คุณคือ '+ROLE.title:'⚡ คุณคือ นักเรียนฮอกวอตส์',SH*0.4,48,ROLE.role==='imp'?'#5aff7a':'#7dd8ff');
      big(ROLE.role==='imp'?'ร่ายอวาดา เคดาฟราด้วย Q กำจัดนักเรียนโดยไม่ให้ใครจับได้ (แกล้งทำภารกิจได้)':'ทำภารกิจ (จุดลำแสงสีทอง) ให้ครบ และหาตัวโวลเดอมอร์ให้เจอ',SH*0.4+48,18,'#efe9ff');
      if(ROLE.role==='imp'&&ROLE.mates.length)big('พวกเดียวกัน: '+P.filter(p=>ROLE.mates.includes(p.id)).map(p=>p.n).join(', '),SH*0.4+80,16,'#ff9a9a');
    }
    if(me.gh)big('👻 คุณเป็นผีแล้ว — ยังช่วยทำภารกิจได้ แต่โหวตไม่ได้',SH-150,15,'#c8d8ff');
  }
}
// แผนที่ย่อมุมขวาบน (kill feed เลื่อนลงมาอยู่ใต้แผนที่): วงกลมหมุนตามมุมกล้อง (ด้านหน้า = ขึ้นบน) ตัวเราอยู่กลาง
const MM={r:82,view:620,col:{pillar:'#7d8499',stone:'#7d8499',rock:'#6e7482',tree:'#2f6b3f',crate:'#8a6a3e',hay:'#a8883e',hoop:'#e8c25a',house:'#9a8a78',stall:'#c0603a',lamp:'#ffd070',barrel:'#8a6a3e',well:'#6a7a94',table:'#8a6a3e',tfence:'#c8a060',tgate:'#f0d070'}};
function drawMinimap(v,me,P){
  if(!me)return;
  // แผนที่ย่อสี่เหลี่ยมมุมซ้ายล่าง (ผู้ใช้ 2026-10-28) — กรอบตาม h4MapBox (js/66) • R = ครึ่งความกว้าง
  const B=h4MapBox(),R=B.S/2,mx=B.x+R,my=B.y+R,sc=R/MM.view,cs=Math.cos(yaw),sn=Math.sin(yaw),M=v.M||{};
  // แปลงพิกัดโลก -> หน้าจอมินิแมป (clampEdge = ถ้าเกินกรอบให้ไปแปะที่ขอบ)
  const pt=(x,y,clampEdge)=>{
    const dx=x-me.x,dy=y-me.y;let u=(-sn*dx+cs*dy)*sc,f=(cs*dx+sn*dy)*sc;
    const d=Math.max(Math.abs(u),Math.abs(f));
    if(d>R-4){if(!clampEdge)return null;u*=(R-4)/d;f*=(R-4)/d;}
    return [mx+u,my-f];
  };
  cx.save();
  cx.beginPath();cx.rect(mx-R,my-R,R*2,R*2);cx.fillStyle='rgba(6,10,22,0.78)';cx.fill();
  cx.clip();
  // ขอบแผนที่
  {
    const raw=[[0,0],[MW,0],[MW,MH],[0,MH]].map(([x,y])=>{const dx=x-me.x,dy=y-me.y;return [mx+(-sn*dx+cs*dy)*sc,my-(cs*dx+sn*dy)*sc];});
    cx.beginPath();raw.forEach((q,i)=>i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1]));cx.closePath();
    cx.fillStyle='rgba(40,52,86,0.55)';cx.fill();cx.strokeStyle='rgba(217,180,90,0.5)';cx.lineWidth=1.5;cx.stroke();
  }
  // สิ่งกีดขวาง
  for(const o of OBS){
    if(Math.abs(o.x-me.x)>MM.view+o.r||Math.abs(o.y-me.y)>MM.view+o.r)continue;
    const q=pt(o.x,o.y,false);if(!q)continue;
    cx.beginPath();cx.arc(q[0],q[1],Math.max(1.6,o.r*sc),0,Math.PI*2);cx.fillStyle=MM.col[o.k]||'#7d8499';cx.fill();
  }
  if(PROPON)for(const o of PROPS){
    if(o.st===1||Math.abs(o.x-me.x)>MM.view||Math.abs(o.y-me.y)>MM.view)continue;
    const q=pt(o.x,o.y,false);if(!q)continue;const d=Math.max(2.2,o.r*sc*1.3);
    cx.fillStyle=o.st===0&&PROPDEF[o.k].use?'#ffd86b':PROPDEF[o.k].col;cx.fillRect(q[0]-d/2,q[1]-d/2,d,d);
  }
  // วงเวท Battle Royale
  if(M.zone){
    const dx=M.zone.cx-me.x,dy=M.zone.cy-me.y,raw=[mx+(-sn*dx+cs*dy)*sc,my-(cs*dx+sn*dy)*sc];
    cx.beginPath();cx.arc(raw[0],raw[1],M.zone.r*sc,0,Math.PI*2);cx.strokeStyle='#c08cff';cx.lineWidth=2;cx.stroke();
  }
  // ห่วงแข่ง: ห่วงถัดไปเรืองทอง
  if(v.mode==='race'&&M.rings&&!me.fin){
    M.rings.forEach((r,i)=>{const q=pt(r[0],r[1],i===me.cp);if(!q)return;cx.beginPath();cx.arc(q[0],q[1],i===me.cp?5:2.5,0,Math.PI*2);cx.fillStyle=i===me.cp?'#ffd86b':'rgba(255,216,107,0.4)';cx.fill();});
  }
  // ลูกบอล / ลูกบอลทอง
  if(M.ball){const q=pt(M.ball.x,M.ball.y,true);if(q){cx.beginPath();cx.arc(q[0],q[1],4,0,Math.PI*2);cx.fillStyle='#ff6a5a';cx.fill();cx.strokeStyle='#fff';cx.lineWidth=1;cx.stroke();}}
  if(M.sn){const q=pt(M.sn.x,M.sn.y,true);if(q){cx.beginPath();cx.arc(q[0],q[1],3.5,0,Math.PI*2);cx.fillStyle='#ffe27a';cx.fill();}}
  // ภารกิจ + ศพ (โหมดโวลเดอมอร์)
  if(v.mode==='imp'&&ROLE){
    const tp=taskPts();
    for(const t of ROLE.tasks){if(ROLE.tdone.includes(t))continue;const q=pt(tp[t].x,tp[t].y,true);if(q){diaPath(q[0],q[1],5);cx.fillStyle='#ffd86b';cx.fill();}}
  }
  for(const b of (M.bodies||[])){const q=pt(b[1],b[2],true);if(q){cx.strokeStyle='#ff5a5a';cx.lineWidth=2;cx.beginPath();cx.moveTo(q[0]-3,q[1]-3);cx.lineTo(q[0]+3,q[1]+3);cx.moveTo(q[0]+3,q[1]-3);cx.lineTo(q[0]-3,q[1]+3);cx.stroke();}}
  // ศัตรู
  for(const e of v.E){
    if(e.hp<=0)continue;const boss=EDEF[e.t]&&EDEF[e.t].boss,q=pt(e.x,e.y,boss);if(!q)continue;
    cx.beginPath();cx.arc(q[0],q[1],boss?5:2.6,0,Math.PI*2);cx.fillStyle='#ff4040';cx.fill();
  }
  // ผู้เล่นคนอื่น (โหมดทีมใช้สีทีม)
  const teamMode=v.mode==='tdm'||v.mode==='quid'||teamOn(v);
  for(const p of P){
    if(p.id===me.id||!p.al)continue;
    const q=pt(p.x,p.y,false);if(!q)continue;
    cx.beginPath();cx.arc(q[0],q[1],3.6,0,Math.PI*2);cx.fillStyle=teamMode?TEAMC[p.tm]:(p.c||'#ccc');cx.fill();cx.strokeStyle='rgba(0,0,0,0.7)';cx.lineWidth=1;cx.stroke();
  }
  // ตัวเรา: ลูกศรทองชี้ขึ้น
  cx.save();cx.translate(mx,my);
  cx.beginPath();cx.moveTo(0,-7);cx.lineTo(5.5,6);cx.lineTo(0,3);cx.lineTo(-5.5,6);cx.closePath();
  cx.fillStyle=HG2;cx.fill();cx.strokeStyle='#05070f';cx.lineWidth=1;cx.stroke();cx.restore();
  cx.restore();
  // กรอบ (DOM .h4Map วาดขอบ/มุม) • เงาขอบด้านในให้ดูลึก
  {const g=cx.createRadialGradient(mx,my,R*0.75,mx,my,R*1.42);g.addColorStop(0,'rgba(2,4,10,0)');g.addColorStop(1,'rgba(2,4,10,0.5)');cx.fillStyle=g;cx.fillRect(mx-R,my-R,R*2,R*2);}
  // เหนือของแผนที่ = ทิศ -y ของโลก
  const nk=(R-10)/Math.max(Math.abs(cs),Math.abs(sn)),nxp=mx-cs*nk,nyp=my+sn*nk;   // ตัว N เลื่อนตามขอบด้านในกรอบ
  diaPath(nxp,nyp,8);cx.fillStyle='#05070f';cx.fill();cx.strokeStyle=HG;cx.lineWidth=1;cx.stroke();
  cx.font='700 10px Cinzel,Kanit,serif';cx.textAlign='center';cx.fillStyle=HG2;cx.fillText('N',nxp,nyp+3.5);
}
function slotKey(s){const m={Q:'q',E:'e',R:'r',F:'f',Shift:'dash',X:'ult',B:'broom'}[s];return m&&KEYS[m]?keyName(KEYS[m]):s;}
function mySlots(me){
  const k=getKit(me.id),sp=k.ids.map(i=>SPELL_LIST[i]),P=PATHS[k.path],ult=SPELL_LIST[k.ult],nb=VIEW.cur&&NOBROOM.has(VIEW.cur.mode);
  const L=SLOTS.filter(s=>!(nb&&s[3]===-3)).map(s0=>{const s=[slotKey(s0[0]),...s0.slice(1)];return (s[3]>=1&&s[3]<=4?[s[0],{id:sp[s[3]-1].id,c:P.col},sp[s[3]-1].n,s[3]]:s[3]===-2?[s[0],{id:ult.id,c:P.col},ult.n,-2]:s[3]===0?[s[0],{id:'b_'+P.id+(P.id==='frost'&&me.fr&&me.fr[0]===0?'_m':''),c:P.col},PBASIC[k.path].n,0]:s[3]===-1&&hasIco('sh_'+P.id)?[s[0],{id:'sh_'+P.id,c:P.col},s[2],-1]:s[3]===5&&hasIco('dsh_'+P.id)?[s[0],{id:'dsh_'+P.id,c:P.col},s[2],5]:s);});
  // สายดิน: ช่อง BA ชาร์จ (กดค้างคลิกซ้าย) ต่อจากช่องยิง • Tectonic รอบหนีบได้ = ไอคอนบีบกำแพง
  if(P.id==='earth'){L.splice(1,0,['กดค้าง',{id:'cb_earth',c:P.col},'ทุบชาร์จ',-4]);
    if(me.ea&&me.ea[8])for(const s of L)if(s[1]&&s[1].id==='tectoniccrush')s[1]={id:'tectoniccrush_sq',c:'#ffc27a'};
    if(me.ea&&me.ea[0]>0)for(const s of L)if(s[1]&&s[1].id==='b_earth')s[1]={id:'p_earth',c:P.col};}   // Stand แตก: คลิกซ้าย = ยิงหินเล็ก
  return L;
}
const STATUS_ICO=[[1,'💫'],[2,'🔥'],[4,'❄️'],[8,'🧊'],[16,'⚡'],[32,'🌿'],[64,'🤐'],[128,'🛡️'],[256,'💨'],[512,'🔋'],[1024,'☠️'],[2048,'😱'],[4096,'🕶️'],[8192,'🎯'],[16384,'🌳'],[32768,'🔥'],[65536,'✨'],[131072,'🔆'],[262144,'☄️']];
const SLOTS_IMP=[['E','📜','ภารกิจ',-10],['R','📢','รายงานศพ',-11],['F','🔔','ประชุม',-12],['Q','💀','อวาดา',-13]];
const BR_LOCK={1:'fire',2:'stun',3:'push',4:'pull'};
// ตำแหน่งช่องคาถา: เพชร 4 ทิศ (Q ซ้าย / E บน / R ขวา / F ล่าง) + แถวเล็ก (ยิง / โล่ / หลบ / เวทโบราณ / ไม้กวาด)
const CLUSTER={1:[-1,0],2:[0,-1],3:[1,0],4:[0,1]};
const E_NEEDSTAND={stonebreaker:1,tectoniccrush:1};
function slotState(me,v,ci){
  const st={ratio:0,txt:'',ready:true,hl:false,dim:false};
  const locked=v&&v.mode==='br'&&BR_LOCK[ci]&&!(me.ul||'').split(',').includes(BR_LOCK[ci]);
  if(ci>=0){st.ratio=me.cd[ci]/me.cm[ci];if(me.cd[ci]>0){st.ready=false;st.txt=me.cd[ci]<1?me.cd[ci].toFixed(1):String(Math.ceil(me.cd[ci]));}}
  else if(ci===-1)st.ready=me.se>5;
  else if(ci===-3){st.ready=true;st.hl=!!me.fl;}
  else if(ci===-4){const A=me.ea||[],c=eSmooth('cb',A[10]|0);   // BA ชาร์จสายดิน: ชาร์จอยู่ = เรือง • คูลดาวน์ 6 วิ (ค่าปัดขึ้นจาก snapshot → นับถอยเองให้ลื่น)
    if(A[9]>0)st.hl=true;else if(A[0]>0){st.ready=false;st.ratio=1;}else if(c>0){st.ready=false;st.ratio=c/6;st.txt=c<1?c.toFixed(1):String(Math.ceil(c));}}
  else{st.ready=me.u>=100;st.hl=st.ready;if(!st.ready){st.ratio=1-me.u/100;st.txt=me.u+'%';}}
  const flyOk=v&&(v.mode==='quid'||v.mode==='race');
  if(me.fl&&ci!==-3&&!flyOk){st.dim=true;st.txt=st.txt||'🚫';}
  if(ci>=1&&ci<=4&&me.fr&&me.fr[0]===1){const S=SPELL_LIST[getKit(me.id).ids[ci-1]];if(S&&S.melee){st.ratio=1;st.txt='🔒';st.ready=false;st.hl=false;}}
  // Tectonic Crush: กำแพงตั้งอยู่ กดซ้ำหนีบได้ → ช่องใช้ได้ + ไอคอนส้ม + เส้นบางรอบขอบ = เวลาที่ยังหนีบได้ (= คูลดาวน์ที่เหลือ)
  if(ci>=1&&ci<=4&&me.ea&&me.ea[8]&&!st.dim){const S=SPELL_LIST[getKit(me.id).ids[ci-1]];if(S&&S.id==='tectoniccrush'){st.ready=true;st.hl=false;st.ratio=0;st.txt='';st.bar=me.cd[ci]/me.cm[ci];}}
  // สายดิน Stand แตก: สกิลที่ต้องมี Stand (Stonebreaker / Tectonic Crush) ล็อคจนกว่า Stand กลับ
  if(ci>=1&&ci<=4&&me.ea&&me.ea[0]>0){const S=SPELL_LIST[getKit(me.id).ids[ci-1]];if(S&&E_NEEDSTAND[S.id]){st.ratio=1;st.txt='🔒';st.ready=false;st.hl=false;st.bar=0;}}
  if(locked){st.ratio=1;st.txt='🔒';st.ready=false;st.hl=false;}
  return st;
}
function drawBottom(me,v){
  const M=(v&&v.M)||{};
  if(v&&v.mode==='imp'){
    const SL=SLOTS_IMP.filter(s=>s[3]!==-13||(ROLE&&ROLE.role==='imp'));
    const tp=taskPts(),nearTask=ROLE&&ROLE.tasks.some(t=>!ROLE.tdone.includes(t)&&Math.hypot(me.x-tp[t].x,me.y-tp[t].y)<62);
    const nearBody=(M.bodies||[]).some(b=>Math.hypot(me.x-b[1],me.y-b[2])<110);
    const nearCenter=Math.hypot(me.x-MW/2,me.y-MH/2)<160;
    SL.forEach(([key,ic,name,ci],i)=>{
      const ready=ci===-10?nearTask:ci===-11?nearBody&&!me.gh:ci===-12?nearCenter&&!me.gh:KC<=0&&!me.gh;
      spellDia(SW-60-(SL.length-1-i)*76,SH-82,30,ic,key,name,{ratio:0,txt:ci===-13&&KC>0?String(Math.ceil(KC)):'',ready,hl:ready,dim:false});
    });
    return;
  }
  hud4Draw(me,v);   // HUD รอบ 4 (DOM, js/66): ซ้ายล่าง เลือด • ขวาล่าง ไพ่สกิล L2 + อัลติ
}
function drawBoard(v,P){
  const rows=[...P].sort((a,b)=>b.k-a.k),RH=Math.max(22,Math.min(32,Math.floor((SH-150)/Math.max(1,rows.length)))),w=Math.min(540,SW-32),h=96+rows.length*RH,x=SW/2-w/2,y=SH/2-h/2;
  frameBox(x,y,w,h);
  cx.textAlign='center';cx.font='700 20px Cinzel,Kanit,serif';cx.fillStyle=HG2;cx.fillText('ตารางคะแนน',SW/2,y+34);
  const coop=v.mode==='coop',hy=y+64;
  cx.font='12px Kanit,sans-serif';cx.fillStyle=HG;cx.textAlign='left';cx.fillText('ผู้เล่น',x+24,hy);
  cx.textAlign='right';cx.fillText(coop?'ฆ่า':'KILLS',x+w-170,hy);cx.fillText(coop?'ล้ม':'DEATHS',x+w-100,hy);cx.fillText('ดาเมจ',x+w-24,hy);
  cx.fillStyle='rgba(217,180,90,0.3)';cx.fillRect(x+16,hy+8,w-32,1);
  rows.forEach((p,i)=>{
    const yy=hy+RH+i*RH,me=p.id===NET.myId;
    if(me){const g=cx.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'rgba(217,180,90,0.2)');g.addColorStop(1,'rgba(217,180,90,0)');cx.fillStyle=g;cx.fillRect(x+16,yy-RH*0.62,w-32,RH-4);}
    diaPath(x+30,yy-6,6);cx.fillStyle=p.c;cx.fill();
    cx.textAlign='left';cx.fillStyle=teamOn(v)?TEAMC[p.tm]:me?HG2:'#efe6cf';cx.font=(me?'600 ':'')+'15px Kanit,sans-serif';
    cx.fillText(p.n+(p.bf&&p.bf.length?'  ('+p.bf.length+' บัฟ)':''),x+46,yy);
    cx.textAlign='right';cx.fillStyle='#efe6cf';
    cx.fillText(p.k,x+w-170,yy);cx.fillText(p.d,x+w-100,yy);cx.fillText(p.dmg,x+w-24,yy);
  });
}

// Fire Heat bar (user 2026-11-14, ref = thin blade bar: hot core with red neon rim, angled tip on the right, a glowing orb
// wrapped in flame on the left, flame flicks along the bar). One continuous blade — the 4 stacks show only as faint split
// lines — and the colour heats up with every stack: dark red → red → hot orange-red → full = orange fire bar.
// Orb = drawn fire icon (warms with the heat) with a small VFX Studio flame behind it (hud_heat_flame_red/_fire flipbooks).
// Kept light on effects (user): when full the blade fills with flowing fire = VFX Studio tileable texture hud_heat_flow
// scrolled along the bar, plus a few embers drifting up off it. A collar joins the orb rim into the blade.
const FHUD={t:0,v:0,lv:0,pop:0,burst:0,wasFull:false};
const FHTEX={};function fhTex(n){let t=FHTEX[n];if(!t){const im=new Image();im.src='assets/fx/tex/hud_heat_'+n+'.png';t=FHTEX[n]={im};}return t.im.complete&&t.im.naturalWidth?t:null;}
function fhFrame(n,cols,rows,fps,T,x,y,w,h,rot,a,off){const t=fhTex(n);if(!t)return;const N=cols*rows,f=Math.floor(T*fps+(off||0))%N,fw=t.im.naturalWidth/cols,fh=t.im.naturalHeight/rows;
  cx.save();cx.globalAlpha=a;cx.translate(x,y);if(rot)cx.rotate(rot);cx.drawImage(t.im,(f%cols)*fw,Math.floor(f/cols)*fh,fw,fh,-w/2,-h/2,w,h);cx.restore();}
// heat palette per level 0..4 (edge, core) — lerped by the exact heat so it warms up smoothly
const FH_EDGE=['#4a0004','#9a0a0a','#c8120a','#e8300a','#ff5a08'],FH_CORE=['#a01a18','#ff3a20','#ff6a28','#ffa040','#fff2c0'];
function fhMix(A,k){const i=Math.min(A.length-2,Math.floor(k)),f=k-i,a=parseInt(A[i].slice(1),16),b=parseInt(A[i+1].slice(1),16),m=(s)=>Math.round(((a>>s)&255)*(1-f)+((b>>s)&255)*f);return `rgb(${m(16)},${m(8)},${m(0)})`;}
function drawFireHeat(fh){const now=performance.now(),dt=Math.min(.1,(now-(FHUD.t||now))/1000);FHUD.t=now;const T=now/1000;
  const P=PHEAT,lvF=Math.max(0,Math.min(P.max,fh/P.per)),lv=Math.floor(lvF+1e-6);FHUD.v+=(lvF-FHUD.v)*Math.min(1,dt*8);
  if(lv>FHUD.lv)FHUD.pop=1;FHUD.lv=lv;const full=lv>=P.max,heat=FHUD.v;if(full&&!FHUD.wasFull)FHUD.burst=1;FHUD.wasFull=full;
  const S=Math.min(1.2,Math.max(.8,SH/860)),ox=46*S,oy=SH*0.6,R=15*S,x0=ox+R*.3,len=250*S,h=8*S,tip=10*S,y0=oy-h/2,x1=x0+len;
  const RIM=full?'#ff7a1a':fhMix(['#a0101a','#c8101a','#e8141a','#ff3a1a','#ff7a1a'],heat),GLOW=full?'rgba(255,120,20,':'rgba(255,30,30,';
  fhTex('flame_fire');fhTex('flame_red');fhTex('flow');const col=full?'fire':'red';
  cx.save();cx.lineCap='round';cx.lineJoin='round';
  const blade=(e)=>{cx.beginPath();cx.moveTo(x0,y0-e);cx.lineTo(x1+e,y0-e);cx.lineTo(x1-tip-e*.4,y0+h+e);cx.lineTo(x0,y0+h+e);cx.closePath();};
  // full: soft pulsing fire aura around the whole bar + orb
  if(full){const pu=.75+.25*Math.sin(T*4);
    cx.save();cx.globalCompositeOperation='lighter';const og2=cx.createRadialGradient(ox,oy,R*.8,ox,oy,R*2.6);og2.addColorStop(0,`rgba(255,130,30,${.35*pu})`);og2.addColorStop(1,'rgba(255,60,0,0)');cx.fillStyle=og2;cx.beginPath();cx.arc(ox,oy,R*2.6,0,Math.PI*2);cx.fill();
    for(const [e,a,bl] of [[3.5,.5,10],[6,.25,18]]){cx.shadowColor=`rgba(255,110,20,${.9*pu})`;cx.shadowBlur=bl*S;cx.strokeStyle=`rgba(255,130,40,${a*pu})`;cx.lineWidth=2*S;blade(e*S);cx.stroke();}cx.restore();}
  // trough + red neon rim (outline closed at the tip, no overshoot)
  blade(2.2*S);cx.fillStyle='rgba(16,0,2,.75)';cx.fill();
  cx.shadowColor=GLOW+(.6+.35*heat/P.max)+')';cx.shadowBlur=(7+5*heat/P.max)*S;cx.strokeStyle=RIM;cx.lineWidth=1.4*S;
  cx.beginPath();cx.moveTo(x0,y0-2.2*S);cx.lineTo(x1+2.2*S,y0-2.2*S);cx.lineTo(x1-tip-1*S,y0+h+2.2*S);cx.lineTo(x0,y0+h+2.2*S);cx.stroke();cx.shadowBlur=0;
  // collar: the orb's rim flows into the blade so they read as one piece
  {const cxn=ox+R*2.1,e=2.2*S;cx.beginPath();cx.moveTo(ox+R*.55,oy-R*.84);cx.quadraticCurveTo(ox+R*1.2,y0-e-R*.05,cxn,y0-e);cx.lineTo(cxn,y0+h+e);cx.quadraticCurveTo(ox+R*1.2,y0+h+e+R*.05,ox+R*.55,oy+R*.84);cx.closePath();
    cx.fillStyle='rgba(20,0,2,.85)';cx.fill();cx.shadowColor=GLOW+'.9)';cx.shadowBlur=7*S;cx.strokeStyle=RIM;cx.lineWidth=1.4*S;
    cx.beginPath();cx.moveTo(ox+R*.55,oy-R*.84);cx.quadraticCurveTo(ox+R*1.2,y0-e-R*.05,cxn,y0-e);cx.moveTo(ox+R*.55,oy+R*.84);cx.quadraticCurveTo(ox+R*1.2,y0+h+e+R*.05,cxn,y0+h+e);cx.stroke();cx.shadowBlur=0;}
  // one continuous fill, colour from the current heat
  cx.save();blade(0);cx.clip();
  const fx=x0+len*heat/P.max;
  if(heat>0.01){const e=fhMix(FH_EDGE,heat),c=fhMix(FH_CORE,heat),g=cx.createLinearGradient(0,y0,0,y0+h);
    g.addColorStop(0,e);g.addColorStop(.42,c);g.addColorStop(.58,c);g.addColorStop(1,e);cx.fillStyle=g;cx.fillRect(x0,y0,fx-x0+tip*.5,h);
    // hot leading edge
    const lg=cx.createLinearGradient(fx-24*S,0,fx+4*S,0);lg.addColorStop(0,'rgba(255,240,210,0)');lg.addColorStop(1,`rgba(255,240,210,${.35+.15*Math.sin(T*9)})`);cx.fillStyle=lg;cx.fillRect(fx-24*S,y0,28*S,h);
    if(full){const t=fhTex('flow');if(t){const im=t.im,tw=h*7,sh=im.naturalHeight*.28;
      for(const [sp,al,yo] of [[42,.9,0],[-23,.5,.45]]){const off=((T*sp*S)%tw+tw)%tw;cx.globalAlpha=al;cx.globalCompositeOperation=al<.8?'lighter':'source-over';
        for(let x=x0-tw+off;x<x1+tw;x+=tw)cx.drawImage(im,0,im.naturalHeight*yo,im.naturalWidth,sh,x,y0,tw,h);}
      cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
      const hg=cx.createLinearGradient(0,y0,0,y0+h);hg.addColorStop(0,'rgba(255,90,10,.35)');hg.addColorStop(.5,'rgba(255,240,200,.25)');hg.addColorStop(1,'rgba(200,30,0,.4)');cx.fillStyle=hg;cx.fillRect(x0,y0,len,h);}}
    if(FHUD.pop>0){cx.fillStyle=`rgba(255,250,235,${FHUD.pop*.7})`;cx.fillRect(x0,y0,fx-x0,h);FHUD.pop=Math.max(0,FHUD.pop-dt*3);}}
  // faint stack split lines (only noticeable up close)
  cx.strokeStyle='rgba(30,0,0,.28)';cx.lineWidth=1*S;for(let i=1;i<P.max;i++){const xn=x0+i*len/P.max;cx.beginPath();cx.moveTo(xn+tip*.5,y0);cx.lineTo(xn,y0+h);cx.stroke();}
  cx.restore();
  // full: a few embers drifting up off the bar
  if(full){for(let j=0;j<5;j++){const u=(T*.5+j*.41)%1,px=x0+((j*.61+.12)%1)*len+Math.sin(T*2+j)*4*S,py=y0-3*S-u*18*S;
    cx.fillStyle=`rgba(255,${170+60*(1-u)|0},70,${(1-u)*.9})`;cx.beginPath();cx.arc(px,py,(1.6-u)*S,0,Math.PI*2);cx.fill();}}
  // just hit full: fire burst all around the bar (full ellipse, above + below) + a thin shock ring running from the orb to the tip
  if(FHUD.burst>0){const k=FHUD.burst,u=1-k,e=1-Math.pow(1-u,3),mx=x0+len*.45,rx=len*(.25+.45*e),ry=R*(.8+2.2*e);cx.save();cx.globalCompositeOperation='lighter';
    const dg=cx.createRadialGradient(0,0,0,0,0,1);dg.addColorStop(0,`rgba(255,240,200,${.45*k})`);dg.addColorStop(.6,`rgba(255,120,20,${.3*k})`);dg.addColorStop(.92,`rgba(255,80,10,${.5*k})`);dg.addColorStop(1,'rgba(255,40,0,0)');
    cx.save();cx.translate(mx,oy);cx.scale(rx,ry);cx.fillStyle=dg;cx.beginPath();cx.arc(0,0,1,0,Math.PI*2);cx.fill();cx.restore();
    cx.strokeStyle=`rgba(255,200,120,${.8*k})`;cx.lineWidth=(2.4-1.4*e)*S;cx.beginPath();cx.ellipse(mx,oy,rx,ry,0,0,Math.PI*2);cx.stroke();
    for(let j=0;j<16;j++){const a=(j+.5)/16*Math.PI*2,rr=1+.15*e;cx.fillStyle=`rgba(255,${180+(j%3)*25},80,${k})`;cx.beginPath();cx.arc(mx+Math.cos(a)*rx*rr,oy+Math.sin(a)*ry*rr,1.6*S*k+.4,0,Math.PI*2);cx.fill();}
    // shock ring: thin upright ring sweeping along the blade, fast at first then easing out at the tip
    const su=Math.min(1,u/.6),se=1-Math.pow(1-su,2),sx=ox+R+(x1-ox-R)*se,sa=su<1?1-su*.6:0;
    if(sa>0){const sr=R*(1.2+1.4*su);cx.strokeStyle=`rgba(255,235,190,${.9*sa})`;cx.lineWidth=1.6*S;cx.shadowColor='rgba(255,140,40,1)';cx.shadowBlur=8*S;
      cx.beginPath();cx.ellipse(sx,oy,sr*.32,sr,0,0,Math.PI*2);cx.stroke();cx.strokeStyle=`rgba(255,130,40,${.5*sa})`;cx.lineWidth=1*S;cx.beginPath();cx.ellipse(sx-6*S,oy,sr*.26,sr*.85,0,0,Math.PI*2);cx.stroke();
      cx.shadowBlur=0;const tg=cx.createLinearGradient(ox+R,0,sx,0);tg.addColorStop(0,'rgba(255,200,120,0)');tg.addColorStop(1,`rgba(255,240,200,${.7*sa})`);cx.fillStyle=tg;cx.fillRect(ox+R,y0-1*S,sx-ox-R,h+2*S);}
    cx.restore();FHUD.burst=Math.max(0,FHUD.burst-dt/0.8);}
  // icon: a little VFX Studio flame licking up behind the orb (grows with heat) + a spark or two
  {const k=heat/P.max;fhFrame('flame_'+col,8,4,24,T,ox+R*.05,oy-R*.75,R*(1.7+.5*k),R*(2.2+.9*k),-.08,.45+.45*k,0);
    for(let j=0;j<2+(full?2:0);j++){const u=(T*.7+j*.5)%1,a=-1.9+j*.5+Math.sin(T+j)*.2;cx.fillStyle=`rgba(255,${full?190:110},80,${(1-u)*.8})`;cx.beginPath();cx.arc(ox+Math.cos(a)*R*(1+u*.9),oy+Math.sin(a)*R*(1+u*.9),(1.4-u)*S,0,Math.PI*2);cx.fill();}}
  const og=cx.createRadialGradient(ox-R*.35,oy-R*.35,R*.1,ox,oy,R);
  if(full){og.addColorStop(0,'#5a1a04');og.addColorStop(.7,'#2a0800');og.addColorStop(1,'#120200');}else{og.addColorStop(0,'#4a0610');og.addColorStop(.7,'#1e0004');og.addColorStop(1,'#0a0002');}
  cx.shadowColor=GLOW+'1)';cx.shadowBlur=(full?20+6*Math.sin(T*8):8+4*heat)*S;cx.fillStyle=og;cx.beginPath();cx.arc(ox,oy,R,0,Math.PI*2);cx.fill();cx.shadowBlur=0;
  {cx.save();const s=R*.62,sp=2,mv=full?1:0;// icon flame comes alive only at full Heat (user): flickers, stretches and sways from its base
    cx.translate(ox,oy+R*.1+s);cx.transform(1,0,mv*(.13*Math.sin(T*4.3*sp)+.05*Math.sin(T*11)),1,0,0);cx.scale(1+mv*.05*Math.sin(T*9*sp),1+mv*(.07*Math.sin(T*7.3*sp)+.04*Math.sin(T*13.7)));cx.translate(0,-s);
    const fp=(s)=>{cx.beginPath();cx.moveTo(0,s);cx.bezierCurveTo(-s*.85,s*.9,-s*.95,-s*.05,-s*.35,-s*.55);cx.bezierCurveTo(-s*.3,-s*.15,-s*.1,-s*.05,0,-s*.05);
    cx.bezierCurveTo(-s*.15,-s*.55,s*.05,-s*.85,s*.15,-s*1.1);cx.bezierCurveTo(s*.35,-s*.6,s*.95,-s*.2,s*.75,s*.45);cx.bezierCurveTo(s*.65,s*.85,s*.3,s,0,s);cx.closePath();};fp(s);
    const k=heat/P.max,fg=cx.createLinearGradient(0,s,0,-s);fg.addColorStop(0,full?'#ff5a10':fhMix(['#a01018','#d01a1a','#ff3a20','#ff6a28','#ff8a20'],heat));fg.addColorStop(1,full?'#fff2b0':fhMix(['#ff8a80','#ffb0a0','#ffd0b0','#ffe2b0','#fff2b0'],heat));
    cx.fillStyle=fg;cx.shadowColor=full?'rgba(255,200,90,.9)':`rgba(255,120,90,${.3+.5*k})`;cx.shadowBlur=(3+6*k)*S;cx.fill();
    cx.shadowBlur=0;cx.save();cx.translate(0,s*.45);cx.scale(1,1+mv*.12*Math.sin(T*10.5*sp+1));cx.translate(0,-s*.45);cx.translate(0,s*.3);fp(s*.5);cx.fillStyle=full?'rgba(255,250,215,.95)':`rgba(255,235,210,${.35+.5*k})`;cx.fill();cx.restore();
    if(FHUD.burst>0){cx.globalCompositeOperation='lighter';cx.globalAlpha=FHUD.burst;cx.scale(1+.5*(1-FHUD.burst),1+.7*(1-FHUD.burst));fp(s);cx.fillStyle='rgba(255,200,110,.7)';cx.fill();cx.globalAlpha=1;cx.globalCompositeOperation='source-over';}
    cx.restore();}
  cx.strokeStyle=full?'rgba(255,200,120,.9)':'rgba(255,90,80,.85)';cx.lineWidth=1.3*S;cx.beginPath();cx.arc(ox,oy,R,0,Math.PI*2);cx.stroke();
  cx.strokeStyle='rgba(255,255,255,.5)';cx.lineWidth=1.2*S;cx.beginPath();cx.arc(ox,oy,R*.78,-2.5,-1.6);cx.stroke();
  // title above the blade
  cx.font=`600 ${Math.round(12.5*S)}px Cinzel,Kanit,serif`;cx.textAlign='center';cx.shadowColor='rgba(0,0,0,.9)';cx.shadowBlur=4;cx.fillStyle=full?'#ffe2a8':'#f4ece6';
  cx.fillText(full?'HEAT  MAX':'HEAT  '+lv+' / '+P.max,x0+len*.42,y0-9*S);
  cx.restore();}

// Ignition Snap ป้ายผลบนจอคนดีด (ผู้ใช้ 2026-11-14 อยากให้ "snap boom 5 dead" สะใจ): ×N IGNITED / ×N INCINERATED + ขอบจอวาบส้ม
const SNAPB={t:0,ev:null};
function snapBanner(ev){SNAPB.t=performance.now();SNAPB.ev=ev;}
function drawSnapBanner(){const ev=SNAPB.ev;if(!ev)return;const u=(performance.now()-SNAPB.t)/1000,L=ev.kl?1.8:1.3;if(u>L){SNAPB.ev=null;return;}
  const big=ev.f&&ev.s>=8||ev.kl>=2,a=u<.08?u/.08:u>L-.35?Math.max(0,(L-u)/.35):1,pop=1+.35*Math.max(0,1-u/.18);
  // ขอบจอวาบ
  if(big){const g=cx.createRadialGradient(SW/2,SH/2,Math.min(SW,SH)*.3,SW/2,SH/2,Math.max(SW,SH)*.75);g.addColorStop(0,'rgba(255,120,20,0)');g.addColorStop(1,`rgba(255,${ev.kl?60:110},10,${.5*a*Math.max(0,1-u/.6)})`);cx.fillStyle=g;cx.fillRect(0,0,SW,SH);}
  const S=Math.min(1.3,Math.max(.8,SH/860)),y=SH*.3;cx.save();cx.textAlign='center';cx.textBaseline='middle';cx.globalAlpha=a;
  const t1=ev.kl?(ev.kl>=2?'×'+ev.kl+' INCINERATED':'INCINERATED'):(ev.n>=2?'×'+ev.n+' IGNITED':'IGNITED'),fs=Math.round((ev.kl?44:big?36:28)*S*pop);
  cx.font=`700 ${fs}px Cinzel,'Pirata One',serif`;const gr=cx.createLinearGradient(0,y-fs/2,0,y+fs/2);gr.addColorStop(0,'#fff2b0');gr.addColorStop(.5,'#ff9a2a');gr.addColorStop(1,'#d0200a');
  cx.shadowColor='rgba(255,90,10,.9)';cx.shadowBlur=18*S;cx.lineWidth=5*S;cx.strokeStyle='rgba(40,4,0,.85)';cx.strokeText(t1,SW/2,y);cx.fillStyle=gr;cx.fillText(t1,SW/2,y);
  cx.shadowBlur=6*S;cx.font=`600 ${Math.round(15*S)}px Cinzel,Kanit,serif`;cx.fillStyle='#ffe2b0';cx.fillText(ev.s+' BURNING'+(ev.f?'  •  HEAT MAX':''),SW/2,y+fs*.75);
  cx.restore();}
