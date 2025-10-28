# ✅ CHECKLIST DE VERIFICACIÓN - VERSIÓN 1.1

## 📋 **INFORMACIÓN DE LA ACTUALIZACIÓN**

**Versión:** 1.1
**Fecha:** 3 de octubre de 2025
**Tipo:** Correcciones de bugs + Mejoras de funcionalidad

---

## 🎯 **OBJETIVOS COMPLETADOS**

### **TAREA #1: Correcciones de UI y Enlaces** ✅
- [x] Botones EALU/EDUCA redimensionados (compactos)
- [x] Botones centrados con flexbox
- [x] Enlaces con protocolo https:// completo

### **TAREA #2: Parser de Clases Ocasionales Reescrito** ✅
- [x] Detección automática de columnas AS, AT, AU
- [x] Extracción directa de fechas desde columna AT
- [x] Mapeo correcto de aulas y horarios

### **TAREA #3: Gestor de Tareas Completo (CRUD)** ✅
- [x] Marcar/desmarcar como completada
- [x] Fecha de completado registrada
- [x] Editar tareas activas
- [x] Eliminar con confirmación
- [x] Historial de tareas completadas
- [x] Sección colapsable para historial
- [x] Limpieza automática (>7 días)

---

## 🧪 **PRUEBAS DE VERIFICACIÓN**

### **1. BOTONES DE ACCESO DIRECTO**

#### 1.1 Tamaño y Posicionamiento
- [ ] Abrir `index.html` en el navegador
- [ ] Verificar que los botones EALU y EDUCA sean **compactos**
- [ ] Los botones deben estar **centrados horizontalmente**
- [ ] NO deben ocupar todo el ancho de la pantalla
- [ ] Deben tener espaciado adecuado entre sí

#### 1.2 Funcionalidad de Enlaces
- [ ] Hacer clic en el botón **EALU** (rojo)
- [ ] Verificar que se abra `https://ealu.pol.una.py/` en **nueva pestaña**
- [ ] Hacer clic en el botón **EDUCA** (naranja)
- [ ] Verificar que se abra `https://educa.pol.una.py/` en **nueva pestaña**
- [ ] Ambos enlaces deben funcionar correctamente

#### 1.3 Diseño Responsive
- [ ] Probar en pantalla de escritorio (>768px)
- [ ] Botones deben aparecer en línea horizontal
- [ ] Probar en móvil (<768px)
- [ ] Botones pueden aparecer uno debajo del otro o mantener línea

---

### **2. PARSER DE CLASES OCASIONALES**

#### 2.1 Carga del Archivo Excel
- [ ] Cargar el archivo de horarios FPUNA
- [ ] Abrir la **consola del navegador** (F12)
- [ ] Buscar el mensaje: `📅 Columnas de clases ocasionales detectadas:`
- [ ] Verificar que muestre los índices de columnas AS, AT, AU
- [ ] Ejemplo esperado:
  ```
  📅 Columnas de clases ocasionales detectadas:
     AULA: índice 44 (__EMPTY_44)
     FECHAS: índice 45 (__EMPTY_45)
     HORA: índice 46 (__EMPTY_46)
  ```

#### 2.2 Extracción de Fechas
- [ ] Después de aplicar filtros, ir a la sección **"Próximas Clases Ocasionales"**
- [ ] Verificar que las clases de sábado aparezcan con **fechas específicas**
- [ ] Ejemplo: "02/08", "20/09", "15/11"
- [ ] Cada fecha debe generar una tarjeta individual
- [ ] Las fechas deben estar **ordenadas cronológicamente**

#### 2.3 Datos Correctos
- [ ] Cada tarjeta de clase ocasional debe mostrar:
  - Nombre de la asignatura
  - Fecha específica (DD/MM)
  - Hora (HH:MM - HH:MM)
  - Aula (ej: F201)
  - Profesor
- [ ] Verificar que NO haya tarjetas vacías o con datos incompletos

---

### **3. GESTOR DE TAREAS (CRUD COMPLETO)**

#### 3.1 Crear Tarea
- [ ] Hacer clic en el botón verde flotante **+** (esquina inferior derecha)
- [ ] Rellenar el formulario:
  - Título: "Prueba v1.1"
  - Descripción: "Verificar CRUD"
  - Fecha: (seleccionar fecha futura)
  - Hora: (opcional)
- [ ] Hacer clic en **"Guardar"**
- [ ] La tarea debe aparecer en **"Mis Tareas y Objetivos"**

#### 3.2 Marcar como Completada
- [ ] Localizar la tarea creada
- [ ] Hacer clic en el **círculo vacío** (botón de completar)
- [ ] El círculo debe llenarse con un ✓ verde
- [ ] La tarea debe **moverse** a la sección de historial
- [ ] El título debe aparecer **tachado**
- [ ] Debe mostrar "Completada hace X min/h/d"

#### 3.3 Historial de Tareas Completadas
- [ ] Buscar la sección **"Historial de Tareas Completadas"**
- [ ] Hacer clic en el **botón gris con flecha**
- [ ] El historial debe **expandirse/colapsar**
- [ ] La flecha debe rotar (⬇️ ↔️ ⬆️)
- [ ] Dentro del historial, verificar que aparezca la tarea completada
- [ ] La tarjeta debe tener **opacidad reducida**

#### 3.4 Editar Tarea (Solo Activas)
- [ ] Crear una nueva tarea activa (no completada)
- [ ] Hacer clic en el **ícono de lápiz** (✏️)
- [ ] El modal debe abrirse con los datos pre-llenados
- [ ] Modificar el título o la fecha
- [ ] Guardar los cambios
- [ ] Verificar que los cambios se reflejen en la tarjeta
- [ ] **IMPORTANTE:** Las tareas completadas NO deben tener botón de editar

#### 3.5 Eliminar Tarea
- [ ] Localizar cualquier tarea (activa o completada)
- [ ] Hacer clic en el **ícono de basura** (🗑️)
- [ ] Debe aparecer un **diálogo de confirmación**
- [ ] Mensaje: "¿Estás seguro de que quieres eliminar esta tarea?"
- [ ] Hacer clic en **"Aceptar"**
- [ ] La tarea debe **desaparecer** inmediatamente

#### 3.6 Limpieza Automática (>7 días)
- [ ] **PRUEBA MANUAL:** Editar localStorage
  1. Abrir consola (F12) → pestaña "Application" → "Local Storage"
  2. Buscar la clave `fpunaUserTasks`
  3. Editar el JSON manualmente
  4. Cambiar `fechaCompletado` de una tarea completada a hace >7 días
  5. Ejemplo: `"fechaCompletado": "2025-09-20T10:00:00.000Z"`
  6. Recargar la página
  7. Verificar en consola: `🧹 Limpieza automática: X tareas antiguas eliminadas del historial`
  8. La tarea antigua NO debe aparecer en el historial

---

## 🎨 **VERIFICACIÓN VISUAL**

### **Tareas Activas vs Completadas**

| Elemento | Activa | Completada |
|----------|--------|------------|
| **Borde izquierdo** | Azul/Rojo/Naranja | Verde |
| **Título** | Normal | Tachado (line-through) |
| **Opacidad** | 100% | 75% |
| **Botón Editar** | ✅ Visible | ❌ Oculto |
| **Botón Eliminar** | ✅ Visible | ✅ Visible |
| **Fecha completado** | - | ✅ Muestra "hace X" |
| **Ubicación** | Sección principal | Historial colapsable |

---

## ⚙️ **VERIFICACIÓN TÉCNICA**

### **Consola del Navegador**

Al cargar la aplicación, deben aparecer estos mensajes:

```
═══════════════════════════════════════════════════════
  Mi Horario FPUNA v1.1 - MEJORAS Y CORRECCIONES  
═══════════════════════════════════════════════════════
✅ TAREA #1: BOTONES EALU/EDUCA AJUSTADOS
  ✓ Botones redimensionados: compactos y centrados
  ✓ Enlaces verificados con protocolo https://

✅ TAREA #2: PARSER DE CLASES OCASIONALES REESCRITO
  ✓ Detección de columnas AS, AT, AU del Excel
  ✓ Extracción directa de fechas desde columna AT
  ✓ Mapeo correcto de aulas y horarios

✅ TAREA #3: GESTOR DE TAREAS COMPLETO (CRUD)
  ✓ Marcar como completada con fecha de completado
  ✓ Editar tareas activas
  ✓ Eliminar con confirmación
  ✓ Historial de tareas completadas (colapsable)
  ✓ Limpieza automática de tareas >7 días

🎯 ESTADO: Versión 1.1 lista para producción
═══════════════════════════════════════════════════════
```

### **LocalStorage**

- [ ] Abrir DevTools → Application → Local Storage
- [ ] Verificar clave `fpunaUserTasks`
- [ ] El JSON debe contener:
  - `id`: string único
  - `titulo`: string
  - `descripcion`: string (opcional)
  - `fecha`: string (YYYY-MM-DD)
  - `hora`: string (HH:MM, opcional)
  - `completada`: boolean
  - `fechaCreacion`: string ISO
  - `fechaCompletado`: string ISO (solo si completada: true)

---

## 🚫 **ERRORES A VERIFICAR**

### **NO deben aparecer estos errores:**

- [ ] ❌ TypeError en consola
- [ ] ❌ "Cannot read property of undefined"
- [ ] ❌ Botones EALU/EDUCA ocupando todo el ancho
- [ ] ❌ Enlaces que no abren en nueva pestaña
- [ ] ❌ Clases ocasionales sin fechas
- [ ] ❌ Tareas completadas sin fecha de completado
- [ ] ❌ Botón de editar visible en tareas completadas
- [ ] ❌ Historial que no colapsa
- [ ] ❌ Tareas antiguas (>7 días) aún visibles después de recargar

---

## ✅ **CRITERIOS DE APROBACIÓN**

La versión 1.1 se considera **APROBADA** cuando:

1. ✅ **LOS BOTONES EALU Y EDUCA** son compactos, centrados y abren las plataformas correctamente
2. ✅ **EL PARSER DE CLASES OCASIONALES** detecta las columnas AS, AT, AU y muestra fechas específicas
3. ✅ **EL GESTOR DE TAREAS** permite crear, completar, editar y eliminar correctamente
4. ✅ **EL HISTORIAL** se colapsa/expande y muestra solo tareas completadas
5. ✅ **LA LIMPIEZA AUTOMÁTICA** elimina tareas completadas hace más de 7 días
6. ✅ **NO HAY ERRORES** en la consola del navegador

---

## 📝 **NOTAS DE TESTING**

### **Observaciones:**
```
[Espacio para anotar bugs encontrados o comportamientos inesperados]



```

### **Estado Final:**
- [ ] ✅ APROBADA - Lista para producción
- [ ] ⚠️ APROBADA CON RESERVAS - Bugs menores a corregir
- [ ] ❌ RECHAZADA - Bugs críticos encontrados

---

**Tester:** ___________________  
**Fecha de testing:** ___________________  
**Hora:** ___________________

