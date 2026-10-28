// =====================================================================
//  ฉากหลังนอกพื้นที่เล่น (ผู้ใช้ 2026-10-28: "ทำ LOD หลอกตาของนอกแมพ ให้รู้สึกว่าแมพกว้าง")
//  เป็นวงล้อมรอบแผนที่หลายชั้น เดินไปไม่ถึง: ไม่มีที่ชน / ไม่มีเงา / ไม่ส่งผ่านเน็ต / รวมเป็น mesh ไม่กี่ชิ้น
//  ชั้น (ใกล้ → ไกล): เนินรอบขอบแผนที่ + ป่า (มีแสงจริง + หมอกฉาก) • สันเขากลาง • ม่านหมอก • ภูเขาไกล + หิมะ (ทาสีเอง ไม่ใช้หมอก)
//  + ปราสาทเงาบนสันเขา (หน้าต่างเรือง) — ตั้งค่าต่อแผนที่ใน BACKDROP[id] (ยังมีแค่ meadow: ลองก่อน)
//  เรียกจาก buildWorld (js/28) ตอนสร้างแผนที่ใหม่ → อยู่ใน world จึงถูก cache ไปพร้อมแผนที่ • กราฟิกประหยัด: ไม่มีป่า
// =====================================================================
var BACKDROP={   // var: buildWorld ถูกเรียกตอนโหลด (ก่อนไฟล์นี้) → ตอนนั้นยัง undefined = ไม่มีฉากหลัง (เมนู)
  meadow:{seed:3,hide:/^meadow_far/,                                   // hide = ชื่อของในไฟล์แผนที่ที่ถูกแทน (ภูเขากรวย + ปราสาทเดิม)
    near:{d:[-4,120],h:[2,24],col:'#5a8c3a',col2:'#3f6a2e'},            // เนินต่อจากพื้นแผนที่ (d = ระยะจากขอบพื้น, เมตร)
    trees:{n:380,d:[34,118],s:[1.4,2.9],col:['#4a7a34','#5b8a3a','#3f6a30','#6a8a3a']},   // ป่าบนเนิน
    mid:{d:[140,230],h:[18,55],rg:0.3,col:'#3e4a3c',lit:'#8a7a4a',tint:'#b0807a',k:0.16},
    mist:[{d:252,h:42,col:'#e9b098',a:0.55}],
    far:{d:[285,375],h:[60,150],rg:0.75,col:'#4e3c62',lit:'#e08a6e',tint:'#d89088',k:0.26,snow:'#ffe2d0'},
    castle:{a:-1.33,d:168,s:1.6,col:'#2a2132',win:'#ffb860'}},       // a = มุม (เรเดียน, 0 = +x; เดิมปราสาทในไฟล์อยู่ทิศนี้) • d = ระยะจากขอบพื้น
};
// ---------- noise เล็ก ๆ (คงที่ต่อ seed) ----------
function bdHash(i,s){const x=Math.sin(i*127.1+s*311.7)*43758.5453;return x-Math.floor(x);}
function bdNoise(u,f,s){const x=u*f,i=Math.floor(x),t=x-i,a=bdHash(((i%f)+f)%f,s),b=bdHash((((i+1)%f)+f)%f,s),k=t*t*(3-2*t);return a+(b-a)*k;}   // u วนรอบ 0..1
function bdFbm(u,s,f0){let v=0,amp=0.5,f=f0||6;for(let o=0;o<4;o++){v+=amp*bdNoise(u,f,s+o*17);amp*=0.5;f*=2;}return v/0.9375;}
// ระยะจากศูนย์กลางถึงขอบพื้นแผนที่ตามทิศ (สี่เหลี่ยมมุมมน superellipse)
function bdEdge(c,s,hx,hz){return Math.pow(Math.pow(Math.abs(c/hx),4)+Math.pow(Math.abs(s/hz),4),-0.25);}
// วงแหวนพื้นผิว: N มุม × M ช่องตามรัศมี • hf(u,k) = ความสูง (k 0 = ขอบใน, 1 = ขอบนอก)
function bdRing(hx,hz,d0,d1,N,M,hf){const pos=[],idx=[],uk=[];
  for(let i=0;i<=N;i++){const u=i/N,a=u*Math.PI*2,c=Math.cos(a),s=Math.sin(a),e=bdEdge(c,s,hx,hz);
    for(let j=0;j<=M;j++){const k=j/M,r=e+d0+(d1-d0)*k;pos.push(c*r,hf(u,k),s*r);uk.push(u,k);}}
  for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j,b=a+M+1;idx.push(a,b,a+1,a+1,b,b+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.userData.uk=uk;return g;}
// สีต่อจุดแบบอบแสงเอง (ชั้นไกลไม่ใช้แสง/หมอกจริง → คุมโทนเองได้ทั้งหมด): หันหาดวงอาทิตย์ = สีสว่าง แล้วผสมไปทางสีอากาศตามระยะ
function bdPaint(g,fn){g=g.toNonIndexed();g.computeVertexNormals();const P=g.attributes.position,N=g.attributes.normal,col=new Float32Array(P.count*3),c=new THREE.Color();
  for(let i=0;i<P.count;i++){fn(c,P.getX(i),P.getY(i),P.getZ(i),N.getX(i)*LDIR.x+N.getY(i)*LDIR.y+N.getZ(i)*LDIR.z);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));return g;}
function bdTree(){const parts=[],put=(geo,col,y)=>{geo=geo.toNonIndexed();geo.translate(0,y,0);const c=new THREE.Color(col),n=geo.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;}geo.setAttribute('color',new THREE.BufferAttribute(a,3));parts.push(geo);};
  put(new THREE.CylinderGeometry(0.18,0.26,1.6,5),'#5a3e28',0.8);put(new THREE.IcosahedronGeometry(1.25,0),'#ffffff',2.4);put(new THREE.IcosahedronGeometry(0.85,0),'#e8f0d8',3.3);
  const n=parts.reduce((t,q)=>t+q.attributes.position.count,0),P=new Float32Array(n*3),C=new Float32Array(n*3);let o=0;
  for(const q of parts){P.set(q.attributes.position.array,o*3);C.set(q.attributes.color.array,o*3);o+=q.attributes.position.count;q.dispose();}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('color',new THREE.BufferAttribute(C,3));g.computeVertexNormals();return g;}
function buildBackdrop(id){const B=BACKDROP&&BACKDROP[id];if(!B)return;
  const g=new THREE.Group();g.name='backdrop';const hx=MW/2*S3+20,hz=MH/2*S3+17,sd=B.seed||1,low=QUAL.mode==='low';
  const L2=new THREE.Vector2(LDIR.x,LDIR.z).normalize(),C=k=>new THREE.Color(k);
  // 1) เนินใกล้: ต่อจากขอบพื้น สูงขึ้นเรื่อย ๆ ไปข้างนอก (แสงจริง + หมอกฉาก → เข้ากับแผนที่)
  if(B.near){const n=B.near,hf=(u,k)=>{const r=Math.pow(k,1.4);return -0.6+r*(n.h[0]+(n.h[1]-n.h[0])*bdFbm(u,sd,5))+Math.sin(k*9+u*40)*0.6*k;};
    const c1=C(n.col),c2=C(n.col2),geo=bdPaint(bdRing(hx,hz,n.d[0],n.d[1],220,18,hf),(c,x,y,z)=>{c.copy(c1).lerp(c2,Math.min(1,Math.max(0,y/n.h[1]))*0.8+bdHash(Math.round(x*3+z*7),sd)*0.15);});
    const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true}));m.receiveShadow=false;g.add(m);
    // ป่าบนเนิน (instanced) — ความสูงเอาจากสูตรเดียวกับเนิน
    if(B.trees&&!low){const t=B.trees,im=new THREE.InstancedMesh(bdTree(),new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true}),t.n),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),cc=new THREE.Color();let n2=0;
      for(let i=0;i<t.n*3&&n2<t.n;i++){const u=bdHash(i,sd+5),dd=t.d[0]+(t.d[1]-t.d[0])*Math.pow(bdHash(i,sd+6),0.8),a=u*Math.PI*2,c=Math.cos(a),s=Math.sin(a),e=bdEdge(c,s,hx,hz),k=(dd-n.d[0])/(n.d[1]-n.d[0]);
        if(bdFbm(u,sd+9,8)<0.42&&bdHash(i,sd+7)<0.7)continue;   // เป็นกลุ่ม ๆ ไม่กระจายเท่ากันหมด
        const sc=t.s[0]+bdHash(i,sd+8)*(t.s[1]-t.s[0]),r=e+dd;q.setFromAxisAngle(new THREE.Vector3(0,1,0),bdHash(i,sd+10)*6.28);
        im.setMatrixAt(n2,m4.compose(new THREE.Vector3(c*r,hf(u,k)-0.4,s*r),q,new THREE.Vector3(sc,sc*(0.9+bdHash(i,sd+11)*0.5),sc)));
        im.setColorAt(n2,cc.set(t.col[i%t.col.length]));n2++;}
      im.count=n2;im.castShadow=im.receiveShadow=false;g.add(im);}}
  // 2) สันเขากลาง + 4) ภูเขาไกล: สีอบเอง ไม่ใช้หมอก (fog:false) ผสมสีอากาศตาม tint/k
  const ridge=(R,N,M,pk)=>{const hf=(u,k)=>{const b=Math.sin(Math.PI*Math.min(1,k*1.15)),w=u+k*0.045,v=bdFbm(w,sd+pk,R.f||7),rg=1-Math.abs(2*bdFbm(w,sd+pk+5,(R.f||7)*4)-1),p=Math.pow(v*(1-(R.rg||0))+rg*v*(R.rg||0)*1.6,1.5);return Math.max(0,b*(R.h[0]+(R.h[1]-R.h[0])*p)*(0.75+0.25*bdNoise(u*3+k,13,sd+pk+3)))-1;};
    const base=C(R.col),lit=C(R.lit),tint=C(R.tint),snow=R.snow&&C(R.snow);
    const geo=bdPaint(bdRing(hx,hz,R.d[0],R.d[1],N,M,hf),(c,x,y,z,ndl)=>{c.copy(base).lerp(lit,Math.max(0,ndl)*0.85);if(snow&&y>R.h[1]*0.62)c.lerp(snow,Math.min(1,(y-R.h[1]*0.62)/(R.h[1]*0.12))*(0.55+0.45*Math.max(0,ndl)));
      c.lerp(tint,R.k*(0.75+0.25*(1-Math.min(1,y/R.h[1]))));});   // ฐานจางกว่ายอด (หมอกต่ำ)
    const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,fog:false}));g.add(m);return hf;};
  const midH=B.mid&&ridge(B.mid,260,10,21);
  if(B.far)ridge(Object.assign({f:6},B.far),180,10,41);
  // 3) ม่านหมอก: ผนังวงกลมโปร่ง ทึบที่โคน → ใสด้านบน (กลบฐานภูเขา ให้รู้สึกว่าไกล)
  for(const M of B.mist||[]){const N=160,pos=[],al=[],idx=[];
    for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,c=Math.cos(a),s=Math.sin(a),r=bdEdge(c,s,hx,hz)+M.d;pos.push(c*r,-2,s*r,c*r,M.h,s*r);al.push(0,1);}
    for(let i=0;i<N;i++){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('alpha',new THREE.Float32BufferAttribute(al,1));geo.setIndex(idx);
    const mat=new THREE.ShaderMaterial({uniforms:{uC:{value:C(M.col)},uA:{value:M.a}},vertexShader:'attribute float alpha;varying float vA;void main(){vA=alpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform vec3 uC;uniform float uA;varying float vA;void main(){float t=1.0-vA;gl_FragColor=vec4(uC,uA*t*t);}',transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:false});
    const m=new THREE.Mesh(geo,mat);m.renderOrder=-1;g.add(m);}
  // 5) ปราสาทเงาบนสันเขากลาง (หอคอย + หลังคาแหลม + หน้าต่างเรือง)
  if(B.castle){const K=B.castle,c=Math.cos(K.a),s=Math.sin(K.a),r=bdEdge(c,s,hx,hz)+K.d,cg=new THREE.Group(),dm=new THREE.MeshBasicMaterial({color:K.col,fog:false}),wm=new THREE.MeshBasicMaterial({color:hdr(K.win,1.6),fog:false});
    const T=[[0,0,6,52],[-14,4,4.2,38],[13,3,4.6,42],[-24,-2,3.2,28],[22,-3,3,26],[5,9,3.4,33],[-6,-8,3,24]];
    for(const [x,z,w,h] of T){const tw=new THREE.Mesh(new THREE.CylinderGeometry(w*0.85,w,h,8),dm);tw.position.set(x,h/2,z);cg.add(tw);
      const rf=new THREE.Mesh(new THREE.ConeGeometry(w*1.15,w*2.6,8),dm);rf.position.set(x,h+w*1.3,z);cg.add(rf);
      for(let k=0;k<3;k++)if(bdHash(x*7+k,z+sd)<0.75){const wi=new THREE.Mesh(new THREE.PlaneGeometry(0.9,1.6),wm);const a2=Math.PI/2+(k-1)*0.5;wi.position.set(x+Math.cos(a2)*w*0.9,h*(0.45+k*0.15),z+Math.sin(a2)*w*0.9);wi.lookAt(x+Math.cos(a2)*w*3,h*(0.45+k*0.15),z+Math.sin(a2)*w*3);cg.add(wi);}}
    const wall=new THREE.Mesh(new THREE.BoxGeometry(48,14,10),dm);wall.position.set(0,7,2);cg.add(wall);
    const u=((K.a/(Math.PI*2))%1+1)%1,by=midH?midH(u,(K.d-B.mid.d[0])/(B.mid.d[1]-B.mid.d[0]))-3:0;   // ตั้งบนสันเขา
    cg.position.set(c*r,by,s*r);cg.lookAt(0,by,0);cg.scale.setScalar(K.s||1);g.add(cg);}
  for(const o of g.children)o.traverse(q=>{q.castShadow=q.receiveShadow=false;});
  world.add(g);return g;}
// ซ่อนของไกลเดิมในไฟล์แผนที่ (เรียกตอน .glb โหลดเสร็จ ก่อน batch — js/28 buildFileMap)
function backdropHide(id,sc){const B=BACKDROP&&BACKDROP[id];if(!B||!B.hide)return;const rm=[];sc.traverse(o=>{if(B.hide.test(o.name))rm.push(o);});for(const o of rm){o.parent.remove(o);disposeTree(o);}}
