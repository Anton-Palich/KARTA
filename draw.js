// js/draw.js — редактор меток и инструменты рисования

let currentEditingMarker = null;
const markerModal = document.getElementById('markerEditorModal');
const titleInp = document.getElementById('markerTitle'),
    catSel = document.getElementById('markerCategory');
const yearInp = document.getElementById('markerYear'),
    monthSel = document.getElementById('markerMonth');
const descInp = document.getElementById('markerDescription'),
    imgInp = document.getElementById('markerImage');
const vidInp = document.getElementById('markerVideo'),
    colorInp = document.getElementById('markerColor');
const previewDiv = document.getElementById('markerPreview');

for (let i = 0; i <= 12; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i === 0 ? 'Не указан' : monthName(i);
    monthSel.appendChild(opt);
}

function updatePreview() {
    let html = '';
    if (titleInp.value) html += '<h3 style="font-family:var(--logo-font);">' + titleInp.value + '</h3>';
    if (descInp.value) html += renderMarkdown(descInp.value);
    if (imgInp.value.trim()) html +=
        '<div class="watermarked-image"><img src="' + imgInp.value.trim() + '" style="max-width:200px;max-height:150px;object-fit:cover;"></div>';
    if (vidInp.value.trim()) {
        const m = vidInp.value.trim().match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (m) html +=
            '<iframe width="200" height="113" src="https://www.youtube.com/embed/' + m[1] + '" frameborder="0" allowfullscreen></iframe>';
    }
    previewDiv.innerHTML = html || '<em>Введите данные</em>';
}
[titleInp, descInp, imgInp, vidInp].forEach(el => el.addEventListener('input', updatePreview));

function openMarkerEditor(marker) {
    if (!state.explorerMode) return;
    currentEditingMarker = marker;
    const props = marker.feature?.properties || {};
    titleInp.value = props.title || '';
    catSel.value = props.category || 'battle';
    yearInp.value = props.year || '';
    monthSel.value = props.month || 0;
    descInp.value = props.description || '';
    imgInp.value = props.image || '';
    vidInp.value = props.video || '';
    colorInp.value = props.color || '#8b1a1a';
    updatePreview();
    markerModal.style.display = 'block';
}

function closeMarkerEditor() { markerModal.style.display = 'none'; currentEditingMarker = null; }

document.getElementById('saveMarkerBtn').addEventListener('click', function() {
    if (!currentEditingMarker) return;
    const props = currentEditingMarker.feature?.properties || {};
    props.title = titleInp.value;
    props.category = catSel.value;
    props.year = parseInt(yearInp.value) || 0;
    props.month = parseInt(monthSel.value) || 0;
    props.description = descInp.value;
    props.image = imgInp.value;
    props.video = vidInp.value;
    props.color = colorInp.value;
    currentEditingMarker.feature = { properties: props };
    if (currentEditingMarker instanceof L.Marker) {
        currentEditingMarker.setIcon(getCategoryIcon(props.category));
    } else {
        currentEditingMarker.setStyle({ color: props.color, fillColor: props.color });
    }
    // Применяем новый тултип и обработчик клика
    bindTooltipFromProps(currentEditingMarker, props);
    bindClickInfo(currentEditingMarker, props);
    saveDrawings();
    applyAllFilters();
    closeMarkerEditor();
});
document.getElementById('cancelMarkerBtn').addEventListener('click', closeMarkerEditor);
document.getElementById('closeMarkerEditor').addEventListener('click', closeMarkerEditor);
window.addEventListener('click', e => { if (e.target === markerModal) closeMarkerEditor(); });
drawnItems.on('click', function(e) {
    if (state.explorerMode && e.layer instanceof L.Marker) {
        L.DomEvent.stopPropagation(e);
        openMarkerEditor(e.layer);
    }
});

map.on(L.Draw.Event.CREATED, function(e) {
    const layer = e.layer;
    drawnItems.addLayer(layer);
    if (layer instanceof L.Marker) {
        // Для новых маркеров задаём начальные свойства и привязываем тултип+клик
        const props = { category: 'battle', year: 1918, month: 0, title: '', description: '' };
        layer.feature = { properties: props };
        bindTooltipFromProps(layer, props);
        bindClickInfo(layer, props);
        openMarkerEditor(layer);
    } else {
        layer.feature = { properties: { category: 'battle', year: 1918, month: 0 } };
    }
    saveDrawings();
    applyAllFilters();
});
map.on(L.Draw.Event.EDITED, saveDrawings);
map.on(L.Draw.Event.DELETED, saveDrawings);

function saveDrawings() {
    const data = drawnItems.toGeoJSON();
    if (data.features.length) localStorage.setItem('drawnGeoJSON', JSON.stringify(data));
    else localStorage.removeItem('drawnGeoJSON');
}

window.openMarkerEditor = openMarkerEditor;
window.saveDrawings = saveDrawings;