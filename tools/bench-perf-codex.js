// Opt-in diagnostic only. No gameplay changes.
// node tools/headless.js --game --js tools/bench-perf-codex.js --timeout 240 --quiet
window.__benchMap='valley';
window.__benchFrames=360;
window.__benchPaths=[0,1,2,6,7,8,0,1,2,6,7];
const source=await (await fetch('tools/bench-bots.js',{cache:'no-store'})).text();
await eval(source);
const report={...window.__bots,players:Object.keys(WD.G.players).length,
              renderer:WD.gl.getContext().getParameter(WD.gl.getContext().RENDERER)};
if(report.players!==12)throw new Error('PERF_SETUP_WRONG_PLAYER_COUNT '+JSON.stringify(report));
if(report.errs.length||HL.errs.length)throw new Error('PERF_RUNTIME_ERROR '+JSON.stringify(report));
// Frame work is not a measured display FPS; thresholds flag work beyond 30 FPS.
report.pass=report.p95<=33.4&&report.over50===0;
if(!report.pass)throw new Error('PERF_FRAME_BUDGET '+JSON.stringify(report));
return report;
