'use client';

import { useEffect, useState, useCallback } from 'react';
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
    const [range, setRange] = useState<'today' | 'week' | 'month' | 'all'>('today');

    const [today, setToday] = useState<StatsData>({ totalDuration: 0, totalEarnings: 0, count: 0 });
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
        const interval = setInterval(loadStats, 15000);
        return () => clearInterval(interval);
    }, [loadStats, refreshKey]);

    const active = range === 'today' ? today : range === 'week' ? week : range === 'month' ? month : allTime;
    const rangeLabel = range === 'today' ? "Today" : range === 'week' ? "This Week" : range === 'month' ? "This Month" : "All Time";

    return (
        <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {([
                    { key: 'today', label: 'Today' },
                    { key: 'week', label: 'Weekly' },
                    { key: 'month', label: 'Monthly' },
                    { key: 'all', label: 'All Time' },
                ] as const).map(opt => (
                    <button key={opt.key}
                        className="btn-activity"
                        style={range === opt.key
                            ? { background: 'var(--primary)', color: '#fff', padding: '4px 14px', fontSize: 12 }
                            : { padding: '4px 14px', fontSize: 12 }}
                        onClick={() => setRange(opt.key)}>
                        {opt.label}
                    </button>
                ))}
            </div>
            <div className="summary-cards">
                <div className="summary-card">
                    <div className="summary-icon tasks">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="summary-label">{rangeLabel} — Tasks</div>
                    <div className="summary-value">{active.count}</div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon time">
                        <i className="fas fa-clock"></i>
                    </div>
                    <div className="summary-label">{rangeLabel} — Hours</div>
                    <div className="summary-value">{formatHours(active.totalDuration)}</div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon earnings">
                        <i className="fas fa-bangladeshi-taka-sign"></i>
                    </div>
                    <div className="summary-label">{rangeLabel} — Earnings</div>
                    <div className="summary-value">৳{active.totalEarnings}</div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon session">
                        <i className="fas fa-play-circle"></i>
                    </div>
                    <div className="summary-label">Current Session</div>
                    <div className="summary-value">{formatHours(currentSessionSeconds)}</div>
                </div>
            </div>
        </div>
    );
}
