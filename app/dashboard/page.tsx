'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SummaryCards from '@/components/SummaryCards';
import MiniActivityChart from '@/components/MiniActivityChart';
import ActivityPanel from '@/components/ActivityPanel';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [refreshKey] = useState(0);
    const [currentSessionSeconds] = useState(0);
    useEffect(() => {
        if (!loading && !user) router.replace('/auth');
    }, [user, loading, router]);

    if (loading || !user) return null;

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                <Sidebar />
                <div className="dashboard-main">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title"><i className="fas fa-table-columns"></i> Dashboard</h1>
                            <p className="page-subtitle">Welcome back, {user.username} — here&apos;s your overview</p>
                        </div>
                        <div className="page-header-actions">
                            <button className="btn-primary" onClick={() => router.push('/task-work')}><i className="fas fa-play"></i> Start Working</button>
                            <button className="btn-secondary" onClick={() => router.push('/task-list')}><i className="fas fa-list"></i> View Tasks</button>
                        </div>
                    </div>
                    <SummaryCards refreshKey={refreshKey} currentSessionSeconds={currentSessionSeconds} />
                    <MiniActivityChart />
                    <div className="dashboard-overview-grid">
                        <div className="overview-card">
                            <div className="overview-card-icon"><i className="fas fa-bolt"></i></div>
                            <h3>Quick Start</h3>
                            <p>Go to Task Work to start timer and track your work instantly</p>
                            <button className="overview-card-btn" onClick={() => router.push('/task-work')}>Go to Task Work →</button>
                        </div>
                        <div className="overview-card activity-preview">
                            <div className="overview-card-head">
                                <div className="overview-card-icon list"><i className="fas fa-list-check"></i></div>
                                <div>
                                    <h3>Your Tasks</h3>
                                    <p style={{ marginBottom: 0 }}>Activity Log</p>
                                </div>
                                <button className="overview-card-link" onClick={() => router.push('/task-list')}>View all →</button>
                            </div>
                            <div className="your-tasks-activity">
                                <ActivityPanel refreshKey={refreshKey} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
