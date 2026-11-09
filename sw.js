const CACHE_NAME = 'instrumentacao-pro-v1-9-4';
const CORE_ASSETS = [
  './index.html',
  './styles.css',
  './app.js',
  './parshall.js',
  './passwords.js',
  './networks.js',
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
  './parshall_dimensoes.jpg',
  './redes_pa_cabo.webp',
  './redes_pa_terminador.webp',
  './redes_pa_sinal.webp',
  './redes_pa_topologia.webp',
  './redes_dp_01.webp',
  './redes_dp_03.webp',
  './redes_dp_04.webp',
  './redes_dp_05.webp',
  './redes_dp_06.webp',
  './redes_dp_09.webp',
  './redes_dp_10.webp',
  './redes_dp_13.webp',
  './redes_dp_14.webp',
  './redes_dp_15.webp',
  './redes_dp_17.webp',
  './redes_dp_19.webp',
  './redes_dp_21.webp',
  './redes_dp_23.webp',
  './redes_dp_24.webp',
  './redes_dp_28.webp',
  './redes_dp_29.webp',
  './redes_dp_31.webp',
  './redes_dp_32.webp',
  './redes_dp_33.webp',
  './redes_dp_35.webp',
  './redes_dp_37.webp',
  './redes_dp_38.webp',
  './redes_dp_39.webp'
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
