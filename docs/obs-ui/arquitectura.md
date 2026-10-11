# Arquitectura y contratos propuestos

Estado: diseño para una tarea futura. Los nombres de paquetes, tipos y métodos
de este documento no existen todavía como API utilizable.

## Capas y dependencias

```text
Aplicación consumidora (Rust: himnario, cola, inspector, etc.)
  ├── estado y reglas de negocio
  ├── comandos hacia los adaptadores OBS
  └── API de vistas Rust
        └── puente CXX
              └── componentes C++ / Qt Widgets

Adaptadores OBS ── APIs frontend / libobs
Galería ── mismos componentes + modelos simulados
```

Los componentes visuales puros no enlazan libobs. El adaptador OBS recibe el host,
registra contenido de docks, resuelve recursos y transforma eventos del host en
datos de presentación. El puente Rust expone únicamente los tipos y operaciones
necesarios; no intenta envolver toda la API de Qt.

Estructura candidata del futuro proyecto:

```text
crates/
  obs-ui-types/      # IDs, estado, eventos y errores; sin Qt
  obs-ui/            # API pública Rust y puente CXX
  obs-ui-host/       # Integración OBS opcional
native/
  widgets/          # Componentes Qt reutilizables
  models/           # Adaptadores de modelos Qt
  theme/            # Paleta, iconos y dimensiones
  obs/              # Integración de host
examples/
  gallery/          # Galería con datos simulados
  obs-gallery/      # Plugin de prueba dentro de OBS
  player-dock/      # Composición mínima sin dominio de himnos
```

Esta estructura se aprobará durante la extracción. No se crean esos paquetes en
el repositorio web como parte de la documentación.

## Contrato común de un componente

Cada componente declara:

- **Identidad:** ComponentId estable durante su vida; no deriva de su etiqueta.
- **Propiedades:** datos tipados, enabled/visible, tamaño y accesibilidad.
- **Estado:** propiedad de la aplicación o estado transitorio local, claramente separado.
- **Eventos:** intención humana con ID y valor; sin llamadas ocultas a servicios.
- **Slots:** regiones componibles, cuando corresponda (header/body/footer/actions).
- **Ownership:** quién crea, parenta y destruye el widget y sus suscripciones.
- **Capacidades:** operaciones que el consumidor puede habilitar realmente.
- **Errores:** de validación, disponibilidad, operación o integración.

Actualizar un valor desde Rust no debe simular una edición humana. `set_value`
actualiza presentación; `value_edited` corresponde al usuario. Las señales internas
se bloquean o distinguen cuando haga falta para impedir bucles y efectos repetidos.

El consumidor puede agrupar cambios de estado en una actualización para evitar
parpadeos y estados intermedios incoherentes.

## Tipos de intercambio Rust/C++

| Tipo conceptual | Contenido / regla |
|---|---|
| ComponentId / ActionId / ItemId | Identificador opaco; no punteros ni índices Qt |
| IconId | Nombre semántico (`play`, `pause`, `settings`, etc.) |
| TextValue | Texto UTF-8 y rol; texto plano por defecto |
| Choice | ID, etiqueta, icono opcional, enabled y motivo de indisponibilidad |
| ValidationIssue | Campo, código y mensaje de presentación |
| OperationError | Código estable, mensaje breve y detalle de diagnóstico opcional |
| AsyncState | Idle, loading, ready, empty o error; generación de solicitud |
| PlaybackState | Unavailable, stopped, loading, playing, paused, ended o error |
| Duration / Position | Enteros de milisegundos; duración desconocida opcional |
| VolumeState | Ganancia lineal y mute independientes; etiqueta/escala explícitas |
| ResourceRef | Identidad que el adaptador puede resolver y validar en el host |
| SceneItemRef | Colección/escena y ID del elemento; distinto de SourceRef |
| Capabilities | Funciones disponibles, versiones y motivos de degradación |
| Subscription | Token que desconecta callbacks al liberarse |

La representación concreta debe respetar los tipos admitidos por CXX. No se
asume que un trait object, closure o enum Rust con datos cruce directamente el
puente. Se diseñarán structs compatibles y un despachador por ID cuando proceda.

## Flujo de una vista

Ejemplo conceptual, no código compilable:

```text
Crear DockView
  header = SearchBox + MenuButton
  body   = StateView(TextPreview)
  footer = MediaControls

SearchBox.queryEdited(query)
  → controlador inicia búsqueda con generación N
  → aplicación actualiza SearchBox.suggestions

SearchBox.itemActivated(itemId)
  → aplicación carga el contenido
  → si N sigue vigente, actualiza StateView y MediaControls

MediaControls.playRequested
  → aplicación valida recurso y ejecuta ObsMediaAdapter.play
  → evento del host actualiza PlaybackState
```

Mostrar `playing` requiere evidencia del motor. Un clic no confirma que la
reproducción empezó. Lo mismo aplica a visibilidad, salida, transiciones y guardado.

## Hilo gráfico y ciclo de vida

- Crear, modificar y destruir QWidget en el hilo Qt del anfitrión.
- Trabajo de red, disco o cálculo no bloquea ese hilo. Sus resultados llegan
  mediante UiDispatcher, con propietario y generación comprobados.
- No exponer handles de widgets como Send/Sync. El destructor Rust no debe destruir
  un QWidget desde un hilo arbitrario: habrá cierre explícito en el hilo UI.
- El parent QObject posee los hijos. Los handles Rust son referencias controladas,
  no un segundo propietario que libera el mismo widget.
- Desconectar señales/callbacks, cancelar tareas y liberar referencias antes de
  descargar el plugin. Ningún callback puede apuntar a código de una DLL descargada.
- Invalidar recursos al cambiar colección, borrar una fuente o cerrar OBS.
- Los callbacks de OBS y audio no se presuponen ejecutados en el hilo Qt.
- No mantener referencias a índices temporales de modelos tras filtrado o reset.
- No atravesar FFI con excepciones C++ ni panics Rust. Convertir errores al contrato.

La fase de implementación debe elegir y documentar ownership para cada entrada
de la API OBS; no generalizar que todas las referencias retornadas son prestadas
o que todas deben liberarse.

## Tema e iconos

ThemeAdapter obtiene del anfitrión paleta, fuente y métricas. Define roles de
superficie, texto, borde, acento, selección, foco, error y deshabilitado. Espaciado
y densidad son tokens propios que respetan esas métricas, no colores globales fijos.

IconRegistry usa IDs semánticos. Puede aprovechar recursos del tema OBS cuando
estén disponibles, pero mantiene fallback propio. Las rutas `theme:*` y clases
como `icon-media-play` observadas en el prototipo son detalles de integración,
no contratos públicos que deba conocer el consumidor.

Ante cambios de tema, fuente o escala se actualizan iconos, contraste, medidas y
layout. No aplicar una hoja de estilos global que modifique otros docks. Un icono
deshabilitado debe distinguirse de uno disponible. Los colores de estado llevan
texto o icono además de color.

## Teclado, foco y dimensiones

- Nombres accesibles obligatorios para botones que solo muestran iconos.
- Etiquetas asociadas a campos; orden de Tab coherente; foco siempre visible.
- Enter activa una sugerencia una sola vez; Escape cierra el popup y recupera foco.
- Menús y volumen se pueden usar sin ratón. No capturar hotkeys globales sin registro.
- Texto largo: wrapping o elipsis según componente; tooltip si oculta información.
- Letras extensas: scroll vertical; controles de transporte siguen accesibles.
- Tamaños mínimos por composición, no una anchura universal para todos los widgets.
- Probar 260, 320, 480 y 800 píxeles lógicos; alturas de 240, 360 y 600.
- Probar escalas 100 %, 150 % y 200 %, incluyendo desplazamiento entre monitores.

Los tamaños son objetivos de validación del diseño, no garantías ya comprobadas.

## Integración con OBS

Dock registration usa un ID estable con namespace del plugin. OBS controla su
contenedor y disposición. Deben verificarse reapertura, cierre, restauración de
posición y visibilidad tras reiniciar; no asumir que crear contenido al finalizar
la carga permite restaurar automáticamente la disposición.

El adaptador de recursos publica cambios de nombres, borrados, selección y colección.
Siempre revalida una referencia antes de ejecutar una operación. Cuando no exista
una identidad persistente adecuada en una versión de OBS, se documentará cómo se
resuelve y cuándo caduca, en vez de prometer UUIDs universales.

Modo Estudio tiene destinos separados: Preview, Program y escena editada. El
consumidor debe elegir qué modifica. Una fuente compartida puede afectar varias
escenas; cambiar su texto no equivale a cambiar la visibilidad de un elemento.
Las transiciones se serializan y se completan con eventos del host.

Operaciones de salida y preparación de escenas se representan con comandos
explícitos. SetupPlanView presenta recursos que faltan y conflictos; el adaptador
aplica un plan idempotente sin reemplazar silenciosamente fuentes existentes.

## Servicios opcionales y empaquetado

- Widgets básicos: Qt Core/Gui/Widgets. Red, render, audio y otros módulos se agregan
  solo al módulo que realmente los necesite.
- Usar las bibliotecas Qt que corresponden al host; no sustituir sus DLLs por una
  copia arbitraria. Fijar plataforma, arquitectura y versiones soportadas.
- El empaquetado enumera recursos y plugins Qt requeridos. HTTPS en el prototipo
  necesitó el backend Schannel; no convertirlo en dependencia de cada botón.
- Conservar validación TLS y avisos/licencias de los binarios distribuidos.
- Empezar con integración al compilar el plugin. Una biblioteca dinámica pública
  y su ABI estable son una decisión posterior.
- La API pública Rust se versiona independientemente del SDK OBS. No prometer
  compatibilidad binaria entre todas las versiones Qt/OBS.

## Decisiones pendientes para la tarea de extracción

1. Versiones mínimas y matriz de plataformas probadas; Windows es la referencia actual.
2. Ownership y mecanismo concreto de eventos Rust/CXX.
3. Uso de QObject propio con moc frente a callbacks sin macros en cada componente.
4. Forma de componer vistas: builders tipados primero; DSL declarativa solo si aporta valor.
5. Catálogo de iconos fallback y licencia de recursos.
6. Persistencia de docks y política de restauración de estado.
7. Nombre público, distribución y licencia de la biblioteca, tras revisar procedencia.

Estas decisiones no bloquean el catálogo, pero deben resolverse antes de publicar
la primera API estable.
