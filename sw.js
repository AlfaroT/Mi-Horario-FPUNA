// Service Worker para Mi Horario FPUNA
// Versión: 1.3.1 - Share feature

const CACHE_NAME = 'mi-horario-fpuna-v1.3.1';

// Detectar si estamos en GitHub Pages o localhost
const isGitHubPages = self.location.hostname.includes('github.io');
const BASE_PATH = isGitHubPages ? '/Mi-Horario-FPUNA/' : '/';

// Assets locales (relativos)
const LOCAL_ASSETS = [
    '',
    'index.html',
    'dist/output.css',
    'src/css/styles.css',
    'src/js/config.js',
    'src/js/main.js',
    'src/js/ui.js',
    'src/js/state.js',
    'src/js/parser.js',
    'src/js/tasks.js',
    'src/js/dom.js',
    'src/js/filters.js',
    'src/js/utils.js',
    'src/js/calendar.js',
    'src/js/share.js',
    'src/js/date-fns.min.js',
    'manifest.json'
];

// CDNs externos
const CDN_ASSETS = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js'
];

// Instalación - Cachear recursos críticos
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Cacheando archivos locales...');
                // Construir URLs completas para assets locales
                const localUrls = LOCAL_ASSETS.map(asset => BASE_PATH + asset);
                
                // Cachear uno por uno para evitar errores si alguno falla
                return Promise.allSettled(
                    localUrls.map(url => 
                        cache.add(url).catch(err => {
                            console.warn('[SW] No se pudo cachear:', url);
                            return null;
                        })
                    )
                );
            })
            .then(() => {
                console.log('[SW] Cache inicial completado');
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('[SW] Error en instalación:', err);
            })
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
    
    // Ignorar extensiones de Chrome y otros esquemas no soportados
    if (request.url.startsWith('chrome-extension://') || 
        request.url.startsWith('moz-extension://') ||
        request.url.startsWith('safari-extension://') ||
        !request.url.startsWith('http')) {
        return;
    }
    
    // Manejo especial para navegación HTML (para GitHub Pages)
    const isNavigationRequest = request.mode === 'navigate' ||
                               (request.headers.get('accept')?.includes('text/html') &&
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
