// js/app.js — точка входа, инициализация интерфейса (модалки, легенда, сохранение)

// ==================== НИЖНЯЯ ПАНЕЛЬ ИНФОРМАЦИИ ====================
(function() {
    const infoPanel = document.getElementById('infoPanel');
    const infoPanelTitle = document.getElementById('infoPanelTitle');
    const infoPanelCoords = document.getElementById('infoPanelCoords');
    const infoPanelContent = document.getElementById('infoPanelContent');
    const infoPanelEditBtn = document.getElementById('infoPanelEditBtn');
    let currentInfoLayer = null;

    window.showInfoPanel = function(layer, props) {
        if (!props) return;
        infoPanelTitle.textContent = props.title || 'Без названия';
        const latlng = layer.getLatLng ? layer.getLatLng() : (layer.getBounds ? layer.getBounds().getCenter() : null);
        infoPanelCoords.textContent = latlng ? 'Координаты: ' + latlng.lat.toFixed(5) + ', ' + latlng.lng.toFixed(5) : '';
        infoPanelContent.innerHTML = renderMarkdown(props.description || '');
        if (props.image) infoPanelContent.innerHTML +=
            '<div class="watermarked-image"><img src="' + props.image + '" style="max-width:100%;max-height:200px;object-fit:contain;margin-top:0.5rem;"></div>';
        if (props.video) {
            const m = props.video.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
            if (m) infoPanelContent.innerHTML +=
                '<iframe width="100%" height="200" src="https://www.youtube.com/embed/' + m[1] + '" frameborder="0" allowfullscreen style="margin-top:0.5rem;"></iframe>';
        }
        infoPanelEditBtn.style.display = state.explorerMode && drawnItems.hasLayer(layer) ? 'inline-block' : 'none';
        infoPanel.classList.add('open');
        currentInfoLayer = layer;
    };

    function closeInfoPanel() {
        infoPanel.classList.remove('open');
        currentInfoLayer = null;
    }

    document.getElementById('infoPanelCloseBtn').addEventListener('click', closeInfoPanel);
    infoPanelEditBtn.addEventListener('click', () => {
        if (currentInfoLayer && state.explorerMode) openMarkerEditor(currentInfoLayer);
    });
    document.getElementById('infoPanelCopyBtn').addEventListener('click', () => {
        const url = window.location.href.split('?')[0] + '?year=' + state.currentYear + '&month=' + state.currentMonth + '#' + map.getCenter().lat.toFixed(5) + '/' + map.getCenter().lng.toFixed(5);
        navigator.clipboard.writeText(url).then(() => alert('Ссылка скопирована!'));
    });

    map.on('click', function(e) {
        // Закрываем панель при клике на пустое место карты, но не закрываем, если клик по метке или по панели
        if (!e.originalEvent.target.closest('.leaflet-marker-icon, .leaflet-popup, .info-panel, .leaflet-tooltip')) {
            closeInfoPanel();
        }
    });
})();

// ==================== ЛЕГЕНДА ====================
(function() {
    const railwayLegendData = {
        standard: {
            items: [
                { color: '#000000', label: 'Главные ж/д пути' },
                { color: '#666666', label: 'Второстепенные пути' },
                { color: '#0099ff', label: 'Станции и остановки' },
                { color: '#ff9900', label: 'Электрифицированные линии' },
                { color: '#ff0000', label: 'Высокоскоростные линии' }
            ]
        }
    };
    const vectorSignalLegendInfo = {
        items: [
            { color: '#d73027', label: 'Сигналы (светофоры, семафоры)' },
            { color: '#fc8d59', label: 'Прочие сигнальные устройства' }
        ]
    };

    function updateRailwayLegendUI() {
        const railDiv = document.getElementById('railwayLegend');
        if (!railDiv) return;
        const activeOverlays = layerControl ? Object.keys(layerControl._layers).filter(k =>
            layerControl._layers[k].overlay && map.hasLayer(layerControl._layers[k].layer)
        ).map(k => layerControl._layers[k].name) : [];
        if (activeOverlays.includes('Железные дороги')) {
            railDiv.style.display = 'block';
            const content = railDiv.querySelector('.railway-legend-content');
            content.innerHTML = railwayLegendData.standard.items.map(item =>
                `<div class="legend-row"><span style="display:inline-block;width:20px;height:4px;background:${item.color};margin-right:8px;"></span>${item.label}</div>`
            ).join('');
        } else {
            railDiv.style.display = 'none';
        }
        const vectorDiv = document.getElementById('vectorSignalLegend');
        if (vectorDiv) {
            if (activeOverlays.includes('Сигнализация (вектор)')) {
                vectorDiv.style.display = 'block';
                vectorDiv.querySelector('.vector-signal-legend-content').innerHTML =
                    vectorSignalLegendInfo.items.map(item =>
                        `<div class="legend-row"><span style="display:inline-block;width:20px;height:4px;background:${item.color};margin-right:8px;"></span>${item.label}</div>`
                    ).join('');
            } else {
                vectorDiv.style.display = 'none';
            }
        }
    }

    map.on('overlayadd', updateRailwayLegendUI);
    map.on('overlayremove', updateRailwayLegendUI);

    document.getElementById('legendBtn').addEventListener('click', function() {
        let html = '';
        for (const [cat, style] of Object.entries(state.categoryStyles)) {
            const icon = L.ExtraMarkers.icon({ icon: style.icon, markerColor: style.color, shape: style.shape, prefix: 'fa' });
            const iconHtml = icon.createIcon ? icon.createIcon().outerHTML : '';
            const label = catLabels[cat] || cat;
            html += `<div class="legend-row"><span class="legend-icon">${iconHtml}</span><span>${label}</span></div>`;
        }
        document.getElementById('legendContent').innerHTML = html;
        updateRailwayLegendUI();
        document.getElementById('legendModal').style.display = 'block';
    });
    document.getElementById('closeLegendBtn').addEventListener('click', () => document.getElementById('legendModal').style.display = 'none');
    window.addEventListener('click', e => { if (e.target === document.getElementById('legendModal')) document.getElementById('legendModal').style.display = 'none'; });
})();

// ==================== МОДАЛКИ: СОТРУДНИЧЕСТВО, FAQ, О ПРОЕКТЕ, СОГЛАШЕНИЕ ====================
(function() {
    const coopModal = document.getElementById('cooperationModal');
    document.getElementById('cooperationBtn').addEventListener('click', e => { e.preventDefault();
        coopModal.style.display = 'flex'; });
    document.getElementById('footerCooperationLink').addEventListener('click', e => { e.preventDefault();
        coopModal.style.display = 'flex'; });
    document.getElementById('closeCooperationBtn').addEventListener('click', () => coopModal.style.display = 'none');
    window.addEventListener('click', e => { if (e.target === coopModal) coopModal.style.display = 'none'; });

    // Обновлённый FAQ с новым вопросом
    const faqData = [
        { q: 'Как пользоваться картой?', a: 'Выберите нужный год и месяц, отметьте категории событий. Наведите на метку, чтобы увидеть её название, и кликните по ней, чтобы открыть подробную информацию в нижней панели.' },
        { q: 'Как открыть подробную информацию о метке?', a: 'Просто кликните по метке на карте. Внизу страницы откроется большая панель с полным описанием, фотографиями и видео.' },
        { q: 'Могу ли я добавить свою метку?', a: 'Включите режим «Исследователь» (кнопка в шапке), затем используйте инструменты рисования на карте. Вы сможете сохранить свои метки в GeoJSON-файл.' },
        { q: 'Как открыть список меток?', a: 'Нажмите на кнопку с тремя полосками (бургер) в левом углу карты. Откроется выдвижная панель со всеми метками.' },
        { q: 'Я загрузил свой GeoJSON, но метки не видны. Почему?', a: 'Проверьте, включены ли нужные категории в фильтрах и не скрыты ли объекты выбранным годом/месяцем.' },
        { q: 'Можно ли редактировать данные прямо на сайте?', a: 'Да! Включите режим «Исследователь» и используйте инструменты рисования. После создания метки откроется редактор.' },
        { q: 'Как сохранить все изменения?', a: 'Откройте «Конструктор» (кнопка с кисточкой), настройте параметры и нажмите «Сохранить ВСЁ».' },
        { q: 'Что такое водяные знаки и зачем они?', a: 'Все изображения автоматически снабжаются полупрозрачной надписью «Атлас Сибирской смуты». Это помогает защитить авторские права.' },
        { q: 'Как поделиться картой?', a: 'Скопируйте URL из адресной строки — в нём сохраняются выбранные год, месяц и положение карты. Или нажмите кнопку «Поделиться» в шапке.' },
        { q: 'Какие слои доступны на карте?', a: 'Вы можете включить рельеф, историческую карту, железные дороги, административные границы и векторный слой сигнализации. Управление слоями — через кнопку «Слои» в правом верхнем углу карты.' },
        { q: 'Какие форматы файлов поддерживаются для загрузки?', a: 'Поддерживаются GeoJSON, KML, GPX, CSV, KMZ и XLSX. Просто перетащите файл на карту или вставьте ссылку в панели загрузки.' },
        { q: 'Как работает печать?', a: 'Нажмите «Печать» в панели загрузки данных. Карта будет отображена на всю страницу, все элементы управления скроются, а внизу появится информация о проекте, координатах и лицензии.' }
    ];
    const faqContainer = document.querySelector('.faq-list');
    faqData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'faq-item';
        div.innerHTML = `<button class="faq-question">${item.q}</button><div class="faq-answer"><p>${item.a}</p></div>`;
        div.querySelector('button').addEventListener('click', function() {
            this.classList.toggle('active');
            const ans = this.nextElementSibling;
            ans.style.maxHeight = ans.style.maxHeight ? null : ans.scrollHeight + 'px';
        });
        faqContainer.appendChild(div);
    });
    document.getElementById('faqNavBtn').addEventListener('click', e => { e.preventDefault();
        document.getElementById('faqModal').style.display = 'block'; });
    document.getElementById('footerFaqLink').addEventListener('click', e => { e.preventDefault();
        document.getElementById('faqModal').style.display = 'block'; });
    document.getElementById('closeFaqBtn').addEventListener('click', () => document.getElementById('faqModal').style.display = 'none');
    window.addEventListener('click', e => { if (e.target === document.getElementById('faqModal')) document.getElementById('faqModal').style.display = 'none'; });

    document.getElementById('aboutNavBtn').addEventListener('click', e => { e.preventDefault();
        document.getElementById('aboutModal').style.display = 'block'; });
    document.getElementById('footerAboutLink').addEventListener('click', e => { e.preventDefault();
        document.getElementById('aboutModal').style.display = 'block'; });
    document.getElementById('closeAboutBtn').addEventListener('click', () => document.getElementById('aboutModal').style.display = 'none');
    window.addEventListener('click', e => { if (e.target === document.getElementById('aboutModal')) document.getElementById('aboutModal').style.display = 'none'; });

    document.getElementById('footerTermsLink').addEventListener('click', e => { e.preventDefault();
        document.getElementById('termsModal').style.display = 'block'; });
    document.getElementById('closeTermsBtn').addEventListener('click', () => document.getElementById('termsModal').style.display = 'none');
    window.addEventListener('click', e => { if (e.target === document.getElementById('termsModal')) document.getElementById('termsModal').style.display = 'none'; });
})();

// ==================== КНОПКА "СОХРАНИТЬ ВСЁ" ====================
document.getElementById('saveAllBtn').addEventListener('click', async function() {
    const titleEl = document.getElementById('buildTitle');
    if (titleEl) document.querySelector('.logo a').innerHTML = titleEl.value;
    const a1 = document.getElementById('buildAbout1'); if (a1) document.getElementById('aboutP1').innerHTML = a1.value;
    const a2 = document.getElementById('buildAbout2'); if (a2) document.getElementById('aboutP2').innerHTML = a2.value;
    const a3 = document.getElementById('buildAbout3'); if (a3) document.getElementById('aboutP3').innerHTML = a3.value;
    const a4 = document.getElementById('buildAbout4'); if (a4) document.getElementById('aboutP4').innerHTML = a4.value;
    const qt = document.getElementById('buildQuoteText'); if (qt) document.querySelector('#headerQuoteBlock i').innerHTML = qt.value;
    const qa = document.getElementById('buildQuoteAuthor'); if (qa) document.querySelector('#headerQuoteBlock small').textContent = qa.value;
    const hbg = document.getElementById('buildHeaderBg'); if (hbg) document.documentElement.style.setProperty('--header-bg', hbg.value);
    const bbg = document.getElementById('buildBtnBg'); if (bbg) document.documentElement.style.setProperty('--btn-bg', bbg.value);
    const pbg = document.getElementById('buildPageBg'); if (pbg) document.documentElement.style.setProperty('--page-bg', pbg.value);
    const lf = document.getElementById('buildFontLogo'); if (lf) document.documentElement.style.setProperty('--logo-font', `'${lf.value}', monospace`);
    const bf = document.getElementById('buildFontBody'); if (bf) document.documentElement.style.setProperty('--body-font', `'${bf.value}', serif`);

    const htmlContent = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({ suggestedName: 'index.html', types: [{ description: 'HTML', accept: { 'text/html': ['.html'] } }] });
            const writable = await handle.createWritable();
            await writable.write(htmlContent);
            await writable.close();
        } catch (_) {}
    } else {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'index.html';
        a.click();
    }
    if (state.fullCSS) {
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({ suggestedName: 'style.css', types: [{ description: 'CSS', accept: { 'text/css': ['.css'] } }] });
                const writable = await handle.createWritable();
                await writable.write(state.fullCSS);
                await writable.close();
            } catch (_) {}
        } else {
            const blob = new Blob([state.fullCSS], { type: 'text/css' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'style.css';
            a.click();
        }
    }
    alert('Файлы сохранены. Обновите страницу.');
});

// ==================== ПОЛУЧЕНИЕ CSS ДЛЯ ЭКСПОРТА ====================
fetch('css/style.css').then(r => r.text()).then(css => { state.fullCSS = css; }).catch(() => {});

// ==================== ФИНАЛЬНЫЙ ЗАПУСК ====================
L.hash(map);
buildTimePills();
applyAllFilters();
(function() {
    const p = new URLSearchParams(window.location.search);
    if (p.has('year')) state.currentYear = parseInt(p.get('year'));
    if (p.has('month')) state.currentMonth = parseInt(p.get('month'));
    buildTimePills();
    applyAllFilters();
})();

// ==================== КНОПКА "ПОДЕЛИТЬСЯ" ====================
document.getElementById('shareBtn').addEventListener('click', function() {
    document.getElementById('shareModal').style.display = 'flex';
});
document.getElementById('closeShareBtn').addEventListener('click', function() {
    document.getElementById('shareModal').style.display = 'none';
});
const currentUrl = encodeURIComponent(window.location.href);
const shareTitle = encodeURIComponent(document.title);
document.getElementById('shareVK').href = `https://vk.com/share.php?url=${currentUrl}&title=${shareTitle}`;
document.getElementById('shareTG').href = `https://t.me/share/url?url=${currentUrl}&text=${shareTitle}`;
document.getElementById('shareCopy').addEventListener('click', function(e) {
    e.preventDefault();
    navigator.clipboard.writeText(window.location.href).then(() => alert('Ссылка скопирована!'));
});

// ==================== ДИНАМИЧЕСКИЙ ГОД В ФУТЕРЕ ====================
document.getElementById('currentYear').textContent = new Date().getFullYear();

// ==================== ИСПРАВЛЕНИЕ ПЕЧАТИ ====================
window.addEventListener('beforeprint', function() {
    const center = map.getCenter();
    document.getElementById('printCenter').textContent = center.lat.toFixed(4) + ', ' + center.lng.toFixed(4);
    document.getElementById('printZoom').textContent = map.getZoom();
    document.getElementById('printDate').textContent = new Date().toLocaleDateString('ru-RU');
    document.getElementById('printYear').textContent = new Date().getFullYear();

    let layersList = [];
    if (layerControl) {
        const layers = layerControl._layers;
        for (const key in layers) {
            const l = layers[key];
            if (l.overlay && map.hasLayer(l.layer)) {
                layersList.push(l.name);
            }
        }
        if (map.hasLayer(osmLayer)) layersList.push('OpenStreetMap');
        if (map.hasLayer(esriSat)) layersList.push('Esri Satellite');
    }
    document.getElementById('printLayers').textContent = 'Слои: ' + (layersList.length ? layersList.join(', ') : 'Стандартная карта');

    setTimeout(function() {
        map.invalidateSize();
    }, 100);
});
window.addEventListener('afterprint', function() {
    setTimeout(function() {
        map.invalidateSize();
    }, 100);
});

// ==================== АВТОЗАГРУЗКА ОСНОВНЫХ МЕТОК ====================
fetch('data/main.geojson')
    .then(response => {
        if (!response.ok) throw new Error('Файл не найден');
        return response.json();
    })
    .then(data => {
        L.geoJSON(data, {
            pointToLayer: (f, latlng) => L.marker(latlng, { icon: getCategoryIcon(f.properties?.category) }),
            onEachFeature: (f, l) => {
                bindTooltipFromProps(l, f.properties);
                bindClickInfo(l, f.properties);
            }
        }).addTo(drawnItems);
    })
    .catch(err => console.log('Основные метки не загружены:', err));