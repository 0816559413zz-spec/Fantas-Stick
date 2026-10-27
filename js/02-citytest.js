// ---------- แมพทดสอบเมืองใหญ่ (กล่องเทา) — ใช้วัดความลื่นของเครื่องยนต์ก่อนสร้างเมืองจริง (designs/city-bot-battle.md ขั้น 2) ----------
// ไม่อยู่ในเมนู/ไม่สุ่ม • เรียกใช้จากคอนโซล: WD.G.mapPick='citytest' แล้วเริ่มเกม
// 9600 × 9600 px (480 × 480 ม.) • ถนนกว้าง 360 px ทุก 2400 px (4×4 บล็อก) • บ้านพังได้รอบขอบบล็อก + ต้นไม้ริมถนน + ลัง/ถังหน้าบ้าน
const CITY_N=4,CITY_B=2400,CITY_ROAD=360;
function genCityTest(){
  const W=CITY_N*CITY_B,H=W,obs=[],R=mulberry(9600),mid=W/2;
  for(let bx=0;bx<CITY_N;bx++)for(let by=0;by<CITY_N;by++){
    const x0=bx*CITY_B+CITY_ROAD/2,y0=by*CITY_B+CITY_ROAD/2,S=CITY_B-CITY_ROAD;
    for(let i=0;i<4;i++){const t=(i+0.5)/4;
      for(const [x,y,ry] of [[x0+S*t,y0+110,Math.PI],[x0+S*t,y0+S-110,0],[x0+110,y0+S*t,-Math.PI/2],[x0+S-110,y0+S*t,Math.PI/2]]){
        if(Math.hypot(x-mid,y-mid)<900)continue;   // ลานกลางเมือง (จุดเกิด co-op/ฝึก)
        if((ry===Math.PI||ry===0)&&(i===0||i===3))continue;   // มุมบล็อก: เหลือแค่หลังด้านข้าง ไม่ให้ซ้อนกัน
        const w=150+R()*40,d=120+R()*30;obs.push({x,y,r:Math.max(w,d)/2,k:'house',hgt:10,w,d,s:R(),ry});
      }
    }
  }
  return {W,H,obs};
}
function cityTestProps(){
  const M=MAPS.citytest,R=mulberry(4800),out=[],add=(k,x,y)=>out.push({i:out.length,k,x:Math.round(x),y:Math.round(y),a:R()*6.283,r:PROPDEF[k].r,hgt:PROPDEF[k].hgt,hp:PROPDEF[k].hp||0,st:0,ht:0});
  const free=(x,y,r)=>!M.obs.some(o=>Math.abs(x-o.x)<(o.w||o.r*2)/2+r+30&&Math.abs(y-o.y)<(o.w||o.r*2)/2+r+30);
  for(let k=1;k<CITY_N;k++)for(let s=150;s<M.W-150;s+=300)for(const side of [-1,1]){   // ต้นไม้สองฝั่งถนน (ไม่วางกลางสี่แยก)
    const c=k*CITY_B+side*(CITY_ROAD/2-30);if(Math.abs(s%CITY_B-CITY_B/2)>CITY_B/2-CITY_ROAD)continue;
    if(free(c,s,22))add(R()<0.5?'ptree':'ppine',c,s);if(free(s,c,22))add(R()<0.5?'ptree':'ppine',s,c);}
  for(const o of M.obs)if(o.k==='house')for(let i=0;i<2;i++){const a=R()*6.283,x=o.x+Math.cos(a)*(o.w/2+50),y=o.y+Math.sin(a)*(o.d/2+50);if(free(x,y,20))add(R()<0.5?'pcrate':'pbarrel',x,y);}
  return out;
}
MAPS.citytest=Object.assign({name:'🏙️ เมืองทดสอบ',d:'กล่องเทา 480×480 ม. สำหรับวัดความลื่น (ไม่อยู่ในเมนู)',props:cityTestProps},genCityTest());
