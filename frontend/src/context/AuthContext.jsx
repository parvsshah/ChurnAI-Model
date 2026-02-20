import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '@/services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('churnai_token'));
    const [loading, setLoading] = useState(true);

    // On mount, verify token
    useEffect(() => {
        if (token) {
            fetchMe(token).then((userData) => {
                if (userData) {
                    setUser(userData);
                } else {
                    localStorage.removeItem('churnai_token');
                    setToken(null);
                }
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, []);

    async function fetchMe(t) {
        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${t}` },
            });
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    }

    async function login(email, password) {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Login failed' }));
            throw new Error(err.detail || 'Login failed');
        }
        const data = await res.json();
        localStorage.setItem('churnai_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    }

    async function register(username, email, password, name, category) {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, name, category: category || null }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
            throw new Error(err.detail || 'Registration failed');
        }
        const data = await res.json();
        localStorage.setItem('churnai_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    }

    function logout() {
        localStorage.removeItem('churnai_token');
        setToken(null);
        setUser(null);
    }

    async function refreshUser() {
        if (token) {
            const userData = await fetchMe(token);
            if (userData) setUser(userData);
        }
    }

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
