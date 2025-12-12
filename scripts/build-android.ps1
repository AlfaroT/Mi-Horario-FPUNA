#!/usr/bin/env pwsh
# Script para construir y preparar el APK de Android

Write-Host "🤖 Mi Horario FPUNA - Build Android APK" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Compilar CSS
Write-Host "📦 Paso 1/4: Compilando CSS..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error compilando CSS" -ForegroundColor Red
    exit 1
}
Write-Host "✅ CSS compilado" -ForegroundColor Green
Write-Host ""

# Paso 2: Sincronizar con Capacitor
Write-Host "🔄 Paso 2/4: Sincronizando con Android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error sincronizando" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Sincronización completa" -ForegroundColor Green
Write-Host ""

# Paso 3: Abrir Android Studio
Write-Host "📱 Paso 3/4: Abriendo Android Studio..." -ForegroundColor Yellow
Write-Host "⚠️  Ahora debes:" -ForegroundColor Magenta
Write-Host "   1. Esperar que Android Studio cargue" -ForegroundColor White
Write-Host "   2. Build → Build Bundle(s) / APK(s) → Build APK(s)" -ForegroundColor White
Write-Host "   3. Esperar la compilación" -ForegroundColor White
Write-Host "   4. Presiona ENTER aquí cuando termine" -ForegroundColor White
Write-Host ""

npx cap open android

# Esperar confirmación del usuario
Read-Host "Presiona ENTER después de compilar el APK en Android Studio"
Write-Host ""

# Paso 4: Copiar APK
Write-Host "📋 Paso 4/4: Copiando APK..." -ForegroundColor Yellow

$debugApk = "android\app\build\outputs\apk\debug\app-debug.apk"
$releaseApk = "android\app\build\outputs\apk\release\app-release.apk"
$destination = "downloads\mi-horario-fpuna.apk"

# Intentar copiar release primero, si no existe usar debug
if (Test-Path $releaseApk) {
    Copy-Item $releaseApk $destination -Force
    Write-Host "✅ APK Release copiado a: $destination" -ForegroundColor Green
    $apkSize = (Get-Item $destination).Length / 1MB
    Write-Host "📦 Tamaño: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
} elseif (Test-Path $debugApk) {
    Copy-Item $debugApk $destination -Force
    Write-Host "✅ APK Debug copiado a: $destination" -ForegroundColor Green
    $apkSize = (Get-Item $destination).Length / 1MB
    Write-Host "📦 Tamaño: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
    Write-Host "⚠️  Nota: Este es un APK de DEBUG, no optimizado para producción" -ForegroundColor Yellow
} else {
    Write-Host "❌ No se encontró ningún APK. Verifica que la compilación en Android Studio haya terminado." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✨ ¡Listo! APK preparado para descarga" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Prueba el APK en tu dispositivo Android" -ForegroundColor White
Write-Host "   2. git add downloads/mi-horario-fpuna.apk" -ForegroundColor White
Write-Host "   3. git commit -m 'Update Android APK'" -ForegroundColor White
Write-Host "   4. git push" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Los usuarios podrán descargar desde:" -ForegroundColor Cyan
Write-Host "   Settings → Instalar App → Descargar APK Android" -ForegroundColor White
Write-Host ""
