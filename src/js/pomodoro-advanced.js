/**
 * pomodoro-advanced.js - Sistema Avanzado de Pomodoro para Mi Horario FPUNA
 * Temporizador profesional con estadísticas, logros y personalización completa
 */

import { state } from './state.js';
import { showToast } from './utils.js';

// ============================================
// CONFIGURACIÓN Y ESTADO
// ============================================

const DEFAULT_CONFIG = {
    focusDuration: 25,      // minutos
    shortBreakDuration: 5,   // minutos
    longBreakDuration: 15,   // minutos
    cyclesUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true,
    notificationsEnabled: true,
    soundVolume: 0.5
};

let pomodoroConfig = { ...DEFAULT_CONFIG };
let pomodoroState = {
    isRunning: false,
    isPaused: false,
    currentMode: 'focus', // 'focus', 'shortBreak', 'longBreak'
    timeRemaining: 0,
    totalTime: 0,
    cyclesCompleted: 0,
    currentTask: null,
    timerInterval: null,
    sessionStartTime: null,
    dailyStats: {
        focusMinutes: 0,
        breakMinutes: 0,
        completedPomodoros: 0
    }
};

// Categorías de tareas (predeterminadas + personalizadas)
let TASK_CATEGORIES = [
    { id: 'study', name: 'Estudio', color: 'blue', icon: 'fa-book', iconColor: 'text-blue-600', custom: false },
    { id: 'work', name: 'Trabajo', color: 'purple', icon: 'fa-briefcase', iconColor: 'text-purple-600', custom: false },
    { id: 'personal', name: 'Personal', color: 'green', icon: 'fa-home', iconColor: 'text-green-600', custom: false },
    { id: 'project', name: 'Proyecto', color: 'orange', icon: 'fa-rocket', iconColor: 'text-orange-600', custom: false },
    { id: 'other', name: 'Otro', color: 'gray', icon: 'fa-pen', iconColor: 'text-gray-600', custom: false }
];

// Cargar categorías personalizadas
function loadCustomCategories() {
    const customCategoriesJSON = localStorage.getItem('fpuna_pomodoro_custom_categories');
    if (customCategoriesJSON) {
        try {
            const customCategories = JSON.parse(customCategoriesJSON);
            TASK_CATEGORIES = [...TASK_CATEGORIES.filter(c => !c.custom), ...customCategories];
        } catch (e) {
            console.error('[Pomodoro] Error cargando categorías personalizadas:', e);
        }
    }
}

// Guardar categorías personalizadas
function saveCustomCategories() {
    const customCategories = TASK_CATEGORIES.filter(c => c.custom);
    localStorage.setItem('fpuna_pomodoro_custom_categories', JSON.stringify(customCategories));
}

// Sistema de logros
const ACHIEVEMENTS = [
    { id: 'first_pomodoro', name: 'Primer Pomodoro', description: 'Completa tu primera sesión', icon: 'fa-seedling', iconColor: 'text-green-500', requirement: { type: 'total_pomodoros', value: 1 } },
    { id: 'streak_3', name: 'En Racha', description: '3 días consecutivos', icon: 'fa-fire', iconColor: 'text-orange-500', requirement: { type: 'streak_days', value: 3 } },
    { id: 'streak_7', name: 'Semana Perfecta', description: '7 días consecutivos', icon: 'fa-star', iconColor: 'text-yellow-500', requirement: { type: 'streak_days', value: 7 } },
    { id: 'marathon', name: 'Maratonista', description: '10 horas de enfoque total', icon: 'fa-running', iconColor: 'text-blue-500', requirement: { type: 'total_hours', value: 10 } },
    { id: 'night_owl', name: 'Ave Nocturna', description: 'Pomodoro después de las 10 PM', icon: 'fa-moon', iconColor: 'text-indigo-500', requirement: { type: 'late_night', value: 1 } },
    { id: 'early_bird', name: 'Madrugador', description: 'Pomodoro antes de las 7 AM', icon: 'fa-sun', iconColor: 'text-yellow-400', requirement: { type: 'early_morning', value: 1 } },
    { id: 'century', name: 'Centurión', description: '100 pomodoros completados', icon: 'fa-trophy', iconColor: 'text-yellow-600', requirement: { type: 'total_pomodoros', value: 100 } }
];

// ============================================
// AUDIO Y NOTIFICACIONES
// ============================================

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {
            // Sonido más enérgico para inicio de pomodoro (tono ascendente)
            pomodoroStart: { frequencies: [400, 500, 600], duration: 0.2, type: 'sine' },
            // Sonido más relajante para descanso (tono descendente)
            breakStart: { frequencies: [600, 500, 400], duration: 0.2, type: 'sine' },
            // Sonido de finalización más notorio
            pomodoroEnd: { frequencies: [800, 900, 1000], duration: 0.3, type: 'sine' },
            breakEnd: { frequencies: [700, 600, 500], duration: 0.3, type: 'sine' },
            tick: { frequency: 400, duration: 0.05, type: 'sine' }
        };
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('[Pomodoro] Audio API no disponible');
        }
    }

    playSound(soundType) {
        if (!pomodoroConfig.soundEnabled || !this.audioContext) return;

        const sound = this.sounds[soundType];
        if (!sound) return;

        // Sonidos con múltiples frecuencias (melodía)
        if (sound.frequencies) {
            sound.frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);

                    oscillator.frequency.value = freq;
                    oscillator.type = sound.type;

                    gainNode.gain.setValueAtTime(pomodoroConfig.soundVolume * 1.5, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);

                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + sound.duration);
                }, index * 150);
            });
        } else {
            // Sonido simple (frecuencia única)
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = sound.frequency;
            oscillator.type = sound.type;

            gainNode.gain.setValueAtTime(pomodoroConfig.soundVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + sound.duration);
        }
    }

    playPomodoroComplete() {
        this.playSound('pomodoroEnd');
    }

    playBreakComplete() {
        this.playSound('breakEnd');
    }

    playPomodoroStart() {
        this.playSound('pomodoroStart');
    }

    playBreakStart() {
        this.playSound('breakStart');
    }
}

const soundManager = new SoundManager();

// Notificaciones del navegador
function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function showNotification(title, body, icon = null) {
    if (!pomodoroConfig.notificationsEnabled || Notification.permission !== 'granted') return;

    new Notification(title, {
        body: body,
        icon: icon,
        badge: icon,
        silent: false
    });
}

// ============================================
// GESTIÓN DE DATOS
// ============================================

function loadPomodoroData() {
    // Cargar configuración
    const savedConfig = localStorage.getItem('fpuna_pomodoro_config');
    if (savedConfig) {
        try {
            pomodoroConfig = { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
        } catch (e) {
            console.error('[Pomodoro] Error cargando configuración:', e);
        }
    }

    // Cargar sesiones históricas
    const sessionsJSON = localStorage.getItem('fpuna_pomodoro_sessions');
    if (sessionsJSON) {
        try {
            state.pomodoroSessions = JSON.parse(sessionsJSON);
        } catch (e) {
            console.error('[Pomodoro] Error cargando sesiones:', e);
            state.pomodoroSessions = [];
        }
    } else {
        state.pomodoroSessions = [];
    }

    // Cargar tareas Pomodoro
    const tasksJSON = localStorage.getItem('fpuna_pomodoro_tasks');
    if (tasksJSON) {
        try {
            state.pomodoroTasks = JSON.parse(tasksJSON);
        } catch (e) {
            console.error('[Pomodoro] Error cargando tareas:', e);
            state.pomodoroTasks = [];
        }
    } else {
        state.pomodoroTasks = [];
    }

    // Cargar logros
    const achievementsJSON = localStorage.getItem('fpuna_pomodoro_achievements');
    if (achievementsJSON) {
        try {
            state.unlockedAchievements = JSON.parse(achievementsJSON);
        } catch (e) {
            console.error('[Pomodoro] Error cargando logros:', e);
            state.unlockedAchievements = [];
        }
    } else {
        state.unlockedAchievements = [];
    }
}

function savePomodoroConfig() {
    localStorage.setItem('fpuna_pomodoro_config', JSON.stringify(pomodoroConfig));
}

function savePomodoroSession(session) {
    if (!state.pomodoroSessions) state.pomodoroSessions = [];
    
    state.pomodoroSessions.push(session);
    localStorage.setItem('fpuna_pomodoro_sessions', JSON.stringify(state.pomodoroSessions));
}

function savePomodoroTasks() {
    localStorage.setItem('fpuna_pomodoro_tasks', JSON.stringify(state.pomodoroTasks || []));
}

function saveAchievements() {
    localStorage.setItem('fpuna_pomodoro_achievements', JSON.stringify(state.unlockedAchievements || []));
}

// ============================================
// LÓGICA DEL TEMPORIZADOR
// ============================================

export function initPomodoro() {
    loadPomodoroData();
    loadCustomCategories();
    soundManager.init();
    requestNotificationPermission();
    
    // Restaurar estado del timer si existe
    pomodoroState.timeRemaining = pomodoroConfig.focusDuration * 60;
    pomodoroState.totalTime = pomodoroState.timeRemaining;
    
    setupPomodoroUI();
    updatePomodoroDisplay();
    
    console.log('[Pomodoro Advanced] Módulo inicializado');
}

function setupPomodoroUI() {
    // Event listeners para controles principales
    const startBtn = document.getElementById('pomodoroStartBtn');
    const pauseBtn = document.getElementById('pomodoroPauseBtn');
    const resetBtn = document.getElementById('pomodoroResetBtn');
    const skipBtn = document.getElementById('pomodoroSkipBtn');
    const settingsBtn = document.getElementById('pomodoroSettingsBtn');

    if (startBtn) startBtn.addEventListener('click', startPomodoro);
    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
    if (resetBtn) resetBtn.addEventListener('click', resetPomodoro);
    if (skipBtn) skipBtn.addEventListener('click', skipSession);
    if (settingsBtn) settingsBtn.addEventListener('click', openSettings);

    // Event listeners para gestión de tareas
    const addTaskBtn = document.getElementById('addPomodoroTaskBtn');
    const taskForm = document.getElementById('pomodoroTaskForm');
    const closeTaskBtn = document.getElementById('closePomodoroTaskBtn');
    const cancelTaskBtn = document.getElementById('cancelPomodoroTaskBtn');
    const taskModal = document.getElementById('pomodoroTaskModal');

    if (addTaskBtn) addTaskBtn.addEventListener('click', openTaskModal);
    if (taskForm) taskForm.addEventListener('submit', savePomodoroTask);
    if (closeTaskBtn) closeTaskBtn.addEventListener('click', closeTaskModal);
    if (cancelTaskBtn) cancelTaskBtn.addEventListener('click', closeTaskModal);
    
    // Cerrar modal al hacer clic fuera
    if (taskModal) {
        taskModal.addEventListener('click', (e) => {
            if (e.target === taskModal) {
                closeTaskModal();
            }
        });
    }
}

export function startPomodoro() {
    if (pomodoroState.isRunning && !pomodoroState.isPaused) return;

    if (!pomodoroState.isPaused) {
        pomodoroState.sessionStartTime = Date.now();
        // Reproducir sonido de inicio según el modo
        if (pomodoroState.currentMode === 'focus') {
            soundManager.playPomodoroStart();
        } else {
            soundManager.playBreakStart();
        }
    }

    pomodoroState.isRunning = true;
    pomodoroState.isPaused = false;

    pomodoroState.timerInterval = setInterval(() => {
        if (pomodoroState.timeRemaining > 0) {
            pomodoroState.timeRemaining--;
            updatePomodoroDisplay();
            
            // Actualizar título de la página
            updatePageTitle();
        } else {
            handleSessionComplete();
        }
    }, 1000);

    updateButtons();
    showToast(`Sesión ${pomodoroState.currentMode === 'focus' ? 'de enfoque' : 'de descanso'} iniciada`, 'success');
}

function togglePause() {
    if (!pomodoroState.isRunning) return;

    pomodoroState.isPaused = !pomodoroState.isPaused;

    if (pomodoroState.isPaused) {
        clearInterval(pomodoroState.timerInterval);
        showToast('Pausado', 'info');
    } else {
        startPomodoro();
    }

    updateButtons();
}

function resetPomodoro() {
    clearInterval(pomodoroState.timerInterval);
    
    pomodoroState.isRunning = false;
    pomodoroState.isPaused = false;
    pomodoroState.timeRemaining = getDurationForMode(pomodoroState.currentMode);
    pomodoroState.totalTime = pomodoroState.timeRemaining;

    updatePomodoroDisplay();
    updateButtons();
    updatePageTitle();
    showToast('Reiniciado', 'info');
}

function skipSession() {
    if (confirm('¿Saltar esta sesión?')) {
        handleSessionComplete();
    }
}

function handleSessionComplete() {
    clearInterval(pomodoroState.timerInterval);
    
    const wasInFocus = pomodoroState.currentMode === 'focus';
    
    // Reproducir sonido adecuado según el modo que termina
    if (wasInFocus) {
        soundManager.playPomodoroComplete();
    } else {
        soundManager.playBreakComplete();
    }

    if (wasInFocus) {
        // Guardar sesión completada
        const session = {
            id: 'session_' + Date.now(),
            type: 'focus',
            duration: pomodoroConfig.focusDuration,
            taskId: pomodoroState.currentTask,
            startTime: pomodoroState.sessionStartTime,
            endTime: Date.now(),
            completed: true
        };
        
        savePomodoroSession(session);
        pomodoroState.cyclesCompleted++;
        pomodoroState.dailyStats.completedPomodoros++;

        // Actualizar tarea asociada
        if (pomodoroState.currentTask) {
            updateTaskProgress(pomodoroState.currentTask);
        }

        // Verificar logros
        checkAchievements();

        // Determinar siguiente modo
        if (pomodoroState.cyclesCompleted % pomodoroConfig.cyclesUntilLongBreak === 0) {
            pomodoroState.currentMode = 'longBreak';
            showNotification('¡Pomodoro Completado!', 'Toma un descanso largo. ¡Lo mereces!');
            showToast('¡Ciclo completado! Descanso largo', 'success');
        } else {
            pomodoroState.currentMode = 'shortBreak';
            showNotification('¡Pomodoro Completado!', 'Toma un descanso corto');
            showToast('¡Pomodoro completado! Descanso corto', 'success');
        }
    } else {
        // Completó un descanso
        pomodoroState.currentMode = 'focus';
        showNotification('Descanso terminado', 'Es hora de volver al enfoque');
        showToast('¡A trabajar de nuevo!', 'info');
    }

    pomodoroState.isRunning = false;
    pomodoroState.isPaused = false;
    pomodoroState.timeRemaining = getDurationForMode(pomodoroState.currentMode);
    pomodoroState.totalTime = pomodoroState.timeRemaining;

    updatePomodoroDisplay();
    updateButtons();
    updatePageTitle();
    renderStats();

    // Auto-inicio si está habilitado
    if ((wasInFocus && pomodoroConfig.autoStartBreaks) || 
        (!wasInFocus && pomodoroConfig.autoStartPomodoros)) {
        setTimeout(() => startPomodoro(), 2000);
    }
}

function getDurationForMode(mode) {
    switch (mode) {
        case 'focus':
            return pomodoroConfig.focusDuration * 60;
        case 'shortBreak':
            return pomodoroConfig.shortBreakDuration * 60;
        case 'longBreak':
            return pomodoroConfig.longBreakDuration * 60;
        default:
            return pomodoroConfig.focusDuration * 60;
    }
}

// ============================================
// UI Y VISUALIZACIÓN
// ============================================

function updatePomodoroDisplay() {
    const timerDisplay = document.getElementById('pomodoroTimerDisplay');
    const modeDisplay = document.getElementById('pomodoroModeDisplay');
    const progressBar = document.getElementById('pomodoroProgressBar');
    const cyclesDisplay = document.getElementById('pomodoroCyclesDisplay');
    const totalTimeDisplay = document.getElementById('pomodoroTotalTimeDisplay');
    const streakDisplay = document.getElementById('pomodoroStreakDisplay');
    const currentTaskDisplay = document.getElementById('currentTaskDisplay');

    if (timerDisplay) {
        const minutes = Math.floor(pomodoroState.timeRemaining / 60);
        const seconds = pomodoroState.timeRemaining % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    if (modeDisplay) {
        const modeTexts = {
            focus: 'Enfoque',
            shortBreak: 'Descanso Corto',
            longBreak: 'Descanso Largo'
        };
        modeDisplay.textContent = modeTexts[pomodoroState.currentMode];
    }

    if (progressBar) {
        const progress = ((pomodoroState.totalTime - pomodoroState.timeRemaining) / pomodoroState.totalTime) * 100;
        progressBar.style.width = `${progress}%`;
    }

    if (cyclesDisplay) {
        cyclesDisplay.textContent = pomodoroState.dailyStats.completedPomodoros;
    }

    if (totalTimeDisplay) {
        const totalHours = Math.floor((pomodoroState.dailyStats.focusMinutes + pomodoroState.dailyStats.breakMinutes) / 60);
        totalTimeDisplay.textContent = `${totalHours}h`;
    }

    if (streakDisplay) {
        const streak = getPomodoroStreak();
        streakDisplay.textContent = streak;
    }
    
    // Mostrar tarea actual
    if (currentTaskDisplay) {
        if (pomodoroState.currentTask) {
            const task = state.pomodoroTasks?.find(t => t.id === pomodoroState.currentTask);
            if (task) {
                const categoryInfo = TASK_CATEGORIES.find(c => c.id === task.category) || TASK_CATEGORIES[4];
                currentTaskDisplay.innerHTML = `
                    <span class="inline-flex items-center gap-2 text-sm">
                        <span>${categoryInfo.icon}</span>
                        <span class="font-medium">${task.title}</span>
                        <span class="text-gray-400">•</span>
                        <span>🍅 ${task.completedPomodoros}/${task.estimatedPomodoros}</span>
                    </span>
                `;
            } else {
                currentTaskDisplay.textContent = 'Sin tarea seleccionada';
            }
        } else {
            currentTaskDisplay.innerHTML = '<span class="text-gray-400">Selecciona una tarea para comenzar</span>';
        }
    }
}

function updateButtons() {
    const startBtn = document.getElementById('pomodoroStartBtn');
    const pauseBtn = document.getElementById('pomodoroPauseBtn');

    if (startBtn) {
        startBtn.disabled = pomodoroState.isRunning && !pomodoroState.isPaused;
        startBtn.classList.toggle('opacity-50', pomodoroState.isRunning && !pomodoroState.isPaused);
    }

    if (pauseBtn) {
        pauseBtn.innerHTML = pomodoroState.isPaused 
            ? '<i class="fas fa-play mr-2"></i>Reanudar' 
            : '<i class="fas fa-pause mr-2"></i>Pausar';
        pauseBtn.disabled = !pomodoroState.isRunning;
        pauseBtn.classList.toggle('opacity-50', !pomodoroState.isRunning);
    }
}

function updatePageTitle() {
    if (pomodoroState.isRunning && !pomodoroState.isPaused) {
        const minutes = Math.floor(pomodoroState.timeRemaining / 60);
        const seconds = pomodoroState.timeRemaining % 60;
        document.title = `${minutes}:${String(seconds).padStart(2, '0')} - Pomodoro`;
    } else {
        document.title = 'Mi Horario FPUNA';
    }
}

// ============================================
// GESTIÓN DE TAREAS
// ============================================

function openTaskModal() {
    const modal = document.getElementById('pomodoroTaskModal');
    const form = document.getElementById('pomodoroTaskForm');
    const title = document.getElementById('pomodoroTaskModalTitle');
    const taskId = document.getElementById('pomodoroTaskId');
    
    if (!modal || !form) return;
    
    // Limpiar formulario
    form.reset();
    taskId.value = '';
    title.textContent = 'Nueva Tarea Pomodoro';
    
    // Actualizar select de categorías con las personalizadas
    updateCategorySelect();
    
    // Mostrar modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeTaskModal() {
    const modal = document.getElementById('pomodoroTaskModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function savePomodoroTask(event) {
    if (event) event.preventDefault();
    
    const taskId = document.getElementById('pomodoroTaskId')?.value;
    const title = document.getElementById('pomodoroTaskTitle')?.value.trim();
    const category = document.getElementById('pomodoroTaskCategory')?.value || 'other';
    const estimatedPomodoros = parseInt(document.getElementById('pomodoroTaskEstimated')?.value) || 4;
    const description = document.getElementById('pomodoroTaskDescription')?.value.trim();
    
    if (!title) {
        showToast('El título es obligatorio', 'error');
        return;
    }
    
    // Inicializar array de tareas si no existe
    if (!state.pomodoroTasks) {
        state.pomodoroTasks = [];
    }
    
    if (taskId) {
        // Editar tarea existente
        const task = state.pomodoroTasks.find(t => t.id === taskId);
        if (task) {
            task.title = title;
            task.category = category;
            task.estimatedPomodoros = estimatedPomodoros;
            task.description = description;
            showToast('Tarea actualizada', 'success');
        }
    } else {
        // Crear nueva tarea
        const newTask = {
            id: 'task_' + Date.now(),
            title,
            category,
            estimatedPomodoros,
            description,
            completedPomodoros: 0,
            createdAt: new Date().toISOString(),
            isActive: true
        };
        state.pomodoroTasks.push(newTask);
        showToast('Tarea creada correctamente', 'success');
    }
    
    savePomodoroTasks();
    closeTaskModal();
    renderTasksList();
}

function updateTaskProgress(taskId) {
    const task = state.pomodoroTasks.find(t => t.id === taskId);
    if (task) {
        task.completedPomodoros = (task.completedPomodoros || 0) + 1;
        savePomodoroTasks();
        renderTasksList();
    }
}

function renderTasksList() {
    const container = document.getElementById('pomodoroTasksList');
    if (!container) return;
    
    const tasks = state.pomodoroTasks || [];
    
    if (tasks.length === 0) {
        container.innerHTML = `
            <p class="text-center text-gray-400 dark:text-gray-500 py-8">
                <i class="fas fa-tasks text-3xl mb-2"></i><br>
                No hay tareas. ¡Crea una para empezar!
            </p>
        `;
        return;
    }
    
    const activeTasks = tasks.filter(t => t.isActive !== false);
    
    container.innerHTML = activeTasks.map(task => {
        const progress = task.estimatedPomodoros > 0 
            ? Math.round((task.completedPomodoros / task.estimatedPomodoros) * 100) 
            : 0;
        const isCompleted = task.completedPomodoros >= task.estimatedPomodoros;
        const categoryInfo = TASK_CATEGORIES.find(c => c.id === task.category) || TASK_CATEGORIES[4];
        const isSelected = pomodoroState.currentTask === task.id;
        
        return `
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border-2 ${
                isSelected ? 'border-red-500 dark:border-red-400' : 'border-transparent'
            } transition-all ${
                isCompleted ? 'opacity-60' : ''
            }">
                <div class="flex items-start gap-3">
                    <!-- Checkbox para seleccionar -->
                    <button onclick="window.selectPomodoroTask('${task.id}')" 
                            class="mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                isSelected 
                                    ? 'bg-red-500 border-red-500 text-white' 
                                    : 'border-gray-300 dark:border-gray-500 hover:border-red-400'
                            }">
                        ${isSelected ? '<i class="fas fa-check text-xs"></i>' : ''}
                    </button>
                    
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-2 mb-2">
                            <div>
                                <span class="text-lg ${categoryInfo.iconColor || 'text-gray-600'}"><i class="fas ${categoryInfo.icon}"></i></span>
                                <span class="font-semibold text-gray-900 dark:text-white">
                                    ${task.title}
                                </span>
                                ${isCompleted ? '<span class="ml-2 text-xs text-green-600 dark:text-green-400"><i class="fas fa-check"></i> Completada</span>' : ''}
                            </div>
                            <div class="flex gap-1">
                                <button onclick="window.editPomodoroTask('${task.id}')" 
                                        class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                        title="Editar">
                                    <i class="fas fa-edit text-sm"></i>
                                </button>
                                <button onclick="window.deletePomodoroTask('${task.id}')" 
                                        class="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title="Eliminar">
                                    <i class="fas fa-trash text-sm"></i>
                                </button>
                            </div>
                        </div>
                        
                        ${task.description ? `
                            <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">${task.description}</p>
                        ` : ''}
                        
                        <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span>🍅 ${task.completedPomodoros}/${task.estimatedPomodoros}</span>
                            <div class="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                <div class="bg-red-500 h-1.5 rounded-full transition-all" style="width: ${progress}%"></div>
                            </div>
                            <span class="font-medium">${progress}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function editPomodoroTask(taskId) {
    const task = state.pomodoroTasks?.find(t => t.id === taskId);
    if (!task) return;
    
    const modal = document.getElementById('pomodoroTaskModal');
    const form = document.getElementById('pomodoroTaskForm');
    const title = document.getElementById('pomodoroTaskModalTitle');
    
    if (!modal || !form) return;
    
    // Actualizar categorías antes de llenar
    updateCategorySelect();
    
    // Llenar formulario con datos de la tarea
    document.getElementById('pomodoroTaskId').value = task.id;
    document.getElementById('pomodoroTaskTitle').value = task.title;
    document.getElementById('pomodoroTaskCategory').value = task.category;
    document.getElementById('pomodoroTaskEstimated').value = task.estimatedPomodoros;
    document.getElementById('pomodoroTaskDescription').value = task.description || '';
    
    title.textContent = 'Editar Tarea';
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function deletePomodoroTask(taskId) {
    if (!confirm('¿Eliminar esta tarea?')) return;
    
    if (!state.pomodoroTasks) state.pomodoroTasks = [];
    
    const index = state.pomodoroTasks.findIndex(t => t.id === taskId);
    if (index > -1) {
        state.pomodoroTasks.splice(index, 1);
        savePomodoroTasks();
        renderTasksList();
        showToast('Tarea eliminada', 'success');
        
        // Si era la tarea actual, limpiar selección
        if (pomodoroState.currentTask === taskId) {
            pomodoroState.currentTask = null;
            updatePomodoroDisplay();
        }
    }
}

function selectPomodoroTask(taskId) {
    const task = state.pomodoroTasks?.find(t => t.id === taskId);
    if (!task) return;
    
    // Alternar selección
    if (pomodoroState.currentTask === taskId) {
        pomodoroState.currentTask = null;
        showToast('Tarea deseleccionada', 'info');
    } else {
        pomodoroState.currentTask = taskId;
        showToast(`Tarea seleccionada: ${task.title}`, 'success');
    }
    
    renderTasksList();
    updatePomodoroDisplay();
}

// ============================================
// LOGROS Y GAMIFICACIÓN
// ============================================

function checkAchievements() {
    // Verificar y desbloquear logros
    if (!state.unlockedAchievements) state.unlockedAchievements = [];
    
    ACHIEVEMENTS.forEach(achievement => {
        if (state.unlockedAchievements.includes(achievement.id)) return;

        let unlocked = false;
        const sessions = state.pomodoroSessions || [];
        const focusSessions = sessions.filter(s => s.type === 'focus' && s.completed);

        switch (achievement.requirement.type) {
            case 'total_pomodoros':
                unlocked = focusSessions.length >= achievement.requirement.value;
                break;
            case 'total_hours':
                const totalMinutes = focusSessions.reduce((sum, s) => sum + (s.duration || 25), 0);
                const totalHours = totalMinutes / 60;
                unlocked = totalHours >= achievement.requirement.value;
                break;
            case 'streak_days':
                const streak = getPomodoroStreak();
                unlocked = streak >= achievement.requirement.value;
                break;
            case 'late_night':
                unlocked = focusSessions.some(s => {
                    const hour = new Date(s.endTime).getHours();
                    return hour >= 22;
                });
                break;
            case 'early_morning':
                unlocked = focusSessions.some(s => {
                    const hour = new Date(s.startTime).getHours();
                    return hour <= 7;
                });
                break;
        }

        if (unlocked) {
            unlockAchievement(achievement);
        }
    });
}

function unlockAchievement(achievement) {
    if (!state.unlockedAchievements) state.unlockedAchievements = [];
    state.unlockedAchievements.push(achievement.id);
    saveAchievements();
    
    // Animación y notificación especial
    showToast(`¡Logro desbloqueado! ${achievement.name}`, 'success');
    showNotification('Nuevo Logro Desbloqueado', `${achievement.name}: ${achievement.description}`);
}

// ============================================
// CONFIGURACIÓN
// ============================================

function openSettings() {
    showToast('Configuración (próximamente)', 'info');
}

function getPomodoroStreak() {
    // Calcular racha de días consecutivos
    const sessions = state.pomodoroSessions || [];
    if (sessions.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayHasSessions = sessions.some(s => s.date && s.date.startsWith(dateStr));
        
        if (dayHasSessions) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    return streak;
}

// ============================================
// ESTADÍSTICAS
// ============================================

function calculateStats() {
    const sessions = state.pomodoroSessions || [];
    const focusSessions = sessions.filter(s => s.type === 'focus' && s.completed);
    
    // Estadísticas generales
    const totalPomodoros = focusSessions.length;
    const totalMinutes = focusSessions.reduce((sum, s) => sum + (s.duration || 25), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const streak = getPomodoroStreak();
    
    // Estadísticas de la semana actual
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Domingo
    weekStart.setHours(0, 0, 0, 0);
    
    const weekSessions = focusSessions.filter(s => new Date(s.endTime) >= weekStart);
    const weekPomodoros = weekSessions.length;
    const weekMinutes = weekSessions.reduce((sum, s) => sum + (s.duration || 25), 0);
    
    // Estadísticas por día de la semana
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const pomodorosByDay = new Array(7).fill(0);
    
    weekSessions.forEach(session => {
        const day = new Date(session.endTime).getDay();
        pomodorosByDay[day]++;
    });
    
    // Categoría más productiva
    const categoryStats = {};
    const tasks = state.pomodoroTasks || [];
    
    focusSessions.forEach(session => {
        if (session.taskId) {
            const task = tasks.find(t => t.id === session.taskId);
            if (task) {
                categoryStats[task.category] = (categoryStats[task.category] || 0) + 1;
            }
        }
    });
    
    let topCategory = 'other';
    let maxCount = 0;
    Object.entries(categoryStats).forEach(([cat, count]) => {
        if (count > maxCount) {
            topCategory = cat;
            maxCount = count;
        }
    });
    
    return {
        totalPomodoros,
        totalHours,
        totalMinutes,
        streak,
        weekPomodoros,
        weekMinutes,
        pomodorosByDay,
        dayNames,
        topCategory,
        categoryStats
    };
}

function renderStats() {
    const stats = calculateStats();
    const topCategoryData = TASK_CATEGORIES.find(c => c.id === stats.topCategory) || TASK_CATEGORIES[4];
    
    return `
        <div class="space-y-4">
            <!-- Tarjetas de resumen -->
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
                    <div class="text-4xl mb-2"><i class="fas fa-stopwatch"></i></div>
                    <div class="text-4xl font-bold mb-1">${stats.totalPomodoros}</div>
                    <div class="text-sm opacity-90">Pomodoros Totales</div>
                </div>
                
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div class="text-4xl mb-2"><i class="fas fa-clock"></i></div>
                    <div class="text-4xl font-bold mb-1">${stats.totalHours}h</div>
                    <div class="text-sm opacity-90">${stats.totalMinutes % 60}m de enfoque</div>
                </div>
                
                <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                    <div class="text-4xl mb-2 animate-pulse"><i class="fas fa-fire"></i></div>
                    <div class="text-4xl font-bold mb-1">${stats.streak}</div>
                    <div class="text-sm opacity-90">Días de racha</div>
                </div>
                
                <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                    <div class="text-4xl mb-2"><i class="fas ${topCategoryData.icon}"></i></div>
                    <div class="text-lg font-bold mb-1">${topCategoryData.name}</div>
                    <div class="text-sm opacity-90">Categoría top</div>
                </div>
            </div>
            
            <!-- Gráfico de la semana -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4"><i class="fas fa-chart-line"></i> Actividad de la Semana</h3>
                <div class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    ${stats.weekPomodoros} pomodoros completados esta semana (${Math.floor(stats.weekMinutes / 60)}h ${stats.weekMinutes % 60}m)
                </div>
                <div class="flex items-end justify-between h-56 gap-2">
                    ${stats.pomodorosByDay.map((count, index) => {
                        const maxCount = Math.max(...stats.pomodorosByDay, 1);
                        const heightPercent = (count / maxCount) * 100;
                        const heightPx = (count / maxCount) * 160; // 160px = altura máxima de la barra
                        return `
                            <div class="flex-1 flex flex-col items-center justify-end" style="height: 100%;">
                                <div class="text-sm font-medium text-gray-900 dark:text-white mb-1" style="min-height: 20px;">
                                    ${count > 0 ? count : ''}
                                </div>
                                <div class="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t-lg transition-all relative" 
                                     style="height: ${heightPx}px; min-height: ${count > 0 ? '8px' : '0px'};">
                                </div>
                                <div class="text-xs text-gray-600 dark:text-gray-400 mt-2">${stats.dayNames[index]}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <!-- Distribución por categorías -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4"><i class="fas fa-tags"></i> Tiempo por Categoría</h3>
                <div class="space-y-3">
                    ${Object.entries(stats.categoryStats).map(([categoryId, count]) => {
                        const category = TASK_CATEGORIES.find(c => c.id === categoryId) || TASK_CATEGORIES[4];
                        const percentage = (count / stats.totalPomodoros) * 100;
                        return `
                            <div>
                                <div class="flex justify-between items-center mb-2">
                                    <div class="flex items-center gap-2">
                                        <span class="text-xl ${category.iconColor || 'text-gray-600'}"><i class="fas ${category.icon}"></i></span>
                                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${category.name}</span>
                                    </div>
                                    <span class="text-sm font-bold text-gray-900 dark:text-white">${count} (${percentage.toFixed(0)}%)</span>
                                </div>
                                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div class="bg-${category.color}-500 h-2 rounded-full transition-all" style="width: ${percentage}%"></div>
                                </div>
                            </div>
                        `;
                    }).join('') || '<p class="text-center text-gray-400 dark:text-gray-500 py-4">Sin datos aún</p>'}
                </div>
            </div>
        </div>
    `;
}

// ============================================
// NAVEGACIÓN Y TABS
// ============================================

function renderTabContent(tabName) {
    const contentArea = document.getElementById('pomodoroContentArea');
    if (!contentArea) return;

    let html = '';

    switch (tabName) {
        case 'tasks':
            html = `
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white">📋 Mis Tareas Pomodoro</h3>
                        <button onclick="window.addPomodoroTask()" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-all active:scale-95">
                            <i class="fas fa-plus mr-2"></i>Nueva Tarea
                        </button>
                    </div>
                    <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p class="text-sm text-blue-800 dark:text-blue-300">
                            <i class="fas fa-info-circle mr-2"></i>
                            Selecciona una tarea haciendo clic en el checkbox antes de iniciar el temporizador
                        </p>
                    </div>
                    <div id="pomodoroTasksList" class="space-y-3">
                        <p class="text-center text-gray-400 dark:text-gray-500 py-8">
                            <i class="fas fa-tasks text-3xl mb-2"></i><br>
                            No hay tareas. ¡Crea una para empezar!
                        </p>
                    </div>
                </div>
            `;
            setTimeout(() => renderTasksList(), 0);
            break;

        case 'stats':
            html = renderStats();
            break;

        case 'settings':
            html = `
                <div class="space-y-4">
                    <!-- Configuración de tiempos -->
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white"><i class="fas fa-cog"></i> Configuración</h3>
                            <button onclick="window.savePomodoroSettings()" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-all active:scale-95">
                                <i class="fas fa-save mr-2"></i>Guardar Cambios
                            </button>
                        </div>
                        
                        <div class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tiempo de Enfoque (minutos)
                            </label>
                            <input type="number" value="${pomodoroConfig.focusDuration}" 
                                   onchange="window.updatePomodoroConfig('focusDuration', this.value)"
                                   class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Descanso Corto (minutos)
                            </label>
                            <input type="number" value="${pomodoroConfig.shortBreakDuration}"
                                   onchange="window.updatePomodoroConfig('shortBreakDuration', this.value)"
                                   class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Descanso Largo (minutos)
                            </label>
                            <input type="number" value="${pomodoroConfig.longBreakDuration}"
                                   onchange="window.updatePomodoroConfig('longBreakDuration', this.value)"
                                   class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        </div>

                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Sonidos</span>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" ${pomodoroConfig.soundEnabled ? 'checked' : ''}
                                       onchange="window.updatePomodoroConfig('soundEnabled', this.checked)"
                                       class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                            </label>
                        </div>

                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Notificaciones</span>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" ${pomodoroConfig.notificationsEnabled ? 'checked' : ''}
                                       onchange="window.updatePomodoroConfig('notificationsEnabled', this.checked)"
                                       class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                            </label>
                        </div>
                        </div>
                    </div>
                    
                    <!-- Categorías personalizadas -->
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white"><i class="fas fa-folder"></i> Categorías</h3>
                            <button onclick="window.openCategoryModal()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all active:scale-95">
                                <i class="fas fa-plus mr-2"></i>Nueva Categoría
                            </button>
                        </div>
                        <div class="space-y-2">
                            ${TASK_CATEGORIES.map(cat => `
                                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <span class="text-3xl ${cat.iconColor || 'text-gray-600'}"><i class="fas ${cat.icon}"></i></span>
                                        <div>
                                            <div class="font-medium text-gray-900 dark:text-white">${cat.name}</div>
                                            <div class="text-xs text-gray-500 dark:text-gray-400">${cat.custom ? 'Personalizada' : 'Predeterminada'}</div>
                                        </div>
                                    </div>
                                    ${cat.custom ? `
                                        <button onclick="window.deleteCategory('${cat.id}')" class="text-red-600 hover:text-red-700 px-3 py-1 rounded transition-colors">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'achievements':
            html = `
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Logros</h3>
                    <div class="grid grid-cols-2 gap-4">
                        ${ACHIEVEMENTS.map(achievement => {
                            const unlocked = state.unlockedAchievements?.includes(achievement.id) || false;
                            return `
                                <div class="p-4 rounded-xl border-2 ${unlocked ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 opacity-50'}">
                                    <div class="text-4xl mb-2 ${unlocked ? achievement.iconColor : 'text-gray-400'}"><i class="fas ${achievement.icon}"></i></div>
                                    <div class="font-bold text-sm text-gray-900 dark:text-white">${achievement.name}</div>
                                    <div class="text-xs text-gray-600 dark:text-gray-400">${achievement.description}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            break;
    }

    contentArea.innerHTML = html;
}

// Escuchar cambios de tab
window.addEventListener('pomodoroTabChange', (e) => {
    renderTabContent(e.detail.tab);
});

// Funciones globales para interacción desde el HTML
window.addPomodoroTask = function() {
    openTaskModal();
};

window.editPomodoroTask = function(taskId) {
    editPomodoroTask(taskId);
};

window.deletePomodoroTask = function(taskId) {
    deletePomodoroTask(taskId);
};

window.selectPomodoroTask = function(taskId) {
    selectPomodoroTask(taskId);
};

window.savePomodoroSettings = function() {
    savePomodoroConfig();
    
    // Aplicar cambios instantáneamente si el timer está detenido
    if (!pomodoroState.isRunning) {
        pomodoroState.timeRemaining = getDurationForMode(pomodoroState.currentMode);
        pomodoroState.totalTime = pomodoroState.timeRemaining;
        updatePomodoroDisplay();
    }
    
    showToast('Configuración guardada y aplicada', 'success');
};

window.updatePomodoroConfig = function(key, value) {
    if (key === 'soundEnabled' || key === 'notificationsEnabled' || key === 'autoStartBreaks' || key === 'autoStartPomodoros') {
        pomodoroConfig[key] = value;
    } else {
        pomodoroConfig[key] = parseInt(value) || pomodoroConfig[key];
    }
    savePomodoroConfig();
    
    // Aplicar cambios de duración instantáneamente si el timer está detenido
    if (!pomodoroState.isRunning && (key === 'focusDuration' || key === 'shortBreakDuration' || key === 'longBreakDuration')) {
        pomodoroState.timeRemaining = getDurationForMode(pomodoroState.currentMode);
        pomodoroState.totalTime = pomodoroState.timeRemaining;
        updatePomodoroDisplay();
    }
};

// Funciones para categorías personalizadas
window.openCategoryModal = function() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        // Limpiar formulario
        document.getElementById('categoryName').value = '';
        document.getElementById('categoryIcon').value = '';
        document.getElementById('categoryColor').value = 'blue';
    }
};

window.closeCategoryModal = function() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

window.saveCustomCategory = function(event) {
    if (event) event.preventDefault();
    
    const name = document.getElementById('categoryName')?.value.trim();
    const icon = document.getElementById('categoryIcon')?.value.trim();
    const color = document.getElementById('categoryColor')?.value || 'blue';
    
    if (!name || !icon) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }
    
    // Crear ID único
    const id = 'custom_' + Date.now();
    
    // Mapear color a iconColor de Tailwind
    const colorMap = {
        'red': 'text-red-600',
        'blue': 'text-blue-600',
        'green': 'text-green-600',
        'yellow': 'text-yellow-600',
        'purple': 'text-purple-600',
        'pink': 'text-pink-600',
        'orange': 'text-orange-600',
        'gray': 'text-gray-600'
    };
    
    // Agregar nueva categoría
    const newCategory = {
        id,
        name,
        icon,
        color,
        iconColor: colorMap[color] || 'text-gray-600',
        custom: true
    };
    
    TASK_CATEGORIES.push(newCategory);
    saveCustomCategories();
    
    // Actualizar select de categorías en el formulario de tareas
    updateCategorySelect();
    
    showToast(`Categoría "${name}" creada correctamente`, 'success');
    window.closeCategoryModal();
    
    // Re-renderizar tab de configuración si está activo
    renderTabContent('settings');
};

window.deleteCategory = function(categoryId) {
    if (!confirm('¿Eliminar esta categoría? Las tareas asociadas cambiarán a "Otro"')) return;
    
    // Encontrar índice
    const index = TASK_CATEGORIES.findIndex(c => c.id === categoryId);
    if (index === -1) return;
    
    // No permitir eliminar categorías predeterminadas
    if (!TASK_CATEGORIES[index].custom) {
        showToast('No se pueden eliminar categorías predeterminadas', 'error');
        return;
    }
    
    // Actualizar tareas que usen esta categoría
    if (state.pomodoroTasks) {
        state.pomodoroTasks.forEach(task => {
            if (task.category === categoryId) {
                task.category = 'other';
            }
        });
        savePomodoroTasks();
    }
    
    // Eliminar categoría
    TASK_CATEGORIES.splice(index, 1);
    saveCustomCategories();
    
    // Actualizar select
    updateCategorySelect();
    
    showToast('Categoría eliminada', 'success');
    renderTabContent('settings');
};

function updateCategorySelect() {
    const select = document.getElementById('pomodoroTaskCategory');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '';
    
    TASK_CATEGORIES.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
    });
    
    // Restaurar valor seleccionado si existe
    if (currentValue && TASK_CATEGORIES.find(c => c.id === currentValue)) {
        select.value = currentValue;
    }
}

// ============================================
// PANTALLA Y NAVEGACIÓN
// ============================================

export function showPomodoroScreen() {
    const dashboardScreen = document.getElementById('dashboardScreen');
    const pomodoroScreen = document.getElementById('pomodoroScreen');
    const bottomNavBar = document.getElementById('bottomNavBar');
    
    if (dashboardScreen && pomodoroScreen) {
        dashboardScreen.classList.add('hidden');
        pomodoroScreen.classList.remove('hidden');
        
        // Ocultar barra de navegación global
        if (bottomNavBar) bottomNavBar.classList.add('hidden');
        
        updatePomodoroDisplay();
        renderTabContent('tasks'); // Mostrar tab de tareas por defecto
    }
}

export function hidePomodoroScreen() {
    const dashboardScreen = document.getElementById('dashboardScreen');
    const pomodoroScreen = document.getElementById('pomodoroScreen');
    const bottomNavBar = document.getElementById('bottomNavBar');
    
    if (dashboardScreen && pomodoroScreen) {
        pomodoroScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        
        // Mostrar barra de navegación global
        if (bottomNavBar) bottomNavBar.classList.remove('hidden');
    }
}

// Exportar funciones necesarias
export { pomodoroConfig, pomodoroState };
