// Fight churn probe (guides/OPTIMIZE.md §R/§S): 12 players TDM High, everyone casting — counts what gets CREATED per frame.
// Run: python tools/serve.py   then   node tools/headless.js --game --js tools/bench-churn.js --w 1920 --h 1080 --quiet --timeout 240
//   (add "?nofxpool" etc. by setting window.__o={q:'nofxpool'} is not possible here → use --url "index.html?nosw&nofxpool" with --js)
// Output: CPU ms/frame (median/p95/max), materials disposed per frame by type (≈ created, steady state), getParameters per frame,
//   new geometries per frame, worst frames with WD.PROF breakdown, visible separate debris meshes.
const O=window.__o||{},MAP=O.map||'meadow',N=O.n||600;
await HL.solo({kit:'0'});WD.hostToLobby();
const paths=[0,1,2,6,7,8];
for(let i=1;i<12;i++)WD.addPlayer('b6-'+i,'B'+i,null,null,String(paths[i%6]));
WD.broadcastLobby();WD.G.mode='tdm';WD.G.mapPick=MAP;
WD.QUAL.mode='high';WD.QUAL.scale=1;WD.QUAL.lvl=0;WD.applyQuality();
WD.hostStart();
for(let i=0;i<240;i++){HL.step(1);if(i%30===0)await HL.sleep(0);}
const until=performance.now()+25000;let settled=0;
while(performance.now()<until&&settled<3){HL.step(2);await HL.sleep(30);settled=!WD.warm.q.length&&!WD.warm.busy?settled+1:0;}
const players=Object.values(WD.G.players),p0=HL.me(),o={x:p0.x,y:p0.y};HL.aim(0,0.12);
players.forEach((p,i)=>{const side=p.team===p0.team?-1:1,k=Math.floor(i/2);p.x=o.x+side*130+(Math.random()-0.5)*40;p.y=o.y+(k-3)*50;p.ult=100;p.lst=5;p.wg=100;if(p!==p0)p.hp=p.maxHp=1e6;
  p.inp={...WD.INPUT,c:{...WD.INPUT.c},mx:0,my:0,u:0,d:0,l:0,r:0,sh:0,dh:0,hq:0,fire:0,ax:p.x-side*300,ay:p.y,ah:1.2,gx:p.x-side*220,gy:p.y};});
// find THREE.Material.prototype from any material in the scene
let anyM=null;WD.scene.traverse(q=>{if(!anyM&&q.material&&!Array.isArray(q.material))anyM=q.material;});
let MP=Object.getPrototypeOf(anyM);while(MP&&!Object.prototype.hasOwnProperty.call(MP,'customProgramCacheKey'))MP=Object.getPrototypeOf(MP);   // THREE.Material.prototype (names may be minified)
let disp={},ck=0;const od=MP.dispose,oc=MP.customProgramCacheKey;
MP.dispose=function(){const t=this.type+(this.userData&&this.userData.tex?'(tex)':'');disp[t]=(disp[t]||0)+1;return od.call(this);};
const ckBy={};MP.customProgramCacheKey=function(){ck++;const t=this.type+':'+(this.name||this.userData&&this.userData.tex||'')+(this.isShaderMaterial?':'+((this.fragmentShader||'').length):'');ckBy[t]=(ckBy[t]||0)+1;return oc.call(this);};
let lightsA=[],lastL=-1,lightCh=0;const countL=()=>{let n=0;WD.scene.traverse(q=>{if(q.isLight&&q.visible)n++;});return n;};
WD.PROF.on=true;const ultA=[],cpu=[],ckA=[],geoA=[],dispA=[],worst=[],tot={};WD.gl.info.autoReset=false;
const PU=/[?&]profult/.test(location.search),PW=/[?&]profwall/.test(location.search);   // + --profile name: CPU profile of the ult window (frames 300-410)
for(let f=0;f<N;f++){if(PU&&f===300)console.profile('ult');if(PU&&f===410)console.profileEnd('ult');if(PW&&f===299)console.profile('w');if(PW&&f===302)console.profileEnd('w');
  for(const p of players){const I=p.inp;I.fire=f%45<5?1:0;if(f===30)I.c.q++;if(f===90)I.c.x++;if(f===180)I.c.e++;if(f===300)I.c.r++;if(f===420)I.c.f++;if(f===520)I.c.q++;}
  WD.gl.info.reset();p0.hp=p0.maxHp;disp={};ck=0;const P0={...WD.PROF.t};const g0=WD.gl.info.memory.geometries;const t=performance.now();HL.step(1);const ms=performance.now()-t;
  if(f>=60){const nl=countL();if(lastL>=0&&nl!==lastL)lightCh++;lastL=nl;lightsA.push(nl);cpu.push(ms);if(f>=300&&f<410)ultA.push(ms);ckA.push(ck);geoA.push(Math.max(0,WD.gl.info.memory.geometries-g0));let n=0;for(const k in disp){n+=disp[k];tot[k]=(tot[k]||0)+disp[k];}dispA.push(n);
    worst.push({f,ms:+ms.toFixed(1),ck,geo:WD.gl.info.memory.geometries-g0,prof:Object.entries(WD.PROF.t).map(([k,v])=>[k,v-(P0[k]||0)]).filter(([k,v])=>v>2).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>k+' '+v.toFixed(1)).join(', ')});}
  if(f===350||f===200){const G={};let tot=0;for(const [sn,sc] of [['s',WD.scene],['fx',WD.post.fxScene]])sc.traverse(q=>{if(!(q.isMesh||q.isPoints||q.isLine||q.isSprite))return;for(let v=q;v;v=v.parent)if(!v.visible)return;tot++;
      let top=q;while(top.parent&&top.parent!==sc)top=top.parent;const m=Array.isArray(q.material)?q.material[0]:q.material;const k=sn+':'+(top.name||'top{'+Object.keys(top.userData||{}).slice(0,4).join(',')+'}'+top.children.length)+' > '+(q.geometry&&q.geometry.type||q.type)+' '+(m&&m.type)+' #'+(m&&m.color?m.color.getHexString():'');G[k]=(G[k]||0)+1;});
    (window.__dg||(window.__dg={}))[f]={calls:WD.gl.info.render.calls,objs:tot,top:Object.entries(G).sort((a,b)=>b[1]-a[1]).slice(0,22).map(([k,v])=>v+' '+k)};}
  if(f%20===0)await HL.sleep(0);}
WD.PROF.on=false;WD.gl.info.autoReset=true;MP.dispose=od;MP.customProgramCacheKey=oc;
let deb=0,debK={};for(const sc of [WD.scene,WD.post.fxScene])sc.traverse(q=>{if(!q.isMesh||q.isInstancedMesh||!q.visible||!q.parent||q.parent.type!=='Group')return;const t=q.geometry&&q.geometry.type;if(!/Cone|Plane|Dodeca|Icosa|Octa|Tetra|Box/.test(t||''))return;deb++;debK[t]=(debK[t]||0)+1;});
const pct=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s.length?+s[Math.min(s.length-1,Math.floor(s.length*p))].toFixed(2):0;};
const avg=a=>+(a.reduce((x,y)=>x+y,0)/Math.max(1,a.length)).toFixed(2);
const F=cpu.length;for(const k in tot)tot[k]=+(tot[k]/F).toFixed(2);
return {q:location.search,ultMs:{mean:avg(ultA),p95:pct(ultA,.95)},cpuMs:{mean:avg(cpu),median:pct(cpu,.5),p95:pct(cpu,.95),p99:pct(cpu,.99),max:pct(cpu,1)},getParamsPerFrame:avg(ckA),matsDisposedPerFrame:avg(dispA),byType:tot,
  ckTop:Object.entries(ckBy).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([k,v])=>k+' '+(v/Math.max(1,cpu.length)).toFixed(2)),lights:{min:Math.min(...lightsA),max:Math.max(...lightsA),changedFrames:lightCh},newGeoPerFrame:{avg:avg(geoA),max:Math.max(...geoA)},worst:worst.sort((a,b)=>b.ms-a.ms).slice(0,6),draws:window.__dg,debrisVisible:deb,debK,errors:[...new Set(HL.errs)].slice(0,5)};
