// ---------- ศัตรู (โหมด Co-op) ----------
function spawnEnemy(type,at){
  const d=EDEF[type];let x,y;
  if(at){x=at.x+rnd(-60,60);y=at.y+rnd(-60,60);}
  else{
    // เกิดรอบๆ ผู้เล่นคนหนึ่งในระยะ 650-900 (แผนที่ใหญ่จะได้ไม่ต้องเดินไกล)
    const al=plist().filter(p=>p.alive&&!p.downed),t=al[Math.floor(Math.random()*al.length)]||{x:MW/2,y:MH/2};
    const a=rnd(0,Math.PI*2),dd=rnd(650,900),fs=fmap()&&fmap().espawn;
    if(fs&&fs.length&&type!=='dummy'){const q=fs[Math.floor(Math.random()*fs.length)];x=q.x+rnd(-50,50);y=q.y+rnd(-50,50);}   // จุดเกิดมอนสเตอร์จากไฟล์แผนที่
    else{x=t.x+Math.cos(a)*dd;y=t.y+Math.sin(a)*dd;}
  }
  const tmp={x:clamp(x,60,MW-60),y:clamp(y,60,MH-60)};
  collideWorld(tmp,d.r);x=tmp.x;y=tmp.y;
  const np=plist().length,hs=type==='dummy'?1:G.escale*(d.boss?1+0.4*(np-1):(np>1?1+0.12*np:1));
  G.en.push({id:++G.eid,isE:true,type,x,y,h:d.fly?4:0,r:d.r,hp:d.hp*hs,maxHp:d.hp*hs,spd:d.spd,cd:rnd(0.5,1.5),cd2:rnd(1,3),cd3:6,
    stun:0,vx:0,vy:0,slam:0,lunge:0,burn:0,bt:0,team:-1,ph:rnd(0,6)});
  emit({k:'spawn',x,y,t:type});
}
function setupWave(){
  const n=G.wave,np=plist().length,pool=POOLS[G.map]||POOLS.castle;
  G.escale=1+(n-1)*0.13;G.espd=1+Math.min(0.4,(n-1)*0.03);
  const cnt=Math.round((4+n*1.7)*(np>1?1.4:1));
  const midP=n<2?0:Math.min(0.5,0.12+n*0.04);
  const q=[];
  for(let i=0;i<cnt;i++){
    const arr=Math.random()<midP?pool.mid:pool.early;let t=arr[Math.floor(Math.random()*arr.length)];
    if(t==='troll'&&n<8)t='wiz';
    q.push(t);if(t==='spl')q.push('spl');
  }
  // ห้องบอส: ลดลูกน้อง แล้วให้บอสมาก่อน
  if(n%5===0){q.length=Math.ceil(q.length/2);q.unshift(pool.boss);if(n>=15)q.push(pool.boss);}
  G.queue=q;G.spawnT=1;
  banner(n%5===0?`🗝️ ชั้น ${n} — ห้องบอส: ${EDEF[pool.boss].name}!`:`🗝️ ดันเจียนชั้น ${n}`,2.8);
}
// เฟสบอส: >66% = 1, >33% = 2, ที่เหลือ = 3
function bossPhase(e,msgs){
  const ph=e.hp>e.maxHp*0.66?1:e.hp>e.maxHp*0.33?2:3;
  if(ph!==e.phase){
    if(e.phase){banner(msgs[ph-1],3.5);emit({k:'phase',x:e.x,y:e.y,n:ph});e.cd2=2;e.cd3=Math.min(e.cd3,4);}
    e.phase=ph;
  }
  return ph;
}
function enemySlam(e,ps,rad,dmg){
  emit({k:'slam',x:e.x,y:e.y,r:rad});
  for(const p of ps){
    if(p.z>2.5)continue;
    const pd=Math.hypot(p.x-e.x,p.y-e.y);
    if(pd<rad+PR){
      damage(p,dmg*G.escale,null,'aoe');
      const a=Math.atan2(p.y-e.y,p.x-e.x);p.vx+=Math.cos(a)*500;p.vy+=Math.sin(a)*500;
    }
  }
}
function updateEnemies(dt){
  const ps=plist().filter(p=>p.alive&&!p.downed);
  for(const e of G.en){
    if(e.dead)continue;
    const D=EDEF[e.type];
    e.cd-=dt;e.cd2-=dt;e.cd3-=dt;e.stun=Math.max(0,e.stun-dt);e.ph+=dt;tickStatus(e,dt);if(e.dead)continue;
    if(e.burn>0){e.burn-=dt;e.bt-=dt;if(e.bt<=0){e.bt=0.5;damage(e,4,e.burnSrc,'burn');if(e.dead)continue;}}
    e.ox=e.x;e.oy=e.y;
    e.x+=e.vx*dt;e.y+=e.vy*dt;const fr=Math.exp(-5*dt);e.vx*=fr;e.vy*=fr;
    let t=null,bd=1e12;
    for(const p of ps){const d=dist2(e,p)+((p.z-(e.h||0))*20)**2;if(d<bd){bd=d;t=p;}}
    for(const m of G.mins)if(!m.dead){const d=dist2(e,m)*1.6;if(d<bd){bd=d;t=m;}}
    if(D.fly&&(!t||e.stun>0))e.h=Math.max(1.5,e.h-(e.stun>0?3:0)*dt);
    if(!t||e.stun>0)continue;
    if(G.mode==='train'&&G.tr&&!G.tr.mai&&e.type!=='dummy')continue;   // ห้องฝึก: มอนสเตอร์ยืนนิ่ง
    if(e.fear>0){const fa=Math.atan2(e.y-e.fearY,e.x-e.fearX),fs=e.spd*G.espd*1.1*dt;e.x+=Math.cos(fa)*fs;e.y+=Math.sin(fa)*fs;continue;}
    if(e.bld>0){const wa=e.ph*3+e.id;e.x+=Math.cos(wa)*e.spd*0.5*dt;e.y+=Math.sin(wa)*e.spd*0.5*dt;continue;}
    const dx=t.x-e.x,dy=t.y-e.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d,sp=e.spd*G.espd*moveMul(e)*(e.root>0?0:1);
    const reach=Math.abs(t.z-(e.h||0))<2.4;
    const move=(k)=>{e.x+=ux*sp*dt*(k||1);e.y+=uy*sp*dt*(k||1);};
    const bite=(dmg,cd)=>{if(d<e.r+PR+6&&reach&&e.cd<=0){e.cd=cd;damage(t,dmg*G.escale,null,'melee');emit({k:'claw',x:t.x,y:t.y,h:t.z+1.1,t:e.type,e:e.id});}};
    switch(e.type){
      case 'gob':if(d>e.r+PR+4)move();bite(D.dmg,0.9);break;
      case 'spl':{
        if(d>e.r+PR+4){const w=Math.sin(e.ph*7)*0.6;e.x+=(ux-uy*w)*sp*dt;e.y+=(uy+ux*w)*sp*dt;}
        bite(D.dmg,0.7);break;}
      case 'wiz':{
        const side=e.id%2?1:-1;
        if(d>380)move();else if(d<250)move(-1);
        else{e.x+=-uy*side*sp*0.5*dt;e.y+=ux*side*sp*0.5*dt;}
        if(e.cd<=0&&d<750&&!(e.sil>0)){e.cd=rnd(1.4,2.1);eShoot(e,'ebolt',t,rnd(-0.06,0.06));}
        break;}
      case 'spider':
        if(e.lunge>0){
          e.lunge-=dt;e.x+=e.lx*720*dt;e.y+=e.ly*720*dt;
          if(!e.bit&&d<e.r+PR+12&&reach){e.bit=1;damage(t,D.dmg*G.escale,null,'melee');emit({k:'claw',x:t.x,y:t.y,h:t.z+1.1,t:'spider',e:e.id});}
        }else{
          if(d>e.r+PR+4)move();
          if(d<320&&e.cd<=0&&reach){e.lunge=0.32;e.lx=ux;e.ly=uy;e.bit=0;e.cd=2.6;emit({k:'lunge',x:e.x,y:e.y});}
          else if(e.cd2<=0&&d>220&&d<750){e.cd2=rnd(3.5,5);eShoot(e,'web',t);}
        }
        break;
      case 'queen':{
        const ph=bossPhase(e,['','🕷️ ราชินีแมงมุมโกรธ! ใยถี่ขึ้น ลูกแมงมุมเยอะขึ้น','💀 ราชินีคลั่ง! กระแทกพื้นรุนแรง ถอยออกจากวงแดง']);
        const big=ph===3?195:150;
        if(e.slam>0){e.slam-=dt;if(e.slam<=0)enemySlam(e,ps,big,D.dmg);}
        else{
          if(d>140)move(ph===3?1.3:1);
          if(d<big+20&&e.cd<=0){e.slam=0.8;e.cd=ph===3?2.2:3;emit({k:'tele',x:e.x,y:e.y,r:big,t:0.8});}
          if(e.cd2<=0&&d<800){e.cd2=ph===1?3.2:2.4;for(const o of (ph===1?[-0.22,0,0.22]:[-0.4,-0.2,0,0.2,0.4]))eShoot(e,'web',t,o);}
          if(e.cd3<=0&&G.en.length<18){e.cd3=ph===1?9:6;for(let i=0;i<(ph===1?3:5);i++)spawnEnemy('spl',e);emit({k:'summon',x:e.x,y:e.y});}
        }
        break;}
      case 'dragon':{
        const ph=bossPhase(e,['','🐉 มังกรบินขึ้นฟ้า! ระวังลูกไฟที่ตกลงมา (ยิงขึ้นฟ้าได้)','🔥 มังกรคลั่ง! เห็นวงแดงใหญ่ให้ยกโล่ หรือขึ้นไม้กวาดหลบคลื่นไฟ']);
        if(e.breath>0){
          e.breath-=dt;e.bt2=(e.bt2||0)-dt;
          if(e.bt2<=0){e.bt2=0.15;for(const p of ps){if(p.z>4.5)continue;const pdx=p.x-e.x,pdy=p.y-e.y,pd=Math.hypot(pdx,pdy);if(pd<430&&Math.abs(angDiff(Math.atan2(pdy,pdx),e.ba))<0.42)damage(p,5*G.escale,null,'aoe');}}
          break;
        }
        if(e.slam>0){e.slam-=dt;if(e.slam<=0)enemySlam(e,ps,175,D.dmg);break;}
        if(ph===2){
          e.air=(e.air===undefined?10:e.air)-dt;
          if(e.air>0){
            e.h+=(11-e.h)*1.5*dt;
            const ox=t.x+Math.cos(e.ph*0.6)*280,oy=t.y+Math.sin(e.ph*0.6)*280,ddx=ox-e.x,ddy=oy-e.y,dd=Math.hypot(ddx,ddy)||1;
            e.x+=ddx/dd*sp*1.7*dt;e.y+=ddy/dd*sp*1.7*dt;
            if(e.cd2<=0){
              e.cd2=1.7;
              for(const q of ps.slice(0,4)){const bx=q.x+q.vx*0.3+rnd(-50,50),by=q.y+rnd(-50,50);G.bombs.push({x:bx,y:by,r:110,t:1.2,dmg:22,low:4});emit({k:'tele',x:bx,y:by,r:110,t:1.2});}
              emit({k:'roar',x:e.x,y:e.y,small:1});
            }
          }else{e.h=Math.max(0,e.h-7*dt);if(e.air<-6)e.air=10;if(e.h<0.5&&d>e.r+PR+10)move();}
        }else{
          e.h=Math.max(0,e.h-7*dt);
          if(d>e.r+PR+10)move(ph===3?1.35:1);
          if(d<210&&e.cd<=0&&reach){e.slam=0.8;e.cd=ph===3?2.2:3;emit({k:'tele',x:e.x,y:e.y,r:175,t:0.8});}
          else if(d<430&&e.cd2<=0){e.breath=1.6;e.ba=Math.atan2(dy,dx);e.cd2=ph===3?4:6;emit({k:'breath',x:e.x,y:e.y,a:Math.round(e.ba*100)/100,t:1.6});}
          if(ph===3){
            if(e.cd3<=0){e.cd3=10;G.bombs.push({x:e.x,y:e.y,r:360,t:1.6,dmg:30,low:2.5});emit({k:'tele',x:e.x,y:e.y,r:360,t:1.6});emit({k:'roar',x:e.x,y:e.y});}
            e.cd4=(e.cd4===undefined?12:e.cd4)-dt;
            if(e.cd4<=0&&G.en.length<16){e.cd4=14;for(let i=0;i<2;i++)spawnEnemy('wiz',e);emit({k:'summon',x:e.x,y:e.y});}
          }
        }
        break;}
      case 'dummy':
        // หุ่นซ้อม: ยิงเวทช้าๆ ให้ฝึก Parry, ฟื้นเลือดเอง
        e.hp=Math.min(e.maxHp,e.hp+12*dt);
        if(e.ax!==undefined){e.x+=(e.ax-e.x)*2*dt;e.y+=(e.ay-e.y)*2*dt;}
        if(e.cd<=0&&d<700&&!(G.tr&&!G.tr.datk)){e.cd=rnd(2.5,3.5);eShoot(e,'ebolt',t);}
        break;
      case 'troll':
        if(e.slam>0){e.slam-=dt;if(e.slam<=0)enemySlam(e,ps,135,D.dmg);}
        else{if(d>110)move();if(d<150&&e.cd<=0){e.slam=0.85;e.cd=2.8;}}
        break;
      case 'pixie':{
        const th=clamp(t.z+1.2,1.5,22);
        e.h+=clamp(th-e.h,-1,1)*6*dt;
        const w=Math.sin(e.ph*4)*0.9;
        if(d>e.r+PR)e.x+=(ux-uy*w)*sp*dt,e.y+=(uy+ux*w)*sp*dt;
        if(d<e.r+PR+10&&Math.abs(cH(t)-e.h)<1.6&&e.cd<=0){e.cd=0.8;damage(t,D.dmg*G.escale,null,'melee');emit({k:'claw',x:t.x,y:t.y,h:t.z+1.1,t:'pixie',e:e.id});}
        break;}
    }
  }
  const en=G.en;
  for(let i=0;i<en.length;i++)for(let j=i+1;j<en.length;j++){
    const a=en[i],b=en[j];
    if(Math.abs((a.h||0)-(b.h||0))>2)continue;
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=a.r+b.r;
    if(d<m&&d>0.01){const o=(m-d)/2,ux=dx/d,uy=dy/d;a.x-=ux*o;a.y-=uy*o;b.x+=ux*o;b.y+=uy*o;}
  }
  for(const e of en){collideWorld(e,e.r,e.h||0);if(TERR&&e.ox!==undefined&&!EDEF[e.type].fly&&(e.h||0)<0.05)terrMove(e,e.ox,e.oy,0,true);}   // ตัวเดินพื้น: ติดพื้น ขึ้นหน้าผาไม่ได้
  G.en=en.filter(e=>!e.dead);
}
