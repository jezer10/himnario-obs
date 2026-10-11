#include "obs-ui/components.hpp"
#include <QApplication>
#include <QPointer>
#include <QKeyEvent>
#include <iostream>
#include <stdexcept>
using namespace obsui;
void require(bool value, const char *message) { if(!value) throw std::runtime_error(message); }
int main(int argc, char **argv)
{
    QApplication app(argc,argv);
    try {
        SearchBox search; int edits=0, activations=0; QString selected;
        search.onQueryEdited=[&](const QString &) { ++edits; };
        search.onActivated=[&](const QString &id) { ++activations; selected=id; };
        search.setSuggestions({{"a","Igual"},{"b","Igual"}});
        search.setQuery("Igual"); require(edits==0,"Programmatic query emitted an edit");
        require(search.activateChoice("b") && selected=="b","Selection used label instead of stable ID");
        search.setSuggestions({{"b","Nueva etiqueta"},{"a","Igual"}});
        require(search.activateChoice("b") && search.text()=="Nueva etiqueta","ID failed after reorder/rename");
        require(!search.activateChoice("deleted"),"Missing item activated");
        bool rejected=false;
        try { search.setSuggestions({{"a","Uno"},{"a","Dos"}}); } catch(const std::invalid_argument &) { rejected=true; }
        require(rejected,"Duplicate IDs accepted");
        require(search.activateChoice("b"),"Invalid update destroyed previous model");
        // Completion activation during the Enter event must cancel the deferred first-item fallback.
        const int before=activations;
        QMetaObject::invokeMethod(&search,"returnPressed",Qt::DirectConnection);
        search.activateChoice("a"); app.processEvents();
        require(activations==before+1 && selected=="a","Enter caused duplicate activation");
        search.setSuggestions({});
        QMetaObject::invokeMethod(&search,"returnPressed",Qt::DirectConnection); app.processEvents();
        require(activations==before+1,"Empty search activated stale item");
        std::cout << "PASS search identity, replacement, duplicate IDs, Enter and programmatic updates\n";

        VolumePopover volume; int volumeEdits=0;
        volume.onVolumeEdited=[&](int) { ++volumeEdits; };
        volume.setVolume(-10); require(volume.volume()==0 && volumeEdits==0,"Volume update emitted edit or failed clamping");
        volume.setVolume(200); require(volume.volume()==100 && volumeEdits==0,"Volume maximum failed");
        volume.findChild<QSlider *>()->setValue(35);
        require(volumeEdits==1 && volume.volume()==35,"Slider edit missing or duplicated");
        std::cout << "PASS volume clamp and edit separation\n";

        auto *preview=new TextPreview; StateView states(preview); int retries=0;
        states.onRetry=[&] { ++retries; };
        preview->setText("<b>Texto plano</b>");
        states.setState(ViewState::Content); require(states.currentWidget()==preview,"Content not selected");
        states.setState(ViewState::Error,"Fallo de ejemplo");
        states.findChild<QPushButton *>("retry")->click(); require(retries==1,"Retry not emitted");
        states.setState(ViewState::Content); require(preview->text()=="<b>Texto plano</b>","State transition destroyed content");
        std::cout << "PASS content retention and retry\n";

        DockView dock; QPointer<QWidget> old=new QWidget;
        dock.setBody(old); dock.setBody(old); require(old,"Same slot assignment destroyed widget");
        dock.setBody(new QWidget); require(!old,"Replaced region leaked its widget");
        std::cout << "PASS region ownership\n";

        TransportControls transport; int actions=0; TransportAction action{};
        transport.onAction=[&](TransportAction value) { ++actions; action=value; };
        auto buttons=transport.findChildren<QToolButton *>();
        for(auto *button:buttons) button->click(); require(actions==0,"Unavailable transport emitted action");
        transport.setState(PlaybackState::Playing,false,true);
        for(auto *button:buttons) if(button->accessibleName()=="Pausar") button->click();
        require(actions==1 && action==TransportAction::Pause,"Pause intent incorrect");
        require(!buttons.front()->isEnabled(),"Previous capability ignored");
        std::cout << "PASS transport capabilities and intents\n";
    } catch(const std::exception &error) { std::cerr << "FAIL: " << error.what() << '\n'; return 1; }
    return 0;
}
