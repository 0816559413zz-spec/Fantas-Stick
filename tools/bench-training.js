// วัดเฟรมค้างในห้องฝึกจริง ไม่ใช้จำนวน requestAnimationFrame ของ headless เป็น FPS.
// node tools/headless.js --game --js tools/bench-training.js --timeout 240 --quiet
// ?bench=turn&static=1 = การทดสอบ shader บ้านตอนเปิดมุมใหม่ • ?bench=basic = ยิงครั้งแรก
// ?gpu=0 ปิด GPU timer • ?probe=1 แยกเวลา host/render • ?kit=0 ใช้สายไฟแทน Water
const water=WD.PATHS.findIndex(p=>p.id==='water');
if(water<0)throw new Error('Water path not found');
const options=new URLSearchParams(location.search),suite=options.get('bench')||'all';
let randomSeed=1162;Math.random=()=>{randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296;};
await HL.solo({mode:'train',kit:options.get('kit')||String(water)});
await HL.sleep(1000);
const warmDeadline=performance.now()+16000;let settled=0;
while(performance.now()<warmDeadline&&settled<5){HL.step(2);await HL.sleep(40);settled=!WD.warm.q.length&&!WD.warm.busy?settled+1:0;}
if(settled<5)throw new Error('TRAINING_WARMUP_NOT_READY '+JSON.stringify({queue:WD.warm.q,busy:WD.warm.busy,log:WD.warm.log.slice(-6)}));
await HL.sleep(500);HL.step(20);
const renderer=WD.gl,ctx=renderer.getContext(),timer=options.get('gpu')==='0'?null:ctx.getExtension('EXT_disjoint_timer_query_webgl2');
const warmState={log:WD.warm.log.slice()};
const debug=ctx.getExtension('WEBGL_debug_renderer_info'),queries=[],samples=[];
const originalRender=WD.render;
const originalProfileOn=WD.PROF.on;
if(options.has('probe'))WD.PROF.on=true;
const materialChanges=[];
let currentPhase='',renderCpu=0,drawCalls=0,triangles=0;
renderer.info.autoReset=false;
WD.render=(dt,now)=>{
 renderer.info.reset();const query=timer?ctx.createQuery():null;
 if(query)ctx.beginQuery(timer.TIME_ELAPSED_EXT,query);
 const start=performance.now();originalRender(dt,now);renderCpu=performance.now()-start;
 if(query){ctx.endQuery(timer.TIME_ELAPSED_EXT);queries.push({query,phase:currentPhase});}
 drawCalls=renderer.info.render.calls;triangles=renderer.info.render.triangles;
};
const percentile=(a,q)=>{const sorted=[...a].sort((x,y)=>x-y);return +(sorted[Math.min(sorted.length-1,Math.floor(sorted.length*q))]||0).toFixed(3);};
function frame(action){
 if(action)action();if(WD.PROF.on){WD.PROF.t={};WD.PROF.n={};}const beforePrograms=options.get('static')==='1'?new Set(renderer.info.programs):null,start=performance.now();HL.step(1);const total=performance.now()-start;
 samples.push({phase:currentPhase,total,render:renderCpu,calls:drawCalls,triangles,profile:WD.PROF.on?{...WD.PROF.t}:null});
 if(beforePrograms){const added=renderer.info.programs.filter(p=>!beforePrograms.has(p));if(added.length){const materials=[];
  if(options.has('detail'))for(const sc of [WD.scene,WD.post.fxScene])sc.traverse(o=>{for(const m of [].concat(o.material||[]))if(added.includes(renderer.properties.get(m).currentProgram)&&materials.length<5)materials.push({type:m.type,instanced:!!o.isInstancedMesh,opacity:m.opacity,color:m.color&&m.color.getHexString(),uniforms:Object.keys(m.uniforms||{}),vertex:m.vertexShader&&m.vertexShader.slice(0,90),fragment:m.fragmentShader&&m.fragmentShader.slice(0,90)});});
  materialChanges.push({phase:currentPhase,frame:samples.filter(s=>s.phase===currentPhase).length-1,programs:added.map(p=>({name:p.name})),materials});
 }}
}
const phaseInfo=[];
async function phase(name,count,begin,action){
 currentPhase=name;if(begin)begin();
 const before={programs:renderer.info.programs.length,...renderer.info.memory};
 for(let i=0;i<count;i++){frame(()=>action&&action(i));if(i%30===29)await HL.sleep(0);}
 phaseInfo.push({name,before,after:{programs:renderer.info.programs.length,...renderer.info.memory}});
}
try{
 if(suite==='all'||suite==='idle')await phase('idle',150);
 if(suite==='all'||suite==='walk')await phase('walk_and_turn',150,()=>HL.input({u:true}),i=>HL.aim(i*.015));HL.input({u:false});
 if(suite==='turn'){
  await phase('turn_only',150,null,i=>HL.aim(i*.015));
  if(options.get('repeat')==='1')await phase('turn_repeat',150,()=>HL.aim(0),i=>HL.aim(i*.015));
 }
 if(suite==='move')await phase('move_only',150,()=>HL.input({u:true}));HL.input({u:false});
 if(suite==='all'||suite==='basic')await phase('basic_attack',150,()=>HL.input({fire:true}));HL.input({fire:false});
 // ใช้ slot จริงของ Water ที่เลือกไว้ในห้องฝึก ไม่เปลี่ยนจำนวนดาเมจ/เวลา.
 const me=HL.me(),beam=me.kitIds.findIndex(id=>WD.SPELLS[id]&&/beam|abyss/i.test(String(WD.SPELLS[id].name||WD.SPELLS[id].n||WD.SPELLS[id].id||'')));
 if((suite==='all'||suite==='beam')&&beam>=0)await phase('beam',240,()=>{for(const k of Object.keys(me.cd))me.cd[k]=0;WD.castSlot(me,beam);});
 if(suite==='all'||suite==='dragon')await phase('dragon',240,()=>{me.ult=100;WD.castUlt(me);});
}finally{WD.render=originalRender;renderer.info.autoReset=true;WD.PROF.on=originalProfileOn;}
ctx.flush();const gpu={};
for(let retry=0;timer&&retry<100&&queries.some(q=>!q.done);retry++){
 await HL.sleep(10);
 for(const q of queries)if(!q.done&&ctx.getQueryParameter(q.query,ctx.QUERY_RESULT_AVAILABLE)){
  if(!ctx.getParameter(timer.GPU_DISJOINT_EXT))(gpu[q.phase]||(gpu[q.phase]=[])).push(ctx.getQueryParameter(q.query,ctx.QUERY_RESULT)/1e6);
  ctx.deleteQuery(q.query);q.done=true;
 }
}
for(const q of queries)if(!q.done)ctx.deleteQuery(q.query);
const phases=phaseInfo.map(info=>{
 const rows=samples.filter(s=>s.phase===info.name),total=rows.map(s=>s.total),render=rows.map(s=>s.render),gpuTimes=gpu[info.name]||[];
 return{...info,frames:rows.length,totalMs:{median:percentile(total,.5),p95:percentile(total,.95),p99:percentile(total,.99),max:percentile(total,1)},renderCpuMs:{median:percentile(render,.5),p95:percentile(render,.95)},gpuMs:{median:percentile(gpuTimes,.5),p95:percentile(gpuTimes,.95),samples:gpuTimes.length},over50ms:total.filter(ms=>ms>50).length,slowFrames:rows.map((r,i)=>({frame:i,ms:+r.total.toFixed(2),profile:r.profile})).filter(r=>r.ms>50),drawCallsMedian:percentile(rows.map(s=>s.calls),.5),trianglesMedian:percentile(rows.map(s=>s.triangles),.5)};
});
const report={map:HL.info().map,kit:HL.info().kit,renderer:debug?ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL):ctx.getParameter(ctx.RENDERER),viewport:{width:renderer.domElement.width,height:renderer.domElement.height},quality:WD.QUAL,warmState,phases,materialChanges,errors:HL.errs.slice(0,5)};
const stutters=phases.reduce((n,p)=>n+p.over50ms,0),lateStaticPrograms=materialChanges.flatMap(c=>c.programs).filter(p=>p.name==='house_mat');report.pass=stutters===0&&lateStaticPrograms.length===0&&HL.errs.length===0;report.stutterFrames=stutters;report.lateStaticPrograms=lateStaticPrograms.length;
if(!report.pass)throw new Error('TRAINING_FRAME_STUTTER '+JSON.stringify(report));
return report;
