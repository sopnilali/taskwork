'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(true);
    const isDashboard = pathname === '/dashboard';
    const isTaskWork = pathname === '/task-work';
    const isTaskList = pathname === '/task-list';
    const isPayout = pathname === '/payout';

    return (
        <aside className="dashboard-sidebar">
            <div className="sidebar-menu">
                <button className={`sidebar-nav-item ${isDashboard ? 'active' : ''}`} onClick={() => router.push('/dashboard')}>
                    <i className="fas fa-table-columns"></i> Dashboard
                </button>
                <button className={`sidebar-item ${open ? 'open' : ''}`} onClick={() => setOpen(v => !v)}>
                    <span className="sidebar-item-left">
                        <i className="fas fa-layer-group"></i> Task
                    </span>
                    <i className={`fas fa-chevron-down sidebar-chevron ${open ? 'rotated' : ''}`}></i>
                </button>
                {open && (
                    <div className="sidebar-submenu">
                        <button className={`sidebar-subitem ${isTaskWork ? 'active' : ''}`} onClick={() => router.push('/task-work')}>
                            <i className="fas fa-clock"></i> Task Work
                        </button>
                        <button className={`sidebar-subitem ${isTaskList ? 'active' : ''}`} onClick={() => router.push('/task-list')}>
                            <i className="fas fa-list-check"></i> Task List
                        </button>
                    </div>
                )}
                <button className={`sidebar-nav-item ${isPayout ? 'active' : ''}`} onClick={() => router.push('/payout')} style={{ marginTop: 8 }}>
                    <i className="fas fa-money-bill-wave"></i> Payout
                </button>
            </div>
        </aside>
    );
}
