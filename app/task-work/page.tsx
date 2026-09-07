'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import TimerCard from '@/components/TimerCard';

export default function TaskWorkPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!loading && !user) router.replace('/auth');
    }, [user, loading, router]);

    const onTaskSaved = useCallback(() => {
        setRefreshKey(k => k + 1);
        window.dispatchEvent(new CustomEvent('stats-refresh'));
    }, []);

    if (loading) return <div className="loading-screen"><div className="loading-logo"><i className="fas fa-clock"></i></div><div className="loading-spinner"></div><p>Loading...</p></div>;
    if (!user) return null;

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                <Sidebar />
                <div className="dashboard-main task-work-main">
                    <div className="page-header minimal">
                        <h1 className="page-title"><i className="fas fa-clock"></i> Task Work</h1>
                        <p className="page-subtitle">Start timer, stay focused, and save your work</p>
                    </div>
                    <div className="task-work-wrapper">
                        <TimerCard onTaskSaved={onTaskSaved} onSessionUpdate={() => {}} />
                    </div>
                </div>
            </div>
        </>
    );
}
