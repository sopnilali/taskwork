'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';

interface AdminUser {
    id: number;
    username: string;
    is_admin: boolean;
    created_at: string;
    task_count: number;
    total_seconds: number;
    total_earnings: number;
}

interface AdminTask {
    id: number;
    user_id: number;
    username: string;
    task_name: string;
    category: string;
    status: string;
    started_at: string;
    ended_at: string;
    total_duration: number;
    hourly_rate: number;
    created_at: string;
}

interface ActivityLog {
    id: number;
    task_id: number;
    task_name: string;
    category: string;
    hourly_rate: number;
    username: string;
    activity_type: string;
    activity_time: string;
    duration: number;
}

interface GlobalStats {
    totalUsers: number;
    totalTasks: number;
    filtered: { count: number; seconds: number; earnings: number };
    today: { count: number; seconds: number; earnings: number };
    week: { count: number; seconds: number; earnings: number };
    allTime: { count: number; seconds: number; earnings: number };
}

interface PayoutAdmin {
    id: number;
    user_id: number;
    username: string;
    amount: number;
    method: string;
    account: string;
    status: string;
    note: string;
    created_at: string;
}

function fmtDur(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
}

function fmtDurFull(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
}

function fmtDate(d: string) {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-BD', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(d: string) {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleString('en-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function exportCSV(tasks: AdminTask[]) {
    const headers = ['ID', 'User', 'Task', 'Category', 'Status', 'Duration', 'Rate', 'Earnings', 'Date'];
    const rows = tasks.map(t => [
        t.id, t.username, t.task_name, t.category, t.status,
        fmtDurFull(t.total_duration), `৳${t.hourly_rate}`, `৳${Math.round(t.total_duration * t.hourly_rate / 3600)}`,
        fmtDate(t.created_at),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function AdminPage() {
    const { user, loading, authFetch } = useAuth();
    const router = useRouter();
    const [tab, setTab] = useState<'stats' | 'users' | 'tasks' | 'activity' | 'payouts'>('stats');

    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [statsRange, setStatsRange] = useState('all');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [tasks, setTasks] = useState<AdminTask[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [payouts, setPayouts] = useState<PayoutAdmin[]>([]);

    const [showCreateUser, setShowCreateUser] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newIsAdmin, setNewIsAdmin] = useState(false);
    const [createError, setCreateError] = useState('');

    const [editUser, setEditUser] = useState<AdminUser | null>(null);
    const [editUsername, setEditUsername] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editIsAdmin, setEditIsAdmin] = useState(false);

    const [viewUser, setViewUser] = useState<AdminUser | null>(null);
    const [viewUserTasks, setViewUserTasks] = useState<AdminTask[]>([]);

    const [taskFilter, setTaskFilter] = useState('all');
    const [taskUserFilter, setTaskUserFilter] = useState('');
    const [activityUserFilter, setActivityUserFilter] = useState('');
    const [confirmAction, setConfirmAction] = useState<{ type: string; id?: number; label: string; onConfirm: () => void } | null>(null);
    const [toast, setToast] = useState('');

    useEffect(() => {
        if (!loading && !user) router.replace('/auth');
        if (!loading && user && !user.is_admin) router.replace('/dashboard');
    }, [user, loading, router]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const loadStats = useCallback(async () => {
        try {
            const res = await authFetch(`/api/admin/stats?range=${statsRange}`);
            setStats(await res.json());
        } catch {}
    }, [authFetch, statsRange]);

    const loadUsers = useCallback(async () => {
        try { const res = await authFetch('/api/admin/users'); const d = await res.json(); setUsers(d.users || []); } catch {}
    }, [authFetch]);

    const loadTasks = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            params.set('filter', taskFilter);
            if (taskUserFilter) params.set('user_id', taskUserFilter);
            const res = await authFetch(`/api/admin/tasks?${params}`);
            const d = await res.json();
            setTasks(d.tasks || []);
        } catch {}
    }, [authFetch, taskFilter, taskUserFilter]);

    const loadActivity = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (activityUserFilter) params.set('user_id', activityUserFilter);
            params.set('limit', '200');
            const res = await authFetch(`/api/admin/activity?${params}`);
            const d = await res.json();
            setActivityLogs(d.logs || []);
        } catch {}
    }, [authFetch, activityUserFilter]);

    const loadPayouts = useCallback(async () => {
        try { const res = await authFetch('/api/admin/payouts'); const d = await res.json(); setPayouts(d.payouts || []); } catch {}
    }, [authFetch]);

    useEffect(() => {
        if (!loading && user?.is_admin) {
            if (tab === 'stats') loadStats();
            if (tab === 'users') loadUsers();
            if (tab === 'tasks') loadTasks();
            if (tab === 'activity') loadActivity();
            if (tab === 'payouts') loadPayouts();
        }
    }, [tab, loading, user, loadStats, loadUsers, loadTasks, loadActivity, loadPayouts]);

    const handleCreateUser = async () => {
        setCreateError('');
        try {
            const res = await authFetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername, password: newPassword, is_admin: newIsAdmin }),
            });
            const data = await res.json();
            if (!res.ok) { setCreateError(data.error); return; }
            setNewUsername(''); setNewPassword(''); setNewIsAdmin(false);
            setShowCreateUser(false);
            loadUsers();
            showToast('User created successfully');
        } catch { setCreateError('Failed to create user'); }
    };

    const handleUpdateUser = async () => {
        if (!editUser) return;
        try {
            const body: Record<string, unknown> = { username: editUsername, is_admin: editIsAdmin };
            if (editPassword) body.password = editPassword;
            const res = await authFetch(`/api/admin/users/${editUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) { setEditUser(null); loadUsers(); showToast('User updated'); }
        } catch {}
    };

    const handleDeleteUser = async (userId: number) => {
        try {
            await authFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            loadUsers();
            showToast('User deleted');
        } catch {}
    };

    const handleDeleteTask = async (taskId: number) => {
        try {
            await authFetch(`/api/admin/tasks/${taskId}`, { method: 'DELETE' });
            loadTasks();
            showToast('Task deleted');
        } catch {}
    };

    const handleClearUserTasks = async (userId: number) => {
        try {
            await authFetch(`/api/admin/users/${userId}/tasks`, { method: 'DELETE' });
            loadUsers();
            setViewUser(null);
            showToast('All tasks cleared for user');
        } catch {}
    };

    const handlePayoutStatus = async (id: number, status: string) => {
        try {
            await authFetch(`/api/admin/payouts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
            loadPayouts();
            showToast(`Payout ${status}`);
        } catch {}
    };

    const handleViewUser = async (u: AdminUser) => {
        setViewUser(u);
        try {
            const res = await authFetch(`/api/admin/tasks?user_id=${u.id}`);
            const d = await res.json();
            setViewUserTasks(d.tasks || []);
        } catch {}
    };

    if (loading || !user || !user.is_admin) return null;

    return (
        <>
            <Header />
            <div className="main-container">
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                                <i className="fas fa-shield-halved" style={{ marginRight: 8, color: 'var(--primary)' }}></i>
                                Admin Panel
                            </h2>
                            {tab === 'tasks' && tasks.length > 0 && (
                                <button className="btn-activity btn-clear" onClick={() => exportCSV(tasks)}>
                                    <i className="fas fa-download"></i> Export CSV
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                            {(['stats', 'users', 'tasks', 'activity', 'payouts'] as const).map(t => (
                                <button key={t} className={`btn-activity ${tab === t ? '' : 'btn-clear'}`}
                                    style={tab === t ? { background: 'var(--primary)', color: '#fff' } : {}}
                                    onClick={() => setTab(t)}>
                                    {t === 'stats' && <><i className="fas fa-chart-bar"></i> Stats</>}
                                    {t === 'users' && <><i className="fas fa-users"></i> Users</>}
                                    {t === 'tasks' && <><i className="fas fa-list-check"></i> Tasks</>}
                                    {t === 'activity' && <><i className="fas fa-clock-rotate-left"></i> Activity</>}
                                    {t === 'payouts' && <><i className="fas fa-money-bill-wave"></i> Payouts</>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {tab === 'stats' && stats && (
                    <>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            {[
                                { value: 'today', label: 'Today' },
                                { value: 'week', label: 'This Week' },
                                { value: 'month', label: 'This Month' },
                                { value: 'all', label: 'All Time' },
                            ].map(opt => (
                                <button key={opt.value}
                                    className="btn-activity"
                                    style={statsRange === opt.value
                                        ? { background: 'var(--primary)', color: '#fff', padding: '6px 16px', fontSize: 13 }
                                        : { padding: '6px 16px', fontSize: 13 }}
                                    onClick={() => setStatsRange(opt.value)}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                            <div className="summary-card">
                                <div className="summary-icon tasks"><i className="fas fa-users"></i></div>
                                <div className="summary-label">Total Users</div>
                                <div className="summary-value">{stats.totalUsers}</div>
                            </div>
                            <div className="summary-card">
                                <div className="summary-icon time"><i className="fas fa-list-check"></i></div>
                                <div className="summary-label">Total Tasks</div>
                                <div className="summary-value">{stats.totalTasks}</div>
                            </div>
                            <div className="summary-card">
                                <div className="summary-icon session"><i className="fas fa-clock"></i></div>
                                <div className="summary-label">
                                    {statsRange === 'today' ? "Today" : statsRange === 'week' ? "This Week" : statsRange === 'month' ? "This Month" : "All Time"} — Tasks & Hours
                                </div>
                                <div className="summary-value">{stats.filtered.count} tasks</div>
                                <div className="summary-label" style={{ marginTop: 4 }}>{fmtDur(stats.filtered.seconds)}</div>
                            </div>
                            <div className="summary-card">
                                <div className="summary-icon earnings"><i className="fas fa-bangladeshi-taka-sign"></i></div>
                                <div className="summary-label">
                                    {statsRange === 'today' ? "Today" : statsRange === 'week' ? "This Week" : statsRange === 'month' ? "This Month" : "All Time"} — Earnings
                                </div>
                                <div className="summary-value">৳{stats.filtered.earnings}</div>
                                <div className="summary-label" style={{ marginTop: 4 }}>{fmtDur(stats.filtered.seconds)}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
                            <div className="summary-card">
                                <div className="summary-icon session"><i className="fas fa-calendar-day"></i></div>
                                <div className="summary-label">Today</div>
                                <div className="summary-value">{stats.today.count} tasks</div>
                                <div className="summary-label" style={{ marginTop: 4 }}>{fmtDur(stats.today.seconds)} / ৳{stats.today.earnings}</div>
                            </div>
                            <div className="summary-card">
                                <div className="summary-icon time"><i className="fas fa-calendar-week"></i></div>
                                <div className="summary-label">This Week</div>
                                <div className="summary-value">{stats.week.count} tasks</div>
                                <div className="summary-label" style={{ marginTop: 4 }}>{fmtDur(stats.week.seconds)} / ৳{stats.week.earnings}</div>
                            </div>
                            <div className="summary-card">
                                <div className="summary-icon earnings"><i className="fas fa-chart-line"></i></div>
                                <div className="summary-label">All Time</div>
                                <div className="summary-value">৳{stats.allTime.earnings}</div>
                                <div className="summary-label" style={{ marginTop: 4 }}>{stats.allTime.count} tasks / {fmtDur(stats.allTime.seconds)}</div>
                            </div>
                        </div>
                    </>
                )}

                {tab === 'users' && (
                    <div className="card">
                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>All Users ({users.length})</h3>
                                <button className="btn-activity" style={{ background: 'var(--success)', color: '#fff' }}
                                    onClick={() => setShowCreateUser(true)}>
                                    <i className="fas fa-plus"></i> New User
                                </button>
                            </div>

                            {showCreateUser && (
                                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid var(--gray-200)' }}>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: 12 }}>Username</label>
                                            <input className="form-control" value={newUsername} onChange={e => setNewUsername(e.target.value)} style={{ width: 150 }} />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: 12 }}>Password</label>
                                            <input className="form-control" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: 150 }} />
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={newIsAdmin} onChange={e => setNewIsAdmin(e.target.checked)} />
                                            Admin
                                        </label>
                                        <button className="btn-activity" style={{ background: 'var(--success)', color: '#fff' }} onClick={handleCreateUser}>Create</button>
                                        <button className="btn-activity btn-clear" onClick={() => { setShowCreateUser(false); setCreateError(''); }}>Cancel</button>
                                    </div>
                                    {createError && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>{createError}</div>}
                                </div>
                            )}

                            {editUser && (
                                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid var(--gray-200)' }}>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: 12 }}>Username</label>
                                            <input className="form-control" value={editUsername} onChange={e => setEditUsername(e.target.value)} style={{ width: 150 }} />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: 12 }}>New Password (blank = keep)</label>
                                            <input className="form-control" type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} style={{ width: 200 }} />
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={editIsAdmin} onChange={e => setEditIsAdmin(e.target.checked)} />
                                            Admin
                                        </label>
                                        <button className="btn-activity" style={{ background: 'var(--primary)', color: '#fff' }} onClick={handleUpdateUser}>Save</button>
                                        <button className="btn-activity btn-clear" onClick={() => setEditUser(null)}>Cancel</button>
                                    </div>
                                </div>
                            )}

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>ID</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Username</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Role</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Tasks</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Hours</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Earnings</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Joined</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                                <td style={{ padding: '8px 12px' }}>{u.id}</td>
                                                <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                                                    <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontWeight: 600, fontSize: 13 }}
                                                        onClick={() => handleViewUser(u)}>
                                                        {u.username}
                                                    </button>
                                                </td>
                                                <td style={{ padding: '8px 12px' }}>
                                                    {u.is_admin
                                                        ? <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Admin</span>
                                                        : <span style={{ color: 'var(--gray-500)' }}>User</span>}
                                                </td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{u.task_count}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmtDur(u.total_seconds)}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>৳{u.total_earnings}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmtDate(u.created_at)}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                    <button className="btn-activity btn-clear" style={{ marginRight: 4, padding: '4px 8px', fontSize: 11 }}
                                                        title="Edit" onClick={() => { setEditUser(u); setEditUsername(u.username); setEditPassword(''); setEditIsAdmin(u.is_admin); }}>
                                                        <i className="fas fa-pen"></i>
                                                    </button>
                                                    <button className="btn-activity btn-clear" style={{ marginRight: 4, padding: '4px 8px', fontSize: 11 }}
                                                        title="Clear all tasks" onClick={() => setConfirmAction({
                                                            type: 'clear_tasks', id: u.id, label: `Clear ALL tasks for ${u.username}?`,
                                                            onConfirm: () => handleClearUserTasks(u.id),
                                                        })}>
                                                        <i className="fas fa-broom"></i>
                                                    </button>
                                                    {u.id !== user?.id && (
                                                        <button className="btn-activity btn-clear" style={{ padding: '4px 8px', fontSize: 11, color: 'var(--danger)' }}
                                                            title="Delete user" onClick={() => setConfirmAction({
                                                                type: 'delete_user', id: u.id, label: `Delete user ${u.username} and ALL their data?`,
                                                                onConfirm: () => handleDeleteUser(u.id),
                                                            })}>
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'tasks' && (
                    <div className="card">
                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>All Tasks ({tasks.length})</h3>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <select className="form-select" style={{ width: 120, padding: '6px 10px', fontSize: 13 }}
                                        value={taskFilter} onChange={e => setTaskFilter(e.target.value)}>
                                        <option value="all">All Time</option>
                                        <option value="today">Today</option>
                                        <option value="week">This Week</option>
                                    </select>
                                    <select className="form-select" style={{ width: 140, padding: '6px 10px', fontSize: 13 }}
                                        value={taskUserFilter} onChange={e => setTaskUserFilter(e.target.value)}>
                                        <option value="">All Users</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Task</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>User</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Category</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Duration</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Rate</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Earnings</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Date</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tasks.map(t => (
                                            <tr key={t.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                                <td style={{ padding: '8px 12px', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.task_name}</td>
                                                <td style={{ padding: '8px 12px' }}>{t.username}</td>
                                                <td style={{ padding: '8px 12px' }}>{t.category}</td>
                                                <td style={{ padding: '8px 12px' }}>
                                                    <span style={{ color: t.status === 'completed' ? 'var(--success)' : 'var(--warning)', fontWeight: 600, textTransform: 'capitalize' }}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmtDur(t.total_duration)}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>৳{t.hourly_rate}/hr</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>৳{Math.round(t.total_duration * t.hourly_rate / 3600)}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmtDate(t.created_at)}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                                    <button className="btn-activity btn-clear" style={{ padding: '4px 8px', fontSize: 11, color: 'var(--danger)' }}
                                                        onClick={() => setConfirmAction({
                                                            type: 'delete_task', id: t.id, label: `Delete task "${t.task_name}"?`,
                                                            onConfirm: () => handleDeleteTask(t.id),
                                                        })}>
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {tasks.length === 0 && (
                                            <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>No tasks found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'activity' && (
                    <div className="card">
                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Activity Logs ({activityLogs.length})</h3>
                                <select className="form-select" style={{ width: 140, padding: '6px 10px', fontSize: 13 }}
                                    value={activityUserFilter} onChange={e => setActivityUserFilter(e.target.value)}>
                                    <option value="">All Users</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                                </select>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>User</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Task</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Category</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Action</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Duration</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activityLogs.map(log => (
                                            <tr key={log.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                                <td style={{ padding: '8px 12px', fontWeight: 600 }}>{log.username}</td>
                                                <td style={{ padding: '8px 12px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.task_name}</td>
                                                <td style={{ padding: '8px 12px' }}>{log.category}</td>
                                                <td style={{ padding: '8px 12px' }}>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                                                        background: log.activity_type === 'task_completed' ? '#dcfce7' :
                                                                   log.activity_type === 'task_stopped' ? '#fef3c7' :
                                                                   log.activity_type === 'task_started' ? '#dbeafe' : '#f3f4f6',
                                                        color: log.activity_type === 'task_completed' ? '#16a34a' :
                                                               log.activity_type === 'task_stopped' ? '#d97706' :
                                                               log.activity_type === 'task_started' ? '#2563eb' : '#6b7280',
                                                    }}>
                                                        {log.activity_type.replace('task_', '')}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{log.duration > 0 ? fmtDurFull(log.duration) : '-'}</td>
                                                <td style={{ padding: '8px 12px' }}>{fmtDateTime(log.activity_time)}</td>
                                            </tr>
                                        ))}
                                        {activityLogs.length === 0 && (
                                            <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>No activity logs</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'payouts' && (
                    <div className="card">
                        <div className="card-body">
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, marginBottom: 16 }}><i className="fas fa-money-bill-wave" style={{ color: 'var(--primary)', marginRight: 8 }}></i>Payout Requests ({payouts.length})</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>User</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Method</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Account</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Date</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payouts.map(p => (
                                            <tr key={p.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                                <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.username}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>৳{p.amount}</td>
                                                <td style={{ padding: '8px 12px' }}>{p.method}</td>
                                                <td style={{ padding: '8px 12px' }}>{p.account}</td>
                                                <td style={{ padding: '8px 12px' }}>
                                                    <select value={p.status} onChange={e => handlePayoutStatus(p.id, e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--gray-200)', fontSize: 12, fontWeight: 600, color: p.status === 'paid' ? '#16a34a' : p.status === 'pending' ? '#d97706' : p.status === 'approved' ? '#2563eb' : '#ef4444' }}>
                                                        <option value="pending">Pending</option>
                                                        <option value="approved">Approved</option>
                                                        <option value="paid">Paid</option>
                                                        <option value="rejected">Rejected</option>
                                                    </select>
                                                </td>
                                                <td style={{ padding: '8px 12px' }}>{fmtDateTime(p.created_at)}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                                    <button className="btn-activity btn-clear" style={{ padding: '4px 8px', fontSize: 11, color: 'var(--danger)' }} onClick={async () => { if (confirm('Delete payout?')) { await authFetch(`/api/admin/payouts/${p.id}`, { method: 'DELETE' }); loadPayouts(); } }}><i className="fas fa-trash"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {payouts.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>No payout requests</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {viewUser && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    }}>
                        <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 600, width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ margin: 0, fontSize: 16 }}>
                                    <i className="fas fa-user" style={{ marginRight: 8, color: 'var(--primary)' }}></i>
                                    {viewUser.username} — Profile
                                </h3>
                                <button className="btn-activity btn-clear" onClick={() => setViewUser(null)}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
                                <div className="summary-card compact">
                                    <div className="summary-value">{viewUser.task_count}</div>
                                    <div className="summary-label">Tasks</div>
                                </div>
                                <div className="summary-card compact">
                                    <div className="summary-value">{fmtDur(viewUser.total_seconds)}</div>
                                    <div className="summary-label">Hours</div>
                                </div>
                                <div className="summary-card compact">
                                    <div className="summary-value">৳{viewUser.total_earnings}</div>
                                    <div className="summary-label">Earnings</div>
                                </div>
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>
                                Role: <strong>{viewUser.is_admin ? 'Admin' : 'User'}</strong> | Joined: {fmtDate(viewUser.created_at)}
                            </div>
                            <h4 style={{ fontSize: 14, marginBottom: 8 }}>Recent Tasks</h4>
                            {viewUserTasks.length === 0 ? (
                                <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>No tasks yet</p>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Task</th>
                                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>Duration</th>
                                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>Earnings</th>
                                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewUserTasks.slice(0, 20).map(t => (
                                            <tr key={t.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                                <td style={{ padding: '6px 8px' }}>{t.task_name}</td>
                                                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{fmtDur(t.total_duration)}</td>
                                                <td style={{ padding: '6px 8px', textAlign: 'right' }}>৳{Math.round(t.total_duration * t.hourly_rate / 3600)}</td>
                                                <td style={{ padding: '6px 8px' }}>{fmtDate(t.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {confirmAction && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001,
                    }}>
                        <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 380, width: '90%', textAlign: 'center' }}>
                            <i className="fas fa-exclamation-triangle" style={{ fontSize: 36, color: 'var(--danger)', marginBottom: 12 }}></i>
                            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Are you sure?</h3>
                            <p style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 20 }}>{confirmAction.label}</p>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <button className="btn-activity" style={{ background: 'var(--danger)', color: '#fff', padding: '8px 20px' }}
                                    onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }}>
                                    <i className="fas fa-trash"></i> Confirm
                                </button>
                                <button className="btn-activity btn-clear" style={{ padding: '8px 20px' }}
                                    onClick={() => setConfirmAction(null)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {toast && (
                    <div style={{
                        position: 'fixed', bottom: 24, right: 24, background: '#16a34a', color: '#fff',
                        padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1002,
                    }}>
                        <i className="fas fa-check-circle" style={{ marginRight: 6 }}></i>{toast}
                    </div>
                )}
            </div>
        </>
    );
}
