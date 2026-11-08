// =====================================================================
//  Surface 🧱 — คลังผิววัสดุ (PBR detail) ใช้ร่วมทุกแมพ/ของประกอบฉาก ไม่ต้องมีภาพผิวต่อโมเดล
//  • ภาพผิว 1 แผ่น 512² (4 ช่อง = ความสูงของผิว 4 แบบ: หิน / ดิน-กรวด / ไม้ / หิมะ-ทราย) สร้างจากโค้ด ต่อกันไร้รอยต่อ (ไม่ต้องดาวน์โหลด)
//  • ใส่เข้าวัสดุ MeshStandardMaterial เดิมผ่าน onBeforeCompile → ไม่เพิ่ม draw call / ไม่เปลี่ยนจำนวนวัสดุ (CPU เท่าเดิม)
//  • เลือกผิวจากสีของวัสดุเอง (พาเลตต์): เขียว→ดิน/กรวด • ส้มน้ำตาล→ไม้ • ขาวซีด→หิมะ • อื่น ๆ→หิน (ผสมนุ่ม ๆ ไม่ตัดขาด)
//  • พิกัดผิวไม่พึ่ง UV ของโมเดล: ฉายตามแกนที่ผิวหันไปหา (world-space ในแมพ = นิ่ง • object-space ในของที่ขยับ = ติดไปกับชิ้นนั้น)
//  • ทำ 3 อย่างต่อพิกเซล: ① ผิวนูน (bump จริง หน่วยเมตร) ② ความมัน/ด้านแปรผันตามรอยลึก ③ สีด่าง + เงารอยลึก (AO ปลอม) — ไกลกว่า far จะค่อย ๆ หาย (ไม่เปลืองและไม่กะพริบ)
//  • กราฟิกสูง/อัตโนมัติ(lvl 0-1) เปิด • ประหยัด/อัตโนมัติ(lvl≥2) ปิด (ผ่าน uniform ไม่ต้องคอมไพล์ใหม่) • ปิดเอง: ?nosurf • ปรับค่า: tune.html → 🧱 ผิววัสดุ
//  ข้าม: ตัวละคร/ศัตรู (skinned) • เอฟเฟกต์ • วัสดุโปร่งใส/น้ำ/แก้ว/เรืองแสง • วัสดุที่ตั้ง userData.noSurf
// =====================================================================
var SURF={on:!/[?&]nosurf\b/.test(location.search),ready:false,N:512,q:1,
  amp:[0.045,0.07,0.02,0.05],   // ความสูงสูงสุดของผิว (เมตร) : หิน, ดิน/กรวด, ไม้, หิมะ/ทราย
  micro:2.4,macro:11,near:28,far:75,colVar:0.28,roughVar:0.4,cavity:0.5,bump:1,
  U:{tSurf:{value:null},uSfA:{value:new THREE.Vector4(1,0,28,75)},uSfB:{value:new THREE.Vector4(1/2.4,1/11,0,1)},uSfC:{value:new THREE.Vector4(0.045,0.07,0.02,0.05)},uSfD:{value:new THREE.Vector4(0.28,0.4,0.5,0)}}};
// ----- ภาพผิว (ความสูง 4 แบบ) : noise ที่วนซ้ำได้ (ทุกฟังก์ชันรับ x,y ใน [0,1) และต่อกันเองที่ขอบ) -----
function _sh(x,y,s){let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(s,1442695041);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function _sva(x,y,gx,gy,s){const X=x*gx,Y=y*gy,x0=Math.floor(X),y0=Math.floor(Y),fx=X-x0,fy=Y-y0,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),
  xa=((x0%gx)+gx)%gx,xb=(xa+1)%gx,ya=((y0%gy)+gy)%gy,yb=(ya+1)%gy;
  return (_sh(xa,ya,s)*(1-u)+_sh(xb,ya,s)*u)*(1-v)+(_sh(xa,yb,s)*(1-u)+_sh(xb,yb,s)*u)*v;}
function _sfb(x,y,g,o,s){let t=0,a=0.5,n=0;for(let i=0;i<o;i++){t+=a*_sva(x,y,g,g,s+i*7);n+=a;a*=0.5;g*=2;}return t/n;}
function _sfa(x,y,gx,gy,o,s){let t=0,a=0.5,n=0;for(let i=0;i<o;i++){t+=a*_sva(x,y,gx,gy,s+i*7);n+=a;a*=0.5;gx*=2;gy*=2;}return t/n;}
const _SW=[0,0,0];
function _swor(x,y,g,s){const X=x*g,Y=y*g,cx=Math.floor(X),cy=Math.floor(Y);let f1=9,f2=9,id=0;
  for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const ix=cx+i,iy=cy+j,wx=((ix%g)+g)%g,wy=((iy%g)+g)%g,px=ix+_sh(wx,wy,s),py=iy+_sh(wx,wy,s+91),d=Math.hypot(px-X,py-Y);
    if(d<f1){f2=f1;f1=d;id=_sh(wx,wy,s+17);}else if(d<f2)f2=d;}
  _SW[0]=f1;_SW[1]=f2;_SW[2]=id;}
const _SCL=v=>v<0?0:v>1?1:v;
const SURF_H=[
  (x,y)=>{_swor(x,y,7,11);const crack=Math.min(1,(_SW[1]-_SW[0])*5.5);   // หิน: ก้อนใหญ่ + รอยแยกระหว่างก้อน + แต่ละก้อนสูงไม่เท่ากัน + เม็ดละเอียด
    return _SCL(0.14+0.40*_sfb(x,y,3,5,3)+0.28*crack+0.20*_SW[2]+0.12*_sfb(x,y,48,2,5));},
  (x,y)=>{_swor(x,y,9,23);const pr=_SW[2]>0.35?Math.max(0,1-_SW[0]/(0.26+0.3*_SW[2])):0;   // ดิน/กรวด: ก้อนกรวดกลม ๆ บนพื้นเป็นคลื่น
    return _SCL(0.08+0.5*_sfb(x,y,5,4,29)+0.38*Math.sqrt(pr)+0.14*_sfb(x,y,40,2,31));},
  (x,y)=>{const w=_sfb(x,y,2,3,41),rings=0.5+0.5*Math.sin(6.2831853*(y*9+w*3));   // ไม้: เสี้ยนยาวตามแนวนอน + วงปี + รูพรุน
    return _SCL(0.05+0.32*rings+0.42*_sfa(x,y,2,48,3,43)+0.2*_sva(x,y,96,12,47));},
  (x,y)=>{const w=_sfb(x,y,3,3,53),rip=0.5+0.5*Math.sin(6.2831853*(x*5+y*3+w*2.5));   // หิมะ/ทราย: ลอนนุ่ม + เม็ดละเอียดมาก
    return _SCL(0.04+0.5*w+0.26*rip+0.2*_sfb(x,y,64,2,59));}];
function surfBuild(){
  const N=SURF.N,D=new Uint8Array(N*N*4);let row=0;
  const t=new THREE.DataTexture(D,N,N,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;
  t.anisotropy=typeof gl!=='undefined'&&gl.capabilities?Math.min(8,gl.capabilities.getMaxAnisotropy()):1;t.userData.keep=true;
  const later=f=>window.requestIdleCallback?requestIdleCallback(f,{timeout:120}):setTimeout(f,0);   // ทำตอนเบราว์เซอร์ว่าง ไม่แย่งเฟรมเปิดเกม
  const step=()=>{const t0=performance.now();   // ทีละช่วงสั้น ๆ ไม่ให้หน้าค้าง (~4 ms ต่อรอบ)
    while(row<N&&performance.now()-t0<4){for(let i=0;i<N;i++){const x=i/N,y=row/N,p=(row*N+i)*4;for(let k=0;k<4;k++)D[p+k]=Math.round(SURF_H[k](x,y)*255);}row++;}
    if(row<N){later(step);return;}
    t.needsUpdate=true;SURF.U.tSurf.value=t;SURF.ready=true;};
  const ph=new THREE.DataTexture(new Uint8Array([128,128,128,128]),1,1,THREE.RGBAFormat);ph.needsUpdate=true;ph.userData.keep=true;SURF.U.tSurf.value=ph;   // แผ่นเปล่า (เรียบ) ระหว่างรอสร้าง
  setTimeout(()=>later(step),2500);}
// ----- ส่งค่าเข้า uniform / กราฟิก -----
function surfSync(){const U=SURF.U,a=SURF.amp;
  U.uSfA.value.set(SURF.on&&SURF.q?1:0,0,SURF.near,Math.max(SURF.near+1,SURF.far));
  U.uSfB.value.set(1/Math.max(0.2,SURF.micro),1/Math.max(1,SURF.macro),0,SURF.bump);
  U.uSfC.value.set(a[0],a[1],a[2],a[3]);U.uSfD.value.set(SURF.colVar,SURF.roughVar,SURF.cavity,0);}
function surfQuality(){if(!SURF)return;SURF.q=QUAL.mode==='low'?0:QUAL.mode==='high'?1:(QUAL.lvl>=2?0:1);surfSync();}   // เรียกจาก applyQuality (js/27)
// ----- ใส่ผิวเข้าวัสดุ -----
const SURF_VS='varying vec3 vSfP;varying vec3 vSfN;\n';
const SURF_VS_BODY=`
#ifdef SURF_WORLD
  { vec4 sfl=vec4(transformed,1.0);
  #ifdef USE_INSTANCING
    sfl=instanceMatrix*sfl;
  #endif
  vSfP=(modelMatrix*sfl).xyz;vSfN=normalize(mat3(modelMatrix)*objectNormal); }
#else
  vSfP=transformed*vec3(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz),length(modelMatrix[2].xyz));vSfN=objectNormal;
#endif
`;
const SURF_FS='varying vec3 vSfP;varying vec3 vSfN;uniform sampler2D tSurf;uniform vec4 uSfA;uniform vec4 uSfB;uniform vec4 uSfC;uniform vec4 uSfD;\n';
const SURF_FS_BODY=`
if(uSfA.x>0.5){
  float sfF=1.0-smoothstep(uSfA.z,uSfA.w,length(vViewPosition));
  if(sfF>0.004){
    vec3 sfa=abs(vSfN);
    vec2 sfp=(sfa.y>=sfa.x&&sfa.y>=sfa.z)?vSfP.xz:((sfa.x>=sfa.z)?vSfP.zy:vSfP.xy);
    vec3 sc=diffuseColor.rgb;
    float sL=dot(sc,vec3(0.3,0.59,0.11)),sM=max(sc.r,max(sc.g,sc.b)),sS=(sM-min(sc.r,min(sc.g,sc.b)))/max(sM,0.001);
    float wG=smoothstep(0.0,0.08,sc.g-max(sc.r,sc.b));
    wG+=smoothstep(0.015,0.08,sc.r-sc.b)*smoothstep(0.5,0.85,sfa.y)*(1.0-wG);   // พื้นราบสีน้ำตาล (ทางดิน) = ผิวดิน/กรวด
    float wW=smoothstep(0.02,0.1,sc.r-sc.b)*smoothstep(0.22,0.42,sS)*(1.0-smoothstep(0.35,0.6,sL))*(1.0-smoothstep(0.55,0.85,sfa.y))*(1.0-wG);   // ไม้ = น้ำตาลเข้มสีจัด และไม่ใช่พื้นราบ (ทางดิน/ปูนครีม = ไม่ใช่ลายไม้)
    float wS=smoothstep(0.45,0.75,sL)*(1.0-smoothstep(0.08,0.25,sS))*(1.0-wG)*(1.0-wW);
    vec4 sw=vec4(max(1.0-wG-wW-wS,0.0),wG,wW,wS);
    vec2 suv=sfp*uSfB.x;
    vec4 st0=texture2D(tSurf,suv);
    vec4 sA=uSfC*sw;
    float h0=dot(st0,sA);
    float hx=dot(texture2D(tSurf,suv+dFdx(suv)),sA)-h0;
    float hy=dot(texture2D(tSurf,suv+dFdy(suv)),sA)-h0;
    vec3 sX=dFdx(-vViewPosition),sY=dFdy(-vViewPosition);
    vec3 sR1=cross(sY,normal),sR2=cross(normal,sX);
    float sDet=dot(sX,sR1)*faceDirection;
    vec3 sG=sign(sDet)*(hx*sR1+hy*sR2);
    normal=normalize(abs(sDet)*normal-sG*(sfF*uSfB.w));
    float hr=dot(st0,sw),hm=dot(texture2D(tSurf,(sfp+vec2(37.0,19.0))*uSfB.y),sw);
    roughnessFactor=clamp(roughnessFactor+(hr-0.5)*uSfD.y*sfF,0.05,1.0);
    diffuseColor.rgb*=(1.0+(hm-0.5)*uSfD.x*sfF)*(1.0-uSfD.z*smoothstep(0.55,0.15,hr)*sfF);
  }
}
`;
function surfOk(m){return m&&m.isMeshStandardMaterial&&!m.userData.surf&&!m.userData.noSurf&&!m.transparent&&!m.alphaTest&&!m.wireframe&&!/water|glass|sky|glow|emit|ice|fire/i.test(m.name||'');}
function surfApply(m,world){
  if(!SURF.on||!surfOk(m))return m;
  m.userData.surf=world?2:1;
  const prior=m.onBeforeCompile,def=THREE.Material.prototype.onBeforeCompile,pk=m.customProgramCacheKey,pkDef=THREE.Material.prototype.customProgramCacheKey;
  m.onBeforeCompile=function(sh,r){
    if(prior&&prior!==def)prior.call(this,sh,r);
    Object.assign(sh.uniforms,SURF.U);
    const D=world?'#define SURF_WORLD 1\n':'';
    sh.vertexShader=D+SURF_VS+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n'+SURF_VS_BODY);
    sh.fragmentShader=SURF_FS+sh.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n'+SURF_FS_BODY);};
  m.customProgramCacheKey=function(){return (pk&&pk!==pkDef?pk.call(this):(prior&&prior!==def?prior.toString():''))+'|surf1'+(world?'w':'l');};
  m.needsUpdate=true;return m;}
function surfScene(root,world){root.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh)return;if(Array.isArray(o.material))o.material.forEach(m=>surfApply(m,world));else surfApply(o.material,world);});}
// ----- ปรับค่า (tune.html / F8) -----
(function(){const G=['surf','🧱 ผิววัสดุ (PBR)'],S='ผิววัสดุ',R=(k,l,g,s,o)=>tuneNum(G,S,'surf.'+k,l,g,v=>{s(v);surfSync();},o);
  R('on','ผิววัสดุ (1 = เปิด • ทำงานเฉพาะกราฟิกสูง/อัตโนมัติ ระดับต้น)',()=>SURF.on?1:0,v=>{SURF.on=!!v;},{bool:true,min:0,max:1,step:1});
  R('bump','ความนูนรวม ×',()=>SURF.bump,v=>{SURF.bump=v;},{min:0,max:4,step:0.05});
  ['หิน','ดิน/กรวด','ไม้','หิมะ/ทราย'].forEach((n,i)=>R('amp'+i,'ความสูงผิว'+n+' (เมตร)',()=>SURF.amp[i],v=>{SURF.amp[i]=v;},{min:0,max:0.3,step:0.005}));
  R('micro','ขนาดลายละเอียด 1 แผ่น (เมตร)',()=>SURF.micro,v=>{SURF.micro=v;},{min:0.5,max:8,step:0.1});
  R('macro','ขนาดลายใหญ่ (ด่างสี) 1 แผ่น (เมตร)',()=>SURF.macro,v=>{SURF.macro=v;},{min:3,max:60,step:0.5});
  R('colVar','สีด่าง (ใหญ่)',()=>SURF.colVar,v=>{SURF.colVar=v;},{min:0,max:1,step:0.01});
  R('roughVar','ความมันแปรผันตามรอยลึก',()=>SURF.roughVar,v=>{SURF.roughVar=v;},{min:0,max:1.5,step:0.01});
  R('cavity','เงารอยลึก (AO ปลอม)',()=>SURF.cavity,v=>{SURF.cavity=v;},{min:0,max:1,step:0.01});
  R('near','เริ่มจางที่ระยะ (เมตร)',()=>SURF.near,v=>{SURF.near=v;},{min:5,max:150,step:1});
  R('far','หายหมดที่ระยะ (เมตร)',()=>SURF.far,v=>{SURF.far=v;},{min:10,max:250,step:1});})();
surfBuild();surfQuality();
window.WD&&Object.assign(window.WD,{SURF,surfSync,surfScene});
