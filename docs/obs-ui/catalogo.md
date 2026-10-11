# Catálogo propuesto de componentes

Todos los elementos siguientes son **definiciones**, no componentes ya extraídos.
La columna Qt indica una base candidata, no una garantía de implementación.

Prioridades:

- **P0:** base de la primera extracción y del himnario nativo.
- **P1:** biblioteca general de vistas y formularios OBS.
- **P2:** extensiones especializadas; implementar cuando exista un consumidor.

Los estados comunes son `enabled`, `visible`, foco y, para controles interactivos,
hover/pressed. Las filas describen estados adicionales. Las entradas son datos de
presentación; los eventos describen intenciones, no efectos ejecutados automáticamente.
Los nombres de eventos son orientativos y se normalizarán al diseñar la API Rust.

## 1. Estructura y composición

| Componente | Base Qt candidata | Entradas y responsabilidad | Estados / eventos propios | Prioridad |
|---|---|---|---|---|
| DockView | QWidget + layouts | Cabecera, cuerpo, pie; límites de tamaño y densidad | Compacto/amplio; closeRequested | P0 |
| ViewHeader | QWidget | Título, subtítulo, icono y acciones | Título truncado con tooltip; actionTriggered | P0 |
| ViewFooter | QWidget | Estado breve y acciones finales | Oculto sin contenido | P0 |
| Row | QHBoxLayout | Hijos, separación, alineación y stretch | Sin eventos | P0 |
| Column | QVBoxLayout | Hijos y distribución vertical | Sin eventos | P0 |
| Grid | QGridLayout | Filas, columnas y proporciones | Sin eventos | P1 |
| FormLayout | QFormLayout | Etiquetas, campos y ayuda | Etiquetas arriba en ancho reducido | P0 |
| ScrollView | QScrollArea | Un contenido y política de desplazamiento | Posición restaurable; scrolled | P0 |
| SplitView | QSplitter | Paneles, orientación y tamaños mínimos | splitterMoved | P1 |
| Section | QGroupBox / QWidget | Título, descripción y contenido | Opcionalmente habilitable; toggled | P1 |
| CollapsibleSection | QWidget compuesto | Cabecera y contenido plegable | Expandido/colapsado; expandedChanged | P1 |
| StackView | QStackedWidget | Páginas por ID y página activa | pageChanged | P0 |
| Tabs | QTabWidget | Páginas con ID, etiqueta e icono | Actual/deshabilitada; tabChanged, closeRequested | P1 |
| Toolbar | QToolBar / QWidget | Acciones ordenadas y grupos | Desbordamiento; actionTriggered | P1 |
| Separator | QFrame | Separación horizontal o vertical | Sin eventos | P0 |
| Spacer | QSpacerItem | Espacio fijo o elástico | Sin eventos | P0 |
| ResponsiveLayout | Layout compuesto | Umbrales locales y reglas de reordenación | Compacto/normal; layoutModeChanged | P1 |

DockView representa el contenido del dock. El adaptador de OBS registra ese
QWidget y gestiona el contenedor mediante la API disponible; no se anidan docks.
Los umbrales dependen del espacio real del componente, no del tamaño de pantalla.

## 2. Texto, iconos e información

| Componente | Base Qt candidata | Entradas y responsabilidad | Estados / eventos propios | Prioridad |
|---|---|---|---|---|
| Text | QLabel | Texto plano, rol tipográfico, ajuste y selección | Vacío, truncado o multilínea | P0 |
| Icon | QIcon + widget | Identificador semántico, tamaño y etiqueta opcional | Normal/deshabilitado; fallback visible | P0 |
| Badge | QLabel compuesto | Texto breve y significado semántico | Neutro, información, éxito, aviso, error | P1 |
| StatusIndicator | QWidget compuesto | Estado, etiqueta e icono | Activo/inactivo/desconocido; sin depender solo del color | P0 |
| HelpText | QLabel | Ayuda persistente vinculada a un campo | Normal/advertencia | P0 |
| Tooltip | QToolTip | Descripción complementaria | Visible por hover o ayuda de teclado | P0 |
| LinkLabel | QLabel / botón | Etiqueta y destino explícito | activated(url); el anfitrión decide abrir | P1 |
| ImagePreview | QLabel / widget propio | Imagen, ajuste y descripción accesible | Carga, ausente, error; activated | P1 |
| KeyValueList | QWidget / modelo | Pares de etiquetas y valores | Vacío; copyRequested(key) | P1 |
| TimeDisplay | QLabel | Tiempo transcurrido, duración y formato | Duración desconocida, negativo opcional | P0 |
| ElapsedCounter | QLabel | Marca de inicio y estado externo | Detenido/activo/pausado | P2 |
| RichTextView | QTextBrowser | Contenido permitido y enlaces | anchorActivated; recursos externos deshabilitados por defecto | P2 |

Las etiquetas de datos externos se tratan como texto plano salvo uso explícito de
RichTextView. Ningún contenido puede introducir acciones mediante HTML o enlaces.

## 3. Botones, acciones y menús

| Componente | Base Qt candidata | Entradas y responsabilidad | Estados / eventos propios | Prioridad |
|---|---|---|---|---|
| Button | QPushButton | Texto, icono, acción y rol | Ocupado; triggered | P0 |
| IconButton | QToolButton | Icono semántico, tooltip y nombre accesible obligatorio | Ocupado/checkable opcional; triggered, toggled | P0 |
| ToggleButton | QToolButton | Estado seleccionado y etiqueta | Checked/unchecked; toggled | P1 |
| MenuButton | QToolButton + QMenu | Acciones y apertura de menú | Menú abierto; actionTriggered(id) | P0 |
| SplitButton | QToolButton | Acción principal y menú secundario | triggered, actionTriggered | P1 |
| ActionMenu | QMenu | Acciones, submenús, checks y separadores | aboutToOpen, actionTriggered | P0 |
| ContextMenu | QMenu | Acciones para un elemento identificado | requested(itemId), actionTriggered | P1 |
| ActionGroup | QActionGroup | Acciones con selección exclusiva u opcional | selectionChanged | P1 |
| SegmentedControl | Botones + QButtonGroup | Opciones breves, valor actual | selectionChanged | P1 |
| ShortcutHint | QLabel | Secuencia de teclado presentada | Conflicto/no asignado | P1 |
| CommandPalette | QDialog + lista | Comandos, filtro y disponibilidad | queryChanged, commandRequested | P2 |

Las acciones deshabilitadas explican el motivo cuando sea relevante. Un shortcut
de widget no equivale a un hotkey global de OBS; ambos tienen ámbitos distintos.

## 4. Campos y edición

| Componente | Base Qt candidata | Entradas y responsabilidad | Estados / eventos propios | Prioridad |
|---|---|---|---|---|
| TextField | QLineEdit | Valor, placeholder, longitud y validación | Readonly, inválido; edited, committed | P0 |
| TextArea | QPlainTextEdit | Texto multilínea y límites | Readonly, dirty; edited, committed | P1 |
| SecretField | QLineEdit | Valor oculto y revelación temporal opcional | Oculto/visible; edited; nunca se incluye en logs | P2 |
| NumberField | QSpinBox | Entero, rango, paso y sufijo | Inválido; valueChanged, committed | P1 |
| DecimalField | QDoubleSpinBox | Decimal, precisión, rango y unidad | Inválido; valueChanged, committed | P1 |
| CheckBox | QCheckBox | Etiqueta y booleano | Opcionalmente indeterminado; changed | P0 |
| RadioGroup | QRadioButton + QButtonGroup | Opciones exclusivas | selectionChanged | P1 |
| Select | QComboBox | Opciones por ID y selección | Vacío, carga, valor ausente; selectionChanged | P0 |
| EditableSelect | QComboBox editable | Opciones y entrada libre permitida | Selección existente/nueva; committed | P1 |
| MultiSelect | QListView compuesto | Conjunto de IDs seleccionados | Vacío/parcial/completo; selectionChanged | P2 |
| Slider | QSlider | Rango, paso, orientación y valor | Drag; previewChanged, committed | P0 |
| SliderField | Slider + NumberField | Valor editable de dos maneras | Sin bucles al sincronizar; committed | P1 |
| SearchBox | QLineEdit + QCompleter | Consulta, sugerencias con ID y límite | Cargando/sin resultados/error; queryEdited, itemActivated | P0 |
| FilterBar | Campos + chips/botones | Filtros activos y opciones | filtersChanged, clearRequested | P1 |
| PathField | QLineEdit + QFileDialog | Ruta, tipo archivo/carpeta y filtros | Ausente/inválida; pathSelected | P1 |
| UrlField | QLineEdit + validador | URL y esquemas admitidos | Inválida; committed; no consulta la red por sí solo | P0 |
| ColorField | Botón + QColorDialog | Color, alfa opcional y muestra | colorPreviewed, colorCommitted | P1 |
| FontField | QFontComboBox / QFontDialog | Familia, tamaño, estilo | fontChanged | P1 |
| ShortcutField | QKeySequenceEdit | Secuencia y resultado de validación externo | Conflicto; shortcutChanged | P1 |
| DurationField | Spin boxes compuestos | Duración con unidad y rango | committed; admite más de 24 horas | P1 |
| DateTimeField | QDateTimeEdit | Fecha, hora y zona definida por contrato | Inválida; committed | P2 |
| ResolutionField | Dos NumberField | Ancho, alto y bloqueo de proporción | changed, committed | P2 |
| VectorField | Campos numéricos | Coordenadas, escala o rotación con unidades | changed, committed | P2 |
| TagEditor | Entrada + lista | Etiquetas normalizadas, límites y duplicados | added, removed | P2 |

Validar un campo no guarda configuración. Los cambios programáticos y la edición
humana tienen eventos separados para evitar comandos duplicados.

## 5. Colecciones, navegación y contenido

| Componente | Base Qt candidata | Entradas y responsabilidad | Estados / eventos propios | Prioridad |
|---|---|---|---|---|
| ItemList | QListView | Modelo de elementos por ID | Vacío/carga/error; selected, activated | P0 |
| DataTable | QTableView | Columnas, modelo, orden y selección | sortRequested, selectionChanged, editCommitted | P1 |
| ItemTree | QTreeView | Jerarquía, IDs y carga diferida | expanded, selected, activated | P1 |
| ItemDelegate | QStyledItemDelegate | Presentación y editor de fila | Reutilización y tamaño variable | P1 |
| ReorderList | QListView + modelo | Orden y elementos arrastrables | moveRequested(ids, destination); confirmación del modelo | P1 |
| ThumbnailGrid | QListView en modo iconos | Miniaturas, etiquetas y selección | Carga por elemento; activated | P2 |
| DetailView | QWidget compuesto | Elemento seleccionado y campos | Vacío/sin selección/error | P1 |
| MasterDetailView | SplitView + lista + detalle | Selección común y dos regiones | selectionChanged | P1 |
| Breadcrumbs | Botones compuestos | Ruta lógica con IDs | segmentActivated | P2 |
| Pagination | Botones + etiqueta | Página, total opcional y disponibilidad | pageRequested | P2 |
| LoadMoreFooter | Button + estado | Continuación disponible y progreso | loadMoreRequested | P2 |
| TextPreview | ScrollView + Text | Texto, encabezado y alineación | Vacío/carga/error; selección local | P0 |
| CueList | ItemList | Pasos con ID, etiqueta, tiempo y paso actual | cueSelected, cueActivated | P1 |
| PlaylistView | ReorderList | Entradas de medios y estado de cada una | playRequested, removeRequested, moveRequested | P1 |

Los índices visuales no se usan como identidad. Ordenar o filtrar no debe cambiar
el elemento al que se refiere una acción. Las colecciones grandes usan modelos y
delegados, sin crear un QWidget por cada fila.

## 6. Estados, mensajes y diálogos

| Componente | Base Qt candidata | Entradas y responsabilidad | Estados / eventos propios | Prioridad |
|---|---|---|---|---|
| StateView | QStackedWidget | Estado exclusivo y contenido | Empty/loading/content/error; retryRequested | P0 |
| EmptyState | QWidget compuesto | Mensaje, icono y acción opcional | actionRequested | P0 |
| LoadingState | QProgressBar + etiqueta | Progreso conocido o indeterminado | cancelRequested si es cancelable | P0 |
| ErrorState | QWidget compuesto | Mensaje breve, detalle y recuperación | retryRequested, detailsRequested | P0 |
| InlineMessage | QLabel compuesto | Severidad y mensaje contextual | dismissed opcional | P0 |
| NotificationBanner | QWidget compuesto | Mensaje de la vista y acciones | actionRequested, dismissed | P1 |
| ProgressView | QProgressBar | Progreso, unidad y etiqueta | Indeterminado/completo/error | P1 |
| BusyOverlay | Widget superpuesto | Región ocupada y motivo | Bloqueo local opcional; cancelRequested | P2 |
| Dialog | QDialog | Título, contenido y acciones | accepted, rejected, closed | P0 |
| ConfirmDialog | QDialog / QMessageBox | Consecuencia y acciones explícitas | confirmed, canceled | P1 |
| SettingsForm | FormLayout + validación | Borrador de valores y esquema | Dirty/inválido/guardando/error; saveRequested, canceled | P0 |
| SettingsDialog | Dialog + SettingsForm | Páginas y política aplicar/guardar | applyRequested, resetRequested | P0 |
| Wizard | QWizard | Pasos, datos y validación | nextRequested, finishRequested, canceled | P2 |
| Popover | Popup Qt compuesto | Ancla, contenido y cierre | opened, closed; devuelve foco al ancla | P0 |
| DiagnosticsView | QPlainTextEdit / tabla | Diagnósticos filtrados y sin secretos | copyRequested, exportRequested | P1 |
| AboutDialog | Dialog | Versión, licencias, enlaces y créditos | linkRequested | P1 |

Los mensajes transitorios no son el único lugar donde se muestra un error.
Cancelar un diálogo descarta su borrador; restaurar valores requiere una acción
propia. No se muestra una confirmación genérica para cada interacción reversible.

## 7. Reproducción y audio

| Componente | Base Qt candidata | Entradas y responsabilidad | Estados / eventos propios | Prioridad |
|---|---|---|---|---|
| TransportControls | IconButton compuesto | Acciones disponibles y estado de reproducción | play/pause/stop/previous/nextRequested | P0 |
| SeekBar | Slider + TimeDisplay | Posición y duración; capacidad de seek | Scrubbing; seekPreviewed, seekCommitted | P0 |
| VolumeControl | Slider + IconButton | Ganancia normalizada, mute y escala definida | volumeChanged, muteRequested | P0 |
| VolumePopover | Popover + VolumeControl | Volumen actual y etiqueta | opened, closed; eventos de volumen | P0 |
| MediaControls | Transport + seek + volumen | Estado agregado del medio | Reenvía intenciones; no reproduce por sí mismo | P0 |
| PlaybackModeSelector | ActionMenu / Select | Manual/automático, repetición, orden | modeChanged | P1 |
| AudioMeter | QWidget pintado | RMS/pico, escala dB y canales | Silencio/clipping/desconectado | P2 |
| AudioChannelStrip | Meter + volumen + mute | Canal y capacidades | volumeChanged, muteRequested, settingsRequested | P2 |
| AudioMonitorSelector | Select | Modos de monitorización admitidos | modeRequested | P2 |
| CueTimeline | Widget propio / Graphics View | Marcas temporales y selección | cueActivated, seekRequested, cueMoveRequested | P2 |
| WaveformView | Widget propio | Muestras reducidas calculadas fuera de la UI | Cargando/error; rangeSelected, seekRequested | P2 |

Los medidores necesitan datos de audio del adaptador y actualización limitada;
no procesan audio en el hilo gráfico. Ganancia lineal, porcentaje y dB no se
intercambian sin conversión explícita. La biblioteca visual no requiere Qt Multimedia
si el motor de reproducción es OBS.

## 8. Componentes orientados a OBS

Estas vistas consumen modelos del adaptador OBS. Su renderizado debe funcionar
también con datos simulados en la galería.

| Componente | Base candidata | Entradas y responsabilidad | Estados / eventos propios | Prioridad |
|---|---|---|---|---|
| ScenePicker | Select | Escenas disponibles y selección por referencia estable | Ausente/cargando; sceneSelected | P0 |
| SourcePicker | Select / ItemTree | Fuentes filtradas por tipo/capacidad | Eliminada/no compatible; sourceSelected | P1 |
| SceneItemTree | ItemTree | Elementos de escena, grupos e IDs locales | selectionChanged, visibilityRequested, lockRequested | P1 |
| SceneStatus | StatusIndicator | Nombre y destino Preview/Program | Activa, preparada, ausente | P1 |
| StudioModeStatus | Badge + texto | Estado de Modo Estudio | Activo/inactivo/desconocido | P1 |
| PreviewProgramView | Dos regiones + adaptador de render | Escenas y destinos diferenciados | transitionRequested; sin cambio implícito de Programa | P2 |
| TransitionControls | Select + DurationField + Button | Transición, duración y disponibilidad | transitionSelected, durationCommitted, triggerRequested | P2 |
| SourceVisibilityControl | ToggleButton | Elemento de escena y visibilidad real | visibilityRequested; refleja respuesta del host | P1 |
| SourcePropertiesForm | Formulario + adaptador de propiedades | Esquema de propiedades soportadas | editCommitted, applyRequested; tipo no soportado explícito | P2 |
| TransformEditor | VectorField + ResolutionField | Transformación del elemento, recorte y límites | previewRequested, commitRequested, resetRequested | P2 |
| FilterChainView | ReorderList | Filtros y disponibilidad | add/remove/reorder/enableRequested | P2 |
| HotkeyBindingView | ShortcutField + adaptador | Acción y asignación OBS | assignRequested, conflictDetected | P2 |
| ProfilePicker | Select | Perfiles y disponibilidad de cambio | profileChangeRequested | P2 |
| SceneCollectionPicker | Select | Colecciones y restricciones del host | collectionChangeRequested | P2 |
| OutputStatus | StatusIndicator + TimeDisplay | Estado de emisión/grabación/cámara virtual | Inactivo/iniciando/activo/deteniendo/error | P1 |
| OutputControls | Button compuesto | Capacidades y estado real de salida | startRequested, stopRequested; comandos separados por salida | P2 |
| OutputStatsView | KeyValueList | FPS, pérdidas, tasa y duración disponibles | Datos ausentes/obsoletos | P2 |
| ResourceBindingForm | SettingsForm | Roles funcionales y escenas/fuentes asignadas | missing/incompatible/ready; bindingChanged | P1 |
| SetupPlanView | Lista + mensajes | Cambios propuestos, conflictos y destino | inspectRequested, applyRequested | P1 |
| ConnectionStatus | StatusIndicator | Estado del adaptador local o remoto | Ready/unavailable/reconnecting/error | P1 |
| CapabilityNotice | InlineMessage | Función requerida y capacidad detectada | Unsupported/degraded/available | P1 |

Fuente y elemento de escena son entidades diferentes: una fuente puede aparecer
varias veces. La visibilidad y transformación se dirigen a la escena y a su
elemento, no únicamente al nombre de fuente. PreviewProgramView requiere estudiar
el render de OBS y su hilo gráfico; no se obtiene una salida OBS con un QLabel.

## 9. Plantillas de vistas

Estas composiciones reutilizan los componentes anteriores; no añaden un segundo
sistema de estilos ni contratos de negocio propios.

| Plantilla | Composición | Uso | Prioridad |
|---|---|---|---|
| SearchDetailDock | DockView + SearchBox + StateView + DetailView | Buscar y mostrar contenido | P0 |
| PlayerDock | SearchDetailDock + TextPreview + MediaControls | Himnario, letras o medios | P0 |
| LibraryDock | FilterBar + ItemList/ThumbnailGrid + DetailView | Catálogo de recursos | P1 |
| InspectorDock | ResourceBindingForm + SettingsForm | Inspección y configuración contextual | P1 |
| QueueDock | PlaylistView + MediaControls | Cola de reproducción | P1 |
| SetupWizardView | Wizard + SetupPlanView | Preparar recursos de un plugin | P2 |
| DashboardDock | OutputStatus + Stats + mensajes | Supervisión | P2 |
| DiagnosticsDock | DiagnosticsView + CapabilityNotice | Diagnóstico del plugin | P1 |
| ComponentGallery | Navegación + ejemplos + controles de estado | Desarrollo y validación de la biblioteca | P0 |

## 10. Servicios de soporte, sin representación visual obligatoria

| Servicio | Contrato propuesto | Prioridad |
|---|---|---|
| ThemeAdapter | Traduce paleta, tipografía, tamaños y cambios del tema anfitrión | P0 |
| IconRegistry | Resuelve iconos semánticos, variantes y fallback propio | P0 |
| ActionRegistry | Identidad, disponibilidad, etiqueta y ejecución de comandos | P0 |
| UiDispatcher | Entrega trabajo al hilo Qt y descarta tareas cuyo propietario murió | P0 |
| EventSubscription | Suscripción con desconexión determinista | P0 |
| ListModelAdapter | IDs, roles, inserciones y actualizaciones incrementales | P0 |
| TreeModelAdapter | Jerarquía y cambios por ID sin índices colgantes | P1 |
| ValidationController | Validación por campo y formulario; errores tipados | P0 |
| SettingsStore | Persistencia con namespace, versión y migración | P1 |
| AsyncRequestController | Generaciones, cancelación, debounce y resultados obsoletos | P0 |
| ObsFrontendAdapter | Eventos de host y comandos frontend comprobados por capacidad | P0 |
| ObsResourceAdapter | Referencias RAII a escenas, fuentes y elementos; invalidación | P1 |
| ObsMediaAdapter | Estado, transporte y volumen de fuentes multimedia | P1 |
| ObsRenderAdapter | Montaje y liberación de superficies de preview de OBS | P2 |
| UndoController | Historial de comandos que realmente admitan reversión | P2 |
| LocalizationProvider | Textos traducibles, pluralización y formatos locales | P1 |
| DiagnosticsSink | Mensajes estructurados sin secretos ni cuerpos de red por defecto | P1 |
| CapabilityRegistry | Versiones y funciones detectadas; degradación explícita | P0 |

Los servicios no son singletons globales obligatorios. Cada plugin dispone de un
contexto propio; el host compartido se inyecta mediante interfaces.

## Extensiones que no forman parte del núcleo

- Charts, gráficos científicos y visualizadores 3D: módulos opcionales con
  dependencias, licencias y rendimiento evaluados por separado.
- Qt Quick/QML: posible backend futuro, no mezclado con el contrato inicial Widgets.
- Editor HTML, navegador embebido y WebEngine: módulo aparte, no requisito de un dock.
- Editores completos de vídeo, escenas o audio: aplicaciones compuestas; no controles básicos.
- Redes, descarga de medios y catálogos: servicios de cada consumidor.
- Himnos, estrofas, letras, endpoints y nombres `himno_*`: dominio del himnario.

## Alta de un componente nuevo

Cada propuesta debe indicar: consumidor real, composición Qt, entradas tipadas,
eventos, estados, dimensiones mínimas, comportamiento por teclado, accesibilidad,
dependencias opcionales, ownership, efecto sobre OBS, ejemplo de galería y pruebas.
Si solo cambia un icono o una etiqueta, se prefiere una variante del componente
existente. Si necesita un servicio especializado, este se define por separado.
