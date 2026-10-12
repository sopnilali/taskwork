'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ActivityItem from './ActivityItem';

interface Task {
    id: number;
    task_name: string;
    category: string;
    status: string;
    started_at: string;
    ended_at: string;
    total_duration: number;
    hourly_rate: number;
    work_date?: string;
    created_at?: string;
}

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'completed', label: 'Completed' },
    { key: 'stopped', label: 'Stopped' },
];

export default function ActivityPanel({ refreshKey }: { refreshKey: number }) {
    const { authFetch } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const fetchingRef = useRef(false);
    const hasLoadedOnce = useRef(false);
    // Stable refs so background polling never re-triggers full reloads
    // when context identities change (e.g. token set after mount).
    const authFetchRef = useRef(authFetch);
    authFetchRef.current = authFetch;
    const filterRef = useRef(filter);
    filterRef.current = filter;


    useEffect(() => {
        const handler = (e: Event) => setSearchQuery((e as CustomEvent).detail?.toLowerCase() || '');
        window.addEventListener('task-search' as unknown as string, handler as EventListener);
        return () => window.removeEventListener('task-search' as unknown as string, handler as EventListener);
    }, []);

    // Stable identity: reads latest authFetch/filter via refs.
    // Never changes, so effects below run exactly when intended.
    const loadActivityLog = useCallback(async (opts: { silent?: boolean } = {}) => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        const silent = opts.silent ?? hasLoadedOnce.current;
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            if (!silent) setError('');
            const url = `/api/tasks?filter=${filterRef.current}`;
            const res = await authFetchRef.current(url);
            const data = await res.json();
            if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to load tasks');
            setTasks(Array.isArray(data) ? data : []);
            setError('');
            hasLoadedOnce.current = true;
        } catch (err) {
            console.error('Failed to load activity log:', err);
            if (!hasLoadedOnce.current) {
                setError(err instanceof Error ? err.message : 'Failed to load tasks');
                setTasks([]);
            }
        } finally {
            fetchingRef.current = false;
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const deleteTask = async (id: number) => {
        try {
            await authFetch(`/api/tasks/${id}`, { method: 'DELETE' });
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error('Failed to delete task:', err);
        }
    };

    const updateTask = async (id: number, patch: Partial<Task>) => {
        try {
            const res = await authFetch(`/api/tasks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const updated = await res.json();
            if (!res.ok) throw new Error(updated.error || 'Update failed');
            setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
        } catch (err) {
            console.error('Failed to update task:', err);
        }
    };

    // Full load only on mount + real filter change.
    useEffect(() => {
        hasLoadedOnce.current = false;
        loadActivityLog({ silent: false });
    }, [filter, loadActivityLog]);

    // Silent background sync: single interval + events, mounted once.
    // Never touches `loading`, so the list never flashes/disappears.
    useEffect(() => {
        const interval = setInterval(() => { if (document.visibilityState === 'visible') loadActivityLog({ silent: true }); }, 30000);
        const onRefresh = () => loadActivityLog({ silent: true });
        window.addEventListener('stats-refresh', onRefresh);
        const onVisible = () => { if (document.visibilityState === 'visible') loadActivityLog({ silent: true }); };
        document.addEventListener('visibilitychange', onVisible);
        return () => { clearInterval(interval); window.removeEventListener('stats-refresh', onRefresh); document.removeEventListener('visibilitychange', onVisible); };
    }, [loadActivityLog]);

    // Parent-forced refresh (refreshKey bump) — silent.
    const prevRefreshKey = useRef(refreshKey);
    useEffect(() => {
        if (prevRefreshKey.current !== refreshKey) {
            prevRefreshKey.current = refreshKey;
            loadActivityLog({ silent: true });
        }
    }, [refreshKey, loadActivityLog]);

    return (
        <div className="right-panel activity-panel">
            <div className="card">
                <div className="card-body">
                    <div className="filter-tabs">
                        {FILTERS.map(f => (
                            <button
                                key={f.key}
                                className={`filter-tab ${filter === f.key ? 'active' : ''}`}
                                onClick={() => setFilter(f.key)}
                            >
                                {f.label}
                            </button>
                        ))}
                        {refreshing && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--gray-400)', alignSelf: 'center' }}><i className="fas fa-rotate fa-spin"></i></span>}
                    </div>

                    <div className="activity-list">
                        {loading ? (
                            <div className="card-loading"><div className="loading-spinner small"></div><p>Loading tasks...</p></div>
                        ) : error ? (
                            <div className="empty-state">
                                <div className="empty-icon"><i className="fas fa-triangle-exclamation"></i></div>
                                <div className="empty-title">Failed to load tasks</div>
                                <div className="empty-text">{error}</div>
                                <button className="btn-activity" style={{ marginTop: 12 }} onClick={() => loadActivityLog({ silent: false })}><i className="fas fa-rotate"></i> Retry</button>
                            </div>
                        ) : (() => {
                            const filtered = searchQuery ? tasks.filter(t => (t.task_name || '').toLowerCase().includes(searchQuery) || (t.category || '').toLowerCase().includes(searchQuery)) : tasks;
                            if (filtered.length === 0) {
                                return (
                                    <div className="empty-state">
                                        <div className="empty-icon"><i className="fas fa-clock"></i></div>
                                        <div className="empty-title">{searchQuery ? 'No match' : 'No activity yet'}</div>
                                        <div className="empty-text">{searchQuery ? `No tasks for "${searchQuery}"` : 'Start your first task to track your time'}</div>
                                    </div>
                                );
                            }
                            const dateKeyOf = (t: Task) => (t.work_date || t.created_at || t.started_at || '').slice(0, 10) || 'No date';
                            const sorted = [...filtered].sort((a, b) => {
                                const da = dateKeyOf(a);
                                const db = dateKeyOf(b);
                                if (da !== db) return db.localeCompare(da);
                                return (b.created_at || b.started_at || '').localeCompare(a.created_at || a.started_at || '');
                            });
                            const groups: Record<string, typeof filtered> = {};
                            const order: string[] = [];
                            sorted.forEach(t => {
                                const k = dateKeyOf(t);
                                if (!groups[k]) { groups[k] = []; order.push(k); }
                                groups[k].push(t);
                            });
                            const todayStr = new Date().toLocaleDateString('en-CA');
                            const y = new Date(); y.setDate(y.getDate() - 1);
                            const yStr = y.toLocaleDateString('en-CA');
                            const fmtHeader = (k: string) => {
                                if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return k;
                                const [yy, m, d] = k.split('-').map(Number);
                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                const formatted = `${String(d).padStart(2, '0')} ${months[m - 1]} ${yy}`;
                                if (k === todayStr) return `Today — ${formatted}`;
                                if (k === yStr) return `Yesterday — ${formatted}`;
                                return formatted;
                            };
                            return order.map(dateKey => (
                                <div key={dateKey}>
                                    <div className="activity-date-header">
                                        <i className="fas fa-calendar-day"></i> {fmtHeader(dateKey)}
                                        <span className="activity-date-count">{groups[dateKey].length}</span>
                                    </div>
                                    {groups[dateKey].map(task => <ActivityItem key={task.id} task={task} onDelete={deleteTask} onUpdate={updateTask} />)}
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>


        </div>
    );
}
