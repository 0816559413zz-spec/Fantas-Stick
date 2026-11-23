// With the dev server running: node tools/headless.js --game --js tools/check-jump.js
const kindle=WD.SPELLS.kindle;
await HL.solo({kit:kindle.path+'.'+kindle.i});
const player=HL.me();
const deadline=performance.now()+12000;
while((!HL.o()?.fileModel||WD.warm.busy||WD.warm.q.length)&&performance.now()<deadline){
  HL.step(2);await HL.sleep(30);
}
if(!HL.o()?.fileModel)throw new Error('Character model unavailable');

function press(key){
  WD.INPUT.c[key]++;
  player.inp.c[key]=WD.INPUT.c[key];
}
function assertJumpReleased(action){
  const actor=HL.o();
  if(player.airPose||player.jumpAir||actor.jumpLegs||actor.jumpArms?.applied)
    throw new Error('Ordinary jump persisted during '+action);
}

press('jp');HL.step(8);
if(!HL.o().jumpArms?.applied||player.airPose!==1)throw new Error('Jump pose did not engage');
if(WD.castSlot(player,0)===false)throw new Error('Kindle release was rejected');
HL.step(8);
if(!player.kindle||player.hover<=0)throw new Error('Kindle did not activate');
assertJumpReleased('Kindle');

for(let i=0;i<120;i++){
  HL.step(3);
  if(i%20===0)await HL.sleep(0);
}
if(player.kindle||player.hover>0||player.z>.05)throw new Error('Failed to land after Kindle');
press('jp');HL.step(9);
press('b');HL.step(5);
if(!player.fly)throw new Error('Broom flight did not activate');
assertJumpReleased('broom flight');
if(HL.errs.length)throw new Error(HL.errs.join('\n'));
return {kindle:true,broomFlight:true,errors:HL.errs};
