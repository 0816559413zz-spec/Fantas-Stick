// Nature combat is simulated by the host. Positions are map units, heights are metres.
const NATUREP=3;
const NAT={seedRange:300,hookRange:300,hookSpeed:800,lotusRange:160,treeRange:500,
  treeHeight:23,treeGrow:3.4,treeLife:12,peaRadius:55,wallHalf:105,wallThick:12,wallHeight:3.6};
const natureDist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const natureItems=()=>G.nature||(G.nature=[]);
const natureLive=o=>o&&(o.natKind?o.hp>0&&!o.dead&&!o.move:o.isE||o.isM?!o.dead:o.alive&&!o.downed);
const naturePlants=(p,kind)=>natureItems().filter(o=>o.isM&&o.owner===p.id&&(!kind||o.natKind===kind)&&o.hp>0&&!o.dead&&o.end>G.time);
const natureY=o=>terrT(o.x,o.y);
const natureHead=o=>o.h+({turret:1.37,lotus:4.2,tree:8}[o.natKind]||0);
const natureTreeReady=o=>o.natKind==='tree'&&natureLive(o)&&G.time>=o.ready&&G.time<o.end;
function natureEmit(z,o,extra={}){emit({k:'efx',z:'nature_'+z,x:o.x,y:o.y,h:o.h||0,...extra});}

// A slightly curved wall uses the same arc for movement, projectiles and line of sight.
function natureWallLocal(w,x,y){
  const dx=x-w.x,dy=y-w.y,s=Math.sin(w.a),c=Math.cos(w.a);
  const u=-s*dx+c*dy,v=c*dx+s*dy;
  const bend=-.0014*clamp(u,-NAT.wallHalf,NAT.wallHalf)**2;
  return {u,v,bend,s,c};
}
function natureWallContains(w,x,y,h,pad=0){
  if(!w.wood)return h<w.hgt&&(x-w.x)**2+(y-w.y)**2<(w.r+pad)**2;
  const height=h+natureY({x,y})-natureY(w);
  if(height<w.h-.15||height>w.h+w.hgt)return false;
  const q=natureWallLocal(w,x,y);
  return Math.abs(q.u)<=NAT.wallHalf+pad&&Math.abs(q.v-q.bend)<=NAT.wallThick+pad;
}
function natureWallPush(w,o,r,z,last){
  if(w.hp<=0||!natureWallContains(w,o.x,o.y,z,r)||z+1.9+natureY(o)<w.h+natureY(w))return 0;
  const q=natureWallLocal(w,o.x,o.y),previous=last&&natureWallLocal(w,last.x,last.y);
  const sign=Math.sign(previous?previous.v-previous.bend:q.v-q.bend)||1;
  const shift=q.bend+sign*(NAT.wallThick+r+.01)-q.v;
  o.x+=q.c*shift;o.y+=q.s*shift;
  return 1;
}
function natureBurnWall(w,x,y,by){
  const i=clamp(Math.floor((natureWallLocal(w,x,y).u/NAT.wallHalf+1)*1.5),0,2);
  const b=w.burn[i];
  if(b.total>=w.maxHp*.2)return;
  b.end=G.time+5;b.layers=Math.min(3,b.layers+1);b.by=by;
  natureEmit('wall_burn',w,{zone:i,a:w.a});
}
function natureWallDamage(w,dmg,x,y,by,el){
  if(w.hp<=0)return;
  w.hp-=dmg;
  if(el==='fire'&&w.hp>0)natureBurnWall(w,x,y,by);
}
function natureWallTick(w,dt){
  for(const b of w.burn){
    if(G.time>=b.end){b.layers=0;continue;}
    const dealt=Math.min(w.maxHp*.2-b.total,7*b.layers*dt);
    b.total+=dealt;w.hp-=dealt;
  }
}

// Returns the first solid point along a world-space segment, with height relative to its ground.
function natureTrace(a,b,ha,hb,team,allWalls=false){
  const d=natureDist(a,b),count=Math.max(1,Math.ceil(d/6));
  const ay=natureY(a)+ha,by=natureY(b)+hb;
  const house=bldRay(a.x,a.y,ha,b.x,b.y,hb);
  const obstacles=sgNear(sgObs(),(a.x+b.x)/2,(a.y+b.y)/2,d/2+10,[]);
  for(let i=1;i<=count;i++){
    const t=i/count;
    if(house&&house.t<=t)return house;
    const x=lerp(a.x,b.x,t),y=lerp(a.y,b.y,t),ground=terrT(x,y),worldY=lerp(ay,by,t),h=worldY-ground;
    if(terrSolid(x,y,h))return {x,y,h,t};
    for(const o of obstacles)if(o.bi===undefined&&h>=(o.bot??0)&&(o.top!==undefined?worldY<o.top:h<o.hgt)
      &&(x-o.x)**2+(y-o.y)**2<o.r**2)return {x,y,h,t};
    for(const w of G.walls)if(w.hp>0&&(allWalls||w.team!==team)&&natureWallContains(w,x,y,h))return {x,y,h,t};
    for(const w of G.eso||[])if(!w.dead&&w.k!=='dom'&&(allWalls||w.team!==team)&&h<w.hgt&&eSegD(x,y,w).d<w.r)return {x,y,h,t};
    for(const w of G.wwl||[])if(!w.dead&&(allWalls||w.team!==team)&&h<5.8&&wSeg(w,x,y).d<w.r)return {x,y,h,t};
  }
  return house;
}
function natureSight(a,b,ha,hb){return !natureTrace(a,b,ha,hb,a.team,true);}
function natureGround(x,y){
  const q={x:clamp(x,40,MW-40),y:clamp(y,40,MH-40)};
  collideWorld(q,16,groundH(q.x,q.y));
  q.h=groundH(q.x,q.y);
  return q;
}
function natureAimPoint(p,range){
  const i=p.inp;
  if(!p.bot||!(i?.gx>=0)||!Number.isFinite(i.gx)||!Number.isFinite(i.gy))return aimPoint(p,range,false);
  const dx=i.gx-p.x,dy=i.gy-p.y,k=Math.min(1,range/(Math.hypot(dx,dy)||1));
  return {x:clamp(p.x+dx*k,40,MW-40),y:clamp(p.y+dy*k,40,MH-40)};
}
function naturePlace(p,point,onWall){
  const q=natureGround(point.x,point.y);
  const wall=natureTrace(p,point,p.z+1.35,point.h??q.h+.15,p.team,true);
  if(!wall)return q;
  const distance=natureDist(p,point)||1,dx=(point.x-p.x)/distance,dy=(point.y-p.y)/distance;
  if(onWall&&wall.h>.25)return {x:wall.x-dx*8,y:wall.y-dy*8,h:wall.h,wall:1,a:Math.atan2(-dy,-dx)};
  return natureGround(wall.x-dx*30,wall.y-dy*30);
}
function naturePlant(p,kind,spot,delay=0){
  const hp={turret:60,lotus:100,tree:350}[kind];
  const life={turret:20,lotus:15,tree:NAT.treeLife}[kind];
  const ready=G.time+delay+(kind==='tree'?NAT.treeGrow:0);
  const o={...spot,z:spot.h,id:++G.zid,isM:true,natKind:kind,type:'nature_'+kind,team:p.team,owner:p.id,
    r:kind==='tree'?37:kind==='lotus'?18:13,hp,maxHp:hp,ready,end:ready+life,
    born:G.time+delay,dx:spot.x-p.x,dy:spot.y-p.y,a:spot.a??p.ang,mode:0,vx:0,vy:0,healAt:ready+1,sporeAt:ready+5};
  natureItems().push(o);
  return o;
}
function natureCastPlant(p,kind){
  if(kind==='lotus'&&naturePlants(p,kind).length)return false;
  let point=natureAimPoint(p,NAT.seedRange);
  if(kind==='turret'){
    const hit=aimRay3(p,p.z+1.35,NAT.seedRange);
    if(hit?.hit==='bld')point=hit;
  }
  const spot=naturePlace(p,point,kind==='turret');
  if(kind==='turret'){
    const current=naturePlants(p,kind);
    if(current.length>=2)current[0].end=G.time;
  }
  const delay=.18+natureDist(p,spot)/1200;
  naturePlant(p,kind,spot,delay);
  natureEmit('seed',{x:p.x,y:p.y,h:p.z+1.35},{x2:spot.x,y2:spot.y,h2:spot.h,t:delay});
}
function natureLotusToggle(p){
  if(p.sil>0||p.cryo>0||(G.mode==='br'&&!p.unl?.[BRMAP[SLOTK[p.kitIds.indexOf('bloom')]]]))return false;
  const o=naturePlants(p,'lotus')[0];
  if(!o||G.time<o.ready||o.move||G.time<(o.switchAt||0))return false;
  o.mode=1-o.mode;o.switchAt=G.time+2;o.modeAt=G.time;
  natureEmit('lotus_switch',{...o,h:natureHead(o)},{mode:o.mode,r:NAT.lotusRange});
  return true;
}
function natureMovePlants(p){
  const list=naturePlants(p).filter(o=>o.natKind!=='tree'&&G.time>=o.ready&&!o.move);
  if(!list.length)return false;
  for(const o of list){
    const spot=naturePlace(p,{x:p.x+o.dx,y:p.y+o.dy},o.natKind==='turret');
    o.move={spot,start:G.time,at:G.time+.34};
    natureEmit('relocate',o,{x2:spot.x,y2:spot.y,h2:spot.h});
  }
  natureEmit('pulse',{...p,h:p.z},{r:110});
}
function natureCastWall(p){
  const q=naturePlace(p,natureAimPoint(p,260),false);
  if(natureDist(p,q)<40)return false;
  const wall=addWall({...q,a:p.ang,wood:true,owner:p.id,team:p.team,r:NAT.wallHalf,
    hgt:NAT.wallHeight,hp:175,maxHp:175,t:8,born:G.time,burn:Array.from({length:3},()=>({end:0,layers:0,total:0}))});
  natureEmit('wall_grow',wall,{a:wall.a});
}

function naturePoison(t,power,life,owner,source){
  const old=t.naturePoison;
  if(old&&old.end>=G.time&&old.power>power)return;
  t.naturePoison={power,owner,source,end:G.time+life,next:old&&old.end>=G.time?old.next:G.time+1};
}
function natureStatus(t){
  const dot=t.naturePoison;
  if(dot&&natureLive(t)){
    if(G.time+1e-7>=dot.next&&dot.next<=dot.end+1e-7){dot.next++;damage(t,dot.power,dot.owner,'naturePoison');}
    if(G.time>dot.end&&dot.next>dot.end)t.naturePoison=null;
  }
  const wrap=t.natureWrap;
  if(wrap&&G.time>=wrap.next&&natureLive(t)){
    if(wrap.next<=wrap.end+1e-7){healT(t,10);wrap.next+=.5;}
    else t.natureWrap=null;
  }
}
function natureSpore(p,lotus){
  const bag=(p.natureSpores||[]).filter(o=>o.end>G.time);
  p.natureSpores=bag;
  if(bag.length>=2)return;
  bag.push({id:++G.zid,end:G.time+10});
  natureEmit('spore_gain',{...lotus,h:natureHead(lotus)},{id:p.id,x2:p.x,y2:p.y,h2:p.z+1.45});
}
function natureSendSpore(p,t){
  const bag=p.natureSpores;
  if(!bag)return;
  while(bag.length&&bag[0].end<=G.time)bag.shift();
  if(!bag.length)return;
  bag.shift();
  natureItems().push({natKind:'spore',id:++G.zid,owner:p.id,target:t,at:G.time+.27,hp:1});
  natureEmit('spore_send',{...p,h:p.z+1.45},{x2:t.x,y2:t.y,h2:cH(t)});
}
function natureShield(p){
  if(!p.shieldOn)return;
  const last=p.natureShieldHits||(p.natureShieldHits=new Map());
  const targets=foesOf(p.team).filter(t=>natureDist(p,t)<=180&&Math.abs(cH(t)-cH(p))<2.8
    &&G.time>=(last.get(t)||0)&&natureSight(p,t,cH(p),cH(t)));
  for(const t of targets.sort((a,b)=>natureDist(p,a)-natureDist(p,b))){
    last.set(t,G.time+.75);
    natureEmit('slam',{...p,h:p.z},{id:p.id,x2:t.x,y2:t.y,h2:groundH(t.x,t.y,t.z??t.h)});
    if(aoeHit(p,t,10))natureSendSpore(p,t);
  }
  for(const [t,time] of last)if(time<=G.time)last.delete(t);
}

function natureHookCandidates(p){
  return [...plist().filter(q=>q!==p&&natureLive(q)),...G.en.filter(natureLive),
    ...naturePlants(p).filter(o=>G.time>=o.born&&natureLive(o))];
}
function natureDash(p,inp,pr,dt,setCd){
  if(p.natureHook)return true;
  if(!pr.sp||p.cd.dodge>0)return false;
  setCd('dodge',8);p.shieldOn=false;
  const az=p.ang,h=p.z+1.35,pitch=Number.isFinite(inp.ah)
    ?Math.atan2((inp.ah-h)*20,Math.max(1,Math.hypot(inp.ax-p.x,inp.ay-p.y))) : (inp.ap||0);
  const dx=Math.cos(az)*Math.cos(pitch),dy=Math.sin(az)*Math.cos(pitch),dz=Math.sin(pitch);
  let best=null,score=Infinity;
  for(const t of natureHookCandidates(p)){
    const th=cH(t),x=t.x-p.x,y=t.y-p.y,z=(natureY(t)+th-natureY(p)-h)*20;
    const d=Math.hypot(x,y,z),along=x*dx+y*dy+z*dz;
    const miss=Math.sqrt(Math.max(0,d*d-along*along));
    const radius=t.team===p.team?(t.natKind?47:44):Math.max(18,t.r||PR);
    if(d>NAT.hookRange||along<=0||miss>radius||!natureSight(p,t,h,th))continue;
    const value=miss/radius+d/2000;
    if(value<score){score=value;best=t;}
  }
  const goal=best||{x:p.x+dx*NAT.hookRange,y:p.y+dy*NAT.hookRange};
  const goalH=best?cH(best):h+dz*NAT.hookRange/20;
  const wall=best?null:natureTrace(p,goal,h,goalH,p.team,true);
  const end=wall||goal;
  const flight=.10+natureDist(p,end)/2300;
  natureEmit('hook',{...p,h},{id:p.id,x2:end.x,y2:end.y,h2:wall?.h??goalH,t:flight,hit:!!best,ally:best?.team===p.team});
  p.natureHook={target:best,at:G.time+flight,end:G.time+flight+1};
  return true;
}
function natureHookMove(p,dt){
  const hook=p.natureHook;
  if(!hook)return false;
  if(G.time<hook.at)return true;
  const t=hook.target;
  if(!natureLive(t)||G.time>hook.end||p.stun>0||p.root>0||p.fly||p.shk>0||!natureSight(p,t,p.z+1.25,cH(t))){p.natureHook=null;return false;}
  if(!hook.latched){
    hook.latched=true;
    if(!t.natKind){
      t.natureCoilEnd=G.time+3;
      if(t.team===p.team)t.natureWrap={end:G.time+3,next:G.time+.5};
      else{naturePoison(t,7,3,p.id,'hook');addSlow(t,.5,3);}
      natureEmit('coil',{...t,h:cH(t)},{id:t.isE||t.isM?null:t.id,ally:t.team===p.team});
    }
  }
  const d=natureDist(p,t),stop=(t.r||PR)+PR+3,step=Math.min(Math.max(0,d-stop),NAT.hookSpeed*dt);
  if(step>0){
    p.x+=(t.x-p.x)*step/d;p.y+=(t.y-p.y)*step/d;
    const th=Math.max(0,cH(t)-1.1+natureY(t)-natureY(p));
    p.z=lerp(p.z,th,step/Math.max(step,d-stop));p.vz=0;
  }
  if(d-stop<=step+.1){
    if(t.natKind){p.haste=3;p.hasteF=1.5;if(t.natKind==='turret')t.bigPea=true;}
    p.natureHook=null;
  }
  return true;
}

function natureBall(p){
  const q=natureAimPoint(p,NAT.seedRange),h=groundH(q.x,q.y),wall=natureTrace(p,q,p.z+1.4,h+.12,p.team,true);
  const end=wall?{...wall,x:wall.x-4*Math.cos(p.ang),y:wall.y-4*Math.sin(p.ang)}:{...q,h};
  const flight=.12+natureDist(p,end)/1700;
  const ball={natKind:'ball',id:++G.zid,owner:p.id,team:p.team,x:end.x,y:end.y,h:end.h,
    born:G.time,land:G.time+flight,stab:G.time+flight+(wall?0:.35),origin:{x:p.x,y:p.y,h:p.z+1.4},hitWall:!!wall,hp:1};
  natureItems().push(ball);
}
function natureBallTick(o,p,dt){
  if(!o.landed&&G.time>=o.land){o.landed=true;natureEmit('ball_land',o);}
  if(G.time<o.stab)return;
  if(!o.targets){
    o.targets=foesOf(o.team).filter(t=>!t.isM&&natureDist(o,t)<=100&&Math.abs(cH(t)-o.h)<2.8
      &&!shieldFaces(t,o.x,o.y)&&!(t.inv>0)&&natureSight(o,t,o.h+.25,cH(t)));
    o.pullAt=G.time+.19;o.end=o.pullAt+.23;
    for(const t of o.targets)natureEmit('ball_spike',{...o,h:o.h+.25},{x2:t.x,y2:t.y,h2:cH(t),target:t.id,enemy:!!t.isE});
  }
  if(G.time<o.pullAt)return;
  for(const t of o.targets){
    if(!natureLive(t)||!natureSight(o,t,o.h+.25,cH(t)))continue;
    const d=natureDist(o,t),step=Math.min(Math.max(0,d-24),dt*620);
    if(step>0){t.x+=(o.x-t.x)*step/d;t.y+=(o.y-t.y)*step/d;collideWorld(t,t.r||PR,t.z??t.h);}
    if(G.time>=o.end){naturePoison(t,4,5,p.id,'ball');addSlow(t,.3,1.5);if(!isBig(t))t.natureSlow=G.time+1.5;}
  }
  if(G.time>=o.end){o.dead=true;natureEmit('ball_pop',o);}
}

function natureTree(p){
  if(naturePlants(p,'tree').length)return false;
  naturePlant(p,'tree',naturePlace(p,natureAimPoint(p,240),false));
}
function natureTreeReach(tree,t){
  if(natureDist(tree,t)>NAT.treeRange)return false;
  const top=natureY(tree)+tree.h+NAT.treeHeight;
  return !natureTrace(tree,t,top-natureY(tree),top-natureY(t),tree.team,true);
}
function natureGuardian(t){
  let tree=null;
  for(const o of G.nature||[])if(o.team===t.team&&natureTreeReady(o)&&natureTreeReach(o,t)
    &&(!tree||natureDist(o,t)<natureDist(tree,t)))tree=o;
  return tree;
}
function natureGuard(t,amt){
  if(!(amt>0)||!G.nature?.length)return amt;
  const tree=natureGuardian(t);
  if(!tree)return amt;
  const cut=Math.min(tree.hp,amt*.65);
  tree.hp-=cut;
  natureEmit('guard',{...t,h:cH(t)},{x2:tree.x,y2:tree.y,h2:tree.h+10});
  return amt-cut;
}
function natureDamage(o,amt,owner){
  if(!natureLive(o)||o.natKind==='tree'&&G.time<o.ready||G.time<o.born)return;
  o.hp-=amt;
  natureEmit('plant_hit',{...o,h:natureHead(o)});
  if(o.hp<=0)natureEnd(o,true);
}
function natureEnd(o,broke){
  if(o.dead)return;
  o.dead=true;
  if(o.natKind==='tree'&&broke)for(const p of plist())if(p.team===o.team&&natureLive(p)&&natureTreeReach(o,p))healT(p,125);
  natureEmit('plant_end',o,{kind:o.natKind,broke,wall:o.wall,a:o.a,mode:o.mode});
}
function natureTurret(o,p){
  const lotus=naturePlants(p,'lotus')[0],tree=naturePlants(p,'tree')[0];
  const buff=G.time<(o.boostUntil||0)||(lotus&&lotus.mode&&G.time>=lotus.ready&&!lotus.move
    &&natureDist(lotus,o)<=NAT.lotusRange&&natureSight(lotus,o,natureHead(lotus),natureHead(o)))
    ||(tree&&natureTreeReady(tree)&&natureTreeReach(tree,o));
  const cadence=buff?.44:1;
  o.buffed=!!buff;
  const ready=G.time>=(o.firedAt??-Infinity)+cadence&&G.time>=(o.recoverUntil||0)
    &&(!o.chargeAt||G.time>=o.chargeAt+.4);
  if((!ready||!o.aimTarget)&&G.time<(o.aimAt||0)&&p.natureFocus===o.focusSeen)return;
  o.aimAt=G.time+.12;o.focusSeen=p.natureFocus;
  const can=t=>natureLive(t)&&natureDist(o,t)<=400&&natureSight(o,t,natureHead(o),cH(t));
  let target=p.natureFocus;
  if(!can(target))target=foesOf(o.team).filter(can).sort((a,b)=>natureDist(o,a)-natureDist(o,b))[0];
  if(!target){o.aimTarget=null;o.chargeAt=0;return;}
  const a=Math.atan2(target.y-o.y,target.x-o.x);
  if(o.aimTarget!==target){o.aimTarget=target;o.turnAt=G.time;}
  o.aim=a;
  if(!ready)return;
  if(o.bigPea){
    if(!o.chargeAt){o.chargeAt=G.time;return;}
    if(G.time<o.chargeAt+.4)return;
  }
  const big=!!o.bigPea,shot=big?'nature_pea':'nature_thorn',speed=big?1800:1000,h=natureHead(o);
  const x=o.x+Math.cos(a)*17,y=o.y+Math.sin(a)*17,d=Math.max(1,Math.hypot(target.x-x,target.y-y));
  const pr={id:++G.pid,type:shot,owner:p.id,team:p.team,src:'p',x,y,h:h+natureY(o)-terrT(x,y),
    vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,vh:(cH(target)+natureY(target)-h-natureY(o))*speed/d,
    r:big?9:3,dmg:big?30:5,life:Math.max(.09,(d+36)/speed)};
  G.proj.push(pr);
  o.firedAt=G.time;o.shotBig=big;
  if(big){o.chargeAt=0;o.bigPea=false;o.recoverUntil=G.time+.5;natureEmit('pea_muzzle',pr,{a});}
}
function naturePeaSplash(pr){
  natureEmit('pea_splash',pr,{r:NAT.peaRadius});
  for(const t of foesOf(pr.team))if(natureDist(pr,t)<=NAT.peaRadius&&Math.abs(cH(t)-pr.h)<2.6
    &&!natureTrace(pr,t,pr.h,cH(t),pr.team,true))damage(t,pr.dmg,pr.owner,'aoe');
}
function natureUpdate(dt){
  if(!G.nature?.length)return;
  for(const o of G.nature){
    if(o.dead)continue;
    const p=G.players[o.owner];
    if(!p||p.pathIdx!==NATUREP){o.dead=true;continue;}
    if(o.natKind==='ball'){natureBallTick(o,p,dt);continue;}
    if(o.natKind==='spore'){
      if(G.time>=o.at){
        o.dead=true;
        if(natureLive(o.target)){naturePoison(o.target,6,3,p.id,'spore');natureEmit('spore_pop',{...o.target,h:cH(o.target)});}
      }
      continue;
    }
    if(o.hp<=0||G.time>=o.end){natureEnd(o,o.hp<=0);continue;}
    if(o.move&&G.time>=o.move.at){
      Object.assign(o,{wall:0,...o.move.spot,z:o.move.spot.h,born:G.time,hp:o.maxHp,boostUntil:G.time+4});o.move=null;
    }
    if(o.move||G.time<o.ready)continue;
    if(o.natKind==='turret'){natureTurret(o,p);continue;}
    if(o.natKind!=='lotus')continue;
    if(G.time>=o.sporeAt){o.sporeAt+=5;if(natureLive(p))natureSpore(p,o);}
    if(G.time<o.healAt)continue;
    o.healAt+=1;
    if(o.mode)continue;
    for(const t of [...plist().filter(q=>q.team===o.team),...naturePlants(p,'turret'),o]){
      if(natureLive(t)&&natureDist(o,t)<=NAT.lotusRange&&natureSight(o,t,natureHead(o),cH(t)))healT(t,5);
    }
  }
  G.nature=G.nature.filter(o=>!o.dead);
}

function natureReset(p){
  p.natureWhip=p.natureHook=p.natureFocus=p.natureShieldHits=p.natureSpores=p.naturePoison=p.natureWrap=null;
  p.natureFire=false;p.natureCoilEnd=p.natureSlow=0;
}
function natureSnapP(p){
  const w=p.natureWhip,age=w?G.time-w.start:0;
  const swing=w&&!w.cancelled&&age<NATURE_WHIP.duration?[w.start,age,w.side,w.angle]:0;
  const spores=p.natureSpores?.filter(o=>o.end>G.time).length||0;
  const coil=Math.max(0,(p.natureCoilEnd||0)-G.time);
  const tree=natureLive(p)?natureGuardian(p):null;
  const zone=!!tree||!!G.nature?.some(o=>natureTreeReady(o)&&natureDist(o,p)<=NAT.treeRange);
  return swing||spores||coil||zone?[swing,spores,coil,tree?.id||0,zone]:0;
}
function natureLotusCooldown(p){
  const lotus=p.pathIdx===NATUREP&&naturePlants(p,'lotus')[0];
  const slot=lotus&&p.kitIds.indexOf('bloom');
  return lotus&&slot>=0&&G.time>=lotus.ready?[SLOTK[slot],Math.max(0,(lotus.switchAt||0)-G.time)]:null;
}
function natureSnapW(){
  const plants=(G.nature||[]).filter(o=>!o.dead&&o.natKind!=='spore').map(o=>{
    if(o.natKind==='ball')return {id:o.id,k:o.natKind,x:o.x,y:o.y,h:o.h,age:G.time-o.born,
      flight:o.land-o.born,stab:o.stab-o.born,pull:o.pullAt?G.time-o.pullAt:null,origin:o.origin};
    if(G.time<o.born)return null;
    return {id:o.id,k:o.natKind,x:o.x,y:o.y,h:o.h,a:o.a,wall:o.wall,team:o.team,owner:o.owner,hp:o.hp,maxHp:o.maxHp,
      age:G.time-o.born,mode:o.mode,modeAge:o.modeAt?G.time-o.modeAt:99,move:o.move?G.time-o.move.start:null,
      buff:o.buffed,aim:o.aim,turn:o.turnAt?G.time-o.turnAt:99,charge:o.chargeAt?G.time-o.chargeAt:null,
      shot:o.firedAt===undefined?99:G.time-o.firedAt,big:o.shotBig};
  }).filter(Boolean);
  const walls=G.walls.filter(o=>o.wood&&o.hp>0).map(o=>({id:o.id,k:'wall',x:o.x,y:o.y,h:o.h,a:o.a,age:G.time-o.born,burn:o.burn.map(b=>b.total/(o.maxHp*.2))}));
  return plants.length||walls.length?{NT:[...plants,...walls]}:{};
}

PDEF.nature_thorn={spd:1000,r:3,dmg:5,life:.5,col:'#83d63e'};
PDEF.nature_pea={spd:1800,r:9,dmg:30,life:.3,col:'#a6e746'};
