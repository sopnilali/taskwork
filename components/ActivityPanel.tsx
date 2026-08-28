'use client';

import { useEffect, useState, useCallback } from 'react';
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
    const [showClearModal, setShowClearModal] = useState(false);

    const loadActivityLog = useCallback(async () => {
        try {
            const res = await authFetch(`/api/tasks?filter=${filter}`);
            const data = await res.json();
            setTasks(data);
        } catch (err) {
            console.error('Failed to load activity log:', err);
        }
    }, [authFetch, filter]);

    const clearAllActivity = async () => {
        try {
            await authFetch('/api/tasks', { method: 'DELETE' });
            loadActivityLog();
            setShowClearModal(false);
        } catch (err) {
            console.error('Failed to clear activity:', err);
        }
    };

    useEffect(() => {
        loadActivityLog();
        const interval = setInterval(loadActivityLog, 15000);
        return () => clearInterval(interval);
    }, [loadActivityLog, refreshKey]);

    return (
        <div className="right-panel activity-panel">
            <div className="card">
                <div className="card-body">
                    <div className="activity-header">
                        <h3>Activity Log</h3>
                        <div className="activity-actions">
                            <button className="btn-activity btn-clear" onClick={() => setShowClearModal(true)}>
                                <i className="fas fa-trash-alt"></i> Clear All
                            </button>
                        </div>
                    </div>

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
                        {tasks.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <i className="fas fa-clock"></i>
                                </div>
                                <div className="empty-title">No activity yet</div>
                                <div className="empty-text">Start your first task to track your time</div>
                            </div>
                        ) : (
                            tasks.map(task => <ActivityItem key={task.id} task={task} />)
                        )}
                    </div>
                </div>
            </div>

            {showClearModal && (
                <div className="modal-overlay" onClick={() => setShowClearModal(false)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Clear All Activity</h5>
                                <button type="button" className="btn-close" onClick={() => setShowClearModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p style={{ color: 'var(--gray-600)', fontSize: 14, margin: 0 }}>
                                    Are you sure you want to delete all completed task history? This action cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-modal btn-modal-cancel" onClick={() => setShowClearModal(false)}>Cancel</button>
                                <button className="btn-modal btn-modal-danger" onClick={clearAllActivity}>Clear All</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
