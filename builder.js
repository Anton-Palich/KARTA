// js/builder.js — конструктор сайта

const builderPanel = document.getElementById('builderPanel');
document.getElementById('builderBtn').addEventListener('click', function() {
    builderPanel.style.display = 'block';
    buildBuilderUI();
});
document.getElementById('closeBuilderBtn').addEventListener('click', () => builderPanel.style.display = 'none');

const builderTabsDef = [
    { id: 'texts', label: '📝 Тексты' },
    { id: 'design', label: '🎨 Дизайн' },
    { id: 'categories', label: '📂 Категории' },
    { id: 'layers', label: '🗺️ Слои' },
    { id: 'markers', label: '📍 Стили маркеров' },
    { id: 'fonts', label: '🔤 Шрифты' },
    { id: 'quote', label: '💬 Цитата' },
    { id: 'materialsEdit', label: '🖼️ Материалы' },
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
        case 'categories':
            contentDiv.innerHTML = `<fieldset><legend>Категории</legend>
            ${Object.entries(state.categoryStyles).map(([key,val])=>`
                <div style="display:flex;gap:8px;margin-bottom:4px;flex-wrap:wrap;align-items:center;">
                    <span style="width:130px;font-size:0.7rem;font-weight:bold;">${catLabels[key]}</span>
                    <input type="color" value="${val.color}" class="cat-color" data-key="${key}" style="width:50px;">
                    <input value="${val.icon}" class="cat-icon" data-key="${key}" style="width:60px;font-size:0.7rem;">
                    <select class="cat-shape" data-key="${key}" style="width:80px;font-size:0.7rem;">
                        <option value="circle" ${val.shape==='circle'?'selected':''}>Круг</option>
                        <option value="square" ${val.shape==='square'?'selected':''}>Квадрат</option>
                        <option value="star" ${val.shape==='star'?'selected':''}>Звезда</option>
                    </select>
                </div>`).join('')}
            </fieldset>`;
            break;
        case 'layers':
            contentDiv.innerHTML = `<fieldset><legend>Слои</legend>
            ${state.overlayLayers.map((l,i)=>`
                <div style="display:flex;gap:6px;margin-bottom:4px;flex-wrap:wrap;align-items:center;">
                    <input value="${l.name}" data-layer-index="${i}" class="layer-name" style="width:120px;font-size:0.7rem;">
                    <input value="${l.url}" data-layer-index="${i}" class="layer-url" style="width:200px;font-size:0.7rem;">
                    <label style="font-size:0.6rem;">Тип:</label>
                    <select class="layer-type" data-layer-index="${i}" style="width:80px;font-size:0.7rem;">
                        <option value="tile" ${l.type==='tile'?'selected':''}>Растр</option>
                        <option value="vector" ${l.type==='vector'?'selected':''}>Вектор</option>
                    </select>
                    <label style="font-size:0.6rem;">Прозр.:</label>
                    <input type="range" min="0" max="1" step="0.05" value="${l.opacity}" class="layer-opacity" data-layer-index="${i}" style="width:80px;">
                    <button class="btn-red remove-layer-btn" data-layer-index="${i}" style="font-size:0.6rem;padding:0.1rem 0.4rem;">✕</button>
                </div>`).join('')}
            <button id="addLayerBtn" class="btn-green" style="font-size:0.7rem;">+ Добавить</button>
            </fieldset>`;
            break;
        case 'markers':
            contentDiv.innerHTML = `<fieldset><legend>Стили маркеров</legend>
            ${Object.entries(state.categoryStyles).map(([key,val])=>`
                <div style="display:flex;gap:8px;margin-bottom:4px;flex-wrap:wrap;align-items:center;">
                    <span style="width:130px;font-size:0.7rem;font-weight:bold;">${catLabels[key]}</span>
                    <input type="color" value="${val.color}" class="marker-color" data-key="${key}" style="width:50px;">
                    <input value="${val.icon}" class="marker-icon" data-key="${key}" style="width:60px;font-size:0.7rem;">
                    <select class="marker-shape" data-key="${key}" style="width:80px;font-size:0.7rem;">
                        <option value="circle" ${val.shape==='circle'?'selected':''}>Круг</option>
                        <option value="square" ${val.shape==='square'?'selected':''}>Квадрат</option>
                        <option value="star" ${val.shape==='star'?'selected':''}>Звезда</option>
                    </select>
                </div>`).join('')}
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
        case 'materialsEdit':
            contentDiv.innerHTML = `
            <fieldset><legend>Редактор материалов</legend>
            <select id="editMaterialsTab" style="width:auto;"><option value="photos">Фото</option><option value="videos">Видео</option><option value="archives">Архивы</option></select>
            <div id="materialsEditList"></div>
            <button id="addMaterialBtn" class="btn-green" style="font-size:0.7rem;">+ Добавить элемент</button>
            </fieldset>`;
            setTimeout(() => {
                document.getElementById('editMaterialsTab').addEventListener('change', renderMaterialsEditor);
                renderMaterialsEditor();
            }, 0);
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
    if (tabId === 'categories') {
        document.querySelectorAll('.cat-color, .cat-icon, .cat-shape').forEach(el => el.addEventListener('input', updateCategoryStyles));
    }
    if (tabId === 'layers') {
        document.querySelectorAll('.layer-name, .layer-url, .layer-opacity, .layer-type').forEach(el => el.addEventListener('input', updateLayers));
        document.querySelectorAll('.remove-layer-btn').forEach(btn => btn.addEventListener('click', function(e) {
            const idx = parseInt(this.dataset.layerIndex);
            state.overlayLayers.splice(idx, 1);
            switchBuilderTab('layers');
            buildOverlayMaps();
        }));
        document.getElementById('addLayerBtn')?.addEventListener('click', function() {
            state.overlayLayers.push({ name: 'Новый слой', url: '', opacity: 0.5, maxZoom: 18, attribution: '', isHistoric: false, type: 'tile' });
            switchBuilderTab('layers');
        });
    }
    if (tabId === 'markers') {
        document.querySelectorAll('.marker-color, .marker-icon, .marker-shape').forEach(el => el.addEventListener('input', updateMarkerStyles));
    }
    if (tabId === 'materialsEdit') {
        document.getElementById('addMaterialBtn')?.addEventListener('click', addMaterial);
    }
    if (tabId === 'data') {
        document.getElementById('loadGoogleSheetBtn')?.addEventListener('click', loadGoogleSheet);
        document.getElementById('multiGeoJsonInput')?.addEventListener('change', loadMultipleGeoJson);
        document.getElementById('exportProjectBtn')?.addEventListener('click', exportProjectZip);
    }
}

function updateCategoryStyles() {
    document.querySelectorAll('.cat-color').forEach(inp => { state.categoryStyles[inp.dataset.key].color = inp.value; });
    document.querySelectorAll('.cat-icon').forEach(inp => { state.categoryStyles[inp.dataset.key].icon = inp.value; });
    document.querySelectorAll('.cat-shape').forEach(sel => { state.categoryStyles[sel.dataset.key].shape = sel.value; });
}

function updateLayers() {
    document.querySelectorAll('.layer-name').forEach((inp, i) => { if (state.overlayLayers[i]) state.overlayLayers[i].name = inp.value; });
    document.querySelectorAll('.layer-url').forEach((inp, i) => { if (state.overlayLayers[i]) state.overlayLayers[i].url = inp.value; });
    document.querySelectorAll('.layer-opacity').forEach((inp, i) => { if (state.overlayLayers[i]) state.overlayLayers[i].opacity = parseFloat(inp.value); });
    document.querySelectorAll('.layer-type').forEach((sel, i) => { if (state.overlayLayers[i]) state.overlayLayers[i].type = sel.value; });
    buildOverlayMaps();
}

function updateMarkerStyles() {
    document.querySelectorAll('.marker-color').forEach(inp => { state.categoryStyles[inp.dataset.key].color = inp.value; });
    document.querySelectorAll('.marker-icon').forEach(inp => { state.categoryStyles[inp.dataset.key].icon = inp.value; });
    document.querySelectorAll('.marker-shape').forEach(sel => { state.categoryStyles[sel.dataset.key].shape = sel.value; });
}

function renderMaterialsEditor() {
    const tab = document.getElementById('editMaterialsTab')?.value || 'photos';
    const listDiv = document.getElementById('materialsEditList');
    const data = state.materialsData[tab];
    listDiv.innerHTML = data.map((item, i) => `
        <div style="display:flex;gap:4px;margin-bottom:4px;flex-wrap:wrap;align-items:center;">
            <input value="${item.title}" data-idx="${i}" class="mat-title" placeholder="Название" style="width:120px;font-size:0.7rem;">
            <input type="number" value="${item.year}" min="1918" max="1922" data-idx="${i}" class="mat-year" style="width:60px;font-size:0.7rem;">
            <input type="number" value="${item.month}" min="1" max="12" data-idx="${i}" class="mat-month" style="width:50px;font-size:0.7rem;">
            <input value="${item.src}" data-idx="${i}" class="mat-src" placeholder="Ссылка" style="width:150px;font-size:0.7rem;">
            <input value="${item.desc}" data-idx="${i}" class="mat-desc" placeholder="Описание" style="width:120px;font-size:0.7rem;">
            <button class="btn-red remove-mat-btn" data-idx="${i}" style="font-size:0.6rem;padding:0.1rem 0.4rem;">✕</button>
        </div>`
    ).join('');
    document.querySelectorAll('.mat-title,.mat-year,.mat-month,.mat-src,.mat-desc').forEach(el => el.addEventListener('input', function() {
        const idx = parseInt(this.dataset.idx);
        const prop = this.className.replace('mat-', '');
        state.materialsData[tab][idx][prop] = (prop === 'year' || prop === 'month') ? parseInt(this.value) : this.value;
    }));
    document.querySelectorAll('.remove-mat-btn').forEach(btn => btn.addEventListener('click', function() {
        const idx = parseInt(this.dataset.idx);
        state.materialsData[tab].splice(idx, 1);
        renderMaterialsEditor();
    }));
}

function addMaterial() {
    const tab = document.getElementById('editMaterialsTab')?.value || 'photos';
    state.materialsData[tab].push({ title: 'Новый', year: 1918, month: 1, src: '', desc: '' });
    renderMaterialsEditor();
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

// Экспортируем функции, используемые в других модулях
window.buildBuilderUI = buildBuilderUI;
window.switchBuilderTab = switchBuilderTab;
window.renderMaterialsEditor = renderMaterialsEditor;
window.addMaterial = addMaterial;