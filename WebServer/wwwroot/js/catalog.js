document.addEventListener('DOMContentLoaded', function() {
    let currentFilters = {
        minPrice: null,
        maxPrice: null,
        minDuration: null,
        maxDuration: null,
        city: null,
        type: null,
        sortBy: null,
        sortOrder: 'asc',
        search: null
    };
    
    let currentTooltip = null;
    let tooltipTimeout = null;
    let suggestionsTimeout = null;
    let suggestionsEl = null;
    
    const toursContainer = document.querySelector('.tours-grid');
    const priceFilterMin = document.getElementById('min-price');
    const priceFilterMax = document.getElementById('max-price');
    const minPriceSlider = document.getElementById('min-price-slider');
    const maxPriceSlider = document.getElementById('max-price-slider');
    const durationFilter = document.getElementById('duration-filter');
    const typeFilter = document.getElementById('type-filter');
    const cityFilter = document.getElementById('city-filter');
    const sortSelect = document.getElementById('sort-tours');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const searchInput = document.getElementById('search-tours');

    const API_URL = '/api/catalog';

    // Загрузка опций фильтров с бэкенда
    async function loadFilterOptions() {
        try {
            const response = await fetch(`${API_URL}/filter-options`);
            if (!response.ok) throw new Error('Ошибка загрузки опций фильтров');
            
            const options = await response.json();
            
            // Устанавливаем диапазоны слайдеров
            if (options.PriceRange) {
                const maxPrice = options.PriceRange.Max || 500000;
                minPriceSlider.max = maxPrice;
                maxPriceSlider.max = maxPrice;
                maxPriceSlider.value = maxPrice;
                
                if (priceFilterMax) priceFilterMax.value = maxPrice;
                if (priceFilterMin) priceFilterMin.value = options.PriceRange.Min || 0;
                minPriceSlider.value = options.PriceRange.Min || 0;
            }
            
            if (options.DurationRange) {
                console.log('Диапазон длительности:', options.DurationRange);
            }
            
        } catch (error) {
            console.error('Ошибка загрузки опций фильтров:', error);
            // Устанавливаем значения по умолчанию
            if (minPriceSlider) minPriceSlider.max = 500000;
            if (maxPriceSlider) maxPriceSlider.max = 500000;
            if (maxPriceSlider) maxPriceSlider.value = 500000;
        }
    }

    // Загрузка туров с фильтрацией на бэкенде
    async function loadTours() {
        try {
            showLoading();
            
            // Строим URL с параметрами фильтрации
            const params = new URLSearchParams();
            
            if (currentFilters.minPrice && currentFilters.minPrice > 0) {
                params.append('minPrice', currentFilters.minPrice);
            }
            if (currentFilters.maxPrice && currentFilters.maxPrice > 0) {
                params.append('maxPrice', currentFilters.maxPrice);
            }
            if (currentFilters.minDuration) {
                params.append('minDuration', currentFilters.minDuration);
            }
            if (currentFilters.maxDuration) {
                params.append('maxDuration', currentFilters.maxDuration);
            }
            if (currentFilters.city) {
                params.append('city', currentFilters.city);
            }
            if (currentFilters.search) {
                params.append('search', currentFilters.search);
            }
            if (currentFilters.sortBy) {
                params.append('sortBy', currentFilters.sortBy);
                params.append('sortOrder', currentFilters.sortOrder);
            }
            
            const url = `${API_URL}/filter${params.toString() ? '?' + params.toString() : ''}`;
            console.log('Запрос к API:', url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Полученные данные:', data);
            
            if (!Array.isArray(data)) {
                throw new Error('Полученные данные не являются массивом');
            }
            
            // Преобразуем данные в формат для отображения
            const tours = data.map(item => ({
                id: item.Id || item.id,
                title: item.Name || item.name || 'Тур без названия',
                country: item.City || item.city || 'Не указано',
                price: item.Cost || item.cost || 0,
                description: item.Description || item.description || 'Описание отсутствует',
                image: item.Photo || item.photo || 'https://via.placeholder.com/300x200?text=No+Image',
                dateIn: item.DateIn || item.date_in,
                dateOut: item.DateOut || item.date_out,
                type: determineTourType(item.Name || item.name, item.Description || item.description),
                duration: item.Duration
            })).filter(tour => tour.price > 0);
            
            displayTours(tours);
            
        } catch (error) {
            console.error('Ошибка загрузки туров:', error);
            showError('Не удалось загрузить туры. Пожалуйста, проверьте подключение к серверу.');
        }
    }

    // Определение типа тура
    function determineTourType(name, description) {
        const text = ((name || '') + ' ' + (description || '')).toLowerCase();
        
        if (text.includes('пляж') || text.includes('море') || text.includes('пляжный')) {
            return 'пляжный';
        } else if (text.includes('гор') || text.includes('экскурсия') || text.includes('экскурсионный')) {
            return 'экскурсионный';
        } else if (text.includes('город') || text.includes('столица')) {
            return 'городской';
        }
        
        return 'экскурсионный';
    }

    // Вычисление длительности
    function calculateDuration(dateIn, dateOut) {
        if (!dateIn || !dateOut) return 7;
        try {
            const start = new Date(dateIn);
            const end = new Date(dateOut);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return 7;
            const diffTime = Math.abs(end - start);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        } catch (e) {
            return 7;
        }
    }

    function showLoading() {
        if (toursContainer) {
            toursContainer.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Загрузка туров...</p>
                </div>
            `;
        }
    }

    function showError(message) {
        if (toursContainer) {
            toursContainer.innerHTML = `
                <div class="error">
                    <h3>Ошибка загрузки</h3>
                    <p>${escapeHtml(message)}</p>
                    <button class="btn" onclick="location.reload()">Повторить попытку</button>
                </div>
            `;
        }
    }

    function setupEventListeners() {
        // Слайдеры цены
        if (minPriceSlider && maxPriceSlider) {
            minPriceSlider.addEventListener('input', updateMinPrice);
            maxPriceSlider.addEventListener('input', updateMaxPrice);
        }
        
        if (priceFilterMin) {
            priceFilterMin.addEventListener('change', updateMinPriceFromInput);
        }
        
        if (priceFilterMax) {
            priceFilterMax.addEventListener('change', updateMaxPriceFromInput);
        }
        
        if (durationFilter) {
            durationFilter.addEventListener('change', updateDurationFilter);
        }
        
        if (typeFilter) {
            typeFilter.addEventListener('change', updateTypeFilter);
        }
        
        if (cityFilter) {
            cityFilter.addEventListener('change', updateCityFilter);
        }
        
        if (sortSelect) {
            sortSelect.addEventListener('change', updateSorting);
        }
        
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', resetFilters);
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', handleSearchInput);
            searchInput.addEventListener('keydown', handleSearchKeydown);
            searchInput.addEventListener('blur', hideSuggestions);
        }
    }

    function updateMinPrice() {
        let minVal = parseInt(minPriceSlider.value);
        const maxVal = parseInt(maxPriceSlider.value);
        
        if (minVal > maxVal) {
            minVal = maxVal;
            minPriceSlider.value = minVal;
        }
        
        if (priceFilterMin) priceFilterMin.value = minVal;
        currentFilters.minPrice = minVal > 0 ? minVal : null;
        loadTours();
    }

    function updateMaxPrice() {
        let maxVal = parseInt(maxPriceSlider.value);
        const minVal = parseInt(minPriceSlider.value);
        
        if (maxVal < minVal) {
            maxVal = minVal;
            maxPriceSlider.value = maxVal;
        }
        
        if (priceFilterMax) priceFilterMax.value = maxVal;
        currentFilters.maxPrice = maxVal;
        loadTours();
    }

    function updateMinPriceFromInput() {
        let minVal = parseInt(priceFilterMin.value);
        const maxVal = currentFilters.maxPrice || parseInt(maxPriceSlider.max);
        
        if (isNaN(minVal)) minVal = 0;
        if (minVal < 0) minVal = 0;
        if (minVal > maxVal) minVal = maxVal;
        
        minPriceSlider.value = minVal;
        currentFilters.minPrice = minVal > 0 ? minVal : null;
        loadTours();
    }

    function updateMaxPriceFromInput() {
        let maxVal = parseInt(priceFilterMax.value);
        const minVal = currentFilters.minPrice || 0;
        
        if (isNaN(maxVal)) maxVal = parseInt(maxPriceSlider.max);
        if (maxVal < minVal) maxVal = minVal;
        
        maxPriceSlider.value = maxVal;
        currentFilters.maxPrice = maxVal;
        loadTours();
    }

    function updateDurationFilter() {
        const value = durationFilter.value;
        if (value && value.includes('-')) {
            const [min, max] = value.split('-');
            currentFilters.minDuration = parseInt(min);
            currentFilters.maxDuration = parseInt(max);
        } else if (value === '22+') {
            currentFilters.minDuration = 22;
            currentFilters.maxDuration = null;
        } else {
            currentFilters.minDuration = null;
            currentFilters.maxDuration = null;
        }
        loadTours();
    }

    function updateTypeFilter() {
        currentFilters.type = typeFilter.value || null;
        loadTours();
    }

    function updateCityFilter() {
        currentFilters.city = cityFilter.value || null;
        loadTours();
    }

    function updateSorting() {
        const value = sortSelect.value;
        switch(value) {
            case 'price-asc':
                currentFilters.sortBy = 'price';
                currentFilters.sortOrder = 'asc';
                break;
            case 'price-desc':
                currentFilters.sortBy = 'price';
                currentFilters.sortOrder = 'desc';
                break;
            case 'duration-asc':
                currentFilters.sortBy = 'duration';
                currentFilters.sortOrder = 'asc';
                break;
            case 'duration-desc':
                currentFilters.sortBy = 'duration';
                currentFilters.sortOrder = 'desc';
                break;
            default:
                currentFilters.sortBy = null;
                currentFilters.sortOrder = 'asc';
        }
        loadTours();
    }

    function handleSearchInput() {
        if (suggestionsTimeout) clearTimeout(suggestionsTimeout);
        const q = searchInput.value.trim();
        if (q.length < 2) {
            hideSuggestions();
            return;
        }
        suggestionsTimeout = setTimeout(() => fetchAndShowSuggestions(q), 250);
    }

    function handleSearchKeydown(e) {
        if (e.key === 'Enter') {
            hideSuggestions();
            const query = searchInput.value.trim();
            currentFilters.search = query.length >= 2 ? query : null;
            loadTours();
        } else if (e.key === 'Escape') {
            hideSuggestions();
        }
    }

    async function fetchAndShowSuggestions(q) {
        try {
            const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}`);
            if (!response.ok) return;
            const items = await response.json();
            showSuggestions(items);
        } catch {}
    }

    function showSuggestions(items) {
        hideSuggestions();
        if (!items || items.length === 0) return;

        const wrapper = searchInput.closest('.search-wrapper');
        suggestionsEl = document.createElement('ul');
        suggestionsEl.className = 'search-suggestions';

        items.forEach(item => {
            const li = document.createElement('li');
            const name = item.Name || item.name || '';
            const city = item.City || item.city || '';
            li.textContent = city ? `${name} — ${city}` : name;
            li.addEventListener('mousedown', (e) => {
                e.preventDefault();
                searchInput.value = name;
                hideSuggestions();
                currentFilters.search = name;
                loadTours();
            });
            suggestionsEl.appendChild(li);
        });

        wrapper.appendChild(suggestionsEl);
    }

    function hideSuggestions() {
        if (suggestionsEl) {
            suggestionsEl.remove();
            suggestionsEl = null;
        }
    }

    function resetFilters() {
        // Сброс цен
        const maxPrice = parseInt(maxPriceSlider.max);
        minPriceSlider.value = 0;
        maxPriceSlider.value = maxPrice;
        if (priceFilterMin) priceFilterMin.value = 0;
        if (priceFilterMax) priceFilterMax.value = maxPrice;
        
        // Сброс фильтров
        if (durationFilter) durationFilter.value = '';
        if (typeFilter) typeFilter.value = '';
        if (cityFilter) cityFilter.value = '';
        if (sortSelect) sortSelect.value = 'default';
        if (searchInput) searchInput.value = '';
        hideSuggestions();

        // Сброс состояния фильтров
        currentFilters = {
            minPrice: null,
            maxPrice: null,
            minDuration: null,
            maxDuration: null,
            city: null,
            type: null,
            sortBy: null,
            sortOrder: 'asc',
            search: null
        };
        
        loadTours();
    }

    async function fetchTourDetails(tourId) {
        try {
            const response = await fetch(`${API_URL}/tooltip/${tourId}`);
            if (!response.ok) {
                console.warn('Ошибка загрузки деталей тура:', response.status);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error('Ошибка загрузки деталей тура:', error);
            return null;
        }
    }

    async function showTooltip(event, tour) {
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
        }
        
        hideTooltip();
        
        tooltipTimeout = setTimeout(async () => {
            const details = await fetchTourDetails(tour.id);
            
            const tooltip = document.createElement('div');
            tooltip.className = 'tour-tooltip';
            
            const duration = tour.duration || calculateDuration(tour.dateIn, tour.dateOut);
            const safePrice = typeof tour.price === 'number' && !isNaN(tour.price) ? tour.price : 0;

            tooltip.innerHTML = `
                <div class="tooltip-content">
                    <button class="tooltip-close">×</button>
                    <img src="${escapeHtml(tour.image)}" alt="${escapeHtml(tour.title)}" class="tooltip-image" onerror="this.src='https://via.placeholder.com/280x150?text=No+Image'">
                    <h4>${escapeHtml(tour.title)}</h4>
                    
                    <div class="tooltip-info-row">
                        <span class="tooltip-label">📍 Город:</span>
                        <span>${escapeHtml(tour.country)}</span>
                    </div>
                    
                    <div class="tooltip-info-row">
                        <span class="tooltip-label">💰 Цена:</span>
                        <span class="tooltip-price">${safePrice.toLocaleString()} руб.</span>
                    </div>
                    
                    <div class="tooltip-info-row">
                        <span class="tooltip-label">🏷️ Тип:</span>
                        <span>${escapeHtml(tour.type)}</span>
                    </div>
                    
                    <div class="tooltip-divider"></div>
                    
                    <div class="tooltip-options">
                        <strong>🏨 Доступные варианты:</strong>
                        <ul>
                            <li>🍽️ Питание: Завтраки / Полупансион / Все включено</li>
                            <li>⭐ Отели: 3★, 4★, 5★</li>
                            <li>🚐 Трансфер: Включен</li>
                        </ul>
                    </div>
                    
                    ${details && details.Description ? `
                        <div class="tooltip-divider"></div>
                        <div class="tooltip-description">
                            <strong>📝 Краткое описание:</strong>
                            <p>${escapeHtml(details.Description.substring(0, 120))}${details.Description.length > 120 ? '...' : ''}</p>
                        </div>
                    ` : ''}
                    
                    <div class="tooltip-actions">
                        <a href="/Tour/Details/${tour.id}" class="tooltip-btn tooltip-btn-primary">Забронировать</a>
                        <a href="/reviews.html?tourId=${tour.id}" class="tooltip-btn tooltip-btn-secondary">Отзывы</a>
                    </div>
                </div>
            `;
            
            document.body.appendChild(tooltip);
            currentTooltip = tooltip;
            
            const card = event.target.closest('.tour-card');
            if (!card) return;
            
            const rect = card.getBoundingClientRect();
            tooltip.style.position = 'fixed';
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
            tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
            
            if (parseFloat(tooltip.style.top) < 10) {
                tooltip.style.top = `${rect.bottom + 10}px`;
                tooltip.classList.add('tooltip-bottom');
            }
            
            if (parseFloat(tooltip.style.left) < 10) {
                tooltip.style.left = '10px';
            }
            
            if (parseFloat(tooltip.style.left) + tooltip.offsetWidth > window.innerWidth - 10) {
                tooltip.style.left = `${window.innerWidth - tooltip.offsetWidth - 10}px`;
            }
            
            setTimeout(() => {
                tooltip.classList.add('visible');
            }, 10);
            
            const closeBtn = tooltip.querySelector('.tooltip-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', hideTooltip);
            }
        }, 300);
    }

    function hideTooltip() {
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
        }
        
        if (currentTooltip) {
            currentTooltip.classList.remove('visible');
            setTimeout(() => {
                if (currentTooltip && currentTooltip.parentNode) {
                    currentTooltip.parentNode.removeChild(currentTooltip);
                }
                currentTooltip = null;
            }, 200);
        }
    }

    function displayTours(toursArray) {
        if (!toursContainer) return;
        
        toursContainer.innerHTML = '';
        
        if (!toursArray || toursArray.length === 0) {
            toursContainer.innerHTML = `
                <div class="no-results">
                    <h3>Туры не найдены</h3>
                    <p>Попробуйте изменить параметры фильтрации</p>
                    <button class="btn" onclick="window.resetFilters()">Сбросить фильтры</button>
                </div>
            `;
            
            const toursCount = document.getElementById('tours-count');
            if (toursCount) toursCount.textContent = '0';
            return;
        }
        
        toursArray.forEach((tour) => {
            const tourCard = document.createElement('div');
            tourCard.className = 'tour-card';
            tourCard.setAttribute('data-tour-id', tour.id);
            
            const duration = tour.duration || calculateDuration(tour.dateIn, tour.dateOut);
            const safePrice = typeof tour.price === 'number' && !isNaN(tour.price) ? tour.price : 0;
            const safeTitle = tour.title || 'Тур без названия';
            const safeCountry = tour.country || 'Не указано';
            const safeDescription = tour.description || 'Описание отсутствует';
            const safeImage = tour.image || 'https://via.placeholder.com/300x200?text=No+Image';
            const safeType = tour.type || 'экскурсионный';
            
            tourCard.innerHTML = `
                <img src="${escapeHtml(safeImage)}" alt="${escapeHtml(safeTitle)}" class="tour-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                <div class="tour-content">
                    <div class="tour-header">
                        <h3 class="tour-title">${escapeHtml(safeTitle)}</h3>
                        <button class="favorite-btn" data-id="${tour.id}">♥</button>
                    </div>
                    <div class="tour-meta">
                        <span class="tour-country">📍 ${escapeHtml(safeCountry)}</span>
                        <span class="tour-type">🏷️ ${escapeHtml(safeType)}</span>
                    </div>
                    <p class="tour-description">${escapeHtml(safeDescription.substring(0, 100))}${safeDescription.length > 100 ? '...' : ''}</p>
                    <div class="tour-footer">
                        <div class="tour-price">${safePrice.toLocaleString()} руб.</div>
                        <div class="tour-actions">
                            <a href="/Tour/Details/${tour.id}" class="btn">Забронировать</a>
                            <a href="/reviews.html?tourId=${tour.id}" class="btn reviews-btn">Отзывы</a>
                        </div>
                    </div>
                </div>
            `;
            
            tourCard.addEventListener('mouseenter', (e) => showTooltip(e, tour));
            tourCard.addEventListener('mouseleave', hideTooltip);
            
            toursContainer.appendChild(tourCard);
        });
        
        const toursCount = document.getElementById('tours-count');
        if (toursCount) {
            toursCount.textContent = toursArray.length;
        }
        
        addFavoriteListeners();
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function addFavoriteListeners() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const tourId = parseInt(btn.getAttribute('data-id'));
            updateFavoriteButton(btn, tourId);
            
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const tourId = parseInt(this.getAttribute('data-id'));
                toggleFavorite(tourId, this);
            });
        });
    }

    function updateFavoriteButton(button, tourId) {
        let favorites = JSON.parse(localStorage.getItem('favoriteTours')) || [];
        
        if (favorites.includes(tourId)) {
            button.classList.add('active');
            button.style.color = '#e74c3c';
        } else {
            button.classList.remove('active');
            button.style.color = '#ccc';
        }
    }

    function toggleFavorite(tourId, button) {
        let favorites = JSON.parse(localStorage.getItem('favoriteTours')) || [];
        
        if (favorites.includes(tourId)) {
            favorites = favorites.filter(id => id !== tourId);
            button.classList.remove('active');
            button.style.color = '#ccc';
            showNotification('Тур удален из избранного', '#e74c3c');
        } else {
            favorites.push(tourId);
            button.classList.add('active');
            button.style.color = '#e74c3c';
            showNotification('Тур добавлен в избранное!', '#2ecc71');
        }
        
        localStorage.setItem('favoriteTours', JSON.stringify(favorites));
    }

    function showNotification(message, color) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    window.resetFilters = resetFilters;
    
    addTooltipStyles();
    
    function addTooltipStyles() {
        if (document.getElementById('tooltip-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'tooltip-styles';
        style.textContent = `
            .tour-tooltip {
                position: fixed;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.2);
                width: 320px;
                z-index: 1000;
                opacity: 0;
                transform: translateY(10px);
                transition: opacity 0.2s, transform 0.2s;
                pointer-events: auto;
            }
            
            .tour-tooltip.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .tour-tooltip.tooltip-bottom {
                transform: translateY(-10px);
            }
            
            .tour-tooltip.tooltip-bottom.visible {
                transform: translateY(0);
            }
            
            .tooltip-content {
                padding: 1rem;
                position: relative;
            }
            
            .tooltip-close {
                position: absolute;
                top: 8px;
                right: 12px;
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #999;
                transition: color 0.2s;
                z-index: 1;
            }
            
            .tooltip-close:hover {
                color: #333;
            }
            
            .tooltip-image {
                width: 100%;
                height: 150px;
                object-fit: cover;
                border-radius: 8px;
                margin-bottom: 1rem;
            }
            
            .tooltip-content h4 {
                margin: 0 0 1rem 0;
                color: #2c3e50;
                font-size: 1.1rem;
                padding-right: 20px;
            }
            
            .tooltip-info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
                font-size: 0.85rem;
            }
            
            .tooltip-label {
                font-weight: 600;
                color: #666;
            }
            
            .tooltip-price {
                color: #e74c3c;
                font-weight: bold;
                font-size: 1rem;
            }
            
            .tooltip-divider {
                height: 1px;
                background: #eee;
                margin: 0.75rem 0;
            }
            
            .tooltip-options {
                margin: 0.5rem 0;
                font-size: 0.85rem;
            }
            
            .tooltip-options ul {
                margin: 0.5rem 0 0 1rem;
                padding: 0;
            }
            
            .tooltip-options li {
                margin-bottom: 0.25rem;
            }
            
            .tooltip-description {
                font-size: 0.85rem;
                color: #555;
                line-height: 1.4;
            }
            
            .tooltip-description p {
                margin: 0.5rem 0 0 0;
            }
            
            .tooltip-actions {
                display: flex;
                gap: 0.5rem;
                margin-top: 1rem;
            }
            
            .tooltip-btn {
                flex: 1;
                text-align: center;
                padding: 0.5rem;
                border-radius: 6px;
                text-decoration: none;
                font-size: 0.85rem;
                transition: all 0.2s;
            }
            
            .tooltip-btn-primary {
                background: #3498db;
                color: white;
            }
            
            .tooltip-btn-primary:hover {
                background: #2980b9;
            }
            
            .tooltip-btn-secondary {
                background: #ecf0f1;
                color: #2c3e50;
            }
            
            .tooltip-btn-secondary:hover {
                background: #bdc3c7;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            .loading {
                text-align: center;
                padding: 3rem;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                margin: 0 auto 1rem;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .error, .no-results {
                text-align: center;
                padding: 3rem;
            }
            
            .tour-meta {
                display: flex;
                gap: 0.75rem;
                flex-wrap: wrap;
                margin-bottom: 0.75rem;
                font-size: 0.85rem;
                color: #666;
            }
            
            .tour-country, .tour-type {
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
            }
            
            .tour-description {
                color: #555;
                line-height: 1.5;
                margin: 0.75rem 0;
                font-size: 0.9rem;
            }
            
            .price-range {
                margin-top: 0.5rem;
            }
            
            .price-inputs {
                display: flex;
                gap: 0.5rem;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            
            .price-input {
                flex: 1;
                padding: 0.5rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 0.85rem;
            }
            
            .price-slider {
                position: relative;
                height: 30px;
            }
            
            .price-slider input {
                position: absolute;
                width: 100%;
                pointer-events: none;
                -webkit-appearance: none;
                background: transparent;
            }
            
            .price-slider input::-webkit-slider-thumb {
                pointer-events: auto;
                -webkit-appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #3498db;
                cursor: pointer;
                border: none;
            }
            
            .duration-range select {
                width: 100%;
                padding: 0.5rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 0.85rem;
            }

            .search-wrapper {
                position: relative;
            }

            .search-suggestions {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #ddd;
                border-top: none;
                border-radius: 0 0 6px 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                list-style: none;
                margin: 0;
                padding: 0;
                z-index: 500;
                max-height: 240px;
                overflow-y: auto;
            }

            .search-suggestions li {
                padding: 0.55rem 0.75rem;
                font-size: 0.9rem;
                color: #2c3e50;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .search-suggestions li:last-child {
                border-bottom: none;
            }

            .search-suggestions li:hover {
                background: #f0f6ff;
                color: #3498db;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Инициализация
    async function init() {
        await loadFilterOptions();
        setupEventListeners();
        await loadTours();
    }
    
    init();
});