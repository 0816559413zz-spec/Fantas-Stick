// =====================================================================
//  วงเลือกคาถา (ผู้ใช้ 2026-10-22, designs/ui-menu.md "วงคาถา + ห้าเหลี่ยม 4 ช่อง") • สไตล์มินิมอลหรู เส้นบาง (css/skillwheel.css)
//  บน = แถบเลือกสาย (สายที่เลือกเลื่อนมากลาง ใหญ่ + เรือง) • กลาง = วงกลมบาง คาถาของสายเรียงรอบวง (ลำดับคอมโบ ตามเข็ม)
//    ชี้ = ชื่อ+บทบาท+คูลดาวน์+คำอธิบายกลางวง • คลิก/ลาก = ใส่ช่องที่เลือกอยู่ แล้วเลื่อนไปช่องถัดไป
//  ซ้ายวง = ท่าประจำสาย (ยิงปกติ/โล่/พุ่ง/เวทโบราณ) • ขวาวง = คลังคาถา (ดูคาถาสายอื่น ใส่ได้ไม่เกิน 2 ช่อง)
//  ล่าง = ห้าเหลี่ยม Q E R F (คลิก/ปุ่ม Q E R F/1-4 = เลือกช่อง) • Esc / ✕ / เสร็จ = ปิด (เก็บชุดเสมอ)
//  API: skwOpen() • skwClose(save) → store wd_kit2 + lobbyKitSend() + hubKitChanged()
// =====================================================================
const SKW={el:null,on:false,slot:0,lib:0,ringLib:-1,ringPath:-1,arcPath:-1,ang:{},indA:0,indOn:false,hov:-1,hovT:0,swapT:0,raf:0,cv:null,parts:[],stars:[],last:0,infoK:'',col:'#a995ff'};
const SKW_PO='50,6 93.75,37.79 77.04,89.21 22.96,89.21 6.25,37.79',SKW_PI='50,14 86.14,40.26 72.34,82.74 27.66,82.74 13.86,40.26';   // ห้าเหลี่ยม นอก/ใน
const SKW_RUNE='ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
function skwPaths(){return PATHS.map((p,i)=>i).filter(i=>!PATHS[i].off&&SPELL_LIST.some(x=>x.path===i&&!x.ult));}
function skwKey(i){return keyName(KEYS[SLOTK[i]]||'Key'+'QERF'[i]);}
function skwOffN(k){return k.ids.filter(i=>SPELL_LIST[i].path!==k.path).length;}
function skwChanged(){if(typeof hubKitChanged==='function')try{hubKitChanged();}catch(e){console.warn(e);}}
function skwSnd(n){try{snd(n);}catch(e){}}
// ---------- โครง DOM (สร้างครั้งแรกที่เปิด) ----------
function skwSvg(){
  let tk='';for(let d=0;d<360;d+=3){const r2=d%45===0?90.5:d%15===0?88.6:87.3,a=d*Math.PI/180,s=Math.sin(a),c=-Math.cos(a);tk+=`M${(s*86).toFixed(2)},${(c*86).toFixed(2)}L${(s*r2).toFixed(2)},${(c*r2).toFixed(2)}`;}
  let dt='';for(let d=0;d<360;d+=4){const a=d*Math.PI/180;dt+=`M${(Math.sin(a)*61).toFixed(2)},${(-Math.cos(a)*61).toFixed(2)}l.01,0`;}
  const dia=[0,90,180,270].map(d=>`<path class="dm" transform="rotate(${d})" d="M0,-96L1.7,-93.6L0,-91.2L-1.7,-93.6Z"/>`).join('');
  const ru=Array.from({length:56},(_,i)=>SKW_RUNE[(i*7)%SKW_RUNE.length]).join(' ');
  return `<svg class="skwSvg" viewBox="-100 -100 200 200" aria-hidden="true"><defs><radialGradient id="skwGl"><stop offset="0" style="stop-color:var(--skc);stop-opacity:.16"/><stop offset=".7" style="stop-color:var(--skc);stop-opacity:.04"/><stop offset="1" style="stop-color:var(--skc);stop-opacity:0"/></radialGradient><path id="skwRp" d="M0,-68A68,68 0 1,1 -.01,-68"/></defs>
    <circle r="78" fill="url(#skwGl)"/><circle class="c1" r="80"/><circle class="c2" r="83.4"/><circle class="c2" r="56"/>
    <g class="rot1"><path class="tk" d="${tk}"/>${dia}</g><g class="rot2"><path class="dt" d="${dt}"/><text><textPath href="#skwRp">${ru}</textPath></text></g>
    <g class="skwInd"><path d="M-24.3,-76.2A80,80 0 0 1 24.3,-76.2"/><path class="e" d="M-23.2,-73.3L-25.4,-79.1M23.2,-73.3L25.4,-79.1"/></g></svg>`;
}
function skwBuild(){
  const el=document.createElement('div');el.id='skw';el.className='hidden';el.setAttribute('role','dialog');el.setAttribute('aria-label','เลือกคาถา');
  el.innerHTML=`<div class="skwBg"></div><canvas class="skwFx"></canvas>
    <div class="skwHead"><div class="skwTi"><b>Grimoire</b><small>จัดชุดคาถา</small></div><button type="button" class="skwX" data-x="1" title="ปิด (Esc)">✕</button></div>
    <div class="skwTop"><div class="skwRow"></div></div>
    <div class="skwMid"><div class="skwRing">${skwSvg()}<div class="skwFlash"></div><div class="skwArc skwArcL"></div><div class="skwArc skwArcR"></div><div class="skwSp"></div><div class="skwInfo"></div></div></div>
    <div class="skwBot"><button type="button" class="skwGuide">วิธีเล่นสายนี้ ›</button><div class="skwSlots"></div><button type="button" class="skwDone" data-x="1">เสร็จ</button></div>`;
  document.body.appendChild(el);SKW.el=el;SKW.cv=el.querySelector('.skwFx');
  el.addEventListener('click',skwClick);
  el.addEventListener('pointerover',skwOver);
  el.addEventListener('dragstart',e=>{const s=e.target.closest('[data-sp]');if(s){e.dataTransfer.setData('text/plain',s.dataset.sp);e.dataTransfer.effectAllowed='move';}});
  el.addEventListener('dragover',e=>{const t=e.target.closest('[data-slot]');if(t){e.preventDefault();t.classList.add('drop');}});
  el.addEventListener('dragleave',e=>{const t=e.target.closest('[data-slot]');if(t)t.classList.remove('drop');});
  el.addEventListener('drop',e=>{const t=e.target.closest('[data-slot]');if(!t)return;e.preventDefault();t.classList.remove('drop');const si=parseInt(e.dataTransfer.getData('text/plain'));if(isNaN(si))return;
    SKW.slot=+t.dataset.slot;skwAssign(si,SKW.el.querySelector(`.skwS[data-sp="${si}"]`));});
}
// ---------- วาด ----------
function skwRender(){
  const k=parseKit(myKit),P=PATHS[k.path];
  SKW.col=P.col;SKW.el.style.setProperty('--skc',P.col);
  skwRow(k);skwArcs(k);skwRing(k);skwSlots(k);skwInd();skwInfoDef();
}
function skwRow(k){
  const row=SKW.el.querySelector('.skwRow'),L=skwPaths();
  if(row.children.length!==L.length)row.innerHTML=L.map(i=>{const p=PATHS[i];return `<button type="button" class="skwC" data-cls="${i}" style="--c:${p.col}"><span class="skwE"><svg viewBox="-50 -50 100 100"><path class="hx" d="M0,-49L42.4,-24.5L42.4,24.5L0,49L-42.4,24.5L-42.4,-24.5Z"/><circle r="39"/></svg>${icoHTML('p_'+p.id,p.col,26)}</span><b>${p.id}</b><small>${p.n}</small></button>`;}).join('');
  const idx=Math.max(0,L.indexOf(k.path));
  [...row.children].forEach((b,j)=>{b.classList.toggle('on',j===idx);b.style.setProperty('--d',Math.abs(j-idx));});
  row.style.setProperty('--sh',(L.length-1)/2-idx);
}
// ซ้าย = ท่าประจำสาย • ขวา = คลังคาถา — เรียงตามส่วนโค้งของวง
function skwPos(th,side){const a=th*Math.PI/180;return `left:calc((var(--R) + var(--arc)) * ${(side*Math.cos(a)).toFixed(3)});top:calc((var(--R) + var(--arc)) * ${Math.sin(a).toFixed(3)})`;}
function skwArcs(k){
  const P=PATHS[k.path],L=skwPaths(),off=skwOffN(k);
  if(SKW.arcPath!==k.path){
    SKW.arcPath=k.path;const U=SPELL_LIST[k.ult];
    const it=[['b','b_'+P.id+(P.id==='frost'?'_m':''),'ยิงปกติ','คลิกซ้าย'],['s',hasIco('sh_'+P.id)?'sh_'+P.id:'b_'+P.id,'โล่','คลิกขวา'],['d',hasIco('dsh_'+P.id)?'dsh_'+P.id:'p_'+P.id,'พุ่ง',keyName(KEYS.dash||'ShiftLeft')],['u',U.id,U.n,'เวทโบราณ · '+keyName(KEYS.ult||'KeyX')]];
    SKW.el.querySelector('.skwArcL').innerHTML=`<div class="skwAT" style="${skwPos(-52,-1)}">ท่าประจำสาย</div>`+it.map(([w,ic,n,key],j)=>`<button type="button" class="skwKi${w==='u'?' ult':''}" data-base="${w}" style="--c:${P.col};--i:${j};${skwPos(-36+24*j,-1)}"><span class="skwKc">${icoHTML(ic,P.col,20)}</span><span class="skwKt"><b>${n}</b><em>${key}</em></span></button>`).join('');
    const ord=[k.path,...L.filter(i=>i!==k.path)],n=ord.length,st=n>1?Math.min(24,72/(n-1)):0;
    SKW.el.querySelector('.skwArcR').innerHTML=`<div class="skwAT" style="${skwPos(-52,1)}">คลังคาถา<small></small></div>`+ord.map((i,j)=>{const p=PATHS[i];return `<button type="button" class="skwLi" data-lib="${i}" style="--c:${p.col};--i:${j};${skwPos(-st*(n-1)/2+st*j,1)}"><span class="skwKc">${icoHTML('p_'+p.id,p.col,18)}</span><span class="skwKt"><b>${p.n.replace(/^สาย/,'')}</b><em>${i===k.path?'สายหลัก':'สายอื่น'}</em></span></button>`;}).join('');
  }
  SKW.el.querySelectorAll('.skwLi').forEach(b=>b.classList.toggle('on',+b.dataset.lib===SKW.lib));
  const sm=SKW.el.querySelector('.skwArcR .skwAT small');if(sm)sm.textContent=`สายอื่น ${off}/2`;
}
// วงคาถา: สร้างใหม่เมื่อเปลี่ยนสาย/คลัง (มีแอนิเมชันบินเข้า) • ไม่งั้นแค่อัปเดตสถานะ (ป้ายปุ่ม/เรือง/ล็อก)
function skwRing(k){
  const box=SKW.el.querySelector('.skwSp');
  if(SKW.ringLib!==SKW.lib||SKW.ringPath!==k.path){
    SKW.ringLib=SKW.lib;SKW.ringPath=k.path;SKW.ang={};
    const L=SPELL_LIST.filter(x=>x.path===SKW.lib&&!x.ult).sort((a,b)=>ROLE_ORDER.indexOf(a.role)-ROLE_ORDER.indexOf(b.role)),n=L.length;
    box.innerHTML=L.map((S,j)=>{
      const a=j*360/n,c=Math.cos(a*Math.PI/180)*-1,c2=PATHS[S.path].col;SKW.ang[S.i]=a;
      // ชื่อใต้ไอคอน (ตัวล่างสุด = เหนือไอคอน ไม่ชนห้าเหลี่ยม) — ไม่วางข้างๆ เพราะชนคอลัมน์ซ้าย/ขวา
      const up=c>0.9;
      return `<button type="button" class="skwS in${up?' up':''}" data-sp="${S.i}" draggable="true" style="--a:${a.toFixed(2)}deg;--c:${c2};--i:${j}"><span class="skwSi">${icoHTML(S.id,c2,28)}<i class="skwK"></i></span><span class="skwSl">${S.n}</span></button>`;
    }).join('');
  }
  const off=skwOffN(k),actOwn=SPELL_LIST[k.ids[SKW.slot]].path===k.path;
  box.querySelectorAll('.skwS').forEach(b=>{
    const si=+b.dataset.sp,S=SPELL_LIST[si],e=k.ids.indexOf(si);
    b.classList.toggle('eq',e>=0);b.classList.toggle('act',e===SKW.slot);
    b.classList.toggle('blk',e<0&&S.path!==k.path&&off>=2&&actOwn);
    b.querySelector('.skwK').textContent=e>=0?skwKey(e):'';
  });
}
// เปลี่ยนวง: คาถาเดิมบินออก (ทีละตัว) แล้วชุดใหม่บินเข้า
function skwSwap(fn){
  const box=SKW.el.querySelector('.skwSp');
  box.querySelectorAll('.skwS').forEach(b=>{b.classList.remove('in');b.classList.add('out');});
  SKW.indOn=false;skwIndApply();
  clearTimeout(SKW.swapT);SKW.swapT=setTimeout(()=>{fn();skwRender();},230);
}
function skwSlots(k){
  const box=SKW.el.querySelector('.skwSlots'),first=!box.children.length;
  if(first)box.innerHTML=[0,1,2,3].map(i=>`<button type="button" class="skwP" data-slot="${i}" style="--i:${i}"><span class="skwPg"><svg viewBox="0 0 100 100" aria-hidden="true"><polygon class="o" points="${SKW_PO}"/><polygon class="n" points="${SKW_PI}"/></svg><span class="skwPi"></span></span><b class="skwPk"></b><small class="skwPn"></small></button>`).join('');
  [...box.children].forEach((b,i)=>{
    const S=SPELL_LIST[k.ids[i]],c=PATHS[S.path].col;
    b.style.setProperty('--c',c);b.classList.toggle('on',i===SKW.slot);b.classList.toggle('oth',S.path!==k.path);
    b.querySelector('.skwPk').textContent=skwKey(i);
    if(b.dataset.s!==String(S.i)){
      const was=b.dataset.s!==undefined;b.dataset.s=S.i;
      b.querySelector('.skwPi').innerHTML=icoHTML(S.id,c,30);b.querySelector('.skwPn').textContent=S.n;
      if(was&&!first){b.classList.remove('land');void b.offsetWidth;b.classList.add('land');}
    }
  });
}
// เส้นโค้งเรืองบนวง ชี้คาถาที่เมาส์อยู่ (หรือคาถาในช่องที่เลือก)
function skwInd(){
  const k=parseKit(myKit),si=SKW.hov>=0?SKW.hov:k.ids[SKW.slot],a=SKW.ang[si];
  if(a===undefined){SKW.indOn=false;skwIndApply();return;}
  let d=((a-SKW.indA)%360+540)%360-180;SKW.indA+=d;SKW.indOn=true;
  SKW.el.querySelector('.skwSvg').style.setProperty('--ic',PATHS[SPELL_LIST[si].path].col);skwIndApply();
}
function skwIndApply(){const g=SKW.el.querySelector('.skwInd');g.style.transform=`rotate(${SKW.indA}deg)`;g.style.opacity=SKW.indOn?1:0;}
// ---------- ข้อความกลางวง ----------
function skwSetInfo(key,html){
  if(SKW.infoK===key)return;SKW.infoK=key;const el=SKW.el.querySelector('.skwInfo');
  el.innerHTML=html;el.classList.remove("skwNew");void el.offsetWidth;el.classList.add("skwNew");
}
function skwSpellInfo(S,cap,hint){
  const P=PATHS[S.path],k=parseKit(myKit),t=[`<i class="r" style="--rc:${ROLE_COL[S.role]||'#fff'}">${ROLE_N[S.role]||''}</i>`];
  t.push(S.ult?`<i class="r" style="--rc:#ffe27a">กด ${keyName(KEYS.ult||'KeyX')}</i>`:`<i>คูลดาวน์ ${S.cd} วิ</i>`);
  if(S.melee)t.push('<i>เฉพาะโหมดประชิด</i>');if(S.dual)t.push('<i>เปลี่ยนตามโหมด</i>');
  if(S.path!==k.path)t.push(`<i class="r" style="--rc:${P.col}">${P.n}</i>`);
  return `<div class="skwCap">${cap||''}</div><h2 class="skwNm" style="--c:${P.col}">${S.n}</h2><div class="skwTg">${t.join('')}</div><div class="skwOrn" style="--c:${P.col}"></div><p class="skwDs">${S.d}</p>${hint?`<div class="skwHint" style="--c:${P.col}">${hint}</div>`:''}`;
}
function skwBaseInfo(w){
  const k=parseKit(myKit),P=PATHS[k.path],B=PBASIC[k.path]||PBASIC[0];
  if(w==='u')return skwSpellInfo(SPELL_LIST[k.ult],'ท่าประจำสาย · เวทโบราณ');
  const T={b:['Basic Attack','ยิงปกติ — '+B.n,B.d,'คลิกซ้าย'],s:['Shield','โล่',B.shd||'โล่: เหมือนทุกสาย (Parry 0.28 วิ ปัดกระสุนทิ้ง)','คลิกขวา'],
    d:['Dash','พุ่ง / กระโดด',(B.dsd||'พุ่ง: เหมือนทุกสาย (คูลดาวน์ 2.5 วิ)')+' • Space = กระโดด (ทุกสาย)',keyName(KEYS.dash||'ShiftLeft')]}[w];
  return `<div class="skwCap">ท่าประจำสาย · ${T[3]}</div><h2 class="skwNm" style="--c:${P.col}">${T[0]}</h2><div class="skwTg"><i class="r" style="--rc:${P.col}">${T[1]}</i></div><div class="skwOrn" style="--c:${P.col}"></div><p class="skwDs">${T[2]}</p>`;
}
function skwClassInfo(i){
  const P=PATHS[i],cur=parseKit(myKit).path===i;
  return `<div class="skwCap">${cur?'สายของคุณ':'สาย'}</div><h2 class="skwNm" style="--c:${P.col}">${P.id.toUpperCase()}</h2><div class="skwTg"><i class="r" style="--rc:${P.col}">${P.n}</i></div><div class="skwOrn" style="--c:${P.col}"></div><p class="skwDs">${P.d}</p>${P.combo?`<p class="skwFl">✦ ${P.combo}</p>`:''}${cur?'':`<div class="skwHint" style="--c:${P.col}">คลิกเพื่อเปลี่ยนสาย · ชุดคาถาจะเริ่มใหม่</div>`}`;
}
function skwLibInfo(i){
  const P=PATHS[i],k=parseKit(myKit),own=i===k.path;
  return `<div class="skwCap">คลังคาถา</div><h2 class="skwNm" style="--c:${P.col}">${P.id.toUpperCase()}</h2><div class="skwTg"><i class="r" style="--rc:${P.col}">${P.n}</i><i>${own?'สายหลัก':'สายอื่น · ใส่แล้ว '+skwOffN(k)+'/2'}</i></div><div class="skwOrn" style="--c:${P.col}"></div><p class="skwDs">${own?'คาถาของสายคุณ — ใส่ได้ทั้ง 4 ช่อง':'ยืมคาถาของสายนี้มาใช้ได้ — คาถาสายอื่นรวมกันใส่ได้ไม่เกิน 2 ช่อง'}</p><div class="skwHint" style="--c:${P.col}">${SKW.lib===i?'กำลังดูคลังนี้':'คลิกเพื่อดูคาถาสายนี้'}</div>`;
}
function skwInfoDef(){const k=parseKit(myKit),S=SPELL_LIST[k.ids[SKW.slot]];skwSetInfo('d'+S.i+'.'+SKW.slot,skwSpellInfo(S,'ช่อง '+skwKey(SKW.slot)+' · ช่องที่เลือกอยู่'));}
function skwSpellHover(si){
  const k=parseKit(myKit),S=SPELL_LIST[si],e=k.ids.indexOf(si),key=skwKey(SKW.slot);
  const blk=e<0&&S.path!==k.path&&skwOffN(k)>=2&&SPELL_LIST[k.ids[SKW.slot]].path===k.path;
  const hint=e===SKW.slot?`อยู่ในช่อง ${key} แล้ว`:blk?'คาถาสายอื่นใส่ครบ 2 ช่องแล้ว':e>=0?`คลิก = ย้ายมาช่อง ${key} (สลับกับช่อง ${skwKey(e)})`:`คลิก = ใส่ช่อง ${key}`;
  skwSetInfo('s'+si+'.'+SKW.slot+'.'+k.str,skwSpellInfo(S,e>=0?'ใส่อยู่ช่อง '+skwKey(e):S.path===k.path?'คาถาของสาย':'คาถาสายอื่น',hint));
}
function skwOver(e){
  const t=e.target.closest('[data-sp],[data-base],[data-cls],[data-lib],[data-slot]');
  clearTimeout(SKW.hovT);
  if(!t){SKW.hovT=setTimeout(()=>{if(SKW.hov!==-1){SKW.hov=-1;skwInd();}skwInfoDef();},110);return;}
  const d=t.dataset,h=d.sp!==undefined?+d.sp:-1;
  if(h!==SKW.hov){SKW.hov=h;skwInd();}
  if(d.sp!==undefined)skwSpellHover(+d.sp);
  else if(d.base)skwSetInfo('b'+d.base+SKW.arcPath,skwBaseInfo(d.base));
  else if(d.cls!==undefined)skwSetInfo('c'+d.cls+'.'+parseKit(myKit).path,skwClassInfo(+d.cls));
  else if(d.lib!==undefined)skwSetInfo('l'+d.lib+'.'+SKW.lib+'.'+myKit,skwLibInfo(+d.lib));
  else if(d.slot!==undefined){const k=parseKit(myKit),i=+d.slot,S=SPELL_LIST[k.ids[i]];skwSetInfo('p'+i+'.'+S.i+'.'+SKW.slot,skwSpellInfo(S,'ช่อง '+skwKey(i)+(i===SKW.slot?' · ช่องที่เลือกอยู่':''),i===SKW.slot?'เลือกคาถาบนวงเพื่อใส่ช่องนี้':'คลิกเพื่อเลือกช่องนี้'));}
}
// ---------- การกระทำ ----------
function skwClick(e){
  if(e.target.closest('[data-x]')){skwClose(true);return;}
  if(e.target.closest('.skwGuide')){tutOpen(parseKit(myKit).path);return;}
  const c=e.target.closest('[data-cls]');if(c){skwSetPath(+c.dataset.cls);return;}
  const l=e.target.closest('[data-lib]');if(l){skwSetLib(+l.dataset.lib);return;}
  const s=e.target.closest('[data-slot]');if(s){skwSetSlot(+s.dataset.slot);return;}
  const sp=e.target.closest('[data-sp]');if(sp){skwAssign(+sp.dataset.sp,sp);return;}
  const b=e.target.closest('[data-base]');if(b){const r=b.querySelector('.skwKc').getBoundingClientRect();skwBurst(r.left+r.width/2,r.top+r.height/2,SKW.col,10);}
}
function skwSetSlot(i){SKW.slot=(i+4)%4;SKW.infoK='';const k=parseKit(myKit);skwRing(k);skwSlots(k);skwInd();skwInfoDef();skwSnd('ui_click');}
function skwSetPath(i){
  if(parseKit(myKit).path===i||PATHS[i].off)return;
  myKit=cleanKit(String(i));SKW.slot=0;SKW.infoK='';
  const f=SKW.el.querySelector('.skwFlash');f.style.setProperty('--fc',PATHS[i].col);f.classList.remove('go');void f.offsetWidth;f.classList.add('go');
  skwRow(parseKit(myKit));SKW.el.style.setProperty('--skc',PATHS[i].col);SKW.col=PATHS[i].col;
  skwSwap(()=>{SKW.lib=i;SKW.arcPath=-1;});skwSnd('buff');skwChanged();
}
function skwSetLib(i){if(SKW.lib===i)return;SKW.infoK='';skwSwap(()=>{SKW.lib=i;});skwSnd('ui_click');}
function skwAssign(si,node){
  const k=parseKit(myKit),ids=k.ids.slice(),slot=SKW.slot,cur=ids.indexOf(si);
  const pg=SKW.el.querySelector(`.skwP[data-slot="${slot}"]`);
  if(ids[slot]===si){skwFlashSlot(pg);skwSetSlot(slot+1);return;}
  if(cur>=0)ids[cur]=ids[slot];
  ids[slot]=si;
  const nk=cleanKit([k.path,...ids].join('.'));
  if(parseKit(nk).ids[slot]!==si){toast('คาถาสายอื่นใส่ได้ไม่เกิน 2 ช่อง');if(node){node.classList.remove('no');void node.offsetWidth;node.classList.add('no');}return;}
  myKit=nk;
  if(node)skwGhost(node,pg,SPELL_LIST[si]);
  SKW.slot=(slot+1)%4;SKW.infoK='';
  const k2=parseKit(myKit);skwRing(k2);skwSlots(k2);skwArcs(k2);skwInd();
  if(node&&node.matches(':hover'))skwSpellHover(si);else skwInfoDef();
  skwSnd('ui_click');skwChanged();
}
// ไอคอนบินจากวงลงช่องห้าเหลี่ยม (โค้งขึ้นนิดๆ) → แฟลช + ประกายตอนถึง
function skwGhost(node,pg,S){
  const a=node.getBoundingClientRect(),b=pg.querySelector('.skwPg').getBoundingClientRect(),c=PATHS[S.path].col;
  const x0=a.left+a.width/2,y0=a.top+a.height/2,x1=b.left+b.width/2,y1=b.top+b.height*0.53;
  const g=document.createElement('span');g.className='skwGhost';g.style.cssText=`left:${x0}px;top:${y0}px;--c:${c}`;g.innerHTML=icoHTML(S.id,c,28);SKW.el.appendChild(g);
  const dx=x1-x0,dy=y1-y0;
  const an=g.animate([{transform:'translate(-50%,-50%) scale(1.15)',opacity:1},{transform:`translate(calc(-50% + ${dx*0.5}px),calc(-50% + ${dy*0.5-60}px)) scale(1)`,opacity:1,offset:0.5},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.85)`,opacity:.9}],{duration:420,easing:'cubic-bezier(.45,0,.25,1)'});
  an.onfinish=()=>{g.remove();skwFlashSlot(pg);skwBurst(x1,y1,c,26);};
}
function skwFlashSlot(pg){if(!pg)return;pg.classList.remove('flash');void pg.offsetWidth;pg.classList.add('flash');}
// ---------- พื้นหลัง: ฝุ่นดาว + ประกายตอนใส่คาถา (canvas เดียว หลังเนื้อหา) ----------
function skwBurst(x,y,col,n){
  for(let i=0;i<n;i++){const a=Math.random()*6.283,s=50+Math.random()*170;SKW.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.7,max:.7,s:1+Math.random()*1.6,c:Math.random()<.3?'#ffffff':col});}
  SKW.parts.push({ring:1,x,y,life:.55,max:.55,c:col});
}
function skwFxStart(){
  if(SKW.raf)return;SKW.last=performance.now();
  const loop=t=>{if(!SKW.on&&!SKW.el.classList.contains('out')){SKW.raf=0;return;}SKW.raf=requestAnimationFrame(loop);skwFxTick(t);};
  SKW.raf=requestAnimationFrame(loop);
}
function skwFxTick(t){
  const c=SKW.cv,W=innerWidth,H=innerHeight,dpr=Math.min(1.5,devicePixelRatio||1),dt=Math.min(0.05,(t-SKW.last)/1000);SKW.last=t;
  if(c.width!==Math.round(W*dpr)||c.height!==Math.round(H*dpr)){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);SKW.stars=[];}
  const g=c.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
  if(!SKW.stars.length)for(let i=0;i<Math.round(W*H/9000);i++)SKW.stars.push({x:Math.random()*W,y:Math.random()*H,s:Math.random()<.12?1.6+Math.random():.4+Math.random()*.8,p:Math.random()*6.28,f:.5+Math.random()*1.5,vy:-(1.5+Math.random()*5)});
  for(const s of SKW.stars){
    s.p+=dt*s.f;s.y+=s.vy*dt;if(s.y<-4){s.y=H+4;s.x=Math.random()*W;}
    g.globalAlpha=(s.s>1.5?.22:.14)+(s.s>1.5?.4:.3)*(.5+.5*Math.sin(s.p));
    g.fillStyle=s.s>1.5?SKW.col:'#dfe3ff';
    if(s.s>1.5){g.beginPath();g.arc(s.x,s.y,s.s*.6,0,6.283);g.fill();}else g.fillRect(s.x,s.y,s.s,s.s);
  }
  for(let i=SKW.parts.length-1;i>=0;i--){
    const p=SKW.parts[i];p.life-=dt;if(p.life<=0){SKW.parts.splice(i,1);continue;}
    const k=p.life/p.max;
    if(p.ring){g.globalAlpha=k*.8;g.strokeStyle=p.c;g.lineWidth=1;g.beginPath();g.arc(p.x,p.y,10+(1-k)*(1-k*.4)*70,0,6.283);g.stroke();continue;}
    p.vx*=1-3.2*dt;p.vy*=1-3.2*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    g.globalAlpha=Math.min(1,k*1.6);g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,p.s*(0.6+k*.6),0,6.283);g.fill();
  }
  g.globalAlpha=1;
}
// ---------- เปิด/ปิด ----------
function skwOpen(){
  if(!SKW.el)skwBuild();
  const el=SKW.el,k=parseKit(myKit);
  clearTimeout(SKW.closeT);clearTimeout(SKW.swapT);
  SKW.slot=0;SKW.lib=k.path;SKW.ringLib=SKW.ringPath=SKW.arcPath=-1;SKW.infoK='';SKW.hov=-1;SKW.parts=[];
  try{if(document.pointerLockElement)document.exitPointerLock();}catch(e){}
  el.querySelector('.skwSp').innerHTML='';el.querySelector('.skwSlots').innerHTML='';
  el.classList.remove('hidden','out');SKW.on=true;document.body.classList.add('skwOn');
  skwRender();skwFxStart();
}
function skwClose(save){
  if(!SKW.on)return;SKW.on=false;
  store('wd_kit2',myKit);try{lobbyKitSend();}catch(e){console.warn(e);}skwChanged();   // ปิดแบบไหนก็เก็บชุดเสมอ
  const el=SKW.el;el.classList.add('out');document.body.classList.remove('skwOn');
  clearTimeout(SKW.closeT);SKW.closeT=setTimeout(()=>{if(!SKW.on){el.classList.add('hidden');el.classList.remove('out');}},240);
}
// ปุ่มลัดตอนเปิด (จับก่อนปุ่มเกม): Esc ปิด • Q/E/R/F หรือ 1-4 เลือกช่อง • ←/→ เลื่อนช่อง • ไม่ส่งปุ่มอื่นเข้าเกม
addEventListener('keydown',e=>{
  if(!SKW.on)return;
  const tut=document.getElementById('tutOv');
  if(tut&&!tut.classList.contains('hidden')){if(e.code==='Escape'){tut.classList.add('hidden');e.preventDefault();}e.stopImmediatePropagation();return;}
  if(e.code==='Escape'){e.preventDefault();skwClose(true);}
  else if(!e.repeat){const q=SLOTK.findIndex(s=>KEYS[s]===e.code);
    if(q>=0)skwSetSlot(q);else if(/^Digit[1-4]$/.test(e.code))skwSetSlot(+e.code[5]-1);
    else if(e.code==='ArrowRight')skwSetSlot(SKW.slot+1);else if(e.code==='ArrowLeft')skwSetSlot(SKW.slot-1);}
  if(e.code==='Tab'||e.code==='Space')e.preventDefault();
  e.stopImmediatePropagation();
},true);
if(window.WD)Object.assign(window.WD,{skwOpen,skwClose});
