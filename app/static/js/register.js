document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    if (!form) {
        console.error('Форма регистрации не найдена');
        return;
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Отправка формы регистрации...');
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        
        console.log('Данные для отправки:', { username, email, password: '***' });
        
        errorDiv.classList.remove('show');
        successDiv.classList.remove('show');
        errorDiv.textContent = '';
        successDiv.textContent = '';
        
        try {
            const requestData = { username, email, password };
            console.log('Отправка запроса на:', `${API_URL}/users/register`);
            
            const response = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            console.log('Статус ответа:', response.status);
            
            const data = await response.json();
            console.log('Ответ сервера:', data);
            
            if (response.ok) {
                successDiv.textContent = 'Регистрация успешна! Перенаправление на страницу входа...';
                successDiv.classList.add('show');
                
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                // Обработка ошибок валидации
                if (data.detail) {
                    if (Array.isArray(data.detail)) {
                        // Обработка ошибок FastAPI валидации
                        const errors = data.detail.map(err => {
                            const field = err.loc ? err.loc[err.loc.length - 1] : '';
                            return `${field}: ${err.msg}`;
                        }).join('; ');
                        errorDiv.textContent = errors;
                    } else {
                        errorDiv.textContent = data.detail;
                    }
                } else {
                    errorDiv.textContent = 'Ошибка регистрации';
                }
                errorDiv.classList.add('show');
            }
        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            errorDiv.textContent = 'Ошибка подключения к серверу';
            errorDiv.classList.add('show');
        }
    });
});
