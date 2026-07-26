// js/filters.js — фильтры по категориям, времени, поиск

const categoryChecks = document.querySelectorAll('.category-checkbox');
const yearPills = document.getElementById('yearPills');
const monthPills = document.getElementById('monthPills');

const catToggle = document.getElementById('categoriesToggle');
const catDropdown = document.getElementById('categoriesDropdown');
catToggle.addEventListener('click', function() {
    const open = catDropdown.classList.toggle('open');
    this.setAttribute('aria-expanded', open);
});
document.addEventListener('click', function(e) {
    if (!catToggle.contains(e.target) && !catDropdown.contains(e.target)) {
        catDropdown.classList.remove('open');
        catToggle.setAttribute('aria-expanded', 'false');
    }
});

function getCheckedCategories() {
    return Array.from(categoryChecks).filter(cb => cb.checked).map(cb => cb.value);
}

function buildTimePills() {
    const years = [0, 1918, 1919, 1920, 1921, 1922];
    yearPills.innerHTML = '';
    years.forEach(y => {
        const span = document.createElement('span');
        span.className = 'time-pill' + (state.currentYear === y ? ' active' : '');
        span.dataset.year = y;
        span.textContent = y === 0 ? 'Все' : y;
        yearPills.appendChild(span);
    });
    monthPills.innerHTML = '';
    for (let m = 0; m <= 12; m++) {
        const span = document.createElement('span');
        span.className = 'time-pill' + (state.currentMonth === m ? ' active' : '');
        span.dataset.month = m;
        span.textContent = m === 0 ? 'Год' : monthName(m);
        monthPills.appendChild(span);
    }
}

document.getElementById('filterPanel').addEventListener('click', function(e) {
    const target = e.target;
    if (target.classList.contains('time-pill')) {
        if (target.closest('#yearPills')) {
            const y = parseInt(target.dataset.year);
            state.currentYear = state.currentYear === y ? 0 : y;
            state.currentMonth = 0;
            buildTimePills();
            applyAllFilters();
            updatePermalink();
        } else if (target.closest('#monthPills')) {
            const m = parseInt(target.dataset.month);
            state.currentMonth = state.currentMonth === m ? 0 : m;
            buildTimePills();
            applyAllFilters();
            updatePermalink();
        }
    }
});

categoryChecks.forEach(cb => cb.addEventListener('change', function() {
    applyAllFilters();
    updatePermalink();
}));

document.getElementById('searchInput').addEventListener('input', applyAllFilters);

function applyAllFilters() {
    const checkedCats = getCheckedCategories();
    const year = state.currentYear;
    const month = state.currentMonth;
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const sidebarList = document.getElementById('sidebarList');
    sidebarList.innerHTML = '';

    // Проверка, что drawnItems существует
    if (!drawnItems) {
        console.warn('drawnItems ещё не инициализирован');
        return;
    }

    const processLayer = (layer) => {
        const props = layer.feature?.properties;
        if (!props) return;
        const catOk = !props.category || checkedCats.includes(props.category);
        const yearOk = !year || props.year === year;
        const monthOk = !year || !month || (props.month || 0) === month;
        const searchOk = !searchTerm || (props.title || '').toLowerCase().includes(searchTerm) ||
            (props.description || '').toLowerCase().includes(searchTerm);
        const visible = catOk && yearOk && monthOk && searchOk;

        if (visible) {
            if (!map.hasLayer(layer)) map.addLayer(layer);
            layer.setOpacity && layer.setOpacity(1);
        } else {
            if (map.hasLayer(layer)) map.removeLayer(layer);
        }

        if (visible && props.title) {
            const clone = document.importNode(document.getElementById('sidebarItemTemplate').content, true);
            clone.querySelector('.sidebar-item-title').textContent = props.title;
            if (props.category) clone.querySelector('.sidebar-item-cat').textContent = '[' + catLabels[props.category] || props.category + ']';
            const latlng = layer.getLatLng ? layer.getLatLng() : (layer.getBounds ? layer.getBounds().getCenter() : null);
            if (latlng) clone.querySelector('.sidebar-item-coords').textContent = latlng.lat.toFixed(4) + ', ' + latlng.lng.toFixed(4);
            clone.querySelector('.sidebar-item').addEventListener('click', function() {
                if (latlng) map.setView(latlng, 15);
                showInfoPanel(layer, props);
            });
            sidebarList.appendChild(clone);
        }
    };

    drawnItems.eachLayer(processLayer);
    if (userDataLayer) userDataLayer.eachLayer(processLayer);
}

function updatePermalink() {
    const params = new URLSearchParams(window.location.search);
    if (state.currentYear) params.set('year', state.currentYear);
    else params.delete('year');
    if (state.currentMonth) params.set('month', state.currentMonth);
    else params.delete('month');
    history.replaceState(null, '', window.location.pathname + '?' + params.toString() + window.location.hash);
}

window.buildTimePills = buildTimePills;
window.applyAllFilters = applyAllFilters;
window.updatePermalink = updatePermalink;