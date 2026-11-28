// Mid-match shader gate (guides/PRELOAD-STANDARD.md §3d) — page script. Bots of every path fight; lists every shader program
// created after the match warm-up (WD.SHW, js/71). Config in location.hash: #mode=siege&map=fcs-file&n=3600&shift=0
// Run all configs + pass/fail: node tools/shader-gate.js   (one page: node tools/headless.js --url "index.html?nosw#mode=tdm" --game --js tools/bench-shader-gate.js --timeout 400 --quiet)
const sleep=HL.sleep,G=()=>WD.G,O=Object.fromEntries(new URLSearchParams(location.hash.slice(1)));
const mode=O.mode||'siege',N=+(O.n||3600),shift=+(O.shift||0);
WD.SHW.detail=true;
for(let i=0;i<900&&WD.PRE&&WD.PRE.on&&WD.PRE.st!==2;i++)await sleep(100);   // like a player: CLICK TO BEGIN waits for the entry preload
document.getElementById('btnSolo').click();
for(let i=0;i<60&&WD.screen!=='lobby';i++)await sleep(100);
G().mode=mode;if(O.map)G().mapPick=O.map;WD.broadcastLobby&&WD.broadcastLobby();
const paths=WD.PATHS.map((p,i)=>i).filter(i=>!WD.PATHS[i].off);
const cap=Math.min(12,(WD.MODES||{})[mode]?.max||12)-1;
for(let i=0;i<cap;i++)WD.lobbyBotAdd(paths[(i+shift)%paths.length],1);
const used=[...new Set(Object.values(G().players).map(p=>WD.PATHS[(WD.getKit?WD.getKit(p.id):null)?.path]?.id).filter(Boolean))];
await sleep(9000);   // lobby warm-up on the real loop
WD.hostStart();
for(let i=0;i<150&&WD.screen!=='game';i++)await sleep(100);
for(let i=0;i<200&&G().ph!=='play';i++)await sleep(100);
for(let i=0;i<200&&(WD.warm.busy||WD.warm.q.length);i++)await sleep(100);
await sleep(2000);
HL.freeze();
const slow=[];let t=performance.now();
for(let f=0;f<N;f++){
  if(f%600===0)for(const p of Object.values(G().players))p.ult=100;   // ultimates fire too
  const t0=performance.now();HL.step(1);const ms=performance.now()-t0;WD.shwFrame(ms);
  if(ms>150)slow.push({f,ms:Math.round(ms)});
  if(f%10===0)await sleep(0);}
const S=WD.SHW;
return {pre:{ms:Math.round(WD.PRE.ms),st:WD.PRE.st,log:WD.warm.log.filter(l=>/preload|timeout|compile|evr|evload/.test(l)).map(l=>l.slice(0,40)).slice(0,12),q:WD.warm.q.slice(0,5),rerr:(WD.warm.rerr||[]).length},gate:S.armed&&S.n===0&&!HL.errs.length?'PASS':'FAIL',mode,map:WD.builtMap||G().map,paths:used,armed:S.armed,shaders:S.n,slow,list:S.L.map(e=>`${e.ms}ms ${e.name} | ${e.diff} | ${e.who.join(' ; ')}
      key…${e.key.slice(-150)}${e.src?String.fromCharCode(10)+'      src '+e.src:''}`),errs:HL.errs.slice(0,5),files:WD.warm.rec?{'warm-rec.json':JSON.stringify(WD.warmRecDump())}:undefined};
