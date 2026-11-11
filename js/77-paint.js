// =====================================================================
//  Paint 🎨 — ลุค "ภาพวาด" (branch graphics-painterly, ทดลอง): ป่ากลางวันแดดลอดใบไม้แบบภาพอ้างอิงของผู้ใช้ (2026-11-10)
//  ทำ 5 อย่างกับแมพที่อยู่ใน PAINT.maps (ตอนนี้ = forest) — ปิดทั้งหมด: ?nopaint
//   ① ฟ้ากลางวัน + แดดอุ่น + เงาอมเขียวฟ้า + หมอกเขียวอ่อน (paintMap ทับ sky/fog/look ของไฟล์แมพ, paintLights ตั้งไฟ, พรีเซ็ต Look 'paint')
//   ② ต้นไม้/พุ่มไม้ใหม่ (paintScene): ลำต้นสูงเปลือกไม้ทาสี + พุ่มใบเป็นแผ่นใบไม้ปาดพู่กัน (alpha) เรียงเป็นก้อน — แทน geometry ของ forest_tree / forest_far / forest_bush
//      ใช้โหนดเดิมของแมพ → ระบบชน/พัง (brk) ทำงานเหมือนเดิม • ใบทอดเงาจริง = แดดลอดเป็นดวง ๆ บนพื้น
//   ③ ลายพู่กันบนผิวทุกชิ้นของแมพ (paintApply): สี/ความสว่างแปรเป็นรอยปาดในพิกัดโลก (รอยสว่างอมเหลือง รอยมืดอมฟ้า)
//   ④ ฟิลเตอร์ภาพวาดทั้งจอ (Kuwahara 4 ทิศ) ก่อนแสงฟุ้ง — เกลี่ยสีเป็นปื้นแบบสีโปสเตอร์ ขอบยังคม • ปิดในกราฟิกประหยัด
//   ⑤ ฉากหลังไกล (js/67) เปลี่ยนเป็นสีกลางวัน
//  ค่าปรับได้: tune.html → 🎨 Paint • debug: WD.PAINT
// =====================================================================
var PAINT={on:!/[?&]nopaint\b/.test(location.search),cur:null,kit:null,
  kuw:1,kuwR:1.0,shaft:0.2,grass:[1.3,1.28,0.9],ground:[1.5,1.3,0.55],stroke:0.5,strokeHue:0.6,sat:1.32,sun:3.4,
  maps:{forest:{sky:'day',fog:['#9fdccc',30,260],look:'paint',weather:'clear:100',
    back:{near:{col:'#4a8a3c',col2:'#35703a'},trees:{col:['#2f6e3c','#3d8440','#28603a']},mid:{col:'#5f9c88',lit:'#b4dcb0',tint:'#8cc4a6'},
      mist:[{d:235,h:45,col:'#d4f0dc',a:0.6}],far:{col:'#8cbcc0',lit:'#e0f4e0',tint:'#b0dcd0',snow:'#f6fff4'}}}},
  cel:1,vivid:1,fxcel:1,bloom:0.42,U:{tPt:{value:null},uPt:{value:new THREE.Vector4(1/3.2,1/9,0.5,0.6)},uPtCel:{value:0}},
  KU:{tDiffuse:{value:null},uPx:{value:new THREE.Vector2(1,1)},uR:{value:1.0},uK:{value:1}}};
function paintOn(id){return !!(PAINT&&PAINT.on&&PAINT.maps[id]);}
// ทับค่าของไฟล์แมพก่อนสร้างฉาก (เรียกจาก buildWorld js/28) — เก็บค่าเดิมไว้คืนเมื่อปิด
function paintMap(id,FM){
  if(!PAINT||!FM)return;const o=PAINT.maps[id];if(!o)return;
  if(!FM._pt0)FM._pt0={sky:FM.sky,fog:FM.fog,look:FM.look,weather:FM.weather};
  Object.assign(FM,PAINT.on?{sky:o.sky,fog:o.fog,look:o.look,weather:o.weather}:FM._pt0);
  const B=typeof BACKDROP!=='undefined'&&BACKDROP[id];
  if(B&&o.back){if(!B._pt0)B._pt0=JSON.parse(JSON.stringify(B,(k,v)=>v instanceof RegExp?undefined:v));
    const src=PAINT.on?o.back:B._pt0;for(const k of Object.keys(o.back)){if(Array.isArray(src[k]))B[k]=src[k].map(x=>Object.assign({},x));else Object.assign(B[k],src[k]);}}
}
// ไฟของแมพภาพวาด (เรียกท้าย buildWorld) — เงาได้สีจากแสงฟ้า (เขียวอมฟ้า) ส่วนโดนแดดอุ่นเหลือง
function paintLights(id){
  if(!PAINT)return;PAINT.cur=paintOn(id)?id:null;
  if(PAINT.pass)PAINT.pass.enabled=!!PAINT.cur&&PAINT.kuw>0&&QUAL.mode!=='low';
  paintGrass();paintVfx();
  if(!PAINT.cur){GRADEU.uSat.value=1.1;PAINT.U.uPtCel.value=0;return;}
  hemi.color.set('#86dcea');hemi.groundColor.set('#4f9a58');hemi.intensity=LOOK.P.paint.hemi;
  moonL.color.set('#fff0bc');moonL.intensity=PAINT.sun;GRADEU.uSat.value=PAINT.sat;
  PAINT.KU.uK.value=PAINT.kuw;PAINT.U.uPtCel.value=PAINT.cel;
}
// ---------- VFX สีสด (ทดลอง): บนแมพสว่าง เอฟเฟกต์เรืองแสงเดิมซีดเป็นขาว-เหลืองอ่อน → ดันความสด + กดสีซีดให้เข้ม, ไฟไล่ เหลือง→ส้ม→แดง→ม่วงแดง, แสงฟุ้งเบาลง ----------
const _ptHSL={h:0,s:0,l:0};
function paintVivid(c){c.getHSL(_ptHSL,THREE.SRGBColorSpace);let {h,s,l}=_ptHSL;
  if(s>0.12){s=Math.min(1,s*1.5+0.1);if(l>0.6)l=0.6+(l-0.6)*0.35;c.setHSL(h,s,l,THREE.SRGBColorSpace);}return c;}
function paintVfx(){
  if(typeof FLAMELUT==='undefined')return;const on=!!(PAINT.cur&&PAINT.vivid);
  if(!PAINT.lut0){PAINT.lut0=FLAMELUT.map(c=>c.clone());
    const st=[[0,'#fff59a'],[0.12,'#ffc814'],[0.3,'#ff7a00'],[0.5,'#ff2e12'],[0.72,'#c80f1e'],[0.9,'#7a0a12'],[1,'#3a0808']].map(([t,c])=>[t,new THREE.Color(c)]);
    PAINT.lut1=PAINT.lut0.map((_,i)=>{const t=i/63;let k=0;while(k<st.length-2&&st[k+1][0]<t)k++;const [t0,c0]=st[k],[t1,c1]=st[k+1];return c0.clone().lerp(c1,Math.min(1,Math.max(0,(t-t0)/(t1-t0))));});}
  FLAMELUT.forEach((c,i)=>c.copy(on?PAINT.lut1[i]:PAINT.lut0[i]));
  PCEL.value=PAINT.cur&&PAINT.fxcel?1:0;   // ไฟ/จุดแสงแบบ cel (js/30, js/42)
  const fu=PSYS[2].mat&&PSYS[2].mat.uniforms.uFL;   // ตารางสีเปลวของอนุภาคบน GPU
  if(fu){if(!PAINT.fl0)PAINT.fl0=fu.value.map(c=>c.clone());const V=['#fff59a','#ffc814','#ff7a00','#ff2e12','#e0181a','#b01010','#7a0c0c'];fu.value.forEach((c,i)=>on?c.set(V[i]):c.copy(PAINT.fl0[i]));}
  if(PAINT.bloom0===undefined)PAINT.bloom0=bloom.strength;bloom.strength=on?PAINT.bloom:PAINT.bloom0;}
// ใบหญ้า (js/50): ย้อมเขียวเหลืองสว่าง + โคนไม่มืด เฉพาะแมพภาพวาด (mesh หญ้าสร้างทีหลังได้ → PaintPass เรียกซ้ำทุกเฟรม)
function paintGrass(){const m=typeof GRASS!=='undefined'&&GRASS.mesh;if(!m)return;const u=m.material.userData.U.uGrPt.value,g=PAINT.grass;const c=m.material.userData.U.uGrCl.value;if(PAINT.cur){u.set(g[0],g[1],g[2],1);c.set(0.42,0.93);}else{u.set(1,1,1,0);c.set(0,0.78);}}
// ---------- ภาพผิว: เปลือกไม้ (ครึ่งซ้าย) + ใบไม้ปาดพู่กัน 4 แบบ (ครึ่งขวา 2×2) ----------
function paintAtlas(){
  const W=1024,H=512,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),R=mulberry(7701);
  // เปลือกไม้: พื้นน้ำตาลเขียวเข้ม + รอยปาดแนวตั้งหลายโทน + ตะไคร่เขียวเหลืองเป็นจุด ๆ (ต่อกันแนวตั้ง)
  g.fillStyle='#4a3326';g.fillRect(0,0,512,H);
  const bark=['#33221a','#281a15','#5c3f2c','#6e4a30','#3f2a1f','#80583a','#21161a'];
  for(let i=0;i<520;i++){const x=R()*512,y=R()*H,l=40+R()*150,w=3+R()*11;g.fillStyle=bark[Math.floor(R()*bark.length)];g.globalAlpha=0.35+R()*0.5;
    for(const oy of [0,-H,H]){g.beginPath();g.ellipse(x,y+oy,w,l,(R()-0.5)*0.12,0,6.2832);g.fill();}}
  const moss=['#6f8a3a','#8aa84a','#55702f','#a4bd58'];
  for(let i=0;i<900;i++){const x=R()*512,y=R()*H,s=1.5+R()*4.5;g.fillStyle=moss[Math.floor(R()*moss.length)];g.globalAlpha=0.25+R()*0.55;
    for(const oy of [0,-H,H]){g.beginPath();g.ellipse(x,y+oy,s*(0.6+R()*0.6),s,R()*3,0,6.2832);g.fill();}}
  g.globalAlpha=1;
  // ใบไม้: กลุ่มรอยปาดรูปใบ (ชั้นล่างเข้ม → ชั้นบนอ่อน) ในวงกลม พื้นโปร่งใส • สีเกือบขาว (สีจริงมาจากสีจุดยอด)
  for(let t=0;t<4;t++){const ox=512+(t%2)*256,oy=Math.floor(t/2)*256,cx=ox+128,cy=oy+128,n=t<2?46:34;
    for(let L=0;L<3;L++)for(let i=0;i<n;i++){
      const a=R()*6.2832,rr=Math.sqrt(R())*(L===0?96:L===1?88:74),x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*0.92,len=13+R()*15,wd=5+R()*6,rot=a+(R()-0.5)*1.6+(t%2?0.6:-0.3);
      const v=L===0?150+R()*40:L===1?195+R()*35:228+R()*27;g.fillStyle='rgb('+Math.round(v*0.93)+','+Math.round(v)+','+Math.round(v*(0.78+R()*0.14))+')';
      g.beginPath();g.ellipse(x,y,len,wd,rot,0,6.2832);g.fill();}}
  const im=g.getImageData(0,0,W,H),s=im.data,D=new Uint8Array(W*H*4);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const p=(y*W+x)*4,q=((H-1-y)*W+x)*4;let a=x<512?255:s[p+3];
    if(a<8){D[q]=200;D[q+1]=215;D[q+2]=170;D[q+3]=0;}else{D[q]=s[p];D[q+1]=s[p+1];D[q+2]=s[p+2];D[q+3]=a;}}   // พื้นโปร่งใส = สีใบ (ขอบไม่ดำตอนย่อภาพ)
  const tx=new THREE.DataTexture(D,W,H,THREE.RGBAFormat);tx.colorSpace=THREE.SRGBColorSpace;tx.wrapS=THREE.ClampToEdgeWrapping;tx.wrapT=THREE.RepeatWrapping;
  tx.magFilter=THREE.LinearFilter;tx.minFilter=THREE.LinearMipmapLinearFilter;tx.generateMipmaps=true;tx.anisotropy=4;tx.needsUpdate=true;tx.userData.keep=true;return tx;
}
// ลายพู่กัน (เทา, ต่อกันไร้รอยต่อ): รอยปาดสั้น ๆ เอียงไปทางเดียวกันเป็นส่วนใหญ่
function paintStrokeTex(){
  const N=256,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d'),R=mulberry(9917);
  g.fillStyle='#808080';g.fillRect(0,0,N,N);
  for(let i=0;i<1100;i++){const x=R()*N,y=R()*N,l=9+R()*20,w=2.5+R()*5,rot=0.5+(R()-0.5)*1.3,v=Math.round(60+R()*140);
    g.fillStyle='rgb('+v+','+v+','+v+')';g.globalAlpha=0.3+R()*0.4;
    for(const ox of [0,-N,N])for(const oy of [0,-N,N]){if(x+ox<-40||x+ox>N+40||y+oy<-40||y+oy>N+40)continue;g.beginPath();g.ellipse(x+ox,y+oy,l,w,rot,0,6.2832);g.fill();}}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.userData.keep=true;return t;
}
// ---------- ต้นไม้ ----------
function paintTreeGeo(o){
  const R=mulberry(o.seed),P=[],Nn=[],UV=[],C=[],I=[],col=new THREE.Color();
  const v=(x,y,z,nx,ny,nz,u,w,r,g,b)=>{P.push(x,y,z);Nn.push(nx,ny,nz);UV.push(u,w);C.push(r,g,b);return P.length/3-1;};
  const bend=t=>[Math.sin(t*2.2+o.seed)*o.lean*t,Math.cos(t*1.7+o.seed*2)*o.lean*t];
  // ลำต้น: วงแหวน 8 เหลี่ยม เรียวขึ้น โคนบาน โค้งนิด ๆ • สีจุดยอด: โคนเข้ม/ชื้น → บนสว่างขึ้น
  if(o.H>0){const S=8,rings=10;
    for(let j=0;j<=rings;j++){const t=j/rings,y=t*o.H,[bx,bz]=bend(t),r=(o.r0*(1-t)+o.r1*t)*(1+1.1*Math.pow(Math.max(0,1-y/1.3),2)),k=0.62+0.5*t;
      for(let i=0;i<=S;i++){const a=i/S*6.2832,ca=Math.cos(a),sa=Math.sin(a);v(bx+ca*r,y,bz+sa*r,ca,0.12,sa,0.03+0.44*Math.abs(1-2*i/S),y/4.5,k,k,k*0.96);}}
    for(let j=0;j<rings;j++)for(let i=0;i<S;i++){const a=j*(S+1)+i,b=a+1,c2=a+S+1,d=c2+1;I.push(a,c2,b,b,c2,d);}
    // กิ่งแห้งสั้น ๆ ข้างลำต้น (แบบป่าสนในภาพ)
    for(let s=0;s<(o.stubs||0);s++){const t=0.2+R()*0.45,y=t*o.H,[bx,bz]=bend(t),a=R()*6.2832,len=0.9+R()*1.7,r=0.07+R()*0.05,dx=Math.cos(a),dz=Math.sin(a),dy=-0.12+R()*0.3;
      const tip=v(bx+dx*len,y+dy*len,bz+dz*len,dx,0.3,dz,0.25,y/4.5+0.2,0.5,0.5,0.46),base=[];
      for(let i=0;i<4;i++){const q=i/4*6.2832,px=-dz*Math.cos(q)*r,pz=dx*Math.cos(q)*r,py=Math.sin(q)*r;base.push(v(bx+px,y+py,bz+pz,px/r,py/r,pz/r,0.1+i*0.08,y/4.5,0.55,0.55,0.5));}
      for(let i=0;i<4;i++)I.push(base[i],tip,base[(i+1)%4]);}
  }
  // พุ่มใบ: ก้อน (blob) หลายก้อน แต่ละก้อนมีแผ่นใบหันออกจากกลางก้อน • normal = ชี้ออกจากกลางก้อน+เงยขึ้น (แสงเนียนทั้งก้อน)
  // สีจุดยอด: ล่าง/ใน = เขียวเข้มอมฟ้า → บน = เขียวเหลืองสว่าง
  const pal=o.pal||['#17463a','#2a7a3a','#5cab3a','#b9d94e'];
  const ramp=h=>{const n=pal.length-1,f=Math.max(0,Math.min(0.9999,h))*n,i=Math.floor(f);col.set(pal[i]).lerp(new THREE.Color(pal[i+1]),f-i);return col;};
  for(const B of o.blobs){const [bx0,bz0]=o.H>0?bend(Math.min(1,B[1]/o.H)):[0,0];
    for(let k=0;k<B[4];k++){
      const u=R(),th=R()*6.2832,cy=1-u*1.55,sy=Math.sqrt(Math.max(0,1-cy*cy));let dx=Math.cos(th)*sy,dy=cy,dz=Math.sin(th)*sy;   // เน้นครึ่งบน + ลงใต้ก้อนนิดหน่อย
      const rad=B[3]*(0.72+R()*0.3),px=B[0]+bx0+dx*rad,py=B[1]+dy*rad*(B[5]||0.8),pz=B[2]+bz0+dz*rad;
      // แกนของแผ่น: หันออก (เอียงสุ่ม) + หมุนรอบตัวเอง
      let fx=dx+(R()-0.5)*0.7,fy=dy*0.7+0.25+(R()-0.5)*0.5,fz=dz+(R()-0.5)*0.7;const fl=Math.hypot(fx,fy,fz)||1;fx/=fl;fy/=fl;fz/=fl;
      let rx=fz,ry=0,rz=-fx;const rl=Math.hypot(rx,rz);if(rl<0.05){rx=1;rz=0;}else{rx/=rl;rz/=rl;}
      let ux=fy*rz-fz*ry,uy=fz*rx-fx*rz,uz=fx*ry-fy*rx;
      const ro=R()*6.2832,cr=Math.cos(ro),sr=Math.sin(ro),ax=rx*cr+ux*sr,ay=ry*cr+uy*sr,az=rz*cr+uz*sr,bx=-rx*sr+ux*cr,by=-ry*sr+uy*cr,bz=-rz*sr+uz*cr;
      const s=B[6]*(0.8+R()*0.45)*0.5,tile=Math.floor(R()*4),u0=0.5+(tile%2)*0.25,v0=Math.floor(tile/2)*0.5;
      let nx=dx*0.75,ny=dy*0.75+0.55,nz=dz*0.75;const nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;
      const h=(py-o.ly0)/(o.ly1-o.ly0),c0=ramp(h*0.82+(R()-0.5)*0.22+(dy>0.2?0.12:0)),r=c0.r,g2=c0.g,b=c0.b;
      const a0=v(px-ax*s-bx*s,py-ay*s-by*s,pz-az*s-bz*s,nx,ny,nz,u0+0.004,v0+0.004,r*0.86,g2*0.86,b*0.92),
        a1=v(px+ax*s-bx*s,py+ay*s-by*s,pz+az*s-bz*s,nx,ny,nz,u0+0.246,v0+0.004,r*0.86,g2*0.86,b*0.92),
        a2=v(px+ax*s+bx*s,py+ay*s+by*s,pz+az*s+bz*s,nx,ny,nz,u0+0.246,v0+0.496,r,g2,b),
        a3=v(px-ax*s+bx*s,py-ay*s+by*s,pz-az*s+bz*s,nx,ny,nz,u0+0.004,v0+0.496,r,g2,b);
      I.push(a0,a1,a2,a0,a2,a3,a0,a2,a1,a0,a3,a2);   // สองหน้า (ลำดับจุดกลับด้าน) ใช้ normal เดียวกัน → ด้านหลังไม่มืด
    }}
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
  geo.setIndex(I);geo.computeBoundingSphere();geo.computeBoundingBox();return geo;
}
// ก้อนใบ = [x, y, z, รัศมี, จำนวนแผ่น, ความแบนแนวตั้ง, ขนาดแผ่น]
function paintCanopy(R,y0,y1,spread,n,rad,cards,size){const L=[];
  for(let i=0;i<n;i++){const t=n>1?i/(n-1):0.5,a=i*2.4+R()*1.2,d=spread*(i===n-1?0.15:0.45+R()*0.55)*(1-t*0.45);
    L.push([Math.cos(a)*d,y0+(y1-y0)*t+(R()-0.5)*0.6,Math.sin(a)*d,rad*(0.8+R()*0.45)*(1-t*0.25),cards,0.72,size]);}
  return L;}
function paintKit(){
  if(PAINT.kit)return PAINT.kit;
  const R=mulberry(31337),map=paintAtlas();
  const mat=new THREE.MeshStandardMaterial({map,vertexColors:true,alphaTest:0.42,roughness:1,metalness:0,side:THREE.FrontSide,name:'paint_tree'});
  mat.userData.noSurf=true;mat.userData.keep=true;mat.userData.noBake=true;mat.envMapIntensity=0.55;
  // ใบไหวตามลมเบา ๆ (เฉพาะแผ่นใบ: uv.x > 0.5) — ใช้เวลาเดียวกับลำแสง/ฝุ่น
  mat.onBeforeCompile=sh=>{sh.uniforms.uPtT=PAINT.T;
    sh.vertexShader='uniform float uPtT;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n if(uv.x>0.5){float ph=position.x*0.7+position.z*0.9+position.y*0.5;transformed.x+=sin(uPtT*1.3+ph)*0.07;transformed.z+=cos(uPtT*1.1+ph*1.3)*0.07;transformed.y+=sin(uPtT*1.7+ph*0.7)*0.03;}');};
  mat.customProgramCacheKey=()=>'ptree1';paintPatch(mat,false);
  const tree=[
    paintTreeGeo({seed:11,H:14.5,r0:0.42,r1:0.14,lean:0.9,stubs:6,ly0:7,ly1:17,blobs:paintCanopy(R,9.2,15.6,3.6,8,2.5,17,2.5)}),
    paintTreeGeo({seed:23,H:12,r0:0.38,r1:0.13,lean:1.4,stubs:4,ly0:6,ly1:14.5,blobs:paintCanopy(R,7.6,13,3.2,7,2.3,16,2.4)}),
    paintTreeGeo({seed:37,H:8.5,r0:0.5,r1:0.2,lean:0.7,stubs:1,ly0:4.5,ly1:11.5,blobs:paintCanopy(R,6,10,3.4,8,2.6,17,2.6)}),
    paintTreeGeo({seed:41,H:16.5,r0:0.46,r1:0.14,lean:0.6,stubs:7,ly0:9,ly1:19,blobs:paintCanopy(R,11,17.6,3.4,7,2.4,16,2.5)})];
  const far=[
    paintTreeGeo({seed:51,H:13,r0:0.4,r1:0.15,lean:0.8,stubs:0,ly0:6,ly1:15,blobs:paintCanopy(R,8,14,3.2,5,2.8,9,3.6)}),
    paintTreeGeo({seed:57,H:10,r0:0.4,r1:0.16,lean:1,stubs:0,ly0:5,ly1:12,blobs:paintCanopy(R,6,11,3.2,5,2.8,9,3.6)})];
  const bush=[
    paintTreeGeo({seed:61,H:0,ly0:-0.2,ly1:1.9,pal:['#1c5238','#2f8438','#6ab83c','#c6e055'],blobs:[[0,0.45,0,0.75,10,0.75,1.15],[0.6,0.35,0.3,0.55,7,0.75,1.0],[-0.5,0.4,-0.4,0.6,7,0.75,1.0]]}),
    paintTreeGeo({seed:67,H:0,ly0:-0.2,ly1:1.7,pal:['#1a4c3c','#2a7a40','#58a83a','#b4d850'],blobs:[[0,0.4,0,0.7,10,0.7,1.1],[-0.55,0.3,0.35,0.5,7,0.7,0.95]]})];
  return PAINT.kit={mat,tree,far,bush,stroke:(PAINT.U.tPt.value=paintStrokeTex())};
}
PAINT.T={value:0};
// ---------- ลายพู่กันบนผิว (ต่อท้าย onBeforeCompile เดิมของวัสดุ เหมือน js/76) ----------
const PT_VS='varying vec3 vPtP;varying vec3 vPtN;\n';
const PT_VS_BODY='\n{vec4 ptl=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\n ptl=instanceMatrix*ptl;\n#endif\n vPtP=(modelMatrix*ptl).xyz;vPtN=normalize(mat3(modelMatrix)*objectNormal);}\n';
const PT_FS='varying vec3 vPtP;varying vec3 vPtN;uniform sampler2D tPt;uniform vec4 uPt;\n';
const PT_FS_BODY=`
{vec3 pa=abs(vPtN);vec2 pp=(pa.y>=pa.x&&pa.y>=pa.z)?vPtP.xz:((pa.x>=pa.z)?vPtP.zy:vPtP.xy);
 float ps=(texture2D(tPt,pp*uPt.x).r-0.5)*0.65+(texture2D(tPt,pp.yx*uPt.y+0.37).r-0.5)*0.35;
 vec3 pc=diffuseColor.rgb;pc*=1.0+ps*uPt.z*2.0;
 pc=mix(pc,pc*vec3(1.2,1.08,0.7),smoothstep(0.04,0.26,ps)*uPt.w);
 pc=mix(pc,pc*vec3(0.7,0.96,1.14),smoothstep(-0.04,-0.26,ps)*uPt.w);
 diffuseColor.rgb=pc;}
`;
// แสงแบบ cel-shade: แสงตรง (แดด/ไฟ) ตัดเป็น 2 แถบ (เงา / กลาง / สว่าง) แทนไล่เฉดเรียบ — แก้ในสูตรแสงของวัสดุ Standard, uPtCel = ความแรง (0 = แสงเดิม)
const PT_CEL_RE=/float dotNL = saturate\( dot\( (geometryNormal|geometry\.normal), directLight\.direction \) \);(\s*)vec3 irradiance = dotNL \* directLight\.color;/;
const PT_CEL_CHUNK=THREE.ShaderChunk.lights_physical_pars_fragment.replace(PT_CEL_RE,(m,n,ws)=>'float dotNL = dot( '+n+', directLight.direction );dotNL=mix(saturate(dotNL),smoothstep(0.0,0.07,dotNL)*0.6+smoothstep(0.5,0.57,dotNL)*0.4,uPtCel);'+ws+'vec3 irradiance = dotNL * directLight.color;');
PAINT.celOk=PT_CEL_CHUNK!==THREE.ShaderChunk.lights_physical_pars_fragment;
// ใส่ลุคภาพวาดให้วัสดุ: strokes = ลายพู่กัน (เฉพาะชิ้นแมพ) • cel ใส่ทุกชิ้น (รวมตัวละคร/ของประกอบฉาก — paintSweep)
function paintPatch(m,strokes){
  if(!m||!m.isMeshStandardMaterial||m.userData.pt)return m;
  if(strokes&&(m.transparent||m.alphaTest||/water|glass|sky|glow|emit|ice|fire|paint_tree/i.test(m.name||'')))strokes=false;
  m.userData.pt=strokes?2:1;
  const prior=m.onBeforeCompile,def=THREE.Material.prototype.onBeforeCompile,pk=m.customProgramCacheKey,pkDef=THREE.Material.prototype.customProgramCacheKey;
  m.onBeforeCompile=function(sh,r){
    if(prior&&prior!==def)prior.call(this,sh,r);
    Object.assign(sh.uniforms,PAINT.U);
    let f=sh.fragmentShader;
    if(PAINT.celOk&&f.includes('#include <lights_physical_pars_fragment>'))f='uniform float uPtCel;\n'+f.replace('#include <lights_physical_pars_fragment>',PT_CEL_CHUNK);
    if(strokes){sh.vertexShader=PT_VS+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>'+PT_VS_BODY);
      f=PT_FS+f.replace('#include <alphatest_fragment>',PT_FS_BODY+'#include <alphatest_fragment>');}
    sh.fragmentShader=f;};
  m.customProgramCacheKey=function(){return (pk&&pk!==pkDef?pk.call(this):(prior&&prior!==def?prior.toString().length:''))+'|pt2'+(strokes?'s':'c');};
  m.needsUpdate=true;return m;}
function paintApply(m){return paintPatch(m,true);}
// กวาดทั้งฉากเป็นระยะ (เฉพาะตอนอยู่แมพภาพวาด): วัสดุใหม่ที่ยังไม่มี cel (ตัวละคร, prop, ชิ้นที่เกิดทีหลัง) → ใส่
function paintSweep(){scene.traverse(o=>{if(!o.isMesh)return;const M=o.material;if(Array.isArray(M)){for(const m of M)if(m&&!m.userData.pt)paintPatch(m,false);}else if(M&&!M.userData.pt)paintPatch(M,false);});}
// ---------- ฉากของแมพ (เรียกจาก buildFileMap ก่อน brkSetup/batchStatic) ----------
function paintScene(id,sc){
  if(!paintOn(id))return;const K=paintKit();let n=0;
  const hash=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h;};
  sc.traverse(o=>{if(!o.isMesh)return;const nm=o.name||'';
    const set=(L)=>{const bb=o.geometry.boundingBox||(o.geometry.computeBoundingBox(),o.geometry.boundingBox);o.userData.ptY=bb.min.y;
      o.geometry=L[(hash(nm)+n++)%L.length];o.material=K.mat;o.castShadow=true;o.receiveShadow=true;};
    if(/^forest_tree/i.test(nm))set(K.tree);
    else if(/^forest_far/i.test(nm))set(K.far);
    else if(/^forest_bush/i.test(nm))set(K.bush);
    else{const ms=Array.isArray(o.material)?o.material:[o.material];
      if(/^ground/i.test(nm))for(const m of ms)if(m.color&&!m.userData.ptG){m.userData.ptG=1;m.color.multiply(new THREE.Color(PAINT.ground[0],PAINT.ground[1],PAINT.ground[2]));}   // พื้นหญ้า: เขียวเหลืองสดแบบโดนแดด (สีใบหญ้าตามพื้น)
      ms.forEach(paintApply);}});
  PAINT.n=n;sc.add(paintShafts());
}
// ลำแสงลอดใบไม้: แผ่นแสงยาวเอียงตามทิศแดด (additive) กระจายทั่วป่า รวมเป็น mesh เดียว
function paintShafts(){
  const R=mulberry(5150),P=[],UV=[],I=[],a=LDIR.clone().normalize(),w1=new THREE.Vector3().crossVectors(a,new THREE.Vector3(0,1,0)).normalize(),w2=new THREE.Vector3().crossVectors(a,w1).normalize();
  const N=Math.round(MW*MH/90000);
  for(let i=0;i<N;i++){const x=R()*MW,y=R()*MH,gx=tx(x),gz=tz(y),gy=GY(x,y),L=16+R()*10,wd=1.6+R()*3.4;
    for(const w of [w1,w2]){const k=P.length/3;
      for(const [u,t] of [[0,0],[1,0],[1,1],[0,1]]){const s=(u-0.5)*wd,d=-1.5+t*L;P.push(gx+w.x*s+a.x*d,gy+w.y*s+a.y*d,gz+w.z*s+a.z*d);UV.push(u,t);}
      I.push(k,k+1,k+2,k,k+2,k+3);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));g.setIndex(I);
  const tex=texCanvas(64,128,(c)=>{const im=c.createImageData(64,128);for(let y=0;y<128;y++)for(let x=0;x<64;x++){const u=x/63,t=1-y/127,e=Math.pow(Math.sin(u*Math.PI),1.6)*Math.min(1,t*5)*Math.pow(1-t,0.7),p=(y*64+x)*4,v=Math.round(e*255);im.data[p]=im.data[p+1]=im.data[p+2]=v;im.data[p+3]=255;}c.putImageData(im,0,0);});
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:tex,color:new THREE.Color('#fff3b8').multiplyScalar(PAINT.shaft),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide,name:'paint_glow_shaft'}));m.material.userData.noBake=true;
  m.renderOrder=5;m.frustumCulled=false;m.name='paint_shafts';return m;}
// ---------- ฟิลเตอร์ภาพวาด (Kuwahara 4 ทิศ, 64 จุด) — เลือกค่าเฉลี่ยของมุมที่สีเรียบที่สุด = ปื้นสีเรียบ ขอบคม ----------
class PaintPass extends Pass{
  constructor(){super();this.needsSwap=true;
    this.q=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:PAINT.KU,depthTest:false,depthWrite:false,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
      fragmentShader:'uniform sampler2D tDiffuse;uniform vec2 uPx;uniform float uR;uniform float uK;varying vec2 vUv;const vec3 LW=vec3(0.2126,0.7152,0.0722);'+
        'vec3 tm(vec2 o){vec3 c=max(texture2D(tDiffuse,vUv+o).rgb,0.0);return c/(1.0+dot(c,LW));}'+
        'void main(){vec3 src=texture2D(tDiffuse,vUv).rgb;'+
        'vec3 m0=vec3(0.0),m1=vec3(0.0),m2=vec3(0.0),m3=vec3(0.0),s0=vec3(0.0),s1=vec3(0.0),s2=vec3(0.0),s3=vec3(0.0),c;'+
        'float W=0.0;for(int j=0;j<=3;j++)for(int i=0;i<=3;i++){float d2=float(i*i+j*j);if(d2>10.5)continue;float w=exp(-d2/9.0);W+=w;vec2 o=vec2(float(i),float(j))*uPx*uR;'+
          'c=tm(vec2(-o.x,-o.y));m0+=c*w;s0+=c*c*w;c=tm(vec2(o.x,-o.y));m1+=c*w;s1+=c*c*w;c=tm(vec2(-o.x,o.y));m2+=c*w;s2+=c*c*w;c=tm(o);m3+=c*w;s3+=c*c*w;}'+
        'm0/=W;m1/=W;m2/=W;m3/=W;'+
        'float v0=dot(abs(s0/W-m0*m0),vec3(1.0))+1e-6,v1=dot(abs(s1/W-m1*m1),vec3(1.0))+1e-6,v2=dot(abs(s2/W-m2*m2),vec3(1.0))+1e-6,v3=dot(abs(s3/W-m3*m3),vec3(1.0))+1e-6;'+
        'float vm=min(min(v0,v1),min(v2,v3)),a0=pow(vm/v0,5.0),a1=pow(vm/v1,5.0),a2=pow(vm/v2,5.0),a3=pow(vm/v3,5.0);'+   // ผสมนุ่มระหว่าง 4 มุม (ไม่เป็นบล็อกเหลี่ยม)
        'vec3 b=(m0*a0+m1*a1+m2*a2+m3*a3)/(a0+a1+a2+a3);'+
        'b=b/max(1.0-dot(b,LW),0.02);if(!(b.r+b.g+b.b>=0.0))b=src;'+
        'gl_FragColor=vec4(mix(src,b,uK),1.0);}'}));}
  render(r,write,read){const U=PAINT.KU;U.tDiffuse.value=read.texture;U.uPx.value.set(1/read.width,1/read.height);U.uR.value=PAINT.kuwR*Math.max(1,read.height/720);U.uK.value=typeof screen==='string'&&screen!=='game'?0:PAINT.kuw;
    PAINT.T.value=performance.now()*0.001;paintGrass();if(PAINT.cur&&(PAINT.fr=(PAINT.fr||0)+1)%30===1)paintSweep();
    r.setRenderTarget(this.renderToScreen?null:write);this.q.render(r);}
}
PAINT.pass=new PaintPass();PAINT.pass.enabled=false;
composer.insertPass(PAINT.pass,composer.passes.indexOf(bloom));
// พรีเซ็ต Look ของลุคภาพวาด: ฟ้ากลางวัน • เงาอมเขียวฟ้า ไฮไลต์อมเหลือง (lo/hi) • ลำแสง + หมอก + ละอองลอย
lookPreset('paint','dusk',{sky:'noon',warm:true,env:0.75,tr:0.86,tg:1.06,tb:1.02,hemi:0.82,amb:0.14,exp:1.0,con:1.12,split:0.14,tone:0,rays:1.1,haze:0.75,hazeK:1.5,hazeH:0.08,
  dust:0.6,dustS:0.8,dustK:1.5,mist:0.5,mistA:0.07,mistS:1.1,mistH:2.4,mistL:0.6,mistK:1.4,flow:1,lo:[0.74,1.03,1.2],hi:[1.10,1.08,0.80]});
// ---------- ปรับค่า (tune.html / F8) ----------
(function(){const G=['paint','🎨 Paint (ลุคภาพวาด)'],S='ลุคภาพวาด',Rg=(k,l,g,s,o)=>tuneNum(G,S,'paint.'+k,l,g,v=>{s(v);paintLights(PAINT.cur||builtMap);},o);
  Rg('kuw','ฟิลเตอร์ภาพวาด • ความแรง (0 = ปิด)',()=>PAINT.kuw,v=>{PAINT.kuw=v;},{min:0,max:1,step:0.05});
  Rg('kuwR','ฟิลเตอร์ภาพวาด • ขนาดปื้นสี',()=>PAINT.kuwR,v=>{PAINT.kuwR=v;},{min:0.5,max:3,step:0.05});
  Rg('stroke','ลายพู่กันบนผิว • ความเข้ม',()=>PAINT.U.uPt.value.z,v=>{PAINT.U.uPt.value.z=v;},{min:0,max:1.5,step:0.05});
  Rg('strokeHue','ลายพู่กันบนผิว • สีอุ่น/เย็น',()=>PAINT.U.uPt.value.w,v=>{PAINT.U.uPt.value.w=v;},{min:0,max:1.5,step:0.05});
  Rg('cel','แสงเงา cel-shade • ความแรง (0 = ไล่เฉดเรียบแบบเดิม)',()=>PAINT.cel,v=>{PAINT.cel=v;},{min:0,max:1,step:0.05});
  Rg('fxcel','ไฟ/จุดแสงแบบ cel-shade (1 = เปิด)',()=>PAINT.fxcel,v=>{PAINT.fxcel=v;},{min:0,max:1,step:1});
  Rg('vivid','VFX สีสด (1 = เปิด)',()=>PAINT.vivid,v=>{PAINT.vivid=v;},{min:0,max:1,step:1});
  Rg('bloom','แสงฟุ้งบนแมพภาพวาด',()=>PAINT.bloom,v=>{PAINT.bloom=v;},{min:0,max:1.2,step:0.01});
  Rg('sat','ความสดของสี',()=>PAINT.sat,v=>{PAINT.sat=v;},{min:0.8,max:1.6,step:0.01});
  Rg('sun','ความแรงแดด',()=>PAINT.sun,v=>{PAINT.sun=v;},{min:0.5,max:5,step:0.05});})();
if(typeof builtMap==='string'&&builtMap)paintLights(builtMap);
window.WD&&Object.assign(window.WD,{PAINT,paintLights,paintKit});
