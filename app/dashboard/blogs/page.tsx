'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

export default function AllPostsPage(){
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [q, setQ] = useState('');

  useEffect(()=>{ if(!loading && !user) router.replace('/auth'); },[user,loading,router]);
  useEffect(()=>{ if(user) load(); },[user]);
  const load = async ()=>{ try{ const r=await authFetch('/api/blogs?mine=1'); const d=await r.json(); if(Array.isArray(d)) setPosts(d);}catch{} };
  const del = async (slug:string)=>{ if(!confirm('Delete "'+slug+'"?'))return; await authFetch(`/api/blogs/${slug}`,{method:'DELETE'}); load(); };

  const filtered = posts.filter(p=> !q || String(p.title).toLowerCase().includes(q.toLowerCase()) || String(p.category).toLowerCase().includes(q.toLowerCase()));

  if(loading) return <div className="loading-screen"><div className="loading-spinner"/></div>;
  if(!user) return null;

  return (
    <>
      <Header />
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-main">
          <div className="page-header">
            <div><h1 className="page-title"><i className="fas fa-blog" style={{color:'var(--primary)'}}/> All Posts</h1><p className="page-subtitle">{filtered.length} posts — right side table</p></div>
            <div className="page-header-actions">
              <button className="btn-secondary" onClick={()=> router.push('/blog')}><i className="fas fa-eye"/> View Blog</button>
              <button className="btn-primary" onClick={()=> router.push('/dashboard/blogs/new')}><i className="fas fa-plus"/> New Post</button>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{ display:'flex', gap:10, marginBottom:12 }}>
                <input className="form-control" placeholder="Search title / category..." value={q} onChange={e=> setQ(e.target.value)} style={{ maxWidth:320 }} />
                <button className="btn-secondary" onClick={load}><i className="fas fa-rotate"/> Refresh</button>
              </div>

              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ borderBottom:'2px solid var(--gray-200)', textAlign:'left' }}>
                      <th style={{ padding:'10px 12px' }}>Post</th>
                      <th style={{ padding:'10px 12px' }}>Category</th>
                      <th style={{ padding:'10px 12px' }}>Focus Keyword</th>
                      <th style={{ padding:'10px 12px' }}>Status</th>
                      <th style={{ padding:'10px 12px' }}>Date</th>
                      <th style={{ padding:'10px 12px', textAlign:'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p:any)=> {
                      const focus = (p.slug||'').split('-').join(' ');
                      return (
                        <tr key={p.slug} style={{ borderBottom:'1px solid var(--gray-100)' }}>
                          <td style={{ padding:'10px 12px', maxWidth:320 }}>
                            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                              {String(p.image).startsWith('http') ? <img src={String(p.image)} alt={p.title} style={{ width:36, height:36, borderRadius:8, objectFit:'cover', border:'1px solid var(--gray-200)' }} /> : <div style={{ width:36, height:36, borderRadius:8, background:'var(--primary-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>{p.image}</div>}
                              <div style={{ minWidth:0 }}>
                                <div style={{ fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:240 }}>{p.title}</div>
                                <div style={{ fontSize:11, color:'var(--gray-500)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:240 }}>{p.excerpt?.slice(0,60)}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:'10px 12px' }}><span style={{ background:'var(--gray-100)', padding:'4px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>{p.category}</span></td>
                          <td style={{ padding:'10px 12px' }}><span style={{ fontSize:11, color:'var(--primary)', background:'var(--primary-light)', padding:'4px 8px', borderRadius:20, fontWeight:600 }}>{focus}</span></td>
                          <td style={{ padding:'10px 12px' }}><span style={{ padding:'4px 8px', borderRadius:20, fontSize:11, fontWeight:700, background: p.published ? 'var(--success-light)' : '#fef3c7', color: p.published ? 'var(--success)' : '#d97706' }}>{p.published ? 'Published' : 'Draft'}</span></td>
                          <td style={{ padding:'10px 12px', fontSize:12, color:'var(--gray-500)' }}>{String(p.date||p.created_at||'').slice(0,10)}</td>
                          <td style={{ padding:'10px 12px', textAlign:'right', whiteSpace:'nowrap' }}>
                            <button className="btn-secondary" style={{ padding:'6px 8px', fontSize:12, marginRight:4 }} onClick={()=> router.push(`/blog/${p.slug}`)} title="View"><i className="fas fa-eye"/></button>
                            <button className="btn-secondary" style={{ padding:'6px 8px', fontSize:12, marginRight:4 }} onClick={()=> router.push(`/dashboard/blogs/new?edit=${p.slug}`)} title="Edit"><i className="fas fa-pen"/></button>
                            <button className="btn-secondary" style={{ padding:'6px 8px', fontSize:12, color:'var(--danger)', borderColor:'var(--danger-light)' }} onClick={()=> del(p.slug)} title="Delete"><i className="fas fa-trash"/></button>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length===0 && <tr><td colSpan={6} style={{ padding:24, textAlign:'center', color:'var(--gray-400)' }}>No posts found — <button className="btn-primary" style={{ marginLeft:8 }} onClick={()=> router.push('/dashboard/blogs/new')}>Create New Post</button></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
