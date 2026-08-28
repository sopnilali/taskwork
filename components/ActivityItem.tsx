'use client';

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

function formatDurationShort(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export default function ActivityItem({ task }: { task: Task }) {
    const started = new Date(task.started_at);
    const ended = new Date(task.ended_at);
    const startTime = started.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = ended.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const duration = formatDurationShort(task.total_duration);
    const badgeClass = task.status === 'completed' ? 'badge-completed' : 'badge-stopped';
    const statusLabel = task.status.charAt(0).toUpperCase() + task.status.slice(1);
    const earnings = Math.round((task.total_duration || 0) * (task.hourly_rate || 0) / 3600);

    return (
        <div className="activity-item">
            <div className="activity-item-header">
                <div className="activity-task-name" dangerouslySetInnerHTML={{ __html: escapeHtml(task.task_name) }} />
                <span className={`activity-status-badge ${badgeClass}`}>{statusLabel}</span>
            </div>
            <div className="activity-category" dangerouslySetInnerHTML={{ __html: escapeHtml(task.category) }} />
            <div className="activity-times">
                <i className="fas fa-arrow-right"></i>
                {startTime} — {endTime}
            </div>
            <div className="activity-duration">
                <i className="fas fa-clock"></i> {duration}
                {earnings > 0 && <span className="activity-earnings">৳{earnings}</span>}
            </div>
        </div>
    );
}
