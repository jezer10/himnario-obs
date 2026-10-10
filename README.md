# Himnario Adventista Broadcast

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

Las variables públicas usan el prefijo `VITE_`. Para empaquetar la GUI con
la API y la música locales, establece `VITE_SAME_HOST=true` antes del build
(o en un archivo `.env.local`; consulta `.env.example`).

Bun solo se necesita para los scripts auxiliares y la distribución de
ejecutables junto al repositorio externo Himnario API. El desarrollo,
las pruebas y la compilación del frontend usan pnpm y Node.js.
El workflow de publicación mantiene los tags `v*.*.*`.

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
