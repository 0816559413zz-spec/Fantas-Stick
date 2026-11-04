// อัดท่าตัวละครพร้อม VFX จริง เป็นเฟรมสำหรับ GIF (ไม่เดินเกมด้วยเวลาจริง)
// node tools/headless.js --game --url "index.html?nosw&motion=abyssalbeam" --js tools/capture-skill-motion.js --timeout 180 --quiet
const q=new URLSearchParams(location.search),id=q.get('motion')||'abyssalbeam',spell=WD.SPELLS[id];
if(!spell)throw new Error('Unknown skill '+id);
await HL.solo({kit:spell.path+'.'+spell.i});
for(let i=0;i<160;i++){HL.step(1);await HL.sleep(30);if(i>30&&!WD.warm.busy&&!WD.warm.q.length)break;}
await HL.sleep(700);HL.aim(0,0.12);HL.step(30);
const p=HL.me();p.lst=5;p.ult=100;
const I=p.inp={...WD.INPUT,c:{...WD.INPUT.c},ax:p.x+350,ay:p.y,ah:1.3,gx:p.x+250,gy:p.y,fire:0,sh:0,hq:1};
const foe=WD.G.en[0];if(foe){foe.x=foe.ax=p.x+350;foe.y=foe.ay=p.y;foe.brn=3;foe.brnT=10;}
HL.cam('side',{dist:5.4,h:2.0,look:[0,1.2,0.4]});
const duration=+(q.get('seconds')||(id==='abyssalbeam'?6.2:3.2)),images={},samples=[];let cast=false;
for(let frame=0;frame<Math.ceil(duration*20);frame++){
 const time=frame/20;
 if(!cast&&time>=0.45){cast=true;const ok=spell.ult?WD.castUlt(p):WD.castSlot(p,0);if(ok===false&&!p.aug)throw new Error('Cast rejected '+id);}
 if(id==='terraauger'&&time>2.8)I.hq=0;
 if(id==='dragondeep'&&time>2.8)I.fire=1;
 if(id==='moonwater')I.fire=cast&&time>1?1:0;
 HL.step(3);
 const c=HL.snap(640),ctx=c.getContext('2d'),o=HL.o();
 const phase=!cast?'ก่อนร่าย':p.wab?(p.wab.ph==='cast'?'รวบรวมพลัง':'ยิงค้างและรับแรง'):id==='abyssalbeam'?'คืนท่า':'แอนิเมชันพร้อมเอฟเฟกต์จริง';
 ctx.fillStyle='rgba(0,0,0,.8)';ctx.fillRect(0,0,c.width,29);ctx.font='bold 16px sans-serif';ctx.fillStyle='#fff';ctx.fillText(spell.n+' — '+phase,10,20);
 images['motion_'+id+'_'+String(frame).padStart(3,'0')]=c.toDataURL('image/jpeg',0.88);
 if(frame%10===0)samples.push({time,R:o.armR.rotation.x,L:o.armL.rotation.x,body:o.b.rotation.x});
 if(frame%12===0)await HL.sleep(0);
}
if(HL.errs.length)throw new Error(HL.errs.join('\n'));
return {id,frames:Object.keys(images).length,fps:20,samples,errors:HL.errs,images};
