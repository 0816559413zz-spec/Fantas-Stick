// ---------- Breakable panels (แผ่นพัง) — Map Builder pn_wall → data.pnl (guides/Destruction.md §13) ----------
// Panel = a wall slab cut into a grid of cells (cell size cs m). Each cell has its own HP. Shared state for host + clients; host applies damage.
// Modes (d.m): 'g' gone = one HP pool, the whole panel shatters at once • 'p' pile = cells break into holes, rubble heap at the base
//   'l' layer = crack → outer skin falls off (still solid) → through (thru:0 = never through, damage only); also leaves rubble
// Cell stage st: 0 ok • 1 cracked • 2 outer skin gone (layer) • 3 broken (hole). Panels with the same group g support each other:
//   a cell stays up while connected (through unbroken cells) to a grounded cell; cut off = falls (el 'fall').
// Data (px = sim px, 20 px = 1 m): {x,y center px, a angle (length axis = (cos a, sin a)), L len px, T thick px, z0 base m, H height m, cs cell m, hp, mat, m, thru, g}
// snapshot PN = panels joined by '|' ('' = untouched), 3 cells per char (2 bits each) • events {k:'pn',e:'h'|'b',i,c,el,x,y,h,ox,oy} (c -1 = whole panel)
const PNDEF={mat:{brick:{hp:60,col:'#b0603c'},plaster:{hp:50,col:'#cfc6b4'},stone:{hp:90,col:'#9a9488'},wood:{hp:35,col:'#8a6440',burn:1},glass:{hp:12,col:'#bfe4f0'},metal:{hp:120,col:'#7c8288'}},
  crack:0.65,outer:0.4,splash:0.25,burn:5,dps:6,pile:{k:0.25,max:0.9,sp:26}};
const PN_BODY=1.75;   // body height that must fit through a hole (players duck a little)
const PN_CH='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
let PNL=[],PNG=[];
const pnGT=(x,y)=>TERR?terrT(x,y):0;
const sgPnl=()=>sgGrid('pn',PNL,p=>{const e=p.hl+p.ht;return [p.x-e,p.y-e,p.x+e,p.y+e];});
const _sgPN=[],_sgPN2=[];
function pnlGen(id){
  const L=(MAPS[id]&&MAPS[id].pnl)||[];
  PNL=L.map((d,i)=>{const cs=d.cs||1,nc=Math.max(1,Math.round(d.L/20/cs)),nr=Math.max(1,Math.round(d.H/cs)),n=nc*nr,M=PNDEF.mat[d.mat]||PNDEF.mat.brick,mx=d.hp||M.hp,a=d.a||0;
    return {i,d,x:d.x,y:d.y,a,c:Math.cos(a),s:Math.sin(a),hl:d.L/2,ht:Math.max(2,(d.T||6)/2),zb:pnGT(d.x,d.y)+(d.z0||0),H:d.H,nc,nr,cw:d.L/nc,chh:d.H/nr,
      mode:d.m||'p',thru:d.thru!==0,mat:d.mat||'brick',g:d.g,max:mx,hp:new Float32Array(n).fill(mx),st:new Uint8Array(n),burnT:0,t:0,ver:1,ph:null,phv:0};});
  pnlLinks();return PNL;
}
const pnLoc=(p,x,y)=>{const dx=x-p.x,dy=y-p.y;return [dx*p.c+dy*p.s,-dx*p.s+dy*p.c];};
const pnWorld=(p,u,v)=>[p.x+u*p.c-v*p.s,p.y+u*p.s+v*p.c];
const pnCU=(p,col)=>-p.hl+(col+0.5)*p.cw;
function pnCell(p,u,za){const col=Math.floor((u+p.hl)/p.cw),r=Math.floor((za-p.zb)/p.chh);return col<0||col>=p.nc||r<0||r>=p.nr?-1:r*p.nc+col;}
function pnMark(p){p.ver++;}
// support graph: cells of one group (or one ungrouped panel) • neighbours = 4-way inside a panel + touching cells of other panels in the group
function pnSegD(ax,ay,bx,by,cx,cy,dx,dy){
  const pt=(px,py,x0,y0,x1,y1)=>{const vx=x1-x0,vy=y1-y0,t=clamp(((px-x0)*vx+(py-y0)*vy)/(vx*vx+vy*vy||1),0,1);return Math.hypot(px-x0-vx*t,py-y0-vy*t);};
  return Math.min(pt(ax,ay,cx,cy,dx,dy),pt(bx,by,cx,cy,dx,dy),pt(cx,cy,ax,ay,bx,by),pt(dx,dy,ax,ay,bx,by));
}
function pnlLinks(){
  PNG=[];const by=new Map();
  for(const p of PNL){const k=p.g!=null&&p.g!==''?'g'+p.g:'p'+p.i;if(!by.has(k)){by.set(k,PNG.length);PNG.push({ps:[]});}p.gi=by.get(k);PNG[p.gi].ps.push(p);}
  for(const G2 of PNG){let n=0;for(const p of G2.ps){p.base=n;n+=p.st.length;}
    const nb=Array.from({length:n},()=>[]),gr=new Uint8Array(n),cells=[];
    for(const p of G2.ps)for(let k=0;k<p.st.length;k++){const col=k%p.nc,r=(k/p.nc)|0,id=p.base+k;cells.push([p,k]);
      if(col>0)nb[id].push(id-1);if(col<p.nc-1)nb[id].push(id+1);if(r>0)nb[id].push(id-p.nc);if(r<p.nr-1)nb[id].push(id+p.nc);
      if(r===0){const [x,y]=pnWorld(p,pnCU(p,col),0);if(p.zb-pnGT(x,y)<0.35)gr[id]=1;}}
    const P=G2.ps;
    for(let a=0;a<P.length;a++)for(let b=a+1;b<P.length;b++){const A=P[a],B=P[b];
      if(Math.hypot(A.x-B.x,A.y-B.y)>A.hl+B.hl+A.ht+B.ht+24)continue;const lim=A.ht+B.ht+12;
      for(let ca=0;ca<A.nc;ca++){const ua=pnCU(A,ca),[a0x,a0y]=pnWorld(A,ua-A.cw/2,0),[a1x,a1y]=pnWorld(A,ua+A.cw/2,0);
        for(let cb=0;cb<B.nc;cb++){const ub=pnCU(B,cb),[b0x,b0y]=pnWorld(B,ub-B.cw/2,0),[b1x,b1y]=pnWorld(B,ub+B.cw/2,0);
          if(pnSegD(a0x,a0y,a1x,a1y,b0x,b0y,b1x,b1y)>lim)continue;
          for(let ra=0;ra<A.nr;ra++){const z0=A.zb+ra*A.chh,z1=z0+A.chh;
            for(let rb=0;rb<B.nr;rb++){const w0=B.zb+rb*B.chh,w1=w0+B.chh;if(Math.max(z0,w0)>Math.min(z1,w1)+0.15)continue;
              const i=A.base+ra*A.nc+ca,j=B.base+rb*B.nc+cb;nb[i].push(j);nb[j].push(i);}}}}}
    Object.assign(G2,{n,nb,gr,cells});}
}
function pnlSupport(p){
  const G2=PNG[p.gi];if(!G2)return;const {n,nb,gr,cells}=G2,seen=new Uint8Array(n),q=[];
  const alive=id=>{const [pp,k]=cells[id];return pp.st[k]<3;};
  for(let i=0;i<n;i++)if(gr[i]&&alive(i)){seen[i]=1;q.push(i);}
  while(q.length){const i=q.pop();for(const j of nb[i])if(!seen[j]&&alive(j)){seen[j]=1;q.push(j);}}
  const hitP=new Set();
  for(let i=0;i<n;i++)if(!seen[i]&&alive(i)){const [pp,k]=cells[i];if(pp.mode==='g'){if(!hitP.has(pp)){hitP.add(pp);pnBreakAll(pp,'fall');}continue;}pp.st[k]=3;pp.hp[k]=0;pnMark(pp);pnEmit(pp,k,'b','fall');}
}
function pnEmit(p,k,e,el,ox,oy){
  let x=p.x,y=p.y,h=p.zb+p.H/2;
  if(k>=0){const col=k%p.nc,r=(k/p.nc)|0;[x,y]=pnWorld(p,pnCU(p,col),0);h=p.zb+(r+0.5)*p.chh;}
  h-=pnGT(x,y);x=Math.round(x);y=Math.round(y);
  emit(Object.assign({k:'pn',e,i:p.i,c:k,el:el||'none',x,y,h:Math.round(h*10)/10},e==='b'?{ox:Math.round(ox==null?x:ox),oy:Math.round(oy==null?y:oy)}:{}));
}
function pnBreakAll(p,el,ox,oy){for(let k=0;k<p.st.length;k++){p.st[k]=3;p.hp[k]=0;}pnMark(p);pnEmit(p,-1,'b',el,ox,oy);}
function pnStage(p,k){const f=p.hp[k]/p.max,L=p.mode==='l';if(f<=0)return L&&!p.thru?2:3;if(L&&f<PNDEF.outer)return 2;return f<PNDEF.crack?1:0;}
// damage one cell (host) • splash = part of the hit spreads to the 4 neighbours (organic holes)
function pnlHit(p,k,dmg,el,ox,oy,noSplash){
  if(!BLDON||!p||k<0||k>=p.st.length||p.st[k]>=3)return;el=el||'none';
  const M=PNDEF.mat[p.mat]||PNDEF.mat.brick;let m=el.includes('blast')?1.5:el==='ice'?0.7:1;if(p.mat==='glass')m*=1.5;
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
  if(p.st[k]>=3)return;p.hp[k]=Math.max(p.mode==='l'&&!p.thru?0:-1,p.hp[k]-d);
  const s=Math.max(p.st[k],pnStage(p,k));if(s===p.st[k])return;p.st[k]=s;pnMark(p);
  if(s===3){pnEmit(p,k,'b',el,ox,oy);p.sup=1;}
}
function pnHitFx(p,k,el){if(G.time-p.t>0.12){p.t=G.time;pnEmit(p,k,'h',el);}}
// explosion / strong skill (damageEnv): every cell inside the radius (3D distance to the cell box), falloff to 30% at the edge
function pnlEnv(x,y,rad,dmg,el,h){
  if(!BLDON||!PNL.length)return;const za=(h||0)+pnGT(x,y),R=rad/20;
  for(const p of sgNear(sgPnl(),x,y,rad,_sgPN)){const [u,v]=pnLoc(p,x,y),dv=Math.max(0,Math.abs(v)-p.ht)/20;if(dv>R||Math.abs(u)>p.hl+rad)continue;
    if(p.mode==='g'){const du=Math.max(0,Math.abs(u)-p.hl)/20,dz=Math.max(0,p.zb-za,za-p.zb-p.H),d=Math.hypot(du,dv,dz);if(d<R)pnlHit(p,0,dmg*(1-0.7*d/R),el,x,y);continue;}
    const hits=[];
    for(let col=0;col<p.nc;col++){const du=Math.max(0,Math.abs(u-pnCU(p,col))-p.cw/2)/20;if(du>R)continue;
      for(let r=0;r<p.nr;r++){const k=r*p.nc+col;if(p.st[k]>=3)continue;const z0=p.zb+r*p.chh,dz=Math.max(0,z0-za,za-z0-p.chh),d=Math.hypot(du,dv,dz);if(d<R)hits.push([k,dmg*(1-0.7*d/R)]);}}
    for(const [k,dd] of hits)pnlHit(p,k,dd,el,x,y,true);}
}
// first solid cell crossed by the 3D segment (za = absolute height) • {p,k,t} or null
function pnSeg(p,x0,y0,z0,x1,y1,z1,pad){
  const [u0,v0]=pnLoc(p,x0,y0),[u1,v1]=pnLoc(p,x1,y1),ht=p.ht+(pad||0);
  if((v0>ht&&v1>ht)||(v0<-ht&&v1<-ht))return null;
  const dv=v1-v0,ta=Math.abs(v0)<=ht?0:clamp(((v0>0?ht:-ht)-v0)/dv,0,1),tb=Math.abs(v1)<=ht?1:clamp(((v1>0?ht:-ht)-v0)/dv,0,1);
  for(const t of [ta,(ta+tb)/2,tb]){const u=u0+(u1-u0)*t,z=z0+(z1-z0)*t,k=pnCell(p,u,z);if(k>=0&&p.st[k]<3)return {p,k,t};}
  return null;
}
function pnlRay(x0,y0,h0,x1,y1,h1){
  if(!PNL.length)return null;const L=Math.hypot(x1-x0,y1-y0),z0=h0+pnGT(x0,y0),z1=h1+pnGT(x1,y1);let best=null;
  for(const p of sgNear(sgPnl(),(x0+x1)/2,(y0+y1)/2,L/2+10,_sgPN2)){const q=pnSeg(p,x0,y0,z0,x1,y1,z1,0);if(q&&(!best||q.t<best.t))best=q;}
  if(!best)return null;const t=best.t,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t;return {x,y,h:z0+(z1-z0)*t-pnGT(x,y),t,p:best.p,k:best.k};
}
function pnlSolidAt(x,y,h){if(!PNL.length)return false;const za=h+pnGT(x,y);
  for(const p of sgNear(sgPnl(),x,y,0,_sgPN2)){const [u,v]=pnLoc(p,x,y);if(Math.abs(v)>p.ht||Math.abs(u)>p.hl)continue;const k=pnCell(p,u,za);if(k>=0&&p.st[k]<3)return true;}return false;}
// projectile step (host): stops at the first solid cell crossed this frame and damages it
function pnlProj(pr,dt){
  if(!PNL.length)return false;const x0=pr.x-pr.vx*dt,y0=pr.y-pr.vy*dt,q=pnlRay(x0,y0,pr.h-pr.vh*dt,pr.x,pr.y,pr.h);if(!q)return false;
  pr.x=q.x;pr.y=q.y;pr.h=Math.max(0.1,q.h);pnlHit(q.p,q.k,pr.dmg||5,projEl(pr),x0,y0);return true;
}
// walking: columns that block the body (feet z → head z+PN_BODY) merge into runs → pushed out like house walls
function pnlCollide(o,r,z){
  if(!PNL.length)return 0;let n=0;const za=z+pnGT(o.x,o.y);
  for(const p of sgNear(sgPnl(),o.x,o.y,r,_sgPN)){let [u,v]=pnLoc(p,o.x,o.y);if(Math.abs(v)>p.ht+r||Math.abs(u)>p.hl+r)continue;
    if(za>=p.zb+p.H-0.45||za+PN_BODY<=p.zb)continue;   // low wall top: step over
    const r0=clamp(Math.floor((za-p.zb)/p.chh),0,p.nr-1),r1=clamp(Math.floor((za+PN_BODY-p.zb)/p.chh),0,p.nr-1);let run=-1,moved=false;
    for(let c=0;c<=p.nc;c++){let bl=false;if(c<p.nc)for(let rr=r0;rr<=r1;rr++)if(p.st[rr*p.nc+c]<3){bl=true;break;}
      if(bl&&run<0)run=c;
      if(!bl&&run>=0){const a=-p.hl+run*p.cw,b=-p.hl+c*p.cw,q=bldPush(u,v,[(a+b)/2,0,(b-a)/2,p.ht],r);if(q){u=q[0];v=q[1];moved=true;}run=-1;}}
    if(moved){[o.x,o.y]=pnWorld(p,u,v);n++;}}
  return n;
}
// rubble heap at the foot of broken cells (modes p/l): extra ground height (walk up, low cover) • column height from broken cells above it
function pnPileCols(p){if(p.phv===p.ver)return p.ph;p.phv=p.ver;const ph=new Float32Array(p.nc);let any=false;
  if(p.mode!=='g')for(let c=0;c<p.nc;c++){let nb=0;for(let r=0;r<p.nr;r++)if(p.st[r*p.nc+c]>=3)nb++;if(nb){any=true;ph[c]=Math.min(PNDEF.pile.max,PNDEF.pile.k*nb*p.chh);}}
  return p.ph=any?ph:null;}
function pnPileAt(p,x,y){const ph=pnPileCols(p);if(!ph)return 0;const [u,v]=pnLoc(p,x,y),S=PNDEF.pile.sp,w=Math.max(0,Math.abs(v)-p.ht)/S;if(w>=1)return 0;
  const f=clamp((u+p.hl)/p.cw-0.5,0,p.nc-1),i=Math.floor(f),t=f-i,hc=ph[i]+(ph[Math.min(p.nc-1,i+1)]-ph[i])*t,eu=Math.max(0,Math.abs(u)-p.hl)/S;if(eu>=1)return 0;
  const sm=e=>1-e*e*(3-2*e),av=Math.abs(v),mid=av<p.ht?0.55+0.45*av/p.ht:1;return hc*mid*sm(w)*sm(eu);}   // lower right under the wall line (holes stay passable)
function pnlMoundH(x,y){if(!PNL.length)return 0;let g=0;for(const p of sgNear(sgPnl(),x,y,PNDEF.pile.sp,_sgPN2)){const h=pnPileAt(p,x,y);if(h>g)g=h;}return g;}
// burning wood (host)
function pnlTick(dt){
  if(!BLDON)return;
  for(const p of PNL){if(p.burnT<=0)continue;p.burnT-=dt;const d=PNDEF.dps*dt;
    if(p.mode==='g'){p.hp[0]-=d;if(p.hp[0]<=0){pnBreakAll(p,'fire');pnlSupport(p);}continue;}
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
