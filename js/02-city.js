// ---------- เมืองมักเกิ้ล — กล่องเทา (designs/city-bot-battle.md ขั้น 3) ----------
// 9600 × 9600 px (480 × 480 ม.) • ถนนกว้าง CITY_ROAD ทุก CITY_B px → 4×4 บล็อก • แต่ละบล็อก = 1 ย่าน (CITY_PLAN) • ลานใหญ่กลางเมือง (จุดเกิด)
// ตึก = กล่องตั้งตรง (boxes: x,y = มุมซ้ายบน px, w,d px, h ม., m = ชนิดผนัง) — ชนด้วยวงกลมเรียงรอบขอบ (OBS k:'cwall') เพราะระบบชนทั้งเกมใช้วงกลม
// บ้านในย่านบ้าน = บ้านพังได้แบบเดิม (OBS k:'house') • ต้นไม้/ลัง = prop พังได้ • ตึก/รถ/ตู้คอนเทนเนอร์ยังไม่พัง (ขั้น 4)
// ทางด่วนลอย = พื้นสะพานเป็นแค่ภาพ (ยังเดินขึ้นไม่ได้ ลอดใต้ได้ ชนแค่เสา) • น้ำที่ท่าเรือ = ภาพบนพื้น (เดินได้)
const CITY_PLAN=[   // [แถว][คอลัมน์] จากทิศเหนือ (y น้อย) ลงใต้
  ['park','homes','homes','docks'],
  ['station','plaza','shops','warehouse'],
  ['parking','towers','towers','build'],
  ['field','homes','highway','bridge']];
const CITY_ZN={park:'สวนสาธารณะ',homes:'ย่านบ้าน',docks:'ท่าเรือ',station:'สถานีรถไฟ',plaza:'ลานใหญ่',shops:'ย่านร้านค้า',warehouse:'โกดัง',parking:'ลานจอดรถ',towers:'ตึกสูง',build:'ไซต์ก่อสร้าง',field:'สนามกีฬา',highway:'ทางด่วนลอย',bridge:'ใต้สะพาน'};
const CITY_PLAZA=1000;   // รัศมีลานกลาง (px) — ห้ามมีของ
function genCity(){
  const W=CITY_N*CITY_B,H=W,R=mulberry(4810),mid=W/2,obs=[],boxes=[],zones=[],deck=[],taken=[];
  // จุดเกิดทั่วไป (ดวล/ทีม/FFA) ต้องโล่ง
  const keep=[[mid,mid,CITY_PLAZA],...SPAWNF.map(f=>[f[0]*W,f[1]*H,260]),[W*0.14,H/2,260],[W*0.86,H/2,260]];
  const clear=(x,y,w,d)=>!keep.some(([cx,cy,r])=>cx>x-r&&cx<x+w+r&&cy>y-r&&cy<y+d+r)&&![...boxes,...taken].some(b=>x<b.x+b.w+10&&x+w+10>b.x&&y<b.y+b.d+10&&y+d+10>b.y);
  const box=(x,y,w,d,h,m,o)=>{x=Math.round(x);y=Math.round(y);w=Math.round(w);d=Math.round(d);if(!clear(x,y,w,d))return null;const b=Object.assign({i:boxes.length,x,y,w,d,h,m},o);boxes.push(b);return b;};
  const house=(x,y,ry)=>{const w=150+R()*40,d=120+R()*30;if(!clear(x-w/2,y-w/2,w,w))return;obs.push({x,y,r:Math.max(w,d)/2,k:'house',hgt:10,w,d,s:R(),ry});taken.push({x:x-w/2,y:y-w/2,w,d:w});};
  const pillar=(x,y,r,h)=>obs.push({x,y,r,k:'cpill',hgt:h,s:0});
  for(let by=0;by<CITY_N;by++)for(let bx=0;bx<CITY_N;bx++){
    const k=CITY_PLAN[by][bx],S=CITY_B-CITY_ROAD,x0=bx*CITY_B+CITY_ROAD/2,y0=by*CITY_B+CITY_ROAD/2,P=60;   // P = ทางเท้ารอบบล็อก
    zones.push({k,n:CITY_ZN[k],x:x0,y:y0,w:S,d:S});
    const a=x0+P,b=y0+P,s=S-2*P;
    if(k==='homes'){   // บ้านพังได้ 2 แถวหันหน้าออกถนน + แถวกลาง
      for(let i=0;i<4;i++){const t=a+s*(i+0.5)/4;house(t,b+110,Math.PI);house(t,b+s-110,0);house(t,b+s/2+(i%2?-160:160),i%2?Math.PI:0);}
      for(let i=1;i<3;i++){const t=b+s*i/3;house(a+110,t,-Math.PI/2);house(a+s-110,t,Math.PI/2);}
    }else if(k==='shops'){   // ตึกแถว 2–3 ชั้นชิดถนนรอบบล็อก ตรงกลางเป็นลานหลังร้าน
      for(const side of [0,1,2,3])for(let i=0;i<5;i++){const L=s/5,h=7+Math.floor(R()*2)*3.5,dd=260;
        if(side<2)box(a+i*L+8,side?b+s-dd:b,L-16,dd,h,R()<0.5?'shop':'brick');else{const L2=(s-2*dd-40)/5;box(side===2?a:a+s-dd,b+dd+20+i*L2+8,dd,L2-16,h,R()<0.5?'shop':'brick');}}
    }else if(k==='towers'){   // ตึกสูง 2×2 + ตัวไฮไลต์ (ถล่มทั้งตึก — ขั้น 7) ที่บล็อกขวา
      const hl=bx===2;
      for(const [i,j] of [[0,0],[1,0],[0,1],[1,1]]){const w=560+R()*120,d=560+R()*120,x=a+(i?s-w-40:40),y=b+(j?s-d-40:40);
        box(x,y,w,d,hl&&i===1&&j===1?72:28+Math.floor(R()*5)*6,R()<0.5?'glass':'office',hl&&i===1&&j===1?{hl:1}:null);}
      for(let n=0;n<4;n++)box(a+s/2-60+(R()-0.5)*300,b+s/2-40+(R()-0.5)*300,120,80,3,'kiosk');
    }else if(k==='station'){   // อาคารสถานียาว + รางกับตู้รถไฟจอด
      box(a+80,b+120,s-160,420,13,'station');
      for(let i=0;i<5;i++)box(a+120+i*370,b+700,340,60,4.2,'train');
      for(let i=0;i<4;i++)box(a+300+i*420,b+1100,340,60,4.2,'train');
      for(let i=0;i<6;i++)box(a+100+i*300,b+s-420,200,260,7,'brick');
    }else if(k==='warehouse'){   // โกดังใหญ่ 3 หลัง + ตู้คอนเทนเนอร์
      box(a+60,b+80,820,560,12,'metal');box(a+s-880,b+80,820,560,12,'metal');box(a+60,b+s-660,1000,560,14,'metal');
      for(let i=0;i<8;i++)box(a+s-760+(i%2)*260,b+s-700+Math.floor(i/2)*170,240,100,i%3?2.6:5.2,'cont');
    }else if(k==='docks'){   // ท่าเรือ: ฝั่งตะวันออกเป็นน้ำ (ภาพ) + ตู้คอนเทนเนอร์เรียงชั้น + โกดังเล็ก
      zones[zones.length-1].water={x:a+s*0.62,y:y0,w:x0+S-(a+s*0.62)+CITY_ROAD/2,d:S};
      for(let i=0;i<14;i++)box(a+60+(i%4)*270,b+80+Math.floor(i/4)*300,240,100,(i*7%3)?2.6:5.2,'cont');
      box(a+60,b+s-520,800,440,10,'metal');
      for(let i=0;i<4;i++)pillar(a+s*0.6,b+200+i*500,40,1.2);   // หลักผูกเรือ
    }else if(k==='parking'){   // ลานจอดรถ: รถเป็นแถว เว้นทางวิ่ง + อาคารจอดรถ
      for(let r=0;r<5;r++)for(let c=0;c<9;c++)if(R()<0.72)box(a+60+c*130,b+80+r*240,90,46,1.6,'car');
      box(a+s-640,b+60,600,s-120,10.5,'garage');
    }else if(k==='build'){   // ไซต์ก่อสร้าง: เสาตอม่อเป็นตาราง + กำแพงครึ่งตัว + ปั้นจั่น
      for(let i=0;i<5;i++)for(let j=0;j<4;j++)pillar(a+200+i*220,b+200+j*220,26,i===2&&j===1?46:6+((i+j)%3)*4);
      box(a+100,b+s-500,700,60,1.4,'concrete');box(a+100,b+s-500,60,400,1.4,'concrete');
      for(let i=0;i<6;i++)box(a+s-560+(i%2)*260,b+200+Math.floor(i/2)*360,220,90,2.6,'cont');
      box(a+s-500,b+s-560,420,420,3.5,'concrete');   // ฐานรากเทแล้ว
    }else if(k==='highway'||k==='bridge'){   // ทางด่วนลอยวิ่งตะวันออก-ตะวันตกผ่าน 2 บล็อกนี้ (พื้นสะพานเป็นภาพ สูง 8 ม.)
      const yc=b+s/2;for(let x=x0-CITY_ROAD/2+150;x<x0+S+CITY_ROAD/2;x+=400)for(const sd of [-1,1])pillar(x,yc+sd*120,42,8);
      deck.push({x:x0-CITY_ROAD/2,y:yc-200,w:S+CITY_ROAD,d:400,h:8});
      if(k==='highway'){for(let i=0;i<4;i++){box(a+60+i*480,b+60,400,520,7,'brick');box(a+60+i*480,b+s-580,400,520,10.5,'office');}}
      else{for(let i=0;i<7;i++)box(a+80+(i%4)*300,b+200+Math.floor(i/4)*1250,240,100,2.6,'cont');box(a+s-520,b+s-520,460,440,7,'metal');}
    }else if(k==='field'){   // สนามฟุตบอล + อัฒจันทร์
      box(a+120,b+80,s-240,180,4.5,'stand');box(a+120,b+s-260,s-240,180,4.5,'stand');
    }else if(k==='plaza'){   // ย่านลานใหญ่: ลานวงกลมแตะมุมบล็อก (keep) + ตึกรอบนอก
      box(a+40,b+40,520,420,17.5,'office');box(a+640,b+40,400,300,10.5,'shop');box(a+40,b+540,360,460,10.5,'brick');
    }
  }
  // วงกลมชนรอบขอบตึก (ขอบนอกของวง = ขอบกล่อง) — ห่าง 50 px รัศมี 36 = ไม่มีช่องลอด
  const r=36,step=50;
  for(const B of boxes){
    const x0=B.x+r,y0=B.y+r,x1=B.x+B.w-r,y1=B.y+B.d-r,line=(ax,ay,bx2,by2)=>{const L=Math.hypot(bx2-ax,by2-ay),n=Math.max(1,Math.ceil(L/step));for(let i=0;i<n;i++)obs.push({x:ax+(bx2-ax)*i/n,y:ay+(by2-ay)*i/n,r:Math.min(r,B.w/2,B.d/2),k:'cwall',hgt:B.h,s:0,cb:B.i});};
    if(x1<=x0||y1<=y0){line(Math.min(x0,x1),Math.min(y0,y1),Math.max(x0,x1),Math.max(y0,y1));obs.push({x:Math.max(x0,x1),y:Math.max(y0,y1),r:Math.min(r,B.w/2,B.d/2),k:'cwall',hgt:B.h,s:0,cb:B.i});continue;}
    line(x0,y0,x1,y0);line(x1,y0,x1,y1);line(x1,y1,x0,y1);line(x0,y1,x0,y0);}
  // ของในเมืองแบบลอนดอน: street = {m:ชื่อโมเดล (city_cp_<m>),x,y,a} • a = rotation.y (หน้าโมเดล +z → ทิศโลก (sin a, cos a))
  // ที่ชน k:'cprop' = วงกลมเรียงตามแนวยาวของของชิ้นนั้น: SPC[m] = [ระยะวงตามแนวยาว px, รัศมี px, สูง ม., แกนยาว 'z' (รถ) | 'x' (ม้านั่ง/ป้าย)] • null = ไม่ชน (ภาพอย่างเดียว)
  // ยังไม่พัง (ขั้น 4)
  const street=[],RS=mulberry(2031),SPC={lamp:[[0],5,4.6],phone:[[0],22,2.6],postbox:[[0],9,1.6],bench:[[0],18,0.9],taxi:[[-24,24],20,1.8],bus:[[-80,-40,0,40,80],25,4.4],
    tlight:[[0],6,3.3],busstop:[[-35,35],10,2.5,'x'],bin:[[0],8,1],tube:[[0],5,3.4],planter:[[-18,18],12,0.6,'x'],bush:[[0],22,1.2],cone:[[0],6,0.7],barrier:[[-18,18],6,1,'x'],pallet:[[0],14,1],boat:null,crane:null};
  const free=(x,y,r)=>!boxes.some(b=>x>b.x-r&&x<b.x+b.w+r&&y>b.y-r&&y<b.y+b.d+r)&&!obs.some(o=>Math.abs(x-o.x)<(o.w||o.r*2)/2+r&&Math.abs(y-o.y)<(o.w||o.r*2)/2+r);
  const sprop=(m,x,y,a,inPlaza)=>{if(!inPlaza&&Math.hypot(x-mid,y-mid)<CITY_PLAZA+60)return false;street.push({m,x:Math.round(x),y:Math.round(y),a});const C=SPC[m];if(!C)return true;
    const lx=C[3]==='x'?Math.cos(a):Math.sin(a),ly=C[3]==='x'?-Math.sin(a):Math.cos(a);
    for(const t of C[0])obs.push({x:x+lx*t,y:y+ly*t,r:C[1],k:'cprop',hgt:C[2],s:0});return true;};
  for(const z of zones)if(z.k==='shops'){
    const e=30,sides=[[z.x,z.y+e,1,0,Math.PI],[z.x,z.y+z.d-e,1,0,0],[z.x+e,z.y,0,1,-Math.PI/2],[z.x+z.w-e,z.y,0,1,Math.PI/2]];   // ทางเท้า 4 ด้าน: จุดเริ่ม, ทิศเดิน, มุมหันหน้าออกถนน
    for(const [sx,sy,dx,dy,fa] of sides){
      const L=dx?z.w:z.d,out=fa;   // a = rotation.y ของโมเดล (หน้า +z → ทิศโลก (sin a, cos a)) หันออกถนน
      for(let t=160;t<L-100;t+=320)sprop('lamp',sx+dx*t,sy+dy*t,out);
      const pick=['phone','postbox','bench','bench'];
      for(let i=0;i<pick.length;i++){const t=320+i*400+RS()*120;if(t>L-200)break;sprop(pick[i],sx+dx*t+(dx?0:(sx<z.x+z.w/2?14:-14)),sy+dy*t+(dy?0:(sy<z.y+z.d/2?14:-14)),out);}
      for(let i=0;i<2;i++){const t=520+i*700+RS()*200;if(t>L-300)break;const rx=sx+dx*t-(dx?0:(sx<z.x+z.w/2?95:-95)),ry=sy+dy*t-(dy?0:(sy<z.y+z.d/2?95:-95));
        sprop('taxi',rx,ry,dx?Math.PI/2:0);}
    }
  }
  // เสาไฟ + ถังขยะ ริมทางเท้าทุกถนน (ย่านร้านค้ามีเสาไฟของตัวเองแล้ว) • ลานกลาง: วงเสาไฟ
  const zoneAt=(x,y)=>zones.find(z=>x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.d);
  for(let k=1;k<CITY_N;k++)for(let s=CITY_ROAD/2+150;s<W;s+=500){if(Math.abs(s%CITY_B)<CITY_ROAD/2+60||Math.abs(s%CITY_B-CITY_B)<CITY_ROAD/2+60)continue;
    for(const sd of [-1,1]){const c=k*CITY_B+sd*(CITY_ROAD/2+18);
      for(const [px,py,vert] of [[c,s,1],[s,c,0]]){const zz=zoneAt(px+(vert?sd*60:0),py+(vert?0:sd*60));if(zz&&zz.k==='shops')continue;
        sprop('lamp',px,py,0);if(RS()<0.45){const bx2=vert?px:px+250,by2=vert?py+250:py;if(free(bx2,by2,10))sprop('bin',bx2,by2,0);}}}}
  for(let i=0;i<16;i++){const t=i/16*Math.PI*2;sprop('lamp',mid+Math.cos(t)*(CITY_PLAZA-40),mid+Math.sin(t)*(CITY_PLAZA-40),0,1);}
  // ไฟจราจร 4 มุมทุกสี่แยก (ยกเว้นสี่แยกกลาง = ลาน) หันหน้าเข้ากลางแยก
  for(let i=1;i<CITY_N;i++)for(let j=1;j<CITY_N;j++){if(i===CITY_N/2&&j===CITY_N/2)continue;const cx=i*CITY_B,cy=j*CITY_B;
    for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const x=cx+sx*(CITY_ROAD/2+25),y=cy+sy*(CITY_ROAD/2+25);sprop('tlight',x,y,Math.atan2(cx-x,cy-y));}}
  // ป้ายรถเมล์ + รถเมล์จอด (สุ่ม ~1 ใน 3 ของช่วงถนน)
  for(let k=1;k<CITY_N;k++)for(let b2=0;b2<CITY_N;b2++){if(RS()>0.38)continue;const s=b2*CITY_B+CITY_B/2+(RS()-0.5)*600,sd=RS()<0.5?-1:1,vert=RS()<0.5,c=k*CITY_B+sd*(CITY_ROAD/2+30);
    const [x,y]=vert?[c,s]:[s,c];if(Math.hypot(x-mid,y-mid)<CITY_PLAZA+200)continue;
    sprop('busstop',x,y,vert?-sd*Math.PI/2:(sd>0?0:Math.PI));
    const lc=k*CITY_B+sd*(CITY_ROAD/2-70),[bx2,by2]=vert?[lc,s+40]:[s+40,lc];sprop('bus',bx2,by2,vert?(sd>0?0:Math.PI):(sd>0?Math.PI/2:-Math.PI/2));}
  // ลานกลาง: กระถางต้นไม้ + ม้านั่ง ระหว่างทางเข้า 4 ทาง + ป้ายรถไฟใต้ดิน
  for(let q=0;q<4;q++){const t=Math.PI/4+q*Math.PI/2,r=CITY_PLAZA-130,x=mid+Math.cos(t)*r,y=mid+Math.sin(t)*r,ta=Math.atan2(mid-x,mid-y);
    sprop('planter',x,y,ta+Math.PI/2,1);for(const o of [-0.13,0.13]){const t2=t+o;sprop('bench',mid+Math.cos(t2)*(r-10),mid+Math.sin(t2)*(r-10),Math.atan2(mid-(mid+Math.cos(t2)*r),mid-(mid+Math.sin(t2)*r)),1);}
    if(q%2===0)sprop('tube',mid+Math.cos(t)*(CITY_PLAZA-40)+Math.cos(t+Math.PI/2)*120,mid+Math.sin(t)*(CITY_PLAZA-40)+Math.sin(t+Math.PI/2)*120,ta,1);}
  for(const z of zones){const a2=z.x+60,b2=z.y+60,s2=z.w-120,rnd=()=>RS();
    if(z.k==='station')sprop('tube',z.x+40,z.y+z.d/2,-Math.PI/2);
    if(z.k==='park'||z.k==='field')for(let t=0,c=0;c<(z.k==='park'?30:12)&&t<400;t++){const x=a2+40+rnd()*(s2-80),y=b2+40+rnd()*(s2-80);if(z.k==='field'&&Math.abs(y-(z.y+z.d/2))<z.d*0.25)continue;if(free(x,y,30))sprop('bush',x,y,rnd()*6.28),c++;}
    if(z.k==='build'){for(let t=a2+80;t<a2+s2-80;t+=160){sprop('cone',t,b2+20,0);sprop('cone',t,b2+s2-20,0);}for(const [x,y,a3] of [[a2+s2/2,b2+20,0],[a2+20,b2+s2/2,Math.PI/2]])sprop('barrier',x,y,a3);
      const cr=obs.find(o=>o.k==='cpill'&&o.hgt>=40&&o.x>z.x&&o.x<z.x+z.w&&o.y>z.y&&o.y<z.y+z.d);if(cr)sprop('crane',cr.x,cr.y,RS()*6.28);}
    if(z.k==='warehouse'||z.k==='docks')for(let t=0,c=0;c<10&&t<300;t++){const x=a2+40+rnd()*(s2-80),y=b2+40+rnd()*(s2-80);if(z.water&&x>z.water.x-80)continue;if(free(x,y,20))sprop('pallet',x,y,rnd()*1.6),c++;}
    if(z.water)for(const f of [0.3,0.72])sprop('boat',z.water.x+z.water.w*0.45,z.y+z.d*f,0);
  }
  return {W,H,obs,boxes,zones,deck,street};
}
function cityProps(){
  const M=MAPS.city,R=mulberry(1712),out=[],add=(k,x,y)=>out.push({i:out.length,k,x:Math.round(x),y:Math.round(y),a:R()*6.283,r:PROPDEF[k].r,hgt:PROPDEF[k].hgt,hp:PROPDEF[k].hp||0,st:0,ht:0});
  const hit=(x,y,r)=>M.boxes.some(b=>x>b.x-r-20&&x<b.x+b.w+r+20&&y>b.y-r-20&&y<b.y+b.d+r+20)||M.obs.some(o=>o.k!=='cwall'&&Math.abs(x-o.x)<(o.w||o.r*2)/2+r+30&&Math.abs(y-o.y)<(o.w||o.r*2)/2+r+30)||out.some(o=>Math.hypot(o.x-x,o.y-y)<o.r+r+30)||Math.hypot(x-M.W/2,y-M.H/2)<CITY_PLAZA;
  for(const z of M.zones){
    const n=z.k==='park'?70:z.k==='field'?0:z.k==='homes'?14:z.k==='build'||z.k==='warehouse'||z.k==='docks'?0:4;
    for(let t=0,c=0;c<n&&t<n*30;t++){const x=z.x+80+R()*(z.w-160),y=z.y+80+R()*(z.d-160);if(z.water&&x>z.water.x-60)continue;if(hit(x,y,24))continue;add(R()<0.5?'ptree':'ppine',x,y);c++;}
    if(z.k==='build'||z.k==='warehouse'||z.k==='docks')for(let t=0,c=0;c<18&&t<500;t++){const x=z.x+80+R()*(z.w-160),y=z.y+80+R()*(z.d-160);if(z.water&&x>z.water.x-60)continue;if(hit(x,y,20))continue;add(R()<0.6?'pcrate':'pbarrel',x,y);c++;}
  }
  for(let k=1;k<CITY_N;k++)for(let s=CITY_B/2-600;s<CITY_N*CITY_B;s+=CITY_B/2)for(const sd of [-1,1]){   // ต้นไม้ริมทางเท้า (ห่างทางแยก)
    const c=k*CITY_B+sd*(CITY_ROAD/2+30);for(const [x,y] of [[c,s],[s,c]])if(!hit(x,y,22))add('ptree',x,y);}
  return out;
}
MAPS.city=Object.assign({name:'🏙️ เมืองมักเกิ้ล',d:'เมืองยุคปัจจุบัน 480×480 ม. — กล่องเทา (ยังไม่ลงภาพจริง)',props:cityProps,build:'city',pick:1},genCity());
