import { dom } from './dom.js';
import { state } from './state.js';

export function getUniqueSemestres() {
    if (!state.fullSchedule) return [];
    const semestres = new Set(state.fullSchedule.map(item => item.semestre));
    return Array.from(semestres).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function getAsignaturasBySemestres(semestres) {
    if (!state.fullSchedule) return [];
    const asignaturas = new Set(
        state.fullSchedule
            .filter(item => semestres.includes(item.semestre))
            .map(item => item.asignatura)
    );
    return Array.from(asignaturas).sort();
}

export function getInstancesByAsignaturas(asignaturas) {
    if (!state.fullSchedule) return [];
    const seen = new Set();
    return state.fullSchedule
        .filter(item => {
            if (asignaturas.includes(item.asignatura) && !seen.has(item.instanceId)) {
                seen.add(item.instanceId);
                return true;
            }
            return false;
        });
}

export function populateSemestres() {
    const semestres = getUniqueSemestres();
    const container = dom.semestreCheckboxes;
    container.innerHTML = '';
    
    if (semestres.length === 0) {
        container.innerHTML = '<p class="text-red-500">No se encontraron semestres en los datos</p>';
        return;
    }
    
    // Checkbox "Seleccionar Todos"
    const selectAllDiv = document.createElement('div');
    selectAllDiv.className = 'flex items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800';
    selectAllDiv.innerHTML = `
        <input type="checkbox" id="selectAllSemestres" 
            class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mr-2 cursor-pointer">
        <label for="selectAllSemestres" class="text-sm font-semibold cursor-pointer flex-1">
            Seleccionar Todos
        </label>
    `;
    container.appendChild(selectAllDiv);
    
    // Checkboxes individuales
    semestres.forEach(sem => {
        const div = document.createElement('div');
        div.className = 'flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded';
        div.innerHTML = `
            <input type="checkbox" id="sem_${sem}" value="${sem}"
                class="semestreCheckbox w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mr-2 cursor-pointer">
            <label for="sem_${sem}" class="text-sm cursor-pointer flex-1">
                Semestre ${sem}
            </label>
        `;
        container.appendChild(div);
    });
    
    // Event listeners
    const selectAll = document.getElementById('selectAllSemestres');
    const checkboxes = document.querySelectorAll('.semestreCheckbox');
    
    selectAll.addEventListener('change', (e) => {
        checkboxes.forEach(cb => cb.checked = e.target.checked);
        onSemestreChange();
    });
    
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
            selectAll.checked = allChecked;
            onSemestreChange();
        });
    });
}

function onSemestreChange() {
    const selected = Array.from(document.querySelectorAll('.semestreCheckbox:checked')).map(cb => cb.value);
    state.selectedSemestres = selected;
    
    if (selected.length > 0) {
        populateAsignaturas(selected);
        dom.asignaturasSection.classList.remove('hidden');
    } else {
        dom.asignaturasSection.classList.add('hidden');
        dom.instanciasSection.classList.add('hidden');
        dom.step4.classList.add('hidden');
    }
}

function populateAsignaturas(semestres) {
    const asignaturas = getAsignaturasBySemestres(semestres);
    const container = dom.asignaturaCheckboxes;
    container.innerHTML = '';
    
    // Checkbox "Seleccionar Todos"
    const selectAllDiv = document.createElement('div');
    selectAllDiv.className = 'col-span-full flex items-center p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800';
    selectAllDiv.innerHTML = `
        <input type="checkbox" id="selectAllAsignaturas" 
            class="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500 mr-2 cursor-pointer">
        <label for="selectAllAsignaturas" class="text-sm font-semibold cursor-pointer flex-1">
            Seleccionar Todas
        </label>
    `;
    container.appendChild(selectAllDiv);
    
    // Checkboxes individuales
    asignaturas.forEach(asig => {
        const div = document.createElement('div');
        div.className = 'flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded';
        const safeId = asig.replace(/\s/g, '_').replace(/[^\w-]/g, '');
        div.innerHTML = `
            <input type="checkbox" id="asig_${safeId}" value="${asig}"
                class="asignaturaCheckbox w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500 mr-2 cursor-pointer">
            <label for="asig_${safeId}" class="text-sm cursor-pointer flex-1">
                ${asig}
            </label>
        `;
        container.appendChild(div);
    });
    
    // Event listeners
    const selectAll = document.getElementById('selectAllAsignaturas');
    const checkboxes = document.querySelectorAll('.asignaturaCheckbox');
    
    selectAll.addEventListener('change', (e) => {
        checkboxes.forEach(cb => cb.checked = e.target.checked);
        onAsignaturaChange();
    });
    
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
            selectAll.checked = allChecked;
            onAsignaturaChange();
        });
    });
    
    // Reset selección de instancias
    state.selectedAsignaturas = [];
    state.selectedInstances = [];
}

function onAsignaturaChange() {
    const selected = Array.from(document.querySelectorAll('.asignaturaCheckbox:checked')).map(cb => cb.value);
    state.selectedAsignaturas = selected;
    
    if (selected.length > 0) {
        const instances = getInstancesByAsignaturas(selected);
        
        // Si todas las asignaturas tienen solo una instancia, saltar el paso 3.3
        const multipleInstances = selected.some(asig => {
            const count = instances.filter(inst => inst.asignatura === asig).length;
            return count > 1;
        });
        
        if (multipleInstances) {
            populateInstances(instances);
            dom.instanciasSection.classList.remove('hidden');
            dom.step4.classList.add('hidden');
        } else {
            // Auto-seleccionar las únicas instancias disponibles
            state.selectedInstances = instances.map(inst => inst.instanceId);
            dom.instanciasSection.classList.add('hidden');
            dom.step4.classList.remove('hidden');
        }
    } else {
        dom.instanciasSection.classList.add('hidden');
        dom.step4.classList.add('hidden');
    }
}

function populateInstances(instances) {
    const container = dom.instanciaCheckboxes;
    container.innerHTML = '';
    
    // Agrupar por asignatura
    const grouped = {};
    instances.forEach(inst => {
        if (!grouped[inst.asignatura]) {
            grouped[inst.asignatura] = [];
        }
        grouped[inst.asignatura].push(inst);
    });
    
    // Renderizar por grupo
    Object.keys(grouped).sort().forEach(asignatura => {
        const group = grouped[asignatura];
        
        if (group.length === 1) {
            // Si solo hay una instancia, marcarla automáticamente
            const inst = group[0];
            const div = document.createElement('div');
            div.className = 'flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600';
            div.innerHTML = `
                <input type="checkbox" id="inst_${inst.instanceId}" value="${inst.instanceId}"
                    class="instanciaCheckbox w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mr-3 cursor-pointer"
                    checked>
                <label for="inst_${inst.instanceId}" class="text-sm cursor-pointer flex-1">
                    <span class="font-semibold">${inst.asignatura}</span><br>
                    <span class="text-xs text-gray-600 dark:text-gray-400">
                        Sección: ${inst.seccion} | Turno: ${inst.turno} | ${inst.profesor}
                    </span>
                </label>
            `;
            container.appendChild(div);
        } else {
            // Múltiples instancias, mostrar con encabezado
            const headerDiv = document.createElement('div');
            headerDiv.className = 'font-semibold text-sm text-purple-700 dark:text-purple-300 mt-3 mb-2 pb-2 border-b border-purple-200 dark:border-purple-800';
            headerDiv.textContent = asignatura;
            container.appendChild(headerDiv);
            
            group.forEach(inst => {
                const div = document.createElement('div');
                div.className = 'flex items-center p-3 ml-4 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 mb-2';
                div.innerHTML = `
                    <input type="checkbox" id="inst_${inst.instanceId}" value="${inst.instanceId}"
                        class="instanciaCheckbox w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mr-3 cursor-pointer">
                    <label for="inst_${inst.instanceId}" class="text-sm cursor-pointer flex-1">
                        <span class="text-xs text-gray-600 dark:text-gray-400">
                            Sección: <strong>${inst.seccion}</strong> | Turno: <strong>${inst.turno}</strong> | ${inst.profesor}
                        </span>
                    </label>
                `;
                container.appendChild(div);
            });
        }
    });
    
    // Event listeners
    const checkboxes = document.querySelectorAll('.instanciaCheckbox');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', onInstanceChange);
    });
    
    // Trigger inicial
    onInstanceChange();
}

function onInstanceChange() {
    const selected = Array.from(document.querySelectorAll('.instanciaCheckbox:checked')).map(cb => cb.value);
    state.selectedInstances = selected;
    
    if (selected.length > 0) {
        dom.step4.classList.remove('hidden');
    } else {
        dom.step4.classList.add('hidden');
    }
}

export function applyFilters() {
    // Filtrar clases basándose en las instancias seleccionadas
    state.clases = state.fullSchedule.filter(clase => 
        state.selectedInstances.includes(clase.instanceId)
    );
    
    // Filtrar exámenes basándose en las instancias seleccionadas
    state.examenes = state.fullExamData.filter(examen => 
        state.selectedInstances.includes(examen.instanceId)
    );
    
    // Filtrar clases ocasionales basándose en las instancias seleccionadas
    state.occasionalClasses = state.fullOccasionalClasses.filter(clase => 
        state.selectedInstances.includes(clase.instanceId)
    );
    
    console.log(`Filtrado aplicado: ${state.clases.length} clases, ${state.examenes.length} exámenes, ${state.occasionalClasses.length} clases ocasionales`);
}
