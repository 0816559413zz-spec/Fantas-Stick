// Entry loader bench (guides/PRELOAD-STANDARD.md step 3) — page script.
// Measures preload time, then shader programs created in lobby / countdown / first seconds of play, and the longest frame gaps.
// node tools/headless.js --url "index.html?nosw#mode=siege&map=fcs-file" --game --js tools/bench-entry.js --timeout 300 --quiet
// compare with "index.html?nosw&nopreload#..."
const sleep=HL.sleep,G=()=>WD.G,O=Object.fromEntries(new URLSearchParams(location.hash.slice(1)));
const progs=()=>WD.glProgs();
const names=from=>{const L=WD.glList().slice(from),c={};for(const n of L)c[n]=(c[n]||0)+1;return c;};
const P=WD.PRE,t0=performance.now();
for(let i=0;i<900&&P&&P.on&&P.st!==2;i++)await sleep(100);
const pre={on:!!(P&&P.on),ms:P&&Math.round(P.ms),progs:progs(),log:WD.warm.log.slice()};
// frame gaps on the real loop
let gaps=[],last=performance.now(),run=true;const rf=()=>{const n=performance.now();gaps.push([n-last,WD.screen,G()&&G().ph]);last=n;if(run)requestAnimationFrame(rf);};requestAnimationFrame(rf);
document.getElementById('btnSolo').click();
for(let i=0;i<60&&WD.screen!=='lobby';i++)await sleep(100);
G().mode=O.mode||'siege';if(O.map)G().mapPick=O.map;WD.broadcastLobby&&WD.broadcastLobby();
const paths=WD.PATHS.map((p,i)=>i).filter(i=>!WD.PATHS[i].off);
for(let i=0;i<9;i++)WD.lobbyBotAdd(paths[i%paths.length],1);
const p0=progs();WD.warm.log.length=0;gaps=[];
await sleep(+(O.wait||9000));
const lobby={progs:progs()-p0,names:names(p0),log:WD.warm.log.slice(),maxGap:Math.round(Math.max(...gaps.map(g=>g[0])))};
const p1=progs();WD.warm.log.length=0;gaps=[];
WD.hostStart();
for(let i=0;i<150&&WD.screen!=='game';i++)await sleep(100);
for(let i=0;i<200&&G().ph!=='play';i++)await sleep(100);
const count={progs:progs()-p1,names:names(p1),log:WD.warm.log.slice(),maxGap:Math.round(Math.max(...gaps.map(g=>g[0])))};
const p2=progs();gaps=[];
await sleep(5000);
run=false;
const play={progs:progs()-p2,names:names(p2),maxGap:Math.round(Math.max(...gaps.map(g=>g[0]))),over100:gaps.filter(g=>g[0]>100).map(g=>Math.round(g[0]))};
return {pre,lobby,count,play,errs:HL.errs.slice(0,5)};
