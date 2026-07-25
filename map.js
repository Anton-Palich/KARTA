// js/map.js — инициализация карты и слоёв

// Глобальные объекты карты
const map = L.map('map', { attributionControl: false }).setView([56.015, 92.893], 11);
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
const esriSat = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }
);

L.control.attribution({ position: 'bottomleft', prefix: false })
    .addAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Esri | Natural Earth')
    .addTo(map);

const drawnItems = new L.FeatureGroup().addTo(map);
let userDataLayer = null;
let layerControl = null;
let vectorSignalLayer = null;

// Функция для получения иконки по категории (использует state)
function getCategoryIcon(cat) {
    const s = state.categoryStyles[cat] || state.categoryStyles.battle;
    return L.ExtraMarkers.icon({
        icon: s.icon,
        markerColor: s.color,
        shape: s.shape,
        prefix: 'fa'
    });
}

// Построение переключателя слоёв
function buildOverlayMaps() {
    const overlayMaps = {};
    if (vectorSignalLayer) {
        map.removeLayer(vectorSignalLayer);
        vectorSignalLayer = null;
    }

    state.overlayLayers.forEach(l => {
        if (l.type === 'vector') {
            if (typeof L.vectorGrid !== 'undefined') {
                const vectorGrid = L.vectorGrid.protobuf(l.url, {
                    vectorTileLayerStyles: {
                        signals: function(properties, zoom) {
                            return {
                                color: '#d73027',
                                weight: 2,
                                opacity: 0.9,
                                fillColor: '#fc8d59',
                                fillOpacity: 0.5,
                                radius: 4
                            };
                        }
                    },
                    interactive: true,
                    getFeatureId: function(f) { return f.properties.id; },
                    maxZoom: l.maxZoom,
                    attribution: l.attribution
                });
                vectorGrid.setOpacity(l.opacity);
                overlayMaps[l.name] = vectorGrid;
                if (l.name === 'Сигнализация (вектор)') {
                    vectorSignalLayer = vectorGrid;
                }
            } else {
                console.warn('Плагин L.vectorGrid не загружен, пропускаем слой', l.name);
            }
        } else if (l.type === 'geojson') {
            const geojsonLayer = L.geoJSON(null, {
                style: function(feature) {
                    const baseColor = l.name.includes('границы') ? '#3388ff' : '#b22222';
                    return {
                        color: baseColor,
                        weight: 1.5,
                        opacity: l.opacity,
                        fillColor: baseColor,
                        fillOpacity: l.opacity * 0.3
                    };
                },
                interactive: false
            });
            geojsonLayer._layerDef = l;
            overlayMaps[l.name] = geojsonLayer;

            fetch(l.url)
                .then(response => {
                    if (!response.ok) throw new Error('Файл не найден');
                    return response.json();
                })
                .then(data => {
                    geojsonLayer.addData(data);
                })
                .catch(err => console.warn('Не удалось загрузить ' + l.name + ':', err));
        } else {
            const tile = L.tileLayer(l.url, {
                attribution: l.attribution,
                opacity: l.opacity,
                maxZoom: l.maxZoom,
                subdomains: l.subdomains || 'abc'
            });
            overlayMaps[l.name] = tile;
            if (l.isHistoric) state.historicLayer = tile;
        }
    });

    if (layerControl) map.removeControl(layerControl);
    layerControl = L.control.layers({
        'OpenStreetMap': osmLayer,
        'Спутник Esri': esriSat
    }, overlayMaps, { collapsed: false }).addTo(map);

    window.layersControlElement = document.querySelector('.leaflet-control-layers');

    setTimeout(() => attachOpacitySliders(), 100);
}

function attachOpacitySliders() {
    const container = document.querySelector('.leaflet-control-layers-overlays');
    if (!container) return;
    const labels = container.querySelectorAll('label');
    const overlayNames = state.overlayLayers.map(l => l.name);

    labels.forEach((label, idx) => {
        if (idx >= overlayNames.length) return;
        const name = overlayNames[idx];
        const layerDef = state.overlayLayers.find(l => l.name === name);
        if (!layerDef) return;

        const oldSlider = label.querySelector('.layer-opacity-slider');
        if (oldSlider) oldSlider.remove();
        const oldVal = label.querySelector('.opacity-value');
        if (oldVal) oldVal.remove();

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 1;
        slider.step = 0.05;
        slider.value = layerDef.opacity;
        slider.className = 'layer-opacity-slider';
        slider.style.cssText = 'width:60px;height:4px;margin-left:6px;vertical-align:middle;accent-color:var(--red-ink);';

        const valSpan = document.createElement('span');
        valSpan.textContent = Math.round(layerDef.opacity * 100) + '%';
        valSpan.style.cssText = 'font-size:0.5rem;color:var(--ink-light);margin-left:3px;font-family:var(--logo-font);';
        valSpan.className = 'opacity-value';

        slider.addEventListener('input', function(e) {
            const val = parseFloat(this.value);
            layerDef.opacity = val;
            valSpan.textContent = Math.round(val * 100) + '%';

            const mapLayer = findLayerByName(name);
            if (mapLayer) {
                if (layerDef.type === 'tile' && mapLayer.setOpacity) {
                    mapLayer.setOpacity(val);
                } else if (layerDef.type === 'geojson' && mapLayer.setStyle) {
                    mapLayer.setStyle(function(feature) {
                        const baseColor = name.includes('границы') ? '#3388ff' : '#b22222';
                        return {
                            color: baseColor,
                            weight: 1.5,
                            opacity: val,
                            fillColor: baseColor,
                            fillOpacity: val * 0.3
                        };
                    });
                } else if (layerDef.type === 'vector' && mapLayer.setOpacity) {
                    mapLayer.setOpacity(val);
                }
            }
        });

        label.appendChild(slider);
        label.appendChild(valSpan);
    });
}

function findLayerByName(name) {
    if (!layerControl) return null;
    const layers = layerControl._layers;
    for (const key in layers) {
        if (layers[key].name === name) {
            return layers[key].layer;
        }
    }
    return null;
}

// Восстановление рисунков из localStorage
try {
    const saved = localStorage.getItem('drawnGeoJSON');
    if (saved) {
        L.geoJSON(JSON.parse(saved), { 
            onEachFeature: function(f, l) {
                // Привязываем тултип с названием и обработчик клика
                bindTooltipFromProps(l, f.properties);
                bindClickInfo(l, f.properties);
            }
        }).addTo(drawnItems);
    }
} catch (_) {}

// Первоначальная сборка слоёв
buildOverlayMaps();

// Экспортируем глобальные функции и переменные
window.map = map;
window.drawnItems = drawnItems;
window.userDataLayer = userDataLayer;
window.layerControl = layerControl;
window.buildOverlayMaps = buildOverlayMaps;
window.getCategoryIcon = getCategoryIcon;