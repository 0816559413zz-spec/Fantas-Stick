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
function fcsRoomK(r,obs,terr,props,brkX){
  const C=FCS_C0,[a,b,c,d]=r.rect,ox=a*C,oy=b*C,T=terr,g=T.g,nx=T.nx,ny=T.ny,cn=T.c;
  const K={r,C,ox,oy,w:(c+1-a)*C,h:(d+1-b)*C,obs,terr,props,brkX,data:{walls:[],cols:[],floors:[],ceil:[],boxes:[],props:[]},
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
  if(MAPID!=='fcs'){const L=MAPS[MAPID]&&MAPS[MAPID].ceil;if(!L)return Infinity;let c=Infinity;   // Map Builder ceilings (regFileMap)
    for(const q of L)if(x>=q.x0&&x<=q.x1&&y>=q.y0&&y<=q.y1&&(z||0)<q.zmax&&q.h<c)c=q.h;return c;}
  let c=Infinity;
  for(const r of FCS_ROOMS){const D=r.data;if(!D)continue;for(const q of D.ceil)if(x>=q.x0&&x<=q.x1&&y>=q.y0&&y<=q.y1&&(z||0)<q.zmax&&q.h<c)c=q.h;}
  return c;
}
// after each player update (host): flyers / jumpers / lifted bodies stay under room ceilings
function fcsCeilClamp(p){if(MAPID==='fcs'?!FCS_ROOMS.length:!(MAPS[MAPID]&&MAPS[MAPID].ceil))return;const c=fcsCeilAt(p.x,p.y,p.z||0);if(c<Infinity&&(p.z||0)+1.9>c){p.z=Math.max(0,c-1.9);if(p.vz>0)p.vz=0;}}
// ---- breakable room props (user 2026-11-20): BRK groups (js/12-buildings.js) — snapshot BK syncs the stage
// furniture/decor: break = shatter into loose debris, no collision left (rub 0) • rail: break = low rubble, no collision • pillar: chips, stays (rub 1)
// col = collides before breaking (px radius, 0 = walk through) • h = height (m) • hp • m = BRK material (fx colour) • st = can stand on top
// mirror for the map editor: RPK in mapbuild/model.js (keep kinds + col/h in sync)
const RPK={
  table:{col:20,h:1.0,hp:120,m:'wood',st:1},hightable:{col:22,h:1.1,hp:200,m:'wood',st:1},bench:{col:0,h:0.5,hp:60,m:'wood'},chair:{col:0,h:1.05,hp:40,m:'wood'},
  throne:{col:16,h:2.2,hp:160,m:'wood'},crate:{col:22,h:1.2,hp:120,m:'wood',st:1},crate2:{col:22,h:2.35,hp:170,m:'wood'},barrel:{col:16,h:1.3,hp:100,m:'wood'},
  barrels:{col:30,h:1.3,hp:150,m:'wood'},sack:{col:0,h:0.6,hp:30,m:'wood'},rack:{col:0,h:2.0,hp:70,m:'wood'},armor:{col:14,h:2.1,hp:120,m:'stone'},
  shelf:{col:0,h:3.0,hp:100,m:'wood'},desk:{col:0,h:0.9,hp:60,m:'wood'},candle:{col:0,h:2.2,hp:40,m:'stone'},woodpile:{col:0,h:0.8,hp:60,m:'wood'},
  cart:{col:30,h:1.6,hp:180,m:'wood'},keg:{col:0,h:0.7,hp:40,m:'wood'},
  rail:{col:9,h:1.1,hp:150,m:'stone',rub:0},pillar:{col:26,h:24,hp:900,m:'stone',rub:1}};
// kind at local u,v • o: {L: length px along the axis (tables/rails), a: yaw (0 = along u), z0: base height (gallery), seed}
function roomProp(K,kind,u,v,o){
  o=o||{};const P=RPK[kind],i=K.brkX.length,z0=o.z0||0,a=o.a||0,L=o.L||0,ca=Math.cos(a),sa=Math.sin(a);
  K.brkX.push({h:P.h,vh:P.h,v:1,m:P.m,n:'room',rub:P.rub!=null?P.rub:0,hp:P.hp,z0,rp:K.r.id,pi:K.data.props.length});
  const pts=[];if(L>0)for(let t=-L/2;t<=L/2+0.1;t+=Math.max(14,(P.col||12)*0.9))pts.push([u+ca*t,v+sa*t]);else pts.push([u,v]);
  for(const [pu,pv] of pts){const ob={x:K.X(pu),y:K.Y(pv),r:Math.max(10,P.col||12),k:'fcm',b:i,s:0,hgt:P.col?P.h+(z0?z0:0):0};
    if(z0){ob.bot=z0-0.3;}if(P.st)ob.st=1;K.obs.push(ob);}
  K.data.props.push({kind,u,v,a,L,z0,b:i,seed:o.seed!=null?o.seed:K.data.props.length});
}
// Map Builder file maps (MAP-STANDARD round 3): data.rprops + data.sys.stonewall → one pseudo room in map coords (K = identity),
// so roomProp collision/BRK, fcsPropsBuild (look) and roomWallEnv (wall hit marks) work like on fcs. Called from regFileMap.
function roomsFromFile(M,d,id){
  const sw=(d.sys&&d.sys.stonewall)||[],rp=d.rprops||[];if(!sw.length&&!rp.length){M.rooms=null;return;}
  const off=((M.fm&&M.fm.brk)||[]).length;M.brkX=[];
  const r={id:'mb_'+id},K={r,C:FCS_C0,ox:0,oy:0,w:M.W,h:M.H,obs:M.obs,terr:M.terr,props:[],brkX:M.brkX,data:{walls:[],cols:[],floors:[],ceil:[],boxes:[],props:[]},X:u=>u,Y:v=>v,g0:0};
  r.data=K.data;r.K=K;
  for(const q of rp)if(RPK[q.k]){const n0=M.obs.length;roomProp(K,q.k,q.x,q.y,{a:q.a||0,L:q.L||0,z0:q.z0||0});const P=K.data.props[K.data.props.length-1];
    P.b+=off;for(let i=n0;i<M.obs.length;i++)M.obs[i].b=P.b;}   // global BRK index (file brk groups come first)
  for(const [x1,y1,x2,y2,th,h] of sw){const ax=Math.abs(y2-y1)<1;if(!ax&&Math.abs(x2-x1)>=1)continue;   // axis-aligned faces only (room walls)
    K.data.walls.push(ax?{u1:Math.min(x1,x2),v1:y1,u2:Math.max(x1,x2),v2:y1,th:th*20,h,gaps:[]}:{u1:x1,v1:Math.min(y1,y2),u2:x1,v2:Math.max(y1,y2),th:th*20,h,gaps:[]});}
  M.rooms=[r];
}
// room pieces of the current map: fcs code rooms or the file map pseudo room
function roomsCur(){return MAPID==='fcs'?FCS_ROOMS:((MAPS[MAPID]&&MAPS[MAPID].rooms)||[]);}
// skill hits on room walls (host, from damageEnv): no damage, just an event for debris fx + a scorch/crack mark on the face
const RWH={t:0};
function roomWallEnv(x,y,rad,h,el){
  const RL=roomsCur();if(!RL.length)return;const now=Date.now();if(now-RWH.t<70)return;h=h||0;
  for(const r of RL){const D=r.data,K=r.K;if(!D||x<K.ox-rad-60||y<K.oy-rad-60||x>K.ox+K.w+rad+60||y>K.oy+K.h+rad+60)continue;
    for(const w of D.walls){const along=w.v1===w.v2,u=x-K.ox,v=y-K.oy,s=along?u:v,s0=Math.min(along?w.u1:w.v1,along?w.u2:w.v2),s1=Math.max(along?w.u1:w.v1,along?w.u2:w.v2);
      if(s<s0||s>s1||w.gaps.some(q=>s>q[0]&&s<q[1]&&h<(q[2]==null?99:q[2])))continue;
      const d=(along?v-w.v1:u-w.u1),ad=Math.abs(d)-w.th/2;if(ad>rad*0.7||h>w.h)continue;
      const n=d>=0?1:-1,fx=along?x:K.X(w.u1)+n*w.th/2,fy=along?K.Y(w.v1)+n*w.th/2:y;
      RWH.t=now;emit({k:'rwh',x:Math.round(fx),y:Math.round(fy),h:Math.round(Math.max(0.6,Math.min(h||1.2,w.h-1))*10)/10,nx:along?0:n,ny:along?n:0,el:el||'',r:Math.round(Math.min(rad,80)),hh:2});return;}}
}
