// js/map.js — инициализация карты и слоёв (с ползунками прозрачности)

// ---- Определяем L.graticule ДО использования ----
L.Layer.Graticule = L.Layer.extend({
    options: {
        color: '#888',
        weight: 0.5,
        opacity: 0.4,
        labelColor: '#555',
        labelSize: '10px',
        interval: null
    },
    initialize: function(options) {
        L.setOptions(this, options);
        this._group = null;
    },
    onAdd: function(map) {
        this._map = map;
        this._group = L.layerGroup().addTo(map);
        this._draw();
        map.on('moveend zoomend', this._draw, this);
    },
    onRemove: function(map) {
        map.off('moveend zoomend', this._draw, this);
        if (this._group) {
            this._group.remove();
            this._group = null;
        }
    },
    setOpacity: function(opacity) {
        this.options.opacity = opacity;
        this._draw();
    },
    _draw: function() {
        if (!this._group) return;
        this._group.clearLayers();
        var map = this._map;
        var bounds = map.getBounds();
        var zoom = map.getZoom();
        var interval = this.options.interval;
        if (!interval) {
            if (zoom <= 8) interval = 5;
            else if (zoom <= 10) interval = 2;
            else if (zoom <= 12) interval = 1;
            else if (zoom <= 14) interval = 0.5;
            else interval = 0.2;
        }
        var latMin = Math.floor(bounds.getSouth() / interval) * interval;
        var latMax = Math.ceil(bounds.getNorth() / interval) * interval;
        var lngMin = Math.floor(bounds.getWest() / interval) * interval;
        var lngMax = Math.ceil(bounds.getEast() / interval) * interval;
        var lineStyle = {
            color: this.options.color,
            weight: this.options.weight,
            opacity: this.options.opacity,
            interactive: false
        };
        for (var lng = lngMin; lng <= lngMax; lng += interval) {
            if (Math.abs(lng) < 0.001) continue;
            var latLngs = [L.latLng(latMin, lng), L.latLng(latMax, lng)];
            this._group.addLayer(L.polyline(latLngs, lineStyle));
        }
        for (var lat = latMin; lat <= latMax; lat += interval) {
            if (Math.abs(lat) < 0.001) continue;
            var latLngs = [L.latLng(lat, lngMin), L.latLng(lat, lngMax)];
            this._group.addLayer(L.polyline(latLngs, lineStyle));
        }
        // Подписи (широта снизу, долгота слева)
        var south = bounds.getSouth();
        var north = bounds.getNorth();
        var west = bounds.getWest();
        var east = bounds.getEast();
        for (var lat = latMin; lat <= latMax; lat += interval) {
            if (Math.abs(lat) < 0.001) continue;
            if (lat < south - interval/2 || lat > north + interval/2) continue;
            var lngPos = west + (east - west) * 0.1;
            var label = L.marker([lat, lngPos], {
                icon: L.divIcon({
                    className: 'graticule-label',
                    html: lat.toFixed(1) + '°',
                    iconSize: [30, 12],
                    iconAnchor: [4, 6]
                }),
                interactive: false,
                keyboard: false
            });
            this._group.addLayer(label);
        }
        for (var lng = lngMin; lng <= lngMax; lng += interval) {
            if (Math.abs(lng) < 0.001) continue;
            if (lng < west - interval/2 || lng > east + interval/2) continue;
            var latPos = south + (north - south) * 0.1;
            var label = L.marker([latPos, lng], {
                icon: L.divIcon({
                    className: 'graticule-label',
                    html: lng.toFixed(1) + '°',
                    iconSize: [30, 12],
                    iconAnchor: [4, 6]
                }),
                interactive: false,
                keyboard: false
            });
            this._group.addLayer(label);
        }
    }
});

L.graticule = function(options) {
    return new L.Layer.Graticule(options);
};

// ---- Инициализация карты ----
const map = L.map('map', { attributionControl: false }).setView([56.015, 92.893], 11);

// Базовые слои
const baseMaps = {};
state.baseLayers.forEach(l => {
    baseMaps[l.name] = L.tileLayer(l.url, { maxZoom: l.maxZoom, attribution: l.attribution });
});
baseMaps[state.baseLayers[0].name].addTo(map);

// ---- Создание оверлеев ----
const overlayMaps = {};
state.overlayLayers.forEach(l => {
    let layer;
    if (l.type === 'graticule') {
        layer = L.graticule({
            interval: l.interval || null,
            color: l.color || '#888',
            weight: l.weight || 0.5,
            opacity: l.opacity || 0.4
        });
    } else if (l.type === 'geojson') {
        // GeoJSON с цветными границами
        layer = L.geoJSON(null, {
            style: function(feature) {
                return {
                    color: '#3388ff',      // синий контур
                    weight: 2,
                    opacity: l.opacity || 0.7,
                    fillColor: '#3388ff',
                    fillOpacity: 0.1,      // слабая заливка
                    dashArray: null
                };
            },
            attribution: l.attribution || '© OpenStreetMap'
        });
        // Загружаем данные
        fetch(l.url)
            .then(response => {
                if (!response.ok) throw new Error('Не удалось загрузить ' + l.url);
                return response.json();
            })
            .then(data => {
                layer.addData(data);
            })
            .catch(err => console.warn('Ошибка загрузки GeoJSON:', err));
        layer._layerDef = l;
    } else if (l.type === 'tile') {
        layer = L.tileLayer(l.url, {
            maxZoom: l.maxZoom || 19,
            attribution: l.attribution || '',
            opacity: l.opacity || 1.0
        });
        if (l.isHistoric) {
            historicLayer = layer;
        }
    }
    if (layer) {
        overlayMaps[l.name] = layer;
    }
});

// ---- Создаём layerControl ----
layerControl = L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);

// ---- Атрибуция ----
L.control.attribution({ position: 'bottomleft', prefix: false })
    .addAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Esri | Natural Earth')
    .addTo(map);

// ---- Инициализация drawnItems (важно: до использования в других модулях) ----
drawnItems = new L.FeatureGroup().addTo(map);
userDataLayer = null;

// ---- Функция поиска слоя по имени ----
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

// ---- Функция добавления ползунков прозрачности (улучшенная) ----
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

        // Пропускаем координатную сетку (ей не нужен ползунок)
        if (name === 'Координатная сетка') return;

        // Удаляем старые слайдеры
        const oldSlider = label.querySelector('.layer-opacity-slider');
        if (oldSlider) oldSlider.remove();
        const oldVal = label.querySelector('.opacity-value');
        if (oldVal) oldVal.remove();

        // Создаём ползунок
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 1;
        slider.step = 0.05;
        slider.value = layerDef.opacity || 1.0;
        slider.className = 'layer-opacity-slider';
        // Делаем длинным и красивым
        slider.style.cssText = 'width:80px;height:4px;margin-left:8px;vertical-align:middle;accent-color:var(--red-ink);cursor:pointer;';

        // Индикатор значения
        const valSpan = document.createElement('span');
        valSpan.textContent = Math.round((layerDef.opacity || 1.0) * 100) + '%';
        valSpan.style.cssText = 'font-size:0.55rem;color:var(--ink-light);margin-left:4px;font-family:var(--logo-font);';
        valSpan.className = 'opacity-value';

        // Обработчик изменения
        slider.addEventListener('input', function(e) {
            const val = parseFloat(this.value);
            layerDef.opacity = val;
            valSpan.textContent = Math.round(val * 100) + '%';

            const mapLayer = findLayerByName(name);
            if (mapLayer) {
                if (layerDef.type === 'tile' && mapLayer.setOpacity) {
                    mapLayer.setOpacity(val);
                } else if (layerDef.type === 'geojson' && mapLayer.setStyle) {
                    mapLayer.setStyle({
                        color: '#3388ff',
                        weight: 2,
                        opacity: val,
                        fillColor: '#3388ff',
                        fillOpacity: 0.1
                    });
                } else if (layerDef.type === 'graticule' && mapLayer.setOpacity) {
                    mapLayer.setOpacity(val);
                }
            }
        });

        // Вставляем элементы в label
        label.appendChild(slider);
        label.appendChild(valSpan);
    });
}

// ---- Запускаем добавление слайдеров после рендера ----
setTimeout(attachOpacitySliders, 400);

// Обновляем при изменении состояния слоёв
map.on('overlayadd overlayremove', function() {
    setTimeout(attachOpacitySliders, 300);
});

// ---- Функция иконок ----
function getCategoryIcon(cat) {
    const s = state.categoryStyles[cat] || state.categoryStyles.battle;
    return L.ExtraMarkers.icon({
        icon: s.icon,
        markerColor: s.color,
        shape: s.shape,
        prefix: 'fa'
    });
}

// ---- Восстановление рисунков из localStorage ----
try {
    const saved = localStorage.getItem('drawnGeoJSON');
    if (saved) {
        L.geoJSON(JSON.parse(saved), {
            onEachFeature: function(f, l) {
                bindTooltipFromProps(l, f.properties);
                bindClickInfo(l, f.properties);
            }
        }).addTo(drawnItems);
    }
} catch (_) {}

// ---- Экспорт глобальных переменных ----
window.map = map;
window.drawnItems = drawnItems;
window.userDataLayer = userDataLayer;
window.layerControl = layerControl;
window.getCategoryIcon = getCategoryIcon;
window.findLayerByName = findLayerByName;
window.attachOpacitySliders = attachOpacitySliders;