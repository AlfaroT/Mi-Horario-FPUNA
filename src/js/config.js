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
    
    // Si el pathname comienza con el nombre del repositorio (formato /repo-name/)
    const pathParts = pathname.split('/').filter(part => part.length > 0);
    
    if (pathParts.length >= 1) {
        // El primer segmento después del dominio es el nombre del repositorio
        const repoName = pathParts[0];
        
        // Verificar si parece ser un nombre de repositorio válido
        if (repoName && repoName !== 'index.html' && !repoName.includes('.')) {
            return `/${repoName}/`;
        }
    }
    
    // Por defecto, usar ruta relativa
    return './';
}

// Configuración global
const AppConfig = {
    // Base URL dinámico
    baseUrl: getBaseUrl(),
    
    // URLs para la PWA
    manifestUrl: function() {
        return this.baseUrl + 'public/manifest.json';
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