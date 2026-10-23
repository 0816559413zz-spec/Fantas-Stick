// =====================================================================
//  UI รอบ 3 (ผู้ใช้ 2026-10-23 — สเปก designs/ui-menu.md "รอบ 3") • สไตล์เดียวกับเมนูใหม่ (css/hub.css --h-*) • CSS ใน css/ui3.css
//  uiGalaxy(host)  พื้นกาแล็กซี + ประกาย (canvas วาดเฉพาะตอนเปิดอยู่) — ใช้กับเมนูหยุดเกม / สรุปหลังเกม / ตารางคะแนน
//  uiShow(el) / uiHide(el,done)  เปิด = คลาส .in (CSS เล่นเข้า) • ปิด = .out เล่นย้อน แล้วค่อยซ่อน (กฎผู้ใช้: ปุ่มกลับ = แอนิเมชันย้อน)
// =====================================================================
const UIG=new Set();
function uiGalaxy(host,opt){
  const c=document.createElement('canvas');c.className='uiGal';host.prepend(c);
  const o=Object.assign({stars:150,glints:7,neb:['rgba(120,90,255,.20)','rgba(60,150,255,.14)','rgba(200,90,220,.10)']},opt||{});
  const G={c,g:c.getContext('2d'),o,w:0,h:0,S:[],L:[],t:0,on:false,seed:Math.random()*100};
  const fit=()=>{const r=host.getBoundingClientRect(),w=Math.max(2,Math.round(r.width)),h=Math.max(2,Math.round(r.height));if(w===G.w&&h===G.h)return;
    G.w=c.width=w;G.h=c.height=h;G.S=[];for(let i=0;i<o.stars;i++)G.S.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()<0.1?1.4:0.4+Math.random()*0.7,p:Math.random()*7,s:0.5+Math.random()*2});};
  G.fit=fit;UIG.add(G);return G;
}
function uiGalaxyOn(G,on){G.on=on;if(on){G.fit();uiGalDraw(G,0);uiGalLoop();}}   // วาดเฟรมแรกทันที (ไม่ต้องรอ rAF)
let uiGalRaf=0,uiGalT=0;
function uiGalLoop(){if(uiGalRaf)return;uiGalT=performance.now();const f=now=>{const dt=Math.min(0.05,(now-uiGalT)/1000);uiGalT=now;let any=false;
    for(const G of UIG)if(G.on){any=true;uiGalDraw(G,dt);}uiGalRaf=any?requestAnimationFrame(f):0;};uiGalRaf=requestAnimationFrame(f);}
function uiGalDraw(G,dt){
  G.fit();const g=G.g,w=G.w,h=G.h,t=(G.t+=dt);
  const bg=g.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#070a1d');bg.addColorStop(0.55,'#0b0d2a');bg.addColorStop(1,'#140b2b');g.fillStyle=bg;g.fillRect(0,0,w,h);
  // เนบิวลา 3 ก้อนลอยช้า ๆ
  G.o.neb.forEach((col,i)=>{const x=w*(0.25+0.5*((i*0.37+0.5+0.08*Math.sin(t*0.07+i*2))%1)),y=h*(0.3+0.4*((i*0.61+0.3+0.06*Math.cos(t*0.05+i))%1)),r=Math.max(w,h)*(0.45+0.1*i);
    const rg=g.createRadialGradient(x,y,0,x,y,r);rg.addColorStop(0,col);rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.fillRect(0,0,w,h);});
  // ดาวพื้นหลัง กะพริบ
  for(const s of G.S){const a=0.35+0.65*Math.max(0,Math.sin(t*s.s+s.p));g.fillStyle='rgba(225,230,255,'+(a*0.8).toFixed(3)+')';g.beginPath();g.arc(s.x,s.y,s.r,0,7);g.fill();}
  // ประกายแฉก 4 ทิศ เกิด-ดับเป็นช่วง ๆ
  if(G.L.length<G.o.glints&&Math.random()<dt*3)G.L.push({x:Math.random()*w,y:Math.random()*h,t:0,T:1.2+Math.random()*1.4,k:6+Math.random()*10,c:Math.random()<0.5?'200,190,255':'170,225,255'});
  g.globalCompositeOperation='lighter';
  G.L=G.L.filter(L=>{L.t+=dt;const u=L.t/L.T;if(u>=1)return false;const a=Math.sin(u*Math.PI),k=L.k*(0.6+0.4*a);
    const rg=g.createRadialGradient(L.x,L.y,0,L.x,L.y,k*1.6);rg.addColorStop(0,'rgba('+L.c+','+(0.5*a).toFixed(3)+')');rg.addColorStop(1,'rgba('+L.c+',0)');g.fillStyle=rg;g.fillRect(L.x-k*2,L.y-k*2,k*4,k*4);
    g.strokeStyle='rgba(255,255,255,'+(0.85*a).toFixed(3)+')';g.lineWidth=1;g.beginPath();g.moveTo(L.x-k,L.y);g.lineTo(L.x+k,L.y);g.moveTo(L.x,L.y-k);g.lineTo(L.x,L.y+k);g.stroke();return true;});
  g.globalCompositeOperation='source-over';
}
// เปิด/ปิดแบบมีแอนิเมชัน (ปิด = .out เล่นย้อน แล้วค่อย .hidden)
function uiShow(el){clearTimeout(el._u3t);el.classList.remove('hidden','out');void el.offsetWidth;el.classList.add('in');if(el._gal)uiGalaxyOn(el._gal,true);}
function uiHide(el,done,ms){if(el.classList.contains('hidden')){if(done)done();return;}el.classList.remove('in');el.classList.add('out');clearTimeout(el._u3t);
  el._u3t=setTimeout(()=>{el.classList.add('hidden');el.classList.remove('out');if(el._gal)uiGalaxyOn(el._gal,false);if(done)done();},ms||300);}

// ---------- เมนูหยุดเกม ----------
{const el=$('#pause');el._gal=uiGalaxy(el.querySelector('.u3Box'));}
if(typeof WD!=='undefined')Object.assign(WD,{uiGalaxy,uiShow,uiHide,showPause,hidePause});

// ---------- คู่มือ (แบบ Skill Tree) ----------
// ฟองหัวข้อบนเส้นโค้งด้านล่าง → คลิก = ฟองบินขึ้นเป็นหัวข้อบนสุด + กล่องข้อมูล + รูปขวาเปลี่ยน (assets/ui/guide/<k>.jpg)
// ⚠ หัวข้อ/ข้อความ/ไอคอน Claude เลือกเอง (ผู้ใช้ให้ทำ) • หน้าสายเวท = ดึงชื่อ/คูลดาวน์/คำอธิบายจาก PATHS + SPELL_LIST (ตรงกับเกมเสมอ)
const GICO={
  welcome:'<path d="M12 2.5l1.9 6.2 6.6.1-5.3 3.9 2 6.3L12 15.1 6.8 19l2-6.3L3.5 8.8l6.6-.1z"/>',
  controls:'<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M12 3v6M7 9h10"/>',
  shield:'<path d="M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  pyro:'<path d="M12 21c-3.9 0-6.5-2.7-6.5-6.2 0-3.4 2.6-5.3 3.4-8.8 1.9 1.6 2.6 3.4 2.6 5.1 1.2-.9 1.8-2.4 1.7-4.2 2.7 2 5.3 4.9 5.3 8.1 0 3.4-2.6 6-6.5 6z"/><path d="M12 21c-1.7 0-2.8-1.2-2.8-2.7 0-1.7 1.4-2.6 2.1-4.2 1.6 1.2 3.5 2.3 3.5 4.2 0 1.5-1.1 2.7-2.8 2.7z"/>',
  frost:'<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/><path d="M9.5 3.8L12 6l2.5-2.2M9.5 20.2L12 18l2.5 2.2M4 10.3l3.2-1L6.5 6M17.5 18l-.7-3.3 3.2-1M4 13.7l3.2 1-.7 3.3M17.5 6l-.7 3.3 3.2 1"/>',
  storm:'<path d="M13.5 2L5 13.5h6L9.5 22 19 9.8h-6.2z"/>',
  earth:'<path d="M2.5 20l6-10 3.5 5 3-4 6.5 9z"/><path d="M8.5 10l1.6 3.2M15 11l1.4 2.4"/>',
  modes:'<path d="M4 4l9 9M4 4v4M4 4h4M20 4l-9 9M20 4v4M20 4h-4M7.5 13.5l3 3M16.5 13.5l-3 3M5 19l3.5-3.5M19 19l-3.5-3.5"/>',
  friends:'<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5M14.5 14.3c.6-.2 1.3-.3 2-.3 2.3 0 4 1.4 4.5 4.5"/>',
  credits:'<path d="M5 4h11l3 3v13H5z"/><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4.5"/>'};
const GROW=(k,v)=>`<div class="gRow"><kbd>${k}</kbd><span>${v}</span></div>`;
const GPATH=pi=>{const P=PATHS[pi];if(!P)return '';const sp=SPELL_LIST.filter(s=>s.path===pi&&!s.ult),ul=SPELL_LIST.find(s=>s.path===pi&&s.ult);
  const one=s=>`<div class="gSp"><b>${esc(s.n)}</b><em>${s.cd?s.cd+' วิ':''}</em><p title="${esc(s.d||'')}">${esc(s.d||'')}</p></div>`;
  return `<p class="gLead">${esc(P.d||'')}</p>${P.combo?`<p class="gTip"><b>คอมโบ</b> ${esc(P.combo)}</p>`:''}
    <h4>คาถาของสาย <i>${sp.length}</i></h4><div class="gSps">${sp.map(one).join('')}</div>${ul?`<h4>เวทโบราณ (X)</h4><div class="gSps one">${one(ul)}</div>`:''}`;};
const GUIDE=[
  {k:'welcome',en:'Welcome',th:'เริ่มต้น',html:()=>`<p class="gLead">ดวลเวทมนตร์ 4 ธาตุ — ไฟ น้ำแข็ง สายฟ้า ดิน — เล่นกับเพื่อนได้สูงสุด 6 คนในห้องเดียว ผ่านเว็บ ไม่ต้องติดตั้ง</p>
    <ol class="gSteps"><li><b>สร้างตัวละคร</b>แต่งหน้าตา เลือกไม้กายสิทธิ์ และสายเวทหลัก</li><li><b>กด เล่น</b>หยิบไม้แล้วเลือกโหมดจากการ์ด — ห้องถูกสร้างให้ทันที</li><li><b>ชวนเพื่อน</b>ส่งรหัสห้อง 5 ตัวให้เพื่อน แล้วกดเริ่ม</li><li><b>จัดคาถา</b>ปุ่ม จัดคาถา (GRIMOIRE) เลือกคาถา 4 ช่อง Q E R F</li></ol>
    <p class="gTip"><b>เริ่มตรงไหนดี</b> เข้า <b>Training</b> ก่อน — มีหุ่นซ้อมให้ลองคาถาทุกอัน และปิดคูลดาวน์ได้</p>`},
  {k:'controls',en:'Controls',th:'ปุ่มควบคุม',html:()=>`<div class="gRows">${[
    ['คลิกที่จอ','ล็อกเมาส์ หมุนกล้อง (Esc = ปล่อยเมาส์ / เมนู)'],['W A S D','เดิน'],['คลิกซ้าย','ยิงเวทพื้นฐาน (กดค้างได้)'],['คลิกขวาค้าง','ยกโล่ — จังหวะพอดี = Parry'],
    ['Q E R F','คาถา 4 ช่องที่จัดไว้'],['Shift','หลบ / พุ่ง (แต่ละสายต่างกัน)'],['Space','กระโดด (บนไม้กวาด = บินขึ้น)'],['X','เวทโบราณ เมื่อเกจทองเต็ม'],
    ['B','ขึ้น / ลงไม้กวาด — บินเร็วแต่ร่ายไม่ได้'],['C','บินต่ำลง (บนไม้กวาด)'],['G','ใช้ของ / เปิดหีบ'],['Tab','ตารางคะแนน'],['T','กดค้างพูดไมค์'],['M / N','เปิดปิดเพลง / เปลี่ยนเพลง']].map(r=>GROW(...r)).join('')}</div>`},
  {k:'shield',b:'Shield',en:'Shield & Parry',th:'โล่และการสะท้อน',html:()=>`<p class="gLead">กดคลิกขวาค้างเพื่อยกโล่ด้านหน้า กันเวทที่พุ่งมาได้จนกว่าโล่จะแตก แล้วโล่ค่อย ๆ ฟื้นเอง</p>
    <div class="gBig"><b>0.28</b><span>วินาที<br>ช่วง Parry</span></div><p>ยกโล่ <b>ตอนเวทกำลังจะโดนพอดี</b> = Parry — เวทสะท้อนกลับไปหาคนยิง</p>
    <p class="gTip"><b>ระวัง</b> ระหว่างยกโล่ร่ายคาถาไม่ได้ และแต่ละสายมีโล่ไม่เหมือนกัน — ลองใน Training</p>`},
  {k:'pyro',en:'Pyro',th:'สายไฟ',html:()=>GPATH(0)},
  {k:'frost',en:'Frost',th:'สายน้ำแข็ง',html:()=>GPATH(1)},
  {k:'storm',en:'Storm',th:'สายสายฟ้า',html:()=>GPATH(2)},
  {k:'earth',en:'Earth',th:'สายดิน',html:()=>GPATH(PATHS.findIndex(p=>p.id==='earth'))},
  {k:'modes',b:'Modes',en:'Game Modes',th:'โหมดเกม',html:()=>`<div class="gModes">${HMODES.map(m=>`<div class="gMode"><b>${esc(m.en)}</b><i>${esc(m.n)} คน</i><span>${esc(m.th)}</span><p>${esc(m.d)}</p></div>`).join('')}</div>
    <p class="gTip"><b>ดันเจียน</b> ผ่านแต่ละชั้นได้เลือกการ์ดพลังเสริม • ทุก 5 ชั้นเจอบอส</p>`},
  {k:'friends',b:'Friends',en:'Play Together',th:'เล่นกับเพื่อน',html:()=>`<ol class="gSteps"><li><b>สร้างห้อง</b>กด เล่น แล้วเลือกการ์ดโหมด — ได้รหัสห้อง 5 ตัว (กดคัดลอกได้)</li><li><b>ส่งรหัส</b>เพื่อนใส่รหัสที่ช่อง <b>เข้าห้องเพื่อน</b> หน้าแรก หรือช่องรหัสมุมขวาล่าง</li><li><b>เริ่มเกม</b>เจ้าของห้องเลือกแผนที่ แล้วกด START</li><li><b>คุยกัน</b>ปุ่มไมค์ในห้อง แล้วกด T ค้างตอนพูด</li></ol>
    <p class="gTip"><b>เข้าไม่ได้?</b> เช็กรหัส • ให้เจ้าของห้องสร้างใหม่ • ปิด VPN • ห้องละไม่เกิน 6 คน</p>`},
  {k:'credits',en:'Credits',th:'เครดิต',html:()=>`<div class="gCred">${$('#gCredits').innerHTML}</div>`},
];
const GD={cur:-1,pic:0,t:0};
function guideBuild(){
  const el=$('#guide');if(el._built)return;el._built=true;
  el.querySelector('.gBubs').innerHTML=GUIDE.map((g,i)=>`<button class="gBub" data-i="${i}" style="--i:${i}"><span class="gRing"><svg viewBox="0 0 24 24">${GICO[g.k]}</svg></span><b>${g.b||g.en}</b><small>${g.th}</small></button>`).join('');
  el.querySelector('.gBubs').addEventListener('click',e=>{const b=e.target.closest('.gBub');if(b){ac();snd('ui_click');guideGo(+b.dataset.i,true);}});
  addEventListener('resize',()=>{if(!el.classList.contains('hidden'))guideLayout();});
  addEventListener('keydown',e=>{if(el.classList.contains('hidden')||el.classList.contains('out'))return;
    if(e.code==='Escape'){e.stopImmediatePropagation();guideClose();}
    else if(e.code==='ArrowRight'||e.code==='ArrowLeft'){guideGo((GD.cur+(e.code==='ArrowRight'?1:GUIDE.length-1))%GUIDE.length,true);}},true);
}
// วางฟองบนเส้นโค้ง (โค้งขึ้นตรงกลาง) ในแถบล่าง กว้างตามแถบ (CSS ให้แถบกว้าง ~62% ของจอ ฝั่งขวาเว้นให้รูป)
function guideLayout(){
  const el=$('#guide'),tr=el.querySelector('.gTrack'),W=tr.clientWidth,H=tr.clientHeight,bs=[...el.querySelectorAll('.gBub')],n=bs.length;
  const x0=W*0.05,x1=W*0.95,y0=H*0.66,sag=H*0.3;
  bs.forEach((b,i)=>{const u=n>1?i/(n-1):0.5;b.style.left=(x0+(x1-x0)*u)+'px';b.style.top=(y0-Math.sin(u*Math.PI)*sag)+'px';});
  let d=`M0 ${(y0+H*0.12).toFixed(1)}`;for(let i=0;i<=40;i++){const u=i/40;d+=` L${(x0+(x1-x0)*u).toFixed(1)} ${(y0-Math.sin(u*Math.PI)*sag).toFixed(1)}`;}d+=` L${W} ${(y0+H*0.12).toFixed(1)}`;
  const sv=el.querySelector('.gArc');sv.setAttribute('viewBox',`0 0 ${W} ${H}`);sv.querySelector('path').setAttribute('d',d);
}
function guideOpen(){
  guideBuild();const el=$('#guide');uiShow(el);guideLayout();
  if(GD.cur<0)guideGo(0,false);else{const k=GUIDE[GD.cur].k;$('#guide').querySelectorAll('.gPic i').forEach(i=>{if(i.dataset.k!==k)i.classList.remove('on');});guidePic(k);}
}
function guideClose(){uiHide($('#guide'),null,420);}
function guidePic(k){
  const L=[...$('#guide').querySelectorAll('.gPic i')],cu=L[GD.pic];if(cu.dataset.k===k){cu.classList.add('on');return;}
  const nx=L[1-GD.pic];nx.dataset.k=k;nx.style.backgroundImage=`url('${HUI_IMG}guide/${k}.jpg')`;nx.classList.remove('on');void nx.offsetWidth;nx.classList.add('on');cu.classList.remove('on');GD.pic=1-GD.pic;
}
// เลือกหัวข้อ: ฟองโคลนบินจากเส้นโค้งขึ้นไปที่ไอคอนหัวข้อ (FLIP) → ชื่อ + กล่องข้อมูลไล่เข้า
function guideGo(i,fly){
  if(i===GD.cur&&fly)return;const el=$('#guide'),g=GUIDE[i],prev=GD.cur;GD.cur=i;
  el.querySelectorAll('.gBub').forEach((b,j)=>b.classList.toggle('on',j===i));
  guidePic(g.k);
  const hd=el.querySelector('.gHead'),box=el.querySelector('.gBox'),hi=hd.querySelector('.gHi');
  const fill=()=>{hi.innerHTML=`<svg viewBox="0 0 24 24">${GICO[g.k]}</svg>`;hd.querySelector('small').textContent=g.th;hd.querySelector('b').textContent=g.en;
    box.innerHTML=g.html();box.scrollTop=0;hd.classList.remove('show','hide');box.classList.remove('show','hide');void box.offsetWidth;hd.classList.add('show');box.classList.add('show');};
  const bub=el.querySelector(`.gBub[data-i="${i}"] .gRing`);
  clearTimeout(GD.t);el.querySelectorAll('.gFly').forEach(f=>f.remove());
  if(!fly||!bub||prev<0){fill();return;}
  hd.classList.remove('show');box.classList.remove('show');hd.classList.add('hide');box.classList.add('hide');
  const a=bub.getBoundingClientRect(),b=hi.getBoundingClientRect(),f=document.createElement('div');f.className='gFly';f.innerHTML=bub.innerHTML;
  Object.assign(f.style,{left:a.left+'px',top:a.top+'px',width:a.width+'px',height:a.height+'px'});el.appendChild(f);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{Object.assign(f.style,{left:b.left+'px',top:b.top+'px',width:b.width+'px',height:b.height+'px'});f.classList.add('go');}));
  GD.t=setTimeout(()=>{fill();f.classList.add('end');setTimeout(()=>f.remove(),260);},430);
}
if(typeof WD!=='undefined')Object.assign(WD,{guideOpen,guideClose,guideGo,GUIDE});
