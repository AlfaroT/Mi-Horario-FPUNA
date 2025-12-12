/**
 * pomodoro.js - Módulo de Temporizador Pomodoro para Mi Horario FPUNA
 * Sistema de estudio con técnica Pomodoro (25 min trabajo, 5 min descanso)
 */

import { state } from './state.js';
import { showToast } from './utils.js';

// Configuración del Pomodoro
const POMODORO_CONFIG = {
    workDuration: 25 * 60, // 25 minutos en segundos
    shortBreak: 5 * 60,    // 5 minutos
    longBreak: 15 * 60,    // 15 minutos
    sessionsUntilLongBreak: 4
};

// Estado del Pomodoro
let pomodoroState = {
    isRunning: false,
    isPaused: false,
    currentMode: 'work', // 'work', 'shortBreak', 'longBreak'
    timeRemaining: POMODORO_CONFIG.workDuration,
    sessionsCompleted: 0,
    totalWorkTime: 0, // en segundos
    currentSubject: null,
    timerInterval: null,
    startTime: null
};

/**
 * Inicializa el módulo de Pomodoro
 */
export function initPomodoro() {
    loadPomodoroStats();
    setupPomodoroControls();
    updatePomodoroDisplay();
    console.log('[Pomodoro] Módulo inicializado');
}

/**
 * Configurar controles del Pomodoro
 */
function setupPomodoroControls() {
    const startBtn = document.getElementById('pomodoroStartBtn');
    const pauseBtn = document.getElementById('pomodoroPauseBtn');
    const resetBtn = document.getElementById('pomodoroResetBtn');
    const skipBtn = document.getElementById('pomodoroSkipBtn');

    if (startBtn) {
        startBtn.addEventListener('click', startPomodoro);
    }
    if (pauseBtn) {
        pauseBtn.addEventListener('click', togglePause);
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', resetPomodoro);
    }
    if (skipBtn) {
        skipBtn.addEventListener('click', skipSession);
    }
}

/**
 * Iniciar el Pomodoro
 */
export function startPomodoro() {
    if (pomodoroState.isRunning && !pomodoroState.isPaused) return;

    pomodoroState.isRunning = true;
    pomodoroState.isPaused = false;
    pomodoroState.startTime = Date.now();

    // Iniciar el temporizador
    pomodoroState.timerInterval = setInterval(() => {
        if (pomodoroState.timeRemaining > 0) {
            pomodoroState.timeRemaining--;
            updatePomodoroDisplay();
        } else {
            handleSessionComplete();
        }
    }, 1000);

    updatePomodoroButtons();
    showToast('Pomodoro iniciado - ¡A estudiar! 📚', 'success');
}

/**
 * Pausar/Reanudar el Pomodoro
 */
function togglePause() {
    if (!pomodoroState.isRunning) return;

    pomodoroState.isPaused = !pomodoroState.isPaused;

    if (pomodoroState.isPaused) {
        clearInterval(pomodoroState.timerInterval);
        showToast('Pomodoro en pausa ⏸️', 'info');
    } else {
        startPomodoro();
        showToast('Pomodoro reanudado ▶️', 'success');
    }

    updatePomodoroButtons();
}

/**
 * Reiniciar el Pomodoro
 */
function resetPomodoro() {
    clearInterval(pomodoroState.timerInterval);
    
    pomodoroState.isRunning = false;
    pomodoroState.isPaused = false;
    pomodoroState.currentMode = 'work';
    pomodoroState.timeRemaining = POMODORO_CONFIG.workDuration;

    updatePomodoroDisplay();
    updatePomodoroButtons();
    showToast('Pomodoro reiniciado 🔄', 'info');
}

/**
 * Saltar sesión actual
 */
function skipSession() {
    handleSessionComplete();
}

/**
 * Manejar la finalización de una sesión
 */
function handleSessionComplete() {
    clearInterval(pomodoroState.timerInterval);

    // Si completó una sesión de trabajo
    if (pomodoroState.currentMode === 'work') {
        pomodoroState.sessionsCompleted++;
        pomodoroState.totalWorkTime += POMODORO_CONFIG.workDuration;

        // Guardar estadísticas
        savePomodoroSession();

        // Determinar el siguiente modo
        if (pomodoroState.sessionsCompleted % POMODORO_CONFIG.sessionsUntilLongBreak === 0) {
            pomodoroState.currentMode = 'longBreak';
            pomodoroState.timeRemaining = POMODORO_CONFIG.longBreak;
            showToast('¡Sesión completada! Toma un descanso largo 🎉', 'success');
            playNotificationSound();
        } else {
            pomodoroState.currentMode = 'shortBreak';
            pomodoroState.timeRemaining = POMODORO_CONFIG.shortBreak;
            showToast('¡Sesión completada! Toma un descanso corto ☕', 'success');
            playNotificationSound();
        }
    } else {
        // Completó un descanso
        pomodoroState.currentMode = 'work';
        pomodoroState.timeRemaining = POMODORO_CONFIG.workDuration;
        showToast('¡Descanso terminado! A estudiar de nuevo 💪', 'info');
    }

    pomodoroState.isRunning = false;
    pomodoroState.isPaused = false;
    updatePomodoroDisplay();
    updatePomodoroButtons();
}

/**
 * Guardar sesión de Pomodoro completada
 */
function savePomodoroSession() {
    if (!state.pomodoroSessions) {
        state.pomodoroSessions = [];
    }

    const session = {
        id: 'pomodoro_' + Date.now(),
        date: new Date().toISOString(),
        duration: POMODORO_CONFIG.workDuration,
        subject: pomodoroState.currentSubject,
        completed: true
    };

    state.pomodoroSessions.push(session);
    localStorage.setItem('fpuna_pomodoro_sessions', JSON.stringify(state.pomodoroSessions));
}

/**
 * Cargar estadísticas de Pomodoro
 */
function loadPomodoroStats() {
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
}

/**
 * Actualizar la visualización del temporizador
 */
function updatePomodoroDisplay() {
    const timerDisplay = document.getElementById('pomodoroTimer');
    const modeDisplay = document.getElementById('pomodoroMode');
    const sessionCounter = document.getElementById('pomodoroSessions');
    const progressBar = document.getElementById('pomodoroProgress');

    if (timerDisplay) {
        const minutes = Math.floor(pomodoroState.timeRemaining / 60);
        const seconds = pomodoroState.timeRemaining % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    if (modeDisplay) {
        const modeTexts = {
            work: '💼 Sesión de Estudio',
            shortBreak: '☕ Descanso Corto',
            longBreak: '🎉 Descanso Largo'
        };
        modeDisplay.textContent = modeTexts[pomodoroState.currentMode];
        
        // Cambiar color según el modo
        modeDisplay.className = pomodoroState.currentMode === 'work' 
            ? 'text-blue-600 dark:text-blue-400 font-semibold'
            : 'text-green-600 dark:text-green-400 font-semibold';
    }

    if (sessionCounter) {
        sessionCounter.textContent = `Sesiones completadas: ${pomodoroState.sessionsCompleted}`;
    }

    if (progressBar) {
        const totalDuration = pomodoroState.currentMode === 'work' 
            ? POMODORO_CONFIG.workDuration
            : pomodoroState.currentMode === 'shortBreak'
            ? POMODORO_CONFIG.shortBreak
            : POMODORO_CONFIG.longBreak;
        
        const progress = ((totalDuration - pomodoroState.timeRemaining) / totalDuration) * 100;
        progressBar.style.width = `${progress}%`;
    }
}

/**
 * Actualizar botones del Pomodoro
 */
function updatePomodoroButtons() {
    const startBtn = document.getElementById('pomodoroStartBtn');
    const pauseBtn = document.getElementById('pomodoroPauseBtn');

    if (startBtn) {
        startBtn.disabled = pomodoroState.isRunning && !pomodoroState.isPaused;
        startBtn.classList.toggle('opacity-50', pomodoroState.isRunning && !pomodoroState.isPaused);
    }

    if (pauseBtn) {
        pauseBtn.textContent = pomodoroState.isPaused ? 'Reanudar' : 'Pausar';
        pauseBtn.disabled = !pomodoroState.isRunning;
        pauseBtn.classList.toggle('opacity-50', !pomodoroState.isRunning);
    }
}

/**
 * Reproducir sonido de notificación
 */
function playNotificationSound() {
    // Usar Web Audio API para crear un sonido simple
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('[Pomodoro] Audio no disponible');
    }
}

/**
 * Obtener estadísticas de Pomodoro
 */
export function getPomodoroStats() {
    const sessions = state.pomodoroSessions || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = sessions.filter(s => {
        const sessionDate = new Date(s.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === today.getTime();
    });

    const thisWeek = sessions.filter(s => {
        const sessionDate = new Date(s.date);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sessionDate >= weekAgo;
    });

    return {
        total: sessions.length,
        today: todaySessions.length,
        thisWeek: thisWeek.length,
        totalMinutes: Math.floor((sessions.length * POMODORO_CONFIG.workDuration) / 60),
        todayMinutes: Math.floor((todaySessions.length * POMODORO_CONFIG.workDuration) / 60)
    };
}
