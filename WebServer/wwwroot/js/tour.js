class TourBookingSystem {
    constructor() {
        this.basePrice = 45000;
        this.tourName = "Ханой: Исследование столицы";
        this.init();
    }

    init() {
        this.createBookingForm();
        this.addStyles();
        this.setupEventListeners();
        this.updatePrice();
    }

    createBookingForm() {
        const bookingForm = document.createElement('div');
        bookingForm.className = 'booking-form';
        bookingForm.innerHTML = `
            <h3>Быстрое бронирование</h3>
            <form id="quick-booking-form">
                <div class="form-group">
                    <label for="booking-name">Ваше имя *</label>
                    <input type="text" id="booking-name" required>
                    <div class="error-message" id="name-error"></div>
                </div>
                
                <div class="form-group">
                    <label for="booking-phone">Телефон *</label>
                    <input type="tel" id="booking-phone" required placeholder="+7 (___) ___-__-__">
                    <div class="error-message" id="phone-error"></div>
                </div>
                
                <div class="form-group">
                    <label for="booking-email">Email *</label>
                    <input type="email" id="booking-email" required>
                    <div class="error-message" id="email-error"></div>
                </div>
                
                <div class="form-group">
                    <label for="booking-travelers">Количество путешественников</label>
                    <select id="booking-travelers">
                        <option value="1">1</option>
                        <option value="2" selected>2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5+">5+</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="booking-comments">Комментарии к заказу</label>
                    <textarea id="booking-comments" rows="3" placeholder="Особые пожелания, диетические ограничения и т.д."></textarea>
                </div>
                
                <div class="form-summary">
                    <div class="summary-item">
                        <span>Тур:</span>
                        <span>${this.tourName}</span>
                    </div>
                    <div class="summary-item">
                        <span>Цена за человека:</span>
                        <span>${this.basePrice.toLocaleString('ru-RU')} руб.</span>
                    </div>
                    <div class="summary-item">
                        <span>Количество:</span>
                        <span id="travelers-count">2</span>
                    </div>
                    <div class="summary-item total">
                        <span>Итого:</span>
                        <span id="total-price">90 000 руб.</span>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn">Забронировать</button>
                    <button type="button" class="btn btn-secondary" id="calculate-price">Рассчитать</button>
                </div>
                
                <div class="form-note">
                    * После отправки формы наш менеджер свяжется с вами в течение 30 минут для подтверждения бронирования
                </div>
            </form>
        `;
        
        const bookingSection = document.querySelector('.tour-booking .booking-contact');
        if (bookingSection) {
            bookingSection.parentNode.insertBefore(bookingForm, bookingSection.nextSibling);
        }
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .booking-form {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                margin-top: 2rem;
                animation: fadeIn 0.5s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .booking-form h3 {
                color: #2c3e50;
                margin-bottom: 1.5rem;
                text-align: center;
                font-size: 1.5rem;
            }
            
            .booking-form .form-group {
                margin-bottom: 1.5rem;
                position: relative;
            }
            
            .booking-form label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 600;
                color: #2c3e50;
                font-size: 0.95rem;
            }
            
            .booking-form input,
            .booking-form select,
            .booking-form textarea {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #e0e0e0;
                border-radius: 6px;
                font-size: 1rem;
                transition: border-color 0.3s, box-shadow 0.3s;
                background: #f8f9fa;
            }
            
            .booking-form input:focus,
            .booking-form select:focus,
            .booking-form textarea:focus {
                outline: none;
                border-color: #3498db;
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
                background: white;
            }
            
            .booking-form input.error,
            .booking-form select.error,
            .booking-form textarea.error {
                border-color: #e74c3c;
            }
            
            .booking-form textarea {
                resize: vertical;
                min-height: 100px;
                font-family: inherit;
            }
            
            .error-message {
                color: #e74c3c;
                font-size: 0.85rem;
                margin-top: 0.25rem;
                display: none;
            }
            
            .form-summary {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 1.5rem;
                border-radius: 8px;
                margin: 2rem 0;
                border: 1px solid #dee2e6;
            }
            
            .summary-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.75rem;
                padding-bottom: 0.75rem;
                border-bottom: 1px dashed #dee2e6;
            }
            
            .summary-item:last-child {
                border-bottom: none;
            }
            
            .summary-item.total {
                border-top: 2px solid #2c3e50;
                padding-top: 1rem;
                margin-top: 1rem;
                font-weight: bold;
                font-size: 1.3rem;
                color: #2c3e50;
            }
            
            .form-actions {
                display: flex;
                gap: 1rem;
                margin-bottom: 1rem;
            }
            
            #quick-booking-form .btn {
                flex: 1;
                padding: 0.75rem;
                font-size: 1rem;
                border-radius: 6px;
                transition: all 0.3s;
                cursor: pointer;
            }
            
            #quick-booking-form .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            #quick-booking-form .btn-secondary {
                background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
                color: white;
                border: none;
            }
            
            #quick-booking-form .btn-secondary:hover {
                background: linear-gradient(135deg, #7f8c8d 0%, #6c7b7d 100%);
            }
            
            .form-note {
                font-size: 0.85rem;
                color: #6c757d;
                text-align: center;
                line-height: 1.4;
                padding: 0.5rem;
                background: #f8f9fa;
                border-radius: 4px;
                margin-top: 1rem;
            }
            
            .booking-success {
                display: none;
                background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
                color: #155724;
                padding: 1.5rem;
                border-radius: 8px;
                margin-top: 1rem;
                text-align: center;
                animation: slideIn 0.5s ease;
                border: 1px solid #c3e6cb;
            }
            
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(-20px); }
                to { opacity: 1; transform: translateX(0); }
            }
            
            .booking-success h4 {
                margin: 0 0 1rem 0;
                color: #155724;
            }
            
            .booking-success .success-icon {
                font-size: 2.5rem;
                margin-bottom: 1rem;
            }
            
            .booking-loading {
                display: none;
                text-align: center;
                padding: 1rem;
            }
            
            .spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #3498db;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin: 0 auto;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        const travelersSelect = document.getElementById('booking-travelers');
        const calculateBtn = document.getElementById('calculate-price');
        const bookingForm = document.getElementById('quick-booking-form');
        const phoneInput = document.getElementById('booking-phone');

        if (travelersSelect) {
            travelersSelect.addEventListener('change', () => this.updatePrice());
        }

        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.updatePrice());
        }

        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => this.formatPhoneNumber(e));
        }
    }

    updatePrice() {
        const travelersSelect = document.getElementById('booking-travelers');
        const travelersCount = document.getElementById('travelers-count');
        const totalPrice = document.getElementById('total-price');
        
        if (!travelersSelect || !travelersCount || !totalPrice) return;

        let travelers = 2;
        if (travelersSelect.value === '5+') {
            travelers = 5;
        } else {
            travelers = parseInt(travelersSelect.value) || 2;
        }

        travelersCount.textContent = travelers;
        const total = this.basePrice * travelers;
        totalPrice.textContent = total.toLocaleString('ru-RU') + ' руб.';
    }

    formatPhoneNumber(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (value[0] !== '7') {
                value = '7' + value;
            }
            
            let formatted = '+7 ';
            if (value.length > 1) {
                formatted += '(' + value.substring(1, 4);
            }
            if (value.length >= 5) {
                formatted += ') ' + value.substring(4, 7);
            }
            if (value.length >= 8) {
                formatted += '-' + value.substring(7, 9);
            }
            if (value.length >= 10) {
                formatted += '-' + value.substring(9, 11);
            }
            
            e.target.value = formatted;
        }
    }

    validateForm(formData) {
        const errors = {};
        
        if (!formData.name.trim()) {
            errors.name = 'Введите ваше имя';
        } else if (formData.name.trim().length < 2) {
            errors.name = 'Имя должно содержать минимум 2 символа';
        } else if (!/^[a-zA-Zа-яА-ЯёЁ\s\-]+$/.test(formData.name)) {
            errors.name = 'Имя может содержать только буквы, пробелы и дефисы';
        }
        
        const phoneRegex = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;
        if (!formData.phone) {
            errors.phone = 'Введите номер телефона';
        } else if (!phoneRegex.test(formData.phone)) {
            errors.phone = 'Введите корректный номер телефона';
        }
        
        const emailRegex = /^(?![\s@.])(?!.*[.\s@]$)(?!.*@.*@)[^\s@]+@(?![\s.-])(?!.*[.\s-]$)[^\s@]+\.[^\s@]+$/; 
        if (!formData.email) {
            errors.email = 'Введите email адрес';
        } else if (!emailRegex.test(formData.email)) {
            errors.email = 'Введите корректный email адрес';
        }
        
        return errors;
    }

    showErrors(errors) {
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
            el.textContent = '';
        });
        
        document.querySelectorAll('.booking-form input, .booking-form select, .booking-form textarea').forEach(el => {
            el.classList.remove('error');
        });
        
        Object.keys(errors).forEach(field => {
            const errorElement = document.getElementById(`${field}-error`);
            const inputElement = document.getElementById(`booking-${field}`);
            
            if (errorElement && inputElement) {
                errorElement.textContent = errors[field];
                errorElement.style.display = 'block';
                inputElement.classList.add('error');
                
                if (!this.firstErrorShown) {
                    inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    inputElement.focus();
                    this.firstErrorShown = true;
                }
            }
        });
    }

    showLoading(show) {
        let loadingDiv = document.querySelector('.booking-loading');
        if (!loadingDiv) {
            loadingDiv = document.createElement('div');
            loadingDiv.className = 'booking-loading';
            loadingDiv.innerHTML = '<div class="spinner"></div><p>Обработка заявки...</p>';
            const form = document.getElementById('quick-booking-form');
            if (form) {
                form.parentNode.insertBefore(loadingDiv, form.nextSibling);
            }
        }
        loadingDiv.style.display = show ? 'block' : 'none';
    }

    showSuccessMessage(formData) {
        let successDiv = document.querySelector('.booking-success');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.className = 'booking-success';
            const form = document.getElementById('quick-booking-form');
            if (form) {
                form.parentNode.insertBefore(successDiv, form.nextSibling);
            }
        }
        
        const travelers = formData.travelers === '5+' ? 5 : parseInt(formData.travelers);
        const total = this.basePrice * travelers;
        
        successDiv.innerHTML = `
            <div class="success-icon">✓</div>
            <h4>Заявка успешно отправлена!</h4>
            <p><strong>${formData.name}</strong>, спасибо за вашу заявку!</p>
            <p>Наш менеджер свяжется с вами по телефону <strong>${formData.phone}</strong> в течение 30 минут для подтверждения бронирования.</p>
            <p><strong>Детали заявки:</strong></p>
            <ul style="text-align: left; margin: 1rem 0; padding-left: 1.5rem;">
                <li>Тур: ${this.tourName}</li>
                <li>Количество человек: ${formData.travelers}</li>
                <li>Итоговая сумма: <strong>${total.toLocaleString('ru-RU')} руб.</strong></li>
            </ul>
            <p>Номер вашей заявки: <strong>#${Date.now().toString().slice(-6)}</strong></p>
        `;
        
        successDiv.style.display = 'block';
        successDiv.scrollIntoView({ behavior: 'smooth' });
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.firstErrorShown = false;
        
        const formData = {
            name: document.getElementById('booking-name').value.trim(),
            phone: document.getElementById('booking-phone').value.trim(),
            email: document.getElementById('booking-email').value.trim(),
            travelers: document.getElementById('booking-travelers').value,
            comments: document.getElementById('booking-comments').value.trim()
        };
        
        const errors = this.validateForm(formData);
        if (Object.keys(errors).length > 0) {
            this.showErrors(errors);
            return;
        }
        
        this.showLoading(true);
        
        try {
            await this.mockServerRequest(formData);

            this.saveBookingToLocalStorage(formData);
            this.showLoading(false);
            this.showSuccessMessage(formData);

            document.getElementById('quick-booking-form').reset();

            this.updatePrice();
            this.showErrors({});
            
        } catch (error) {
            this.showLoading(false);
            alert('Произошла ошибка при отправке формы. Пожалуйста, попробуйте еще раз.');
            console.error('Booking error:', error);
        }
    }

    mockServerRequest(formData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() < 0.9) {
                    resolve({ success: true, bookingId: Date.now() });
                } else {
                    reject(new Error('Server error'));
                }
            }, 1500);
        });
    }

    saveBookingToLocalStorage(formData) {
        const bookings = JSON.parse(localStorage.getItem('tourBookings') || '[]');
        const booking = {
            ...formData,
            tour: this.tourName,
            price: this.basePrice,
            date: new Date().toISOString(),
            status: 'pending',
            bookingId: Date.now().toString()
        };
        
        bookings.push(booking);
        localStorage.setItem('tourBookings', JSON.stringify(bookings));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TourBookingSystem();
});