'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthForm() {
    const { login, register } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password) {
            setError('Please fill in all fields');
            return;
        }

        if (isRegister) {
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }
            if (password.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }
        }

        setSubmitting(true);
        try {
            if (isRegister) {
                await register(username.trim(), password);
            } else {
                await login(username.trim(), password);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Authentication failed');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleMode = () => {
        setIsRegister(!isRegister);
        setError('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <i className="fas fa-clock"></i>
                </div>
                <h2 className="auth-title">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
                <p className="auth-subtitle">
                    {isRegister ? 'Sign up to start tracking your tasks' : 'Sign in to continue tracking your tasks'}
                </p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter username"
                            autoComplete="username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="auth-field">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Enter password"
                            autoComplete={isRegister ? 'new-password' : 'current-password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {isRegister && (
                        <div className="auth-field">
                            <label className="form-label">Confirm Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Confirm password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <button type="submit" className="auth-submit" disabled={submitting}>
                        {submitting ? (isRegister ? 'Creating...' : 'Signing in...') : (isRegister ? 'Sign Up' : 'Sign In')}
                    </button>
                </form>

                <div className="auth-toggle">
                    <span>{isRegister ? 'Already have an account?' : "Don't have an account?"}</span>
                    <button className="auth-toggle-btn" onClick={toggleMode} type="button">
                        {isRegister ? 'Sign In' : 'Sign Up'}
                    </button>
                </div>
            </div>
        </div>
    );
}
