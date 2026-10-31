// =====================================================================
//  บอทหาทาง (designs/city-bot-battle.md ขั้น 5) — ฝั่งโฮสต์ • เปิดเฉพาะแมพที่มีของขวางเยอะ (NAV_MAPS)
//  ตารางช่อง NAV.c px: w = เดินไม่ได้ (ของขวาง + ขยายเท่าตัวผู้เล่น) • s = บังสายตา (ของสูง ≥ NAV_EYE ม.)
//  สร้างใหม่เมื่อของพัง/ตึกถล่ม (เช็กทุก 1 วิ — navSig) • A* 8 ทิศ ไม่ตัดมุม + ตัดจุดทางให้ตรง (string pull)
//  botThink = สมองเดิม (aiBot / botBrain) แล้วตามด้วย botNav:
//   - มองไม่เห็นเป้า / ไกล → เดินตามทาง (อ้อมตึก) และไม่ยิงใส่กำแพงเปล่า ๆ (คืนปุ่มสกิลที่สมองกด)
//   - เห็นเป้า → ให้สมองเดิมคุม แต่ข้างหน้าขวางอยู่ = เบี่ยงหาทางว่าง
//   - เลือดน้อย → วิ่งไปหลบหลังของที่บังสายตาจากเป้า (cover) สักพัก
//   - เป้าหลบหลังตึก (ระดับกลาง/ยาก) → ยิง/ร่ายใส่ผนังตึกฝั่งที่ใกล้ตัว = ถล่มตึกใส่ (ระบบพัง js/12-city-dmg)
//   - ติดอยู่กับที่ → คิดทางใหม่ + ก้าวข้างสุ่ม
//  ค่าระยะ/เวลา = ค่าตั้งต้น ให้ทีมเกมเพลย์ปรับ
// =====================================================================
const NAV_MAPS=new Set(['city']),NAV_EYE=2.2;
const NAV={c:60,nx:0,ny:0,w:null,s:null,key:'',sig:-1,t:-9,
  g:null,f:null,par:null,gen:null,cl:null,gn:0,heap:null};
const navOn=()=>NAV_MAPS.has(MAPID);
function navSig(){
  let s=0;
  if(cityOn()){for(const d of CITYD.b)s+=d.cl*3;for(const it of CITYD.it)if(it.st===1)s++;}
  for(const b of BLDG)if(bldGone(b))s+=1009;
  if(PROPON)for(const o of PROPS)if(o.st===1)s+=7919;
  return s;
}
function navEnsure(){
  const key=MAPID+'|'+MW+'|'+MH+'|'+OBS.length+'|'+(AREA?JSON.stringify(AREA):'');
  if(NAV.key===key&&G.time-NAV.t<1)return;
  NAV.t=G.time;const sig=navSig();if(NAV.key===key&&sig===NAV.sig)return;
  NAV.key=key;NAV.sig=sig;navBuild();
}
function navBuild(){
  const c=NAV.c,nx=Math.ceil(MW/c),ny=Math.ceil(MH/c),N=nx*ny,w=new Uint8Array(N),s=new Uint8Array(N),pad=PR+4;
  Object.assign(NAV,{nx,ny,w,s});
  if(window.WD&&!WD.nav)Object.defineProperty(WD,'nav',{get:()=>({NAV,path:navPath,ray:navRay,build:navBuild})});   // ดีบัก
  if(!NAV.g||NAV.g.length!==N)Object.assign(NAV,{g:new Float32Array(N),f:new Float32Array(N),par:new Int32Array(N),gen:new Uint32Array(N),cl:new Uint32Array(N),heap:new Int32Array(N*2),gn:0});
  const cells=(x0,y0,x1,y1,fn)=>{const a=clamp(Math.floor(x0/c),0,nx-1),b=clamp(Math.floor(x1/c),0,nx-1),e=clamp(Math.floor(y0/c),0,ny-1),f=clamp(Math.floor(y1/c),0,ny-1);
    for(let j=e;j<=f;j++)for(let i=a;i<=b;i++)fn(j*nx+i,(i+0.5)*c,(j+0.5)*c);};
  const circ=(o,r,hgt)=>{if(hgt<=0.6)return;const eye=hgt>=NAV_EYE;cells(o.x-r-pad,o.y-r-pad,o.x+r+pad,o.y+r+pad,(k,x,y)=>{const d=Math.hypot(x-o.x,y-o.y);if(d<r+pad)w[k]=1;if(eye&&d<r+c*0.35)s[k]=1;});};
  for(const o of OBS){if(o.bi!==undefined)continue;circ(o,o.r,o.top!==undefined?o.top:o.hgt);}
  const BX=MAPS[MAPID]&&MAPS[MAPID].boxes;
  if(BX)for(const B of BX){if(B.cl)continue;cells(B.x-pad,B.y-pad,B.x+B.w+pad,B.y+B.d+pad,(k,x,y)=>{w[k]=1;if(B.h>=NAV_EYE&&x>B.x-c*0.35&&x<B.x+B.w+c*0.35&&y>B.y-c*0.35&&y<B.y+B.d+c*0.35)s[k]=1;});}
  for(const b of BLDG){if(bldGone(b))continue;const e=b.o.w*0.75+pad;
    cells(b.o.x-e,b.o.y-e,b.o.x+e,b.o.y+e,(k,x,y)=>{const [lx,ly]=bldLocal(b,x,y);if(Math.abs(lx)<b.o.w/2+pad&&Math.abs(ly)<b.o.d/2+pad)w[k]=1;if(Math.abs(lx)<b.o.w/2&&Math.abs(ly)<b.o.d/2)s[k]=1;});}
  if(PROPON)for(const o of PROPS)if(o.st!==1)circ(o,o.r,o.hgt);
  const m=Math.ceil((40+pad)/c);for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)if(i<m||j<m||i>=nx-m||j>=ny-m)w[j*nx+i]=1;
  if(AREA)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const o={x:(i+0.5)*c,y:(j+0.5)*c};if(areaClamp(o,pad))w[j*nx+i]=1;}   // นอกพื้นที่เล่นของโหมด = เดินไม่ได้
}
const navCell=(x,y)=>clamp(Math.floor(y/NAV.c),0,NAV.ny-1)*NAV.nx+clamp(Math.floor(x/NAV.c),0,NAV.nx-1);
const navWalk=(x,y)=>!NAV.w[navCell(x,y)];
// เส้นตรงผ่านช่อง: sight = ใช้ตารางบังสายตา (ไม่งั้น = เดินได้ไหม) • คืน null = โล่ง / {x,y} = จุดแรกที่ขวาง
function navRay(x0,y0,x1,y1,sight){
  const G2=sight?NAV.s:NAV.w,L=Math.hypot(x1-x0,y1-y0),n=Math.max(1,Math.ceil(L/(NAV.c*0.5)));
  for(let i=1;i<n;i++){const t=i/n,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t;if(G2[navCell(x,y)])return {x,y};}
  return null;
}
function navFree(k,r){   // ช่องว่างใกล้ k ที่สุด (วงรอบไม่เกิน r ช่อง)
  if(!NAV.w[k])return k;const nx=NAV.nx,i0=k%nx,j0=(k/nx)|0;
  for(let d=1;d<=r;d++)for(let j=j0-d;j<=j0+d;j++)for(let i=i0-d;i<=i0+d;i++){if(Math.max(Math.abs(i-i0),Math.abs(j-j0))!==d||i<0||j<0||i>=nx||j>=NAV.ny)continue;const q=j*nx+i;if(!NAV.w[q])return q;}
  return -1;
}
// A* (8 ทิศ ห้ามตัดมุม) → จุดทาง [{x,y}] หลังตัดจุดที่มองเห็นกันได้ทิ้ง • null = ไปไม่ได้
function navPath(x0,y0,x1,y1){
  const nx=NAV.nx,w=NAV.w,c=NAV.c;let s=navFree(navCell(x0,y0),3),t=navFree(navCell(x1,y1),4);if(s<0||t<0)return null;if(s===t)return [{x:x1,y:y1}];
  const gn=++NAV.gn,g=NAV.g,f=NAV.f,par=NAV.par,gen=NAV.gen,cl=NAV.cl,H=NAV.heap;let hn=0;
  const ti=t%nx,tj=(t/nx)|0,h=k=>{const dx=Math.abs(k%nx-ti),dy=Math.abs(((k/nx)|0)-tj);return (dx+dy)+(1.4142-2)*Math.min(dx,dy);};
  const push=k=>{let i=hn++;H[i]=k;while(i>0){const p=(i-1)>>1;if(f[H[p]]<=f[k])break;H[i]=H[p];i=p;}H[i]=k;};
  const pop=()=>{const top=H[0],last=H[--hn];let i=0;for(;;){let a=i*2+1;if(a>=hn)break;if(a+1<hn&&f[H[a+1]]<f[H[a]])a++;if(f[H[a]]>=f[last])break;H[i]=H[a];i=a;}H[i]=last;return top;};
  gen[s]=gn;g[s]=0;f[s]=h(s);par[s]=-1;push(s);let it=0,found=false;
  const D=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.4142],[1,-1,1.4142],[-1,1,1.4142],[-1,-1,1.4142]];
  while(hn&&it++<14000){const k=pop();if(cl[k]===gn)continue;cl[k]=gn;if(k===t){found=true;break;}
    const i=k%nx,j=(k/nx)|0;
    for(const [di,dj,cost] of D){const a=i+di,b=j+dj;if(a<0||b<0||a>=nx||b>=NAV.ny)continue;const q=b*nx+a;if(w[q]||cl[q]===gn)continue;
      if(di&&dj&&(w[j*nx+a]||w[b*nx+i]))continue;
      const ng=g[k]+cost;if(gen[q]===gn&&ng>=g[q])continue;gen[q]=gn;g[q]=ng;par[q]=k;f[q]=ng+h(q)*1.05;push(q);}}
  if(!found)return null;
  const pts=[];for(let k=t;k>=0&&k!==s;k=par[k])pts.push({x:(k%nx+0.5)*c,y:(((k/nx)|0)+0.5)*c});
  pts.reverse();if(pts.length)pts[pts.length-1]={x:x1,y:y1};
  return pts;
}
const _navFoe=p=>{let b=null,bd=1e18;for(const q of plist()){if(q===p||!q.alive||q.downed||q.team===p.team||q.gh)continue;const d=(q.x-p.x)**2+(q.y-p.y)**2;if(d<bd){bd=d;b=q;}}
  if(!b)for(const e of G.en){if(e.dead||e.type==='dummy')continue;const d=(e.x-p.x)**2+(e.y-p.y)**2;if(d<bd){bd=d;b=e;}}return b;};
// สมองบอท 1 เฟรม: สมองต่อสู้เดิม + หาทาง (เรียกจาก hostTick)
function botThink(p,dt){
  if(!navOn()){(p.ai?aiBot:botBrain)(p,dt);return;}
  const c0=Object.assign({},p.inp.c),tg=p.ai?null:_navFoe(p);
  if(p.ai)aiBot(p,dt);else botBrain(p,dt,tg);
  botNav(p,dt,c0,p.ai?p.ai.tg:tg);
}
function botNav(p,dt,c0,tg){
  if(!p.alive||p.downed||!tg)return;
  navEnsure();
  const inp=p.inp,A=p.nav||(p.nav={path:null,rp:0,gx:0,gy:0,sx:p.x,sy:p.y,st:1.5,cover:null,cvT:0}),lv=p.ai?p.ai.lv:2;
  const d=Math.hypot(tg.x-p.x,tg.y-p.y),see=!navRay(p.x,p.y,tg.x,tg.y,true);
  const keepKeys=()=>{for(const k of SLOTK.concat(['x']))inp.c[k]=c0[k]|0;};
  // หลบหลังที่กำบังตอนเลือดน้อย (ทุกระดับ แต่ระดับง่ายหลบช้า)
  A.cvT-=dt;
  if(!A.cover&&A.cvT<=0&&see&&!tg.isE&&p.hp<p.maxHp*0.35){A.cvT=lv?4:7;
    let best=null,bd=1e9;for(let a=0;a<16;a++)for(const r of [180,320,460]){const x=p.x+Math.cos(a/16*6.283)*r,y=p.y+Math.sin(a/16*6.283)*r;
      if(x<60||y<60||x>MW-60||y>MH-60||!navWalk(x,y)||!navRay(x,y,tg.x,tg.y,true))continue;const dd=r+Math.hypot(x-tg.x,y-tg.y)*-0.2;if(dd<bd){bd=dd;best={x,y,t:3+Math.random()*2};}}
    if(best){A.cover=best;A.rp=0;}}
  if(A.cover){A.cover.t-=dt;if(A.cover.t<=0||p.hp>p.maxHp*0.7)A.cover=null;}
  // เป้าหลบหลังตึกเมือง → ยิงผนังตึกฝั่งใกล้ตัว (ระดับกลาง/ยาก)
  let breach=null;
  if(!see&&!A.cover&&lv>=1&&d<850&&cityOn()){const hit=navRay(p.x,p.y,tg.x,tg.y,true);
    if(hit){const B=sgNear(sgGrid('r',MAPS.city.boxes,b=>[b.x,b.y,b.x+b.w,b.y+b.d]),hit.x,hit.y,NAV.c,[])[0];
      if(B&&!B.cl&&B.m in CDMG.hp){const ex=Math.max(B.x-tg.x,0,tg.x-(B.x+B.w)),ey=Math.max(B.y-tg.y,0,tg.y-(B.y+B.d));
        if(Math.hypot(ex,ey)<240)breach={x:clamp(p.x,B.x+4,B.x+B.w-4),y:clamp(p.y,B.y+4,B.y+B.d-4)};}}}
  const goal=A.cover||(breach?null:(!see||d>1000?tg:null));
  if(goal){
    A.rp-=dt;
    if(A.rp<=0||!A.path||!A.path.length||Math.hypot(goal.x-A.gx,goal.y-A.gy)>220){A.rp=rnd(0.6,1.0);A.gx=goal.x;A.gy=goal.y;A.path=navPath(p.x,p.y,goal.x,goal.y);}
    const P=A.path;
    if(P&&P.length){
      while(P.length>1&&Math.hypot(P[0].x-p.x,P[0].y-p.y)<NAV.c*0.7)P.shift();
      for(let k=Math.min(P.length-1,6);k>0;k--)if(!navRay(p.x,p.y,P[k].x,P[k].y,false)){P.splice(0,k);break;}   // ตัดมุม: ไปจุดไกลสุดที่เดินตรงถึง
      const wx=P[0].x-p.x,wy=P[0].y-p.y,wd=Math.hypot(wx,wy)||1;
      if(!(A.cover&&wd<40)){inp.mx=wx/wd;inp.my=wy/wd;}else{inp.mx=inp.my=0;}
    }
    if(!see){inp.fire=0;keepKeys();inp.ax=p.x+(inp.mx||0)*300;inp.ay=p.y+(inp.my||0)*300;}
  }else if(breach){
    inp.ax=breach.x;inp.ay=breach.y;inp.fire=1;
    const bd2=Math.hypot(breach.x-p.x,breach.y-p.y)||1;if(bd2<280){inp.mx=(p.x-breach.x)/bd2;inp.my=(p.y-breach.y)/bd2;}else if(bd2>520){inp.mx=(breach.x-p.x)/bd2;inp.my=(breach.y-p.y)/bd2;}
  }else{
    // เห็นเป้า: สมองเดิมคุมการเดิน — ข้างหน้าขวาง = เบี่ยงหาทิศว่างที่ใกล้ทิศเดิมสุด
    const m=Math.hypot(inp.mx||0,inp.my||0);
    if(m>0.1){const a0=Math.atan2(inp.my,inp.mx);
      if(!navWalk(p.x+Math.cos(a0)*70,p.y+Math.sin(a0)*70)){for(const da of [0.5,-0.5,1,-1,1.6,-1.6,2.4,-2.4]){const a=a0+da;if(navWalk(p.x+Math.cos(a)*70,p.y+Math.sin(a)*70)){inp.mx=Math.cos(a)*m;inp.my=Math.sin(a)*m;break;}}}}
  }
  // ติดอยู่: 1.5 วิขยับไม่ถึง 30 px ทั้งที่จะเดิน → คิดทางใหม่ + ก้าวข้าง
  A.st-=dt;
  if(A.st<=0){const moved=Math.hypot(p.x-A.sx,p.y-A.sy);A.st=1.5;
    if(moved<30&&Math.hypot(inp.mx||0,inp.my||0)>0.3){A.rp=0;A.path=null;A.kick=0.5;A.ka=Math.random()*6.283;}A.sx=p.x;A.sy=p.y;}
  if(A.kick>0){A.kick-=dt;inp.mx=Math.cos(A.ka);inp.my=Math.sin(A.ka);}
  if(!isFinite(inp.mx)||!isFinite(inp.my)){inp.mx=inp.my=0;}if(!isFinite(inp.ax)||!isFinite(inp.ay)){inp.ax=tg.x;inp.ay=tg.y;}
}
