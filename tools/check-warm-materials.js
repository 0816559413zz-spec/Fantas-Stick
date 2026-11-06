// Real-skill integration regression. Run once normally, and with &coldWarm=1
// to disable this patch's registrations and reproduce first-use compilation.
// node tools/headless.js --game --js tools/check-warm-materials.js --timeout 180 --quiet
const W=WD.warm,gl=WD.gl;
if(new URLSearchParams(location.search).has('coldWarm')){
  W.reg.pyro.splice(1);W.reg.earth.pop();W.reg.water.splice(-2);
}
document.getElementById('btnSolo').click();
for(let i=0;i<40&&WD.screen!=='lobby';i++)await HL.sleep(100);
HL.freeze();
WD.setKit(WD.G.players[WD.NET.myId],'0');
WD.addPlayer('warm-earth','earth',null,null,'6');
WD.addPlayer('warm-water','water',null,null,'8');
WD.broadcastLobby();WD.G.mode='ffa';WD.G.mapPick='meadow';WD.hostStart();
for(let i=0;i<1200;i++){
  HL.step(1);await HL.sleep(20);
  if(WD.G.ph==='play'&&!W.busy&&!W.q.length&&W.log.some(s=>s.startsWith('compile/upload')))break;
  if(i===1199)throw new Error('countdown warm-up did not finish');
}
// Place the actual characters together so both outlines are drawn.
const me=HL.me();
for(const [i,p] of Object.values(WD.G.players).entries()){p.x=me.x+i*45;p.y=me.y;p.hp=p.maxHp;}
HL.step(3);
const results=[];
function check(name,tag,trigger){
  const before=new Set(gl.info.programs);trigger();
  WD.render(1/60,performance.now());
  const used=new Set();
  WD.scene.traverse(o=>{if(!o.userData[tag])return;const p=gl.properties.get(o.material).currentProgram;if(p)used.add(p);});
  if(!used.size)throw new Error('outline not rendered: '+name);
  const ctx=gl.getContext();for(const p of used)if(!ctx.getProgramParameter(p.program,ctx.LINK_STATUS))throw new Error('shader failed to link: '+name);
  results.push({name,usedPrograms:used.size,newPrograms:[...used].filter(p=>!before.has(p)).length});
}
check('Aqua Cage: real character outline','wtOl',()=>WD.fxEv({k:'efx',z:'wtcage',x:me.x,y:me.y,id:me.id,n:'warm-water'}));
check('Dust Burst: real character outlines','eOl',()=>{WD.VIEW.cur.ED=[[1,me.x,me.y,500,3,99]];});
if(HL.errs.length)throw new Error(JSON.stringify(HL.errs));
const report={pass:results.every(r=>!r.newPrograms),cases:results,warm:W.log};
if(!report.pass)throw new Error('FIRST_USE_COMPILES '+JSON.stringify(report));
return report;
