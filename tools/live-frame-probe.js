// Opt-in diagnostics for the visible game (no gameplay changes, no automatic upload/download).
// Console: eval(await (await fetch('/tools/live-frame-probe.js')).text()); WD.frameProbe.start(60)
// After playing: WD.frameProbe.last / WD.frameProbe.download()
(()=>{
 if(!window.WD)throw new Error('Open the game first');
 if(WD.frameProbe&&WD.frameProbe.running)WD.frameProbe.stop();
 let state=null,raf=0,timer=0,observer=null;
 const percentile=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s.length?+s[Math.min(s.length-1,Math.floor(s.length*p))].toFixed(2):null;};
 function snapshot(){const v=WD.VIEW.cur,p=v&&v.P.find(p=>p.id===WD.NET.myId);return {mode:v?v.mode:WD.G&&WD.G.mode,map:WD.MAPID,path:p?(p.wt?'water':p.wn?'wind':p.ea?'earth':p.sm?'storm':p.fr?'frost':'pyro'):null,resources:{...WD.gl.info.memory},programs:WD.gl.info.programs.length,fx:WD.fx.R.inst.length,heapMB:performance.memory?+(performance.memory.usedJSHeapSize/1048576).toFixed(1):null};}
 function tick(t){
  if(!state)return;
  if(document.hidden){state.previous=null;state.hiddenCallbacks++;}
  else{if(state.previous!==null){const dt=t-state.previous;state.frames.push(dt);if(dt>50&&state.slow.length<120)state.slow.push({at:+(t-state.start).toFixed(1),ms:+dt.toFixed(2),...snapshot()});}state.previous=t;}
  if(state.frames.length<36000)raf=requestAnimationFrame(tick);else api.stop();
 }
 const api=WD.frameProbe={last:null,get running(){return !!state;},
  start(seconds=60){
   if(state)api.stop();const start=performance.now();
   state={start,startedAt:new Date().toISOString(),before:snapshot(),previous:null,frames:[],slow:[],longTasks:[],hiddenCallbacks:0};
   if(typeof PerformanceObserver!=='undefined'&&(PerformanceObserver.supportedEntryTypes||[]).includes('longtask')){
    observer=new PerformanceObserver(list=>{if(state)for(const e of list.getEntries())if(state.longTasks.length<120)state.longTasks.push({at:+(e.startTime-state.start).toFixed(1),ms:+e.duration.toFixed(2)});});observer.observe({type:'longtask'});
   }
   raf=requestAnimationFrame(tick);timer=setTimeout(()=>api.stop(),Math.max(1,Math.min(600,seconds))*1000);return {running:true,seconds};
  },
  stop(){
   if(!state)return api.last;cancelAnimationFrame(raf);clearTimeout(timer);if(observer){observer.disconnect();observer=null;}
   const s=state;state=null;
   api.last={startedAt:s.startedAt,elapsedSeconds:+((performance.now()-s.start)/1000).toFixed(2),visibleFrames:s.frames.length,hiddenCallbacks:s.hiddenCallbacks,frameIntervalMs:{median:percentile(s.frames,.5),p95:percentile(s.frames,.95),p99:percentile(s.frames,.99),max:percentile(s.frames,1)},over50ms:s.frames.filter(n=>n>50).length,before:s.before,after:snapshot(),slow:s.slow,longTasks:s.longTasks};return api.last;
  },
  download(){const report=api.stop();if(!report)return null;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='fantas-stick-frame-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return report;}
 };
})();
