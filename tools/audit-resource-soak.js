// Repeat one real skill, allow effects to expire, then compare retained resources.
// CPU work samples are full renders. Cleanup frames still update the game but omit compositor drawing.
// ?soak=dragondeep&cycles=16 or ?soak=abyssalbeam&cycles=24
const q=new URLSearchParams(location.search),id=q.get('soak')||'dragondeep',S=WD.SPELLS[id],cycles=+(q.get('cycles')||16);
if(!S)throw new Error('Unknown soak skill '+id);
await HL.solo({kit:S.path+'.'+S.i});
const comp=WD.composer,draw=comp.render;
function step(n,render=true){if(!render)comp.render=()=>{};try{HL.step(n);}finally{comp.render=draw;}}
for(let i=0;i<200;i++){step(2);await HL.sleep(30);if(i>30&&!WD.warm.busy&&!WD.warm.q.length)break;}
await HL.sleep(500);HL.aim(0,0.12);step(30);
const p=HL.me(),origin={x:p.x,y:p.y},I=p.inp={...WD.INPUT,c:{...WD.INPUT.c},u:0,d:0,l:0,r:0,mx:0,my:0,fire:0,sh:0,hq:1,ax:p.x+350,ay:p.y,ah:1.2,gx:p.x+300,gy:p.y};
if(WD.G.tr){WD.G.tr.datk=0;WD.G.tr.mai=0;WD.G.tr.god=1;}
const foe=WD.G.en[0];if(foe){foe.x=foe.ax=p.x+350;foe.y=foe.ay=p.y;foe.hp=foe.maxHp=100000;}
function metrics(){
 let objects=0;for(const sc of [WD.scene,WD.post.fxScene])sc.traverse(()=>objects++);
 return {...WD.gl.info.memory,programs:WD.gl.info.programs.length,objects,fx:WD.fx.R.inst.length,parts:WD.PARTS,heapMB:performance.memory?+(performance.memory.usedJSHeapSize/1048576).toFixed(1):null,dragonLive:WD.WDG.live.length,dragonPool:WD.WDG.pool.length};
}
const rows=[],failures=[],start=performance.now();window.__resourceSoak={id,cycle:0,rows};
for(let cycle=0;cycle<cycles;cycle++){
 window.__resourceSoak.cycle=cycle;document.title='Resource audit '+id+' '+(cycle+1)+'/'+cycles;
 p.x=origin.x;p.y=origin.y;p.vx=p.vy=0;p.ult=100;p.lst=5;I.fire=0;I.hq=1;for(const k in p.cd)p.cd[k]=0;
 const ok=S.ult?WD.castUlt(p):WD.castSlot(p,0);if(ok===false&&!p.aug)failures.push({cycle,type:'cast rejected'});
 const times=[],active=id==='dragondeep'?420:330;
 for(let frame=0;frame<active;frame++){
  if(id==='dragondeep')I.fire=frame===90?1:0;
  if(id==='moonwater')I.fire=1;
  if(id==='terraauger'&&frame===150)I.hq=0;
  const t=performance.now();step(1);times.push(performance.now()-t);
  if(frame%30===0)await HL.sleep(0);
 }
 I.fire=0;I.hq=0;
 for(let frame=0;frame<1080;frame+=60){step(60,false);await HL.sleep(0);}step(3);
 const m=metrics(),sorted=times.sort((a,b)=>a-b);
 rows.push({cycle,...m,frameMs:{median:+sorted[sorted.length>>1].toFixed(1),p95:+sorted[Math.floor(sorted.length*.95)].toFixed(1),max:+sorted[sorted.length-1].toFixed(1)}});
 if(m.dragonLive||p.wab||p.wdg||p.aug)failures.push({cycle,type:'ability or dragon did not end',dragonLive:m.dragonLive,beam:!!p.wab,dragon:!!p.wdg,auger:!!p.aug});
 if(HL.errs.length)break;
}
const stable=rows.slice(2),first=stable[0],last=stable[stable.length-1],growth={};
if(first&&last)for(const key of ['geometries','textures','programs','objects','fx','parts','heapMB'])growth[key]=+(last[key]-first[key]).toFixed(1);
// Initial pool/cache growth is expected. A rising geometry/texture count on every settled repeat is not.
for(const key of ['geometries','textures'])if(stable.length>=5&&growth[key]>32&&stable.every((r,i)=>!i||r[key]>stable[i-1][key]))failures.push({type:'resources grow every settled repeat',key,growth:growth[key]});
const report={id,pass:!failures.length&&!HL.errs.length,cycles:rows.length,seconds:+((performance.now()-start)/1000).toFixed(1),growth,failures,rows,errors:[...new Set(HL.errs)].slice(0,5)};
if(!report.pass)throw new Error('RESOURCE_SOAK '+JSON.stringify(report));
return report;
