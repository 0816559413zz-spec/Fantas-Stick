// Audit real gameplay/animation transitions. Rendering is skipped only while settling;
// timing samples use full rendering and are frame work times, not displayed FPS.
// node tools/headless.js --game --url "index.html?nosw&auditOnly=abyssalbeam" --js tools/audit-night.js --timeout 300 --quiet
const query=new URLSearchParams(location.search),only=query.get('auditOnly');
let seed=61101;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
await HL.solo({kit:'0'});
const compositor=WD.composer,draw=compositor.render,rows=[],failures=[],started=performance.now();
function step(n,render=true){
 if(!render)compositor.render=()=>{};
 try{HL.step(n);}finally{compositor.render=draw;}
}
async function settle(n){for(let i=0;i<n;i+=60){step(Math.min(60,n-i),false);await HL.sleep(0);}step(2);}
async function ready(){
 const end=performance.now()+20000;let good=0;
 while(performance.now()<end&&good<3){step(2);await HL.sleep(30);good=!WD.warm.busy&&!WD.warm.q.length?good+1:0;}
 if(good<3)throw new Error('AUDIT_WARMUP_TIMEOUT '+JSON.stringify(WD.warm.q));
}
function input(p){return p.inp={...WD.INPUT,c:{...WD.INPUT.c},u:0,d:0,l:0,r:0,mx:0,my:0,sh:0,fire:0,dh:0,hq:0,ax:p.x+220,ay:p.y,ah:1.2,gx:p.x+220,gy:p.y};}
async function setup(path,spell){
 HL.cam(null);HL.input({fire:0,sh:0,dh:0,hq:0,u:0,d:0,l:0,r:0});WD.hostToLobby();
 const p=HL.me();p.inp=WD.INPUT;WD.setKit(p,spell&&!spell.ult?path+'.'+spell.i:String(path));p.kt=p.kit;WD.broadcastLobby();WD.hostStart();
 if(WD.G.tr){WD.G.tr.datk=0;WD.G.tr.mai=0;WD.G.tr.god=1;}
 await settle(210);await ready();HL.aim(0,0.12);step(12);input(p);p.lst=5;p.ult=100;
 const foe=WD.G.en[0];if(foe){foe.x=foe.ax=p.x+180;foe.y=foe.ay=p.y;foe.brn=3;foe.brnT=10;}
 return p;
}
function pose(){const o=HL.o();return [o.armR.rotation.x,o.armR.rotation.z,o.armL.rotation.x,o.armL.rotation.z,o.b.rotation.x,o.b.rotation.y,o.b.rotation.z,o.legs[0].rotation.x,o.legs[1].rotation.x];}
function active(p){return Object.fromEntries(['dfall','sdome','rail','aug','ecb','ramp','wr','wab','wdg','wfw','wdr','colos','god','hover','dash','breath'].filter(k=>typeof p[k]==='number'?p[k]>0:!!p[k]).map(k=>[k,typeof p[k]==='object'?p[k].ph||true:+p[k].toFixed(2)]));}
const pathways=WD.PATHS.map((p,i)=>({...p,index:i})).filter(p=>!p.off);
const jobs=pathways.flatMap(path=>[
 ...['basic','shield','dash'].map(kind=>({path:path.index,id:kind+'_'+path.id,kind})),
 ...WD.SPELL_LIST.filter(s=>s.path===path.index).map(spell=>({path:path.index,id:spell.id,spell}))
]).filter(j=>!only||j.id===only);
for(const job of jobs){
 const p=await setup(job.path,job.spell),I=p.inp,base=pose(),times=[];let deviation=0,ok=true;
 const beforeErrors=HL.errs.length;
 if(job.kind==='basic')I.fire=1;
 else if(job.kind==='shield')I.sh=1;
 else if(job.kind==='dash'){I.dh=1;I.c.sp++;}
 else{I.hq=1;ok=job.spell.ult?WD.castUlt(p):WD.castSlot(p,0);}
 const accepted=ok!==false||!!(p.aug||p.ramp||p.ecb);
 if(!accepted)failures.push({id:job.id,type:'cast rejected'});
 for(let f=0;f<48;f++){
  if(job.kind==='basic'&&(job.path===0||job.path===6))I.fire=f%24<5?1:0;
  if(job.kind==='dash'&&f===25)I.dh=0;
  const at=performance.now();step(1);times.push(performance.now()-at);
  const P=pose();if(!P.every(Number.isFinite))failures.push({id:job.id,type:'invalid pose'});
  deviation=Math.max(deviation,...P.map((x,i)=>Math.abs(x-base[i])));
  if(f%12===0)await HL.sleep(0);
 }
 const during=active(p);
 let interrupted=null;
 const cancellable={dragonfall:'dfall',stormdome:'sdome',terraauger:'aug',abyssalbeam:'wab'};
 if(cancellable[job.id]){p.stun=0.5;step(8);interrupted=!p[cancellable[job.id]];if(!interrupted)failures.push({id:job.id,type:'cast did not cancel on stun',active:active(p)});p.stun=0;}
 // Changing class is a real supported training operation. Leave physics to land normally.
 const next=job.path===0?8:0;WD.setKit(p,String(next));p.kt=p.kit;WD.broadcastLobby();input(p);
 await settle(150);
 const after=active(p),floor=WD.groundH(p.x,p.y,p.z),o=HL.o();
 const stale=Object.keys(after).length||o.caN||o.wBeamPose||o.wnPose;
 if(stale)failures.push({id:job.id,type:'state remained after class change',active:after,ca:o.caN,water:!!o.wBeamPose,wind:!!o.wnPose});
 if(!Number.isFinite(p.z)||p.z>floor+0.15)failures.push({id:job.id,type:'did not land after class change',z:p.z,floor});
 if(HL.errs.length>beforeErrors)failures.push({id:job.id,type:'game error',errors:HL.errs.slice(beforeErrors,beforeErrors+2)});
 const sorted=times.sort((a,b)=>a-b);
 rows.push({id:job.id,accepted,motion:+deviation.toFixed(3),during,interrupted,clean:!stale,frameMs:{p50:+sorted[24].toFixed(1),p95:+sorted[45].toFixed(1),max:+sorted[47].toFixed(1)}});
}
const report={pass:!failures.length,cases:rows.length,seconds:+((performance.now()-started)/1000).toFixed(1),failures,rows,errors:[...new Set(HL.errs)].slice(0,6)};
if(!report.pass)throw new Error('NIGHT_AUDIT '+JSON.stringify(report));
return report;
