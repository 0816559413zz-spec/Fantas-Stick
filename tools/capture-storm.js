// อัดสกิลสายฟ้าในเกมจริงเป็นเฟรม 30 fps → shots/motion_storm_<id>_NNN.jpg แล้วแพ็ก GIF: python tools/pack-motion-gif.py storm_<id>
//  node tools/headless.js --game --url "index.html?nosw&sk=speedsiphon" --js tools/capture-storm.js --timeout 300 --quiet
//  sk = basic (ลำสายฟ้า) | shield | thunderline | speedsiphon (ไม้เท้า: เรียก + ฟาดคลื่น) | triplestrike | stormorbs | railgun (ธนู: เรียก + ง้าง + ยิง) | godlightning
//  &cam=q34|side|back|front • &seconds=… • &dist=…
const q=new URLSearchParams(location.search),id=q.get('sk')||'speedsiphon',S=WD.SPELLS[id];
const PLAN={   // [เวลา, การกระทำ] • ใช้กับสายอื่นได้: sk=<id สกิล> หรือ sk=firebasic (BA ไฟ)
  firebasic:{sec:3.6,acts:[[0.3,'fire1'],[2.4,'fire0'],[2.8,'fire1'],[2.85,'fire0'],[3.15,'fire1'],[3.2,'fire0']]},
  blazeform:{sec:3.2,acts:[[0.3,'cast']]},
  kindle:{sec:3.0,acts:[[0.3,'cast'],[1.4,'fire1'],[1.45,'fire0']]},
  basictri:{sec:2.2,acts:[[0.3,'emp'],[0.35,'fire1'],[0.42,'fire0'],[1.2,'emp'],[1.25,'fire1'],[1.32,'fire0']]},   // BA เสริม: สายฟ้าสามเหลี่ยม
  basic:{sec:2.6,acts:[[0.3,'fire1'],[2.2,'fire0']]},
  shield:{sec:3.6,acts:[[0.3,'sh1'],[1.2,'sh0']]},
  speedsiphon:{sec:3.4,acts:[[0.3,'cast'],[1.0,'cast'],[1.7,'cast']]},   // คลื่น 3 ครั้ง = เครื่องหมายครบ ระเบิด
  railgun:{sec:4.8,acts:[[0.3,'cast'],[0.95,'fire1'],[2.95,'fire0']]},   // เรียกธนู → ถือรอ → กดค้างง้าง → ปล่อยยิง
  godlightning:{sec:5.0,acts:[[0.3,'ult'],[1.8,'fire1'],[1.85,'fire0'],[2.8,'fire1'],[2.85,'fire0'],[3.6,'dash1'],[3.65,'dash0'],[3.85,'turn'],[4.05,'fire1'],[4.1,'fire0']]}};   // คลิกข่วน 2 ที ×2 → Dash ชน → คลิกรอย X
const P=PLAN[id]||{sec:+(q.get('seconds')||2.6),acts:[[0.3,'cast']]};const sec=+(q.get('seconds')||P.sec);
const kit=id==='firebasic'?'0':S?S.path+'.'+(S.ult?'':S.i):'2';
await HL.solo({kit:id==='firebasic'||S&&!S.ult?kit:'2',map:q.get('map')||undefined});
for(let i=0;i<160;i++){HL.step(1);await HL.sleep(30);if(i>30&&!WD.warm.busy&&!WD.warm.q.length)break;}
await HL.sleep(500);HL.aim(0,0.05);HL.step(20);
const p=HL.me();p.ult=100;p.lst=5;
HL.cam(q.get('cam')||'q34',{dist:+(q.get('dist')||6.5),h:+(q.get('h')||1.7),look:[0,1.1,+(q.get('fwd')||2.2)]});
HL.step(4);
const dd=id==='godlightning'?150:id==='basictri'?180:id==='basic'?220:id==='blazeform'?90:360;const d=HL.dummy(dd,0);if(d){d.spd=0;d.ax=d.x;d.ay=d.y;}const d2=id==='godlightning'?null:HL.dummy(dd-60,90);if(d2){d2.spd=0;d2.ax=d2.x;d2.ay=d2.y;}
const DBG=[],HPLOG=[],images={},tag='storm_'+id,acts=[...P.acts];
for(let frame=0;frame<Math.ceil(sec*30);frame++){const t=frame/30;
  while(acts.length&&t>=acts[0][0]){const a=acts.shift()[1];
    if(a==='cast'){p.lst=5;for(const k in p.cd)p.cd[k]=0;const ok=WD.castSlot(p,0);if(ok===false)throw new Error('Cast rejected '+id);}
    else if(a==='ult'){WD.castUlt(p);}
    else if(a==='emp'){p.emp=1;}
    else if(a==='fire1')HL.input({fire:1});else if(a==='fire0')HL.input({fire:0});
    else if(a==='dash1'){const c=WD.INPUT.c||(WD.INPUT.c={});c.sp=(c.sp|0)+1;}else if(a==='dash0'){}else if(a==='turn'&&d){d.ax=p.x+Math.cos(p.ang)*120;d.ay=p.y+Math.sin(p.ang)*120;}   // หลังพุ่งทะลุ: ย้ายหุ่นมาข้างหน้าแทนการหันกลับ
    else if(a==='sh1')HL.input({sh:1});else if(a==='sh0')HL.input({sh:0});}
  if(id==='blazeform'){const E=(WD.G.en||[]).filter(e=>!e.dead).slice(0,2);E.forEach((e,i)=>{const an=(p.ang||0)+(i?.9:-.5),r=i?110:75;e.x=p.x+Math.cos(an)*r;e.y=p.y+Math.sin(an)*r;e.spd=0;});}
  if(id==='railgun'&&frame%6===0){const o=WD.PM3.get(p.id);if(o){o.g.updateMatrixWorld(true);const f=n=>{const q=o.g.getObjectByName(n);if(!q)return'-';const v=o.b.worldToLocal(q.getWorldPosition(new WD.THREE.Vector3()));return [v.x,v.y,v.z].map(n=>n.toFixed(2)).join(',');};const g=o.sbDbg;DBG.push((g?('S '+[g[0].x,g[0].y,g[0].z].map(n=>n.toFixed(2))+' l '+g[1].toFixed(2)+','+g[2].toFixed(2)+' T '+[g[3].x,g[3].y,g[3].z].map(n=>n.toFixed(2))+' '):'')+'t'+t.toFixed(1)+' E '+f('forearm_L')+' H '+f('hand_L'));}}
  if(d){d.x=d.ax;d.y=d.ay;HPLOG.push(Math.round(d.hp));if(frame%6===0)DBG.push([t.toFixed(1),Math.round(p.x),Math.round(p.y),(p.ang||0).toFixed(2),Math.round(d.x),Math.round(d.y),d.type,p.god>0?1:0,p.clQ?1:0,p.cEmp|0].join(' '));}if(d2){d2.x=d2.ax;d2.y=d2.ay;}
  HL.step(2);
  if(q.get('nobow')){const o=WD.PM3.get(p.id);if(o&&o.sb){o.sb.g.visible=false;for(const b of o.sb.body)b.visible=false;}}
  const c=HL.snap(480),x=c.getContext('2d');x.fillStyle='rgba(0,0,0,.7)';x.fillRect(0,0,c.width,22);x.font='bold 13px sans-serif';x.fillStyle='#fff';
  x.fillText((S?S.n:id==='firebasic'?'BA ไฟ (ชาร์จ 1.9 วิ แล้วแตะ)':id==='shield'?'โล่สายฟ้า':'BA ลำสายฟ้า')+'  t='+t.toFixed(2),8,16);
  images['motion_'+tag+'_'+String(frame).padStart(3,'0')]=c.toDataURL('image/jpeg',0.84);
  if(frame%10===0)await HL.sleep(0);}
if(HL.errs.length)throw new Error(HL.errs.join('\n'));
return {tag,frames:Object.keys(images).length,hp:[...new Set(HPLOG)].join(','),dbg:DBG,images};
