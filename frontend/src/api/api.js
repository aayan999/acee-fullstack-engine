const BASE_URL = `${import.meta.env.VITE_API_URL || ''}/api/v1`;

let isRefreshing = false;
let refreshPromise = null;

async function refreshToken() {
    if (isRefreshing) return refreshPromise;
    isRefreshing = true;

    refreshPromise = (async () => {
        try {
            const rt = sessionStorage.getItem('acee_refresh_token');
            const res = await fetch(`${BASE_URL}/users/refresh-token`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: rt }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error('Refresh failed');

            const newAccess = data.data?.accessToken;
            const newRefresh = data.data?.newRefreshToken || data.data?.refreshToken;
            if (newAccess) sessionStorage.setItem('acee_token', newAccess);
            if (newRefresh) sessionStorage.setItem('acee_refresh_token', newRefresh);
            return true;
        } catch {
            // Refresh failed — clear session and redirect to login
            sessionStorage.removeItem('acee_user');
            sessionStorage.removeItem('acee_token');
            sessionStorage.removeItem('acee_refresh_token');
            window.location.href = '/login';
            return false;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

async function request(path, options = {}, _isRetry = false) {
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

    // On 401, try refreshing the token once then retry
    if (res.status === 401 && !_isRetry && !path.includes('/users/login')) {
        const ok = await refreshToken();
        if (ok) return request(path, options, true);
    }

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
    resetRun: () => request('/reset-run', { method: 'POST' }),
    getEvolvedFiles: (runId) => request(`/runs/${runId}/files`, { method: 'GET' }),
};
