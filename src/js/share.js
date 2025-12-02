/**
 * share.js - Módulo para compartir horarios
 * Usa compresión GZIP real para generar QR escaneables y links cortos
 */

import { state } from './state.js';
import { showToast } from './utils.js';

// Librerías cargadas dinámicamente
let QRCode = null;
let pako = null;

/**
 * Inicializa el módulo de compartir
 * @returns {Promise<boolean>} true si se encontraron datos compartidos en la URL
 */
export async function initShare() {
    // Cargar librerías PRIMERO
    await Promise.all([
        loadQRCodeLibrary(),
        loadPakoLibrary()
    ]);
    
    QRCode = window.QRCode;
    pako = window.pako;
    
    console.log('[Share] Módulo inicializado');
    console.log('[Share] Pako disponible:', !!window.pako);
    
    // Verificar si hay datos para importar en la URL DESPUÉS de cargar librerías
    const hasSharedData = checkUrlForSharedData();
    
    return hasSharedData;
}

/**
 * Carga la librería QRCode dinámicamente
 */
async function loadQRCodeLibrary() {
    return new Promise((resolve) => {
        if (window.QRCode) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
        script.onload = () => {
            console.log('[Share] QRCode library loaded');
            resolve();
        };
        script.onerror = () => {
            console.warn('[Share] Failed to load QRCode library');
            resolve(); // No fallar, usaremos API externa
        };
        document.head.appendChild(script);
    });
}

/**
 * Carga la librería pako (gzip) dinámicamente
 */
async function loadPakoLibrary() {
    return new Promise((resolve) => {
        if (window.pako) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js';
        script.onload = () => {
            console.log('[Share] Pako library loaded');
            resolve();
        };
        script.onerror = () => {
            console.warn('[Share] Failed to load Pako library');
            resolve();
        };
        document.head.appendChild(script);
    });
}

/**
 * Comprime y codifica datos usando GZIP + Base64
 */
function compressData(str) {
    try {
        if (window.pako) {
            // Usar GZIP real
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const compressed = window.pako.deflate(data, { level: 9 });
            
            // Convertir a Base64 URL-safe
            let binary = '';
            for (let i = 0; i < compressed.length; i++) {
                binary += String.fromCharCode(compressed[i]);
            }
            return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        } else {
            // Fallback: solo Base64
            const encoder = new TextEncoder();
            const bytes = encoder.encode(str);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        }
    } catch (e) {
        console.error('[Share] Compression error:', e);
        return null;
    }
}

/**
 * Descomprime datos
 */
function decompressData(base64) {
    try {
        // Restaurar Base64 estándar
        let b64 = base64.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        
        if (window.pako) {
            // Intentar descomprimir con GZIP
            try {
                const decompressed = window.pako.inflate(bytes);
                const decoder = new TextDecoder();
                return decoder.decode(decompressed);
            } catch (e) {
                // Si falla, puede ser datos sin comprimir
                const decoder = new TextDecoder();
                return decoder.decode(bytes);
            }
        } else {
            const decoder = new TextDecoder();
            return decoder.decode(bytes);
        }
    } catch (e) {
        console.error('[Share] Decompression error:', e);
        return null;
    }
}

/**
 * Genera datos compactos del horario
 * Solo incluye campos esenciales para minimizar tamaño
 */
function generateCompactData() {
    const clases = state.clases || [];
    const examenes = state.examenes || [];
    
    if (clases.length === 0 && examenes.length === 0) {
        return null;
    }
    
    // Formato ultra-compacto
    const data = {
        v: 3,
        c: clases.map(c => [
            c.asignatura,
            c.dia,
            c.hora,
            c.aula || '',
            c.seccion || ''
        ]),
        e: examenes.map(e => [
            e.asignatura,
            e.fecha,
            e.hora,
            e.tipo || '',
            e.aula || ''
        ])
    };
    
    return JSON.stringify(data);
}

/**
 * Genera el link para compartir
 */
export function generateShareLink() {
    const compactData = generateCompactData();
    
    if (!compactData) {
        showToast('No hay horario para compartir', 'error');
        return null;
    }
    
    // Comprimir los datos con GZIP
    const compressed = compressData(compactData);
    
    if (!compressed) {
        showToast('Error al comprimir datos', 'error');
        return null;
    }
    
    // Generar URL
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?h=${compressed}`;
    
    return shareUrl;
}

/**
 * Genera código QR
 */
export async function generateQRCode(container, url) {
    // Limpiar container
    container.innerHTML = '';
    
    // Si la URL es muy larga, mostrar advertencia
    if (url.length > 1000) {
        console.warn('[Share] URL muy larga para QR óptimo:', url.length);
    }
    
    try {
        // Intentar con QRCode.js primero
        if (window.QRCode) {
            new window.QRCode(container, {
                text: url,
                width: 200,
                height: 200,
                colorDark: '#1a1a2e',
                colorLight: '#ffffff',
                correctLevel: window.QRCode.CorrectLevel.L // Nivel L para URLs largas
            });
            return true;
        }
    } catch (e) {
        console.error('[Share] QRCode.js error:', e);
    }
    
    // Fallback: API externa
    try {
        const img = document.createElement('img');
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&ecc=L`;
        img.alt = 'QR Code';
        img.className = 'mx-auto';
        img.onerror = () => {
            container.innerHTML = `
                <div class="text-center text-red-500">
                    <i class="fas fa-exclamation-circle text-3xl mb-2"></i>
                    <p class="text-sm">No se pudo generar el QR</p>
                    <p class="text-xs mt-1">Usa el link de abajo</p>
                </div>
            `;
        };
        container.appendChild(img);
        return true;
    } catch (e) {
        console.error('[Share] QR API error:', e);
        container.innerHTML = `
            <div class="text-center text-yellow-500">
                <i class="fas fa-link text-3xl mb-2"></i>
                <p class="text-sm">Copia el link de abajo</p>
            </div>
        `;
        return false;
    }
}

/**
 * Muestra el modal para compartir
 */
export function showShareModal() {
    // Generar link
    const shareUrl = generateShareLink();
    if (!shareUrl) return;
    
    // Crear modal
    const modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
            <!-- Header -->
            <div class="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <i class="fas fa-share-alt text-2xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold">Compartir Horario</h3>
                            <p class="text-purple-200 text-sm">Envía tu horario a tus compañeros</p>
                        </div>
                    </div>
                    <button onclick="document.getElementById('shareModal').remove()" 
                            class="text-white/80 hover:text-white text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <!-- Content -->
            <div class="p-6 space-y-6">
                <!-- QR Code -->
                <div class="text-center">
                    <p class="text-gray-600 dark:text-gray-300 mb-4">
                        <i class="fas fa-qrcode mr-2"></i>Escanea este QR
                    </p>
                    <div id="qrCodeContainer" class="bg-white p-4 rounded-xl inline-block shadow-inner">
                        <div class="w-[200px] h-[200px] flex items-center justify-center">
                            <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Divider -->
                <div class="flex items-center gap-4">
                    <div class="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
                    <span class="text-gray-400 text-sm">o comparte el link</span>
                    <div class="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                
                <!-- Link -->
                <div class="space-y-3">
                    <div class="flex gap-2">
                        <input type="text" id="shareUrlInput" value="${shareUrl}" readonly
                               class="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm 
                                      text-gray-600 dark:text-gray-300 truncate">
                        <button onclick="copyShareLink()" id="copyBtn"
                                class="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl 
                                       transition-colors">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    
                    <!-- Share buttons -->
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="shareViaWhatsApp('${shareUrl}')"
                                class="flex items-center justify-center gap-2 px-4 py-3 
                                       bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors">
                            <i class="fab fa-whatsapp text-lg"></i>
                            <span>WhatsApp</span>
                        </button>
                        <button onclick="shareViaTelegram('${shareUrl}')"
                                class="flex items-center justify-center gap-2 px-4 py-3 
                                       bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors">
                            <i class="fab fa-telegram text-lg"></i>
                            <span>Telegram</span>
                        </button>
                    </div>
                </div>
                
                <!-- Info -->
                <p class="text-center text-xs text-gray-400">
                    <i class="fas fa-info-circle mr-1"></i>
                    El link contiene tu horario de forma segura
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // Generar QR
    setTimeout(() => {
        generateQRCode(document.getElementById('qrCodeContainer'), shareUrl);
    }, 100);
    
    // Agregar funciones globales para los botones
    window.copyShareLink = copyShareLink;
    window.shareViaWhatsApp = shareViaWhatsApp;
    window.shareViaTelegram = shareViaTelegram;
}

/**
 * Copia el link al portapapeles
 */
async function copyShareLink() {
    const input = document.getElementById('shareUrlInput');
    const url = input?.value;
    
    if (!url) return;
    
    try {
        await navigator.clipboard.writeText(url);
        showToast('¡Link copiado!', 'success');
        
        const btn = document.getElementById('copyBtn');
        if (btn) {
            const icon = btn.querySelector('i');
            icon.className = 'fas fa-check';
            setTimeout(() => {
                icon.className = 'fas fa-copy';
            }, 2000);
        }
    } catch (error) {
        // Fallback
        input.select();
        document.execCommand('copy');
        showToast('Link copiado', 'success');
    }
}

/**
 * Comparte via WhatsApp
 */
function shareViaWhatsApp(url) {
    const text = `¡Mira mi horario de FPUNA! 📚\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

/**
 * Comparte via Telegram
 */
function shareViaTelegram(url) {
    const text = `¡Mira mi horario de FPUNA! 📚`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
}

/**
 * Verifica si hay datos compartidos en la URL
 */
export function checkUrlForSharedData() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Nuevo formato comprimido
    const compressedData = urlParams.get('h');
    if (compressedData) {
        console.log('[Share] Found compressed data in URL');
        importCompressedData(compressedData);
        return true;
    }
    
    // Formato antiguo (compatibilidad)
    const oldData = urlParams.get('share');
    if (oldData) {
        console.log('[Share] Found old format data in URL');
        importOldFormatData(oldData);
        return true;
    }
    
    return false;
}

/**
 * Importa datos en formato comprimido
 */
function importCompressedData(encoded) {
    try {
        const jsonStr = decompressData(encoded);
        if (!jsonStr) throw new Error('Decode failed');
        
        console.log('[Share] Decoded data:', jsonStr.substring(0, 200) + '...');
        
        const data = JSON.parse(jsonStr);
        const expanded = expandCompactData(data);
        
        console.log('[Share] Expanded data:', expanded);
        
        showImportConfirmation(expanded);
    } catch (error) {
        console.error('[Share] Error importing compressed data:', error);
        showToast('Error al cargar el horario compartido', 'error');
    }
}

/**
 * Importa datos en formato antiguo (para compatibilidad)
 */
function importOldFormatData(encoded) {
    try {
        let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        
        const decoder = new TextDecoder();
        const jsonStr = decoder.decode(bytes);
        const data = JSON.parse(jsonStr);
        
        // Expandir si está en formato comprimido antiguo
        const expanded = data.c ? expandOldCompactData(data) : data;
        showImportConfirmation(expanded);
    } catch (error) {
        console.error('[Share] Error importing old format:', error);
        showToast('Error al cargar el horario compartido', 'error');
    }
}

/**
 * Expande datos del formato compacto
 */
function expandCompactData(data) {
    // Versión 3: arrays para máxima compresión
    // c: [[asignatura, dia, hora, aula, seccion], ...]
    // e: [[asignatura, fecha, hora, tipo, aula], ...]
    if (data.v === 3) {
        return {
            clases: (data.c || []).map(c => ({
                asignatura: c[0],
                dia: c[1],
                hora: c[2],
                aula: c[3] || '',
                seccion: c[4] || ''
            })),
            examenes: (data.e || []).map(e => ({
                asignatura: e[0],
                fecha: e[1],
                hora: e[2],
                tipo: e[3] || '',
                aula: e[4] || ''
            })),
            occasionalClasses: []
        };
    }
    
    // Versión 2: objetos con claves cortas
    if (data.v === 2) {
        return {
            clases: (data.c || []).map(c => ({
                asignatura: c.a,
                dia: c.d,
                hora: c.h,
                aula: c.au || '',
                seccion: c.sc || ''
            })),
            examenes: (data.e || []).map(e => ({
                asignatura: e.a,
                fecha: e.f,
                hora: e.h,
                tipo: e.t,
                aula: e.au || ''
            })),
            occasionalClasses: []
        };
    }
    
    // Versión 1 (formato antiguo con strings comprimidos)
    const diasMap = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    const clases = [];
    const examenes = [];
    
    // Parsear clases del formato antiguo
    if (data.c && typeof data.c === 'string') {
        data.c.split(';').forEach(item => {
            if (!item) return;
            const parts = item.split('|');
            const diaHoraMateria = parts[0];
            
            const dia = diasMap[parseInt(diaHoraMateria[0])] || '';
            const horaRaw = diaHoraMateria.substring(1, 5);
            const hora = horaRaw.substring(0, 2) + ':' + horaRaw.substring(2, 4);
            const materia = diaHoraMateria.substring(5);
            
            clases.push({
                asignatura: materia,
                dia: dia,
                hora: hora,
                aula: parts[1] || '',
                seccion: parts[2] || ''
            });
        });
    }
    
    // Parsear exámenes del formato antiguo
    if (data.e && typeof data.e === 'string') {
        data.e.split(';').forEach(item => {
            if (!item) return;
            const parts = item.split('|');
            const fechaHoraMateria = parts[0];
            
            const dia = fechaHoraMateria.substring(0, 2);
            const mes = fechaHoraMateria.substring(2, 4);
            const fecha = `${dia}/${mes}`;
            const horaRaw = fechaHoraMateria.substring(4, 8);
            const hora = horaRaw.substring(0, 2) + ':' + horaRaw.substring(2, 4);
            const materia = fechaHoraMateria.substring(8);
            
            examenes.push({
                asignatura: materia,
                fecha: fecha,
                hora: hora,
                tipo: parts[1] === 'P' ? 'Parcial' : 'Final',
                aula: ''
            });
        });
    }
    
    return { clases, examenes, occasionalClasses: [] };
}

/**
 * Expande datos del formato compacto antiguo
 */
function expandOldCompactData(data) {
    return {
        clases: (data.c || []).map(c => ({
            asignatura: c.a,
            dia: c.d,
            hora: c.h,
            aula: c.au,
            semestre: c.s,
            turno: c.t,
            seccion: c.sc
        })),
        examenes: (data.e || []).map(e => ({
            asignatura: e.a,
            fecha: e.f,
            tipo: e.tp,
            hora: e.h,
            aula: e.au
        })),
        occasionalClasses: (data.o || []).map(o => ({
            asignatura: o.a,
            fecha: o.f,
            hora: o.h,
            aula: o.au
        }))
    };
}

/**
 * Muestra modal de confirmación para importar
 */
function showImportConfirmation(data) {
    const clasesCount = data.clases?.length || 0;
    const examenesCount = data.examenes?.length || 0;
    
    // Limpiar URL
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    
    const modal = document.createElement('div');
    modal.id = 'importModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
            <!-- Header -->
            <div class="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <i class="fas fa-download text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold">Horario Compartido</h3>
                        <p class="text-green-200 text-sm">Alguien te compartió su horario</p>
                    </div>
                </div>
            </div>
            
            <!-- Content -->
            <div class="p-6 space-y-4">
                <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <h4 class="font-semibold text-gray-700 dark:text-gray-200 mb-3">
                        <i class="fas fa-list-ul mr-2"></i>Contenido del horario:
                    </h4>
                    <ul class="space-y-2 text-gray-600 dark:text-gray-300">
                        <li class="flex items-center gap-2">
                            <i class="fas fa-book-open text-blue-500"></i>
                            <span>${clasesCount} clases regulares</span>
                        </li>
                        <li class="flex items-center gap-2">
                            <i class="fas fa-file-alt text-orange-500"></i>
                            <span>${examenesCount} exámenes</span>
                        </li>
                    </ul>
                </div>
                
                <div class="bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-4">
                    <p class="text-yellow-700 dark:text-yellow-300 text-sm">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Esto reemplazará tu horario actual
                    </p>
                </div>
                
                <!-- Buttons -->
                <div class="flex gap-3">
                    <button onclick="document.getElementById('importModal').remove()"
                            class="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 
                                   dark:hover:bg-gray-500 rounded-xl transition-colors
                                   text-gray-700 dark:text-gray-200 font-medium">
                        <i class="fas fa-times mr-2"></i>Cancelar
                    </button>
                    <button onclick="window._importSharedData()"
                            class="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white 
                                   rounded-xl transition-colors font-medium">
                        <i class="fas fa-check mr-2"></i>Importar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Guardar datos para importar
    window._sharedDataToImport = data;
    window._importSharedData = () => {
        importSharedData(data);
        modal.remove();
    };
    
    document.body.appendChild(modal);
}

/**
 * Importa los datos al estado
 */
function importSharedData(data) {
    try {
        state.clases = data.clases || [];
        state.examenes = data.examenes || [];
        state.occasionalClasses = data.occasionalClasses || [];
        state.fullSchedule = [...state.clases];
        state.fullExamData = [...state.examenes];
        state.fullOccasionalClasses = [...state.occasionalClasses];
        
        // Guardar en localStorage
        const saveData = {
            clases: state.clases,
            examenes: state.examenes,
            occasionalClasses: state.occasionalClasses,
            timestamp: Date.now()
        };
        localStorage.setItem('miHorarioFPUNA_v5', JSON.stringify(saveData));
        
        showToast('¡Horario importado correctamente!', 'success');
        
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    } catch (error) {
        console.error('[Share] Error importing data:', error);
        showToast('Error al importar el horario', 'error');
    }
}
