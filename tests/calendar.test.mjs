import test from 'node:test';
import assert from 'node:assert/strict';

import { parseDate } from '../src/js/calendar.js';

test('el calendario interpreta las fechas del Excel nuevo', () => {
    const samples = [
        ['Mar 01/12/26', 2026, 11, 1],
        ['Vie 04/12/26', 2026, 11, 4],
        ['Mie 25/11/26', 2026, 10, 25],
        ['15/12/26', 2026, 11, 15],
        ['2026-12-23', 2026, 11, 23]
    ];

    for (const [value, year, month, day] of samples) {
        const parsed = parseDate(value);

        assert.ok(parsed instanceof Date, `No se pudo interpretar: ${value}`);
        assert.equal(parsed.getFullYear(), year, `Año incorrecto para: ${value}`);
        assert.equal(parsed.getMonth(), month, `Mes incorrecto para: ${value}`);
        assert.equal(parsed.getDate(), day, `Día incorrecto para: ${value}`);
    }
});

test('el calendario rechaza fechas vacías o inválidas', () => {
    assert.equal(parseDate(''), null);
    assert.equal(parseDate('fecha desconocida'), null);
    assert.equal(parseDate(null), null);
});
