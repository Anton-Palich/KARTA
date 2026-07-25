// js/state.js — глобальное состояние проекта

const state = {
    explorerMode: false,
    currentYear: 0,
    currentMonth: 0,
    materialsYear: 0,
    materialsMonth: 0,
    currentMaterialsTab: 'photos',
    materialsSearchTerm: '',
    overlayLayers: [
        { name: 'Рельеф', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
            opacity: 0.5, maxZoom: 13, attribution: 'Esri', isHistoric: false, type: 'tile' },
        { name: 'Историческая карта', url: 'https://mapwarper.net/maps/tile/109101/{z}/{x}/{y}.png',
            opacity: 0.7, maxZoom: 18, attribution: 'Историческая карта (MapWarper)',
            isHistoric: true, type: 'tile' },
        { name: 'Железные дороги', url: 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
            opacity: 0.8, maxZoom: 19, attribution: '© OpenRailwayMap', isHistoric: false, type: 'tile' },
        // === НОВЫЕ СЛОИ ===
        { name: 'Координатная сетка',
            url: 'data/graticule_1deg.geojson',  // локальный GeoJSON
            opacity: 0.6,
            attribution: 'Natural Earth',
            isHistoric: false,
            type: 'geojson'
        },
        { name: 'Административные границы',
            url: 'data/russia_regions.geojson',   // локальный GeoJSON
            opacity: 0.8,
            attribution: 'Natural Earth',
            isHistoric: false,
            type: 'geojson'
        },
        // === КОНЕЦ НОВЫХ ===
        { name: 'Сигнализация (вектор)', url: 'https://tiles.openrailwaymap.org/signals/{z}/{x}/{y}.pbf',
            opacity: 1.0, maxZoom: 19, attribution: '© OpenRailwayMap signals', isHistoric: false, type: 'vector' }
    ],
    categoryStyles: {
        battle: { color: '#b22222', icon: 'fa-burst', shape: 'circle' },
        route: { color: '#1a5a8b', icon: 'fa-route', shape: 'square' },
        memorial: { color: '#2d7a3a', icon: 'fa-monument', shape: 'star' },
        person: { color: '#7a3a8b', icon: 'fa-user', shape: 'circle' }
    },
    materialsData: {
        photos: [
            { title: 'Парад войск Колчака', year: 1919, month: 5,
                src: 'https://via.placeholder.com/300x200?text=Парад', desc: 'Торжественный марш в Омске.' },
            { title: 'Партизаны в тайге', year: 1920, month: 1,
                src: 'https://via.placeholder.com/300x200?text=Партизаны',
                desc: 'Группа партизан в Енисейской губернии.' },
            { title: 'Бронепоезд "Сибиряк"', year: 1918, month: 11,
                src: 'https://via.placeholder.com/300x200?text=Бронепоезд', desc: 'Бронепоезд на станции.' }
        ],
        videos: [
            { title: 'Хроника боёв', year: 1919, month: 6,
                src: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Кинохроника.' }
        ],
        archives: [
            { title: 'Приказ №15', year: 1919, month: 2,
                src: 'https://via.placeholder.com/300x200?text=Приказ', desc: 'Приказ командующего.' }
        ]
    },
    historicLayer: null,
    fullCSS: '',
    sideBySideActive: false,
    sideBySideControl: null
};