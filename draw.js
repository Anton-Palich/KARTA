// js/draw.js — редактор свойств для всех типов объектов с автоматическим добавлением в материалы

// Проверка, что drawnItems инициализирован
if (typeof drawnItems === 'undefined' || drawnItems === null) {
    console.warn('drawnItems не инициализирован в draw.js');
    // Создаём фиктивный объект, чтобы избежать ошибок
    window.drawnItems = new L.FeatureGroup();
}

let currentEditingLayer = null;
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

// Заполняем месяцы
if (monthSel.options.length === 0) {
    for (let i = 0; i <= 12; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i === 0 ? 'Не указан' : monthName(i);
        monthSel.appendChild(opt);
    }
}

function updatePreview() {
    let html = '';
    if (titleInp.value) html += '<h3 style="font-family:var(--logo-font);">' + titleInp.value + '</h3>';
    if (descInp.value) html += renderMarkdown(descInp.value);
    if (imgInp.value.trim()) html +=
        '<div class="watermarked-image"><img src="' + imgInp.value.trim() + '" style="max-width:200px;max-height:150px;object-fit:cover;" onerror="this.style.display=\'none\'"></div>';
    if (vidInp.value.trim()) {
        const m = vidInp.value.trim().match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (m) html +=
            '<iframe width="200" height="113" src="https://www.youtube.com/embed/' + m[1] + '" frameborder="0" allowfullscreen></iframe>';
    }
    previewDiv.innerHTML = html || '<em>Введите данные</em>';
}
[titleInp, descInp, imgInp, vidInp].forEach(el => el.addEventListener('input', updatePreview));

// Добавление карточки в материалы
function addToMaterials(props) {
    if (!props) return;
    let type = null;
    let url = null;
    if (props.video && props.video.trim()) {
        type = 'видео';
        url = props.video.trim();
    } else if (props.image && props.image.trim()) {
        type = 'фото';
        url = props.image.trim();
    } else {
        return;
    }
    const existing = state.materialsFromMap.some(item => item.Название === props.title && item.Ссылка === url);
    if (existing) return;
    const card = {
        Название: props.title || 'Без названия',
        Тип: type,
        Год: props.year || '',
        Месяц: props.month || '',
        Ссылка: url,
        Описание: props.description || ''
    };
    if (type === 'фото') {
        state.materialsData.photos.push(card);
    } else if (type === 'видео') {
        state.materialsData.videos.push(card);
    }
    state.materialsFromMap.push(card);
    if (document.getElementById('materialsModal').style.display === 'block') {
        buildMaterialsUI();
    }
}

// Открытие редактора
function openLayerEditor(layer) {
    if (!state.explorerMode) return;
    currentEditingLayer = layer;
    const props = layer.feature?.properties || {};
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

function closeMarkerEditor() { markerModal.style.display = 'none'; currentEditingLayer = null; }

// Сохранение
document.getElementById('saveMarkerBtn').addEventListener('click', function() {
    if (!currentEditingLayer) return;
    const props = currentEditingLayer.feature?.properties || {};
    props.title = titleInp.value;
    props.category = catSel.value;
    props.year = parseInt(yearInp.value) || 0;
    props.month = parseInt(monthSel.value) || 0;
    props.description = descInp.value;
    props.image = imgInp.value;
    props.video = vidInp.value;
    props.color = colorInp.value;
    currentEditingLayer.feature = { properties: props };
    if (currentEditingLayer instanceof L.Marker) {
        currentEditingLayer.setIcon(getCategoryIcon(props.category));
    } else {
        currentEditingLayer.setStyle({ color: props.color, fillColor: props.color });
    }
    bindTooltipFromProps(currentEditingLayer, props);
    bindClickInfo(currentEditingLayer, props);
    addToMaterials(props);
    saveDrawings();
    applyAllFilters();
    closeMarkerEditor();
});
document.getElementById('cancelMarkerBtn').addEventListener('click', closeMarkerEditor);
document.getElementById('closeMarkerEditor').addEventListener('click', closeMarkerEditor);
window.addEventListener('click', e => { if (e.target === markerModal) closeMarkerEditor(); });

// Клик по объекту для редактирования
if (drawnItems) {
    drawnItems.on('click', function(e) {
        if (state.explorerMode && e.layer) {
            L.DomEvent.stopPropagation(e);
            openLayerEditor(e.layer);
        }
    });
}

// Создание объекта через Geoman
map.on('pm:create', function(e) {
    const layer = e.layer;
    if (drawnItems && !drawnItems.hasLayer(layer)) {
        drawnItems.addLayer(layer);
    }
    const props = { category: 'battle', year: 1918, month: 0, title: '', description: '' };
    layer.feature = { properties: props };
    bindTooltipFromProps(layer, props);
    bindClickInfo(layer, props);
    openLayerEditor(layer);
    saveDrawings();
    applyAllFilters();
});

map.on('pm:update', saveDrawings);
map.on('pm:remove', saveDrawings);

function saveDrawings() {
    if (!drawnItems) return;
    const data = drawnItems.toGeoJSON();
    if (data.features.length) localStorage.setItem('drawnGeoJSON', JSON.stringify(data));
    else localStorage.removeItem('drawnGeoJSON');
}

window.openLayerEditor = openLayerEditor;
window.saveDrawings = saveDrawings;
window.addToMaterials = addToMaterials;