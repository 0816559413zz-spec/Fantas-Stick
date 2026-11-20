// =====================================================================
//  FCS room pieces (rule: guides/MAP-ROOMS.md — user 2026-11-20: every room/courtyard is a separate piece that can be
//  restyled, moved or swapped alone). One piece = one file js/02-room-<id>.js calling fcsRoomAdd({...}).
//  def: {id, name, rect:[x0,y0,x1,y1] Map Editor cells (inclusive, includes the piece's own shell walls),
//        doors:[{side:'N'|'S'|'E'|'W', at:px from rect origin along the side, w:px, kind:'door'|'bw'|'open'}],
//        gen(K) gameplay (collision obs / floors / ceilings, LOCAL px u,v from the rect corner), view(K) look only}
//  The piece owns its rect: Map Editor wall cells inside are cut, crates/pillars/trees inside dropped; cores, spawns,
//  breakable walls and gates stay (gameplay objects of the mode). gen runs on every machine (deterministic, no random
//  without a fixed seed). Changing gen = collision change = bump PREFIX (js/10-net.js); view-only changes need no bump.
// =====================================================================
const FCS_ROOMS=[];
function fcsRoomAdd(def){FCS_ROOMS.push(def);return def;}
const FCS_C0=90;   // = FCS_C (cell px); rooms load before js/02-fcs.js
function fcsRoomOf(cx,cy){for(const r of FCS_ROOMS){const [a,b,c,d]=r.rect;if(cx>=a&&cx<=c&&cy>=b&&cy<=d)return r;}return null;}
function fcsCut(cx,cy){return !!fcsRoomOf(cx,cy);}
// ---- gen context (called from genFcs) ----
function fcsRoomK(r,obs,terr,props){
  const C=FCS_C0,[a,b,c,d]=r.rect,ox=a*C,oy=b*C,T=terr,g=T.g,nx=T.nx,ny=T.ny,cn=T.c;
  const K={r,C,ox,oy,w:(c+1-a)*C,h:(d+1-b)*C,obs,terr,props,data:{walls:[],cols:[],floors:[],ceil:[],boxes:[]},
    X:u=>ox+u,Y:v=>oy+v,
    gN:(i,j)=>g[clamp(j,0,ny-1)*nx+clamp(i,0,nx-1)],
    g0:0};
  K.g0=K.gN(Math.round((ox+K.w/2)/cn),Math.round((oy+K.h/2)/cn));
  r.data=K.data;r.K=K;return K;
}
// straight axis-aligned wall u1,v1 -> u2,v2 (local px, centre line), thickness th, height h (m), gaps [[from,to],...] along the wall
function roomWall(K,u1,v1,u2,v2,th,h,gaps){
  gaps=gaps||[];const along=v1===v2,L=Math.abs(along?u2-u1:v2-v1),s0=Math.min(along?u1:v1,along?u2:v2),r=th/2,step=Math.max(8,r*0.9);
  for(let t=0;t<=L+0.1;t+=step){const a=s0+Math.min(t,L);if(gaps.some(([p,q])=>a>p-r*0.6&&a<q+r*0.6))continue;
    const u=along?a:u1,v=along?v1:a;K.obs.push({x:K.X(u),y:K.Y(v),r,k:'fcm',hgt:h,s:0});}
  // lintel over each gap ([from,to,lintelH]): floating collision so flyers can't pass the wall above a door
  for(const [p,q,lh] of gaps)if(lh!=null&&lh<h)for(let a=p;a<=q+0.1;a+=step){const u=along?a:u1,v=along?v1:a;K.obs.push({x:K.X(u),y:K.Y(v),r,k:'fcm',hgt:h,bot:lh,s:0});}
  K.data.walls.push({u1,v1,u2,v2,th,h,gaps});
}
// column / post (local px) r px, height h, optional bot (floating: only blocks above bot)
function roomCol(K,u,v,r,h,bot,tag){const o={x:K.X(u),y:K.Y(v),r,k:'fcm',hgt:h,s:0};if(bot!=null)o.bot=bot;K.obs.push(o);K.data.cols.push({u,v,r,h,bot,tag});}
// walkable floor over node-aligned local rect (u0..u1, v0..v1 multiples of the 45 px lattice): top(u,v) in m above ground, NaN = none
function roomFloor(K,u0,v0,u1,v1,top,tag){
  const cn=K.terr.c,i0=Math.round(K.X(u0)/cn),j0=Math.round(K.Y(v0)/cn),NI=Math.round((u1-u0)/cn)+1,NJ=Math.round((v1-v0)/cn)+1,tp=new Float32Array(NI*NJ),bt=new Float32Array(NI*NJ);
  for(let j=0;j<NJ;j++)for(let i=0;i<NI;i++){const gr=K.gN(i0+i,j0+j),t=top(u0+i*cn,v0+j*cn);tp[j*NI+i]=gr+t;bt[j*NI+i]=gr+Math.max(-0.05,t-0.6);}
  K.terr.fl.push({x0:i0*cn,y0:j0*cn,nx:NI,ny:NJ,top:tp,bot:bt,k:'room'});K.data.floors.push({u0,v0,u1,v1,tag});
}
// ceiling: players / camera inside the local rect with feet below zmax are capped at h (m above ground)
function roomCeil(K,u0,v0,u1,v1,h,zmax){K.data.ceil.push({x0:K.X(u0),y0:K.Y(v0),x1:K.X(u1),y1:K.Y(v1),h,zmax:zmax==null?Infinity:zmax});}
// lowest ceiling over (x,y) px for feet height z (m above ground) on the FCS map; Infinity = open sky
function fcsCeilAt(x,y,z){
  if(MAPID!=='fcs')return Infinity;let c=Infinity;
  for(const r of FCS_ROOMS){const D=r.data;if(!D)continue;for(const q of D.ceil)if(x>=q.x0&&x<=q.x1&&y>=q.y0&&y<=q.y1&&(z||0)<q.zmax&&q.h<c)c=q.h;}
  return c;
}
// after each player update (host): flyers / jumpers / lifted bodies stay under room ceilings
function fcsCeilClamp(p){if(MAPID!=='fcs'||!FCS_ROOMS.length)return;const c=fcsCeilAt(p.x,p.y,p.z||0);if(c<Infinity&&(p.z||0)+1.9>c){p.z=Math.max(0,c-1.9);if(p.vz>0)p.vz=0;}}
