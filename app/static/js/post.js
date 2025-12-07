const postId = window.location.pathname.split('/').pop();
let currentUser = null;

// Get current user info
async function getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            return await response.json();
        }

        if (response.status === 401 && typeof removeToken === 'function') {
            removeToken();
        }
    } catch (error) {
        console.error('Error getting current user:', error);
    }
    return null;
}

async function loadPost() {
    const container = document.getElementById('postContainer');
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`);
        
        if (!response.ok) {
            container.innerHTML = '<div class="no-posts"><p>Пост не найден</p><a href="/" class="btn-primary">Вернуться на главную</a></div>';
            return;
        }
        
        const post = await response.json();
        const isOwner = currentUser && currentUser.id === post.author_id;
        
        // Count comments
        const commentsCount = post.comments ? post.comments.length : 0;
        
        container.innerHTML = `
            <div class="post-card">
                <h1>${escapeHtml(post.title)}</h1>
                <div class="post-meta">
                    <span>👤 ${escapeHtml(post.author.username)}</span>
                    <span>📅 ${new Date(post.created_at).toLocaleString('ru-RU')}</span>
                </div>
                <div class="post-content" style="white-space: pre-wrap; margin-top: 1.5rem;">
                    ${escapeHtml(post.content)}
                </div>
                <div class="post-stats">
                    <span>💬 ${commentsCount} комментариев</span>
                </div>
                ${isOwner ? `
                    <div class="post-actions" style="margin-top: 1.5rem;">
                        <button class="btn-edit" onclick="editPost(${post.id})">✏️ Редактировать</button>
                        <button class="btn-delete" onclick="confirmDeletePost(${post.id})">🗑️ Удалить</button>
                    </div>
                ` : ''}
            </div>
        `;
        
        loadComments();
        
    } catch (error) {
        console.error('Error loading post:', error);
        container.innerHTML = '<div class="no-posts"><p>Ошибка загрузки поста</p></div>';
    }
}

async function loadComments() {
    const container = document.getElementById('commentsContainer');
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments`);
        const comments = await response.json();
        
        if (comments.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">Комментариев пока нет. Станьте первым!</p>';
            return;
        }
        
        container.innerHTML = comments.map(comment => createCommentCard(comment)).join('');
        
    } catch (error) {
        console.error('Error loading comments:', error);
        container.innerHTML = '<p class="loading">Ошибка загрузки комментариев</p>';
    }
}

function createCommentCard(comment) {
    const isOwner = currentUser && currentUser.id === comment.author_id;
    const createdDate = new Date(comment.created_at);
    const now = new Date();
    const diffMinutes = Math.floor((now - createdDate) / 60000);
    
    let timeAgo;
    if (diffMinutes < 1) {
        timeAgo = 'только что';
    } else if (diffMinutes < 60) {
        timeAgo = `${diffMinutes} мин. назад`;
    } else if (diffMinutes < 1440) {
        const hours = Math.floor(diffMinutes / 60);
        timeAgo = `${hours} ч. назад`;
    } else {
        timeAgo = createdDate.toLocaleString('ru-RU');
    }
    
    return `
        <div class="comment-card">
            <div class="comment-meta">
                <div>
                    <span class="comment-author">${escapeHtml(comment.author.username)}</span>
                    <span class="comment-date">• ${timeAgo}</span>
                </div>
                ${isOwner ? `
                    <button class="btn-delete" onclick="confirmDeleteComment(${comment.id})" style="font-size: 0.85rem; padding: 0.3rem 0.6rem;">
                        🗑️ Удалить
                    </button>
                ` : ''}
            </div>
            <div class="comment-content">
                ${escapeHtml(comment.content)}
            </div>
        </div>
    `;
}

// Add comment
document.getElementById('addCommentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const content = document.getElementById('commentContent').value.trim();
    
    if (!content) {
        alert('Комментарий не может быть пустым');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ content })
        });
        
        if (response.ok) {
            document.getElementById('commentContent').value = '';
            loadComments();
            return;
        }

        const error = await response.json();
        if (response.status === 401 && typeof removeToken === 'function') {
            removeToken();
            currentUser = null;
            toggleCommentInterface();
        }
        alert('Не удалось отправить комментарий: ' + (error.detail || 'Неизвестная ошибка'));
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Ошибка подключения к серверу');
    }
});

// Delete comment
function confirmDeleteComment(commentId) {
    if (confirm('Вы уверены, что хотите удалить этот комментарий?')) {
        deleteComment(commentId);
    }
}

async function deleteComment(commentId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Необходимо авторизоваться');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            loadComments();
        } else {
            const error = await response.json();
            alert('Ошибка удаления: ' + (error.detail || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Ошибка удаления комментария');
    }
}

// Edit post
function editPost(postId) {
    window.location.href = `/edit-post/${postId}`;
}

// Delete post
function confirmDeletePost(postId) {
    if (confirm('Вы уверены, что хотите удалить этот пост? Все комментарии также будут удалены.')) {
        deletePost(postId);
    }
}

async function deletePost(postId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Необходимо авторизоваться');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Пост успешно удален');
            window.location.href = '/';
        } else {
            const error = await response.json();
            alert('Ошибка удаления: ' + (error.detail || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Ошибка удаления поста');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
function toggleCommentInterface() {
    const formWrapper = document.getElementById('commentForm');
    const loginPrompt = document.getElementById('loginPrompt');
    if (!formWrapper || !loginPrompt) return;

    if (currentUser) {
        formWrapper.style.display = 'block';
        loginPrompt.style.display = 'none';
    } else {
        formWrapper.style.display = 'none';
        loginPrompt.style.display = 'block';
    }
}

async function initPostPage() {
    currentUser = await getCurrentUser();
    toggleCommentInterface();
    await loadPost();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPostPage);
} else {
    initPostPage();
}
