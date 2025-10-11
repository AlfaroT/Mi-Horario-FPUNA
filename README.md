# Mi Horario FPUNA

Aplicación web moderna para gestionar horarios académicos de la Facultad Politécnica UNA.

## 🚀 Características

- **Dashboard Moderno**: Interfaz intuitiva con métricas en tiempo real
- **Gestión de Horarios**: Configuración flexible de clases y exámenes
- **Calculadora de Notas**: Herramienta integrada para calcular promedios
- **PWA**: Funciona offline y se puede instalar como aplicación
- **Responsive**: Optimizada para móviles y escritorio
- **Tema Oscuro**: Soporte completo para modo oscuro

## 🌐 Despliegue en GitHub Pages

### Configuración Automática

1. **Sube el código a GitHub** en un repositorio público
2. **Habilita GitHub Pages**:
   - Ve a Settings → Pages
   - Selecciona "Deploy from a branch"
   - Elige la rama `main` y carpeta `/(root)`
3. **El despliegue se hace automáticamente** mediante GitHub Actions

### Configuración Manual

Si prefieres hacerlo manualmente:

```bash
# Construir la aplicación
npm run build

# Los archivos listos están en la raíz del proyecto
```

### URLs de Ejemplo

- **Página principal**: `https://tuusuario.github.io/tu-repositorio/`
- **PWA**: Se puede instalar desde cualquier navegador moderno

## 📱 Tecnologías

- **HTML5**: Estructura semántica moderna
- **Tailwind CSS v4**: Framework CSS utility-first compilado localmente
- **JavaScript ES6+**: Lógica de aplicación modular
- **PWA**: Manifest para instalación como aplicación
- **Local Storage**: Persistencia de datos local

## 🛠️ Instalación y Uso

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Construir CSS
npm run build

# Iniciar servidor de desarrollo
npm run serve

# Abrir http://localhost:8000
```

### Producción

```bash
# Construir para producción
npm run build

# El CSS compilado estará en dist/output.css
```

### GitHub Pages

Para desplegar en GitHub Pages, sigue las instrucciones en [`DEPLOY-GITHUB-PAGES.md`](DEPLOY-GITHUB-PAGES.md).

## 📁 Estructura del Proyecto

```
├── index.html              # Página principal
├── src/                    # Código fuente
│   ├── js/                # JavaScript modular
│   │   ├── main.js       # Punto de entrada principal
│   │   ├── ui.js         # Gestión de interfaz
│   │   ├── state.js      # Estado de la aplicación
│   │   ├── parser.js     # Procesamiento de datos
│   │   ├── tasks.js      # Gestión de tareas
│   │   ├── dom.js        # Manipulación del DOM
│   │   ├── filters.js    # Filtros y búsqueda
│   │   └── utils.js      # Utilidades
│   ├── css/              # Hojas de estilo
│   │   ├── input.css     # CSS fuente de Tailwind
│   │   └── styles.css    # Estilos personalizados
│   └── assets/           # Recursos estáticos
├── config/                # Configuraciones
│   ├── tailwind.config.js # Configuración de Tailwind
│   └── postcss.config.js  # Configuración de PostCSS
├── public/                # Archivos públicos
│   ├── favicon.ico       # Icono de la aplicación
│   └── manifest.json     # Manifiesto PWA
├── dist/                  # Archivos compilados
│   └── output.css        # CSS compilado para producción
├── docs/                  # Documentación
│   ├── changelog/        # Historial de cambios
│   ├── checklists/       # Listas de verificación
│   ├── reports/          # Reportes
│   ├── guides/           # Guías
│   └── hotfixes/         # Parches
├── tests/                 # Archivos de prueba
└── package.json          # Dependencias y scripts
```

## 🎨 Personalización

### Colores y Tema

La aplicación usa un sistema de colores consistente basado en Tailwind CSS. Los colores principales son:

- **Azul**: `#2563eb` (acciones primarias)
- **Gris**: `#6b7280` (texto y fondos)
- **Verde**: `#10b981` (éxito y confirmaciones)
- **Rojo**: `#ef4444` (errores y alertas)

### Animaciones

Incluye animaciones suaves para mejorar la experiencia de usuario:
- `fadeIn`: Entrada gradual de elementos
- `bounceIn`: Animación de rebote para modales

## 📊 Funcionalidades

### Dashboard
- Métricas en tiempo real de clases, exámenes y tareas
- Navegación intuitiva con menú flotante
- Tarjetas informativas con iconos

### Configuración de Horarios
- Interfaz visual para configurar clases
- Soporte para clases regulares y ocasionales
- Validación automática de datos

### Calculadora de Notas
- Cálculo de promedios ponderados
- Soporte para diferentes sistemas de calificación
- Resultados en tiempo real

### Configuración
- Ajustes de aplicación
- Gestión de datos
- Opciones de tema

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo con watch
npm run build        # Construir CSS para producción
npm run serve        # Servidor local
npm run watch-css    # Watch para cambios en CSS
npm run clean        # Limpiar archivos generados
```

## 🌐 PWA Features

- **Instalable**: Se puede instalar como aplicación nativa
- **Offline**: Funciona sin conexión a internet
- **Cache**: Recursos optimizados para carga rápida
- **Manifest**: Metadatos completos para tiendas de apps

## 📈 Optimización

### CSS
- Tailwind CSS compilado y minificado
- Eliminación de clases no utilizadas
- Optimización con PostCSS y CSSNano

### JavaScript
- Código modular y organizado
- Funciones reutilizables
- Manejo de errores robusto

### Rendimiento
- Carga diferida de recursos
- Optimización de imágenes
- Cache inteligente

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autor

**Mi Horario FPUNA**
- Aplicación desarrollada para estudiantes de la Facultad Politécnica UNA

---

¡Gracias por usar Mi Horario FPUNA! 🎓