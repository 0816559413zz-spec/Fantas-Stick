// Thorn whip. The old offline preview URL still works with other kits.
const NATURE_BA_TEST=new URLSearchParams(location.search).get('natureba')==='1';
const NATURE_WHIP={damage:10,range:280,halfArc:Math.PI/3,cooldown:1,follow:.46,window:.66,impact:.24,duration:.78};
function natureWhipEnabled(id){
  return NATURE_BA_TEST&&NET.isHost&&!NET.online&&G?.mode==='train'&&id===NET.myId;
}
// Empowered swings after a Dash (user 2026-11-14): 'slam' after pulling an enemy (30 + stun 0.7), 'line' after dashing to an ally or plant.
const NAT_SLAM={dmg:30,stun:.7},NAT_LINE={len:340,w:42,dmg:30,slow:.6,slowT:1.5};
function natureEmpNear(p){let b=180;for(const t of foesOf(p.team)){if(t.dead||t.alive===false||t.downed)continue;const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);if(d<=NATURE_WHIP.range&&Math.abs(angDiff(Math.atan2(dy,dx),p.ang))<=NATURE_WHIP.halfArc&&d<b)b=d;}return Math.max(50,b);}
function natureEmpHit(p,swing){const hit=[],c=Math.cos(swing.angle),s=Math.sin(swing.angle);p.baHit=1;
  try{for(const t of foesOf(p.team)){const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);
    if(swing.emp==='slam'){if(d>NATURE_WHIP.range+1e-7||!aimLineH(p,p.z+1.1,t,3.2))continue;if(d>1e-7&&Math.abs(angDiff(Math.atan2(dy,dx),swing.angle))>NATURE_WHIP.halfArc+1e-7)continue;}
    else{const f=dx*c+dy*s,l=-dx*s+dy*c;if(f<0||f>NAT_LINE.len+(t.r||PR)||Math.abs(l)>NAT_LINE.w+(t.r||PR)||!aimLineH(p,p.z+1.1,t,3.2))continue;}
    if(natureTrace(p,t,p.z+1.1,cH(t),p.team))continue;
    const slam=swing.emp==='slam';
    if(aoeHit(p,t,slam?NAT_SLAM.dmg:NAT_LINE.dmg,null,false,slam?{weapon:'whip',angle:swing.angle}:undefined)){hit.push(t);emit({k:'efx',z:'nature_whip_hit',x:t.x,y:t.y,h:cH(t)});}}}
  finally{p.baHit=0;}
  if(hit.length)natureSendSpore(p,hit[0]);}
function natureWhipHit(p,swing){
  if(swing.emp){natureEmpHit(p,swing);return;}
  const hit=[];
  const wasBasic=p.baHit;
  p.baHit=1;
  try{
    for(const target of foesOf(p.team)){
      const dx=target.x-p.x,dy=target.y-p.y,distance=Math.hypot(dx,dy);
      if(distance>NATURE_WHIP.range+1e-7||!aimLineH(p,p.z+1.1,target,2.8))continue;
      if(distance>1e-7&&Math.abs(angDiff(Math.atan2(dy,dx),swing.angle))>NATURE_WHIP.halfArc+1e-7)continue;
      if(natureTrace(p,target,p.z+1.1,cH(target),p.team))continue;
      if(aoeHit(p,target,NATURE_WHIP.damage,null,false,{weapon:'whip',angle:swing.angle+swing.side*.62})){
        hit.push(target);
        emit({k:'efx',z:'nature_whip_hit',x:target.x,y:target.y,h:cH(target)});
      }
    }
  }finally{p.baHit=wasBasic;}
  if(hit.length&&p.pathIdx===NATUREP){
    hit.sort((a,b)=>natureDist(p,a)-natureDist(p,b));
    p.natureFocus=hit[0];
    natureSendSpore(p,hit[0]);
  }
}
function natureWhipBasic(p,inp,canSwing){
  const swing=p.natureWhip;
  const pressed=!!inp.fire&&!p.natureFire;
  p.natureFire=!!inp.fire;
  if(!canSwing){
    if(swing)swing.cancelled=true;
    return;
  }
  const age=swing?G.time-swing.start:Infinity;
  if(swing&&!swing.hit&&!swing.cancelled&&age+1e-8>=(swing.imp??NATURE_WHIP.impact)){
    swing.hit=true;
    natureWhipHit(p,swing);
  }
  const combo=swing&&!swing.second&&!swing.cancelled&&age<=NATURE_WHIP.window;
  if(combo&&pressed)swing.queued=true;
  const second=combo&&age+1e-8>=NATURE_WHIP.follow&&(inp.fire||swing.queued);
  if(!second&&(!inp.fire||p.cd.basic>1e-8||age+1e-8<NATURE_WHIP.cooldown*(p.baHaste>G.time?1/(1+NAT.lotusHaste):1)))return;
  const E=p.natureEmp&&p.natureEmp.until>G.time&&!second?p.natureEmp.k:null;if(E)p.natureEmp=null;
  p.natureWhip={start:G.time,side:swing?-swing.side:1,angle:p.ang,hit:false,cancelled:false,second:!!second||!!E,emp:E,imp:E?.34:undefined};
  if(E)emit({k:'efx',z:E==='slam'?'nature_bigslam':'nature_thornline',x:Math.round(p.x),y:Math.round(p.y),h:p.z,a:Math.round(p.ang*100)/100,id:p.id,r:E==='slam'?NATURE_WHIP.range:NAT_LINE.len,d:E==='slam'?Math.round(natureEmpNear(p)):0});

  p.cd.basic=p.cdMax.basic=NATURE_WHIP.cooldown*(p.baHaste>G.time?1/(1+NAT.lotusHaste):1);
}

const NATURE_READY_YAW=-Math.PI/4;
const NW_RINGS=27,NW_SIDES=7;
const nwCounterTurn=new THREE.Quaternion(),nwAimTurn=new THREE.Quaternion(),nwArmAim=new THREE.Vector3();
const nwRootAim=new THREE.Vector3(),nwUp=new THREE.Vector3(0,1,0);
const nwPhase=(t,start,end)=>clamp((t-start)/(end-start),0,1);
const nwEase=x=>x*x*(3-2*x);
function nwSwingAngle(t,side){
  const brake=side<0?.31:.29;
  const q=nwPhase(t,.04,brake);
  const sweep=lerp(side<0?1.49:1.55,side<0?-1.27:-1.30,q*q*q*(q*(q*6-15)+10));
  return side*(sweep+.54*nwEase(nwPhase(t,brake-.02,brake+.24))-.06*Math.sin(Math.PI*nwPhase(t,brake,brake+.10)));
}
function nwRightRelease(t,side){
  return side>0?nwEase(nwPhase(t,.17,.32))*(1-nwEase(nwPhase(t,.42,.65))):0;
}
function natureWhipPose(o,swing,native){
  const t=swing.age,entry=nwEase(nwPhase(t,0,.07));
  const carry=swing.carry;
  const weight=(carry?1:entry)*(1-nwEase(nwPhase(t,.52,NATURE_WHIP.duration)));
  const sweep=nwSwingAngle(t,swing.side);
  const angle=carry?lerp(carry.angle,sweep,entry):sweep;
  const pitch=-1.25+.25*Math.sin(Math.min(1,t/.46)*Math.PI);
  const arm=o.armR.rotation,twist=angle*.28;
  arm.x=native&&carry?lerp(carry.pitch,pitch,entry):lerp(arm.x,pitch,native?1:weight);
  arm.y=angle*.55*(native?1:weight);
  if(native){
    const moveLeft=nwEase(nwPhase(angle,-.28,1.05));
    const delayed=nwSwingAngle(Math.max(0,t-.042),swing.side);
    const followAngle=carry?lerp(carry.angle,delayed,entry):delayed;
    const open=nwRightRelease(t,swing.side);
    const release=carry?lerp(carry.release,open,entry):open;
    swing.freeOut=nwEase(nwPhase(followAngle,-.38,1.07))*weight;
    swing.freeBack=release*weight;
    const snap=Math.sin(Math.PI*nwPhase(t,.18,.36))*weight;
    const settle=Math.sin(Math.PI*nwPhase(t,.36,.56))*weight;
    swing.headYaw=.10*followAngle*weight;
    swing.headPitch=.055*snap-.023*settle;
    swing.headRoll=swing.side*(.056*snap-.020*settle);
    arm.z=-.57*release;
    o.b.rotation.y=NATURE_READY_YAW*(1-moveLeft*weight)-.022*release;
    // Follow the whip with the chest while preserving the right arm's aiming arc.
    o.armR.quaternion.premultiply(nwCounterTurn.setFromAxisAngle(nwUp,twist-o.b.rotation.y));
    // Aim the casting arm down the original whip sweep, from the wind-up onward.
    const aimYaw=angle*1.08-o.b.rotation.y;
    nwArmAim.set(0,-.973,.23).normalize().applyQuaternion(o.armR.quaternion);
    nwRootAim.set(Math.sin(aimYaw)*.997,-.07,Math.cos(aimYaw)*.997).normalize();
    nwAimTurn.identity().slerp(nwCounterTurn.setFromUnitVectors(nwArmAim,nwRootAim),.80);
    o.armR.quaternion.premultiply(nwAimTurn);
  }else{
    arm.z=lerp(arm.z,0,weight);
    o.b.rotation.y=twist*weight;
  }
  return weight;
}
function natureWhipVisualMake(o){
  const geo=new THREE.BufferGeometry();
  const positions=new THREE.BufferAttribute(new Float32Array(NW_RINGS*NW_SIDES*3),3);
  const indices=[];
  for(let i=0;i<NW_RINGS-1;i++)for(let j=0;j<NW_SIDES;j++){
    const a=i*NW_SIDES+j,b=i*NW_SIDES+(j+1)%NW_SIDES;
    indices.push(a,b,a+NW_SIDES,b,b+NW_SIDES,a+NW_SIDES);
  }
  geo.setAttribute('position',positions);geo.setIndex(indices);
  const vine=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({
    color:'#335d20',emissive:'#63a13d',emissiveIntensity:.46,roughness:.87,side:THREE.DoubleSide
  }));
  vine.frustumCulled=false;
  const thorns=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,5),
    new THREE.MeshStandardMaterial({color:'#486227',emissive:'#355221',emissiveIntensity:.3}),NW_RINGS-2);
  thorns.frustumCulled=false;
  vine.add(thorns);o.g.add(vine);
  return {vine,positions,thorns,points:Array.from({length:NW_RINGS},()=>new THREE.Vector3()),
    tangent:new THREE.Vector3(),normal:new THREE.Vector3(),binormal:new THREE.Vector3(),
    spike:new THREE.Object3D(),up:new THREE.Vector3(0,1,0),
    worldA:new THREE.Vector3(),worldB:new THREE.Vector3(),swing:null,trail:null,lastSample:-Infinity};
}
const nwWandTipWorld=new THREE.Vector3();
function natureWhipWand(o,v){
  if(o.wnG||!o.fileModel)return;
  if(v.wandModel!==o.fileModel){
    v.wandModel=o.fileModel;v.wand=null;
    o.fileModel.traverse(mesh=>{
      if(!mesh.isMesh||!/^wand_\d+$/.test(mesh.name))return;
      const geometry=mesh.geometry;
      if(!geometry.boundingBox)geometry.computeBoundingBox();
      const bounds=geometry.boundingBox;
      v.wand=mesh;
      v.wandEnd=bounds.getCenter(new THREE.Vector3());
      v.wandEnd.y=bounds.min.y;
    });
  }
  if(v.wand&&o.caER?.on){
    // Let the glow use the visible wand too. The elbow layer restores the tip next frame.
    v.wand.localToWorld(nwWandTipWorld.copy(v.wandEnd));
    o.tip.position.copy(o.armR.worldToLocal(nwWandTipWorld));
  }
}
function natureWhipView(o,swing){   // exact preview whip: natFx().Whip (tools/nature-preview.js SKS.whip)
  let v=o.natureWhipView;
  if(!swing){if(v&&v.idle<25){v.idle++;v.w.upd(o,-1,{t0:0,dir:1});}return;}
  const F=natFx();
  if(!v){const w=F.Whip(NATURE_WHIP.range*S3,true);v=o.natureWhipView={w,vine:w.tube,start:null,sw:null,idle:0};}
  v.idle=0;
  if(v.start!==swing.start){v.start=swing.start;v.sw={t0:0,dir:swing.side,shed:0};}
  natureWhipWand(o,v);
  const sw=v.sw,q=simOf(o.g.position);F.O.y=GY(q.x,q.y);
  sw.wand=v.wand;sw.wandEnd=v.wandEnd;
  const r=v.w.upd(o,Math.max(.0001,swing.age),sw);
  if(r){
    const burst=[[.42,3],[.49,3],[.56,3]][sw.shed];
    if(burst&&r.st>=burst[0]&&sw.lastTip){
      const fling=r.tip.clone().sub(sw.lastTip).normalize().multiplyScalar(2.4);fling.y+=.75;
      F.leaves(r.tip.clone().lerp(r.pts[F.WHIP_N-3],sw.shed===0?.65:.2),burst[1],1.9,{dir:fling,life:.72,size:1.45});sw.shed++;
    }
    sw.lastTip=r.tip;
  }
}
