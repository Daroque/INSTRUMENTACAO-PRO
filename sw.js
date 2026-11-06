const CACHE_NAME = 'instrumentacao-pro-v1-8-4';
const CORE_ASSETS = [
  './index.html',
  './styles.css',
  './app.js',
  './parshall.js',
  './passwords.js',
  './manifest.webmanifest'
];
const OPTIONAL_ASSETS = [
  './icon-192.png',
  './icon-512.png',
  './optiflux_page2.png',
  './optiflux_page3.png',
  './range_hl_reference.png',
  './transmitter_cell_reference.png',
  './app_logo.png',
  './parshall_funcionamento.webp',
  './parshall_dimensoes.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Arquivos essenciais: a instalação falha somente se faltar um deles.
    await cache.addAll(CORE_ASSETS);
    // Imagens opcionais não devem impedir a atualização do aplicativo.
    await Promise.allSettled(OPTIONAL_ASSETS.map(asset => cache.add(asset)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('instrumentacao-pro-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(self.registration.scope.replace(self.location.origin, ''))) return;

  // Navegação: preferir versão publicada, com fallback offline.
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, {cache: 'no-store'});
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('./index.html', response.clone());
        }
        return response;
      } catch (_) {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Recursos locais: revalidar na rede quando disponível.
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request, {cache: 'no-store'});
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch (_) {
      return (await caches.match(event.request)) || Response.error();
    }
  })());
});
