// js/materials.js — раздел "Материалы"

const materialsModal = document.getElementById('materialsModal');
document.getElementById('materialsNavBtn').addEventListener('click', e => { e.preventDefault(); openMaterials(); });
document.getElementById('closeMaterialsBtn').addEventListener('click', () => materialsModal.style.display = 'none');
window.addEventListener('click', e => { if (e.target === materialsModal) materialsModal.style.display = 'none'; });

function openMaterials() {
    materialsModal.style.display = 'block';
    buildMaterialsUI();
}

function buildMaterialsUI() {
    const tabsDiv = document.querySelector('.materials-tabs');
    tabsDiv.innerHTML = '';
    ['photos', 'videos', 'archives'].forEach(tab => {
        const btn = document.createElement('button');
        btn.className = 'materials-tab' + (state.currentMaterialsTab === tab ? ' active' : '');
        btn.dataset.tab = tab;
        btn.textContent = { photos: '🖼️ Фото', videos: '🎬 Видео', archives: '📄 Архивы' }[tab];
        btn.addEventListener('click', function() {
            document.querySelectorAll('.materials-tab').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.currentMaterialsTab = tab;
            buildMaterialsUI();
        });
        tabsDiv.appendChild(btn);
    });

    const filtDiv = document.querySelector('.materials-filters');
    filtDiv.innerHTML = '';
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

    const contentDiv = document.querySelector('.materials-content');
    contentDiv.innerHTML = '';
    const data = state.materialsData[state.currentMaterialsTab] || [];
    const searchTerm = document.getElementById('materialsSearchInput').value.toLowerCase();
    const filtered = data.filter(item => {
        if (state.materialsYear && item.year !== state.materialsYear) return false;
        if (state.materialsYear && state.materialsMonth && item.month !== state.materialsMonth) return false;
        if (searchTerm && !item.title.toLowerCase().includes(searchTerm) && !item.desc.toLowerCase().includes(searchTerm)) return false;
        return true;
    });

    const grid = document.createElement('div');
    grid.className = 'materials-grid';
    if (!filtered.length) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--ink-light);">Ничего не найдено</p>';
    } else {
        filtered.forEach(item => {
            const clone = document.importNode(document.getElementById('materialCardTemplate').content, true);
            const thumb = clone.querySelector('.material-thumb');
            if (state.currentMaterialsTab === 'videos') {
                thumb.innerHTML = `<iframe src="${item.src}" frameborder="0" allowfullscreen></iframe>`;
            } else {
                thumb.innerHTML = `<div class="watermarked-image"><img src="${item.src}" alt="${item.title}" loading="lazy"></div>`;
            }
            clone.querySelector('.material-info h4').textContent = item.title;
            clone.querySelector('.material-info p').textContent = item.desc;
            clone.querySelector('.material-date').textContent = item.year + (item.month ? ' · ' + monthName(item.month) : '');
            if (state.currentMaterialsTab !== 'videos') {
                clone.querySelector('.material-card').addEventListener('click', () => window.open(item.src, '_blank'));
            }
            grid.appendChild(clone);
        });
    }
    contentDiv.appendChild(grid);
}

document.getElementById('materialsSearchInput').addEventListener('input', function() {
    state.materialsSearchTerm = this.value;
    buildMaterialsUI();
});

// Экспортируем для использования в builder.js
window.buildMaterialsUI = buildMaterialsUI;
window.openMaterials = openMaterials;