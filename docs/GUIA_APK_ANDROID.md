# 📱 Guía Completa: APK de Android con Capacitor

## 🎯 Resumen Rápido

Tu app ahora tiene **dos formas de instalación**:

1. **PWA (Navegador)**: Instalación directa desde el navegador
2. **APK Nativo**: Descarga e instalación del archivo `.apk` en Android

---

## 🚀 Método 1: Generar el APK (Automático)

### Opción A: Script automatizado (Recomendado)

```bash
npm run android:build-apk
```

Este comando:
1. ✅ Compila el CSS
2. ✅ Sincroniza archivos con Capacitor
3. ✅ Abre Android Studio
4. ⏸️ Espera a que compiles en Android Studio
5. ✅ Copia el APK a `downloads/mi-horario-fpuna.apk`

### Opción B: Paso a paso manual

```bash
# 1. Compilar CSS
npm run build

# 2. Sincronizar con Android
npm run android:sync

# 3. Abrir Android Studio
npm run android:open

# 4. En Android Studio:
#    Build → Build Bundle(s) / APK(s) → Build APK(s)

# 5. Copiar APK
npm run android:copy-apk
```

---

## 📦 Ubicaciones de los APK

### APK Debug (Desarrollo)
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### APK Release (Producción)
```
android/app/build/outputs/apk/release/app-release.apk
```

### APK para Descarga Pública
```
downloads/mi-horario-fpuna.apk
```

---

## 🌐 Publicar el APK

### En GitHub Pages

1. **Copiar el APK**:
```bash
npm run android:copy-apk
```

2. **Commit y push**:
```bash
git add downloads/mi-horario-fpuna.apk
git commit -m "Update Android APK v1.4.0"
git push
```

3. **URL de descarga**:
```
https://tu-usuario.github.io/Mi-Horario-FPUNA/downloads/mi-horario-fpuna.apk
```

### En GitHub Releases (Para archivos grandes)

Si tu APK es mayor a 100MB:

1. Ve a tu repositorio en GitHub
2. Click en **Releases** → **Create a new release**
3. Agrega un tag (ej: `v1.4.0`)
4. Arrastra el APK al área de archivos
5. Publica el release

---

## 🔐 APK Release Firmado (Producción)

### 1. Crear Keystore (solo una vez)

```bash
keytool -genkey -v -keystore mi-horario.keystore -alias mi-horario-key -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configurar firma en Android

Crea `android/keystore.properties`:
```properties
storePassword=TU_CONTRASEÑA
keyPassword=TU_CONTRASEÑA
keyAlias=mi-horario-key
storeFile=../mi-horario.keystore
```

### 3. Editar `android/app/build.gradle`

Agrega antes de `android {`:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Dentro de `android { ... }`, agrega:
```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### 4. Generar APK Release

En Android Studio:
1. **Build** → **Generate Signed Bundle / APK**
2. Selecciona **APK**
3. Selecciona tu keystore
4. Elige **release**
5. Click **Finish**

---

## 🎨 Personalizar el APK

### Cambiar nombre de la app

Edita `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Mi Horario FPUNA</string>
```

### Cambiar icono

Reemplaza los iconos en:
```
android/app/src/main/res/mipmap-*/
```

O usa Android Studio: **File** → **New** → **Image Asset**

### Cambiar package name

Edita `android/app/build.gradle`:
```gradle
android {
    namespace "com.fpuna.mihorario"
    defaultConfig {
        applicationId "com.fpuna.mihorario"
        // ...
    }
}
```

---

## 🧪 Probar el APK

### En dispositivo físico

```bash
# Con cable USB
npx cap run android

# Ver logs
npx cap run android -l
```

### En emulador

```bash
# Listar emuladores disponibles
emulator -list-avds

# Iniciar emulador
emulator -avd Pixel_5_API_33

# Instalar APK
adb install downloads/mi-horario-fpuna.apk
```

---

## ⚠️ Problemas Comunes

### ❌ Error: "Android SDK not found"

**Solución**: Instala [Android Studio](https://developer.android.com/studio)

### ❌ Error: "Gradle build failed"

**Solución**:
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### ❌ APK muy grande (>100MB)

**Solución**: Optimiza imágenes y usa App Bundles en vez de APK:
```bash
# En Android Studio: Build → Generate Signed Bundle / APK → Bundle
```

### ❌ "App not installed" en Android

**Solución**: 
1. Desinstala versiones anteriores
2. Permite instalación de apps desconocidas
3. Verifica que el APK no esté corrupto

---

## 📊 Comparación: PWA vs APK Nativo

| Característica | PWA | APK Nativo |
|---------------|-----|------------|
| Instalación | Botón en navegador | Descarga archivo |
| Tamaño | ~5MB | ~15-30MB |
| Actualizaciones | Automáticas | Manual |
| Permisos | Limitados | Completos |
| Rendimiento | Bueno | Excelente |
| Acceso offline | ✅ | ✅ |
| Notificaciones | ✅ | ✅ |
| Acceso a hardware | Limitado | Completo |

---

## 📝 Checklist para Publicar

- [ ] Compilar CSS: `npm run build`
- [ ] Sincronizar Capacitor: `npm run android:sync`
- [ ] Generar APK en Android Studio
- [ ] Probar APK en dispositivo real
- [ ] Copiar a downloads: `npm run android:copy-apk`
- [ ] Verificar tamaño del APK (<100MB para GitHub)
- [ ] Commit y push: `git add downloads/ && git commit && git push`
- [ ] Probar descarga desde GitHub Pages
- [ ] Actualizar versión en package.json

---

## 🆘 Soporte

Si tienes problemas:

1. **Revisa los logs**:
```bash
npx cap run android -l
```

2. **Limpia y reconstruye**:
```bash
npm run clean
npm run build
npx cap sync android
```

3. **Consulta la documentación**:
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Studio Guide](https://developer.android.com/studio/intro)

---

## 🎉 ¡Listo!

Tu app ahora se puede descargar como APK desde:

**Settings → Instalar App → Descargar APK Android**

Los usuarios solo necesitan:
1. Hacer clic en "Descargar APK Android"
2. Permitir instalación de fuentes desconocidas
3. Abrir el archivo descargado
4. Seguir el proceso de instalación de Android

¡Disfruta tu app nativa! 🚀📱
