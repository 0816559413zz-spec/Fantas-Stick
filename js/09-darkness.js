// Darkness gameplay. Timers use host match time.
const DARKP=PATHS.length;
PATHS.push({id:'darkness',n:'สายความมืด',ic:'🌑',col:'#5e4a74',
  d:'ติดตราเงาแล้วพุ่งเข้าโจมตีด้วยเคียว',
  combo:'ติดตรา → ไล่ตาม → Night Waltz → ฟันเคียว • เป้ามีตราตายจะเข้า Flow'});
const DARK_V={mark:8,flow:6,dashCd:8,shieldTime:3,shieldLock:5};
const darkFlow=p=>p.dark?.flow>G.time;
const darkAlive=t=>!t.dead&&t.alive!==false&&!t.downed;
function darkReset(p){p.dark=null;p.darkReveal=0;p.darkDrain=0;}
function darkState(p){return p.dark??={marks:new Map(),charges:[],actions:[],waves:[],shield:DARK_V.shieldTime};}
function darkEvent(p,z,extra={}){
  emit({k:'efx',z,id:p.id,x:p.x,y:p.y,h:p.z||0,a:p.ang,...extra});
}
function darkAim(p){
  const a=p.ang||0,b=clamp(p.inp?.ap||0,-1.55,1.55);
  return {a,x:Math.cos(a)*Math.cos(b),y:Math.sin(a)*Math.cos(b),z:Math.sin(b)};
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
function darkClearCooldown(p,spell){
  const index=p.kitIds.indexOf(spell);
  if(index>=0)p.cd[SLOTK[index]]=0;
}
function darkMark(p,t,duration,multiple){
  const d=darkState(p);
  if(!multiple)d.marks.clear();
  d.marks.set(t,G.time+duration);
  darkClearCooldown(p,'darkchase');
  darkEvent(p,'darkmarkhit',{x:t.x,y:t.y,h:cH(t),target:t.id});
}
function darkReveal(p){p.darkReveal=G.time+.65;}
function darkQueue(p,delay,run){darkState(p).actions.push({at:G.time+delay,run});}
function darkGainFlow(p){
  const d=darkState(p);
  d.flow=G.time+DARK_V.flow;
  darkEvent(p,'darkflow');
}
function darkTick(p,dt){
  const d=darkState(p);
  for(const [target,end] of d.marks){
    if(!darkAlive(target)){
      if(end>=G.time){
        darkGainFlow(p);
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
    const aim=darkAim(p);
    const inp=p.inp||{},x=inp.mx||0,y=inp.my||0;
    const heading=x||y?Math.atan2(y,x):aim.a;
    p.dashX=Math.cos(heading);p.dashY=Math.sin(heading);
  }
  if(d.veil&&d.veil.end<=G.time)d.veil=null;
}
function darkShieldTick(p,want,dt){
  const d=darkState(p);
  if(d.shieldReady&&G.time>=d.shieldReady){d.shield=DARK_V.shieldTime;d.shieldReady=0;d.shieldStart=null;}
  if(want&&!d.shieldReady&&d.shield>0){
    if(d.shieldStart==null){d.shieldStart=G.time;darkEvent(p,'darkshield');}
    const hover=groundH(p.x,p.y,p.z)+.5;
    p.z=lerp(p.z,hover,Math.min(1,dt*8));
    p.vz=0;
    p.shieldOn=G.time-d.shieldStart>=.45;
    if(p.shieldOn){
      d.shield=Math.max(0,d.shield-dt);
      d.shieldRest=G.time+1;
      if(!d.shield){p.shieldOn=false;d.shieldReady=G.time+DARK_V.shieldLock;}
    }
  }else{p.shieldOn=false;d.shieldStart=null;}
  if(!want&&!d.shieldReady&&G.time>=(d.shieldRest||0))d.shield=Math.min(3,d.shield+.35*dt);
}
// Test intersection with the spinning disc in front of the player, in world units.
function darkShieldCrossAt(p,x,y,h,ex,ey,eh){
  if(!p.shieldOn||p.pathIdx!==DARKP)return null;
  const aim=darkAim(p),ox=p.x+aim.x*32,oy=p.y+aim.y*32,oz=(p.z+1.4)*20+aim.z*32;
  const ax=x-ox,ay=y-oy,az=h*20-oz,bx=ex-ox,by=ey-oy,bz=eh*20-oz;
  const start=ax*aim.x+ay*aim.y+az*aim.z,end=bx*aim.x+by*aim.y+bz*aim.z;
  if(start<0||end>0||start===end)return null;
  const u=start/(start-end);
  return Math.hypot(lerp(ax,bx,u),lerp(ay,by,u),lerp(az,bz,u))<=70?u:null;
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
  if(p.dash>0||d.chaseUntil>G.time)return true;
  if(pr.sp&&d.charges.length<2&&!p.shieldOn)d.dashStart=G.time;
  if(d.dashStart==null)return false;
  const held=inp.dh;
  const long=held&&d.charges.length===0&&G.time-d.dashStart>=.5;
  if(held&&!long)return true;
  d.dashStart=null;
  const cost=long?2:1, duration=long?2:.14,aim=darkAim(p);
  for(let i=0;i<cost;i++)d.charges.push(Math.max(G.time,d.charges.at(-1)||0)+DARK_V.dashCd);
  setCd('dodge',d.charges.length===2?d.charges[0]-G.time:0);
  p.dash=duration;p.dashSp=(long?500:120)/duration;
  p.dashX=Math.cos(aim.a);p.dashY=Math.sin(aim.a);
  if(long){d.longUntil=G.time+duration;p.inv=Math.max(p.inv,.45);}
  else d.empower=G.time+3;
  darkEvent(p,long?'darkdashlong':'darkdashquick');
  return true;
}
function darkBasic(p,inp,dt,setCd){
  if(!inp.fire||p.cd.basic>0||p.sil>0||p.dark?.shieldStart!=null)return;
  const d=darkState(p),empowered=d.empower>G.time;
  d.empower=0;
  darkReveal(p);
  darkEvent(p,'darkba',{empowered});
  setCd('basic',(darkFlow(p)?.8:1.2)*p.buffs.cdr);
  darkQueue(p,.2,()=>{
    for(const t of darkCone(p,darkAim(p),empowered?260:220,empowered?150:120)){
      const amount=empowered?18:12;
      aoeHit(p,t,amount);
      if(d.marks.has(t)&&darkAlive(t))darkQueue(p,.15,()=>{
        if(darkAlive(t))aoeHit(p,t,empowered?18:13);
      });
    }
  });
}
const DARK_MARK=defSpell(DARKP,{id:'darkmark',n:'ท่าติดตรา',ic:'✖',role:'builder',cd:10,
  v:{range:700,speed:1000,height:150},d:'ปล่อยคลื่นเคียวเพื่อติดตราเงา',
  cast(p,S){
    const d=darkState(p),flow=darkFlow(p);
    darkReveal(p);
    darkEvent(p,'darkmarkwind',{flow});
    darkQueue(p,flow?0:.45,()=>{
      const aim=darkAim(p);
      darkEvent(p,'darkmarkcast',{flow,pitch:p.inp?.ap||0});
      for(const offset of flow?[-.26,0,.26]:[0]){
        const a=aim.a+offset,c=Math.hypot(aim.x,aim.y),dir={x:Math.cos(a)*c,y:Math.sin(a)*c,z:aim.z};
        d.waves.push({x:p.x,y:p.y,z:p.z,dir,flow,travel:0,spec:S.v});
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
    if(best){darkMark(p,best,DARK_V.mark,wave.flow);wave.travel=spec.range;}
  }
  d.waves=d.waves.filter(wave=>wave.travel<wave.spec.range);
}
const DARK_CHASE=defSpell(DARKP,{id:'darkchase',n:'ท่าไล่ตาม',ic:'➶',role:'mobility',cd:7,
  v:{range:600,dash:250,lift:.6,dmg:10},d:'พุ่งงัด หรือไล่ตามเป้ามีตราแล้วฟันสามครั้ง',
  cast(p,S){
    const d=darkState(p),aim=darkAim(p);
    const target=darkCone(p,aim,S.v.range,46).find(t=>d.marks.has(t));
    darkReveal(p);
    if(!target){
      p.dash=.2;p.dashSp=S.v.dash/.2;p.dashX=Math.cos(aim.a);p.dashY=Math.sin(aim.a);
      darkEvent(p,'darkchaseplain');
      const caught=new Set();
      for(const delay of [.05,.1,.15,.2])darkQueue(p,delay,()=>{
        for(const t of darkCone(p,aim,115,100)){
          if(caught.has(t))continue;
          caught.add(t);
          aoeHit(p,t,S.v.dmg,hit=>{if(!hit.isE&&!hit.isM){hit.fly=false;hit.vz=22*S.v.lift/2;hit.stun=Math.max(hit.stun,S.v.lift);}});
        }
      });
      return;
    }
    const start={x:p.x,y:p.y,z:p.z},travel=.28;
    d.chase={start,target,at:G.time,end:G.time+travel};
    d.chaseUntil=G.time+travel+.7;
    darkEvent(p,'darkchasemarked',{x2:target.x,y2:target.y,h2:cH(target)});
    for(const [offset,dmg] of [[0,5],[.18,5],[.63,15]])darkQueue(p,travel+offset,()=>{
      if(!darkAlive(target))return;
      darkEvent(p,'darkchasehit',{x:target.x,y:target.y,h:cH(target),last:dmg===15});
      aoeHit(p,target,dmg,t=>{if(dmg===15&&!t.isE&&!t.isM){t.fly=false;t.vz=Math.min(t.vz,-9);}});
    });
  }});
const DARK_WALTZ=defSpell(DARKP,{id:'darkwaltz',n:'Night Waltz',ic:'🌑',role:'damage',cd:12,
  v:{r:250,dmg:25,marked:50},d:'ระเบิดเงารอบตัว เป้ามีตราโดนแรงขึ้น',
  cast(p,S){
    darkReveal(p);darkEvent(p,'dark_nightwaltz',{radius:S.v.r});
    darkQueue(p,.56,()=>{
      for(const t of foesIn(p.team,p.x,p.y,S.v.r,p.z+8)){
        aoeHit(p,t,p.dark.marks.has(t)?S.v.marked:S.v.dmg);
      }
    });
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
        if(t.dark)t.dark.shield=Math.min(t.dark.shield,3*(1-S.v.drain));
      }
    });
  }});
const DARK_VEIL=defSpell(DARKP,{id:'darkveil',n:'วงล่องหนทีม',ic:'◌',role:'support',cd:20,
  v:{r:105,duration:4},d:'สร้างวงเงาที่ซ่อนเพื่อนร่วมทีม',
  cast(p,S){
    const {x,y,z}=p;
    darkEvent(p,'darkveil',{radius:S.v.r,duration:S.v.duration});
    darkQueue(p,.91,()=>{darkState(p).veil={x,y,z,r:S.v.r,end:G.time+S.v.duration};});
  }});
const DARK_ULT=defSpell(DARKP,{id:'darkrift',n:'ประตูเงา',ic:'🌘',role:'ult',ult:true,cd:0,
  v:{range:800,angle:80,dmg:30,mark:12},d:'เปิดประตูให้สัตว์เงางับ ติดตรา และเข้า Flow',
  cast(p,S){
    const d=darkState(p);
    if(d.ultUntil>G.time||p.shieldOn||p.dash>0)return false;
    d.ultUntil=G.time+1;d.ultBiteUntil=G.time+1.8;
    darkReveal(p);darkEvent(p,'darkrift');
    darkQueue(p,1,()=>{
      darkGainFlow(p);
      const aim=darkAim(p);
      darkQueue(p,.8,()=>darkUltBite(p,S,aim));
    });
  }});
function darkUltBite(p,S,aim){
  for(const t of darkCone(p,aim,S.v.range,S.v.angle)){
    const alive=darkAlive(t);
    if(alive&&!(t.inv>0)&&!shieldFaces(t,p.x,p.y,p.z+1.2))darkMark(p,t,S.v.mark,true);
    aoeHit(p,t,S.v.dmg);
  }
}
PATHS[DARKP].def=[DARK_MARK.id,DARK_CHASE.id,DARK_WALTZ.id,DARK_WARD.id];
PBASIC[DARKP]={id:'darkscythe',tick:darkBasic,dash:darkDash};

function darkMoveChase(p){
  const chase=p.dark?.chase;
  if(!chase)return false;
  const {start,target,at,end}=chase;
  const k=clamp((G.time-at)/(end-at),0,1),a=Math.atan2(target.y-start.y,target.x-start.x);
  p.x=lerp(start.x,target.x-Math.cos(a)*38,k);
  p.y=lerp(start.y,target.y-Math.sin(a)*38,k);
  p.z=lerp(start.z,cH(target)-1.1,k);
  p.vx=p.vy=p.vz=p.mvx=p.mvy=p.wSpd=0;
  if(k>=1){p.dark.chase=null;collideWorld(p,PR,p.z);}
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
    own?.shieldStart!=null?clamp((G.time-own.shieldStart)/.45,0,1):0,
    own?.shield??0,own?.longUntil>G.time||own?.chase?1:0,p.inp?.ap||0,own?2-own.charges.length:0];
}
function darkMarked(t){
  for(const p of plist())if(darkAlive(p)&&p.dark?.marks.get(t)>G.time)return true;
  return undefined;
}
