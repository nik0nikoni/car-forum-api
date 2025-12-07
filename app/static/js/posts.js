let currentPage = 0;
const limit = 10;
let searchQuery = '';
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
    } catch (error) {
        console.error('Error getting current user:', error);
    }
    return null;
}

// Load posts with optional search
async function loadPosts() {
    const container = document.getElementById('postsContainer');
    container.innerHTML = '<p class="loading">Загрузка постов...</p>';
    
    try {
        let url = `${API_URL}/posts/?skip=${currentPage * limit}&limit=${limit}`;
        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        
        const response = await fetch(url);
        const posts = await response.json();
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="no-posts">
                    <p>${searchQuery ? 'Ничего не найдено' : 'Постов пока нет'}</p>
                    ${!searchQuery && localStorage.getItem('token') ? '<a href="/create-post" class="btn-primary">Создать первый пост</a>' : ''}
                </div>
            `;
            updatePagination(0);
            return;
        }
        
        container.innerHTML = posts.map(post => createPostCard(post)).join('');
        updatePagination(posts.length);
        
    } catch (error) {
        console.error('Error loading posts:', error);
        container.innerHTML = '<p class="loading">Ошибка загрузки постов</p>';
    }
}

// Create post card HTML
function createPostCard(post) {
    const isOwner = currentUser && currentUser.id === post.author_id;
    const excerpt = post.content.length > 300 ? post.content.substring(0, 300) + '...' : post.content;
    
    return `
        <div class="post-card">
            <h2><a href="/post/${post.id}">${escapeHtml(post.title)}</a></h2>
            <div class="post-meta">
                👤 ${escapeHtml(post.author.username)} | 
                📅 ${new Date(post.created_at).toLocaleString('ru-RU')}
            </div>
            <div class="post-content">
                ${escapeHtml(excerpt).replace(/\n/g, '<br>')}
            </div>
            ${isOwner ? `
                <div class="post-actions">
                    <button class="btn-edit" onclick="editPost(${post.id})">✏️ Редактировать</button>
                    <button class="btn-delete" onclick="confirmDeletePost(${post.id})">🗑️ Удалить</button>
                </div>
            ` : ''}
        </div>
    `;
}

// Update pagination
function updatePagination(postsCount) {
    const pagination = document.getElementById('pagination');
    const hasMore = postsCount === limit;
    
    pagination.innerHTML = `
        <button onclick="prevPage()" ${currentPage === 0 ? 'disabled' : ''}>
            ← Предыдущая
        </button>
        <span>Страница ${currentPage + 1}</span>
        <button onclick="nextPage()" ${!hasMore ? 'disabled' : ''}>
            Следующая →
        </button>
    `;
}

// Pagination functions
function prevPage() {
    if (currentPage > 0) {
        currentPage--;
        loadPosts();
    }
}

function nextPage() {
    currentPage++;
    loadPosts();
}

// Search functions
function searchPosts() {
    const input = document.getElementById('searchInput');
    searchQuery = input.value.trim();
    currentPage = 0;
    loadPosts();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    searchQuery = '';
    currentPage = 0;
    loadPosts();
}

// Allow search on Enter key
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchPosts();
            }
        });
    }
});

// Edit post
function editPost(postId) {
    window.location.href = `/edit-post/${postId}`;
}

// Delete post confirmation
function confirmDeletePost(postId) {
    if (confirm('Вы уверены, что хотите удалить этот пост?')) {
        deletePost(postId);
    }
}

// Delete post
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
            loadPosts();
        } else {
            const error = await response.json();
            alert('Ошибка удаления: ' + (error.detail || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Ошибка удаления поста');
    }
}

// Utility function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await getCurrentUser();
    loadPosts();
});
