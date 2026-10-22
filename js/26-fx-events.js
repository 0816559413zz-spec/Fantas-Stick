// ---------- fx(ev): เอฟเฟกต์+เสียงของทุก event จากโฮสต์ • statusFX (สถานะบนตัว) • overlay เลือกบัฟ/สรุปผล ----------
// สถานะบนตัวละคร (ผู้เล่น/ศัตรู): fm = บิตมาสก์จาก host
function statusFX(o,fm,x,y,z,sz,now){
  if(!fm)return;
  earthMudSink(o,fm,x,y);
  if(fm&8){
    if(!o.ice){o.ice=new THREE.Mesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:'#bfeaff',transparent:true,opacity:0.5,roughness:0.5,emissive:'#2f6a9a',flatShading:true}));o.g.add(o.ice);}
    o.ice.visible=true;o.ice.scale.set(sz*0.5,sz*0.9,sz*0.5);o.ice.position.y=sz*0.85;
    if(Math.random()<0.2)burst(x,y,'#dff6ff',1,30,0.6,1.6,{h:z+rnd(0.2,sz*1.5),vh:[0,0.5],g:0});
  }else if(o.ice)o.ice.visible=false;
  if((fm&4)&&!(fm&8)&&Math.random()<0.25)PARTS.push({x:x+rnd(-14,14),y:y+rnd(-14,14),h:z+rnd(0.1,sz*1.6),vx:rnd(-10,10),vy:rnd(-10,10),vh:rnd(-1,-0.2),life:0.7,max:0.7,col:Math.random()<0.5?'#ffffff':'#9fe8ff',size:2.2,g:0,sh:4,rot:rnd(0,6.283),vr:rnd(-3,3),c2:'#5ab8ff'});
  if(fm&16){
    if(Math.random()<0.5)PARTS.push({x:x+rnd(-14,14),y:y+rnd(-14,14),h:z+rnd(0.1,sz*1.7),vx:rnd(-60,60),vy:rnd(-60,60),vh:rnd(-1,1),life:0.2,max:0.2,col:'#fff27a',size:2.2,g:0,sh:2});
    if(Math.random()<0.35)tbolt(x+rnd(-8,8),y+rnd(-8,8),z+sz*rnd(0.6,1.6),x+rnd(-26,26),y+rnd(-26,26),z+rnd(0,sz*1.4),0.06,0,0.07);   // Shock: สายฟ้าเหลืองแลบรอบตัว
  }
  if(fm&262144)for(let i=0;i<2;i++)PARTS.push({x:x+rnd(-12,12),y:y+rnd(-12,12),h:z+rnd(0.1,sz*1.6),vx:rnd(-10,10),vy:rnd(-10,10),vh:rnd(1.5,3),life:0.5,max:0.5,col:Math.random()<0.5?'#ff3a10':'#ffd27a',size:rnd(3,5),g:-1.5});
  if((fm&32768)&&Math.random()<0.3)PARTS.push({x:x+rnd(-10,10),y:y+rnd(-10,10),h:z+rnd(0.1,sz*1.6),vx:rnd(-8,8),vy:rnd(-8,8),vh:rnd(0.6,1.6),life:0.6,max:0.6,col:Math.random()<0.5?'#ff7a2a':'#ffc04a',size:2,g:-1});
  if((fm&65536)&&Math.random()<0.3)PARTS.push({x:x+rnd(-14,14),y:y+rnd(-14,14),h:z+0.1,vx:0,vy:0,vh:rnd(1,2),life:0.5,max:0.5,col:'#ffd27a',size:2.4,g:-1});
  if((fm&1024)&&Math.random()<0.25)PARTS.push({x:x+rnd(-12,12),y:y+rnd(-12,12),h:z+rnd(0.1,sz*1.5),vx:rnd(-8,8),vy:rnd(-8,8),vh:rnd(0.3,1),life:0.8,max:0.8,col:Math.random()<0.5?'#9aff6a':'#4a8a2a',size:2,g:-0.3});
  if((fm&2048)&&Math.random()<0.35)PARTS.push({x:x+rnd(-10,10),y:y+rnd(-10,10),h:z+sz*1.7,vx:rnd(-20,20),vy:rnd(-20,20),vh:rnd(0.5,1.5),life:0.5,max:0.5,col:'#b57dff',size:2.2,g:0});
  if((fm&4096)&&Math.random()<0.3)PARTS.push({x:x+rnd(-8,8),y:y+rnd(-8,8),h:z+sz*1.5,vx:0,vy:0,vh:0.4,life:0.9,max:0.9,col:'#2a1a3a',size:4,g:0,smoke:true,grow:1});
  if((fm&8192)&&Math.random()<0.3)PARTS.push({x:x+rnd(-6,6),y:y+rnd(-6,6),h:z+sz*1.9+rnd(0,0.3),vx:0,vy:0,vh:0.2,life:0.6,max:0.6,col:'#ff4060',size:2.4,g:0});
  if((fm&64)&&Math.random()<0.15)PARTS.push({x:x+rnd(-8,8),y:y+rnd(-8,8),h:z+sz*1.7,vx:0,vy:0,vh:0.6,life:0.7,max:0.7,col:'#8a6ad0',size:1.8,g:0});
  if((fm&256)&&Math.random()<0.4)PARTS.push({x:x+rnd(-10,10),y:y+rnd(-10,10),h:z+rnd(0.1,sz),vx:rnd(-30,30),vy:rnd(-30,30),vh:rnd(0.2,1),life:0.4,max:0.4,col:(fm&512)?'#fff27a':'#bfefff',size:1.6,g:0});
}

function fx(ev,raw){   // raw = ภาพเดิมในโค้ดเท่านั้น (ไม่ใช้ bind.json)
  if(ev.k==='sk'){skAnim(ev);return;}
  if(ev.k==='emo'){emoFx(ev);return;}   // อีโมต (js/52)   // ร่ายสกิลสำเร็จ → ท่าเหวี่ยงไม้ (js/35 SKANIM)
  const me=myPos(),near=!me||Math.hypot(ev.x-me.x,ev.y-me.y)<1000,H=ev.h!==undefined?ev.h:1.3;
  if(ev.k==='efx')try{efxState(ev);}catch(e){console.error(e);}   // ท่า/วัตถุที่อยู่นาน (ไม่ขึ้นกับ bind.json)
  if(!raw)try{if(fxBind(ev,H))return;}catch(e){console.error(e);}   // เอฟเฟกต์จากไฟล์ที่ผูกไว้ใน assets/fx/bind.json (replace = ข้ามภาพเดิม)
  try{fxAug(ev,H);}catch(e){console.error(e);}   // ชั้นเอฟเฟกต์ซ้อน + เอฟเฟกต์ทั้งจอ (js/44-vfx-kit.js)
  switch(ev.k){
    case 'cast':{
      const [wx,wy]=wandPos(ev),col=PCOL[ev.t]||'#fff';
      if(fileFx('vfx_cast_'+ev.t,{x:wx,y:wy,h:H,a:ev.a,col})){const o=ev.id&&PM3.get(ev.id);if(o){o.castT=0.3;castStart(o,ev.t);}break;}
      FX.flashSprite(wx,wy,H,col,0.3,ev.t==='fire'?2.2:1.5,0.15,1.4);
      FX.flashLight(wx,wy,H,col,ev.t==='fire'?3.5:2.2,10,0.2);
      burst(wx,wy,col,ev.t==='fire'?16:9,140,0.3,2,{h:H,a:ev.a,spread:0.9,g:2});
      const o=ev.id&&PM3.get(ev.id);if(o){o.castT=0.3;castStart(o,ev.t);}   // ท่าร่ายแบบนักเวท (js/35 castPose)
      if(near)snd('cast_'+({ice:'stun',zap:'stun',vine:'pull',dart:'bolt',hex:'pull',spike:'stun',pb0:'bolt',pb1:'bolt',pb2:'bolt',pb3:'bolt',pb4:'bolt',pb5:'bolt',ember:'bolt',spark:'bolt',pfire:'fire',pfireb:'fire',icicle:'stun',iceboulder:'stun'}[ev.t]||ev.t),ev);
      break;}
    case 'pop':impactFX(ev.x,ev.y,ev.t,false,H);break;
    case 'imp':impactFX(ev.x,ev.y,ev.t,true,H);break;
    case 'boom':explosionFX(ev.x,ev.y,H);if(near){snd('boom',ev);shake(7);}break;
    case 'hit':{
      const mine=ev.id===NET.myId;
      if(ev.id!==undefined){const po=PM3.get(ev.id);if(po)po.lhit={sx:ev.sx,sy:ev.sy,t:performance.now()};}   // ทิศที่โดนตี → ragdoll (js/48)
      if(!ev.b){flashModel(ev.id!==undefined?PM3.get(ev.id):ev.e!==undefined?EM3.get(ev.e):ev.mn!==undefined?MM3.get(ev.mn):null);hitSparks(ev.x,ev.y,H-0.6,ev.n);}
      if(SET.dmg||mine){if(ev.b)floatText(ev.x,ev.y,ev.n,'#ff9a4a',12,H-0.3);else floatText(ev.x,ev.y,ev.n,mine?'#ff6b6b':ev.s===NET.myId?'#ffe27a':'#ffffff',ev.s===NET.myId?18:16,H);}
      if(mine&&!ev.b){shake(5);snd('hurt');if(ev.sx!==undefined)DIRI.push({a:Math.atan2(ev.sy-myPos().y,ev.sx-myPos().x),t:1});}
      if(ev.s===NET.myId&&!mine&&!ev.b){if(ev.n>=10&&!ev.ns)shake(Math.min(6,ev.n/6));if(ev.n>=15&&!ev.a)hitStop(ev.n>=40||ev.kl?0.08:0.055);}   // AoE/zone (a=1) ไม่หยุดภาพ
      if(ev.s===NET.myId&&!mine&&!ev.b&&SET.hitm){HITM.t=HITM.max=ev.kl?0.7:0.45;HITM.at=performance.now();HITM.kill=!!ev.kl;if(ev.kl)snd('kill');}
      break;}
    case 'parry':
      FX.flashSprite(ev.x,ev.y,H,'#7ff6ff',0.5,7,0.3,3);
      FX.flashLight(ev.x,ev.y,H,'#7ff6ff',6,16,0.4);
      SHAPES_Q.push({k:'ringv',x:ev.x,y:ev.y,h:H,col:'#7ff6ff',s1:3.5,life:0.35});
      ring(ev.x,ev.y,'#7ff6ff',90,0.4,Math.max(0.15,H-1.2));
      burst(ev.x,ev.y,'#7ff6ff',45,450,0.5,2.2,{h:H,g:3});
      burst(ev.x,ev.y,'#ffffff',20,300,0.3,1.6,{h:H,g:3});
      floatText(ev.x,ev.y,'PARRY!','#7ff6ff',26,H+1.4);snd('parry',ev);
      break;
    case 'block':burst(ev.x,ev.y,'#7ff6ff',12,220,0.3,2,{h:H,g:4});FX.flashLight(ev.x,ev.y,H,'#7ff6ff',2,8,0.15);if(near)snd('block',ev);break;
    case 'sbreak':
      burst(ev.x,ev.y,'#7ff6ff',45,320,0.7,2.5,{h:H,vh:[0,5],g:9});
      FX.flashLight(ev.x,ev.y,H,'#7ff6ff',4,10,0.3);
      floatText(ev.x,ev.y,'โล่แตก!','#7ff6ff',18,H+1.2);snd('break',ev);
      break;
    case 'die':
      burst(ev.x,ev.y,ev.c||'#fff',40,300,0.8,3,{h:H,g:5});
      smoke(ev.x,ev.y,Math.max(0.4,H-0.6),12,'#302a38',1.6,8,90);
      burst(ev.x,ev.y,'#dfe8ff',22,40,1.8,2.4,{h:H,vh:[1,3],g:-1.2});
      FX.flashLight(ev.x,ev.y,H,ev.c||'#fff',3,12,0.4);
      if(H<2)ring(ev.x,ev.y,ev.c||'#fff',60,0.4);
      if(near)snd(ev.t==='spl'||ev.t==='spider'||ev.t==='queen'?'spiderdie':ev.t==='pixie'?'pixiedie':'die',ev);
      break;
    case 'nova':
      SHAPES_Q.push({k:'dome',x:ev.x,y:ev.y,h:H,col:'#ffd86b',s0:0.5,s1:12.5,life:0.55,op:0.22,full:H>1?1:0});
      SHAPES_Q.push({k:'dome',x:ev.x,y:ev.y,h:H,col:'#7fb8ff',s0:0.3,s1:9,life:0.45,op:0.16,full:H>1?1:0});
      ring(ev.x,ev.y,'#ffd86b',270,0.6,H+0.15);ring(ev.x,ev.y,'#fff3c4',190,0.45,H+0.15);
      if(H<1)SHAPES_Q.push({k:'rune',x:ev.x,y:ev.y,col:'#ffd86b',s1:6,life:1.4,op:0.9});
      FX.flashLight(ev.x,ev.y,H+2,'#ffd86b',8,32,0.7);
      FX.flashSprite(ev.x,ev.y,H+1.5,'#fff3c4',1,9,0.35,1.2);
      burst(ev.x,ev.y,'#ffd86b',90,600,0.9,2.6,{h:H+1,vh:[1,8],g:3});
      burst(ev.x,ev.y,'#ffffff',40,300,1.2,2,{h:H+0.5,vh:[3,9],g:-0.5});
      shake(12);snd('nova',ev);
      break;
    case 'slam':{
      const r=ev.r||140;
      ring(ev.x,ev.y,'#c9a27a',r+10,0.45);
      smoke(ev.x,ev.y,0.3,26,'#5a4a3a',1.4,9,r*2.2);
      burst(ev.x,ev.y,'#6b5544',30,260,1,3,{h:0.4,vh:[3,8],g:14,smoke:true});
      SHAPES_Q.push({k:'decal',x:ev.x,y:ev.y,col:'#000000',s1:r/28,life:5,op:0.45});
      FX.flashLight(ev.x,ev.y,0.8,'#ffb070',3,14,0.25);
      if(near){shake(10);snd('slam',ev);}
      break;}
    case 'dash':burst(ev.x,ev.y,'#bfefff',16,160,0.35,1.8,{h:1});smoke(ev.x,ev.y,0.2,6,'#4a4652',0.7,5,80);snd('dash',ev);break;
    case 'revive':
      for(let i=0;i<40;i++){const a=i/40*Math.PI*6;PARTS.push({x:ev.x+Math.cos(a)*24,y:ev.y+Math.sin(a)*24,h:0.1+i*0.05,vx:-Math.sin(a)*60,vy:Math.cos(a)*60,vh:1.5,life:1,max:1,col:'#7dff9a',size:2.4,g:-1,drag:1});}
      ring(ev.x,ev.y,'#7dff9a',60,0.5);FX.flashLight(ev.x,ev.y,1.5,'#7dff9a',3,12,0.6);snd('revive',ev);
      break;
    case 'spawn':
      if(ev.t==='pixie'){burst(ev.x,ev.y,'#7fc8ff',24,160,0.6,2,{h:4,g:0});FX.flashLight(ev.x,ev.y,4,'#4fa8ff',2,10,0.4);snd('pixie',ev);}
      else if(ev.t==='spl'||ev.t==='spider'||ev.t==='queen'){smoke(ev.x,ev.y,0.2,14,'#3a3028',1.2,7,120);burst(ev.x,ev.y,'#5a4a3a',14,180,0.7,2.5,{h:0.2,vh:[2,5],g:10,smoke:true});if(near)snd('hiss',ev);}
      else{smoke(ev.x,ev.y,0.3,16,'#3a1f55',1.4,8,90);burst(ev.x,ev.y,'#b57dff',20,120,0.7,2.2,{h:0.5,vh:[1,4],g:-1});ring(ev.x,ev.y,'#9a6bd0',50,0.5);FX.flashLight(ev.x,ev.y,1,'#9a6bd0',2.5,10,0.5);if(near)snd('portal',ev);}
      break;
    case 'summon':smoke(ev.x,ev.y,0.5,24,'#2a2a1a',1.6,9,200);snd('hiss',ev);break;
    case 'lunge':smoke(ev.x,ev.y,0.2,6,'#4a3e34',0.8,6,80);if(near)snd('hiss',ev);break;
    case 'claw':
      burst(ev.x,ev.y,'#ff5050',10,160,0.25,2,{h:H});
      snd(ev.t==='pixie'?'pixie':'bite',ev);
      if(ev.e!==undefined){const o=EM3.get(ev.e);if(o)o.atkT=0.3;}   // ศัตรูที่กัด/ฟัน → เล่นท่า attack (โมเดลไฟล์)
      break;
    case 'mount':
      for(let i=0;i<36;i++){const a=i/36*Math.PI*4;PARTS.push({x:ev.x+Math.cos(a)*30,y:ev.y+Math.sin(a)*30,h:H+i*0.04,vx:-Math.sin(a)*90,vy:Math.cos(a)*90,vh:2,life:0.7,max:0.7,col:i%2?'#ffe9a8':'#ffffff',size:2,g:0,drag:2});}
      smoke(ev.x,ev.y,0.2,10,'#6a6470',0.9,6,160);snd('whoosh',ev);
      break;
    case 'dismount':burst(ev.x,ev.y,'#ffe9a8',14,120,0.5,1.8,{h:H+0.6});snd('dismount',ev);break;
    case 'land':smoke(ev.x,ev.y,0.15,14,'#5a5048',1,7,200);ring(ev.x,ev.y,'#9a8a7a',45,0.3);snd('thud',ev);break;
    case 'buff':
      if(ev.id===NET.myId)snd('buff');
      {const v=VIEW.cur,p=v&&v.P.find(q=>q.id===ev.id);if(p)burst(p.x,p.y,'#ffd86b',40,90,1.2,2.2,{h:(p.z||0)+0.3,vh:[1.5,4],g:-0.5});}
      break;
    case 'wave':snd('fanfare');break;
    case 'over':snd('end');break;
    // ---- โหมดพิเศษ ----
    case 'goal':
      for(const c of ['#ffd86b','#ff6a6a','#6ab8ff','#7dff9a'])burst(ev.x,ev.y,c,25,500,1.2,2.6,{h:H,vh:[2,8],g:5});
      FX.flashLight(ev.x,ev.y,H,'#ffd86b',6,30,0.6);ring(ev.x,ev.y,TEAMC[ev.tm],120,0.6,H);
      floatText(ev.x,ev.y,'GOAL! +10',TEAMC[ev.tm],30,H+2);snd('goal');shake(4);
      break;
    case 'catch':burst(ev.x,ev.y,'#ff5050',10,120,0.3,1.8,{h:H});if(near)snd('catch',ev);break;
    case 'throw':snd('throw',ev);break;
    case 'fumble':burst(ev.x,ev.y,'#ffffff',16,200,0.4,2,{h:H});snd('hit',ev);break;
    case 'snitch':burst(ev.x,ev.y,'#ffd860',60,400,1.2,2,{h:H,g:0});snd('snitch');break;
    case 'snitchc':for(let i=0;i<3;i++)burst(ev.x,ev.y,'#ffd860',50,600,1.5,2.6,{h:H,g:2});FX.flashLight(ev.x,ev.y,H,'#ffd860',8,40,1);snd('goal');break;
    case 'ringp':
      if(ev.id===NET.myId){FX.flashSprite(ev.x,ev.y,H,'#ffd86b',1,6,0.3,1.2);burst(ev.x,ev.y,'#ffd86b',30,300,0.6,2,{h:H,g:0});snd('ring');}
      break;
    case 'finish':for(const c of ['#ffd86b','#ffffff','#ff6a6a'])burst(ev.x,ev.y,c,30,400,1.3,2.4,{h:H+1,vh:[2,7],g:4});snd(ev.id===NET.myId?'goal':'ring',ev);break;
    case 'pick':burst(ev.x,ev.y,ITEMC[ev.t]||'#fff',24,200,0.6,2,{h:1,vh:[1,4],g:0});
      if(ev.id===NET.myId){snd('pickup');floatText(ev.x,ev.y,ITEMN[ev.t]||'',ITEMC[ev.t]||'#fff',18,2.6);}break;
    case 'brout':snd('end',ev);break;
    case 'zone':snd('alarm');break;
    case 'kill':if(near){burst(ev.x,ev.y,'#3aff6a',40,260,0.7,2.6,{h:1.2,g:2});FX.flashSprite(ev.x,ev.y,1.3,'#3aff6a',0.5,6,0.35,2);FX.flashLight(ev.x,ev.y,1.5,'#3aff6a',6,16,0.5);floatText(ev.x,ev.y,'อวาดา เคดาฟรา!','#5aff7a',22,3);snd('kill',ev);}break;
    case 'meeting':snd('alarm');shake(4);break;
    case 'voted':snd('tick');break;
    case 'eject':snd('eject');break;
    case 'taskdone':if(ev.id===NET.myId){burst(ev.x,ev.y,'#ffd86b',30,160,0.8,2.2,{h:0.5,vh:[2,5],g:-0.5});snd('task');}break;
    case 'phase':FX.flashLight(ev.x,ev.y,4,'#ff5030',8,40,0.8);shake(12);snd('roar',ev);break;
    case 'roar':if(!ev.small){shake(8);}snd(ev.small?'whoosh':'roar',ev);break;
    case 'tele':
      SHAPES_Q.push({k:'warn',x:ev.x,y:ev.y,col:ev.col||'#ff3020',s1:ev.r*S3,life:ev.t});
      SHAPES_Q.push({k:'warnr',x:ev.x,y:ev.y,col:ev.col||'#ff5030',s1:ev.r*S3,life:ev.t});
      break;
    case 'breath':BREATHS.push({x:ev.x,y:ev.y,a:ev.a,t:ev.t});snd('breath',ev);break;
    case 'zn':{
      const col={fire:'#ff7a2a',lava:'#ff5a1a',frost:'#8fe0ff',storm:'#ffe27a',bloom:'#ff9ad5',spore:'#b6e86a'}[ev.z]||'#ffffff';
      if(ev.z==='mud'){earthMudZone(ev);ZV.push({x:ev.x,y:ev.y,r:ev.r,t:ev.t,kind:'mud',col:'#6b4c2c',file:true});break;}
      const own=zoneFx(ev.z,ev.x,ev.y,ev.r,ev.t,col);
      ZV.push({x:ev.x,y:ev.y,r:ev.r,t:ev.t,kind:ev.z,col,file:own});
      if(own)break;
      SHAPES_Q.push({k:'rune',x:ev.x,y:ev.y,col,s1:ev.r*S3,life:ev.t,op:ev.z==='lava'?0.85:0.6});
      if(ev.z==='lava'||ev.z==='fire')SHAPES_Q.push({k:'decal',x:ev.x,y:ev.y,col:'#000000',s1:ev.r/28,life:ev.t+2,op:0.45});
      break;}
    case 'efx':if(!fileFx('vfx_'+(ev.z==='swing'&&ev.c===2?'swingwind':ev.z),ev))efxFX(ev);break;   // ดาบน้ำแข็งจังหวะ 3 = ง้าง (รอยฟันจริงคือ slam3) → ใช้ไฟล์ vfx_swingwind แยก
    case 'prop':{
      const D=PROPDEF[(PROPS[ev.i]||{}).k]||PROPDEF.pcrate;
      if(ev.e==='h'){burst(ev.x,ev.y,D.col,6,90,0.4,2,{h:H,g:6});if(near)snd('thud',{x:ev.x,y:ev.y,vol:0.5});}
      else if(ev.e==='b'&&D.hgt>4){burst(ev.x,ev.y,D.col,60,260,1.6,3.4,{h:H,vh:[0,4],g:3});burst(ev.x,ev.y,'#7a5230',18,160,0.8,2.4,{h:1,vh:[1,4],g:9});smoke(ev.x,ev.y,0.5,8,'#7a6a50',1.2,6,60);if(near){snd('break',ev);snd('thud',{x:ev.x,y:ev.y,vol:0.9});shake(4);}}
      else if(ev.e==='b'){burst(ev.x,ev.y,D.col,26,180,0.8,3,{h:H,vh:[1,5],g:9});smoke(ev.x,ev.y,0.5,6,'#6a5a48',1.0,5,60);if(near){snd('break',ev);shake(3);}}
      else if(ev.e==='u'){burst(ev.x,ev.y,'#ffd86b',22,120,0.9,2.4,{h:H,vh:[1,4],g:-0.5});FX.flashLight(ev.x,ev.y,H+0.5,'#ffd86b',3,8,0.4);if(near)snd('pickup',ev);}
      break;
    }
    case 'bld':{
      const el=ev.el||'none',fire=el.includes('fire'),ice=el==='ice',col=ice?'#dff6ff':fire?'#ff8a3a':'#c8b89a';
      if(ev.e==='h'){burst(ev.x,ev.y,col,8,90,0.45,2.2,{h:H,vh:[0.5,3],g:6});smoke(ev.x,ev.y,H,2,'#8a7a68',0.8,5,40);if(near)snd('thud',{x:ev.x,y:ev.y,vol:0.5});}
      else{
        bldDebris(ev);
        smoke(ev.x,ev.y,H,14,fire?'#2a2522':ice?'#e8f6ff':'#7a6a58',1.8,9,120);
        burst(ev.x,ev.y,col,ice?40:26,200,0.8,3,{h:H,vh:[1,6],g:9});
        if(fire){burst(ev.x,ev.y,'#ffb347',30,160,1.1,2.4,{h:H,vh:[2,6],g:-1});FX.flashLight(ev.x,ev.y,H+1,'#ff7a2a',5,16,0.4);}
        if(near){snd('break',ev);if(el.includes('blast'))snd('boom',{x:ev.x,y:ev.y,vol:0.6});shake(el.includes('blast')?6:3);}
      }
      break;}
    case 'brk':if(ev.t==='b')brkFall(ev);break;   // ของบังพัง: ส่วนบนล้ม (เศษ/ฝุ่น/เสียง = assets/fx/env/brk_*.fx.json ผูกใน bind.json brk:c / brk:b / brk:land)
    case 'heal':floatText(ev.x,ev.y,'+'+ev.n,'#7dff9a',ev.id===NET.myId?20:15,ev.h);if(ev.id===NET.myId)burst(ev.x,ev.y,'#7dff9a',8,60,0.6,1.6,{h:ev.h-1,vh:[0.5,2],g:-0.5});break;
    case 'fbomb':
      explosionFX(ev.x,ev.y,0.6);
      if(ev.r>200){ring(ev.x,ev.y,'#ff7a2a',ev.r,0.6);ring(ev.x,ev.y,'#ffd27a',ev.r*0.7,0.5);burst(ev.x,ev.y,'#ff6a2a',90,ev.r*2.2,0.8,4,{h:0.6,vh:[0,3],g:-1});shake(10);}
      if(near)snd('boom',ev);
      break;
  }
}

// ---------- overlay: เลือกบัฟ / สรุปผล ----------
function choosePick(i){
  if(NET.isHost){const p=G&&G.players[NET.myId];if(p)hostPick(p,i);}
  else if(NET.hostConn)try{NET.hostConn.send({t:'pick',i});}catch(e){}
  $('#buff').classList.add('hidden');
}
function syncOverlays(s){
  const me=s.P.find(p=>p.id===NET.myId);
  const showBuff=s.ph==='buff'&&me&&!me.pk&&me.bo;
  const key=showBuff?'b'+me.bo.join(',')+s.wave:'';
  if(key!==lastBuffKey){
    lastBuffKey=key;
    const el=$('#buff');
    if(showBuff){
      el.innerHTML=`<div class="card boon"><h2 style="text-align:center">เลือกพลังเสริม</h2><div class="orn"></div><p class="sub">ผ่านชั้น ${s.wave} แล้ว! เลือก 1 อย่าง (คลิก หรือกด 1 / 2 / 3)</p>
        ${me.bo.map((b,i)=>`<div class="bc" data-pick="${i}"><div class="dia"><span>${BUFFS[b].i||'✨'}</span></div><div><div class="n">${BUFFS[b].n}</div><div class="d">${BUFFS[b].d}</div></div><kbd>${i+1}</kbd></div>`).join('')}</div>`;
      el.classList.remove('hidden');
      if(document.pointerLockElement)document.exitPointerLock();
    }else el.classList.add('hidden');
  }
  if(s.ph==='over'&&s.res){
    if(!overShown){overShown=true;showOver(s.res);if(document.pointerLockElement)document.exitPointerLock();}
  }else if(overShown){overShown=false;$('#over').classList.add('hidden');}
  if(s.ph==='count'){const c=Math.ceil(s.cd);if(c!==lastCount){lastCount=c;if(c>0)sfx('tick');}}
  else if(lastCount){lastCount=0;sfx('go');}
  syncMeeting(s);
  if(s.mode!=='imp'&&ROLE)ROLE=null;
}
function showOver(r){
  let best='';
  if(r.mode==='coop'){
    const b=+(store('wd_best')||0);
    if(r.wave>b){store('wd_best',String(r.wave));best=`<p class="sub" style="color:var(--gold)">🎉 สถิติใหม่ของคุณ!</p>`;}
    else best=`<p class="sub">สถิติดีที่สุดของคุณ: ด่าน ${b}</p>`;
  }
  const isCoop=r.mode==='coop';
  $('#over').innerHTML=`<div class="card" style="width:min(640px,100%)"><h1 style="font-size:44px">${esc(r.title)}</h1><div class="orn"></div><p class="sub">${esc(r.sub)}</p>${best}
    <table><tr><th>ผู้เล่น</th><th>${isCoop?'ฆ่าศัตรู':'KILLS'}</th><th>${isCoop?'ล้ม':'DEATHS'}</th><th>ดาเมจ</th></tr>
    ${r.rows.map((x,i)=>`<tr style="${i===0&&!isCoop?'background:linear-gradient(90deg,rgba(217,180,90,.18),transparent)':''}"><td><span class="dot" style="background:${x.c};margin-right:8px;${x.tm>=0?'outline:2px solid '+TEAMC[x.tm]:''}"></span>${i===0&&!isCoop?'👑 ':''}${esc(x.n)}</td><td>${x.k}</td><td>${x.d}</td><td>${x.dmg}</td></tr>`).join('')}</table>
    <div class="row">${NET.isHost?'<button class="pri" id="btnAgain">กลับล็อบบี้ / เล่นอีกครั้ง</button>':'<div class="sub" style="margin:8px 0">รอโฮสต์กดเล่นอีกครั้ง...</div>'}</div>
    <div class="row"><button id="btnQuit">ออกจากห้อง</button></div></div>`;
  $('#over').classList.remove('hidden');
}
$('#buff').addEventListener('click',e=>{const c=e.target.closest('[data-pick]');if(c)choosePick(+c.dataset.pick);});
$('#over').addEventListener('click',e=>{
  if(e.target.id==='btnAgain')hostToLobby();
  if(e.target.id==='btnQuit')leave();
});
