'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            router.replace(user ? '/dashboard' : '/auth');
        }
    }, [user, loading, router]);

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div className="auth-logo" style={{ width: 64, height: 64 }}>
                <i className="fas fa-clock" style={{ fontSize: 28 }}></i>
            </div>
        </div>
    );
}
