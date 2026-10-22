// สร้าง VFX 3 แบบ (A พรีเมียม / B อนิเมะ / C สมจริง) ให้ท่าที่เหลือของ ไฟ / สายฟ้า / น้ำแข็ง → assets/fx/var-<กลุ่ม>/<ท่า>_a|b|c.fx.json
// งานคืน 2026-10-22 (ผู้ใช้: "ทำ VFX สายไฟ สายฟ้า Frost ทุกท่า อย่างละ 3 แบบ") — ไฟล์ตัวเลือก ยังไม่ผูกกับเกม (ไม่แตะ bind.json)
// ใช้: node tools/vfx-var-gen.js [ชื่อท่า ...]  (ไม่ใส่ = ทุกท่าในตาราง MOVES) • ท่าที่มีไฟล์แล้วจะถูกเขียนทับ — แก้ไฟล์เองแล้วอย่ารันซ้ำ
// แต่ละท่า = "แบบท่า" (kind) + ขนาดจริงจากเกม (r/len/h เมตร) → ประกอบชั้นจากชิ้นส่วนตามธาตุ + สไตล์
const fs=require('fs'),path=require('path');
const FXD=path.join(__dirname,'..','assets','fx');
const PAL={fire:'fire',storm:'storm',frost:'ice'};
// ---- ชิ้นส่วนพื้นฐาน ----
let N=0;const id=s=>s+(++N);
const flash=(at,size,o={})=>({id:id('flash'),t:'flash',at,life:o.life||0.1,col:o.col||'$core',size,...o.x});
const halo=(at,size,o={})=>({id:id('halo'),t:'halo',at,life:o.life||0.35,col:o.col||'$main',size,k:o.k||1,...o.x});
const ring=(at,r,o={})=>({id:id('ring'),t:'ring',at,life:o.life||0.45,att:'ground',pos:[0,0.1,0],col:o.col||'$main',r,op:o.op||0.5,...o.x});
const light=(at,life,o={})=>({id:id('light'),t:'light',at,life,col:'$light',int:o.int||1.6,dist:o.dist||14,pos:o.pos||[0,1.5,0],...o.x});
const cam=(at,shake,o={})=>({id:id('cam'),t:'screen',at,life:o.life||0.25,shake,own:true,...o.x});
const emit=(at,life,o)=>({id:id('emit'),t:'emit',at,life,...o});
const mesh=(at,life,o)=>({id:id('mesh'),t:'mesh',at,life,...o});
const decal=(at,life,kind,r,o={})=>({id:id('decal'),t:'decal',at,life,att:'ground',kind,r,...o});
// ---- ตามธาตุ ----
const EL={
  fire:{spark:'ember',big:'fire',mat:'fire',deb:'rock',dec:'scorch',smoke:'#2a2420',core:'#fff1c0',deep:'#ff3a0a'},
  storm:{spark:'streak',big:'spark',mat:'energy',deb:'rock',dec:'dark',smoke:'#3a3c48',core:'#ffffff',deep:'#ffb000'},
  frost:{spark:'flake',big:'spark',mat:'ice',deb:'ice',dec:'icecrack',smoke:'#dfeaf2',core:'#ffffff',deep:'#2f7fe0'}};
// ระเบิด/กระแทกที่พื้น รัศมี r (ม.) ที่เวลา at, ตำแหน่ง p
function impact(el,s,at,r,p=[0,0,0]){const E=EL[el],L=[],P=(y)=>[p[0],p[1]+y,p[2]];
  if(s==='a'){L.push(flash(at,r*0.7,{x:{pos:P(0.8)}}),halo(at,r*1.4,{x:{pos:P(0.8)}}),
    mesh(at,0.55,{shape:'dome',mat:el==='frost'?'ice':'energy',col:'$main',col2:'$deep',pos:P(0),scale:{'0':0.2,'0.4':r*0.85,'1':r,ease:'out'},op:{'0':0.9,'1':0},rim:1.6,dis:{'0':0,'0.5':0,'1':0.8}}),
    {...ring(at,r*1.5),pos:P(0.1)},emit(at,0.06,{burst:Math.min(70,20+r*6),from:'hemisphere',fr:r*0.25,dir:'out',speed:[r*1.2,r*2.6],plife:[0.4,0.8],look:E.spark,size:[2,3.2],col:'$core',c2:'$deep',gravity:el==='fire'?-0.5:4,pos:P(0.4)}),
    light(at,0.5,{int:2,dist:r*4+6,pos:P(1.5)}));
    if(el==='frost')L.push({id:id('crown'),t:'crown',at,life:1.2,att:'ground',pos:P(0),r:Math.min(8,r*0.5),hy:1.1});
    if(el==='storm')L.push({id:id('bolt'),t:'bolt',at,life:0.3,pos:P(0.3),radial:[r*0.5,r],n:5,w:0.1,blife:0.12,rate:12});
    if(el==='fire')L.push({id:id('vol'),t:'firevol',at,life:1,att:'ground',pos:P(0),kind:'pillar',hx:r*0.3,hz:r*0.3,h:r*0.9,int:1.2,x:true});}
  else if(s==='b'){L.push(flash(at,r*1.1,{life:0.06,col:'#ffffff',x:{pos:P(0.9)}}),
    mesh(at,0.22,{shape:'ring',inner:0.9,mat:'glow',col:'#ffffff',pos:P(0.12),rot:[0,0,0],scale:{'0':0.3,'1':r*1.7,ease:'out'},op:{'0':1,'1':0}}),
    mesh(at+0.05,0.3,{shape:'ring',inner:0.8,mat:'energy',col:'$main',col2:'$deep',pos:P(0.1),scale:{'0':0.2,'1':r*1.25,ease:'out'},op:{'0':1,'1':0},rim:2}),
    mesh(at,0.35,{shape:'spikes',n:10,mat:el==='frost'?'ice':'energy',col:'$hi',col2:'$deep',pos:P(0),scale:{'0':[r*0.2,0.1,r*0.2],'0.3':[r*0.45,r*0.55,r*0.45],'1':[r*0.5,0.05,r*0.5]},op:{'0':1,'1':0}}),
    emit(at,0.05,{burst:Math.min(80,30+r*6),from:'disc',fr:r*0.2,dir:'flat',speed:[r*3,r*5],plife:[0.18,0.32],look:'streak',size:[2.6,3.6],col:'#ffffff',c2:'$main',gravity:0,drag:4,pos:P(0.3)}),
    cam(at,Math.min(7,2+r*0.6),{x:{kick:0.35,flash:0.04}}),light(at,0.25,{int:2.2,dist:r*4+6,pos:P(1.4)}));
    if(el==='storm')L.push({id:id('bolt'),t:'bolt',at,life:0.12,pos:P(14),to:[0,-14,0],n:2,w:0.3,br:2,blife:0.14});
    if(el==='frost')L.push({id:id('crack'),t:'decal',at,life:1.6,att:'ground',kind:'icecrack',r:r*1.1,col:'$main',pos:P(0)});
    if(el==='fire')L.push(decal(at,1.6,'crack',r,{burn:1.5,pos:P(0)}));}
  else{L.push(flash(at,r*0.5,{x:{pos:P(0.6)}}),{id:id('warp'),t:'warp',at,life:0.45,att:'ground',pos:P(0.2),kind:'shock',flat:true,size:{'0':0.5,'1':r*2.2},op:{'0':1,'1':0},str:1.2,col:el==='fire'?'#ff7a3a':el==='storm'?'#ffe27a':'#9fdcff'},
    {id:id('deb'),t:'debris',at,life:1.4,att:'ground',pos:P(0.3),kind:E.deb,n:Math.min(24,6+r*2),speed:r*1.6+3,r:r*0.3},
    emit(at+0.05,0.1,{burst:Math.min(28,8+r*2),from:'disc',fr:r*0.5,dir:'up',spread:1.2,speed:[0.6,1.8],plife:[1.2,2],look:'smoke',size:[8,14],col:E.smoke,c2:E.smoke,gravity:-0.4,grow:1.2,drag:2,x:true,pos:P(0.3)}),
    decal(at,2.5,E.dec,r*0.9,{pos:P(0),...(el==='frost'?{col:'$main'}:{})}),light(at,0.6,{int:1.8,dist:r*4+6,pos:P(1.2)}),cam(at,Math.min(6,2+r*0.5)));
    if(el==='fire')L.push({id:id('vol'),t:'firevol',at,life:1.6,att:'ground',pos:P(0),kind:'pillar',hx:r*0.45,hz:r*0.45,h:r*1.1,int:1.3,den:1.3});
    if(el==='frost')L.push({id:id('mist'),t:'mist',at,life:1.5,att:'ground',pos:P(0),r:r*0.8,n:Math.min(40,10+r*2),out:1.6},{id:id('crown'),t:'crown',at,life:1.6,att:'ground',pos:P(0),r:Math.min(8,r*0.6),hy:1.4});
    if(el==='storm')L.push({id:id('bolt'),t:'bolt',at,life:0.5,pos:P(0.2),radial:[r*0.4,r*1.1],n:6,w:0.08,br:1,blife:0.1,rate:18,acc:true});}
  return L;}
// ลูกเวทพุ่งจากมือไปข้างหน้า len ม. แล้วกระแทก
function projectile(el,s,len,size,rb,charge){const E=EL[el],L=[],T=Math.min(0.6,len/30),t0=charge||0,a=t0+T;
  if(charge)L.push(emit(0,charge,{rate:60,from:'sphere',fr:1.4,dir:'in',speed:[2,4],plife:[0.25,0.35],look:s==='b'?'streak':E.spark,size:[1.6,2.4],col:'$hi',c2:'$main',gravity:0,att:'wand'}),
    mesh(0,charge,{att:'wand',shape:'sphere',mat:E.mat==='fire'?'fire':'energy',mode:'ball',col:'$main',col2:'$deep',scale:{'0':0.05,'1':size*1.2,ease:'in'},rim:1.5}),light(0,charge,{int:{'0':0.3,'1':1.6},dist:8,pos:[0,1.4,0.6]}));
  const orbMat=s==='c'&&el==='fire'?'fire':s==='a'?(el==='frost'?'ice':'energy'):'glow';
  L.push(flash(t0,size*3,{x:{pos:[0,1.3,0.8]}}),
    {id:'orb',t:'mesh',at:t0,life:T,shape:el==='frost'&&s!=='b'?'cone':'sphere',mat:orbMat,mode:'ball',col:s==='b'?'#ffffff':'$main',col2:'$deep',pos:{'0':[0,1.3,0.8],'1':[0,1.3,len]},rot:el==='frost'?[90,0,0]:[0,0,0],scale:el==='frost'&&s!=='b'?[size*0.6,size*2.2,size*0.6]:size,rim:1.8,fade:0,spin:s==='b'?0:240},
    {id:id('tail'),t:'trail',at:t0,life:T,of:'orb',col:s==='b'?'#ffffff':'$hi',col2:'$deep',w:size*(s==='b'?0.6:1),tlife:s==='b'?0.12:0.25,k:s==='b'?2.2:1.5},
    emit(t0,T,{rate:s==='c'?90:50,from:'mesh',of:'orb',dir:'random',speed:[0.3,1.2],plife:[0.3,0.6],look:s==='c'?(el==='fire'?'fire':el==='frost'?'flake':'spark'):E.spark,size:s==='c'?[3,5]:[1.4,2.2],col:'$hi',c2:'$deep',gravity:el==='fire'?-1:0.5}));
  if(s==='b')L.push(mesh(t0,0.15,{shape:'ring',inner:0.85,mat:'glow',col:'#ffffff',pos:[0,1.3,1],rot:[90,0,0],scale:{'0':0.2,'1':size*6,ease:'out'},op:{'0':1,'1':0}}));
  if(s==='c'&&el==='fire')L.push(emit(t0,T,{rate:30,from:'mesh',of:'orb',dir:'up',speed:[0.3,0.8],plife:[0.8,1.3],look:'smoke',size:[5,8],col:E.smoke,c2:E.smoke,gravity:-0.3,grow:1,x:true}));
  if(el==='storm'&&s!=='a')L.push({id:id('bolt'),t:'bolt',at:t0,life:T,pos:[0,1.3,1],to:[0,0,len-1],jit:0.6,w:0.07,blife:0.06,rate:24,acc:s==='c'});
  return {L:L.concat(impact(el,s,a,rb,[0,0,len])),dur:a+1.6};}
// ฟาดจากฟ้าลงจุด (pts = [[x,z,at]...]) รัศมี r
function skyStrike(el,s,pts,r,warn){const L=[];
  for(const [x,z,at] of pts){const P=[x,0,z];
    if(warn)L.push({id:id('warn'),t:'decal',at:Math.max(0,at-warn),life:warn+0.1,att:'ground',pos:P,kind:'glyph',r:r*0.9,col:'$main'});
    if(el==='storm')L.push({id:id('bolt'),t:'bolt',at,life:s==='b'?0.12:0.25,att:'ground',pos:[x,16,z],to:[0,-16,0],jit:s==='b'?0.1:0.5,n:s==='c'?4:2,w:s==='b'?0.4:0.28,br:s==='a'?2:1,blife:0.16,rate:s==='c'?16:8});
    else{const fall=0.28,sh=el==='fire'?'sphere':'cone';
      L.push({id:id('fall'),t:'mesh',at:at-fall,life:fall,shape:sh,mat:el==='fire'?'fire':'ice',mode:'ball',col:'$main',col2:'$deep',pos:{'0':[x-3,14,z-3],'1':[x,0.5,z]},rot:el==='frost'?[180,0,0]:[0,0,0],scale:el==='frost'?[0.6,2.2,0.6]:r*0.25,fade:0,rim:1.6},
        {id:id('ftail'),t:'trail',at:at-fall,life:fall,of:L.length?undefined:undefined,col:'$hi',col2:'$deep',w:r*0.2,tlife:0.3,k:1.4,pos:{'0':[x-3,14,z-3],'1':[x,0.5,z]}});}
    L.push(...impact(el,s,at,r,P));}
  return L;}
// ออร่า/โล่วนรอบตัว (loop) รัศมี r • shell = ทรงกลมหุ้มตัว
function aura(el,s,r,shell){const E=EL[el],L=[];
  if(shell)L.push({id:'shell',t:'mesh',loop:true,at:0,life:2,att:'feet',shape:'sphere',mat:el==='frost'?'ice':s==='c'&&el==='fire'?'fire':'energy',mode:'ball',col:'$main',col2:'$deep',pos:[0,1,0],scale:s==='b'?{'0':1.3,'0.5':1.38,'1':1.3}:1.35,op:s==='a'?0.55:s==='b'?0.75:0.45,rim:s==='b'?2.6:1.6,scroll:0.8,spin:s==='b'?120:30});
  if(s==='a')L.push({id:id('floor'),t:'mesh',loop:true,at:0,life:1.5,att:'feet',shape:'ring',inner:0.9,mat:'energy',col:'$main',col2:'$deep',pos:[0,0.06,0],scale:r,spin:50,op:{'0':0.6,'0.5':0.9,'1':0.6},rim:1},
    emit(0,1,{loop:true,att:'feet',rate:30,from:'ring',fr:Math.min(r,3),dir:'up',spread:0.2,speed:[1,2.4],plife:[0.7,1.2],look:E.spark,size:[1.6,2.4],col:'$hi',c2:'$deep',gravity:el==='fire'?-1:-0.3,spin:3}),
    {id:id('glow'),t:'light',loop:true,at:0,life:1,att:'chest',col:'$light',int:{'0':1,'0.5':1.5,'1':1},dist:8});
  if(s==='b')L.push({id:id('spk'),t:'mesh',loop:true,at:0,life:1,att:'feet',shape:'spikes',n:8,mat:el==='frost'?'ice':'energy',col:'$hi',col2:'$deep',pos:[0,0.05,0],scale:[Math.min(r,3)*0.5,0.6,Math.min(r,3)*0.5],spin:180,op:0.8},
    {id:id('pulse'),t:'mesh',loop:true,at:0,life:0.6,att:'feet',shape:'ring',inner:0.92,mat:'glow',col:'#ffffff',pos:[0,0.08,0],scale:{'0':0.3,'1':r,ease:'out'},op:{'0':0.9,'1':0}},
    emit(0,1,{loop:true,att:'chest',rate:40,from:'sphere',fr:1.2,dir:'tangent',speed:[3,5],plife:[0.25,0.4],look:'streak',size:[2,3],col:'#ffffff',c2:'$main',gravity:0,drag:1}));
  if(s==='c'){if(el==='fire')L.push({id:id('vol'),t:'firevol',loop:true,at:0,life:2,att:'feet',kind:'shell',hx:0.7,hz:0.7,h:2.4,int:1,hgt:{'0':1,'1':1},dis:{'0':0,'1':0}});
    if(el==='storm')L.push({id:id('bolt'),t:'bolt',loop:true,at:0,life:1,att:'chest',radial:[0.6,1.6],n:2,w:0.06,blife:0.08,rate:14,acc:true});
    if(el==='frost')L.push({id:id('mist'),t:'mist',loop:true,at:0,life:1.2,att:'feet',r:Math.min(r,4),n:10,out:0.6});
    L.push(emit(0,1,{loop:true,att:'feet',rate:18,from:'disc',fr:Math.min(r,4),dir:'up',spread:0.6,speed:[0.4,1],plife:[1,1.6],look:el==='frost'?'flake':'smoke',size:el==='frost'?[1.4,2]:[6,9],col:el==='frost'?'#ffffff':E.smoke,c2:el==='frost'?'#bfe8ff':E.smoke,gravity:el==='frost'?0.3:-0.3,grow:el==='frost'?0:1,x:true}),
      {id:id('warp'),t:'warp',loop:true,at:0,life:1.5,att:'feet',pos:[0,1.2,0],kind:el==='fire'?'haze':'bulge',size:2.4,str:0.6,op:0.8,col:el==='fire'?'#ff7a3a':'#9fdcff'});
    if(r>2.5)L.push({id:id('edge'),t:'mesh',loop:true,at:0,life:1.5,att:'feet',shape:'ring',inner:0.95,mat:'energy',col:'$main',col2:'$deep',pos:[0,0.05,0],scale:r,op:0.5,rim:0.8});}
  L.push({id:'endpop',t:'flash',end:true,at:0,life:0.15,att:'chest',col:'$hi',size:3},{id:'endburst',t:'emit',end:true,at:0,life:0.05,att:'chest',burst:30,from:'sphere',fr:1,dir:'out',speed:[3,7],plife:[0.3,0.6],look:E.spark,size:[2,3],col:'$core',c2:'$deep',gravity:2});
  return L;}
// พุ่ง/วาร์ป len ม. ไปข้างหน้า
function dash(el,s,len){const E=EL[el],L=[],T=0.25;
  L.push(flash(0,2.4,{x:{att:'feet',pos:[0,1,0]}}),{id:'runner',t:'mesh',at:0,life:T,att:'feet',shape:'sphere',mat:'glow',col:'$hi',pos:{'0':[0,1,0],'1':[0,1,len]},scale:0.35,fade:0},
    {id:id('tr'),t:'trail',at:0,life:T,of:'runner',col:s==='b'?'#ffffff':'$hi',col2:'$deep',w:s==='b'?1.6:0.9,tlife:s==='b'?0.18:0.4,k:s==='b'?2:1.4});
  if(s==='a')L.push(emit(0,T,{rate:160,from:'mesh',of:'runner',dir:'random',speed:[0.5,1.5],plife:[0.4,0.7],look:E.spark,size:[1.6,2.4],col:'$hi',c2:'$deep',gravity:el==='fire'?-1:1,att:'feet'}),ring(0,2.5),{...ring(T,2.5),pos:[0,0.1,len]});
  if(s==='b')L.push(emit(0,T,{rate:200,from:'mesh',of:'runner',dir:'flat',speed:[0.2,0.6],plife:[0.2,0.3],look:'streak',size:[3,4.5],col:'#ffffff',c2:'$main',gravity:0,att:'feet'}),
    mesh(T,0.2,{att:'feet',shape:'ring',inner:0.88,mat:'glow',col:'#ffffff',pos:[0,1,len],rot:[90,0,0],scale:{'0':0.3,'1':4,ease:'out'},op:{'0':1,'1':0}}),flash(T,3,{x:{att:'feet',pos:[0,1,len]}}),cam(0,2,{x:{kick:0.3}}));
  if(s==='c'){L.push(emit(0,T,{rate:70,from:'mesh',of:'runner',dir:'up',speed:[0.3,1],plife:[0.8,1.4],look:el==='frost'?'flake':'smoke',size:el==='frost'?[1.5,2.2]:[5,8],col:el==='frost'?'#ffffff':E.smoke,c2:el==='frost'?'#bfe8ff':E.smoke,gravity:-0.3,grow:el==='frost'?0:1,att:'feet',x:true}));
    for(let i=0;i<4;i++)L.push(decal(T*i/4,1.8,E.dec,1.2,{att:'feet',pos:[0,0,len*(i+0.5)/4],...(el==='frost'?{col:'$main'}:{})}));
    if(el==='storm')L.push({id:id('bolt'),t:'bolt',at:0,life:T,att:'feet',pos:[0,0.6,0],to:[0,0,len],jit:0.8,n:2,w:0.1,blife:0.1,rate:30,acc:true});
    if(el==='fire')L.push({id:id('vol'),t:'firevol',at:0,life:1,att:'feet',pos:[0,0,len/2],yaw:0,kind:'wall',hx:0.5,hz:len/2,h:1.2,int:1});}
  return {L,dur:T+1.8};}
// เรียก/อัญเชิญของใหญ่ (สูง h ม.) ตรงหน้า
function summon(el,s,h,at0=0){const E=EL[el],L=[],P=[0,0,4];
  L.push({id:id('circle'),t:'decal',at:at0,life:2.6,att:'ground',pos:P,kind:el==='fire'?'rune':'glyph',r:h*0.5,col:'$main'},
    emit(at0,0.6,{att:'ground',pos:P,rate:90,from:'ring',fr:h*0.5,dir:'up',spread:0.15,speed:[3,6],plife:[0.4,0.7],look:s==='b'?'streak':E.spark,size:[2,3],col:'$hi',c2:'$deep',gravity:0}));
  const t=at0+0.55;
  if(el==='fire'&&s==='c')L.push({id:id('vol'),t:'firevol',at:t,life:2.2,att:'ground',pos:P,kind:'pillar',hx:h*0.22,hz:h*0.22,h,int:1.3,den:1.4});
  else L.push(mesh(t,2.2,{att:'ground',pos:P,shape:s==='b'?'spikes':el==='frost'?'cone':'cylinder',n:7,mat:E.mat==='fire'?(s==='a'?'energy':'fire'):E.mat,mode:'sheet',col:'$main',col2:'$deep',scale:{'0':[h*0.05,0.1,h*0.05],'0.15':[h*0.22,h,h*0.22],'0.85':[h*0.2,h,h*0.2],'1':[h*0.05,h*1.05,h*0.05]},rim:2,op:{'0':1,'0.85':0.9,'1':0},dis:{'0':0,'0.8':0,'1':0.9}}));
  L.push(...impact(el,s,t,h*0.4,P),light(t,2,{int:{'0':2,'0.8':1.6,'1':0},dist:h*3+8,pos:[0,h*0.6,4]}));
  if(el==='storm')L.push({id:id('bolt'),t:'bolt',at:t,life:2,att:'ground',pos:[0,h*0.5,4],radial:[h*0.3,h*0.7],n:2,w:0.1,blife:0.1,rate:10,acc:s!=='a'});
  return L;}
// ลำแสงตรงยาว len ม. (Railgun / ดูด) • inward = ไหลเข้าหาเรา
function beam(el,s,len,warn,inward){const L=[],t=warn||0;
  if(warn)L.push(mesh(0,warn,{shape:'beam',mat:'glow',col:'$main',pos:[0,1.3,0.6],scale:{'0':[0.03,0.03,0.05],'0.3':[0.04,0.04,1],'1':[0.05,0.05,1],x:[1,1,len]},op:{'0':0.4,'1':0.9}}));
  L.push(flash(t,2.4,{x:{pos:[0,1.3,0.7]}}),
    mesh(t,0.45,{shape:'beam',mat:s==='b'?'glow':'energy',col:s==='b'?'#ffffff':'$hi',col2:'$deep',pos:[0,1.3,0.5],scale:{'0':[0.02,0.02,0.1],'0.1':[s==='b'?0.45:0.3,s==='b'?0.45:0.3,1],'0.7':[0.22,0.22,1],'1':[0.01,0.01,1],x:[1,1,len]},scroll:inward?-3:3,rim:1.6,op:{'0':1,'1':0.5}}),
    emit(t,0.35,{rate:s==='c'?120:60,from:'line',fh:len,pos:[0,1.3,0.5],dir:inward?'in':'out',speed:[0.5,1.5],plife:[0.25,0.5],look:s==='b'?'ring':s==='c'?(el==='storm'?'streak':'smoke'):EL[el].spark,size:s==='b'?[6,9]:[2,3],grow:s==='b'?2:0,col:'$hi',c2:'$deep',gravity:0,drag:2,curl:false}),
    light(t,0.4,{int:1.6,dist:16,pos:[0,1.5,len/2]}),cam(t,s==='b'?4:2.5,{x:s==='b'?{kick:0.35}:{}}));
  if(el==='storm')L.push({id:id('bolt'),t:'bolt',at:t,life:0.35,pos:[0,1.3,1],to:[0,0,len-1],jit:s==='c'?1.2:0.4,n:s==='c'?3:1,w:0.1,blife:0.08,rate:18,acc:s==='c'});
  if(!inward)L.push(...impact(el,s,t+0.05,2.5,[0,1.3-1.3,len]));
  return {L,dur:t+1.6};}
// ---- ตารางท่า: [กลุ่ม, ท่า, ชื่อไทย, ผู้สร้าง(สไตล์) → {L,dur,params?}, at ของสตูดิโอ]
const SN={a:'แบบ A (พรีเมียม): ',b:'แบบ B (อนิเมะ): ',c:'แบบ C (สมจริง): '};
const SD={a:'พลังงานเรียบหรู แกนสว่าง + ขอบเรือง + วงกระแทก + ประกายตามธาตุ',b:'แฟลชคม เส้นความเร็ว วงช็อกขาว 2 ชั้น หนามแหลม จอกระตุก',c:'ไฟ/ควัน/หมอกจริง เศษกระเด็น อากาศบิด รอยบนพื้นค้าง'};
const MOVES=[
 ['fire','fireball','ลูกไฟชาร์จ (ยิงปกติกด 1.5 วิ)',s=>projectile('fire',s,16,0.55,3,0.9),'self'],
 ['fire','shield','โล่ไฟ + ลูกไฟวิญญาณ',s=>({L:aura('fire',s,1.6,true).concat(s==='b'?[]:[mesh(0,2,{loop:true,att:'feet',shape:'torus',mat:'fire',col:'$main',col2:'$deep',pos:[0,1.1,0],scale:[1.8,1.8,0.3],rot:[90,0,0],spin:200,op:0.6})]),dur:3}),'self'],
 ['fire','dash','พุ่งชาร์จ (Dash)',s=>dash('fire',s,9),'self'],
 ['fire','kindle','Kindle (ไฟลุกที่ปลายไม้ ยิงลูกไฟใหญ่ได้ทันที)',s=>({L:[flash(0,2,{x:{att:'wand'}}),...aura('fire',s,1.2,false).map(l=>l.att==='feet'&&l.t==='emit'?{...l,att:'wand',fr:0.3}:l)],dur:3}),'self'],
 ['fire','dragonfall','Dragonfall (บินขึ้น ปีกไฟ แล้วดิ่งลงระเบิด)',s=>({L:[emit(0,0.6,{att:'feet',rate:120,from:'disc',fr:1,dir:'up',spread:0.3,speed:[6,10],plife:[0.4,0.7],look:s==='b'?'streak':'fire',size:[3,5],col:'$hi',c2:'$deep',gravity:-2}),...skyStrike('fire',s,[[0,10,1.4]],6,0.6)],dur:3.2}),'front'],
 ['fire','ringofembers','Ring of Embers (อุกกาบาต + วงไฟกับดัก)',s=>({L:[...skyStrike('fire',s,[[0,10,0.6]],3,0.5),
   s==='c'?{id:'trapv',t:'firevol',at:0.7,life:2.4,att:'ground',pos:[0,0,10],kind:'wall',hx:4,hz:0.4,h:1.4,int:1}:{id:'trap',t:'mesh',at:0.7,life:2.4,att:'ground',pos:[0,0.05,10],shape:'ring',inner:0.85,mat:s==='a'?'energy':'fire',col:'$main',col2:'$deep',scale:4,spin:40,op:{'0':0,'0.1':0.9,'0.85':0.8,'1':0},rim:1.6},
   emit(0.7,2.2,{att:'ground',pos:[0,0.1,10],rate:40,from:'ring',fr:4,dir:'up',spread:0.2,speed:[1,2.5],plife:[0.5,0.9],look:'fire',size:[4,6],col:'$hi',c2:'$deep',gravity:-1})],dur:3.4}),'front'],
 ['fire','blazeform','Blazeform (ร่างไฟ 6 วิ)',s=>({L:aura('fire',s,1.8,false).concat([flash(0,3,{x:{att:'chest'}}),{id:'rise',t:'emit',at:0,life:0.3,att:'feet',burst:40,from:'ring',fr:1.2,dir:'up',speed:[4,8],plife:[0.5,0.8],look:'fire',size:[5,8],col:'$hi',c2:'$deep',gravity:-2}]),dur:3}),'self'],
 ['fire','ignitionsnap','Ignition Snap (ดีดนิ้ว ทุกคนที่ติดไฟระเบิด)',s=>({L:[flash(0,1.2,{x:{att:'wand'}}),{id:'snapw',t:'mesh',at:0,life:0.3,att:'chest',shape:'ring',inner:0.9,mat:'glow',col:'$hi',pos:[0,0.3,0.5],scale:{'0':0.2,'1':6,ease:'out'},op:{'0':0.9,'1':0}},
   ...impact('fire',s,0.18,1.8,[-3,0,8]),...impact('fire',s,0.26,1.8,[2.5,0,11]),...impact('fire',s,0.34,1.8,[0,0,14])],dur:2.2}),'self'],
 ['fire','colossus','อัลติ Inferno Colossus (ยักษ์ไฟ)',s=>({L:summon('fire',s,6),dur:3.4}),'self'],
 ['frost','permafrost','Permafrost (พื้นน้ำแข็งวงใหญ่ r 15 ม.)',s=>({L:[...impact('frost',s,0,4,[0,0,0]),{id:'floor',t:'mesh',at:0.1,life:2.6,att:'ground',shape:'disc',mat:s==='c'?'ice':'energy',col:'$main',col2:'$deep',pos:[0,0.04,0],scale:{'0':1,'0.25':15,'1':15,ease:'out'},op:{'0':0.6,'0.8':0.45,'1':0},rim:0.8,scroll:0.2},
   {id:'edge',t:'mesh',at:0.1,life:2.6,att:'ground',shape:'ring',inner:0.96,mat:s==='b'?'glow':'energy',col:s==='b'?'#ffffff':'$hi',pos:[0,0.06,0],scale:{'0':1,'0.25':15,'1':15,ease:'out'},op:{'0':0.9,'0.8':0.7,'1':0},spin:s==='b'?20:6}],dur:3}),'self'],
 ['frost','cryoshell','Cryo Shell (แช่แข็งตัวเอง 5 วิ)',s=>({L:aura('frost',s,1.4,true).concat([{id:'form',t:'emit',at:0,life:0.3,att:'chest',rate:120,from:'sphere',fr:2,dir:'in',speed:[4,6],plife:[0.25,0.35],look:s==='b'?'streak':'flake',size:[2,3],col:'#ffffff',c2:'$main',gravity:0}]),dur:3}),'self'],
 ['frost','frostaura','Frostbite Aura (ออร่าเยือกแข็ง r 9 ม.)',s=>({L:aura('frost',s,9,false),dur:3}),'self'],
 ['frost','mirrorlegion','อัลติ Mirror Legion (ดาบ/ขวานลอย 3 เล่ม + พุ่ง)',s=>{const L=[];
   for(const [x,z] of [[-2.75,1.5],[0,1],[2.75,1.5]]){L.push(emit(0,0.3,{att:'feet',pos:[x,1.5,z],rate:60,from:'sphere',fr:1.6,dir:'in',speed:[4,6],plife:[0.25,0.35],look:s==='b'?'streak':'flake',size:[2,3],col:'#ffffff',c2:'$main',gravity:0}),
     mesh(0.25,1.4,{att:'feet',pos:[x,1.5,z],shape:s==='b'?'crescent':'cone',wk:0.4,mat:'ice',col:'$main',col2:'$deep',rot:[s==='b'?0:180,0,0],scale:{'0':0.1,'0.15':[0.25,2.2,0.25],'1':[0.25,2.2,0.25]},rim:2,op:{'0':1,'0.85':1,'1':0},dis:{'0':0,'0.8':0,'1':1}}),flash(0.25,1.6,{x:{att:'feet',pos:[x,1.5,z]}}));}
   const d=dash('frost',s,15);return {L:L.concat(d.L.map(l=>({...l,at:(l.at||0)+0.5}))),dur:3.2};},'self'],
 ['storm','tri','สายฟ้าสามเหลี่ยม (ยิงปกติแรง)',s=>({L:[...skyStrike('storm',s,[[0,4,0.1],[-1.5,8,0.16],[1.5,8,0.16],[-3,12,0.22],[0,12,0.22],[3,12,0.22]],1.4,0)],dur:2}),'self'],
 ['storm','shield','โล่สายฟ้า (3 วิ) + ระเบิดโล่',s=>({L:aura('storm',s,1.6,true).concat([...impact('storm',s,0,2,[0,0,0]).map(l=>({...l,end:true}))]),dur:3}),'self'],
 ['storm','dash','Dash ทะลุศัตรู (วาร์ป)',s=>dash('storm',s,10),'self'],
 ['storm','thunderline','เส้นสายฟ้า (ชูไม้ แล้วผ่าเป็นแนว)',s=>({L:[{id:'up',t:'bolt',at:0,life:0.4,att:'wand',to:[0,6,0],jit:0.3,w:0.08,blife:0.08,rate:16},...skyStrike('storm',s,[0,1,2,3,4,5].map(i=>[0,3+i*2.4,0.5+i*0.04]),1.6,0.4)],dur:2.4}),'self'],
 ['storm','speedsiphon','ดูดความเร็ว',s=>{const b=beam('storm',s,10,0,true);b.L.push(...aura('storm',s,1.6,false).map(l=>({...l,loop:false,life:Math.min(l.life,1.2),at:0.4})).filter(l=>!l.end));return b;},'self'],
 ['storm','triplestrike','ฟ้าผ่าสามครั้งจุดเดิม',s=>({L:skyStrike('storm',s,[[0,10,0.5],[0,10,0.85],[0,10,1.2]],2.5,0.5),dur:2.8}),'self'],
 ['storm','stormorbs','ออร์บสายฟ้าคู่ (ลอยหลังเรา พุ่งใส่ศัตรู)',s=>{const L=[];for(const x of [-0.8,0.8]){L.push({id:'orb'+(x>0?'R':'L'),t:'mesh',at:0,life:1.2,att:'feet',shape:'sphere',mat:s==='b'?'glow':'energy',col:'$hi',col2:'$deep',pos:{'0':[x,1.8,-0.6],'0.6':[x,1.9,-0.6],'1':[x*0.3,1.3,10]},scale:0.35,rim:2,spin:300,fade:0},
   {id:id('otr'),t:'trail',at:0,life:1.2,of:'orb'+(x>0?'R':'L'),col:'$hi',col2:'$deep',w:0.3,tlife:0.2,k:1.6},{id:id('ob'),t:'bolt',at:0,life:1.2,att:'feet',pos:[x,1.8,-0.6],radial:[0.3,0.7],n:1,w:0.05,blife:0.06,rate:s==='c'?20:10,acc:true});}
   return {L:L.concat(impact('storm',s,1.2,2,[0,0,10])),dur:2.8};},'self'],
 ['storm','railgun','Railgun (เส้นเตือน 0.8 วิ แล้วยิงทะลุ)',s=>beam('storm',s,30,0.8,false),'self'],
 ['storm','stormdome','ลูกสายฟ้าโดม',s=>{const p=projectile('storm',s,14,0.7,5,0.8);p.L.push(mesh(p.dur-1.6,1.2,{att:'ground',pos:[0,0,14],shape:'dome',mat:'energy',col:'$main',col2:'$deep',scale:{'0':0.5,'0.2':5,'1':5.3,ease:'out'},op:{'0':0.9,'0.8':0.6,'1':0},rim:2.2,scroll:1.5}));p.dur+=0.4;return p;},'self'],
 ['storm','godlightning','อัลติ ร่างเทพสายฟ้า (กรงเล็บ 3 จังหวะ)',s=>({L:aura('storm',s,1.8,false).concat([0,1,2].map(i=>({id:'claw'+i,t:'trail',at:0.4+i*0.35,life:0.1,sweep:true,a0:i%2?60:-60,a1:i%2?-60:60,r:7,r0:5.5,tilt:i===2?-35:20,col:'#ffffff',col2:'$main',tlife:0.25,k:2.2,w:0.3,att:'feet',pos:[0,1.2,0]}))),dur:2.4}),'self'],
];
const only=process.argv.slice(2);let made=0;
for(const [g,m,th,fn,at] of MOVES){if(only.length&&!only.includes(m))continue;
  const dir=path.join(FXD,'var-'+g);fs.mkdirSync(dir,{recursive:true});
  for(const s of ['a','b','c']){N=0;let r=fn(s);if(Array.isArray(r))r={L:r,dur:3};
    let nl=0;const L=r.L.map(l=>{const o={};for(const k in l)if(l[k]!==undefined)o[k]=l[k];return o;}).filter(l=>l.t!=='light'||++nl<=2);   // ไฟจุดไม่เกิน 2 ดวง
    for(const l of L){if(l.t==='flash'&&typeof l.size==='number')l.size=Math.min(6,l.size);if(l.t==='emit'&&typeof l.fh==='number'&&l.fh>20){l.pos=[0,1.3,0.5+(l.fh-20)];l.fh=20;}}
    r.dur=Math.max(r.dur||0,...L.filter(l=>!l.loop&&!l.end).map(l=>(+l.at||0)+(+l.life||0)+(l.t==='decal'||l.t==='debris'?0:0.3)));
    const fx={v:1,desc:SN[s]+th+' — '+SD[s],tags:[g,m,'variant'],pal:PAL[g],dur:+Math.min(10,r.dur||3).toFixed(2),layers:L};
    fs.writeFileSync(path.join(dir,m+'_'+s+'.fx.json'),JSON.stringify(fx,null,1)+'\n');made++;}}
console.log('เขียน '+made+' ไฟล์ → assets/fx/var-*/ • ตรวจ: node tools/fx-check.js --quiet --nowrite • ดู: node tools/fx-compare.js <กลุ่ม>-<ท่า> var-<กลุ่ม>/<ท่า>_a ... --at <studio.at>');
