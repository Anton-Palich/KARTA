// js/app.js — точка входа, инициализация интерфейса (модалки, легенда, сохранение)

document.addEventListener('DOMContentLoaded', function() {

    // ========== TOAST-УВЕДОМЛЕНИЯ ==========
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 320px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    window.showToast = function(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        let bgColor = '#4a6a3a';
        if (type === 'error') bgColor = '#8b4a4a';
        else if (type === 'warning') bgColor = '#b08a3a';
        else if (type === 'success') bgColor = '#4a7a5a';
        else bgColor = '#4a6a8a';

        toast.style.cssText = `
            background: ${bgColor};
            color: #fff;
            padding: 10px 16px;
            border-radius: 6px;
            font-family: var(--body-font);
            font-size: 0.85rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            opacity: 0;
            transform: translateX(40px);
            transition: all 0.3s ease;
            pointer-events: auto;
            cursor: default;
        `;
        toast.textContent = message;
        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };

    // ========== ИНДИКАТОР ЗАГРУЗКИ ==========
    if (!document.getElementById('global-loader')) {
        const loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.6);
            z-index: 99998;
            justify-content: center;
            align-items: center;
            font-family: var(--logo-font);
            font-size: 1.2rem;
            color: var(--ink);
            flex-direction: column;
            gap: 10px;
        `;
        loader.innerHTML = `
            <div style="width:40px;height:40px;border:4px solid var(--paper-border);border-top-color:var(--red-ink);border-radius:50%;animation:spin 0.8s linear infinite;"></div>
            <span id="loader-text">Загрузка...</span>
        `;
        if (!document.getElementById('loader-style')) {
            const style = document.createElement('style');
            style.id = 'loader-style';
            style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
        }
        document.body.appendChild(loader);
    }

    window.showLoading = function(text = 'Загрузка...') {
        const loader = document.getElementById('global-loader');
        const textEl = document.getElementById('loader-text');
        if (textEl) textEl.textContent = text;
        loader.style.display = 'flex';
    };

    window.hideLoading = function() {
        document.getElementById('global-loader').style.display = 'none';
    };

    // ========== НИЖНЯЯ ПАНЕЛЬ ИНФОРМАЦИИ ==========
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

            // Дополнительные поля (если есть)
            if (props.participants) {
                infoPanelContent.innerHTML += `<p><strong>Участники:</strong> ${props.participants}</p>`;
            }
            if (props.source) {
                infoPanelContent.innerHTML += `<p><strong>Источник:</strong> ${props.source}</p>`;
            }

            if (props.image) infoPanelContent.innerHTML +=
                '<div class="watermarked-image"><img src="' + props.image + '" style="max-width:100%;max-height:200px;object-fit:contain;margin-top:0.5rem;" onerror="this.style.display=\'none\'"></div>';
            if (props.video) {
                const m = props.video.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                if (m) infoPanelContent.innerHTML +=
                    '<iframe width="100%" height="200" src="https://www.youtube.com/embed/' + m[1] + '" frameborder="0" allowfullscreen style="margin-top:0.5rem;"></iframe>';
            }
            const isDrawn = drawnItems && drawnItems.hasLayer(layer);
            infoPanelEditBtn.style.display = state.explorerMode && isDrawn ? 'inline-block' : 'none';
            infoPanel.classList.add('open');
            currentInfoLayer = layer;
        };

        function closeInfoPanel() {
            infoPanel.classList.remove('open');
            currentInfoLayer = null;
        }

        document.getElementById('infoPanelCloseBtn').addEventListener('click', closeInfoPanel);
        infoPanelEditBtn.addEventListener('click', () => {
            if (currentInfoLayer && state.explorerMode) openLayerEditor(currentInfoLayer);
        });
        document.getElementById('infoPanelCopyBtn').addEventListener('click', () => {
            const url = window.location.href.split('?')[0] + '?year=' + state.currentYear + '&month=' + state.currentMonth + '#' + map.getCenter().lat.toFixed(5) + '/' + map.getCenter().lng.toFixed(5);
            navigator.clipboard.writeText(url).then(() => showToast('Ссылка скопирована!', 'success'));
        });

        map.on('click', function(e) {
            if (!e.originalEvent.target.closest('.leaflet-marker-icon, .leaflet-popup, .info-panel, .leaflet-tooltip')) {
                closeInfoPanel();
            }
        });
    })();

    // ========== ЛЕГЕНДА ==========
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
            if (!layerControl) return;
            const railDiv = document.getElementById('railwayLegend');
            if (!railDiv) return;
            const activeOverlays = Object.keys(layerControl._layers).filter(k =>
                layerControl._layers[k].overlay && map.hasLayer(layerControl._layers[k].layer)
            ).map(k => layerControl._layers[k].name);
            const railwaysActive = activeOverlays.some(name => name.includes('Железные дороги'));
            if (railwaysActive) {
                railDiv.style.display = 'block';
                const content = railDiv.querySelector('.railway-legend-content');
                if (content) {
                    content.innerHTML = railwayLegendData.standard.items.map(item =>
                        `<div class="legend-row"><span style="display:inline-block;width:20px;height:4px;background:${item.color};margin-right:8px;"></span>${item.label}</div>`
                    ).join('');
                }
            } else {
                railDiv.style.display = 'none';
            }
            const vectorDiv = document.getElementById('vectorSignalLegend');
            if (vectorDiv) {
                const signalsActive = activeOverlays.some(name => name.includes('Сигнализация'));
                if (signalsActive) {
                    vectorDiv.style.display = 'block';
                    const content = vectorDiv.querySelector('.vector-signal-legend-content');
                    if (content) {
                        content.innerHTML = vectorSignalLegendInfo.items.map(item =>
                            `<div class="legend-row"><span style="display:inline-block;width:20px;height:4px;background:${item.color};margin-right:8px;"></span>${item.label}</div>`
                        ).join('');
                    }
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
                try {
                    const icon = L.ExtraMarkers.icon({ icon: style.icon, markerColor: style.color, shape: style.shape, prefix: 'fa' });
                    const iconHtml = icon.createIcon ? icon.createIcon().outerHTML : '';
                    if (!iconHtml) {
                        const label = catLabels[cat] || cat;
                        html += `<div class="legend-row"><span class="legend-icon" style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${style.color};"></span><span>${label}</span></div>`;
                    } else {
                        const label = catLabels[cat] || cat;
                        html += `<div class="legend-row"><span class="legend-icon">${iconHtml}</span><span>${label}</span></div>`;
                    }
                } catch (e) {
                    const label = catLabels[cat] || cat;
                    html += `<div class="legend-row"><span class="legend-icon" style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${style.color};"></span><span>${label}</span></div>`;
                }
            }
            document.getElementById('legendContent').innerHTML = html;
            updateRailwayLegendUI();
            document.getElementById('legendModal').style.display = 'block';
        });
        document.getElementById('closeLegendBtn').addEventListener('click', () => document.getElementById('legendModal').style.display = 'none');
        window.addEventListener('click', e => { if (e.target === document.getElementById('legendModal')) document.getElementById('legendModal').style.display = 'none'; });
    })();

    // ========== МОДАЛКИ ==========
    (function() {
        const coopModal = document.getElementById('cooperationModal');
        document.getElementById('cooperationBtn').addEventListener('click', e => { e.preventDefault(); coopModal.style.display = 'flex'; });
        document.getElementById('footerCooperationLink').addEventListener('click', e => { e.preventDefault(); coopModal.style.display = 'flex'; });
        document.getElementById('closeCooperationBtn').addEventListener('click', () => coopModal.style.display = 'none');
        window.addEventListener('click', e => { if (e.target === coopModal) coopModal.style.display = 'none'; });

        const faqData = [
            { q: 'Как добавить метку на карту?', a: 'Включите режим «Исследователь» (кнопка в шапке). Затем используйте инструменты рисования (точка, линия, полигон) на карте. После создания объекта откроется редактор, где можно заполнить название, описание, год, фото и видео.' },
            { q: 'Как сохранить метки для всех пользователей?', a: 'Нажмите «Скачать рис.» – получите файл drawings.geojson. Переименуйте его в main.geojson и загрузите в папку data/ на сервере, заменив старый файл.' },
            { q: 'Где хранятся материалы (фото, видео, архивы)?', a: 'Материалы загружаются из Google Таблицы (ссылка в коде). Вы можете редактировать таблицу онлайн, и изменения появятся на сайте после обновления страницы.' },
            { q: 'Как добавить новую историческую карту?', a: 'Добавьте объект в массив historicLayers в файле state.js, указав id, название, год, URL тайлов и атрибуцию. Затем карта появится во вкладке «Старые карты» раздела «Материалы» и в панели слоёв.' },
            { q: 'Как скачать материал в PDF?', a: 'Откройте карточку материала в полноэкранном режиме (клик по карточке) и нажмите кнопку «Скачать PDF». Файл будет содержать всю информацию и атрибуцию.' },
            { q: 'Как работает конструктор?', a: 'Конструктор позволяет изменить внешний вид сайта (цвета, шрифты, тексты) и импортировать/экспортировать данные. После нажатия «Сохранить ВСЁ» вы скачиваете файлы index.html и style.css для замены на сервере.' },
            { q: 'Как включить координатную сетку?', a: 'В панели слоёв включите слой «[Инструменты] Координатная сетка». Она отображается с шагом 1 градус.' },
            { q: 'Почему фото не отображаются в PDF?', a: 'Используйте локальные пути к изображениям (например, /assets/images/photo.jpg), а не внешние ссылки. Это гарантирует загрузку при генерации PDF.' }
        ];
        const faqContainer = document.querySelector('.faq-list');
        if (faqContainer) {
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
        }
        document.getElementById('faqNavBtn').addEventListener('click', e => { e.preventDefault(); document.getElementById('faqModal').style.display = 'block'; });
        document.getElementById('footerFaqLink').addEventListener('click', e => { e.preventDefault(); document.getElementById('faqModal').style.display = 'block'; });
        document.getElementById('closeFaqBtn').addEventListener('click', () => document.getElementById('faqModal').style.display = 'none');
        window.addEventListener('click', e => { if (e.target === document.getElementById('faqModal')) document.getElementById('faqModal').style.display = 'none'; });

        document.getElementById('aboutNavBtn').addEventListener('click', e => { e.preventDefault(); document.getElementById('aboutModal').style.display = 'block'; });
        document.getElementById('footerAboutLink').addEventListener('click', e => { e.preventDefault(); document.getElementById('aboutModal').style.display = 'block'; });
        document.getElementById('closeAboutBtn').addEventListener('click', () => document.getElementById('aboutModal').style.display = 'none');
        window.addEventListener('click', e => { if (e.target === document.getElementById('aboutModal')) document.getElementById('aboutModal').style.display = 'none'; });

        document.getElementById('footerTermsLink').addEventListener('click', e => { e.preventDefault(); document.getElementById('termsModal').style.display = 'block'; });
        document.getElementById('closeTermsBtn').addEventListener('click', () => document.getElementById('termsModal').style.display = 'none');
        window.addEventListener('click', e => { if (e.target === document.getElementById('termsModal')) document.getElementById('termsModal').style.display = 'none'; });
    })();

    // ========== КНОПКА "СОХРАНИТЬ ВСЁ" ==========
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
                showToast('index.html сохранён', 'success');
            } catch (_) {
                showToast('Сохранение отменено', 'warning');
            }
        } else {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'index.html';
            a.click();
            showToast('index.html скачан', 'success');
        }
        if (state.fullCSS) {
            if (window.showSaveFilePicker) {
                try {
                    const handle = await window.showSaveFilePicker({ suggestedName: 'style.css', types: [{ description: 'CSS', accept: { 'text/css': ['.css'] } }] });
                    const writable = await handle.createWritable();
                    await writable.write(state.fullCSS);
                    await writable.close();
                    showToast('style.css сохранён', 'success');
                } catch (_) {}
            } else {
                const blob = new Blob([state.fullCSS], { type: 'text/css' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'style.css';
                a.click();
                showToast('style.css скачан', 'success');
            }
        }
        showToast('Файлы сохранены. Обновите страницу.', 'success');
    });

    // ========== ПОЛУЧЕНИЕ CSS ДЛЯ ЭКСПОРТА ==========
    fetch('css/style.css').then(r => r.text()).then(css => { state.fullCSS = css; }).catch(() => {});

    // ========== ФИНАЛЬНЫЙ ЗАПУСК ==========
    if (typeof L.hash === 'function') L.hash(map);
    buildTimePills();
    applyAllFilters();
    (function() {
        const p = new URLSearchParams(window.location.search);
        if (p.has('year')) state.currentYear = parseInt(p.get('year'));
        if (p.has('month')) state.currentMonth = parseInt(p.get('month'));
        buildTimePills();
        applyAllFilters();
    })();

    // ========== ДИНАМИЧЕСКИЙ ГОД В ФУТЕРЕ ==========
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // ========== ПЕЧАТЬ ==========
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
            for (const [name, layer] of Object.entries(baseMaps)) {
                if (map.hasLayer(layer)) layersList.push(name);
            }
        }
        document.getElementById('printLayers').textContent = 'Слои: ' + (layersList.length ? layersList.join(', ') : 'Стандартная карта');

        setTimeout(() => map.invalidateSize(), 100);
    });
    window.addEventListener('afterprint', function() {
        setTimeout(() => map.invalidateSize(), 100);
    });

    // ========== АВТОЗАГРУЗКА ОСНОВНЫХ МЕТОК ==========
    fetch('data/main.geojson')
        .then(response => {
            if (!response.ok) throw new Error('Файл main.geojson не найден');
            return response.json();
        })
        .then(data => {
            if (!data.features || !Array.isArray(data.features)) {
                console.warn('main.geojson имеет неверную структуру (ожидается FeatureCollection)');
                return;
            }
            L.geoJSON(data, {
                pointToLayer: (f, latlng) => L.marker(latlng, { icon: getCategoryIcon(f.properties?.category) }),
                onEachFeature: (f, l) => {
                    bindTooltipFromProps(l, f.properties);
                    bindClickInfo(l, f.properties);
                }
            }).addTo(drawnItems);
            console.log(`Загружено ${data.features.length} меток из main.geojson`);
        })
        .catch(err => console.warn('Основные метки не загружены:', err));

});