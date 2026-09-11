'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const nav = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
];

export default function PublicHeader() {
  const path = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--gray-200)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,var(--primary),#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}><i className="fas fa-clock" /></div>
          <span style={{ fontWeight: 800, color: 'var(--gray-900)', fontSize: 18 }}>TaskTimer</span>
          <span style={{ fontSize: 11, background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Free Timer</span>
        </Link>
        <nav style={{ display: 'flex', gap: 4 }} className="hide-mobile">
          {nav.map(n => (
            <Link key={n.href} href={n.href} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: path===n.href ? 'var(--primary)' : 'var(--gray-600)', background: path===n.href ? 'var(--primary-light)' : 'transparent', textDecoration: 'none' }}>{n.label}</Link>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href={user ? '/dashboard' : '/auth'} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, textDecoration: 'none' }}>{user ? 'Dashboard' : 'Start Free'}</Link>
          <button className="header-btn hide-desktop" onClick={()=> setOpen(v=>!v)}><i className="fas fa-bars" /></button>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid var(--gray-200)', padding: 12, display: 'flex', flexDirection: 'column', gap: 4, background: '#fff' }}>
          {nav.map(n=> <Link key={n.href} href={n.href} onClick={()=>setOpen(false)} style={{ padding: '10px 12px', borderRadius: 8, background: path===n.href ? 'var(--gray-100)' : '#fff', color: 'var(--gray-800)', textDecoration:'none', fontWeight:600, fontSize:14 }}>{n.label}</Link>)}
        </div>
      )}
      <style>{`@media(max-width:768px){.hide-mobile{display:none!important}}@media(min-width:769px){.hide-desktop{display:none!important}}`}</style>
    </header>
  );
}
