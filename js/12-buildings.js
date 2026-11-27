// ---------- environment damage / rays / collision shared by breakable things ----------
// Houses are breakable panels now (js/12-pnl.js pnlHouseConv; the old 54-chunk house system was removed 2026-11-21 — guides/Destruction.md §13).
// BLDON = breakables active in this mode (props, panels, city, cover) • bldMoundH = extra walkable ground from rubble (city mounds + panel rubble heaps)
let BLDON=false;
function bldMoundH(x,y){return Math.max(cityMoundH(x,y),pnlMoundH(x,y));}
// ให้คาถาวงกว้างพังสิ่งแวดล้อม: damageEnv(x,y,รัศมี px,ดาเมจ,id,ธาตุ,ความสูงจุดระเบิด) = ลัง/ถัง (prop) + ชิ้นย่อยบ้านในวง (ขอบวง = เหลือ 30%)
function damageEnv(x,y,rad,dmg,by,el,h){
  damagePropsIn(x,y,rad,dmg,by);damageBrkIn(x,y,rad,dmg,h);pnlEnv(x,y,rad,dmg,el,h);efsEnv(x,y,rad,by,el,h);bskEnv(x,y,rad,dmg,by,el,h);sgWallEnv(x,y,rad,dmg);roomWallEnv(x,y,rad,h,el);   // กำแพงพังได้โหมดบุกปราสาท (js/15-siege)
  for(const w of (G?.walls||[]))if(w.wood&&w.team!==G.players[by]?.team&&natureWallContains(w,x,y,h||0,rad)){
    natureWallDamage(w,dmg,x,y,by,el);
  }
  if(!BLDON)return;
  cityDamageIn(x,y,rad,dmg,el,h||0,by);   // ตึก/ของในเมือง (js/12-city-dmg)
}
// first hit of the segment (x0,y0,h0) → (x1,y1,h1) on a city tower or a breakable panel • null = clear
function bldRay(x0,y0,h0,x1,y1,h1){
  const c=cityRay(x0,y0,h0,x1,y1,h1),q=pnlRay(x0,y0,h0,x1,y1,h1);   // city towers (js/12-city-dmg) + breakable panels (js/12-pnl)
  return q&&(!c||q.t<c.t)?q:c;
}
// ท่าที่พุ่ง/ยิงลงจุดเล็ง: จุดลงหยุดที่ผนัง/หลังคาบ้านที่ขวางอยู่ (ไม่ทะลุ) • ถอยออกจากผนัง back px • คืน {x,y,h} (h = ความสูงจุดชน หรือพื้น)
function aimClip(x0,y0,h0,o,back){
  const g=groundH(o.x,o.y,h0),c=bldRay(x0,y0,h0,o.x,o.y,g);if(!c)return {x:o.x,y:o.y,h:g,hit:false};
  const d=Math.hypot(o.x-x0,o.y-y0)||1,k=Math.min(back||0,c.t*d)/d;
  return {x:c.x-(o.x-x0)*k,y:c.y-(o.y-y0)*k,h:c.h,hit:true};
}
// เล็งอิสระ 3 มิติ: ยิงจาก (ตัวเรา, สูง h0) ไปตามเส้นเป้ากลางจอ (inp.ax/ay/ah) แล้วเลยต่อไปจนชน พื้น / บ้าน / ขอบแมพ หรือครบ range px
// คืน {x,y,h,hit:'ground'|'bld'|'edge'|'air'} • null = ไม่มีข้อมูลเล็ง (บอท) ให้ใช้วิธีเดิม
// Height gate for attacks aimed with the crosshair: t must be near the aim line at its distance, so looking up or down reaches high or low targets.
function aimLineH(p,h0,t,win){const i=p.inp;if(i&&Number.isFinite(i.ah)&&Number.isFinite(i.ax)){const ad=Math.max(40,Math.hypot(i.ax-p.x,i.ay-p.y)),d=Math.hypot(t.x-p.x,t.y-p.y);return Math.abs(cH(t)-(h0+(i.ah-h0)*d/ad))<=win;}return Math.abs(cH(t)-h0)<=win;}
function aimRay3(p,h0,range,worldHeight=false){
  const i=p.inp;if(!i||p.bot||typeof i.ah!=='number')return null;
  const startH=worldHeight?h0+terrT(p.x,p.y):h0;
  let dx=i.ax-p.x,dy=i.ay-p.y,dh=(i.ah-startH)*20;const L=Math.hypot(dx,dy,dh);
  if(L<1){dx=Math.cos(p.ang);dy=Math.sin(p.ang);dh=0;}else{dx/=L;dy/=L;dh/=L;}
  let x=p.x,y=p.y,h=h0;
  for(let s=10;s<=range;s+=10){
    const nx=p.x+dx*s,ny=p.y+dy*s,nh=startH+dh*s/20-(worldHeight?terrT(nx,ny):0);
    if(nx<40||nx>MW-40||ny<40||ny>MH-40)return {x,y,h,hit:'edge'};
    const g=groundH(nx,ny,Math.max(0,nh));
    if(nh<=g){
      if(!worldHeight)return {x:nx,y:ny,h:g,hit:'ground'};
      let lo=s-10,hi=s;
      for(let j=0;j<7;j++){
        const mid=(lo+hi)*.5,mx=p.x+dx*mid,my=p.y+dy*mid;
        if(startH+dh*mid/20<=terrT(mx,my)+groundH(mx,my))hi=mid;
        else lo=mid;
      }
      const gx=p.x+dx*hi,gy=p.y+dy*hi;
      return {x:gx,y:gy,h:groundH(gx,gy),hit:'ground'};
    }
    if(PNL.length){const q=pnlRay(x,y,h,nx,ny,nh);if(q)return {x:q.x,y:q.y,h:q.h,hit:'bld'};}   // breakable panels
    if(citySolidAt(nx,ny,nh))return {x:nx,y:ny,h:nh,hit:'bld'};   // ตึกในเมือง
    x=nx;y=ny;h=nh;
  }
  return {x,y,h,hit:'air'};
}
function projEl(pr){
  const t=pr.type||'';if(t.includes('fire'))return 'fire';if(t.includes('ice'))return 'ice';
  const o=G.players[pr.owner];return o?(['fire','ice'][o.pathIdx|0]||'none'):'none';
}
// ชนผนัง: แต่ละผนังรวมคอลัมน์ที่ยังบังช่วงตัว (เท้า z ถึงหัว z+1.9) ติดกันเป็นแผ่นเดียว → รูที่โล่งทั้งช่วงตัว = เดินลอดได้ • หลังคา = ชนทีละชิ้น
function bldPush(lx,ly,R,r){
  const ex=lx-R[0],ey=ly-R[1],ax=Math.abs(ex)-R[2],ay=Math.abs(ey)-R[3];
  if(ax>=r||ay>=r)return null;
  if(ax>0&&ay>0){const d=Math.hypot(ax,ay);if(d>=r)return null;const k=(r-d)/d;return [lx+Math.sign(ex)*ax*k,ly+Math.sign(ey)*ay*k];}
  if(ax>ay)return [R[0]+(ex<0?-1:1)*(R[2]+r),ly];return [lx,R[1]+(ey<0?-1:1)*(R[3]+r)];
}
function updateBldg(dt){cityTick(dt);pnlTick(dt);}
// ---------- ของบังในแผนที่ไฟล์ที่พังได้ (หิน เสา รูปปั้น ต้นไม้ โคมไฟ ลัง ...) — คู่มือ guides/Destruction.md §9 ----------
// กลุ่ม = ที่ชน col_ 1 อัน (วงกลม OBS ที่มี b เดียวกัน) + โมเดลของมัน (map_export.py ผูกให้ → MAPS[id].fm.brk) • กำแพงใหญ่/ขอบแผนที่ไม่มีโมเดลแยก = ไม่พัง
// เลือดตามขนาด (ปริมาตร ม³ ของโมเดล < vol[0] เล็ก / < vol[1] กลาง / ใหญ่) • โดนเฉพาะ damageEnv (สกิลแรง) ไม่โดนกระสุนธรรมดา
// st: 0 ปกติ 1 ร้าว (เลือด < 66%) 2 ร้าวหนัก (< 33%) 3 พัง = ซากสูง 1/3 ของเดิม ยังชน/บังกระสุนได้ • กลับมาครบตอนเริ่มเกมใหม่ • snapshot BK = st ต่อกลุ่ม
const BRKDEF={vol:[15,60],hp:[100,200,400],crack:[0.66,0.33],rub:1/3},BRK_M=['stone','wood','ice'],BRK_MCOL=['#9a9080','#7a5a3a','#cfeefa'];   // ชนิดวัสดุ (map_export) → สีเศษ
let BRK=[];
function genBrk(id){
  const M=MAPS[id],L=((M&&M.fm&&M.fm.brk)||[]).concat((M&&M.brkX)||[]);   // brkX = code-built maps (fcs bridge parapet; obs .b indexes into this list after fm.brk)
  const out=L.map((d,i)=>{const sz=d.v<BRKDEF.vol[0]?0:d.v<BRKDEF.vol[1]?1:2;return {i,d,sz,max:d.hp||BRKDEF.hp[sz],hp:d.hp||BRKDEF.hp[sz],st:0,cs:[],x:0,y:0};});
  for(const o of (M&&M.obs)||[])if(o.b!=null&&out[o.b]){if(o.h0===undefined){o.h0=o.hgt;o.t0=o.top;}o.hgt=o.h0;o.top=o.t0;out[o.b].cs.push(o);}
  for(const g of out){if(!g.cs.length)continue;g.x=g.cs.reduce((a,o)=>a+o.x,0)/g.cs.length;g.y=g.cs.reduce((a,o)=>a+o.y,0)/g.cs.length;}
  return out;
}
function brkApply(g,st){
  g.st=st;const vh=g.d.vh||g.d.h;   // vh = ความสูงโมเดล (ต้นไม้: ที่ชนสูงกว่าตัวต้น)
  const rub=g.d.rub!=null?g.d.rub:BRKDEF.rub;   // d.rub: 0 = gone (FCS room props), 1 = keeps full collision (pillars)
  for(const o of g.cs){o.hgt=st>=3?Math.min(o.h0,vh*rub):o.h0;if(o.t0!==undefined)o.top=o.t0-o.h0+o.hgt;}
}
function brkStage(g){const f=g.hp/g.max;return g.hp<=0?3:f<BRKDEF.crack[1]?2:f<BRKDEF.crack[0]?1:0;}
function hitBrk(g,dmg,ox,oy){
  if(g.st>=3)return;g.hp-=dmg;const st=brkStage(g);if(st<=g.st)return;
  brkApply(g,st);const b=st>=3;
  const mi=Math.max(0,BRK_M.indexOf(g.d.m));
  emit({k:'brk',t:b?'b':'c',i:g.i,st,mi,col:BRK_MCOL[mi],sz:g.sz,x:Math.round(g.x),y:Math.round(g.y),h:Math.round(((g.d.z0||0)+(g.d.vh||g.d.h)*(b?BRKDEF.rub:0.5))*10)/10,hh:g.d.vh||g.d.h,r:Math.round(Math.max(...g.cs.map(o=>o.r))),
    ox:Math.round(ox==null?g.x:ox),oy:Math.round(oy==null?g.y:oy)});
}
// วงระเบิด: ระยะถึงขอบที่ชน (3 มิติ เทียบความสูงจุดระเบิดกับยอด) ขอบวงเหลือ 30% เหมือนบ้าน
function damageBrkIn(x,y,rad,dmg,h){
  if(!PROPON||!BRK.length)return;h=h||0;const R=rad/20;
  for(const g of BRK){if(g.st>=3||!g.cs.length)continue;
    let d=1e9;for(const o of g.cs)d=Math.min(d,Math.max(0,Math.sqrt(obsD2(o,x,y))-o.r));
    if(d>rad)continue;const z0=g.d.z0||0,dm=Math.hypot(d/20,h<z0?z0-h:Math.max(0,h-z0-g.d.h));if(dm<R)hitBrk(g,dmg*(1-0.7*dm/R),x,y);}   // z0 = raised base (bridge parapet)
}
function brkSnap(){return PROPON&&BRK.some(g=>g.st)?BRK.map(g=>g.st).join(''):'';}
function brkParse(s){s=s||'';for(const g of BRK){const st=+(s[g.i]||0);if(st!==g.st)brkApply(g,st);}}
// ---------- ตารางช่อง (spatial grid) สำหรับแมพใหญ่: หาเฉพาะของใกล้ ๆ แทนวนทุกชิ้นในแผนที่ ----------
// ช่องละ SG.c px • สร้างใหม่เองเมื่อรายการ/ขนาดแผนที่เปลี่ยน (ของในรายการต้องไม่ย้ายที่ — OBS / PROPS / PNL ไม่ย้าย)
// sgNear(ตาราง,x,y,รัศมี,out) = ของทุกชิ้นที่กรอบแตะวงนั้น (ไม่ซ้ำ) ใส่ลง out • แต่ละจุดเรียกใช้ out ของตัวเอง (กันทับกันตอนเรียกซ้อน)
const SG={c:400,s:0,m:new Map()};
// capsule colliders (Map Builder straight walls): hx,hy = half axis px → distance is measured to the axis • plain circles have none
// box colliders (Map Builder boxes / kit collision boxes, 2026-11-26): + w = half width across the axis (px) → rounded box, corner radius r
let OCX=0,OCY=0;function obsCP(o,x,y){const hx=o.hx;if(hx===undefined){OCX=o.x;OCY=o.y;return;}const hy=o.hy,l2=hx*hx+hy*hy||1,dx=x-o.x,dy=y-o.y,t=clamp((dx*hx+dy*hy)/l2,-1,1);
  if(o.w===undefined){OCX=o.x+hx*t;OCY=o.y+hy*t;return;}const l=Math.sqrt(l2),s=clamp((dy*hx-dx*hy)/l,-o.w,o.w);OCX=o.x+hx*t-hy/l*s;OCY=o.y+hy*t+hx/l*s;}
function obsD2(o,x,y){obsCP(o,x,y);return (x-OCX)**2+(y-OCY)**2;}
const obsLo=(q,g0)=>q.top!==undefined?(q.bot!==undefined?q.top-q.hgt+q.bot:-50):g0+(q.bot||0);   // bottom height (world) • top = absolute top on terrain maps, bot = floating start (arch lintels)
const obsRR=o=>o.w===undefined?o.r:o.r+o.w;   // radius that covers the width (bounds / cheap consumers)
// box: point inside the inner rect (d = 0) → push out through the nearest face to m past it • false = not inside a box
function obsOut(o,p,m){if(o.w===undefined)return false;const hx=o.hx,hy=o.hy,l=Math.hypot(hx,hy)||1,ux=hx/l,uy=hy/l,dx=p.x-o.x,dy=p.y-o.y,a=dx*ux+dy*uy,b=dy*ux-dx*uy,ea=l-Math.abs(a),eb=o.w-Math.abs(b);
  if(ea<0||eb<0)return false;if(ea<eb){const sa=a<0?-1:1;p.x+=ux*sa*(ea+m);p.y+=uy*sa*(ea+m);}else{const sb=b<0?-1:1;p.x-=uy*sb*(eb+m);p.y+=ux*sb*(eb+m);}return true;}
function obsEach(o,fn){if(o.hx===undefined){fn(o.x,o.y,o.r);return;}const R=obsRR(o),L=Math.hypot(o.hx,o.hy)*2,n=Math.max(1,Math.ceil(L/(R*1.15)));for(let i=0;i<=n;i++){const t=i/n*2-1;fn(o.x+o.hx*t,o.y+o.hy*t,R);}}   // circles along a capsule / box (cheap consumers; box = its width as radius)
const obsBox=c=>{const R=obsRR(c);return c.hx===undefined?[c.x-R,c.y-R,c.x+R,c.y+R]:[c.x-Math.abs(c.hx)-R,c.y-Math.abs(c.hy)-R,c.x+Math.abs(c.hx)+R,c.y+Math.abs(c.hy)+R];};
const sgObs=()=>sgGrid('o',OBS,obsBox),sgProps=()=>sgGrid('p',PROPS,c=>[c.x-c.r,c.y-c.r,c.x+c.r,c.y+c.r]);
function sgGrid(key,list,box){
  let g=SG.m.get(key);if(g&&g.list===list&&g.n===list.length&&g.mw===MW&&g.mh===MH)return g;
  const c=SG.c,nx=Math.ceil(MW/c)+1,ny=Math.ceil(MH/c)+1,cells=Array.from({length:nx*ny},()=>[]);
  for(const o of list){const B=box(o),x0=clamp(Math.floor(B[0]/c),0,nx-1),x1=clamp(Math.floor(B[2]/c),0,nx-1),y0=clamp(Math.floor(B[1]/c),0,ny-1),y1=clamp(Math.floor(B[3]/c),0,ny-1);
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)cells[y*nx+x].push(o);}
  g={list,n:list.length,mw:MW,mh:MH,nx,ny,cells};SG.m.set(key,g);return g;
}
function sgNear(g,x,y,r,out){
  out.length=0;const c=SG.c,s=++SG.s,x0=clamp(Math.floor((x-r)/c),0,g.nx-1),x1=clamp(Math.floor((x+r)/c),0,g.nx-1),y0=clamp(Math.floor((y-r)/c),0,g.ny-1),y1=clamp(Math.floor((y+r)/c),0,g.ny-1);
  for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++)for(const o of g.cells[cy*g.nx+cx])if(o._sg!==s){o._sg=s;out.push(o);}
  return out;
}
const _sgCR=[],_sgCW=[],_sgCB=[],_sgCO=[],_sgPO=[],_sgPB=[],_sgPP=[],_sgM=[],_sgE=[],_sgA=[];
// ขยับไกลในทีเดียว (ท่าพุ่ง/วาร์ปสั้น/โดนกระเด็น ≥ 10 px ต่อครั้ง): ไล่เส้นจากตำแหน่งก่อนหน้า ชนผนังบ้าน/ตึกตรงไหน หยุดหน้าผนัง — กันทะลุผนังบาง • ไกลเกิน 400 px = วาร์ป/เกิดใหม่ ไม่เช็ก
const _cwLast=new WeakMap();
function collideWorld(o,r,z){
  z=z||0;const sx=o.x,sy=o.y;let sol=0;
  o.x=clamp(o.x,r+20,MW-r-20);o.y=clamp(o.y,r+20,MH-r-20);if(o.x!==sx||o.y!==sy)sol++;
  if(AREA&&areaClamp(o,r))sol++;   // พื้นที่เล่นของโหมด (กำแพงล่องหน)
  {const L=_cwLast.get(o);if(L){const dl=Math.hypot(o.x-L.x,o.y-L.y);if(dl>=10&&dl<400){const c=bldRay(L.x,L.y,z+1,o.x,o.y,z+1);
    if(c){const k=Math.max(0,c.t-(r+2)/dl);o.x=L.x+(o.x-L.x)*k;o.y=L.y+(o.y-L.y)*k;sol++;}}}}
  if(PROPON)for(const c of sgNear(sgProps(),o.x,o.y,r,_sgCW)){
    if(c.st===1||c.hgt<=z)continue;
    if(Math.abs(o.x-c.x)>c.r+r||Math.abs(o.y-c.y)>c.r+r)continue;
    const dx=o.x-c.x,dy=o.y-c.y,d=Math.hypot(dx,dy),m=c.r+r;
    if(d<m&&d>0.001){o.x=c.x+dx/d*m;o.y=c.y+dy/d*m;}
  }
  const za=TERR?terrT(o.x,o.y)+z:z;
  for(const c of sgNear(sgObs(),o.x,o.y,r,_sgCO)){
    if((c.top!==undefined?c.top<=za:c.hgt<=z)||c.bi!==undefined||(c.bot!==undefined&&z+1.9<=c.bot))continue;   // bot = วงที่ลอยเริ่มสูงจากพื้น (ส่วนทึบบนตึกกลวง)
    obsCP(c,o.x,o.y);const cx=OCX,cy=OCY;
    if(Math.abs(o.x-cx)>c.r+r||Math.abs(o.y-cy)>c.r+r)continue;
    const dx=o.x-cx,dy=o.y-cy,d=Math.hypot(dx,dy),m=c.r+r;
    if(d<m&&d>0.001){o.x=cx+dx/d*m;o.y=cy+dy/d*m;sol++;}else if(d<=0.001&&obsOut(c,o,m))sol++;
  }
  if(G&&G.walls)for(const c of G.walls){
    if(c.wood){sol+=natureWallPush(c,o,r,z,_cwLast.get(o));continue;}
    if(c.hgt<=z)continue;
    if(Math.abs(o.x-c.x)>c.r+r||Math.abs(o.y-c.y)>c.r+r)continue;
    const dx=o.x-c.x,dy=o.y-c.y,d=Math.hypot(dx,dy),m=c.r+r;
    if(d<m&&d>0.001){o.x=c.x+dx/d*m;o.y=c.y+dy/d*m;}
  }
  sol+=eCollide(o,r,z,_cwLast.get(o));   // สิ่งก่อสร้างสายดิน
  sol+=windCollide(o,r,z);   // กำแพงลมสายลม: กันศัตรูเดินผ่าน
  sol+=pnlCollide(o,r,z);   // breakable panels (js/12-pnl)
  sol+=cityCollideIn(o,r,z);   // ผนังตึกกลวงในเมือง ทีละแผ่นทีละชั้น (js/12-city-dmg)
  // กล่องตึกทึบ (แมพเมือง MAPS[id].boxes {x,y,w,d,h}): ขอบชนด้วยวงกลม cwall แล้ว — ตรงนี้กันกรณีหลุดเข้าไปข้างใน (วาร์ป/จุดสุ่ม) → ดันออกด้านที่ใกล้สุด
  const BX=MAPS[MAPID]&&MAPS[MAPID].boxes;
  if(BX)for(const b of sgNear(sgGrid('r',BX,b=>[b.x,b.y,b.x+b.w,b.y+b.d]),o.x,o.y,0,_sgCR)){
    if(b.cl||b.h<=z||(b.top&&z<b.top)||o.x<=b.x||o.x>=b.x+b.w||o.y<=b.y||o.y>=b.y+b.d)continue;
    const L=o.x-b.x,Rr=b.x+b.w-o.x,T=o.y-b.y,Bt=b.y+b.d-o.y,m=Math.min(L,Rr,T,Bt);
    if(m===L)o.x=b.x-r;else if(m===Rr)o.x=b.x+b.w+r;else if(m===T)o.y=b.y-r;else o.y=b.y+b.d+r;sol++;}
  if(sol)o.solN=(o.solN|0)+1;   // ชนของแข็ง (Stonebreaker ใช้ทำคอมโบชนกำแพง)
  {const L=_cwLast.get(o);if(L){L.x=o.x;L.y=o.y;}else _cwLast.set(o,{x:o.x,y:o.y});}
}

function shoot(p,type,o){
  const d=PDEF[type],a=p.ang,h=p.z+1.35,SP=(o&&o.spd)||d.spd;
  // ล็อกเป้าแนวตั้งอัตโนมัติ: ถ้ามีศัตรูอยู่ในแนวเล็ง คาถาจะเชิดขึ้น/ลงไปหาเอง
  // ผู้เล่นจริง (มีจุดเล็งจาก crosshair) = ไปตรงจุดเล็ง 100% ไม่ล็อกเป้าเอง (ผู้ใช้ 2026-11-06) • บอท/ไม่มีจุดเล็ง = ล็อกแนวตั้งแบบเดิม
  const human=p.inp&&typeof p.inp.ah==='number'&&!p.bot;
  let best=null,bs=1e9;
  if(!human)for(const t of foesOf(p.team)){
    const dx=t.x-p.x,dy=t.y-p.y,dd=Math.hypot(dx,dy);
    if(dd>1300||dd<1)continue;
    const da=Math.abs(angDiff(Math.atan2(dy,dx),a));
    if(da<0.3&&da+dd/5000<bs){bs=da+dd/5000;best=t;}
  }
  let vh;
  if(best)vh=(cH(best)+terrT(best.x,best.y)-terrT(p.x,p.y)-h)/(Math.hypot(best.x-p.x,best.y-p.y)/SP);
  else if(human){const dd=Math.max(60,Math.hypot(p.inp.ax-p.x,p.inp.ay-p.y)-26);   // −26 = กระสุนเกิดหน้าตัว 26 หน่วย → ระยะบินจริงถึงจุดเล็ง
    vh=clamp((p.inp.ah-h)/(dd/SP),-Math.max(30,SP/5),Math.max(30,SP/5));}   // ลิมิตแนวตั้งตามความเร็วกระสุน (เดิมตายตัว 30 = ยิงลงจากที่สูงด้วยกระสุนเร็วไม่ถึงเป้า)
  else vh=Math.tan(clamp((p.inp&&p.inp.ap)||0,-0.9,0.9))*SP/20;
  const pr={id:++G.pid,type,x:p.x+Math.cos(a)*26,y:p.y+Math.sin(a)*26,h,vh,vx:Math.cos(a)*SP,vy:Math.sin(a)*SP,
    r:d.r,dmg:d.dmg,life:d.life,owner:p.id,team:p.team,src:'p'};
  // hand:1 = ออกจากปลายไม้ (มือขวา) แล้ววิ่งไปจุดเล็ง crosshair (ผู้ใช้ 2026-11-11: Kindle/ลูกไฟไม่ตรงกับไม้)
  if(o&&o.hand){const rx=-Math.sin(a),ry=Math.cos(a);pr.x=p.x+Math.cos(a)*20+rx*9;pr.y=p.y+Math.sin(a)*20+ry*9;pr.h=p.z+1.45;
    if(human){const A=Math.atan2(p.inp.ay-pr.y,p.inp.ax-pr.x),dd=Math.max(60,Math.hypot(p.inp.ax-pr.x,p.inp.ay-pr.y));pr.vx=Math.cos(A)*SP;pr.vy=Math.sin(A)*SP;pr.vh=clamp((p.inp.ah-pr.h)/(dd/SP),-Math.max(30,SP/5),Math.max(30,SP/5));}
    delete o.hand;}
  if(o)Object.assign(pr,o);
  G.proj.push(pr);
  if(!(o&&o.quiet))emit({k:'cast',t:type,x:p.x,y:p.y,h:h+0.05,a:Math.round(a*100)/100,id:p.id});   // quiet = ไม่เล่นท่าร่ายซ้ำ (BA น้ำ: ตวัดครั้งเดียว)
  return pr;
}
function eShoot(e,type,t,off){
  const pd=PDEF[type],a=Math.atan2(t.y-e.y,t.x-e.x)+(off||0),dd=Math.hypot(t.x-e.x,t.y-e.y)||1;
  const h=(e.h||0)+EDEF[e.type].ch+0.3,vh=(cH(t)+terrT(t.x,t.y)-terrT(e.x,e.y)-h)/(dd/pd.spd);
  G.proj.push({id:++G.pid,type,x:e.x+Math.cos(a)*(e.r+6),y:e.y+Math.sin(a)*(e.r+6),h,vh,vx:Math.cos(a)*pd.spd,vy:Math.sin(a)*pd.spd,
    r:pd.r,dmg:pd.dmg*G.escale,life:pd.life,owner:'E',team:-1,src:'e'});
  emit({k:'cast',t:type,x:e.x,y:e.y,h,a:Math.round(a*100)/100});
}
function foesOf(team){
  const out=[];
  for(const q of plist())if(q.alive&&!q.downed&&q.team!==team)out.push(q);
  for(const e of G.en)if(!e.dead)out.push(e);
  if(G.mins)for(const m of G.mins)if(!m.dead&&m.team!==team)out.push(m);
  if(G.nature)for(const o of G.nature)if(o.isM&&o.team!==team&&natureLive(o)&&G.time>=o.ready)out.push(o);
  return out;
}
function breakShield(p){
  if(p.pathIdx===EARTH){if(!(p.stdB>0))earthBreak(p);return;}
  if(p.pathIdx===WINDP)p.wbw=undefined;
  p.shieldOn=false;p.shieldE=0;p.shieldBroken=SHIELD_BREAK_LOCK;
  emit({k:'sbreak',x:p.x,y:p.y,h:p.z+1.3,id:p.id});
}
// อัลติ (ผู้ใช้ 2026-10-22): ชาร์จช้าลง 30% ทุกสาย (ULT_RATE) + ระหว่างอัลติยังทำงานอยู่ไม่ได้ชาร์จเพิ่ม (นับใหม่หลังอัลติจบ)
const ULT_RATE=0.7;
function ultActive(p){return p.colos>0||p.god>0||!!p.wr||p.mirror>0||!!p.lgUlt||p.dark?.ultBiteUntil>G.time||p.pathIdx===NATUREP&&naturePlants(p,'tree').length>0;}
function gainUlt(p,v){if(ultActive(p))return;p.ult=Math.min(100,p.ult+v*0.5*ULT_RATE*p.buffs.ult);}
function lifesteal(p,amt){if(p.buffs.life&&p.alive&&!p.downed)healT(p,amt*p.buffs.life);}

let impactProjectile=null;
function damage(t,amt,srcId,kind,noFlash=false,impact){
  if(G.mode==='train'&&G.tr&&G.tr.god&&G.players[t.id]===t)return;   // ห้องฝึก: อมตะ
  if(devGod(t)||darkOrbImmune(t))return;
  const src=srcId!=null?G.players[srcId]:null;
  const melee=impact?.weapon;
  const swing=melee==='frost'?src?.swN:melee==='whip'?src?.natureWhip?.start:undefined;
  const flight=kind==='proj'&&impactProjectile?.owner===srcId?impactProjectile:null;
  const force=Number.isFinite(impact?.angle)?impact.angle:flight&&Math.hypot(flight.vx,flight.vy)>1?Math.atan2(flight.vy,flight.vx):undefined;
  if(src&&src!==t&&kind!=='burn'&&kind!=='zone')darkReveal(src);
  if(src&&kind!=='burn')amt*=src.buffs.dmg;
  if(src&&src.fheat>0&&kind!=='burn')amt*=pyroHeatDmg(src);
  if(src&&src.blaze>0){amt*=BLAZEF.v.dmgUp;if(kind!=='burn'&&src!==t)pyroBlazeAct(src);}   // Blazeform (เนิร์ฟ 2026-10-27: 1.3→1.15)
  if(src&&src.mirror>0&&!src.noMul)amt*=MIRROR.v.dmgMul;
  if(src&&kind!=='burn'){amt*=lightDmgOut(src);if(src.lgEmpT>G.time&&kind!=='zone')lightAllyHit(src,t);}   // สายแสง: คริสตัลกับคู่หู ตีแรง 5%/ชิ้น + Empower Light ยิงตาม
  if(t.natKind){natureDamage(t,amt,srcId);return;}
  if(G.wwl&&G.wwl.length)windDmg(t,amt,srcId);
  if(src&&src.wfam>0)waterOnHit(src,t,kind);   // สายน้ำ Tidecaller Orb: ลูกผู้ช่วยยิงตาม   // สายลม: ดาเมจใส่ศัตรูที่ติดกำแพงลม
  if(t.isM){
    if(t.dead)return;
    if(t.frz>0)amt*=1.15;
    if(t.mrk>0&&kind!=='burn')amt*=1.12;
    t.hp-=amt;emit({k:'hit',x:t.x,y:t.y,h:(t.h||0)+1.4,n:Math.round(amt),nf:noFlash?1:undefined,mn:t.id,s:srcId||undefined,m:melee,ms:swing,mc:impact?.chase,ns:src&&src.baHit?1:undefined,b:kind==='burn'?1:undefined,kl:t.hp<=0?1:undefined,a:(kind==='aoe'||kind==='zone')?1:undefined});
    if(src&&src.alive)gainUlt(src,amt*0.3);
    if(t.hp<=0){t.dead=true;emit({k:'die',x:t.x,y:t.y,h:(t.h||0)+0.8,c:'#9fd0ff',t:'min'});}
    return;
  }
  if(t.isE){
    if(t.dead)return;
    if(t.frz>0)amt*=1.15;
    if(t.mrk>0&&kind!=='burn')amt*=1.12;
    t.hp-=amt;
    emit({k:'hit',x:t.x,y:t.y,h:cH(t)+vR(t)+0.4,n:Math.round(amt),nf:noFlash?1:undefined,e:t.id,s:srcId||undefined,m:melee,ms:swing,mc:impact?.chase,ns:src&&src.baHit?1:undefined,b:kind==='burn'?1:undefined,kl:t.hp<=0?1:undefined,a:(kind==='aoe'||kind==='zone')?1:undefined});
    if(src){src.cbT=G.time;gainUlt(src,amt);lifesteal(src,amt);src.dmgDealt+=amt;if(kind!=='burn')pyroHeatGain(src,amt);}
    if(t.hp<=0){t.dead=true;t.lastHit=srcId;if(src){src.kills++;darkKill(src);}emit({k:'die',x:t.x,y:t.y,h:cH(t),c:EDEF[t.type].col,t:t.type});}
    return;
  }
  if(!t.alive||t.downed)return;
  if(t.inv>0&&kind!=='burn')return;
  if(G.ball&&G.ball.holder===t.id&&kind!=='burn'&&kind!=='zone')quidDrop(t);
  if(t.stS&&kind!=='burn'){t.stS.abs+=amt;emit({k:'efx',z:'sthit',x:Math.round(t.x),y:Math.round(t.y),h:t.z+1.2,sx:src?Math.round(src.x):undefined,sy:src?Math.round(src.y):undefined,n:Math.round(amt),id:t.id});if(t.stS.abs>90)stormShieldBlast(t,true);return;}
  if(t.shieldOn&&kind!=='burn'&&frostGuardFaces(t,src?src.x:null,src?src.y:null,src&&src.z!=null?src.z+1.2:null)){   // Frost Sword Guard: soak part of the hit
    const ab=Math.min(t.shieldE*FROST_GUARD.hp/100,amt*FROST_GUARD.block);t.shieldE-=ab*100/FROST_GUARD.hp;amt-=ab;t.shBlk=(t.shBlk|0)+1;
    emit({k:'block',x:t.x,y:t.y,h:t.z+1.2,id:t.id,n:Math.round(ab)});if(t.shieldE<=0.01){t.shieldE=0;breakShield(t);}if(amt<=0.01)return;}
  if(t.pathIdx!==DARKP&&t.shieldOn&&(kind==='melee'||kind==='aoe')&&shieldFaces(t,src?src.x:null,src?src.y:null,src&&src.z!=null?src.z+1.2:null)){
    pyroHeatGain(t,amt);pyroBlazeAct(t);if(t.pathIdx===EARTH)earthShHit(t,amt);else{t.shieldE-=amt*(lgOn(t)?lightShieldGauge(t):PBASIC[t.pathIdx|0]?.shMul||1.5);t.shBlk=(t.shBlk|0)+1;}emit({k:'block',x:t.x,y:t.y,h:t.z+1.2,id:t.id});
    {const B=PBASIC[t.pathIdx|0];if(B&&B.onBlock)B.onBlock(t);}
    if(t.shieldE<=0)breakShield(t);
    return;
  }
  if(t.frz>0)amt*=1.15;
  if(t.ovc>0)amt*=1.15;
  if(t.blaze>0)amt*=BLAZEF.v.taken;
  if(t.mrk>0&&kind!=='burn')amt*=1.12;
  if(!t.isM&&!t.isE)amt*=lightDmgIn(t);
  if(t.lgXsh&&!t.isM&&!t.isE)amt=lightHexAbsorb(t,amt);   // Radiance X guard hex shield (js/09-light)   // สายแสง: คริสตัลกับคู่หู กัน 5%/ชิ้น • Light Step 30% • อัลติ 30%
  if(t.dr){amt*=t.dr.f;if(src&&src!==t&&kind!=='burn'&&kind!=='zone'&&!(t.drCd>0)){addPoison(src,t.id,1);t.drCd=1;}}
  if(t.lgUltWard?.hp>0){const absorbed=Math.min(t.lgUltWard.hp,amt);t.lgUltWard.hp-=absorbed;amt-=absorbed;
    emit({k:'block',x:t.x,y:t.y,h:t.z+1.2});if(amt<=0.01)return;}
  if(t.xhp>0){const ab=Math.min(t.xhp,amt);t.xhp-=ab;amt-=ab;if(amt<=0.01){emit({k:'block',x:t.x,y:t.y,h:t.z+1.2});return;}}
  if(t.ward&&t.ward.t>0){
    const ab=Math.min(t.ward.abs,amt);t.ward.abs-=ab;amt-=ab;
    emit({k:'block',x:t.x,y:t.y,h:t.z+1.2});
    if(t.ward.thorns&&src&&src!==t&&kind!=='burn'&&kind!=='zone')addChill(src,1);
    if(t.ward.abs<=0)t.ward=null;
    if(amt<=0.01)return;
  }
  if(darkFlow(t))amt*=.8;
  amt=natureGuard(t,amt);
  const real=Math.min(amt,Math.max(0,t.hp));   // ดาเมจจริง (ไม่นับส่วนที่เกินเลือด)
  t.hp-=amt;t.lastHit=srcId;t.dmgTaken=(t.dmgTaken||0)+real;t.cbT=G.time;if(src&&src!==t)src.cbT=G.time;
  if(G.balDmg&&src&&src!==t){const k=src.pathIdx+':'+kind+(src.z>1.5?':air':'');G.balDmg[k]=(G.balDmg[k]||0)+real;if(G.balWho){const w=G.balWho;w[k]=w[k]||{};const st=(new Error().stack||'').split('\n').slice(2,6).map(l=>(l.match(/at (\S+)/)||[])[1]).filter(f=>f&&!/aoeHit|damage|Array|forEach/.test(f)),id=st.slice(0,2).join('<');w[k][id]=(w[k][id]||0)+real;}}   // ดีบัก balance (WD.G.balDmg={})   // สรุปจบเกม: ดาเมจที่รับ
  if(G.mode==='ffa')ffaDmgLog(t,srcId,real,kind);   // assist + จอตอนตาย (js/54)
  if(src&&src!==t){gainUlt(src,amt*0.7);lifesteal(src,amt);src.dmgDealt+=amt;if(kind!=='burn')pyroHeatGain(src,real);}
  gainUlt(t,amt*0.25);
  emit({k:'hit',x:t.x,y:t.y,h:t.z+2.4,n:Math.round(amt),nf:noFlash?1:undefined,id:t.id,s:srcId||undefined,m:melee,ms:swing,mc:impact?.chase,ns:src&&src.baHit?1:undefined,b:kind==='burn'?1:undefined,kl:t.hp<=0?1:undefined,sx:src&&src!==t?Math.round(src.x):undefined,sy:src&&src!==t?Math.round(src.y):undefined,a:(kind==='aoe'||kind==='zone')?1:undefined,dir:(t.hp<=0||melee)?force:undefined,quietKill:t.hp<=0&&kind==='zone'?1:undefined});
  if(t.hp<=0){t.hp=0;playerDown(t,srcId);}
}
function playerDown(t,srcId){
  lightReleaseAlly(t);
  t.shieldOn=false;t.burn=0;t.fly=false;
  t.frostCut=null;
  t.stS=null;t.sdome=null;t.stMarkAim=null;t.stPulse=0;t.stAllyMark=null;t.stStaff=0;t.slnT=0;t.beam=0;t.sdHit=null;earthReset(t);windReset(t);waterReset(t);natureReset(t);lightReset(t,true);darkReset(t);if(t.god>0){t.god=0;t.xhp=0;}
  // ท่าที่ง้าง/ค้างอยู่ตอนล้ม: ไม่งั้นคนล้ม (co-op) ยังปล่อยท่าได้ หรือท่าค้างไว้แล้วออกเองทันทีที่ถูกชุบ
  t.dfall=null;t.snapT=0;t.grT=0;t.slam=false;t.slam3=null;t.dchgOn=false;t.dchg=0;t.chg=0;t.dash=0;t.dashSp=0;t.trail=null;
  if(G.mode==='coop'){
    t.downed=true;t.revive=0;t.deaths++;
    feed(`💀 ${t.name} ล้ม! ไปยืนข้างๆ เพื่อชุบ`);
    emit({k:'die',x:t.x,y:t.y,h:t.z+1,c:t.color});
    return;
  }
  t.alive=false;t.deaths++;t.respawn=G.mode==='race'||G.mode==='train'?PLAY.respawnFast:G.mode==='br'?1e9:PLAY.respawn;
  if(G.mode==='br')emit({k:'brout',x:t.x,y:t.y});
  const k=G.players[srcId]||G.players[t.lastHit];
  if(k&&k!==t&&['ffa','tdm','quid'].includes(G.mode))t.respawn=7.5;   // กล้องตอนตาย 3+4 วิ + จอดำ แล้วค่อยเกิด (js/58)
  if(k&&k!==t){k.kills++;darkKill(k);if(G.mode==='tdm')G.teamScore[k.team]++;feed(`${k.name} ⚡ ${t.name}`);}
  else feed(`💀 ${t.name}`);
  if(G.mode==='ffa')ffaKill(k&&k!==t?k:null,t);   // ฆ่าต่อเนื่อง/ค่าหัว/แก้แค้น/assist/ขวดดรอป (js/54)
  emit({k:'die',x:t.x,y:t.y,h:t.z+1,c:t.color,id:t.id,ki:k&&k!==t?k.id:''});   // id/ki = กล้องตอนตาย (js/58)
}

function killProj(pr){if(pr.type==='wshp'&&!pr.dead){pr.dead=true;if(pr.life>0)windWallBlast(pr);return;}if(pr.type==='wblade'&&!pr.dead){pr.dead=true;windFeatherBoom(pr);return;}if(pr.type==='wball'&&!pr.dead){pr.dead=true;windOrbBoom(pr);return;}if(pr.type==='wplume'&&!pr.dead){pr.dead=true;windPlumeBoom(pr);return;}
  if(pr.dead)return;
  pr.dead=true;
  if(pr.type==='nature_pea'){naturePeaSplash(pr);return;}
  if(pr.type==='efist'||pr.type==='efistc'){earthFistBreak(pr);return;}
  if(pr.sp==='erockb'){earthRockSplash(pr);return;}   // Earth rock (BA / Stone Barrage) bursts on the ground too
  if(pr.type==='fire')explode(pr);
  else if(pr.type==='iceboulder')frostBoom(pr);
  else if(pr.type==='pfireb')pyroBigBoom(pr);
  if(pr.type==='eslab')damageEnv(pr.x,pr.y,80,STONEB.v.env*ERV.env,pr.owner,'rock',pr.h);   // แผ่นหิน Stonebreaker แตก = พังบ้าน/ของ
  else if(!pr.noImpact)emit({k:'pop',x:pr.x,y:pr.y,h:pr.h,t:pr.type});
}
function explode(pr){
  emit({k:'boom',x:pr.x,y:pr.y,h:pr.h});
  const sr=pr.splash?pr.splash.r:80,sd=pr.splash?pr.splash.dmg:10;
  damageEnv(pr.x,pr.y,sr,sd,pr.owner,'fire',pr.h);
  for(const t of foesOf(pr.team)){
    if(t.id===pr.owner)continue;
    if(Math.hypot(t.x-pr.x,t.y-pr.y)<sr+(t.r||PR)&&Math.abs(cH(t)-pr.h)<3){
      const own=G.players[pr.owner];
      if(pr.sp&&own)aoeHit(own,t,sd,t=>ignite(t,pr.owner,1.5));else damage(t,sd,pr.owner,'aoe');
    }
  }
}
function hitTarget(pr,t){
  const previous=impactProjectile;impactProjectile=pr;
  try{hitProjectileTarget(pr,t);}finally{impactProjectile=previous;}
}
function hitProjectileTarget(pr,t){
  if(pr.type==='nature_pea')return; // The splash applies damage once, including to the direct target.
  if(pr.sp&&SPELLS[pr.sp]&&SPELLS[pr.sp].hit){SPELLS[pr.sp].hit(pr,t);if(!pr.noImpact&&pr.type!=='fire'&&pr.type!=='wbl')emit({k:'imp',x:t.x,y:t.y,h:pr.h,t:pr.type});return;}
  damage(t,pr.dmg,pr.owner,'proj',pr.noImpact);
  if(!pr.noImpact&&pr.type!=='fire')emit({k:'imp',x:t.x,y:t.y,h:pr.h,t:pr.type});
  const big=t.type==='troll'||t.type==='queen';
  switch(pr.type){
    case 'stun':t.stun=Math.max(t.stun,t.isE?(big?0.4:1.4):0.8);break;
    case 'pull':{
      const o=G.players[pr.owner];
      if(o){const a=Math.atan2(o.y-t.y,o.x-t.x),f=big?200:620;t.vx+=Math.cos(a)*f;t.vy+=Math.sin(a)*f;t.stun=Math.max(t.stun,0.3);}
      break;}
    case 'fire':t.burn=3;t.bt=1;t.burnSrc=pr.owner;break;
    case 'bolt':{const a=Math.atan2(pr.vy,pr.vx),f=big?20:90;t.vx+=Math.cos(a)*f;t.vy+=Math.sin(a)*f;break;}
    case 'web':if(!t.isE){t.root=Math.max(t.root||0,1.3);}break;
  }
}
function updateProjectiles(dt){
  const ps=plist();
  for(const pr of G.proj){   // กระสุนเร็ว/พุ่งลงชัน ก้าวทีละไม่เกิน ~1.2 ม.แนวตั้ง และไม่เกิน (รัศมี+16) px แนวนอน กันทะลุตัวเป้า (เฟรมช้าด้วย)
    const ns=pr.dead?0:clamp(Math.max(Math.ceil(Math.abs(pr.vh||0)*dt/1.2),Math.ceil(Math.hypot(pr.vx,pr.vy)*dt/(pr.r+16))),1,8);
    for(let si=0;si<ns&&!pr.dead;si++)projStep(pr,dt/ns,ps);
  }
  G.proj=G.proj.filter(p=>!p.dead);
}
function projStep(pr,dt,ps){
  if(pr.bz)windCurveStep(pr,dt);
  if(pr.kc)pyroKindleCurve(pr,dt);   // Kindle side fireballs   // ขนนกสายลม: วิ่งตามเส้นโค้ง
    if(pr.type==='wcage'){
      waterCageSteer(pr,dt);
      if(pr.cageWait>0){pr.life-=dt;return;}
    }
    if(pr.dead)return;
    const prevX=pr.x,prevY=pr.y,prevH=pr.h;
    if(pr.wob){pr.wt=(pr.wt||0)+dt;const s=Math.cos(pr.wt*pr.wf+pr.wp)*pr.wob*dt,c=Math.cos(s),n=Math.sin(s),vx=pr.vx;pr.vx=vx*c-pr.vy*n;pr.vy=vx*n+pr.vy*c;}   // Stone Barrage: rocks sway a little in flight
    {const t0=TERR?terrT(pr.x,pr.y):0;pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;pr.h+=pr.vh*dt;if(TERR)pr.h-=terrT(pr.x,pr.y)-t0;}pr.life-=dt;
    if(pr.flak&&broomFlak(pr))return;   // Flak บนไม้กวาด: ใกล้ศัตรู = แตกเป็นกรวย (js/69)
    if(pr.life<=0||pr.x<20||pr.x>MW-20||pr.y<20||pr.y>MH-20||pr.h>40){killProj(pr);return;}
    if(pr.h<0.05||(TERR&&terrSolid(pr.x,pr.y,pr.h))||(PNL.length&&pr.h<bldMoundH(pr.x,pr.y))){pr.h=Math.max(pr.h,0.1);killProj(pr);return;}   // + ชนเนินซากบ้าน
    let hp=false;
    for(const c of sgNear(sgObs(),pr.x,pr.y,pr.r,_sgPO))if(c.bi===undefined&&!(c.bot!==undefined&&pr.h<c.bot)&&(c.top!==undefined?terrT(pr.x,pr.y)+pr.h<c.top:pr.h<c.hgt)&&obsD2(c,pr.x,pr.y)<(c.r+pr.r)**2){hp=true;if(c.cb!==undefined||c.ci!==undefined)cityHitObs(c,pr);if(c.sgw!==undefined)sgWallHit(c,pr);if(c.efs!==undefined)efsProj(c,pr);break;}
    if(!hp&&PROPON)for(const c of sgNear(sgProps(),pr.x,pr.y,pr.r,_sgPP))if(c.st!==1&&pr.h<c.hgt&&(pr.x-c.x)**2+(pr.y-c.y)**2<(c.r+pr.r)**2){hitProp(c,pr.dmg||5,pr.owner);hp=true;break;}
    if(!hp)for(const w of G.walls)if(w.hp>0&&pr.team!==w.team&&natureWallContains(w,pr.x,pr.y,pr.h,pr.r)){
      if(w.wood)natureWallDamage(w,pr.dmg||5,pr.x,pr.y,pr.owner,projEl(pr));else w.hp-=pr.dmg||5;
      hp=true;emit({k:'efx',z:'wallhit',x:pr.x,y:pr.y,h:pr.h});break;
    }
    if(!hp&&eProjHit(pr))hp=true;
    if(!hp&&windProjHit(pr,dt))hp=true;
    if(!hp&&pnlProj(pr,dt))hp=true;   // breakable panels (js/12-pnl)
    if(!hp&&cityProjIn(pr,dt))hp=true;   // ตึกกลวงในเมือง: ผนังนอกทีละแผ่น / พื้นชั้นบน / ทางลาด
    if(hp){killProj(pr);return;}
    for(const p of ps){
      if(!p.alive||p.downed||p.id===pr.owner||p.team===pr.team||(pr.hs&&pr.hs.has(p)))continue;
      if(darkShieldCross(p,prevX,prevY,prevH,pr.x,pr.y,pr.h)){
        pr.dead=true;emit({k:'block',x:pr.x,y:pr.y,h:pr.h,id:p.id});break;
      }
      if((p.x-pr.x)**2+(p.y-pr.y)**2>(PR+(pr.hw||pr.r))**2)continue;
      if(Math.abs(pr.h-cH(p))>vR(p)+pr.r/20)continue;
      if(p.inv>0)continue;
      if(p.pathIdx!==DARKP&&p.shieldOn&&shieldFaces(p,pr.x-pr.vx*0.05,pr.y-pr.vy*0.05,pr.h)){
        if(G.time-p.shieldT<0.28){
          // Perfect Parry: ปัดกระสุนทิ้ง (ไม่สะท้อนกลับแล้ว) ไม่เสียพลังโล่ + ผลพิเศษของแต่ละสาย
          pr.dead=true;pyroHeatGain(p,pr.dmg);pyroBlazeAct(p);
          if(!ultActive(p))p.ult=Math.min(100,p.ult+12*ULT_RATE);
          emit({k:'parry',x:p.x,y:p.y,h:p.z+1.3,id:p.id});
          {const B=PBASIC[p.pathIdx|0];if(B&&B.onParry&&!p.shPar){p.shPar=1;B.onParry(p);}}
        }else{
          pyroHeatGain(p,pr.dmg);pyroBlazeAct(p);if(p.pathIdx===EARTH)earthShHit(p,pr.dmg);else{p.shieldE-=pr.dmg*(lgOn(p)?lightShieldGauge(p):PBASIC[p.pathIdx|0]?.shMul||1.6);p.shBlk=(p.shBlk|0)+1;}pr.dead=true;emit({k:'block',x:pr.x,y:pr.y,h:pr.h,id:p.id});
          {const B=PBASIC[p.pathIdx|0];if(B&&B.onBlock)B.onBlock(p);}
          if(p.shieldE<=0)breakShield(p);
        }
        if(pr.type==='efist'||pr.type==='efistc')earthFistBreak(pr);
        break;
      }
      hitTarget(pr,p);if(pr.pierce){pr.hs.add(p);continue;}killProj(pr);break;
    }
    if(!pr.dead&&G.nature)for(const o of G.nature){
      if(!o.isM||o.team===pr.team||!natureLive(o)||G.time<o.ready||(pr.hs&&pr.hs.has(o)))continue;
      const top=o.natKind==='tree'?NAT.treeHeight:o.natKind==='lotus'?5:2;
      const h=pr.h+terrT(pr.x,pr.y)-natureY(o)-o.h;
      if(h<-.1||h>top||natureDist(o,pr)>o.r+(pr.hw||pr.r))continue;
      hitTarget(pr,o);if(pr.pierce){pr.hs.add(o);continue;}killProj(pr);break;
    }
    if(!pr.dead)for(const m of G.mins){
      if(m.dead||m.team===pr.team||(pr.hs&&pr.hs.has(m)))continue;
      const hc=m.type==='golem'?1.6:m.type==='wolf'?0.8:(m.h||0),tol=(m.type==='golem'?1.7:m.type==='wolf'?0.8:0.55)+pr.r/20;
      if((m.x-pr.x)**2+(m.y-pr.y)**2<(m.r+(pr.hw||pr.r))**2&&Math.abs(pr.h-hc)<tol){hitTarget(pr,m);if(pr.pierce){pr.hs.add(m);continue;}killProj(pr);break;}
    }
    if(pr.dead||pr.src!=='p')return;
    for(const e of G.en){
      if(e.dead||(pr.hs&&pr.hs.has(e)))continue;
      if((e.x-pr.x)**2+(e.y-pr.y)**2<(e.r+pr.r)**2&&Math.abs(pr.h-cH(e))<vR(e)+pr.r/20+0.2){hitTarget(pr,e);if(pr.pierce){pr.hs.add(e);continue;}killProj(pr);break;}
    }
}
