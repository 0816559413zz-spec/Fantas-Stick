// ---------- HUD รอบ 4 (ผู้ใช้ 2026-10-23, designs/hud-full-mock.html) ----------
// DOM ทับ #cv: ซ้ายล่าง = รูปตัวละคร + เลือดช่องเฉียง • ขวาล่าง = ไพ่สกิลหลัก 4 ใบเรียงแถว + ไอคอนเล็ก (ตีปกติ/โล่/พุ่ง/ไม้กวาด) ขวาสุด (ผู้ใช้ 2026-10-28) • อัลติกลางล่าง • สีตามธาตุ
// สร้างโครงครั้งเดียวต่อธาตุ แล้วอัปเดตเฉพาะค่าที่เปลี่ยน (js/38 drawBottom → hud4Draw) • ไม่ถูกวาดในเฟรมไหน = ซ่อน (hud4Frame จาก render loop)
// สีของ HUD canvas เดิม (แผ่นป้าย/kill feed/แผนที่ย่อ = HG/HG2 ใน js/38) ก็เปลี่ยนตามธาตุด้วย hud4Col
const H4E={
  pyro:{c0:'#5a1206',c1:'#ff6a2a',c2:'#ffc27a',cb:'#4a1a10',pt:'ember',n:'PYRO'},
  frost:{c0:'#0a2a5a',c1:'#8fe0ff',c2:'#e6f8ff',cb:'#13305a',pt:'snow',n:'FROST'},
  storm:{c0:'#4a3a06',c1:'#ffe27a',c2:'#fff6c8',cb:'#3a3010',pt:'spark',n:'STORM'},
  earth:{c0:'#3a2410',c1:'#c9a36a',c2:'#f0dcb4',cb:'#3a2a18',pt:'rock',n:'EARTH'},
  wind:{c0:'#0f3a22',c1:'#8dff65',c2:'#efffe8',cb:'#123a26',pt:'snow',n:'WIND'}};
const H4={pick:null,ordFor:'',el:null,on:false,drawn:false,pid:'',lay:'',cache:{},rdy:{},seg:[],segN:0,trail:1,hold:0,uFull:false,face:null,faceFor:'',faceTry:0};
function h4Pal(me){const k=getKit(me.id),P=PATHS[k.path]||PATHS[0];return [P,H4E[P.id]||H4E.frost];}
// สีของ HUD canvas (js/38) ตามธาตุของเรา — เรียกทุกเฟรมจาก drawHUD
function hud4Col(me){if(!me)return;const E=h4Pal(me)[1];HG=E.c1;HG2=E.c2;}
// อนุภาคธาตุ: จุดเกิดสุ่มในวง (ซ้ายล่าง: รอบรูป) • การเคลื่อนเป็น CSS animation ล้วน
function h4Parts(E,n,box){const an={ember:'h4Rise',snow:'h4Fall',spark:'h4Flick',rock:'h4Fall'}[E.pt];let o='';
  for(let i=0;i<n;i++){const [x,y]=box(Math.random(),Math.random());
    o+=`<i style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;--an:${an};--du:${(E.pt==='spark'?1.6:3+Math.random()*3).toFixed(2)}s;--de:${(-Math.random()*6).toFixed(2)}s;--dx:${(Math.random()*40-20).toFixed(0)}px"></i>`;}
  return `<div class="h4P ${E.pt}">${o}</div>`;}
// ชิ้นออร่าอัลติตามธาตุ: ไฟ = เปลวลุกขึ้นรอบวง • น้ำแข็ง = หมอก + ผลึกน้ำแข็งรอบวง • สายฟ้า = สายฟ้าแลบเลียบขอบวง • ดิน = หินลอยวนรอบวง + ฝุ่น
function h4AuBits(pt){let o='';const at=(deg,r)=>{const t=deg*Math.PI/180;return `left:${(58+Math.cos(t)*r).toFixed(1)}px;top:${(58+Math.sin(t)*r).toFixed(1)}px`;};
  if(pt==='ember')for(let i=0;i<11;i++){const d=150+i*24,up=Math.sin(d*Math.PI/180)<-0.5;   // ครึ่งบน + ข้าง (ล่างติดขอบจอ) • บนวง = เปลวสูงกว่า
    o+=`<i class="fm" style="${at(d,50)};--s:${((up?1.1:0.8)+(i%3)*0.1).toFixed(2)};--du:${(2.4+(i*37%5)*0.2).toFixed(2)}s;--de:${(-(i*0.41)).toFixed(2)}s"></i>`;}
  if(pt==='snow'){for(let i=0;i<5;i++)o+=`<i class="ms" style="--a:${i*72}deg;--du:${9+i*1.7}s;--de:${-i*2.1}s"></i>`;
    for(let i=0;i<12;i++){const d=i*30+(i%2?11:0);o+=`<i class="cr" style="${at(d,70)};--a:${d+90}deg;--s:${i%3===0?1.25:i%2?0.7:0.95};--de:${(-(i*0.37)).toFixed(2)}s"></i>`;}}
  if(pt==='spark'){   // ประกายไฟฟ้า: แต่ละเส้นมี 2 ร่าง (a/b) สลับกันติด-ดับ = แลบไปมา
    const bolt=(a0,a1,seed)=>{let d='',n=7;for(let j=0;j<=n;j++){const t=(a0+(a1-a0)*j/n)*Math.PI/180,r=63+((Math.sin(seed*13.7+j*7.3)*43758.5)%1+1)%1*20-(j===0||j===n?5:0);d+=(j?'L':'M')+(88+Math.cos(t)*r).toFixed(1)+' '+(88+Math.sin(t)*r).toFixed(1);}return d;};
    let g='';for(let i=0;i<6;i++){const a=i*60+(i%2?17:0),w=34+(i%3)*10;
      g+=`<g class="bo" style="--de:${(-(i*0.29)).toFixed(2)}s;--du:${(0.9+(i%3)*0.35).toFixed(2)}s"><path class="a" d="${bolt(a,a+w,i+1)}"/><path class="b" d="${bolt(a+4,a+w+4,i+7)}"/></g>`;}
    o+=`<svg class="h4Bolt" viewBox="0 0 176 176">${g}</svg>`;}
  if(pt==='rock'){   // หินลอย: วงหมุนช้า ๆ (.orb) — แต่ละก้อนลอยขึ้นลง + หมุนตัวเอง
    let r='';for(let i=0;i<9;i++){const d=i*40+(i%2?13:0),t=d*Math.PI/180,R=70+(i%3)*5,sz=(i%3===0?17:i%2?10:13);
      r+=`<i class="rk" style="left:${(Math.cos(t)*R).toFixed(1)}px;top:${(Math.sin(t)*R).toFixed(1)}px;--sz:${sz}px;--k:${i%4};--de:${(-(i*0.53)).toFixed(2)}s"></i>`;}
    o+=`<i class="dust"></i><div class="orb">${r}</div>`;}
  return o;}
const h4Key=k=>({'คลิกซ้าย':'LMB','คลิกขวา':'RMB','กดค้าง':'HOLD'})[k]||k;
const h4Ico=(ic,sz)=>ic&&typeof ic==='object'?icoHTML(ic.id,'#fff',sz):`<span style="font-size:${Math.round(sz*0.8)}px">${ic||''}</span>`;
function h4Build(me,v){
  const [P,E]=h4Pal(me),MYS=mySlots(me),k=getKit(me.id),U=SPELL_LIST[k.ult];
  let root=document.getElementById('h4');
  if(!root){root=document.createElement('div');root.id='h4';root.hidden=true;const cvEl=document.getElementById('cv');cvEl.parentNode.insertBefore(root,cvEl.nextSibling);}
  root.style.cssText=`--c0:${E.c0};--c1:${E.c1};--c2:${E.c2};--cb:${E.cb}`;
  const cards=MYS.filter(s=>s[3]>=1&&s[3]<=4),gems=MYS.filter(s=>(s[3]<=0&&s[3]!==-2)||s[3]===5);
  // ไพ่ 4 ใบ: ตำแหน่ง = SKORD (สลับได้) • .fc = หน้าไพ่ (เล่นท่าดึงขึ้น/สลาย/ไพ่ใหม่แทรก) • .hg = นาฬิกาทรายตอนคูลดาวน์
  let R=`<div class="h4Sh"></div>`+h4Parts(E,16,(a,b)=>[20+a*480,40+b*200]);
  cards.forEach(s=>{R+=`<div class="h4Cd" data-ci="${s[3]}"><div class="fc"><i class="art"></i>${h4Ico(s[1],62)}<b class="nm">${esc(s[2]||'')}</b><span class="k"></span>${h4Glass(s[3])}</div></div>`;});
  R+=`<div class="h4Ic">`+gems.map(s=>`<div class="h4Gm" data-ci="${s[3]}">${h4Ico(s[1],26)}<i class="sh"></i><b class="n"></b><span class="k">${esc(h4Key(s[0]))}</span></div>`).join('')+`</div><div class="h4Tip">ลากไพ่เพื่อสลับตำแหน่ง • ระหว่างเล่น: กด Alt ค้าง + ปุ่มสกิล 2 ปุ่ม</div>`;
  // ไพ่อัลติใบใหญ่ด้านหลังไพ่ 4 ใบ (ผู้ใช้ 2026-10-28): เศษไพ่ขาด 7 ชิ้น ประกอบเข้าทีละชิ้นตามเกจ (h4UltCard) • เต็ม = ไพ่สมบูรณ์ + ออร่าธาตุ
  const au=`<div class="h4Au ${E.pt}"><i class="fl"></i><i class="fl b"></i>${h4AuBits(E.pt)}${h4Parts(E,18,(a,b)=>{const t=a*Math.PI*2,r=50+b*16;return [58+Math.cos(t)*r,58+Math.sin(t)*r];})}</div>`;
  const uFace=`<i class="art"></i>${U?icoHTML(U.id,'#fff',72):''}<b class="nm">${esc(U?U.n:'')}</b>`;
  R=R.replace('<div class="h4Ic">',h4UltCard(uFace,au)+'<div class="h4Ic">');
  let L=`<div class="h4Sh"></div>`+h4Parts(E,10,(a,b)=>[20+a*260,-30-b*180]);
  L+=`<div class="h4Me"><div class="h4Por"><div class="tk"></div><div class="rg"><i class="fc">${icoHTML('p_'+P.id,E.c1,54)}</i></div><div class="el">${icoHTML('p_'+P.id,E.c1,21)}</div><div class="lv">LV ${typeof progLv==='function'?progLv().L:1}</div></div>
    <div class="h4Hp"><div class="h4Nm">${esc(me.n||'')}<small>${E.n}</small></div><div class="h4Num"><span class="hp">0</span><small class="mh">/ 0</small><em class="xh"></em></div><div class="h4Seg"></div>
    <div class="h4Sub"><i><b></b></i><small></small></div><div class="h4Chips"></div></div></div>`;
  root.innerHTML=`<div class="h4L">${L}</div><div class="h4R">${R}</div>`;
  H4.el=root;H4.cache={};H4.rdy={};H4.segN=0;H4.uFull=false;
  H4.q={hp:root.querySelector('.hp'),mh:root.querySelector('.mh'),xh:root.querySelector('.xh'),seg:root.querySelector('.h4Seg'),sub:root.querySelector('.h4Sub'),subB:root.querySelector('.h4Sub b'),subT:root.querySelector('.h4Sub small'),
    chips:root.querySelector('.h4Chips'),uc:root.querySelector('.h4UC'),ufc:root.querySelector('.h4UC .fc'),up:root.querySelector('.h4UC .up'),uFace,sd:[...root.querySelectorAll('.h4UC .sd')].map(el=>({el,th:+el.dataset.th})),fc:root.querySelector('.fc'),
    slots:[...root.querySelectorAll('.h4Cd,.h4Gm')].map(el=>({el,ci:+el.dataset.ci,sh:el.querySelector('.sh'),n:el.querySelector('.n'),fc:el.querySelector('.fc'),k:el.querySelector('.k'),gem:el.classList.contains('h4Gm')}))};
  h4CardWire(root);h4Place();
  if(H4.face&&H4.faceFor===me.id+'|'+k.path)h4FaceSet();
}
// ค่าเปลี่ยนเท่านั้นถึงเขียน DOM
function h4Set(key,v,fn){if(H4.cache[key]===v)return;H4.cache[key]=v;fn(v);}
function hud4Draw(me,v){
  const k=getKit(me.id),lay=me.id+'|'+k.path+'|'+k.ids.join(',')+'|'+k.ult+'|'+(me.ea?1:0)+'|'+(me.fr?me.fr[0]:'')+'|'+(me.ea&&me.ea[0]>0?1:0)+'|'+(me.ea&&me.ea[8]?1:0)+'|'+(NOBROOM.has(v&&v.mode)?1:0);
  h4OrdLoad(k);
  if(!H4.el||H4.lay!==lay){H4.lay=lay;h4Build(me,v);}
  H4.drawn=true;if(H4.el.hidden)H4.el.hidden=false;
  const Q=H4.q,t=performance.now();
  h4Set('hs',Math.max(0.62,Math.min(1.15,SH/900,SW/1400)).toFixed(3),s=>H4.el.style.setProperty('--hs',s));
  // เลือด: ช่องละ 25 (เลือดสูงสุดเกิน 300 → ช่องละ 50) + เลือดเสริม (xh) ต่อท้ายเป็นช่องฟ้า
  const per=me.mh>300?50:25,nh=Math.ceil(me.mh/per),xh=me.xh|0,nx=Math.ceil(xh/per),N=nh+nx;
  if(H4.segN!==N){H4.segN=N;Q.seg.innerHTML=Array.from({length:N},(_,i)=>`<b class="${i>=nh?'x':''}" style="height:${Math.max(14,26-i*(12/Math.max(1,N-1)))}px"><u></u><i></i></b>`).join('');H4.seg=[...Q.seg.children].map(b=>[b.firstChild,b.lastChild]);}
  const hr=clamp(me.hp/me.mh,0,1);
  if(hr>=H4.trail){H4.trail=hr;H4.hold=0.45;}else if((H4.hold-=HUDF.dt)<=0)H4.trail=Math.max(hr,H4.trail-HUDF.dt*0.6);
  const hpv=me.hp,tr=H4.trail*me.mh;
  for(let i=0;i<nh;i++){const lo=i*per,f=clamp((hpv-lo)/per,0,1),ft=clamp((tr-lo)/per,0,1);h4Set('s'+i,f.toFixed(3),x=>H4.seg[i][1].style.width=x*100+'%');h4Set('t'+i,ft.toFixed(3),x=>H4.seg[i][0].style.width=x*100+'%');}
  for(let i=0;i<nx;i++){const f=clamp((xh-i*per)/per,0,1);h4Set('s'+(nh+i),f.toFixed(3),x=>H4.seg[nh+i][1].style.width=x*100+'%');}
  h4Set('hp',hpv,x=>Q.hp.textContent=x);h4Set('mh',me.mh,x=>Q.mh.textContent='/ '+x);h4Set('xh',xh,x=>Q.xh.textContent=x>0?'+'+x:'');
  h4Set('low',hr<0.35&&me.al,x=>H4.el.classList.toggle('low',x));
  // แถบรอง: พลังโล่ / สายดิน = HP โล่ Stand (แตก = แถบส้มนับฟื้น)
  if(me.ea){const A=me.ea,brk=A[0]>0,val=brk?1-eSmooth('stb',A[0])/15:clamp(A[7]/300,0,1);
    h4Set('sb',val.toFixed(3),x=>Q.subB.style.width=x*100+'%');h4Set('st',brk?'Stand แตก':(A[7]|0)+' / 300',x=>Q.subT.textContent=x);h4Set('sk',brk,x=>Q.sub.classList.toggle('brk',x));}
  else{h4Set('sb',clamp(me.se/100,0,1).toFixed(3),x=>Q.subB.style.width=x*100+'%');h4Set('st','โล่',x=>Q.subT.textContent=x);}
  {let s='';for(const [bit,ic] of STATUS_ICO)if((me.fm|0)&bit)s+=`<span>${ic}</span>`;h4Set('ch',s,x=>Q.chips.innerHTML=x);}
  h4Set('ed',!locked&&screen==='game',x=>{H4.el.classList.toggle('edit',x);if(!x)h4Pick(null);});   // เมาส์ว่าง (Esc/เมนู) = ลากสลับไพ่ได้
  // ช่องสกิล (ไพ่ + ไอคอนเล็ก)
  for(const S of Q.slots){const st=slotState(me,v,S.ci),ok=st.ready&&!st.dim,key='c'+S.ci;
    const cls=(st.ready?'':' cd')+(st.hl?' on':'')+(st.dim?' dim':'')+(st.bar>0?' win':'');
    h4Set(key+'c',cls,x=>{S.el.classList.toggle('cd',!st.ready);S.el.classList.toggle('on',!!st.hl);S.el.classList.toggle('dim',!!st.dim);S.el.classList.toggle('win',st.bar>0);});
    const r=st.bar>0?st.bar:clamp(st.ratio||0,0,1);
    h4Set(key+'r',r.toFixed(3),x=>S.el.style.setProperty('--r',x));
    h4Set(key+'t',st.txt||'',x=>S.n.textContent=x);
    if(!S.gem){   // ไพ่: ใช้แล้ว = ดึงขึ้น + สลาย + ไพ่ใหม่แทรกขึ้นมา • คูลดาวน์จบ = นาฬิกาทรายสลาย
      if(!ok&&H4.rdy[S.ci]===true&&!st.dim&&me.cd[S.ci]>0)h4CardUse(S);
      if(ok&&H4.rdy[S.ci]===false)h4GlassOut(S);}
    else if(ok&&H4.rdy[S.ci]===false&&(S.ci>=1||S.ci===-4)){S.el.classList.remove('pop');void S.el.offsetWidth;S.el.classList.add('pop');}
    H4.rdy[S.ci]=ok;}
  // อัลติ
  const u=Math.min(100,me.u|0),full=u>=100;
  h4Set('u',u,x=>{Q.uc.style.setProperty('--g',(1-x/100).toFixed(3));Q.up.textContent=x>=100?'READY':x+'%';for(const d of Q.sd)d.el.classList.toggle('on',x>=d.th);});
  h4Set('ud',!!slotState(me,v,-2).dim,x=>Q.uc.classList.toggle('dim',x));
  if(full!==H4.uFull){if(H4.uFull&&!full)h4UltUse();H4.uFull=full;Q.uc.classList.toggle('full',full);if(full){Q.uc.classList.remove('burst');void Q.uc.offsetWidth;Q.uc.classList.add('burst');}}
  if(!H4.face||H4.faceFor!==me.id+'|'+k.path)h4FaceShot(me,k);
}
// ---------- ไพ่สกิล: นาฬิกาทราย / ท่าใช้ / สลับตำแหน่ง ----------
// นาฬิกาทราย: ทรายบน = เวลาคูลดาวน์ที่เหลือ (--r ของไพ่) ไหลลงล่าง • ตัวเลขวินาทีใต้แก้ว
function h4Glass(ci){const t='h4t'+ci,b='h4b'+ci;
  return `<div class="hg"><svg viewBox="0 0 40 60"><defs><clipPath id="${t}"><path d="M8 7H32Q31 20 21 29H19Q9 20 8 7Z"/></clipPath><clipPath id="${b}"><path d="M19 31H21Q31 40 32 53H8Q9 40 19 31Z"/></clipPath></defs>
    <path class="gl" d="M8 7H32Q31 20 21 29V31Q31 40 32 53H8Q9 40 19 31V29Q9 20 8 7Z"/>
    <g clip-path="url(#${t})"><rect class="st" x="6" y="7" width="28" height="22"/></g><g clip-path="url(#${b})"><rect class="sb" x="6" y="31" width="28" height="22"/></g>
    <line class="fl" x1="20" y1="28" x2="20" y2="52"/><rect class="cap" x="5" y="3" width="30" height="4" rx="1.5"/><rect class="cap" x="5" y="53" width="30" height="4" rx="1.5"/></svg><b class="n"></b></div>`;}
// ประกายที่ปลิวออกตอนไพ่/นาฬิกาสลาย
const h4Bits=n=>Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2+Math.random()*0.5,d=40+Math.random()*50;
  return `<i style="--dx:${(Math.cos(a)*d).toFixed(0)}px;--dy:${(Math.sin(a)*d-30).toFixed(0)}px;--de:${(Math.random()*0.15).toFixed(2)}s"></i>`;}).join('');
function h4Fx(host,cls,html,ms){const g=document.createElement('div');g.className=cls;g.innerHTML=html;host.appendChild(g);setTimeout(()=>g.remove(),ms);return g;}
// ใช้สกิล: สำเนาหน้าไพ่ลอยขึ้นแล้วสลาย (ประกายปลิว) • ไพ่จริงเล่นท่าแทรกขึ้นจากใต้จอ (มีนาฬิกาทรายทับอยู่แล้ว)
function h4CardUse(S){
  const g=h4Fx(S.el,'h4Gh',`<div class="fc gf">${S.fc.innerHTML}</div><div class="bits">${h4Bits(14)}</div>`,1000);g.querySelector('.hg')?.remove();
  S.fc.classList.remove('draw');void S.fc.offsetWidth;S.fc.classList.add('draw');}
// คูลดาวน์จบ: นาฬิกาทรายสำเนาขยาย + จาง + ประกาย • ไพ่สว่างวาบ
function h4GlassOut(S){const hg=S.fc.querySelector('.hg');if(!hg)return;
  const g=h4Fx(S.el,'h4HgOut',hg.outerHTML+`<div class="bits">${h4Bits(10)}</div>`,900),n=g.querySelector('.n');if(n)n.textContent='';
  S.fc.classList.remove('draw');S.el.classList.remove('pop');void S.el.offsetWidth;S.el.classList.add('pop');}
// วางไพ่ตามลำดับ SKORD (เลื่อนด้วย CSS transition) + ป้ายปุ่มตามตำแหน่ง
function h4Place(){if(!H4.q)return;for(const S of H4.q.slots){if(S.gem)continue;const p=SKORD.indexOf(S.ci);if(p<0)continue;
  S.el.style.left=(16+p*112)+'px';S.el.style.rotate=((p-1.5)*2.4).toFixed(1)+'deg';S.el.style.translate=`0 ${(Math.abs(p-1.5)*7).toFixed(0)}px`;
  S.k.textContent=h4Key(slotKey('QERF'[p]));}}
const h4OrdKey=k=>k.path+'|'+k.ids.join(',');
function h4OrdLoad(k){const id=h4OrdKey(k);if(H4.ordFor===id)return;H4.ordFor=id;let o=null;
  try{o=(JSON.parse(localStorage.getItem('wd_skord')||'{}'))[id];}catch(e){}
  SKORD=o&&o.length===4&&[1,2,3,4].every(i=>o.includes(i))?o.slice():[1,2,3,4];rebuildKeys();h4Place();}
function h4Swap(a,b){if(a===b)return;[SKORD[a],SKORD[b]]=[SKORD[b],SKORD[a]];rebuildKeys();h4Place();
  INPUT.hq=INPUT.he=INPUT.hr=INPUT.hf=0;
  try{const m=JSON.parse(localStorage.getItem('wd_skord')||'{}');m[H4.ordFor]=SKORD.slice();localStorage.setItem('wd_skord',JSON.stringify(m));}catch(e){}}
function h4Pick(p){H4.pick=p;if(!H4.q)return;for(const S of H4.q.slots)if(!S.gem)S.el.classList.toggle('sel',p!=null&&SKORD.indexOf(S.ci)===p);}
// Alt + ปุ่มสกิล: ปุ่มแรก = เลือกไพ่ • ปุ่มที่สอง = สลับ • ปล่อย Alt = ยกเลิก (e=null)
function h4AltKey(e){if(!e){h4Pick(null);return false;}
  const p=[KEYS.q,KEYS.e,KEYS.r,KEYS.f].indexOf(e.code);if(p<0)return false;e.preventDefault();
  if(H4.pick==null||H4.pick===p)h4Pick(p);else{h4Swap(H4.pick,p);h4Pick(null);}return true;}
// เมาส์ว่าง: ลากไพ่ไปวางทับอีกใบ = สลับ • หรือคลิกใบหนึ่งแล้วคลิกอีกใบ
function h4CardWire(root){let drag=null;
  const posAt=(x,y)=>{for(const S of H4.q.slots){if(S.gem||S===drag?.S)continue;const r=S.el.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return SKORD.indexOf(S.ci);}return -1;};
  for(const el of root.querySelectorAll('.h4Cd'))el.addEventListener('pointerdown',ev=>{if(!root.classList.contains('edit'))return;ev.preventDefault();
    drag={S:H4.q.slots.find(q=>q.el===el),x:ev.clientX,y:ev.clientY,moved:false};el.setPointerCapture(ev.pointerId);});
  root.addEventListener('pointermove',ev=>{if(!drag)return;const dx=ev.clientX-drag.x,dy=ev.clientY-drag.y;
    if(!drag.moved&&Math.hypot(dx,dy)>6){drag.moved=true;drag.S.el.classList.add('drag');}
    if(drag.moved){const s=parseFloat(getComputedStyle(root).getPropertyValue('--hs'))||1;drag.S.fc.style.transform=`translate(${(dx/s).toFixed(0)}px,${(dy/s).toFixed(0)}px) scale(1.06)`;}});
  const up=ev=>{if(!drag)return;const S=drag.S,moved=drag.moved,me=SKORD.indexOf(S.ci),to=posAt(ev.clientX,ev.clientY);drag=null;S.el.classList.remove('drag');S.fc.style.transform='';
    if(moved){if(to>=0)h4Swap(me,to);h4Pick(null);}
    else if(H4.pick!=null&&H4.pick!==me){h4Swap(H4.pick,me);h4Pick(null);}else h4Pick(H4.pick===me?null:me);};
  root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);}
// ---------- ไพ่อัลติ ----------
// เศษไพ่ (เปอร์เซ็นต์ของไพ่) เรียงตามลำดับที่ประกอบเข้า: ล่าง → บน • ชิ้นที่ยังไม่ได้ = เงาจาง • ช่องว่างระหว่างเศษ (--g) หดลงจนชิดเมื่อเกจเต็ม
const H4SH=[[[0,80],[42,72],[58,70],[100,78],[100,100],[0,100]],[[0,55],[50,48],[42,72],[0,80]],[[50,48],[100,52],[100,78],[58,70],[42,72]],
  [[0,30],[38,22],[62,26],[50,48],[0,55]],[[62,26],[100,18],[100,52],[50,48]],[[0,0],[45,0],[38,22],[0,30]],[[45,0],[100,0],[100,18],[62,26],[38,22]]];
function h4UltCard(face,au){
  const sd=H4SH.map((P,i)=>{const cx=P.reduce((a,p)=>a+p[0],0)/P.length-50,cy=P.reduce((a,p)=>a+p[1],0)/P.length-50,l=Math.hypot(cx,cy)||1;
    return `<div class="sd" data-th="${Math.round((i+1)*100/8)}" style="--dx:${(cx/l*12).toFixed(1)}px;--dy:${(cy/l*12).toFixed(1)}px;--rt:${((i%2?1:-1)*(4+i)).toFixed(0)}deg"><div class="si" style="clip-path:polygon(${P.map(p=>p[0]+'% '+p[1]+'%').join(',')})">${face}</div></div>`;}).join('');
  return `<div class="h4UC" data-ci="-2">${au}<i class="stk"></i><i class="stk b"></i><div class="fc">${sd}<i class="edge"></i></div><span class="k">${esc(h4Key(slotKey('X')))}</span><b class="up">0%</b></div>`;}
// กดอัลติ: ไพ่สมบูรณ์ถูกดึงออกจากกอง ลอยขึ้น แล้วไหม้สลาย (เหมือนไพ่สกิล) • กองเหลือแต่เงาเศษไพ่ เริ่มสะสมใหม่
function h4UltUse(){const Q=H4.q;
  h4Fx(Q.uc,'h4Gh',`<div class="fc gf"><div class="si">${Q.uFace}</div></div><div class="bits">${h4Bits(22)}</div>`,1100);
  Q.ufc.classList.remove('draw');void Q.ufc.offsetWidth;Q.ufc.classList.add('draw');}
// เรียกท้ายทุกเฟรมจาก render loop: เฟรมนี้ไม่ได้วาด HUD (ชนะ/แพ้, โหมด imp, ไม่มีตัวเรา) = ซ่อน
function hud4Frame(){if(H4.el&&!H4.drawn&&!H4.el.hidden)H4.el.hidden=true;H4.drawn=false;}
function hud4Hide(){try{if(H4.el)H4.el.hidden=true;}catch(e){}}   // setScreen เรียกได้ตั้งแต่ตอนโหลดไฟล์ (H4 ยังไม่พร้อม)
// รูปหน้าตัวละครของเรา: เรนเดอร์ฉากครั้งเดียวด้วยกล้องเล็กหน้าหัว → RT 160×160 → dataURL (ลองใหม่ทุก 1 วิ ถ้าโมเดลยังไม่พร้อม)
let _h4RT=null,_h4Cam=null;const _h4Box=new THREE.Box3();
function h4FaceShot(me,k){const n=performance.now();if(n-H4.faceTry<1000)return;H4.faceTry=n;
  const o=PM3.get(me.id);if(!o||!o.g||!o.g.visible||!me.al)return;
  try{const S=160;if(!_h4RT){_h4RT=new THREE.WebGLRenderTarget(S,S);_h4Cam=new THREE.PerspectiveCamera(30,1,0.05,50);}
    const g=o.g,ry=g.rotation.y,fx=Math.sin(ry),fz=Math.cos(ry),P=g.position;
    const hy=_h4Box.setFromObject(o.b||o.g).max.y-0.26;   // ยอดหัว (ผม) − ครึ่งหัว
    _h4Cam.position.set(P.x+fx*1.3+Math.cos(ry)*0.3,hy+0.08,P.z+fz*1.3-Math.sin(ry)*0.3);_h4Cam.lookAt(P.x,hy,P.z);
    const prev=gl.getRenderTarget();gl.setRenderTarget(_h4RT);gl.render(scene,_h4Cam);
    const px=new Uint8Array(S*S*4);gl.readRenderTargetPixels(_h4RT,0,0,S,S,px);gl.setRenderTarget(prev);
    const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),im=x.createImageData(S,S);
    for(let y=0;y<S;y++)im.data.set(px.subarray((S-1-y)*S*4,(S-y)*S*4),y*S*4);x.putImageData(im,0,0);
    let sum=0;for(let i=0;i<px.length;i+=64)sum+=px[i]+px[i+1]+px[i+2];if(sum<50)return;   // ยังดำทั้งภาพ (ฉากยังไม่พร้อม)
    H4.face=c.toDataURL('image/jpeg',0.85);H4.faceFor=me.id+'|'+k.path;h4FaceSet();
  }catch(e){H4.faceFor=me.id+'|'+k.path;}}
function h4FaceSet(){if(H4.q&&H4.q.fc&&H4.face){H4.q.fc.style.backgroundImage=`url(${H4.face})`;H4.q.fc.innerHTML='';}}
