// Darkness gameplay. Timers use host match time.
const DARKP=PATHS.length;
PATHS.push({id:'darkness',n:'สายความมืด',ic:'🌑',col:'#5e4a74',
  d:'ติดตราเงาแล้วพุ่งเข้าโจมตีด้วยเคียว',
  combo:'ติดตรา → ไล่ตาม → Night Waltz → ฟันเคียว • ฆ่าศัตรูเพื่อเข้า Flow'});
const DARK_V={mark:8,markPrep:.58,waltzForm:.73,flow:6,dashCd:8,shieldTime:3,shieldRadius:40,shieldLock:5,shieldPrep:.45};
const DARK_BA={range:175,powerRange:210,arc:150,near:25,height:1.25};
const DARK_LONG_DASH={travel:2.105,reappear:.045};
const DARK_CHASE_FLOW={wind:.095,hit:.255,exit:.335,end:.72,damage:20,orbStart:.040,orbEnd:.405};
const DARK_MAW={release:.73,walkAgain:1.69,bite:1.8,cameraEnd:2.48};
const DARK_VEIL_PULL_CLEAR=1.8;
const DARK_CHASE_T={launch:.25,arrival:.80,reappear:1.72,wandDown:1.955,land:2.17,end:2.29,hits:[.89,1.245,2.127],orbStart:.258,orbEnd:1.704};
const DARK_WALTZ_ORB={start:.307,returnTime:.075};
const darkFlow=p=>p.dark?.flow>G.time;
function darkOrbImmune(p){
  const d=p.dark;
  if(p.pathIdx!==DARKP||!d)return false;
  if(d.longUntil>0&&G.time<d.longUntil+DARK_LONG_DASH.reappear)return true;
  if(d.waltzUntil>0&&G.time<d.waltzUntil+DARK_WALTZ_ORB.returnTime&&
    (!d.waltz||G.time-d.waltz.at>=DARK_WALTZ_ORB.start))return true;
  return !!d.chaseOrb&&G.time>=d.chaseOrb[0]&&G.time<d.chaseOrb[1];
}
const darkAlive=t=>!t.dead&&t.alive!==false&&!t.downed;
function darkReset(p){p.dark=null;p.darkReveal=0;p.darkDrain=0;}
function darkState(p){return p.dark??={marks:new Map(),charges:[],actions:[],waves:[],shield:DARK_V.shieldTime};}
function darkEvent(p,z,extra={}){
  emit({k:'efx',z,id:p.id,x:p.x,y:p.y,h:p.z||0,a:p.ang,...extra});
}
function darkAim(p){
  const a=p.ang||0,i=p.inp;
  const cursor=i&&Number.isFinite(i.ah)&&Number.isFinite(i.ax)&&Number.isFinite(i.ay);
  const distance=cursor?Math.hypot(i.ax-p.x,i.ay-p.y)*S3:0;
  const b=clamp(distance>.05?Math.atan2(i.ah-p.z-1.1,distance):(i?.ap||0),-1.55,1.55);
  return {a,b,x:Math.cos(a)*Math.cos(b),y:Math.sin(a)*Math.cos(b),z:Math.sin(b)};
}
function darkTarget(p,t,aim){
  const x=t.x-p.x,y=t.y-p.y,z=(cH(t)-p.z-1.1)*20;
  return {x,y,z,dist:Math.hypot(x,y,z),along:x*aim.x+y*aim.y+z*aim.z};
}
function darkCone(p,aim,range,angle){
  const cos=Math.cos(angle*Math.PI/360);
  return foesOf(p.team).filter(t=>{
    const d=darkTarget(p,t,aim);
    return d.dist<=range+(t.r||PR)&&d.along>=d.dist*cos;
  });
}
function darkBAFloor(x,y,fromHeight){
  const base=GY(x,y);
  return base+groundH(x,y,Math.max(0,fromHeight-base));
}
function darkBATargets(p,origin,aim,range){
  const c=Math.cos(aim.a),s=Math.sin(aim.a),pitchCos=Math.cos(aim.b),slope=Math.tan(aim.b);
  const arc=DARK_BA.arc*Math.PI/360,edgeCos=Math.cos(arc),edgeSin=Math.sin(arc);
  const center=origin.h+DARK_BA.height,nearHeight=GY(p.x,p.y)+p.z+DARK_BA.height;
  return foesOf(p.team).filter(t=>{
    const base=GY(t.x,t.y)+(t.z??t.h??0),head=GY(t.x,t.y)+cH(t);
    const low=Math.min(base+.12,head),high=Math.max(low+.35,head+.52);
    if(Math.hypot(t.x-p.x,t.y-p.y)<=DARK_BA.near&&nearHeight>=low-.68&&nearHeight<=high+.68)return true;
    const x=t.x-origin.x,y=t.y-origin.y;
    const forward=x*c+y*s,side=Math.abs(y*c-x*s),along=forward/pitchCos;
    const radius=t.r||PR;
    if(along<0||Math.hypot(along,side)>range+radius||side*edgeCos-along*edgeSin>Math.min(8,radius*.5))return false;
    const bladeY=center+forward*S3*slope;
    const cutY=aim.b<-.07?Math.max(bladeY,darkBAFloor(t.x,t.y,origin.h)+.08):bladeY;
    return cutY>=low-.68&&cutY<=high+.68;
  });
}
function darkMoveHeading(inp,fallback){
  return inp.mx||inp.my?Math.atan2(inp.my,inp.mx):fallback;
}
function darkClearCooldown(p,spell){
  const index=p.kitIds.indexOf(spell);
  if(index>=0)p.cd[SLOTK[index]]=0;
}
function darkMark(p,t,duration,multiple,wave){
  const d=darkState(p);
  if(!multiple)d.marks.clear();
  d.marks.set(t,G.time+duration);
  darkClearCooldown(p,'darkchase');
  darkEvent(p,'darkmarkhit',{x:t.x,y:t.y,h:cH(t),target:t.id,wave:wave?.id,distance:wave?.travel});
}
function darkReveal(p){p.darkReveal=G.time+.65;}
function darkQueue(p,delay,run){darkState(p).actions.push({at:G.time+delay,run});}
function darkGainFlow(p){
  const d=darkState(p);
  if(d.flow===G.time+DARK_V.flow)return;
  d.flow=G.time+DARK_V.flow;
  darkEvent(p,'darkflow');
}
function darkKill(p){
  if(p?.pathIdx===DARKP&&darkAlive(p))darkGainFlow(p);
}
function darkTick(p,dt){
  const d=darkState(p);
  if(d.plainDash&&p.dash<=0){
    const plain=d.plainDash;
    plain.landing={x:p.x,y:p.y,z:p.z,team:p.team,id:p.id};
    d.plainDash=null;
    darkEvent(p,'darkchaseplainland',{a:plain.a});
  }
  for(const [target,end] of d.marks){
    if(!darkAlive(target)){
      if(end>=G.time){
        if(target.lastHit!==p.id)darkGainFlow(p);
        healT(p,target.lastHit===p.id?50:25);
        darkClearCooldown(p,'darkmark');
        darkClearCooldown(p,'darkchase');
        const slot=SLOTK[p.kitIds.indexOf('darkwaltz')];
        if(slot)p.cd[slot]=Math.max(0,p.cd[slot]-.3*p.cdMax[slot]);
        d.charges.shift();
      }
      d.marks.delete(target);
    }else if(end<=G.time)d.marks.delete(target);
  }
  while(d.charges.length&&d.charges[0]<=G.time)d.charges.shift();
  for(const action of d.actions.filter(a=>a.at<=G.time))action.run();
  d.actions=d.actions.filter(a=>a.at>G.time);
  darkWaveTick(p,d,dt);
  if(d.longUntil>G.time){
    const current=Math.atan2(p.dashY,p.dashX);
    const heading=darkMoveHeading(p.inp||{},current);
    const turn=lerpAng(current,heading,1-Math.exp(-24*dt));
    p.dashX=Math.cos(turn);p.dashY=Math.sin(turn);
  }
  if(d.veil&&d.veil.end<=G.time)d.veil=null;
}
function darkShieldTick(p,want,dt){
  const d=darkState(p);
  const cap=DARK_V.shieldTime*(p.darkDrain>G.time?1-DARK_WARD.v.drain:1);
  if(d.shieldReady&&G.time>=d.shieldReady){d.shield=cap;d.shieldReady=0;d.shieldStart=null;}
  d.shield=Math.min(d.shield,cap);
  if(want&&!d.shieldReady&&d.shield>0){
    if(d.shieldStart==null){d.shieldStart=G.time;darkEvent(p,'darkshield');}
    p.shieldOn=G.time-d.shieldStart>=DARK_V.shieldPrep;
    if(p.shieldOn){
      d.shield=Math.max(0,d.shield-dt);
      d.shieldRest=G.time+1;
      if(!d.shield){p.shieldOn=false;d.shieldReady=G.time+DARK_V.shieldLock;}
    }
  }else{p.shieldOn=false;d.shieldStart=null;}
  if(!want&&!d.shieldReady&&G.time>=(d.shieldRest||0))d.shield=Math.min(cap,d.shield+.35*dt);
}
// Test intersection with the spinning disc in front of the player, in world units.
function darkShieldCrossAt(p,x,y,h,ex,ey,eh){
  if(!p.shieldOn||p.pathIdx!==DARKP)return null;
  const aim=darkAim(p),ox=p.x+aim.x*32,oy=p.y+aim.y*32,oz=(p.z+1.4)*20+aim.z*32;
  const ax=x-ox,ay=y-oy,az=h*20-oz,bx=ex-ox,by=ey-oy,bz=eh*20-oz;
  const start=ax*aim.x+ay*aim.y+az*aim.z,end=bx*aim.x+by*aim.y+bz*aim.z;
  if(start<0||end>0||start===end)return null;
  const u=start/(start-end);
  return Math.hypot(lerp(ax,bx,u),lerp(ay,by,u),lerp(az,bz,u))<=DARK_V.shieldRadius?u:null;
}
function darkShieldCross(...args){return darkShieldCrossAt(...args)!==null;}
function darkBeamStop(team,x,y,h,ex,ey,eh){
  let stop=1;
  for(const p of plist()){
    if(p.team===team||!darkAlive(p))continue;
    const t=darkShieldCrossAt(p,x,y,h,ex,ey,eh);
    if(t!==null&&t<stop)stop=t;
  }
  return stop;
}
function darkDash(p,inp,pr,dt,setCd){
  const d=darkState(p);
  if(p.dash>0||d.chaseUntil>G.time||d.waltzUntil>G.time)return true;
  if(pr.sp&&d.charges.length<2&&!p.shieldOn){
    d.dashStart=G.time;
    if(d.charges.length===0&&inp.dh)darkEvent(p,'darkdashcharge');
  }
  if(d.dashStart==null)return false;
  const held=inp.dh;
  const long=held&&d.charges.length===0&&G.time-d.dashStart>=.5;
  if(held&&!long)return true;
  d.dashStart=null;
  const cost=long?2:1,duration=long?DARK_LONG_DASH.travel:.14,heading=darkMoveHeading(inp,p.ang||0);
  for(let i=0;i<cost;i++)d.charges.push(Math.max(G.time,d.charges.at(-1)||0)+DARK_V.dashCd);
  setCd('dodge',d.charges.length===2?d.charges[0]-G.time:0);
  p.dash=duration;p.dashSp=(long?500:120)/duration;
  p.dashX=Math.cos(heading);p.dashY=Math.sin(heading);
  setCd('basic',0);
  if(long)d.longUntil=G.time+duration;
  else d.empower=G.time+3;
  darkEvent(p,long?'darkdashlong':'darkdashquick',{duration,a:heading});
  return true;
}
function darkBasic(p,inp,dt,setCd){
  if((!inp.fire&&!(p.dark?.chaseBAUntil>G.time))||p.cd.basic>0||p.sil>0||p.dark?.shieldStart!=null||p.dark?.veilPullUntil>G.time)return;
  const d=darkState(p),empowered=d.empower>G.time;
  d.chaseOrb=null;
  d.chaseBAUntil=0;
  const side=d.baSide??-1;
  d.baSide=-side;
  d.empower=0;
  darkReveal(p);
  const aim=darkAim(p);
  aim.b=clamp(aim.b,-.95,.95);
  darkEvent(p,'darkba',{empowered,pitch:aim.b,side});
  setCd('basic',(darkFlow(p)?.8:1.2)*p.buffs.cdr);
  const {wind,sweep,rate}=ST_DARK_LIVE_BA;
  const origin={x:p.x,y:p.y,h:GY(p.x,p.y)+p.z};
  darkQueue(p,wind/rate,()=>{
    Object.assign(origin,{x:p.x,y:p.y,h:GY(p.x,p.y)+p.z});
    darkEvent(p,'darkbasweep',{a:aim.a,pitch:aim.b});
  });
  darkQueue(p,(wind+sweep*.5**(1/2.2))/rate,()=>{
    for(const t of darkBATargets(p,origin,aim,empowered?DARK_BA.powerRange:DARK_BA.range)){
      const amount=empowered?18:12;
      aoeHit(p,t,amount,hit=>darkEvent(p,'darkbahit',{x:hit.x,y:hit.y,h:cH(hit),target:hit.id,empowered,side,
        a:aim.a,followUp:darkAlive(hit)&&d.marks.get(hit)>G.time||undefined}),false,{weapon:'scythe',angle:aim.a+side*.78});
      if(d.marks.get(t)>G.time&&darkAlive(t))darkQueue(p,.15,()=>{
        if(darkAlive(t))aoeHit(p,t,empowered?18:13,hit=>darkEvent(p,'darkbahit',{x:hit.x,y:hit.y,h:cH(hit),target:hit.id,ghost:true,side:-side}),false,{weapon:'scythe',angle:aim.a-side*.78});
      });
    }
  });
}
const DARK_MARK=defSpell(DARKP,{id:'darkmark',n:'Death Sentence',ic:'✖',role:'builder',cd:10,
  v:{range:700,speed:1000,height:150},d:'ปล่อยคลื่นเคียวเพื่อติดตราเงา',
  cast(p,S){
    const d=darkState(p),flow=darkFlow(p);
    darkReveal(p);
    darkEvent(p,'darkmarkwind',{flow});
    darkQueue(p,flow?0:DARK_V.markPrep,()=>{
      const aim=darkAim(p);
      const cast=G.time;
      for(const [index,offset] of (flow?[-.26,0,.26]:[0]).entries()){
        const a=aim.a+offset,c=Math.hypot(aim.x,aim.y),dir={x:Math.cos(a)*c,y:Math.sin(a)*c,z:aim.z};
        const id=p.id+':'+cast+':'+index;
        darkEvent(p,'darkmarkcast',{a,flow,pitch:aim.b,wave:id,main:!offset,range:S.v.range,speed:S.v.speed});
        d.waves.push({id,x:p.x,y:p.y,z:p.z,dir,flow,travel:0,spec:S.v});
      }
    });
  }});
function darkWaveTick(p,d,dt){
  if(!d.waves.length)return;
  const targets=foesOf(p.team);
  for(const wave of d.waves){
    const {travel,spec,dir}=wave;
    wave.travel=Math.min(spec.range,travel+spec.speed*dt);
    let best=null,nearest=Infinity;
    for(const target of targets){
      if(target.inv>0)continue;
      const hit=darkTarget(wave,target,dir),radius=target.r||PR;
      if(hit.along+radius<travel||hit.along-radius>wave.travel||hit.along<0||hit.along>=nearest)continue;
      const offX=hit.x-dir.x*hit.along,offY=hit.y-dir.y*hit.along,offZ=hit.z-dir.z*hit.along;
      if(Math.hypot(offX,offY)>radius+23||Math.abs(offZ)>spec.height*.5)continue;
      if(darkShieldCross(target,wave.x,wave.y,wave.z+1.1,target.x,target.y,cH(target))){
        wave.travel=spec.range;best=null;break;
      }
      best=target;nearest=hit.along;
    }
    if(best){wave.travel=nearest;darkMark(p,best,DARK_V.mark,wave.flow,wave);wave.travel=spec.range;}
  }
  d.waves=d.waves.filter(wave=>wave.travel<wave.spec.range);
}
const DARK_CHASE=defSpell(DARKP,{id:'darkchase',n:'Nightfall',ic:'➶',role:'mobility',cd:7,
  v:{range:600,dash:250,lift:.6,dmg:10},d:'พุ่งงัด หรือไล่ตามเป้ามีตราแล้วฟันสามครั้ง',
  cast(p,S){
    const d=darkState(p),aim=darkAim(p);
    const target=darkCone(p,aim,S.v.range,46).find(t=>d.marks.has(t));
    d.chaseBAUntil=0;
    d.chaseOrb=null;
    darkReveal(p);
    if(!target){
      p.dash=.2;p.dashSp=S.v.dash/.2;p.dashX=Math.cos(aim.a);p.dashY=Math.sin(aim.a);
      const plain={a:aim.a};
      d.plainDash=plain;
      darkEvent(p,'darkchaseplain',{range:S.v.dash,duration:.2});
      darkQueue(p,.25,()=>{
        const origin=plain.landing??p;
        for(const t of darkCone(origin,aim,115,100)){
          if(natureTrace(origin,t,origin.z+1.1,cH(t),p.team,true))continue;
          aoeHit(origin,t,S.v.dmg,hit=>{if(!hit.isE&&!hit.isM){hit.fly=false;hit.vz=22*S.v.lift/2;hit.stun=Math.max(hit.stun,S.v.lift);}},false,{weapon:'scythe',angle:aim.a,chase:1});
        }
      });
      return;
    }
    const start={x:p.x,y:p.y,z:p.z},dx=target.x-start.x,dy=target.y-start.y;
    if(darkFlow(p)){
      const F=DARK_CHASE_FLOW,a=Math.atan2(dy,dx);
      d.chase={start,target,a,at:G.time,flow:true};
      d.chaseOrb=[G.time+F.orbStart,G.time+F.orbEnd];
      d.chaseUntil=G.time+F.end;
      darkEvent(p,'darkchaseflow',{a,x2:target.x,y2:target.y,h2:cH(target),target:target.id,duration:F.hit-F.wind});
      darkQueue(p,F.hit,()=>{
        const chase=d.chase;
        if(chase?.target!==target||!darkAlive(target)||Math.hypot(p.x-target.x,p.y-target.y)>300)return;
        chase.contact={x:target.x,y:target.y,h:cH(target)};
        aoeHit(p,target,F.damage,hit=>darkEvent(p,'darkchaseflowhit',{x:hit.x,y:hit.y,h:cH(hit),target:hit.id,a}),false,{weapon:'scythe',angle:a,chase:2});
      });
      return;
    }
    const a=Math.atan2(dy,dx),distance=Math.max(1,Math.hypot(dx,dy)*S3);
    const timings=DARK_CHASE_T,returnPoint=new THREE.Vector3(.55,3.06,distance+2.25);
    const route=stDarkChaseRoute(returnPoint,distance,timings.launch,timings.arrival,timings.reappear);
    d.chase={start,target,at:G.time,a,distance,returnPoint,route,point:new THREE.Vector3(),tx:target.x,ty:target.y};
    d.chaseOrb=[G.time+timings.orbStart,G.time+timings.orbEnd];
    d.chaseUntil=G.time+timings.end;
    darkEvent(p,'darkchasemarked',{a,x2:target.x,y2:target.y,h2:cH(target),target:target.id,distance});
    for(const [index,delay] of timings.hits.entries())darkQueue(p,delay,()=>{
      if(d.chase?.target!==target||!darkAlive(target)||Math.hypot(p.x-target.x,p.y-target.y)>300)return;
      const last=index===2;
      darkEvent(p,'darkchasehit',{x:target.x,y:target.y,h:cH(target),target:target.id,last});
      aoeHit(p,target,last?15:5,t=>{if(last&&!t.isE&&!t.isM){t.fly=false;t.vz=Math.min(t.vz,-9);}},!last,{weapon:'scythe',angle:a+(last?0:index===0?.84:-.84),chase:index+3});
    });
  }});
function darkMoveWaltz(p){
  const w=p.dark?.waltz;
  if(!w)return false;
  const t=G.time-w.at,leg=w.legs[w.index];
  if(leg){
    const target=leg.target;
    const inside=darkAlive(target)&&Math.hypot(target.x-w.x,target.y-w.y)<=w.radius;
    if(inside){leg.x=target.x;leg.y=target.y;leg.z=target.z??target.h??0;}
    const u=clamp((t-leg.start)/(leg.hit-leg.start),0,1),k=1-(1-u)**1.85;
    p.x=lerp(w.from.x,leg.x,k);p.y=lerp(w.from.y,leg.y,k);
    p.z=lerp(w.from.z,leg.z,k);
    if(u>=1){
      darkReveal(p);
      if(inside)aoeHit(p,target,leg.marked?w.marked:w.damage,hit=>darkEvent(p,'darkwaltzhit',{
        x:hit.x,y:hit.y,h:cH(hit),floor:groundH(hit.x,hit.y,hit.z??hit.h),target:hit.id,marked:leg.marked,index:w.index
      }));
      w.index++;
      w.from={x:p.x,y:p.y,z:p.z};
    }
  }else if(t>=w.land){
    p.dark.waltz=null;collideWorld(p,PR,p.z);return false;
  }
  p.vx=p.vy=p.vz=p.mvx=p.mvy=p.wSpd=0;
  return true;
}
const DARK_WALTZ=defSpell(DARKP,{id:'darkwaltz',n:'Night Waltz',ic:'🌑',role:'damage',cd:12,
  v:{r:250,dmg:25,marked:50},d:'แปลงเป็นลูกเงา ชนเป้ามีตราก่อน แล้วชิ่งไปหาเป้าในวง',
  cast(p,S){
    const d=darkState(p),{x,y,z}=p,V=S.v;
    const targets=foesIn(p.team,x,y,V.r,z+8).filter(t=>darkAlive(t)&&!(t.inv>0))
      .map(target=>({target,point:[target.x,target.y],marked:d.marks.has(target)}));
    const chain=stDarkChainTargets([x,y],targets,V.r);
    let from=[x,y],start=ST_DARKNESS_WALTZ_LAUNCH;
    const legs=chain.map(({target,point,marked},index)=>{
      const distance=Math.hypot(point[0]-from[0],point[1]-from[1])*S3;
      const hit=start+(index===0?.088:.135)+distance*.009;
      const leg={target,x:target.x,y:target.y,z:target.z??target.h??0,marked,start,hit};
      start=hit+(index===0&&marked?ST_DARKNESS_MARK_HOLD:.015);
      from=point;
      return leg;
    });
    const land=legs.length?legs.at(-1).hit+.20:DARK_V.waltzForm;
    darkReveal(p);
    d.waltz={x,y,from:{x,y,z},radius:V.r,at:G.time,land,legs,index:0,damage:V.dmg,marked:V.marked};
    d.waltzUntil=G.time+land;
    darkEvent(p,'darkwaltzcast',{radius:V.r,land,first:legs[0]?.hit??land,marked:!!legs[0]?.marked});
  }});
const DARK_WARD=defSpell(DARKP,{id:'darkward',n:'Ward Drain',ic:'◉',role:'control',cd:12,
  v:{range:400,r:150,duration:4,drain:.6},d:'ยิงเงาลดพลังโล่ในวง',
  cast(p,S){
    const hit=aimRay3(p,p.z+1.4,S.v.range);
    const x=hit?.x??p.x+Math.cos(p.ang)*S.v.range,y=hit?.y??p.y+Math.sin(p.ang)*S.v.range;
    darkReveal(p);darkEvent(p,'darkward',{x2:x,y2:y,h2:groundH(x,y,p.z),radius:S.v.r,duration:S.v.duration});
    darkQueue(p,.42,()=>{
      for(const t of foesOf(p.team))if(!t.isE&&!t.isM&&Math.hypot(t.x-x,t.y-y)<=S.v.r){
        t.darkDrain=G.time+S.v.duration;
        t.shieldE=Math.min(t.shieldE,100*(1-S.v.drain));
        if(t.dark)t.dark.shield=Math.min(t.dark.shield,DARK_V.shieldTime*(1-S.v.drain));
        darkEvent(p,'darkwardhit',{x:t.x,y:t.y,h:cH(t),target:t.id,duration:S.v.duration});
      }
    });
  }});
const DARK_VEIL=defSpell(DARKP,{id:'darkveil',n:'Umbral Veil',ic:'◌',role:'support',cd:20,
  v:{r:105,duration:4},d:'สร้างวงเงาที่ซ่อนเพื่อนร่วมทีม',
  cast(p,S){
    const {x,y,z}=p;
    darkState(p).veilPullUntil=G.time+DARK_VEIL_PULL_CLEAR;
    darkEvent(p,'darkveil',{radius:S.v.r,duration:S.v.duration});
    darkQueue(p,.91,()=>{darkState(p).veil={x,y,z,r:S.v.r,end:G.time+S.v.duration};});
  }});
const DARK_ULT=defSpell(DARKP,{id:'darkrift',n:'Maw of the Abyss',ic:'🌘',role:'ult',ult:true,cd:0,
  v:{range:800,angle:80,dmg:30,mark:12},d:'เปิดประตูให้สัตว์เงางับ ติดตรา และเข้า Flow',
  cast(p,S){
    const d=darkState(p);
    if(d.ultUntil>G.time||p.shieldOn||p.dash>0)return false;
    d.ultReleaseAt=G.time+DARK_MAW.release;
    d.ultUntil=G.time+DARK_MAW.walkAgain;d.ultBiteUntil=G.time+DARK_MAW.bite;d.ultCamUntil=G.time+DARK_MAW.cameraEnd;
    darkReveal(p);darkEvent(p,'darkrift');
    darkQueue(p,DARK_MAW.release,()=>{
      const aim={x:Math.cos(p.ang),y:Math.sin(p.ang),z:0},origin={x:p.x,y:p.y,z:p.z,team:p.team};
      darkEvent(p,'darkriftrelease');
      darkGainFlow(p);
      darkQueue(p,Math.max(0,d.ultBiteUntil-G.time),()=>darkUltBite(p,S,aim,origin));
    });
  }});
function darkUltBite(p,S,aim,origin){
  for(const t of darkCone(origin,aim,S.v.range,S.v.angle)){
    const alive=darkAlive(t);
    if(alive&&!(t.inv>0)&&!shieldFaces(t,origin.x,origin.y,origin.z+1.2))darkMark(p,t,S.v.mark,true);
    aoeHit({...origin,id:p.id},t,S.v.dmg);
  }
}
PATHS[DARKP].def=[DARK_MARK.id,DARK_CHASE.id,DARK_WALTZ.id,DARK_WARD.id];
PBASIC[DARKP]={id:'darkscythe',tick:darkBasic,dash:darkDash};

function darkMoveChase(p){
  const chase=p.dark?.chase;
  if(!chase)return false;
  const {start,at,a,returnPoint,route,point,target}=chase;
  const t=G.time-at,F=chase.flow?DARK_CHASE_FLOW:DARK_CHASE_T;
  if(!chase.contact&&(!darkAlive(target)||(t>=(chase.flow?F.hit:F.arrival)&&Math.hypot(p.x-target.x,p.y-target.y)>300))){
    darkEvent(p,'darkchasecancel');
    p.dark.chase=null;p.dark.chaseOrb=null;p.dark.chaseUntil=G.time;p.dark.chaseBAUntil=0;return false;
  }
  const usableAt=chase.flow?F.exit:F.end;
  if(p.inp?.fire&&t>=usableAt-.18)p.dark.chaseBAUntil=at+usableAt+.16;
  if(chase.flow){
    const contact=chase.contact??{x:target.x,y:target.y,h:cH(target)};
    const s=clamp((t-F.wind)/(F.hit-F.wind),0,1);
    const u=s*s*(3-2*s),exit=clamp((t-F.hit)/(F.exit-F.hit),0,1);
    p.x=lerp(start.x,contact.x,u)+Math.cos(a)*48*exit;
    p.y=lerp(start.y,contact.y,u)+Math.sin(a)*48*exit;
    p.z=lerp(start.z,Math.max(groundH(p.x,p.y,p.z),contact.h-1.1),u);
    if(exit>=1){
      p.dark.chase=null;p.dark.chaseUntil=G.time;
      p.dark.chaseAim={target,at,end:G.time+.23};
      p.ang=Math.atan2(target.y-p.y,target.x-p.x);
      collideWorld(p,PR,p.z);return false;
    }
    p.vx=p.vy=p.vz=p.mvx=p.mvy=p.wSpd=0;
    return true;
  }
  if(t>=F.end){p.dark.chase=null;collideWorld(p,PR,p.z);return false;}
  route.pointAt(route.distanceAt(t),point);
  const c=Math.cos(a),s=Math.sin(a);
  const follow=clamp(t/F.arrival,0,1);
  p.x=start.x+(point.z*c+point.x*s)/S3+(target.x-chase.tx)*follow;
  p.y=start.y+(point.z*s-point.x*c)/S3+(target.y-chase.ty)*follow;
  const floor=groundH(p.x,p.y,p.z);
  const descent=clamp((t-F.wandDown)/(F.land-F.wandDown),0,1);
  p.z=t>=F.reappear?floor+returnPoint.y*(1-descent**1.65):Math.max(floor,start.z+point.y);
  p.ang=t>=F.reappear?Math.atan2(chase.target.y-p.y,chase.target.x-p.x):a;
  p.vx=p.vy=p.vz=p.mvx=p.mvy=p.wSpd=0;
  return true;
}
function darkSnap(p){
  const own=p.dark;
  let hidden=false,marked=false;
  for(const ally of plist()){
    if(!ally.dark||!darkAlive(ally))continue;
    const veil=ally.dark.veil;
    if(ally.team===p.team&&veil&&veil.end>G.time&&Math.abs(p.z-veil.z)<3&&Math.hypot(p.x-veil.x,p.y-veil.y)<=veil.r)hidden=true;
    if(ally.dark.marks.get(p)>G.time)marked=true;
  }
  if(!own&&!hidden&&!marked)return undefined;
  return [hidden?(p.darkReveal>G.time?2:1):0,marked?1:0,Math.max(0,(own?.flow||0)-G.time),
    own?.shieldStart!=null?clamp((G.time-own.shieldStart)/DARK_V.shieldPrep,0,1):0,
    own?.shield??0,own?.longUntil>G.time?1:own?.chase?2:own?.waltzUntil>G.time?3:0,own?.shieldStart!=null?darkAim(p).b:0,own?2-own.charges.length:0,own?.empower>G.time?1:0,
    own?.charges.length?clamp(1-(own.charges[0]-G.time)/DARK_V.dashCd,0,1):0,
    own?.ultCamUntil>G.time?own.ultCamUntil-G.time:0,
    own?.chase?[own.chase.target.x,own.chase.target.y,G.time-own.chase.at,own.chase.flow?1:0]:
      own?.chaseAim?.end>G.time?[own.chaseAim.target.x,own.chaseAim.target.y,G.time-own.chaseAim.at,1]:null,
    own?.waltz?G.time-own.waltz.at:null];
}
function darkMarked(t){
  for(const p of plist())if(darkAlive(p)&&p.dark?.marks.get(t)>G.time)return true;
  return undefined;
}
