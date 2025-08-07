// Anti Zombie Scroll - Content Script
console.log('Anti Zombie Scroll activado');

// Configuraciones por defecto
const DEFAULT_SETTINGS = {
  'youtube-scroll': true,
  'youtube-shorts': true,
  'youtube-shorts-nav': true,
  'instagram-scroll': true,
  'instagram-reels': true,
  'x-scroll': true
};

// Variable global para configuraciones
let currentSettings = { ...DEFAULT_SETTINGS };

// Variables globales para cleanup
let scrollListeners = {
  wheel: null,
  keydown: null,
  touchmove: null,
  scroll: null
};

// Cargar configuraciones desde storage
async function loadSettings() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.runtime && chrome.runtime.id) {
      return new Promise((resolve) => {
        chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
          // Verificar si hubo un error de extensión invalidada
          if (chrome.runtime.lastError) {
            console.log('Error de contexto de extensión:', chrome.runtime.lastError);
            currentSettings = { ...DEFAULT_SETTINGS };
            resolve(DEFAULT_SETTINGS);
            return;
          }
          currentSettings = result;
          resolve(result);
        });
      });
    }
  } catch (error) {
    console.log('Error cargando configuraciones, usando por defecto:', error);
    currentSettings = { ...DEFAULT_SETTINGS };
  }
  return DEFAULT_SETTINGS;
}

// Escuchar mensajes del popup
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
  try {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        if (message.type === 'SETTING_CHANGED') {
          currentSettings[message.feature] = message.value;
          console.log(`Configuración actualizada: ${message.feature} = ${message.value}`);

          // Reinicializar con nueva configuración
          setTimeout(() => {
            init();
          }, 100);
        }
      } catch (error) {
        console.log('Error procesando mensaje:', error);
      }
    });
  } catch (error) {
    console.log('Error configurando listener de mensajes:', error);
  }
}

// Función para detectar el sitio actual
function getCurrentSite() {
  const hostname = window.location.hostname;
  if (hostname.includes('youtube.com')) return 'youtube';
  if (hostname.includes('instagram.com')) return 'instagram';
  if (hostname.includes('x.com') || hostname.includes('twitter.com')) return 'x';
  return null;
}

// Función para verificar si debemos bloquear scroll en la URL actual
function shouldBlockScroll() {
  const url = window.location.href;
  const pathname = window.location.pathname;

  // URLs específicas donde SÍ bloquear scroll vertical:

  // X (Twitter) - solo en explore y home
  if (url.includes('x.com/explore') || url.includes('x.com/home') ||
    (url.includes('x.com') && pathname === '/')) {
    console.log('✅ X: Bloqueando scroll en', pathname);
    return true;
  }

  // Instagram - solo en home (no en direct messages)
  if (url.includes('instagram.com') && !pathname.includes('/direct/')) {
    console.log('✅ Instagram: Bloqueando scroll en', pathname);
    return true;
  }

  // YouTube - solo en home
  if (url.includes('youtube.com') && (pathname === '/' || pathname.includes('/feed/'))) {
    console.log('✅ YouTube: Bloqueando scroll en', pathname);
    return true;
  }

  // En cualquier otro lugar, NO bloquear
  console.log('❌ No bloquear scroll en:', url);
  return false;
}

// Función para eliminar elementos por selector
function removeElements(selectors) {
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      el.style.display = 'none !important';
      el.remove();
    });
  });
}

// Función para LIMPIAR todos los event listeners de scroll
function removeScrollListeners() {
  console.log('🧹 Limpiando event listeners de scroll');

  if (scrollListeners.wheel) {
    document.removeEventListener('wheel', scrollListeners.wheel, { capture: true });
    scrollListeners.wheel = null;
  }

  if (scrollListeners.keydown) {
    document.removeEventListener('keydown', scrollListeners.keydown, { capture: true });
    scrollListeners.keydown = null;
  }

  if (scrollListeners.touchmove) {
    document.removeEventListener('touchmove', scrollListeners.touchmove, { capture: true });
    scrollListeners.touchmove = null;
  }

  if (scrollListeners.scroll) {
    window.removeEventListener('scroll', scrollListeners.scroll);
    scrollListeners.scroll = null;
  }

  // Limpiar estilos de overflow que puedan haber quedado
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
}

// Función simple para bloquear SOLO scroll vertical (permite horizontal - flechas)
function blockVerticalScroll() {
  console.log('🚫 Bloqueando scroll vertical');

  // Primero limpiar cualquier listener previo
  removeScrollListeners();

  // Crear y guardar las funciones listener
  scrollListeners.wheel = function (e) {
    // Solo bloquear si es scroll vertical (deltaY)
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Permitir scroll horizontal (deltaX) - flechas izquierda/derecha
  };

  scrollListeners.keydown = function (e) {
    const verticalScrollKeys = [32, 33, 34, 35, 36, 38, 40]; // space, page up/down, home, end, up, down
    const horizontalKeys = [37, 39]; // left, right arrows - PERMITIR ESTAS

    if (verticalScrollKeys.includes(e.keyCode) && !horizontalKeys.includes(e.keyCode)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  scrollListeners.touchmove = function (e) {
    // Solo prevenir si es movimiento vertical
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaY = Math.abs(touch.clientY - (window.lastTouchY || touch.clientY));
      const deltaX = Math.abs(touch.clientX - (window.lastTouchX || touch.clientX));

      if (deltaY > deltaX) { // Movimiento más vertical que horizontal
        e.preventDefault();
        e.stopPropagation();
      }

      window.lastTouchY = touch.clientY;
      window.lastTouchX = touch.clientX;
    }
  };

  // Bloquear scroll programático vertical
  let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
  scrollListeners.scroll = function () {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Solo bloquear cambios verticales
    if (currentScrollTop !== lastScrollTop) {
      window.scrollTo(window.pageXOffset, lastScrollTop);
    }
  };

  // Añadir los event listeners
  document.addEventListener('wheel', scrollListeners.wheel, { passive: false, capture: true });
  document.addEventListener('keydown', scrollListeners.keydown, { passive: false, capture: true });
  document.addEventListener('touchmove', scrollListeners.touchmove, { passive: false, capture: true });
  window.addEventListener('scroll', scrollListeners.scroll, { passive: false });
}

// Configuración específica para YouTube
function handleYouTube() {
  console.log('🎬 YouTube: Configurando bloqueos');

  // Solo bloquear scroll si está habilitado Y estamos en la URL correcta
  if (currentSettings['youtube-scroll'] && shouldBlockScroll()) {
    blockVerticalScroll();
  } else {
    // Si no debe bloquear, limpiar listeners previos
    removeScrollListeners();
  }

  // Limpiar elementos de Shorts si está habilitado
  if (currentSettings['youtube-shorts']) {
    removeYouTubeElements();
  }
}

// Función simple para remover elementos de YouTube
function removeYouTubeElements() {
  const youtubeSelectors = [
    // Botones de Shorts
    'a[href="/shorts"]',
    'a[href*="/shorts"]',
    '[title="Shorts"]',
    '[aria-label="Shorts"]',

    // Contenido de Shorts
    'ytd-reel-shelf-renderer',
    'ytd-shorts-shelf-renderer',
    '[is-shorts]',
    'ytd-compact-video-renderer[is-shorts]'
  ];

  removeElements(youtubeSelectors);
}

// Configuración específica para Instagram
function handleInstagram() {
  console.log('📷 Instagram: Configurando bloqueos');

  // Solo bloquear scroll si está habilitado Y estamos en la URL correcta
  if (currentSettings['instagram-scroll'] && shouldBlockScroll()) {
    blockVerticalScroll();
  } else {
    // Si no debe bloquear, limpiar listeners previos
    removeScrollListeners();
  }

  // Limpiar elementos de Reels si está habilitado
  if (currentSettings['instagram-reels']) {
    removeInstagramElements();
  }
}

// Función simple para remover elementos de Instagram
function removeInstagramElements() {
  const instagramSelectors = [
    // Botones de Reels y Explorar
    'a[href="/reels/"]',
    'a[href*="/reels/"]',
    'a[href="/explore/"]',
    'a[href*="/explore/"]',
    '[aria-label="Reels"]',
    '[aria-label="Explorar"]',
    '[aria-label="Explore"]',
    '[aria-label="Carretes"]',
    '[aria-label="Descubrir"]',

    // Iconos
    'svg[aria-label="Reels"]',
    'svg[aria-label="Explorar"]',
    'svg[aria-label="Carretes"]'
  ];

  removeElements(instagramSelectors);
}

// Configuración específica para X (Twitter)
function handleX() {
  console.log('🐦 X: Configurando bloqueos');

  // Solo bloquear scroll si está habilitado Y estamos en la URL correcta
  if (currentSettings['x-scroll'] && shouldBlockScroll()) {
    blockVerticalScroll();
  } else {
    // Si no debe bloquear, limpiar listeners previos
    removeScrollListeners();
  }
}



// 🚀 Inicialización principal SIMPLE
async function init() {
  try {
    const site = getCurrentSite();
    const url = window.location.href;

    console.log(`\n🔄 INIT: ${site} en ${url}`);

    // Solo ejecutar en sitios específicos
    if (!site) {
      console.log('❌ Sitio no compatible');
      return;
    }

    // Cargar configuraciones
    await loadSettings();
    console.log('⚙️ Configuraciones:', currentSettings);

    // Aplicar configuraciones según el sitio
    switch (site) {
      case 'youtube':
        handleYouTube();
        break;
      case 'instagram':
        handleInstagram();
        break;
      case 'x':
        handleX();
        break;
      default:
        console.log('❌ Sitio no soportado');
    }

    console.log('✅ Init completado\n');
  } catch (error) {
    console.log('❌ Error en init:', error);
  }
}

// Función para detectar cambios de URL (solo eventos del navegador)
function detectPageChanges() {
  try {
    let currentUrl = window.location.href;
    const currentSite = getCurrentSite();

    console.log(`🔧 SETUP: Detectando cambios en ${currentSite} desde ${currentUrl}`);

    // ✨ Función SIMPLE para determinar si necesitamos reiniciar
    function needsRestart(oldUrl, newUrl) {
      try {
        const oldPath = new URL(oldUrl).pathname;
        const newPath = new URL(newUrl).pathname;

        // Solo reiniciar si cambió la sección principal
        const oldSection = oldPath.split('/')[1] || 'home';
        const newSection = newPath.split('/')[1] || 'home';

        const shouldRestart = oldSection !== newSection;

        if (shouldRestart) {
          console.log(`🔄 Cambio de sección: ${oldSection} → ${newSection}`);
        } else {
          console.log(`➡️ Navegación interna: ${oldPath} → ${newPath}`);
        }

        return shouldRestart;
      } catch (error) {
        console.log('❌ Error analizando URL:', error);
        return true;
      }
    }

    // 🔍 Función para verificar cambios de URL
    function checkUrlChange() {
      const newUrl = window.location.href;
      if (currentUrl !== newUrl) {
        console.log(`🔍 URL CAMBIÓ: "${currentUrl}" → "${newUrl}"`);

        if (needsRestart(currentUrl, newUrl)) {
          console.log(`⚡ REINICIANDO...`);
          currentUrl = newUrl;
          setTimeout(() => {
            init().catch(error => console.log('❌ Error reiniciando:', error));
          }, 200);
        } else {
          console.log(`➡️ Solo actualizando URL interna`);
          currentUrl = newUrl;
        }
      }
    }

    // 🎯 Escuchar eventos de navegación
    window.addEventListener('popstate', () => {
      console.log('🔙 POPSTATE detectado');
      setTimeout(checkUrlChange, 50);
    });

    // 🎯 Interceptar pushState/replaceState para SPAs
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      console.log('📤 PUSH STATE:', args[2] || 'sin URL');
      originalPushState.apply(history, args);
      setTimeout(checkUrlChange, 50);
    };

    history.replaceState = function (...args) {
      console.log('🔄 REPLACE STATE:', args[2] || 'sin URL');
      originalReplaceState.apply(history, args);
      setTimeout(checkUrlChange, 50);
    };

    // 🚨 DEBUGGING: Verificación adicional cada 2 segundos (TEMPORAL)
    setInterval(() => {
      checkUrlChange();
    }, 2000);

  } catch (error) {
    console.log('Error configurando detección de cambios de página:', error);
  }
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init().catch(error => console.log('Error en init inicial (DOMContentLoaded):', error));
    detectPageChanges();
  });
} else {
  init().catch(error => console.log('Error en init inicial (DOM ya listo):', error));
  detectPageChanges();
}