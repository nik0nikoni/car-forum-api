// Token helpers
function getToken() {
    return localStorage.getItem('token');
}

function saveToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
}

function isAuthenticated() {
    return !!getToken();
}

function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

function logout() {
    removeToken();
    window.location.href = '/';
}

async function setUserDisplayName() {
    const el = document.getElementById('userDisplayName');
    if (!el || !isAuthenticated()) return;
    try {
        const res = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        el.textContent = data.username || 'Профиль';
    } catch (e) {
        // ignore
    }
}

function updateNavigation() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');

    if (isAuthenticated()) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        setUserDisplayName();
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', updateNavigation);
