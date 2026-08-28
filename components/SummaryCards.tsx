'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

function formatHours(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

export default function SummaryCards({ refreshKey }: { refreshKey: number }) {
    const { authFetch } = useAuth();

    const [todayTotal, setTodayTotal] = useState('00h 00m');
    const [todayEarnings, setTodayEarnings] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    const [currentSession, setCurrentSession] = useState('00h 00m');

    const loadStats = useCallback(async () => {
        try {
            const [statsRes, countRes] = await Promise.all([
                authFetch('/api/stats/today'),
                authFetch('/api/stats/count'),
            ]);
            const stats = await statsRes.json();
            const countData = await countRes.json();

            if (stats.error) return;

            setTodayTotal(formatHours(Number(stats.today?.totalDuration) || 0));
            setTodayEarnings(Math.round(Number(stats.today?.totalEarnings) || 0));
            setCompletedCount(Number(stats.today?.count) || 0);
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
                <div className="summary-icon session">
                    <i className="fas fa-play-circle"></i>
                </div>
                <div className="summary-label">Current Session</div>
                <div className="summary-value">{currentSession}</div>
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
