// ทดสอบเดินในแมพ gorge (headless): เดินจากที่ราบสูงขึ้นสะพาน ข้ามไปอีกฝั่ง + เดินลอดใต้สะพานตามทางดิน + ชนต้นไม้
//   node tools/headless.js --game --url "index.html?nosw&playmap=gorge" --js tools/gorge-walk.js --quiet
for (let i = 0; i < 100 && WD.screen !== 'game'; i++) await HL.sleep(100);
await HL.sleep(1500); HL.freeze();
for (let i = 0; i < 600 && WD.G.ph !== 'play'; i++) HL.step(1);
if (WD.G.tr) WD.G.tr.datk = 0;
HL.step(30);
const me = HL.me(), out = [];
const place = (x, z, yawDeg) => { me.x = x * 20; me.y = z * 20; me.vx = me.vy = 0; me.z = 0; me.vz = 0; me.inv = 99; HL.aim(yawDeg * Math.PI / 180); HL.step(20); };
const walk = (frames, key = 'u') => { HL.input({ [key]: 1 }); const tr = []; for (let i = 0; i < frames; i++) { HL.step(1); if (i % 30 === 29) tr.push([+(me.x / 20).toFixed(1), +(me.y / 20).toFixed(1), +(me.z || 0).toFixed(2)]); } HL.input({ [key]: 0 }); return tr; };
const gz = (x, z) => +WD.terrT(x * 20, z * 20).toFixed(2);
// 1) ฝั่งตะวันตกของสะพาน เดินไปทางตะวันออก (yaw 0 = +x)
place(66, 45, 0); out.push({ test: 'W→E over bridge (start 66,45)', ground: gz(66, 45), trace: walk(330) });
// 2) เดินกลับจากตะวันออก
place(106, 45, 180); out.push({ test: 'E→W over bridge (start 106,45)', ground: gz(106, 45), trace: walk(330) });
// 3) ใต้สะพาน: เดินจากใต้ไปเหนือตามทางดิน (yaw -90 = -z)
place(86, 58, -90); out.push({ test: 'south→north under bridge (start 86,58)', trace: walk(300) });
return { out, errs: HL.errs, deckTop: gz(86, 45), floorUnder: gz(86, 45) };
