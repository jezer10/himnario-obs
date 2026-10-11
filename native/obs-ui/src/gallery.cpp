#include "obs-ui/components.hpp"
#include <QApplication>
#include <QMainWindow>
#include <QComboBox>
#include <QPlainTextEdit>
#include <QMenu>
#include <QStyleFactory>
#include <QDateTime>

using namespace obsui;
int main(int argc, char **argv)
{
    QApplication app(argc,argv);
    app.setApplicationName("OBS UI · Galería Qt");
    app.setStyle(QStyleFactory::create("Fusion"));
    auto light = app.palette();
    light.setColor(QPalette::Window,QColor("#f3f4f6"));
    light.setColor(QPalette::WindowText,QColor("#20232b"));
    light.setColor(QPalette::Base,Qt::white);
    light.setColor(QPalette::AlternateBase,QColor("#e9ebef"));
    light.setColor(QPalette::Text,QColor("#20232b"));
    light.setColor(QPalette::PlaceholderText,QColor("#697080"));
    light.setColor(QPalette::Button,QColor("#e5e7ec"));
    light.setColor(QPalette::ButtonText,QColor("#20232b"));
    light.setColor(QPalette::Highlight,QColor("#4267ce"));
    light.setColor(QPalette::HighlightedText,Qt::white);
    light.setColor(QPalette::Disabled,QPalette::ButtonText,QColor("#8a909c"));
    light.setColor(QPalette::Disabled,QPalette::Text,QColor("#8a909c"));
    QMainWindow window; window.setWindowTitle("OBS UI · Componentes Qt — prototipo");
    auto *root = new QWidget(&window); auto *layout = new QHBoxLayout(root);
    auto *controls = new QWidget(root); controls->setMaximumWidth(320);
    auto *left = new QVBoxLayout(controls);
    auto *intro = new QLabel("Componentes Qt para OBS\nGalería con datos simulados",controls);
    intro->setWordWrap(true); left->addWidget(intro);
    auto *theme = new QComboBox(controls); theme->addItems({"Tema claro", "Tema oscuro"});
    theme->setAccessibleName("Tema de la galería"); left->addWidget(theme);
    auto *mode = new QComboBox(controls); mode->addItems({"Vacío", "Cargando", "Contenido", "Error"});
    mode->setAccessibleName("Estado del contenido"); left->addWidget(mode);
    auto *width = new QComboBox(controls); width->addItems({"260 px", "320 px", "480 px", "Flexible"});
    width->setAccessibleName("Ancho del panel"); left->addWidget(width);
    auto *log = new QPlainTextEdit(controls); log->setReadOnly(true);
    log->setAccessibleName("Eventos emitidos"); log->setMaximumBlockCount(100);
    left->addWidget(new QLabel("Eventos de los componentes",controls)); left->addWidget(log,1);
    auto *dock = new DockView(root);
    auto *header = new QWidget(dock); auto *headerLayout = new QHBoxLayout(header);
    headerLayout->setContentsMargins(0,0,0,0);
    auto *search = new SearchBox(header); auto *options = new IconButton(Icon::More,"Opciones",header);
    auto *menu = new QMenu(options); options->setMenu(menu); options->setPopupMode(QToolButton::InstantPopup);
    auto *reset = menu->addAction("Restablecer vista");
    headerLayout->addWidget(search,1); headerLayout->addWidget(options); dock->setHeader(header);
    auto *preview = new TextPreview;
    auto *states = new StateView(preview,dock); dock->setBody(states);
    auto *footer = new QWidget(dock); auto *footerLayout = new QHBoxLayout(footer);
    footerLayout->setContentsMargins(0,0,0,0);
    auto *transport = new TransportControls(footer); auto *volume = new VolumePopover(footer);
    footerLayout->addWidget(transport,1); footerLayout->addWidget(volume); dock->setFooter(footer);
    layout->addWidget(controls); layout->addWidget(dock,1); layout->addStretch();
    window.setCentralWidget(root);
    const QList<Choice> choices{{"welcome","Bienvenida"},{"reading","Lectura con texto largo"},{"closing","Cierre"}};
    const auto record = [log](const QString &event) { log->appendPlainText(QTime::currentTime().toString("HH:mm:ss") + " · " + event); };
    search->onQueryEdited = [search,choices,record](const QString &query) {
        QList<Choice> filtered;
        for(const auto &choice : choices) if(choice.label.contains(query,Qt::CaseInsensitive)) filtered.append(choice);
        search->setSuggestions(filtered); record("queryEdited: " + query);
    };
    search->onActivated = [preview,mode,record](const QString &id) {
        preview->setText(id == "reading"
            ? "Lectura con texto largo\n\nEste contenido demuestra el ajuste de líneas y el desplazamiento vertical.\n\n"
              "Los controles permanecen disponibles mientras lees.\n\nLa vista recibe datos y emite eventos.\n\n"
              "No se conecta a OBS ni cambia escenas.\n\nFin de la lectura."
            : id == "welcome" ? "Bienvenida\n\nSelecciona otro contenido desde el buscador." : "Cierre\n\nGracias por acompañarnos.");
        mode->setCurrentIndex(2); record("itemActivated: " + id);
    };
    search->setSuggestions(choices);
    QObject::connect(mode,&QComboBox::currentIndexChanged,states,[states,transport](int index) {
        states->setState(static_cast<ViewState>(index));
        transport->setState(index == 2 ? PlaybackState::Stopped : PlaybackState::Unavailable,true,true);
    });
    states->onRetry = [mode,record] { record("retryRequested"); mode->setCurrentIndex(1); };
    volume->onVolumeEdited = [record](int value) { record(QString("volumeEdited: %1").arg(value)); };
    transport->onAction = [transport,record](TransportAction action) {
        const QStringList names{"previousRequested","playRequested","pauseRequested","nextRequested","stopRequested"};
        record(names[static_cast<int>(action)]);
        // Only this simulated consumer updates playback state, not the component.
        transport->setState(action == TransportAction::Play ? PlaybackState::Playing :
                            action == TransportAction::Pause ? PlaybackState::Paused : PlaybackState::Stopped,true,true);
    };
    QObject::connect(reset,&QAction::triggered,dock,[search,choices,mode,volume,record] {
        search->setQuery({}); search->setSuggestions(choices); mode->setCurrentIndex(0);
        volume->setVolume(100); record("Vista restablecida; sin eventos de edición programática");
    });
    QObject::connect(width,&QComboBox::currentIndexChanged,dock,[dock](int index) {
        if(index < 3) dock->setFixedWidth(QList<int>{260,320,480}[index]);
        else { dock->setMinimumWidth(260); dock->setMaximumWidth(QWIDGETSIZE_MAX); }
    });
    QObject::connect(theme,&QComboBox::currentIndexChanged,&app,[&app,light](int index) {
        auto palette = light;
        if(index == 1) {
            palette.setColor(QPalette::Window,QColor("#242731"));
            palette.setColor(QPalette::WindowText,QColor("#e7e9ed"));
            palette.setColor(QPalette::Base,QColor("#1b1e26"));
            palette.setColor(QPalette::AlternateBase,QColor("#2c303b"));
            palette.setColor(QPalette::Text,QColor("#e7e9ed"));
            palette.setColor(QPalette::PlaceholderText,QColor("#a4aaba"));
            palette.setColor(QPalette::Button,QColor("#363b48"));
            palette.setColor(QPalette::ButtonText,QColor("#e7e9ed"));
            palette.setColor(QPalette::Highlight,QColor("#4267ce"));
            palette.setColor(QPalette::HighlightedText,Qt::white);
            palette.setColor(QPalette::Disabled,QPalette::ButtonText,QColor("#747b8b"));
            palette.setColor(QPalette::Disabled,QPalette::Text,QColor("#747b8b"));
        }
        app.setPalette(palette);
    });
    preview->setText("Contenido de ejemplo\n\nBusca Bienvenida, Lectura o Cierre.");
    dock->setFixedWidth(260); theme->setCurrentIndex(1);
    window.resize(680,540); window.show();
    return app.exec();
}
