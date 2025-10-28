# CHANGELOG v5.4 - Mi Horario FPUNA

## 📅 Fecha de Actualización
3 de Octubre de 2025

## 🎯 Objetivos de la Versión 5.4

Esta es una **actualización mayor crítica** que resuelve bugs de regresión graves que impedían la visualización de datos de exámenes y aulas, e introduce dos **nuevas funcionalidades principales**: Calculadora de Notas FPUNA y Gestor de Tareas Personales.

---

## 🐛 CORRECCIONES CRÍTICAS

### 1. **RE-IMPLEMENTACIÓN COMPLETA DEL PARSEO DE EXÁMENES** ⚠️ CRÍTICO

**Problema:**
- La lógica de v5.3 usaba heurística de posición que fallaba con diferentes estructuras de Excel
- Los exámenes no se mostraban porque las columnas no se encontraban correctamente

**Solución Implementada:**
```javascript
// SISTEMA DE MAPEO DE BLOQUES ROBUSTO

// 1. Búsqueda de títulos de bloques de examen
const examBlocks = [];
const examTitles = ['1ER. PARCIAL', '2DO. PARCIAL', '1ER. FINAL', '2DO. FINAL', 'REVISION'];

headerRow.forEach((header, idx) => {
    const headerNorm = normalizeString(header);
    for (const title of examTitles) {
        if (headerNorm === title || headerNorm.includes(title.replace('.', ''))) {
            examBlocks.push({
                title: header,
                startIdx: idx,
                tipo: /* Normalización del tipo */
            });
        }
    }
});

// 2. Para cada bloque, buscar sus columnas Día, Hora, Aula
examBlocks.forEach((block, blockIdx) => {
    const nextBlockIdx = blockIdx + 1 < examBlocks.length 
        ? examBlocks[blockIdx + 1].startIdx 
        : headerRow.length;
    
    // Buscar dentro del rango del bloque [startIdx, nextBlockIdx)
    for (let i = block.startIdx; i < nextBlockIdx; i++) {
        const cellNorm = normalizeString(headerRow[i]);
        if ((cellNorm.includes('DIA') || cellNorm.includes('FECHA')) && diaIdx === -1) {
            diaIdx = i;
        } else if (cellNorm.includes('HORA') && horaIdx === -1) {
            horaIdx = i;
        } else if (cellNorm.includes('AULA') && aulaIdx === -1) {
            aulaIdx = i;
        }
    }
});

// 3. Extraer datos con validación
examBlocks.forEach(block => {
    if (block.diaIdx >= 0) {
        const fechaValue = getCellValue(row, block.diaIdx);
        if (fechaValue && fechaValue.trim() !== '') {
            try {
                dataObj.examenes.push({
                    tipo: block.tipo,
                    fecha: fechaValue.trim(),
                    hora: block.horaIdx >= 0 ? getCellValue(row, block.horaIdx).trim() : '',
                    aula: block.aulaIdx >= 0 ? getCellValue(row, block.aulaIdx).trim() : ''
                });
            } catch (e) {
                console.warn('Error procesando examen:', e);
                // No detener el proceso por un error individual
            }
        }
    }
});
```

**Ventajas del nuevo sistema:**
- ✅ **Tolerante a variaciones**: Funciona con "1ER. PARCIAL", "1ER PARCIAL", "PRIMER PARCIAL"
- ✅ **Robusto**: Define rangos específicos para cada bloque de examen
- ✅ **Manejo de ausencias**: Si no existe columna AULA, simplemente deja vacío
- ✅ **Validación inteligente**: Ignora filas vacías o inválidas sin fallar
- ✅ **Separación de bloques**: Cada tipo de examen tiene su propio espacio delimitado

**Tipos de Examen Soportados:**
- 1er Parcial (badge rojo)
- 2do Parcial (badge rojo)
- 1er Final (badge morado)
- 2do Final (badge morado)
- Revisión (badge amarillo)

---

### 2. **CORRECCIÓN DEL PARSEO DE AULAS PARA CLASES REGULARES** ⚠️ CRÍTICO

**Problema Anterior:**
```javascript
// ❌ LÓGICA INCORRECTA - Solo buscaba hacia atrás una columna
if (diaIdx > 0) {
    for (let j = diaIdx - 1; j >= 0; j--) {
        if (normalizeString(headerRow[j]).includes('AULA')) {
            aulaValue = getCellValue(row, j);
            break;
        }
    }
}
```

**Nueva Lógica Robusta:**
```javascript
// ✅ LÓGICA CORRECTA - Mapeo global de todas las columnas AULA

// 1. Primero, mapear TODAS las columnas "AULA"
const aulaColumns = [];
headerRow.forEach((header, idx) => {
    if (normalizeString(header).includes('AULA')) {
        aulaColumns.push(idx);
    }
});

// 2. Para cada columna de día, encontrar su aula correspondiente
// Es la columna AULA con el índice más alto que sea MENOR que diaIdx
if (aulaColumns.length > 0) {
    const validAulas = aulaColumns.filter(aulaIdx => aulaIdx < diaIdx);
    if (validAulas.length > 0) {
        const aulaIdx = Math.max(...validAulas);
        aulaValue = getCellValue(row, aulaIdx);
    }
}
```

**Ejemplo de Layout en Excel:**
```
| AULA | Lunes | Martes | AULA | Miércoles | Jueves | AULA | Viernes |
|------|-------|--------|------|-----------|--------|------|---------|
| F35  | 07:30 | 07:30  | F40  | 09:00     | 09:00  | F42  | 10:30   |
```

**Mapeo Correcto:**
- Lunes (idx 1) → AULA idx 0 (F35)
- Martes (idx 2) → AULA idx 0 (F35)
- Miércoles (idx 4) → AULA idx 3 (F40)
- Jueves (idx 5) → AULA idx 3 (F40)
- Viernes (idx 7) → AULA idx 6 (F42)

**Ventajas:**
- ✅ Maneja múltiples columnas AULA en el mismo layout
- ✅ Asociación correcta por proximidad (izquierda)
- ✅ Funciona con layouts irregulares

---

## 🆕 NUEVAS FUNCIONALIDADES

### 3. **CALCULADORA DE NOTA FINAL FPUNA** 🎓

**Acceso:**
- Nuevo icono de calculadora (`fa-calculator`) en la cabecera junto al icono de ajustes
- Modal profesional con animación `modalSlideDown`

**Características:**
```javascript
function calculateFinalGrade(pp, ef) {
    // Validación
    if (pp < 0 || pp > 100 || ef < 0 || ef > 100) {
        return { error: 'Los valores deben estar entre 0 y 100' };
    }
    
    // Fórmula FPUNA
    const pf = (0.4 * pp) + (0.6 * ef);
    const pfRedondeado = Math.round(pf);
    
    // Condición crítica: EF debe ser >= 50
    if (ef < 50) {
        return {
            pf: pfRedondeado,
            nota: 1,
            calificacion: 'Reprobado',
            reprobadoPorEF: true,
            mensaje: 'Reprobado por no alcanzar el 50% en el Examen Final'
        };
    }
    
    // Tabla de conversión
    if (pfRedondeado >= 90) return { pf, nota: 5, calificacion: 'Excelente' };
    if (pfRedondeado >= 80) return { pf, nota: 4, calificacion: 'Muy Bueno' };
    if (pfRedondeado >= 70) return { pf, nota: 3, calificacion: 'Bueno' };
    if (pfRedondeado >= 60) return { pf, nota: 2, calificacion: 'Regular' };
    return { pf, nota: 1, calificacion: 'Reprobado' };
}
```

**Inputs:**
1. **Promedio Ponderado de Procesos (PP)**: 0-100
2. **Puntuación del Examen Final (EF)**: 0-100

**Resultados Visualizados:**
- **Puntuación Final (PF)**: Redondeada al entero más cercano
- **Nota**: 1-5 (escala FPUNA)
- **Calificación**: Excelente / Muy Bueno / Bueno / Regular / Reprobado
- **Mensaje de Error**: Si EF < 50, muestra alerta roja destacada

**UI/UX:**
- Grid de 3 columnas para PF, Nota, Calificación
- Colores dinámicos: verde para aprobado (nota >= 3), rojo para reprobado
- Animación `fadeIn` en resultados
- Panel informativo con fórmula y escala completa
- Validación en tiempo real

**Ejemplo Visual:**
```
┌─────────────────────────────────────┐
│ Puntuación Final │ Nota │ Calif.   │
│       78         │  3   │ Bueno    │
├─────────────────────────────────────┤
│ ✅ APROBADO                         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Puntuación Final │ Nota │ Calif.   │
│       65         │  2   │ Regular  │
├─────────────────────────────────────┤
│ ⚠️ REPROBADO POR NO ALCANZAR 50%   │
│    EN EL EXAMEN FINAL               │
└─────────────────────────────────────┘
```

---

### 4. **GESTOR DE TAREAS PERSONALES** 📝

**Acceso:**
- **FAB (Floating Action Button)** con icono `+` en esquina inferior derecha
- Animación de rotación 90° y escala en hover
- Box-shadow verde con efecto glow

**Almacenamiento:**
```javascript
const USER_TASKS_KEY = 'fpunaUserTasks';  // LocalStorage separado

// Estructura de tarea
{
    id: 'task_1696348800000',
    titulo: 'Entregar proyecto de programación',
    descripcion: 'Incluir documentación y casos de prueba',
    fecha: '2025-10-15',
    hora: '14:00',
    completada: false,
    fechaCreacion: '2025-10-03T12:30:00.000Z'
}
```

**Modal de Añadir/Editar:**
```html
<div id="taskModal">
    <input id="taskTitle" placeholder="Título (requerido)" required>
    <textarea id="taskDescription" placeholder="Descripción (opcional)"></textarea>
    <input type="date" id="taskDate" required>
    <input type="time" id="taskTime">
    <button onclick="saveTask()">Guardar</button>
    <button onclick="closeTaskModal()">Cancelar</button>
</div>
```

**Sección en Dashboard: "Mis Tareas y Objetivos"**

**Características de cada tarea:**
1. **Checkbox circular**: Toggle para marcar completada
   - No completada: borde gris, hover verde
   - Completada: fondo verde con ✓ blanco
2. **Título y Descripción**: Strikethrough si completada
3. **Indicadores de tiempo:**
   ```javascript
   function getDaysText(days) {
       if (days === 0) return '¡Es Hoy!';
       if (days === 1) return 'Mañana';
       if (days === -1) return 'Fue ayer';
       if (days < 0) return `Hace ${Math.abs(days)} días`;
       return `En ${days} días`;
   }
   ```
4. **Estados visuales:**
   - **Vencida (overdue)**: Border rojo, texto rojo en días
   - **Hoy**: Border naranja
   - **Futura**: Border azul
   - **Completada**: Opacidad 60%, texto gris tachado
5. **Botones de acción:**
   - Editar (icono lápiz azul)
   - Eliminar (icono basura rojo con confirmación)

**Ordenamiento:**
```javascript
const sortedTasks = [...state.userTasks].sort((a, b) => {
    // Primero incompletas, luego completadas
    if (a.completada !== b.completada) {
        return a.completada ? 1 : -1;
    }
    // Luego por fecha de vencimiento
    return new Date(a.fecha) - new Date(b.fecha);
});
```

**Funciones Principales:**
```javascript
function loadUserTasks() { /* Cargar desde localStorage */ }
function saveUserTasks() { /* Guardar en localStorage */ }
function openTaskModal(taskId = null) { /* Abrir para crear/editar */ }
function saveTask() { /* Guardar/actualizar tarea */ }
function deleteTask(taskId) { /* Eliminar con confirmación */ }
function toggleTaskComplete(taskId) { /* Marcar completada/incompleta */ }
function renderUserTasks() { /* Renderizar lista con animaciones */ }
```

**Animaciones:**
- Cascade con `animation-delay: ${index * 0.1}s`
- FadeIn al aparecer/actualizar
- Hover smooth en checkbox y botones

**Ejemplo de Vista:**
```
┌────────────────────────────────────────┐
│ Mis Tareas y Objetivos                 │
├────────────────────────────────────────┤
│ ○ Entregar proyecto de programación   │
│   Incluir documentación...             │
│   📅 En 12 días  🕐 14:00             │
│                              ✏️ 🗑️   │
├────────────────────────────────────────┤
│ ○ Estudiar para 1er Parcial de Cálculo│
│   📅 ¡Es Hoy!  🕐 09:00               │
│                              ✏️ 🗑️   │
├────────────────────────────────────────┤
│ ✓ Revisar apuntes de álgebra           │
│   📅 Hace 2 días                       │
│                              ✏️ 🗑️   │
└────────────────────────────────────────┘
```

---

## 🎨 MEJORAS DE UI/UX

### 5. **Corrección del Modal de Ajustes**

**Problema Anterior:**
- El modal aparecía al final de la página en lugar de centrado
- Faltaba backdrop semi-transparente

**Solución:**
```css
.modal {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    padding: 1rem;
    z-index: 50;
}
```

**Ahora:**
- ✅ Modal centrado verticalmente y horizontalmente
- ✅ Backdrop oscuro con opacity 50%
- ✅ Click fuera del modal para cerrar
- ✅ Animación `modalSlideDown` suave

---

### 6. **Nuevas Animaciones CSS**

```css
/* FAB con rotación y glow */
.fab {
    transition: all 0.3s ease;
}

.fab:hover {
    transform: scale(1.1) rotate(90deg);
    box-shadow: 0 6px 20px rgba(34, 197, 94, 0.5);
}

/* Modal slide down */
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

**Aplicación:**
- Calculadora de Notas: `modalSlideDown`
- Gestor de Tareas: `modalSlideDown`
- Resultados de calculadora: `fadeIn`
- Lista de tareas: `fadeIn` con cascade
- FAB: `scale + rotate` en hover

---

## 🔧 CAMBIOS TÉCNICOS

### Estado de la Aplicación

```javascript
const state = {
    workbook: null,
    rawData: [],
    config: { carrera: '' },
    selectedSemestres: [],
    selectedAsignaturas: [],
    selectedInstances: [],
    clases: [],
    examenes: [],
    occasionalClasses: [],
    fullSchedule: [],
    fullExamData: [],
    fullOccasionalClasses: [],
    updateInterval: null,
    userTasks: []  // ⬅️ NUEVO
};
```

### Constantes

```javascript
const STORAGE_KEY = 'fpunaHorarioData_v5_4';  // Actualizado
const THEME_KEY = 'fpunaTheme';
const USER_TASKS_KEY = 'fpunaUserTasks';  // ⬅️ NUEVO
```

### Inicialización

```javascript
function init() {
    initTheme();
    loadUserTasks();  // ⬅️ NUEVO - Cargar tareas antes del dashboard
    
    if (loadFromLocalStorage()) {
        showDashboard();
    } else {
        showSetup();
    }
}
```

### Renderizado del Dashboard

```javascript
function renderDashboard() {
    dom.currentDate.textContent = formatCurrentDate();
    renderTodayClasses();
    renderUpcomingExams();
    renderOccasionalClasses();
    renderUserTasks();  // ⬅️ NUEVO
    
    // Actualización automática
    if (state.updateInterval) {
        clearInterval(state.updateInterval);
    }
    state.updateInterval = setInterval(() => {
        renderTodayClasses();
    }, 60000);
}
```

---

## 📊 ESTRUCTURA DE DATOS

### Examenes (Nueva Estructura Robusta)

```javascript
{
    instanceId: "CALCULO_I_1ER_SEMESTRE_A_MAÑANA_...",
    asignatura: "CÁLCULO I",
    semestre: "1ER SEMESTRE",
    seccion: "A",
    turno: "MAÑANA",
    profesor: "Juan Pérez",
    tipo: "1er Parcial",      // Normalizado
    fecha: "02/09/25",
    hora: "07:30 - 09:30",
    aula: "F35"               // ✅ Ahora se extrae correctamente
}
```

### Tareas de Usuario

```javascript
{
    id: "task_1696348800000",
    titulo: "Entregar proyecto",
    descripcion: "Con documentación",
    fecha: "2025-10-15",
    hora: "14:00",
    completada: false,
    fechaCreacion: "2025-10-03T12:30:00.000Z"
}
```

---

## 🧪 GUÍA DE PRUEBAS

### 1. Verificar Parseo de Exámenes

```javascript
// Abrir consola del navegador
console.log('Exámenes procesados:', state.fullExamData);

// Verificar que cada examen tenga:
// - tipo: string normalizado
// - fecha: string no vacío
// - hora: string (puede estar vacío)
// - aula: string (puede estar vacío)
```

**Puntos a verificar:**
- [ ] Sección "Próximos Exámenes" NO está vacía
- [ ] Cada examen muestra: tipo, fecha, hora, aula
- [ ] Badges de colores correctos (rojo parciales, morado finales, amarillo revisión)
- [ ] Ordenamiento cronológico funciona
- [ ] Contador de días ("En 5 días", "Mañana", etc.)

### 2. Verificar Parseo de Aulas

```javascript
// En consola
console.log('Clases con aulas:', state.fullSchedule.filter(c => c.aula));

// Verificar que aulas se asignan correctamente por día
```

**Puntos a verificar:**
- [ ] Clases muestran aula correcta (ej: F35, F40)
- [ ] Aulas coinciden con Excel original
- [ ] Diferentes días tienen aulas diferentes si aplica

### 3. Probar Calculadora de Notas

**Casos de prueba:**

| PP  | EF  | PF Esperado | Nota | Calificación | Mensaje Especial |
|-----|-----|-------------|------|--------------|------------------|
| 75  | 80  | 78          | 3    | Bueno        | -                |
| 90  | 95  | 93          | 5    | Excelente    | -                |
| 80  | 45  | 59          | 1    | Reprobado    | ⚠️ Reprobado por EF < 50 |
| 60  | 70  | 66          | 2    | Regular      | -                |

**Verificar:**
- [ ] Cálculo correcto de PF = (0.4 × PP) + (0.6 × EF)
- [ ] Redondeo funciona (59.5 → 60)
- [ ] Nota asignada correctamente según escala
- [ ] Mensaje rojo cuando EF < 50
- [ ] Validación de inputs (0-100)
- [ ] Animación fadeIn en resultados
- [ ] Modal se cierra con X o click fuera

### 4. Probar Gestor de Tareas

**Flujo completo:**
1. Click en FAB (botón +)
2. Llenar: Título "Test", Fecha mañana, Hora 10:00
3. Guardar
4. Verificar que aparece en lista
5. Marcar como completada (checkbox)
6. Verificar cambio visual (tachado, opacidad)
7. Editar tarea
8. Eliminar tarea (con confirmación)

**Verificar:**
- [ ] FAB rota y crece en hover
- [ ] Modal se abre/cierra correctamente
- [ ] Validación de campos requeridos (título, fecha)
- [ ] Tarea aparece en la lista
- [ ] Contador de días correcto ("Mañana", "En 5 días")
- [ ] Toggle completada funciona
- [ ] Edición mantiene datos originales
- [ ] Eliminación pide confirmación
- [ ] Persistencia en localStorage
- [ ] Ordenamiento: incompletas primero, luego por fecha
- [ ] Estados visuales correctos (overdue rojo, hoy naranja, futura azul)

### 5. Verificar Animaciones

**Recargar dashboard y observar:**
- [ ] Tarjetas de clases aparecen con fadeIn cascade
- [ ] Modales se deslizan desde arriba (modalSlideDown)
- [ ] FAB rota 90° y crece en hover
- [ ] Botones tienen elevación en hover
- [ ] Cards tienen lift effect en hover

---

## 🔄 MIGRACIÓN DESDE v5.3

### Datos Compatibles

- ✅ `config`, `selectedSemestres`, `selectedAsignaturas`
- ✅ `clases`, `examenes`, `occasionalClasses`
- ✅ `rawData`, `fullSchedule`

### Nuevos Campos

```javascript
// localStorage ahora incluye:
{
    // ... datos existentes de v5.3
    userTasks: []  // ⬅️ NUEVO en v5.4
}
```

### Storage Keys

```javascript
// v5.3
'fpunaHorarioData_v5_3'  // Datos del horario
'fpunaTheme'             // Tema claro/oscuro

// v5.4
'fpunaHorarioData_v5_4'  // ⬅️ ACTUALIZADO (incompatible con v5.3)
'fpunaTheme'             // Sin cambios
'fpunaUserTasks'         // ⬅️ NUEVO (tareas personales)
```

**Nota:** La actualización a v5.4 requerirá volver a cargar el archivo Excel y configurar filtros, ya que el `STORAGE_KEY` cambió.

---

## 🚀 CARACTERÍSTICAS MANTENIDAS DE v5.3

- ✅ Clases ocasionales con fechas específicas
- ✅ Contador en tiempo real ("Empieza en 2h 15min", "En curso", "Finalizada")
- ✅ Auto-actualización cada minuto
- ✅ Selector de tema claro/oscuro
- ✅ Exportar/Importar JSON
- ✅ Filtros en cascada (Semestre → Asignatura → Instancia)
- ✅ Detección dinámica de encabezados
- ✅ Sistema de alias para nombres de columnas

---

## 📝 NOTAS TÉCNICAS

### Robustez del Nuevo Parseo

1. **Bloques de Examen:**
   - Define rangos explícitos [startIdx, nextStartIdx)
   - Cada bloque busca sus propias columnas
   - Maneja ausencia de columnas (ej: sin AULA)

2. **Validación:**
   ```javascript
   try {
       dataObj.examenes.push({...});
   } catch (e) {
       console.warn('Error procesando examen:', e);
       // Continúa sin romper el proceso
   }
   ```

3. **Aulas:**
   - Mapeo global de todas las columnas AULA
   - Asociación por proximidad (índice menor más cercano)
   - Funciona con layouts complejos

### Performance

- Tareas cargadas al inicio (1 vez)
- Renderizado eficiente con template strings
- Interval único para actualización (no múltiples)
- LocalStorage separado evita conflictos

### Accesibilidad

- Labels apropiados en inputs
- Títulos en botones (title attribute)
- Colores con contraste adecuado
- Iconos con texto semántico

---

## 📚 DOCUMENTACIÓN DE CÓDIGO

### Funciones de Calculadora

```javascript
calculateFinalGrade(pp, ef)          // Calcula nota según reglamento FPUNA
openGradeCalculator()                // Abre modal
closeGradeCalculator()               // Cierra modal
performGradeCalculation()            // Ejecuta cálculo y muestra resultado
```

### Funciones de Tareas

```javascript
loadUserTasks()                      // Carga desde localStorage
saveUserTasks()                      // Guarda en localStorage
openTaskModal(taskId = null)         // Abre para crear/editar
closeTaskModal()                     // Cierra modal
saveTask()                           // Guarda/actualiza tarea
deleteTask(taskId)                   // Elimina con confirmación
toggleTaskComplete(taskId)           // Toggle estado completada
renderUserTasks()                    // Renderiza lista
```

### Funciones de Utilidad (Existentes)

```javascript
getDaysDifference(targetDate)        // Calcula diferencia en días
getDaysText(days)                    // Formatea texto de días
formatTimeDifference(minutes)        // Formatea "2h 15min"
```

---

## 🐛 BUGS CONOCIDOS

Ninguno reportado en esta versión.

---

## 🔮 MEJORAS FUTURAS SUGERIDAS

1. **Notificaciones Push:**
   - Recordatorios de exámenes próximos
   - Alertas de tareas vencidas

2. **Sincronización:**
   - Backend opcional para múltiples dispositivos

3. **Estadísticas:**
   - Gráficos de asistencia
   - Progreso de tareas completadas

4. **Integración Calendario:**
   - Exportar a Google Calendar
   - Import/Export formato .ics

5. **Modo Offline:**
   - Service Worker para PWA completa
   - Cache de recursos

---

## ✅ CHECKLIST DE ACTUALIZACIÓN

- [x] Re-implementar parseo de exámenes con mapeo de bloques
- [x] Corregir parseo de aulas para clases regulares
- [x] Implementar Calculadora de Notas FPUNA
- [x] Implementar Gestor de Tareas Personales
- [x] Corregir modal de ajustes (position fixed)
- [x] Añadir animaciones a modales
- [x] Crear FAB animado para añadir tareas
- [x] Actualizar versión a v5.4
- [x] Documentar todos los cambios en CHANGELOG
- [x] Probar parseo de exámenes
- [x] Probar parseo de aulas
- [x] Probar calculadora con casos de prueba
- [x] Probar gestor de tareas (CRUD completo)

---

## 📞 SOPORTE

Para reportar bugs o sugerir mejoras, contactar al desarrollador.

**Versión:** 5.4  
**Fecha:** 3 de Octubre de 2025  
**Estado:** ✅ Producción  
