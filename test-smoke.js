#!/usr/bin/env node

/**
 * Prueba de humo para Mi Horario FPUNA en GitHub Pages
 * Verifica que la aplicación esté desplegada correctamente y que los archivos críticos sean accesibles
 */

const https = require('https');

const BASE_URL = 'https://alfarot.github.io/Mi-Horario-FPUNA';
const TIMEOUT = 10000; // 10 segundos

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: TIMEOUT }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    url: url,
                    data: data.length > 100 ? data.substring(0, 100) + '...' : data
                });
            });
        });

        req.on('error', (err) => reject({ url, error: err.message }));
        req.on('timeout', () => {
            req.destroy();
            reject({ url, error: 'Timeout after ' + TIMEOUT + 'ms' });
        });
    });
}

async function runSmokeTest() {
    console.log('🚀 Iniciando prueba de humo para Mi Horario FPUNA...');
    console.log('📍 URL base:', BASE_URL);
    console.log('');

    const tests = [
        { name: 'Página principal', url: BASE_URL + '/' },
        { name: 'Manifest PWA', url: BASE_URL + '/manifest.json' },
        { name: 'Service Worker', url: BASE_URL + '/sw.js' },
        { name: 'Archivo principal CSS', url: BASE_URL + '/dist/output.css' },
        { name: 'Archivo principal JS', url: BASE_URL + '/src/js/main.js' },
        { name: 'Icono 192x192', url: BASE_URL + '/public/icons/icon-192x192.png' },
        { name: 'Icono 512x512', url: BASE_URL + '/public/icons/icon-512x512.png' }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            console.log(`🔍 Probando: ${test.name}`);
            const result = await makeRequest(test.url);

            if (result.status === 200) {
                console.log(`✅ ${test.name}: OK (${result.status})`);
                passed++;
            } else {
                console.log(`❌ ${test.name}: Error ${result.status}`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ ${test.name}: Error - ${error.error || error.message}`);
            failed++;
        }
        console.log('');
    }

    console.log('📊 Resultados:');
    console.log(`✅ Pasaron: ${passed}`);
    console.log(`❌ Fallaron: ${failed}`);
    console.log(`📈 Tasa de éxito: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('');
        console.log('🎉 ¡Todas las pruebas pasaron! La aplicación está desplegada correctamente.');
        console.log('📱 Puedes proceder a instalar la PWA desde:', BASE_URL);
    } else {
        console.log('');
        console.log('⚠️  Algunas pruebas fallaron. Revisa el despliegue en GitHub Pages.');
        process.exit(1);
    }
}

// Ejecutar la prueba
runSmokeTest().catch((error) => {
    console.error('💥 Error fatal en la prueba de humo:', error);
    process.exit(1);
});