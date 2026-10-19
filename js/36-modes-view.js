// =====================================================================
//  ฝั่งแสดงผลของโหมดพิเศษ (บอล / ห่วงแข่ง / วงหด / ไอเทม / ศพ / จุดภารกิจ / ลมหายใจมังกร)
// =====================================================================
let ROLE=null,KC=0,roleShowT=0;
function onPriv(m){
  if(m.t==='role'){ROLE={role:m.role,title:m.title||'',mates:m.mates||[],tasks:m.tasks||[],tdone:m.tdone||[]};KC=15;roleShowT=5;snd(m.role==='imp'?'imp':'crew');}
  else if(m.t==='tasks'&&ROLE)ROLE.tdone=m.tdone;
  else if(m.t==='kc')KC=m.v;
}
const MO={ball:null,rings:[],ringKey:'',zone:null,items:new Map(),bodies:new Map(),tasks:[],taskKey:''};
const BREATHS=[];
function clearModeObjs(){
  if(MO.ball){scene.remove(MO.ball);MO.ball=null;}
  MO.rings.forEach(r=>scene.remove(r.g));MO.rings=[];MO.ringKey='';
  if(MO.zone){scene.remove(MO.zone);MO.zone=null;}
  for(const o of MO.items.values())scene.remove(o);MO.items.clear();
  for(const o of MO.bodies.values())disposeObj(o.g);MO.bodies.clear();
  MO.tasks.forEach(o=>scene.remove(o));MO.tasks=[];MO.taskKey='';
  BREATHS.length=0;
}
const ITEMC={fire:'#ff6a2a',stun:'#5ad1ff',push:'#cfe8ff',pull:'#c77dff',hp:'#ff4060',sh:'#7ff0ff',ult:'#ffd86b'};
function makeItem(k){
  const g=new THREE.Group(),col=ITEMC[k]||'#ffffff';
  if(['fire','stun','push','pull'].includes(k)){
    const sc=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,0.75,12),new THREE.MeshStandardMaterial({color:'#f0e0b0',roughness:0.8}));sc.rotation.z=Math.PI/2;g.add(sc);
    const rb=new THREE.Mesh(new THREE.TorusGeometry(0.14,0.035,6,16),new THREE.MeshBasicMaterial({color:hdr(col,1.6)}));rb.rotation.y=Math.PI/2;g.add(rb);
  }else{
    const bt=new THREE.Mesh(new THREE.SphereGeometry(0.24,16,12),new THREE.MeshStandardMaterial({color:col,emissive:hdr(col,0.6),transparent:true,opacity:0.85,roughness:0.1}));g.add(bt);
    const nk=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.09,0.22,10),new THREE.MeshStandardMaterial({color:'#d8e8f0',transparent:true,opacity:0.7}));nk.position.y=0.28;g.add(nk);
  }
  const s=new THREE.Sprite(glowMat(col,1.1));s.scale.setScalar(1.6);g.add(s);
  scene.add(g);return g;
}
function syncModeObjs(v,P,me,now,dt){
  const M=v.M||{};
  // บอลควิดดิช
  if(M.ball){
    if(!MO.ball){
      const g=new THREE.Group();
      const m=new THREE.Mesh(new THREE.SphereGeometry(0.42,20,14),new THREE.MeshStandardMaterial({color:'#b02020',roughness:0.55}));m.castShadow=true;g.add(m);
      const s=new THREE.Sprite(glowMat('#ff5050',0.7));s.scale.setScalar(2.2);g.add(s);
      scene.add(g);MO.ball=g;
    }
    MO.ball.position.set(tx(M.ball.x),M.ball.h,tz(M.ball.y));MO.ball.rotation.x+=dt*5;
  }else if(MO.ball){scene.remove(MO.ball);MO.ball=null;}
  if(SNITCH){
    if(v.mode==='quid'){
      SNITCH.visible=!!M.sn;
      if(M.sn){SNITCH.position.set(tx(M.sn.x),M.sn.h,tz(M.sn.y));if(Math.random()<0.6)PARTS.push({x:M.sn.x,y:M.sn.y,h:M.sn.h,vx:rnd(-20,20),vy:rnd(-20,20),vh:0,life:0.5,max:0.5,col:'#ffd860',size:1.6,g:0});}
    }else SNITCH.visible=true;
  }
  // ห่วงแข่งไม้กวาด
  const rk=M.rings?M.rings.map(r=>r.join()).join('|'):'';
  if(rk!==MO.ringKey){
    MO.rings.forEach(r=>scene.remove(r.g));MO.rings=[];MO.ringKey=rk;
    if(M.rings)M.rings.forEach((r,i)=>{
      const g=new THREE.Group();
      const t=new THREE.Mesh(new THREE.TorusGeometry(2.4,0.17,10,48),new THREE.MeshBasicMaterial({color:hdr('#5fd8ff',1.5),transparent:true,opacity:0.8}));g.add(t);
      const disc=new THREE.Mesh(new THREE.CircleGeometry(2.3,40),new THREE.MeshBasicMaterial({color:'#5fd8ff',transparent:true,opacity:0.08,side:THREE.DoubleSide,depthWrite:false}));g.add(disc);
      g.position.set(tx(r[0]),r[2]+GY(r[0],r[1]),tz(r[1]));
      const nx=M.rings[(i+1)%M.rings.length],pv=M.rings[(i-1+M.rings.length)%M.rings.length];
      g.lookAt(tx(nx[0])+tx(r[0])-tx(pv[0]),r[2],tz(nx[1])+tz(r[1])-tz(pv[1]));
      scene.add(g);MO.rings.push({g,t,disc});
    });
  }
  if(MO.rings.length&&me){
    MO.rings.forEach((r,i)=>{
      const next=i===me.cp&&!me.fin;
      r.t.material.color.copy(hdr(next?'#ffd86b':'#5fd8ff',next?2.2:1.0));r.t.material.opacity=next?1:0.35;
      r.disc.material.opacity=next?0.16+0.08*Math.sin(now/150):0.04;
      r.g.scale.setScalar(next?1+0.06*Math.sin(now/200):1);
    });
  }
  // วงเวทหด (แบทเทิลรอยัล)
  if(M.zone){
    if(!MO.zone){
      const mat=new THREE.ShaderMaterial({uniforms:{t:{value:0}},
        vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader:'uniform float t;varying vec2 vU;void main(){float s=0.5+0.5*sin(vU.x*140.0+t*2.0)*sin(vU.y*20.0-t*3.0);float f=smoothstep(1.0,0.0,vU.y);gl_FragColor=vec4(vec3(0.55,0.35,1.0)*(1.0+s*1.5),(0.1+0.25*s)*f);}',
        transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
      MO.zone=new THREE.Mesh(new THREE.CylinderGeometry(1,1,40,128,1,true),mat);MO.zone.position.y=20;scene.add(MO.zone);
    }
    MO.zone.position.x=tx(M.zone.cx);MO.zone.position.z=tz(M.zone.cy);
    const r=M.zone.r*S3;MO.zone.scale.set(r,1,r);MO.zone.material.uniforms.t.value=now/1000;
  }else if(MO.zone){scene.remove(MO.zone);MO.zone=null;}
  // ไอเทมแบทเทิลรอยัล
  const seen=new Set();
  if(M.items)for(const [id,x,y,k] of M.items){
    seen.add(id);let o=MO.items.get(id);
    if(!o){o=makeItem(k);MO.items.set(id,o);}
    o.position.set(tx(x),0.9+Math.sin(now/400+id)*0.2+GY(x,y),tz(y));o.rotation.y=now/600+id;
  }
  for(const [id,o] of MO.items)if(!seen.has(id)){scene.remove(o);MO.items.delete(id);}
  // ศพ (หาลอร์ดโวลเดอมอร์)
  const bs=new Set();
  if(M.bodies)for(const [id,x,y,c] of M.bodies){
    bs.add(id);
    if(!MO.bodies.has(id)){
      const o=makeStudent(getLook(id),id);
      o.b.rotation.x=-1.45;o.b.position.y=0.35;o.g.rotation.y=hashStr(id)%6;o.g.position.set(tx(x),GY(x,y),tz(y));o.ring.visible=false;
      const pool=new THREE.Mesh(discGeo,new THREE.MeshBasicMaterial({color:'#5a0a0a',transparent:true,opacity:0.6,depthWrite:false}));pool.scale.setScalar(1.3);pool.position.y=0.03;o.g.add(pool);
      MO.bodies.set(id,o);
    }
  }
  for(const [id,o] of MO.bodies)if(!bs.has(id)){disposeObj(o.g);MO.bodies.delete(id);}
  // จุดภารกิจของตัวเอง
  if(v.mode==='imp'&&ROLE){
    const key=ROLE.tasks.join()+'|'+ROLE.tdone.join()+'|'+MAPID;
    if(key!==MO.taskKey){
      MO.tasks.forEach(o=>scene.remove(o));MO.tasks=[];MO.taskKey=key;
      const tp=taskPts();
      ROLE.tasks.forEach(ti=>{
        if(ROLE.tdone.includes(ti))return;
        const p=tp[ti],g=new THREE.Group(),col=ROLE.role==='imp'?'#ff9a6a':'#ffd86b';
        const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.9,14,16,1,true),new THREE.MeshBasicMaterial({color:hdr(col,1.2),transparent:true,opacity:0.16,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
        beam.position.y=7;g.add(beam);
        const rg=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:hdr(col,1.6),transparent:true,depthWrite:false}));rg.scale.setScalar(1.6);rg.position.y=0.05;g.add(rg);
        g.position.set(tx(p.x),GY(p.x,p.y),tz(p.y));g.userData={ti,x:p.x,y:p.y};scene.add(g);MO.tasks.push(g);
      });
    }
    MO.tasks.forEach(g=>{g.children[1].rotation.y=now/800;});
  }else if(MO.tasks.length){MO.tasks.forEach(o=>scene.remove(o));MO.tasks=[];MO.taskKey='';}
  // ลมหายใจไฟมังกร
  for(let i=BREATHS.length-1;i>=0;i--){
    const b=BREATHS[i];b.t-=dt;if(b.t<=0){BREATHS.splice(i,1);continue;}
    const mx=b.x+Math.cos(b.a)*95,my=b.y+Math.sin(b.a)*95;
    for(let k=0;k<9;k++){const a=b.a+rnd(-0.38,0.38),s=rnd(450,800);PARTS.push({x:mx,y:my,h:3.1+rnd(-0.2,0.2),vx:Math.cos(a)*s,vy:Math.sin(a)*s,vh:rnd(-1.5,0.5),life:0.65,max:0.65,col:Math.random()<0.5?'#ff7a2a':Math.random()<0.5?'#ffc04a':'#ff3a1a',size:5,g:-1,drag:1.2});}
    if(Math.random()<0.6)PARTS.push({x:mx,y:my,h:3,vx:Math.cos(b.a)*300,vy:Math.sin(b.a)*300,vh:1,life:1.2,max:1.2,col:'#2a2222',size:7,g:-0.5,smoke:true,grow:1.5,drag:1.5});
    LREQ.push({x:tx(mx),y:3,z:tz(my),col:'#ff7a2a',int:4,dist:20});
  }
}

// ---------- หน้าประชุมโหวต (หาลอร์ดโวลเดอมอร์) ----------
let meetKey='',myVoted=false;
function castVote(v){
  if(myVoted)return;myVoted=true;
  if(NET.isHost){const p=G&&G.players[NET.myId];if(p)hostVote(p,v);}
  else if(NET.hostConn)try{NET.hostConn.send({t:'vote',v});}catch(e){}
  meetKey='';
}
function syncMeeting(s){
  const el=$('#meet'),m=s.M&&s.M.meet;
  if(s.ph!=='meet'||!m){if(!el.classList.contains('hidden')){el.classList.add('hidden');}myVoted=false;meetKey='';return;}
  const me=s.P.find(p=>p.id===NET.myId),dead=!me||me.gh;
  if(m.voted.includes(NET.myId))myVoted=true;
  const key=m.t+'|'+m.voted.length+'|'+(m.res||'')+'|'+myVoted;
  if(key===meetKey)return;meetKey=key;
  if(el.classList.contains('hidden')){el.classList.remove('hidden');if(document.pointerLockElement)document.exitPointerLock();}
  const mates=ROLE&&ROLE.role==='imp'?ROLE.mates:[];
  const rows=s.P.map(p=>{
    const gone=p.gh,voted=m.voted.includes(p.id),tally=m.tally?(m.tally[p.id]||0):null;
    return `<button class="vbtn" data-vote="${esc(p.id)}" ${gone||dead||myVoted||m.res?'disabled':''} style="opacity:${gone?0.35:1}">
      <span class="dot" style="background:${p.c}"></span><span style="flex:1;text-align:left;${mates.includes(p.id)?'color:#ff6b6b':''}">${esc(p.n)}${p.id===NET.myId?' (คุณ)':''}${gone?' 💀':''}</span>
      ${voted?'<span title="โหวตแล้ว">✅</span>':''}${tally!==null?`<b>${tally} โหวต</b>`:''}</button>`;
  }).join('');
  el.innerHTML=`<div class="card" style="width:min(580px,100%)">
    <h2 style="text-align:center">${m.body?`💀 พบศพของ ${esc(m.body)}!`:'🔔 ประชุมฉุกเฉิน!'}</h2><div class="orn"></div>
    <p class="sub">${esc(m.by)} เรียกประชุม • คุยกันผ่านไมค์ (กด T) แล้วโหวตคนที่น่าสงสัย</p>
    ${m.res?`<h2 style="text-align:center;color:#ffd86b">${esc(m.res)}</h2>`:`<p class="sub" style="font-size:24px;color:var(--gold2);font-family:var(--fd)">⏱ ${m.t} วิ</p>`}
    <div class="vlist">${rows}</div>
    <div class="row"><button data-vote="skip" ${dead||myVoted||m.res?'disabled':''}>⏭️ ข้าม (ไม่โหวตใคร)${m.tally&&m.tally.skip?` — ${m.tally.skip}`:''}</button></div>
    <p class="sub" style="margin-top:10px">${dead?'คุณเป็นผี โหวตไม่ได้':myVoted?'โหวตแล้ว รอคนอื่น...':'คลิกชื่อเพื่อโหวต'}</p></div>`;
}
$('#meet').addEventListener('click',e=>{const b=e.target.closest('[data-vote]');if(b&&!b.disabled)castVote(b.dataset.vote);});
