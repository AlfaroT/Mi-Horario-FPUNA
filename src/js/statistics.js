/**
 * statistics.js - Módulo de Estadísticas para Mi Horario FPUNA
 * Análisis y visualización de datos académicos
 */

import { state } from './state.js';
import { getDaysDifference } from './utils.js';
import { parseDate } from './calendar.js';
import { getPomodoroStats } from './pomodoro.js';

/**
 * Inicializa el módulo de estadísticas
 */
export function initStatistics() {
    console.log('[Statistics] Módulo inicializado');
}

/**
 * Muestra la pantalla de estadísticas
 */
export function showStatistics() {
    const dashboardScreen = document.getElementById('dashboardScreen');
    const statisticsScreen = document.getElementById('statisticsScreen');
    const bottomNavBar = document.getElementById('bottomNavBar');
    
    if (dashboardScreen && statisticsScreen) {
        dashboardScreen.classList.add('hidden');
        statisticsScreen.classList.remove('hidden');
        
        // Asegurar que la barra de navegación global esté visible
        if (bottomNavBar) bottomNavBar.classList.remove('hidden');
        
        // Renderizar estadísticas
        renderStatistics();
    }
}

/**
 * Oculta la pantalla de estadísticas
 */
export function hideStatistics() {
    const dashboardScreen = document.getElementById('dashboardScreen');
    const statisticsScreen = document.getElementById('statisticsScreen');
    
    if (dashboardScreen && statisticsScreen) {
        statisticsScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
    }
}

/**
 * Renderizar todas las estadísticas
 */
function renderStatistics() {
    renderAcademicStats();
    renderPomodoroStats();
    renderExamStats();
    renderTaskStats();
    renderProgressChart();
}

/**
 * Renderizar estadísticas académicas generales
 */
function renderAcademicStats() {
    const container = document.getElementById('academicStatsContainer');
    if (!container) return;

    const totalSubjects = state.clases ? [...new Set(state.clases.map(c => c.asignatura))].length : 0;
    const totalClasses = state.clases ? state.clases.length : 0;
    const totalExams = state.examenes ? state.examenes.length : 0;
    const totalTasks = state.userTasks ? state.userTasks.length : 0;

    container.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="stat-card bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">${totalSubjects}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Materias</div>
            </div>
            <div class="stat-card bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div class="text-3xl font-bold text-purple-600 dark:text-purple-400">${totalClasses}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Clases Semanales</div>
            </div>
            <div class="stat-card bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div class="text-3xl font-bold text-red-600 dark:text-red-400">${totalExams}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Exámenes</div>
            </div>
            <div class="stat-card bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div class="text-3xl font-bold text-green-600 dark:text-green-400">${totalTasks}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Tareas</div>
            </div>
        </div>
    `;
}

/**
 * Renderizar estadísticas de Pomodoro
 */
function renderPomodoroStats() {
    const container = document.getElementById('pomodoroStatsContainer');
    if (!container) return;

    const stats = getPomodoroStats();

    container.innerHTML = `
        <div class="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <i class="fas fa-clock text-orange-600 dark:text-orange-400"></i>
                Estadísticas de Pomodoro
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                    <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">${stats.total}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Total Sesiones</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">${stats.today}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Hoy</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">${stats.thisWeek}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Esta Semana</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">${stats.totalMinutes}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Min Totales</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">${stats.todayMinutes}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Min Hoy</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderizar estadísticas de exámenes
 */
function renderExamStats() {
    const container = document.getElementById('examStatsContainer');
    if (!container) return;

    const exams = state.examenes || [];
    const today = new Date();
    
    const upcomingExams = exams.filter(exam => {
        const examDate = parseDate(exam.fecha);
        return examDate && examDate >= today;
    }).length;

    const pastExams = exams.filter(exam => {
        const examDate = parseDate(exam.fecha);
        return examDate && examDate < today;
    }).length;

    // Próximo examen
    const nextExam = exams
        .map(exam => ({ ...exam, date: parseDate(exam.fecha) }))
        .filter(exam => exam.date && exam.date >= today)
        .sort((a, b) => a.date - b.date)[0];

    container.innerHTML = `
        <div class="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <i class="fas fa-file-alt text-red-600 dark:text-red-400"></i>
                Estadísticas de Exámenes
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                    <div class="text-2xl font-bold text-red-600 dark:text-red-400">${upcomingExams}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Próximos</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-gray-600 dark:text-gray-400">${pastExams}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Pasados</div>
                </div>
                <div class="col-span-2 md:col-span-1">
                    ${nextExam ? `
                        <div class="text-sm font-semibold text-red-600 dark:text-red-400">Próximo:</div>
                        <div class="text-xs text-gray-600 dark:text-gray-400">${nextExam.asignatura}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-500">En ${getDaysDifference(nextExam.fecha)} días</div>
                    ` : '<div class="text-sm text-gray-500">Sin exámenes próximos</div>'}
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderizar estadísticas de tareas
 */
function renderTaskStats() {
    const container = document.getElementById('taskStatsContainer');
    if (!container) return;

    const tasks = state.userTasks || [];
    const completedTasks = tasks.filter(t => t.completada).length;
    const pendingTasks = tasks.filter(t => !t.completada).length;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    // Tareas por vencer (próximos 7 días)
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const dueSoon = tasks.filter(task => {
        if (task.completada) return false;
        const taskDate = parseDate(task.fecha);
        return taskDate && taskDate >= today && taskDate <= nextWeek;
    }).length;

    container.innerHTML = `
        <div class="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <i class="fas fa-tasks text-green-600 dark:text-green-400"></i>
                Estadísticas de Tareas
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <div class="text-2xl font-bold text-green-600 dark:text-green-400">${completedTasks}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Completadas</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">${pendingTasks}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Pendientes</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">${dueSoon}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Por vencer</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${completionRate}%</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Tasa Compleción</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderizar gráfico de progreso
 */
function renderProgressChart() {
    const container = document.getElementById('progressChartContainer');
    if (!container) return;

    const subjects = state.clases ? [...new Set(state.clases.map(c => c.asignatura))] : [];
    
    // Contar exámenes por materia
    const examsBySubject = {};
    subjects.forEach(subject => {
        examsBySubject[subject] = {
            total: 0,
            upcoming: 0,
            past: 0
        };
    });

    const today = new Date();
    (state.examenes || []).forEach(exam => {
        if (examsBySubject[exam.asignatura]) {
            examsBySubject[exam.asignatura].total++;
            const examDate = parseDate(exam.fecha);
            if (examDate) {
                if (examDate >= today) {
                    examsBySubject[exam.asignatura].upcoming++;
                } else {
                    examsBySubject[exam.asignatura].past++;
                }
            }
        }
    });

    let chartHTML = `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <i class="fas fa-chart-bar text-blue-600 dark:text-blue-400"></i>
                Exámenes por Materia
            </h3>
            <div class="space-y-3">
    `;

    subjects.forEach(subject => {
        const data = examsBySubject[subject];
        const percentage = data.total > 0 ? (data.past / data.total) * 100 : 0;

        chartHTML += `
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span class="font-medium text-gray-700 dark:text-gray-300">${subject}</span>
                    <span class="text-gray-500 dark:text-gray-400">${data.past}/${data.total}</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div class="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300" 
                         style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });

    chartHTML += `
            </div>
        </div>
    `;

    container.innerHTML = chartHTML;
}

/**
 * Exportar estadísticas
 */
export function exportStatistics() {
    const stats = {
        generatedAt: new Date().toISOString(),
        academic: {
            totalSubjects: state.clases ? [...new Set(state.clases.map(c => c.asignatura))].length : 0,
            totalClasses: state.clases ? state.clases.length : 0,
            totalExams: state.examenes ? state.examenes.length : 0,
            totalTasks: state.userTasks ? state.userTasks.length : 0
        },
        pomodoro: getPomodoroStats(),
        exams: state.examenes || [],
        tasks: state.userTasks || []
    };

    const dataStr = JSON.stringify(stats, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `estadisticas-fpuna-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}
