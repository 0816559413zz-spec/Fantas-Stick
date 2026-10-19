// ---------- efxFX: ภาพของ event "efx" ทุกคาถา (หนึ่ง case ต่อหนึ่งเอฟเฟกต์) ----------
function efxFX(ev){
  const x=ev.x,y=ev.y,H=ev.h!==undefined?ev.h:1,me=myPos(),near=!me||Math.hypot(x-me.x,y-me.y)<1000;
  switch(ev.z){
    // ----- สายน้ำแข็ง (ออกแบบโดยผู้เล่น) -----
    case 'swing':{
      const a=ev.a,R=ev.r||120,big=ev.c===2,col=ev.ax?'#e8f8ff':'#cfefff';
      const pts=[[x,y]];if(ev.m){const c=Math.cos(a),s=Math.sin(a);for(const k of [-1,1])pts.push([x+c*30-s*55*k,y+s*30+c*55*k]);}
      pts.forEach(([px,py],i)=>{
        if(big)return;
        makeSlash(px,py,H+0.1,a,R,false,(ev.c===1?-0.25:0.25),col);if(i)later(0.12,()=>makeSlash(px,py,H+0.25,a,R*0.92,false,(ev.c===1?0.25:-0.25),'#9fe0ff'));
        for(let j=0;j<(i?8:22);j++){const an=a+rnd(-1.05,1.05),rr=R*rnd(0.55,1.05);PARTS.push({x:px+Math.cos(an)*rr,y:py+Math.sin(an)*rr,h:H+(big?rnd(-0.6,1.4):rnd(-0.3,0.5)),vx:Math.cos(an)*rnd(40,140),vy:Math.sin(an)*rnd(40,140),vh:rnd(-0.5,1.5),life:rnd(0.25,0.5),max:0.5,col:j%4===0?'#ffffff':j%4===1?'#e8f8ff':col,size:rnd(1.2,2.4),g:2.5,drag:2.5});}
      });
      if(near&&!big)snd('whoosh',{x,y,vol:0.5});break;}
    case 'iceboom':burst(x,y,'#dff6ff',40,ev.r*2.6,0.6,2.4,{h:H,vh:[0,5],g:6});iceChips(x,y,H,12,ev.r*2.4,4);ring(x,y,'#8fe0ff',ev.r,0.35,Math.max(0.2,H-1));smoke(x,y,H,10,'#e8f6ff',1.4,7,ev.r);FX.flashLight(x,y,H,'#8fe0ff',4,12,0.25);if(near)snd('break',ev);break;
    case 'slam3':{{const c=Math.cos(ev.a),sn=Math.sin(ev.a),bx=x-c*ev.r*0.8,by=y-sn*ev.r*0.8,col=ev.ax?'#e8f8ff':'#cfefff';const sp=[[bx,by]];if(ev.m)for(const k of [-1,1])sp.push([bx-sn*55*k,by+c*55*k]);
      sp.forEach(([px,py],i)=>{makeSlash(px,py,0.5,ev.a,(ev.r/0.75)*1.15,true,0.12,col);if(!i)makeSlash(px,py,0.5,ev.a,(ev.r/0.75)*0.9,true,0.12,'#ffffff');});if(near)snd('whoosh',{x,y,vol:0.6});}
      ICEV.push(makeIceFloor(x,y,ev.r,1.4,1));ring(x,y,'#ffffff',ev.r*1.2,0.35,0.15);burst(x,y,'#dff6ff',50,ev.r*3,0.7,2.8,{h:0.4,vh:[3,9],g:10});burst(x,y,'#8fe0ff',24,ev.r*1.6,0.5,4,{h:0.3,vh:[0.5,2],g:1,smoke:true});SHAPES_Q.push({k:'decal',x,y,col:'#e8f6ff',s1:ev.r/24,life:3,op:0.6});FX.flashLight(x,y,1.5,'#8fe0ff',6,16,0.3);if(near){snd('slam',ev);snd('break',{x,y,vol:0.6});shake(7);}
      if(ev.m){const c=Math.cos(ev.a),s=Math.sin(ev.a);for(const k of [-1,1]){const mx=x-s*55*k,my=y+c*55*k;burst(mx,my,'#dff6ff',20,ev.r*2,0.5,2.4,{h:0.4,vh:[2,6],g:9});ring(mx,my,'#bfeaff',ev.r*0.8,0.3,0.15);}}break;}
    case 'slamgo':{const o=PM3.get(ev.id);if(o)o.slamT=1.5;}burst(x,y,'#dff6ff',16,160,0.4,2,{h:H,g:2});if(near)snd('whoosh',ev);break;
    case 'slam':dfCracks(x,y,0.06,ev.r*0.9,'#bfeaff',0.7);iceRing(x,y,ev.r*0.55,12,0.7,0.45,{up:0.06,down:0.25});for(let i=0;i<14;i++){const an=i/14*6.283;PARTS.push({x,y,h:0.12,vx:Math.cos(an)*ev.r*3,vy:Math.sin(an)*ev.r*3,vh:0.3,life:0.35,max:0.35,col:i%2?'#ffffff':'#bfeaff',size:2,g:1,drag:3});}
      {for(const [id,o] of PM3)if(o.slamT>0)o.slamT=0;}ring(x,y,'#bfeaff',ev.r,0.45,0.2);ring(x,y,'#ffffff',ev.r*0.6,0.35,0.2);burst(x,y,'#dff6ff',60,ev.r*3,0.7,2.6,{h:0.4,vh:[2,8],g:9});SHAPES_Q.push({k:'decal',x,y,col:'#e8f6ff',s1:ev.r/30,life:3,op:0.5});FX.flashLight(x,y,1.5,'#8fe0ff',6,18,0.35);if(near){snd('slam',ev);shake(6);}break;
    case 'forge':burst(x,y,'#dff6ff',16,90,0.5,2,{h:H,vh:[0.5,2],g:-0.5});ring(x,y,'#8fe0ff',45,0.3,0.15);FX.flashLight(x,y,H,'#8fe0ff',4,10,0.3);if(near)snd('parry',{x,y,vol:0.5});break;
    case 'fswap':{const o=PM3.get(ev.id);FX.flashSprite(x,y,H,'#dff6ff',0.3,2.2,0.12,2);if(o){o.tip.getWorldPosition(_pw);const t=simOf(_pw);_ev.set(0,-0.66,0);o.armR.localToWorld(_ev);const h=simOf(_ev);
      for(let i=0;i<14;i++){const sx=ev.m?h.x+rnd(-20,20):t.x,sy=ev.m?h.y+rnd(-20,20):t.y,sh=ev.m?h.h+rnd(-0.2,1):t.h,ex=ev.m?t.x:h.x+rnd(-14,14),ey=ev.m?t.y:h.y+rnd(-14,14),eh=ev.m?t.h:h.h+rnd(0,1.1);PARTS.push({x:sx,y:sy,h:sh,vx:(ex-sx)/0.25,vy:(ey-sy)/0.25,vh:(eh-sh)/0.25,life:0.25,max:0.25,col:i%2?'#ffffff':'#bfeaff',size:2,g:0,drag:0});}}
      burst(x,y,ev.m?'#bfeaff':'#ffffff',10,120,0.35,1.8,{h:H,g:0});if(ev.id===NET.myId)snd('ui_click');break;}
    case 'slide':burst(x,y,'#dff6ff',24,200,0.4,2,{h:0.3,vh:[0.5,2],g:3});for(let i=0;i<7;i++){const an=i/7*6.283+rnd(-0.2,0.2),r=rnd(12,26);iceBit(_plateG,x+Math.cos(an)*r,y+Math.sin(an)*r,0.1,rnd(0.35,0.55),0.5,rnd(0.35,0.5),{rx:rnd(-0.6,-0.3),ry:-an,life:0.6,up:0.06,down:0.3});}iceChips(x,y,0.3,8,180,4);if(near)snd('whoosh',ev);break;
    case 'ice':
      ICEV.push(makeIceFloor(x,y,ev.r,ev.t,ev.c,ev.lx,ev.ly));
      if(ev.c)ZV.push({x,y,r:ev.r,t:ev.t,kind:'icering',col:'#8fe0ff',file:zoneFx('icering',x,y,ev.r,ev.t,'#8fe0ff')});
      else if(Math.random()<0.5)burst(x,y,'#ffffff',3,60,0.4,1.4,{h:0.2,g:0});
      break;
    case 'perma':for(let k=0;k<5;k++)later(k*0.07,()=>ring(x,y,k%2?'#ffffff':'#bfeaff',ev.r*(0.25+k*0.19),0.45,0.12));burst(x,y,'#dff6ff',40,ev.r*1.6,0.8,2.2,{h:0.3,vh:[0,2],g:1});iceChips(x,y,0.5,10,260,4);
      later(0.15,()=>{dfCracks(x,y,0.06,ev.r*0.9,'#bfeaff',1.6);});later(0.3,()=>iceRing(x,y,ev.r,22,0.55,5.6,{up:0.25,down:0.4}));FX.flashLight(x,y,1,'#8fe0ff',5,22,0.4);if(near)snd('nova',{x,y,vol:0.6});break;
    case 'cryo':burst(x,y,'#dff6ff',20,140,0.6,2.4,{h:H,vh:[0,3],g:2});iceRing(x,y,24,8,0.6,0.5,{up:0.2,down:0.25});FX.flashLight(x,y,H,'#8fe0ff',4,10,0.3);if(near)snd('break',ev);break;
    case 'cryoend':burst(x,y,'#dff6ff',30,260,0.6,2.4,{h:H,vh:[1,5],g:8});iceChips(x,y,H,14,200,5);smoke(x,y,H,10,'#eef8ff',1,7,60);if(near)snd('break',ev);break;
    case 'auhit':burst(x,y,'#dff6ff',5,90,0.3,1.4,{h:H,vh:[0,2],g:5});if(Math.random()<0.5)iceChips(x,y,H,2,70,2);break;
    case 'aura':ring(x,y,'#bfeaff',180,0.4,0.2);smoke(x,y,H+0.6,14,'#eef8ff',0.9,8,140);for(let i=0;i<20;i++){const an=i/20*6.283;PARTS.push({x,y,h:H+rnd(0.3,1.8),vx:Math.cos(an)*200-Math.sin(an)*120,vy:Math.sin(an)*200+Math.cos(an)*120,vh:rnd(0,1),life:0.5,max:0.5,col:i%2?'#ffffff':'#cfefff',size:2,g:0,drag:2});}if(near)snd('push',{x,y,vol:0.4});break;
    case 'grcharge':if(near)snd('buff',ev);break;
    case 'gwave':{const m=makeWaveBlade();m.rotation.y=-ev.a;scene.add(m);WVV.push({x,y,a:ev.a,len:ev.len,d:0,m,gh:0});
      {const o=PM3.get(ev.id);if(o&&!ev.cl)o.grDown=0.3;const c=Math.cos(ev.a),sn=Math.sin(ev.a);makeSlash(x-c*20,y-sn*20,0.4,ev.a,85,true,0.1,'#cfefff');burst(x+c*40,y+sn*40,'#dff6ff',30,320,0.4,2.4,{h:0.6,vh:[1,5],g:6,a:ev.a,spread:0.7});FX.flashLight(x,y,1.2,'#8fe0ff',5,14,0.25);}}if(near){snd('whoosh',ev);snd('slam',{x,y,vol:0.4});}break;
    case 'glacier':{const o=PM3.get(ev.id);if(o)o.grUp=0.5;}GLV.push(makeGlacier(x,y,ev.a,ev.len,ev.t));if(near){snd('break',ev);shake(5);}break;
    case 'mirror':ULTV.push({x,y,a:ev.a,d:0,acc:100});burst(x,y,'#dff6ff',50,260,0.5,2.4,{h:1,vh:[1,4],g:2});FX.flashLight(x,y,1.5,'#8fe0ff',6,16,0.4);if(near){snd('nova',{x,y,vol:0.7});shake(4);}break;
    case 'mirrorend':burst(x,y,'#dff6ff',40,200,0.5,2,{h:H,g:3});break;
    // ----- สายไฟ (ออกแบบโดยผู้เล่น) -----
    case 'dfrise':
      for(let i=0;i<60;i++){const an=rnd(0,6.283),r=rnd(4,30);PARTS.push({x:x+Math.cos(an)*r,y:y+Math.sin(an)*r,h:H+0.05,vx:Math.cos(an)*rnd(10,60),vy:Math.sin(an)*rnd(10,60),vh:rnd(7,13),life:rnd(0.35,0.55),max:0.55,col:i%3===0?'#fff0b0':i%3===1?'#ffb347':'#ff5a1a',size:rnd(2.6,4.4),g:-2,drag:2,grow:0.7});}
      for(let i=0;i<20;i++)PARTS.push({x:x+rnd(-10,10),y:y+rnd(-10,10),h:H+0.2,vx:rnd(-40,40),vy:rnd(-40,40),vh:rnd(9,15),life:rnd(0.4,0.7),max:0.7,col:'#fff0b0',size:1.4,g:4,drag:1});
      ring(x,y,'#ff8a2a',55,0.35,H+0.1);smoke(x,y,H+0.1,8,'#3a2a24',0.9,6,80);FX.flashLight(x,y,H+0.5,'#ff8a3a',4,12,0.3);if(near){snd('cast_fire',ev);snd('whoosh',{x,y,vol:0.6});}break;
    // ----- สายฟ้า (ผู้เล่นออกแบบ) — สายฟ้าหนาเหลืองแกนขาว -----
    case 'stgain':burst(x,y,'#ffd000',10,120,0.35,2,{h:H,vh:[0,3],g:0});if(ev.id===NET.myId)snd('buff',{x,y,vol:0.5});break;
    case 'nostack':if(ev.id===NET.myId){floatText(x,y,'Lightning stack ไม่พอ (ต้องการ '+ev.n+')','#ffe27a',16,H);snd('ui_click');}break;
    case 'stri':{const a=ev.a,c=Math.cos(a),sn=Math.sin(a);
      for(let i=0;i<7;i++){const f=rnd(40,250),l=rnd(-1,1)*60*f/250,px=x+c*f-sn*l,py=y+sn*f+c*l;later(i*0.022,()=>{tbolt(px+rnd(-15,15),py+rnd(-15,15),H+10,px,py,H+0.1,0.2,0,0.26,1);burst(px,py,'#ffd000',8,170,0.3,2.2,{h:H+0.2,vh:[1,5],g:6});burst(px,py,'#ffffff',3,120,0.2,1.6,{h:H+0.2,vh:[1,4],g:6});burst(px,py,'#9fd8ff',3,140,0.25,1.6,{h:H+0.2,vh:[1,4],g:6});});}
      FX.flashLight(x+c*140,y+sn*140,H+2,'#ffd23a',5,16,0.25);if(near){snd('zap',ev);snd('boom',{x,y,vol:0.3});}break;}
    case 'sdash':FX.flashSprite(x,y,H-0.7,'#fff7b0',0.4,3.2,0.12,2.2);ring(x,y,'#ffd000',40,0.2,H-0.9);burst(x,y,'#ffd000',16,200,0.25,2.2,{h:H-0.8,vh:[0,3],g:2});burst(x,y,'#ffffff',8,150,0.2,1.8,{h:H-0.8,g:2});if(near)snd('dash',ev);break;
    case 'sdashe':{tbolt(x,y,H,ev.x2,ev.y2,H,0.24,0,0.2,3);tbolt(x,y,H+rnd(-0.5,0.5),ev.x2,ev.y2,H+rnd(-0.5,0.5),0.18,0,0.1,1);
      const L=Math.hypot(ev.x2-x,ev.y2-y)||1;for(let d=0;d<L;d+=16)PARTS.push({x:x+(ev.x2-x)*d/L+rnd(-6,6),y:y+(ev.y2-y)*d/L+rnd(-6,6),h:H+rnd(-0.5,0.6),vx:rnd(-30,30),vy:rnd(-30,30),vh:rnd(-0.5,1),life:rnd(0.2,0.35),max:0.35,col:Math.random()<0.6?'#ffd000':'#ffffff',size:rnd(2,3.2),g:0});
      burst(ev.x2,ev.y2,'#ffd000',10,160,0.25,2,{h:H,g:1});break;}
    case 'sdhit':{FX.flashSprite(x,y,H,'#ffffff',0.5,2.5,0.12,2.2);FX.flashLight(x,y,H,'#ffd23a',3.9,14,0.2);
      for(let i=0;i<7;i++){const an=rnd(0,6.283);tbolt(x,y,H,x+Math.cos(an)*rnd(35,60),y+Math.sin(an)*rnd(35,60),H+rnd(-0.8,0.8),0.14,0,0.12);}
      burst(x,y,'#ffd000',22,320,0.3,2.4,{h:H,vh:[-1,4],g:3});burst(x,y,'#9fd8ff',8,220,0.25,1.8,{h:H,g:3});if(near)snd('zap',ev);break;}
    case 'ston':for(let i=0;i<3;i++)tbolt(x+rnd(-12,12),y+rnd(-12,12),H+14,x,y,H+1,0.25,0,0.32,2);FX.flashSprite(x,y,H+1.2,'#fff7c0',0.4,1.6,0.12,1.6);FX.flashLight(x,y,H+2,'#ffd23a',2.5,12,0.25);ring(x,y,'#ffd000',60,0.3,H+0.1);if(near){snd('zap',ev);shake(2);}break;
    case 'sthit':{const a=ev.sx!==undefined?Math.atan2(ev.sy-y,ev.sx-x):rnd(0,6.283),q=shellPt(x,y,H,30,a,rnd(-0.3,0.5));
      FX.flashSprite(q[0],q[1],q[2],'#ffffff',0.4,2.6,0.1,2.2);
      for(let i=0;i<8;i++){const b=shellPt(x,y,H,30,a+rnd(-1.6,1.6),rnd(-0.9,1.1));tbolt(q[0],q[1],q[2],b[0],b[1],b[2],0.16,0,0.1,i<3?1:0);}
      burst(q[0],q[1],'#ffd000',18,260,0.3,2.2,{h:q[2],g:2});burst(q[0],q[1],'#ffffff',8,200,0.2,1.6,{h:q[2],g:2});if(near)snd('zap',{x,y,vol:0.5});break;}
    case 'stoff':burst(x,y,'#ffd000',10,100,0.3,1.8,{h:H+1,g:1});break;
    case 'stblast':{const R=ev.r;
      for(let k=0;k<4;k++)later(k*0.03,()=>{const rr=30-k*6;for(let j=0;j<4;j++){const a1=rnd(0,6.283),e1=rnd(-0.8,1),q=shellPt(x,y,H+1.15,rr,a1,e1),q2=shellPt(x,y,H+1.15,rr,a1+rnd(0.6,1.4),e1);tbolt(q[0],q[1],q[2],q2[0],q2[1],q2[2],0.06,0,0.1);}});
      later(0.13,()=>{ring(x,y,'#ffd000',R,0.35,H+0.1);ring(x,y,'#ffffff',R*0.6,0.25,H+0.1);SHAPES_Q.push({k:'ringv',x,y,h:H+1.1,col:'#ffd23a',s1:R*S3*1.1,life:0.3});
        for(let i=0;i<12;i++){const an=i/12*6.283+rnd(-0.2,0.2);tbolt(x,y,H+1.1,x+Math.cos(an)*R*rnd(0.8,1.05),y+Math.sin(an)*R*rnd(0.8,1.05),H+rnd(0.2,1.4),0.25,0,0.18,1);}
        burst(x,y,'#ffd000',40,R*2.2,0.4,2.4,{h:H+1,vh:[0,4],g:2});burst(x,y,'#9fd8ff',12,R*1.8,0.35,2,{h:H+1,vh:[0,3],g:2});FX.flashSprite(x,y,H+1.1,'#fff7c0',0.5,2.4,0.15,1.8);FX.flashLight(x,y,H+1.5,'#ffd23a',3,16,0.3);
        if(near){snd('boom',ev);snd('zap',ev);shake(5);}});
      if(ev.n)floatText(x,y,'⚡'+ev.n,'#fff27a',18,H+2.6);break;}
    case 'slup':if(near)snd('cast_ebolt',ev);break;
    case 'sline':{const a=ev.a,c=Math.cos(a),sn=Math.sin(a),L=ev.len,N=Math.max(4,Math.round(L/55));
      for(let i=0;i<=N;i++){const d=L*i/N,px=x+c*d,py=y+sn*d;later(0.3*i/N,()=>{tbolt(px+rnd(-15,15),py+rnd(-15,15),H+10,px+rnd(-8,8),py+rnd(-8,8),H+0.1,0.2,0,0.26,1);burst(px,py,'#ffd000',8,160,0.3,2.2,{h:H+0.2,vh:[1,5],g:6});burst(px,py,'#ffffff',3,120,0.2,1.6,{h:H+0.2,g:6});burst(px,py,'#9fd8ff',3,140,0.25,1.6,{h:H+0.2,vh:[1,4],g:6});if(i%3===0)FX.flashLight(px,py,H+1.5,'#ffd23a',3,10,0.2);});}
      if(near){snd('zap',ev);later(0.15,()=>snd('boom',{x,y,vol:0.3}));shake(2);}break;}
    case 'ssiph':{const T=ev.tg||[];
      for(const t of T){tbolt(t[0],t[1],t[2],x,y,H,0.3,0,0.16,1);FX.flashSprite(t[0],t[1],t[2],'#ffd23a',0.9,0.2,0.3,1.6);
        for(let j=0;j<10;j++)PARTS.push({x:t[0]+rnd(-12,12),y:t[1]+rnd(-12,12),h:t[2]+rnd(-0.6,0.8),vx:(x-t[0])*rnd(1.5,2.5),vy:(y-t[1])*rnd(1.5,2.5),vh:rnd(-2,-0.5),life:0.4,max:0.4,col:j%2?'#ffd000':'#ffffff',size:rnd(2,3),g:0});}
      // สายฟ้าที่ดูดมาไหลวนรอบตัว 0.6 วิ
      if(T.length)for(let k=0;k<8;k++)later(0.12+k*0.06,()=>{const P=[],a0=rnd(0,6.283),h0=H+rnd(-0.8,0.6);for(let i=0;i<=8;i++){const an=a0+i*0.32,r=24-i*0.6;_tw.set(tx(x+Math.cos(an)*r),h0+i*0.12+GY(x,y),tz(y+Math.sin(an)*r));P.push(_tw.clone());}tboltP(P,0.14,0.11,0.04);});
      burst(x,y,'#ffd000',24,160,0.5,2.2,{h:H,vh:[0,3],g:-0.5});FX.flashLight(x,y,H+1,'#ffd23a',4,12,0.3);if(near)snd('zap',ev);if(ev.id===NET.myId&&T.length)snd('buff');break;}
    case 'sorbon':burst(x,y,'#ffd000',20,140,0.4,2.2,{h:H,g:0});FX.flashLight(x,y,H,'#ffd23a',3,10,0.25);if(ev.id===NET.myId)snd('buff');break;
    case 'sorbgo':for(let i=0;i<(ev.n||1);i++){const g=new THREE.Group(),a1=new THREE.Sprite(glowMat('#ffd23a',1.6)),a2=new THREE.Sprite(glowMat('#ffffff',3.2));a1.scale.setScalar(0.85);a2.scale.setScalar(0.32);g.add(a1,a2);scene.add(g);SBV.push({g,x:x+(i?40:-40),y,h:H,x2:ev.x2,y2:ev.y2,h2:0.6,t:0,max:0.18,R:8});}
      if(near)snd('whoosh',ev);break;
    case 'sorbhit':ring(x,y,'#ffd000',60,0.3,0.15);for(let i=0;i<5;i++){const an=rnd(0,6.283);tbolt(x,y,H,x+Math.cos(an)*rnd(40,65),y+Math.sin(an)*rnd(40,65),H+rnd(-0.4,0.8),0.18,0,0.13);}
      burst(x,y,'#ffd000',22,240,0.35,2.4,{h:H,vh:[1,5],g:5});burst(x,y,'#ffffff',8,180,0.25,1.8,{h:H,g:5});FX.flashSprite(x,y,H,'#ffffff',0.4,2.2,0.12,2.2);FX.flashLight(x,y,H+1,'#ffd23a',5,14,0.25);if(near){snd('zap',ev);shake(2);}break;
    case 'sorboff':burst(x,y,'#ffd000',8,80,0.3,1.6,{h:H,g:0});break;
    case 'srailc':if(near)snd('cast_ebolt',ev);break;
    case 'srail':{const a=ev.a,c=Math.cos(a),sn=Math.sin(a),L=ev.len,ex=x+c*L,ey=y+sn*L;
      const b1=stBeam(x,y,H,a,L,0.2,'#ffffff',1,true);stFade(b1,0.28);const b2=stBeam(x,y,H,a,L,0.42,'#ffd000',0.85,true);stFade(b2,0.32);const b3=stBeam(x,y,H,a,L,0.8,'#ffc800',0.18);stFade(b3,0.35);STV[STV.length-1].grow=0.7;
      // สายฟ้าเกลียวพันรอบลำ
      for(let k=0;k<3;k++){const P=[],ph=k*2.09;for(let i=0;i<=24;i++){const d=L*i/24,an=ph+i*0.9;_tw.set(tx(x+c*d-sn*Math.cos(an)*12),H+Math.sin(an)*0.6+GY(x+c*d,y+sn*d),tz(y+sn*d+c*Math.cos(an)*12));P.push(_tw.clone());}tboltP(P,0.3,0.1,0.06);}
      for(let d=20;d<L;d+=20){PARTS.push({x:x+c*d+rnd(-10,10),y:y+sn*d+rnd(-10,10),h:H+rnd(-0.4,0.4),vx:rnd(-70,70),vy:rnd(-70,70),vh:rnd(-1,2),life:rnd(0.3,0.6),max:0.6,col:Math.random()<0.6?'#ffd000':Math.random()<0.5?'#ffffff':'#9fd8ff',size:rnd(2,3.4),g:1});}
      // แรงปะทะปลายลำ
      FX.flashSprite(ex,ey,H,'#ffffff',0.5,3.9,0.18,2.2);FX.flashSprite(ex,ey,H,'#ffd23a',0.6,5.5,0.32,2);FX.flashLight(ex,ey,H,'#ffd23a',5.2,20,0.35);
      for(let i=0;i<9;i++){const an=rnd(0,6.283);tbolt(ex,ey,H,ex+Math.cos(an)*rnd(40,80),ey+Math.sin(an)*rnd(40,80),H+rnd(-1,1.2),0.22,0,0.16,1);}
      burst(ex,ey,'#ffd000',36,360,0.45,2.6,{h:H,vh:[-1,6],g:4});burst(ex,ey,'#9fd8ff',12,260,0.35,2,{h:H,g:4});
      FX.flashSprite(x+c*45,y+sn*45,H,'#ffffff',0.3,2.2,0.1,2.5);FX.flashLight(x+c*60,y+sn*60,H,'#ffd23a',4,12,0.25);
      if(near){snd('boom',ev);snd('zap',ev);shake(5);}break;}
    case 'tswarn':{const g=makeDfCircle(true),R=ev.r*S3;g.visible=true;g.position.set(tx(x),H+0.07+GY(x,y),tz(y));g.scale.set(R,1,R);g.userData.mats[0].color.set('#ffd000');TSV.push({g,age:0});if(near)snd('cast_ebolt',ev);break;}
    case 'tstrike':{const R=ev.r;for(let i=0;i<3;i++)tbolt(x+rnd(-14,14),y+rnd(-14,14),H+15,x+rnd(-6,6),y+rnd(-6,6),H+0.1,0.22,0,0.36,2);
      FX.flashSprite(x,y,H+1,'#ffffff',0.6,3.3,0.12,2.2);FX.flashSprite(x,y,H+0.6,'#ffd23a',0.8,4.4,0.28,2);FX.flashLight(x,y,H+3,'#ffd23a',5.2,24,0.3);
      ring(x,y,'#ffd000',R*1.3,0.3,H+0.1);ring(x,y,'#ffffff',R*0.7,0.2,H+0.1);
      for(let i=0;i<6;i++){const an=rnd(0,6.283);tbolt(x,y,H+0.15,x+Math.cos(an)*R*rnd(0.9,1.5),y+Math.sin(an)*R*rnd(0.9,1.5),H+0.1,0.2,0,0.12);}
      burst(x,y,'#ffd000',34,R*4,0.45,2.4,{h:H+0.3,vh:[2,8],g:8});burst(x,y,'#ffffff',14,R*3,0.3,2,{h:H+0.3,vh:[2,7],g:8});burst(x,y,'#9fd8ff',10,R*3,0.35,1.8,{h:H+0.3,vh:[1,5],g:6});
      SHAPES_Q.push({k:'decal',x,y,col:'#000000',s1:R/36,life:3,op:0.35});
      if(near){snd('zap',ev);snd('boom',{x,y,vol:0.5});shake(3);}break;}
    case 'sdrise':for(let i=0;i<4;i++)tbolt(x+rnd(-20,20),y+rnd(-20,20),H+0.1,x+rnd(-6,6),y+rnd(-6,6),H+7,0.28,0,0.22,1);
      for(let i=0;i<40;i++){const an=rnd(0,6.283),r=rnd(4,30);PARTS.push({x:x+Math.cos(an)*r,y:y+Math.sin(an)*r,h:H+0.05,vx:Math.cos(an)*rnd(10,60),vy:Math.sin(an)*rnd(10,60),vh:rnd(7,13),life:rnd(0.35,0.55),max:0.55,col:i%3===0?'#ffffff':i%3===1?'#ffd000':'#9fd8ff',size:rnd(2.4,4),g:-2,drag:2});}
      ring(x,y,'#ffd000',55,0.35,H+0.1);FX.flashLight(x,y,H+0.5,'#ffd23a',4,12,0.3);if(near){snd('zap',ev);snd('whoosh',{x,y,vol:0.6});}break;
    case 'sdball':{const g=new THREE.Group(),a1=new THREE.Sprite(glowMat('#ffd23a',2)),a2=new THREE.Sprite(glowMat('#ffffff',3.5));a1.scale.setScalar(2);a2.scale.setScalar(0.9);g.add(a1,a2);scene.add(g);SBV.push({g,x,y,h:H,x2:ev.x2,y2:ev.y2,h2:0.8,t:0,max:0.3,R:22});tbolt(x,y,H,ev.x2,ev.y2,0.5,0.3,0,0.12,2);if(near)snd('whoosh',ev);break;}
    case 'sdome':{const R=ev.r*S3,m=new THREE.Mesh(new THREE.SphereGeometry(R,24,12,0,Math.PI*2,0,Math.PI/2),new THREE.MeshBasicMaterial({color:hdr('#ffd23a',1.2),transparent:true,opacity:0.2,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
      const w=new THREE.Mesh(new THREE.SphereGeometry(R*1.01,14,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshBasicMaterial({color:'#ffd000',wireframe:true,transparent:true,opacity:0.45,depthWrite:false}));
      m.position.set(tx(x),H+GY(x,y),tz(y));w.position.copy(m.position);scene.add(m,w);
      const rings=[0,1,2,3].map(i=>{const r=new THREE.Mesh(new THREE.RingGeometry(0.9,1,48),new THREE.MeshBasicMaterial({color:'#ffcc00',transparent:true,opacity:0.6,depthWrite:false,side:THREE.DoubleSide}));r.rotation.x=-Math.PI/2;r.position.set(tx(x),H+0.06+GY(x,y),tz(y));r.userData.ph=i/4;scene.add(r);return r;});
      const pit=new THREE.Mesh(new THREE.CircleGeometry(1,40),new THREE.MeshBasicMaterial({color:'#2a1a00',transparent:true,opacity:0.35,depthWrite:false}));pit.rotation.x=-Math.PI/2;pit.position.set(tx(x),H+0.05+GY(x,y),tz(y));pit.scale.setScalar(R);scene.add(pit);
      const orb=new THREE.Group(),o1=new THREE.Sprite(glowMat('#ffd23a',2)),o2=new THREE.Sprite(glowMat('#ffffff',3.5));o1.material.userData.keep=true;o2.material.userData.keep=true;o1.scale.setScalar(2.2);o2.scale.setScalar(0.95);orb.add(o1,o2);orb.position.set(tx(x),H+1.3+GY(x,y),tz(y));scene.add(orb);
      SDV.push({m,w,rings,pit,orb,x,y,h:H,r:ev.r,t:ev.t,max:ev.t});
      FX.flashSprite(x,y,H+0.5,'#ffffff',0.5,3.3,0.18,2.2);FX.flashLight(x,y,H+1,'#ffd23a',4.5,20,0.4);ring(x,y,'#ffd000',ev.r,0.4,H+0.1);burst(x,y,'#ffd000',40,ev.r*2,0.4,2.4,{h:H+0.3,vh:[2,6],g:5});if(near){snd('boom',ev);snd('zap',ev);shake(4);}break;}
    case 'sdboom':{const R=ev.r,g=!!ev.g;FX.flashSprite(x,y,H+0.5,'#ffffff',0.35,g?6:5,0.1,3);FX.flashSprite(x,y,H+0.4,'#ffd23a',0.5,g?10:8,0.3,2);FX.flashLight(x,y,H+1,'#ffd23a',5.9,26,0.45);
      ring(x,y,'#ffffff',R*0.5,0.22,H+0.06);ring(x,y,'#ffd000',R,0.35,H+0.05);ring(x,y,'#ffc800',R*1.4,0.5,H+0.05);
      for(let i=0;i<12;i++){const an=i/12*6.283+rnd(-0.15,0.15);tbolt(x,y,H+0.3,x+Math.cos(an)*R*rnd(0.8,1.3),y+Math.sin(an)*R*rnd(0.8,1.3),H+0.1,0.28,0,0.18,1);}
      for(let i=0;i<4;i++)tbolt(x+rnd(-30,30),y+rnd(-30,30),H+16,x,y,H+0.2,0.28,0,0.34,2);
      burst(x,y,'#ffd000',50,R*2.4,0.45,2.6,{h:H+0.3,vh:[2,8],g:6});burst(x,y,'#ffffff',20,R*1.6,0.3,2,{h:H+0.3,vh:[3,8],g:5});burst(x,y,'#9fd8ff',14,R*2,0.35,2,{h:H+0.3,vh:[2,6],g:5});
      SHAPES_Q.push({k:'decal',x,y,col:'#000000',s1:R/36,life:3,op:0.4});
      if(near){snd('boom',ev);snd('boom',{x,y,vol:0.6});snd('zap',ev);shake(g?8:6);}break;}
    case 'godon':{const o=PM3.get(ev.id);if(o)o.godUp=0.55;
      for(let i=0;i<4;i++)later(i*0.05,()=>tbolt(x+rnd(-18,18),y+rnd(-18,18),H+18,x+rnd(-4,4),y+rnd(-4,4),H+1.2,0.35,0,0.5,3));
      later(0.12,()=>{FX.flashSprite(x,y,H+1.2,'#ffffff',0.6,5,0.2,2.2);FX.flashLight(x,y,H+2,'#ffd23a',6.5,26,0.5);ring(x,y,'#ffd000',140,0.5,H+0.1);burst(x,y,'#ffd000',60,320,0.6,2.6,{h:H+1,vh:[0,6],g:1});burst(x,y,'#9fd8ff',20,260,0.5,2,{h:H+1,g:1});
        if(near){snd('nova',ev);snd('zap',ev);shake(6);}});break;}
    case 'godoff':burst(x,y,'#ffd000',24,160,0.5,2,{h:H,vh:[0,2],g:0});break;
    case 'sclaw':{const a=ev.a,emp=ev.n===3,big=ev.n>=2,c=Math.cos(a),sn=Math.sin(a);
      // รอยกรงเล็บตั้งขวางหน้าเรา: ท่า 1 ปาดเฉียงลงขวา / ท่า 2 ปาดเฉียงลงซ้าย / ท่า 3 ฟาดลงจากบน / เสริม = รอยใหญ่ 3 เส้นขนาน + ประกายพุ่งไปถึงระยะ 280
      const rot=emp?-0.75:ev.n===0?-0.6:ev.n===1?0.6:-1.45,D=emp?135:105;
      clawRakes(x+c*D,y+sn*D,H+0.55,a,emp?3.3:big?2.7:2.3,rot,emp||big);
      if(emp){for(let i=0;i<3;i++){const off=(i-1)*24;for(let j=0;j<8;j++){const f=110+j*22;PARTS.push({x:x+c*f-sn*off,y:y+sn*f+c*off,h:H+0.6-j*0.12,vx:c*200,vy:sn*200,vh:0,life:0.18+j*0.015,max:0.3,col:j%2?'#ffd000':'#ffffff',size:2.4,g:0});}}
        FX.flashSprite(x+c*95,y+sn*95,H,'#fff7b0',0.4,3,0.12,2.2);burst(x+c*230,y+sn*230,'#ffd000',16,240,0.3,2.2,{h:H,g:3});burst(x+c*230,y+sn*230,'#9fd8ff',8,200,0.3,1.8,{h:H,g:3});}
      for(let i=0;i<(big?6:3);i++){const an=a+rnd(-0.5,0.5),d=rnd(D-20,D+40);burst(x+Math.cos(an)*d,y+Math.sin(an)*d,i%2?'#ffd000':'#ffffff',4,160,0.25,2,{h:H,g:3});}
      if(near)snd(big?'zap':'whoosh',ev);break;}
    case 'dfdive':burst(x,y,'#ffb347',24,160,0.3,2.6,{h:H+1,vh:[-2,2],g:0});FX.flashSprite(x,y,H+1,'#ffd27a',0.25,3,0.12,2);if(near)snd('whoosh',ev);break;
    case 'dfcancel':smoke(x,y,H,10,'#3a2a24',0.8,6,80);break;
    case 'dfboom':{
      const R=ev.r;
      FX.flashSprite(x,y,H+0.5,'#ffffff',0.3,4.5,0.08,3);FX.flashSprite(x,y,H+0.4,'#fff6d0',0.4,6,0.16,2.5);FX.flashSprite(x,y,H+0.3,'#ff9a3a',0.45,8.5,0.32,1.8);
      FX.flashLight(x,y,H+0.8,'#ffb347',8,24,0.45);
      ring(x,y,'#ffffff',R*0.55,0.22,H+0.06);ring(x,y,'#ffd27a',R,0.35,H+0.05);ring(x,y,'#ff8a2a',R*1.5,0.5,H+0.05);
      dfCracks(x,y,H+0.04,R*1.15);
      // สะบัดปีกไฟออกตอนกระแทก
      {const o=PM3.get(ev.id),fa=o?-o.g.rotation.y+Math.PI/2:0;for(const sd of [-1,1])for(let i=0;i<14;i++){const an=fa+sd*Math.PI/2+rnd(-0.5,0.5);flame(x,y,H+rnd(0.5,1.8),{vx:Math.cos(an)*rnd(250,420),vy:Math.sin(an)*rnd(250,420),vh:rnd(1,4),life:0.35,size:rnd(10,14),drag:4});}}
      // เสาไฟพุ่งขึ้นกลางจุดกระแทก
      for(let i=0;i<46;i++){const an=rnd(0,6.283),r=rnd(0,R*0.3);PARTS.push({x:x+Math.cos(an)*r,y:y+Math.sin(an)*r,h:H+rnd(0,0.4),vx:Math.cos(an)*rnd(5,30),vy:Math.sin(an)*rnd(5,30),vh:rnd(9,18),life:rnd(0.35,0.6),max:0.6,col:i%3===0?'#fff4c8':i%3===1?'#ffb347':'#ff5a1a',size:rnd(3.5,6),g:-1,drag:2.5,grow:0.6});}
      // คลื่นไฟแผ่ราบไปตามพื้น
      for(let i=0;i<40;i++){const an=i/40*6.283+rnd(-0.08,0.08),v=R*rnd(2.6,3.4);PARTS.push({x:x+Math.cos(an)*12,y:y+Math.sin(an)*12,h:H+0.2,vx:Math.cos(an)*v,vy:Math.sin(an)*v,vh:rnd(0.5,2),life:0.4,max:0.4,col:i%2?'#ff7a1a':'#ffc04a',size:rnd(3.5,5),g:0,drag:4,grow:0.9});}
      // เศษหินกระเด็น
      for(let i=0;i<18;i++){const an=rnd(0,6.283),v=rnd(80,R*2);PARTS.push({x:x+Math.cos(an)*rnd(5,R*0.4),y:y+Math.sin(an)*rnd(5,R*0.4),h:H+0.1,vx:Math.cos(an)*v,vy:Math.sin(an)*v,vh:rnd(5,10),life:rnd(0.5,0.7),max:0.7,col:i%2?'#4a3a30':'#2a221c',size:rnd(2.4,3.6),g:22,drag:0.5});}
      burst(x,y,'#ffb347',36,R*2.4,0.45,2.4,{h:H+0.2,vh:[2,7],g:6});burst(x,y,'#fff0b0',20,R*1.6,0.3,1.8,{h:H+0.2,vh:[4,9],g:5});
      // ถ่านไฟค้างบนพื้นแป๊บหนึ่ง
      for(let i=0;i<22;i++){const an=rnd(0,6.283),r=Math.sqrt(Math.random())*R;PARTS.push({x:x+Math.cos(an)*r,y:y+Math.sin(an)*r,h:H+0.06,vx:0,vy:0,vh:rnd(0.3,1.2),life:rnd(0.45,0.6),max:0.6,col:i%2?'#ff6a1a':'#ffd27a',size:rnd(1.8,2.8),g:-0.5});}
      smoke(x,y,H+0.1,12,'#3a2a24',0.6,8,R);
      if(near){snd('boom',ev);snd('boom',{x,y,vol:0.6});shake(8);}break;}
    case 'fblock':break;
    case 'orbget':{const o=PM3.get(ev.id),a=o?-o.g.rotation.y+Math.PI/2:0;FX.flashSprite(x,y,H,'#ffd27a',0.4,3.5,0.15,2.4);burst(x,y,'#ffb347',14,120,0.4,2.2,{h:H,g:-1});
      // ลูกไฟ 2 ลูกก่อตัวจากโล่ (หน้าตัว) แล้วลอยไปประจำข้างตัว
      for(const sd of [-1,1]){const sx=x+Math.cos(a)*30,sy=y+Math.sin(a)*30,ex=x-Math.sin(a)*sd*36-Math.cos(a)*15,ey=y+Math.cos(a)*sd*36-Math.sin(a)*15;for(let k=0;k<6;k++)later(k*0.04,()=>{const t=k/5;flame(lerp(sx,ex,t),lerp(sy,ey,t),H-0.3,{vh:1,life:0.2,size:6,g:-1});});}
      if(ev.id===NET.myId)snd('buff');break;}
    case 'orbshot':{const n=ev.n||1;for(let i=0;i<n;i++){const sp=new THREE.Sprite(glowMat('#ffb347',3.2));sp.scale.setScalar(1.3);const cr=new THREE.Sprite(glowMat('#fff2c0',3.5));cr.scale.setScalar(0.55);sp.visible=cr.visible=false;scene.add(sp,cr);OBV.push({x,y,h:H,x2:ev.x2,y2:ev.y2,h2:ev.h2,t:-i*0.07,max:ev.t,s:rnd(-1,1),sp,cr});}if(near)snd('cast_fire',ev);break;}
    case 'orbhit':burst(x,y,'#ffb347',10+ev.n*4,180,0.4,2.4,{h:H,vh:[0,3],g:1});FX.flashLight(x,y,H,'#ff8a3a',3+ev.n*0.5,10,0.2);if(near)snd('boom',{x,y,vol:0.35});break;
    case 'bigboom':explosionFX(x,y,Math.max(0.3,H));ring(x,y,'#ffb347',ev.r,0.4,0.15);ring(x,y,'#ff6a1a',ev.r*0.6,0.3,0.15);
      for(let i=0;i<24;i++){const an=i/24*6.283;flame(x+Math.cos(an)*12,y+Math.sin(an)*12,0.15,{vx:Math.cos(an)*ev.r*3,vy:Math.sin(an)*ev.r*3,vh:rnd(1.5,4),life:0.38,size:rnd(9,13),drag:5});}
      for(let i=0;i<10;i++)flame(x+rnd(-15,15),y+rnd(-15,15),0.2,{vh:rnd(6,10),life:0.45,size:rnd(10,14),g:-1});if(near){snd('boom',ev);shake(4);}break;
    case 'jump':if(ev.id===NET.myId||near)burst(x,y,'#d8d0c0',6,70,0.3,2.2,{h:0.15,g:1,smoke:true});break;
    case 'brn':burst(x,y,'#ff8a2a',8,90,0.4,2,{h:H-0.4,vh:[0.5,2],g:-1});break;
    case 'kindle':
      for(let i=0;i<70;i++){const a=rnd(0,6.283),r=rnd(4,26);PARTS.push({x:x+Math.cos(a)*r,y:y+Math.sin(a)*r,h:H+0.05,vx:Math.cos(a)*rnd(5,30),vy:Math.sin(a)*rnd(5,30),vh:rnd(6,12),life:rnd(0.35,0.6),max:0.6,col:i%3===0?'#fff0b0':i%3===1?'#ffb347':'#ff5a1a',size:rnd(2.4,4.2),g:-2,drag:2,grow:0.8});}
      ring(x,y,'#ffb347',45,0.35,H+0.1);for(let i=0;i<14;i++){const an=rnd(0,6.283),r=rnd(4,22);flame(x+Math.cos(an)*r,y+Math.sin(an)*r,H+0.05,{vh:rnd(7,11),life:rnd(0.35,0.5),size:rnd(8,12),g:-1.5});}
      FX.flashLight(x,y,H+1,'#ff8a3a',5,12,0.35);if(near)snd('cast_fire',ev);if(ev.id===NET.myId)snd('buff');break;
    case 'ering':{const own=zoneFx('ering',x,y,ev.r,ev.t,'#ff6a2a');ZV.push({x,y,r:ev.r,t:ev.t,kind:'ering',col:'#ff6a2a',file:own});if(own){if(near)snd('boom',{x,y,vol:0.5});break;}}SHAPES_Q.push({k:'rune',x,y,col:'#ff7a2a',s1:ev.r*S3,life:ev.t,op:0.7});ring(x,y,'#ffb347',ev.r,0.4,0.2);
      // กำแพงไฟปะทุขึ้นจากพื้นตอนวาง
      for(let i=0;i<48;i++){const a=i/48*6.283;flame(x+Math.cos(a)*ev.r,y+Math.sin(a)*ev.r,0.05,{vh:rnd(9,13),life:rnd(0.35,0.5),size:rnd(12,16),g:-1});}
      FX.flashLight(x,y,2,'#ff8a3a',6,20,0.35);if(near)snd('boom',{x,y,vol:0.5});break;
    case 'eringhit':burst(x,y,'#ffb347',22,220,0.4,2.2,{h:H,vh:[0,3],g:2});for(let i=0;i<8;i++)flame(x+rnd(-12,12),y+rnd(-12,12),Math.max(0.1,H-1.2),{vx:rnd(-90,90),vy:rnd(-90,90),vh:rnd(4,8),life:0.3,size:rnd(9,12),drag:4});FX.flashLight(x,y,H,'#ff8a3a',3,10,0.2);if(near)snd('block',{x,y,vol:0.5});break;
    case 'blaze':{const o=PM3.get(ev.id);if(o)o.blzIn=0.6;}burst(x,y,'#ff7a2a',30,200,0.6,2.4,{h:H,vh:[1,5],g:-1});ring(x,y,'#ffb347',80,0.4,0.2);FX.flashLight(x,y,H+1,'#ff8a3a',5,16,0.4);if(near)snd('cast_fire',ev);break;
    case 'snapwind':if(near)snd('cast_fire',{x,y,vol:0.5});break;
    case 'snap':{const o=PM3.get(ev.id);let hx=x,hy=y,hh=H+1.2;if(o){o.tip.getWorldPosition(_pw);const q=simOf(_pw);hx=q.x;hy=q.y;hh=q.h;}
      FX.flashSprite(hx,hy,hh,'#fff6d0',0.3,3.2,0.12,2.6);for(let i=0;i<10;i++){const an=rnd(0,6.283);flame(hx,hy,hh-0.2,{vx:Math.cos(an)*rnd(60,140),vy:Math.sin(an)*rnd(60,140),vh:rnd(1,4),life:0.25,size:rnd(4,7),drag:5});}}
      ring(x,y,'#ffd27a',500,0.35,0.3);FX.flashLight(x,y,H,'#ffb347',5,16,0.25);if(near)snd('parry',{x,y,vol:0.5});break;
    case 'snapboom':{const n=Math.max(1,ev.n|0);explosionFX(x,y,H);
      // ปะทุเป็นเปลวหลายชั้นตามจำนวน stack + สะเก็ดกระเด็น แล้วเหลือควันกับถ่านไฟ
      for(let L=0;L<n;L++)later(L*0.07,()=>{for(let i=0;i<10;i++){const an=rnd(0,6.283);flame(x+Math.cos(an)*10,y+Math.sin(an)*10,Math.max(0.1,H-1.1)+L*0.35,{vx:Math.cos(an)*rnd(80,170),vy:Math.sin(an)*rnd(80,170),vh:rnd(3,7),life:0.4,size:rnd(9,13)+L,drag:4});}});
      for(let i=0;i<10+n*4;i++){const an=rnd(0,6.283),sp=rnd(150,380);PARTS.push({x,y,h:H,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,vh:rnd(1,6),life:rnd(0.3,0.6),max:0.6,col:i%2?'#ffb347':'#fff0b0',size:1.7,g:8,drag:2});}
      later(0.25+n*0.07,()=>{smoke(x,y,H-0.6,8,'#3a2a22',1.2,7,60);for(let i=0;i<8;i++)PARTS.push({x:x+rnd(-20,20),y:y+rnd(-20,20),h:H-0.8,vx:rnd(-20,20),vy:rnd(-20,20),vh:rnd(0.5,1.5),life:0.8,max:0.8,col:'#ff6a1a',size:1.6,g:-0.3});});
      if(near){snd('boom',ev);shake(3+n);}break;}
    case 'colossus':for(let i=0;i<6;i++){const an=i/6*6.283;for(let j=0;j<10;j++)flame(x+Math.cos(an)*150,y+Math.sin(an)*150,0.1,{vh:rnd(8,14),life:rnd(0.4,0.6),size:rnd(12,16),g:-1});}burst(x,y,'#ff6a2a',40,300,1,3,{h:H+1,vh:[2,8],g:-1});ring(x,y,'#ffb347',140,0.6,0.2);FX.flashLight(x,y,H+3,'#ff7a2a',8,30,0.6);if(near){snd('roar',ev);shake(6);}break;
    case 'colbolt':{const o=PM3.get(ev.id);if(o)o.colShot=performance.now();}FX.flashSprite(x,y,H,'#ffd27a',0.5,4,0.15,2.4);COLB.push({x,y,h:H,x2:ev.x2,y2:ev.y2,t:0,max:ev.t});if(near)snd('cast_fire',ev);break;
    case 'colboom':explosionFX(x,y,0.4);
      for(let i=0;i<40;i++)flame(x+rnd(-30,30),y+rnd(-30,30),0.1,{vh:rnd(10,18),life:rnd(0.5,0.8),size:rnd(14,20),g:-1,drag:1.5});
      for(let i=0;i<18;i++){const an=rnd(0,6.283),sp=rnd(150,350);PARTS.push({x,y,h:0.5,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,vh:rnd(5,11),life:rnd(0.7,1),max:1,col:i%2?'#3a2418':'#ff7a2a',size:rnd(2.4,3.6),g:16,drag:0.4});}
ring(x,y,'#ff9a4a',ev.r,0.55,0.2);ring(x,y,'#ffd27a',ev.r*0.6,0.45,0.2);burst(x,y,'#ff6a2a',90,ev.r*2.6,1,5,{h:0.5,vh:[2,10],g:9});SHAPES_Q.push({k:'decal',x,y,col:'#000000',s1:ev.r/30,life:6,op:0.55});FX.flashLight(x,y,3,'#ff7a2a',9,32,0.5);shake(10);snd('boom',ev);break;
    case 'colend':smoke(x,y,H,14,'#3a2a22',2,9,120);
      for(let i=0;i<70;i++){const an=rnd(0,6.283),r=rnd(10,70);flame(x+Math.cos(an)*r,y+Math.sin(an)*r,H-2+rnd(0,6),{vx:Math.cos(an)*rnd(20,80),vy:Math.sin(an)*rnd(20,80),vh:rnd(2,5),life:rnd(0.6,1.1),size:rnd(6,11),g:-1,drag:1});}
      for(let i=0;i<30;i++){const an=rnd(0,6.283),r=rnd(10,70);PARTS.push({x:x+Math.cos(an)*r,y:y+Math.sin(an)*r,h:H-1+rnd(0,5),vx:rnd(-30,30),vy:rnd(-30,30),vh:rnd(1.5,4),life:rnd(0.8,1.3),max:1.3,col:i%2?'#ff7a2a':'#ffd27a',size:rnd(2,3.2),g:-0.5});}break;
    case 'pboom':{const k=Math.min(1,(ev.n||0)/5);explosionFX(x,y,H*0.5);burst(x,y,'#ffb347',30+40*k,300+300*k,0.5,3,{h:H,a:ev.a+Math.PI,spread:0.9,g:2});smoke(x,y,0.4,10+10*k,'#2a2522',1.6,8,100);if(near){snd('boom',{x,y,vol:0.5+0.4*k});shake(2+5*k);}break;}
    case 'ember':
      ring(x,y,'#ff9a4a',ev.r,0.4,H);ring(x,y,'#ffd27a',ev.r*0.6,0.3,H);
      SHAPES_Q.push({k:'dome',x,y,h:H,col:'#ff7a2a',s0:0.4,s1:ev.r*S3,life:0.35,op:0.3,full:1});
      burst(x,y,'#ffb347',50,ev.r*3,0.7,2.4,{h:H,vh:[0,4],g:3});burst(x,y,'#ff5a1a',20,ev.r*1.5,0.5,5,{h:H,vh:[0,2],g:-1});
      FX.flashLight(x,y,H+0.5,'#ff8a3a',5,18,0.35);if(near){snd('boom',ev);shake(4);}break;
    case 'inferno':
      ring(x,y,'#ff7a2a',ev.r,0.7,H);ring(x,y,'#ffd27a',ev.r*0.7,0.55,H);
      SHAPES_Q.push({k:'dome',x,y,h:H,col:'#ff5a1a',s0:0.5,s1:ev.r*S3*0.9,life:0.6,op:0.28,full:1});
      burst(x,y,'#ffb347',110,ev.r*2.2,1,2.8,{h:H,vh:[1,8],g:4});burst(x,y,'#ff4a10',50,ev.r,0.8,6,{h:H,vh:[0,3],g:-1.5});smoke(x,y,H,26,'#2a2522',2,10,220);
      FX.flashLight(x,y,H+2,'#ff7a2a',9,34,0.7);shake(12);snd('boom',ev);snd('nova',ev);break;
    case 'melt':smoke(x,y,H,10,'#e8eef0',1.2,7,60);burst(x,y,'#ffb347',12,160,0.4,2,{h:H,g:2});floatText(x,y,'ละลาย!','#ffb36a',17,H+1);break;
    case 'freeze':burst(x,y,'#bfeaff',26,160,0.6,2.4,{h:H,vh:[0,3],g:1});FX.flashLight(x,y,H,'#8fe0ff',3,10,0.3);floatText(x,y,'แข็ง!','#9fe8ff',18,H+1.2);if(near)snd('parry',{x,y,vol:0.4});break;
    case 'wallbreak':burst(x,y,'#dff6ff',34,260,0.7,2.4,{h:1.5,vh:[0,5],g:8});ring(x,y,'#bfeaff',ev.r+10,0.3,0.2);if(near)snd('break',ev);break;
    case 'wallhit':burst(x,y,'#dff6ff',6,140,0.3,1.8,{h:ev.h||1,g:4});break;
    case 'vine':
      for(let i=0;i<7;i++){const a=i/7*Math.PI*2;for(let k=0;k<5;k++)PARTS.push({x:x+Math.cos(a)*(10+k*5),y:y+Math.sin(a)*(10+k*5),h:0.1+k*0.35,vx:0,vy:0,vh:0.6,life:1,max:1,col:'#3f9a45',size:3,g:0,drag:2});}
      burst(x,y,'#6fd57f',20,160,0.6,2,{h:0.4,vh:[1,4],g:3});ring(x,y,'#6fd57f',55,0.4,0.2);if(near)snd('splat',ev);break;
    case 'silence':burst(x,y,'#b57dff',18,120,0.6,2,{h:H,vh:[0,2],g:0});floatText(x,y,'🤐 ปิดปาก','#d0a8ff',16,H+0.6);break;
    case 'terror':ring(x,y,'#b57dff',ev.r,0.5,H);ring(x,y,'#6a2a9a',ev.r*0.6,0.4,H);SHAPES_Q.push({k:'dome',x,y,h:H,col:'#7a3aaa',s0:0.4,s1:ev.r*S3,life:0.45,op:0.25,full:1});burst(x,y,'#b57dff',60,ev.r*2.2,0.8,2.4,{h:H,vh:[0,4],g:0});smoke(x,y,H,16,'#1a0a2a',1.4,9,ev.r*1.6);FX.flashLight(x,y,H+1,'#9a4aff',5,18,0.4);if(near){snd('roar',{x,y,small:1});shake(4);}break;
    case 'blind':burst(x,y,'#2a1a3a',50,200,1,4,{h:0.8,vh:[0,2],g:-0.3,smoke:true,grow:1.2});burst(x,y,'#b57dff',20,160,0.7,1.8,{h:0.8,g:0});ring(x,y,'#7a3aaa',ev.r,0.4,0.2);if(near)snd('push',{x,y,vol:0.4});break;
    case 'mark':ring(x,y,'#ff4060',50,0.5,H);burst(x,y,'#ff4060',16,100,0.7,1.8,{h:H,vh:[0,2],g:0});floatText(x,y,'🎯 ตรามรณะ','#ff7a8a',16,H+0.6);break;
    case 'worldtree':
      ring(x,y,'#6fd57f',ev.r,0.7,0.2);ring(x,y,'#ff9ad5',ev.r*0.6,0.5,0.2);
      for(let i=0;i<14;i++){const a=i/14*Math.PI*2,d=rnd(80,ev.r*0.9);for(let k=0;k<6;k++)PARTS.push({x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,h:0.1+k*0.5,vx:0,vy:0,vh:1.5,life:1.2,max:1.2,col:k%2?'#3f9a45':'#6f4a2a',size:4,g:-0.2,drag:2});}
      burst(x,y,'#9aff9a',80,ev.r*1.6,1,2.6,{h:0.6,vh:[1,6],g:2});burst(x,y,'#ff9ad5',40,ev.r*1.2,1.2,2.4,{h:0.8,vh:[1,5],g:1});
      FX.flashLight(x,y,2,'#7dff9a',8,32,0.6);shake(7);snd('revive',ev);break;
    case 'curse':
      ring(x,y,'#7a3aaa',ev.r,0.7,H);ring(x,y,'#b57dff',ev.r*0.6,0.5,H);
      SHAPES_Q.push({k:'dome',x,y,h:H,col:'#3a1a5a',s0:0.5,s1:ev.r*S3*0.95,life:0.6,op:0.35,full:1});
      burst(x,y,'#2a1a3a',90,ev.r*1.6,1.6,7,{h:H,vh:[0,3],g:-0.4,smoke:true,grow:1.3});burst(x,y,'#b57dff',70,ev.r*2,1,2.4,{h:H,vh:[0,5],g:0});
      FX.flashLight(x,y,H+2,'#8a4aff',8,32,0.6);shake(9);snd('nova',ev);snd('imp',{x,y});break;
    case 'summon':
      ring(x,y,'#9fd0ff',70,0.5,0.2);SHAPES_Q.push({k:'rune',x,y,col:'#9fd0ff',s1:70*S3,life:0.9,op:0.8});
      burst(x,y,'#cfe8ff',30,160,0.7,2.2,{h:0.5,vh:[1,5],g:-0.5});FX.flashLight(x,y,1.2,'#9fd0ff',4,14,0.4);if(near)snd('portal',ev);break;
    case 'unsummon':burst(x,y,'#cfe8ff',20,100,0.6,2,{h:H,vh:[0,3],g:-0.5});break;
    case 'legion':
      ring(x,y,'#9fd0ff',ev.r,0.7,0.2);ring(x,y,'#ffffff',ev.r*0.6,0.5,0.2);
      burst(x,y,'#cfe8ff',80,ev.r*2,1,2.6,{h:H,vh:[1,6],g:-0.5});FX.flashLight(x,y,2,'#9fd0ff',8,30,0.6);shake(6);snd('nova',ev);break;
    case 'wispheal':FX.bolt(x,y,H,ev.x2,ev.y2,ev.h2,0.25,'#7dff9a');burst(ev.x2,ev.y2,'#7dff9a',8,60,0.6,1.6,{h:ev.h2,vh:[0.5,2],g:-0.4});break;
    case 'flare':{const v=VIEW.cur,p=v&&v.P.find(q=>q.id===ev.id);if(p){burst(p.x,p.y,'#ffb066',26,160,0.7,2.2,{h:(p.z||0)+1,vh:[0,3],g:0});ring(p.x,p.y,'#ff8a3a',60,0.4,0.2);}if(ev.id===NET.myId)snd('buff');break;}
    case 'siphon':
      FX.bolt(x,y,H,ev.x2,ev.y2,ev.h2,0.3,ev.m?'#ff4a6a':'#b57dff');
      for(let i=0;i<10;i++){const u=i/10;PARTS.push({x:ev.x2+(x-ev.x2)*u,y:ev.y2+(y-ev.y2)*u,h:ev.h2+(H-ev.h2)*u,vx:rnd(-20,20),vy:rnd(-20,20),vh:rnd(-0.5,0.5),life:0.5,max:0.5,col:ev.m?'#ff4a6a':'#b57dff',size:2.2,g:0});}
      burst(ev.x2,ev.y2,ev.m?'#ff4a6a':'#b57dff',16,160,0.5,2,{h:ev.h2,vh:[0,2],g:0});if(near)snd('imp',{x,y});break;
    case 'thorn':ring(x,y,'#6fd57f',ev.r,0.45,0.2);for(let i=0;i<12;i++){const a=i/12*Math.PI*2;PARTS.push({x:x+Math.cos(a)*30,y:y+Math.sin(a)*30,h:0.5,vx:Math.cos(a)*ev.r*2.4,vy:Math.sin(a)*ev.r*2.4,vh:0.5,life:0.45,max:0.45,col:'#3f9a45',size:3.4,g:0,drag:2});}burst(x,y,'#9aff9a',24,260,0.5,2,{h:H,vh:[0,3],g:2});if(near)snd('splat',ev);break;
    case 'soulburst':ring(x,y,'#ff9ad5',ev.r,0.4,0.3);burst(x,y,'#ffd0ee',30,260,0.6,2.4,{h:H,vh:[0,5],g:2});burst(x,y,'#9fd0ff',20,200,0.5,2,{h:H,vh:[0,3],g:0});FX.flashLight(x,y,H,'#ff9ad5',4,14,0.3);if(near)snd('boom',{x,y,vol:0.5});break;
  }
}
