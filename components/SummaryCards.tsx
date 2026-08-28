'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

function formatDurationShortLong(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

export default function SummaryCards({ refreshKey }: { refreshKey: number }) {
    const { authFetch } = useAuth();
    const [todayTotal, setTodayTotal] = useState('00h 00m');
    const [completedCount, setCompletedCount] = useState(0);
    const [todayEarnings, setTodayEarnings] = useState(0);
    const [weekCount, setWeekCount] = useState(0);
    const [weekEarnings, setWeekEarnings] = useState(0);
    const [monthCount, setMonthCount] = useState(0);
    const [monthEarnings, setMonthEarnings] = useState(0);

    const loadStats = useCallback(async () => {
        try {
            const [statsRes, countRes] = await Promise.all([
                authFetch('/api/stats/today'),
                authFetch('/api/stats/count'),
            ]);
            const stats = await statsRes.json();
            const countData = await countRes.json();

            setTodayTotal(formatDurationShortLong(stats.today.totalDuration));
            setTodayEarnings(Math.round(stats.today.totalEarnings || 0));
            setCompletedCount(countData.count);
            setWeekCount(stats.week.count || 0);
            setWeekEarnings(Math.round(stats.week.totalEarnings || 0));
            setMonthCount(stats.month.count || 0);
            setMonthEarnings(Math.round(stats.month.totalEarnings || 0));
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    }, [authFetch]);

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 15000);
        return () => clearInterval(interval);
    }, [loadStats, refreshKey]);

    return (
        <div className="stats-grid">
            <div className="stats-section">
                <div className="stats-section-title">Today</div>
                <div className="stats-row">
                    <div className="summary-card">
                        <div className="summary-icon time">
                            <i className="fas fa-clock"></i>
                        </div>
                        <div className="summary-label">Total Time</div>
                        <div className="summary-value">{todayTotal}</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon earnings">
                            <i className="fas fa-bangladeshi-taka-sign"></i>
                        </div>
                        <div className="summary-label">Earnings</div>
                        <div className="summary-value">৳{todayEarnings}</div>
                    </div>
                </div>
            </div>

            <div className="stats-section">
                <div className="stats-section-title">This Week</div>
                <div className="stats-row">
                    <div className="summary-card">
                        <div className="summary-icon tasks">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <div className="summary-label">Tasks</div>
                        <div className="summary-value">{weekCount}</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon earnings">
                            <i className="fas fa-bangladeshi-taka-sign"></i>
                        </div>
                        <div className="summary-label">Earnings</div>
                        <div className="summary-value">৳{weekEarnings}</div>
                    </div>
                </div>
            </div>

            <div className="stats-section">
                <div className="stats-section-title">This Month</div>
                <div className="stats-row">
                    <div className="summary-card">
                        <div className="summary-icon tasks">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <div className="summary-label">Tasks</div>
                        <div className="summary-value">{monthCount}</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon earnings">
                            <i className="fas fa-bangladeshi-taka-sign"></i>
                        </div>
                        <div className="summary-label">Earnings</div>
                        <div className="summary-value">৳{monthEarnings}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
