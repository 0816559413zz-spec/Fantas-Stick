// ---------- Breakable panels (แผ่นพัง) — Map Builder pn_wall → data.pnl (guides/Destruction.md §13) ----------
// Panel = a slab cut into a grid of cells (cell size cs m). Each cell has its own HP. Shared state for host + clients; host applies damage.
// Modes (d.m): 'g' gone = one HP pool, the whole panel shatters at once • 'p' pile = cells break into holes, rubble heap at the base
//   'l' layer = crack → outer skin falls off (still solid) → through (thru:0 = never through, damage only); also leaves rubble
// Cell stage st: 0 ok • 1 cracked • 2 outer skin gone (layer) • 3 broken (hole). Panels with the same group g support each other:
//   a cell stays up while connected (through unbroken cells) to a grounded cell; cut off = falls (el 'fall').
// Data (px = sim px, 20 px = 1 m): {x,y px = middle of the base edge, a angle (length axis = (cos a, sin a)), L len px, T thick px, z0 base m, H height m (along the slab),
//   tl tilt rad (0 = upright wall; roofs lean the slab about its length axis), sh 'tri' = gable triangle (cells above the slopes do not exist),
//   ho openings [[u0,u1,z0,z1] m from the left end, up to 4] (cells inside do not exist, the shader cuts the exact edge), cs cell m, hp, mat, m, thru, g, nb unbreakable}
// 3D frame (z in px too): U along the length • W up the slab = cos(tl)·Z + sin(tl)·N0 • V slab normal = cos(tl)·N0 − sin(tl)·Z • N0 = (−sin a, cos a, 0)
// Old houses (OBS k:'house') are rebuilt as panel groups at map load (pnlHouseConv) — js/12-buildings BLDG stays empty.
// snapshot PN = panels joined by '|' ('' = untouched), 3 cells per char (2 bits each) • events {k:'pn',e:'h'|'b',i,c,el,x,y,h,ox,oy} (c -1 = whole panel)
const PNDEF={mat:{brick:{hp:60,col:'#b0603c'},plaster:{hp:50,col:'#cfc6b4'},stone:{hp:90,col:'#9a9488'},wood:{hp:35,col:'#8a6440',burn:1},glass:{hp:12,col:'#bfe4f0'},metal:{hp:120,col:'#7c8288'},
  roof:{hp:40,col:'#4a4e58'},snowroof:{hp:40,col:'#e8eef4'},timber:{hp:45,col:'#d8ccb4',burn:1},litwin:{hp:10,col:'#ffcf80'}},
  crack:0.65,outer:0.4,splash:0.25,burn:5,dps:6,pile:{k:0.25,max:0.9,sp:26}};
const PN_BODY=1.75;   // body height that must fit through a hole (players duck a little)
const PN_CH='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
let PNL=[],PNG=[];
const pnGT=(x,y)=>TERR?terrT(x,y):0;
const sgPnl=()=>sgGrid('pn',PNL,p=>p.bb);
const _sgPN=[],_sgPN2=[],_sgPN3=[];
function pnlGen(id){
  const M=MAPS[id],L=((M&&M.pnl)||[]).concat((M&&M.pnH)||[]);
  PNL=L.map((d,i)=>{const cs=d.cs||1,one=d.nb&&!(d.ho&&d.ho.length),nc=one?1:Math.max(1,Math.round(d.L/20/cs)),nr=one?1:Math.max(1,Math.round(d.H/cs)),n=nc*nr,Md=PNDEF.mat[d.mat]||PNDEF.mat.brick,mx=d.hp||Md.hp,a=d.a||0,tl=d.tl||0;
    const c=Math.cos(a),s=Math.sin(a),ct=Math.cos(tl),stl=Math.sin(tl),zb=pnGT(d.x,d.y)+(d.z0||0),hl=d.L/2,Hp=d.H*20;
    const p={i,d,x:d.x,y:d.y,a,c,s,tl,W:[-s*stl,c*stl,ct],V:[-s*ct,c*ct,-stl],hl,ht:Math.max(1.5,(d.T||6)/2),zb,H:d.H,Hp,nc,nr,cw:d.L/nc,chp:Hp/nr,chh:d.H/nr,tri:d.sh==='tri',
      mode:d.m||'p',thru:d.thru!==0,nb:!!d.nb,mat:d.mat||'brick',g:d.g,max:mx,hp:new Float32Array(n).fill(mx),st:new Uint8Array(n),ex:new Uint8Array(n).fill(1),burnT:0,t:0,ver:1,ph:null,phv:0};
    if(p.tri)for(let k=0;k<n;k++){const u=Math.abs(pnCU(p,k%nc)),w=(((k/nc)|0)+0.5)*p.chp;if(w>Hp*(1-u/hl)+p.chp*0.25)p.ex[k]=0;}
    if(d.ho)for(let k=0;k<n;k++){const u=(pnCU(p,k%nc)+hl)/20,z=(((k/nc)|0)+0.5)*p.chh;if(d.ho.some(q=>u>q[0]&&u<q[1]&&z>q[2]&&z<q[3]))p.ex[k]=0;}   // openings (door / windows)
    const ex=hl+p.ht+Math.abs(p.W[0])*Hp+Math.abs(p.W[1])*Hp;p.bb=[d.x-ex,d.y-ex,d.x+ex,d.y+ex];
    return p;});
  PNL._id=id;pnlLinks();return PNL;
}
const pnLoc=(p,x,y)=>{const dx=x-p.x,dy=y-p.y;return [dx*p.c+dy*p.s,-dx*p.s+dy*p.c];};   // horizontal (upright panels)
const pnWorld=(p,u,v)=>[p.x+u*p.c-v*p.s,p.y+u*p.s+v*p.c];
const pnCU=(p,col)=>-p.hl+(col+0.5)*p.cw;
// local (u, w, v) of a world point (x,y px, za m)
function pnL3(p,x,y,za){const dx=x-p.x,dy=y-p.y,dz=(za-p.zb)*20;return [dx*p.c+dy*p.s,dx*p.W[0]+dy*p.W[1]+dz*p.W[2],dx*p.V[0]+dy*p.V[1]+dz*p.V[2]];}
// world point of local (u, w) on the mid plane → [x, y, za m]
function pnP3(p,u,w){return [p.x+u*p.c+w*p.W[0],p.y+u*p.s+w*p.W[1],p.zb+w*p.W[2]/20];}
function pnCellPos(p,k){return pnP3(p,pnCU(p,k%p.nc),((((k/p.nc)|0))+0.5)*p.chp);}
function pnCellUW(p,u,w){const col=Math.floor((u+p.hl)/p.cw),r=Math.floor(w/p.chp);return col<0||col>=p.nc||r<0||r>=p.nr?-1:r*p.nc+col;}
const pnSolid=(p,k)=>k>=0&&p.ex[k]&&p.st[k]<3;
function pnMark(p){p.ver++;}
// support graph: cells of one group (or one ungrouped panel) • neighbours = 4-way inside a panel + touching cells of other panels in the group (3D cell-centre distance)
function pnlLinks(){
  PNG=[];const by=new Map();
  for(const p of PNL){const k=p.g!=null&&p.g!==''?'g'+p.g:'p'+p.i;if(!by.has(k)){by.set(k,PNG.length);PNG.push({ps:[]});}p.gi=by.get(k);PNG[p.gi].ps.push(p);}
  for(const G2 of PNG){let n=0;for(const p of G2.ps){p.base=n;n+=p.st.length;}
    const nb=Array.from({length:n},()=>[]),gr=new Uint8Array(n),cells=[],C=new Float32Array(n*3);
    for(const p of G2.ps)for(let k=0;k<p.st.length;k++){const col=k%p.nc,r=(k/p.nc)|0,id=p.base+k,q=pnCellPos(p,k);cells.push([p,k]);C[id*3]=q[0];C[id*3+1]=q[1];C[id*3+2]=q[2]*20;
      if(!p.ex[k])continue;
      if(col>0&&p.ex[k-1])nb[id].push(id-1);if(col<p.nc-1&&p.ex[k+1])nb[id].push(id+1);if(r>0&&p.ex[k-p.nc])nb[id].push(id-p.nc);if(r<p.nr-1&&p.ex[k+p.nc])nb[id].push(id+p.nc);
      if(r===0&&p.zb-pnGT(q[0],q[1])<0.35)gr[id]=1;}
    const P=G2.ps;
    for(let a=0;a<P.length;a++)for(let b=a+1;b<P.length;b++){const A=P[a],B=P[b];
      if(A.bb[0]>B.bb[2]+20||B.bb[0]>A.bb[2]+20||A.bb[1]>B.bb[3]+20||B.bb[1]>A.bb[3]+20)continue;
      const lim=(Math.max(A.cw,A.chp)+Math.max(B.cw,B.chp))/2+A.ht+B.ht+4;
      for(let i=A.base;i<A.base+A.st.length;i++){if(!A.ex[i-A.base])continue;
        for(let j=B.base;j<B.base+B.st.length;j++){if(!B.ex[j-B.base])continue;const dx=C[i*3]-C[j*3],dy=C[i*3+1]-C[j*3+1],dz=C[i*3+2]-C[j*3+2];
          if(dx*dx+dy*dy+dz*dz<lim*lim){nb[i].push(j);nb[j].push(i);}}}}
    Object.assign(G2,{n,nb,gr,cells});}
}
function pnlSupport(p){
  const G2=PNG[p.gi];if(!G2)return;const {n,nb,gr,cells}=G2,seen=new Uint8Array(n),q=[];
  const alive=id=>{const [pp,k]=cells[id];return pnSolid(pp,k);};
  for(let i=0;i<n;i++)if(gr[i]&&alive(i)){seen[i]=1;q.push(i);}
  while(q.length){const i=q.pop();for(const j of nb[i])if(!seen[j]&&alive(j)){seen[j]=1;q.push(j);}}
  const hitP=new Set();
  for(let i=0;i<n;i++)if(!seen[i]&&alive(i)){const [pp,k]=cells[i];if(pp.mode==='g'){if(!hitP.has(pp)){hitP.add(pp);pnBreakAll(pp,'fall');}continue;}pp.st[k]=3;pp.hp[k]=0;pnMark(pp);pnEmit(pp,k,'b','fall');}
}
function pnEmit(p,k,e,el,ox,oy){
  let q=k>=0?pnCellPos(p,k):pnP3(p,0,p.Hp/2),x=q[0],y=q[1],h=q[2]-pnGT(x,y);x=Math.round(x);y=Math.round(y);
  emit(Object.assign({k:'pn',e,i:p.i,c:k,el:el||'none',x,y,h:Math.round(h*10)/10},e==='b'?{ox:Math.round(ox==null?x:ox),oy:Math.round(oy==null?y:oy)}:{}));
}
function pnBreakAll(p,el,ox,oy){for(let k=0;k<p.st.length;k++){p.st[k]=3;p.hp[k]=0;}pnMark(p);pnEmit(p,-1,'b',el,ox,oy);}
function pnStage(p,k){const f=p.hp[k]/p.max,L=p.mode==='l';if(f<=0)return L&&!p.thru?2:3;if(L&&f<PNDEF.outer)return 2;return f<PNDEF.crack?1:0;}
// damage one cell (host) • splash = part of the hit spreads to the 4 neighbours (organic holes)
function pnlHit(p,k,dmg,el,ox,oy,noSplash){
  if(!BLDON||!p||p.nb||k<0||k>=p.st.length||!pnSolid(p,k))return;el=el||'none';
  const M=PNDEF.mat[p.mat]||PNDEF.mat.brick;let m=el.includes('blast')?1.5:el==='ice'?0.7:1;if(p.mat==='glass'||p.mat==='litwin')m*=1.5;
  if(el.includes('fire')&&M.burn)p.burnT=PNDEF.burn;
  if(p.mode==='g'){p.hp[0]-=dmg*m;
    if(p.hp[0]<=0){pnBreakAll(p,el,ox,oy);pnlSupport(p);return;}
    if(p.hp[0]/p.max<PNDEF.crack&&p.st[0]<1){p.st.fill(1);pnMark(p);}
    pnHitFx(p,k,el);return;}
  pnDmgCell(p,k,dmg*m,el,ox,oy);
  if(!noSplash){const col=k%p.nc,r=(k/p.nc)|0,s=dmg*m*PNDEF.splash;
    if(col>0)pnDmgCell(p,k-1,s,el,ox,oy);if(col<p.nc-1)pnDmgCell(p,k+1,s,el,ox,oy);if(r>0)pnDmgCell(p,k-p.nc,s,el,ox,oy);if(r<p.nr-1)pnDmgCell(p,k+p.nc,s,el,ox,oy);}
  if(p.sup){p.sup=0;pnlSupport(p);}
  pnHitFx(p,k,el);
}
function pnDmgCell(p,k,d,el,ox,oy){
  if(!pnSolid(p,k))return;p.hp[k]=Math.max(p.mode==='l'&&!p.thru?0:-1,p.hp[k]-d);
  const s=Math.max(p.st[k],pnStage(p,k));if(s===p.st[k])return;p.st[k]=s;pnMark(p);
  if(s===3){pnEmit(p,k,'b',el,ox,oy);p.sup=1;}
}
function pnHitFx(p,k,el){if(G.time-p.t>0.12){p.t=G.time;pnEmit(p,k,'h',el);}}
// explosion / strong skill (damageEnv): every cell inside the radius (3D distance to the cell box), falloff to 30% at the edge
function pnlEnv(x,y,rad,dmg,el,h){
  if(!BLDON||!PNL.length)return;const za=(h||0)+pnGT(x,y),R=rad/20;
  for(const p of sgNear(sgPnl(),x,y,rad,_sgPN)){if(p.nb)continue;const [u,w,v]=pnL3(p,x,y,za),dv=Math.max(0,Math.abs(v)-p.ht)/20;if(dv>R||Math.abs(u)>p.hl+rad)continue;
    if(p.mode==='g'){const du=Math.max(0,Math.abs(u)-p.hl)/20,dw=Math.max(0,-w,w-p.Hp)/20,d=Math.hypot(du,dv,dw);if(d<R)pnlHit(p,0,dmg*(1-0.7*d/R),el,x,y);continue;}
    const hits=[];
    for(let col=0;col<p.nc;col++){const du=Math.max(0,Math.abs(u-pnCU(p,col))-p.cw/2)/20;if(du>R)continue;
      for(let r=0;r<p.nr;r++){const k=r*p.nc+col;if(!pnSolid(p,k))continue;const w0=r*p.chp,dw=Math.max(0,w0-w,w-w0-p.chp)/20,d=Math.hypot(du,dv,dw);if(d<R)hits.push([k,dmg*(1-0.7*d/R)]);}}
    for(const [k,dd] of hits)pnlHit(p,k,dd,el,x,y,true);}
}
// first solid cell crossed by the 3D segment (za = absolute height m) • {p,k,t} or null
function pnSeg(p,x0,y0,z0,x1,y1,z1){
  const A=pnL3(p,x0,y0,z0),B=pnL3(p,x1,y1,z1),ht=p.ht,v0=A[2],v1=B[2];
  if((v0>ht&&v1>ht)||(v0<-ht&&v1<-ht))return null;
  const dv=v1-v0,ta=Math.abs(v0)<=ht?0:clamp(((v0>0?ht:-ht)-v0)/dv,0,1),tb=Math.abs(v1)<=ht?1:clamp(((v1>0?ht:-ht)-v0)/dv,0,1);
  for(const t of [ta,(ta+tb)/2,tb]){const k=pnCellUW(p,A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t);if(pnSolid(p,k))return {p,k,t};}
  return null;
}
function pnlRay(x0,y0,h0,x1,y1,h1){
  if(!PNL.length)return null;const L=Math.hypot(x1-x0,y1-y0),z0=h0+pnGT(x0,y0),z1=h1+pnGT(x1,y1);let best=null;
  for(const p of sgNear(sgPnl(),(x0+x1)/2,(y0+y1)/2,L/2+10,_sgPN2)){const q=pnSeg(p,x0,y0,z0,x1,y1,z1);if(q&&(!best||q.t<best.t))best=q;}
  if(!best)return null;const t=best.t,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t;return {x,y,h:z0+(z1-z0)*t-pnGT(x,y),t,p:best.p,k:best.k};
}
function pnlSolidAt(x,y,h){if(!PNL.length)return false;const za=h+pnGT(x,y);
  for(const p of sgNear(sgPnl(),x,y,0,_sgPN2)){const [u,w,v]=pnL3(p,x,y,za);if(Math.abs(v)>p.ht||Math.abs(u)>p.hl)continue;if(pnSolid(p,pnCellUW(p,u,w)))return true;}return false;}
// projectile step (host): stops at the first solid cell crossed this frame and damages it
function pnlProj(pr,dt){
  if(!PNL.length)return false;const x0=pr.x-pr.vx*dt,y0=pr.y-pr.vy*dt,q=pnlRay(x0,y0,pr.h-pr.vh*dt,pr.x,pr.y,pr.h);if(!q)return false;
  pr.x=q.x;pr.y=q.y;pr.h=Math.max(0.1,q.h);pnlHit(q.p,q.k,pr.dmg||5,projEl(pr),x0,y0);return true;
}
// walking: upright panels = columns that block the body (feet z → head z+PN_BODY) merge into runs → pushed out like house walls
//   sloped panels (roofs) = body samples inside a solid cell are pushed out along the slab normal (horizontal part)
function pnlCollide(o,r,z){
  if(!PNL.length)return 0;let n=0;const za=z+pnGT(o.x,o.y);
  for(const p of sgNear(sgPnl(),o.x,o.y,r,_sgPN)){
    if(p.tl){const vh=Math.hypot(p.V[0],p.V[1]);if(vh<0.25)continue;
      for(const hz of [0.2,0.95,PN_BODY-0.1]){const [u,w,v]=pnL3(p,o.x,o.y,za+hz),pen=p.ht+r-Math.abs(v);if(pen<=0||!pnSolid(p,pnCellUW(p,u,w)))continue;
        const sg=v<0?-1:1,k=pen/vh;o.x+=sg*p.V[0]/vh*k;o.y+=sg*p.V[1]/vh*k;n++;break;}
      continue;}
    let [u,v]=pnLoc(p,o.x,o.y);if(Math.abs(v)>p.ht+r||Math.abs(u)>p.hl+r)continue;
    if(za>=p.zb+p.H-0.45||za+PN_BODY<=p.zb)continue;   // low wall top: step over
    const r0=clamp(Math.floor((za-p.zb)/p.chh),0,p.nr-1),r1=clamp(Math.floor((za+PN_BODY-p.zb)/p.chh),0,p.nr-1);let run=-1,moved=false;
    for(let c=0;c<=p.nc;c++){let bl=false;if(c<p.nc)for(let rr=r0;rr<=r1;rr++)if(pnSolid(p,rr*p.nc+c)){bl=true;break;}
      if(bl&&run<0)run=c;
      if(!bl&&run>=0){const a=-p.hl+run*p.cw,b=-p.hl+c*p.cw,q=bldPush(u,v,[(a+b)/2,0,(b-a)/2,p.ht],r);if(q){u=q[0];v=q[1];moved=true;}run=-1;}}
    if(moved){[o.x,o.y]=pnWorld(p,u,v);n++;}}
  return n;
}
// rubble heap at the foot of broken cells (upright panels, modes p/l): extra ground height (walk up, low cover) • column height from broken cells above it
function pnPileCols(p){if(p.phv===p.ver)return p.ph;p.phv=p.ver;if(p.d.np)return p.ph=null;   // np = breaks without a rubble heap
  const ph=new Float32Array(p.nc);let any=false;
  if(p.mode!=='g'&&!p.tl)for(let c=0;c<p.nc;c++){let nb=0;for(let r=0;r<p.nr;r++)if(p.ex[r*p.nc+c]&&p.st[r*p.nc+c]>=3)nb++;if(nb){any=true;ph[c]=Math.min(PNDEF.pile.max,PNDEF.pile.k*nb*p.chh);}}
  return p.ph=any?ph:null;}
function pnPileAt(p,x,y){const ph=pnPileCols(p);if(!ph)return 0;const [u,v]=pnLoc(p,x,y),S=PNDEF.pile.sp,w=Math.max(0,Math.abs(v)-p.ht)/S;if(w>=1)return 0;
  const f=clamp((u+p.hl)/p.cw-0.5,0,p.nc-1),i=Math.floor(f),t=f-i,hc=ph[i]+(ph[Math.min(p.nc-1,i+1)]-ph[i])*t,eu=Math.max(0,Math.abs(u)-p.hl)/S;if(eu>=1)return 0;
  const sm=e=>1-e*e*(3-2*e),av=Math.abs(v),mid=av<p.ht?0.55+0.45*av/p.ht:1;return hc*mid*sm(w)*sm(eu);}   // lower right under the wall line (holes stay passable)
// standing on top of an upright panel (wall top, or a solid cell under a hole): height above terrain, only tops at/below z+0.5 (jump up onto it)
// tilted panels (roofs) and lying panels (floors, tl 90°): the upper face over a solid cell is ground → break the cell = fall through
function pnlTopH(x,y,z){if(!PNL.length)return 0;const t=pnGT(x,y),a=t+(z||0)+0.5;let g=0;
  for(const p of sgNear(sgPnl(),x,y,0,_sgPN3)){
    if(p.tl){const V2=p.V[2];if(Math.abs(V2)<0.34)continue;   // steeper than ~70°: no footing
      const top=p.zb+((V2>0?p.ht:-p.ht)-(x-p.x)*p.V[0]-(y-p.y)*p.V[1])/(V2*20);   // upper face height on this vertical line (m)
      if(top>a||top-t<=g)continue;const [u,w]=pnL3(p,x,y,top);if(Math.abs(u)>p.hl)continue;
      if(pnSolid(p,pnCellUW(p,u,w)))g=top-t;continue;}const [u,v]=pnLoc(p,x,y);if(Math.abs(v)>p.ht+2||Math.abs(u)>p.hl)continue;
    const col=clamp(Math.floor((u+p.hl)/p.cw),0,p.nc-1);
    for(let r=p.nr-1;r>=0;r--){const k=r*p.nc+col;if(!pnSolid(p,k)||(r+1<p.nr&&pnSolid(p,k+p.nc)))continue;const top=p.zb+(r+1)*p.chh;if(top<=a){if(top-t>g)g=top-t;break;}}}
  return g;}
function pnlMoundH(x,y){if(!PNL.length)return 0;let g=0;for(const p of sgNear(sgPnl(),x,y,PNDEF.pile.sp,_sgPN2)){const h=pnPileAt(p,x,y);if(h>g)g=h;}return g;}
// burning wood (host)
function pnlTick(dt){
  if(!BLDON)return;
  for(const p of PNL){if(p.burnT<=0)continue;p.burnT-=dt;const d=PNDEF.dps*dt;
    if(p.mode==='g'){if(!pnSolid(p,0)){p.burnT=0;continue;}p.hp[0]-=d;if(p.hp[0]<=0){p.burnT=0;pnBreakAll(p,'fire');pnlSupport(p);}continue;}   // broken burning door: stop (was re-breaking every tick = endless shake)
    for(let k=0;k<p.st.length;k++)pnDmgCell(p,k,d,'fire');if(p.sup){p.sup=0;pnlSupport(p);}}
}
function pnlSnap(){
  if(!PNL.length)return '';let any=false;
  const s=PNL.map(p=>{if(!p.st.some(v=>v))return '';any=true;let o='';for(let k=0;k<p.st.length;k+=3)o+=PN_CH[p.st[k]|(p.st[k+1]|0)<<2|(p.st[k+2]|0)<<4];return o;}).join('|');
  return any?s:'';
}
function pnlParse(s){
  const H=(s||'').split('|');
  PNL.forEach((p,i)=>{const t=H[i]||'';let ch=false;
    for(let k=0;k<p.st.length;k++){const v=t?(PN_CH.indexOf(t[(k/3)|0])>>((k%3)*2))&3:0;if(v!==p.st[k]){p.st[k]=v;ch=true;}}
    if(ch)pnMark(p);});
}
// ---------- old houses → panel groups (same footprint as BLDDEF: walls wh m, gable roof rise rh m, door on the front +y side) ----------
// snow house (default) = plaster over brick walls (skin falls off), snowy slate roof, lit windows • London (bt 'ldn') = brick walls, slate roof
// Mirror: mapbuild/model.js pnHouse (Map Builder "แตกเป็นแผ่นพัง") — keep the two in step.
const PN_HOUSE={wh:4.2,rh:3.4,ov:0.45,T:0.3,cs:0.7,rcs:0.8,door:{w:2.2,h:2.7},win:{w:1.2,h:1.2,sill:1.1}};
function pnHouse(h,gid){
  const H=PN_HOUSE,ldn=h.bt==='ldn',w=h.w/20,d=h.d/20,ry=h.ry||0,c=Math.cos(ry),s=Math.sin(ry),hb=pnGT(h.x,h.y),out=[];
  const wall=ldn?{mat:'brick',m:'p'}:{mat:'plaster',m:'l'},roof={mat:ldn?'roof':'snowroof',m:'p'},nb=h.nb?{nb:1}:{};
  // local (lx,ly m, house frame: front = +ly) → world px
  const W=(lx,ly)=>[h.x+(lx*c+ly*s)*20,h.y+(-lx*s+ly*c)*20];
  const put=(lx,ly,ang,L,z0,Hh,o)=>{const [x,y]=W(lx,ly);out.push(Object.assign({x:Math.round(x*10)/10,y:Math.round(y*10)/10,a:+ang.toFixed(4),L:Math.round(L*200)/10,T:H.T*20,z0:+(hb+z0-pnGT(x,y)).toFixed(3),H:+Hh.toFixed(3),cs:H.cs,g:gid},wall,nb,o||{}));};
  const aX=Math.atan2(-s,c),aY=Math.atan2(c,s);   // length along local x / along local y
  // wall with openings (holes = [u0,u1,z0,z1] along the wall from its left end) → strips; windows get a lit glass pane
  // one panel per wall, openings = holes `ho` [u0,u1,z0,z1] (m from the left end); windows get a lit glass pane
  const holed=(lx,ly,ang,ux,uy,L,holes)=>{
    const at=u=>[lx+ux*(u-L/2),ly+uy*(u-L/2)];put(lx,ly,ang,L,0,H.wh,{ho:holes.map(q=>q.slice(0,4).map(v=>+v.toFixed(3)))});
    for(const [u0,u1,z0,z1,glass] of holes)if(glass){const [a,b]=at((u0+u1)/2);put(a,b,ang,u1-u0+0.1,z0-0.05,z1-z0+0.1,{mat:'litwin',m:'g',T:2,cs:9});}};
  const Wn=H.win,win=u=>[u-Wn.w/2,u+Wn.w/2,Wn.sill,Wn.sill+Wn.h,1];
  // front (+y, door in the middle, a window each side) and back (two windows)
  const Lf=w+H.T;
  holed(0,d/2,aX,1,0,Lf,[win(Lf*0.22),[Lf/2-H.door.w/2,Lf/2+H.door.w/2,0,H.door.h,0],win(Lf*0.78)]);
  holed(0,-d/2,aX,1,0,Lf,[win(Lf*0.3),win(Lf*0.7)]);
  // sides (one window each)
  for(const sx of [-1,1])holed(sx*w/2,0,aY,0,1,d-H.T,[win((d-H.T)/2)]);
  // gable triangles over the front/back walls
  for(const sy of [-1,1])put(0,sy*d/2,aX,Lf,H.wh,H.rh,{sh:'tri'});
  // roof halves: base on the eave (wall top, overhang ov), slab leaning in to the ridge along local y
  const run=w/2+H.ov,len=Math.hypot(run,H.rh+H.ov*H.rh/(w/2)),tl=Math.atan2(run,H.rh+H.ov*H.rh/(w/2));
  for(const sx of [-1,1]){const [x,y]=W(sx*(w/2+H.ov),0);
    out.push(Object.assign({x:Math.round(x*10)/10,y:Math.round(y*10)/10,a:+aY.toFixed(4),L:Math.round((d+2*H.ov)*200)/10,T:0.25*20,z0:+(hb+H.wh-H.ov*H.rh/(w/2)-pnGT(x,y)).toFixed(3),H:+len.toFixed(3),tl:+(sx<0?-tl:tl).toFixed(4),cs:H.rcs,g:gid},roof,nb));}
  return out;
}
// map load: OBS k:'house' → M.pnH panels (once per map; house circles leave OBS so the old system stays off)
function pnlHouseConv(id){
  const M=MAPS[id];if(!M||M.pnHd)return;M.pnHd=1;const hs=(M.obs||[]).filter(o=>o.k==='house');if(!hs.length)return;
  const keep=TERR;TERR=M.terr||null;M.pnH=hs.flatMap((h,i)=>pnHouse(h,'H'+i));M.pnHB=hs;TERR=keep;M.obs=M.obs.filter(o=>o.k!=='house');
}
