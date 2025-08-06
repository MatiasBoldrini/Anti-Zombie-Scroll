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

// Cargar configuraciones desde storage
async function loadSettings() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return new Promise((resolve) => {
        chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
          currentSettings = result;
          resolve(result);
        });
      });
    }
  } catch (error) {
    console.log('Error cargando configuraciones, usando por defecto:', error);
  }
  return DEFAULT_SETTINGS;
}

// Escuchar mensajes del popup
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SETTING_CHANGED') {
      currentSettings[message.feature] = message.value;
      console.log(`Configuración actualizada: ${message.feature} = ${message.value}`);

      // Reinicializar con nueva configuración
      setTimeout(() => {
        init();
      }, 100);
    }
  });
}

// Función para detectar el sitio actual
function getCurrentSite() {
  const hostname = window.location.hostname;
  if (hostname.includes('youtube.com')) return 'youtube';
  if (hostname.includes('instagram.com')) return 'instagram';
  if (hostname.includes('x.com') || hostname.includes('twitter.com')) return 'x';
  return null;
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

// Función para bloquear scroll con excepciones
function blockScroll(allowedSelectors = []) {
  // Función para verificar si el elemento está en una zona permitida
  function isInAllowedArea(element) {
    if (!element) return false;

    // Verificar si el elemento o algún ancestro coincide con los selectores permitidos
    let current = element;
    while (current && current !== document.body) {
      for (const selector of allowedSelectors) {
        try {
          if (current.matches && current.matches(selector)) {
            return true;
          }
        } catch (e) {
          // Ignorar errores de selectores inválidos
        }
      }
      current = current.parentElement;
    }
    return false;
  }

  // Prevenir scroll con rueda del mouse
  document.addEventListener('wheel', function (e) {
    if (!isInAllowedArea(e.target)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { passive: false, capture: true });

  // Prevenir scroll con teclas
  document.addEventListener('keydown', function (e) {
    const scrollKeys = [32, 33, 34, 35, 36, 37, 38, 39, 40]; // space, page up/down, home, end, arrow keys
    if (scrollKeys.includes(e.keyCode) && !isInAllowedArea(e.target)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { passive: false, capture: true });

  // Prevenir scroll táctil
  document.addEventListener('touchmove', function (e) {
    if (!isInAllowedArea(e.target)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { passive: false, capture: true });

  // Bloquear scroll programático solo en el contenedor principal
  let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
  window.addEventListener('scroll', function (e) {
    // Solo bloquear scroll si no está en una zona permitida
    if (!isInAllowedArea(e.target)) {
      window.scrollTo(0, lastScrollTop);
    } else {
      // Actualizar la posición permitida
      lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    }
  }, { passive: false });
}

// Configuración específica para YouTube
function handleYouTube() {
  console.log('Configurando bloqueos para YouTube');

  // Detectar si estamos viendo un video específico
  const isWatchingVideo = window.location.pathname.includes('/watch');
  const isHomePage = window.location.pathname === '/' || window.location.pathname.includes('/feed/');

  // Si estamos viendo un video, solo limpiar elementos
  if (isWatchingVideo) {
    console.log('Viendo video en YouTube - solo limpieza de elementos');
    if (currentSettings['youtube-shorts']) {
      executeYouTubeElementCleanup();
    }
    return;
  }

  // Solo aplicar bloqueos en la página principal si está habilitado
  if (!isHomePage) {
    console.log('No estamos en home de YouTube - no aplicar bloqueos de scroll');
    return;
  }

  // Verificar si el bloqueo de scroll está habilitado
  if (currentSettings['youtube-scroll']) {
    // Áreas donde SÍ permitir scroll (solo para homepage)
    const allowedScrollAreas = [
      // Menús y modales
      'ytd-menu-popup-renderer',
      '[role="dialog"]',
      '[role="menu"]',

      // Configuraciones y guías
      'ytd-mini-guide-renderer',

      // Menús desplegables
      'ytd-dropdown-renderer'
    ];

    // Solo bloquear scroll en homepage, excepto en áreas permitidas
    blockScroll(allowedScrollAreas);
  }

  // Ejecutar bloqueos específicos de homepage
  executeYouTubeHomeBlocks();
}

// Función para limpiar elementos de Shorts (para páginas de video)
function executeYouTubeElementCleanup() {
  // Selectores para shorts y elementos relacionados
  const youtubeSelectors = [
    // Botón de Shorts en la barra lateral
    'a[href="/shorts"]',
    'a[href*="/shorts"]',
    '[title="Shorts"]',
    '[aria-label="Shorts"]',

    // Shorts en recomendaciones
    'ytd-rich-shelf-renderer[is-shorts]',
    'ytd-reel-shelf-renderer',
    'ytd-shorts-shelf-renderer',
    '[is-shorts]',
    '[data-content-type="shorts"]',
    'ytd-compact-video-renderer[is-shorts]'
  ];

  removeElements(youtubeSelectors);

  // Observar cambios en el DOM
  const observer = new MutationObserver(() => executeYouTubeElementCleanup());
  observer.observe(document.body, { childList: true, subtree: true });

  // Re-ejecutar cada segundo
  setInterval(executeYouTubeElementCleanup, 1000);
}

// Función para bloqueos específicos de homepage
function executeYouTubeHomeBlocks() {
  // Selectores para shorts y elementos relacionados  
  const youtubeSelectors = [
    // Botón de Shorts en la barra lateral
    'a[href="/shorts"]',
    'a[href*="/shorts"]',
    '[title="Shorts"]',
    '[aria-label="Shorts"]',

    // Shorts en la página principal
    'ytd-rich-shelf-renderer[is-shorts]',
    'ytd-reel-shelf-renderer',
    'ytd-shorts-shelf-renderer',
    '#shorts-container',
    '[is-shorts]',

    // Botones de navegación en shorts
    '#navigation-button-down',
    '#navigation-button-up',
    '.ytd-shorts-player-controls',
    'ytd-shorts-player-controls',

    // Panel lateral de shorts
    '#shorts-inner-container #secondary',
    'ytd-shorts-secondary-info-renderer',

    // Sugerencias de shorts
    '[data-content-type="shorts"]',
    'ytd-compact-video-renderer[is-shorts]'
  ];

  // Función interna para ejecutar bloqueos de homepage
  function executeYouTubeHomeBlocksInternal() {
    // Remover elementos de Shorts solo si está habilitado
    if (currentSettings['youtube-shorts']) {
      removeElements(youtubeSelectors);
    }

    // Solo bloquear scroll del feed principal en homepage si está habilitado
    if (currentSettings['youtube-scroll']) {
      const primaryContainer = document.querySelector('#primary, ytd-two-column-browse-results-renderer');
      if (primaryContainer && !primaryContainer.hasAttribute('data-scroll-blocked')) {
        primaryContainer.style.overflow = 'hidden !important';
        primaryContainer.style.height = '100vh !important';
        primaryContainer.setAttribute('data-scroll-blocked', 'true');
      }
    }

    // Detectar si estamos en una página de shorts y bloquear navegación
    if (window.location.pathname.includes('/shorts/') && currentSettings['youtube-shorts-nav']) {
      // Ocultar botones de navegación específicos de shorts
      const shortNavButtons = document.querySelectorAll('#navigation-button-down, #navigation-button-up');
      shortNavButtons.forEach(btn => {
        if (btn) {
          btn.style.display = 'none !important';
          btn.remove();
        }
      });

      // Bloquear swipe/scroll en shorts
      const shortsContainer = document.querySelector('#shorts-container, #player-container');
      if (shortsContainer) {
        shortsContainer.style.overflow = 'hidden !important';
        shortsContainer.style.height = '100vh !important';
      }
    }
  }

  // Ejecutar inmediatamente
  executeYouTubeHomeBlocksInternal();

  // Observar cambios en el DOM para content dinámico
  const observer = new MutationObserver(executeYouTubeHomeBlocksInternal);
  observer.observe(document.body, { childList: true, subtree: true });

  // Re-ejecutar cada segundo para asegurar que se mantengan los bloqueos
  setInterval(executeYouTubeHomeBlocksInternal, 1000);
}

// Configuración específica para Instagram
function handleInstagram() {
  console.log('Configurando bloqueos para Instagram');

  // Detectar si estamos en mensajes directos
  const isDirectMessages = window.location.pathname.includes('/direct/');

  // Si estamos en mensajes directos, permitir scroll completo
  if (isDirectMessages) {
    console.log('En mensajes directos de Instagram - scroll permitido');
    // Solo limpiar elementos si está habilitado
    if (currentSettings['instagram-reels']) {
      executeInstagramElementCleanup();
    }
    return;
  }

  // Solo aplicar bloqueos si está habilitado
  if (!currentSettings['instagram-scroll']) {
    console.log('Bloqueo de scroll deshabilitado en Instagram');
    // Solo limpiar elementos si está habilitado
    if (currentSettings['instagram-reels']) {
      executeInstagramElementCleanup();
    }
    return;
  }

  // Selectores de áreas donde SÍ permitir scroll
  const allowedScrollAreas = [
    // Historias (stories)
    '[role="dialog"]', // Modal de historias
    '[data-testid="stories-viewer"]',
    '.story-container',

    // Mensajes directos - selectores más específicos
    '[data-testid="direct-messaging"]',
    '[data-testid="thread-list"]',
    '[data-testid="message-list"]',
    '[role="log"]', // Lista de mensajes
    '.message-container',
    '.thread-container',

    // Lista de chats en la barra lateral
    'div[role="main"] > div > div > div', // Contenedor principal de DM
    'div[style*="flex-direction: column"]', // Columnas de navegación
    'div[style*="overflow-y: auto"]', // Elementos con scroll explícito
    'div[style*="overflow: auto"]',

    // Chats individuales
    '[data-testid="conversation-viewer"]',
    '[data-testid="message-composer"]',

    // Navegación entre chats
    'nav[role="navigation"]',
    '[data-testid="inbox-list"]',

    // Selectores genéricos para listas de conversaciones
    'div[role="listbox"]',
    'div[role="list"]',
    'ul[role="list"]',

    // Scroll horizontal en historias
    '[data-testid="story-viewer-list"]',

    // Contenedor específico de mensajes directos
    'section[role="main"]',
    'main[role="main"]'
  ];

  // Si estamos en mensajes directos, permitir más scroll
  if (isDirectMessages) {
    allowedScrollAreas.push(
      'main',
      '[role="main"]',
      '.thread-item',
      '.message-item'
    );
  }

  // Bloquear scroll excepto en áreas permitidas
  blockScroll(allowedScrollAreas);

  // Ejecutar bloqueos de Instagram
  executeInstagramBlocks();
}

// Función para limpiar elementos de Instagram (solo elementos)
function executeInstagramElementCleanup() {
  const instagramSelectors = [
    // Botones de Reels y Explorar
    'a[href="/reels/"]',
    'a[href*="/reels/"]',
    'a[href="/explore/"]',
    'a[href*="/explore/"]',
    '[aria-label="Reels"]',
    '[aria-label="Explorar"]',
    '[aria-label="Explore"]',

    // En español
    '[aria-label="Carretes"]',
    '[aria-label="Descubrir"]',

    // Iconos y enlaces específicos
    'svg[aria-label="Reels"]',
    'svg[aria-label="Explorar"]',
    'svg[aria-label="Explore"]',
    'svg[aria-label="Carretes"]',

    // Tabs de navegación
    'div[role="tablist"] a[href*="/reels/"]',
    'div[role="tablist"] a[href*="/explore/"]'
  ];

  removeElements(instagramSelectors);

  // Observar cambios en el DOM
  const observer = new MutationObserver(() => executeInstagramElementCleanup());
  observer.observe(document.body, { childList: true, subtree: true });

  // Re-ejecutar cada segundo
  setInterval(executeInstagramElementCleanup, 1000);
}

// Función principal de bloqueos de Instagram
function executeInstagramMainBlocks() {
  // Selectores para Instagram
  const instagramSelectors = [
    // Botones de Reels y Explorar
    'a[href="/reels/"]',
    'a[href*="/reels/"]',
    'a[href="/explore/"]',
    'a[href*="/explore/"]',
    '[aria-label="Reels"]',
    '[aria-label="Explorar"]',
    '[aria-label="Explore"]',

    // En español
    '[aria-label="Carretes"]',
    '[aria-label="Descubrir"]',

    // Iconos y enlaces específicos
    'svg[aria-label="Reels"]',
    'svg[aria-label="Explorar"]',
    'svg[aria-label="Explore"]',
    'svg[aria-label="Carretes"]',

    // Tabs de navegación
    'div[role="tablist"] a[href*="/reels/"]',
    'div[role="tablist"] a[href*="/explore/"]'
  ];

  function executeInstagramBlocks() {
    // Remover elementos solo si está habilitado
    if (currentSettings['instagram-reels']) {
      removeElements(instagramSelectors);
    }

    // Solo bloquear scroll del feed principal si está habilitado y no estamos en DM
    if (currentSettings['instagram-scroll'] && !isDirectMessages) {
      // Buscar el contenedor del feed principal y bloquearlo específicamente
      const feedContainer = document.querySelector('main section > div');
      if (feedContainer && !feedContainer.hasAttribute('data-scroll-blocked')) {
        feedContainer.style.overflow = 'hidden !important';
        feedContainer.style.height = '100vh !important';
        feedContainer.setAttribute('data-scroll-blocked', 'true');
      }
    }

    // Asegurar que las historias puedan hacer scroll
    const storyContainers = document.querySelectorAll('[role="dialog"], [data-testid="stories-viewer"]');
    storyContainers.forEach(container => {
      container.style.overflow = 'auto !important';
      container.style.height = 'auto !important';
    });

    // Asegurar que los mensajes directos puedan hacer scroll
    const messageContainers = document.querySelectorAll([
      '[data-testid="thread-list"]',
      '[role="log"]',
      '[data-testid="conversation-viewer"]',
      'div[role="main"] > div > div > div', // Contenedor principal de DM
      'div[style*="overflow-y: auto"]',
      'div[style*="overflow: auto"]',
      'div[role="listbox"]',
      'div[role="list"]'
    ].join(', '));

    messageContainers.forEach(container => {
      container.style.overflow = 'auto !important';
      container.style.height = 'auto !important';
      // Asegurar que no se bloquee el scroll en estos contenedores
      container.style.touchAction = 'auto !important';
      container.style.pointerEvents = 'auto !important';
    });
  }

  executeInstagramBlocks();

  const observer = new MutationObserver(executeInstagramBlocks);
  observer.observe(document.body, { childList: true, subtree: true });

  setInterval(executeInstagramBlocks, 1000);
}

// Configuración específica para X (Twitter)
function handleX() {
  console.log('Configurando bloqueos para X');

  // Detectar si estamos en mensajes directos
  const isMessages = window.location.pathname.includes('/messages');
  const isHome = window.location.pathname.includes('/home') || window.location.pathname === '/';

  // Si estamos en mensajes, NO bloquear scroll en absoluto
  if (isMessages) {
    console.log('En página de mensajes de X - scroll permitido completamente');
    return; // Salir sin aplicar ningún bloqueo
  }

  // Solo aplicar bloqueos si estamos en /home o página principal Y está habilitado
  if (!isHome || !currentSettings['x-scroll']) {
    console.log('No estamos en /home o bloqueo deshabilitado - no aplicar bloqueos de scroll');
    return;
  }

  // Selectores de áreas donde SÍ permitir scroll (solo para /home)
  const allowedScrollAreas = [
    // Mensajes directos emergentes
    '[data-testid="dm-drawer"]',
    '[data-testid="conversation-container"]',
    '[data-testid="DMDrawer"]',

    // Modales y diálogos
    '[role="dialog"]',
    '[data-testid="modal"]',

    // Listas en configuraciones
    '[data-testid="settingsModal"]',

    // Navegación en listas
    '[data-testid="sidebarColumn"]',

    // Menús desplegables
    '[data-testid="Dropdown"]',
    '[role="menu"]'
  ];

  // Solo bloquear scroll en /home, excepto en áreas permitidas
  blockScroll(allowedScrollAreas);

  function executeXBlocks() {
    // Solo ejecutar si estamos en /home
    const isHome = window.location.pathname.includes('/home') || window.location.pathname === '/';
    if (!isHome) return;

    // Solo bloquear scroll del timeline principal en /home
    const timeline = document.querySelector('[data-testid="primaryColumn"]');
    if (timeline && !timeline.hasAttribute('data-scroll-blocked')) {
      timeline.style.overflow = 'hidden !important';
      timeline.style.height = '100vh !important';
      timeline.setAttribute('data-scroll-blocked', 'true');
    }

    // Asegurar que mensajes directos emergentes puedan hacer scroll
    const dmContainers = document.querySelectorAll([
      '[data-testid="dm-drawer"]',
      '[data-testid="conversation-container"]',
      '[data-testid="DMDrawer"]'
    ].join(', '));
    dmContainers.forEach(container => {
      container.style.overflow = 'auto !important';
      container.style.height = 'auto !important';
      container.style.touchAction = 'auto !important';
      container.style.pointerEvents = 'auto !important';
    });

    // Asegurar que modales puedan hacer scroll
    const modalContainers = document.querySelectorAll('[role="dialog"], [data-testid="modal"]');
    modalContainers.forEach(container => {
      container.style.overflow = 'auto !important';
      container.style.height = 'auto !important';
      container.style.touchAction = 'auto !important';
    });
  }

  executeXBlocks();

  const observer = new MutationObserver(executeXBlocks);
  observer.observe(document.body, { childList: true, subtree: true });

  setInterval(executeXBlocks, 1000);
}

// Inicialización principal
async function init() {
  const site = getCurrentSite();

  // Solo ejecutar en sitios específicos
  if (!site) {
    console.log('Sitio no compatible con Anti Zombie Scroll');
    return;
  }

  // Cargar configuraciones
  await loadSettings();
  console.log(`Anti Zombie Scroll iniciado en: ${site}`, currentSettings);

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
      console.log('Sitio no compatible con Anti Zombie Scroll');
  }
}

// Función para detectar cambios de página (SPA navigation)
function detectPageChanges() {
  let currentUrl = window.location.href;

  // Observar cambios en la URL para SPAs
  const observer = new MutationObserver(() => {
    if (currentUrl !== window.location.href) {
      currentUrl = window.location.href;
      console.log('Cambio de página detectado, reiniciando...');

      // Reiniciar la extensión en la nueva página
      setTimeout(init, 500);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // También escuchar eventos de navegación del historial
  window.addEventListener('popstate', () => {
    setTimeout(init, 500);
  });
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    detectPageChanges();
  });
} else {
  init();
  detectPageChanges();
}