// Get post ID from URL
const postId = window.location.pathname.split('/').pop();

// Load post data
async function loadPost() {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`);
        if (!response.ok) {
            throw new Error('Пост не найден');
        }
        
        const post = await response.json();
        
        // Check if user is the author
        const token = localStorage.getItem('token');
        if (!token) {
            showError('Необходимо авторизоваться');
            setTimeout(() => window.location.href = '/login', 2000);
            return;
        }
        
        const userResponse = await fetch(`${API_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!userResponse.ok) {
            showError('Необходимо авторизоваться');
            setTimeout(() => window.location.href = '/login', 2000);
            return;
        }
        
        const currentUser = await userResponse.json();
        if (currentUser.id !== post.author_id) {
            showError('У вас нет прав для редактирования этого поста');
            setTimeout(() => window.location.href = '/', 2000);
            return;
        }
        
        // Fill form with post data
        document.getElementById('title').value = post.title;
        document.getElementById('content').value = post.content;
        
    } catch (error) {
        console.error('Error loading post:', error);
        showError('Ошибка загрузки поста: ' + error.message);
        setTimeout(() => window.location.href = '/', 2000);
    }
}

// Update post
async function updatePost(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        showError('Необходимо авторизоваться');
        return;
    }
    
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    
    if (!title || !content) {
        showError('Заполните все поля');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, content })
        });
        
        if (response.ok) {
            alert('Пост успешно обновлен!');
            window.location.href = `/post/${postId}`;
        } else {
            const error = await response.json();
            showError(error.detail || 'Ошибка при обновлении поста');
        }
    } catch (error) {
        console.error('Error updating post:', error);
        showError('Ошибка при обновлении поста');
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPost();
});
