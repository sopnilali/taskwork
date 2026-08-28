'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="header">
            <div className="header-left">
                <div className="header-logo">
                    <i className="fas fa-clock"></i>
                </div>
                <span className="header-title">TaskTimer</span>
                <span className="header-badge">Free Online Task Timer</span>
            </div>
            <div className="header-right">
                {user && (
                    <>
                        <span className="header-username">{user.username}</span>
                        <button className="header-btn" title="Logout" onClick={logout}>
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </>
                )}
                <button className="header-btn" title="Settings">
                    <i className="fas fa-cog"></i>
                </button>
            </div>
        </header>
    );
}
