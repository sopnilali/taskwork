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

    const loadStats = useCallback(async () => {
        try {
            const [todayRes, countRes] = await Promise.all([
                authFetch('/api/stats/today'),
                authFetch('/api/stats/count'),
            ]);
            const todayData = await todayRes.json();
            const countData = await countRes.json();
            setTodayTotal(formatDurationShortLong(todayData.totalDuration));
            setCompletedCount(countData.count);
            setTodayEarnings(Math.round(todayData.totalEarnings || 0));
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
        <div className="summary-cards">
            <div className="summary-card">
                <div className="summary-icon time">
                    <i className="fas fa-clock"></i>
                </div>
                <div className="summary-label">Today&apos;s Total</div>
                <div className="summary-value">{todayTotal}</div>
            </div>
            <div className="summary-card">
                <div className="summary-icon tasks">
                    <i className="fas fa-check-circle"></i>
                </div>
                <div className="summary-label">Completed Tasks</div>
                <div className="summary-value">{completedCount}</div>
            </div>
            <div className="summary-card">
                <div className="summary-icon earnings">
                    <i className="fas fa-bangladeshi-taka-sign"></i>
                </div>
                <div className="summary-label">Today&apos;s Earnings</div>
                <div className="summary-value">৳{todayEarnings}</div>
            </div>
        </div>
    );
}
