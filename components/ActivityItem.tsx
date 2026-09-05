'use client';

import { useState } from 'react';

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

function formatDurationShort(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function formatWorkDate(task: Task): string {
    const raw = (task.work_date || '').slice(0, 10);
    if (!raw || !/^\d{4}-\d{2}-\d{2}/.test(raw)) return '';
    const [y, m, d] = raw.split('-').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(d).padStart(2, '0')} ${months[m - 1]} ${y}`;
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export default function ActivityItem({ task, onDelete, onUpdate }: { task: Task; onDelete: (id: number) => void; onUpdate?: (id: number, patch: Partial<Task>) => void }) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(task.task_name);
    const [editH, setEditH] = useState(Math.floor(task.total_duration / 3600));
    const [editM, setEditM] = useState(Math.floor((task.total_duration % 3600) / 60));
    const [saving, setSaving] = useState(false);

    const started = new Date(task.started_at);
    const ended = new Date(task.ended_at);
    const startTime = started.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = ended.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const duration = formatDurationShort(task.total_duration);
    const badgeClass = task.status === 'completed' ? 'badge-completed' : 'badge-stopped';
    const statusLabel = task.status.charAt(0).toUpperCase() + task.status.slice(1);
    const earnings = Math.round((task.total_duration || 0) * (task.hourly_rate || 0) / 3600);
    const dateLabel = formatWorkDate(task);

    const handleSave = async () => {
        const name = editName.trim();
        const total = (Math.max(0, editH) * 3600) + (Math.max(0, Math.min(59, editM)) * 60);
        const patch: any = {};
        if (name && name !== task.task_name) patch.task_name = name;
        if (total !== task.total_duration) patch.total_duration = total;
        if (Object.keys(patch).length === 0) { setEditing(false); return; }
        setSaving(true);
        if (onUpdate) await onUpdate(task.id, patch);
        setSaving(false);
        setEditing(false);
        window.dispatchEvent(new CustomEvent('stats-refresh'));
    };

    return (
        <div className="activity-item">
            <div className="activity-item-header">
                {editing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input className="form-control" value={editName} onChange={e => setEditName(e.target.value)} maxLength={100} autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditing(false); setEditName(task.task_name); setEditH(Math.floor(task.total_duration / 3600)); setEditM(Math.floor((task.total_duration % 3600) / 60)); } }} style={{ padding: '6px 10px', fontSize: 13, flex: 1 }} placeholder="Task name" />
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input type="number" min={0} max={24} value={editH} onChange={e => setEditH(parseInt(e.target.value) || 0)} className="form-control" style={{ width: 70, padding: '6px 8px', fontSize: 13 }} placeholder="h" />
                            <span style={{ fontSize: 13 }}>h</span>
                            <input type="number" min={0} max={59} value={editM} onChange={e => setEditM(parseInt(e.target.value) || 0)} className="form-control" style={{ width: 70, padding: '6px 8px', fontSize: 13 }} placeholder="m" />
                            <span style={{ fontSize: 13 }}>m</span>
                            <button className="btn-activity" style={{ background: 'var(--primary)', color: '#fff', padding: '4px 12px', marginLeft: 'auto' }} onClick={handleSave} disabled={saving}><i className="fas fa-check"></i> Save</button>
                            <button className="btn-activity btn-clear" style={{ padding: '4px 12px' }} onClick={() => { setEditing(false); setEditName(task.task_name); setEditH(Math.floor(task.total_duration / 3600)); setEditM(Math.floor((task.total_duration % 3600) / 60)); }}><i className="fas fa-times"></i></button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="activity-task-name" dangerouslySetInnerHTML={{ __html: escapeHtml(task.task_name) }} onClick={() => { setEditH(Math.floor(task.total_duration / 3600)); setEditM(Math.floor((task.total_duration % 3600) / 60)); setEditing(true); }} title="Click to edit" style={{ cursor: 'pointer' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className={`activity-status-badge ${badgeClass}`}>{statusLabel}</span>
                            <button className="btn-delete-task" title="Edit" onClick={() => { setEditH(Math.floor(task.total_duration / 3600)); setEditM(Math.floor((task.total_duration % 3600) / 60)); setEditing(true); }} style={{ color: 'var(--primary)', width: 28, height: 28, background: 'var(--primary-light)', borderRadius: 8 }}><i className="fas fa-pen"></i></button>
                            {confirmDelete ? (
                                <div className="delete-confirm">
                                    <span className="delete-confirm-text">Delete?</span>
                                    <button className="delete-confirm-yes" onClick={() => onDelete(task.id)}>Yes</button>
                                    <button className="delete-confirm-no" onClick={() => setConfirmDelete(false)}>No</button>
                                </div>
                            ) : (
                                <button className="btn-delete-task" title="Delete task" onClick={() => setConfirmDelete(true)}><i className="fas fa-times"></i></button>
                            )}
                        </div>
                    </>
                )}
            </div>
            {!editing && (
                <>
                    <div className="activity-category" dangerouslySetInnerHTML={{ __html: escapeHtml(task.category) }} />
                    {dateLabel && (
                        <div className="activity-date">
                            <i className="fas fa-calendar"></i> {dateLabel}
                        </div>
                    )}
                    <div className="activity-times">
                        <i className="fas fa-arrow-right"></i>
                        {startTime} — {endTime}
                    </div>
                    <div className="activity-duration" onClick={() => { setEditH(Math.floor(task.total_duration / 3600)); setEditM(Math.floor((task.total_duration % 3600) / 60)); setEditing(true); }} title="Click to edit" style={{ cursor: 'pointer' }}>
                        <i className="fas fa-clock"></i> {duration}
                        {earnings > 0 && <span className="activity-earnings">৳{earnings}</span>}
                    </div>
                </>
            )}
        </div>
    );
}
