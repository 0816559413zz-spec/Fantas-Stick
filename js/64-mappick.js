// =====================================================================
//  หน้าเลือกแผนที่แบบการ์ดกระจกเรียงโค้ง 3D (ผู้ใช้ 2026-10-22, designs/ui-menu.md) • หน้าตา css/mappick.css
//  mpkOpen({cur:'castle'|'' (''=สุ่ม), mode:'ffa', onPick:k=>{}}) • mpkClose()
//  การ์ดวางด้วย JS ทุกเฟรมจาก pos (ทศนิยม) → ลาก/ล้อเมาส์/ลูกศร/คีย์ ลื่นต่อเนื่อง • ภาพ assets/ui/maps/<k>.jpg (ไม่มีไฟล์ = พื้นไล่สี + อักษรย่อ)
// =====================================================================
// ชื่ออังกฤษ + ภูมิประเทศสั้นๆ (≤40 ตัว) • sky = ช่วงเวลา • h = สีพื้นสำรองตอนไม่มีภาพ (hue)
const MPK_TXT={
  '':{en:'Random',t:'สุ่มแผนที่ใหม่ให้ทุกรอบ',h:258},
  castle:{en:'Castle Courtyard',t:'ลานหินกลางปราสาท เสาใหญ่ ระเบียงสูง',sky:'night',h:250},
  forest:{en:'Dark Forest',t:'ป่าทึบกว้าง ลำธารตื้น วงหินโบราณ',sky:'night',h:158},
  pitch:{en:'Quidditch Pitch',t:'สนามโล่งกว้าง ห่วงทอง อัฒจันทร์หอคอย',sky:'sunset',h:28},
  hogsmeade:{en:'Hogsmeade',t:'หมู่บ้านหิมะ บ้านไม้พังได้ บ่อน้ำกลางลาน',sky:'night',h:208},
  greathall:{en:'The Great Hall',t:'โถงในร่ม โต๊ะยาวสี่บ้าน เทียนลอย',sky:'night',h:40},
  meadow:{en:'Hogwarts Meadow',t:'ทุ่งหญ้าลูกคลื่น เนินกลาง ซุ้มหินโบราณ',sky:'sunset',h:92},
  lake:{en:'Frozen Lake',t:'ลานน้ำแข็งโล่ง เกาะหินกลาง ผลึกให้หลบ',sky:'night',h:194},
  ruins:{en:'Ancient Arena',t:'ลานทรายโบราณ วงเสาหัก แท่นกลางยกสูง',sky:'sunset',h:34},
  valley:{en:'Valley Village',t:'หุบเขามีลำธาร สะพานหิน เนินสูงสองฝั่ง',sky:'day',h:132}
};
const MPK_SKY={night:'กลางคืน',sunset:'ยามเย็น',day:'กลางวัน'};
// ไอคอนเส้นบาง
const MPK_I={
  x:'<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
  l:'<svg viewBox="0 0 24 24"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>',
  r:'<svg viewBox="0 0 24 24"><path d="M9.5 5.5L16 12l-6.5 6.5"/></svg>',
  go:'<svg viewBox="0 0 24 24"><path d="M4 12h15M14 7l5 5-5 5"/></svg>',
  night:'<svg viewBox="0 0 24 24"><path d="M15.5 4.5a7.5 7.5 0 1 0 4 12.6A6.5 6.5 0 0 1 15.5 4.5z"/></svg>',
  sunset:'<svg viewBox="0 0 24 24"><path d="M3 17.5h18M6.5 17.5a5.5 5.5 0 0 1 11 0M12 6.5v2.2M5.4 9.6l1.5 1.5M18.6 9.6l-1.5 1.5"/></svg>',
  day:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M5.6 18.4l1.7-1.7M16.7 7.3l1.7-1.7"/></svg>'
};
// การ์ดสุ่ม: ลูกเต๋าเส้นบางในวงรูน (วงนอกหมุนช้า)
const MPK_DICE=`<svg class="mpkSig" viewBox="0 0 160 160"><g class="r1"><circle cx="80" cy="80" r="70"/><circle cx="80" cy="80" r="63" stroke-dasharray="1 5"/>${[0,45,90,135,180,225,270,315].map(a=>`<path d="M80 ${a%90?7:4}v${a%90?4:9}" transform="rotate(${a} 80 80)"/>`).join('')}</g>`+
  `<g class="r2"><circle cx="80" cy="80" r="52" stroke-dasharray="46 7 2 7"/></g>`+
  `<g class="die"><path d="M80 46l30 17v34l-30 17-30-17V63z"/><path d="M50 63l30 17 30-17M80 80v34"/></g>`+
  `<g class="pip"><ellipse cx="80" cy="63" rx="4.2" ry="2.4"/><circle cx="58" cy="76.5" r="2.3"/><circle cx="72" cy="100.5" r="2.3"/><circle cx="102" cy="76.5" r="2.3"/><circle cx="95" cy="88.5" r="2.3"/><circle cx="88" cy="100.5" r="2.3"/></g>`+
  `<g class="st"><path d="M30 34l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z"/><path d="M132 118l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z"/><path d="M128 30l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></g></svg>`;
const MPK={el:null,ring:null,dots:null,o:null,keys:[],cards:[],n:0,wrap:false,pos:0,tgt:0,W:300,H:400,ox:150,oy:200,on:false,t0:0,shut:0,last:0,raf:0,drag:null,swallow:false,hov:-1,pick:-1,wAcc:0,wT:0,wL:0,hT:0,dot:-1};
const mpkE=t=>1-Math.pow(1-t,3), mpkC=t=>t<0?0:t>1?1:t;
function mpkSnd(n,v){try{snd(n,{vol:v==null?1:v,rev:0});}catch(e){}}
function mpkCut(s,n){s=String(s||'');if(s.length<=n)return s;const c=s.slice(0,n),i=c.lastIndexOf(' ');return (i>n*.5?c.slice(0,i):c)+'…';}
function mpkName(k){return k?String(MAPS[k]?MAPS[k].name:k).replace(/^[^฀-๿A-Za-z0-9]+/,'').trim():'สุ่ม';}
function mpkCardHTML(k,i){
  const T=MPK_TXT[k]||{},m=MAPS[k],en=T.en||(k?k[0].toUpperCase()+k.slice(1):'Random'),ter=T.t||mpkCut(m&&m.d,40),sky=T.sky||(m&&m.fm&&m.fm.sky)||'',cur=k===(MPK.o.cur||'');
  const img=k?`assets/ui/maps/${k}.jpg`:'';
  return `<div class="mpkCard${k?'':' rnd'}${cur?' cur':''}" data-i="${i}" style="--mh:${T.h!=null?T.h:250}"><div class="mpkIn"><div class="mpkFace">`+
    (k?`<div class="mpkFb"><b>${esc(en[0])}</b></div><div class="mpkRef" style="background-image:url('${img}')"></div><img class="mpkPic" alt="" draggable="false" decoding="async" src="${img}">`:`<div class="mpkFb">${MPK_DICE}</div>`)+
    `<div class="mpkShade"></div><div class="mpkSweep"></div>`+
    `<div class="mpkTop">${cur?'<span class="mpkTag">เลือกอยู่</span>':'<span></span>'}${sky?`<span class="mpkSky">${MPK_I[sky]||''}${MPK_SKY[sky]||esc(sky)}</span>`:''}</div>`+
    `<div class="mpkTxt"><div class="mpkEn">${esc(en)}</div><div class="mpkRow"><div class="mpkTh">${esc(mpkName(k))}</div><span class="mpkHit">${MPK_I.go}</span></div><i class="mpkRule"></i><div class="mpkTer">${esc(ter)}</div></div>`+
    `</div></div><div class="mpkDim"></div></div>`;
}
function mpkBuild(){
  const el=document.createElement('div');el.id='mpk';el.hidden=true;
  el.innerHTML=`<div class="mpkBg"></div>
  <header class="mpkHead"><div class="mpkKick">Choose the Arena</div><h2 class="mpkTtl">เลือกแผนที่</h2><div class="mpkOrn"><i></i><b></b><i></i></div></header>
  <button type="button" class="mpkX" aria-label="ปิด">${MPK_I.x}</button>
  <div class="mpkStage"><div class="mpkArc"></div><div class="mpkRing"></div></div>
  <footer class="mpkFoot">
    <div class="mpkNav"><button type="button" class="mpkArr" data-d="-1" aria-label="ก่อนหน้า">${MPK_I.l}</button><div class="mpkDots"></div><button type="button" class="mpkArr" data-d="1" aria-label="ถัดไป">${MPK_I.r}</button></div>
    <button type="button" class="mpkGo"><span>เลือกแผนที่นี้</span>${MPK_I.go}</button>
    <div class="mpkHint"><kbd>←</kbd><kbd>→</kbd> เลื่อน <i></i> <kbd>Enter</kbd> เลือก <i></i> <kbd>Esc</kbd> ปิด</div>
  </footer>`;
  document.body.append(el);
  MPK.el=el;MPK.ring=el.querySelector('.mpkRing');MPK.dots=el.querySelector('.mpkDots');
  const stage=el.querySelector('.mpkStage');
  el.addEventListener('click',e=>{if(!MPK.on)return;const t=e.target;
    if(MPK.swallow){MPK.swallow=false;if(t.closest('.mpkStage'))return;}
    if(t.closest('.mpkX')){mpkSnd('ui_click');return mpkClose();}
    const a=t.closest('.mpkArr');if(a){mpkSnd('ui_click');return mpkStep(+a.dataset.d);}
    const d=t.closest('.mpkDots i');if(d)return mpkTo(+d.dataset.i);
    if(t.closest('.mpkGo'))return mpkPick();
    const c=t.closest('.mpkCard');if(c){const i=+c.dataset.i;if(i===mpkIdx()&&Math.abs(MPK.tgt-MPK.pos)<.5)mpkPick(i);else mpkTo(i);}
  });
  // หน้านี้เป็นหน้าต่างบังทั้งจอ: คลิก/เมาส์ไม่ส่งต่อให้ฉากเมนูข้างหลัง (เสียงคลิกเล่นเองด้านบน)
  ['click','mousedown','mousemove','contextmenu'].forEach(n=>el.addEventListener(n,e=>{e.stopPropagation();if(n==='contextmenu')e.preventDefault();}));
  // ชี้การ์ด → การ์ดข้างสว่างขึ้นนิด (ค่อยๆ ใน mpkTick)
  MPK.ring.addEventListener('pointerover',e=>{const c=e.target.closest('.mpkCard'),i=c?+c.dataset.i:-1;if(i!==MPK.hov){MPK.hov=i;if(i>=0&&!MPK.drag)mpkSnd('ui_hover',.18);mpkLoop();}});
  MPK.ring.addEventListener('pointerleave',()=>{MPK.hov=-1;mpkLoop();});
  // ลาก/ปัด
  stage.addEventListener('pointerdown',e=>{if(!MPK.on||e.button!==0)return;MPK.swallow=false;MPK.drag={x:e.clientX,p:MPK.pos,moved:false,lx:e.clientX,lt:performance.now(),v:0};});
  el.addEventListener('wheel',e=>{if(!MPK.on)return;e.preventDefault();const t=performance.now(),v=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
    if(t-MPK.wL>260)MPK.wAcc=0;MPK.wL=t;MPK.wAcc+=e.deltaMode?v*40:v;
    if(Math.abs(MPK.wAcc)>=40&&t-MPK.wT>150){mpkStep(MPK.wAcc>0?1:-1);MPK.wAcc=0;MPK.wT=t;}},{passive:false});
}
addEventListener('pointermove',e=>{const D=MPK.drag;if(!D)return;const dx=e.clientX-D.x;
  if(!D.moved&&Math.abs(dx)>6){D.moved=true;MPK.el.classList.add('drag');}
  if(!D.moved)return;const sp=MPK.W*.82;let p=D.p-dx/sp;
  if(!MPK.wrap){const hi=MPK.n-1;if(p<0)p*=.35;if(p>hi)p=hi+(p-hi)*.35;}
  const t=performance.now(),ms=Math.max(1,t-D.lt);D.v=D.v*.5+(-(e.clientX-D.lx)/sp/(ms/1000))*.5;D.lx=e.clientX;D.lt=t;MPK.pos=p;mpkLoop();});
function mpkUp(){const D=MPK.drag;if(!D)return;MPK.drag=null;MPK.el.classList.remove('drag');if(!D.moved)return;
  MPK.swallow=true;const v=performance.now()-D.lt>90?0:D.v;let t=Math.round(MPK.pos+Math.max(-2.5,Math.min(2.5,v*.16)));
  if(!MPK.wrap)t=Math.max(0,Math.min(MPK.n-1,t));MPK.tgt=t;mpkLoop();}
addEventListener('pointerup',mpkUp);addEventListener('pointercancel',mpkUp);
// คีย์ตอนเปิด: ← → / A D เลื่อน • Enter/Space เลือก • Esc ปิด • ปุ่มอื่นไม่ส่งต่อให้เกม
addEventListener('keydown',e=>{if(!MPK.on)return;const c=e.code;
  if(c==='ArrowLeft'||c==='KeyA')mpkStep(-1);else if(c==='ArrowRight'||c==='KeyD')mpkStep(1);
  else if(c==='Home')mpkTo(0);else if(c==='End')mpkTo(MPK.n-1);
  else if(c==='Enter'||c==='NumpadEnter'||c==='Space'){if(!e.repeat)mpkPick();}
  else if(c==='Escape')mpkClose();else{e.stopImmediatePropagation();return;}
  e.preventDefault();e.stopImmediatePropagation();},true);
addEventListener('resize',()=>{if(MPK.on){mpkMeasure();mpkLoop();}});
function mpkMeasure(){const c=MPK.ring&&MPK.ring.firstElementChild;if(c){MPK.W=c.offsetWidth||300;MPK.H=c.offsetHeight||400;}if(MPK.ring)MPK.ring.style.perspective=Math.round(MPK.W*2.3)+'px';MPK.ox=Math.round(MPK.W/2);MPK.oy=Math.round(MPK.H/2);}   // ox/oy เต็มพิกเซล = ตัวหนังสือใบกลางคม
function mpkIdx(){const n=MPK.n||1;return ((Math.round(MPK.tgt)%n)+n)%n;}
function mpkStep(d){if(!MPK.on||!MPK.n)return;let t=Math.round(MPK.tgt)+d;if(!MPK.wrap)t=Math.max(0,Math.min(MPK.n-1,t));MPK.tgt=t;mpkLoop();}
function mpkTo(i){if(!MPK.on||!MPK.n)return;if(MPK.wrap){const n=MPK.n;let d=i-mpkIdx();if(d>n/2)d-=n;if(d<-n/2)d+=n;MPK.tgt=Math.round(MPK.tgt)+d;}else MPK.tgt=i;mpkLoop();}
function mpkPick(i){
  if(!MPK.on||!MPK.n)return;if(i==null)i=mpkIdx();const k=MPK.keys[i],cb=MPK.o&&MPK.o.onPick;
  MPK.pick=i;const c=MPK.cards[i];if(c)c.el.classList.add('pk');mpkSnd('ui_click');
  try{if(cb)cb(k);}catch(err){console.error(err);}
  mpkClose();
}
function mpkOpen(o){
  o=o||{};if(!MPK.el)mpkBuild();MPK.o=o;
  const ks=['',...new Set([...RANDOM_MAPS,'forest',...Object.keys(MAPS).filter(k=>MAPS[k].fm)])].filter(k=>!k||(MAPS[k]&&(!o.mode||mapOkFor(k,o.mode))));
  MPK.keys=ks;MPK.n=ks.length;MPK.wrap=ks.length>=6;
  MPK.ring.innerHTML=ks.map(mpkCardHTML).join('');
  MPK.cards=[...MPK.ring.children].map((el,i)=>{const c={el,dim:el.querySelector('.mpkDim'),h:0,st:'',cc:null};const im=el.querySelector('.mpkPic');
    if(im){im.addEventListener('load',()=>el.classList.add('img'),{once:true});im.addEventListener('error',()=>{el.classList.add('noimg');im.remove();},{once:true});if(im.complete&&im.naturalWidth)el.classList.add('img');}
    return c;});
  MPK.dots.innerHTML=ks.map((k,i)=>`<i data-i="${i}" title="${esc(mpkName(k))}"></i>`).join('');MPK.dot=-1;
  MPK.pos=MPK.tgt=Math.max(0,ks.indexOf(o.cur||''));
  MPK.on=true;MPK.shut=0;MPK.pick=-1;MPK.hov=-1;MPK.drag=null;MPK.swallow=false;clearTimeout(MPK.hT);
  MPK.el.hidden=false;MPK.el.classList.remove('drag');void MPK.el.offsetWidth;MPK.el.classList.add('on');
  try{const a=document.activeElement;if(a&&a!==document.body&&a.blur)a.blur();}catch(e){}   // ช่องพิมพ์ข้างหลังไม่รับตัวอักษรต่อ
  mpkMeasure();MPK.t0=MPK.last=performance.now();mpkLoop();
}
function mpkClose(){
  if(!MPK.on)return;MPK.on=false;MPK.drag=null;MPK.shut=performance.now();MPK.el.classList.remove('on','drag');mpkLoop();
  clearTimeout(MPK.hT);MPK.hT=setTimeout(()=>{if(!MPK.on){MPK.el.hidden=true;MPK.ring.innerHTML='';MPK.cards=[];}},620);
}
function mpkLoop(){if(!MPK.raf&&MPK.el&&!MPK.el.hidden)MPK.raf=requestAnimationFrame(mpkTick);}
// วางการ์ดตามระยะจากตรงกลาง d: ข้างละ ~2 ใบ หมุน Y 34°→40° ถอยหลัง มืดลง • ตอนเปิดบินจากกลางด้านหลังกางเป็นโค้ง (ใบกลางก่อน)
function mpkTick(now){
  MPK.raf=0;if(!MPK.el||MPK.el.hidden||!MPK.cards.length)return;
  const dt=Math.min(.05,Math.max(0,(now-MPK.last)/1000));MPK.last=now;
  const D=MPK.drag,dragging=D&&D.moved;
  if(!dragging){MPK.pos+=(MPK.tgt-MPK.pos)*(1-Math.exp(-dt*9));if(Math.abs(MPK.tgt-MPK.pos)<.0006)MPK.pos=MPK.tgt;}
  const W=MPK.W,H=MPK.H,n=MPK.n,T=(now-MPK.t0)/1000,S=MPK.shut?(now-MPK.shut)/1000:-1,kh=1-Math.exp(-dt*12);
  let busy=dragging||MPK.pos!==MPK.tgt||T<1.6||S>=0;
  for(let i=0;i<n;i++){const c=MPK.cards[i];let d=i-MPK.pos;if(MPK.wrap){d=((d%n)+n)%n;if(d>n/2)d-=n;}
    const ad=Math.abs(d),sg=d<0?-1:1,q=Math.min(ad,3.4);
    c.h+=((i===MPK.hov&&MPK.on?1:0)-c.h)*kh;if(Math.abs(c.h-(i===MPK.hov?1:0))>.002)busy=true;
    let x=sg*W*(.9*q-.02*q*q),z=-W*(.55*q-.05*q*q),ry=sg*(34*Math.min(q,1)+6*Math.max(0,Math.min(q,2)-1)),y=0;
    let op=ad<2.3?1:Math.max(0,1-(ad-2.3)/.6),dim=Math.min(ad,2.6)*.28*(1-.5*c.h);
    if(ad>.5)z+=c.h*W*.06;
    if(S<0){const e=mpkE(mpkC((T-.05-.075*Math.min(ad,4))/.9));x*=.22+.78*e;z-=(1-e)*W*1.1;y+=(1-e)*H*.14;ry*=.3+.7*e;op*=mpkC(e*1.7);}
    else if(i===MPK.pick){const e=mpkC(S/.5);z+=mpkE(e)*W*.16;y-=mpkE(e)*H*.03;op*=1-e*e;}
    else{const e=mpkC((S-.03*(3-Math.min(ad,3)))/.36),f=e*e;x*=1-.25*f;z-=f*W*.7;y+=f*H*.1;op*=1-f;}
    const tr=`translate3d(${(x-MPK.ox).toFixed(1)}px,${(y-MPK.oy).toFixed(1)}px,${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg)`,key=tr+op.toFixed(3)+dim.toFixed(3);
    if(key!==c.st){c.st=key;const s=c.el.style;s.transform=tr;s.opacity=op.toFixed(3);s.zIndex=String(300-Math.round(ad*40));s.pointerEvents=op<.25?'none':'';c.dim.style.opacity=dim.toFixed(3);}
    const cc=ad<.5;if(cc!==c.cc){c.cc=cc;c.el.classList.toggle('c',cc);}
  }
  const di=((Math.round(MPK.pos)%n)+n)%n;if(di!==MPK.dot){if(MPK.dot>=0&&MPK.on)mpkSnd('ui_hover',.35);MPK.dot=di;[...MPK.dots.children].forEach((e,j)=>e.classList.toggle('on',j===di));
    MPK.el.querySelectorAll('.mpkArr').forEach(b=>b.classList.toggle('off',!MPK.wrap&&(+b.dataset.d<0?di===0:di===n-1)));}
  if(busy)mpkLoop();
}
if(typeof WD!=='undefined')WD.mpkOpen=mpkOpen;
