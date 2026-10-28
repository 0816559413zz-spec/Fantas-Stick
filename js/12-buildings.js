// ---------- สิ่งปลูกสร้างที่พังเป็นชิ้นย่อย (บ้าน) แบบ Battlefield — คู่มือเต็ม: Destruction.md ----------
// บ้าน 1 หลัง (OBS k:'house') = 6 ส่วน (ผนัง 4 ด้าน + หลังคา 2 ซีก) • แต่ละส่วนแบ่งเป็นตาราง BLD_GRID (รวม 54 ชิ้นย่อย)
// โดนตรงไหนพังเฉพาะชิ้นย่อยนั้น → เป็นรู เดิน/ยิงลอดได้ • ชิ้นที่ไม่มีอะไรรองรับร่วงตาม (bldSupport) • ผนังรอบหลังคาเหลือน้อย = หลังคาซีกนั้นถล่ม
// ชื่อชิ้นในไฟล์ bld_house.glb: <ส่วน>_c<เลข> (assets/src/house_chunks.py) • hp/ตัวคูณ = ค่าตั้งต้นให้ทีมเกมเพลย์ปรับ
// ธาตุ el: 'fire' ติดไฟเผาต่อ + ไหม้ดำ • 'ice' เกาะน้ำแข็ง (ตีแรงซ้ำ ×2, ไฟละลาย) • 'blast' ×1.5 เศษกระเด็นแรง • 'fireblast' = ทั้งสองอย่าง • 'fall' = ร่วงเพราะไม่มีที่รองรับ
// snapshot BD = บ้านคั่นด้วย '|' ('' = บ้านนั้นปกติ): 6 ตัวแรก = สถานะส่วน (ฐาน 16: 1 พังหมด | 2 ไหม้ดำ | 4 ติดไฟ | 8 เกาะน้ำแข็ง) + ส่วนละ 3 ตัว = บิตชิ้นย่อยที่พัง
// เหตุการณ์ {k:'bld',e:'h'|'b',i,p,c,el,x,y,ox,oy,h} (c = เลขชิ้นย่อย) • ตำแหน่งในบ้าน = หน่วย sim px แกนของบ้านเอง หน้าบ้าน (ประตู) = +y
const BLDDEF={house:{model:'bld_house',bw:8,bd:6.5,wh:4.2,rh:3.4,th:14,hp:{wall:35,roof:30}}};
BLDDEF.ldn=Object.assign({},BLDDEF.house,{model:'bld_house_ldn',wallc:['#8a4a3a','#7a4232','#94553f','#7c4232'],roofc:'#4a4e58'});   // บ้านอิฐลอนดอน (แมพ city, OBS bt:'ldn') — โครง/ชิ้นเหมือนบ้านหิมะทุกอย่าง
const BLD_PIECES=['wall_front','wall_back','wall_left','wall_right','roof_left','roof_right'];
const BLD_GRID=[[4,3],[4,3],[3,3],[3,3],[3,2],[3,2]];      // [คอลัมน์, แถว] ต่อส่วน — ต้องตรงกับ house_chunks.py
// ช่องประตูผนังหน้า (wall_front) เปิดตั้งแต่เริ่ม — ต้องตรงกับ DOOR_HW/DOOR_H ใน assets/src/house_build.py • hw = ครึ่งกว้าง px (1.1 ม.; คนกว้าง 2×PR = 36 px) • h = สูง (หน่วย 3D)
const BLD_DOOR={hw:22,h:2.7};
const BLD_FIRE={burn:5,dps:6},BLD_ICE={frz:6},BLD_ROOF_MIN=0.35;   // หลังคาถล่มเมื่อผนังแถวบนที่รองรับเหลือน้อยกว่า 35%
let BLDG=[],BLDON=false;
function genBldg(id){
  const M=MAPS[id],out=[];if(!M)return out;
  for(const o of M.obs||[])if(o.k==='house'){
    const D=BLDDEF[o.bt]||BLDDEF.house;o.bi=out.length;
    out.push({i:out.length,o,D,c:Math.cos(o.ry||0),s:Math.sin(o.ry||0),ht:0,dirty:false,pc:BLD_PIECES.map((n,j)=>{const mx=D.hp[j<4?'wall':'roof'],[nc,nr]=BLD_GRID[j];
      return {n,fl:0,burnT:0,frzT:0,nc,nr,cb:0,max:mx,ch:new Array(nc*nr).fill(mx)};})});
  }
  return out;
}
// สี่เหลี่ยมของทั้งส่วน (ใช้กับเอฟเฟกต์ไฟ/น้ำแข็ง)
function bldRect(b,j){const w=b.o.w/2,d=b.o.d/2,t=b.D.th/2;return j===0?[0,d,w,t]:j===1?[0,-d,w,t]:j===2?[-w,0,t,d]:j===3?[w,0,t,d]:j===4?[-w/2,0,w/2,d]:[w/2,0,w/2,d];}
// ชิ้นย่อย k ของส่วน j → [cx,cy,hx,hy (px), z0,z1 (หน่วย 3D จากพื้น)]
function bldChunk(b,j,k){
  const w=b.o.w/2,d=b.o.d/2,t=b.D.th/2,D=b.D,[nc]=BLD_GRID[j],c=k%nc,r=Math.floor(k/nc);
  if(j<2){const hx=w/nc;return [-w+(2*c+1)*hx,j?-d:d,hx,t,r*D.wh/3,(r+1)*D.wh/3];}
  const hy=d/nc,cy=-d+(2*c+1)*hy;
  if(j<4)return [j===2?-w:w,cy,t,hy,r*D.wh/3,(r+1)*D.wh/3];
  const s=j===4?-1:1;return [s*w*(r?0.25:0.75),cy,w/4,hy,D.wh+(r?0.5:0)*D.rh,D.wh+(r?1:0.5)*D.rh];
}
const bldAlive=(q,k)=>!((q.cb>>k)&1);
function bldLocal(b,x,y){const dx=x-b.o.x,dy=y-b.o.y;return [dx*b.c-dy*b.s,dx*b.s+dy*b.c];}
function bldWorld(b,lx,ly){return [b.o.x+lx*b.c+ly*b.s,b.o.y-lx*b.s+ly*b.c];}
function rectDist(R,lx,ly){return Math.hypot(Math.max(Math.abs(lx-R[0])-R[2],0),Math.max(Math.abs(ly-R[1])-R[3],0));}
function bldNear(b,x,y,pad){return Math.abs(x-b.o.x)<b.o.w*0.75+pad&&Math.abs(y-b.o.y)<b.o.w*0.75+pad;}
// บ้านพังครบทั้งหลัง (ทั้ง 6 ส่วน) → เนินกองซาก: เป็น "พื้นเพิ่ม" ใน groundH (เดินปีนขึ้นยืนบนยอดได้) + กระสุนที่ต่ำกว่าผิวเนินชนเนิน
// ผู้ใช้เลือก 2026-10-21: สูง ~1.5 ม. • เป็นเนินเมื่อพังครบทั้งหลังเท่านั้น • ทรงวงรีคลุมตัวบ้าน + pad ต่อด้าน (px), ยอดแบนกลางเนิน
const BLD_MOUND={h:1.8,pad:40};   // 2026-10-28: ผู้ใช้ขอเนินเพิ่มนิดนึง (เดิม 1.5 / 30)
function bldGone(b){return b.pc.every(q=>q.fl&1);}
function bldMoundAt(b,x,y){const [lx,ly]=bldLocal(b,x,y),e=(lx/(b.o.w/2+BLD_MOUND.pad))**2+(ly/(b.o.d/2+BLD_MOUND.pad))**2;return e<1?BLD_MOUND.h*Math.min(1,1.6*(1-e)):0;}
function bldMoundH(x,y){let g=cityMoundH(x,y);if(!BLDG.length)return g;for(const b of sgNear(sgBld(),x,y,BLD_MOUND.pad,_sgM))if(bldNear(b,x,y,BLD_MOUND.pad)&&bldGone(b)){const v=bldMoundAt(b,x,y);if(v>g)g=v;}return g;}
// โดนชิ้นย่อย: code = ส่วน*100 + ชิ้นย่อย (ค่าจาก bldPieceAt)
function hitBldPiece(b,code,dmg,el,ox,oy){
  const j=Math.floor(code/100),k=code%100,q=b.pc[j];if(!BLDON||!q||!bldAlive(q,k))return;
  el=el||'none';const fire=el.includes('fire'),ice=el==='ice',blast=el.includes('blast');
  let m=blast?1.5:ice?0.7:1;
  if(q.frzT>0&&!ice){if(fire){q.frzT=0;q.fl&=~8;}else m*=2;}       // น้ำแข็ง: ไฟละลาย / ตีแรงแตก ×2
  q.ch[k]-=dmg*m;
  if(fire){q.burnT=BLD_FIRE.burn;q.fl|=6;}
  if(ice){if(q.burnT>0){q.burnT=0;q.fl&=~4;}else{q.frzT=BLD_ICE.frz;q.fl|=8;}}   // น้ำแข็งดับไฟ
  if(q.ch[k]<=0){breakBldChunk(b,j,k,el,ox,oy);bldSupport(b);return;}
  if(G.time-b.ht>0.12){b.ht=G.time;const C=bldChunk(b,j,k),[x,y]=bldWorld(b,C[0],C[1]);emit({k:'bld',e:'h',i:b.i,p:j,c:k,el,x:Math.round(x),y:Math.round(y),h:Math.round((C[4]+C[5])*5)/10});}
}
function breakBldChunk(b,j,k,el,ox,oy){
  const q=b.pc[j];if(!bldAlive(q,k))return;
  q.cb|=1<<k;q.ch[k]=0;b.dirty=true;
  if(q.cb===(1<<(q.nc*q.nr))-1){q.fl=(q.fl|1)&3;q.burnT=q.frzT=0;}      // พังหมดทั้งส่วน: เหลือแค่ "พัง" + "ไหม้ดำ"
  const C=bldChunk(b,j,k),[x,y]=bldWorld(b,C[0],C[1]);
  emit({k:'bld',e:'b',i:b.i,p:j,c:k,el:el||'none',x:Math.round(x),y:Math.round(y),ox:Math.round(ox==null?x:ox),oy:Math.round(oy==null?y:oy),h:Math.round((C[4]+C[5])*5)/10});
}
// โครงสร้างรองรับ: ผนังชิ้นบน ต้องมีชิ้นข้างล่าง หรือชิ้นข้างๆ ที่มีชิ้นล่างของตัวเอง (สะพานข้ามรู 1 ช่อง) • หลังคาซีกไหนผนังแถวบนรอบๆ เหลือน้อย = ถล่มทั้งซีก
function bldSupport(b){
  for(let pass=0;pass<4;pass++){
    let ch=false;
    for(let j=0;j<4;j++){const q=b.pc[j],nc=q.nc,A=(r,c)=>c>=0&&c<nc&&bldAlive(q,r*nc+c);
      for(let r=1;r<q.nr;r++)for(let c=0;c<nc;c++){
        if(!A(r,c))continue;
        if(A(r-1,c)||(A(r,c-1)&&A(r-1,c-1))||(A(r,c+1)&&A(r-1,c+1)))continue;
        breakBldChunk(b,j,r*nc+c,'fall',b.o.x,b.o.y);ch=true;
      }}
    for(const j of [4,5]){
      const q=b.pc[j];if(q.fl&1)continue;
      const side=b.pc[j===4?2:3],fb=j===4?[0,1]:[2,3];let n=0,a=0;
      for(let c=0;c<3;c++){n++;if(bldAlive(side,6+c))a++;}
      for(const w of [0,1])for(const c of fb){n++;if(bldAlive(b.pc[w],8+c))a++;}
      if(a/n<BLD_ROOF_MIN){for(let k=0;k<q.nc*q.nr;k++)breakBldChunk(b,j,k,'fall',b.o.x,b.o.y);ch=true;}
    }
    if(!ch)break;
  }
}
// ให้คาถาวงกว้างพังสิ่งแวดล้อม: damageEnv(x,y,รัศมี px,ดาเมจ,id,ธาตุ,ความสูงจุดระเบิด) = ลัง/ถัง (prop) + ชิ้นย่อยบ้านในวง (ขอบวง = เหลือ 30%)
function damageEnv(x,y,rad,dmg,by,el,h){
  damagePropsIn(x,y,rad,dmg,by);damageBrkIn(x,y,rad,dmg,h);
  if(!BLDON)return;h=h||0;const R=rad/20;
  cityDamageIn(x,y,rad,dmg,el,h,by);   // ตึก/ของในเมือง (js/12-city-dmg)
  for(const b of sgNear(sgBld(),x,y,rad,_sgE)){
    if(!bldNear(b,x,y,rad))continue;
    const [lx,ly]=bldLocal(b,x,y),hits=[];
    for(let j=0;j<6;j++){const q=b.pc[j];if(q.fl&1)continue;
      for(let k=0;k<q.nc*q.nr;k++){if(!bldAlive(q,k))continue;
        const C=bldChunk(b,j,k),dv=Math.max(0,C[4]-h,h-C[5]),d=Math.hypot(rectDist(C,lx,ly)/20,dv);
        if(d<R)hits.push([j*100+k,dmg*(1-0.7*d/R)]);}}
    for(const [code,dd] of hits)hitBldPiece(b,code,dd,el,x,y);
  }
}
// เส้นจาก (x0,y0,h0) → (x1,y1,h1) ชนชิ้นบ้านแรกตรงไหน (ก้าวละ 10 px) • null = ไม่ชน
function bldRay(x0,y0,h0,x1,y1,h1){
  if(!BLDON)return null;const L=Math.hypot(x1-x0,y1-y0),mx=(x0+x1)/2,my=(y0+y1)/2,near=BLDG.filter(b=>bldNear(b,mx,my,L/2+20));
  if(!near.length)return null;const n=Math.max(1,Math.ceil(L/10));
  for(let i=1;i<=n;i++){const t=i/n,x=lerp(x0,x1,t),y=lerp(y0,y1,t),h=lerp(h0,h1,t);
    for(const b of near)if(bldNear(b,x,y,8)&&bldPieceAt(b,x,y,h,6)>=0)return {x,y,h,t};}
  return null;
}
// ท่าที่พุ่ง/ยิงลงจุดเล็ง: จุดลงหยุดที่ผนัง/หลังคาบ้านที่ขวางอยู่ (ไม่ทะลุ) • ถอยออกจากผนัง back px • คืน {x,y,h} (h = ความสูงจุดชน หรือพื้น)
function aimClip(x0,y0,h0,o,back){
  const g=groundH(o.x,o.y),c=bldRay(x0,y0,h0,o.x,o.y,g);if(!c)return {x:o.x,y:o.y,h:g,hit:false};
  const d=Math.hypot(o.x-x0,o.y-y0)||1,k=Math.min(back||0,c.t*d)/d;
  return {x:c.x-(o.x-x0)*k,y:c.y-(o.y-y0)*k,h:c.h,hit:true};
}
// เล็งอิสระ 3 มิติ: ยิงจาก (ตัวเรา, สูง h0) ไปตามเส้นเป้ากลางจอ (inp.ax/ay/ah) แล้วเลยต่อไปจนชน พื้น / บ้าน / ขอบแมพ หรือครบ range px
// คืน {x,y,h,hit:'ground'|'bld'|'edge'|'air'} • null = ไม่มีข้อมูลเล็ง (บอท) ให้ใช้วิธีเดิม
function aimRay3(p,h0,range){
  const i=p.inp;if(!i||p.bot||typeof i.ah!=='number')return null;
  let dx=i.ax-p.x,dy=i.ay-p.y,dh=(i.ah-h0)*20;const L=Math.hypot(dx,dy,dh);
  if(L<1){dx=Math.cos(p.ang);dy=Math.sin(p.ang);dh=0;}else{dx/=L;dy/=L;dh/=L;}
  let x=p.x,y=p.y,h=h0;
  for(let s=10;s<=range;s+=10){
    const nx=p.x+dx*s,ny=p.y+dy*s,nh=h0+dh*s/20;
    if(nx<40||nx>MW-40||ny<40||ny>MH-40)return {x,y,h,hit:'edge'};
    const g=groundH(nx,ny);if(nh<=g)return {x:nx,y:ny,h:g,hit:'ground'};
    if(BLDON)for(const b of sgNear(sgBld(),nx,ny,8,_sgA))if(bldNear(b,nx,ny,8)&&bldPieceAt(b,nx,ny,nh,6)>=0)return {x:nx,y:ny,h:nh,hit:'bld'};
    x=nx;y=ny;h=nh;
  }
  return {x,y,h,hit:'air'};
}
// ชิ้นที่กระสุนชน (-1 = ไม่ชน / ลอดรู): ต่ำกว่าผนัง = ชิ้นผนังแถวนั้นที่ใกล้สุด, สูงกว่า = ชิ้นหลังคาใต้กระสุน (ทรงปิรามิด)
function bldPieceAt(b,x,y,h,r){
  const [lx,ly]=bldLocal(b,x,y),D=b.D,hw=b.o.w/2,hd=b.o.d/2;
  if(h<D.wh){const row=clamp(Math.floor(h/(D.wh/3)),0,2);let best=-1,bd=r;
    const door=h<BLD_DOOR.h&&Math.abs(lx)<BLD_DOOR.hw-r*0.5&&ly>0;   // ลอดช่องประตูหน้าบ้าน
    for(let j=0;j<4;j++){const q=b.pc[j];if(q.fl&1||(door&&j===0))continue;for(let c=0;c<q.nc;c++){const k=row*q.nc+c;if(!bldAlive(q,k))continue;const d=rectDist(bldChunk(b,j,k),lx,ly);if(d<bd){bd=d;best=j*100+k;}}}
    return best;}
  if(h<D.wh+D.rh&&Math.abs(lx)<hw&&Math.abs(ly)<hd&&h<D.wh+D.rh*(1-Math.max(Math.abs(lx)/hw,Math.abs(ly)/hd))){
    const j=lx<0?4:5,q=b.pc[j],c=clamp(Math.floor((ly+hd)/(2*hd)*3),0,2),k=(Math.abs(lx)<hw/2?3:0)+c;
    if(bldAlive(q,k))return j*100+k;}
  return -1;
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
function collideBld(b,o,r,z){
  const D=b.D;let [lx,ly]=bldLocal(b,o.x,o.y),moved=false;
  const push=R=>{const p=bldPush(lx,ly,R,r);if(p){lx=p[0];ly=p[1];moved=true;}};
  if(z<D.wh)for(let j=0;j<4;j++){
    const q=b.pc[j];if(q.fl&1)continue;
    let run=-1;
    for(let c=0;c<=q.nc;c++){
      let bl=false;if(c<q.nc)for(let rr=0;rr<q.nr;rr++){const z0=rr*D.wh/3,z1=z0+D.wh/3;if(z1>z&&z0<z+1.9&&bldAlive(q,rr*q.nc+c)){bl=true;break;}}
      if(bl&&run<0)run=c;
      if(!bl&&run>=0){const A=bldChunk(b,j,run),B=bldChunk(b,j,c-1);
        if(j===0&&z<BLD_DOOR.h){const x0=A[0]-A[2],x1=B[0]+B[2],dw=BLD_DOOR.hw;   // ผนังหน้า: เว้นช่องประตูกลางผนัง
          if(x0<-dw)push([(x0+Math.min(x1,-dw))/2,A[1],(Math.min(x1,-dw)-x0)/2,A[3]]);if(x1>dw)push([(Math.max(x0,dw)+x1)/2,A[1],(x1-Math.max(x0,dw))/2,A[3]]);}
        else push(j<2?[(A[0]+B[0])/2,A[1],(B[0]-A[0])/2+A[2],A[3]]:[A[0],(A[1]+B[1])/2,A[2],(B[1]-A[1])/2+A[3]]);run=-1;}
    }
  }
  if(z>=D.wh-0.3&&z<D.wh+D.rh)for(const j of [4,5]){const q=b.pc[j];if(q.fl&1)continue;for(let k=0;k<q.nc*q.nr;k++)if(bldAlive(q,k))push(bldChunk(b,j,k));}
  if(moved){o.x=b.o.x+lx*b.c+ly*b.s;o.y=b.o.y-lx*b.s+ly*b.c;}
}
function updateBldg(dt){
  cityTick(dt);
  if(!BLDON)return;
  for(const b of BLDG){let br=false;
    for(let j=0;j<6;j++){
      const q=b.pc[j];if(q.fl&1)continue;
      if(q.frzT>0){q.frzT-=dt;if(q.frzT<=0)q.fl&=~8;}
      if(q.burnT>0){q.burnT-=dt;
        for(let k=0;k<q.ch.length;k++)if(bldAlive(q,k)){q.ch[k]-=BLD_FIRE.dps*dt;if(q.ch[k]<=0){breakBldChunk(b,j,k,'fire');br=true;}}
        if(q.burnT<=0)q.fl&=~4;}
    }
    if(br)bldSupport(b);}
}
function bldSnap(){
  if(!BLDON)return '';let any=false;
  const s=BLDG.map(b=>{if(!b.pc.some(q=>q.fl||q.cb))return '';any=true;return b.pc.map(q=>q.fl.toString(16)).join('')+b.pc.map(q=>q.cb.toString(16).padStart(3,'0')).join('');}).join('|');
  return any?s:'';
}
// เครื่องลูก: อ่าน BD จาก snapshot
function bldParse(bd){
  const H=(bd||'').split('|');
  BLDG.forEach((b,i)=>{const t=H[i]||'';b.pc.forEach((q,j)=>{q.fl=t?parseInt(t[j]||'0',16):0;const cb=t?parseInt(t.substr(6+j*3,3)||'0',16):0;if(cb!==q.cb){q.cb=cb;b.dirty=true;}});});
}
// ---------- ของบังในแผนที่ไฟล์ที่พังได้ (หิน เสา รูปปั้น ต้นไม้ โคมไฟ ลัง ...) — คู่มือ Destruction.md §9 ----------
// กลุ่ม = ที่ชน col_ 1 อัน (วงกลม OBS ที่มี b เดียวกัน) + โมเดลของมัน (map_export.py ผูกให้ → MAPS[id].fm.brk) • กำแพงใหญ่/ขอบแผนที่ไม่มีโมเดลแยก = ไม่พัง
// เลือดตามขนาด (ปริมาตร ม³ ของโมเดล < vol[0] เล็ก / < vol[1] กลาง / ใหญ่) • โดนเฉพาะ damageEnv (สกิลแรง) ไม่โดนกระสุนธรรมดา
// st: 0 ปกติ 1 ร้าว (เลือด < 66%) 2 ร้าวหนัก (< 33%) 3 พัง = ซากสูง 1/3 ของเดิม ยังชน/บังกระสุนได้ • กลับมาครบตอนเริ่มเกมใหม่ • snapshot BK = st ต่อกลุ่ม
const BRKDEF={vol:[15,60],hp:[100,200,400],crack:[0.66,0.33],rub:1/3},BRK_M=['stone','wood','ice'],BRK_MCOL=['#9a9080','#7a5a3a','#cfeefa'];   // ชนิดวัสดุ (map_export) → สีเศษ
let BRK=[];
function genBrk(id){
  const M=MAPS[id],L=(M&&M.fm&&M.fm.brk)||[];
  const out=L.map((d,i)=>{const sz=d.v<BRKDEF.vol[0]?0:d.v<BRKDEF.vol[1]?1:2;return {i,d,sz,max:BRKDEF.hp[sz],hp:BRKDEF.hp[sz],st:0,cs:[],x:0,y:0};});
  for(const o of (M&&M.obs)||[])if(o.b!=null&&out[o.b]){if(o.h0===undefined){o.h0=o.hgt;o.t0=o.top;}o.hgt=o.h0;o.top=o.t0;out[o.b].cs.push(o);}
  for(const g of out){if(!g.cs.length)continue;g.x=g.cs.reduce((a,o)=>a+o.x,0)/g.cs.length;g.y=g.cs.reduce((a,o)=>a+o.y,0)/g.cs.length;}
  return out;
}
function brkApply(g,st){
  g.st=st;const vh=g.d.vh||g.d.h;   // vh = ความสูงโมเดล (ต้นไม้: ที่ชนสูงกว่าตัวต้น)
  for(const o of g.cs){o.hgt=st>=3?Math.min(o.h0,vh*BRKDEF.rub):o.h0;if(o.t0!==undefined)o.top=o.t0-o.h0+o.hgt;}
}
function brkStage(g){const f=g.hp/g.max;return g.hp<=0?3:f<BRKDEF.crack[1]?2:f<BRKDEF.crack[0]?1:0;}
function hitBrk(g,dmg,ox,oy){
  if(g.st>=3)return;g.hp-=dmg;const st=brkStage(g);if(st<=g.st)return;
  brkApply(g,st);const b=st>=3;
  const mi=Math.max(0,BRK_M.indexOf(g.d.m));
  emit({k:'brk',t:b?'b':'c',i:g.i,st,mi,col:BRK_MCOL[mi],sz:g.sz,x:Math.round(g.x),y:Math.round(g.y),h:Math.round((g.d.vh||g.d.h)*(b?BRKDEF.rub:0.5)*10)/10,hh:g.d.vh||g.d.h,r:Math.round(Math.max(...g.cs.map(o=>o.r))),
    ox:Math.round(ox==null?g.x:ox),oy:Math.round(oy==null?g.y:oy)});
}
// วงระเบิด: ระยะถึงขอบที่ชน (3 มิติ เทียบความสูงจุดระเบิดกับยอด) ขอบวงเหลือ 30% เหมือนบ้าน
function damageBrkIn(x,y,rad,dmg,h){
  if(!PROPON||!BRK.length)return;h=h||0;const R=rad/20;
  for(const g of BRK){if(g.st>=3||!g.cs.length)continue;
    let d=1e9;for(const o of g.cs)d=Math.min(d,Math.max(0,Math.hypot(o.x-x,o.y-y)-o.r));
    if(d>rad)continue;const dm=Math.hypot(d/20,Math.max(0,h-g.d.h));if(dm<R)hitBrk(g,dmg*(1-0.7*dm/R),x,y);}
}
function brkSnap(){return PROPON&&BRK.some(g=>g.st)?BRK.map(g=>g.st).join(''):'';}
function brkParse(s){s=s||'';for(const g of BRK){const st=+(s[g.i]||0);if(st!==g.st)brkApply(g,st);}}
// ---------- ตารางช่อง (spatial grid) สำหรับแมพใหญ่: หาเฉพาะของใกล้ ๆ แทนวนทุกชิ้นในแผนที่ ----------
// ช่องละ SG.c px • สร้างใหม่เองเมื่อรายการ/ขนาดแผนที่เปลี่ยน (ของในรายการต้องไม่ย้ายที่ — OBS / PROPS / BLDG ไม่ย้าย)
// sgNear(ตาราง,x,y,รัศมี,out) = ของทุกชิ้นที่กรอบแตะวงนั้น (ไม่ซ้ำ) ใส่ลง out • แต่ละจุดเรียกใช้ out ของตัวเอง (กันทับกันตอนเรียกซ้อน)
const SG={c:400,s:0,m:new Map()};
const sgObs=()=>sgGrid('o',OBS,c=>[c.x-c.r,c.y-c.r,c.x+c.r,c.y+c.r]),sgProps=()=>sgGrid('p',PROPS,c=>[c.x-c.r,c.y-c.r,c.x+c.r,c.y+c.r]),
  sgBld=()=>sgGrid('b',BLDG,b=>{const e=b.o.w*0.75;return [b.o.x-e,b.o.y-e,b.o.x+e,b.o.y+e];});
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
function collideWorld(o,r,z){
  z=z||0;const sx=o.x,sy=o.y;let sol=0;
  o.x=clamp(o.x,r+20,MW-r-20);o.y=clamp(o.y,r+20,MH-r-20);if(o.x!==sx||o.y!==sy)sol++;
  if(PROPON)for(const c of sgNear(sgProps(),o.x,o.y,r,_sgCW)){
    if(c.st===1||c.hgt<=z)continue;
    if(Math.abs(o.x-c.x)>c.r+r||Math.abs(o.y-c.y)>c.r+r)continue;
    const dx=o.x-c.x,dy=o.y-c.y,d=Math.hypot(dx,dy),m=c.r+r;
    if(d<m&&d>0.001){o.x=c.x+dx/d*m;o.y=c.y+dy/d*m;}
  }
  if(BLDG.length)for(const b of sgNear(sgBld(),o.x,o.y,r,_sgCB))if(bldNear(b,o.x,o.y,r)){const bx=o.x,by=o.y;collideBld(b,o,r,z);if(o.x!==bx||o.y!==by)sol++;}
  const za=TERR?terrT(o.x,o.y)+z:z;
  for(const c of sgNear(sgObs(),o.x,o.y,r,_sgCO)){
    if((c.top!==undefined?c.top<=za:c.hgt<=z)||c.bi!==undefined||(c.bot!==undefined&&z+1.9<=c.bot))continue;   // bot = วงที่ลอยเริ่มสูงจากพื้น (ส่วนทึบบนตึกกลวง)
    if(Math.abs(o.x-c.x)>c.r+r||Math.abs(o.y-c.y)>c.r+r)continue;
    const dx=o.x-c.x,dy=o.y-c.y,d=Math.hypot(dx,dy),m=c.r+r;
    if(d<m&&d>0.001){o.x=c.x+dx/d*m;o.y=c.y+dy/d*m;sol++;}
  }
  if(G&&G.walls)for(const c of G.walls){
    if(c.hgt<=z)continue;
    if(Math.abs(o.x-c.x)>c.r+r||Math.abs(o.y-c.y)>c.r+r)continue;
    const dx=o.x-c.x,dy=o.y-c.y,d=Math.hypot(dx,dy),m=c.r+r;
    if(d<m&&d>0.001){o.x=c.x+dx/d*m;o.y=c.y+dy/d*m;}
  }
  sol+=eCollide(o,r,z);   // สิ่งก่อสร้างสายดิน
  sol+=cityCollideIn(o,r,z);   // ผนังตึกกลวงในเมือง ทีละแผ่นทีละชั้น (js/12-city-dmg)
  // กล่องตึกทึบ (แมพเมือง MAPS[id].boxes {x,y,w,d,h}): ขอบชนด้วยวงกลม cwall แล้ว — ตรงนี้กันกรณีหลุดเข้าไปข้างใน (วาร์ป/จุดสุ่ม) → ดันออกด้านที่ใกล้สุด
  const BX=MAPS[MAPID]&&MAPS[MAPID].boxes;
  if(BX)for(const b of sgNear(sgGrid('r',BX,b=>[b.x,b.y,b.x+b.w,b.y+b.d]),o.x,o.y,0,_sgCR)){
    if(b.cl||b.h<=z||(b.top&&z<b.top)||o.x<=b.x||o.x>=b.x+b.w||o.y<=b.y||o.y>=b.y+b.d)continue;
    const L=o.x-b.x,Rr=b.x+b.w-o.x,T=o.y-b.y,Bt=b.y+b.d-o.y,m=Math.min(L,Rr,T,Bt);
    if(m===L)o.x=b.x-r;else if(m===Rr)o.x=b.x+b.w+r;else if(m===T)o.y=b.y-r;else o.y=b.y+b.d+r;sol++;}
  if(sol)o.solN=(o.solN|0)+1;   // ชนของแข็ง (Stonebreaker ใช้ทำคอมโบชนกำแพง)
}

function shoot(p,type,o){
  const d=PDEF[type],a=p.ang,h=p.z+1.35,SP=(o&&o.spd)||d.spd;
  // ล็อกเป้าแนวตั้งอัตโนมัติ: ถ้ามีศัตรูอยู่ในแนวเล็ง คาถาจะเชิดขึ้น/ลงไปหาเอง
  let best=null,bs=1e9;
  for(const t of foesOf(p.team)){
    const dx=t.x-p.x,dy=t.y-p.y,dd=Math.hypot(dx,dy);
    if(dd>1300||dd<1)continue;
    const da=Math.abs(angDiff(Math.atan2(dy,dx),a));
    if(da<0.3&&da+dd/5000<bs){bs=da+dd/5000;best=t;}
  }
  let vh;
  if(best)vh=(cH(best)+terrT(best.x,best.y)-terrT(p.x,p.y)-h)/(Math.hypot(best.x-p.x,best.y-p.y)/SP);
  else if(p.inp&&typeof p.inp.ah==='number'&&!p.bot){const dd=Math.max(80,Math.hypot(p.inp.ax-p.x,p.inp.ay-p.y));vh=clamp((p.inp.ah-h)/(dd/SP),-30,30);}
  else vh=Math.tan(clamp((p.inp&&p.inp.ap)||0,-0.9,0.9))*SP/20;
  const pr={id:++G.pid,type,x:p.x+Math.cos(a)*26,y:p.y+Math.sin(a)*26,h,vh,vx:Math.cos(a)*SP,vy:Math.sin(a)*SP,
    r:d.r,dmg:d.dmg,life:d.life,owner:p.id,team:p.team,src:'p'};
  if(o)Object.assign(pr,o);
  G.proj.push(pr);
  emit({k:'cast',t:type,x:p.x,y:p.y,h:h+0.05,a:Math.round(a*100)/100,id:p.id});
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
  return out;
}
function breakShield(p){if(p.pathIdx===EARTH){if(!(p.stdB>0))earthBreak(p);return;}p.shieldOn=false;p.shieldE=0;p.shieldBroken=1.5;emit({k:'sbreak',x:p.x,y:p.y,h:p.z+1.3});}
// อัลติ (ผู้ใช้ 2026-10-22): ชาร์จช้าลง 30% ทุกสาย (ULT_RATE) + ระหว่างอัลติยังทำงานอยู่ไม่ได้ชาร์จเพิ่ม (นับใหม่หลังอัลติจบ)
const ULT_RATE=0.7;
function ultActive(p){return p.colos>0||p.god>0||!!p.wr||p.mirror>0;}
function gainUlt(p,v){if(ultActive(p))return;p.ult=Math.min(100,p.ult+v*0.5*ULT_RATE*p.buffs.ult);}
function lifesteal(p,amt){if(p.buffs.life&&p.alive&&!p.downed)healT(p,amt*p.buffs.life);}

function damage(t,amt,srcId,kind){
  if(G.mode==='train'&&G.tr&&G.tr.god&&G.players[t.id]===t)return;   // ห้องฝึก: อมตะ
  const src=srcId!=null?G.players[srcId]:null;
  if(src&&kind!=='burn')amt*=src.buffs.dmg;
  if(src&&src.blaze>0)amt*=1.15;   // Blazeform (เนิร์ฟ 2026-10-27: 1.3→1.15)
  if(src&&src.mirror>0&&!src.noMul)amt*=2;
  if(t.isM){
    if(t.dead)return;
    if(t.frz>0)amt*=1.15;
    if(t.mrk>0&&kind!=='burn')amt*=1.12;
    t.hp-=amt;emit({k:'hit',x:t.x,y:t.y,h:(t.h||0)+1.4,n:Math.round(amt),mn:t.id,s:srcId||undefined,ns:src&&src.baHit?1:undefined,b:kind==='burn'?1:undefined,kl:t.hp<=0?1:undefined,a:(kind==='aoe'||kind==='zone')?1:undefined});
    if(src&&src.alive)gainUlt(src,amt*0.3);
    if(t.hp<=0){t.dead=true;emit({k:'die',x:t.x,y:t.y,h:(t.h||0)+0.8,c:'#9fd0ff',t:'min'});}
    return;
  }
  if(t.isE){
    if(t.dead)return;
    if(t.frz>0)amt*=1.15;
    if(t.mrk>0&&kind!=='burn')amt*=1.12;
    t.hp-=amt;
    emit({k:'hit',x:t.x,y:t.y,h:cH(t)+vR(t)+0.4,n:Math.round(amt),e:t.id,s:srcId||undefined,ns:src&&src.baHit?1:undefined,b:kind==='burn'?1:undefined,kl:t.hp<=0?1:undefined,a:(kind==='aoe'||kind==='zone')?1:undefined});
    if(src){gainUlt(src,amt);lifesteal(src,amt);src.dmgDealt+=amt;}
    if(t.hp<=0){t.dead=true;if(src)src.kills++;emit({k:'die',x:t.x,y:t.y,h:cH(t),c:EDEF[t.type].col,t:t.type});}
    return;
  }
  if(!t.alive||t.downed)return;
  if(t.inv>0&&kind!=='burn')return;
  if(G.ball&&G.ball.holder===t.id&&kind!=='burn'&&kind!=='zone')quidDrop(t);
  if(t.stS&&kind!=='burn'){t.stS.abs+=amt;emit({k:'efx',z:'sthit',x:Math.round(t.x),y:Math.round(t.y),h:t.z+1.2,sx:src?Math.round(src.x):undefined,sy:src?Math.round(src.y):undefined,n:Math.round(amt),id:t.id});if(t.stS.abs>90)stormShieldBlast(t);return;}
  if(t.shieldOn&&(kind==='melee'||kind==='aoe')&&shieldFaces(t,src?src.x:null,src?src.y:null)){
    if(t.pathIdx===EARTH)earthShHit(t,amt);else{t.shieldE-=amt*1.5;t.shBlk=(t.shBlk|0)+1;}emit({k:'block',x:t.x,y:t.y,h:t.z+1.2});
    {const B=PBASIC[t.pathIdx|0];if(B&&B.onBlock)B.onBlock(t);}
    if(t.shieldE<=0)breakShield(t);
    return;
  }
  if(t.frz>0)amt*=1.15;
  if(t.ovc>0)amt*=1.15;
  if(t.blaze>0)amt*=1.25;
  if(t.mrk>0&&kind!=='burn')amt*=1.12;
  if(t.dr){amt*=t.dr.f;if(src&&src!==t&&kind!=='burn'&&kind!=='zone'&&!(t.drCd>0)){addPoison(src,t.id,1);t.drCd=1;}}
  if(t.xhp>0){const ab=Math.min(t.xhp,amt);t.xhp-=ab;amt-=ab;if(amt<=0.01){emit({k:'block',x:t.x,y:t.y,h:t.z+1.2});return;}}
  if(t.ward&&t.ward.t>0){
    const ab=Math.min(t.ward.abs,amt);t.ward.abs-=ab;amt-=ab;
    emit({k:'block',x:t.x,y:t.y,h:t.z+1.2});
    if(t.ward.thorns&&src&&src!==t&&kind!=='burn'&&kind!=='zone')addChill(src,1);
    if(t.ward.abs<=0)t.ward=null;
    if(amt<=0.01)return;
  }
  const real=Math.min(amt,Math.max(0,t.hp));   // ดาเมจจริง (ไม่นับส่วนที่เกินเลือด)
  t.hp-=amt;t.lastHit=srcId;t.dmgTaken=(t.dmgTaken||0)+real;   // สรุปจบเกม: ดาเมจที่รับ
  if(G.mode==='ffa')ffaDmgLog(t,srcId,real,kind);   // assist + จอตอนตาย (js/54)
  if(src&&src!==t){gainUlt(src,amt*0.7);lifesteal(src,amt);src.dmgDealt+=amt;}
  gainUlt(t,amt*0.25);
  emit({k:'hit',x:t.x,y:t.y,h:t.z+2.4,n:Math.round(amt),id:t.id,s:srcId||undefined,ns:src&&src.baHit?1:undefined,b:kind==='burn'?1:undefined,kl:t.hp<=0?1:undefined,sx:src&&src!==t?Math.round(src.x):undefined,sy:src&&src!==t?Math.round(src.y):undefined,a:(kind==='aoe'||kind==='zone')?1:undefined});
  if(t.hp<=0){t.hp=0;playerDown(t,srcId);}
}
function playerDown(t,srcId){
  t.shieldOn=false;t.burn=0;t.fly=false;
  t.stS=null;t.sdome=null;t.rail=null;t.slnT=0;t.beam=0;t.sdHit=null;earthReset(t);if(t.god>0){t.god=0;t.xhp=0;}
  // ท่าที่ง้าง/ค้างอยู่ตอนล้ม: ไม่งั้นคนล้ม (co-op) ยังปล่อยท่าได้ หรือท่าค้างไว้แล้วออกเองทันทีที่ถูกชุบ
  t.dfall=null;t.snapT=0;t.grT=0;t.slam=false;t.slam3=null;t.dchgOn=false;t.dchg=0;t.chg=0;t.dash=0;t.dashSp=0;t.trail=null;
  if(G.mode==='coop'){
    t.downed=true;t.revive=0;t.deaths++;
    feed(`💀 ${t.name} ล้ม! ไปยืนข้างๆ เพื่อชุบ`);
    emit({k:'die',x:t.x,y:t.y,h:t.z+1,c:t.color});
    return;
  }
  t.alive=false;t.deaths++;t.respawn=G.mode==='race'||G.mode==='train'?2:G.mode==='br'?1e9:3;
  if(G.mode==='br')emit({k:'brout',x:t.x,y:t.y});
  const k=G.players[srcId]||G.players[t.lastHit];
  if(k&&k!==t&&['ffa','tdm','quid'].includes(G.mode))t.respawn=7.5;   // กล้องตอนตาย 3+4 วิ + จอดำ แล้วค่อยเกิด (js/58)
  if(k&&k!==t){k.kills++;if(G.mode==='tdm')G.teamScore[k.team]++;feed(`${k.name} ⚡ ${t.name}`);}
  else feed(`💀 ${t.name}`);
  if(G.mode==='ffa')ffaKill(k&&k!==t?k:null,t);   // ฆ่าต่อเนื่อง/ค่าหัว/แก้แค้น/assist/ขวดดรอป (js/54)
  emit({k:'die',x:t.x,y:t.y,h:t.z+1,c:t.color,id:t.id,ki:k&&k!==t?k.id:''});   // id/ki = กล้องตอนตาย (js/58)
}

function killProj(pr){
  if(pr.dead)return;
  pr.dead=true;
  if(pr.type==='fire')explode(pr);
  else if(pr.type==='iceboulder')frostBoom(pr);
  else if(pr.type==='pfireb')pyroBigBoom(pr);
  if(pr.type==='eslab')damageEnv(pr.x,pr.y,80,40*E_ENV,pr.owner,'rock',pr.h);   // แผ่นหิน Stonebreaker แตก = พังบ้าน/ของ
  else emit({k:'pop',x:pr.x,y:pr.y,h:pr.h,t:pr.type});
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
  if(pr.sp&&SPELLS[pr.sp]&&SPELLS[pr.sp].hit){SPELLS[pr.sp].hit(pr,t);if(pr.type!=='fire')emit({k:'imp',x:t.x,y:t.y,h:pr.h,t:pr.type});return;}
  damage(t,pr.dmg,pr.owner,'proj');
  if(pr.type!=='fire')emit({k:'imp',x:t.x,y:t.y,h:pr.h,t:pr.type});
  const big=t.type==='troll'||t.type==='queen';
  switch(pr.type){
    case 'stun':t.stun=Math.max(t.stun,t.isE?(big?0.4:1.4):0.8);break;
    case 'pull':{
      const o=G.players[pr.owner];
      if(o){const a=Math.atan2(o.y-t.y,o.x-t.x),f=big?200:620;t.vx+=Math.cos(a)*f;t.vy+=Math.sin(a)*f;t.stun=Math.max(t.stun,0.3);}
      break;}
    case 'fire':t.burn=2;t.bt=0.5;t.burnSrc=pr.owner;break;
    case 'bolt':{const a=Math.atan2(pr.vy,pr.vx),f=big?20:90;t.vx+=Math.cos(a)*f;t.vy+=Math.sin(a)*f;break;}
    case 'web':if(!t.isE){t.root=Math.max(t.root||0,1.3);}break;
  }
}
function updateProjectiles(dt){
  const ps=plist();
  for(const pr of G.proj){
    if(pr.dead)continue;
    {const t0=TERR?terrT(pr.x,pr.y):0;pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;pr.h+=pr.vh*dt;if(TERR)pr.h-=terrT(pr.x,pr.y)-t0;}pr.life-=dt;
    if(pr.life<=0||pr.x<20||pr.x>MW-20||pr.y<20||pr.y>MH-20||pr.h>40){killProj(pr);continue;}
    if(pr.h<0.05||(TERR&&terrSolid(pr.x,pr.y,pr.h))||(BLDG.length&&pr.h<bldMoundH(pr.x,pr.y))){pr.h=Math.max(pr.h,0.1);killProj(pr);continue;}   // + ชนเนินซากบ้าน
    let hp=false;
    for(const c of sgNear(sgObs(),pr.x,pr.y,pr.r,_sgPO))if(c.bi===undefined&&!(c.bot!==undefined&&pr.h<c.bot)&&(c.top!==undefined?terrT(pr.x,pr.y)+pr.h<c.top:pr.h<c.hgt)&&(pr.x-c.x)**2+(pr.y-c.y)**2<(c.r+pr.r)**2){hp=true;if(c.cb!==undefined||c.ci!==undefined)cityHitObs(c,pr);break;}
    if(!hp&&BLDG.length)for(const b of sgNear(sgBld(),pr.x,pr.y,pr.r,_sgPB)){if(!bldNear(b,pr.x,pr.y,pr.r))continue;const j=bldPieceAt(b,pr.x,pr.y,pr.h,pr.r);if(j>=0){hitBldPiece(b,j,pr.dmg||5,projEl(pr),pr.x-pr.vx*0.08,pr.y-pr.vy*0.08);hp=true;break;}}
    if(!hp&&PROPON)for(const c of sgNear(sgProps(),pr.x,pr.y,pr.r,_sgPP))if(c.st!==1&&pr.h<c.hgt&&(pr.x-c.x)**2+(pr.y-c.y)**2<(c.r+pr.r)**2){hitProp(c,pr.dmg||5,pr.owner);hp=true;break;}
    if(!hp)for(const w of G.walls)if(pr.team!==w.team&&pr.h<w.hgt&&(pr.x-w.x)**2+(pr.y-w.y)**2<(w.r+pr.r)**2){w.hp-=pr.dmg||5;hp=true;emit({k:'efx',z:'wallhit',x:pr.x,y:pr.y,h:pr.h});break;}
    if(!hp&&eProjHit(pr))hp=true;
    if(!hp&&cityProjIn(pr,dt))hp=true;   // ตึกกลวงในเมือง: ผนังนอกทีละแผ่น / พื้นชั้นบน / ทางลาด
    if(hp){killProj(pr);continue;}
    for(const p of ps){
      if(!p.alive||p.downed||p.id===pr.owner||p.team===pr.team)continue;
      if((p.x-pr.x)**2+(p.y-pr.y)**2>(PR+pr.r)**2)continue;
      if(Math.abs(pr.h-cH(p))>vR(p)+pr.r/20)continue;
      if(p.inv>0)continue;
      if(p.shieldOn&&shieldFaces(p,pr.x-pr.vx*0.05,pr.y-pr.vy*0.05)){
        if(G.time-p.shieldT<0.28){
          // Perfect Parry: ปัดกระสุนทิ้ง (ไม่สะท้อนกลับแล้ว) ไม่เสียพลังโล่ + ผลพิเศษของแต่ละสาย
          pr.dead=true;
          if(!ultActive(p))p.ult=Math.min(100,p.ult+12*ULT_RATE);
          emit({k:'parry',x:p.x,y:p.y,h:p.z+1.3,id:p.id});
          {const B=PBASIC[p.pathIdx|0];if(B&&B.onParry&&!p.shPar){p.shPar=1;B.onParry(p);}}
        }else{
          if(p.pathIdx===EARTH)earthShHit(p,pr.dmg);else{p.shieldE-=pr.dmg*1.6;p.shBlk=(p.shBlk|0)+1;}pr.dead=true;emit({k:'block',x:pr.x,y:pr.y,h:pr.h});
          {const B=PBASIC[p.pathIdx|0];if(B&&B.onBlock)B.onBlock(p);}
          if(p.shieldE<=0)breakShield(p);
        }
        break;
      }
      hitTarget(pr,p);killProj(pr);break;
    }
    if(!pr.dead)for(const m of G.mins){
      if(m.dead||m.team===pr.team)continue;
      const hc=m.type==='golem'?1.6:m.type==='wolf'?0.8:(m.h||0),tol=(m.type==='golem'?1.7:m.type==='wolf'?0.8:0.55)+pr.r/20;
      if((m.x-pr.x)**2+(m.y-pr.y)**2<(m.r+pr.r)**2&&Math.abs(pr.h-hc)<tol){hitTarget(pr,m);killProj(pr);break;}
    }
    if(pr.dead||pr.src!=='p')continue;
    for(const e of G.en){
      if(e.dead)continue;
      if((e.x-pr.x)**2+(e.y-pr.y)**2<(e.r+pr.r)**2&&Math.abs(pr.h-cH(e))<vR(e)+pr.r/20+0.2){hitTarget(pr,e);killProj(pr);break;}
    }
  }
  G.proj=G.proj.filter(p=>!p.dead);
}
