# 📚 Mi Horario FPUNA# Mi Horario FPUNA



> **Aplicación web progresiva (PWA) para gestionar tu horario académico en la Facultad Politécnica - Universidad Nacional de Asunción**Aplicación web moderna para gestionar horarios académicos de la Facultad Politécnica UNA.



[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge)](https://alfarot.github.io/Mi-Horario-FPUNA/)## 🚀 Características

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

[![PWA](https://img.shields.io/badge/PWA-enabled-purple?style=for-the-badge)](https://alfarot.github.io/Mi-Horario-FPUNA/)- **Dashboard Moderno**: Interfaz intuitiva con métricas en tiempo real

- **Gestión de Horarios**: Configuración flexible de clases y exámenes

---- **Calculadora de Notas**: Herramienta integrada para calcular promedios

- **PWA**: Funciona offline y se puede instalar como aplicación

## 🎯 ¿Para qué sirve?- **Responsive**: Optimizada para móviles y escritorio

- **Tema Oscuro**: Soporte completo para modo oscuro

**Mi Horario FPUNA** te ayuda a organizar toda tu vida académica en un solo lugar:

## 🌐 Despliegue en GitHub Pages

- ✅ **Horario semanal** de clases por día y hora

- 📅 **Calendario de exámenes** con alertas de proximidad### Configuración Automática

- 🎓 **Clases ocasionales** (clases de sábado) con recordatorios

- ✏️ **Gestor de tareas** para trabajos y proyectos1. **Sube el código a GitHub** en un repositorio público

- 🧮 **Calculadora de notas** según el sistema FPUNA (PP + EF)2. **Habilita GitHub Pages**:

- 🌙 **Modo oscuro** para estudiar de noche sin cansarte la vista   - Ve a Settings → Pages

   - Selecciona "Deploy from a branch"

**¡Y lo mejor!** Funciona **completamente offline** después de la primera carga. Instalala en tu celular y tendrás tu horario siempre a mano, ¡incluso sin internet! 📱   - Elige la rama `main` y carpeta `/(root)`

3. **El despliegue se hace automáticamente** mediante GitHub Actions

---

### Configuración Manual

## 🚀 Acceso Rápido

Si prefieres hacerlo manualmente:

### 🌐 Usar Online (Sin instalación)

```bash

Simplemente abre: **[https://alfarot.github.io/Mi-Horario-FPUNA/](https://alfarot.github.io/Mi-Horario-FPUNA/)**# Construir la aplicación

npm run build

### 📱 Instalar como App (Recomendado)

# Los archivos listos están en la raíz del proyecto

La aplicación es una **PWA (Progressive Web App)**, lo que significa que puedes instalarla como si fuera una app nativa de tu celular:```



#### **📱 En Android:**### URLs de Ejemplo



1. Abre **Chrome** en tu celular- **Página principal**: `https://tuusuario.github.io/tu-repositorio/`

2. Ve a: [https://alfarot.github.io/Mi-Horario-FPUNA/](https://alfarot.github.io/Mi-Horario-FPUNA/)- **PWA**: Se puede instalar desde cualquier navegador moderno

3. Toca el **menú** (⋮) → **"Agregar a pantalla de inicio"** o **"Instalar aplicación"**

4. Dale un nombre y toca **"Agregar"**## 📱 Tecnologías

5. ¡Listo! Ahora tenés un ícono en tu pantalla principal 🎉

- **HTML5**: Estructura semántica moderna

#### **🍎 En iPhone/iPad (iOS):**- **Tailwind CSS v4**: Framework CSS utility-first compilado localmente

- **JavaScript ES6+**: Lógica de aplicación modular

1. Abre **Safari** (debe ser Safari, no Chrome)- **PWA**: Manifest para instalación como aplicación

2. Ve a: [https://alfarot.github.io/Mi-Horario-FPUNA/](https://alfarot.github.io/Mi-Horario-FPUNA/)- **Local Storage**: Persistencia de datos local

3. Toca el botón de **Compartir** (📤) en la parte inferior

4. Desplázate hacia abajo y toca **"Agregar a pantalla de inicio"**## 🛠️ Instalación y Uso

5. Dale un nombre y toca **"Agregar"**

6. ¡Listo! La app aparecerá en tu pantalla de inicio 🎉### Desarrollo Local



#### **💻 En PC (Chrome/Edge):**```bash

# Instalar dependencias

1. Abre la página en **Chrome** o **Edge**npm install

2. Busca el ícono de **"Instalar"** (⊕) en la barra de direcciones

3. Haz clic en **"Instalar"**# Construir CSS

4. ¡Listo! Se abrirá como una app de escritorio 🎉npm run build



---# Iniciar servidor de desarrollo

npm run serve

## 📖 ¿Cómo usar la app?

# Abrir http://localhost:8000

### 1️⃣ Primera Configuración```



1. **Ingresa tu nombre** para personalizar la app### Producción

2. **Sube tu horario en Excel** (el archivo que te manda la facultad)

3. **Selecciona tu carrera y semestres** que estás cursando```bash

4. **Elige las materias** que estás llevando este periodo# Construir para producción

5. **Confirma las secciones** (profesor y turno) de cada materianpm run build

6. ¡Listo! Ya tenés tu horario configurado 🎓

# El CSS compilado estará en dist/output.css

### 2️⃣ Dashboard Principal```



Después de configurar, verás:### GitHub Pages



- **📅 Clases de hoy**: Las clases que tenés programadas para el día actualPara desplegar en GitHub Pages, sigue las instrucciones en [`DEPLOY-GITHUB-PAGES.md`](DEPLOY-GITHUB-PAGES.md).

- **📝 Próximos exámenes**: Exámenes ordenados por fecha con contador de días

- **🎓 Clases ocasionales**: Clases de sábado o fechas especiales## 📁 Estructura del Proyecto

- **✏️ Mis tareas**: Trabajos y proyectos pendientes que agregues

```

### 3️⃣ Calculadora de Notas FPUNA├── index.html              # Página principal

├── src/                    # Código fuente

La app incluye una **calculadora automática** que sigue el sistema de la FPUNA:│   ├── js/                # JavaScript modular

│   │   ├── main.js       # Punto de entrada principal

- **PF = (PP × 0.4) + (EF × 0.6)**│   │   ├── ui.js         # Gestión de interfaz

- Ingresá tu **Promedio de Parciales (PP)** y **Examen Final (EF)**│   │   ├── state.js      # Estado de la aplicación

- Te muestra automáticamente:│   │   ├── parser.js     # Procesamiento de datos

  - ✅ Puntuación Final (PF)│   │   ├── tasks.js      # Gestión de tareas

  - 📊 Nota numérica (1-5)│   │   ├── dom.js        # Manipulación del DOM

  - 📝 Calificación ("Aprobado", "Excelente", etc.)│   │   ├── filters.js    # Filtros y búsqueda

│   │   └── utils.js      # Utilidades

### 4️⃣ Gestor de Tareas│   ├── css/              # Hojas de estilo

│   │   ├── input.css     # CSS fuente de Tailwind

Creá tareas con:│   │   └── styles.css    # Estilos personalizados

- 📌 Título y descripción│   └── assets/           # Recursos estáticos

- 📅 Fecha de entrega├── config/                # Configuraciones

- ⏰ Hora límite│   ├── tailwind.config.js # Configuración de Tailwind

- ✅ Marcalas como completadas│   └── postcss.config.js  # Configuración de PostCSS

- 🗂️ Historial de tareas cumplidas├── public/                # Archivos públicos

│   ├── favicon.ico       # Icono de la aplicación

---│   └── manifest.json     # Manifiesto PWA

├── dist/                  # Archivos compilados

## ✨ Características Principales│   └── output.css        # CSS compilado para producción

├── docs/                  # Documentación

| Característica | Descripción |│   ├── changelog/        # Historial de cambios

|---------------|-------------|│   ├── checklists/       # Listas de verificación

| 📱 **PWA** | Instalable en celular y PC como app nativa |│   ├── reports/          # Reportes

| 🔌 **Offline** | Funciona sin internet después de la primera carga |│   ├── guides/           # Guías

| 🌙 **Modo Oscuro** | Tema oscuro automático para cuidar tu vista |│   └── hotfixes/         # Parches

| 📊 **Dashboard** | Métricas en tiempo real de tu semestre |├── tests/                 # Archivos de prueba

| 📅 **Calendario** | Exámenes y clases ocasionales organizados |└── package.json          # Dependencias y scripts

| 🧮 **Calculadora** | Calcula tu nota final según el sistema FPUNA |```

| 💾 **Auto-guardado** | Todo se guarda automáticamente en tu navegador |

| 📱 **Responsive** | Se adapta perfectamente a celular, tablet y PC |## 🎨 Personalización



---### Colores y Tema



## 🛠️ Tecnologías UtilizadasLa aplicación usa un sistema de colores consistente basado en Tailwind CSS. Los colores principales son:



- **HTML5** - Estructura moderna y semántica- **Azul**: `#2563eb` (acciones primarias)

- **Tailwind CSS** - Diseño profesional y responsive- **Gris**: `#6b7280` (texto y fondos)

- **JavaScript ES6+** - Lógica modular y eficiente- **Verde**: `#10b981` (éxito y confirmaciones)

- **PWA** - Funcionalidad offline e instalable- **Rojo**: `#ef4444` (errores y alertas)

- **LocalStorage** - Guardado automático de datos

### Animaciones

---

Incluye animaciones suaves para mejorar la experiencia de usuario:

## 📸 Capturas de Pantalla- `fadeIn`: Entrada gradual de elementos

- `bounceIn`: Animación de rebote para modales

### Dashboard Principal

Visualizá todas tus métricas de un vistazo: clases de hoy, exámenes próximos, tareas pendientes.## 📊 Funcionalidades



### Configuración de Horarios### Dashboard

Interfaz intuitiva para seleccionar tus materias, profesores y turnos.- Métricas en tiempo real de clases, exámenes y tareas

- Navegación intuitiva con menú flotante

### Modo Oscuro- Tarjetas informativas con iconos

Tema oscuro elegante para estudiar de noche sin cansar la vista.

### Configuración de Horarios

---- Interfaz visual para configurar clases

- Soporte para clases regulares y ocasionales

## 🤝 Contribuciones- Validación automática de datos



¿Querés mejorar la app? ¡Tus contribuciones son bienvenidas!### Calculadora de Notas

- Cálculo de promedios ponderados

1. Fork este repositorio- Soporte para diferentes sistemas de calificación

2. Creá una rama con tu mejora: `git checkout -b mi-mejora`- Resultados en tiempo real

3. Hacé commit de tus cambios: `git commit -m 'Agregué X funcionalidad'`

4. Push a tu rama: `git push origin mi-mejora`### Configuración

5. Abrí un Pull Request- Ajustes de aplicación

- Gestión de datos

---- Opciones de tema



## 📝 Formato del Archivo Excel## 🔧 Scripts Disponibles



La app espera un archivo Excel con las siguientes columnas:```bash

npm run dev          # Desarrollo con watch

- **Semestre** - Número de semestre (1ro, 2do, 3ro, etc.)npm run build        # Construir CSS para producción

- **Asignatura** - Nombre de la materianpm run serve        # Servidor local

- **Profesor** - Nombre del docentenpm run watch-css    # Watch para cambios en CSS

- **Sección/Turno** - Turno (Mañana/Tarde/Noche) y secciónnpm run clean        # Limpiar archivos generados

- **Lunes a Viernes** - Horario de cada día```

- **Aula** - Aula correspondiente

- **Examen** - Fecha del examen## 🌐 PWA Features

- **Clases Ocasionales** - Fechas de clases de sábado

- **Instalable**: Se puede instalar como aplicación nativa

---- **Offline**: Funciona sin conexión a internet

- **Cache**: Recursos optimizados para carga rápida

## 🐛 Reportar Problemas- **Manifest**: Metadatos completos para tiendas de apps



¿Encontraste un bug o tenés una sugerencia?## 📈 Optimización



- 📧 Abrí un **[Issue](https://github.com/AlfaroT/Mi-Horario-FPUNA/issues)** en GitHub### CSS

- 💡 Describe el problema o mejora que proponés- Tailwind CSS compilado y minificado

- 📸 Si es posible, adjuntá capturas de pantalla- Eliminación de clases no utilizadas

- Optimización con PostCSS y CSSNano

---

### JavaScript

## 📄 Licencia- Código modular y organizado

- Funciones reutilizables

Este proyecto está bajo la Licencia MIT. Podés usarlo, modificarlo y distribuirlo libremente.- Manejo de errores robusto



---### Rendimiento

- Carga diferida de recursos

## 👨‍💻 Autor- Optimización de imágenes

- Cache inteligente

Desarrollado con ❤️ para los estudiantes de la **Facultad Politécnica - UNA**

## 🤝 Contribución

---

1. Fork el proyecto

## 🎓 ¿Te sirvió?2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)

3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)

Si te ayudó a organizar tu semestre, dale una ⭐ al repositorio!4. Push a la rama (`git push origin feature/nueva-funcionalidad`)

5. Abre un Pull Request

**¡Éxitos en tus estudios!** 📚✨

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autor

**Mi Horario FPUNA**
- Aplicación desarrollada para estudiantes de la Facultad Politécnica UNA

---

¡Gracias por usar Mi Horario FPUNA! 🎓