// Smoke-test the actual empowered BA event, without editing gameplay code.
await HL.solo({mode:'train', kit:'8'});
const me = HL.me();
HL.aim(0);
HL.cam('side', {dist:9, h:3, look:[0,1.3,3]});
me.wmw = 8;
me.cd.basic = 0;
HL.input({fire:true});
HL.step(5);
HL.input({fire:false});
await HL.sleep(3000); // Allow the event's two model recipes to load once.
HL.step(45);
me.wmw = 8;
me.cd.basic = 0;
HL.input({fire:true});
HL.step(12);
HL.input({fire:false});
const beams = (WD.G.wtb || []).filter(b => b.o === me.id);
if (!beams.length) throw new Error('Moonwater basic attack did not create a beam');
if (HL.errs.length) throw new Error(HL.errs.join('\n'));
return {beams:beams.map(b => ({len:b.len,w:b.w,life:b.life,tick:b.tick,dmg:b.dmg})),
        images:{moon_pressure_game:HL.snap(900).toDataURL('image/jpeg',.9)}};
