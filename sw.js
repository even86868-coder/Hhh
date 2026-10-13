// Offline cache: the whole game is static files.
const CACHE = 'runelords-v4';
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/main.js', './js/ui.js', './js/game.js', './js/story.js', './js/rules.js', './js/dice.js', './js/combat.js',
  './js/ai.js', './js/spells.js', './js/monsters.js', './js/maps.js', './js/sprites.js', './js/render.js', './js/audio.js',
  './js/dialogue.js', './js/voice.js', './js/talk.js', './js/aibanter.js', './js/vendor/anthropic-sdk.js', './js/gm.js', './js/voicekey.js', './js/dialogue_more.js',
  './js/story_sandpoint.js', './js/story_companions.js', './js/story_thistletop.js', './voices/index.json', './art/index.json', './js/art.js', './js/speakers.js',
  './icons/icon-192.png', './icons/icon-512.png',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Network first (so updates show up), falling back to cache when offline.
  e.respondWith(fetch(e.request).then((res) => {
    const copy = res.clone();
    if (res.ok || res.type === 'opaque') caches.open(CACHE).then((c) => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match(e.request)));
});
