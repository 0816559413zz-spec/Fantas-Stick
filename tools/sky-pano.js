// Sky panorama: bakes SKY.clear (WD.skyBake, options window.__skyo) and saves the upper half as shots/<__skytag||sky_pano>.jpg
// Run: node tools/headless.js --game --js tools/sky-pano.js --quiet
for (let i = 0; i < 150 && !(window.WD && WD.SKYC); i++) await HL.sleep(100);
const t = WD.skyBake(window.__skyo || {}), rt = t.userData.rt, W = 2048, H = 1024, px = new Uint8Array(W * H * 4);
WD.gl.readRenderTargetPixels(rt, 0, 0, W, H, px);
const c = document.createElement('canvas'); c.width = W; c.height = H / 2; const g = c.getContext('2d'), im = g.createImageData(W, H / 2);
for (let y = 0; y < H / 2; y++) { const sy = H - 1 - y; im.data.set(px.subarray(sy * W * 4, sy * W * 4 + W * 4), y * W * 4); }   // top half (above horizon), flip
g.putImageData(im, 0, 0);
const o = document.createElement('canvas'); o.width = 1600; o.height = 400; o.getContext('2d').drawImage(c, 0, 0, 1600, 400);
return { images: { [window.__skytag || 'sky_pano']: o.toDataURL('image/jpeg', 0.9) } };
