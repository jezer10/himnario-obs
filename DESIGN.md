---
name: Himnario Adventista Broadcast
description: Reproductor sobrio con la letra como protagonista y colores sincronizables con OBS.
colors:
  primary: '#284cb8'
  primary-hover: '#355dca'
  primary-active: '#203d93'
  dark-base: '#0c0d0f'
  dark-control: '#303134'
  dark-input: '#191a1d'
  dark-hover: '#3d3e42'
  dark-pressed: '#232427'
  dark-border: '#393a3e'
  dark-text: '#f5f5f5'
  dark-muted: '#a4a4ab'
  dark-focus: '#dedee2'
  dark-selection: '#424348'
  light-base: 'rgb(229,229,229)'
  light-control: 'rgb(245,245,245)'
  light-input: 'rgb(245,245,245)'
  light-hover: 'rgb(254,254,254)'
  light-pressed: 'rgb(211,211,211)'
  light-border: 'rgb(140,140,140)'
  light-text: '#0A0A0A'
  light-muted: '#646464'
  light-focus: '#718CDC'
  light-selection: 'rgb(140,181,255)'
  connected: '#65be91'
typography:
  display:
    fontFamily: 'Manrope, "Segoe UI", sans-serif'
    fontSize: 'clamp(20px, 3.6vw, 28px)'
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: '-0.025em'
  title:
    fontFamily: 'Manrope, "Segoe UI", sans-serif'
    fontSize: 'clamp(17px, 3vw, 24px)'
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: '-0.025em'
  body:
    fontFamily: 'Manrope, "Segoe UI", system-ui, sans-serif'
    fontSize: '13px'
  neighbor:
    fontFamily: 'Manrope, "Segoe UI", sans-serif'
    fontSize: 'clamp(20px, 3.6vw, 28px)'
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: 'Manrope, "Segoe UI", sans-serif'
    fontSize: '13px'
  compact-lyrics:
    fontFamily: 'Manrope, "Segoe UI", sans-serif'
    fontSize: '18px'
    fontWeight: 500
    lineHeight: 1.5
  compact-title:
    fontFamily: 'Manrope, "Segoe UI", sans-serif'
    fontSize: '16px'
    fontWeight: 600
    lineHeight: 1.35
  compact-label:
    fontFamily: 'Manrope, "Segoe UI", sans-serif'
    fontSize: '11px'
  field:
    fontFamily: 'Manrope, "Segoe UI", sans-serif'
    fontSize: '12px'
  compact-playback:
    fontFamily: 'Manrope, "Segoe UI", sans-serif'
    fontSize: '14px'
    fontWeight: 500
  empty:
    fontFamily: 'Manrope, "Segoe UI", sans-serif'
    fontSize: '22px'
    fontWeight: 500
rounded:
  xs: '2px'
  sm: '3px'
  md: '4px'
  xl: '6px'
  search: '12px'
  dialog-field: '10px'
  overlay: '16px'
  capsule: '999px'
spacing:
  small: '8px'
  medium: '12px'
  compact-gap: '16px'
  deck-gap: '20px'
  deck-padding: 'clamp(16px, 5vw, 36px)'
components:
  playback-dark:
    backgroundColor: '{colors.dark-control}'
    textColor: '{colors.dark-text}'
    rounded: '{rounded.capsule}'
    padding: '12px 20px'
  playback-light:
    backgroundColor: '{colors.light-control}'
    textColor: '{colors.light-text}'
    rounded: '{rounded.capsule}'
    padding: '12px 20px'
  search-dark:
    backgroundColor: '{colors.dark-input}'
    textColor: '{colors.dark-text}'
    rounded: '{rounded.search}'
    padding: '10px 12px'
---

# Design System: Himnario Adventista Broadcast

## Overview

**Dirección aprobada: reproductor limpio, letra protagonista.** Una superficie casi negra, Manrope y controles suaves crean una interfaz tranquila. La jerarquía se construye con tamaño, espacio y contraste; el texto del himno recibe la mayor atención.

La dirección procede de la referencia de reproductor aprobada por el usuario. Los colores claros y sincronizados con OBS conservan la misma tipografía y geometría. Este documento captura la implementación; la composición particular del panel permanece en su ficha de superficie.

Características: neutros sobrios, lectura dominante, estados discretos y controles reconocibles.

## Colors

### Primary

El azul primario pertenece a las acciones y estados del sistema PrimeVue. La reproducción del panel usa una cápsula neutra. El verde de conexión se limita al pequeño indicador de OBS conectado; no significa emisión en directo.

### Neutral

Los roles `dark-*` definen el modo oscuro manual: base casi negra, controles gris carbón, texto blanco suave y texto secundario gris. Los roles `light-*` conservan la paleta Light de OBS.

**Regla de sincronización.** En código, consumir roles PrimeVue (`--p-text-color`, `--p-content-background`, etc.), no fijar los valores oscuros sobre componentes. El preset resuelve cada rol con `var(--obs-<rol>, light-dark(...))`; los colores recibidos de OBS tienen prioridad. Las paletas completas siguen en `src/theme/obs-palettes.json`.

## Typography

Manrope sirve tanto a la letra como a controles y títulos; Segoe UI y sans-serif son los respaldos. La letra activa emplea el rol display y los versos vecinos emplean neighbor, con color atenuado. Los tiempos usan cifras tabulares. No transformar títulos ni letras a mayúsculas decorativas.

Hasta 460 px de altura se aplican compact-lyrics, compact-title y compact-label (número de himno y tiempos). La búsqueda y los tiempos normales usan 12 px; la cápsula usa 16 px y baja a 14 px hasta 380 px de ancho. El estado vacío usa 22 px y una indicación secundaria de 13 px.

La fuente variable local está en `public/fonts/Manrope-Variable.ttf`, se carga mediante `@font-face` con pesos 200–800 y `font-display: swap`. Autoría: The Manrope Project Authors, según `public/fonts/OFL.txt`; proyecto upstream: https://github.com/googlefonts/manrope. Licencia SIL Open Font License 1.1, incluida junto al archivo. Mantener la licencia al redistribuir la fuente.

Origen del archivo incorporado: https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf; la licencia procede de `OFL.txt` en el mismo directorio de Google Fonts.

## Layout

El panel usa una columna centrada de hasta 560 px y altura de viewport dinámica, sin mínimo que fuerce desbordamiento de la página. Tres filas sitúan cabecera, área flexible de lectura y controles. La letra tiene desplazamiento propio y conserva saltos de línea; las palabras largas pueden partirse. Hasta 400 px de altura, la cabecera muestra número y título en una fila con elipsis, el buscador sustituye temporalmente el título en esa misma fila, y se reducen rellenos y separaciones. Bajo la barra de progreso, tiempos, transporte y volumen comparten una fila de 34 px. Hasta 380 px de ancho, reproducir/pausar usa solo el icono con nombre accesible. La letra conserva 18 px y recibe el espacio restante; el panel completo no se desplaza.

El ancho de hasta 380 px reduce relleno y separaciones. La altura de hasta 460 px compacta título y transporte, mantiene los versos vecinos y reduce la letra a 18 px con interlineado de 1.5. Los controles táctiles generales tienen objetivo mínimo de 44 px con puntero grueso o ancho de hasta 480 px y altura de al menos 500 px. Conservar esta adaptación al ampliar el sistema; no trasladar todas las medidas del panel a diálogos y ajustes.

La cabecera presenta número y título una sola vez, junto al punto de conexión y las acciones de búsqueda y ajustes. La búsqueda se cierra tras seleccionar un himno y puede reabrirse. El primer verso aparece de inmediato; no se añaden etiquetas de vista previa, contadores ni ayuda persistente. Los versos vecinos conservan el tamaño de la letra activa, con menor peso y contraste.

La lista completa de estrofas conserva nodos estables. Al cambiar de verso, el scroll llega al centro durante 560 ms con desaceleración cuártica; el color y la opacidad cambian durante 400 ms. Un avance rápido cancela la animación anterior y retoma desde la posición actual. Rueda, tacto o teclado interrumpen el movimiento. Al cargar un himno o redimensionar, el centrado es inmediato. El área sigue siendo desplazable y accesible por teclado, pero no muestra barra de desplazamiento. El contenido demasiado alto permanece recorrible.

## Elevation & Depth

La superficie principal es plana. La separación procede del espacio, los tonos de entrada y control, y el contraste tipográfico. El preset elimina sombras de campos y del foco de botones secundarios. Las capas de selección, ventanas y popovers comparten los roles de base, borde y texto del tema.

Diálogos, popovers y desplegables usan una sombra estructural (`0 12px 32px rgb(0 0 0 / .18)`) para distinguir las capas superpuestas. No extenderla al panel principal. Los degradados de letra son máscaras alfa: `#000` indica opacidad de máscara, no un color negro pintado sobre el tema claro.

## Shapes

Las primitivas de interfaz conservan esquinas pequeñas. La búsqueda tiene esquinas más suaves y reproducir/pausar adopta una cápsula. Los botones de icono del transporte son circulares. Estas formas distinguen funciones sin añadir contenedores decorativos.

Diálogos, popovers y desplegables adoptan el radio overlay; los campos dentro de diálogos usan dialog-field. Sus botones son cápsulas para armonizar con el reproductor.

## Components

### Reproducción y transporte

La cápsula de reproducir/pausar usa fondo de control y texto del tema, mínimo de 134 × 54 px en el panel normal. El hover usa el fondo hover del tema. Las acciones vecinas son iconos transparentes con área de interacción explícita y estados deshabilitados de PrimeVue. Mantener nombres accesibles y las condiciones operativas existentes. Detener permanece dentro del popover de volumen para despejar el transporte principal.

### Búsqueda

Campo con fondo input, texto y placeholder por roles del tema, tamaño tipográfico de 12 px y geometría del token search. El foco del campo cambia el borde al rol focus.

### Letra y progreso

La letra activa entra durante 220 ms con `ease-out`, opacidad desde 0.6 y desplazamiento vertical desde 5 px. Desactivar esta animación con `prefers-reduced-motion: reduce`. La barra de progreso usa el color de texto del tema para rango y asa, y cifras tabulares para el tiempo.

El viewport de letra desvanece los extremos con una máscara transparente hasta el 14% y desde el 86%. Los versos inactivos usan el mismo tono atenuado y opacidad uniforme de 0.55, sin máscaras individuales. El único degradado pertenece a los bordes del contenedor. El progreso presenta una línea de 4 px; el asa permanece invisible en reposo y aparece con hover, foco interno o interacción activa. Su transición de opacidad dura 140 ms con `ease-out` y se elimina con movimiento reducido. El área interactiva se extiende 10 px por encima y debajo de la línea.

### Diálogos y capas auxiliares

Manrope se aplica también a ajustes, popovers y desplegables. Los títulos de diálogo usan 18 px y peso 600; encabezados internos, 13 px y peso 600. La cabecera usa relleno `18px 20px 12px`, el contenido 20 px a los lados y el pie `12px 20px 18px`. Los interruptores activos usan texto del tema como fondo y base del tema para el asa. Cerrar y las acciones de popover mantienen fondo transparente; cerrar muestra el fondo hover al interactuar.

### Foco y estados

En el panel, `:focus-visible` usa contorno de 2 px con separación de 3 px y color de texto del tema. El preset general mantiene un anillo de 1 px con separación de 1 px. Conservar estados de conexión y reproducción independientes, mensajes de error y etiquetas en español.

En el viewport de letra el contorno se coloca dentro con separación de −3 px. Diálogos y popovers usan contorno de 2 px con separación de 2 px.

## Do's and Don'ts

- **Do** conservar la letra como el elemento de mayor jerarquía dentro del reproductor.
- **Do** consumir los roles semánticos para mantener temas claro, oscuro y OBS sincronizados.
- **Do** mantener foco visible, movimiento reducido y controles accesibles en paneles estrechos y bajos.
- **Don't** usar la conexión con OBS como indicador de emisión en directo.
- **Don't** añadir sombras o colores de acento decorativos al panel limpio aprobado.
- **Don't** depender de una descarga de fuente en tiempo de ejecución: el archivo y su licencia se distribuyen localmente.

Tanto los clics en versos como el avance automático animan el centrado durante 560 ms, por preferencia explícita del usuario, incluso con movimiento reducido. Volumen y progreso comparten línea de 4 px y asa de 10 px, oculta en reposo y visible con hover, foco o arrastre.

## Icono de aplicación y PWA

El icono original representa un libro abierto con dos notas musicales, fondo azul primario #284cb8 y figura #f5f5f5. La fuente vectorial es public/favicon.svg; scripts/generate-icons.mjs produce los PNG de 192, 512 y 180 px, además de la variante maskable con margen seguro. No incorpora recursos de terceros. Configuración contiene instalación y descargas offline con controles existentes, progreso textual y confirmación explícita; se verificó en Chrome a 390 × 844 px junto con la lectura sin conexión.
