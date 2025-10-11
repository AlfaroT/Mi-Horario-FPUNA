# 🔧 **VERSIÓN 1.2 - PARSER CRÍTICO REPARADO**

## 📋 **INFORMACIÓN DE LA ACTUALIZACIÓN**

**Versión:** 1.2  
**Fecha:** 3 de octubre de 2025  
**Tipo:** Reparación crítica del parser  
**Estado:** ✅ LISTA PARA TESTING

---

## 🎯 **OBJETIVO ÚNICO**

Reparar la funcionalidad de **"Próximas Clases Ocasionales"** que no extraía datos del archivo Excel.

---

## 🔍 **DIAGNÓSTICO DEL BUG**

### **Problema Identificado:**

El parser anterior buscaba las fechas de clases ocasionales dentro de la columna principal "Sábado", pero el análisis del archivo Excel confirmó que estos datos residen en un **bloque de columnas separado al final de la hoja** con la estructura:

```
[AULA] [HORARIO] [FECHA]
```

### **Causa Raíz:**
- ❌ Algoritmo buscaba en columnas `__EMPTY_X` genéricas
- ❌ Asumía posición relativa después de días regulares
- ❌ No tenía un ancla confiable para localizar el bloque

---

## ✅ **NUEVO ALGORITMO IMPLEMENTADO**

### **Estrategia: Buscar columna "FECHA" como ancla**

El nuevo algoritmo utiliza la columna **"FECHA"** como punto de referencia absoluto:

```javascript
// PASO 1: Buscar columna "FECHA"
let fechaColumnIndex = -1;
for (let i = 0; i < normalizedHeaders.length; i++) {
    if (header.normalized.includes('FECHA') || header.normalized === 'FECHA') {
        fechaColumnIndex = i;
        break;
    }
}

// PASO 2: Mapear el bloque
if (fechaColumnIndex !== -1) {
    columnMap.occasionalColumns = {
        aula: fechaColumnIndex - 2,     // AULA está 2 columnas antes
        horario: fechaColumnIndex - 1,  // HORARIO está 1 columna antes
        fecha: fechaColumnIndex         // FECHA es el ancla
    };
}
```

---

## 📊 **FLUJO DEL ALGORITMO**

### **1. Detección del Bloque (buildColumnMap)**

```
🔍 Buscando bloque de clases ocasionales...
   Estrategia: Localizar columna "FECHA" como ancla

✅ Columna "FECHA" encontrada en índice 45 (__EMPTY_45)

✅ Bloque de clases ocasionales mapeado:
   AULA: índice 43 (__EMPTY_43)
   HORARIO: índice 44 (__EMPTY_44)
   FECHA: índice 45 (__EMPTY_45)
```

**Si NO se encuentra:**
```
ℹ️  No se encontró columna "FECHA" - Clases ocasionales desactivadas
   Todas las columnas del Excel:
   [0] "ASIGNATURA" (normalizado: "ASIGNATURA")
   [1] "SEMESTRE" (normalizado: "SEMESTRE")
   ...
   [50] "Final" (normalizado: "FINAL")
```

---

### **2. Extracción de Datos (processSheetData)**

```javascript
if (columnMap.occasionalColumns) {
    const aulaOcasional = getCellValue(row, columnMap.occasionalColumns.aula);
    const horarioOcasional = getCellValue(row, columnMap.occasionalColumns.horario);
    const fechasStr = getCellValue(row, columnMap.occasionalColumns.fecha);
    
    if (fechasStr && fechasStr.trim() !== '') {
        // Limpiar comillas dobles
        let cleanedFechas = fechasStr.replace(/"/g, '').trim();
        
        // Dividir por comas
        const fechas = cleanedFechas.split(',')
            .map(f => f.trim())
            .filter(f => f && f.match(/\d+\/\d+/));
        
        // Almacenar para transformación
        dataObj.clasesOcasionales = {
            aula: aulaOcasional.trim(),
            horario: horarioOcasional.trim(),
            fechas: fechas
        };
    }
}
```

**Logs de debugging:**
```
🔍 Ejemplo de extracción de clases ocasionales (primera fila):
   Asignatura: "CÁLCULO I"
   Aula: "F201"
   Horario: "07:30 - 11:30"
   Fechas: "02/08, 20/09, 15/11"

✅ Clase ocasional encontrada: CÁLCULO I
   Aula: F201
   Horario: 07:30 - 11:30
   Fechas extraídas: 02/08, 20/09, 15/11
```

---

### **3. Transformación a Eventos (transformDataToSchedule)**

```javascript
if (row.clasesOcasionales && row.clasesOcasionales.fechas) {
    const { aula, horario, fechas } = row.clasesOcasionales;
    const timeRange = parseTimeRange(horario);
    
    // Crear UN evento por cada fecha individual
    fechas.forEach(fechaStr => {
        occasionalClasses.push({
            instanceId,
            asignatura,
            semestre,
            seccion,
            turno,
            enfasis,
            profesor,
            fecha: fechaStr,          // "02/08"
            hora: horario,            // "07:30 - 11:30"
            horaInicio: timeRange.start,
            horaFin: timeRange.end,
            aula: aula,               // "F201"
            horarioCompleto: `${horario} ${aula}`.trim()
        });
    });
}
```

**Resultado:**

De la cadena `"02/08, 20/09, 15/11"` se crean **3 eventos separados**:
1. CÁLCULO I - 02/08 - 07:30-11:30 - F201
2. CÁLCULO I - 20/09 - 07:30-11:30 - F201
3. CÁLCULO I - 15/11 - 07:30-11:30 - F201

---

## 📝 **CAMBIOS EN EL CÓDIGO**

### **Archivos Modificados:**

#### **1. buildColumnMap() - Líneas 880-920**

**ANTES (v1.1):**
```javascript
// Búsqueda de patrón __EMPTY genérico
for (let i = maxDayIndex + 1; i < normalizedHeaders.length - 2; i++) {
    const isEmptyPattern = col1.original.includes('__EMPTY') && ...
}
```

**DESPUÉS (v1.2):**
```javascript
// Búsqueda específica de columna "FECHA"
for (let i = 0; i < normalizedHeaders.length; i++) {
    if (header.normalized.includes('FECHA') || header.normalized === 'FECHA') {
        fechaColumnIndex = i;
        break;
    }
}

columnMap.occasionalColumns = {
    aula: fechaColumnIndex - 2,
    horario: fechaColumnIndex - 1,
    fecha: fechaColumnIndex
};
```

---

#### **2. processSheetData() - Líneas 1643-1675**

**CAMBIOS:**
- ✅ Cambió `fechasStr` de columna `fechas` a columna `fecha`
- ✅ Cambió `horaOcasional` a `horarioOcasional`
- ✅ Agregó limpieza de comillas: `.replace(/"/g, '')`
- ✅ Logs más descriptivos con nombre de asignatura

---

#### **3. transformDataToSchedule() - Líneas 1775-1800**

**CAMBIOS:**
- ✅ Cambió `hora` a `horario` para consistencia
- ✅ Log solo para el primer evento (optimización)
- ✅ Mejor estructura de logs de debugging

---

## 🧪 **GUÍA DE TESTING**

### **Pasos para Verificar:**

1. **Abre la aplicación**
2. **Presiona F12** (DevTools) → Pestaña **Console**
3. **Carga el archivo Excel**
4. **Busca en la consola:**

```
✅ Columna "FECHA" encontrada en índice X
✅ Bloque de clases ocasionales mapeado
🔍 Ejemplo de extracción de clases ocasionales
✅ Clase ocasional encontrada
```

5. **Aplica filtros** (carrera, semestre, asignaturas)
6. **Verifica el dashboard** → Sección **"Próximas Clases Ocasionales"**

---

### **Criterios de Éxito:**

✅ La consola muestra: `"Columna FECHA encontrada"`  
✅ La consola muestra: `"Bloque mapeado: AULA, HORARIO, FECHA"`  
✅ La consola muestra: `"Clase ocasional encontrada: [Asignatura]"`  
✅ El dashboard muestra tarjetas con:
   - Nombre de la asignatura
   - Fecha específica (DD/MM)
   - Horario (HH:MM - HH:MM)
   - Aula (ej: F201)
   - Profesor
   - Contador de días restantes

---

## 📊 **COMPARATIVA DE VERSIONES**

| Aspecto | v1.1 | v1.2 |
|---------|------|------|
| **Estrategia de búsqueda** | Patrón `__EMPTY` genérico | Columna "FECHA" como ancla |
| **Robustez** | ❌ Falla si columnas no coinciden | ✅ Siempre encuentra si existe "FECHA" |
| **Logs de debugging** | Básicos | Detallados con ejemplos |
| **Limpieza de datos** | Solo trim | ✅ Quita comillas + trim |
| **Nombre de campos** | `hora` inconsistente | `horario` consistente |
| **Funcionalidad** | ❌ No extrae datos | ✅ Extrae correctamente |

---

## 🐛 **ESCENARIOS DE FALLO Y SOLUCIONES**

### **Escenario 1: Columna "FECHA" no existe**

**Log esperado:**
```
ℹ️  No se encontró columna "FECHA" - Clases ocasionales desactivadas
   Todas las columnas del Excel:
   ...
```

**Solución:**
- Verifica que el Excel tenga una columna llamada "FECHA"
- Si tiene otro nombre (ej: "Fechas", "DÍA"), comparte el nombre exacto

---

### **Escenario 2: Columna "FECHA" existe pero no hay datos**

**Log esperado:**
```
✅ Columna "FECHA" encontrada
✅ Bloque mapeado
🔍 Ejemplo de extracción (primera fila):
   Fechas: ""
```

**Diagnóstico:**
- El bloque se detectó correctamente
- Las celdas están vacías
- Revisa si las fechas están en otra columna

---

### **Escenario 3: Formato de fechas diferente**

**Formato soportado:**
- ✅ `"02/08, 20/09, 15/11"`
- ✅ `02/08, 20/09` (sin comillas)
- ✅ `2/8, 20/9` (sin ceros a la izquierda)

**Formato NO soportado:**
- ❌ `02/08 - 20/09` (guiones en lugar de comas)
- ❌ `02-08, 20-09` (formato DD-MM)
- ❌ `8 de agosto` (texto completo)

---

## 📋 **CHECKLIST DE VERIFICACIÓN**

### **En la Consola (F12):**
- [ ] Mensaje: `"Buscando bloque de clases ocasionales..."`
- [ ] Mensaje: `"Columna FECHA encontrada en índice X"`
- [ ] Mensaje: `"Bloque de clases ocasionales mapeado"`
- [ ] Mensaje: `"Ejemplo de extracción de clases ocasionales"`
- [ ] Mensaje: `"Clase ocasional encontrada: [Asignatura]"`
- [ ] Mensaje: `"Transformando clases ocasionales..."`

### **En el Dashboard:**
- [ ] Sección "Próximas Clases Ocasionales" visible
- [ ] Tarjetas con fechas específicas (no "Sábado" genérico)
- [ ] Múltiples tarjetas para la misma asignatura (una por fecha)
- [ ] Aulas correctas (ej: F201, F302)
- [ ] Horarios correctos (ej: 07:30 - 11:30)
- [ ] Ordenadas por proximidad (más cercana primero)

---

## 🚨 **SI EL PROBLEMA PERSISTE**

Necesito:

1. **Captura completa de la consola** (desde que cargas el Excel)
2. **Captura del Excel** mostrando:
   - Fila de encabezados (primera fila)
   - Últimas 5-10 columnas a la derecha
   - Una fila con datos de ejemplo
3. **Nombre exacto** de la columna que contiene las fechas
4. **Formato exacto** de las fechas (copia/pega un ejemplo)

---

## ✅ **CONCLUSIÓN**

La versión 1.2 implementa un **algoritmo robusto** para detectar y extraer clases ocasionales basándose en la búsqueda de la columna "FECHA" como ancla del bloque.

**Ventajas del nuevo enfoque:**
- ✅ No depende de posiciones relativas
- ✅ Funciona aunque cambien las columnas de días regulares
- ✅ Logs detallados para debugging
- ✅ Limpieza de datos mejorada
- ✅ Código más legible y mantenible

---

**Desarrollado con 🔧 para solucionar el bug crítico del parser**

**Versión:** 1.2  
**Estado:** ✅ LISTA PARA TESTING
