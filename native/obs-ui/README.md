# Prototipo de componentes Qt para vistas de OBS

Primera implementación local del [catálogo](../../docs/obs-ui/README.md).
Widgets C++/Qt independientes de libobs, con galería ejecutable. Todavía no es
la biblioteca Rust publicada ni un plugin instalado en OBS.

## Implementado

| Pieza | Contrato disponible |
|---|---|
| Icon / IconButton | Nueve iconos vectoriales propios, paleta Qt, nombre accesible y tooltip |
| DockView | Regiones header/body/footer; reemplazar una región destruye el contenido previo |
| SearchBox | Sugerencias por ID único, callback de edición y activación; Enter sin doble evento |
| StateView | Vacío, carga, contenido y error; reintento; conserva el contenido al cambiar de estado |
| TextPreview | Texto plano seleccionable, ajuste de líneas y desplazamiento |
| TransportControls | Intenciones anterior/reproducir/pausar/siguiente/detener y capacidades |
| VolumePopover | Porcentaje 0–100, teclado, actualización programática sin callback de edición |

Las composiciones usan widgets Qt estándar para layouts, menú, etiquetas,
combobox y botones de texto. Esos usos no se presentan como componentes extraídos.

## Compilar en Windows

Requisitos: Visual Studio 2022 C++, Windows SDK, CMake 3.24+ y Qt 6.6+ MSVC x64.
Probado con el SDK Qt del prototipo hermano, MSVC 19.44 y Windows x64. Otras
versiones/plataformas aún no están verificadas.

```powershell
./native/obs-ui/build-windows.ps1 -QtRoot 'C:/ruta/al/sdk/Qt'
./native/obs-ui/build/Release/obs-ui-gallery.exe
```

Si CMake no está en PATH, indicar `-CMake 'C:/ruta/cmake.exe'`.
El SDK debe incluir `Qt6Core`, `Qt6Gui`, `Qt6Widgets`, `qwindows` y `qminimal`.
El script compila, copia esas dependencias a la carpeta de desarrollo y ejecuta
las pruebas con la plataforma Qt `minimal`. No descarga ni instala un SDK.
El runtime MSVC debe estar disponible; esta carpeta todavía no es un instalador
para distribución a otros equipos.

En este equipo se puede reutilizar el SDK ya preparado:

```powershell
./native/obs-ui/build-windows.ps1 `
  -QtRoot '../himnario-obs-native/.deps/obs-deps-qt6-2025-07-11-x64' `
  -CMake '../himnario-obs-native/.tools/cmake-3.31.10-windows-x86_64/bin/cmake.exe'
```

Ese proyecto hermano es una opción local, no una dependencia obligatoria.

## Usar la galería

- Cambiar tema claro/oscuro, estado y ancho del panel (260/320/480/flexible).
- Buscar «Bienvenida», «Lectura» o «Cierre», usando clic o flechas y Enter.
- Revisar los eventos en el registro de la izquierda.
- Probar transporte y abrir volumen con ratón o teclado.
- Cambiar a Error y pulsar Reintentar; el consumidor simula pasar a Cargando.

Todo usa datos simulados. No reproduce audio, consulta APIs ni modifica OBS.
Las paletas de la galería son ejemplos: no equivalen a todos los temas de OBS.

## Componer una vista

```cpp
auto *dock = new obsui::DockView(parent);
auto *search = new obsui::SearchBox(dock);
auto *preview = new obsui::TextPreview;
auto *state = new obsui::StateView(preview, dock);
dock->setHeader(search);
dock->setBody(state);
dock->setFooter(new obsui::TransportControls(dock));
search->setSuggestions({{"intro", "Introducción"}});
search->onActivated = [preview, state](const QString &id) {
    preview->setText(id);
    state->setState(obsui::ViewState::Content);
};
```

Qt posee los hijos. Crear, usar y destruir widgets solo desde el hilo UI.
Los callbacks son síncronos: no bloquearlos ni destruir el emisor dentro de ellos;
usar `deleteLater()` si procede. Las capturas de objetos externos deben seguir
vivas o usar QPointer. No se ofrece todavía un despachador entre hilos o FFI.

SearchBox recibe sugerencias ya filtradas: el consumidor decide búsqueda, red y
cancelación. Rechaza IDs vacíos/duplicados antes de modificar su modelo. No cambiar
las sugerencias desde un callback genérico de `textChanged`; usar `onQueryEdited`.
`setQuery` y `setVolume` no generan eventos de edición humana.

## Pruebas y límites

Validado localmente: compilación Release, cinco grupos de pruebas aprobados y
galería ejecutada en Windows. Revisión visual a 260 px, cambio claro/oscuro en
caliente y búsqueda «Lectura» con Enter: una activación y contenido correcto.

El ejecutable `obs-ui-tests` verifica identidad tras renombrar/reordenar, rechazo
atómico de IDs duplicados, activación única en el ciclo de Enter, consulta vacía,
separación de edición/programación, límites de volumen, reintento, conservación de
contenido, ownership de regiones y capacidades del transporte.

Pendientes: adaptador de host OBS, registro/persistencia de docks, puente público
Rust/CXX, dispatcher, más componentes del catálogo, DPI entre monitores y revisión
de accesibilidad con lector de pantalla. La galería no prueba Modo Estudio ni audio.

Los iconos se dibujan aquí con QPainter; no usan recursos privados de OBS. Qt conserva
su licencia. El script copia avisos del SDK si están disponibles; preparar una
distribución externa requiere revisar el conjunto completo de dependencias/licencias.
