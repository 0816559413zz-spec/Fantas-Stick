// ---------- สัตว์เวท: โมเดลโปร่งแสง + ซิงก์จาก snapshot (MN) ----------
const MM3=new Map();
function makeMinion(type){
  const g=new THREE.Group(),b=new THREE.Group();g.add(b);
  const M=(c,em,k,op)=>new THREE.MeshStandardMaterial({color:c,emissive:em,emissiveIntensity:k,transparent:true,opacity:op||0.85,roughness:0.6,flatShading:true});
  const add=(geo,mat,x,y,z,p)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);(p||b).add(m);return m;};
  const o={g,b,type,legs:[],sz:1.2};
  if(type==='wolf'){
    const m=M('#cfe8ff','#5a8aff',0.6);
    add(new THREE.BoxGeometry(0.55,0.5,1.2),m,0,0.75,0);add(new THREE.BoxGeometry(0.42,0.4,0.5),m,0,0.9,0.8);add(new THREE.BoxGeometry(0.2,0.18,0.32),m,0,0.82,1.12);
    for(const sx of[-1,1]){add(new THREE.ConeGeometry(0.08,0.2,4),m,sx*0.14,1.18,0.72);}
    const tl=add(new THREE.BoxGeometry(0.12,0.12,0.7),m,0,0.85,-0.85);tl.rotation.x=0.5;
    for(const [lx,lz] of [[-0.2,0.45],[0.2,0.45],[-0.2,-0.4],[0.2,-0.4]]){const L=new THREE.Group();L.position.set(lx,0.55,lz);b.add(L);add(new THREE.BoxGeometry(0.14,0.55,0.14),m,0,-0.27,0,L);o.legs.push(L);}
    for(const sx of[-1,1]){const e=new THREE.Sprite(glowMat('#aef0ff',2.2));e.scale.setScalar(0.18);e.position.set(sx*0.12,0.95,1.02);b.add(e);}
    b.scale.setScalar(1.25);
  }else if(type==='sprite'){
    add(new THREE.SphereGeometry(0.28,12,10),M('#ffb066','#ff6a1a',1.4,0.95),0,0,0);
    const gs=new THREE.Sprite(glowMat('#ff9a4a',2));gs.scale.setScalar(2);b.add(gs);
    for(const sx of[-1,1]){const w=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.22),new THREE.MeshBasicMaterial({color:hdr('#ffd9a8',1.6),transparent:true,opacity:0.7,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));w.position.set(sx*0.3,0.08,0);b.add(w);o.legs.push(w);}
    o.sz=0.7;
  }else if(type==='golem'){
    const m=new THREE.MeshStandardMaterial({color:'#8a8a9a',roughness:0.95,flatShading:true,transparent:true,opacity:0.95});
    add(new THREE.BoxGeometry(1.1,1.2,0.75),m,0,1.4,0);add(new THREE.BoxGeometry(0.55,0.5,0.55),m,0,2.25,0.05);
    for(const sx of[-1,1]){add(new THREE.BoxGeometry(0.32,1.1,0.32),m,sx*0.75,1.45,0);add(new THREE.BoxGeometry(0.4,0.85,0.42),m,sx*0.3,0.42,0);
      const e=new THREE.Sprite(glowMat('#7ff0ff',2.4));e.scale.setScalar(0.22);e.position.set(sx*0.14,2.3,0.34);b.add(e);}
    const rn=new THREE.Sprite(glowMat('#7ff0ff',1.6));rn.scale.setScalar(0.5);rn.position.set(0,1.5,0.42);b.add(rn);
    b.scale.setScalar(1.35);o.sz=1.8;
  }else{ // wisp
    add(new THREE.SphereGeometry(0.2,12,10),M('#e0ffe8','#4aff8a',1.6,0.95),0,0,0);
    const gs=new THREE.Sprite(glowMat('#7dff9a',2.2));gs.scale.setScalar(1.8);b.add(gs);
    o.sz=0.6;
  }
  const rg=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:'#6fd57f',transparent:true,opacity:0.7,depthWrite:false,side:THREE.DoubleSide}));rg.position.y=0.05;rg.scale.setScalar(type==='golem'?1.5:0.8);g.add(rg);o.ring=rg;
  scene.add(g);return o;
}
function syncMins(v,now,dt){
  const seen=new Set(),me=v.P.find(q=>q.id===NET.myId);
  for(const m of (v.MN||[])){
    const [id,type,x,y,h,hp,owner,team,fm]=m;seen.add(id);
    let o=MM3.get(id);if(!o){o=makeMinion(type);o.g.position.set(tx(x),h+GY(x,y),tz(y));o.px=x;o.py=y;MM3.set(id,o);}
    const X=tx(x),Z=tz(y),k=1-Math.exp(-14*dt);
    o.g.position.x+=(X-o.g.position.x)*k;o.g.position.z+=(Z-o.g.position.z)*k;o.g.position.y+=(h+GY(x,y)-o.g.position.y)*k;
    const vx=x-o.px,vy=y-o.py,mvd=Math.hypot(vx,vy);
    if(mvd>0.5){const a=Math.atan2(vx,vy);let d=a-o.g.rotation.y;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;o.g.rotation.y+=d*Math.min(1,dt*12);}
    o.px=x;o.py=y;
    if(type==='wolf'){const sw=Math.sin(now/70)*Math.min(1,mvd*0.5)*0.8;o.legs.forEach((L,i)=>L.rotation.x=(i%2?-1:1)*sw);o.b.position.y=Math.abs(Math.sin(now/70))*0.06*Math.min(1,mvd);}
    else if(type==='sprite'){o.legs.forEach((w,i)=>w.rotation.z=(i?-1:1)*Math.sin(now/30)*0.9);}
    else if(type==='golem'){o.b.position.y=Math.abs(Math.sin(now/260))*0.05*Math.min(1,mvd);o.b.rotation.z=Math.sin(now/260)*0.03*Math.min(1,mvd);}
    const friend=me&&team===me.tm;
    o.ring.material.color.set(friend?'#6fd57f':'#ff6a6a');o.ring.visible=true;
    if(type==='sprite'&&Math.random()<0.5)PARTS.push({x,y,h:h+rnd(-0.1,0.1),vx:rnd(-15,15),vy:rnd(-15,15),vh:rnd(0.2,0.8),life:0.5,max:0.5,col:Math.random()<0.5?'#ff7a2a':'#ffc04a',size:2.4,g:-1});
    if(type==='wisp'&&Math.random()<0.4)PARTS.push({x,y,h:h+rnd(-0.1,0.1),vx:rnd(-12,12),vy:rnd(-12,12),vh:rnd(0.3,1),life:0.7,max:0.7,col:'#9aff9a',size:1.8,g:-0.3});
    statusFX(o,fm|0,x,y,h,o.sz,now);
    o.hp=hp;o.team=team;o.xy=[x,y,h];
  }
  for(const [id,o] of MM3)if(!seen.has(id)){disposeObj(o.g);MM3.delete(id);}
}
function drawMinBars(v,me){
  if(!v.MN||!v.MN.length)return;
  for(const m of v.MN){
    const [id,type,x,y,h,hp,owner,team]=m;
    const s=toScreen(x,h+(type==='golem'?3.8:type==='wolf'?2:1.4),y);if(!s)continue;
    const friend=me&&team===me.tm,w=type==='golem'?54:36;
    cx.fillStyle='rgba(5,7,15,0.75)';cx.fillRect(s[0]-w/2,s[1],w,5);
    cx.fillStyle=friend?'#6fd57f':'#ff6a6a';cx.fillRect(s[0]-w/2,s[1],w*hp/100,5);
    cx.strokeStyle='rgba(217,180,90,0.5)';cx.lineWidth=1;cx.strokeRect(s[0]-w/2-0.5,s[1]-0.5,w+1,6);
  }
}
