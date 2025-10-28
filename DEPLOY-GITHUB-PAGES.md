# Guía de Despliegue - GitHub Pages

## 🚀 Despliegue Automático (Recomendado)

### 1. Subir a GitHub
```bash
# Crear repositorio en GitHub
# Subir todo el código (excepto node_modules/)
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Habilitar GitHub Pages
1. Ve a tu repositorio en GitHub
2. Ve a **Settings** → **Pages**
3. En **Source**, selecciona **"Deploy from a branch"**
4. Selecciona la rama **main** y carpeta **/(root)**
5. Haz clic en **Save**

### 3. Esperar el Despliegue
- GitHub Actions construirá automáticamente la aplicación
- La URL será: `https://tuusuario.github.io/tu-repositorio/`

## 🔧 Despliegue Manual

Si prefieres hacerlo manualmente:

```bash
# Construir la aplicación
npm run deploy

# Subir solo los archivos necesarios:
# - index.html
# - src/
# - dist/
# - public/
# - .nojekyll
# - README.md
```

## ⚠️ Notas Importantes

### Rutas del Manifest
- Si usas `usuario.github.io/repositorio/`, las rutas absolutas en `manifest.json` funcionarán correctamente
- Si usas un dominio personalizado, ajusta las rutas en `public/manifest.json`

### PWA
- La aplicación se puede instalar como PWA en dispositivos móviles
- Funciona completamente offline después de la primera carga

### Optimizaciones
- CSS compilado y minificado automáticamente
- Archivos optimizados para carga rápida
- Compatible con todos los navegadores modernos

## 🐛 Solución de Problemas

### Error 404 en assets
- Asegúrate de que `.nojekyll` esté en la raíz
- Verifica que las rutas en `index.html` sean relativas

### PWA no se instala
- Verifica que `public/manifest.json` tenga las rutas correctas
- Asegúrate de que el sitio use HTTPS

### CSS no carga
- Ejecuta `npm run build` antes de subir
- Verifica que `dist/output.css` exista

## 📊 Estado del Despliegue

Después de habilitar GitHub Pages, ve a:
- **Actions** tab para ver el progreso del build
- **Settings → Pages** para ver la URL final

¡Tu aplicación estará lista en minutos! 🎉