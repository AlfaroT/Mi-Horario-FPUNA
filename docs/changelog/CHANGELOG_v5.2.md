# Mi Horario FPUNA - Changelog v5.2

## 📅 Fecha: 2 de octubre de 2025

## 🎯 Objetivos de la Actualización

Esta actualización v5.2 corrige problemas críticos en la extracción de datos y añade funcionalidades solicitadas por el usuario.

---

## ✅ Correcciones Implementadas

### 1. **Extracción Precisa de Aulas por Día**

**Problema Anterior:**
- Las hojas Excel tienen formatos variados: algunas con columnas AULA intercaladas entre días, otras con una sola columna AULA general
- La lógica anterior no distinguía qué aula correspondía a qué día

**Solución Implementada:**
```javascript
// En buildColumnMap()
columnMap.aulas = {};
const aulaGeneralIndex = /* búsqueda de AULA general */;

DIAS_SEMANA.forEach((dia) => {
    // Para cada día, buscar aula en índice anterior
    const aulaAnteriorIndex = diaMatch.index - 1;
    if (normalizedHeaders[aulaAnteriorIndex].normalized === 'AULA') {
        columnMap.aulas[dia] = aulaAnteriorIndex; // Aula específica
    } else {
        columnMap.aulas[dia] = aulaGeneralIndex; // Fallback
    }
});
```

**Beneficio:**
- ✅ Extracción correcta de aulas para cada día de la semana
- ✅ Sistema de fallback robusto

---

### 2. **Identificación Correcta de Tipos de Examen**

**Problema Anterior:**
- Los tipos de examen (1er Parcial, 2do Parcial, Final, Revisión) se perdían durante el procesamiento
- Se asignaba un tipo genérico "Examen" a todos

**Solución Implementada:**
```javascript
// En processSheetData()
const examTypesMap = {};

headerRow.forEach((header, idx) => {
    if (headerNorm.includes('DIA') || headerNorm.includes('FECHA')) {
        let tipoExamen = normalizeExamType(header);
        examTypesMap[tipoExamen] = {
            fechaCol: idx,
            horaCol: -1,
            aulaCol: -1
        };
    }
});

// Buscar columnas de hora y aula para cada tipo
Object.keys(examTypesMap).forEach(tipoExamen => {
    // Mapeo de HORA y AULA específicas por tipo
});

// Extraer con tipo correcto
dataObj.examenes.push({
    tipo: tipoExamen, // ✅ Tipo específico conservado
    fecha: fechaValue,
    hora: getCellValue(...),
    aula: getCellValue(...)
});
```

**Beneficio:**
- ✅ Badges de examen correctos en la UI
- ✅ Diferenciación visual entre parciales, finales y revisiones

---

### 3. **Ordenamiento Cronológico de Exámenes**

**Problema Anterior:**
- Los exámenes se mostraban sin orden específico
- Difícil identificar cuáles son más urgentes

**Solución Implementada:**
```javascript
// En renderUpcomingExams()
const upcomingExams = state.examenes
    .map(examen => ({
        ...examen,
        fechaObj: formatDate(examen.fecha),
        daysLeft: getDaysDifference(formatDate(examen.fecha))
    }))
    .filter(examen => examen.daysLeft >= -1)
    .sort((a, b) => a.daysLeft - b.daysLeft) // ✅ Orden cronológico
    .slice(0, 10);
```

**Beneficio:**
- ✅ Exámenes ordenados del más próximo al más lejano
- ✅ Mejor gestión del tiempo de estudio

---

## 🆕 Nuevas Funcionalidades

### 4. **Selector de Tema Claro/Oscuro**

**Características:**

#### a) Configuración de Tailwind
```javascript
tailwind.config = {
    darkMode: 'class' // Cambio de 'media' a 'class'
}
```

#### b) Funciones de Gestión de Tema
```javascript
function initTheme() {
    let savedTheme = localStorage.getItem('fpunaTheme');
    if (!savedTheme) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        savedTheme = prefersDark ? 'dark' : 'light';
        localStorage.setItem('fpunaTheme', savedTheme);
    }
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    // Sincronizar toggle
}

function toggleTheme() {
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('fpunaTheme', newTheme);
    showToast(`Tema ${newTheme} activado`, 'success');
}
```

#### c) UI del Toggle
```html
<div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <div class="flex items-center">
        <i class="fas fa-moon text-xl mr-3"></i>
        <span class="font-medium">Modo Oscuro</span>
    </div>
    <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" id="themeToggle" class="sr-only peer">
        <div class="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600..."></div>
    </label>
</div>
```

#### d) Event Listener Delegado
```javascript
// Delegación de eventos para elemento dinámico
document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'themeToggle') {
        toggleTheme();
    }
});
```

**Beneficios:**
- ✅ Tema persiste entre sesiones (localStorage)
- ✅ Detecta automáticamente preferencia del sistema
- ✅ Sin "flash" de contenido (FOUC) al cargar
- ✅ Toggle accesible y estilizado

---

## 🏗️ Mejoras Arquitectónicas

### Storage Key Actualizado
```javascript
const STORAGE_KEY = 'fpunaHorarioData_v5_2';
const THEME_KEY = 'fpunaTheme';
```

### Nueva Estructura de Estado
```javascript
state = {
    // ... existing properties
    rawDataArray: [],  // ✅ Array original para acceso por índice
    columnMap: {
        // ... existing mappings
        aulas: {}  // ✅ Mapeo de aulas por día
    }
};
```

### Proceso de Inicialización Mejorado
```javascript
function init() {
    initTheme();           // ✅ 1. Tema primero (evita flash)
    if (loadFromLocalStorage()) {
        showDashboard();
    } else {
        showSetup();
    }
}
```

---

## 🧪 Testing Recomendado

### 1. Probar Extracción de Aulas
- [ ] Cargar Excel con aulas intercaladas (AULA, Lunes, AULA, Martes...)
- [ ] Cargar Excel con una sola columna AULA
- [ ] Verificar que cada clase muestre su aula correcta

### 2. Probar Tipos de Examen
- [ ] Verificar badges: "1er Parcial" (rojo), "2do Parcial" (rojo), "Final" (morado), "Revisión" (amarillo)
- [ ] Confirmar que la información de fecha, hora y aula es correcta para cada tipo

### 3. Probar Ordenamiento
- [ ] Verificar que exámenes aparecen en orden cronológico
- [ ] Confirmar que el más próximo está primero
- [ ] Revisar que el contador "En X días" es correcto

### 4. Probar Selector de Tema
- [ ] Al abrir por primera vez, debe detectar tema del sistema
- [ ] Al cambiar el toggle, debe persistir la preferencia
- [ ] Al recargar, debe mantener el tema elegido
- [ ] Verificar que no hay "flash" blanco al cargar en modo oscuro

---

## 📊 Estadísticas de Código

- **Líneas modificadas:** ~150
- **Nuevas funciones:** 3 (initTheme, applyTheme, toggleTheme)
- **Funciones mejoradas:** 3 (buildColumnMap, processSheetData, renderUpcomingExams)
- **Nuevos event listeners:** 2 (themeToggle, settingsBtn mejorado)

---

## 🔄 Migración desde v5.1

### Datos Incompatibles
Los datos de v5.1 son **incompatibles** debido a:
- Cambio en estructura de `columnMap.aulas`
- Cambio en `rawDataArray` guardado

### Acción Requerida
El usuario deberá:
1. Volver a cargar el archivo Excel
2. Reconfigurar filtros (se mantiene el flujo de cascada)
3. El tema se configurará automáticamente

---

## 📝 Notas Técnicas

### Orden de Ejecución
```
init()
  → initTheme()              (localStorage o system)
    → applyTheme()           (add/remove 'dark' class)
  → loadFromLocalStorage()   (si existe v5_2)
    → showDashboard()
      → renderUpcomingExams() (con sort cronológico)
```

### Persistencia
```
localStorage['fpunaHorarioData_v5_2'] = {
    config,
    selectedSemestres,
    selectedAsignaturas,
    selectedInstances,
    clases,            // ✅ con aulas correctas
    examenes,          // ✅ con tipos correctos
    fullSchedule,
    fullExamData,
    rawData,
    timestamp
}

localStorage['fpunaTheme'] = 'dark' | 'light'
```

---

## 🐛 Errores Conocidos

### CSS Linter Warnings (No críticos)
```
Unknown at rule @apply
```
**Impacto:** Ninguno. Son advertencias del linter de CSS que no afectan la funcionalidad.
**Razón:** Tailwind CSS usa `@apply` que algunos linters no reconocen.

---

## 🚀 Próximas Mejoras Sugeridas

1. **Notificaciones Push:** Recordatorios de exámenes próximos
2. **Vista Semanal:** Calendario visual de la semana
3. **Modo Compacto:** Vista reducida para dispositivos pequeños
4. **Export PDF:** Exportar horario en formato imprimible
5. **Comparador de Horarios:** Para ayudar a elegir secciones sin conflictos

---

## 👨‍💻 Créditos

**Desarrollado por:** GitHub Copilot
**Versión:** 5.2
**Fecha:** 2 de octubre de 2025
**Stack:** Vanilla JS + Tailwind CSS + SheetJS + date-fns

---

## 📄 Licencia

Este proyecto es de uso personal y educativo para estudiantes de la FPUNA.
