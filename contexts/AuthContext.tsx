'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const TOKEN_KEY = 'tasktimer_token';

interface User {
    id: number;
    username: string;
    is_admin: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string) => Promise<void>;
    logout: () => void;
    authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const getToken = useCallback(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(TOKEN_KEY);
    }, []);

    const saveToken = useCallback((t: string | null) => {
        if (t) {
            localStorage.setItem(TOKEN_KEY, t);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
        setToken(t);
    }, []);

    const authFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
        const t = token || getToken();
        const headers: Record<string, string> = {
            ...((options.headers as Record<string, string>) || {}),
        };
        if (t) {
            headers['Authorization'] = `Bearer ${t}`;
        }
        const res = await fetch(url, { ...options, headers });
        if (res.status === 401) {
            saveToken(null);
            setUser(null);
            throw new Error('Session expired');
        }
        return res;
    }, [token, getToken, saveToken]);

    useEffect(() => {
        const t = getToken();
        if (!t) {
            setLoading(false);
            return;
        }
        setToken(t);
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } })
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(data => setUser(data.user))
            .catch(() => {
                saveToken(null);
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, [getToken, saveToken]);

    const login = async (username: string, password: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        saveToken(data.token);
        setUser(data.user);
    };

    const register = async (username: string, password: string) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        saveToken(data.token);
        setUser(data.user);
    };

    const logout = () => {
        saveToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
