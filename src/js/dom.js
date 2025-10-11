// Función helper para obtener elementos del DOM de manera segura
function getElement(id) {
    return document.getElementById(id);
}

export const dom = {
    // Pantallas
    get setupScreen() { return getElement('setupScreen'); },
    get dashboardScreen() { return getElement('dashboardScreen'); },
    get welcomeScreen() { return getElement('welcomeScreen'); },

    // Welcome
    get welcomeForm() { return getElement('welcomeForm'); },
    get userNameInput() { return getElement('userNameInput'); },

    // Setup
    get fileInput() { return getElement('fileInput'); },
    get fileError() { return getElement('fileError'); },
    get loadingSpinner() { return getElement('loadingSpinner'); },
    get step1() { return getElement('step1'); },
    get step2() { return getElement('step2'); },
    get step3() { return getElement('step3'); },
    get step4() { return getElement('step4'); },
    get carreraSelect() { return getElement('carreraSelect'); },
    get semestreCheckboxes() { return getElement('semestreCheckboxes'); },
    get asignaturasSection() { return getElement('asignaturasSection'); },
    get asignaturaCheckboxes() { return getElement('asignaturaCheckboxes'); },
    get instanciasSection() { return getElement('instanciasSection'); },
    get instanciaCheckboxes() { return getElement('instanciaCheckboxes'); },
    get saveConfigBtn() { return getElement('saveConfigBtn'); },

    // Dashboard
    get currentDate() { return getElement('currentDate'); },
    get todayClasses() { return getElement('todayClasses'); },
    get upcomingExams() { return getElement('upcomingExams'); },
    get occasionalClasses() { return getElement('occasionalClasses'); },
    get settingsBtn() { return getElement('settingsBtn'); },

    // Modals
    get settingsModal() { return getElement('settingsModal'); },
    get closeSettingsBtn() { return getElement('closeSettingsBtn'); },
    get modifyFiltersBtn() { return getElement('modifyFiltersBtn'); },
    get exportBtn() { return getElement('exportBtn'); },
    get importInput() { return getElement('importInput'); },
    get resetBtn() { return getElement('resetBtn'); },
    get confirmModal() { return getElement('confirmModal'); },
    get confirmResetBtn() { return getElement('confirmResetBtn'); },
    get cancelResetBtn() { return getElement('cancelResetBtn'); },

    // Grade Calculator
    get gradeCalculatorBtn() { return getElement('gradeCalculatorBtn'); },
    get gradeCalculatorModal() { return getElement('gradeCalculatorModal'); },
    get closeGradeCalculatorBtn() { return getElement('closeGradeCalculatorBtn'); },
    get calculateGradeBtn() { return getElement('calculateGradeBtn'); },
    get ppInput() { return getElement('ppInput'); },
    get efInput() { return getElement('efInput'); },
    get resultDiv() { return getElement('resultDiv'); },
    get gradeResult() { return getElement('gradeResult'); },

    // Tasks
    get taskForm() { return getElement('taskForm'); },
    get taskTitleInput() { return getElement('taskTitleInput'); },
    get taskDescriptionInput() { return getElement('taskDescriptionInput'); },
    get taskDateInput() { return getElement('taskDateInput'); },
    get taskTimeInput() { return getElement('taskTimeInput'); },
    get addTaskBtn() { return getElement('addTaskBtn'); },
    get taskList() { return getElement('taskList'); },
    get toggleHistoryBtn() { return getElement('toggleHistoryBtn'); },
    get taskHistoryContainer() { return getElement('taskHistoryContainer'); },
    get historyToggleIcon() { return getElement('historyToggleIcon'); },

    // Dashboard sections
    get toggleTodayClassesBtn() { return getElement('toggleTodayClassesBtn'); },
    get todayClassesToggleIcon() { return getElement('todayClassesToggleIcon'); },
    get todayClassesContainer() { return getElement('todayClassesContainer'); },

    get toggleExamsBtn() { return getElement('toggleExamsBtn'); },
    get examsToggleIcon() { return getElement('examsToggleIcon'); },
    get examsContainer() { return getElement('examsContainer'); },

    get toggleOccasionalBtn() { return getElement('toggleOccasionalBtn'); },
    get occasionalToggleIcon() { return getElement('occasionalToggleIcon'); },
    get occasionalContainer() { return getElement('occasionalContainer'); },

    get toggleTasksBtn() { return getElement('toggleTasksBtn'); },
    get tasksToggleIcon() { return getElement('tasksToggleIcon'); },
    get tasksContainer() { return getElement('tasksContainer'); },

    // Greeting header
    get greetingHeader() { return getElement('greetingHeader'); },

    // Theme
    get themeToggle() { return getElement('themeToggle'); },
};