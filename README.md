# Himnario Adventista Broadcast

## Interfaz con PrimeVue 5

La aplicación usa PrimeVue 5 con el tema oficial Aura y PrimeIcons. El modo claro/oscuro puede
seguir a OBS; los colores y el aspecto de los controles corresponden a Aura.
Los controles comunes envuelven Button, InputText, Select, ToggleSwitch y Slider;
la búsqueda usa AutoComplete, las ventanas Dialog, el volumen Popover y los avisos Message.

Copia .env.example a .env.local y configura VITE_PRIMEUI_LICENSE con tu clave
Community o comercial de PrimeUI. Reinicia Vite después de cambiarla; para producción,
configúrala antes de ejecutar pnpm build. Vite incorpora esta clave al cliente.
Sin una clave válida, PrimeUI muestra su aviso de licencia.
Consulta la [configuración oficial](https://primevue.dev/configuration/).

Validación: pnpm build y pnpm test.

## Componentes web con estilo OBS

La [colección OBS UI](../obs-ui-web/README.md) vive en el proyecto hermano
`obs-ui-web`. Sus once componentes y su galería se desarrollan y ejecutan por separado.

![obs-websocket](https://img.shields.io/badge/obs--websocket-5.x-blue?style=for-the-badge)
![GitHub](https://img.shields.io/github/license/jhormanrus/himnario-adventista-broadcast?style=for-the-badge)

![Preview](https://res.cloudinary.com/jhormanrus/image/upload/v1675045208/my-repositories/himnario-adventista/2.png)

## ¿Qué es?

Himnario Adventista Broadcast es una GUI web diseñada para ser usada con [OBS Studio](https://obsproject.com) o simplemente como un reproductor de himnos.

Esta GUI permite:

- Buscar himnos por número o nombre
- Mostrar número, título, verso y letra del himno en pantalla
- Reproducir la melodía del himno (instrumental o cantado)
- Controlar la letra y la melodía del himno
- Personalizar los estilos de la letra y el fondo

## Instalación

Para usarla con OBS Studio, es requerido tener instalado el plugin [obs-websocket](https://obsproject.com/forum/resources/obs-websocket-remote-control-obs-studio-using-websockets.466) versión 5. La GUI usa el puerto 4455 por defecto de este plugin.

> [!TIP]
> Si usas la versión 4.x de obs-websocket, puedes leer la documentación de la [versión 1](https://github.com/jhormanrus/himnario-adventista-broadcast/tree/1.x) de la GUI.

La GUI se encuentra en la siguiente dirección: <https://himnario-adventista-broadcast.vercel.app>. Puedes usarla directamente en tu navegador web o agregarla como un **panel de navegador personalizado** en OBS Studio.

## Configuración básica

La GUI requiere que tengas obligatoriamente la siguiente escena y fuentes en OBS Studio:

```text
ESCENA
└── Himnario (nombre de ejemplo)
    └── FUENTES (las fuentes se pueden agrupar)
        ├── himno_numero
        ├── himno_titulo
        ├── verso_numero
        └── verso_contenido
```

Todas las fuentes requeridas deben ser de tipo **Texto (GDI+)** en Windows o **Texto (FreeType 2)** en Linux y macOS.

La visibilidad de las fuentes son administradas por la GUI, pero la personalización de los estilos de las fuentes (fuente, tamaño, color, etc.) es responsabilidad del usuario.

Si bien la GUI requiere que tengas la escena y fuentes mencionadas, puedes agregar libremente otras fuentes a la escena para personalizarla a tu gusto como por ejemplo: un fondo, un logo, etc.

Finalmente, en la GUI debes conectarla con OBS Studio usando el botón **Conectar**.

### Modo normal y Modo Estudio

Al cargar un himno se muestran su número y título; al avanzar se ocultan y se
muestra la estrofa o el coro. Selecciona en **Escena de himno** la escena que
contiene las cuatro fuentes.

En Modo Estudio, si esa escena ya está en **Programa**, la aplicación actualiza
también la salida al cambiar entre título y versos, sin pulsar **Transición**.
Respeta la transición configurada en OBS y conserva una escena distinta que
estuviera preparada en **Vista previa**. Los avances se procesan en orden,
esperando a que termine la transición.

Si otra escena está en Programa, preparar un himno no la reemplaza. La opción
**Cambiar a escena de himno** autoriza ese cambio automáticamente, tanto en
modo normal como en Modo Estudio.

## Configuración avanzada

La GUI tiene una configuración avanzada que puedes acceder desde el botón tuerca en la parte superior derecha de la GUI. En la configuración avanzada puedes establecer:

### Al buscar un himno
- **Solo instrumental**: Melodía solo instrumental (si no está marcado, se reproducirá la melodía cantada)
- **Autoreproducir música**: Auto reproduce la melodía
- **Autoconducir versos**: Auto dirigir la letra del himno en pantalla
- **Cambiar a escena de himno**: Cambiar a la escena del himno (ninguna por defecto)
- **Escena de himno**: Escena donde se encuentran las fuentes que usará la GUI (puedes seleccionar la escena una vez que conectaste la GUI al OBS)

### Al terminar de reproducir un himno
- **Cambiar a escena**: Cambiar a una escena específica (ninguna por defecto)

### Red
- **URL de OBS Websocket**: Usar un servidor websocket de OBS Studio personalizado (por defecto usa localhost:4444)
- **URL de host de música**: Usar un servidor de melodías personalizado (por defecto usa el del [Himnario Adventista API](https://github.com/jhormanrus/himnario-adventista-api))
- **URL de API de himnario**: Usar un servidor de la API de Himnario Adventista personalizado (por defecto usa el [Himnario Adventista API](https://sdah.my.to/hymn))

La GUI está pensada para usarla online, pero gracias a la configuración avanzada puedes usarla sin conexión a internet levantando localmente el [Himnario Adventista API](https://github.com/jhormanrus/himnario-adventista-api) y configurando la GUI para usarlo.

## Desarrollo local

Requisitos: Node.js 24 y pnpm 12.10.1 (fijado en `packageManager`).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

- `pnpm build`: comprueba los tipos con vue-tsc y genera `dist/` con Vite.
- `pnpm preview`: sirve la compilación localmente.
- `pnpm test`: ejecuta las pruebas con Vitest y Happy DOM.
- `pnpm test:watch`: ejecuta las pruebas en modo interactivo.
- `pnpm lint`: ejecuta la configuración existente de Biome.

La base es la plantilla oficial `vue-ts` de `create-vite@9.2.1`.
`vite.config.ts`, `tsconfig.json`, `tsconfig.app.json` y
`tsconfig.node.json` se conservan sin cambios respecto de esa plantilla.
Los componentes y estilos del himnario sustituyen la pantalla de demostración.
Tailwind se añade mediante `postcss.config.js`; Vitest tiene su propia
configuración en `vitest.config.ts` y las pruebas están en `tests/`.

Para agregar dependencias, usa `pnpm add` o `pnpm add -D` y guarda
`pnpm-lock.yaml`.

### Despliegue

El despliegue se gestiona mediante la integración del repositorio con Vercel.
La aplicación usa Vite, se compila con `pnpm build` y genera `dist/`.
No requiere workflows de GitHub Actions ni generación de ejecutables.

La interfaz consume la API y la música desde servicios externos. Sus direcciones
se pueden personalizar en la configuración de la aplicación.

### Mejora futura: disponibilidad de la música

Pendiente de diseño e implementación: permitir que la música siga disponible
si falla el servicio externo, especialmente durante una transmisión en OBS.
Actualmente el frontend carga los audios desde el servidor configurado;
el build y el despliegue en Vercel no descargan ni incluyen canciones.

Se considerarán estas opciones:

- Un almacenamiento o servidor de respaldo para la música, gestionado en el
  proyecto del servicio, con cambio al respaldo desde el frontend si falla
  el origen principal.
- Una descarga anticipada y caché local de los himnos seleccionados para una
  sesión, con indicación de cuáles están disponibles sin conexión y controles
  para actualizar o borrar los archivos.

Antes de implementarlo, definir el espacio necesario, los costes de transferencia,
la actualización de los audios y el comportamiento de la caché dentro del navegador
de OBS. Para una sesión sin conexión también habrá que conservar las letras y los
datos necesarios de la API. La disponibilidad debe comprobarse antes de la sesión;
una caché o un respaldo por sí solos no garantizan disponibilidad permanente.

Esta propuesta no requiere recuperar la distribución de ejecutables. Por ahora
se mantiene el proyecto como frontend, sin descargas masivas durante el despliegue.

#### Plan de prueba del modo sin conexión en OBS

Estado al 10 de octubre de 2026: **pendiente de prototipo y de pruebas en OBS**.
Los flujos siguientes describen el comportamiento que se quiere validar; todavía
no existen el botón de descarga, la verificación ni la carga sin conexión.
Primero se probará un himno dentro de un panel de navegador personalizado de OBS.
Los resultados decidirán si conviene continuar con almacenamiento del navegador
o evaluar una carpeta de archivos servida por un servidor local.

La propuesta es guardar audios y datos en el almacenamiento interno del navegador
de OBS (por ejemplo, IndexedDB), asociados al origen de la aplicación. No sería
una descarga a la carpeta Descargas. No se debe asumir que una copia guardada en
Chrome esté disponible en OBS, ni que un panel y una fuente de navegador compartan
los mismos datos. La persistencia y las capacidades necesarias se comprobarán en
el entorno real; no se consideran garantizadas por usar un navegador basado en CEF.

**Preparación de la prueba**

- Registrar sistema operativo, versión de OBS y de obs-browser/CEF si está
  disponible, versión del prototipo, URL exacta del panel y direcciones de API
  y música. Mantener el mismo origen durante las pruebas de persistencia.
- Usar un entorno de prueba de OBS, fuera de una transmisión, con la escena y
  fuentes de texto indicadas en la configuración básica y WebSocket habilitado.
- Elegir un himno con letras, secuencia de tiempos y audios cantado e instrumental;
  reservar otro himno sin descargar para probar el caso de contenido ausente.
- Preparar un prototipo que permita descargar, leer lo almacenado, verificar,
  borrar y mostrar errores. Comprobar en el panel las capacidades de IndexedDB,
  Cache Storage y service worker, y registrar los límites de espacio disponibles
  y el resultado de cualquier solicitud de almacenamiento persistente.
- Comprobar que el servidor permite obtener los bytes del audio desde el origen
  del panel (CORS). Que un audio se reproduzca por URL no demuestra que la
  aplicación pueda leerlo, guardarlo y calcular su hash.
- Para abrir el panel después de reiniciar sin internet, el prototipo también
  deberá conservar la interfaz y sus recursos, por ejemplo con un service worker
  sobre HTTPS o localhost. Guardar solo música no resuelve el arranque sin conexión.

**Flujos y criterios de aceptación**

| Flujo | Pasos a probar | Resultado esperado |
| --- | --- | --- |
| 1. Referencia con internet | Abrir el panel en OBS, buscar el himno y reproducir ambas variantes; probar letras y avance automático. | Confirmar que el contenido y el control de OBS funcionan antes de evaluar la descarga. |
| 2. Descargar y comprobar | Descargar letras, tiempos y las variantes elegidas. Esperar la escritura y volver a leer los datos desde el almacenamiento. | Cada variante tiene un estado independiente. Solo se marca disponible el conjunto cuyos datos y audio se guardaron y verificaron. |
| 3. Reproducir desde la copia | Cortar el acceso a internet manteniendo OBS y su WebSocket local activos. Volver a seleccionar el himno y reproducirlo desde el inicio; avanzar hacia el final. | Audio, letras y tiempos proceden de la copia local. El panel permite controlar OBS y no necesita el servidor externo para ese himno. |
| 4. Recargar sin internet | Con la red aún desconectada, recargar el panel. | La interfaz abre, encuentra el himno descargado y reproduce su contenido. No basta con que siga funcionando una página ya cargada en memoria. |
| 5. Reiniciar OBS sin internet | Cerrar OBS completamente, abrirlo de nuevo sin internet y cargar el mismo panel. | La interfaz y los datos persisten; se vuelve a comprobar la disponibilidad y se reproduce el himno. Repetir después de reiniciar la computadora. |
| 6. Contenido ausente | Sin internet, buscar el himno reservado sin descargar o elegir una variante no guardada. | Mostrar que ese contenido no está disponible sin conexión, sin presentarlo como descargado ni quedar cargando indefinidamente. |
| 7. Descarga interrumpida | Cortar internet a mitad de descarga; repetir cerrando OBS antes de terminar. Reconectar y reintentar. | Una descarga parcial nunca figura como verificada. El reintento completa una copia válida y no deja duplicados ni residuos parciales permanentes. |
| 8. Fallos de origen o de integridad | Simular respuesta HTTP de error, archivo vacío, respuesta HTML en lugar de audio y archivo truncado o hash distinto al esperado. | Mostrar el error y permitir reintentar; no marcar éxito por llegar al 100 % de transferencia. |
| 9. Falta de espacio y borrado | Simular un fallo de cuota/escritura. Borrar una descarga desde el prototipo y volver a consultar su estado. Probar limpieza de datos del navegador solo en el entorno de prueba. | Informar el fallo sin perder otras copias válidas; después del borrado no mostrar disponibilidad que ya no existe. |
| 10. Actualización y recuperación | Recuperar internet, actualizar un himno y simular un fallo durante el reemplazo. Probar una actualización del panel conservando el origen. | Conservar la última copia válida hasta verificar la nueva; la actualización de la interfaz mantiene o migra los datos y sigue permitiendo el arranque sin conexión. |

**Alcance de la comprobación**

La verificación debe distinguir entre escritura correcta, integridad y reproducción:

- Confirmar una respuesta válida, terminar la escritura y volver a leer tanto
  el audio como las letras y la secuencia desde el almacenamiento.
- Si el servidor proporciona tamaño y SHA-256 esperados, comparar la copia
  guardada con esos valores. Un hash calculado solo sobre lo recibido sirve
  para detectar cambios posteriores, pero no prueba que el servidor entregó
  el archivo completo y correcto. Registrar si no existe una referencia de origen.
- Cargar el audio guardado y probar su reproducción y desplazamiento, incluidas
  las letras sincronizadas. Cargar los metadatos del audio por sí solo no valida
  toda la canción; reproducirla completa en la prueba inicial.
- Registrar qué se comprobó realmente y volver a verificar la presencia de los
  datos antes de cada sesión. El almacenamiento del navegador no es una garantía
  de conservación permanente.

**Registro y decisión posterior**

Para cada flujo, anotar: fecha, entorno, himno y variante, pasos realizados,
resultado esperado y observado, evidencia (captura o registro), y estado
**pendiente / aprobado / fallido / bloqueado**. Todos están pendientes inicialmente.

Continuar con la opción del navegador solo si el panel real de OBS permite
guardar, verificar, reproducir y volver a abrir la aplicación sin internet tras
un cierre completo. Una prueba exitosa en Chrome no aprueba el flujo de OBS.
Si el arranque sin conexión o la persistencia fallan, documentar la causa y evaluar
el servidor local con archivos en una carpeta. La implementación definitiva y
la descarga del catálogo completo quedan para después de estas pruebas.

### Sincronizar la apariencia con OBS

1. Usa OBS 29 o posterior, con su servidor obs-websocket 5.x habilitado.
2. Descarga el script desde **Configuración → Personalización → Seguir tema de OBS**
   o usa [`public/obs/himnario-theme.lua`](public/obs/himnario-theme.lua) de este repositorio.
3. En OBS abre **Herramientas → Scripts → +** y selecciona el archivo Lua.
   Conserva el archivo en una ubicación estable. No necesita Python ni un puerto adicional.
4. Conecta el panel y selecciona **Seguir tema de OBS**. El estado indicará
   «Sincronizado con …» en un máximo aproximado de tres segundos.

El script comunica el identificador del tema y su modo claro/oscuro por la conexión
WebSocket existente. El panel incluye paletas de referencia de OBS 32.2.2 para
Yami, Light, Grey, Acri, Rachni y Classic, obtenidas de los archivos oficiales
`Yami.obt` y sus variantes. No copia estilos QSS, iconos, escala ni modificaciones
personales de esas paletas. Con temas desconocidos (incluido System), sincroniza
solamente claro/oscuro. Las futuras modificaciones de OBS pueden requerir actualizar
`src/theme/obs-palettes.json`.

Si se desconecta OBS o el script deja de emitir durante doce segundos, el panel
quita la paleta sincronizada, muestra el estado y usa oscuro como respaldo.
Las opciones **claro** y **oscuro** manuales siguen disponibles y tienen prioridad.
Para desactivar el puente, elimina el script de la lista de scripts de OBS.

El puente Lua usa la API de procedimientos de obs-websocket; se debe verificar
en OBS tras actualizarlo. Referencias: [API de OBS](https://docs.obsproject.com/reference-frontend-api)
y [API de obs-websocket](https://github.com/obsproject/obs-websocket/blob/master/lib/obs-websocket-api.h).

## Necesito ayuda

- [Cómo configurar OBS Studio para usar el Himnario Adventista Broadcast](https://github.com/jhormanrus/himnario-adventista-broadcast/wiki/C%C3%B3mo-configurar-OBS-Studio-para-usar-el-Himnario-Adventista-Broadcast)
- [Cómo configurar el servidor WebSocket en OBS Studio](https://github.com/jhormanrus/himnario-adventista-broadcast/wiki/C%C3%B3mo-configurar-el-servidor-WebSocket-en-OBS-Studio)

Si tienes alguna duda o sugerencia, puedes abrir un [issue](https://github.com/jhormanrus/himnario-adventista-api/issues) o ponerte en contacto conmigo en mi [LinkedIn](https://www.linkedin.com/in/jhormanrus/).
