# Plan para la futura extracción

Esta tarea define componentes. No convierte el repositorio Vue en un proyecto
Qt, no migra código y no publica una biblioteca.

## Qué existe y qué se propone

| Referencia actual | Extracción propuesta | Qué permanece en el consumidor |
|---|---|---|
| `src/components/commons/BaseButton.vue` | Contrato de Button e IconButton | Acciones del himnario |
| `src/components/commons/InputText.vue` | TextField y Field/validación | Reglas de cada dato |
| `src/components/commons/InputSelect.vue` | Select con IDs | Obtención de escenas y opciones |
| `src/components/commons/InputSwitch.vue` | Booleano mediante CheckBox/ToggleButton | Preferencias del dominio |
| `src/components/BasicDialog.vue` | Dialog y cierre/foco consistente | Contenido del diálogo |
| `src/components/HymnSearcher.vue` | SearchBox y estados de búsqueda | API, ranking y datos de himnos |
| `src/components/SettingsPanel.vue` | SettingsForm / SettingsDialog | Esquema de configuración |
| `src/components/SetupScene.vue` | SetupPlanView / ResourceBindingForm | Roles y nombres de fuentes requeridas |
| `src/components/AutodriveButton.vue` | PlaybackModeSelector | Sincronización de versos |
| `src/components/AboutApp.vue` | AboutDialog | Créditos y versión de la aplicación |
| `src/components/icons/*` | IconRegistry semántico | Iconos específicos del dominio |
| `src/styles/obs-controls.css`, `src/theme/*` | Referencia visual para ThemeAdapter | Implementación web conserva sus estilos |
| `src/composables/player.ts` | Referencia para estado de MediaControls | Motor y reglas de reproducción |
| `src/composables/obs.ts` | Referencia de comportamientos OBS | Transporte web; no se traslada literalmente a libobs |
| Hermano: `src/hymn-dock.*` | DockView, SearchBox, menús, controles y ajustes Qt | HymnDock como composición de aplicación |
| Hermano: `src/obs-controller.*` | Adaptadores de recursos/medios | Preparación específica del himnario |
| Hermano: `src/plugin-main.cpp` | Contrato de montaje/desmontaje | Entradas y ciclo de vida del plugin anfitrión |
| Hermano: `src/model.rs` | Ejemplo de estado Rust conectado a vistas | Modelo y reglas de himnos |

Las filas web indican equivalencia conceptual, no código Qt reutilizable tal cual.
En el prototipo nativo hay widgets montados dentro de HymnDock; todavía no hay una
biblioteca de componentes independiente.

## Hito 1: base independiente

- Decidir versiones, ownership, errores y eventos del puente.
- Extraer IconRegistry, ThemeAdapter, UiDispatcher y los tipos comunes.
- Implementar Button, IconButton, Text, Row, Column, Separator y DockView.
- Construir una galería que funcione con QApplication propio fuera de OBS.
- Construir un host de galería dentro de OBS usando su QApplication existente.

Salida: los mismos componentes se ven en ambos hosts; el consumidor no necesita
escribir C++ para montar el ejemplo mínimo ni conocer rutas internas de iconos OBS.

## Hito 2: búsqueda, estados y formularios

- SearchBox con IDs estables, modelo y generación de solicitudes.
- StateView, TextPreview, mensajes, menús y Popover.
- TextField, UrlField, CheckBox, Select y SettingsForm/Dialog.
- Galería de errores, vacío, carga, textos largos y navegación por teclado.

Salida: búsqueda por teclado/ratón inequívoca, borradores de configuración y
validación; todo funciona con datos simulados y sin solicitudes de red obligatorias.

## Hito 3: reproducción y consumo real

- TransportControls, SeekBar, TimeDisplay y VolumePopover.
- Adaptadores OBS necesarios para ScenePicker y medios.
- Migrar el panel nativo del himnario a los componentes ya extraídos.
- Mantener fuera de la biblioteca endpoints, parseo, versos y nombres de fuentes.

Salida: PlayerDock reutilizable y un segundo ejemplo con datos distintos de himnos.
La prueba de reutilización no consiste en duplicar HymnDock cambiando nombres.

## Hito 4: ampliar según consumidores

Implementar componentes P1 que tengan demanda real: listas, tablas, árbol,
master/detail, inspector, bindings de recursos y diagnósticos. Los P2 se mantienen
documentados hasta contar con casos de uso, contrato y validación del adaptador.

## Galería obligatoria

Cada componente implementado incluye una página con:

- Nombre, propósito, propiedades editables y registro de eventos emitidos.
- Estado normal, deshabilitado, foco, ocupado, vacío y error cuando correspondan.
- Texto corto/largo, Unicode, escala y ancho/alto controlables.
- Ejemplo mínimo de uso desde Rust y dependencias requeridas.
- Ejemplo compuesto real y límites conocidos.

La galería usa datos simulados por defecto. Las demostraciones que modifican OBS
están identificadas y solo actúan al ejecutar su comando específico; abrir la
galería nunca crea fuentes, cambia Programa ni inicia una salida.

## Criterios de aceptación

| Área | Evidencia necesaria |
|---|---|
| Compilación | Ejemplo Rust construible con Cargo en la matriz declarada |
| Independencia | Widgets puros utilizables sin libobs; ejemplo OBS separado |
| Ciclo de vida | Abrir/cerrar vistas y reiniciar OBS sin callbacks colgantes |
| Persistencia | Dock recupera posición y visibilidad según política documentada |
| Identidad | Renombrar/borrar/reordenar no dirige comandos al elemento equivocado |
| Asincronía | Resultado antiguo no reemplaza consulta nueva ni revive una vista cerrada |
| Teclado | Tab, Enter, Escape y flechas funcionan; una selección emite una activación |
| Tema | Claro/oscuro y cambio en caliente; iconos disponibles/deshabilitados distinguibles |
| Dimensiones | Matriz de tamaños/escalas del documento de arquitectura |
| Formularios | Cancelar descarta; guardar aplica una vez; errores son visibles por campo |
| Media | Estado real del motor, seek al soltar, mute y volumen coherentes |
| OBS | Preview/Program diferenciados, grupos y referencias eliminadas tratados |
| Distribución | Recursos necesarios, versiones y licencias incluidos; instalación limpia probada |
| Documentación | Cada componente entregado tiene ejemplo y limitaciones verificables |

Pruebas recomendadas: lógica de estado/validación en Rust; señales, modelos y foco
con Qt Test donde aporte cobertura; integración dentro de OBS y revisión visual de
la galería. No usar capturas como sustituto de pruebas de identidad o lifecycle.

## Incidencias del prototipo que no deben convertirse en contrato

- En la validación anterior, Programa mantuvo visible el título al avanzar versos
  con otra escena en Vista previa. Resolver y probar el adaptador de Modo Estudio.
- El dock tuvo que mostrarse de nuevo desde Paneles tras reiniciar. Verificar el
  momento de registro y persistencia antes de presentar DockView como terminado.
- Iconos Qt estándar mostraron contraste insuficiente; evitar depender solo del
  estilo de plataforma o de clases internas del tema OBS.
- Faltó inicialmente un backend TLS Qt. Declarar y probar las dependencias opcionales.
- Letras largas requieren scroll en paneles bajos: mantener transporte accesible.
- La salida de audio y el cambio de tema en caliente no quedaron validados en esa sesión.

Estos son antecedentes observados, no una afirmación de que el código permanezca
sin cambios al momento de iniciar la siguiente tarea. Reproducirlos antes de corregir.

## Enunciado sugerido para la siguiente tarea

> Crear una biblioteca Rust/Qt Widgets para vistas nativas de OBS siguiendo
> `docs/obs-ui/`. Comenzar por los hitos 1–3, con galería y ejemplo dentro de OBS.
> Revisar el prototipo hermano himnario-obs-native si está disponible y extraer sus
> piezas visuales sin incorporar el dominio de himnos al núcleo. Resolver los
> contratos pendientes de versiones, memoria y eventos antes de estabilizar la API.
> Mantener los componentes P1/P2 no entregados como backlog explícito. Verificar
> los criterios de aceptación aplicables y documentar las limitaciones restantes.

## Qué queda entregado ahora

Catálogo, contratos, trazabilidad y plan. No hay nuevos widgets, paquetes Cargo,
dependencias Qt ni cambios funcionales en la aplicación web como parte de esta fase.
