import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.document = { getElementById: () => null };

const { state } = await import('../src/js/state.js');
const { getCellValue } = await import('../src/js/utils.js');
const { processSheetData, transformDataToSchedule } = await import('../src/js/parser.js');

function row(width) {
    return Array(width).fill('');
}

function setupWorkbook(sheetName, groupHeader, header, dataRow) {
    const rows = Array.from({ length: 9 }, () => []);
    rows.push(groupHeader, header, dataRow);
    state.workbook = { Sheets: { [sheetName]: {} } };
    globalThis.XLSX = {
        utils: {
            sheet_to_json: () => rows
        }
    };
}

function buildRows() {
    const width = 42;
    const group = row(width);
    Object.assign(group, {
        14: 'Evaluación Primera Etapa',
        15: 'Evaluación Segunda Etapa',
        16: '1er. Final',
        19: 'Revisión',
        21: '2do. Final',
        24: 'Revisión',
        26: 'Mesa Examinadora'
    });

    const header = row(width);
    Object.assign(header, {
        0: 'Item', 2: 'Asignatura', 3: 'Nivel', 4: 'Sem/Grupo', 6: 'Enfasis',
        8: 'Turno', 9: 'Sección', 11: 'Apellido', 12: 'Nombre',
        14: 'Día', 15: 'Día', 16: 'Día', 17: 'Hora', 18: 'AULA',
        19: 'Día', 20: 'Hora', 21: 'Día', 22: 'Hora', 23: 'AULA',
        24: 'Día', 25: 'Hora', 26: 'Presidente', 27: 'Miembro', 28: 'Miembro',
        29: 'AULA', 30: 'Lunes', 31: 'AULA', 32: 'Martes', 33: 'AULA',
        34: 'Miércoles', 35: 'AULA', 36: 'Jueves', 37: 'AULA',
        38: 'Viernes', 39: 'AULA', 40: 'Sábado',
        41: 'Fechas de clases de sábados (Turno Noche)'
    });

    const data = row(width);
    Object.assign(data, {
        0: 1, 2: 'Cálculo I', 3: '---', 4: '7', 6: '-- --', 8: 'M', 9: 'MI',
        11: 'Pérez', 12: 'Ana',
        14: 'Lun 01/09/26', 15: 'Lun 03/11/26', 16: 'Lun 24/11/26',
        17: 0.625, 18: 'A58', 19: 'Lun 01/12/26', 20: 0.625,
        21: 'Lun 15/12/26', 22: 0.625, 23: 'A59',
        24: 'Lun 22/12/26', 25: 0.625, 30: '08:00 - 10:00',
        40: '07:30 -11:30', 41: '23/08; 17/10'
    });

    return { group, header, data };
}

test('convierte seriales de Excel a horas legibles', () => {
    assert.equal(getCellValue([0.625], 0), '15:00');
    assert.equal(getCellValue([0.5], 0), '12:00');
});

test('elige Sem/Grupo cuando Nivel viene como placeholder', () => {
    const { group, header, data } = buildRows();
    setupWorkbook('IIN', group, header, data);

    const processed = processSheetData('IIN');
    assert.equal(state.columnMap.semestreSource, 'Sem/Grupo');
    assert.equal(processed[0].semestre, '7');
});

test('conserva evaluaciones, primeros y segundos finales del Excel nuevo', () => {
    const { group, header, data } = buildRows();
    setupWorkbook('IAE', group, header, data);

    const processed = processSheetData('IAE');
    assert.deepEqual(processed[0].examenes.map(examen => examen.tipo), [
        'Evaluación Primera Etapa',
        'Evaluación Segunda Etapa',
        '1er. Final',
        'Revisión 1er. Final',
        '2do. Final',
        'Revisión 2do. Final'
    ]);
    assert.equal(processed[0].examenes[2].hora, '15:00');
    assert.equal(processed[0].examenes[4].aula, 'A59');

    transformDataToSchedule();
    assert.equal(state.fullExamData.length, 6);
});
