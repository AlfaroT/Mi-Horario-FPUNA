// Service Worker para Mi Horario FPUNA
// Versión: 1.2.0 - Corrección completa de rutas para GitHub Pages PWA

const CACHE_NAME = 'mi-horario-fpuna-v1.2.0'; // Incrementado para forzar actualización
const BASE_PATH = '/Mi-Horario-FPUNA/'; // Path base para GitHub Pages

const ASSETS_TO_CACHE = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'dist/output.css',
    BASE_PATH + 'src/css/styles.css',
    BASE_PATH + 'src/js/config.js',
    BASE_PATH + 'src/js/main.js',
    BASE_PATH + 'src/js/ui.js',
    BASE_PATH + 'src/js/state.js',
    BASE_PATH + 'src/js/parser.js',
    BASE_PATH + 'src/js/tasks.js',
    BASE_PATH + 'src/js/dom.js',
    BASE_PATH + 'src/js/filters.js',
    BASE_PATH + 'src/js/utils.js',
    BASE_PATH + 'src/js/date-fns.min.js',
    BASE_PATH + 'manifest.json',
    BASE_PATH + 'public/favicon.ico',
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

// Fetch - Estrategia Cache-First con Network Fallback y manejo mejorado de rutas
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Ignorar requests que no sean GET
    if (request.method !== 'GET') return;
    
    // Manejo especial para navegación HTML (para GitHub Pages)
    const isNavigationRequest = request.mode === 'navigate' ||
                               (request.headers.get('accept').includes('text/html') &&
                                !request.url.includes('api.'));
    
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

                    // Cachear la respuesta para uso futuro (solo recursos locales)
                    if (!request.url.startsWith('http')) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }

                    return networkResponse;
                }).catch((error) => {
                    console.error('[SW] Error en fetch:', request.url, error);
                    
                    // Si es una solicitud de navegación y falla, servir index.html
                    if (isNavigationRequest) {
                        return caches.match(BASE_PATH + 'index.html').then((cachedIndex) => {
                            if (cachedIndex) {
                                return cachedIndex;
                            }
                            // Si ni siquiera index.html está en cache, mostrar página offline
                            return new Response(
                                '<html><body><h1>Sin conexión</h1><p>Por favor, verifica tu conexión a internet.</p></body></html>',
                                { headers: { 'Content-Type': 'text/html' } }
                            );
                        });
                    }
                    
                    // Para otros recursos HTML, mostrar página offline básica
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
