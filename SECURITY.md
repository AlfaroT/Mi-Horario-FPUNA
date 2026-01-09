# 🔒 Guía de Seguridad - Mi Horario FPUNA

## Archivos que NUNCA deben subirse al repositorio

### 🔑 Claves y Certificados de Firma (Signing Keys)
- `*.keystore` - Archivos de firma de Android
- `*.jks` - Java KeyStore files
- `signing-key-info.txt` - Información de claves de firma
- `*.pem` - Archivos de certificados privados
- `*.p12`, `*.pfx` - Certificados PKCS

**¿Por qué?** Estas claves se usan para firmar la aplicación Android. Si alguien las obtiene, podría publicar actualizaciones maliciosas de tu app.

### 📦 Archivos Compilados (Build Artifacts)
- `*.apk` - Aplicación Android compilada
- `*.aab` - Android App Bundle
- `*.ap_` - Android Package
- `*.dex` - Dalvik Executable

**¿Por qué?** Son archivos binarios grandes (1-4 MB cada uno) que inflan el repositorio. Además, pueden regenerarse desde el código fuente.

### 🔐 Configuraciones Privadas
- `.env`, `.env.local` - Variables de entorno
- `google-services.json` - Configuración de Firebase (si contiene claves)
- `local.properties` - Configuraciones locales de Android

### 🚫 Lo que YA está protegido

El archivo `.gitignore` ya está configurado para ignorar:
- ✅ Claves de firma (`*.keystore`)
- ✅ Archivos compilados (`*.apk`, `*.aab`)
- ✅ Dependencias (`node_modules/`)
- ✅ Archivos de build de Android
- ✅ Configuraciones locales

## ✅ Archivos que SÍ pueden subirse

### Archivos de configuración pública
- `assetlinks.json` - Contiene SHA256 fingerprints públicos (necesarios para Android App Links)
- `AndroidManifest.xml` - Configuración de la app
- `capacitor.config.json` - Configuración de Capacitor
- Archivos de código fuente (`.js`, `.html`, `.css`)

**Nota sobre SHA256 fingerprints:** Los fingerprints en `assetlinks.json` son públicos y seguros de compartir. Se usan para verificar Android App Links y deben ser accesibles públicamente en `/.well-known/assetlinks.json`.

## 📝 Mejores Prácticas

1. **Antes de hacer commit:**
   ```bash
   git status
   ```
   Verifica que no estés por subir archivos sensibles.

2. **Si accidentalmente subiste algo sensible:**
   ```bash
   # Remover del tracking pero mantener el archivo local
   git rm --cached archivo-sensible.ext
   
   # Agregar a .gitignore
   echo "archivo-sensible.ext" >> .gitignore
   
   # Commit los cambios
   git add .gitignore
   git commit -m "Remover archivo sensible del repositorio"
   ```

3. **Para limpiar el historial (si ya fue pusheado):**
   - Considera usar `git filter-branch` o `BFG Repo-Cleaner`
   - **ADVERTENCIA:** Esto reescribe el historio y requiere force push
   - Mejor consultar con el equipo primero

4. **Usa GitHub Secrets para:**
   - Tokens de GitHub (PAT)
   - Claves API
   - Credenciales de servicios

## 🆘 ¿Cometiste un error?

Si subiste accidentalmente información sensible:

1. **Actúa rápido** - Mientras menos personas lo vean, mejor
2. **Revoca las credenciales** - Si eran claves o tokens, revócalos inmediatamente
3. **Limpia el historial** - Usa herramientas para removerlo del historial de git
4. **Notifica** - Si es un repositorio de equipo, avisa a los demás

## 📚 Recursos

- [GitHub - Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Android App Links - assetlinks.json](https://developer.android.com/training/app-links/verify-android-applinks)
- [Signing Your Android App](https://developer.android.com/studio/publish/app-signing)

---

**Recordá:** Es más fácil prevenir que limpiar. Siempre verificá antes de hacer commit. 🛡️
