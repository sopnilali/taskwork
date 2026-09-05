'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

type Payout = { id: number; amount: number; method: string; account: string; status: string; note: string; created_at: string };

export default function PayoutPage() {
    const { user, loading, authFetch } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [totalPaid, setTotalPaid] = useState(0);
    const [totalPending, setTotalPending] = useState(0);
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('bkash');
    const [account, setAccount] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { if (!loading && !user) router.replace('/auth'); }, [user, loading, router]);

    const load = useCallback(async () => {
        try {
            const res = await authFetch('/api/payouts');
            const data = await res.json();
            if (data.payouts) { setPayouts(data.payouts); setTotalEarnings(data.totalEarnings || 0); setTotalPaid(data.totalPaid || 0); setTotalPending(data.totalPending || 0); }
        } catch {}
    }, [authFetch]);

    useEffect(() => { load(); }, [load, pathname]);
    useEffect(() => {
        load();
        const id = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 10000);
        window.addEventListener('stats-refresh', load);
        return () => { clearInterval(id); window.removeEventListener('stats-refresh', load); };
    }, [load]);

    const balance = totalEarnings - totalPaid - totalPending;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const amt = parseInt(amount);
        if (!amt || amt <= 0) { setError('Enter valid amount'); return; }
        if (amt > balance) { setError(`Insufficient balance. Available ৳${balance}`); return; }
        if (!account.trim()) { setError('Account required'); return; }
        setSubmitting(true);
        try {
            const res = await authFetch('/api/payouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amt, method, account, note }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            setAmount(''); setAccount(''); setNote('');
            load(); window.dispatchEvent(new CustomEvent('stats-refresh'));
        } catch (err: any) { setError(err.message); }
        setSubmitting(false);
    };

    const del = async (id: number) => {
        if (!confirm('Cancel this payout request?')) return;
        await authFetch(`/api/payouts/${id}`, { method: 'DELETE' });
        load();
    };

    if (loading || !user) return null;

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                <Sidebar />
                <div className="dashboard-main">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title"><i className="fas fa-money-bill-wave"></i> Payout</h1>
                            <p className="page-subtitle">Manage your earnings and withdrawals</p>
                        </div>
                    </div>

                    <div className="stats-cards-grid" style={{ marginBottom: 20 }}>
                        <div className="stats-card earnings-card"><div className="stats-card-icon"><i className="fas fa-coins"></i></div><div className="stats-card-content"><div className="stats-card-value">৳{totalEarnings}</div><div className="stats-card-label">Total Earnings</div></div></div>
                        <div className="stats-card" style={{ borderLeft: '3px solid #22c55e' }}><div className="stats-card-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><i className="fas fa-check-circle"></i></div><div className="stats-card-content"><div className="stats-card-value">৳{totalPaid}</div><div className="stats-card-label">Paid</div></div></div>
                        <div className="stats-card" style={{ borderLeft: '3px solid #f59e0b' }}><div className="stats-card-icon" style={{ background: '#fef3c7', color: '#d97706' }}><i className="fas fa-clock"></i></div><div className="stats-card-content"><div className="stats-card-value">৳{totalPending}</div><div className="stats-card-label">Pending</div></div></div>
                        <div className="stats-card" style={{ borderLeft: '3px solid #6366f1' }}><div className="stats-card-icon" style={{ background: '#e0e7ff', color: '#6366f1' }}><i className="fas fa-wallet"></i></div><div className="stats-card-content"><div className="stats-card-value">৳{balance}</div><div className="stats-card-label">Available</div></div></div>
                    </div>

                    <div className="payout-grid">
                        <div className="card">
                            <div className="card-body">
                                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}><i className="fas fa-paper-plane" style={{ color: 'var(--primary)' }}></i> Request Payout</h3>
                                {error && <div className="auth-error">{error}</div>}
                                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div className="timer-input-group">
                                        <label className="timer-input-label">Amount (৳)</label>
                                        <input type="number" className="timer-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Max ৳${balance}`} min={1} max={balance} required />
                                    </div>
                                    <div className="timer-input-group">
                                        <label className="timer-input-label">Method</label>
                                        <select className="timer-input" value={method} onChange={e => setMethod(e.target.value)}>
                                            <option value="bkash">bKash</option>
                                            <option value="nagad">Nagad</option>
                                            <option value="rocket">Rocket</option>
                                            <option value="bank">Bank</option>
                                            <option value="paypal">PayPal</option>
                                        </select>
                                    </div>
                                    <div className="timer-input-group">
                                        <label className="timer-input-label">Account / Number</label>
                                        <input className="timer-input" value={account} onChange={e => setAccount(e.target.value)} placeholder="017... or account no" required />
                                    </div>
                                    <div className="timer-input-group">
                                        <label className="timer-input-label">Note (optional)</label>
                                        <input className="timer-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Note" maxLength={200} />
                                    </div>
                                    <button type="submit" className="auth-submit" disabled={submitting || balance <= 0}>{submitting ? 'Submitting...' : 'Request Payout'}</button>
                                    {balance <= 0 && <p style={{ fontSize: 12, color: 'var(--gray-500)', textAlign: 'center' }}>No available balance</p>}
                                </form>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-body">
                                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}><i className="fas fa-list" style={{ color: 'var(--primary)' }}></i> Payout History</h3>
                                {payouts.length === 0 ? (
                                    <div className="empty-state" style={{ padding: 24 }}><div className="empty-icon"><i className="fas fa-money-bill"></i></div><div className="empty-title">No payouts yet</div><div className="empty-text">Request a payout to see history</div></div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
                                        {payouts.map(p => (
                                            <div key={p.id} className="activity-item" style={{ padding: 12 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ fontWeight: 700, fontSize: 14 }}>৳{p.amount} <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--gray-500)' }}>via {p.method}</span></div>
                                                    <span className="activity-status-badge" style={{ background: p.status === 'paid' ? 'var(--success-light)' : p.status === 'pending' ? 'var(--warning-light)' : p.status === 'approved' ? '#dbeafe' : '#fee2e2', color: p.status === 'paid' ? 'var(--success)' : p.status === 'pending' ? 'var(--warning)' : p.status === 'approved' ? '#2563eb' : 'var(--danger)' }}>{p.status}</span>
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>{p.account} {p.note ? `· ${p.note}` : ''}</div>
                                                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>{new Date(p.created_at).toLocaleString()}</div>
                                                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4, fontStyle: 'italic' }}>Admin will review and update status</div>
                                                {p.status === 'pending' && <button className="btn-activity btn-clear" style={{ marginTop: 8, padding: '4px 10px', fontSize: 11 }} onClick={() => del(p.id)}>Cancel</button>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
