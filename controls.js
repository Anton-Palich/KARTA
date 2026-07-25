// js/controls.js — управление интерфейсом (кнопки, загрузка, режимы)

let drawControl = null;

// Режим исследователя
const toggleModeBtn = document.getElementById('toggleModeBtn');
const controlPanel = document.getElementById('controlPanel');

function enableExplorerMode() {
    state.explorerMode = true;
    toggleModeBtn.innerHTML = '<i class="fa fa-eye"></i> Просмотр';
    controlPanel.classList.add('visible');
    if (!drawControl) {
        drawControl = new L.Control.Draw({
            draw: {
                polygon: { allowIntersection: false, showArea: true },
                polyline: {},
                rectangle: {},
                circle: {},
                marker: {},
                circlemarker: {}
            },
            edit: { featureGroup: drawnItems, remove: true }
        });
        map.addControl(drawControl);
    }
}

function enableViewMode() {
    state.explorerMode = false;
    toggleModeBtn.innerHTML = '<i class="fa fa-search"></i> Исследователь';
    controlPanel.classList.remove('visible');
    if (drawControl) { map.removeControl(drawControl); drawControl = null; }
}
toggleModeBtn.addEventListener('click', () => state.explorerMode ? enableViewMode() : enableExplorerMode());
enableViewMode();

// Лупа 2x
const zoomBtn = document.getElementById('zoomTextBtn');
zoomBtn.addEventListener('click', function() {
    document.body.classList.toggle('zoom');
    this.innerHTML = document.body.classList.contains('zoom') ?
        '<i class="fa fa-search-minus"></i> Норма' :
        '<i class="fa fa-search-plus"></i> Лупа 2x';
});

// Боковая панель
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

// Поиск места
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

// Загрузка данных
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
        if (name.endsWith('.geojson') || name.endsWith('.json') || name.endsWith('.kml') || name
            .endsWith('.gpx') || name.endsWith('.csv')) {
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

// Функции загрузки файлов
window.loadFileFromUrl = function(url) {
    const indicator = document.getElementById('loadingIndicator');
    indicator.style.display = 'inline-block';
    fetch(url)
        .then(r => {
            if (!r.ok) throw new Error('Ошибка загрузки');
            const ct = r.headers.get('content-type') || '';
            if (ct.includes('application/vnd.google-earth.kmz') || url.endsWith('.kmz')) {
                return r.arrayBuffer().then(buf => loadKmzBuffer(buf));
            } else if (ct.includes('spreadsheet') || url.endsWith('.xlsx')) {
                return r.arrayBuffer().then(buf => loadExcelBuffer(buf));
            } else {
                return r.text().then(text => loadTextData(text, url));
            }
        })
        .catch(err => alert('Ошибка: ' + err))
        .finally(() => indicator.style.display = 'none');
};

window.loadTextData = function(text, sourceName) {
    if (userDataLayer) {
        map.removeLayer(userDataLayer);
        userDataLayer = null;
    }
    try {
        let layer = null;
        if (text.trim().startsWith('{')) {
            // GeoJSON
            const json = JSON.parse(text);
            layer = L.geoJSON(json, {
                pointToLayer: (f, latlng) => L.marker(latlng, { icon: getCategoryIcon(f.properties?.category) }),
                onEachFeature: (f, l) => {
                    bindTooltipFromProps(l, f.properties);
                    bindClickInfo(l, f.properties);
                }
            });
        } else if (text.includes('<kml') || text.includes('<gpx')) {
            const blob = new Blob([text], { type: 'text/xml' });
            const url = URL.createObjectURL(blob);
            if (text.includes('<kml')) {
                layer = L.omnivore.kml(url);
            } else {
                layer = L.omnivore.gpx(url);
            }
            layer.on('ready', function() {
                // Для каждого объекта в слое добавляем тултип и клик
                layer.eachLayer(function(l) {
                    const props = l.feature?.properties || {};
                    bindTooltipFromProps(l, props);
                    bindClickInfo(l, props);
                });
                try { map.fitBounds(layer.getBounds()); } catch (_) {}
            });
        } else if (text.includes(',')) {
            const blob = new Blob([text], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            layer = L.omnivore.csv(url);
            layer.on('ready', function() {
                layer.eachLayer(function(l) {
                    const props = l.feature?.properties || {};
                    bindTooltipFromProps(l, props);
                    bindClickInfo(l, props);
                });
                try { map.fitBounds(layer.getBounds()); } catch (_) {}
            });
        } else {
            throw new Error('Не удалось определить формат.');
        }
        if (layer) {
            userDataLayer = layer;
            layer.addTo(map);
            setTimeout(() => {
                try { map.fitBounds(layer.getBounds()); } catch (_) {}
            }, 500);
            applyAllFilters();
        }
    } catch (e) {
        alert('Ошибка разбора: ' + e.message);
    }
};

window.loadKmzBuffer = function(buf) {
    JSZip.loadAsync(buf)
        .then(zip => {
            const kmlFile = Object.keys(zip.files).find(f => f.endsWith('.kml'));
            if (!kmlFile) throw new Error('KML не найден');
            return zip.file(kmlFile).async('string');
        })
        .then(text => loadTextData(text, 'kmz'))
        .catch(err => alert('Ошибка KMZ: ' + err));
};

window.loadExcelBuffer = function(buf) {
    const data = new Uint8Array(buf);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    jsonData.forEach(row => {
        const lat = parseFloat(row.lat);
        const lng = parseFloat(row.lng);
        if (isNaN(lat) || isNaN(lng)) return;
        const marker = L.marker([lat, lng], { icon: getCategoryIcon(row.category) });
        marker.feature = { properties: row };
        bindTooltipFromProps(marker, row);
        bindClickInfo(marker, row);
        marker.addTo(drawnItems);
    });
    applyAllFilters();
};

window.loadExcelFile = function(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        loadExcelBuffer(e.target.result);
    };
    reader.readAsArrayBuffer(file);
};

// Сохранение и печать
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