// Heavy-scene benchmark (OPTIMIZE.md): open http://localhost:8765/?nosw , then in the console:
//   eval(await (await fetch("tools/bench-heavy.js",{cache:"no-store"})).text()); then read window.__bench after ~30 s
// Solo + 5 bots, castle, coop wave 5 (dragon boss), all players casting every slot for 300 frames.
(async()=>{
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
window.__errs=[];window.addEventListener('error',e=>__errs.push(e.message));
const gl=WD.gl,ctx=gl.getContext(),px=new Uint8Array(4);
window.requestAnimationFrame=()=>0;
gl.info.autoReset=false;
let now=performance.now();
function frame(){const t=performance.now();now+=1000/60;gl.info.reset();WD.render(1/60,now);ctx.readPixels(0,0,1,1,ctx.RGBA,ctx.UNSIGNED_BYTE,px);return performance.now()-t;}
const mem=()=>({geo:gl.info.memory.geometries,tex:gl.info.memory.textures,prog:gl.info.programs.length});
const med=a=>{const s=[...a].sort((x,y)=>x-y);return +s[s.length>>1].toFixed(2);};
const p95=a=>{const s=[...a].sort((x,y)=>x-y);return +s[Math.floor(s.length*0.95)].toFixed(2);};
const R={};
document.getElementById('btnSolo').click();await sleep(1500);
for(let i=0;i<20;i++)frame();
const m0=mem();
// lobby join: 5 bots (coop max 6)
let t0=performance.now();
for(let i=1;i<=5;i++)WD.addPlayer('bot'+i,'Bot'+i);
WD.broadcastLobby();
const joinFrame=frame();
R.lobbyJoin={jsMs:+(performance.now()-t0).toFixed(1),firstFrame:+joinFrame.toFixed(1),dGeo:mem().geo-m0.geo,dTex:mem().tex-m0.tex,dProg:mem().prog-m0.prog};
for(let i=0;i<10;i++)frame();
// match
WD.G.mode='coop';WD.G.mapPick='castle';
t0=performance.now();WD.hostStart();
const ms0=[];for(let i=0;i<5;i++)ms0.push(frame());
R.matchStart={hostStartMs:+(performance.now()-t0).toFixed(1),firstFrames:ms0.map(x=>+x.toFixed(1)),mem:mem()};
const G=WD.G;
for(const p of Object.values(G.players)){p.hp=p.mhp=1e6;}
// jump to boss wave
G.wave=Math.max(G.wave,4);
for(let i=0;i<3000&&!(G.wave>=5&&G.ph==='play'&&G.en.length);i++){if(G.wave<5){G.queue=[];G.en=[];}if(G.ph==='buff')G.buffT=0;WD.hostStep(1/60);if(i%10==0)frame();}
for(let i=0;i<120;i++){WD.hostStep(1/60);if(i%3==0)frame();}
R.bossWave={wave:G.wave,ph:G.ph,enemies:G.en.map(e=>e.type)};
// steady heavy: all players cast every slot when ready, 300 frames
const P=Object.values(G.players);const ts=[];let calls=[],tris=[];
for(let i=0;i<300;i++){
  for(const p of P){p.hp=p.mhp;for(let s=0;s<4;s++)WD.castSlot(p,s);if(i%60==0){p.ult=100;WD.castUlt(p);}}
  WD.hostStep(1/60);
  ts.push(frame());calls.push(gl.info.render.calls);tris.push(gl.info.render.triangles);
}
R.heavy={players:P.length,enemies:G.en.length,parts:WD.PARTS,frameMed:med(ts),frameP95:p95(ts),frameMax:+Math.max(...ts).toFixed(1),callsMed:med(calls),callsMax:Math.max(...calls),trisMed:med(tris),mem:mem()};
R.errs=__errs.slice(0,5);
window.__bench=R;
})();
