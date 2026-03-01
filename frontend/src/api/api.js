const BASE_URL = `${import.meta.env.VITE_API_URL || ''}/api/v1`;

async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    try {
        const token = sessionStorage.getItem('acee_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    } catch (_) { }

    const res = await fetch(`${BASE_URL}${path}`, {
        credentials: 'include',
        headers,
        ...options,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data?.message || `Request failed (${res.status})`);
    }
    return data;
}

export const api = {
    register: (body) => request('/users/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/users/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => request('/users/logout', { method: 'POST' }),
    dashboard: () => request('/dashboard', { method: 'GET' }),
    getStatus: () => request('/status', { method: 'GET' }),
    evolve: (repoUrl) => request('/evolve', { method: 'POST', body: JSON.stringify({ repoUrl }) }),
};
