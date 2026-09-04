'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ActivityPanel from '@/components/ActivityPanel';

export default function TaskListPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [refreshKey] = useState(0);

    useEffect(() => {
        if (!loading && !user) router.replace('/auth');
    }, [user, loading, router]);

    if (loading || !user) return null;

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                <Sidebar />
                <div className="dashboard-main task-list-main">
                    <div className="page-header minimal">
                        <h1 className="page-title"><i className="fas fa-list-check"></i> Task List</h1>
                        <p className="page-subtitle">All your completed tasks — filter, search and manage</p>
                    </div>
                    <div className="task-list-wrapper">
                        <ActivityPanel refreshKey={refreshKey} />
                    </div>
                </div>
            </div>
        </>
    );
}
