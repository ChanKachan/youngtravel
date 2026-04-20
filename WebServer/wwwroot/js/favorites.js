// favorites.js

document.addEventListener('DOMContentLoaded', function() {
    loadFavoriteTours();
});

// Данные о турах (должны быть такие же как в catalog.js)
const tours = [
        {
            id: 1,
            title: "Ханой: Исследование столицы",
            country: "Вьетнам",
            price: 45000,
            duration: 10,
            rating: 4.8,
            image: "https://i.pinimg.com/736x/f8/b1/66/f8b166287e51f263e8ce5f05b2c8d181.jpg",
            description: "Полное погружение в культуру Вьетнама: Ханой, Халонг, Хюэ, Хойан, Хошимин.",
            dates: "15.11.2025 - 25.11.2025",
            type: "экскурсионный"
        },
        {
            id: 2,
            title: "Пляжный отдых в Нячанге",
            country: "Вьетнам",
            price: 75000,
            duration: 7,
            rating: 4.5,
            image: "https://i.pinimg.com/1200x/d8/5f/07/d85f07af427f2f0e39d320a76dcef38c.jpg", 
            description: "Незабываемый отдых на лучших пляжах Нячанга с экскурсиями и spa-процедурами.",
            dates: "20.11.2025 - 27.11.2025",
            type: "пляжный"
        },
        {
            id: 3,
            title: "Горный тур в Сапу",
            country: "Вьетнам",
            price: 65000,
            duration: 8,
            rating: 4.9,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsT7NaDfua9qtHDnAJyTYW7o6Tq-yXFSxn-g&s",
            description: "Путешествие в горный регион Сапа, знакомство с местными племенами и рисовые террасы.",
            dates: "10.12.2025 - 18.12.2025",
            type: "горный"
        },
        {
            id: 4,
            title: "Тур по дельте Меконга",
            country: "Вьетнам",
            price: 70000,
            duration: 9,
            rating: 4.7,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKBJuVK_TBoqsLTeTyjIgqHPy33e42HlT5gQ&s",
            description: "Экскурсия по уникальной экосистеме дельты реки Меконг, плавучие рынки.",
            dates: "05.12.2025 - 14.12.2025",
            type: "экскурсионный"
        },
        {
            id: 5,
            title: "Отдых на острове Фукуок",
            country: "Вьетнам",
            price: 90000,
            duration: 10,
            rating: 4.6,
            image: "https://blog-cdn.aviata.kz/blog/categories/1_ZCB46qK.png",
            description: "Райский отдых на острове Фукуок с белоснежными пляжами и коралловыми рифами.",
            dates: "25.11.2025 - 05.12.2025",
            type: "пляжный"
        }
];

function loadFavoriteTours() {
    const favoritesGrid = document.querySelector('.favorites-grid');
    const emptyFavorites = document.querySelector('.empty-favorites');
    
    if (!favoritesGrid) return;
    
    const favoriteIds = JSON.parse(localStorage.getItem('favoriteTours')) || [];    
    const favoriteTours = tours.filter(tour => favoriteIds.includes(tour.id));
    
    if (favoriteTours.length === 0) {
        if (emptyFavorites) {
            emptyFavorites.style.display = 'block';
        }
        favoritesGrid.innerHTML = '';
        return;
    }

    if (emptyFavorites) {
        emptyFavorites.style.display = 'none';
    }
    
    favoritesGrid.innerHTML = '';
    
    favoriteTours.forEach(tour => {
        const tourCard = createFavoriteTourCard(tour);
        favoritesGrid.appendChild(tourCard);
    });
}

function createFavoriteTourCard(tour) {
    const tourCard = document.createElement('div');
    tourCard.className = 'tour-card';
    tourCard.setAttribute('data-id', tour.id);
    
    const bookLink = /tour.html?id=;
    
    tourCard.innerHTML = `
        <img src="${tour.image}" alt="${tour.title}" class="tour-image">
        <div class="tour-content">
            <div class="tour-header">
                <h3 class="tour-title">${tour.title}</h3>
                <button class="favorite-btn active" data-id="${tour.id}">♥</button>
            </div>
            <div class="tour-meta">
                <span class="tour-type">${tour.type}</span>
                <span class="tour-rating">★ ${tour.rating}</span>
            </div>
            <div class="tour-dates">${tour.dates}</div>
            <p class="tour-description">${tour.description}</p>
            <div class="tour-footer">
                <div class="tour-price">${tour.price.toLocaleString()} руб.</div>
                <div class="tour-actions">
                    <a href="${bookLink}" class="btn">Забронировать</a>
                    <a href="/reviews.html?tourId=${tour.id}" class="btn reviews-btn">Отзывы</a>
                </div>
            </div>
        </div>
    `;
    
    const favoriteBtn = tourCard.querySelector('.favorite-btn');
    
    favoriteBtn.addEventListener('click', function(e) {
        e.preventDefault();
        toggleFavorite(tour.id, this);
    });
    
    return tourCard;
}

function toggleFavorite(tourId, button) {
    let favorites = JSON.parse(localStorage.getItem('favoriteTours')) || [];
    
    if (favorites.includes(tourId)) {
        favorites = favorites.filter(id => id !== tourId);
        button.classList.remove('active');
        button.style.color = '#ccc';
    } else {
        favorites.push(tourId);
        button.classList.add('active');
        button.style.color = '#e74c3c';
    }
    
    localStorage.setItem('favoriteTours', JSON.stringify(favorites));
    loadFavoriteTours();
}

function removeFromFavorites(tourId) {
    let favorites = JSON.parse(localStorage.getItem('favoriteTours')) || [];
    favorites = favorites.filter(id => id !== tourId);
    localStorage.setItem('favoriteTours', JSON.stringify(favorites));
    
    showNotification('Тур удален из избранного');
    
    setTimeout(() => {
        loadFavoriteTours();
    }, 300);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 1rem 2rem;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}