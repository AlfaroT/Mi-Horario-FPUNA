// El parser actualizado conserva los bloques de Primera/Segunda Final y
// selecciona la columna de semestre correcta del Excel nuevo. v7 invalida
// cargas v6 que pudieron haber sido guardadas antes de reprocesar el Excel.
export const STORAGE_KEY = 'miHorarioFPUNA_v7';
export const USER_TASKS_KEY = 'miHorarioFPUNA_userTasks_v1';
export const THEME_KEY = 'miHorarioFPUNA_theme_v1';

export const DIAS_SEMANA = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];

// Palabras clave para detectar encabezados (normalizadas)
export const HEADER_KEYWORDS = [
    'ASIGNATURA', 'SEMESTRE', 'SECCION', 'TURNO', 'ENFASIS', 'NOMBRE', 'APELLIDO',
    'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO',
    'AULA', 'DIA', 'FECHA', 'HORA'
];

// Alias para columnas (normalizados)
export const COLUMN_ALIASES = {
    asignatura: ['ASIGNATURA', 'MATERIA'],
    semestre: ['NIVEL', 'SEM/GRUPO', 'SEMESTRE', 'SEM.', 'SEMESTRES', 'SEMESTR', 'SEM', 'GRUPO'],
    seccion: ['SECCIÓN', 'SECCION', 'SEC.', 'SECCIONES', 'SECCIÓN.', 'SECC'],
    turno: ['TURNO'],
    enfasis: ['ENFASIS', 'ÉNFASIS', 'ENFASIS.', 'ÉNFASIS.'],
    nombre: ['NOMBRE', 'NOMBRES', 'NOMBRE.', 'NOMBRES.'],
    apellido: ['APELLIDO', 'APELLIDOS', 'APELLIDO.', 'APELLIDOS.'],
};

export let state = {
    workbook: null,         // Libro de Excel cargado
    rawData: [],            // Datos crudos procesados del Excel
    rawDataArray: [],       // Datos crudos en formato de array
    columnMap: {},          // Mapa de columnas detectado
    fullSchedule: [],       // Todas las clases de todas las carreras
    fullExamData: [],       // Todos los exámenes
    fullOccasionalClasses: [], // Todas las clases ocasionales
    clases: [],             // Clases filtradas por el usuario
    examenes: [],           // Exámenes filtrados
    occasionalClasses: [], // Clases ocasionales filtradas
    selectedSemestres: [],
    selectedAsignaturas: [],
    selectedInstances: [],
    config: {
        carrera: ''
    },
    updateInterval: null,   // Interval para actualizar contadores en tiempo real
    userTasks: []           // Tareas personales del usuario
};
