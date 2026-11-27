// HUD Editor — design mode (user 2026-11-25): hand-draw HUD ideas over the game + place game skills/HUD pieces.
// Reference only: the game never reads these. Saved to huddesign/<id>.json|.png|.md (serve.py /api/hud-design) for Claude to read.
// Uses globals from hudedit.html: W (game WD), GW (game window), sc, RW, RH, fit(), msg(), $.
'use strict';
const HD=window.HD={on:false,tool:'sel',doc:null,sel:[],hist:[],redo:[],clip:null,drag:null,poly:null,edit:null,bgC:null,bgDirty:false,
  hideHud:false,showLay:true,grid:false,lib:null,libEl:'pyro',tab:'lib',zoom:1,list:[]};
const lsGet=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
const ST0={c:'#ffffff',f:'#4a8cff',fill:0,w:4,o:1,fs:28,r:10,dash:0,bold:1};
HD.st=Object.assign({},ST0,lsGet('hd_st',{}));
const SW8=['#ffffff','#111111','#ff3b3b','#ffb000','#ffe14d','#2ee86b','#3aa0ff','#b36bff','#ff6ad5','#8fe0ff'];
const TOOLS=[['sel','↖','เลือก/ย้าย','V'],['pen','✎','ปากกา','P'],['marker','▌','ปากกาเน้น','M'],['eraser','⌫','ยางลบ','E'],['line','╱','เส้นตรง','L'],['arrow','➜','ลูกศร','A'],
  ['rect','▭','สี่เหลี่ยม','R'],['ell','◯','วงรี','O'],['poly','⬠','หลายเหลี่ยม','G'],['text','T','ข้อความ','T'],['img','🖼','ใส่รูป','I'],['pick','⌖','ดูดสี','K']];
const TN={pen:'ลายเส้น',line:'เส้นตรง',arrow:'ลูกศร',rect:'สี่เหลี่ยม',ell:'วงรี',poly:'หลายเหลี่ยม',text:'ข้อความ',img:'รูป',stamp:'ชิ้น HUD'};
const FALLBACK={c0:'#0a2a5a',c1:'#8fe0ff',c2:'#e6f8ff',cb:'#13305a'};
const pal=el=>(HD.lib&&HD.lib.H4E[el])||FALLBACK;
const elName=el=>{if(el==='stormgod')return 'สายฟ้า (ร่างเทพ)';const P=HD.lib&&HD.lib.paths.find(p=>p.id===el);return P?P.n:el;};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clampN=(v,a,b)=>Math.max(a,Math.min(b,v));
function newDoc(){return {name:'แบบ HUD ใหม่',note:'',w:RW,h:RH,bg:{mode:'live',src:'',col:'#1d2230'},objs:[]};}

// ---------- images (icons tinted, inserted pictures, background) ----------
const IMG=new Map(),TINT=new Map();
function img(src){if(!src)return null;let o=IMG.get(src);if(!o){o=new Image();o.onload=()=>{TINT.clear();redraw();};o.src=src;IMG.set(src,o);}return o.complete&&o.naturalWidth?o:null;}
function tint(src,col,sz){const im=img(src);if(!im)return null;sz=Math.max(8,Math.round(sz));const k=src+'|'+col+'|'+sz;let c=TINT.get(k);if(c)return c;
  c=document.createElement('canvas');c.width=c.height=sz;const g=c.getContext('2d');g.drawImage(im,0,0,sz,sz);g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,sz,sz);
  if(TINT.size>400)TINT.clear();TINT.set(k,c);return c;}
function drawIco(g,src,col,cx,cy,sz){const t=tint(src,col,sz*2);if(t)g.drawImage(t,cx-sz/2,cy-sz/2,sz,sz);else{g.save();g.strokeStyle=col;g.globalAlpha*=.5;g.strokeRect(cx-sz/2,cy-sz/2,sz,sz);g.restore();}}

// ---------- HUD piece stamps (look of the current HUD, drawn at in-game size for 1600×900) ----------
const FONT='Kanit,"Noto Sans Thai","Segoe UI",sans-serif';
function rr(g,x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,Math.min(r,w/2,h/2));}
function txt(g,s,x,y,sz,col,al,wt,sh){g.font=`${wt||600} ${sz}px ${FONT}`;g.textAlign=al||'center';g.textBaseline='middle';if(sh!==0){g.fillStyle='rgba(0,0,0,.65)';g.fillText(s,x+1,y+1.5);}g.fillStyle=col;g.fillText(s,x,y);}
function badge(g,x,y,r,s,E){g.beginPath();g.arc(x,y,r,0,7);g.fillStyle='rgba(0,0,0,.6)';g.fill();g.strokeStyle=E.c1;g.lineWidth=1.2;g.stroke();txt(g,s,x,y+.5,r*1.05,'#fff','center',600,0);}
const ST={
  card:{n:'การ์ดสกิล',w:82,h:114,p:{el:'pyro',sp:'',key:'Q',name:'สกิล',cd:0},d(g,p,E){
    const gr=g.createLinearGradient(0,0,0,114);gr.addColorStop(0,E.c0);gr.addColorStop(1,E.cbot||'#0a0c18');rr(g,1,1,80,112,9);g.fillStyle=gr;g.fill();g.strokeStyle=E.c1;g.lineWidth=1.6;g.stroke();
    rr(g,5,5,72,104,7);g.strokeStyle='rgba(255,255,255,.13)';g.lineWidth=1;g.stroke();
    drawIco(g,p.ic,E.ic||'#fff',41,50,46);txt(g,String(p.name||'').slice(0,14),41,98,10,E.tx||E.c2);badge(g,15,15,10,p.key||'',E);
    if(+p.cd>0){rr(g,1,1,80,112,9);g.fillStyle='rgba(0,0,0,.6)';g.fill();txt(g,String(p.cd),41,54,28,'#fff','center',700);}}},
  ult:{n:'ไพ่อัลติ',w:126,h:176,p:{el:'pyro',sp:'',key:'X',name:'อัลติ',pct:60},d(g,p,E){
    rr(g,1,1,124,174,12);g.fillStyle='#0b0e1c';g.fill();const k=clampN(+p.pct||0,0,100)/100;
    g.save();rr(g,1,1,124,174,12);g.clip();const gr=g.createLinearGradient(0,175,0,175-174*k);gr.addColorStop(0,E.c0);gr.addColorStop(1,E.c1);g.fillStyle=gr;g.fillRect(0,175-174*k,126,174*k);
    g.fillStyle=E.c2;g.fillRect(0,175-174*k-2,126,3);g.restore();rr(g,1,1,124,174,12);g.strokeStyle=E.c1;g.lineWidth=1.8;g.stroke();
    drawIco(g,p.ic,k>=1?'#fff':'rgba(0,0,0,.55)',63,74,66);txt(g,k>=1?'READY':Math.round(k*100)+'%',63,136,k>=1?20:24,'#fff','center',700);badge(g,63,160,11,p.key||'X',E);}},
  gem:{n:'ปุ่มเล็ก',w:46,h:46,p:{el:'pyro',sp:'',key:'LMB',name:''},d(g,p,E){
    rr(g,2,2,42,42,8);g.fillStyle='rgba(8,11,24,.82)';g.fill();g.strokeStyle=E.c1;g.lineWidth=1.4;g.stroke();drawIco(g,p.ic,E.c2,23,21,26);txt(g,p.key||'',23,38,9,'#fff');}},
  icon:{n:'ไอคอนสกิล',w:64,h:64,p:{el:'pyro',sp:'',c:'#ffffff'},d(g,p){drawIco(g,p.ic,p.c||'#fff',32,32,62);}},
  hp:{n:'หลอดเลือด + โล่',w:300,h:52,p:{el:'pyro',seg:8,hp:0.7,sh:0.5,num:'140'},d(g,p,E){
    txt(g,p.num||'',2,10,18,'#fff','left',700);const n=clampN(Math.round(+p.seg||8),1,30),gap=4,bw=(290-gap*(n-1))/n,f=clampN(+p.hp,0,1)*n;
    g.fillStyle='rgba(6,9,20,.6)';rr(g,4,22,286,6,3);g.fill();g.fillStyle=E.c2;rr(g,4,22,286*clampN(+p.sh,0,1),6,3);g.fill();
    for(let i=0;i<n;i++){const x=8+i*(bw+gap);g.save();g.transform(1,0,-0.4,1,0,0);g.translate(20,0);g.fillStyle='rgba(6,9,20,.6)';g.fillRect(x,32,bw,18);
      const k=clampN(f-i,0,1);if(k>0){const gr=g.createLinearGradient(0,32,0,50);gr.addColorStop(0,'#fff');gr.addColorStop(.4,E.c2);gr.addColorStop(1,E.c1);g.fillStyle=gr;g.fillRect(x,32,bw*k,18);}
      g.strokeStyle='rgba(255,255,255,.18)';g.strokeRect(x+.5,32.5,bw-1,17);g.restore();}}},
  portrait:{n:'รูปตัวละคร',w:120,h:120,p:{el:'pyro'},d(g,p,E){
    g.beginPath();g.arc(60,60,56,0,7);const gr=g.createRadialGradient(60,50,10,60,60,58);gr.addColorStop(0,'#2a3048');gr.addColorStop(1,'#0a0c16');g.fillStyle=gr;g.fill();
    g.save();g.beginPath();g.arc(60,60,54,0,7);g.clip();g.fillStyle=E.c2;g.globalAlpha=.45;g.beginPath();g.arc(60,48,18,0,7);g.fill();g.beginPath();g.ellipse(60,104,36,30,0,0,7);g.fill();g.restore();
    g.beginPath();g.arc(60,60,56,0,7);g.strokeStyle=E.c1;g.lineWidth=4;g.stroke();}},
  minimap:{n:'แผนที่ย่อ',w:176,h:176,p:{el:'pyro'},d(g,p,E){
    g.fillStyle='rgba(6,10,22,.82)';g.fillRect(0,0,176,176);g.save();g.translate(88,88);g.rotate(.35);g.fillStyle='rgba(40,52,86,.6)';g.fillRect(-70,-56,140,112);g.strokeStyle='rgba(217,180,90,.45)';g.strokeRect(-70,-56,140,112);g.restore();
    for(const [x,y,c] of [[40,60,'#3aa0ff'],[120,46,'#ff4a4a'],[130,120,'#ff4a4a'],[60,130,'#3aa0ff']]){g.beginPath();g.arc(x,y,3.6,0,7);g.fillStyle=c;g.fill();}
    g.save();g.translate(88,88);g.beginPath();g.moveTo(0,-8);g.lineTo(6,7);g.lineTo(0,3);g.lineTo(-6,7);g.closePath();g.fillStyle=E.c2;g.fill();g.restore();
    g.strokeStyle=E.c1;g.lineWidth=1.5;g.strokeRect(.75,.75,174.5,174.5);txt(g,'N',88,12,10,E.c2);}},
  team:{n:'รายชื่อทีม',w:170,h:92,p:{el:'pyro',names:'Bot1,Bot2,Bot3,Bot4'},d(g,p,E){
    const L=String(p.names||'').split(',').slice(0,6);L.forEach((s,i)=>{const y=4+i*22;g.fillStyle='rgba(6,9,20,.6)';rr(g,0,y,170,18,3);g.fill();txt(g,s.trim(),6,y+9,11,'#fff','left',500);
      g.fillStyle='rgba(0,0,0,.5)';g.fillRect(96,y+6,68,6);g.fillStyle=i%3===2?'#ffc94d':'#5be37d';g.fillRect(96,y+6,68*(1-i*.17),6);});}},
  topbar:{n:'แถบบน (คะแนน/เวลา)',w:380,h:34,p:{el:'pyro',text:'ทีมฟ้า 3 — 2 ทีมแดง • ⏱ 4:12'},d(g,p,E){
    rr(g,0,0,380,34,4);g.fillStyle='rgba(7,11,24,.86)';g.fill();g.strokeStyle=E.c1;g.globalAlpha*=.7;g.lineWidth=1;g.stroke();g.globalAlpha/=.7;txt(g,p.text||'',190,17.5,15,'#efe6cf');}},
  feed:{n:'Kill feed',w:220,h:24,p:{el:'pyro',text:'Bot1 ⚡ → Bot2'},d(g,p,E){
    const gr=g.createLinearGradient(0,0,220,0);gr.addColorStop(0,'rgba(7,11,24,0)');gr.addColorStop(.2,'rgba(7,11,24,.85)');gr.addColorStop(1,'rgba(7,11,24,.85)');g.fillStyle=gr;g.fillRect(0,0,220,24);
    g.fillStyle=E.c1;g.fillRect(218,0,2,24);txt(g,p.text||'',210,12.5,13,'#efe6cf','right',500);}},
  banner:{n:'ข้อความกลางจอ',w:420,h:56,p:{el:'pyro',text:'เริ่ม!'},d(g,p,E){
    txt(g,p.text||'',210,28,34,E.c2,'center',700);g.font=`700 34px ${FONT}`;const w=Math.min(300,g.measureText(p.text||'').width)/2;g.strokeStyle=E.c1;g.lineWidth=1;
    for(const s of [-1,1]){g.beginPath();g.moveTo(210+s*(w+14),28);g.lineTo(210+s*(w+80),28);g.stroke();}}},
  xhair:{n:'เป้าเล็ง',w:40,h:40,p:{kind:0,c:'#ffffff'},d(g,p){const c=p.c||'#fff',k=+p.kind||0;g.lineCap='round';
    const L=(w,col)=>{g.strokeStyle=col;g.lineWidth=w;g.beginPath();if(k===0||k===3){for(const [a,b,c2,d] of [[20,4,20,14],[20,26,20,36],[4,20,14,20],[26,20,36,20]]){g.moveTo(a,b);g.lineTo(c2,d);}}
      if(k===2||k===3){g.moveTo(32,20);g.arc(20,20,12,0,7);}g.stroke();if(k===1){g.beginPath();g.arc(20,20,3,0,7);g.fillStyle=col;g.fill();}};L(4,'rgba(0,0,0,.6)');L(2,c);}},
  ring:{n:'วงเกจรอบเป้า',w:120,h:120,p:{el:'pyro',v:0.6,a0:-150,a1:-30},d(g,p,E){const a0=(+p.a0-90)*Math.PI/180,a1=(+p.a1-90)*Math.PI/180,v=clampN(+p.v,0,1);
    g.lineCap='round';g.lineWidth=6;g.strokeStyle='rgba(6,9,20,.6)';g.beginPath();g.arc(60,60,52,a0,a1);g.stroke();g.strokeStyle=E.c1;g.shadowColor=E.c1;g.shadowBlur=8;g.beginPath();g.arc(60,60,52,a0,a0+(a1-a0)*v);g.stroke();}},
  bar:{n:'เกจพลัง',w:200,h:16,p:{el:'pyro',v:0.5,label:'Heat'},d(g,p,E){rr(g,0,0,200,16,8);g.fillStyle='rgba(6,9,20,.7)';g.fill();const v=clampN(+p.v,0,1);
    if(v>0){const gr=g.createLinearGradient(0,0,200,0);gr.addColorStop(0,E.c1);gr.addColorStop(1,E.c2);rr(g,0,0,200*v,16,8);g.fillStyle=gr;g.fill();}rr(g,.5,.5,199,15,8);g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=1;g.stroke();txt(g,p.label||'',8,8.5,10,'#fff','left',600);}},
  chip:{n:'ไอคอนสถานะ',w:40,h:40,p:{emo:'🔥',t:'3'},d(g,p){rr(g,1,1,38,38,7);g.fillStyle='rgba(8,11,24,.8)';g.fill();g.strokeStyle='rgba(255,255,255,.3)';g.lineWidth=1;g.stroke();
    g.font=`20px "Segoe UI Emoji",sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(p.emo||'',20,18);txt(g,p.t||'',33,33,10,'#fff','right',700);}},
  dmg:{n:'ตัวเลขดาเมจ',w:64,h:40,p:{text:'24',c:'#ffd86b'},d(g,p){g.font=`800 30px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.lineWidth=4;g.strokeStyle='rgba(20,6,0,.85)';g.strokeText(p.text||'',32,21);g.fillStyle=p.c||'#ffd86b';g.fillText(p.text||'',32,21);}},
  tag:{n:'ป้ายชื่อ + เลือดศัตรู',w:80,h:30,p:{name:'Bot1',hp:0.6},d(g,p){txt(g,p.name||'',40,9,13,'#fff');const h=clampN(+p.hp,0,1);g.fillStyle='rgba(0,0,0,.6)';g.fillRect(15,20,50,6);g.fillStyle=h>.5?'#5be37d':h>.25?'#ffc94d':'#ff5a5a';g.fillRect(15,20,50*h,6);}},
  boss:{n:'หลอดเลือดบอส',w:440,h:40,p:{el:'pyro',name:'Troll',hp:0.7},d(g,p,E){txt(g,p.name||'',220,9,13,'#efe6cf');rr(g,0,20,440,16,3);g.fillStyle='rgba(6,9,20,.8)';g.fill();
    const gr=g.createLinearGradient(0,20,0,36);gr.addColorStop(0,'#ff8a7a');gr.addColorStop(1,'#a8141e');rr(g,2,22,436*clampN(+p.hp,0,1),12,2);g.fillStyle=gr;g.fill();rr(g,.5,20.5,439,15,3);g.strokeStyle=E.c1;g.lineWidth=1;g.stroke();}},
};
const PSEL={kind:[['0','กากบาท'],['1','จุด'],['2','วงกลม'],['3','กากบาท + วง']]};
const PLBL={el:'ธาตุ',sp:'สกิล',key:'ปุ่ม',name:'ชื่อ',cd:'คูลดาวน์ (วิ)',pct:'เกจ %',seg:'จำนวนช่อง',hp:'เลือด',sh:'โล่',num:'ตัวเลข',text:'ข้อความ',label:'ป้าย',v:'ค่า',a0:'มุมเริ่ม',a1:'มุมจบ',c:'สี',kind:'แบบ',emo:'อีโมจิ',t:'เวลา',names:'ชื่อ (คั่นด้วย ,)'};
function drawStamp(g,o){const D=ST[o.k];if(!D)return;g.save();g.translate(o.x,o.y);g.scale(o.w/D.w,o.h/D.h);D.d(g,o.p||{},pal((o.p||{}).el));g.restore();}

// ---------- geometry ----------
const isBox=o=>o.t==='rect'||o.t==='ell'||o.t==='img'||o.t==='stamp';
function txtLines(o){return String(o.s||'').split('\n');}
const tFont=o=>`${o.bold?700:400} ${o.fs}px ${FONT}`;
function txtSize(o){const g=HD.mg||(HD.mg=document.createElement('canvas').getContext('2d'));g.font=tFont(o);const L=txtLines(o);return [Math.max(4,...L.map(l=>g.measureText(l).width))+(o.f?o.fs*.5:0),L.length*o.fs*1.25+(o.f?o.fs*.3:0)];}
function bbox(o){
  if(isBox(o)){const x=Math.min(o.x,o.x+o.w),y=Math.min(o.y,o.y+o.h);return {x,y,w:Math.abs(o.w),h:Math.abs(o.h)};}
  if(o.t==='text'){const [w,h]=txtSize(o);return {x:o.x,y:o.y,w,h};}
  const P=o.t==='line'||o.t==='arrow'?[o.a,o.b]:o.pts;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const [x,y] of P){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  const m=(o.w||0)/2;return {x:x0-m,y:y0-m,w:x1-x0+2*m,h:y1-y0+2*m};}
function selBox(L){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const o of L){const b=bbox(o);x0=Math.min(x0,b.x);y0=Math.min(y0,b.y);x1=Math.max(x1,b.x+b.w);y1=Math.max(y1,b.y+b.h);}return {x:x0,y:y0,w:x1-x0,h:y1-y0};}
// map every point of o through f (k = size factor for widths/fonts)
function xform(o,f,k){
  if(isBox(o)){const a=f([o.x,o.y]),b=f([o.x+o.w,o.y+o.h]);o.x=Math.min(a[0],b[0]);o.y=Math.min(a[1],b[1]);o.w=Math.abs(b[0]-a[0]);o.h=Math.abs(b[1]-a[1]);if(o.t!=='img'&&o.t!=='stamp'&&o.sw)o.sw*=k;}
  else if(o.t==='text'){const a=f([o.x,o.y]);o.x=a[0];o.y=a[1];o.fs=Math.max(6,o.fs*k);}
  else if(o.t==='line'||o.t==='arrow'){o.a=f(o.a);o.b=f(o.b);o.w*=k;}
  else{o.pts=o.pts.map(f);o.w*=k;}}
function segD(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy;let t=L?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L:0;t=clampN(t,0,1);return Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dy*t);}
function hit(o,p){const tol=6/sc;
  if(o.t==='pen'||o.t==='line'||o.t==='arrow'||(o.t==='poly'&&!o.f)){if(o.er)return false;const P=o.t==='line'||o.t==='arrow'?[o.a,o.b]:o.t==='poly'?[...o.pts,o.pts[0]]:o.pts;
    for(let i=1;i<P.length;i++)if(segD(p,P[i-1],P[i])<(o.w||2)/2+tol)return true;return P.length===1&&Math.hypot(p[0]-P[0][0],p[1]-P[0][1])<(o.w||2)/2+tol;}
  const b=bbox(o);return p[0]>=b.x-tol&&p[0]<=b.x+b.w+tol&&p[1]>=b.y-tol&&p[1]<=b.y+b.h+tol;}

// ---------- render ----------
let dcv,dui,dbgc,ta;
function drawObj(g,o){g.save();g.globalAlpha=o.o==null?1:o.o;const dash=o.dash?[Math.max(2,(o.w||o.sw||2)*3),Math.max(2,(o.w||o.sw||2)*2)]:[];
  if(o.t==='pen'){if(o.er)g.globalCompositeOperation='destination-out';g.strokeStyle=o.c;g.lineWidth=o.w;g.lineCap=o.mk?'butt':'round';g.lineJoin='round';const P=o.pts;g.beginPath();g.moveTo(P[0][0],P[0][1]);
    if(P.length<3){g.lineTo(P[P.length-1][0]+.01,P[P.length-1][1]);}else{for(let i=1;i<P.length-1;i++){const mx=(P[i][0]+P[i+1][0])/2,my=(P[i][1]+P[i+1][1])/2;g.quadraticCurveTo(P[i][0],P[i][1],mx,my);}g.lineTo(P[P.length-1][0],P[P.length-1][1]);}g.stroke();}
  else if(o.t==='line'||o.t==='arrow'){g.strokeStyle=g.fillStyle=o.c;g.lineWidth=o.w;g.lineCap='round';g.setLineDash(dash);const [ax,ay]=o.a,[bx,by]=o.b,an=Math.atan2(by-ay,bx-ax),hs=Math.max(10,o.w*3.2);
    g.beginPath();g.moveTo(ax,ay);g.lineTo(o.t==='arrow'?bx-Math.cos(an)*hs*.6:bx,o.t==='arrow'?by-Math.sin(an)*hs*.6:by);g.stroke();
    if(o.t==='arrow'){g.setLineDash([]);g.beginPath();g.moveTo(bx,by);g.lineTo(bx-Math.cos(an-.45)*hs,by-Math.sin(an-.45)*hs);g.lineTo(bx-Math.cos(an+.45)*hs,by-Math.sin(an+.45)*hs);g.closePath();g.fill();}}
  else if(o.t==='rect'||o.t==='ell'){g.beginPath();if(o.t==='rect')g.roundRect(o.x,o.y,o.w,o.h,Math.min(o.r||0,Math.abs(o.w)/2,Math.abs(o.h)/2));else g.ellipse(o.x+o.w/2,o.y+o.h/2,Math.abs(o.w/2),Math.abs(o.h/2),0,0,7);
    if(o.f){g.fillStyle=o.f;g.fill();}if(o.sw>0){g.setLineDash(dash);g.strokeStyle=o.c;g.lineWidth=o.sw;g.stroke();}}
  else if(o.t==='poly'){const P=o.pts;g.beginPath();P.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));if(o.cl!==0)g.closePath();if(o.f&&o.cl!==0){g.fillStyle=o.f;g.fill();}g.setLineDash(dash);g.lineJoin='round';g.strokeStyle=o.c;g.lineWidth=o.w;g.stroke();}
  else if(o.t==='text'){const [w,h]=txtSize(o),pd=o.f?o.fs*.25:0;if(o.f){g.fillStyle=o.f;rr(g,o.x,o.y,w,h,o.fs*.2);g.fill();}g.font=tFont(o);g.textBaseline='top';g.textAlign='left';
    txtLines(o).forEach((l,i)=>{const y=o.y+pd*.6+i*o.fs*1.25+o.fs*.1;if(o.sh!==0){g.fillStyle='rgba(0,0,0,.7)';g.fillText(l,o.x+pd+1.5,y+1.5);}g.fillStyle=o.c;g.fillText(l,o.x+pd,y);});}
  else if(o.t==='img'){const im=img(o.src);if(im)g.drawImage(im,o.x,o.y,o.w,o.h);}
  else if(o.t==='stamp')drawStamp(g,o);
  g.restore();}
function redraw(){if(!dcv||!HD.doc)return;const g=dcv.getContext('2d');g.clearRect(0,0,dcv.width,dcv.height);for(const o of HD.doc.objs)if(!o.hid&&o!==HD.edit)drawObj(g,o);if(HD.drag&&HD.drag.tmp)drawObj(g,HD.drag.tmp);if(HD.poly)drawObj(g,HD.poly);drawUI();}
const HND=['nw','n','ne','e','se','s','sw','w'];
function hPos(b,h){return [b.x+b.w*(h.includes('w')?0:h.includes('e')?1:.5),b.y+b.h*(h.includes('n')?0:h.includes('s')?1:.5)];}
function drawUI(){if(!dui)return;const d=devicePixelRatio||1,g=dui.getContext('2d');g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,dui.width,dui.height);if(!HD.on)return;
  if(HD.grid){g.strokeStyle='rgba(255,255,255,.07)';g.lineWidth=1;g.beginPath();for(let x=0;x<=RW;x+=20){g.moveTo(x*sc+.5,0);g.lineTo(x*sc+.5,RH*sc);}for(let y=0;y<=RH;y+=20){g.moveTo(0,y*sc+.5);g.lineTo(RW*sc,y*sc+.5);}g.stroke();
    g.strokeStyle='rgba(74,140,255,.35)';g.beginPath();g.moveTo(RW*sc/2+.5,0);g.lineTo(RW*sc/2+.5,RH*sc);g.moveTo(0,RH*sc/2+.5);g.lineTo(RW*sc,RH*sc/2+.5);g.stroke();}
  g.strokeStyle='#4a8cff';g.lineWidth=1;g.setLineDash([4,3]);for(const o of HD.sel){const b=bbox(o);g.strokeRect(b.x*sc+.5,b.y*sc+.5,b.w*sc,b.h*sc);}g.setLineDash([]);
  if(HD.sel.length&&!(HD.drag&&HD.drag.mode==='mv')){const b=selBox(HD.sel);g.strokeStyle='#4a8cff';g.lineWidth=1.2;g.strokeRect(b.x*sc,b.y*sc,b.w*sc,b.h*sc);
    g.fillStyle='#fff';for(const h of HND){const [x,y]=hPos(b,h);g.fillRect(x*sc-4,y*sc-4,8,8);g.strokeRect(x*sc-4,y*sc-4,8,8);}}
  const D=HD.drag;if(D&&D.mode==='mq'){const x=Math.min(D.p0[0],D.p1[0]),y=Math.min(D.p0[1],D.p1[1]);g.fillStyle='rgba(74,140,255,.12)';g.strokeStyle='#4a8cff';g.fillRect(x*sc,y*sc,Math.abs(D.p1[0]-D.p0[0])*sc,Math.abs(D.p1[1]-D.p0[1])*sc);g.strokeRect(x*sc+.5,y*sc+.5,Math.abs(D.p1[0]-D.p0[0])*sc,Math.abs(D.p1[1]-D.p0[1])*sc);}
  if(HD.tool==='eraser'&&HD.mp){g.strokeStyle='rgba(255,255,255,.8)';g.beginPath();g.arc(HD.mp[0]*sc,HD.mp[1]*sc,HD.st.w*1.5*sc,0,7);g.stroke();}}

// ---------- history / draft ----------
function mark(){HD.hist.push(JSON.stringify(HD.doc.objs));if(HD.hist.length>150)HD.hist.shift();HD.redo=[];}
let draftT=0;function changed(){HD.dirty=true;clearTimeout(draftT);draftT=setTimeout(()=>lsSet('hd_draft',HD.doc),400);redraw();renderSel();if(HD.tab==='layers')renderRight();}
function undo(){if(!HD.hist.length)return;HD.redo.push(JSON.stringify(HD.doc.objs));HD.doc.objs=JSON.parse(HD.hist.pop());HD.sel=[];changed();}
function redoF(){if(!HD.redo.length)return;HD.hist.push(JSON.stringify(HD.doc.objs));HD.doc.objs=JSON.parse(HD.redo.pop());HD.sel=[];changed();}

// ---------- pointer ----------
const snap=v=>HD.grid?Math.round(v/10)*10:v;
function pt(e){const r=dui.getBoundingClientRect();return [(e.clientX-r.left)/sc,(e.clientY-r.top)/sc];}
function sty(t){const s=HD.st,base={c:s.c,o:s.o,dash:s.dash};
  if(t==='pen')return Object.assign(base,{w:s.w});
  if(t==='marker')return Object.assign(base,{w:Math.max(10,s.w*3),o:Math.min(s.o,.4),mk:1});
  if(t==='eraser')return {er:1,w:Math.max(6,s.w*3),c:'#000',o:1};
  if(t==='line'||t==='arrow')return Object.assign(base,{w:s.w});
  if(t==='rect'||t==='ell')return Object.assign(base,{sw:s.w,f:s.fill?s.f:'',r:t==='rect'?s.r:0});
  if(t==='poly')return Object.assign(base,{w:s.w,f:s.fill?s.f:''});
  return base;}
function topHit(p){const L=HD.doc.objs;for(let i=L.length-1;i>=0;i--){const o=L[i];if(!o.hid&&!o.lk&&hit(o,p))return o;}return null;}
function handleAt(p){if(!HD.sel.length)return null;const b=selBox(HD.sel);for(const h of HND){const [x,y]=hPos(b,h);if(Math.abs(p[0]-x)*sc<7&&Math.abs(p[1]-y)*sc<7)return h;}return null;}
function onDown(e){if(e.button===2)return;if(HD.edit){finishText();return;}const p=pt(e),t=HD.tool;dui.setPointerCapture(e.pointerId);
  if(t==='sel'){const h=handleAt(p);if(h){mark();HD.drag={mode:'rs',h,b0:selBox(HD.sel),orig:HD.sel.map(o=>JSON.stringify(o))};return;}
    const o=topHit(p);if(o){if(e.shiftKey){HD.sel=HD.sel.includes(o)?HD.sel.filter(x=>x!==o):[...HD.sel,o];renderSel();drawUI();return;}
      if(!HD.sel.includes(o))HD.sel=[o];if(e.altKey){mark();const cp=HD.sel.map(x=>JSON.parse(JSON.stringify(x)));HD.doc.objs.push(...cp);HD.sel=cp;}else mark();
      HD.drag={mode:'mv',p0:p,orig:HD.sel.map(o=>JSON.stringify(o)),moved:false};renderSel();drawUI();return;}
    if(!e.shiftKey)HD.sel=[];HD.drag={mode:'mq',p0:p,p1:p,add:e.shiftKey?HD.sel.slice():[]};renderSel();drawUI();return;}
  if(t==='pen'||t==='marker'||t==='eraser'){HD.drag={mode:'draw',tmp:Object.assign({t:'pen',pts:[p]},sty(t))};redraw();return;}
  if(t==='line'||t==='arrow'){const q=[snap(p[0]),snap(p[1])];HD.drag={mode:'shape',tmp:Object.assign({t,a:q,b:q.slice()},sty(t))};return;}
  if(t==='rect'||t==='ell'){const q=[snap(p[0]),snap(p[1])];HD.drag={mode:'shape',p0:q,tmp:Object.assign({t,x:q[0],y:q[1],w:0,h:0},sty(t))};return;}
  if(t==='poly'){const q=[snap(p[0]),snap(p[1])];if(!HD.poly){HD.poly=Object.assign({t:'poly',pts:[q,q.slice()],cl:0},sty(t));}
    else{const f=HD.poly.pts[0];if(HD.poly.pts.length>3&&Math.hypot(q[0]-f[0],q[1]-f[1])*sc<10){HD.poly.pts.pop();finishPoly(true);return;}HD.poly.pts.push(q.slice());}redraw();return;}
  if(t==='text'){const o=topHit(p);if(o&&o.t==='text'){startText(o);return;}startText(null,p);return;}
  if(t==='img'){HD.imgAt=p;$('#hdFile').click();return;}
  if(t==='pick'){pickColor(p,e.shiftKey);return;}}
function onMove(e){const p=pt(e);HD.mp=p;const D=HD.drag;
  if(HD.poly){HD.poly.pts[HD.poly.pts.length-1]=[snap(p[0]),snap(p[1])];redraw();return;}
  if(!D){if(HD.tool==='eraser')drawUI();if(HD.tool==='sel'){const h=handleAt(p);dui.style.cursor=h?(h==='n'||h==='s'?'ns-resize':h==='e'||h==='w'?'ew-resize':h==='nw'||h==='se'?'nwse-resize':'nesw-resize'):topHit(p)?'move':'default';}return;}
  if(D.mode==='draw'){const P=D.tmp.pts,l=P[P.length-1];if(Math.hypot(p[0]-l[0],p[1]-l[1])*sc>1.5)P.push(p);redraw();return;}
  if(D.mode==='shape'){const o=D.tmp;let q=[snap(p[0]),snap(p[1])];
    if(o.t==='line'||o.t==='arrow'){if(e.shiftKey){const dx=q[0]-o.a[0],dy=q[1]-o.a[1],an=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*(Math.PI/4),L=Math.hypot(dx,dy);q=[o.a[0]+Math.cos(an)*L,o.a[1]+Math.sin(an)*L];}o.b=q;}
    else{let w=q[0]-D.p0[0],h=q[1]-D.p0[1];if(e.shiftKey){const m=Math.max(Math.abs(w),Math.abs(h));w=Math.sign(w||1)*m;h=Math.sign(h||1)*m;}o.x=Math.min(D.p0[0],D.p0[0]+w);o.y=Math.min(D.p0[1],D.p0[1]+h);o.w=Math.abs(w);o.h=Math.abs(h);}redraw();return;}
  if(D.mode==='mv'){let dx=p[0]-D.p0[0],dy=p[1]-D.p0[1];if(e.shiftKey){if(Math.abs(dx)>Math.abs(dy))dy=0;else dx=0;}if(HD.grid){dx=snap(dx);dy=snap(dy);}D.moved=true;
    HD.sel.forEach((o,i)=>{Object.assign(o,JSON.parse(D.orig[i]));xform(o,q=>[q[0]+dx,q[1]+dy],1);});redraw();return;}
  if(D.mode==='rs'){const b=D.b0,h=D.h;let x0=b.x,y0=b.y,x1=b.x+b.w,y1=b.y+b.h;const q=[snap(p[0]),snap(p[1])];
    if(h.includes('w'))x0=q[0];if(h.includes('e'))x1=q[0];if(h.includes('n'))y0=q[1];if(h.includes('s'))y1=q[1];
    let sx=(x1-x0)/(b.w||1),sy=(y1-y0)/(b.h||1);const keep=e.shiftKey!==(HD.sel.length===1&&(HD.sel[0].t==='stamp'||HD.sel[0].t==='img'||HD.sel[0].t==='text'))&&h.length===2;
    if(keep||HD.sel.some(o=>o.t==='text')){const s=Math.abs(sx)>Math.abs(sy)?sx:sy;sx=sy=s;if(h.includes('w'))x0=x1-b.w*s;if(h.includes('n'))y0=y1-b.h*s;}
    if(h==='n'||h==='s')sx=1,x0=b.x;if(h==='e'||h==='w')sy=1,y0=b.y;if(HD.sel.some(o=>o.t==='text')&&h.length===1){return;}
    const ox=h.includes('w')?x1:x0,oy=h.includes('n')?y1:y0,bx=h.includes('w')?b.x+b.w:b.x,by=h.includes('n')?b.y+b.h:b.y,k=Math.sqrt(Math.abs(sx*sy));
    HD.sel.forEach((o,i)=>{Object.assign(o,JSON.parse(D.orig[i]));xform(o,q=>[ox+(q[0]-bx)*sx,oy+(q[1]-by)*sy],k);});redraw();return;}
  if(D.mode==='mq'){D.p1=p;const x0=Math.min(D.p0[0],p[0]),y0=Math.min(D.p0[1],p[1]),x1=Math.max(D.p0[0],p[0]),y1=Math.max(D.p0[1],p[1]);
    HD.sel=[...D.add,...HD.doc.objs.filter(o=>{if(o.hid||o.lk||o.er||D.add.includes(o))return false;const b=bbox(o);return b.x>=x0&&b.y>=y0&&b.x+b.w<=x1&&b.y+b.h<=y1;})];drawUI();}}
function onUp(){const D=HD.drag;HD.drag=null;if(!D){return;}
  if(D.mode==='draw'||D.mode==='shape'){const o=D.tmp,b=bbox(o);if(D.mode==='shape'&&b.w<3&&b.h<3){redraw();return;}mark();HD.doc.objs.push(o);if(D.mode==='shape')HD.sel=[o];changed();return;}
  if(D.mode==='mv'){if(!D.moved)HD.hist.pop();changed();return;}
  if(D.mode==='rs'){changed();return;}
  if(D.mode==='mq'){renderSel();drawUI();}}
function finishPoly(close){const o=HD.poly;HD.poly=null;if(!o)return;if(!close)o.pts.pop();if(o.pts.length<2){redraw();return;}o.cl=close&&o.pts.length>2?1:0;if(!o.cl)delete o.f;mark();HD.doc.objs.push(o);HD.sel=[o];changed();}
// ---------- text ----------
function startText(o,p){const s=HD.st;if(!o){o={t:'text',x:p[0],y:p[1],s:'',fs:s.fs,c:s.c,o:s.o,bold:s.bold,f:s.fill?s.f:''};}HD.edit=o;
  ta.value=o.s;ta.style.display='block';ta.style.left=o.x*sc+'px';ta.style.top=o.y*sc+'px';ta.style.font=`${o.bold?700:400} ${o.fs*sc}px ${FONT}`;ta.style.color=o.c;ta.style.minWidth=Math.max(60,o.fs*sc*3)+'px';
  autoTa();setTimeout(()=>ta.focus(),0);redraw();}
function autoTa(){ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';ta.style.width='auto';ta.style.width=Math.max(60,ta.scrollWidth+8)+'px';}
function finishText(cancel){const o=HD.edit;if(!o)return;HD.edit=null;ta.style.display='none';const v=ta.value.replace(/\s+$/,'');const inDoc=HD.doc.objs.includes(o);
  if(cancel){redraw();return;}if(!v){if(inDoc){mark();HD.doc.objs.splice(HD.doc.objs.indexOf(o),1);HD.sel=[];changed();}return;}
  mark();o.s=v;if(!inDoc)HD.doc.objs.push(o);HD.sel=[o];changed();}
// ---------- color picker / images ----------
function composite(withDesign){const c=document.createElement('canvas');c.width=RW;c.height=RH;const g=c.getContext('2d');drawBg(g,true);if(withDesign)g.drawImage(dcv,0,0);return c;}
function pickColor(p,fill){try{const d=composite(true).getContext('2d').getImageData(Math.round(p[0]),Math.round(p[1]),1,1).data;const hx='#'+[d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,'0')).join('');
  if(fill){HD.st.f=hx;HD.st.fill=1;}else HD.st.c=hx;saveSt();renderLeft();msg('ดูดสี '+hx+(fill?' เป็นสีพื้น':' เป็นสีเส้น'));}catch(e){msg('ดูดสีไม่ได้: '+e.message,'--serr');}}
function grabGame(withHud){const c=document.createElement('canvas');c.width=RW;c.height=RH;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,RW,RH);
  try{const d=GW.document;W.render(1/60,GW.performance.now());g.drawImage(d.getElementById('gl'),0,0,RW,RH);if(withHud)g.drawImage(d.getElementById('cv'),0,0,RW,RH);}catch(e){}return c;}
function drawBg(g,forSave){const B=HD.doc.bg;if(B.mode==='none'){g.fillStyle=B.col||'#1d2230';g.fillRect(0,0,RW,RH);return;}
  if(B.mode==='snap'&&HD.bgC){g.drawImage(HD.bgC,0,0,RW,RH);return;}if(forSave)g.drawImage(grabGame(!HD.hideHud),0,0);}
function setBg(){if(!dbgc)return;const B=HD.doc.bg,show=HD.on&&B.mode!=='live';dbgc.style.display=show?'block':'none';if(show){const g=dbgc.getContext('2d');dbgc.width=RW;dbgc.height=RH;drawBg(g,false);}}
function snapGame(){if(!W){msg('เกมยังไม่พร้อม','--serr');return;}HD.bgC=grabGame(!HD.hideHud);HD.bgDirty=true;HD.doc.bg.mode='snap';setBg();renderRight();msg('ถ่ายภาพฉากเกมเป็นพื้นหลังแล้ว');}
function hideGameHud(on){HD.hideHud=on;try{const d=GW.document;let st=d.getElementById('hdHide');if(!st){st=d.createElement('style');st.id='hdHide';d.head.appendChild(st);}st.textContent=on?'#h4,#hm,#cv{visibility:hidden!important}':'';}catch(e){}}
function addImageFile(f,at){const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,RW*.5/im.width,RH*.5/im.height),w=im.width*k,h=im.height*k,p=at||[RW/2,RH/2];
  IMG.set(rd.result,im);mark();const o={t:'img',x:p[0]-w/2,y:p[1]-h/2,w,h,src:rd.result,o:1};HD.doc.objs.push(o);HD.sel=[o];setTool('sel');changed();};im.src=rd.result;};rd.readAsDataURL(f);}

// ---------- library (skills from the game + HUD pieces) ----------
function loadLib(){if(!W||!W.hudLib)return false;const L=W.hudLib(),org=GW.location.origin+'/',rel=u=>u?u.replace(org,''):'';
  const paths=W.PATHS.map((P,i)=>({...P,i})).filter(P=>!P.off);const spells={};
  for(const P of paths){const A=[];const add=(id,n,kind)=>{if(id&&L.hasIco(id))A.push({id,n,kind,ic:rel(L.icoURL(id))});};
    add('b_'+P.id,L.PBASIC[P.i]||'ตีปกติ','ปกติ');add('sh_'+P.id,'โล่','โล่');add('dsh_'+P.id,'พุ่ง','พุ่ง');
    for(const S of W.SPELL_LIST.filter(s=>s.path===P.i&&!s.ult)){const u=rel(L.icoURL(S.id));A.push({id:S.id,n:S.n,kind:'สกิล',ic:u});}
    for(const S of W.SPELL_LIST.filter(s=>s.path===P.i&&s.ult))A.push({id:S.id,n:S.n,kind:'อัลติ',ic:rel(L.icoURL(S.id))});
    spells[P.id]=A;}
  spells.stormgod=spells.storm||[];
  HD.lib={H4E:L.H4E,paths:paths.map(P=>({id:P.id,n:P.n,col:P.col})),spells};if(!spells[HD.libEl])HD.libEl=paths[0].id;return true;}
const els=()=>HD.lib?[...HD.lib.paths.map(p=>p.id),'stormgod']:['pyro'];
function spellOf(el,id){return ((HD.lib&&HD.lib.spells[el])||[]).find(s=>s.id===id);}
function stampKindFor(S){return S.kind==='อัลติ'?'ult':S.kind==='สกิล'?'card':'gem';}
function sampleFor(k,el){const A=(HD.lib&&HD.lib.spells[el])||[],want=k==='ult'?'อัลติ':k==='gem'?'ปกติ':'สกิล',S=A.find(s=>s.kind===want)||A[0];return S?{sp:S.id,ic:S.ic,name:S.n}:{};}
function newStamp(k,p,at){if(ST[k].p.sp!==undefined&&!(p&&p.sp))p=Object.assign(sampleFor(k,(p&&p.el)||HD.libEl),p||{});const D=ST[k],kk=W&&W.hudHs?W.hudHs():1,w=D.w*kk,h=D.h*kk,c=at||[RW/2,RH/2];return {t:'stamp',k,x:c[0]-w/2,y:c[1]-h/2,w,h,o:1,p:Object.assign(JSON.parse(JSON.stringify(D.p)),p||{})};}
function spellStamp(el,S,k,at){const p={el,sp:S.id,ic:S.ic,name:S.n};if(k==='card')p.key='Q';if(k==='gem')p.key=S.kind==='ปกติ'?'LMB':S.kind==='โล่'?'RMB':'Shift';if(k==='icon')p.c=pal(el).c1;return newStamp(k,p,at);}
function place(o){mark();HD.doc.objs.push(o);HD.sel=[o];setTool('sel');changed();}
function libDrop(data,at){try{const d=JSON.parse(data);if(d.st)place(newStamp(d.st,{el:HD.libEl},at));else if(d.sp){const S=spellOf(d.el,d.sp);if(S)place(spellStamp(d.el,S,d.k,at));}}catch(e){}}
function thumb(k){const D=ST[k],c=document.createElement('canvas'),s=Math.min(64/D.w,52/D.h,1.4),d=2;c.width=Math.ceil(D.w*s*d);c.height=Math.ceil(D.h*s*d);c.style.width=D.w*s+'px';c.style.height=D.h*s+'px';
  const g=c.getContext('2d');g.scale(s*d,s*d);D.d(g,Object.assign({},D.p,{el:HD.libEl},D.p.sp!==undefined?sampleFor(k,HD.libEl):{}),pal(HD.libEl));return c;}

// ---------- panels ----------
function saveSt(){lsSet('hd_st',HD.st);}
function setTool(t){if(HD.edit)finishText();if(HD.poly&&t!=='poly')finishPoly(false);HD.tool=t;document.querySelectorAll('#hdTools button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
  if(dui)dui.style.cursor=t==='sel'?'default':t==='text'?'text':t==='pick'?'copy':'crosshair';drawUI();}
function renderLeft(){const s=HD.st,el=$('#sideDraw');
  el.innerHTML=`<h3>เครื่องมือ</h3><div id="hdTools">${TOOLS.map(t=>`<button class="tl-btn${HD.tool===t[0]?' on':''}" data-t="${t[0]}" title="${t[2]} (${t[3]})"><span>${t[1]}</span><small>${t[2]}</small></button>`).join('')}</div>
  <h3>สีและเส้น</h3><div class="hdp">
   <div class="pr"><label>สีเส้น</label><input type="color" data-s="c" value="${s.c}"><span class="sw">${SW8.map(c=>`<i data-c="${c}" style="background:${c}"></i>`).join('')}</span></div>
   <div class="pr"><label>สีพื้น</label><input type="color" data-s="f" value="${s.f}"><label class="ck"><input type="checkbox" data-s="fill" ${s.fill?'checked':''}> เติมสี</label></div>
   <div class="pr"><label>ความหนา</label><input type="range" min="1" max="40" step="1" data-s="w" value="${s.w}"><input type="number" min="1" max="200" data-s="w" value="${s.w}"></div>
   <div class="pr"><label>ความทึบ</label><input type="range" min="0.05" max="1" step="0.05" data-s="o" value="${s.o}"><input type="number" min="0" max="1" step="0.05" data-s="o" value="${s.o}"></div>
   <div class="pr"><label>ตัวอักษร</label><input type="range" min="8" max="120" step="1" data-s="fs" value="${s.fs}"><input type="number" min="6" max="300" data-s="fs" value="${s.fs}"></div>
   <div class="pr"><label>มุมโค้ง</label><input type="range" min="0" max="60" step="1" data-s="r" value="${s.r}"><input type="number" min="0" max="300" data-s="r" value="${s.r}"></div>
   <div class="pr"><label></label><label class="ck"><input type="checkbox" data-s="dash" ${s.dash?'checked':''}> เส้นประ</label><label class="ck"><input type="checkbox" data-s="bold" ${s.bold?'checked':''}> ตัวหนา</label></div>
  </div><h3 id="hdSelT">ชิ้นที่เลือก</h3><div id="hdSel" class="hdp"></div>
  <div id="help">V เลือก • P ปากกา • M เน้น • E ยางลบ • L เส้น • A ลูกศร • R สี่เหลี่ยม • O วงรี • G หลายเหลี่ยม (คลิกทีละจุด, Enter/ดับเบิลคลิก = จบ) • T ข้อความ • I รูป • K ดูดสี (Shift = สีพื้น)<br>Shift = ล็อกมุม/สัดส่วน • Alt+ลาก = ก๊อปปี้ • Ctrl+Z/Y ย้อน/ทำซ้ำ • Ctrl+D ทำซ้ำชิ้น • Ctrl+C/V • Del ลบ • ลูกศร = ขยับ • [ ] = ความหนา • Ctrl+ล้อเมาส์ = ซูม</div>`;
  renderSel();}
const STYLE_KEYS={c:o=>o.t!=='img'&&o.t!=='stamp'&&!o.er,f:o=>o.t==='rect'||o.t==='ell'||(o.t==='poly'&&o.cl)||o.t==='text',w:o=>['pen','line','arrow','poly','rect','ell'].includes(o.t)&&!o.er,o:o=>!o.er,fs:o=>o.t==='text',r:o=>o.t==='rect',dash:o=>['line','arrow','rect','ell','poly'].includes(o.t),bold:o=>o.t==='text'};
function applyStyle(k){if(!HD.sel.length)return;const s=HD.st;let any=false;for(const o of HD.sel){if(!STYLE_KEYS[k]||!STYLE_KEYS[k](o))continue;if(!any){mark();any=true;}
  if(k==='w'){if(o.t==='rect'||o.t==='ell')o.sw=s.w;else o.w=o.mk?Math.max(10,s.w*3):s.w;}else if(k==='f')o.f=s.fill?s.f:'';else o[k]=s[k];}
  if(any)changed();}
function paramRow(o,k,v){const id=`data-p="${k}"`;let inp;
  if(k==='el')inp=`<select class="tl-sel" ${id}>${els().map(e=>`<option value="${e}"${e===v?' selected':''}>${esc(elName(e))}</option>`).join('')}</select>`;
  else if(k==='sp')inp=`<select class="tl-sel" ${id}><option value="">—</option>${((HD.lib&&HD.lib.spells[o.p.el])||[]).map(S=>`<option value="${S.id}"${S.id===v?' selected':''}>${esc(S.kind+': '+S.n)}</option>`).join('')}</select>`;
  else if(PSEL[k])inp=`<select class="tl-sel" ${id}>${PSEL[k].map(([a,b])=>`<option value="${a}"${String(v)===a?' selected':''}>${b}</option>`).join('')}</select>`;
  else if(k==='c')inp=`<input type="color" ${id} value="${v}">`;
  else if(k==='hp'||k==='sh'||k==='v')inp=`<input type="range" min="0" max="1" step="0.05" ${id} value="${v}">`;
  else if(k==='pct')inp=`<input type="range" min="0" max="100" step="1" ${id} value="${v}">`;
  else if(typeof v==='number')inp=`<input type="number" ${id} value="${v}">`;
  else inp=`<input type="text" class="tl-in" ${id} value="${esc(v)}">`;
  return `<div class="pr"><label>${PLBL[k]||k}</label>${inp}</div>`;}
function renderSel(){const el=$('#hdSel');if(!el)return;const L=HD.sel;$('#hdSelT').textContent=L.length?`ชิ้นที่เลือก (${L.length})`:'ชิ้นที่เลือก';
  if(!L.length){el.innerHTML='<div class="mu">คลิกชิ้นด้วยเครื่องมือเลือก (V) หรือลากคลุมหลายชิ้น</div>';return;}
  const o=L[0],b=selBox(L);let h=`<div class="mu">${L.length===1?esc(o.t==='stamp'?ST[o.k].n:TN[o.t]):L.length+' ชิ้น'} • ${Math.round(b.x)}, ${Math.round(b.y)} • ${Math.round(b.w)}×${Math.round(b.h)} px</div>`;
  if(L.length===1&&o.t==='stamp')h+=Object.keys(o.p).filter(k=>k!=='ic').map(k=>paramRow(o,k,o.p[k])).join('')+`<div class="pr"><label>ความทึบ</label><input type="range" min="0.05" max="1" step="0.05" data-ob="o" value="${o.o==null?1:o.o}"></div>`;
  if(L.length===1&&o.t==='text')h+=`<div class="pr"><label>ข้อความ</label><button class="tl-btn" data-a="edit">แก้ข้อความ</button></div><div class="pr"><label></label><label class="ck"><input type="checkbox" data-ob="sh" ${o.sh!==0?'checked':''}> เงาตัวอักษร</label></div>`;
  h+=`<div class="row2 wrap"><button class="tl-btn" data-a="front" title="ไว้หน้าสุด">⤒ หน้าสุด</button><button class="tl-btn" data-a="up" title="ขึ้น 1 ชั้น">↑</button><button class="tl-btn" data-a="down" title="ลง 1 ชั้น">↓</button><button class="tl-btn" data-a="back" title="ไว้หลังสุด">⤓ หลังสุด</button></div>
   <div class="row2 wrap"><button class="tl-btn" data-a="dup">⧉ ทำซ้ำ</button><button class="tl-btn" data-a="lock">🔒 ล็อก</button><button class="tl-btn" data-a="del">🗑 ลบ</button></div>`;
  el.innerHTML=h;}
function act(a){const L=HD.doc.objs,S=HD.sel;if(!S.length&&a!=='paste')return;
  if(a==='del'){mark();HD.doc.objs=L.filter(o=>!S.includes(o));HD.sel=[];}
  else if(a==='dup'){mark();const cp=S.map(o=>{const c=JSON.parse(JSON.stringify(o));xform(c,q=>[q[0]+16,q[1]+16],1);return c;});L.push(...cp);HD.sel=cp;}
  else if(a==='front'||a==='back'){mark();const rest=L.filter(o=>!S.includes(o)),mine=L.filter(o=>S.includes(o));HD.doc.objs=a==='front'?[...rest,...mine]:[...mine,...rest];}
  else if(a==='up'||a==='down'){mark();const d=a==='up'?1:-1,idx=S.map(o=>L.indexOf(o)).sort((x,y)=>d>0?y-x:x-y);for(const i of idx){const j=i+d;if(j<0||j>=L.length||S.includes(L[j]))continue;[L[i],L[j]]=[L[j],L[i]];}}
  else if(a==='lock'){mark();for(const o of S)o.lk=1;HD.sel=[];msg('ล็อกแล้ว — ปลดล็อกได้ที่แท็บ "ชั้น"');}
  else if(a==='edit'){startText(S[0]);return;}
  changed();}
function renderRight(){const el=$('#right');if(!el)return;const T=HD.tab;
  let h=`<div class="tabs">${[['lib','คลัง'],['layers','ชั้น'],['file','ไฟล์/พื้นหลัง']].map(([k,n])=>`<button class="tl-btn${T===k?' on':''}" data-tab="${k}">${n}</button>`).join('')}</div><div class="tbody">`;
  if(T==='lib'){h+=`<div class="pr"><label>ธาตุ</label><select class="tl-sel" id="hdEl">${els().map(e=>`<option value="${e}"${e===HD.libEl?' selected':''}>${esc(elName(e))}</option>`).join('')}</select></div>`;
    if(!HD.lib)h+='<div class="mu">รอเกมโหลดเพื่ออ่านรายการสกิล…</div>';
    h+=`<h4>สีธาตุ <small>คลิก = สีเส้น • Shift+คลิก = สีพื้น</small></h4><div class="swr">${['c0','c1','c2','cb'].map(k=>{const c=pal(HD.libEl)[k];return c?`<i data-c="${c}" title="${k} ${c}" style="background:${c}"></i>`:'';}).join('')}</div>`;
    h+=`<h4>สกิลของธาตุนี้ <small>คลิก/ลากไปวาง</small></h4><div class="spl">`;
    for(const S of ((HD.lib&&HD.lib.spells[HD.libEl])||[])){const k=stampKindFor(S);h+=`<div class="sp"><span class="ic" style="--u:url('${S.ic}');--c:${pal(HD.libEl).c1}"></span><span class="nm"><b>${esc(S.n)}</b><small>${esc(S.kind)}</small></span>
      <button class="tl-btn" draggable="true" data-sp="${S.id}" data-k="${k}" title="วางเป็น${ST[k].n}">${k==='ult'?'ไพ่':k==='card'?'การ์ด':'ปุ่ม'}</button><button class="tl-btn" draggable="true" data-sp="${S.id}" data-k="icon" title="วางเป็นไอคอนเปล่า">ไอคอน</button></div>`;}
    h+=`</div><h4>ชิ้น HUD <small>หน้าตาแบบ HUD ปัจจุบัน • คลิก/ลากไปวาง</small></h4><div class="stg">${Object.keys(ST).map(k=>`<div class="st" draggable="true" data-st="${k}" title="${ST[k].n}"><span class="th" data-th="${k}"></span><small>${ST[k].n}</small></div>`).join('')}</div>`;}
  else if(T==='layers'){const L=HD.doc.objs;h+=L.length?'':'<div class="mu">ยังไม่มีชิ้น</div>';h+='<div class="lys">';
    for(let i=L.length-1;i>=0;i--){const o=L[i],nm=o.t==='stamp'?ST[o.k].n+(o.p.name?': '+o.p.name:''):o.t==='text'?'“'+String(o.s).slice(0,18)+'”':o.er?'ยางลบ':TN[o.t];
      h+=`<div class="ly${HD.sel.includes(o)?' on':''}${o.hid?' hid':''}" data-i="${i}"><button data-ly="hid" title="ซ่อน/แสดง">${o.hid?'🚫':'👁'}</button><button data-ly="lk" title="ล็อก">${o.lk?'🔒':'🔓'}</button><span>${esc(nm)}</span></div>`;}
    h+='</div>';}
  else{const B=HD.doc.bg;h+=`<div class="pr"><label>ชื่อแบบ</label><input type="text" class="tl-in" id="hdName" value="${esc(HD.doc.name)}"></div>
    <div class="col"><label>โน้ตถึง Claude</label><textarea id="hdNote" class="tl-in" rows="4" placeholder="อยากได้อะไร / ตรงไหนสำคัญ">${esc(HD.doc.note)}</textarea></div>
    <div class="row2 wrap"><button class="tl-btn pri" data-f="save">💾 เซฟแบบ</button><button class="tl-btn" data-f="new">＋ แบบใหม่</button><button class="tl-btn" data-f="png">⬇ PNG</button><button class="tl-btn" data-f="del">🗑 ลบแบบนี้</button></div>
    <div class="mu">${HD.doc.id?'ไฟล์: '+imgOf(HD.doc):'ยังไม่เคยเซฟ'}${HD.dirty?' • มีการแก้ที่ยังไม่เซฟ':''}</div>
    <h4>พื้นหลัง</h4><div class="col">
     <label class="ck"><input type="radio" name="hdbg" value="live" ${B.mode==='live'?'checked':''}> เกมสด (ขยับอยู่)</label>
     <label class="ck"><input type="radio" name="hdbg" value="snap" ${B.mode==='snap'?'checked':''} ${HD.bgC?'':'disabled'}> ภาพนิ่งจากเกม</label>
     <label class="ck"><input type="radio" name="hdbg" value="none" ${B.mode==='none'?'checked':''}> สีพื้น <input type="color" id="hdBgCol" value="${B.col||'#1d2230'}"></label>
     <button class="tl-btn" data-f="snap">📷 ถ่ายภาพเกมตอนนี้เป็นพื้นหลัง</button>
     <label class="ck"><input type="checkbox" id="hdHideHud" ${HD.hideHud?'checked':''}> ซ่อน HUD ของเกม (ออกแบบใหม่บนฉากเปล่า)</label>
     <label class="ck"><input type="checkbox" id="hdShowLay" ${HD.showLay?'checked':''}> แสดงแบบนี้จาง ๆ ในโหมดจัดตำแหน่ง</label>
     <label class="ck"><input type="checkbox" id="hdGrid" ${HD.grid?'checked':''}> เส้นกริด + จับกริด 10 px</label>
     <div class="pr"><label>ความทึบแบบ</label><input type="range" min="0.1" max="1" step="0.05" id="hdOp" value="${HD.op||1}"></div></div>
    <h4>แบบที่เซฟไว้</h4><div class="lys">${HD.list.length?HD.list.map(m=>`<div class="ly${m.id===HD.doc.id?' on':''}" data-open="${m.id}"><span>${esc(m.name)}</span><small>${m.w}×${m.h} • ${m.n} ชิ้น</small></div>`).join(''):'<div class="mu">ยังไม่มี</div>'}</div>`;}
  el.innerHTML=h+'</div>';
  el.querySelectorAll('[data-th]').forEach(s=>s.appendChild(thumb(s.dataset.th)));}

// ---------- files ----------
async function refreshList(){try{HD.list=await fetch('/api/hud-designs').then(r=>r.json());}catch(e){HD.list=[];}if(HD.tab==='file')renderRight();}
function mdOf(d){const pc=(x,y)=>`x=${Math.round(100*x/d.w)}% y=${Math.round(100*y/d.h)}%`,sz=b=>`${Math.round(b.w)}×${Math.round(b.h)} px`;
  const L=[`# HUD design: ${d.name} (\`${d.id}\`)`,'',`> เขียนอัตโนมัติจาก HUD Editor (โหมดออกแบบ) — อย่าแก้ตรง ๆ. **Claude: เปิดภาพ \`${imgOf(d)}\` ด้วย Read ก่อน** แล้วอ่านรายการด้านล่างประกอบ. นี่คือภาพอ้างอิงที่ผู้ใช้วาด ยังไม่ใช่ HUD จริงในเกม. ตำแหน่ง = มุมซ้ายบนของชิ้น เป็น % ของจอ (0,0 = ซ้ายบน).`,'',
    `- ขนาดจอที่ออกแบบ: ${d.w}×${d.h} (ชิ้น HUD วางที่ขนาดจริงในเกมของจอนี้)`,`- พื้นหลัง: ${d.bg.mode==='none'?'สีพื้น '+d.bg.col:'ภาพเกม'+(d.bg.src?' (`'+d.bg.src+'`)':'')}${HD.hideHud?' • ซ่อน HUD เดิมของเกม':' • มี HUD เดิมของเกมอยู่ในภาพ (ส่วนที่เป็น canvas)'}`,'','## โน้ตจากผู้ใช้','',(d.note||'(ไม่มี)').trim(),''];
  const vis=d.objs.filter(o=>!o.hid&&!o.er);const stp=vis.filter(o=>o.t==='stamp');
  if(stp.length){L.push('## ชิ้น HUD / สกิล ที่วาง','','| ชิ้น | ตำแหน่ง | ขนาด | รายละเอียด |','|---|---|---|---|');
    for(const o of stp){const b=bbox(o),p=o.p,det=[p.el?'ธาตุ '+p.el:'',p.sp?'สกิล `'+p.sp+'` '+(p.name||''):p.name?'ชื่อ '+p.name:'',p.key?'ปุ่ม '+p.key:'',p.text?'“'+p.text+'”':'',p.cd?'คูล '+p.cd:'',p.pct!=null?'เกจ '+p.pct+'%':'',p.hp!=null?'เลือด '+p.hp:'',p.label?'ป้าย '+p.label:''].filter(Boolean).join(', ');
      L.push(`| ${ST[o.k].n} | ${pc(b.x,b.y)} | ${sz(b)} | ${det.replace(/\|/g,'\\|')} |`);}L.push('');}
  const tx=vis.filter(o=>o.t==='text');if(tx.length){L.push('## ข้อความที่เขียน','','| ข้อความ | ตำแหน่ง | ขนาดตัวอักษร | สี |','|---|---|---|---|');for(const o of tx)L.push(`| ${String(o.s).replace(/\n/g,' / ').replace(/\|/g,'\\|')} | ${pc(o.x,o.y)} | ${Math.round(o.fs)} | ${o.c} |`);L.push('');}
  const geo=vis.filter(o=>['rect','ell','line','arrow','poly','img'].includes(o.t));if(geo.length){L.push('## รูปร่าง / เส้น / รูป','','| ชนิด | ตำแหน่ง | ขนาด | สี |','|---|---|---|---|');
    for(const o of geo){const b=bbox(o);L.push(`| ${TN[o.t]}${o.t==='arrow'?' (ชี้ไป '+pc(o.b[0],o.b[1])+')':''} | ${pc(b.x,b.y)} | ${sz(b)} | ${o.f?'พื้น '+o.f+' ':''}${o.t!=='img'?'เส้น '+o.c:''} |`);}L.push('');}
  const pens=vis.filter(o=>o.t==='pen');if(pens.length)L.push(`ลายมือ/ปากกา ${pens.length} เส้น (ดูในภาพ)`);return L.join('\n')+'\n';}
async function up(name,dataURL){const r=await fetch('/api/hud-design-img?name='+encodeURIComponent(name),{method:'POST',body:dataURL}).then(r=>r.json());if(!r.ok)throw new Error(r.err||'upload');return r.path;}
const imgOf=d=>d.img||('huddesign/'+d.id+'.png');
async function saveDoc(){if(HD.edit)finishText();const d=HD.doc;d.name=d.name||'แบบ HUD';d.w=RW;d.h=RH;if(!d.id)d.id='hd-'+Date.now().toString(36);msg('กำลังเซฟแบบ…');
  try{if(d.bg.mode==='live'){HD.bgC=grabGame(!HD.hideHud);HD.bgDirty=true;}
    if(HD.bgC&&HD.bgDirty&&d.bg.mode!=='none'){d.bg.src=await up(d.id+'-bg',HD.bgC.toDataURL('image/jpeg',.88));HD.bgDirty=false;}
    let n=0;for(const o of d.objs)if(o.t==='img'&&String(o.src).startsWith('data:')){const im=IMG.get(o.src),p=await up(d.id+'-i'+(n++)+'-'+Date.now().toString(36),o.src);if(im)IMG.set(p,im);o.src=p;}
    const c=composite(true),jpg=d.bg.mode!=='none';d.img='huddesign/'+d.id+(jpg?'.jpg':'.png');   // photo backgrounds → jpg (smaller in git)
    const png=jpg?c.toDataURL('image/jpeg',.9):c.toDataURL('image/png');
    const r=await fetch('/api/hud-design?id='+d.id,{method:'POST',body:JSON.stringify({doc:d,png,md:mdOf(d)})}).then(r=>r.json());
    if(!r.ok)throw new Error(r.err);HD.dirty=false;lsSet('hd_draft',d);msg('✅ เซฟแล้ว: '+d.img+' — บอก Claude ให้ดูได้เลย','--sok');refreshList();}
  catch(e){msg('❌ เซฟไม่ได้: '+e.message+' — ต้องเปิดผ่าน Tools.bat (serve.py)','--serr');}}
function loadDoc(d){HD.doc=Object.assign(newDoc(),d);HD.doc.bg=Object.assign({mode:'live',src:'',col:'#1d2230'},d.bg||{});HD.sel=[];HD.hist=[];HD.redo=[];HD.dirty=false;HD.bgC=null;HD.bgDirty=false;
  if(HD.doc.w&&(HD.doc.w!==RW||HD.doc.h!==RH)){const v=HD.doc.w+'x'+HD.doc.h,o=[...$('#res').options].find(x=>x.value===v);if(o){$('#res').value=v;$('#res').onchange();}}
  if(HD.doc.bg.src){const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=RW;c.height=RH;c.getContext('2d').drawImage(im,0,0,RW,RH);HD.bgC=c;setBg();renderRight();};im.src=HD.doc.bg.src+'?t='+Date.now();}
  if(HD.doc.bg.mode==='snap'&&!HD.doc.bg.src)HD.doc.bg.mode='live';
  else if(HD.doc.bg.mode==='live'&&HD.doc.bg.src)HD.doc.bg.mode='snap';   // reopened design: show the picture it was drawn on
  setBg();redraw();renderSel();renderRight();}
async function openDoc(id){if(HD.dirty&&!confirm('ทิ้งการแก้ที่ยังไม่เซฟ?'))return;try{const d=await fetch('/api/hud-design?id='+id).then(r=>r.json());if(d.objs)loadDoc(d);msg('เปิดแบบ “'+d.name+'” แล้ว');}catch(e){msg('เปิดไม่ได้','--serr');}}
async function delDoc(){const d=HD.doc;if(!d.id){loadDoc(newDoc());return;}if(!confirm('ลบแบบ “'+d.name+'”? (ย้ายไป huddesign/_deleted/ กู้คืนได้)'))return;
  await fetch('/api/hud-design-del?id='+d.id,{method:'POST'});loadDoc(newDoc());refreshList();msg('ลบแล้ว (ย้ายไป huddesign/_deleted/)');}
function exportPng(){const a=document.createElement('a');a.href=composite(true).toDataURL('image/png');a.download=(HD.doc.name||'hud')+'.png';a.click();}

// ---------- mode / size ----------
function resize(){if(!dcv)return;if(dcv.width!==RW||dcv.height!==RH){dcv.width=RW;dcv.height=RH;}for(const c of [dcv,dbgc]){c.style.width=RW+'px';c.style.height=RH+'px';c.style.transform=`scale(${sc})`;}
  const d=devicePixelRatio||1;dui.width=Math.round(RW*sc*d);dui.height=Math.round(RH*sc*d);dui.style.width=RW*sc+'px';dui.style.height=RH*sc+'px';setBg();redraw();
  if(HD.edit){ta.style.left=HD.edit.x*sc+'px';ta.style.top=HD.edit.y*sc+'px';}$('#hdZ')&&($('#hdZ').textContent=Math.round(HD.zoom*100)+'%');}
// resolution changed with a non-empty design: scale the drawing to the new screen
HD.rescale=()=>{const d=HD.doc;if(!d||(d.w===RW&&d.h===RH))return;const sx=RW/(d.w||RW),sy=RH/(d.h||RH),k=Math.sqrt(sx*sy);d.w=RW;d.h=RH;if(!d.objs.length)return;
  mark();for(const o of d.objs)xform(o,q=>[q[0]*sx,q[1]*sy],k);HD.bgC=null;if(d.bg.mode==='snap')d.bg.mode='live';changed();msg('ปรับขนาดแบบตามจอใหม่แล้ว');};
function setLayVis(){dcv.style.display=HD.on||(HD.showLay&&HD.doc.objs.length)?'block':'none';dcv.style.opacity=HD.on?(HD.op||1):Math.min(.6,HD.op||1);}
function enter(){HD.on=true;document.body.classList.add('draw');if(!HD.lib)loadLib();renderLeft();renderRight();refreshList();setLayVis();setBg();setTool(HD.tool);fit();}
function exit(){if(HD.edit)finishText();if(HD.poly)finishPoly(false);HD.on=false;document.body.classList.remove('draw');HD.zoom=1;ZOOM=1;setLayVis();setBg();fit();drawUI();}
HD.enter=enter;HD.exit=exit;HD.resize=resize;HD.redraw=redraw;HD.save=saveDoc;
function setZoom(z,cx,cy){const wrap=$('#stageWrap'),old=HD.zoom;HD.zoom=clampN(z,0.25,6);ZOOM=HD.zoom;const r=wrap.getBoundingClientRect(),fx=cx==null?.5:(cx-r.left)/r.width,fy=cy==null?.5:(cy-r.top)/r.height,
  ax=(wrap.scrollLeft+r.width*fx)/(old||1),ay=(wrap.scrollTop+r.height*fy)/(old||1);fit();wrap.scrollLeft=ax*HD.zoom-r.width*fx;wrap.scrollTop=ay*HD.zoom-r.height*fy;}

// ---------- wiring ----------
function init(){const stage=$('#stage');
  dbgc=document.createElement('canvas');dbgc.id='dbgc';dcv=document.createElement('canvas');dcv.id='dcv';dui=document.createElement('canvas');dui.id='dui';ta=document.createElement('textarea');ta.id='dta';ta.spellcheck=false;
  stage.insertBefore(dbgc,$('#refImg'));stage.insertBefore(dcv,$('#ov'));stage.appendChild(dui);stage.appendChild(ta);
  const f=document.createElement('input');f.type='file';f.id='hdFile';f.accept='image/*';f.hidden=true;document.body.appendChild(f);
  f.onchange=()=>{if(f.files[0])addImageFile(f.files[0],HD.imgAt);f.value='';};
  const dr=lsGet('hd_draft',null);HD.doc=dr&&dr.objs?Object.assign(newDoc(),dr):newDoc();if(HD.doc.bg.mode==='snap')HD.doc.bg.mode=HD.doc.bg.src?'snap':'live';if(HD.doc.bg.src||HD.doc.w!==RW||HD.doc.h!==RH)loadDoc(HD.doc);
  dui.addEventListener('pointerdown',onDown);dui.addEventListener('pointermove',onMove);dui.addEventListener('pointerup',onUp);dui.addEventListener('pointercancel',onUp);
  dui.addEventListener('dblclick',e=>{if(HD.poly){HD.poly.pts.pop();finishPoly(true);return;}if(HD.tool==='sel'){const o=topHit(pt(e));if(o&&o.t==='text')startText(o);}});
  dui.addEventListener('contextmenu',e=>{e.preventDefault();if(HD.poly)finishPoly(false);});
  dui.addEventListener('pointerleave',()=>{HD.mp=null;drawUI();});
  $('#stageWrap').addEventListener('wheel',e=>{if(!HD.on||!(e.ctrlKey||e.metaKey))return;e.preventDefault();setZoom(HD.zoom*(e.deltaY<0?1.15:1/1.15),e.clientX,e.clientY);},{passive:false});
  ta.addEventListener('input',autoTa);ta.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')finishText();   // Esc keeps the text (like Figma)
  if(e.key==='Enter'&&(e.ctrlKey||e.metaKey))finishText();});ta.addEventListener('blur',()=>finishText());
  stage.addEventListener('dragover',e=>{if(HD.on)e.preventDefault();});
  stage.addEventListener('drop',e=>{if(!HD.on)return;e.preventDefault();const p=pt(e);if(e.dataTransfer.files&&e.dataTransfer.files[0]){addImageFile(e.dataTransfer.files[0],p);return;}libDrop(e.dataTransfer.getData('text/plain'),p);});
  // left panel
  const L=$('#sideDraw');
  L.addEventListener('click',e=>{const b=e.target.closest('#hdTools button');if(b){setTool(b.dataset.t);return;}const sw=e.target.closest('.sw i');if(sw){HD.st.c=sw.dataset.c;saveSt();applyStyle('c');renderLeft();return;}
    const a=e.target.closest('[data-a]');if(a)act(a.dataset.a);});
  L.addEventListener('input',e=>{const k=e.target.dataset.s;if(k){const v=e.target.type==='checkbox'?(e.target.checked?1:0):e.target.type==='color'?e.target.value:+e.target.value;if(e.target.type==='number'&&!isFinite(v))return;
      HD.st[k]=v;saveSt();L.querySelectorAll(`[data-s="${k}"]`).forEach(i=>{if(i!==e.target&&i.type!=='checkbox')i.value=v;});applyStyle(k==='fill'?'f':k);return;}
    const pk=e.target.dataset.p,o=HD.sel[0];if(pk&&o&&o.t==='stamp'){if(!HD.pm){mark();HD.pm=1;}let v=e.target.value;if(e.target.type==='range'||typeof o.p[pk]==='number')v=+v;
      if(pk==='kind')v=+v;o.p[pk]=v;if(pk==='sp'){const S=spellOf(o.p.el,v);if(S){o.p.ic=S.ic;o.p.name=S.n;}}if(pk==='el'&&o.p.sp&&!spellOf(v,o.p.sp)){o.p.sp='';o.p.ic='';}
      redraw();if(pk==='el'||pk==='sp')renderSel();lsSet('hd_draft',HD.doc);HD.dirty=true;return;}
    const ob=e.target.dataset.ob;if(ob&&o){mark();o[ob]=e.target.type==='checkbox'?(e.target.checked?1:0):+e.target.value;redraw();HD.dirty=true;}});
  L.addEventListener('change',()=>{HD.pm=0;});
  // right panel
  const R=$('#right');
  R.addEventListener('click',e=>{const t=e.target.closest('[data-tab]');if(t){HD.tab=t.dataset.tab;renderRight();if(HD.tab==='file')refreshList();return;}
    const sw=e.target.closest('.swr i');if(sw){if(e.shiftKey){HD.st.f=sw.dataset.c;HD.st.fill=1;applyStyle('f');}else{HD.st.c=sw.dataset.c;applyStyle('c');}saveSt();renderLeft();return;}
    const sp=e.target.closest('[data-sp]');if(sp){const S=spellOf(HD.libEl,sp.dataset.sp);if(S)place(spellStamp(HD.libEl,S,sp.dataset.k));return;}
    const st=e.target.closest('[data-st]');if(st){place(newStamp(st.dataset.st,{el:HD.libEl}));return;}
    const ly=e.target.closest('.ly[data-i]');if(ly){const o=HD.doc.objs[+ly.dataset.i],b=e.target.closest('[data-ly]');if(b){mark();o[b.dataset.ly]=o[b.dataset.ly]?0:1;if(o.hid||o.lk)HD.sel=HD.sel.filter(x=>x!==o);changed();}else if(!o.lk){HD.sel=e.shiftKey?[...HD.sel,o]:[o];setTool('sel');renderSel();drawUI();renderRight();}return;}
    const op=e.target.closest('[data-open]');if(op){openDoc(op.dataset.open);return;}
    const fb=e.target.closest('[data-f]');if(fb){const f=fb.dataset.f;if(f==='save')saveDoc();else if(f==='new'){if(!HD.dirty||confirm('เริ่มแบบใหม่? (การแก้ที่ยังไม่เซฟจะหาย)')){loadDoc(newDoc());lsSet('hd_draft',HD.doc);}}else if(f==='png')exportPng();else if(f==='del')delDoc();else if(f==='snap')snapGame();}});
  R.addEventListener('dragstart',e=>{const sp=e.target.closest('[data-sp]'),st=e.target.closest('[data-st]');if(sp)e.dataTransfer.setData('text/plain',JSON.stringify({sp:sp.dataset.sp,k:sp.dataset.k,el:HD.libEl}));else if(st)e.dataTransfer.setData('text/plain',JSON.stringify({st:st.dataset.st}));});
  R.addEventListener('input',e=>{const id=e.target.id;
    if(id==='hdEl'){HD.libEl=e.target.value;renderRight();}else if(id==='hdName'){HD.doc.name=e.target.value;HD.dirty=true;lsSet('hd_draft',HD.doc);}else if(id==='hdNote'){HD.doc.note=e.target.value;HD.dirty=true;lsSet('hd_draft',HD.doc);}
    else if(e.target.name==='hdbg'){HD.doc.bg.mode=e.target.value;HD.dirty=true;setBg();}else if(id==='hdBgCol'){HD.doc.bg.col=e.target.value;if(HD.doc.bg.mode==='none')setBg();}
    else if(id==='hdHideHud')hideGameHud(e.target.checked);else if(id==='hdShowLay')HD.showLay=e.target.checked;else if(id==='hdGrid'){HD.grid=e.target.checked;drawUI();}else if(id==='hdOp'){HD.op=+e.target.value;setLayVis();}});
  // keys (design mode only)
  addEventListener('keydown',e=>{if(!HD.on||HD.edit)return;const tg=e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT')return;const k=e.key.toLowerCase(),c=e.ctrlKey||e.metaKey;
    if(c&&k==='s'){e.preventDefault();saveDoc();return;}if(c&&k==='z'){e.preventDefault();e.shiftKey?redoF():undo();return;}if(c&&k==='y'){e.preventDefault();redoF();return;}
    if(c&&k==='d'){e.preventDefault();act('dup');return;}if(c&&k==='c'){HD.clip=JSON.stringify(HD.sel);return;}if(c&&k==='a'){e.preventDefault();HD.sel=HD.doc.objs.filter(o=>!o.hid&&!o.lk&&!o.er);renderSel();drawUI();return;}
    if(c&&k==='v'){if(!HD.clip)return;e.preventDefault();mark();const cp=JSON.parse(HD.clip);cp.forEach(o=>xform(o,q=>[q[0]+20,q[1]+20],1));HD.doc.objs.push(...cp);HD.sel=cp;HD.clip=JSON.stringify(cp);changed();return;}
    if(c&&(k==='='||k==='+')){e.preventDefault();setZoom(HD.zoom*1.25);return;}if(c&&k==='-'){e.preventDefault();setZoom(HD.zoom/1.25);return;}if(c&&k==='0'){e.preventDefault();setZoom(1);return;}
    if(k==='delete'||k==='backspace'){e.preventDefault();act('del');return;}
    if(k==='escape'){if(HD.poly)finishPoly(false);else{HD.sel=[];renderSel();drawUI();}return;}if(k==='enter'&&HD.poly){finishPoly(true);return;}
    const ar={arrowleft:[-1,0],arrowright:[1,0],arrowup:[0,-1],arrowdown:[0,1]}[k];if(ar&&HD.sel.length){e.preventDefault();const s=e.shiftKey?10:1;mark();HD.sel.forEach(o=>xform(o,q=>[q[0]+ar[0]*s,q[1]+ar[1]*s],1));changed();return;}
    if(k==='['||k===']'){HD.st.w=clampN(HD.st.w+(k===']'?1:-1)*(HD.st.w>10?2:1),1,200);saveSt();renderLeft();applyStyle('w');return;}
    if(!c&&!e.altKey){const t=TOOLS.find(t=>t[3].toLowerCase()===k);if(t){if(t[0]==='img'){HD.imgAt=null;$('#hdFile').click();}else setTool(t[0]);}}});
  addEventListener('paste',e=>{if(!HD.on||HD.edit)return;const it=[...(e.clipboardData||{}).items||[]].find(i=>i.type.startsWith('image/'));if(it){e.preventDefault();addImageFile(it.getAsFile());}});
  setLayVis();}
init();
// game ready later (hudedit boot): build the library
const libT=setInterval(()=>{if(W&&W.hudLib&&loadLib()){clearInterval(libT);if(HD.on)renderRight();redraw();}},500);
