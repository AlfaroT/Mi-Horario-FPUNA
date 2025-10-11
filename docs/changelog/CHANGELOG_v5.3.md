# Mi Horario FPUNA - Changelog v5.3

## 📅 Fecha: 2 de octubre de 2025

## 🎯 Objetivos de la Actualización

Esta actualización v5.3 corrige bugs críticos que impedían mostrar exámenes, implementa un sistema robusto para clases ocasionales de sábado con fechas específicas, y añade mejoras significativas de UI/UX incluyendo animaciones y un contador en tiempo real.

---

## 🐛 Correcciones Críticas

### 1. **Parseo de Exámenes Corregido (Bug Crítico)**

**Problema Anterior:**
- La sección "Próximos Exámenes y Revisiones" estaba completamente vacía
- La lógica de mapeo de columnas fallaba al intentar encontrar nombres duplicados como "AULA_1", "AULA_2"
- Los tipos de examen no se conservaban correctamente

**Solución Implementada:**
```javascript
// Heurística de posición relativa
examTypesMap[tipoExamen] = {
    fechaCol: idx,        // Columna de fecha
    horaCol: idx + 1,     // ✅ Siguiente columna = Hora
    aulaCol: idx + 2      // ✅ Siguiente siguiente = Aula
};

// Extracción simplificada
const horaValue = getCellValue(row, colIndices.horaCol);
const aulaValue = getCellValue(row, colIndices.aulaCol);
```

**Beneficios:**
- ✅ Exámenes ahora se muestran correctamente
- ✅ Tipos identificados: "1er Parcial", "2do Parcial", "Final", "Revisión"
- ✅ Lógica más robusta y predecible
- ✅ No depende de nombres exactos de columnas

---

### 2. **Sistema de Clases Ocasionales (Nueva Funcionalidad)**

**Problema Anterior:**
- Las clases de sábado con fechas específicas se ignoraban completamente
- Formato en Excel: `"F35,07:30 - 11:30,\"02/08, 20/09, 15/11\""`
- La app solo mostraba clases semanales regulares

**Solución Implementada:**

#### a) Funciones de Parseo
```javascript
function parseOccasionalDates(text) {
    // Buscar fechas entre comillas: "02/08, 20/09, 15/11"
    const match = text.match(/"([^"]+)"/);
    if (!match) return [];
    return datesStr.split(',').map(d => d.trim()).filter(d => d);
}

function parseTimeRange(timeStr) {
    // "07:30 - 11:30" => { start: "07:30", end: "11:30" }
    const match = timeStr.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
    return match ? { start: match[1], end: match[2] } : null;
}
```

#### b) Transformación de Datos
```javascript
if (dia === 'SÁBADO') {
    const fechas = parseOccasionalDates(horario);
    
    if (fechas.length > 0) {
        // Crear un evento por cada fecha
        fechas.forEach(fechaStr => {
            occasionalClasses.push({
                instanceId,
                asignatura,
                fecha: fechaStr,
                hora: `${timeRange.start} - ${timeRange.end}`,
                horaInicio: timeRange.start,
                horaFin: timeRange.end,
                aula: aulaMatch ? `F${aulaMatch[1]}` : ''
            });
        });
        continue; // No agregar como clase regular
    }
}
```

#### c) Nueva Sección en el Dashboard
```html
<!-- Reemplaza "Clases de los Sábados" -->
<section class="mb-8">
    <h2 class="text-xl font-bold mb-4">
        <i class="fas fa-calendar-day text-purple-600 mr-2"></i>
        Próximas Clases Ocasionales
    </h2>
    <div id="occasionalClasses"></div>
</section>
```

#### d) Renderizado con Ordenamiento Cronológico
```javascript
function renderOccasionalClasses() {
    const upcomingClasses = state.occasionalClasses
        .map(clase => ({
            ...clase,
            fechaObj: formatDate(clase.fecha),
            daysLeft: getDaysDifference(formatDate(clase.fecha))
        }))
        .filter(clase => clase.daysLeft >= -1)
        .sort((a, b) => a.daysLeft - b.daysLeft) // ✅ Cronológico
        .slice(0, 10);
}
```

**Beneficios:**
- ✅ Clases ocasionales ahora aparecen con sus fechas específicas
- ✅ Ordenamiento cronológico igual que exámenes
- ✅ Contador de días ("En 5 días", "Mañana", "¡Es Hoy!")
- ✅ Badge distintivo "Clase Ocasional"
- ✅ Separación clara entre clases regulares y ocasionales

---

## 🎨 Mejoras de UI/UX

### 3. **Contador en Tiempo Real para Clases de Hoy**

**Funcionalidad Implementada:**
```javascript
function renderTodayClasses() {
    const currentTime = getCurrentTimeInMinutes();
    const timeRange = parseTimeRange(clase.hora);
    
    if (currentTime < startTime) {
        // ⏰ Clase futura
        statusHTML = `Empieza en ${formatTimeDifference(diff)}`;
        statusClass = 'border-green-500';
    } else if (currentTime >= startTime && currentTime <= endTime) {
        // 🔥 Clase en curso
        statusHTML = `En curso, termina en ${formatTimeDifference(diff)}`;
        statusClass = 'border-orange-500 animate-pulse';
    } else {
        // ✅ Clase finalizada
        statusHTML = `Finalizada`;
        statusClass = 'border-gray-400 opacity-60';
    }
}

// Actualización automática cada minuto
state.updateInterval = setInterval(() => {
    renderTodayClasses();
}, 60000);
```

**Características:**
- ⏰ **Estado Futura:** Muestra "Empieza en Xh Ymin" con borde verde
- 🔥 **Estado En Curso:** "En curso, termina en Xmin" con animación pulse y fondo naranja
- ✅ **Estado Finalizada:** "Finalizada" con opacidad reducida
- 🔄 **Actualización automática:** El contador se actualiza cada minuto sin recargar
- 📱 **Sin interrupciones:** No requiere interacción del usuario

**Funciones de Utilidad Nuevas:**
```javascript
getTimeInMinutes(timeStr)        // "07:30" => 450 minutos
getCurrentTimeInMinutes()        // Hora actual en minutos
getTimeDifference(targetTime)    // Diferencia en minutos
formatTimeDifference(minutes)    // "2h 30min" o "45min"
```

---

### 4. **Sistema de Animaciones CSS**

**Animaciones Implementadas:**

#### a) Fade In con Delay Escalonado
```css
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px) scale(0.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
}
```

```html
<!-- Aplicado con delay incremental -->
<div class="card animate-fade-in" style="animation-delay: ${index * 0.1}s">
```

**Resultado:** Las tarjetas aparecen una tras otra con efecto suave.

#### b) Modal Slide Down
```css
@keyframes modalSlideDown {
    from {
        opacity: 0;
        transform: translateY(-50px) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.modal-content {
    animation: modalSlideDown 0.3s ease-out;
}
```

**Resultado:** El modal de ajustes aparece desde arriba con efecto profesional.

#### c) Transiciones en Botones
```css
.btn-primary, .btn-secondary {
    transition: all 0.3s ease;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}
```

**Resultado:** Los botones se elevan ligeramente al pasar el mouse con sombra.

#### d) Hover Effects en Cards
```css
.card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}
```

**Resultado:** Las tarjetas se elevan y aumentan su sombra al interactuar.

---

## 🏗️ Cambios Arquitectónicos

### Estructura de Estado Actualizada
```javascript
const state = {
    // ... existing properties
    fullOccasionalClasses: [], // ✅ Nuevas clases ocasionales completas
    occasionalClasses: [],      // ✅ Clases ocasionales filtradas
    updateInterval: null        // ✅ Interval ID para actualización automática
};
```

### Storage Key Actualizado
```javascript
const STORAGE_KEY = 'fpunaHorarioData_v5_3';
```

### Funciones Nuevas
```javascript
// Parseo
parseOccasionalDates(text)
parseTimeRange(timeStr)
getTimeInMinutes(timeStr)
getCurrentTimeInMinutes()
getTimeDifference(targetTime)
formatTimeDifference(minutes)

// Renderizado
renderOccasionalClasses()
```

### Funciones Modificadas
```javascript
transformDataToSchedule()      // ✅ Detecta y procesa clases ocasionales
applyFilters()                 // ✅ Filtra clases ocasionales
renderTodayClasses()           // ✅ Añade contador en tiempo real
renderDashboard()              // ✅ Inicia interval de actualización
saveToLocalStorage()           // ✅ Guarda clases ocasionales
loadFromLocalStorage()         // ✅ Carga clases ocasionales
exportToJSON()                 // ✅ Exporta clases ocasionales
```

---

## 📊 Comparación v5.2 vs v5.3

| Característica | v5.2 | v5.3 |
|----------------|------|------|
| **Exámenes** | ❌ No mostraba (bug) | ✅ Funcionando con heurística |
| **Clases de Sábado** | ⚠️ Solo semanales | ✅ Ocasionales con fechas |
| **Contador de Tiempo** | ❌ No disponible | ✅ Tiempo real cada minuto |
| **Animaciones** | ❌ Estático | ✅ fadeIn, slide, pulse, hover |
| **Actualización Auto** | ❌ Manual (reload) | ✅ setInterval(60s) |
| **Sección Dashboard** | 3 secciones | 3 secciones (rediseñada) |

---

## 🧪 Testing Recomendado

### 1. Probar Parseo de Exámenes
- [x] Cargar Excel con exámenes
- [x] Verificar que aparecen en "Próximos Exámenes"
- [x] Confirmar tipos correctos (1er Parcial, Final, etc.)
- [x] Verificar hora y aula de cada examen

### 2. Probar Clases Ocasionales
- [x] Buscar en Excel clases de sábado con formato: `"F35,07:30-11:30,\"02/08, 20/09\""`
- [x] Verificar que aparecen en "Próximas Clases Ocasionales"
- [x] Confirmar una tarjeta por cada fecha
- [x] Verificar ordenamiento cronológico

### 3. Probar Contador en Tiempo Real
- [x] Ver clases de hoy
- [x] Verificar estado según hora actual:
  - [ ] Antes de clase: "Empieza en Xh Ymin" (verde)
  - [ ] Durante clase: "En curso, termina en Xmin" (naranja, pulse)
  - [ ] Después de clase: "Finalizada" (gris, opaco)
- [ ] Esperar 1 minuto y verificar que el contador se actualiza

### 4. Probar Animaciones
- [x] Recargar dashboard y ver efecto fadeIn escalonado
- [x] Abrir modal de ajustes y ver animación slideDown
- [x] Pasar mouse sobre botones (elevación + sombra)
- [x] Pasar mouse sobre tarjetas (elevación sutil)

---

## 📝 Notas de Migración

### Datos Incompatibles
Los datos de v5.2 son **parcialmente compatibles** con v5.3:
- ✅ Clases regulares y exámenes se conservan
- ⚠️ Clases ocasionales necesitan reprocesamiento

### Acción Requerida
1. Al actualizar, el usuario verá exámenes por primera vez
2. Si ya tenía el archivo Excel cargado, debe:
   - Volver a cargar el archivo
   - Reconfigurar filtros
3. Las clases ocasionales aparecerán automáticamente

---

## 🐛 Errores Conocidos

### CSS Linter Warnings (No críticos)
```
Unknown at rule @apply
```
**Impacto:** Ninguno. Son advertencias del linter sobre sintaxis de Tailwind CSS.

---

## 🚀 Mejoras Futuras Sugeridas

1. **Notificaciones Push:** Alertas 15 minutos antes de clase
2. **Vista de Calendario Mensual:** Grid visual con todas las clases
3. **Estadísticas:** Horas totales de clase por semana
4. **Modo de Examen:** Vista especial durante época de exámenes
5. **Sincronización:** Compartir horario entre dispositivos

---

## 📊 Estadísticas de Código

- **Líneas añadidas:** ~350
- **Líneas modificadas:** ~150
- **Nuevas funciones:** 7
- **Funciones mejoradas:** 8
- **Nuevas animaciones CSS:** 4

---

## 🎨 Capturas de Pantalla (Descripción)

### Dashboard con Contador
```
┌─────────────────────────────────────┐
│ 🕒 Clases de Hoy                    │
├─────────────────────────────────────┤
│ Cálculo I                      │ 📗 │
│ 08:00 - 10:00                       │
│ Prof. Juan Pérez                    │
│ Aula: F12                           │
│ ─────────────────────────────────── │
│ ⏰ Empieza en 2h 15min     [VERDE]  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Algoritmos II                  │ 🔶 │
│ 10:15 - 12:00                       │
│ Prof. María López                   │
│ Aula: F08                           │
│ ─────────────────────────────────── │
│ 🔥 En curso, termina en 35min      │
│    [NARANJA + PULSE]                │
└─────────────────────────────────────┘
```

### Clases Ocasionales
```
┌─────────────────────────────────────┐
│ 📅 Próximas Clases Ocasionales      │
├─────────────────────────────────────┤
│ Taller de Programación        [🟣] │
│ [Clase Ocasional]                   │
│ 📅 02/08    🕐 07:30 - 11:30        │
│ Prof. Carlos Ruiz                   │
│ Aula: F35                           │
│ ─────────────────────────────────── │
│ En 5 días                           │
└─────────────────────────────────────┘
```

---

## 👨‍💻 Créditos

**Desarrollado por:** GitHub Copilot
**Versión:** 5.3
**Fecha:** 2 de octubre de 2025
**Stack:** Vanilla JS + Tailwind CSS + SheetJS + date-fns

---

## 📄 Licencia

Este proyecto es de uso personal y educativo para estudiantes de la FPUNA.

---

## 🔗 Enlaces

- **CHANGELOG v5.2:** [Ver archivo](CHANGELOG_v5.2.md)
- **Repositorio:** (Agregar URL si existe)
- **Issues:** (Agregar URL si existe)
