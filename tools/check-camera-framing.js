// กล้องจริง: FOV/สัดส่วนจอ, การย้ายตัว, เข้าห้องแคบ และเส้นเล็งไม่ชนตัวเรา
// node tools/headless.js --game --js tools/check-camera-framing.js --timeout 180 --quiet
// ?camPath=6 ตรวจมุมกลางยกสูงของ Earth; ค่าเริ่มต้นตรวจ Pyro พร้อมยิงจริงระยะใกล้/ไกล
const path=Number(new URLSearchParams(location.search).get('camPath')||0);
await HL.solo({kit:String(path)});await HL.sleep(1200);HL.step(90);
const T=WD.THREE,cam=WD.cam,me=HL.me(),origin={x:HL.me().x,y:HL.me().y},fail=[],cases=[],shots=[];
const input=document.createElement('input');input.type='range';input.min=50;input.max=95;input.dataset.set='fov';document.getElementById('settings').appendChild(input);
const ray=new T.Raycaster();
function check(label){
 const o=HL.o(),p=o.g.position.clone().add(new T.Vector3(0,1.5,0)).project(cam);
 ray.setFromCamera(new T.Vector2(0,0),cam);
 const hits=ray.intersectObject(o.fileModel||o.g,true).filter(h=>{for(let n=h.object;n;n=n.parent)if(!n.visible)return false;return [].concat(h.object.material||[]).some(m=>m.visible&&m.opacity>0.5);});
 const sx=(p.x+1)/2;cases.push({label,screenX:+sx.toFixed(3),bodyHits:hits.length});
 if((path===6?(sx<0.47||sx>0.53):(sx<0.25||sx>0.42))||hits.length)fail.push({label,screenX:sx,bodyHits:hits.length});
}
for(const fov of [50,62,95])for(const aspect of [4/3,16/9,21/9])for(const pitch of [-0.25,0.3,1.15]){
 input.value=fov;input.dispatchEvent(new Event('input',{bubbles:true}));cam.aspect=aspect;cam.updateProjectionMatrix();
 HL.aim(0,pitch);HL.step(24);if(Math.abs(cam.fov-fov)>0.1)fail.push({label:'FOV setting not applied',expected:fov,actual:cam.fov});check(fov+'deg '+aspect.toFixed(2)+' pitch '+pitch);
 await HL.sleep(0);
}
input.value=62;input.dispatchEvent(new Event('input',{bubbles:true}));cam.aspect=16/9;cam.updateProjectionMatrix();HL.aim(0,0.12);HL.step(30);
const start=cam.position.clone();me.x+=500;HL.step(2);
const moved=cam.position.clone().sub(start);if(Math.abs(moved.x-25)>0.1||Math.abs(moved.z)>0.1)fail.push({label:'dash translation',moved:moved.toArray()});
// บ้านหลังแรกของ genTest: (400,2370), w170,d135,ry0 (หน่วย px); ไม่ teleport ใส่ผนัง
me.x=400;me.y=2370;me.z=0;me.vx=me.vy=0;HL.aim(0,0.12);HL.step(2);
// แผนที่ห้องฝึกปัจจุบัน 7200×5400; เทียบกลับเป็นพิกัดเกม
const room={x:cam.position.x*20+3600,y:cam.position.z*20+2700,h:cam.position.y};
if(room.x<328-0.1||room.x>472+0.1||room.y<2315.5-0.1||room.y>2424.5+0.1||room.h>5.48)fail.push({label:'camera enters room outside wall',room});
HL.step(30);
// ยิงจริงไปยังหุ่นที่เส้นกลางจอผ่าน ระยะใกล้/ไกล: ตรวจ parallax หลังขยับไหล่
for(const test of path===6?[]:[{dx:55,pitch:0.6},{dx:240,pitch:0.12}]){   // กล้องก้มให้เส้นเล็งผ่านลำตัวหุ่นสูง1ม. ทั้งสองระยะ
 me.x=origin.x;me.y=origin.y;me.z=0;me.vx=me.vy=0;HL.aim(0,test.pitch);HL.step(30);
 const d=cam.getWorldDirection(new T.Vector3()),t=(WD.tx(me.x)+test.dx/20-cam.position.x)/d.x;
 const dz=(cam.position.z+d.z*t-WD.tz(me.y))*20,foe=HL.dummy(test.dx,dz),hp=foe.hp;
 foe.x=foe.ax=me.x+test.dx;foe.y=foe.ay=me.y+dz;
 HL.step(4);me.cd.basic=0;HL.input({fire:1});HL.step(8);HL.input({fire:0});
 let minHp=hp;for(let i=0;i<40;i++){HL.step(1);minHp=Math.min(minHp,foe.hp);}   // หุ่นคืนเลือด12/วิ ต้องจับตอนโดน ไม่รอดูแค่เฟรมสุดท้าย
 shots.push({range:test.dx,damage:hp-minHp});if(!(minHp<hp))fail.push({label:'crosshair shot missed',range:test.dx,hpBefore:hp,minHp,aim:[WD.INPUT.ax,WD.INPUT.ay,WD.INPUT.ah],target:[foe.x,foe.y],ang:me.ang});
}
const errors=[...new Set(HL.errs)];input.remove();
if(fail.length||errors.length)throw new Error('CAMERA_FRAMING '+JSON.stringify({fail,errors,cases}));
return {pass:true,cases:cases.length,bodyHits:0,room,shots,errors};
