document.addEventListener('DOMContentLoaded', function() {
    loadUsersFromServer();
    
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleFormSubmit);
    }
});

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('review-name').value.trim();
    const rating = document.getElementById('review-rating').value;
    const text = document.getElementById('review-text').value.trim();
    
    if (!name || !rating || !text) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get('tourId');

    if (!tourId) {
        console.error('tourId не найден в URL');
        alert('Ошибка: не указан ID тура');
        return;
    }
    
    try {
        const response = await fetch('/api/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                text: text,
                stars: parseInt(rating),
                CatalogId: parseInt(tourId)
            })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка отправки');
        }
        
        document.getElementById('review-form').reset();
        
        await loadUsersFromServer();
        
        alert('Спасибо! Ваш отзыв добавлен.');
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при отправке отзыва');
    }
}

async function loadUsersFromServer() {
    const reviewsGrid = document.querySelector('.reviews-grid');
    if (!reviewsGrid) return;

    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get('tourId');

    if (!tourId) {
        console.error('tourId не найден в URL');
        alert('Ошибка: не указан ID тура');
        return;
    }
    
    try {
        reviewsGrid.innerHTML = '<div class="loading">Загрузка отзывов...</div>';
        
        const response = await fetch(`/api/user/${tourId}`);
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки данных');
        }
        
        const users = await response.json();
        
        reviewsGrid.innerHTML = '';
        
        if (users.length === 0) {
            reviewsGrid.innerHTML = '<div class="no-reviews">Пока нет отзывов</div>';
            return;
        }
        
        users.forEach(user => {
            const reviewCard = createReviewCard(user);
            reviewsGrid.appendChild(reviewCard);
        });
        
    } catch (error) {
        console.error('Ошибка:', error);
        reviewsGrid.innerHTML = '<div class="error">Ошибка загрузки отзывов</div>';
    }
}

function createReviewCard(user) {
    const reviewCard = document.createElement('div');
    reviewCard.className = 'review-card';
    
    const starsCount = user.stars || 5;
    const stars = '★'.repeat(starsCount) + '☆'.repeat(5 - starsCount);
    
    let dateString = 'сегодня';
    if (user.date) { 
        const date = new Date(user.date);
        dateString = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
    }
    
    reviewCard.innerHTML = `
        <div class="review-header">
            <div class="review-author">${escapeHtml(user.userName || 'Аноним')}</div>  <!-- Изменено с name на userName -->
            <div class="review-date">${dateString}</div>
        </div>
        <div class="review-rating">${stars}</div>
        <p>${escapeHtml(user.text || '')}</p>
    `;
    
    return reviewCard;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}