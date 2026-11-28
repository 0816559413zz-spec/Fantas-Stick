// Real-time TDM bench (guides/OPTIMIZE.md §U): 10 players (you + 9 top-level bots, 6v4), real rAF loop (not HL.step),
// so the fps is what a player sees. Bots fight with their real AI; every 0.5 s your character is moved to the middle of the fight
// so the camera sees it. Paths cycle through every class incl. Darkness + Light.
// Run: node tools/headless.js --game --js tools/bench-tdm.js --w 1891 --h 942 --quiet --timeout 200 [--cpu 2] [--profile tdm]
//   options: window.__o={map:'meadow',secs:20,warm:8,lobby:4,seed:1,mode:'tdm',bots:9}   (set with --eval before, or edit defaults)
//   6v6 siege on Cliff Side Castle: window.__o={mode:'siege',map:'fcs-file',bots:11}
const O=window.__o||{},MAP=O.map||'meadow',SECS=O.secs||30,WARM=O.warm||8,MODE=O.mode||'tdm',NB=O.bots??9;
// seeded random so runs are closer to each other (real time still varies)
if(O.seed!==0){let s=(O.seed||1)>>>0;Math.random=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{localStorage.setItem('wd_kit2','0');}catch(e){}
// real players wait on CLICK TO BEGIN until the entry preload is done (PRE.st 2). O.pre:0 = click through at once (old runs:
//   the unfinished rehearsals then ran inside the match and held back the map compile = 15–17 s frames on a fresh profile)
const tPre=performance.now();if(O.pre!==0)for(let i=0;i<900&&WD.PRE&&WD.PRE.st!==2;i++)await sleep(100);
const preMs=Math.round(performance.now()-tPre);
document.getElementById('intro')?.classList.add('gone');   // real players clicked through the title
document.getElementById('btnSolo').click();
for(let i=0;i<60&&WD.screen!=='lobby';i++)await sleep(100);
const G=WD.G;G.mode=MODE;G.mapPick=MAP;
const ids=['pyro','frost','storm','earth','water','wind','darkness','light','nature'];
const PI=ids.map(id=>WD.PATHS?WD.PATHS.findIndex(p=>p.id===id):-1);
for(let i=0;i<NB;i++)WD.lobbyBotAdd(PI[i%9]>=0?PI[i%9]:-1,2,1);
// 6v4: me + 5 bots on team 0, 4 bots on team 1
const pl=Object.values(G.players);let a=0;for(const p of pl){p.lteam=a<Math.max(6,Math.ceil(pl.length/2))?0:1;a++;}
WD.broadcastLobby();
await sleep((O.lobby??4)*1000);   // players sit in the lobby a few seconds before Start (lobby warm-up runs then)
const warmLobby=WD.warm.log.slice();
WD.hostStart();
for(let i=0;i<120&&(WD.screen!=='game'||G.ph!=='play');i++)await sleep(250);
// real players have the mouse locked (no "click the screen" plate, no pause menu): fake the lock
Object.defineProperty(document,'pointerLockElement',{configurable:true,get:()=>document.getElementById('cv')});document.dispatchEvent(new Event('pointerlockchange'));
const me=G.players[WD.NET.myId];
const follow=setInterval(()=>{const L=Object.values(G.players).filter(p=>p!==me&&p.hp>0);if(!L.length||!me)return;let x=0,y=0;for(const p of L){x+=p.x;y+=p.y;}me.x=x/L.length;me.y=y/L.length+60;me.hp=me.maxHp;if(G.teamScore)G.teamScore=G.teamScore.map(()=>0);G.timer=600;},500);
// settle: warm queue empty, map file loaded, every program linked (O.settle:0 = fixed wait only). Steady-state fight cost,
//   not the one-time compile (fresh headless profile = no shader disk cache, slower than a player's second run)
const tSet=performance.now();if(O.settle!==0){let W0=null;WD.scene.traverse(o=>{if(o.userData&&o.userData.grPend!==undefined)W0=o;});
  for(let i=0;i<1200;i++){let rdy=true;try{rdy=WD.gl.info.programs.every(p=>p.isReady());}catch(e){}
    if(!WD.warm.q.length&&!WD.warm.busy&&!(W0&&W0.userData.grPend)&&rdy)break;await sleep(100);}}
const settleMs=Math.round(performance.now()-tSet);
await sleep(WARM*1000);
// measure
const warm0={q:WD.warm.q.slice(),busy:WD.warm.busy,log:WD.warm.log.slice()};
const ft=[];let last=performance.now(),run=true,calls=0,tris=0,nf=0;
const info=WD.gl.info;
// count real draw calls (all passes + shadow) by wrapping the GL draw functions
const g2=WD.gl.getContext(),DC={n:0,orig:[]};for(const k of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){const f=g2[k];DC.orig.push([k,f]);g2[k]=function(){DC.n++;return f.apply(this,arguments);};}
const progSeen=new Set(info.programs.map(p=>p.id)),keyLive=new Map(),keyGone=new Set(),newProgs=[],hitch=[],qlog=[];let lastQ='';const newFull=[],oldKeys=info.programs.map(p=>p.cacheKey);const prevP={};
function tick(t){if(!run)return;const d=t-last;ft.push(d);last=t;
  const np=info.programs.filter(p=>!progSeen.has(p.id));for(const p of np)progSeen.add(p.id);
  {const now=new Set(info.programs.map(p=>p.cacheKey));for(const k of keyLive.keys())if(!now.has(k)){keyGone.add(k);keyLive.delete(k);}for(const k of now)keyLive.set(k,1);}
  if(np.length){const who=new Map(),set=new Set(np);for(const sc of [WD.scene,WD.post.fxScene])sc.traverse(o=>{if(!o.material)return;for(const m of [].concat(o.material)){const cp=WD.gl.properties.get(m).currentProgram;if(cp&&set.has(cp)&&!who.has(cp))who.set(cp,(o.name||o.parent&&o.parent.name||'?')+'/'+m.type+(m.name?':'+m.name:''));}});
    for(const p of np){newFull.push([((t-t0)/1000).toFixed(1),p.cacheKey,who.get(p)||p.name]);}for(const p of np)newProgs.push(((t-t0)/1000).toFixed(1)+'s '+(keyGone.has(p.cacheKey)?'RE ':'')+(who.get(p)||p.name||'?')+' '+String(p.cacheKey).slice(0,40));}
  let nl=0;WD.scene.traverseVisible(o=>{if(o.isLight)nl++;});const qs='L'+nl+' hp'+(me.hp>0?1:0)+' '+WD.QUAL.lvl+'/'+WD.QUAL.cs+'/'+WD.QUAL.scale+'/'+WD.screen+'/'+(WD.scene.environment&&WD.scene.environment.uuid.slice(0,4));if(qs!==lastQ){qlog.push(((t-t0)/1000).toFixed(1)+'s '+qs);lastQ=qs;}
  const P=WD.PROF.t,dl=[];for(const k in P){const v=P[k]-(prevP[k]||0);if(v>15)dl.push(k+':'+v.toFixed(0));prevP[k]=P[k];}
  if(d>100)hitch.push(((t-t0)/1000).toFixed(1)+'s '+d.toFixed(0)+'ms +'+np.length+'prog '+dl.join(','));calls+=DC.n;DC.n=0;nf++;requestAnimationFrame(tick);}
for(const p of info.programs)keyLive.set(p.cacheKey,1);requestAnimationFrame(t=>{last=t;requestAnimationFrame(tick);});
WD.PROF.on=true;WD.PROF.t={};WD.PROF.n={};
if(O.profile!==0)console.profile('tdm');
const t0=performance.now();
await sleep(SECS*1000);
if(O.profile!==0)console.profileEnd('tdm');
run=false;for(const [k,f] of DC.orig)g2[k]=f;WD.PROF.on=false;clearInterval(follow);
const el=(performance.now()-t0)/1000,s=[...ft].sort((x,y)=>x-y),q=f=>+s[Math.floor(s.length*f)].toFixed(1);
const prof=Object.entries(WD.PROF.t).map(([k,v])=>[k,+(v/ft.length).toFixed(2)]).filter(x=>x[1]>=0.05).sort((x,y)=>y[1]-x[1]).slice(0,40);
// what kinds of objects are drawn: count visible meshes in scene by top-level name
let meshes=0,vis=0;WD.scene.traverseVisible(o=>{if(o.isMesh||o.isPoints||o.isLine||o.isSprite)vis++;});WD.scene.traverse(o=>{if(o.isMesh)meshes++;});
const kills={};for(const p of Object.values(G.players))kills[p.name]=(p.kills||0);
const kdiff=newFull.map(([tm,k,w])=>{const A=k.split(',');let best=null,bd=1e9;for(const o of oldKeys.concat(newFull.filter(x=>x[1]!==k).map(x=>x[1]))){if(o===k)continue;const B=o.split(',');if(B.length!==A.length)continue;let d=0;for(let i=0;i<A.length;i++)if(A[i]!==B[i])d++;if(d<bd){bd=d;best=B;}}
  const df=[];if(best)for(let i=0;i<A.length;i++)if(A[i]!==best[i])df.push(i+':'+best[i]+'>'+A[i]);return tm+' '+w+' len'+A.length+' d'+bd+' '+df.slice(0,6).join(' ');});
return {preMs,settleMs,preLog:(WD.warm.log.find(s=>/^preload /.test(s))||''),warmLobby,warm0,warm1:WD.warm.log.slice(warm0.log.length),kdiff,map:G.map,players:pl.length,frames:ft.length,fps:+(ft.length/el).toFixed(1),median:q(0.5),p95:q(0.95),p99:q(0.99),worst:+s[s.length-1].toFixed(1),
  slow33:ft.filter(x=>x>33.4).length,slow50:ft.filter(x=>x>50).length,draws:Math.round(calls/nf),meshes,visible:vis,
  geo:info.memory.geometries,tex:info.memory.textures,progs:info.programs.length,newProgs:newProgs.slice(0,60),nNew:newProgs.length,qlog,hitch:hitch.slice(0,40),qual:{mode:WD.QUAL.mode,lvl:WD.QUAL.lvl,cs:WD.QUAL.cs,scale:WD.QUAL.scale},prof,errs:HL.errs.slice(0,5)};
