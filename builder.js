// js/builder.js — конструктор сайта (только тексты, дизайн, шрифты, цитата, импорт/экспорт)

const builderPanel = document.getElementById('builderPanel');
document.getElementById('builderBtn').addEventListener('click', function() {
    builderPanel.style.display = 'block';
    buildBuilderUI();
});
document.getElementById('closeBuilderBtn').addEventListener('click', () => builderPanel.style.display = 'none');

// Определяем только нужные вкладки
const builderTabsDef = [
    { id: 'texts', label: '📝 Тексты' },
    { id: 'design', label: '🎨 Дизайн' },
    { id: 'fonts', label: '🔤 Шрифты' },
    { id: 'quote', label: '💬 Цитата' },
    { id: 'data', label: '📊 Импорт/Экспорт' }
];

function buildBuilderUI() {
    const tabsDiv = document.getElementById('builderTabs');
    tabsDiv.innerHTML = '';
    builderTabsDef.forEach(tab => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.textContent = tab.label;
        btn.dataset.tab = tab.id;
        btn.addEventListener('click', () => switchBuilderTab(tab.id));
        tabsDiv.appendChild(btn);
    });
    if (!document.querySelector('.tab-btn.active')) switchBuilderTab('texts');
}

function switchBuilderTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    const contentDiv = document.getElementById('builderContent');
    contentDiv.innerHTML = '';

    switch (tabId) {
        case 'texts':
            contentDiv.innerHTML = `
            <fieldset><legend>Основные тексты</legend>
            <label>Название проекта:</label><input type="text" id="buildTitle" value="${document.querySelector('.logo a').textContent.replace(/<[^>]*>/g,'').trim()}">
            <label>О проекте (абзац 1):</label><textarea id="buildAbout1">${document.getElementById('aboutP1').innerHTML}</textarea>
            <label>О проекте (абзац 2):</label><textarea id="buildAbout2">${document.getElementById('aboutP2').innerHTML}</textarea>
            <label>О проекте (абзац 3):</label><textarea id="buildAbout3">${document.getElementById('aboutP3').innerHTML}</textarea>
            <label>О проекте (абзац 4):</label><textarea id="buildAbout4">${document.getElementById('aboutP4').innerHTML}</textarea>
            </fieldset>`;
            break;
        case 'design':
            contentDiv.innerHTML = `
            <fieldset><legend>Цвета</legend>
            <label>Фон шапки:</label><input type="color" id="buildHeaderBg" value="#e6d6c0">
            <label>Цвет кнопок:</label><input type="color" id="buildBtnBg" value="#8b6f4c">
            <label>Фон страницы:</label><input type="color" id="buildPageBg" value="#f5ede3">
            </fieldset>`;
            break;
        case 'fonts':
            contentDiv.innerHTML = `
            <fieldset><legend>Шрифты</legend>
            <label>Шрифт заголовка (Google Font):</label><input type="text" id="buildFontLogo" value="Special Elite">
            <label>Основной шрифт:</label><input type="text" id="buildFontBody" value="PT Serif">
            </fieldset>`;
            break;
        case 'quote':
            contentDiv.innerHTML = `
            <fieldset><legend>Цитата</legend>
            <label>Текст:</label><input type="text" id="buildQuoteText" value="${document.querySelector('#headerQuoteBlock i').innerHTML.replace(/"/g,'&quot;')}">
            <label>Подпись:</label><input type="text" id="buildQuoteAuthor" value="${document.querySelector('#headerQuoteBlock small').textContent}">
            </fieldset>`;
            break;
        case 'data':
            contentDiv.innerHTML = `
            <fieldset><legend>Импорт/Экспорт</legend>
            <label>Google Таблица (CSV):</label><input type="text" id="googleSheetUrl" placeholder="https://..."><button id="loadGoogleSheetBtn" class="btn-green" style="font-size:0.7rem;">Загрузить</button>
            <div style="margin-top:8px;"><label>GeoJSON:</label><input type="file" id="multiGeoJsonInput" multiple accept=".geojson,.json"></div>
            <div style="margin-top:8px;"><button id="exportProjectBtn" class="btn-green" style="font-size:0.7rem;"><i class="fa fa-file-archive"></i> Экспорт ZIP</button></div>
            </fieldset>`;
            break;
    }
    attachBuilderListeners(tabId);
}

function attachBuilderListeners(tabId) {
    if (tabId === 'data') {
        document.getElementById('loadGoogleSheetBtn')?.addEventListener('click', loadGoogleSheet);
        document.getElementById('multiGeoJsonInput')?.addEventListener('change', loadMultipleGeoJson);
        document.getElementById('exportProjectBtn')?.addEventListener('click', exportProjectZip);
    }
}

function loadGoogleSheet() {
    const url = document.getElementById('googleSheetUrl').value.trim();
    if (!url) return;
    if (userDataLayer) map.removeLayer(userDataLayer);
    userDataLayer = omnivore.csv(url).addTo(map);
    try { userDataLayer.on('ready', () => map.fitBounds(userDataLayer.getBounds())); } catch (_) {}
}

function loadMultipleGeoJson(e) {
    const files = e.target.files;
    if (!files.length) return;
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const json = JSON.parse(ev.target.result);
                L.geoJSON(json, {
                    pointToLayer: (f, latlng) => L.marker(latlng, { icon: getCategoryIcon(f.properties?.category) }),
                    onEachFeature: (f, l) => bindPopupFromProps(l, f.properties)
                }).addTo(drawnItems);
                applyAllFilters();
            } catch (ex) { alert('Ошибка в ' + file.name); }
        };
        reader.readAsText(file);
    });
}

function exportProjectZip() {
    const zip = new JSZip();
    zip.file('index.html', document.documentElement.outerHTML);
    zip.file('style.css', state.fullCSS || '/* CSS */');
    const drawings = drawnItems.toGeoJSON();
    if (drawings.features.length) zip.file('data/drawings.geojson', JSON.stringify(drawings, null, 2));
    zip.generateAsync({ type: 'blob' }).then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'siberia_project.zip';
        a.click();
    });
}

window.buildBuilderUI = buildBuilderUI;
window.switchBuilderTab = switchBuilderTab;
window.loadGoogleSheet = loadGoogleSheet;
window.loadMultipleGeoJson = loadMultipleGeoJson;
window.exportProjectZip = exportProjectZip;