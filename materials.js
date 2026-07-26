// js/materials.js — загрузка из Google, рендеринг карточек, полноэкранный просмотр, PDF, вкладка "Карты"

const materialsModal = document.getElementById('materialsModal');
document.getElementById('materialsNavBtn').addEventListener('click', e => { e.preventDefault(); openMaterials(); });
document.getElementById('closeMaterialsBtn').addEventListener('click', () => materialsModal.style.display = 'none');
window.addEventListener('click', e => { if (e.target === materialsModal) materialsModal.style.display = 'none'; });

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRYdN6TmceMzlZiq4MvxSXDrO-nZPrG5kOfsYVynobj4nMCe0XdXYyAT4M1MDVzKwLFrtg9lR0PdTNz/pub?output=csv'; // Замените на реальный ID

let isLoadingMaterials = false;

async function loadMaterialsFromGoogle(showToastOnError = true) {
    if (isLoadingMaterials) return;
    isLoadingMaterials = true;
    showLoading('Загрузка материалов...');

    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        if (!response.ok) throw new Error('Не удалось загрузить таблицу');
        const csvText = await response.text();
        const rows = csvText.split('\n').map(line => line.split(',').map(cell => cell.trim()));
        const headers = rows[0];
        const data = rows.slice(1).filter(row => row.some(cell => cell !== '')).map(row => {
            const obj = {};
            headers.forEach((h, i) => obj[h] = row[i] || '');
            return obj;
        });
        state.materialsData.photos = data.filter(item => item.Тип?.toLowerCase() === 'фото');
        state.materialsData.videos = data.filter(item => item.Тип?.toLowerCase() === 'видео');
        state.materialsData.archives = data.filter(item => item.Тип?.toLowerCase() === 'архив');
        hideLoading();
        showToast('Материалы загружены', 'success');
        if (materialsModal.style.display === 'block') {
            buildMaterialsUI();
        }
    } catch (err) {
        hideLoading();
        console.error('Ошибка загрузки материалов из Google:', err);
        if (showToastOnError) {
            showToast('Ошибка загрузки материалов: ' + err.message, 'error');
        }
    } finally {
        isLoadingMaterials = false;
    }
}

function openMaterials() {
    materialsModal.style.display = 'block';
    // Если данные ещё не загружены или пустые, пробуем загрузить
    if (state.materialsData.photos.length === 0 && state.materialsData.videos.length === 0 && state.materialsData.archives.length === 0) {
        loadMaterialsFromGoogle(true);
    }
    buildMaterialsUI();
}

function buildMaterialsUI() {
    const tabsDiv = document.querySelector('.materials-tabs');
    if (!tabsDiv) return;
    tabsDiv.innerHTML = '';
    const tabs = ['photos', 'videos', 'archives', 'maps'];
    tabs.forEach(tab => {
        const btn = document.createElement('button');
        btn.className = 'materials-tab' + (state.currentMaterialsTab === tab ? ' active' : '');
        btn.dataset.tab = tab;
        const labels = { photos: '🖼️ Фото', videos: '🎬 Видео', archives: '📄 Архивы', maps: '🗺️ Старые карты' };
        btn.textContent = labels[tab];
        btn.addEventListener('click', function() {
            document.querySelectorAll('.materials-tab').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.currentMaterialsTab = tab;
            buildMaterialsUI();
        });
        tabsDiv.appendChild(btn);
    });

    const filtDiv = document.querySelector('.materials-filters');
    if (filtDiv) {
        filtDiv.innerHTML = '';
        if (state.currentMaterialsTab !== 'maps') {
            const yearSel = document.createElement('select');
            yearSel.innerHTML = '<option value="0">Все годы</option>' + [1918, 1919, 1920, 1921, 1922].map(y =>
                `<option value="${y}" ${state.materialsYear===y?'selected':''}>${y}</option>`).join('');
            yearSel.addEventListener('change', function() { state.materialsYear = parseInt(this.value); state.materialsMonth = 0; buildMaterialsUI(); });
            filtDiv.appendChild(yearSel);
            const monthSel2 = document.createElement('select');
            monthSel2.innerHTML = '<option value="0">Весь год</option>' + Array.from({ length: 12 }, (_, i) =>
                `<option value="${i+1}" ${state.materialsMonth===i+1?'selected':''}>${monthName(i+1)}</option>`
            ).join('');
            monthSel2.addEventListener('change', function() { state.materialsMonth = parseInt(this.value); buildMaterialsUI(); });
            filtDiv.appendChild(monthSel2);
        }
    }

    const contentDiv = document.querySelector('.materials-content');
    if (!contentDiv) return;
    contentDiv.innerHTML = '';

    let data = [];
    if (state.currentMaterialsTab === 'maps') {
        data = state.historicLayers || [];
    } else {
        // Объединяем данные из Google и с карты
        var mainData = state.materialsData[state.currentMaterialsTab] || [];
        var fromMap = state.materialsFromMap.filter(item => {
            if (state.currentMaterialsTab === 'photos' && item.Тип === 'фото') return true;
            if (state.currentMaterialsTab === 'videos' && item.Тип === 'видео') return true;
            return false;
        });
        data = mainData.concat(fromMap);
    }

    const searchInput = document.getElementById('materialsSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const filtered = data.filter(item => {
        if (state.currentMaterialsTab === 'maps') {
            return (item.name || '').toLowerCase().includes(searchTerm) || (item.year || '').toString().includes(searchTerm);
        } else {
            if (state.materialsYear && parseInt(item.Год) !== state.materialsYear) return false;
            if (state.materialsYear && state.materialsMonth && parseInt(item.Месяц) !== state.materialsMonth) return false;
            if (searchTerm && !(item.Название || '').toLowerCase().includes(searchTerm) && !(item.Описание || '').toLowerCase().includes(searchTerm)) return false;
            return true;
        }
    });

    const grid = document.createElement('div');
    grid.className = 'materials-grid';
    if (!filtered.length) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--ink-light);">Ничего не найдено</p>';
    } else {
        filtered.forEach(item => {
            const template = document.getElementById('materialCardTemplate');
            if (!template) return;
            const clone = document.importNode(template.content, true);
            const thumb = clone.querySelector('.material-thumb');

            if (state.currentMaterialsTab === 'maps') {
                thumb.innerHTML = `<div style="background:#e8d9c8; display:flex; align-items:center; justify-content:center; height:100%; font-size:2rem; color:var(--ink-light);">🗺️</div>`;
                clone.querySelector('.material-info h4').textContent = item.name || 'Без названия';
                clone.querySelector('.material-info p').textContent = `Год: ${item.year || ''}`;
                const card = clone.querySelector('.material-card');
                card.addEventListener('click', () => activateHistoricMap(item));
                grid.appendChild(clone);
            } else {
                if (state.currentMaterialsTab === 'videos') {
                    thumb.innerHTML = `<iframe src="${item.Ссылка}" frameborder="0" allowfullscreen></iframe>`;
                } else {
                    thumb.innerHTML = `<div class="watermarked-image"><img src="${item.Ссылка}" alt="${item.Название}" loading="lazy" onerror="this.style.display='none'"></div>`;
                }
                clone.querySelector('.material-info h4').textContent = item.Название || 'Без названия';
                clone.querySelector('.material-info p').textContent = item.Описание || '';
                clone.querySelector('.material-date').textContent = (item.Год || '') + (item.Месяц ? ' · ' + monthName(parseInt(item.Месяц)) : '');
                const card = clone.querySelector('.material-card');
                card.addEventListener('click', () => openFullscreenMaterial(item));
                grid.appendChild(clone);
            }
        });
    }
    contentDiv.appendChild(grid);
}

function activateHistoricMap(mapData) {
    const key = '[Исторические] ' + mapData.name;
    let layerFound = false;

    if (layerControl && layerControl._layers) {
        for (const k in layerControl._layers) {
            const l = layerControl._layers[k];
            if (l.name === key && l.overlay) {
                map.addLayer(l.layer);
                if (window.currentHistoricLayer) {
                    map.removeLayer(window.currentHistoricLayer);
                }
                window.currentHistoricLayer = l.layer;
                layerFound = true;
                break;
            }
        }
    }

    if (!layerFound) {
        const layer = L.tileLayer(mapData.url, {
            maxZoom: mapData.maxZoom || 18,
            attribution: mapData.attribution || 'Историческая карта',
            opacity: 0.8
        });
        layer.addTo(map);
        if (window.currentHistoricLayer) {
            map.removeLayer(window.currentHistoricLayer);
        }
        window.currentHistoricLayer = layer;
    }

    materialsModal.style.display = 'none';
    showToast('Активирована карта: ' + mapData.name, 'success');
}

let currentMaterialItem = null;
const fullscreenModal = document.getElementById('materialFullscreenModal');
const fullscreenContent = document.getElementById('materialFullscreenContent');

function openFullscreenMaterial(item) {
    currentMaterialItem = item;
    let html = `<h2>${item.Название || 'Без названия'}</h2>`;
    if (item.Год || item.Месяц) {
        html += `<p style="font-size:0.8rem;color:var(--ink-light);">${item.Год || ''} ${item.Месяц ? '· ' + monthName(parseInt(item.Месяц)) : ''}</p>`;
    }
    if (item.Описание) {
        html += `<div style="margin:0.5rem 0;">${renderMarkdown(item.Описание)}</div>`;
    }
    if (item.Ссылка) {
        if (item.Тип === 'видео') {
            html += `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin-top:0.5rem;"><iframe src="${item.Ссылка}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe></div>`;
        } else {
            html += `<div class="watermarked-image" style="margin-top:0.5rem;"><img src="${item.Ссылка}" style="max-width:100%;max-height:500px;object-fit:contain;" onerror="this.style.display='none'"></div>`;
        }
    }
    html += `
        <div style="margin-top:2rem; padding-top:1rem; border-top:1px solid var(--paper-border); font-size:0.7rem; color:var(--ink-light);">
            <p>© Атлас Сибирской смуты · <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank">CC BY-NC 4.0</a></p>
            <p>Материал из открытых источников. Дата публикации: ${new Date().toLocaleDateString('ru-RU')}</p>
        </div>
    `;
    fullscreenContent.innerHTML = html;
    fullscreenModal.style.display = 'flex';
}

document.getElementById('closeMaterialFullscreen').addEventListener('click', () => { fullscreenModal.style.display = 'none'; });
window.addEventListener('click', e => { if (e.target === fullscreenModal) fullscreenModal.style.display = 'none'; });

document.getElementById('downloadMaterialPDF').addEventListener('click', function() {
    if (!currentMaterialItem) return;
    const content = fullscreenContent;
    html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        timeout: 10000
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        let heightLeft = pdfHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
        while (heightLeft > 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
        }
        pdf.save('материал_' + (currentMaterialItem.Название || 'без_названия') + '.pdf');
        showToast('PDF создан', 'success');
    }).catch(err => {
        showToast('Ошибка создания PDF: ' + err, 'error');
    });
});

document.getElementById('materialsSearchInput').addEventListener('input', function() {
    state.materialsSearchTerm = this.value;
    buildMaterialsUI();
});

// Автоматическая загрузка при открытии страницы (если нужно)
// loadMaterialsFromGoogle(false); // раскомментируйте, если нужно загружать сразу

window.buildMaterialsUI = buildMaterialsUI;
window.openMaterials = openMaterials;
window.loadMaterialsFromGoogle = loadMaterialsFromGoogle;
window.openFullscreenMaterial = openFullscreenMaterial;
window.activateHistoricMap = activateHistoricMap;