'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function formatHours(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

interface StatsData {
    totalDuration: number;
    totalEarnings: number;
    count: number;
}

export default function SummaryCards({ refreshKey, currentSessionSeconds }: { refreshKey: number; currentSessionSeconds: number }) {
    const { authFetch } = useAuth();
    const pathname = usePathname();
    const [range, setRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');

    const [today, setToday] = useState<StatsData>({ totalDuration: 0, totalEarnings: 0, count: 0 });
    const [yesterday, setYesterday] = useState<StatsData>({ totalDuration: 0, totalEarnings: 0, count: 0 });
    const [week, setWeek] = useState<StatsData>({ totalDuration: 0, totalEarnings: 0, count: 0 });
    const [month, setMonth] = useState<StatsData>({ totalDuration: 0, totalEarnings: 0, count: 0 });
    const [allTime, setAllTime] = useState<StatsData>({ totalDuration: 0, totalEarnings: 0, count: 0 });

    const loadStats = useCallback(async () => {
        try {
            const [statsRes, countRes] = await Promise.all([
                authFetch('/api/stats/today'),
                authFetch('/api/stats/count'),
            ]);
            const stats = await statsRes.json();
            const countData = await countRes.json();

            if (stats.error) return;

            setToday({
                totalDuration: Number(stats.today?.totalDuration) || 0,
                totalEarnings: Math.round(Number(stats.today?.totalEarnings) || 0),
                count: Number(stats.today?.count) || 0,
            });
            setYesterday({
                totalDuration: Number(stats.yesterday?.totalDuration) || 0,
                totalEarnings: Math.round(Number(stats.yesterday?.totalEarnings) || 0),
                count: Number(stats.yesterday?.count) || 0,
            });
            setWeek({
                totalDuration: Number(stats.week?.totalDuration) || 0,
                totalEarnings: Math.round(Number(stats.week?.totalEarnings) || 0),
                count: Number(stats.week?.count) || 0,
            });
            setMonth({
                totalDuration: Number(stats.month?.totalDuration) || 0,
                totalEarnings: Math.round(Number(stats.month?.totalEarnings) || 0),
                count: Number(stats.month?.count) || 0,
            });
            setAllTime({
                totalDuration: 0,
                totalEarnings: Math.round(Number(stats.total?.totalEarnings) || 0),
                count: Number(countData.count) || 0,
            });
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    }, [authFetch]);

    useEffect(() => {
        loadStats();
    }, [pathname]);

    useEffect(() => {
        loadStats();
        const interval = setInterval(() => { if (document.visibilityState === 'visible') loadStats(); }, 10000);
        const onRefresh = () => loadStats();
        window.addEventListener('stats-refresh', onRefresh);
        const onVisible = () => { if (document.visibilityState === 'visible') loadStats(); };
        document.addEventListener('visibilitychange', onVisible);
        return () => { clearInterval(interval); window.removeEventListener('stats-refresh', onRefresh); document.removeEventListener('visibilitychange', onVisible); };
    }, [loadStats, refreshKey]);

    const active = range === 'today' ? today : range === 'yesterday' ? yesterday : range === 'week' ? week : range === 'month' ? month : allTime;

    return (
        <div className="stats-section-modern">
            <div className="stats-tabs">
                {([
                    { key: 'today', label: 'Today', icon: 'fas fa-sun' },
                    { key: 'yesterday', label: 'Yesterday', icon: 'fas fa-moon' },
                    { key: 'week', label: 'Weekly', icon: 'fas fa-calendar-week' },
                    { key: 'month', label: 'Monthly', icon: 'fas fa-calendar' },
                    { key: 'all', label: 'All Time', icon: 'fas fa-infinity' },
                ] as const).map(opt => (
                    <button key={opt.key}
                        className={`stats-tab ${range === opt.key ? 'active' : ''}`}
                        onClick={() => setRange(opt.key)}>
                        <i className={opt.icon}></i>
                        <span>{opt.label}</span>
                    </button>
                ))}
            </div>
            <div className="stats-cards-grid">
                <div className="stats-card tasks-card">
                    <div className="stats-card-icon">
                        <i className="fas fa-list-check"></i>
                    </div>
                    <div className="stats-card-content">
                        <div className="stats-card-value">{active.count}</div>
                        <div className="stats-card-label">Tasks Done</div>
                    </div>
                </div>
                <div className="stats-card hours-card">
                    <div className="stats-card-icon">
                        <i className="fas fa-clock"></i>
                    </div>
                    <div className="stats-card-content">
                        <div className="stats-card-value">{formatHours(active.totalDuration)}</div>
                        <div className="stats-card-label">Hours Worked</div>
                    </div>
                </div>
                <div className="stats-card earnings-card">
                    <div className="stats-card-icon">
                        <i className="fas fa-bangladeshi-taka-sign"></i>
                    </div>
                    <div className="stats-card-content">
                        <div className="stats-card-value">৳{active.totalEarnings}</div>
                        <div className="stats-card-label">Earnings</div>
                    </div>
                </div>
                <div className="stats-card session-card">
                    <div className="stats-card-icon">
                        <i className="fas fa-play"></i>
                    </div>
                    <div className="stats-card-content">
                        <div className="stats-card-value">{formatHours(currentSessionSeconds)}</div>
                        <div className="stats-card-label">Current Session</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
