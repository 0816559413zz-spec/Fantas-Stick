// =====================================================================
//  VFX Studio runtime — เล่นเอฟเฟกต์จากไฟล์ข้อมูล assets/fx/<กลุ่ม>/<ชื่อ>.fx.json (แผน designs/vfx-studio.md, รูปแบบ FX-FORMAT.md)
//  ไฟล์ = รายการ "ชั้น" บนเส้นเวลา • สร้างภาพด้วยของที่เกมมีอยู่แล้ว (PARTS, fireMat, fireVol, iceShaderMat, tbolt, trail, ring, light, screen)
//  ค่าเริ่ม/ช่วง/ป้ายชื่อทุกฟิลด์อยู่ที่ assets/fx/schema.json ที่เดียว • ผูกกับ event ของเกมด้วย assets/fx/bind.json (ไม่ต้องแก้โค้ดสกิล)
//  ฝั่ง client ล้วน — ไม่เปลี่ยนโปรโตคอล • ไฟล์ยังโหลดไม่เสร็จ = เกมใช้ภาพจากโค้ดเดิม
//  ใช้: fxPlay('fire/dfboom',{x,y,h,a,s,pal,col,p:{r:6},follow:id,own}) → handle • fxStop(handle) • fxStart(dataObject,o) (สตูดิโอ)
//  โหลดท้ายสุด: ตอนโหลดไฟล์ทำแค่ fetch ไฟล์ข้อมูล (ไม่แตะ scene)
// =====================================================================
const FXR={ready:false,on:true,schema:null,def:{},bind:{},over:{},index:{fx:{}},db:new Map(),inst:[],n:0,tpl:true,nocache:false,stat:{play:0,miss:0}};
const FXDEG=Math.PI/180;
// ---------- โหลด ----------
function fxFetch(path){return fetch(path,FXR.nocache?{cache:'no-cache'}:{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(path+' '+r.status);return r.json();});}
function fxDefaults(S){const D={},com={};for(const k in S.common)com[k]=S.common[k].def;for(const t in S.types){D[t]=Object.assign({},com);for(const k in S.types[t].fields)D[t][k]=S.types[t].fields[k].def;}return D;}
function fxBoot(){
  Promise.all([fxFetch('assets/fx/schema.json'),fxFetch('assets/fx/bind.json').catch(()=>({})),fxFetch('assets/fx/index.json').catch(()=>({fx:{}}))]).then(([s,b,i])=>{
    FXR.schema=s;FXR.def=fxDefaults(s);FXR.bind=b||{};FXR.index=i||{fx:{}};FXR.ready=true;fxOverrides();
    // โหลดล่วงหน้า: ทุกเอฟเฟกต์ที่ผูกกับ event + แม่แบบ (playFx)
    const need=new Set();for(const k in FXR.bind)for(const e of [].concat(FXR.bind[k]))if(e&&e.fx)need.add(e.fx);
    for(const k in FXR.over)for(const e of [].concat(FXR.over[k]))if(e&&e.fx)need.add(e.fx);
    for(const n in FXR.index.fx)if(n.startsWith('tpl/')||n.startsWith('sig/'))need.add(n);
    need.forEach(n=>fxLoad(n));
  }).catch(e=>console.warn('fx runtime: โหลด schema ไม่ได้ — ใช้ภาพจากโค้ดเดิม',e));}
// ผูกชั่วคราวเพื่อทดลอง (ปุ่ม "ลองในเกม" ของสตูดิโอ): URL ?fxbind=efx:dfboom=fire/dfboom:replace,... หรือ localStorage wd_fxbind (JSON แบบ bind.json)
function fxOverrides(){FXR.over={};
  try{const q=new URLSearchParams(location.search).get('fxbind');if(q)for(const part of q.split(',')){const m=part.match(/^([^=]+)=([^:]+)(?::(add|replace))?$/);if(m)FXR.over[m[1]]={fx:m[2],mode:m[3]||'replace'};}}catch(e){}
  try{const j=JSON.parse(localStorage.getItem('wd_fxbind')||'null');if(j&&typeof j==='object')Object.assign(FXR.over,j);}catch(e){}}
function fxLoad(name){let e=FXR.db.get(name);if(e)return e.p;
  const v=(FXR.index.fx[name]||{}).v||'';e={data:null,fail:false};FXR.db.set(name,e);
  e.p=fxFetch('assets/fx/'+name+'.fx.json'+(v?'?v='+v:'')).then(d=>{e.data=d;return d;}).catch(err=>{e.fail=true;console.warn('fx: โหลดไม่ได้',name,err.message);return null;});
  return e.p;}
function fxData(name){const e=FXR.db.get(name);if(!e){fxLoad(name);return null;}return e.data;}
// ---------- ค่า: ตัวเลข / สูตร / ช่วงสุ่ม / เส้นโค้ง / สี ----------
const _fxExpr=new Map();
function fxExpr(src){let f=_fxExpr.get(src);if(f)return f;
  if(!/^[\w\s.+\-*/(),]*$/.test(src)){console.warn('fx: สูตรมีตัวอักษรที่ไม่อนุญาต',src);f=()=>0;}
  else{try{f=new Function('P','const {min,max,abs,sqrt,floor,round,sin,cos,PI}=Math;with(P){return ('+src+');}');}catch(e){console.warn('fx: สูตรผิด',src);f=()=>0;}}
  _fxExpr.set(src,f);return f;}
function fxEval(src,I){try{const v=fxExpr(src)(I.P);return typeof v==='number'&&isFinite(v)?v:0;}catch(e){return 0;}}
// v: ค่าจากไฟล์ • k: อายุชั้น 0..1 (สำหรับเส้นโค้ง)
function fxV(v,I,k){
  if(typeof v==='number')return v;
  if(typeof v==='string')return v[0]==='#'||v[0]==='$'?v:fxEval(v,I);
  if(typeof v==='boolean')return v;
  if(Array.isArray(v)){if(v.length===2&&typeof v[0]!=='object'&&!Array.isArray(v[0])){const a=fxV(v[0],I,k),b=fxV(v[1],I,k);return a+(b-a)*Math.random();}return v.map(q=>fxV(q,I,k));}
  if(v&&typeof v==='object')return fxCurve(v,k||0,I);
  return v;}
function fxIsCurve(v){return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).some(x=>!isNaN(+x));}
function fxCurve(c,k,I){const E=Object.keys(c).filter(q=>q.trim()!==''&&!isNaN(+q)).map(q=>[+q,c[q]]).sort((x,y)=>x[0]-y[0]);if(!E.length)return 0;
  const val=r=>Array.isArray(r)?r.map(z=>fxV(z,I,k)):fxV(r,I,k);let out;
  if(k<=E[0][0])out=val(E[0][1]);else if(k>=E[E.length-1][0])out=val(E[E.length-1][1]);
  else{let i=0;while(i<E.length-2&&k>E[i+1][0])i++;let t=(k-E[i][0])/((E[i+1][0]-E[i][0])||1);const e=c.ease;
    t=e==='in'?t*t:e==='out'?1-(1-t)*(1-t):e==='inout'?t*t*(3-2*t):e==='step'?0:t;
    const a=val(E[i][1]),b=val(E[i+1][1]);out=Array.isArray(a)?a.map((q,j)=>q+((Array.isArray(b)?b[j]:b)-q)*t):a+((Array.isArray(b)?b[0]:b)-a)*t;}
  if(c.x!==undefined){const m=fxV(c.x,I,k);out=Array.isArray(out)?out.map((q,j)=>q*(Array.isArray(m)?m[j]:m)):out*(Array.isArray(m)?m[0]:m);}
  return out;}
function fxG(L,k){return L[k]!==undefined?L[k]:(FXR.def[L.t]||{})[k];}
function fxCol(c,I){if(typeof c!=='string')return '#ffffff';if(c[0]==='$')return I.pal[c.slice(1)]||I.pal.main||'#ffffff';return c;}
function fxPal(name,col){if(col&&(name==='col'||!name))return palOf('col',col);return VFXPAL[name]||palOf('col',col||'#ffffff');}
// ---------- ตำแหน่ง: กรอบของเอฟเฟกต์ (+x ขวา, +y ขึ้น, +z ทิศเล็ง) → พิกัดแผนที่ ----------
const _fxw=new THREE.Vector3();
function fxAnchor(I){const o=I.o;if(o.follow==null)return;const P=PM3.get(o.follow);if(!P)return;const q=simOf(P.g.position);I.x=q.x;I.y=q.y;I.fz=Math.max(0,q.h-GY(q.x,q.y));
  if(o.aim!==false){const v=VIEW.cur&&VIEW.cur.P.find(p=>p.id===o.follow);if(v&&v.a!==undefined)I.a=v.a;}
  if(P.tip){P.tip.getWorldPosition(_fxw);const t=simOf(_fxw);I.wand=[t.x,t.y,Math.max(0,t.h-GY(t.x,t.y))];}}
function fxBase(I,att){switch(att){case 'ground':return [I.x,I.y,I.o.gh!==undefined?I.o.gh:0];case 'feet':return [I.x,I.y,I.fz];case 'chest':return [I.x,I.y,I.fz+1.2];case 'head':return [I.x,I.y,I.fz+1.9];
  case 'wand':return I.wand?I.wand.slice():[I.x,I.y,I.fz+1.3];default:return [I.x,I.y,I.h];}}
// local [x,y,z] เมตร → [simX, simY, h]
function fxLocal(I,b,p){const c=Math.cos(I.a),s=Math.sin(I.a);return [b[0]+(c*p[2]-s*p[0])*20,b[1]+(s*p[2]+c*p[0])*20,b[2]+p[1]];}
function fxDir(I,d){const c=Math.cos(I.a),s=Math.sin(I.a);return [(c*d[2]-s*d[0])*20,(s*d[2]+c*d[0])*20,d[1]];}
function fxYawV(v,yw){if(!yw)return v;const c=Math.cos(yw),s=Math.sin(yw);return [v[0]*c+v[2]*s,v[1],-v[0]*s+v[2]*c];}
function fxPos(I,S,k){const L=S.d,p=fxV(fxG(L,'pos'),I,k)||[0,0,0],sc=I.s;return fxLocal(I,fxBase(I,fxG(L,'att')),[p[0]*sc,p[1]*sc,p[2]*sc]);}
function fxPlace(obj,I,S,w,yaw){obj.position.set(tx(w[0]),w[2]+GY(w[0],w[1]),tz(w[1]));const a=I.a+(yaw||0);obj.rotation.order='YXZ';obj.rotation.y=Math.atan2(Math.cos(a),Math.sin(a));}
// ---------- เล่น / หยุด ----------
function fxPlay(name,o){if(!FXR.ready||!FXR.on)return null;const d=fxData(name);if(!d){FXR.stat.miss++;return null;}return fxStart(d,o,name);}
function fxStart(F,o,name){o=o||{};if(!FXR.ready||!F||!Array.isArray(F.layers))return null;if(o.x===undefined||o.y===undefined||isNaN(o.x))return null;
  const palName=o.pal||F.pal||'arcane',I={F,o,name:name||F.name||'',id:++FXR.n,t:0,x:o.x,y:o.y,h:o.h||0,a:o.a||0,fz:0,wand:null,s:(o.s||1),k:(F.k||1),cnt:o.n||1,
    palName,pal:fxPal(palName,o.col),stop:false,stopT:0,kids:[],own:!!o.own,L:[]};
  I.P=Object.assign({s:I.s,k:I.k},o.ev?{ev:o.ev}:{});for(const pk in (F.params||{}))I.P[pk]=F.params[pk].def!==undefined?F.params[pk].def:0;
  if(o.p)for(const pk in o.p){const v=o.p[pk];I.P[pk]=typeof v==='string'?fxEval(v,I):v;}
  if(o.follow!=null)fxAnchor(I);
  if(o.follow==null)I.fz=0;
  for(const d of F.layers)if(d&&d.t&&FXR.def[d.t]&&!d.mute)I.L.push({d,st:0,obj:null});
  FXR.inst.push(I);FXR.stat.play++;return I;}
function fxStop(I){if(!I||I.stop)return;I.stop=true;I.stopT=I.t;for(const c of I.kids)fxStop(c);}
function fxKill(I){if(!I)return;for(const S of I.L)if(S.st===1)fxEnd(S,I,true);I.L.length=0;for(const c of I.kids)fxKill(c);const j=FXR.inst.indexOf(I);if(j>=0)FXR.inst.splice(j,1);}
function fxClearAll(){for(const I of FXR.inst.slice())fxKill(I);FXR.inst.length=0;}
// เช็กประตู (ชั้นเสริม / ระยะ / ของเรา) ตอนเริ่มชั้น
function fxGate(L,I,w){if(fxG(L,'x')&&(!vfxExtra()||I.far))return false;if(fxG(L,'own')&&!I.own)return false;
  const nr=fxG(L,'near');if(nr>0&&cam.position.distanceTo(_fxw.set(tx(w[0]),w[2]+GY(w[0],w[1]),tz(w[1])))>nr)return false;return true;}
// ---------- ทุกเฟรม ----------
function updateFx(dt){if(!FXR.inst.length)return;
  for(let i=FXR.inst.length-1;i>=0;i--){const I=FXR.inst[i];I.t+=dt;if(I.o.follow!=null)fxAnchor(I);
    I.far=cam.position.distanceTo(_fxw.set(tx(I.x),I.h+GY(I.x,I.y),tz(I.y)))>60;
    let alive=false;
    for(const S of I.L){const L=S.d;if(S.st===2)continue;
      const at=fxV(fxG(L,'at'),I,0),life=Math.max(0.02,fxV(fxG(L,'life'),I,0)),endL=fxG(L,'end'),loop=fxG(L,'loop');
      if(endL&&!I.stop){alive=true;continue;}
      const lt=(endL?I.t-I.stopT:I.t)-at;
      if(S.st===0){if(lt<0){alive=true;continue;}if(I.stop&&!endL){S.st=2;continue;}
        const w=fxPos(I,S,0);if(!fxGate(L,I,w)){S.st=2;continue;}S.st=1;S.life=life;S.age=0;S.dt=dt;try{fxSpawn(S,I,w);}catch(e){console.error('fx spawn',L.id,e);S.st=2;continue;}}
      if(S.st===1){S.age+=dt;const done=loop?(I.stop&&!endL):S.age>=life;
        if(done){fxEnd(S,I,false);S.st=2;continue;}
        const k=loop?(S.age%life)/life:Math.min(1,S.age/life);
        try{fxTick(S,I,k,dt);}catch(e){console.error('fx tick',L.id,e);fxEnd(S,I,true);S.st=2;continue;}alive=true;}}
    I.kids=I.kids.filter(c=>FXR.inst.includes(c));if(I.kids.length)alive=true;
    if(!alive){FXR.inst.splice(i,1);}}}
// ---------- สร้างชั้น ----------
function fxN(I,n){return Math.max(0,Math.round(n*I.cnt*I.k*Math.min(2,I.s)*(I.far?0.5:1)));}
function fxSpawn(S,I,w){const L=S.d,g=k=>fxG(L,k),V=(k,q)=>fxV(g(k),I,q||0),C=k=>fxCol(g(k),I);
  switch(L.t){
    case 'flash':case 'halo':vfxOnce(()=>FX.flashSprite(w[0],w[1],w[2],C('col'),V('size0')*I.s,V('size')*Math.min(1.5,I.s),S.life,g('k')*Math.min(1.3,I.k)));S.oneshot=1;break;
    case 'ring':SHAPES_Q.push({k:g('vert')?'ringv':'ring',x:w[0],y:w[1],h:w[2],col:C('col'),s1:V('r')*I.s,life:S.life,op:Math.min(1,g('op')*I.k)});S.oneshot=1;break;
    case 'light':if(!fxIsCurve(g('int'))&&!g('loop')){FX.flashLight(w[0],w[1],w[2],C('col'),V('int')*I.k,V('dist')*Math.sqrt(I.s),S.life);S.oneshot=1;}break;
    case 'screen':{const nm=g('near')||35;if(!nearMe(w[0],w[1],nm*20))break;const sk=V('shake');if(sk>0)shake(sk*Math.min(1.5,I.s));const fl=V('flash');if(fl>0)screenFlash(C('fcol'),fl,S.life);
      const rd=V('radial');if(rd>0)screenRadial(w[0],w[1],w[2],rd,S.life);const kk=V('kick');if(kk>0)screenKick(kk*Math.min(1.5,I.s));const hu=V('hurt');if(hu>0)screenHurt(hu);S.oneshot=1;break;}
    case 'sound':if(nearMe(w[0],w[1],1000))snd(g('name'),{x:w[0],y:w[1],vol:g('vol')});S.oneshot=1;break;
    case 'emit':S.acc=0;{const n=fxN(I,V('burst'));if(n>0)vfxOnce(()=>fxEmit(S,I,n,w,0));}break;
    case 'mesh':fxMeshMake(S,I,w);break;
    case 'firevol':{const kd={wall:0,shell:1,pillar:2}[g('kind')]||0,m=fireVol([{c:[0,0,0],ax:[1,0],hx:V('hx')*I.s,h:V('h')*I.s,hz:V('hz')*I.s,md:kd}],{int:V('int'),den:g('den'),spd:g('spd')});
      fxPlace(m,I,S,w,V('yaw')*FXDEG);fxScene.add(m);S.obj=m;break;}
    case 'trail':S.obj=trailNew({col:C('col'),col2:C('col2'),w:g('w')*I.s,life:g('tlife'),k:g('k')*I.k,sweep:!!g('sweep')});break;
    case 'bolt':fxBolt(S,I,w);S.acc=0;break;
    case 'decal':{const r=V('r')*I.s,kd=g('kind');
      if(kd==='scorch')scorch(w[0],w[1],w[2],r*20,S.life);else if(kd==='rune')fireRune(w[0],w[1],w[2],r*20,S.life);
      else if(kd==='crack')fireCrackWeb(w[0],w[1],w[2],r*20,S.life,{n:g('n'),burn:g('burn'),burnT:g('burn')?Math.min(S.life,g('burn')+0.9):0});
      else if(kd==='icecrack')dfCracks(w[0],w[1],w[2]+0.04,r*20,C('col'),S.life);
      else SHAPES_Q.push({k:kd==='glyph'?'rune':'decal',x:w[0],y:w[1],h:kd==='glyph'?w[2]+0.05:undefined,col:kd==='glyph'?C('col'):'#000000',s1:r,life:S.life,op:g('op')});
      S.oneshot=1;break;}
    case 'debris':{const n=fxN(I,V('n'));if(g('kind')==='ice')iceChips(w[0],w[1],w[2],n,V('speed')*20*I.s,4);else rockChunks(w[0],w[1],w[2],n,V('speed')*Math.sqrt(I.s),{r:V('r')*20*I.s,s:g('size')*Math.sqrt(I.s),life:g('dlife')});S.oneshot=1;break;}
    case 'mist':glacierMist(w[0],w[1],V('r')*20*I.s,fxN(I,g('n')),{h:w[2],out:g('out')*I.s});S.oneshot=1;break;
    case 'crown':iceBurst(w[0],w[1],V('r')*I.s,{life:S.life,hy:g('hy'),h:w[2],mist:g('mist')||undefined});S.oneshot=1;break;
    case 'geyser':fireGeyser(w[0],w[1],w[2],V('hgt')*I.s,V('w')*I.s,S.life,0);S.oneshot=1;break;
    case 'use':{const nm=g('fx');if(!nm)break;const p={};const P=g('p')||{};for(const q in P)p[q]=typeof P[q]==='string'?fxEval(P[q],I):P[q];
      if((I.o.depth||0)>=4){console.warn('fx: ใส่เอฟเฟกต์ซ้อนลึกเกิน 4 ชั้น (วนเรียกตัวเอง?)',nm);break;}
      const c=fxPlay(nm,{x:w[0],y:w[1],h:w[2],a:I.a+V('yaw')*FXDEG,s:I.s*V('s'),pal:g('pal')||I.palName,col:I.o.col,p,own:I.own,n:I.cnt,depth:(I.o.depth||0)+1});if(c){I.kids.push(c);S.kid=c;}S.oneshot=!c;break;}
    case 'code':{const f=FXCODE[g('fn')];if(f)f(w[0],w[1],w[2],g('args')||{},I,S);else console.warn('fx: ไม่มีฟังก์ชัน',g('fn'));S.oneshot=1;break;}
  }}
// ชั้นแบบยิงครั้งเดียว (helper ของเกมจัดการอายุเอง) — ถือว่ามีชีวิตจนครบ life เพื่อให้ไทม์ไลน์/ตัวนับตรง
function fxTick(S,I,k,dt){const L=S.d;if(S.oneshot)return;const g=q=>fxG(L,q),V=(q)=>fxV(g(q),I,k);
  switch(L.t){
    case 'light':{const w=fxPos(I,S,k);LREQ.push({x:tx(w[0]),y:w[2],z:tz(w[1]),col:fxCol(g('col'),I),int:V('int')*I.k,dist:V('dist')*Math.sqrt(I.s)});break;}
    case 'emit':{const rate=V('rate');if(rate>0){S.acc+=rate*dt*I.cnt*I.k*(I.far?0.5:1);const n=Math.floor(S.acc);if(n>0){S.acc-=n;const w=fxPos(I,S,k),kq=VFXB.k;VFXB.k=VFXB.on?VFXB.mul:1;try{fxEmit(S,I,n,w,k);}finally{VFXB.k=kq;}}}break;}
    case 'mesh':fxMeshTick(S,I,k,dt);break;
    case 'firevol':{const u=S.obj.userData.u,w=fxPos(I,S,k);fxPlace(S.obj,I,S,w,fxV(g('yaw'),I,k)*FXDEG);u.uH.value=Math.max(0.01,fxV(g('hgt'),I,k));u.uDis.value=fxV(g('dis'),I,k);u.uInt.value=fxV(g('int'),I,k)*I.k;break;}
    case 'trail':fxTrailTick(S,I,k);break;
    case 'bolt':{const r=g('rate');if(r>0){S.acc+=r*dt;while(S.acc>=1){S.acc-=1;fxBolt(S,I,fxPos(I,S,k));}}break;}
  }}
function fxEnd(S,I,kill){const L=S.d;
  if(L.t==='mesh'&&S.obj){(S.obj.parent||scene).remove(S.obj);if(S.mats)S.mats.forEach(m=>m.dispose());if(S.geo&&!S.geo.userData.keep)S.geo.dispose();S.obj=null;}
  else if(L.t==='firevol'&&S.obj){fxScene.remove(S.obj);S.obj.geometry.dispose();S.obj.material.dispose();S.obj=null;}
  else if(L.t==='trail'&&S.obj){trailStop(S.obj);S.obj=null;}
  if(kill&&S.kid)fxKill(S.kid);}
// ---------- อนุภาค ----------
const _fxrnd=(a,b)=>a+(b-a)*Math.random();
function fxUnit(){const z=_fxrnd(-1,1),t=_fxrnd(0,6.283),r=Math.sqrt(1-z*z);return [r*Math.cos(t),z,r*Math.sin(t)];}
function fxCone(axis,sp){// ทิศสุ่มในกรวยรอบแกน
  const u=fxUnit();const d=[axis[0]+u[0]*Math.sin(sp),axis[1]+u[1]*Math.sin(sp),axis[2]+u[2]*Math.sin(sp)],l=Math.hypot(...d)||1;return [d[0]/l,d[1]/l,d[2]/l];}
function fxEmit(S,I,n,w,k){const L=S.d,g=q=>fxG(L,q),V=q=>fxV(g(q),I,k);
  const from=g('from'),dir=g('dir'),fr=V('fr')*I.s,fh=V('fh')*I.s,sp=g('spread'),look=g('look'),yw=fxV(g('yaw'),I,k)*FXDEG,col=fxCol(g('col'),I),c2=fxCol(g('c2'),I);
  let src=null;if(from==='mesh'){const T=I.L.find(q=>q.d.id===g('of'));if(T&&T.inner){T.inner.traverse(q=>{if(!src&&q.isMesh)src=q;});if(src)src.updateWorldMatrix(true,false);}}
  for(let i=0;i<n;i++){let p,nr;
    switch(from){
      case 'sphere':nr=fxUnit();p=nr.map(q=>q*fr);break;
      case 'hemisphere':nr=fxUnit();nr[1]=Math.abs(nr[1]);p=nr.map(q=>q*fr);break;
      case 'ring':{const t=_fxrnd(0,6.283);nr=[Math.cos(t),0,Math.sin(t)];p=[nr[0]*fr,0,nr[2]*fr];break;}
      case 'disc':{const t=_fxrnd(0,6.283),r=fr*Math.sqrt(Math.random());nr=[Math.cos(t),0,Math.sin(t)];p=[nr[0]*r,0,nr[2]*r];break;}
      case 'cone':{nr=fxCone([0,1,0],sp);const r=Math.random()*fh;p=nr.map(q=>q*r);break;}
      case 'box':p=[_fxrnd(-fr,fr),_fxrnd(0,fh),_fxrnd(-fr,fr)];{const l=Math.hypot(p[0],p[2])||1;nr=[p[0]/l,0.3,p[2]/l];}break;
      case 'line':p=[0,0,Math.random()*fh];{const t=_fxrnd(0,6.283);nr=[Math.cos(t),Math.sin(t),0];}break;
      case 'mesh':if(src){const pa=src.geometry&&src.geometry.attributes.position;if(pa){const j=(Math.random()*pa.count)|0;_fxw.fromBufferAttribute(pa,j).applyMatrix4(src.matrixWorld);const q=simOf(_fxw);const ww=[q.x,q.y,q.h-GY(q.x,q.y)];nr=fxUnit();
          fxPart(S,I,ww,[0,0,0],nr,dir,sp,look,col,c2,k,true);continue;}}
        nr=fxUnit();p=[0,0,0];break;
      default:nr=fxUnit();p=[0,0,0];}
    fxPart(S,I,w,fxYawV(p,yw),fxYawV(nr,yw),dir,sp,look,col,c2,k,false,yw);}}
function fxPart(S,I,w,p,nr,dir,sp,look,col,c2,k,world,yw){const L=S.d,g=q=>fxG(L,q),V=q=>fxV(g(q),I,k);
  let d;switch(dir){case 'flat':{const t=_fxrnd(0,6.283);d=[Math.cos(t),0,Math.sin(t)];break;}case 'up':d=fxCone([0,1,0],sp);break;case 'down':d=fxCone([0,-1,0],sp);break;
    case 'in':d=nr.map(q=>-q);break;case 'aim':d=fxYawV(fxCone([0,0,1],sp),yw||0);break;case 'tangent':{const l=Math.hypot(nr[0],nr[2])||1;d=[-nr[2]/l,0,nr[0]/l];break;}
    case 'random':d=fxUnit();break;default:d=nr;}
  const spd=V('speed')*I.s,up=V('up'),life=Math.max(0.05,V('plife'));
  if(dir==='in'){const r=Math.max(0.3,spd*life*0.7);p=[p[0]+nr[0]*r,p[1]+nr[1]*r,p[2]+nr[2]*r];}
  const pos=world?w:fxLocal(I,w,p),v=fxDir(I,[d[0]*spd,d[1]*spd+up,d[2]*spd]),size=V('size')*Math.sqrt(I.s);
  const q={x:pos[0],y:pos[1],h:pos[2],vx:v[0],vy:v[1],vh:v[2],life,max:life,col,c2:c2!==col?c2:undefined,size,g:g('gravity'),drag:g('drag'),grow:g('grow'),rot:_fxrnd(0,6.283),vr:g('spin')?_fxrnd(-g('spin'),g('spin')):0,fin:g('fin')||undefined,nc:!g('curl')};
  switch(look){case 'spark':q.sh=1;break;case 'streak':q.sh=2;break;case 'ring':q.sh=3;break;case 'flake':q.sh=4;break;
    case 'smoke':q.smoke=true;delete q.fin;if(g('fb'))q.fb=g('fb');break;
    case 'fire':flame(q.x,q.y,q.h,{vx:q.vx,vy:q.vy,vh:q.vh,life,size,g:q.g,drag:q.drag,grow:q.grow,col:fxG(L,'col')!=='$core'&&L.col?col:undefined,fb:g('fb')||undefined});return;
    case 'ember':q.sh=2;q.size=size*0.5;break;}
  PARTS.push(q);}
// ---------- รูปทรง 3D ----------
const FXGEO=new Map();
function fxMerge(list){let np=0,ni=0;for(const g of list){np+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count;}
  const pos=new Float32Array(np*3),nor=new Float32Array(np*3),uv=new Float32Array(np*2),idx=[];let o=0;
  for(const g of list){const P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv;pos.set(P.array,o*3);if(N)nor.set(N.array,o*3);if(U)uv.set(U.array,o*2);
    if(g.index)for(let i=0;i<g.index.count;i++)idx.push(g.index.getX(i)+o);else for(let i=0;i<P.count;i++)idx.push(i+o);o+=P.count;g.dispose();}
  const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(pos,3));m.setAttribute('normal',new THREE.BufferAttribute(nor,3));m.setAttribute('uv',new THREE.BufferAttribute(uv,2));m.setIndex(idx);return m;}
function fxRibbon(path,w){const pts=path.map(p=>new THREE.Vector3(-p[0],p[1],p[2])),n=pts.length,pos=[],uv=[],idx=[];if(n<2)return new THREE.PlaneGeometry(1,1);
  let len=0;const L=[0];for(let i=1;i<n;i++){len+=pts[i].distanceTo(pts[i-1]);L.push(len);}
  const up=new THREE.Vector3(0,1,0),t=new THREE.Vector3(),sd=new THREE.Vector3();
  for(let i=0;i<n;i++){t.subVectors(pts[Math.min(n-1,i+1)],pts[Math.max(0,i-1)]).normalize();sd.crossVectors(t,up);if(sd.lengthSq()<1e-6)sd.set(1,0,0);sd.normalize().multiplyScalar(w*0.5);
    pos.push(pts[i].x-sd.x,pts[i].y-sd.y,pts[i].z-sd.z,pts[i].x+sd.x,pts[i].y+sd.y,pts[i].z+sd.z);uv.push(L[i]/len,0,L[i]/len,1);if(i){const a=(i-1)*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function fxGeo(L){const g=k=>fxG(L,k),sh=g('shape');let key=sh,mk;
  switch(sh){
    case 'sphere':mk=()=>new THREE.SphereGeometry(1,32,20);break;
    case 'dome':mk=()=>new THREE.SphereGeometry(1,32,12,0,Math.PI*2,0,Math.PI/2);break;
    case 'disc':mk=()=>new THREE.CircleGeometry(1,48).rotateX(-Math.PI/2);break;
    case 'ring':key+=g('inner');mk=()=>new THREE.RingGeometry(Math.min(0.98,g('inner')),1,64,1).rotateX(-Math.PI/2);break;
    case 'cylinder':mk=()=>new THREE.CylinderGeometry(1,1,1,32,1,true).translate(0,0.5,0);break;
    case 'cone':mk=()=>new THREE.CylinderGeometry(0.001,1,1,32,1,true).translate(0,0.5,0);break;
    case 'torus':key+=g('inner');mk=()=>new THREE.TorusGeometry(1,Math.max(0.02,(1-g('inner'))*0.5),12,48).rotateX(Math.PI/2);break;
    case 'crescent':key+=g('wk');mk=()=>crescentGeo(g('wk'),0).rotateY(-Math.PI/2);break;
    case 'spikes':key+=g('n');mk=()=>{const n=g('n'),L2=[];for(let i=0;i<n;i++){const a=i/n*6.283+Math.sin(i*12.9898)*0.2,hh=0.75+0.35*Math.abs(Math.sin(i*78.233));
        const c=new THREE.ConeGeometry(0.16,1,5).translate(0,0.5,0).scale(1,hh,1).rotateZ(-0.38).rotateY(-a).translate(Math.cos(a)*0.75,0,Math.sin(a)*0.75);L2.push(c.index?c:c);}return fxMerge(L2);};break;
    case 'beam':mk=()=>new THREE.CylinderGeometry(1,1,1,24,1,true).rotateX(Math.PI/2).translate(0,0,0.5);break;
    case 'plane':mk=()=>new THREE.PlaneGeometry(1,1);break;
    case 'lathe':key+=JSON.stringify(g('prof'));mk=()=>new THREE.LatheGeometry((g('prof')||[]).map(p=>new THREE.Vector2(Math.max(0,p[0]),p[1])),40);break;
    case 'ribbon':key+=JSON.stringify(g('path'))+g('wk');mk=()=>fxRibbon(g('path')||[],g('wk'));break;
    default:mk=()=>new THREE.SphereGeometry(1,16,10);}
  let geo=FXGEO.get(key);if(!geo){geo=mk();geo.userData.keep=true;FXGEO.set(key,geo);if(FXGEO.size>120){const k0=FXGEO.keys().next().value;const g0=FXGEO.get(k0);FXGEO.delete(k0);g0.userData.keep=false;}}
  return geo;}
// วัสดุพลังงาน: ขอบเรือง (fresnel) + ลาย noise ไหล + สลายตัวแบบขอบไหม้ • สี core/main/deep จากจานธาตุ • ผสมแบบ premultiplied (เรืองแต่ไม่ขาวโพลน)
function fxEnergyMat(c1,c2,c3){const U={time:FIRE_U.time,uC1:{value:new THREE.Color(c1)},uC2:{value:new THREE.Color(c2)},uC3:{value:new THREE.Color(c3)},uOp:{value:1},uDis:{value:0},uInt:{value:1},uScroll:{value:1},uRim:{value:1},uNz:{value:NOISETEX}};
  return new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor,
    vertexShader:'varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform sampler2D uNz;uniform vec3 uC1,uC2,uC3;uniform float time,uOp,uDis,uInt,uScroll,uRim;varying vec2 vUv;varying vec3 vN;varying vec3 vV;'+
      'void main(){float fr=1.0-abs(dot(normalize(vN),normalize(vV)));float t=time*uScroll;'+
      'float n=texture2D(uNz,vUv*vec2(2.0,1.0)+vec2(t*0.05,-t*0.35)).r*0.65+texture2D(uNz,vUv*vec2(4.0,2.0)+vec2(-t*0.13,-t*0.6)).r*0.35;'+
      'if(n<uDis)discard;float edge=uDis>0.001?1.0-smoothstep(uDis,uDis+0.07,n):0.0;'+
      'float body=clamp(0.3+0.7*n,0.0,1.0)*(0.35+0.65*min(1.0,fr*uRim+0.25));'+
      'vec3 c=mix(uC3,uC2,smoothstep(0.2,0.75,n+fr*0.3));c=mix(c,uC1,smoothstep(0.82,1.12,n*0.5+fr*uRim*0.55));c+=uC1*edge*1.4;'+
      'float a=clamp(body+edge,0.0,1.0)*uOp;gl_FragColor=vec4(c*uInt*a,a*0.82);}'});}
function fxMeshMake(S,I,w){const L=S.d,g=k=>fxG(L,k),sh=g('shape'),mt=g('mat'),C=k=>fxCol(g(k),I);let obj,mats=[];
  const mkMat=()=>{switch(mt){
    case 'fire':{const ball=g('mode')==='ball'||(g('mode')==='auto'&&['sphere','dome','torus','glb','spikes'].includes(sh));
      const m=fireMat({mode:ball?'ball':'sheet',flow:g('flow'),speed:(ball?1.2:1.4)*g('scroll'),int:1.15,disp:g('disp'),tint:L.col?C('col'):undefined,side:sh==='plane'});return m;}
    case 'ice':return iceShaderMat({glow:1,rim:g('rim')});
    case 'glow':return new THREE.MeshBasicMaterial({color:hdr(C('col'),1.15),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
    case 'solid':return new THREE.MeshStandardMaterial({color:C('col'),emissive:C('col2'),emissiveIntensity:0.35,roughness:0.85,metalness:0,flatShading:true,transparent:true});
    case 'flip':{const t=fxFlipTex(g('tex'));const m=new THREE.MeshBasicMaterial({map:t?t.map:null,color:hdr(C('col'),1.2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});if(t)S.flip=t;return m;}
    default:{const m=fxEnergyMat(fxCol('$core',I),C('col'),C('col2'));m.uniforms.uScroll.value=g('scroll');m.uniforms.uRim.value=g('rim');return m;}}};
  if(sh==='glb'){const nm=g('glb');if(!MODELS.ready.get(nm)){if(nm&&!MODELS.fail.has(nm))loadModel(nm);S.oneshot=1;return;}
    obj=modelInst(nm);const m=mkMat();mats.push(m);obj.traverse(q=>{if(q.isMesh){q.material=m;q.castShadow=false;q.renderOrder=3;}});}
  else{const geo=fxGeo(L),m=mkMat();mats.push(m);obj=new THREE.Mesh(geo,m);obj.renderOrder=3;S.geo=geo;}
  const root=new THREE.Group();root.add(obj);S.inner=obj;
  const r=g('rot')||[0,0,0];obj.rotation.order='YXZ';obj.rotation.set(-(r[0]||0)*FXDEG,-(r[1]||0)*FXDEG,(r[2]||0)*FXDEG);
  S.obj=root;S.mats=mats;S.spin=0;fxPlace(root,I,S,w,fxV(g('yaw'),I,0)*FXDEG);scene.add(root);fxMeshTick(S,I,0,0);}
function fxMeshTick(S,I,k,dt){const L=S.d,g=q=>fxG(L,q),V=q=>fxV(g(q),I,k);if(!S.obj)return;
  const w=fxPos(I,S,k);fxPlace(S.obj,I,S,w,V('yaw')*FXDEG);S.spin+=(g('spin')||0)*FXDEG*dt;S.obj.rotation.y-=S.spin;
  let sc=fxV(g('scale'),I,k);if(Array.isArray(sc))S.inner.scale.set(Math.max(1e-3,sc[0]*I.s),Math.max(1e-3,sc[1]*I.s),Math.max(1e-3,sc[2]*I.s));else S.inner.scale.setScalar(Math.max(1e-3,(sc||1)*I.s));
  if(g('bill')){S.obj.rotation.set(0,0,0);S.obj.lookAt(cam.position);}
  let op;if(L.op!==undefined)op=V('op');else{const fd=g('fade'),inT=Math.min(0.06,S.life*0.15);op=Math.min(1,S.age/Math.max(1e-3,inT));if(!g('loop')&&fd>0&&k>1-fd)op*=Math.max(0,(1-k)/fd);if(I.stop&&g('loop'))op=0;}
  const it=V('int')*I.k,dis=V('dis'),heat=V('heat');
  for(const m of S.mats){const u=m.uniforms;
    if(u&&u.uOp&&u.uHeat){u.uOp.value=op;u.uHeat.value=heat;u.uDis.value=dis;u.uInt.value=1.15*it;}
    else if(u&&u.uC1){u.uOp.value=op;u.uDis.value=dis;u.uInt.value=it;}
    else if(u&&u.uFade){u.uFade.value=op*(1-dis);u.uGlow.value=0.95*it;}
    else m.opacity=op*Math.min(1,it);}
  if(S.flip){const F=S.flip,n=F.cols*F.rows,f=Math.min(n-1,Math.floor(k*n*(F.span||1))%n);F.map.offset.set((f%F.cols)/F.cols,1-(Math.floor(f/F.cols)+1)/F.rows);}}
function fxFlipTex(name){if(!name)return null;let e=null,t=null;const ff=MODELS.man&&MODELS.man.fx&&MODELS.man.fx[name];
  if(ff){const F=flipTex(name);if(F&&F.t&&F.t.image){t=F.t.clone();e=F.e;}}
  else if(PFB[name]&&(PFB[name].tex||(PFB[name].pts&&PFB[name].pts.material.uniforms.map))){const src=PFB[name].tex||PFB[name].pts.material.uniforms.map.value;t=src.clone();e=PFB[name].e;}
  if(!t)return null;t.userData={};t.repeat.set(1/(e.cols||8),1/(e.rows||8));t.needsUpdate=true;return {map:t,cols:e.cols||8,rows:e.rows||8,span:1};}
// ---------- หางแสง / รอยฟัน ----------
function fxTrailTick(S,I,k){const L=S.d,g=q=>fxG(L,q),h=S.obj;if(!h)return;
  if(g('sweep')){const a=(g('a0')+(g('a1')-g('a0'))*(1-Math.pow(1-k,2)))*FXDEG,tl=(g('tilt')||0)*FXDEG,r=fxV(g('r'),I,k)*I.s,r0=fxV(g('r0'),I,k)*I.s,b=fxPos(I,S,k),yw=fxV(g('yaw'),I,k)*FXDEG;
    const pt=rr=>{let p=[Math.sin(a)*rr,0,Math.cos(a)*rr];p=[p[0]*Math.cos(tl),p[0]*Math.sin(tl),p[2]];p=fxYawV(p,yw);const q=fxLocal(I,b,p);return [tx(q[0]),q[2]+GY(q[0],q[1]),tz(q[1])];};
    const A=pt(r0),B=pt(r);trailPoint(h,A[0],A[1],A[2],B[0],B[1],B[2]);return;}
  let q;const T=g('of')&&I.L.find(z=>z.d.id===g('of'));if(T&&T.obj){T.obj.getWorldPosition(_fxw);q=[_fxw.x,_fxw.y,_fxw.z];}else{const w=fxPos(I,S,k);q=[tx(w[0]),w[2]+GY(w[0],w[1]),tz(w[1])];}
  trailPoint(h,q[0],q[1],q[2]);}
// ---------- สายฟ้า ----------
function fxBolt(S,I,w){const L=S.d,g=q=>fxG(L,q),n=Math.max(1,Math.round(g('n')*Math.min(2,I.s)));
  for(let i=0;i<n;i++){let e;const rad=fxV(g('radial'),I,0);
    if(rad>0){const t=_fxrnd(0,6.283);e=[Math.cos(t)*rad,_fxrnd(-0.6,0.6)*rad*0.4,Math.sin(t)*rad];}
    else{const to=fxV(g('to'),I,0)||[0,0,4],j=g('jit');e=[to[0]+_fxrnd(-j,j),to[1]+_fxrnd(-j,j)*0.5,to[2]+_fxrnd(-j,j)];}
    e=fxYawV(e,fxV(g('yaw'),I,0)*FXDEG);const b=fxLocal(I,w,[e[0]*I.s,e[1]*I.s,e[2]*I.s]);
    tbolt(w[0],w[1],w[2],b[0],b[1],Math.max(0.05,b[2]),g('blife'),g('acc')?'#9fd8ff':0,g('w')*Math.sqrt(I.s),g('br'));}}
// ---------- ฟังก์ชันในโค้ดที่ไฟล์เรียกได้ (ชั้น t:"code") ----------
const FXCODE={
  explosion:(x,y,h,a)=>explosionFX(x,y,h,a.s||1),
  fireBlast:(x,y,h,a)=>fireBlast(x,y,h,a.r||3,a.life||0.6,{up:a.up}),
  fireBurn:(x,y,h,a)=>fireBurn(x,y,h,a.r||1,a.h||3,a.life||1.5),
  meteor:(x,y,h,a,I)=>fireMeteor(x,y,a.t||0.3,x-Math.cos(I.a)*260,y-Math.sin(I.a)*260),
  iceRing:(x,y,h,a)=>iceRing(x,y,(a.r||3)*20,a.n||14,a.h||0.6,a.life||1.2,{}),
  iceCircle:(x,y,h,a)=>iceCircle(x,y,a.r||5,a.t||3),
  mistWave:(x,y,h,a)=>mistWave(x,y,(a.r||3)*20,a.n||16),
  claws:(x,y,h,a,I)=>clawRakes(x,y,h,I.a,a.r||100,a.rot||0,!!a.big),
  slash:(x,y,h,a,I)=>makeSlash(x,y,h,I.a+(a.yaw||0)*FXDEG,(a.r||3)*20,!!a.vert,(a.tilt||0)*FXDEG,a.col||'#cfefff',a.br||1.8,a.wk||1),
  playFx:(x,y,h,a,I)=>playFx(a.name||'arcane_impact',x,y,h,{s:a.s||1,a:I.a}),   // เทียบแม่แบบไฟล์กับแบบโค้ดเดิม (สตูดิโอ)
};
// ---------- ผูกกับ event ของเกม (assets/fx/bind.json) — เรียกจาก fx(ev) ----------
// คืน true = "replace" → ข้ามภาพจากโค้ดเดิมของ event นี้
function fxBind(ev,H){if(!FXR.ready||!FXR.on||ev.x===undefined)return false;
  const keys=ev.k==='efx'?['efx:'+ev.z]:(ev.t!==undefined?[ev.k+':'+ev.t,ev.k]:[ev.k]);let rep=false;
  for(const key of keys){const e=FXR.over[key]||FXR.bind[key];if(!e)continue;
    for(const b of [].concat(e)){if(!b||!b.fx)continue;const d=fxData(b.fx);if(!d)continue;
      const ctx={P:{ev,s:1,k:1}},ev2=v=>typeof v==='string'?fxEval(v,ctx):v,p={};if(b.p)for(const q in b.p)p[q]=ev2(b.p[q]);
      const fol=b.follow?(b.follow==='ev.id'?ev.id:ev2(b.follow)):undefined;
      const I=fxStart(d,{x:ev.x,y:ev.y,h:H,a:ev.a||0,col:ev.col||ev.c,pal:b.pal,s:b.s!==undefined?ev2(b.s):1,p,follow:fol,own:ev.id!==undefined&&ev.id===NET.myId,ev},b.fx);
      if(I&&b.mode==='replace')rep=true;}
    break;}
  return rep;}
// ---------- แม่แบบ playFx เป็นไฟล์ (assets/fx/tpl/*, sig/*, rec/*) ----------
// playFx('fire_impact') → tpl/impact (จานสี fire) + sig/fire (คูณจำนวนตาม VFXSIGK) • ไฟล์ยังไม่มา = playFx แบบโค้ดเดิม
function fxTpl(name,x,y,h,o){if(!FXR.ready||!FXR.on||!FXR.tpl)return false;
  if(VFXR[name]){const d=fxData('rec/'+name);if(!d)return false;fxStart(d,{x,y,h,a:o.a||0,s:o.s||1,gh:o.gh!==undefined?o.gh-0.15:undefined},'rec/'+name);return true;}
  const k=name.indexOf('_');if(k<0)return false;const el=name.slice(0,k),tpl=name.slice(k+1),d=fxData('tpl/'+tpl);if(!d)return false;
  const P=palOf(el,o.col),base={x,y,h,a:o.a||0,s:o.s||1,gh:o.gh!==undefined?o.gh-0.15:undefined,pal:el==='col'?'col':el,col:o.col};
  fxStart(d,base,'tpl/'+tpl);
  if(P.sig){const sd=fxData('sig/'+P.sig);if(sd)fxStart(sd,Object.assign({},base,{n:VFXSIGK[tpl]||1}),'sig/'+P.sig);}
  return true;}
fxBoot();
if(window.WD)window.WD.fx={bind:fxBind,playFx:(...a)=>playFx(...a),play:fxPlay,start:fxStart,stop:fxStop,kill:fxKill,load:fxLoad,clear:fxClearAll,R:FXR,update:updateFx};
