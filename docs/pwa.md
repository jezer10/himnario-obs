# Instalar y usar sin conexión

Abre la versión publicada mediante HTTPS (o `localhost` para pruebas). En Chrome o Edge, usa **Instalar aplicación** en el menú del navegador; también aparece **Instalar Himnario** en Configuración cuando el navegador ofrece la instalación. En iPhone o iPad, abre Safari y usa **Compartir → Añadir a pantalla de inicio**.

Antes de desconectarte, abre **Configuración → Instalación y uso sin conexión**:

1. Pulsa **Descargar todas las letras** y espera la confirmación. Se guardan el catálogo, las letras y las secuencias para buscar por número o título.
2. Para música, introduce el número y pulsa **Descargar himno con audio**. Guarda la letra y ambas versiones, cantada e instrumental. Repite para los himnos que vas a usar.
3. Espera la confirmación antes de cerrar. Después puedes abrir la app instalada sin Internet.

La interfaz, los iconos y la fuente se guardan al cargar la versión de producción por primera vez. Las letras consultadas también se guardan automáticamente. Reproducir una pista por streaming no equivale a descargarla: usa el botón de descarga para asegurar su disponibilidad completa. La descarga de letras no incluye los audios.

Los archivos pertenecen al navegador y al dispositivo donde los descargaste. Cambiar la URL de los servidores requiere descargar los contenidos de ese servidor. Borrar los datos del sitio elimina las descargas; el navegador también puede liberar espacio. La app solicita almacenamiento persistente al terminar una descarga, pero el navegador decide si lo concede. Una descarga interrumpida conserva los elementos completados y se puede reintentar. Las actualizaciones de la interfaz se activan al cerrar todas las ventanas de la app y volver a abrirla; no interrumpen una reproducción activa.

OBS debe seguir accesible en tu equipo o red local. Instalar la app no sustituye OBS ni su conexión WebSocket.

## Desarrollo y comprobación

La PWA se genera con `pnpm build`; `pnpm dev` no registra el service worker. Publica todo `dist` mediante HTTPS, incluidos `sw.js`, `manifest.webmanifest`, iconos y assets. Evita una caché HTTP inmutable para `sw.js` e `index.html`.

Para comprobarla localmente:

```sh
pnpm build
pnpm preview --host 127.0.0.1 --port 4173
# En otra terminal, con Chrome instalado:
pnpm test:pwa
# Comprobación opcional con los servidores reales (descarga el himno 1):
pnpm test:pwa --live
```

El test usa un perfil temporal, descarga letras y audios, desactiva la red, recarga y comprueba búsqueda y audio. La variante con fixtures verifica además respuestas parciales de audio y reproducción de archivos sin CORS. Puedes definir `PWA_BROWSER_PATH` para usar otro ejecutable de Chromium.

El icono es un dibujo vectorial original de un libro abierto con dos notas, en el azul primario de la app. Su fuente es `public/favicon.svg`; `pnpm icons` regenera los PNG, incluido el icono maskable con margen seguro y el de Apple. No usa imágenes de terceros ni un emblema denominacional.

Implementación basada en [Vite PWA: Inject Manifest](https://vite-pwa-org.netlify.app/guide/inject-manifest). Los audios sin CORS se guardan como respuestas opacas y se verifican mediante el reproductor; no se intentan leer ni fragmentar sus bytes.
