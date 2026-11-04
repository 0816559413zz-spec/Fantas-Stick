// Local lifecycle smoke test for all nine modes. Fake room peers are local fixtures, not a network latency test.
await HL.solo({kit:'0'});const rows=[],failures=[],originalDraw=WD.composer.render;
const modes=['train','coop','duel','ffa','tdm','quid','race','br','imp'];
function pump(n,draw=true){if(!draw)WD.composer.render=()=>{};try{HL.step(n);}finally{WD.composer.render=originalDraw;}}
for(const mode of modes){
 WD.hostToLobby();
 for(const id of [...WD.G.order])if(id!==WD.NET.myId)WD.hostDrop(id);
 const count=mode==='imp'?4:2;
 for(let i=1;i<count;i++){const p=WD.addPlayer('audit-peer-'+i,'Audit '+i,null,null,String(i%2));p.lteam=i%2;}
 HL.me().lteam=0;HL.me().inp=WD.INPUT;HL.input({fire:0,sh:0,u:0,d:0,l:0,r:0,dh:0,hq:0});
 WD.G.mode=mode;WD.G.mapPick=mode==='race'?'meadow':'castle';WD.hostStart();
 if(WD.G.ph==='lobby'){failures.push({mode,type:'mode did not start',players:WD.G.order.length});continue;}
 for(let i=0;i<240;i+=30){pump(30,false);await HL.sleep(10);}
 for(let i=0;i<200&&(WD.warm.busy||WD.warm.q.length);i++){pump(2);await HL.sleep(30);}
 const p=HL.me(),I=p.inp={...WD.INPUT,c:{...WD.INPUT.c},u:0,mx:0,my:0,fire:0,sh:0,ax:p.x+300,ay:p.y,ah:1.2,gx:p.x+220,gy:p.y};
 const before=HL.errs.length,times=[];
 for(let frame=0;frame<180;frame++){
  I.mx=frame<60?1:0;I.my=0;I.u=frame<60?1:0;
  if(frame===60)I.fire=1;if(frame===66)I.fire=0;if(frame===90)I.c.q++;
  const t=performance.now();pump(1);times.push(performance.now()-t);if(frame%30===0)await HL.sleep(0);
 }
 if(HL.errs.length>before)failures.push({mode,type:'runtime error',errors:HL.errs.slice(before,before+2)});
 if(![p.x,p.y,p.z,WD.cam.position.x,WD.cam.position.y,WD.cam.position.z].every(Number.isFinite))failures.push({mode,type:'invalid position'});
 times.sort((a,b)=>a-b);
 rows.push({mode,map:WD.G.map,phase:WD.G.ph,players:WD.G.order.length,errors:HL.errs.length-before,frameMs:{median:+times[90].toFixed(1),p95:+times[171].toFixed(1),max:+times[179].toFixed(1)},memory:{...WD.gl.info.memory}});
}
const report={pass:!failures.length&&!HL.errs.length,modes:rows.length,localOnly:true,failures,rows,errors:[...new Set(HL.errs)].slice(0,5)};
if(!report.pass)throw new Error('MODE_LIFECYCLE '+JSON.stringify(report));
return report;
