// Проверка авторизации
if (!isAuthenticated()) {
    window.location.href = '/login';
}

document.getElementById('createPostForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const errorDiv = document.getElementById('errorMessage');
    
    errorDiv.classList.remove('show');
    errorDiv.textContent = '';
    
    try {
        const response = await fetch(`${API_URL}/posts/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title, content })
        });
        
        if (response.ok) {
            const post = await response.json();
            window.location.href = `/post/${post.id}`;
        } else {
            const data = await response.json();
            errorDiv.textContent = data.detail || 'Ошибка создания поста';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Ошибка подключения к серверу';
        errorDiv.classList.add('show');
    }
});
