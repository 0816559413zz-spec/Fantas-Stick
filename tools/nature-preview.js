// ตัวอย่างภาพสาย Nature (ยังไม่อยู่ในเกม) — โมเดล/ท่า/เอฟเฟกต์ทำด้วยโค้ดล้วน แล้วเรนเดอร์ในเอนจินจริงเพื่อให้ผู้ใช้รีวิว
// ใช้: node tools/headless.js --url "index.html?nosw&sk=whip" --js tools/nature-preview.js --timeout 400 --quiet
//   sk = whip | dash | shield | turret | lotus | move | ball | root | ult      &still=1 = ถ่ายภาพนิ่งภาพเดียว (ไม่ทำเฟรม GIF)
// ผลลัพธ์: shots/nat_<sk>_f000.jpg … (เฟรม GIF 20 fps) + shots/nat_<sk>_still.jpg
// สเปก: designs/nature.md — ตัวเลขเวลา/ระยะใช้ตามสเปก ส่วนหน้าตาทั้งหมดเป็นร่างให้ผู้ใช้เลือก
const T=WD.THREE,S=WD.scene,Q=new URLSearchParams(location.search),SK=Q.get('sk')||'whip',ONLY_STILL=Q.has('still');
await HL.solo({kit:'0'});
const ME=HL.o(),O=ME.g.position.clone();
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
// พิกัดเวที: หุ่นของเราอยู่ที่ O หันไป +z • W(หน้า,ขวา,สูง)
const W=(f,r,u)=>V(O.x-r,O.y+u,O.z+f);
const ease=t=>t<0?0:t>1?1:t*t*(3-2*t),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,k)=>a+(b-a)*k;
const outQ=t=>{t=clamp(t,0,1);return 1-(1-t)*(1-t);},inQ=t=>{t=clamp(t,0,1);return t*t;};
const phase=(t,a,b)=>clamp((t-a)/(b-a),0,1);
let seed=7;const rnd=(a=0,b=1)=>{seed=(seed*16807)%2147483647;return a+(b-a)*(seed/2147483647);};
// ---------- วัสดุ ----------
const STD=(c,o={})=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.8,metalness:0},o));
const ADD=(c,o={})=>new T.MeshBasicMaterial(Object.assign({color:c,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide},o));
const M={bark:STD('#ffffff',{vertexColors:true,roughness:.85}),
 leaf:STD('#5fb83a',{side:T.DoubleSide,roughness:.6,emissive:'#1d4a10',emissiveIntensity:.35}),
 leafD:STD('#2f6e25',{side:T.DoubleSide,roughness:.7}),
 thorn:STD('#3d5a1c',{roughness:.5,emissive:'#14260a',emissiveIntensity:.4}),
 thornTip:STD('#d8e86a',{roughness:.4,emissive:'#8a9a20',emissiveIntensity:.5}),
 pod:STD('#8bd04e',{roughness:.45,emissive:'#2c5a10',emissiveIntensity:.45}),
 podDark:STD('#3f7a2a',{roughness:.55}),
 petal:STD('#ff8cc6',{side:T.DoubleSide,roughness:.45,emissive:'#7a2050',emissiveIntensity:.35}),
 petalIn:STD('#ffc0de',{side:T.DoubleSide,roughness:.4,emissive:'#80405a',emissiveIntensity:.35}),
 core:STD('#ffd23f',{roughness:.3,emissive:'#ffb000',emissiveIntensity:1.1}),
 stem:STD('#4f9a35',{roughness:.6,emissive:'#173d0c',emissiveIntensity:.3}),
 wood:STD('#7a5230',{roughness:.9}),
 dirt:STD('#5b4127',{roughness:1}),
 stone:STD('#7d7a72',{roughness:.95}),
 seed:STD('#8a5a2b',{roughness:.6,emissive:'#3a2000',emissiveIntensity:.3})};
for(const k in M)M[k].userData.keep=true;
// ---------- ตัวช่วยวางของ ----------
const ALL=[];const add=(o,p)=>{(p||S).add(o);if(!p)ALL.push(o);return o;};
const mesh=(geo,mat,p)=>{const m=new T.Mesh(geo,mat);m.castShadow=true;m.frustumCulled=false;return add(m,p);};
function glowTex(c0,c1){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,c0);g.addColorStop(.35,c1);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);const t=new T.CanvasTexture(c);return t;}
const GLOWT=glowTex('rgba(255,250,200,1)','rgba(255,210,80,.5)'),GLOWG=glowTex('rgba(220,255,190,1)','rgba(90,220,70,.45)'),GLOWP=glowTex('rgba(255,230,245,1)','rgba(255,120,190,.45)'),GLOWV=glowTex('rgba(230,255,200,1)','rgba(150,60,200,.45)');
function glow(tex,size,p){const s=new T.Sprite(new T.SpriteMaterial({map:tex,blending:T.AdditiveBlending,depthWrite:false,transparent:true}));s.scale.setScalar(size);return add(s,p);}
function ring(r0,r1,col,op=.6,p){const m=new T.Mesh(new T.RingGeometry(r0,r1,64),ADD(col,{opacity:op}));m.rotation.x=-Math.PI/2;return add(m,p);}
function disc(r,col,op=.35,p){const m=new T.Mesh(new T.CircleGeometry(r,64),new T.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false}));m.rotation.x=-Math.PI/2;return add(m,p);}
// ---------- หลอด (แส้/เถาวัลย์/ราก/ลำต้น) ----------
function Tube(n,sides,mat,p){
  const g=new T.BufferGeometry(),V=n*(sides+1),pos=new Float32Array(V*3),col=new Float32Array(V*3),idx=[];
  for(let i=0;i<n-1;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;idx.push(a,b,a+1,a+1,b,b+1);}
  g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('color',new T.BufferAttribute(col,3));g.setIndex(idx);
  const m=mesh(g,mat,p);m.receiveShadow=true;
  const tg=V3(),nr=V3(),bn=V3(),up=V3(0,1,0),ax=V3(1,0,0),c=new T.Color();
  m.set=(pts,rad,colFn)=>{const k=pts.length;
    for(let i=0;i<n;i++){const ii=Math.min(i,k-1),P=pts[ii];
      tg.copy(pts[Math.min(ii+1,k-1)]).sub(pts[Math.max(ii-1,0)]);if(tg.lengthSq()<1e-9)tg.set(0,0,1);tg.normalize();
      nr.crossVectors(tg,Math.abs(tg.y)>.92?ax:up).normalize();bn.crossVectors(nr,tg).normalize();
      const r=i<k?rad(ii/(k-1||1),ii):0;colFn(ii/(k-1||1),c);
      for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,o=(i*(sides+1)+j)*3,cs=Math.cos(a)*r,sn=Math.sin(a)*r;
        pos[o]=P.x+nr.x*cs+bn.x*sn;pos[o+1]=P.y+nr.y*cs+bn.y*sn;pos[o+2]=P.z+nr.z*cs+bn.z*sn;col[o]=c.r;col[o+1]=c.g;col[o+2]=c.b;}}
    g.attributes.position.needsUpdate=true;g.attributes.color.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();};
  return m;}
function V3(x=0,y=0,z=0){return new T.Vector3(x,y,z);}
// หนามตามหลอด (InstancedMesh)
function Thorns(max,size=1,p){const geo=new T.ConeGeometry(.032*size,.17*size,5);geo.translate(0,.085*size,0);
  const im=new T.InstancedMesh(geo,M.thorn,max);im.frustumCulled=false;im.castShadow=true;add(im,p);const D=new T.Object3D(),up=V3(0,1,0);
  im.put=(list)=>{let i=0;for(const q of list){if(i>=max)break;D.position.copy(q.p);D.quaternion.setFromUnitVectors(up,q.d);D.scale.setScalar(q.s===undefined?1:q.s);D.updateMatrix();im.setMatrixAt(i++,D.matrix);}im.count=i;im.instanceMatrix.needsUpdate=true;};
  im.count=0;return im;}
function thornsAlong(pts,rad,every,s=1,twist=2.4){const out=[],tg=V3(),nr=V3(),bn=V3(),up=V3(0,1,0),ax=V3(1,0,0);
  for(let i=1;i<pts.length-1;i+=every){tg.copy(pts[i+1]).sub(pts[i-1]).normalize();nr.crossVectors(tg,Math.abs(tg.y)>.92?ax:up).normalize();bn.crossVectors(nr,tg);
    for(const off of [0,Math.PI]){const a=i*twist+off,d=nr.clone().multiplyScalar(Math.cos(a)).addScaledVector(bn,Math.sin(a)).addScaledVector(tg,.35).normalize();
      out.push({p:pts[i].clone().addScaledVector(d,rad(i/(pts.length-1))*.8),d,s:s*(1-.5*i/pts.length)});}}return out;}
// ---------- อนุภาค ----------
function Pool(geo,mat,max){const im=new T.InstancedMesh(geo,mat,max);im.frustumCulled=false;add(im);const P=[],D=new T.Object3D(),C=new T.Color(),C2=new T.Color();
  im.setColorAt(0,C.set('#fff'));im.count=0;
  return {P,add(o){if(P.length<max)P.push(Object.assign({age:0,life:1,size:.1,spin:0,rot:rnd(0,6),g:0,drag:0,grow:0,fade:1},o));},
    upd(dt){for(let i=P.length-1;i>=0;i--){const p=P[i];p.age+=dt;if(p.age>=p.life){P.splice(i,1);continue;}if(p.v){p.v.y-=p.g*dt;p.v.multiplyScalar(Math.max(0,1-p.drag*dt));p.p.addScaledVector(p.v,dt);}if(p.floor!==undefined&&p.p.y<p.floor){p.p.y=p.floor;if(p.v)p.v.multiplyScalar(.4);}p.rot+=p.spin*dt;}
      P.forEach((p,i)=>{const k=p.age/p.life,f=p.fade?1-Math.pow(k,1.6):1,s=p.size*(1+p.grow*k)*(p.fin?Math.min(1,p.age/p.fin):1)*(p.shrink?f:1);
        D.position.copy(p.p);D.rotation.set(p.rot,p.rot*.6+(p.ry||0),p.rot*1.3);if(p.sx)D.scale.set(s*p.sx,s,s);else D.scale.setScalar(Math.max(1e-4,s));D.updateMatrix();im.setMatrixAt(i,D.matrix);
        C.set(p.col||'#ffffff');if(p.c2)C.lerp(C2.set(p.c2),k);if(p.add)C.multiplyScalar(f);im.setColorAt(i,C);});
      im.count=P.length;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;}};}
const leafGeo=new T.BufferGeometry();leafGeo.setAttribute('position',new T.Float32BufferAttribute([-.5,0,0,0,.2,0,.5,0,0,0,-.2,0,0,.03,.0],3));leafGeo.setIndex([0,1,4,4,1,2,0,4,3,4,2,3]);leafGeo.computeVertexNormals();
const LEAF=Pool(leafGeo,STD('#ffffff',{side:T.DoubleSide,roughness:.6,emissive:'#103008',emissiveIntensity:.3}),700);
const SPK=Pool(new T.OctahedronGeometry(.5,0),ADD('#ffffff'),900);
const DIRT=Pool(new T.DodecahedronGeometry(.5,0),STD('#ffffff',{roughness:1}),500);
const PUFF=Pool(new T.IcosahedronGeometry(.5,1),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.42,depthWrite:false}),400);
const CHIP=Pool(new T.BoxGeometry(.5,.18,.12),STD('#ffffff',{roughness:.9}),300);
const POOLS=[LEAF,SPK,DIRT,PUFF,CHIP];
const leafCols=['#6cc23e','#9be05a','#3f8f2c','#c8e86a'];
function leaves(p,n,sp=3,o={}){for(let i=0;i<n;i++){const v=V3(rnd(-1,1),rnd(.2,1.2),rnd(-1,1)).normalize().multiplyScalar(sp*rnd(.4,1));if(o.dir)v.add(o.dir);LEAF.add({p:p.clone(),v,life:rnd(.7,1.4)*(o.life||1),size:rnd(.18,.32)*(o.size||1),spin:rnd(-8,8),g:2.2,drag:1.6,col:o.col||leafCols[i%4],shrink:1});}}
function sparks(p,n,sp=4,col='#fff3a0',c2='#7ee05a',o={}){for(let i=0;i<n;i++){const v=V3(rnd(-1,1),rnd(-.2,1),rnd(-1,1)).normalize().multiplyScalar(sp*rnd(.4,1));if(o.dir)v.add(o.dir);SPK.add({p:p.clone(),v,life:rnd(.25,.55)*(o.life||1),size:rnd(.05,.11)*(o.size||1),g:o.g||1,drag:2,col,c2,add:1,sx:2.2});}}
function dirt(p,n,sp=3,o={}){for(let i=0;i<n;i++){const v=V3(rnd(-1,1),rnd(.5,1.6),rnd(-1,1)).normalize().multiplyScalar(sp*rnd(.5,1));if(o.dir)v.add(o.dir);DIRT.add({p:p.clone().add(V3(rnd(-.3,.3)*(o.spread||1),0,rnd(-.3,.3)*(o.spread||1))),v,life:rnd(.6,1.1),size:rnd(.08,.2)*(o.size||1),spin:rnd(-6,6),g:9,drag:.5,col:i%3?'#5b4127':'#7a5a38',floor:O.y+.04,shrink:1});}}
function puff(p,n,col='#cdbb9a',o={}){for(let i=0;i<n;i++){const v=V3(rnd(-1,1),rnd(.1,.6),rnd(-1,1)).normalize().multiplyScalar((o.sp||1.2)*rnd(.4,1));PUFF.add({p:p.clone().add(V3(rnd(-.3,.3),rnd(0,.3),rnd(-.3,.3)).multiplyScalar(o.spread||1)),v,life:rnd(.6,1.2)*(o.life||1),size:rnd(.35,.6)*(o.size||1),grow:1.6,drag:1.8,g:-.3,col,c2:o.c2,shrink:1});}}
function chips(p,n,sp=4){for(let i=0;i<n;i++){const v=V3(rnd(-1,1),rnd(.2,1.3),rnd(-1,1)).normalize().multiplyScalar(sp*rnd(.5,1));CHIP.add({p:p.clone(),v,life:rnd(.6,1.1),size:rnd(.18,.34),spin:rnd(-10,10),g:9,drag:.4,col:i%2?'#7a5230':'#a07040',floor:O.y+.04,shrink:1});}}
// ---------- หุ่นตัวละคร ----------
const PUP=[];
function pup(look,f,r,yaw,team){const o=WD.mkStudent(WD.parseLook(look),'nat'+PUP.length);add(o.g);o.g.position.copy(W(f,r,0));o.g.rotation.y=yaw||0;
  for(const k of ['shield','ring','stars','broom','cocoon'])if(o[k])o[k].visible=false;
  o.armR.rotation.order=o.armL.rotation.order='YXZ';
  if(team){const rr=ring(.5,.62,team==='enemy'?'#ff4a3a':'#4aa8ff',.75);rr.position.set(0,.04,0);o.g.add(rr);ALL.splice(ALL.indexOf(rr),1);o.teamRing=rr;}
  o.base=o.g.position.clone();PUP.push(o);return o;}
function idle(o,t,k=1){o.b.rotation.set(0,0,0);o.b.position.set(0,Math.sin(t*2.2)*.012*k,0);o.legs[0].rotation.set(0,0,0);o.legs[1].rotation.set(0,0,0);
  o.armR.rotation.set(-.18+Math.sin(t*1.7)*.03,0,.12);o.armL.rotation.set(-.12,0,-.12);}
const tipW=(o)=>{o.g.updateMatrixWorld(true);return o.tip.getWorldPosition(V3());};
const chestW=(o)=>o.g.localToWorld(V3(0,1.25,.15));
function face(o,p){o.g.rotation.y=Math.atan2(p.x-o.g.position.x,p.z-o.g.position.z);}
function hitFlinch(o,k){o.b.rotation.x=-.25*k;o.b.position.z=-.08*k;}
// ---------- แส้หนาม (BA) ----------
// โคนถูกมือพา → ลำตัวตามมุมที่หน่วงตามระยะ → ปลายหน่วงที่สุดแล้วสะบัดเกินแล้วดีดกลับ (ไม่ใช้ฟิสิกส์ — เดินเวลาแน่นอนทุกเฟรม)
const WHIP_N=26,WHIP_L=6,WHIP_LAG=.16;
function Whip(length=WHIP_L,curled=false){const tube=Tube(WHIP_N,7,M.bark),th=Thorns(60,1),trail=TrailRibbon(18,'#b8f060');
  return {tube,th,trail,upd(o,t,sw){ // sw = {t0, dir(+1 ซ้าย→ขวา), aimYaw}
      const st=t-sw.t0,show=st>0&&st<(curled?.78:.82);tube.visible=th.visible=show;if(!show){trail.push(null);return null;}
      const grow=curled?(.34+.66*ease((st-.08)/.19))*(1-ease((st-.62)/.16)):outQ(st/.12)*(1-inQ((st-.66)/.16)),s=sw.dir;
      const curl=curled?1-ease((st-.06)/.23):0;
      // มุมโคน (เทียบทิศที่หัน): ง้าง→กวาด→เลยไปนิด
      const ang=(x)=>{if(curled){const reverse=s<0,q=clamp((x-.04)/(reverse?.27:.25),0,1);return s*lerp(reverse?1.49:1.55,reverse?-1.73:-1.78,q*q*q*(q*(q*6-15)+10));}const a=1.45*s,b=-1.45*s;if(x<.1)return lerp(a*.85,a,x/.1);const k=(x-.1)/.36;if(k<1)return lerp(a,b,ease(k));const z=x-.46;return b+(-.22*s)*Math.sin(z*14)*Math.exp(-z*6);};
      const armYaw=ang(st);o.armR.rotation.set(-1.25+.25*Math.sin(Math.min(1,st/.46)*Math.PI),armYaw*.55,.0);o.b.rotation.y=armYaw*.28;
      const P0=tipW(o),yaw=o.g.rotation.y,pts=[P0.clone()],seg=length*grow/(WHIP_N-1);let p=P0.clone();
      for(let i=1;i<WHIP_N;i++){const u=i/(WHIP_N-1),delay=(curled?(s<0?.18:.17):WHIP_LAG)*u;
        // ขณะมือเบรก ปลายยังมีแรงส่ง จึงสะบัดเลยโคนก่อนค่อยคลายกลับ (ภาพประมาณแรงเหวี่ยง ไม่ใช่ตัวจำลองฟิสิกส์)
        const follow=curled?Math.sin(Math.PI*phase(st,.22,.68))*u*u:0;
        // ช่วงจบปลายยังพับเป็น U อยู่ ไม่ปล่อยคลื่นผ่านปลายจนแส้กลับไปตรง
        const front=lerp(.22,.50,ease((st-.17)/.31));
        const loop=curled?ease((st-.13)/.11)*ease((u-front)/.32):0;
        const a=yaw+ang(Math.max(0,st-delay))*1.08+curl*s*(s<0?3.8:4.0)*u*u-s*(.35*follow+2.4*loop),pitch=-.06-.22*u*u+.06*Math.sin(u*9-st*20)*(1-u)+(curled?curl*.35*Math.sin(u*Math.PI)*Math.sin(u*5.5+st*3):0),cp=Math.cos(pitch);
        p=p.clone().add(V3(Math.sin(a)*cp,Math.sin(pitch),Math.cos(a)*cp).multiplyScalar(seg));if(p.y<O.y+.12)p.y=O.y+.12;pts.push(p);}
      const rad=(u)=>(.085*(1-u)+.018)*(.6+.4*grow);
      tube.set(pts,rad,(u,c)=>c.set('#4a3218').lerp(new T.Color('#5c9a2e'),Math.min(1,u*1.4)).lerp(new T.Color('#b6e45a'),Math.max(0,u-.7)*1.8));
      th.put(thornsAlong(pts,rad,2,grow*1.35));
      const sweeping=!curled&&st>.1&&st<.6;trail.push(sweeping?[pts[Math.floor(WHIP_N*.72)],pts[WHIP_N-1]]:null);
      return {pts,tip:pts[WHIP_N-1],st};}};}
// ริบบิ้นทางเหวี่ยง (บวกแสง จางตามอายุ)
function TrailRibbon(n,col){const g=new T.BufferGeometry(),pos=new Float32Array(n*2*3),cl=new Float32Array(n*2*3),idx=[];
  for(let i=0;i<n-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('color',new T.BufferAttribute(cl,3));g.setIndex(idx);
  const m=mesh(g,new T.MeshBasicMaterial({vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));m.castShadow=false;
  const H=[],C=new T.Color(col);
  m.push=(pair)=>{H.unshift(pair&&[pair[0].clone(),pair[1].clone()]);if(H.length>n)H.pop();
    for(let i=0;i<n;i++){const h=H[i]||H.find(Boolean);const k=H[i]?(1-i/n)*.75:0;
      for(let s=0;s<2;s++){const o=(i*2+s)*3,q=h?h[s]:V3();pos[o]=q.x;pos[o+1]=q.y;pos[o+2]=q.z;cl[o]=C.r*k*(s?1:.25);cl[o+1]=C.g*k*(s?1:.25);cl[o+2]=C.b*k*(s?1:.25);}}
    g.attributes.position.needsUpdate=true;g.attributes.color.needsUpdate=true;g.computeBoundingSphere();};
  return m;}
// ---------- เมล็ดที่โยน ----------
function Seed(){const g=new T.Group();add(g);mesh(new T.SphereGeometry(.13,12,10),M.seed,g).scale.set(1,1.3,1);
  const sp=mesh(new T.ConeGeometry(.05,.2,5),M.leaf,g);sp.position.y=.2;glow(GLOWG,.6,g);g.visible=false;
  const tr=TrailRibbon(12,'#e8ff9a');
  return {g,fly(a,b,t,h=2.2){const k=clamp(t,0,1);g.visible=t>0&&t<1;if(!g.visible){tr.push(null);return;}g.position.lerpVectors(a,b,k);g.position.y+=Math.sin(k*Math.PI)*h;g.rotation.set(t*14,t*9,0);
    const s=g.position.clone();tr.push([s.clone().add(V3(0,.05,0)),s.clone().add(V3(0,-.05,0))]);}};}
function sprout(p,n=1){dirt(p,14*n,3.2);leaves(p,10*n,3);sparks(p.clone().add(V3(0,.3,0)),16*n,3.5,'#fff7b0','#8ee05a');}
// ---------- พืชป้อมยิง (ต้นกล้าฝักยิงหนาม) ----------
function Turret(wall=false){const g=new T.Group();add(g);const base=new T.Group();g.add(base);
  // รากเกาะพื้นผิวโดยตรง ทั้งพื้นและผนัง ไม่สร้างก้อนดิน
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2,r=new T.Vector3(Math.cos(a),0,Math.sin(a));
    const c=new T.CatmullRomCurve3([V3(0,.06,0),r.clone().multiplyScalar(.18).add(V3(0,.04,0)),r.clone().multiplyScalar(.43).add(V3(0,.015,0))]);mesh(new T.TubeGeometry(c,8,.025,5,false),M.stem,base);}
  // ใบโคนทรงยาวปลายเรียว โค้งขึ้นเล็กน้อยและมีเส้นกลางใบ แทนแผ่นเหลี่ยมรูปดาว
  const lp=[],li=[];for(let i=0;i<=16;i++){const u=i/16,w=.20*Math.sin(Math.PI*u)**.9,y=.025+.11*Math.sin(Math.PI*u),z=.72*u;lp.push(-w,y,z,0,y+.035*Math.sin(Math.PI*u),z,w,y,z);if(i<16){const a=i*3,b=a+3;li.push(a,b,a+1,a+1,b,b+1,a+1,b+1,a+2,a+2,b+1,b+2);}}
  const leafBaseGeo=new T.BufferGeometry();leafBaseGeo.setAttribute('position',new T.Float32BufferAttribute(lp,3));leafBaseGeo.setIndex(li);leafBaseGeo.computeVertexNormals();
  for(let i=0;i<5;i++){const group=new T.Group();group.rotation.y=i/5*Math.PI*2;group.scale.setScalar(i%2?.82:1);base.add(group);mesh(leafBaseGeo,i%2?M.leafD:M.leaf,group);
    const mid=new T.CatmullRomCurve3([V3(0,.03,0),V3(0,.16,.34),V3(0,.04,.69)]);mesh(new T.TubeGeometry(mid,8,.008,5),M.stem,group);}
  const wallRoots=new T.Group();g.add(wallRoots);wallRoots.visible=wall;base.visible=!wall;
  const wallLeaves=base.clone();wallLeaves.visible=wall;wallLeaves.rotation.z=-Math.PI/2;wallLeaves.position.x=.025;g.add(wallLeaves);
  if(wall)for(let i=0;i<7;i++){const a=i/7*Math.PI*2,dy=Math.sin(a),dz=Math.cos(a),c=new T.CatmullRomCurve3([V3(.018,0,0),V3(.018,dy*.22,dz*.22),V3(.018,dy*.48,dz*.48)]);mesh(new T.TubeGeometry(c,8,.025,5,false),M.stem,wallRoots);}
  const stemC=new T.CatmullRomCurve3([V3(0,0,0),V3(0,.35,-.05),V3(0,.7,.02),V3(0,.95,0)]);
  const body=new T.Group();g.add(body);body.rotation.z=wall?-.45:0;   // ผู้ใช้ 2026-11-04: เฉียงหัวออกจากกำแพงมากขึ้น (เดิม -.23)
  const stem=mesh(new T.TubeGeometry(stemC,16,.085,9),M.stem,body);stem.position.x=wall?.12:0;
  // ใบลำต้น: โคนใบติดผิวลำต้นพอดี (pivot ที่ผิว แล้วเลื่อนใบออกครึ่งความยาว) — ผู้ใช้ 2026-11-04: เดิมใบลอยข้างลำต้นเหมือนก้านที่สอง
  for(let i=0;i<2;i++){const s=i?1:-1,y=.30+i*.27,c=stemC.getPoint(y/.95),pv=new T.Group();pv.position.set(c.x+s*.07,c.y,c.z);pv.rotation.z=s*.55;stem.add(pv);
    const l=mesh(leafGeo,i?M.leaf:M.leafD,pv);l.scale.set(.5,.7,.6);l.position.x=s*.25;}
  // เถาพัน 2 เส้นแนบลำต้นตามเส้นโค้ง stemC (ผู้ใช้ 2026-11-04: เดิมเป็นเกลียวตรง ลอยออกจากลำต้น)
  for(let j=0;j<2;j++){const points=[];for(let i=0;i<=24;i++){const u=i/24,a=u*Math.PI*2+j*Math.PI;const c=stemC.getPoint(u*.93);points.push(V3(c.x+Math.cos(a)*.092,c.y,c.z+Math.sin(a)*.092));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.012,5),M.leafD,stem);}
  const head=new T.Group();head.position.set(wall?.12:0,.95,0);body.add(head);
  // ฝักทรงหยดน้ำ (lathe) หัวชี้ไปข้างหน้า (+z)
  const prof=[];for(let i=0;i<=14;i++){const u=i/14;prof.push(new T.Vector2(Math.sin(Math.PI*Math.pow(u,.8))*.26*(1-.55*u)+.0001,u*.72-.25));}
  const podG=new T.LatheGeometry(prof,16);podG.rotateX(Math.PI/2);const pod=mesh(podG,M.pod,head);
  for(let i=0;i<4;i++){const s=mesh(new T.TorusGeometry(.2-.03*i,.012,5,18),M.podDark,head);s.position.z=-.12+i*.12;s.scale.setScalar(1-i*.12);}
  const noz=mesh(new T.CylinderGeometry(.07,.1,.14,10,1,true),M.podDark,head);noz.rotation.x=Math.PI/2;noz.position.z=.5;
  const tipG=glow(GLOWG,.45,head);tipG.position.z=.56;
  // ปีกใบ: กางสองข้างหัวแบบเดิม แต่โคนติดผิวข้างฝักพอดี ไม่ทับหัว (ผู้ใช้ 2026-11-04)
  const wings=[];for(const s of [-1,1]){const w=new T.Group();w.rotation.order='YXZ';w.position.set(s*.19,.04,-.05);head.add(w);const l=mesh(leafGeo,M.leaf,w);l.scale.set(.9,1.1,.9);l.position.x=s*.43;wings.push({w,s});}
  g.scale.setScalar(1.45);
  return {g,head,pod,tipG,wings,stem,grow(k){const rise=ease(phase(k,0,.8)),open=ease(phase(k,.25,1)),root=ease(phase(k,0,.5));g.visible=k>0;stem.scale.y=Math.max(.001,rise);head.position.y=.95*rise;head.scale.setScalar(Math.max(.001,open*1.3));base.scale.setScalar(Math.max(.001,root));wallRoots.scale.setScalar(Math.max(.001,root));wallLeaves.scale.setScalar(Math.max(.001,root));},
    pose(t,aimYaw,recoil,wall){head.rotation.set(-.1+Math.sin(t*2)*.04,aimYaw,0);pod.scale.set(1+recoil*.25,1+recoil*.25,1-recoil*.3);head.position.z=-recoil*.08;
      wings.forEach(({w,s},i)=>{w.rotation.set(.2+Math.sin(t*6+i)*.12,s*.5,s*(.5+Math.sin(t*5+i*2)*.15));});tipG.scale.setScalar(.45+recoil*.6);}};}
// กระสุนหนามของป้อม
function Spikes(){const L=[],geo=new T.ConeGeometry(.045,.42,6);geo.rotateX(Math.PI/2);
  return {shoot(a,b,col){const m=mesh(geo,M.thornTip);const tr=TrailRibbon(8,col||'#a8ff60');L.push({m,tr,a:a.clone(),b:b.clone(),t:0});},
    upd(dt){for(let i=L.length-1;i>=0;i--){const s=L[i];s.t+=dt/.28;const k=Math.min(1,s.t);s.m.position.lerpVectors(s.a,s.b,k);s.m.lookAt(s.b);const p=s.m.position;s.tr.push(s.t<1?[p.clone().add(V3(0,.04,0)),p.clone().add(V3(0,-.04,0))]:null);
      if(s.t>=1&&!s.done){s.done=1;s.m.visible=false;sparks(s.b,14,3,'#f4ffb0','#6ed04a');leaves(s.b,4,2);}
      if(s.t>1.6){S.remove(s.m);S.remove(s.tr);L.splice(i,1);}}}};}
// ---------- ดอกบัว ----------
function Lotus(scale=1){const g=new T.Group();add(g);
  const pads=[];for(let i=0;i<4;i++){const p=mesh(new T.CircleGeometry(.55,24,.3,Math.PI*2-.6),M.leafD,g);p.rotation.x=-Math.PI/2;p.rotation.z=i*1.6;p.position.set(Math.sin(i*1.6)*.6,.05,Math.cos(i*1.6)*.6);pads.push(p);}
  const stemC=new T.CatmullRomCurve3([V3(0,0,0),V3(.08,.8,0),V3(-.05,1.6,.03),V3(0,2.3,0)]);
  const stem=mesh(new T.TubeGeometry(stemC,16,.11,8),M.stem,g);
  const bloom=new T.Group();bloom.position.y=2.3;g.add(bloom);
  const cup=mesh(new T.SphereGeometry(.32,16,10,0,Math.PI*2,Math.PI/2,Math.PI/2),M.stem,bloom);cup.scale.y=.5;
  const petG=new T.SphereGeometry(.5,12,10);petG.translate(0,.5,0);petG.scale(.42,1,.13);
  const petals=[];for(let r=0;r<3;r++){const n=[10,8,6][r];for(let i=0;i<n;i++){const piv=new T.Group();piv.rotation.order='YXZ';piv.rotation.y=i/n*Math.PI*2+r*.3;bloom.add(piv);
    const m=mesh(petG,r===2?M.petalIn:M.petal,piv);m.scale.setScalar([1,.85,.68][r]);petals.push({piv,r,open:[1.25,.85,.45][r]});}}
  const core=mesh(new T.CylinderGeometry(.2,.16,.14,16),M.core,bloom);core.position.y=.12;
  const cg=glow(GLOWT,1.6,bloom);cg.position.y=.25;
  g.scale.setScalar(.001);
  return {g,bloom,petals,core,cg,stem,set(grow,open,t){g.scale.setScalar(Math.max(.001,scale*grow));
      petals.forEach(({piv,r,open:o},i)=>{piv.rotation.x=lerp(.12,o,open)+Math.sin(t*1.4+i)*.03*open;});cg.scale.setScalar((.8+Math.sin(t*3)*.15)*open*1.8+.01);}};}
// สปอร์ (ลูกเกสรเรืองแสง)
function Spore(big){const g=new T.Group();add(g);mesh(new T.IcosahedronGeometry(big?.15:.11,1),M.core,g);glow(GLOWG,big?.9:.6,g);
  for(let i=0;i<5;i++){const s=mesh(new T.ConeGeometry(.025,.12,4),M.leaf,g);const a=i/5*6.28;s.position.set(Math.cos(a)*.12,0,Math.sin(a)*.12);s.lookAt(V3(Math.cos(a)*1,0,Math.sin(a)));s.rotateX(Math.PI/2);}
  g.visible=false;return g;}
function poisonBurst(p,big){puff(p,big?26:14,'#7ed957',{c2:'#3b6b2a',sp:big?2.4:1.4,size:big?1.3:.9});sparks(p,big?40:18,big?5:3,'#e6ffb0','#4fc040');if(big){const r=ring(.2,.5,'#b4ff70',.8);r.position.copy(p);r.position.y=O.y+.05;BOOMS.push({m:r,t:0,life:.6,s:6});const fl=glow(GLOWG,3,null);fl.position.copy(p);BOOMS.push({m:fl,t:0,life:.35,s:2.5,spr:1});}}
const BOOMS=[];function boomUpd(dt){for(let i=BOOMS.length-1;i>=0;i--){const b=BOOMS[i];b.t+=dt;const k=b.t/b.life;if(k>=1){S.remove(b.m);BOOMS.splice(i,1);continue;}
  if(b.spr){b.m.scale.setScalar(b.s*(.6+k));b.m.material.opacity=1-k;}else{b.m.scale.setScalar(1+k*b.s);b.m.material.opacity=(1-k)*.8;}}}
function shock(p,col,s=6,life=.6){const r=ring(.25,.5,col,.8);r.position.set(p.x,O.y+.05,p.z);BOOMS.push({m:r,t:0,life,s});}
// ---------- กล้อง/เรนเดอร์ ----------
const CW=960,CH=600;WD.gl.setSize(CW,CH,false);WD.composer.setSize(CW,CH);WD.cam.aspect=CW/CH;WD.cam.updateProjectionMatrix();
const cam={p:W(-5,-4,3),l:W(4,0,1),shake:0};
WD.camHook=c=>{c.position.copy(cam.p);if(cam.shake>0){c.position.x+=rnd(-1,1)*cam.shake;c.position.y+=rnd(-1,1)*cam.shake;}c.lookAt(cam.l);};
let HOOK=null;const comp=WD.composer,origR=comp.render.bind(comp);
comp.render=function(...a){try{ME.g.visible=false;if(WD.EM3)for(const [,e] of WD.EM3)if(e&&e.g)e.g.visible=false;HOOK&&HOOK();}catch(e){HL.errs.push('hook: '+(e.stack||e.message).slice(0,300));}return origR(...a);};
const FPS=(SK==='whip'||SK==='dash')?30:20,DT=1/FPS;let now=performance.now();
const out=document.createElement('canvas');out.width=720;out.height=450;const ox=out.getContext('2d');
const images={};let label='';
function frame(name,still){now+=DT*1000;WD.render(DT,now);
  if(still){const c2=document.createElement('canvas');c2.width=CW;c2.height=CH;const x=c2.getContext('2d');x.drawImage(WD.gl.domElement,0,0);bar(x,CW,22);images[name]=c2.toDataURL('image/jpeg',.94);return;}
  ox.drawImage(WD.gl.domElement,0,0,CW,CH,0,0,720,450);bar(ox,720,17);images[name]=out.toDataURL('image/jpeg',.88);}
function bar(x,w,fs){x.fillStyle='rgba(8,22,10,.78)';x.fillRect(10,10,w-20,fs+16);x.fillStyle='#eaffd8';x.font=fs+'px Tahoma';x.fillText(label,22,10+fs+3);}
// ======================================================================================
const SKS={};
// 1) BA แส้หนาม — hit sector 280 game units = 14m, 120 degrees; visible swing may continue beyond it.
SKS.whip={dur:3.0,still:.45,setup(){const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0);const e1=pup('1.3.2.0.0.2.1.0.0.0',10.5,3,Math.PI,'enemy'),e2=pup('2.0.1.1.0.1.2.0.0.0',11,-3.6,Math.PI,'enemy');
    const wh=Whip(14,true);cam.p.copy(W(-14,0,19));cam.l.copy(W(4,0,.5));
    const SW=[{t0:.3,dir:1},{t0:1.1,dir:-1}],hit=new Set();
    return (t,dt)=>{idle(me,t);idle(e1,t);idle(e2,t);const r=wh.upd(me,t,SW.find(s=>t-s.t0>0&&t-s.t0<.78)||{t0:-9,dir:1});
      label='BA แส้หนาม · ระยะโจมตี 280 · 120° ด้านหน้า · แส้เหวี่ยงเลยตามแรง';
      for(const [k,e] of [[0,e1],[1,e2]]){SW.forEach((sw,si)=>{const key=si*10+k;if(!r||Math.abs(t-sw.t0-r.st)>.001||hit.has(key))return;const c=chestW(e),dx=c.x-me.g.position.x,dz=c.z-me.g.position.z,dist=Math.hypot(dx,dz),angle=Math.abs(Math.atan2(dx,dz)-me.g.rotation.y);if(dist<=14&&angle<=Math.PI/3&&r.pts.some(p=>p.distanceTo(c)<1.3)){hit.add(key);e.hitT=t;sparks(c,22,4.5,'#f6ffb0','#62d04a');leaves(c,8,3);}});
        if(e.hitT!==undefined)hitFlinch(e,Math.max(0,1-(t-e.hitT)/.3));}};}};
// 2) Dash — เถาวัลย์เกี่ยว: เพื่อน = หนามพันฮีล • ศัตรู = หนามพันพิษ+ช้า • ดึงตัวเราเข้าไป
SKS.dash={dur:4.6,still:.88,setup(){const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0),foe=pup('1.3.2.0.0.2.1.0.0.0',11,-3.4,Math.PI*1.1,'enemy');
    const plant=Turret();plant.g.position.copy(W(11,2.2,0));plant.grow(1);
    const vine=Tube(30,6,M.bark),th=Thorns(70,.8),coil=Tube(60,5,M.bark),cth=Thorns(40,.7),speed=TrailRibbon(10,'#3f7a28');
    cam.p.copy(W(-10,0,13));cam.l.copy(W(5,3,1));const takes=[{t0:.1,tgt:plant,col:'#b4ff78',kind:'plant'},{t0:2.35,tgt:foe,col:'#b070ff',kind:'foe'}];
    return (t,dt)=>{idle(foe,t);plant.pose(t,0,0);
      let tk=t<2.3?takes[0]:takes[1],st=t-tk.t0;
      if(t>=2.3&&!tk.reset){tk.reset=1;me.g.position.copy(W(0,0,0));sparks(W(0,0,1),10,2);}
      idle(me,t);const tg=chestW(tk.tgt),start=me.g.position.clone();face(me,tg);
      const aim=phase(st,0,.20),fly=phase(st,.20,.43),pull=phase(st,.73,1.18);
      // สะบัดไม้ไปด้านข้างก่อน แล้วส่งมือกลับเข้าหาเป้าตอนเถาพุ่ง
      const sideSwing=Math.sin(Math.PI*ease(phase(st,0,.28)));
      me.armR.rotation.set(-1.2+.3*sideSwing,-1.05*sideSwing,.25*sideSwing);me.b.rotation.y=-.4*sideSwing;me.armL.rotation.set(-.6*aim,0,-.3);
      const hitAge=st-.43,tug=hitAge>0?Math.exp(-hitAge*9)*Math.sin(hitAge*32):0;
      me.armR.rotation.x+=.32*tug;me.b.rotation.x-=.22*tug;me.b.rotation.y+=.12*tug;
      if(tk.kind==='foe')foe.b.rotation.x+=.20*tug;
      if(st>.73&&st<1.18){const from=tk.from||(tk.from=me.g.position.clone()),dir=V3().subVectors(tk.tgt.g.position,from),L=dir.length();dir.normalize();
        me.g.position.copy(from).addScaledVector(dir,(L-1.4)*ease(pull));me.b.rotation.x=.55*Math.sin(pull*Math.PI);me.legs[0].rotation.x=-.6;me.legs[1].rotation.x=.5;
        if(Math.floor(t*FPS)%1===0)leaves(me.g.position.clone().add(V3(0,1,0)),2,1.2,{life:.7});speed.push([me.g.position.clone().add(V3(0,.4,0)),me.g.position.clone().add(V3(0,1.6,0))]);}
      else speed.push(null);
      if(st>=1.18&&!tk.land){tk.land=1;if(tk.from){const dir=V3().subVectors(tk.tgt.g.position,tk.from),L=dir.length();if(L>1.4)me.g.position.copy(tk.from).addScaledVector(dir,(L-1.4)/L);}dirt(me.g.position.clone(),16,3);leaves(me.g.position.clone().add(V3(0,.3,0)),10,3);}
      // ปลายเถาอ้อมออกด้านข้างก่อนเข้าเป้า; พันแล้วรอสั้น ๆ ก่อนดึง (เวลานี้เพื่อพรีวิวเท่านั้น)
      const tip=tipW(me);vine.visible=th.visible=st>.02&&st<1.26;
      if(vine.visible){const k=ease(fly),side=V3(tip.z-tg.z,0,tg.x-tip.x).normalize(),origin=tip.clone().addScaledVector(side,.8*ease(phase(st,0,.18))),control=tip.clone().lerp(tg,.30).addScaledVector(side,25),end=origin.multiplyScalar((1-k)*(1-k)).addScaledVector(control,2*k*(1-k)).addScaledVector(tg,k*k),loose=1-ease(phase(st,.36,.48)),pts=[];
        if(st>=.43&&!tk.ropeLength)tk.ropeLength=tip.distanceTo(tg);
        const chord=tip.distanceTo(tg),extra=tk.ropeLength?Math.sqrt(Math.max(0,tk.ropeLength**2-chord**2)):0;
        const slack=Math.min(2.8,extra*.35)*ease(phase(st,.73,.86));
        for(let i=0;i<30;i++){const u=i/29,p=V3().lerpVectors(tip,end,u),envelope=Math.sin(u*Math.PI);if(st<.20){const a=u*Math.PI*2.5-st*5,rr=.25*u;p.addScaledVector(side,Math.sin(a)*rr);p.y+=Math.cos(a)*rr+u*.14;}else{
          const tipBend=Math.exp(-(((u-.80)/.17)**2))*Math.sin(u*5-st*20)*1.9*loose;
          p.y+=envelope*(.04+.48*loose)-envelope*Math.min(.55,slack*.30)+envelope*.16*Math.sin(u*7-st*25)*loose;
          const tensionWave=hitAge>0?ease(phase(hitAge,0,.05))*Math.exp(-hitAge*9)*Math.sin(hitAge*32-u*3)*.65:0;
          p.addScaledVector(side,envelope*(.8*Math.sin(u*5-st*20)*loose+slack+tensionWave)+tipBend*envelope);
        }pts.push(p);}
        const rad=u=>.05*(1-.4*u)+.012;vine.set(pts,rad,(u,c)=>c.set('#4a3218').lerp(new T.Color('#62a63a'),u));th.put(thornsAlong(pts,rad,2,.8));
        if(st>=.43&&!tk.hit){tk.hit=1;sparks(tg,20,4,tk.kind==='ally'?'#ffffff':'#f0d0ff',tk.col);leaves(tg,10,3);}}
      // หนามพันรอบตัวเป้า 3 วิ (เกลียวขึ้นจากขาถึงอก)
      const wrap=phase(st,.43,.67),still=st>.43;coil.visible=cth.visible=still;
      if(still){const P=tk.tgt.g.position,pts=[],isPlant=tk.kind==='plant',radius=isPlant?.23:.36,height=isPlant?1.1:1.45;for(let i=0;i<60;i++){const u=i/59*wrap,a=u*Math.PI*7+t*.6;pts.push(V3(P.x+Math.cos(a)*radius,P.y+.15+u*height,P.z+Math.sin(a)*radius));}
        const rad=u=>.035;coil.set(pts,rad,(u,c)=>c.set('#3e5a1e').lerp(new T.Color(isPlant?'#8fe060':'#7a4a9a'),.35+.3*Math.sin(u*20)));cth.put(thornsAlong(pts,rad,3,.7,1.7));
        if(Math.random()<.5){const p=P.clone().add(V3(rnd(-.4,.4),rnd(.3,1.7),rnd(-.4,.4)));if(isPlant)sparks(p,1,.6,'#e0ffd8','#4cff7a',{g:-1.5,life:1.6,size:1.4});else puff(p,1,'#9a5ad0',{c2:'#3a7a2a',sp:.4,size:.5});}
        if(tk.kind==='foe'){tk.tgt.legs[0].rotation.x=Math.sin(t*20)*.08;}}
      if(tk.kind==='plant'&&st>.73&&st<1.38)plant.g.rotation.z=.12*Math.sin(phase(st,.73,1.38)*Math.PI*2)*Math.exp(-Math.max(0,st-.93)*4);
      else plant.g.rotation.z=tk.kind==='plant'?.18*tug:0;
      label=t<2.3?'Dash เถาวัลย์เกี่ยว · เกี่ยวต้นไม้ของเรา → ดึงตัวเราเข้าหา':'Dash เถาวัลย์เกี่ยว · เกี่ยวศัตรู → หนามพัน + พิษและช้า';};}};
// 3) โล่หนาม — โล่ปกติด้านหน้า + วงหนามหมุนรอบตัว แทงศัตรูที่เข้าใกล้ 2 ม.
SKS.shield={dur:3.4,still:1.7,setup(){const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0),foe=pup('1.3.2.0.0.2.1.0.0.0',3.6,-1.2,Math.PI,'enemy');
    cam.p.copy(W(-3.4,-4.4,3.2));cam.l.copy(W(1.4,0,.9));
    const sh=new T.Group();add(sh);const rim=Tube(64,6,M.bark),rth=Thorns(40,1.1,sh);
    const memb=mesh(new T.CircleGeometry(.95,40),new T.MeshStandardMaterial({color:'#7fd65a',transparent:true,opacity:.38,side:T.DoubleSide,emissive:'#2a6a18',emissiveIntensity:.6,depthWrite:false}),sh);
    const vines=[];for(let i=0;i<5;i++){const t2=Tube(16,5,M.bark,sh);vines.push(t2);}
    const orbit=new T.Group();add(orbit);const ring2=Tube(80,5,M.bark),oth=Thorns(36,1.6),rg=ring(1.9,2.05,'#9cff6a',.35);
    const ball=mesh(new T.SphereGeometry(.16,12,10),new T.MeshBasicMaterial({color:'#ff5a3a'}));glow(GLOWT,.9,ball);
    return (t,dt)=>{idle(me,t);idle(foe,t);const up=outQ(t/.25)*(1-inQ((t-3.1)/.25));
      me.armL.rotation.set(-1.35*up,.35*up,0);
      const C=me.g.localToWorld(V3(.15,1.2,.75));sh.position.copy(C);sh.quaternion.copy(me.g.quaternion);sh.scale.setScalar(Math.max(.001,up));
      // ขอบโล่ = เถาวัลย์สาน + หนามงอกตามขอบ
      const rp=[];for(let i=0;i<64;i++){const a=i/63*Math.PI*2;rp.push(sh.localToWorld(V3(Math.cos(a)*.95,Math.sin(a)*.95,0)));}
      rim.visible=up>.02;rim.set(rp,u=>.07*up+.001,(u,c)=>c.set('#4a3218').lerp(new T.Color('#5c9a2e'),.5+.5*Math.sin(u*30)));
      const ths=[];for(let i=0;i<16;i++){const a=i/16*Math.PI*2+Math.sin(t*3)*.05;const d=V3(Math.cos(a),Math.sin(a),.25).normalize();ths.push({p:V3(Math.cos(a)*.98,Math.sin(a)*.98,0),d,s:1+.15*Math.sin(t*8+i)});}rth.put(ths);
      vines.forEach((v,k)=>{const a0=k*1.26,pts=[];for(let i=0;i<16;i++){const u=i/15,a=a0+u*2.2;pts.push(sh.localToWorld(V3(Math.cos(a)*.95*(1-u*.9),Math.sin(a)*.95*(1-u*.9),.02)));}v.visible=up>.02;v.set(pts,u=>.03*up+.001,(u,c)=>c.set('#5c9a2e'));});
      // วงหนามหมุนรอบตัว รัศมี 2 ม.
      const P=me.g.position,spin=t*2.2,op=up;const pts=[],ot=[];for(let i=0;i<80;i++){const a=i/79*Math.PI*2+spin;pts.push(V3(P.x+Math.cos(a)*1.85,P.y+.5+.08*Math.sin(a*6+t*4),P.z+Math.sin(a)*1.85));}
      ring2.visible=op>.02;ring2.set(pts,u=>.05*op+.001,(u,c)=>c.set('#3e5a1e').lerp(new T.Color('#8fd060'),.5+.5*Math.sin(u*40)));
      rg.position.set(P.x,P.y+.04,P.z);rg.material.opacity=.3*op;
      // ศัตรูเดินเข้ามา → หนามแทง
      const fz=lerp(3.6,1.9,ease(phase(t,.5,1.4)));foe.g.position.copy(W(fz,-1.2,0));const fd=Math.hypot(fz,1.2);
      for(let i=0;i<12;i++){const a=i/12*Math.PI*2+spin,dir=V3(Math.cos(a),0,Math.sin(a)),base=V3(P.x+dir.x*1.85,P.y+.5,P.z+dir.z*1.85);
        const toFoe=V3().subVectors(foe.g.position,base);const near=fd<2.25&&toFoe.length()<1.2;
        const ext=near?.6+1.3*Math.abs(Math.sin(t*9)):1;ot.push({p:base,d:near?toFoe.clone().setY(.9).normalize():dir.clone().setY(.25).normalize(),s:op*ext});
        if(near&&Math.sin(t*9)>.97){sparks(chestW(foe),6,3,'#f6ffb0','#62d04a');foe.hitT=t;}}
      oth.put(ot);if(foe.hitT!==undefined)hitFlinch(foe,Math.max(0,1-(t-foe.hitT)/.25));
      // กระสุนศัตรูชนโล่
      const bk=phase(t,1.9,2.25);ball.visible=t>1.9&&t<2.25;if(ball.visible)ball.position.lerpVectors(W(7,-.3,1.25),C,bk);
      if(t>=2.25&&!this.blk){this.blk=1;leaves(C,16,3.5,{dir:V3(0,0,1.5)});sparks(C,26,4.5,'#ffffff','#8fe060');shock(C,'#c8ff80',2,.35);}
      label='โล่หนาม · โล่ปกติด้านหน้า (ขอบเถาวัลย์ + หนามงอก) · วงหนามหมุนรอบตัวแทงศัตรูในระยะ 2 ม. (3 ดาเมจ / 0.5 วิ)';};}};
// 4) ป้อมยิง — โยนเมล็ด → งอกทันที (บนพื้น / ติดกำแพงเรียบ) → ยิงหนามหาศัตรูใกล้สุด ทุก 0.7 วิ
SKS.turret={dur:5.2,still:3.75,setup(){const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0),foe=pup('1.3.2.0.0.2.1.0.0.0',9,-5,-Math.PI*.7,'enemy');
    cam.p.copy(W(.5,-1.2,3.4));cam.l.copy(W(6.5,1.2,1));
    const wall=mesh(new T.BoxGeometry(.6,3.2,4),M.stone);wall.position.copy(W(6.5,3.6,1.6));wall.receiveShadow=true;
    const t1=Turret(),t2=Turret(true),s1=Seed(),s2=Seed(),SP=Spikes();t1.g.position.copy(W(5,-.6,0));
    t2.g.position.copy(W(6.5,3.3,1.7));t2.g.rotation.set(0,0,0);t2.g.rotation.order='YXZ';
    return (t,dt)=>{idle(foe,t);idle(me,t);
      const th1=phase(t,.05,.35),th2=phase(t,2.1,2.4);me.armR.rotation.set(-.4-1.6*Math.sin(Math.PI*Math.max(th1,th2)),0,0);
      s1.fly(tipW(me),t1.g.position,phase(t,.3,.85));s2.fly(tipW(me),W(6.5,3.3,1.7),phase(t,2.35,2.85),1.4);
      t1.grow(phase(t,.85,1.35));t2.grow(phase(t,2.85,3.35));
      // รากยึดผนัง ลำต้นตั้งขึ้นในแนวโลก
      t2.g.rotation.set(0,0,0);
      const ft=chestW(foe);for(const [k,tu,t0] of [[0,t1,1.4],[1,t2,3.4]]){if(t<t0){tu.pose(t,0,0);continue;}
        tu.head.updateMatrixWorld(true);const hp=tu.head.getWorldPosition(V3()),loc=tu.g.worldToLocal(ft.clone()),hl=tu.g.worldToLocal(hp.clone());
        const yaw=Math.atan2(loc.x-hl.x,loc.z-hl.z),st=(t-t0)%.7,rc=Math.max(0,1-st/.18);tu.pose(t,yaw,rc);
        const n=Math.floor((t-t0)/.7);if(n!==tu.n){tu.n=n;const nz=tu.head.localToWorld(V3(0,0,.55));SP.shoot(nz,ft.clone().add(V3(rnd(-.2,.2),rnd(-.2,.2),0)));sparks(nz,6,2,'#f4ffb0','#7ee05a');}}
      SP.upd(dt);
      label=t<2.1?'พืชป้อมยิง · โยนเมล็ด (ไกล 15 ม.) → งอกทันที → ยิงหนามหาศัตรูใกล้สุด 5 ดาเมจ ทุก 0.7 วิ ระยะ 20 ม.':'พืชป้อมยิง · รากเกาะกำแพง ลำต้นตั้งขึ้น · วางได้สูงสุด 2 ต้น 60 HP อยู่ 20 วิ';};}};
// 5) ดอกบัว — ต้นใหญ่ 100 HP วง 8 ม. ฮีล 5/วิ • บัฟยิงเร็ว 4 วิ หลังปลูก • สปอร์ทุก 5 วิ ลอยข้างไหล่ → แส้โดน = สปอร์บินไประเบิดพิษ
SKS.lotus={dur:6.0,still:2.6,setup(){const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0),foe=pup('1.3.2.0.0.2.1.0.0.0',4.8,2.4,Math.PI*.95,'enemy'),tu=Turret();tu.g.position.copy(W(2.2,-3.2,0));tu.grow(1);
    cam.p.copy(W(-4.2,-6.8,5.2));cam.l.copy(W(3.2,-2,1));
    const L=Lotus(1),sd=Seed();L.g.position.copy(W(4,-4,0));const area=ring(7.6,8,'#9cff6a',.5),fill=disc(7.6,'#6cd04a',.12);area.position.copy(W(4,-4,.04));fill.position.copy(W(4,-4,.03));
    const sp=Spore(false),wh=Whip(),buff=ring(.5,.62,'#ffd23f',.8);
    return (t,dt)=>{idle(me,t);idle(foe,t);const th=phase(t,.05,.35);me.armR.rotation.set(-.4-1.6*Math.sin(Math.PI*th),0,0);
      sd.fly(tipW(me),L.g.position,phase(t,.3,.85));if(t>=.85&&!this.s){this.s=1;sprout(L.g.position,1.6);shock(L.g.position,'#b4ff70',6,.6);}
      const gr=phase(t,.85,1.5),op=phase(t,1.3,2.1);L.set(outQ(gr),ease(op),t);const ak=ease(phase(t,1.2,1.8));area.scale.setScalar(Math.max(.01,ak));fill.scale.setScalar(Math.max(.01,ak));
      area.material.opacity=.45+.15*Math.sin(t*4);
      // ฮีลลอยขึ้นในวง + พัลส์
      if(t>1.6){for(let i=0;i<3;i++){const a=rnd(0,6.28),r=Math.sqrt(rnd(0,1))*7.4,p=L.g.position.clone().add(V3(Math.cos(a)*r,.1,Math.sin(a)*r));SPK.add({p,v:V3(0,rnd(.6,1.3),0),life:1.6,size:.06,col:'#e6ffd0',c2:'#5bff7a',add:1,g:-.2,sx:1});}
        if(Math.floor((t-1.6)/1.2)!==this.pl){this.pl=Math.floor((t-1.6)/1.2);shock(L.g.position,'#8cff7a',15,1);}}
      // บัฟยิงเร็ว 4 วิหลังปลูก (ป้อมเรืองทอง + ยิงถี่)
      const bf=t>1.5&&t<5.5;buff.visible=bf;if(bf){buff.position.copy(tu.g.position).add(V3(0,.05,0));buff.scale.setScalar(1+.15*Math.sin(t*10));tu.tipG.material.color.set('#ffd23f');}
      tu.pose(t,Math.atan2(-2,2.6),bf?Math.max(0,1-((t*3)%1)/.3):0);if(bf&&Math.random()<.25)sparks(tu.head.getWorldPosition(V3()),2,1.5,'#fff2a0','#ffb000');
      // สปอร์: เกิดที่แกนดอกบัว → บินมาลอยข้างไหล่
      const born=2.4,sh=me.g.localToWorld(V3(-.45,1.75,-.1)),core=L.bloom.getWorldPosition(V3()).add(V3(0,.3,0));
      if(t>born&&t<4.3){sp.visible=true;const k=ease(phase(t,born,3.3));sp.position.lerpVectors(core,sh,k);sp.position.y+=Math.sin(k*Math.PI)*1.6+Math.sin(t*4)*.05*(k>=1);if(Math.random()<.6)sparks(sp.position,1,.4,'#f6ffb0','#7ee05a',{life:.8});}
      // แส้โดน → สปอร์ 1 ลูกบินไประเบิดพิษ (ไม่มีดาเมจแรก)
      const sw={t0:3.55,dir:-1};const r=wh.upd(me,t,sw);if(r&&!this.hit&&(r.tip.distanceTo(chestW(foe))<1.4||r.pts[18].distanceTo(chestW(foe))<1.1)){this.hit=t;sparks(chestW(foe),18,4,'#f6ffb0','#62d04a');}
      if(this.hit&&foe)hitFlinch(foe,Math.max(0,1-(t-this.hit)/.3));
      if(this.hit&&t>this.hit&&t<this.hit+.45){const k=ease((t-this.hit)/.45);sp.visible=true;sp.position.lerpVectors(sh,chestW(foe),k);sp.position.y+=Math.sin(k*Math.PI)*.8;}
      if(this.hit&&t>=this.hit+.45&&!this.boom){this.boom=1;sp.visible=false;poisonBurst(chestW(foe),false);}
      if(this.boom&&Math.random()<.5)puff(chestW(foe).add(V3(rnd(-.3,.3),rnd(-.5,.3),0)),1,'#86e05a',{c2:'#3a6a2a',sp:.3,size:.5});
      label=t<2.4?'ดอกบัว · 100 HP · วง 8 ม. ฮีลเรา/เพื่อน/พืช 5/วิ · ป้อมได้บัฟยิงเร็ว 4 วิ หลังปลูก':t<3.5?'ดอกบัว · ทุก 5 วิ สร้างสปอร์ บินมาลอยข้างไหล่ (อยู่ 10 วิ)':'ดอกบัว · แส้โดน 1 ครั้ง = สปอร์ 1 ลูกบินไประเบิดควันพิษ (ไม่มีดาเมจแรก)';};}};
// 6) ย้ายพืช — พืชทุกต้นมุดดิน → วิ่งใต้ดินมาหาเรา → โผล่จัดวงรอบตัวใหม่ + เลือดเต็ม + บัฟยิงเร็ว 4 วิ
SKS.move={dur:4.2,still:2.75,setup(){const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0);me.g.position.copy(W(0,0,0));
    cam.p.copy(W(-6,-5.5,6.2));cam.l.copy(W(3,1.5,0));
    const A=Turret(),B=Turret(),Lo=Lotus(.8);const old=[W(9,4.5,0),W(7,8.5,0),W(11,7,0)],neu=[W(1.6,-2.4,0),W(1.6,2.4,0),W(-2.8,0,0)];
    const plants=[{p:A,o:old[0],n:neu[0],k:'t'},{p:B,o:old[1],n:neu[1],k:'t'},{p:Lo,o:old[2],n:neu[2],k:'l'}];
    plants.forEach(q=>{q.p.g.position.copy(q.o);if(q.k==='t')q.p.grow(1);else q.p.set(1,1,0);});
    const bars=plants.map(()=>{const g=new T.Group();add(g);const bg=mesh(new T.PlaneGeometry(1,.12),new T.MeshBasicMaterial({color:'#202020',depthTest:false}),g);const fg=mesh(new T.PlaneGeometry(1,.12),new T.MeshBasicMaterial({color:'#7dff5a',depthTest:false}),g);fg.position.z=.001;g.fg=fg;return g;});
    const auras=plants.map(()=>ring(.55,.7,'#ffd23f',.8));
    return (t,dt)=>{idle(me,t);const cast=phase(t,0,.3);me.armR.rotation.set(-1.3*Math.sin(Math.PI*cast),0,0);me.armL.rotation.set(-1.3*Math.sin(Math.PI*cast),0,0);
      if(t<.3&&!this.c){this.c=1;shock(me.g.position,'#c8ff80',5,.5);sparks(me.g.position.clone().add(V3(0,1,0)),20,3);}
      plants.forEach((q,i)=>{const dive=phase(t,.3+i*.08,.75+i*.08),run=phase(t,.8,1.9),pop=phase(t,2.0+i*.1,2.45+i*.1);
        const P=dive<1?q.o:run<1?null:q.n;const s=dive<1?1-inQ(dive):pop;
        if(q.k==='t'){q.p.grow(Math.max(.001,dive<1?1-inQ(dive):outQ(pop)));q.p.pose(t,0,0);}else q.p.set(dive<1?1-inQ(dive):outQ(pop),dive<1?1-dive:ease(pop),t);
        if(dive<1)q.p.g.position.copy(q.o).add(V3(0,-.6*inQ(dive),0));else if(pop>0)q.p.g.position.copy(q.n);
        if(dive>0&&dive<1&&Math.random()<.6)dirt(q.o,2,2);
        if(dive>=1&&run>0&&run<1){const p=V3().lerpVectors(q.o,q.n,ease(run));if(Math.random()<.8){dirt(p,2,1.6,{size:.8});puff(p,1,'#a08a6a',{sp:.4,size:.6});}}
        if(pop>0&&!q.popped){q.popped=1;sprout(q.n,1.2);shock(q.n,'#ffd23f',3,.5);}
        const hb=bars[i];hb.visible=pop>.5||dive<.2;hb.position.copy(q.p.g.position).add(V3(0,q.k==='t'?1.7:3.4,0));hb.lookAt(cam.p);const hp=pop>.5?1:.35;hb.fg.scale.x=hp;hb.fg.position.x=-(1-hp)/2;
        const au=auras[i];au.visible=pop>.6&&t<4.1;au.position.copy(q.n).add(V3(0,.05,0));au.scale.setScalar(1+.2*Math.sin(t*12+i));
        if(au.visible&&q.k==='t'&&Math.random()<.3)sparks(q.p.head.getWorldPosition(V3()),2,1.4,'#fff2a0','#ffb000');});
      label=t<1.9?'ย้ายพืช · พืชทุกต้นมุดลงดิน แล้ววิ่งใต้ดินมาหาเรา':'ย้ายพืช · โผล่จัดวงรอบตัวเราใหม่ + เลือดเต็ม + บัฟยิงเร็ว 4 วิ (ป้อมติดกำแพงได้ / ดอกบัวหาพื้นว่าง)';};}};
// 7) ลูกบอลไม้ — ขว้าง → หยุดลอยสั่น → หนามเรียวพุ่งแทงศัตรูรอบ ๆ แล้วดึงเข้ามา → บอลบีบแล้วแตก • กำแพงบังหนาม
SKS.ball={dur:4.6,still:2.05,setup(){const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0);const C=W(9,0,1.6);
    const foes=[pup('1.3.2.0.0.2.1.0.0.0',12.5,-2.2,Math.PI*.8,'enemy'),pup('2.0.1.1.0.1.2.0.0.0',8.2,3.6,-Math.PI*.6,'enemy'),pup('0.2.3.1.0.3.1.0.0.0',6.2,-3.1,Math.PI*.3,'enemy'),pup('1.1.1.0.0.0.0.0.0.0',13,4.2,Math.PI,'enemy')];
    const wall=mesh(new T.BoxGeometry(2.4,2.6,.5),M.stone);wall.position.copy(W(11.2,2.6,1.3));wall.rotation.y=.6;
    cam.p.copy(W(3,-6.2,4.4));cam.l.copy(W(9.5,0,1.1));
    const ball=new T.Group();add(ball);const bg=new T.IcosahedronGeometry(.48,2);{const p=bg.attributes.position;for(let i=0;i<p.count;i++){const v=V3(p.getX(i),p.getY(i),p.getZ(i)),n=v.clone().normalize();const k=1+.12*Math.sin(n.x*9+n.y*5)+.06*Math.sin(n.z*13);v.copy(n).multiplyScalar(.48*k);p.setXYZ(i,v.x,v.y,v.z);}bg.computeVertexNormals();}
    mesh(bg,M.wood,ball);for(let i=0;i<7;i++){const l=mesh(leafGeo,M.leaf,ball);const n=V3(rnd(-1,1),rnd(-.2,1),rnd(-1,1)).normalize();l.position.copy(n.multiplyScalar(.45));l.lookAt(V3());l.scale.setScalar(.7);}
    for(let i=0;i<3;i++){const r=mesh(new T.TorusGeometry(.5,.035,5,24),M.bark,ball);r.rotation.set(rnd(0,3),rnd(0,3),0);}
    const bglow=glow(GLOWG,1.6,ball);const spikes=foes.map(()=>Tube(18,5,M.bark)),sth=Thorns(10,1.1);
    return (t,dt)=>{idle(me,t);foes.forEach((f,i)=>{idle(f,t);});const th=phase(t,.05,.35);me.armR.rotation.set(-.4-1.7*Math.sin(Math.PI*th),0,0);
      const fl=phase(t,.3,.95);const st=tipW(me);if(t<.95){ball.position.lerpVectors(st,C,outQ(fl));ball.position.y+=Math.sin(fl*Math.PI)*.8;ball.rotation.set(t*12,t*7,0);}
      const shake=t>.95&&t<1.45?(t-.95)/.5:0;if(t>=.95&&t<2.75){ball.position.copy(C).add(V3(rnd(-1,1),rnd(-1,1),rnd(-1,1)).multiplyScalar(.09*shake+.015));}
      const fire=phase(t,1.45,1.62),pull=phase(t,1.75,2.25),back=phase(t,2.25,2.5),sq=phase(t,2.5,2.75);
      ball.scale.setScalar(t<2.5?1+.1*Math.sin(t*40)*shake:1-.45*ease(sq));bglow.scale.setScalar(1.6+shake*1.2+fire*.8);
      if(t>=2.75&&!this.br){this.br=1;ball.visible=false;chips(C,26,5);leaves(C,24,4.5);puff(C,10,'#b49a6a',{sp:1.6});shock(C,'#c8ff80',4,.5);sparks(C,30,5,'#fff6c0','#7ee05a');}
      const tip=[];foes.forEach((f,i)=>{const sp=spikes[i],target=chestW(f),blocked=i===1;
        let reach=fire,endP=V3().lerpVectors(C,target,blocked?.55:1);
        if(blocked&&fire>=1){reach=1-phase(t,1.62,1.8);if(!this.wb){this.wb=1;sparks(endP,14,3,'#ffffff','#a0a0a0');dirt(endP,6,2);}}
        const pk=blocked?0:pull;if(!blocked){f.g.position.copy(f.base).lerp(V3(C.x,f.base.y,C.z).add(V3().subVectors(f.base,C).setY(0).normalize().multiplyScalar(1.1)),ease(pk));if(pk>0&&pk<1){f.b.rotation.x=.4;f.legs[0].rotation.x=.6;}
          if(fire>=1&&!f.hit){f.hit=1;sparks(target,16,3.5,'#e8ffb0','#7ed957');}if(f.hit&&t>2.3&&Math.random()<.35)puff(chestW(f).add(V3(rnd(-.3,.3),rnd(-.6,.2),0)),1,'#86e05a',{c2:'#3a6a2a',sp:.3,size:.45});}
        const r=blocked?reach:(t<2.25?Math.min(fire,1):1-back),now2=chestW(f),e2=blocked?endP:now2;
        sp.visible=r>.01;if(sp.visible){const pts=[];for(let k=0;k<18;k++){const u=k/17*r;pts.push(V3().lerpVectors(ball.position,e2,u));}sp.set(pts,u=>.05*(1-u)+.008,(u,c)=>c.set('#4a3218').lerp(new T.Color('#c8e86a'),u));tip.push({p:pts[17],d:V3().subVectors(e2,ball.position).normalize(),s:1});}});
      sth.put(tip);
      label=t<1.45?'ลูกบอลไม้ · ขว้างไปข้างหน้า → หยุดลอยกลางอากาศแล้วสั่นแรง':t<2.5?'ลูกบอลไม้ · หนามเรียวแหลมแทงศัตรูรอบ ๆ แล้วดึงเข้ามาชิดลูก • กำแพงบังหนาม = หนามหดกลับ':'ลูกบอลไม้ · บีบตัวแวบหนึ่งแล้วแตกเป็นเศษไม้ใบไม้ · คนโดน: พิษ 5 วิ + ช้า 80% 1.5 วิ';};}};
// 8) รากยักษ์ — รากโผล่ใกล้ตัวไล่ไปตามแนว (20 ดาเมจ + สตัน 1 วิ) → ยกตั้งตรง ชะลอใกล้แนวดิ่ง → งอกใบ 3 วิเป็นต้นไม้ใหญ่ → กดซ้ำ ล้มลงตามแนว (มีพื้นที่เตือน)
SKS.root={dur:8.4,still:4.4,setup(){const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0),foes=[pup('1.3.2.0.0.2.1.0.0.0',6,.4,Math.PI,'enemy'),pup('2.0.1.1.0.1.2.0.0.0',10.5,-.5,Math.PI,'enemy')];
    const LEN=14,N=60,base=W(1.2,0,0),root=Tube(N,10,M.bark),rth=Thorns(80,2.2);
    const crown=new T.Group();add(crown);const blobs=[];const bcol=['#4f9a35','#62b040','#3f8a2c','#78c24a'];for(let i=0;i<16;i++){const m=mesh(new T.IcosahedronGeometry(1,1),STD(bcol[i%4],{roughness:.75,flatShading:true}),crown);const a=i/16*6.28,r=rnd(.4,2.6);m.position.set(Math.cos(a)*r,rnd(-1,1.6),Math.sin(a)*r);m.userData.s=rnd(1.4,2.4);m.scale.setScalar(.001);blobs.push(m);}
    const br=[];for(let i=0;i<6;i++)br.push(Tube(10,6,M.bark));
    const warn=new T.Mesh(new T.PlaneGeometry(3.2,LEN+3),new T.MeshBasicMaterial({color:'#ff4a2a',transparent:true,opacity:0,depthWrite:false}));warn.rotation.x=-Math.PI/2;add(warn);warn.position.copy(W(1.2+(LEN+3)/2,0,.04));
    const stars=foes.map(()=>{const g=new T.Group();add(g);for(let i=0;i<4;i++){const s=glow(GLOWT,.35,g);s.position.set(Math.cos(i*1.57)*.35,0,Math.sin(i*1.57)*.35);}g.visible=false;return g;});
    return (t,dt)=>{idle(me,t);const cast=phase(t,0,.35);me.armR.rotation.set(-1.4*Math.sin(Math.PI*.5*cast)-.1,0,0);me.armL.rotation.set(-1.2*cast,0,0);
      if(t>4.5&&t<5.0){const k=Math.sin(phase(t,4.5,5)*Math.PI);me.armR.rotation.set(-2.6*k,0,0);me.armL.rotation.set(-2.6*k,0,0);}
      // กล้อง: ช่วงแรกมุมข้าง • ช่วงต้นไม้ถอยกว้าง
      const wide=ease(phase(t,1.0,2.2));cam.p.copy(W(lerp(-2,-6,wide),lerp(-8,-17,wide),lerp(3.2,7.5,wide)));cam.l.copy(W(lerp(6,7,wide),0,lerp(.8,6,wide)));
      const emerge=phase(t,.25,1.05),lift=phase(t,1.3,2.9),fall=phase(t,5.2,6.1);
      const ang=Math.PI/2*(1-Math.pow(1-lift,2.6))*(1-Math.pow(fall,2.2));   // ยก = ชะลอใกล้แนวดิ่ง • ล้ม = เร่งขึ้น
      const straight=lift;const pts=[];
      for(let i=0;i<N;i++){const u=i/(N-1),s=u*LEN;const vis=u<=emerge;const uu=Math.min(u,emerge);const ss=uu*LEN;
        const wav=(1-straight*.85)*(.35*Math.abs(Math.sin(ss*.75))-.18),side=(1-straight*.7)*.35*Math.sin(ss*.42);
        const lx=ss,ly=wav;   // ในระนาบแนว (lx ไปข้างหน้า, ly ขึ้น)
        const x=lx*Math.cos(ang)-ly*Math.sin(ang),y=lx*Math.sin(ang)+ly*Math.cos(ang);pts.push(V3(base.x-side,base.y+y,base.z+x));}
      const rad=u=>(.62*(1-u)+.16)*(.75+.25*Math.sin(u*40));
      root.set(pts,rad,(u,c)=>c.set('#3f2a16').lerp(new T.Color('#6a4a2a'),.5+.5*Math.sin(u*55)).lerp(new T.Color('#4f7a2a'),Math.max(0,u-.75)*1.2));
      rth.put(thornsAlong(pts,rad,4,2.2,1.9).filter((q,i)=>i%2===0));
      // ดินแตกตามแนวที่รากโผล่
      const head=pts[N-1];if(emerge>0&&emerge<1&&ang<.2){dirt(head.clone().setY(O.y+.05),3,3.5,{size:1.4});puff(head.clone().setY(O.y+.1),1,'#a08a6a',{sp:1,size:1});}
      foes.forEach((f,i)=>{const fz=f.base.z-O.z;idle(f,t);if(emerge*LEN>fz-1.2&&!f.hit){f.hit=t;sparks(chestW(f),20,4,'#fff6c0','#c08a4a');dirt(f.base,12,4);}
        if(f.hit!==undefined){const k=t-f.hit;f.g.position.copy(f.base).add(V3(0,Math.max(0,Math.sin(Math.min(1,k/.6)*Math.PI))*1.1,0));stars[i].visible=k<1.6;stars[i].position.copy(f.g.position).add(V3(0,2.25,0));stars[i].rotation.y=t*6;if(k<.6)f.b.rotation.x=-.5;}});
      // ใบงอก 3 วิ หลังตั้งตรง
      const top=pts[N-1],leafK=phase(t,2.9,5.0);crown.position.copy(top).add(V3(0,.3,0));crown.rotation.set(-(Math.PI/2-ang),0,0);
      blobs.forEach((b,i)=>{const k=ease(phase(leafK,i/20,i/20+.45));b.scale.setScalar(Math.max(.001,b.userData.s*k));});
      br.forEach((b,i)=>{const k=ease(phase(t,2.7,3.6));b.visible=k>.02&&t<6.6;if(!b.visible)return;const sIdx=Math.floor(N*(.62+i*.06)),P0=pts[Math.min(N-1,sIdx)],a=i*2.1,len=2.2*k;const d=V3(Math.cos(a)*.8,.9,Math.sin(a)*.8).normalize().applyAxisAngle(V3(1,0,0),-(Math.PI/2-ang));
        const q=[];for(let j=0;j<10;j++){const u=j/9;q.push(P0.clone().addScaledVector(d,u*len).add(V3(0,u*u*.4,0)));}b.set(q,u=>.15*(1-u)+.03,(u,c)=>c.set('#4a3218'));});
      if(leafK>0&&leafK<1&&Math.random()<.5)leaves(top.clone().add(V3(rnd(-2,2),rnd(-1,2),rnd(-2,2))),1,1);
      // เตือน → ล้ม → กระแทก
      warn.material.opacity=t>4.6&&t<6.2?.22+.12*Math.sin(t*14):0;
      if(fall>=1&&!this.imp){this.imp=1;cam.shake=.35;for(let k=0;k<8;k++){const p=W(1.2+k*1.9,0,0);dirt(p,10,5,{size:1.4});puff(p,4,'#b49a7a',{sp:2.6,size:1.4});}leaves(W(13,0,1),60,6);shock(W(14,0,0),'#e8d8a0',10,.8);}
      if(this.imp)cam.shake*=.86;
      label=t<1.2?'รากยักษ์ · รากโผล่ใกล้ตัวแล้วไล่ไปตามแนว · โดนทุกคนในแนว 20 ดาเมจ + สตัน 1 วิ':t<2.9?'รากยักษ์ · รากยกขึ้นตั้งตรง (ชะลอตอนใกล้แนวดิ่ง)':t<5.0?'รากยักษ์ · งอกใบ 3 วิ กลายเป็นต้นไม้ใหญ่ · กดซ้ำ = ล้ม (มีพื้นที่เตือนสีแดง)':'รากยักษ์ · ต้นไม้ค่อย ๆ ล้มลงตามแนวยาว · กระแทกพื้น (ดาเมจตอนล้มยังไม่กำหนด)';};}};
// 9) อัลติ — ดอกบัวยักษ์ 400 HP: ฮีลแรงขึ้น สปอร์เร็วขึ้น ระเบิดมีดาเมจแรก + พิษ • แส้เร็วขึ้นระหว่างอัลติ
SKS.ult={dur:6.4,still:2.9,setup(){const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0),foe=pup('1.3.2.0.0.2.1.0.0.0',4.4,1.6,Math.PI*.95,'enemy');
    cam.p.copy(W(-5,-9,7));cam.l.copy(W(2.8,-3.5,2.4));
    const L=Lotus(2.6);L.g.position.copy(W(2.5,-5,0));const area=ring(11.5,12.2,'#ffd23f',.55),fill=disc(11.5,'#7ae05a',.13);area.position.copy(W(2.5,-5,.05));fill.position.copy(W(2.5,-5,.03));
    const pillar=mesh(new T.CylinderGeometry(1.2,2.2,30,24,1,true),ADD('#fff3a0',{opacity:0}));pillar.position.copy(W(2.5,-5,15));
    const spores=[0,1,2,3].map(()=>Spore(true)),wh=Whip();
    return (t,dt)=>{idle(me,t);idle(foe,t);const cast=phase(t,0,.4);me.armR.rotation.set(-2.7*Math.sin(Math.PI*cast*.5),0,0);me.armL.rotation.set(-2.7*Math.sin(Math.PI*cast*.5),0,0);
      if(t>.4&&t<1.2){me.armR.rotation.set(-2.7*(1-phase(t,.9,1.2)),0,0);me.armL.rotation.set(-2.7*(1-phase(t,.9,1.2)),0,0);}
      if(t>=.35&&!this.c){this.c=1;dirt(L.g.position,40,7,{size:2,spread:4});leaves(L.g.position,40,6);shock(L.g.position,'#ffd23f',22,1);cam.shake=.18;}
      cam.shake*=.9;
      const gr=phase(t,.35,1.4),op=phase(t,1.1,2.2);L.set(outQ(gr),ease(op),t);const ak=ease(phase(t,.9,1.6));area.scale.setScalar(Math.max(.01,ak));fill.scale.setScalar(Math.max(.01,ak));
      pillar.material.opacity=.35*Math.sin(Math.PI*phase(t,.9,2.4));pillar.scale.set(1+op*.3,1,1+op*.3);
      if(t>1.4){for(let i=0;i<6;i++){const a=rnd(0,6.28),r=Math.sqrt(rnd(0,1))*11.5,p=L.g.position.clone().add(V3(Math.cos(a)*r,.1,Math.sin(a)*r));SPK.add({p,v:V3(0,rnd(.9,1.8),0),life:1.6,size:.08,col:'#fff6c0',c2:'#5bff7a',add:1,g:-.3,sx:1});}
        if(Math.floor((t-1.4)/.9)!==this.pl){this.pl=Math.floor((t-1.4)/.9);shock(L.g.position,'#b4ff70',22,1);}}
      // สปอร์หลายลูกไหลมาลอยรอบไหล่
      const core=L.bloom.getWorldPosition(V3()).add(V3(0,.8,0));
      spores.forEach((s,i)=>{const b=2.0+i*.35,slot=me.g.localToWorld(V3(i%2?.55:-.55,1.6+Math.floor(i/2)*.45,-.15));
        if(t<b)return;if(s.fired){if(t<s.fired+.35){const k=ease((t-s.fired)/.35);s.visible=true;s.position.lerpVectors(s.from,chestW(foe),k);s.position.y+=Math.sin(k*Math.PI)*.6;}else if(!s.boom){s.boom=1;s.visible=false;poisonBurst(chestW(foe),true);cam.shake=.12;}return;}
        s.visible=true;const k=ease(phase(t,b,b+.8));s.position.lerpVectors(core,slot,k);s.position.y+=Math.sin(k*Math.PI)*1.8+(k>=1?Math.sin(t*4+i)*.06:0);if(Math.random()<.5)sparks(s.position,1,.4,'#f6ffb0','#7ee05a',{life:.8});});
      // แส้เร็วขึ้น — 3 ครั้งติด แต่ละครั้งปล่อยสปอร์ 1 ลูก
      const SW=[{t0:3.6,dir:1},{t0:4.15,dir:-1},{t0:4.7,dir:1}];const r=wh.upd(me,t,SW.find(s=>t-s.t0>0&&t-s.t0<.82)||{t0:-9,dir:1});
      SW.forEach((sw,k)=>{if(r&&!sw.hit&&t>sw.t0&&t<sw.t0+.82&&(r.tip.distanceTo(chestW(foe))<1.5||r.pts[18].distanceTo(chestW(foe))<1.2)){sw.hit=1;foe.hitT=t;sparks(chestW(foe),16,4,'#f6ffb0','#62d04a');const s=spores.find(q=>!q.fired&&q.visible);if(s){s.fired=t;s.from=s.position.clone();}}});
      if(foe.hitT!==undefined)hitFlinch(foe,Math.max(0,1-(t-foe.hitT)/.3));
      label=t<2.0?'อัลติ · ดอกบัวยักษ์ 400 HP · ฮีลแรงขึ้น วงใหญ่ขึ้น · บัฟต้นไม้ตลอดเวลาที่ยังอยู่':t<3.6?'อัลติ · สร้างสปอร์เร็วขึ้น หลายลูกลอยรอบไหล่':'อัลติ · แส้ตวัดเร็วขึ้น · สปอร์ระเบิดแรงขึ้น: ดาเมจแรกทันที + พิษ';};}};
// ======================================================================================
const SKD=SKS[SK];if(!SKD)throw new Error('ไม่รู้จัก sk='+SK);
const upd=SKD.setup.call({});const ctx={};
const N=Math.round(SKD.dur*FPS),stillI=Math.round(SKD.still*FPS),FROM=+(Q.get('from')||0),TO=+(Q.get('to')||1e9);
HOOK=null;
if(WD.gl.compileAsync)await WD.gl.compileAsync(WD.scene,WD.cam);
for(let i=0;i<=N;i++){const t=i*DT;upd.call(ctx,t,DT);for(const p of POOLS)p.upd(DT);boomUpd(DT);
  if(i===stillI&&FROM===0)frame('nat_'+SK+'_still',true);
  if(i>=TO)break;
  if(!ONLY_STILL&&i>=FROM&&i<TO)frame('nat_'+SK+'_f'+String(i).padStart(3,'0'),false);
  else if(ONLY_STILL&&i>stillI)break;
  if(i%5===4)await new Promise(r=>setTimeout(r,0));}
return {images,sk:SK,frames:ONLY_STILL?0:N+1,fps:FPS,errs:HL.errs.slice(0,8)};
