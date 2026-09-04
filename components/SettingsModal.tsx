'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type Tab = 'profile' | 'preferences' | 'data' | 'about';

const PREF_KEY = 'tasktimer_prefs';
const CATEGORIES = ['Work', 'Study', 'Design', 'Development', 'Meeting', 'Personal'];

interface Prefs {
    defaultCategory: string;
    defaultRate: number;
    soundEnabled: boolean;
    confirmDelete: boolean;
}

function loadPrefs(): Prefs {
    try {
        const raw = localStorage.getItem(PREF_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return { defaultCategory: 'Work', defaultRate: 0, soundEnabled: true, confirmDelete: true };
}

function savePrefs(p: Prefs) {
    localStorage.setItem(PREF_KEY, JSON.stringify(p));
}

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { user, authFetch, logout } = useAuth();
    const [tab, setTab] = useState<Tab>('profile');
    const [prefs, setPrefs] = useState<Prefs>({ defaultCategory: 'Work', defaultRate: 0, soundEnabled: true, confirmDelete: true });

    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwMsg, setPwMsg] = useState('');
    const [pwErr, setPwErr] = useState('');
    const [pwLoading, setPwLoading] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [clearConfirm, setClearConfirm] = useState(false);
    const [toast, setToast] = useState('');

    useEffect(() => {
        if (open) setPrefs(loadPrefs());
    }, [open]);

    const updatePref = (patch: Partial<Prefs>) => {
        const next = { ...prefs, ...patch };
        setPrefs(next);
        savePrefs(next);
        setToast('Preferences saved');
        setTimeout(() => setToast(''), 2000);
    };

    const handlePasswordChange = async () => {
        setPwErr(''); setPwMsg('');
        if (!currentPw || !newPw || !confirmPw) { setPwErr('All fields required'); return; }
        if (newPw.length < 6) { setPwErr('New password must be at least 6 characters'); return; }
        if (newPw !== confirmPw) { setPwErr('New passwords do not match'); return; }
        setPwLoading(true);
        try {
            const res = await authFetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
            });
            const data = await res.json();
            if (!res.ok) { setPwErr(data.error || 'Failed'); return; }
            setPwMsg('Password updated successfully');
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
            setTimeout(() => setPwMsg(''), 3000);
        } catch { setPwErr('Network error'); }
        finally { setPwLoading(false); }
    };

    const handleExport = async () => {
        try {
            const res = await authFetch('/api/tasks');
            const tasks = await res.json();
            if (!Array.isArray(tasks) || tasks.length === 0) { setToast('No data to export'); setTimeout(() => setToast(''), 2000); return; }
            const headers = ['Task', 'Category', 'Status', 'Duration(s)', 'Rate', 'Earnings', 'Work Date', 'Created'];
            const rows = tasks.map((t: Record<string, unknown>) => [
                String(t.task_name), String(t.category), String(t.status), String(t.total_duration),
                String(t.hourly_rate), String(Math.round(Number(t.total_duration) * Number(t.hourly_rate) / 3600)),
                String((t as { work_date?: string }).work_date || String(t.created_at).slice(0, 10)), String(t.created_at)
            ]);
            const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `tasktimer-export-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
            URL.revokeObjectURL(url);
            setToast('Exported');
            setTimeout(() => setToast(''), 2000);
        } catch { setToast('Export failed'); setTimeout(() => setToast(''), 2000); }
    };

    const handleClearAll = async () => {
        try {
            await authFetch('/api/tasks', { method: 'DELETE' });
            setClearConfirm(false);
            setToast('All tasks cleared');
            setTimeout(() => setToast(''), 2000);
        } catch { setToast('Failed'); setTimeout(() => setToast(''), 2000); }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== user?.username) { setToast('Type your username to confirm'); setTimeout(() => setToast(''), 2000); return; }
        try {
            const res = await authFetch('/api/auth/account', { method: 'DELETE' });
            if (!res.ok) throw new Error();
            logout();
            onClose();
        } catch { setToast('Delete failed'); setTimeout(() => setToast(''), 2000); }
    };

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h3><i className="fas fa-cog"></i> Settings</h3>
                    <button className="modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
                </div>

                <div className="settings-layout">
                    <div className="settings-sidebar">
                        {([
                            { key: 'profile', label: 'Profile', icon: 'fas fa-user' },
                            { key: 'preferences', label: 'Preferences', icon: 'fas fa-sliders' },
                            { key: 'data', label: 'Data', icon: 'fas fa-database' },
                            { key: 'about', label: 'About', icon: 'fas fa-circle-info' },
                        ] as const).map(item => (
                            <button key={item.key} className={`settings-tab ${tab === item.key ? 'active' : ''}`} onClick={() => setTab(item.key)}>
                                <i className={item.icon}></i> {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="settings-content">
                        {tab === 'profile' && (
                            <div>
                                <div className="settings-section">
                                    <h4>Account</h4>
                                    <div className="profile-card">
                                        <div className="profile-avatar"><i className="fas fa-user"></i></div>
                                        <div>
                                            <div className="profile-name">{user?.username}</div>
                                            <div className="profile-meta">{user?.is_admin ? 'Admin' : 'User'}  ·  ID #{user?.id}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="settings-section">
                                    <h4>Change Password</h4>
                                    {pwErr && <div className="auth-error">{pwErr}</div>}
                                    {pwMsg && <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{pwMsg}</div>}
                                    <div className="settings-field">
                                        <label className="form-label">Current Password</label>
                                        <input type="password" className="form-control" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Current password" />
                                    </div>
                                    <div className="settings-field">
                                        <label className="form-label">New Password</label>
                                        <input type="password" className="form-control" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 6 characters" />
                                    </div>
                                    <div className="settings-field">
                                        <label className="form-label">Confirm New Password</label>
                                        <input type="password" className="form-control" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm password" />
                                    </div>
                                    <button className="btn-modal btn-modal-primary" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }} onClick={handlePasswordChange} disabled={pwLoading}>
                                        {pwLoading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>

                                <div className="settings-section">
                                    <h4>Session</h4>
                                    <button className="btn-activity" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>
                                        <i className="fas fa-sign-out-alt"></i> Logout
                                    </button>
                                </div>
                            </div>
                        )}

                        {tab === 'preferences' && (
                            <div>
                                <div className="settings-section">
                                    <h4>Defaults</h4>
                                    <div className="settings-field">
                                        <label className="form-label">Default Category</label>
                                        <select className="form-select" value={prefs.defaultCategory} onChange={e => updatePref({ defaultCategory: e.target.value })}>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <div className="settings-hint">Pre-selected when creating new task</div>
                                    </div>
                                    <div className="settings-field">
                                        <label className="form-label">Default Hourly Rate (৳/hr)</label>
                                        <input type="number" className="form-control" min={0} step={50} value={prefs.defaultRate} onChange={e => updatePref({ defaultRate: parseFloat(e.target.value) || 0 })} />
                                        <div className="settings-hint">Applied to new timer sessions</div>
                                    </div>
                                </div>

                                <div className="settings-section">
                                    <h4>Behavior</h4>
                                    <label className="settings-toggle-row">
                                        <div>
                                            <div className="settings-toggle-label">Confirm before delete</div>
                                            <div className="settings-hint">Show confirmation for task deletion</div>
                                        </div>
                                        <input type="checkbox" className="settings-switch" checked={prefs.confirmDelete} onChange={e => updatePref({ confirmDelete: e.target.checked })} />
                                    </label>
                                    <label className="settings-toggle-row">
                                        <div>
                                            <div className="settings-toggle-label">Sound on timer stop</div>
                                            <div className="settings-hint">Play sound when task is stopped</div>
                                        </div>
                                        <input type="checkbox" className="settings-switch" checked={prefs.soundEnabled} onChange={e => updatePref({ soundEnabled: e.target.checked })} />
                                    </label>
                                </div>
                            </div>
                        )}

                        {tab === 'data' && (
                            <div>
                                <div className="settings-section">
                                    <h4>Export</h4>
                                    <p className="settings-hint" style={{ marginBottom: 10 }}>Download all your tasks as CSV</p>
                                    <button className="btn-activity" style={{ background: 'var(--primary)', color: '#fff', width: '100%', justifyContent: 'center' }} onClick={handleExport}>
                                        <i className="fas fa-download"></i> Export CSV
                                    </button>
                                </div>

                                <div className="settings-section">
                                    <h4>Danger Zone</h4>
                                    <div className="danger-box">
                                        <div className="danger-title">Clear All Tasks</div>
                                        <div className="settings-hint">Permanently delete all your tasks and activity logs</div>
                                        {!clearConfirm ? (
                                            <button className="btn-modal btn-modal-danger" style={{ marginTop: 10 }} onClick={() => setClearConfirm(true)}>Clear All Tasks</button>
                                        ) : (
                                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                                <button className="btn-modal btn-modal-danger" onClick={handleClearAll}>Yes, Clear</button>
                                                <button className="btn-modal btn-modal-cancel" onClick={() => setClearConfirm(false)}>Cancel</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="danger-box" style={{ marginTop: 12 }}>
                                        <div className="danger-title">Delete Account</div>
                                        <div className="settings-hint">Delete your account and all data. Type your username to confirm.</div>
                                        <input className="form-control" placeholder={user?.username} value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} style={{ marginTop: 8 }} />
                                        <button className="btn-modal btn-modal-danger" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }} onClick={handleDeleteAccount}>
                                            Delete Account Permanently
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {tab === 'about' && (
                            <div>
                                <div className="settings-section">
                                    <h4>TaskTimer</h4>
                                    <p className="settings-hint">Free Online Task Timer — Track your time, boost your productivity</p>
                                    <div style={{ marginTop: 12, fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                                        <div><strong>Version:</strong> 1.0.0</div>
                                        <div><strong>Build:</strong> Next.js 16 · Postgres (Neon)</div>
                                        <div><strong>Support:</strong> File feedback at github.com/anomalyco/opencode/issues</div>
                                    </div>
                                </div>
                                <div className="settings-section">
                                    <h4>Shortcuts</h4>
                                    <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                                        <div>• <strong>Enter</strong> in Task Name — Start timer</div>
                                        <div>• <strong>+5 / +15 / +30</strong> — Add time to active timer</div>
                                        <div>• <strong>Today / Yesterday</strong> — Stats range switch</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {toast && <div className="settings-toast"><i className="fas fa-check-circle"></i> {toast}</div>}
            </div>
        </div>
    );
}
