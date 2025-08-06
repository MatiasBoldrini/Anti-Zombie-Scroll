// Configuraciones por defecto
const DEFAULT_SETTINGS = {
    'youtube-scroll': true,
    'youtube-shorts': true,
    'youtube-shorts-nav': true,
    'instagram-scroll': true,
    'instagram-reels': true,
    'x-scroll': true
};

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

    } catch (error) {
        console.error('Error al cargar configuraciones:', error);
    }
});

// Manejar el toggle de switches
async function handleSwitchToggle(event) {
    const switchElement = event.currentTarget;
    const feature = switchElement.getAttribute('data-feature');

    if (!feature) return;

    // Toggle visual
    switchElement.classList.toggle('active');

    // Obtener nuevo estado
    const isActive = switchElement.classList.contains('active');

    try {
        // Guardar configuración
        await saveFeatureSetting(feature, isActive);

        // Notificar a los content scripts sobre el cambio
        await notifyContentScripts(feature, isActive);

        console.log(`${feature} ${isActive ? 'activado' : 'desactivado'}`);

    } catch (error) {
        console.error('Error al guardar configuración:', error);

        // Revertir cambio visual si hay error
        switchElement.classList.toggle('active');
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
            // Enviar mensaje al content script
            chrome.tabs.sendMessage(tab.id, {
                type: 'SETTING_CHANGED',
                feature: feature,
                value: isActive
            }).catch(error => {
                // Es normal que algunos tabs no tengan content script
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