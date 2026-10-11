#include "obs-ui/components.hpp"
#include <QAbstractItemView>
#include <QApplication>
#include <QIconEngine>
#include <QPainter>
#include <QPainterPath>
#include <QScrollArea>
#include <QProgressBar>
#include <QMenu>
#include <QWidgetAction>
#include <QSignalBlocker>
#include <QTimer>
#include <QSet>
#include <stdexcept>

namespace obsui {
namespace {
class SemanticIcon final : public QIconEngine {
public:
    explicit SemanticIcon(Icon value) : value_(value) {}
    QIconEngine *clone() const override { return new SemanticIcon(value_); }
    void paint(QPainter *p, const QRect &rect, QIcon::Mode mode, QIcon::State) override
    {
        p->save();
        p->setRenderHint(QPainter::Antialiasing);
        const auto palette = QApplication::palette();
        const auto color = palette.color(mode == QIcon::Disabled ? QPalette::Disabled : QPalette::Active,
                                         QPalette::ButtonText);
        p->translate(rect.center());
        const auto scale = qMin(rect.width(), rect.height()) / 24.0;
        p->scale(scale, scale);
        p->setPen(QPen(color, 1.8, Qt::SolidLine, Qt::RoundCap, Qt::RoundJoin));
        p->setBrush(color);
        switch (value_) {
        case Icon::Play: p->drawPolygon(QPolygonF{{-5,-8},{8,0},{-5,8}}); break;
        case Icon::Pause: p->drawRect(QRectF(-6,-8,3,16)); p->drawRect(QRectF(3,-8,3,16)); break;
        case Icon::Stop: p->drawRoundedRect(QRectF(-7,-7,14,14),1,1); break;
        case Icon::Previous:
        case Icon::Next:
            if (value_ == Icon::Previous) p->scale(-1,1);
            p->drawPolygon(QPolygonF{{-7,-7},{4,0},{-7,7}}); p->drawLine(7,-8,7,8); break;
        case Icon::More:
            for (int y : {-6,0,6}) p->drawEllipse(QPointF(0,y),1.3,1.3);
            break;
        case Icon::Search:
            p->setBrush(Qt::NoBrush); p->drawEllipse(QPointF(-2,-2),6,6); p->drawLine(3,3,9,9); break;
        case Icon::Volume:
        case Icon::Muted:
            p->drawPolygon(QPolygonF{{-9,-3},{-5,-3},{0,-7},{0,7},{-5,3},{-9,3}});
            p->setBrush(Qt::NoBrush);
            if (value_ == Icon::Muted) { p->drawLine(4,-3,10,3); p->drawLine(4,3,10,-3); }
            else { p->drawArc(QRectF(-3,-6,12,12),-60*16,120*16); }
            break;
        }
        p->restore();
    }
    QPixmap pixmap(const QSize &size, QIcon::Mode mode, QIcon::State state) override
    {
        QPixmap result(size); result.fill(Qt::transparent);
        QPainter painter(&result); paint(&painter, QRect(QPoint(),size),mode,state);
        return result;
    }
private:
    Icon value_;
};
QLabel *messageLabel(QWidget *parent)
{
    auto *label = new QLabel(parent);
    label->setTextFormat(Qt::PlainText);
    label->setWordWrap(true);
    label->setAlignment(Qt::AlignCenter);
    return label;
}
}
QIcon icon(Icon value) { return QIcon(new SemanticIcon(value)); }

IconButton::IconButton(Icon value, const QString &label, QWidget *parent) : QToolButton(parent)
{
    setIconSize(QSize(20,20)); setMinimumSize(32,32);
    setFocusPolicy(Qt::StrongFocus);
    setSemanticIcon(value,label);
}
void IconButton::setSemanticIcon(Icon value, const QString &label)
{
    setIcon(obsui::icon(value)); setToolTip(label); setAccessibleName(label);
}
TextPreview::TextPreview(QWidget *parent) : QWidget(parent)
{
    auto *layout = new QVBoxLayout(this); layout->setContentsMargins(0,0,0,0);
    auto *scroll = new QScrollArea(this); scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    label_ = messageLabel(scroll); label_->setTextInteractionFlags(Qt::TextSelectableByMouse);
    label_->setMargin(12); scroll->setWidget(label_); layout->addWidget(scroll);
}
void TextPreview::setText(const QString &text) { label_->setText(text); }
QString TextPreview::text() const { return label_->text(); }

DockView::DockView(QWidget *parent) : QWidget(parent)
{
    setMinimumSize(260,240);
    auto *layout = new QVBoxLayout(this); layout->setContentsMargins(8,8,8,8); layout->setSpacing(8);
    for (int i=0;i<3;++i) {
        regions_[i] = new QVBoxLayout(); regions_[i]->setContentsMargins(0,0,0,0);
        layout->addLayout(regions_[i], i == 1 ? 1 : 0);
    }
}
void DockView::replace(int region, QWidget *widget)
{
    auto *layout = regions_[region];
    if (layout->count() && layout->itemAt(0)->widget() == widget) return;
    // A region owns its content. Replacing it destroys the previous content.
    while (auto *item = layout->takeAt(0)) { delete item->widget(); delete item; }
    if (widget) layout->addWidget(widget);
}
void DockView::setHeader(QWidget *w) { replace(0,w); }
void DockView::setBody(QWidget *w) { replace(1,w); }
void DockView::setFooter(QWidget *w) { replace(2,w); }

SearchBox::SearchBox(QWidget *parent) : QLineEdit(parent)
{
    setPlaceholderText("Buscar…"); setAccessibleName("Buscar contenido"); setClearButtonEnabled(true);
    model_ = new QStandardItemModel(this);
    completer_ = new QCompleter(model_,this);
    completer_->setCompletionMode(QCompleter::UnfilteredPopupCompletion);
    completer_->setMaxVisibleItems(7); setCompleter(completer_);
    connect(this,&QLineEdit::textEdited,this,[this](const QString &query) {
        if (onQueryEdited) onQueryEdited(query);
    });
    connect(completer_,qOverload<const QModelIndex &>(&QCompleter::activated),this,[this](const QModelIndex &item) {
        activateChoice(item.data(Qt::UserRole).toString());
    });
    connect(this,&QLineEdit::returnPressed,this,[this] {
        const auto generation = activation_;
        QTimer::singleShot(0,this,[this,generation] {
            if (generation == activation_ && model_->rowCount())
                activateChoice(model_->index(0,0).data(Qt::UserRole).toString());
        });
    });
}
void SearchBox::setSuggestions(const QList<Choice> &choices)
{
    QSet<QString> ids;
    for (const auto &choice : choices) {
        if (choice.id.isEmpty() || ids.contains(choice.id))
            throw std::invalid_argument("SearchBox requires nonempty unique IDs");
        ids.insert(choice.id);
    }
    model_->clear();
    for (const auto &choice : choices) {
        auto *item = new QStandardItem(choice.label);
        item->setData(choice.id,Qt::UserRole); model_->appendRow(item);
    }
    if (hasFocus() && !text().isEmpty() && model_->rowCount()) completer_->complete();
    else completer_->popup()->hide();
}
void SearchBox::setQuery(const QString &query)
{
    ++activation_; setText(query); completer_->popup()->hide();
}
bool SearchBox::activateChoice(const QString &id)
{
    for (int row=0;row<model_->rowCount();++row) {
        auto item = model_->index(row,0);
        if (item.data(Qt::UserRole).toString() != id) continue;
        ++activation_; setText(item.data().toString()); completer_->popup()->hide();
        if (onActivated) onActivated(id);
        return true;
    }
    return false;
}

StateView::StateView(QWidget *content, QWidget *parent) : QStackedWidget(parent)
{
    if (!content) throw std::invalid_argument("StateView requires content");
    empty_ = messageLabel(this); addWidget(empty_);
    auto *loadingPage = new QWidget(this); auto *loadingLayout = new QVBoxLayout(loadingPage);
    loading_ = messageLabel(loadingPage); auto *bar = new QProgressBar(loadingPage); bar->setRange(0,0);
    loadingLayout->addStretch(); loadingLayout->addWidget(loading_); loadingLayout->addWidget(bar);
    loadingLayout->addStretch(); addWidget(loadingPage);
    addWidget(content);
    auto *errorPage = new QWidget(this); auto *errorLayout = new QVBoxLayout(errorPage);
    error_ = messageLabel(errorPage); auto *retry = new QPushButton("Reintentar",errorPage);
    retry->setObjectName("retry"); errorLayout->addStretch(); errorLayout->addWidget(error_);
    errorLayout->addWidget(retry); errorLayout->addStretch(); addWidget(errorPage);
    connect(retry,&QPushButton::clicked,this,[this] { if (onRetry) onRetry(); });
    setState(ViewState::Empty);
}
void StateView::setState(ViewState state, const QString &message)
{
    state_ = state;
    empty_->setText(state == ViewState::Empty && !message.isEmpty() ? message : "No hay contenido.");
    loading_->setText(state == ViewState::Loading && !message.isEmpty() ? message : "Cargando…");
    error_->setText(state == ViewState::Error && !message.isEmpty() ? message : "No se pudo cargar el contenido.");
    setCurrentIndex(static_cast<int>(state));
}

VolumePopover::VolumePopover(QWidget *parent) : IconButton(Icon::Volume,"Volumen",parent)
{
    setPopupMode(QToolButton::InstantPopup);
    auto *menu = new QMenu(this); auto *action = new QWidgetAction(menu);
    auto *panel = new QWidget(menu); auto *layout = new QVBoxLayout(panel);
    value_ = new QLabel(panel); slider_ = new QSlider(Qt::Horizontal,panel);
    slider_->setAccessibleName("Volumen en porcentaje"); slider_->setRange(0,100);
    slider_->setMinimumWidth(160); layout->addWidget(value_); layout->addWidget(slider_);
    action->setDefaultWidget(panel); menu->addAction(action); setMenu(menu);
    connect(slider_,&QSlider::valueChanged,this,[this](int value) {
        refresh(); if (onVolumeEdited) onVolumeEdited(value);
    });
    connect(menu,&QMenu::aboutToShow,this,[this] { slider_->setFocus(); });
    connect(menu,&QMenu::aboutToHide,this,[this] { setFocus(); });
    setVolume(100);
}
void VolumePopover::setVolume(int percent)
{
    const QSignalBlocker guard(slider_); slider_->setValue(qBound(0,percent,100)); refresh();
}
int VolumePopover::volume() const { return slider_->value(); }
void VolumePopover::refresh()
{
    value_->setText(QString("Volumen: %1 %").arg(volume()));
    setSemanticIcon(volume() ? Icon::Volume : Icon::Muted,"Volumen");
}

TransportControls::TransportControls(QWidget *parent) : QWidget(parent)
{
    auto *layout = new QHBoxLayout(this); layout->setContentsMargins(0,0,0,0); layout->setSpacing(4);
    previous_ = new IconButton(Icon::Previous,"Anterior",this);
    play_ = new IconButton(Icon::Play,"Reproducir",this);
    next_ = new IconButton(Icon::Next,"Siguiente",this);
    stop_ = new IconButton(Icon::Stop,"Detener",this);
    layout->addStretch();
    for (auto *button : {previous_,play_,next_,stop_}) layout->addWidget(button);
    layout->addStretch();
    connect(previous_,&QToolButton::clicked,this,[this] { if(onAction) onAction(TransportAction::Previous); });
    connect(next_,&QToolButton::clicked,this,[this] { if(onAction) onAction(TransportAction::Next); });
    connect(stop_,&QToolButton::clicked,this,[this] { if(onAction) onAction(TransportAction::Stop); });
    connect(play_,&QToolButton::clicked,this,[this] {
        if(onAction) onAction(state_ == PlaybackState::Playing ? TransportAction::Pause : TransportAction::Play);
    });
    setState(PlaybackState::Unavailable,false,false);
}
void TransportControls::setState(PlaybackState state, bool canPrevious, bool canNext)
{
    state_ = state; const bool ready = state != PlaybackState::Unavailable;
    previous_->setEnabled(ready && canPrevious); next_->setEnabled(ready && canNext);
    play_->setEnabled(ready); stop_->setEnabled(ready);
    play_->setSemanticIcon(state == PlaybackState::Playing ? Icon::Pause : Icon::Play,
                          state == PlaybackState::Playing ? "Pausar" : "Reproducir");
}
} // namespace obsui
