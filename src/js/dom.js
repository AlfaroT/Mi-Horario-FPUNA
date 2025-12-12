// Función helper para obtener elementos del DOM de manera segura
function getElement(id) {
    return document.getElementById(id);
}

export const dom = {
    // Pantallas
    get setupScreen() { return getElement('setupScreen'); },
    get dashboardScreen() { return getElement('dashboardScreen'); },
    get welcomeScreen() { return getElement('welcomeScreen'); },
    get pomodoroScreen() { return getElement('pomodoroScreen'); },
    get statisticsScreen() { return getElement('statisticsScreen'); },
    get calendarScreen() { return getElement('calendarScreen'); },
    get calculatorScreen() { return getElement('calculatorScreen'); },
    get settingsScreen() { return getElement('settingsScreen'); },

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
    get calculateGradeBtn() { return getElement('calculateGradeBtn'); },
    get ppInput() { return getElement('ppInput'); },
    get efInput() { return getElement('efInput'); },
    get resultDiv() { return getElement('resultDiv'); },
    get gradeResult() { return getElement('gradeResult'); },

    // Tasks
    get addTaskFab() { return getElement('addTaskFab'); },
    get taskModal() { return getElement('taskModal'); },
    get taskModalTitle() { return getElement('taskModalTitle'); },
    get closeTaskModalBtn() { return getElement('closeTaskModalBtn'); },
    get saveTaskBtn() { return getElement('saveTaskBtn'); },
    get cancelTaskBtn() { return getElement('cancelTaskBtn'); },
    get taskId() { return getElement('taskId'); },
    get taskTitle() { return getElement('taskTitle'); },
    get taskDescription() { return getElement('taskDescription'); },
    get taskDate() { return getElement('taskDate'); },
    get taskTime() { return getElement('taskTime'); },
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
    get userTasksContainer() { return getElement('userTasksContainer'); },

    // Greeting header
    get greetingHeader() { return getElement('greetingHeader'); },

    // Theme
    get themeToggle() { return getElement('themeToggle'); },

    // Install Tutorial Modal
    get openInstallTutorialBtn() { return getElement('openInstallTutorialBtn'); },
    get installTutorialModal() { return getElement('installTutorialModal'); },
    get closeInstallTutorialBtn() { return getElement('closeInstallTutorialBtn'); },
    get tabAndroid() { return getElement('tabAndroid'); },
    get tabIOS() { return getElement('tabIOS'); },
    get androidContent() { return getElement('androidContent'); },
    get iosContent() { return getElement('iosContent'); },

    // Pomodoro
    get pomodoroTimer() { return getElement('pomodoroTimer'); },
    get pomodoroMode() { return getElement('pomodoroMode'); },
    get pomodoroSessions() { return getElement('pomodoroSessions'); },
    get pomodoroProgress() { return getElement('pomodoroProgress'); },
    get pomodoroStartBtn() { return getElement('pomodoroStartBtn'); },
    get pomodoroPauseBtn() { return getElement('pomodoroPauseBtn'); },
    get pomodoroResetBtn() { return getElement('pomodoroResetBtn'); },
    get pomodoroSkipBtn() { return getElement('pomodoroSkipBtn'); },
    get pomodoroHelpBtn() { return getElement('pomodoroHelpBtn'); },

    // Statistics
    get statsBtn() { return getElement('statsBtn'); },
    get statisticsScreen() { return getElement('statisticsScreen'); },
    get backToDashboardFromStatsBtn() { return getElement('backToDashboardFromStatsBtn'); },
    get exportStatsBtn() { return getElement('exportStatsBtn'); },
    get academicStatsContainer() { return getElement('academicStatsContainer'); },
    get pomodoroStatsContainer() { return getElement('pomodoroStatsContainer'); },
    get examStatsContainer() { return getElement('examStatsContainer'); },
    get taskStatsContainer() { return getElement('taskStatsContainer'); },
    get progressChartContainer() { return getElement('progressChartContainer'); },

    // Pomodoro Screen - Minimalista
    get openPomodoroBtn() { return getElement('navPomodoroBtn'); },
    get navDashboardBtn() { return getElement('navDashboardBtn'); },
    get navCalendarBtn() { return getElement('navCalendarBtn'); },
    get navPomodoroBtn() { return getElement('navPomodoroBtn'); },
    get navCalculatorBtn() { return getElement('navCalculatorBtn'); },
    get navStatsBtn() { return getElement('navStatsBtn'); },
    get pomodoroScreen() { return getElement('pomodoroScreen'); },
    get backToDashboardFromPomodoroBtn() { return getElement('backToDashboardFromPomodoroBtn'); },
    get pomodoroTimerDisplay() { return getElement('pomodoroTimerDisplay'); },
    get pomodoroModeDisplay() { return getElement('pomodoroModeDisplay'); },
    get pomodoroCyclesDisplay() { return getElement('pomodoroCyclesDisplay'); },
    get pomodoroTotalTimeDisplay() { return getElement('pomodoroTotalTimeDisplay'); },
    get pomodoroStreakDisplay() { return getElement('pomodoroStreakDisplay'); },
    get pomodoroProgressBar() { return getElement('pomodoroProgressBar'); },
    get currentTaskDisplay() { return getElement('currentTaskDisplay'); },
    get pomodoroSkipBtn() { return getElement('pomodoroSkipBtn'); },
    
    // Pomodoro Tabs (Bottom Navigation)
    get tabTasks() { return getElement('tabTasks'); },
    get tabStats() { return getElement('tabStats'); },
    get tabSettings() { return getElement('tabSettings'); },
    get tabAchievements() { return getElement('tabAchievements'); },
    get pomodoroContentArea() { return getElement('pomodoroContentArea'); },
};
