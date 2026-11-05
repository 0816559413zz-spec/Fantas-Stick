// อัดท่าพุ่ง 3D (js/72-dash-pose.js) เป็นเฟรม 30 fps → shots/motion_<tag>_NNN.jpg (แพ็ก GIF: python tools/pack-motion-gif.py <tag>)
//  node tools/headless.js --game --url "index.html?nosw&dash=windrift" --js tools/capture-dash.js --timeout 200 --quiet
//  ?dash=<id สกิล> (ร่ายช่องแรก หรืออัลติ) | shift (กด Dash) • &kit=0 (สายสำหรับ shift: 0 ไฟ 2 สายฟ้า 6 ดิน …) • &dir=u|d|l|r (ทิศ WASD ตอนกด)
//  &cam=side|q34|back|front|left • &seconds=1.6 • &tag=ชื่อไฟล์ • &boost=1 (ดิน: เปิด Rock Boost ก่อน)
const q=new URLSearchParams(location.search),id=q.get('dash')||'windrift',shift=id==='shift',spell=shift?null:WD.SPELLS[id];
if(!shift&&!spell)throw new Error('Unknown skill '+id);
const tag=q.get('tag')||(shift?'dash_'+(q.get('kit')||'0')+(q.get('dir')||''):'dash_'+id);
await HL.solo({kit:shift?(q.get('kit')||'0'):spell.path+'.'+spell.i});
for(let i=0;i<160;i++){HL.step(1);await HL.sleep(30);if(i>30&&!WD.warm.busy&&!WD.warm.q.length)break;}
await HL.sleep(500);HL.aim(0,0.12);HL.step(30);
const p=HL.me();p.ult=100;if(q.get('boost'))p.stdB=10;
HL.cam(q.get('cam')||'side',{dist:5.2,h:1.6,look:[0,1.0,0.3]});
const nofx=!!q.get('nofx'),base=new Set(WD.scene.children.filter(c=>!c.isPoints));   // &nofx=1 = ซ่อนเอฟเฟกต์/อนุภาค เห็นท่าชัด
const dur=+(q.get('seconds')||1.6),images={},samples=[],dir=q.get('dir');let fired=false;
for(let frame=0;frame<Math.ceil(dur*30);frame++){
  const time=frame/30;
  if(!fired&&time>=0.3){fired=true;
    if(shift){if(dir)HL.input({[dir]:true});WD.INPUT.c.sp=(WD.INPUT.c.sp|0)+1;}
    else{const ok=spell.ult?WD.castUlt(p):WD.castSlot(p,0);if(ok===false)throw new Error('Cast rejected '+id);}}
  if(fired&&dir&&time>0.42)HL.input({[dir]:false});
  HL.step(2);
  if(nofx){for(const c of WD.scene.children)if(!base.has(c))c.visible=false;
    WD.scene.traverse(m=>{const t=m.material;if(m.isPoints||m.isSprite||m.isLine||m.isMesh&&t&&!Array.isArray(t)&&(t.blending===2||t.transparent&&!t.depthWrite))m.visible=false;});}   // แสง/ประกาย/เส้นเอฟเฟกต์
  const c=HL.snap(560),ctx=c.getContext('2d'),o=HL.o(),S=o.dp;
  ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(0,0,c.width,24);ctx.font='bold 14px sans-serif';ctx.fillStyle='#fff';
  ctx.fillText((shift?'Dash '+(q.get('kit')||'0')+(dir?' '+dir:''):spell.n)+'  t='+time.toFixed(2)+'  '+(S?S.st+' / '+S.ph+(S.back>0?' (back)':''):'-'),8,17);
  images['motion_'+tag+'_'+String(frame).padStart(3,'0')]=c.toDataURL('image/jpeg',0.86);
  samples.push({t:+time.toFixed(2),ph:S?S.ph:'',lean:+o.b.rotation.x.toFixed(2),yaw:+o.b.rotation.y.toFixed(2)});
  if(frame%10===0)await HL.sleep(0);
}
if(HL.errs.length)throw new Error(HL.errs.join('\n'));
return {tag,frames:Object.keys(images).length,samples:samples.filter((s,i)=>i%3===0),images};
