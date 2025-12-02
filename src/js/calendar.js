/**
 * calendar.js - Módulo de Calendario para Mi Horario FPUNA
 * Muestra todos los eventos: exámenes, clases, tareas y clases ocasionales
 */

import { state, DIAS_SEMANA } from './state.js';

// Estado del calendario
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

/**
 * Inicializa el módulo de calendario
 */
export function initCalendar() {
    setupCalendarNavigation();
    console.log('[Calendar] Módulo inicializado');
}

/**
 * Muestra la pantalla del calendario
 */
export function showCalendar() {
    const dashboardScreen = document.getElementById('dashboardScreen');
    const calendarScreen = document.getElementById('calendarScreen');
    
    if (dashboardScreen && calendarScreen) {
        dashboardScreen.classList.add('hidden');
        calendarScreen.classList.remove('hidden');
        
        // Actualizar título del mes
        updateMonthTitle();
        
        // Renderizar calendario
        renderCalendar();
    }
}

/**
 * Oculta la pantalla del calendario
 */
export function hideCalendar() {
    const dashboardScreen = document.getElementById('dashboardScreen');
    const calendarScreen = document.getElementById('calendarScreen');
    
    if (dashboardScreen && calendarScreen) {
        calendarScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
    }
}

/**
 * Configura la navegación del calendario (mes anterior/siguiente)
 */
function setupCalendarNavigation() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const todayBtn = document.getElementById('calendarToday');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            updateMonthTitle();
            renderCalendar();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            updateMonthTitle();
            renderCalendar();
        });
    }
    
    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            const today = new Date();
            currentMonth = today.getMonth();
            currentYear = today.getFullYear();
            updateMonthTitle();
            renderCalendar();
        });
    }
}

/**
 * Actualiza el título del mes en el header
 */
function updateMonthTitle() {
    const monthTitle = document.getElementById('currentMonth');
    if (monthTitle) {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        monthTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
}

/**
 * Extrae la hora de un string como "07:30 - 11:30"
 * @param {string} horaStr - String con formato de hora
 * @returns {string} - Hora formateada o vacía si no se puede extraer
 */
function extractTime(horaStr) {
    if (!horaStr || typeof horaStr !== 'string') return '';
    
    // Limpiar el string
    const cleaned = horaStr.trim();
    
    // Buscar patrón de hora HH:MM
    const timeMatch = cleaned.match(/(\d{1,2}:\d{2})/);
    if (timeMatch) {
        return timeMatch[1];
    }
    
    // Si tiene formato completo "07:30 - 11:30", devolver la primera hora
    const rangeMatch = cleaned.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (rangeMatch) {
        return rangeMatch[1];
    }
    
    return '';
}

/**
 * Convierte hora de formato Excel (decimal) o string a formato legible
 * @param {number|string} hora - Hora en formato Excel (0.8125) o string
 * @returns {string} - Hora formateada (HH:MM)
 */
function formatExcelTime(hora) {
    if (!hora && hora !== 0) return '';
    
    // Si es un número (formato decimal de Excel: 0.8125 = 19:30)
    if (typeof hora === 'number') {
        const totalMinutes = Math.round(hora * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Si es string, verificar si parece un número decimal
    const numValue = parseFloat(hora);
    if (!isNaN(numValue) && numValue > 0 && numValue < 1) {
        const totalMinutes = Math.round(numValue * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Si ya es formato de hora string (HH:MM o HH:MM:SS)
    if (typeof hora === 'string' && hora.includes(':')) {
        const parts = hora.split(':');
        if (parts.length >= 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
    }
    
    return hora.toString();
}

/**
 * Parsea una fecha de varios formatos posibles
 * @param {string|Date} dateInput - Fecha en varios formatos
 * @returns {Date|null} - Objeto Date o null si no se puede parsear
 */
function parseDate(dateInput) {
    if (!dateInput) return null;
    
    // Si ya es Date
    if (dateInput instanceof Date) {
        return isNaN(dateInput.getTime()) ? null : dateInput;
    }
    
    if (typeof dateInput !== 'string') return null;
    
    const dateStr = dateInput.trim();
    
    // Formato: "Sáb 14/12/24" o "Lun 02/09/25"
    const matchWithDay = dateStr.match(/^[A-Za-záéíóúÁÉÍÓÚ]+\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (matchWithDay) {
        let [, day, month, year] = matchWithDay;
        year = year.length === 2 ? '20' + year : year;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Formato: "14/12/24" o "02/09/2025"
    const matchSimple = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (matchSimple) {
        let [, day, month, year] = matchSimple;
        year = year.length === 2 ? '20' + year : year;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Formato ISO: "2025-09-02"
    const matchISO = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (matchISO) {
        const [, year, month, day] = matchISO;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Intentar parseo directo
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Obtiene el día de la semana (0-6, Lun-Dom) de un string de día
 * @param {string} diaStr - String del día
 * @returns {number} - Índice del día (0=Lun, 6=Dom)
 */
function getDayIndex(diaStr) {
    if (!diaStr || typeof diaStr !== 'string') return -1;
    
    const dia = diaStr.toLowerCase().trim();
    const dias = {
        'lun': 0, 'lunes': 0,
        'mar': 1, 'martes': 1,
        'mié': 2, 'mie': 2, 'miércoles': 2, 'miercoles': 2,
        'jue': 3, 'jueves': 3,
        'vie': 4, 'viernes': 4,
        'sáb': 5, 'sab': 5, 'sábado': 5, 'sabado': 5,
        'dom': 6, 'domingo': 6
    };
    
    return dias[dia] !== undefined ? dias[dia] : -1;
}

/**
 * Recolecta TODOS los eventos de todas las fuentes
 * @returns {Array} - Array de eventos con formato unificado
 */
function collectAllEvents() {
    const events = [];
    
    console.log('[Calendar] Recolectando eventos...');
    console.log('[Calendar] Estado actual:', {
        clases: state.clases?.length || 0,
        examenes: state.examenes?.length || 0,
        occasionalClasses: state.occasionalClasses?.length || 0,
        userTasks: state.userTasks?.length || 0
    });
    
    // 1. CLASES REGULARES - Convertir a fechas del mes actual
    if (state.clases && state.clases.length > 0) {
        state.clases.forEach(clase => {
            const dayIndex = getDayIndex(clase.dia);
            if (dayIndex === -1) return;
            
            // Generar fechas para este día de la semana en el mes actual
            const datesInMonth = getDatesForDayInMonth(dayIndex, currentMonth, currentYear);
            
            datesInMonth.forEach(date => {
                events.push({
                    type: 'clase',
                    title: clase.asignatura || 'Clase',
                    date: date,
                    time: extractTime(clase.hora) || '',
                    fullTime: formatExcelTime(clase.hora) || '',
                    location: clase.aula || '',
                    turno: clase.turno || '',
                    seccion: clase.seccion || '',
                    semestre: clase.semestre || '',
                    color: 'blue',
                    priority: 1
                });
            });
        });
    }
    
    // 2. EXÁMENES - Tienen fecha específica
    if (state.examenes && state.examenes.length > 0) {
        state.examenes.forEach(examen => {
            const examDate = parseDate(examen.fecha);
            if (!examDate) return;
            
            // Solo incluir si está en el mes actual
            if (examDate.getMonth() === currentMonth && examDate.getFullYear() === currentYear) {
                events.push({
                    type: 'examen',
                    title: `${examen.tipo || 'Examen'}: ${examen.asignatura || 'Materia'}`,
                    date: examDate,
                    time: extractTime(examen.hora) || '',
                    fullTime: formatExcelTime(examen.hora) || '',
                    location: examen.aula || '',
                    turno: examen.turno || '',
                    seccion: examen.seccion || '',
                    semestre: examen.semestre || '',
                    color: 'red',
                    priority: 4
                });
            }
        });
    }
    
    // 3. TAREAS DEL USUARIO - Tienen fecha de entrega
    if (state.userTasks && state.userTasks.length > 0) {
        state.userTasks.forEach(tarea => {
            if (!tarea.fechaEntrega) return;
            
            const tareaDate = parseDate(tarea.fechaEntrega);
            if (!tareaDate) return;
            
            // Solo incluir si está en el mes actual
            if (tareaDate.getMonth() === currentMonth && tareaDate.getFullYear() === currentYear) {
                events.push({
                    type: 'tarea',
                    title: tarea.titulo || tarea.descripcion || 'Tarea',
                    date: tareaDate,
                    time: '',
                    fullTime: '',
                    location: '',
                    materia: tarea.materia || '',
                    descripcion: tarea.descripcion || '',
                    completada: tarea.completada || false,
                    color: tarea.completada ? 'gray' : 'yellow',
                    priority: 3
                });
            }
        });
    }
    
    // 4. CLASES OCASIONALES - Tienen fecha específica
    if (state.occasionalClasses && state.occasionalClasses.length > 0) {
        state.occasionalClasses.forEach(clase => {
            const claseDate = parseDate(clase.fecha);
            if (!claseDate) return;
            
            // Solo incluir si está en el mes actual
            if (claseDate.getMonth() === currentMonth && claseDate.getFullYear() === currentYear) {
                events.push({
                    type: 'ocasional',
                    title: clase.asignatura || 'Clase Ocasional',
                    date: claseDate,
                    time: extractTime(clase.hora) || '',
                    fullTime: formatExcelTime(clase.hora) || '',
                    location: clase.aula || '',
                    turno: clase.turno || '',
                    color: 'purple',
                    priority: 2
                });
            }
        });
    }
    
    console.log(`[Calendar] Total eventos recolectados: ${events.length}`);
    
    return events;
}

/**
 * Obtiene todas las fechas de un día específico en un mes
 * @param {number} dayIndex - Índice del día (0=Lun, 6=Dom)
 * @param {number} month - Mes (0-11)
 * @param {number} year - Año
 * @returns {Array<Date>} - Array de fechas
 */
function getDatesForDayInMonth(dayIndex, month, year) {
    const dates = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Convertir dayIndex (0=Lun) a getDay() (0=Dom)
    const jsDay = dayIndex === 6 ? 0 : dayIndex + 1;
    
    // Encontrar el primer día de la semana en el mes
    let currentDate = new Date(firstDay);
    while (currentDate.getDay() !== jsDay) {
        currentDate.setDate(currentDate.getDate() + 1);
        if (currentDate > lastDay) return dates;
    }
    
    // Agregar todas las ocurrencias del día en el mes
    while (currentDate <= lastDay) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return dates;
}

/**
 * Renderiza el calendario completo
 */
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarDays = document.getElementById('calendarDays');
    
    if (!calendarGrid || !calendarDays) {
        console.error('[Calendar] No se encontraron elementos del calendario');
        return;
    }
    
    // Obtener todos los eventos
    const allEvents = collectAllEvents();
    
    // Limpiar contenido anterior
    calendarDays.innerHTML = '';
    
    // Crear header de días de la semana
    const daysHeader = document.createElement('div');
    daysHeader.className = 'calendar-days-header';
    daysHeader.innerHTML = `
        <div class="day-header">Lun</div>
        <div class="day-header">Mar</div>
        <div class="day-header">Mié</div>
        <div class="day-header">Jue</div>
        <div class="day-header">Vie</div>
        <div class="day-header weekend">Sáb</div>
        <div class="day-header weekend">Dom</div>
    `;
    calendarDays.appendChild(daysHeader);
    
    // Crear grid de días del mes
    const daysContainer = document.createElement('div');
    daysContainer.className = 'calendar-days-grid';
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Día de la semana del primer día (0=Dom, ajustar a 0=Lun)
    let startDay = firstDayOfMonth.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    // Agregar días vacíos antes del primer día
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        daysContainer.appendChild(emptyDay);
    }
    
    // Agregar días del mes
    const today = new Date();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Verificar si es hoy
        const currentDateCheck = new Date(currentYear, currentMonth, day);
        if (today.getDate() === day && 
            today.getMonth() === currentMonth && 
            today.getFullYear() === currentYear) {
            dayElement.classList.add('today');
        }
        
        // Verificar si es fin de semana
        const dayOfWeek = currentDateCheck.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayElement.classList.add('weekend');
        }
        
        // Número del día
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Filtrar eventos para este día
        const dayEvents = allEvents.filter(event => {
            if (!event.date) return false;
            return event.date.getDate() === day &&
                   event.date.getMonth() === currentMonth &&
                   event.date.getFullYear() === currentYear;
        });
        
        // Ordenar eventos por prioridad (exámenes primero)
        dayEvents.sort((a, b) => b.priority - a.priority);
        
        // Mostrar indicadores de eventos
        if (dayEvents.length > 0) {
            dayElement.classList.add('has-events');
            
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'day-events';
            
            // Mostrar máximo 3 eventos en la celda
            const visibleEvents = dayEvents.slice(0, 3);
            visibleEvents.forEach(event => {
                const eventDot = document.createElement('div');
                eventDot.className = `event-indicator event-${event.color}`;
                eventDot.title = event.title;
                eventsContainer.appendChild(eventDot);
            });
            
            // Indicador de más eventos
            if (dayEvents.length > 3) {
                const moreIndicator = document.createElement('div');
                moreIndicator.className = 'more-events';
                moreIndicator.textContent = `+${dayEvents.length - 3}`;
                eventsContainer.appendChild(moreIndicator);
            }
            
            dayElement.appendChild(eventsContainer);
        }
        
        // Click para ver detalles del día
        dayElement.addEventListener('click', () => {
            showDayDetails(day, dayEvents);
        });
        
        daysContainer.appendChild(dayElement);
    }
    
    calendarDays.appendChild(daysContainer);
    
    // Actualizar lista de eventos del mes
    renderEventsList(allEvents);
}

/**
 * Muestra los detalles de un día específico
 * @param {number} day - Día del mes
 * @param {Array} events - Eventos del día
 */
function showDayDetails(day, events) {
    const eventsDetail = document.getElementById('eventsDetail');
    if (!eventsDetail) return;
    
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const date = new Date(currentYear, currentMonth, day);
    const dayName = dayNames[date.getDay()];
    
    let html = `
        <div class="events-detail-header">
            <h3>${dayName} ${day} de ${monthNames[currentMonth]}</h3>
            <span class="events-count">${events.length} evento${events.length !== 1 ? 's' : ''}</span>
        </div>
    `;
    
    if (events.length === 0) {
        html += `
            <div class="no-events">
                <p>No hay eventos programados para este día</p>
            </div>
        `;
    } else {
        html += '<div class="events-detail-list">';
        events.forEach(event => {
            html += createEventCard(event);
        });
        html += '</div>';
    }
    
    eventsDetail.innerHTML = html;
    eventsDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Crea una tarjeta de evento HTML
 * @param {Object} event - Datos del evento
 * @returns {string} - HTML de la tarjeta
 */
function createEventCard(event) {
    const typeLabels = {
        'examen': 'Examen',
        'clase': 'Clase Regular',
        'tarea': 'Tarea',
        'ocasional': 'Clase Especial'
    };
    
    const typeIcons = {
        'examen': '📝',
        'clase': '📚',
        'tarea': '📋',
        'ocasional': '⭐'
    };
    
    let detailsHtml = '';
    
    // Hora - siempre primero y destacado
    if (event.fullTime) {
        detailsHtml += `<span class="event-detail"><span class="detail-icon">🕐</span> ${event.fullTime}</span>`;
    }
    
    // Ubicación/Aula
    if (event.location) {
        detailsHtml += `<span class="event-detail"><span class="detail-icon">📍</span> Aula ${event.location}</span>`;
    }
    
    // Semestre - formato más claro
    if (event.semestre) {
        const semestreText = event.semestre.toString().includes('°') || event.semestre.toString().includes('Sem') 
            ? event.semestre 
            : `${event.semestre}° Semestre`;
        detailsHtml += `<span class="event-detail"><span class="detail-icon">📖</span> ${semestreText}</span>`;
    }
    
    // Sección
    if (event.seccion) {
        detailsHtml += `<span class="event-detail"><span class="detail-icon">👥</span> Sección ${event.seccion}</span>`;
    }
    
    // Turno - formato más claro
    if (event.turno) {
        const turnoText = event.turno.length === 1 
            ? (event.turno === 'M' ? 'Mañana' : event.turno === 'T' ? 'Tarde' : event.turno === 'N' ? 'Noche' : event.turno)
            : event.turno;
        detailsHtml += `<span class="event-detail"><span class="detail-icon">⏰</span> Turno ${turnoText}</span>`;
    }
    
    // Para tareas - materia asociada
    if (event.materia) {
        detailsHtml += `<span class="event-detail"><span class="detail-icon">📚</span> ${event.materia}</span>`;
    }
    
    // Descripción de tarea
    if (event.descripcion && event.type === 'tarea') {
        detailsHtml += `<span class="event-detail description">${event.descripcion}</span>`;
    }
    
    // Estado de tarea
    let statusHtml = '';
    if (event.type === 'tarea') {
        statusHtml = event.completada 
            ? '<span class="task-status completed">✓ Completada</span>'
            : '<span class="task-status pending">⏳ Pendiente</span>';
    }
    
    // Si no hay detalles, mostrar mensaje
    if (!detailsHtml) {
        detailsHtml = '<span class="event-detail">Sin información adicional</span>';
    }
    
    return `
        <div class="event-card event-card-${event.color}">
            <div class="event-card-header">
                <span class="event-type-badge ${event.type}">${typeIcons[event.type]} ${typeLabels[event.type]}</span>
                ${statusHtml}
            </div>
            <div class="event-card-title">${event.title}</div>
            <div class="event-card-details">
                ${detailsHtml}
            </div>
        </div>
    `;
}

/**
 * Renderiza la lista de todos los eventos del mes
 * @param {Array} events - Todos los eventos del mes
 */
function renderEventsList(events) {
    const eventsDetail = document.getElementById('eventsDetail');
    if (!eventsDetail) return;
    
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    // Agrupar eventos por tipo
    const examenes = events.filter(e => e.type === 'examen');
    const tareas = events.filter(e => e.type === 'tarea');
    const ocasionales = events.filter(e => e.type === 'ocasional');
    const clases = events.filter(e => e.type === 'clase');
    
    let html = `
        <div class="events-summary">
            <h3>Resumen de ${monthNames[currentMonth]} ${currentYear}</h3>
            <div class="summary-stats">
                <div class="stat-item stat-red">
                    <span class="stat-number">${examenes.length}</span>
                    <span class="stat-label">Exámenes</span>
                </div>
                <div class="stat-item stat-yellow">
                    <span class="stat-number">${tareas.length}</span>
                    <span class="stat-label">Tareas</span>
                </div>
                <div class="stat-item stat-purple">
                    <span class="stat-number">${ocasionales.length}</span>
                    <span class="stat-label">Clases Ocasionales</span>
                </div>
                <div class="stat-item stat-blue">
                    <span class="stat-number">${clases.length}</span>
                    <span class="stat-label">Clases Regulares</span>
                </div>
            </div>
        </div>
        <div class="events-tip">
            <p>📅 Haz clic en un día para ver los detalles de sus eventos</p>
        </div>
    `;
    
    // Mostrar próximos eventos importantes (exámenes y tareas pendientes)
    const importantEvents = [...examenes, ...tareas.filter(t => !t.completada), ...ocasionales]
        .sort((a, b) => a.date - b.date);
    
    if (importantEvents.length > 0) {
        html += `
            <div class="upcoming-events">
                <h4>📌 Próximos eventos importantes</h4>
                <div class="upcoming-list">
        `;
        
        importantEvents.slice(0, 5).forEach(event => {
            const dayOfMonth = event.date.getDate();
            html += `
                <div class="upcoming-item ${event.type}">
                    <div class="upcoming-date">${dayOfMonth}</div>
                    <div class="upcoming-info">
                        <span class="upcoming-title">${event.title.replace(/^[📝📋⭐]\s*/, '')}</span>
                        ${event.fullTime ? `<span class="upcoming-time">🕐 ${event.fullTime}</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
    }
    
    eventsDetail.innerHTML = html;
}
