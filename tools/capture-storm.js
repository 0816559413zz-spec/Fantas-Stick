// อัดสกิลสายฟ้าในเกมจริงเป็นเฟรม 30 fps → shots/motion_storm_<id>_NNN.jpg แล้วแพ็ก GIF: python tools/pack-motion-gif.py storm_<id>
//  node tools/headless.js --game --url "index.html?nosw&sk=speedsiphon" --js tools/capture-storm.js --timeout 300 --quiet
//  sk = basic (ลำสายฟ้า) | shield | thunderline | speedsiphon (ไม้เท้า: เรียก + ฟาดคลื่น) | triplestrike | stormorbs | railgun (ธนู: เรียก + ง้าง + ยิง) | godlightning
//  &cam=q34|side|back|front • &seconds=… • &dist=…
const q=new URLSearchParams(location.search),id=q.get('sk')||'speedsiphon',S=WD.SPELLS[id];
const PLAN={   // [เวลา, การกระทำ]
  basic:{sec:2.6,acts:[[0.3,'fire1'],[2.2,'fire0']]},
  shield:{sec:3.6,acts:[[0.3,'sh1'],[1.2,'sh0']]},
  speedsiphon:{sec:3.4,acts:[[0.3,'cast'],[1.0,'cast'],[1.7,'cast']]},   // คลื่น 3 ครั้ง = เครื่องหมายครบ ระเบิด
  railgun:{sec:4.8,acts:[[0.3,'cast'],[2.9,'fire1'],[3.05,'fire0']]},   // เรียกธนู → ชาร์จเองจนเต็ม → คลิกยิง
  godlightning:{sec:4.0,acts:[[0.3,'ult'],[2.2,'fire1'],[3.6,'fire0']]}};
const P=PLAN[id]||{sec:+(q.get('seconds')||2.6),acts:[[0.3,'cast']]};const sec=+(q.get('seconds')||P.sec);
const kit=S?S.path+'.'+(S.ult?'':S.i):'2';
await HL.solo({kit:S&&!S.ult?kit:'2',map:q.get('map')||undefined});
for(let i=0;i<160;i++){HL.step(1);await HL.sleep(30);if(i>30&&!WD.warm.busy&&!WD.warm.q.length)break;}
await HL.sleep(500);HL.aim(0,0.05);HL.step(20);
const p=HL.me();p.ult=100;p.lst=5;
const dd=id==='basic'?220:360;const d=HL.dummy(dd,0);if(d){d.spd=0;d.ax=d.x;d.ay=d.y;}const d2=HL.dummy(dd-60,90);if(d2){d2.spd=0;d2.ax=d2.x;d2.ay=d2.y;}
HL.cam(q.get('cam')||'q34',{dist:+(q.get('dist')||6.5),h:1.7,look:[0,1.1,2.2]});
const images={},tag='storm_'+id,acts=[...P.acts];
for(let frame=0;frame<Math.ceil(sec*30);frame++){const t=frame/30;
  while(acts.length&&t>=acts[0][0]){const a=acts.shift()[1];
    if(a==='cast'){p.lst=5;for(const k in p.cd)p.cd[k]=0;const ok=WD.castSlot(p,0);if(ok===false)throw new Error('Cast rejected '+id);}
    else if(a==='ult'){WD.castUlt(p);}
    else if(a==='fire1')HL.input({fire:1});else if(a==='fire0')HL.input({fire:0});
    else if(a==='sh1')HL.input({sh:1});else if(a==='sh0')HL.input({sh:0});}
  if(d){d.x=d.ax;d.y=d.ay;}if(d2){d2.x=d2.ax;d2.y=d2.ay;}
  HL.step(2);
  const c=HL.snap(480),x=c.getContext('2d');x.fillStyle='rgba(0,0,0,.7)';x.fillRect(0,0,c.width,22);x.font='bold 13px sans-serif';x.fillStyle='#fff';
  x.fillText((S?S.n:id==='shield'?'โล่สายฟ้า':'BA ลำสายฟ้า')+'  t='+t.toFixed(2),8,16);
  images['motion_'+tag+'_'+String(frame).padStart(3,'0')]=c.toDataURL('image/jpeg',0.84);
  if(frame%10===0)await HL.sleep(0);}
if(HL.errs.length)throw new Error(HL.errs.join('\n'));
return {tag,frames:Object.keys(images).length,images};
