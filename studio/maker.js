// =====================================================================
//  VFX Studio — แท็บ 🧊 โมเดล + 🎞 ภาพ: สร้าง asset ของเอฟเฟกต์เองในแอปเดียว (แทน Blender สำหรับงาน VFX)
//  โมเดล = สูตรชิ้นส่วน assets/fx/mesh/*.mesh.json ปั้นด้วย js/46-fx-make.js (ตัวเดียวกับเกม) • ลูกศรจับบนจอ: G ย้าย / R หมุน / S ย่อขยาย • คลิกชิ้นบนจอ = เลือก
//  ภาพ  = ตัววาด GPU / จำลองของไหล (studio/texgen.js) → assets/fx/tex/*.png + .tex.json
//  URL: ?mesh=<ชื่อ> ?tex=<ชื่อ> (&bake=1 = วาดใหม่+บันทึก .png จาก .tex.json) ?bakeall=1 (วาดใหม่ทุกภาพ)
//  console: STUDIO.ws('fx'|'mesh'|'tex') • STUDIO.mesh.{open,data,set,add,select,save,shot} • STUDIO.tex.{open,data,set,gen,save,bake,sheet}
// =====================================================================
const MK={ws:'fx',list:{mesh:{},tex:{}},api:false,
  m:{name:'',d:null,saved:'',dirty:false,sel:null,undo:[],redo:[],root:null,obj:null,wire:null,hi:null,grid:null,tc:null,helper:null,mode:'translate',wireOn:true,view:'clay',ranges:[],tris:0,matK:'',down:null,rb:false,drag:false},
  t:{name:'',d:null,saved:'',dirty:false,undo:[],redo:[],cv:null,ms:0,bg:'dark',view:'2d',play:true,f:0,acc:0,timer:0,demo:null,demoT:0,demoK:'',ver:0,err:''}};
const MKN=/^[a-z0-9_\-]+$/;
const mkS=()=>FXR.schema.mk,txS=()=>FXR.schema.tx;
// ---------- เริ่ม ----------
async function mkInit(){
  const top=$st('stTop'),logo=top.querySelector('.logo');
  logo.after(h('span',{id:'mkTabs'},...[['fx','✨ เอฟเฟกต์','แก้/สร้างเอฟเฟกต์ (ไทม์ไลน์ของชั้น)'],['mesh','🧊 โมเดล','ปั้นโมเดล 3D ของเอฟเฟกต์ (แทน Blender)'],['tex','🎞 ภาพ','วาดภาพ / flipbook: ไฟ ควัน ระเบิด สายฟ้า วงเวท …'],['vol','🔥 ไฟ 3D','จำลองไฟเป็นก้อน 3 มิติจริง (แทน Blender Mantaflow)']].map(([k,t,ti])=>h('button',{'data-ws':k,title:ti,className:k==='fx'?'on':'',on:{click:()=>mkWs(k)}},t))));
  for(const id of ['stFile','stBNew','stBSave','stBSaveAs','stBUndo','stBRedo','stBSheet','stBShot','stBGame']){const e=$st(id);if(e)e.classList.add('fxOnly');}
  for(const id of ['stPal','stK']){const e=$st(id);if(e&&e.parentElement)e.parentElement.classList.add('fxOnly');}
  const st=$st('st');
  st.append(h('div',{id:'mkLib'},h('div',{className:'head'},h('div',{style:'display:flex;justify-content:space-between;align-items:center'},h('h3',{id:'mkLibT'},'โมเดล'),h('button',{id:'mkBNew',on:{click:()=>MK.ws==='mesh'?mkMeshNewAsk():MK.ws==='tex'?mkTexNewAsk():mkVolNewAsk()}},'＋ ใหม่')),
    h('input',{type:'text',id:'mkSearch',placeholder:'ค้นหา…',on:{input:mkLibRender}})),h('div',{id:'mkLibList'})));
  st.append(h('div',{id:'mkBot'}),h('div',{id:'mkInsp'}),h('div',{id:'mkTexView'},h('div',{className:'pv'},h('canvas',{id:'mkPv',width:512,height:512})),h('div',{className:'atlas',id:'mkAtlas'}),h('div',{className:'info',id:'mkTexInfo'})));
  document.body.classList.add('ws-fx');
  const tv=$st('mkTexView');tv.addEventListener('dragover',e=>{e.preventDefault();});tv.addEventListener('drop',e=>{e.preventDefault();if(MK.ws==='tex')mkTexImport(e.dataTransfer.files);});
  const cv=gl.domElement;
  cv.addEventListener('pointerdown',e=>{MK.m.down={x:e.clientX,y:e.clientY};});
  cv.addEventListener('pointerup',e=>{const D=MK.m.down;MK.m.down=null;if(MK.ws!=='mesh'||!D||MK.m.drag||Math.hypot(e.clientX-D.x,e.clientY-D.y)>5||mkGizmoHot())return;mkPick(e);});
  await mkRefresh();stLintRun();if(ST.fx)stInspRender();   // วาดช่องตรวจใหม่หลังรู้รายชื่อโมเดล/ภาพ (ไม่งั้นขึ้น ✗ ปลอม)
  if(SQ.has('mesh')){await mkWs('mesh');await mkMeshOpen(SQ.get('mesh'));}
  else if(SQ.has('vol')){await mkWs('vol');await mkVolOpen(SQ.get('vol'));}
  else if(SQ.has('tex')||SQ.has('bakeall')){await mkWs('tex');if(SQ.has('tex'))await mkTexOpen(SQ.get('tex'));
    if(SQ.has('bakeall')){for(const n of Object.keys(MK.list.tex)){await mkTexOpen(n);await mkTexSave(n);}stToast('วาดใหม่ + บันทึกครบ '+Object.keys(MK.list.tex).length+' ภาพ',5000);window.__bakeDone=true;}
    else if(SQ.has('bake')&&MK.t.name){await mkTexSave(MK.t.name);window.__bakeDone=true;}}
}
async function mkRefresh(){try{const r=await fetch('/api/fx-list',{cache:'no-cache'});if(r.ok){const j=await r.json();MK.list.mesh=j.mesh||{};MK.list.tex=j.tex||{};MK.list.vol=j.vol||{};MK.api=true;mkLibRender();return;}}catch(e){}
  try{const j=await (await fetch('assets/fx/index.json',{cache:'no-cache'})).json();MK.list.mesh=j.mesh||{};MK.list.tex=j.tex||{};MK.list.vol=j.vol||{};}catch(e){}MK.api=false;mkLibRender();}
// ยังไม่โหลด maker.js (ไฟล์อื่นเรียกได้ปลอดภัย)
function mkGizmoHot(){const tc=MK.m.tc;return MK.ws==='mesh'&&!!tc&&tc.visible&&!!tc.object&&tc.axis!==null;}
async function mkWs(w){if(MK.ws===w)return;const prev=MK.ws;MK.ws=w;
  document.body.classList.remove('ws-fx','ws-mesh','ws-tex','ws-vol');document.body.classList.add('ws-'+w);
  document.querySelectorAll('#mkTabs button').forEach(b=>b.classList.toggle('on',b.dataset.ws===w));stPopClose();stStatus();stHint('');
  if(prev==='fx'){if(ST.I){fxKill(ST.I);ST.I=null;}fxClearAll();}
  if(prev==='mesh')mkMeshHide();if(prev==='tex')mkTexDemoStop();if(prev==='vol')mkVolHide();
  $st('mkLibT').textContent=w==='mesh'?'โมเดล':w==='tex'?'ภาพ':'ไฟ 3D';$st('mkSearch').value='';
  if(w!=='fx'&&ST.cam==='game'){ST.cam='orbit';ST.orb.dist=w==='mesh'?4.5:8;ST.orb.pitch=0.35;stSync();}
  if(w==='fx'){stResize();stRestart();stLibRender();stTlRender();stInspRender();return;}
  mkLibRender();
  if(w==='mesh')await mkMeshShow();else if(w==='tex')await mkTexShow();else await mkVolShow();
  stResize();}
function mkFrame(rdt){
  if(MK.ws==='mesh'){const M=MK.m;if(M.root){if(!M.root.parent)scene.add(M.root);mkPlace(M.root);}if(M.tc&&!M.tc.parent)scene.add(M.tc);stRender(rdt,true);}
  else if(MK.ws==='tex'){const T=MK.t;if(T.view==='3d'){mkTexDemoTick(rdt);stRender(rdt,true);}else mkTexAnim(rdt);}
  else if(MK.ws==='vol'){mkVolTick(rdt);stRender(rdt,true);}}
function mkPlace(o){const A=stAnchor();if(!A)return;o.position.set(tx(A.x),GY(A.x,A.y),tz(A.y));o.rotation.set(0,Math.atan2(Math.cos(A.a),Math.sin(A.a)),0);}
// ---------- ไลบรารี ----------
function mkLibRender(){const box=$st('mkLibList');if(!box||MK.ws==='fx')return;const q=($st('mkSearch').value||'').toLowerCase(),L=MK.ws==='mesh'?MK.list.mesh:MK.ws==='tex'?MK.list.tex:(MK.list.vol||{}),cur=MK.ws==='mesh'?MK.m.name:MK.ws==='tex'?MK.t.name:MK.v.name;box.innerHTML='';
  const names=Object.keys(L).sort().filter(n=>!q||(n+' '+(L[n].desc||'')).toLowerCase().includes(q));
  if(MK.ws==='tex'){const g=h('div',{className:'mkThumbs'});for(const n of names){const e=L[n];g.append(h('button',{className:n===cur?'on':'',title:(e.desc||n)+(e.gen?' • '+e.gen:''),on:{click:()=>mkAskOpen(n)}},
      h('img',{src:'assets/fx/tex/'+n+'.png?t='+(e.png_t||e.t||0),alt:'',loading:'lazy'}),h('span',null,n)));}box.append(g);}
  else for(const n of names){const e=L[n];box.append(h('button',{className:n===cur?'on':'',title:e.desc||n,on:{click:()=>mkAskOpen(n)}},n,h('small',null,e.err?'⚠ '+e.err:(e.desc||'')+(e.mat?' • '+e.mat:''))));}
  if(!names.length)box.append(h('p',{className:'mute'},Object.keys(L).length?'ไม่พบ':'ยังไม่มี — กด ＋ ใหม่'));}
function mkAskOpen(n){const X=MK.ws==='mesh'?MK.m:MK.ws==='tex'?MK.t:MK.v,open=MK.ws==='mesh'?mkMeshOpen:MK.ws==='tex'?mkTexOpen:mkVolOpen,save=MK.ws==='mesh'?mkMeshSave:MK.ws==='tex'?mkTexSave:mkVolSave;if(n===X.name)return;
  if(X.dirty)stBanner('ยังไม่ได้บันทึก '+(X.name||'(ใหม่)'),[['ทิ้งแล้วเปิด '+n,()=>open(n)],['บันทึกก่อน',async()=>{if(await save())open(n);}]]);else open(n);}
// ---------- ช่องแก้ค่าตาม schema (ใช้ทั้งโมเดลและภาพ) ----------
// ctx: {push(), set(obj,k,v,rebuildUI), pal}
function mkField(sp,obj,k,ctx){if(!sp)return h('span');const cur=obj[k],v=cur!==undefined?cur:sp.def,lab=h('label',{title:sp.desc||''},sp.th||k,h('small',null,k+(cur===undefined?' · ค่าเริ่ม':'')));const box=h('div',{className:'stF'},lab);
  const set=(val,re)=>ctx.set(obj,k,val,re),push=ctx.push;
  const reset=cur!==undefined?h('button',{className:'tg',title:'กลับเป็นค่าเริ่ม',on:{click:()=>{push();set(undefined,true);}}},'↺'):null;
  const numIn=(val,fn,w)=>h('input',{type:'text',value:val,style:'width:'+(w||58)+'px',on:{focus:push,change:e=>{const n=+e.target.value;if(e.target.value.trim()!==''&&!isNaN(n))fn(n);}}});
  switch(sp.type){
    case 'num':case 'int':{const st=sp.step||(sp.type==='int'?1:0.01),mn=sp.min!==undefined?sp.min:0,mx=sp.max!==undefined?sp.max:10;
      if(Array.isArray(v)){box.append(h('div',{className:'row'},numIn(v[0],x=>set([x,v[1]],false)),h('span',{className:'mute'},'ถึง'),numIn(v[1],x=>set([v[0],x],false)),h('button',{className:'tg',title:'ค่าเดียว',on:{click:()=>{push();set(v[1],true);}}},'1'),reset));break;}
      const tb=numIn(v,x=>set(sp.type==='int'?Math.round(x):x,true));
      const rg=h('input',{type:'range',min:mn,max:mx,step:st,value:v,on:{pointerdown:push,input:e=>{const n=+e.target.value;tb.value=n;set(n,false);}}});
      box.append(h('div',{className:'row'},rg,tb,sp.range?h('button',{className:'tg',title:'สุ่มในช่วง [min,max]',on:{click:()=>{push();set([+(v*0.7).toFixed(3),v],true);}}},'↔'):null,reset));break;}
    case 'bool':box.append(h('div',{className:'row'},h('input',{type:'checkbox',checked:!!v,on:{change:e=>{push();set(e.target.checked,true);}}}),reset));break;
    case 'enum':{const list=Array.isArray(sp.of)?sp.of:FXR.schema[sp.of]||[];
      box.append(h('div',{className:'row'},h('select',{on:{change:e=>{push();const o=list.find(x=>String(x)===e.target.value);set(o!==undefined?o:e.target.value,true);}}},...list.map(o=>h('option',{value:o,selected:o===v},String(o)))),reset));break;}
    case 'vec3':{if(typeof v==='number'){box.append(h('div',{className:'row'},numIn(v,x=>set(x,true),70),h('button',{className:'tg',title:'แยก x y z',on:{click:()=>{push();set([v,v,v],true);}}},'xyz'),reset));break;}
      const a=Array.isArray(v)?v:[0,0,0],row=h('div',{className:'row'});['x','y','z'].forEach((ax,i)=>row.append(h('span',{className:'mute'},ax),h('input',{type:'number',step:k==='rot'?5:0.05,value:a[i],style:'width:58px',on:{focus:push,input:e=>{const nv=a.slice();nv[i]=+e.target.value;set(nv,false);}}})));
      if(k==='scale')row.append(h('button',{className:'tg',title:'ขนาดเท่ากันทุกด้าน',on:{click:()=>{push();set(a[1],true);}}},'1'));if(reset)row.append(reset);box.append(row);break;}
    case 'list':{if(k==='path'||k==='prof'){box.append(mkPtsEd(k,v,nv=>set(nv,false),push));}
      const ta=h('textarea',{value:JSON.stringify(v),spellcheck:false,on:{focus:push,change:e=>{try{set(JSON.parse(e.target.value),true);}catch(er){stToast('JSON ผิด: '+er.message);}}}});box.append(ta);if(reset)box.append(h('div',{className:'row'},reset));break;}
    case 'ramp':box.append(mkRampEd(v,nv=>set(nv,true),push));break;
    case 'str':{const opts=ctx.opts&&ctx.opts[k]||[],dl='mkDL_'+k;box.append(h('div',{className:'row'},h('input',{type:'text',value:v||'',list:dl,on:{focus:push,change:e=>set(e.target.value,true)}}),reset),h('datalist',{id:dl},...opts.map(o=>h('option',{value:o}))));break;}
    default:{const ta=h('textarea',{value:JSON.stringify(v,null,1),spellcheck:false,on:{focus:push,change:e=>{try{set(JSON.parse(e.target.value),true);}catch(er){stToast('JSON ผิด: '+er.message);}}}});box.append(ta);}}
  return box;}
// ตัวแก้จุด: prof = [รัศมี, สูง] • path = [x,y,z] ดูได้ 3 มุม • ลากจุด • ดับเบิลคลิกเพิ่ม • คลิกขวาลบ
function mkPtsEd(k,pts,onChange,push){const W=300,H=170,cvs=h('canvas',{width:W,height:H,className:'mkPts'});let view=k==='prof'?'prof':'side',B=null,drag=-1;pts=JSON.parse(JSON.stringify(pts||[]));
  const ax=()=>view==='prof'?[0,1]:view==='side'?[2,1]:view==='top'?[0,2]:[0,1];
  const bounds=()=>{const [a,b]=ax();let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;for(const p of pts){x0=Math.min(x0,p[a]||0);x1=Math.max(x1,p[a]||0);y0=Math.min(y0,p[b]||0);y1=Math.max(y1,p[b]||0);}
    if(view==='prof'){x0=Math.min(x0,0);y0=Math.min(y0,0);}const s=Math.max(x1-x0,y1-y0,0.5)*0.62,cx=(x0+x1)/2,cy=(y0+y1)/2;return {cx,cy,s:Math.max(s,0.4)};};
  const toS=p=>{const [a,b]=ax(),f=Math.min(W,H)/2/B.s;return [W/2+((p[a]||0)-B.cx)*f,H/2-((p[b]||0)-B.cy)*f*(view==='top'?-1:1)];};
  const fromS=(x,y)=>{const f=Math.min(W,H)/2/B.s;return [B.cx+(x-W/2)/f,B.cy-(y-H/2)/f*(view==='top'?-1:1)];};
  function draw(){if(drag<0)B=bounds();const c=cvs.getContext('2d');c.fillStyle='#05070f';c.fillRect(0,0,W,H);const f=Math.min(W,H)/2/B.s,st=B.s>4?1:0.5;
    c.strokeStyle='rgba(217,180,90,.1)';c.beginPath();for(let g=Math.floor((B.cx-B.s*2)/st)*st;g<B.cx+B.s*2;g+=st){const x=W/2+(g-B.cx)*f;c.moveTo(x,0);c.lineTo(x,H);}for(let g=Math.floor((B.cy-B.s*2)/st)*st;g<B.cy+B.s*2;g+=st){const y=H/2-(g-B.cy)*f*(view==='top'?-1:1);c.moveTo(0,y);c.lineTo(W,y);}c.stroke();
    const o=toS([0,0,0]);c.strokeStyle='rgba(217,180,90,.35)';c.beginPath();c.moveTo(o[0],0);c.lineTo(o[0],H);c.moveTo(0,o[1]);c.lineTo(W,o[1]);c.stroke();
    c.strokeStyle='#f3dc94';c.lineWidth=2;c.beginPath();pts.forEach((p,i)=>{const s=toS(p);i?c.lineTo(s[0],s[1]):c.moveTo(s[0],s[1]);});c.stroke();c.lineWidth=1;
    pts.forEach((p,i)=>{const s=toS(p);c.fillStyle=i===0?'#7fd9a0':'#d9b45a';c.beginPath();c.arc(s[0],s[1],5,0,7);c.fill();});
    c.fillStyle='#8f9ab3';c.font='10px monospace';const [a,b]=ax(),N='xyz';c.fillText(view==='prof'?'→ รัศมี  ↑ สูง':'→ '+N[a]+'  '+(view==='top'?'↓':'↑')+' '+N[b],4,H-4);}
  const pos=e=>{const r=cvs.getBoundingClientRect();return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height];};
  const near=(x,y)=>{let bi=-1,bd=10;pts.forEach((p,i)=>{const s=toS(p),d=Math.hypot(s[0]-x,s[1]-y);if(d<bd){bd=d;bi=i;}});return bi;};
  cvs.addEventListener('pointerdown',e=>{if(e.button)return;const [x,y]=pos(e),i=near(x,y);if(i>=0){push();drag=i;cvs.setPointerCapture(e.pointerId);}});
  cvs.addEventListener('pointermove',e=>{if(drag<0)return;const [x,y]=pos(e),w=fromS(x,y),[a,b]=ax(),r3=q=>+q.toFixed(3);pts[drag][a]=r3(view==='prof'?Math.max(0,w[0]):w[0]);pts[drag][b]=r3(w[1]);onChange(JSON.parse(JSON.stringify(pts)));draw();});
  cvs.addEventListener('pointerup',()=>{drag=-1;draw();});
  cvs.addEventListener('dblclick',e=>{const [x,y]=pos(e),w=fromS(x,y),[a,b]=ax();push();let bi=pts.length,bd=Infinity;
    for(let i=0;i+1<pts.length;i++){const s0=toS(pts[i]),s1=toS(pts[i+1]),d=Math.hypot((s0[0]+s1[0])/2-x,(s0[1]+s1[1])/2-y);if(d<bd){bd=d;bi=i+1;}}
    const base=pts[Math.max(0,bi-1)]||[0,0,0],np=base.slice();np[a]=+w[0].toFixed(3);np[b]=+w[1].toFixed(3);pts.splice(bi,0,np);onChange(JSON.parse(JSON.stringify(pts)));draw();});
  cvs.addEventListener('contextmenu',e=>{e.preventDefault();const [x,y]=pos(e),i=near(x,y);if(i>=0&&pts.length>2){push();pts.splice(i,1);onChange(JSON.parse(JSON.stringify(pts)));draw();}});
  const views=k==='prof'?[]:[['side','ข้าง'],['top','บน'],['front','หน้า']];
  const vb=h('div',{className:'row'},...views.map(([q,t])=>{const b=h('button',{className:'tg'+(q===view?' on':''),on:{click:()=>{view=q;vb.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));draw();}}},t);return b;}),h('span',{className:'mute',style:'font-size:11px'},'ลากจุด • ดับเบิลคลิกเพิ่ม • คลิกขวาลบ'));
  B=bounds();draw();return h('div',{className:'stCurve'},cvs,vb);}
// ตัวแก้จานสี: เลือกจานสำเร็จรูป หรือกำหนดจุดสีเอง
function mkRampEd(v,onSet,push){const X=txS(),box=h('div',{className:'mkRamp'}),grad=s=>'linear-gradient(90deg,'+txStops(s).map(q=>q[1]+' '+(q[0]*100).toFixed(0)+'%').join(',')+')';
  box.append(h('div',{className:'mkRampBar',style:'background:'+grad(v)}));
  const chips=h('div',{className:'mkRampChips'});for(const k in X.ramps)chips.append(h('button',{className:v===k?'on':'',title:k,style:'background:'+grad(k),on:{click:()=>{push();onSet(k);}}},h('span',null,k)));box.append(chips);
  const stops=txStops(v).map(q=>q.slice()),list=h('div',{className:'mkStops'});
  const emit=()=>{push();onSet(stops.map(q=>[+(+q[0]).toFixed(3),q[1]]));};
  stops.forEach((q,i)=>list.append(h('div',{className:'row'},h('input',{type:'number',min:0,max:1,step:0.05,value:q[0],style:'width:58px',on:{change:e=>{q[0]=Math.min(1,Math.max(0,+e.target.value));emit();}}}),
    h('input',{type:'color',value:q[1],on:{change:e=>{q[1]=e.target.value;emit();}}}),stops.length>2?h('button',{className:'tg',title:'ลบจุดสี',on:{click:()=>{stops.splice(i,1);emit();}}},'✕'):null)));
  list.append(h('button',{className:'tg',on:{click:()=>{const a=stops[stops.length-2]||stops[0],b=stops[stops.length-1];stops.splice(stops.length-1,0,[+(((a[0]+b[0])/2).toFixed(2)),b[1]]);emit();}}},'＋ จุดสี'));
  box.append(h('details',{open:Array.isArray(v)},h('summary',null,'กำหนดสีเอง (ตำแหน่ง 0 = เย็น/จาง → 1 = ร้อน/สว่าง)'),list));return box;}
function mkLintBox(rows){const b=h('div',{className:'stLint'});for(const r of rows)b.append(h('div',{className:r.lv},h('span',null,r.lv==='err'?'✗':'⚠'),h('span',null,(r.at?r.at+': ':'')+r.msg)));if(!rows.length)b.append(h('div',{className:'ok'},'✓ ตรวจผ่าน'));return b;}
async function mkPost(path,body){const r=await fetch('/api/save?path='+encodeURIComponent(path),{method:'POST',body});const j=await r.json();if(!j.ok)throw new Error(j.err||r.status);return j;}
function mkDownload(name,blob){const a=h('a',{href:URL.createObjectURL(blob),download:name});document.body.append(a);a.click();a.remove();}

// =====================================================================
//  🧊 โมเดล
// =====================================================================
async function mkMeshEnsure(){const M=MK.m;if(M.root)return;
  M.root=new THREE.Group();M.obj=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial());M.obj.renderOrder=3;
  M.wire=new THREE.Mesh(M.obj.geometry,new THREE.MeshBasicMaterial({wireframe:true,color:0xd9b45a,transparent:true,opacity:0.16,depthWrite:false}));M.wire.renderOrder=4;
  M.hi=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial({wireframe:true,color:0xfff0a0,transparent:true,opacity:0.7,depthTest:false,depthWrite:false}));M.hi.renderOrder=20;
  M.grid=new THREE.GridHelper(6,12,0xd9b45a,0x5a5030);M.grid.material.transparent=true;M.grid.material.opacity=0.35;M.grid.material.depthWrite=false;M.grid.position.y=0.02;
  M.helper=new THREE.Object3D();M.root.add(M.obj,M.wire,M.hi,M.grid,M.helper);
  try{const {TransformControls}=await import('three/addons/controls/TransformControls.js');const tc=new TransformControls(cam,gl.domElement);tc.setSize(0.85);tc.setSpace('local');
    tc.addEventListener('dragging-changed',e=>{M.drag=e.value;if(e.value){mkMPush();if(ME.on)meSnap();}else{if(ME.on)meDragEnd();mkMeshInsp();mkMeshBotRows();}});
    tc.addEventListener('objectChange',mkGizmoChange);tc.traverse(o=>{o.renderOrder=30;});M.tc=tc;}catch(e){console.warn('TransformControls',e);}}
async function mkMeshShow(){await mkMeshEnsure();const M=MK.m;scene.add(M.root);if(M.tc){scene.add(M.tc);M.tc.visible=true;}
  if(!M.d){const first=Object.keys(MK.list.mesh).sort()[0];if(first)await mkMeshOpen(first);else mkMeshNew('my_model','');}else{mkMeshAll();}}
function mkMeshHide(){const M=MK.m;if(M.root)scene.remove(M.root);if(M.tc){M.tc.detach();scene.remove(M.tc);}}
async function mkMeshOpen(n){try{const d=await fxFetch('assets/fx/mesh/'+n+'.mesh.json?t='+Date.now());const M=MK.m;Object.assign(M,{name:n,d,saved:JSON.stringify(d),dirty:false,sel:null,undo:[],redo:[]});await mkMeshEnsure();mkMeshAll();mkLibRender();return true;}
  catch(e){stToast('เปิดโมเดลไม่ได้: '+n+' ('+e.message+')');return false;}}
function mkMeshNew(name,tpl){const M=MK.m;let d=tpl?JSON.parse(JSON.stringify(tpl)):{v:1,desc:'',mat:'energy',pal:'arcane',parts:[{id:'shard',k:'shard'}]};
  Object.assign(M,{name,d,saved:'',dirty:true,sel:null,undo:[],redo:[]});mkMeshAll();mkLibRender();stToast('ยังไม่ได้บันทึก — กด 💾 (Ctrl+S)');}
function mkMeshNewAsk(){const m=h('div',{className:'stModal'}),nm=h('input',{type:'text',value:'my_model',style:'width:220px'}),tpls=Object.keys(MK.list.mesh).sort();
  const pick=async t=>{const n=nm.value.trim();if(!MKN.test(n)){stToast('ชื่อใช้ได้เฉพาะ a-z 0-9 _ -');return;}m.remove();let d=null;if(t){try{d=await fxFetch('assets/fx/mesh/'+t+'.mesh.json');}catch(e){}}mkMeshNew(n,d);};
  m.append(h('div',{className:'box'},h('h3',null,'โมเดลใหม่'),h('label',null,'ชื่อไฟล์ ',nm),h('div',{className:'tpls'},h('button',{on:{click:()=>pick('')}},'ว่างเปล่า',h('small',null,'แท่งผลึก 1 ชิ้น')),...tpls.map(t=>h('button',{on:{click:()=>pick(t)}},t,h('small',null,(MK.list.mesh[t]||{}).desc||'')))),
    h('div',null,h('button',{on:{click:()=>m.remove()}},'ยกเลิก'))));$st('st').append(m);nm.focus();nm.select();}
function mkMPush(){const M=MK.m;M.undo.push(JSON.stringify(M.d));if(M.undo.length>80)M.undo.shift();M.redo.length=0;}
function mkMUndo(r){const M=MK.m,A=r?M.redo:M.undo,B=r?M.undo:M.redo;if(!A.length)return;B.push(JSON.stringify(M.d));M.d=JSON.parse(A.pop());if(M.sel&&!M.d.parts.some(p=>p.id===M.sel))M.sel=null;M.dirty=JSON.stringify(M.d)!==M.saved;mkMeshAll();}
let _mkMT=0;
function mkMChanged(ui){const M=MK.m;M.dirty=JSON.stringify(M.d)!==M.saved;mkMeshRebuild();clearTimeout(_mkMT);_mkMT=setTimeout(()=>{if(ui)mkMeshInsp();mkMeshBotRows();},ui?0:250);}
const mkMSet=(o,k,v,ui)=>{if(v===undefined)delete o[k];else o[k]=v;mkMChanged(ui);};
function mkMeshAll(){mkMeshRebuild();mkMeshBot();mkMeshInsp();}
function mkMeshRebuild(){const M=MK.m;if(!M.obj||!M.d)return;const rec=[];const geo=fxMeshBuild(M.d,rec);geo.userData.keep=true;const old=M.obj.geometry;M.obj.geometry=geo;M.wire.geometry=geo;M.ranges=rec;M.tris=geo.userData.tris;
  if(old&&old!==geo){old.userData.keep=false;old.dispose();}
  if(M.name)FXMK.mesh.set(M.name,{data:JSON.parse(JSON.stringify(M.d)),geo,fail:false,p:Promise.resolve(geo)});   // เอฟเฟกต์ที่ใช้โมเดลนี้เห็นของใหม่ทันที
  mkMeshMat();M.wire.visible=M.wireOn;mkHi();mkMeshStat();}
function mkPal(){return fxPal((MK.m.d&&MK.m.d.pal)||'arcane');}
function mkMeshMat(){const M=MK.m,d=M.d,key=M.view+':'+(d.mat||'energy')+':'+(d.pal||'arcane');if(key===M.matK)return;M.matK=key;const P=mkPal(),old=M.obj.material;let m;
  if(M.view==='clay')m=new THREE.MeshStandardMaterial({color:0x9c8f7a,roughness:0.7,metalness:0,flatShading:true,side:THREE.DoubleSide});
  else switch(d.mat||'energy'){
    case 'fire':m=fireMat({mode:'ball',speed:1.2,int:1.15});break;
    case 'ice':m=iceShaderMat({glow:1,rim:1});m.uniforms.uFade.value=1;m.uniforms.uGlow.value=0.95;break;
    case 'glow':m=new THREE.MeshBasicMaterial({color:hdr(P.main,1.15),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});break;
    case 'solid':m=new THREE.MeshStandardMaterial({color:P.main,emissive:P.deep,emissiveIntensity:0.35,roughness:0.85,metalness:0,flatShading:true});break;
    default:m=fxEnergyMat(P.core,P.main,P.deep);m.uniforms.uOp.value=1;m.uniforms.uInt.value=1;}
  M.obj.material=m;if(old&&old.dispose)old.dispose();}
function mkHi(){if(meHi())return;const M=MK.m,P=M.sel&&M.d.parts.find(p=>p.id===M.sel);if(M.hi.geometry)M.hi.geometry.dispose();
  if(P&&!P.off){M.hi.geometry=fxMeshBuild({parts:[P]});M.hi.visible=true;}else{M.hi.geometry=new THREE.BufferGeometry();M.hi.visible=false;}
  if(M.tc){if(P&&!M.drag){mkHelperFrom(P);M.tc.attach(M.helper);}else if(!P)M.tc.detach();}}
// ชิ้นส่วน (+x ขวา) ↔ ลูกศรจับ (แกน three ของโมเดล: x กลับด้าน — เหมือน fxMeshBuild)
function mkHelperFrom(P){const o=mkOpts(P),p=o.pos||[0,0,0],r=o.rot||[0,0,0],s=o.scale,H=MK.m.helper;H.position.set(-(p[0]||0),p[1]||0,p[2]||0);H.rotation.set((r[0]||0)*MKD,-(r[1]||0)*MKD,-(r[2]||0)*MKD,'YXZ');
  if(typeof s==='number')H.scale.setScalar(s||1e-3);else if(Array.isArray(s))H.scale.set(s[0]||1e-3,s[1]||1e-3,s[2]||1e-3);else H.scale.setScalar(1);}
function mkGizmoChange(){if(ME.on){meGizmo();return;}const M=MK.m,P=M.sel&&M.d.parts.find(p=>p.id===M.sel);if(!P)return;const H=M.helper,r3=v=>+v.toFixed(3);
  if(M.mode==='translate')P.pos=[r3(-H.position.x),r3(H.position.y),r3(H.position.z)];
  else if(M.mode==='rotate'){const e=new THREE.Euler().setFromQuaternion(H.quaternion,'YXZ');P.rot=[+(e.x/MKD).toFixed(1),+(-e.y/MKD).toFixed(1),+(-e.z/MKD).toFixed(1)];}
  else{const s=H.scale;P.scale=Math.abs(s.x-s.y)<1e-4&&Math.abs(s.y-s.z)<1e-4?r3(s.x):[r3(s.x),r3(s.y),r3(s.z)];}
  M.dirty=true;if(!M.rb){M.rb=true;requestAnimationFrame(()=>{M.rb=false;mkMeshRebuild();mkSyncTitle();});}}
function mkGizmoMode(m){const M=MK.m;M.mode=m;if(M.tc){M.tc.setMode(m);M.tc.setSpace('local');}document.querySelectorAll('#mkBot [data-gm]').forEach(b=>b.classList.toggle('on',b.dataset.gm===m));}
const _mkRay=new THREE.Raycaster();
function mkPick(e){if(ME.on){mePick(e,e.shiftKey);return;}const M=MK.m;if(!M.obj)return;const r=gl.domElement.getBoundingClientRect();_mkRay.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),cam);
  const hit=_mkRay.intersectObject(M.obj,false)[0];let id=null;if(hit&&hit.faceIndex!=null){const g=M.ranges.find(q=>hit.faceIndex>=q[1]&&hit.faceIndex<q[2]);if(g)id=g[0];}mkSel(id);}
function mkSel(id){const M=MK.m;if(id!==M.sel)ME.sel=[];M.sel=id;mkHi();mkMeshBotRows();mkMeshInsp();}
function mkUid(base){let i=1,id=base;const has=x=>MK.m.d.parts.some(p=>p.id===x);while(has(id))id=base+(++i);return id;}
function mkAddPart(k){const M=MK.m;mkMPush();const P={id:mkUid(k),k};const S=M.d.parts.find(p=>p.id===M.sel);if(S&&S.pos)P.pos=S.pos.slice();M.d.parts.push(P);M.sel=P.id;mkMChanged(true);mkHi();}
function mkDelPart(id){const M=MK.m;mkMPush();M.d.parts=M.d.parts.filter(p=>p.id!==id);if(M.sel===id)M.sel=null;mkMChanged(true);mkHi();}
function mkDupPart(id){const M=MK.m,i=M.d.parts.findIndex(p=>p.id===id);if(i<0)return;mkMPush();const c=JSON.parse(JSON.stringify(M.d.parts[i]));c.id=mkUid(id.replace(/\d+$/,'')||id);M.d.parts.splice(i+1,0,c);M.sel=c.id;mkMChanged(true);mkHi();}
function mkMovePart(i,d){const A=MK.m.d.parts,j=i+d;if(j<0||j>=A.length)return;mkMPush();[A[i],A[j]]=[A[j],A[i]];mkMChanged(false);mkMeshBotRows();}
function mkMeshStat(){const e=$st('mkMStat');if(e){const t=MK.m.tris;e.textContent=MK.m.d.parts.length+' ชิ้น • '+t.toLocaleString()+' สามเหลี่ยม';e.className='mono '+(t>30000?'bad':'good');}mkSyncTitle();}
function mkSyncTitle(){const e=$st('mkTitle');if(!e)return;const X=MK.ws==='mesh'?MK.m:MK.ws==='tex'?MK.t:MK.v;e.textContent=(X.name||'(ใหม่)')+(X.dirty?' ●':'');e.classList.toggle('dirty',X.dirty);}
function mkMeshBot(){const B=$st('mkBot');if(!B||MK.ws!=='mesh')return;B.innerHTML='';const M=MK.m,S=mkS(),d=M.d;
  const menu=h('div',{id:'mkAddMenu',hidden:true},h('div',{className:'mkMenuH'},'✎ ปั้นเอง (แก้จุดได้แบบ Blender — กด Tab)'),...Object.entries(MEPRIM).map(([k,T])=>h('button',{title:'เริ่มจาก'+T.th+' แล้วเข้าโหมดแก้จุด',on:{click:()=>{menu.hidden=true;meAddPrim(k);}}},h('b',null,T.icon),' '+T.th,h('small',{className:'mute'},' poly'))),
    h('div',{className:'mkMenuH'},'ชิ้นสำเร็จรูป (ปรับด้วยแถบเลื่อน)'),...Object.entries(S.parts).filter(([k])=>k!=='poly').map(([k,T])=>h('button',{title:T.desc,on:{click:()=>{menu.hidden=true;mkAddPart(k);}}},h('b',null,T.icon||'·'),' '+T.th,h('small',{className:'mute'},' '+k))));
  const sel=(opts,val,fn,title)=>h('select',{title,on:{change:e=>fn(e.target.value)}},...opts.map(([v,t])=>h('option',{value:v,selected:v===val},t)));
  B.append(h('div',{className:'bar'},h('span',{className:'file',id:'mkTitle'}),
    h('button',{className:'gold',title:'บันทึก (Ctrl+S)',on:{click:()=>mkMeshSave()}},'💾 บันทึก'),h('button',{on:{click:()=>mkMeshSave(true)}},'บันทึกเป็น…'),h('button',{title:'ย้อน (Ctrl+Z)',on:{click:()=>mkMUndo(false)}},'↶'),h('button',{title:'ทำซ้ำ (Ctrl+Y)',on:{click:()=>mkMUndo(true)}},'↷'),
    h('span',{className:'sep'}),h('span',{style:'position:relative'},h('button',{on:{click:()=>{menu.hidden=!menu.hidden;}}},'＋ ชิ้นส่วน'),menu),
    ...[['translate','✥ ย้าย','G'],['rotate','⟳ หมุน','R'],['scale','⤢ ขนาด','S']].map(([m,t,kk])=>h('button',{'data-gm':m,className:M.mode===m?'on':'',title:t+' ('+kk+')',on:{click:()=>mkGizmoMode(m)}},t+' '+kk)),
    ...meBotButtons(),h('span',{className:'sep'}),h('button',{className:M.wireOn?'on':'',title:'โครงลวด (W)',on:{click:e=>{M.wireOn=!M.wireOn;M.wire.visible=M.wireOn;e.target.classList.toggle('on',M.wireOn);}}},'▦ โครงลวด'),
    sel([['clay','ดู: ดินปั้น'],['mat','ดู: วัสดุจริง']],M.view,v=>{M.view=v;M.matK='';mkMeshMat();},'ดูรูปทรงล้วน / วัสดุในเกม'),
    sel(S.file.mat.of.map(x=>[x,'วัสดุ '+x]),d.mat||'energy',v=>{mkMPush();d.mat=v;M.view='mat';mkMChanged(true);mkMeshBot();},'วัสดุที่แนะนำ (บันทึกในไฟล์)'),
    sel(FXR.schema.pals.filter(p=>p!=='col').map(x=>[x,'ธาตุ '+x]),d.pal||'arcane',v=>{mkMPush();d.pal=v;mkMChanged(true);},'สีตอนดู'),
    h('span',{id:'mkMStat',className:'mono'}),h('span',{className:'sep'}),
    h('button',{title:'เพิ่มชั้น mesh ที่ใช้โมเดลนี้ในเอฟเฟกต์ที่เปิดอยู่',on:{click:mkMeshUseInFx}},'➕ ใส่ในเอฟเฟกต์'),h('button',{title:'ส่งออก .glb (เปิดต่อใน Blender ได้)',on:{click:mkMeshGlb}},'⬇ .glb'),h('button',{on:{click:mkHelp}},'?')),
    h('div',{id:'mkRows'}));
  mkMeshBotRows();mkMeshStat();}
function mkMeshBotRows(){const R=$st('mkRows');if(!R||MK.ws!=='mesh')return;R.innerHTML='';const M=MK.m,S=mkS();
  R.append(h('div',{className:'mkRow'+(M.sel===null?' on':''),on:{click:()=>mkSel(null)}},h('span',{className:'nm'},'⚙ ตั้งค่าไฟล์'),h('span',{className:'mute',style:'font-size:11px'},'คลิกชิ้นบนจอเพื่อเลือก • ลากลูกศร = ย้าย/หมุน/ขนาด • G R S สลับ • Delete ลบ • Ctrl+D ทำซ้ำ • H ซ่อน')));
  M.d.parts.forEach((P,i)=>{const T=S.parts[P.k]||{};R.append(h('div',{className:'mkRow'+(M.sel===P.id?' on':'')+(P.off?' off':''),on:{click:e=>{if(e.target.closest('button'))return;mkSel(P.id);}}},
    h('button',{title:'ซ่อน/แสดง (H)',on:{click:()=>{mkMPush();if(P.off)delete P.off;else P.off=true;mkMChanged(false);mkMeshBotRows();}}},P.off?'◌':'👁'),
    h('span',{className:'nm'},(T.icon||'·')+' '+P.id),h('span',{className:'ty'},P.k+(P.arr>1?' ×'+P.arr:'')+(P.mir?' ⇋':'')),
    h('button',{title:'ขึ้น',on:{click:()=>mkMovePart(i,-1)}},'↑'),h('button',{title:'ลง',on:{click:()=>mkMovePart(i,1)}},'↓'),h('button',{title:'ทำซ้ำ (Ctrl+D)',on:{click:()=>mkDupPart(P.id)}},'⧉'),h('button',{title:'ลบ (Delete)',on:{click:()=>mkDelPart(P.id)}},'✕')));});}
function mkMeshInsp(){const I=$st('mkInsp');if(!I||MK.ws!=='mesh')return;I.innerHTML='';const M=MK.m,S=mkS(),d=M.d,ctx={push:mkMPush,set:mkMSet};
  const lint=FXLINT.fxLintMesh(d,FXR.schema);
  if(M.sel===null){I.append(h('div',{className:'hd'},h('b',null,M.name||'(ใหม่)'),h('span',{className:'mute'},'โมเดล')));for(const k of ['desc','mat','pal','tags'])I.append(mkField(S.file[k],d,k,ctx));
    I.append(h('h3',null,'ตรวจ'),mkLintBox(lint),h('p',{className:'mute',style:'font-size:12px'},'ใช้ในเอฟเฟกต์: ชั้น mesh → รูปทรง model → model: '+(M.name||'<ชื่อ>')+' (หรือกด ➕ ใส่ในเอฟเฟกต์) • ปั้นที่ขนาดจริง (เมตร) ฐานที่ y = 0'));return;}
  const P=d.parts.find(p=>p.id===M.sel);if(!P){M.sel=null;return mkMeshInsp();}const T=S.parts[P.k]||{fields:{}};
  I.append(h('div',{className:'hd'},h('b',null,(T.icon||'')+' '+P.id),h('span',{className:'mute'},T.th+' · '+P.k)),h('p',{className:'mute',style:'margin:0;font-size:12px'},T.desc),mkLintBox(lint.filter(r=>String(r.at).split('.')[0]===P.id)));
  const idIn=h('input',{type:'text',value:P.id,on:{change:e=>{const n=e.target.value.trim();if(!n||d.parts.some(x=>x.id===n&&x!==P)){stToast('id ซ้ำหรือว่าง');e.target.value=P.id;return;}mkMPush();P.id=n;M.sel=n;mkMChanged(true);}}});
  I.append(h('div',{className:'stF'},h('label',null,'ชื่อชิ้น',h('small',null,'id')),h('div',{className:'row'},idIn)));
  I.append(h('div',{className:'stF'},h('label',null,'แบบชิ้นส่วน',h('small',null,'k')),h('div',{className:'stShapes mkKinds'},...Object.entries(S.parts).map(([k,TT])=>h('button',{className:k===P.k?'on':'',title:TT.th,on:{click:()=>{if(k===P.k)return;mkMPush();for(const f in T.fields)if(!S.common[f])delete P[f];P.k=k;mkMChanged(true);mkHi();}}},h('b',null,TT.icon||'·'),k)))));
  if(P.k==='poly')I.append(h('div',{className:'stF'},h('label',null,'รูปทรงที่ปั้นเอง',h('small',null,'v · f')),h('div',{className:'row'},h('span',{className:'mute',style:'flex:1'},(P.v||[]).length+' จุด • '+(P.f||[]).length+' หน้า'),h('button',{className:ME.on?'on':'',on:{click:()=>meToggle()}},ME.on?'ออกจากโหมดแก้จุด (Tab)':'✎ แก้จุด (Tab)'))),
    h('p',{className:'mute',style:'grid-column:1/-1;margin:2px 0 0;font-size:11.5px'},'อยากให้โค้งมน: ตั้ง “ทำให้เนียน” 1–2 และปิด “ผิวเหลี่ยม” • อยากได้ซ้ายขวาเท่ากัน: เปิด “กระจก” แล้วปั้นแค่ครึ่งเดียว'));
  for(const k in T.fields){if(P.k==='poly'&&(k==='v'||k==='f'))continue;I.append(mkField(T.fields[k],P,k,ctx));}
  const grp=(t,keys,open)=>{const g=h('details',{open},h('summary',null,t));for(const k of keys)if(!T.fields[k])g.append(mkField(S.common[k],P,k,ctx));I.append(g);};
  grp('ตำแหน่ง / หมุน / ขนาด',['pos','rot','scale'],true);grp('ตัวแต่งรูปทรง (เรียว บิด โค้ง ขรุขระ)',['topScale','twist','bend','noise','nfreq','seed','flat'],true);
  const am=P.arrMode||'ring';grp('ทำซ้ำ / กระจก',['arr','arrMode',am==='line'?'arrStep':'arrR','arrScale','arrJit','mir'],(P.arr||1)>1||!!P.mir);
  const ta=h('textarea',{value:JSON.stringify(P,null,1),spellcheck:false,style:'width:100%;min-height:110px;font:11px var(--fu)'});
  I.append(h('details',null,h('summary',null,'JSON ของชิ้นนี้'),ta,h('button',{on:{click:()=>{try{const v=JSON.parse(ta.value);mkMPush();Object.keys(P).forEach(k=>delete P[k]);Object.assign(P,v);M.sel=P.id;mkMChanged(true);mkHi();}catch(e){stToast('JSON ผิด: '+e.message);}}}},'ใช้ JSON นี้')));}
function mkMeshPretty(){const d=Object.assign({},MK.m.d),P=d.parts||[];delete d.parts;const head=JSON.stringify(d,null,2).replace(/\n}$/,'');return head+(Object.keys(d).length?',':'')+'\n  "parts": [\n'+P.map(p=>'    '+JSON.stringify(p)).join(',\n')+'\n  ]\n}\n';}
async function mkMeshSave(as,force){const M=MK.m;let name=force||M.name;if(as&&!force){const n=prompt('ชื่อโมเดล (a-z 0-9 _ -)',name||'my_model');if(!n)return false;name=n.trim();}
  if(!MKN.test(name||'')){stToast('ชื่อใช้ได้เฉพาะ a-z 0-9 _ - (ภาษาอังกฤษตัวเล็ก)');return false;}const txt=mkMeshPretty();
  try{const j=await mkPost('assets/fx/mesh/'+name+'.mesh.json',txt);M.name=name;M.saved=JSON.stringify(M.d);M.dirty=false;mkMeshRebuild();await mkRefresh();mkSyncTitle();stToast('บันทึกแล้ว → assets/fx/mesh/'+name+'.mesh.json\n'+(j.check||''),4000);return true;}
  catch(e){if(MK.api){stToast('บันทึกไม่ได้: '+e.message);return false;}}
  mkDownload(name+'.mesh.json',new Blob([txt],{type:'application/json'}));stToast('ดาวน์โหลดแล้ว — วางไว้ที่ assets/fx/mesh/'+name+'.mesh.json (เปิดผ่าน python tools/serve.py จะบันทึกตรงได้)',5000);return true;}
function mkMeshUseInFx(){const M=MK.m;if(!M.name||M.dirty){stToast('บันทึกโมเดลก่อน แล้วค่อยใส่ในเอฟเฟกต์');return;}
  mkWs('fx').then(()=>{if(!ST.fx)return;stPush();const L={id:stUid('model'),t:'mesh',at:+Math.min(ST.t,stDur()).toFixed(2),life:0.8,shape:'model',model:M.name,mat:M.d.mat||'energy',scale:{'0':0.2,'0.25':1,ease:'out'}};ST.fx.layers.push(L);ST.sel=L.id;stChanged(true);stToast('เพิ่มชั้น '+L.id+' (โมเดล '+M.name+') แล้ว');});}
async function mkMeshGlb(){const M=MK.m;try{const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');const mesh=new THREE.Mesh(M.obj.geometry,new THREE.MeshStandardMaterial({color:0xffffff,name:'add_'+(M.name||'fx')}));mesh.name=M.name||'fx_model';
    new GLTFExporter().parse(mesh,r=>mkDownload((M.name||'fx_model')+'.glb',new Blob([r],{type:'model/gltf-binary'})),e=>stToast('ส่งออกไม่ได้: '+e),{binary:true});}catch(e){stToast('ส่งออกไม่ได้: '+e.message);}}

// =====================================================================
//  🎞 ภาพ
// =====================================================================
async function mkTexShow(){const T=MK.t;if(!T.d){const first=Object.keys(MK.list.tex).sort()[0];if(first)await mkTexOpen(first);else mkTexNew('my_fire','fire');}else mkTexAll();mkTexView(T.view);}
async function mkTexOpen(n){try{const d=await fxFetch('assets/fx/tex/'+n+'.tex.json?t='+Date.now());MK.t.src=d.gen==='image'?await mkImgToCanvas(await mkImgLoad('assets/fx/tex/'+n+'.png?t='+Date.now())):null;Object.assign(MK.t,{name:n,d,saved:JSON.stringify(d),dirty:false,undo:[],redo:[]});mkTexAll();mkTexRenderNow();mkLibRender();return true;}
  catch(e){stToast('เปิดภาพไม่ได้: '+n+' ('+e.message+')');return false;}}
function mkTexDefaults(gen){const G=txS().gens[gen];return {v:1,desc:'',gen,seed:1,px:G.grid>=8?128:G.grid>1?128:256,cols:G.grid,rows:G.grid,kind:G.kind,fps:24,ramp:G.ramp,add:G.add,rand:G.kind==='loop'&&G.grid>1,p:{}};}
function mkTexNew(name,gen,tpl){const d=tpl?JSON.parse(JSON.stringify(tpl)):mkTexDefaults(gen||'fire');Object.assign(MK.t,{name,d,saved:'',dirty:true,undo:[],redo:[]});mkTexAll();mkTexRenderNow();mkLibRender();stToast('ยังไม่ได้บันทึก — กด 💾 (Ctrl+S)');}
function mkTexNewAsk(){const m=h('div',{className:'stModal'}),nm=h('input',{type:'text',value:'my_texture',style:'width:220px'}),X=txS();
  const ok=()=>{const n=nm.value.trim();if(!MKN.test(n)){stToast('ชื่อใช้ได้เฉพาะ a-z 0-9 _ -');return null;}m.remove();return n;};
  m.append(h('div',{className:'box'},h('h3',null,'ภาพใหม่ — เลือกตัววาด'),h('label',null,'ชื่อไฟล์ ',nm),
    h('div',{className:'tpls'},...Object.entries(X.gens).map(([g,G])=>h('button',{on:{click:()=>{const n=ok();if(n)mkTexNew(n,g);}}},(G.icon||'')+' '+G.th,h('small',null,G.desc)))),
    Object.keys(MK.list.tex).length?h('div',null,h('h3',{style:'margin:6px 0'},'หรือเริ่มจากภาพที่มี'),h('div',{className:'tpls'},...Object.keys(MK.list.tex).sort().map(t=>h('button',{on:{click:async()=>{const n=ok();if(!n)return;let d=null;try{d=await fxFetch('assets/fx/tex/'+t+'.tex.json');}catch(e){}mkTexNew(n,null,d);}}},t,h('small',null,(MK.list.tex[t]||{}).desc||''))))):null,
    h('div',null,h('button',{on:{click:()=>m.remove()}},'ยกเลิก'))));$st('st').append(m);nm.focus();nm.select();}
function mkTPush(){const T=MK.t;T.undo.push(JSON.stringify(T.d));if(T.undo.length>80)T.undo.shift();T.redo.length=0;}
function mkTUndo(r){const T=MK.t,A=r?T.redo:T.undo,B=r?T.undo:T.redo;if(!A.length)return;B.push(JSON.stringify(T.d));T.d=JSON.parse(A.pop());T.dirty=JSON.stringify(T.d)!==T.saved;mkTexAll();mkTexRenderSoon();}
function mkTChanged(ui){const T=MK.t;T.dirty=JSON.stringify(T.d)!==T.saved;mkSyncTitle();mkTexRenderSoon();if(ui)mkTexInsp();}
const mkTSet=(o,k,v,ui)=>{if(v===undefined)delete o[k];else o[k]=v;mkTChanged(ui);};
function mkTexAll(){mkTexBot();mkTexInsp();}
function mkTexRenderSoon(){const T=MK.t;clearTimeout(T.timer);T.timer=setTimeout(mkTexRenderNow,T.d&&T.d.gen==='sim'?380:90);const s=$st('mkTStat');if(s)s.textContent='กำลังวาด…';}
function mkTexKey(){return 'tex/'+(MK.t.name||'_draft');}
function mkTexMeta(o){return {cols:o.cols,rows:o.rows,add:o.add,span:o.span,rand:o.rand,rot:o.rot,spin:o.spin,size:o.size,occ:o.occ,kind:o.kind,fps:o.fps};}
function mkTexRenderNow(){const T=MK.t;if(!T.d)return;const t0=performance.now();
  try{T.cv=T.d.gen==='image'?mkImgCv():txRender(T.d);T.err='';}catch(e){T.err=String(e.message||e);console.error(e);stToast('วาดไม่ได้: '+T.err);return;}
  T.ms=performance.now()-t0;T.ver++;T.f=0;T.acc=0;const o=txOpts(T.d);
  const ct=new THREE.CanvasTexture(T.cv);fxTexUse(mkTexKey(),mkTexMeta(o),ct);T.demoK='';   // ใช้ได้ทันทีในเอฟเฟกต์ (ก่อนบันทึก)
  const A=$st('mkAtlas');if(A){A.innerHTML='';T.cv.title='ภาพทั้งแผ่น '+T.cv.width+'×'+T.cv.height;A.append(T.cv);}
  const info=$st('mkTexInfo');if(info)info.textContent=`${o.cols*o.rows} เฟรม • ${o.px}px/เฟรม • ภาพ ${T.cv.width}×${T.cv.height} • ${o.kind==='loop'?'วน '+o.fps+' fps':'ตามอายุเม็ด'} • ${o.add?'เรืองแสง':'ทึบ'} • วาด ${T.ms.toFixed(0)} ms`;
  const s=$st('mkTStat');if(s)s.textContent='วาด '+T.ms.toFixed(0)+' ms';}
// ตัวอย่างเคลื่อนไหว (2D) บนพื้นมืด / สว่าง / ตาราง
function mkTexAnim(rdt){const T=MK.t,cv=$st('mkPv');if(!cv||!T.cv||!T.d)return;const o=txOpts(T.d),N=o.cols*o.rows;
  if(T.play){T.acc+=rdt;if(o.kind==='loop'){const sp=1/Math.max(1,o.fps);while(T.acc>=sp){T.acc-=sp;T.f=(T.f+1)%N;}}else{const cyc=1.0+0.35;if(T.acc>cyc)T.acc=0;T.f=Math.min(N-1,Math.floor(T.acc/1.0*N));}}
  const x=cv.getContext('2d'),W=cv.width;x.globalCompositeOperation='source-over';
  if(T.bg==='checker'){for(let i=0;i<8;i++)for(let j=0;j<8;j++){x.fillStyle=(i+j)%2?'#3a3f4c':'#2a2e38';x.fillRect(i*W/8,j*W/8,W/8,W/8);}}else{x.fillStyle=T.bg==='light'?'#b9c2cf':'#070a14';x.fillRect(0,0,W,W);}
  const px=o.px,cx=T.f%o.cols,cy=Math.floor(T.f/o.cols);x.globalCompositeOperation=o.add&&T.bg!=='light'?'lighter':'source-over';x.imageSmoothingEnabled=true;x.drawImage(T.cv,cx*px,cy*px,px,px,0,0,W,W);x.globalCompositeOperation='source-over';
  x.fillStyle='rgba(243,220,148,.85)';x.font='12px monospace';x.fillText('เฟรม '+(T.f+1)+'/'+N,8,W-10);}
function mkTexView(v){const T=MK.t;T.view=v;document.body.classList.toggle('tex3d',v==='3d');document.querySelectorAll('#mkBot [data-tv]').forEach(b=>b.classList.toggle('on',b.dataset.tv===v));if(v==='3d'){T.demoK='';}else mkTexDemoStop();}
function mkTexDemoStop(){const T=MK.t;if(T.demo){fxKill(T.demo);T.demo=null;}fxClearAll();}
function mkTexDemoTick(rdt){const T=MK.t;if(!T.d)return;const o=txOpts(T.d),key=mkTexKey(),life=o.kind==='life',dur=life?1.5:1e9;T.demoT+=rdt;
  if(T.demo&&T.demoK===key+T.ver&&T.demoT<dur)return;mkTexDemoStop();T.demoT=0;T.demoK=key+T.ver;const A=stAnchor();if(!A)return;
  const F={v:1,pal:'arcane',layers:life?[
      {id:'card',t:'mesh',shape:'plane',bill:true,mat:'flip',tex:key,col:'#ffffff',at:0,life:1.1,scale:2.6,pos:[-1.7,1.5,0],fade:0},
      {id:'pt',t:'emit',at:0,life:0.05,burst:7,from:'sphere',fr:0.3,dir:'out',speed:[1.5,3.5],plife:[0.8,1.2],look:'glow',fb:key,size:[14,20],col:'#ffffff',c2:'#ffffff',gravity:0.5,drag:2,pos:[1.6,1.3,0]}]
    :[{id:'card',t:'mesh',shape:'plane',bill:true,mat:'flip',tex:key,col:'#ffffff',at:0,life:4,loop:true,scale:2.6,pos:[-1.7,1.5,0]},
      {id:'pt',t:'emit',at:0,life:4,loop:true,rate:14,from:'disc',fr:0.35,dir:'up',spread:0.3,speed:[0.3,0.8],up:1.3,plife:[0.9,1.4],look:'glow',fb:key,size:[16,22],col:'#ffffff',c2:'#ffffff',gravity:-0.3,drag:1.2,att:'ground',pos:[1.6,0,0]}]};
  T.demo=fxStart(F,{x:A.x,y:A.y,h:A.h,a:A.a,own:true},'__texdemo');}
function mkTexBot(){const B=$st('mkBot');if(!B||MK.ws!=='tex')return;B.innerHTML='';const T=MK.t,X=txS();
  B.append(h('div',{className:'bar'},h('span',{className:'file',id:'mkTitle'}),
    h('button',{className:'gold',title:'บันทึก .png + .tex.json (Ctrl+S)',on:{click:()=>mkTexSave()}},'💾 บันทึก'),h('button',{on:{click:()=>mkTexSave(true)}},'บันทึกเป็น…'),h('button',{title:'ย้อน (Ctrl+Z)',on:{click:()=>mkTUndo(false)}},'↶'),h('button',{title:'ทำซ้ำ (Ctrl+Y)',on:{click:()=>mkTUndo(true)}},'↷'),
    h('span',{className:'sep'}),h('button',{'data-tv':'2d',className:T.view==='2d'?'on':'',title:'ดูภาพ (1)',on:{click:()=>mkTexView('2d')}},'🖼 ภาพ'),h('button',{'data-tv':'3d',className:T.view==='3d'?'on':'',title:'ลองในฉาก 3D (2)',on:{click:()=>mkTexView('3d')}},'🧪 ลองใน 3D'),
    h('select',{title:'พื้นหลัง',on:{change:e=>{T.bg=e.target.value;}}},...[['dark','พื้นมืด'],['light','พื้นสว่าง'],['checker','ตาราง']].map(([v,t])=>h('option',{value:v,selected:T.bg===v},t))),
    h('button',{title:'เล่น/หยุด (Space)',on:{click:e=>{T.play=!T.play;e.target.textContent=T.play?'⏸':'▶';}}},T.play?'⏸':'▶'),h('button',{title:'สุ่มลายใหม่',on:{click:()=>{mkTPush();T.d.seed=((T.d.seed||1)%9999)+1;mkTChanged(true);}}},'🎲 seed'),
    h('span',{id:'mkTStat',className:'mono'}),h('span',{className:'sep'}),h('button',{title:'นำเข้าภาพ PNG/JPG ที่วาดเอง (ภาพเดียว = sprite sheet, หลายภาพ = เรียงเป็นเฟรม) — หรือลากไฟล์มาวางบนจอ',on:{click:mkTexImportAsk}},'📥 นำเข้าภาพ'),
    h('button',{title:'เพิ่มชั้นอนุภาคที่ใช้ภาพนี้ในเอฟเฟกต์ที่เปิดอยู่',on:{click:()=>mkTexUseInFx('emit')}},'➕ เป็นเม็ดในเอฟเฟกต์'),h('button',{title:'เพิ่มการ์ดภาพ (แผ่นหันหากล้อง)',on:{click:()=>mkTexUseInFx('card')}},'➕ เป็นการ์ดภาพ'),h('button',{on:{click:mkHelp}},'?')),
    h('div',{id:'mkGens'},...Object.entries(X.gens).map(([g,G])=>h('button',{className:T.d&&T.d.gen===g?'on':'',title:G.desc,on:{click:()=>mkTexGen(g)}},h('b',null,G.icon||'·'),h('span',null,G.th),h('small',null,(G.kind==='loop'?'วน':'ตามอายุ')+' • '+G.grid+'×'+G.grid)))));
  mkSyncTitle();}
function mkTexGen(g){const T=MK.t;if(g==='image'){mkTexImportAsk();return;}if(!T.d||T.d.gen===g)return;mkTPush();const D=mkTexDefaults(g);Object.assign(T.d,{gen:g,p:{},cols:D.cols,rows:D.rows,kind:D.kind,ramp:D.ramp,add:D.add,rand:D.rand,px:D.px});mkTChanged(true);mkTexBot();}
function mkTexInsp(){const I=$st('mkInsp');if(!I||MK.ws!=='tex')return;I.innerHTML='';const T=MK.t,X=txS(),d=T.d,G=X.gens[d.gen]||{fields:{}},ctx={push:mkTPush,set:mkTSet};
  I.append(h('div',{className:'hd'},h('b',null,(G.icon||'')+' '+(T.name||'(ใหม่)')),h('span',{className:'mute'},G.th+' · '+d.gen)),h('p',{className:'mute',style:'margin:0;font-size:12px'},G.desc),mkLintBox(FXLINT.fxLintTex(d,FXR.schema,{})));
  if(!d.p)d.p={};for(const k in G.fields)I.append(mkField(G.fields[k],d.p,k,ctx));
  if(d.gen==='image')I.append(h('div',{className:'stF'},h('button',{on:{click:mkTexImportAsk}},'📥 นำเข้าภาพใหม่ (แทนภาพนี้)'),h('p',{className:'mute',style:'font-size:12px;margin:4px 0 0'},'ภาพเป็น sprite sheet? ตั้ง cols × rows ให้ตรงกับจำนวนช่องในภาพ • ภาพ '+(T.src?T.src.width+'×'+T.src.height:'-')+' px')));
  else I.append(h('h3',{style:'margin-top:6px'},'สี'),mkField(X.file.ramp,d,'ramp',ctx));
  const grp=(t,keys,open)=>{const g=h('details',{open},h('summary',null,t));for(const k of keys)g.append(mkField(X.file[k],d,k,ctx));I.append(g);};
  grp('ภาพ / เฟรม',['px','cols','rows','kind','fps','seed','desc'],true);grp('วิธีเล่นในเกม',['add','span','rand','rot','spin','size','occ'],false);
  I.append(h('p',{className:'mute',style:'font-size:12px'},'ใช้ในเอฟเฟกต์: emit → fb: tex/'+(T.name||'<ชื่อ>')+' (col #ffffff = สีตามภาพ) • การ์ดภาพ: mesh → plane + bill + mat flip + tex'));
  const ta=h('textarea',{value:JSON.stringify(d,null,1),spellcheck:false,style:'width:100%;min-height:110px;font:11px var(--fu)'});
  I.append(h('details',null,h('summary',null,'JSON (.tex.json)'),ta,h('button',{on:{click:()=>{try{const v=JSON.parse(ta.value);mkTPush();T.d=v;mkTChanged(true);mkTexBot();}catch(e){stToast('JSON ผิด: '+e.message);}}}},'ใช้ JSON นี้')));}
function mkTexPretty(){const d=MK.t.d,ks=Object.keys(d);return '{\n'+ks.map(k=>'  '+JSON.stringify(k)+': '+JSON.stringify(d[k])).join(',\n')+'\n}\n';}
async function mkTexSave(as,force){const T=MK.t;let name=typeof as==='string'?as:force||T.name;if(as===true){const n=prompt('ชื่อภาพ (a-z 0-9 _ -)',name||'my_texture');if(!n)return false;name=n.trim();}
  if(!MKN.test(name||'')){stToast('ชื่อใช้ได้เฉพาะ a-z 0-9 _ - (ภาษาอังกฤษตัวเล็ก)');return false;}
  clearTimeout(T.timer);const oldKey=mkTexKey();if(name!==T.name)T.name=name;mkTexRenderNow();if(!T.cv)return false;const txt=mkTexPretty();const blob=await txPng(T.cv);
  try{await mkPost('assets/fx/tex/'+name+'.png',blob);const j=await mkPost('assets/fx/tex/'+name+'.tex.json',txt);T.saved=JSON.stringify(T.d);T.dirty=false;await mkRefresh();mkSyncTitle();
    if(oldKey!==mkTexKey())FXMK.tex.delete(oldKey);stToast('บันทึกแล้ว → assets/fx/tex/'+name+'.png + .tex.json\n'+(j.check||''),4000);return true;}
  catch(e){if(MK.api){stToast('บันทึกไม่ได้: '+e.message);return false;}}
  mkDownload(name+'.png',blob);mkDownload(name+'.tex.json',new Blob([txt],{type:'application/json'}));stToast('ดาวน์โหลดแล้ว — วางทั้ง 2 ไฟล์ไว้ที่ assets/fx/tex/',5000);return true;}
function mkTexUseInFx(kind){const T=MK.t;if(!T.name||T.dirty){stToast('บันทึกภาพก่อน แล้วค่อยใส่ในเอฟเฟกต์');return;}const key=mkTexKey(),o=txOpts(T.d);
  mkWs('fx').then(()=>{if(!ST.fx)return;stPush();const at=+Math.min(ST.t,stDur()).toFixed(2);let L;
    if(kind==='card')L={id:stUid('card'),t:'mesh',at,life:o.kind==='life'?0.7:1.5,shape:'plane',bill:true,mat:'flip',tex:key,col:'#ffffff',scale:2.5,pos:[0,1.3,0]};
    else L={id:stUid('tex'),t:'emit',at,life:o.kind==='life'?0.06:0.8,burst:o.kind==='life'?10:0,rate:o.kind==='life'?0:20,look:'glow',fb:key,col:'#ffffff',c2:'#ffffff',size:[12,18],plife:[0.6,1],speed:[1,3],up:o.kind==='loop'?1:0};
    ST.fx.layers.push(L);ST.sel=L.id;stChanged(true);stToast('เพิ่มชั้น '+L.id+' (ภาพ '+key+') แล้ว');});}
async function mkTexSheet(name){const T=MK.t;if(!T.cv)mkTexRenderNow();const o=txOpts(T.d),W=Math.min(1024,T.cv.width),Hh=Math.round(T.cv.height*W/T.cv.width),c=document.createElement('canvas');c.width=W*2+24;c.height=Math.max(W,Hh)+60;const x=c.getContext('2d');
  x.fillStyle='#070a14';x.fillRect(0,0,c.width,c.height);for(let i=0;i<16;i++)for(let j=0;j<16;j++){x.fillStyle=(i+j)%2?'#2a2e38':'#1e212a';x.fillRect(W+24+i*W/16,40+j*Hh/16,W/16,Hh/16);}
  x.drawImage(T.cv,0,40,W,Hh);x.drawImage(T.cv,W+24,40,W,Hh);x.fillStyle='#f3dc94';x.font='16px monospace';x.fillText(`tex/${T.name} • ${T.d.gen} • ${o.cols}×${o.rows} • ${o.px}px • ซ้าย: พื้นมืด  ขวา: ตาราง`,8,24);
  return stShot(name||('tex_'+(T.name||'draft')),c.toDataURL('image/jpeg',0.9));}
// แผ่นสรุปโมเดลทั้งหมด (วัสดุจริง + ดินปั้น) → shots/<ชื่อ>.jpg
async function mkMeshSheetAll(name,only){const names=(only||Object.keys(MK.list.mesh)).slice().sort(),cw=360,ch=250,cols=4,rows=Math.ceil(names.length/cols),C=document.createElement('canvas');C.width=cw*cols;C.height=(ch+18)*rows;const x=C.getContext('2d');x.fillStyle='#0a0e1a';x.fillRect(0,0,C.width,C.height);
  const M=MK.m,cam0=Object.assign({},ST.orb),camK=ST.cam,v0=M.view;ST.cam='orbit';if(M.tc)M.tc.visible=false;
  for(let i=0;i<names.length;i++){if(!(await mkMeshOpen(names[i])))continue;M.view='mat';M.matK='';mkMeshMat();M.hi.visible=false;M.wire.visible=false;M.grid.visible=false;
    const r=M.obj.geometry.boundingSphere?M.obj.geometry.boundingSphere.radius:1.5;ST.orb.dist=Math.max(2.5,r*2.4);ST.orb.pitch=0.32;ST.orb.yaw=0.9;
    for(let k=0;k<3;k++){mkPlace(M.root);stRender(1/60,true);}const X=(i%cols)*cw,Y=Math.floor(i/cols)*(ch+18);const c=gl.domElement,s=Math.min(c.width/cw,c.height/ch),sw=cw*s,sh=ch*s;
    x.drawImage(c,(c.width-sw)/2,(c.height-sh)/2,sw,sh,X,Y+18,cw,ch);x.fillStyle='#f3dc94';x.font='12px monospace';x.fillText(names[i]+' • '+(M.d.mat||'energy')+' • '+M.tris+' tri',X+4,Y+13);}
  Object.assign(ST.orb,cam0);ST.cam=camK;M.view=v0;M.matK='';if(M.tc)M.tc.visible=true;M.grid.visible=true;mkMeshAll();
  return stShot(name||'mesh_all',C.toDataURL('image/jpeg',0.85));}
// แผ่นสรุปภาพทั้งหมด (หลายเฟรมต่อภาพ บนพื้นมืด + ตาราง) → shots/<ชื่อ>.jpg ให้ Claude เปิดดู
async function mkTexSheetAll(name,only){const names=(only||Object.keys(MK.list.tex)).slice().sort(),cell=150,cols=6,C=document.createElement('canvas');C.width=cell*cols;C.height=(cell+18)*names.length;const x=C.getContext('2d');x.fillStyle='#0a0e1a';x.fillRect(0,0,C.width,C.height);
  for(let r=0;r<names.length;r++){let d;try{d=await fxFetch('assets/fx/tex/'+names[r]+'.tex.json?t='+Date.now());}catch(e){continue;}const cv=txRender(d),o=txOpts(d),N=o.cols*o.rows,px=o.px;
    for(let k=0;k<cols;k++){const f=Math.min(N-1,Math.round(k*(N-1)/(cols-1))),X=k*cell,Y=r*(cell+18)+18;
      if(k===cols-1)for(let i=0;i<6;i++)for(let j=0;j<6;j++){x.fillStyle=(i+j)%2?'#454b5a':'#2a2e38';x.fillRect(X+i*25,Y+j*25,25,25);}
      x.globalCompositeOperation=o.add&&k<cols-1?'lighter':'source-over';x.drawImage(cv,(f%o.cols)*px,Math.floor(f/o.cols)*px,px,px,X,Y,cell,cell);x.globalCompositeOperation='source-over';}
    x.fillStyle='#f3dc94';x.font='12px monospace';x.fillText(names[r]+'  '+d.gen+' '+o.cols+'x'+o.rows+' '+(o.add?'เรือง':'ทึบ')+' • เฟรมเรียงซ้าย→ขวา • ช่องขวาสุด = บนพื้นตาราง',4,r*(cell+18)+13);}
  return stShot(name||'tex_all',C.toDataURL('image/jpeg',0.85));}
// =====================================================================
//  🔥 ไฟ 3D — จำลองไฟเป็นก้อน 3 มิติจริง (แทน Blender Mantaflow) → assets/fx/vol/<ชื่อ>.bin + .vol.json • เล่นด้วยชั้น vol
// =====================================================================
MK.v={name:'',d:null,saved:'',dirty:false,undo:[],redo:[],res:null,mesh:null,busy:false,stale:false,t:0};
const VX_PRE={
  column:{desc:'เสาไฟลุกวนต่อเนื่อง',mode:'column',res:24,frames:32,xfade:10,p:{shape:'ball',size:0.32}},
  wall:{desc:'แนวไฟยาว (กำแพงไฟ / ขอบไฟ)',mode:'column',res:28,frames:32,xfade:10,p:{shape:'line',size:0.16,cool:0.8}},
  ring:{desc:'วงไฟลุกเป็นวง',mode:'column',res:28,frames:32,xfade:10,p:{shape:'ring',size:0.26,cool:0.9}},
  bonfire:{desc:'กองไฟใหญ่ ปั่นป่วนมาก',mode:'column',res:28,frames:40,xfade:12,p:{shape:'disc',size:0.3,turb:1.4,vort:1.8}},
  burst:{desc:'ระเบิดไฟพุ่งครั้งเดียว',mode:'burst',res:28,frames:36,xfade:0,p:{shape:'ball',size:0.16,burst:2.2,emitT:0.12,cool:1,buoy:1.4}}};
function mkVolKey(){return 'vol/'+(MK.v.name||'_draft');}
async function mkVolShow(){const V=MK.v;if(!V.d){const first=Object.keys(MK.list.vol||{}).sort()[0];if(first)await mkVolOpen(first);else mkVolNew('my_fire3d','column');}else{mkVolAll();mkVolPreview();}}
function mkVolHide(){const V=MK.v;if(V.mesh){fxScene.remove(V.mesh);V.mesh=null;}}
async function mkVolOpen(n){try{const d=await fxFetch('assets/fx/vol/'+n+'.vol.json?t='+Date.now());const V=MK.v;Object.assign(V,{name:n,d,saved:JSON.stringify(d),dirty:false,undo:[],redo:[],res:null,stale:false});
    try{const b=await fetch('assets/fx/vol/'+n+'.bin?t='+Date.now());if(b.ok){V.res={data:new Uint8Array(await b.arrayBuffer()),nx:d.nx,ny:d.ny,nz:d.nz,frames:d.frames,ms:0};fxVolSet('vol/'+n,V.res.data,V.res);}else V.stale=true;}catch(e){V.stale=true;}
    mkVolAll();mkVolPreview();mkLibRender();return true;}catch(e){stToast('เปิดไฟ 3D ไม่ได้: '+n+' ('+e.message+')');return false;}}
function mkVolNew(name,pre,tpl){const d=tpl?JSON.parse(JSON.stringify(tpl)):Object.assign({v:1,seed:1},JSON.parse(JSON.stringify(VX_PRE[pre]||VX_PRE.column)));delete d.nx;delete d.ny;delete d.nz;
  Object.assign(MK.v,{name,d,saved:'',dirty:true,undo:[],redo:[],res:null,stale:true});mkVolAll();mkVolHide();mkLibRender();mkVolBake();}
function mkVolNewAsk(){const m=h('div',{className:'stModal'}),nm=h('input',{type:'text',value:'my_fire3d',style:'width:220px'});
  const ok=()=>{const n=nm.value.trim();if(!MKN.test(n)){stToast('ชื่อใช้ได้เฉพาะ a-z 0-9 _ -');return null;}m.remove();return n;};
  m.append(h('div',{className:'box'},h('h3',null,'ไฟ 3D ใหม่ — เลือกแบบเริ่มต้น'),h('label',null,'ชื่อไฟล์ ',nm),
    h('div',{className:'tpls'},...Object.entries(VX_PRE).map(([k,P])=>h('button',{on:{click:()=>{const n=ok();if(n)mkVolNew(n,k);}}},k,h('small',null,P.desc)))),
    h('div',null,h('button',{on:{click:()=>m.remove()}},'ยกเลิก'))));$st('st').append(m);nm.focus();nm.select();}
function mkVPush(){const V=MK.v;V.undo.push(JSON.stringify(V.d));if(V.undo.length>80)V.undo.shift();V.redo.length=0;}
function mkVUndo(r){const V=MK.v,A=r?V.redo:V.undo,B=r?V.undo:V.redo;if(!A.length)return;B.push(JSON.stringify(V.d));V.d=JSON.parse(A.pop());V.dirty=JSON.stringify(V.d)!==V.saved;V.stale=true;mkVolAll();}
const mkVSet=(o,k,v,ui)=>{if(v===undefined)delete o[k];else o[k]=v;const V=MK.v;V.dirty=JSON.stringify(V.d)!==V.saved;V.stale=true;mkSyncTitle();mkVolStat();if(ui)mkVolInsp();};
function mkVolAll(){mkVolBot();mkVolInsp();}
function mkVolStat(){const e=$st('mkVStat');if(!e)return;const V=MK.v;
  e.textContent=V.busy?'กำลังจำลอง… '+Math.round((V.prog||0)*100)+'%':V.res?(V.res.nx+'×'+V.res.ny+'×'+V.res.nz+' • '+V.res.frames+' เฟรม • '+(V.res.data.length/1048576).toFixed(2)+' MB'+(V.res.ms?' • '+(V.res.ms/1000).toFixed(1)+' วิ':'')+(V.stale?' • ⚠ ยังไม่จำลองค่าล่าสุด (กด ▶)':'')):'ยังไม่ได้จำลอง — กด ▶ จำลอง';
  e.className='mono '+(V.stale&&!V.busy?'bad':'good');}
async function mkVolBake(){const V=MK.v;if(V.busy)return V.res;V.busy=true;V.prog=0;mkVolStat();const b=$st('mkVRun');if(b)b.disabled=true;
  try{const r=await vxRun(V.d,p=>{V.prog=p;mkVolStat();});V.res=r;V.stale=false;fxVolSet(mkVolKey(),r.data,r);mkVolPreview();}
  catch(e){stToast('จำลองไม่ได้: '+e.message);}finally{V.busy=false;if(b)b.disabled=false;mkVolStat();}return V.res;}
// ดูผลในฉาก: กล่องสัดส่วนเดียวกับการจำลอง (กว้าง 1 : สูง 2) ที่จุดเล่น
function mkVolPreview(){const V=MK.v;mkVolHide();if(!V.res||MK.ws!=='vol')return;const SQ=fxVolReady(mkVolKey());if(!SQ)return;
  V.mesh=fireSeqVol(SQ,{hx:0.9,hz:0.9,h:3.6,int:1.15,den:1.2});V.t=0;fxScene.add(V.mesh);mkVolTick(0);}
function mkVolTick(rdt){const V=MK.v;if(!V.mesh)return;V.t+=rdt;const A=stAnchor();if(A){V.mesh.position.set(tx(A.x),GY(A.x,A.y),tz(A.y));}
  const u=V.mesh.userData.u,N=V.res.frames;if(V.d.mode==='burst'){const L=N/24+0.6,t=V.t%L;u.uFr.value=Math.min(N-1.001,t*24);u.uDis.value=t>N/24?1:Math.max(0,(t*24/N-0.8)/0.2)*0.6;}else{u.uFr.value=(V.t*24)%N;u.uDis.value=0;}u.uH.value=1;}
function mkVolBot(){const B=$st('mkBot');if(!B||MK.ws!=='vol')return;B.innerHTML='';const V=MK.v;
  B.append(h('div',{className:'bar'},h('span',{className:'file',id:'mkTitle'}),
    h('button',{className:'gold',title:'บันทึก .bin + .vol.json (Ctrl+S)',on:{click:()=>mkVolSave()}},'💾 บันทึก'),h('button',{on:{click:()=>mkVolSave(true)}},'บันทึกเป็น…'),h('button',{title:'ย้อน (Ctrl+Z)',on:{click:()=>mkVUndo(false)}},'↶'),h('button',{title:'ทำซ้ำ (Ctrl+Y)',on:{click:()=>mkVUndo(true)}},'↷'),
    h('span',{className:'sep'}),h('button',{id:'mkVRun',className:'gold',title:'จำลองใหม่ด้วยค่าปัจจุบัน (Enter) — ใช้เวลาไม่กี่วินาที',on:{click:mkVolBake}},'▶ จำลอง'),
    h('button',{title:'สุ่มลายใหม่แล้วจำลอง',on:{click:()=>{mkVPush();V.d.seed=((V.d.seed||1)%9999)+1;mkVSet(V.d,'seed',V.d.seed,true);mkVolBake();}}},'🎲 seed'),h('span',{id:'mkVStat',className:'mono'}),h('span',{className:'sep'}),
    h('button',{title:'เพิ่มชั้น vol ที่ใช้ไฟนี้ในเอฟเฟกต์ที่เปิดอยู่',on:{click:mkVolUseInFx}},'➕ ใส่ในเอฟเฟกต์'),h('button',{on:{click:mkHelp}},'?')),
    h('div',{id:'mkGens'},...Object.entries(VX_PRE).map(([k,P])=>h('button',{title:P.desc,on:{click:()=>{mkVPush();const D=JSON.parse(JSON.stringify(P));delete D.desc;Object.assign(V.d,D,{p:Object.assign({},D.p)});mkVSet(V.d,'mode',V.d.mode,true);mkVolBake();}}},h('b',null,k==='burst'?'💥':'🔥'),h('span',null,k),h('small',null,P.desc)))));
  mkSyncTitle();mkVolStat();}
function mkVolInsp(){const I=$st('mkInsp');if(!I||MK.ws!=='vol')return;I.innerHTML='';const V=MK.v,X=FXR.schema.vx,d=V.d,ctx={push:mkVPush,set:mkVSet};if(!d.p)d.p={};
  I.append(h('div',{className:'hd'},h('b',null,'🔥 '+(V.name||'(ใหม่)')),h('span',{className:'mute'},'ไฟ 3D · '+(d.mode||'column'))),h('p',{className:'mute',style:'margin:0;font-size:12px'},'จำลองไฟเป็นก้อน 3 มิติจริง (แบบ Blender Mantaflow) — ปรับค่าแล้วกด ▶ จำลอง • ดูในฉากได้ทันที'),
    mkLintBox(FXLINT.fxLintVol?FXLINT.fxLintVol(d,FXR.schema,{}):[]));
  for(const k of ['mode'])I.append(mkField(X.file[k],d,k,ctx));
  for(const k in X.params){if(k==='burst'||k==='emitT'){if(d.mode!=='burst')continue;}if(k==='warm'&&d.mode==='burst')continue;I.append(mkField(X.params[k],d.p,k,ctx));}
  const g=h('details',{open:true},h('summary',null,'ความละเอียด / เฟรม'));for(const k of ['res','frames',d.mode==='burst'?null:'xfade','seed','desc'])if(k)g.append(mkField(X.file[k],d,k,ctx));I.append(g);
  I.append(h('p',{className:'mute',style:'font-size:12px'},'ใช้ในเอฟเฟกต์: ชั้น vol → src: vol/'+(V.name||'<ชื่อ>')+' (กล่อง hx × h × hz เมตร) • ไฟล์ bake จาก Blender ก็ใช้ชั้นเดียวกันได้: src: fire_column • ความละเอียด 24 × 32 เฟรม ≈ 0.9 MB'));}
function mkVolPretty(){const d=MK.v.d,ks=Object.keys(d);return '{\n'+ks.map(k=>'  '+JSON.stringify(k)+': '+JSON.stringify(d[k])).join(',\n')+'\n}\n';}
async function mkVolSave(as,force){const V=MK.v;let name=typeof as==='string'?as:force||V.name;if(as===true){const n=prompt('ชื่อไฟ 3D (a-z 0-9 _ -)',name||'my_fire3d');if(!n)return false;name=n.trim();}
  if(!MKN.test(name||'')){stToast('ชื่อใช้ได้เฉพาะ a-z 0-9 _ - (ภาษาอังกฤษตัวเล็ก)');return false;}
  if(!V.res||V.stale){await mkVolBake();if(!V.res)return false;}
  const oldKey=mkVolKey();V.name=name;Object.assign(V.d,{nx:V.res.nx,ny:V.res.ny,nz:V.res.nz,frames:V.res.frames});const txt=mkVolPretty();
  try{await mkPost('assets/fx/vol/'+name+'.bin',V.res.data);const j=await mkPost('assets/fx/vol/'+name+'.vol.json',txt);V.saved=JSON.stringify(V.d);V.dirty=false;fxVolSet(mkVolKey(),V.res.data,V.res);if(oldKey!==mkVolKey())FXVOL.delete(oldKey);
    await mkRefresh();mkSyncTitle();stToast('บันทึกแล้ว → assets/fx/vol/'+name+'.bin + .vol.json\n'+(j.check||''),4000);return true;}
  catch(e){if(MK.api){stToast('บันทึกไม่ได้: '+e.message);return false;}}
  mkDownload(name+'.bin',new Blob([V.res.data]));mkDownload(name+'.vol.json',new Blob([txt],{type:'application/json'}));stToast('ดาวน์โหลดแล้ว — วางทั้ง 2 ไฟล์ไว้ที่ assets/fx/vol/',5000);return true;}
function mkVolUseInFx(){const V=MK.v;if(!V.name||V.dirty){stToast('บันทึกไฟ 3D ก่อน แล้วค่อยใส่ในเอฟเฟกต์');return;}const burst=V.d.mode==='burst',fr=(V.res&&V.res.frames)||V.d.frames||32;
  mkWs('fx').then(()=>{if(!ST.fx)return;stPush();const L={id:stUid('fire3d'),t:'vol',at:+Math.min(ST.t,stDur()).toFixed(2),life:burst?+(fr/24).toFixed(2):2.5,src:mkVolKey(),hx:0.9,hz:0.9,h:3.6,att:'ground'};
    if(burst){L.once=true;L.dis={'0':0,'0.8':0,'1':0.6};L.hgt=1;}ST.fx.layers.push(L);ST.sel=L.id;stChanged(true);stToast('เพิ่มชั้น '+L.id+' (ไฟ 3D '+V.name+') แล้ว');});}
// ---------- นำเข้าภาพเอง (PNG/JPG จากโปรแกรมวาดไหนก็ได้) ----------
function mkImgLoad(src){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error('โหลดภาพไม่ได้'));im.src=src;});}
function mkImgToCanvas(im,w,h){const c=document.createElement('canvas');c.width=w||im.width;c.height=h||im.height;c.getContext('2d').drawImage(im,0,0,c.width,c.height);return c;}
// ภาพต้นฉบับ (MK.t.src) → แผ่นที่ใช้บันทึก/แสดง (ค่าสีตรงจาก getImageData) • px = ความกว้างต่อเฟรม
function mkImgCv(){const T=MK.t,S=T.src;if(!S){const c=document.createElement('canvas');c.width=c.height=64;return c;}
  T.d.px=Math.max(1,Math.round(S.width/(T.d.cols||1)));const c=mkImgToCanvas(S);c._rgba=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return c;}
function mkTexImportAsk(){const inp=h('input',{type:'file',accept:'image/png,image/jpeg,image/webp,image/gif',multiple:true,style:'display:none',on:{change:e=>{mkTexImport(e.target.files);inp.remove();}}});document.body.append(inp);inp.click();}
async function mkTexImport(files){files=[...(files||[])].filter(f=>/^image\//.test(f.type));if(!files.length){stToast('เลือกไฟล์ภาพ PNG/JPG');return;}
  files.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));let ims;try{ims=await Promise.all(files.map(f=>mkImgLoad(URL.createObjectURL(f))));}catch(e){stToast(e.message);return;}
  let cv,cols=1,rows=1;const n=ims.length;
  if(n===1){const im=ims[0],sc=Math.min(1,2048/Math.max(im.width,im.height));cv=mkImgToCanvas(im,Math.round(im.width*sc),Math.round(im.height*sc));}
  else{cols=Math.ceil(Math.sqrt(n));rows=Math.ceil(n/cols);const S=Math.min(256,Math.floor(2048/Math.max(cols,rows)),Math.max(...ims.map(i=>Math.max(i.width,i.height))));
    cv=document.createElement('canvas');cv.width=S*cols;cv.height=S*rows;const x=cv.getContext('2d');
    ims.forEach((im,i)=>{const k=Math.min(S/im.width,S/im.height),w=im.width*k,hh=im.height*k;x.drawImage(im,(i%cols)*S+(S-w)/2,Math.floor(i/cols)*S+(S-hh)/2,w,hh);});}
  let name=files[0].name.replace(/\.[^.]+$/,'').toLowerCase().replace(/[^a-z0-9_\-]+/g,'_').replace(/^_+|_+$/g,'')||'my_image';if(MK.list.tex[name])name+='_2';
  MK.t.src=cv;mkTexNew(name,null,{v:1,desc:'ภาพที่นำเข้า: '+files[0].name+(n>1?' (+'+(n-1)+' ภาพ)':''),gen:'image',seed:1,px:Math.round(cv.width/cols),cols,rows,kind:'loop',fps:24,add:true,rand:false,p:{}});
  stToast('นำเข้าแล้ว '+cv.width+'×'+cv.height+(n>1?' • '+n+' เฟรม':' • ถ้าเป็น sprite sheet ให้ตั้ง cols × rows ทางขวา')+'\nกด 💾 บันทึก',5000);}
// ---------- ปุ่มลัด / ช่วยเหลือ ----------
function mkKey(e,typing){const c=e.ctrlKey||e.metaKey,M=MK.m,T=MK.t;
  if(c&&e.code==='KeyS'){e.preventDefault();MK.ws==='mesh'?mkMeshSave():MK.ws==='tex'?mkTexSave():mkVolSave();return;}
  if(typing)return;
  const U=MK.ws==='mesh'?mkMUndo:MK.ws==='tex'?mkTUndo:mkVUndo;
  if(c&&e.code==='KeyZ'){e.preventDefault();U(e.shiftKey);return;}
  if(c&&e.code==='KeyY'){e.preventDefault();U(true);return;}
  if(MK.ws==='vol'&&e.code==='Enter'){e.preventDefault();mkVolBake();return;}
  if(MK.ws==='mesh'){if(meKey(e))return;if(c&&e.code==='KeyD'&&M.sel){e.preventDefault();mkDupPart(M.sel);}else if(c)return;
    else if(e.code==='KeyG')mkGizmoMode('translate');else if(e.code==='KeyR')mkGizmoMode('rotate');else if(e.code==='KeyS')mkGizmoMode('scale');
    else if(e.code==='Delete'&&M.sel)mkDelPart(M.sel);else if(e.code==='Escape')mkSel(null);
    else if(e.code==='KeyH'&&M.sel){const P=M.d.parts.find(p=>p.id===M.sel);if(P){mkMPush();if(P.off)delete P.off;else P.off=true;mkMChanged(false);mkMeshBotRows();}}
    else if(e.code==='KeyW'){M.wireOn=!M.wireOn;if(M.wire)M.wire.visible=M.wireOn;mkMeshBot();}}
  else if(MK.ws==='tex'){if(e.code==='Space'){e.preventDefault();T.play=!T.play;mkTexBot();}else if(e.code==='Digit1')mkTexView('2d');else if(e.code==='Digit2')mkTexView('3d');}}
function mkHelp(){const m=h('div',{className:'stModal',on:{click:e=>{if(e.target===m)m.remove();}}});m.append(h('div',{className:'box',style:'max-width:680px'},h('h3',null,'วิธีใช้ — สร้าง asset ของเอฟเฟกต์'),h('p',{style:'margin:0 0 8px'},h('a',{href:'manual/index.html#'+(MK.ws==='mesh'?'mesh':MK.ws==='tex'?'tex':'vol'),target:'_blank',style:'color:var(--gold2);font-size:15px'},'📖 เปิดคู่มือแบบมีรูป (ภาษาไทย)')),
  h('div',{style:'display:grid;gap:6px;font-size:13px'},...[
    '🧊 โมเดล: ＋ ชิ้นส่วน = เลือกแบบ (หนามผลึก มงกุฎหนาม กลุ่มผลึก เม่น ใบฟัน ปีก เกลียว ท่อ ริบบิ้น โดม …) แล้วปรับแถบเลื่อนทางขวา — ไม่ต้องจับทีละจุดแบบ Blender',
    '✎ ปั้นเอง (แบบ Blender): ＋ ชิ้นส่วน → ลูกบาศก์ / แผ่น / ทรงกระบอก / ทรงกลม / กรวย → Tab เข้าโหมดแก้จุด • 1 จุด / 2 ขอบ / 3 หน้า • คลิกเลือก (Shift = หลายอัน, A = ทั้งหมด, B = ลากกรอบ, Alt+คลิกขอบ = เลือกวง) • Ctrl+R ตัดวง • ลากลูกศร G ย้าย / R หมุน / S ขนาด • E ดึงออก • I หดหน้าเข้า • F เติมหน้า • M รวมจุด • X ลบ • “ทำให้เนียน” = โค้งมน • “กระจก” = ปั้นครึ่งเดียว',
    'คลิกชิ้นบนจอ = เลือก • ลากลูกศร: G ย้าย / R หมุน / S ขนาด • ตัวแต่ง: เรียว บิด โค้ง ขรุขระ • ทำซ้ำเป็นวง/แถว • กระจกซ้าย-ขวา • Delete ลบ • Ctrl+D ทำซ้ำ • H ซ่อน • W โครงลวด',
    'ดู: ดินปั้น (เห็นรูปทรงชัด) / วัสดุจริง (ไฟ น้ำแข็ง พลังงาน ตามธาตุ) • ➕ ใส่ในเอฟเฟกต์ = เพิ่มชั้น mesh ที่ใช้โมเดลนี้ • ⬇ .glb = ส่งออกไปเปิดใน Blender',
    '🎞 ภาพ: เลือกตัววาดด้านล่าง (ไฟ ควัน ระเบิด สายฟ้า วังวน คลื่นกระแทก ประกาย รอยฟัน ดาว วงเวท ลายนอยส์ จำลองของไหลจริง) → ปรับค่า → เลือกจานสี',
    'loop = ภาพวนต่อกันไม่มีรอยต่อ • ตามอายุ = เล่นครั้งเดียวตามอายุของเม็ด • 🧪 ลองใน 3D = ดูเป็นเม็ดอนุภาค + การ์ดภาพในฉากจริง • 🎲 = สุ่มลายใหม่',
    'บันทึก = .png + .tex.json ใน assets/fx/tex/ • ใช้ในเอฟเฟกต์: emit fb "tex/<ชื่อ>" หรือการ์ดภาพ (➕ ปุ่มด้านล่าง) • ภาพมีสีในตัว: ใส่ col #ffffff • 📥 นำเข้าภาพที่วาดเอง (หรือลากไฟล์มาวาง)',
    '🔥 ไฟ 3D: เลือกแบบ (เสาไฟ แนวไฟ วงไฟ กองไฟ ระเบิด) → ปรับค่า → ▶ จำลอง (ไม่กี่วินาที) → 💾 • ใช้ในเอฟเฟกต์: ชั้น vol src "vol/<ชื่อ>" (ไฟล์ bake จาก Blender ก็ใช้ได้: fire_column)',
    'ในเอฟเฟกต์: mesh mat "tex" = ภาพไหลบนโมเดล • mesh grow = โมเดลงอกทีละชิ้น • emit look "model" = เศษโมเดลกระเด็น/เด้งพื้น • ชั้น warp = อากาศบิดเบี้ยว (ไอร้อน / คลื่นกระแทก)'].map(t=>h('p',{style:'margin:0'},'• '+t))),h('button',{on:{click:()=>m.remove()}},'ปิด')));$st('st').append(m);}
// ---------- API สำหรับ Claude / console ----------
Object.assign(window.STUDIO,{vol:{open:n=>mkVolOpen(n),data:()=>MK.v.d,name:()=>MK.v.name,newFrom:(n,pre)=>mkVolNew(n,pre),bake:()=>mkVolBake(),save:n=>mkVolSave(n||false),
    set(path,v){const ks=path.split('.');let o=MK.v.d;for(let i=0;i<ks.length-1;i++)o=o[ks[i]]=o[ks[i]]||{};mkVPush();mkVSet(o,ks[ks.length-1],v,true);return true;},shot:n=>stShot(n||('vol_'+(MK.v.name||'draft'))),res:()=>MK.v.res&&{nx:MK.v.res.nx,ny:MK.v.res.ny,nz:MK.v.res.nz,frames:MK.v.res.frames,bytes:MK.v.res.data.length,ms:MK.v.res.ms}},
  ws:w=>mkWs(w),mk:MK,tick:(n,dt)=>{for(let i=0;i<(n||1);i++)mkFrame(dt||1/60);},
  mesh:{edit:on=>meToggle(on),prim:k=>meAddPrim(k),esel:(m,s)=>{ME.mode=m;ME.sel=s;meAfterSel();mkMeshBot();},op:o=>meOp(o),cut:k=>meCut(k),loop:(k,add)=>meLoopSel(k,add),box:(x0,y0,x1,y1,m)=>meBoxSel(x0,y0,x1,y1,m||'set'),get me(){return ME;},open:n=>mkMeshOpen(n),data:()=>MK.m.d,name:()=>MK.m.name,newFrom:(n,tpl)=>mkMeshNew(n,tpl||null),
    set(path,v){const [id,...ks]=path.split('.');const o0=id==='file'?MK.m.d:MK.m.d.parts.find(p=>p.id===id);if(!o0)return false;let o=o0;for(let i=0;i<ks.length-1;i++)o=o[ks[i]];mkMPush();o[ks[ks.length-1]]=v;mkMChanged(true);return true;},
    add:k=>(mkAddPart(k),MK.m.sel),select:id=>mkSel(id),del:id=>mkDelPart(id),save:n=>mkMeshSave(false,n),view:v=>{MK.m.view=v;MK.m.matK='';mkMeshMat();},shot:n=>stShot(n||('mesh_'+(MK.m.name||'draft'))),sheetAll:(n,only)=>mkMeshSheetAll(n,only),tris:()=>MK.m.tris,lint:()=>FXLINT.fxLintMesh(MK.m.d,FXR.schema)},
  tex:{open:n=>mkTexOpen(n),data:()=>MK.t.d,name:()=>MK.t.name,newFrom:(n,gen,tpl)=>mkTexNew(n,gen,tpl||null),gen:g=>mkTexGen(g),
    set(path,v){const ks=path.split('.');let o=MK.t.d;for(let i=0;i<ks.length-1;i++)o=o[ks[i]]=o[ks[i]]||{};mkTPush();o[ks[ks.length-1]]=v;mkTChanged(true);return true;},
    render:()=>(mkTexRenderNow(),{ms:MK.t.ms,w:MK.t.cv&&MK.t.cv.width,h:MK.t.cv&&MK.t.cv.height}),save:n=>mkTexSave(n||false),bake:async n=>{if(n)await mkTexOpen(n);return mkTexSave(MK.t.name);},sheet:n=>mkTexSheet(n),sheetAll:(n,only)=>mkTexSheetAll(n,only),import:files=>mkTexImport(files),view:v=>mkTexView(v),lint:()=>FXLINT.fxLintTex(MK.t.d,FXR.schema,{})}});
