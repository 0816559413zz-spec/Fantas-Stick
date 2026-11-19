// =====================================================================
//  แผนที่ First Castle Strike (โหมดบุกปราสาท 'siege') — แบบ Basic จากภาพร่างของผู้ใช้ใน Map Editor
//  ข้อมูลดิบ js/02-fcs-data.js (node tools/fcs-export.js) • 1 ช่องใน Map Editor = FCS_C px (30 px = 1.5 ม. → เวลาเดินในเกมใกล้กับที่ Map Editor วัดไว้ที่ 6 ม./วิ)
//  ความสูง: ตารางพื้น TERR ละเอียดครึ่งช่อง (ต่าง 1 ระดับ/ช่อง = เนินเดินขึ้นได้ • ต่างมาก = หน้าผา) • กำแพง/ต้นไม้/ลัง/เสา = วงกลมชน OBS
//  ของในโหมด: จุดยึด (แกน) 3 จุด, จุดเกิดต่อเฟส, กำแพงพังได้ + ประตู (ตาราง FCS.bw) — กติกาอยู่ js/15-siege.js ภาพอยู่ js/28-fcs-build.js
// =====================================================================
const FCS_C=90;   // 1 ช่อง Map Editor = 90 px = 4.5 ม. (ผู้ใช้ 2026-11-08: ขยาย 3 เท่าจาก 30 เพราะสู้กันแล้วแคบ)
const FCS_WH=[0,6,1.2,1.1];   // ความสูงกำแพง (ม.) ตามชนิด: ทึบ / เตี้ย(กำบัง) / รั้ว
function genFcs(){
  const D=FCS_DATA,C=FCS_C,w=D.w,h=D.h,W=w*C,H=h*C,obs=[];
  const at=(s,x,y)=>parseInt(s[clamp(y,0,h-1)*w+clamp(x,0,w-1)],36)||0;
  const hc=(x,y)=>at(D.H,x,y)*D.lvl,wc=(x,y)=>x<0||y<0||x>=w||y>=h?0:at(D.W,x,y);
  // ตารางพื้น: จุดคี่ = กลางช่อง, จุดคู่ = ขอบช่อง (เฉลี่ยช่องที่ติดกัน)
  const c=C/2,nx=2*w+1,ny=2*h+1,g=new Float32Array(nx*ny);
  const cs=i=>i%2?[(i-1)/2]:[i/2-1,i/2];
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){let s=0,n=0;for(const a of cs(i))for(const b of cs(j)){s+=hc(clamp(a,0,w-1),clamp(b,0,h-1));n++;}g[j*nx+i]=s/n;}
  const terr={c,nx,ny,g,fl:[]};
  // กำแพงจากตาราง: วงกลมกลางช่อง + กลางรอยต่อกับช่องข้างที่เป็นกำแพงชนิดเดียวกัน (ไม่มีช่องลอด)
  const cell=(x,y,v,extra)=>{const r=C/2,nb=extra&&extra.nb,o=Object.assign({k:'fcw',hgt:FCS_WH[v],s:0},extra||{});delete o.nb;
    const same=(a,b)=>nb?nb(a,b):wc(a,b)===v;
    obs.push(Object.assign({x:(x+0.5)*C,y:(y+0.5)*C,r},o));
    if(same(x+1,y))obs.push(Object.assign({x:(x+1)*C,y:(y+0.5)*C,r},o));
    if(same(x,y+1))obs.push(Object.assign({x:(x+0.5)*C,y:(y+1)*C,r},o));};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=wc(x,y);if(v&&v!==3)cell(x,y,v);}
  // รั้วไม้ (ชนิด 3 ใน Map Editor — ผู้ใช้ 2026-11-18: เปลี่ยนกล่องเป็นรั้วจริง เตรียมระบบสภาพธาตุ designs/element-surfaces.md)
  // ช่องรั้วที่ติดกันแนวนอน/แนวตั้ง = รั้ว 1 แนว (เริ่ม-จบเลยกลางช่องปลาย 0.4 ช่อง) • ช่องเดี่ยว = รั้วสั้นแนวเหนือ-ใต้ • ชนเป็นแนวบาง (วงกลม r 11 ทุก ~0.9 ม.)
  // obs k:'fcf' + fid (รั้วแนวไหน — ใช้ต่อกับไฟ/ธาตุ) • fences: [x1,y1,x2,y2] พิกัด px ภาพอยู่ js/28-fcs-build.js fcsFences
  const fences=[];
  {const F3=(x,y)=>wc(x,y)===3,used=new Set();
   const seg=(ax,ay,bx,by)=>{const vx=bx-ax,vy=by-ay,L=Math.hypot(vx,vy)||1,ux=vx?vx/L:0,uy=vx?vy/L:1,fid=fences.length,
       x1=(ax+0.5)*C-ux*0.4*C,y1=(ay+0.5)*C-uy*0.4*C,x2=(bx+0.5)*C+ux*0.4*C,y2=(by+0.5)*C+uy*0.4*C;fences.push([x1,y1,x2,y2]);
     const n=Math.max(1,Math.round(Math.hypot(x2-x1,y2-y1)/18));for(let i=0;i<=n;i++)obs.push({x:x1+(x2-x1)*i/n,y:y1+(y2-y1)*i/n,r:11,k:'fcf',fid,hgt:FCS_WH[3],s:0});};
   for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(F3(x,y)&&!F3(x-1,y)&&F3(x+1,y)){let e=x;while(F3(e+1,y))e++;for(let i=x;i<=e;i++)used.add(i+','+y);seg(x,y,e,y);}
   for(let x=0;x<w;x++)for(let y=0;y<h;y++)if(F3(x,y)&&!F3(x,y-1)&&F3(x,y+1)){let e=y;while(F3(x,e+1))e++;for(let i=y;i<=e;i++)used.add(x+','+i);seg(x,y,x,e);}
   for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(F3(x,y)&&!used.has(x+','+y))seg(x,y,x,y);}
  const sp={A:{},B:{}},cores=[],bw=[],props=[],brkX=[];
  for(const [t,x,y,ow,oh,n] of D.objs){
    const cx=(x+ow/2)*C,cy=(y+oh/2)*C;
    if(t==='sa'||t==='sb')sp[t==='sa'?'A':'B'][n||1]={x:cx,y:cy};
    else if(t==='pt')cores[(n||cores.length+1)-1]={n:n||cores.length+1,x:cx,y:cy,s:Math.max(ow,oh)*C};
    else if(t==='bw'||t==='gt'){
      const i=bw.length,inR=(px,py)=>px>=x&&px<x+ow&&py>=y&&py<y+oh;
      bw.push({i,k:t==='gt'?'gate':'wall',x:x*C,y:y*C,w:ow*C,d:oh*C,h:t==='gt'?5:FCS_WH[1]});
      for(let yy=y;yy<y+oh;yy++)for(let xx=x;xx<x+ow;xx++)cell(xx,yy,1,{k:'fcb',sgw:i,hgt:bw[i].h,nb:inR});
    }else if(t==='tr'){obs.push({x:cx,y:cy,r:10,k:'fct',hgt:7,s:0});props.push(['tr',cx,cy]);}
    else if(t==='cr'){obs.push({x:cx,y:cy,r:14,k:'fcc',hgt:1.2,s:0});props.push(['cr',cx,cy]);}
    else if(t==='pl'){obs.push({x:cx,y:cy,r:13,k:'fcp',hgt:6,s:0});props.push(['pl',cx,cy]);}
  }
  // ซากปราสาทรอบจุดยึด 1 (ผู้ใช้ 2026-11-18: ฝ่ายบุกยึดกลางทุ่งโล่ง ฝ่ายรับยิงง่าย ไม่มีที่กำบัง) — สุ่ม seed คงที่ ทุกเครื่องเหมือนกัน
  // ผังจตุรัส ~22×22 ม. รอบแกน: ฝั่งตะวันออก (หันหาปราสาท/ฝ่ายรับ) สูงและยาวสุด มีช่องประตู + กำแพงบังด้านใน • เหนือ/ใต้เป็นท่อน ๆ • ตะวันตก (ฝั่งบุกเข้า) เหลือแค่ฐานเตี้ย
  // props: ['ru',x1,y1,x2,y2,หนา(px),[สูงต่อช่อง 1 ม.]] กำแพง • ['rt',x,y,รัศมี(px),สูง] หอพัง/เสา • ['rr',x,y,ขนาด] กองหินหล่น (ไม่ชน) — ภาพ js/28-fcs-forest.js fcsRuin
  {const k1=cores.find(k=>k.n===1);
   if(k1){const R=mulberry(551177),m=20,P=(a,b)=>[k1.x+a*m,k1.y+b*m];
    const wall=(a1,b1,a2,b2,th,h0,h1)=>{const [x1,y1]=P(a1,b1),[x2,y2]=P(a2,b2),L=Math.hypot(x2-x1,y2-y1),n=Math.max(1,Math.round(L/m)),hs=[];
      let h=h0+R()*(h1-h0);for(let i=0;i<n;i++){h=clamp(h+(R()-0.5)*1.4,h0,h1);if(i===0||i===n-1)h=Math.max(h0,h-0.6);hs.push(+(Math.round(h/0.55)*0.55).toFixed(2));}
      props.push(['ru',x1,y1,x2,y2,th,hs]);
      for(let i=0;i<n;i++){const t=(i+0.5)/n;obs.push({x:x1+(x2-x1)*t,y:y1+(y2-y1)*t,r:Math.max(th/2,13),k:'fcr',hgt:hs[i],s:0});}};
    const tower=(a,b,r,h)=>{const [x,y]=P(a,b);props.push(['rt',x,y,r,h]);obs.push({x,y,r,k:'fcr',hgt:h,s:0});};
    // ตะวันออก: สองท่อนสูง เว้นช่องประตูกลาง + กำแพงบังด้านในหลังช่อง
    wall(11,-11,11,-3,24,2.8,4.5);wall(11,2.5,11,11,24,2.8,4.5);wall(6,-4,6,3.5,20,1.7,2.4);
    // เหนือ: ท่อนตะวันตกเตี้ย-กลาง, ท่อนตะวันออกสูงต่อหอมุม
    wall(-11,-11,-4.5,-11,22,1.1,2.8);wall(1.5,-11,9,-11,22,2.2,4);
    // ใต้: ท่อนตะวันออกสูงกลาง ๆ ต่อหอมุม (ฝั่งตะวันตกมีกำแพงเดิมของแผนที่บังอยู่แล้ว)
    wall(1,10.5,9,10.5,22,1.7,3.3);
    // ตะวันตก (ทางเข้าฝ่ายบุก): ฐานเตี้ยกระท่อนกระแท่น
    wall(-11,-7,-11,-2,20,1.1,1.7);wall(-11,3,-11,6.5,20,1.1,1.7);
    // หอมุมพัง + เสาข้างใน (เสาบังตัวได้ 1 คน)
    tower(11,-11,46,5.5);tower(11,10.5,38,3.6);tower(-11,-11,30,2.6);
    for(const [a,b,h] of [[-4.5,-4.5,4.2],[-4.5,4.5,2.6],[1.5,-5.5,3.4],[1,5.5,1.9]])tower(a,b,15,h);
    // กองหินหล่นรอบฐานกำแพง (ภาพล้วน)
    for(let i=0;i<26;i++){const a=(R()-0.5)*26,b=(R()-0.5)*26;if(Math.abs(a)<8.5&&Math.abs(b)<8.5)continue;const [x,y]=P(a,b);props.push(['rr',x,y,+(0.6+R()*0.9).toFixed(2)]);}
   }}
  // L-shaped stone bridge (user 2026-11-19, designs/fcs_forest/brigde high ground test 1.png). High-ground walkway:
  // attacker end south (10.5,23) -> corner (10.5,2) -> defender end east (23,2) cells. Deck top = world 7 m (~6 m over ground),
  // 6 m wide, arches underneath (walk under between piers), crenellated parapet 1.2 m, ramp ~1:2.8 at each end.
  // Walk on top = TERR floor (terr.fl). Piers / corner block / ramp body = obs k:'fbr' (top = absolute world height).
  // Parapet merlons = obs k:'fbp' (top/bot so ground players pass under). Visual: fcsBridge (js/28-fcs-build.js).
  const bridge=(()=>{
    const hG=(px,py)=>{const fx=clamp(px/c,0,nx-1.001),fy=clamp(py/c,0,ny-1.001),i=fx|0,j=fy|0,u=fx-i,v=fy-j,k=j*nx+i;return (g[k]*(1-u)+g[k+1]*u)*(1-v)+(g[k+nx]*(1-u)+g[k+nx+1]*u)*v;};
    const DH=7,HW=60,ax=10.5*C,cy=2*C,yS=23*C,xE=23*C,slope=0.35;   // slope < 0.49: one 45 px floor step must stay under TSTEP
    const gS=hG(ax,yS+280),gE=hG(xE+400,cy),LS=Math.round((DH-gS)/slope*20/45)*45,LE=Math.round((DH-gE)/slope*20/45)*45;
    const B={DH,HW,ax,cy,yS,xE,LS,LE,gS,gE,
      ns:{x1:ax-HW,y1:cy-HW,x2:ax+HW,y2:yS},ew:{x1:ax-HW,y1:cy-HW,x2:xE,y2:cy+HW},
      rs:{x1:ax-HW,y1:yS,x2:ax+HW,y2:yS+LS},re:{x1:xE,y1:cy-HW,x2:xE+LE,y2:cy+HW},spans:[],par:[],parU:[]};
    const rampTop=(px,py)=>{let t;if(py>=yS&&py<=yS+LS&&Math.abs(px-ax)<=HW)t=(py-yS)/LS,t=DH+(gS-DH)*t;else if(px>=xE&&px<=xE+LE&&Math.abs(py-cy)<=HW)t=(px-xE)/LE,t=DH+(gE-DH)*t;else return NaN;return t;};
    B.rampTop=rampTop;
    // floor grid (aligned to the terrain lattice: c = 45 px)
    const X0=Math.floor((ax-HW-45)/45)*45,Y0=Math.max(0,Math.floor((cy-HW-45)/45)*45),X1b=Math.ceil((xE+LE+45)/45)*45,Y1b=Math.ceil((yS+LS+45)/45)*45;
    const fnx=(X1b-X0)/45+1,fny=(Y1b-Y0)/45+1,top=new Float32Array(fnx*fny).fill(NaN),bot=new Float32Array(fnx*fny).fill(NaN);
    const inR=(r,x,y)=>x>=r.x1-0.5&&x<=r.x2+0.5&&y>=r.y1-0.5&&y<=r.y2+0.5;
    for(let j=0;j<fny;j++)for(let i=0;i<fnx;i++){const x=X0+i*45,y=Y0+j*45,k=j*fnx+i,gr=hG(x,y);
      if(inR(B.ns,x,y)||inR(B.ew,x,y)){top[k]=DH;bot[k]=DH-1.2;continue;}
      const t=rampTop(x,y);if(t===t&&t-gr>0.05){top[k]=t;bot[k]=Math.min(gr,t-0.01);}}
    terr.fl.push({x0:X0,y0:Y0,nx:fnx,ny:fny,top,bot,k:'bridge'});
    const ob=(x,y,r,tp)=>obs.push({x,y,r,k:'fbr',top:tp,hgt:tp,s:0});
    // arch spans: NS from corner block south edge to the south ramp; EW from corner block east edge to the east ramp
    const runs=[[ax,cy+HW,ax,yS],[ax+HW,cy,xE,cy]];
    for(const [x1,y1,x2,y2] of runs){const L=Math.hypot(x2-x1,y2-y1),n=Math.max(1,Math.round(L/20/8)),ux=(x2-x1)/L,uy=(y2-y1)/L;
      for(let i=0;i<n;i++)B.spans.push({x1:x1+ux*L*i/n,y1:y1+uy*L*i/n,x2:x1+ux*L*(i+1)/n,y2:y1+uy*L*(i+1)/n});
      for(let i=1;i<n;i++){const px=x1+ux*L*i/n,py=y1+uy*L*i/n;for(const o of [-36,0,36])ob(px-uy*o,py+ux*o,24,DH-0.1);}}   // piers (1.6 m thick, full width)
    for(const a of [-40,0,40])for(const b of [-40,0,40])ob(ax+a,cy+b,30,DH-0.1);   // corner block
    // ramp side walls only (thin circles on both edges): the middle lane stays clear so the floor can lift players up
    for(const R0 of [B.rs,B.re]){const alongY=R0===B.rs,L=alongY?LS:LE;for(let d=7;d<L;d+=14)for(const o of [-56,56]){const x=alongY?ax+o:xE+d,y=alongY?yS+d:cy+o,t=rampTop(alongY?ax:x,alongY?y:cy);if(t-hG(x,y)>0.3)ob(x,y,8,t);}}
    // parapet: merlon every 1.6 m on the outer edges (no parapet across the ramp mouths)
    const lines=[[ax-HW+6,cy-HW,ax-HW+6,yS],[ax+HW-6,cy+HW,ax+HW-6,yS],[ax-HW,cy-HW+6,xE,cy-HW+6],[ax+HW,cy+HW-6,xE,cy+HW-6]];
    const outN=[[-1,0],[1,0],[0,-1],[0,1]];   // outward side of each parapet line
    for(const [li,[x1,y1,x2,y2]] of lines.entries()){const L=Math.hypot(x2-x1,y2-y1),n=Math.max(1,Math.round(L/32));B.par.push([x1,y1,x2,y2,n]);
      for(let i=0;i<n;i++){const t=(i+0.5)/n,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t,k=B.parU.length,z0=DH-hG(x,y);
        B.parU.push({x,y,a:Math.atan2(y2-y1,x2-x1),seg:L/n,nx:outN[li][0],ny:outN[li][1]});
        // each merlon + its base wall = one breakable unit (cover destruction rules, js/12-buildings.js BRK) • hgt = piece height, top = absolute
        brkX.push({h:1.2,vh:1.2,v:0.74,m:'stone',n:'parapet',z0,fp:k});
        obs.push({x,y,r:12,k:'fbp',top:DH+1.2,hgt:1.2,bot:z0-0.3,b:k,s:0});}}
    // footprint test (px margin m): keeps trees / rocks / clutter out
    B.at=(x,y,m)=>[B.ns,B.ew,B.rs,B.re].some(r=>x>r.x1-m&&x<r.x2+m&&y>r.y1-m&&y<r.y2+m);
    return B;})();
  // ป่าทึบ (เฟส 1, ช่อง x<28): ต้นไม้/หินชนได้เพิ่มจากที่ผู้ใช้วาง (ผู้ใช้ 2026-11-18 "denser and solid") — สุ่มด้วย seed คงที่ ทุกเครื่องได้ผลเดียวกัน
  // props: ['tr',x,y,1] ต้นในป่าเพิ่ม • ['te',x,y] ผนังต้นไม้ขอบแผนที่ • ['bd',x,y,ชนิด,ขนาด] หินก้อนใหญ่ — ภาพอยู่ js/28-fcs-forest.js
  {const R=mulberry(918273),X1=28*C,hAt=(px,py)=>{const fx=clamp(px/c,0,nx-1.001),fy=clamp(py/c,0,ny-1.001),i=fx|0,j=fy|0,u=fx-i,v=fy-j,k=j*nx+i;return (g[k]*(1-u)+g[k+1]*u)*(1-v)+(g[k+nx]*(1-u)+g[k+nx+1]*u)*v;};
   const slope=(x,y)=>Math.hypot(hAt(x+30,y)-hAt(x-30,y),hAt(x,y+30)-hAt(x,y-30))/3;
   const spL=[];for(const t of ['A','B'])for(const k in sp[t])spL.push(sp[t][k]);
   const trail=[[3,40],[4,36],[7,32],[10,28],[12,24],[14,19],[17,15],[20,13.5],[24,14],[28,14]].map(([a,b])=>[(a+0.5)*C,(b+0.5)*C]);
   const dSeg=(x,y)=>{let m=1e9;for(let i=1;i<trail.length;i++){const [ax,ay]=trail[i-1],[bx,by]=trail[i],dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy),0,1);m=Math.min(m,Math.hypot(x-ax-t*dx,y-ay-t*dy));}return m;};
   const solid=props.map(q=>[q[1],q[2],q[0]==='tr'?100:70]);
   const ok=(x,y,gap)=>x>20&&y>20&&x<X1-30&&y<H-20&&!wc(Math.floor(x/C),Math.floor(y/C))&&!wc(Math.floor((x+25)/C),Math.floor(y/C))&&!wc(Math.floor((x-25)/C),Math.floor(y/C))
     &&!spL.some(s=>Math.hypot(s.x-x,s.y-y)<300)&&!cores.some(k=>Math.hypot(k.x-x,k.y-y)<330)&&!bw.some(b=>x>b.x-60&&x<b.x+b.w+60&&y>b.y-60&&y<b.y+b.d+60)
     &&!solid.some(([sx,sy,r])=>Math.hypot(sx-x,sy-y)<Math.max(r,gap))&&!bridge.at(x,y,gap>=100?100:30);
   const add=(k,x,y,r,hg,extra)=>{obs.push({x,y,r,k,hgt:hg,s:0});props.push([k==='fcb2'?'bd':k==='fce'?'te':'tr',x,y,...(extra||[])]);solid.push([x,y,r+60]);};
   // ผนังต้นไม้รอบขอบ 2 แถว
   for(let row=0;row<2;row++){const d0=40+row*90;
     for(let y=60;y<H-40;y+=70+R()*30){const x=d0+R()*50;if(ok(x,y,70))add('fce',x,y,12,7);}
     for(let x=120;x<X1-150;x+=70+R()*30){for(const y of [d0+R()*40,H-d0-R()*40])if(ok(x,y,70))add('fce',x,y,12,7);}}
   // ต้นไม้เพิ่มในป่า (ห่างกัน ≥ 5 ม., เว้นทางดินกว้าง ~6 ม.)
   for(let t=0,n=0;t<6000&&n<170;t++){const x=40+R()*(X1-80),y=40+R()*(H-80);if(dSeg(x,y)<120||!ok(x,y,100))continue;add('fct',x,y,10,7,[1]);n++;}
   // หินก้อนใหญ่ตามไหล่เนิน (ชนได้) • ชนิด 0-3 boulder_a-d, 4 cliff_a • รัศมีชน ≈ ครึ่งกว้างโมเดล × ขนาด
   const BD=[[2.3,2.7],[1.3,1.6],[1.1,1.3],[0.9,1.2],[3.9,5.4]];
   for(let t=0,n=0;t<4000&&n<46;t++){const x=60+R()*(X1-120),y=60+R()*(H-120);if(slope(x,y)<0.28||dSeg(x,y)<90)continue;
     const ty=[0,1,2,3,0,4][(R()*6)|0],s=0.7+R()*0.6,r=Math.max(14,BD[ty][0]*s*20*0.75);if(!ok(x,y,r+50))continue;add('fcb2',x,y,r,BD[ty][1]*s,[ty,+s.toFixed(3)]);n++;}
  }
  // user-placed trees/rocks under the bridge: drop them (crowns would poke through the deck)
  for(let i=obs.length-1;i>=0;i--){const o=obs[i];if((o.k==='fct'||o.k==='fcb2')&&bridge.at(o.x,o.y,o.k==='fct'?100:60))obs.splice(i,1);}
  for(let i=props.length-1;i>=0;i--){const q=props[i];if((q[0]==='tr'||q[0]==='bd')&&bridge.at(q[1],q[2],q[0]==='tr'?100:60))props.splice(i,1);}
  for(const k of cores)obs.push({x:k.x,y:k.y,r:40,k:'fck',hgt:6,s:0});   // ตัวแกน (คริสตัล) ชนได้
  // เฟส: โซนชนิด "เฟส" ชื่อ "เฟส N" หลายกรอบรวมกัน = พื้นที่เล่นของเฟส N
  const phases=[];
  for(const [k,name,x,y,zw,zh] of D.zones){if(k!=='ph')continue;const n=+((String(name).match(/(\d+)/)||[])[1]||0);if(!n)continue;
    (phases[n-1]=phases[n-1]||[]).push({x1:x*C,y1:y*C,x2:(x+zw)*C,y2:(y+zh)*C});}
  return {W,H,obs,terr,brkX,fcs:{sp,cores,bw,props,fences,bridge,phases,n:Math.min(cores.length,phases.length)}};
}
// ---------- พื้นที่เล่นตามเฟส (กำแพงล่องหน) + เขตจุดเกิดปลอดภัย — ใช้ทั้งโฮสต์ (G.sg.ph) และลูกข่าย (snapshot) ----------
let SGPH=1;
const SG_SPR=220;   // รัศมีเขตจุดเกิด (px): ศัตรูเข้าไม่ได้ • คนในทีมที่อยู่ข้างในไม่โดนดาเมจ (js/15-siege) ⚠ ค่าตั้งต้น
const _sgAreaC=[];
function sgArea(ph){
  const F=MAPS.fcs.fcs,k=clamp(ph|0,1,F.n);
  if(!_sgAreaC[k])_sgAreaC[k]={sg:k,rects:F.phases[k-1],sp:[[F.sp.A[k],0],[F.sp.B[k],1]].filter(q=>q[0]).map(([q,t])=>({x:q.x,y:q.y,r:SG_SPR,t}))};
  return _sgAreaC[k];
}
// ดันกลับเข้าพื้นที่ (เรียกจาก areaClamp js/02-city) • o.team = ผู้เล่น (ดันออกจากเขตจุดเกิดของอีกทีม) • ไม่มี team = ช่องตารางทางเดินบอท
function sgClamp(o,r,A){
  const x=o.x,y=o.y;
  if(o.team===0||o.team===1)for(const s of A.sp){if(s.t===o.team)continue;const dx=o.x-s.x,dy=o.y-s.y,d=Math.hypot(dx,dy),m=s.r+r;if(d<m){const a=d>0.01?Math.atan2(dy,dx):1;o.x=s.x+Math.cos(a)*m;o.y=s.y+Math.sin(a)*m;}}
  const R=A.rects;
  if(!R.some(q=>o.x>=q.x1&&o.x<=q.x2&&o.y>=q.y1&&o.y<=q.y2)){
    let bx=o.x,by=o.y,bd=1e18;
    for(const q of R){const px=clamp(o.x,q.x1+r,q.x2-r),py=clamp(o.y,q.y1+r,q.y2-r),d=(px-o.x)**2+(py-o.y)**2;if(d<bd){bd=d;bx=px;by=py;}}
    o.x=bx;o.y=by;}
  return o.x!==x||o.y!==y;
}
function sgInArea(x,y,ph){return sgArea(ph).rects.some(q=>x>=q.x1&&x<=q.x2&&y>=q.y1&&y<=q.y2);}
MAPS.fcs=Object.assign({name:'🏰 ปราสาท First Castle Strike',d:'แผนที่โหมดบุกปราสาท (แบบ Basic) — บุก 3 เฟส ทำลายแกนทีละจุด',build:'fcs',only:'siege',navTerr:1,navC:FCS_C},genFcs());
MAPS.fcs.areas={get siege(){return sgArea(SGPH);}};
// จุดเกิดของเฟสปัจจุบัน (teamPts / placeAll / respawn ใช้ผ่าน fmap) • t 0 = ฝ่ายบุก 1 = ฝ่ายรับ
MAPS.fcs.fmFor=mode=>{const F=MAPS.fcs.fcs,k=clamp(SGPH,1,F.n),a=F.sp.A[k],b=F.sp.B[k];
  const ring=(q,t)=>q?[0,1,2,3,4,5].map(i=>i?{x:q.x+Math.cos(i*1.047)*80,y:q.y+Math.sin(i*1.047)*80,t}:{x:q.x,y:q.y,t}):[];   // 6 จุดชิดกันในเขตจุดเกิด (คนละจุดต่อคน ไม่กระจายข้ามกำแพง)
  return {spawns:[...ring(a,0),...ring(b,1)],tasks:[],rings:[],espawn:[]};};
