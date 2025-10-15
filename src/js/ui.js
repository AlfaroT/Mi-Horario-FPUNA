import { dom } from './dom.js';
import { state, THEME_KEY, STORAGE_KEY } from './state.js';
import { 
    getCurrentDayName, 
    getCurrentTimeInMinutes, 
    parseTimeRange, 
    getTimeInMinutes, 
    formatTimeDifference, 
    formatDate, 
    getDaysDifference, 
    getDaysText, 
    formatTime, 
    formatCurrentDate,
    showToast
} from './utils.js';
import { 
    populateSemestres, 
    applyFilters 
} from './filters.js';

// ============================================
// NAVEGACIÓN
// ============================================

export function showSetup(goDirectlyToFilters = false) {
    dom.setupScreen.classList.remove('hidden');
    dom.dashboardScreen.classList.add('hidden');
    dom.welcomeScreen.classList.add('hidden');
    
    if (goDirectlyToFilters && state.fullSchedule.length > 0) {
        // Mostrar solo los pasos relevantes para modificar filtros
        dom.step1.classList.add('hidden');
        dom.step2.classList.add('hidden');
        dom.step3.classList.remove('hidden');
        
        // Recrear los filtros
        populateSemestres();
        
        // Restaurar selecciones previas si existen
        if (state.selectedSemestres.length > 0) {
            setTimeout(() => {
                state.selectedSemestres.forEach(sem => {
                    const checkbox = document.getElementById(`sem_${sem}`);
                    if (checkbox) checkbox.checked = true;
                });
                onSemestreChange();
                
                // Restaurar asignaturas
                if (state.selectedAsignaturas.length > 0) {
                    setTimeout(() => {
                        state.selectedAsignaturas.forEach(asig => {
                            const safeId = asig.replace(/\s/g, '_').replace(/[^\w-]/g, '');
                            const checkbox = document.getElementById(`asig_${safeId}`);
                            if (checkbox) checkbox.checked = true;
                        });
                        onAsignaturaChange();
                        
                        // Restaurar instancias
                        if (state.selectedInstances.length > 0) {
                            setTimeout(() => {
                                state.selectedInstances.forEach(instId => {
                                    const checkbox = document.getElementById(`inst_${instId}`);
                                    if (checkbox) checkbox.checked = true;
                                });
                                onInstanceChange();
                            }, 100);
                        }
                    }, 100);
                }
            }, 100);
        }
    }
}

export function showDashboard() {
    dom.setupScreen.classList.add('hidden');
    dom.dashboardScreen.classList.remove('hidden');
    dom.welcomeScreen.classList.add('hidden');
    updateGreeting();
    renderDashboard();
}

export function showWelcomeScreen() {
    dom.welcomeScreen.classList.remove('hidden');
    dom.setupScreen.classList.add('hidden');
    dom.dashboardScreen.classList.add('hidden');
}

// Función para actualizar el saludo dinámico
function updateGreeting() {
    if (!dom.greetingHeader) return;

    const now = new Date();
    const hour = now.getHours();
    const userName = localStorage.getItem('userName') || 'Usuario';

    let greeting = '';
    let greetingClass = '';

    if (hour >= 6 && hour < 12) {
        greeting = 'Buenos Días';
        greetingClass = 'greeting-morning';
    } else if (hour >= 12 && hour < 18) {
        greeting = 'Buenas Tardes';
        greetingClass = 'greeting-afternoon';
    } else if (hour >= 18 && hour < 22) {
        greeting = 'Buenas Noches';
        greetingClass = 'greeting-evening';
    } else {
        greeting = 'Buenas Noches';
        greetingClass = 'greeting-night';
    }

    // Limpiar clases anteriores
    dom.greetingHeader.className = 'text-2xl font-bold';

    // Aplicar nueva clase de saludo
    dom.greetingHeader.classList.add(greetingClass);

    // Crear el texto completo
    const fullText = `${greeting}, ${userName}`;
    
    // Limpiar contenido
    dom.greetingHeader.innerHTML = '';
    
    // Efecto de escritura de máquina de escribir
    let charIndex = 0;
    const typingSpeed = 60; // ms por carácter (ni muy rápido ni muy lento)
    
    function typeWriter() {
        if (charIndex < fullText.length) {
            dom.greetingHeader.textContent += fullText.charAt(charIndex);
            charIndex++;
            setTimeout(typeWriter, typingSpeed);
        }
    }
    
    typeWriter();

    // Agregar efecto de brillo después de la animación inicial
    setTimeout(() => {
        dom.greetingHeader.classList.add('animate-greeting-glow');
    }, 1500);
}

// ============================================
// RENDERIZADO DEL DASHBOARD
// ============================================

function createEventCard(event) {
    const { tipo, titulo, subtitulo, fecha, hora, aula, profesor, contador, borderColor, badgeText, badgeColor, index = 0 } = event;
    
    return `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 ${borderColor} animate-fade-in hover:shadow-lg transition-shadow" style="animation-delay: ${index * 0.1}s">
            <!-- CABECERA -->
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <h3 class="font-bold text-lg text-gray-800 dark:text-white">${titulo}</h3>
                    ${subtitulo ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${subtitulo}</p>` : ''}
                </div>
                <span class="ml-3 ${badgeColor} rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap">
                    ${badgeText}
                </span>
            </div>
            
            <!-- CUERPO: GRID 2x2 CON ICONOS -->
            <div class="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
                ${fecha ? `
                <div class="flex items-center text-gray-600 dark:text-gray-400">
                    <i class="fa-solid fa-calendar-day fa-fw mr-2 text-gray-400"></i>
                    <span>${fecha}</span>
                </div>
                ` : ''}
                
                ${aula ? `
                <div class="flex items-center text-gray-600 dark:text-gray-400">
                    <i class="fa-solid fa-school fa-fw mr-2 text-gray-400"></i>
                    <span>${aula}</span>
                </div>
                ` : ''}
                
                ${hora ? `
                <div class="flex items-center text-gray-600 dark:text-gray-400">
                    <i class="fa-solid fa-clock fa-fw mr-2 text-gray-400"></i>
                    <span>${hora}</span>
                </div>
                ` : ''}
                
                ${profesor ? `
                <div class="flex items-center text-gray-600 dark:text-gray-400">
                    <i class="fa-solid fa-chalkboard-user fa-fw mr-2 text-gray-400"></i>
                    <span>${profesor}</span>
                </div>
                ` : ''}
            </div>
            
            <!-- PIE: CONTADOR -->
            ${contador ? `
            <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center ${contador.colorClass}">
                    <i class="${contador.icon} fa-fw mr-2"></i>
                    <span class="font-semibold ${contador.animate ? 'animate-pulse' : ''}">${contador.text}</span>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

function renderTodayClasses() {
    const currentDay = getCurrentDayName();
    const currentTime = getCurrentTimeInMinutes();
    
    const todayClasses = state.clases
        .filter(clase => clase.dia === currentDay)
        .sort((a, b) => {
            const horaA = a.hora.split('-')[0].trim();
            const horaB = b.hora.split('-')[0].trim();
            return horaA.localeCompare(horaB);
        });    if (todayClasses.length === 0) {
        dom.todayClasses.innerHTML = `
            <div class="card text-center py-8 animate-fade-in">
                <i class="fas fa-coffee text-4xl text-gray-400 mb-2"></i>
                <p class="text-gray-600 dark:text-gray-400">No tienes clases hoy. ¡Disfruta tu día libre!</p>
            </div>
        `;
        return;
    }
    
    dom.todayClasses.innerHTML = todayClasses.map((clase, index) => {
        const timeRange = parseTimeRange(clase.hora);
        let contador = null;
        let borderColor = 'border-blue-500';
        
        if (timeRange) {
            const startTime = getTimeInMinutes(timeRange.start);
            const endTime = getTimeInMinutes(timeRange.end);
            
            if (currentTime < startTime) {
                // Clase futura
                const diff = startTime - currentTime;
                const formatted = formatTimeDifference(diff);
                contador = {
                    text: `Empieza en ${formatted}`,
                    icon: 'fa-solid fa-hourglass-start',
                    colorClass: 'text-green-600 dark:text-green-400',
                    animate: false
                };
                borderColor = 'border-green-500';
            } else if (currentTime >= startTime && currentTime <= endTime) {
                // Clase en curso
                const diff = endTime - currentTime;
                const formatted = formatTimeDifference(diff);
                contador = {
                    text: `En curso, termina en ${formatted}`,
                    icon: 'fa-solid fa-hourglass-half',
                    colorClass: 'text-orange-600 dark:text-orange-400',
                    animate: true
                };
                borderColor = 'border-orange-500';
            } else {
                // Clase finalizada
                contador = {
                    text: 'Finalizada',
                    icon: 'fa-solid fa-check',
                    colorClass: 'text-gray-500 dark:text-gray-500',
                    animate: false
                };
                borderColor = 'border-gray-400';
            }
        }
        
        return createEventCard({
            tipo: 'clase',
            titulo: clase.asignatura,
            subtitulo: `${clase.seccion} - ${clase.turno}`,
            fecha: `Hoy, ${currentDay}`,
            hora: clase.hora,
            aula: clase.aula || 'Por confirmar',
            profesor: clase.profesor,
            contador: contador,
            borderColor: borderColor,
            badgeText: 'Clase de Hoy',
            badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            index: index
        });
    }).join('');
}

function renderUpcomingExams() {
    const now = new Date();
    
    const upcomingExams = state.examenes
        .map(examen => {
            const fecha = formatDate(examen.fecha);
            return {
                ...examen,
                fechaObj: fecha,
                daysLeft: fecha ? getDaysDifference(fecha) : null
            };
        })
        .filter(examen => examen.fechaObj && examen.daysLeft !== null && examen.daysLeft >= -1)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 10);
    
    if (upcomingExams.length === 0) {
        dom.upcomingExams.innerHTML = `
            <div class="card text-center py-8">
                <i class="fas fa-check-circle text-4xl text-green-400 mb-2"></i>
                <p class="text-gray-600 dark:text-gray-400">No hay exámenes próximos registrados.</p>
            </div>
        `;
        return;
    }
    
    dom.upcomingExams.innerHTML = upcomingExams.map((examen, index) => {
        const isParcial = examen.tipo.toLowerCase().includes('parcial');
        const isFinal = examen.tipo.toLowerCase().includes('final');
        const isRevision = examen.tipo.toLowerCase().includes('revision') || examen.tipo.toLowerCase().includes('revisión');
        
        const borderColor = isParcial ? 'border-red-600' :
                           isFinal ? 'border-purple-600' :
                           'border-yellow-600';
        
        const badgeColor = isParcial ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          isFinal ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        
        const daysText = getDaysText(examen.daysLeft);
        const isToday = examen.daysLeft === 0;
        const isTomorrow = examen.daysLeft === 1;
        const horaFormateada = formatTime(examen.hora);
        
        const contador = {
            text: daysText,
            icon: isToday ? 'fa-solid fa-exclamation-triangle' : 
                  isTomorrow ? 'fa-solid fa-bell' : 
                  'fa-solid fa-calendar-check',
            colorClass: isToday ? 'text-red-600 dark:text-red-400' :
                       isTomorrow ? 'text-orange-600 dark:text-orange-400' :
                       'text-blue-600 dark:text-blue-400',
            animate: isToday
        };
        
        return createEventCard({
            tipo: 'examen',
            titulo: examen.asignatura,
            subtitulo: `${examen.seccion || ''} ${examen.turno || ''}`.trim(),
            fecha: examen.fecha,
            hora: horaFormateada,
            aula: examen.aula || 'Por confirmar',
            profesor: null,
            contador: contador,
            borderColor: borderColor,
            badgeText: examen.tipo,
            badgeColor: badgeColor,
            index: index
        });
    }).join('');
}

function renderOccasionalClasses() {
    const upcomingClasses = state.occasionalClasses
        .map(clase => {
            const fecha = formatDate(clase.fecha);
            return {
                ...clase,
                fechaObj: fecha,
                daysLeft: fecha ? getDaysDifference(fecha) : null
            };
        })
        .filter(clase => clase.fechaObj && clase.daysLeft !== null && clase.daysLeft >= -1)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 10);
    
    if (upcomingClasses.length === 0) {
        dom.occasionalClasses.innerHTML = `
            <div class="card text-center py-8 animate-fade-in">
                <i class="fas fa-calendar-day text-4xl text-gray-400 mb-2"></i>
                <p class="text-gray-600 dark:text-gray-400">No hay clases ocasionales próximas.</p>
            </div>
        `;
        return;
    }
    
    dom.occasionalClasses.innerHTML = upcomingClasses.map((clase, index) => {
        const daysText = getDaysText(clase.daysLeft);
        const isToday = clase.daysLeft === 0;
        const isTomorrow = clase.daysLeft === 1;
        const horaFormateada = formatTime(clase.horaInicio);
        
        const contador = {
            text: daysText,
            icon: isToday ? 'fa-solid fa-star' : 'fa-solid fa-calendar-day',
            colorClass: isToday ? 'text-green-600 dark:text-green-400' :
                       isTomorrow ? 'text-orange-600 dark:text-orange-400' :
                       'text-blue-600 dark:text-blue-400',
            animate: isToday
        };
        
        return createEventCard({
            tipo: 'ocasional',
            titulo: clase.asignatura,
            subtitulo: `Clase Ocasional - Sábado`,
            fecha: clase.fecha,
            hora: clase.hora || horaFormateada,
            aula: clase.aula || 'Por confirmar',
            profesor: clase.profesor,
            contador: contador,
borderColor: 'border-indigo-600',
            badgeText: 'Clase Ocasional',
            badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
            index: index
        });
    }).join('');
}

export function renderUserTasks() {
    const container = document.getElementById('userTasksContainer');
    const historyContainer = document.getElementById('taskHistoryContainer');
    if (!container) return;
    
    // TAREA #3 v1.1: Separar tareas activas de completadas
    const activeTasks = state.userTasks.filter(t => !t.completada);
    const completedTasks = state.userTasks.filter(t => t.completada);
    
    // Ordenar tareas activas por fecha
    const sortedActiveTasks = [...activeTasks].sort((a, b) => {
        return new Date(a.fecha) - new Date(b.fecha);
    });
    
    // Ordenar tareas completadas por fecha de completado (más reciente primero)
    const sortedCompletedTasks = [...completedTasks].sort((a, b) => {
        return new Date(b.fechaCompletado || b.fecha) - new Date(a.fechaCompletado || a.fecha);
    });
    
    // Renderizar tareas activas
    if (sortedActiveTasks.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-clipboard-list text-4xl mb-3 opacity-50"></i>
                <p>No tienes tareas pendientes</p>
                <p class="text-sm mt-2">Haz clic en el botón + para crear una</p>
            </div>
        `;
    } else {
        container.innerHTML = sortedActiveTasks.map((task, index) => 
            renderTaskCard(task, index, false)
        ).join('');
    }
    
    // Renderizar historial de tareas completadas
    if (historyContainer) {
        if (sortedCompletedTasks.length === 0) {
            historyContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-check-circle text-4xl mb-3 opacity-50"></i>
                    <p>No hay tareas completadas en el historial</p>
                </div>
            `;
        } else {
            historyContainer.innerHTML = sortedCompletedTasks.map((task, index) => 
                renderTaskCard(task, index, true)
            ).join('');
        }
    }
}

function renderTaskCard(task, index, isHistory = false) {
    const daysDiff = getDaysDifference(task.fecha);
    const daysText = getDaysText(daysDiff);
    
    const isOverdue = daysDiff < 0 && !task.completada;
    const isToday = daysDiff === 0;
    
    const borderColor = task.completada ? 'border-l-4 border-green-500' : 
                       isOverdue ? 'border-l-4 border-red-500' :
                       isToday ? 'border-l-4 border-orange-500' : 'border-l-4 border-blue-500';
    
    return `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-3 ${borderColor} animate-fade-in ${task.completada ? 'opacity-75' : ''}" 
             style="animation-delay: ${index * 0.05}s" data-task-id="${task.id}">
            <div class="flex items-start gap-3">
                <button data-action="toggle-complete" data-task-id="${task.id}"
                        class="mt-1 w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all
                               ${task.completada ? 'bg-green-500 border-green-500' : 'border-gray-400 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900'}">
                    ${task.completada ? '<i class="fas fa-check text-white text-xs"></i>' : ''}
                </button>
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-lg ${task.completada ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white'}">
                        ${task.titulo}
                    </h3>
                    ${task.descripcion ? `
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${task.descripcion}</p>
                    ` : ''}
                    <div class="flex flex-wrap items-center gap-4 mt-3 text-sm">
                        <span class="flex items-center gap-1 ${isOverdue && !task.completada ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}">
                            <i class="far fa-calendar fa-fw"></i>
                            ${daysText}
                        </span>
                        ${task.hora ? `
                            <span class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                <i class="far fa-clock fa-fw"></i>
                                ${task.hora}
                            </span>
                        ` : ''}
                        ${task.completada && task.fechaCompletado ? `
                            <span class="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                                <i class="fas fa-check-circle fa-fw"></i>
                                Completada ${formatFechaCompletado(task.fechaCompletado)}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="flex gap-2 flex-shrink-0">
                    ${!task.completada ? `
                        <button data-action="edit-task" data-task-id="${task.id}"
                                class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                                title="Editar tarea">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : ''}
                    <button data-action="delete-task" data-task-id="${task.id}"
                            class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                            title="Eliminar tarea">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function formatFechaCompletado(fechaISO) {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 7) return `hace ${diffDays}d`;
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

export function renderDashboard() {
    dom.currentDate.textContent = formatCurrentDate();

    // Renderizar con todos los datos
    renderTodayClasses();
    renderUpcomingExams();
    renderOccasionalClasses();
    renderUserTasks();

    // Actualizar métricas del dashboard
    updateDashboardMetrics();

    // Iniciar actualización automática cada minuto
    if (state.updateInterval) {
        clearInterval(state.updateInterval);
    }
    state.updateInterval = setInterval(() => {
        renderTodayClasses();
        updateDashboardMetrics();
    }, 60000); // Actualizar cada minuto
}

// Función para actualizar las métricas del dashboard
function updateDashboardMetrics() {
    console.log('🔄 Actualizando métricas del dashboard...');
    console.log('📊 Estado actual:', {
        clases: state.clases?.length || 0,
        examenes: state.examenes?.length || 0,
        occasionalClasses: state.occasionalClasses?.length || 0,
        userTasks: state.userTasks?.length || 0
    });

    // Contar clases de hoy
    const today = getCurrentDayName().toLowerCase();
    console.log('📅 Día actual:', today, '(normalizado)');
    const todayClasses = getTodayClasses();
    console.log('📚 Clases de hoy encontradas:', todayClasses.length);
    console.log('📚 Detalle de clases:', todayClasses.map(c => `${c.dia} - ${c.asignatura}`));
    const todayCount = document.getElementById('todayCount');
    const todayBadge = document.getElementById('todayBadge');
    const todaySummary = document.getElementById('todaySummary');

    if (todayCount) {
        todayCount.textContent = todayClasses.length;
        console.log('✅ todayCount actualizado:', todayClasses.length);
    }
    if (todayBadge) todayBadge.textContent = todayClasses.length;
    if (todaySummary) {
        todaySummary.textContent = todayClasses.length > 0
            ? `${todayClasses.length} clase${todayClasses.length !== 1 ? 's' : ''} programada${todayClasses.length !== 1 ? 's' : ''}`
            : 'Sin clases programadas';
    }

    // Contar exámenes próximos
    const upcomingExams = getUpcomingExams();
    console.log('📝 Exámenes próximos encontrados:', upcomingExams.length);
    console.log('📝 Detalle de exámenes:', upcomingExams.map(e => `${e.asignatura} - ${e.fecha}`));
    const examsCount = document.getElementById('examsCount');
    const examsBadge = document.getElementById('examsBadge');
    const examsSummary = document.getElementById('examsSummary');

    if (examsCount) {
        examsCount.textContent = upcomingExams.length;
        console.log('✅ examsCount actualizado:', upcomingExams.length);
    }
    if (examsBadge) examsBadge.textContent = upcomingExams.length;
    if (examsSummary) {
        examsSummary.textContent = upcomingExams.length > 0
            ? `${upcomingExams.length} examen${upcomingExams.length !== 1 ? 'es' : ''} próxim${upcomingExams.length !== 1 ? 'os' : 'o'}`
            : 'Sin exámenes próximos';
    }

    // Contar tareas pendientes
    const pendingTasks = state.userTasks.filter(task => {
        const isCompleted = task.completada === true || task.completed === true;
        console.log(`📋 Tarea ${task.id}: completada=${task.completada}, completed=${task.completed}, isCompleted=${isCompleted}`);
        return !isCompleted;
    });
    console.log('✅ Tareas pendientes encontradas:', pendingTasks.length, 'de', state.userTasks.length, 'total');
    const tasksCount = document.getElementById('tasksCount');
    const tasksBadge = document.getElementById('tasksBadge');
    const tasksSummary = document.getElementById('tasksSummary');

    if (tasksCount) {
        tasksCount.textContent = pendingTasks.length;
        console.log('✅ tasksCount actualizado:', pendingTasks.length);
    }
    if (tasksBadge) tasksBadge.textContent = pendingTasks.length;
    if (tasksSummary) {
        tasksSummary.textContent = pendingTasks.length > 0
            ? `${pendingTasks.length} tarea${pendingTasks.length !== 1 ? 's' : ''} pendiente${pendingTasks.length !== 1 ? 's' : ''}`
            : 'Sin tareas pendientes';
    }

    // Contar clases ocasionales
    const occasionalClasses = getUpcomingOccasionalClasses();
    console.log('🎓 Clases ocasionales encontradas:', occasionalClasses.length);
    console.log('🎓 Detalle de clases:', occasionalClasses.map(c => `${c.asignatura} - ${c.fecha}`));
    const occasionalCount = document.getElementById('occasionalCount');
    const occasionalBadge = document.getElementById('occasionalBadge');
    const occasionalSummary = document.getElementById('occasionalSummary');

    if (occasionalCount) {
        occasionalCount.textContent = occasionalClasses.length;
        console.log('✅ occasionalCount actualizado:', occasionalClasses.length);
    }
    if (occasionalBadge) occasionalBadge.textContent = occasionalClasses.length;
    if (occasionalSummary) {
        occasionalSummary.textContent = occasionalClasses.length > 0
            ? `${occasionalClasses.length} clase${occasionalClasses.length !== 1 ? 's' : ''} ocasional${occasionalClasses.length !== 1 ? 'es' : ''}`
            : 'Sin clases ocasionales';
    }

    console.log('🎯 Métricas del dashboard actualizadas completamente');
}

// Funciones auxiliares para obtener datos
function getTodayClasses() {
    if (!state.clases || state.clases.length === 0) return [];

    const today = getCurrentDayName().toLowerCase();
    return state.clases.filter(clase => {
        const dayName = clase.dia?.toLowerCase();
        return dayName === today;
    });
}

function getUpcomingExams() {
    if (!state.examenes || state.examenes.length === 0) {
        console.log('⚠️ No hay exámenes en el estado');
        return [];
    }

    console.log(`📊 Total de exámenes en estado: ${state.examenes.length}`);

    // Usar el mismo método que en renderUpcomingExams
    const upcomingExams = state.examenes
        .map(examen => {
            const fecha = formatDate(examen.fecha);
            return {
                ...examen,
                fechaObj: fecha,
                daysLeft: fecha ? getDaysDifference(fecha) : null
            };
        })
        .filter(examen => {
            const isValid = examen.fechaObj && examen.daysLeft !== null && examen.daysLeft >= -1;
            if (!isValid) {
                console.log(`❌ Examen filtrado: ${examen.asignatura} - fecha: ${examen.fecha}`);
            }
            return isValid;
        })
        .sort((a, b) => a.daysLeft - b.daysLeft);

    console.log(`✅ Exámenes próximos válidos: ${upcomingExams.length}`);
    return upcomingExams;
}

function getUpcomingOccasionalClasses() {
    if (!state.occasionalClasses || state.occasionalClasses.length === 0) {
        console.log('⚠️ No hay clases ocasionales en el estado');
        return [];
    }

    console.log(`📊 Total de clases ocasionales en estado: ${state.occasionalClasses.length}`);
    state.occasionalClasses.forEach(clase => {
        console.log(`  - ${clase.asignatura}: fecha="${clase.fecha}"`);
    });

    // Usar el mismo método que en renderOccasionalClasses
    const upcomingClasses = state.occasionalClasses
        .map(clase => {
            const fecha = formatDate(clase.fecha);
            return {
                ...clase,
                fechaObj: fecha,
                daysLeft: fecha ? getDaysDifference(fecha) : null
            };
        })
        .filter(clase => {
            const isValid = clase.fechaObj && clase.daysLeft !== null && clase.daysLeft >= -1;
            if (!isValid) {
                console.log(`❌ Clase filtrada: ${clase.asignatura} - fecha: ${clase.fecha}`);
            }
            return isValid;
        })
        .sort((a, b) => a.daysLeft - b.daysLeft);

    console.log(`✅ Clases ocasionales próximas válidas: ${upcomingClasses.length}`);
    return upcomingClasses;
}

// ============================================
// SISTEMA DE TEMAS (MODO OSCURO/CLARO)
// ============================================

export function initTheme() {
    // Verificar si hay preferencia guardada
    let savedTheme = localStorage.getItem(THEME_KEY);

    if (!savedTheme) {
        // Si no hay preferencia guardada, usar la del sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        savedTheme = prefersDark ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, savedTheme);
    }

    // Aplicar tema
    applyTheme(savedTheme);
    
    console.log('✅ Event listener del modo oscuro conectado');
}

function applyTheme(theme, updateCheckbox = true) {
    const html = document.documentElement;
    
    if (theme === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    
    // Actualizar el toggle SOLO en la inicialización, NO cuando el usuario hace click
    if (updateCheckbox) {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.checked = (theme === 'dark');
        }
    }
    
    // Actualizar meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#1f2937' : '#2563eb');
    }
    
    console.log(`🎨 Tema aplicado: ${theme}`);
}

export function toggleTheme() {
    console.log('🎯 toggleTheme() LLAMADO');
    console.trace('🔍 Stack trace de toggleTheme:');
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    console.log(`   Estado actual: ${isDark ? 'DARK' : 'LIGHT'}`);
    const newTheme = isDark ? 'light' : 'dark';
    console.log(`   Nuevo tema: ${newTheme}`);

    // NO actualizar el checkbox porque ya cambió por el click del usuario
    applyTheme(newTheme, false);
    localStorage.setItem(THEME_KEY, newTheme);

    console.log(`🔄 Tema cambiado a: ${newTheme}`);
    showToast(`Tema ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 'success');
}

// ============================================
// GESTIÓN DE ALMACENAMIENTO
// ============================================

export function saveToLocalStorage() {
    const data = {
        config: state.config,
        selectedSemestres: state.selectedSemestres,
        selectedAsignaturas: state.selectedAsignaturas,
        selectedInstances: state.selectedInstances,
        clases: state.clases,
        examenes: state.examenes,
        occasionalClasses: state.occasionalClasses,
        fullSchedule: state.fullSchedule,
        fullExamData: state.fullExamData,
        fullOccasionalClasses: state.fullOccasionalClasses,
        rawData: state.rawData,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadFromLocalStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        try {
            const parsed = JSON.parse(data);
            state.config = parsed.config;
            state.selectedSemestres = parsed.selectedSemestres || [];
            state.selectedAsignaturas = parsed.selectedAsignaturas || [];
            state.selectedInstances = parsed.selectedInstances || [];
            state.clases = parsed.clases;
            state.examenes = parsed.examenes;
            state.occasionalClasses = parsed.occasionalClasses || [];
            state.fullSchedule = parsed.fullSchedule || [];
            state.fullExamData = parsed.fullExamData || [];
            state.fullOccasionalClasses = parsed.fullOccasionalClasses || [];
            state.rawData = parsed.rawData || [];
            return true;
        } catch (e) {
            console.error('Error cargando datos del localStorage:', e);
            return false;
        }
    }
    return false;
}

export function exportToJSON() {
    const data = {
        config: state.config,
        selectedSemestres: state.selectedSemestres,
        selectedAsignaturas: state.selectedAsignaturas,
        selectedInstances: state.selectedInstances,
        clases: state.clases,
        examenes: state.examenes,
        occasionalClasses: state.occasionalClasses,
        fullSchedule: state.fullSchedule,
        fullExamData: state.fullExamData,
        fullOccasionalClasses: state.fullOccasionalClasses,
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mi_horario_fpuna.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Horario exportado correctamente', 'success');
}

export function importFromJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            state.config = data.config;
            state.selectedSemestres = data.selectedSemestres || [];
            state.selectedAsignaturas = data.selectedAsignaturas || [];
            state.selectedInstances = data.selectedInstances || [];
            state.clases = data.clases;
            state.examenes = data.examenes;
            state.occasionalClasses = data.occasionalClasses || [];
            state.fullSchedule = data.fullSchedule || [];
            state.fullExamData = data.fullExamData || [];
            state.fullOccasionalClasses = data.fullOccasionalClasses || [];
            saveToLocalStorage();
            showDashboard();
            showToast('Datos importados correctamente', 'success');
        } catch (error) {
            showToast('Error al importar el archivo JSON', 'error');
            console.error('Error:', error);
        }
    };
    reader.readAsText(file);
}

export function handleReset() {
    dom.confirmModal.classList.remove('hidden');
    dom.confirmModal.classList.add('flex');
}

export function confirmReset() {
    localStorage.removeItem(STORAGE_KEY);
    showToast('Aplicación reiniciada correctamente', 'success');
    setTimeout(() => {
        location.reload();
    }, 1000);
}

// ============================================
// NAVEGACIÓN INFERIOR
// ============================================
// NAVEGACIÓN POR TARJETAS MÉTRICAS
// ============================================

// Función para hacer scroll suave a una sección
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Inicializar clicks en tarjetas métricas
export function initMetricCards() {
    const metricCards = document.querySelectorAll('.metric-card');

    metricCards.forEach(card => {
        card.addEventListener('click', () => {
            const target = card.dataset.target;

            // Mapear targets a IDs de sección y botones de toggle
            const sectionMap = {
                'todayClasses': { id: 'todayClasses', toggleBtn: 'toggleTodayClassesBtn' },
                'exams': { id: 'exams', toggleBtn: 'toggleExamsBtn' },
                'tasks': { id: 'tasks', toggleBtn: 'toggleTasksBtn' },
                'occasional': { id: 'occasional', toggleBtn: 'toggleOccasionalBtn' }
            };

            const section = sectionMap[target];
            if (section) {
                // Hacer scroll a la sección
                scrollToSection(section.id);

                // Expandir la sección si no está expandida
                const toggleBtn = document.getElementById(section.toggleBtn);
                if (toggleBtn) {
                    const container = toggleBtn.nextElementSibling;
                    if (container && container.classList.contains('hidden')) {
                        toggleBtn.click();
                    }
                }

                showToast(`📍 ${getSectionName(target)}`, 'success');
            }
        });
    });
}

// Función auxiliar para nombres de secciones
function getSectionName(target) {
    const names = {
        'todayClasses': 'Clases de Hoy',
        'exams': 'Exámenes',
        'tasks': 'Tareas',
        'occasional': 'Clases Ocasionales'
    };
    return names[target] || target;
}
