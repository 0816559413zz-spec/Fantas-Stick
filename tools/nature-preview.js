// ตัวอย่างภาพสาย Nature (ยังไม่อยู่ในเกม) — โมเดล/ท่า/เอฟเฟกต์ทำด้วยโค้ดล้วน แล้วเรนเดอร์ในเอนจินจริงเพื่อให้ผู้ใช้รีวิว
// ใช้: node tools/headless.js --url "index.html?nosw&sk=whip" --js tools/nature-preview.js --timeout 400 --quiet
//   sk = whip | dash | shield | turret | turret_target | turret_break | buffshoot_vfx | lotus | lotus_expire | spore | spore_expire | move | move_wall | ball | root | ult
//   sk=lotus_mode = สลับฮีล/บัฟ, sk=big_pea = Dash เข้าป้อมเพื่อชาร์จลูกถั่วใหญ่
//   &still=1 = ถ่ายภาพนิ่งภาพเดียว (ไม่ทำเฟรม GIF)
//   sk=ball&wallcast=1 = ลูกบอลชนผนังระหว่างบิน, &throwv3=1 = ท่าโยนรอบใหม่
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
function Thorns(max,size=1,p,hooked=false){
  const height=(hooked?.31:.17)*size;
  const geo=new T.ConeGeometry((hooked?.061:.032)*size,height,5,hooked?3:1);
  geo.translate(0,height*.5,0);
  if(hooked){
    const pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++)pos.setX(i,pos.getX(i)+.135*size*(pos.getY(i)/height)**2);
    geo.computeVertexNormals();
  }
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
// โคนถูกมือพา แล้วแรงเบรกเดินจากโคนไปถึงปลายก่อนคลาย
const WHIP_N=26,WHIP_L=6,WHIP_LAG=.16;
function Whip(length=WHIP_L,curled=false){const tube=Tube(WHIP_N,7,M.bark),th=Thorns(60,1),trail=TrailRibbon(curled?5:18,curled?'#a0e74c':'#b8f060');
  const wake=curled?TrailRibbon(6,'#58da46'):null;
  const pulse=curled?Tube(WHIP_N,5,ADD('#ffffff',{vertexColors:true})):null;
  const vineDark=new T.Color('#19371a'),vineLight=new T.Color(curled?'#59833b':'#5c9a2e');
  const chargeColor=new T.Color(curled?'#b6ff63':'#b6e45a');
  if(pulse)pulse.castShadow=false;
  return {tube,th,trail,upd(o,t,sw){ // sw = {t0, dir(+1 ซ้าย→ขวา), aimYaw}
      const st=t-sw.t0,show=st>0&&st<(curled?.78:.82);tube.visible=th.visible=show;if(pulse)pulse.visible=false;
      if(!show){trail.push(null);if(wake)wake.push(null);return null;}
      const grow=curled?outQ(st/.06)*(.34+.66*ease((st-.08)/.15))*(1-ease((st-.61)/.17)):outQ(st/.12)*(1-inQ((st-.66)/.16)),s=sw.dir;
      const curl=curled?1-ease((st-.06)/.23):0;
      // มุมโคน (เทียบทิศที่หัน): ง้าง→กวาด→เลยไปนิด
      const brake=s<0?.31:.29;
      const ang=(x)=>{if(curled){const q=phase(x,.04,brake);
          const sweep=lerp(s<0?1.49:1.55,s<0?-1.27:-1.30,q*q*q*(q*(q*6-15)+10));
          return s*(sweep+.54*ease(phase(x,brake-.02,brake+.24))-.06*Math.sin(Math.PI*phase(x,brake,brake+.10)));
        }const a=1.45*s,b=-1.45*s;if(x<.1)return lerp(a*.85,a,x/.1);const k=(x-.1)/.36;if(k<1)return lerp(a,b,ease(k));const z=x-.46;return b+(-.22*s)*Math.sin(z*14)*Math.exp(-z*6);};
      const armYaw=ang(st);
      const armWeight=curled?ease(phase(st,0,.07))*(1-ease(phase(st,.52,.78))):1;
      o.armR.rotation.set(lerp(o.armR.rotation.x,-1.25+.25*Math.sin(Math.min(1,st/.46)*Math.PI),armWeight),armYaw*.55*armWeight,lerp(o.armR.rotation.z,0,armWeight));
      o.b.rotation.y=armYaw*.28*armWeight;
      const P0=tipW(o),yaw=o.g.rotation.y,pts=[P0.clone()],seg=length*grow/(WHIP_N-1);let p=P0.clone();
      for(let i=1;i<WHIP_N;i++){const u=i/(WHIP_N-1),delay=(curled?(s<0?.18:.17):WHIP_LAG)*u;
        // แต่ละช่วงสะบัดคนละจังหวะตามระยะจากมือ แล้วดีดกลับเบา ๆ
        const bendAge=st-brake-delay+.035;
        const snap=curled?Math.sin(Math.PI*phase(bendAge,0,.17)):0;
        const release=curled?Math.sin(Math.PI*phase(bendAge,.17,.35)):0;
        const bend=(snap*(.18+.58*u)-release*(.12+.26*u))*ease(phase(u,0,.24));
        const a=yaw+ang(Math.max(0,st-delay))*1.08+s*(curl*(s<0?3.8:4.0)*u*u-bend);
        const pitch=-.06-.22*u*u+.06*Math.sin(u*9-st*20)*(1-u)
          +(curled?curl*.35*Math.sin(u*Math.PI)*Math.sin(u*5.5+st*3)+u*(.21*snap-.14*release):0),cp=Math.cos(pitch);
        p=p.clone().add(V3(Math.sin(a)*cp,Math.sin(pitch),Math.cos(a)*cp).multiplyScalar(seg));if(p.y<O.y+.12)p.y=O.y+.12;pts.push(p);}
      const rad=(u)=>(.085*(1-u)+.018)*(.6+.4*grow);
      tube.set(pts,rad,(u,c)=>curled?c.copy(vineDark).lerp(vineLight,.22+.24*u+.10*Math.sin(u*36)):
        c.set('#4a3218').lerp(vineLight,Math.min(1,u*1.4)).lerp(chargeColor,Math.max(0,u-.7)*1.8));
      th.put(thornsAlong(pts,rad,2,grow*1.35));
      const tip=pts[WHIP_N-1],tipAngle=Math.atan2(tip.x-o.g.position.x,tip.z-o.g.position.z)-yaw;
      const sweeping=curled?st>.15&&st<.42&&Math.abs(tipAngle)<Math.PI/3:st>.1&&st<.6;
      trail.push(sweeping?[pts[WHIP_N-(curled?4:8)],tip]:null);
      if(wake){
        const strength=ease(phase(st,.22,.32));
        let sample=null;
        if(strength>0&&sw.lastTip&&!sw.wakeEnded){
          const lastAngle=Math.atan2(sw.lastTip.x-o.g.position.x,sw.lastTip.z-o.g.position.z)-yaw;
          const turn=tipAngle-lastAngle;
          // เมื่อปลายเริ่มดีดกลับ ให้รอยเดิมจางอยู่ที่เดิม
          if(Math.atan2(Math.sin(turn),Math.cos(turn))*s>=0)sw.wakeEnded=true;
          else{
            const across=V3(sw.lastTip.z-tip.z,0,tip.x-sw.lastTip.x).normalize();
            const edge=tip.clone().addScaledVector(across,.14+.16*strength);
            sample=[edge,tip];
          }
        }
        wake.push(sample,strength);
      }
      if(pulse&&st>=.075&&st<brake+.12){
        const head=(st-.075)/(brake-.075+.04);
        const glowAt=u=>ease(1-Math.abs(head-u)/.30);
        pulse.visible=true;
        pulse.set(pts,u=>rad(u)+.036*glowAt(u),(u,c)=>c.copy(chargeColor).multiplyScalar(1.6*glowAt(u)));
      }
      return {pts,tip,st};}};}
// ริบบิ้นทางเหวี่ยง (บวกแสง จางตามอายุ)
function TrailRibbon(n,col){const g=new T.BufferGeometry(),pos=new Float32Array(n*2*3),cl=new Float32Array(n*2*3),idx=[];
  for(let i=0;i<n-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('color',new T.BufferAttribute(cl,3));g.setIndex(idx);
  const m=mesh(g,new T.MeshBasicMaterial({vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));m.castShadow=false;
  const H=[],C=new T.Color(col);
  m.push=(pair,strength=1)=>{H.unshift(pair&&[pair[0].clone(),pair[1].clone(),strength]);if(H.length>n)H.pop();
    for(let i=0;i<n;i++){const h=H[i]||H.find(Boolean);const k=H[i]?(1-i/n)*.75*h[2]:0;
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
const {Turret,Lotus,LotusAura}=WD.naturePlantArt({T,M,STD,add,mesh,glow,GLOWG,GLOWT,GLOWP,leafGeo,V3,ease,phase,lerp,clamp,cheeky:Q.get('face')==='cheeky'});
// กระสุนหนามของป้อม
function Spikes(turretFx=false){const L=[],geo=new T.ConeGeometry(turretFx?.065:.045,turretFx?.53:.42,6);geo.rotateX(Math.PI/2);
  const thornMat=turretFx?STD('#8bd43f',{emissive:'#397918',emissiveIntensity:.48,roughness:.48}):M.thornTip;
  return {shoot(a,b,col){const m=mesh(geo,thornMat);const tr=TrailRibbon(turretFx?5:8,col||'#a8ff60');L.push({m,tr,a:a.clone(),b:b.clone(),t:0});},
    upd(dt){for(let i=L.length-1;i>=0;i--){const s=L[i];s.t+=dt/.28;const k=Math.min(1,s.t);s.m.position.lerpVectors(s.a,s.b,k);if(s.t<1)s.m.lookAt(s.b);const p=s.m.position,w=turretFx?.09:.04;s.tr.push(s.t<1?[p.clone().add(V3(0,w,0)),p.clone().add(V3(0,-w,0))]:null);
      if(s.t>=1&&!s.done){s.done=1;s.m.visible=false;
        if(turretFx){
          const back=s.a.clone().sub(s.b).normalize().multiplyScalar(1.5);
          sparks(s.b,13,3.1,'#efffa9','#67bc30',{dir:back,life:.7,size:1.35});
          leaves(s.b,5,2,{dir:back,life:.6,size:1.1});
        }else{sparks(s.b,14,3,'#f4ffb0','#6ed04a');leaves(s.b,4,2);}
      }
      if(s.t>1.6){S.remove(s.m);S.remove(s.tr);L.splice(i,1);}}}};}
// ---------- ดอกบัว ----------
// ต้นบัว (ผู้ใช้ 2026-11-04, ref designs/nature_ref/lotus_ref.png): ต้นไม้สีเขียวสูง ~3.5 ม. ยอดเป็นดอกบัวชมพู แกนเหลืองเรือง
// อยู่ในฟองแก้วเรืองแสงสีเขียว หยดน้ำเขียวไหลจากใต้ฟองลงตามลำต้น → แอ่งเรืองแสงที่โคน
// วงออร่าต้นบัว (ผู้ใช้ 2026-11-04 "aura or circle make it alot better"): วาดลง canvas — พื้นไล่สีเขียวจางจากขอบ,
// ขอบเถาวัลย์คู่เรืองแสง, ใบไม้+กลีบบัวชมพูเรียงรอบขอบ, วงลวดลายด้านในหมุนสวน, จุดเกสรทอง
// สปอร์ (ลูกเกสรเรืองแสง)
function Spore(big){const g=new T.Group();add(g);mesh(new T.IcosahedronGeometry(big?.15:.11,1),M.core,g);glow(GLOWG,big?.9:.6,g);
  for(let i=0;i<5;i++){const s=mesh(new T.ConeGeometry(.025,.12,4),M.leaf,g);const a=i/5*6.28;s.position.set(Math.cos(a)*.12,0,Math.sin(a)*.12);s.lookAt(V3(Math.cos(a)*1,0,Math.sin(a)));s.rotateX(Math.PI/2);}
  g.visible=false;return g;}
function poisonBurst(p,big){
  puff(p,big?26:19,'#7ed957',{c2:'#3b6b2a',sp:big?2.4:2.15,size:big?1.3:1.04});
  sparks(p,big?40:25,big?5:4.6,'#e6ffb0','#4fc040',big?{}:{life:.73,size:1.28});
  if(big){
    const r=ring(.2,.5,'#b4ff70',.8);
    r.position.copy(p);
    r.position.y=O.y+.05;
    BOOMS.push({m:r,t:0,life:.6,s:6});
  }else{
    puff(p,7,'#c2ee73',{c2:'#568635',sp:2.95,size:.74,life:.47,spread:.5});
  }
  const flash=glow(GLOWG,big?3:1.75);
  flash.position.copy(p);
  BOOMS.push({m:flash,t:0,life:big?.35:.18,s:big?2.5:1.75,spr:1});
}
const BOOMS=[];function boomUpd(dt){for(let i=BOOMS.length-1;i>=0;i--){const b=BOOMS[i];b.t+=dt;const k=b.t/b.life;if(k>=1){S.remove(b.m);BOOMS.splice(i,1);continue;}
  if(b.spr){b.m.scale.setScalar(b.s*(.6+k));b.m.material.opacity=1-k;}else{b.m.scale.setScalar(1+k*b.s);b.m.material.opacity=(1-k)*.8;}}}
function shock(p,col,s=6,life=.6){const r=ring(.25,.5,col,.8);r.position.set(p.x,O.y+.05,p.z);BOOMS.push({m:r,t:0,life,s});}
// ---------- กล้อง/เรนเดอร์ ----------
const CW=960,CH=600;WD.gl.setSize(CW,CH,false);WD.composer.setSize(CW,CH);WD.cam.aspect=CW/CH;WD.cam.updateProjectionMatrix();
const cam={p:W(-5,-4,3),l:W(4,0,1),shake:0};
WD.camHook=c=>{c.position.copy(cam.p);if(cam.shake>0){c.position.x+=rnd(-1,1)*cam.shake;c.position.y+=rnd(-1,1)*cam.shake;}c.lookAt(cam.l);};
let HOOK=null;const comp=WD.composer,origR=comp.render.bind(comp);
comp.render=function(...a){try{ME.g.visible=false;if(WD.EM3)for(const [,e] of WD.EM3)if(e&&e.g)e.g.visible=false;
  if(['dash','shield','turret','turret_target','turret_break','turret_expire','buffshoot_vfx','lotus','lotus_mode','lotus_expire','big_pea','spore','spore_expire','move','move_wall','ball'].includes(SK))for(const [,p] of WD.PM3)if(p?.g)p.g.visible=false;
  HOOK&&HOOK();}catch(e){HL.errs.push('hook: '+(e.stack||e.message).slice(0,300));}return origR(...a);};
const FPS=['whip','dash','shield','spore','turret_target','turret_break'].includes(SK)?30:20,DT=1/FPS;let now=performance.now();
const out=document.createElement('canvas');out.width=720;out.height=450;const ox=out.getContext('2d');
const images={};let label='';
function frame(name,still){now+=DT*1000;WD.render(DT,now);
  if(still){const c2=document.createElement('canvas');c2.width=CW;c2.height=CH;const x=c2.getContext('2d');x.drawImage(WD.gl.domElement,0,0);bar(x,CW,22);images[name]=c2.toDataURL('image/jpeg',.94);return;}
  ox.drawImage(WD.gl.domElement,0,0,CW,CH,0,0,720,450);bar(ox,720,17);images[name]=out.toDataURL('image/jpeg',.88);}
function bar(x,w,fs){x.fillStyle='rgba(8,22,10,.78)';x.fillRect(10,10,w-20,fs+16);x.fillStyle='#eaffd8';x.font=fs+'px Tahoma';x.fillText(label,22,10+fs+3);}
// ======================================================================================
const SKS={};
// 1) BA แส้หนาม — hit sector 280 game units = 14m, 120 degrees; visible swing may continue beyond it.
SKS.whip={dur:2.4,still:.57,setup(){const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0);const e1=pup('1.3.2.0.0.2.1.0.0.0',7,3.6,Math.PI,'enemy'),e2=pup('2.0.1.1.0.1.2.0.0.0',7,-3.6,Math.PI,'enemy');
    const wh=Whip(14,true);cam.p.copy(W(-11,0,17));cam.l.copy(W(3,0,.55));
    const swings=[{t0:.3,dir:1,shed:0},{t0:1.1,dir:-1,shed:0}],targets=[e1,e2];
    const leafBursts=[[.42,3],[.49,3],[.56,3]];
    return t=>{idle(me,t);idle(e1,t);idle(e2,t);
      const sw=swings.find(s=>t-s.t0>0&&t-s.t0<.78),r=wh.upd(me,t,sw||{t0:-9,dir:1});
      label='BA แส้หนาม · ระยะโจมตี 280 · 120° ด้านหน้า · แส้เหวี่ยงเลยตามแรง';
      if(r){
        const burst=leafBursts[sw.shed];
        if(burst&&r.st>=burst[0]&&sw.lastTip){
          const fling=r.tip.clone().sub(sw.lastTip).normalize().multiplyScalar(2.4);
          fling.y+=.75;
          const origin=r.tip.clone().lerp(r.pts[WHIP_N-3],sw.shed===0?.65:.2);
          leaves(origin,burst[1],1.9,{dir:fling,life:.72,size:1.45});
          sw.shed++;
        }
        sw.lastTip=r.tip;
      }
      for(const e of targets){
        if(r&&r.st<.46&&e.hitSwing!==sw){
          const c=chestW(e),dx=c.x-me.g.position.x,dz=c.z-me.g.position.z;
          const inSector=Math.hypot(dx,dz)<=14&&Math.abs(Math.atan2(dx,dz)-me.g.rotation.y)<=Math.PI/3;
          const contact=inSector?r.pts.findIndex(p=>p.distanceTo(c)<1.3):-1;
          if(contact>0){
            const p=r.pts[contact],dir=V3(sw.dir*-2.4,.65,1);
            e.hitSwing=sw;e.hitT=t;
            leaves(p,6,2.8,{dir,life:.65});
            sparks(p,9,4.2,'#edff9d','#62d04a',{dir,life:.6,size:1.4});
            for(let i=0;i<5;i++){
              const v=V3(rnd(-2,2),rnd(0,2.6),rnd(-1.6,1.6)).add(dir);
              SPK.add({p:p.clone(),v,life:rnd(.15,.28),size:rnd(.08,.14),spin:rnd(-12,12),g:5,drag:1,col:'#a4e153',c2:'#375e22',sx:3.2,shrink:1});
            }
          }
        }
        if(e.hitT!==undefined)hitFlinch(e,Math.max(0,1-(t-e.hitT)/.3));
      }};}};
// 2) Dash — เถาวัลย์เกี่ยว: เพื่อน = หนามพันฮีล • ศัตรู = หนามพันพิษ+ช้า • ดึงตัวเราเข้าไป
SKS.dash={dur:4.6,still:.88,setup(){
    const allyOnly=Q.has('ally');
    const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0),foe=pup('1.3.2.0.0.2.1.0.0.0',11,-3.4,Math.PI*1.1,allyOnly?'ally':'enemy');
    const plant=Turret();plant.g.position.copy(W(11,2.2,0));plant.grow(1);
    plant.g.visible=!allyOnly;
    const healRim=allyOnly?ring(.56,.62,'#a6ffad',0):null;
    const healFlare=allyOnly?glow(GLOWG,1.2):null;
    let healTick=-1;
    const vine=Tube(30,6,M.bark),th=Thorns(70,.8);
    const coil=Tube(60,allyOnly?7:5,M.bark),cth=Thorns(40,allyOnly?.86:.7,null,allyOnly);
    const speed=TrailRibbon(7,'#6da43d'),hookTrail=TrailRibbon(4,'#a0dd51');
    const tensionLight=Tube(30,5,ADD('#ffffff',{vertexColors:true}));
    tensionLight.castShadow=false;
    const airMat=ADD('#ffffff',{vertexColors:true});
    const launchAir=[Tube(15,5,airMat),Tube(15,5,airMat)];
    const rushAir=[Tube(15,5,airMat),Tube(15,5,airMat)];
    const airStrokes=[...launchAir,...rushAir];
    for(const stroke of airStrokes)stroke.castShadow=false;
    const airBright=new T.Color('#efffe3'),airGreen=new T.Color('#8bd19b');
    const hookFlash=glow(GLOWT,.55);
    const stemDark=new T.Color('#21381c'),stemTip=new T.Color('#71a648');
    const sapHead=new T.Color('#edffad'),sapTail=new T.Color('#55de53');
    cam.p.copy(W(-10,0,13));
    cam.l.copy(W(5,3,1));
    const wideEye=cam.p.clone(),wideLook=cam.l.clone();
    const nearEye=W(7.0,4.85,4.35),nearLook=W(10,-3.2,1.25);
    const armDown=V3(0,-1,0),handAim=V3(),idleArm=new T.Quaternion(),castArm=new T.Quaternion();
    const coilDark=new T.Color('#3e5a1e'),healVineGreen=new T.Color('#8fe060');
    const takes=[{t0:.1,tgt:plant,col:'#b4ff78',kind:'plant'},{t0:2.35,tgt:foe,col:'#b070ff',kind:'foe'}];
    const allyTake={t0:.1,tgt:foe,kind:'ally'};
    return (t,dt)=>{idle(foe,t);plant.pose(t,0,0);
      const tk=allyOnly?allyTake:t<2.3?takes[0]:takes[1],st=t-tk.t0;
      if(!allyOnly&&t>=2.3&&!tk.reset){tk.reset=1;me.g.position.copy(W(0,0,0));sparks(W(0,0,1),10,2);}
      idle(me,t);const tg=chestW(tk.tgt);face(me,tg);
      const aim=phase(st,0,.20),fly=phase(st,.20,.43),pull=phase(st,.73,1.18);
      // สะบัดไม้ไปด้านข้างก่อน แล้วส่งมือกลับเข้าหาเป้าตอนเถาพุ่ง
      const sideSwing=Math.sin(Math.PI*ease(phase(st,0,.28)));
      me.armR.rotation.set(-1.2+.3*sideSwing,-1.05*sideSwing,.25*sideSwing);me.b.rotation.y=-.4*sideSwing;me.armL.rotation.set(-.6*aim,0,-.3);
      const hitAge=st-.43,tug=hitAge>0?Math.exp(-hitAge*9)*Math.sin(hitAge*32):0;
      me.armR.rotation.x+=.32*tug;me.b.rotation.x-=.22*tug;me.b.rotation.y+=.12*tug;
      if(tk.kind==='foe')foe.b.rotation.x+=.20*tug;
      if(allyOnly){
        const draw=ease(phase(st,0,.17)),swing=ease(phase(st,.17,.43));
        const letGo=ease(phase(st,1.09,1.52));
        const wind=draw*(1-swing),follow=Math.sin(Math.PI*phase(st,.26,.60));
        const snap=hitAge>=0?Math.sin(26*hitAge)*Math.exp(-9*hitAge):0;
        const launch=Math.sin(Math.PI*phase(st,.70,.91));
        const yaw=-1.64*wind+.24*follow-.22*snap;
        handAim.set(Math.sin(yaw),.16+.29*wind-.29*follow-.19*snap,Math.cos(yaw)).normalize();
        idleArm.setFromEuler(new T.Euler(-.17,0,.12,'YXZ'));
        castArm.setFromUnitVectors(armDown,handAim);
        me.armR.quaternion.copy(idleArm).slerp(castArm,draw*(1-letGo));
        me.b.rotation.set(-.15*wind+.19*snap+.22*launch,-.54*wind+.24*follow-.12*snap,.14*wind-.09*snap);
        me.b.position.z+=.085*snap+.12*launch;
        me.b.position.y-=.045*Math.abs(snap);
        me.armL.rotation.set(-.24-.45*launch,.24*wind,-.13-.30*wind);
        foe.b.rotation.z=-.09*snap;
      }
      for(const stroke of airStrokes)stroke.visible=false;
      if(st>.73&&st<1.18){const from=tk.from||(tk.from=me.g.position.clone()),dir=V3().subVectors(tk.tgt.g.position,from),L=dir.length();dir.normalize();
        me.g.position.copy(from).addScaledVector(dir,(L-1.4)*ease(pull));
        if(allyOnly)me.b.rotation.x+=.48*Math.sin(pull*Math.PI);
        else me.b.rotation.x=.55*Math.sin(pull*Math.PI);
        me.legs[0].rotation.x=-.6;me.legs[1].rotation.x=.5;
        const wake=me.g.position.clone().add(V3(0,.72,0));
        const across=V3(dir.z,0,-dir.x),burst=phase(st,.73,.92);
        // Two short arcs peel off at the takeoff point.
        if(burst<1){
          const spread=.48+1.02*outQ(burst),gain=1-ease(burst);
          launchAir.forEach((stroke,i)=>{
            const side=i===0?-1:1,pts=[];
            for(let j=0;j<15;j++){
              const u=j/14,a=lerp(-.69,.74-i*.19,u);
              const p=from.clone().addScaledVector(across,side*Math.cos(a)*spread)
                .addScaledVector(dir,-.14-burst*.53-.16*u);
              p.y+=1.0+Math.sin(a)*spread;
              pts.push(p);
            }
            stroke.visible=true;
            const taper=u=>Math.sin(Math.PI*u)**.8;
            stroke.set(pts,u=>.088*gain*taper(u),(u,c)=>c.copy(airBright).lerp(airGreen,u).multiplyScalar(1.22*gain*taper(u)));
          });
        }
        // The wake follows the shoulders and scales with the pull's speed.
        const pace=4*pull*(1-pull);
        rushAir.forEach((stroke,i)=>{
          const side=i===0?-1:1,pts=[];
          for(let j=0;j<15;j++){
            const u=j/14;
            const p=wake.clone().addScaledVector(dir,.42-u*(.76+2.7*pace))
              .addScaledVector(across,side*(.45+.63*Math.sin(u*Math.PI*.64)));
            p.y+=.52-u*.28+i*.07;
            pts.push(p);
          }
          stroke.visible=pace>.09;
          const taper=u=>Math.sin(Math.PI*u)**.84;
          stroke.set(pts,u=>.077*pace*taper(u),(u,c)=>c.copy(airBright).lerp(airGreen,u).multiplyScalar(1.35*pace*taper(u)));
        });
        if(Math.round(t*FPS)%2===0)leaves(wake,3,1.6,{dir:dir.clone().multiplyScalar(-2.4),life:.64,size:1.3});
        speed.push([wake.clone().add(V3(0,.32,0)),wake]);}
      else speed.push(null);
      if(st>=1.18&&!tk.land){tk.land=1;if(tk.from){const dir=V3().subVectors(tk.tgt.g.position,tk.from),L=dir.length();if(L>1.4)me.g.position.copy(tk.from).addScaledVector(dir,(L-1.4)/L);}dirt(me.g.position.clone(),16,3);leaves(me.g.position.clone().add(V3(0,.3,0)),10,3);}
      // ปลายเถาอ้อมออกด้านข้างก่อนเข้าเป้า; พันแล้วรอสั้น ๆ ก่อนดึง (เวลานี้เพื่อพรีวิวเท่านั้น)
      const tip=tipW(me);vine.visible=th.visible=st>.02&&st<1.26;
      let trailSample=null;
      tensionLight.visible=hookFlash.visible=false;
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
        const rad=u=>.05*(1-.4*u)+.012;
        vine.set(pts,rad,(u,c)=>c.copy(stemDark).lerp(stemTip,.24+.51*u+.10*Math.sin(u*30)));
        th.put(thornsAlong(pts,rad,2,.8));
        if(st>.21&&st<.43)trailSample=[pts[26],end];
        if(st>=.43&&st<.72){
          const charge=1-phase(st,.43,.70);
          const lit=u=>ease(1-Math.abs(u-charge)/.27)*(1-ease(phase(st,.66,.72)));
          tensionLight.visible=true;
          tensionLight.set(pts,u=>rad(u)+.037*lit(u),(u,c)=>c.copy(sapTail).lerp(sapHead,lit(u)).multiplyScalar(1.6*lit(u)));
        }
        if(hitAge>=0&&hitAge<.19){
          hookFlash.visible=true;
          hookFlash.position.copy(tg);
          hookFlash.scale.setScalar(.55+hitAge*3.5);
          hookFlash.material.opacity=.86*(1-ease(hitAge/.19));
        }
        if(st>=.43&&!tk.hit){
          tk.hit=1;
          sparks(tg,18,4.2,'#f2ffac','#6fd449',{life:.72,size:1.45});
          leaves(tg,9,2.7,{dir:side.clone().multiplyScalar(.9),life:.7,size:1.35});
        }}
      hookTrail.push(trailSample);
      // หนามพันรอบตัวเป้า 3 วิ (เกลียวขึ้นจากขาถึงอก)
      const unwind=tk.kind==='ally'?ease(phase(hitAge,3,3.33)):0;
      const wrap=phase(st,.43,.67)*(1-unwind),still=st>.43&&unwind<1;coil.visible=cth.visible=still;
      if(still){const P=tk.tgt.g.position,pts=[],isPlant=tk.kind==='plant',radius=isPlant?.23:.58,height=isPlant?1.1:1.45;
        const coilPoint=u=>{
          const a=u*Math.PI*7+(allyOnly?.35:t*.6);
          const r=allyOnly?radius+.045*Math.sin(u*27):radius;
          return V3(P.x+Math.cos(a)*r,P.y+.15+u*height,P.z+Math.sin(a)*r);
        };
        for(let i=0;i<60;i++)pts.push(coilPoint(i/59*wrap));
        const rad=u=>(allyOnly?.056+.010*Math.sin(u*wrap*34):.035)*(1-unwind*.7);
        const vineColor=allyOnly||isPlant?healVineGreen:new T.Color('#7a4a9a');
        coil.set(pts,rad,(u,c)=>c.copy(coilDark).lerp(vineColor,.35+.3*Math.sin(u*20)));
        if(allyOnly){
          const barbs=[];
          for(let i=0;i<16;i++){
            const u=.042+i*.060;
            if(u>=wrap-.012)break;
            const p=coilPoint(u),out=p.clone().sub(P).setY(0).normalize();
            const tangent=coilPoint(u+.006).sub(coilPoint(u-.006)).normalize();
            const direction=out.clone().addScaledVector(tangent,i%2?.82:-.82).normalize();
            p.addScaledVector(out,rad(u/wrap)*.62);
            barbs.push({p,d:direction,s:1.08*(1-unwind*.72)});
          }
          cth.put(barbs);
        }else cth.put(thornsAlong(pts,rad,3,.7,1.7));
        if(Math.round(t*FPS)%3===0){
          const a=st*6.2,p=P.clone().add(V3(Math.cos(a)*(radius+.10),rnd(.26,height+.10),Math.sin(a)*(radius+.10)));
          if(isPlant)sparks(p,2,.62,'#fff3a7','#80cb3c',{g:-1.05,life:1.35,size:1.6});
          else if(tk.kind==='foe'){
            sparks(p,2,.54,'#daabfc','#743a9a',{g:-.8,life:1.25,size:1.55});
            puff(p,1,'#8554ae',{c2:'#48275c',sp:.56,size:.76,life:.64});
          }
        }
        if(tk.kind==='foe'){tk.tgt.legs[0].rotation.x=Math.sin(t*20)*.08;}}
      if(healRim&&healFlare){
        const pushIn=ease(phase(st,.70,1.40));
        cam.p.lerpVectors(wideEye,nearEye,pushIn);
        cam.l.lerpVectors(wideLook,nearLook,pushIn);
        const tick=Math.floor(hitAge/.5+1e-6)-1;
        const age=hitAge-(tick+1)*.5;
        const pulsing=tick>=0&&tick<6&&age<.36;
        healRim.visible=healFlare.visible=pulsing;
        if(pulsing){
          const rise=ease(phase(age,0,.36));
          const fade=(1-rise)*ease(phase(age,-.025,.07));
          healRim.position.copy(foe.g.position).add(V3(0,.10+1.51*rise,0));
          healRim.scale.setScalar(1+.20*Math.sin(Math.PI*rise));
          healRim.material.opacity=.88*fade;
          healFlare.position.copy(tg).add(V3(0,-.35+.46*rise,0));
          healFlare.scale.setScalar(.90+.42*rise);
          healFlare.material.opacity=.68*fade;
          if(tick!==healTick){
            healTick=tick;
            sparks(foe.g.position.clone().add(V3(0,.24,0)),9,1.05,'#f2ffbe','#77d35a',
              {dir:V3(0,1.65,0),g:-.64,life:1.14,size:1.35});
          }
        }
      }
      if(tk.kind==='plant'&&st>.73&&st<1.38)plant.g.rotation.z=.12*Math.sin(phase(st,.73,1.38)*Math.PI*2)*Math.exp(-Math.max(0,st-.93)*4);
      else plant.g.rotation.z=tk.kind==='plant'?.18*tug:0;
      label=allyOnly?(hitAge<0?'เถาวัลย์พุ่งไปเกี่ยวเพื่อน':hitAge<3?'เถาพันเพื่อน · แสงฮีลไต่จากเท้าขึ้นเป็นจังหวะ':'หมดฮีล · เถาคลายจากตัวเพื่อน')
        :t<2.3?'Dash เถาวัลย์เกี่ยว · เกี่ยวต้นไม้ของเรา → ดึงตัวเราเข้าหา':'Dash เถาวัลย์เกี่ยว · เกี่ยวศัตรู → หนามพัน + พิษและช้า';};}};
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
// 4) ป้อมยิง — โยนเมล็ด → งอกบนพื้น/ผนังเรียบ → ตัวอย่างภาพยิงหนาม
SKS.turret={dur:5.2,still:3.75,setup(){const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0),foe=pup('1.3.2.0.0.2.1.0.0.0',9,-5,-Math.PI*.7,'enemy');
    cam.p.copy(W(-.75,-1.2,3.65));cam.l.copy(W(6.5,-.30,1.10));
    const wall=mesh(new T.BoxGeometry(.6,3.2,4),M.stone);wall.position.copy(W(6.5,3.6,1.6));wall.receiveShadow=true;
    const t1=Turret(),t2=Turret(true),s1=Seed(),s2=Seed(),SP=Spikes(true);t1.g.position.copy(W(5,-.6,0));
    t2.g.position.copy(W(6.5,3.3,1.7));t2.g.rotation.set(0,0,0);t2.g.rotation.order='YXZ';
    const takes=[
      {plant:t1,at:.85,normal:V3(0,1,0),bud:glow(GLOWG,.8),shots:[1.56],next:0},
      {plant:t2,at:2.85,normal:V3(1,0,0),bud:glow(GLOWG,.8),shots:[3.55,4.70],next:0}
    ];
    return (t,dt)=>{idle(foe,t);idle(me,t);
      const th1=phase(t,.05,.35),th2=phase(t,2.1,2.4);me.armR.rotation.set(-.4-1.6*Math.sin(Math.PI*Math.max(th1,th2)),0,0);
      s1.fly(tipW(me),t1.g.position,phase(t,.3,.85));s2.fly(tipW(me),W(6.5,3.3,1.7),phase(t,2.35,2.85),1.4);
      const target=chestW(foe);
      for(const take of takes){
        const {plant,at,normal,bud,shots}=take,age=t-at;
        plant.grow(phase(age,0,.50));
        bud.visible=age>=0&&age<.54;
        if(bud.visible){
          const rise=ease(phase(age,.04,.44));
          bud.position.copy(plant.g.position).addScaledVector(normal,.13+.50*rise*normal.x);
          bud.position.y+=rise*1.23;
          bud.scale.setScalar(.52+.55*Math.sin(Math.PI*phase(age,0,.54)));
          bud.material.opacity=.87*(1-ease(phase(age,.25,.54)));
        }
        if(age>=0&&!take.sprouted){
          take.sprouted=true;
          const p=plant.g.position.clone().addScaledVector(normal,.13);
          sparks(p,12,1.6,'#e9ff9b','#56b732',{dir:normal.clone().multiplyScalar(.95),life:.83,size:1.35});
          leaves(p,7,1.25,{dir:normal.clone().multiplyScalar(.75),life:.77,size:1.26});
        }
        const loc=plant.g.worldToLocal(target.clone());
        const head=plant.g.worldToLocal(plant.head.getWorldPosition(V3()));
        const yaw=Math.atan2(loc.x-head.x,loc.z-head.z);
        const shot=shots[take.next];
        const fire=shot!==undefined&&t>=shot;
        if(fire){take.firedAt=shot;take.next++;}
        const recoil=1-phase(t,take.firedAt??-1,(take.firedAt??-1)+.18);
        plant.pose(t,yaw,recoil);
        if(shot!==undefined&&t<shot){
          const charge=ease(phase(t,shot-.22,shot));
          plant.tipG.scale.setScalar(.45+.58*charge);
        }
        if(fire){
          const nozzle=plant.head.localToWorld(V3(0,0,.55));
          const direction=target.clone().sub(nozzle).normalize();
          SP.shoot(nozzle,target);
          sparks(nozzle,10,2.45,'#f8ffbb','#70c638',{dir:direction.clone().multiplyScalar(1.55),life:.54,size:1.42});
          leaves(nozzle,3,1.55,{dir:direction,life:.60,size:.95});
        }
      }
      SP.upd(dt);
      label=t<2.1?'ป้อมยิง Nature · เมล็ดแตะพื้น → แสงไต่ลำต้น → ยิงหนาม':'ป้อมยิง Nature · รากเกาะผนัง → ฝักหันเข้าหาเป้า';};}};
// Separate visual study of the turret turning toward the player's target.
SKS.turret_target={dur:4.3,still:2.54,setup(){
  const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0);
  const first=pup('2.0.1.1.0.1.2.0.0.0',7,3.6,Math.PI,'enemy');
  const second=pup('1.3.2.0.0.2.1.0.0.0',7,-3.6,Math.PI,'enemy');
  const plant=Turret(),whip=Whip(14,true),spikes=Spikes(true);
  const swing={t0:1.6,dir:-1};
  const signal=glow(GLOWT,1.0);
  plant.g.position.copy(W(2.85,.75,0));
  plant.grow(1);
  cam.p.copy(W(-5.2,-1.7,8.7));
  cam.l.copy(W(3.9,0,.9));
  const aim=enemy=>{
    const local=plant.g.worldToLocal(chestW(enemy));
    return Math.atan2(local.x,local.z);
  };
  const startYaw=aim(first),targetYaw=aim(second);
  const firstShot=.82,nextShot=3.12;
  let selectedAt=-1,lastFire=-1,shotCount=0;
  return (t,dt)=>{
    idle(me,t);idle(first,t);idle(second,t);
    const swingNow=whip.upd(me,t,swing);
    if(selectedAt<0&&swingNow&&swingNow.st<.46&&swingNow.pts.some(p=>p.distanceTo(chestW(second))<1.3)){
      selectedAt=t;
      sparks(chestW(second),10,3.0,'#f0ffa8','#7ac343',{life:.65});
      leaves(chestW(second),4,1.75,{life:.62});
    }
    const age=selectedAt<0?-1:t-selectedAt;
    if(age>=0)hitFlinch(second,1-phase(age,0,.28));
    const turn=ease(phase(age,.04,.26)),settle=phase(age,.23,.48);
    const overshoot=.16*Math.sin(Math.PI*settle)*(1-settle);
    const shot=shotCount===0?firstShot:nextShot;
    const fire=t>=shot&&(shotCount===0||(shotCount===1&&selectedAt>=0));
    if(fire){lastFire=t;shotCount++;}
    const recoil=1-phase(t,lastFire,lastFire+.17);
    const jolt=age<0?0:Math.sin(age*31)*Math.exp(-age*8)*.55;
    plant.pose(t,lerp(startYaw,targetYaw,turn)+overshoot,recoil,false,false,jolt);
    plant.wings.forEach(({w,s})=>{w.rotation.z+=s*.62*Math.sin(Math.PI*phase(age,0,.35));});
    const core=plant.head.localToWorld(V3(0,.04,.14));
    const glowStrength=ease(phase(age,0,.09))*(1-ease(phase(age,.13,.38)));
    signal.visible=glowStrength>.002;
    signal.position.copy(core);
    signal.scale.setScalar(.68+.65*glowStrength);
    signal.material.opacity=glowStrength;
    if(selectedAt===t)sparks(core,11,1.65,'#fff1a1','#b8d955',{life:.73,size:1.16});
    if(shotCount<2&&t<shot){
      const charge=ease(phase(t,shot-.24,shot));
      plant.tipG.scale.setScalar(.45+.68*charge);
    }
    if(fire){
      const nozzle=plant.head.localToWorld(V3(0,0,.55));
      const target=chestW(shotCount===1?first:second);
      const direction=target.clone().sub(nozzle).normalize();
      spikes.shoot(nozzle,target);
      sparks(nozzle,9,2.4,'#f7ffaf','#7ac943',{dir:direction,life:.64});
    }
    spikes.upd(dt);
    if(t>=4.2&&shotCount!==2)throw new Error('Turret target study did not show both shots');
    label=selectedAt<0?'ป้อมกำลังยิงเป้าเดิม':shotCount<2?'แส้โดนอีกคน · ฝักสะบัดหันตาม':'ป้อมยิงนัดถัดไปใส่เป้าใหม่';
  };
}};
// The floor variant loses its pod. The wall variant drops after its roots give way.
SKS.turret_break={dur:3.8,still:2.35,setup(){
  const onWall=Q.has('onwall');
  const plant=Turret(onWall),foe=pup('1.3.2.0.0.2.1.0.0.0',15.5,onWall?-3.25:2.3,0,'enemy');
  const anchor=W(11.2,0,onWall?1.87:0);
  plant.g.position.copy(anchor);
  if(onWall){
    const wall=mesh(new T.BoxGeometry(.48,3.8,4.25),M.stone);
    wall.position.copy(anchor).add(V3(-.24,1.90-1.87,-.45));
    wall.receiveShadow=true;
  }
  const body=plant.stem.parent;
  const crossStroke=new T.CapsuleGeometry(.013,.086,3,6);
  const deadEyes=plant.eyeParts.map(({smile})=>{
    const mark=new T.Group();
    mark.position.copy(smile.position).add(V3(0,.015,.023));
    mark.rotation.copy(smile.rotation);
    mark.visible=false;
    plant.head.add(mark);
    for(const angle of [-Math.PI/4,Math.PI/4]){
      const stroke=mesh(crossStroke,smile.material,mark);
      stroke.rotation.z=angle;
      stroke.castShadow=false;
    }
    return {smile,mark};
  });
  cam.p.copy(onWall?W(6.45,-6.45,3.6):W(7.05,3.95,2.65));
  cam.l.copy(onWall?W(11.8,-.85,1.83):W(12.35,.35,1.12));
  face(foe,plant.g.position);
  const bolt=mesh(new T.SphereGeometry(.078,12,8),new T.MeshBasicMaterial({color:'#ffc988'}));
  bolt.castShadow=false;
  glow(GLOWT,.50,bolt);
  const boltTail=TrailRibbon(5,'#ff9b52');
  const impacts=[.95,2.12],brokenAt=impacts[1],hitOrigin=V3(),headOrigin=V3();
  const away=onWall?V3(1,0,.28).normalize():plant.g.position.clone().sub(foe.base).setY(0).normalize();
  const headPose=new T.Quaternion(),baseScale=plant.g.scale.x;
  let hitIndex=0,broken=false,landed=false,headScale=1;
  return t=>{
    idle(foe,t);
    const nextHit=impacts.find(at=>t<at&&t>=at-.27);
    const incoming=nextHit!==undefined;
    bolt.visible=incoming;
    if(incoming){
      const wind=phase(t,nextHit-.27,nextHit);
      foe.armR.rotation.x=-1.12*Math.sin(Math.PI*wind)-.26;
      bolt.position.lerpVectors(tipW(foe),plant.head.getWorldPosition(V3()),wind);
    }
    boltTail.push(incoming?[bolt.position.clone().add(V3(0,.10,0)),bolt.position]:null);
    if(!broken){
      plant.grow(1);
      const age=t-impacts[0];
      const recoil=age>=0?Math.sin(age*21)*Math.exp(-age*7):0;
      const sag=ease(phase(age,.14,.58));
      body.rotation.set(-.29*recoil-.10*sag,0,(onWall?-.45:0)-.32*recoil-.13*sag);
      plant.pose(t,onWall?2.22:Math.PI+.55,0,onWall,false,recoil*.52);
      plant.tipG.material.opacity=1-sag*.63;
      plant.wings.forEach(({w,s})=>{w.rotation.z+=s*.46*sag;});
    }
    if(hitIndex<impacts.length&&t>=impacts[hitIndex]){
      hitOrigin.copy(plant.head.getWorldPosition(V3()));
      broken=hitIndex===1;
      hitIndex++;
      sparks(hitOrigin,broken?23:9,broken?4.25:2.6,'#f1ffb0','#65a335',
        {dir:away.clone().multiplyScalar(broken?1.9:1),size:1.14,life:.78});
      leaves(hitOrigin,broken?13:4,broken?3.1:1.9,{dir:away,life:.73,size:1.14});
      const flash=glow(GLOWG,broken?1.5:.92);
      flash.position.copy(hitOrigin);
      BOOMS.push({m:flash,t:0,life:.19,s:broken?1.5:.92,spr:1});
      if(broken){
        if(!onWall){
          headOrigin.copy(hitOrigin);
          plant.head.getWorldQuaternion(headPose);
          S.attach(plant.head);
          headScale=plant.head.scale.x;
        }
        plant.tipG.visible=false;
        for(const {smile,mark} of deadEyes){
          smile.visible=false;
          mark.visible=true;
        }
        chips(hitOrigin,7,2.2);
      }
    }
    if(broken&&onWall){
      const age=t-brokenAt;
      const peel=ease(phase(age,0,.24)),fall=phase(age,.24,.96);
      const loose=Math.sin(Math.PI*phase(age,.08,.32));
      plant.wallRoots.scale.setScalar(1-.56*peel);
      plant.wallLeaves.scale.setScalar(1-.42*peel);
      plant.g.position.copy(anchor).addScaledVector(away,.11*peel+.96*fall);
      const rebound=.10*Math.sin(Math.PI*phase(age,.96,1.16));
      plant.g.position.y=lerp(anchor.y,O.y+.25,fall*fall)-.095*peel*(1-fall)+rebound;
      plant.g.rotation.z=-.24*peel-.90*fall;
      plant.g.rotation.y=-.48*fall;
      body.rotation.z=-.45-.22*loose;
      plant.wings.forEach(({w,s})=>{w.rotation.z=s*(.92+.64*loose-.22*fall);});
      plant.g.scale.setScalar(baseScale*Math.max(.001,1-ease(phase(age,1.02,1.52))));
      plant.g.visible=age<1.52;
      if(fall===1&&!landed){
        landed=true;
        const impact=plant.g.position.clone().addScaledVector(away,.48);
        leaves(impact,7,1.4,{life:.73,size:.90});
        sparks(impact,8,1.6,'#b6e568','#547d32',{life:.69,size:.86});
      }
    }else if(broken){
      const age=t-brokenAt,fall=phase(age,0,.64);
      plant.head.position.copy(headOrigin).addScaledVector(away,1.12*fall);
      plant.head.position.y=lerp(headOrigin.y,O.y+.25,fall*fall)+.34*Math.sin(Math.PI*fall);
      plant.head.quaternion.copy(headPose);
      plant.head.rotateZ(fall*2.25);
      plant.head.rotateX(fall*.9);
      plant.head.scale.setScalar(headScale*Math.max(.001,1-ease(phase(age,.66,1.27))));
      plant.head.visible=age<1.27;
      plant.g.scale.setScalar(baseScale*Math.max(.001,1-ease(phase(age,.14,.87))));
      plant.g.visible=age<.87;
      if(fall===1&&!landed){
        landed=true;
        leaves(plant.head.position,5,1.15,{life:.60,size:.84});
        sparks(plant.head.position,6,1.5,'#b6e568','#547d32',{life:.66,size:.83});
      }
    }
    label=t<impacts[0]?(onWall?'ป้อมยิง Nature · รากเกาะผนัง':'ป้อมยิง Nature · ฝักพร้อมยิง')
      :!broken?'โดนโจมตี · ลำต้นสะบัดและหัวฝักตก'
      :onWall?'ป้อมถูกทำลาย · รากหลุด ต้นหมุนตกพื้น':'ป้อมถูกทำลาย · ฝักหลุด รากหุบ และใบไม้กระจาย';
  };
}};
// 5) ดอกบัว — ต้นใหญ่ 100 HP วง 8 ม. ฮีล 5/วิ • บัฟยิงเร็ว 4 วิ หลังปลูก • สปอร์ทุก 5 วิ ลอยข้างไหล่ → แส้โดน = สปอร์บินไประเบิดพิษ
SKS.lotus={dur:6.0,still:2.6,setup(){const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0),foe=pup('1.3.2.0.0.2.1.0.0.0',4.8,2.4,Math.PI*.95,'enemy'),tu=Turret();tu.g.position.copy(W(2.2,-3.2,0));tu.grow(1);
    const ally=pup('2.0.1.1.0.1.2.0.0.0',5.8,-6.4,-.8,'ally');
    if(Q.has('top')){cam.p.copy(W(-6,-15,13));cam.l.copy(W(4,-4,0));}else{cam.p.copy(W(-3.4,-10.8,4.8));cam.l.copy(W(3.8,-4.3,2.0));}
    const L=Lotus(1,true),sd=Seed();L.g.position.copy(W(4,-4,0));const AU=LotusAura(8,true);AU.g.position.copy(W(4,-4,0));
    const sp=Spore(false),wh=Whip(),buff=ring(.5,.62,'#ffd23f',.8);
    const wave=new T.Group();add(wave);
    wave.position.copy(L.g.position).add(V3(0,.075,0));
    const waveMat=ADD('#9dffc1',{opacity:0});
    for(let i=0;i<5;i++){
      const petalArc=mesh(new T.RingGeometry(.963,1,24,1,i*Math.PI*2/5,1.02),waveMat,wave);
      petalArc.rotation.x=-Math.PI/2;
      petalArc.castShadow=false;
    }
    const healRims=[ring(.52,.58,'#8dffa9',0),ring(.45,.49,'#d2ffb2',0)];
    const allyDistance=ally.g.position.distanceTo(L.g.position);
    const gift=glow(GLOWT,.82),giftTrail=TrailRibbon(7,'#ffdc69');
    const giftStart=1.47,giftEnd=1.92,buffEnd=5.92;
    let lastWave=-1,healedAt=-10,blossomed=false,buffArrived=false;
    return (t,dt)=>{idle(me,t);idle(foe,t);idle(ally,t);const th=phase(t,.05,.35);me.armR.rotation.set(-.4-1.6*Math.sin(Math.PI*th),0,0);
      sd.fly(tipW(me),L.g.position,phase(t,.3,.85));if(t>=.85&&!this.s){this.s=1;sprout(L.g.position,1.6);shock(L.g.position,'#b4ff70',6,.6);}
      const gr=phase(t,.85,1.5),op=phase(t,1.3,2.1);L.set(outQ(gr),ease(op),t);const ak=ease(phase(t,1.2,1.8));AU.set(ak,t);
      const crown=L.core.getWorldPosition(V3());
      if(t>=1.86&&!blossomed){
        blossomed=true;
        sparks(crown,17,2.1,'#fff1b1','#f596ba',{life:1.1,size:1.15,g:-.5});
        leaves(crown,7,1.6,{col:'#f6a7c7',life:.85,size:1.35});
      }
      const waveIndex=Math.floor((t-1.80)/1.37);
      const waveAge=t-(1.80+waveIndex*1.37),front=phase(waveAge,0,.91);
      const radius=.28+7.72*front;
      wave.visible=waveIndex>=0&&front<1;
      wave.scale.setScalar(radius);
      wave.rotation.y=waveIndex*.32+t*.18;
      waveMat.opacity=.86*ease(phase(front,0,.12))*(1-ease(phase(front,.66,1)));
      if(wave.visible&&radius>=allyDistance&&waveIndex!==lastWave){
        lastWave=waveIndex;healedAt=t;
        sparks(ally.g.position.clone().add(V3(0,.20,0)),13,1.1,'#e1ffc1','#53d67b',{dir:V3(0,1.4,0),g:-.85,life:1.15,size:1.25});
      }
      healRims.forEach((rim,i)=>{
        const age=t-healedAt-i*.09,k=phase(age,0,.65);
        rim.visible=age>=0&&k<1;
        rim.position.copy(ally.g.position).add(V3(0,.08+1.47*ease(k),0));
        rim.scale.setScalar(1+.18*Math.sin(k*Math.PI));
        rim.material.opacity=.78*(1-ease(k));
      });
      if(t>1.6&&Math.round(t*FPS)%2===0){
        const a=rnd(0,Math.PI*2),r=Math.sqrt(rnd(0,1))*7.4;
        const p=L.g.position.clone().add(V3(Math.cos(a)*r,.1,Math.sin(a)*r));
        sparks(p,2,.55,'#d9ffba','#63dd83',{g:-.7,life:1.45,size:.92});
      }
      // เกสรทองลอยจากแกนดอกไปถึงป้อมก่อนเปลี่ยนร่าง
      const bf=t>=giftEnd&&t<buffEnd;
      const morph=outQ(phase(t,giftEnd,giftEnd+.28))*(1-ease(phase(t,buffEnd-.24,buffEnd)));
      const md=Math.max(0,t-giftEnd),jolt=Math.sin(md*25)*Math.exp(-md*7);
      tu.pose(t,Math.atan2(-2,2.6),0,false,morph,jolt);
      tu.tipG.material.color.set(bf?'#ffd23f':'#ffffff');
      const bud=tu.head.getWorldPosition(V3()).add(V3(0,.12,0));
      const flyGift=phase(t,giftStart,giftEnd);
      gift.visible=flyGift>0&&flyGift<1;
      if(gift.visible){
        gift.position.lerpVectors(crown,bud,flyGift);
        gift.position.y+=.54*Math.sin(flyGift*Math.PI);
        giftTrail.push([gift.position.clone().add(V3(0,.20,0)),gift.position]);
      }else giftTrail.push(null);
      if(bf&&!buffArrived){
        buffArrived=true;
        sparks(bud,17,2.35,'#fff6b3','#e9ad35',{dir:V3(0,.82,0),life:.95,size:1.42});
      }
      buff.visible=bf;
      if(bf){
        buff.position.copy(tu.g.position).add(V3(0,.055,0));
        buff.scale.setScalar(1+.10*Math.sin(t*6));
        buff.material.opacity=.36+.40*Math.exp(-md*2.7);
      }
      // สปอร์: เกิดที่แกนดอกบัว → บินมาลอยข้างไหล่
      const born=2.4,sh=me.g.localToWorld(V3(-.45,1.75,-.1)),core=L.bloom.getWorldPosition(V3()).add(V3(0,.3,0));
      if(t>born&&t<4.3){sp.visible=true;const k=ease(phase(t,born,3.3));sp.position.lerpVectors(core,sh,k);sp.position.y+=Math.sin(k*Math.PI)*1.6+Math.sin(t*4)*.05*(k>=1);if(Math.random()<.6)sparks(sp.position,1,.4,'#f6ffb0','#7ee05a',{life:.8});}
      // แส้โดน → สปอร์ 1 ลูกบินไประเบิดพิษ (ไม่มีดาเมจแรก)
      const sw={t0:3.55,dir:-1};const r=wh.upd(me,t,sw);if(r&&!this.hit&&(r.tip.distanceTo(chestW(foe))<1.4||r.pts[18].distanceTo(chestW(foe))<1.1)){this.hit=t;sparks(chestW(foe),18,4,'#f6ffb0','#62d04a');}
      if(this.hit&&foe)hitFlinch(foe,Math.max(0,1-(t-this.hit)/.3));
      if(this.hit&&t>this.hit&&t<this.hit+.45){const k=ease((t-this.hit)/.45);sp.visible=true;sp.position.lerpVectors(sh,chestW(foe),k);sp.position.y+=Math.sin(k*Math.PI)*.8;}
      if(this.hit&&t>=this.hit+.45&&!this.boom){this.boom=1;sp.visible=false;poisonBurst(chestW(foe),false);}
      if(this.boom&&Math.random()<.5)puff(chestW(foe).add(V3(rnd(-.3,.3),rnd(-.5,.3),0)),1,'#86e05a',{c2:'#3a6a2a',sp:.3,size:.5});
      label=t<1.42?'ดอกบัว Nature · เมล็ดงอกและกลีบเริ่มบาน':t<2.6?'ดอกบัว Nature · คลื่นเขียวฮีลเพื่อน · เกสรทองบัฟป้อม':t<3.5?'ดอกบัว Nature · สปอร์ลอยมาพักข้างไหล่':'ดอกบัว Nature · แส้โดนแล้วส่งสปอร์พิษ';};}};
// Natural expiration of the healing lotus and its aura.
SKS.lotus_expire={dur:4.1,still:1.70,setup(){
  const lotus=Lotus(1,true),aura=LotusAura(8,true);
  const anchor=W(18,0,0);
  lotus.g.position.copy(anchor);
  aura.g.position.copy(anchor);
  const dissolve={value:0},cutoff={value:anchor.y+5.85},materials=new Map();
  for(const part of aura.g.children){
    const material=part.material;
    material.customProgramCacheKey=()=>'nature-lotus-aura-expire';
    material.onBeforeCompile=shader=>{
      shader.uniforms.uLotusDissolve=dissolve;
      shader.vertexShader='varying vec2 vLotusAuraPos;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\nvLotusAuraPos=(modelMatrix*vec4(position,1.0)).xz;');
      shader.fragmentShader='uniform float uLotusDissolve;\nvarying vec2 vLotusAuraPos;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`$&
        vec2 p=vLotusAuraPos;
        float patches=sin(1.52*p.x+1.16*p.y)*cos(1.38*p.y-0.76*p.x);
        float specks=cos(6.3*p.x-4.8*p.y)*sin(5.7*p.y+4.1*p.x);
        float threshold=0.50+0.42*patches+0.08*specks;
        float remaining=threshold-uLotusDissolve;
        float coverage=smoothstep(-0.025,0.040,remaining);
        diffuseColor.a*=mix(1.0,coverage,smoothstep(0.0,0.12,uLotusDissolve));
      `);
    };
  }
  lotus.g.traverse(obj=>{
    if(!obj.isMesh)return;
    const original=obj.material;
    if(!materials.has(original)){
      const material=original.clone(),key=original.customProgramCacheKey();
      material.customProgramCacheKey=()=>key+':nature-lotus-expire';
      material.onBeforeCompile=(shader,renderer)=>{
        original.onBeforeCompile.call(original,shader,renderer);
        shader.uniforms.uLotusCutoff=cutoff;
        shader.vertexShader='varying vec3 vLotusExpirePos;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
          '#include <begin_vertex>\nvLotusExpirePos=(modelMatrix*vec4(position,1.0)).xyz;');
        shader.fragmentShader='uniform float uLotusCutoff;\nvarying vec3 vLotusExpirePos;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`$&
          vec3 p=vLotusExpirePos;
          float mottled=0.16*sin(p.y*17.0+p.z*8.0)*sin(p.x*19.0+p.y*8.0)
            +0.14*cos(p.z*13.0-p.x*9.0+p.y*8.5);
          float left=uLotusCutoff-p.y+mottled;
          if(left<0.0)discard;
          float edge=1.0-smoothstep(0.018,0.12,left);
        `);
        shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=edge*vec3(0.69,0.35,0.13);');
      };
      materials.set(original,material);
    }
    obj.material=materials.get(original);
    obj.castShadow=false;
  });
  const petalMaterials=new Set(lotus.petals.map(({piv})=>piv.children[0].material));
  cam.p.copy(anchor.clone().add(V3(11.6,12.5,-10.9)));
  cam.l.copy(anchor.clone().add(V3(0,1.05,0)));
  let petalBurst=false;
  return t=>{
    const fade=phase(t,.74,2.72);
    const close=ease(phase(t,.74,1.40));
    dissolve.value=fade;
    aura.set(1,t);
    aura.g.visible=fade<1;
    aura.g.children[0].material.opacity=1-ease(phase(fade,.86,1));
    lotus.set(1,1-close,t);
    lotus.petals.forEach(({piv,r,open},i)=>{
      const fold=ease(phase(t,.74+(2-r)*.06,1.28+(2-r)*.08));
      const outward=(.20-.064*r)*fold,yaw=piv.rotation.y;
      piv.position.set(Math.sin(yaw)*outward,.046*r*fold,Math.cos(yaw)*outward);
      piv.rotation.x=lerp(open,.32-.055*r,fold)+Math.sin(t*2.5+i)*.04*(1-fold);
    });
    for(const material of petalMaterials)material.emissiveIntensity=.35*(1-.88*close);
    lotus.cg.material.opacity=1-ease(phase(fade,0,.35));
    cutoff.value=anchor.y+lerp(5.85,-.30,fade);
    lotus.g.visible=fade<1;
    if(t>=.91&&!petalBurst){
      petalBurst=true;
      const crown=lotus.core.getWorldPosition(V3());
      leaves(crown,14,2.28,{col:'#ef9ac5',dir:V3(0,.7,0),life:1.07,size:1.55});
      sparks(crown,18,1.63,'#ffddaa','#ee88ba',{dir:V3(0,.83,0),life:1.23,g:-.45,size:1.30});
    }
    if(fade>0&&fade<1&&Math.round(t*FPS)%2===0){
      const y=Math.max(.1,cutoff.value-anchor.y),radius=y<.45?1.50:.23;
      const a=rnd(0,Math.PI*2);
      const p=anchor.clone().add(V3(Math.cos(a)*radius,y,Math.sin(a)*radius));
      sparks(p,4,.88,'#eaffb2','#6bbd51',{dir:V3(0,.74,0),life:1.18,g:-.45,size:1.22});
    }
    label=fade===0?'ดอกบัว Nature · วงฮีลกำลังทำงาน':fade<1?'หมดเวลา · ขอบวงและดอกบัวสลายพร้อมกัน':'วงฮีลสิ้นสุด';
  };
}};
// Lotus spore close-up: one spore follows the whip hit while the other stays.
SKS.spore={dur:4.2,still:2.75,setup(){
  const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0);
  const foe=pup('1.3.2.0.0.2.1.0.0.0',7,-3.6,Math.PI,'enemy');
  const lotus=Lotus(1,true);
  lotus.g.position.copy(W(.45,-4.5,0));
  const waiting=Spore(false),active=Spore(false);
  const arrival=TrailRibbon(9,'#ffdf86'),shot=TrailRibbon(8,'#bdff69');
  const wh=Whip(14,true),swing={t0:2,dir:-1};
  const flightFrom=V3();
  let hitAt=-1,burstAt=-1;
  cam.p.copy(W(-4.7,7.7,5.0));
  cam.l.copy(W(2.8,-1.70,2.15));
  return t=>{
    idle(me,t);idle(foe,t);lotus.set(1,1,t);
    const slot=side=>me.g.localToWorld(V3(side*.70+.06*Math.cos(t*4+side),
      1.68+.085*Math.sin(t*4+side),-.24+.08*Math.sin(t*3+side)));
    waiting.visible=true;
    waiting.position.copy(slot(1));
    waiting.rotation.y=t*1.7;
    const gather=phase(t,.22,1.38);
    const crown=lotus.core.getWorldPosition(V3()).add(V3(0,.24,0));
    const movingIn=gather>0&&gather<1;
    if(hitAt<0){
      active.visible=gather>0;
      active.position.lerpVectors(crown,slot(-1),ease(gather));
      active.position.addScaledVector(V3(.70,.60,.52),Math.sin(Math.PI*gather));
      active.scale.setScalar(1.16*(.55+.45*outQ(gather)));
    }
    arrival.push(movingIn?[active.position.clone().add(V3(0,.16,0)),active.position]:null,.77);
    active.rotation.set(t*2.7,t*4.2,Math.sin(t*4)*.20);
    if(movingIn&&Math.round(t*FPS)%2===0)sparks(active.position,1,.75,'#ffe591','#9fdf5a',{life:.83,g:-.2});
    if(t>=1.38&&t-1/FPS<1.38)sparks(active.position,5,1.25,'#eaffae','#6ae654',{life:.8,size:1.14});
    const r=wh.upd(me,t,swing);
    if(r&&r.st<.46&&hitAt<0&&r.pts.some(p=>p.distanceTo(chestW(foe))<1.3)){
      hitAt=t;
      flightFrom.copy(active.position);
      sparks(chestW(foe),10,3.2,'#fff3b0','#81d543',{life:.67});
    }
    if(hitAt>=0&&burstAt<0){
      const k=phase(t,hitAt,hitAt+.42),f=k*k*(2-k);
      active.position.lerpVectors(flightFrom,chestW(foe),f);
      active.position.addScaledVector(V3(.44,.77,-.16),Math.sin(Math.PI*f));
      if(k===1){
        burstAt=t;
        active.visible=false;
        poisonBurst(chestW(foe),false);
      }else sparks(active.position,1,1.2,'#d6ff89','#65b837',{life:.76,size:1.2});
    }
    const flying=hitAt>=0&&burstAt<0;
    shot.push(flying?[active.position.clone().add(V3(0,.19,0)),active.position.clone().add(V3(0,-.03,0))]:null);
    if(hitAt>=0)hitFlinch(foe,1-phase(t,hitAt,hitAt+.28));
    if(burstAt>=0&&t-burstAt<1&&Math.round(t*FPS)%5===0){
      puff(chestW(foe),1,'#7fba46',{c2:'#416a2d',sp:.42,size:.72,spread:.52,life:.75});
    }
    if(t>=4&&burstAt<0)throw new Error('Spore study: whip did not hit target');
    label=t<1.38?'ดอกบัวปล่อยสปอร์':hitAt<0?'สปอร์ลอยรอข้างไหล่':flying?'แส้โดน ส่งสปอร์ออกหนึ่งลูก':'สปอร์แตกเป็นละอองพิษ อีกลูกยังอยู่ข้างไหล่';
  };
}};
// Review the final seconds of one unused spore while the newer one remains active.
SKS.spore_expire={dur:2.85,still:1.45,setup(){
  const player=pup('3.1.0.2.1.0.0.1.0.0',0,0,0);
  const older=Spore(false),newer=Spore(false);
  const glowShell=older.children.find(child=>child.isSprite);
  const fadeStart=.95,fadeEnd=1.74;
  let nextPollen=fadeStart;
  cam.p.copy(W(4.65,1.4,2.85));
  cam.l.copy(W(0,0,1.60));
  return t=>{
    idle(player,t);
    const place=(spore,side)=>{
      spore.position.copy(player.g.localToWorld(V3(side*.79+.065*Math.cos(t*4+side),
        1.72+.085*Math.sin(t*4+side),-.16+.08*Math.sin(t*3+side))));
      spore.rotation.set(t*1.15,t*2.35,side*.16);
    };
    place(older,-1);place(newer,1);
    const fade=ease(phase(t,fadeStart,fadeEnd));
    newer.visible=true;newer.scale.setScalar(1.28);
    older.visible=t<fadeEnd;
    older.scale.setScalar(Math.max(.01,1.28*(1-fade)));
    glowShell.material.opacity=1-fade;
    if(t>=nextPollen&&t<fadeEnd){
      sparks(older.position,4,.46,'#ffe7a0','#8ed866',{
        dir:V3(-.12,.48,0),life:1.85,g:-.23,size:.95
      });
      nextPollen+=.13;
    }
    label=t<fadeStart?'สปอร์ Nature · ลอยรอข้างไหล่':t<fadeEnd?
      'สปอร์หมดอายุ · แกนจางและปล่อยเกสร':'สปอร์อีกลูกยังลอยอยู่';
  };
}};
// 6) ย้ายพืช — มุดลงที่เดิม แล้วโผล่ตำแหน่งใหม่พร้อมคลื่นบัฟจากผู้เล่น
SKS.move={dur:3.95,still:2.49,setup(){const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0);me.g.position.copy(W(0,0,0));
    cam.p.copy(W(-8.2,-8.0,11.4));cam.l.copy(W(3.8,3.1,.9));
    const A=Turret(),B=Turret(),Lo=Lotus(.8,true);const old=[W(9,4.5,0),W(7,8.5,0),W(11,7,0)],neu=[W(1.6,-2.4,0),W(1.6,2.4,0),W(-2.8,0,0)];
    const plants=[{p:A,o:old[0],n:neu[0],k:'t'},{p:B,o:old[1],n:neu[1],k:'t'},{p:Lo,o:old[2],n:neu[2],k:'l'}];
    plants.forEach(q=>{q.p.g.position.copy(q.o);if(q.k==='t')q.p.grow(1);else q.p.set(1,1,0);});
    const sapTip=new T.Color('#d3ff65'),sapGreen=new T.Color('#29cc3a');
    const rootHalo=glowTex('rgba(174,255,75,.92)','rgba(42,255,53,.47)');
    const tracks=plants.map((q,i)=>{
      const a=q.o.clone().add(V3(0,.12,0)),b=q.n.clone().add(V3(0,.12,0));
      const turn=a.clone().lerp(b,.53).add(V3([2.35,-1.0,-1.9][i],0,[.80,-.75,.4][i]));
      const soilLight=new T.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false});
      const curve=new T.QuadraticBezierCurve3(a,turn,b),stroke=Tube(24,6,soilLight);
      const forks=[Tube(14,5,soilLight),Tube(14,5,soilLight)];
      for(const strand of [stroke,...forks])strand.castShadow=false;
      return {curve,stroke,forks,tipGlow:glow(rootHalo,1.05),bloomGlow:glow(rootHalo,1.45)};
    });
    const bars=plants.map(()=>{const g=new T.Group();add(g);mesh(new T.PlaneGeometry(1,.10),new T.MeshBasicMaterial({color:'#223629',depthTest:false}),g);const fg=mesh(new T.PlaneGeometry(1,.10),new T.MeshBasicMaterial({color:'#91e666',depthTest:false}),g);fg.position.z=.001;g.fg=fg;return g;});
    const auras=plants.map(()=>ring(.55,.7,'#ffd23f',.8));
    return (t,dt)=>{idle(me,t);const cast=phase(t,0,.3);me.armR.rotation.set(-1.3*Math.sin(Math.PI*cast),0,0);me.armL.rotation.set(-1.3*Math.sin(Math.PI*cast),0,0);
      if(t>=.28&&!this.c){
        this.c=1;
        sparks(tipW(me),12,1.8,'#eaffbe','#77db5c',{life:.72});
        leaves(me.g.position.clone().add(V3(0,.2,0)),6,1.3,{life:.75,size:1.18});
      }
      plants.forEach((q,i)=>{
        const arrival=1.68+i*.085;
        const dive=phase(t,.30+i*.07,.71+i*.075);
        const run=phase(t,.66+i*.075,arrival);
        const pop=phase(t,arrival,arrival+.44);
        const growth=dive<1?1-ease(dive):outQ(pop);
        if(q.k==='t'){
          q.p.grow(growth);
          q.p.pose(t,0,0,false,ease(phase(pop,.50,1)));
        }else{
          q.p.set(growth,dive<1?1-ease(dive):ease(pop),t);
          q.p.g.visible=growth>0;
        }
        if(dive<1)q.p.g.position.copy(q.o).add(V3(0,-.67*ease(dive),0));
        else if(pop>0)q.p.g.position.copy(q.n).add(V3(0,-.19*(1-ease(pop)),0));
        if(dive>0&&!q.retracted){
          q.retracted=true;
          leaves(q.o.clone().add(V3(0,.11,0)),9,1.5,{life:.70,size:1.22});
          sparks(q.o.clone().add(V3(0,.12,0)),13,1.25,'#baff72','#42dc3c',{life:.85,size:1.22});
        }
        const {curve,stroke,forks,tipGlow,bloomGlow}=tracks[i];
        stroke.visible=tipGlow.visible=run>0&&run<1;
        for(const fork of forks)fork.visible=stroke.visible;
        if(stroke.visible){
          const head=ease(run),span=.56*Math.sin(Math.PI*run)**.54;
          const pts=Array.from({length:24},(_,j)=>curve.getPoint(Math.max(0,head-span*(1-j/23))));
          const glowAmount=ease(phase(run,0,.1))*(1-ease(phase(run,.88,1)));
          stroke.material.opacity=.96*glowAmount;
          stroke.set(pts,u=>.205*Math.sin(Math.PI*u)**.75,
            (u,c)=>c.copy(sapGreen).lerp(sapTip,u*u));
          forks.forEach((fork,side)=>{
            const points=Array.from({length:14},(_,j)=>{
              const u=j/13,k=Math.max(0,head-span*(.79-side*.17-.52*u));
              const tangent=curve.getTangent(k),across=V3(tangent.z,0,-tangent.x);
              return curve.getPoint(k).addScaledVector(across,(side===0?-1:1)*.71*u*u);
            });
            fork.set(points,u=>.081*Math.sin(Math.PI*u)**.75,
              (u,c)=>c.copy(sapGreen).lerp(sapTip,u*.60));
          });
          tipGlow.position.copy(curve.getPoint(head)).add(V3(0,.16,0));
          tipGlow.scale.setScalar(1.04+.20*Math.sin(t*14+i));
          tipGlow.material.opacity=.75*glowAmount;
          if(Math.round(t*FPS)%3===i){
            const at=curve.getPoint(Math.max(0,head-span*.20)).add(V3(0,.12,0));
            sparks(at,4,1.35,'#afff6d','#36e442',{g:-.9,life:.86,size:1.28});
            leaves(at,2,1.30,{life:.68,size:1.05,col:'#71d946'});
          }
        }
        const birthAge=t-arrival;
        bloomGlow.visible=birthAge>=0&&birthAge<.64;
        if(bloomGlow.visible){
          const bloomK=phase(birthAge,0,.64);
          bloomGlow.position.copy(q.n).add(V3(0,.18+.45*outQ(bloomK),0));
          bloomGlow.scale.setScalar(1.55+.90*outQ(bloomK));
          bloomGlow.material.opacity=.82*(1-ease(bloomK));
        }
        if(pop>0&&!q.popped){
          q.popped=true;
          sparks(q.n.clone().add(V3(0,.16,0)),29,2.4,'#c1ff67','#39de3c',{dir:V3(0,1.2,0),life:1.1,size:1.42});
          leaves(q.n.clone().add(V3(0,.1,0)),16,2.20,{life:.92,size:1.31});
          shock(q.n,'#89ff4b',3.25,.52);
        }
        const hb=bars[i];
        hb.visible=dive<.20||(pop>.56&&t<3.00);
        hb.position.copy(q.p.g.position).add(V3(0,q.k==='t'?1.82:4.0,0));hb.lookAt(cam.p);
        const hp=.35+.65*ease(phase(pop,.46,1));
        hb.fg.scale.x=hp;hb.fg.position.x=-(1-hp)/2;
        const au=auras[i];
        au.visible=q.k==='t'&&pop>.60&&t<3.85;
        au.position.copy(q.n).add(V3(0,.055,0));au.scale.setScalar(1+.11*Math.sin(t*9+i));
        au.material.opacity=.61*(1-ease(phase(t,3.32,3.85)));
        if(au.visible&&Math.round(t*FPS)%6===i)sparks(q.p.head.getWorldPosition(V3()),3,1.1,'#fff2a0','#e9b439',{g:-.7,life:1.03});
      });
      label=t<.77?'ย้ายพืช Nature · พืชมุดที่ตำแหน่งเดิม':t<1.68?'ย้ายพืช Nature · แสงรากวิ่งเลียบพื้น':'ย้ายพืช Nature · งอกรอบผู้เล่น · ฟื้นเลือดและบัฟป้อม';};}};
// 7) ลูกบอลไม้ — ขว้างลงพื้น → สั่น → แทงหนาม → ดึงเป้า → หดแตก
const ballWallCast=SK==='ball'&&Q.has('wallcast');
const ballThrowV3=SK==='ball'&&Q.has('throwv3');
const ballThrowOffset=ballThrowV3?.20:0;
SKS.ball={dur:(ballWallCast?3.2:4.4)+ballThrowOffset,still:ballThrowV3?.45:ballWallCast?.75:2.05,setup(){
    const me=pup('3.1.0.2.1.0.0.1.0.0',ballWallCast?2.7:0,0,0);
    const C=ballWallCast?W(8.51,0,1.10):W(9,0,.40),floor=C.clone().setY(O.y+.055);
    const foes=ballWallCast?[
      pup('1.3.2.0.0.2.1.0.0.0',11.2,-.62,Math.PI,'enemy'),
      pup('2.0.1.1.0.1.2.0.0.0',7.45,-3.6,-Math.PI*.6,'enemy')
    ]:[pup('1.3.2.0.0.2.1.0.0.0',12.5,-2.2,Math.PI*.8,'enemy'),pup('2.0.1.1.0.1.2.0.0.0',8.2,3.6,-Math.PI*.6,'enemy'),pup('0.2.3.1.0.3.1.0.0.0',6.2,-3.1,Math.PI*.3,'enemy'),pup('1.1.1.0.0.0.0.0.0.0',13,4.2,Math.PI,'enemy')];
    const wall=mesh(new T.BoxGeometry(ballWallCast?4.2:2.4,2.6,.5),M.stone);
    wall.position.copy(ballWallCast?W(9.25,0,1.3):W(11.2,2.6,1.3));wall.rotation.y=ballWallCast?0:.6;
    cam.p.copy(ballWallCast?W(4.6,-10.5,7.1):W(.5,-5.7,7.5));
    cam.l.copy(ballWallCast?W(7.3,-1.25,1.0):W(7.7,.4,.75));
    wall.updateMatrixWorld(true);
    const blockPoints=foes.map(foe=>{
      const at=chestW(foe),delta=at.clone().sub(C),distance=delta.length();
      const hit=new T.Raycaster(C,delta.normalize(),0,distance).intersectObject(wall,false)[0];
      return hit?hit.point.clone().addScaledVector(delta,-.035):null;
    });
    const ball=new T.Group();add(ball);const bg=new T.IcosahedronGeometry(.48,2);{const p=bg.attributes.position;for(let i=0;i<p.count;i++){const v=V3(p.getX(i),p.getY(i),p.getZ(i)),n=v.clone().normalize();const k=1+.12*Math.sin(n.x*9+n.y*5)+.06*Math.sin(n.z*13);v.copy(n).multiplyScalar(.48*k);p.setXYZ(i,v.x,v.y,v.z);}bg.computeVertexNormals();}
    const colors=[];for(let i=0;i<bg.attributes.position.count;i++){const x=bg.attributes.position.getX(i),y=bg.attributes.position.getY(i),z=bg.attributes.position.getZ(i),v=.5+.5*Math.sin(x*17+y*9+Math.sin(z*12));const c=new T.Color('#402514').lerp(new T.Color('#a36c3f'),v);colors.push(c.r,c.g,c.b);}bg.setAttribute('color',new T.Float32BufferAttribute(colors,3));mesh(bg,STD('#ffffff',{vertexColors:true}),ball);
    const seams=[];
    for(let i=0;i<3;i++){
      const ridge=mesh(new T.TorusGeometry(.50,.025,5,30),M.wood,ball);
      ridge.rotation.set(rnd(0,3),rnd(0,3),0);
      const seam=mesh(new T.TorusGeometry(.52,.009,5,36,Math.PI*(1.2+i*.17)),ADD('#b6f45c',{opacity:0}),ball);
      seam.rotation.copy(ridge.rotation);seam.castShadow=false;seams.push(seam);
    }
    const flash=glow(GLOWG,1.25);
    const spikes=foes.map(()=>Tube(18,5,M.bark)),sth=Thorns(10,1.1);sth.material=M.wood;
    const bark=new T.Color('#331d11'),woodTip=new T.Color('#856144');
    const travel=TrailRibbon(5,'#a4b763');
    const releasePoint=V3(),launchAt=ballThrowV3?.45:.30,landAt=.65+ballThrowOffset;
    const wideEye=ballWallCast?W(4.6,8.8,4.2):W(4.2,9.3,5.2);
    const wideLook=ballWallCast?W(7.3,-1.25,1.0):W(6.2,0,1.0);
    const throwPoses=[
      // Time, throwing arm pitch/yaw/roll, torso pitch/yaw, free arm pitch.
      [0,-.18,0,.12,0,0,-.12],
      [.24,-.48,-.94,-.38,-.045,-.30,-.34],
      [.45,-1.42,.06,-.12,.09,.05,-.25],
      [.60,-1.22,.43,.18,.16,.24,-.32],
      [.97,-.18,0,.12,0,0,-.12]
    ];
    if(ballThrowV3){cam.p.copy(wideEye);cam.l.copy(wideLook);}
    let released=false;
    return (t,dt)=>{idle(me,t);foes.forEach(f=>idle(f,t));
      if(ballThrowV3){
        const index=throwPoses.findIndex(pose=>pose[0]>=t);
        const next=index<0?throwPoses.length-1:Math.max(1,index);
        const from=throwPoses[next-1],to=throwPoses[next];
        const blend=ease(phase(t,from[0],to[0]));
        const [,armPitch,armYaw,armRoll,torsoPitch,torsoYaw,offHand]=from.map((v,i)=>lerp(v,to[i],blend));
        me.armR.rotation.set(armPitch,armYaw,armRoll);
        const weight=ease(phase(t,.24,.50))*(1-ease(phase(t,.64,.97)));
        me.armL.rotation.set(offHand,-.20*weight,-.12-.13*weight);
        me.b.rotation.set(torsoPitch,torsoYaw,0);
        me.b.position.z=.14*weight;
        me.legs[0].rotation.x=-.21*weight;
        me.legs[1].rotation.x=.15*weight;
      }else{
        const th=phase(t,.05,.35);
        me.armR.rotation.set(-.4-1.7*Math.sin(Math.PI*th),0,0);
      }
      const fl=phase(t,launchAt,landAt),attackTime=t-ballThrowOffset+(ballWallCast?1.25:0);
      const st=tipW(me);
      if(ballThrowV3&&!released){
        releasePoint.copy(st);
        released=t>=launchAt;
        if(released)sparks(releasePoint,6,1.1,'#ecffa8','#8acf49',{life:.64,size:1.05});
      }
      ball.visible=t>=(ballThrowV3?.22:.30)&&attackTime<3.2;
      if(t<landAt){
        ball.position.lerpVectors(ballThrowV3?releasePoint:st,C,ballThrowV3?fl:outQ(fl));
        ball.position.y+=Math.sin(fl*Math.PI)*(ballThrowV3?.24:ballWallCast?.46:.8);
        ball.rotation.set(ballThrowV3?t*3.1+fl*7:t*12,ballThrowV3?t*2.2+fl*4:t*7,0);
      }
      travel.push(fl>0&&fl<1?[ball.position.clone().add(V3(0,.20,0)),ball.position]:null);
      if(t>=landAt&&!this.land){
        this.land=1;
        if(ballWallCast){
          const contact=C.clone().add(V3(0,0,.48));
          sparks(contact,16,2.5,'#fff0be','#b6a383',{dir:V3(0,.4,-1.8),life:.81});
          puff(contact,6,'#beb5a4',{sp:1.5,size:.76,life:.55});
        }else{dirt(floor,19,3.3,{size:1.05,spread:1.15});chips(floor,9,2.9);leaves(floor,9,2.4,{life:.70});shock(floor,'#a2cd69',2.5,.38);}
      }
      const shake=!ballWallCast&&t>landAt&&attackTime<1.90?(t-landAt)/1.25:0;
      if(t>=landAt&&attackTime<3.2){ball.position.copy(C).add(V3(rnd(-1,1),0,rnd(-1,1)).multiplyScalar(.18*shake+.015));}
      const fire=phase(attackTime,1.90,2.0),pull=phase(attackTime,2.4,2.57),back=phase(attackTime,2.57,2.80),sq=phase(attackTime,2.95,3.2);
      const gathered=ballThrowV3?lerp(.26,1,ease(phase(fl,.08,.86))):1;
      ball.scale.setScalar(gathered*(attackTime<2.95?1+.1*Math.sin(t*40)*shake:1-.45*ease(sq)));
      seams.forEach((seam,i)=>{seam.material.opacity=(.24+shake*.42)*ease(phase(attackTime,.90+i*.07,1.8))*(1-ease(phase(attackTime,1.91,2.14)))+.79*sq;});
      const strikeAge=attackTime-1.90;
      flash.visible=strikeAge>=0&&strikeAge<.21;
      if(flash.visible){
        flash.position.copy(C);flash.scale.setScalar(1.25+strikeAge*3);
        flash.material.opacity=.71*(1-ease(strikeAge/.21));
      }
      if(strikeAge>=0&&!this.strike){
        this.strike=true;
        sparks(C,19,4,'#eaff93','#6ab52e',{life:.62,size:1.25});
        chips(ballWallCast?C:floor,8,2.9);
      }
      if(attackTime>=3.2&&!this.br){
        this.br=1;
        chips(C,28,5.4);
        leaves(C,23,4.8,{dir:V3(0,2.1,0),life:.83,size:1.22});
        puff(C,7,'#a99470',{sp:1.4,size:.80});
        if(!ballWallCast)shock(floor,'#bde578',4.7,.46);
        sparks(C,29,4.8,'#eaffac','#66c13d',{dir:V3(0,1.8,0),life:.93,size:1.24});
      }
      const tip=[];foes.forEach((f,i)=>{const sp=spikes[i],target=chestW(f),endP=blockPoints[i],blocked=!!endP;
        let reach=fire;
        if(blocked&&fire>=1){reach=1-phase(attackTime,2.0,2.18);if(!this.wb){this.wb=1;sparks(endP,14,3,'#ffffff','#a0a0a0');dirt(endP,6,2);}}
        const pk=blocked?0:pull;if(!blocked){f.g.position.copy(f.base).lerp(V3(C.x,f.base.y,C.z).add(V3().subVectors(f.base,C).setY(0).normalize().multiplyScalar(1.1)),ease(pk));if(pk>0&&pk<1){f.b.rotation.x=.4;f.legs[0].rotation.x=.6;}
          if(fire>=1&&!f.hit){f.hit=1;sparks(target,16,3.5,'#e8ffb0','#7ed957');}if(f.hit&&attackTime>2.75&&Math.random()<.35)puff(chestW(f).add(V3(rnd(-.3,.3),rnd(-.6,.2),0)),1,'#86e05a',{c2:'#3a6a2a',sp:.3,size:.45});}
        const r=blocked?reach:(attackTime<2.57?fire:1-back),now2=chestW(f);
        const dir=now2.clone().sub(ball.position).normalize();
        const e2=blocked?endP:now2.clone().addScaledVector(dir,.18);
        sp.visible=r>.01;
        if(sp.visible){
          const pts=Array.from({length:18},(_,k)=>V3().lerpVectors(ball.position,e2,k/17*r));
          sp.set(pts,u=>.102*(1-u)**1.14+.004,(u,c)=>c.copy(bark).lerp(woodTip,u*.46));
          tip.push({p:pts[17],d:e2.clone().sub(ball.position).normalize(),s:.72});
        }});
      sth.put(tip);
      label=ballThrowV3&&t<launchAt?'ลูกบอลไม้ · สะบัดเมล็ดจากข้างตัว':
        ballWallCast?(t<landAt?'ลูกบอลไม้ · โยนเข้าหาผนัง':t<landAt+.30?'ชนผนัง · ปล่อยหนามทันที':'กำแพงบังหนาม · เป้าหลังผนังไม่ถูกดึง'):
        attackTime<1.90?'ลูกบอลไม้ · ขว้างลงพื้น → สั่น':attackTime<2.95?'หนามไม้แทงเร็ว → พัก → ดึงศัตรูเข้ามาอย่างรวดเร็ว':'ลูกบอลไม้ · หดแล้วแตก';};}};
// 8) รากยักษ์ — รากโผล่ใกล้ตัวไล่ไปตามแนว (20 ดาเมจ + สตัน 1 วิ) → ยกตั้งตรง ชะลอใกล้แนวดิ่ง → งอกใบ 3 วิเป็นต้นไม้ใหญ่ → กดซ้ำ ล้มลงตามแนว (มีพื้นที่เตือน)
SKS.root={dur:8.4,still:4.95,setup(){const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0),foes=[pup('1.3.2.0.0.2.1.0.0.0',6,.4,Math.PI,'enemy'),pup('2.0.1.1.0.1.2.0.0.0',10.5,-.5,Math.PI,'enemy')];
    const LEN=14,N=60,base=W(1.2,0,0),root=Tube(N,10,M.bark),rth=Thorns(80,2.2);
    const crown=new T.Group();add(crown);const blobs=[];const bcol=['#4f9a35','#62b040','#3f8a2c','#78c24a'];for(let i=0;i<22;i++){const m=mesh(new T.IcosahedronGeometry(1,2),STD(bcol[i%4],{roughness:.9,flatShading:true}),crown);const a=i/22*6.28,r=rnd(.8,3.7);m.position.set(Math.cos(a)*r,rnd(-.4,1.4),Math.sin(a)*r);m.userData.s=rnd(1.5,2.3);m.scale.setScalar(.001);blobs.push(m);}
    const br=[];for(let i=0;i<8;i++)br.push(Tube(10,6,M.bark));
    const warn=new T.Mesh(new T.PlaneGeometry(3.2,LEN+3),new T.MeshBasicMaterial({color:'#ff4a2a',transparent:true,opacity:0,depthWrite:false}));warn.rotation.x=-Math.PI/2;add(warn);warn.position.copy(W(1.2+(LEN+3)/2,0,.04));
    const stars=foes.map(()=>{const g=new T.Group();add(g);for(let i=0;i<4;i++){const s=glow(GLOWT,.35,g);s.position.set(Math.cos(i*1.57)*.35,0,Math.sin(i*1.57)*.35);}g.visible=false;return g;});
    return (t,dt)=>{idle(me,t);const cast=phase(t,0,.35);me.armR.rotation.set(-1.4*Math.sin(Math.PI*.5*cast)-.1,0,0);me.armL.rotation.set(-1.2*cast,0,0);
      if(t>4.5&&t<5.0){const k=Math.sin(phase(t,4.5,5)*Math.PI);me.armR.rotation.set(-2.6*k,0,0);me.armL.rotation.set(-2.6*k,0,0);}
      // กล้อง: ช่วงแรกมุมข้าง • ช่วงต้นไม้ถอยกว้าง
      const wide=ease(phase(t,1.0,2.2));cam.p.copy(W(lerp(-2,-10,wide),lerp(-8,-24,wide),lerp(3.2,11,wide)));cam.l.copy(W(lerp(6,7,wide),0,lerp(.8,8,wide)));
      const emerge=phase(t,.25,1.05),lift=phase(t,1.3,2.9),fall=phase(t,5.2,6.1);
      const ang=Math.PI/2*(1-Math.pow(1-lift,2.6))*(1-Math.pow(fall,2.2));   // ยก = ชะลอใกล้แนวดิ่ง • ล้ม = เร่งขึ้น
      const straight=lift;const pts=[];
      for(let i=0;i<N;i++){const u=i/(N-1),s=u*LEN;const vis=u<=emerge;const uu=Math.min(u,emerge);const ss=uu*LEN;
        const wav=(1-straight*.85)*(.35*Math.abs(Math.sin(ss*.75))-.18),side=(1-straight*.7)*.35*Math.sin(ss*.42);
        const lx=ss,ly=wav;   // ในระนาบแนว (lx ไปข้างหน้า, ly ขึ้น)
        const x=lx*Math.cos(ang)-ly*Math.sin(ang),y=lx*Math.sin(ang)+ly*Math.cos(ang);pts.push(V3(base.x-side,base.y+y,base.z+x));}
      const rad=u=>(1.12*Math.pow(1-u,.85)+.18)*(1+.035*Math.sin(u*35));
      root.set(pts,rad,(u,c)=>c.set('#49301a').lerp(new T.Color('#6a4a2a'),.35+.12*Math.sin(u*11)));
      rth.put(lift<.5?thornsAlong(pts,rad,4,1.3,1.9).filter((q,i)=>i%2===0):[]);
      // ดินแตกตามแนวที่รากโผล่
      const head=pts[N-1];if(emerge>0&&emerge<1&&ang<.2){dirt(head.clone().setY(O.y+.05),3,3.5,{size:1.4});puff(head.clone().setY(O.y+.1),1,'#a08a6a',{sp:1,size:1});}
      foes.forEach((f,i)=>{const fz=f.base.z-O.z;idle(f,t);if(emerge*LEN>fz-1.2&&!f.hit){f.hit=t;sparks(chestW(f),20,4,'#fff6c0','#c08a4a');dirt(f.base,12,4);}
        if(f.hit!==undefined){const k=t-f.hit;f.g.position.copy(f.base).add(V3(0,Math.max(0,Math.sin(Math.min(1,k/.6)*Math.PI))*1.1,0));stars[i].visible=k<1.6;stars[i].position.copy(f.g.position).add(V3(0,2.25,0));stars[i].rotation.y=t*6;if(k<.6)f.b.rotation.x=-.5;}});
      // ใบงอก 3 วิ หลังตั้งตรง
      const top=pts[N-1],leafK=phase(t,2.9,5.0);crown.position.copy(top).add(V3(0,.3,0));crown.rotation.set(-(Math.PI/2-ang),0,0);
      blobs.forEach((b,i)=>{const k=ease(phase(leafK,i/20,i/20+.45));b.scale.setScalar(Math.max(.001,b.userData.s*k));});
      br.forEach((b,i)=>{const k=ease(phase(t,2.7,3.6));b.visible=k>.02&&t<6.6;if(!b.visible)return;const sIdx=Math.floor(N*(.62+i*.06)),P0=pts[Math.min(N-1,sIdx)],a=i*2.1,len=3.5*k;const d=V3(Math.cos(a)*.8,.9,Math.sin(a)*.8).normalize().applyAxisAngle(V3(1,0,0),-(Math.PI/2-ang));
        const q=[];for(let j=0;j<10;j++){const u=j/9;q.push(P0.clone().addScaledVector(d,u*len).add(V3(0,u*u*.4,0)));}b.set(q,u=>.25*(1-u)+.03,(u,c)=>c.set('#4a3218'));});
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
// Nature shield redesign: clear bubble, vines rising from its base, no orbiting thorn ring.
SKS.shield={dur:6.8,still:1.7,setup(){const me=pup('3.1.0.2.1.0.0.1.0.0',0,0,0),foe=pup('1.3.2.0.0.2.1.0.0.0',4.6,0,Math.PI,'enemy'),foe2=pup('2.0.1.1.0.1.2.0.0.0',3.52,-2.96,Math.PI,'enemy');cam.p.copy(W(6,-8,5));cam.l.copy(W(2,0,1));const sh=new T.Group();add(sh);
  const hitTime=.49,hitNormal=V3(.42,.16,1).normalize();
  const hitWave={value:1},hitAxis={value:hitNormal};
  const shell=mesh(new T.SphereGeometry(1.35,32,24),new T.ShaderMaterial({
    transparent:true,depthWrite:false,side:T.FrontSide,uniforms:{hitWave,hitAxis},
    vertexShader:`
      varying float h,edge;
      varying vec3 localNormal;
      void main(){
        h=position.y/2.7+0.5;
        localNormal=normal;
        vec4 mv=modelViewMatrix*vec4(position,1.0);
        vec3 n=normalize(normalMatrix*normal);
        edge=pow(1.0-abs(dot(n,normalize(-mv.xyz))),3.0);
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader:`
      uniform float hitWave;
      uniform vec3 hitAxis;
      varying float h,edge;
      varying vec3 localNormal;
      void main(){
        float t=clamp(h,0.0,1.0);
        vec3 low=vec3(.001,.012,.001),mid=vec3(.01,.11,.008),high=vec3(.34,.90,.25);
        vec3 col=mix(mix(low,mid,smoothstep(.20,.72,t)),high,smoothstep(.62,1.0,t));
        col+=vec3(.14,.30,.09)*edge;
        float d=acos(clamp(dot(normalize(localNormal),hitAxis),-1.0,1.0));
        float wave=1.0-smoothstep(.025,.11,abs(d-mix(.06,1.64,hitWave)));
        float impact=pow(1.0-hitWave,1.65)*wave;
        float flash=(1.0-smoothstep(.03,.28,hitWave))*(1.0-smoothstep(.02,.26,d));
        col+=vec3(.69,1.0,.32)*impact+vec3(.95,1.0,.55)*flash;
        gl_FragColor=vec4(col,min(.97,mix(.96,.38,smoothstep(.25,1.0,t))+edge*.15+impact*.34+flash*.27));
      }`
  }),sh);
  shell.castShadow=false;
  const incoming=mesh(new T.SphereGeometry(.10,10,8),new T.MeshBasicMaterial({color:'#ffbc72'}));
  incoming.castShadow=false;
  glow(GLOWT,.55,incoming);
  const hitTrail=TrailRibbon(4,'#ffb568');
  const vineLight=Tube(30,5,ADD('#ffffff',{vertexColors:true}));
  vineLight.castShadow=false;
  const sap=new T.Color('#b7f963');
  const strikes=[false,false];
  let blocked=false;
  const motes=[];for(let i=0;i<24;i++){const m=mesh(new T.OctahedronGeometry(.025+(i%3)*.009),new T.MeshBasicMaterial({color:i%2?'#a8f77c':'#e1ffc4',transparent:true,opacity:.7,depthWrite:false}),sh);motes.push(m);}
  const energy=[];for(let k=0;k<18;k++){const mat=new T.MeshBasicMaterial({color:k%3?'#7de36a':'#ccff9b',transparent:true,opacity:.22,blending:T.AdditiveBlending,depthWrite:false});const m=mesh(new T.SphereGeometry(.026,8,6),mat,sh);energy.push(m);}
  const vines=[];for(let k=0;k<9;k++)vines.push({tube:Tube(30,7,M.bark),th:Thorns(40,1.5)});const cracks=new T.Group();add(cracks);const crackMat=new T.MeshBasicMaterial({color:0x14250c,transparent:true,opacity:.85,depthWrite:false,side:T.DoubleSide});for(let i=0;i<12;i++){const f=1.65+i*.24,side=i%2?1:-1,strip=new T.Mesh(new T.PlaneGeometry(.32+(i%3)*.06,.045),crackMat);strip.rotation.x=-Math.PI/2;strip.rotation.z=side*.55;strip.position.copy(W(f,side*.12,.04));cracks.add(strip);}const cracks2=cracks.clone();const crackMat2=crackMat.clone();cracks2.children.forEach(m=>m.material=crackMat2);add(cracks2);cracks2.rotation.y=Math.PI*2/9;cracks2.position.copy(O).sub(O.clone().applyAxisAngle(V3(0,1,0),cracks2.rotation.y));
  return t=>{idle(me,t);idle(foe,t);idle(foe2,t);me.armL.rotation.set(-1.25,.25,0);sh.position.copy(me.g.localToWorld(V3(0,1.23,0)));motes.forEach((m,i)=>{const a=i*2.4+t*.4,y=((i*.31+t*.25)%2.4)-1.2,r=Math.sqrt(Math.max(.1,1-y*y/1.9))*1.4;m.position.set(Math.sin(a)*r,y,Math.cos(a)*r);});energy.forEach((m,i)=>{const a=i*2.4+t*.15,y=((i*.43+t*.65)%2.3)-1.15,r=Math.sqrt(Math.max(.1,1-y*y/1.9))*1.36;m.position.set(Math.sin(a)*r,y,Math.cos(a)*r);m.scale.set(.7,3.5,.7);});sh.updateMatrixWorld(true);
    const impact=sh.localToWorld(hitNormal.clone().multiplyScalar(1.35));
    const shot=phase(t,.14,hitTime);
    incoming.visible=shot>0&&shot<1;
    hitWave.value=t<hitTime?1:phase(t,hitTime,hitTime+.36);
    if(incoming.visible){
      incoming.position.copy(impact).addScaledVector(hitNormal,(1-shot)*3.6);
      hitTrail.push([incoming.position.clone().add(V3(0,.13,0)),incoming.position]);
    }else hitTrail.push(null);
    if(t>=hitTime&&!blocked){
      blocked=true;
      sparks(impact,15,3.3,'#f5ffb1','#91d84e',{dir:hitNormal.clone().multiplyScalar(1.3),life:.75});
      leaves(impact,7,1.9,{dir:hitNormal.clone().multiplyScalar(1.6),life:.58,size:1.2});
    }
    const second=t>=3.0,st2=t-(second?3.0:.65),active=second?1:0,grounded=Math.abs(sh.position.y-1.23-O.y)<.12;[ [cracks,crackMat,t-.65], [cracks2,crackMat2,t-3.0] ].forEach(([group,mat,age])=>{group.visible=grounded&&age>=1.07&&age<3.07;mat.opacity=.85*(1-ease(phase(age,1.07,3.07)));});if(st2>1.03&&st2<1.33)hitFlinch(second?foe2:foe,Math.sin(phase(st2,1.03,1.33)*Math.PI));
    vineLight.visible=st2>.82&&st2<1.12;
    vines.forEach(({tube,th},k)=>{const pts=[],height=[.70,.57,.77,.66,.49,.73,.62,.80,.60][k];for(let i=0;i<30;i++){const u=i/29,theta=Math.PI-(Math.PI*height*u),a=k*Math.PI*2/9+Math.sin(u*3+k)*.09,r=1.36,p=sh.localToWorld(V3(Math.sin(theta)*Math.sin(a)*r,Math.cos(theta)*r,Math.sin(theta)*Math.cos(a)*r));if(k===active&&st2>0&&st2<1.80){const rise=ease(phase(st2-u*.16,0,.58)),fall=outQ(phase(st2-u*.11,.79,.94)),back=ease(phase(st2-u*.07,1.18,1.63)),base=sh.localToWorld(V3(0,-1.25,0)),angle=fall*Math.PI/2,arc=base.clone().add(V3(0,Math.cos(angle)*4.8*u,Math.sin(angle)*4.6*u+(1-fall)*1.45*Math.sin(Math.PI*u)));arc.y+=Math.sin(u*Math.PI)*(.85*(1-fall));arc.x+=Math.sin(u*6-st2*9)*Math.sin(u*Math.PI)*.60*(1-fall);arc.z+=Math.sin(u*5-st2*7)*u*.32*(1-fall);arc.sub(base).applyAxisAngle(V3(0,1,0),k*Math.PI*2/9).add(base);p.lerp(arc,rise*(1-back)*ease(Math.min(1,u*4)));}pts.push(p);}const rad=u=>.16*Math.pow(1-u,.72)+.002;tube.set(pts,rad,(u,c)=>c.set('#304d20').lerp(new T.Color('#507c2c'),u*.35));const ths=thornsAlong(pts,rad,2,1.25);th.put(ths);ths.forEach((_,i)=>th.setColorAt(i,new T.Color(i%3===0?'#e8ffb3':i%3===1?'#688f41':'#b4dc79')));if(th.instanceColor)th.instanceColor.needsUpdate=true;
      if(k!==active)return;
      if(vineLight.visible){
        const front=phase(st2,.82,1.04);
        const lit=u=>ease(1-Math.abs(u-front)/.25)*(1-ease(phase(st2,1.04,1.12)));
        vineLight.set(pts,u=>rad(u)+.038*lit(u),(u,c)=>c.copy(sap).multiplyScalar(1.3*lit(u)));
      }
      if(grounded&&!strikes[active]&&st2>=1.07){
        strikes[active]=true;
        const a=k*Math.PI*2/9,dir=V3(Math.sin(a),0,Math.cos(a));
        const side=V3(dir.z,0,-dir.x);
        for(let i=0;i<4;i++){
          const p=pts[15+i*4].clone();
          p.y=O.y+.07;
          dirt(p,5,2.9,{spread:.42,size:.75});
          leaves(p,3,1.6,{dir:side.clone().multiplyScalar(i%2?1.65:-1.65),life:.7,size:1.15});
          sparks(p,3,2.4,'#e9ffa0','#69a83b',{dir,life:.63});
        }
      }
    });
    label=t<.83?'โล่หนาม · คลื่นแสงแผ่จากจุดรับกระสุน':'โล่หนาม · เถาฟาดตามทิศศัตรู';
  };}};
SKS.move_wall={dur:3.25,still:2.05,setup(){
  const player=pup('3.1.0.2.1.0.0.1.0.0',-.4,-6.3,0);
  const groundPlant=Turret(),wallPlant=Turret(true);
  const origin=W(-2.65,-4.75,0),destination=W(2.35,-2.13,1.33);
  const wall=mesh(new T.BoxGeometry(.5,3.4,4.6),M.stone);
  wall.position.copy(W(2.35,-1.85,1.7));
  wall.receiveShadow=true;
  cam.p.copy(W(5.7,-12.6,5.0));
  cam.l.copy(W(.55,-3.65,1.40));
  const route=new T.CatmullRomCurve3([
    origin.clone().add(V3(0,.06,0)),W(-1.2,-4.47,.065),W(.85,-3.20,.07),
    W(2.12,-2.19,.15),W(2.35,-2.16,.58),destination.clone().add(V3(.035,0,0))
  ]);
  const faceX=wall.position.x+.25;
  const surfacePoint=u=>{
    const p=route.getPointAt(u);
    p.x=Math.max(faceX+.034,p.x);
    return p;
  };
  const sapGreen=new T.Color('#36cc33'),sapTip=new T.Color('#d4ff72');
  const root=Tube(24,6,new T.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false}));
  root.castShadow=false;
  const tip=glow(glowTex('rgba(205,255,95,.95)','rgba(55,220,48,.40)'),.68);
  let retracted=false,planted=false;
  return t=>{
    idle(player,t);
    const cast=Math.sin(Math.PI*phase(t,.12,.47));
    player.armR.rotation.x=-.38-1.35*cast;
    const dive=ease(phase(t,.38,.84));
    groundPlant.g.position.copy(origin).y-=.49*dive;
    groundPlant.grow(1-dive);
    groundPlant.pose(t,1.22,0,false);
    if(t>=.46&&!retracted){
      retracted=true;
      leaves(origin.clone().add(V3(0,.17,0)),8,1.20,{life:.86});
      sparks(origin.clone().add(V3(0,.14,0)),11,1.14,'#d0ff79','#46d23c',{life:.91});
    }
    const travel=phase(t,.67,1.77),head=ease(travel);
    root.visible=tip.visible=travel>0&&travel<1;
    if(root.visible){
      const tail=Math.max(0,head-.36),points=Array.from({length:24},(_,i)=>surfacePoint(lerp(tail,head,i/23)));
      root.material.opacity=1-ease(phase(travel,.93,1));
      root.set(points,u=>.13*Math.sin(Math.PI*u)**.75,(u,c)=>c.copy(sapGreen).lerp(sapTip,u*u));
      tip.position.copy(surfacePoint(head));
      tip.material.opacity=root.material.opacity*.76;
      if(Math.round(t*FPS)%3===0)sparks(tip.position,3,1.08,'#c9ff6c','#3cdb42',{life:.83,size:1.16,g:-.30});
    }
    const pop=phase(t,1.74,2.26);
    wallPlant.g.position.copy(destination);
    wallPlant.grow(outQ(pop));
    wallPlant.pose(t,1.32,0,true,ease(phase(pop,.48,1)));
    if(pop>0&&!planted){
      planted=true;
      sparks(destination,19,1.72,'#e8ffad','#54d846',{dir:V3(.92,.43,0),life:1.16,size:1.22});
      leaves(destination,12,1.78,{dir:V3(.97,.34,0),life:.97,size:1.18});
    }
    label=t<.67?'ย้ายพืช · ป้อมมุดที่เดิม':t<1.54?'รากแสงวิ่งเลียบพื้น':t<1.77?'รากแสงไต่ผนัง':'รากเกาะผนัง · ป้อมงอกเอนออกจากผิว';
  };
}};
SKS.buff={dur:1,still:.5,setup(){const normal=Turret(),powered=Turret();normal.g.position.copy(W(2,1.8,0));powered.g.position.copy(W(2,-1.8,0));normal.grow(1);powered.grow(1);cam.p.copy(W(-4,0,2.6));cam.l.copy(W(2,0,1));return t=>{normal.pose(t,Math.PI,0);powered.pose(t,Math.PI,0,false,true);label='ซ้าย: ร่างบัฟ — ใบปีกหลายชั้น     ขวา: ร่างปกติ';};}};
SKS.buffanim={dur:5,still:2,setup(){const tu=Turret();tu.g.position.copy(W(2,0,0));tu.grow(1);cam.p.copy(W(-3,0,2.4));cam.l.copy(W(2,0,1));return t=>{const b=outQ(phase(t,.8,1.08))*(1-ease(phase(t,3.5,4.3)));const d=Math.max(0,t-.8),j=t>=.8?Math.sin(d*25)*Math.exp(-d*7):0;tu.pose(t,Math.PI,0,false,b,j);label='ต้นยิง: รับบัฟ → เปลี่ยนร่าง → บัฟหมดกลับร่างปกติ';};}};
SKS.buffshoot={dur:4,still:1.5,setup(){const tu=Turret(),sp=Spikes(),target=W(-10,0,1);tu.pod.material=tu.pod.material.clone();tu.pod.material.emissiveIntensity=0;tu.pod.material.color.set('#63a83d');tu.g.position.copy(W(2,0,0));tu.grow(1);cam.p.copy(W(-4,-4,2.8));cam.l.copy(W(2,0,1));return (t,dt)=>{const cycle=(t%.47)/.47,recoil=cycle<.24?Math.sin(cycle/.24*Math.PI):0;tu.g.rotation.z=Math.sin(t*7)*.045;tu.pose(t,Math.PI,recoil,false,1);const n=Math.floor(t/.47);if(n!==this.last){this.last=n;tu.head.updateMatrixWorld(true);sp.shoot(tu.head.localToWorld(V3(0,0,.55)),target);}sp.upd(dt);label='ต้นยิงร่างบัฟ: ปีกเอนหลังและขยับเร็ว';};}};
SKS.buffshoot_vfx={dur:4.25,still:2.40,setup(){
  const plant=Turret(),spikes=Spikes(true);
  const target=pup('1.3.2.0.0.2.1.0.0.0',1,-4.8,-Math.PI/2,'enemy');
  plant.g.position.copy(W(1,1.45,0));
  plant.grow(1);
  cam.p.copy(W(8,-1.45,4.0));
  cam.l.copy(W(1,-1.55,1.08));
  const muzzleGlow=glow(GLOWT,.76);
  const buffAt=1.48;
  const shots=[.55,2.03,2.64,3.25];
  let nextShot=0,lastShot=-2;
  return (t,dt)=>{
    idle(target,t);
    const buff=ease(phase(t,buffAt,buffAt+.24));
    const joltAge=t-buffAt;
    const jolt=joltAge>=0?Math.sin(joltAge*23)*Math.exp(-joltAge*7):0;
    const direction=chestW(target).sub(plant.g.position);
    const yaw=Math.atan2(direction.x,direction.z);
    const firing=nextShot<shots.length&&t>=shots[nextShot];
    if(firing)lastShot=shots[nextShot++];
    const recoil=1-ease(phase(t,lastShot,lastShot+.18));
    plant.pose(t,yaw,recoil,false,buff,jolt);
    const nozzle=plant.head.localToWorld(V3(0,0,.55));
    if(firing){
      const aim=chestW(target),forward=aim.clone().sub(nozzle).normalize();
      spikes.shoot(nozzle,aim);
      sparks(nozzle,9,1.7,buff>.99?'#ffe195':'#eeffb2','#75ce4a',{
        dir:forward.clone().multiplyScalar(.95),life:.65,size:1.16
      });
      if(buff>.99)leaves(nozzle,4,1.75,{dir:forward.clone().multiplyScalar(.46),life:.76,col:'#d7e875'});
    }
    const charge=nextShot<shots.length?ease(phase(t,shots[nextShot]-.19,shots[nextShot])):0;
    const buffLight=buff*Math.max(charge*.70,recoil*.85);
    muzzleGlow.visible=buffLight>.015;
    muzzleGlow.position.copy(nozzle);
    muzzleGlow.material.opacity=buffLight;
    const impactAge=t-lastShot-.28;
    hitFlinch(target,impactAge<0?0:1-ease(phase(impactAge,0,.25)));
    spikes.upd(dt);
    label=t<buffAt?'ป้อม Nature · ยิงปกติ':'ป้อมร่างบัฟ · เกสรทองวาบที่ฝักก่อนยิง';
  };
}};
SKS.turret_expire={dur:3.30,still:1.93,setup(){
  const wall=mesh(new T.BoxGeometry(.5,3.2,4.1),M.stone);
  wall.position.copy(W(2.95,-1.65,1.6));
  wall.receiveShadow=true;
  cam.p.copy(W(6.8,-9.4,4.5));
  cam.l.copy(W(1.25,-2.7,1.27));
  const plants=[
    {plant:Turret(),position:W(-.65,-3.55,0),at:.78,onWall:false},
    {plant:Turret(true),position:W(3.0,-1.93,1.20),at:1.66,onWall:true}
  ];
  for(const entry of plants){
    entry.plant.g.position.copy(entry.position);
    entry.nextPollen=entry.at;
  }
  return t=>{
    for(const entry of plants){
      const {plant,position,at,onWall}=entry;
      const fade=ease(phase(t,at,at+.77));
      plant.grow(1-fade);
      plant.pose(t,onWall?1.32:.80,0,onWall);
      plant.tipG.material.opacity=1-fade;
      if(t>=entry.nextPollen&&fade<1){
        const bud=plant.head.getWorldPosition(V3());
        const drift=onWall?V3(.49,.43,0):V3(0,.54,0);
        sparks(bud,4,.61,'#e9f3a1','#79c751',{dir:drift,life:1.24,g:-.27});
        if(fade<.63)leaves(bud,2,.83,{dir:drift,life:.82,size:1.10});
        entry.nextPollen+=.115;
      }
      if(fade>=.72&&!entry.rootsFaded){
        entry.rootsFaded=true;
        sparks(position.clone().add(V3(onWall?.06:0,.06,0)),7,.64,'#b4eb77','#69a84e',{
          dir:onWall?V3(.54,.22,0):V3(0,.45,0),life:1.07,g:-.21
        });
      }
    }
    label=t<.78?'ป้อม Nature · ใกล้หมดเวลา':t<1.66?'ป้อมบนพื้น · หดกลับเข้าราก':'ป้อมบนผนัง · หดกลับเข้าจุดเกาะ';
  };
}};
SKS.lotus_mode={dur:3.75,still:1.75,setup(){
  const mix={value:0};
  const lotus=Lotus(1,true,mix),healAura=LotusAura(8,'heal'),buffAura=LotusAura(8,'buff');
  for(const {g} of [lotus,healAura,buffAura])g.position.copy(W(0,0,0));
  const ally=pup('2.0.1.1.0.1.2.0.0.0',.5,-2.9,-.8,'ally');
  const turret=Turret();turret.g.position.copy(W(-.7,2.6,0));turret.grow(1);
  lotus.core.material=M.core.clone();
  const palettes=[
    [lotus.outerPetal,M.petal,'#80ef47','#49c420',.72],
    [lotus.innerPetal,M.petalIn,'#b5ff70','#5ce324',.82],
    [lotus.core.material,M.core,'#daff8c','#9dff37',1.32]
  ].map(([material,heal,color,emissive,intensity])=>({material,heal,color:new T.Color(color),emissive:new T.Color(emissive),intensity}));
  const greenLight=glow(GLOWG,1.7,lotus.bloom);greenLight.position.y=.34;
  const healArc=ring(.52,.59,'#ff9dd1',0);healArc.position.copy(ally.g.position).add(V3(0,.06,0));
  const switches=[.75,2.75];
  let switched=0,nextSpark=.15;
  cam.p.copy(W(-11,-13,9));cam.l.copy(W(0,0,1.7));
  return t=>{
    const turnOn=ease(phase(t,switches[0]+.08,switches[0]+.36));
    const turnOff=ease(phase(t,switches[1]+.08,switches[1]+.36));
    const green=turnOn*(1-turnOff),elapsed=t-(t>=switches[1]?switches[1]:switches[0]);
    const fold=elapsed>=0?Math.sin(Math.PI*phase(elapsed,0,.42)):0;
    mix.value=green;
    lotus.set(1,1-.3*fold,t);
    for(const {material,heal,color,emissive,intensity} of palettes){
      material.color.copy(heal.color).lerp(color,green);
      material.emissive.copy(heal.emissive).lerp(emissive,green);
      material.emissiveIntensity=lerp(heal.emissiveIntensity,intensity,green);
    }
    lotus.cg.material.opacity=1-green;
    greenLight.material.opacity=green*.7;
    healAura.set(1,t,1-green);buffAura.set(1,t,green);
    turret.pose(t,-.67,0,false,green,fold*.32);
    idle(ally,t);face(ally,lotus.g.position);
    healArc.material.opacity=(1-green)*(.38+.14*Math.sin(t*7));
    if(switched<switches.length&&t>=switches[switched]+.22){
      const tint=switched++===0?'#a8ff60':'#ff9fce';
      const crown=lotus.core.getWorldPosition(V3());
      sparks(crown,18,2.5,'#f7ffc7',tint,{g:-.55,life:1.12});
      shock(lotus.g.position,tint,15,.53);
    }
    if(t>=nextSpark){
      nextSpark+=.18;
      const recipient=green>.5?turret.head.getWorldPosition(V3()):chestW(ally);
      sparks(recipient,4,.85,green>.5?'#b8ff74':'#ffc2dc',green>.5?'#69d935':'#e778ae',{g:-.65,life:1.3});
    }
    label=green>.5?'ดอกบัว · โหมดบัฟป้อม':'ดอกบัว · โหมดฮีล';
  };
}};

SKS.big_pea={dur:2.85,still:1.55,setup(){
  const caster=pup('3.1.0.2.1.0.0.1.0.0',-4,1.7,0);
  const target=pup('1.3.2.0.0.2.1.0.0.0',5,-.48,Math.PI,'enemy');
  const nearby=pup('2.0.1.1.0.1.2.0.0.0',4.65,1.16,Math.PI,'enemy');
  const plant=Turret();plant.g.position.copy(W(0,0,0));plant.grow(1);
  const headSize=plant.head.scale.x;
  const aimYaw=Math.atan2(target.g.position.x-plant.g.position.x,target.g.position.z-plant.g.position.z);
  const tether=Tube(17,6,M.bark);tether.castShadow=false;
  const vineColor=new T.Color('#3f7a28'),vineTip=new T.Color('#9bd444');
  const pea=mesh(new T.SphereGeometry(.43,24,16),STD('#8dc83c',{emissive:'#487718',emissiveIntensity:.47,roughness:.38}));
  const tail=TrailRibbon(4,'#9ce54d');
  const normalShot=Spikes(true);
  const windup=.4,recovery=.5,launch=1.25,impact=1.4,resume=launch+recovery;
  const destination=W(-.68,.6,0),hit=chestW(target);
  const muzzleWaves=[ring(.84,1,'#8edb40',0),ring(.92,1,'#c5f889',0)];
  for(const wave of muzzleWaves)wave.material.blending=T.NormalBlending;
  const splash=new T.Group();add(splash);
  splash.position.set(hit.x,O.y+.035,hit.z);
  const splashMat=new T.ShaderMaterial({
    transparent:true,depthWrite:false,uniforms:{strength:{value:0},crest:{value:0}},
    vertexShader:`
      varying vec3 surfaceNormal, viewDirection;
      varying float height;
      void main(){
        vec4 viewPosition=modelViewMatrix*vec4(position,1.0);
        surfaceNormal=normalMatrix*normal;
        viewDirection=-viewPosition.xyz;
        height=position.y;
        gl_Position=projectionMatrix*viewPosition;
      }`,
    fragmentShader:`
      uniform float strength, crest;
      varying vec3 surfaceNormal, viewDirection;
      varying float height;
      void main(){
        float rim=pow(1.0-max(0.0,dot(normalize(surfaceNormal),normalize(viewDirection))),2.2);
        float ripple=1.0-smoothstep(0.02,0.13,abs(height-crest));
        float foot=1.0-smoothstep(0.0,0.18,height);
        vec3 color=mix(vec3(0.075,0.39,0.02),vec3(0.69,0.97,0.18),clamp(rim+ripple*0.65,0.0,1.0));
        gl_FragColor=vec4(color,strength*(0.16+rim*0.54+ripple*0.24+foot*0.20));
        #include <colorspace_fragment>
      }`
  });
  const shell=mesh(new T.SphereGeometry(1,48,20,0,Math.PI*2,0,Math.PI/2),splashMat,splash);
  shell.castShadow=false;
  const splashRim=ring(.95,1.025,'#83d63f',0,splash);splashRim.material.blending=T.NormalBlending;
  const muzzle=()=>plant.head.localToWorld(V3(0,0,.76));
  const shotDir=V3(),waveNormal=V3(0,0,1);
  let releasePoint,latched=false,launched=false,burst=false,firedAgain=false;
  cam.p.copy(W(3.5,-8.5,3.8));cam.l.copy(W(.65,0,1.1));
  return (t,dt)=>{
    idle(caster,t);idle(target,t);idle(nearby,t);
    const zip=outQ(phase(t,.29,.68)),rest=1-ease(phase(t,.65,.89));
    caster.g.position.lerpVectors(caster.base,destination,zip);
    caster.g.position.y+=.27*Math.sin(Math.PI*zip);
    face(caster,plant.g.position);face(target,plant.g.position);face(nearby,plant.g.position);
    caster.armR.rotation.x=lerp(-.18,-1.39,ease(phase(t,.04,.18))*rest);
    caster.b.rotation.x=.3*rest*zip;
    tether.visible=t>=.09&&t<.69;
    if(tether.visible){
      const hand=tipW(caster),anchor=plant.g.position.clone().add(V3(0,.72,0));
      const reach=outQ(phase(t,.09,.27)),bend=(1-zip)*(.6-.38*reach);
      const points=Array.from({length:17},(_,i)=>{
        const k=i/16*reach;
        const p=hand.clone().lerp(anchor,k);p.x+=bend*Math.sin(Math.PI*k);p.y+=.22*Math.sin(Math.PI*k);return p;
      });
      tether.set(points,k=>.05-.024*k,(k,c)=>c.copy(vineColor).lerp(vineTip,k));
    }
    if(t>=.68&&!latched){
      latched=true;
      sparks(plant.head.getWorldPosition(V3()),12,1.9,'#e7ff93','#74d136',{g:-.4});
    }

    const charge=phase(t,launch-windup,launch),settle=1-ease(phase(t,launch,resume));
    const strain=t<launch?ease(charge):settle;
    const recoil=t>=launch?Math.exp(-12*(t-launch)):0;
    const lean=t<launch?.29*ease(phase(charge,.12,1)):-.51*recoil;
    plant.body.rotation.x=lean;
    plant.pose(t,aimYaw,recoil,false,false,.13*strain*Math.sin(charge*19)-recoil*.32);
    plant.head.rotation.x-=lean*.37;
    const eyeOpen=t<launch?ease(phase(charge,.08,.7)):settle;
    for(const {eye,smile,side} of plant.eyeParts){
      eye.visible=eyeOpen>.04;smile.visible=!eye.visible;
      eye.scale.y=.26+.23*eyeOpen;
      eye.rotation.z=side*.10;
    }
    plant.head.scale.set(headSize*(1+.16*strain),headSize*(1+.13*strain),headSize*(1+.09*strain));
    plant.nozzle.scale.set(1+2.4*strain,1+.28*strain,1+2.4*strain);
    plant.tipG.material.opacity=t<launch?.72*(1-strain):.72*(1-recoil);
    pea.visible=t>=launch-windup*.61&&t<impact;
    if(t<launch&&pea.visible){
      const squeeze=ease(phase(charge,.39,1));
      pea.position.copy(plant.head.localToWorld(V3(0,0,lerp(.46,.76,squeeze))));
      pea.rotation.y=aimYaw;
      pea.scale.set(.19+.81*squeeze,.20+.80*squeeze,.24+.61*squeeze);
      releasePoint=muzzle();
    }
    if(t>=launch&&!launched){
      launched=true;
      shotDir.copy(hit).sub(releasePoint).normalize();
      for(const wave of muzzleWaves)wave.quaternion.setFromUnitVectors(waveNormal,shotDir);
      sparks(releasePoint,14,3.4,'#f1ffbc','#82d843',{life:.64,size:.9,dir:shotDir.clone().multiplyScalar(1.7)});
    }
    muzzleWaves.forEach((wave,i)=>{
      const age=t-launch-i*.05;
      const fade=phase(age,0,.23);
      wave.visible=age>=0&&fade<1;
      if(wave.visible){
        wave.position.copy(releasePoint).addScaledVector(shotDir,.10+fade*(i?.76:1.36));
        wave.scale.setScalar(.46+outQ(fade)*(i?.57:.94));
        wave.material.opacity=(i?.65:.92)*(1-fade)**1.15;
      }
    });
    if(t>=launch&&t<impact){
      const flight=phase(t,launch,impact);
      pea.position.lerpVectors(releasePoint,hit,flight);
      pea.quaternion.setFromUnitVectors(waveNormal,shotDir);
      pea.scale.set(.88,.88,1.35);
      tail.push([pea.position.clone().add(V3(0,.18,0)),pea.position.clone().add(V3(0,-.18,0))]);
    }else tail.push(null);
    if(t>=impact&&!burst){
      burst=true;
      sparks(hit,24,5.2,'#f2ffa1','#70ce3d',{size:1.2,life:.76});
      leaves(hit,9,4,{col:'#99ca49',life:.56});
    }
    const splashAge=t-impact;
    splash.visible=splashAge>=0&&splashAge<.44;
    if(splash.visible){
      const grow=outQ(phase(splashAge,0,.23)),fade=1-ease(phase(splashAge,.09,.44));
      const radius=lerp(.72,2.75,grow);
      splash.scale.set(radius,radius*.82,radius);
      splashMat.uniforms.strength.value=fade;
      splashMat.uniforms.crest.value=lerp(.87,.06,grow);
      splashRim.material.opacity=.70*fade;
    }
    if(t>=impact){
      const flinch=1-ease(phase(t,impact,impact+.32));
      hitFlinch(target,flinch);hitFlinch(nearby,flinch*.75);
    }
    if(t>=2.15&&!firedAgain){
      firedAgain=true;
      normalShot.shoot(muzzle(),chestW(target));
    }
    normalShot.upd(dt);
    label=t<.68?'Dash เข้าป้อม':t<launch?'ชาร์จนัดถัดไป · เบ่งลูกถั่ว 0.4 วิ':t<impact?'ป้อมปล่อยลูกถั่วใหญ่':
      t<2.15?'ลูกถั่วระเบิดวง · 30 ดาเมจ · ป้อมพักหลังยิง 0.5 วิ':'ป้อมกลับมายิงหนามปกติ';
  };
}};

const SKD=SKS[SK];if(!SKD)throw new Error('ไม่รู้จัก sk='+SK);
const captureName=SK==='ball'?'ball'+(ballWallCast?'_wallcast':'')+(ballThrowV3?'_throwv3':''):
  SK==='dash'&&Q.has('ally')?'dash_ally':SK;
const upd=SKD.setup.call({});const ctx={};
const N=Math.round(SKD.dur*FPS),stillI=Math.round(SKD.still*FPS),FROM=+(Q.get('from')||0),TO=+(Q.get('to')||1e9);
HOOK=null;
if(WD.gl.compileAsync)await WD.gl.compileAsync(WD.scene,WD.cam);
for(let i=0;i<=N;i++){const t=i*DT;upd.call(ctx,t,DT);for(const p of POOLS)p.upd(DT);boomUpd(DT);
  if(i===stillI&&FROM===0)frame('nat_'+captureName+'_still',true);
  if(i>=TO)break;
  if(!ONLY_STILL&&i>=FROM&&i<TO)frame('nat_'+captureName+'_f'+String(i).padStart(3,'0'),false);
  else if(ONLY_STILL&&i>stillI)break;
  if(i%5===4)await new Promise(r=>setTimeout(r,0));}
return {images,sk:SK,frames:ONLY_STILL?0:N+1,fps:FPS,errs:HL.errs.slice(0,8)};
