// Castle Strike bridge shell layout -> Blender (assets/src/fcs_bridge_build.py). Run when the bridge (js/02-fcs.js) or BSKV changes:
//   node tools/headless.js --game --js tools/fcs-bridge-export.js --quiet   (writes shots/fcs_bridge_layout.json, copy it to assets/src/)
//   D:/Blender/blender.exe -b --python assets/src/fcs_bridge_build.py
document.getElementById('btnSolo').click();
for(let i=0;i<40&&WD.screen!=='lobby';i++)await HL.sleep(100);
WD.G.mode='siege';WD.lobbyBotAdd(-1,1);WD.hostStart();
for(let i=0;i<80&&WD.screen!=='game';i++)await HL.sleep(100);
await HL.sleep(300);
return {files:{'fcs_bridge_layout.json':JSON.stringify(WD.bskExport())}};
