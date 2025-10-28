import { state, HEADER_KEYWORDS, COLUMN_ALIASES, DIAS_SEMANA } from './state.js';
import { normalizeString, getCellValue, parseTimeRange, formatDate } from './utils.js';

// Detectar la fila de encabezados usando heurística
function detectHeaderRow(rawData, maxRowsToCheck = 20) {
    let bestScore = 0;
    let bestRowIndex = -1;
    let bestRow = null;
    
    const rowsToCheck = Math.min(maxRowsToCheck, rawData.length);
    
    for (let i = 0; i < rowsToCheck; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;
        
        let score = 0;
        for (const cell of row) {
            const cellNormalized = normalizeString(cell);
            if (HEADER_KEYWORDS.includes(cellNormalized)) {
                score++;
            }
            // Bonus por palabras parciales
            for (const keyword of HEADER_KEYWORDS) {
                if (cellNormalized.includes(keyword) && cellNormalized !== keyword) {
                    score += 0.5;
                }
            }
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestRowIndex = i;
            bestRow = row;
        }
    }
    
    // Umbral mínimo: al menos 4 coincidencias
    if (bestScore < 4) {
        throw new Error('No se pudo identificar una fila de encabezados válida. Verifica que el archivo tenga el formato correcto.');
    }
    
    console.log(`✓ Encabezado detectado en fila ${bestRowIndex + 1} (score: ${bestScore})`);
    return { rowIndex: bestRowIndex, headers: bestRow };
}

// Construir mapa de columnas usando sistema de alias
function buildColumnMap(headers) {
    const columnMap = {};
    const normalizedHeaders = headers.map((h, idx) => ({
        original: h,
        normalized: normalizeString(h),
        index: idx
    }));
    
    // Mapear cada campo usando sus alias
    for (const [fieldName, aliases] of Object.entries(COLUMN_ALIASES)) {
        let found = false;
        for (const alias of aliases) {
            const match = normalizedHeaders.find(h => h.normalized === alias);
            if (match) {
                columnMap[fieldName] = match.index;
                found = true;
                console.log(`  ✓ ${fieldName}: columna "${match.original}" (índice ${match.index})`);
                break;
            }
        }
        if (!found && (fieldName === 'asignatura' || fieldName === 'semestre')) {
            throw new Error(`No se pudo encontrar la columna obligatoria: ${fieldName}. Aliases buscados: ${aliases.join(', ')}`);
        }
    }
    
    // Mapear columnas de días y sus aulas asociadas - NUEVA LÓGICA ROBUSTA
    columnMap.dias = {};
    columnMap.aulas = {};
    
    // PASO 1: Mapear TODAS las columnas AULA primero
    const aulaColumns = [];
    normalizedHeaders.forEach((h, idx) => {
        if (h.normalized === 'AULA') {
            aulaColumns.push(idx);
        }
    });
    
    console.log(`  ℹ️  Columnas AULA encontradas: ${aulaColumns.length} en índices [${aulaColumns.join(', ')}]`);
    
    // PASO 2: Para cada día, encontrar el AULA correspondiente
    DIAS_SEMANA.forEach((dia) => {
        const diaNormalized = normalizeString(dia);
        const diaMatch = normalizedHeaders.find(h => h.normalized === diaNormalized);
        
        if (diaMatch) {
            columnMap.dias[dia] = diaMatch.index;
            
            // Encontrar el aula correspondiente: la columna AULA con el índice 
            // más alto que sea MENOR que el índice del día
            const validAulas = aulaColumns.filter(aulaIdx => aulaIdx < diaMatch.index);
            if (validAulas.length > 0) {
                const aulaIdx = Math.max(...validAulas);
                columnMap.aulas[dia] = aulaIdx;
                console.log(`  ✓ ${dia}: AULA en índice ${aulaIdx}`);
            } else {
                columnMap.aulas[dia] = null;
                console.log(`  ⚠️  ${dia}: No se encontró AULA asociada`);
            }
        }
    });
    
    // ============================================
    // NUEVO ALGORITMO v1.2.1: DETECCIÓN DE CLASES OCASIONALES
    // Buscar columna específica "Fechas de clases de sábados" como ancla del bloque
    // ============================================
    columnMap.occasionalColumns = null;
    
    console.log(`  🔍 Buscando bloque de clases ocasionales...`);
    console.log(`     Estrategia: Localizar columna "Fechas de clases de sábados (Turno Noche)"`);
    
    // Buscar la columna que contenga el patrón específico del encabezado de clases ocasionales
    let fechaColumnIndex = -1;
    for (let i = 0; i < normalizedHeaders.length; i++) {
        const header = normalizedHeaders[i];
        const normalized = header.normalized;
        
        // Búsqueda robusta: buscar el patrón específico del encabezado
        // Encabezado esperado: "Fechas de clases de sábados (Turno Noche)"
        // Después de normalización: "FECHAS DE CLASES DE SABADOS (TURNO NOCHE)"
        
        // Estrategia: Buscar que contenga TODAS estas palabras clave
        const containsFechas = normalized.includes('FECHA');
        const containsClases = normalized.includes('CLASE');
        const containsSabados = normalized.includes('SABADO');
        
        if (containsFechas && containsClases && containsSabados) {
            fechaColumnIndex = i;
            console.log(`  ✅ Columna de clases ocasionales encontrada en índice ${i}`);
            console.log(`     Encabezado original: "${header.original}"`);
            console.log(`     Encabezado normalizado: "${normalized}"`);
            break;
        }
    }
    
    if (fechaColumnIndex !== -1) {
        // Asumimos: AULA en (fechaIdx - 2), HORARIO en (fechaIdx - 1), FECHA en (fechaIdx)
        const aulaIdx = fechaColumnIndex - 2;
        const horarioIdx = fechaColumnIndex - 1;
        
        if (aulaIdx >= 0 && horarioIdx >= 0) {
            columnMap.occasionalColumns = {
                aula: aulaIdx,
                horario: horarioIdx,
                fecha: fechaColumnIndex
            };
            
            console.log(`  ✅ Bloque de clases ocasionales mapeado:`);
            console.log(`     AULA: índice ${aulaIdx} (${normalizedHeaders[aulaIdx].original})`);
            console.log(`     HORARIO: índice ${horarioIdx} (${normalizedHeaders[horarioIdx].original})`);
            console.log(`     FECHA: índice ${fechaColumnIndex} (${normalizedHeaders[fechaColumnIndex].original})`);
        } else {
            console.warn(`  ⚠️  Columna FECHA encontrada pero no hay suficientes columnas antes`);
        }
    } else {
        console.log(`  ℹ️  No se encontró columna de clases ocasionales`);
        console.log(`     Buscando patrón: "Fechas de clases de sábados"`);
        console.log(`     Palabras clave requeridas: FECHA + CLASE + SABADO`);
        console.log(`  `);
        console.log(`     📋 Todas las columnas del Excel:`);
        normalizedHeaders.forEach((col, idx) => {
            // Marcar columnas que contengan alguna palabra clave
            const marks = [];
            if (col.normalized.includes('FECHA')) marks.push('📅');
            if (col.normalized.includes('CLASE')) marks.push('📚');
            if (col.normalized.includes('SABADO')) marks.push('📆');
            const marker = marks.length > 0 ? ` ${marks.join('')}` : '';
            console.log(`       [${idx}] "${col.original}"${marker}`);
        });
    }
    
    return columnMap;
}

function parseOccasionalDates(text) {
    // TAREA #1 v1.0: Algoritmo ROBUSTO para clases ocasionales (Sábados)
    // Buscar fechas entre comillas usando expresión regular: "02/08, 20/09, 15/11"
    const match = text.match(/"([^"]+)"/);
    if (!match) {
        // Si no hay comillas, intentar buscar fechas directamente en el formato dd/mm
        const directDates = text.match(/\b\d{1,2}\/\d{1,2}\b/g);
        if (directDates && directDates.length > 0) {
            console.log(`✅ Clases ocasionales encontradas (sin comillas): ${directDates.join(', ')}`);
            return directDates;
        }
        console.log('📅 Sin fechas ocasionales en:', text.substring(0, 50));
        return [];
    }
    
    // Extraer el contenido entre comillas, limpiar y dividir por comas
    const datesStr = match[1];
    const dates = datesStr.split(',')
        .map(d => d.trim())
        .filter(d => d && d.length > 0 && d.match(/\d+\/\d+/));
    
    console.log(`✅ Clases ocasionales encontradas: ${dates.length > 0 ? dates.join(', ') : 'ninguna'}`);
    return dates;
}

export function processSheetData(sheetName) {
    try {
        console.log(`\n📊 Procesando hoja: "${sheetName}"`);
        const worksheet = state.workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        console.log(`  Total de filas en Excel: ${rawData.length}`);
        
        // PASO 1: Detectar fila de encabezados dinámicamente
        const { rowIndex: headerRowIndex, headers: headerRow } = detectHeaderRow(rawData);
        
        // PASO 2: Construir mapa de columnas
        console.log(`\n🗺️  Construyendo mapa de columnas...`);
        const columnMap = buildColumnMap(headerRow);
        
        // PASO 3: Procesar filas de datos
        const dataRows = rawData.slice(headerRowIndex + 1);
        console.log(`\n📋 Procesando ${dataRows.length} filas de datos...`);
        
        const processedData = [];
        
        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            
            // Obtener valores usando el columnMap
            const asignatura = getCellValue(row, columnMap.asignatura);
            
            // Filtrar filas vacías o sin asignatura
            if (!asignatura || asignatura === '') continue;
            
            const dataObj = {
                asignatura,
                semestre: getCellValue(row, columnMap.semestre),
                seccion: getCellValue(row, columnMap.seccion),
                turno: getCellValue(row, columnMap.turno),
                enfasis: getCellValue(row, columnMap.enfasis),
                nombre: getCellValue(row, columnMap.nombre),
                apellido: getCellValue(row, columnMap.apellido),
                horarios: {},
                examenes: []
            };
            
            // Extraer horarios por día
            for (const [dia, colIndex] of Object.entries(columnMap.dias)) {
                const horario = getCellValue(row, colIndex);
                if (horario) {
                    dataObj.horarios[dia] = horario;
                }
            }
            
            // TAREA #2: ALGORITMO SIMPLIFICADO DE EXTRACCIÓN DE EXÁMENES
            // Mapeo directo de tipos de examen a columnas (PapaParse/SheetJS renombra duplicados)
            const examDateColumns = {
                '1er. Parcial': 'Día',      // Primera columna Día
                '2do. Parcial': 'Día_1',    // Segunda columna Día
                '1er. Final': 'Día_2',      // Tercera columna Día
                'Revisión 1er. Final': 'Día_3',  // Cuarta columna Día
                '2do. Final': 'Día_4',      // Quinta columna Día
                'Revisión 2do. Final': 'Día_5'   // Sexta columna Día
            };
            
            // Iterar sobre cada tipo de examen
            Object.entries(examDateColumns).forEach(([tipo, diaCol]) => {
                // Buscar el índice de la columna Día correspondiente
                const diaIdx = headerRow.findIndex((h, idx) => {
                    const normalized = normalizeString(h);
                    // Determinar qué columna Día es esta (contando ocurrencias)
                    let diaCount = 0;
                    for (let i = 0; i <= idx; i++) {
                        if (normalizeString(headerRow[i]).includes('DIA') || 
                            normalizeString(headerRow[i]).includes('FECHA')) {
                            if (i < idx) diaCount++;
                            if (i === idx && (normalized.includes('DIA') || normalized.includes('FECHA'))) {
                                // Verificar si es la columna Día que buscamos
                                if (diaCol === 'Día' && diaCount === 0) return true;
                                if (diaCol === 'Día_1' && diaCount === 1) return true;
                                if (diaCol === 'Día_2' && diaCount === 2) return true;
                                if (diaCol === 'Día_3' && diaCount === 3) return true;
                                if (diaCol === 'Día_4' && diaCount === 4) return true;
                                if (diaCol === 'Día_5' && diaCount === 5) return true;
                            }
                        }
                    }
                    return false;
                });
                
                if (diaIdx >= 0) {
                    const fechaValue = getCellValue(row, diaIdx);
                    if (fechaValue && fechaValue.trim() !== '' && 
                        fechaValue !== 'Día' && fechaValue !== 'FECHA' && fechaValue !== 'DÍA') {
                        
                        // La hora y el aula están inmediatamente a la derecha
                        const horaIdx = diaIdx + 1;
                        const aulaIdx = diaIdx + 2;
                        
                        try {
                            dataObj.examenes.push({
                                tipo: tipo,
                                fecha: fechaValue.trim(),
                                hora: horaIdx < row.length ? getCellValue(row, horaIdx).trim() : '',
                                aula: aulaIdx < row.length ? getCellValue(row, aulaIdx).trim() : ''
                            });
                        } catch (e) {
                            console.warn(`⚠️  Error procesando examen ${tipo}:`, e);
                        }
                    }
                }
            });
            
            // ============================================
            // NUEVO ALGORITMO v1.2: EXTRACCIÓN DE CLASES OCASIONALES
            // Procesar datos del bloque (AULA, HORARIO, FECHA)
            // ============================================
            if (columnMap.occasionalColumns) {
                const aulaOcasional = getCellValue(row, columnMap.occasionalColumns.aula);
                const horarioOcasional = getCellValue(row, columnMap.occasionalColumns.horario);
                const fechasStr = getCellValue(row, columnMap.occasionalColumns.fecha);
                
                if (fechasStr && fechasStr.trim() !== '') {
                    // Limpiar comillas dobles
                    let cleanedFechas = fechasStr.replace(/"/g, '').trim();
                    
                    // Dividir por comas para obtener fechas individuales
                    const fechas = cleanedFechas.split(',')
                        .map(f => f.trim())
                        .filter(f => f && f.match(/\d+\/\d+/)); // Validar formato DD/MM
                    
                    if (fechas.length > 0) {
                        // Almacenar en dataObj para uso posterior
                        dataObj.clasesOcasionales = {
                            aula: aulaOcasional.trim(),
                            horario: horarioOcasional.trim(),
                            fechas: fechas
                        };
                        
                        // Log para TODAS las clases ocasionales encontradas
                        console.log(`  📅 Clase ocasional encontrada: ${asignatura} → ${fechas.join(', ')}`);
                    }
                }
            }
            
            processedData.push(dataObj);
        }
        
        state.rawData = processedData;
        state.rawDataArray = dataRows; // Guardar array original para acceso por índice
        state.columnMap = columnMap; // Guardar para referencia
        
        console.log(`✅ Procesamiento exitoso: ${processedData.length} registros válidos\n`);
        return processedData;
        
    } catch (error) {
        console.error('❌ Error procesando hoja:', error);
        throw error;
    }
}

export function transformDataToSchedule() {
    console.log('\n🔄 Transformando datos a estructura de horario...');
    const clases = [];
    const examenes = [];
    const occasionalClasses = [];
    
    state.rawData.forEach(row => {
        const asignatura = row.asignatura;
        const semestre = row.semestre.toUpperCase();
        const seccion = row.seccion.toUpperCase();
        const turno = row.turno.toUpperCase();
        const enfasis = row.enfasis.toUpperCase();
        const profesor = `${row.nombre} ${row.apellido}`.trim();
        
        // Crear ID único para esta instancia de clase
        const instanceId = `${asignatura}_${semestre}_${seccion}_${turno}_${profesor}`.replace(/\s/g, '_').replace(/[^\w_]/g, '');
        
        // Procesar horarios por día
        for (const [dia, horario] of Object.entries(row.horarios)) {
            if (horario && horario.trim() !== '') {
                // Verificar si es sábado con fechas específicas
                if (dia.toUpperCase() === 'SÁBADO' || dia.toUpperCase() === 'SABADO') {
                    const fechas = parseOccasionalDates(horario);
                    
                    if (fechas.length > 0) {
                        // Es una clase ocasional con fechas específicas
                        const timeRange = parseTimeRange(horario);
                        // CORREGIDO: Regex para aula (sin barra invertida doble)
                        const aulaMatch = horario.match(/F(\d+)/);
                        const aula = aulaMatch ? `F${aulaMatch[1]}` : '';
                        
                        fechas.forEach(fechaStr => {
                            occasionalClasses.push({
                                instanceId,
                                asignatura,
                                semestre,
                                seccion,
                                turno,
                                enfasis,
                                profesor,
                                fecha: fechaStr,
                                hora: timeRange ? `${timeRange.start} - ${timeRange.end}` : '',
                                horaInicio: timeRange ? timeRange.start : '',
                                horaFin: timeRange ? timeRange.end : '',
                                aula: aula,
                                horarioCompleto: horario.trim()
                            });
                        });
                        continue; // No agregar como clase regular
                    }
                }
                
                // Clase regular (incluyendo sábados sin fechas específicas)
                let aula = '';
                if (state.columnMap && state.columnMap.aulas && state.columnMap.aulas[dia] !== null) {
                    const rowIndex = state.rawData.indexOf(row);
                    if (rowIndex >= 0 && state.rawDataArray && state.rawDataArray[rowIndex]) {
                        aula = getCellValue(state.rawDataArray[rowIndex], state.columnMap.aulas[dia]) || '';
                    }
                }
                
                clases.push({
                    instanceId,
                    asignatura,
                    semestre,
                    seccion,
                    turno,
                    enfasis,
                    profesor,
                    dia: dia.toUpperCase(),
                    hora: horario.trim(),
                    aula: aula
                });
            }
        }
        
        // ============================================
        // NUEVO ALGORITMO v1.2: TRANSFORMAR CLASES OCASIONALES
        // Crear un evento individual por cada fecha
        // ============================================
        if (row.clasesOcasionales && row.clasesOcasionales.fechas) {
            const { aula, horario, fechas } = row.clasesOcasionales;
            const timeRange = parseTimeRange(horario);
            
            // Log solo para la primera asignatura con clases ocasionales
            if (occasionalClasses.length === 0) {
                console.log(`  📅 Transformando clases ocasionales...`);
                console.log(`     Primera asignatura: ${asignatura}`);
                console.log(`     Fechas a transformar: ${fechas.join(', ')}`);
            }
            
            // Crear un evento por cada fecha individual
            fechas.forEach(fechaStr => {
                const ocasionalData = {
                    instanceId,
                    asignatura,
                    semestre,
                    seccion,
                    turno,
                    enfasis,
                    profesor,
                    fecha: fechaStr,
                    hora: horario,
                    horaInicio: timeRange ? timeRange.start : '',
                    horaFin: timeRange ? timeRange.end : '',
                    aula: aula || '',
                    horarioCompleto: `${horario} ${aula}`.trim()
                };
                
                console.log(`     📌 Clase ocasional: ${asignatura} - ${fechaStr}`);
                console.log(`        instanceId: ${instanceId}`);
                console.log(`        profesor: ${profesor}, sección: ${seccion}, turno: ${turno}`);
                
                occasionalClasses.push(ocasionalData);
            });
        }
        
        // Procesar exámenes (el tipo ya viene normalizado de processSheetData)
        row.examenes.forEach(examen => {
            if (examen.fecha && examen.fecha.trim() !== '') {
                examenes.push({
                    instanceId,
                    asignatura,
                    semestre,
                    seccion,
                    turno,
                    enfasis,
                    tipo: examen.tipo,
                    fecha: examen.fecha.trim(),
                    hora: examen.hora.trim(),
                    aula: examen.aula.trim()
                });
            }
        });
    });
    
    state.fullSchedule = clases;
    state.fullExamData = examenes;
    state.fullOccasionalClasses = occasionalClasses;
    console.log(`✅ Transformación completa: ${clases.length} clases, ${examenes.length} exámenes, ${occasionalClasses.length} clases ocasionales\n`);
}
