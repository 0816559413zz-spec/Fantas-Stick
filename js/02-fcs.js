// =====================================================================
//  แผนที่ First Castle Strike (โหมดบุกปราสาท 'siege') — แบบ Basic จากภาพร่างของผู้ใช้ใน Map Editor
//  ข้อมูลดิบ js/02-fcs-data.js (node tools/fcs-export.js) • 1 ช่องใน Map Editor = FCS_C px (30 px = 1.5 ม. → เวลาเดินในเกมใกล้กับที่ Map Editor วัดไว้ที่ 6 ม./วิ)
//  ความสูง: ตารางพื้น TERR ละเอียดครึ่งช่อง (ต่าง 1 ระดับ/ช่อง = เนินเดินขึ้นได้ • ต่างมาก = หน้าผา) • กำแพง/ต้นไม้/ลัง/เสา = วงกลมชน OBS
//  ของในโหมด: จุดยึด (แกน) 3 จุด, จุดเกิดต่อเฟส, กำแพงพังได้ + ประตู (ตาราง FCS.bw) — กติกาอยู่ js/15-siege.js ภาพอยู่ js/28-fcs-build.js
// =====================================================================
const FCS_C=30;
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
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=wc(x,y);if(v)cell(x,y,v);}
  const sp={A:{},B:{}},cores=[],bw=[],props=[];
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
  for(const k of cores)obs.push({x:k.x,y:k.y,r:22,k:'fck',hgt:3.2,s:0});   // ตัวแกน (คริสตัล) ชนได้
  // เฟส: โซนชนิด "เฟส" ชื่อ "เฟส N" หลายกรอบรวมกัน = พื้นที่เล่นของเฟส N
  const phases=[];
  for(const [k,name,x,y,zw,zh] of D.zones){if(k!=='ph')continue;const n=+((String(name).match(/(\d+)/)||[])[1]||0);if(!n)continue;
    (phases[n-1]=phases[n-1]||[]).push({x1:x*C,y1:y*C,x2:(x+zw)*C,y2:(y+zh)*C});}
  return {W,H,obs,terr,fcs:{sp,cores,bw,props,phases,n:Math.min(cores.length,phases.length)}};
}
// ---------- พื้นที่เล่นตามเฟส (กำแพงล่องหน) + เขตจุดเกิดปลอดภัย — ใช้ทั้งโฮสต์ (G.sg.ph) และลูกข่าย (snapshot) ----------
let SGPH=1;
const SG_SPR=110;   // รัศมีเขตจุดเกิด (px): ศัตรูเข้าไม่ได้ • คนในทีมที่อยู่ข้างในไม่โดนดาเมจ (js/15-siege) ⚠ ค่าตั้งต้น
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
MAPS.fcs=Object.assign({name:'🏰 ปราสาท First Castle Strike',d:'แผนที่โหมดบุกปราสาท (แบบ Basic) — บุก 3 เฟส ทำลายแกนทีละจุด',build:'fcs',only:'siege',navTerr:1,navC:30},genFcs());
MAPS.fcs.areas={get siege(){return sgArea(SGPH);}};
// จุดเกิดของเฟสปัจจุบัน (teamPts / placeAll / respawn ใช้ผ่าน fmap) • t 0 = ฝ่ายบุก 1 = ฝ่ายรับ
MAPS.fcs.fmFor=mode=>{const F=MAPS.fcs.fcs,k=clamp(SGPH,1,F.n),a=F.sp.A[k],b=F.sp.B[k];
  const ring=(q,t)=>q?[0,1,2,3,4,5].map(i=>i?{x:q.x+Math.cos(i*1.047)*55,y:q.y+Math.sin(i*1.047)*55,t}:{x:q.x,y:q.y,t}):[];   // 6 จุดชิดกันในเขตจุดเกิด (คนละจุดต่อคน ไม่กระจายข้ามกำแพง)
  return {spawns:[...ring(a,0),...ring(b,1)],tasks:[],rings:[],espawn:[]};};
