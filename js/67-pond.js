// ---------- Map Builder water surfaces (data.water, mapbuild/model.js gameData; user 2026-11-25) ----------
// Each entry = flat water rect {x,y (centre px), w,h (px), a (three rotation.y), lv (absolute level m), k (look)}
// + optional overrides (Inspector): cs shallow colour, cd deep colour, cl clarity 0..1, wh wave height ×, ws wave speed ×, fo foam ×.
// Look only for now (no swim/slow — gameplay team decides). The ground cuts the shoreline: ground above the level hides the sheet.
// Rects with the same level + look + overrides merge into one grid mesh (no double-blended overlaps). Per vertex: dp = depth (level - ground, m), ed = distance inside the rect edge (m).
const WATER_LOOK={lake:{sh:'#4fa6b4',dp:'#143f5c',dd:2.6,cl:0.25},clear:{sh:'#6fdcd2',dp:'#1b7392',dd:3.6,cl:0.5},swamp:{sh:'#6e7a42',dp:'#1e2a16',dd:1.4,cl:0.1},dark:{sh:'#3a7088',dp:'#071a2a',dd:1.6,cl:0.07}};   // = WATER_DEF in mapbuild/model.js (keep in sync)
const POND={mats:[],U:{uT:{value:0},uLit:{value:new THREE.Color(1,1,1)},uSky:{value:new THREE.Color('#bcd6ec')},uL:{value:new THREE.Vector3(0,1,0)},uSun:{value:new THREE.Color(1,1,1)}}};
function pondTick(){const U=POND.U;U.uT.value=performance.now()/1000;U.uL.value.copy(LDIR);
  U.uLit.value.copy(hemi.color).multiplyScalar(hemi.intensity*0.62).add(new THREE.Color().copy(moonL.color).multiplyScalar(moonL.intensity*0.32*Math.max(0.2,LDIR.y)));
  U.uSun.value.copy(moonL.color).multiplyScalar(Math.min(2,moonL.intensity));
  if(scene.fog)U.uSky.value.copy(scene.fog.color).lerp(hemi.color,0.35).multiplyScalar(Math.min(1.1,0.55+hemi.intensity*0.45));}
function pondMat(q){   // q = first rect of the group (look + overrides)
  const L=WATER_LOOK[q.k]||WATER_LOOK.lake,n=(v,d,a,b)=>v==null||isNaN(+v)?d:Math.min(b,Math.max(a,+v)),cl=n(q.cl,L.cl,0,1);
  const U=Object.assign({},THREE.UniformsLib.fog,POND.U,{uSh:{value:new THREE.Color(q.cs||L.sh)},uDp:{value:new THREE.Color(q.cd||L.dp)},uDD:{value:L.dd},uA:{value:0.97-0.45*cl},uA0:{value:0.62-0.35*cl},
    uWH:{value:n(q.wh,1,0,4)},uWS:{value:n(q.ws,1,0,4)},uFo:{value:n(q.fo,1,0,3)}});
  return new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,fog:true,
    vertexShader:`attribute float dp,ed;uniform float uT,uWH,uWS;varying vec3 vW;varying float vD,vE;
      #include <fog_pars_vertex>
      void main(){vec3 p=position;vec4 w=modelMatrix*vec4(p,1.0);
        float t=uT*uWS;w.y+=smoothstep(0.2,1.2,dp)*0.035*uWH*(sin(w.x*0.9+t*1.6)+sin(w.z*1.1-t*1.3));
        vW=w.xyz;vD=dp;vE=ed;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform float uT,uDD,uA,uA0,uWH,uWS,uFo;uniform vec3 uSh,uDp,uLit,uSky,uL,uSun;varying vec3 vW;varying float vD,vE;
      #include <fog_pars_fragment>
      float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+1.0),f.x),f.y);}
      vec2 wv(vec2 p,vec2 d,float f,float sp,float a,float t){float ph=dot(p,d)*f+t*sp;return d*(a*f*cos(ph));}
      void main(){vec2 p=vW.xz;float T=uT*uWS;   // wave speed: every moving term uses the scaled time
        vec2 g=wv(p,normalize(vec2(0.8,0.6)),1.3,1.6,0.035,T)+wv(p,normalize(vec2(-0.5,0.9)),2.1,2.1,0.022,T)+wv(p,normalize(vec2(0.95,-0.3)),3.4,2.9,0.012,T)+wv(p,normalize(vec2(-0.7,-0.7)),5.3,3.6,0.007,T);
        g+=(vec2(vn(p*1.7+T*0.35),vn(p*1.7-T*0.3+7.0))-0.5)*0.05;g*=uWH;
        vec3 N=normalize(vec3(-g.x,1.0,-g.y)),V=normalize(cameraPosition-vW);
        float fr=0.03+0.97*pow(1.0-max(dot(N,V),0.0),5.0),k=smoothstep(0.0,uDD,vD);
        vec3 c=mix(uSh,uDp,k)*uLit*(0.92+0.16*vn(p*0.12+T*0.03));
        c=mix(c,uSky,fr*0.85);
        vec3 Ns=normalize(N+vec3(vn(p*9.0+T*1.2)-0.5,0.0,vn(p*9.0-T*1.1+3.0)-0.5)*0.12*min(uWH,1.5));   // fine ripples: small sun glints, not big blobs
        c+=min(pow(max(dot(reflect(-uL,Ns),V),0.0),420.0)*0.32,0.25)*uSun;
        float n1=vn(p*1.6+vec2(T*0.4,-T*0.25)),n2=vn(p*4.0-T*0.5);
        float shore=1.0-smoothstep(0.0,(0.08+0.14*n1)*max(uFo,0.01),vD);
        float lap=smoothstep(0.7,0.95,sin(vD*14.0-T*1.8+n1*4.0))*(1.0-smoothstep(0.05,0.45,vD))*smoothstep(0.3,0.7,n2);
        float f=clamp(max(shore*0.8,lap*0.55)*min(uFo,1.0)+lap*0.25*max(uFo-1.0,0.0),0.0,1.0);
        c=mix(c,uLit*1.05+uSun*0.1,f);
        float a=mix(uA0,uA,smoothstep(0.0,0.9,vD))+fr*0.25;
        a=max(a,f*0.85)*smoothstep(-0.02,0.06,vD)*smoothstep(0.0,0.5,vE);
        gl_FragColor=vec4(c,clamp(a,0.0,1.0));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`});
}
// build all water of a file map (called from fileMapBody js/28-maps-build) → meshes added to the world
function pondBuild(list){
  for(const m of POND.mats)m.dispose();POND.mats=[];
  const groups=new Map();
  for(const q of list){const key=(Math.round((q.lv||0)*20)/20)+'|'+(WATER_LOOK[q.k]?q.k:'lake')+'|'+[q.cs,q.cd,q.cl,q.wh,q.ws,q.fo].join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(q);}
  for(const [key,R] of groups){
    const lv=+key.split('|')[0],rs=R.map(q=>{const c=Math.cos(q.a||0),s=Math.sin(q.a||0);return {x:q.x*S3,z:q.y*S3,c,s,hw:q.w*S3/2,hh:q.h*S3/2};});
    const inD=(x,z)=>{let d=-1e9;for(const r of rs){const dx=x-r.x,dz=z-r.z,u=dx*r.c-dz*r.s,v=dx*r.s+dz*r.c,e=Math.min(r.hw-Math.abs(u),r.hh-Math.abs(v));if(e>d)d=e;}return d;};   // map metres
    let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(const r of rs){const e=Math.hypot(r.hw,r.hh);x0=Math.min(x0,r.x-e);z0=Math.min(z0,r.z-e);x1=Math.max(x1,r.x+e);z1=Math.max(z1,r.z+e);}
    x0=Math.max(0,x0);z0=Math.max(0,z0);x1=Math.min(MW*S3,x1);z1=Math.min(MH*S3,z1);if(x1<=x0||z1<=z0)continue;
    const st=Math.max(0.5,Math.ceil(Math.max(x1-x0,z1-z0)/300*2)/2),nx=Math.ceil((x1-x0)/st)+1,nz=Math.ceil((z1-z0)/st)+1;
    const pos=new Float32Array(nx*nz*3),dp=new Float32Array(nx*nz),ed=new Float32Array(nx*nz);
    for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*nx+i,x=x0+i*st,z=z0+j*st;pos[k*3]=x-MW*S3/2;pos[k*3+1]=lv;pos[k*3+2]=z-MH*S3/2;dp[k]=lv-terrT(x/S3,z/S3);ed[k]=inD(x,z);}
    const idx=[];
    for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=a+1,c=a+nx,d=c+1;
      if(Math.max(ed[a],ed[b],ed[c],ed[d])<=0||Math.max(dp[a],dp[b],dp[c],dp[d])<-0.05)continue;   // outside every rect / fully under the ground
      idx.push(a,c,b,b,c,d);}
    if(!idx.length)continue;
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('dp',new THREE.BufferAttribute(dp,1));geo.setAttribute('ed',new THREE.BufferAttribute(ed,1));
    geo.setIndex(idx.length>65535?new THREE.Uint32BufferAttribute(idx,1):new THREE.Uint16BufferAttribute(idx,1));geo.computeBoundingSphere();
    const m=pondMat(R[0]);POND.mats.push(m);const me=new THREE.Mesh(geo,m);me.name='pond';me.renderOrder=2;me.userData.noBatch=1;me.onBeforeRender=pondTick;addW(me);
  }
}
