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

    const [todayCount, setTodayCount] = useState(0);
    const [todayHours, setTodayHours] = useState('00h 00m');
    const [todayEarnings, setTodayEarnings] = useState(0);

    const [weekCount, setWeekCount] = useState(0);
    const [weekEarnings, setWeekEarnings] = useState(0);

    const [monthCount, setMonthCount] = useState(0);
    const [monthEarnings, setMonthEarnings] = useState(0);

    const [totalCount, setTotalCount] = useState(0);
    const [totalEarnings, setTotalEarnings] = useState(0);

    const loadStats = useCallback(async () => {
        try {
            const [statsRes, countRes] = await Promise.all([
                authFetch('/api/stats/today'),
                authFetch('/api/stats/count'),
            ]);
            const stats = await statsRes.json();
            const countData = await countRes.json();

            if (stats.error) {
                console.error('Stats error:', stats.error);
                return;
            }

            setTodayCount(Number(stats.today?.count) || 0);
            setTodayHours(formatDurationShortLong(Number(stats.today?.totalDuration) || 0));
            setTodayEarnings(Math.round(Number(stats.today?.totalEarnings) || 0));

            setWeekCount(Number(stats.week?.count) || 0);
            setWeekEarnings(Math.round(Number(stats.week?.totalEarnings) || 0));

            setMonthCount(Number(stats.month?.count) || 0);
            setMonthEarnings(Math.round(Number(stats.month?.totalEarnings) || 0));

            setTotalCount(Number(countData.count) || 0);
            setTotalEarnings(Math.round(Number(stats.total?.totalEarnings) || 0));
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
                        <div className="summary-icon tasks"><i className="fas fa-check-circle"></i></div>
                        <div className="summary-label">Tasks</div>
                        <div className="summary-value">{todayCount}</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon time"><i className="fas fa-clock"></i></div>
                        <div className="summary-label">Hours</div>
                        <div className="summary-value">{todayHours}</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon earnings"><i className="fas fa-bangladeshi-taka-sign"></i></div>
                        <div className="summary-label">Earnings</div>
                        <div className="summary-value">৳{todayEarnings}</div>
                    </div>
                </div>
            </div>

            <div className="stats-section">
                <div className="stats-section-title">This Week</div>
                <div className="stats-row">
                    <div className="summary-card">
                        <div className="summary-icon tasks"><i className="fas fa-check-circle"></i></div>
                        <div className="summary-label">Tasks</div>
                        <div className="summary-value">{weekCount}</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon earnings"><i className="fas fa-bangladeshi-taka-sign"></i></div>
                        <div className="summary-label">Earnings</div>
                        <div className="summary-value">৳{weekEarnings}</div>
                    </div>
                </div>
            </div>

            <div className="stats-section">
                <div className="stats-section-title">This Month</div>
                <div className="stats-row">
                    <div className="summary-card">
                        <div className="summary-icon tasks"><i className="fas fa-check-circle"></i></div>
                        <div className="summary-label">Tasks</div>
                        <div className="summary-value">{monthCount}</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon earnings"><i className="fas fa-bangladeshi-taka-sign"></i></div>
                        <div className="summary-label">Earnings</div>
                        <div className="summary-value">৳{monthEarnings}</div>
                    </div>
                </div>
            </div>

            <div className="stats-section">
                <div className="stats-section-title">Total</div>
                <div className="stats-row">
                    <div className="summary-card">
                        <div className="summary-icon tasks"><i className="fas fa-check-circle"></i></div>
                        <div className="summary-label">Tasks</div>
                        <div className="summary-value">{totalCount}</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon earnings"><i className="fas fa-bangladeshi-taka-sign"></i></div>
                        <div className="summary-label">Earnings</div>
                        <div className="summary-value">৳{totalEarnings}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
