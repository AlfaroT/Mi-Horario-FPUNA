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

    // Inicializar funcionalidades
    initQuickExamples();
    initGradeCalculatorValidation();
}

function closeGradeCalculator() {
    dom.gradeCalculatorModal.classList.add('hidden');
    dom.gradeCalculatorModal.classList.remove('flex');
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
        <div class="animate-fade-in ${bgColor} border rounded-xl p-6 space-y-4">
            <!-- Header del resultado -->
            <div class="text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 ${notaColor} bg-white dark:bg-gray-800 rounded-full mb-4 shadow-lg">
                    <i class="${icon} text-2xl"></i>
                </div>
                <h4 class="text-xl font-bold ${notaColor} mb-2">${result.calificacion}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">Nota final obtenida</p>
            </div>

            <!-- Métricas principales -->
            <div class="grid grid-cols-3 gap-4">
                <div class="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div class="text-2xl font-bold ${notaColor}">${result.pf}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Puntuación</div>
                </div>
                <div class="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div class="text-2xl font-bold ${notaColor}">${result.nota}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Nota</div>
                </div>
                <div class="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div class="text-lg font-bold ${notaColor}">${result.calificacion}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Estado</div>
                </div>
            </div>

            <!-- Detalles del cálculo -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h5 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <i class="fas fa-equation text-blue-600 mr-2"></i>
                    Detalle del cálculo
                </h5>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">PP (40%):</span>
                        <span class="font-mono">${pp} × 0.4 = ${(pp * 0.4).toFixed(1)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">EF (60%):</span>
                        <span class="font-mono">${ef} × 0.6 = ${(ef * 0.6).toFixed(1)}</span>
                    </div>
                    <hr class="border-gray-200 dark:border-gray-700">
                    <div class="flex justify-between font-semibold">
                        <span class="text-gray-900 dark:text-white">Total:</span>
                        <span class="font-mono ${notaColor}">${result.pf} puntos</span>
                    </div>
                </div>
            </div>

            ${result.reprobadoPorEF ? `
                <div class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-center font-semibold animate-pulse">
                    <i class="fas fa-times-circle mr-2"></i>
                    ${result.mensaje}
                </div>
            ` : result.nota >= 3 ? `
                <div class="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 px-4 py-3 rounded-lg text-center font-semibold">
                    <i class="fas fa-check-circle mr-2"></i>
                    ¡Felicitaciones! Has aprobado la materia
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

function init() {
    // Inicializar tema antes que nada (para evitar flash)
    initTheme();
    
    // Inicializar clicks en tarjetas métricas
    initMetricCards();
    
    // Cargar tareas del usuario
    loadUserTasks();
    
    // Limpieza automática de tareas antiguas (>7 días)
    cleanupOldCompletedTasks();
    
    // Verificar si hay datos guardados
    if (localStorage.getItem('userName')) {
        if (loadFromLocalStorage()) {
            showDashboard();
        } else {
            showSetup();
        }
    } else {
        showWelcomeScreen();
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Mi Horario FPUNA v5.5 - REFACTORIZADO  ');
    console.log('═══════════════════════════════════════════════════════');
}

// ============================================
// EVENT HANDLERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    init();

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
            if (dom.settingsModal) {
                dom.settingsModal.classList.remove('hidden');
                dom.settingsModal.classList.add('flex');
            }
            // Asegurar que el toggle refleje el estado actual
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                const isDark = document.documentElement.classList.contains('dark');
                themeToggle.checked = isDark;
            }
        });
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
    
    if (dom.closeGradeCalculatorBtn) {
        dom.closeGradeCalculatorBtn.addEventListener('click', closeGradeCalculator);
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
});
