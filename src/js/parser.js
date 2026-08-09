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

export function isScheduleSheet(sheetName) {
    try {
        const worksheet = state.workbook?.Sheets?.[sheetName];
        if (!worksheet || typeof XLSX === 'undefined') return false;

        const rawData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            raw: false
        });

        return rawData.slice(0, 20).some(row => {
            const normalized = row.map(normalizeString);
            return normalized.includes('ASIGNATURA') &&
                (normalized.includes('NIVEL') || normalized.includes('SEM/GRUPO')) &&
                normalized.includes('TURNO');
        });
    } catch (error) {
        console.warn(`No se pudo validar la hoja "${sheetName}":`, error);
        return false;
    }
}

function isExamDateHeader(normalizedHeader) {
    // La columna de fechas de clases ocasionales también contiene "FECHAS",
    // pero no forma parte de un bloque de examen.
    return (normalizedHeader.includes('DIA') || normalizedHeader.includes('FECHA')) &&
        !normalizedHeader.includes('CLASE') &&
        !normalizedHeader.includes('SABADO');
}

function getExamBlockKind(title) {
    const normalized = normalizeString(title).replace(/\s+/g, ' ');
    if (!normalized) return null;

    if (normalized.includes('MESA EXAMINADORA')) return 'mesa';
    if (normalized.includes('EVALUACION') && normalized.includes('PRIMERA')) return 'evaluationFirst';
    if (normalized.includes('EVALUACION') && normalized.includes('SEGUNDA')) return 'evaluationSecond';
    if ((normalized.includes('1ER') || normalized.includes('PRIMER')) && normalized.includes('PARCIAL')) return 'firstPartial';
    if ((normalized.includes('2DO') || normalized.includes('SEGUNDO')) && normalized.includes('PARCIAL')) return 'secondPartial';
    if ((normalized.includes('1ER') || normalized.includes('PRIMER')) && normalized.includes('FINAL')) return 'firstFinal';
    if ((normalized.includes('2DO') || normalized.includes('SEGUNDO')) && normalized.includes('FINAL')) return 'secondFinal';
    if (normalized === 'REVISION' || normalized.startsWith('REVISION ')) return 'revision';

    return null;
}

function getCanonicalExamType(kind, lastFinalType) {
    switch (kind) {
        case 'evaluationFirst': return 'Evaluación Primera Etapa';
        case 'evaluationSecond': return 'Evaluación Segunda Etapa';
        case 'firstPartial': return '1er. Parcial';
        case 'secondPartial': return '2do. Parcial';
        case 'firstFinal': return '1er. Final';
        case 'secondFinal': return '2do. Final';
        case 'revision': return lastFinalType ? `Revisión ${lastFinalType}` : 'Revisión';
        default: return 'Examen';
    }
}

function findExamBlocks(headers, groupHeaders = []) {
    const candidates = [];
    const sourceHeaders = Array.isArray(groupHeaders) && groupHeaders.length > 0
        ? groupHeaders
        : headers;

    sourceHeaders.forEach((title, index) => {
        const kind = getExamBlockKind(title);
        if (kind) candidates.push({ index, kind, title: String(title).trim() });
    });

    const blocks = [];
    let lastFinalType = '';

    candidates.forEach((candidate, candidateIndex) => {
        const nextStart = candidateIndex + 1 < candidates.length
            ? candidates[candidateIndex + 1].index
            : headers.length;

        if (candidate.kind === 'mesa') return;

        const tipo = getCanonicalExamType(candidate.kind, lastFinalType);
        if (candidate.kind === 'firstFinal' || candidate.kind === 'secondFinal') {
            lastFinalType = tipo;
        }

        let diaIdx = -1;
        let horaIdx = -1;
        let aulaIdx = -1;

        for (let i = candidate.index; i < nextStart; i++) {
            const normalized = normalizeString(headers[i]);
            if (diaIdx === -1 && isExamDateHeader(normalized)) {
                diaIdx = i;
            } else if (horaIdx === -1 && normalized.includes('HORA')) {
                horaIdx = i;
            } else if (aulaIdx === -1 && normalized === 'AULA') {
                aulaIdx = i;
            }
        }

        if (diaIdx >= 0) {
            blocks.push({ tipo, title: candidate.title, startIdx: candidate.index,
                endIdx: nextStart, diaIdx, horaIdx, aulaIdx });
        }
    });

    // Compatibilidad con archivos que no tienen títulos fusionados encima de
    // los subencabezados de las columnas.
    if (blocks.length === 0) {
        const dateIndexes = headers
            .map((header, index) => ({ index, normalized: normalizeString(header) }))
            .filter(({ normalized }) => isExamDateHeader(normalized))
            .map(({ index }) => index);
        const legacyTypes = [
            '1er. Parcial', '2do. Parcial', '1er. Final',
            'Revisión 1er. Final', '2do. Final', 'Revisión 2do. Final'
        ];

        dateIndexes.forEach((diaIdx, index) => {
            const endIdx = index + 1 < dateIndexes.length
                ? dateIndexes[index + 1]
                : Math.min(headers.length, diaIdx + 3);
            const horaOffset = headers.slice(diaIdx + 1, endIdx)
                .findIndex(header => normalizeString(header).includes('HORA'));
            const aulaOffset = headers.slice(diaIdx + 1, endIdx)
                .findIndex(header => normalizeString(header) === 'AULA');

            blocks.push({
                tipo: legacyTypes[index] || 'Examen',
                title: legacyTypes[index] || 'Examen',
                startIdx: diaIdx,
                endIdx,
                diaIdx,
                horaIdx: horaOffset >= 0 ? diaIdx + 1 + horaOffset : -1,
                aulaIdx: aulaOffset >= 0 ? diaIdx + 1 + aulaOffset : -1
            });
        });
    }

    return blocks;
}

function isMeaningfulSemesterValue(value) {
    const normalized = normalizeString(value).replace(/\s+/g, '');
    if (!normalized || /^[-—]+$/.test(normalized)) return false;
    return !['NA', 'N/A', 'SD', 'S/D'].includes(normalized);
}

function rankSemesterColumns(normalizedHeaders, dataRows, asignaturaIndex = 2) {
    const candidates = normalizedHeaders.filter(({ normalized }) =>
        COLUMN_ALIASES.semestre.includes(normalized)
    );
    if (candidates.length === 0) return [];

    const rowsWithAsignatura = dataRows.filter(row =>
        isMeaningfulSemesterValue(row[asignaturaIndex])
    );
    const rowsToScore = rowsWithAsignatura.length > 0 ? rowsWithAsignatura : dataRows;

    return candidates.map(candidate => {
        const usefulValues = rowsToScore.filter(row =>
            isMeaningfulSemesterValue(row[candidate.index])
        ).length;
        return {
            ...candidate,
            coverage: usefulValues / Math.max(rowsToScore.length, 1),
            tieBreaker: candidate.normalized === 'SEM/GRUPO' ? 1 : 0
        };
    }).sort((a, b) => b.coverage - a.coverage || b.tieBreaker - a.tieBreaker);
}

function getSemesterValue(row, columnMap) {
    const candidateIndexes = columnMap.semestreCandidates?.length
        ? columnMap.semestreCandidates
        : [columnMap.semestre];

    for (const columnIndex of candidateIndexes) {
        const value = getCellValue(row, columnIndex);
        if (isMeaningfulSemesterValue(value)) return value;
    }
    return '';
}

// Construir mapa de columnas usando sistema de alias
function buildColumnMap(headers, groupHeaders = [], dataRows = []) {
    const columnMap = {};
    const normalizedHeaders = headers.map((h, idx) => ({
        original: h,
        normalized: normalizeString(h),
        index: idx
    }));
    
    // Mapear cada campo usando sus alias
    for (const [fieldName, aliases] of Object.entries(COLUMN_ALIASES)) {
        // NIVEL y SEM/GRUPO aparecen juntos en el Excel nuevo. La columna
        // correcta se selecciona por cobertura de valores útiles por fila.
        if (fieldName === 'semestre') continue;

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

    const rankedSemesterColumns = rankSemesterColumns(normalizedHeaders, dataRows, columnMap.asignatura);
    const semesterColumn = rankedSemesterColumns[0];
    if (!semesterColumn) {
        throw new Error(`No se pudo encontrar la columna obligatoria: semestre. Aliases buscados: ${COLUMN_ALIASES.semestre.join(', ')}`);
    }
    columnMap.semestre = semesterColumn.index;
    columnMap.semestreSource = semesterColumn.original;
    columnMap.semestreCandidates = rankedSemesterColumns.map(candidate => candidate.index);
    columnMap.semestreSources = rankedSemesterColumns.map(candidate => candidate.original);
    console.log(`  ✓ semestre: columna "${semesterColumn.original}" (índice ${semesterColumn.index}, cobertura ${Math.round(semesterColumn.coverage * 100)}%)`);
    
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
        // Buscar el sábado y su AULA asociada en vez de depender de posiciones
        // fijas; el Excel nuevo cambia el ancho de algunos bloques.
        const saturdayColumns = normalizedHeaders
            .filter((header, idx) => idx < fechaColumnIndex && header.normalized === 'SABADO')
            .map(header => header.index);
        const horarioIdx = saturdayColumns.length > 0
            ? Math.max(...saturdayColumns)
            : fechaColumnIndex - 1;
        const aulaColumnsBeforeSaturday = aulaColumns.filter(aulaIdx => aulaIdx < horarioIdx);
        const aulaIdx = aulaColumnsBeforeSaturday.length > 0
            ? Math.max(...aulaColumnsBeforeSaturday)
            : fechaColumnIndex - 2;
        
        if (aulaIdx >= 0 && horarioIdx >= 0) {
            columnMap.occasionalColumns = {
                aula: aulaIdx,
                horario: horarioIdx,
                fecha: fechaColumnIndex
            };
            
            console.log(`  ✅ Bloque de clases ocasionales mapeado:`);
            console.log(`     AULA: índice ${aulaIdx} (${normalizedHeaders[aulaIdx]?.original || '—'})`);
            console.log(`     HORARIO: índice ${horarioIdx} (${normalizedHeaders[horarioIdx]?.original || '—'})`);
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
    
    columnMap.examBlocks = findExamBlocks(headers, groupHeaders);
    console.log(`  ✓ Bloques de examen detectados: ${columnMap.examBlocks.length}`);
    columnMap.examBlocks.forEach(block => {
        console.log(`    • ${block.tipo}: Día ${block.diaIdx}, Hora ${block.horaIdx >= 0 ? block.horaIdx : '—'}, AULA ${block.aulaIdx >= 0 ? block.aulaIdx : '—'}`);
    });

    return columnMap;
}

function parseOccasionalDates(text) {
    if (!text) return [];

    // El Excel usa comas, punto y coma y, en algunos casos, comillas. Extraer
    // cada fecha evita juntar varios sábados en un único evento.
    const matches = String(text).match(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g) || [];
    return matches.filter((date, index) => matches.indexOf(date) === index);
}

export function processSheetData(sheetName) {
    try {
        console.log(`\n📊 Procesando hoja: "${sheetName}"`);
        const worksheet = state.workbook.Sheets[sheetName];
        // `raw: false` conserva la representación visible de Excel, como
        // 15:00 en lugar del serial numérico 0.625.
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            raw: false
        });
        
        console.log(`  Total de filas en Excel: ${rawData.length}`);
        
        // PASO 1: Detectar fila de encabezados dinámicamente
        const { rowIndex: headerRowIndex, headers: headerRow } = detectHeaderRow(rawData);
        
        const dataRows = rawData.slice(headerRowIndex + 1);

        // PASO 2: Construir mapa de columnas. La fila anterior contiene los
        // títulos fusionados de los bloques de evaluación.
        console.log(`\n🗺️  Construyendo mapa de columnas...`);
        const groupHeaderRow = headerRowIndex > 0 ? rawData[headerRowIndex - 1] : [];
        const columnMap = buildColumnMap(headerRow, groupHeaderRow, dataRows);
        
        // PASO 3: Procesar filas de datos
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
                sourceRowIndex: headerRowIndex + 1 + i,
                semestre: getSemesterValue(row, columnMap),
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
            
            // Cada bloque define sus propias columnas Día, Hora y AULA. Esto
            // conserva las evaluaciones por etapa y los dos finales del Excel
            // nuevo, aun cuando los bloques no tengan el mismo ancho.
            columnMap.examBlocks.forEach(block => {
                const fechaValue = getCellValue(row, block.diaIdx);
                if (!fechaValue || ['DIA', 'FECHA'].includes(normalizeString(fechaValue))) return;

                dataObj.examenes.push({
                    tipo: block.tipo,
                    fecha: fechaValue,
                    hora: block.horaIdx >= 0 ? getCellValue(row, block.horaIdx) : '',
                    aula: block.aulaIdx >= 0 ? getCellValue(row, block.aulaIdx) : ''
                });
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
                    const fechas = parseOccasionalDates(fechasStr);
                    
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
        state.rawDataArray = rawData; // Guardar array original para acceso por índice
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
        const semestre = String(row.semestre || '').toUpperCase();
        const seccion = String(row.seccion || '').toUpperCase();
        const turno = String(row.turno || '').toUpperCase();
        const enfasis = String(row.enfasis || '').toUpperCase();
        const profesor = `${row.nombre} ${row.apellido}`.trim();
        
        // Crear ID único para esta instancia de clase
        const instanceId = `${asignatura}_${semestre}_${seccion}_${turno}_${profesor}`.replace(/\s/g, '_').replace(/[^\w_]/g, '');
        
        // Procesar horarios por día
        for (const [dia, horario] of Object.entries(row.horarios)) {
            if (horario && horario.trim() !== '') {
                // Verificar si es sábado con fechas específicas
                if (dia.toUpperCase() === 'SÁBADO' || dia.toUpperCase() === 'SABADO') {
                    // En el Excel nuevo las fechas de sábados viven en una
                    // columna separada; no duplicar el mismo evento como clase
                    // semanal y como clase ocasional.
                    if (row.clasesOcasionales?.fechas?.length) {
                        continue;
                    }

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
                    const rowIndex = row.sourceRowIndex ?? state.rawData.indexOf(row);
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
