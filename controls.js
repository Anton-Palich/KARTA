// js/controls.js — управление интерфейсом, Geoman, координаты курсора, кнопка слоёв

let drawControl = null;

const toggleModeBtn = document.getElementById('toggleModeBtn');
const controlPanel = document.getElementById('controlPanel');

function enableExplorerMode() {
    state.explorerMode = true;
    toggleModeBtn.innerHTML = '<i class="fa fa-eye"></i> Просмотр';
    controlPanel.classList.add('visible');
    if (!drawControl && map.pm) {
        map.pm.addControls({
            position: 'topleft',
            drawMarker: true,
            drawPolygon: true,
            drawRectangle: true,
            drawCircle: true,
            drawPolyline: true,
            editMode: true,
            dragMode: true,
            cutPolygon: true,
            removalMode: true,
            rotateMode: true,
            editLayer: drawnItems
        });
        map.pm.setGlobalOptions({
            allowSelfIntersection: false,
            snapDistance: 10,
            finishOn: 'click'
        });
        drawControl = true;
    } else if (!map.pm) {
        console.warn('Leaflet-Geoman не загружен, режим редактирования недоступен');
    }
    updateCursor();
    showCoords(true);
}

function enableViewMode() {
    state.explorerMode = false;
    toggleModeBtn.innerHTML = '<i class="fa fa-search"></i> Исследователь';
    controlPanel.classList.remove('visible');
    if (drawControl && map.pm) {
        map.pm.removeControls();
        drawControl = null;
    }
    updateCursor();
    showCoords(false);
}

toggleModeBtn.addEventListener('click', () => state.explorerMode ? enableViewMode() : enableExplorerMode());
enableViewMode();

function updateCursor() {
    document.getElementById('map').style.cursor = state.explorerMode ? 'crosshair' : 'grab';
}

function showCoords(show) {
    const coordDiv = document.getElementById('coord-tooltip');
    if (coordDiv) coordDiv.style.display = show ? 'block' : 'none';
}

// Создаём плавающий блок координат (если ещё не создан)
if (!document.getElementById('coord-tooltip')) {
    const coordDiv = document.createElement('div');
    coordDiv.id = 'coord-tooltip';
    coordDiv.style.cssText = `
        position: absolute;
        background: rgba(255,248,240,0.95);
        border: 1px solid var(--paper-border);
        border-radius: 4px;
        padding: 4px 10px;
        font-family: var(--logo-font);
        font-size: 0.8rem;
        color: var(--ink);
        pointer-events: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        display: none;
        z-index: 10000;
        white-space: nowrap;
    `;
    document.getElementById('map').appendChild(coordDiv);
}

map.on('mousemove', function(e) {
    const coordDiv = document.getElementById('coord-tooltip');
    if (!state.explorerMode) {
        coordDiv.style.display = 'none';
        return;
    }
    const lat = e.latlng.lat.toFixed(5);
    const lng = e.latlng.lng.toFixed(5);
    coordDiv.textContent = `📍 ${lat}, ${lng}`;
    coordDiv.style.display = 'block';
    coordDiv.style.left = (e.containerPoint.x + 15) + 'px';
    coordDiv.style.top = (e.containerPoint.y + 15) + 'px';
});

map.on('mouseout', () => {
    if (!state.explorerMode) return;
    document.getElementById('coord-tooltip').style.display = 'none';
});
document.getElementById('map').addEventListener('mouseleave', () => {
    if (!state.explorerMode) return;
    document.getElementById('coord-tooltip').style.display = 'none';
});

// ========== ЛУПА ==========
const zoomBtn = document.getElementById('zoomTextBtn');
zoomBtn.addEventListener('click', function() {
    document.body.classList.toggle('zoom');
    this.innerHTML = document.body.classList.contains('zoom') ?
        '<i class="fa fa-search-minus"></i> Норма' :
        '<i class="fa fa-search-plus"></i> Лупа 2x';
});

// ========== БОКОВАЯ ПАНЕЛЬ ==========
const sidebar = document.getElementById('sidebar');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openSidebar() { sidebar.classList.add('open'); sidebarOverlay.classList.add('active'); }
function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('active'); }
sidebarToggleBtn.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
closeSidebarBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);
document.getElementById('sidebarList').addEventListener('click', function(e) {
    if (e.target.closest('.sidebar-item')) closeSidebar();
});

// ========== ПОИСК МЕСТА ==========
document.getElementById('locationSearchBtn').addEventListener('click', searchLocation);
document.getElementById('locationSearchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchLocation();
});

function searchLocation() {
    const q = document.getElementById('locationSearchInput').value.trim();
    if (!q) return;
    fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(q) + '&limit=1')
        .then(r => r.json())
        .then(data => {
            if (data.length) map.setView([data[0].lat, data[0].lon], 13);
            else alert('Место не найдено');
        })
        .catch(() => alert('Ошибка поиска'));
}

// ========== ЗАГРУЗКА ДАННЫХ ==========
document.getElementById('loadData').addEventListener('click', function() {
    const url = document.getElementById('dataUrl').value.trim();
    if (!url) return alert('Вставьте ссылку на файл');
    loadFileFromUrl(url);
});
document.getElementById('clearData').addEventListener('click', function() {
    if (userDataLayer) { map.removeLayer(userDataLayer); userDataLayer = null; }
    applyAllFilters();
});

// Drag & drop
const mapEl = document.getElementById('map');
mapEl.addEventListener('dragover', e => e.preventDefault());
mapEl.addEventListener('drop', function(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        const text = ev.target.result;
        const name = file.name.toLowerCase();
        if (name.endsWith('.geojson') || name.endsWith('.json') || name.endsWith('.kml') || name.endsWith('.gpx') || name.endsWith('.csv')) {
            loadTextData(text, name);
        } else if (name.endsWith('.kmz')) {
            loadKmzBuffer(ev.target.result);
        } else if (name.endsWith('.xlsx')) {
            loadExcelFile(file);
        } else {
            alert('Неподдерживаемый формат.');
        }
    };
    if (file.name.endsWith('.kmz') || file.name.endsWith('.xlsx')) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
});

function loadKmzBuffer(buffer) {
    alert('Загрузка KMZ пока не реализована, но вы можете распаковать архив и загрузить KML.');
}
function loadExcelFile(file) {
    alert('Загрузка Excel пока не реализована, используйте CSV.');
}
function loadTextData(text, name) {
    try {
        let layer = null;
        if (name.includes('.geojson') || name.includes('.json')) {
            layer = omnivore.geojson ? omnivore.geojson(text) : null;
        } else if (name.includes('.kml')) {
            layer = omnivore.kml ? omnivore.kml(text) : null;
        } else if (name.includes('.gpx')) {
            layer = omnivore.gpx ? omnivore.gpx(text) : null;
        } else if (name.includes('.csv')) {
            layer = omnivore.csv ? omnivore.csv(text) : null;
        }
        if (layer) {
            layer.addTo(map);
            if (userDataLayer) map.removeLayer(userDataLayer);
            userDataLayer = layer;
            applyAllFilters();
        } else {
            alert('Не удалось распознать формат или плагин omnivore не загружен');
        }
    } catch (err) {
        alert('Ошибка загрузки: ' + err.message);
    }
}
function loadFileFromUrl(url) {
    fetch(url)
        .then(r => r.text())
        .then(text => {
            const name = url.split('/').pop();
            loadTextData(text, name);
        })
        .catch(err => alert('Ошибка загрузки: ' + err.message));
}

// ========== СОХРАНЕНИЕ И ПЕЧАТЬ ==========
document.getElementById('saveDrawingsBtn').addEventListener('click', function() {
    const data = drawnItems.toGeoJSON();
    if (!data.features.length) return alert('Нет объектов');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'drawings.geojson';
    a.click();
});
document.getElementById('printBtn').addEventListener('click', () => window.print());

window.drawControl = drawControl;