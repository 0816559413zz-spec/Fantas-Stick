// ---------- HUD รอบ 4 (ผู้ใช้ 2026-10-23, designs/hud-full-mock.html) ----------
// DOM ทับ #cv: ซ้ายล่าง = รูปตัวละคร + เลือดช่องเฉียง • ขวาล่าง = แบบ L2 (ไพ่สกิลโค้งบนวงประตูมิติ + อัญมณีปุ่มเล็ก + ลูกแก้วอัลติ) • สีตามธาตุ
// สร้างโครงครั้งเดียวต่อธาตุ แล้วอัปเดตเฉพาะค่าที่เปลี่ยน (js/38 drawBottom → hud4Draw) • ไม่ถูกวาดในเฟรมไหน = ซ่อน (hud4Frame จาก render loop)
// สีของ HUD canvas เดิม (แผ่นป้าย/kill feed/แผนที่ย่อ = HG/HG2 ใน js/38) ก็เปลี่ยนตามธาตุด้วย hud4Col
const H4E={
  pyro:{c0:'#5a1206',c1:'#ff6a2a',c2:'#ffc27a',cb:'#4a1a10',pt:'ember',n:'PYRO'},
  frost:{c0:'#0a2a5a',c1:'#8fe0ff',c2:'#e6f8ff',cb:'#13305a',pt:'snow',n:'FROST'},
  storm:{c0:'#4a3a06',c1:'#ffe27a',c2:'#fff6c8',cb:'#3a3010',pt:'spark',n:'STORM'},
  earth:{c0:'#3a2410',c1:'#c9a36a',c2:'#f0dcb4',cb:'#3a2a18',pt:'rock',n:'EARTH'}};
const H4={el:null,on:false,drawn:false,pid:'',lay:'',cache:{},rdy:{},seg:[],segN:0,trail:1,hold:0,uFull:false,face:null,faceFor:'',faceTry:0};
const H4C=440,H4RC=330;   // มุมวง (พิกัดในกล่อง 480×480 ขวาล่าง) + รัศมีวงที่ไพ่วางอยู่
function h4Pal(me){const k=getKit(me.id),P=PATHS[k.path]||PATHS[0];return [P,H4E[P.id]||H4E.frost];}
// สีของ HUD canvas (js/38) ตามธาตุของเรา — เรียกทุกเฟรมจาก drawHUD
function hud4Col(me){if(!me)return;const E=h4Pal(me)[1];HG=E.c1;HG2=E.c2;}
const h4Runes=(R,n,col)=>Array.from({length:n},(_,i)=>`<text x="0" y="${-R+9}" fill="${col}" opacity=".7" font-size="9" text-anchor="middle" transform="rotate(${(i*360/n).toFixed(1)})">${'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉ'[i%15]}</text>`).join('');
function h4RingSVG(E){const C=H4C,RC=H4RC,id='h4g'+E.n;
  return `<svg class="h4Ring" viewBox="0 0 480 480"><defs><radialGradient id="${id}" cx="${C}" cy="${C}" r="${RC+90}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset=".18" stop-color="${E.c1}"/><stop offset=".55" stop-color="${E.c0}" stop-opacity=".85"/><stop offset="1" stop-color="#0a0c18" stop-opacity="0"/></radialGradient></defs>
  <circle cx="${C}" cy="${C}" r="${RC+90}" fill="url(#${id})" opacity=".8"/>
  <g class="spin2">${Array.from({length:12},(_,i)=>{const a=i*0.52;return `<path d="M${C} ${C} q ${(150*Math.cos(a)).toFixed(0)} ${(150*Math.sin(a)).toFixed(0)} ${(280*Math.cos(a+1.1)).toFixed(0)} ${(280*Math.sin(a+1.1)).toFixed(0)}" fill="none" stroke="${E.c2}" stroke-opacity="${(0.12+0.05*(i%3)).toFixed(2)}" stroke-width="${1+i%2}"/>`;}).join('')}</g>
  <g transform="translate(${C} ${C})"><circle r="${RC+30}" fill="rgba(9,12,30,.35)"/><circle r="${RC}" fill="rgba(9,12,30,.3)" stroke="${E.c1}" stroke-width="3"/><circle r="${RC-12}" fill="none" stroke="${E.c2}" stroke-opacity=".3"/><circle r="${RC*0.6}" fill="none" stroke="${E.c1}" stroke-opacity=".45"/></g>
  <g class="spin"><g transform="translate(${C} ${C})"><circle r="${RC+12}" fill="none" stroke="${E.c2}" stroke-opacity=".45" stroke-dasharray="2 6"/>
  ${Array.from({length:120},(_,i)=>`<line x1="0" y1="${-RC-12}" x2="0" y2="${i%5?-RC-17:-RC-24}" stroke="${E.c1}" stroke-opacity=".7" transform="rotate(${i*3})"/>`).join('')}${h4Runes(RC-14,70,E.c2)}</g></g>
  <g class="spin2"><g transform="translate(${C} ${C})">${h4Runes(RC*0.6-2,40,E.c2)}</g></g></svg>`;}
// อนุภาคธาตุ: จุดเกิดสุ่มในวง (ซ้ายล่าง: รอบรูป) • การเคลื่อนเป็น CSS animation ล้วน
function h4Parts(E,n,box){const an={ember:'h4Rise',snow:'h4Fall',spark:'h4Flick',rock:'h4Fall'}[E.pt];let o='';
  for(let i=0;i<n;i++){const [x,y]=box(Math.random(),Math.random());
    o+=`<i style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;--an:${an};--du:${(E.pt==='spark'?1.6:3+Math.random()*3).toFixed(2)}s;--de:${(-Math.random()*6).toFixed(2)}s;--dx:${(Math.random()*40-20).toFixed(0)}px"></i>`;}
  return `<div class="h4P ${E.pt}">${o}</div>`;}
const h4Key=k=>({'คลิกซ้าย':'LMB','คลิกขวา':'RMB','กดค้าง':'HOLD'})[k]||k;
const h4Ico=(ic,sz)=>ic&&typeof ic==='object'?icoHTML(ic.id,'#fff',sz):`<span style="font-size:${Math.round(sz*0.8)}px">${ic||''}</span>`;
function h4Build(me,v){
  const [P,E]=h4Pal(me),MYS=mySlots(me),k=getKit(me.id),U=SPELL_LIST[k.ult];
  let root=document.getElementById('h4');
  if(!root){root=document.createElement('div');root.id='h4';root.hidden=true;const cvEl=document.getElementById('cv');cvEl.parentNode.insertBefore(root,cvEl.nextSibling);}
  root.style.cssText=`--c0:${E.c0};--c1:${E.c1};--c2:${E.c2};--cb:${E.cb}`;
  const cards=MYS.filter(s=>s[3]>=1&&s[3]<=4),gems=MYS.filter(s=>(s[3]<=0&&s[3]!==-2)||s[3]===5);
  let R=`<div class="h4Sh"></div>${h4RingSVG(E)}`;
  R+=h4Parts(E,22,(a,b)=>{const t=(180+a*90)*Math.PI/180,r=40+b*(H4RC+30);return [H4C+Math.cos(t)*r,H4C+Math.sin(t)*r];});
  cards.forEach((s,i)=>{const d=196+i*20,a=d*Math.PI/180,x=H4C+Math.cos(a)*H4RC,y=H4C+Math.sin(a)*H4RC;
    R+=`<div class="h4Cd" data-ci="${s[3]}" style="left:${(x-39).toFixed(1)}px;top:${(y-55).toFixed(1)}px;transform:rotate(${(((d+90)-360)*0.55).toFixed(1)}deg)"><i class="gem"></i>${h4Ico(s[1],46)}<i class="sh"></i><b class="n"></b><span class="k">${esc(h4Key(s[0]))}</span></div>`;});
  const gs=gems.length>4?19:21,g0=gems.length>4?186:196;
  gems.forEach((s,i)=>{const a=(g0+i*gs)*Math.PI/180,x=H4C+Math.cos(a)*H4RC*0.6,y=H4C+Math.sin(a)*H4RC*0.6;
    R+=`<div class="h4Gm" data-ci="${s[3]}" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px">${h4Ico(s[1],26)}<i class="sh"></i><b class="n"></b><span class="k">${esc(h4Key(s[0]))}</span></div>`;});
  R+=`<div class="h4U"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="3"/><circle class="ua" cx="50" cy="50" r="48" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-dasharray="301.6" stroke-dashoffset="301.6" transform="rotate(-90 50 50)"/></svg>
    <div class="tx"><b class="up">0%</b><small>${esc(U?U.n:'')}</small></div><span class="k">${esc(slotKey('X'))}</span></div>`;
  let L=`<div class="h4Sh"></div>`+h4Parts(E,10,(a,b)=>[20+a*260,-30-b*180]);
  L+=`<div class="h4Me"><div class="h4Por"><div class="tk"></div><div class="rg"><i class="fc">${icoHTML('p_'+P.id,E.c1,54)}</i></div><div class="el">${icoHTML('p_'+P.id,E.c1,21)}</div><div class="lv">LV ${typeof progLv==='function'?progLv().L:1}</div></div>
    <div class="h4Hp"><div class="h4Nm">${esc(me.n||'')}<small>${E.n}</small></div><div class="h4Num"><span class="hp">0</span><small class="mh">/ 0</small><em class="xh"></em></div><div class="h4Seg"></div>
    <div class="h4Sub"><i><b></b></i><small></small></div><div class="h4Chips"></div></div></div>`;
  root.innerHTML=`<div class="h4L">${L}</div><div class="h4R">${R}</div>`;
  H4.el=root;H4.cache={};H4.rdy={};H4.segN=0;H4.uFull=false;
  H4.q={hp:root.querySelector('.hp'),mh:root.querySelector('.mh'),xh:root.querySelector('.xh'),seg:root.querySelector('.h4Seg'),sub:root.querySelector('.h4Sub'),subB:root.querySelector('.h4Sub b'),subT:root.querySelector('.h4Sub small'),
    chips:root.querySelector('.h4Chips'),u:root.querySelector('.h4U'),ua:root.querySelector('.ua'),up:root.querySelector('.up'),fc:root.querySelector('.fc'),
    slots:[...root.querySelectorAll('.h4Cd,.h4Gm')].map(el=>({el,ci:+el.dataset.ci,sh:el.querySelector('.sh'),n:el.querySelector('.n'),gem:el.classList.contains('h4Gm')}))};
  if(H4.face&&H4.faceFor===me.id+'|'+k.path)h4FaceSet();
}
// ค่าเปลี่ยนเท่านั้นถึงเขียน DOM
function h4Set(key,v,fn){if(H4.cache[key]===v)return;H4.cache[key]=v;fn(v);}
function hud4Draw(me,v){
  const k=getKit(me.id),lay=me.id+'|'+k.path+'|'+k.ids.join(',')+'|'+k.ult+'|'+(me.ea?1:0)+'|'+(me.fr?me.fr[0]:'')+'|'+(me.ea&&me.ea[0]>0?1:0)+'|'+(me.ea&&me.ea[8]?1:0);
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
  // ช่องสกิล (ไพ่ + อัญมณี)
  for(const S of Q.slots){const st=slotState(me,v,S.ci),ok=st.ready&&!st.dim,key='c'+S.ci;
    const cls=(st.ready?'':' cd')+(st.hl?' on':'')+(st.dim?' dim':'')+(st.bar>0?' win':'');
    h4Set(key+'c',cls,x=>{S.el.classList.toggle('cd',!st.ready);S.el.classList.toggle('on',!!st.hl);S.el.classList.toggle('dim',!!st.dim);S.el.classList.toggle('win',st.bar>0);});
    const r=st.bar>0?st.bar:clamp(st.ratio||0,0,1);
    if(S.gem)h4Set(key+'r',r.toFixed(3),x=>S.sh.style.setProperty('--r',x));else h4Set(key+'r',r.toFixed(3),x=>S.sh.style.height=x*100+'%');
    h4Set(key+'t',st.txt||'',x=>S.n.textContent=x);
    if(ok&&H4.rdy[S.ci]===false&&(S.ci>=1||S.ci===-4)){S.el.classList.remove('pop');void S.el.offsetWidth;S.el.classList.add('pop');}
    H4.rdy[S.ci]=ok;}
  // อัลติ
  const u=Math.min(100,me.u|0),full=u>=100;
  h4Set('u',u,x=>{Q.ua.setAttribute('stroke-dashoffset',(301.6*(1-x/100)).toFixed(1));Q.up.textContent=x>=100?'READY':x+'%';Q.up.style.fontSize=x>=100?'20px':'';});
  if(full!==H4.uFull){H4.uFull=full;Q.u.classList.toggle('full',full);if(full){Q.u.classList.remove('burst');void Q.u.offsetWidth;Q.u.classList.add('burst');}}
  if(!H4.face||H4.faceFor!==me.id+'|'+k.path)h4FaceShot(me,k);
}
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
