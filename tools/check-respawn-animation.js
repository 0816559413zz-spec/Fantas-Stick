// A cast interrupted by death must not restart its old character pose on respawn.
const id=new URLSearchParams(location.search).get('deathSkill')||'eyeofheaven',S=WD.SPELLS[id];
await HL.solo({kit:S.path+'.'+S.i});await HL.sleep(1000);HL.step(90);
const p=HL.me();WD.G.tr.god=0;WD.G.tr.datk=0;p.ult=100;p.lst=5;
const I=p.inp={...WD.INPUT,c:{...WD.INPUT.c},mx:0,my:0,fire:0,sh:0,hq:1,ax:p.x+250,ay:p.y,ah:1.2,gx:p.x+200,gy:p.y};
const ok=S.ult?WD.castUlt(p):WD.castSlot(p,0);if(ok===false&&!p.aug)throw new Error('Cannot cast '+id);
HL.step(id==='abyssalbeam'?120:15);
const o=HL.o(),before={cast:o.caN,water:!!o.wBeamPose,wind:!!o.wnPose};
WD.damage(p,10000,null,'aoe');HL.step(1);if(p.alive)throw new Error('Death fixture did not kill player');
let respawned=false;
for(let frame=0;frame<420;frame++){HL.step(1);if(p.alive){respawned=true;break;}if(frame%30===0)await HL.sleep(0);}
if(!respawned)throw new Error('Player did not respawn');
const after={cast:o.caN,water:!!o.wBeamPose,windWeight:o.wnPose?o.wnPose.w:0,waterWeight:o.wBeamPose?o.wBeamPose.w:0,wingUlt:o.wWings?o.wWings.userData.ul:-1,wingFlick:o.wWings?o.wWings.userData.fk:-1,armR:o.armR.rotation.x,hostActive:!!(p.wult||p.wab||p.dfall||p.sdome||p.aug||p.wfw||p.wdr)};
const stale=!!after.cast||after.water||after.windWeight>0.01||after.wingUlt>=0||after.wingFlick>=0;
const report={id,pass:!stale&&!HL.errs.length,before,after,errors:HL.errs};
if(!report.pass)throw new Error('RESPAWN_ANIMATION '+JSON.stringify(report));
return report;
