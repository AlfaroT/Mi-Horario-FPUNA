# 🧪 GUÍA DE PRUEBAS - Mi Horario FPUNA v5.4

## 📋 Checklist de Verificación

### ✅ PASO 1: Verificar Corrección de Exámenes (CRÍTICO)

**Objetivo:** Confirmar que el parseo de exámenes ahora funciona correctamente

**Acciones:**
1. Cargar tu archivo Excel de FPUNA
2. Configurar filtros (carrera, semestres, materias)
3. Ir al Dashboard
4. Buscar la sección **"Próximos Exámenes y Revisiones"**

**✓ Verificaciones:**
- [ ] La sección NO está vacía
- [ ] Se muestran exámenes con:
  - Tipo (1er Parcial, 2do Parcial, 1er Final, 2do Final, Revisión)
  - Fecha
  - Hora
  - Aula
- [ ] Los badges tienen colores correctos:
  - 🔴 Rojo: Parciales
  - 🟣 Morado: Finales
  - 🟡 Amarillo: Revisión
- [ ] El contador de días funciona ("En 5 días", "Mañana", etc.)

**🐛 Si algo falla:**
- Abrir la consola del navegador (F12)
- Buscar mensajes de error en rojo
- Verificar: `console.log(state.fullExamData)`
- Debería mostrar un array con objetos de exámenes

---

### ✅ PASO 2: Verificar Corrección de Aulas en Clases

**Objetivo:** Confirmar que las aulas se asignan correctamente a cada clase

**Acciones:**
1. En el Dashboard, ver la sección **"Clases de Hoy"** (si hay clases hoy)
2. O ir a la vista de horario completo

**✓ Verificaciones:**
- [ ] Cada clase muestra su aula (ej: F35, F40, F42)
- [ ] Las aulas coinciden con las del archivo Excel original
- [ ] Clases de diferentes días pueden tener aulas diferentes

**🔍 Inspección en Consola:**
```javascript
// Abrir consola (F12) y ejecutar:
console.log(state.fullSchedule.filter(c => c.aula));
// Debería mostrar clases con sus aulas
```

---

### ✅ PASO 3: Probar Calculadora de Notas FPUNA

**Ubicación:** Icono de calculadora (🧮) en la cabecera, al lado del icono de ajustes

**Casos de Prueba:**

#### 🧪 Caso 1: Aprobado con Buena Nota
**Input:**
- PP (Promedio de Procesos): `75`
- EF (Examen Final): `80`

**Resultado Esperado:**
- PF (Puntuación Final): `78`
- Nota: `3`
- Calificación: `Bueno`
- Color: Verde
- Sin mensaje de error

#### 🧪 Caso 2: Excelente
**Input:**
- PP: `90`
- EF: `95`

**Resultado Esperado:**
- PF: `93`
- Nota: `5`
- Calificación: `Excelente`
- Color: Verde

#### 🧪 Caso 3: Reprobado por EF Insuficiente (CRÍTICO)
**Input:**
- PP: `80`
- EF: `45`

**Resultado Esperado:**
- PF: `59`
- Nota: `1`
- Calificación: `Reprobado`
- Color: Rojo
- **Mensaje Especial:** ⚠️ "Reprobado por no alcanzar el 50% en el Examen Final"

#### 🧪 Caso 4: Regular
**Input:**
- PP: `60`
- EF: `70`

**Resultado Esperado:**
- PF: `66`
- Nota: `2`
- Calificación: `Regular`

#### 🧪 Caso 5: Redondeo (Límite)
**Input:**
- PP: `50`
- EF: `65`

**Resultado Esperado:**
- PF: `59` (58 + redondeo → 59)
- Nota: `1`
- Calificación: `Reprobado`

**✓ Verificaciones de la UI:**
- [ ] Modal se abre con animación suave (slide down)
- [ ] Resultados aparecen con animación fadeIn
- [ ] Colores correctos (verde aprobado, rojo reprobado)
- [ ] Panel informativo muestra fórmula y escala
- [ ] Modal se cierra con X o click fuera
- [ ] Validación: no acepta valores < 0 o > 100

---

### ✅ PASO 4: Probar Gestor de Tareas

**Ubicación:** Botón flotante verde con símbolo **+** en la esquina inferior derecha

#### 🧪 Prueba 4.1: Crear Tarea Nueva

**Acciones:**
1. Click en el botón flotante (+)
2. Llenar formulario:
   - **Título:** "Entregar proyecto de programación"
   - **Descripción:** "Incluir documentación y casos de prueba"
   - **Fecha:** Seleccionar fecha 5 días en el futuro
   - **Hora:** "14:00"
3. Click en "Guardar"

**✓ Verificaciones:**
- [ ] Modal se abre con animación
- [ ] Campos obligatorios marcados con *
- [ ] Tarea aparece en la sección "Mis Tareas y Objetivos"
- [ ] Muestra: título, descripción, "En 5 días", hora
- [ ] Border azul (tarea futura)
- [ ] Animación fadeIn al aparecer

#### 🧪 Prueba 4.2: Marcar como Completada

**Acciones:**
1. Click en el checkbox circular de la tarea

**✓ Verificaciones:**
- [ ] Checkbox se llena de verde con ✓
- [ ] Título se tacha (strikethrough)
- [ ] Tarea se vuelve semi-transparente (opacity 60%)
- [ ] Tarea baja en la lista (completadas al final)

#### 🧪 Prueba 4.3: Editar Tarea

**Acciones:**
1. Click en icono de lápiz (editar) de una tarea
2. Cambiar título a "Proyecto MODIFICADO"
3. Guardar

**✓ Verificaciones:**
- [ ] Modal se abre con título "Editar Tarea"
- [ ] Campos pre-llenados con datos existentes
- [ ] Cambios se guardan correctamente
- [ ] Toast de confirmación "Tarea actualizada"

#### 🧪 Prueba 4.4: Eliminar Tarea

**Acciones:**
1. Click en icono de basura (eliminar)
2. Confirmar eliminación

**✓ Verificaciones:**
- [ ] Pide confirmación antes de eliminar
- [ ] Tarea desaparece de la lista
- [ ] Toast de confirmación "Tarea eliminada"

#### 🧪 Prueba 4.5: Tarea Vencida

**Acciones:**
1. Crear tarea con fecha de ayer
2. Observar en la lista

**✓ Verificaciones:**
- [ ] Border rojo
- [ ] Texto en rojo: "Hace 1 día"
- [ ] Ícono de alerta o color destacado

#### 🧪 Prueba 4.6: Tarea de Hoy

**Acciones:**
1. Crear tarea con fecha de hoy
2. Observar en la lista

**✓ Verificaciones:**
- [ ] Border naranja
- [ ] Texto: "¡Es Hoy!"
- [ ] Destacada visualmente

#### 🧪 Prueba 4.7: Persistencia

**Acciones:**
1. Crear varias tareas
2. Recargar la página (F5)

**✓ Verificaciones:**
- [ ] Todas las tareas siguen ahí
- [ ] Estados (completada/incompleta) se mantienen
- [ ] Orden correcto (incompletas primero, luego por fecha)

---

### ✅ PASO 5: Verificar Animaciones y UI/UX

#### 🎨 Animaciones del FAB (Botón Flotante)

**Acciones:**
1. Pasar el mouse sobre el botón + verde

**✓ Verificaciones:**
- [ ] Botón rota 90 grados
- [ ] Botón crece ligeramente (scale 1.1)
- [ ] Aparece glow verde alrededor
- [ ] Transición suave (0.3s)

#### 🎨 Animaciones de Modales

**Acciones:**
1. Abrir Calculadora de Notas
2. Cerrar y abrir Gestor de Tareas
3. Abrir Ajustes

**✓ Verificaciones:**
- [ ] Todos los modales se deslizan desde arriba (modalSlideDown)
- [ ] Backdrop oscuro semi-transparente
- [ ] Modales centrados en pantalla
- [ ] Se cierran con click fuera o botón X

#### 🎨 Animaciones de Listas

**Acciones:**
1. Recargar Dashboard (F5)
2. Observar carga de secciones

**✓ Verificaciones:**
- [ ] Tarjetas aparecen con efecto cascade (una tras otra)
- [ ] Delay escalonado (0.1s entre cada tarjeta)
- [ ] Efecto fadeIn suave

#### 🎨 Hover Effects

**Acciones:**
1. Pasar mouse sobre botones primarios (azules)
2. Pasar mouse sobre cards/tarjetas
3. Pasar mouse sobre botones secundarios

**✓ Verificaciones:**
- [ ] Botones primarios: elevación + sombra azul
- [ ] Cards: lift effect suave
- [ ] Transiciones smooth (sin saltos)

---

### ✅ PASO 6: Verificar Modal de Ajustes Corregido

**Acciones:**
1. Click en icono de engranaje (⚙️) en la cabecera
2. Observar posición del modal

**✓ Verificaciones:**
- [ ] Modal aparece centrado en pantalla
- [ ] NO aparece al final de la página
- [ ] Backdrop oscuro cubre toda la pantalla
- [ ] Se puede cerrar con X o click fuera
- [ ] Animación de entrada suave

**Contenido del Modal:**
- [ ] Toggle de tema oscuro/claro funciona
- [ ] Botón "Modificar Mis Filtros"
- [ ] Botón "Exportar a JSON"
- [ ] Botón "Importar JSON"
- [ ] Botón "Reiniciar App" (rojo)
- [ ] Info de versión: "Mi Horario FPUNA v5.4"
- [ ] Marcas de verificación de features nuevas

---

### ✅ PASO 7: Verificar Persistencia y Storage

#### 🔍 Inspección en LocalStorage

**Acciones:**
1. Abrir consola del navegador (F12)
2. Ir a pestaña "Application" o "Storage"
3. Ver "Local Storage" → file://

**✓ Verificaciones:**
```
fpunaHorarioData_v5_4:    // Datos del horario (JSON grande)
fpunaUserTasks:           // Tareas del usuario (JSON array)
fpunaTheme:               // "dark" o "light"
```

**Probar:**
1. Crear tarea de prueba
2. Verificar que `fpunaUserTasks` se actualiza inmediatamente
3. Borrar `fpunaUserTasks` manualmente en Storage
4. Recargar página
5. Verificar que sección de tareas está vacía (correcto)

---

## 📊 TABLA DE RESULTADOS

| Prueba | Estado | Observaciones |
|--------|--------|---------------|
| Exámenes visibles | ⬜ | |
| Aulas correctas | ⬜ | |
| Calculadora: Caso Aprobado | ⬜ | |
| Calculadora: Caso Reprobado EF | ⬜ | |
| Tareas: Crear | ⬜ | |
| Tareas: Completar | ⬜ | |
| Tareas: Editar | ⬜ | |
| Tareas: Eliminar | ⬜ | |
| Tareas: Persistencia | ⬜ | |
| Animación FAB | ⬜ | |
| Animación Modales | ⬜ | |
| Modal Ajustes Centrado | ⬜ | |

**Leyenda:**
- ✅ Funciona correctamente
- ⚠️ Funciona con problemas menores
- ❌ No funciona
- ⬜ No probado

---

## 🐛 REPORTAR PROBLEMAS

Si encuentras algún bug, anota:

1. **Descripción del problema:**
   - ¿Qué esperabas que pasara?
   - ¿Qué pasó realmente?

2. **Pasos para reproducir:**
   1. Paso 1
   2. Paso 2
   3. ...

3. **Mensajes de error en consola:**
   - Abrir F12 → Console
   - Copiar mensajes en rojo

4. **Captura de pantalla** (si aplica)

---

## ✨ FEATURES DESTACADAS A PROBAR

### 🔥 MÁS IMPORTANTE

1. **Parseo de Exámenes Corregido**
   - Antes: Sección vacía
   - Ahora: Todos los exámenes visibles con datos completos

2. **Calculadora de Notas**
   - Herramienta nueva y única
   - Implementa reglamento oficial FPUNA
   - Validación de EF >= 50

3. **Gestor de Tareas**
   - Planifica tus objetivos personales
   - Complementa el horario académico
   - Almacenamiento local persistente

### 🎨 DETALLES DE POLISH

- Animaciones suaves y profesionales
- Estados visuales claros (vencido/hoy/futuro)
- FAB con efecto wow
- Modales mejorados
- Dark mode perfecto

---

## 📝 NOTAS FINALES

- **Navegadores recomendados:** Chrome, Edge, Firefox (últimas versiones)
- **No requiere conexión a internet** después de la carga inicial
- **Datos 100% locales** (privacidad total)
- **Responsive:** Funciona en móvil y desktop

**¡Disfruta tu nueva versión mejorada! 🚀**
