const VERSION='super-soccer-9e5d6ef89370';
const DEV=VERSION.includes('__BUILD_'+'VERSION__');
const ASSETS=["./","./arcade.css","./assets/arcade-stadium.png","./assets/fonts/LICENSE.txt","./assets/fonts/arcade-display.woff","./assets/icon.svg","./assets/stadium.svg","./index.html","./manifest.webmanifest","./src/app.js","./src/arcade-art.js","./src/audio.js","./src/career.js","./src/competitions.js","./src/data.js","./src/entities.js","./src/match.js","./src/negotiations.js","./src/physics.js","./src/render.js","./src/simulation.js","./src/storage.js","./src/ui.js","./src/utils.js","./styles.css"]['./','./index.html','./styles.css','./manifest.webmanifest','./assets/icon.svg','./assets/stadium.svg','./src/app.js','./src/ui.js','./src/utils.js','./src/data.js','./src/career.js','./src/competitions.js','./src/simulation.js','./src/storage.js','./src/match.js','./src/entities.js','./src/physics.js','./src/render.js','./src/audio.js'];
self.addEventListener('install',event=>event.waitUntil(DEV?self.skipWaiting():caches.open(VERSION).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('super-soccer-')&&key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 if(DEV)return;
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 if(event.request.mode==='navigate')event.respondWith(fetch(event.request).catch(()=>caches.match('./index.html')));
 else event.respondWith(caches.match(event.request).then(cached=>cached??fetch(event.request)));
});
