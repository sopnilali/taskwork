'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

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
                <a href="mailto:sopnilali@example.com" className="header-contact-btn" title="Contact">
                    <i className="fas fa-envelope"></i>
                    <span>Contact</span>
                </a>
                {user?.is_admin && (
                    <Link href="/admin" className="header-btn" title="Admin Panel" style={{ textDecoration: 'none' }}>
                        <i className="fas fa-shield-halved"></i>
                    </Link>
                )}
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
