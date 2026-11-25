// Service worker: оболонка застосунку офлайн + кеш переглянутих плиток карти.
// Живі дані (TomTom, КМДА, тривоги) завжди йдуть з мережі; останній знімок зберігає сама сторінка.
const SHELL = 'kd-shell-v1';
const TILES = 'kd-tiles-v1';
const MAX_TILES = 1500;
const SHELL_FILES = [
  './', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== SHELL && k !== TILES).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

async function trimTiles(){
  const c = await caches.open(TILES);
  const keys = await c.keys();
  for(let i = 0; i < keys.length - MAX_TILES; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if(e.request.method !== 'GET') return;

  // плитки OSM: показати з кешу одразу, оновити у фоні
  if(url.hostname.endsWith('tile.openstreetmap.org')){
    e.respondWith(caches.open(TILES).then(async c => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then(r => { if(r.ok || r.type === 'opaque'){ c.put(e.request, r.clone()); trimTiles(); } return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  // оболонка: мережа, а без мережі — кеш
  if(url.origin === location.origin || url.hostname === 'unpkg.com'){
    e.respondWith(fetch(e.request).then(r => {
      if(r.ok){ const cp = r.clone(); caches.open(SHELL).then(c => c.put(e.request, cp)); }
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  }
  // усе інше (API) — без втручання
});
