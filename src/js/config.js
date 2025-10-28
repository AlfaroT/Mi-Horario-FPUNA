/**
 * Configuración dinámica para la aplicación
 * Detecta automáticamente el base URL para GitHub Pages y otros entornos
 */

// Función para detectar el base URL dinámicamente
function getBaseUrl() {
    // Si estamos en el dominio principal (desarrollo local o dominio personalizado)
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        !window.location.hostname.includes('github.io')) {
        return './';
    }
    
    // Para GitHub Pages, extraer el nombre del repositorio del pathname
    const pathname = window.location.pathname;
    const hostname = window.location.hostname;

    // Para GitHub Pages, la URL base debe ser el nombre del repositorio
    // Ejemplo: https://alfarot.github.io/Mi-Horario-FPUNA/
    if (hostname.includes('github.io')) {
        // Extraer el nombre del repositorio del pathname
        // Para GitHub Pages, la URL base debe ser el nombre del repositorio
        // Ejemplo: https://alfarot.github.io/Mi-Horario-FPUNA/
        // Aseguramos que siempre sea el primer segmento del pathname, ignorando cualquier /public/
        const pathSegments = pathname.split('/').filter(segment => segment.length > 0);
        
        if (pathSegments.length > 0) {
            // El nombre del repositorio es el primer segmento.
            // Esto asegura que, incluso si la URL es /Mi-Horario-FPUNA/public/,
            // el baseUrl sea /Mi-Horario-FPUNA/
            return `/${pathSegments[0]}/`;
        }
        // Si no hay segmentos, estamos en la raíz del dominio de usuario (ej. alfarot.github.io)
        return '/';
    }
    
    // Para desarrollo local o dominios personalizados, usar ruta relativa
    return './';
}

// Configuración global
const AppConfig = {
    // Base URL dinámico
    baseUrl: getBaseUrl(),
    
    // URLs para la PWA
    manifestUrl: function() {
        return this.baseUrl + 'manifest.json';
    },
    
    serviceWorkerUrl: function() {
        return this.baseUrl + 'sw.js';
    },
    
    // URLs para recursos estáticos
    getAssetUrl: function(relativePath) {
        // Si la ruta ya comienza con ./ o /, devolverla como está
        if (relativePath.startsWith('./') || relativePath.startsWith('/')) {
            return relativePath;
        }
        
        // Si no, anteponer el base URL
        return this.baseUrl + relativePath;
    },
    
    // URLs para navegación interna
    getInternalUrl: function(hash = '') {
        const url = this.baseUrl;
        return hash ? url + '#' + hash : url;
    },
    
    // Información del entorno
    environment: function() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'development';
        } else if (window.location.hostname.includes('github.io')) {
            return 'github-pages';
        } else {
            return 'production';
        }
    },
    
    // Depuración
    isDebugMode: function() {
        return this.environment() === 'development' || 
               window.location.search.includes('debug=true');
    }
};

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
} else {
    window.AppConfig = AppConfig;
}

// Inicialización y logging en modo debug
if (AppConfig.isDebugMode()) {
    console.log('🔧 AppConfig inicializado:', {
        baseUrl: AppConfig.baseUrl,
        environment: AppConfig.environment(),
        manifestUrl: AppConfig.manifestUrl(),
        serviceWorkerUrl: AppConfig.serviceWorkerUrl()
    });
}