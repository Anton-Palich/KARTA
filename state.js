// js/state.js — глобальное состояние проекта

const state = {
    explorerMode: false,
    currentYear: 0,
    currentMonth: 0,
    materialsYear: 0,
    materialsMonth: 0,
    currentMaterialsTab: 'photos',
    materialsSearchTerm: '',

    // Базовые подложки
    baseLayers: [
        { name: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', maxZoom: 19, attribution: '© OpenStreetMap' },
        { name: 'Спутник Esri', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maxZoom: 19, attribution: '© Esri' }
    ],

    // Все дополнительные слои (оверлеи) – инструменты, исторические, границы
    overlayLayers: [
        { id: 'graticule', name: 'Координатная сетка', type: 'graticule', opacity: 0.5 },
        { id: 'railways', name: 'Железные дороги', url: 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', opacity: 0.8, maxZoom: 19, attribution: '© OpenRailwayMap', type: 'tile' },
        { id: 'boundaries', name: 'Административные границы', type: 'geojson', url: 'data/russia_regions.geojson', opacity: 0.7 },
        { id: 'krasnoyarsk_1919', name: '1919 Карта окрестностей Красноярска 1:42K', type: 'tile', url: 'https://mapwarper.net/maps/tile/109101/{z}/{x}/{y}.png', maxZoom: 18, attribution: 'Mapwarper', opacity: 0.8, isHistoric: true }
    ],

    // Категории меток
    categoryStyles: {
        battle: { color: '#b22222', icon: 'fa-burst', shape: 'circle' },
        route: { color: '#1a5a8b', icon: 'fa-route', shape: 'square' },
        memorial: { color: '#2d7a3a', icon: 'fa-monument', shape: 'star' },
        person: { color: '#7a3a8b', icon: 'fa-user', shape: 'circle' }
    },

    // Материалы
    materialsData: {
        photos: [],
        videos: [],
        archives: []
    },
    materialsFromMap: [],

    fullCSS: ''
};

// Глобальные переменные
let drawnItems = null;
let layerControl = null;
let userDataLayer = null;
let historicLayer = null;