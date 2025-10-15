import { dom } from './dom.js';
import { DIAS_SEMANA } from './state.js';

export function showError(message) {
    dom.fileError.textContent = message;
    dom.fileError.classList.remove('hidden');
}

export function hideError() {
    dom.fileError.classList.add('hidden');
}

export function showLoading() {
    dom.loadingSpinner.classList.remove('hidden');
}

export function hideLoading() {
    dom.loadingSpinner.classList.add('hidden');
}

export function normalizeString(str) {
    if (!str) return '';
    return String(str)
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Eliminar acentos
}

export function getCellValue(row, columnIndex) {
    if (columnIndex === undefined || columnIndex === null || columnIndex < 0) return '';
    const value = row[columnIndex];
    return value ? String(value).trim() : '';
}

export function formatDate(dateStr) {
    try {
        if (!dateStr) return null;
        
        // Si ya es un objeto Date, devolverlo
        if (dateStr instanceof Date) return dateStr;
        
        // Intentar parsear el formato "Mar 02/09/25" o variantes
        const parts = dateStr.toString().split(' ');
        let datePart = parts.length > 1 ? parts[1] : parts[0];
        
        // Intentar formato DD/MM/YY o DD/MM/YYYY
        const dateParts = datePart.split('/');
        if (dateParts.length >= 2) {
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // Meses empiezan en 0
            let year;
            
            if (dateParts[2]) {
                // Si tiene año
                if (dateParts[2].length === 2) {
                    // Año de 2 dígitos (ej: 25 → 2025)
                    year = 2000 + parseInt(dateParts[2]);
                } else {
                    // Año completo (ej: 2025)
                    year = parseInt(dateParts[2]);
                }
            } else {
                // Si no tiene año, usar el actual
                year = new Date().getFullYear();
            }
            
            const parsedDate = new Date(year, month, day);
            console.log(`📅 formatDate: "${dateStr}" → ${parsedDate.toLocaleDateString()} (${day}/${month+1}/${year})`);
            return parsedDate;
        }
        
        // Intentar parseo directo
        const directParse = new Date(dateStr);
        if (!isNaN(directParse.getTime())) {
            return directParse;
        }
        
        return null;
    } catch (e) {
        console.error('❌ Error parseando fecha:', dateStr, e);
        return null;
    }
}

export function parseTimeRange(timeStr) {
    // Parsear "07:30 - 11:30" => { start: "07:30", end: "11:30" }
    const match = timeStr.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
    if (!match) return null;
    return { start: match[1], end: match[2] };
}

export function getTimeInMinutes(timeStr) {
    // Convertir "07:30" a minutos desde medianoche
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

export function getCurrentTimeInMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

export function getTimeDifference(targetTime) {
    const target = getTimeInMinutes(targetTime);
    const current = getCurrentTimeInMinutes();
    return target - current;
}

export function formatTimeDifference(minutes) {
    if (minutes < 0) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
}

export function getDaysDifference(targetDate) {
    // Crear fecha de hoy sin horas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Si targetDate ya es un objeto Date, usarlo directamente
    let target;
    if (targetDate instanceof Date) {
        target = new Date(targetDate);
    } else if (typeof targetDate === 'string') {
        // Parsear la fecha objetivo
        if (targetDate.includes('/')) {
            // Formato DD/MM/YYYY o DD/MM/YY
            const parts = targetDate.split('/');
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // Meses empiezan en 0
            let year = parseInt(parts[2]);
            
            // Si el año es de 2 dígitos, asumimos 20XX
            if (year < 100) {
                year += 2000;
            }
            
            target = new Date(year, month, day);
        } else if (targetDate.includes('-')) {
            // Formato YYYY-MM-DD (del input HTML)
            // IMPORTANTE: Parsear manualmente para evitar problemas de zona horaria
            const parts = targetDate.split('-');
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // Meses empiezan en 0
            const day = parseInt(parts[2]);
            
            target = new Date(year, month, day);
        } else {
            // Intentar parseo directo
            target = new Date(targetDate);
        }
    } else {
        // Si no es Date ni string, intentar convertir
        target = new Date(targetDate);
    }
    
    target.setHours(0, 0, 0, 0);
    
    // Calcular diferencia en milisegundos y convertir a días
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Debug temporal (puedes quitar este console.log después)
    console.log(`📅 Cálculo de días: Hoy=${today.toLocaleDateString()}, Objetivo=${target.toLocaleDateString()}, Diferencia=${diffDays} días`);
    
    return diffDays;
}

export function getDaysText(days) {
    if (days === 0) return '¡Es Hoy!';
    if (days === 1) return 'Mañana';
    if (days === -1) return 'Fue ayer';
    if (days < 0) return `Hace ${Math.abs(days)} días`;
    return `En ${days} días`;
}

export function getCurrentDayName() {
    const today = new Date();
    return DIAS_SEMANA[today.getDay()];
}

export function formatCurrentDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formatted = today.toLocaleDateString('es-ES', options);
    // Capitalizar primera letra
    return 'Hoy es ' + formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatTime(timeStr) {
    if (!timeStr) return '';
    // Si viene en formato HH:mm:ss, retornar solo HH:mm
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
}

export function showToast(message, type = 'success') {
    const isDark = document.documentElement.classList.contains('dark');
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';
    
    const toast = document.createElement('div');
    toast.className = `toast ${type} ${isDark ? 'dark' : ''}`;
    toast.innerHTML = `
        <i class="fas ${icon} ${iconColor} text-xl"></i>
        <span class="flex-1">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}
