'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const isAdmin = Boolean(user?.is_admin);
    const [open, setOpen] = useState(true);
    const [blogOpen, setBlogOpen] = useState(true);
    const isDashboard = pathname === '/dashboard';
    const isTaskWork = pathname === '/task-work';
    const isTaskList = pathname === '/task-list';
    const isPayout = pathname === '/payout';
    const isBlog = pathname?.startsWith('/blog');

    return (
        <aside className="dashboard-sidebar">
            <div className="sidebar-menu">
                <button className={`sidebar-nav-item ${isDashboard ? 'active' : ''}`} onClick={() => router.push('/dashboard')}>
                    <i className="fas fa-table-columns"></i> {isAdmin ? 'Dashboard' : 'My Dashboard'}
                </button>

                {isAdmin && (
                <>
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
                </>
                )}

                <button className={`sidebar-item ${blogOpen ? 'open' : ''}`} onClick={() => setBlogOpen(v => !v)} style={{ marginTop: 8 }}>
                    <span className="sidebar-item-left">
                        <i className="fas fa-blog"></i> Blog
                    </span>
                    <i className={`fas fa-chevron-down sidebar-chevron ${blogOpen ? 'rotated' : ''}`}></i>
                </button>
                {blogOpen && (
                    <div className="sidebar-submenu">
                        <button className={`sidebar-subitem ${pathname === '/dashboard/blogs' ? 'active' : ''}`} onClick={() => router.push('/dashboard/blogs')}>
                            <i className="fas fa-table"></i> All Posts
                        </button>
                        <button className={`sidebar-subitem ${pathname === '/dashboard/blogs/new' ? 'active' : ''}`} onClick={() => router.push('/dashboard/blogs/new')}>
                            <i className="fas fa-plus"></i> New Post
                        </button>
                        <button className={`sidebar-subitem ${isBlog ? 'active' : ''}`} onClick={() => router.push('/blog')}>
                            <i className="fas fa-eye"></i> View Blog
                        </button>
                    </div>
                )}

                {isAdmin && (
                <>
                <button className={`sidebar-nav-item ${isPayout ? 'active' : ''}`} onClick={() => router.push('/payout')} style={{ marginTop: 8 }}>
                    <i className="fas fa-money-bill-wave"></i> Payout
                </button>
                <button className={`sidebar-nav-item ${pathname?.startsWith('/admin') ? 'active' : ''}`} onClick={() => router.push('/admin')} style={{ marginTop: 8 }}>
                    <i className="fas fa-shield-halved"></i> Admin Panel
                </button>
                </>
                )}
            </div>
            {!isAdmin && (
              <div style={{ marginTop:16, padding:12, background:'var(--primary-light)', borderRadius:10, fontSize:11, color:'var(--primary)', fontWeight:600, textAlign:'center' }}>
                <i className="fas fa-user" style={{ marginRight:4 }}/> User Mode — Blog & Read only
              </div>
            )}
        </aside>
    );
}
