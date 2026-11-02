// Six local peers, one per active class, using the real input/host/snapshot/render path.
// This measures local scene cost and errors; it does not simulate network latency.
await HL.solo({kit:'0'});WD.hostToLobby();
const paths=[0,1,2,6,7,8];
for(let i=1;i<paths.length;i++)WD.addPlayer('audit-party-'+i,'Audit '+paths[i],null,null,String(paths[i]));
WD.broadcastLobby();WD.G.mode='train';WD.hostStart();WD.G.tr.datk=0;WD.G.tr.mai=0;WD.G.tr.god=1;
for(let i=0;i<210;i++){HL.step(1);if(i%30===0)await HL.sleep(0);}
const until=performance.now()+25000;let settled=0;
while(performance.now()<until&&settled<3){HL.step(2);await HL.sleep(30);settled=!WD.warm.q.length&&!WD.warm.busy?settled+1:0;}
if(settled<3)throw new Error('PARTY_WARMUP_TIMEOUT');
const players=Object.values(WD.G.players),p0=HL.me(),origin={x:p0.x,y:p0.y};HL.aim(0,0.12);
for(let i=0;i<players.length;i++){const p=players[i];p.x=origin.x+(i%3)*60;p.y=origin.y+(Math.floor(i/3)-0.5)*100;p.ult=100;p.lst=5;p.wg=100;
 p.inp={...WD.INPUT,c:{...WD.INPUT.c},mx:0,my:0,u:0,d:0,l:0,r:0,sh:0,dh:0,hq:0,fire:0,ax:p.x+300,ay:p.y,ah:1.2,gx:p.x+220,gy:p.y};}
const foe=WD.G.en[0];if(foe){foe.x=foe.ax=origin.x+350;foe.y=foe.ay=origin.y;foe.hp=foe.maxHp=1e6;}
const times=[],calls=[],tris=[],materialChanges=[],beforePrograms=WD.gl.info.programs.length;
let knownPrograms=new Set(WD.gl.info.programs);
WD.gl.info.autoReset=false;const pictures=[];
try{for(let frame=0;frame<720;frame++){
 for(const p of players){const I=p.inp;I.fire=frame%45<5?1:0;
  if(frame===30)I.c.q++;if(frame===90)I.c.x++;if(frame===180)I.c.e++;if(frame===300)I.c.r++;if(frame===420)I.c.f++;
 }
 WD.gl.info.reset();const start=performance.now();HL.step(1);times.push(performance.now()-start);calls.push(WD.gl.info.render.calls);tris.push(WD.gl.info.render.triangles);
 const added=WD.gl.info.programs.filter(p=>!knownPrograms.has(p));
 if(added.length){const materials=[];
  for(const sc of [WD.scene,WD.post.fxScene])sc.traverse(o=>{for(const m of [].concat(o.material||[]))if(added.includes(WD.gl.properties.get(m).currentProgram)&&materials.length<8)materials.push({object:o.name,type:m.type,name:m.name,instanced:!!o.isInstancedMesh,opacity:m.opacity,color:m.color&&m.color.getHexString(),uniforms:Object.keys(m.uniforms||{})});});
  materialChanges.push({frame,workMs:+times[times.length-1].toFixed(1),programs:added.map(p=>p.name),materials});knownPrograms=new Set(WD.gl.info.programs);
 }
 if(frame===180)pictures.push({c:HL.snap(640),label:'ผู้เล่น6สายใช้สกิลพร้อมกัน'});
 if(frame%30===0)await HL.sleep(0);
}}finally{WD.gl.info.autoReset=true;}
for(const p of players){p.inp.fire=0;p.inp.hq=0;}
const comp=WD.composer,draw=comp.render;comp.render=()=>{};try{for(let f=0;f<1200;f+=60){HL.step(60);await HL.sleep(0);}}finally{comp.render=draw;}HL.step(3);
const pct=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return +s[Math.min(s.length-1,Math.floor(s.length*p))].toFixed(1);};
const errors=[...new Set(HL.errs)],report={pass:!errors.length,players:players.length,frames:times.length,localOnly:true,frameWorkMs:{median:pct(times,.5),p95:pct(times,.95),p99:pct(times,.99),max:pct(times,1)},over50ms:times.filter(t=>t>50).length,drawCalls:{median:pct(calls,.5),max:pct(calls,1)},triangles:{median:pct(tris,.5),max:pct(tris,1)},programs:{before:beforePrograms,after:WD.gl.info.programs.length},materialChanges,resources:{...WD.gl.info.memory},errors};
if(!report.pass)throw new Error('PARTY_BENCH '+JSON.stringify(report));
return {...report,images:{night_party_peak:HL.sheet(pictures,1,'ตรวจฉากผู้เล่น6สาย')}};
