'use client';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function MiniActivityChart() {
    const { authFetch } = useAuth();
    const pathname = usePathname();
    const [data, setData] = useState<{ label: string; hours: number; count: number }[]>([]);

    const load = useCallback(async () => {
        try {
            const res = await authFetch('/api/tasks?filter=all');
            const tasks: any[] = await res.json();
            if (!Array.isArray(tasks)) return;
            const map: Record<string, { h: number; c: number }> = {};
            const days: string[] = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(); d.setDate(d.getDate() - i);
                const k = d.toLocaleDateString('en-CA');
                days.push(k);
                map[k] = { h: 0, c: 0 };
            }
            tasks.forEach(t => {
                const k = (t.work_date || t.created_at || t.started_at || '').slice(0, 10);
                if (map[k] !== undefined) {
                    map[k].h += (t.total_duration || 0) / 3600;
                    map[k].c += 1;
                }
            });
            const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            setData(days.map(k => {
                const d = new Date(k);
                return { label: wd[d.getDay()], hours: Math.round(map[k].h * 10) / 10, count: map[k].c };
            }));
        } catch {}
    }, [authFetch]);

    useEffect(() => { load(); }, [load, pathname]);
    useEffect(() => {
        load();
        const id = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 10000);
        const onRefresh = () => load();
        window.addEventListener('stats-refresh', onRefresh);
        const onVis = () => { if (document.visibilityState === 'visible') load(); };
        document.addEventListener('visibilitychange', onVis);
        return () => { clearInterval(id); window.removeEventListener('stats-refresh', onRefresh); document.removeEventListener('visibilitychange', onVis); };
    }, [load]);

    const maxH = Math.max(1, ...data.map(d => d.hours));
    const maxC = Math.max(1, ...data.map(d => d.count));

    return (
        <div className="mini-chart-card">
            <div className="mini-chart-header">
                <h3><i className="fas fa-chart-column"></i> Weekly Activity</h3>
                <span>Last 7 days</span>
            </div>
            <div className="mini-chart-bars">
                {data.map((d, i) => (
                    <div key={i} className="mini-bar-wrap">
                        <div className="mini-bar-col">
                            <div className="mini-bar" style={{ height: `${Math.max(6, (d.hours / maxH) * 72)}px` }} title={`${d.hours}h · ${d.count} tasks`}>
                                <span className="mini-bar-val">{d.hours > 0 ? `${d.hours}h` : ''}</span>
                            </div>
                        </div>
                        <span className="mini-bar-label">{d.label}</span>
                        <span className="mini-bar-count">{d.count > 0 ? `${d.count}` : '—'}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
