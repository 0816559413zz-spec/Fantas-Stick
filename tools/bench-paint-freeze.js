// Painterly mid-match shader compiles (2026-11-23): siege on fcs-file with lobby bots, counts programs created after the
// lobby/countdown warm-up and frames slower than 150 ms. Run: python tools/serve.py   then
//   node tools/headless.js --game --js tools/bench-paint-freeze.js --timeout 300 --quiet
const sleep=HL.sleep,G=()=>WD.G;
document.getElementById('btnSolo').click();
for(let i=0;i<60&&WD.screen!=='lobby';i++)await sleep(100);
G().mode='siege';G().mapPick='fcs-file';WD.broadcastLobby&&WD.broadcastLobby();
for(let i=0;i<11;i++)WD.lobbyBotAdd(-1,1);
await sleep(9000);   // lobby warm-up (gameWarmTick) on the real loop
const pg0=WD.gl.info.programs.length;
const gaps=[];let lt=performance.now(),run=true;(function lp(){const n=performance.now();if(n-lt>150)gaps.push({ph:G().ph,ms:Math.round(n-lt),pg:WD.gl.info.programs.length});lt=n;if(run)requestAnimationFrame(lp);})();
WD.hostStart();
for(let i=0;i<150&&WD.screen!=='game';i++)await sleep(100);
for(let i=0;i<150&&G().ph!=='play';i++)await sleep(100);   // countdown warm-up on the real loop
await sleep(6000);run=false;
const pgStart=WD.gl.info.programs.length;var old=WD.gl.info.programs.slice(),names=new Set(WD.gl.info.programs.map(p=>p.name+'|'+p.cacheKey.length));
HL.freeze();
const slow=[],grow=[];let pg=pgStart;
for(let f=0;f<(window.__o&&__o.n||3600);f++){const t=performance.now();HL.step(1);const ms=performance.now()-t;
  const n=WD.gl.info.programs.length;if(n>pg){const P=WD.gl.info.programs.slice(pg);grow.push({f,add:n-pg,ms:Math.round(ms),who:ms>150?P.map(p=>{const a=p.cacheKey.split(',');let best=null,bd=1e9;for(const q of old){const b=q.cacheKey.split(',');if(b.length!==a.length)continue;let d=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])d++;if(d<bd){bd=d;best=b;}}return (p.name||'?')+' len'+a.length+' '+(best?a.map((v,i)=>v!==best[i]?i+':'+String(best[i]).slice(0,24)+'>'+String(v).slice(0,24):null).filter(Boolean).slice(0,8).join(' '):'new');}):undefined});pg=n;}
  if(ms>150)slow.push({f,ms:Math.round(ms)});if(f%10===0)await sleep(0);}
const fresh=WD.gl.info.programs.filter(p=>!names.has(p.name+'|'+p.cacheKey.length)).map(p=>p.name+' '+((p.cacheKey.match(/\|pt2\w/)||[''])[0])+' key'+p.cacheKey.length).slice(0,40);
const dif=WD.gl.info.programs.filter(p=>!old.includes(p)).slice(0,12).map(p=>{const a=p.cacheKey.split(',');let best=null,bd=1e9;for(const q of old){const b=q.cacheKey.split(',');if(b.length!==a.length)continue;let d=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])d++;if(d<bd){bd=d;best=b;}}
  return p.name+': '+(best?a.map((v,i)=>v!==best[i]?i+':'+String(best[i]).slice(0,30)+'>'+String(v).slice(0,30):null).filter(Boolean).join(' '):'no same-length '+a.length);});
return {dif,gaps,paint:WD.PAINT.cur,lobbyPg:pg0,startPg:pgStart,endPg:WD.gl.info.programs.length,grow,slow,fresh,errs:HL.errs.slice(0,5),players:Object.keys(G().players).length};
