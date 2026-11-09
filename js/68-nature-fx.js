// Nature VFX kit: the primitives of tools/nature-preview.js, copied as they are, so in-game skills look like the approved previews.
// Built on first use; natFxClear() removes it with the match. natFx().tick(dt) runs from syncNature.
let _natFx=null;
function natFxClear(){if(!_natFx)return;for(const o of _natFx.ALL.splice(0))scene.remove(o);_natFx=null;}
function natFxMake(){
const T=THREE,S=scene,O={y:0};
let seed=7;const rnd=(a=0,b=1)=>{seed=(seed*16807)%2147483647;return a+(b-a)*(seed/2147483647);};
const ease=t=>t<0?0:t>1?1:t*t*(3-2*t),outQ=t=>{t=clamp(t,0,1);return 1-(1-t)*(1-t);},inQ=t=>{t=clamp(t,0,1);return t*t;},phase=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const tipW=o=>{o.g.updateMatrixWorld(true);return o.tip.getWorldPosition(V3());};
const ALL=[];const add=(o,p)=>{(p||S).add(o);if(!p)ALL.push(o);return o;};
const mesh=(geo,mat,p)=>{const m=new T.Mesh(geo,mat);m.castShadow=true;m.frustumCulled=false;return add(m,p);};
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

function glowTex(c0,c1){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,c0);g.addColorStop(.35,c1);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);const t=new T.CanvasTexture(c);return t;}
const GLOWT=glowTex('rgba(255,250,200,1)','rgba(255,210,80,.5)'),GLOWG=glowTex('rgba(220,255,190,1)','rgba(90,220,70,.45)'),GLOWP=glowTex('rgba(255,230,245,1)','rgba(255,120,190,.45)'),GLOWV=glowTex('rgba(230,255,200,1)','rgba(150,60,200,.45)');
function glow(tex,size,p){const s=new T.Sprite(new T.SpriteMaterial({map:tex,blending:T.AdditiveBlending,depthWrite:false,transparent:true}));s.scale.setScalar(size);return add(s,p);}
function ring(r0,r1,col,op=.6,p){const m=new T.Mesh(new T.RingGeometry(r0,r1,64),ADD(col,{opacity:op}));m.rotation.x=-Math.PI/2;return add(m,p);}

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
        pulse.set(pts,u=>rad(u)+.036*glowAt(u),(u,c)=>c.copy(chargeColor).multiplyScalar(.85*glowAt(u)));   // game bloom is stronger than the preview (was 1.6)
      }
      return {pts,tip,st};}};}

const CLIPS=[];
function tick(dt){for(const p of POOLS)p.upd(dt);for(let i=CLIPS.length-1;i>=0;i--){const c=CLIPS[i];c.t+=dt;if(c.t>=c.dur||c.fn(c.t,dt)===false){CLIPS.splice(i,1);c.end&&c.end();}}}
function clip(dur,fn,end){CLIPS.push({t:0,dur,fn,end});fn(0,0);}
function drop(o){S.remove(o);const i=ALL.indexOf(o);if(i>=0)ALL.splice(i,1);o.geometry&&o.geometry.dispose();if(o.material&&!(o.material.userData&&o.material.userData.keep))o.material.dispose();}
return {Whip,WHIP_N,SPK,T,O,M,ALL,V3,rnd,ADD,STD,add,mesh,glow,ring,GLOWT,GLOWG,GLOWP,GLOWV,Tube,Thorns,thornsAlong,TrailRibbon,leaves,sparks,dirt,puff,chips,POOLS,tick,clip,drop};
}
const natFx=()=>_natFx||(_natFx=natFxMake());
