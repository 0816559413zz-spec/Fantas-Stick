// Big-fight benchmark (guides/OPTIMIZE.md §I): TDM on valley, 12 players (11 lobby bots), everyone casts every slot when ready + ult every 1.5 s.
// Open http://localhost:<port>/?nosw , then in the console:
//   eval(await (await fetch("tools/bench-fight.js",{cache:"no-store"})).text()); then read window.__fight after ~60 s
// Math.random is seeded during the runs so before/after numbers are comparable. Frames are driven by hand (hidden pane throttles rAF):
// cpu = hostStep + WD.render, gpuWait = readPixels sync after the frame. prof = WD.PROF ms per frame (sections > 0.05 ms).
(async()=>{
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
window.__errs=[];window.addEventListener('error',e=>__errs.push(e.message));
for(let i=0;i<70&&!window.WD;i++)await sleep(500);
for(let i=0;i<20&&!document.getElementById('btnSolo')?.offsetParent;i++)await sleep(500);
document.getElementById('btnSolo').click();await sleep(2500);
for(let i=0;i<20&&!WD.MAPS.valley;i++)await sleep(500);
WD.G.mode='tdm';WD.G.mapPick='valley';WD.broadcastLobby();await sleep(300);WD.lobbyBotFill();await sleep(1500);
// window.BENCH_KITS=['3','0'] before eval = only those kit strings (e.g. earth-heavy fight) • same kits every run (bots get random paths per fill): players cycle through all paths, default spells
{const ps=Object.values(WD.G.players);ps.forEach((p,i)=>WD.setKit(p,window.BENCH_KITS?BENCH_KITS[i%BENCH_KITS.length]:String(i%WD.PATHS.length)));WD.broadcastLobby();}
WD.hostStart();for(let i=0;i<60&&WD.G.ph!=='play';i++)await sleep(250);
{const ps=Object.values(WD.G.players);ps.forEach((p,i)=>WD.setKit(p,window.BENCH_KITS?BENCH_KITS[i%BENCH_KITS.length]:String(i%WD.PATHS.length)));}
const gl=WD.gl,ctx=gl.getContext(),px=new Uint8Array(4);window.requestAnimationFrame=()=>0;
const rand0=Math.random;
async function run(n,heavy,seed){
  let s=seed>>>0;Math.random=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
  let now=performance.now();const tot=[],calls=[],tris=[],gw=[];const P=Object.values(WD.G.players);
  WD.PROF.on=true;WD.PROF.t={};WD.PROF.n={};
  for(let i=0;i<n;i++){
    for(const p of P){if(p.maxHp)p.hp=p.maxHp;if(heavy){for(let k=0;k<4;k++)WD.castSlot(p,k);if(i%90==0){p.ult=100;WD.castUlt(p);}}}
    const t0=performance.now();WD.hostStep(1/60);now+=1000/60;gl.info.autoReset=false;gl.info.reset();WD.render(1/60,now);const t2=performance.now();
    calls.push(gl.info.render.calls);tris.push(gl.info.render.triangles);ctx.readPixels(0,0,1,1,ctx.RGBA,ctx.UNSIGNED_BYTE,px);const t3=performance.now();
    tot.push(t2-t0);gw.push(t3-t2);if(i%10==0)await sleep(0);
  }
  Math.random=rand0;
  const med=a=>{const q=[...a].sort((x,y)=>x-y);return +q[q.length>>1].toFixed(1);};
  const prof={};for(const k in WD.PROF.t)if(WD.PROF.t[k]/n>0.05)prof[k]=+(WD.PROF.t[k]/n).toFixed(2);
  return {cpu:med(tot),gpuWait:med(gw),calls:med(calls),tris_k:(med(tris)/1000)|0,parts:WD.PARTS,prof};
}
const R={paths:Object.values(WD.G.players).map(p=>WD.PATHS[p.pathIdx]&&WD.PATHS[p.pathIdx].id).join(',')};
await run(60,false,1);
R.calm=await run(180,false,2);
R.heavy1=await run(300,true,3);
R.heavy2=await run(300,true,4);
R.mem={...gl.info.memory,prog:gl.info.programs.length};
R.errs=__errs.slice(0,5);
window.__fight=R;
})();
