// Configuraciones por defecto - simplificadas
const DEFAULT_SETTINGS = {
    'youtube': true,
    'youtube-hide-feed': false,
    'instagram': true,
    'x': true
};

// Lista de palabras para el desafío de verificación
const CHALLENGE_WORDS = [
    'zombie', 'seguro', 'scroll', 'adiccion', 'control',
    'tiempo', 'habito', 'pausa', 'enfoque', 'mental'
];

// Variables globales para el modal
let currentPlatform = null;
let currentWord = null;
let currentSwitchElement = null;

// Cargar configuraciones al inicializar
document.addEventListener('DOMContentLoaded', async function () {
    console.log('Popup cargado - AntiZombieScroll');

    try {
        // Cargar configuraciones guardadas
        const settings = await loadSettings();

        // Aplicar configuraciones a los switches
        Object.keys(settings).forEach(feature => {
            const switchElement = document.querySelector(`[data-feature="${feature}"]`);
            if (switchElement) {
                if (settings[feature]) {
                    switchElement.classList.add('active');
                } else {
                    switchElement.classList.remove('active');
                }
            }
        });

        // Agregar event listeners a todos los switches
        const switches = document.querySelectorAll('.switch');
        switches.forEach(switchElement => {
            switchElement.addEventListener('click', handleSwitchToggle);
        });

        // Event listeners para el modal
        setupModalEventListeners();

    } catch (error) {
        console.error('Error al cargar configuraciones:', error);
    }
});

// Configurar event listeners del modal
function setupModalEventListeners() {
    const modal = document.getElementById('verification-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const verifyBtn = document.getElementById('verify-btn');
    const wordInput = document.getElementById('word-input');

    cancelBtn.addEventListener('click', closeModal);
    verifyBtn.addEventListener('click', verifyWord);

    // Permitir verificar con Enter
    wordInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            verifyWord();
        }
    });

    // Limpiar mensaje de error al escribir
    wordInput.addEventListener('input', function () {
        const errorMessage = document.getElementById('error-message');
        errorMessage.classList.add('hidden');
    });
}

// Manejar el toggle de switches
async function handleSwitchToggle(event) {
    const switchElement = event.currentTarget;
    const feature = switchElement.getAttribute('data-feature');

    if (!feature) return;

    const isCurrentlyActive = switchElement.classList.contains('active');

    // Funciones que NO requieren verificación (solo toggle directo)
    const noVerificationFeatures = ['youtube-hide-feed'];

    // Si es una función que no requiere verificación, hacer toggle directo
    if (noVerificationFeatures.includes(feature)) {
        try {
            const newValue = !isCurrentlyActive;
            if (newValue) {
                switchElement.classList.add('active');
            } else {
                switchElement.classList.remove('active');
            }
            await saveFeatureSetting(feature, newValue);
            await notifyContentScripts(feature, newValue);
            console.log(`${feature} ${newValue ? 'activado' : 'desactivado'}`);
        } catch (error) {
            console.error('Error al guardar configuración:', error);
            // Revertir el cambio visual
            if (isCurrentlyActive) {
                switchElement.classList.add('active');
            } else {
                switchElement.classList.remove('active');
            }
        }
        return;
    }

    // Si está activado y el usuario quiere desactivarlo, mostrar modal de verificación
    if (isCurrentlyActive) {
        currentPlatform = feature;
        currentSwitchElement = switchElement;
        showVerificationModal();
        return;
    }

    // Si está desactivado, activarlo directamente
    try {
        switchElement.classList.add('active');
        await saveFeatureSetting(feature, true);
        await notifyContentScripts(feature, true);
        console.log(`${feature} activado`);
    } catch (error) {
        console.error('Error al guardar configuración:', error);
        switchElement.classList.remove('active');
    }
}

// Mostrar modal de verificación
function showVerificationModal() {
    const modal = document.getElementById('verification-modal');
    const challengeWord = document.getElementById('challenge-word');
    const wordInput = document.getElementById('word-input');
    const errorMessage = document.getElementById('error-message');

    // Seleccionar palabra aleatoria
    currentWord = CHALLENGE_WORDS[Math.floor(Math.random() * CHALLENGE_WORDS.length)];

    // Mostrar la palabra en el modal
    challengeWord.textContent = currentWord.toUpperCase();

    // Limpiar input y errores
    wordInput.value = '';
    errorMessage.classList.add('hidden');

    // Mostrar modal
    modal.classList.remove('hidden');

    // Enfocar en el input
    setTimeout(() => wordInput.focus(), 100);
}

// Cerrar modal
function closeModal() {
    const modal = document.getElementById('verification-modal');
    modal.classList.add('hidden');

    // Limpiar variables
    currentPlatform = null;
    currentWord = null;
    currentSwitchElement = null;
}

// Verificar palabra ingresada
async function verifyWord() {
    const wordInput = document.getElementById('word-input');
    const errorMessage = document.getElementById('error-message');
    const userInput = wordInput.value.toLowerCase().trim();

    // Verificar si la palabra está al revés
    const reversedWord = currentWord.split('').reverse().join('');

    if (userInput === reversedWord) {
        // Palabra correcta - desactivar protección
        try {
            currentSwitchElement.classList.remove('active');
            await saveFeatureSetting(currentPlatform, false);
            await notifyContentScripts(currentPlatform, false);

            console.log(`${currentPlatform} desactivado`);
            closeModal();

        } catch (error) {
            console.error('Error al guardar configuración:', error);
            currentSwitchElement.classList.add('active');
        }
    } else {
        // Palabra incorrecta - mostrar error
        errorMessage.classList.remove('hidden');
        wordInput.value = '';
        wordInput.focus();
    }
}

// Cargar configuraciones desde storage
async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
            resolve(result);
        });
    });
}

// Guardar una configuración específica
async function saveFeatureSetting(feature, value) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ [feature]: value }, () => {
            resolve();
        });
    });
}

// Notificar a los content scripts sobre cambios
async function notifyContentScripts(feature, isActive) {
    try {
        // Obtener la tab activa
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab) {
            // Enviar mensaje directamente con la característica simplificada
            chrome.tabs.sendMessage(tab.id, {
                type: 'SETTING_CHANGED',
                feature: feature,
                value: isActive
            }).catch(error => {
                console.log('No se pudo enviar mensaje al tab:', error.message);
            });
        }
    } catch (error) {
        console.log('Error al notificar content script:', error);
    }
}

// Función para resetear todas las configuraciones
function resetAllSettings() {
    chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
        location.reload();
    });
}