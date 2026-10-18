// Service Worker ของ Wizard Duel — เก็บไฟล์ไว้ในเครื่อง ให้เปิดครั้งต่อไปเร็วขึ้น / เล่นคนเดียวได้แม้เน็ตหลุด
// เวอร์ชันแคชมาจาก ?v=<PREFIX> ตอน register (index.html) — เปลี่ยน PREFIX = ล้างแคชเก่าทั้งหมด
// กลยุทธ์:
//   หน้าเว็บ (index.html ฯลฯ)       → network-first (ได้โค้ดใหม่เสมอ ถ้าเน็ตหลุดใช้ของในแคช)
//   unpkg (ระบุเวอร์ชันตายตัว), ฟอนต์ → cache-first (ไฟล์ไม่เปลี่ยน)
//   ไฟล์ในเว็บเรา (audio/ icons/ assets/) → stale-while-revalidate (ใช้ของในแคชทันที แล้วอัปเดตเบื้องหลัง)
//   assets/manifest.json                → network-first (รู้ทันทีว่ามีโมเดลเวอร์ชันใหม่)
//   คำขอแบบ Range (เพลงที่สตรีมผ่าน <audio>) / PeerJS / อื่นๆ → ไม่ยุ่ง ปล่อยให้เบราว์เซอร์จัดการ
const VER = new URL(self.location).searchParams.get('v') || 'dev';
const CACHE = 'wd-' + VER;
const IMMUTABLE = ['unpkg.com', 'fonts.gstatic.com'];
const REVALIDATE = ['fonts.googleapis.com'];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('wd-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// หน้าเว็บส่งรายการไฟล์ที่โหลดไปแล้วตอนเปิดครั้งแรก (ก่อน SW จะคุมหน้า) มาให้เก็บลงแคช
self.addEventListener('message', e => {
  const d = e.data;
  if (!d || d.t !== 'warm' || !Array.isArray(d.urls)) return;
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    for (const u of d.urls) {
      try {
        const url = new URL(u, self.location);
        if (!kind(url) || url.pathname.includes('/audio/music/')) continue;
        const key = keyOf(url);
        if (await c.match(key)) continue;
        const r = await fetch(url.href, { credentials: 'omit' });
        if (r.ok && !r.redirected) await c.put(key, r);
      } catch (err) {}
    }
  })());
});

function kind(url) {
  if (url.origin === self.location.origin) return 'self';
  if (IMMUTABLE.includes(url.hostname)) return 'immutable';
  if (REVALIDATE.includes(url.hostname)) return 'revalidate';
  return null;
}
function keyOf(url) {
  // ?v=N ที่ใช้หลบแคชตอนทดสอบ ไม่ต้องแยกเก็บ — ยกเว้นไฟล์ใน assets/ ที่ ?v= คือเวอร์ชันจริงจาก manifest
  const u = new URL(url.href);
  if (u.origin === self.location.origin && !u.pathname.includes('/assets/')) u.search = '';
  return u.href;
}
function storable(r) { return r && (r.ok || r.type === 'opaque') && r.status !== 206; }

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
  if (req.mode === 'navigate' || (url.origin === self.location.origin && url.pathname.endsWith('/assets/manifest.json'))) { e.respondWith(networkFirst(req, url)); return; }
  const k = kind(url);
  if (!k) return;
  if (k === 'immutable') e.respondWith(cacheFirst(req, url));
  else e.respondWith(staleWhileRevalidate(req, url, e));
});

async function networkFirst(req, url) {
  const c = await caches.open(CACHE), key = keyOf(url);
  try {
    const r = await fetch(req);
    if (storable(r)) c.put(key, r.clone());
    return r;
  } catch (err) {
    return (await c.match(key)) || (await c.match(new URL('./', self.location).href)) || Response.error();
  }
}
async function cacheFirst(req, url) {
  const c = await caches.open(CACHE), key = keyOf(url);
  const hit = await c.match(key);
  if (hit) return hit;
  const r = await fetch(req);
  if (storable(r)) c.put(key, r.clone());
  return r;
}
async function staleWhileRevalidate(req, url, e) {
  const c = await caches.open(CACHE), key = keyOf(url);
  const hit = await c.match(key);
  const net = fetch(req).then(r => { if (storable(r)) c.put(key, r.clone()); return r; });
  if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
  return net;
}
