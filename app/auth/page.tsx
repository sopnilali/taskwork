'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AuthForm from '@/components/AuthForm';

export default function AuthPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);

    if (loading) return <div className="loading-screen"><div className="loading-logo"><i className="fas fa-clock"></i></div><div className="loading-spinner"></div><p>Loading...</p></div>;
    if (user) return <div className="loading-screen"><div className="loading-logo"><i className="fas fa-clock"></i></div><div className="loading-spinner"></div><p>Taking you to dashboard...</p></div>;

    return <AuthForm />;
}
