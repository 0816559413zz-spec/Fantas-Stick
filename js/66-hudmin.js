// ---------- Minimal HUD (Settings > หน้าจอ > รูปแบบ HUD, user 2026-11-25) ----------
// Clean military-shooter style: thin lines, white text, small dark backing, element colour only as a small accent.
// Bottom-left = minimap (canvas, js/38 drawMinimap at hmMapBox) + team list + name + HP number/bar + shield.
// Bottom-right = 4 skill slots (SKORD order) + small slots (basic / shield / dash / broom) + ultimate.
// No particles, no looping CSS animations, no filters. Data = the same helpers as HUD round 4 (mySlots, slotState, h4Shield).
const HM={el:null,lay:'',q:null,cache:{},rdy:{},drawn:false};
const hudMin=()=>SET.hud===1;
function hmSet(k,v,fn){if(HM.cache[k]===v)return;HM.cache[k]=v;fn(v);}
const hmHs=()=>Math.max(0.62,Math.min(1.15,SH/900,SW/1400));
// minimap square (screen px) — matches .hmMap in css/hudmin.css (left 26, bottom 24, 150 × --hs)
function hmMapBox(hs){const S=150*hs;return {x:26*hs,y:SH-24*hs-S,S,hide:false};}
function hmBuild(me,v){
  const [P,E]=h4Pal(me),MYS=mySlots(me),k=getKit(me.id),U=SPELL_LIST[k.ult];
  let root=document.getElementById('hm');
  if(!root){root=document.createElement('div');root.id='hm';root.hidden=true;const cvEl=document.getElementById('cv');cvEl.parentNode.insertBefore(root,cvEl.nextSibling);}
  root.style.setProperty('--ac',E.c1);
  const slot=(key,ic,ci,cls,sz)=>`<div class="hmS ${cls}" data-ci="${ci}"><div class="ic">${h4Ico(ic,sz)}</div><i class="cd"></i><b class="n"></b><span class="k">${esc(h4Key(key))}</span></div>`;
  const cards=MYS.filter(s=>s[3]>=1&&s[3]<=4).sort((a,b)=>SKORD.indexOf(a[3])-SKORD.indexOf(b[3]));
  const gems=MYS.filter(s=>(s[3]<=0&&s[3]!==-2)||s[3]===5);
  const R=`<div class="hmGm">${gems.map(s=>slot(s[0],s[1],s[3],'sm',18)).join('')}</div>`
    +`<div class="hmSk">${cards.map(s=>slot(slotKey('QERF'[SKORD.indexOf(s[3])]),s[1],s[3],'sk',30)).join('')}</div>`
    +`<div class="hmU" data-ci="-2"><div class="ic">${U?icoHTML(U.id,'#fff',34):''}</div><i class="cd"></i><b class="pct">0%</b><span class="k">${esc(h4Key(slotKey('X')))}</span><i class="bar"><u></u></i></div>`;
  const L=`<div class="hmMap"></div><div class="hmInfo"><div class="hmSq"></div><div class="hmChips"></div>
    <div class="hmNm">${esc(me.n||'')}<small>${E.n}</small></div>
    <div class="hmHp"><b class="hp">0</b><small class="mh">/ 0</small><em class="xh"></em></div>
    <div class="hmBar"><i class="tr"></i><i class="f"></i><i class="x"></i></div>
    <div class="hmSub"><small></small><i><b></b></i></div></div>`;
  root.innerHTML=`<div class="hmL">${L}</div><div class="hmR">${R}</div>`;
  HM.el=root;HM.cache={};HM.rdy={};
  const $q=s=>root.querySelector(s);
  HM.q={hp:$q('.hp'),mh:$q('.mh'),xh:$q('.xh'),bar:$q('.hmBar'),f:$q('.hmBar .f'),tr:$q('.hmBar .tr'),x:$q('.hmBar .x'),sub:$q('.hmSub'),subB:$q('.hmSub b'),subT:$q('.hmSub small'),
    chips:$q('.hmChips'),sq:$q('.hmSq'),map:$q('.hmMap'),u:$q('.hmU'),up:$q('.hmU .pct'),ub:$q('.hmU .bar u'),
    slots:[...root.querySelectorAll('.hmS')].map(el=>({el,ci:+el.dataset.ci,n:el.querySelector('.n')}))};
}
function hudMinDraw(me,v,lay){
  lay+='|'+SKORD.join('');
  if(!HM.el||HM.lay!==lay){HM.lay=lay;hmBuild(me,v);}
  HM.drawn=true;if(HM.el.hidden)HM.el.hidden=false;
  const Q=HM.q,k=getKit(me.id);
  hmSet('hs',hmHs().toFixed(3),s=>HM.el.style.setProperty('--hs',s));
  // HP: number + one bar (tick every 25 / 50) + trailing damage + extra HP (xh) as a cyan overlay
  const per=me.mh>300?50:25,hr=clamp(me.hp/me.mh,0,1),xh=me.xh|0;
  if(hr>=H4.trail){H4.trail=hr;H4.hold=0.45;}else if((H4.hold-=HUDF.dt)<=0)H4.trail=Math.max(hr,H4.trail-HUDF.dt*0.6);
  hmSet('tk',(per/me.mh*100).toFixed(2),x=>Q.bar.style.setProperty('--tk',x+'%'));
  hmSet('f',hr.toFixed(3),x=>Q.f.style.width=x*100+'%');
  hmSet('tr',H4.trail.toFixed(3),x=>Q.tr.style.width=x*100+'%');
  hmSet('xb',clamp(xh/me.mh,0,1).toFixed(3),x=>Q.x.style.width=x*100+'%');
  hmSet('hp',me.hp,x=>Q.hp.textContent=x);hmSet('mh',me.mh,x=>Q.mh.textContent='/ '+x);hmSet('xh',xh,x=>Q.xh.textContent=x>0?'+'+x:'');
  hmSet('low',hr<0.35&&me.al,x=>HM.el.classList.toggle('low',x));
  {const [sf,stx,sbk,shide]=h4Shield(me,k);
    hmSet('sb',sf.toFixed(3),x=>Q.subB.style.width=x*100+'%');hmSet('st',stx,x=>Q.subT.textContent=x);
    hmSet('sk',sbk,x=>Q.sub.classList.toggle('brk',x));hmSet('sh',shide,x=>Q.sub.style.display=x?'none':'');}
  {let s='';for(const [bit,ic] of STATUS_ICO)if((me.fm|0)&bit)s+=`<span>${ic}</span>`;hmSet('ch',s,x=>Q.chips.innerHTML=x);}
  // skill slots: cooldown shade from the top (--r) + seconds • ready again = short accent flash (one-shot)
  for(const S of Q.slots){const st=slotState(me,v,S.ci),ok=st.ready&&!st.dim,key='c'+S.ci;
    hmSet(key+'c',(st.ready?'':'cd ')+(st.hl?'on ':'')+(st.dim?'dim':''),()=>{S.el.classList.toggle('wait',!st.ready);S.el.classList.toggle('on',!!st.hl);S.el.classList.toggle('dim',!!st.dim);});
    const r=st.bar>0?st.bar:clamp(st.ratio||0,0,1);
    hmSet(key+'r',r.toFixed(3),x=>S.el.style.setProperty('--r',x));
    hmSet(key+'t',st.txt||'',x=>S.n.textContent=x);
    if(ok&&HM.rdy[S.ci]===false){S.el.classList.remove('pop');void S.el.offsetWidth;S.el.classList.add('pop');}
    HM.rdy[S.ci]=ok;}
  // ultimate: % + thin bar • full = accent border
  const u=Math.min(100,me.u|0);
  hmSet('u',u,x=>{Q.up.textContent=x>=100?'READY':x+'%';Q.ub.style.width=x+'%';Q.u.style.setProperty('--r',(1-x/100).toFixed(3));Q.u.classList.toggle('full',x>=100);});
  hmSet('ud',!!slotState(me,v,-2).dim,x=>Q.u.classList.toggle('dim',x));
  // team list (same rule as HUD round 4) — only rows that exist, no empty placeholders
  {const tm=teamOn(v)||v.mode==='tdm'||v.mode==='quid',L=(v.P||[]).filter(p=>p.id!==me.id&&(v.mode==='coop'||tm&&p.tm===me.tm)).slice(0,5);
    hmSet('sqL',L.map(p=>p.id+':'+(p.n||'')).join('|'),()=>{Q.sq.innerHTML=L.map(p=>`<div class="r" data-id="${esc(p.id)}"><b>${esc(p.n||'')}</b><i><u></u></i></div>`).join('');});
    for(const p of L){const r=Q.sq.querySelector(`[data-id="${CSS.escape(p.id)}"]`);if(!r)continue;hmSet('sq'+p.id,p.al?clamp(p.hp/p.mh,0,1).toFixed(2):'x',x=>{r.classList.toggle('dead',x==='x');r.querySelector('u').style.width=(x==='x'?0:x*100)+'%';});}}
  hmSet('mini',!!SET.mini,x=>Q.map.classList.toggle('off',!x));
}
// end of frame: not drawn this frame (Full HUD, victory, no player) = hidden
function hudMinFrame(){if(HM.el&&!HM.drawn&&!HM.el.hidden)HM.el.hidden=true;HM.drawn=false;}
if(window.WD)Object.assign(window.WD,{SET,HM,hudMin});   // headless tests
