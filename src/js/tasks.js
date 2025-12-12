import { state, USER_TASKS_KEY } from './state.js';
import { renderUserTasks } from './ui.js';
import { showToast } from './utils.js';
import { renderCalendar } from './calendar.js';

export function loadUserTasks() {
    const tasksJSON = localStorage.getItem(USER_TASKS_KEY);
    if (tasksJSON) {
        try {
            state.userTasks = JSON.parse(tasksJSON);
        } catch (e) {
            console.error('Error cargando tareas:', e);
            state.userTasks = [];
        }
    } else {
        state.userTasks = [];
    }
}

export function saveUserTasks() {
    localStorage.setItem(USER_TASKS_KEY, JSON.stringify(state.userTasks));
}

export function openTaskModal(taskId = null) {
    const modal = document.getElementById('taskModal');
    const title = document.getElementById('taskModalTitle');
    
    if (taskId) {
        const task = state.userTasks.find(t => t.id === taskId);
        if (task) {
            title.textContent = 'Editar Tarea';
            document.getElementById('taskTitle').value = task.titulo;
            document.getElementById('taskDescription').value = task.descripcion || '';
            document.getElementById('taskDate').value = task.fecha;
            document.getElementById('taskTime').value = task.hora || '';
            document.getElementById('taskId').value = taskId;
        }
    } else {
        title.textContent = 'Nueva Tarea';
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskDate').value = '';
        document.getElementById('taskTime').value = '';
        document.getElementById('taskId').value = '';
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

export function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

export function saveTask() {
    const taskId = document.getElementById('taskId').value;
    const titulo = document.getElementById('taskTitle').value.trim();
    const descripcion = document.getElementById('taskDescription').value.trim();
    const fecha = document.getElementById('taskDate').value;
    const hora = document.getElementById('taskTime').value;
    
    if (!titulo || !fecha) {
        showToast('Por favor completa el título y la fecha', 'error');
        return;
    }
    
    if (taskId) {
        // Actualizar tarea existente
        const taskIndex = state.userTasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
            state.userTasks[taskIndex] = {
                ...state.userTasks[taskIndex],
                titulo,
                descripcion,
                fecha,
                hora
            };
        }
    } else {
        // Crear nueva tarea
        const newTask = {
            id: 'task_' + Date.now(),
            titulo,
            descripcion,
            fecha,
            hora,
            completada: false,
            fechaCreacion: new Date().toISOString()
        };
        state.userTasks.push(newTask);
    }
    
    saveUserTasks();
    closeTaskModal();
    renderUserTasks();
    
    // Actualizar calendario siempre
    console.log('[Tasks] Actualizando calendario después de guardar tarea');
    try {
        renderCalendar();
        console.log('[Tasks] Calendario actualizado exitosamente');
    } catch (error) {
        console.error('[Tasks] Error al actualizar calendario:', error);
    }
    
    showToast(taskId ? 'Tarea actualizada' : 'Tarea creada', 'success');
}

export function deleteTask(taskId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        state.userTasks = state.userTasks.filter(t => t.id !== taskId);
        saveUserTasks();
        renderUserTasks();
        
        // Actualizar calendario siempre
        console.log('[Tasks] Actualizando calendario después de eliminar tarea');
        try {
            renderCalendar();
            console.log('[Tasks] Calendario actualizado exitosamente');
        } catch (error) {
            console.error('[Tasks] Error al actualizar calendario:', error);
        }
        
        showToast('Tarea eliminada', 'success');
    }
}

export function toggleTaskComplete(taskId) {
    const task = state.userTasks.find(t => t.id === taskId);
    if (task) {
        task.completada = !task.completada;
        if (task.completada) {
            task.fechaCompletado = new Date().toISOString();
        } else {
            delete task.fechaCompletado;
        }
        saveUserTasks();
        renderUserTasks();
        
        // Actualizar calendario siempre
        console.log('[Tasks] Actualizando calendario después de completar/reactivar tarea');
        try {
            renderCalendar();
            console.log('[Tasks] Calendario actualizado exitosamente');
        } catch (error) {
            console.error('[Tasks] Error al actualizar calendario:', error);
        }
        
        showToast(task.completada ? 'Tarea completada ✓' : 'Tarea reactivada', 'success');
    }
}

export function cleanupOldCompletedTasks() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const beforeCount = state.userTasks.length;
    state.userTasks = state.userTasks.filter(task => {
        if (!task.completada) return true; // Mantener tareas activas
        if (!task.fechaCompletado) return true; // Mantener si no tiene fecha de completado
        
        const completedDate = new Date(task.fechaCompletado);
        return completedDate > sevenDaysAgo; // Mantener si fue completada hace menos de 7 días
    });
    
    const removedCount = beforeCount - state.userTasks.length;
    if (removedCount > 0) {
        console.log(`🧹 Limpieza automática: ${removedCount} tareas antiguas eliminadas del historial`);
        saveUserTasks();
    }
}
