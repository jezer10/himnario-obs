#pragma once
#include <QWidget>
#include <QToolButton>
#include <QPushButton>
#include <QLabel>
#include <QLineEdit>
#include <QCompleter>
#include <QStandardItemModel>
#include <QStackedWidget>
#include <QVBoxLayout>
#include <QSlider>
#include <functional>

namespace obsui {
enum class Icon { Play, Pause, Stop, Previous, Next, Volume, Muted, More, Search };
QIcon icon(Icon value);

class IconButton : public QToolButton {
public:
    IconButton(Icon icon, const QString &label, QWidget *parent = nullptr);
    void setSemanticIcon(Icon icon, const QString &label);
};

class TextPreview : public QWidget {
public:
    explicit TextPreview(QWidget *parent = nullptr);
    void setText(const QString &text);
    QString text() const;
private:
    QLabel *label_;
};

class DockView : public QWidget {
public:
    explicit DockView(QWidget *parent = nullptr);
    void setHeader(QWidget *widget);
    void setBody(QWidget *widget);
    void setFooter(QWidget *widget);
private:
    QVBoxLayout *regions_[3];
    void replace(int region, QWidget *widget);
};

struct Choice { QString id; QString label; };
class SearchBox : public QLineEdit {
public:
    explicit SearchBox(QWidget *parent = nullptr);
    void setSuggestions(const QList<Choice> &choices);
    void setQuery(const QString &query);
    bool activateChoice(const QString &id);
    std::function<void(const QString &)> onQueryEdited;
    std::function<void(const QString &)> onActivated;
private:
    QCompleter *completer_;
    QStandardItemModel *model_;
    quint64 activation_ = 0;
};

enum class ViewState { Empty, Loading, Content, Error };
class StateView : public QStackedWidget {
public:
    explicit StateView(QWidget *content, QWidget *parent = nullptr);
    void setState(ViewState state, const QString &message = {});
    ViewState state() const { return state_; }
    std::function<void()> onRetry;
private:
    ViewState state_ = ViewState::Empty;
    QLabel *empty_, *loading_, *error_;
};

class VolumePopover : public IconButton {
public:
    explicit VolumePopover(QWidget *parent = nullptr);
    void setVolume(int percent);
    int volume() const;
    std::function<void(int)> onVolumeEdited;
private:
    QSlider *slider_;
    QLabel *value_;
    void refresh();
};

enum class PlaybackState { Unavailable, Stopped, Playing, Paused };
enum class TransportAction { Previous, Play, Pause, Next, Stop };
class TransportControls : public QWidget {
public:
    explicit TransportControls(QWidget *parent = nullptr);
    void setState(PlaybackState state, bool canPrevious, bool canNext);
    std::function<void(TransportAction)> onAction;
private:
    PlaybackState state_ = PlaybackState::Unavailable;
    IconButton *previous_, *play_, *next_, *stop_;
};
} // namespace obsui
