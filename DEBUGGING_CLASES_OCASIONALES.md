# 🔍 GUÍA DE DEBUGGING - CLASES OCASIONALES

## 📋 **INFORMACIÓN**

**Versión:** 1.1.1  
**Fecha:** 3 de octubre de 2025  
**Problema:** Las clases ocasionales no se muestran  
**Mejoras:** Enlaces EALU/EDUCA actualizados + Logs de debugging

---

## ✅ **CORRECCIONES APLICADAS**

### **1. Enlaces Actualizados**

```javascript
// EALU (antes):
href="https://ealu.pol.una.py/"

// EALU (ahora):
href="https://www.cnc.una.py/ealu/#/pages/login?returnUrl=%2Fperfil%2Fcedula-universitaria"

// EDUCA (antes):
href="https://educa.pol.una.py/"

// EDUCA (ahora):
href="https://grado.pol.una.py/login/index.php"
```

### **2. Sistema de Debugging Mejorado**

Se agregaron múltiples puntos de logging para diagnosticar el problema:

#### **A) Detección de Columnas:**
```javascript
console.log(`🔍 Buscando clases ocasionales después del índice ${maxDayIndex}...`);
console.log(`   Total de columnas en Excel: ${normalizedHeaders.length}`);

// Si se encuentran:
console.log(`✅ Columnas de clases ocasionales detectadas:`);
console.log(`   AULA: índice ${i} (${col1.original})`);
console.log(`   FECHAS: índice ${i + 1} (${col2.original})`);
console.log(`   HORA: índice ${i + 2} (${col3.original})`);

// Si NO se encuentran:
console.warn(`⚠️  NO se detectaron columnas de clases ocasionales`);
console.log(`   Últimas 10 columnas del Excel para debugging:`);
// Muestra los índices y nombres de las últimas 10 columnas
```

#### **B) Extracción de Datos:**
```javascript
// Ejemplo de la primera fila:
console.log(`🔍 Ejemplo de extracción de clases ocasionales (primera fila):`);
console.log(`   Aula: "${aulaOcasional}"`);
console.log(`   Fechas: "${fechasStr}"`);
console.log(`   Hora: "${horaOcasional}"`);

// Cuando se encuentra una clase ocasional:
console.log(`✅ Clase ocasional encontrada: ${asignatura}`);
console.log(`   Fechas extraídas: ${fechas.join(', ')}`);
```

#### **C) Transformación:**
```javascript
console.log(`📅 Procesando clases ocasionales para: ${asignatura}`);
console.log(`   Fechas a procesar: ${fechas.join(', ')}`);
```

---

## 🧪 **INSTRUCCIONES DE DEBUGGING**

### **Paso 1: Abrir la Aplicación**

1. Abre `index.html` en tu navegador
2. Presiona **F12** para abrir DevTools
3. Ve a la pestaña **Console**

### **Paso 2: Cargar el Archivo Excel**

1. Haz clic en **"Cargar Horario"**
2. Selecciona el archivo `.xlsx` de FPUNA
3. Observa la consola

### **Paso 3: Analizar los Logs**

#### **✅ ESCENARIO 1: Columnas Detectadas Correctamente**

Deberías ver algo como:

```
📊 Procesando hoja: "Hoja1"
  Total de filas en Excel: 150

🗺️  Construyendo mapa de columnas...
  ✓ asignatura: columna "ASIGNATURA" (índice 0)
  ✓ semestre: columna "SEMESTRE" (índice 1)
  ...
  ✓ SÁBADO: AULA en índice 25

🔍 Buscando clases ocasionales después del índice 30...
   Total de columnas en Excel: 50

✅ Columnas de clases ocasionales detectadas:
   AULA: índice 45 (__EMPTY_44)
   FECHAS: índice 46 (__EMPTY_45)
   HORA: índice 47 (__EMPTY_46)

📋 Procesando 120 filas de datos...

🔍 Ejemplo de extracción de clases ocasionales (primera fila):
   Aula: "F201"
   Fechas: "02/08, 20/09, 15/11"
   Hora: "07:30 - 11:30"

✅ Clase ocasional encontrada: CÁLCULO I
   Fechas extraídas: 02/08, 20/09, 15/11
```

**→ Si ves esto, las columnas se detectaron bien. Continúa al Paso 4.**

---

#### **❌ ESCENARIO 2: Columnas NO Detectadas**

Verás algo como:

```
🔍 Buscando clases ocasionales después del índice 30...
   Total de columnas en Excel: 35

⚠️  NO se detectaron columnas de clases ocasionales
   Últimas 10 columnas del Excel para debugging:
     [25] "SÁBADO" (normalizado: "SABADO")
     [26] "AULA" (normalizado: "AULA")
     [27] "1er. Parcial" (normalizado: "1ERPARCIAL")
     [28] "Día" (normalizado: "DIA")
     [29] "Hora" (normalizado: "HORA")
     [30] "AULA" (normalizado: "AULA")
     [31] "2do. Parcial" (normalizado: "2DOPARCIAL")
     [32] "Día" (normalizado: "DIA")
     [33] "Hora" (normalizado: "HORA")
     [34] "AULA" (normalizado: "AULA")
```

**→ Si ves esto, comparte esta información. Las columnas AS, AT, AU no están después de los días regulares.**

---

### **Paso 4: Aplicar Filtros**

1. Selecciona tu carrera, semestres y asignaturas
2. Haz clic en **"Guardar y Ver Mi Horario"**
3. Busca la sección **"Próximas Clases Ocasionales"**

---

## 📊 **DIAGNÓSTICO**

### **Caso A: Columnas Detectadas pero No Aparecen Clases**

**Posibles causas:**

1. **Las fechas ya pasaron:**
   - Las clases ocasionales solo muestran fechas futuras
   - Verifica si las fechas en el Excel son actuales

2. **Filtros no incluyen esas asignaturas:**
   - Verifica que seleccionaste las asignaturas correctas
   - Verifica el semestre

3. **Formato de fechas incorrecto:**
   - Debe ser: `"02/08, 20/09, 15/11"`
   - NO: `02/08 - 20/09 - 15/11`
   - NO: `02-08, 20-09`

### **Caso B: Columnas NO Detectadas**

**Información necesaria:**

1. **Copia completa de los logs de la consola**
2. **Especialmente la sección:**
   ```
   Últimas 10 columnas del Excel para debugging:
   ```

3. **Captura de pantalla del Excel** mostrando:
   - Encabezados de las columnas (primera fila)
   - Últimas 5-10 columnas a la derecha
   - Una fila con datos de ejemplo

---

## 🛠️ **SOLUCIONES POSIBLES**

### **Si las columnas están en una posición diferente:**

Puedo ajustar el algoritmo de detección si me proporcionas:

1. Los índices exactos de las columnas de clases ocasionales
2. Los nombres de esas columnas en el Excel
3. Un ejemplo de una fila con clases ocasionales

### **Si el formato es diferente:**

Si las fechas no están en formato `"02/08, 20/09"`, puedo adaptar el parser.

**Ejemplos de formatos soportados actualmente:**
- ✅ `"02/08, 20/09, 15/11"`
- ✅ `"02/08,20/09,15/11"` (sin espacios)
- ✅ `"2/8, 20/9"` (sin ceros a la izquierda)
- ❌ `02/08 - 20/09` (guiones no soportados)
- ❌ `02-08, 20-09` (formato DD-MM no soportado)

---

## 📋 **CHECKLIST DE INFORMACIÓN PARA COMPARTIR**

Si el problema persiste, necesito:

- [ ] **Logs completos de la consola** (desde que cargas el Excel)
- [ ] **Captura de pantalla** de las últimas columnas del Excel
- [ ] **Ejemplo de una fila** que contenga clases ocasionales
- [ ] **Formato de las fechas** en el Excel (copia/pega un ejemplo)
- [ ] **¿Aparece el mensaje** "Columnas detectadas" o "NO detectadas"?

---

## 🔧 **ACCIONES INMEDIATAS**

### **1. Prueba los Enlaces**

- [ ] Haz clic en el botón **EALU** (rojo)
- [ ] Verifica que abra: `https://www.cnc.una.py/ealu/...`
- [ ] Haz clic en el botón **EDUCA** (naranja)
- [ ] Verifica que abra: `https://grado.pol.una.py/login/index.php`

### **2. Revisa la Consola**

- [ ] Abre DevTools (F12)
- [ ] Pestaña Console
- [ ] Carga el Excel
- [ ] Copia TODO el output
- [ ] Compártelo aquí

### **3. Verifica el Excel**

- [ ] Abre el archivo `.xlsx` en Excel/LibreOffice
- [ ] Ve a la última columna de la derecha
- [ ] Busca columnas con:
  - Aulas (ej: F201, F302)
  - Fechas múltiples (ej: 02/08, 20/09)
  - Horarios de sábado
- [ ] Anota los nombres de esas columnas

---

**Con esta información podré diagnosticar y corregir el problema exacto.** 🚀
