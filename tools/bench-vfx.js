// VFX stress benchmark (Storm/Pyro/Frost effects): open http://localhost:8765/?nosw , then in the console:
//   eval(await (await fetch("tools/bench-vfx.js",{cache:"no-store"})).text()); then read window.__vfx after ~40 s
// Solo + 5 bots (2 Storm, 2 Pyro, 2 Frost incl. you), FFA, everyone casts every slot + ult in a loop for 600 frames.
(async()=>{
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
window.__errs=[];window.addEventListener('error',e=>__errs.push(e.message));
const gl=WD.gl,ctx=gl.getContext(),px=new Uint8Array(4);
window.requestAnimationFrame=()=>0;
let now=performance.now();
gl.info.autoReset=false;const calls=[];
function frame(){const t=performance.now();now+=1000/60;WD.hostStep(1/60);gl.info.reset();WD.render(1/60,now);calls.push(gl.info.render.calls);ctx.readPixels(0,0,1,1,ctx.RGBA,ctx.UNSIGNED_BYTE,px);return performance.now()-t;}
const med=a=>{const s=[...a].sort((x,y)=>x-y);return +s[s.length>>1].toFixed(2);};
const p95=a=>{const s=[...a].sort((x,y)=>x-y);return +s[Math.floor(s.length*0.95)].toFixed(2);};
document.getElementById('btnSolo').click();await sleep(1200);
for(let i=1;i<=5;i++)WD.addPlayer('bot'+i,'Bot'+i);
WD.broadcastLobby();WD.G.mode='ffa';WD.hostStart();await sleep(3500);
const fk=WD.SPELL_LIST.filter(s=>s.path===1&&!s.ult).map(s=>s.i);
const kits=['2.12.13.14.36','0.0.1.2.3','1.'+fk.slice(0,4).join('.'),'2.15.16.13.14','0.4.1.2.3','1.'+fk.slice(2,6).join('.')];
const P=Object.values(WD.G.players);P.forEach((p,i)=>{WD.setKit(p,kits[i%kits.length]);p.bot=p.id!=='me';p.x=900+(i%3)*160;p.y=700+Math.floor(i/3)*160;});
WD.PROF.on=true;WD.PROF.t={};WD.PROF.n={};
const ms=[];let maxParts=0;
for(let f=0;f<600;f++){
  if(f%45===0&&f<600)P.forEach(p=>{p.cd={q:0,e:0,r:0,f:0,basic:0,dodge:0};p.lst=5;p.hp=p.maxHp;p.alive=true;for(let i=0;i<4;i++)if(Math.random()<0.5)WD.castSlot(p,i);if(f%180===0){p.ult=100;WD.castUlt(p);}});
  ms.push(frame());maxParts=Math.max(maxParts,WD.PARTS);
}
const prof={};for(const k in WD.PROF.t)prof[k]=+(WD.PROF.t[k]/Math.max(1,WD.PROF.n[k])).toFixed(2);
for(let i=0;i<240;i++)frame();const geoIdle=gl.info.memory.geometries;
window.__vfx={geoIdle,median:med(ms),p95:p95(ms),max:+Math.max(...ms).toFixed(1),maxParts,prof,mem:{geo:gl.info.memory.geometries,tex:gl.info.memory.textures},calls:{median:med(calls),max:Math.max(...calls)},errs:__errs.slice(0,5)};
console.log('VFX bench',JSON.stringify(window.__vfx));
})();
