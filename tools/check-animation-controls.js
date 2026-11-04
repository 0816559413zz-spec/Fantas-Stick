// ท่าต้องไม่ล็อกการเดินเพิ่ม และเลิกค้างเมื่อโดนขัด/เปลี่ยนสาย
await HL.solo({kit:'8'});await HL.sleep(1200);HL.step(90);
let p=HL.me();const beam=WD.SPELLS.abyssalbeam,riptide=WD.SPELLS.riptide;
function kit(path,spell){WD.setKit(p,path+'.'+spell.i);p.kt=p.kit;WD.broadcastLobby();for(const k in p.cd)p.cd[k]=0;HL.aim(0,0.12);HL.step(12);}
function input(){const I=p.inp={...WD.INPUT,c:{...WD.INPUT.c},u:1,mx:1,my:0,fire:0,sh:0,ax:p.x+350,ay:p.y,gx:p.x+250,gy:p.y,ah:1.2};return I;}
kit(8,riptide);input();const x=p.x;if(!WD.castSlot(p,0))throw new Error('Riptide rejected');HL.step(45);
const moved=p.x-x;if(moved<50)throw new Error('ANIMATION_LOCKED_MOVEMENT '+moved);
kit(8,beam);input();if(!WD.castSlot(p,0))throw new Error('Beam rejected');HL.step(120);
if(!p.wab||p.wab.ph!=='fire'||HL.o().armR.rotation.x>-0.9)throw new Error('Beam pose missing while firing');
p.stun=0.5;HL.step(4);if(p.wab||HL.o().wBeamPose)throw new Error('Interrupted beam pose remains');
p.stun=0;const after=p.x;HL.step(40);if(p.x-after<35)throw new Error('Movement did not resume after interruption');
kit(8,beam);input();WD.castSlot(p,0);HL.step(20);
const storm=WD.SPELLS.thunderline;kit(2,storm);input();HL.step(25);
if(HL.o().wBeamPose||HL.o().caN)throw new Error('Animation leaked across class change');
const errors=[...new Set(HL.errs)];if(errors.length)throw new Error(errors.join('\n'));
return {pass:true,movedDuringInstantCast:+moved.toFixed(1),interruptCleared:true,walkingResumed:true,classChangeCleared:true,errors};
