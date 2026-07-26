// js/utils.js
const monthNames = ['', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
function monthName(m) { return monthNames[m] || ''; }

const catLabels = {
    battle: 'Боевые действия',
    route: 'Маршруты армий',
    memorial: 'Памятные места',
    person: 'Персоналии'
};

function renderMarkdown(md) {
    if (!md) return '';
    return md
        .replace(/^##\s*(.+)$/gm, '<h3 style="font-family:var(--logo-font);font-size:0.9rem;">$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
            '<div class="watermarked-image"><img src="$2" alt="$1" style="max-width:200px;max-height:150px;object-fit:cover;" onerror="this.style.display=\'none\'"></div>'
        )
        .replace(/(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/g,
            (m, p1, p2, p3, p4) =>
            '<iframe width="200" height="113" src="https://www.youtube.com/embed/' + p4 + '" frameborder="0" allowfullscreen></iframe>'
        )
        .replace(/\n/g, '<br>');
}

function bindTooltipFromProps(layer, props) {
    if (!props) return;
    if (props.title) {
        layer.bindTooltip(props.title, {
            permanent: false,
            direction: 'auto',
            className: 'marker-tooltip'
        });
    }
}

function bindClickInfo(layer, props) {
    if (!props) return;
    layer.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        showInfoPanel(layer, props);
    });
}

function bindPopupFromProps(layer, props) {
    console.warn('bindPopupFromProps устарела, используйте bindTooltipFromProps и bindClickInfo');
}