# Componentes Qt para vistas de OBS

> Documento histórico de la exploración nativa. El objetivo aclarado por el usuario
> es una biblioteca **web con estilo OBS**. Consultar [OBS UI web](../obs-web-ui.md)
> para la implementación y el plan vigentes. No continuar la extracción Rust/Qt
> descrita aquí como si fuera la tarea actual.

Estado: **especificación propuesta**, 10 de octubre de 2026. No es una biblioteca
implementada ni una API publicada. Los nombres son provisionales.

Ya existe una [primera implementación Qt con galería](../../native/obs-ui/README.md)
de un subconjunto del catálogo. El catálogo completo y la API Rust siguen siendo
propuestas; consultar ese README para distinguir las piezas implementadas.

Objetivo: preparar una biblioteca de componentes Qt Widgets para componer vistas
nativas de plugins OBS desde Rust, con un puente C++/CXX. La extracción y la
implementación se harán en una tarea posterior.

## Documentos

- [Catálogo de componentes](./catalogo.md): propósito, base Qt prevista,
  propiedades, estados, eventos y prioridad.
- [Arquitectura y contratos](./arquitectura.md): composición, integración OBS,
  puente Rust, temas, accesibilidad y ciclo de vida.
- [Plan de extracción y validación](./plan.md): procedencia, entregables y
  criterios de aceptación para la siguiente tarea.

## Alcance

El catálogo es amplio y extensible: cubre las familias de componentes útiles para
paneles, formularios, bibliotecas de contenido, reproducción y operación de OBS.
Qt permite construir componentes arbitrarios; «todos los posibles» no es una
lista finita. No se pretende envolver cada clase de Qt ni implementar todo en v1.

Se distinguen tres cosas:

1. Componentes visuales reutilizables que reciben datos y emiten eventos.
2. Adaptadores que leen o modifican OBS a través de sus APIs.
3. Servicios de soporte: temas, comandos, modelos, persistencia y ejecución.

La aplicación consumidora decide las acciones de negocio. Un botón de reproducción
no conoce himnos, URLs ni nombres de fuentes. Un selector de escenas informa una
selección; cambiar Programa exige un comando separado y explícito.

## Repositorios de referencia

Este repositorio (`himnario-obs`) contiene la aplicación web Vue, conectada mediante
obs-websocket. Sus componentes sirven de referencia funcional; no son widgets Qt.

El proyecto hermano `../himnario-obs-native` contiene el prototipo Rust/CXX/Qt:
`src/hymn-dock.*`, `src/obs-controller.*` y `src/plugin-main.cpp`. Es una referencia
local de extracción, no una dependencia que este repositorio instale. Un clon
aislado de este repositorio puede no incluir ese proyecto hermano.

## Principios

- Composición antes que herencia: envolver Qt solo cuando aporta un contrato útil.
- Tema, teclado y accesibilidad forman parte del componente.
- UI y efectos en OBS se conectan mediante eventos y comandos tipados.
- Las vistas funcionan en una galería con datos simulados, sin modificar OBS.
- Qt administra los widgets; Rust administra el estado de aplicación.
- El plugin anfitrión conserva el control de su arranque, cierre y registro de docks.
- No crear un segundo QApplication ni un segundo bucle de eventos dentro de OBS.

## Referencias técnicas

El catálogo es una propuesta de diseño propia. Las bases técnicas se contrastaron
con [Qt Widgets](https://doc.qt.io/qt-6/widget-classes.html) y la
[API frontend de OBS](https://docs.obsproject.com/reference-frontend-api).
Estas páginas siguen versiones actuales y pueden cambiar; la implementación debe
fijar una matriz explícita de versiones Qt/OBS y verificar cada API utilizada.
Las clases CSS, rutas de iconos y widgets internos de OBS no se consideran una
API pública estable de esta futura biblioteca.
