# 🚫 Anti Zombie Scroll - Extensión de Chrome

Es una extensión de Chrome diseñada para combatir el zombie scrolling de manera pasiva, bloqueando elementos adictivos en YouTube, Instagram y X (Twitter).



## ✨ Características

### YouTube
- ❌ Elimina el botón de "Shorts" de la barra lateral
- ❌ Oculta todos los shorts sugeridos en la página principal
- ❌ Bloquea los botones de navegación cuando estás viendo un short
- ❌ Previene la navegación entre shorts

### Instagram
- 🚫 Bloquea completamente el scroll (rueda del mouse, teclas, táctil)
- ❌ Oculta el botón de "Reels"
- ❌ Oculta el botón de "Explorar"
- 🔒 Fija la vista en la posición actual

### X (Twitter)
- 🚫 Bloquea completamente el scroll
- 🔒 Previene el scroll infinito en el timeline

## 🛠️ Instalación

1. **Descarga o clona este repositorio**
2. **Abre Chrome y ve a** `chrome://extensions/`
3. **Activa el "Modo de desarrollador"** (toggle en la esquina superior derecha)
4. **Haz clic en "Cargar extensión sin empaquetar"**
5. **Selecciona la carpeta** donde descargaste esta extensión
6. **¡Listo!** La extensión estará activa

## 🎯 Uso

La extensión funciona automáticamente en:
- `*.youtube.com`
- `*.instagram.com` 
- `*.x.com`
- `*.twitter.com`

No necesitas configurar nada. Una vez instalada, los bloqueos se aplicarán automáticamente cuando visites estos sitios.


## 📁 Estructura del Proyecto

```
UnReel/
├── manifest.json          # Configuración de la extensión
├── content-script.js      # Script principal de bloqueo
├── styles.css            # Estilos CSS para ocultar elementos
├── popup.html            # Interfaz del popup
├── icons/                # Iconos de la extensión
└── README.md             # Este archivo
```

## ⚠️ Nota Importante

Esta extensión está diseñada para ayudarte a tener un consumo más consciente de redes sociales. Si necesitas acceder a alguna funcionalidad bloqueada, puedes:

1. Desactivar temporalmente la extensión
2. Usar modo incógnito (si no tienes la extensión habilitada allí)

## 🤝 Contribuir

¿Encontraste un bug o quieres sugerir una mejora? ¡Abre un issue o envía un pull request!

## 📄 Licencia

Este proyecto es de código abierto. Úsalo, modifícalo y compártelo libremente.

---

**¡Recupera el control de tu tiempo en internet! 🕰️**