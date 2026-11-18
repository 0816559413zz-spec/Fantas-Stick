// Studio-only: Darkness floating scythe + dark-matter ink (ผู้ใช้ 2026-11-18, ref designs/darkness_ref/scythe_void_ref.png)
// เคียวลอยหมุนควงเบา ๆ ข้างตัว • ชั้นบนของใบดำสนิท (unlit) • เส้นหมึกดำไหลตามใบจากโคนไปปลายแล้วม้วนหลุดออกจากสัน + หยดเล็ก ๆ
// • เส้นหมึกพันด้าม 3 จุด • ค่อนข้างเยอะจนกลบทรงได้บ้าง • fx: assets/fx/darkness/scythe_idle.fx.json
const ST_SCY_LINES='assets/vfx/dark_scythe.lines.json';
let stScyLines=null;
if(typeof loadModel==='function')loadModel('dark_scythe');   // โหลดล่วงหน้า (contact sheet ถ่ายทันที)
fetch(ST_SCY_LINES).then(r=>r.ok?r.json():null).then(j=>{stScyLines=j;}).catch(()=>{});

function stScyInk(){   // วัสดุหมึก: ดำสนิทไม่รับแสง โปร่งตามจุดยอด
  return new THREE.MeshBasicMaterial({color:0x000000,transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexColors:true,toneMapped:false});
}

FXCODE.studio_darkness_scythe=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  anchor.inner.visible=false;
  const root=new THREE.Group();root.name='Darkness scythe preview';
  anchor.obj.add(root);
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{disposeTree(root);root.clear();root.removeFromParent();});
  const S=args.scale||1.6;          // ผู้ใช้: ใหญ่ขึ้นอีก → เคียวสูง ~3.5 ม. (~1.8 เท่าตัวละคร)
  const pivot=new THREE.Group();pivot.position.set(-(args.side??1.5),args.lift??0.05,args.fwd??-0.3);root.add(pivot);   // anchor (วัดในสตูดิโอ): +z = หน้า, −x = ขวามือตัวละคร
  const scy=new THREE.Group();scy.scale.setScalar(S);pivot.add(scy);
  const holder=modelOr('dark_scythe',null);scy.add(holder);
  // ชั้นบนของใบ: บังคับเป็นดำไม่รับแสง (เผื่อ loader ไม่แปลง unlit)
  const fixVoid=()=>holder.traverse(o=>{if(o.isMesh&&[].concat(o.material).some(m=>m&&m.name==='sc_void')){o.material=new THREE.MeshBasicMaterial({color:0x000000,toneMapped:false});}});
  let voidFixed=false;

  // ---------- เส้นหมึก (ribbon หน้ากว้างหันหาแนวตั้งฉากใบ) ----------
  const N=args.strands||96,P=16;                      // จำนวนเส้น • จุดต่อเส้น
  const inkGeo=new THREE.BufferGeometry();
  const pos=new Float32Array(N*P*2*3),col=new Float32Array(N*P*2*4),idx=[];
  for(let s=0;s<N;s++)for(let i=0;i<P-1;i++){const a=(s*P+i)*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  inkGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));inkGeo.setAttribute('color',new THREE.BufferAttribute(col,4));inkGeo.setIndex(idx);
  const WS0=()=>args.wrap||'A';
  const ink=new THREE.Mesh(inkGeo,stScyInk());ink.frustumCulled=false;ink.renderOrder=8;scy.add(ink);
  const SHOW_BLADE=WS0()==='A';   // ผู้ใช้ 2026-11-18: เอาเส้นฟุ้งบนใบออก (แบบ C) 
  // หยดหมึก
  const DROPS=48,dropGeo=new THREE.SphereGeometry(0.05,8,6),dropM=new THREE.MeshBasicMaterial({color:0x000000,toneMapped:false,transparent:true});
  const drops=new THREE.InstancedMesh(dropGeo,dropM,DROPS);drops.frustumCulled=false;scy.add(drops);
  if(!SHOW_BLADE){ink.material.opacity=0;ink.material.colorWrite=false;drops.visible=false;}
  // พันด้าม: A = 3 จุด ribbon เกลียวแน่น • B = เส้นหมึกยาวพันหลวม ๆ ทั้งด้าม มีห่วง/ปลายสะบัดแบบเปลวไฟ (ผู้ใช้ส่ง ref 2026-11-18)
  const WS=args.wrap||'A';
  const WR=WS==='C'?2:3,WP=WS==='C'?90:WS==='B'?70:26,wrapGeo=new THREE.BufferGeometry(),wpos=new Float32Array(WR*WP*2*3),wcol=new Float32Array(WR*WP*2*4),widx=[];
  for(let s=0;s<WR;s++)for(let i=0;i<WP-1;i++){const a=(s*WP+i)*2;widx.push(a,a+1,a+2,a+1,a+3,a+2);}
  wrapGeo.setAttribute('position',new THREE.BufferAttribute(wpos,3));wrapGeo.setAttribute('color',new THREE.BufferAttribute(wcol,4));wrapGeo.setIndex(widx);
  const wrap=new THREE.Mesh(wrapGeo,stScyInk());wrap.frustumCulled=false;wrap.renderOrder=8;scy.add(wrap);

  const rnd=k=>{const x=Math.sin(k*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  const strands=[...Array(N)].map((_,s)=>({ph:rnd(s+1),sp:0.55+rnd(s+7)*0.5,k:0.02+rnd(s+3)*0.55,side:rnd(s+5)<0.5?1:-1,curl:(rnd(s+9)-0.5)*2,w:0.07+rnd(s+11)*0.12,peel:0.3+rnd(s+13)*0.55}));
  const lineAt=(arr,t)=>{const n=arr.length-1,f=Math.min(n-1e-6,Math.max(0,t*n)),i=f|0,u=f-i;return [arr[i][0]+(arr[i+1][0]-arr[i][0])*u,arr[i][1]+(arr[i+1][1]-arr[i][1])*u];};
  const bladePt=(t,k)=>{const L=stScyLines,a=lineAt(L.spine,t),b=lineAt(L.edge,t);return [a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];};
  const tan=t=>{const a=lineAt(stScyLines.spine,Math.max(0,t-0.02)),b=lineAt(stScyLines.spine,Math.min(1,t+0.02)),dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;return [dx/l,dy/l];};
  const v=new THREE.Vector3(),M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),SC=new THREE.Vector3();
  const t0=performance.now();
  const clock=()=>((typeof stVnow!=='undefined'?stVnow:performance.now())-(typeof stVnow!=='undefined'?(root.userData.v0??(root.userData.v0=stVnow)):t0))/1000;

  const update=()=>{
    if(!voidFixed&&holder.children.length){fixVoid();voidFixed=true;}
    const T=clock();
    // ลอย + หมุนควงข้างตัว (หมุนรอบแกนด้ามช้า ๆ + โยกเบา ๆ)
    pivot.rotation.set(0.12*Math.sin(T*1.3),T*0.9,0.18+0.06*Math.sin(T*0.8));
    pivot.position.y=(args.lift??0.05)+0.08*Math.sin(T*1.7);
    if(!stScyLines)return;
    // ---------- หมึกไหลตามใบแล้วม้วนหลุด ----------
    for(let s=0;s<N;s++){
      const d=strands[s],life=1.6/d.sp,age=((T*d.sp*0.62+d.ph)%1);   // 0..1 วงจรชีวิตของเส้น
      const head=age*1.15;                                           // หัวเส้นเดินจากโคน → เลยปลาย
      for(let i=0;i<P;i++){
        const u=i/(P-1),tt=head-u*0.32;                              // หางตามหลังหัว
        const tc=Math.min(1,Math.max(0,tt));
        let [x,y]=bladePt(tc,d.k*(1-0.6*tc));
        const [tx,ty]=tan(tc);
        const peel=Math.max(0,tt-d.peel*0.6)/0.5;                    // ช่วงท้ายของเส้นม้วนหลุดออกจากสัน (ขึ้นด้านนอกใบ)
        const off=peel*peel*(0.45+0.35*d.curl);
        x+=-ty*off+tx*peel*0.08;y+=tx*off;
        const curl=Math.sin(u*6+T*4+d.ph*6)*0.05*(0.3+peel);
        const z=d.side*(0.03+peel*0.28+curl*2);
        const w=d.w*(1-u)*(0.4+0.6*Math.sin(Math.min(1,age*3)*Math.PI/2))*(1-Math.max(0,age-0.82)/0.18);
        const a=(s*P+i)*2*3,c=(s*P+i)*2*4;
        pos[a]=x+ty*w;pos[a+1]=y-tx*w;pos[a+2]=z;pos[a+3]=x-ty*w;pos[a+4]=y+tx*w;pos[a+5]=z;
        const al=(1-u*0.7)*(tt<0?0:1)*Math.min(1,(1-age)*4);
        col[c+3]=al;col[c+7]=al;
      }
    }
    inkGeo.attributes.position.needsUpdate=true;inkGeo.attributes.color.needsUpdate=true;
    // ---------- หยดหมึกหลุดจากสัน ----------
    for(let k=0;k<DROPS;k++){
      const ph=(T*0.7+rnd(k+40))%1,tt=0.15+rnd(k+41)*0.8,[x,y]=bladePt(tt,0.02),[tx,ty]=tan(tt);
      const fly=ph*0.5;v.set(x-ty*fly*0.9+tx*fly*0.3,y+tx*fly*0.9-fly*fly*0.8,(rnd(k+42)-0.5)*0.3*ph);
      const sc=(1-ph)*(0.6+rnd(k+43));SC.set(sc,sc*(1.4+ph),sc);M4.compose(v,Q,SC);drops.setMatrixAt(k,M4);
    }
    drops.instanceMatrix.needsUpdate=true;
    // ---------- พันด้าม 3 จุด ----------
    const [z0,z1]=stScyLines.shaft;
    if(WS==='C')for(let s=0;s<WR;s++){   // แบบ C (ref 35.png): 2 เส้นหมึกเรียบ หนา-บางแบบพู่กัน ห่วงใหญ่ออกนอกด้ามแล้ววกกลับ • บนสุดม้วนเป็นวงก้นหอย • ปลายสะบัดเหมือนเปลว
      const zt=(stScyLines.top||2.2)-0.15,zb=z0-0.35;
      for(let i=0;i<WP;i++){
        const u=i/(WP-1),zz=zb+(zt-zb)*u+0.025*Math.sin(T*1.8+u*6+s*3);
        const bulge=Math.pow(Math.max(0,Math.sin(u*Math.PI*(s?2.0:2.6)+s*1.3+0.35*Math.sin(T*0.7+s))),1.6);   // ห่วงใหญ่ 2–3 ห่วงตามความยาว
        let a=u*(s?1.4:1.9)*Math.PI*2+s*Math.PI+0.5*Math.sin(T*0.6+s);
        let rr=0.035+0.34*bulge+0.02*Math.sin(T*2.3+u*9);
        let x=Math.cos(a)*rr,zf=Math.sin(a)*rr,yy=zz;
        if(u>0.9){const k=(u-0.9)/0.1,sa=a+k*7,sr=0.11*(1-k*0.85);x=Math.cos(sa)*sr;zf=Math.sin(sa)*sr;yy=zt+0.08*k;}   // ก้นหอยบนสุด
        const tip=Math.min(1,u/0.07,(1-u)/0.03),thick=(0.25+0.9*Math.pow(Math.abs(Math.sin(u*Math.PI*5+s*0.9+T*0.8)),0.7));   // หนา-บางเป็นจังหวะแบบพู่กัน
        const w=0.04*thick*tip;
        const b=(s*WP+i)*2*3,c=(s*WP+i)*2*4;
        wpos[b]=x-Math.sin(a)*w*0.4;wpos[b+1]=yy-w;wpos[b+2]=zf+Math.cos(a)*w*0.4;wpos[b+3]=x+Math.sin(a)*w*0.4;wpos[b+4]=yy+w;wpos[b+5]=zf-Math.cos(a)*w*0.4;
        wcol[c+3]=wcol[c+7]=1;
      }
    }
    else if(WS==='B')for(let s=0;s<WR;s++){   // เส้นยาวพันหลวมทั้งด้าม
      const zt=stScyLines.top||2.2;
      for(let i=0;i<WP;i++){
        const u=i/(WP-1),zz=z0-0.25+(zt-z0+0.35)*u+0.03*Math.sin(T*2+s);
        const a=u*(3.2+s*0.7)*Math.PI*2+T*(0.7+0.25*s)+s*2.1;
        const loop=Math.max(0,Math.sin(u*Math.PI*(2.5+s)+T*0.6+s));
        const rr=0.06+0.26*loop*loop+0.06*Math.sin(u*11+T*1.3+s);
        const x=Math.cos(a)*rr,zf=Math.sin(a)*rr;
        const tip=Math.min(1,u/0.06,(1-u)/0.12);
        const w=0.032*(0.4+0.8*Math.abs(Math.sin(u*7+s)))*tip;
        const b=(s*WP+i)*2*3,c=(s*WP+i)*2*4;
        wpos[b]=x+Math.sin(a)*w;wpos[b+1]=zz-w*0.6;wpos[b+2]=zf-Math.cos(a)*w;wpos[b+3]=x-Math.sin(a)*w;wpos[b+4]=zz+w*0.6;wpos[b+5]=zf+Math.cos(a)*w;
        wcol[c+3]=wcol[c+7]=Math.min(1,tip*1.5);
      }
    }
    else for(let s=0;s<WR;s++){
      const zc=z0+(z1-z0)*(0.25+0.3*s)+0.05*Math.sin(T+s),R=0.045,turns=2.3;
      for(let i=0;i<WP;i++){
        const u=i/(WP-1),a=u*turns*Math.PI*2+T*(1.5+0.4*s)+s*2,zz=zc+(u-0.5)*0.28;
        const loose=Math.max(0,u-0.75)/0.25,rr=R+loose*0.1*(1+Math.sin(T*3+s));
        const x=Math.cos(a)*rr,zf=Math.sin(a)*rr,w=0.012*(1-loose*0.8)*(u<0.1?u/0.1:1);
        const b=(s*WP+i)*2*3,c=(s*WP+i)*2*4;
        wpos[b]=x;wpos[b+1]=zz-w;wpos[b+2]=zf;wpos[b+3]=x;wpos[b+4]=zz+w;wpos[b+5]=zf;
        wcol[c+3]=wcol[c+7]=1-loose*0.6;
      }
    }
    wrapGeo.attributes.position.needsUpdate=true;wrapGeo.attributes.color.needsUpdate=true;
  };
  // อัปเดตทุกเฟรมผ่าน onBeforeRender (ไม่ต้องแก้ studio.js)
  ink.onBeforeRender=update;
  update();
};
