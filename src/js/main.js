import { state } from './state.js';
import { dom } from './dom.js';
import { processSheetData, transformDataToSchedule } from './parser.js';
import { loadUserTasks, cleanupOldCompletedTasks, saveTask, deleteTask, toggleTaskComplete } from './tasks.js';
import { 
    showSetup, 
    showDashboard, 
    showWelcomeScreen,
    initTheme, 
    toggleTheme, 
    saveToLocalStorage, 
    loadFromLocalStorage, 
    exportToJSON, 
    importFromJSON, 
    handleReset, 
    confirmReset,
    renderDashboard,
    initMetricCards
} from './ui.js';
import { populateSemestres, applyFilters } from './filters.js';
import { showToast, hideError, showLoading, hideLoading, showError } from './utils.js';
import { initCalendar, showCalendar, hideCalendar } from './calendar.js';
import { initShare, showShareModal } from './share.js';
import { initPomodoro, showPomodoroScreen, hidePomodoroScreen } from './pomodoro-advanced.js';
import { initStatistics, showStatistics, hideStatistics, exportStatistics } from './statistics.js';

// Variable global para el prompt de instalación de PWA
window.deferredPrompt = null;

// ============================================
// CALCULADORA DE NOTA FINAL FPUNA
// ============================================

function calculateFinalGrade(pp, ef) {
    // Validar inputs
    if (pp < 0 || pp > 100 || ef < 0 || ef > 100) {
        return { error: 'Los valores deben estar entre 0 y 100' };
    }
    
    // Calcular puntuación final
    const pf = (0.4 * pp) + (0.6 * ef);
    const pfRedondeado = Math.round(pf);
    
    // Verificar condición de aprobación del examen final
    if (ef < 50) {
        return {
            pf: pfRedondeado,
            nota: 1,
            calificacion: 'Reprobado',
            reprobadoPorEF: true,
            mensaje: 'Reprobado por no alcanzar el 50% en el Examen Final'
        };
    }
    
    // Tabla de conversión según reglamento FPUNA
    let nota, calificacion;
    if (pfRedondeado >= 90) {
        nota = 5;
        calificacion = 'Excelente';
    } else if (pfRedondeado >= 80) {
        nota = 4;
        calificacion = 'Muy Bueno';
    } else if (pfRedondeado >= 70) {
        nota = 3;
        calificacion = 'Bueno';
    } else if (pfRedondeado >= 60) {
        nota = 2;
        calificacion = 'Regular';
    } else {
        nota = 1;
        calificacion = 'Reprobado';
    }
    
    return {
        pf: pfRedondeado,
        nota,
        calificacion,
        reprobadoPorEF: false
    };
}

function openGradeCalculator() {
    dom.gradeCalculatorModal.classList.remove('hidden');
    dom.gradeCalculatorModal.classList.add('flex');
    dom.ppInput.value = '';
    dom.efInput.value = '';
    dom.gradeResult.innerHTML = `
        <div class="text-center text-gray-500 dark:text-gray-400">
            <i class="fas fa-calculator text-4xl mb-2 opacity-50"></i>
            <p class="text-sm">Ingresa los valores y calcula</p>
        </div>
    `;

    // Limpiar clases de validación
    [dom.ppInput, dom.efInput].forEach(input => {
        input.classList.remove('border-red-500', 'border-green-500');
    });

    // Inicializar validación
    initGradeCalculatorValidation();
}

function initQuickExamples() {
    const quickButtons = document.querySelectorAll('.quick-example-btn');
    quickButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que el evento se propague al modal
            const pp = button.dataset.pp;
            const ef = button.dataset.ef;

            dom.ppInput.value = pp;
            dom.efInput.value = ef;

            // Auto-calcular después de un breve delay
            setTimeout(() => {
                performGradeCalculation();
            }, 300);
        });
    });
}

function initGradeCalculatorValidation() {
    // Validación en tiempo real para los inputs
    [dom.ppInput, dom.efInput].forEach(input => {
        input.addEventListener('input', () => {
            const value = parseFloat(input.value);
            const isValid = !isNaN(value) && value >= 0 && value <= 100;

            if (input.value === '') {
                input.classList.remove('border-red-500', 'border-green-500');
                return;
            }

            if (isValid) {
                input.classList.remove('border-red-500');
                input.classList.add('border-green-500');
            } else {
                input.classList.remove('border-green-500');
                input.classList.add('border-red-500');
            }
        });

        // Calcular automáticamente cuando se presiona Enter
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.stopPropagation();
                performGradeCalculation();
            }
        });
    });
}

function performGradeCalculation() {
    const pp = parseFloat(dom.ppInput.value);
    const ef = parseFloat(dom.efInput.value);
    const resultDiv = document.getElementById('gradeResult');

    if (isNaN(pp) || isNaN(ef)) {
        resultDiv.innerHTML = `
            <div class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg animate-fade-in">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle mr-3 text-red-500"></i>
                    <div>
                        <p class="font-semibold">Campos requeridos</p>
                        <p class="text-sm">Por favor ingresa valores válidos en ambos campos</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    const result = calculateFinalGrade(pp, ef);

    if (result.error) {
        resultDiv.innerHTML = `
            <div class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg animate-fade-in">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle mr-3 text-red-500"></i>
                    <div>
                        <p class="font-semibold">Error de validación</p>
                        <p class="text-sm">${result.error}</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Determinar colores según el resultado
    const notaColor = result.nota >= 3 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const bgColor = result.nota >= 3 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    const icon = result.nota >= 3 ? 'fas fa-check-circle' : 'fas fa-times-circle';

    resultDiv.innerHTML = `
        <div class="animate-fade-in ${bgColor} border rounded-xl p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
            <!-- Header del resultado -->
            <div class="text-center">
                <div class="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 ${notaColor} bg-white dark:bg-gray-800 rounded-full mb-3 sm:mb-4 shadow-lg">
                    <i class="${icon} text-lg sm:text-xl lg:text-2xl"></i>
                </div>
                <h4 class="text-lg sm:text-xl font-bold ${notaColor} mb-2">${result.calificacion}</h4>
                <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Nota final obtenida</p>
            </div>

            <!-- Métricas principales -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 w-full">
                <div class="text-center p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div class="text-xl sm:text-2xl font-bold ${notaColor}">${result.pf}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Puntuación</div>
                </div>
                <div class="text-center p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div class="text-xl sm:text-2xl font-bold ${notaColor}">${result.nota}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Nota</div>
                </div>
                <div class="text-center p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div class="text-sm sm:text-lg font-bold ${notaColor}">${result.calificacion}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Estado</div>
                </div>
            </div>

            <!-- Detalles del cálculo -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 w-full max-w-full overflow-hidden">
                <h5 class="font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                    <i class="fas fa-equation text-blue-600 mr-2 text-sm sm:text-base flex-shrink-0"></i>
                    <span class="truncate">Detalle del cálculo</span>
                </h5>
                <div class="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <div class="flex justify-between gap-2">
                        <span class="text-gray-600 dark:text-gray-400 flex-shrink-0">PP (40%):</span>
                        <span class="font-mono truncate">${pp} × 0.4 = ${(pp * 0.4).toFixed(1)}</span>
                    </div>
                    <div class="flex justify-between gap-2">
                        <span class="text-gray-600 dark:text-gray-400 flex-shrink-0">EF (60%):</span>
                        <span class="font-mono truncate">${ef} × 0.6 = ${(ef * 0.6).toFixed(1)}</span>
                    </div>
                    <hr class="border-gray-200 dark:border-gray-700">
                    <div class="flex justify-between gap-2 font-semibold">
                        <span class="text-gray-900 dark:text-white flex-shrink-0">Total:</span>
                        <span class="font-mono ${notaColor} truncate">${result.pf} puntos</span>
                    </div>
                </div>
            </div>

            ${result.reprobadoPorEF ? `
                <div class="w-full bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-2 sm:px-3 py-2 rounded-lg text-center font-semibold overflow-hidden">
                    <div class="flex items-center justify-center gap-2 min-w-0">
                        <i class="fas fa-times-circle flex-shrink-0 text-xs sm:text-sm"></i>
                        <span class="truncate text-xs sm:text-sm">${result.mensaje}</span>
                    </div>
                </div>
            ` : result.nota >= 3 ? `
                <div class="w-full max-w-full overflow-hidden bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-center font-semibold">
                    <div class="flex items-center justify-center w-full min-w-0">
                        <i class="fas fa-check-circle mr-2 flex-shrink-0 text-sm sm:text-base"></i>
                        <span class="truncate text-xs sm:text-sm">¡Felicitaciones! Has aprobado la materia</span>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function openTaskModal(taskId = null) {
    const modal = dom.taskModal;
    const title = dom.taskModalTitle;
    
    if (taskId) {
        // Modo edición
        const task = state.userTasks.find(t => t.id === taskId);
        if (task) {
            title.textContent = 'Editar Tarea';
            dom.taskTitle.value = task.titulo;
            dom.taskDescription.value = task.descripcion || '';
            dom.taskDate.value = task.fecha;
            dom.taskTime.value = task.hora || '';
            dom.taskId.value = taskId;
        }
    } else {
        // Modo crear nueva
        title.textContent = 'Nueva Tarea';
        dom.taskTitle.value = '';
        dom.taskDescription.value = '';
        dom.taskDate.value = '';
        dom.taskTime.value = '';
        dom.taskId.value = '';
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeTaskModal() {
    const modal = dom.taskModal;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// ============================================
// INICIALIZACIÓN
// ============================================

async function init() {
    // Inicializar tema antes que nada (para evitar flash)
    initTheme();
    
    // Inicializar clicks en tarjetas métricas
    initMetricCards();
    
    // Cargar tareas del usuario
    loadUserTasks();
    
    // Limpieza automática de tareas antiguas (>7 días)
    cleanupOldCompletedTasks();
    
    // Inicializar calendario
    initCalendar();
    
    // Inicializar Pomodoro
    initPomodoro();
    
    // Inicializar Estadísticas
    initStatistics();
    
    // Inicializar módulo de compartir y verificar datos en URL
    // initShare() espera a que las librerías carguen antes de verificar URL
    const hasSharedData = await initShare();
    
    // Verificar si hay datos guardados
    if (!hasSharedData) {
        if (localStorage.getItem('userName')) {
            if (loadFromLocalStorage()) {
                showDashboard();
            } else {
                showSetup();
            }
        } else {
            showWelcomeScreen();
        }
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Mi Horario FPUNA v5.5 - REFACTORIZADO  ');
    console.log('═══════════════════════════════════════════════════════');
    
    // Ocultar loader cuando la app esté completamente lista
    setTimeout(() => {
        const loader = document.getElementById('appLoader');
        if (loader) {
            loader.classList.add('loaded');
            setTimeout(() => loader.remove(), 500);
        }
    }, 100);
}

// ============================================
// EVENT HANDLERS
// ============================================

// Función para inicializar event listeners
function initEventListeners() {
    dom.welcomeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userName = dom.userNameInput.value.trim();
        if (userName) {
            localStorage.setItem('userName', userName);
            showSetup();
        }
    });

    dom.fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        hideError();
        showLoading();
        
        try {
            const data = await file.arrayBuffer();
            state.workbook = XLSX.read(data, { type: 'array' });
            
            // Poblar select de carreras
            dom.carreraSelect.innerHTML = '<option value="">-- Selecciona una carrera --</option>';
            state.workbook.SheetNames.forEach(sheetName => {
                const option = document.createElement('option');
                option.value = sheetName;
                option.textContent = sheetName;
                dom.carreraSelect.appendChild(option);
            });
            
            // Mostrar siguiente paso
            dom.step2.classList.remove('hidden');
            hideLoading();
            
        } catch (error) {
            hideLoading();
            showError('Error al cargar el archivo. Asegúrate de que sea un archivo Excel válido.');
            console.error('Error:', error);
        }
    });

    dom.carreraSelect.addEventListener('change', (e) => {
        const sheetName = e.target.value;
        if (!sheetName) return;
        
        showLoading();
        
        try {
            // Asegurar que config existe
            if (!state.config) {
                state.config = {};
            }
            state.config.carrera = sheetName;
            processSheetData(sheetName);
            transformDataToSchedule();
            
            // Mostrar paso 3 y poblar semestres
            populateSemestres();
            dom.step3.classList.remove('hidden');
            
            hideLoading();
            showToast('Carrera cargada correctamente', 'success');
            
        } catch (error) {
            hideLoading();
            showError('Error al procesar la hoja seleccionada: ' + error.message);
            console.error('Error:', error);
        }
    });

    dom.saveConfigBtn.addEventListener('click', () => {
        showLoading();
        
        try {
            // Aplicar filtros basados en las selecciones
            applyFilters();
            
            // Guardar en localStorage
            saveToLocalStorage();
            
            hideLoading();
            showDashboard();
            showToast(`Horario generado: ${state.clases.length} clases encontradas`, 'success');
            
        } catch (error) {
            hideLoading();
            showError('Error al generar el horario.');
            console.error('Error:', error);
        }
    });

    if (dom.settingsBtn) {
        dom.settingsBtn.addEventListener('click', () => {
            updateNavButtons('settingsBtn');
            hideAllScreens();
            if (dom.settingsScreen) {
                dom.settingsScreen.classList.remove('hidden');
                // Cargar valores actuales
                const userName = localStorage.getItem('userName') || '';
                const userNameInput = document.getElementById('userNameSettingInput');
                if (userNameInput) userNameInput.value = userName;
                
                const darkModeToggle = document.getElementById('darkModeToggleSetting');
                if (darkModeToggle) {
                    darkModeToggle.checked = document.documentElement.classList.contains('dark');
                }
            }
        });
    }

    // Listeners de la pantalla de ajustes
    const userNameSettingInput = document.getElementById('userNameSettingInput');
    if (userNameSettingInput) {
        userNameSettingInput.addEventListener('change', (e) => {
            localStorage.setItem('userName', e.target.value);
            showToast('Nombre actualizado', 'success');
        });
    }

    const darkModeToggleSetting = document.getElementById('darkModeToggleSetting');
    if (darkModeToggleSetting) {
        darkModeToggleSetting.addEventListener('change', toggleTheme);
    }

    const modifyFiltersSettingBtn = document.getElementById('modifyFiltersSettingBtn');
    if (modifyFiltersSettingBtn) {
        modifyFiltersSettingBtn.addEventListener('click', () => {
            hideAllScreens();
            showSetup(true); // Pasar true para ir directamente a modificar filtros
        });
    }

    const resetSettingBtn = document.getElementById('resetSettingBtn');
    if (resetSettingBtn) {
        resetSettingBtn.addEventListener('click', handleReset);
    }

    const installAppBtn = document.getElementById('installAppBtn');
    const installTutorialModal = document.getElementById('installTutorialModal');
    const closeInstallTutorialBtn = document.getElementById('closeInstallTutorialBtn');
    const installTutorialContent = document.getElementById('installTutorialContent');

    if (installAppBtn && installTutorialModal && installTutorialContent) {
        installAppBtn.addEventListener('click', () => {
            // Detectar plataforma y navegador
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
            const isAndroid = /android/i.test(userAgent);
            const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
            const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
            const isEdge = /Edg/.test(userAgent);
            const isFirefox = /Firefox/.test(userAgent);
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

            // Si ya está instalada
            if (isStandalone) {
                installTutorialContent.innerHTML = `
                    <div class="text-center py-6">
                        <i class="fas fa-check-circle text-green-500 text-6xl mb-4"></i>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">¡App Ya Instalada!</h3>
                        <p class="text-gray-600 dark:text-gray-400">La aplicación ya está instalada en tu dispositivo.</p>
                    </div>
                `;
                installTutorialModal.classList.remove('hidden');
                installTutorialModal.classList.add('flex');
                return;
            }

            // Si hay prompt nativo disponible (Android Chrome/Edge)
            if (window.deferredPrompt) {
                // Mostrar opciones al usuario en lugar de instalar automáticamente
                showInstallOptions(isIOS, isAndroid, isSafari, isChrome, isEdge, isFirefox);
            } else {
                // Mostrar tutorial manual
                showInstallTutorial(isIOS, isAndroid, isSafari, isChrome, isEdge, isFirefox);
            }
        });

        // Cerrar modal
        if (closeInstallTutorialBtn) {
            closeInstallTutorialBtn.addEventListener('click', () => {
                installTutorialModal.classList.add('hidden');
                installTutorialModal.classList.remove('flex');
            });
        }

        // Cerrar al hacer clic fuera
        installTutorialModal.addEventListener('click', (e) => {
            if (e.target === installTutorialModal) {
                installTutorialModal.classList.add('hidden');
                installTutorialModal.classList.remove('flex');
            }
        });
    }

    function showInstallOptions(isIOS, isAndroid, isSafari, isChrome, isEdge, isFirefox) {
        const optionsHTML = `
            <div class="space-y-4">
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div class="flex items-center justify-center mb-4">
                        <i class="fas fa-download text-4xl text-blue-600 dark:text-blue-400"></i>
                    </div>
                    <h3 class="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">Instalar Aplicación</h3>
                    <p class="text-center text-gray-600 dark:text-gray-400 text-sm mb-4">
                        Elige cómo quieres instalar Horario FPUNA en tu dispositivo
                    </p>
                </div>

                <div class="space-y-3">
                    <button id="installAutoBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-between group">
                        <div class="flex items-center">
                            <i class="fas fa-bolt text-2xl mr-3"></i>
                            <div class="text-left">
                                <div class="font-bold">Instalación Rápida</div>
                                <div class="text-xs opacity-90">Instalar automáticamente (recomendado)</div>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right group-hover:translate-x-1 transition-transform"></i>
                    </button>

                    <button id="installManualBtn" class="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-4 px-6 rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
                        <div class="flex items-center">
                            <i class="fas fa-book-open text-2xl mr-3 text-gray-600 dark:text-gray-300"></i>
                            <div class="text-left">
                                <div class="font-bold">Ver Tutorial Manual</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">Instrucciones paso a paso</div>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right group-hover:translate-x-1 transition-transform"></i>
                    </button>
                </div>

                <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 mt-4">
                    <div class="flex items-start">
                        <i class="fas fa-info-circle text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5"></i>
                        <p class="text-xs text-yellow-800 dark:text-yellow-300">
                            La instalación rápida usa la función nativa de tu navegador para instalar la app con un solo clic.
                        </p>
                    </div>
                </div>
            </div>
        `;

        installTutorialContent.innerHTML = optionsHTML;
        installTutorialModal.classList.remove('hidden');
        installTutorialModal.classList.add('flex');

        // Event listeners para los botones
        const installAutoBtn = document.getElementById('installAutoBtn');
        const installManualBtn = document.getElementById('installManualBtn');

        if (installAutoBtn) {
            installAutoBtn.addEventListener('click', () => {
                if (window.deferredPrompt) {
                    window.deferredPrompt.prompt();
                    window.deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            showToast('¡App instalada correctamente!', 'success');
                            installTutorialModal.classList.add('hidden');
                            installTutorialModal.classList.remove('flex');
                        } else {
                            // Si el usuario cancela, mostrar tutorial manual
                            showInstallTutorial(isIOS, isAndroid, isSafari, isChrome, isEdge, isFirefox);
                        }
                        window.deferredPrompt = null;
                    });
                }
            });
        }

        if (installManualBtn) {
            installManualBtn.addEventListener('click', () => {
                showInstallTutorial(isIOS, isAndroid, isSafari, isChrome, isEdge, isFirefox);
            });
        }
    }

    function showInstallTutorial(isIOS, isAndroid, isSafari, isChrome, isEdge, isFirefox) {
        let tutorialHTML = '';

        if (isIOS && isSafari) {
            // Tutorial para iOS Safari
            tutorialHTML = `
                <div class="space-y-4">
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div class="flex items-center mb-2">
                            <i class="fab fa-apple text-2xl mr-2"></i>
                            <h3 class="font-bold text-gray-900 dark:text-white">iOS (iPhone/iPad)</h3>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Estás usando Safari en iOS</p>
                    </div>

                    <div class="space-y-3">
                        <div class="flex items-start">
                            <div class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                                <span class="font-bold">1</span>
                            </div>
                            <div>
                                <p class="text-gray-900 dark:text-white font-medium">Toca el botón de compartir</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Busca el ícono <i class="fas fa-share text-blue-600"></i> en la barra inferior de Safari</p>
                            </div>
                        </div>

                        <div class="flex items-start">
                            <div class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                                <span class="font-bold">2</span>
                            </div>
                            <div>
                                <p class="text-gray-900 dark:text-white font-medium">Selecciona "Agregar a pantalla de inicio"</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Desplázate y busca <i class="fas fa-plus-square text-blue-600"></i> "Agregar a pantalla de inicio"</p>
                            </div>
                        </div>

                        <div class="flex items-start">
                            <div class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                                <span class="font-bold">3</span>
                            </div>
                            <div>
                                <p class="text-gray-900 dark:text-white font-medium">Confirma la instalación</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Toca "Agregar" en la esquina superior derecha</p>
                            </div>
                        </div>

                        <div class="flex items-start">
                            <div class="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                                <i class="fas fa-check"></i>
                            </div>
                            <div>
                                <p class="text-gray-900 dark:text-white font-medium">¡Listo!</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">La app aparecerá en tu pantalla de inicio</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 mt-4">
                        <p class="text-sm text-yellow-800 dark:text-yellow-400">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            <strong>Importante:</strong> Solo Safari en iOS soporta instalación de PWAs. Chrome/Firefox en iOS no lo permiten.
                        </p>
                    </div>
                </div>
            `;
        } else if (isIOS && !isSafari) {
            // iOS con otro navegador
            tutorialHTML = `
                <div class="space-y-4">
                    <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-exclamation-circle text-2xl mr-2 text-red-600"></i>
                            <h3 class="font-bold text-gray-900 dark:text-white">Navegador no compatible</h3>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Estás usando un navegador que no soporta instalación en iOS</p>
                    </div>

                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 class="font-bold text-gray-900 dark:text-white mb-2">
                            <i class="fab fa-safari mr-2"></i>
                            Usa Safari para instalar
                        </h4>
                        <ol class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li>1. Abre Safari en tu iPhone/iPad</li>
                            <li>2. Visita esta página en Safari</li>
                            <li>3. Toca <i class="fas fa-share text-blue-600"></i> y selecciona "Agregar a pantalla de inicio"</li>
                        </ol>
                    </div>

                    <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
                        Puedes copiar esta URL y pegarla en Safari
                    </p>
                </div>
            `;
        } else if (isAndroid && (isChrome || isEdge)) {
            // Android Chrome/Edge
            tutorialHTML = `
                <div class="space-y-4">
                    <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <div class="flex items-center mb-2">
                            <i class="fab fa-android text-2xl mr-2 text-green-600"></i>
                            <h3 class="font-bold text-gray-900 dark:text-white">Android - ${isChrome ? 'Chrome' : 'Edge'}</h3>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Tu navegador soporta instalación automática</p>
                    </div>

                    <div class="space-y-3">
                        <div class="flex items-start">
                            <div class="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                                <span class="font-bold">1</span>
                            </div>
                            <div>
                                <p class="text-gray-900 dark:text-white font-medium">Toca el menú de ${isChrome ? 'Chrome' : 'Edge'}</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Los 3 puntos <i class="fas fa-ellipsis-v"></i> en la esquina superior derecha</p>
                            </div>
                        </div>

                        <div class="flex items-start">
                            <div class="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                                <span class="font-bold">2</span>
                            </div>
                            <div>
                                <p class="text-gray-900 dark:text-white font-medium">Selecciona "Instalar app" o "Agregar a pantalla de inicio"</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Busca la opción <i class="fas fa-plus-square text-green-600"></i> con el nombre de la app</p>
                            </div>
                        </div>

                        <div class="flex items-start">
                            <div class="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                                <span class="font-bold">3</span>
                            </div>
                            <div>
                                <p class="text-gray-900 dark:text-white font-medium">Confirma la instalación</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Toca "Instalar" en el diálogo que aparece</p>
                            </div>
                        </div>

                        <div class="flex items-start">
                            <div class="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                                <i class="fas fa-check"></i>
                            </div>
                            <div>
                                <p class="text-gray-900 dark:text-white font-medium">¡Listo!</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">La app se agregará a tu pantalla de inicio y cajón de apps</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
                        <p class="text-sm text-blue-800 dark:text-blue-400">
                            <i class="fas fa-info-circle mr-2"></i>
                            También puedes buscar un banner de instalación en la parte superior de la página.
                        </p>
                    </div>
                </div>
            `;
        } else if (isAndroid && isFirefox) {
            // Android Firefox
            tutorialHTML = `
                <div class="space-y-4">
                    <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div class="flex items-center mb-2">
                            <i class="fab fa-firefox text-2xl mr-2 text-orange-600"></i>
                            <h3 class="font-bold text-gray-900 dark:text-white">Android - Firefox</h3>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Firefox soporta instalación con algunos pasos adicionales</p>
                    </div>

                    <div class="space-y-3">
                        <div class="flex items-start">
                            <div class="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                                <span class="font-bold">1</span>
                            </div>
                            <div>
                                <p class="text-gray-900 dark:text-white font-medium">Toca el menú de Firefox</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Los 3 puntos <i class="fas fa-ellipsis-v"></i> en la esquina superior derecha</p>
                            </div>
                        </div>

                        <div class="flex items-start">
                            <div class="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                                <span class="font-bold">2</span>
                            </div>
                            <div>
                                <p class="text-gray-900 dark:text-white font-medium">Busca el ícono de instalación</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Debe aparecer un ícono <i class="fas fa-plus text-orange-600"></i> junto a "Instalar"</p>
                            </div>
                        </div>

                        <div class="flex items-start">
                            <div class="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                                <span class="font-bold">3</span>
                            </div>
                            <div>
                                <p class="text-gray-900 dark:text-white font-medium">Toca "Instalar"</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Confirma para agregar a la pantalla de inicio</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
                        <h4 class="font-bold text-gray-900 dark:text-white mb-2">Recomendación</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            Para mejor experiencia, considera usar Chrome o Edge en Android, que tienen mejor soporte para PWAs.
                        </p>
                    </div>
                </div>
            `;
        } else if (isAndroid) {
            // Android otro navegador
            tutorialHTML = `
                <div class="space-y-4">
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div class="flex items-center mb-2">
                            <i class="fab fa-android text-2xl mr-2"></i>
                            <h3 class="font-bold text-gray-900 dark:text-white">Android - Navegador alternativo</h3>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Tu navegador puede tener soporte limitado para PWAs</p>
                    </div>

                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 class="font-bold text-gray-900 dark:text-white mb-2">
                            <i class="fas fa-lightbulb mr-2"></i>
                            Recomendación
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Para instalar la app en Android, usa uno de estos navegadores:
                        </p>
                        <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li><i class="fab fa-chrome text-blue-600 mr-2"></i> Google Chrome (Recomendado)</li>
                            <li><i class="fab fa-edge text-blue-500 mr-2"></i> Microsoft Edge</li>
                            <li><i class="fab fa-firefox text-orange-600 mr-2"></i> Firefox (soporte básico)</li>
                        </ul>
                    </div>

                    <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
                        Abre esta página en Chrome o Edge para instalar la app
                    </p>
                </div>
            `;
        } else {
            // Escritorio u otro dispositivo
            tutorialHTML = `
                <div class="space-y-4">
                    <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-desktop text-2xl mr-2 text-purple-600"></i>
                            <h3 class="font-bold text-gray-900 dark:text-white">Instalación en Escritorio</h3>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Puedes instalar esta app en tu computadora</p>
                    </div>

                    <div class="space-y-3">
                        <div class="flex items-start">
                            <div class="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                                <span class="font-bold">1</span>
                            </div>
                            <div>
                                <p class="text-gray-900 dark:text-white font-medium">Busca el ícono de instalación</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">En la barra de direcciones, lado derecho <i class="fas fa-plus-square text-purple-600"></i></p>
                            </div>
                        </div>

                        <div class="flex items-start">
                            <div class="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                                <span class="font-bold">2</span>
                            </div>
                            <div>
                                <p class="text-gray-900 dark:text-white font-medium">Haz clic en "Instalar"</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">O usa el menú <i class="fas fa-ellipsis-v"></i> → "Instalar Mi Horario FPUNA"</p>
                            </div>
                        </div>

                        <div class="flex items-start">
                            <div class="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                                <i class="fas fa-check"></i>
                            </div>
                            <div>
                                <p class="text-gray-900 dark:text-white font-medium">¡Listo!</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">La app se abrirá en su propia ventana</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
                        <h4 class="font-bold text-gray-900 dark:text-white mb-2">Navegadores compatibles</h4>
                        <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <li><i class="fab fa-chrome text-blue-600 mr-2"></i> Google Chrome</li>
                            <li><i class="fab fa-edge text-blue-500 mr-2"></i> Microsoft Edge</li>
                            <li><i class="fas fa-globe text-purple-600 mr-2"></i> Brave, Opera, Vivaldi</li>
                        </ul>
                    </div>
                </div>
            `;
        }

        installTutorialContent.innerHTML = tutorialHTML;
        installTutorialModal.classList.remove('hidden');
        installTutorialModal.classList.add('flex');
    }

    if (dom.closeSettingsBtn) {
        dom.closeSettingsBtn.addEventListener('click', () => {
            if (dom.settingsModal) {
                dom.settingsModal.classList.add('hidden');
                dom.settingsModal.classList.remove('flex');
            }
        });
    }

    if (dom.settingsModal) {
        dom.settingsModal.addEventListener('click', (e) => {
            if (e.target === dom.settingsModal) {
                dom.settingsModal.classList.add('hidden');
                dom.settingsModal.classList.remove('flex');
            }
        });
    }

    if (dom.modifyFiltersBtn) {
        dom.modifyFiltersBtn.addEventListener('click', () => {
            if (dom.settingsModal) {
                dom.settingsModal.classList.add('hidden');
                dom.settingsModal.classList.remove('flex');
            }
            showSetup(true);
        });
    }

    if (dom.exportBtn) {
        dom.exportBtn.addEventListener('click', () => {
            exportToJSON();
        });
    }

    if (dom.importInput) {
        dom.importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importFromJSON(file);
                if (dom.settingsModal) {
                    dom.settingsModal.classList.add('hidden');
                    dom.settingsModal.classList.remove('flex');
                }
            }
        });
    }

    if (dom.resetBtn) {
        dom.resetBtn.addEventListener('click', () => {
            handleReset();
        });
    }

    if (dom.confirmResetBtn) {
        dom.confirmResetBtn.addEventListener('click', () => {
            confirmReset();
        });
    }

    if (dom.cancelResetBtn) {
        dom.cancelResetBtn.addEventListener('click', () => {
            if (dom.confirmModal) {
                dom.confirmModal.classList.add('hidden');
                dom.confirmModal.classList.remove('flex');
            }
        });
    }

    if (dom.confirmModal) {
        dom.confirmModal.addEventListener('click', (e) => {
            if (e.target === dom.confirmModal) {
                dom.confirmModal.classList.add('hidden');
                dom.confirmModal.classList.remove('flex');
            }
        });
    }

    if (dom.gradeCalculatorBtn) {
        dom.gradeCalculatorBtn.addEventListener('click', openGradeCalculator);
    }
    
    // Botón volver desde Calculadora
    const backToDashboardFromCalculatorBtn = document.getElementById('backToDashboardFromCalculatorBtn');
    if (backToDashboardFromCalculatorBtn) {
        backToDashboardFromCalculatorBtn.addEventListener('click', () => {
            hideAllScreens();
            dom.dashboardScreen.classList.remove('hidden');
            updateNavButtons('navDashboardBtn');
            // Asegurar que la barra de navegación global esté visible
            const bottomNavBar = document.getElementById('bottomNavBar');
            if (bottomNavBar) bottomNavBar.classList.remove('hidden');
        });
    }

    // Botón volver desde Calendario
    const backToDashboardBtn = document.getElementById('backToDashboardBtn');
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => {
            hideAllScreens();
            dom.dashboardScreen.classList.remove('hidden');
            updateNavButtons('navDashboardBtn');
            // Asegurar que la barra de navegación global esté visible
            const bottomNavBar = document.getElementById('bottomNavBar');
            if (bottomNavBar) bottomNavBar.classList.remove('hidden');
        });
    }
    
    if (dom.calculateGradeBtn) {
        dom.calculateGradeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            performGradeCalculation();
        });
    }
    
    if (dom.gradeCalculatorModal) {
        dom.gradeCalculatorModal.addEventListener('click', function(e) {
            if (e.target === dom.gradeCalculatorModal) {
                closeGradeCalculator();
            }
        });
    }

    // Event listener para compartir horario
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            showShareModal();
        });
    }

    // Event listener para el toggle de tema - usar change en el checkbox
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', function() {
            console.log('🔔 Cambio en themeToggle detectado - checked:', this.checked);
            toggleTheme();
        });
    } else {
        console.warn('⚠️ No se encontró themeToggle en el DOM');
    }

    if (dom.addTaskFab) {
        dom.addTaskFab.addEventListener('click', () => openTaskModal());
    }
    
    if (dom.closeTaskModalBtn) {
        dom.closeTaskModalBtn.addEventListener('click', closeTaskModal);
    }
    
    if (dom.saveTaskBtn) {
        dom.saveTaskBtn.addEventListener('click', saveTask);
    }
    
    if (dom.cancelTaskBtn) {
        dom.cancelTaskBtn.addEventListener('click', closeTaskModal);
    }

    if (dom.taskModal) {
        dom.taskModal.addEventListener('click', function(e) {
            if (e.target === dom.taskModal) {
                closeTaskModal();
            }
        });
    }

    if (dom.userTasksContainer) {
        dom.userTasksContainer.addEventListener('click', function(e) {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;
            
            const action = actionBtn.getAttribute('data-action');
            const taskId = actionBtn.getAttribute('data-task-id');
            
            switch (action) {
                case 'toggle-complete':
                    toggleTaskComplete(taskId);
                    break;
                case 'edit-task':
                    openTaskModal(taskId);
                    break;
                case 'delete-task':
                    deleteTask(taskId);
                    break;
            }
        });
    }

    if (dom.taskHistoryContainer) {
        dom.taskHistoryContainer.addEventListener('click', function(e) {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;
            
            const action = actionBtn.getAttribute('data-action');
            const taskId = actionBtn.getAttribute('data-task-id');
            
            switch (action) {
                case 'toggle-complete':
                    toggleTaskComplete(taskId);
                    break;
                case 'delete-task':
                    deleteTask(taskId);
                    break;
            }
        });
    }

    if (dom.toggleHistoryBtn && dom.taskHistoryContainer && dom.historyToggleIcon) {
        dom.toggleHistoryBtn.addEventListener('click', () => {
            const isHidden = dom.taskHistoryContainer.classList.contains('hidden');
            if (isHidden) {
                dom.taskHistoryContainer.classList.remove('hidden');
                dom.historyToggleIcon.classList.remove('fa-chevron-down');
                dom.historyToggleIcon.classList.add('fa-chevron-up');
            } else {
                dom.taskHistoryContainer.classList.add('hidden');
                dom.historyToggleIcon.classList.remove('fa-chevron-up');
                dom.historyToggleIcon.classList.add('fa-chevron-down');
            }
        });
    }

    // ============================================
    // MODAL TUTORIAL DE INSTALACIÓN
    // ============================================
    
    // Abrir modal de tutorial
    if (dom.openInstallTutorialBtn) {
        dom.openInstallTutorialBtn.addEventListener('click', () => {
            if (dom.installTutorialModal) {
                dom.installTutorialModal.classList.remove('hidden');
                dom.installTutorialModal.classList.add('flex');
            }
        });
    }

    // Cerrar modal de tutorial
    if (dom.closeInstallTutorialBtn) {
        dom.closeInstallTutorialBtn.addEventListener('click', () => {
            if (dom.installTutorialModal) {
                dom.installTutorialModal.classList.add('hidden');
                dom.installTutorialModal.classList.remove('flex');
            }
        });
    }

    // Cerrar modal al hacer clic fuera
    if (dom.installTutorialModal) {
        dom.installTutorialModal.addEventListener('click', (e) => {
            if (e.target === dom.installTutorialModal) {
                dom.installTutorialModal.classList.add('hidden');
                dom.installTutorialModal.classList.remove('flex');
            }
        });
    }

    // Tabs Android/iOS
    if (dom.tabAndroid && dom.tabIOS && dom.androidContent && dom.iosContent) {
        dom.tabAndroid.addEventListener('click', () => {
            // Activar tab Android
            dom.tabAndroid.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white', 'shadow-sm');
            dom.tabAndroid.classList.remove('text-gray-600', 'dark:text-gray-400');
            // Desactivar tab iOS
            dom.tabIOS.classList.remove('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white', 'shadow-sm');
            dom.tabIOS.classList.add('text-gray-600', 'dark:text-gray-400');
            // Mostrar contenido Android
            dom.androidContent.classList.remove('hidden');
            dom.iosContent.classList.add('hidden');
        });

        dom.tabIOS.addEventListener('click', () => {
            // Activar tab iOS
            dom.tabIOS.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white', 'shadow-sm');
            dom.tabIOS.classList.remove('text-gray-600', 'dark:text-gray-400');
            // Desactivar tab Android
            dom.tabAndroid.classList.remove('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white', 'shadow-sm');
            dom.tabAndroid.classList.add('text-gray-600', 'dark:text-gray-400');
            // Mostrar contenido iOS
            dom.iosContent.classList.remove('hidden');
            dom.androidContent.classList.add('hidden');
        });
    }

    // Función helper para toggle de secciones
    function setupSectionToggle(button, container, icon) {
        if (button && container && icon) {
            button.addEventListener('click', () => {
                const isHidden = container.classList.contains('hidden');
                if (isHidden) {
                    container.classList.remove('hidden');
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                } else {
                    container.classList.add('hidden');
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            });
        }
    }

    // Configurar toggles para todas las secciones
    setupSectionToggle(dom.toggleTodayClassesBtn, dom.todayClassesContainer, dom.todayClassesToggleIcon);
    setupSectionToggle(dom.toggleExamsBtn, dom.examsContainer, dom.examsToggleIcon);
    setupSectionToggle(dom.toggleOccasionalBtn, dom.occasionalContainer, dom.occasionalToggleIcon);
    setupSectionToggle(dom.toggleTasksBtn, dom.tasksContainer, dom.tasksToggleIcon);

    // Botón de Estadísticas
    if (dom.statsBtn) {
        dom.statsBtn.addEventListener('click', () => {
            showStatistics();
        });
    }

    // Botón volver desde Estadísticas
    if (dom.backToDashboardFromStatsBtn) {
        dom.backToDashboardFromStatsBtn.addEventListener('click', () => {
            hideAllScreens();
            dom.dashboardScreen.classList.remove('hidden');
            updateNavButtons('navDashboardBtn');
        });
    }

    // Botón exportar estadísticas
    if (dom.exportStatsBtn) {
        dom.exportStatsBtn.addEventListener('click', () => {
            exportStatistics();
            showToast('Estadísticas exportadas correctamente', 'success');
        });
    }

    // Botón de ayuda del Pomodoro
    if (dom.pomodoroHelpBtn) {
        dom.pomodoroHelpBtn.addEventListener('click', () => {
            showToast('Pomodoro: 25 min trabajo + 5 min descanso. Cada 4 sesiones: 15 min descanso largo', 'info');
        });
    }

    // Botón Dashboard/Inicio desde barra de navegación
    if (dom.navDashboardBtn) {
        dom.navDashboardBtn.addEventListener('click', () => {
            updateNavButtons('navDashboardBtn');
            hideAllScreens();
            dom.dashboardScreen.classList.remove('hidden');
        });
    }

    // Botón Calendario desde barra de navegación
    if (dom.navCalendarBtn) {
        dom.navCalendarBtn.addEventListener('click', () => {
            updateNavButtons('navCalendarBtn');
            hideAllScreens();
            showCalendar();
        });
    }

    // Botón abrir Pomodoro desde barra de navegación
    if (dom.navPomodoroBtn) {
        dom.navPomodoroBtn.addEventListener('click', () => {
            updateNavButtons('navPomodoroBtn');
            hideAllScreens();
            showPomodoroScreen();
        });
    }

    // Botón Calculadora desde barra de navegación
    if (dom.navCalculatorBtn) {
        dom.navCalculatorBtn.addEventListener('click', () => {
            updateNavButtons('navCalculatorBtn');
            hideAllScreens();
            if (dom.calculatorScreen) {
                dom.calculatorScreen.classList.remove('hidden');
                // Asegurar que la barra de navegación global esté visible
                const bottomNavBar = document.getElementById('bottomNavBar');
                if (bottomNavBar) bottomNavBar.classList.remove('hidden');
                // Inicializar ejemplos rápidos cuando se muestra la calculadora
                initQuickExamples();
            }
        });
    }

    // Botón volver desde Pomodoro
    if (dom.backToDashboardFromPomodoroBtn) {
        dom.backToDashboardFromPomodoroBtn.addEventListener('click', () => {
            hideAllScreens();
            dom.dashboardScreen.classList.remove('hidden');
            updateNavButtons('navDashboardBtn');
            // Mostrar barra de navegación global
            const bottomNavBar = document.getElementById('bottomNavBar');
            if (bottomNavBar) bottomNavBar.classList.remove('hidden');
        });
    }

    // Tabs del Pomodoro (Bottom Navigation)
    if (dom.tabTasks && dom.tabStats && dom.tabSettings && dom.tabAchievements) {
        const tabs = [dom.tabTasks, dom.tabStats, dom.tabSettings, dom.tabAchievements];

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remover clase active de todos
                tabs.forEach(t => t.classList.remove('active'));
                
                // Agregar clase active al seleccionado
                tab.classList.add('active');
                
                // Actualizar contenido (se implementará en pomodoro-advanced.js)
                const tabName = tab.id.replace('tab', '').toLowerCase();
                window.dispatchEvent(new CustomEvent('pomodoroTabChange', { detail: { tab: tabName } }));
            });
        });
    }
}

// Función para ocultar todas las pantallas
function hideAllScreens() {
    if (dom.dashboardScreen) dom.dashboardScreen.classList.add('hidden');
    if (dom.pomodoroScreen) dom.pomodoroScreen.classList.add('hidden');
    if (dom.statisticsScreen) dom.statisticsScreen.classList.add('hidden');
    if (dom.calendarScreen) dom.calendarScreen.classList.add('hidden');
    if (dom.calculatorScreen) dom.calculatorScreen.classList.add('hidden');
    if (dom.settingsScreen) dom.settingsScreen.classList.add('hidden');
}

// Función para actualizar estado activo de botones de navegación
function updateNavButtons(activeId) {
    const navButtons = ['navDashboardBtn', 'navCalendarBtn', 'navPomodoroBtn', 'navCalculatorBtn', 'settingsBtn'];
    navButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            if (id === activeId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Capturar evento de instalación PWA
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir que el browser muestre su propio prompt
    e.preventDefault();
    // Guardar el evento para usarlo después
    window.deferredPrompt = e;
    console.log('PWA install prompt available');
});

// ============================================
// iOS 26 SAFARI - MANEJO DINÁMICO DE BARRA FLOTANTE
// ============================================

/**
 * Detecta y ajusta dinámicamente los insets cuando la barra de Safari
 * se minimiza/expande en iOS 26 (comportamiento flotante)
 */
function initIOSSafeAreaHandler() {
    // Verificar si estamos en iOS/Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (!isIOS) return;
    
    // Función para actualizar variables CSS cuando cambia el viewport
    function updateSafeAreaInsets() {
        // Calcular diferencia entre viewport height y client height
        const viewportHeight = window.innerHeight;
        const documentHeight = document.documentElement.clientHeight;
        const bottomInset = Math.max(0, documentHeight - viewportHeight);
        
        // Actualizar variable CSS custom (fallback para navegadores antiguos)
        document.documentElement.style.setProperty('--dynamic-safe-bottom', `${bottomInset}px`);
    }
    
    // Ejecutar al cargar
    updateSafeAreaInsets();
    
    // Ejecutar cuando cambie el tamaño del viewport (barra se minimiza/expande)
    window.addEventListener('resize', updateSafeAreaInsets);
    
    // Ejecutar cuando cambie la orientación
    window.addEventListener('orientationchange', () => {
        // Delay para esperar a que el navegador termine de rotar
        setTimeout(updateSafeAreaInsets, 200);
    });
    
    // Ejecutar cuando se haga scroll (la barra puede moverse)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateSafeAreaInsets, 100);
    }, { passive: true });
    
    console.log('[iOS Safe-Area] Handler inicializado para Safari flotante');
}

// Ejecutar inmediatamente cuando el módulo se carga
// (DOMContentLoaded ya se disparó cuando main.js se carga dinámicamente)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
        initEventListeners();
        initIOSSafeAreaHandler();
    });
} else {
    // DOM ya está listo
    init();
    initEventListeners();
    initIOSSafeAreaHandler();
}
