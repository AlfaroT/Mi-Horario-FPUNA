#!/usr/bin/env node

/**
 * Test script para validar manifest.json de PWA
 * Verifica que los íconos existen y las rutas son correctas
 */

const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testManifest() {
  log('\n🔍 Iniciando validación de PWA manifest...\n', 'cyan');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Verificar que manifest.json existe
  totalTests++;
  log('Test 1: Verificar existencia de manifest.json', 'blue');
  if (fs.existsSync('manifest.json')) {
    log('✅ PASS: manifest.json existe', 'green');
    passedTests++;
  } else {
    log('❌ FAIL: manifest.json no existe', 'red');
    failedTests++;
    return;
  }

  // Test 2: Verificar que public/manifest.json existe
  totalTests++;
  log('\nTest 2: Verificar existencia de public/manifest.json', 'blue');
  if (fs.existsSync('public/manifest.json')) {
    log('✅ PASS: public/manifest.json existe', 'green');
    passedTests++;
  } else {
    log('❌ FAIL: public/manifest.json no existe', 'red');
    failedTests++;
  }

  // Leer y parsear manifest.json
  let manifest;
  try {
    const manifestContent = fs.readFileSync('manifest.json', 'utf8');
    manifest = JSON.parse(manifestContent);
  } catch (error) {
    log(`❌ FAIL: Error al parsear manifest.json: ${error.message}`, 'red');
    return;
  }

  // Test 3: Verificar sintaxis JSON válida
  totalTests++;
  log('\nTest 3: Verificar sintaxis JSON válida', 'blue');
  log('✅ PASS: manifest.json es JSON válido', 'green');
  passedTests++;

  // Test 4: Verificar que existe la sección icons
  totalTests++;
  log('\nTest 4: Verificar sección "icons" existe', 'blue');
  if (manifest.icons && Array.isArray(manifest.icons)) {
    log(`✅ PASS: Sección icons existe con ${manifest.icons.length} íconos`, 'green');
    passedTests++;
  } else {
    log('❌ FAIL: Sección icons no existe o no es un array', 'red');
    failedTests++;
    return;
  }

  // Test 5: Verificar tamaños requeridos
  totalTests++;
  log('\nTest 5: Verificar tamaños estándar (96, 128, 192, 384, 512)', 'blue');
  const requiredSizes = ['96x96', '128x128', '192x192', '384x384', '512x512'];
  const foundSizes = manifest.icons.map(icon => icon.sizes);
  const missingSizes = requiredSizes.filter(size => !foundSizes.includes(size));
  
  if (missingSizes.length === 0) {
    log(`✅ PASS: Todos los tamaños requeridos están presentes`, 'green');
    passedTests++;
  } else {
    log(`❌ FAIL: Faltan tamaños: ${missingSizes.join(', ')}`, 'red');
    failedTests++;
  }

  // Test 6: Verificar que todos los íconos tienen type: image/png
  totalTests++;
  log('\nTest 6: Verificar type="image/png" en todos los íconos', 'blue');
  const iconsWithoutType = manifest.icons.filter(icon => icon.type !== 'image/png');
  
  if (iconsWithoutType.length === 0) {
    log('✅ PASS: Todos los íconos tienen type="image/png"', 'green');
    passedTests++;
  } else {
    log(`❌ FAIL: ${iconsWithoutType.length} íconos sin type correcto`, 'red');
    failedTests++;
  }

  // Test 7: Verificar que los archivos de íconos existen
  totalTests++;
  log('\nTest 7: Verificar existencia física de archivos de íconos', 'blue');
  let missingIcons = [];
  
  for (const icon of manifest.icons) {
    // Remover query string (ej: ?v=1.2.2)
    const iconPath = icon.src.split('?')[0];
    
    if (!fs.existsSync(iconPath)) {
      missingIcons.push(iconPath);
      log(`  ❌ No encontrado: ${iconPath}`, 'red');
    } else {
      log(`  ✅ Encontrado: ${iconPath}`, 'green');
    }
  }
  
  if (missingIcons.length === 0) {
    log('✅ PASS: Todos los archivos de íconos existen', 'green');
    passedTests++;
  } else {
    log(`❌ FAIL: ${missingIcons.length} archivos de íconos no encontrados`, 'red');
    failedTests++;
  }

  // Test 8: Verificar shortcuts
  totalTests++;
  log('\nTest 8: Verificar shortcuts tienen íconos con type', 'blue');
  if (manifest.shortcuts && Array.isArray(manifest.shortcuts)) {
    let shortcutsValid = true;
    
    for (const shortcut of manifest.shortcuts) {
      if (!shortcut.icons || !Array.isArray(shortcut.icons)) {
        log(`  ❌ Shortcut "${shortcut.name}" sin íconos`, 'red');
        shortcutsValid = false;
        continue;
      }
      
      for (const icon of shortcut.icons) {
        if (!icon.type || icon.type !== 'image/png') {
          log(`  ❌ Shortcut "${shortcut.name}" sin type en ícono`, 'red');
          shortcutsValid = false;
        } else {
          log(`  ✅ Shortcut "${shortcut.name}" tiene type="image/png"`, 'green');
        }
      }
    }
    
    if (shortcutsValid) {
      log('✅ PASS: Todos los shortcuts tienen type correcto', 'green');
      passedTests++;
    } else {
      log('❌ FAIL: Algunos shortcuts tienen problemas', 'red');
      failedTests++;
    }
  } else {
    log('⚠️  SKIP: No hay shortcuts definidos', 'yellow');
  }

  // Test 9: Verificar sincronización entre manifest.json y public/manifest.json
  totalTests++;
  log('\nTest 9: Verificar sincronización de archivos manifest', 'blue');
  try {
    const rootManifest = fs.readFileSync('manifest.json', 'utf8');
    const publicManifest = fs.readFileSync('public/manifest.json', 'utf8');
    
    if (rootManifest === publicManifest) {
      log('✅ PASS: Ambos archivos manifest están sincronizados', 'green');
      passedTests++;
    } else {
      log('❌ FAIL: Los archivos manifest no están sincronizados', 'red');
      failedTests++;
    }
  } catch (error) {
    log(`❌ FAIL: Error al comparar manifests: ${error.message}`, 'red');
    failedTests++;
  }

  // Resumen final
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 RESUMEN DE TESTS', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Total de tests:  ${totalTests}`, 'blue');
  log(`Tests exitosos:  ${passedTests}`, 'green');
  log(`Tests fallidos:  ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`Porcentaje:      ${Math.round((passedTests / totalTests) * 100)}%`, 
      failedTests > 0 ? 'yellow' : 'green');
  
  if (failedTests === 0) {
    log('\n✅ CONCLUSIÓN: Los íconos se mostrarán correctamente', 'green');
    log('La PWA está lista para instalación en producción\n', 'green');
    process.exit(0);
  } else {
    log('\n❌ CONCLUSIÓN: Hay problemas que necesitan corrección', 'red');
    log('Revisa los tests fallidos antes de desplegar\n', 'red');
    process.exit(1);
  }
}

// Ejecutar tests
testManifest();
