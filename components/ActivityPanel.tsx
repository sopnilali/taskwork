'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
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
    const pathname = usePathname();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');


    useEffect(() => {
        const handler = (e: Event) => setSearchQuery((e as CustomEvent).detail?.toLowerCase() || '');
        window.addEventListener('task-search' as unknown as string, handler as EventListener);
        return () => window.removeEventListener('task-search' as unknown as string, handler as EventListener);
    }, []);

    const loadActivityLog = useCallback(async () => {
        try {
            const url = `/api/tasks?filter=${filter}`;
            const res = await authFetch(url);
            const data = await res.json();
            setTasks(data);
        } catch (err) {
            console.error('Failed to load activity log:', err);
        }
    }, [authFetch, filter]);

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

    useEffect(() => {
        loadActivityLog();
    }, [pathname]);

    useEffect(() => {
        loadActivityLog();
        const interval = setInterval(() => { if (document.visibilityState === 'visible') loadActivityLog(); }, 10000);
        const onRefresh = () => loadActivityLog();
        window.addEventListener('stats-refresh', onRefresh);
        const onVisible = () => { if (document.visibilityState === 'visible') loadActivityLog(); };
        document.addEventListener('visibilitychange', onVisible);
        return () => { clearInterval(interval); window.removeEventListener('stats-refresh', onRefresh); document.removeEventListener('visibilitychange', onVisible); };
    }, [loadActivityLog, refreshKey]);

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
                    </div>

                    <div className="activity-list">
                        {(() => {
                            const filtered = searchQuery ? tasks.filter(t => t.task_name.toLowerCase().includes(searchQuery) || t.category.toLowerCase().includes(searchQuery)) : tasks;
                            if (filtered.length === 0) {
                                return (
                                    <div className="empty-state">
                                        <div className="empty-icon"><i className="fas fa-clock"></i></div>
                                        <div className="empty-title">{searchQuery ? 'No match' : 'No activity yet'}</div>
                                        <div className="empty-text">{searchQuery ? `No tasks for "${searchQuery}"` : 'Start your first task to track your time'}</div>
                                    </div>
                                );
                            }
                            const sorted = [...filtered].sort((a, b) => {
                                const da = (a.work_date || a.created_at || a.started_at || '').slice(0, 10);
                                const db = (b.work_date || b.created_at || b.started_at || '').slice(0, 10);
                                if (da !== db) return db.localeCompare(da);
                                return (b.created_at || b.started_at || '').localeCompare(a.created_at || a.started_at || '');
                            });
                            const groups: Record<string, typeof filtered> = {};
                            const order: string[] = [];
                            sorted.forEach(t => {
                                const k = (t.work_date || t.created_at || t.started_at || '').slice(0, 10);
                                if (!groups[k]) { groups[k] = []; order.push(k); }
                                groups[k].push(t);
                            });
                            const todayStr = new Date().toLocaleDateString('en-CA');
                            const y = new Date(); y.setDate(y.getDate() - 1);
                            const yStr = y.toLocaleDateString('en-CA');
                            const fmtHeader = (k: string) => {
                                const [y, m, d] = k.split('-').map(Number);
                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                const formatted = k && /^\d{4}-\d{2}-\d{2}$/.test(k) ? `${String(d).padStart(2, '0')} ${months[m - 1]} ${y}` : k;
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
