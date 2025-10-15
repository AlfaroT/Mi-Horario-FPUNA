// Service Worker para Mi Horario FPUNA
// Versión: 1.0.4 - Usando date-fns local

const CACHE_NAME = 'mi-horario-fpuna-v1.0.4';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './dist/output.css',
    './src/css/styles.css',
    './src/js/main.js',
    './src/js/ui.js',
    './src/js/state.js',
    './src/js/parser.js',
    './src/js/tasks.js',
    './src/js/dom.js',
    './src/js/filters.js',
    './src/js/utils.js',
    './src/js/date-fns.min.js',
    './public/manifest.json',
    // CDNs - se cachean después de la primera carga
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js'
];

// Instalación - Cachear recursos críticos
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Cacheando archivos críticos');
                // Cachear solo archivos locales primero (más rápido)
                const localAssets = ASSETS_TO_CACHE.filter(url => !url.startsWith('http'));
                return cache.addAll(localAssets);
            })
            .then(() => self.skipWaiting())
    );
});

// Activación - Limpiar caches antiguas
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Eliminando cache antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - Estrategia Cache-First con Network Fallback
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Ignorar requests que no sean GET
    if (request.method !== 'GET') return;
    
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[SW] Sirviendo desde cache:', request.url);
                    // Actualizar cache en background si es CDN
                    if (request.url.startsWith('http')) {
                        fetch(request).then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(request, networkResponse);
                                });
                            }
                        }).catch(() => {});
                    }
                    return cachedResponse;
                }

                // No está en cache, descargar de red
                console.log('[SW] Descargando de red:', request.url);
                return fetch(request).then((networkResponse) => {
                    // Solo cachear respuestas exitosas
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
                        return networkResponse;
                    }

                    // Cachear la respuesta para uso futuro
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });

                    return networkResponse;
                }).catch((error) => {
                    console.error('[SW] Error en fetch:', request.url, error);
                    // Si falla y es HTML, mostrar página offline básica
                    if (request.headers.get('accept').includes('text/html')) {
                        return new Response(
                            '<html><body><h1>Sin conexión</h1><p>Por favor, verifica tu conexión a internet.</p></body></html>',
                            { headers: { 'Content-Type': 'text/html' } }
                        );
                    }
                    throw error;
                });
            })
    );
});

// Mensajes desde la app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
