async function fetchProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const res = await fetch(`${API_URL}/users/me/profile`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
    }

    if (!res.ok) {
        document.getElementById('userPosts').innerHTML = '<p class="loading">Не удалось загрузить профиль</p>';
        return;
    }

    const data = await res.json();
    document.getElementById('profileName').textContent = data.username;
    document.getElementById('profileEmail').textContent = data.email;
    document.getElementById('postsCount').textContent = `${data.posts_count} постов`;

    const postsContainer = document.getElementById('userPosts');
    if (!data.posts || data.posts.length === 0) {
        postsContainer.innerHTML = '<p class="loading">У вас пока нет постов</p>';
        return;
    }

    postsContainer.innerHTML = data.posts.map(post => `
        <div class="post-card">
            <h2><a href="/post/${post.id}">${escapeHtml(post.title)}</a></h2>
            <div class="post-meta">
                <span>${new Date(post.created_at).toLocaleString('ru-RU')}</span>
            </div>
            <div class="post-content" style="margin-top: 0.75rem;">
                ${escapeHtml(post.content).slice(0, 250)}${post.content.length > 250 ? '…' : ''}
            </div>
            <div class="post-actions" style="margin-top: 0.5rem;">
                <a class="btn-edit" href="/edit-post/${post.id}">Редактировать</a>
                <button class="btn-delete" onclick="confirmDeletePost(${post.id})">Удалить</button>
            </div>
        </div>
    `).join('');
}

document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const username = document.getElementById('username').value.trim() || null;
    const email = document.getElementById('email').value.trim() || null;
    const password = document.getElementById('password').value.trim() || null;
    const errorDiv = document.getElementById('profileError');
    const successDiv = document.getElementById('profileSuccess');

    errorDiv.textContent = '';
    successDiv.textContent = '';

    if (!username && !email && !password) {
        errorDiv.textContent = 'Нечего обновлять — заполните хотя бы одно поле.';
        return;
    }

    const res = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, email, password })
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
        successDiv.textContent = 'Профиль обновлён';
        await fetchProfile();
        document.getElementById('password').value = '';
    } else if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    } else {
        errorDiv.textContent = data.detail || 'Не удалось обновить профиль';
    }
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', fetchProfile);

function confirmDeletePost(postId) {
    if (confirm('Удалить этот пост?')) {
        deletePost(postId);
    }
}

async function deletePost(postId) {
    const token = getToken();
    if (!token) {
        window.location.href = '/login';
        return;
    }
    try {
        const res = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (res.status === 401) {
            removeToken();
            window.location.href = '/login';
            return;
        }
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert(data.detail || 'Не удалось удалить пост');
            return;
        }
        await fetchProfile();
    } catch (e) {
        alert('Ошибка при удалении поста');
    }
}
