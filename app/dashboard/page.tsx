'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import TimerCard from '@/components/TimerCard';
import SummaryCards from '@/components/SummaryCards';
import ActivityPanel from '@/components/ActivityPanel';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);
    const [currentSessionSeconds, setCurrentSessionSeconds] = useState(0);

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/auth');
        }
    }, [user, loading, router]);

    const onTaskSaved = useCallback(() => {
        setRefreshKey(k => k + 1);
    }, []);

    const onSessionUpdate = useCallback((seconds: number) => {
        setCurrentSessionSeconds(seconds);
    }, []);

    if (loading || !user) return null;

    return (
        <>
            <Header />
            <div className="main-container">
                <SummaryCards refreshKey={refreshKey} currentSessionSeconds={currentSessionSeconds} />
                <div className="dashboard-grid" style={{ marginTop: 16 }}>
                    <div className="left-panel">
                        <TimerCard onTaskSaved={onTaskSaved} onSessionUpdate={onSessionUpdate} />
                    </div>
                    <ActivityPanel refreshKey={refreshKey} />
                </div>
            </div>
        </>
    );
}
