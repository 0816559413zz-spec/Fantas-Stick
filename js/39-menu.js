// =====================================================================
//  เมนู / ล็อบบี้ (DOM)
// =====================================================================
// ตัวละครของฉัน (เก็บในเครื่อง: wd_look) — ครั้งแรกที่เข้าเกมจะเปิดหน้าสร้างตัวละครให้
let myLook=parseLook(store('wd_look')),myColor=HOUSES[myLook.h].c,myKit=cleanKit(store('wd_kit2')||'0');
function myName(){return cleanName($('#nameIn').value);}
$('#nameIn').value=store('wd_name')||('พ่อมด'+Math.floor(Math.random()*900+100));
$('#nameIn').addEventListener('change',()=>store('wd_name',myName()));
function renderMyHouse(){const H=HOUSES[myLook.h];myColor=H.c;$('#myHouse').innerHTML=`${crestSVG(myLook.h,34,false)}<span><b style="color:var(--gold2)">${H.n}</b><br><small style="color:var(--mute)">${H.th} • ${H.tr}</small></span><span style="margin-left:auto;display:flex;gap:4px"><i class="dot" style="background:${H.c}"></i><i class="dot" style="background:${H.c2};border:1px solid rgba(255,255,255,.3)"></i></span>`;}
renderMyHouse();
// ----- หน้าสร้าง/แต่งตัวละคร (2 ขั้น: 1 หน้าตา → 2 เลือกบ้าน) -----
let crLib=0,crSaved=null,crKitSaved='0',crOpen=false,crStep=1,crTab=0,crFirst=false,crKitOnly=false,crSlot=0;
const CRTABS=[['👤','ใบหน้า'],['💇','ผม'],['🧥','เสื้อคลุม'],['👔','เนคไท']];
const sw_=(k,arr)=>`<div class="colors">${arr.map((c,i)=>{const L=lookLock(k,i);return L?`<div class="sw lk" title="ปลดล็อคที่เลเวล ${L}" style="background:${c}"><i>${L}</i></div>`:`<div class="sw ${myLook[k]===i?'on':''}" data-k="${k}" data-v="${i}" style="background:${c}"></div>`;}).join('')}</div>`;   // ของล็อก = เทา + เลขเลเวล (js/56)
const bt_=(k,arr)=>`<div class="opts">${arr.map((t,i)=>{const L=lookLock(k,i);return L?`<button class="obtn lk" disabled title="ปลดล็อคที่เลเวล ${L}">🔒 ${t} <small>Lv${L}</small></button>`:`<button class="obtn ${myLook[k]===i?'on':''}" data-k="${k}" data-v="${i}">${t}</button>`;}).join('')}</div>`;
const nameBox_=()=>`<label class="f" style="margin-top:0">ชื่อพ่อมด</label><input type="text" id="cName" maxlength="16" value="${esc($('#nameIn').value)}"><div class="orn" style="width:100%;margin:12px 0 4px"></div>`;
function crPanelSet(html){
  const cur=document.activeElement&&document.activeElement.id==='cName';
  $('#crPanel').innerHTML=html;$('#crPanel').classList.toggle('wide',crStep===3);
  if(cur&&$('#cName'))$('#cName').focus();
}
function crRenderStep1(){
  if(crStep===2){crRenderWand();return;}
  if(crStep===3){crRenderKit();return;}
  $('#crTabs').innerHTML=CRTABS.map((t,i)=>`<button class="crTab ${crTab===i?'on':''}" data-tab="${i}"><span>${t[0]}</span>${t[1]}</button>`).join('');
  const body=[
    `<h3 class="sec">ใบหน้า</h3><p class="crnote">เลือกสีผิวและสีตาของคุณ</p><label class="f">สีผิว</label>${sw_('sk',SKINC)}<label class="f">สีตา</label>${sw_('ey',EYEC)}`,
    `<h3 class="sec">ทรงผม</h3><p class="crnote">เลือกทรงและสีผม</p><label class="f">ทรงผม</label>${bt_('hs',HAIRSTY)}<label class="f">สีผม</label>${sw_('hr',HAIRC)}`,
    `<h3 class="sec">เสื้อคลุม</h3><p class="crnote">ในหนังเสื้อคลุมเป็นสีดำ — สีบ้านที่เลือกในขั้นสุดท้ายจะโผล่ที่ซับใน เนคไท และผ้าพันคอ</p><label class="f">สีเสื้อคลุม</label>${sw_('cl',CLOAKC)}`,
    `<h3 class="sec">เนคไท</h3><p class="crnote">สีของเนคไทจะตามบ้านที่คุณเลือก</p><label class="f">แบบเนคไท</label>${bt_('ti',TIESTY)}`][crTab];
  crPanelSet(nameBox_()+body);
}
function crRenderWand(){
  crPanelSet(nameBox_()+`<h3 class="sec">ไม้กายสิทธิ์ของคุณ</h3><p class="crnote">ไม้กายสิทธิ์เป็นฝ่ายเลือกพ่อมด — แต่ที่นี่คุณเลือกเองได้เลย</p><label class="f">ไม้ (${WOODN[myLook.wd]})</label>${sw_('wd',WOODC)}<label class="f">แกนเวท (${WCOREN[myLook.wc]})</label>${sw_('wc',WCOREC)}<label class="f">ทรงด้าม</label>${bt_('ws',WANDSTY)}`);
}
// ----- ขั้น 3: สาย + ชุดคาถา -----
const ROLE_COL={builder:'#ffb066',control:'#8fe0ff',finisher:'#ff7a8a',utility:'#9ad7a0',summon:'#ff9ad5',ult:'#ffe27a'};
function roleTag(S){return `<i class="rtag" style="--rc:${ROLE_COL[S.role]||'#fff'}">${ROLE_N[S.role]||''}</i>`;}
const DESIGNED=['pyro','frost','earth'];
function spellTags(S){
  const t=[];
  if(S.ult)t.push('<i class="tg ult">เวทโบราณ X</i>');else t.push(`<i class="tg">⏱ ${S.cd} วิ</i>`);
  if(S.melee)t.push('<i class="tg mel">⚔️ เฉพาะโหมดประชิด</i>');
  if(S.dual)t.push('<i class="tg dual">⇄ เปลี่ยนตามโหมด</i>');
  return t.join('');
}
function spellDescHTML(S){
  const P=PATHS[S.path];
  return `<div class="kdh">${icoHTML(S.id,P.col,40)}<div><b>${S.n}</b> ${roleTag(S)}<div class="tgs">${spellTags(S)}<i class="tg" style="--c:${P.col}">${P.n}</i></div></div></div><div class="kdt">${S.d}</div><small>✦ ${S.fx}</small>`;
}
function baseDescHTML(P,B,w){
  const ic=w==='b'?'b_'+P.id:w==='s'?(hasIco('sh_'+P.id)?'sh_'+P.id:'b_'+P.id):(hasIco('dsh_'+P.id)?'dsh_'+P.id:'p_'+P.id);
  const n=w==='b'?'ยิงปกติ — '+B.n:w==='s'?'โล่ (คลิกขวา)':'พุ่ง (Shift) / กระโดด (Space)';
  const d=w==='b'?B.d:w==='s'?(B.shd||'โล่: เหมือนทุกสาย (Parry 0.28 วิ ปัดกระสุนทิ้ง)'):(B.dsd||'พุ่ง: เหมือนทุกสาย (คูลดาวน์ 2.5 วิ)')+' • Space = กระโดด (ทุกสาย)';
  return `<div class="kdh">${icoHTML(ic,P.col,40)}<div><b>${n}</b><div class="tgs"><i class="tg" style="--c:${P.col}">${P.n}</i><i class="tg">ท่าพื้นฐาน</i></div></div></div><div class="kdt">${d}</div>`;
}
// หน้าเลือกสาย/คาถาแบบ "ตำราเวท": ซ้าย = เหรียญตราสาย • กลาง-ซ้าย = คลังคาถา (การ์ด) • ขวาบน = หัวข้อสาย + ลำดับคอมโบ
// • ขวาล่าง = ชุดคาถารูปเพชรเหมือนตอนเล่น (Q ซ้าย E บน R ขวา F ล่าง X กลาง) • พื้นหลังมีเอฟเฟกต์เฉพาะของแต่ละสาย
const SB_THEME={
  pyro:{fx:'ember',tint:'radial-gradient(ellipse at 62% 60%,rgba(255,80,20,.30),rgba(40,6,2,.55) 70%)',tag:'เผาให้ลุก แล้วดีดนิ้วระเบิด'},
  frost:{fx:'snow',tint:'radial-gradient(ellipse at 62% 50%,rgba(80,180,255,.25),rgba(2,14,30,.6) 70%)',tag:'ดาบน้ำแข็งคลุกวงใน แช่แข็งทุกสิ่ง'},
  storm:{fx:'spark',tint:'radial-gradient(ellipse at 62% 45%,rgba(255,230,90,.22),rgba(18,16,4,.6) 70%)',tag:'ว่องไว เก็บสายฟ้าแล้วปล่อย'},
  nature:{fx:'leaf',tint:'radial-gradient(ellipse at 62% 55%,rgba(90,210,110,.24),rgba(4,22,10,.6) 70%)',tag:'พิษสะสม หนามระเบิด'},
  hex:{fx:'smoke',tint:'radial-gradient(ellipse at 62% 50%,rgba(170,90,255,.26),rgba(14,4,26,.62) 70%)',tag:'ตีตรา สาปแช่ง ควบคุม'},
  summon:{fx:'wisp',tint:'radial-gradient(ellipse at 62% 50%,rgba(255,140,210,.24),rgba(26,6,20,.6) 70%)',tag:'อัญเชิญสัตว์เวทมาสู้แทน'},
  earth:{fx:'smoke',tint:'radial-gradient(ellipse at 62% 55%,rgba(200,160,100,.26),rgba(24,16,6,.62) 70%)',tag:'Stand หินต่อยแทน สร้างกำแพง ผลักชนของแข็ง'}
};
const ROLE_ORDER=['builder','control','utility','summon','finisher'];
let sbFxRun=false,sbFxT=0,sbParts=[];
function crRenderKit(){
  const k=parseKit(myKit),P=PATHS[k.path],ult=SPELL_LIST[k.ult],T=SB_THEME[P.id]||SB_THEME.pyro;
  const off=k.ids.filter(i=>SPELL_LIST[i].path!==k.path).length;
  const book=$('#sbook');book.style.setProperty('--pc',P.col);
  if(!book.querySelector('.sbBg')){const bg=document.createElement('div');bg.className='sbBg';book.prepend(bg);const fl=document.createElement('div');fl.className='sbFlash';book.appendChild(fl);}
  book.querySelector('.sbBg').style.background=T.tint;
  // เหรียญตราสาย
  $('#sbPaths').innerHTML=PATHS.map((p,i)=>{if(p.off)return '';const has=SPELL_LIST.some(x=>x.path===i&&!x.ult);return `<button class="sbP ${k.path===i?'on':''}" style="--c:${p.col}" ${has?`data-kp="${i}"`:'disabled'}><span class="med">${icoHTML('p_'+p.id,p.col,28)}</span><span><b>${p.n.replace('สาย','')}</b><small>${(SB_THEME[p.id]||{}).tag||''}</small></span>${DESIGNED.includes(p.id)?'<i class="new">ใหม่</i>':''}</button>`;}).join('');
  // หัวข้อสาย + ลำดับคอมโบ (เรียงตามบทบาท)
  const mine=SPELL_LIST.filter(x=>x.path===k.path&&!x.ult).sort((a,b)=>ROLE_ORDER.indexOf(a.role)-ROLE_ORDER.indexOf(b.role));
  $('#sbHero').innerHTML=`<h1>${P.n}</h1><span class="em">${icoHTML('p_'+P.id,P.col,36)}</span><div class="tl">${P.d}</div>
    <div class="chain">${mine.map((S,i)=>`${i?'<span class="ar">➜</span>':''}<span class="st" style="--rc:${ROLE_COL[S.role]||'#fff'}" data-ksp-info="${S.i}">${icoHTML(S.id,P.col,22)}<b>${ROLE_N[S.role]||''}</b></span>`).join('')}<span class="ar">➜</span><span class="st" style="--rc:#ffe27a" data-kult="1">${icoHTML(ult.id,P.col,22)}<b>เวทโบราณ</b></span></div>
    <div class="cb">✦ ${P.combo}</div><button type="button" class="tutBtn" id="tutOpen">📖 วิธีเล่นสายนี้</button>`;   // js/57
  // ชุดคาถารูปเพชร
  const POS=[[22,50],[50,18],[78,50],[50,82]];
  $('#sbLoad').innerHTML=`<div class="ring"></div>${k.ids.map((id,i)=>{const S=SPELL_LIST[id],c=PATHS[S.path].col;return `<button class="dslot ${crSlot===i?'on':''}" data-ks="${i}" style="left:${POS[i][0]}%;top:${POS[i][1]}%;--c:${c}"><span class="dm"></span><span class="di">${icoHTML(S.id,c,34)}</span><span class="k">${keyName(KEYS[SLOTK[i]]||'Key'+'QERF'[i])}</span><span class="nm">${S.n}</span></button>`;}).join('')}
    <div class="uslot" data-kult="1">${icoHTML(ult.id,P.col,46)}<span class="k">${keyName(KEYS.ult||'KeyX')}</span></div>
    <div class="bkit">${[['b','b_'+P.id+(P.id==='frost'?'_m':''),'ยิงปกติ','คลิกซ้าย'],['s',hasIco('sh_'+P.id)?'sh_'+P.id:'b_'+P.id,'โล่','คลิกขวา'],['d',hasIco('dsh_'+P.id)?'dsh_'+P.id:'p_'+P.id,'พุ่ง',keyName(KEYS.dash||'ShiftLeft')]].map(([w,ic,n,key])=>`<button type="button" class="bk" data-kbase="${w}">${icoHTML(ic,P.col,22)}${w==='b'&&P.id==='frost'?icoHTML('b_frost',P.col,22):''}<span>${n}</span><em>${key}</em></button>`).join('')}</div>`;
  // คลังคาถา
  const libOk=PATHS.map((p,i)=>!p.off&&SPELL_LIST.some(x=>x.path===i&&!x.ult));
  if(!libOk[crLib])crLib=k.path;
  $('#sbTabs').innerHTML=PATHS.map((p,i)=>libOk[i]?`<button class="sbT ${crLib===i?'on':''}" style="--c:${p.col}" data-klib="${i}" title="${p.n}${i===k.path?' (สายหลัก)':' (ใส่ได้ไม่เกิน 2 ช่อง)'}">${icoHTML('p_'+p.id,p.col,20)}</button>`:'').join('');
  const L=SPELL_LIST.filter(x=>x.path===crLib&&!x.ult);
  $('#sbGrid').innerHTML=L.map(S=>{const used=k.ids.includes(S.i),blocked=!used&&S.path!==k.path&&off>=2&&SPELL_LIST[k.ids[crSlot]].path===k.path,c=PATHS[S.path].col;
    return `<button class="sc ${used?'used':''} ${blocked?'off':''}" data-ksp="${S.i}" draggable="true" style="--c:${c};--rc:${ROLE_COL[S.role]||'#fff'}">${used?`<i class="eq">${keyName(KEYS[SLOTK[k.ids.indexOf(S.i)]]||'')}</i>`:''}<span class="rune">${icoHTML(S.id,c,34)}</span><b>${S.n}</b><span class="rb">${ROLE_N[S.role]||''}</span><span class="mt">⏱ ${S.cd} วิ${S.melee?' • ⚔️ ประชิด':''}${S.dual?' • ⇄ 2 โหมด':''}</span></button>`;}).join('');
  $('#kdesc').innerHTML=spellDescHTML(SPELL_LIST[k.ids[crSlot]]);
  sbStartFx();
}
// เอฟเฟกต์พื้นหลังเฉพาะสาย: ไฟ = ถ่านลอยขึ้น / น้ำแข็ง = หิมะ / สายฟ้า = ประกาย+ฟ้าแลบ / ธรรมชาติ = ใบไม้ / คำสาป = ควันม่วง / อัญเชิญ = ดวงวิญญาณวน
function sbStartFx(){if(sbFxRun)return;sbFxRun=true;let last=performance.now();const loop=now=>{if(!crOpen||crStep!==3){sbFxRun=false;sbParts=[];return;}const dt=Math.min(0.05,(now-last)/1000);last=now;sbFxTick(dt,now);requestAnimationFrame(loop);};requestAnimationFrame(loop);}
function sbFxTick(dt,now){
  const c=$('#sbFx');if(!c)return;const W=c.clientWidth,H=c.clientHeight;if(c.width!==W||c.height!==H){c.width=W;c.height=H;}
  const g=c.getContext('2d'),P=PATHS[parseKit(myKit).path],fx=(SB_THEME[P.id]||SB_THEME.pyro).fx,col=P.col;
  g.clearRect(0,0,W,H);
  const spawn=(n,f)=>{for(let i=0;i<n;i++)sbParts.push(f());};
  const r=Math.random;
  if(fx==='ember'&&r()<0.7)spawn(2,()=>({x:r()*W,y:H+10,vx:(r()-.5)*30,vy:-60-r()*90,life:3+r()*2,max:5,s:1.5+r()*2.5,c:r()<.5?'#ff8a2a':'#ffc04a',k:'glow'}));
  if(fx==='snow'&&r()<0.9)spawn(2,()=>({x:r()*W,y:-10,vx:-10+r()*20,vy:35+r()*45,life:10,max:10,s:1.8+r()*3,c:'#f2faff',k:'flake',w:r()*6}));
  if(fx==='spark'){if(r()<0.25)spawn(3,()=>({x:r()*W,y:r()*H,vx:(r()-.5)*240,vy:(r()-.5)*240,life:.35,max:.35,s:1.5,c:'#fff27a',k:'glow'}));if(r()<0.006){sbFxT=0.18;sbParts.push({k:'bolt',x:W*(0.45+r()*0.5),life:.18,max:.18});}}
  if(fx==='leaf'&&r()<0.25)spawn(1,()=>({x:r()*W,y:-12,vx:20+r()*30,vy:25+r()*30,life:12,max:12,s:4+r()*4,c:r()<.5?'#6fd57f':'#c9e86a',k:'leaf',w:r()*6,rot:r()*6}));
  if(fx==='smoke'&&r()<0.35)spawn(1,()=>({x:r()*W,y:H*(0.6+r()*0.5),vx:(r()-.5)*15,vy:-15-r()*20,life:5,max:5,s:30+r()*50,c:'#7a3aaa',k:'smoke'}));
  if(fx==='smoke'&&r()<0.05)spawn(1,()=>({x:r()*W,y:r()*H,vx:0,vy:-8,life:3,max:3,s:14,c:'#d0a8ff',k:'rune',ch:'ᚠᚢᚦᚨᚱᚲᚷᚹ'[r()*8|0]}));
  if(fx==='wisp'&&sbParts.length<26)spawn(1,()=>({x:W*0.62,y:H*0.5,a:r()*6.28,rad:120+r()*180,sp:0.4+r()*0.6,life:8+r()*6,max:14,s:3+r()*3,c:r()<.5?'#ff9ad5':'#bfa8ff',k:'wisp'}));
  for(let i=sbParts.length-1;i>=0;i--){const p=sbParts[i];p.life-=dt;if(p.life<=0){sbParts.splice(i,1);continue;}
    const a=Math.min(1,p.life/p.max*2,(p.max-p.life)*3);
    if(p.k==='bolt'){g.strokeStyle=`rgba(255,247,176,${p.life/p.max})`;g.lineWidth=2;g.beginPath();let x=p.x,y=0;g.moveTo(x,y);while(y<H*0.7){x+=(r()-.5)*60;y+=30+r()*30;g.lineTo(x,y);}g.stroke();continue;}
    if(p.k==='wisp'){p.a+=p.sp*dt;p.x=W*0.62+Math.cos(p.a)*p.rad;p.y=H*0.5+Math.sin(p.a)*p.rad*0.45;}
    else{p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.k==='flake'||p.k==='leaf'){p.w+=dt*2;p.x+=Math.sin(p.w)*15*dt;}}
    g.globalAlpha=a*(p.k==='smoke'?0.12:0.85);
    if(p.k==='leaf'){p.rot+=dt*2;g.save();g.translate(p.x,p.y);g.rotate(p.rot);g.fillStyle=p.c;g.beginPath();g.ellipse(0,0,p.s,p.s*0.45,0,0,7);g.fill();g.restore();}
    else if(p.k==='rune'){g.fillStyle=p.c;g.font='16px serif';g.fillText(p.ch,p.x,p.y);}
    else{const gr=g.createRadialGradient(p.x,p.y,0,p.x,p.y,p.s*(p.k==='smoke'?1:2.4));gr.addColorStop(0,p.c);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(p.x,p.y,p.s*(p.k==='smoke'?1:2.4),0,7);g.fill();}
  }
  g.globalAlpha=1;
  if(sbFxT>0){sbFxT-=dt;g.fillStyle=`rgba(255,250,200,${sbFxT*0.8})`;g.fillRect(0,0,W,H);}
  if(sbParts.length>400)sbParts.splice(0,sbParts.length-400);
}
function sbBurst(el,col){
  // แฟลช + ประกายตอนใส่คาถาลงช่อง
  if(!el)return;el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');
  const c=$('#sbFx'),r=el.getBoundingClientRect(),cr=c.getBoundingClientRect();
  for(let i=0;i<26;i++){const a=Math.random()*6.28,s=60+Math.random()*160;sbParts.push({x:r.left-cr.left+r.width/2,y:r.top-cr.top+r.height/2,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.6,max:.6,s:2+Math.random()*2,c:col,k:'glow'});}
}
function crAssign(si){
  const k=parseKit(myKit),ids=k.ids.slice(),cur=ids.indexOf(si);
  if(cur>=0)ids[cur]=ids[crSlot];
  ids[crSlot]=si;
  const nk=cleanKit([k.path,...ids].join('.'));
  if(parseKit(nk).ids[crSlot]!==si)toast('คาถาสายอื่นใส่ได้ไม่เกิน 2 ช่อง');
  myKit=nk;crRenderKit();
  const el=document.querySelector(`.dslot[data-ks="${crSlot}"]`);if(el)sbBurst(el,PATHS[SPELL_LIST[si].path].col);
}
function crRenderHouse(){
  const H=HOUSES[myLook.h];
  $('#crInfo').innerHTML=`<small>HOGWARTS HOUSE</small><h1>${H.n}</h1><div class="th">${H.th}</div><div class="ds">${H.ds}</div><div class="po">${H.po} — กดเลือกบ้านอื่นเพื่อเปลี่ยนท่าและบรรยากาศ</div>`;
  $('#crCrests').innerHTML=HOUSES.map((h,i)=>`<button class="ccard ${myLook.h===i?'on':''}" data-house="${i}" style="--hc:${h.gl}">${crestSVG(i,118)}</button>`).join('');
  [...document.querySelectorAll('.crTints i')].forEach((el,i)=>el.classList.toggle('on',crStep===4&&myLook.h===i));
  $('#crInfo').style.setProperty('--ht',H.gl);
}
function crGo(n){
  if(crStep===1||crStep===2)crSaveName();
  crStep=n;const el=$('#creator');for(const k of [1,2,3,4]){el.classList.toggle('s'+k,n===k);$('#crSt'+k).classList.toggle('on',n===k);}
  document.body.classList.toggle('crRot',n!==3);
  if(n===4){crRenderHouse();STAGE.switchT=0;}else crRenderStep1();
  [...document.querySelectorAll('.crTints i')].forEach((e,i)=>e.classList.toggle('on',n===4&&myLook.h===i));
}
// ลากเมาส์/นิ้วบนฉากในหน้าสร้างตัวละคร = หมุนตัวละคร (ปล่อยแล้วหมุนต่ออีกนิดตามแรงเหวี่ยง)
{let lx=0,lt=0;
 addEventListener('pointerdown',e=>{if(!crOpen||crStep===3||e.button>0||e.target.closest('button,input,select,textarea,label,a,.card,.crTabs,.crSteps,.crCrests,.crBar,.crInfo'))return;STAGE.drag=true;STAGE.rotV=0;lx=e.clientX;lt=performance.now();document.body.classList.add('crDrag');});
 addEventListener('pointermove',e=>{if(!STAGE.drag)return;const dx=e.clientX-lx,t=performance.now(),d=Math.max(16,t-lt)/1000;STAGE.rotY+=dx*0.012;STAGE.rotV=clamp(lerp(STAGE.rotV,dx*0.012/d,0.5),-9,9);lx=e.clientX;lt=t;});
 addEventListener('pointerup',()=>{if(!STAGE.drag)return;STAGE.drag=false;document.body.classList.remove('crDrag');if(performance.now()-lt>80)STAGE.rotV=0;});}
function crSaveName(){const c=$('#cName');if(c){const n=cleanName(c.value);$('#nameIn').value=n;store('wd_name',n);}}
function crSetHouse(i){if(i===myLook.h&&crStep===4)return;myLook.h=i;STAGE.switchT=0;renderMyHouse();crRenderHouse();}
function openCreator(first,step){
  crSaved=lookStr(myLook);crKitSaved=myKit;ac();crFirst=!!first;crOpen=true;crTab=0;crSlot=0;crLib=parseKit(myKit).path;crKitOnly=step===3&&!first&&(screen==='lobby'||screen==='game');
  $('#crTitle').textContent=crKitOnly?'เลือกสายและคาถา':first?'สร้างตัวละครของคุณ':'แต่งตัวละคร';
  $('#crCancel').classList.toggle('hidden',!!first);
  $('#crSteps').classList.toggle('hidden',crKitOnly);
  $('#crNext3').classList.toggle('hidden',crKitOnly);$('#crBack3').classList.toggle('hidden',crKitOnly);$('#crKitOk').classList.toggle('hidden',!crKitOnly);
  if(screen==='menu'){document.querySelector('.mprof').classList.add('hidden');document.querySelector('.mleft').classList.add('hidden');}
  document.body.classList.add('crOpenB');document.body.classList.toggle('crGame',screen==='game');
  $('#creator').classList.remove('hidden');crGo(step||1);
}
function closeCreator(save){
  if(save){crSaveName();lookClampLocks(myLook);store('wd_look',lookStr(myLook));store('wd_kit2',myKit);if(JOINQ){const c=JOINQ;JOINQ='';setTimeout(()=>joinGame(c),300);}}
  else{myLook=parseLook(crSaved);myKit=crKitSaved;}
  crOpen=false;STAGE.rotY=STAGE.rotV=0;document.body.classList.remove('crRot');renderMyHouse();$('#creator').classList.add('hidden');
  if(screen==='menu'){document.querySelector('.mprof').classList.remove('hidden');document.querySelector('.mleft').classList.remove('hidden');}
  document.body.classList.remove('crOpenB','crGame');
}
function lobbyKitSend(){
  if(NET.isHost&&G&&G.players[NET.myId]){setKit(G.players[NET.myId],myKit);broadcastLobby();}
  else if(NET.hostConn)try{NET.hostConn.send({t:'kit',k:myKit});}catch(e){}
}
$('#creator').addEventListener('click',e=>{
  if(e.target.closest('#tutOpen')){tutOpen(parseKit(myKit).path);return;}
  const tab=e.target.closest('[data-tab]');if(tab){crSaveName();crTab=+tab.dataset.tab;crRenderStep1();return;}
  const hs=e.target.closest('[data-house]');if(hs){crSetHouse(+hs.dataset.house);return;}
  const kp=e.target.closest('[data-kp]');if(kp){myKit=cleanKit(String(+kp.dataset.kp));crSlot=0;crLib=+kp.dataset.kp;crRenderKit();const f=document.querySelector('.sbFlash');if(f){f.style.background=`radial-gradient(circle at 62% 50%,${PATHS[+kp.dataset.kp].col},transparent 60%)`;f.classList.remove('go');void f.offsetWidth;f.classList.add('go');}sbParts=[];snd('buff');return;}
  const kl=e.target.closest('[data-klib]');if(kl){crLib=+kl.dataset.klib;crRenderKit();return;}
  const ks=e.target.closest('[data-ks]');if(ks){crSlot=+ks.dataset.ks;crRenderKit();return;}
  const ksp=e.target.closest('[data-ksp]');if(ksp){crAssign(+ksp.dataset.ksp);return;}
  const t=e.target.closest('[data-k]');if(!t)return;
  myLook[t.dataset.k]=+t.dataset.v;crRenderStep1();
});
$('#creator').addEventListener('mouseover',e=>{
  const d=$('#kdesc');if(!d)return;const k=parseKit(myKit);
  const ksp=e.target.closest('[data-ksp]');if(ksp){d.innerHTML=spellDescHTML(SPELL_LIST[+ksp.dataset.ksp]);return;}
  const ki=e.target.closest('[data-ksp-info]');if(ki){d.innerHTML=spellDescHTML(SPELL_LIST[+ki.dataset.kspInfo]);return;}
  const kb=e.target.closest('[data-kbase]');if(kb){d.innerHTML=baseDescHTML(PATHS[k.path],PBASIC[k.path],kb.dataset.kbase);return;}
  const ku=e.target.closest('[data-kult]');if(ku){d.innerHTML=spellDescHTML(SPELL_LIST[k.ult]);return;}
  const ks=e.target.closest('[data-ks]');if(ks){d.innerHTML=spellDescHTML(SPELL_LIST[k.ids[+ks.dataset.ks]]);}
});
$('#creator').addEventListener('mousemove',e=>{const c=e.target.closest('.sc');document.querySelectorAll('.sc.tilt').forEach(x=>{if(x!==c){x.style.transform='';x.classList.remove('tilt');}});if(!c)return;const r=c.getBoundingClientRect(),dx=(e.clientX-r.left)/r.width-0.5,dy=(e.clientY-r.top)/r.height-0.5;c.classList.add('tilt');c.style.transform=`rotateY(${dx*16}deg) rotateX(${-dy*16}deg) translateY(-3px)`;});
// ลากคาถาจากคลังไปวางในช่อง
$('#creator').addEventListener('dragstart',e=>{const s=e.target.closest('[data-ksp]');if(s){e.dataTransfer.setData('text/plain',s.dataset.ksp);e.dataTransfer.effectAllowed='move';}});
$('#creator').addEventListener('dragover',e=>{const t=e.target.closest('[data-ks]');if(t){e.preventDefault();t.classList.add('drop');}});
$('#creator').addEventListener('dragleave',e=>{const t=e.target.closest('[data-ks]');if(t)t.classList.remove('drop');});
$('#creator').addEventListener('drop',e=>{const t=e.target.closest('[data-ks]');if(!t)return;e.preventDefault();const si=+e.dataTransfer.getData('text/plain');if(!isNaN(si)){crSlot=+t.dataset.ks;crAssign(si);}});
$('#crRand').onclick=()=>{const k={h:myLook.h,wd:myLook.wd,wc:myLook.wc,ws:myLook.ws};myLook=lookClampLocks(Object.assign(randLook(),k));crRenderStep1();};
$('#crNext').onclick=()=>crGo(2);
$('#crBack2').onclick=()=>crGo(1);
$('#crNext2').onclick=()=>crGo(3);
$('#crBack3').onclick=()=>crGo(2);
$('#crNext3').onclick=()=>crGo(4);
$('#crBack').onclick=()=>crGo(3);
$('#crKitOk').onclick=()=>{store('wd_kit2',myKit);closeCreator(true);lobbyKitSend();};
$('#crHat').onclick=()=>{crSetHouse(Math.floor(Math.random()*4));toast('🎩 หมวกคัดสรรเลือกให้คุณ: '+HOUSES[myLook.h].n+'!');};
$('#crOk').onclick=()=>closeCreator(true);
$('#crCancel').onclick=()=>closeCreator(false);
$('#btnLook').onclick=()=>openCreator(false);
$('#btnKit').onclick=()=>openCreator(false,3);
// ---------- ฉากเปิด (#intro) + ประกายบนหน้าเมนู (#menuFx) ----------
// เปิดหน้าเว็บ = โลโก้ทองค่อยๆ ปรากฏ → คลิก/กดปุ่ม = แฟลช + กล้องโฉบลงหาตัวละคร (STAGE.introT) + เมนูเลื่อนเข้า • ครั้งแรก (ยังไม่มีตัวละคร) เปิดหน้าสร้างตัวละครต่อ
// ข้ามได้ด้วย ?nointro (ทดสอบ / VFX Studio)
const TITLE={on:false,parts:[],menuParts:[],t0:performance.now()};
function titleSpark(arr,x,y,n,sp,col){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=sp*(0.3+Math.random());arr.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-sp*0.2,life:0.8+Math.random()*1.2,max:2,r:1+Math.random()*2.2,col:col||(Math.random()<0.5?'255,214,140':'255,245,220'),g:40});}}
function titleDraw(cv,arr,dt,ambient,c1,c2){
  const w=cv.clientWidth,h=cv.clientHeight;if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
  const g=cv.getContext('2d');g.clearRect(0,0,w,h);g.globalCompositeOperation='lighter';
  if(Math.random()<ambient*dt)arr.push({x:Math.random()*w,y:h+10,vx:(Math.random()-0.5)*14,vy:-(20+Math.random()*50),life:5+Math.random()*5,max:10,r:0.8+Math.random()*2,col:Math.random()<0.7?(c1||'255,206,120'):(c2||'170,190,255'),g:0,tw:Math.random()*6});
  for(let i=arr.length-1;i>=0;i--){const p=arr[i];p.life-=dt;if(p.life<=0||p.y<-20){arr.splice(i,1);continue;}
    p.vy+=p.g*dt;p.x+=p.vx*dt+Math.sin(performance.now()/900+(p.tw||0))*0.25;p.y+=p.vy*dt;
    const a=Math.min(1,p.life/(p.max*0.35))*(p.tw!==undefined?0.55+0.45*Math.sin(performance.now()/300+p.tw):1);
    const rg=g.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*4);rg.addColorStop(0,'rgba('+p.col+','+a+')');rg.addColorStop(1,'rgba('+p.col+',0)');
    g.fillStyle=rg;g.beginPath();g.arc(p.x,p.y,p.r*4,0,6.283);g.fill();}
  g.globalCompositeOperation='source-over';
}
function titleLoop(){
  const now=performance.now(),dt=Math.min(0.05,(now-(TITLE.last||now))/1000);TITLE.last=now;
  const intro=$('#intro');
  if(intro&&!intro.classList.contains('gone')){
    const cv=$('#introFx');
    if(!TITLE.slam&&now-TITLE.t0>1500){TITLE.slam=1;const r=$('.inFTA').getBoundingClientRect();titleSpark(TITLE.parts,r.left+r.width*0.72,r.top+r.height*0.12,70,380,'235,230,255');titleSpark(TITLE.parts,r.left+r.width/2,r.top+r.height*0.6,50,300,'185,170,255');}   // ประกายตอนดาวที่ปลายไม้โผล่
    titleDraw(cv,TITLE.parts,dt,30,'220,226,255','170,150,255');
  }
  if(screen==='menu'&&!crOpen&&!document.hidden)titleDraw($('#menuFx'),TITLE.menuParts,dt,14);
  requestAnimationFrame(titleLoop);
}
function titleGo(){
  const intro=$('#intro');if(!intro||intro.classList.contains('go'))return;
  try{ac();snd('whoosh',{vol:0.8});setTimeout(()=>snd('buff',{vol:0.6}),180);}catch(e){}
  titleSpark(TITLE.parts,innerWidth/2,innerHeight*0.45,140,700,'230,232,255');
  intro.classList.add('go');STAGE.introT=0;document.body.classList.add('menuIn');
  setTimeout(()=>{intro.classList.add('gone');if(!store('wd_look'))openCreator(true);},1100);
}
// ลิงก์เชิญ ?join=ABCDE → ใส่รหัสให้ แล้วเข้าห้องเลย (ครั้งแรก = สร้างตัวละครก่อน กดบันทึกแล้วเข้าเอง)
let JOINQ=(()=>{const m=/[?&]join=([A-Za-z0-9]{5})/.exec(location.search);return m?m[1].toUpperCase():'';})();
if(JOINQ){$('#codeIn').value=JOINQ;if(store('wd_look')){const c=JOINQ;JOINQ='';setTimeout(()=>joinGame(c),900);}}
if(/[?&](nointro|studio|join)\b/.test(location.search)){$('#intro').classList.add('gone');STAGE.introT=1;if(!store('wd_look'))openCreator(true);}
else{$('#intro').addEventListener('pointerdown',titleGo);addEventListener('keydown',e=>{if(!$('#intro').classList.contains('go')&&!e.repeat)titleGo();});}
requestAnimationFrame(titleLoop);
$('#btnSolo').onclick=()=>{store('wd_name',myName());hostGame(false);};
$('#btnHost').onclick=()=>{store('wd_name',myName());hostGame(true);};
$('#btnJoin').onclick=()=>{store('wd_name',myName());joinGame($('#codeIn').value);};
$('#codeIn').addEventListener('keydown',e=>{if(e.key==='Enter')$('#btnJoin').click();});
$('#btnLeave').onclick=leave;
$('#pResume').onclick=()=>{hidePause();try{cvEl().requestPointerLock();}catch(e){}};
$('#pLobby').onclick=()=>{hidePause();if(NET.isHost)hostToLobby();};
$('#pLeave').onclick=leave;
$('#pSettings').onclick=openSettings;
$('#btnLobbySet').onclick=()=>{ac();openSettings();};
addEventListener('keydown',e=>{if(e.code==='Escape'&&!$('#settings').classList.contains('hidden')){closeSettings();return;}if(e.code==='Escape'&&screen==='game'&&trOpenF){trToggle(false);return;}if(e.code==='Escape'&&screen==='game'&&!locked&&!crOpen){const el=$('#pause');if(el.classList.contains('hidden'))showPause();else{hidePause();try{cvEl().requestPointerLock();}catch(err){}}}});
$('#btnGuide').onclick=()=>{ac();guideOpen();};   // คู่มือแบบใหม่ (js/65)
$('#btnGuideClose').onclick=()=>guideClose();
$('#trainEnd').onclick=()=>{if(NET.isHost)hostEndTraining();};
// จอผลการแข่ง (#over สร้างใน 26-fx-events): เดาว่าเราชนะ/แพ้/เสมอจากหัวข้อ + ชื่อ/ทีม/บทบาทเรา → data-res (CSS ทำแสงตามผล) + แท็กเหนือหัวข้อ + แถวของเราเป็นสีทอง (แค่ภาพ ไม่แตะผลจริง)
function ovResult(){const o=$('#over'),h=o.querySelector('h1');if(!h||o.querySelector('.ovTag')||o.classList.contains('u3Over'))return;   // จอสรุปแบบใหม่ (js/65) ไม่ใช้
  const t=h.textContent,v=VIEW.cur,me=v&&v.P&&v.P.find(p=>p.id===NET.myId);let r='end';
  if(t.includes('เสมอ'))r='draw';
  else if(v&&v.mode==='imp'&&ROLE)r=t.includes('โวลเดอมอร์ชนะ')===(ROLE.role==='imp')?'win':'lose';
  else if(t.startsWith('🏆')&&me)r=t.includes(me.n)||(me.tm>=0&&t.includes(TEAMN[me.tm]))?'win':'lose';
  o.dataset.res=r;h.insertAdjacentHTML('beforebegin',`<div class="ovTag">${{win:'ชัยชนะ',lose:'พ่ายแพ้',draw:'เสมอ',end:'จบเกม'}[r]}</div>`);
  if(me)o.querySelectorAll('tr').forEach(tr=>{const td=tr.querySelector('td');if(td&&td.textContent.replace('👑','').trim()===me.n)tr.classList.add('ovMe');});}
new MutationObserver(ovResult).observe($('#over'),{childList:true});
