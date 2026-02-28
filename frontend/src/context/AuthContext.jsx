import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const stored = sessionStorage.getItem('acee_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const login = useCallback(async ({ email, password }) => {
        const data = await api.login({ email, password });
        const userData = data.data?.user ?? data.data ?? null;
        setUser(userData);
        sessionStorage.setItem('acee_user', JSON.stringify(userData));
        return data;
    }, []);

    const register = useCallback(async ({ username, email, password }) => {
        return await api.register({ username, email, password });
    }, []);

    const logout = useCallback(async () => {
        try { await api.logout(); } catch (_) { /* ignore */ }
        setUser(null);
        sessionStorage.removeItem('acee_user');
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
