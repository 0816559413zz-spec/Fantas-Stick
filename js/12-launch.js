// Launch (real ragdoll knock-up) — host sim. Spec for skill makers: guides/RAGDOLL-STANDARD.md
// Skill calls launch(t, fromX, fromY, S.v.rag, srcId) with rag = {time, up, push}.
// While p.rgT>0: no move/cast/dash/shield (canAct false), keeps air momentum, snapshot lr:1 → client full ragdoll (js/48).
const LAUNCH={
  G:22,        // must match gravity() pull when not jumping (js/11)
  airFr:0.6,   // horizontal drag while airborne (per sec, exp) — ground uses the normal 6
  wallSp:250,  // px/s: hitting a wall faster than this = wall impact event (rgwall)
};
// rag: time = seconds down (hit → can act again), up = peak height (3D units), push = horizontal force (same scale as knock())
function launch(t,x,y,rag,srcId){
  if(!t||!rag)return false;
  if(t.isE||t.isM||!G.players[t.id]){if(rag.push)knock(t,x,y,rag.push);return false;}   // enemies/minions: push only (no ragdoll rig)
  if(!t.alive||t.downed||t.inv>0)return false;
  if(rag.push)knock(t,x,y,rag.push);
  const up=Math.max(0,rag.up||0);
  if(up>0)t.vz=Math.max(t.vz||0,Math.sqrt(2*LAUNCH.G*up));
  t.rgT=Math.max(t.rgT||0,rag.time||0);t.rgSrc=srcId;t.jumpAir=false;t.fly=false;
  emit({k:'rglaunch',id:t.id,x:Math.round(t.x),y:Math.round(t.y),h:t.z});
  return true;
}
// called every tick for alive players (js/11 updatePlayer)
function launchTick(p,dt){
  if(!(p.rgT>0))return;
  if(p.downed){p.rgT=0;return;}
  p.rgT-=dt;
  const air=p.z>groundH(p.x,p.y,p.z)+0.05;
  if(air){const k=Math.exp(-(LAUNCH.airFr-6)*dt);p.vx*=k;p.vy*=k;}   // undo most of the ground friction applied later this tick
  if(p.rgT<=0){p.rgT=0;p.rgSrc=null;}
}
// after collideWorld: flying body hit something solid
function launchWall(p,sol0,svx,svy){
  if(!(p.rgT>0)||(p.solN|0)===sol0)return;
  const sp=Math.hypot(svx,svy);if(sp<LAUNCH.wallSp)return;
  p.vx*=0.2;p.vy*=0.2;
  emit({k:'rgwall',id:p.id,x:Math.round(p.x),y:Math.round(p.y),h:p.z+1,sp:Math.round(sp)});
  launchWallHit(p,sp);
}
// future: wall breaks / extra damage on impact (user plan) — no gameplay effect yet
function launchWallHit(p,sp){}
