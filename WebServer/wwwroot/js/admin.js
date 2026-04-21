// admin.js
// Файл для отправки данных тура на сервер

const API_URL = '/api/catalog';

// Функция для отображения ошибок на форме
function displayErrors(errors) {
    // Очищаем предыдущие ошибки
    hideAllErrors();

    if (Array.isArray(errors)) {
        // Обработка массива ошибок
        errors.forEach(error => {
            // Определяем, к какому полю относится ошибка
            let fieldId = null;
            let errorMessage = error;

            if (error.toLowerCase().includes('name')) {
                fieldId = 'tourNameError';
                document.getElementById('tourName').classList.add('error');
            } else if (error.toLowerCase().includes('photo') || error.toLowerCase().includes('image')) {
                fieldId = 'tourImageError';
                document.getElementById('tourImage').classList.add('error');
            } else if (error.toLowerCase().includes('city')) {
                fieldId = 'tourCityError';
                document.getElementById('tourCity').classList.add('error');
            } else if (error.toLowerCase().includes('cost') || error.toLowerCase().includes('price')) {
                fieldId = 'tourPriceError';
                document.getElementById('tourPrice').classList.add('error');
            } else if (error.toLowerCase().includes('email')) {
                fieldId = 'tourEmailError';
                document.getElementById('tourEmail').classList.add('error');
            } else if (error.toLowerCase().includes('description')) {
                fieldId = 'tourDescriptionError';
                document.getElementById('tourDescription').classList.add('error');
            } else if (error.toLowerCase().includes('period') || error.toLowerCase().includes('дата')) {
                fieldId = 'tourDatesError';
                document.getElementById('tourDates').classList.add('error');
            }

            if (fieldId) {
                const errorElement = document.getElementById(fieldId);
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block';
            } else {
                // Если не удалось определить поле, показываем общую ошибку
                showGeneralError(errorMessage);
            }
        });
    } else if (typeof errors === 'object' && errors.error) {
        // Обработка одиночной ошибки
        showGeneralError(errors.error);
    } else if (typeof errors === 'string') {
        showGeneralError(errors);
    }
}

// Функция для отображения общей ошибки
function showGeneralError(message) {
    // Создаем элемент для общей ошибки, если его еще нет
    let generalError = document.querySelector('.general-error');
    if (!generalError) {
        const form = document.getElementById('addTourForm');
        generalError = document.createElement('div');
        generalError.className = 'general-error';
        generalError.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1rem;
            display: none;
        `;
        form.insertBefore(generalError, form.firstChild);
    }

    generalError.textContent = message;
    generalError.style.display = 'block';

    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        if (generalError) {
            generalError.style.display = 'none';
        }
    }, 5000);
}

// Функция для скрытия всех ошибок
function hideAllErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.style.display = 'none';
    });

    const inputElements = document.querySelectorAll('.form-group input, .form-group textarea, .form-group select');
    inputElements.forEach(element => {
        element.classList.remove('error');
    });

    const generalError = document.querySelector('.general-error');
    if (generalError) {
        generalError.style.display = 'none';
    }
}

// Функция для отображения успешного сообщения
function showSuccessMessage(id) {
    const successMessage = document.getElementById('successMessage');
    successMessage.innerHTML = `Тур успешно добавлен в каталог! ID: ${id}`;
    successMessage.style.display = 'block';

    // Автоматически скрываем через 3 секунды
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

// Функция для преобразования формата даты из ДД.ММ.ГГГГ - ДД.ММ.ГГГГ в ДД.ММ.ГГГГ-ДД.ММ.ГГГГ
function formatPeriodForAPI(dateString) {
    // Удаляем лишние пробелы и заменяем " - " на "-"
    return dateString.trim().replace(/\s*-\s*/, '-');
}

// Функция для подготовки данных к отправке
function prepareData(formData) {
    // Преобразуем даты в формат, ожидаемый сервером
    const period = formatPeriodForAPI(formData.tourDates);

    return {
        Name: formData.tourName,
        Cost: parseInt(formData.tourPrice),
        Period: period,
        City: formData.tourCity,
        UserEmail: formData.tourEmail,
        Description: formData.tourDescription,
        Photo: formData.tourImage
    };
}

// Основная функция отправки данных на сервер
async function addTourToCatalog(tourData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(tourData)
        });

        const data = await response.json();

        if (!response.ok) {
            // Обработка ошибок от сервера
            if (response.status === 400) {
                if (data.errors) {
                    displayErrors(data.errors);
                } else if (data.error) {
                    displayErrors(data.error);
                } else {
                    displayErrors('Проверьте правильность заполнения всех полей');
                }
            } else if (response.status === 409) {
                displayErrors(data.error || 'Тур с таким названием уже существует на выбранные даты');
            } else if (response.status === 500) {
                displayErrors(data.error || 'Произошла ошибка на сервере. Пожалуйста, попробуйте позже.');
            } else {
                displayErrors(data.error || 'Произошла неизвестная ошибка');
            }

            return { success: false, data: data };
        }

        // Успешное добавление
        return { success: true, data: data };

    } catch (error) {
        console.error('Ошибка при отправке запроса:', error);
        displayErrors('Не удалось подключиться к серверу. Проверьте подключение к интернету и повторите попытку.');
        return { success: false, error: error.message };
    }
}

// Функция валидации формы на клиенте (дополнительная проверка перед отправкой)
function validateFormBeforeSubmit() {
    let isValid = true;

    // Проверка названия
    const tourName = document.getElementById('tourName').value.trim();
    if (!tourName || tourName.length < 2 || tourName.length > 100) {
        document.getElementById('tourNameError').textContent = 'Название должно содержать от 2 до 100 символов';
        document.getElementById('tourNameError').style.display = 'block';
        document.getElementById('tourName').classList.add('error');
        isValid = false;
    }

    // Проверка цены
    const tourPrice = document.getElementById('tourPrice').value.trim();
    const price = parseInt(tourPrice);
    if (isNaN(price) || price <= 10000 || price > 500000) {
        document.getElementById('tourPriceError').textContent = 'Цена должна быть положительным числом не более 500 000 рублей';
        document.getElementById('tourPriceError').style.display = 'block';
        document.getElementById('tourPrice').classList.add('error');
        isValid = false;
    }

    // Проверка дат
    const tourDates = document.getElementById('tourDates').value.trim();
    if (!tourDates) {
        document.getElementById('tourDatesError').textContent = 'Укажите даты тура';
        document.getElementById('tourDatesError').style.display = 'block';
        document.getElementById('tourDates').classList.add('error');
        isValid = false;
    }

    // Проверка города
    const tourCity = document.getElementById('tourCity').value;
    if (!tourCity) {
        document.getElementById('tourCityError').textContent = 'Выберите город';
        document.getElementById('tourCityError').style.display = 'block';
        document.getElementById('tourCity').classList.add('error');
        isValid = false;
    }

    // Проверка email
    const tourEmail = document.getElementById('tourEmail').value.trim();
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(tourEmail)) {
        document.getElementById('tourEmailError').textContent = 'Введите корректный email';
        document.getElementById('tourEmailError').style.display = 'block';
        document.getElementById('tourEmail').classList.add('error');
        isValid = false;
    }

    // Проверка описания
    const tourDescription = document.getElementById('tourDescription').value.trim();
    if (tourDescription.length > 1000) {
        document.getElementById('tourDescriptionError').textContent = 'Описание не может превышать 1000 символов';
        document.getElementById('tourDescriptionError').style.display = 'block';
        document.getElementById('tourDescription').classList.add('error');
        isValid = false;
    }

    // Проверка изображения
    const tourImage = document.getElementById('tourImage').value.trim();
    if (!tourImage) {
        document.getElementById('tourImageError').textContent = 'Укажите ссылку на изображение';
        document.getElementById('tourImageError').style.display = 'block';
        document.getElementById('tourImage').classList.add('error');
        isValid = false;
    } else if (!tourImage.startsWith('http://') && !tourImage.startsWith('https://')) {
        document.getElementById('tourImageError').textContent = 'Ссылка должна начинаться с http:// или https://';
        document.getElementById('tourImageError').style.display = 'block';
        document.getElementById('tourImage').classList.add('error');
        isValid = false;
    }

    return isValid;
}

// Обработчик отправки формы
async function handleFormSubmit(event) {
    event.preventDefault();

    // Скрываем все предыдущие ошибки и сообщения
    hideAllErrors();
    document.getElementById('successMessage').style.display = 'none';

    // Выполняем клиентскую валидацию
    if (!validateFormBeforeSubmit()) {
        return;
    }

    // Собираем данные формы
    const formData = {
        tourName: document.getElementById('tourName').value.trim(),
        tourPrice: document.getElementById('tourPrice').value.trim(),
        tourDates: document.getElementById('tourDates').value.trim(),
        tourCity: document.getElementById('tourCity').value,
        tourEmail: document.getElementById('tourEmail').value.trim(),
        tourDescription: document.getElementById('tourDescription').value.trim(),
        tourImage: document.getElementById('tourImage').value.trim()
    };

    // Подготавливаем данные для отправки
    const apiData = prepareData(formData);

    // Отключаем кнопку отправки
    const submitButton = document.querySelector('#addTourForm button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Отправка...';

    // Отправляем запрос на сервер
    const result = await addTourToCatalog(apiData);

    // Включаем кнопку обратно
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;

    if (result.success) {
        // Показываем сообщение об успехе
        showSuccessMessage(result.data.id);

        // Очищаем форму
        document.getElementById('addTourForm').reset();

        // Прокручиваем к верху страницы
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Опционально: перенаправление на страницу каталога через 2 секунды
        // setTimeout(() => {
        //     window.location.href = 'catalog.html';
        // }, 2000);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addTourForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Добавляем валидацию на изменение полей (убираем ошибки при вводе)
    const inputs = document.querySelectorAll('.form-group input, .form-group textarea, .form-group select');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const errorElement = input.closest('.form-group')?.querySelector('.error-message');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
            input.classList.remove('error');
        });
    });
});
