// =====================================================================
//  จบเกม (ผู้ใช้ 2026-10-22): VICTORY / DEFEAT แบบ Overwatch แต่เป็นเวทมนตร์ (สายฟ้า + ไฟ) + จอสรุป MVP + ห้องฝึกนับคอมโบ
//  ลำดับ: host endMatch → โลกสโลว์ 1.6 วิ (snapshot sl=1 → จอมืดจาง ๆ) → ph 'over' → ป้าย VICTORY/DEFEAT ~3.4 วิ → จอสรุป (#over, js/26 showOver)
//  ชนะ = ทองเหลืองสว่าง • แพ้ = ม่วงเข้มมีแสง • เสมอ = เงินฟ้า • คลิก / Space ข้ามได้หลัง 0.8 วิ
// =====================================================================
const VIC={on:false,t:0,kind:'end',res:null,cb:null,cv:null,cx:null,bolts:[],bt:0,emb:[],dim:0,last:0,w:0,h:0,sh:0};
const VPAL={
  win:{word:'VICTORY!',th:'ชัยชนะ',band:['rgba(255,140,30,0)','rgba(255,150,40,.55)','rgba(255,214,90,.9)','rgba(255,250,225,1)'],txt:['#ffffff','#fff3a6','#ffd23a','#ff9418'],
    out:'rgba(90,40,0,.85)',glow:'#ffcc40',bolt:['#fffbe0','#ffd84a'],emb:['#ffd23a','#ff9a1a','#ff5a10','#fff1a8'],flash:'255,240,190',flashA:0.65},
  lose:{word:'DEFEAT',th:'พ่ายแพ้',band:['rgba(40,8,80,0)','rgba(70,20,140,.6)','rgba(140,80,240,.85)','rgba(230,210,255,.95)'],txt:['#f6efff','#cfaeff','#8f55ff','#3c1278'],
    out:'rgba(16,2,34,.9)',glow:'#9a5cff',bolt:['#f4ecff','#a46bff'],emb:['#9b5bff','#6a2ad8','#c48aff','#3a0f7a'],flash:'150,100,255',flashA:0.35},
  draw:{word:'DRAW',th:'เสมอ',band:['rgba(80,110,160,0)','rgba(110,150,210,.5)','rgba(180,210,255,.85)','rgba(245,250,255,1)'],txt:['#ffffff','#e2ecff','#a9c4ff','#5a78b8'],
    out:'rgba(10,20,40,.85)',glow:'#a9c8ff',bolt:['#f4f8ff','#9fc2ff'],emb:['#cfe0ff','#8fb0ff','#ffffff','#5f7fc0'],flash:'220,235,255',flashA:0.45},
  end:{word:'GAME OVER',th:'จบเกม',band:['rgba(150,120,60,0)','rgba(170,140,70,.45)','rgba(230,200,130,.8)','rgba(255,245,215,.95)'],txt:['#ffffff','#f6e6b8','#d9b45a','#8a6a2a'],
    out:'rgba(30,20,5,.85)',glow:'#e8c468',bolt:['#fff8e0','#e8c468'],emb:['#f3dc94','#d9b45a','#fff4cc','#a47a2b'],flash:'255,240,200',flashA:0.4}};
(function(){const c=document.createElement('canvas');c.id='vicCv';c.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:5;pointer-events:none';document.body.appendChild(c);VIC.cv=c;VIC.cx=c.getContext('2d');})();
function vicKind(r){
  if(!r||r.mode==='train')return 'end';
  if(r.draw)return 'draw';
  const inGame=VIEW.cur&&VIEW.cur.P.some(p=>p.id===NET.myId);
  if(!r.win||!r.win.length)return r.mode==='coop'&&inGame?'lose':'end';   // co-op จบ = ทุกคนล้ม
  if(!inGame)return 'end';   // คนดู
  return r.win.includes(NET.myId)?'win':'lose';
}
function vicStart(res,cb){
  const k=vicKind(res);
  if(res&&res.mode==='train'){cb();return;}   // ห้องฝึก: ไปจอสรุปเลย
  Object.assign(VIC,{on:true,t:0,kind:k,res,cb:()=>podStart(res,cb),bolts:[],bt:0,emb:[],sh:0});   // ป้าย → โพเดียม (js/55) → จอสรุป
  try{snd(k==='win'?'buff':'end',{vol:0.8});}catch(e){}
}
function vicStop(){if(!VIC.on)return;VIC.on=false;const cb=VIC.cb;VIC.cb=null;if(cb)cb();}
function vicSkip(){if(VIC.on&&VIC.t>0.8)vicStop();}
addEventListener('keydown',e=>{if(VIC.on&&(e.code==='Space'||e.code==='Enter'||e.code==='Escape'))vicSkip();});
addEventListener('mousedown',()=>vicSkip());
// สายฟ้าหยัก ๆ (แตกกิ่ง) จาก (x,y) ไปทิศ a ยาว L
function vicBolt(x,y,a,L,depth){
  const pts=[[x,y]],n=8+Math.floor(Math.random()*5);let cx=x,cy=y;
  for(let i=1;i<=n;i++){const f=i/n,j=(1-f*0.5)*L*0.12;cx=x+Math.cos(a)*L*f+(Math.random()-0.5)*j*2;cy=y+Math.sin(a)*L*f+(Math.random()-0.5)*j*2;pts.push([cx,cy]);
    if(depth<1&&Math.random()<0.18){const b=pts[pts.length-1];VIC.bolts.push(vicBolt(b[0],b[1],a+(Math.random()-0.5)*1.4,L*0.4,depth+1));}}
  return {p:pts,w:depth?0.6:1};
}
function vicLoop(now){
  requestAnimationFrame(vicLoop);
  const dt=VIC.last?Math.max(0,Math.min(0.05,(now-VIC.last)/1000||0)):0;VIC.last=now;
  const c=VIC.cx,cv=VIC.cv,dpr=Math.min(2,devicePixelRatio||1),W=innerWidth,H=innerHeight;
  const slow=screen==='game'&&VIEW.cur&&VIEW.cur.sl;
  const tgt=VIC.on?0.55:slow?0.42:0;VIC.dim+=(tgt-VIC.dim)*Math.min(1,dt*(tgt>VIC.dim?3:5));
  if(VIC.dim<0.004&&!VIC.on){if(VIC.w){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cv.width,cv.height);VIC.w=0;}return;}
  if(VIC.w!==W||VIC.h!==H){cv.width=W*dpr;cv.height=H*dpr;VIC.w=W;VIC.h=H;}
  c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
  // จอมืดจาง ๆ + ขอบมืด (ตอนสโลว์)
  {const g=c.createRadialGradient(W/2,H/2,Math.min(W,H)*0.2,W/2,H/2,Math.max(W,H)*0.75);g.addColorStop(0,`rgba(0,0,0,${VIC.dim*0.7})`);g.addColorStop(1,`rgba(0,0,0,${Math.min(0.9,VIC.dim*1.5)})`);c.fillStyle=g;c.fillRect(0,0,W,H);}
  if(!VIC.on)return;
  VIC.t+=dt;const t=VIC.t,P=VPAL[VIC.kind],cy=H*0.42,bh=Math.max(90,H*0.2),out=t>2.9?Math.max(0,1-(t-2.9)/0.5):1;
  if(t>3.4){vicStop();return;}
  const T0=0.18,eo=x=>1-Math.pow(1-x,3);
  // สั่นตอนกระแทก
  const sk=t>T0&&t<T0+0.35?(1-(t-T0)/0.35)*14:0,sx=(Math.random()-0.5)*sk,sy=(Math.random()-0.5)*sk;
  c.save();c.globalAlpha=out;c.translate(sx,sy);
  // แถบแสงพาดกลางจอ (กวาดเข้าจากซ้าย)
  const prog=eo(Math.min(1,t/0.22)),bw=W*prog;
  c.globalCompositeOperation='lighter';
  for(let k=0;k<2;k++){const hh=bh*(k?0.42:1),g=c.createLinearGradient(0,cy-hh/2,0,cy+hh/2);
    g.addColorStop(0,P.band[0]);g.addColorStop(0.25,P.band[1]);g.addColorStop(0.47,P.band[k?3:2]);g.addColorStop(0.53,P.band[k?3:2]);g.addColorStop(0.75,P.band[1]);g.addColorStop(1,P.band[0]);
    c.globalAlpha=out*(k?0.9:0.75)*(t>T0?0.85+0.15*Math.sin(t*9):1);c.fillStyle=g;c.fillRect(0,cy-hh/2,bw,hh);}
  // เส้นความเร็ววิ่งในแถบ
  c.globalAlpha=out*0.6;c.fillStyle=P.band[3];
  for(let i=0;i<16;i++){const y=cy+(((i*73)%100)/100-0.5)*bh*0.8,len=W*(0.08+((i*37)%10)/40),x=((t*(1.4+(i%5)*0.35)+i*0.137)%1.3)*W*1.2-len;c.fillRect(Math.max(0,x),y,Math.min(len,bw-x),1+(i%3));}
  // สายฟ้ารอบตัวหนังสือ (สุ่มใหม่ทุก ~70 ms)
  VIC.bt-=dt;
  if(VIC.bt<=0&&t>0.12&&t<2.9){VIC.bt=0.06+Math.random()*0.05;VIC.bolts=[];
    const n=VIC.kind==='lose'?3:5;for(let i=0;i<n;i++){const sd=Math.random()<0.5?-1:1,x=W*(0.2+Math.random()*0.6),y=cy+sd*bh*0.42;VIC.bolts.push(vicBolt(x,y,sd*Math.PI/2+(Math.random()-0.5)*1.2,bh*(0.6+Math.random()*0.9),0));}
    if(Math.random()<0.5){const sd=Math.random()<0.5?-1:1;VIC.bolts.push(vicBolt(sd<0?W*0.02:W*0.98,cy+(Math.random()-0.5)*bh*0.5,sd<0?0:Math.PI,W*0.3,0));}}
  for(const b of VIC.bolts){for(const [lw,col,a] of [[7*b.w,P.bolt[1],0.35],[2.2*b.w,P.bolt[0],0.95]]){c.globalAlpha=out*a;c.strokeStyle=col;c.lineWidth=lw;c.lineJoin='round';c.beginPath();b.p.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.stroke();}}
  // เปลวไฟเป็นลิ้น ๆ ลุกจากขอบล่างแถบ (ใต้ตัวหนังสือ) — แพ้ = ไฟม่วงเตี้ยกว่า
  if(t>T0*0.6){const n=22,x0=W*0.17,x1=W*0.83,base=cy+bh*0.36,grow=Math.min(1,(t-T0*0.6)/0.25),tall=VIC.kind==='lose'?0.55:0.85;
    for(let i=0;i<n;i++){const u=i/(n-1),x=lerp(x0,x1,u)+Math.sin(t*3+i*1.7)*6,env=Math.sin(u*Math.PI)*0.6+0.4,
      h=bh*tall*env*grow*(0.55+0.45*Math.abs(Math.sin(t*(5+i%4)+i*2.3)))*(0.8+0.2*Math.sin(t*13+i)),wd=Math.max(10,(x1-x0)/n*1.25);
      const g=c.createLinearGradient(0,base,0,base-h);g.addColorStop(0,P.emb[3]);g.addColorStop(0.25,P.emb[1]);g.addColorStop(0.6,P.emb[0]);g.addColorStop(1,'rgba(0,0,0,0)');
      c.globalAlpha=out*0.55;c.fillStyle=g;c.beginPath();c.moveTo(x-wd/2,base);c.quadraticCurveTo(x-wd*0.55,base-h*0.45,x+Math.sin(t*6+i)*wd*0.3,base-h);c.quadraticCurveTo(x+wd*0.55,base-h*0.45,x+wd/2,base);c.closePath();c.fill();}}
  // ไฟ / ประกายลอยขึ้นจากขอบล่างแถบ
  if(t<2.8){const n=VIC.kind==='lose'?5:9;for(let i=0;i<n;i++){const x=W*(0.18+Math.random()*0.64);VIC.emb.push({x,y:cy+bh*0.38+Math.random()*10,vx:(Math.random()-0.5)*40,vy:-(60+Math.random()*(VIC.kind==='lose'?90:170)),l:0,m:0.6+Math.random()*0.9,s:3+Math.random()*(i<3?16:6),c:P.emb[i%4]});}}
  for(let i=VIC.emb.length-1;i>=0;i--){const e=VIC.emb[i];e.l+=dt;if(e.l>e.m){VIC.emb.splice(i,1);continue;}
    e.x+=e.vx*dt+Math.sin((e.l+i)*7)*0.6;e.y+=e.vy*dt;const f=1-e.l/e.m,r=e.s*(0.4+0.6*f);
    const g=c.createRadialGradient(e.x,e.y,0,e.x,e.y,r);g.addColorStop(0,e.c);g.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=out*f*0.9;c.fillStyle=g;c.beginPath();c.arc(e.x,e.y,r,0,Math.PI*2);c.fill();}
  c.globalCompositeOperation='source-over';
  // ตัวหนังสือ: กระแทกเข้ามา (ใหญ่ → ปกติ) เอียงแบบ Overwatch • ฟอนต์ Cinzel Decorative (สไตล์ฮอกวอตส์)
  const fz=Math.min(W*0.12,H*0.19),s=t<T0?lerp(2.4,0.92,Math.pow(t/T0,2)):t<T0+0.14?lerp(0.92,1,(t-T0)/0.14):1+0.012*Math.sin(t*3);
  c.save();c.globalAlpha=out*Math.min(1,t/0.08);c.translate(W/2,cy);c.transform(1,0,-0.2,1,0,0);c.scale(s,s);
  c.font=`900 ${fz}px "Cinzel Decorative","Cinzel",serif`;c.textAlign='center';c.textBaseline='middle';
  const tg=c.createLinearGradient(0,-fz*0.5,0,fz*0.5);P.txt.forEach((q,i)=>tg.addColorStop(i/3,q));
  c.lineJoin='round';c.lineWidth=fz*0.08;c.strokeStyle=P.out;c.strokeText(P.word,0,0);
  c.shadowColor=P.glow;c.shadowBlur=fz*0.35;c.fillStyle=tg;c.fillText(P.word,0,0);c.shadowBlur=0;
  // แสงวิ่งผ่านตัวหนังสือ
  if(t>0.45&&t<1.4){const u=(t-0.45)/0.95,x=lerp(-fz*4,fz*4,u),hg=c.createLinearGradient(x-fz,0,x+fz,0);hg.addColorStop(0,'rgba(255,255,255,0)');hg.addColorStop(0.5,'rgba(255,255,255,.85)');hg.addColorStop(1,'rgba(255,255,255,0)');
    c.globalCompositeOperation='source-atop';c.fillStyle=hg;c.fillText(P.word,0,0);c.globalCompositeOperation='source-over';}
  c.restore();
  // คำไทย + หัวข้อผลจาก host (เช่น 🏆 ทีมแดงชนะ!)
  if(t>T0+0.1){c.globalAlpha=out*Math.min(1,(t-T0-0.1)/0.3);c.textAlign='center';c.textBaseline='middle';
    c.font='600 22px Kanit,sans-serif';c.fillStyle='rgba(0,0,0,.6)';c.fillText(P.th,W/2+1,cy+bh*0.62+1);c.fillStyle=P.txt[1];c.fillText(P.th,W/2,cy+bh*0.62);
    if(VIC.res&&VIC.res.title){c.font='500 16px Kanit,sans-serif';c.fillStyle='rgba(255,255,255,.85)';c.fillText(VIC.res.title,W/2,cy+bh*0.62+30);}}
  c.restore();
  // แฟลชทั้งจอตอนกระแทก
  if(t>T0&&t<T0+0.3){c.globalAlpha=1;c.fillStyle=`rgba(${P.flash},${P.flashA*(1-(t-T0)/0.3)})`;c.fillRect(0,0,W,H);}
}
requestAnimationFrame(vicLoop);

// ---------- จอสรุป: MVP + จุดเด่น (ใส่ใน showOver js/26) ----------
(function(){const st=document.createElement('style');st.textContent=`
#over .mvp{display:flex;align-items:center;gap:14px;margin:6px auto 12px;padding:10px 18px;width:fit-content;max-width:100%;border:1px solid rgba(243,220,148,.55);background:linear-gradient(90deg,rgba(243,220,148,.08),rgba(243,220,148,.2),rgba(243,220,148,.08));border-radius:10px}
#over .mvpL{font:900 28px "Cinzel Decorative",Cinzel,serif;color:#ffd86b;text-shadow:0 0 14px rgba(255,200,80,.7)}
#over .mvpN{font:600 20px Kanit,sans-serif;color:#fff}#over .mvpS{font:400 13px Kanit,sans-serif;color:rgba(255,255,255,.7)}
#over .hls{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:10px}
#over .hl{min-width:130px;padding:6px 10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);border-radius:8px;text-align:center}
#over .hl b{display:block;font:600 15px Kanit,sans-serif;color:#fff}#over .hl span{font:400 12px Kanit,sans-serif;color:rgba(255,255,255,.65)}#over .hl i{font-style:normal;color:#ffd86b;font-weight:600}
#over .ovBar{height:3px;margin-top:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden}#over .ovBar i{display:block;height:100%;background:linear-gradient(90deg,#d9b45a,#ffe9a8)}`;document.head.appendChild(st);})();
function overMvp(r){
  const R=r.rows||[];if(!R.length||r.mode==='train'&&R.length<2&&!(R[0]&&R[0].dmg))return '';
  const sc=x=>(x.dmg||0)+(x.k||0)*150-(x.d||0)*40;   // ⚠ คะแนน MVP: ดาเมจ + ฆ่า×150 − ตาย×40
  const top=(f)=>R.reduce((a,b)=>f(b)>f(a)?b:a,R[0]);
  const m=top(sc),dot=x=>`<span class="dot" style="background:${x.c};margin-right:6px"></span>`;
  const hl=(ic,lb,x,val)=>`<div class="hl"><span>${ic} ${lb}</span><b>${dot(x)}${esc(x.n)}</b><i>${val}</i></div>`;
  const kd=top(x=>x.k||0),dm=top(x=>x.dmg||0),tk=top(x=>x.tk||0);
  return `<div class="mvp"><div class="mvpL">MVP</div><div><div class="mvpN">${dot(m)}${esc(m.n)}</div><div class="mvpS">${m.k||0} ฆ่า • ${m.dmg||0} ดาเมจ • ตาย ${m.d||0}</div></div></div>
    <div class="hls">${hl('💥','ดาเมจสูงสุด',dm,dm.dmg||0)}${hl('⚔️','ฆ่ามากสุด',kd,kd.k||0)}${hl('🛡️','รับดาเมจมากสุด',tk,tk.tk||0)}</div>`;
}
function overBar(r,x){const mx=Math.max(1,...(r.rows||[]).map(q=>q.dmg||0));return `<div class="ovBar"><i style="width:${Math.round((x.dmg||0)/mx*100)}%"></i></div>`;}

// ---------- ห้องฝึก: นับคอมโบ (ผู้ใช้ 2026-10-22 "ห้องลองคอมโบ ... ใส่ในห้องฝึก") ----------
// ตีโดนหุ่น/ศัตรูต่อเนื่อง (ห่างกันไม่เกิน 1.5 วิ) = คอมโบเดียว: นับครั้ง (ไฟเผาไม่นับครั้งแต่นับดาเมจ) ดาเมจรวม เวลา DPS
// ตัวเลขใหญ่ลอยเหนือเป้า + แผงขวากลางจอ (คอมโบตอนนี้ / ล่าสุด / ดีที่สุด)
const COMBO={cur:null,last:null,best:0,bestT:0,GAP:1500};
function comboHit(ev){
  const v=VIEW.cur;if(!v||v.mode!=='train'||ev.s!==NET.myId)return;
  const n=performance.now();let c=COMBO.cur;
  if(!c||n-c.tl>COMBO.GAP){if(c)comboEnd(c);c=COMBO.cur={hits:0,dmg:0,t0:n,tl:n,e:ev.e,pop:n};}
  if(!ev.b)c.hits++;c.dmg+=ev.n||0;c.tl=n;c.e=ev.e;c.pop=n;
}
function comboEnd(c){COMBO.last=c;if(c.dmg>COMBO.best){COMBO.best=c.dmg;COMBO.bestT=performance.now();}}
function drawCombo(v,E,now){
  if(!v||v.mode!=='train'||v.ph==='over')return;
  const n=performance.now();let c=COMBO.cur;
  if(c&&n-c.tl>COMBO.GAP){comboEnd(c);COMBO.cur=c=null;}
  cx.save();
  // ตัวเลขใหญ่เหนือเป้า
  if(c){const e=E.find(q=>q.id===c.e),s=e&&toScreen(e.x,(e.h||0)+3.6,e.y);
    if(s){const pop=Math.max(0,1-(n-c.pop)/180),sc=1+0.35*pop,fz=Math.round(34*sc);
      cx.textAlign='center';cx.textBaseline='middle';cx.font=`900 ${fz}px "Cinzel Decorative",Cinzel,serif`;
      const g=cx.createLinearGradient(0,s[1]-fz/2,0,s[1]+fz/2);g.addColorStop(0,'#fff6c8');g.addColorStop(1,'#ff9a1a');
      cx.lineWidth=5;cx.strokeStyle='rgba(40,15,0,.85)';cx.strokeText(c.dmg,s[0],s[1]);cx.fillStyle=g;cx.fillText(c.dmg,s[0],s[1]);
      cx.font='700 15px Kanit,sans-serif';cx.lineWidth=4;cx.strokeText(c.hits+' HIT',s[0],s[1]-fz*0.75);cx.fillStyle='#ffe9a8';cx.fillText(c.hits+' HIT',s[0],s[1]-fz*0.75);}}
  // แผงขวา
  const L=c||COMBO.last,x=SW-212,y=Math.round(SH*0.36),w=196,h=128;
  cx.globalAlpha=c?1:0.8;cx.fillStyle='rgba(6,8,18,.62)';cx.fillRect(x,y,w,h);cx.fillStyle=HG;cx.fillRect(x,y,w,2);
  cx.textAlign='left';cx.textBaseline='top';cx.font='600 14px Kanit,sans-serif';cx.fillStyle=HG2;cx.fillText(c?'⚡ คอมโบ':'คอมโบล่าสุด',x+10,y+8);
  if(L){const tm=Math.max(0.1,(L.tl-L.t0)/1000),dps=Math.round(L.dmg/Math.max(0.5,tm));
    cx.font='800 30px Kanit,sans-serif';cx.fillStyle='#fff';cx.fillText(L.dmg,x+10,y+28);
    cx.font='500 13px Kanit,sans-serif';cx.fillStyle='rgba(255,255,255,.8)';
    cx.fillText(`${L.hits} ครั้ง • ${tm.toFixed(1)} วิ • ${dps} DPS`,x+10,y+66);}
  else{cx.font='400 13px Kanit,sans-serif';cx.fillStyle='rgba(255,255,255,.7)';cx.fillText('ตีหุ่นต่อเนื่องเพื่อนับคอมโบ',x+10,y+36);}
  const nb=n-COMBO.bestT<1500;
  cx.font='600 13px Kanit,sans-serif';cx.fillStyle=nb?'#7dffb0':'#e8c468';cx.fillText((nb?'🎉 สถิติใหม่! ':'🏆 ดีที่สุด ')+COMBO.best,x+10,y+92);
  cx.font='400 11px Kanit,sans-serif';cx.fillStyle='rgba(255,255,255,.5)';cx.fillText('เว้นเกิน 1.5 วิ = เริ่มคอมโบใหม่',x+10,y+110);
  cx.restore();
}
