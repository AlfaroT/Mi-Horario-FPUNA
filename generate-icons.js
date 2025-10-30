#!/usr/bin/env node

/**
 * Generador de iconos PWA
 * Convierte SVG a PNG en múltiples tamaños para mejor compatibilidad
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [96, 128, 192, 384, 512];
const inputSvg = path.join(__dirname, 'public', 'icons', 'icon.svg');
const outputDir = path.join(__dirname, 'public', 'icons');

async function generateIcons() {
    console.log('🎨 Generando iconos PWA...');

    // Verificar que el SVG existe
    if (!fs.existsSync(inputSvg)) {
        console.error('❌ No se encontró el archivo SVG:', inputSvg);
        process.exit(1);
    }

    // Crear directorio de salida si no existe
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generar PNGs para cada tamaño
    for (const size of sizes) {
        const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

        try {
            await sharp(inputSvg)
                .resize(size, size)
                .png()
                .toFile(outputPath);

            console.log(`✅ Generado: icon-${size}x${size}.png`);
        } catch (error) {
            console.error(`❌ Error generando icon-${size}x${size}.png:`, error.message);
        }
    }

    console.log('\n🎉 ¡Iconos generados exitosamente!');
    console.log('📁 Archivos creados en:', outputDir);
}

generateIcons().catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
});