// Match-start benchmark (OPTIMIZE.md): open http://localhost:8765/?nosw , then in the console:
//   eval(await (await fetch("tools/bench-start.js",{cache:"no-store"})).text()); then read window.__start after ~20 s
// Solo co-op: start → back to lobby → start, cycling maps; measures hostStart + first snapshot (map build) + the worst frame in the next 2 s.
(async()=>{
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const gl=WD.gl,ctx=gl.getContext(),px=new Uint8Array(4);
window.requestAnimationFrame=()=>0;
let now=performance.now();
function frame(){const t=performance.now();now+=1000/60;WD.render(1/60,now);ctx.readPixels(0,0,1,1,ctx.RGBA,ctx.UNSIGNED_BYTE,px);return performance.now()-t;}
document.getElementById('btnSolo').click();await sleep(1200);
for(let i=0;i<10;i++)frame();
const G=WD.G;G.mode='coop';
const seq=['castle','meadow','castle','meadow','castle','hogsmeade','castle'];
const rows=[];
for(const m of seq){
  G.mapPick=m;
  const t0=performance.now();WD.hostStart();const t1=performance.now();
  WD.hostStep(1/60);const t2=performance.now();          // onSnap → buildWorld (if map changed)
  // 2 s of frames with real time between them (async shader compile / deferred world add happen in here) → worst frame = the start hitch
  const fs=[];for(let i=0;i<40;i++){fs.push(frame());await sleep(50);}
  const later=frame();
  rows.push({map:m,hostStart:+(t1-t0).toFixed(1),snapBuild:+(t2-t1).toFixed(1),f1:+fs[0].toFixed(1),worst:+Math.max(...fs).toFixed(1),worstAt:fs.indexOf(Math.max(...fs)),later:+later.toFixed(1),geo:gl.info.memory.geometries,tex:gl.info.memory.textures,prog:gl.info.programs.length});
  WD.hostToLobby();for(let i=0;i<3;i++)frame();await sleep(200);
}
window.__start=rows;
})();
