'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import SettingsModal from './SettingsModal';

export default function Header() {
    const { user, logout, authFetch } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [showSettings, setShowSettings] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [search, setSearch] = useState('');
    const [todayStats, setTodayStats] = useState<{ count: number; total: number } | null>(null);
    const [recentTasks, setRecentTasks] = useState<{ id: number; task_name: string; work_date: string; total_duration: number }[]>([]);
    const notifRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);
    const isAuthPage = pathname?.startsWith('/auth');
    const isAdminPage = pathname?.startsWith('/admin');
    const isDashboardPage = pathname?.startsWith('/dashboard');

    if (isAuthPage) return null;

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const [statsRes, tasksRes] = await Promise.all([
                    authFetch('/api/stats/today'),
                    authFetch('/api/tasks?filter=today'),
                ]);
                const stats = await statsRes.json();
                const tasks = await tasksRes.json();
                if (stats.today) setTodayStats({ count: stats.today.count || 0, total: stats.today.totalDuration || 0 });
                if (Array.isArray(tasks)) setRecentTasks(tasks.slice(0, 5));
            } catch {}
        };
        load();
        const id = setInterval(load, 15000);
        return () => clearInterval(id);
    }, [user, authFetch, pathname]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
            if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
            window.dispatchEvent(new CustomEvent('task-search', { detail: search }));
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const hoursLabel = todayStats ? `${Math.floor(todayStats.total / 3600)}h ${Math.floor((todayStats.total % 3600) / 60)}m` : '';

    return (
        <header className="header">
            <div className="header-left">
                <Link href={user ? "/dashboard" : "/"} className="header-brand">
                    <div className="header-logo">
                        <img src="/tasktimer-logo.svg" alt="TaskTimer" width={40} height={40} />
                    </div>
                    <div className="header-brand-text">
                        <span className="header-title">TaskTimer</span>
                    </div>
                </Link>
                {user && (isDashboardPage || isAdminPage) && (
                    <div className="header-toggle">
                        <button
                            className={`header-toggle-btn ${isDashboardPage ? 'active' : ''}`}
                            onClick={() => router.push('/dashboard')}
                        >
                            <i className="fas fa-table-columns"></i> Dashboard
                        </button>
                        {user.is_admin && (
                            <button
                                className={`header-toggle-btn ${isAdminPage ? 'active' : ''}`}
                                onClick={() => router.push('/admin')}
                            >
                                <i className="fas fa-shield-halved"></i> Admin
                            </button>
                        )}
                    </div>
                )}
            </div>
            <div className="header-center">
                {user && (isDashboardPage || pathname?.startsWith('/task-list')) && (
                    <div className="header-search">
                        <i className="fas fa-search"></i>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." />
                        {search && <button onClick={() => setSearch('')}><i className="fas fa-times"></i></button>}
                    </div>
                )}
            </div>
            <div className="header-right">
                {user && (
                    <>
                        <div className="header-date-chip">
                            <i className="fas fa-calendar-day"></i> {todayLabel}
                            {todayStats && <span>{todayStats.count} · {hoursLabel}</span>}
                        </div>

                        <div className="header-notif-wrap" ref={notifRef}>
                            <button className="header-btn header-notif-btn" title="Notifications" onClick={() => setShowNotifications(v => !v)}>
                                <i className="fas fa-bell"></i>
                                {recentTasks.length > 0 && <span className="header-notif-badge">{recentTasks.length}</span>}
                            </button>
                            {showNotifications && (
                                <div className="header-dropdown">
                                    <div className="header-dropdown-head">
                                        <strong>Recent Tasks</strong> <span>{todayLabel}</span>
                                    </div>
                                    {recentTasks.length === 0 ? (
                                        <div className="header-dropdown-empty">No tasks today</div>
                                    ) : recentTasks.map(t => (
                                        <div key={t.id} className="header-dropdown-item">
                                            <div className="header-dropdown-title">{t.task_name}</div>
                                            <div className="header-dropdown-meta">{t.work_date?.slice(0, 10)} · {Math.floor(t.total_duration / 60)}m</div>
                                        </div>
                                    ))}
                                    <button className="header-dropdown-foot" onClick={() => { setShowNotifications(false); router.push('/dashboard'); }}>View all →</button>
                                </div>
                            )}
                        </div>

                        <div className="header-user-wrap" ref={userRef}>
                            <button className="header-user-btn" onClick={() => setShowUserMenu(v => !v)}>
                                <div className="header-user-avatar">{user.username[0]?.toUpperCase()}</div>
                                <span className="header-username">{user.username}</span>
                                <i className="fas fa-chevron-down" style={{ fontSize: 10 }}></i>
                            </button>
                            {showUserMenu && (
                                <div className="header-dropdown header-user-dropdown">
                                    <div className="header-dropdown-user">
                                        <div className="header-user-avatar large">{user.username[0]?.toUpperCase()}</div>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{user.username}</div>
                                            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{user.is_admin ? 'Admin' : 'User'}</div>
                                        </div>
                                    </div>
                                    <button className="header-dropdown-item" onClick={() => { setShowUserMenu(false); setShowSettings(true); }}><i className="fas fa-cog"></i> Settings</button>
                                    <button className="header-dropdown-item" onClick={() => { setShowUserMenu(false); logout(); }}><i className="fas fa-sign-out-alt"></i> Logout</button>
                                </div>
                            )}
                        </div>
                    </>
                )}
                {!user && !isDashboardPage && (
                    <button className="header-btn" title="Settings" onClick={() => setShowSettings(true)}>
                        <i className="fas fa-cog"></i>
                    </button>
                )}
            </div>
            <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
        </header>
    );
}
