// ---------- พื้นสูงต่ำ (แผนที่จากไฟล์ Blender — กติกาฝั่งคนปั้นใน MAP-DESIGN.md) ----------
// ความสูงในระบบเกม (p.z, e.h, pr.h, h ของเอฟเฟกต์) ยังเป็น "สูงจากพื้นหลัก" เหมือนแผนที่เรียบ → คาถาเดิมไม่ต้องแก้
// ความสูงจริงในโลก 3D = terrT(x,y) + z • กระสุนบินตรงในโลกจริง: ปรับ pr.h ตามพื้นที่เปลี่ยนไปทุกเฟรม
// TERR = {c: ระยะห่างจุดตาราง (px), nx, ny, g: ความสูงพื้นหลัก (หน่วย 3D), fl:[{x0,y0,nx,ny,top,bot}] พื้นชั้นบน (NaN = ไม่มี)}
let TERR=null;
const TSTEP=1.1,TSLOPE=1.6;   // ค่าชั่วคราว: ก้าวขึ้นขอบพื้นชั้นบนได้สูงสุด 1.1 • ทางลาดชันสุด สูง/ระยะ = 1.6 (~58°) ชันกว่านี้ = หน้าผา
function terrT(x,y){
  if(!TERR)return 0;
  const T=TERR,fx=clamp(x/T.c,0,T.nx-1.001),fy=clamp(y/T.c,0,T.ny-1.001),i=fx|0,j=fy|0,u=fx-i,v=fy-j,k=j*T.nx+i,a=T.g;
  return (a[k]*(1-u)+a[k+1]*u)*(1-v)+(a[k+T.nx]*(1-u)+a[k+T.nx+1]*u)*v;
}
function floorAt(f,x,y,key){const i=Math.round((x-f.x0)/TERR.c),j=Math.round((y-f.y0)/TERR.c);if(i<0||j<0||i>=f.nx||j>=f.ny)return NaN;return f[key][j*f.nx+i];}
// จุด (x,y) ที่ความสูง h (จากพื้นหลัก) อยู่ในเนื้อพื้นไหม — ใช้กับกระสุนชนเนิน/สะพาน
function terrSolid(x,y,h){
  if(h<0)return true;if(!TERR||!TERR.fl.length)return false;
  const a=terrT(x,y)+h;for(const f of TERR.fl){const t=floorAt(f,x,y,'top');if(t>=a&&floorAt(f,x,y,'bot')<=a)return true;}
  return false;
}
// เดินบนพื้นสูงต่ำ: เรียกหลังขยับ o จาก (ox,oy) • z = ความสูงจากพื้นก่อนขยับ • onG = ยืนอยู่บนพื้น • คืนค่า z ใหม่ (นับจากพื้นตรงจุดใหม่)
// ทางชันเกิน/หน้าผา = ชนเหมือนกำแพง (ลองไถลตามแกน x หรือ y ก่อน) • ลงเนิน = ติดพื้นไปด้วย • เดินตกขอบหน้าผา = ร่วงลงตามแรงโน้มถ่วง
function terrMove(o,ox,oy,z,onG){
  if(!TERR)return z;
  const t0=terrT(ox,oy),a=t0+z;
  const ok=(x,y)=>{const t1=terrT(x,y);if(t1<=a+0.02)return true;if(!onG)return t1-a<=TSTEP*0.5;const run=Math.hypot(x-ox,y-oy)*S3;return run>1e-4&&(t1-t0)/run<=TSLOPE;};
  if(!ok(o.x,o.y)){if(ok(o.x,oy))o.y=oy;else if(ok(ox,o.y))o.x=ox;else{o.x=ox;o.y=oy;}}
  let nz=Math.max(0,a-terrT(o.x,o.y));
  if(onG&&nz>0){const g=groundH(o.x,o.y,nz),run=Math.hypot(o.x-ox,o.y-oy)*S3;if(nz-g<0.6&&run>1e-4&&(nz-g)/run<=TSLOPE*1.5)nz=g;}
  return nz;
}
function updateGlaciers(dt){
  if(!G.glac||!G.glac.length)return;
  for(const s of G.glac){
    s.age+=dt;s.t-=dt;
    s.h=s.t<=0?0:s.H*clamp((s.age-s.delay)/0.22,0,1);
    if(s.h>0&&!s.hitDone){
      s.hitDone=true;const o=G.players[s.owner];
      if(o)for(const t of foesOf(s.team)){
        if(s.grp.has(t))continue;
        if(Math.hypot(t.x-s.x,t.y-s.y)<s.r+(t.r||PR)){s.grp.add(t);const nx=-Math.sin(s.a),ny=Math.cos(s.a),sd=((t.x-s.x)*nx+(t.y-s.y)*ny)>=0?1:-1;aoeHit(o,t,15,t=>{addFreeze(t,1);knock(t,t.x-nx*sd*10,t.y-ny*sd*10,220);});}
      }
    }
  }
  G.glac=G.glac.filter(s=>s.t>0);
}
