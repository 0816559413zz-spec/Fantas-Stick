// 6v6 GPU benchmark (guides/OPTIMIZE.md §Q): 12 players, TDM, graphics HIGH, real GPU time per post-process pass.
// Run: python tools/serve.py   then   node tools/headless.js --game --js tools/bench-6v6.js --w 1920 --h 1080 --quiet --timeout 240
//   env: map via  --eval-free: edit MAP below.  Headless Chrome here uses the real NVIDIA GPU (checked 2026-11-07), the Claude desktop pane uses Intel.
// Output: GPU ms/frame (sum of passes via EXT_disjoint_timer_query_webgl2), per pass median, CPU ms/frame (host + draw submit), draw calls, triangles.
const O=window.__o||{},MAP=O.map||'meadow',N=O.n||600,SCALE=O.scale||1,REP=O.rep||4;   // REP: extra back-to-back renders per frame so the GPU stays busy (a CPU-bound frame lets the laptop GPU drop its clock → ms look constant whatever you switch off)   // O = options set by tools/bench-6v6-ablate.js
await HL.solo({kit:'0'});WD.hostToLobby();
const paths=[0,1,2,6,7,8];
for(let i=1;i<12;i++)WD.addPlayer('b6-'+i,'B'+i,null,null,String(paths[i%6]));
WD.broadcastLobby();WD.G.mode='tdm';WD.G.mapPick=MAP;
const sel=document.querySelector('#setGfx');WD.QUAL.mode='high';WD.QUAL.scale=SCALE;WD.QUAL.lvl=0;WD.applyQuality();
WD.hostStart();
for(let i=0;i<240;i++){HL.step(1);if(i%30===0)await HL.sleep(0);}
const until=performance.now()+25000;let settled=0;
while(performance.now()<until&&settled<3){HL.step(2);await HL.sleep(30);settled=!WD.warm.q.length&&!WD.warm.busy?settled+1:0;}
if(O.noshadow)WD.moonL.castShadow=false;if(O.noao)WD.post.AOU.uAO.value=0;if(O.nobloom)WD.post.bloom.enabled=false;if(O.nofx)WD.post.fxScene.visible=false;if(O.nograde){WD.post.gradePass.enabled=false;}
const players=Object.values(WD.G.players),p0=HL.me(),o={x:p0.x,y:p0.y};HL.aim(0,0.12);
players.forEach((p,i)=>{const side=p.team===p0.team?-1:1,k=Math.floor(i/2);p.x=o.x+side*130+(Math.random()-0.5)*40;p.y=o.y+(k-3)*50;p.ult=100;p.lst=5;p.wg=100;p.hp=p.maxHp=1e6;
  p.inp={...WD.INPUT,c:{...WD.INPUT.c},mx:0,my:0,u:0,d:0,l:0,r:0,sh:0,dh:0,hq:0,fire:0,ax:p.x-side*300,ay:p.y,ah:1.2,gx:p.x-side*220,gy:p.y};});
// GPU timer queries around every composer pass
const g2=WD.gl.getContext(),ext=g2.getExtension('EXT_disjoint_timer_query_webgl2');if(!ext)throw new Error('NO_TIMER_QUERY');
const pend=[],acc={};let frameNo=0;
for(const pass of WD.composer.passes){const nm=pass.constructor.name,orig=pass.render.bind(pass);
  pass.render=function(...a){const q=g2.createQuery();g2.beginQuery(ext.TIME_ELAPSED_EXT,q);try{return orig(...a);}finally{g2.endQuery(ext.TIME_ELAPSED_EXT);pend.push({q,nm,f:frameNo});}};}
const gpuFrame={};
function drain(force){for(let i=0;i<pend.length;){const e=pend[i];if(g2.getQueryParameter(e.q,g2.QUERY_RESULT_AVAILABLE)){if(!g2.getParameter(ext.GPU_DISJOINT_EXT)){const ms=g2.getQueryParameter(e.q,g2.QUERY_RESULT)/1e6;(acc[e.nm]||(acc[e.nm]=[])).push(ms);gpuFrame[e.f]=(gpuFrame[e.f]||0)+ms;}g2.deleteQuery(e.q);pend.splice(i,1);}else i++;}}
const cpu=[],calls=[],tris=[];WD.gl.info.autoReset=false;
for(let f=0;f<N;f++){frameNo=f;if(O.profile&&f===60)console.profile('b6');if(O.profile&&f===N-60)console.profileEnd('b6');
  for(const p of players){const I=p.inp;I.fire=f%45<5?1:0;if(f===30)I.c.q++;if(f===90)I.c.x++;if(f===180)I.c.e++;if(f===300)I.c.r++;if(f===420)I.c.f++;if(f===520)I.c.q++;}
  WD.gl.info.reset();const t=performance.now();HL.step(1);cpu.push(performance.now()-t);calls.push(WD.gl.info.render.calls);tris.push(WD.gl.info.render.triangles);
  for(let r=1;r<REP;r++){WD.gl.shadowMap.needsUpdate=true;WD.composer.render(1/60);}
  drain();if(f%20===0)await HL.sleep(0);}
for(let i=0;i<200&&pend.length;i++){await HL.sleep(10);drain();}
WD.gl.info.autoReset=true;
// where do the triangles / draws come from? (visible meshes only, grouped by name or kind)
const groups={};
const frustum=(()=>{const m=WD.cam.projectionMatrix.clone().multiply(WD.cam.matrixWorldInverse),e=m.elements,pl=[];for(let i=0;i<6;i++){const s=i%2?-1:1,a=Math.floor(i/2);pl.push([e[3]+s*e[a],e[7]+s*e[4+a],e[11]+s*e[8+a],e[15]+s*e[12+a]]);}return pl;})();
const inView=o=>{if(o.frustumCulled===false)return true;const g=o.geometry;if(!g)return true;if(!g.boundingSphere)g.computeBoundingSphere();if(o.isSkinnedMesh)return true;const c=g.boundingSphere.center.clone().applyMatrix4(o.matrixWorld),s=g.boundingSphere.radius*Math.max(o.matrixWorld.getMaxScaleOnAxis(),1e-6);for(const p of frustum){const n=Math.hypot(p[0],p[1],p[2])||1;if((p[0]*c.x+p[1]*c.y+p[2]*c.z+p[3])/n<-s)return false;}return true;};
for(const [sn,sc] of [['scene',WD.scene],['fx',WD.post.fxScene]])sc.traverse(o=>{if(!o.isMesh||!o.visible)return;let v=o.parent,vis=true;while(v){if(!v.visible){vis=false;break;}v=v.parent;}if(!vis||!inView(o))return;
  const g=o.geometry;if(!g)return;const idx=g.index?g.index.count:(g.attributes.position?g.attributes.position.count:0),inst=o.isInstancedMesh?o.count:(g.instanceCount&&g.instanceCount!==Infinity?g.instanceCount:1),tri=idx/3*inst;
  let k=sn+':'+(o.isInstancedMesh?'inst ':'')+(o.isSkinnedMesh?'skinned ':'')+(o.name||o.parent&&o.parent.name||o.material&&o.material.type||'?');k=k.replace(/\d+/g,'#');
  const e=groups[k]||(groups[k]={draws:0,tris:0});e.draws++;e.tris+=tri;if(tri>20000){let ch=[],q=o;while(q&&ch.length<5){ch.push(q.name||q.type);q=q.parent;}(window.__big||(window.__big=[])).push(ch.join('<')+' tris='+Math.round(tri)+' attrs='+Object.keys(g.attributes).join('/')+' mat='+(o.material&&o.material.type)+' castShadow='+o.castShadow);}});
const top=Object.entries(groups).sort((a,b)=>b[1].tris-a[1].tris).slice(0,14).map(([k,v])=>k+' | draws '+v.draws+' | tris '+Math.round(v.tris));
const topDraws=Object.entries(groups).sort((a,b)=>b[1].draws-a[1].draws).slice(0,8).map(([k,v])=>k+' | draws '+v.draws+' | tris '+Math.round(v.tris));
const pct=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s.length?+s[Math.min(s.length-1,Math.floor(s.length*p))].toFixed(2):0;};
const frames=Object.keys(gpuFrame).filter(k=>+k>60).map(k=>gpuFrame[k]/REP);
const passes={};for(const k of Object.keys(acc))passes[k]={median:pct(acc[k],.5),p95:pct(acc[k],.95)};
return {map:WD.G.map,players:players.length,teams:[...new Set(players.map(p=>p.team))].length,res:WD.gl.domElement.width+'x'+WD.gl.domElement.height,rep:REP,quality:WD.QUAL.mode,scale:WD.QUAL.scale,opts:O,
  gpuMs:{median:pct(frames,.5),p95:pct(frames,.95),max:pct(frames,1),frames:frames.length},passes,cpuMs:{median:pct(cpu,.5),p95:pct(cpu,.95)},drawCalls:pct(calls,.5),tris:Math.round(pct(tris,.5)),triTop:top,big:window.__big,drawTop:topDraws,errors:[...new Set(HL.errs)].slice(0,5)};
