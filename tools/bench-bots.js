// Full-room bot brawl benchmark (stutter hunt): open http://localhost:8771/?nosw , then in the console:
//   eval(await (await fetch("tools/bench-bots.js",{cache:"no-store"})).text()); then read window.__bots after ~60 s
// Solo FFA + 5 bots (random paths, top level), everyone pulled together so they fight at close range ("นัว ๆ").
// Per frame: hostStep(1/60) + render, timed per section with WD.PROF; slow frames (> 2× median) get their section split recorded.
(async()=>{
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
window.__errs=[];window.addEventListener('error',e=>__errs.push(e.message));
const gl=WD.gl,ctx=gl.getContext(),px=new Uint8Array(4);
window.requestAnimationFrame=()=>0;
const map=(window.__benchMap||'castle'),N=window.__benchFrames||900;
document.getElementById('btnSolo').click();await sleep(1200);
WD.G.mode='ffa';WD.G.mapPick=map;
const lv=WD.BOT_LV?WD.BOT_LV.length-1:2;
const paths=window.__benchPaths||[0,1,2,6,7];   // ไฟ น้ำแข็ง สายฟ้า ดิน ลม (คงที่ = เทียบก่อน/หลังได้)
if(window.__benchSeed!==false){let sd=4242;Math.random=()=>((sd=(sd*16807)%2147483647)/2147483647);}
for(const pa of paths)WD.lobbyBotAdd(pa,lv);
WD.hostStart();
let now=performance.now();
const P=()=>Object.values(WD.G.players);
const huddle=()=>{const L=P(),cx=L[0].x,cy=L[0].y;L.forEach((p,i)=>{if(i){const a=i/L.length*6.283;p.x=cx+Math.cos(a)*140;p.y=cy+Math.sin(a)*140;}});};
// Asset preparation and compileAsync finish on later event-loop turns. A fast
// synchronous countdown otherwise measures loading as part of the fight.
let ready=false;
for(let i=0;i<1200;i++){
  WD.hostStep(1/60);now+=1000/60;WD.render(1/60,now);await sleep(25);
  if(WD.screen==='game'&&WD.G.ph==='play'&&WD.warm.key&&!WD.warm.busy&&!WD.warm.q.length){ready=true;break;}
}
if(!ready)throw new Error('BENCH_WARMUP_TIMEOUT');
huddle();
const PR=WD.PROF;PR.on=true;
const ms=[],rows=[],NEWP={},NEWPF={};let maxParts=0;
for(let f=0;f<N;f++){
  if(f%240===0)huddle();
  P().forEach(p=>{p.hp=Math.max(p.hp,p.maxHp*0.5);p.alive=true;});   // nobody dies: the brawl never stops
  PR.t={};PR.n={};
  const progBefore=new Set(gl.info.programs),prog0=gl.info.programs.length,t=performance.now();WD.hostStep(1/60);now+=1000/60;WD.render(1/60,now);const t2=performance.now();ctx.readPixels(0,0,1,1,ctx.RGBA,ctx.UNSIGNED_BYTE,px);const d=performance.now()-t,gpu=performance.now()-t2;
  for(const pg of gl.info.programs)if(!progBefore.has(pg)){const k=pg.name+'|'+String(pg.cacheKey).slice(0,60);NEWP[k]=(NEWP[k]||0)+1;NEWPF[k]=NEWPF[k]===undefined?f:NEWPF[k];}
  const sec=Object.values(PR.t).reduce((a,b)=>a+b,0),newProg=gl.info.programs.length-prog0;
  ms.push(d);rows.push(Object.assign({f,ms:+d.toFixed(1),parts:WD.PARTS,gpuWait:+gpu.toFixed(1),other:+(d-gpu-sec).toFixed(1),newProg},Object.fromEntries(Object.entries(PR.t).map(([k,v])=>[k,+v.toFixed(1)]))));
  maxParts=Math.max(maxParts,WD.PARTS);
  if(window.__benchFrame)window.__benchFrame(f);
  if(f%60===0)await sleep(0);
}
const s=[...ms].sort((a,b)=>a-b),med=s[s.length>>1],p95=s[Math.floor(s.length*0.95)],p99=s[Math.floor(s.length*0.99)];
const slow=rows.filter(r=>r.ms>med*2).sort((a,b)=>b.ms-a.ms);
const avg={};for(const r of rows)for(const k in r)if(!['f','ms','parts','newProg'].includes(k))avg[k]=(avg[k]||0)+r[k]/rows.length;
const savg={};for(const r of slow)for(const k in r)if(!['f','ms','parts','newProg'].includes(k))savg[k]=(savg[k]||0)+r[k]/Math.max(1,slow.length);
const R=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,+v.toFixed(2)]).sort((a,b)=>b[1]-a[1]));
const progN=rows.filter(r=>r.newProg>0).length,progSlow=slow.filter(r=>r.newProg>0).length;
window.__bots={map,progN,progSlow,programs:gl.info.programs.length,frames:N,median:+med.toFixed(1),p95:+p95.toFixed(1),p99:+p99.toFixed(1),max:+s[s.length-1].toFixed(1),slowN:slow.length,maxParts,avg:R(avg),slowAvg:R(savg),newPrograms:Object.keys(NEWP).map(k=>NEWPF[k]+' '+k),worst:slow.slice(0,8),worstLate:slow.filter(r=>r.f>60).slice(0,10),over50:rows.filter(r=>r.f>60&&r.ms>50).length,over33:rows.filter(r=>r.f>60&&r.ms>33.4).length,errs:__errs.slice(0,5)};
console.log('bots bench',JSON.stringify(window.__bots));
})();
